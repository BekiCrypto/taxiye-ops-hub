
import React, { useState } from 'react';
import { Phone, PhoneOff, Clock, User, MapPin, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ActiveCallsPanelProps {
  searchTerm: string;
}

const ActiveCallsPanel = ({ searchTerm }: ActiveCallsPanelProps) => {
  // Mock active calls data
  const [activeCalls] = useState([
    {
      id: '1',
      callerName: 'John Doe',
      phone: '+251911234567',
      type: 'ride_request',
      priority: 'normal',
      duration: '02:34',
      pickup: 'Bole International Airport',
      destination: 'Hilton Hotel',
      status: 'in_progress'
    },
    {
      id: '2',
      callerName: 'Sarah Wilson',
      phone: '+251922345678',
      type: 'complaint',
      priority: 'high',
      duration: '01:12',
      pickup: 'Merkato',
      destination: 'Addis Ababa University',
      status: 'waiting'
    },
    {
      id: '3',
      callerName: 'Ahmed Hassan',
      phone: '+251933456789',
      type: 'support',
      priority: 'low',
      duration: '00:45',
      pickup: 'Churchill Avenue',
      destination: 'Mexico Square',
      status: 'on_hold'
    }
  ]);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Calls ({filteredCalls.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            Answer Queue
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

                  {call.type === 'ride_request' && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        From: {call.pickup}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        To: {call.destination}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    Duration: {call.duration}
                    <span className="mx-2">•</span>
                    Type: {call.type.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    Hold
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCalls.length === 0 && (
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
