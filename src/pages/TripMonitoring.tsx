
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Clock, DollarSign, User, Car, Calendar, Filter } from 'lucide-react';

const TripMonitoring = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  const { data: trips = [], refetch } = useQuery({
    queryKey: ['trips', searchTerm, statusFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`passenger_name.ilike.%${searchTerm}%,driver_phone_ref.ilike.%${searchTerm}%,pickup_location.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Date filtering
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (dateFilter !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000 // Refresh every 10 seconds for real-time monitoring
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 animate-pulse">Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'Ongoing';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    return `${diffMinutes} min`;
  };

  const stats = {
    total: trips.length,
    active: trips.filter(t => t.status === 'active').length,
    completed: trips.filter(t => t.status === 'completed').length,
    totalEarnings: trips.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.fare || 0), 0)
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Monitoring</h1>
          <p className="text-gray-600">Real-time trip tracking and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Navigation className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Car className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Trips</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Earnings</p>
                  <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trips.map((trip) => (
                <div key={trip.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">Trip #{trip.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">
                          Created: {formatDate(trip.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(trip.status)}
                      {trip.fare && (
                        <Badge variant="outline" className="bg-green-50">
                          ${trip.fare}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Trip Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-gray-600">From:</p>
                            <p>{trip.pickup_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-gray-600">To:</p>
                            <p>{trip.dropoff_location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Participants</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>Passenger: {trip.passenger_name || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3 text-gray-400" />
                          <span>Driver: {trip.driver_phone_ref || 'Not assigned'}</span>
                        </div>
                        {trip.distance_km && (
                          <div className="flex items-center gap-2">
                            <Navigation className="w-3 h-3 text-gray-400" />
                            <span>Distance: {trip.distance_km} km</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                    <div className="flex gap-4">
                      {trip.started_at && (
                        <span>Started: {formatDate(trip.started_at)}</span>
                      )}
                      {trip.completed_at && (
                        <span>Completed: {formatDate(trip.completed_at)}</span>
                      )}
                      {trip.started_at && (
                        <span>Duration: {formatDuration(trip.started_at, trip.completed_at)}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {trip.commission && (
                        <span>Commission: ${trip.commission}</span>
                      )}
                      {trip.net_earnings && (
                        <span>Driver Earnings: ${trip.net_earnings}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {trips.length === 0 && (
                <div className="text-center py-8">
                  <Navigation className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No trips found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TripMonitoring;
