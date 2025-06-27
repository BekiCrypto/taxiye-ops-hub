
import React, { useState, useEffect } from 'react';
import CallCenterAuth from '@/components/call-center/CallCenterAuth';
import CallCenterDashboard from '@/components/call-center/CallCenterDashboard';

interface CallCenterUser {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'supervisor' | 'admin';
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

const CallCenterStandalone = () => {
  const [user, setUser] = useState<CallCenterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('call_center_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure user_id and created_at are present
        const userWithId = {
          ...parsedUser,
          user_id: parsedUser.user_id || parsedUser.id,
          created_at: parsedUser.created_at || new Date().toISOString()
        };
        setUser(userWithId);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('call_center_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (loggedInUser: CallCenterUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Call Center...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <CallCenterAuth onLogin={handleLogin} />;
  }

  return <CallCenterDashboard user={user} onLogout={handleLogout} />;
};

export default CallCenterStandalone;
