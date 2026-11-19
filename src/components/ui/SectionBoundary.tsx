"use client";

import { Component, type ReactNode } from "react";

/**
 * Error Boundary que aísla una sección: si una vista crashea en render, no
 * tumba toda la app; muestra un aviso con opción de reintentar.
 */
export class SectionBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Section crashed:", error);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-4xl">🌧️</p>
          <h2 className="mt-3 text-lg font-semibold">Esta sección tuvo un problema</h2>
          <p className="mt-2 text-sm text-muted">
            Puedes reintentar o cambiar de sección. El resto de la app sigue funcionando.
          </p>
          <button
            onClick={this.reset}
            className="mt-5 rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
