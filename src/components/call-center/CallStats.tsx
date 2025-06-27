
import React, { useEffect, useState } from 'react';
import { Phone, PhoneCall, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface CallStatsProps {
  stats: {
    totalCalls: number;
    activeCalls: number;
    avgWaitTime: string;
    completedToday: number;
  };
}

const CallStats = ({ stats }: CallStatsProps) => {
  const { data: liveStats, isLoading } = useQuery({
    queryKey: ['call-center-stats'],
    queryFn: async () => {
      // Fetch active drivers count
      const { data: activeDrivers } = await supabase
        .from('drivers')
        .select('id')
        .eq('is_online', true);

      // Fetch today's rides
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayRides } = await supabase
        .from('rides')
        .select('*')
        .gte('created_at', today.toISOString());

      // Fetch active rides
      const { data: activeRides } = await supabase
        .from('rides')
        .select('*')
        .in('status', ['pending', 'accepted', 'in_progress']);

      // Fetch completed rides today
      const { data: completedRides } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', today.toISOString());

      return {
        totalCalls: todayRides?.length || 0,
        activeCalls: activeRides?.length || 0,
        avgWaitTime: '2:34', // This would need more complex calculation
        completedToday: completedRides?.length || 0,
        activeDrivers: activeDrivers?.length || 0
      };
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const displayStats = liveStats || stats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Calls Today</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.totalCalls}</div>
          <p className="text-xs text-muted-foreground">Ride requests received</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
          <PhoneCall className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{displayStats.activeCalls}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{displayStats.avgWaitTime}</div>
          <p className="text-xs text-muted-foreground">Average response time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{displayStats.completedToday}</div>
          <p className="text-xs text-muted-foreground">Successfully completed rides</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallStats;
