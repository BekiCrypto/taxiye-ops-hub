
import React, { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import EmergencyAlert from './emergency/EmergencyAlert';
import OtpVerificationCard from './emergency/OtpVerificationCard';
import EscalationCard from './emergency/EscalationCard';
import UrgentTicketCard from './emergency/UrgentTicketCard';
import { useEscalations, useUrgentTickets } from './emergency/hooks/useEscalations';
import { useEscalationActions } from './emergency/hooks/useEscalationActions';

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
  const [escalationReason, setEscalationReason] = useState('');

  const { data: escalations = [], refetch } = useEscalations(user.id);
  const { data: urgentTickets = [] } = useUrgentTickets();
  const { createEscalation, verifyOtp, resolveEscalation } = useEscalationActions(user.id, onStatsUpdate);

  const handleCreateEscalation = async (ticketId: string) => {
    const success = await createEscalation(ticketId, escalationReason);
    if (success) {
      setEscalationReason('');
      refetch();
    }
  };

  const handleVerifyOtp = async (escalationId: string, otpCode: string) => {
    const success = await verifyOtp(escalationId, otpCode);
    if (success) {
      setSelectedEscalation(null);
      refetch();
    }
  };

  const handleResolveEscalation = async (escalationId: string) => {
    const success = await resolveEscalation(escalationId);
    if (success) {
      refetch();
    }
  };

  const pendingEscalations = escalations.filter(e => e.status === 'pending');

  return (
    <div className="space-y-6">
      <EmergencyAlert pendingCount={pendingEscalations.length} />

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
                <EscalationCard
                  key={escalation.id}
                  escalation={escalation}
                  userRole={user.role}
                  onAcknowledge={setSelectedEscalation}
                  onResolve={handleResolveEscalation}
                />
              ))}
            </div>
          )}
        </div>

        {/* Urgent Tickets & Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Urgent Tickets Requiring Attention</h2>

          {selectedEscalation && (
            <OtpVerificationCard
              selectedEscalation={selectedEscalation}
              onVerify={handleVerifyOtp}
              onCancel={() => setSelectedEscalation(null)}
            />
          )}

          <div className="space-y-3">
            {urgentTickets.map((ticket) => (
              <UrgentTicketCard
                key={ticket.id}
                ticket={ticket}
                userRole={user.role}
                escalationReason={escalationReason}
                onEscalationReasonChange={setEscalationReason}
                onEscalate={handleCreateEscalation}
              />
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
