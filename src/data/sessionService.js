// Servei únic de sessió: identitat, configuració i consultes segellades.
import { caducitatJwt, MARGE_RENOVACIO_MS, versioSessio, sessioRecuperable, reconciliaAmbRegistre, esClauDelRegistre, triaRefresc, configuraBackendSessio, nivellDAsseguranca, esSessioPilot } from './identitat.js';
import { normalizeBackendConfig } from '../config/backendConfig.js';
import { getCurrentUser, teCapacitat, refrescaSessio, logout, elMeuRol } from './backendPort.js';

/* D1: una renovació que falla sola (xarxa, 5xx, temps, amfitrió sense refresh token)
   no és eixir. Es buida només esta pestanya, sense revocar: el registre persistent es
   queda perquè 'online' o una altra pestanya el tornen a provar. Eixir (i esborrar el
   registre) és només l'acció de la persona. */
const tancaPestanya = (config) => logout(config, { abast: 'pestanya' });

let generacio = 0;
let roleRequest = 0;
let configRequest = 0;
let temporitzador = null;
let renovacio = null;
let intents = 0;
let recuperacioGastada = false;
let epoch = versioSessio;
let currentConfig = Object.freeze({});
let configKey = '';
const owners = new Map();
const defaultOwner = Symbol('sessio');
const listeners = new Set();
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · `nivell` és el claim `aal`
   del JWT desat ('aal1' | 'aal2' | null), recalculat a cada sincronització:
   el verify del segon factor desa una sessió nova i avisa (sdp:auth-change),
   i el canvi de nivell ha d'arribar a la interfície com el de rol. */
let estatActual = { usuari: null, estat: 'comprovant', rol: null, generacio: 0, nivell: null };

export const getSessionState = () => estatActual;
export function subscribeSession(listener) {
  listeners.add(listener);
  listener(estatActual);
  return () => listeners.delete(listener);
}
function notify() { listeners.forEach(listener => listener(estatActual)); }
function clearTimer() { clearTimeout(temporitzador); temporitzador = null; }

/* Auditoria 261007 (B) · Els camps de l'estat que veuen els oients: l'usuari
   (per referència), l'estat, el rol i la generació.
   Onada 11 (261010) · I el nivell d'asseguranca: un canvi de nivell notifica. */
const CAMPS_ESTAT = Object.freeze(['usuari', 'estat', 'rol', 'generacio', 'nivell']);
const mateixContingut = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

// Opcions de presentació/rutes de PedraSecaEmbed i àlies ja normalitzats.
// Les opcions desconegudes continuen identificant la sessió: poden governar
// transport, credencials o autenticació d'un adaptador alternatiu.
// nomPoble, poble i rutaInicial (canal de l'amfitrió) són presentació i ruta
// inicial: `poble` és l'id de l'element de Pobles, no el tenantId.
// Auditoria 261007 (B) · rutaAUrl, apps i traductorUrl (T2b, 261002) també són
// claus `amfitrio` de presentació i de servei (contracteAmfitrio.js,
// clausDeConfig.amfitrio): cap adaptador de src/data les llig. Fora d'esta
// llista, dos <soc-de-poble> amb `ruta-a-url` només en la primera instància
// (com preveu el contracte), `apps` o `traductor-url` diferents feien petar la
// segona a l'ErrorBoundary amb «Dos instàncies…», i un `apps` registrat en
// calent movia la generació i purgava els proveïdors. snippetChromeUrl NO hi
// va: és un servei propi que només posa el paquet (igual a totes les
// instàncies), com oauthRelayUrl, que sí que identifica la sessió.
const CAMPS_FORA_IDENTITAT = new Set([
  'basePath', 'fontsHref', 'pluginUrl', 'routerType', 'basename',
  'language', 'themeMode', 'manageDocumentHead', 'version',
  'backend_url', 'supabaseUrl', 'tenant_id',
  'nomPoble', 'poble', 'rutaInicial',
  'rutaAUrl', 'apps', 'traductorUrl',
  // TC3.1 (261030) · Els destins del traductor-url: servei, no identitat.
  'traductorLlengues'
]);

function clauConfiguracio(config) {
  const identitat = Object.fromEntries(Object.entries(config)
    .filter(([camp]) => !CAMPS_FORA_IDENTITAT.has(camp)));
  return JSON.stringify(identitat, (_, valor) => (
    valor && typeof valor === 'object' && !Array.isArray(valor)
      ? Object.fromEntries(Object.keys(valor).sort().map(clau => [clau, valor[clau]]))
      : valor
  ));
}

/** Retorna un alliberador; dos muntatges no poden canviar-se l’àmbit global. */
export function setSessionConfig(config = {}, owner = defaultOwner) {
  config = normalizeBackendConfig(config);
  // L'adaptador rep la configuració completa: una llista de camps de Supabase
  // descartava endpoint i opcions dels endolls WordPress/Joomla.
  const normalized = Object.freeze({ ...config });
  const key = clauConfiguracio(normalized);
  if ([...owners].some(([id, entry]) => id !== owner && entry.key !== key)) {
    throw new Error('Dos instàncies no poden compartir una sessió amb configuracions diferents.');
  }
  owners.get(owner)?.controller.abort();
  const controller = new AbortController();
  const entry = { key, controller };
  owners.set(owner, entry);
  const requestId = ++configRequest;
  ++roleRequest;
  if (key !== configKey) {
    currentConfig = normalized;
    configKey = key;
    generacio++;
    intents = 0;
    clearTimer();
    configuraBackendSessio(normalized);
    estatActual = { ...estatActual, rol: estatActual.usuari ? 'desconegut' : null, generacio };
    notify();
  }
  import('../host.js').then(m => m.quanLlest({ signal: controller.signal })).then(() => {
    if (!controller.signal.aborted && requestId === configRequest) sincronitza();
  }).catch(() => {
    if (!controller.signal.aborted && requestId === configRequest) sincronitza();
  });
  return () => {
    controller.abort();
    if (owners.get(owner) === entry) owners.delete(owner);
  };
}

export function sincronitza() {
  const requestId = ++roleRequest;
  /* D1: la pestanya seguix el registre persistent; si l'ha perdut, s'esborra i
     l'avís sdp:auth-change torna a entrar ací amb la pestanya ja buida. */
  if (reconciliaAmbRegistre()) return;
  let user = null;
  try { user = getCurrentUser(); } catch { /* backend encara no arrencat */ }
  /* D6 + D1: un sol intent per sessió desada, també quan només hi ha el registre
     (pestanya nova, sense cap JWT). El comptador es reinicia en entrar o quan ja
     no queda res a recuperar. */
  if (user) recuperacioGastada = false;
  else if (recuperaSessio()) return;
  else if (!sessioRecuperable()) recuperacioGastada = false;
  /* Auditoria 261007 (B) · getCurrentUser torna un JSON.parse nou a cada crida i
     el temporitzador sincronitza cada ≤10 min: un usuari idèntic amb una
     referència nova refeia useSession, useIdentitat i useNotes sense cap canvi.
     Es compara per contingut, no per id: actualitzaUsuari desa nom o avatar
     amb el mateix id i eixe canvi sí que ha d'arribar a la interfície. */
  if (user && estatActual.usuari && mateixContingut(user, estatActual.usuari)) user = estatActual.usuari;
  const abans = estatActual;
  if (estatActual.usuari?.id !== user?.id || epoch !== versioSessio) {
    generacio++;
    epoch = versioSessio;
    intents = 0;
    estatActual = { ...estatActual, rol: user ? 'desconegut' : null };
  }
  /* Onada 11 (261010) · El nivell es llig del JWT desat, només amb usuari. */
  estatActual = { ...estatActual, usuari: user, estat: user ? 'dins' : 'fora', generacio, nivell: user ? nivellDAsseguranca() : null };
  if (!user) estatActual = { ...estatActual, rol: null };
  /* Gauntlet 261016_1530 (Bloc 3.6.4; F66) · La sessió pilot local no té cap
     servidor a qui preguntar el rol: és 'usuari', sense cap petició. */
  else if (teCapacitat('sessio') && !esSessioPilot()) {
    const myGen = generacio;
    const config = currentConfig;
    const aplicaRol = rol => {
      if (myGen !== generacio || requestId !== roleRequest) return;
      // El mateix rol de la consulta periòdica no és cap canvi: ni objecte nou ni avís.
      if ((rol || 'usuari') === estatActual.rol) return;
      estatActual = { ...estatActual, rol: rol || 'usuari' };
      notify();
    };
    Promise.resolve().then(() => elMeuRol(config)).then(aplicaRol, () => aplicaRol('usuari'));
  } else estatActual = { ...estatActual, rol: 'usuari' };
  /* Només s'avisa si canvia algun camp; si no, es conserva l'objecte d'abans
     (getSessionState torna el mateix que ja tenen els oients). El temporitzador
     es torna a armar sempre. */
  if (CAMPS_ESTAT.some(camp => estatActual[camp] !== abans[camp])) notify();
  else estatActual = abans;
  gestionaTemporitzador();
}

/**
 * D6 (auditoria 260925_1316). Amb el JWT caducat i el refresh token viu, «fora»
 * seria fals i RequireAuth redirigiria abans de provar-ho: l'estat es queda en
 * 'comprovant' mentre renovaAra() renova. Si torna sessió, l'avís sdp:auth-change
 * la sincronitza; si no, la sincronització final la dona per perduda.
 * UN sol intent per sessió desada, fins que torne a haver-hi usuari o no quede res:
 * amb el rellotge desquadrat cada token nou ja naix caducat, i sense este límit
 * cada renovació n'encadenaria una altra contra GoTrue.
 */
function recuperaSessio() {
  if (recuperacioGastada || !sessioRecuperable() || !teCapacitat('sessio')) return false;
  recuperacioGastada = true;
  estatActual = { ...estatActual, usuari: null, rol: null, estat: 'comprovant', nivell: null };
  notify();
  void renovaAra().finally(() => {
    if (estatActual.estat === 'comprovant' && !estatActual.usuari) sincronitza();
  });
  return true;
}

/** Una renovació activa i un sol timer; tres reintents amb backoff, sense allargar el JWT. */
export async function renovaAra() {
  if (renovacio?.generacio === generacio) return renovacio.promise;
  clearTimer();
  const myGen = generacio;
  const myEpoch = versioSessio;
  const config = currentConfig;
  const entry = { generacio: myGen };
  renovacio = entry;
  entry.promise = (async () => {
    try {
      if (!teCapacitat('sessio')) { await logout(config); return; }
      const ok = await refrescaSessio(config);
      if (myGen !== generacio || myEpoch !== versioSessio) return;
      if (!ok) await tancaPestanya(config);
      else intents = 0;
    } catch {
      if (myGen !== generacio || myEpoch !== versioSessio) return;
      const exp = caducitatJwt();
      if (exp && exp <= Date.now()) { await tancaPestanya(config); return; }
      intents++;
      const delay = intents <= 3 ? Math.min(1000 * 2 ** (intents - 1), exp ? exp - Date.now() : 8000)
        : (exp ? exp - Date.now() : null);
      if (delay !== null) temporitzador = setTimeout(() => {
        if (myGen !== generacio || myEpoch !== versioSessio) return;
        if (caducitatJwt() && caducitatJwt() <= Date.now()) void tancaPestanya(config);
        else void renovaAra();
      }, Math.max(1, delay));
    } finally {
      if (renovacio === entry) renovacio = null;
    }
  })();
  return entry.promise;
}

function gestionaTemporitzador() {
  clearTimer();
  if (estatActual.estat !== 'dins') return;
  const exp = caducitatJwt();
  if (!exp) return;
  const myGen = generacio;
  temporitzador = setTimeout(() => {
    if (myGen !== generacio) return;
    if (caducitatJwt() <= Date.now() + MARGE_RENOVACIO_MS) void renovaAra();
    else sincronitza();
  }, Math.max(1, Math.min(exp - Date.now() - MARGE_RENOVACIO_MS, 600000)));
}

if (typeof window !== 'undefined') {
  window.addEventListener('sdp:auth-change', sincronitza);
  /* Només una pestanya que és dins: una de fora amb el JWT caducat és el cas D6 (el
     rellotge fa nàixer caducat cada token nou) i no ha de tornar a renovar. */
  const alDespertar = () => {
    if (document.visibilityState !== 'visible' || estatActual.estat !== 'dins') return;
    const exp = caducitatJwt();
    if (exp && exp - Date.now() <= MARGE_RENOVACIO_MS) void renovaAra();
  };
  /* D1: una pestanya fora que torna a tindre una sessió recuperable (entrada en una
     altra pestanya, xarxa recuperada) ho prova de nou, una vegada. Només si no té
     sessió pròpia ('restauracio'): una que ja va restaurar i continua sense usuari
     vàlid és el cas D6, i rearmar-la a cada rotació d'una altra pestanya faria que
     dues pestanyes es passaren renovacions l'una a l'altra sense fi. */
  const tornaAProvar = () => {
    if (estatActual.estat !== 'fora' || !sessioRecuperable()) return false;
    if (triaRefresc()?.mode !== 'restauracio') return false;
    recuperacioGastada = false;
    sincronitza();
    return true;
  };
  /* D1: l'eixida o el canvi de compte en una altra pestanya arriba per l'esdeveniment
     `storage` del registre. Si esta pestanya el seguia, reconciliaAmbRegistre la buida. */
  window.addEventListener('storage', (event) => {
    if (!esClauDelRegistre(event.key)) return;
    if (reconciliaAmbRegistre()) return;   // l'avís ja resincronitza
    tornaAProvar();
  });
  document.addEventListener('visibilitychange', alDespertar);
  window.addEventListener('online', () => { if (!tornaAProvar()) alDespertar(); });
}
