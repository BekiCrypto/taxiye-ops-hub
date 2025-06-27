
import React from 'react';
import { Phone, PhoneOff, Clock, User, MapPin, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActiveCallsPanelProps {
  searchTerm: string;
}

const ActiveCallsPanel = ({ searchTerm }: ActiveCallsPanelProps) => {
  const { data: activeCalls = [], isLoading, refetch } = useQuery({
    queryKey: ['active-calls'],
    queryFn: async () => {
      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          passengers!inner(name, phone)
        `)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active calls:', error);
        return [];
      }

      return rides?.map(ride => ({
        id: ride.id,
        callerName: ride.passengers?.name || ride.passenger_name || 'Unknown',
        phone: ride.passengers?.phone || ride.passenger_phone || 'N/A',
        type: 'ride_request',
        priority: ride.status === 'pending' ? 'high' : 'normal',
        duration: calculateDuration(ride.created_at),
        pickup: ride.pickup_location,
        destination: ride.dropoff_location,
        status: ride.status === 'pending' ? 'waiting' : ride.status === 'accepted' ? 'in_progress' : 'on_hold',
        rideId: ride.id
      })) || [];
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const calculateDuration = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}:00`;
  };

  const handleAnswerCall = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'accepted' })
        .eq('id', rideId);

      if (error) throw error;
      refetch();
      console.log('Call answered for ride:', rideId);
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };

  const handleEndCall = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);

      if (error) throw error;
      refetch();
      console.log('Call ended for ride:', rideId);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCalls = activeCalls.filter(call =>
    call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.phone.includes(searchTerm) ||
    call.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Active Calls (Loading...)</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Calls ({filteredCalls.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Phone className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCalls.map((call) => (
          <Card key={call.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{call.callerName}</span>
                    </div>
                    <span className="text-sm text-gray-500">{call.phone}</span>
                    <Badge className={getPriorityColor(call.priority)}>
                      {call.priority}
                    </Badge>
                    <Badge className={getStatusColor(call.status)}>
                      {call.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-600" />
                      From: {call.pickup}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-600" />
                      To: {call.destination}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    Duration: {call.duration}
                    <span className="mx-2">•</span>
                    Type: {call.type.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleAnswerCall(call.rideId)}
                    disabled={call.status === 'in_progress'}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    Hold
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleEndCall(call.rideId)}
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCalls.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Calls</h3>
          <p className="text-gray-500">All calls have been handled or no calls match your search.</p>
        </div>
      )}
    </div>
  );
};

export default ActiveCallsPanel;
