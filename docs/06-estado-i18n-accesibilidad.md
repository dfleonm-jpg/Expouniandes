# 06 · Estado global, internacionalización y accesibilidad

Este documento explica tres piezas transversales que afectan a toda la app:

1. **`AppContext`** — el estado global del usuario y su doble persistencia
   (`localStorage` + Firestore).
2. **i18n** — el sistema de idiomas (4 locales).
3. **Accesibilidad** — fuente para dislexia, tamaño de letra, alto contraste y reducción
   de movimiento.
4. **Niveles y XP** — cómo se calcula la gamificación.

---

## 1. Estado global — `src/lib/app-context.tsx`

Un único React Context (`AppProvider` + hook `useApp()`) concentra **todo el estado del
usuario**. Cualquier sección lee/escribe desde aquí, lo que garantiza que las stats, el
perfil, el calendario, etc. sean coherentes en toda la app.

### Qué guarda

| Campo | Tipo | Para qué |
|---|---|---|
| `locale` | `Locale` | Idioma activo |
| `stats` | `Stats` | Contadores de actividad (quizzes, preguntas, foco, tareas, flashcards, resúmenes) |
| `docs` | `SereneDoc[]` | Documentos/apuntes que el usuario sube |
| `streak` | `number` | Racha de días consecutivos de estudio |
| `userName` | `string` | Nombre a mostrar |
| `examHistory` | `ExamRecord[]` | Resultados de parciales y quizzes |
| `examEvents` | `ExamEvent[]` | Fechas de parciales (calendario) |
| `a11y` | `A11y` | Preferencias de accesibilidad |
| `profile` | `StudentProfile` | Perfil del onboarding (carrera, semestre, materias, estilo, estrés) |

Y las acciones para mutarlos: `setLocale`, `addStat`, `addDoc`/`removeDoc`,
`setUserName`, `addExamRecord`, `addExamEvent`/`removeExamEvent`, `setA11y`,
`setProfile`.

### Doble persistencia (local + nube)

El estado se guarda en **dos lugares** a la vez:

1. **`localStorage`** (siempre): cada acción escribe su clave `sereno:<campo>`
   (`sereno:stats`, `sereno:profile`, `sereno:a11y`, …). Esto hace que la app funcione
   sin conexión y sin login, y que cargue al instante.
2. **Firestore** (si hay sesión): sincronización con la nube para tener el progreso en
   todos los dispositivos (ver doc 05).

**Carga inicial** (`useEffect` al montar): lee todas las claves de `localStorage`, las
fusiona con los valores por defecto (`{ ...DEFAULT, ...guardado }`) y calcula la
**racha**: si el último día fue *ayer* la incrementa, si fue *hoy* la mantiene, y si no,
la reinicia a 1. Un flag `mounted` evita el *flash* de contenido no hidratado (el
contenedor arranca con `opacity: 0` y aparece cuando ya cargó).

**Sincronización con la nube** (dos `useEffect` que dependen de `user`):
- Al **iniciar sesión** → `loadUserData(uid)` y fusiona la nube sobre lo local.
- Al **cambiar los datos** → guarda con *debounce* de **800 ms**: un solo
  `saveUserData` con todo el estado, y además `publishScore` (ranking) y la racha. Así
  no se escribe en cada pulsación.

### Métricas globales

`addStat(key, amount)` hace dos cosas: actualiza la stat local **y**, mediante el mapa
**`GLOBAL_KEY`**, suma al contador global correspondiente con `bumpGlobalMetrics`. Solo
cinco stats alimentan el panel de impacto (`focusMinutes`, `quizzesTaken`,
`questionsAnswered`, `summariesCreated`, `flashcardsReviewed`); `tasksDone` es local.

---

## 2. Internacionalización — `src/lib/i18n.ts`

Sistema propio, simple y **totalmente tipado** (sin librería externa).

- **4 locales:** `es` (predeterminado), `en`, `pt`, `fr`, definidos en `LOCALES` con su
  etiqueta y bandera.
- **`translations`** es un objeto gigante con un bloque por idioma. El tipo
  `Translation` se infiere del bloque español, de modo que **si falta una clave en otro
  idioma, TypeScript marca error** en compilación.
- El hook `useApp()` expone `t = translations[locale]`; los componentes leen textos como
  `t.nav.tutor`, `t.landing.heroTitle`, etc.
- Cambiar de idioma es inmediato: `setLocale(l)` actualiza el contexto y persiste en
  `sereno:locale`.

> **Regla al editar textos:** cualquier clave nueva debe añadirse a **los 4 bloques**
> (`es`, `en`, `pt`, `fr`) o el build falla por tipos. El tipo auxiliar `Widen` relaja
> literales a `string` para que las traducciones encajen.

---

## 3. Accesibilidad

El estado `a11y` (`{ dyslexia, fontScale, highContrast, reduceMotion }`) lo controla el
botón/panel **`AccessibilityButton`** y lo persiste `setA11y`.

**Cómo se aplica:** un `useEffect` en `AppContext` escribe directamente sobre el elemento
raíz del documento:

```ts
root.style.setProperty("--font-scale", String(a11y.fontScale)); // 0.9 … 1.4
root.classList.toggle("a11y-dyslexia", a11y.dyslexia);
root.classList.toggle("a11y-contrast", a11y.highContrast);
root.classList.toggle("a11y-reduce-motion", a11y.reduceMotion);
```

Y `globals.css` define el efecto de cada clase/variable:

| Preferencia | Clase / variable | Efecto en CSS |
|---|---|---|
| **Tamaño de letra** | `--font-scale` | `body { font-size: calc(1rem * var(--font-scale)) }` |
| **Dislexia** | `.a11y-dyslexia` | Fuente **OpenDyslexic** (CDN, con respaldo) + más interletraje, interpalabra, interlineado y ancho de línea máx. 68ch |
| **Alto contraste** | `.a11y-contrast` | Blanco puro sobre fondos opacos, bordes más visibles, quita el *blur* del vidrio |
| **Reducir movimiento** | `.a11y-reduce-motion` | Anula animaciones/transiciones y la aurora de fondo |

Además, `globals.css` respeta por defecto `@media (prefers-reduced-motion: reduce)` del
sistema. La separación es limpia: **React decide el estado, CSS decide el estilo**.

---

## 4. Niveles y XP — `src/lib/levels.ts`

La gamificación convierte la actividad en puntos y niveles:

- **`computeXP(stats)`** pondera cada acción:
  pregunta ×5, quiz ×20, flashcard ×2, resumen ×15, minuto de foco ×1, tarea ×10.
- **`levelInfo(xp)`** devuelve el nivel actual y el progreso hacia el siguiente. El
  umbral acumulado para el nivel *n* es **triangular/cuadrático**: `50 · (n-1) · n`
  → 100, 300, 600, 1000, … Cada nivel cuesta progresivamente más.
- El resultado (`level`, `progress`, `toNext`, …) alimenta las secciones **Progreso**,
  **Perfil** y **Ranking**, y el `level`/`xp` se publica en `leaderboard/{uid}`.

---

> **Siguiente:** [`07-despliegue.md`](./07-despliegue.md) cubre variables de entorno,
> despliegue en Vercel y la configuración PWA.
