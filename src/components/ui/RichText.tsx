"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/**
 * Renderiza texto en Markdown con soporte de matemáticas (KaTeX).
 *
 * Sintaxis para fórmulas:
 *  - En línea:  $x^2 + y^2 = r^2$
 *  - En bloque: $$\int_0^1 x^2\,dx = \frac{1}{3}$$
 *
 * También acepta \( ... \) y \[ ... \] gracias a la normalización previa.
 */
export function RichText({ children, className = "prose-sereno" }: { children: string; className?: string }) {
  const normalized = normalizeMath(children);
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: "#fb7185", strict: false }]]}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

/** Convierte los delimitadores LaTeX de estilo \( \) y \[ \] al formato $ y $$
 *  que entiende remark-math. Muchos modelos de IA usan ese estilo. */
function normalizeMath(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\\[((?:.|\n)+?)\\\]/g, (_, inner) => `\n$$${inner}$$\n`)
    .replace(/\\\(((?:.|\n)+?)\\\)/g, (_, inner) => `$${inner}$`);
}
