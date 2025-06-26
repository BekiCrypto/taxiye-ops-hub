
import React from 'react';
import { Car, Users, Wallet, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Layout from '@/components/Layout';
import KPICard from '@/components/KPICard';

const Dashboard = () => {
  // Mock data - in real app, this would come from Supabase
  const kpiData = {
    totalTripsToday: 1247,
    activeDrivers: 89,
    activePassengers: 456,
    totalEarnings: 45600,
    completionRate: 94.2
  };

  const tripsData = [
    { name: 'Mon', trips: 980, earnings: 24500 },
    { name: 'Tue', trips: 1120, earnings: 28000 },
    { name: 'Wed', trips: 1050, earnings: 26250 },
    { name: 'Thu', trips: 1300, earnings: 32500 },
    { name: 'Fri', trips: 1480, earnings: 37000 },
    { name: 'Sat', trips: 1680, earnings: 42000 },
    { name: 'Sun', trips: 1247, earnings: 31175 }
  ];

  const statusData = [
    { name: 'Completed', value: 85, color: '#10B981' },
    { name: 'Active', value: 8, color: '#3B82F6' },
    { name: 'Cancelled', value: 7, color: '#EF4444' }
  ];

  const earningsData = [
    { hour: '00:00', amount: 1200 },
    { hour: '04:00', amount: 800 },
    { hour: '08:00', amount: 3400 },
    { hour: '12:00', amount: 4200 },
    { hour: '16:00', amount: 3800 },
    { hour: '20:00', amount: 5200 },
    { hour: '24:00', amount: 2400 }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your Taxiye operations</p>
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>All Cities</option>
              <option>Addis Ababa</option>
              <option>Dire Dawa</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <KPICard
            title="Total Trips Today"
            value={kpiData.totalTripsToday.toLocaleString()}
            change={{ value: 12.5, type: 'increase' }}
            icon={FileText}
            color="blue"
          />
          <KPICard
            title="Active Drivers"
            value={kpiData.activeDrivers}
            change={{ value: 8.2, type: 'increase' }}
            icon={Car}
            color="green"
          />
          <KPICard
            title="Active Passengers"
            value={kpiData.activePassengers}
            change={{ value: 5.1, type: 'increase' }}
            icon={Users}
            color="yellow"
          />
          <KPICard
            title="Total Earnings"
            value={`ETB ${kpiData.totalEarnings.toLocaleString()}`}
            change={{ value: 15.3, type: 'increase' }}
            icon={Wallet}
            color="blue"
          />
          <KPICard
            title="Completion Rate"
            value={`${kpiData.completionRate}%`}
            change={{ value: 2.1, type: 'increase' }}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trips & Earnings Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trips & Earnings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tripsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="trips" fill="#3B82F6" name="Trips" />
                <Bar yAxisId="right" dataKey="earnings" fill="#10B981" name="Earnings (ETB)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trip Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Earnings Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Hourly Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => [`ETB ${value}`, 'Earnings']} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-blue-900">Create Manual Booking</span>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
              <Car className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-900">Approve Drivers</span>
            </button>
            <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors">
              <Bell className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-yellow-900">Send Notification</span>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
              <Wallet className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-900">Manage Wallets</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
