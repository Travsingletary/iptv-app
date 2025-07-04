import React, { ErrorInfo } from 'react';
import { logError } from '../utils/errorLogger';

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, { context: 'AppErrorBoundary', extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      // Default fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-8">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-xl text-center">
            An unexpected error occurred. Please try again. If the problem persists, contact support.
          </p>
          <button
            onClick={this.handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}