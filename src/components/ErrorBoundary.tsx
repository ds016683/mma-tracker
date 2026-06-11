import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; name?: string; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[ErrorBoundary:${this.props.name}]`, error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <div className="font-semibold mb-2">Page error{this.props.name ? ` — ${this.props.name}` : ''}</div>
            <pre className="whitespace-pre-wrap text-xs opacity-80">{this.state.error.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
