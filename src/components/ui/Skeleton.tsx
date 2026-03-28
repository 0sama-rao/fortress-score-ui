interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ backgroundColor: 'var(--color-surface-2)' }}
    />
  );
}

/* Preset layouts */
export function SkeletonCard() {
  return (
    <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-32 ml-auto" />
    </div>
  );
}
