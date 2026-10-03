/**
 * Contracte d'amfitrió versionat · sdp.amfitrio.v1
 * ---------------------------------------------------------------------------
 * Tot el que un amfitrió (WordPress de proves, Sollutia, una pàgina estàtica)
 * pot dir-li a Sóc de Poble, i tot el que Sóc de Poble li torna, en UN sol
 * lloc. Model B: Sollutia és un endoll d'infraestructura, mai backend. El
 * backend i l'abast de dades (tenant) els tria i els segella el paquet; cap
 * amfitrió no els declara per cap canal.
 *
 * El fitxer és pur: sense import.meta, sense window ni document. El poden
 * importar el nucli, les proves de vitest i les de node --test.
 *
 * Les llistes del codi que el contracte descriu tenen una prova de paritat
 * (src/config/contracteAmfitrio.test.js i contracteAmfitrio.paritat.test.js):
 *   · `marcatge`, `element`, `global`, `claus`, `atributs` → CONTRACTE_AMFITRIO
 *     de vite.standalone.config.js (el que viatja al manifest sdp.release.v1);
 *   · `claus` → CLAUS_AMFITRIO de configAmfitrio.js;
 *   · la unió dels atributs → ATRIBUTS i observedAttributes de PedraSecaEmbed.jsx;
 *   · `clausDeConfig` → CLAUS_PERMESES de PedraSecaEmbed.jsx;
 *   · `cua.verbs`, `api.claus` i `ordresIframe` → host.js;
 *   · `esdeveniments.element` → els que l'element reemet;
 *   · `elementApi` → la propietat i els mètodes públics de l'element;
 *   · tapaRuta() → la ruta tapada de la telemetria (data/telemetria.js).
 * Un canvi a una de les dues bandes sense l'altra posa la prova en roig.
 *
 * validaDeclaracioAmfitrio(decl) aplica el contracte a una declaració concreta
 * (el que un amfitrió emet en una pàgina) i torna { ok, errors, net }.
 * tests/conformitat-amfitrio.test.mjs hi passa el marcatge real de WordPress
 * i el d'un Sollutia simulat.
 */

import { sanejaEtiqueta, sanejaIdentificador, sanejaRuta } from './configAmfitrio.js';
import { normalitzaBase } from '../app/contexts/politicaRouter.js';

/** Congela un objecte i tot el que penja d'ell (objectes i arrays plans). */
function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
}

export const ID_CONTRACTE_AMFITRIO = 'sdp.amfitrio.v1';

export const CONTRACTE_AMFITRIO_V1 = congela({
  id: ID_CONTRACTE_AMFITRIO,

  /* ── Entrades: de l'amfitrió al nucli ─────────────────────────────── */

  /* El marcatge universal de tres peces (sdp.markup.v1): el global abans del
     paquet, l'element i el paquet com a <script src> clàssic. */
  marcatge: 'sdp.markup.v1',
  element: 'soc-de-poble',
  global: 'SocDePobleConfig',
  claus: ['nomPoble', 'poble'],
  atributs: ['plugin-url', 'fonts-href', 'nom-poble', 'poble', 'ruta-inicial', 'base-path', 'traductor-url'],
  /* Declaracions opt-in de l'amfitrió que encara no són a sdp.markup.v1:
     entraran a la versió següent del marcatge quan el Mestre ho decidisca.
     Cap amfitrió no les ha d'emetre per defecte (WordPress no les emet). */
  atributsOptIn: ['ruta-a-url'],
  /* Configuració en JSON (atribut o <script type="application/json">). */
  atributsDeConfig: ['config', 'config-id'],
  /* Permisos i arrencada: no són configuració de l'app. */
  atributsDeControl: ['arrencada', 'pinta-amfitrio'],
  /* Atributs que l'element encara entén, però que són de Sóc de Poble: el
     backend, l'abast de dades i els serveis propis. Cap amfitrió no els emet. */
  atributsPropisDeSdP: ['backend-url', 'tenant-id', 'supabase-url', 'supabase-anon-key', 'data-mode',
    'bot-api-url', 'oauth-relay-url', 'sollutia-issuer'],

  /* Claus de la configuració de l'element (configura({config}), JSON,
     propietat JS). `amfitrio`: les pot declarar l'amfitrió. `propiesDeSdP`:
     només les posa el paquet (backend, tenant, serveis propis i claus mortes). */
  clausDeConfig: {
    amfitrio: ['nomPoble', 'poble', 'rutaInicial', 'basePath', 'basename', 'routerType', 'manageDocumentHead',
      'language', 'themeMode', 'fontsHref', 'pluginUrl', 'traductorUrl', 'apps', 'rutaAUrl'],
    propiesDeSdP: ['supabaseUrl', 'supabaseAnonKey', 'dataMode', 'backendId', 'tenantId',
      'botApiUrl', 'oauthRelayUrl', 'sollutiaIssuer', 'version']
  },

  /* La cua `window.SocDePobleCua` (abans que el paquet carregue). Cada verb
     està classificat: `amfitrio` és part del contracte; `api` és la mateixa
     crida que window.SocDePoble i hi valen les mateixes restriccions. */
  cua: {
    global: 'SocDePobleCua',
    verbs: { sessio: 'amfitrio', configura: 'api' }
  },

  /* window.SocDePoble, congelat: l'única global que escriu el nucli. */
  api: {
    global: 'SocDePoble',
    claus: ['configura', 'arrenca', 'arrencaAuto', 'deferArrenca', 'estat', 'CONTRACTE_BACKEND',
      'injectaSessio', 'expulsaSessio', 'quanLlest', 'isReady', 'registraApp']
  },

  /* configura(opcions): claus de primer nivell. `auth` és la política de
     sessió (un sol ús). `backend`, `backend_url` i `tenant_id` són el port
     del Model A: el contracte no els admet (decisions A1 i A3 del Mestre). */
  configura: {
    admeses: ['auth', 'config'],
    prohibides: ['backend', 'backend_url', 'tenant_id']
  },

  /* L'element mateix (canal 6 de host.js). `propietats`: la propietat JS
     `config` (element.config = {…}), el canal de Sollutia i dels amfitrions
     React o Vue; hi valen les mateixes claus que a configura({config}).
     `metodes`: l'API pública de la instància. */
  elementApi: {
    propietats: ['config'],
    metodes: ['refreshData', 'getCurrentUser', 'on', 'setTheme', 'setLanguage']
  },

  /* Pont d'iframe: { type: 'SDP_HOST_CMD', cmd, payload, requestId }. */
  ordresIframe: ['SDP_PING', 'injectaSessio', 'expulsaSessio', 'arrenca'],

  /* Globals que el nucli LLIG (no n'escriu cap més que api.global). */
  globalsLlegits: ['SocDePobleConfig', 'SocDePobleCua', '__SDP_EMBEDDED__', 'umami'],

  /* Serveis opcionals amb contracte HTTP neutre. */
  serveis: {
    traductor: { atribut: 'traductor-url', origen: 'mateix' }
  },

  /* ── Eixides: del nucli a l'amfitrió ──────────────────────────────── */

  esdeveniments: {
    finestra: ['socdepoble-ready'],
    element: ['sdp-auth-change', 'sdp-navega', 'sdp-error', 'sdp-language-changed'],
    pare: ['SDP_READY', 'SDP_HOST_ACK'],
    /* Fase 1 de la clàusula dels slugs, sense opt-in: `sdp-navega` ({ ruta })
       porta la ruta TAPADA (tapaRuta): la secció i, si és una fitxa, un
       asterisc (/perfil/*). Mai la consulta (el text del cercador), el
       fragment ni cap identificador. Només s'avisa quan la tapada canvia. */
    ruta: { nom: 'sdp-navega', detall: 'tapada' }
  },

  /* Clàusula dels slugs (fase 2, opt-in): la ruta de l'app en una sola clau de
     la URL de l'amfitrió, al fragment (#sdp=) o a la consulta (?sdp=).
     PRIVACITAT: hi viatja la ruta SENCERA, consulta inclosa (el text del
     cercador, ids de fitxa). Queda a l'historial del navegador i als enllaços
     que es copien; en mode `parametre`, a més, arriba al servidor de
     l'amfitrió i als seus registres quan es recarrega la pàgina o s'obri un
     enllaç copiat. Qui declara l'opt-in ho accepta.
     En mode `fragment` només s'escriu sobre un fragment buit o de forma
     clau=valor: un ancoratge (#seccio) o un router de hash (#/ruta) de
     l'amfitrió no es toquen, i l'element avisa. Per damunt de
     limits.rutaAUrl s'escriu només el camí, sense la consulta. */
  rutaAUrl: { clau: 'sdp', modes: ['fragment', 'parametre'], ruta: 'sencera', fragment: 'clau=valor' },

  /* Els canals d'una declaració (validaDeclaracioAmfitrio). Un canal fora
     d'esta llista no s'ignora en silenci: és declaracio-invalida. */
  canals: ['global', 'elements', 'cua', 'configura', 'propietats', 'scripts'],

  /* ── Límits i formes ──────────────────────────────────────────────── */

  limits: {
    /* ruta-inicial: el plugin de WordPress talla a 200 (marcatge.php). */
    rutaInicial: 200,
    /* La ruta que viatja a la clau `sdp` de la URL de l'amfitrió. */
    rutaAUrl: 2048,
    /* nom-poble: sanejaEtiqueta (configAmfitrio.js). */
    etiqueta: 80
  },
  patroPoble: '^[a-z0-9][a-z0-9-]{0,62}$'
});

/**
 * La ruta que ix cap a l'amfitrió amb `sdp-navega` (esdeveniments.ruta): la
 * secció i, si era una fitxa, un asterisc. Sense consulta, fragment ni
 * identificadors. És el criteri de data/telemetria.js:rutaTapada; la prova
 * de paritat els contrasta.
 * @param {string} ruta ruta de l'app (camí i, potser, consulta)
 * @returns {string} p. ex. '/cerca', '/perfil/*' o '/'
 */
export function tapaRuta(ruta) {
  const [primer, ...resta] = String(ruta ?? '').split(/[?#]/)[0].split('/').filter(Boolean);
  if (!primer) return '/';
  return resta.length ? `/${primer}/*` : `/${primer}`;
}

/* ═════════════════════ Classificació de claus ═════════════════════ */

const C = CONTRACTE_AMFITRIO_V1;

/* Les formes del backend i de l'abast de dades, en tots els canals. */
const CLAUS_DE_BACKEND = Object.freeze(new Set(['backend', 'backend_url', 'backendUrl', 'backendId',
  'supabaseUrl', 'supabaseAnonKey', 'anonKey', 'dataMode']));
const CLAUS_DE_TENANT = Object.freeze(new Set(['tenantId', 'tenant_id']));
const ATRIBUTS_DE_BACKEND = Object.freeze(new Set(['backend-url', 'supabase-url', 'supabase-anon-key', 'data-mode']));
const ATRIBUTS_DE_TENANT = Object.freeze(new Set(['tenant-id']));

/** Els codis d'error que pot tornar validaDeclaracioAmfitrio(). */
export const CODIS_ERROR_AMFITRIO = congela([
  'declaracio-invalida',  // la declaració o un dels seus canals no té la forma esperada
  'backend',              // backend o credencials en algun canal (Model B)
  'tenant',               // abast de dades en algun canal (Model B)
  'atribut-desconegut',   // l'element porta un atribut fora del contracte
  'atribut-propi-de-sdp', // un atribut que només posa Sóc de Poble
  'clau-desconeguda',     // el global o configura porten una clau fora del contracte
  'clau-propia-de-sdp',   // configura({config}) porta una clau que només posa Sóc de Poble
  'valor-invalid',       // el sanejador del nucli el descartaria
  'valor-no-canonic',     // el nucli l'acceptaria, però el canviaria
  'ruta-massa-llarga',    // ruta-inicial per damunt de limits.rutaInicial
  'verb-desconegut',      // la cua porta un verb no classificat
  'bundle-modul'          // el paquet no es carrega com a <script> clàssic
]);

const esObjectePla = (valor) => {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const proto = Object.getPrototypeOf(valor);
  return proto === null || Object.getPrototypeOf(proto) === null;
};

const propies = (objecte) => Object.keys(objecte).filter((clau) => Object.hasOwn(objecte, clau));

/** Valor canònic d'un atribut del marcatge, o undefined si el nucli el descarta. */
const CANONICS = Object.freeze({
  'nom-poble': (valor) => sanejaEtiqueta(valor, C.limits.etiqueta),
  poble: sanejaIdentificador,
  'ruta-inicial': sanejaRuta,
  'base-path': (valor) => normalitzaBase(valor) || undefined,
  'ruta-a-url': (valor) => (C.rutaAUrl.modes.includes(valor) ? valor : undefined),
  // host.js només mira el valor exacte 'manual'; qualsevol altre no fa res.
  arrencada: (valor) => (valor === 'manual' ? valor : undefined)
});

const ES_TEXT_NO_BUIT = (valor) => typeof valor === 'string' && valor.trim() !== '';

/* ═════════════════════════ Validador ═════════════════════════ */

/**
 * Aplica sdp.amfitrio.v1 a una declaració concreta d'amfitrió.
 *
 * @param {object} decl
 *   global?    · el valor de window.SocDePobleConfig (o undefined)
 *   elements?  · [{ atributs: { nom: valor } }] cada <soc-de-poble> emés
 *   cua?       · el contingut de window.SocDePobleCua: [[verb, ...arguments]]
 *   configura? · [opcions] crides a window.SocDePoble.configura()
 *   propietats?· [config] assignacions a la propietat JS (element.config = {…})
 *   scripts?   · [{ src, tipus: 'classic'|'module' }] el paquet
 *   Cap altre canal: un de fora de CONTRACTE_AMFITRIO_V1.canals és declaracio-invalida.
 * @returns {{ ok: boolean, errors: Array<{codi, canal, clau?, detall}>, net: object }}
 *   `net` és la declaració amb només el que el contracte admet. Es congelen
 *   els contenidors que crea el validador, mai els valors de l'amfitrió
 *   (sessió, auth, valors de config): no se li muta res del que passa.
 */
export function validaDeclaracioAmfitrio(decl) {
  const errors = [];
  const error = (codi, canal, clau, detall) => errors.push(Object.freeze({ codi, canal, ...(clau !== undefined ? { clau } : {}), detall }));
  const resultat = (net) => Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), net: Object.freeze(net) });

  if (!esObjectePla(decl)) {
    error('declaracio-invalida', 'declaracio', undefined, 'La declaració ha de ser un objecte pla.');
    return resultat({});
  }

  const net = {};

  /* Un canal que el validador no coneix no es pot callar: seria una porta
     d'entrada sense jutjar (així es colava la propietat JS). */
  for (const canal of propies(decl)) {
    if (!C.canals.includes(canal)) error('declaracio-invalida', 'declaracio', canal, `Canal fora de ${C.id}: ${C.canals.join(', ')}.`);
  }

  /* ── El global ── */
  if (decl.global !== undefined) {
    if (!esObjectePla(decl.global)) {
      error('declaracio-invalida', 'global', undefined, `${C.global} ha de ser un objecte pla.`);
    } else {
      const global = {};
      for (const clau of propies(decl.global)) {
        const valor = decl.global[clau];
        if (CLAUS_DE_TENANT.has(clau)) { error('tenant', 'global', clau, 'L’abast de dades no viatja pel global.'); continue; }
        if (CLAUS_DE_BACKEND.has(clau)) { error('backend', 'global', clau, 'El backend no viatja pel global.'); continue; }
        if (!C.claus.includes(clau)) { error('clau-desconeguda', 'global', clau, `${C.global} només porta ${C.claus.join(' i ')}.`); continue; }
        const canonic = clau === 'poble' ? sanejaIdentificador(valor) : sanejaEtiqueta(valor, C.limits.etiqueta);
        if (canonic === undefined) { error('valor-invalid', 'global', clau, 'El nucli el descartaria.'); continue; }
        if (canonic !== valor) error('valor-no-canonic', 'global', clau, `El nucli el canviaria a «${canonic}».`);
        global[clau] = canonic;
      }
      net.global = Object.freeze(global);
    }
  }

  /* ── Els elements ── */
  if (decl.elements !== undefined) {
    if (!Array.isArray(decl.elements)) {
      error('declaracio-invalida', 'element', undefined, 'Els elements han de ser una llista.');
    } else {
      net.elements = Object.freeze(decl.elements.map((element) => {
        const atributs = {};
        const cru = esObjectePla(element) && esObjectePla(element.atributs) ? element.atributs : null;
        if (!cru) {
          error('declaracio-invalida', 'element', undefined, 'Cada element porta { atributs }.');
          return Object.freeze({ atributs: Object.freeze(atributs) });
        }
        for (const nom of propies(cru)) {
          const valor = cru[nom];
          if (ATRIBUTS_DE_TENANT.has(nom)) { error('tenant', 'element', nom, 'L’abast de dades no viatja a l’etiqueta.'); continue; }
          if (ATRIBUTS_DE_BACKEND.has(nom)) { error('backend', 'element', nom, 'El backend no viatja a l’etiqueta.'); continue; }
          if (C.atributsPropisDeSdP.includes(nom)) { error('atribut-propi-de-sdp', 'element', nom, 'Només el posa Sóc de Poble.'); continue; }
          if (nom === 'config' || nom === 'config-id') {
            error('atribut-desconegut', 'element', nom, 'La configuració en JSON no és part del marcatge universal.');
            continue;
          }
          if (!C.atributs.includes(nom) && !C.atributsOptIn.includes(nom) && !C.atributsDeControl.includes(nom)) {
            error('atribut-desconegut', 'element', nom, `Fora de ${C.marcatge}.`);
            continue;
          }
          if (typeof valor !== 'string') { error('valor-invalid', 'element', nom, 'Un atribut és sempre text.'); continue; }
          if (nom === 'ruta-inicial' && valor.length > C.limits.rutaInicial) {
            error('ruta-massa-llarga', 'element', nom, `Màxim ${C.limits.rutaInicial} caràcters.`);
            continue;
          }
          const canonic = Object.hasOwn(CANONICS, nom) ? CANONICS[nom](valor) : valor;
          if (canonic === undefined || (!Object.hasOwn(CANONICS, nom) && C.atributs.includes(nom) && !ES_TEXT_NO_BUIT(valor))) {
            error('valor-invalid', 'element', nom, 'El nucli el descartaria.');
            continue;
          }
          if (canonic !== valor) error('valor-no-canonic', 'element', nom, `El nucli el canviaria a «${canonic}».`);
          atributs[nom] = canonic;
        }
        return Object.freeze({ atributs: Object.freeze(atributs) });
      }));
    }
  }

  /* ── Claus de configuració: configura({config}) i la propietat JS ── */
  const classificaConfig = (config, canal, prefix) => {
    const neta = {};
    for (const clau of propies(config)) {
      const nom = `${prefix}${clau}`;
      if (CLAUS_DE_TENANT.has(clau)) { error('tenant', canal, nom, 'Cap amfitrió no declara l’abast de dades (Model B).'); continue; }
      if (CLAUS_DE_BACKEND.has(clau)) { error('backend', canal, nom, 'Cap amfitrió no declara el backend (Model B).'); continue; }
      if (C.clausDeConfig.propiesDeSdP.includes(clau)) { error('clau-propia-de-sdp', canal, nom, 'Només la posa Sóc de Poble.'); continue; }
      if (!C.clausDeConfig.amfitrio.includes(clau)) { error('clau-desconeguda', canal, nom, 'Clau fora del contracte.'); continue; }
      neta[clau] = config[clau];
    }
    return Object.freeze(neta);
  };

  /* ── configura(opcions), per l'API o per la cua ── */
  const validaConfigura = (opcions, canal) => {
    if (!esObjectePla(opcions)) {
      error('declaracio-invalida', canal, undefined, 'configura() rep un objecte pla.');
      return null;
    }
    const neta = {};
    for (const clau of propies(opcions)) {
      if (clau === 'tenant_id') { error('tenant', canal, clau, 'configura() no admet abast de dades.'); continue; }
      if (C.configura.prohibides.includes(clau)) { error('backend', canal, clau, 'configura() no admet backend (Model B).'); continue; }
      if (!C.configura.admeses.includes(clau)) { error('clau-desconeguda', canal, clau, `configura() només admet ${C.configura.admeses.join(' i ')}.`); continue; }
      if (clau === 'auth') { neta.auth = opcions.auth; continue; }
      const config = opcions.config;
      if (!esObjectePla(config)) { error('declaracio-invalida', canal, 'config', 'config ha de ser un objecte pla.'); continue; }
      neta.config = classificaConfig(config, canal, 'config.');
    }
    return Object.freeze(neta);
  };

  if (decl.configura !== undefined) {
    if (!Array.isArray(decl.configura)) error('declaracio-invalida', 'configura', undefined, 'Les crides a configura() han de ser una llista.');
    else net.configura = Object.freeze(decl.configura.map((opcions) => validaConfigura(opcions, 'configura')).filter(Boolean));
  }

  /* ── La propietat JS `config` de l'element (WP-R2) ── */
  if (decl.propietats !== undefined) {
    if (!Array.isArray(decl.propietats)) {
      error('declaracio-invalida', 'propietat', undefined, 'Les assignacions a element.config han de ser una llista.');
    } else {
      net.propietats = Object.freeze(decl.propietats.map((config) => {
        if (esObjectePla(config)) return classificaConfig(config, 'propietat', '');
        error('declaracio-invalida', 'propietat', undefined, 'element.config rep un objecte pla.');
        return null;
      }).filter(Boolean));
    }
  }

  /* ── La cua ── */
  if (decl.cua !== undefined) {
    if (!Array.isArray(decl.cua)) {
      error('declaracio-invalida', 'cua', undefined, `${C.cua.global} ha de ser una llista.`);
    } else {
      const cua = [];
      for (const accio of decl.cua) {
        if (!Array.isArray(accio) || typeof accio[0] !== 'string' || !Object.hasOwn(C.cua.verbs, accio[0])) {
          error('verb-desconegut', 'cua', Array.isArray(accio) ? String(accio[0]) : undefined, 'Verb fora del contracte.');
          continue;
        }
        if (accio[0] === 'configura') {
          const neta = validaConfigura(accio[1], 'cua');
          if (neta) cua.push(Object.freeze(['configura', neta]));
          continue;
        }
        cua.push(Object.freeze([...accio]));
      }
      net.cua = Object.freeze(cua);
    }
  }

  /* ── El paquet ── */
  if (decl.scripts !== undefined) {
    if (!Array.isArray(decl.scripts)) {
      error('declaracio-invalida', 'script', undefined, 'Els scripts han de ser una llista.');
    } else {
      const scripts = [];
      for (const script of decl.scripts) {
        if (!esObjectePla(script) || !ES_TEXT_NO_BUIT(script.src)) {
          error('declaracio-invalida', 'script', undefined, 'Cada script porta un src.');
          continue;
        }
        if (script.tipus !== 'classic') {
          error('bundle-modul', 'script', script.src, 'El paquet és un IIFE: <script src> clàssic, mai de mòdul.');
          continue;
        }
        scripts.push(Object.freeze({ src: script.src, tipus: 'classic' }));
      }
      net.scripts = Object.freeze(scripts);
    }
  }

  return resultat(net);
}
