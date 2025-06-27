
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEscalations = (userId: string) => {
  return useQuery({
    queryKey: ['emergency-escalations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_escalations')
        .select(`
          *,
          support_tickets(subject, message, priority, driver_phone_ref),
          escalated_by_user:call_center_users!escalated_by(name, email),
          escalated_to_user:call_center_users!escalated_to(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching escalations:', error);
        return [];
      }

      return data?.map(escalation => ({
        ...escalation,
        timeAgo: calculateTimeAgo(escalation.created_at)
      })) || [];
    },
    refetchInterval: 10000
  });
};

export const useUrgentTickets = () => {
  return useQuery({
    queryKey: ['urgent-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          drivers(name, phone),
          rides(pickup_location, dropoff_location)
        `)
        .in('priority', ['urgent', 'high'])
        .in('status', ['open', 'in_progress'])
        .is('escalated_to', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching urgent tickets:', error);
        return [];
      }

      return data || [];
    },
    refetchInterval: 30000
  });
};

const calculateTimeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};
