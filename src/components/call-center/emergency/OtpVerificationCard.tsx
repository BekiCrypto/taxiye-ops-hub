
import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OtpVerificationCardProps {
  selectedEscalation: string;
  onVerify: (escalationId: string, otpCode: string) => Promise<void>;
  onCancel: () => void;
}

const OtpVerificationCard = ({ selectedEscalation, onVerify, onCancel }: OtpVerificationCardProps) => {
  const [otpCode, setOtpCode] = useState('');

  const handleVerify = async () => {
    await onVerify(selectedEscalation, otpCode);
    setOtpCode('');
  };

  return (
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
            onClick={handleVerify}
            disabled={otpCode.length !== 6}
          >
            Verify
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
};

export default OtpVerificationCard;
