import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`block w-full rounded-lg border ${error ? 'border-danger' : 'border-border'} bg-surface px-4 py-3 text-base text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-border-focus transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}
