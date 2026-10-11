/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
   poble que desa el superadmin: capacitat 'personalitzacio' (contracte.js).
   Dues claus d'app_content, 'taxonomia' i 'estil', amb versió.
   · Escriptura: les RPC admin_desa_contingut(p_clau, p_payload, p_versio,
     p_tenant_id) i admin_historial_contingut(p_clau, p_tenant_id), SECURITY
     DEFINER darrere de private.es_superadmin(), que exigix aal2 (migració
     2610061448). El 42501 amb «SDP-ADMIN» al missatge es traduïx a
     'cal-segon-factor'; un «SDP-ADMIN-006» (la versió que s'editava ja no és
     l'última), a 'conflicte-versio'. Forma esperada de la fila que tornen:
     { key, payload, version, created_at, author }. MIGRACIÓ PENDENT: les
     RPC encara no són al repositori (tasca del servidor, fora d'este front);
     sense elles, rpc() torna 404 i ací és 'no-disponible'.
   · Lectura: loadCoreContent (content.js) torna el camp additiu
     `personalitzacio` a partir de les files d'app_content (remot) o d'este
     magatzem (seed, local), amb personalitzacioDeFiles i personalitzacioLocal.
   · Seed i local: un magatzem en memòria del mòdul (Map per clau) amb versions
     i historial, perquè el Tauler es puga provar en desenvolupament sense
     servidor. Es perd en recarregar, a posta.
   La comprovació de mode és explícita (no `!== 'remote'`), com content.js i
   auth.js: una configuració sense mode és remota. */
import { getCurrentUser, getResolvedConfig, rpc } from './runtime.js';
import { CODI_PERSONALITZACIO, ambCodi, errorDePersonalitzacio } from '../errorsBackend.js';

export const CLAUS_PERSONALITZACIO = Object.freeze(['taxonomia', 'estil']);
const MODES_LOCALS = new Set(['seed', 'local']);
const esModeLocal = (resolt) => MODES_LOCALS.has(resolt.runtimeDataMode);

/* ── El magatzem en memòria (seed i local) ── */
const magatzem = new Map();   // clau → { actual: { payload, versio }, historial: [{ versio, payload, creat, autor }] }
const copia = (valor) => (valor === undefined ? undefined : structuredClone(valor));

/** Buida el magatzem en memòria (proves). */
export function reiniciaPersonalitzacioLocal() { magatzem.clear(); }

/** El camp `personalitzacio` de loadCoreContent en seed o local: el que tinga el magatzem, o null per clau. */
export function personalitzacioLocal() {
  return Object.fromEntries(CLAUS_PERSONALITZACIO.map((clau) => {
    const actual = magatzem.get(clau)?.actual;
    return [clau, actual ? { payload: copia(actual.payload), versio: actual.versio } : null];
  }));
}

/**
 * El camp `personalitzacio` de loadCoreContent a partir de les files
 * d'app_content ({ key, payload, version }): { payload, versio } per a cada
 * clau present amb payload, o null. Pura.
 */
export function personalitzacioDeFiles(rows) {
  const files = Array.isArray(rows) ? rows : [];
  return Object.fromEntries(CLAUS_PERSONALITZACIO.map((clau) => {
    const fila = files.find((row) => row?.key === clau);
    if (!fila || fila.payload === null || fila.payload === undefined) return [clau, null];
    const versio = Number(fila.version);
    return [clau, { payload: fila.payload, versio: Number.isFinite(versio) ? versio : 0 }];
  }));
}

/* ── Errors ── */
const clauValida = (clau) => {
  const nom = String(clau ?? '').trim();
  if (!CLAUS_PERSONALITZACIO.includes(nom)) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.CLAU_INVALIDA);
  return nom;
};
const usuariDeLaSessio = () => {
  const user = getCurrentUser();
  if (!user?.id) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.SENSE_SESSIO);
  return user;
};
const versioEsperada = (versio) => (versio === null || versio === undefined ? null : Number(versio));

/* El cos JSON de «Supabase NNN: {…}» (runtime.request), o null: PostgREST hi
   posa { code, message, details, hint }. */
function cosDePostgrest(error) {
  try {
    const cos = JSON.parse(String(error?.message ?? '').replace(/^Supabase\s+\d+:\s*/, ''));
    return cos && typeof cos === 'object' ? cos : null;
  } catch { return null; }
}

/** L'error traduït a CODI_PERSONALITZACIO, o l'original si no es tradueix (AbortError). */
function traduixErrorDePersonalitzacio(error) {
  if (!error || typeof error !== 'object' || error.name === 'AbortError') return error;
  if (Object.values(CODI_PERSONALITZACIO).includes(error.code)) return error;
  const cos = cosDePostgrest(error);
  const missatge = String(cos?.message ?? error.message ?? '');
  const codiPg = String(cos?.code ?? '');
  let code = CODI_PERSONALITZACIO.DESCONEGUT;
  if (/SDP-ADMIN-006/.test(missatge)) code = CODI_PERSONALITZACIO.CONFLICTE_VERSIO;
  else if ((codiPg === '42501' || error.status === 403) && /SDP-ADMIN/.test(missatge)) code = CODI_PERSONALITZACIO.CAL_SEGON_FACTOR;
  else if (error.status === 404) code = CODI_PERSONALITZACIO.NO_DISPONIBLE;   // rpc(): l'esquema no està aplicat
  else if (error.status === 401) code = CODI_PERSONALITZACIO.SENSE_SESSIO;
  const traduit = errorDePersonalitzacio(code, error);
  if (error.status !== undefined) traduit.status = error.status;
  return traduit;
}

/* Un registre de l'historial com el torna la RPC ({ version, payload, created_at, author }), en la forma del contracte. */
const registreDelContracte = (fila) => ({
  versio: Number(fila?.version ?? fila?.versio) || 0,
  payload: fila?.payload ?? null,
  creat: fila?.created_at ?? fila?.creat ?? null,
  autor: fila?.author ?? fila?.autor ?? fila?.author_id ?? null
});

function tenantDe(config) {
  const resolt = getResolvedConfig(config);
  if (!resolt.tenantId) throw ambCodi(new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).'), CODI_PERSONALITZACIO.DESCONEGUT);
  return resolt.tenantId;
}

/**
 * Desa una versió nova de la clau. `versio` és la que s'editava (null o 0 si
 * no n'hi havia): si l'última ja no és eixa, 'conflicte-versio'. Torna
 * { clau, payload, versio } amb la versió NOVA. Sense sessió, 'sense-sessio';
 * sense aal2, el servidor respon i ací és 'cal-segon-factor'.
 */
export async function adminDesaPersonalitzacio({ clau, payload, versio } = {}, config = {}) {
  const nom = clauValida(clau);
  const user = usuariDeLaSessio();
  if (payload === undefined || payload === null || typeof payload !== 'object') {
    throw errorDePersonalitzacio(CODI_PERSONALITZACIO.DESCONEGUT);
  }
  const resolt = getResolvedConfig(config);
  const esperada = versioEsperada(versio);
  if (esModeLocal(resolt)) {
    const entrada = magatzem.get(nom) || { actual: null, historial: [] };
    const actual = entrada.actual?.versio ?? 0;
    if (esperada !== null && esperada !== actual) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.CONFLICTE_VERSIO);
    const nova = { payload: copia(payload), versio: actual + 1 };
    entrada.actual = nova;
    entrada.historial.push({ versio: nova.versio, payload: copia(payload), creat: new Date().toISOString(), autor: String(user.id) });
    magatzem.set(nom, entrada);
    return { clau: nom, payload: copia(nova.payload), versio: nova.versio };
  }
  const tenantId = tenantDe(config);
  const files = await rpc('admin_desa_contingut', { p_clau: nom, p_payload: payload, p_versio: esperada, p_tenant_id: tenantId }, config)
    .catch((error) => { throw traduixErrorDePersonalitzacio(error); });
  const fila = Array.isArray(files) ? files[0] : files;
  const versioNova = Number(fila?.version ?? fila?.versio);
  if (!Number.isFinite(versioNova)) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.DESCONEGUT);
  return { clau: nom, payload: fila?.payload ?? payload, versio: versioNova };
}

/** Les versions desades d'una clau, de més nova a més vella: [{ versio, payload, creat, autor }]. */
export async function adminHistorialPersonalitzacio(clau, config = {}) {
  const nom = clauValida(clau);
  usuariDeLaSessio();
  const resolt = getResolvedConfig(config);
  if (esModeLocal(resolt)) {
    return [...(magatzem.get(nom)?.historial ?? [])].reverse().map((registre) => ({ ...registre, payload: copia(registre.payload) }));
  }
  const tenantId = tenantDe(config);
  const files = await rpc('admin_historial_contingut', { p_clau: nom, p_tenant_id: tenantId }, config)
    .catch((error) => { throw traduixErrorDePersonalitzacio(error); });
  return (Array.isArray(files) ? files : []).map(registreDelContracte);
}
