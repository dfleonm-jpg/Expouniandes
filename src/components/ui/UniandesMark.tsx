// Escudo de la Universidad de los Andes (negro/amarillo con la pluma central).
// Reproducción vectorial del escudo para uso dentro del proyecto ExpoUniandes.

export function UniandesMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 880 1024"
      className={className}
      aria-label="Escudo Universidad de los Andes"
      role="img"
    >
      {/* Contorno/borde negro del escudo */}
      <path
        fill="#000000"
        d="M14 44c0-14 10-26 25-28C120 5 268 0 440 0s320 5 401 16c15 2 25 14 25 28 0 206-6 392-26 540-18 134-50 232-105 304-66 86-168 136-295 136S211 974 145 888C90 816 58 718 40 584 20 436 14 250 14 44z"
      />
      {/* Campo amarillo interior */}
      <path
        fill="#FFE500"
        d="M78 86c0-9 7-17 17-18C170 60 300 56 440 56s270 4 345 12c10 1 17 9 17 18 0 196-6 373-24 512-16 124-45 213-93 276-56 73-141 114-245 114S251 947 195 874c-48-63-77-152-93-276C84 459 78 282 78 86z"
      />
      {/* Pluma/trazo negro central */}
      <path
        fill="#000000"
        d="M441 92c7 0 13 4 17 11 30 55 73 160 94 268 16 83 20 165 11 236-7 55-24 101-52 134-19 22-43 36-70 42-6 1-12-2-15-7-3-6-2-13 3-17 23-19 39-45 48-80 11-43 11-99 1-162-14-86-45-183-82-267-2-5-5-9-7-13-2 90-2 240 0 400 0 7-5 13-12 14-7 1-13-4-14-11-6-54-16-194-16-316 0-93 6-176 17-240 2-11 11-19 22-20 1 0 2-1 3-1h52z"
      />
    </svg>
  );
}
