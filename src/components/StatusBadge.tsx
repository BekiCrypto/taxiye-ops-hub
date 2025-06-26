
import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
  className?: string;
}

const StatusBadge = ({ status, variant = 'default', className }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      // Trip statuses
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
      completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' },
      
      // Driver/Passenger statuses
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
      suspended: { label: 'Suspended', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      
      // Default
      default: { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };

    return configs[status as keyof typeof configs] || configs.default;
  };

  const config = getStatusConfig(status);

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.color,
      className
    )}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
