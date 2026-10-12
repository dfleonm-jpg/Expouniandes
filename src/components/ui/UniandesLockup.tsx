/* eslint-disable @next/next/no-img-element */
// Logo completo oficial de la Universidad de los Andes (escudo + texto).
// Para usar donde hay espacio horizontal (p. ej. el footer).

export function UniandesLockup({ className = "" }: { className?: string }) {
  return (
    <img
      src="/uniandes-logo.png"
      alt="Universidad de los Andes"
      className={className}
      style={{ height: "auto" }}
    />
  );
}
