// Logo propio de "Sereno": una hoja/llama serena formada por dos trazos que
// ascienden (calma + crecimiento), dentro de un contenedor redondeado con el
// degradado de marca. Diseño original, legible incluso en tamaño pequeño.

export function SerenoLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="Sereno" role="img" fill="none">
      <defs>
        <linearGradient id="serenoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand, #4f7cff)" />
          <stop offset="100%" stopColor="var(--accent, #2dd4bf)" />
        </linearGradient>
        <linearGradient id="serenoLeaf" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Contenedor redondeado con el degradado de marca */}
      <rect width="48" height="48" rx="13" fill="url(#serenoBg)" />
      {/* Realce superior sutil para dar volumen */}
      <rect width="48" height="48" rx="13" fill="url(#serenoLeaf)" fillOpacity="0.06" />

      {/* Hoja serena: dos mitades que forman una gota/llama ascendente */}
      <path
        d="M24 9c-6.5 5.5-10 11.2-10 17.2C14 32.6 18.4 37 24 37V9z"
        fill="url(#serenoLeaf)"
        fillOpacity="0.95"
      />
      <path
        d="M24 9c6.5 5.5 10 11.2 10 17.2C34 32.6 29.6 37 24 37V9z"
        fill="url(#serenoLeaf)"
        fillOpacity="0.6"
      />
      {/* Nervadura central (trazo que sube = progreso) */}
      <path
        d="M24 34.5V13"
        stroke="var(--brand, #4f7cff)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
