// Búsqueda ligera sobre el contenido local del usuario (apuntes, resúmenes).
// Divide los documentos en fragmentos y los puntúa por relevancia frente a
// la consulta (coincidencia de términos + proximidad), sin depender de APIs.
// Rápida, gratis y funciona sin conexión.

export type SearchChunk = {
  docId: string;
  docName: string;
  text: string;
  score: number;
};

const STOPWORDS = new Set([
  // es
  "el","la","los","las","un","una","unos","unas","de","del","y","o","que","en","a","con","por","para","es","son","se","su","al","lo","como","más","pero","sus","le","ya","o","este","esta","entre",
  // en
  "the","a","an","of","and","or","to","in","is","are","it","this","that","for","on","with","as","by","be","at","from","how","what","why","which",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Divide un texto en fragmentos de ~`size` caracteres respetando párrafos. */
function chunkText(text: string, size = 500): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buffer = "";
  for (const p of paragraphs) {
    if ((buffer + "\n\n" + p).length > size && buffer) {
      chunks.push(buffer.trim());
      buffer = p;
    } else {
      buffer = buffer ? `${buffer}\n\n${p}` : p;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  // Si un párrafo era enorme, trocéalo también.
  return chunks.flatMap((c) =>
    c.length > size * 2 ? (c.match(new RegExp(`[\\s\\S]{1,${size}}`, "g")) ?? [c]) : [c]
  );
}

/** Busca los fragmentos más relevantes para la consulta en los documentos dados. */
export function searchDocs(
  query: string,
  docs: { id: string; name: string; content: string }[],
  limit = 6
): SearchChunk[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];
  const querySet = new Set(queryTerms);

  const results: SearchChunk[] = [];

  for (const doc of docs) {
    const chunks = chunkText(doc.content);
    for (const chunk of chunks) {
      const terms = tokenize(chunk);
      if (terms.length === 0) continue;

      let hits = 0;
      const matched = new Set<string>();
      for (const term of terms) {
        if (querySet.has(term)) {
          hits++;
          matched.add(term);
        }
      }
      if (hits === 0) continue;

      // Puntuación: cobertura de términos únicos de la consulta + densidad.
      const coverage = matched.size / querySet.size; // 0..1
      const density = hits / terms.length; // 0..1
      const score = coverage * 0.75 + density * 0.25;

      results.push({ docId: doc.id, docName: doc.name, text: chunk, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Resalta en el texto los términos de la consulta (devuelve segmentos). */
export function highlightSegments(text: string, query: string): { text: string; hit: boolean }[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [{ text, hit: false }];
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts
    .filter((p) => p !== "")
    .map((p) => ({ text: p, hit: terms.some((t) => normalize(p) === normalize(t)) }));
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
