import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <Shield className="h-12 w-12 mb-4" style={{ color: 'var(--color-text-muted)' }} />
      <div className="text-6xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
        404
      </div>
      <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        Page not found
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        This page doesn't exist or you don't have access to it.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
