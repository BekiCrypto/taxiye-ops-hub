
-- Create the admin_profiles table that the edge function expects
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operations_staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_profiles
CREATE POLICY "Users can view their own admin profile" 
  ON public.admin_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage admin profiles" 
  ON public.admin_profiles 
  FOR ALL 
  USING (true);

-- Insert the root admin profile
INSERT INTO public.admin_profiles (email, name, role, is_active)
VALUES ('admin@taxiye.com', 'Root Administrator', 'root_admin', true)
ON CONFLICT (email) DO NOTHING;
