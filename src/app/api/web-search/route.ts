import { json, handleApiError } from "@/lib/api-helpers";

// Búsqueda web educativa gratuita y sin API key, usando la API de Wikipedia
// en el idioma del usuario (muy fiable para temas académicos). Devuelve
// resultados { title, url, snippet } que la IA usa para responder y citar.

type WebResult = { title: string; url: string; snippet: string };

const WIKI_LANG: Record<string, string> = { es: "es", en: "en", pt: "pt", fr: "fr" };

export async function POST(req: Request) {
  try {
    const { query, locale } = (await req.json()) as { query: string; locale?: string };
    if (!query?.trim()) return json({ error: "Falta la consulta" }, 400);

    const lang = WIKI_LANG[locale ?? "es"] ?? "es";
    const results = await wikipediaSearch(query.trim(), lang);
    return json({ results });
  } catch (err) {
    return handleApiError(err, "WebSearch");
  }
}

async function wikipediaSearch(query: string, lang: string): Promise<WebResult[]> {
  const base = `https://${lang}.wikipedia.org`;

  // 1) Busca títulos relevantes.
  const searchUrl =
    `${base}/w/api.php?action=query&list=search&format=json&origin=*&srlimit=4&utf8=1` +
    `&srsearch=${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl, {
    headers: { "User-Agent": "SerenoApp/1.0 (educational project)" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const hits: { title: string; pageid: number }[] = data?.query?.search ?? [];
  if (hits.length === 0) return [];

  // 2) Trae un extracto de texto plano de cada artículo.
  const titles = hits.map((h) => h.title);
  const extractUrl =
    `${base}/w/api.php?action=query&prop=extracts|info&inprop=url&exintro=1&explaintext=1` +
    `&format=json&origin=*&redirects=1&titles=${encodeURIComponent(titles.join("|"))}`;
  const exRes = await fetch(extractUrl, {
    headers: { "User-Agent": "SerenoApp/1.0 (educational project)" },
  });

  const extracts: Record<string, { extract: string; url: string; title: string }> = {};
  if (exRes.ok) {
    const exData = await exRes.json();
    const pages = exData?.query?.pages ?? {};
    for (const key of Object.keys(pages)) {
      const p = pages[key];
      if (p?.title) {
        extracts[p.title] = {
          title: p.title,
          extract: (p.extract ?? "").slice(0, 600),
          url: p.fullurl ?? `${base}/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
        };
      }
    }
  }

  return hits.map((h) => {
    const ex = extracts[h.title];
    return {
      title: h.title,
      url: ex?.url ?? `${base}/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
      snippet: ex?.extract || stripTags(dataSnippet(h)),
    };
  });
}

function dataSnippet(h: { title: string } & Record<string, unknown>): string {
  return typeof h.snippet === "string" ? h.snippet : "";
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}
