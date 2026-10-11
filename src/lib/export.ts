// Utilidades de exportación en el cliente (sin librerías de pago).
// - descargar texto como archivo .txt/.md
// - imprimir/guardar como PDF usando el diálogo del navegador

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Abre una ventana con el HTML dado y lanza el diálogo de impresión (PDF). */
export function printHTML(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a2e; max-width: 720px; margin: 40px auto; padding: 0 24px; line-height: 1.6; }
  h1 { color: #6d28d9; font-size: 24px; border-bottom: 3px solid #8b5cf6; padding-bottom: 8px; }
  h2 { color: #4338ca; font-size: 18px; margin-top: 28px; }
  .brand { display: flex; align-items: center; gap: 8px; color: #8b5cf6; font-weight: 700; font-size: 13px; letter-spacing: .5px; margin-bottom: 4px; }
  .meta { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
  ul { padding-left: 20px; }
  li { margin: 6px 0; }
  .q { margin: 18px 0; padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 10px; }
  .q .num { color: #8b5cf6; font-weight: 700; }
  .correct { color: #059669; font-weight: 600; }
  .exp { color: #6b7280; font-size: 14px; margin-top: 6px; }
  code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>${bodyHtml}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body>
</html>`);
  w.document.close();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Descarga contenido como archivo .md */
export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : filename + ".md";
  a.click();
  URL.revokeObjectURL(url);
}

export type CalEvent = { title: string; date: string; durationMin?: number; description?: string };

/** Genera y descarga un archivo .ics (calendario) con los eventos dados. */
export function downloadICS(filename: string, events: CalEvent[]) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sereno//ExpoUniandes//ES", "CALSCALE:GREGORIAN"];
  for (const ev of events) {
    const start = new Date(ev.date + "T09:00:00");
    const end = new Date(start.getTime() + (ev.durationMin ?? 60) * 60000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}@sereno`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${escapeICS(ev.title)}`,
      ev.description ? `DESCRIPTION:${escapeICS(ev.description)}` : "",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.filter(Boolean).join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : filename + ".ics";
  a.click();
  URL.revokeObjectURL(url);
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
