# 02 · La capa de IA

Toda la inteligencia de Sereno pasa por **un único módulo**: `src/lib/ai.ts`. Esto permite cambiar de proveedor, aplicar reintentos y manejar errores en un solo lugar.

## 1. Proveedor agnóstico (Groq / Gemini)

`getProvider()` elige el motor según las variables de entorno disponibles:

```
Prioridad:  GROQ_API_KEY  →  GEMINI_API_KEY
```

- **Groq** (por defecto): modelo `openai/gpt-oss-120b`, vía su API compatible con OpenAI (`/openai/v1/chat/completions`). Es gratis y muy rápido.
- **Google Gemini** (respaldo): modelo `gemini-flash-latest`, vía el SDK `@google/genai`.
- Si **no hay ninguna clave**, lanza `AIError` con un mensaje legible (código 503) que la UI muestra en un banner.

Los modelos son configurables con `GROQ_MODEL` / `GEMINI_MODEL`.

## 2. Funciones públicas que expone `ai.ts`

| Función | Uso | Devuelve |
|---|---|---|
| `streamChat(messages, system)` | Chat en vivo (Tutor, Apoyo, Buscar) | `ReadableStream` de texto plano, token a token |
| `generateJSON<T>(prompt, shapeHint)` | Contenido estructurado (quizzes, flashcards, mapas, planes, diagnóstico, revisiones) | Objeto `T` ya parseado |
| `generateText(prompt, system)` | Texto corto no-streaming (frases, método recomendado, plan de diagnóstico) | `string` |

### `streamChat` — streaming real
- Pide `stream: true` y `max_tokens: 4096`.
- Convierte el formato **SSE** de Groq (`data: {...}`) a un stream de texto plano para que el frontend solo tenga que ir acumulando los tokens.
- En Gemini usa `generateContentStream` con `maxOutputTokens`.

### `generateJSON` — salida estructurada robusta
- A Groq le pide `response_format: { type: "json_object" }`; a Gemini `responseMimeType: "application/json"`.
- `shapeHint` describe la forma exacta del JSON esperado (se inyecta en el system prompt).
- `safeParse()` tolera respuestas imperfectas: si el modelo envuelve el JSON en texto, extrae el primer `{...}`/`[...]` válido. Si falla, lanza `AIError` 502.

## 3. Resiliencia: reintentos automáticos

`groqFetch(body, retries = 2)`:
- Reintenta **solo** ante `429` (límite del plan gratis) o errores **5xx**.
- Respeta el header `retry-after`; si no viene, usa backoff incremental (máx. 6 s).
- Esto resuelve el típico fallo de "la IA no responde" cuando se hacen muchas peticiones seguidas en una demo.

## 4. Errores legibles

- `AIError` lleva un `userMessage` (en español) y un `status`.
- `humanizeError(status, body)` traduce códigos técnicos a mensajes útiles:
  - `401/403` → "la clave no es válida o expiró"
  - `429` → "se alcanzó el límite, espera un momento"
  - `402`/créditos → "la cuenta se quedó sin cuota"
  - `5xx` → "problema temporal, intenta de nuevo"
- `src/lib/api-helpers.ts` (`handleApiError`) convierte estos errores en respuestas JSON consistentes para todos los endpoints.

## 5. Prompts centralizados (`src/lib/prompts.ts`)

Todos los prompts viven aquí, lo que facilita ajustarlos sin tocar los endpoints. Reglas transversales que se inyectan:

- **`MATH_RULE`**: obliga a escribir matemáticas en **LaTeX** (`$...$`, `$$...$$`) → se renderiza con KaTeX.
- **`FORMAT_RULE`**: pide usar `código en línea` para valores técnicos (IPs, comandos), bloques de código con lenguaje, negritas, y pasos explícitos (clave para redes/subnetting y ecuaciones diferenciales).

Prompts principales: `tutorSystem`, `quizPrompt`, `flashcardsPrompt`, `studyPlanPrompt`, `summaryPrompt`, `mindMapPrompt`, `methodRecommendPrompt`, `codeExercisePrompt`, `codeReviewPrompt`, `mathProblemPrompt`, `mathReviewPrompt`, `diagnosticPrompt`, `diagnosticPlanPrompt`.

## 6. Personalización por perfil (la propuesta clave)

`profileContext(profile)` construye una línea de contexto a partir del **perfil académico** del estudiante (carrera, semestre, universidad, materias críticas, estilo de estudio, nivel de estrés) y la inyecta en `tutorSystem`. Resultado: la IA **adapta ejemplos y analogías a la carrera y materias del usuario** y se vuelve más contenedora si el estrés es alto. El perfil se recoge en el onboarding de 3 pasos y viaja en el body de `/api/chat`.

## 7. Capacidad

- Contexto de documentos/apuntes: hasta **40.000 caracteres** (chat y resúmenes).
- Código a revisar: hasta 8.000 caracteres; procedimiento de cálculo: 3.000.
- Respuestas: `max_tokens` 4096 (chat) y hasta 8000 (JSON).

## 8. Hooks del lado cliente que consumen la IA

| Hook | Archivo | Qué hace |
|---|---|---|
| `useChatStream()` | `lib/useChatStream.ts` | Centraliza el consumo de respuestas en **streaming** (fetch + lectura del `ReadableStream` + `AbortController`). Lo usan Tutor, Apoyo y Buscar. |
| `useAIRequest<T>()` | `lib/useAI.ts` | Para endpoints **JSON**: maneja `loading`, `error`, `data`, `run()` y `reset()`. Lo usan Quiz-like, Flashcards, Resúmenes, Mapas, Práctica, Diagnóstico, etc. |
