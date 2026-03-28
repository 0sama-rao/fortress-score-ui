interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
const borders = { sm: 'border-2', md: 'border-2', lg: 'border-4' };

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-t-transparent ${sizes[size]} ${borders[size]} ${className}`}
      style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
    />
  );
}
