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
  'audio/webm': 'veu', 'audio/mp4': 'veu', 'audio/ogg': 'veu',
  'application/pdf': 'document', 'text/csv': 'document', 'text/plain': 'document',
  'application/vnd.oasis.opendocument.text': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document'
});
export const MAXIM_ADJUNT_XAT = Object.freeze({ imatge: 2_000_000, veu: 3_000_000, video: 20_000_000, document: 10_000_000 });
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
  'document-format': 'Tria un document PDF, TXT, CSV, ODT o DOCX vàlid.',
  'document-mida': 'El document ha de tindre com a màxim 10 MB.',
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
  /* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Un servidor sense la RPC4 només perd el DTO (el xip del mapa). El
     text ja no diu «sense la ubicació».
     v1.2.23 · L1-02 (Gauntlet R1) · El fitxer porta el lloc només si l'avís previ ho ha dit (llocDelFitxer,
     ubicacioConservada). En el cas «només el mapa» (avís ubicacioNomesMapa: un vídeo recomprimit en WebM, o en un MP4
     on no s'ha pogut reescriure el ©xyz) el contingut queda sense cap lloc, i este avís continua sent exacte: l'únic
     lloc era el del mapa. */
  'ubicacio-no-admesa': 'S’ha enviat sense marcar el lloc al mapa: el servidor de Sóc de Poble encara no ho admet.',
  'ubicacio-no-eliminable': 'Este navegador no ha pogut amagar la ubicació del vídeo. Tria un MP4 o prova-ho amb un altre navegador.',
  /* v1.2.22 · Gauntlet R1 (L4-04, L5-03) · Un MP4 o MOV que el sanejador de Codex R32.42 no pot acreditar (una pista de
     dades opaca, un uuid desconegut, un moov comprimit) no s'envia, triï el que triï la persona, i no s'arregla «triant
     un MP4». ubicacio-no-eliminable queda per al WebM amb «Amaga el lloc».
     Gauntlet R2 (M2-02) · La causa depén del camí. video-no-acreditable és el del fitxer: el reenviament
     (creaOpcionsMotorAccions.js) i la comprovació abans de reservar (supabase/xatMultimedia.js), on el sanejador mira
     el fitxer mateix, sense cap compressió pel mig. A preparaAdjunt, en canvi, el sanejador només actua quan el
     navegador no ha pogut comprimir (motiuFallback de compressioVideoClient.js: compressió no disponible; àudio no
     capturable, per exemple un element <video> sense captureStream amb un vídeo que porta so; error; temps o mida); si
     comprimix, el mateix fitxer ix en un contenidor nou i s'envia. Eixe camí té el seu avís,
     video-no-acreditable-navegador, que no promet cap eixida: un altre vídeo del mateix telèfon fa el mateix recorregut,
     i un altre navegador pot no saber descodificar-lo.
     v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Deroga el «triï el que triï» de L4-04: per defecte el vídeo
     conserva el lloc i ix tal com és. Estos dos avisos queden per a quan la persona demana «Amaga el lloc» i el vídeo
     no es pot netejar (no s'envia brut), per al reenviament i per al transport d'una entrada sense lloc. */
  'video-no-acreditable': 'No podem comprovar que este vídeo no porte dins el lloc on es va gravar i, per a protegir-te, no l’enviem. Prova-ho amb un altre vídeo.',
  'video-no-acreditable-navegador': 'Este aparell o navegador no ha pogut preparar el vídeo per a enviar-lo sense el lloc on es va gravar i, per a protegir-te, no l’enviem.',
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

/** Coordenades explícites a la precisió de la prèvia: 0,01°, sense altitud. */
export function normalitzaUbicacioXat(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'object' || Array.isArray(valor) || Object.keys(valor).length !== 2
    || !Object.keys(valor).every(clau => clau === 'lat' || clau === 'lng')
    || !Number.isFinite(valor.lat) || !Number.isFinite(valor.lng)
    || valor.lat < -90 || valor.lat > 90 || valor.lng < -180 || valor.lng > 180) throw errorAdjuntXat('ubicacio-invalida');
  // DOL-55: el DTO consentit mai no conserva decimals amagats per la UI.
  // `|| 0` evita un -0 que podria reaparéixer com a signe en la prèvia.
  return { lat: Number(valor.lat.toFixed(2)) || 0, lng: Number(valor.lng.toFixed(2)) || 0 };
}

export function validaAdjuntXat({ fitxer, tipus, duradaMs, ubicacio, conservaUbicacio }) {
  if (!(fitxer instanceof Blob) || !fitxer.size || MIME_XAT[fitxer.type] !== tipus) throw errorAdjuntXat('format');
  if (fitxer.size > MAXIM_ADJUNT_XAT[tipus]) throw errorAdjuntXat(tipus === 'document' ? 'document-mida' : tipus === 'video' ? 'video-mida' : 'SDP-XAT-020');
  if (tipus === 'document' && (duradaMs != null || ubicacio != null)) throw errorAdjuntXat('document-format');
  if (['veu', 'video'].includes(tipus) && (!Number.isSafeInteger(duradaMs) || duradaMs <= 0 || (tipus === 'video' && duradaMs > MAX_VIDEO_MS))) {
    throw errorAdjuntXat('durada');
  }
  const lloc = normalitzaUbicacioXat(ubicacio);
  if (conservaUbicacio === false && lloc) throw errorAdjuntXat('ubicacio-invalida');
}
