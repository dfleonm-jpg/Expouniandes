# Sereno

Tutor académico con inteligencia artificial, desarrollado para ExpoUniandes (Universidad de los Andes). Sereno es una plataforma de estudio cuyo objetivo es reducir el estrés académico: resuelve dudas, genera práctica equivalente a un parcial real, identifica fortalezas y debilidades del estudiante, organiza el semestre y acompaña el bienestar.

En producción: https://expouniandes.vercel.app

Nota de marca: Sereno tiene su propio logotipo. El escudo de la Universidad de los Andes se utiliza únicamente para identificar que se trata de un proyecto de ExpoUniandes.

---

## Tabla de contenido

1. [Descripción general](#1-descripción-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Estructura del repositorio](#4-estructura-del-repositorio)
5. [Capa de inteligencia artificial](#5-capa-de-inteligencia-artificial)
6. [Modelo de datos y persistencia](#6-modelo-de-datos-y-persistencia)
7. [Seguridad](#7-seguridad)
8. [Internacionalización](#8-internacionalización)
9. [Accesibilidad y PWA](#9-accesibilidad-y-pwa)
10. [Módulos funcionales](#10-módulos-funcionales)
11. [Rutas de API](#11-rutas-de-api)
12. [Puesta en marcha local](#12-puesta-en-marcha-local)
13. [Variables de entorno](#13-variables-de-entorno)
14. [Despliegue](#14-despliegue)
15. [Scripts](#15-scripts)
16. [Convenciones y límites conocidos](#16-convenciones-y-límites-conocidos)

---

## 1. Descripción general

Sereno es una aplicación web de una sola página (SPA) construida sobre Next.js con App Router. Toda la interfaz vive en una ruta raíz (`/`) y la navegación entre módulos se resuelve en el cliente mediante el hash de la URL (`#tutor`, `#quiz`, etc.), lo que permite enlaces profundos y conserva el historial del navegador sin recargar la página.

El backend es ligero y se limita a un conjunto de rutas de API (funciones serverless en Vercel) que actúan como proxy seguro frente a los proveedores de IA y a utilidades como la búsqueda web. La persistencia de datos del usuario combina almacenamiento local del navegador con sincronización en la nube mediante Firebase (Authentication y Cloud Firestore).

Principios de diseño del sistema:

- Las claves de los proveedores de IA nunca se exponen al cliente: viven en variables de entorno del servidor y solo se usan dentro de las rutas de API.
- La experiencia funciona de forma degradada: si Firebase no está configurado, la aplicación sigue operando con almacenamiento local; si un proveedor de IA falla, se reintenta con un proveedor de respaldo.
- El estado del usuario es privado por defecto; las reglas de Firestore restringen el acceso al propio dueño salvo en los recursos pensados para ser compartidos.

---

## 2. Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Librería de UI | React 19 |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Animación | Framer Motion |
| Iconografía | Lucide React |
| Autenticación | Firebase Authentication |
| Base de datos | Cloud Firestore |
| Proveedores de IA | Groq (primario) y Google Gemini (respaldo y visión) |
| Render de Markdown | react-markdown con remark-gfm, remark-math, rehype-katex y rehype-highlight |
| Matemáticas | KaTeX |
| Resaltado de código | highlight.js |
| Extracción de texto | pdfjs-dist (PDF) y tesseract.js (OCR de imágenes) |
| Despliegue | Vercel |

No se utilizan librerías de gestión de estado externas; el estado global se resuelve con React Context. No hay ORM ni capa de base de datos propia: Firestore se consume directamente desde el cliente a través de módulos de acceso dedicados.

---

## 3. Arquitectura

### 3.1 Visión de capas

```
+---------------------------------------------------------------+
|                         Navegador                             |
|                                                               |
|  app/page.tsx  (router por hash, monta/desmonta secciones)    |
|        |                                                      |
|        v                                                      |
|  components/sections/*   (módulos funcionales de la UI)       |
|        |                                                      |
|        v                                                      |
|  Contextos React:                                             |
|    - AppProvider   (preferencias, estadísticas, dominio, ...) |
|    - AuthProvider  (sesión de usuario)                        |
|    - ToastProvider (notificaciones)                           |
|        |                        |                             |
|        v                        v                             |
|  lib/*  (hooks, stores, IA cliente, utilidades)               |
+--------|------------------------|-----------------------------+
         |                        |
         | HTTPS                  | SDK de Firebase
         v                        v
+------------------------+   +--------------------------------+
|  Rutas de API (Vercel) |   |  Firebase                      |
|  app/api/*             |   |   - Authentication             |
|   - proxy a IA         |   |   - Cloud Firestore            |
|   - rate limiting      |   |     (reglas de seguridad)      |
|   - validación         |   +--------------------------------+
|        |               |
|        v               |
|  Groq  /  Gemini        |
+------------------------+
```

### 3.2 Flujo de una petición a la IA

1. Un componente de sección recoge la entrada del usuario y llama a un hook (`useAIRequest` para JSON, `useChatStream` para respuestas en streaming).
2. El hook envía una petición HTTP a la ruta de API correspondiente (`app/api/...`), adjuntando automáticamente el perfil del estudiante cuando procede.
3. La ruta de API aplica control de tasa (rate limiting) por IP, valida y acota la entrada, y construye el prompt a partir de `lib/prompts.ts`.
4. La capa de IA (`lib/ai.ts`) selecciona el proveedor disponible y, si el primario falla con un error recuperable, reintenta con el secundario (failover real).
5. La respuesta se devuelve como JSON validado o como flujo de texto; el cliente la renderiza y, cuando aplica, actualiza estadísticas, dominio por materia o historial.

### 3.3 Gestión de secciones en el cliente

`app/page.tsx` mantiene un estado `section` sincronizado con el hash de la URL. Las secciones con estado que no debe perderse (tutor, quizzes, parciales, práctica de código y matemáticas, estudio de diseño, apoyo) se mantienen montadas y ocultas al cambiar de vista; el resto se animan al entrar y salir. Esto preserva conversaciones a medias o ejercicios sin terminar al navegar.

---

## 4. Estructura del repositorio

```
Expouniandes/
├── public/                     Recursos estáticos (logo, imagen de campus, íconos PWA)
├── firestore.rules             Reglas de seguridad de Cloud Firestore
├── firebase.json               Configuración de despliegue de reglas
├── next.config.ts              Configuración de Next.js
├── eslint.config.mjs           Configuración de ESLint
├── tsconfig.json               Configuración de TypeScript
└── src/
    ├── app/
    │   ├── layout.tsx          Layout raíz: fuentes, proveedores, fondo, metadatos
    │   ├── page.tsx            Router por hash y montaje de secciones
    │   ├── globals.css         Sistema de diseño (tokens, superficies, animaciones)
    │   ├── manifest.ts         Manifiesto de la PWA
    │   └── api/                Rutas de API (una carpeta por endpoint)
    ├── components/
    │   ├── sections/           Un componente por módulo funcional
    │   └── ui/                 Componentes reutilizables de interfaz
    └── lib/                    Lógica de dominio, acceso a datos, hooks y utilidades
```

### 4.1 Módulos de `src/lib`

| Archivo | Responsabilidad |
|---------|-----------------|
| `ai.ts` | Capa agnóstica al proveedor de IA: selección, failover, streaming, generación de JSON y texto, y generación con imagen (visión). |
| `prompts.ts` | Prompts centralizados de todos los módulos de IA, con contexto de perfil y enfoque por disciplina. |
| `api-helpers.ts` | Utilidades de las rutas de API: respuestas JSON, manejo de errores, lectura acotada de cuerpos, validación de entrada. |
| `rate-limit.ts` | Control de tasa por IP con ventanas temporales y perfiles por tipo de endpoint. |
| `app-context.tsx` | Contexto global: preferencias, estadísticas, racha, perfil, dominio por materia, historial de parciales y de errores, sincronización en la nube. |
| `auth-context.tsx` | Contexto de autenticación sobre Firebase Authentication. |
| `cloud-sync.ts` | Lectura y escritura del documento de usuario en Firestore. |
| `chat-store.ts` | Persistencia del historial de conversaciones del tutor. |
| `share-store.ts` | Códigos cortos para compartir recursos y grupos de estudio. |
| `blog-store.ts`, `blog-types.ts`, `blog-i18n.ts` | Módulo de blog: acceso a datos, tipos y textos. |
| `leaderboard-store.ts`, `metrics-store.ts` | Ranking y métricas globales. |
| `mastery.ts` | Motor de dominio adaptativo por materia y tema (media móvil exponencial). |
| `levels.ts` | Cálculo de experiencia (XP) y niveles a partir de la actividad. |
| `subjects.ts` | Catálogo de áreas y materias, y "lentes" de evaluación por disciplina. |
| `design3d.ts`, `pet-svg.ts` | Motores de render SVG/Canvas para el estudio de diseño y la mascota. |
| `extract-text.ts` | Extracción de texto de PDF e imágenes (OCR). |
| `i18n.ts` | Diccionario de interfaz en cuatro idiomas. |
| `types.ts` | Tipos de dominio compartidos. |
| `useAI.ts`, `useChatStream.ts`, `useSpeech.ts`, `useVoiceInput.ts`, `useCopy.ts`, `useModalA11y.ts` | Hooks de cliente. |
| `firebase.ts` | Inicialización condicional del SDK de Firebase. |

---

## 5. Capa de inteligencia artificial

La capa de IA (`src/lib/ai.ts`) abstrae a los proveedores y expone cuatro operaciones: chat en streaming, generación de JSON, generación de texto y generación de JSON a partir de una imagen.

- Selección de proveedor: si existe clave de Groq se usa como primario; Gemini actúa como respaldo. Para análisis de imágenes se prioriza Gemini por su soporte de visión.
- Failover: cuando el proveedor primario responde con un error recuperable (límite de tasa, falta de cuota o error del servidor), la operación se reintenta automáticamente con el proveedor secundario antes de fallar.
- Streaming: las respuestas del tutor se transmiten token a token. Los errores a mitad de flujo se propagan al cliente mediante un marcador, de modo que una respuesta truncada no se presenta como exitosa.
- Validación de JSON: las respuestas que deben ser JSON se parsean de forma tolerante y, ante formato inesperado, se devuelve un error legible en lugar de romper la interfaz.
- Mensajes de error legibles: los fallos se traducen a mensajes orientados al usuario (clave inválida, sin cuota, servicio temporalmente no disponible, etcétera).

Los prompts viven en `src/lib/prompts.ts` y comparten reglas comunes: idioma de respuesta según la configuración del usuario, formato con Markdown y LaTeX cuando aplica, y un bloque de "lente" por disciplina (`src/lib/subjects.ts`) que ajusta el vocabulario, los criterios de evaluación y los errores típicos según el área de estudio.

---

## 6. Modelo de datos y persistencia

### 6.1 Estrategia de doble capa

El estado del usuario se guarda en dos niveles complementarios:

1. `localStorage` del navegador, bajo claves con prefijo `sereno:` (una por campo). Proporciona respuesta inmediata y funcionamiento sin conexión.
2. Cloud Firestore, en un único documento por usuario, cuando hay sesión iniciada. La escritura usa `merge`, por lo que los campos nuevos son retrocompatibles con documentos antiguos.

Al iniciar sesión se cargan los datos de la nube y se fusionan con lo local. Los cambios posteriores se sincronizan con un retardo (debounce) para evitar escrituras excesivas.

### 6.2 Colecciones de Firestore

| Ruta | Contenido | Acceso |
|------|-----------|--------|
| `users/{uid}` | Progreso del usuario: estadísticas, perfil, racha, historial de parciales, historial de errores de quizzes, dominio por materia y documentos. | Privado del dueño. |
| `users/{uid}/chats/{id}` | Conversaciones del tutor. | Privado del dueño. |
| `leaderboard/{uid}` | Entrada de ranking (nombre, XP, nivel). | Lectura pública; escritura validada del propio documento. |
| `shares/{code}` | Recursos y grupos compartidos por código corto. | Lectura pública; creación validada; sin edición ni borrado. |
| `posts/{id}` y subcolecciones `comments`, `reactions` | Blog: publicaciones, comentarios y reacciones. | Lectura para usuarios autenticados; escritura solo del autor. |
| `metrics/{doc}` | Métricas globales agregadas. | Lectura pública; actualización solo por incrementos. |

### 6.3 Dominio adaptativo y experiencia

- El dominio por materia y tema (`src/lib/mastery.ts`) se actualiza con cada actividad mediante una media móvil exponencial, de modo que refleja el nivel actual del estudiante y no solo el histórico.
- La experiencia (`src/lib/levels.ts`) se calcula a partir de la actividad (preguntas respondidas, quizzes, resúmenes, minutos de enfoque, tareas) y determina el nivel y la posición en el ranking.

---

## 7. Seguridad

- Claves de IA: residen en variables de entorno del servidor y solo se utilizan dentro de las rutas de API. Nunca se envían al navegador.
- Control de tasa: cada ruta de IA aplica límites por IP con ventanas temporales, devolviendo el código 429 y la cabecera `Retry-After` cuando se superan.
- Validación de entrada: las rutas acotan el tamaño del cuerpo de la petición, recortan textos y validan tipos antes de procesar.
- Reglas de Firestore (`firestore.rules`): el progreso del usuario es privado; el ranking y los recursos compartidos tienen lectura pública con escritura validada por forma, tipos y longitudes; en el blog solo el autor puede modificar su contenido, y las reacciones usan el identificador de usuario como identificador del documento para impedir duplicados. Los totales del blog no se almacenan como contadores: se calculan contando documentos, lo que elimina la posibilidad de manipularlos.

Las reglas deben publicarse en Firebase para que el blog y los grupos funcionen. Pueden desplegarse con la CLI de Firebase o pegándose en la consola de Firestore.

---

## 8. Internacionalización

La interfaz está disponible en español, inglés, portugués y francés. Los textos viven en `src/lib/i18n.ts` (interfaz general) y `src/lib/blog-i18n.ts` (módulo de blog). El tipado garantiza simetría entre idiomas: si una clave falta en alguno de los locales, la compilación de TypeScript falla. El idioma seleccionado se persiste y se propaga a los prompts de IA para que las respuestas se generen en el idioma del usuario.

---

## 9. Accesibilidad y PWA

- Accesibilidad: opciones de fuente para dislexia, escala tipográfica, alto contraste y reducción de movimiento, aplicadas como clases sobre el documento. Se respeta la preferencia del sistema para reducir movimiento.
- Diseño responsivo: navegación lateral en escritorio y barra inferior con panel de secciones en dispositivos móviles, con soporte para áreas seguras (notch e indicador de inicio).
- PWA: manifiesto e integración instalable, con comportamiento degradado cuando no hay conexión.

---

## 10. Módulos funcionales

### Aprender
- Tutor con IA: chat en streaming con selección de nivel de explicación, carga de apuntes como contexto, búsqueda web opcional e historial de conversaciones.
- Buscar: búsqueda educativa que alimenta las respuestas con citación de fuentes.
- Resúmenes: generación de TL;DR, puntos clave y conceptos a partir de texto o archivos (PDF e imágenes con OCR), con reproducción por voz.
- Mapas mentales: generación de mapas radiales interactivos con ramas, detalles y exportación a imagen.

### Practicar
- Quizzes: cuestionarios de opción múltiple con explicación detallada por pregunta.
- Parcial: evaluación cronometrada de opción múltiple.
- Parcial abierto: preguntas de respuesta abierta adaptadas a la disciplina, con calificación por rúbrica.
- Flashcards: tarjetas de estudio con repaso.
- Práctica de código: ejercicios por lenguaje con revisión pedagógica del código enviado.
- Práctica de cálculo: problemas de respuesta abierta con revisión del procedimiento paso a paso.
- Estudio de diseño: lienzo de dibujo, carga de diseños y editor de objetos con acabado tridimensional, con retroalimentación de IA mediante visión.

### Organizar
- Métodos de estudio, planificador, calendario de evaluaciones y grupos de estudio con códigos para compartir.
- Blog: publicaciones, comentarios y reacciones entre estudiantes.

### Bienestar
- Bienestar: técnicas de respiración y pausas.
- Apoyo: acompañamiento conversacional.

### Avance
- Perfil y diagnóstico inicial.
- Progreso: estadísticas, historial de parciales y análisis de errores con IA.
- Repasar errores: las preguntas falladas en quizzes se guardan con su explicación para estudio posterior.
- Ranking y mascota de estudio que evoluciona con la experiencia acumulada.

---

## 11. Rutas de API

Todas las rutas residen en `src/app/api` y se ejecutan como funciones serverless. Reciben peticiones `POST` con cuerpo JSON (salvo las de verificación), aplican control de tasa y devuelven JSON o flujo de texto.

| Ruta | Función |
|------|---------|
| `chat` | Chat del tutor en streaming. |
| `quiz` | Generación de quizzes de opción múltiple. |
| `summary` | Resúmenes de estudio. |
| `mindmap` | Mapas mentales. |
| `flashcards` | Tarjetas de estudio. |
| `code-exercise`, `code-review` | Generación y revisión de ejercicios de programación. |
| `math-problem`, `math-review` | Generación y revisión de problemas de cálculo. |
| `open-exam`, `open-exam-grade` | Generación y calificación de parciales de respuesta abierta. |
| `diagnostic` | Quiz diagnóstico por áreas. |
| `exam-analysis` | Análisis de patrones de error del historial. |
| `design-feedback` | Retroalimentación de diseños mediante visión. |
| `study-plan` | Planes de estudio personalizados. |
| `method` | Recomendación de método de estudio. |
| `support` | Conversación de acompañamiento. |
| `web-search` | Búsqueda web educativa. |
| `quote` | Frase motivacional. |
| `health` | Verificación de disponibilidad de la IA. |

---

## 12. Puesta en marcha local

Requisitos: Node.js 20 o superior y un gestor de paquetes (npm).

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables de entorno (ver la sección 13)
#    Archivo: .env.local

# 3. Ejecutar en modo desarrollo
npm run dev

# 4. Abrir http://localhost:3000
```

Sin claves de IA la interfaz carga, pero las funciones de IA mostrarán un aviso indicando que el servicio no está configurado. Sin configuración de Firebase la aplicación funciona con almacenamiento local, sin sincronización en la nube ni autenticación.

---

## 13. Variables de entorno

Definir en `.env.local` para desarrollo y en la configuración del proyecto en Vercel para producción.

Proveedores de IA (al menos uno):

```
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

Opcionalmente puede fijarse el modelo con `GROQ_MODEL` y `GEMINI_MODEL`.

Firebase (cliente). Son valores públicos por naturaleza; la seguridad real recae en las reglas de Firestore:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 14. Despliegue

El proyecto está preparado para Vercel. Cada publicación en la rama principal genera un despliegue en producción.

Pasos:

1. Importar el repositorio en Vercel.
2. Configurar las variables de entorno de la sección 13.
3. Publicar las reglas de Firestore (necesario para blog y grupos):
   ```bash
   firebase deploy --only firestore:rules
   ```
   O copiando el contenido de `firestore.rules` en la consola de Firebase, en la sección de reglas de Firestore.
4. Verificar la disponibilidad de la IA consultando el endpoint de salud: `GET /api/health`.

---

## 15. Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compilación de producción. |
| `npm run start` | Servidor de producción (tras compilar). |
| `npm run lint` | Análisis estático con ESLint. |

Verificación de tipos sin emitir archivos: `npx tsc --noEmit`.

---

## 16. Convenciones y límites conocidos

- Todo texto visible debe añadirse a los diccionarios de internacionalización en los cuatro idiomas; no se escriben cadenas sueltas en los componentes.
- Las respuestas de IA que deben ser estructuradas se validan contra una forma esperada; no se confía ciegamente en la salida del modelo.
- Límites actuales, susceptibles de mejora futura:
  - Al eliminar una publicación del blog, sus comentarios y reacciones quedan huérfanos; la interfaz no los muestra, pero su borrado definitivo requeriría una función de servidor.
  - Los totales del blog se calculan con lecturas por documento; con tráfico elevado convendría mantener contadores agregados en el servidor.
  - El dominio adaptativo y la experiencia se calculan en el cliente; para un ranking totalmente a prueba de manipulación, el cálculo debería trasladarse a una función con privilegios de administrador.

---

## 17. Licencia y derechos

Copyright (c) 2026 **Daniel Felipe León Martínez** y **Grupo Sereno**. Todos los derechos reservados.

Este es un proyecto de software propietario. El código, el diseño, la identidad visual y la documentación son propiedad exclusiva de los titulares y están protegidos por las leyes de derechos de autor de Colombia y los tratados internacionales aplicables. Su publicación en este repositorio no implica cesión ni licencia de uso. Queda prohibida la reproducción, modificación, distribución o explotación sin autorización previa y escrita de los titulares.

Documentos legales incluidos en el repositorio:

- `LICENSE` — Licencia de software propietario y reserva de derechos.
- `NOTICE` — Aviso de titularidad y componentes de terceros.
- `TERMS.md` — Términos y Condiciones de uso.
- `PRIVACY.md` — Política de Privacidad.

El nombre y el escudo de la Universidad de los Andes pertenecen a dicha institución y se usan únicamente para identificar el origen del proyecto, sin implicar afiliación ni respaldo.

---

Proyecto desarrollado para la ExpoUniandes, Universidad de los Andes.
Autoría: Daniel Felipe León Martínez — Grupo Sereno.
