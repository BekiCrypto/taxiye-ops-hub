
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface UrgentTicketCardProps {
  ticket: any;
  userRole: string;
  escalationReason: string;
  onEscalationReasonChange: (reason: string) => void;
  onEscalate: (ticketId: string) => Promise<void>;
}

const UrgentTicketCard = ({ 
  ticket, 
  userRole, 
  escalationReason, 
  onEscalationReasonChange, 
  onEscalate 
}: UrgentTicketCardProps) => {
  return (
    <Card className="border-orange-200">
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

        {userRole !== 'agent' && (
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for emergency escalation..."
              rows={2}
              value={escalationReason}
              onChange={(e) => onEscalationReasonChange(e.target.value)}
            />
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => onEscalate(ticket.id)}
              disabled={!escalationReason.trim()}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Escalate Emergency
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UrgentTicketCard;
