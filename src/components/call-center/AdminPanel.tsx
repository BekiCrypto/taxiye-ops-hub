import React, { useState } from 'react';
import { Users, Plus, Settings, TrendingUp, Shield, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'agent' | 'supervisor' | 'admin'>('agent');
  const { toast } = useToast();

  // Fetch all call center users
  const { data: callCenterUsers = [], refetch } = useQuery({
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

  // Fetch system analytics
  const { data: analytics } = useQuery({
    queryKey: ['call-center-analytics'],
    queryFn: async () => {
      const [
        { data: totalTickets },
        { data: resolvedTickets },
        { data: totalCalls },
        { data: avgResponseTime }
      ] = await Promise.all([
        supabase.from('support_tickets').select('id', { count: 'exact' }),
        supabase.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'resolved'),
        supabase.from('communication_channels').select('id', { count: 'exact' }),
        supabase.from('support_tickets')
          .select('created_at, first_response_at')
          .not('first_response_at', 'is', null)
      ]);

      // Calculate average response time
      let avgMinutes = 0;
      if (avgResponseTime && avgResponseTime.length > 0) {
        const totalMinutes = avgResponseTime.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at);
          const responded = new Date(ticket.first_response_at);
          return sum + Math.floor((responded.getTime() - created.getTime()) / (1000 * 60));
        }, 0);
        avgMinutes = Math.floor(totalMinutes / avgResponseTime.length);
      }

      return {
        totalTickets: totalTickets?.length || 0,
        resolvedTickets: resolvedTickets?.length || 0,
        totalCalls: totalCalls?.length || 0,
        avgResponseTimeMinutes: avgMinutes,
        resolutionRate: totalTickets?.length ? 
          Math.round((resolvedTickets?.length || 0) / totalTickets.length * 100) : 0
      };
    },
    refetchInterval: 60000 // Refresh every minute
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
          created_by: user.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'User Created',
        description: `${newUserName} has been added as a ${newUserRole}.`
      });

      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('agent');
      refetch();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user. Email might already exist.',
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

      refetch();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive'
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTickets || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.resolutionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Tickets resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.avgResponseTimeMinutes || 0}m
            </div>
            <p className="text-xs text-muted-foreground">Average first response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{callCenterUsers.length}</div>
            <p className="text-xs text-muted-foreground">Call center staff</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </h2>

          {/* Add New User */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Full name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="user@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
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
              <Button onClick={handleCreateUser} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </CardContent>
          </Card>

          {/* Existing Users */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Users ({callCenterUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {callCenterUsers.map((ccUser) => (
                  <div key={ccUser.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{ccUser.name}</p>
                          <p className="text-sm text-gray-600">{ccUser.email}</p>
                        </div>
                        <Badge className={getRoleColor(ccUser.role)}>
                          {ccUser.role}
                        </Badge>
                        <Badge variant={ccUser.is_active ? "default" : "secondary"}>
                          {ccUser.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {formatDate(ccUser.created_at)}
                        {ccUser.last_login && ` • Last login: ${formatDate(ccUser.last_login)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleUserStatus(ccUser.id, ccUser.is_active)}
                      >
                        {ccUser.is_active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings
          </h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Call Recording</p>
                  <p className="text-sm text-gray-600">Enable automatic call recording</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Data Encryption</p>
                  <p className="text-sm text-gray-600">Encrypt sensitive customer data</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Audit Logs</p>
                  <p className="text-sm text-gray-600">Track all system activities</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Twilio Integration</p>
                  <p className="text-sm text-gray-600">Voice call services</p>
                </div>
                <Button variant="outline" size="sm">Setup</Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">WhatsApp Bot</p>
                  <p className="text-sm text-gray-600">Automated customer support</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Email Gateway</p>
                  <p className="text-sm text-gray-600">Email support integration</p>
                </div>
                <Button variant="outline" size="sm">Setup</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Monitoring</CardHeader>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {callCenterUsers.filter(u => u.is_active).length}
                  </div>
                  <p className="text-sm text-gray-600">Active Agents</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <p className="text-sm text-gray-600">System Uptime</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                View Detailed Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
