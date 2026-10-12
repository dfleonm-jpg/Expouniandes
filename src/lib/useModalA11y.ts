"use client";

import { useEffect, useRef } from "react";

/**
 * Accesibilidad para diálogos/modales:
 *  - Cierra con la tecla Escape.
 *  - Atrapa el foco dentro del modal (Tab/Shift+Tab circulan).
 *  - Al abrir, enfoca el primer elemento interactivo.
 *  - Al cerrar, devuelve el foco al elemento que lo abrió.
 *
 * Uso: const ref = useModalA11y(open, onClose); <div ref={ref} role="dialog" ...>
 */
export function useModalA11y(open: boolean, onClose?: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement;

    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    // Enfoca el primer control al abrir.
    const first = focusables()[0];
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Devuelve el foco al disparador.
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}
