// Marca gráfica propia de "Sereno" — inspirada en la paleta negra/amarilla.
// NO es el logotipo oficial de ninguna institución; es un diseño original
// (tres arcos ascendentes = crecimiento/aprendizaje) para evitar problemas
// de marca registrada.

export function UniandesMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="serenoMarkBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1a1f" />
          <stop offset="100%" stopColor="#0a0a0e" />
        </linearGradient>
        <linearGradient id="serenoMarkArc" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FFE07A" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#serenoMarkBg)" />
      <rect x="0.6" y="0.6" width="46.8" height="46.8" rx="11.4" fill="none" stroke="#FFD200" strokeOpacity="0.25" strokeWidth="1.2" />
      {/* Tres arcos ascendentes (crecimiento) */}
      <path d="M10 37V24a5 5 0 0 1 10 0v13" stroke="url(#serenoMarkArc)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M19 37V18.5a5 5 0 0 1 10 0V37" stroke="url(#serenoMarkArc)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M28 37V21a5 5 0 0 1 10 0v16" stroke="url(#serenoMarkArc)" strokeWidth="3.4" strokeLinecap="round" />
      {/* Base */}
      <rect x="9" y="37.5" width="30" height="2.6" rx="1.3" fill="#FFD200" />
    </svg>
  );
}
