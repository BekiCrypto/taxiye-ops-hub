
export interface Admin {
  id: string;
  email: string;
  role: 'super_admin' | 'dispatch_agent' | 'support_agent' | 'operations_staff';
  created_at: string;
}

export interface Trip {
  id: string;
  passenger_id: string;
  driver_id: string;
  pickup_location: string;
  dropoff_location: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  fare: number;
  created_at: string;
  completed_at?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  wallet_balance: number;
  total_trips: number;
  rating: number;
  vehicle_info: {
    make: string;
    model: string;
    year: number;
    plate_number: string;
  };
  created_at: string;
}

export interface Passenger {
  id: string;
  name: string;
  phone: string;
  email: string;
  wallet_balance: number;
  total_trips: number;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface KPIData {
  totalTripsToday: number;
  activeDrivers: number;
  activePassengers: number;
  totalEarnings: number;
  completionRate: number;
}
