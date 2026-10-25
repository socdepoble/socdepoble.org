/** Contracte neutral dels adjunts. La quota efectiva sempre la decidix el servidor. */
/* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-14) · Al port,
   urlAdjuntXat(id, config, { renova }?): amb renova=true, una signatura nova
   (cap URL desada no es reutilitza); la interfície la demana després d'un
   error de càrrega, que sol ser una URL caducada.
   XAT-03 · publicaAdjuntXat(filId, entrada, config) admet config.onProgres
   (opcional): rep la fracció 0..1 dels bytes ja pujats. Qui no puja res de
   veres (seed, local) l'ignora. El contracte és a contracte.js; el preu de
   seguretat (XHR no veta redireccions), al port de Supabase. */
export const QUOTA_XAT_BYTES = 20_000_000;
export const MAX_VIDEO_MS = 10_000;
export const MISSATGE_QUOTA_XAT = "Espera't, que no tenim més diners per a pagar el servidor... ja et direm quan en pots pujar més!";
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-3 i MEDIA-9) · Cap foto en PNG:
   WebKit no sap codificar WebP en canvas i la foto es torna a demanar en JPEG
   (adjuntLocal.js); un PNG pesaria unes nou vegades més contra la quota. El
   vídeo de l'iPhone (QuickTime) sí. La mateixa llista i els mateixos sostres
   per tipus que la migració 2610220240 (private.xat_maxim_adjunt). */
export const MIME_XAT = Object.freeze({
  'image/webp': 'imatge', 'image/jpeg': 'imatge',
  'video/mp4': 'video', 'video/webm': 'video', 'video/quicktime': 'video',
  'audio/webm': 'veu', 'audio/mp4': 'veu', 'audio/ogg': 'veu'
});
export const MAXIM_ADJUNT_XAT = Object.freeze({ imatge: 2_000_000, veu: 3_000_000, video: QUOTA_XAT_BYTES });

/* Gauntlet 261022_0225 (crítica Claude, MEDIA-5) · Cada fallada dels adjunts
   porta un `code`; este és el seu text en valencià. La interfície el tradueix
   (CLAUS_ERROR_ADJUNT d'adjuntLocal.js) i el text d'ací és el valor valencià
   de la clau. Ningú no ha de vore el JSON del servidor. */
export const ERRORS_ADJUNT_XAT = Object.freeze({
  'SDP-XAT-020': MISSATGE_QUOTA_XAT,
  'SDP-XAT-001': 'Cal iniciar sessió per a enviar fitxers.',
  'SDP-XAT-006': 'No tens accés a esta conversa o el fitxer ja no hi és.',
  'SDP-XAT-008': 'Este enviament ja s’ha fet servir. Tria el fitxer una altra vegada.',
  'SDP-XAT-011': 'En esta conversa no pots enviar fitxers.',
  'SDP-XAT-021': 'El servidor no ha pogut confirmar el fitxer. Torna-ho a provar.',
  /* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-8) · Deu pendents sense
     publicar: esperar no ajuda, cal descartar-ne (la llista ix en refrescar). */
  'SDP-XAT-022': 'Tens massa fitxers pendents d’enviar. Descarta’n algun per a continuar.',
  'SDP-XAT-429': 'Has enviat molts missatges en poc de temps. Espera uns segons i torna-ho a provar.',
  'sense-capacitat': 'Este node encara no té els adjunts privats del xat disponibles.',
  'sessio-caducada': 'Cal tornar a iniciar sessió per a enviar fitxers.',
  'temps-esgotat': 'La pujada ha trigat massa. Torna-ho a provar.',
  xarxa: 'No hem pogut connectar amb el servidor. Comprova la connexió i torna-ho a provar.',
  servidor: 'El servidor no ha pogut atendre la petició. Torna-ho a provar d’ací a una estona.',
  'sense-confirmacio': 'El servidor no ha confirmat el missatge. Torna-ho a provar.',
  format: 'Tria una foto o un vídeo de fins a 10 segons.',
  durada: 'El vídeo ha de durar com a màxim 10 segons.',
  buit: 'Tria un fitxer que no estiga buit.',
  'durada-illegible': 'No hem pogut llegir la durada del vídeo.',
  'video-illegible': 'El navegador no pot llegir este vídeo.',
  foto: 'No hem pogut preparar la foto.',
  'sense-gravacio': 'Este navegador no permet gravar àudio.',
  'micro-permis': 'No podem usar el micròfon: el permís no està concedit en este navegador o en l’app. El pots activar als ajustos.',
  'micro-absent': 'No hem trobat cap micròfon en este aparell.',
  'micro-ocupat': 'El micròfon l’està fent servir una altra app. Tanca-la i torna-ho a provar.',
  gravacio: 'No hem pogut acabar la gravació.',
  'gravacio-buida': 'La gravació està buida. Torna-ho a provar.',
  descart: 'No hem pogut descartar el fitxer. Torna-ho a provar.',
  'no-disponible': 'Este fitxer ja no està disponible.',
  obrir: 'No hem pogut obrir el fitxer.'
});

/* Gauntlet 261022_0225 (crítica Claude, MEDIA-9) · El temps de la pujada
   creix amb la mida: 30 s de marge i un segon per cada 50 kB (unes 400 kbit/s
   de pujada, una connexió rural modesta). 20 MB tenen uns set minuts; la UI
   deixa cancel·lar mentrestant. */
export const tempsLimitPujada = (bytes) => 30_000 + Math.ceil(Math.max(0, Number(bytes) || 0) / 50_000) * 1000;

/** Un Error amb el `code` i el text valencià d'ERRORS_ADJUNT_XAT. */
export const errorAdjuntXat = (code, extra = {}) => Object.assign(new Error(ERRORS_ADJUNT_XAT[code]), { code, ...extra });

export function validaAdjuntXat({ fitxer, tipus, duradaMs }) {
  if (!(fitxer instanceof Blob) || !fitxer.size || MIME_XAT[fitxer.type] !== tipus) throw errorAdjuntXat('format');
  // El servidor diu SDP-XAT-020 tant per la quota com pel sostre del tipus.
  if (fitxer.size > QUOTA_XAT_BYTES || fitxer.size > MAXIM_ADJUNT_XAT[tipus]) throw errorAdjuntXat('SDP-XAT-020');
  if (tipus !== 'imatge' && (!Number.isSafeInteger(duradaMs) || duradaMs <= 0 || (tipus === 'video' && duradaMs > MAX_VIDEO_MS))) {
    throw errorAdjuntXat('durada');
  }
}
