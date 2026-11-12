# Implementar el módulo de Blog en Sereno (ExpoUniandes)

## Rol y objetivo
Eres un ingeniero senior trabajando sobre el repositorio **ExpoUniandes** (producto: **Sereno**). Tu tarea es **integrar un módulo de Blog que ya está escrito y probado** (tipos, TypeScript y lint). No lo rediseñes: copia los archivos tal cual y aplica unos pocos cambios mínimos.

Stack (no añadir nada): Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Framer Motion, Lucide React, Firebase Auth + Firestore (cliente), Vercel. **No agregues dependencias.**

## Reglas estrictas (léelas antes de empezar)
1. **No refactorices ni "mejores" código existente.** Solo se tocan 4 archivos existentes, con los cambios exactos de la sección 2.
2. **Los archivos nuevos se copian literalmente** (sección 1). Si algo no compila, arréglalo con el cambio más pequeño posible y dímelo; no reescribas.
3. **No debilites `firestore.rules`.** Las reglas de `users`, `leaderboard`, `shares` y `metrics` deben quedar idénticas. Solo se inserta el bloque nuevo.
4. `AGENTS.md` advierte que este Next.js tiene cambios respecto a lo habitual: ante cualquier duda de API, consulta `node_modules/next/dist/docs/`.
5. No cambies `package.json`, `package-lock.json`, la inicialización de Firebase ni `auth-context.tsx`.
6. Todo texto visible del Blog ya está en 4 idiomas en `blog-i18n.ts`; no escribas textos sueltos en los componentes.

## Cómo funciona (contexto, para que no lo rompas)
- Firestore: `posts/{id}`, `posts/{id}/comments/{id}`, `posts/{id}/reactions/{uid}`. El **ID de la reacción es el UID**: imposible duplicar reacciones.
- **No hay contadores guardados.** Likes, dislikes y comentarios se calculan con `getCountFromServer` sobre los propios documentos → sin carreras ni valores manipulables.
- Lectura solo para usuarios autenticados (la app ya exige login). Escritura solo del autor, con campos y longitudes validados en las reglas.
- Límites: título 1–120, contenido 1–5000, comentario 1–1000 (iguales en `blog-store.ts` y en las reglas).
- Paginación: 10 posts por página y 20 comentarios por página, con cursor (`startAfter`).

---

## 1. Crear estos 8 archivos NUEVOS (copiar literal)
Los archivos están en el .md adjunto (sección "Código") y también en la carpeta `archivos-nuevos/` con su ruta exacta. Rutas:

- `src/lib/blog-types.ts`
- `src/lib/blog-i18n.ts`
- `src/lib/blog-store.ts`
- `src/components/ui/Avatar.tsx`
- `src/components/sections/BlogComposer.tsx`
- `src/components/sections/BlogComments.tsx`
- `src/components/sections/BlogPostCard.tsx`
- `src/components/sections/Blog.tsx`

## 2. Modificar SOLO estos 4 archivos existentes (cambios mínimos)

### 2.1 `src/lib/i18n.ts` — añadir la clave `blog` al objeto `nav` de los 4 idiomas
Hay 4 líneas que empiezan por `    nav: {` (es, en, pt, fr). En cada una, justo **después** de `groups: "...",` agrega `blog: "Blog", `. Es un cambio de una línea por idioma; no toques nada más. Ejemplo (es):
```ts
... calendar: "Calendario", groups: "Grupos", blog: "Blog", wellbeing: "Bienestar", ...
```
(Es necesario porque `Sidebar` tipa las claves de `t.nav`.)

### 2.2 `src/components/Sidebar.tsx` — 3 líneas
1. En el import de `lucide-react`, añade `Newspaper,` (por ejemplo tras `Palette,`).
2. En `export type Section`, añade `| "blog"` justo después de `| "groups"`.
3. En el grupo `organize`, después de `{ id: "groups", icon: Users, key: "groups" },` añade:
```ts
      { id: "blog", icon: Newspaper, key: "blog" },
```

### 2.3 `src/app/page.tsx` — 3 líneas
1. Tras `import { Groups } from "@/components/sections/Groups";` añade:
```ts
import { Blog } from "@/components/sections/Blog";
```
2. En `VALID_SECTIONS`, añade `"blog"` después de `"groups"` (para que funcione `#blog`).
3. En las secciones ligeras (dentro de `<Fade>`), tras la línea de `groups`, añade:
```tsx
              {section === "blog" && <Blog />}
```
(No va en `stateful`: es una sección ligera.)

### 2.4 `firestore.rules` — insertar un bloque
Inserta el bloque de la sección "Reglas de Firestore" (más abajo, también en `firestore-blog.rules.txt`) **justo antes** del comentario `// ---- Métricas globales (lectura pública, solo incrementos) ----`, dentro de `match /databases/{database}/documents { ... }`. No borres ni cambies nada existente. Usa las funciones ya definidas arriba (`signedIn()` e `isOwner(uid)`).

## 3. Verificación (ejecuta y reporta resultados REALES; no declares éxito sin correrlo)
```
npx tsc --noEmit
npm run lint
npm run build
```
Esperado: `tsc` sin errores; `lint` sin errores (el repo ya tiene ~18 warnings previos, no los toques); `build` exitoso. Si `build` falla solo por no poder descargar Google Fonts (entorno sin red), indícalo en vez de modificar `layout.tsx`.

## 4. Desplegar reglas
```
firebase deploy --only firestore:rules
```
(o pega `firestore.rules` en Firebase Console → Firestore → Reglas). Sin esto el Blog no podrá leer ni escribir.

## 5. Pruebas manuales (con Firebase configurado, 2 cuentas distintas)
- Crear, ver, editar y eliminar (con confirmación) una publicación propia. Verificar que en una publicación ajena **no** aparece el menú de acciones.
- Comentar, editar y borrar un comentario propio; el contador de comentarios se actualiza.
- Like → Dislike → quitar; mismo botón dos veces retira la reacción; en Firestore solo existe 1 doc `reactions/{uid}` por post.
- Cambiar idioma (es/en/pt/fr) y revisar la sección.
- Usuario sin foto: se muestra la inicial.
- Abrir `/#blog` directo; navegación en escritorio (sidebar) y móvil (barra inferior).
- Con la red cortada: aparecen estados de error con botón "Reintentar", sin romper la UI.
- En el simulador de reglas de Firebase: editar/borrar un post o comentario ajeno, reaccionar con UID ajeno y añadir campos extra deben ser **denegados**.

## 6. Entrega
Resume: archivos creados, las 4 modificaciones (muestra el diff de `i18n.ts`, `Sidebar.tsx`, `page.tsx`, `firestore.rules`), resultados reales de tsc/lint/build y cualquier desviación respecto a este prompt.

## Limitaciones conocidas (no intentes "arreglarlas" ahora)
- Al borrar un post quedan huérfanos sus comentarios y reacciones (las reglas no dejan que otro usuario los borre; la UI no los muestra). Solución futura: Cloud Function.
- Cada tarjeta hace ~4 lecturas ligeras para totales; con mucho tráfico, usar contadores agregados mantenidos por servidor.
- Sin moderación de contenido ni respuestas anidadas.

---

## Reglas de Firestore (insertar antes de "Métricas globales")
```
    // ---- Blog (posts, comentarios y reacciones) ----
    // Política: lectura solo para usuarios autenticados (la app exige login y
    // así no se exponen nombres/fotos a cualquiera con el ID del proyecto).
    // Escritura: solo el autor, con forma, tipos y longitudes validadas.
    // Los totales de Like/Dislike/comentarios NO se almacenan: se calculan
    // contando documentos, así no hay contadores que manipular.

    // Campos de autoría compartidos por posts y comentarios.
    function validAuthor(d) {
      return d.authorUid is string
        && d.authorName is string && d.authorName.size() >= 1 && d.authorName.size() <= 60
        && (d.authorPhoto == null || (d.authorPhoto is string && d.authorPhoto.size() <= 2048));
    }
    function validPostBody(d) {
      return d.title is string && d.title.size() >= 1 && d.title.size() <= 120
        && d.content is string && d.content.size() >= 1 && d.content.size() <= 5000;
    }
    function validCommentBody(d) {
      return d.content is string && d.content.size() >= 1 && d.content.size() <= 1000;
    }

    match /posts/{postId} {
      allow read: if signedIn();

      allow create: if signedIn()
        && request.resource.data.keys().hasOnly(
             ['authorUid','authorName','authorPhoto','title','content','createdAt','updatedAt'])
        && request.resource.data.keys().hasAll(
             ['authorUid','authorName','authorPhoto','title','content','createdAt','updatedAt'])
        && request.resource.data.authorUid == request.auth.uid
        && validAuthor(request.resource.data)
        && validPostBody(request.resource.data)
        && request.resource.data.createdAt == request.time
        && request.resource.data.updatedAt == request.time;

      // Solo el autor edita, y únicamente título, contenido y updatedAt
      // (no se puede cambiar autoría ni fecha de creación).
      allow update: if signedIn()
        && resource.data.authorUid == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['title','content','updatedAt'])
        && validPostBody(request.resource.data)
        && request.resource.data.updatedAt == request.time;

      allow delete: if signedIn() && resource.data.authorUid == request.auth.uid;

      match /comments/{commentId} {
        allow read: if signedIn();

        allow create: if signedIn()
          && exists(/databases/$(database)/documents/posts/$(postId))
          && request.resource.data.keys().hasOnly(
               ['authorUid','authorName','authorPhoto','content','createdAt','updatedAt'])
          && request.resource.data.keys().hasAll(
               ['authorUid','authorName','authorPhoto','content','createdAt','updatedAt'])
          && request.resource.data.authorUid == request.auth.uid
          && validAuthor(request.resource.data)
          && validCommentBody(request.resource.data)
          && request.resource.data.createdAt == request.time
          && request.resource.data.updatedAt == request.time;

        allow update: if signedIn()
          && resource.data.authorUid == request.auth.uid
          && request.resource.data.diff(resource.data).affectedKeys()
               .hasOnly(['content','updatedAt'])
          && validCommentBody(request.resource.data)
          && request.resource.data.updatedAt == request.time;

        allow delete: if signedIn() && resource.data.authorUid == request.auth.uid;
      }

      // Una reacción por usuario: el ID del documento ES el uid.
      match /reactions/{uid} {
        allow read: if signedIn();

        allow create, update: if isOwner(uid)
          && exists(/databases/$(database)/documents/posts/$(postId))
          && request.resource.data.keys().hasOnly(['uid','type','updatedAt'])
          && request.resource.data.keys().hasAll(['uid','type','updatedAt'])
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.type in ['like', 'dislike']
          && request.resource.data.updatedAt == request.time;

        allow delete: if isOwner(uid);
      }
    }
```

---

## Código

### `src/lib/blog-types.ts`
```ts
// Tipos compartidos del Blog.

export type BlogReaction = "like" | "dislike";

export type BlogPost = {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type BlogComment = {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
};

/** Totales de una publicación, calculados desde los documentos de reacciones/comentarios. */
export type BlogPostStats = {
  likes: number;
  dislikes: number;
  comments: number;
  /** Reacción del usuario actual (null si no ha reaccionado). */
  mine: BlogReaction | null;
};
```

### `src/lib/blog-i18n.ts`
```ts
"use client";

import { useApp } from "./app-context";
import type { Locale } from "./i18n";

// ============================================================
// Textos del Blog en los 4 idiomas (es, en, pt, fr).
//
// Viven aquí (y no en i18n.ts) para no tocar el diccionario
// principal. `BlogStrings` se deriva del español y los demás
// idiomas están tipados con él: si falta una clave en alguno,
// TypeScript falla en el build.
// ============================================================

const es = {
    title: "Blog",
    subtitle: "Comparte ideas, experiencias y reflexiones sobre la vida universitaria y el aprendizaje.",
    newPost: "Nueva publicación",
    editPost: "Editar publicación",
    titleLabel: "Título",
    titlePlaceholder: "Dale un título a tu publicación",
    contentLabel: "Contenido",
    contentPlaceholder: "¿Qué quieres compartir con la comunidad?",
    publish: "Publicar",
    publishing: "Publicando...",
    save: "Guardar cambios",
    saving: "Guardando...",
    cancel: "Cancelar",
    like: "Me gusta",
    dislike: "No me gusta",
    comments: "Comentarios",
    commentsCount: "{n} comentarios",
    showComments: "Ver comentarios",
    hideComments: "Ocultar comentarios",
    commentPlaceholder: "Escribe un comentario...",
    commentSend: "Comentar",
    commentSending: "Enviando...",
    edit: "Editar",
    delete: "Eliminar",
    moreActions: "Más acciones",
    deletePostTitle: "¿Eliminar esta publicación?",
    deletePostBody: "Se eliminará para todos y no se puede deshacer.",
    deleteCommentTitle: "¿Eliminar este comentario?",
    deleteCommentBody: "Esta acción no se puede deshacer.",
    confirmDelete: "Sí, eliminar",
    empty: "Aún no hay publicaciones. ¡Sé la primera persona en compartir algo!",
    emptyComments: "Todavía no hay comentarios. ¡Escribe el primero!",
    loading: "Cargando publicaciones...",
    loadingComments: "Cargando comentarios...",
    loadMore: "Cargar más publicaciones",
    loadMoreComments: "Cargar más comentarios",
    retry: "Reintentar",
    errorLoad: "No se pudieron cargar las publicaciones. Revisa tu conexión.",
    errorLoadComments: "No se pudieron cargar los comentarios.",
    errorPublish: "No se pudo publicar. Intenta de nuevo.",
    errorEdit: "No se pudieron guardar los cambios.",
    errorDelete: "No se pudo eliminar. Intenta de nuevo.",
    errorReact: "No se pudo registrar tu reacción.",
    errorComment: "No se pudo enviar el comentario.",
    errorTitle: "El título es obligatorio (máx. {n} caracteres).",
    errorContent: "El contenido es obligatorio (máx. {n} caracteres).",
    errorCommentEmpty: "El comentario no puede estar vacío (máx. {n} caracteres).",
    published: "Publicación creada",
    updated: "Cambios guardados",
    deleted: "Eliminado",
    commentPosted: "Comentario publicado",
    edited: "editado",
    you: "tú",
    anonymous: "Estudiante",
    loginNote: "Inicia sesión para leer y participar en el blog.",
    noCloud: "El blog necesita la conexión con la nube, que no está disponible en este momento.",
    close: "Cerrar",
};

export type BlogStrings = typeof es;

const en: BlogStrings = {
    title: "Blog",
    subtitle: "Share ideas, experiences and reflections about university life and learning.",
    newPost: "New post",
    editPost: "Edit post",
    titleLabel: "Title",
    titlePlaceholder: "Give your post a title",
    contentLabel: "Content",
    contentPlaceholder: "What do you want to share with the community?",
    publish: "Publish",
    publishing: "Publishing...",
    save: "Save changes",
    saving: "Saving...",
    cancel: "Cancel",
    like: "Like",
    dislike: "Dislike",
    comments: "Comments",
    commentsCount: "{n} comments",
    showComments: "Show comments",
    hideComments: "Hide comments",
    commentPlaceholder: "Write a comment...",
    commentSend: "Comment",
    commentSending: "Sending...",
    edit: "Edit",
    delete: "Delete",
    moreActions: "More actions",
    deletePostTitle: "Delete this post?",
    deletePostBody: "It will be removed for everyone and can't be undone.",
    deleteCommentTitle: "Delete this comment?",
    deleteCommentBody: "This can't be undone.",
    confirmDelete: "Yes, delete",
    empty: "No posts yet. Be the first to share something!",
    emptyComments: "No comments yet. Write the first one!",
    loading: "Loading posts...",
    loadingComments: "Loading comments...",
    loadMore: "Load more posts",
    loadMoreComments: "Load more comments",
    retry: "Retry",
    errorLoad: "Couldn't load the posts. Check your connection.",
    errorLoadComments: "Couldn't load the comments.",
    errorPublish: "Couldn't publish. Please try again.",
    errorEdit: "Couldn't save your changes.",
    errorDelete: "Couldn't delete. Please try again.",
    errorReact: "Couldn't register your reaction.",
    errorComment: "Couldn't send the comment.",
    errorTitle: "A title is required (max. {n} characters).",
    errorContent: "Content is required (max. {n} characters).",
    errorCommentEmpty: "The comment can't be empty (max. {n} characters).",
    published: "Post created",
    updated: "Changes saved",
    deleted: "Deleted",
    commentPosted: "Comment posted",
    edited: "edited",
    you: "you",
    anonymous: "Student",
    loginNote: "Sign in to read and take part in the blog.",
    noCloud: "The blog needs the cloud connection, which isn't available right now.",
    close: "Close",
};
const pt: BlogStrings = {
    title: "Blog",
    subtitle: "Compartilhe ideias, experiências e reflexões sobre a vida universitária e o aprendizado.",
    newPost: "Nova publicação",
    editPost: "Editar publicação",
    titleLabel: "Título",
    titlePlaceholder: "Dê um título à sua publicação",
    contentLabel: "Conteúdo",
    contentPlaceholder: "O que você quer compartilhar com a comunidade?",
    publish: "Publicar",
    publishing: "Publicando...",
    save: "Salvar alterações",
    saving: "Salvando...",
    cancel: "Cancelar",
    like: "Curtir",
    dislike: "Não curtir",
    comments: "Comentários",
    commentsCount: "{n} comentários",
    showComments: "Ver comentários",
    hideComments: "Ocultar comentários",
    commentPlaceholder: "Escreva um comentário...",
    commentSend: "Comentar",
    commentSending: "Enviando...",
    edit: "Editar",
    delete: "Excluir",
    moreActions: "Mais ações",
    deletePostTitle: "Excluir esta publicação?",
    deletePostBody: "Ela será removida para todos e não pode ser desfeita.",
    deleteCommentTitle: "Excluir este comentário?",
    deleteCommentBody: "Esta ação não pode ser desfeita.",
    confirmDelete: "Sim, excluir",
    empty: "Ainda não há publicações. Seja a primeira pessoa a compartilhar algo!",
    emptyComments: "Ainda não há comentários. Escreva o primeiro!",
    loading: "Carregando publicações...",
    loadingComments: "Carregando comentários...",
    loadMore: "Carregar mais publicações",
    loadMoreComments: "Carregar mais comentários",
    retry: "Tentar novamente",
    errorLoad: "Não foi possível carregar as publicações. Verifique sua conexão.",
    errorLoadComments: "Não foi possível carregar os comentários.",
    errorPublish: "Não foi possível publicar. Tente novamente.",
    errorEdit: "Não foi possível salvar as alterações.",
    errorDelete: "Não foi possível excluir. Tente novamente.",
    errorReact: "Não foi possível registrar sua reação.",
    errorComment: "Não foi possível enviar o comentário.",
    errorTitle: "O título é obrigatório (máx. {n} caracteres).",
    errorContent: "O conteúdo é obrigatório (máx. {n} caracteres).",
    errorCommentEmpty: "O comentário não pode estar vazio (máx. {n} caracteres).",
    published: "Publicação criada",
    updated: "Alterações salvas",
    deleted: "Excluído",
    commentPosted: "Comentário publicado",
    edited: "editado",
    you: "você",
    anonymous: "Estudante",
    loginNote: "Entre na sua conta para ler e participar do blog.",
    noCloud: "O blog precisa da conexão com a nuvem, que não está disponível no momento.",
    close: "Fechar",
};
const fr: BlogStrings = {
    title: "Blog",
    subtitle: "Partagez des idées, des expériences et des réflexions sur la vie universitaire et l'apprentissage.",
    newPost: "Nouvelle publication",
    editPost: "Modifier la publication",
    titleLabel: "Titre",
    titlePlaceholder: "Donnez un titre à votre publication",
    contentLabel: "Contenu",
    contentPlaceholder: "Que voulez-vous partager avec la communauté ?",
    publish: "Publier",
    publishing: "Publication...",
    save: "Enregistrer",
    saving: "Enregistrement...",
    cancel: "Annuler",
    like: "J'aime",
    dislike: "Je n'aime pas",
    comments: "Commentaires",
    commentsCount: "{n} commentaires",
    showComments: "Voir les commentaires",
    hideComments: "Masquer les commentaires",
    commentPlaceholder: "Écrivez un commentaire...",
    commentSend: "Commenter",
    commentSending: "Envoi...",
    edit: "Modifier",
    delete: "Supprimer",
    moreActions: "Plus d'actions",
    deletePostTitle: "Supprimer cette publication ?",
    deletePostBody: "Elle sera supprimée pour tout le monde et c'est irréversible.",
    deleteCommentTitle: "Supprimer ce commentaire ?",
    deleteCommentBody: "Cette action est irréversible.",
    confirmDelete: "Oui, supprimer",
    empty: "Aucune publication pour le moment. Soyez le premier à partager quelque chose !",
    emptyComments: "Aucun commentaire pour le moment. Écrivez le premier !",
    loading: "Chargement des publications...",
    loadingComments: "Chargement des commentaires...",
    loadMore: "Charger plus de publications",
    loadMoreComments: "Charger plus de commentaires",
    retry: "Réessayer",
    errorLoad: "Impossible de charger les publications. Vérifiez votre connexion.",
    errorLoadComments: "Impossible de charger les commentaires.",
    errorPublish: "Impossible de publier. Réessayez.",
    errorEdit: "Impossible d'enregistrer les modifications.",
    errorDelete: "Impossible de supprimer. Réessayez.",
    errorReact: "Impossible d'enregistrer votre réaction.",
    errorComment: "Impossible d'envoyer le commentaire.",
    errorTitle: "Le titre est obligatoire ({n} caractères max.).",
    errorContent: "Le contenu est obligatoire ({n} caractères max.).",
    errorCommentEmpty: "Le commentaire ne peut pas être vide ({n} caractères max.).",
    published: "Publication créée",
    updated: "Modifications enregistrées",
    deleted: "Supprimé",
    commentPosted: "Commentaire publié",
    edited: "modifié",
    you: "vous",
    anonymous: "Étudiant",
    loginNote: "Connectez-vous pour lire le blog et y participer.",
    noCloud: "Le blog nécessite la connexion au cloud, indisponible pour le moment.",
    close: "Fermer",
};

export const blogStrings: Record<Locale, BlogStrings> = { es, en, pt, fr };

/** Hook: textos del Blog en el idioma activo de la app. */
export function useBlogT(): BlogStrings {
  const { locale } = useApp();
  return blogStrings[locale];
}

/** Fecha corta localizada (p. ej. "10 nov 2026") a partir de milisegundos. */
export function formatBlogDate(ms: number, locale: string): string {
  try {
    return new Date(ms).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return new Date(ms).toLocaleDateString();
  }
}
```

### `src/lib/blog-store.ts`
```ts
"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { BlogComment, BlogPost, BlogPostStats, BlogReaction } from "./blog-types";

// ============================================================
// Acceso a Firestore para el Blog.
//
//   posts/{postId}                      -> publicación
//   posts/{postId}/comments/{commentId} -> comentario
//   posts/{postId}/reactions/{uid}      -> reacción (1 doc por usuario)
//
// Los totales de Like/Dislike/comentarios NO se guardan: se calculan
// con consultas de agregación (getCountFromServer) sobre los propios
// documentos. Así el cliente nunca envía contadores y no hay carreras
// ni valores manipulables. El ID del documento de reacción es el UID,
// por lo que un usuario no puede tener dos reacciones en un post.
// ============================================================

export const BLOG_LIMITS = { title: 120, content: 5000, comment: 1000, name: 60 } as const;
export const POSTS_PAGE_SIZE = 10;
export const COMMENTS_PAGE_SIZE = 20;

export type BlogCursor = QueryDocumentSnapshot<DocumentData>;
export type Page<T> = { items: T[]; cursor: BlogCursor | null; hasMore: boolean };

export type BlogAuthor = { uid: string; name: string; photo: string | null };

function requireDb(): Firestore {
  const db = getDb();
  if (!db) throw new Error("blog/no-db");
  return db;
}

function toMillis(v: unknown): number {
  const t = v as { toMillis?: () => number } | null | undefined;
  return typeof t?.toMillis === "function" ? t.toMillis() : Date.now();
}

function mapPost(snap: { id: string; data: () => DocumentData | undefined }): BlogPost {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    authorUid: String(d.authorUid ?? ""),
    authorName: String(d.authorName ?? ""),
    authorPhoto: typeof d.authorPhoto === "string" ? d.authorPhoto : null,
    title: String(d.title ?? ""),
    content: String(d.content ?? ""),
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

function mapComment(snap: { id: string; data: () => DocumentData | undefined }): BlogComment {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    authorUid: String(d.authorUid ?? ""),
    authorName: String(d.authorName ?? ""),
    authorPhoto: typeof d.authorPhoto === "string" ? d.authorPhoto : null,
    content: String(d.content ?? ""),
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

// ---------- Validación (misma que aplican las reglas) ----------

export type PostValidation = "title" | "content" | null;

export function validatePost(title: string, content: string): PostValidation {
  const t = title.trim();
  const c = content.trim();
  if (t.length < 1 || t.length > BLOG_LIMITS.title) return "title";
  if (c.length < 1 || c.length > BLOG_LIMITS.content) return "content";
  return null;
}

export function validateComment(content: string): boolean {
  const c = content.trim();
  return c.length >= 1 && c.length <= BLOG_LIMITS.comment;
}

/** Resultado de pulsar un botón de reacción (ver tabla del enunciado). */
export function nextReaction(current: BlogReaction | null, clicked: BlogReaction): BlogReaction | null {
  return current === clicked ? null : clicked;
}

// ---------- Publicaciones ----------

export async function fetchPosts(cursor?: BlogCursor | null, size = POSTS_PAGE_SIZE): Promise<Page<BlogPost>> {
  const db = requireDb();
  const base = [orderBy("createdAt", "desc")];
  // Pide uno más para saber si hay otra página sin una consulta extra.
  const q = cursor
    ? query(collection(db, "posts"), ...base, startAfter(cursor), limit(size + 1))
    : query(collection(db, "posts"), ...base, limit(size + 1));
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > size;
  const docs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return {
    items: docs.map(mapPost),
    cursor: docs.length ? docs[docs.length - 1] : (cursor ?? null),
    hasMore,
  };
}

export async function createPost(author: BlogAuthor, title: string, content: string): Promise<BlogPost> {
  const db = requireDb();
  const ref = await addDoc(collection(db, "posts"), {
    authorUid: author.uid,
    authorName: author.name.slice(0, BLOG_LIMITS.name),
    authorPhoto: author.photo,
    title: title.trim(),
    content: content.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Relee para obtener la marca de tiempo resuelta por el servidor.
  return mapPost(await getDoc(ref));
}

export async function updatePost(postId: string, title: string, content: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, "posts", postId), {
    title: title.trim(),
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, "posts", postId));
}

// ---------- Totales y reacciones ----------

/** Totales de un post + reacción propia, calculados desde los documentos. */
export async function fetchPostStats(postId: string, uid: string | null): Promise<BlogPostStats> {
  const db = requireDb();
  const reactions = collection(db, "posts", postId, "reactions");
  const [likes, dislikes, comments, mine] = await Promise.all([
    getCountFromServer(query(reactions, where("type", "==", "like"))),
    getCountFromServer(query(reactions, where("type", "==", "dislike"))),
    getCountFromServer(collection(db, "posts", postId, "comments")),
    uid ? getDoc(doc(reactions, uid)) : Promise.resolve(null),
  ]);
  const type = mine && mine.exists() ? mine.data().type : null;
  return {
    likes: likes.data().count,
    dislikes: dislikes.data().count,
    comments: comments.data().count,
    mine: type === "like" || type === "dislike" ? type : null,
  };
}

/** Crea/cambia la reacción (doc con ID = uid) o la retira si `type` es null. */
export async function setReaction(postId: string, uid: string, type: BlogReaction | null): Promise<void> {
  const db = requireDb();
  const ref = doc(db, "posts", postId, "reactions", uid);
  if (type === null) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { uid, type, updatedAt: serverTimestamp() });
  }
}

// ---------- Comentarios ----------

export async function fetchComments(
  postId: string,
  cursor?: BlogCursor | null,
  size = COMMENTS_PAGE_SIZE
): Promise<Page<BlogComment>> {
  const db = requireDb();
  const col = collection(db, "posts", postId, "comments");
  const q = cursor
    ? query(col, orderBy("createdAt", "asc"), startAfter(cursor), limit(size + 1))
    : query(col, orderBy("createdAt", "asc"), limit(size + 1));
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > size;
  const docs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return {
    items: docs.map(mapComment),
    cursor: docs.length ? docs[docs.length - 1] : (cursor ?? null),
    hasMore,
  };
}

export async function addComment(postId: string, author: BlogAuthor, content: string): Promise<BlogComment> {
  const db = requireDb();
  const ref = await addDoc(collection(db, "posts", postId, "comments"), {
    authorUid: author.uid,
    authorName: author.name.slice(0, BLOG_LIMITS.name),
    authorPhoto: author.photo,
    content: content.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return mapComment(await getDoc(ref));
}

export async function updateComment(postId: string, commentId: string, content: string): Promise<void> {
  const db = requireDb();
  await updateDoc(doc(db, "posts", postId, "comments", commentId), {
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
}
```

### `src/components/ui/Avatar.tsx`
```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Avatar circular: muestra la foto si existe y carga bien; si no hay foto
 * (o falla al cargar) cae a la inicial del nombre sobre el degradado de marca.
 */
export function Avatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: string | null;
  className?: string;
}) {
  // Guarda la URL que falló, así un cambio de foto vuelve a intentarse sin efectos.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = !!photo && failedUrl !== photo;

  if (showPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(photo)}
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-bold text-white",
        className
      )}
    >
      {(name || "?").trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
```

### `src/components/sections/BlogComposer.tsx`
```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useBlogT } from "@/lib/blog-i18n";
import { useModalA11y } from "@/lib/useModalA11y";
import { BLOG_LIMITS, validatePost } from "@/lib/blog-store";

/** Modal para crear o editar una publicación. */
export function BlogComposer({
  mode,
  initialTitle = "",
  initialContent = "",
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialTitle?: string;
  initialContent?: string;
  onSubmit: (title: string, content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useBlogT();
  const ref = useModalA11y(true, onCancel);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalid = validatePost(title, content);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (invalid === "title") return setError(t.errorTitle.replace("{n}", String(BLOG_LIMITS.title)));
    if (invalid === "content") return setError(t.errorContent.replace("{n}", String(BLOG_LIMITS.content)));
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(title, content);
    } catch {
      setError(mode === "edit" ? t.errorEdit : t.errorPublish);
      setSubmitting(false);
    }
  }

  const heading = mode === "edit" ? t.editPost : t.newPost;
  const field =
    "glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4"
      onClick={() => !submitting && onCancel()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="glass-strong glow-border relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl sm:p-6"
      >
        <form onSubmit={submit}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{heading}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label={t.close}
            className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="blog-title" className="mb-1 block text-sm font-medium">
              {t.titleLabel}
            </label>
            <input
              id="blog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={BLOG_LIMITS.title}
              placeholder={t.titlePlaceholder}
              className={field}
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-muted">
              {title.length}/{BLOG_LIMITS.title}
            </p>
          </div>
          <div>
            <label htmlFor="blog-content" className="mb-1 block text-sm font-medium">
              {t.contentLabel}
            </label>
            <textarea
              id="blog-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={BLOG_LIMITS.content}
              rows={8}
              placeholder={t.contentPlaceholder}
              className={`${field} resize-y`}
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-muted">
              {content.length}/{BLOG_LIMITS.content}
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="glass flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={submitting || invalid !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "edit"
              ? submitting ? t.saving : t.save
              : submitting ? t.publishing : t.publish}
          </button>
        </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
```

### `src/components/sections/BlogComments.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useBlogT, formatBlogDate } from "@/lib/blog-i18n";
import type { SerenoUser } from "@/lib/auth-context";
import {
  BLOG_LIMITS,
  addComment,
  deleteComment,
  fetchComments,
  updateComment,
  validateComment,
  type BlogCursor,
} from "@/lib/blog-store";
import type { BlogComment } from "@/lib/blog-types";
import { Avatar } from "../ui/Avatar";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";

/** Hilo de comentarios de una publicación (se monta solo al expandirlo). */
export function BlogComments({
  postId,
  user,
  onCountChange,
}: {
  postId: string;
  user: SerenoUser;
  onCountChange: (delta: number) => void;
}) {
  const { locale } = useApp();
  const t = useBlogT();
  const { notify } = useToast();

  const [items, setItems] = useState<BlogComment[]>([]);
  const [cursor, setCursor] = useState<BlogCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [toDelete, setToDelete] = useState<BlogComment | null>(null);

  useEffect(() => {
    let active = true;
    fetchComments(postId)
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [postId, reloadKey]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchComments(postId, cursor);
      setItems((prev) => [...prev, ...page.items.filter((c) => !prev.some((p) => p.id === c.id))]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      notify("error", t.errorLoadComments);
    } finally {
      setLoadingMore(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!validateComment(text)) {
      notify("error", t.errorCommentEmpty.replace("{n}", String(BLOG_LIMITS.comment)));
      return;
    }
    setSending(true);
    try {
      const created = await addComment(postId, { uid: user.uid, name: user.name, photo: user.photo }, text);
      // Los comentarios van en orden cronológico: el nuevo va al final.
      setItems((prev) => [...prev, created]);
      setText("");
      onCountChange(1);
      notify("success", t.commentPosted);
    } catch {
      notify("error", t.errorComment);
    } finally {
      setSending(false);
    }
  }

  function startEdit(c: BlogComment) {
    setEditingId(c.id);
    setEditText(c.content);
  }

  async function saveEdit(c: BlogComment) {
    if (savingEdit) return;
    if (!validateComment(editText)) {
      notify("error", t.errorCommentEmpty.replace("{n}", String(BLOG_LIMITS.comment)));
      return;
    }
    setSavingEdit(true);
    try {
      await updateComment(postId, c.id, editText);
      setItems((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, content: editText.trim(), updatedAt: Date.now() } : x))
      );
      setEditingId(null);
      notify("success", t.updated);
    } catch {
      notify("error", t.errorEdit);
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    const c = toDelete;
    if (!c) return;
    setToDelete(null);
    try {
      await deleteComment(postId, c.id);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      onCountChange(-1);
      notify("success", t.deleted);
    } catch {
      notify("error", t.errorDelete);
    }
  }

  const field =
    "glass w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50";

  return (
    <section aria-label={t.comments} className="mt-4 rounded-2xl border-t border-white/10 bg-black/20 p-3 sm:p-4">
      {status === "loading" && (
        <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loadingComments}
        </p>
      )}

      {status === "error" && (
        <div className="py-3 text-center text-sm">
          <p className="text-danger">{t.errorLoadComments}</p>
          <button
            onClick={() => {
              setStatus("loading");
              setReloadKey((k) => k + 1);
            }}
            className="mt-2 rounded-lg px-3 py-1 text-brand transition hover:bg-white/10"
          >
            {t.retry}
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          {items.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted">{t.emptyComments}</p>
          ) : (
            <ul className="space-y-3">
              {items.map((c) => {
                const mine = c.authorUid === user.uid;
                const edited = c.updatedAt - c.createdAt > 1500;
                return (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <Avatar name={c.authorName} photo={c.authorPhoto} className="h-8 w-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {c.authorName || t.anonymous}
                        </span>
                        {mine && <span className="text-brand">({t.you})</span>}
                        <span>{formatBlogDate(c.createdAt, locale)}</span>
                        {edited && <span>· {t.edited}</span>}
                      </div>

                      {editingId === c.id ? (
                        <div className="mt-1.5 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            maxLength={BLOG_LIMITS.comment}
                            rows={3}
                            aria-label={t.edit}
                            className={`${field} resize-y`}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={savingEdit}
                              className="glass rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
                            >
                              {t.cancel}
                            </button>
                            <button
                              onClick={() => saveEdit(c)}
                              disabled={savingEdit || !validateComment(editText)}
                              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                            >
                              {savingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                              {savingEdit ? t.saving : t.save}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{c.content}</p>
                      )}
                    </div>

                    {mine && editingId !== c.id && (
                      <div className="flex shrink-0 items-start gap-0.5">
                        <button
                          onClick={() => startEdit(c)}
                          aria-label={t.edit}
                          title={t.edit}
                          className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setToDelete(c)}
                          aria-label={t.delete}
                          title={t.delete}
                          className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mx-auto mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-brand transition hover:bg-white/10 disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
              {t.loadMoreComments}
            </button>
          )}

          <form onSubmit={send} className="mt-4 flex items-start gap-2">
            <Avatar name={user.name} photo={user.photo} className="h-8 w-8 text-xs" />
            <div className="min-w-0 flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={BLOG_LIMITS.comment}
                rows={2}
                placeholder={t.commentPlaceholder}
                aria-label={t.commentPlaceholder}
                className={`${field} resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !validateComment(text)}
              aria-label={t.commentSend}
              title={t.commentSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand to-accent text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        danger
        title={t.deleteCommentTitle}
        body={t.deleteCommentBody}
        confirmLabel={t.confirmDelete}
        cancelLabel={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
```

### `src/components/sections/BlogPostCard.tsx`
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, MoreHorizontal, Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useBlogT, formatBlogDate } from "@/lib/blog-i18n";
import type { SerenoUser } from "@/lib/auth-context";
import { fetchPostStats, nextReaction, setReaction } from "@/lib/blog-store";
import type { BlogPost, BlogPostStats, BlogReaction } from "@/lib/blog-types";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { useToast } from "../ui/Toast";
import { BlogComments } from "./BlogComments";

/** Aplica un cambio de reacción a los totales (quita la anterior, suma la nueva). */
function withReaction(s: BlogPostStats, next: BlogReaction | null): BlogPostStats {
  const out = { ...s, mine: next };
  if (s.mine === "like") out.likes = Math.max(0, out.likes - 1);
  if (s.mine === "dislike") out.dislikes = Math.max(0, out.dislikes - 1);
  if (next === "like") out.likes += 1;
  if (next === "dislike") out.dislikes += 1;
  return out;
}

export function BlogPostCard({
  post,
  user,
  onEdit,
  onDelete,
}: {
  post: BlogPost;
  user: SerenoUser;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
}) {
  const { locale } = useApp();
  const t = useBlogT();
  const { notify } = useToast();
  const isOwner = post.authorUid === user.uid;
  const edited = post.updatedAt - post.createdAt > 1500;

  const [stats, setStats] = useState<BlogPostStats | null>(null);
  const [reacting, setReacting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Totales y reacción propia, calculados desde los documentos en Firestore.
  useEffect(() => {
    let active = true;
    fetchPostStats(post.id, user.uid)
      .then((s) => {
        if (active) setStats(s);
      })
      .catch(() => {
        // Si falla, la tarjeta sigue legible; los totales quedan en 0 sin romper la UI.
        if (active) setStats({ likes: 0, dislikes: 0, comments: 0, mine: null });
      });
    return () => {
      active = false;
    };
  }, [post.id, user.uid]);

  // Cierra el menú al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function react(kind: BlogReaction) {
    if (!stats || reacting) return;
    const previous = stats.mine;
    const next = nextReaction(previous, kind);
    // Actualización optimista; se revierte si la escritura falla.
    setStats((s) => (s ? withReaction(s, next) : s));
    setReacting(true);
    try {
      await setReaction(post.id, user.uid, next);
    } catch {
      setStats((s) => (s ? withReaction(s, previous) : s));
      notify("error", t.errorReact);
      setReacting(false);
      return;
    }
    setReacting(false);
    // Resincroniza con la fuente de verdad (incluye reacciones de otras personas).
    fetchPostStats(post.id, user.uid)
      .then(setStats)
      .catch(() => {});
  }

  const reactBtn = (kind: BlogReaction, Icon: typeof ThumbsUp, label: string, count: number | null) => {
    const selected = stats?.mine === kind;
    return (
      <button
        onClick={() => react(kind)}
        disabled={!stats || reacting}
        aria-pressed={selected}
        aria-label={label}
        title={label}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition disabled:opacity-60",
          selected
            ? kind === "like"
              ? "bg-calm/20 text-calm ring-1 ring-calm/40"
              : "bg-danger/20 text-danger ring-1 ring-danger/40"
            : "glass text-muted hover:text-foreground"
        )}
      >
        <Icon className={cn("h-4 w-4", selected && "fill-current")} />
        <span className="tabular-nums">{count ?? "–"}</span>
      </button>
    );
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-3xl p-4 sm:p-6"
    >
      <header className="flex items-start gap-3">
        <Avatar name={post.authorName} photo={post.authorPhoto} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {post.authorName || t.anonymous}{" "}
            {isOwner && <span className="text-xs font-normal text-brand">({t.you})</span>}
          </p>
          <p className="text-xs text-muted">
            {formatBlogDate(post.createdAt, locale)}
            {edited && <> · {t.edited}</>}
          </p>
        </div>

        {isOwner && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t.moreActions}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div role="menu" className="glass-strong absolute right-0 top-full z-20 mt-1 w-40 rounded-xl p-1 shadow-xl">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(post);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  <Pencil className="h-4 w-4" /> {t.edit}
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(post);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" /> {t.delete}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <h2 className="mt-4 break-words text-lg font-bold tracking-tight sm:text-xl">{post.title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90 sm:text-base">
        {post.content}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {reactBtn("like", ThumbsUp, t.like, stats ? stats.likes : null)}
        {reactBtn("dislike", ThumbsDown, t.dislike, stats ? stats.dislikes : null)}
        <button
          onClick={() => setShowComments((s) => !s)}
          aria-expanded={showComments}
          aria-label={showComments ? t.hideComments : t.showComments}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition",
            showComments ? "bg-brand/20 text-brand ring-1 ring-brand/40" : "glass text-muted hover:text-foreground"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{stats ? stats.comments : "–"}</span>
          <span className="hidden sm:inline">{t.comments}</span>
        </button>
      </div>

      {showComments && (
        <BlogComments
          postId={post.id}
          user={user}
          onCountChange={(delta) =>
            setStats((s) => (s ? { ...s, comments: Math.max(0, s.comments + delta) } : s))
          }
        />
      )}
    </motion.article>
  );
}
```

### `src/components/sections/Blog.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2, Newspaper, Plus } from "lucide-react";
import { useBlogT } from "@/lib/blog-i18n";
import { useAuth } from "@/lib/auth-context";
import {
  createPost,
  deletePost,
  fetchPosts,
  updatePost,
  type BlogCursor,
} from "@/lib/blog-store";
import type { BlogPost } from "@/lib/blog-types";
import { SectionHeader } from "../ui/SectionHeader";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";
import { BlogComposer } from "./BlogComposer";
import { BlogPostCard } from "./BlogPostCard";

type Composer = { mode: "create" } | { mode: "edit"; post: BlogPost } | null;

export function Blog() {
  const t = useBlogT();
  const { user, enabled } = useAuth();
  const { notify } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [cursor, setCursor] = useState<BlogCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [composer, setComposer] = useState<Composer>(null);
  const [toDelete, setToDelete] = useState<BlogPost | null>(null);

  const uid = user?.uid ?? null;
  const canUse = enabled && !!uid;

  // Primera página (y reintentos). Se ignora el resultado si se desmonta.
  useEffect(() => {
    if (!canUse) return;
    let active = true;
    fetchPosts()
      .then((page) => {
        if (!active) return;
        setPosts(page.items);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [canUse, reloadKey]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPosts(cursor);
      setPosts((prev) => [...prev, ...page.items.filter((p) => !prev.some((x) => x.id === p.id))]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch {
      notify("error", t.errorLoad);
    } finally {
      setLoadingMore(false);
    }
  }

  // Los errores se propagan al modal, que los muestra junto al formulario.
  async function handleSubmit(title: string, content: string) {
    if (!user || !composer) return;
    if (composer.mode === "create") {
      const created = await createPost({ uid: user.uid, name: user.name, photo: user.photo }, title, content);
      setPosts((prev) => [created, ...prev]);
      notify("success", t.published);
    } else {
      const id = composer.post.id;
      await updatePost(id, title, content);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title: title.trim(), content: content.trim(), updatedAt: Date.now() } : p))
      );
      notify("success", t.updated);
    }
    setComposer(null);
  }

  async function confirmDelete() {
    const post = toDelete;
    if (!post) return;
    setToDelete(null);
    try {
      await deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      notify("success", t.deleted);
    } catch {
      notify("error", t.errorDelete);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-nav">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader icon={Newspaper} title={t.title} subtitle={t.subtitle} />
        {canUse && (
          <button
            onClick={() => setComposer({ mode: "create" })}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> {t.newPost}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {!enabled ? (
          <div className="glass rounded-3xl p-10 text-center text-muted">{t.noCloud}</div>
        ) : !user ? (
          <div className="glass rounded-3xl p-10 text-center text-muted">{t.loginNote}</div>
        ) : status === "loading" ? (
          <div role="status" className="glass flex items-center justify-center gap-2 rounded-3xl p-12 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> {t.loading}
          </div>
        ) : status === "error" ? (
          <div role="alert" className="glass rounded-3xl p-10 text-center">
            <p className="text-danger">{t.errorLoad}</p>
            <button
              onClick={() => {
                setStatus("loading");
                setReloadKey((k) => k + 1);
              }}
              className="glass mt-4 rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            >
              {t.retry}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center text-muted">{t.empty}</div>
        ) : (
          <>
            {posts.map((p) => (
              <BlogPostCard
                key={p.id}
                post={p}
                user={user}
                onEdit={(post) => setComposer({ mode: "edit", post })}
                onDelete={setToDelete}
              />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="glass mx-auto flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.loadMore}
              </button>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {composer && (
          <BlogComposer
            key={composer.mode === "edit" ? composer.post.id : "new"}
            mode={composer.mode}
            initialTitle={composer.mode === "edit" ? composer.post.title : ""}
            initialContent={composer.mode === "edit" ? composer.post.content : ""}
            onSubmit={handleSubmit}
            onCancel={() => setComposer(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={toDelete !== null}
        danger
        title={t.deletePostTitle}
        body={t.deletePostBody}
        confirmLabel={t.confirmDelete}
        cancelLabel={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
```
