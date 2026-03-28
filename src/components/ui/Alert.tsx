import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type Variant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

const config: Record<Variant, { bg: string; border: string; text: string; icon: typeof Info }> = {
  success: { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   text: '#86efac', icon: CheckCircle },
  error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   text: '#fca5a5', icon: AlertCircle },
  warning: { bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.25)',   text: '#fde047', icon: AlertTriangle },
  info:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  text: '#93c5fd', icon: Info },
};

export default function Alert({ variant, children, className = '' }: AlertProps) {
  const { bg, border, text, icon: Icon } = config[variant];
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${className}`}
      style={{ backgroundColor: bg, border: `1px solid ${border}`, color: text }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
