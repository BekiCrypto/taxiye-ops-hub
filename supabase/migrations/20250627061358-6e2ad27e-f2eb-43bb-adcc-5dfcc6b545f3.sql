
-- Create roles enum for call center access control
CREATE TYPE public.call_center_role AS ENUM ('agent', 'supervisor', 'admin');

-- Create call center users table for role-based access
CREATE TABLE public.call_center_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role call_center_role NOT NULL DEFAULT 'agent',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES call_center_users(id)
);

-- Create communication channels table
CREATE TABLE public.communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('voice', 'chat', 'email', 'whatsapp')),
  external_id TEXT, -- For Twilio call IDs, chat session IDs, etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'transferred')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  agent_id UUID REFERENCES call_center_users(id),
  driver_phone_ref TEXT,
  passenger_phone_ref TEXT,
  ride_id UUID REFERENCES rides(id)
);

-- Enhance support_tickets table with more fields
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES call_center_users(id),
ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES call_center_users(id),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'emergency', 'complaint')),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS communication_channel_id UUID REFERENCES communication_channels(id);

-- Create ticket responses table for conversation history
CREATE TABLE public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('agent', 'system', 'user')),
  sender_id UUID, -- call_center_users.id for agents, user_id for users
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- For internal agent notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create call recordings table
CREATE TABLE public.call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_channel_id UUID REFERENCES communication_channels(id),
  file_url TEXT,
  duration_seconds INTEGER,
  encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE -- For retention policies
);

-- Create agent activity logs
CREATE TABLE public.agent_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES call_center_users(id),
  activity_type TEXT CHECK (activity_type IN ('login', 'logout', 'call_start', 'call_end', 'ticket_assigned', 'ticket_resolved', 'escalation')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create emergency escalations table
CREATE TABLE public.emergency_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id),
  escalated_by UUID REFERENCES call_center_users(id),
  escalated_to UUID REFERENCES call_center_users(id),
  reason TEXT NOT NULL,
  otp_code TEXT,
  otp_verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default admin user
INSERT INTO public.call_center_users (email, name, role) 
VALUES ('admin@callcenter.com', 'Call Center Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE public.call_center_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_center_users
CREATE POLICY "Call center users can view active users" ON public.call_center_users
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all users" ON public.call_center_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.call_center_users 
      WHERE id = auth.uid()::text::uuid AND role = 'admin'
    )
  );

-- RLS Policies for communication_channels
CREATE POLICY "Agents can view their assigned channels" ON public.communication_channels
  FOR SELECT USING (
    agent_id = auth.uid()::text::uuid OR
    EXISTS (
      SELECT 1 FROM public.call_center_users 
      WHERE id = auth.uid()::text::uuid AND role IN ('supervisor', 'admin')
    )
  );

-- RLS Policies for support_tickets (update existing)
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Call center can manage tickets" ON public.support_tickets
  FOR ALL USING (
    assigned_agent_id = auth.uid()::text::uuid OR
    EXISTS (
      SELECT 1 FROM public.call_center_users 
      WHERE id = auth.uid()::text::uuid AND role IN ('supervisor', 'admin')
    )
  );

-- RLS Policies for ticket_responses
CREATE POLICY "Agents can manage responses for assigned tickets" ON public.ticket_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      JOIN public.call_center_users ccu ON st.assigned_agent_id = ccu.id
      WHERE st.id = ticket_id AND ccu.id = auth.uid()::text::uuid
    ) OR
    EXISTS (
      SELECT 1 FROM public.call_center_users 
      WHERE id = auth.uid()::text::uuid AND role IN ('supervisor', 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_support_tickets_assigned_agent ON public.support_tickets(assigned_agent_id);
CREATE INDEX idx_support_tickets_status_priority ON public.support_tickets(status, priority);
CREATE INDEX idx_communication_channels_agent ON public.communication_channels(agent_id);
CREATE INDEX idx_ticket_responses_ticket ON public.ticket_responses(ticket_id);
CREATE INDEX idx_agent_activity_logs_agent ON public.agent_activity_logs(agent_id);

-- Create function to auto-assign tickets based on workload
CREATE OR REPLACE FUNCTION public.auto_assign_ticket(ticket_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_agent_id UUID;
BEGIN
  -- Find agent with least active tickets
  SELECT ccu.id INTO available_agent_id
  FROM public.call_center_users ccu
  LEFT JOIN public.support_tickets st ON st.assigned_agent_id = ccu.id AND st.status IN ('open', 'in_progress')
  WHERE ccu.role = 'agent' AND ccu.is_active = true
  GROUP BY ccu.id
  ORDER BY COUNT(st.id) ASC, RANDOM()
  LIMIT 1;
  
  IF available_agent_id IS NOT NULL THEN
    UPDATE public.support_tickets 
    SET assigned_agent_id = available_agent_id, updated_at = now()
    WHERE id = ticket_id_param;
  END IF;
  
  RETURN available_agent_id;
END;
$$;
