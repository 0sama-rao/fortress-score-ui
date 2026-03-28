import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  isLoading?: boolean;
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary:   { backgroundColor: 'var(--color-primary)', color: '#fff' },
  secondary: { backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
  danger:    { backgroundColor: 'var(--color-danger)', color: '#fff' },
  ghost:     { backgroundColor: 'transparent', color: 'var(--color-text-secondary)' },
};

const hoverMap: Record<Variant, string> = {
  primary:   'hover:opacity-90',
  secondary: 'hover:opacity-80',
  danger:    'hover:opacity-90',
  ghost:     'hover:opacity-80',
};

export default function Button({
  variant = 'primary',
  children,
  isLoading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      style={variantStyles[variant]}
      className={`inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${hoverMap[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
