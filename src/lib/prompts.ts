// Prompts centralizados de Sereno. Mantener aquí para fácil edición.

import { LANGUAGE_NAMES } from "./ai";

export function lang(locale?: string) {
  return LANGUAGE_NAMES[locale ?? "es"] ?? "español";
}

export type ProfileInput = {
  career?: string;
  semester?: string;
  university?: string;
  subjects?: string[];
  studyStyle?: string;
  stressLevel?: string;
};

/** Construye una línea de contexto con el perfil del estudiante para la IA. */
export function profileContext(p?: ProfileInput): string {
  if (!p) return "";
  const parts: string[] = [];
  if (p.career) parts.push(`carrera: ${p.career}`);
  if (p.semester) parts.push(`semestre: ${p.semester}`);
  if (p.university) parts.push(`universidad: ${p.university}`);
  if (p.subjects?.length) parts.push(`materias críticas: ${p.subjects.join(", ")}`);
  if (p.studyStyle) parts.push(`estilo de aprendizaje: ${p.studyStyle}`);
  if (p.stressLevel) parts.push(`nivel de estrés: ${p.stressLevel}`);
  if (parts.length === 0) return "";
  return `\nPERFIL DEL ESTUDIANTE (${parts.join("; ")}). Adapta tus explicaciones, ejemplos y analogías a su carrera y materias; sé más contenedor si su estrés es alto.`;
}

const MATH_RULE =
  "Si incluyes matemáticas, escríbelas en LaTeX: en línea con $...$ y en bloque con $$...$$ (ej. $\\frac{dy}{dx}$, $\\int_0^1 x\\,dx$). Nunca uses texto plano para fórmulas.";

const FORMAT_RULE =
  "Formatea para máxima claridad: usa `código en línea` para valores técnicos concretos (direcciones IP como `192.168.1.0/24`, máscaras como `255.255.255.0`, comandos, puertos, variables); usa bloques de código con su lenguaje (```bash, ```python) para comandos o cálculos de varias líneas; resalta términos clave en **negrita**. En explicaciones de redes/subnetting muestra el paso a paso con los valores exactos. En ecuaciones diferenciales muestra la ecuación en bloque $$...$$ y luego los pasos de solución.";

export type ExplainLevel = "basico" | "intermedio" | "avanzado";

const LEVEL_RULE: Record<ExplainLevel, string> = {
  basico:
    "NIVEL DE EXPLICACIÓN: BÁSICO. Explica desde cero, con lenguaje sencillo, analogías cotidianas y pasos muy pequeños. Evita tecnicismos; si usas uno, defínelo. Asume que el estudiante ve el tema por primera vez.",
  intermedio:
    "NIVEL DE EXPLICACIÓN: INTERMEDIO. Equilibra claridad y rigor. Usa la terminología correcta explicándola brevemente, con ejemplos aplicados. Asume que el estudiante conoce lo básico.",
  avanzado:
    "NIVEL DE EXPLICACIÓN: AVANZADO. Sé riguroso y conciso, con terminología técnica precisa, formalismo, demostraciones o complejidad cuando aplique. Asume buen dominio previo del tema.",
};

export function tutorSystem(locale?: string, profile?: ProfileInput, level?: ExplainLevel) {
  const l = lang(locale);
  const levelRule = level ? `\n- ${LEVEL_RULE[level]}` : "";
  return `Eres Sereno, un tutor académico con IA, empático y motivador, creado para ayudar a estudiantes universitarios a estudiar y a reducir su estrés académico.${profileContext(profile)}
Reglas:
- Responde SIEMPRE en ${l}.${levelRule}
- Explica de forma clara, estructurada y con ejemplos. Usa listas y pasos cuando ayude.
- Sé cálido y alentador; reconoce el esfuerzo del estudiante.
- Si detectas estrés o ansiedad, ofrece una técnica breve (respiración, descansos, dividir tareas) además de responder.
- Si te dan documentos o apuntes como contexto, básate en ellos y cítalos cuando sea relevante.
- No inventes datos; si no sabes algo, dilo con honestidad.
- Sé conciso pero completo. Usa formato markdown.
- Para CUALQUIER expresión matemática usa SIEMPRE LaTeX: en línea con $...$ y en bloque con $$...$$. Ejemplos: una fracción $\\frac{a}{b}$, una derivada $\\frac{dy}{dx}$, una integral $$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$, raíces $\\sqrt{x}$, sumatorias $\\sum_{i=1}^n i$, límites $\\lim_{x\\to 0}$. Nunca escribas matemáticas como texto plano (nada de x^2 ni *); usa LaTeX.
- ${FORMAT_RULE}`;
}

export function quizPrompt(topic: string, count: number, difficulty: string, locale?: string, profile?: ProfileInput) {
  const l = lang(locale);
  return `Genera un quiz de opción múltiple sobre: "${topic}".${profileContext(profile)}
Idioma: ${l}. Cantidad: ${count}. Dificultad: ${difficulty}.
Cada pregunta: exactamente 4 opciones, una sola correcta (correctIndex = índice 0-3), y una explicación clara que enseñe el porqué.
${MATH_RULE}
${FORMAT_RULE}
Escribe TODO en ${l}.`;
}

export const QUIZ_SHAPE =
  '{"questions":[{"question":string,"options":[string,string,string,string],"correctIndex":number,"explanation":string}]}';

export function flashcardsPrompt(topic: string, count: number, locale?: string, profile?: ProfileInput) {
  const l = lang(locale);
  return `Genera ${count} flashcards (tarjetas de estudio) sobre: "${topic}".${profileContext(profile)}
Idioma: ${l}. "front" = concepto/pregunta corta. "back" = respuesta/definición clara y breve.
${MATH_RULE}
Escribe TODO en ${l}.`;
}

export const FLASHCARDS_SHAPE = '{"cards":[{"front":string,"back":string}]}';

export function studyPlanPrompt(input: string, locale?: string, profile?: ProfileInput) {
  const l = lang(locale);
  return `Crea un plan de estudio realista basado en esta información del estudiante:
"${input}"${profileContext(profile)}
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
${text.slice(0, 40000)}
"""
Devuelve: un título, un TL;DR de 2-3 frases, los puntos clave, y los conceptos importantes con su definición. Todo en ${l}.
${MATH_RULE}`;
}

export const SUMMARY_SHAPE =
  '{"title":string,"tldr":string,"keyPoints":[string],"concepts":[{"term":string,"definition":string}]}';

export function mindMapPrompt(topic: string, locale?: string, profile?: ProfileInput) {
  const l = lang(locale);
  return `Crea un MAPA MENTAL completo y bien estructurado sobre: "${topic}".${profileContext(profile)}
Idioma: ${l}.
Requisitos:
- Un resumen de 1 frase del tema (campo "summary").
- Entre 5 y 7 ramas principales, cada una con: un "emoji" representativo, un "label" corto (2-4 palabras) y entre 3 y 5 "items".
- Cada "item" tiene un "text" (idea concreta y clara, no genérica) y, cuando aporte, un "detail" breve (una frase con un dato, ejemplo o definición útil).
- Que las ramas cubran distintos ángulos del tema (definición, tipos, causas, ejemplos, aplicaciones, importancia, etc.) según corresponda.
- Contenido real y específico, nada de relleno. Todo en ${l}.`;
}

export const MINDMAP_SHAPE =
  '{"central":string,"summary":string,"branches":[{"emoji":string,"label":string,"items":[{"text":string,"detail":string}]}]}';

export function methodRecommendPrompt(situation: string, locale?: string) {
  const l = lang(locale);
  return `Un estudiante describe su situación: "${situation}".
Recomiéndale UN método de estudio adecuado (ej. Pomodoro, Feynman, repetición espaciada, Cornell, mapas mentales, práctica activa, 80/20...).
Idioma: ${l}. Explica en 2-3 frases por qué ese método encaja con su caso y da un primer paso concreto para empezar hoy. Responde en ${l}, cálido y motivador.`;
}

// ===================== CIENCIAS E INGENIERÍA =====================

/** Genera un ejercicio de programación en Python tipo parcial Uniandes. */
export function codeExercisePrompt(topic: string, level: string, restrictions: string[], locale?: string, profile?: ProfileInput) {
  const l = lang(locale);
  const rules = restrictions.length ? restrictions.join(", ") : "ninguna restricción especial";
  return `Eres profesor de Introducción a la Programación en Python (estilo Universidad de los Andes).
Crea UN ejercicio de programación tipo parcial sobre: "${topic || "fundamentos de Python"}".${profileContext(profile)}
Nivel: ${level}. Restricciones que el estudiante DEBE respetar: ${rules}.
Idioma: ${l}.
El enunciado debe pedir escribir una función en Python, ser claro y realista (como un punto de parcial). Incluye 2-3 ejemplos de entrada→salida esperada.
Devuelve: "title" (corto), "statement" (enunciado en markdown con los ejemplos), "functionSignature" (la firma sugerida, ej. "def contar_pares(lista):"), y "hints" (2 pistas sin dar la solución). Todo en ${l}.`;
}

export const CODE_EXERCISE_SHAPE =
  '{"title":string,"statement":string,"functionSignature":string,"hints":[string]}';

/** Revisa el código del estudiante de forma pedagógica (no solo correcto/incorrecto). */
export function codeReviewPrompt(
  statement: string,
  code: string,
  restrictions: string[],
  locale?: string
) {
  const l = lang(locale);
  const rules = restrictions.length ? restrictions.join(", ") : "ninguna";
  return `Eres un profesor de programación en Python, exigente pero motivador (estilo Uniandes).
EJERCICIO:
"""${statement}"""
RESTRICCIONES QUE EL ESTUDIANTE DEBÍA RESPETAR: ${rules}.
CÓDIGO DEL ESTUDIANTE (Python):
\`\`\`python
${code.slice(0, 8000)}
\`\`\`
Analízalo como si fuera un parcial. Idioma: ${l}. Responde SOLO JSON con:
- "correct": boolean (¿resuelve bien el problema?)
- "respectsRestrictions": boolean (¿respetó TODAS las restricciones? Si usó algo prohibido, es false)
- "score": número 0.0 a 5.0 (nota estilo Uniandes, aprobar 3.0)
- "summary": 1-2 frases de veredicto general, cálido
- "errors": lista de { "line": string (ej. "línea 3" o "general"), "problem": string, "why": string (por qué está mal), "fix": string (cómo corregirlo) }  — vacía si no hay errores
- "improvements": lista de strings (cómo mejorar estilo/eficiencia/legibilidad, aunque funcione)
- "avoidNextTime": lista de strings (consejos para no repetir estos errores)
- "complexity": string (complejidad Big-O aproximada de su solución, ej. "O(n)")
No reescribas toda la solución; guíalo. Todo en ${l}.`;
}

export const CODE_REVIEW_SHAPE =
  '{"correct":boolean,"respectsRestrictions":boolean,"score":number,"summary":string,"errors":[{"line":string,"problem":string,"why":string,"fix":string}],"improvements":[string],"avoidNextTime":[string],"complexity":string}';

/** Genera un problema de cálculo/física de respuesta ABIERTA (sin opciones). */
export function mathProblemPrompt(topic: string, difficulty: string, locale?: string, profile?: ProfileInput) {
  const l = lang(locale);
  return `Eres profesor de Cálculo/Física (estilo Universidad de los Andes, parciales SIN calculadora).
Crea UN problema de respuesta abierta sobre: "${topic}". Dificultad: ${difficulty}.${profileContext(profile)}
Debe resolverse a mano (sin calculadora), como en un parcial real. Idioma: ${l}.
Devuelve: "title", "problem" (enunciado en markdown con LaTeX para las fórmulas: $...$ y $$...$$), y "answer" (la respuesta final correcta, breve, en LaTeX). Todo en ${l}.`;
}

export const MATH_PROBLEM_SHAPE = '{"title":string,"problem":string,"answer":string}';

/** Revisa el procedimiento/respuesta del estudiante en un problema de cálculo. */
export function mathReviewPrompt(problem: string, correctAnswer: string, work: string, locale?: string) {
  const l = lang(locale);
  return `Eres profesor de Cálculo (estilo Uniandes). Revisa el desarrollo del estudiante.
PROBLEMA:
"""${problem}"""
RESPUESTA CORRECTA ESPERADA: ${correctAnswer}
PROCEDIMIENTO Y RESPUESTA DEL ESTUDIANTE:
"""${work.slice(0, 3000)}"""
Idioma: ${l}. Responde SOLO JSON con:
- "correct": boolean (¿la respuesta final es correcta?)
- "score": número 0.0 a 5.0 (nota estilo Uniandes)
- "summary": veredicto breve y motivador
- "mistakeStep": string (en qué paso se equivocó, o "" si todo bien)
- "feedback": string (explicación de dónde falló o qué hizo bien)
- "solution": string (la solución COMPLETA paso a paso, a mano, en markdown con LaTeX $...$ y $$...$$)
Usa LaTeX para TODAS las matemáticas. Todo en ${l}.`;
}

export const MATH_REVIEW_SHAPE =
  '{"correct":boolean,"score":number,"summary":string,"mistakeStep":string,"feedback":string,"solution":string}';

/** Quiz diagnóstico: genera preguntas cortas para detectar nivel por área. */
export function diagnosticPrompt(areas: string[], locale?: string) {
  const l = lang(locale);
  return `Crea un quiz diagnóstico corto para ubicar el nivel de un estudiante universitario de primeros semestres.
Áreas a evaluar: ${areas.join(", ")}.
Idioma: ${l}. Genera 6 preguntas de opción múltiple (una por concepto base, variando dificultad), cada una etiquetada con su "area" (una de: ${areas.join(", ")}).
Cada pregunta: 4 opciones, una correcta (correctIndex 0-3). ${MATH_RULE}
Todo en ${l}.`;
}

export const DIAGNOSTIC_SHAPE =
  '{"questions":[{"area":string,"question":string,"options":[string,string,string,string],"correctIndex":number}]}';

/** Plan de estudio personalizado a partir de debilidades detectadas. */
export function diagnosticPlanPrompt(weakAreas: string[], strongAreas: string[], locale?: string) {
  const l = lang(locale);
  return `Un estudiante hizo un diagnóstico. Áreas débiles: ${weakAreas.join(", ") || "ninguna"}. Áreas fuertes: ${strongAreas.join(", ") || "varias"}.
Idioma: ${l}. Dale un plan de mejora motivador y concreto: por cada área débil, 1-2 acciones específicas y qué sección de la app usar (Tutor, Práctica de código, Práctica de cálculo, Flashcards, etc.). Sé cálido, breve y alentador. Responde en ${l} en markdown.`;
}

/** Análisis de errores de parciales: detecta patrones a partir del historial. */
export function examAnalysisPrompt(
  records: { topic: string; score: number; total: number; date: string }[],
  locale?: string
) {
  const l = lang(locale);
  const rows = records
    .map((r) => `- ${r.topic}: ${r.score}/${r.total} (${Math.round((r.score / Math.max(r.total, 1)) * 100)}%) · ${r.date.slice(0, 10)}`)
    .join("\n");
  return `Eres un asesor académico. Analiza el historial de parciales/quizzes de un estudiante universitario y detecta PATRONES de error accionables.
HISTORIAL (tema: aciertos/total · fecha):
${rows}
Idioma: ${l}. Responde SOLO JSON con:
- "overview": string (1-2 frases con el panorama general, cálido y honesto)
- "weakTopics": lista de { "topic": string, "accuracy": number (0-100), "advice": string (qué hacer concretamente) } ordenada de más débil a menos
- "strongTopics": lista de strings (temas donde va bien)
- "trend": string ("mejorando" | "estable" | "bajando") según la evolución de las fechas
- "patterns": lista de strings (patrones detectados, ej. "fallas más en temas de cálculo", "bajas en parciales largos")
- "nextSteps": lista de strings (3-4 pasos priorizados, mencionando qué sección de Sereno usar: Tutor, Práctica de código, Práctica de cálculo, Flashcards, Parcial)
Sé específico y motivador. Todo en ${l}.`;
}

export const EXAM_ANALYSIS_SHAPE =
  '{"overview":string,"weakTopics":[{"topic":string,"accuracy":number,"advice":string}],"strongTopics":[string],"trend":string,"patterns":[string],"nextSteps":[string]}';
