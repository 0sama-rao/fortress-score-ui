import { Component, type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center text-center px-4"
          style={{ backgroundColor: 'var(--color-background)' }}
        >
          <ShieldAlert className="h-12 w-12 mb-4" style={{ color: 'var(--color-danger)' }} />
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Something went wrong
          </h1>
          <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {this.state.message || 'An unexpected error occurred. Refresh to try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
