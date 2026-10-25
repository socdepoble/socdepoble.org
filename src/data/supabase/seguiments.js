/* T6b (IDEA-14; decisió del Mestre, 261024) · «Connectar / Seguir»: el
   seguiment d'un sol sentit d'una persona o d'una entitat, capacitat
   'seguiments' (contracte.js). Les RPC de
   supabase/migrations/2610241430_seguiments.sql:
   · segueix, deixa_de_seguir i estat_seguiment (p_tipus, p_id), que tornen
     JSON; els_meus_seguiments() i qui_em_segueix(p_org_id), que tornen files.
     Cap permís de taula: el client no toca public.seguiments.
   · Ids: en remot, un UUID (el del servidor); un altre text és SDP-SEG-001
     abans de cap xarxa, com els bloquejos de moderacio.js.
   · Sense sessió en remot, les lectures tornen el buit sense cap petició i
     les escriptures, SDP-SEG-000.
   · Errors: tot el que ix d'ací porta un `code` de MISSATGES_SEGUIMENTS. Sense
     la migració aplicada, rpc() torna un 404 i ací és NO-DISPONIBLE. Cap codi
     SDP-SEG no viatja amb un 404 (la migració ho evita a posta).
   · Seed i local: localSeguiments.js fa de servidor, amb els bloquejos que
     la moderació local coneix de qui crida (llistaBloquejos, el mateix mode).
   · Correccions 261024 (Codex D-07.1, R2-01, R2-04, R4-01): deixar de seguir
     és un esborrat suau al servidor, segueix torna `primer` (nou = primer) i
     el bloqueig de l'altra banda és a l'ombra; res d'això canvia les
     crides, només la forma de segueix.
   · IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · Connectar
     des d'una entitat (2610250100_seguiments_des_d_entitat.sql): `com` (al
     mateix objecte que el seguit) viatja com a p_com, NOMÉS quan hi és, amb
     la mateixa regla d'id (comDelContracte, i en remot un UUID: si no,
     SDP-SEG-001 abans de cap xarxa). Sense `com`, el cos és el de sempre.
     Si no l'administres, el servidor diu SDP-SEG-007, que es llig pel prefix
     com els altres. qui_em_segueix porta seguidor_tipus; un servidor sense
     la migració no el dona, i la fila és d'una persona (totes ho eren).
   La comprovació de mode és explícita (no `!== 'remote'`), com moderacio.js:
   una configuració sense mode és remota. El `signal` de la configuració
   arriba sempre a fetch (rpc() el pren de les opcions, el 4t argument). */
import { getCurrentUser, getResolvedConfig, rpc } from './runtime.js';
import { getDefaultUserId } from '../identitat.js';
import { MISSATGES_SEGUIMENTS, TIPUS_SEGUIT, comDelContracte, errorDeSeguiment, seguitDelContracte } from '../contracte.js';
import { llistaBloquejos } from './moderacio.js';

const MODES_LOCALS = new Set(['seed', 'local']);
const esModeLocal = (config) => MODES_LOCALS.has(getResolvedConfig(config).runtimeDataMode);
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_CODI_SEG = /SDP-SEG-\d{3}/;
const signalDe = (config) => config?.signal;

async function seguimentsLocals() {
  const { localSeguiments } = await import('../localSeguiments.js');
  return localSeguiments;
}

/* Qui crida en seed i local (la sessió o el convidat, com la moderació local)
   i els bloquejos que ha posat; sense la moderació local, cap. */
async function contextLocal(config) {
  const usuari = getCurrentUser();
  const bloquejos = await llistaBloquejos(config).catch(() => []);
  return { usuari, qui: usuari?.id || getDefaultUserId(), bloquejos: Array.isArray(bloquejos) ? bloquejos : [] };
}

/* El cos JSON de «Supabase NNN: {…}» (runtime.request), o null: PostgREST hi
   posa { code, message, details, hint }. Còpia de moderacio.js, que no
   l'exporta. */
function cosDePostgrest(error) {
  try {
    const cos = JSON.parse(String(error?.message ?? '').replace(/^Supabase\s+\d+:\s*/, ''));
    return cos && typeof cos === 'object' ? cos : null;
  } catch { return null; }
}

/**
 * L'error traduït a MISSATGES_SEGUIMENTS, o l'original si no es tradueix (una
 * cancel·lació, un temps esgotat, o un que ja porta el seu code). Un 403 no és
 * «cal entrar»: només el 401 i SDP-SEG-000 ho són.
 */
function traduix(error) {
  if (!error || typeof error !== 'object' || error.name === 'AbortError' || error.name === 'TimeoutError') return error;
  if (Object.hasOwn(MISSATGES_SEGUIMENTS, error.code)) return error;
  const cos = cosDePostgrest(error);
  const missatge = String(cos?.message ?? error.message ?? '');
  const codiPg = String(cos?.code ?? '');
  const prefix = RE_CODI_SEG.exec(missatge)?.[0];
  let code = 'DESCONEGUT';
  if (prefix && Object.hasOwn(MISSATGES_SEGUIMENTS, prefix)) code = prefix;
  else if (error.status === 401) code = 'SDP-SEG-000';
  else if (error.status === 429) code = 'SDP-SEG-006';
  else if (['22P02', '23514'].includes(codiPg)) code = 'SDP-SEG-001';
  else if (codiPg === '23503') code = 'SDP-SEG-002';
  else if (error.status === 404 || /PGRST20[25]/.test(missatge)) code = 'NO-DISPONIBLE';
  const traduit = errorDeSeguiment(code, error);
  if (error.status !== undefined) traduit.status = error.status;
  /* CODI_BACKEND_INABASTABLE (sense xarxa) es conserva: la vista el llig. */
  if (error.codi) traduit.codi = error.codi;
  return traduit;
}

/* El seguit del contracte i, en remot, amb un id del servidor. */
function seguitRemot(dades) {
  const seguit = seguitDelContracte(dades);
  if (!RE_UUID.test(seguit.id)) throw errorDeSeguiment('SDP-SEG-001');
  return seguit;
}
/* IDEA-22 · L'entitat amb què es connecta, en remot amb un id del servidor (o null). */
function comRemot(com) {
  if (com !== null && !RE_UUID.test(com)) throw errorDeSeguiment('SDP-SEG-001');
  return com;
}
/* El cos de segueix, deixa_de_seguir i estat_seguiment: p_com només amb `com`. */
const cosDelSeguit = ({ tipus, id }, com) => (com ? { p_tipus: tipus, p_id: id, p_com: com } : { p_tipus: tipus, p_id: id });
const cridaRpc = (nom, cos, config) => rpc(nom, cos, config, { signal: signalDe(config) }).catch((error) => { throw traduix(error); });
const unaFila = (resposta) => (Array.isArray(resposta) ? resposta[0] : resposta);
const textONull = (valor) => (typeof valor === 'string' && valor.trim() ? valor : null);

/**
 * Seguix una persona o una entitat ({ tipus, id, com? }; amb `com`, com eixa
 * entitat, que has d'administrar: si no, SDP-SEG-007). Idempotent: si ja la
 * seguies, { seguint: true, creatAl, nou: false, primer: false } amb la data
 * d'aleshores. `primer` és true NOMÉS la primera vegada de totes que la
 * parella se seguix (el servidor no hi tenia cap fila); tornar a seguir
 * després de deixar-ho dona false. `nou` es conserva per compatibilitat i val
 * el mateix que `primer`: una resposta sense `primer` no avisa ningú.
 */
export async function segueix(dades = {}, config = {}) {
  const seguit = seguitDelContracte(dades);
  const com = comDelContracte(dades);
  if (esModeLocal(config)) return (await seguimentsLocals()).segueix({ ...seguit, com }, await contextLocal(config));
  if (!getCurrentUser()?.id) throw errorDeSeguiment('SDP-SEG-000');
  const cos = cosDelSeguit(seguitRemot(seguit), comRemot(com));
  const fila = unaFila(await cridaRpc('segueix', cos, config));
  const primer = fila?.primer === true;
  return { seguint: true, creatAl: fila?.creat_al ?? null, nou: primer, primer };
}

/**
 * Deixa de seguir ({ tipus, id, com? }; amb `com`, el de l'entitat, per a
 * qualsevol que l'administra). Idempotent: { seguint: false } també si no la seguies.
 */
export async function deixaDeSeguir(dades = {}, config = {}) {
  const seguit = seguitDelContracte(dades);
  const com = comDelContracte(dades);
  if (esModeLocal(config)) return (await seguimentsLocals()).deixaDeSeguir({ ...seguit, com }, await contextLocal(config));
  if (!getCurrentUser()?.id) throw errorDeSeguiment('SDP-SEG-000');
  await cridaRpc('deixa_de_seguir', cosDelSeguit(seguitRemot(seguit), comRemot(com)), config);
  return { seguint: false };
}

/**
 * Si qui crida (o, amb `com`, l'entitat que administra) seguix ({ tipus, id })
 * ara. Sense sessió en remot, { seguint: false, creatAl: null } i cap petició.
 */
export async function estatSeguiment(dades = {}, config = {}) {
  const seguit = seguitDelContracte(dades);
  const com = comDelContracte(dades);
  if (esModeLocal(config)) return (await seguimentsLocals()).estatSeguiment({ ...seguit, com }, await contextLocal(config));
  if (!getCurrentUser()?.id) return { seguint: false, creatAl: null };
  const fila = unaFila(await cridaRpc('estat_seguiment', cosDelSeguit(seguitRemot(seguit), comRemot(com)), config));
  return { seguint: fila?.seguint === true, creatAl: fila?.seguint === true ? fila?.creat_al ?? null : null };
}

/** A qui seguix qui crida: [{ tipus, id, nom, creatAl }], la més nova primer. Sense sessió en remot, []. */
export async function elsMeusSeguiments(config = {}) {
  if (esModeLocal(config)) return (await seguimentsLocals()).elsMeusSeguiments(await contextLocal(config));
  if (!getCurrentUser()?.id) return [];
  const files = await cridaRpc('els_meus_seguiments', {}, config);
  return (Array.isArray(files) ? files : [])
    .filter((fila) => TIPUS_SEGUIT.includes(fila?.tipus) && fila?.id)
    .map((fila) => ({ tipus: fila.tipus, id: String(fila.id), nom: textONull(fila.nom), creatAl: fila.creat_al ?? null }));
}

/**
 * Qui seguix qui crida (sense orgId) o l'entitat orgId (només per a qui
 * l'administra; si no, SDP-SEG-005): [{ tipus, id, nom, creatAl }], la més
 * nova primer. IDEA-22 · `tipus` és el de qui seguix (seguidor_tipus): d'una
 * entitat, id i nom són els seus; sense seguidor_tipus (un servidor sense
 * 2610250100), 'persona'. Sense sessió en remot, [].
 */
export async function quiEmSegueix(opcions = {}, config = {}) {
  const orgId = opcions?.orgId ?? null;
  const ambEntitat = orgId !== null && orgId !== '';
  const entitat = ambEntitat ? seguitDelContracte({ tipus: 'entitat', id: orgId }).id : null;
  if (esModeLocal(config)) return (await seguimentsLocals()).quiEmSegueix({ orgId: entitat }, await contextLocal(config));
  if (!getCurrentUser()?.id) return [];
  if (entitat && !RE_UUID.test(entitat)) throw errorDeSeguiment('SDP-SEG-001');
  const files = await cridaRpc('qui_em_segueix', { p_org_id: entitat }, config);
  return (Array.isArray(files) ? files : [])
    .map((fila) => ({ fila, tipus: fila?.seguidor_tipus ?? 'persona' }))
    .filter(({ fila, tipus }) => fila?.id && TIPUS_SEGUIT.includes(tipus))
    .map(({ fila, tipus }) => ({ tipus, id: String(fila.id), nom: textONull(fila.nom), creatAl: fila.creat_al ?? null }));
}
