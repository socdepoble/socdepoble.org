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
 *   · `moduls` → ESQUEMA_MODUL de apps/plataforma/contracteNucli.js i les claus de l'API;
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
     paquet, l'element i el paquet com a <script src> clàssic. Decisió 5 del
     Mestre (261007) · El marcatge no canvia amb el paquet trossejat: el
     <script src> continua sent soc-de-poble.standalone.js, ara un carregador
     clàssic que demana els trossos ESM de dist/trossos/ (vegeu `api`). */
  marcatge: 'sdp.markup.v1',
  element: 'soc-de-poble',
  global: 'SocDePobleConfig',
  claus: ['nomPoble', 'poble'],
  atributs: ['plugin-url', 'fonts-href', 'nom-poble', 'poble', 'ruta-inicial', 'base-path', 'traductor-url'],
  /* Declaracions opt-in de l'amfitrió que encara no són a sdp.markup.v1:
     entraran a la versió següent del marcatge quan el Mestre ho decidisca.
     Cap amfitrió no les ha d'emetre per defecte. Excepció per ordre del
     Mestre (Onada 5, 261009): WordPress declara ruta-a-url="fragment" a la
     seua instància pròpia; el marcatge de referència per a altres amfitrions,
     no (marcatge.php, socdepoble_enxufe_element). */
  atributsOptIn: ['ruta-a-url'],
  /* Configuració en JSON (atribut o <script type="application/json">). */
  atributsDeConfig: ['config', 'config-id'],
  /* Permisos i arrencada: no són configuració de l'app. */
  atributsDeControl: ['arrencada', 'pinta-amfitrio'],
  /* Atributs que l'element encara reconeix, però que són de Sóc de Poble: el
     backend, l'abast de dades i els serveis propis. Cap amfitrió no els emet,
     i des de 261003 l'element només els llig per a avisar i descartar-los. */
  atributsPropisDeSdP: ['backend-url', 'tenant-id', 'supabase-url', 'supabase-anon-key', 'data-mode',
    'bot-api-url', 'oauth-relay-url', 'sollutia-issuer'],

  /* Claus de la configuració de l'element (configura({config}), JSON,
     propietat JS). `amfitrio`: les pot declarar l'amfitrió. `propiesDeSdP`:
     només les posa el paquet (backend, tenant, serveis propis i claus mortes).
     Des de la correcció de l'A1 (261003) el nucli també les descarta, amb el
     mateix avís que el Model B, de qualsevol canal de l'amfitrió
     (config/capaDelPaquet.js); abans hi entraven i el relé d'OAuth es podia
     desviar des de l'etiqueta. */
  clausDeConfig: {
    amfitrio: ['nomPoble', 'poble', 'rutaInicial', 'basePath', 'basename', 'routerType', 'manageDocumentHead',
      'language', 'themeMode', 'fontsHref', 'pluginUrl', 'traductorUrl', 'apps', 'rutaAUrl'],
    propiesDeSdP: ['supabaseUrl', 'supabaseAnonKey', 'dataMode', 'backendId', 'tenantId',
      'botApiUrl', 'oauthRelayUrl', 'sollutiaIssuer', 'version',
      /* CU (Onada 3): l'adreça d'instal·lació de l'extensió del Snippet. Un
         amfitrió que la poguera posar faria instal·lar una extensió aliena. */
      'snippetChromeUrl']
  },

  /* La cua `window.SocDePobleCua` (abans que el paquet carregue). Cada verb
     està classificat: `amfitrio` és part del contracte; `api` és la mateixa
     crida que window.SocDePoble i hi valen les mateixes restriccions. */
  cua: {
    global: 'SocDePobleCua',
    verbs: { sessio: 'amfitrio', configura: 'api' }
  },

  /* window.SocDePoble, congelat: l'única global que escriu el nucli.
     Decisió 5 del Mestre (261007, paquet trossejat) · Amb el paquet trossejat
     (el defecte de l'autònom), l'API és PROVISIONAL fins a l'adopció: el
     carregador clàssic (carregadorDelPaquet.js, protocol sdp.carregador.v1)
     hi deixa, abans que arribe cap mòdul, un objecte congelat i configurable
     amb estes mateixes `claus` i en el mateix ordre. Mentrestant:
       · cada verb s'encua en ordre i torna una promesa amb el resultat o
         l'error REALS (el <script> de l'amfitrió posat després del paquet,
         `if (window.SocDePoble) { configura(…) }`, ja hi troba l'objecte);
       · `isReady` val false i `CONTRACTE_BACKEND`, undefined;
       · estat() respon de seguida amb `fase` 'carregant' (configurable: true)
         o, si el mòdul d'entrada no ha pogut carregar, 'fallida'
         (configurable: false), dos valors que l'API real no dona mai (la
         seua fase és 'configurable', 'arrencant' o 'segellat', host.js).
     En adoptar, el mòdul d'entrada (embed.jsx) hi definix l'API real, no
     configurable (exposaGlobal), i el mateix objecte provisional reenvia
     cada crida de manera síncrona a qui n'haja guardat la referència. Amb
     el paquet monolític (SDP_PAQUET=monolitic, la variant del directori de
     WordPress) no hi ha provisional: l'API real ix en avaluar-se el paquet.
     Onada 6 (261009, ADR-2026-12) · tres claus additives per als mòduls
     opcionals (vegeu `moduls`): `registraModul` i `lliuraCos`, que el
     provisional encua com la resta de verbs, i `nucli`, que és una lectura
     com `isReady` (en el provisional val undefined fins a l'adopció; en
     l'API real, null fins que un mòdul el demana). */
  api: {
    global: 'SocDePoble',
    claus: ['configura', 'arrenca', 'arrencaAuto', 'deferArrenca', 'estat', 'CONTRACTE_BACKEND',
      'injectaSessio', 'expulsaSessio', 'quanLlest', 'isReady', 'registraApp', 'registraModul', 'lliuraCos', 'nucli']
  },

  /* Mòduls opcionals (sdp.modul.v1, ADR-2026-12): una app que no viatja
     dins del paquet. Un fitxer de registre de l'amfitrió crida
     `registra` amb el manifest (sdp.app.v1 més `cos`, `estils` opcionals i
     el rang `nucli`); el cos, un <script> clàssic del MATEIX origen amb
     `integrity` que la plataforma injecta quan s'obri l'app, crida `lliura`
     mentre s'executa i pren React, la plataforma, Pedra Seca, el router i,
     des del nucli 1.2.0 (261016), l'espai de treball del Bloc de notes de
     `nucli` (src/apps/plataforma/contracteNucli.js). Cap mòdul porta backend
     ni sessió: el Model B no canvia. */
  moduls: {
    esquema: 'sdp.modul.v1',
    registra: 'registraModul',
    lliura: 'lliuraCos',
    nucli: 'nucli'
  },

  /* configura(opcions): claus de primer nivell. `auth` és la política de
     sessió (un sol ús). `backend`, `backend_url` i `tenant_id` són el port
     del Model A: el contracte no els admet (decisions A1 i A3 del Mestre,
     261003) i el nucli els descarta amb un avís. */
  configura: {
    admeses: ['auth', 'config'],
    prohibides: ['backend', 'backend_url', 'tenant_id']
  },

  /* Model B (decisions A1 i A3 del Mestre, 261003): el backend i l'abast de
     dades, en totes les seues formes. Només els posa el paquet, per una via
     interna (config/capaDelPaquet.js); en qualsevol canal de l'amfitrió el
     validador els rebutja (`backend`, `tenant`) i el nucli els descarta amb
     un avís a la consola. No hi ha cap amfitrió exempt, WordPress inclòs. */
  modelB: {
    clausDeBackend: ['backend', 'backend_url', 'backendUrl', 'backendId', 'supabaseUrl', 'supabaseAnonKey', 'anonKey', 'dataMode'],
    clausDeTenant: ['tenantId', 'tenant_id']
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
     limits.rutaAUrl s'escriu només el camí, sense la consulta.
     Onada 12 (261011; ordres 261011_0130, punt 4) · HISTORIAL: qui declara
     l'opt-in també accepta que cada navegació nova de l'app òbriga una
     entrada a l'historial del navegador (pushState), perquè «Arrere» torne a
     la pantalla d'abans dins de l'app; les redireccions i la primera càrrega
     reescriuen l'entrada (replaceState). Cada entrada pròpia porta, dins de
     history.state i sota la mateixa clau, { ruta, i }; la resta de l'estat
     és de l'amfitrió i es conserva. Un popstate cap a una entrada sense la
     clau és de l'amfitrió: l'app no hi reacciona (PedraSecaEmbed.jsx). */
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

/* Les formes del backend i de l'abast de dades, en tots els canals: la llista
   del Model B, la mateixa que el nucli descarta (config/capaDelPaquet.js). */
const CLAUS_DE_BACKEND = Object.freeze(new Set(C.modelB.clausDeBackend));
const CLAUS_DE_TENANT = Object.freeze(new Set(C.modelB.clausDeTenant));
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
  'clau-propia-de-sdp',   // config, propietat JS o opcions de sessio porten una clau que només posa Sóc de Poble
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
  /* A l'arrel, el mateix judici que el nucli (host.js:configura() la passa per
     separaClausDelPaquet): qualsevol forma del Model B és `tenant` o `backend`,
     no només les tres de configura.prohibides. */
  const validaConfigura = (opcions, canal) => {
    if (!esObjectePla(opcions)) {
      error('declaracio-invalida', canal, undefined, 'configura() rep un objecte pla.');
      return null;
    }
    const neta = {};
    for (const clau of propies(opcions)) {
      if (CLAUS_DE_TENANT.has(clau)) { error('tenant', canal, clau, 'configura() no admet abast de dades (Model B).'); continue; }
      if (CLAUS_DE_BACKEND.has(clau) || C.configura.prohibides.includes(clau)) { error('backend', canal, clau, 'configura() no admet backend (Model B).'); continue; }
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

  /* ── Les opcions de `sessio` (el tercer argument del verb) ──
     Un canal de l'amfitrió com els altres: host.js:injectaSessio() en lleva les
     claus del paquet. Ací es jutgen igual: el Model B és `tenant` o `backend` i
     els serveis propis, `clau-propia-de-sdp`. La resta (emissorEsperat) passa. */
  const validaOpcionsSessio = (opcions) => {
    const neta = {};
    for (const clau of propies(opcions)) {
      const nom = `opcions.${clau}`;
      if (CLAUS_DE_TENANT.has(clau)) { error('tenant', 'cua', nom, 'La sessió no porta abast de dades (Model B).'); continue; }
      if (CLAUS_DE_BACKEND.has(clau)) { error('backend', 'cua', nom, 'La sessió no porta backend (Model B).'); continue; }
      if (C.clausDeConfig.propiesDeSdP.includes(clau)) { error('clau-propia-de-sdp', 'cua', nom, 'Només la posa Sóc de Poble.'); continue; }
      neta[clau] = opcions[clau];
    }
    return Object.freeze(neta);
  };

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
        if (accio[0] === 'sessio' && esObjectePla(accio[2])) {
          cua.push(Object.freeze([accio[0], accio[1], validaOpcionsSessio(accio[2]), ...accio.slice(3)]));
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
        /* Relleu 261007 (peça «netes») · Decisió 5 del Mestre (261007, paquet
           trossejat) · El que ha de ser clàssic és el CARREGADOR: troba la seua
           carpeta amb document.currentScript, que en un script de mòdul és null
           (carregadorDelPaquet.js). Els trossos ESM els demana ell. El codi de
           la diagnosi (bundle-modul) no canvia.
           Relleu 261007 (peça «netes», revisió) · El mateix nom de fitxer també
           es distribuïx monolític: la variant del directori (SDP_VARIANT=wordpress)
           ho és sempre i SDP_PAQUET=monolitic ho tria per a l'autònom
           (formatDelPaquet, vite.standalone.config.js). Eixe fitxer és l'IIFE
           sencer, sense carregador ni trossos, i també va en clàssic: el text
           que llig l'amfitrió nomena totes dues formes. */
        if (script.tipus !== 'classic') {
          error('bundle-modul', 'script', script.src, 'soc-de-poble.standalone.js (el carregador o l’IIFE monolític) va en un <script src> clàssic, mai de mòdul; si és el carregador, els trossos els demana ell.');
          continue;
        }
        scripts.push(Object.freeze({ src: script.src, tipus: 'classic' }));
      }
      net.scripts = Object.freeze(scripts);
    }
  }

  return resultat(net);
}
