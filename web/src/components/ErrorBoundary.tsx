import React from "react";

type State = { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo };

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  State
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an external service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-900 min-h-screen">
          <h1 className="text-2xl font-semibold mb-2">
            Uygulama hatası oluştu
          </h1>
          <p className="mb-4">
            Konsolu kontrol edin veya aşağıdaki hatayı inceleyin:
          </p>
          <pre className="whitespace-pre-wrap overflow-auto">
            {this.state.error?.toString()}
          </pre>
          {this.state.errorInfo && (
            <details className="mt-4 whitespace-pre-wrap">
              <summary className="cursor-pointer">Hata ayrıntıları</summary>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
