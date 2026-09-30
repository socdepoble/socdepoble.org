/**
 * PedraSecaEmbed.jsx — <soc-de-poble>
 * ---------------------------------------------------------------------------
 * Correccions respecte de la versió auditada:
 *
 *  P0-1 MORT PER MOVIMENT DE DOM. `connectedCallback` es protegia amb
 *       `if (!this._closedRoot)`. shadow root SOBREVIU a un moviment de node, així que en tornar a
 *       connectar la guarda impedia tornar a muntar: el component quedava mort
 *       per sempre. Si el host (entorn de l'usuari) mou nodes constantment.
 *       Ara la guarda és sobre l'arrel de React i el shadow root es reaprofita.
 *
 *  P0-2 CURSA DEL setTimeout. El desmuntatge diferit s'executava encara que el
 *       node es reconnectara dins del mateix tick, matant l'arrel nova. Ara es
 *       cancel·la a `connectedCallback`.
 *
 *  P0-3 FONTS DINS DEL SHADOW ROOT. Un `@font-face`
 *       declarat dins d'un shadow root NO es registra: només compta l'arbre del
 *       document. A més, les URL relatives de `noto-sans.css` es resoldrien
 *       malament. Les fonts es carreguen
 *       ara al document, una sola vegada, via `fonts-href`.
 *
 *  P0-4 CSS DUPLICAT PER INSTÀNCIA. Cada instància injectava una còpia sencera
 *       del full (~150 kB). Ara es comparteix un únic `CSSStyleSheet` mitjançant
 *       `adoptedStyleSheets`.
 *
 *  P0-5 CONFIG MUTADA EN LLOC. `this.config` es mutava conservant la identitat
 *       de l'objecte, així que qualsevol `useMemo`/comparació per referència
 *       aigües avall veia el valor vell. Ara cada canvi crea un objecte nou.
 *       Llevar un atribut tampoc no netejava mai el valor: ara sí.
 *
 *  260929 ENXUFE UNIVERSAL. L'element no sap quin amfitrió té davant
 *       (Sollutia, WordPress de proves, MediaWiki demà): tres polítiques que
 *       valen per a tots.
 *       · ROUTER. Ací es forçava routerType 'browser', i dins de qualsevol
 *         amfitrió l'app es feia ama de la URL: a /comunitat/ pintava «no
 *         trobat» i escrivia a l'historial de l'amfitrió. Ara tria
 *         politicaRouter.js:triaRouter(). El navegador només s'usa si algú el
 *         declara (routerType 'browser', com fa embed.jsx al #root, o una base
 *         `base-path`); sense declaració, memòria, que aterra a `rutaInicial`
 *         o, si l'amfitrió diu el poble, a /pobles/<poble>.
 *       · CAPÇALERA. `manageDocumentHead` és opt-in estricte: només el booleà
 *         true. Penjar de #root ja no és cap declaració: el <title> i el
 *         canonical són de l'amfitrió fins que ell diga el contrari.
 *       · CANAL DE L'AMFITRIÓ. `window.SocDePobleConfig` (configAmfitrio.js)
 *         entra a cada recàlcul i només en porta `nomPoble` i `poble`.
 *         configura({config}), el JSON, els atributs i la propietat JS el
 *         trepitgen. L'element el llig; no l'escriu mai.
 *       · PRECEDÈNCIA, de més baixa a més alta (composaCapes()): defectes del
 *         paquet < SocDePobleConfig < configura({config}) < config-id <
 *         config < atributs < propietat JS. Abans configura() només entrava
 *         per davall de tot, dins de normalizeBackendConfig, i el global li
 *         guanyava.
 *       · DEFECTES DEL PAQUET (Model B). Sóc de Poble tria i segella el
 *         backend: amb el marcatge universal de tres peces l'element pren el
 *         backend de compilació, el mateix que embed.jsx dona al #root.
 *       Les claus noves passen per un sanejador tipat a sanejaConfig().
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from './app/contexts/RouterContext.jsx';
import App from './app/App.jsx';
import { SessionProvider } from './app/contexts/SessionContext.jsx';
import { UIProvider } from './app/contexts/UIContext.jsx';
import { IdentitatProvider } from './app/contexts/IdentitatContext.jsx';
import styles from './css/index.css?inline';
import { readThemePreference, resolveTheme } from './config/theme';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { normalizeBackendConfig } from './config/backendConfig.js';
import { getRuntimePolicy } from './config/runtimePolicy.js';
import { normalitzaBase, triaRouter } from './app/contexts/politicaRouter.js';
import { llegeixConfigAmfitrio, sanejaEtiqueta, sanejaIdentificador, sanejaRuta } from './config/configAmfitrio.js';
import { baseRecursos, fixaBaseRecursos, resolveAsset } from './config/assetResolver.js';
import { permetOrigenMitjans } from './utils/sanitize.js';
import { esLlenguaSuportada } from './config/i18n.js';

/* ───────────────────────────── Error boundary ──────────────────────────── */
export default function PedraSecaEmbed({ config: suppliedConfig, themeMode, language, isFirstInstance, targetNode }) {
  const config = React.useMemo(() => normalizeBackendConfig(suppliedConfig), [suppliedConfig]);
  /* El router pertany al muntatge: canviar-lo destruiria la navegació. La
     tria és la política universal (politicaRouter.js): sense cap declaració,
     memòria, i la URL de l'amfitrió no es toca. */
  const [router] = React.useState(() => triaRouter(config, { primeraInstancia: isFirstInstance !== false }));

  const uiConfig = React.useMemo(() => {
    return {
      ...config,
      ...(themeMode ? { themeMode } : {}),
      ...(language ? { language } : {})
    };
  }, [config, themeMode, language]);

  const app = (
    <UIProvider externalConfig={uiConfig}>
      <SessionProvider config={config}>
        <IdentitatProvider config={config}>
          <App config={config} targetNode={targetNode} />
        </IdentitatProvider>
      </SessionProvider>
    </UIProvider>
  );

  return (
    <ErrorBoundary>
      {router.memoria
        ? <MemoryRouter rutaInicial={config.rutaInicial}>{app}</MemoryRouter>
        : <BrowserRouter basename={router.basename}>{app}</BrowserRouter>}
    </ErrorBoundary>
  );
}

/* ──────────────────── Full d'estils compartit (P0-4) ───────────────────── */

let fullCompartit = null;

function obtenirFull() {
  if (fullCompartit) return fullCompartit;
  if (typeof CSSStyleSheet === 'undefined') return null;
  try {
    const full = new CSSStyleSheet();
    full.replaceSync(styles);
    fullCompartit = [full];
    return fullCompartit;
  } catch {
    return null; /* navegador sense adoptedStyleSheets → recurs de <style> */
  }
}

/* ─────────────────────── Fonts al document (P0-3) ──────────────────────── */

const fontRefCount = new Map();

function carregarFonts(href) {
  if (!href || typeof document === 'undefined') return;
  const key = encodeURIComponent(href);
  const current = fontRefCount.get(key) || 0;
  fontRefCount.set(key, current + 1);

  if (current === 0 && !document.querySelector(`link[data-sdp-fonts="${key}"]`)) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'style';
    preload.href = href;
    preload.setAttribute('data-sdp-fonts-preload', key);
    document.head.appendChild(preload);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-sdp-fonts', key);
    document.head.appendChild(link);
  }
}

function descarregarFonts(href) {
  if (!href || typeof document === 'undefined') return;
  const key = encodeURIComponent(href);
  const current = fontRefCount.get(key) || 0;
  fontRefCount.set(key, Math.max(0, current - 1));

  if (fontRefCount.get(key) === 0) {
    const link = document.querySelector(`link[data-sdp-fonts="${key}"]`);
    if (link) link.remove();
    const preload = document.querySelector(`link[data-sdp-fonts-preload="${key}"]`);
    if (preload) preload.remove();
  }
}

/* ───────────────────────────── Element custom ──────────────────────────── */

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export const activeElements = new Set();

/**
 * ADVERTIMENT DE SEGURETAT (SOLLUTIA):
 * Els atributs `supabase-url` i `supabase-anon-key` no haurien de ser configurables
 * per editors de contingut o rols no administradors de CMS. Un atacant amb capacitat
 * d'alterar l'HTML de la pàgina podria canviar `supabase-url` cap a un servidor propi i
 * segrestar les credencials dels usuaris quan facen login. Aquests atributs s'han
 * d'injectar des del backend o mitjançant `window.SocDePoble.configura()`.
 */
const ATRIBUTS = Object.freeze({
  'backend-url': 'supabaseUrl',
  'tenant-id': 'tenantId',
  'base-path': 'basePath',
  'supabase-url': 'supabaseUrl',
  'supabase-anon-key': 'supabaseAnonKey',
  'data-mode': 'dataMode',
  'bot-api-url': 'botApiUrl',
  'fonts-href': 'fontsHref',
  'plugin-url': 'pluginUrl',
  'oauth-relay-url': 'oauthRelayUrl',
  'sollutia-issuer': 'sollutiaIssuer',
  'nom-poble': 'nomPoble',
  'poble': 'poble',
  'ruta-inicial': 'rutaInicial'
});

const CLAUS_PERMESES = Object.freeze(new Set([
  'basePath','supabaseUrl','supabaseAnonKey','dataMode','botApiUrl',
  'fontsHref','pluginUrl','routerType','basename','tenantId','language','themeMode',
  'manageDocumentHead', 'version', 'oauthRelayUrl', 'sollutiaIssuer', 'backendId',
  'nomPoble', 'poble', 'rutaInicial'
]));

/* Claus tipades: el valor que el seu sanejador no accepta desapareix, no
   arriba mai a l'app com a text cru. `undefined` vol dir «fora». */
const SANEJADORS_TIPATS = Object.freeze({
  nomPoble: sanejaEtiqueta,
  poble: sanejaIdentificador,
  rutaInicial: sanejaRuta,
  basename: (valor) => normalitzaBase(valor) || undefined,
  routerType: (valor) => (valor === 'browser' || valor === 'memory' ? valor : undefined),
  manageDocumentHead: (valor) => (typeof valor === 'boolean' ? valor : undefined),
  /* T1 (260930): només els codis exactes del selector (ca, es, en, eu, gl).
     'en-US', 'fr', 42 o '' desapareixen i l'app es queda en valencià. */
  language: (valor) => (esLlenguaSuportada(valor) ? valor : undefined)
});

/* Origen d'on s'ha carregat el paquet, tal com el va deduir assetResolver.js
   en avaluar-se, ABANS que cap element hi fixe el seu `plugin-url`. És l'únic
   origen de fonts que es refia sense llista: un atribut de l'etiqueta no pot
   declarar-se'l a si mateix. Buit si el paquet no sap on viu. */
const ORIGEN_DEL_PAQUET = origenAbsolut(baseRecursos());

function origenAbsolut(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return '';
  try { return new URL(url).origin; } catch { return ''; }
}

/* ─────────────────── Capes de configuració (260929) ─────────────────── */

/* Model B: Sóc de Poble tria i segella el backend, i l'amfitrió no l'ha de
   saber mai. Amb el marcatge universal de tres peces (global + <soc-de-poble
   plugin-url fonts-href> + paquet) l'element no rebia ni supabaseUrl ni clau,
   i el mode remot petava a data/supabase/runtime.js. Ara pren, per davall de
   tota la resta, el backend de compilació que el standalone ja dona al seu
   #root (embed.jsx). Només hi entren les variables que són text no buit: una
   buida no tapa cap capa. Es congelen una vegada, en avaluar el paquet, i
   passen per sanejaConfig() com qualsevol capa (l'origen de VITE_SUPABASE_URL
   ja és a la seua llista permesa). */
function nomesTextNoBuit(valors) {
  const net = {};
  for (const [clau, valor] of Object.entries(valors)) {
    if (typeof valor === 'string' && valor.trim()) net[clau] = valor.trim();
  }
  return Object.freeze(net);
}

export const DEFECTES_DEL_PAQUET = nomesTextNoBuit({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  dataMode: import.meta.env.VITE_DATA_MODE,
  tenantId: import.meta.env.VITE_TENANT_ID
});

/* configura({config}) tal com el deixa host.js a la política d'execució, ja
   passat per normalizeBackendConfig. La normalització hi afig claus que ningú
   no ha declarat: supabaseUrl '' i tenantId null no són cap declaració i no
   tapen els defectes del paquet. Els àlies del backend ja són a la seua clau
   canònica (supabaseUrl, tenantId): si viatjaren, normalizeBackendConfig els
   preferiria a l'atribut supabase-url, que és una capa de més amunt. */
const ALIES_DEL_BACKEND = Object.freeze(new Set(['backendUrl', 'backend_url', 'tenant_id']));

function capaDeConfigura() {
  let base;
  try { base = getRuntimePolicy(true)?.rawHostConfig; } catch { return {}; }
  if (!base || typeof base !== 'object') return {};
  const capa = {};
  
  const backendUrl = base.backend_url ?? base.backendUrl ?? base.supabaseUrl;
  if (backendUrl !== undefined && backendUrl !== null && backendUrl !== '') {
    capa.supabaseUrl = String(backendUrl).replace(/\/$/, '');
  }
  const tenantId = base.tenant_id ?? base.tenantId;
  if (tenantId !== undefined && tenantId !== null && tenantId !== '') {
    capa.tenantId = tenantId;
  }
  
  for (const [clau, valor] of Object.entries(base)) {
    if (ALIES_DEL_BACKEND.has(clau) || valor === undefined || valor === null || valor === '') continue;
    capa[clau] = valor;
  }
  return capa;
}

/**
 * Les capes, de prioritat més baixa a més alta:
 *   defectes del paquet < window.SocDePobleConfig < configura({config})
 *     < config-id < config < atributs < propietat JS `config`.
 * El resultat és cru: sanejaConfig() el neteja i, ja fusionat, deriva la ruta
 * inicial del poble que ha guanyat si ningú n'ha declarat una de vàlida.
 */
function composaCapes({ json = {}, atributs = {}, propietat = {} } = {}) {
  return {
    ...DEFECTES_DEL_PAQUET,
    ...llegeixConfigAmfitrio(),
    ...capaDeConfigura(),
    ...json,
    ...atributs,
    ...propietat
  };
}

export function sanejaConfig(cru) {
  cru = normalizeBackendConfig(cru);
  const net = {};
  for (const clau of CLAUS_PERMESES) {
    if (clau in cru) net[clau] = cru[clau];
  }
  const CAMPOS_URL = Object.freeze(['supabaseUrl', 'botApiUrl', 'basePath', 'pluginUrl', 'fontsHref', 'oauthRelayUrl', 'sollutiaIssuer']);
  
  // Orígens específics permesos.
  const ORIGENS_PERMESOS = [
    'https://auth.socdepoble.org', 'https://socdepoble.sollutia.com', 'https://socdepoble.sollutia.cat'
  ];
  const trustedEndpoint = getRuntimePolicy(true)?.backendConfig?.backendUrl;
  if (trustedEndpoint) ORIGENS_PERMESOS.push(new URL(trustedEndpoint).origin);
  
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) {
    try {
      ORIGENS_PERMESOS.push(new URL(import.meta.env.VITE_SUPABASE_URL).origin);
    } catch { /* ignorar url invàlida al env */ }
  }
  
  // En mode de desenvolupament permetem localhost
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    ORIGENS_PERMESOS.push(
      'http://localhost:5173', 'http://localhost:4173', 'http://localhost:8000', 
      'http://localhost:3340', 'http://127.0.0.1:54321', 'http://localhost:54321', 
      'http://127.0.0.1:5173'
    );
  }
  
  const FONTS_PERMESES = Object.freeze(['https://fonts.googleapis.com', 'https://fonts.bunny.net']);

  for (const field of CAMPOS_URL) {
    if (net[field]) {
      try {
        const cruUrl = net[field];
        if (cruUrl.startsWith('//')) { delete net[field]; continue; } // bloqueig de protocol-relative
        const u = new URL(cruUrl, window.location.origin);
        if (u.protocol !== 'https:' && u.protocol !== 'http:' && !cruUrl.startsWith('/')) {
          delete net[field];
          continue;
        }
        
        // Bloqueig de P0: allowlist estricta sense comodins de supabase.co
        if (field === 'supabaseUrl' || field === 'botApiUrl' || field === 'oauthRelayUrl' || field === 'sollutiaIssuer') {
          const uOrigin = u.origin;
          if (!ORIGENS_PERMESOS.some((o) => uOrigin === new URL(o).origin)) {
            delete net[field];
          }
        }
        
        if (field === 'fontsHref') {
          if (!FONTS_PERMESES.some((o) => u.origin === new URL(o).origin) && u.origin !== window.location.origin
            && u.origin !== ORIGEN_DEL_PAQUET) {
            delete net[field];
          }
        }
      } catch { delete net[field]; }
    }
  }

  for (const [clau, saneja] of Object.entries(SANEJADORS_TIPATS)) {
    if (!(clau in net)) continue;
    const valor = saneja(net[clau]);
    if (valor === undefined) delete net[clau];
    else net[clau] = valor;
  }
  // Qui entra per l'enxufe aterra al xat, si ningú no ha dit una altra ruta.
  if (net.poble && !net.rutaInicial) net.rutaInicial = '/xat';

  return Object.freeze(net);
}

class SocDePobleElement extends BaseElement {
  static get observedAttributes() {
    return [...Object.keys(ATRIBUTS), 'config', 'config-id', 'pinta-amfitrio'];
  }

  constructor() {
    super();
    let preConfig = {};
    if (Object.prototype.hasOwnProperty.call(this, 'config')) {
      preConfig = this.config;
      delete this.config;
    }
    this._config = {};
    this._configProp = preConfig && typeof preConfig === 'object' ? preConfig : {};
    this._root = null;
    this._punt = null;
    this._pendingUnmount = false;
    this._graceTimer = null;
    this._hasMountedReact = false;
    this._manualLanguage = null;
  }

  /** Propietat JS: permet passar objectes rics (Sollutia, React host, Vue…). */
  set config(valor) {
    this._configProp = valor && typeof valor === 'object' ? valor : {};
    this._recalcularConfig();
    this._render();
  }
  get config() {
    return this._config;
  }

  connectedCallback() {
    this._pendingUnmount = false;
    if (this._unmountListener) {
      document.removeEventListener('visibilitychange', this._unmountListener);
      this._unmountListener = null;
    }

    /*
     * P0-6 GERMÀ ASSASSINAT (260831, Seient Núm. 5).
     *
     * Ací hi havia dues branques. La segona neteja zombis —nodes que ja no són
     * al document i el `disconnectedCallback` dels quals no ha arribat a
     * desmuntar-los— i és correcta. La primera desmuntava germans amb
     * `old.isConnected` CERT: és a dir, instàncies vives i sanes.
     *
     * El comentari deia «Últim que arriba guanya», que era una política
     * d'instància única mai declarada enlloc. En un host complex no s'aguanta:
     * es pot posar dos blocs a la mateixa pàgina. Muntar el segon deixava
     * el primer en blanc, sense error a la consola.
     *
     * Ara només es netegen zombis. Dues instàncies vives conviuen.
     */
    const elementsActuals = Array.from(activeElements);
    for (const old of elementsActuals) {
      if (old === this) continue;
      if (old.isConnected) continue; // germà viu: no es toca
      if (typeof old._desmuntaAra === 'function') old._desmuntaAra();
    }

    activeElements.add(this);
    this._hasMountedReact = true;

    // Escolta de bus intern (window) i reemissió (P0-Sollutia)
    if (!this._reemissorEvents) {
      this._reemissorEvents = (e) => {
        if (e.detail?._sdp_reemitted) return;
        const detail = { ...e.detail, _sdp_reemitted: true };
        this.dispatchEvent(new CustomEvent(e.type.replace(':', '-'), {
          detail,
          bubbles: true,
          composed: true
        }));
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('sdp:auth-change', this._reemissorEvents);
        window.addEventListener('sdp:navega', this._reemissorEvents);
        window.addEventListener('sdp:error', this._reemissorEvents);
        // T1: l'amfitrió pot escoltar `sdp-language-changed` a l'element.
        window.addEventListener('sdp:language-changed', this._reemissorEvents);
      }
    }

    /* El shadow root sobreviu als moviments: es reaprofita, no es recrea. */
    if (!this._closedRoot) this._closedRoot = this.attachShadow({ mode: 'closed' });

    const arrel = this._closedRoot;
    const full = obtenirFull();
    if (full && 'adoptedStyleSheets' in arrel) {
      try {
        let currentSheets = Array.from(arrel.adoptedStyleSheets);
        full.forEach(sheet => {
          if (!currentSheets.includes(sheet)) currentSheets.push(sheet);
        });
        arrel.adoptedStyleSheets = currentSheets;
      } catch {
        // Fallback robust per a certs entorns amfitrions que trenquen adoptedStyleSheets
      }
    } 
    
    if (!full || !('adoptedStyleSheets' in arrel) || arrel.adoptedStyleSheets.length === 0) {
      if (!arrel.querySelector('style[data-sdp-fallback]')) {
        const style = document.createElement('style');
        style.setAttribute('data-sdp-fallback', '');
        style.textContent = styles;
        arrel.prepend(style);
      }
    }

    if (!this._punt || !this._punt.isConnected) {
      this._punt = document.createElement('div');
      this._punt.className = 'sdp-root';
      arrel.appendChild(this._punt);
    }

    this._recalcularConfig();
    this.dataset.theme = resolveTheme(this._config.themeMode ?? readThemePreference());
    this._escoltaTemaDelSistema();
    this._pintaAmfitrio();

    /* P0-1: la guarda va sobre l'arrel de React, no sobre el shadow root. */
    if (!this._root) {
      /* Auditoria 260830: ací hi havia freezeImplementation(). Segellar el
         backend dins del cicle de vida deixava una finestra d'injecció de zero
         mil·lisegons, perquè customElements.define() dispara connectedCallback
         síncronament quan l'etiqueta ja és al DOM.
         El segellat viu ara a src/host.js:arrenca(). Vegeu tractor-enxufe.mjs. */
      this._root = createRoot(this._punt);
    }
    this._render();
  }

  attributeChangedCallback(nom) {
    if (!this.isConnected) return;

    /* `pinta-amfitrio` no viu a ATRIBUTS (no és configuració de l'app, és
       un permís sobre el document). `_recalcularConfig()` tornaria fals i el
       canvi en calent no faria res, així que s'atén a banda. */
    if (nom === 'pinta-amfitrio') {
      if (this.hasAttribute('pinta-amfitrio')) this._pintaAmfitrio();
      else SocDePobleElement._despintaAmfitrio();
      return;
    }

    if (this._recalcularConfig()) {
      this._render();
    }
  }

  /** P0-5: objecte nou cada vegada; levar un atribut esborra el valor. */
  _recalcularConfig() {
    const desDAtributs = {};
    for (const [attr, clau] of Object.entries(ATRIBUTS)) {
      const v = this.getAttribute(attr);
      if (v !== null) desDAtributs[clau] = v;
    }

    let desDeJson = {};
    const configId = this.getAttribute('config-id');
    if (configId) {
      try {
        const scriptEl = document.getElementById(configId);
        if (scriptEl && scriptEl.type === 'application/json') {
          const parsed = JSON.parse(scriptEl.textContent);
          if (parsed && typeof parsed === 'object') desDeJson = parsed;
        }
      } catch {
        console.warn('[soc-de-poble] L\'atribut "config-id" no s\'ha pogut llegir.');
      }
    }

    const cru = this.getAttribute('config');
    if (cru) {
      try {
        const parsed = JSON.parse(cru);
        if (parsed && typeof parsed === 'object') desDeJson = { ...desDeJson, ...parsed };
      } catch {
        console.warn('[soc-de-poble] L\'atribut "config" no és JSON vàlid; s\'ignora.');
      }
    }

    /* Les capes, en l'ordre de composaCapes(). El global i la política es
       tornen a llegir a cada recàlcul. Cap valor per defecte de router ni de
       capçalera: els decidix qui declara (vegeu la capçalera, 260929); el
       paquet només hi posa el seu backend. */
    const configObject = composaCapes({ json: desDeJson, atributs: desDAtributs, propietat: this._configProp });
    if (!configObject.pluginUrl && this.getAttribute('plugin-url')) {
      configObject.pluginUrl = this.getAttribute('plugin-url');
    }

    const rawConfig = sanejaConfig(configObject);
    
    let canviat = false;
    if (!this._config || JSON.stringify(rawConfig) !== JSON.stringify(this._config)) {
      canviat = true;
    }

    if (canviat) {
      const oldFontsHref = this._config?.fontsHref;
      this._config = Object.freeze({ ...rawConfig });
      if (oldFontsHref && oldFontsHref !== this._config.fontsHref) {
        descarregarFonts(oldFontsHref);
      }
      if (this._config.fontsHref && oldFontsHref !== this._config.fontsHref) {
        carregarFonts(this._config.fontsHref);
      }
      this._aplicaBaseRecursos();
    }
    return canviat;
  }

  /* Recursos (imatges de public/) des d'on viu el paquet, no des de l'arrel
     de l'amfitrió. Un `plugin-url` explícit mana sobre la base que el paquet
     va deduir de si mateix; '/' no és cap declaració. Sense base no es toca
     res: ni estil a l'element ni orígens de mitjans (Llei del Píxel). */
  _aplicaBaseRecursos() {
    const pluginUrl = typeof this._config?.pluginUrl === 'string' ? this._config.pluginUrl.trim() : '';
    if (pluginUrl && pluginUrl !== '/') fixaBaseRecursos(pluginUrl);

    const base = baseRecursos();
    if (!base) return;
    /* tokens.css declara el fons del Xat a :root i :host, no a .sdp-root:
       el valor de l'element l'hereta l'arbre de dins del shadow root. La base
       ja ve sense cometes ni espais (assetResolver.js), i cap no trenca el url(). */
    this.style.setProperty('--sdp-xat-fons-imatge', `url("${resolveAsset('assets/system/ui/xat-bg-map-v2.jpg')}")`);

    /* Les imatges de contingut sanejat són nostres encara que vinguen d'un
       altre origen: sense açò, sanitize.js les bloquejaria com a far de tercers. */
    const origen = origenAbsolut(base);
    if (origen && typeof window !== 'undefined' && origen !== window.location.origin) permetOrigenMitjans(base);
  }

  _render() {
    if (!this._root) return;
    const isFirstInstance = Array.from(activeElements)[0] === this;
    this._root.render(
      <PedraSecaEmbed 
        config={this._config} 
        themeMode={this._manualTheme} 
        language={this._manualLanguage}
        isFirstInstance={isFirstInstance}
        targetNode={this._closedRoot}
      />
    );
  }

  // API Pública per a Sollutia
  refreshData() {
    if (this._punt) {
      this._punt.dispatchEvent(new CustomEvent('sdp:refresh-data', { bubbles: true, composed: true }));
    }
  }
  
  getCurrentUser() {
    return import('./data/backendPort.js').then(m => m.getCurrentUser());
  }

  on(event, callback) {
    this.addEventListener(event, callback);
  }

  setTheme(theme) {
    this._manualTheme = theme;
    this.dataset.theme = resolveTheme(theme);
    this._pintaAmfitrio();
    this._render();
  }

  /* ══════════════════ P0-8 · MARC BRILLANT (260831) ══════════════════
   *
   * `blank.php` pinta `html, body` amb `background-color: var(--sdp-bg,…)`.
   * `--sdp-bg` viu ara als blocs de tema del sistema de disseny, dins del
   * shadow root. Però les propietats personalitzades hereten CAP AVALL: un
   * token declarat a `:host` mai arriba a `html`, que és son pare. Per tant
   * `blank.php` pintava sempre el fallback beix i, en mode fosc, l'app negra
   * quedava emmarcada en clar. De nit, per a gent gran, això enlluerna.
   *
   * L'única via que travessa la frontera cap amunt és JavaScript. Es llig el
   * valor JA CALCULAT pel tema actiu i es publica al document. Cap color viu
   * al PHP ni al JS: la font de veritat continua sent el CSS.
   *
   * És OPT-IN (`pinta-amfitrio`). Sense la guarda, incrustar el component com
   * un bloc més dins d'un article repintaria el fons del lloc sencer. Només
   * la plantilla de pàgina completa demana este comportament.
   */
  _pintaAmfitrio() {
    if (typeof document === 'undefined') return;
    if (!this.hasAttribute('pinta-amfitrio')) return;
    const punt = this._punt;
    if (!punt || !punt.isConnected) return;

    let valor = '';
    try {
      valor = getComputedStyle(punt).getPropertyValue('--sdp-fons-app').trim();
    } catch {
      return; // entorns sense layout (jsdom parcial): millor no tocar res
    }
    if (!valor) return;

    const arrel = document.documentElement;
    /* Es guarda el valor previ una sola vegada per a poder-lo restituir:
       la pàgina amfitriona pot tindre el seu i no és nostre. */
    if (SocDePobleElement._fonsPrevi === undefined) {
      SocDePobleElement._fonsPrevi = arrel.style.getPropertyValue('--sdp-bg');
    }
    arrel.style.setProperty('--sdp-bg', valor);
    arrel.dataset.sdpTheme = this.dataset.theme || '';
  }

  /** Deixa el document com estava. La crida l'última instància que se'n va. */
  static _despintaAmfitrio() {
    if (typeof document === 'undefined') return;
    const arrel = document.documentElement;
    const previ = SocDePobleElement._fonsPrevi;
    if (previ) arrel.style.setProperty('--sdp-bg', previ);
    else arrel.style.removeProperty('--sdp-bg');
    delete arrel.dataset.sdpTheme;
    SocDePobleElement._fonsPrevi = undefined;
  }

  /* El tema «system» llegia `prefers-color-scheme` una sola vegada i es
   * quedava congelat. Si l'usuària canvia el mode del telèfon amb la pàgina
   * oberta, el component ha de seguir-la. */
  _escoltaTemaDelSistema() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (this._mqTema) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const alCanviar = () => {
      const mode = this._config.themeMode ?? readThemePreference();
      if (mode !== 'system') return;
      this.dataset.theme = resolveTheme('system');
      this._pintaAmfitrio();
      this._render();
    };
    /* Safari < 14 no té addEventListener a MediaQueryList. */
    if (mq.addEventListener) mq.addEventListener('change', alCanviar);
    else if (mq.addListener) mq.addListener(alCanviar);
    this._mqTema = { mq, alCanviar };
  }

  _paraDEscoltarTema() {
    if (!this._mqTema) return;
    const { mq, alCanviar } = this._mqTema;
    if (mq.removeEventListener) mq.removeEventListener('change', alCanviar);
    else if (mq.removeListener) mq.removeListener(alCanviar);
    this._mqTema = null;
  }
  

  setLanguage(lang) {
    /* T1 · Un codi que l'app no parla no pot trepitjar una config.language
       vàlida: es descarta i manen la config o el valencià. */
    this._manualLanguage = esLlenguaSuportada(lang) ? lang : null;
    this._render();
  }

  _forcaDesmuntatge() {
    this._desmuntaAra();
  }
  
  _desmuntaAra() {
    this._pendingUnmount = false;
    
    if (this._config && this._config.fontsHref) {
      descarregarFonts(this._config.fontsHref);
    }
    this._config = null;
    
    if (this._unmountListener) {
      document.removeEventListener('visibilitychange', this._unmountListener);
      this._unmountListener = null;
    }
    
    try { this._root?.unmount(); } catch { /* WebKit legacy pot plorar */ }
    this._root = null;
    this._punt?.remove();
    this._punt = null;
    this._hasMountedReact = false;
    
    if (this._reemissorEvents && typeof window !== 'undefined') {
      window.removeEventListener('sdp:auth-change', this._reemissorEvents);
      window.removeEventListener('sdp:navega', this._reemissorEvents);
      window.removeEventListener('sdp:error', this._reemissorEvents);
      window.removeEventListener('sdp:language-changed', this._reemissorEvents);
      this._reemissorEvents = null;
    }
    
    activeElements.delete(this);

    /*
     * P0-7 AVISOS APAGATS ALS GERMANS (260831, Seient Núm. 5).
     *
     * `destroyToastSystem()` és global: hi ha un sol `sharedRoot` per document.
     * Cridar-lo en desmuntar UNA instància apagava els avisos de totes les
     * altres que encara estaven vives. La usuària de l'altre bloc deixava de
     * rebre confirmacions i errors sense cap senyal.
     *
     * El sistema d'avisos és compartit, així que només es destruïx quan se'n va
     * l'última instància.
     */
    this._paraDEscoltarTema();

    if (activeElements.size === 0) {
      SocDePobleElement._despintaAmfitrio();
    }
  }

  disconnectedCallback() {
    if (!this._root || this._pendingUnmount) return;
    
    this._pendingUnmount = true;
    queueMicrotask(() => {
      if (!this._pendingUnmount) return;
      this._pendingUnmount = false;
      if (this.isConnected) return;
      
      this._desmuntaAra();
    });
  }
}

export function defineCustomElement() {
  if (typeof window === 'undefined') return;

  if (!window.__SDP_GLOBAL_ERRORS_BOUND__) {
    window.addEventListener('unhandledrejection', (event) => {
      const err = event.reason;
      const strErr = String(err);
      
      // Kimi: Només engolir si té a veure amb Sóc de Poble i no som en dev
      if (strErr.includes('sdp') || strErr.includes('soc-de-poble') || err?.stack?.includes('soc-de-poble')) {
        if (err?.name === 'QuotaExceededError' || strErr.includes('QuotaExceeded')) {
          console.warn('[PedraSeca] QuotaExceeded global capturat. Confiem en fallbacks.');
          event.preventDefault(); // Evitem que embrute la consola del host
        } else {
          // Si no som a Vite env (process env no existeix fàcilment ací a no ser que ho fiquem), ens callem l'error 
          console.warn('[PedraSeca] Promesa rebutjada globalment:', err);
        }
      }
    });
    window.__SDP_GLOBAL_ERRORS_BOUND__ = true;
  }

  if (!customElements.get('soc-de-poble')) {
    customElements.define('soc-de-poble', SocDePobleElement);
  }
}
