import { compressImage } from '../../utils/imageUtils.js';
import { ERRORS_ADJUNT_XAT, MAXIM_ADJUNT_XAT, MAX_VIDEO_MS, QUOTA_XAT_BYTES, errorAdjuntXat } from '../../data/xatMultimedia.js';
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
  durada: 'section.xat.adjunts.error.durada',
  buit: 'section.xat.adjunts.error.buit',
  'durada-illegible': 'section.xat.adjunts.error.duradaIllegible',
  'video-illegible': 'section.xat.adjunts.error.videoIllegible',
  foto: 'section.xat.adjunts.error.foto',
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
  if (fitxer.size > QUOTA_XAT_BYTES) throw errorAdjuntXat('SDP-XAT-020');
}

/** Metadades del fitxer local: no es puja cap byte per a mirar la durada. */
export function duradaLocal(fitxer, { signal, creaElement = () => document.createElement('video'), urls = URL } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortat());
    const element = creaElement();
    const url = urls.createObjectURL(fitxer);
    const neteja = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancella);
      element.onloadedmetadata = element.onerror = null;
      element.removeAttribute('src');
      element.load();
      urls.revokeObjectURL(url);
    };
    const acaba = (valor, error = false) => { neteja(); (error ? reject : resolve)(valor); };
    const cancella = () => acaba(abortat(), true);
    const timer = setTimeout(() => acaba(errorAdjuntXat('durada-illegible'), true), 10_000);
    element.preload = 'metadata';
    element.onloadedmetadata = () => {
      const ms = element.duration * 1000;
      if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_VIDEO_MS) {
        acaba(errorAdjuntXat('durada'), true);
      } else acaba(Math.ceil(ms));
    };
    element.onerror = () => acaba(errorAdjuntXat('video-illegible'), true);
    signal?.addEventListener('abort', cancella, { once: true });
    element.src = url;
  });
}

function blobDeDataUrl(data) {
  const [cap, contingut] = data.split(',');
  const mime = /^data:(image\/(?:webp|jpeg));base64$/.exec(cap)?.[1];
  if (!mime) throw errorAdjuntXat('foto');
  const bytes = Uint8Array.from(atob(contingut), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

/* Gauntlet 261022_0225 (crítica Claude, MEDIA-4) · Un MP4 d'Android porta la
   ubicació a moov/udta (©xyz) i un MOV d'iPhone, a moov/meta
   (com.apple.quicktime.location.ISO6709). Sense recodificar res, les caixes
   udta i meta (de dalt, de moov i de cada trak) i les XMP passen a ser
   «free» i el seu contingut es posa a zero: la mida no canvia, cap
   desplaçament es mou, els reproductors se les salten i les coordenades ja
   no són als bytes. Si l'estructura no és la que esperem, o el vídeo és
   WebM, torna `net: false` i la interfície avisa abans d'enviar-lo: mai es
   puja en silenci. */
const CAIXA_FREE = [0x66, 0x72, 0x65, 0x65];
const UUID_XMP = 'be7acfcb97a942e89c71999491e3afac';
export async function senseUbicacioVideo(fitxer) {
  if (!/^video\/(mp4|quicktime)$/.test(fitxer?.type || '')) return { fitxer, net: false };
  try {
    const bytes = new Uint8Array(await fitxer.arrayBuffer());
    const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let teMoov = false;
    const esXmp = (p, cap) => Array.from(bytes.subarray(p + cap, p + cap + 16), (b) => b.toString(16).padStart(2, '0')).join('') === UUID_XMP;
    const recorre = (inici, fi, nivell) => {
      for (let p = inici; p < fi;) {
        if (fi - p < 8) throw new Error('caixa tallada');
        let mida = vista.getUint32(p);
        let cap = 8;
        if (mida === 1) {
          if (fi - p < 16) throw new Error('caixa tallada');
          mida = Number(vista.getBigUint64(p + 8));
          cap = 16;
        } else if (mida === 0) mida = fi - p;
        if (mida < cap || mida > fi - p) throw new Error('caixa invàlida');
        const tipus = String.fromCharCode(...bytes.subarray(p + 4, p + 8));
        if (nivell === 0 && tipus === 'moov') teMoov = true;
        if (tipus === 'udta' || tipus === 'meta' || (tipus === 'uuid' && esXmp(p, cap))) {
          bytes.set(CAIXA_FREE, p + 4);
          bytes.fill(0, p + cap, p + mida);
        } else if ((nivell === 0 && tipus === 'moov') || (nivell === 1 && tipus === 'trak')) recorre(p + cap, p + mida, nivell + 1);
        p += mida;
      }
    };
    recorre(0, bytes.length, 0);
    return teMoov ? { fitxer: new Blob([bytes], { type: fitxer.type }), net: true } : { fitxer, net: false };
  } catch {
    return { fitxer, net: false };
  }
}

export async function preparaAdjunt(fitxer, { signal, comprimeix = compressImage, lligDurada = duradaLocal, netejaVideo = senseUbicacioVideo } = {}) {
  if (!(fitxer instanceof Blob) || !fitxer.size) throw errorAdjuntXat('buit');
  if (signal?.aborted) throw abortat();
  let resultat;
  if (/^image\/(jpeg|png|webp|avif|gif)$/.test(fitxer.type)) {
    // Sempre recodificada i sense EXIF/GPS, també si l'original ja és menut.
    const opcions = { maxSize: 1200, quality: 0.8, conservaExif: false };
    let data = await comprimeix(fitxer, { ...opcions, format: 'image/webp' });
    /* Gauntlet 261022_0225 (crítica Claude, MEDIA-3) · WebKit no sap codificar
       WebP en canvas i torna PNG: es torna a demanar en JPEG, com fa
       fotoDinsDelPressupost. Una foto mai no es puja en PNG. */
    if (!/^data:image\/webp[;,]/.test(String(data))) {
      if (signal?.aborted) throw abortat();
      data = await comprimeix(fitxer, { ...opcions, format: 'image/jpeg' });
    }
    resultat = { fitxer: blobDeDataUrl(String(data)), tipus: 'imatge', duradaMs: null };
  } else if (/^video\/(mp4|webm|quicktime)$/.test(fitxer.type)) {
    comprovaMida(fitxer);
    const duradaMs = await lligDurada(fitxer, { signal });
    if (signal?.aborted) throw abortat();
    const { fitxer: net, net: senseUbicacio } = await netejaVideo(fitxer);
    resultat = { fitxer: net, tipus: 'video', duradaMs, senseUbicacio };
  } else throw errorAdjuntXat('format');
  if (signal?.aborted) throw abortat();
  comprovaMida(resultat.fitxer);
  return { ...resultat, id: crypto.randomUUID() };
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

/** Una gravació, un resultat; tots els tracks s'aturen en cancel·lar o acabar. */
export async function gravaVeu({ signal, mediaDevices = navigator.mediaDevices, Recorder = globalThis.MediaRecorder } = {}) {
  const mimeType = mimeDeGravacio(Recorder);
  if (!mimeType || !mediaDevices?.getUserMedia) throw errorAdjuntXat('sense-gravacio');
  if (signal?.aborted) throw abortat();
  let stream;
  try { stream = await mediaDevices.getUserMedia({ audio: true }); }
  catch (error) { throw errorDelMicro(error, { delSistema: true }); }
  const tancaTracks = () => stream.getTracks().forEach((track) => track.stop());
  if (signal?.aborted) { tancaTracks(); throw abortat(); }
  let recorder;
  try { recorder = new Recorder(stream, { mimeType, audioBitsPerSecond: 64_000 }); }
  catch (error) { tancaTracks(); throw errorDelMicro(error); }
  let resolve, reject, acabat = false, bytes = 0;
  const chunks = [];
  let inici = Date.now();
  const resultat = new Promise((resol, rebutja) => { resolve = resol; reject = rebutja; });
  const neteja = () => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancella);
    recorder.onstart = recorder.ondataavailable = recorder.onstop = recorder.onerror = null;
    if (recorder.state !== 'inactive') recorder.stop();
    tancaTracks();
  };
  const falla = (error) => { if (acabat) return; acabat = true; neteja(); reject(error); };
  const cancella = () => falla(abortat());
  const atura = () => { if (!acabat && recorder.state !== 'inactive') recorder.stop(); };
  // Cinc minuts eviten mantindre el micròfon o la memòria indefinidament.
  const timer = setTimeout(atura, 300_000);
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
    if (bytes > MAXIM_ADJUNT_XAT.veu - MARGE_VEU_BYTES) atura();
  };
  recorder.onerror = () => falla(errorAdjuntXat('gravacio'));
  recorder.onstop = () => {
    if (acabat) return;
    const fitxer = new Blob(chunks, { type: mimeType.split(';')[0] });
    if (!fitxer.size) { falla(errorAdjuntXat('gravacio-buida')); return; }
    acabat = true;
    neteja();
    resolve({ id: crypto.randomUUID(), fitxer, tipus: 'veu', duradaMs: Math.max(1, Date.now() - inici) });
  };
  signal?.addEventListener('abort', cancella, { once: true });
  try { recorder.start(1000); } catch (error) { falla(errorDelMicro(error)); }
  return { atura, cancella, resultat };
}
