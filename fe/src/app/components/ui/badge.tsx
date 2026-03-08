import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-primary text-primary-foreground': variant === 'default',
          'bg-success text-success-foreground': variant === 'success',
          'bg-danger text-danger-foreground': variant === 'danger',
          'bg-warning text-warning-foreground': variant === 'warning',
          'bg-info text-info-foreground': variant === 'info',
          'border border-border bg-transparent': variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
