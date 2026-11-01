/**
 * mitjansLocal.js — Els mitjans de l'adaptador local (T1 · D01): capacitats
 * 'mitjans' i 'mitjansPropis'.
 *
 * Un magatzem en memòria per instància amb les regles de pujada de
 * supabase/storage.js (sessió, poble, carpeta, formats, 25 MiB al bucket
 * privat 'notes' i 5 MiB al públic) i les mateixes referències opaques
 * 'sdp-media://<bucket>/<poble>/<uid>/<carpeta>/<fitxer>'. resolveAsset les
 * torna com a URL data: (memoritzades per referència); una referència privada
 * només la resol qui l'ha pujada, com la signatura amb la RLS del servidor.
 * La promoció copia al bucket públic sense esborrar l'original (C17).
 *
 * La biblioteca de fotos ('mitjansPropis') és la del contracte en local: la
 * llista és buida i esborrar rebutja amb 'no-disponible'.
 */
import { CODI_SEGON_FACTOR } from '../errorsBackend.js';

const PREFIX = 'sdp-media://';
const BUCKET_PUBLIC = 'mitjans';
const BUCKET_PRIVAT = 'mitjans_privats';
/* Límits per fitxer (ARQ-G07, storage.js). */
const MIDA_MAX_PRIVADA = 26214400;
const MIDA_MAX_PUBLICA = 5242880;
const EXTENSIONS = Object.freeze({ 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'application/pdf': 'pdf' });
const RE_CARPETA = /^[a-z0-9_-]{1,40}$/;
/* storage.js · segmentNet i camiNet: cap segment pot moure la URL. */
const CARACTER_QUE_MOU_LA_URL = /[%?#\\\u0000-\u001f\u007f]/;
const segmentNet = (segment) => segment !== '' && segment !== '.' && segment !== '..' && !CARACTER_QUE_MOU_LA_URL.test(segment);
const camiNet = (cami) => !cami.endsWith(' ') && cami.split('/').every(segmentNet);
/* Un identificador que cap dins d'un segment de la ruta (l'uid de la persona pilot no és cap UUID). */
const esSegmentDeRuta = (valor) => typeof valor === 'string' && valor.length <= 200 && !valor.includes('/') && segmentNet(valor);
const TROS_BASE64 = 0x8000;

/* El bucket i el camí d'una referència opaca, o null si no ho és o no és neta. */
function delaRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith(PREFIX)) return null;
  const resta = ref.slice(PREFIX.length);
  const tall = resta.indexOf('/');
  if (tall === -1) return null;
  const bucket = resta.slice(0, tall);
  const cami = resta.slice(tall + 1);
  return segmentNet(bucket) && camiNet(cami) ? { bucket, cami } : null;
}

async function urlDeDades(blob, tipus) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binari = '';
  for (let i = 0; i < bytes.length; i += TROS_BASE64) binari += String.fromCharCode(...bytes.subarray(i, i + TROS_BASE64));
  return `data:${tipus};base64,${btoa(binari)}`;
}

export function creaMitjansLocal(e) {
  /* ref → { blob, tipus, propietari } */
  const objectes = new Map();
  /* ref → URL data: ja calculada */
  const urls = new Map();
  e.alTancar(() => { objectes.clear(); urls.clear(); });

  const urlDe = async (ref) => {
    if (!urls.has(ref)) {
      const objecte = objectes.get(ref);
      const url = await urlDeDades(objecte.blob, objecte.tipus);
      // No ressuscita la memòria cau si destroy ha buidat el magatzem.
      if (objectes.get(ref) !== objecte) return ref;
      urls.set(ref, url);
    }
    return urls.get(ref);
  };
  /* Un objecte privat és només de qui l'ha pujat. */
  const visible = (ref, bucket) => objectes.has(ref)
    && (bucket !== BUCKET_PRIVAT || objectes.get(ref).propietari === String(e.usuari()?.id ?? ''));

  return {
    async uploadToStorage(fitxer, opcions = {}) {
      const usuari = e.usuari();
      if (!usuari?.id) throw new Error('Cal iniciar sessió');
      const { carpeta = 'general', tenantId } = opcions ?? {};
      const poble = e.configuracio.tenantId;
      if (tenantId && String(tenantId).toLowerCase() !== poble) throw new Error('Poble inconsistent');
      const uid = String(usuari.id);
      if (!esSegmentDeRuta(uid)) throw new Error('Poble o usuari invàlid');
      if (typeof carpeta !== 'string' || !RE_CARPETA.test(carpeta)) throw new Error('Carpeta invàlida');
      const privat = carpeta === 'notes';
      if (!(fitxer instanceof Blob) || !EXTENSIONS[fitxer.type] || (!privat && fitxer.type === 'application/pdf')) {
        throw new Error('Format de fitxer no admés en este destí');
      }
      if (!fitxer.size || fitxer.size > (privat ? MIDA_MAX_PRIVADA : MIDA_MAX_PUBLICA)) throw new Error('Mida de fitxer no admesa');
      const bucket = privat ? BUCKET_PRIVAT : BUCKET_PUBLIC;
      const ruta = `${poble}/${uid.toLowerCase()}/${carpeta}/${e.nouId()}.${EXTENSIONS[fitxer.type]}`;
      const ref = `${PREFIX}${bucket}/${ruta}`;
      objectes.set(ref, { blob: fitxer, tipus: fitxer.type, propietari: uid });
      return { url: ref, ruta };
    },

    /* La URL pública d'un objecte del bucket públic (data:), o la referència
       opaca: un bucket privat no té URL pública. */
    async getPublicUrl(bucket, path) {
      if (typeof bucket !== 'string' || !segmentNet(bucket) || typeof path !== 'string' || !camiNet(path)) {
        throw new TypeError('Bucket o camí invàlid.');
      }
      const ref = `${PREFIX}${bucket}/${path}`;
      return bucket === BUCKET_PUBLIC && objectes.has(ref) ? urlDe(ref) : ref;
    },

    /* Una URL externa o un valor que no és una referència es tornen tal qual;
       una referència que este node no té (o que no és teua, si és privada),
       també: les peces que la pinten descarten el que torna encara opac. */
    async resolveAsset(ref) {
      const parts = delaRef(ref);
      if (!parts || !visible(ref, parts.bucket)) return ref;
      const uid = e.usuari()?.id;
      const url = await urlDe(ref);
      // La identitat pot canviar durant blob.arrayBuffer(). Revalida en acabar.
      return visible(ref, parts.bucket)
        && (parts.bucket !== BUCKET_PRIVAT || e.usuari()?.id === uid) ? url : ref;
    },

    async promoteToPublic(ref) {
      if (typeof ref !== 'string' || !ref.startsWith(`${PREFIX}${BUCKET_PRIVAT}/`)) return ref;
      const parts = delaRef(ref);
      if (!parts || !visible(ref, BUCKET_PRIVAT)) return ref;
      const publica = `${PREFIX}${BUCKET_PUBLIC}/${parts.cami}`;
      if (!objectes.has(publica)) objectes.set(publica, { ...objectes.get(ref) });
      return publica;
    },

    async llistaElsMeusMitjans() {
      return [];
    },

    async esborraElMeuMitja() {
      throw Object.assign(new Error('No s’ha pogut esborrar la foto: en este mode no hi ha cap servidor de fitxers.'),
        { codi: CODI_SEGON_FACTOR.NO_DISPONIBLE, code: CODI_SEGON_FACTOR.NO_DISPONIBLE });
    }
  };
}
