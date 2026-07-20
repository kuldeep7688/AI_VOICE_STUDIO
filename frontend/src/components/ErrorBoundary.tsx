import { Component, type ReactNode, type ErrorInfo } from 'react';
import { createLogger } from '../lib/logger';

const log = createLogger('error-boundary');

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#e5e5e5' }}>
          Something went wrong. Check the console for details.
        </div>
      );
    }
    return this.props.children;
  }
}
