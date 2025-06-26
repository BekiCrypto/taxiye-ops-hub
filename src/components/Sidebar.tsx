
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  User, 
  Car,
  Phone,
  Ticket,
  Wallet,
  Bell,
  Settings,
  Shield,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  userRole: string;
}

const Sidebar = ({ isCollapsed, userRole }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: ['super_admin', 'operations_staff', 'dispatch_agent', 'support_agent']
    },
    {
      title: 'Live Map',
      icon: Map,
      href: '/live-map',
      roles: ['super_admin', 'operations_staff', 'dispatch_agent']
    },
    {
      title: 'Call Center',
      icon: Phone,
      href: '/call-center',
      roles: ['super_admin', 'dispatch_agent']
    },
    {
      title: 'Drivers',
      icon: Car,
      href: '/drivers',
      roles: ['super_admin', 'operations_staff']
    },
    {
      title: 'Passengers',
      icon: Users,
      href: '/passengers',
      roles: ['super_admin', 'operations_staff']
    },
    {
      title: 'Trips',
      icon: FileText,
      href: '/trips',
      roles: ['super_admin', 'operations_staff', 'dispatch_agent']
    },
    {
      title: 'Wallet & Transactions',
      icon: Wallet,
      href: '/wallet',
      roles: ['super_admin', 'operations_staff']
    },
    {
      title: 'Notifications',
      icon: Bell,
      href: '/notifications',
      roles: ['super_admin', 'operations_staff']
    },
    {
      title: 'Support Tickets',
      icon: Ticket,
      href: '/support',
      roles: ['super_admin', 'support_agent']
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/settings',
      roles: ['super_admin']
    },
    {
      title: 'Admin Roles',
      icon: Shield,
      href: '/admin-roles',
      roles: ['super_admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className={cn(
      "bg-slate-900 text-white h-screen transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">Taxiye</h1>
              <p className="text-xs text-slate-400">Admin Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium">{item.title}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-slate-400 capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
