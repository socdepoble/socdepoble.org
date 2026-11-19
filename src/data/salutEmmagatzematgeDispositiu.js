/** IDEA-278: lectura local, sense backend ni dependència d'interfície.
 * JARVIS és només diagnòstic, també amb un manifest SHA-256 confirmat.
 * No conté cap primitiva de supressió ni escriu rebuts de neteja.
 * Mai obri bases de notes, esborranys, E2EE ni còpies de seguretat.
 * Els bytes del cos eliminat són mesurables; l'espai físic recuperat no ho és.
 */
import { creaMagatzemIdb } from '../utils/magatzemLocal.js';

const RETIRADES = Object.freeze(['sdp-pwa-recursos-v0', 'sdp-pwa-closca-v0']);
const MAX_ENTRADES = 1500;
const MAX_BYTES = 48 * 1024 * 1024;
/* R32.2 · Zero ReDoS: les dues classes del patró d'asset accepten «-» i, sense sostre, una clau
   de cache desmesurada retrocedix en temps quadràtic (64.000 caràcters: 5,6 s de fil principal).
   Els noms d'asset amb hash de Vite són molt més curts: una ruta més llarga mai és regenerable. */
const MAX_RUTA_ASSET = 256;
export const BLOQUEIG_PURGA_MEMORIA_CAU = 'sdp:salut:purga-regenerable:v1';
const LOCK = BLOQUEIG_PURGA_MEMORIA_CAU;
const byteValid = (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const errorCodi = (codi, cause) => Object.assign(new Error(codi, { cause }), { codi });
function avortat(signal) { if (signal?.aborted) throw signal.reason ?? errorCodi('AVORTAT'); }
function esRecursPublic(peticio, origen) {
  try {
    const u = new URL(peticio.url);
    return peticio.method === 'GET' && u.origin === origen && !u.search && !u.hash
      && !peticio.headers.has('authorization') && !peticio.headers.has('range')
      && u.pathname.length <= MAX_RUTA_ASSET
      && /^\/assets\/[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]{8,}\.(?:js|css|woff2)$/.test(u.pathname);
  } catch { return false; }
}
function recursosConfirmats(manifest, origen) {
  if (manifest == null) return new Map();
  if (manifest.esquema !== 'sdp.cache-regenerable.v1' || manifest.bloqueig !== LOCK
    || !Array.isArray(manifest.recursos) || manifest.recursos.length > MAX_ENTRADES) throw errorCodi('MANIFEST_NO_VALID');
  const recursos = new Map();
  for (const r of manifest.recursos) {
    if (!r || typeof r.url !== 'string' || !esRecursPublic(new Request(r.url), origen)
      || !byteValid(r.bytes) || r.bytes > MAX_BYTES || !/^[a-f0-9]{64}$/.test(r.sha256 ?? '')
      || recursos.has(r.url)) throw errorCodi('MANIFEST_NO_VALID');
    recursos.set(r.url, Object.freeze({ bytes: r.bytes, sha256: r.sha256 }));
  }
  return recursos;
}
function mimePublic(resposta, peticio) {
  if (!peticio || resposta.headers.has('set-cookie') || resposta.headers.has('authorization')) return false;
  const mime = (resposta.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const ruta = new URL(peticio.url).pathname;
  if (ruta.endsWith('.js')) return ['text/javascript', 'application/javascript'].includes(mime);
  if (ruta.endsWith('.css')) return mime === 'text/css';
  return ruta.endsWith('.woff2') && mime === 'font/woff2';
}
async function mesuraCos(resposta, signal, peticio) {
  if (!resposta || resposta.type === 'opaque' || resposta.status !== 200 || !mimePublic(resposta, peticio)
    || /(?:private|no-store)/i.test(resposta.headers.get('cache-control') ?? '')) return null;
  const reader = resposta.body?.getReader?.();
  if (!reader) return null;
  let bytes = 0; const fragments = [];
  try {
    while (true) {
      avortat(signal);
      const tros = await new Promise((resolve, reject) => {
        const cancela = () => {
          reader.cancel().catch(() => {});
          reject(signal.reason ?? errorCodi('AVORTAT'));
        };
        signal?.addEventListener('abort', cancela, { once: true });
        reader.read().then(resolve, reject).finally(() => signal?.removeEventListener('abort', cancela));
        if (signal?.aborted) cancela();
      });
      avortat(signal);
      if (tros.done) {
        if (!globalThis.crypto?.subtle?.digest) return null;
        const cos = new Uint8Array(bytes); let offset = 0;
        for (const fragment of fragments) { cos.set(fragment, offset); offset += fragment.byteLength; }
        const digest = await globalThis.crypto.subtle.digest('SHA-256', cos);
        avortat(signal);
        const sha256 = [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, '0')).join('');
        return { bytes, sha256 };
      }
      bytes += tros.value.byteLength;
      if (bytes > MAX_BYTES) return null;
      fragments.push(tros.value.slice());
    }
  } finally {
    // Cancel·la i allibera el lector sense esperar un productor que no resol cancel().
    try { reader.cancel().catch(() => {}); } finally { reader.releaseLock(); }
  }
}
function historialPerDefecte(navegador) {
  return creaMagatzemIdb({
    nom: 'sdp-salut-emmagatzematge', versio: 1, navegador,
    stores: { historial: { clau: 'id' } },
    llistaBlanca: { historial: ['id', 'data', 'bytesEliminats', 'bytesAlliberats', 'entradesEliminades'] }
  });
}
export function creaServeiSalutEmmagatzematgeDispositiu({
  navegador = globalThis.navigator, memories = globalThis.caches,
  origen = globalThis.location?.origin, magatzemHistorial, manifestRegenerable = null
} = {}) {
  // El manifest només acredita el diagnòstic; mai concedix capacitat de supressió.

  const confirmats = recursosConfirmats(manifestRegenerable, origen);
  let historial;
  const magatzem = () => (historial ??= magatzemHistorial ?? historialPerDefecte(navegador));
  async function estimacio() {
    let usage = null; let quota = null; let persistent = null;
    const avisos = [];
    try {
      if (typeof navegador?.storage?.estimate === 'function') {
        const r = await navegador.storage.estimate();
        usage = byteValid(r?.usage) ? r.usage : null;
        quota = byteValid(r?.quota) ? r.quota : null;
      } else avisos.push('ESTIMACIO_NO_DISPONIBLE');
    } catch { avisos.push('ESTIMACIO_FALLIDA'); }
    try {
      if (typeof navegador?.storage?.persisted === 'function') {
        const p = await navegador.storage.persisted();
        persistent = typeof p === 'boolean' ? p : null;
      }
    } catch { avisos.push('PERSISTENCIA_DESCONEGUDA'); }
    return { usage, quota, persistent, avisos };
  }
  async function inventari({ signal } = {}) {
    const categories = [
      { id: 'claus-e2ee', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'esborranys-pendents', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'copies-sdpbackup', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'notes-locals', tipus: 'sagrada', bytes: null, purgable: false },
      { id: 'miniatures-sincronitzades', tipus: 'regenerable', bytes: null, purgable: false,
        motiu: 'CAP_PRODUCTOR_AMB_CONFIRMACIO_DE_SINCRONITZACIO' }
    ];
    const avisos = ['JARVIS_NOMES_DIAGNOSTIC'];
    if (confirmats.size === 0) avisos.push('CAP_PRODUCTOR_REGENERABLE_CONFIRMAT');
    if (typeof memories?.keys !== 'function' || !origen) return { categories, avisos: [...avisos, 'CACHE_NO_DISPONIBLE'] };
    avortat(signal);
    const noms = await memories.keys();
    for (const nom of RETIRADES.filter((n) => noms.includes(n))) {
      avortat(signal);
      // has() evita crear una cache absent amb open().
      if (typeof memories.has !== 'function' || !await memories.has(nom)) continue;
      const cache = await memories.open(nom);
      const claus = await cache.keys();
      if (claus.length > MAX_ENTRADES) { avisos.push('CACHE_MASSA_GRAN'); continue; }
      let bytes = 0; let completa = confirmats.size > 0; const recursos = [];
      for (const clau of claus) {
        avortat(signal);
        if (!esRecursPublic(clau, origen)) { completa = false; continue; }
        const mida = await mesuraCos(await cache.match(clau), signal, clau);
        if (mida === null || bytes + mida.bytes > MAX_BYTES) { completa = false; continue; }
        bytes += mida.bytes;
        const confirmat = confirmats.get(clau.url);
        if (!confirmat || confirmat.bytes !== mida.bytes || confirmat.sha256 !== mida.sha256) { completa = false; continue; }
        recursos.push({ clau, bytes: mida.bytes, sha256: mida.sha256 });
      }
      categories.push({ id: nom, tipus: 'regenerable', bytes, purgable: false,
        verificat: completa, motiu: 'JARVIS_NOMES_DIAGNOSTIC',
        mesura: 'bytes-del-cos', entrades: recursos.length });
      if (!completa) avisos.push('CACHE_AMB_DADES_NO_VERIFICADES');
    }
    return { categories, avisos };
  }
  async function historialNetegesLocals() {
    const m = magatzem();
    const registres = await m.totes('historial');
    return { registres, persistent: (await m.estatPersistencia()).persistent };
  }
  async function lligSalutEmmagatzematgeDispositiu(opcions = {}) {
    const e = await estimacio();
    try {
      const { categories, avisos } = await inventari(opcions);
      return { ...e, categories, avisos: [...e.avisos, ...avisos] };
    } catch (error) {
      avortat(opcions.signal);
      return { ...e, categories: [], avisos: [...e.avisos, 'INVENTARI_FALLIT'], error: { codi: error.codi ?? 'LECTURA_CACHE' } };
    }
  }
  /** Compatibilitat amb consumidors anteriors: únicament retorna el diagnòstic.
   * Una futura neteja humana haurà de viure en una eina separada i explícita;
   * cap manifest ni bandera pot activar una supressió en este satèl·lit.
   */
  async function purgaMemoriaCauRegenerable({ signal } = {}) {
    avortat(signal);
    const { avisos } = await inventari({ signal });
    avortat(signal);
    return { estat: 'bloquejat', bytesEliminats: 0, bytesAlliberats: null,
      entradesEliminades: 0, historialDesat: null, historialPersistent: null, avisos };
  }
  return { lligSalutEmmagatzematgeDispositiu, purgaMemoriaCauRegenerable, historialNetegesLocals,
    tanca: () => historial?.tanca() };
}
let servei;
const perDefecte = () => (servei ??= creaServeiSalutEmmagatzematgeDispositiu());
export const lligSalutEmmagatzematgeDispositiu = (opcions) => perDefecte().lligSalutEmmagatzematgeDispositiu(opcions);
export const purgaMemoriaCauRegenerable = (opcions) => perDefecte().purgaMemoriaCauRegenerable(opcions);
export const historialNetegesLocals = () => perDefecte().historialNetegesLocals();
