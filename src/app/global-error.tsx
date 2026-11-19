"use client";

import { useEffect } from "react";

/**
 * Error boundary de último recurso (reemplaza incluso el layout raíz si este
 * falla). Debe renderizar sus propios <html> y <body>.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0e", color: "#f2f3f5", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Algo salió mal</h1>
          <p style={{ color: "#8b919d", fontSize: "14px", marginTop: "8px" }}>
            Ocurrió un error inesperado. Intenta recargar la aplicación.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: "20px", background: "#4f7cf0", color: "#fff", border: 0, borderRadius: "12px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
