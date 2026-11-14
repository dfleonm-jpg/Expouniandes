/* eslint-disable @next/next/no-img-element */
// Logo de "Sereno": símbolo a pincel (public/sereno-logo.jpg, negro sobre blanco).
// Como la app es de tema oscuro, invertimos la imagen y usamos "screen" para que
// el fondo blanco desaparezca y el trazo quede claro, sin recuadro.

export function SerenoLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      role="img"
      aria-label="Sereno"
    >
      <img
        src="/sereno-logo.jpg"
        alt=""
        className="h-full w-full object-contain"
        style={{ mixBlendMode: "screen", filter: "invert(1) contrast(1.1)" }}
        draggable={false}
      />
    </span>
  );
}
