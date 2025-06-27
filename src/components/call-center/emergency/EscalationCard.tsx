
import React from 'react';
import { AlertTriangle, Shield, Phone, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EscalationCardProps {
  escalation: any;
  userRole: string;
  onAcknowledge: (escalationId: string) => void;
  onResolve: (escalationId: string) => Promise<void>;
}

const EscalationCard = ({ escalation, userRole, onAcknowledge, onResolve }: EscalationCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
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
              Escalated by: {escalation.escalated_by_user?.name}
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
          {escalation.status === 'pending' && userRole !== 'agent' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(escalation.id)}
            >
              <Shield className="w-4 h-4 mr-1" />
              Acknowledge
            </Button>
          )}
          {escalation.status === 'acknowledged' && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onResolve(escalation.id)}
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
  );
};

export default EscalationCard;
