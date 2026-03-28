import type { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="h-14 w-14 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-surface-2)' }}
      >
        <Icon className="h-6 w-6" style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}
