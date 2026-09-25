/**
 * host.js — Arrencada Model B en dos fases.
 * SdP selecciona internament l’adaptador i el congela abans del muntatge.
 * L’amfitrió pot configurar autenticació i entregar sessions verificables;
 * configura({ backend }) està denegat. Supabase SdP continua autoritatiu.
 */

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.error('[host] Error de xarxa en la càrrega diferida de mòduls Vite:', event);
    // El catch de l'arrenca pintarà això si passa durant l'arrencada, 
    // però això ens cobreix canvis de ruta asíncrons.
  });
}

import { setBackendImplementation, getBackendImplementation, freezeImplementation } from './data/backendPort.js';
import { defineCustomElement } from './PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI, CONTRACTE_BACKEND } from './data/contracte.js';
import { adoptaSessioExterna, esborraSessio } from './data/identitat.js';
import { setRuntimePolicy, getRuntimePolicy, esOrigenParePermes } from './config/runtimePolicy.js';
import { sanitizeHtml } from './utils/sanitize.js';

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

export function deferArrenca() {
  _deferArrenca = true;
}

/* ═══════════════════════ Fase 1 · Configuració ═══════════════════════ */

export function configura(opcions = {}) {
  if (_segellat || fase !== FASE.CONFIGURABLE) throw new Error('[host] L’arrancada ja ha començat');
  if ('backend' in opcions) throw new Error('[host] Injecció de backend denegada: Model B estricte.');
  setRuntimePolicy({ auth: opcions.auth }); // Model B: només configurem política d'autenticació
  return { acceptats: [], desconeguts: [], pendents: [...CONTRACTE_NUCLI] };
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

function processarCua() {
  if (typeof window !== 'undefined' && window.SocDePobleCua && Array.isArray(window.SocDePobleCua)) {
    while (window.SocDePobleCua.length > 0) {
      const accio = window.SocDePobleCua.shift();
      try {
        if (Array.isArray(accio) && accio[0] === 'sessio') {
          injectaSessio(accio[1], accio[2] || {});
        } else if (Array.isArray(accio) && accio[0] === 'configura') {
          configura(accio[1]);
        }
      } catch (err) {
        console.error('[host] Error processant element de la cua:', err);
      }
    }
    // Sobreescriu push per executar directament
    window.SocDePobleCua.push = (...args) => {
      for (const accio of args) {
        try {
          if (Array.isArray(accio) && accio[0] === 'sessio') {
            injectaSessio(accio[1], accio[2] || {});
          } else if (Array.isArray(accio) && accio[0] === 'configura') {
            configura(accio[1]);
          }
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
 * Utilitza queueMicrotask (0 timers) excepte si està indicat explícitament.
 */
export function arrencaAuto() {
  if (fase === FASE.SEGELLAT || _deferArrenca) return;
  setTimeout(() => {
    if (_deferArrenca) return;
    // Si després de microtaskes encara som configurables i cap <soc-de-poble arrencada="manual"> ho ha aturat
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
 */
export function injectaSessio(sessio, opcions = {}) {
  return adoptaSessioExterna(sessio, opcions);
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

/* ═══════════════════════ Superfície global ═══════════════════════ */

export function exposaGlobal(objectiu = (typeof window !== 'undefined' ? window : undefined)) {
  if (!objectiu) return null;

  const existent = Object.getOwnPropertyDescriptor(objectiu, 'SocDePoble');
  if (existent) {
    console.warn('[host] exposaGlobal cridat quan window.SocDePoble ja existeix. S\'ignora.');
    return existent.value ?? null;
  }

  const api = Object.freeze({ configura, arrenca, arrencaAuto, deferArrenca, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, quanLlest, isReady: true });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  processarCua();
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
    
    // Pont per a Iframe: permet comunicació bidireccional si el host ens incrusta
    if (window.parent && window.parent !== window) {
      window.addEventListener('message', (event) => {
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
          
          if (!policy?.auth?.issuer) {
             responHost(false, null, 'Política d’autenticació sense emissor.');
             return;
          }
          
          const ok = adoptaSessioExterna(payload.sessio, opcions);
          responHost(ok, null, ok ? null : 'Sessió invàlida o rebutjada');
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
