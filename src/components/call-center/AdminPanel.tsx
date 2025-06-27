
import React, { useState } from 'react';
import { Users, Shield, Settings, UserPlus, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface AdminPanelProps {
  user: CallCenterUser;
}

const AdminPanel = ({ user }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('users');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'agent' | 'supervisor' | 'admin'>('agent');
  const { toast } = useToast();

  // Fetch all call center users
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['call-center-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_center_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data || [];
    }
  });

  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_activity_logs')
        .select(`
          *,
          call_center_users!agent_id(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
      }

      return data || [];
    }
  });

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('call_center_users')
        .insert({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'User Created',
        description: `${newUserName} has been added as a ${newUserRole}.`
      });

      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('agent');
      refetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('call_center_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'User Updated',
        description: `User has been ${!currentStatus ? 'activated' : 'deactivated'}.`
      });

      refetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <Badge variant="outline">
          Total Users: {users.length}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={(value: 'agent' | 'supervisor' | 'admin') => setNewUserRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateUser}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Existing Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((callCenterUser) => (
                  <div key={callCenterUser.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{callCenterUser.name}</span>
                        <Badge className={getRoleBadgeColor(callCenterUser.role)}>
                          {callCenterUser.role}
                        </Badge>
                        <Badge variant={callCenterUser.is_active ? 'default' : 'secondary'}>
                          {callCenterUser.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{callCenterUser.email}</p>
                      {callCenterUser.last_login && (
                        <p className="text-xs text-gray-500">
                          Last login: {new Date(callCenterUser.last_login).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleUserStatus(callCenterUser.id, callCenterUser.is_active)}
                    >
                      {callCenterUser.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-start p-3 border rounded">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {log.call_center_users?.name || 'Unknown User'}
                        </span>
                        <Badge variant="outline">{log.activity_type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {log.call_center_users?.email || 'Unknown Email'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">System settings configuration will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
