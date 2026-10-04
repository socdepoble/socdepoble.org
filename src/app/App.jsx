import { RouteSEO } from '../hooks/RouteSEO';
import { RouteTelemetria } from '../hooks/RouteTelemetria';
import { usePullToRefresh } from '../hooks/usePullToRefresh.js';
import { useEntitatDelProjecte } from '../hooks/useEntitatDelProjecte.js';
import React, { lazy, Suspense, useCallback, useEffect, useRef, memo, StrictMode, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate, useLocation, useRouter } from './contexts/RouterContext';
import { MoonStar, Search, Settings, Sun, Globe } from '../icons.jsx';
import { PanelLeftClose } from 'lucide-react';
import { IaiaIcon } from '../components/PedraSeca/atoms/icones';
import BrandMark from '../components/BrandMark';
import { NotificationProvider } from '../components/universal/NotificationContext.jsx';
import { Dialeg } from '../components/PedraSeca/organismes/Dialeg.jsx';
import { DEFAULT_SECTION_PATH, SECTIONS, SECTION_ORDER } from '../config/sections';
import { getSectionLabels } from '../config/i18n';
import { normalizeBackendConfig } from '../config/backendConfig.js';
import { RUTA_DESPRES_D_ENTRAR, esRutaDEntrada, rutaDEntrada } from '../config/rutaEntrada.js';
import { recullTornadaOAuth } from '../data/backendPort.js';
import { anunciaEnllacDeRecuperacio, marcaRecuperacioPendent } from '../data/recuperacioPendent.js';
import { useSessioOpcional } from './contexts/SessionContext.jsx';
import { reclamaContingutDelConvidat } from '../data/identitat.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { delVal } from '../config/storage';
import { ATRIBUT_CONTRAST, CONTRAST_BANCAL, arrelDePresentacio, reclamaAtribut } from '../config/theme';
import { esAmaDelDocument } from '../apps/plataforma/interruptors.js';
import { EVENT_NIVELL_IAIA, esIaiaActiva, nivellIaiaDesat } from '../sections/realitat/nivellIaia.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { BotoCrom } from '../components/universal/PanellCrom.jsx';
/* T47 · Escriptors de l'autodesament des de l'arrencada (reprenen esborranys pendents). */
import './autodesamentEscriptors.js';
const XatSection = lazy(() => import('../sections/xat/XatSection'));
const MurSection = lazy(() => import('../sections/mur/MurSection'));
const MercatSection = lazy(() => import('../sections/mercat/MercatSection'));
const PoblesSection = lazy(() => import('../sections/pobles/PoblesSection'));
const PoblacioSection = lazy(() => import('../sections/poblacio/PoblacioSection'));
const CalendariSection = lazy(() => import('../sections/calendari/CalendariSection'));
const MultimediaSection = lazy(() => import('../sections/multimedia/MultimediaSection'));
const NotesSection = lazy(() => import('../sections/notes/NotesSection'));

const DevicesSection = lazy(() => import('../sections/dispositius/DevicesSection'));
const ConnectarSection = lazy(() => import('../sections/connectar/ConnectarSection'));
const ControlSection = lazy(() => import('../sections/control/ControlSection'));
const OnboardingSection = lazy(() => import('../sections/onboarding/OnboardingSection'));
const AdminSection = lazy(() => import('../sections/admin/AdminSection'));
const ConsolaSection = lazy(() => import('../sections/consola/ConsolaSection'));

const TranslationsSection = lazy(() => import('../sections/translations/TranslationsSection'));
const TextSection = lazy(() => import('../sections/text/TextSection'));
const TaulerTelemetria = lazy(() => import('../sections/text/TaulerTelemetria'));
import RutaWikiDePoble from '../sections/wiki-de-poble/RutaWikiDePoble.jsx';
const DesignSection = lazy(() => import('../sections/disseny/DesignSection'));
const SearchSection = lazy(() => import('../sections/search/SearchSection'));
const ProfileSection = lazy(() => import('../sections/profile/ProfileSection'));
const PerfilPublicSection = lazy(() => import('../sections/profile/PerfilPublicSection'));
const PerfilShell = lazy(() => import('../sections/profile/PerfilShell'));
const ItemDetailSection = lazy(() => import('../sections/detail/ItemDetailSection'));
const PageDetailSection = lazy(() => import('../sections/detail/PageDetailSection'));
const RealitatSection = lazy(() => import('../sections/realitat/RealitatSection'));
/* Plataforma d'Apps Enxufables (261002) · el portal /app i cada app a /app/<id>/*. */
const RutaApps = lazy(() => import('../apps/plataforma/RutaApps.jsx'));
/* P7-A (261004) · la pàgina de cada utilitat del Panell: /plugin/<id> (sections/plugins/). */
const PluginPage = lazy(() => import('../sections/plugins/PluginPage.jsx'));
import NotFoundPage from '../pages/NotFoundPage';
import { CoreContentProvider, useCoreContent } from './contexts/CoreContentContext';
import { MurProvider } from '../sections/mur/MurContext';
import { NotesDataProvider } from '../sections/notes/NotesDataContext';
import { NotesProvider } from '../sections/notes/NotesContext';
import { XatProvider } from '../sections/xat/XatContext';
const XatControlSection = lazy(() => import('../sections/xat/XatControlSection'));
import { MultimediaProvider } from '../sections/multimedia/MultimediaContext';
import { useUIActions, useUIState } from './contexts/UIContext';
/* T43 (ordre del Mestre, 260928) · la identitat activa de la barra negra. */
import { BotoIdentitatActiva } from '../components/universal/identitat/BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from '../components/universal/identitat/CalaixIdentitats.jsx';
import { useIdentitatDeLaBarra } from '../components/universal/identitat/useIdentitatDeLaBarra.js';
/* Enxufe universal (260929) · marca de l'amfitrió i enllaços interns.
   T7 (261001) · l'estat de connexió amb el node, per a la franja. */
import {
  FranjaAmfitrio, TitolAmfitrio, desaFranjaTancada, etiquetesDeLaFranja, franjaTancadaPer, textDelNode
} from '../components/universal/MarcaAmfitrio.jsx';
import { estatDeConnexio } from '../components/universal/connexio/estatConnexio.js';
import { useEnLinia } from '../components/universal/connexio/useEnLinia.js';
import { sanejaEtiqueta } from '../config/configAmfitrio.js';
import { ancoraDelClic, hrefInternDeClic, preparaRecolocacio } from './enllacosInterns.js';
import { RequireAuth } from './guards/RequireAuth';
import { consolaDemanaSessio } from './guards/guardaConsola.js';
/* Plataforma d'Apps Enxufables (261002) · relleu de la barra lateral: dins
   d'una app, la seua barra; a la resta de rutes, SidebarContent tal qual. */
import { BarraLateral, useTitolBarraLateral } from '../apps/plataforma/BarraLateral.jsx';

const ALL_NAV_SECTIONS = SECTIONS.filter((section) => SECTION_ORDER.includes(section.id));
const NAV_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id !== 'versions' && s.id !== 'legal');
const SYSTEM_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id === 'versions' || s.id === 'legal');
/* La barra lateral separa les eines del poble (fins a Notes) dels textos del projecte. */
const PRIMERA_DEL_PROJECTE = 'projecte';

/* Punt de tall de la barra lateral (ordre del Mestre, 260926; abans 1100):
   fins a 1023px és calaix (Dialeg) i des de 1024px és columna fixa.
   layout.css talla al mateix número (@media (max-width: 1023px)): si canvia
   ací, canvia allà. */
const AMPLE_MAXIM_COMPACTE = 1023;

/* T3 (ordre del Mestre, 260930) · La barra inferior mòbil porta sis caselles
   en un ordre explícit: Xat, Mur, [Panell de Control], Pobles, Mercat i
   Telefonades. Ja no ix de tallar SECTIONS, que continua manant l'ordre de la
   barra lateral. Telefonades no és cap secció ni cap ruta (MobileNav): posar-la
   a SECTIONS la publicaria al manifest SEO i a la barra lateral. */
const seccioDeLaBarraMobil = (id) => NAV_SECTIONS.find((section) => section.id === id);
const MOBILE_NAV_LEADING = ['xat', 'mur'].map(seccioDeLaBarraMobil).filter(Boolean);
const MOBILE_NAV_TRAILING = ['mercat', 'pobles'].map(seccioDeLaBarraMobil).filter(Boolean);

function RouteFallback() {
  return (
    <div className="sdp-app-loading" role="status" aria-live="polite">
      <div className="sdp-spinner sdp-spinner--large" />
      <span className="sr-only">S'està carregant el contingut...</span>
    </div>
  );
}

const SidebarContent = memo(({ isCompact, isDesktopSidebarClosed, toggleSidebar, language, navigate }) => {
  /* T27 · el Panell de control també és una ubicació: a /control i /utilitats
     el botó CONTROL és l'element actiu de la barra. */
  const { pathname } = useLocation();
  const controlActiu = /^\/(control|utilitats)(\/|$)/.test(pathname);
  const enllac = (section, classeExtra = '') => {
    const Icon = section.icon;
    const labels = section.kind === 'gestoria'
      ? { label: section.label, shortLabel: section.shortLabel }
      : getSectionLabels(section.id, language);
    return (
      <NavLink key={section.id} to={section.path} matchPaths={section.subrutes} className={['nav-item', classeExtra.trim()].filter(Boolean).join(' ')} aria-label={labels.label} onClick={() => { if (isCompact) toggleSidebar(); }}>
        <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
        <span className="nav-item__text">
          {labels.label}
        </span>
      </NavLink>
    );
  };

  return (
    <>
        <button type="button" className="brand sdp-unstyled-btn" aria-label="Obrir o tancar menú Sóc de Poble" aria-expanded={isCompact ? true : !isDesktopSidebarClosed} aria-controls="app-sidebar" onClick={toggleSidebar}>
          <BrandMark className="app-brand__mark" />
        </button>

        {/* Rètol curt (Mestre, 260926): «PANELL DE CONTROL» era la fila més ampla
            i fixava la barra al topall de 260px. El nom accessible conserva el sencer. */}
        <div className="sidebar-control-row">
        <button
          type="button"
          className="sidebar-control-btn"
          aria-label="Panell de control"
          aria-current={controlActiu ? 'page' : undefined}
          onClick={() => navigate('/control')}
        >
          <Settings className="icona-linia" size={24} strokeWidth={2.1} aria-hidden="true" focusable="false" />
          <span className="nav-item__text">CONTROL</span>
        </button>
        {/* T24 (Mestre, 260927 nit): plegada, la cel·la de dalt del rail no
            ensenya una fletxa sinó la roda de CONTROL, la mateixa del botó
            que amaga (layout.css: .sidebar-closed .sidebar-control-btn):
            així es llig que eixe botó obri la barra de control. */}
        {!isCompact && <button type="button" className="sidebar-rail-toggle"
          aria-label={isDesktopSidebarClosed ? 'Desplegar barra lateral' : 'Plegar barra lateral'}
          aria-expanded={!isDesktopSidebarClosed} aria-controls="app-sidebar" onClick={toggleSidebar}>
          {isDesktopSidebarClosed
            ? <Settings className="icona-linia" strokeWidth={2.1} aria-hidden="true" focusable="false" />
            : <PanelLeftClose size={24} />}
        </button>}
        </div>

        {/* Llista i peu són germans: el scroll es tria a layout.css (§ SIDEBAR · SCROLL).
            «Seccions» és un grup (role), no un div genèric amb nom. */}
        <div className="app-sidebar-nav">
          <div className="app-sidebar-nav__llista" role="group" aria-label="Seccions">
            {NAV_SECTIONS.map((section) => (
              <React.Fragment key={section.id}>
                {section.id === PRIMERA_DEL_PROJECTE && <hr className="app-sidebar-divider" />}
                {enllac(section)}
              </React.Fragment>
            ))}
          </div>
          
          <div className="app-sidebar-nav-footer">
            {SYSTEM_SECTIONS.map((section) => enllac(section, ' nav-item--system'))}
          </div>
        </div>
    </>
  );
});

function AppShell({ children, mobileNav }) {
  const [containerWidth, setContainerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarClosed, setIsDesktopSidebarClosed] = useState(false);
  const rootRef = useRef(null);

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // La caixa de l'app, també abans del primer pintat en un amfitrió ample.
    const mesura = () => {
      const ample = root.getBoundingClientRect().width;
      if (ample > 0) {
        // Tall local del full inferior, independent del mestre de navegació.
        root.toggleAttribute('data-sdp-estret', ample <= 720);
        setContainerWidth(ample);
      }
    };
    mesura();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', mesura);
      return () => window.removeEventListener('resize', mesura);
    }
    const ob = new ResizeObserver(mesura);
    ob.observe(root);
    return () => ob.disconnect();
  }, []);

  const isCompact = containerWidth <= AMPLE_MAXIM_COMPACTE;
  const toggleSidebar = () => {
    if (isCompact) {
      setIsMobileSidebarOpen(v => !v);
    } else {
      setIsDesktopSidebarClosed(v => !v);
    }
  };

  useEffect(() => {
    if (!rootRef.current) return;
    if (isDesktopSidebarClosed) {
      rootRef.current.classList.add('sidebar-closed');
    } else {
      rootRef.current.classList.remove('sidebar-closed');
    }
  }, [isDesktopSidebarClosed]);

  const { showToast } = useToast();
  const { language, status, themeMode, contrastMode, externalConfig } = useUIState();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const { basename, memoria } = useRouter();
  const location = useLocation();
  /* R · correcció de la revisió · La closca es pot muntar sense proveïdor de
     sessió (catàleg, proves): llavors no hi ha cap recuperació en curs.
     R2 · En curs vol dir un enllaç del correu que espera «Desa» (o que s'ha
     perdut en recarregar) o, per compatibilitat, una sessió marcada. */
  const sessioDeLaClosca = useSessioOpcional();
  const recuperacioEnCurs = sessioDeLaClosca?.recuperacioPendent === true
    || sessioDeLaClosca?.enllacDeRecuperacio != null;
  const titolMenu = useTitolBarraLateral();
  const mainRef = useRef(null);
  const contentRef = useRef(null);

  /* Enxufe universal, T2 (260929) · Quan l'amfitrió declara el nom del poble,
     la closca el diu: a la barra negra en escriptori, en una franja davall
     d'ella en compacte (MarcaAmfitrio.jsx). Es torna a sanejar ací perquè un
     amfitrió React pot muntar l'app sense passar per l'element. Sense
     nomPoble (socdepoble.org, el standalone a #root) no hi ha cap node. */
  const nomPoble = sanejaEtiqueta(externalConfig?.nomPoble);

  /* T4 (ordre del Mestre, 260930) · Este document parla amb el servidor real
     ('remote', mòdul neutral backendConfig.js). Ho fan servir la tornada
     d'OAuth (més avall) i, des de T7, l'estat de connexió amb el node.
     T7 (ordre del Mestre, 261001) · La franja diu l'estat de veres, amb
     dades que l'app ja té (estatConnexio.js): el mode, l'última càrrega
     del contingut core (status) i el que diu el dispositiu. Cap petició
     nova ni cap sondeig. Només el verd diu «Connectat». */
  const modeRemot = useMemo(
    () => normalizeBackendConfig(externalConfig || {}).dataMode === 'remote',
    [externalConfig]
  );
  const enLinia = useEnLinia();
  const estatNode = estatDeConnexio({ modeRemot, status, enLinia });
  const textNode = nomPoble ? textDelNode(t, nomPoble, estatNode) : '';
  const etiquetesFranja = useMemo(() => etiquetesDeLaFranja(t), [t]);

  /* T7 · La X amaga la franja d'eixe node fins a la pròxima pestanya
     (sessionStorage, només via storage.js). Si l'escriptura falla (mode
     privat, iframe sense emmagatzematge), s'amaga igual en esta càrrega. El
     focus passa a main per ref perquè no caiga al body quan la X desaparega. */
  const [tancadaPer, setTancadaPer] = useState(franjaTancadaPer);
  const tancaFranja = useCallback(() => {
    desaFranjaTancada(nomPoble);
    setTancadaPer(nomPoble);
    mainRef.current?.focus({ preventScroll: true });
  }, [nomPoble]);
  const franjaVisible = isCompact && Boolean(nomPoble) && tancadaPer !== nomPoble;

  /* Enxufe universal (260929) · Interceptor d'enllaços interns. Els <a> que
     no són <Link> (HTML de la Wiki, articles, connexions) navegarien la pàgina
     de l'amfitrió; ací passen al router, que resol '?…' sobre la ruta de l'app
     (enllacosInterns.js diu quins). És un onClick de React i no un
     addEventListener sobre rootRef: React escolta a l'arrel del muntatge, per
     damunt d'este div, i un escoltador natiu ací correria ABANS que el <Link>
     cridara preventDefault (navegació doble). Com a onClick, el Link ja ha
     decidit quan el clic arriba ací.
     Amb base declarada, l'href del contingut és una URL del document: el
     destí ja arriba sense la base (navigate l'hi posa una vegada) i un camí de
     fora de la base el segueix el navegador, perquè és de l'amfitrió.
     Llei del Píxel (C1): només es munta quan l'app NO és ama d'una URL
     d'arrel neta, és a dir, router en memòria (`memoria` del RouterContext:
     cert al MemoryRouter, fals al de navegador; la mateixa tria que
     triaRouter fa a PedraSecaEmbed) o de navegador amb base declarada. A
     socdepoble.org (navegador sense base) l'arrel no porta onClick: el clic
     fa la recàrrega de sempre i el document nou apareix des de dalt.
     Una navegació de router no carrega cap document: preparaRecolocacio
     llig EN EL CLIC el desplaçador de l'enllaç i el #fragment, i en el
     fotograma següent (la ruta ja pintada) porta a la vista l'element del
     fragment o torna el desplaçador a dalt. */
  const interceptaEnllacos = memoria === true || Boolean(basename);
  const alClicarEnllac = useCallback((e) => {
    const nadiu = e.nativeEvent;
    const arrel = e.currentTarget;
    const ancora = ancoraDelClic(nadiu, arrel);
    const desti = hrefInternDeClic(nadiu, ancora, basename);
    if (desti === null) return;
    e.preventDefault();
    const recoloca = preparaRecolocacio(nadiu, ancora, arrel, desti);
    navigate(desti);
    requestAnimationFrame(recoloca);
  }, [navigate, basename]);

  // Lliscar per recarregar (mòbil): les regles del gest viuen al hook.
  const indicatorRef = useRef(null);
  const textosRecarrega = useMemo(() => ({
    estirant: t('pull.pull', 'Estira per recarregar…'),
    llest: t('pull.release', 'Deixa anar per recarregar…'),
    recarregant: t('pull.refreshing', 'Recarregant…')
  }), [t]);
  usePullToRefresh({
    superficieRef: mainRef,
    contingutRef: contentRef,
    indicadorRef: indicatorRef,
    textos: textosRecarrega
  });

  // Restaurar el focus a main en canviar de ruta (A11y)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    delVal('socdepoble-app-snapshot-v1');
    delVal('socdepoble-section-submissions-v1');
  }, []);

  /* T4 (ordre del Mestre, 260930) · La tornada d'OAuth només es recull quan
     este document parla amb el servidor real (modeRemot, més amunt). En
     llavor o local l'adaptador la rebutja sempre i, amb React de producció
     (sense StrictMode que avorte el primer efecte), cada càrrega pintava el
     toast «L’entrada real…».
     Ordre del Mestre (261002) · Una tornada de Google per redirecció que porta
     sessió aterra a la pròpia identitat (RUTA_DESPRES_D_ENTRAR), també quan no
     torna a /registre: des de P1 (261003) torna a la pàgina de l'amfitrió on es
     va prémer el botó (data/oauthRelay.js, urlDeTornada), amb el router en
     memòria o amb qualsevol camí. La resposta es
     vigila amb una ref de muntatge i no amb un AbortController de l'efecte: en
     StrictMode l'efecte es desmunta i es torna a muntar abans que responga, la
     tornada no es repetix (tornadaFeta) i l'avortament deixava la resposta
     sense atendre fora de producció. Com `montat` a OnboardingSection. */
  const tornadaFeta = useRef(false);
  const shellMuntat = useRef(false);
  useEffect(() => {
    shellMuntat.current = true;
    return () => { shellMuntat.current = false; };
  }, []);
  useEffect(() => {
    if (tornadaFeta.current || !modeRemot) return;
    tornadaFeta.current = true;
    recullTornadaOAuth(externalConfig)
      .then((sessio) => {
        if (!sessio) return;
        /* R (Onada 3, 261003) · La tornada d'un enllaç de recuperació de
           contrasenya (`recuperacio`, contracte.js): primer la contrasenya nova
           a l'entrada; el perfil, després. R2 (decisió del Mestre, 261003) ·
           Arriba SENSE sessió: l'enllaç espera «Desa» en la memòria del
           document (data/recuperacioPendent.js); es torna a anunciar per a un
           backend que no ho faça ell. Compatibilitat: un backend que ja torna
           sessió (el contracte d'abans) es marca, encara que la closca ja no hi
           siga: és la sessió, no la vista. La guarda de més avall no deixa anar
           enlloc més. */
        if (sessio.recuperacio === true) {
          if (sessio.user?.id != null) marcaRecuperacioPendent(sessio.user.id);
          else anunciaEnllacDeRecuperacio();
          if (shellMuntat.current) navigate(rutaDEntrada({ mode: 'entrar' }), { replace: true });
          return;
        }
        if (!shellMuntat.current) return;
        showToast(t('section.login.success.login', 'Benvingut de nou!'), 'success');
        navigate(RUTA_DESPRES_D_ENTRAR, { replace: true });
      })
      .catch((e) => {
        if (!shellMuntat.current) return;
        showToast(e.message, 'error');
        /* R · Un enllaç de recuperació que ja no val: a l'entrada, on se'n pot demanar un altre. */
        if (e?.recuperacio === true) navigate(rutaDEntrada({ mode: 'entrar' }), { replace: true });
      });
  }, [externalConfig, modeRemot, t, showToast, navigate]);

  /* R · correcció de la revisió · Mentre hi ha una recuperació en curs,
     qualsevol ruta torna a /registre, on hi ha la pantalla per a acabar-la (o
     per a deixar-la): R2, l'enllaç que espera «Desa» o el que s'ha perdut en
     recarregar, i, per compatibilitat, una sessió que encara no ha triat la
     contrasenya nova (no és una entrada). Ho diu data/recuperacioPendent.js,
     que sobreviu a la navegació (i la marca de la pestanya, a recarregar);
     l'estat del router no. Fora de base (camí '') la pàgina és de l'amfitrió
     i no s'hi toca res. */
  useEffect(() => {
    if (recuperacioEnCurs && location.pathname && !esRutaDEntrada(location.pathname)) {
      navigate(rutaDEntrada({ mode: 'entrar' }), { replace: true });
    }
  }, [recuperacioEnCurs, location.pathname, navigate]);

  useEffect(() => {
    const onCanviAuth = (e) => {
      const id = e?.detail?.user?.id;
      if (!id) return;
      reclamaContingutDelConvidat(String(id))
        .then(({ migrat }) => { if (migrat) window.dispatchEvent(new CustomEvent('sdp:refresh-data')); })
        .catch(() => {});
    };
    window.addEventListener('sdp:auth-change', onCanviAuth);

    const onRebuig = (e) => {
      showToast(t('error.rejected', `La publicació ha sigut rebutjada: ${e.detail.error}`), 'error');
    };
    const onXatRebuig = (e) => {
      showToast(t('error.chat.rejected', `El missatge no s'ha pogut enviar: ${e.detail.error}`), 'error');
    };
    window.addEventListener('sdp:submission-rejected', onRebuig);
    window.addEventListener('sdp:chat-rejected', onXatRebuig);

    return () => {
      window.removeEventListener('sdp:auth-change', onCanviAuth);
      window.removeEventListener('sdp:submission-rejected', onRebuig);
      window.removeEventListener('sdp:chat-rejected', onXatRebuig);
    };
  }, [t, showToast]);

  /* El tema, al seu lloc de sempre: l'amfitrió del Shadow DOM o <html>. Els
     selectors foscos dels fulls (:root[data-theme="dark"] …) encara no casen
     amb l'arrel del mòdul, així que el lloc no canvia. W4-12 · s'alinea el
     defecte que comparteix amb el contrast: reclamaAtribut (theme.js) torna
     a l'element el data-theme que tenia quan l'app es desmunta, i dues
     instàncies sobre el mateix element no es barallen. */
  useEffect(() => {
    if (!mainRef.current) return undefined;
    const rootNode = mainRef.current.getRootNode();
    const element = rootNode instanceof ShadowRoot ? rootNode.host : document.documentElement;
    return reclamaAtribut(element, 'data-theme', themeMode || 'light');
  }, [themeMode]);

  /* D6 · Mode Bancal (Q1 del Mestre, 261004) · W4-12 (auditoria de Codex,
     261004) · data-contrast="bancal" va a l'arrel que diu la política d'arrel
     i domini (theme.js: arrelDePresentacio): l'amfitrió <soc-de-poble> dins
     del Shadow DOM; <html> NOMÉS quan l'app és ama del document
     (esAmaDelDocument, el criteri de la Plataforma d'Apps: manageDocumentHead
     === true, sense __SDP_EMBEDDED__ i fora d'iframe); en un document alié
     (l'embed React en DOM ordinari), l'arrel del mòdul, .sdp-root. Així el
     mode normal ja no esborra el data-contrast de la pàgina amfitriona, i en
     desmuntar l'element recupera el que tenia (reclamaAtribut). En mode normal
     l'atribut no hi és. useLayoutEffect (abans de pintar), no useEffect: el
     primer fotograma ja porta el contrast triat. */
  const amaDelDocument = esAmaDelDocument(externalConfig);
  React.useLayoutEffect(() => {
    const arrel = arrelDePresentacio(rootRef.current, { amaDelDocument });
    return reclamaAtribut(arrel, ATRIBUT_CONTRAST, contrastMode === CONTRAST_BANCAL ? CONTRAST_BANCAL : null);
  }, [contrastMode, amaDelDocument]);

  /* Revisió adversarial de C1 (W4-12) · La llengua seguix la mateixa política
     d'arrel i domini que el contrast: l'amfitrió del Shadow DOM, <html> NOMÉS
     quan l'app és ama del document (socdepoble.org, com sempre) i, en un
     document alié, l'arrel del mòdul, que és on viu el text que la parla.
     Abans, l'embed React en DOM ordinari canviava el lang de tota la pàgina
     amfitriona (un WordPress en-US passava a «ca») i no el tornava mai;
     reclamaAtribut el torna en desmuntar. Cap full casa amb [lang] ni :lang(). */
  useEffect(() => {
    const arrel = arrelDePresentacio(rootRef.current, { amaDelDocument });
    return reclamaAtribut(arrel, 'lang', language || 'ca');
  }, [language, amaDelDocument]);

  return (
    <div className={`sdp-root ${isCompact ? 'is-compact' : ''} ${isDesktopSidebarClosed ? 'sidebar-closed' : ''} `} ref={rootRef} onClick={interceptaEnllacos ? alClicarEnllac : undefined}>
      <a href="#main-content" className="sr-only sr-only-focusable sdp-skip-link">Salta al contingut principal</a>
      
      {isCompact ? (
        <Dialeg 
          obert={isMobileSidebarOpen} 
          onTanca={() => setIsMobileSidebarOpen(false)} 
          titol={titolMenu}
          costat="esquerra"
          className="sdp-dialeg-sidebar"
          variant="sense-marc"
        >
          <nav id="app-sidebar" className="app-sidebar" aria-label="Navegació principal">
            <BarraLateral isCompact={isCompact} isDesktopSidebarClosed={isDesktopSidebarClosed} toggleSidebar={toggleSidebar}>
             <SidebarContent
                isCompact={isCompact}
                isDesktopSidebarClosed={isDesktopSidebarClosed}
                toggleSidebar={toggleSidebar}
                language={language}
                navigate={navigate}
             />
            </BarraLateral>
          </nav>
        </Dialeg>
      ) : (
        <nav id="app-sidebar" className={`app-sidebar ${isDesktopSidebarClosed ? 'app-sidebar--tancada' : 'app-sidebar--oberta'}`} aria-label="Navegació principal">
          <BarraLateral isCompact={isCompact} isDesktopSidebarClosed={isDesktopSidebarClosed} toggleSidebar={toggleSidebar}>
           <SidebarContent
              isCompact={isCompact}
              isDesktopSidebarClosed={isDesktopSidebarClosed}
              toggleSidebar={toggleSidebar}
              language={language}
              navigate={navigate}
           />
          </BarraLateral>
        </nav>
      )}

      <main 
        id="main-content"
        ref={mainRef}
        tabIndex="-1"
        className="app-main" 
        aria-busy={status === 'loading' ? 'true' : 'false'}
      >
        <TopBar onToggleSidebar={toggleSidebar} menuObert={isCompact ? isMobileSidebarOpen : !isDesktopSidebarClosed} nomPoble={isCompact ? undefined : nomPoble} />
        {franjaVisible ? (
          <FranjaAmfitrio
            nomPoble={nomPoble}
            text={textNode}
            estat={estatNode}
            etiquetaRuta={etiquetesFranja.mesInfo}
            etiquetaTanca={etiquetesFranja.tanca}
            onTanca={tancaFranja}
          />
        ) : null}

        {/* Estat del gest de recarregar: el text l'escriu usePullToRefresh
            (buit i transparent en repòs; modules.css, «Lliscar per
            recarregar»). També encastat a <soc-de-poble> (261004). */}
        <div
          ref={indicatorRef}
          className="pull-to-refresh-indicator sdp-ptr-indicator"
          role="status"
          aria-live="polite"
        />

        <div ref={contentRef} className="app-main__content">
          {children}
        </div>
      </main>

      {mobileNav}
    </div>
  );
}

const TopBar = memo(function TopBar({ onToggleSidebar, menuObert = false, nomPoble }) {
  const navigate = useNavigate();
  const { t, toggleTheme } = useUIActions();
  const { themeMode } = useUIState();

  /* T30.2 · la IAIA respira quan la IA està activa (nivell del Selector de
     Realitat); el nivell arriba per esdeveniment perquè esta barra no es
     torna a muntar en navegar. */
  const [nivellIaia, setNivellIaia] = useState(nivellIaiaDesat);
  useEffect(() => {
    const escolta = (e) => setNivellIaia(Number(e.detail));
    window.addEventListener(EVENT_NIVELL_IAIA, escolta);
    return () => window.removeEventListener(EVENT_NIVELL_IAIA, escolta);
  }, []);
  const navigateWithTransition = (path) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !prefersReducedMotion) {
      /* Una transició que en talla una altra rebutja `ready` (InvalidStateError):
         és esperat i no ha d'eixir a la consola. Els errors de navegar van per `finished`. */
      const transicio = document.startViewTransition(() => navigate(path));
      transicio?.ready?.catch(() => {});
    } else {
      navigate(path);
    }
  };
  /* T43 (ordre del Mestre, 260928) · la identitat activa ha de ser evident:
     el botó diu amb qui actues (una entitat, el SEU logo o les SEUES
     inicials, mai la foto de la persona) i obri el calaix per a canviar-la. */
  const { boto, calaix } = useIdentitatDeLaBarra({
    onNavega: navigateWithTransition,
    etiquetaEntrar: t('section.login.loginButton', 'Entrar')
  });

  /* T43 · El calaix és GERMÀ del header, no fill: dins heretava el
     color-scheme fosc i el focus del crom de la barra negra.
     Enxufe universal, T2 (260929) · En escriptori, el nom del poble de
     l'amfitrió és el PRIMER fill del header; sense nomPoble, cap node. */
  return (
    <>
    <header className="bar-black">
      {nomPoble ? <TitolAmfitrio nomPoble={nomPoble} /> : null}
      <button type="button" className="mobile-logo-wrapper sdp-unstyled-btn" aria-label="Obrir menú" aria-expanded={menuObert ? 'true' : 'false'} aria-controls="app-sidebar" onClick={() => onToggleSidebar?.()}>
        <BrandMark variant="light" className="mobile-logo" />
      </button>

      <div className="right-icons">
        <BotoCrom />
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/traduccions')} aria-label={t('nav.idioma', 'Idioma')} title={t('nav.idioma', 'Idioma')}>
          <Globe aria-hidden="true" focusable="false" />
        </button>
        {/* T30 (ordre del Mestre, 260927 nit): la IAIA (la figureta al costat
            de la bola del món) es queda a la barra negra, en mòbil i en
            escriptori. La «icona de la IA» que T23.1 mana llevar no és esta. */}
        <button
          type="button"
          className={['icon', 'sdp-top-bar-btn', esIaiaActiva(nivellIaia) && 'sdp-top-bar-btn--iaia-activa'].filter(Boolean).join(' ')}
          data-iaia-activa={esIaiaActiva(nivellIaia) ? 'true' : 'false'}
          onClick={() => navigateWithTransition('/realitat')}
          aria-label={t('nav.ia', 'Interacció amb la IA')}
          title={t('nav.ia', 'Interacció amb la IA')}
        >
          <IaiaIcon aria-hidden="true" focusable="false" />
        </button>
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/cerca')} aria-label={t('nav.cerca', 'Cerca')} title={t('nav.cerca', 'Cerca')}>
          <Search aria-hidden="true" focusable="false" />
        </button>
        <button type="button" className="icon sdp-top-bar-btn" onClick={toggleTheme} aria-label={t('nav.tema', 'Tema')} title={t('nav.tema', 'Tema')}>
          {themeMode === 'dark' ? <Sun aria-hidden="true" focusable="false" /> : <MoonStar aria-hidden="true" focusable="false" />}
        </button>
        <BotoIdentitatActiva {...boto} />
      </div>
    </header>
    {calaix ? <CalaixIdentitats {...calaix} /> : null}
    </>
  );
});

function TextRoute({ pageKey }) {
  const { pageCopy, status } = useCoreContent();
  // Fallback a les dades locals (PAGE_COPY) perquè la legalitat carregui de forma segura i ràpida
  // encara que Supabase estiga en fase de càrrega o sense xarxa.
  const page = pageCopy?.[pageKey] || PAGE_COPY?.[pageKey];
  
  if (!page) {
    if (status === 'loading') {
      return <RouteFallback />;
    }
    return <Navigate to={DEFAULT_SECTION_PATH} replace />;
  }
  return (
    <Suspense fallback={<RouteFallback />}>
      <TextSection page={page} pageKey={pageKey}>
        {/* Transparència Radical: el comptador es mostra on s'explica la privacitat.
            Suspense propi perquè el tauler no torne a tapar el text mentre arriba. */}
        {pageKey === 'legal' ? <Suspense fallback={null}><TaulerTelemetria /></Suspense> : null}
      </TextSection>
    </Suspense>
  );
}





export default function App({ config, targetNode }) {
  // Stabilize config to avoid re-rendering entire app when host sends new obj reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableConfig = useMemo(() => config, [JSON.stringify(config)]);

  return (
    <StrictMode>
      <NotificationProvider targetNode={targetNode}>
        <AppShell mobileNav={<MobileNav />}>
          <AppContent config={stableConfig} />
        </AppShell>
      </NotificationProvider>
    </StrictMode>
  );
}

function AppContent({ config }) {
  // Els Providers ja gestionen l'actorKey internament. No els destruïm forçosament (F01).
  return (
    <CoreContentProvider config={config}>
      <MurProvider config={config}>
        <NotesDataProvider config={config}>
          <NotesProvider>
            <XatProvider config={config}>
              <MultimediaProvider config={config}>
                <AppDataLoader />
              </MultimediaProvider>
            </XatProvider>
          </NotesProvider>
        </NotesDataProvider>
      </MurProvider>
    </CoreContentProvider>
  );
}

function AppDataLoader() {
  const core = useCoreContent();
  const location = useLocation();
  /* T6 en remot (verificació del front «autoria», 261004) · L'id de servidor
     de l'entitat pilot es resol ací, una sola vegada per a tota l'app i per
     abast de backend (resolEntitatDelProjecte; en llavor, cap crida). Abans
     només el demanaven la targeta del Mur i el detall d'una publicació del
     MAS: qui entrava directament a /mercat, /mur/:id o /mercat/:id veia la
     boina del pilot portar a /empresa/<uuid> tota la sessió. Quan l'id
     arriba, este component torna a pintar les rutes i totes les boines
     (rutaDAutoria) porten a /projecte. */
  useEntitatDelProjecte();

  // Eliminar el bloqueig global per a error o loading del Core permet a Sóc de Poble
  // mantindre l'accessibilitat a les seccions independents (Xat, Mur, Notes)
  // i delegar la degradació del contingut base a cada component afectat.
  useEffect(() => {
    if (core.status === 'error') {
      console.warn("CoreContent degradat: l'aplicació arranca amb dades parcials o sense catàleg.", core.error);
    }
  }, [core.status, core.error]);

  return (
    <>
      <RouteSEO />
      <RouteTelemetria />
      {/* FRO-04 · La barrera es reinicia sola en canviar de ruta: una secció
          que ha petat no segresta la navegació cap a les altres. */}
      <RouteErrorBoundary resetKey={location.pathname}>
        <AppRoutes />
      </RouteErrorBoundary>
    </>
  );
}

/* FRO-04 · Barrera d'errors de ruta.
   - `resetKey` (la ruta) la reinicia en navegar: l'error d'una secció no
     acompanya la persona a la següent.
   - El missatge tècnic (`error.message`) només ix en desenvolupament: en un
     build, la traça no és per a la persona del poble sinó per a la consola. */
export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: props.resetKey };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, error: null, resetKey: props.resetKey };
    }
    return null;
  }
  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] Error capturat a la ruta:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      const detall = this.props.mostraDetall ?? Boolean(import.meta.env?.DEV);
      return (
        <div className="sdp-route-error" role="alert">
          <h2 className="sdp-route-error__titol">Hi ha hagut un problema</h2>
          <p>Aquesta secció no ha pogut carregar-se correctament.</p>
          {detall ? (
            <pre className="sdp-error-pre">
              {this.state.error?.message || String(this.state.error)}
            </pre>
          ) : null}
          <button type="button" onClick={() => this.setState({ hasError: false, error: null })} className="sdp-boto sdp-boto--secundari sdp-route-error__reintent">
            Intentar de nou
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function ActorRedirect({ to }) {
  return <Navigate to={`/${to}`} replace />;
}

/* T4 (ordre del Mestre, 260930) · Els àlies d'entrada (/login, /accedir,
   /entrar, /crear-compte) porten a /registre amb el mode que obrin i
   conserven la consulta rebuda. El ?tornar només passa si és intern i no
   torna a l'entrada (tornadaSegura, dins de rutaDEntrada); un ?mode rebut no
   mana sobre el de l'àlies. La ubicació és la del router propi, també en
   memòria (incrustació). */
function RedireccioDEntrada({ mode }) {
  const { search } = useLocation();
  const rebuda = new URLSearchParams(search);
  const desti = rutaDEntrada({ mode, tornar: rebuda.get('tornar') });
  rebuda.delete('mode');
  rebuda.delete('tornar');
  const resta = rebuda.toString();
  const to = resta ? `${desti}${desti.includes('?') ? '&' : '?'}${resta}` : desti;
  return <Navigate to={to} replace />;
}

/* La Consola no passa per Supabase: a `vite serve` s'obri sense sessió i en
   qualsevol build conserva la barrera de superadmin (guards/guardaConsola.js). */
function RutaConsola() {
  if (!consolaDemanaSessio(import.meta.env.DEV)) return <ConsolaSection />;
  return <RequireAuth rol="superadmin"><ConsolaSection /></RequireAuth>;
}

function AppRoutes() {
  const { agents = [] } = useCoreContent();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={`${DEFAULT_SECTION_PATH}`} replace />} />
        
        {/* Rutes globals i administratives */}
        <Route path="/admin/*" element={<RequireAuth rol="superadmin"><AdminSection /></RequireAuth>} />
        {/* Tauler a /consola i una pàgina per ruta (/consola/calendari…). El
            comodí manté muntat el mateix element: les dades es lligen una vegada. */}
        <Route path="/consola/*" element={<RutaConsola />} />
        <Route path="/cerca" element={<SearchSection />} />
        <Route path="/login" element={<RedireccioDEntrada mode="entrar" />} />
        <Route path="/accedir" element={<RedireccioDEntrada mode="entrar" />} />
        <Route path="/entrar" element={<RedireccioDEntrada mode="entrar" />} />
        <Route path="/registre" element={<OnboardingSection />} />
        <Route path="/crear-compte" element={<RedireccioDEntrada mode="crear" />} />
        
        <Route path="/control" element={<ControlSection />} />
        <Route path="/utilitats" element={<ControlSection />} />
        <Route path="/connectar" element={<ConnectarSection agents={agents} />} />
        <Route path="/page/:slug" element={<PageDetailSection />} />
        <Route path="/plugin/:id" element={<PluginPage />} />
        <Route path="/legal" element={<TextRoute pageKey="legal" />} />
        <Route path="/versions" element={<TextRoute pageKey="versions" />} />
        <Route path="/traduccions" element={<TranslationsSection />} />
        <Route path="/realitat" element={<RealitatSection />} />
        {/* Plataforma d'Apps Enxufables (261002) · /app (portal) i /app/<id>/* (cada app). */}
        <Route path="/app/*" element={<RutaApps />} />

        {/* Rutes principals (ActorRoutes) gestiona totes les demés rutes /xat, /mur, /perfil, etc. */}
        <Route path="/*" element={<ActorRoutes agents={agents} />} />
      </Routes>
    </Suspense>
  );
}

function ActorRoutes({ agents }) {
  // Aquestes rutes són la resta de rutes (antics /jo i /e/:slug)
  return (
    <Routes>
      <Route path="/" element={<ActorRedirect to="xat" />} />
      <Route path="xat" element={<XatSection />} />
      <Route path="control-xat" element={<XatControlSection />} />
      <Route path="xat/:threadId" element={<XatSection />} />
      <Route path="mur" element={<MurSection />} />
      <Route path="mercat" element={<MercatSection />} />
      <Route path="calendari" element={<CalendariSection />} />
      <Route path="multimedia" element={<MultimediaSection />} />
      <Route path="pobles" element={<PoblesSection />} />
      <Route path="poblacio" element={<PoblacioSection />} />
      <Route path="notes" element={<NotesSection />} />
      <Route path="dispositius" element={<DevicesSection />} />
      {/* Globals: sota /jo queien a NotFoundPage (el botó central del mòbil). */}
      <Route path="control" element={<Navigate to="/control" replace />} />
      {/* Sense sessió, els formularis del perfil fallarien en desar: a /registre i tornar. */}
      <Route path="el-meu-perfil" element={<RequireAuth><PerfilShell /></RequireAuth>} />
      <Route path="perfil" element={<ProfileSection agents={agents} />} />
      {/* Lògica d'Usuari (T4): el perfil públic de persones, entitats, grups i
          agents IA. El prefix orienta; l'identificador (id o slug) mana. */}
      <Route path="perfil/:agentId" element={<PerfilPublicSection agents={agents} />} />
      <Route path="gent/:agentId" element={<PerfilPublicSection agents={agents} />} />
      <Route path="empresa/:agentId" element={<PerfilPublicSection agents={agents} />} />
      <Route path="ajuntament/:agentId" element={<PerfilPublicSection agents={agents} />} />
      <Route path="grup/:agentId" element={<PerfilPublicSection agents={agents} />} />
      
      <Route path="projecte" element={<TextRoute pageKey="projecte" />} />
      <Route path="wikidepoble" element={<RutaWikiDePoble />} />
      <Route path="skills" element={<Navigate to="../wikidepoble" replace />} />
      <Route path="constitucio" element={<TextRoute pageKey="constitucio" />} />
      <Route path="disseny" element={<DesignSection />} />
      <Route path="roadmap" element={<TextRoute pageKey="roadmap" />} />
      <Route path="ia" element={<TextRoute pageKey="anima" />} />
      {/* T8 (ordre del Mestre, 261001) · On porta la franja de l'amfitrió: què
          és un node. Pàgina de text fora de la barra lateral i del Mur. */}
      <Route path="fedivers" element={<TextRoute pageKey="fedivers" />} />

      <Route path=":sectionId/:itemId" element={<ItemDetailSection />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const MobileNav = memo(function MobileNav() {
  const { language } = useUIState();
  const { t } = useUIActions();
  const navigate = useNavigate();

  const enllacMobil = (section) => {
    const Icon = section.icon;
    const labels = section.kind === 'gestoria'
      ? { label: section.label, shortLabel: section.shortLabel }
      : getSectionLabels(section.id, language);
    return (
      <NavLink key={section.id} to={section.path} matchPaths={section.subrutes} className="nav-item" aria-label={labels.label}>
        <Icon className="nav-item__icon" strokeWidth={2.1} aria-hidden="true" focusable="false" />
        <span className="nav-item__text">
          <strong>{labels.shortLabel}</strong>
        </span>
      </NavLink>
    );
  };

  const vesAlPanell = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !prefersReducedMotion) {
      const transicio = document.startViewTransition(() => navigate('/control'));
      transicio?.ready?.catch(() => {});
    } else {
      navigate('/control');
    }
  };


  return (
    <>
      <nav className="mobile-nav" aria-label="Navegació mòbil">
        {MOBILE_NAV_LEADING.map((section) => enllacMobil(section))}
        <button type="button" className="mobile-nav__cta" onClick={vesAlPanell} aria-label={t('nav.panel', 'Panell de Control')}>
          <Settings strokeWidth={2.1} />
        </button>
        {MOBILE_NAV_TRAILING.map((section) => enllacMobil(section))}
      </nav>
    </>
  );
});
