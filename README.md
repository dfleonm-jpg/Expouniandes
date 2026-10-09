# 🧘 Sereno — Tutor con IA para estudiar sin estrés

Proyecto para **ExpoUniandes**. Sereno es un compañero de estudio con inteligencia artificial cuyo objetivo es **reducir el estrés académico**: resuelve dudas, genera quizzes, ayuda a gestionar el tiempo y cuida tu bienestar.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 💬 **Tutor IA** | Chat en tiempo real (streaming) que explica cualquier tema con lenguaje claro. |
| 📝 **Generador de Quizzes** | Crea cuestionarios de opción múltiple sobre cualquier tema, con explicaciones. |
| 🗓️ **Gestor de tiempo** | Lista de tareas + temporizador Pomodoro para mantener el foco. |
| 🧘 **Bienestar** | Ejercicio de respiración guiada y consejos para reducir el estrés. |
| 📊 **Progreso** | Estadísticas de tu actividad (guardadas en tu navegador). |
| 🌍 **Multi-idioma** | Español, Inglés, Portugués y Francés. |

## 🎨 Diseño

- Tema oscuro premium con **glassmorphism** y fondo "aurora" animado.
- Animaciones fluidas con **Framer Motion**.
- Totalmente **responsive** (navegación inferior en móvil).

## 🚀 Puesta en marcha

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar la clave de IA
Copia `.env.example` a `.env.local` y añade **una** clave:

```bash
cp .env.example .env.local
```

Sereno funciona con dos proveedores de IA gratuitos (elige uno):

- **Groq** (recomendado, gratis y ultrarrápido) → https://console.groq.com/keys
  ```
  GROQ_API_KEY=tu_clave_aqui
  ```
- **Google Gemini** (free tier) → https://aistudio.google.com/apikey
  ```
  GEMINI_API_KEY=tu_clave_aqui
  ```

> Si configuras ambas, se usa Groq por defecto.

### 3. Desarrollo
```bash
npm run dev
```
Abre http://localhost:3000

### 4. Producción
```bash
npm run build
npm run start
```

## 🧱 Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Framer Motion** + **Lucide Icons**
- **Groq** / **Google Gemini** como motores de IA (intercambiables)

## 📦 Despliegue gratis

El proyecto está listo para **Vercel** (plan gratuito):
1. Sube el repo a GitHub.
2. Importa el repo en https://vercel.com.
3. Añade la variable de entorno `GROQ_API_KEY` (o `GEMINI_API_KEY`).
4. Deploy. ✅

---

Hecho con 💜 para ExpoUniandes.
