/**
 * host.js — Arrencada pública en dos fases.
 * L’amfitrió pot declarar la seua configuració (presentació, navegació) i la
 * política de sessió abans del muntatge. Model B (decisions A1 i A3 del Mestre,
 * 261003): el backend, l’abast de dades (tenant), els serveis propis (relé
 * d’OAuth, bot, emissor) i l’adaptador són del paquet (config/capaDelPaquet.js
 * i injectaBackendDelPaquet, vies internes que no pengen de window.SocDePoble).
 * El que l’amfitrió en diga, per qualsevol canal (també les opcions de
 * sessió), es descarta amb un avís. Sense adaptador del paquet es carrega
 * Supabase; el contracte es congela en arrencar.
 *
 * Superfície global (tractor-enxufe E4): l’única que escriu el nucli és
 * `window.SocDePoble` (exposaGlobal). Decisió 5 del Mestre (261007, paquet
 * trossejat) · Abans que arribe este mòdul, el carregador clàssic
 * (config/carregadorDelPaquet.js, protocol sdp.carregador.v1) ja hi ha deixat
 * un SocDePoble PROVISIONAL: les mateixes claus, configurable, que encua les
 * crides i diu estat().fase 'carregant' (o 'fallida'). embed.jsx el pren
 * (config/provisionalDelPaquet.js, prenProvisional), exposaGlobal hi definix
 * l’API real, no configurable, i el provisional l’adopta i reprodueix la cua.
 * Són les dues úniques escriptures del global a src/. La resta són ENTRADES
 * de l’amfitrió, que el nucli llig i no assigna mai. El contracte sencer, versionat, és
 * config/contracteAmfitrio.js (sdp.amfitrio.v1); els canals d’entrada són:
 *   1 · `window.SocDePobleConfig`: l’amfitrió l’escriu abans del paquet;
 *       l’element el llig a cada recàlcul (config/configAmfitrio.js), amb la
 *       prioritat més baixa, i només en pren `nomPoble` i `poble`.
 *   2 · Els atributs de <soc-de-poble> (sdp.markup.v1 i els opt-in).
 *   3 · `window.SocDePobleCua`: ordres encuades abans que el paquet carregue
 *       (verbs a VERBS_CUA; `configura` hi té les restriccions de l’API).
 *   4 · El pont d’iframe (`SDP_HOST_CMD`, ordres a ORDRES_IFRAME).
 *   5 · Globals de només lectura: `__SDP_EMBEDDED__` i `umami`.
 *   6 · L’element mateix (contracte: `elementApi`): la propietat JS `config`
 *       (element.config = {…}), el canal de Sollutia i dels amfitrions React
 *       o Vue, amb les mateixes claus que configura({config}) i la prioritat
 *       més alta; i els mètodes setTheme, setLanguage, refreshData,
 *       getCurrentUser i on. validaDeclaracioAmfitrio el jutja com a `propietats`.
 */

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.error('[host] Error de xarxa en la càrrega diferida de mòduls Vite:', event);
    // No preventDefault: el rebuig ha d'arribar al carregador i al propietari
    // de ruta. No hi ha recàrregues automàtiques ni cap estat a la URL.
  });
}

import { setBackendImplementation, getBackendImplementation, freezeImplementation, validaBackendImplementation } from './data/backendPort.js';
import { defineCustomElement } from './PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI, CONTRACTE_BACKEND } from './data/contracte.js';
import { adoptaSessioExterna, esborraSessio, configuraBackendSessio } from './data/identitat.js';
import { normalizeBackendConfig, backendScope } from './config/backendConfig.js';
import { setRuntimePolicy, getRuntimePolicy, esOrigenParePermes } from './config/runtimePolicy.js';
import { avisaClausDescartades, capaDelPaquet, separaClausDelPaquet } from './config/capaDelPaquet.js';
import { sanitizeHtml } from './utils/sanitize.js';
import { registraAppExterna } from './apps/plataforma/registreApps.js';

/* ═══════════════════════ Estat de l'arrencada ═══════════════════════ */

const FASE = { CONFIGURABLE: 'configurable', ARRENCANT: 'arrencant', SEGELLAT: 'segellat' };
let fase = FASE.CONFIGURABLE;
let arrencada = null;
let resolveLlest = null;
let rejectLlest = null;
let promesaLlest = null;
const esperes = new Set();

function creaPromesaLlest() {
  promesaLlest = new Promise((resolve, reject) => { 
    resolveLlest = resolve; 
    rejectLlest = reject;
  });
  promesaLlest.catch(() => {}); // Evita warnings de unhandled rejection abans d'hora
}
creaPromesaLlest();

// Re-exportem CONTRACTE_BACKEND per retrocompatibilitat si algú l'importa des d'ací
export { CONTRACTE_BACKEND };

let _segellat = false;
let _deferArrenca = false;
let backendExtern = false;

export function deferArrenca() {
  _deferArrenca = true;
}

/* ═══════════════════════ Fase 1 · Configuració ═══════════════════════ */

/* Les opcions de configura() sense res del paquet (Model B): l'adaptador
   `backend`, `backend_url`, `tenant_id` i, dins de `config`, les claus de
   backend, de tenant i dels serveis propis de Sóc de Poble. Es descarten amb
   un sol avís per crida. */
function opcionsDeLAmfitrio(opcions) {
  const { neta: arrel, descartades } = separaClausDelPaquet(opcions);
  const { neta: config, descartades: deConfig } = separaClausDelPaquet(arrel.config, 'config.');
  const totes = [...descartades, ...deConfig];
  avisaClausDescartades('configura', totes);
  return { auth: arrel.auth, config, descartades: Object.freeze(totes) };
}

/**
 * L'amfitrió declara la seua configuració i la política de sessió, una sola
 * vegada i abans d'arrencar. El backend i el tenant de la política són els
 * de la capa del paquet; el que l'amfitrió en diga no arriba enlloc.
 *
 * @returns {{acceptats: string[], desconeguts: string[], descartades: string[], pendents: string[]}}
 *   `descartades`: el que s'ha llevat per Model B (p. ex. 'backend', 'config.tenantId').
 */
export function configura(opcions = {}) {
  if (_segellat || fase !== FASE.CONFIGURABLE) throw new Error('[host] L’arrancada ja ha començat');
  const { auth, config: configAmfitrio, descartades } = opcionsDeLAmfitrio(opcions);
  // Tot es valida abans de congelar la política.
  const config = normalizeBackendConfig({ ...capaDelPaquet(), ...configAmfitrio });
  backendScope(config);
  setRuntimePolicy({ auth, backendConfig: config, rawHostConfig: configAmfitrio });
  if (config.backendUrl || config.dataMode !== 'remote') configuraBackendSessio(config);
  return { acceptats: [], desconeguts: [], descartades, pendents: [...CONTRACTE_NUCLI] };
}

/**
 * Via interna del paquet (Model B): una entrada pròpia de Sóc de Poble pot
 * portar un adaptador complet del contracte en lloc de Supabase. No és a
 * window.SocDePoble ni a la cua: cap amfitrió l'abasta. Abans d'arrencar i
 * una sola vegada; un adaptador rebutjat es pot corregir.
 *
 * COSTURA SENSE CONSUMIDOR (261003). Hui no la crida cap entrada (ni main.jsx
 * ni embed.jsx), només les proves: en el paquet distribuït `backendExtern` val
 * sempre false i les branques que en depenen (injectaSessio i el pont
 * d'iframe) no s'executen. Es conserva com a port del Model A per a un
 * adaptador propi futur; retirar-la, amb eixes branques, és decisió del Mestre.
 *
 * @returns {{acceptats: string[], pendents: string[]}}
 */
export function injectaBackendDelPaquet(backend) {
  if (_segellat || fase !== FASE.CONFIGURABLE) throw new Error('[host] L’arrancada ja ha començat');
  if (backendExtern) throw new Error('[host] El paquet ja porta un adaptador.');
  const { candidate } = validaBackendImplementation(backend);
  setBackendImplementation(backend);
  backendExtern = true;
  const acceptats = Object.keys(candidate);
  return { acceptats, pendents: CONTRACTE_NUCLI.filter((k) => !acceptats.includes(k)) };
}

/* ═══════════════════════ Fase 2 · Segellat ═══════════════════════ */

/**
 * Congela el backend i defineix `<soc-de-poble>`. Idempotent.
 *
 * @returns {Promise<{fase: string, backend: string[]}>}
 */
export function arrenca() {
  if (arrencada) return arrencada;

  fase = FASE.ARRENCANT;
  _segellat = true;

  arrencada = (async () => {
    try {
      const injectats = Object.keys(getBackendImplementation());
      const pendentsNucli = CONTRACTE_NUCLI.filter((k) => !injectats.includes(k));

      if (injectats.length && pendentsNucli.length) throw new Error('[host] Backend injectat incomplet');
      if (!injectats.length) {
        const supabaseImpl = await import('./data/supabase/index.js');
        setBackendImplementation(supabaseImpl);
      }

      getRuntimePolicy();
      freezeImplementation();
      defineCustomElement();
      
      fase = FASE.SEGELLAT;
      
      const finalEstat = { fase, backend: Object.keys(getBackendImplementation()) };
      if (resolveLlest) resolveLlest(finalEstat);
      for (const espera of [...esperes]) espera.resolve(finalEstat);
      return finalEstat;
    } catch (e) {
      fase = FASE.CONFIGURABLE; // Permetem tornar a intentar
      _segellat = false;
      arrencada = null;
      if (rejectLlest) rejectLlest(e);
      for (const espera of [...esperes]) espera.reject(e);
      creaPromesaLlest(); // Preparem una nova promesa per si hi ha un reintent
      throw e;
    }
  })();

  return arrencada;
}

export function quanLlest({ signal } = {}) {
  const base = (fase === FASE.SEGELLAT) ? Promise.resolve(estat()) : (arrencada || promesaLlest);
  if (signal?.aborted) return Promise.reject(new DOMException('Operació cancel·lada.', 'AbortError'));
  if (fase === FASE.SEGELLAT) return base;
  return new Promise((resolve, reject) => {
    const cleanup = () => { 
      esperes.delete(espera); 
      if (signal) signal.removeEventListener('abort', onAbort); 
    };
    const espera = {
      resolve: value => { cleanup(); resolve(value); },
      reject: error => { cleanup(); reject(error); }
    };
    const onAbort = () => espera.reject(new DOMException('Operació cancel·lada.', 'AbortError'));
    esperes.add(espera);
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

/* Els verbs de `window.SocDePobleCua`, classificats a contracteAmfitrio.js
   (cua.verbs). Un verb fora de la taula s'ignora, com sempre; Object.hasOwn
   fa que 'constructor' o 'toString' no siguen verbs. */
const ORDRES_CUA = Object.freeze({
  sessio: (accio) => injectaSessio(accio[1], accio[2] || {}),
  configura: (accio) => configura(accio[1])
});
export const VERBS_CUA = Object.freeze(Object.keys(ORDRES_CUA));

function executaOrdreCua(accio) {
  if (Array.isArray(accio) && typeof accio[0] === 'string' && Object.hasOwn(ORDRES_CUA, accio[0])) {
    ORDRES_CUA[accio[0]](accio);
  }
}

function processarCua() {
  if (typeof window !== 'undefined' && window.SocDePobleCua && Array.isArray(window.SocDePobleCua)) {
    while (window.SocDePobleCua.length > 0) {
      const accio = window.SocDePobleCua.shift();
      try {
        executaOrdreCua(accio);
      } catch (err) {
        console.error('[host] Error processant element de la cua:', err);
      }
    }
    // Sobreescriu push per executar directament
    window.SocDePobleCua.push = (...args) => {
      for (const accio of args) {
        try {
          executaOrdreCua(accio);
        } catch (err) {
          console.error('[host] Error processant nou element de la cua:', err);
        }
      }
      return window.SocDePobleCua.length;
    };
  }
}

/**
 * Arrencada automàtica per als entorns que no configuren res.
 * Auditoria 261007 (B) · Programa el segellat amb `setTimeout(…, 0)`, al tick
 * següent (no en una microtasca): un <script> col·locat després del paquet
 * encara arriba a temps de cridar configura(). No fa res si ja està segellat,
 * si algú ha cridat deferArrenca() o si algun <soc-de-poble> porta
 * `arrencada="manual"`.
 */
export function arrencaAuto() {
  if (fase === FASE.SEGELLAT || _deferArrenca) return;
  setTimeout(() => {
    if (_deferArrenca) return;
    // Al tick següent: si encara som configurables i cap <soc-de-poble arrencada="manual"> ho ha aturat
    const tags = typeof document !== 'undefined' ? document.querySelectorAll('soc-de-poble') : [];
    let isManual = false;
    tags.forEach(tag => {
      if (tag.getAttribute('arrencada') === 'manual') isManual = true;
    });
    
    if (!isManual && fase !== FASE.SEGELLAT && fase !== FASE.ARRENCANT) {
      arrenca().catch((e) => {
        console.error('[host] Arrencada fallida. El component no es muntarà:', e);
        if (typeof document !== 'undefined') {
          tags.forEach(tag => {
            tag.innerHTML = sanitizeHtml(`<div class="sdp-arranc-fallida">
              <h3>Error crític d'arrencada</h3>
              <p>Sóc de Poble no ha pogut connectar amb el backend.</p>
              <pre></pre>
            </div>`);
            tag.querySelector('pre').textContent = e.message || String(e);
          });
        }
      });
    }
  }, 0);
}

/** Estat actual, per a diagnòstic des de la consola del host. */
export function estat() {
  const policy = getRuntimePolicy(true);
  return {
    fase,
    configurable: fase === FASE.CONFIGURABLE,
    contracte: CONTRACTE_BACKEND,
    implementat: Object.keys(getBackendImplementation()),
    config: {
      sollutiaIssuer: policy?.auth?.issuer
    }
  };
}

/**
 * L'amfitrió entrega una sessió.
 * ATENCIÓ: Operació "fail-closed". Si es crida abans de `configura()`
 * (i per tant abans que la política estigui congelada), la validació de
 * l'emissor fallarà si no s'ha proveït manualment.
 *
 * D1 (260926) · Persistència:
 *   · La sessió de l'amfitrió és de PESTANYA i no es persistix mai. Si és d'un
 *     altre compte, esborra el registre persistent que haja deixat una entrada
 *     pròpia; si és del mateix, el conserva.
 *   · És de l'amfitrió: quan SdP ix (o `expulsaSessio`), la deixa de fer servir
 *     però no la revoca a GoTrue. Tancar-la al servidor és cosa de l'amfitrió.
 *   · Passa `refresh_token` només si en CEDIXES la propietat: SdP el gastarà en
 *     renovar i GoTrue el rotarà. Si l'amfitrió el torna a usar, xocaran.
 *   · Sense `refresh_token`, torna a injectar la sessió més de 60 s abans de
 *     `exp`: en eixe marge SdP intenta renovar i, sense token, ix.
 *   · La persistència de les entrades pròpies es pot desactivar abans d'arrencar:
 *     `configura({ auth: { persistencia: 'pestanya' } })`.
 *
 * Model B (A1, 261003): `opcions` és un canal més de l'amfitrió (per l'API, el
 * verb `sessio` de la cua i l'ordre injectaSessio del pont d'iframe). Les claus
 * del paquet (backend, tenant, serveis propis) se'n lleven amb l'avís del canal
 * «sessio» abans d'arribar a l'adopció, siga la nativa o la d'un adaptador.
 */
export function injectaSessio(sessio, opcions = {}) {
  const { neta, descartades } = separaClausDelPaquet(opcions);
  avisaClausDescartades('sessio', descartades);
  if (backendExtern) {
    const adopta = getBackendImplementation().adoptaSessioExterna;
    return adopta ? adopta(sessio, neta) : false;
  }
  return adoptaSessioExterna(sessio, neta);
}

/** L'amfitrió tanca la sessió del seu costat. */
export function expulsaSessio() {
  const backend = getBackendImplementation();
  if (backend && backend.logout) {
    backend.logout().catch(() => {});
  } else {
    esborraSessio();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
    }
  }
  return true;
}

/**
 * L'amfitrió registra una app declarativa (manifest sdp.app.v1 amb `element`,
 * un custom element seu) a la Plataforma d'Apps, sense tocar el nucli. Delega
 * en registraAppExterna (apps/plataforma/registreApps.js), que la valida.
 * Es pot cridar abans o després d'arrencar: el registre és viu.
 *
 * @returns {{ ok: boolean, errors: string[], manifest: object|null }}
 */
export function registraApp(manifest) {
  return registraAppExterna(manifest);
}

/* Ordres del pont d'iframe (`SDP_HOST_CMD`), les mateixes que atén el
   gestor de missatges de baix. contracteAmfitrio.js · ordresIframe. */
export const ORDRES_IFRAME = Object.freeze(['SDP_PING', 'injectaSessio', 'expulsaSessio', 'arrenca']);

/* ═══════════════════════ Superfície global ═══════════════════════ */

export function exposaGlobal(objectiu = (typeof window !== 'undefined' ? window : undefined)) {
  if (!objectiu) return null;

  const existent = Object.getOwnPropertyDescriptor(objectiu, 'SocDePoble');
  if (existent) {
    console.warn('[host] exposaGlobal cridat quan window.SocDePoble ja existeix. S\'ignora.');
    return existent.value ?? null;
  }

  const api = Object.freeze({ configura, arrenca, arrencaAuto, deferArrenca, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, quanLlest, isReady: true, registraApp });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  processarCua();
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
    
    // Pont per a Iframe: permet comunicació bidireccional si el host ens incrusta
    if (window.parent && window.parent !== window) {
      window.addEventListener('message', async (event) => {
        const isAllowed = esOrigenParePermes(event.origin);

        // 1. Validació estricta d'origen i font
        if (!isAllowed) return;
        if (event.source !== window.parent) return;

        // 2. Validació d'estructura del missatge
        const data = event.data;
        if (!data || typeof data !== 'object' || data.type !== 'SDP_HOST_CMD') return;
        if (typeof data.cmd !== 'string') return;

        const { cmd, payload, requestId = null } = data;

        const responHost = (ok, result = null, error = null) => {
          event.source?.postMessage({
            type: 'SDP_HOST_ACK',
            cmd,
            requestId,
            ok,
            result,
            error: error ? String(error) : null
          }, event.origin);
        };

        if (cmd === 'SDP_PING') {
          const estatActual = estat();
          responHost(true, { fase: estatActual.fase, configurable: estatActual.configurable });
          return;
        }

        if (cmd === 'injectaSessio') {
          if (!payload || typeof payload !== 'object' || !payload.sessio) {
            responHost(false, null, 'Payload de sessió invàlid o absent');
            return;
          }
          
          const opcions = payload.opcions || {};
          const policy = getRuntimePolicy(true);
          
          if (!backendExtern && !policy?.auth?.issuer) {
             responHost(false, null, 'Política d’autenticació sense emissor.');
             return;
          }
          
          try {
            const ok = (await injectaSessio(payload.sessio, opcions)) === true;
            responHost(ok, null, ok ? null : 'Sessió invàlida o rebutjada');
          } catch {
            responHost(false, null, 'Sessió invàlida o rebutjada');
          }
          return;
        } else if (cmd === 'expulsaSessio') {
          expulsaSessio();
          responHost(true);
          return;
        } else if (cmd === 'arrenca') {
          arrenca().then((estatFinal) => {
            responHost(true, estatFinal);
          }).catch((e) => {
            console.error('[host] Error en arrenca() via iframe:', e);
            responHost(false, null, e instanceof Error ? e.message : String(e));
          });
          return;
        }
        
        responHost(false, null, `Comanda desconeguda: ${cmd}`);
      });
      
      const estatActual = estat();
      const estatSegur = { fase: estatActual.fase, configurable: estatActual.configurable };
      try {
        window.parent.postMessage({ type: 'SDP_READY', estat: estatSegur }, '*');
      } catch { /* cross-origin silenciós */ }
    }
  }
  
  return api;
}
