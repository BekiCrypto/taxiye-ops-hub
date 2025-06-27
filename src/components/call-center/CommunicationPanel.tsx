
import React, { useState } from 'react';
import { MessageSquare, Phone, Mail, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CallCenterUser {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'supervisor' | 'admin';
  is_active: boolean;
}

interface CommunicationPanelProps {
  user: CallCenterUser;
}

const CommunicationPanel = ({ user }: CommunicationPanelProps) => {
  const [activeTab, setActiveTab] = useState('channels');

  // Fetch communication channels
  const { data: channels = [] } = useQuery({
    queryKey: ['communication-channels', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_channels')
        .select(`
          *,
          rides(pickup_location, dropoff_location, passenger_name),
          drivers(name, phone)
        `)
        .eq('agent_id', user.id)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching channels:', error);
        return [];
      }

      return data || [];
    },
    refetchInterval: 10000
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Communication Center</h2>
        <div className="flex gap-2">
          <Badge variant="outline">
            Active: {channels.filter(c => c.status === 'active').length}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="channels">Active Channels</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          {channels.filter(c => c.status === 'active').length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active communication channels</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {channels.filter(c => c.status === 'active').map((channel) => (
                <Card key={channel.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {channel.type === 'phone' ? (
                            <Phone className="w-4 h-4" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)} Call
                          </span>
                          <Badge variant="outline">{channel.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Customer: {channel.drivers?.name || 'Unknown'}
                        </p>
                        {channel.rides && (
                          <p className="text-xs text-gray-500">
                            Trip: {channel.rides.pickup_location} → {channel.rides.dropoff_location}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {channels.filter(c => c.status !== 'active').map((channel) => (
              <Card key={channel.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {channel.type === 'phone' ? (
                          <Phone className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)} Call
                        </span>
                        <Badge variant={channel.status === 'completed' ? 'default' : 'secondary'}>
                          {channel.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer: {channel.drivers?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Started: {new Date(channel.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationPanel;
