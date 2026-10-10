// Prompts centralizados de Sereno. Mantener aquí para fácil edición.

import { LANGUAGE_NAMES } from "./ai";

export function lang(locale?: string) {
  return LANGUAGE_NAMES[locale ?? "es"] ?? "español";
}

const MATH_RULE =
  "Si incluyes matemáticas, escríbelas en LaTeX: en línea con $...$ y en bloque con $$...$$ (ej. $\\frac{dy}{dx}$, $\\int_0^1 x\\,dx$). Nunca uses texto plano para fórmulas.";

const FORMAT_RULE =
  "Formatea para máxima claridad: usa `código en línea` para valores técnicos concretos (direcciones IP como `192.168.1.0/24`, máscaras como `255.255.255.0`, comandos, puertos, variables); usa bloques de código con su lenguaje (```bash, ```python) para comandos o cálculos de varias líneas; resalta términos clave en **negrita**. En explicaciones de redes/subnetting muestra el paso a paso con los valores exactos. En ecuaciones diferenciales muestra la ecuación en bloque $$...$$ y luego los pasos de solución.";

export function tutorSystem(locale?: string) {
  const l = lang(locale);
  return `Eres Sereno, un tutor académico con IA, empático y motivador, creado para ayudar a estudiantes universitarios a estudiar y a reducir su estrés académico.
Reglas:
- Responde SIEMPRE en ${l}.
- Explica de forma clara, estructurada y con ejemplos. Usa listas y pasos cuando ayude.
- Sé cálido y alentador; reconoce el esfuerzo del estudiante.
- Si detectas estrés o ansiedad, ofrece una técnica breve (respiración, descansos, dividir tareas) además de responder.
- Si te dan documentos o apuntes como contexto, básate en ellos y cítalos cuando sea relevante.
- No inventes datos; si no sabes algo, dilo con honestidad.
- Sé conciso pero completo. Usa formato markdown.
- Para CUALQUIER expresión matemática usa SIEMPRE LaTeX: en línea con $...$ y en bloque con $$...$$. Ejemplos: una fracción $\\frac{a}{b}$, una derivada $\\frac{dy}{dx}$, una integral $$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$, raíces $\\sqrt{x}$, sumatorias $\\sum_{i=1}^n i$, límites $\\lim_{x\\to 0}$. Nunca escribas matemáticas como texto plano (nada de x^2 ni *); usa LaTeX.
- ${FORMAT_RULE}`;
}

export function quizPrompt(topic: string, count: number, difficulty: string, locale?: string) {
  const l = lang(locale);
  return `Genera un quiz de opción múltiple sobre: "${topic}".
Idioma: ${l}. Cantidad: ${count}. Dificultad: ${difficulty}.
Cada pregunta: exactamente 4 opciones, una sola correcta (correctIndex = índice 0-3), y una explicación clara que enseñe el porqué.
${MATH_RULE}
${FORMAT_RULE}
Escribe TODO en ${l}.`;
}

export const QUIZ_SHAPE =
  '{"questions":[{"question":string,"options":[string,string,string,string],"correctIndex":number,"explanation":string}]}';

export function flashcardsPrompt(topic: string, count: number, locale?: string) {
  const l = lang(locale);
  return `Genera ${count} flashcards (tarjetas de estudio) sobre: "${topic}".
Idioma: ${l}. "front" = concepto/pregunta corta. "back" = respuesta/definición clara y breve.
${MATH_RULE}
Escribe TODO en ${l}.`;
}

export const FLASHCARDS_SHAPE = '{"cards":[{"front":string,"back":string}]}';

export function studyPlanPrompt(input: string, locale?: string) {
  const l = lang(locale);
  return `Crea un plan de estudio realista basado en esta información del estudiante:
"${input}"
Idioma: ${l}. Distribuye el trabajo en días con sesiones concretas (hora sugerida, tarea y duración en minutos). Incluye descansos y un consejo anti-estrés por día. Sé realista, no sobrecargues.`;
}

export const STUDY_PLAN_SHAPE =
  '{"summary":string,"days":[{"day":string,"focus":string,"sessions":[{"time":string,"task":string,"durationMin":number}],"tip":string}]}';

export function summaryPrompt(text: string, locale?: string) {
  const l = lang(locale);
  return `Analiza el siguiente texto/apuntes y genera un resumen de estudio.
Idioma: ${l}.
Texto:
"""
${text.slice(0, 12000)}
"""
Devuelve: un título, un TL;DR de 2-3 frases, los puntos clave, y los conceptos importantes con su definición. Todo en ${l}.
${MATH_RULE}`;
}

export const SUMMARY_SHAPE =
  '{"title":string,"tldr":string,"keyPoints":[string],"concepts":[{"term":string,"definition":string}]}';

export function mindMapPrompt(topic: string, locale?: string) {
  const l = lang(locale);
  return `Crea un mapa mental sobre: "${topic}".
Idioma: ${l}. Devuelve un tema central y entre 4 y 6 ramas principales; cada rama con 2-4 ideas/conceptos cortos.
Sé claro y conciso (ideas de pocas palabras). Todo en ${l}.`;
}

export const MINDMAP_SHAPE =
  '{"central":string,"branches":[{"label":string,"items":[string]}]}';

export function methodRecommendPrompt(situation: string, locale?: string) {
  const l = lang(locale);
  return `Un estudiante describe su situación: "${situation}".
Recomiéndale UN método de estudio adecuado (ej. Pomodoro, Feynman, repetición espaciada, Cornell, mapas mentales, práctica activa, 80/20...).
Idioma: ${l}. Explica en 2-3 frases por qué ese método encaja con su caso y da un primer paso concreto para empezar hoy. Responde en ${l}, cálido y motivador.`;
}
