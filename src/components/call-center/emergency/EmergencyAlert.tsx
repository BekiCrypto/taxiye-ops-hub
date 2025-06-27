
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmergencyAlertProps {
  pendingCount: number;
}

const EmergencyAlert = ({ pendingCount }: EmergencyAlertProps) => {
  if (pendingCount === 0) return null;

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        {pendingCount} emergency escalation(s) require immediate attention!
      </AlertDescription>
    </Alert>
  );
};

export default EmergencyAlert;
