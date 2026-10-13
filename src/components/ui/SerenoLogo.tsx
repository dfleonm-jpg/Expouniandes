/* eslint-disable @next/next/no-img-element */
// Logo propio de "Sereno": el cerebro provisto como asset (public/sereno-brain.avif),
// dentro de un contenedor redondeado con el degradado de marca para que luzca
// consistente en toda la app (header, sidebar, login, etc.).

export function SerenoLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-[28%] bg-gradient-to-br from-brand to-accent ${className}`}
      role="img"
      aria-label="Sereno"
    >
      <img
        src="/sereno-brain.avif"
        alt=""
        className="h-[72%] w-[72%] object-contain"
        draggable={false}
      />
    </span>
  );
}
