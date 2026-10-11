"use client";

import { useCallback } from "react";
import { useApp } from "./app-context";
import { useToast } from "@/components/ui/Toast";

/** Hook para copiar texto al portapapeles mostrando un toast de resultado. */
export function useCopy() {
  const { t } = useApp();
  const { notify } = useToast();

  return useCallback(
    async (text: string, successMsg?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notify("success", successMsg ?? t.ui.copied);
        return true;
      } catch {
        notify("error", t.common.error);
        return false;
      }
    },
    [notify, t]
  );
}
