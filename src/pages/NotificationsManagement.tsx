
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
import { Bell, BellRing, User, Calendar, Send, Plus, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const NotificationsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'general',
    driver_phone_ref: ''
  });
  const { toast } = useToast();

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', searchTerm, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%,driver_phone_ref.ilike.%${searchTerm}%`);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('phone, name')
        .eq('approved_status', 'approved')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const handleCreateNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const notificationData = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        driver_phone_ref: newNotification.driver_phone_ref || null,
        is_read: false
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (error) throw error;

      toast({
        title: 'Notification Sent',
        description: 'Notification has been created successfully.'
      });

      setNewNotification({
        title: '',
        message: '',
        type: 'general',
        driver_phone_ref: ''
      });
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create notification.',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: 'Marked as Read',
        description: 'Notification has been marked as read.'
      });
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification.',
        variant: 'destructive'
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'alert':
        return <Badge className="bg-red-100 text-red-800">Alert</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">General</Badge>;
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
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    alerts: notifications.filter(n => n.type === 'alert').length,
    broadcast: notifications.filter(n => !n.driver_phone_ref).length
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications Management</h1>
            <p className="text-gray-600">Create and manage system notifications</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Notification
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BellRing className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-2xl font-bold">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alerts</p>
                  <p className="text-2xl font-bold">{stats.alerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Send className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Broadcast</p>
                  <p className="text-2xl font-bold">{stats.broadcast}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search notifications..."
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
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notifications List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(notification.type)}
                          <div>
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-sm text-gray-600">
                              {notification.driver_phone_ref ? 
                                `To: ${notification.driver_phone_ref}` : 
                                'To: All drivers (Broadcast)'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(notification.type)}
                          {!notification.is_read && (
                            <Badge variant="outline" className="bg-yellow-50">
                              Unread
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded">
                        {notification.message}
                      </p>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {formatDate(notification.created_at)}</span>
                        </div>
                        {!notification.is_read && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No notifications found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Notification Form */}
          <div>
            {showCreateForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Notification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      placeholder="Notification title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      placeholder="Notification message"
                      rows={4}
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select 
                      value={newNotification.type} 
                      onValueChange={(value) => setNewNotification({...newNotification, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Driver (Optional)</label>
                    <Select 
                      value={newNotification.driver_phone_ref} 
                      onValueChange={(value) => setNewNotification({...newNotification, driver_phone_ref: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All drivers (broadcast)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All drivers (broadcast)</SelectItem>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.phone} value={driver.phone}>
                            {driver.name} ({driver.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={handleCreateNotification}
                      disabled={!newNotification.title.trim() || !newNotification.message.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Notification
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Create Notification</h3>
                  <p className="text-gray-500 mb-4">Send notifications to drivers or broadcast to all users.</p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsManagement;
