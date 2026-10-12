# 03 · API — Endpoints (backend)

Todos los endpoints son **Route Handlers** de Next.js en `src/app/api/<nombre>/route.ts`, se ejecutan como funciones serverless en Vercel y responden a `POST` (salvo `health`, que es `GET`). Comparten:

- Entrada JSON (`await req.json()`).
- Validación mínima de parámetros.
- Delegación en `lib/ai.ts` + `lib/prompts.ts`.
- Manejo de errores unificado con `handleApiError` / `json` de `lib/api-helpers.ts`.
- Casi todos aceptan `locale` para responder en el idioma del usuario (es/en/pt/fr).

## Tabla resumen

| Endpoint | Método | Entra | Sale | Tipo |
|---|---|---|---|---|
| `/api/health` | GET | — | `{ ok, provider, configured, message }` | diagnóstico |
| `/api/chat` | POST | `messages, locale, context?, profile?` | **stream** de texto | streaming |
| `/api/support` | POST | `messages, locale` | **stream** de texto | streaming |
| `/api/web-search` | POST | `query, locale` | `{ results: [{title,url,snippet}] }` | JSON |
| `/api/quiz` | POST | `topic, count, difficulty, locale` | `{ questions: [...] }` | JSON |
| `/api/flashcards` | POST | `topic, count, locale` | `{ cards: [...] }` | JSON |
| `/api/summary` | POST | `text, locale` | `{ title, tldr, keyPoints, concepts }` | JSON |
| `/api/study-plan` | POST | `input, locale` | `{ summary, days: [...] }` | JSON |
| `/api/mindmap` | POST | `topic, locale` | `{ central, summary, branches: [...] }` | JSON |
| `/api/method` | POST | `situation, locale` | `{ recommendation }` | texto |
| `/api/quote` | POST | `locale, mood?` | `{ quote }` | texto |
| `/api/code-exercise` | POST | `topic, level, restrictions[], locale` | `{ title, statement, functionSignature, hints }` | JSON |
| `/api/code-review` | POST | `statement, code, restrictions[], locale` | `{ correct, respectsRestrictions, score, errors[], improvements[], ... }` | JSON |
| `/api/math-problem` | POST | `topic, difficulty, locale` | `{ title, problem, answer }` | JSON |
| `/api/math-review` | POST | `problem, answer, work, locale` | `{ correct, score, mistakeStep, feedback, solution }` | JSON |
| `/api/diagnostic` | POST | `mode:"quiz"\|"plan", areas?/weakAreas?/strongAreas?, locale` | `{ questions[] }` ó `{ plan }` | JSON/texto |

---

## Detalle de los endpoints

### `GET /api/health` — diagnóstico
Comprueba qué claves de IA están configuradas **sin exponerlas**. La UI (`AIStatusBanner`) lo consulta cada 20 s; si no hay ninguna, muestra un aviso con instrucciones. Devuelve HTTP 503 si no hay proveedor.

### `POST /api/chat` — Tutor (streaming)
- Construye el system prompt con `tutorSystem(locale, profile)` → **personaliza por carrera/materias**.
- Si llega `context` (apuntes/documentos del usuario), lo añade como fuente principal (hasta 40.000 chars).
- Responde con un **stream de texto** que el navegador va pintando en vivo.

### `POST /api/support` — Apoyo emocional (streaming)
Mismo mecanismo de streaming, pero con un **system prompt de contención**: empático, breve, con técnicas de bienestar y **guardarraíles de seguridad** (deriva a líneas de ayuda ante señales de crisis; no da consejo médico). No sustituye a un profesional (se avisa en la UI).

### `POST /api/web-search` — búsqueda web
Usa la **API pública de Wikipedia** en el idioma del usuario (no requiere clave). Busca títulos relevantes y trae extractos. Devuelve `{title, url, snippet}` que el Tutor usa como contexto para responder **citando fuentes**.

### Endpoints de **generación JSON** (quiz, flashcards, summary, study-plan, mindmap, code-exercise, math-problem, diagnostic)
Todos delegan en `generateJSON<T>(prompt, SHAPE)`:
- El `prompt` viene de `lib/prompts.ts`.
- El `SHAPE` describe el JSON exacto esperado.
- Validan que el resultado tenga datos (p. ej. `questions.length`), si no devuelven 502.

### Endpoints de **revisión pedagógica** (code-review, math-review)
Reciben el trabajo del estudiante y devuelven una evaluación estructurada:
- **code-review**: `correct`, `respectsRestrictions` (¿respetó "sin while/for/recursividad"?), `score` 0–5 estilo Uniandes, lista de `errors` (con `line`, `problem`, `why`, `fix`), `improvements`, `avoidNextTime`, `complexity` (Big-O).
- **math-review**: `correct`, `score`, `mistakeStep` (en qué paso falló), `feedback` y `solution` (paso a paso en LaTeX).

### `POST /api/diagnostic` — doble modo
- `mode: "quiz"` → genera 6 preguntas etiquetadas por área (para medir nivel).
- `mode: "plan"` → recibe áreas fuertes/débiles y genera un plan de mejora en texto.

---

## Seguridad de los endpoints
- Las **claves de IA** solo existen como variables de entorno del servidor; nunca se envían al cliente.
- Cada endpoint valida su entrada y nunca confía en datos del cliente para construir rutas o acceder a recursos externos arbitrarios (la búsqueda web está fija a Wikipedia).
