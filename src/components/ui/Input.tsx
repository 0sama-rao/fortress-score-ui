import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <input
        id={id}
        className={`block w-full rounded-lg px-4 py-3 text-sm transition-all focus:outline-none ${className}`}
        style={{
          backgroundColor: 'var(--color-background)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          color: 'var(--color-text)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border-focus)';
          e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'}`;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}
