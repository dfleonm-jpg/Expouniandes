# 01 · Arquitectura y stack tecnológico

## 1. Stack

| Capa | Tecnología | Para qué |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | SSR/SSG + Route Handlers (API) en un solo proyecto |
| **UI** | React 19 + TypeScript | Componentes tipados |
| **Estilos** | Tailwind CSS v4 | Diseño utility-first; tema oscuro premium con glassmorphism |
| **Animaciones** | Framer Motion | Transiciones entre secciones, micro-interacciones |
| **Iconos** | lucide-react | Set de iconos SVG |
| **IA (LLM)** | Groq (`openai/gpt-oss-120b`) con fallback a Google Gemini | Generación de texto, quizzes, revisiones, etc. |
| **Markdown + Matemáticas** | react-markdown, remark-gfm, remark-math, rehype-katex, rehype-highlight, KaTeX, highlight.js | Render de respuestas con fórmulas LaTeX y resaltado de código |
| **PDF / OCR** | pdfjs-dist, tesseract.js | Extraer texto de PDFs (incluye escaneados con OCR) en el navegador |
| **Backend / Auth / DB** | Firebase (Auth + Firestore) | Login (Google/correo) y persistencia en la nube |
| **Hosting** | Vercel | Despliegue serverless + CDN |

**Por qué Next.js:** permite tener el **frontend y el backend (API) en el mismo repositorio**. Las rutas en `src/app/api/*` se ejecutan como funciones serverless en Vercel, lo que mantiene las **claves de IA seguras en el servidor** (nunca se exponen al navegador).

---

## 2. Estructura de carpetas

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Layout raíz: providers globales, metadata, PWA
│   ├── page.tsx              # Punto de entrada: router de secciones + landing
│   ├── manifest.ts           # Manifiesto PWA (instalable)
│   ├── globals.css           # Sistema de diseño (variables, glass, aurora, a11y, KaTeX)
│   └── api/                  # 16 Route Handlers (backend serverless)
│       ├── chat/             #   tutor en streaming
│       ├── quiz/ exam...     #   generación de contenido con IA
│       └── health/           #   diagnóstico de configuración
│
├── components/
│   ├── Landing.tsx           # Página de bienvenida (pre-login)
│   ├── Sidebar.tsx           # Navegación agrupada + barra móvil
│   ├── sections/             # Las ~18 secciones/herramientas de la app
│   └── ui/                   # Componentes reutilizables (Toast, Modales, RichText…)
│
└── lib/                      # Lógica, hooks y utilidades (no-UI)
    ├── ai.ts                 # Capa de IA agnóstica (Groq/Gemini)
    ├── prompts.ts            # Todos los prompts centralizados
    ├── types.ts              # Tipos de dominio compartidos
    ├── app-context.tsx       # Estado global (perfil, stats, docs, a11y, nube)
    ├── auth-context.tsx      # Autenticación (Firebase)
    ├── firebase.ts           # Inicialización de Firebase (opcional)
    ├── i18n.ts               # Traducciones (es/en/pt/fr)
    └── *-store.ts, use*.ts   # Acceso a Firestore y hooks reutilizables
```

### Principio de organización
- **`lib/`** = lógica pura y acceso a datos (sin JSX de página).
- **`components/sections/`** = una carpeta de "pantallas"; cada archivo es una herramienta.
- **`components/ui/`** = piezas reutilizables entre secciones.
- **`app/api/`** = backend. Cada endpoint es delgado: valida la petición y delega en `lib/ai.ts` + `lib/prompts.ts`.

---

## 3. Flujo general de la aplicación

1. **Carga** → `app/layout.tsx` monta los *providers* (Auth → App → Toast) y el fondo "aurora".
2. **`app/page.tsx`** decide qué mostrar:
   - Si Firebase está activo y **no hay sesión** → muestra `<Landing>` (con login obligatorio).
   - Mientras Firebase resuelve la sesión → spinner.
   - Con sesión → la app: `<Sidebar>` + la sección activa + `<Onboarding>` (si es primera vez).
3. **Navegación entre secciones**: es un router propio basado en estado (`useState<Section>`), **no** usa rutas de URL. Esto permite que las secciones "pesadas" (chat, quiz a medias) se **mantengan montadas** y no pierdan su estado al cambiar de pestaña.

### Patrón `Keep` vs `Fade` (en `page.tsx`)
- **`<Keep>`**: envuelve secciones con estado que **no debe perderse** (Tutor, Quiz, Exam, Flashcards, Support, CodePractice, MathPractice). Se quedan montadas y solo se ocultan con CSS (`hidden`).
- **`<Fade>`**: secciones ligeras (Home, Progreso, etc.) que se montan/desmontan con animación al entrar.

### Atajos de teclado
`page.tsx` registra un listener global: teclas **1-9** cambian de sección y **`/`** abre "Buscar" (se ignora si el foco está en un input).

---

## 4. Flujo de una petición a la IA (ejemplo: Tutor)

```
Tutor.tsx
  └─ useChatStream().stream("/api/chat", { messages, locale, context, profile }, onToken)
        │  (fetch POST con streaming)
        ▼
  app/api/chat/route.ts
        ├─ construye el system prompt con tutorSystem(locale, profile)   [lib/prompts.ts]
        ├─ añade el contexto de documentos (si hay)
        └─ streamChat(messages, system)                                   [lib/ai.ts]
              ├─ getProvider() → "groq" o "gemini" según variables de entorno
              ├─ groqFetch() con reintentos ante 429/5xx
              └─ devuelve un ReadableStream de texto plano (token a token)
        ▼
  El navegador lee el stream y va pintando la respuesta en vivo (RichText con markdown+LaTeX)
```

---

## 5. Decisiones de diseño clave

- **Router por estado, no por URL:** prioriza preservar el estado de las herramientas (mejor UX para una app tipo "dashboard").
- **IA en el servidor:** las claves (`GROQ_API_KEY`) viven solo en variables de entorno del servidor.
- **Firebase opcional:** si no hay claves de Firebase, la app degrada con elegancia a "modo local" (sin login ni nube) y sigue funcionando. Esto evita que una mala configuración rompa toda la app.
- **Persistencia doble:** el estado se guarda en `localStorage` (siempre) y, si hay sesión, se **sincroniza con Firestore** (multi-dispositivo).
- **Centralización:** prompts en `prompts.ts`, tipos en `types.ts`, traducciones en `i18n.ts`, acceso a IA en `ai.ts` → evita duplicación y facilita el mantenimiento.
