// Logo propio de "Sereno": un cerebro estilizado (aprendizaje + mente serena)
// dentro de un contenedor redondeado con el degradado de marca. Diseño
// original, legible incluso en tamaño pequeño.

export function SerenoLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="Sereno" role="img" fill="none">
      <defs>
        <linearGradient id="serenoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand, #3b6fe5)" />
          <stop offset="100%" stopColor="var(--accent, #38bdf8)" />
        </linearGradient>
      </defs>

      {/* Contenedor redondeado con el degradado de marca */}
      <rect width="48" height="48" rx="13" fill="url(#serenoBg)" />
      <rect width="48" height="48" rx="13" fill="#ffffff" fillOpacity="0.06" />

      {/* Cerebro estilizado (dos hemisferios + surco central) */}
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Hemisferio izquierdo */}
        <path d="M22 15.5c-3.2-1.2-6.6 0.3-7.6 3.3c-2.6 0.4-4.2 2.7-3.6 5.1c-1.8 1.6-1.9 4.1-0.2 5.8c-0.4 2.4 1.2 4.6 3.7 4.9c1 2.1 3.6 3 5.9 2.1" />
        {/* Hemisferio derecho */}
        <path d="M26 15.5c3.2-1.2 6.6 0.3 7.6 3.3c2.6 0.4 4.2 2.7 3.6 5.1c1.8 1.6 1.9 4.1 0.2 5.8c0.4 2.4-1.2 4.6-3.7 4.9c-1 2.1-3.6 3-5.9 2.1" />
        {/* Surco central / tallo */}
        <path d="M24 13.5v22" />
        {/* Pliegues internos (dan el aspecto de cerebro) */}
        <path d="M24 20c-1.8 0.3-3 1.8-2.8 3.4" strokeWidth="2" />
        <path d="M24 26c-2.2 0.2-3.8 1.8-3.6 3.8" strokeWidth="2" />
        <path d="M24 20c1.8 0.3 3 1.8 2.8 3.4" strokeWidth="2" />
        <path d="M24 26c2.2 0.2 3.8 1.8 3.6 3.8" strokeWidth="2" />
      </g>
    </svg>
  );
}
