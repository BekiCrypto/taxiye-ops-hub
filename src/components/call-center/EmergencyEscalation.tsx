
import React, { useState } from 'react';
import { AlertTriangle, Shield, Phone, Clock, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CallCenterUser {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'supervisor' | 'admin';
  is_active: boolean;
}

interface EmergencyEscalationProps {
  user: CallCenterUser;
  onStatsUpdate: () => void;
}

const EmergencyEscalation = ({ user, onStatsUpdate }: EmergencyEscalationProps) => {
  const [selectedEscalation, setSelectedEscalation] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const { toast } = useToast();

  // Fetch emergency escalations
  const { data: escalations = [], refetch } = useQuery({
    queryKey: ['emergency-escalations', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_escalations')
        .select(`
          *,
          support_tickets(subject, message, priority, driver_phone_ref),
          call_center_users!escalated_by(name, email),
          call_center_users!escalated_to(name, email)
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
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch urgent tickets that might need escalation
  const { data: urgentTickets = [] } = useQuery({
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

  const calculateTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleCreateEscalation = async (ticketId: string) => {
    if (!escalationReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for escalation.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Generate OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Create escalation
      const { error: escalationError } = await supabase
        .from('emergency_escalations')
        .insert({
          ticket_id: ticketId,
          escalated_by: user.id,
          escalated_to: null, // Will be assigned by system or supervisor
          reason: escalationReason,
          otp_code: generatedOtp,
          status: 'pending'
        });

      if (escalationError) throw escalationError;

      // Update ticket
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          priority: 'urgent',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: user.id,
          activity_type: 'escalation',
          details: { 
            ticket_id: ticketId, 
            reason: escalationReason,
            otp: generatedOtp,
            timestamp: new Date().toISOString() 
          }
        });

      toast({
        title: 'Emergency Escalated',
        description: `OTP Code: ${generatedOtp} - Share this with the emergency team.`
      });

      setEscalationReason('');
      refetch();
      onStatsUpdate();
    } catch (error) {
      console.error('Error creating escalation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create escalation.',
        variant: 'destructive'
      });
    }
  };

  const handleVerifyOtp = async (escalationId: string) => {
    if (!otpCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP code.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Verify OTP and acknowledge escalation
      const { error } = await supabase
        .from('emergency_escalations')
        .update({
          otp_verified_at: new Date().toISOString(),
          status: 'acknowledged',
          escalated_to: user.id
        })
        .eq('id', escalationId)
        .eq('otp_code', otpCode);

      if (error) throw error;

      toast({
        title: 'OTP Verified',
        description: 'Emergency escalation has been acknowledged.'
      });

      setOtpCode('');
      setSelectedEscalation(null);
      refetch();
      onStatsUpdate();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'Invalid OTP code or verification failed.',
        variant: 'destructive'
      });
    }
  };

  const handleResolveEscalation = async (escalationId: string) => {
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

      refetch();
      onStatsUpdate();
    } catch (error) {
      console.error('Error resolving escalation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve escalation.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Alert */}
      {escalations.filter(e => e.status === 'pending').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {escalations.filter(e => e.status === 'pending').length} emergency escalation(s) require immediate attention!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Escalations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Escalations ({escalations.length})
          </h2>

          {escalations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No emergency escalations at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {escalations.map((escalation) => (
                <Card 
                  key={escalation.id}
                  className={`border-l-4 ${
                    escalation.status === 'pending' ? 'border-l-red-500' : 
                    escalation.status === 'acknowledged' ? 'border-l-yellow-500' : 
                    'border-l-green-500'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{escalation.support_tickets?.subject}</h4>
                        <p className="text-sm text-gray-600">
                          Escalated by: {escalation.call_center_users?.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(escalation.status)}>
                        {escalation.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      Reason: {escalation.reason}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {escalation.timeAgo}
                      </div>
                      {escalation.otp_code && escalation.status === 'pending' && (
                        <div className="flex items-center gap-1 text-red-600 font-mono">
                          <Shield className="w-3 h-3" />
                          OTP: {escalation.otp_code}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {escalation.status === 'pending' && user.role !== 'agent' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEscalation(escalation.id)}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {escalation.status === 'acknowledged' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleResolveEscalation(escalation.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Tickets & Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Urgent Tickets Requiring Attention</h2>

          {selectedEscalation && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">OTP Verification Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-yellow-700">
                  Enter the OTP code to acknowledge this emergency escalation:
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="font-mono"
                  />
                  <Button
                    onClick={() => handleVerifyOtp(selectedEscalation)}
                    disabled={otpCode.length !== 6}
                  >
                    Verify
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEscalation(null)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {urgentTickets.map((ticket) => (
              <Card key={ticket.id} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{ticket.subject}</h4>
                      <p className="text-sm text-gray-600">
                        Customer: {ticket.drivers?.name || 'Unknown'}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">
                      {ticket.priority}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {ticket.message}
                  </p>

                  {user.role !== 'agent' && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Reason for emergency escalation..."
                        rows={2}
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleCreateEscalation(ticket.id)}
                        disabled={!escalationReason.trim()}
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Escalate Emergency
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {urgentTickets.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500">No urgent tickets requiring escalation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyEscalation;
