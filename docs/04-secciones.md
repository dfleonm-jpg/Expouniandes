# 04 · Secciones y herramientas

Cada "sección" es un componente en `src/components/sections/`. La navegación entre ellas está en `Sidebar.tsx` (menú agrupado) y el render en `page.tsx`. Las secciones se agrupan en el menú por categorías: **Aprender · Practicar · Ciencias e Ing. · Organizar · Bienestar · Tu avance**.

---

## 🏠 Home (`Home.tsx`)
Pantalla de inicio tras entrar: saludo personalizado por hora + nombre, tarjetas de acceso a las funciones y el **Panel de Impacto** (`ImpactPanel`) con métricas globales de la comunidad.

## 💬 Tutor (`Tutor.tsx`) — *la herramienta central*
Chat con IA en **streaming**. Características:
- **Documentos como contexto**: subes PDF/TXT/MD (`FileUploadButton`) y la IA responde sobre ellos (estilo NotebookLM).
- **Búsqueda web** (toggle 🌐): activa Wikipedia como fuente y muestra las **fuentes citadas**.
- **Voz a texto** (🎤, `useVoiceInput`) y **lectura en voz alta** (🔊, `SpeakButton`).
- **Historial de chats** (`chat-store.ts`): guarda cada conversación en Firestore (`users/{uid}/chats`), con panel para abrir/borrar y botón "nuevo chat". Autoguardado con debounce.
- **Personalización**: envía el perfil académico para adaptar las respuestas.
- Render con `RichText` (markdown + LaTeX + resaltado de código).
- Usa `useChatStream` y `useCopy`.

## 📝 Quizzes (`Quiz.tsx`)
Genera un cuestionario de opción múltiple sobre cualquier tema (`/api/quiz`). Flujo: configuración (tema, nº preguntas, dificultad) → preguntas una a una con feedback inmediato y explicación → pantalla de resultados con puntaje. Las preguntas/opciones/explicaciones se renderizan con `RichText` (soporta fórmulas).

## 🎓 Parcial / Modo Examen (`Exam.tsx`)
Simulacro **cronometrado** (30 / 60 / 90 min). Barra de tiempo fija, aviso a los 5 min, auto-entrega al acabar, navegación entre preguntas (grid), nota sobre 10 estilo Uniandes y **revisión** detallada. Guarda cada intento en el historial de parciales (contexto global) y suma al progreso. Permite **exportar a PDF** (impresión).

## 🃏 Flashcards (`Flashcards.tsx`)
Tarjetas de estudio generadas por IA (`/api/flashcards`) con **volteo 3D** (CSS `transform-style: preserve-3d` + `backface-visibility`, compatible con Safari). Navegación, barajar, y contador. Front/back renderizados con `RichText`.

## 🔎 Buscar (`Search.tsx`)
Búsqueda **local** sobre los documentos subidos (`lib/search.ts`): divide los apuntes en fragmentos, los puntúa por relevancia (cobertura de términos + densidad) y resalta coincidencias. Botón "preguntar a la IA" → usa los fragmentos como contexto y responde en streaming citando los apuntes.

## 📄 Resúmenes (`Summary.tsx`)
Pegas texto o subes un archivo (PDF/OCR) y la IA genera `{ título, TL;DR, puntos clave, conceptos }` (`/api/summary`). Soporta hasta 40.000 caracteres. Permite leer en voz alta, exportar a PDF y guardar como documento (reutilizable en el Tutor/Buscar).

## 🧠 Mapas mentales (`MindMap.tsx`)
La IA (`/api/mindmap`) organiza un tema en `{ central, summary, branches[] }`. Se renderiza como un **mapa radial SVG** real: nodo central + ramas con conectores curvos animados (Framer Motion), expandir/colapsar, zoom in/out y **exportar a PNG** (serializa el SVG a canvas). Debajo, una lista legible con los detalles.

## 📖 Métodos de estudio (`Methods.tsx`)
Catálogo de 6 técnicas (Pomodoro, Feynman, repetición espaciada, Cornell, mapas, 80/20) con pasos y "ideal para". Incluye un **recomendador con IA** (`/api/method`): describes tu situación y te sugiere la técnica adecuada. Cada tarjeta enlaza a la sección relacionada.

## 💻 Práctica de código (`CodePractice.tsx`) — *Ciencias e Ing.*
Pensado para Intro. a la Programación (Python) de Uniandes:
- Eliges tema, nivel y **restricciones** (sin `while`/`for`/recursividad/librerías) como en un parcial real.
- La IA genera un ejercicio tipo parcial (`/api/code-exercise`).
- Escribes tu código en un editor con tabulación.
- La IA **revisa pedagógicamente** (`/api/code-review`): si funciona, si **respetó las restricciones**, nota 0–5, errores (línea + por qué + arreglo), mejoras, qué evitar y complejidad Big-O.
- Incluye aviso de **integridad académica**.

## 📐 Práctica de cálculo (`MathPractice.tsx`) — *Ciencias e Ing.*
Problemas de **respuesta abierta** (sin opción múltiple, sin calculadora), como en los parciales. La IA genera el problema (`/api/math-problem`), escribes tu procedimiento, y la IA revisa (`/api/math-review`) indicando **en qué paso fallaste** y la **solución completa paso a paso** en LaTeX.

## 🗓️ Planificador (`Planner.tsx` + `StudyPlanGenerator.tsx`)
Dos partes: (1) lista de tareas + **temporizador Pomodoro** (foco/descanso, suma minutos de enfoque al progreso); (2) **generador de plan de estudio con IA** (`/api/study-plan`): describes tus exámenes y genera un plan por días con sesiones; **exportable a Markdown**.

## 📅 Calendario (`Calendar.tsx`)
Registras tus exámenes con fecha y muestra **cuenta regresiva** con colores por urgencia. Permite **exportar a `.ics`** (`lib/export.ts`) para añadirlos a Google Calendar / Apple / Outlook. Los eventos se guardan en el contexto global y en la nube.

## 👥 Grupos (`Groups.tsx`)
Compartir contenido **sin servidor adicional**: genera un **código** (base64 del contenido, `lib/share-code.ts`) de un documento guardado; otro estudiante lo pega y lo importa. Simple y gratis.

## 🧘 Bienestar (`Wellbeing.tsx`)
- **Respiración guiada**: 3 técnicas (4-7-8, caja, calma) con animación y contador de ciclos.
- **Sonidos ambientales** sintetizados con la **Web Audio API** (`lib/ambient-sound.ts`): lluvia, bosque, olas, café — sin descargar archivos.
- **Chequeo de ánimo** + **frase del día** generada por IA (`/api/quote`), adaptada al estado de ánimo.
- Consejos anti-estrés.

## 🤝 Apoyo (`Support.tsx`)
Chat de **acompañamiento emocional** (streaming, `/api/support`) con tono empático, aviso de que no reemplaza a un profesional, líneas de ayuda visibles y guardarraíles de seguridad en el prompt.

## 🧭 Diagnóstico (`Diagnostic.tsx`)
Mini-test de 6 preguntas por áreas (`/api/diagnostic` modo *quiz*). Calcula desempeño por área, marca **fortalezas y debilidades** con barras, y genera un **plan personalizado** con IA (modo *plan*).

## 📊 Progreso (`Progress.tsx`)
Nivel y XP (barra), racha de días, estadísticas por tipo de actividad, **logros/insignias** desbloqueables, **gráfica de evolución de notas** (SVG) e historial de parciales.

## 🏆 Ranking (`Ranking.tsx`)
Tabla de líderes por XP (colección pública `leaderboard` en Firestore), medallas para el top 3, resalta tu fila. La puntuación se publica automáticamente al cambiar las stats.

## 👤 Perfil (`Profile.tsx`)
Avatar, nivel, XP, **posición en el ranking**, barra de progreso, estadísticas y logros.

---

## Componentes de UI reutilizables (`components/ui/`)

| Componente | Función |
|---|---|
| `Sidebar.tsx` | Navegación agrupada (desktop) + barra inferior scrollable (móvil) + usuario/racha/idioma |
| `Landing.tsx` | Página de bienvenida pre-login (hero, problema, solución, cómo funciona, para quién, CTA) |
| `AuthModal.tsx` | Modal de login (Google + correo/contraseña + registro) |
| `Onboarding.tsx` | Cuestionario de 3 pasos que arma el perfil académico |
| `RichText.tsx` | Render de markdown + LaTeX (KaTeX) + resaltado de código (highlight.js) |
| `Toast.tsx` | Notificaciones (contexto `useToast`) |
| `ErrorBanner.tsx` | Banner de error con reintento |
| `AIStatusBanner.tsx` | Aviso si la IA no está configurada (consulta `/api/health`) |
| `AccessibilityButton.tsx` | Panel flotante de accesibilidad |
| `LanguageSwitcher.tsx` | Selector de idioma |
| `SpeakButton.tsx` | Lectura en voz alta (Web Speech API) |
| `FileUploadButton.tsx` | Subida de archivos con extracción de texto/OCR |
| `ImpactPanel.tsx` | Métricas globales de impacto |
| `SectionHeader.tsx` | Encabezado consistente de cada sección |
| `UniandesMark.tsx` | Marca gráfica propia (SVG original, no es logo oficial) |
