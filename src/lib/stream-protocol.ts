// Constantes compartidas entre el servidor (capa de IA) y el cliente
// (hook de streaming). Vive en su propio archivo para que importarla
// desde el cliente NO arrastre el SDK de IA del lado servidor.

// Marcador que el servidor inserta en el stream cuando la respuesta se
// corta por un error a mitad de camino. El cliente lo detecta para
// mostrar un aviso claro en vez de tratar una respuesta truncada como
// completa y exitosa.
export const STREAM_ERROR_MARKER = "\u0000__SERENO_STREAM_ERROR__";
