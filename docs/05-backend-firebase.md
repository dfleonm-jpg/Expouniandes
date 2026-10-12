# 05 · Backend con Firebase (Auth + Firestore)

Sereno no tiene un servidor propio de base de datos. Usa **Firebase** como backend
gestionado (Backend-as-a-Service): autenticación de usuarios y una base de datos de
documentos (**Cloud Firestore**). Todo el acceso ocurre **desde el navegador** con el
SDK de cliente de Firebase; la seguridad la imponen las **reglas de Firestore**, no
nuestro código.

```
Navegador (cliente)                         Firebase (nube)
┌───────────────────────┐                   ┌────────────────────────────┐
│ auth-context.tsx      │── login/logout ──▶│ Firebase Authentication     │
│ cloud-sync.ts         │── read/write ────▶│ Cloud Firestore             │
│ chat-store.ts         │                   │   users/{uid}               │
│ leaderboard-store.ts  │                   │   users/{uid}/chats/{id}    │
│ metrics-store.ts      │                   │   leaderboard/{uid}         │
└───────────────────────┘                   │   metrics/global            │
                                            └────────────────────────────┘
```

> **Importante:** las claves de Firebase (`NEXT_PUBLIC_FIREBASE_*`) son **públicas** por
> diseño. No son un secreto: cualquiera que inspeccione el bundle las ve. Lo que protege
> los datos son las **reglas de seguridad** de Firestore (ver más abajo).

---

## 1. Inicialización — `src/lib/firebase.ts`

Un único punto de entrada, perezoso (lazy) y tolerante a configuración ausente:

- Lee la config desde variables `NEXT_PUBLIC_FIREBASE_*`.
- Expone el flag **`firebaseEnabled`** = `Boolean(apiKey && projectId)`.
  Si no hay config, la app funciona en **modo local** (solo `localStorage`, sin login
  ni nube) y ninguna función de este backend hace nada.
- `getFirebaseAuth()` y `getDb()` devuelven la instancia (creándola una sola vez con
  `getApps()` para no reinicializar) o `null` si Firebase está deshabilitado.

Este patrón `… ?? null` se repite en todos los stores: **si no hay `db`, la función
sale temprano sin romper**. Así el mismo código sirve con o sin backend configurado.

---

## 2. Autenticación — `src/lib/auth-context.tsx`

Un React Context (`AuthProvider` + hook `useAuth()`) que envuelve toda la app y expone:

| Método | Qué hace | SDK usado |
|---|---|---|
| `loginGoogle()` | Popup de Google | `GoogleAuthProvider` + `signInWithPopup` |
| `loginEmail(email, pass)` | Entrar con correo | `signInWithEmailAndPassword` |
| `registerEmail(name, email, pass)` | Crear cuenta y fijar el nombre | `createUserWithEmailAndPassword` + `updateProfile` |
| `logout()` | Cerrar sesión | `signOut` |

Además expone `user` (modelo propio `SerenoUser`: `uid`, `name`, `email`, `photo`),
`loading` y `enabled`.

- **Sesión reactiva:** `onAuthStateChanged` escucha cambios y actualiza `user`
  automáticamente (al cargar, al entrar y al salir). La sesión **persiste** entre
  recargas (Firebase guarda el token).
- **`mapUser()`** normaliza el `User` de Firebase a `SerenoUser`, con un nombre de
  respaldo (parte local del correo o "Estudiante").
- **`authErrorMessage(code)`** traduce los códigos de error de Firebase
  (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, …) a
  mensajes en español para mostrarlos en el `AuthModal`.
- El login es **obligatorio**: cuando `firebaseEnabled` es `true`, la app exige sesión
  antes de dar acceso a las herramientas (no hay modo invitado).

---

## 3. Modelo de datos en Firestore

Firestore es una base de datos de **documentos** organizados en **colecciones**. Sereno
usa cuatro rutas:

### `users/{uid}` — progreso del usuario
Documento 1-a-1 con la cuenta. Guarda el estado del `AppContext`:
`{ stats, userName, examHistory, examEvents, docs, streak, profile, updatedAt }`.

Gestionado por **`src/lib/cloud-sync.ts`**:
- `loadUserData(uid)` → `getDoc` del documento (o `null` si no existe).
- `saveUserData(uid, data)` → `setDoc(..., { merge: true })` añadiendo `updatedAt`.
  El `merge: true` es clave: **actualiza solo los campos enviados** sin pisar el resto.

> Cómo se dispara: lo orquesta `app-context.tsx` (ver doc 06). Al iniciar sesión
> **carga** desde la nube y fusiona con lo local; cuando cambian los datos **guarda**
> con *debounce* de 800 ms para no escribir en cada tecla.

### `users/{uid}/chats/{chatId}` — historial de conversaciones
Subcolección del usuario. Cada documento es un `ChatSession`
(`{ id, title, messages[], updatedAt }`). Gestionado por **`src/lib/chat-store.ts`**:
- `listChats(uid)` → últimas 50 conversaciones ordenadas por `updatedAt desc`.
- `saveChat(uid, chat)` → crea/actualiza un chat.
- `deleteChat(uid, chatId)` → borra un chat.
- `titleFromMessages(messages)` → genera un título corto (≤42 car.) desde el primer
  mensaje del usuario.

### `leaderboard/{uid}` — ranking público
Colección de **lectura pública** para la sección Ranking. Gestionada por
**`src/lib/leaderboard-store.ts`**:
- `publishScore({ uid, name, xp, level, photo })` → `setDoc(..., { merge: true })` con
  `updatedAt`. Cada usuario solo escribe **su propio** documento.
- `getLeaderboard(top = 20)` → consulta `orderBy("xp", "desc")` + `limit(top)`.

### `metrics/global` — métricas de impacto de la comunidad
Un único documento con contadores agregados de toda la comunidad:
`{ focusMinutes, quizzes, questions, summaries, flashcards }`. Gestionado por
**`src/lib/metrics-store.ts`**:
- `getGlobalMetrics()` → lee el documento (con valores por defecto en 0).
- `bumpGlobalMetrics(delta)` → suma de forma **atómica** usando `increment(n)` de
  Firestore. Esto evita condiciones de carrera: varios usuarios pueden sumar a la vez
  sin pisarse. Solo se envían los campos con delta > 0.

---

## 4. Reglas de seguridad de Firestore

Toda la seguridad vive aquí. Resumen de la política:

- **`users/{uid}` y sus subcolecciones** → solo el dueño (`request.auth.uid == uid`)
  puede leer y escribir. Nadie ve el progreso ni los chats de otro.
- **`leaderboard/{uid}`** → lectura pública (`read: true`); escritura solo del dueño de
  ese documento. Así el ranking es visible para todos pero nadie falsifica el puntaje de
  otro.
- **`metrics/global`** → lectura pública; escritura para cualquier usuario autenticado
  (solo puede incrementar contadores).

Reglas completas (modo producción):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Progreso del usuario: solo el dueño
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      // Subcolecciones (p. ej. chats): solo el dueño
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    // Ranking: lectura pública, escritura del propio documento
    match /leaderboard/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Métricas globales: lectura pública, escritura de usuarios autenticados
    match /metrics/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 5. Resumen del flujo de datos

1. El usuario entra (Google o correo) → `AuthProvider` fija `user`.
2. `app-context.tsx` detecta el `user` y llama `loadUserData` → fusiona la nube con lo
   local.
3. Mientras usa la app, cada `addStat`/registro cambia el estado local y, tras 800 ms,
   `saveUserData` lo persiste; en paralelo `publishScore` actualiza el ranking y
   `bumpGlobalMetrics` suma a las métricas globales.
4. Los chats se guardan aparte en la subcolección `chats`.
5. Al cerrar sesión, el estado vuelve a lo local y deja de sincronizar.

> **Siguiente:** [`06-estado-i18n-accesibilidad.md`](./06-estado-i18n-accesibilidad.md)
> explica cómo el `AppContext` orquesta esta sincronización, el sistema de idiomas y la
> accesibilidad.
