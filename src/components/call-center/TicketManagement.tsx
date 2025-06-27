
import React, { useState } from 'react';
import { MessageSquare, Clock, User, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

interface TicketManagementProps {
  user: CallCenterUser;
  onStatsUpdate: () => void;
}

const TicketManagement = ({ user, onStatsUpdate }: TicketManagementProps) => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [ticketFilter, setTicketFilter] = useState('assigned');
  const { toast } = useToast();

  // Fetch tickets based on user role and filter
  const { data: tickets = [], refetch } = useQuery({
    queryKey: ['agent-tickets', user.id, ticketFilter],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          rides(pickup_location, dropoff_location, passenger_name),
          drivers(name, phone),
          call_center_users!assigned_agent_id(name, email),
          ticket_responses(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters based on role and selection
      if (user.role === 'agent') {
        query = query.eq('assigned_agent_id', user.id);
      } else if (ticketFilter === 'assigned') {
        query = query.not('assigned_agent_id', 'is', null);
      } else if (ticketFilter === 'unassigned') {
        query = query.is('assigned_agent_id', null);
      } else if (ticketFilter === 'escalated') {
        query = query.not('escalated_to', 'is', null);
      }

      if (ticketFilter === 'open') {
        query = query.in('status', ['open', 'in_progress']);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }

      return data?.map(ticket => ({
        ...ticket,
        timeAgo: calculateTimeAgo(ticket.created_at),
        lastUpdate: calculateTimeAgo(ticket.updated_at),
        priority: ticket.priority || 'normal',
        category: ticket.category || 'general'
      })) || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const calculateTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleAssignTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          assigned_agent_id: user.id,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
          first_response_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: user.id,
          activity_type: 'ticket_assigned',
          details: { ticket_id: ticketId, timestamp: new Date().toISOString() }
        });

      toast({
        title: 'Ticket Assigned',
        description: 'You have been assigned to this ticket.'
      });

      refetch();
      onStatsUpdate();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({ title: 'Error', description: 'Failed to assign ticket.', variant: 'destructive' });
    }
  };

  const handleSendResponse = async (ticketId: string) => {
    if (!responseText.trim()) return;

    try {
      // Add response
      const { error: responseError } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticketId,
          sender_type: 'agent',
          sender_id: user.id,
          message: responseText,
          is_internal: false
        });

      if (responseError) throw responseError;

      // Update ticket
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      setResponseText('');
      toast({
        title: 'Response Sent',
        description: 'Your response has been sent to the customer.'
      });

      refetch();
      onStatsUpdate();
    } catch (error) {
      console.error('Error sending response:', error);
      toast({ title: 'Error', description: 'Failed to send response.', variant: 'destructive' });
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_id: user.id,
          activity_type: 'ticket_resolved',
          details: { ticket_id: ticketId, timestamp: new Date().toISOString() }
        });

      toast({
        title: 'Ticket Resolved',
        description: 'The ticket has been marked as resolved.'
      });

      refetch();
      onStatsUpdate();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error resolving ticket:', error);
      toast({ title: 'Error', description: 'Failed to resolve ticket.', variant: 'destructive' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedTicketData = tickets.find(t => t.id === selectedTicket);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tickets List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Support Tickets ({tickets.length})</h2>
          <div className="flex gap-2">
            <Select value={ticketFilter} onValueChange={setTicketFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter tickets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedTicket === ticket.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedTicket(ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-medium">{ticket.subject}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ticket.drivers?.name || 'Unknown Customer'}
                  </div>
                  <span>#{ticket.id.slice(0, 8)}</span>
                  {ticket.assigned_agent_id && (
                    <span>Assigned to: {ticket.call_center_users?.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created: {ticket.timeAgo}
                  </div>
                  <span>Last updated: {ticket.lastUpdate}</span>
                  {ticket.ticket_responses?.length > 0 && (
                    <span>{ticket.ticket_responses.length} responses</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {tickets.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tickets found for the selected filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details & Response */}
      <div className="space-y-4">
        {selectedTicketData ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p>Name: {selectedTicketData.drivers?.name || 'Unknown'}</p>
                    <p>Phone: {selectedTicketData.drivers?.phone || 'N/A'}</p>
                    <p>Ticket ID: #{selectedTicketData.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Issue Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedTicketData.message}
                  </p>
                </div>

                {selectedTicketData.rides && (
                  <div>
                    <h4 className="font-medium mb-2">Related Trip</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>From: {selectedTicketData.rides.pickup_location}</p>
                      <p>To: {selectedTicketData.rides.dropoff_location}</p>
                    </div>
                  </div>
                )}

                {!selectedTicketData.assigned_agent_id && user.role !== 'agent' && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleAssignTicket(selectedTicketData.id)}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Assign to Me
                  </Button>
                )}
              </CardContent>
            </Card>

            {selectedTicketData.assigned_agent_id === user.id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type your response to the customer..."
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleSendResponse(selectedTicketData.id)}
                      disabled={!responseText.trim()}
                    >
                      Send Response
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleResolveTicket(selectedTicketData.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Ticket</h3>
              <p className="text-gray-500">Choose a ticket from the list to view details and respond.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TicketManagement;
