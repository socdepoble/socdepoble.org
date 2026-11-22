import { validatePublicCredentials } from '../../config/publicCredentials.js';
import { APP_SEED, APP_SEED_VERSION, getDefaultUserId } from '../appSeed.js';
import { getEfimer } from '../../config/storage.js';
import { CLAU_USUARI, usuariDeSessio, versioSessio, jwtPerBackend, caducitatJwt, MARGE_RENOVACIO_MS, capturaSessio } from '../identitat.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
import { llistaDe } from '../../utils/autocuracio.js';

/* T2 (ordre del Mestre, 260930) · `codi` és el vocabulari neutral del port
   (errorsBackend.js): la vista decidix per ell i mai pel text de l'adaptador. */
export class ErrorSupabase extends Error {
  constructor(message, status, codi) {
    super(message); this.name = 'ErrorSupabase'; this.status = status;
    if (codi) this.codi = codi;
  }
}

let refresca = async () => false;
export const configuraRefrescSessio = (callback) => { refresca = callback; };

export function generateUUID() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}

export const normalizeDataMode = (mode) => ['remote', 'seed', 'local'].includes(mode) ? mode : 'remote';
export function getResolvedConfig(config = {}) {
  config = normalizeBackendConfig(config);
  const supabaseUrl = typeof config.supabaseUrl === 'string' ? config.supabaseUrl.replace(/\/$/, '') : (config.supabaseUrl || '');
  const supabaseAnonKey = config.supabaseAnonKey || '';
  const tenantId = config.tenantId || null;
  if (supabaseUrl || supabaseAnonKey) {
    validatePublicCredentials(supabaseUrl, supabaseAnonKey);
    permetOrigenMitjans(supabaseUrl);
  }
  return { supabaseUrl, supabaseAnonKey, tenantId, dataMode: normalizeDataMode(config.dataMode),
    hasSupabaseConfig: Boolean(supabaseUrl && supabaseAnonKey), runtimeDataMode: normalizeDataMode(config.dataMode) };
}
export const getBackendConfigurat = (config = {}) => getResolvedConfig(config).hasSupabaseConfig;
export const getRuntimeDataMode = (config = {}) => getResolvedConfig(config).runtimeDataMode;
export const getCurrentUser = () => usuariDeSessio();

/* T2 · D04/D10 (assalt 261101) · `anonim`: la petició va SEMPRE com a
   visitant, amb la clau pública, encara que hi haja una sessió desada. La
   clau va darrere de `extra`: cap capçalera de qui crida no la pot tornar a
   canviar pel JWT. */
const buildHeaders = (config, anonKey, extra = {}, { anonim = false } = {}) => {
  const capcaleres = { apikey: anonKey, Authorization: `Bearer ${jwtPerBackend(config) || anonKey}`, 'Content-Type': 'application/json', ...extra };
  return anonim ? { ...capcaleres, apikey: anonKey, Authorization: `Bearer ${anonKey}` } : capcaleres;
};

/* L'actor es llig del blob desat i no d'usuariDeSessio(): amb el jwt caducat (el
   motiu del 401) usuariDeSessio() ja torna null i el reintent legítim no passaria. */
const actorDesat = () => getEfimer(CLAU_USUARI, null)?.id ?? null;
const sessioCanviada = () => new DOMException('La sessió ha canviat durant la renovació.', 'AbortError');
/* v1.2.17 · Gauntlet R1 (L2-03) · El mateix que donava el camí post-401 quan la renovació fallava. */
const sessioCaducada = () => new ErrorSupabase('Supabase 401: la sessió ha caducat i no s\'ha pogut renovar.', 401);

/* v1.2.17 · Gauntlet R1 (L2-01) · L'últim JWT que ja naix dins del marge en renovar-lo: amb el
   rellotge del client avançat 59 min o més, cada token nou hi naix, i cada petició en tornaria a
   demanar un altre (emetCanvi → sincronitza → recàrregues → preflight → renovació…). Una sola
   renovació preventiva per token: per a este, decidix el servidor, com abans del preflight.
   `ultimaRenovacio` és l'època i l'hora de l'última renovació que ha demanat request(): els oients
   de sdp:auth-change (emetCanvi, dins de renova) ja hi tornen abans que la petició que l'ha
   demanada, i sense ella llançaven una segona renovació que avortava la primera petició (C14). */
let jwtNascutACaducar = null;
let ultimaRenovacio = null;

/* v1.2.17 · Gauntlet R2 (L2R2-02) · Només un JWT que JA ha caducat: un de vàlid, encara que li falte menys del
   marge, ix tal qual (com a la v1.2.16). Renovar-lo abans pujava l'època, i els qui comparen versioSessio abans i
   després de request() (l'escriptura editorial, la multipoble, el ritme del xat) rebien AbortError amb l'escriptura
   ja aplicada. Si caduca pel camí, el reintent post-401 de sempre ho cobrix. */
const jaCaducat = (jwt) => {
  const exp = caducitatJwt(jwt);
  return exp !== null && exp <= Date.now();
};
/* Una renovació que torna false o llança no ha fet cap token: l'època + 1 serà d'una altra entrada. */
const acabatDeRenovar = () => ultimaRenovacio !== null && !ultimaRenovacio.fallida
  && versioSessio === ultimaRenovacio.epoca + 1 && Date.now() - ultimaRenovacio.hora <= MARGE_RENOVACIO_MS;
const renovaDesDe = (config, epoca) => {
  const renovacio = { epoca, hora: Date.now(), fallida: false };
  ultimaRenovacio = renovacio;
  return Promise.resolve(refresca(config)).then((ok) => { if (!ok) renovacio.fallida = true; return ok; },
    (error) => { renovacio.fallida = true; throw error; });
};
const recordaSiNaixACaducar = (config) => {
  const jwt = jwtPerBackend(config);
  if (jwt && jaCaducat(jwt)) jwtNascutACaducar = jwt;
};

/* P0-ZERO-401-PREFLIGHT (v1.2.17, captura del Mestre 261121 16:09) · El JWT d'esta sessió ja ha
   caducat o li falta menys del marge (el mateix de jwtEnviable a auth.js). Sense JWT, amb el
   testimoni pilot o amb un token opac (exp desconegut), no: decidix el servidor, com sempre. */
const jwtACaducar = (config) => {
  const jwt = jwtPerBackend(config);
  if (!jwt || jwt === jwtNascutACaducar || !jaCaducat(jwt)) return false;
  /* L2-01 · Acabat d'eixir de la renovació de request() i ja dins del marge: ha nascut així. */
  if (!acabatDeRenovar()) return true;
  jwtNascutACaducar = jwt;
  return false;
};

/* v1.2.17 · Gauntlet R1 (S-02) · Una Authorization de qui crida (compte.js, la revocació d'Apple)
   guanya a la del JWT viu: la petició no el fa servir i no hi ha res a renovar abans. */
const autoritzacioPropia = (headers) => !!headers && Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');

/* v1.2.17 · Gauntlet R1 (L2-04) · El signal de qui crida també talla l'espera de la renovació
   preventiva. La renovació compartida continua per a la resta de peticions. */
const ambSenyal = (promesa, signal) => (!signal ? promesa : new Promise((resolve, reject) => {
  const talla = () => reject(new DOMException('Abortat durant la renovació preventiva.', 'AbortError'));
  if (signal.aborted) { talla(); return; }
  signal.addEventListener('abort', talla, { once: true });
  promesa.then(resolve, reject).finally(() => signal.removeEventListener('abort', talla));
}));

/* L'espera és del consumidor; avortar-la no cancel·la el refresc compartit.
   El then consumix també un rebuig tardà després de liquidar esta petició.
   v1.2.19 · fusió · De Codex R32.29 (camí post-401, amb el controller de la petició). El preflight
   continua amb ambSenyal i el signal de qui crida (L2-02).
   v1.2.19 · Gauntlet R1 (L1-02) · El temporitzador es para abans d'esperar: el controller només l'avorta
   el signal de qui crida, la mateixa regla als dos camins. */
function esperaRefresc(promesa, signal) {
  return new Promise((resolve, reject) => {
    const acaba = (handler, value) => { signal.removeEventListener('abort', avorta); handler(value); };
    const avorta = () => acaba(reject, signal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError'));
    Promise.resolve(promesa).then(value => acaba(resolve, value), error => acaba(reject, error));
    signal.addEventListener('abort', avorta, { once: true });
    if (signal.aborted) avorta();
  });
}

export async function request(path, config = {}, options = {}) {
  let epoch = versioSessio;
  const actor = actorDesat();
  const { method = 'GET', headers = {}, body, signal, timeoutMs = 12000, _isRetry = false, anonim = false, senseSessio = false } = options;
  // L'entrada de sessió canvia en eixir/reentrar, però no en renovar el JWT.
  // Una lectura pública anònima no ha utilitzat la identitat de la pestanya.
  /* v1.2.19 · Gauntlet R1 (L1-01) · `senseSessio`: la petició no va en nom de la sessió d'esta pestanya
     (/verify i el PUT de «Desa» de R2: token d'un sol ús, sessió privada). Sense guarda d'entrada, però
     amb les capçaleres i les galetes de sempre (no és `anonim`). La vigència la decidix qui crida. */
  const comprovaSessio = anonim || senseSessio ? null : capturaSessio();
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY.');
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId;
  const avorta = () => controller.abort();
  const comprova = () => {
    if (controller.signal.aborted) throw controller.signal.reason ?? new DOMException('Operació cancel·lada.', 'AbortError');
    comprovaSessio?.();
  };
  signal?.addEventListener('abort', avorta);
  try {
    if (signal?.aborted) {
      const err = new Error('Abortat abans de començar');
      err.name = 'AbortError';
      throw err;
    }
    /* P0-ZERO-401-PREFLIGHT · Una pestanya que torna després d'una hora llançava les seues
       peticions amb el JWT caducat: N × 401 rojos a la consola abans que el reintent renovara la
       sessió. Ara es renova ABANS del fetch, amb la promesa compartida de refreshSession (una sola
       renovació per a totes les peticions concurrents), i s'aplica la guarda C14 a la renovació
       preventiva: només val la que ha fet esta sessió (època + 1 i el mateix actor), i l'època
       passa a ser la nova. Si no s'ha pogut renovar i la sessió no ha canviat, la petició ix com
       abans i el reintent post-401 continua cobrint la deriva de rellotge i la revocació remota. */
    if (!anonim && !_isRetry && !path.startsWith('/auth/') && !autoritzacioPropia(headers) && jwtACaducar(config)) {
      const renovada = await ambSenyal(renovaDesDe(config, epoch).catch(() => false), signal);
      if (renovada && versioSessio === epoch + 1 && actorDesat() === actor) {
        epoch = versioSessio;
        recordaSiNaixACaducar(config);
      }
      /* v1.2.17 · Gauntlet R1 (L2-03) · La renovació ha fallat i ha buidat la pestanya: el 401
         de sempre (sessió caducada, no reintentable), sense enviar res. Un altre actor o una
         entrada nova: AbortError (C14). */
      else if (versioSessio !== epoch) throw !renovada && actorDesat() === null ? sessioCaducada() : sessioCanviada();
    }
    /* v1.2.17 · Gauntlet R1 (L2-02) · El temporitzador s'arma després de la renovació preventiva
       (fins a 12 s pròpies a auth.js): timeoutMs és per al fetch, com en el reintent post-401. */
    const arma = (ms) => { timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, ms); };
    /* v1.2.19 · Gauntlet R1 (L1-02) · El termini, per a reprendre el temps que li quede al fetch després
       d'una renovació post-401 sense reintent.
       v1.2.19 · Gauntlet R2 (L1R2-01) · Amb un rellotge monotònic: si l'hora del sistema salta durant el
       fetch (un telèfon que corregix l'hora en tornar la xarxa), el cos del 401 no queda sense topall ni es
       talla a zero. */
    const ara = () => globalThis.performance?.now?.() ?? Date.now();
    const termini = ara() + timeoutMs;
    arma(timeoutMs);
    /* v1.2.19 · fusió · La guarda d'entrada de Codex R32.29 va després del preflight: una entrada nova
       del mateix UUID que un callback presenta com a renovació passa la C14 (època + 1, mateix actor),
       però no esta comprovació, i no s'envia res. */
    comprova();
    /* Anònima: tampoc cap galeta, encara que el servidor de dades compartira l'origen (idea del kit de Codex, 261101). */
    const response = await fetch(`${supabaseUrl}${path}`, { method, redirect: 'error', headers: buildHeaders(config, supabaseAnonKey, headers, { anonim }),
      ...(anonim ? { credentials: 'omit' } : {}), signal: controller.signal, body: body === undefined ? undefined : JSON.stringify(body) });
    comprova();
    if (!response.ok) {
      /* Una lectura anònima (T2) no renova mai la sessió: no l'ha feta servir. */
      if (response.status === 401 && !anonim && epoch === versioSessio && !_isRetry && !path.startsWith('/auth/')) {
        /* v1.2.19 · fusió · renovaDesDe (v1.2.17, L2-01: deixa l'època i l'hora de la renovació) dins de
           l'espera cancel·lable de Codex R32.29.
           v1.2.19 · Gauntlet R1 (L1-02) · La regla del preflight (L2-02): la renovació no es menja el temps
           del fetch. El temporitzador es para abans d'esperar-la; el controller ja només l'avorta el signal
           de qui crida, i l'espera només la talla eixe. El reintent porta el seu temporitzador propi. */
        clearTimeout(timeoutId);
        const restant = Math.min(timeoutMs, Math.max(0, termini - ara()));
        const renovada = await esperaRefresc(renovaDesDe(config, epoch), controller.signal).catch((error) => {
          /* v1.2.19 · Gauntlet R1 (L1-02) · El topall propi de la renovació (12 s a auth.js) avorta sense
             que qui crida ho demane: és temps esgotat (TimeoutError), no una cancel·lació silenciosa. */
          if (error?.name === 'AbortError' && !controller.signal.aborted) timedOut = true;
          throw error;
        });
        /* v1.2.19 · fusió · (L2-03) La renovació ha fallat i ha buidat la pestanya: el 401 de sempre,
           el mateix que dona el preflight, sense llegir el cos de la sessió que ja no existix. Sense
           esta excepció, la guarda d'entrada el convertiria en AbortError i la vista no sabria que
           la sessió ha caducat. Un altre actor o una entrada nova continuen sent AbortError (C14). */
        if (!renovada && versioSessio !== epoch && actorDesat() === null && !controller.signal.aborted) throw sessioCaducada();
        // El refresc compartit pot acabar després de cancel·lar esta petició.
        // Tant true com false han de respectar el controller i l'entrada originals.
        comprova();
        if (renovada) {
          /* C14: el reintent només val per a la sessió que ha produït ESTA renovació.
             desaSessio() de la renovació incrementa la versió exactament una vegada i
             conserva l'actor; qualsevol altre salt (logout, canvi d'usuari, nova entrada
             del mateix usuari) vol dir que l'acció pertany a una sessió que ja no existix. */
          if (versioSessio !== epoch + 1 || actorDesat() !== actor) throw sessioCanviada();
          /* v1.2.17 · Gauntlet R1 (L2-01) · Un token que ja naix dins del marge tampoc no es torna a renovar abans. */
          recordaSiNaixACaducar(config);
          return request(path, config, { ...options, _isRetry: true });
        }
        /* v1.2.19 · Gauntlet R1 (L1-02) · Sense reintent: el cos del 401 té el temps que li quedava al fetch. */
        arma(restant);
      }
      const text = await response.text();
      comprova();
      const failure = new ErrorSupabase(`Supabase ${response.status}: ${text || 'Error desconegut.'}`, response.status);
      // Preserve bounded protocol codes for retry decisions, never store a
      // server message in a durable queue or infer authority from arbitrary text.
      if (text.length <= 65536) {
        try {
          const detail = JSON.parse(text);
          if (typeof detail?.code === 'string' && /^[A-Z0-9]{5}$/.test(detail.code)) failure.sqlstate = detail.code;
          if (typeof detail?.code === 'string' && /^PGRST\d{3}$/.test(detail.code)) failure.postgrestCode = detail.code;
          if (typeof detail?.message === 'string') {
            /* Gauntlet R22 (ronda 3, sql-05) · També SDP-MUR-MIDA (22001): una publicació que passa del
               límit de mida és un rebuig definitiu, no una xarxa (NotesContext · publishNote). */
            const known = /^(SDP-MUR-(?:REVISION|OWNER|MIDA))(?=:|$)/.exec(detail.message);
            if (known) failure.codi = known[1];
          }
        } catch { /* Non-JSON errors retain their HTTP status and retry policy. */ }
      }
      throw failure;
    }
    if (response.status === 204) return null;
    const json = await response.json(); // F06: Esperar que descarregue tot el cos abans del finally
    comprova();
    options.onResponseMetadata?.({ contentRange: response.headers.get('content-range') });
    comprova();
    return json;
  } catch (err) {
    if (timedOut) {
      const timeoutErr = new Error('La petició ha trigat massa temps.');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    /* T2 · La petició no ha arribat al servidor (aturat o sense xarxa): estat 0
       i el codi neutral. El missatge es conserva (readableBackendError i les
       proves d'Onboarding el lligen). Un temps esgotat no porta el codi: el
       servidor pot estar viu i lent. No hi ha sonda ni circuit per a les
       peticions concurrents (decisió del coordinador, 260930): tocaria totes
       les peticions, també les d'entrada. */
    if (err instanceof TypeError) {
      throw new ErrorSupabase('Error de xarxa: No es pot connectar al servidor. Comprova la teua connexió a internet o que el backend local estiga en marxa.', 0, CODI_BACKEND_INABASTABLE);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', avorta);
  }
}

/* `opcions` arriba tal qual a request() (timeoutMs, signal): l'exportació de
   dades pot passar dels 12 s. El mètode i el cos no es poden sobreescriure. */
export async function rpc(nom, cos, config = {}, opcions = {}) {
  try { return await request(`/rest/v1/rpc/${nom}`, config, { ...opcions, method: 'POST', body: cos }); }
  catch (error) {
    if (esRpcAbsent(error)) {
      const absent = new ErrorSupabase(`L'esquema requerit no està aplicat (falta "${nom}" o la seua signatura). Executa les migracions corresponents.`, 404);
      absent.postgrestCode = error.postgrestCode;
      throw absent;
    }
    throw error;
  }
}

/* Un 404 genèric, PGRST205 (taula) o text que només menciona PGRST202 no
   demostren l'absència d'una funció. El codi prové del JSON del protocol. */
export const esRpcAbsent = error => error?.status === 404 && error?.postgrestCode === 'PGRST202';

export function mapContentRowsToData(rows) {
  const lookup = new Map(rows.map((row) => [row.key, row.payload]));
  /* Onada 12 (261011; ordres 261011_0130, punt 7) · Llistes tolerants: una
     fila d'app_content amb un objecte o un text on toca una llista es pren
     buida (llistaDe l'anota i avisa una vegada). Abans passava tal qual i
     byId(payload.towns) petava dins del proveïdor del contingut, per damunt
     de la barrera de la ruta: tota l'app en blanc per una fila malmesa. */
  const llista = (clau) => llistaDe(lookup.get(clau), clau);
  // El contingut remot és autoritatiu: una llista buida no activa la demostració.
  return { ownerUserId: getDefaultUserId(), agents: llista('agents'), feedPosts: llista('feedPosts'),
    marketItems: llista('marketItems'), events: llista('events'), towns: llista('towns'),
    mediaItems: llista('mediaItems'),
    noteFolders: llista('noteFolders'),
    notes: llista('notes'),
    pages: llista('pages'), sectionSubmissions: [], chatMessages: [] };
}

export const buildSeedAppData = (ownerUserId = getDefaultUserId()) => Promise.resolve({ ownerUserId,
  agents: APP_SEED.agents, chatThreads: APP_SEED.chatThreads || [],
  chatMessages: (APP_SEED.chatMessages || []).filter((m) => m.ownerUserId === ownerUserId),
  feedPosts: APP_SEED.feedPosts, marketItems: APP_SEED.marketItems, events: APP_SEED.events, towns: APP_SEED.towns,
  mediaItems: APP_SEED.mediaItems, noteFolders: APP_SEED.noteFolders, notes: APP_SEED.notes, pages: APP_SEED.pages,
  sectionSubmissions: [], seedVersion: APP_SEED_VERSION });
export { APP_SEED_VERSION };
