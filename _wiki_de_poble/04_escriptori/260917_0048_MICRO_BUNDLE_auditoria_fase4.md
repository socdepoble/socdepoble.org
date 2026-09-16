# MICRO BUNDLE - Auditoria Fase 4 (Sollutia Iframe Bridge)

Aquest és un micro-bundle focalitzat exclusivament en els fitxers crítics per a la integració d'identitat entre Sollutia i Sóc de Poble via iframe.

## 1. Informe d'integració a entregar a Sollutia
```markdown
# Informe d'Integració i Enxufabilitat (Sollutia)

Aquest document defineix el contracte d'integració tècnica entre l'aplicació amfitriona (**Sollutia**) i l'aplicació incrustada (**Sóc de Poble**) mitjançant un Iframe segur i comunicació per `postMessage`.

---

## 1. Què necessitem de Sollutia (Prerequisits)

Per tal que el pont de comunicació accepte les ordres de Sollutia de manera segura, necessitem que ens proporcionen:

1. **Llista de Dominis d'Incrustació:** Els URLs exactes des d'on s'incrustarà el nostre iframe (ex: `https://app.sollutia.cat`, `https://admin.sollutia.cat`). Aquests s'afegiran a la nostra llista blanca estricta (`ORIGENS_AMFITRIO_PERMESOS`). Qualsevol altre origen serà bloquejat automàticament.
2. **Estructura del JWT (Opcional):** Si el token de sessió que ens passaran conté "claims" (camps) personalitzats que hem de llegir per a gestionar permisos o rols específics dins de Sóc de Poble.

---

## 2. Com incrustar Sóc de Poble

L'equip de Sollutia només ha d'afegir un `<iframe>` apuntant a la URL de producció de Sóc de Poble en la seua plataforma:

```html
<iframe src="https://socdepoble.org" width="100%" height="100%" frameborder="0"></iframe>
```

---

## 3. Protocol de Comunicació (postMessage)

El pont de comunicació és asíncron i validat per les dues bandes. Sóc de Poble ignorarà qualsevol missatge que no provinga del pare directe i d'un origen autoritzat.

### 3.1. El Handshake inicial (`SDP_READY`)
Sóc de Poble enviarà un missatge al pare tan prompte com estiga carregat i preparat per a rebre ordres.

**El que rebrà Sollutia:**
```json
{
  "type": "SDP_READY",
  "estat": {
    "fase": "segellat",
    "configurable": false,
    "contracte": ["..."],
    "implementat": ["..."]
  }
}
```
*Sollutia ha d'esperar aquest missatge abans d'enviar cap comanda.*

### 3.2. Injecció de Sessió (Login SSO)
Quan l'usuari fa login a Sollutia, Sollutia ha de passar-nos la sessió perquè l'usuari estiga logat també a Sóc de Poble de forma transparent (Zero Fricció).

**El que ha d'enviar Sollutia:**
```javascript
const iframe = document.querySelector('iframe').contentWindow;
iframe.postMessage({
  type: 'SDP_HOST_CMD',
  cmd: 'injectaSessio',
  requestId: 'req-1234', // Opcional, per correlacionar la resposta
  payload: {
    sessio: {
      access_token: 'eyJhbGci...', // JWT vàlid
      user: {
        id: 'uuid-de-l-usuari',
        // ... resta de dades
      }
    },
    opcions: {
      // Opcional: l'issuer exacte del JWT si no coincideix amb l'origen de la pàgina
      // Si s'omet, Sóc de Poble n'esperarà un JWT signat amb emissor = origen actual.
      emissorEsperat: 'https://api.sollutia.cat' 
    }
  }
}, 'https://socdepoble.org'); // Important: sempre targetOrigin estricte
```

**La nostra resposta (`SDP_HOST_ACK`):**
```json
{
  "type": "SDP_HOST_ACK",
  "cmd": "injectaSessio",
  "requestId": "req-1234",
  "ok": true,
  "result": null,
  "error": null
}
```
*(Si `ok` és `false`, el camp `error` contindrà el motiu, per exemple "Sessió invàlida o rebutjada").*

### 3.3. Expulsió de Sessió (Logout)
Quan l'usuari tanca la sessió a Sollutia, ens han d'avisar per tancar-la també a Sóc de Poble.

**El que ha d'enviar Sollutia:**
```javascript
iframe.postMessage({
  type: 'SDP_HOST_CMD',
  cmd: 'expulsaSessio',
  requestId: 'req-5678'
}, 'https://socdepoble.org');
```

**La nostra resposta:**
```json
{
  "type": "SDP_HOST_ACK",
  "cmd": "expulsaSessio",
  "requestId": "req-5678",
  "ok": true
}
```

---

## 4. Consideracions Especials

- **Segellat Automàtic:** Com que anem via iframe, Sóc de Poble s'auto-segella per defecte amb la seua pròpia implementació del backend (Supabase). Sollutia només ha de preocupar-se de gestionar la identitat via `injectaSessio`. La comanda `configura` no és necessària ni aplicable en aquest model d'incrustació per seguretat.
- **Fail-Closed:** Si un payload de sessió està mal format o el token està caducat, Sóc de Poble rebutjarà la injecció silenciosament, mantindrà l'estat d'usuari desconnectat i retornarà `ok: false`.
- **Seguretat del JWT:** 
  > **⚠️ NOTA DE SEGURETAT (JWT):**  
  > El client de Sóc de Poble (l'Iframe) descodifica el JWT per a mostrar la interfície d'usuari de forma optimista, comprovant la caducitat, l'emissor i el UUID. **La verificació criptogràfica de la signatura JWT no ocorre mai al client frontend per seguretat**. La responsabilitat de verificar la integritat i signatura del JWT recau exclusivament en l'API/Backend que reba les peticions HTTP amb eixe token. Sollutia s'ha d'assegurar que els tokens estiguen signats per un emissor de confiança.
```

## 2. src/host.js (Pont d'Iframe i Segellat)
```javascript
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
      if (Array.isArray(accio) && accio[0] === 'sessio') {
        injectaSessio(accio[1], accio[2] || {});
      } else if (Array.isArray(accio) && accio[0] === 'configura') {
        configura(accio[1]);
      }
    }
    // Sobreescriu push per executar directament
    window.SocDePobleCua.push = (...args) => {
      for (const accio of args) {
        if (Array.isArray(accio) && accio[0] === 'sessio') {
          injectaSessio(accio[1], accio[2] || {});
        } else if (Array.isArray(accio) && accio[0] === 'configura') {
          configura(accio[1]);
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
  if (existent) return existent.value ?? null;

  const api = Object.freeze({ configura, arrenca, arrencaAuto, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, quanLlest, isReady: true });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  processarCua();
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
    
    // Pont per a Iframe: permet comunicació bidireccional si el host ens incrusta
    if (window.parent && window.parent !== window) {
      const orígensProduccio = ['https://sollutia.cat', 'https://app.sollutia.cat'];
      const orígensDev = ['http://localhost:5173', 'http://localhost:3000'];
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
        } else if (cmd === 'configura') {
          try {
            if (fase === FASE.SEGELLAT) throw new Error('El backend ja està segellat');
            const res = configura({ backend: payload?.backend });
            const ok = res !== false;
            responHost(ok, res, ok ? null : 'Configuració rebutjada');
          } catch (e) {
            console.error('[host] Error en configura() via iframe:', e);
            responHost(false, null, e.message);
          }
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

```

## 3. src/main.jsx (Punt d'entrada i Race Condition flag)
```javascript
/**
 * main.jsx — Punt d'entrada del build de desenvolupament i del standalone.
 *
 * CANVI 260830: abans cridava `defineCustomElement()` directament, cosa que
 * segellava el backend a l'instant i no deixava cap finestra perquè un host
 * (Sollutia) injectara la seua implementació. Ara l'arrencada passa per
 * `host.js`, que separa configuració i segellat en dues fases.
 *
 * Ordre resultant:
 *   1 · es carrega el bundle i s'exposa `window.SocDePoble`
 *   2 · un <script> del host pot cridar `window.SocDePoble.configura({...})`
 *   3 · `arrencaAuto()` segella i defineix l'element al següent tick
 *
 * Si ningú configura res, el comportament és idèntic al d'abans: Supabase.
 */

import { arrencaAuto, exposaGlobal } from './host.js';

// Si el build standalone no és ESM, un entorn host que el carregue
// amb un script pla necessita un global.
exposaGlobal();

const init = () => {
  // Programa el segellat per al següent tick. Un <script> col·locat després
  // del bundle encara arriba a temps de cridar configura().
  arrencaAuto();

  // Instanciem l'element si trobem l'arrel de muntatge.
  // Açò permet l'ús standalone tant en DEV com en el build final.
  const arrel = document.getElementById('root');
  if (arrel && (!arrel.hasChildNodes() || arrel.innerHTML.trim() === '')) {
    const element = document.createElement('soc-de-poble');
    element.setAttribute('fonts-href', '/fonts/noto-sans.css');
    
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isManual = searchParams ? searchParams.get('arrencada') === 'manual' : false;
    
    if (isManual) {
      element.setAttribute('arrencada', 'manual');
    }

    element.setAttribute('config', JSON.stringify({
      pluginUrl: '/',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      dataMode: import.meta.env.VITE_DATA_MODE || undefined,
      tenantId: import.meta.env.VITE_TENANT_ID || null,
    }));
    arrel.appendChild(element);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

## 4. src/data/identitat.js (Validació de JWT d'adoptaSessioExterna)
```javascript
/**
 * identitat.js — Font única de la identitat.
 *
 * REGLA: si hi ha sessió, la identitat és la de la sessió. El convidat només
 * existix mentre no s'ha entrat, i mai substituix un usuari real.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CORRECCIÓ P0 (260908) · EL CISMA DE LA SESSIÓ
 *
 * Hi havia dues meitats d'un mateix sistema d'autenticació que no es parlaven.
 * La capa efímera es va afegir a l'auditoria 260829 per al verificador PKCE;
 * després algú hi va moure també els tokens, però ni el `user`, ni la lectura
 * d'`identitat()`, ni el `logout()` van fer el mateix viatge:
 *
 *   ESCRIPTURA   _renova() i bescanvia()
 *                  jwt           → setEfimer  (sessionStorage)
 *                  refresh-token → setEfimer  (sessionStorage)
 *                  user          → setVal     (emmagatzematge local)   ← desaparellat
 *
 *   LECTURA      buildHeaders()  → getEfimer  ✓
 *                identitat()     → getVal     ✗  no el trobava MAI
 *
 *   ESBORRAT     logout()        → delVal × 3 ✗  no esborrava cap token
 *
 * Tres conseqüències reals, no teòriques:
 *
 *   1 · `getDefaultUserId()` tornava SEMPRE l'uuid de convidat, encara que la
 *       sessió estiguera oberta. `identitat()` buscava el jwt a emmagatzematge local,
 *       on no ha estat mai.
 *
 *   2 · `logout()` no tancava res. Esborrava tres claus de emmagatzematge local; el jwt
 *       i el refresh-token es quedaven vius a sessionStorage i la petició
 *       següent els tornava a usar. El botó d'eixir era decoratiu.
 *
 *   3 · SESSIÓ FANTASMA, la pitjor de les tres. En tancar la pestanya moria el
 *       sessionStorage però el `user` de emmagatzematge local sobrevivia. En tornar:
 *       `getCurrentUser()` tornava una persona, la interfície es pintava com si
 *       hagueres entrat, `buildHeaders()` enviava la clau anònima i CADA
 *       escriptura moria amb un 42501 de RLS. L'usuari veu que està dins i no
 *       pot fer res, sense cap missatge que explique per què.
 *
 * DECISIÓ: les tres peces de la sessió viuen a la MATEIXA capa, l'efímera.
 * Un token que mor amb la pestanya i un usuari que sobreviu no són una sessió:
 * són dues sessions distintes fingint que són una. El preu és tornar a entrar
 * en obrir el navegador; l'alternativa era baixar els tokens a emmagatzematge local, i
 * a un origen de CMS compartit amb Sollutia i qualsevol altre connector
 * això és regalar la sessió a qui vullga llegir-la.
 * ══════════════════════════════════════════════════════════════════════════
 */
import { getVal, setVal, delVal, getEfimer, setEfimer, delEfimer } from '../config/storage.js';

/**
 * LES CLAUS VIUEN ACÍ I NOMÉS ACÍ.
 *
 * Estaven escrites a mà en quatre fitxers. Per això va ser possible moure'n
 * dues de capa i deixar-se'n una: no hi havia cap lloc on es veren juntes.
 */
export const CLAU_JWT = 'socdepoble-jwt';
export const CLAU_REFRESC = 'socdepoble-refresh-token';
export const CLAU_USUARI = 'socdepoble-user';

const CLAU_CONVIDAT = 'socdepoble-guest-session-id';
const UUID_NUL = '00000000-0000-0000-0000-000000000000';
const RE_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function idConvidat() {
  if (typeof window === 'undefined') return UUID_NUL;
  try {
    let id = getVal(CLAU_CONVIDAT);
    if (!id || !RE_UUID.test(String(id).replace('guest-', ''))) {
      const pseudoRandom = () => 'guest-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    id = crypto?.randomUUID?.() || pseudoRandom();
      setVal(CLAU_CONVIDAT, id);
    } else if (String(id).startsWith('guest-')) {
      id = String(id).replace('guest-', '');
      setVal(CLAU_CONVIDAT, id);
    }
    return id;
  } catch {
    return UUID_NUL;
  }
}

/**
 * Purga el `user` que va quedar a emmagatzematge local abans d'aquesta correcció.
 *
 * SIDE EFFECT DINS D'UNA LECTURA, I ÉS INTENCIONAT. Els testers que ja tenen
 * la Beta instal·lada porten el blob del GoTrue (amb el seu correu) a
 * emmagatzematge local. Si només canviàrem la capa de lectura, eixe blob es quedaria
 * allí per sempre, perquè només `logout()` el tocava i `logout()` ja no mira
 * emmagatzematge local. S'esborra la primera volta que algú òbriga l'app.
 */
function purgaLlegat() {
  if (typeof document !== 'undefined' && /(?:^|; )(?:socdepoble-|sdp:oauth:)/.test(document.cookie)) {
    for (const k of ['socdepoble-jwt','socdepoble-refresh-token','socdepoble-user', 'sdp:oauth:verificador','sdp:oauth:state','sdp:oauth:cb'])
      document.cookie = `${k}=; path=/; max-age=0; SameSite=Lax`;
  }
  if (typeof window === 'undefined') return;
  try {
    if (getVal(CLAU_USUARI, null)) {
      delVal(CLAU_USUARI);
      delVal(CLAU_JWT);
      delVal(CLAU_REFRESC);
    }
  } catch {
    /* Un navegador que no deixa escriure tampoc deixarà llegir res perillós. */
  }
}

/**
 * L'usuari de la sessió, o null.
 *
 * FAIL-CLOSED: sense jwt no hi ha usuari, encara que el blob hi siga. És el que
 * impedix la sessió fantasma. `getCurrentUser()` de supabaseBackend delega ací
 * perquè hi haja un sol lector i no es torne a obrir el cisma.
 */
export function usuariDeSessio() {
  purgaLlegat();
  const jwt = getEfimer(CLAU_JWT, null);
  if (!jwt) return null;
  /* Un token caducat és un token que no val. Sense açò, la interfície pinta
     l'usuari i cada escriptura mor amb 401: la sessió fantasma, versió 2. */
  const exp = caducitatJwt(jwt);
  if (exp !== null && exp <= Date.now()) return null;
  const usuari = getEfimer(CLAU_USUARI, null);
  return usuari && usuari.id ? usuari : null;
}

/** Guarda la sessió sencera d'una sola volta. Les tres peces o cap. */
export function desaSessio(sessio) {
  if (!sessio?.access_token) return false;
  setEfimer(CLAU_JWT, sessio.access_token);
  setEfimer(CLAU_REFRESC, sessio.refresh_token);
  setEfimer(CLAU_USUARI, sessio.user);
  return true;
}

/** Actualitza camps de l'usuari a la sessió efímera i avisa la UI via sdp:auth-change. */
export function actualitzaUsuariSessio(novesDades = {}) {
  const usuari = getEfimer(CLAU_USUARI, null);
  if (!usuari) return null;

  const actualitzat = {
    ...usuari,
    ...novesDades,
    user_metadata: {
      ...(usuari.user_metadata || {}),
      ...(novesDades.user_metadata || {}),
      ...(novesDades.avatar_url ? { avatar_url: novesDades.avatar_url } : {}),
      ...(novesDades.full_name ? { full_name: novesDades.full_name, name: novesDades.full_name } : {}),
      ...(novesDades.town_name ? { town_name: novesDades.town_name } : {})
    },
    ...(novesDades.avatar_url ? { avatar_url: novesDades.avatar_url } : {})
  };

  setEfimer(CLAU_USUARI, actualitzat);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: actualitzat } }));
  }

  return actualitzat;
}

/** Esborra la sessió sencera. Les dues capes: la nova i el llegat. */
export function esborraSessio() {
  delEfimer(CLAU_JWT);
  delEfimer(CLAU_REFRESC);
  delEfimer(CLAU_USUARI);
  /* El llegat també, perquè qui tanque sessió no s'emporte el fantasma. */
  delVal(CLAU_JWT);
  delVal(CLAU_REFRESC);
  delVal(CLAU_USUARI);
}

/** Torna { id, autenticat, usuari }. Mai llança. */
export function identitat() {
  const usuari = usuariDeSessio();
  if (usuari) return { id: String(usuari.id), autenticat: true, usuari };
  return { id: idConvidat(), autenticat: false, usuari: null };
}

export const getDefaultUserId = () => identitat().id;

/** Oblida el convidat quan ja no fa falta (part del protocol d'Apoptosi). */
export function oblidaConvidat() {
  delVal(CLAU_CONVIDAT);
}

export async function reclamaContingutDelConvidat() {
  // Mode Online-First: la persistència recau completament en el backend.
  return { migrat: 0 };
}

/** Marge abans de la caducitat real. 60 s cobrix la deriva de rellotge del client. */
export const MARGE_RENOVACIO_MS = 60_000;

/**
 * `exp` del JWT en ms, o null.
 *
 * NO VERIFICA LA SIGNATURA I NO HO HA DE FER. Un client no pot validar res:
 * no té la clau. Açò només servix per a saber QUAN demanar la renovació i no
 * esperar el 401. Qui decidix si el token val és Sollutia, sempre.
 * Un `exp` mentit per l'usuari només el perjudica a ell: renovarà abans.
 */
export function caducitatJwt(jwt = getEfimer(CLAU_JWT, null)) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const carrega = JSON.parse(decodeURIComponent(
      atob(b64 + '='.repeat((4 - b64.length % 4) % 4))
        .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    return typeof carrega.exp === 'number' ? carrega.exp * 1000 : null;
  } catch {
    return null;   // token opac o corromput: que decidisca el servidor
  }
}

/** true si el token ja no val. Sense token → true. */
export function sessioCaducada() {
  const exp = caducitatJwt();
  return exp === null ? !getEfimer(CLAU_JWT, null) : exp <= Date.now();
}

/**
 * Accepta una sessió emesa per l'amfitrió (Sollutia).
 *
 * FAIL-CLOSED. Es rebutja i es torna `false` si:
 *   · no hi ha access_token, o no té forma de JWT
 *   · ja està caducat
 *   · `sub` no és un uuid
 *   · l'emissor no és el que esperem (si se'n declara un)
 *
 * El que NO comprova: la signatura. Ací no es pot. Si Sollutia envia un token
 * fals, la primera crida a PostgREST tornarà 401 i el `logout()` del reintent
 * el traurà. Esta funció evita pintar una sessió òbviament morta, no suplix
 * la verificació del servidor.
 */
export function adoptaSessioExterna(sessio, { emissorEsperat = null } = {}) {
  if (!sessio || typeof sessio !== 'object') return false;
  
  if (!emissorEsperat) {
    console.warn('[identitat] adoptaSessioExterna: emissorEsperat és obligatori per seguretat. Injecció rebutjada.');
    return false;
  }
  
  const { access_token: jwt, refresh_token: refresc, user } = sessio;
  if (typeof jwt !== 'string' || jwt.split('.').length !== 3) return false;

  const exp = caducitatJwt(jwt);
  if (exp !== null && exp <= Date.now()) return false;

  let carrega = null;
  try {
    const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    carrega = JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)));
  } catch { return false; }

  if (!carrega?.sub || !RE_UUID.test(String(carrega.sub))) return false;
  if (carrega.iss !== emissorEsperat) return false;

  if (carrega.aud && carrega.aud !== 'socdepoble.org' && carrega.aud !== emissorEsperat) {
    console.warn(`[identitat] adoptaSessioExterna: aud incorrecte (${carrega.aud}). Sessió rebutjada.`);
    return false;
  }

  // Permetem a l'usuari extern proveir dades addicionals, però validant l'identificador
  // Sanegem les dades per evitar injeccions a user_metadata
  const allowedMetadata = ['avatar_url', 'full_name', 'name', 'email'];
  const cleanMetadata = {};
  if (user?.user_metadata) {
    allowedMetadata.forEach(k => {
      if (user.user_metadata[k] !== undefined) cleanMetadata[k] = user.user_metadata[k];
    });
  }

  const usuariFinal = (user && user.id === carrega.sub)
    ? { ...user, user_metadata: cleanMetadata }
    : { id: carrega.sub, email: carrega.email ?? null, user_metadata: cleanMetadata };

  const desada = desaSessio({ access_token: jwt, refresh_token: refresc ?? null, user: usuariFinal });
  if (!desada) return false;

  oblidaConvidat();   // ja no és convidat: el protocol d'Apoptosi tanca ací
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuariFinal } }));
  }
  return true;
}
```
<<<FI_DEL_BUNDLE>>>
