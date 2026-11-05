// Servei únic de sessió: identitat, configuració i consultes segellades.
import { caducitatJwt, MARGE_RENOVACIO_MS, versioSessio, sessioRecuperable, reconciliaAmbRegistre, esClauDelRegistre, triaRefresc, configuraBackendSessio, nivellDAsseguranca, esSessioPilot } from './identitat.js';
import { normalizeBackendConfig } from '../config/backendConfig.js';
import { getCurrentUser, teCapacitat, refrescaSessio, logout, elMeuRol } from './backendPort.js';
import { estatSessioIntern as S } from '../app/contexts/sessionContextIntern.js';

/* D1: una renovació que falla sola (xarxa, 5xx, temps, amfitrió sense refresh token)
   no és eixir. Es buida només esta pestanya, sense revocar: el registre persistent es
   queda perquè 'online' o una altra pestanya el tornen a provar. Eixir (i esborrar el
   registre) és només l'acció de la persona. */
const tancaPestanya = (config) => logout(config, { abast: 'pestanya' });

if (S.epoch === null) S.epoch = versioSessio;

export const getSessionState = () => S.estatActual;
export function subscribeSession(listener) {
  S.listeners.add(listener);
  listener(S.estatActual);
  return () => S.listeners.delete(listener);
}
function notify() { S.listeners.forEach(listener => listener(S.estatActual)); }
function clearTimer() { clearTimeout(S.temporitzador); S.temporitzador = null; }

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
export function setSessionConfig(config = {}, owner = S.defaultOwner) {
  config = normalizeBackendConfig(config);
  // L'adaptador rep la configuració completa: una llista de camps de Supabase
  // descartava endpoint i opcions dels endolls WordPress/Joomla.
  const normalized = Object.freeze({ ...config });
  const key = clauConfiguracio(normalized);
  if ([...S.owners].some(([id, entry]) => id !== owner && entry.key !== key)) {
    throw new Error('Dos instàncies no poden compartir una sessió amb configuracions diferents.');
  }
  S.owners.get(owner)?.controller.abort();
  const controller = new AbortController();
  const entry = { key, controller };
  S.owners.set(owner, entry);
  const requestId = ++S.configRequest;
  ++S.roleRequest;
  if (key !== S.configKey) {
    S.currentConfig = normalized;
    S.configKey = key;
    S.generacio++;
    S.intents = 0;
    clearTimer();
    configuraBackendSessio(normalized);
    S.estatActual = { ...S.estatActual, rol: S.estatActual.usuari ? 'desconegut' : null, generacio: S.generacio };
    notify();
  }
  import('../host.js').then(m => m.quanLlest({ signal: controller.signal })).then(() => {
    if (!controller.signal.aborted && requestId === S.configRequest) sincronitza();
  }).catch(() => {
    if (!controller.signal.aborted && requestId === S.configRequest) sincronitza();
  });
  return () => {
    controller.abort();
    if (S.owners.get(owner) === entry) S.owners.delete(owner);
  };
}

export function sincronitza() {
  const requestId = ++S.roleRequest;
  /* D1: la pestanya seguix el registre persistent; si l'ha perdut, s'esborra i
     l'avís sdp:auth-change torna a entrar ací amb la pestanya ja buida. */
  if (reconciliaAmbRegistre()) return;
  let user = null;
  try { user = getCurrentUser(); } catch { /* backend encara no arrencat */ }
  /* D6 + D1: un sol intent per sessió desada, també quan només hi ha el registre
     (pestanya nova, sense cap JWT). El comptador es reinicia en entrar o quan ja
     no queda res a recuperar. */
  if (user) S.recuperacioGastada = false;
  else if (recuperaSessio()) return;
  else if (!sessioRecuperable()) S.recuperacioGastada = false;
  /* Auditoria 261007 (B) · getCurrentUser torna un JSON.parse nou a cada crida i
     el temporitzador sincronitza cada ≤10 min: un usuari idèntic amb una
     referència nova refeia useSession, useIdentitat i useNotes sense cap canvi.
     Es compara per contingut, no per id: actualitzaUsuari desa nom o avatar
     amb el mateix id i eixe canvi sí que ha d'arribar a la interfície. */
  if (user && S.estatActual.usuari && mateixContingut(user, S.estatActual.usuari)) user = S.estatActual.usuari;
  const abans = S.estatActual;
  if (S.estatActual.usuari?.id !== user?.id || S.epoch !== versioSessio) {
    S.generacio++;
    S.epoch = versioSessio;
    S.intents = 0;
    S.estatActual = { ...S.estatActual, rol: user ? 'desconegut' : null };
  }
  /* Onada 11 (261010) · El nivell es llig del JWT desat, només amb usuari. */
  S.estatActual = { ...S.estatActual, usuari: user, estat: user ? 'dins' : 'fora', generacio: S.generacio, nivell: user ? nivellDAsseguranca() : null };
  if (!user) S.estatActual = { ...S.estatActual, rol: null };
  /* Gauntlet 261016_1530 (Bloc 3.6.4; F66) · La sessió pilot local no té cap
     servidor a qui preguntar el rol: és 'usuari', sense cap petició. */
  else if (teCapacitat('sessio') && !esSessioPilot()) {
    const myGen = S.generacio;
    const config = S.currentConfig;
    const aplicaRol = rol => {
      if (myGen !== S.generacio || requestId !== S.roleRequest) return;
      // El mateix rol de la consulta periòdica no és cap canvi: ni objecte nou ni avís.
      if ((rol || 'usuari') === S.estatActual.rol) return;
      S.estatActual = { ...S.estatActual, rol: rol || 'usuari' };
      notify();
    };
    Promise.resolve().then(() => elMeuRol(config)).then(aplicaRol, () => aplicaRol('usuari'));
  } else S.estatActual = { ...S.estatActual, rol: 'usuari' };
  /* Només s'avisa si canvia algun camp; si no, es conserva l'objecte d'abans
     (getSessionState torna el mateix que ja tenen els oients). El temporitzador
     es torna a armar sempre. */
  if (CAMPS_ESTAT.some(camp => S.estatActual[camp] !== abans[camp])) notify();
  else S.estatActual = abans;
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
  if (S.recuperacioGastada || !sessioRecuperable() || !teCapacitat('sessio')) return false;
  S.recuperacioGastada = true;
  S.estatActual = { ...S.estatActual, usuari: null, rol: null, estat: 'comprovant', nivell: null };
  notify();
  void renovaAra().finally(() => {
    if (S.estatActual.estat === 'comprovant' && !S.estatActual.usuari) sincronitza();
  });
  return true;
}

/** Una renovació activa i un sol timer; tres reintents amb backoff, sense allargar el JWT. */
export async function renovaAra() {
  if (S.renovacio?.generacio === S.generacio) return S.renovacio.promise;
  clearTimer();
  const myGen = S.generacio;
  const myEpoch = versioSessio;
  const config = S.currentConfig;
  const entry = { generacio: myGen };
  S.renovacio = entry;
  entry.promise = (async () => {
    try {
      if (!teCapacitat('sessio')) { await logout(config); return; }
      const ok = await refrescaSessio(config);
      if (myGen !== S.generacio || myEpoch !== versioSessio) return;
      if (!ok) await tancaPestanya(config);
      else S.intents = 0;
    } catch {
      if (myGen !== S.generacio || myEpoch !== versioSessio) return;
      const exp = caducitatJwt();
      if (exp && exp <= Date.now()) { await tancaPestanya(config); return; }
      S.intents++;
      const delay = S.intents <= 3 ? Math.min(1000 * 2 ** (S.intents - 1), exp ? exp - Date.now() : 8000)
        : (exp ? exp - Date.now() : null);
      if (delay !== null) S.temporitzador = setTimeout(() => {
        if (myGen !== S.generacio || myEpoch !== versioSessio) return;
        if (caducitatJwt() && caducitatJwt() <= Date.now()) void tancaPestanya(config);
        else void renovaAra();
      }, Math.max(1, delay));
    } finally {
      if (S.renovacio === entry) S.renovacio = null;
    }
  })();
  return entry.promise;
}

function gestionaTemporitzador() {
  clearTimer();
  if (S.estatActual.estat !== 'dins') return;
  const exp = caducitatJwt();
  if (!exp) return;
  const myGen = S.generacio;
  S.temporitzador = setTimeout(() => {
    if (myGen !== S.generacio) return;
    if (caducitatJwt() <= Date.now() + MARGE_RENOVACIO_MS) void renovaAra();
    else sincronitza();
  }, Math.max(1, Math.min(exp - Date.now() - MARGE_RENOVACIO_MS, 600000)));
}

S.sincronitzaActual = sincronitza;
S.alDespertarActual = () => {
  if (document.visibilityState !== 'visible' || S.estatActual.estat !== 'dins') return;
  const exp = caducitatJwt();
  if (exp && exp - Date.now() <= MARGE_RENOVACIO_MS) void renovaAra();
};
S.tornaAProvarActual = () => {
  if (S.estatActual.estat !== 'fora' || !sessioRecuperable()) return false;
  if (triaRefresc()?.mode !== 'restauracio') return false;
  S.recuperacioGastada = false;
  sincronitza();
  return true;
};
S.enStorageActual = (event) => {
  if (!esClauDelRegistre(event.key)) return;
  if (reconciliaAmbRegistre()) return; // l'avís ja resincronitza
  S.tornaAProvarActual();
};

if (typeof window !== 'undefined' && !S.oientsFinestraArmats) {
  S.oientsFinestraArmats = true;
  window.addEventListener('sdp:auth-change', () => S.sincronitzaActual?.());
  window.addEventListener('storage', (event) => S.enStorageActual?.(event));
  document.addEventListener('visibilitychange', () => S.alDespertarActual?.());
  window.addEventListener('online', () => {
    if (!S.tornaAProvarActual?.()) S.alDespertarActual?.();
  });
}
