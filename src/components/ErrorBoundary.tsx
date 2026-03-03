import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "hsl(0 0% 96%)",
            color: "hsl(0 0% 9%)",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Une erreur s&apos;est produite
          </h1>
          <p style={{ fontSize: "0.875rem", color: "hsl(0 0% 45%)", maxWidth: "400px" }}>
            Rechargez la page. Si le problème persiste, essayez de vider le cache du navigateur.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              background: "hsl(161 93% 30%)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
