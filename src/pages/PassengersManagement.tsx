
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Phone, Mail, Calendar, Navigation, DollarSign, User } from 'lucide-react';

const PassengersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);

  const { data: passengers = [], refetch } = useQuery({
    queryKey: ['passengers', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('passengers')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  // Get passenger trip stats
  const { data: passengerStats = {} } = useQuery({
    queryKey: ['passenger-stats', selectedPassenger?.phone],
    queryFn: async () => {
      if (!selectedPassenger?.phone) return {};

      const { data: trips, error } = await supabase
        .from('rides')
        .select('*')
        .eq('passenger_phone_ref', selectedPassenger.phone)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const completedTrips = trips?.filter(t => t.status === 'completed') || [];
      const totalSpent = completedTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);

      return {
        totalTrips: trips?.length || 0,
        completedTrips: completedTrips.length,
        totalSpent: totalSpent,
        recentTrips: trips?.slice(0, 5) || []
      };
    },
    enabled: !!selectedPassenger?.phone
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: passengers.length,
    active: passengers.filter(p => p.created_at > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).length
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Passengers Management</h1>
          <p className="text-gray-600">View and manage passenger accounts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Passengers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active (Last 30 days)</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold">
                    {passengers.filter(p => 
                      new Date(p.created_at) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search passengers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {/* Passengers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Passengers List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {passengers.map((passenger) => (
                    <div
                      key={passenger.phone}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPassenger?.phone === passenger.phone
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPassenger(passenger)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium">{passenger.name}</h3>
                            <p className="text-sm text-gray-600">{passenger.phone}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50">
                          Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{passenger.email || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>Joined: {formatDate(passenger.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {passengers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No passengers found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Passenger Details Panel */}
          <div>
            {selectedPassenger ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Passenger Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Personal Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {selectedPassenger.name}</p>
                        <p><strong>Phone:</strong> {selectedPassenger.phone}</p>
                        <p><strong>Email:</strong> {selectedPassenger.email || 'Not provided'}</p>
                        <p><strong>Joined:</strong> {formatDate(selectedPassenger.created_at)}</p>
                        <p><strong>Last Update:</strong> {formatDate(selectedPassenger.updated_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trip Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Navigation className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {passengerStats.totalTrips || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Trips</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          ${(passengerStats.totalSpent || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">Total Spent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {passengerStats.recentTrips && passengerStats.recentTrips.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Trips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {passengerStats.recentTrips.map((trip: any) => (
                          <div key={trip.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm">
                                <p className="font-medium">#{trip.id.slice(0, 8)}</p>
                                <p className="text-gray-600">{formatDate(trip.created_at)}</p>
                              </div>
                              <Badge 
                                className={
                                  trip.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {trip.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p>From: {trip.pickup_location}</p>
                              <p>To: {trip.dropoff_location}</p>
                              {trip.fare && <p>Fare: ${trip.fare}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Passenger</h3>
                  <p className="text-gray-500">Choose a passenger from the list to view their details and trip history.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PassengersManagement;
