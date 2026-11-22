import { compressImage } from '../../utils/imageUtils.js';
import { ERRORS_ADJUNT_XAT, MAXIM_ADJUNT_XAT, MAXIM_BLOB_ADJUNT, MAX_VIDEO_ENTRADA_BYTES, MAX_VIDEO_MS, normalitzaUbicacioXat, errorAdjuntXat } from '../../data/xatMultimedia.js';
import { inspeccionaUbicacioMitja, senseUbicacioVideo as netejaUbicacioVideo } from '../../utils/ubicacioMitjans.js';
import { comprimeixVideoClient } from '../../utils/compressioVideoClient.js';
/* Gauntlet 261022_0225 (crítica Claude, MEDIA-7) · Primer AAC en MP4: Safari,
   iOS, Chrome i Firefox el reproduïxen, i Chrome el grava des que ho admet
   (abans guanyava el WebM, sense durada ni cerca a Chromium). El WebM/Opus
   queda per a Firefox, que no grava MP4. */
export const MIMES_VEU = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'];
const abortat = () => new DOMException('Operació cancel·lada.', 'AbortError');
export const mimeDeGravacio = (Recorder) => MIMES_VEU.find((mime) => Recorder?.isTypeSupported?.(mime)) || null;

/* Gauntlet 261022_0225 (crítica Claude, MEDIA-5) · El `code` de cada fallada
   (ERRORS_ADJUNT_XAT) → la clau d'i18n. El text valencià d'ERRORS_ADJUNT_XAT
   és el valor de la clau en ca. SDP-XAT-429 reutilitza la del text. */
export const CLAUS_ERROR_ADJUNT = Object.freeze({
  'SDP-XAT-020': 'section.xat.adjunts.error.quota',
  'SDP-XAT-001': 'section.xat.adjunts.error.sessio',
  'SDP-XAT-006': 'section.xat.adjunts.error.senseAcces',
  'SDP-XAT-008': 'section.xat.adjunts.error.repetit',
  'SDP-XAT-011': 'section.xat.adjunts.error.noPermes',
  'SDP-XAT-021': 'section.xat.adjunts.error.noConfirmat',
  'SDP-XAT-022': 'section.xat.adjunts.error.massaPendents',
  'SDP-XAT-429': 'section.xat.error.massaMissatges',
  'sense-capacitat': 'section.xat.adjunts.error.senseCapacitat',
  'sessio-caducada': 'section.xat.adjunts.error.sessioCaducada',
  'temps-esgotat': 'section.xat.adjunts.error.tempsEsgotat',
  xarxa: 'section.xat.adjunts.error.xarxa',
  servidor: 'section.xat.adjunts.error.servidor',
  'sense-confirmacio': 'section.xat.adjunts.error.senseConfirmacio',
  format: 'section.xat.adjunts.error.format',
  'format-heic': 'section.xat.adjunts.error.formatHeic',
  durada: 'section.xat.adjunts.error.durada',
  buit: 'section.xat.adjunts.error.buit',
  'durada-illegible': 'section.xat.adjunts.error.duradaIllegible',
  'video-illegible': 'section.xat.adjunts.error.videoIllegible',
  foto: 'section.xat.adjunts.error.foto',
  'video-mida-entrada': 'section.xat.adjunts.error.video-mida-entrada',
  'video-compressio-no-disponible': 'section.xat.adjunts.error.video-compressio-no-disponible',
  'video-audio-no-capturable': 'section.xat.adjunts.error.video-audio-no-capturable',
  'video-compressio': 'section.xat.adjunts.error.video-compressio',
  'video-mida': 'section.xat.adjunts.error.video-mida',
  'video-compressio-temps': 'section.xat.adjunts.error.video-compressio-temps',
  'ubicacio-invalida': 'section.xat.adjunts.error.ubicacio-invalida',
  'ubicacio-no-admesa': 'section.xat.adjunts.error.ubicacio-no-admesa',
  'ubicacio-no-eliminable': 'section.xat.adjunts.error.ubicacio-no-eliminable',
  'video-no-acreditable': 'section.xat.adjunts.error.video-no-acreditable',
  'video-no-acreditable-navegador': 'section.xat.adjunts.error.video-no-acreditable-navegador',

  'foto-mida': 'section.xat.adjunts.error.fotoMida',
  'foto-codificacio': 'section.xat.adjunts.error.fotoCodificacio',
  'sense-gravacio': 'section.xat.adjunts.senseGravacio',
  'micro-permis': 'section.xat.adjunts.error.microPermis',
  'micro-absent': 'section.xat.adjunts.error.microAbsent',
  'micro-ocupat': 'section.xat.adjunts.error.microOcupat',
  gravacio: 'section.xat.adjunts.error.gravacio',
  'gravacio-buida': 'section.xat.adjunts.error.gravacioBuida',
  descart: 'section.xat.adjunts.error.descart',
  'no-disponible': 'section.xat.adjunts.error.noDisponible',
  obrir: 'section.xat.adjunts.error.obrir'
});

/** El text per a la persona d'una fallada dels adjunts, en la llengua de `t`. Sense codi conegut, el missatge o `perDefecte`. */
export function textDErrorAdjunt(error, t, perDefecte = '') {
  const code = String(error?.code ?? '');
  if (Object.hasOwn(CLAUS_ERROR_ADJUNT, code)) return t(CLAUS_ERROR_ADJUNT[code], ERRORS_ADJUNT_XAT[code]);
  return error?.message || perDefecte;
}

export function comprovaMida(fitxer) {
  if (!(fitxer instanceof Blob) || !fitxer.size) throw errorAdjuntXat('buit');
  if (fitxer.size > MAXIM_BLOB_ADJUNT) throw errorAdjuntXat('video-mida');
}

/** Metadades del fitxer local: no es puja cap byte per a mirar la durada. */
export function duradaLocal(fitxer, { signal, creaElement = () => document.createElement('video'), urls = URL } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortat());
    const element = creaElement();
    const url = urls.createObjectURL(fitxer);
    let acabada = false, cercantFinal = false;
    const neteja = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancella);
      element.onloadedmetadata = element.onerror = element.ondurationchange = element.ontimeupdate = element.onseeked = null;
      try { element.removeAttribute('src'); element.load(); } catch { /* El decoder ja està descarregat. */ }
      urls.revokeObjectURL(url);
    };
    const acaba = (valor, error = false) => {
      if (acabada) return;
      acabada = true; neteja(); (error ? reject : resolve)(valor);
    };
    const cancella = () => acaba(abortat(), true);
    const timer = setTimeout(() => acaba(errorAdjuntXat('durada-illegible'), true), 10_000);
    const llig = () => {
      if (acabada) return;
      if (signal?.aborted) { cancella(); return; }
      // MediaRecorder WebM pot ometre l’índex. Un sol seek local resol el
      // final; el mateix timeout i signal també governen esta espera.
      if (element.duration === Infinity) {
        if (!cercantFinal) {
          cercantFinal = true;
          element.ondurationchange = element.ontimeupdate = element.onseeked = llig;
          try { element.currentTime = 1e10; }
          catch { acaba(errorAdjuntXat('durada-illegible'), true); }
        }
        return;
      }
      const ms = element.duration * 1000;
      if (cercantFinal && (!Number.isFinite(ms) || ms <= 0)) return;
      if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_VIDEO_MS) acaba(errorAdjuntXat('durada'), true);
      else acaba(Math.ceil(ms));
    };
    element.preload = 'metadata';
    element.onloadedmetadata = llig;
    element.onerror = () => acaba(errorAdjuntXat('video-illegible'), true);
    signal?.addEventListener('abort', cancella, { once: true });
    try { element.src = url; }
    catch { acaba(errorAdjuntXat('video-illegible'), true); }
  });
}

function bytesDeDataUrl(data) {
  const [cap, contingut] = data.split(',');
  const mime = /^data:(image\/(?:webp|jpeg));base64$/.exec(cap)?.[1];
  if (!mime || !contingut) throw errorAdjuntXat('foto-codificacio');
  try {
    const bytes = Uint8Array.from(atob(contingut), (c) => c.charCodeAt(0));
    if (!bytes.length) throw errorAdjuntXat('foto-codificacio');
    return { mime, bytes };
  } catch (cause) {
    throw errorAdjuntXat('foto-codificacio', { cause });
  }
}

/* v1.2.20 · Gauntlet R1 (L1-01) · El JPEG del canvas de WebKit (Safari i
   l'app iOS) ja porta un APP1 Exif propi (MM, 76 B: ColorSpace,
   PixelXDimension i PixelYDimension) i un APP13 «Photoshop 3.0» (56 B).
   incrustaEnJpeg no hi posava el TIFF blanc (el JPEG ja tenia EXIF) i el
   transport, que torna a passar els bytes per imatgeSenseUbicacio, en
   llevava 136 B: cap foto ni captura no s'enviava. Ara es puja el punt fix
   d'imatgeSenseUbicacio: primer es lleven les metadades del codificador,
   després s'hi incrusta el TIFF blanc de l'original (data i càmera, mai el
   GPS) i una passada més no ha de canviar cap byte, la mateixa comparació
   que fa el transport; si en canvia, és un error de codificació ací, abans
   de cap xarxa. Uns bytes que el netejador no entén continuen com abans: el
   transport els veta amb el mateix codi. */
function blobCanonic(data, tiff, { imatgeSenseUbicacio, incrustaEnJpeg, incrustaEnWebp }) {
  const { mime, bytes } = bytesDeDataUrl(data);
  const net = imatgeSenseUbicacio(bytes);
  if (!net) return new Blob([bytes], { type: mime });
  if (net.format !== mime) throw errorAdjuntXat('foto-codificacio');
  const amb = (tiff && (mime === 'image/jpeg' ? incrustaEnJpeg : incrustaEnWebp)(net.bytes, tiff)) || net.bytes;
  const fix = imatgeSenseUbicacio(amb);
  if (fix?.format !== mime || fix.bytes.length !== amb.length || fix.bytes.some((b, i) => b !== amb[i])) throw errorAdjuntXat('foto-codificacio');
  return new Blob([amb], { type: mime });
}

/** Neteja acotada del contenidor; la implementació compartida no recodifica. */
export const senseUbicacioVideo = (fitxer, opcions) => netejaUbicacioVideo(fitxer, opcions);

/* IDEA-36 (assalt 261101, T7 · S3) · Una captura de pantalla (PNG: el que
   fan iOS, Android i el porta-retalls) porta text menut i es llig millor gran:
   2048 px de costat llarg i, si no cap dins del sostre de la imatge
   (MAXIM_ADJUNT_XAT.imatge, 2.000.000 B), 1600 i després 1200. Una foto
   (JPEG, WebP, AVIF o GIF) va a 1200 px, com sempre. Un PNG que no és cap
   captura només hi guanya resolució. */
export const COSTAT_FOTO = 1200;
export const COSTATS_CAPTURA = Object.freeze([2048, 1600, 1200]);
export const esCapturaDePantalla = (fitxer) => fitxer?.type === 'image/png';

/* El selector natiu pot donar MIME buit: només aleshores inferim una de les
   extensions admeses. El MIME explícit continua manant, i el navegador ha
   de descodificar els bytes: el nom no acredita el contingut. */
const MIME_PER_EXTENSIO = Object.freeze({
  heic: 'image/heic', heif: 'image/heif', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm'
});
function ambMimeLocal(fitxer) {
  const extensio = /\.([^.]+)$/.exec(fitxer.name || '')?.[1].toLowerCase();
  const inferit = Object.hasOwn(MIME_PER_EXTENSIO, extensio) ? MIME_PER_EXTENSIO[extensio] : '';
  const mime = fitxer.type === 'image/jpg' ? 'image/jpeg' : fitxer.type || inferit;
  // slice conserva els bytes i dona a FileReader/netejaVideo el MIME inferit.
  return mime && mime !== fitxer.type ? fitxer.slice(0, fitxer.size, mime) : fitxer;
}

/* El GPS només viatja al DTO consentit, mai dins del raster. La data i la
   càmera es reconstruïxen amb llista blanca; l'opt-out lleva tot l'EXIF.
   Sempre per davall del sostre client. Preservem els tres
   primers intents de captures; després abaixem qualitat i costat amb una
   cerca finita (màxim 15 recodificacions, inclòs el canvi WebP → JPEG).
   Si no hi cap o no es pot codificar, no es retorna mai l'original. */
async function imatgeRecodificada(fitxer, { signal, comprimeix, conservaUbicacio = true }) {
  const { exifPublicable, preparaTiffSenseUbicacio, imatgeSenseUbicacio, incrustaEnJpeg, incrustaEnWebp } = await import('../../components/universal/enquadrament/exifIncrustat.js');
  const exifCanonic = { imatgeSenseUbicacio, incrustaEnJpeg, incrustaEnWebp };
  const tiff = conservaUbicacio !== false ? preparaTiffSenseUbicacio((await exifPublicable(fitxer))?.tiff) : null;
  if (signal?.aborted) throw abortat();
  const primers = esCapturaDePantalla(fitxer) ? COSTATS_CAPTURA : [COSTAT_FOTO];
  const intents = [
    ...primers.map((maxSize) => ({ maxSize, quality: 0.8 })),
    ...[0.68, 0.55].map((quality) => ({ maxSize: COSTAT_FOTO, quality })),
    ...[960, 768, 640].flatMap((maxSize) => [0.8, 0.68, 0.55].map((quality) => ({ maxSize, quality })))
  ];
  let format = 'image/webp';
  const codifica = async (opcions) => {
    try { return await comprimeix(fitxer, { ...opcions, format }); }
    catch (cause) {
      if (signal?.aborted) throw abortat();
      if (cause?.name === 'AbortError') throw cause;
      throw errorAdjuntXat(/^image\/hei[cf]$/.test(fitxer.type) ? 'format-heic' : 'foto-codificacio', { cause });
    }
  };
  for (const intent of intents) {
    if (signal?.aborted) throw abortat();
    const opcions = { ...intent, conservaExif: false };
    let data;
    try { data = await codifica(opcions); }
    catch (error) {
      if (error?.name === 'AbortError' || format !== 'image/webp') throw error;
      // Un codificador WebP que rebutja també pot tindre JPEG disponible.
      format = 'image/jpeg';
      data = await codifica(opcions);
    }
    if (signal?.aborted) throw abortat();
    /* Un format no suportat pot tornar PNG. Mirem el resultat real i
       demanem JPEG, que es manté als intents següents. Mai es puja PNG. */
    if (format === 'image/webp' && !/^data:image\/webp;base64,/.test(String(data))) {
      if (signal?.aborted) throw abortat();
      format = 'image/jpeg';
      data = await codifica(opcions);
    }
    if (signal?.aborted) throw abortat();
    const imatge = blobCanonic(String(data), tiff, exifCanonic);
    if (imatge.size < MAXIM_ADJUNT_XAT.imatge) return imatge;
  }
  throw errorAdjuntXat('foto-mida');
}

/** El lloc es rescata de l’original abans de tocar píxels o contenidors. */
export async function preparaAdjunt(fitxer, {
  signal, conservaUbicacio = true, onProgresCompressio,
  comprimeix = compressImage, lligDurada = duradaLocal, netejaVideo = senseUbicacioVideo,
  inspecciona = inspeccionaUbicacioMitja, comprimeixVideo = comprimeixVideoClient,
} = {}) {
  if (!(fitxer instanceof Blob) || !fitxer.size) throw errorAdjuntXat('buit');
  if (signal?.aborted) throw abortat();
  fitxer = ambMimeLocal(fitxer);
  const imatge = /^image\/(jpeg|png|webp|avif|gif|heic|heif)$/.test(fitxer.type);
  const video = /^video\/(mp4|webm|quicktime)$/.test(fitxer.type);
  if (!imatge && !video) throw errorAdjuntXat('format');
  if (video && fitxer.size > MAX_VIDEO_ENTRADA_BYTES) throw errorAdjuntXat('video-mida-entrada');
  const inspeccio = await inspecciona(fitxer, { signal });
  if (signal?.aborted) throw abortat();
  const conserva = conservaUbicacio !== false;
  const ubicacio = conserva && inspeccio?.coordenades
    ? normalitzaUbicacioXat({ lat: inspeccio.coordenades.lat, lng: inspeccio.coordenades.lng }) : null;
  let resultat;
  if (imatge) {
    resultat = { fitxer: await imatgeRecodificada(fitxer, { signal, comprimeix, conservaUbicacio: conserva }), tipus: 'imatge', duradaMs: null };
  } else {
    const duradaMs = await lligDurada(fitxer, { signal });
    if (signal?.aborted) throw abortat();
    if (!Number.isSafeInteger(duradaMs) || duradaMs <= 0 || duradaMs > MAX_VIDEO_MS) throw errorAdjuntXat('durada');
    const reduit = await comprimeixVideo(fitxer, { signal, duradaMs, onProgresCompressio, audioEsperat: inspeccio?.audioEsperat ?? 'desconegut' });
    if (signal?.aborted) throw abortat();
    if (!(reduit?.fitxer instanceof Blob) || !reduit.fitxer.size) throw errorAdjuntXat('video-compressio');
    let preparat = reduit.fitxer;
    let net = reduit.comprimit === true;
    // MP4/MOV tenen un sanejador acreditable sense tocar mostres. WebM
    // manté l'admissió de sempre; no se li atribuïx una neteja no observada.
    if (!net && (!conserva || /^video\/(mp4|quicktime)$/.test(preparat.type))) {
      const netejat = await netejaVideo(preparat, { signal });
      // v1.2.22 · Gauntlet R1 (L4-04) · Un MP4/MOV que no es pot acreditar té el seu avís (video-no-acreditable).
      // Gauntlet R2 (M2-02) · Si el navegador no l'ha pogut comprimir (motiuFallback), la causa és el camí, no el
      // fitxer: el mateix MP4/MOV comprimit ix en un contenidor nou. L'avís és el del navegador i porta el motiu.
      if (!netejat.net && reduit.motiuFallback && /^video\/(mp4|quicktime)$/.test(preparat.type)) {
        throw errorAdjuntXat('video-no-acreditable-navegador', { motiuFallback: reduit.motiuFallback });
      }
      if (!netejat.net) throw errorAdjuntXat(/^video\/(mp4|quicktime)$/.test(preparat.type) ? 'video-no-acreditable' : 'ubicacio-no-eliminable');
      if (netejat.net) { preparat = netejat.fitxer; net = true; }
    }
    resultat = { fitxer: preparat, tipus: 'video', duradaMs, senseUbicacio: net, videoComprimit: reduit.comprimit === true };
  }
  if (signal?.aborted) throw abortat();
  comprovaMida(resultat.fitxer);
  return { ...resultat, id: crypto.randomUUID(), conservaUbicacio: conserva,
    ubicacioVerificada: Boolean(inspeccio?.completa), ...(ubicacio ? { ubicacio } : {}) };
}

/** Només abans del primer intent d’enviament; una altra càrrega rep un ID nou. */
export async function amagaUbicacioAdjunt(adjunt, { signal, comprimeix = compressImage, netejaVideo = senseUbicacioVideo } = {}) {
  if (signal?.aborted) throw abortat();
  let fitxer = adjunt.fitxer;
  if (adjunt.tipus === 'imatge') fitxer = await imatgeRecodificada(fitxer, { signal, comprimeix, conservaUbicacio: false });
  else if (adjunt.tipus === 'video' && !adjunt.senseUbicacio) {
    const netejat = await netejaVideo(fitxer, { signal });
    if (!netejat.net) throw errorAdjuntXat(/^video\/(mp4|quicktime)$/.test(fitxer.type) ? 'video-no-acreditable' : 'ubicacio-no-eliminable');
    fitxer = netejat.fitxer;
  }
  if (signal?.aborted) throw abortat();
  const resultat = { ...adjunt, fitxer, id: crypto.randomUUID(), conservaUbicacio: false, senseUbicacio: true };
  delete resultat.ubicacio;
  return resultat;
}

/* El micròfon que el sistema no deixa usar no és culpa de ningú (MEDIA-11):
   el text explica on es dona el permís. Gauntlet 261022_0225 (crítica Claude,
   ADV-MEDIA-12) · Ocupat per una telefonada o una altra app, el text diu què
   cal fer: NotReadableError i, a Firefox, l'AbortError de getUserMedia, que
   mai és nostre (no rep el signal). */
function errorDelMicro(error, { delSistema = false } = {}) {
  if (error?.name === 'AbortError' && !delSistema) return error;
  const code = ['NotAllowedError', 'SecurityError'].includes(error?.name) ? 'micro-permis'
    : ['NotFoundError', 'OverconstrainedError'].includes(error?.name) ? 'micro-absent'
      : ['NotReadableError', 'AbortError'].includes(error?.name) ? 'micro-ocupat' : 'gravacio';
  return errorAdjuntXat(code, { cause: error });
}

// Un tros d'un segon a 64 kbit/s en fa uns 8 kB: el marge en deixa més d'una dotzena.
const MARGE_VEU_BYTES = 100_000;
/* XAT-07 · El sostre de temps d'una nota de veu: la interfície en compta el
   que queda i avisa abans d'arribar-hi. */
export const MAX_VEU_MS = 300_000;

/** Una gravació, un resultat; tots els tracks s'aturen en cancel·lar o acabar.
 *  Si s'atura sola, el resultat ho diu: `aturada` 'temps' (MAX_VEU_MS) o 'mida' (prop dels 3 MB). */
export async function gravaVeu({ signal, mediaDevices = navigator.mediaDevices, Recorder = globalThis.MediaRecorder } = {}) {
  const mimeType = mimeDeGravacio(Recorder);
  if (!mimeType || !mediaDevices?.getUserMedia) throw errorAdjuntXat('sense-gravacio');
  if (signal?.aborted) throw abortat();
  let stream;
  try { stream = await mediaDevices.getUserMedia({ audio: true }); }
  catch (error) { throw errorDelMicro(error, { delSistema: true }); }
  const tancaTracks = () => stream.getTracks().forEach((track) => {
    try { track.stop(); } catch { /* WebView/SO ja havia tancat el track */ }
  });
  if (signal?.aborted) { tancaTracks(); throw abortat(); }
  let recorder;
  try { recorder = new Recorder(stream, { mimeType, audioBitsPerSecond: 64_000 }); }
  catch (error) { tancaTracks(); throw errorDelMicro(error); }
  let resolve, reject, acabat = false, bytes = 0, aturada = null;
  const chunks = [];
  let inici = Date.now();
  const resultat = new Promise((resol, rebutja) => { resolve = resol; reject = rebutja; });
  const aturaRecorderSegur = () => {
    if (recorder.state === 'inactive') return { aturat: false, error: null };
    try {
      recorder.stop();
      return { aturat: true, error: null };
    } catch (error) {
      return { aturat: false, error };
    }
  };
  const neteja = () => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancella);
    recorder.onstart = recorder.ondataavailable = recorder.onstop = recorder.onerror = null;
    aturaRecorderSegur();
    tancaTracks();
  };
  const falla = (error) => { if (acabat) return; acabat = true; neteja(); reject(error); };
  const resolAmbChunksAcumulatsOError = (errorFallback) => {
    if (acabat) return;
    const fitxer = new Blob(chunks, { type: mimeType.split(';')[0] });
    if (!fitxer.size) { falla(errorFallback); return; }
    acabat = true;
    neteja();
    resolve({ id: crypto.randomUUID(), fitxer, tipus: 'veu', duradaMs: Math.max(1, Date.now() - inici), ...(aturada ? { aturada } : {}) });
  };
  const cancella = () => falla(abortat());
  const atura = () => {
    if (acabat || recorder.state === 'inactive') return;
    const { error } = aturaRecorderSegur();
    if (error && !acabat) resolAmbChunksAcumulatsOError(errorDelMicro(error));
  };
  /* XAT-07 · Abans s'aturava sense dir res: ara el resultat porta el motiu i
     la interfície ho avisa. */
  const aturaSola = (motiu) => {
    if (acabat || recorder.state === 'inactive') return;
    aturada = motiu;
    const { error } = aturaRecorderSegur();
    if (error && !acabat) resolAmbChunksAcumulatsOError(errorDelMicro(error));
  };
  // Cinc minuts eviten mantindre el micròfon o la memòria indefinidament.
  const timer = setTimeout(() => aturaSola('temps'), MAX_VEU_MS);
  /* MEDIA-7 · La durada és la del rellotge de la gravació, des que el
     gravador comença de veres: el WebM de Chromium no la porta (duration =
     Infinity) i el reproductor la llig de metadades.adjunt.duradaMs. */
  recorder.onstart = () => { inici = Date.now(); };
  recorder.ondataavailable = ({ data }) => {
    if (!data?.size || acabat) return;
    bytes += data.size;
    if (bytes > MAXIM_ADJUNT_XAT.veu) { falla(errorAdjuntXat('SDP-XAT-020')); return; }
    chunks.push(data);
    // Prop del sostre de la veu (3 MB), la gravació s'atura sola i la nota es conserva.
    if (bytes > MAXIM_ADJUNT_XAT.veu - MARGE_VEU_BYTES) aturaSola('mida');
  };
  recorder.onerror = () => falla(errorAdjuntXat('gravacio'));
  recorder.onstop = () => {
    if (acabat) return;
    const fitxer = new Blob(chunks, { type: mimeType.split(';')[0] });
    if (!fitxer.size) { falla(errorAdjuntXat('gravacio-buida')); return; }
    acabat = true;
    neteja();
    resolve({ id: crypto.randomUUID(), fitxer, tipus: 'veu', duradaMs: Math.max(1, Date.now() - inici), ...(aturada ? { aturada } : {}) });
  };
  signal?.addEventListener('abort', cancella, { once: true });
  try { recorder.start(1000); } catch (error) { falla(errorDelMicro(error)); }
  return { atura, cancella, resultat };
}
