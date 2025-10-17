import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@vaadin/react-components/Button';
import { Icon } from '@vaadin/react-components/Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: 'var(--lumo-contrast-5pct)',
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Icon
                icon="vaadin:warning"
                style={{
                  fontSize: '4rem',
                  color: 'var(--lumo-error-color)',
                  marginBottom: '1rem',
                }}
              />
              <h1 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}>
                Application Error
              </h1>
              <p style={{
                margin: 0,
                color: 'var(--lumo-secondary-text-color)',
              }}>
                Something went wrong. Please try reloading the page.
              </p>
            </div>

            {isDevelopment && this.state.error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--lumo-error-color-10pct)',
                borderRadius: '4px',
                border: '1px solid var(--lumo-error-color-50pct)',
              }}>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: 'var(--lumo-error-text-color)',
                }}>
                  Error Details:
                </h3>
                <pre style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'var(--lumo-error-text-color)',
                }}>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details style={{ marginTop: '1rem' }}>
                    <summary style={{
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'var(--lumo-error-text-color)',
                    }}>
                      Component Stack
                    </summary>
                    <pre style={{
                      margin: '0.5rem 0 0 0',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'var(--lumo-error-text-color)',
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
            }}>
              <Button
                theme="primary"
                onClick={this.handleReload}
              >
                <Icon icon="vaadin:refresh" slot="prefix" />
                Reload Page
              </Button>
              <Button
                theme="tertiary"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
