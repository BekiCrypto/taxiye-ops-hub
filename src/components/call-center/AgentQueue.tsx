
import React, { useState } from 'react';
import { Phone, PhoneCall, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface AgentQueueProps {
  user: CallCenterUser;
  onStatsUpdate: () => void;
}

const AgentQueue = ({ user, onStatsUpdate }: AgentQueueProps) => {
  const [processingCall, setProcessingCall] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch active communication channels (calls in queue)
  const { data: queueCalls = [], refetch } = useQuery({
    queryKey: ['agent-queue', user.id],
    queryFn: async () => {
      const { data: channels, error } = await supabase
        .from('communication_channels')
        .select(`
          *,
          rides(pickup_location, dropoff_location, passenger_name, passenger_phone, driver_phone_ref),
          drivers(name, phone),
          passengers(name, phone)
        `)
        .eq('status', 'active')
        .is('agent_id', null)
        .order('started_at', { ascending: true });

      if (error) {
        console.error('Error fetching queue:', error);
        return [];
      }

      return channels?.map(channel => ({
        id: channel.id,
        type: channel.type,
        duration: calculateDuration(channel.started_at),
        priority: determinePriority(channel),
        customerName: getCustomerName(channel),
        customerPhone: getCustomerPhone(channel),
        rideInfo: channel.rides ? {
          pickup: channel.rides.pickup_location,
          dropoff: channel.rides.dropoff_location
        } : null,
        channel
      })) || [];
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const calculateDuration = (startedAt: string) => {
    const now = new Date();
    const started = new Date(startedAt);
    const diffInMinutes = Math.floor((now.getTime() - started.getTime()) / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const determinePriority = (channel: any) => {
    const duration = new Date().getTime() - new Date(channel.started_at).getTime();
    const minutes = duration / (1000 * 60);
    
    if (minutes > 10) return 'urgent';
    if (minutes > 5) return 'high';
    return 'normal';
  };

  const getCustomerName = (channel: any) => {
    if (channel.rides?.passenger_name) return channel.rides.passenger_name;
    if (channel.passengers?.name) return channel.passengers.name;
    if (channel.drivers?.name) return channel.drivers.name;
    return 'Unknown Customer';
  };

  const getCustomerPhone = (channel: any) => {
    if (channel.rides?.passenger_phone) return channel.rides.passenger_phone;
    if (channel.passenger_phone_ref) return channel.passenger_phone_ref;
    if (channel.driver_phone_ref) return channel.driver_phone_ref;
    return 'N/A';
  };

  const handleAcceptCall = async (callId: string) => {
    setProcessingCall(callId);
    
    try {
      // Assign call to current agent
      const { error: updateError } = await supabase
        .from('communication_channels')
        .update({ 
          agent_id: user.id,
          status: 'active'
        })
        .eq('id', callId);

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: user.id,
          activity_type: 'call_start',
          details: { channel_id: callId, timestamp: new Date().toISOString() }
        });

      toast({
        title: 'Call Accepted',
        description: 'You are now connected to the customer.'
      });

      refetch();
      onStatsUpdate();
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept call. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessingCall(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <Phone className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Call Queue ({queueCalls.length})</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh Queue
        </Button>
      </div>

      {queueCalls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Calls in Queue</h3>
            <p className="text-gray-500">All calls are currently being handled or no new calls.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {queueCalls.map((call) => (
            <Card key={call.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getPriorityIcon(call.priority)}
                      <span className="font-medium">{call.customerName}</span>
                      <Badge className={getPriorityColor(call.priority)}>
                        {call.priority}
                      </Badge>
                      <Badge variant="outline">
                        {call.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {call.customerPhone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Waiting: {call.duration}
                      </div>
                    </div>

                    {call.rideInfo && (
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-green-600" />
                          From: {call.rideInfo.pickup}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-600" />
                          To: {call.rideInfo.dropoff}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAcceptCall(call.id)}
                      disabled={processingCall === call.id}
                    >
                      <PhoneCall className="w-4 h-4 mr-1" />
                      {processingCall === call.id ? 'Connecting...' : 'Accept'}
                    </Button>
                    <Button size="sm" variant="outline">
                      Transfer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentQueue;
