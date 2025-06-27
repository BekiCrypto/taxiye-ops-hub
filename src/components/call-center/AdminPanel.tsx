
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

interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminPanelProps {
  user: AdminProfile;
}

const AdminPanel = ({ user }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('users');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'operations_staff' | 'supervisor' | 'root_admin'>('operations_staff');
  const { toast } = useToast();

  // Fetch all admin profiles
  const { data: adminProfiles = [], refetch: refetchAdminProfiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin profiles:', error);
        return [];
      }

      return data || [];
    }
  });

  // Fetch call center users
  const { data: callCenterUsers = [], refetch: refetchCallCenterUsers } = useQuery({
    queryKey: ['call-center-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_center_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching call center users:', error);
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

  const handleCreateAdminUser = async () => {
    if (!newUserEmail || !newUserName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    // Only root_admin can create other admins
    if (user.role !== 'root_admin' && newUserRole === 'root_admin') {
      toast({
        title: 'Error',
        description: 'Only root administrators can create other root administrators.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_profiles')
        .insert({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Admin User Created',
        description: `${newUserName} has been added as ${newUserRole.replace('_', ' ')}.`,
      });

      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('operations_staff');
      refetchAdminProfiles();
    } catch (error) {
      console.error('Error creating admin user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create admin user.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    // Prevent root admin from deactivating themselves
    if (user.id === adminId && user.role === 'root_admin') {
      toast({
        title: 'Error',
        description: 'Root administrator cannot deactivate themselves.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: 'Admin Updated',
        description: `Admin has been ${!currentStatus ? 'activated' : 'deactivated'}.`
      });

      refetchAdminProfiles();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update admin status.',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'root_admin': return 'bg-purple-100 text-purple-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'operations_staff': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageUser = (targetRole: string) => {
    if (user.role === 'root_admin') return true;
    if (user.role === 'supervisor' && targetRole === 'operations_staff') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <div className="flex gap-2">
          <Badge variant="outline">
            Admin Users: {adminProfiles.length}
          </Badge>
          <Badge variant="outline">
            Call Center Users: {callCenterUsers.length}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Create Admin User Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Admin User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="admin@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-role">Role</Label>
                  <Select value={newUserRole} onValueChange={(value: 'operations_staff' | 'supervisor' | 'root_admin') => setNewUserRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operations_staff">Operations Staff</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      {user.role === 'root_admin' && (
                        <SelectItem value="root_admin">Root Administrator</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateAdminUser}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Admin User
              </Button>
              <p className="text-sm text-gray-600">
                Note: The user must register with this email address to activate their account.
              </p>
            </CardContent>
          </Card>

          {/* Admin Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminProfiles.map((admin) => (
                  <div key={admin.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{admin.name}</span>
                        <Badge className={getRoleBadgeColor(admin.role)}>
                          {admin.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(admin.created_at).toLocaleString()}
                      </p>
                    </div>
                    {canManageUser(admin.role) && admin.id !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAdminStatus(admin.id, admin.is_active)}
                      >
                        {admin.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Call Center Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Call Center Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {callCenterUsers.map((callCenterUser) => (
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
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Role Hierarchy</h4>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Root Administrator: Full system access, can create all user types</li>
                    <li>• Supervisor: Can manage operations staff and call center users</li>
                    <li>• Operations Staff: Standard admin access for day-to-day operations</li>
                  </ul>
                </div>
                <p className="text-gray-600">Additional system settings will be implemented here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
