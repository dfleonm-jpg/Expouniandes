# 📚 Documentación técnica — Sereno

**Sereno** es una aplicación web de tutoría académica con Inteligencia Artificial, creada para la comunidad de la Universidad de los Andes como proyecto de **ExpoUniandes**. Su objetivo es **reducir el estrés académico** ayudando a los estudiantes a entender, practicar y organizar su semestre.

🔗 **En producción:** https://expouniandes.vercel.app

---

## 📖 Índice de la documentación

| Documento | Contenido |
|---|---|
| [`01-arquitectura.md`](./01-arquitectura.md) | Visión general, stack tecnológico, estructura de carpetas y flujo de datos |
| [`02-capa-ia.md`](./02-capa-ia.md) | Cómo funciona la IA: proveedores, streaming, prompts, personalización |
| [`03-api-endpoints.md`](./03-api-endpoints.md) | Documentación de las 16 rutas de API (qué recibe, qué devuelve) |
| [`04-secciones.md`](./04-secciones.md) | Cada módulo/sección de la app, qué hace y cómo se construyó |
| [`05-backend-firebase.md`](./05-backend-firebase.md) | Autenticación, base de datos, modelo de datos y reglas de seguridad |
| [`06-estado-i18n-accesibilidad.md`](./06-estado-i18n-accesibilidad.md) | Estado global, multi-idioma y accesibilidad |
| [`07-despliegue.md`](./07-despliegue.md) | Variables de entorno, despliegue en Vercel y PWA |

---

## 🎯 Resumen en una frase

Sereno es una **Single Page Application** construida en **Next.js 16** que combina una **capa de IA agnóstica** (Groq / Google Gemini) con un **backend serverless en Firebase** (login + base de datos), ofreciendo ~18 herramientas de estudio (tutor, quizzes, parciales, flashcards, mapas mentales, práctica de código/cálculo, bienestar, etc.) en 4 idiomas.

## 🧩 Las piezas en 30 segundos

```
Usuario (navegador)
      │
      ▼
┌─────────────────────────────────────────────┐
│  FRONTEND (Next.js App Router, React 19)      │
│  • Landing + login (Firebase Auth)            │
│  • ~18 secciones (components/sections)        │
│  • Estado global (React Context + localStorage)│
│  • Sincronización con la nube (Firestore)     │
└───────────────┬───────────────────────────────┘
                │ fetch POST /api/*
                ▼
┌─────────────────────────────────────────────┐
│  BACKEND (Route Handlers de Next, serverless) │
│  • 16 endpoints en src/app/api/*              │
│  • Capa de IA unificada (src/lib/ai.ts)       │
└───────────────┬───────────────────────────────┘
                │
      ┌─────────┴──────────┐
      ▼                    ▼
┌───────────┐      ┌────────────────┐
│  Groq /    │      │  Wikipedia API  │
│  Gemini    │      │  (búsqueda web) │
│  (LLM)     │      └────────────────┘
└───────────┘

En paralelo, el navegador habla directo con:
┌─────────────────────────────────────────────┐
│  FIREBASE  (Auth + Firestore)                 │
│  • Login Google / correo                      │
│  • users/{uid}, leaderboard, metrics          │
└─────────────────────────────────────────────┘
```

> Nota: la IA se llama **desde el servidor** (las claves nunca llegan al navegador). Firebase se usa **desde el cliente** (sus claves son públicas por diseño y la seguridad está en las reglas de Firestore).
