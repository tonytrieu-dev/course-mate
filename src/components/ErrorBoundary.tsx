import * as React from 'react';
import { logger } from '../utils/logger';
// import { captureError, addSentryBreadcrumb } from '../config/sentry';

// Define comprehensive interfaces for ErrorBoundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
  name?: string;
  fallback?: React.ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReport?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error details
    logger.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props.name ? { boundaryName: this.props.name } : {}
    });

    // Send to Sentry with full context (disabled)
    // captureError(error, {
    //   component: this.props.name || 'ErrorBoundary',
    //   action: 'componentDidCatch',
    //   metadata: {
    //     componentStack: errorInfo.componentStack,
    //     errorBoundaryName: this.props.name
    //   }
    // });

    // Add breadcrumb for debugging context (disabled)
    // addSentryBreadcrumb(
    //   `Error caught by ${this.props.name || 'ErrorBoundary'}`,
    //   'error',
    //   {
    //     errorMessage: error.message,
    //     componentStack: errorInfo.componentStack?.slice(0, 500) // Truncate for readability
    //   }
    // );

    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReport = (): void => {
    if (this.props.onReport && this.state.error) {
      this.props.onReport(this.state.error);
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-boundary-content">
            <h2 className="error-boundary-title">
              🚨 Something went wrong
            </h2>
            <p className="error-boundary-message">
              {this.props.name ? `Error in ${this.props.name}` : 'An unexpected error occurred'}
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="error-boundary-details">
                <summary>Technical Details</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="error-boundary-actions">
              <button 
                onClick={this.handleRetry}
                className="error-boundary-retry-btn"
                aria-label="Retry the failed operation"
                type="button"
              >
                Try Again
              </button>
              
              {this.props.onReport && (
                <button 
                  onClick={this.handleReport}
                  className="error-boundary-report-btn"
                  aria-label="Report this error to support"
                  type="button"
                >
                  Report Issue
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default props are handled through interface default values and optional parameters

export default ErrorBoundary;