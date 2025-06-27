
import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Settings,
  LogOut,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AgentQueue from './AgentQueue';
import CommunicationPanel from './CommunicationPanel';
import TicketManagement from './TicketManagement';
import EmergencyEscalation from './EmergencyEscalation';
import AdminPanel from './AdminPanel';
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

interface CallCenterDashboardProps {
  user: CallCenterUser;
  onLogout: () => void;
}

const CallCenterDashboard = ({ user, onLogout }: CallCenterDashboardProps) => {
  const [activeTab, setActiveTab] = useState('queue');
  const { toast } = useToast();

  // Fetch real-time dashboard stats
  const { data: dashboardStats, refetch: refetchStats } = useQuery({
    queryKey: ['call-center-dashboard-stats'],
    queryFn: async () => {
      const [
        { data: activeTickets },
        { data: pendingCalls },
        { data: agents },
        { data: emergencies }
      ] = await Promise.all([
        supabase.from('support_tickets').select('*').in('status', ['open', 'in_progress']),
        supabase.from('communication_channels').select('*').eq('status', 'active'),
        supabase.from('call_center_users').select('*').eq('is_active', true),
        supabase.from('emergency_escalations').select('*').eq('status', 'pending')
      ]);

      return {
        activeTickets: activeTickets?.length || 0,
        pendingCalls: pendingCalls?.length || 0,
        availableAgents: agents?.filter(a => a.role === 'agent').length || 0,
        emergencyEscalations: emergencies?.length || 0
      };
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const handleLogout = async () => {
    try {
      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: user.id,
          activity_type: 'logout',
          details: { timestamp: new Date().toISOString() }
        });

      localStorage.removeItem('call_center_user');
      onLogout();
      
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getTabsForRole = () => {
    const baseTabs = [
      { value: 'queue', label: 'Queue', icon: Phone },
      { value: 'tickets', label: 'Tickets', icon: MessageSquare },
      { value: 'communication', label: 'Communication', icon: Users }
    ];

    if (user.role === 'supervisor' || user.role === 'admin') {
      baseTabs.push({ value: 'escalation', label: 'Emergency', icon: AlertTriangle });
    }

    if (user.role === 'admin') {
      baseTabs.push({ value: 'admin', label: 'Admin', icon: Shield });
    }

    return baseTabs;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Center Operations</h1>
            <p className="text-gray-600">
              Welcome back, {user.name} • <Badge variant="outline">{user.role}</Badge>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardStats?.activeTickets || 0}
              </div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Calls</CardTitle>
              <Phone className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardStats?.pendingCalls || 0}
              </div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Agents</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dashboardStats?.availableAgents || 0}
              </div>
              <p className="text-xs text-muted-foreground">Online now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Escalations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboardStats?.emergencyEscalations || 0}
              </div>
              <p className="text-xs text-muted-foreground">Needs immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            {getTabsForRole().map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            <AgentQueue user={user} onStatsUpdate={refetchStats} />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <TicketManagement user={user} onStatsUpdate={refetchStats} />
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <CommunicationPanel user={user} />
          </TabsContent>

          {(user.role === 'supervisor' || user.role === 'admin') && (
            <TabsContent value="escalation" className="space-y-4">
              <EmergencyEscalation user={user} onStatsUpdate={refetchStats} />
            </TabsContent>
          )}

          {user.role === 'admin' && (
            <TabsContent value="admin" className="space-y-4">
              <AdminPanel user={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default CallCenterDashboard;
