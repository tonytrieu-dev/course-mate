import React from 'react';
import { logger } from '../utils/logger.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    logger.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props.name ? { boundaryName: this.props.name } : {}
    });

    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
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
              >
                Try Again
              </button>
              
              {this.props.onReport && (
                <button 
                  onClick={() => this.props.onReport(this.state.error)}
                  className="error-boundary-report-btn"
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

export default ErrorBoundary;