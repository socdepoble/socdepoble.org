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
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from './app/contexts/RouterContext';
import App from './app/App';
import { SessionProvider } from './app/contexts/SessionContext';
import { UIProvider } from './app/contexts/UIContext';
import { IdentitatProvider } from './app/contexts/IdentitatContext';
import { destroyToastSystem } from './components/universal/AvisadorEfimer.jsx';
import styles from './css/index.css?inline';
import { readThemePreference, resolveTheme } from './config/theme';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

/* ───────────────────────────── Error boundary ──────────────────────────── */
export default function PedraSecaEmbed({ config, themeMode, language, isFirstInstance }) {
  const isMemory = config.routerType === 'memory' || isFirstInstance === false;
  const RouterComponent = isMemory ? MemoryRouter : BrowserRouter;
  const routerProps = config.basename ? { basename: config.basename } : {};

  const uiConfig = React.useMemo(() => {
    return {
      ...config,
      ...(themeMode ? { themeMode } : {}),
      ...(language ? { language } : {})
    };
  }, [config, themeMode, language]);

  return (
    <ErrorBoundary>
      <RouterComponent {...routerProps}>
        <UIProvider externalConfig={uiConfig}>
          <SessionProvider>
            <IdentitatProvider>
              <App config={config} />
            </IdentitatProvider>
          </SessionProvider>
        </UIProvider>
      </RouterComponent>
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
  'base-path': 'basePath',
  'supabase-url': 'supabaseUrl',
  'supabase-anon-key': 'supabaseAnonKey',
  'data-mode': 'dataMode',
  'bot-api-url': 'botApiUrl',
  'fonts-href': 'fontsHref',
  'plugin-url': 'pluginUrl',
  'oauth-relay-url': 'oauthRelayUrl'
});

const CLAUS_PERMESES = Object.freeze(new Set([
  'basePath','supabaseUrl','supabaseAnonKey','dataMode','botApiUrl',
  'fontsHref','pluginUrl','routerType','basename','tenantId','language','themeMode',
  'manageDocumentHead', 'version', 'oauthRelayUrl'
]));

function sanejaConfig(cru) {
  const net = {};
  for (const clau of CLAUS_PERMESES) {
    if (clau in cru) net[clau] = cru[clau];
  }
  const CAMPOS_URL = Object.freeze(['supabaseUrl', 'botApiUrl', 'basePath', 'pluginUrl', 'fontsHref', 'oauthRelayUrl']);
  for (const field of CAMPOS_URL) {
    if (net[field]) {
      try {
        const cruUrl = net[field];
        if (cruUrl.startsWith('//')) { delete net[field]; continue; } // Z: bloqueig de protocol-relative
        const u = new URL(cruUrl, window.location.origin);
        if (u.protocol !== 'https:' && u.protocol !== 'http:' && !cruUrl.startsWith('/')) {
          delete net[field];
          continue;
        }
        if (field === 'oauthRelayUrl') {
          const origensPermesos = ['https://auth.socdepoble.org', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:8000', 'http://localhost:3340', 'https://socdepoble.sollutia.com', 'https://socdepoble.sollutia.cat'];
          if (!origensPermesos.some((o) => u.origin === new URL(o).origin)) {
            delete net[field];
          }
        }
      } catch { delete net[field]; }
    }
  }
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

  /** P0-5: objecte nou cada vegada; llevar un atribut esborra el valor. */
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

    const configObject = { ...desDeJson, ...desDAtributs, ...this._configProp };
    if (!configObject.pluginUrl && this.getAttribute('plugin-url')) {
      configObject.pluginUrl = this.getAttribute('plugin-url');
    }
    
    if (!configObject.basename && configObject.basePath && configObject.basePath !== '/') {
      configObject.basename = configObject.basePath;
    }
    
    if (configObject.manageDocumentHead === undefined) {
      configObject.manageDocumentHead = false;
    }
    if (configObject.routerType === undefined) {
      configObject.routerType = 'browser';
    }
    
    const rawConfig = sanejaConfig(configObject);
    
    let canviat = false;
    if (!this._config || Object.keys(rawConfig).length !== Object.keys(this._config).length) {
      canviat = true;
    } else {
      for (const key in rawConfig) {
        if (rawConfig[key] !== this._config[key]) {
          canviat = true;
          break;
        }
      }
    }

    if (canviat) {
      const oldFontsHref = this._config?.fontsHref;
      this._config = { ...rawConfig };
      if (oldFontsHref && oldFontsHref !== this._config.fontsHref) {
        descarregarFonts(oldFontsHref);
      }
      if (this._config.fontsHref) {
        carregarFonts(this._config.fontsHref);
      }
    }
    return canviat;
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
    this._manualLanguage = lang;
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
      destroyToastSystem();
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
