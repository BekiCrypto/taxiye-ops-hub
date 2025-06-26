
import React, { useState } from 'react';
import { Car, MapPin, Clock, User, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface RideDispatchPanelProps {
  searchTerm: string;
}

const RideDispatchPanel = ({ searchTerm }: RideDispatchPanelProps) => {
  const [pendingRides] = useState([
    {
      id: '1',
      passengerName: 'John Doe',
      phone: '+251911234567',
      pickup: 'Bole International Airport',
      destination: 'Hilton Hotel',
      requestTime: '2 min ago',
      estimatedFare: 120,
      priority: 'normal',
      status: 'waiting_assignment'
    },
    {
      id: '2',
      passengerName: 'Sarah Wilson',
      phone: '+251922345678',
      pickup: 'Merkato',
      destination: 'Addis Ababa University',
      requestTime: '5 min ago',
      estimatedFare: 85,
      priority: 'high',
      status: 'searching_driver'
    }
  ]);

  const [availableDrivers] = useState([
    {
      id: '1',
      name: 'Kebede Alemu',
      phone: '+251944567890',
      vehicle: 'Toyota Corolla - Blue',
      plateNumber: 'AA-123-456',
      rating: 4.8,
      distance: '0.5 km away',
      status: 'online'
    },
    {
      id: '2',
      name: 'Meron Tadesse',
      phone: '+251955678901',
      vehicle: 'Hyundai Elantra - White',
      plateNumber: 'AA-789-012',
      rating: 4.9,
      distance: '1.2 km away',
      status: 'online'
    }
  ]);

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
                  <Button size="sm" className="flex-1">
                    <Car className="w-4 h-4 mr-2" />
                    Auto Assign
                  </Button>
                  <Button size="sm" variant="outline">
                    Manual Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
        </div>
      </div>
    </div>
  );
};

export default RideDispatchPanel;
