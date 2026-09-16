/**
 * host.js — LA PRESA DE CORRENT DE SÓC DE POBLE
 *
 * EL PROBLEMA QUE RESOL (auditoria 260830)
 * ────────────────────────────────────────
 * `backendPort.js` està ben fet: cap mòdul importa `supabaseBackend.js`
 * directament, tot passa pel port, i el pany s'arma. Però la Llei de
 * l'Enxufabilitat (AGENTS.md §8) era **inassolible a la pràctica**, per tres
 * barreres acumulades:
 *
 *   1 · `setBackendImplementation` no s'exposava a cap global. Zero
 *       assignacions `window.*` en tot `src/`.
 *   2 · El build standalone declara explícitament que NO és un mòdul ESM.
 *       Sense ESM i sense global, no hi ha cap superfície de crida.
 *   3 · Encara que n'hi haguera: `freezeImplementation()` es crida dins de
 *       `connectedCallback`, que dispara SÍNCRONAMENT durant
 *       `customElements.define()` quan l'etiqueta ja és al DOM — que és
 *       exactament el cas del plugin. La finestra d'injecció era de zero
 *       mil·lisegons.
 *
 * El port existia, era correcte, i estava soldat per dins.
 *
 * L'ARQUITECTURA NOVA: ARRENCADA EN DUES FASES
 * ────────────────────────────────────────────
 * El pany segueix sent innegociable — un backend injectable després del
 * muntatge seria un vector d'atac. El que canvia és QUAN es tanca:
 *
 *   Fase 1 · CONFIGURACIÓ   El host pot cridar `configura({ backend })`.
 *                           L'element encara no està definit.
 *   Fase 2 · SEGELLAT       `arrenca()` congela el backend i defineix
 *                           l'element. A partir d'ací, res es pot injectar.
 *
 * Per a entorns que necessiten arrencada sense configuració, `arrencaAuto()`
 * fa la fase 2 sola en el següent tick. Un `<script>` del host col·locat
 * després del bundle encara arriba a temps per a la fase 1, perquè el tick
 * no s'ha consumit.
 *
 * COM L'USA SOLLUTIA
 * ──────────────────
 * Si s'empra `type="module"`, el host carrega de forma diferida. Per evitar
 * curses, Sollutia ha d'esperar l'esdeveniment `socdepoble-ready` o
 * comprovar si ja està llest:
 *
 *   function bootSollutia() {
 *     window.SocDePoble.configura({ backend: { ... } });
 *     window.SocDePoble.arrenca();
 *   }
 *
 *   if (window.SocDePoble && window.SocDePoble.isReady) {
 *     bootSollutia();
 *   } else {
 *     window.addEventListener('socdepoble-ready', bootSollutia);
 *   }
 *
 * Per a substituir Supabase del tot (l'objectiu d'integració amb Sollutia), es passa el
 * contracte sencer i `supabaseBackend.js` deixa de tocar-se en temps d'execució.
 *
 * COM S'USA EN ENTORN ESTÀNDARD
 * ─────────────────────────────
 *   El build standalone acaba cridant `arrencaAuto()`. Si ningú ha configurat
 *   res, s'arrenca amb Supabase de forma autònoma.
 *
 * NOTA D'HONESTEDAT
 * ─────────────────
 * El cicle de vida dels Custom Elements no s'ha pogut provar en aquest entorn
 * (no hi ha navegador ni node_modules). L'estructura del mòdul i l'ordre de
 * crides sí que estan raonats contra el codi real de `PedraSecaEmbed.jsx`,
 * però la fase 2 s'ha de verificar en un navegador abans de donar-la per bona.
 * Vegeu `tooling/gates/tractor-enxufe.mjs` per a la comprovació estàtica.
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

/* ═══════════════════════ Estat de l'arrencada ═══════════════════════ */

const FASE = { CONFIGURABLE: 'configurable', ARRENCANT: 'arrencant', SEGELLAT: 'segellat' };
let fase = FASE.CONFIGURABLE;
let arrencada = null;
let resolveLlest = null;
const promesaLlest = new Promise(resolve => { resolveLlest = resolve; });

// Re-exportem CONTRACTE_BACKEND per retrocompatibilitat si algú l'importa des d'ací
export { CONTRACTE_BACKEND };

let _segellat = false;

/* ═══════════════════════ Fase 1 · Configuració ═══════════════════════ */

/**
 * Injecta una implementació de backend abans del segellat.
 *
 * Mode estricte: la injecció ha de proveir el contracte sencer (nucli + capacitats) per a
 * evitar barreges perilloses entre Supabase i el nou backend de Sollutia.
 *
 * @param {{backend?: Record<string, Function>}} opcions
 * @returns {{acceptats: string[], desconeguts: string[], pendents: string[]}}
 * @throws {Error} si ja s'ha segellat
 */
export function configura({ backend, force = false } = {}) {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : (typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  
  if (_segellat || fase === FASE.SEGELLAT || fase === FASE.ARRENCANT) {
    if (!force || !isDev) {
      console.error("[host] configura() cridat després de arrenca(). Ignorat.");
      return false;
    }
  }
  if (!backend || typeof backend !== 'object') {
    return { acceptats: [], desconeguts: [], pendents: [...CONTRACTE_NUCLI] };
  }

  const claus = [];
  let obj = backend;
  while (obj && obj !== Object.prototype) {
    claus.push(...Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  }
  const uniqueClaus = [...new Set(claus)].filter(k => k !== 'constructor');

  const desconeguts = uniqueClaus.filter((k) => !CONTRACTE_BACKEND.includes(k));
  const acceptats = uniqueClaus.filter((k) => CONTRACTE_BACKEND.includes(k) && typeof backend[k] === 'function');

  if (desconeguts.length) {
    console.warn(`[host] Mètodes fora del contracte, ignorats: ${desconeguts.join(', ')}.`
      + ` Contracte vàlid: ${CONTRACTE_BACKEND.join(', ')}`);
  }
  const noFuncions = uniqueClaus.filter((k) => CONTRACTE_BACKEND.includes(k) && typeof backend[k] !== 'function');
  if (noFuncions.length) {
    throw new Error(`[host] Aquests membres del contracte no són funcions: ${noFuncions.join(', ')}`);
  }

  setBackendImplementation(backend);
  return { acceptats, desconeguts, pendents: CONTRACTE_NUCLI.filter((k) => !acceptats.includes(k)) };
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

      if (pendentsNucli.length > 0) {
        if (injectats.length > 0) {
          throw new Error(`[host] Injecció parcial. Falla de seguretat. Mètodes coberts: ${injectats.join(', ')}. Falten: ${pendentsNucli.join(', ')}. El fallback híbrid està prohibit per política de seguretat.`);
        } else {
          const supabaseImpl = await import('./data/supabase/index.js');
          setBackendImplementation(supabaseImpl);
        }
      }

      freezeImplementation();
      defineCustomElement();
      
      fase = FASE.SEGELLAT;
      
      const finalEstat = { fase, backend: Object.keys(getBackendImplementation()) };
      if (resolveLlest) resolveLlest(finalEstat);
      return finalEstat;
    } catch (e) {
      fase = FASE.CONFIGURABLE; // Permetem tornar a intentar
      _segellat = false;
      arrencada = null;
      throw e;
    }
  })();

  return arrencada;
}

export function quanLlest() {
  return promesaLlest;
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
      return Array.prototype.push.apply(window.SocDePobleCua, args);
    };
  }
}

/**
 * Arrencada automàtica per als entorns que no configuren res.
 * Utilitza queueMicrotask (0 timers) excepte si està indicat explícitament.
 */
export function arrencaAuto() {
  if (fase === FASE.SEGELLAT) return;
  setTimeout(() => {
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
            tag.innerHTML = `<div class="sdp-arranc-fallida">
              <h3>Error crític d'arrencada</h3>
              <p>Sóc de Poble no ha pogut connectar amb el backend.</p>
              <pre></pre>
            </div>`;
            tag.querySelector('pre').textContent = e.message || String(e);
          });
        }
      });
    }
  }, 0);
}

/** Estat actual, per a diagnòstic des de la consola del host. */
export function estat() {
  return {
    fase,
    configurable: fase === FASE.CONFIGURABLE,
    contracte: CONTRACTE_BACKEND,
    implementat: Object.keys(getBackendImplementation()),
  };
}

/**
 * L'amfitrió entrega una sessió. Vàlid en qualsevol fase.
 */
export function injectaSessio(sessio, opcions = {}) {
  return adoptaSessioExterna(sessio, opcions);
}

/** L'amfitrió tanca la sessió del seu costat. */
export function expulsaSessio() {
  esborraSessio();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
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

  const api = Object.freeze({ configura, arrenca, arrencaAuto, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, quanLlest, isReady: true });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  processarCua();
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
    
    // Pont per a Iframe: permet comunicació bidireccional si el host ens incrusta
    if (window.parent && window.parent !== window) {
      const orígensProduccio = [
        'https://sollutia.cat',
        'https://app.sollutia.cat',
        'https://socdepoble.sollutia.com',
        'https://socdepoble.sollutia.cat'
      ];
      const orígensDev = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3340'];
      const ORIGENS_AMFITRIO_PERMESOS = Object.freeze(
        import.meta.env?.DEV ? [...orígensProduccio, ...orígensDev] : orígensProduccio
      );

      window.addEventListener('message', (event) => {
        // 1. Validació estricta d'origen i font
        if (!ORIGENS_AMFITRIO_PERMESOS.includes(event.origin)) return;
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
          // Injectem l'origen com a emissor esperat per defecte si no en donen un
          if (!opcions.emissorEsperat) {
            opcions.emissorEsperat = event.origin;
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
      for (const origen of ORIGENS_AMFITRIO_PERMESOS) {
        try {
          window.parent.postMessage({ type: 'SDP_READY', estat: estatSegur }, origen);
        } catch { /* cross-origin silenciós */ }
      }
    }
  }
  
  return api;
}

