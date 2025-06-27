
import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, Clock, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CustomerSupportPanelProps {
  searchTerm: string;
}

const CustomerSupportPanel = ({ searchTerm }: CustomerSupportPanelProps) => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const { data: supportTickets = [], refetch } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          rides(pickup_location, dropoff_location),
          drivers(name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching support tickets:', error);
        return [];
      }

      return tickets?.map(ticket => ({
        id: ticket.id,
        customerName: ticket.drivers?.name || 'Unknown Customer',
        phone: ticket.drivers?.phone || 'N/A',
        subject: ticket.subject,
        category: determineCategoryFromSubject(ticket.subject),
        priority: ticket.status === 'open' ? 'high' : 'normal',
        status: ticket.status || 'open',
        createdAt: calculateTimeAgo(ticket.created_at),
        lastResponse: calculateTimeAgo(ticket.updated_at),
        rideId: ticket.ride_id || 'N/A',
        message: ticket.message,
        pickup: ticket.rides?.pickup_location,
        destination: ticket.rides?.dropoff_location
      })) || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const determineCategoryFromSubject = (subject: string) => {
    const lowerSubject = subject.toLowerCase();
    if (lowerSubject.includes('payment') || lowerSubject.includes('billing') || lowerSubject.includes('money')) {
      return 'billing';
    }
    if (lowerSubject.includes('app') || lowerSubject.includes('technical') || lowerSubject.includes('bug')) {
      return 'technical';
    }
    return 'complaint';
  };

  const calculateTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      refetch();
      console.log('Ticket status updated:', newStatus);
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleSendResponse = async (ticketId: string) => {
    if (!responseText.trim()) return;

    try {
      // In a real app, you'd store responses in a separate table
      // For now, we'll just update the ticket status
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      setResponseText('');
      refetch();
      console.log('Response sent for ticket:', ticketId);
    } catch (error) {
      console.error('Error sending response:', error);
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
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_customer': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'complaint': return <AlertTriangle className="w-4 h-4" />;
      case 'technical': return <MessageSquare className="w-4 h-4" />;
      case 'billing': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredTickets = supportTickets.filter(ticket =>
    ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.phone.includes(searchTerm) ||
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTicketData = supportTickets.find(t => t.id === selectedTicket);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Support Tickets List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Support Tickets ({filteredTickets.length})</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>Refresh</Button>
            <Button size="sm" variant="outline">All</Button>
            <Button size="sm" variant="outline">Open</Button>
            <Button size="sm" variant="outline">High Priority</Button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
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
                    {getCategoryIcon(ticket.category)}
                    <span className="font-medium">{ticket.subject}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ticket.customerName}
                  </div>
                  <span>{ticket.phone}</span>
                  <span>Ride: {ticket.rideId}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created: {ticket.createdAt}
                  </div>
                  <span>Last updated: {ticket.lastResponse}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTickets.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No support tickets found</p>
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
                    <p>Name: {selectedTicketData.customerName}</p>
                    <p>Phone: {selectedTicketData.phone}</p>
                    <p>Ride ID: {selectedTicketData.rideId}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Issue Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedTicketData.message}
                  </p>
                </div>

                {selectedTicketData.pickup && (
                  <div>
                    <h4 className="font-medium mb-2">Trip Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>From: {selectedTicketData.pickup}</p>
                      <p>To: {selectedTicketData.destination}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button size="sm" className="w-full" variant="outline">
                      Call Customer
                    </Button>
                    <Button size="sm" className="w-full" variant="outline">
                      View Ride Details
                    </Button>
                    <Button size="sm" className="w-full" variant="outline">
                      Contact Driver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <Button size="sm" variant="outline">
                    Escalate
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleUpdateTicketStatus(selectedTicketData.id, 'resolved')}
                  >
                    Mark Resolved
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleUpdateTicketStatus(selectedTicketData.id, 'closed')}
                  >
                    Close Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Ticket</h3>
              <p className="text-gray-500">Choose a support ticket from the list to view details and respond.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerSupportPanel;
