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

const FASE = { CONFIGURABLE: 'configurable', SEGELLAT: 'segellat' };
let fase = FASE.CONFIGURABLE;
let autoProgramada = false;
let arrencada = null;
let arrencaAutoTimer = null;

// Re-exportem CONTRACTE_BACKEND per retrocompatibilitat si algú l'importa des d'ací
export { CONTRACTE_BACKEND };

/* ═══════════════════════ Fase 1 · Configuració ═══════════════════════ */

/**
 * Injecta una implementació de backend abans del segellat.
 *
 * Mode estricte: la injecció ha de proveir el contracte sencer (nucli + capacitats) per a
 * evitar barreges perilloses entre Supabase i el nou backend de Sollutia.
 * O pot proveir només el nucli, però els mètodes declarats han d'estar complets.
 *
 * @param {{backend?: Record<string, Function>}} opcions
 * @returns {{acceptats: string[], desconeguts: string[], pendents: string[]}}
 * @throws {Error} si ja s'ha segellat
 */
export function configura({ backend, force = false } = {}) {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : (typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  
  if (fase === FASE.SEGELLAT) {
    if (!force || !isDev) {
      throw new Error(
        "[host] Ja s'ha cridat arrenca(): el backend està segellat. "
        + 'La injecció forçada només està permesa en mode de desenvolupament per seguretat.'
      );
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

  // Com que backendPort ja accepta classes i lliga el context amb bind(), només passem l'objecte
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

  fase = FASE.SEGELLAT;

  arrencada = (async () => {
    const injectats = Object.keys(getBackendImplementation());
    const pendentsNucli = CONTRACTE_NUCLI.filter((k) => !injectats.includes(k));

    if (pendentsNucli.length > 0) {
      if (injectats.length > 0) {
        console.warn(`[host] Injecció parcial detectada. Mètodes coberts: ${injectats.join(', ')}. Falten: ${pendentsNucli.join(', ')}. S'usaran fallbacks a Supabase per als mètodes no coberts pel host.`);
        const supabaseImpl = await import('./data/supabase/index.js');
        const hibrid = { ...supabaseImpl };
        const base = getBackendImplementation();
        for (const k of injectats) hibrid[k] = base[k];
        setBackendImplementation(hibrid);
      } else {
        // Només importem Supabase completament si NO S'HA INJECTAT RES
        const supabaseImpl = await import('./data/supabase/index.js');
        setBackendImplementation(supabaseImpl);
      }
    }

    freezeImplementation();
    defineCustomElement();
    return { fase, backend: Object.keys(getBackendImplementation()) };
  })();

  return arrencada;
}

/**
 * Arrencada automàtica per als entorns que no configuren res.
 *
 * `setTimeout(…, 0)` és una MACROtasca, no una microtasca: la finestra
 * d'injecció és més ampla del que deia el comentari anterior. Tot i així
 * només arriba a temps un `<script>` SÍNCRON del host. Amb `defer`, `async`
 * o `type="module"` el host arriba tard i `configura()` llançarà.
 */
export function arrencaAuto() {
  if (autoProgramada || fase === FASE.SEGELLAT) return;
  autoProgramada = true;
  const fes = () => {
    if (fase === FASE.SEGELLAT) return;
    arrenca().catch((e) => {
      console.error('[host] Arrencada fallida. El component no es muntarà:', e);
      if (typeof document !== 'undefined') {
        const sdpTags = document.querySelectorAll('soc-de-poble');
        sdpTags.forEach(tag => {
          tag.innerHTML = `<div class="sdp-arranc-fallida">
            <h3>Error crític d'arrencada</h3>
            <p>Sóc de Poble no ha pogut connectar amb el backend.</p>
            <pre></pre>
          </div>`;
          tag.querySelector('pre').textContent = e.message || String(e);
        });
      }
    });
  };
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      arrencaAutoTimer = setTimeout(fes, 100);
    }, { once: true });
  } else {
    arrencaAutoTimer = setTimeout(fes, 100);
  }
}

/**
 * Cedeix el control del segellat a l'amfitrió, aturant l'arrencada automàtica.
 * S'ha de cridar immediatament després de carregar el bundle.
 */
export function deferArrenca() {
  autoProgramada = true;
  if (arrencaAutoTimer) {
    clearTimeout(arrencaAutoTimer);
    arrencaAutoTimer = null;
  }
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
 * L'amfitrió entrega una sessió. Vàlid en qualsevol fase: les sessions
 * arriben quan l'usuari entra, no quan arranca el bundle. No confon-lo amb
 * `configura()`, que sí que està sotmés al pany del backend.
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

/**
 * El build standalone no és ESM, així que un host que el carregue amb un
 * `<script>` pla necessita un global. És l'ÚNICA assignació a `window` del
 * projecte i està declarada ací, no escampada.
 *
 * IDEMPOTENT (260903): amb `configurable:false` i `writable:false`, una
 * segona crida —bloc i shortcode alhora en la mateixa pàgina, o dos
 * muntatges del bundle— llançava TypeError i matava el segon muntatge
 * sencer. Ara la segona crida torna l'API ja exposada.
 */
export function exposaGlobal(objectiu = (typeof window !== 'undefined' ? window : undefined)) {
  if (!objectiu) return null;

  const existent = Object.getOwnPropertyDescriptor(objectiu, 'SocDePoble');
  if (existent) return existent.value ?? null;

  const api = Object.freeze({ configura, arrenca, arrencaAuto, deferArrenca, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, isReady: true });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  // Avisar a Sollutia o qualsevol integrador que l'API ja està llesta
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
  }
  
  return api;
}
