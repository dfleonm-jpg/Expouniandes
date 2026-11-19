"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Página de error de Next (App Router): captura errores de render en el árbol
 * de la app y ofrece recuperación sin dejar la pantalla en blanco.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Registro mínimo (lo recoge el proveedor de logs del hosting).
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="aurora-bg" />
      <div className="glass-strong max-w-md rounded-3xl p-8">
        <p className="text-5xl">🌧️</p>
        <h1 className="mt-3 text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted">
          Tuvimos un problema inesperado. Puedes reintentar; si persiste, recarga la página.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-gradient-to-r from-brand to-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-white/5"
          >
            Ir al inicio
          </Link>
        </div>
        {error?.digest && <p className="mt-4 text-[11px] text-muted">Ref: {error.digest}</p>}
      </div>
    </div>
  );
}
