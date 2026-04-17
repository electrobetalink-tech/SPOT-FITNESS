"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Une erreur inattendue est survenue.</h2>
            <p className="max-w-md text-slate-600">Rechargez la page ou contactez un SuperAdmin si le problème persiste.</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              Réessayer
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
