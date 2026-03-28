import type { ReactNode } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const styles: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-success-light text-emerald-800',
  warning: 'bg-warning-light text-amber-800',
  danger: 'bg-danger-light text-red-800',
  info: 'bg-primary-light text-blue-800',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
