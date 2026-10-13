# 🧠 Sereno — Tutor con IA para estudiar sin estrés

Proyecto para **ExpoUniandes** (Universidad de los Andes). Sereno es una plataforma de estudio con inteligencia artificial cuyo objetivo es **reducir el estrés académico**: resuelve dudas, te hace practicar como en el parcial real, detecta tus fortalezas y debilidades, organiza tu semestre y cuida tu bienestar.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28)

🔗 **En producción:** https://expouniandes.vercel.app

> **Nota de marca:** _Sereno_ tiene su propio logotipo (un cerebro). El escudo de la Universidad de los Andes se usa únicamente para identificar que es un proyecto de ExpoUniandes.

---

## ✨ Funcionalidades

### Aprender
| Módulo | Descripción |
|--------|-------------|
| 💬 **Tutor IA** | Chat en streaming que explica cualquier tema, con **selector de nivel** (básico / intermedio / avanzado). Permite **subir apuntes**, **búsqueda web** (Wikipedia) e **historial de conversaciones** en la nube. |
| 🔎 **Buscar** | Búsqueda educativa que la IA usa para responder y citar fuentes. |
| 📑 **Resúmenes** | Pega texto o sube un archivo (PDF/imagen con OCR) y obtén TL;DR, puntos clave y conceptos. |
| 🧩 **Mapas mentales** | Mapa radial interactivo (zoom, expandir/colapsar, export PNG) generado por IA. |

### Practicar
| Módulo | Descripción |
|--------|-------------|
| 📝 **Quizzes** | Cuestionarios de opción múltiple con explicaciones. |
| 🎓 **Parcial cronometrado** | Examen con tiempo límite (30/60/90 min) tipo opción múltiple. |
| ✍️ **Parcial abierto** | **La IA genera preguntas de respuesta escrita** (subnetting/IP, estructuras de datos, cálculo, código) y las **califica** con rúbrica, puntaje parcial, feedback por pregunta y solución modelo. |
| 🃏 **Flashcards** | Tarjetas de estudio con volteo 3D. |

### Ciencias e Ingeniería
| Módulo | Descripción |
|--------|-------------|
| 💻 **Práctica de código** | Ejercicios de Python tipo parcial Uniandes con **restricciones** (sin while, sin recursión…). Revisión pedagógica con nota 0–5. |
| ∑ **Práctica de cálculo** | Problemas de respuesta abierta a mano; la IA revisa tu procedimiento paso a paso (LaTeX). |

### Organizar
| Módulo | Descripción |
|--------|-------------|
| 🗓️ **Planificador** | Planes de estudio **especializados y personalizados** (por materia, intensidad, horas/día y fecha de parcial) + **plan automático** desde tu próximo parcial priorizando tus debilidades. Incluye tareas + Pomodoro. |
| 📅 **Calendario** | Fechas de parciales con **detector de sobrecarga académica** (calma / moderada / crítica) y export a `.ics`. |
| 👥 **Grupos** | Comparte por código. |

### Tu avance
| Módulo | Descripción |
|--------|-------------|
| 🧭 **Diagnóstico** | Mini-test que detecta fortalezas y debilidades por área y genera un plan. |
| 📊 **Progreso** | Niveles/XP, racha, logros, historial de parciales con **análisis de errores por IA** y el **perfil de dominio adaptativo**. |
| 🏆 **Ranking** | Clasificación por XP de la comunidad. |
| 👤 **Perfil** | Datos del estudiante y resumen de avance. |

### Bienestar
| Módulo | Descripción |
|--------|-------------|
| 🧘 **Bienestar** | 3 técnicas de respiración guiada, sonidos ambientales, estado de ánimo y frase motivadora. |
| 🫂 **Apoyo** | Acompañamiento emocional empático (no es terapia; deriva a ayuda profesional ante señales de crisis). |

---

## 🎯 Sistema de dominio adaptativo

Sereno mantiene un **perfil de dominio por tema** (0–100) que **se actualiza con cada actividad** (quiz, parcial, parcial abierto, práctica de código/cálculo, diagnóstico) usando una **media móvil exponencial**. Así refleja tu **nivel actual** y no solo el histórico: si mejoras, tu dominio sube; si fallas, baja. Clasifica cada tema en _principiante → en progreso → competente → dominado_ y alimenta los planes automáticos para priorizar lo que más necesitas reforzar.

---

## 🔐 Seguridad y robustez

- **Rate limiting** por IP + ruta en todos los endpoints de IA (protege la cuota y evita abuso).
- **Validación y saneo** de todas las entradas, con límite de tamaño del body.
- **Claves de IA solo en el servidor** (nunca llegan al navegador).
- **Reglas de Firestore versionadas y endurecidas** (`firestore.rules`): progreso privado por usuario; ranking y métricas con forma validada / solo-incrementos.
- **Failover de IA**: si Groq falla, cae automáticamente a Gemini.
- Streaming que **propaga errores** al cliente en vez de truncar en silencio.

---

## 🎨 Diseño

- Tema oscuro **profesional** (azul-pizarra + acento azul/cian), estilo producto moderno.
- Profundidad por capas (aurora + rejilla sutil), **glassmorphism**, micro-interacciones y animaciones con **Framer Motion**.
- **Accesibilidad**: fuente para dislexia, escala de texto, alto contraste y reducción de movimiento.
- Totalmente **responsive** (navegación inferior en móvil) e instalable como **PWA**.

---

## 🧱 Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Framer Motion** + **Lucide Icons** + **KaTeX**
- **Groq** / **Google Gemini** como motores de IA (intercambiables, con failover)
- **Firebase** (Auth con Google/correo + Firestore) para login y sincronización en la nube
- 4 idiomas: Español · Inglés · Portugués · Francés

---

## 🚀 Puesta en marcha

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea `.env.local` en la raíz:

```bash
# IA (elige al menos una; si configuras ambas, Groq es el primario)
GROQ_API_KEY=tu_clave        # https://console.groq.com/keys
GEMINI_API_KEY=tu_clave      # https://aistudio.google.com/apikey  (opcional, respaldo)

# Firebase (público por diseño; sin esto la app corre en modo local sin login)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Desarrollo
```bash
npm run dev        # http://localhost:3000
```

### 4. Producción
```bash
npm run build && npm run start
```

### 5. Verificar la IA
Visita `/api/health` → `{"ok":true}` si la IA está configurada.

---

## 📦 Despliegue (Vercel)

1. Conecta el repo a [Vercel](https://vercel.com).
2. Añade las variables de entorno (IA + `NEXT_PUBLIC_FIREBASE_*`).
3. Deploy. Cada `push` a `main` redespliega automáticamente.
4. Publica las reglas de Firestore: `firebase deploy --only firestore:rules` (o pégalas desde `firestore.rules`).

> ⚠️ Las variables `NEXT_PUBLIC_*` se incrustan en build: si cambias una, haz **redeploy**.

---

## 📚 Documentación técnica

Documentación detallada en la carpeta [`docs/`](./docs):

| Documento | Contenido |
|---|---|
| [`01-arquitectura.md`](./docs/01-arquitectura.md) | Stack, estructura y flujo de datos |
| [`02-capa-ia.md`](./docs/02-capa-ia.md) | Proveedores, streaming, prompts, failover |
| [`03-api-endpoints.md`](./docs/03-api-endpoints.md) | Todos los endpoints de API |
| [`04-secciones.md`](./docs/04-secciones.md) | Cada sección y componente |
| [`05-backend-firebase.md`](./docs/05-backend-firebase.md) | Auth, Firestore y reglas de seguridad |
| [`06-estado-i18n-accesibilidad.md`](./docs/06-estado-i18n-accesibilidad.md) | Estado global, idiomas, accesibilidad, niveles |
| [`07-despliegue.md`](./docs/07-despliegue.md) | Variables, Vercel, PWA |

---

Hecho con 💙 para ExpoUniandes · Universidad de los Andes.
