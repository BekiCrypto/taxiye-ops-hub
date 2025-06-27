
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Car, Phone, Mail, User, MapPin, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const DriversManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const { data: drivers = [], refetch } = useQuery({
    queryKey: ['drivers', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('approved_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  const handleStatusUpdate = async (driverId: string, newStatus: string) => {
    try {
      const updateData: any = {
        approved_status: newStatus,
        last_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (adminNotes.trim()) {
        updateData.admin_notes = adminNotes;
      }

      if (newStatus === 'rejected' && rejectionReason.trim()) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('phone', driverId);

      if (error) throw error;

      toast({
        title: 'Driver Status Updated',
        description: `Driver has been ${newStatus}.`
      });

      setSelectedDriver(null);
      setAdminNotes('');
      setRejectionReason('');
      refetch();
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update driver status.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

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
    total: drivers.length,
    pending: drivers.filter(d => d.approved_status === 'pending').length,
    approved: drivers.filter(d => d.approved_status === 'approved').length,
    rejected: drivers.filter(d => d.approved_status === 'rejected').length
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Drivers Management</h1>
          <p className="text-gray-600">Manage driver applications and approvals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search drivers..."
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
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {/* Drivers Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Drivers List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers.map((driver) => (
                    <div
                      key={driver.phone}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDriver?.phone === driver.phone
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium">{driver.name}</h3>
                            <p className="text-sm text-gray-600">{driver.phone}</p>
                          </div>
                        </div>
                        {getStatusBadge(driver.approved_status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{driver.email || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3 text-gray-400" />
                          <span>{driver.vehicle_model || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>Applied: {formatDate(driver.created_at)}</span>
                        </div>
                        {driver.is_online && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-600">Online</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {drivers.length === 0 && (
                    <div className="text-center py-8">
                      <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No drivers found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Driver Details Panel */}
          <div>
            {selectedDriver ? (
              <Card>
                <CardHeader>
                  <CardTitle>Driver Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedDriver.name}</p>
                      <p><strong>Phone:</strong> {selectedDriver.phone}</p>
                      <p><strong>Email:</strong> {selectedDriver.email || 'Not provided'}</p>
                      <p><strong>License:</strong> {selectedDriver.license_number || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Vehicle Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Model:</strong> {selectedDriver.vehicle_model || 'Not specified'}</p>
                      <p><strong>Color:</strong> {selectedDriver.vehicle_color}</p>
                      <p><strong>Plate:</strong> {selectedDriver.plate_number || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Status & Wallet</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Status:</strong> {getStatusBadge(selectedDriver.approved_status)}</p>
                      <p><strong>Wallet Balance:</strong> ${selectedDriver.wallet_balance}</p>
                      <p><strong>Online:</strong> {selectedDriver.is_online ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {selectedDriver.admin_notes && (
                    <div>
                      <h4 className="font-medium mb-2">Admin Notes</h4>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedDriver.admin_notes}</p>
                    </div>
                  )}

                  {selectedDriver.rejection_reason && (
                    <div>
                      <h4 className="font-medium mb-2">Rejection Reason</h4>
                      <p className="text-sm bg-red-50 p-2 rounded text-red-700">{selectedDriver.rejection_reason}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add admin notes..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />

                    {selectedDriver.approved_status === 'pending' && (
                      <>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate(selectedDriver.phone, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => {
                              if (rejectionReason.trim()) {
                                handleStatusUpdate(selectedDriver.phone, 'rejected');
                              } else {
                                toast({
                                  title: 'Rejection Reason Required',
                                  description: 'Please provide a reason for rejection.',
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Rejection reason (required for rejection)..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={2}
                        />
                      </>
                    )}

                    {selectedDriver.approved_status === 'approved' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleStatusUpdate(selectedDriver.phone, 'suspended')}
                      >
                        Suspend Driver
                      </Button>
                    )}

                    {selectedDriver.approved_status === 'suspended' && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(selectedDriver.phone, 'approved')}
                      >
                        Reactivate Driver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Driver</h3>
                  <p className="text-gray-500">Choose a driver from the list to view details and manage their status.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DriversManagement;
