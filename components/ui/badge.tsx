import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-100',
    outline: 'border border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-200',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}


