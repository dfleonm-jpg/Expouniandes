# 07 · Despliegue, variables de entorno y PWA

Sereno está desplegado en **Vercel** y accesible en
**https://expouniandes.vercel.app**. Este documento explica cómo configurarlo,
desplegarlo y verificarlo.

---

## 1. Variables de entorno

Hay dos grupos, con una diferencia **crítica** de seguridad.

### Secretos del servidor (nunca llegan al navegador)
Las claves de IA solo se usan en las rutas `/api/*`, que se ejecutan en el servidor.
**Jamás** se exponen al cliente.

| Variable | Para qué | Obligatoria |
|---|---|---|
| `GROQ_API_KEY` | Proveedor de IA principal (Groq, `openai/gpt-oss-120b`) | Sí (o Gemini) |
| `GEMINI_API_KEY` | Proveedor de respaldo (Google Gemini) | Opcional |

Basta con tener **una** de las dos. El endpoint `/api/health` prefiere Groq y cae a
Gemini si no hay Groq (ver [`02-capa-ia.md`](./02-capa-ia.md)).

### Config pública de Firebase (sí llega al navegador)
Prefijo `NEXT_PUBLIC_`, lo que hace que Next.js las **incruste en el bundle** del
cliente. Son públicas por diseño; la seguridad la dan las reglas de Firestore (ver
[`05-backend-firebase.md`](./05-backend-firebase.md)).

| Variable |
|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` |

Si estas faltan, `firebaseEnabled` es `false` y la app corre en **modo local** (sin
login ni nube).

### Desarrollo local
Se definen en un archivo **`.env.local`** en la raíz del proyecto. Está en
`.gitignore`, así que **nunca se sube al repositorio**. Ejemplo:

```bash
# .env.local  (NO se versiona)
GROQ_API_KEY=gsk_xxx
# GEMINI_API_KEY=xxx            # opcional, respaldo

NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sereno-a9b69.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sereno-a9b69
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sereno-a9b69.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
```

---

## 2. Desarrollo local

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (Turbopack)  →  http://localhost:3000
npm run build      # build de producción (genera las páginas estáticas)
npm start          # servir el build de producción
```

Verificaciones de calidad antes de desplegar:

```bash
npx tsc --noEmit                   # tipos (debe salir limpio)
npx eslint "src/**/*.{ts,tsx}"     # lint
```

> Nota: algunas advertencias de reglas experimentales de React
> (`react-hooks/set-state-in-effect`, etc.) son esperables y **no bloquean** el build.

---

## 3. Despliegue en Vercel

El proyecto está conectado al repositorio de GitHub. El flujo es **Git-push → deploy
automático**:

1. Haces `git push` a la rama `main`.
2. Vercel detecta el cambio, ejecuta `npm run build` y publica.
3. En segundos, los cambios están en https://expouniandes.vercel.app.

Las variables de entorno se configuran una sola vez en **Vercel → Project → Settings →
Environment Variables**.

### ⚠️ Trampa importante: variables `NEXT_PUBLIC_*`
Las variables `NEXT_PUBLIC_*` se **incrustan en tiempo de build**, no se leen en tiempo
de ejecución. Por eso:

> Si añades o cambias una variable `NEXT_PUBLIC_FIREBASE_*` en Vercel, **debes volver a
> desplegar** (redeploy) para que tome efecto. No basta con guardarla.

Las claves de servidor (`GROQ_API_KEY`, `GEMINI_API_KEY`) sí se leen en ejecución en las
rutas `/api/*`, pero igualmente conviene redesplegar tras cambiarlas.

Para forzar un redeploy sin cambios de código:

```bash
git commit --allow-empty -m "redeploy"
git push
```

---

## 4. Verificación en producción

Comprobar que la IA está bien configurada **sin exponer las claves**:

```bash
curl -s https://expouniandes.vercel.app/api/health
# → {"ok":true,"provider":"groq","configured":{"groq":true,"gemini":false}, ...}
```

- `ok: true` y `provider: "groq"` (o `"gemini"`) → todo bien.
- `ok: false` / HTTP 503 → falta configurar `GROQ_API_KEY` en Vercel.

---

## 5. PWA (Progressive Web App)

Sereno es instalable como app:

- **`src/app/manifest.ts`** genera el `manifest.webmanifest` con Next:
  nombre, `short_name` "Sereno", `display: standalone`, `theme_color` `#8b5cf6`,
  `background_color` `#07070b`, orientación `portrait` y categorías
  `education` / `productivity`.
- **Iconos:** `public/icon.svg` (vectorial, `sizes: any`) y `public/favicon.ico` como
  respaldo.

Esto permite "Añadir a pantalla de inicio" en móvil y abrir Sereno como una app a
pantalla completa.

---

## 6. Checklist de despliegue

- [ ] `.env.local` configurado localmente (y **no** versionado).
- [ ] `npm run build` pasa sin errores.
- [ ] Variables en Vercel: `GROQ_API_KEY` + las 6 `NEXT_PUBLIC_FIREBASE_*`.
- [ ] Reglas de Firestore publicadas (doc 05).
- [ ] En Firebase Auth, habilitados los proveedores **Google** y **Correo/contraseña**,
      y el dominio `expouniandes.vercel.app` en la lista de dominios autorizados.
- [ ] `git push` a `main` → deploy automático.
- [ ] `curl /api/health` devuelve `ok: true`.

---

> Volver al [índice de la documentación](./README.md).
