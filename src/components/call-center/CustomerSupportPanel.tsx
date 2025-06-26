
import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, Clock, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface CustomerSupportPanelProps {
  searchTerm: string;
}

const CustomerSupportPanel = ({ searchTerm }: CustomerSupportPanelProps) => {
  const [supportTickets] = useState([
    {
      id: '1',
      customerName: 'John Doe',
      phone: '+251911234567',
      subject: 'Driver was late and rude',
      category: 'complaint',
      priority: 'high',
      status: 'open',
      createdAt: '10 min ago',
      lastResponse: '5 min ago',
      rideId: 'RIDE-001'
    },
    {
      id: '2',
      customerName: 'Sarah Wilson',
      phone: '+251922345678',
      subject: 'Unable to cancel ride',
      category: 'technical',
      priority: 'normal',
      status: 'in_progress',
      createdAt: '1 hour ago',
      lastResponse: '30 min ago',
      rideId: 'RIDE-002'
    },
    {
      id: '3',
      customerName: 'Ahmed Hassan',
      phone: '+251933456789',
      subject: 'Payment not processed',
      category: 'billing',
      priority: 'high',
      status: 'waiting_customer',
      createdAt: '2 hours ago',
      lastResponse: '1 hour ago',
      rideId: 'RIDE-003'
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Support Tickets List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Support Tickets ({filteredTickets.length})</h2>
          <div className="flex gap-2">
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
                  <span>Last response: {ticket.lastResponse}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ticket Details & Response */}
      <div className="space-y-4">
        {selectedTicket ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p>Name: John Doe</p>
                    <p>Phone: +251911234567</p>
                    <p>Ride ID: RIDE-001</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Issue Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    Driver arrived 15 minutes late and was very rude during the trip. 
                    Customer is requesting a refund and wants to file a formal complaint.
                  </p>
                </div>

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
                />
                
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    Send Response
                  </Button>
                  <Button size="sm" variant="outline">
                    Escalate
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Mark Resolved
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
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
