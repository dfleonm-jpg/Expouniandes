import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="aurora-bg" />
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-3 text-xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        La página que buscas no existe o fue movida. Volvamos a un lugar seguro.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
