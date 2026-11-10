/**
 * resumSessionsDispositius.js — R13-C7 (ordre del Mestre, 08-11-2026) · Les dades del panell «👥 Usuaris,
 * Dispositius i Botigues» de l'Administració del sistema: quantes persones distintes tenen una sessió
 * activa per camí (app d'iPhone i iPad, Safari d'iOS, app d'Android, navegador d'Android, escriptori i
 * altres) en 24 hores, 7 dies i 14 dies.
 *
 * La font és la RPC public.admin_resum_sessions_dispositius() de la migració MIGRACIO_RESUM_SESSIONS
 * (NO aplicada: l'aplica el Mestre). El servidor decidix qui la pot llegir (superadmin amb aal2) i torna
 * només recomptes; ací no es compta res: es valida la forma i es classifica l'error, perquè el panell
 * diga la causa real i no mostre mai una xifra que no vinga del servidor.
 *
 * R15 declara la capacitat opcional administracioSessions al contracte i al port.
 * El servidor continua sent l'autoritat: migració absent, rol insuficient o
 * node sense servidor mai es convertixen en recomptes zero.
 */

export const MIGRACIO_RESUM_SESSIONS = '2611082238_admin_resum_sessions_dispositius.sql';
export const METODE_RESUM_SESSIONS = 'adminResumSessionsDispositius';

/** Els camins, en l'ordre del panell i de la RPC. */
export const CAMINS_SESSIONS = Object.freeze(['app_ios', 'web_ios', 'app_android', 'web_android', 'escriptori', 'altres']);

export const CODI_RESUM_SESSIONS = Object.freeze({
  SENSE_PORT: 'sense-port',
  SENSE_SERVIDOR: 'sense-servidor',
  SENSE_MIGRACIO: 'sense-migracio',
  SENSE_PERMIS: 'sense-permis',
  RESPOSTA_INVALIDA: 'resposta-invalida',
  ERROR: 'error'
});

const CLAUS_ARREL = Object.freeze(['camins', 'consultat_a', 'total']);
const CLAUS_CAMI = Object.freeze(['cami', 'persones_14d', 'persones_24h', 'persones_7d']);
const CLAUS_TOTAL = Object.freeze(['persones_14d', 'persones_24h', 'persones_7d']);

/* Un error nou amb el codi (l'original va a `cause`: mai es muta, una DOMException no admet `code`). */
const ambCodi = (missatge, code, cause) => Object.assign(new Error(missatge, cause === undefined ? undefined : { cause }), { code });
const invalida = (motiu) => Object.assign(new TypeError(`Resposta del resum de sessions invàlida: ${motiu}.`), { code: CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA });
const esObjecte = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clausExactes = (obj, claus) => Object.keys(obj).sort().join(',') === claus.join(',');
const recompte = (v) => Number.isSafeInteger(v) && v >= 0;

/* Les tres finestres d'un camí o del total: enters no negatius i creixents (24 h ≤ 7 dies ≤ 14 dies). */
function finestres(fila, on) {
  const [p24, p7, p14] = [fila.persones_24h, fila.persones_7d, fila.persones_14d];
  if (![p24, p7, p14].every(recompte)) throw invalida(`${on} sense recomptes enters`);
  if (p24 > p7 || p7 > p14) throw invalida(`${on} amb finestres que decreixen`);
  return { persones24h: p24, persones7d: p7, persones14d: p14 };
}

/**
 * La resposta de la RPC, validada i en l'ordre de CAMINS_SESSIONS:
 * { consultatA, camins: [{ cami, persones24h, persones7d, persones14d }], total: { persones24h, persones7d, persones14d } }.
 * Claus tancades (cap camp de més pot portar una dada personal); cada camí una vegada; el total de
 * persones distintes no pot ser menor que cap camí ni major que la suma. Llança un TypeError amb
 * code RESPOSTA_INVALIDA.
 */
export function validaResumSessions(valor) {
  if (!esObjecte(valor) || !clausExactes(valor, CLAUS_ARREL)) throw invalida('claus de l’arrel');
  const instant = typeof valor.consultat_a === 'string' ? Date.parse(valor.consultat_a) : Number.NaN;
  if (Number.isNaN(instant)) throw invalida('sense l’hora de la consulta');
  if (!Array.isArray(valor.camins) || valor.camins.length !== CAMINS_SESSIONS.length) throw invalida('camins');
  const perCami = new Map();
  for (const fila of valor.camins) {
    if (!esObjecte(fila) || !clausExactes(fila, CLAUS_CAMI) || !CAMINS_SESSIONS.includes(fila.cami) || perCami.has(fila.cami)) throw invalida('un camí desconegut o repetit');
    perCami.set(fila.cami, { cami: fila.cami, ...finestres(fila, fila.cami) });
  }
  if (!esObjecte(valor.total) || !clausExactes(valor.total, CLAUS_TOTAL)) throw invalida('total');
  const total = finestres(valor.total, 'el total');
  const camins = CAMINS_SESSIONS.map((cami) => perCami.get(cami));
  for (const clau of ['persones24h', 'persones7d', 'persones14d']) {
    const xifres = camins.map((c) => c[clau]);
    if (total[clau] < Math.max(...xifres) || total[clau] > xifres.reduce((a, b) => a + b, 0)) throw invalida('el total no quadra amb els camins');
  }
  return { consultatA: new Date(instant).toISOString(), camins, total };
}

/* El cos JSON de «Supabase NNN: {…}» (runtime.request), si n'hi ha. */
function cosDelServidor(error) {
  try {
    const cos = JSON.parse(String(error?.message ?? '').replace(/^[A-Za-z]+\s+\d{3}:\s*/, ''));
    return esObjecte(cos) ? cos : null;
  } catch {
    return null;
  }
}

/**
 * La causa d'un error de la consulta: SENSE_SERVIDOR quan l'adaptador no té servidor configurat
 * ('no-disponible': mode local o de demostració), SENSE_MIGRACIO quan la funció no existix a la base
 * (404, PGRST202 o 42883), SENSE_PERMIS quan el servidor la refusa (401, 403 o 42501),
 * RESPOSTA_INVALIDA per a una forma que no és la de la RPC i ERROR per a la resta (xarxa, temps). Pur.
 */
export function codiDErrorResumSessions(error) {
  if (!error || typeof error !== 'object') return CODI_RESUM_SESSIONS.ERROR;
  if (Object.values(CODI_RESUM_SESSIONS).includes(error.code)) return error.code;
  if (/\[backendPort\].*no està implementat/.test(error.message ?? '')) return CODI_RESUM_SESSIONS.SENSE_PORT;
  if (error.code === 'no-disponible') return CODI_RESUM_SESSIONS.SENSE_SERVIDOR;
  const cos = cosDelServidor(error);
  const codiPg = String(cos?.code ?? error.code ?? error.codi ?? '');
  const text = `${error.message ?? ''} ${cos?.message ?? ''}`;
  if (error.status === 404 || codiPg === 'PGRST202' || codiPg === '42883' || /PGRST202|esquema requerit no està aplicat/.test(text)) return CODI_RESUM_SESSIONS.SENSE_MIGRACIO;
  if (error.status === 401 || error.status === 403 || codiPg === '42501') return CODI_RESUM_SESSIONS.SENSE_PERMIS;
  return CODI_RESUM_SESSIONS.ERROR;
}

/**
 * Demana el resum pel port i el torna validat. `backend` és el port (el mòdul backendPort.js sencer, com
 * el passa RestauradorOpenData) o qualsevol objecte amb el mètode METODE_RESUM_SESSIONS; el mètode es
 * busca en temps d'execució. Errors amb `code` de CODI_RESUM_SESSIONS; una cancel·lació (AbortError)
 * passa tal qual.
 */
export async function consultaResumSessionsDispositius(backend, config = {}) {
  const metode = backend && typeof backend === 'object' ? backend[METODE_RESUM_SESSIONS] : undefined;
  if (typeof metode !== 'function') throw ambCodi('El port de dades no porta la consulta del resum de sessions.', CODI_RESUM_SESSIONS.SENSE_PORT);
  let valor;
  try {
    valor = await metode(config);
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw ambCodi(String(error?.message ?? error), codiDErrorResumSessions(error), error);
  }
  return validaResumSessions(valor);
}
