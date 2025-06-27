
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, User, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const WalletTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: transactions = [], refetch } = useQuery({
    queryKey: ['wallet-transactions', searchTerm, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`driver_phone_ref.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['wallet-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('phone, name, wallet_balance')
        .order('wallet_balance', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
      case 'trip_earning':
      case 'bonus':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'debit':
      case 'commission':
      case 'withdrawal':
        return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'trip_earning':
      case 'bonus':
        return 'text-green-600';
      case 'debit':
      case 'commission':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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

  const stats = {
    totalTransactions: transactions.length,
    totalCredits: transactions
      .filter(t => ['credit', 'trip_earning', 'bonus'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalDebits: transactions
      .filter(t => ['debit', 'commission', 'withdrawal'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWalletBalance: drivers.reduce((sum, d) => sum + (d.wallet_balance || 0), 0)
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet & Transactions</h1>
          <p className="text-gray-600">Monitor financial transactions and driver wallet balances</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Credits</p>
                  <p className="text-2xl font-bold text-green-600">${stats.totalCredits.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Debits</p>
                  <p className="text-2xl font-bold text-red-600">${stats.totalDebits.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Wallet Balance</p>
                  <p className="text-2xl font-bold text-purple-600">${stats.totalWalletBalance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="trip_earning">Trip Earning</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <h3 className="font-medium">#{transaction.id.slice(0, 8)}</h3>
                            <p className="text-sm text-gray-600">
                              {transaction.driver_phone_ref || 'System'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                            {['credit', 'trip_earning', 'bonus'].includes(transaction.type) ? '+' : '-'}
                            ${transaction.amount.toFixed(2)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Type: <span className="capitalize">{transaction.type.replace('_', ' ')}</span></p>
                          <p className="text-gray-600">Source: {transaction.source || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date: {formatDate(transaction.created_at)}</p>
                          <p className="text-gray-600">Status: <span className="capitalize">{transaction.status}</span></p>
                        </div>
                      </div>

                      {transaction.description && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {transactions.length === 0 && (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Driver Wallets */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Top Driver Wallets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers.slice(0, 10).map((driver) => (
                    <div key={driver.phone} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-gray-600">{driver.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ${(driver.wallet_balance || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {drivers.length === 0 && (
                    <div className="text-center py-8">
                      <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No driver wallets found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WalletTransactions;
