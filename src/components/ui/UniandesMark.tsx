/* eslint-disable @next/next/no-img-element */
// Escudo oficial de la Universidad de los Andes.
// El archivo oficial es el logo completo (escudo + texto); aquí recortamos
// SOLO el escudo para los usos en formato cuadrado (badges, sidebar).
// El escudo ocupa aprox. el 28% izquierdo del archivo (1485×552).

export function UniandesMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      role="img"
      aria-label="Escudo Universidad de los Andes"
      style={{ aspectRatio: "1 / 1" }}
    >
      <img
        src="/uniandes-logo.png"
        alt=""
        className="absolute left-0 top-1/2 h-full max-w-none -translate-y-1/2"
        style={{ width: "357%" }}
      />
    </span>
  );
}
