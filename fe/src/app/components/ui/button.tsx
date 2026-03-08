import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]',
        up: 'bg-gradient-to-r from-success to-emerald-600 text-success-foreground hover:shadow-lg hover:shadow-success/30 hover:scale-[1.02] active:scale-[0.98]',
        down: 'bg-gradient-to-r from-danger to-rose-600 text-danger-foreground hover:shadow-lg hover:shadow-danger/30 hover:scale-[1.02] active:scale-[0.98]',
        outline: 'border-2 border-amber-500/50 bg-transparent text-amber-500 hover:bg-amber-500/10 hover:border-amber-500',
        ghost: 'bg-transparent hover:bg-amber-500/10 text-amber-400',
      },
      size: {
        default: 'px-5 py-2.5',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5',
        lg: 'px-8 py-4 text-lg',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
