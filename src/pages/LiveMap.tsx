
import React, { useState } from 'react';
import { Filter, MapPin, Navigation, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

const LiveMap = () => {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock trip data - in real app, this would come from Supabase with real-time updates
  const activeTrips = [
    {
      id: '1',
      driver: 'Abebe Kebede',
      passenger: 'Sarah Johnson',
      pickup: 'Bole Airport',
      dropoff: 'Piazza',
      status: 'active',
      duration: '12 min',
      fare: 150,
      driverLocation: { lat: 8.9806, lng: 38.7578 },
      passengerLocation: { lat: 8.9753, lng: 38.7578 }
    },
    {
      id: '2',
      driver: 'Meseret Tadesse',
      passenger: 'John Smith',
      pickup: 'Mercato',
      dropoff: 'CMC',
      status: 'pending',
      duration: '0 min',
      fare: 85,
      driverLocation: { lat: 9.0084, lng: 38.7575 },
      passengerLocation: { lat: 9.0084, lng: 38.7575 }
    },
    {
      id: '3',
      driver: 'Tekle Mekonen',
      passenger: 'Almaz Haile',
      pickup: '4 Kilo',
      dropoff: 'Arat Kilo',
      status: 'completed',
      duration: '25 min',
      fare: 65,
      driverLocation: { lat: 9.0579, lng: 38.7669 },
      passengerLocation: { lat: 9.0579, lng: 38.7669 }
    }
  ];

  const filteredTrips = statusFilter === 'all' 
    ? activeTrips 
    : activeTrips.filter(trip => trip.status === statusFilter);

  return (
    <Layout>
      <div className="h-full flex">
        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Map Placeholder */}
          <div className="h-full bg-gray-200 flex items-center justify-center relative">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Live Map View</h3>
              <p className="text-gray-500">Real-time trip monitoring will be displayed here</p>
              <p className="text-sm text-gray-400 mt-2">Connect Mapbox API for live map functionality</p>
            </div>

            {/* Mock location markers */}
            <div className="absolute top-20 left-20 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute top-40 right-32 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute bottom-32 left-1/3 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-none focus:ring-0 text-sm"
              >
                <option value="all">All Trips</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
            <h4 className="font-semibold text-sm mb-3">Map Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Active Drivers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Active Trips</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Pending Requests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Trips</h2>
            <p className="text-sm text-gray-600">{filteredTrips.length} trips shown</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedTrip === trip.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedTrip(trip.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">Trip #{trip.id}</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    <p className="text-sm text-gray-600">Driver: {trip.driver}</p>
                    <p className="text-sm text-gray-600">Passenger: {trip.passenger}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">{trip.pickup}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="w-4 h-4 text-red-600" />
                    <span className="text-gray-700">{trip.dropoff}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{trip.duration}</span>
                    </div>
                    <span className="font-semibold text-gray-900">ETB {trip.fare}</span>
                  </div>
                </div>

                {trip.status === 'active' && (
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded transition-colors">
                      Emergency Stop
                    </button>
                    <button className="flex-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded transition-colors">
                      Contact Driver
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-green-600">{activeTrips.filter(t => t.status === 'active').length}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">{activeTrips.filter(t => t.status === 'pending').length}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{activeTrips.filter(t => t.status === 'completed').length}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveMap;
