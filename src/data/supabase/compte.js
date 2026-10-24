/**
 * compte.js — Capacitats opcionals 'compte' i 'consentiment' (Fase 1).
 *
 * Portabilitat i supressió (RGPD arts. 20 i 17) i consentiment demostrable
 * (art. 7.1). Tot passa per RPC de la migració F1: el client no toca cap
 * taula. Les respostes jsonb arriben en snake_case i ixen amb la forma
 * camelCase del contracte, o no ixen: una resposta amb forma inesperada
 * llança, no es disfressa d'estat buit.
 *
 * AÏLLAMENT DE SESSIÓ. Cada crida captura la sessió abans d'anar a la xarxa i
 * la comprova en tornar. Una resposta tardana d'A no arriba mai a B: ni
 * l'exportació, que porta dades personals, ni el logout de la baixa, que
 * tancaria la sessió de B.
 *
 * registraConsentiment NO viu ací: és a auth.js. Un export duplicat entre
 * mòduls d'index.js desapareix per ambigüitat, la capacitat queda parcial i
 * l'arrencada cau.
 *
 * T1 (261024; P0-04, App Store 5.1.1(v); auditoria Codex C-01) · Qui ha
 * entrat amb Apple veu revocada l'autorització d'Apple en demanar la baixa:
 * la funció compte-apple (supabase/functions) ho fa just ABANS de
 * demana_baixa, que esborra les sessions. És de millor esforç i no bloqueja
 * mai la baixa; la garantia és del servidor (el buidatge de cada hora i la
 * porta de la purga). És un deure del node Supabase: cap mètode nou al port.
 */
import { capturaSessio, jwtPerBackend } from '../identitat.js';
import { getResolvedConfig, request, rpc } from './runtime.js';
import { asseguraUsuari, logout } from './auth.js';

const FORMAT_EXPORTACIO = 'socdepoble.exportacio.v1';
/* L'exportació arreplega tot el compte d'una volta: els 12 s de request() no basten. */
const TEMPS_EXPORTACIO_MS = 60_000;

const esObjecte = (valor) => !!valor && typeof valor === 'object' && !Array.isArray(valor);
/* PostgREST torna el jsonb tal qual; una funció `returns table` el tornaria en
   array. S'accepten les dues formes perquè l'adaptador no depenga d'eixe detall. */
const fila = (resposta) => (Array.isArray(resposta) ? resposta[0] : resposta);
const textONull = (valor) => (typeof valor === 'string' && valor ? valor : null);
const formatInesperat = (que) => new Error(`${que}: el servidor ha respost amb un format inesperat.`);

/**
 * Exigix connexió i sessió abans de cap RPC, i torna la funció que comprova
 * que la sessió continua sent la mateixa i la persona que l'ha passada. Sense
 * sessió no s'envia res.
 * Codex D-01 / Gemini G2-04 (261024 correccions) · Entre el return d'esta
 * funció i l'await de qui la crida hi ha una microtasca on la sessió pot
 * canviar d'A a B: qui crida torna a cridar current() ABANS de cap efecte.
 */
async function sessioDelCompte(config) {
  if (!getResolvedConfig(config).hasSupabaseConfig) throw new Error('El compte necessita connexió amb el servidor.');
  const current = capturaSessio();
  const usuari = await asseguraUsuari(config, current);
  current();
  if (!usuari?.id) throw new Error('Cal iniciar sessió.');
  return { current, usuari };
}

const SENSE_BAIXA = Object.freeze({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });

/* T1 (261024) · Només si la persona capturada té la identitat d'Apple (app_metadata de GoTrue). */
const TOPALL_REVOCACIO_APPLE_MS = 10_000;
const teAppleVinculat = (usuari) => {
  const meta = usuari?.app_metadata;
  return (Array.isArray(meta?.providers) && meta.providers.includes('apple')) || meta?.provider === 'apple';
};

/**
 * Revoca l'autorització d'Apple abans de la baixa, amb la sessió encara viva.
 * Mai llança per Apple ni pel servidor: un error, un temps esgotat o la funció
 * sense desplegar es queden en un avís (sense cap testimoni) i la baixa
 * continua. Només un AbortError (la sessió ha canviat o qui crida ha
 * cancel·lat) para la baixa, com a la resta de crides del compte.
 * Codex D-01 / Gemini G2-04 (261024 correccions) · Només amb la sessió
 * capturada: la persona de sessioDelCompte i el seu testimoni, que viatja
 * explícit a Authorization. Ací no es torna a llegir la sessió viva, que
 * podria ser ja la de B, i a request() la capçalera explícita guanya a la del
 * JWT viu (també en el reintent d'un 401). Sense testimoni enviable (la
 * sessió pilot), no s'envia res.
 */
async function revocaAppleAbansDeLaBaixa(config, { usuari, testimoni }) {
  if (!testimoni || !teAppleVinculat(usuari)) return;
  try {
    await request('/functions/v1/compte-apple', config,
      { method: 'POST', body: { accio: 'revoca' }, headers: { Authorization: `Bearer ${testimoni}` },
        timeoutMs: TOPALL_REVOCACIO_APPLE_MS, signal: config.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    console.warn('[supabase] Revocació d’Apple pendent; la farà el servidor:', error?.status ?? error?.name ?? 'error');
  }
}

/* ───────────────────────── Capacitat 'compte' ───────────────────────── */

export async function exportaLesMeuesDades(config = {}) {
  const capturat = { ...config };
  const { current } = await sessioDelCompte(capturat);
  current();   // D-01: la microtasca després de l'await no arriba mai a cap efecte
  const dades = fila(await rpc('exporta_les_meues_dades', {}, capturat,
    { timeoutMs: TEMPS_EXPORTACIO_MS, signal: capturat.signal }));
  current();
  if (!esObjecte(dades) || dades.format !== FORMAT_EXPORTACIO) throw formatInesperat('Exportació de dades');
  return dades;
}

export async function estatBaixa(config = {}) {
  const capturat = { ...config };
  const { current } = await sessioDelCompte(capturat);
  current();   // D-01: la microtasca després de l'await no arriba mai a cap efecte
  const r = fila(await rpc('estat_baixa', {}, capturat, { signal: capturat.signal }));
  current();
  if (!esObjecte(r)) throw formatInesperat('Estat de la baixa');
  const demanadaAl = textONull(r.demanada_al);
  const demanada = typeof r.demanada === 'boolean' ? r.demanada : demanadaAl !== null;
  if (!demanada) return { ...SENSE_BAIXA };
  return { demanada: true, demanadaAl, purgaPrevistaAl: textONull(r.purga_prevista_al) };
}

/**
 * Demana la baixa i, quan el servidor la confirma, tanca totes les sessions
 * (scope global). Una baixa ja demanada es tracta igual: el compte continua en
 * quarantena i la sessió es tanca.
 * T1 (261024) · Abans, qui ha entrat amb Apple veu revocada l'autorització
 * d'Apple (de millor esforç; revocaAppleAbansDeLaBaixa).
 */
export async function demanaBaixa(opcions = {}, config = {}) {
  const capturat = { ...config };
  const { current, usuari } = await sessioDelCompte(capturat);
  current();   // D-01: la microtasca després de l'await no arriba mai a cap efecte (ni a la revocació d'Apple)
  /* El testimoni d'A, en el mateix tram síncron que la comprovació: la revocació no torna a llegir la sessió viva. */
  const sessio = { usuari, testimoni: jwtPerBackend(capturat) };
  const motiu = typeof opcions?.motiu === 'string' && opcions.motiu.trim() ? opcions.motiu.trim() : null;
  await revocaAppleAbansDeLaBaixa(capturat, sessio);
  current();   // una revocació tardana d'A no demana mai la baixa de B
  const r = fila(await rpc('demana_baixa', { p_motiu: motiu }, capturat));
  current();   // la resposta d'A no tanca mai la sessió de B
  const demanadaAl = textONull(r?.demanada_al);
  if (!demanadaAl) throw new Error('El servidor no ha confirmat la baixa.');
  const resultat = { demanada: true, demanadaAl, purgaPrevistaAl: textONull(r.purga_prevista_al) };
  try {
    await logout(capturat, { scope: 'global' });
  } catch (error) {
    /* La baixa ja és al servidor: fallar ací li diria a la interfície que no. */
    console.warn('[supabase] Baixa registrada; el tancament de sessió ha fallat:', error?.message);
  }
  return resultat;
}

export async function cancelaBaixa(config = {}) {
  const capturat = { ...config };
  const { current } = await sessioDelCompte(capturat);
  current();   // D-01: la microtasca després de l'await no arriba mai a cap efecte
  const r = fila(await rpc('cancela_baixa', {}, capturat));
  current();
  if (r?.cancelada !== true) throw new Error('El servidor no ha confirmat la cancel·lació de la baixa.');
  return { ...SENSE_BAIXA };
}

/* ─────────────────────── Capacitat 'consentiment' ─────────────────────── */

/**
 * Versió vigent de la política i l'últim acte de cada tipus. Si el servidor
 * no diu explícitament que no cal re-consentir, es demana: davant del dubte,
 * el consentiment s'ha de poder demostrar.
 */
export async function estatConsentiment(config = {}) {
  const capturat = { ...config };
  const { current } = await sessioDelCompte(capturat);
  current();   // D-01: la microtasca després de l'await no arriba mai a cap efecte
  const r = fila(await rpc('estat_consentiment', {}, capturat, { signal: capturat.signal }));
  current();
  if (!esObjecte(r)) throw formatInesperat('Estat del consentiment');
  const consentiments = (Array.isArray(r.consentiments) ? r.consentiments : []).filter(esObjecte)
    .map((c) => ({ tipus: textONull(c.tipus), accio: textONull(c.accio),
      versio: textONull(c.versio ?? c.versio_politica), al: textONull(c.al) }));
  return { versioVigent: textONull(r.versio_vigent), url: textONull(r.url), textSha256: textONull(r.text_sha256),
    consentiments, calReconsentir: r.cal_reconsentir !== false };
}

/** Revocar és afegir un acte 'revoca' (art. 7.3): el registre no s'esborra mai. */
export async function revocaConsentiment(tipus, config = {}) {
  if (typeof tipus !== 'string' || !tipus.trim()) throw new Error('Cal indicar quin consentiment es revoca.');
  const capturat = { ...config };
  const { current } = await sessioDelCompte(capturat);
  current();   // D-01: la microtasca després de l'await no arriba mai a cap efecte
  await rpc('revoca_consentiment', { p_tipus: tipus.trim() }, capturat);
  current();
}
