// Logo propio de "Sereno": un cerebro limpio y geométrico (aprendizaje +
// mente serena) dentro de un contenedor redondeado con el degradado de marca.
// Diseño original, simétrico y legible incluso en tamaño pequeño.

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
      {/* Realce superior sutil para dar volumen */}
      <rect width="48" height="48" rx="13" fill="#ffffff" fillOpacity="0.07" />

      {/* Cerebro: silueta rellena en blanco, simétrica y limpia */}
      <path
        fill="#ffffff"
        d="M24 11.5c-2.1-1.9-5.6-1.7-7.5.4-.6.7-1 1.5-1.2 2.4-2.3.1-4.2 2-4.2 4.4 0 .5.1 1 .2 1.4-1.7 1-2.6 3-2 4.9-1.3 1.3-1.5 3.4-.4 4.9.9 1.2 2.3 1.8 3.7 1.6.4 2 2.2 3.5 4.3 3.5.9 0 1.7-.3 2.4-.7.9.9 2.1 1.4 3.4 1.4V11.5h-1.9c.3 0 .7 0 1 .1-.4-.1-.8-.1-1.1-.1z"
        fillOpacity="0.95"
      />
      <path
        fill="#ffffff"
        d="M24 11.5c2.1-1.9 5.6-1.7 7.5.4.6.7 1 1.5 1.2 2.4 2.3.1 4.2 2 4.2 4.4 0 .5-.1 1-.2 1.4 1.7 1 2.6 3 2 4.9 1.3 1.3 1.5 3.4.4 4.9-.9 1.2-2.3 1.8-3.7 1.6-.4 2-2.2 3.5-4.3 3.5-.9 0-1.7-.3-2.4-.7-.9.9-2.1 1.4-3.4 1.4V11.5z"
        fillOpacity="0.72"
      />

      {/* Surcos internos (azules) que dan el aspecto de cerebro */}
      <g stroke="var(--brand, #3b6fe5)" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.75">
        <path d="M24 15v19" />
        <path d="M19.5 18.5c1.8.2 3 1.6 3 3.3" />
        <path d="M17 24c2.3.1 4 1.8 4 3.9" />
        <path d="M28.5 18.5c-1.8.2-3 1.6-3 3.3" />
        <path d="M31 24c-2.3.1-4 1.8-4 3.9" />
      </g>
    </svg>
  );
}
