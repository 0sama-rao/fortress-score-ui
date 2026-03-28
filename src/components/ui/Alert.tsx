import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type Variant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

const config: Record<Variant, { bg: string; text: string; icon: typeof Info }> = {
  success: { bg: 'bg-success-light', text: 'text-emerald-800', icon: CheckCircle },
  error: { bg: 'bg-danger-light', text: 'text-red-800', icon: AlertCircle },
  warning: { bg: 'bg-warning-light', text: 'text-amber-800', icon: AlertTriangle },
  info: { bg: 'bg-primary-light', text: 'text-blue-800', icon: Info },
};

export default function Alert({ variant, children, className = '' }: AlertProps) {
  const { bg, text, icon: Icon } = config[variant];
  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${bg} ${text} ${className}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
