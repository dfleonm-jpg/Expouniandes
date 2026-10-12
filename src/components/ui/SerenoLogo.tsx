// Logo propio de "Sereno": un cerebro moderno y limpio dentro de un
// contenedor redondeado con el degradado de marca. Diseño original,
// simétrico y legible incluso en tamaño pequeño (favicon).

export function SerenoLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Sereno" role="img" fill="none">
      <defs>
        <linearGradient id="serenoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand, #3b6fe5)" />
          <stop offset="100%" stopColor="var(--accent, #38bdf8)" />
        </linearGradient>
        <linearGradient id="serenoBrain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8f0ff" />
        </linearGradient>
      </defs>

      {/* Contenedor redondeado con el degradado de marca */}
      <rect width="64" height="64" rx="17" fill="url(#serenoBg)" />
      {/* Realce superior sutil para dar volumen */}
      <rect width="64" height="64" rx="17" fill="#ffffff" fillOpacity="0.08" />

      {/* Cerebro: silueta limpia y rellena, simétrica */}
      <path
        fill="url(#serenoBrain)"
        d="M32 17.5c-2.3-2.6-6.4-2.9-9-.6-1 .9-1.7 2-2 3.3-3 .1-5.3 2.6-5.3 5.6 0 .5.1 1 .2 1.5-2.3 1.1-3.6 3.6-3 6.1-1.8 1.6-2.2 4.3-.8 6.3 1 1.5 2.7 2.3 4.5 2.2.6 2.6 2.9 4.5 5.7 4.5 1.1 0 2.1-.3 3-.8 1.1 1.1 2.6 1.7 4.2 1.7h2.5V17.5H32z"
      />
      <path
        fill="url(#serenoBrain)"
        fillOpacity="0.82"
        d="M32 17.5c2.3-2.6 6.4-2.9 9-.6 1 .9 1.7 2 2 3.3 3 .1 5.3 2.6 5.3 5.6 0 .5-.1 1-.2 1.5 2.3 1.1 3.6 3.6 3 6.1 1.8 1.6 2.2 4.3.8 6.3-1 1.5-2.7 2.3-4.5 2.2-.6 2.6-2.9 4.5-5.7 4.5-1.1 0-2.1-.3-3-.8-1.1 1.1-2.6 1.7-4.2 1.7h-2.5V17.5H32z"
      />

      {/* Surcos internos (azules) que dan el aspecto de cerebro */}
      <g stroke="var(--brand, #3b6fe5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8">
        {/* surco central */}
        <path d="M32 20v27" />
        {/* lado izquierdo */}
        <path d="M25.5 24.5c2.4.2 4.2 2.2 4.2 4.6" />
        <path d="M22 32.5c3.1.2 5.5 2.6 5.5 5.7" />
        {/* lado derecho */}
        <path d="M38.5 24.5c-2.4.2-4.2 2.2-4.2 4.6" />
        <path d="M42 32.5c-3.1.2-5.5 2.6-5.5 5.7" />
      </g>
    </svg>
  );
}
