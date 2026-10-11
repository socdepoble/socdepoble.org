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
 *  P0-7 AVISOS DELS GERMANS (260831; nota històrica, Auditoria 261007 (B)).
 *       Desmuntar una instància apagava els avisos de totes les altres, que
 *       compartien un sistema d'avisos global. Este element ja no en té cap
 *       de compartit: cada instància munta el seu NotificationProvider
 *       (App.jsx) amb el portal dins del seu shadow root, i desmuntar-ne una
 *       no toca les altres. (P0-6 viu a connectedCallback.)
 *
 *  260929 ENXUFE UNIVERSAL. L'element no sap quin amfitrió té davant
 *       (Sollutia, WordPress de proves, MediaWiki demà): tres polítiques que
 *       valen per a tots.
 *       · ROUTER. Ací es forçava routerType 'browser', i dins de qualsevol
 *         amfitrió l'app es feia ama de la URL: a /comunitat/ pintava «no
 *         trobat» i escrivia a l'historial de l'amfitrió. Ara tria
 *         politicaRouter.js:triaRouter(). El navegador només s'usa si algú el
 *         declara (routerType 'browser', com fa main.jsx al #root de
 *         socdepoble.org, o una base `base-path`; el paquet, embed.jsx, ja no
 *         munta res al #root des de W4-01); sense declaració, memòria, que
 *         aterra a `rutaInicial` o, si l'amfitrió diu el poble i cap ruta, al
 *         xat (/xat, sanejaConfig()).
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
 *         backend de compilació, el que les entrades pròpies (main.jsx,
 *         embed.jsx) fixen a la capa del paquet (config/capaDelPaquet.js).
 *       Les claus noves passen per un sanejador tipat a sanejaConfig().
 *
 *  261002 T2b ENXUFABILITAT (contracte sdp.amfitrio.v1, config/contracteAmfitrio.js).
 *       · TENANT INVÀLID. Un tenant que no és UUID en una capa (atribut,
 *         JSON, propietat o paquet) feia llançar normalizeBackendConfig dins
 *         de connectedCallback: element en blanc i excepció global. Ara el
 *         tenant d'eixa capa es descarta amb un avís i mana el de les capes de
 *         davall (el segellat al paquet). configura() continua llançant.
 *       · RUTA CAP A L'AMFITRIÓ. En memòria, cada canvi de secció s'avisa amb
 *         `sdp-navega` ({ ruta }) sobre l'element, sense passar pel bus de
 *         window. La ruta va TAPADA (tapaRuta): mai la consulta ni ids.
 *         Opt-in `ruta-a-url="fragment|parametre"`: la primera instància
 *         també reflectix la ruta sencera a la clau `sdp` de la URL de
 *         l'amfitrió (#sdp= o ?sdp=) i la torna a llegir en hashchange/popstate.
 *         Onada 12 (261011; ordres 261011_0130, punt 4): cada navegació nova
 *         de l'app hi obri una entrada d'historial (pushState) i «Arrere» del
 *         navegador torna a la pantalla d'abans dins de l'app (ReflexDeRuta).
 *       · APPS. La clau `apps` (ids del registre de la Plataforma d'Apps)
 *         entra per la configuració, mai pel global de l'amfitrió.
 *
 *  261003 A1 · MODEL B ABSOLUT (decisions A1 i A3 del Mestre). El backend
 *       (supabaseUrl, supabaseAnonKey, dataMode, backendId i els àlies) i el
 *       tenant només ixen de la capa del paquet (config/capaDelPaquet.js), que
 *       les entrades pròpies (main.jsx, embed.jsx) fixen per una via interna.
 *       Cap capa de l'amfitrió (atributs, JSON, config-id, propietat JS,
 *       configura, global) no els pot fixar ni trepitjar: es descarten amb un
 *       avís a la consola, una sola vegada per canal i clau. El que diu 261002
 *       del tenant invàlid ja només val per a la capa del paquet.
 *       Correcció: els serveis propis de Sóc de Poble (oauthRelayUrl,
 *       botApiUrl, sollutiaIssuer i la clau morta version) tampoc no entren
 *       per cap capa de l'amfitrió. Des de P1 (261003) l'entrada amb Google
 *       no té relé: torna a la pàgina de l'amfitrió (data/oauthRelay.js,
 *       urlDeTornada), i oauthRelayUrl és una clau reservada que no llig ningú.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter, useLocation, useRouter } from './app/contexts/RouterContext.jsx';
import App from './app/App.jsx';
import { SessionProvider } from './app/contexts/SessionContext.jsx';
import { UIProvider } from './app/contexts/UIContext.jsx';
import { IdentitatProvider } from './app/contexts/IdentitatContext.jsx';
import styles from './css/index.css?inline';
import { PREFERENCIES_TEMA, aplicaContrast, readContrastPreference, readThemePreference, resolveContrast, resolveTheme } from './config/theme';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { normalizeBackendConfig } from './config/backendConfig.js';
import { getRuntimePolicy } from './config/runtimePolicy.js';
import { normalitzaBase, triaRouter } from './app/contexts/politicaRouter.js';
import { llegeixConfigAmfitrio, sanejaEtiqueta, sanejaIdentificador, sanejaRuta } from './config/configAmfitrio.js';
import { baseRecursos, fixaBaseRecursos, resolveAsset } from './config/assetResolver.js';
import { permetOrigenMitjans } from './utils/sanitize.js';
import { esLlenguaSuportada } from './config/i18n.js';
import { ORIGENS_BACKEND } from './config/origensSollutia.js';
import { CONTRACTE_AMFITRIO_V1, tapaRuta } from './config/contracteAmfitrio.js';
import { CAPA_DE_COMPILACIO, avisaClausDescartades, capaDelPaquet, nomesDeLAmfitrio, separaClausDelPaquet } from './config/capaDelPaquet.js';
import { llistaApps, subscriu as subscriuApps } from './apps/plataforma/registreApps.js';

/* ─────────────── Clàusula dels slugs: la ruta a la URL de l'amfitrió ─────────────── */

/* Fase 1 (sempre, en memòria): l'element avisa cada canvi de secció amb
   `sdp-navega` ({ ruta }) disparat sobre ell mateix. La ruta va TAPADA
   (tapaRuta, el criteri de la telemetria): qualsevol script de la pàgina
   amfitriona l'escolta, i la consulta porta el text del cercador i les fitxes
   porten ids de persones. No passa pel bus de window: amb dues instàncies, el
   reemissor global el duplicaria.
   Fase 2 (opt-in `ruta-a-url`, només la primera instància): la ruta SENCERA
   viu en UNA clau de la URL de l'amfitrió, al fragment (#sdp=) o a la
   consulta (?sdp=); qui la declara accepta que hi viatge (contracte,
   rutaAUrl). La resta de la URL no es toca: ni es reordena ni es recodifica.
   Al fragment només s'escriu si és buit o de paràmetres (clau=valor): un
   ancoratge (#seccio) o un router de hash (#/ruta) de l'amfitrió no es
   toquen. Per damunt del límit de lectura, només s'escriu el camí. */
export const ESDEVENIMENT_RUTA = 'sdp-navega';
const { clau: CLAU_RUTA, modes: MODES_RUTA } = CONTRACTE_AMFITRIO_V1.rutaAUrl;
const LIMIT_RUTA_A_URL = CONTRACTE_AMFITRIO_V1.limits.rutaAUrl;
const esTrosPropi = (tros) => tros === CLAU_RUTA || tros.startsWith(`${CLAU_RUTA}=`);
/* Un paràmetre de l'amfitrió: una clau sense '/', '?' ni '#', i un '='. */
const esTrosClauValor = (tros) => tros === '' || /^[^=/?#]+=/.test(tros);
// '/' es queda llegible; '&', '=', '#', '?' i la resta van codificats.
const codificaRuta = (ruta) => encodeURIComponent(ruta).replace(/%2F/g, '/');

/* El que escriuRutaALaUrl no ha pogut escriure sencer, i per què. */
const AVISOS_DEL_REFLEX = Object.freeze({
  'fragment-alie': 'El fragment de la URL de l’amfitrió no és de paràmetres clau=valor (un ancoratge o un router de hash): '
    + 'la ruta no s’hi escriu per a no trencar-lo. Declareu ruta-a-url="parametre".',
  'nomes-cami': `La ruta passa de ${LIMIT_RUTA_A_URL} caràcters codificada: a la URL de l’amfitrió només s’escriu el camí, sense la consulta.`,
  'massa-llarga': `El camí de la ruta passa de ${LIMIT_RUTA_A_URL} caràcters codificat: no s’escriu a la URL de l’amfitrió.`,
  'no-escrita': 'El navegador ha rebutjat l’escriptura a l’historial (massa escriptures seguides o un document sense origen): '
    + 'l’app continua navegant en memòria.'
});

function trossosDeLaUrl(mode) {
  const cru = mode === 'parametre' ? window.location.search : window.location.hash;
  return cru.length > 1 ? cru.slice(1).split('&') : [];
}

/** La ruta de l'app que porta la URL de l'amfitrió, o undefined (absent o invàlida). */
export function llegeixRutaDeLaUrl(mode) {
  if (!MODES_RUTA.includes(mode) || typeof window === 'undefined') return undefined;
  const tros = trossosDeLaUrl(mode).find((t) => t.startsWith(`${CLAU_RUTA}=`));
  if (!tros) return undefined;
  const codificada = tros.slice(CLAU_RUTA.length + 1);
  if (codificada.length > LIMIT_RUTA_A_URL) return undefined;
  try { return sanejaRuta(decodeURIComponent(codificada)); } catch { return undefined; }
}

/* Onada 12 (261011; ordres 261011_0130, punt 4) · «Arrere» del navegador
   navega dins de l'app. Cada entrada de l'historial que escriu el reflex
   porta, a més de la ruta a la URL, un estat propi sota la clau `sdp` de
   history.state: { ruta, i } (la ruta sencera i quantes entrades pròpies té
   darrere). L'estat de l'amfitrió es conserva i s'amplia ({ ...estat, sdp });
   si no és un objecte pla (un text, una llista, una data) no es toca i
   l'entrada es reconeix només per la URL. */
const esEstatAmpliable = (estat) => estat === null || estat === undefined
  || (typeof estat === 'object' && Object.getPrototypeOf(estat) === Object.prototype);
const ambEstatPropi = (estat, propi) => (esEstatAmpliable(estat) ? { ...estat, [CLAU_RUTA]: propi } : estat);

/** L'estat propi de l'entrada actual de l'historial ({ ruta, i }), o undefined si no és nostra. */
export function estatPropi() {
  let propi;
  try { propi = window.history.state?.[CLAU_RUTA]; } catch { return undefined; }
  if (!propi || typeof propi !== 'object') return undefined;
  const ruta = sanejaRuta(propi.ruta);
  return ruta && Number.isSafeInteger(propi.i) && propi.i >= 0 ? { ruta, i: propi.i } : undefined;
}

/* La ruta de l'entrada actual: mana la URL. L'estat propi només la completa
   quan la URL no ha pogut portar la consulta (nomes-cami) i el camí coincidix. */
function rutaDeLEntrada(mode) {
  const deLaUrl = llegeixRutaDeLaUrl(mode);
  const propi = estatPropi();
  return propi && deLaUrl === propi.ruta.split('?')[0] ? propi.ruta : deLaUrl;
}

/* Un salt numèric de l'app (navigate(-1)) per l'historial del navegador, sense
   passar mai de la primera entrada pròpia: el botó «Arrere» de l'app no trau
   ningú del portal. Fals si l'entrada actual no és nostra o si darrere no hi
   consta cap entrada pròpia: llavors el salt és el de la llista del router,
   que el reflex manté al pas de l'historial (posicio, a ReflexDeRuta). */
function saltaPerLHistorial(n) {
  const propi = estatPropi();
  if (!propi) return false;
  const salt = n < 0 ? Math.max(n, -propi.i) : n;
  if (!salt && n < 0) return false;
  if (salt) window.history.go(salt);
  return true;
}

/**
 * Escriu la ruta a la clau pròpia de la URL i a l'estat propi de l'entrada.
 * Amb `empeny` (una navegació nova de l'usuari) obri una entrada a l'historial
 * (pushState); sense, substituïx l'actual (replaceState: redireccions, àlies,
 * la primera càrrega). Mai no empeny damunt d'una entrada que no és nostra:
 * l'adopta, i «Arrere» des de la primera pantalla ix del portal com en
 * qualsevol web.
 * `iBase`: la posició de l'última entrada pròpia coneguda (-1 si cap), per a
 * comptar una entrada que arriba sense estat propi: la que ha obert el
 * navegador amb la nostra clau a la URL (un fragment, un ancoratge) va
 * darrere d'ella; la que és de l'amfitrió i s'adopta, al seu lloc.
 * Si el navegador rebutja l'escriptura (Safari en talla 100 cada 30 s; un
 * document d'origen opac, totes) no llança: torna 'no-escrita'.
 * @returns {'escrita'|'igual'|'nomes-cami'|'fragment-alie'|'massa-llarga'|'no-escrita'|undefined}
 *   undefined si no hi ha res a escriure (mode o ruta invàlids).
 */
export function escriuRutaALaUrl(mode, ruta, empeny = false, iBase = -1) {
  if (!MODES_RUTA.includes(mode) || typeof window === 'undefined') return undefined;
  const neta = sanejaRuta(ruta);
  if (!neta) return undefined;
  const trossos = trossosDeLaUrl(mode);
  /* WP-R4: «#seccio» passaria a «#seccio&sdp=/xat», i el navegador buscaria
     l'id «seccio&sdp=/xat»: ni scroll ni :target, i un router de hash
     rebria una ruta alterada. */
  if (mode === 'fragment' && !trossos.every((t) => esTrosPropi(t) || esTrosClauValor(t))) return 'fragment-alie';
  /* WP-R5: el mateix límit que llegeixRutaDeLaUrl. Una ruta més llarga es
     rebutjaria en recarregar: es guarda el camí, que sí que torna. */
  let codificada = codificaRuta(neta);
  let estat = 'escrita';
  if (codificada.length > LIMIT_RUTA_A_URL) {
    codificada = codificaRuta(neta.split('?')[0]);
    if (codificada.length > LIMIT_RUTA_A_URL) return 'massa-llarga';
    estat = 'nomes-cami';
  }
  const propi = `${CLAU_RUTA}=${codificada}`;
  const lloc = trossos.findIndex(esTrosPropi);
  const nous = lloc < 0 ? [...trossos, propi]
    : trossos.map((t, i) => (i === lloc ? propi : t)).filter((t, i) => i === lloc || !esTrosPropi(t));
  const { pathname, search, hash } = window.location;
  const url = mode === 'parametre' ? `${pathname}?${nous.join('&')}${hash}` : `${pathname}${search}#${nous.join('&')}`;
  const mateixaUrl = url === pathname + search + hash;
  const anterior = window.history.state;
  const entrada = estatPropi();
  /* Ja és l'entrada d'esta ruta (o l'estat de l'amfitrió no es pot ampliar i
     la URL ja la porta): res a escriure. */
  if (mateixaUrl && (entrada ? entrada.ruta === neta : !esEstatAmpliable(anterior))) return estat === 'escrita' ? 'igual' : estat;
  const nostra = Boolean(entrada) || trossos.some((t) => t.startsWith(`${CLAU_RUTA}=`));
  const i = entrada ? entrada.i : Math.max(0, iBase + (nostra ? 1 : 0));
  try {
    if (empeny && nostra) window.history.pushState(ambEstatPropi(anterior, { ruta: neta, i: i + 1 }), '', url);
    else window.history.replaceState(ambEstatPropi(anterior, { ruta: neta, i }), '', url);
  } catch {
    return 'no-escrita';
  }
  return estat;
}

/* Viu dins del MemoryRouter: escriu la ruta a la URL i a l'historial del
   navegador, i quan l'entrada canvia (Arrere i Avant del navegador, fragment
   editat, pàgina tornada de la memòria cau) la segueix sense escriure res.
   Onada 12 (261011; ordres 261011_0130, punt 4) · Una navegació nova de l'app
   (la llista pròpia del router creix: `index` puja) obri una entrada;
   una substitució (Navigate, àlies, el cercador) reescriu l'actual. El
   popstate d'una entrada que no porta la clau `sdp` és de l'amfitrió i no es
   toca. En un popstate l'app torna a l'entrada de la llista del router que
   li correspon (`posicio`), amb el seu estat (navigate(to, { state })), que
   no passa mai per history.state; si la llista no la té (una recàrrega),
   reescriu l'última.
   `alDia` (ref de qui munta): cert quan l'entrada actual del navegador és la
   de la ruta de l'app. Si l'última ruta no s'ha pogut escriure (rebutjada,
   massa llarga, fragment alié, estat de l'amfitrió no ampliable), els salts
   numèrics de l'app van per la llista del router i no per l'historial.
   No pinta res. */
function ReflexDeRuta({ mode, alDia }) {
  const { navigate, index } = useRouter();
  const { pathname, search } = useLocation();
  const actual = search ? `${pathname}?${search}` : pathname;
  const actualRef = React.useRef(actual);
  const darrerIndex = React.useRef(index);
  // La posició de l'última entrada pròpia vista i el que la separa de la de la llista del router.
  const darrerI = React.useRef(-1);
  const desfasament = React.useRef(0);
  // Un avís per motiu i per instància: la ruta canvia a cada tecla del cercador.
  const avisats = React.useRef(new Set());

  React.useEffect(() => {
    actualRef.current = actual;
    const empeny = index > darrerIndex.current;
    darrerIndex.current = index;
    const estat = escriuRutaALaUrl(mode, actual, empeny, darrerI.current);
    const propi = estatPropi();
    alDia.current = Boolean(propi) && propi.ruta === sanejaRuta(actual);
    if (alDia.current) {
      darrerI.current = propi.i;
      desfasament.current = index - propi.i;
    }
    if (Object.hasOwn(AVISOS_DEL_REFLEX, estat) && !avisats.current.has(estat)) {
      avisats.current.add(estat);
      console.warn(`[soc-de-poble] ${AVISOS_DEL_REFLEX[estat]}`);
    }
  }, [mode, actual, index, alDia]);

  React.useEffect(() => {
    const alCanviarLaUrl = () => {
      const propi = estatPropi();
      if (propi) darrerI.current = propi.i;
      const ruta = rutaDeLEntrada(mode);
      if (!ruta || ruta === actualRef.current) return;
      // popstate i hashchange arriben junts quan només canvia el fragment: un sol salt.
      actualRef.current = ruta;
      navigate(ruta, { replace: true, posicio: propi ? propi.i + desfasament.current : undefined });
    };
    // bfcache: la pàgina torna sencera, però es comprova que l'app i la URL diuen el mateix.
    const enTornar = (event) => { if (event.persisted) alCanviarLaUrl(); };
    window.addEventListener('hashchange', alCanviarLaUrl);
    window.addEventListener('popstate', alCanviarLaUrl);
    window.addEventListener('pageshow', enTornar);
    return () => {
      window.removeEventListener('hashchange', alCanviarLaUrl);
      window.removeEventListener('popstate', alCanviarLaUrl);
      window.removeEventListener('pageshow', enTornar);
    };
  }, [mode, navigate]);

  return null;
}

/* ───────────────────────────── Error boundary ──────────────────────────── */
export default function PedraSecaEmbed({ config: suppliedConfig, themeMode, language, isFirstInstance, targetNode }) {
  const config = React.useMemo(() => normalizeBackendConfig(suppliedConfig), [suppliedConfig]);
  /* El router pertany al muntatge: canviar-lo destruiria la navegació. La
     tria és la política universal (politicaRouter.js): sense cap declaració,
     memòria, i la URL de l'amfitrió no es toca. */
  const [router] = React.useState(() => triaRouter(config, { primeraInstancia: isFirstInstance !== false }));
  /* El reflex a la URL també pertany al muntatge: només en memòria, només la
     primera instància i només si l'amfitrió el declara. Amb ell, la ruta de
     la URL guanya a la ruta inicial; sense, la de sempre. */
  const [reflex] = React.useState(() => (router.memoria && isFirstInstance !== false && MODES_RUTA.includes(config.rutaAUrl)
    ? config.rutaAUrl : null));
  const [rutaInicial] = React.useState(() => (reflex && rutaDeLEntrada(reflex)) || config.rutaInicial);
  /* Els salts numèrics de l'app van per l'historial del navegador només
     mentre el reflex el té al dia (ReflexDeRuta); si no, per la llista pròpia. */
  const alDia = React.useRef(false);
  const alSaltar = React.useCallback((n) => alDia.current && saltaPerLHistorial(n), []);

  /* WP-R1: cap a l'amfitrió ix la ruta tapada, i només quan canvia: escriure
     al cercador (/cerca?q=…, cada 250 ms) no és cap navegació nova. */
  const darreraTapada = React.useRef(null);
  const alCanviarRuta = React.useCallback((ruta) => {
    const element = targetNode?.host;
    if (!element || typeof element.dispatchEvent !== 'function') return;
    const tapada = tapaRuta(ruta);
    if (tapada === darreraTapada.current) return;
    darreraTapada.current = tapada;
    element.dispatchEvent(new CustomEvent(ESDEVENIMENT_RUTA, { detail: { ruta: tapada }, bubbles: true, composed: true }));
  }, [targetNode]);

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
        ? (
          <MemoryRouter rutaInicial={rutaInicial} onCanvi={alCanviarRuta} alSaltar={reflex ? alSaltar : undefined}>
            {reflex ? <><ReflexDeRuta mode={reflex} alDia={alDia} />{app}</> : app}
          </MemoryRouter>
        )
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
 * SEGURETAT (Model B, A1 i A3, 261003): un editor de contingut que pot escriure
 * HTML podria posar `supabase-url` o `tenant-id` a l'etiqueta per a desviar
 * l'inici de sessió cap a un servidor propi o canviar de poble. Per això els
 * atributs de backend i de tenant (`backend-url`, `tenant-id`, `supabase-url`,
 * `supabase-anon-key`, `data-mode`) ja no fixen res: l'element els reconeix
 * per a avisar, i composaCapes() els descarta. Ni `configura()` els admet. El
 * backend i el tenant només ixen de la capa del paquet (config/capaDelPaquet.js).
 * El mateix val per als serveis propis (`oauth-relay-url`, `bot-api-url`,
 * `sollutia-issuer`) des de la correcció de l'A1: un `oauth-relay-url` d'un
 * origen permés desviava l'entrada amb Google cap on volia l'etiqueta.
 */
/* Llista tancada: contracteAmfitrio.js classifica cada atribut (marcatge,
   opt-in o propi de Sóc de Poble) i una prova de paritat ho vigila. */
export const ATRIBUTS = Object.freeze({
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
  'ruta-inicial': 'rutaInicial',
  'traductor-url': 'traductorUrl',
  'ruta-a-url': 'rutaAUrl'
});

export const CLAUS_PERMESES = Object.freeze(new Set([
  'basePath','supabaseUrl','supabaseAnonKey','dataMode','botApiUrl',
  'fontsHref','pluginUrl','routerType','basename','tenantId','language','themeMode',
  'manageDocumentHead', 'version', 'oauthRelayUrl', 'sollutiaIssuer', 'backendId',
  'nomPoble', 'poble', 'rutaInicial', 'traductorUrl', 'apps', 'rutaAUrl', 'snippetChromeUrl'
]));

/* Els serveis propis de Sóc de Poble que no són del Model B: oauthRelayUrl,
   botApiUrl, sollutiaIssuer, version i snippetChromeUrl (contracte,
   clausDeConfig.propiesDeSdP).
   sanejaConfig() només els accepta si venen de les capes que li arriben, mai
   de la política d'execució que hi mescla normalizeBackendConfig(). */
const SERVEIS_PROPIS = Object.freeze(CONTRACTE_AMFITRIO_V1.clausDeConfig.propiesDeSdP.filter((clau) =>
  !CONTRACTE_AMFITRIO_V1.modelB.clausDeBackend.includes(clau) && !CONTRACTE_AMFITRIO_V1.modelB.clausDeTenant.includes(clau)));

/* Esdeveniments del bus intern (window) que l'element reemet a l'amfitrió amb
   guió en lloc de dos punts: `sdp:navega` → `sdp-navega`. */
export const ESDEVENIMENTS_REEMESOS = Object.freeze(['sdp:auth-change', 'sdp:navega', 'sdp:error', 'sdp:language-changed']);

/* ── Apps de la Plataforma que declara l'amfitrió ── */

const LIMIT_TEXT_APPS = 1024;
const LIMIT_CANDIDATS_APPS = 64;

/**
 * `apps`: ids d'apps del registre de la Plataforma (apps/plataforma/registreApps.js).
 * Admet una cadena separada per blancs ('bar salut') o un array. Torna un
 * array congelat, sense repetits i en l'ordre declarat, amb només els ids que
 * el registre coneix; undefined si el valor no té forma o no en queda cap.
 * @param {unknown} valor
 * @param {string[]} [conegudes] ids del registre (per defecte, el del document)
 */
export function sanejaApps(valor, conegudes = llistaApps().map((app) => app.id)) {
  let candidats;
  if (typeof valor === 'string') {
    if (valor.length > LIMIT_TEXT_APPS) return undefined;
    candidats = valor.trim().split(/\s+/);
  } else if (Array.isArray(valor)) {
    candidats = valor;
  } else {
    return undefined;
  }
  const ids = [];
  for (const id of candidats.slice(0, LIMIT_CANDIDATS_APPS)) {
    if (typeof id === 'string' && conegudes.includes(id) && !ids.includes(id)) ids.push(id);
  }
  return ids.length ? Object.freeze(ids) : undefined;
}

/* Claus tipades: el valor que el seu sanejador no accepta desapareix, no
   arriba mai a l'app com a text cru. `undefined` vol dir «fora». */
const SANEJADORS_TIPATS = Object.freeze({
  // Servei públic del mateix amfitrió: mai fonts/CDN ni orígens del backend.
  traductorUrl: (valor) => {
    if (typeof valor !== 'string' || !valor || valor.length > 2048 || /[\s\\\u0000-\u001F\u007F]/.test(valor)
      || valor.startsWith('//') || (!valor.startsWith('/') && !/^https?:\/\//.test(valor))) return undefined;
    try {
      const url = new URL(valor, window.location.origin);
      if (url.origin !== window.location.origin || !['https:', 'http:'].includes(url.protocol)
        || url.username || url.password || url.hash) return undefined;
      return url.href;
    } catch { return undefined; }
  },
  nomPoble: sanejaEtiqueta,
  poble: sanejaIdentificador,
  rutaInicial: sanejaRuta,
  basename: (valor) => normalitzaBase(valor) || undefined,
  routerType: (valor) => (valor === 'browser' || valor === 'memory' ? valor : undefined),
  manageDocumentHead: (valor) => (typeof valor === 'boolean' ? valor : undefined),
  /* T1 (260930): només els codis exactes del selector (ca, es, en, eu, gl).
     'en-US', 'fr', 42 o '' desapareixen i l'app es queda en valencià. */
  language: (valor) => (esLlenguaSuportada(valor) ? valor : undefined),
  /* Auditoria 261007 (B) · Només les tres preferències (theme.js,
     PREFERENCIES_TEMA). Abans un 'fosc' arribava cru a `data-theme` i cap
     selector de tokens.css hi casava. */
  themeMode: (valor) => (PREFERENCIES_TEMA.includes(valor) ? valor : undefined),
  apps: (valor) => sanejaApps(valor),
  rutaAUrl: (valor) => (MODES_RUTA.includes(valor) ? valor : undefined)
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
   plugin-url fonts-href> + paquet) l'element pren el backend de compilació.
   DEFECTES_DEL_PAQUET és eixa capa de compilació (config/capaDelPaquet.js):
   només les variables que són text no buit, congelades una vegada, en avaluar
   el paquet. composaCapes() pren la capa del paquet que mana (capaDelPaquet():
   la que fixa l'entrada pròpia o, si no, esta), i passa per sanejaConfig()
   com qualsevol capa (l'origen de VITE_SUPABASE_URL ja és a la seua llista
   permesa). Des de 261003 (A1) és l'ÚNICA font del backend i del tenant. */
export const DEFECTES_DEL_PAQUET = CAPA_DE_COMPILACIO;

/* configura({config}) tal com el deixa host.js a la política d'execució:
   només les claus de l'amfitrió, perquè host.js ja n'ha tret les del paquet.
   Un valor buit (undefined, null o '') no és cap declaració i no tapa res. */
function capaDeConfigura() {
  let base;
  try { base = getRuntimePolicy(true)?.rawHostConfig; } catch { return {}; }
  if (!base || typeof base !== 'object') return {};
  const capa = {};
  for (const [clau, valor] of Object.entries(base)) {
    if (valor === undefined || valor === null || valor === '') continue;
    capa[clau] = valor;
  }
  return capa;
}

/* El global només dona nomPoble i poble (configAmfitrio.js) i la resta no
   arriba mai a la configuració. Si hi porta backend o tenant, també s'avisa. */
function avisaDelGlobal() {
  let global;
  try { global = globalThis.SocDePobleConfig; } catch { return; }
  try { avisaClausDescartades('global', separaClausDelPaquet(global).descartades); } catch { /* un getter de l'amfitrió que llança no trenca res */ }
}

/**
 * Les capes, de prioritat més baixa a més alta:
 *   capa del paquet < window.SocDePobleConfig < configura({config})
 *     < config-id < config < atributs < propietat JS `config`.
 * Model B (A1 i A3, 261003): el backend i el tenant només ixen de la capa del
 * paquet. Les capes de l'amfitrió en perden les claus (nomesDeLAmfitrio), i
 * també les dels serveis propis de Sóc de Poble, amb un avís per canal i clau,
 * i no poden trepitjar-les ni amb un valor buit.
 * El resultat és cru: sanejaConfig() el neteja i, ja fusionat, deriva la ruta
 * inicial del poble que ha guanyat si ningú n'ha declarat una de vàlida.
 */
export function composaCapes({ json = {}, atributs = {}, propietat = {} } = {}) {
  avisaDelGlobal();
  return {
    ...capaDelPaquet(),
    ...llegeixConfigAmfitrio(),
    ...nomesDeLAmfitrio(capaDeConfigura(), 'configura'),
    ...nomesDeLAmfitrio(json, 'config'),
    ...nomesDeLAmfitrio(atributs, 'atributs'),
    ...nomesDeLAmfitrio(propietat, 'propietat')
  };
}

export function sanejaConfig(cru) {
  const capes = cru && typeof cru === 'object' ? cru : {};
  cru = normalizeBackendConfig(cru);
  const net = {};
  for (const clau of CLAUS_PERMESES) {
    if (clau in cru) net[clau] = cru[clau];
  }
  /* Correcció de l'A1: normalizeBackendConfig() hi mescla la política
     d'execució sencera. host.js ja no hi deixa entrar cap servei propi, i
     l'element tampoc no en pren cap que només vinga d'ella. */
  for (const clau of SERVEIS_PROPIS) {
    if (!Object.hasOwn(capes, clau)) delete net[clau];
  }
  const CAMPOS_URL = Object.freeze(['supabaseUrl', 'botApiUrl', 'basePath', 'pluginUrl', 'fontsHref', 'oauthRelayUrl', 'sollutiaIssuer']);
  
  // Orígens específics permesos (una sola llista: config/origensSollutia.js).
  const ORIGENS_PERMESOS = [...ORIGENS_BACKEND];
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
    this._manualTheme = null;
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
        // T1: l'amfitrió pot escoltar `sdp-language-changed` a l'element.
        for (const nom of ESDEVENIMENTS_REEMESOS) window.addEventListener(nom, this._reemissorEvents);
      }
    }

    /* Una app que l'amfitrió registra després de muntar (registraApp) pot
       ser a la seua llista `apps`: la configuració es torna a calcular. */
    if (!this._desSubscriuApps) {
      this._desSubscriuApps = subscriuApps(() => {
        if (this.isConnected && this._config && this._recalcularConfig()) this._render();
      });
    }

    /* El shadow root sobreviu als moviments: es reaprofita, no es recrea. */
    if (!this._closedRoot) this._closedRoot = this.attachShadow({ mode: 'closed' });

    const arrel = this._closedRoot;
    const full = obtenirFull();
    let fullAdoptat = false;
    if (full && 'adoptedStyleSheets' in arrel) {
      try {
        let currentSheets = Array.from(arrel.adoptedStyleSheets);
        full.forEach(sheet => {
          if (!currentSheets.includes(sheet)) currentSheets.push(sheet);
        });
        arrel.adoptedStyleSheets = currentSheets;
        fullAdoptat = full.every(sheet => arrel.adoptedStyleSheets.includes(sheet));
      } catch {
        // Fallback robust per a certs entorns amfitrions que trenquen adoptedStyleSheets
      }
    } 
    
    if (!fullAdoptat) {
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
    /* D6 · Mode Bancal (261004): com el tema, abans del primer pintat de
       React. Després el manté App.jsx (tria i `prefers-contrast`). */
    aplicaContrast(this, resolveContrast(readContrastPreference()));
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
      else SocDePobleElement._despintaAmfitrio(this);
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

    /* Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
       PROHIBIDES (PRIVACITAT)») · Relleu 261007 (peça «imatges-detall») · Les
       llavors que resolen imatges EN IMPORTAR-SE (marketContent.js,
       townsContent.js) porten l'origen de l'script que ens ha carregat
       (ORIGEN_DEL_PAQUET), no el del plugin-url, i el mode estricte del Mur
       (esFontImatgePropia) només admet els orígens registrats: amb un
       plugin-url d'un altre origen, les fotos de la llavor deixaven de
       pintar-se. També es registra el del paquet. Amb el paquet trossejat,
       provisionalDelPaquet.js (el primer import d'embed.jsx) fixa la base del
       carregador abans que s'avalue este mòdul: ORIGEN_DEL_PAQUET és el del
       carregador, el mateix dels trossos. Sense paquet de fora
       (socdepoble.org, les proves) és buit i no es registra res. */
    if (ORIGEN_DEL_PAQUET && typeof window !== 'undefined' && ORIGEN_DEL_PAQUET !== window.location.origin) {
      permetOrigenMitjans(ORIGEN_DEL_PAQUET);
    }
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
    /* Auditoria 261007 (B) · Com setLanguage: el que no és una de les tres
       preferències (PREFERENCIES_TEMA) es descarta, i manen la config o la
       preferència de sempre. Abans `setTheme('fosc')` deixava
       data-theme="fosc", que cap selector de tokens.css reconeix. */
    this._manualTheme = PREFERENCIES_TEMA.includes(theme) ? theme : null;
    this.dataset.theme = resolveTheme(this._manualTheme ?? this._config?.themeMode ?? readThemePreference());
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
      SocDePobleElement._fonsPrevi = {
        valor: arrel.style.getPropertyValue('--sdp-bg'),
        prioritat: arrel.style.getPropertyPriority('--sdp-bg'),
        tema: arrel.getAttribute('data-sdp-theme')
      };
    }
    this._pintaActiu = true;
    arrel.style.setProperty('--sdp-bg', valor);
    arrel.dataset.sdpTheme = this.dataset.theme || '';
  }

  /** Retira només el nostre opt-in; una altra instància viva conserva el seu. */
  static _despintaAmfitrio(element) {
    if (element) element._pintaActiu = false;
    if (typeof document === 'undefined' || SocDePobleElement._fonsPrevi === undefined) return;
    const altre = [...activeElements].reverse().find(el => el._pintaActiu && el.isConnected && el.hasAttribute('pinta-amfitrio'));
    if (altre) {
      altre._pintaAmfitrio();
      return;
    }
    const arrel = document.documentElement;
    const previ = SocDePobleElement._fonsPrevi;
    if (previ.valor) arrel.style.setProperty('--sdp-bg', previ.valor, previ.prioritat);
    else arrel.style.removeProperty('--sdp-bg');
    if (previ.tema === null) arrel.removeAttribute('data-sdp-theme');
    else arrel.setAttribute('data-sdp-theme', previ.tema);
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
      /* Auditoria 261007 (B) · El tema que l'amfitrió ha fixat amb setTheme()
         mana: un canvi de mode del telèfon ja no el trepitja si no és 'system'. */
      const mode = this._manualTheme ?? this._config?.themeMode ?? readThemePreference();
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
      for (const nom of ESDEVENIMENTS_REEMESOS) window.removeEventListener(nom, this._reemissorEvents);
      this._reemissorEvents = null;
    }
    if (this._desSubscriuApps) {
      this._desSubscriuApps();
      this._desSubscriuApps = null;
    }

    activeElements.delete(this);

    this._paraDEscoltarTema();

    SocDePobleElement._despintaAmfitrio(this);
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
