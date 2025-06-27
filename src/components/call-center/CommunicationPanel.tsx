
import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, MessageCircle, PhoneCall, PhoneOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

interface CommunicationPanelProps {
  user: CallCenterUser;
}

const CommunicationPanel = ({ user }: CommunicationPanelProps) => {
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const { toast } = useToast();

  // Fetch active communication channels for this agent
  const { data: communications = [], refetch } = useQuery({
    queryKey: ['agent-communications', user.id],
    queryFn: async () => {
      const { data: channels, error } = await supabase
        .from('communication_channels')
        .select(`
          *,
          rides(pickup_location, dropoff_location, passenger_name, driver_phone_ref),
          drivers(name, phone),
          passengers(name, phone)
        `)
        .eq('agent_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching communications:', error);
        return [];
      }

      return channels?.map(channel => ({
        ...channel,
        customerName: getCustomerName(channel),
        customerPhone: getCustomerPhone(channel),
        duration: calculateDuration(channel.started_at)
      })) || [];
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const getCustomerName = (channel: any) => {
    if (channel.rides?.passenger_name) return channel.rides.passenger_name;
    if (channel.passengers?.name) return channel.passengers.name;
    if (channel.drivers?.name) return channel.drivers.name;
    return 'Unknown Customer';
  };

  const getCustomerPhone = (channel: any) => {
    if (channel.passenger_phone_ref) return channel.passenger_phone_ref;
    if (channel.driver_phone_ref) return channel.driver_phone_ref;
    return 'N/A';
  };

  const calculateDuration = (startedAt: string) => {
    const now = new Date();
    const started = new Date(startedAt);
    const diffInMinutes = Math.floor((now.getTime() - started.getTime()) / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleEndCommunication = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('communication_channels')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: user.id,
          activity_type: 'call_end',
          details: { channel_id: channelId, timestamp: new Date().toISOString() }
        });

      toast({
        title: 'Communication Ended',
        description: 'The communication session has been closed.'
      });

      refetch();
    } catch (error) {
      console.error('Error ending communication:', error);
      toast({
        title: 'Error',
        description: 'Failed to end communication.',
        variant: 'destructive'
      });
    }
  };

  const handleSendChatMessage = async (channelId: string) => {
    if (!chatMessage.trim()) return;

    try {
      // In a real implementation, this would send via WebSocket or chat API
      // For now, we'll create a ticket response to simulate chat
      const { error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: null, // For direct chat, we might need a different approach
          sender_type: 'agent',
          sender_id: user.id,
          message: chatMessage,
          is_internal: false
        });

      if (error) throw error;

      setChatMessage('');
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent to the customer.'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive'
      });
    }
  };

  const getChannelTypeIcon = (type: string) => {
    switch (type) {
      case 'voice': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'voice': return 'bg-green-100 text-green-800';
      case 'chat': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      case 'whatsapp': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Communications ({communications.length})</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {communications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Communications</h3>
            <p className="text-gray-500">You don't currently have any active calls or chats.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {communications.map((comm) => (
            <Card key={comm.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getChannelTypeIcon(comm.type)}
                    <div>
                      <CardTitle className="text-lg">{comm.customerName}</CardTitle>
                      <p className="text-sm text-gray-600">{comm.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getChannelTypeColor(comm.type)}>
                      {comm.type}
                    </Badge>
                    <Badge variant="outline">
                      Duration: {comm.duration}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {comm.rides && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Trip Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>From: {comm.rides.pickup_location}</p>
                      <p>To: {comm.rides.dropoff_location}</p>
                    </div>
                  </div>
                )}

                {comm.type === 'chat' && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded min-h-[120px]">
                      <p className="text-sm text-gray-500 mb-2">Chat Messages</p>
                      <div className="space-y-2">
                        {/* This would be populated with actual chat messages */}
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">Customer:</span> Hello, I need help with my ride
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-green-600">You:</span> Hi! I'm here to help you.
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        rows={2}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        size="sm"
                        onClick={() => handleSendChatMessage(comm.id)}
                        disabled={!chatMessage.trim()}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="flex gap-2">
                    {comm.type === 'voice' && (
                      <>
                        <Button size="sm" variant="outline">
                          <PhoneCall className="w-4 h-4 mr-1" />
                          Hold
                        </Button>
                        <Button size="sm" variant="outline">
                          Transfer
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      Create Ticket
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleEndCommunication(comm.id)}
                  >
                    <PhoneOff className="w-4 h-4 mr-1" />
                    End {comm.type === 'voice' ? 'Call' : 'Session'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunicationPanel;
