import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card/80 backdrop-blur-sm text-card-foreground',
        'transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6 pb-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('font-semibold text-lg', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6 pt-0 flex items-center', className)} {...props}>
      {children}
    </div>
  );
};
