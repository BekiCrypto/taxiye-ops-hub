
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CallCenterUser {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'supervisor' | 'admin';
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CallCenterAuthProps {
  onLogin: (user: CallCenterUser) => void;
}

const CallCenterAuth = ({ onLogin }: CallCenterAuthProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if user exists in call_center_users
      const { data: callCenterUser, error: userError } = await supabase
        .from('call_center_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !callCenterUser) {
        setError('Access denied. Contact administrator for call center access.');
        return;
      }

      // Update last login
      await supabase
        .from('call_center_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', callCenterUser.id);

      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: callCenterUser.id,
          activity_type: 'login',
          details: { email, timestamp: new Date().toISOString() }
        });

      // Store in localStorage for session persistence
      localStorage.setItem('call_center_user', JSON.stringify(callCenterUser));
      
      // Ensure user_id, created_at, and updated_at are present for the interface
      const userWithId = {
        ...callCenterUser,
        user_id: callCenterUser.id,
        created_at: callCenterUser.created_at || new Date().toISOString(),
        updated_at: callCenterUser.updated_at || new Date().toISOString()
      };
      
      onLogin(userWithId);
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${callCenterUser.name}!`
      });

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Call Center Access
          </CardTitle>
          <p className="text-gray-600">Enter your email to access the call center</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@company.com"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Accessing...' : 'Access Call Center'}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              Demo users: admin@callcenter.com (Admin) | agent@company.com (Agent)
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallCenterAuth;
