import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, type ToastVariant } from '../../context/ToastContext';

const config: Record<ToastVariant, { icon: typeof Info; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle,  color: '#86efac', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)'  },
  error:   { icon: AlertCircle,  color: '#fca5a5', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
  warning: { icon: AlertTriangle,color: '#fde047', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)'  },
  info:    { icon: Info,         color: '#93c5fd', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
};

/* Mount this once inside App, outside all routes */
export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const { icon: Icon, color, bg, border } = config[t.variant];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm pointer-events-auto"
            style={{
              backgroundColor: bg,
              border: `1px solid ${border}`,
              color,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              minWidth: '280px',
              maxWidth: '380px',
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
