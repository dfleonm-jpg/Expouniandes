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

Sereno es una **Single Page Application** construida en **Next.js 16** que combina una **capa de IA agnóstica** (Groq / Google Gemini, con failover) con un **backend serverless en Firebase** (login + base de datos), ofreciendo ~19 herramientas de estudio (tutor con niveles, quizzes, parciales de opción múltiple y **de respuesta abierta calificados por IA**, flashcards, mapas mentales, práctica de código/cálculo, **planes de estudio especializados y automáticos**, bienestar, etc.) en 4 idiomas.

## 🧠 Capacidades inteligentes destacadas

- **Dominio adaptativo**: perfil de fortalezas/debilidades por tema que se actualiza con cada actividad (media móvil exponencial) y clasifica cada tema en principiante → en progreso → competente → dominado.
- **Parcial abierto**: la IA genera y **califica** preguntas de respuesta escrita (subnetting/IP, estructuras, cálculo, código) con rúbrica y solución modelo.
- **Planes especializados y automáticos**: por materia/intensidad/fecha de parcial, priorizando automáticamente las debilidades detectadas.
- **Análisis de errores de parciales** y **detector de sobrecarga académica**.
- **Seguridad**: rate limiting, validación/saneo de entradas, claves de IA solo en servidor y reglas de Firestore endurecidas.

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
