
import React, { useState } from 'react';
import { Phone, PhoneCall, Clock, MapPin, User, Car, MessageSquare, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ActiveCallsPanel from '@/components/call-center/ActiveCallsPanel';
import RideDispatchPanel from '@/components/call-center/RideDispatchPanel';
import CustomerSupportPanel from '@/components/call-center/CustomerSupportPanel';
import CallStats from '@/components/call-center/CallStats';

const CallCenter = () => {
  const [activeTab, setActiveTab] = useState<'calls' | 'dispatch' | 'support'>('calls');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const callStats = {
    totalCalls: 47,
    activeCalls: 8,
    avgWaitTime: '2:34',
    completedToday: 39
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Center</h1>
            <p className="text-gray-600">Manage incoming calls, dispatch rides, and provide customer support</p>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Search calls, drivers, passengers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80"
            />
            <Button className="bg-green-600 hover:bg-green-700">
              <Phone className="w-4 h-4 mr-2" />
              Make Call
            </Button>
          </div>
        </div>

        {/* Call Stats */}
        <CallStats stats={callStats} />

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('calls')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PhoneCall className="w-4 h-4 inline mr-2" />
              Active Calls
            </button>
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dispatch'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Car className="w-4 h-4 inline mr-2" />
              Ride Dispatch
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'support'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Customer Support
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'calls' && <ActiveCallsPanel searchTerm={searchTerm} />}
          {activeTab === 'dispatch' && <RideDispatchPanel searchTerm={searchTerm} />}
          {activeTab === 'support' && <CustomerSupportPanel searchTerm={searchTerm} />}
        </div>
      </div>
    </Layout>
  );
};

export default CallCenter;
