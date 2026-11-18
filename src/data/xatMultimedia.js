/** Contracte neutral dels adjunts. La quota efectiva sempre la decidix el servidor. */
/* Gauntlet 261022_0225 (crítica Claude, ADV-MEDIA-14) · Al port,
   urlAdjuntXat(id, config, { renova }?): amb renova=true, una signatura nova
   (cap URL desada no es reutilitza); la interfície la demana després d'un
   error de càrrega, que sol ser una URL caducada.
   Gauntlet R22 (xat-05) · { descarrega: true | nom } demana la URL de
   descàrrega (Content-Disposition: attachment al servidor); vegeu contracte.js.
   XAT-03 · publicaAdjuntXat(filId, entrada, config) admet config.onProgres
   (opcional): rep la fracció 0..1 dels bytes ja pujats. Qui no puja res de
   veres (seed, local) l'ignora. El contracte és a contracte.js; el preu de
   seguretat (XHR no veta redireccions), al port de Supabase. */
export const QUOTA_XAT_BYTES = 250_000_000;
export const MAX_VIDEO_MS = 60_000;
export const MAX_VIDEO_ENTRADA_BYTES = 150_000_000;
export const MISSATGE_QUOTA_XAT = 'Has arribat al límit d’espai dels adjunts del xat. Revisa els fitxers pendents o prova-ho més endavant.';
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
export const MAXIM_ADJUNT_XAT = Object.freeze({ imatge: 2_000_000, veu: 3_000_000, video: 20_000_000 });
/* B2e · P1-12 (marató 261101_2143) · El que veu el servidor d'un adjunt
   xifrat: MIME opac i sostre del blob farcit (Padmé) al bucket. Viuen ací, al
   mòdul neutral, perquè el transport de Supabase (supabase/xatXifrat.js) no
   arrossegue el protocol ni els formats; xatMultimediaXifrat.js les reexporta.
   Prova de deriva: supabase/index.e2eeApagat.produccio.test.js. */
export const MIME_XIFRAT = 'application/octet-stream';
export const MAXIM_BLOB_ADJUNT = 20_000_000;

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
  format: 'Tria una foto o un vídeo de fins a 60 segons.',
  'format-heic': 'Este navegador no pot preparar esta foto HEIC o HEIF. Prova-ho amb Safari o tria una foto JPEG o PNG.',
  durada: 'El vídeo ha de durar com a màxim 60 segons.',
  buit: 'Tria un fitxer que no estiga buit.',
  'durada-illegible': 'No hem pogut llegir la durada del vídeo.',
  'video-illegible': 'El navegador no pot llegir este vídeo.',
  'video-mida-entrada': 'Tria un vídeo de com a màxim 150 MB.',
  'video-compressio-no-disponible': 'Este navegador no pot preparar este vídeo. Tria’n un de menys de 20 MB o prova un altre navegador.',
  'video-audio-no-capturable': 'No podem comprimir este vídeo conservant-ne el so. Tria’n un de menys de 20 MB o prova un altre navegador.',
  'video-compressio': 'No hem pogut preparar el vídeo. Torna-ho a provar mantenint esta pantalla oberta.',
  'video-mida': 'El vídeo preparat encara supera 20 MB. Tria un clip més curt.',
  'video-compressio-temps': 'El vídeo s’ha quedat aturat mentre es preparava. Torna-ho a provar amb esta pantalla oberta.',
  'ubicacio-invalida': 'La ubicació del fitxer no és vàlida. Torna a preparar-lo.',
  'ubicacio-no-admesa': 'S’ha enviat sense la ubicació: el servidor de Sóc de Poble encara no l’admet.',
  'ubicacio-no-eliminable': 'Este navegador no ha pogut amagar la ubicació del vídeo. Tria un MP4 o prova-ho amb un altre navegador.',
  foto: 'No hem pogut preparar la foto.',
  'foto-mida': 'No hem pogut reduir prou esta foto. Tria’n una altra o guarda-la amb menys resolució.',
  'foto-codificacio': 'Este navegador no ha pogut preparar la foto. Prova-ho amb una altra foto o amb un altre navegador.',
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

/** Només coordenades explícites del DTO: sense coacció, altitud ni autoritat. */
export function normalitzaUbicacioXat(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'object' || Array.isArray(valor) || Object.keys(valor).length !== 2
    || !Object.keys(valor).every(clau => clau === 'lat' || clau === 'lng')
    || !Number.isFinite(valor.lat) || !Number.isFinite(valor.lng)
    || valor.lat < -90 || valor.lat > 90 || valor.lng < -180 || valor.lng > 180) throw errorAdjuntXat('ubicacio-invalida');
  return { lat: valor.lat, lng: valor.lng };
}

export function validaAdjuntXat({ fitxer, tipus, duradaMs, ubicacio, conservaUbicacio }) {
  if (!(fitxer instanceof Blob) || !fitxer.size || MIME_XAT[fitxer.type] !== tipus) throw errorAdjuntXat('format');
  if (fitxer.size > MAXIM_ADJUNT_XAT[tipus]) throw errorAdjuntXat(tipus === 'video' ? 'video-mida' : 'SDP-XAT-020');
  if (tipus !== 'imatge' && (!Number.isSafeInteger(duradaMs) || duradaMs <= 0 || (tipus === 'video' && duradaMs > MAX_VIDEO_MS))) {
    throw errorAdjuntXat('durada');
  }
  const lloc = normalitzaUbicacioXat(ubicacio);
  if (conservaUbicacio === false && lloc) throw errorAdjuntXat('ubicacio-invalida');
}
