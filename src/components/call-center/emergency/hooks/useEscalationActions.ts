
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useEscalationActions = (userId: string, onStatsUpdate: () => void) => {
  const { toast } = useToast();

  const createEscalation = async (ticketId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for escalation.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      const { error: escalationError } = await supabase
        .from('emergency_escalations')
        .insert({
          ticket_id: ticketId,
          escalated_by: userId,
          escalated_to: null,
          reason: reason,
          otp_code: generatedOtp,
          status: 'pending'
        });

      if (escalationError) throw escalationError;

      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          priority: 'urgent',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: userId,
          activity_type: 'escalation',
          details: { 
            ticket_id: ticketId, 
            reason: reason,
            otp: generatedOtp,
            timestamp: new Date().toISOString() 
          }
        });

      toast({
        title: 'Emergency Escalated',
        description: `OTP Code: ${generatedOtp} - Share this with the emergency team.`
      });

      onStatsUpdate();
      return true;
    } catch (error) {
      console.error('Error creating escalation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create escalation.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const verifyOtp = async (escalationId: string, otpCode: string) => {
    if (!otpCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP code.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('emergency_escalations')
        .update({
          otp_verified_at: new Date().toISOString(),
          status: 'acknowledged',
          escalated_to: userId
        })
        .eq('id', escalationId)
        .eq('otp_code', otpCode);

      if (error) throw error;

      toast({
        title: 'OTP Verified',
        description: 'Emergency escalation has been acknowledged.'
      });

      onStatsUpdate();
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'Invalid OTP code or verification failed.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const resolveEscalation = async (escalationId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_escalations')
        .update({
          status: 'resolved'
        })
        .eq('id', escalationId);

      if (error) throw error;

      toast({
        title: 'Escalation Resolved',
        description: 'The emergency escalation has been marked as resolved.'
      });

      onStatsUpdate();
      return true;
    } catch (error) {
      console.error('Error resolving escalation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve escalation.',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    createEscalation,
    verifyOtp,
    resolveEscalation
  };
};
