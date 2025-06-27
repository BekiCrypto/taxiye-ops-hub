
import React from 'react';
import { Car, MapPin, Clock, User, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RideDispatchPanelProps {
  searchTerm: string;
}

const RideDispatchPanel = ({ searchTerm }: RideDispatchPanelProps) => {
  const { data: pendingRides = [], refetch: refetchRides } = useQuery({
    queryKey: ['pending-rides'],
    queryFn: async () => {
      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          passengers!inner(name, phone)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending rides:', error);
        return [];
      }

      return rides?.map(ride => ({
        id: ride.id,
        passengerName: ride.passengers?.name || ride.passenger_name || 'Unknown',
        phone: ride.passengers?.phone || ride.passenger_phone || 'N/A',
        pickup: ride.pickup_location,
        destination: ride.dropoff_location,
        requestTime: calculateTimeAgo(ride.created_at),
        estimatedFare: ride.fare || 0,
        priority: 'normal',
        status: 'waiting_assignment'
      })) || [];
    },
    refetchInterval: 5000
  });

  const { data: availableDrivers = [], refetch: refetchDrivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => {
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_online', true)
        .eq('approved_status', 'approved')
        .order('name');

      if (error) {
        console.error('Error fetching drivers:', error);
        return [];
      }

      return drivers?.map(driver => ({
        id: driver.phone,
        name: driver.name,
        phone: driver.phone,
        vehicle: `${driver.vehicle_model || 'Vehicle'} - ${driver.vehicle_color || 'Color'}`,
        plateNumber: driver.plate_number || 'N/A',
        rating: 4.8, // This would come from a ratings table
        distance: '0.5 km away', // This would come from location data
        status: 'online',
        walletBalance: driver.wallet_balance || 0
      })) || [];
    },
    refetchInterval: 10000
  });

  const calculateTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return `${diffInMinutes} min ago`;
  };

  const handleAutoAssign = async (rideId: string) => {
    if (availableDrivers.length === 0) {
      alert('No available drivers');
      return;
    }

    try {
      const randomDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
      
      const { error } = await supabase
        .from('rides')
        .update({ 
          driver_phone_ref: randomDriver.phone,
          status: 'accepted'
        })
        .eq('id', rideId);

      if (error) throw error;
      
      refetchRides();
      refetchDrivers();
      console.log('Ride auto-assigned to driver:', randomDriver.name);
    } catch (error) {
      console.error('Error auto-assigning ride:', error);
    }
  };

  const handleManualAssign = async (rideId: string, driverPhone: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          driver_phone_ref: driverPhone,
          status: 'accepted'
        })
        .eq('id', rideId);

      if (error) throw error;
      
      refetchRides();
      refetchDrivers();
      console.log('Ride manually assigned to driver:', driverPhone);
    } catch (error) {
      console.error('Error manually assigning ride:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Rides */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Pending Rides ({pendingRides.length})</h2>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Manual Booking
          </Button>
        </div>

        <div className="space-y-3">
          {pendingRides.map((ride) => (
            <Card key={ride.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{ride.passengerName}</span>
                      <Badge className={getPriorityColor(ride.priority)}>
                        {ride.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{ride.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{ride.requestTime}</p>
                    <p className="font-semibold text-green-600">ETB {ride.estimatedFare}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-green-600" />
                    <span>From: {ride.pickup}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-red-600" />
                    <span>To: {ride.destination}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleAutoAssign(ride.id)}
                    disabled={availableDrivers.length === 0}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Auto Assign
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={availableDrivers.length === 0}
                  >
                    Manual Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {pendingRides.length === 0 && (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending rides at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Available Drivers */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Available Drivers ({availableDrivers.length})</h2>
          <Input
            placeholder="Search drivers..."
            className="w-48"
          />
        </div>

        <div className="space-y-3">
          {availableDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{driver.name}</span>
                      <Badge className="bg-green-100 text-green-800">
                        {driver.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{driver.phone}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium">{driver.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">ETB {driver.walletBalance}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-3 text-sm text-gray-600">
                  <p>{driver.vehicle}</p>
                  <p>Plate: {driver.plateNumber}</p>
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>{driver.distance}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    Assign Ride
                  </Button>
                  <Button size="sm" variant="outline">
                    Call Driver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {availableDrivers.length === 0 && (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No available drivers online</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideDispatchPanel;
