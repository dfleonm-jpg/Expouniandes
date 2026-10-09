// Extracción de texto en el navegador desde archivos de texto y PDFs.
// Para PDFs escaneados (sin texto embebido) usa OCR con Tesseract.js.
// Todo ocurre en el cliente: no sube archivos a ningún servidor.

export type ExtractProgress = {
  stage: "reading" | "pdf" | "ocr" | "done";
  page?: number;
  totalPages?: number;
  percent?: number;
};

const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.worker.min.mjs";
const OCR_MIN_CHARS_PER_PAGE = 20; // si una página tiene menos texto, se considera escaneada

/** Extrae texto de un File (.txt, .md, .pdf). Llama onProgress para feedback. */
export async function extractText(
  file: File,
  onProgress?: (p: ExtractProgress) => void
): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    onProgress?.({ stage: "reading" });
    const text = await file.text();
    onProgress?.({ stage: "done" });
    return text;
  }

  return extractPdf(file, onProgress);
}

async function extractPdf(file: File, onProgress?: (p: ExtractProgress) => void): Promise<string> {
  onProgress?.({ stage: "pdf" });

  // Carga perezosa de pdfjs (solo en cliente).
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;

  const pageTexts: string[] = [];
  const scannedPages: number[] = [];

  // 1) Intento de extracción de texto embebido página por página.
  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({ stage: "pdf", page: i, totalPages, percent: Math.round((i / totalPages) * 100) });
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => ("str" in it ? it.str : "")).join(" ").trim();
    pageTexts.push(text);
    if (text.length < OCR_MIN_CHARS_PER_PAGE) scannedPages.push(i);
  }

  // 2) Si hay páginas escaneadas (poco o ningún texto), aplica OCR.
  if (scannedPages.length > 0) {
    const { createWorker } = await import("tesseract.js");
    // Español + inglés cubren la mayoría de casos académicos.
    const worker = await createWorker(["spa", "eng"]);
    try {
      for (let idx = 0; idx < scannedPages.length; idx++) {
        const pageNum = scannedPages[idx];
        onProgress?.({
          stage: "ocr",
          page: idx + 1,
          totalPages: scannedPages.length,
          percent: Math.round(((idx + 1) / scannedPages.length) * 100),
        });
        const canvas = await renderPageToCanvas(pdf, pageNum);
        const { data } = await worker.recognize(canvas);
        pageTexts[pageNum - 1] = data.text.trim();
      }
    } finally {
      await worker.terminate();
    }
  }

  onProgress?.({ stage: "done" });
  return pageTexts.filter(Boolean).join("\n\n").trim();
}

async function renderPageToCanvas(
  pdf: Awaited<ReturnType<Awaited<typeof import("pdfjs-dist")>["getDocument"]>["promise"]>,
  pageNum: number
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2 }); // escala alta mejora el OCR
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}
