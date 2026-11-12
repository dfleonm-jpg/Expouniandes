"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Avatar circular: muestra la foto si existe y carga bien; si no hay foto
 * (o falla al cargar) cae a la inicial del nombre sobre el degradado de marca.
 */
export function Avatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: string | null;
  className?: string;
}) {
  // Guarda la URL que falló, así un cambio de foto vuelve a intentarse sin efectos.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = !!photo && failedUrl !== photo;

  if (showPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(photo)}
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-bold text-white",
        className
      )}
    >
      {(name || "?").trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
