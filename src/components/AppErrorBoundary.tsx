import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
  componentStack: string;
}

interface AppErrorBoundaryProps extends React.PropsWithChildren {
  scope?: string;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    errorStack: '',
    componentStack: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown render error',
      errorStack: error?.stack || '',
      componentStack: '',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ componentStack: errorInfo?.componentStack || '' });
    console.error('[AppErrorBoundary] Render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '', componentStack: '' });
    window.location.hash = '#/home';
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{ minHeight: '100vh', padding: '24px', background: '#f8fafc', color: '#0f172a' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>UI Runtime Error</h1>
        <p style={{ marginBottom: '8px' }}>页面渲染时发生错误，已拦截避免灰屏。</p>
        <p style={{ marginBottom: '8px' }}>Scope: <strong>{this.props.scope || 'app-root'}</strong></p>
        <pre style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
          {this.state.errorMessage}
        </pre>
        {this.state.componentStack && (
          <pre style={{ marginTop: '8px', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.componentStack}
          </pre>
        )}
        {this.state.errorStack && (
          <pre style={{ marginTop: '8px', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.errorStack}
          </pre>
        )}
        <button
          onClick={this.handleReset}
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: 'pointer',
          }}
        >
          返回首页并刷新
        </button>
      </div>
    );
  }
}
