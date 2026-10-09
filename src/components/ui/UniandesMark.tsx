// Marca gráfica inspirada en la identidad de la Universidad de los Andes
// (campanas / arcos amarillos sobre negro). Es una representación estilizada
// propia, no el logotipo oficial, para evitar problemas de marca registrada.

export function UniandesMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <rect width="48" height="48" rx="10" fill="#111113" />
      {/* Tres "campanas" / arcos característicos */}
      <path d="M9 36V22a6 6 0 0 1 12 0v14" stroke="#FFD200" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M18 36V18a6 6 0 0 1 12 0v18" stroke="#FFD200" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M27 36V24a6 6 0 0 1 12 0v12" stroke="#FFD200" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
