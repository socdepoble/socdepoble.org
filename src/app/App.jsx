import React, { lazy, Suspense, useEffect, useRef, memo, StrictMode, useMemo } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate, useLocation } from './contexts/RouterContext';
import { MoonStar, Search, Settings, Sun, UserRound } from '../icons.jsx';
import BrandMark from '../components/BrandMark';
import { IaiaIcon, TranslateIcon } from '../components/PedraSeca/atoms/icones';
import { DEFAULT_SECTION_PATH, SECTIONS, SECTION_ORDER } from '../config/sections';
import { getSectionLabels } from '../config/i18n';
import { recullTornadaOAuth } from '../data/backendPort.js';
import { reclamaContingutDelConvidat } from '../data/identitat.js';
import { showToast } from '../components/universal/AvisadorEfimer';
import { delVal } from '../config/storage';
import { useIdentitat } from './contexts/IdentitatContext';
import { PAGE_COPY } from '../sections/text/pageContent.js';
const XatSection = lazy(() => import('../sections/xat/XatSection'));
const MurSection = lazy(() => import('../sections/mur/MurSection'));
const MercatSection = lazy(() => import('../sections/mercat/MercatSection'));
const PoblesSection = lazy(() => import('../sections/pobles/PoblesSection'));
const PoblacioSection = lazy(() => import('../sections/poblacio/PoblacioSection'));
const MultimediaSection = lazy(() => import('../sections/multimedia/MultimediaSection'));
const NotesSection = lazy(() => import('../sections/notes/NotesSection'));

const DevicesSection = lazy(() => import('../sections/dispositius/DevicesSection'));
const ConnectarSection = lazy(() => import('../sections/connectar/ConnectarSection'));
const ControlSection = lazy(() => import('../sections/control/ControlSection'));
const OnboardingSection = lazy(() => import('../sections/onboarding/OnboardingSection'));
const AdminSection = lazy(() => import('../sections/admin/AdminSection'));

const TranslationsSection = lazy(() => import('../sections/translations/TranslationsSection'));
const TextSection = lazy(() => import('../sections/text/TextSection'));
const DesignSection = lazy(() => import('../sections/disseny/DesignSection'));
const SearchSection = lazy(() => import('../sections/search/SearchSection'));
const ProfileSection = lazy(() => import('../sections/profile/ProfileSection'));
const PerfilShell = lazy(() => import('../sections/profile/PerfilShell'));
const ItemDetailSection = lazy(() => import('../sections/detail/ItemDetailSection'));
const PageDetailSection = lazy(() => import('../sections/detail/PageDetailSection'));
const RealitatSection = lazy(() => import('../sections/realitat/RealitatSection'));
import NotFoundPage from '../pages/NotFoundPage';
import { CoreContentProvider, useCoreContent } from './contexts/CoreContentContext';
import { MurProvider } from '../sections/mur/MurContext';
import { NotesDataProvider } from '../sections/notes/NotesDataContext';
import { NotesProvider } from '../sections/notes/NotesContext';
import { XatProvider } from '../sections/xat/XatContext';
const XatControlSection = lazy(() => import('../sections/xat/XatControlSection'));
import { MultimediaProvider } from '../sections/multimedia/MultimediaContext';
import { useUIActions, useUIState } from './contexts/UIContext';
import { useSession } from './contexts/SessionContext';
import { RequireAuth } from './guards/RequireAuth';

const ALL_NAV_SECTIONS = SECTIONS.filter((section) => SECTION_ORDER.includes(section.id));
const NAV_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id !== 'versions' && s.id !== 'legal');
const SYSTEM_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id === 'versions' || s.id === 'legal');

const MOBILE_NAV_LEADING = NAV_SECTIONS.slice(0, 2);
const MOBILE_NAV_TRAILING = NAV_SECTIONS.slice(2, 4);

function RouteFallback() {
  return (
    <div className="sdp-app-loading" role="status" aria-live="polite">
      <div className="sdp-spinner sdp-spinner--large" />
      <span className="sr-only">S'està carregant el contingut...</span>
    </div>
  );
}

function AppShell({ children, mobileNav }) {
  const { language, status, themeMode, externalConfig } = useUIState();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const contentRef = useRef(null);
  const { actorType, actorId } = useIdentitat();
  
  const buildPath = (basePath, isGestoriaLink) => {
    
    if (actorType === 'entitat') {
      return `/e/${actorId}${basePath}`;
    }
    return `/jo${basePath}`;
  };
  
  const activeNavSections = NAV_SECTIONS;
  
  // Pull to Refresh logic optimitzat natiu
  const indicatorRef = useRef(null);
  const PULL_THRESHOLD = 100;

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

  const tornadaFeta = useRef(false);
  useEffect(() => {
    if (tornadaFeta.current) return;
    tornadaFeta.current = true;
    recullTornadaOAuth(externalConfig)
      .then((sessio) => { if (sessio) showToast(t('section.login.success.login', 'Benvingut de nou!'), 'success'); })
      .catch((e) => showToast(e.message, 'error'));
  }, [externalConfig, t]);

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
  }, [t]);

  useEffect(() => {
    if (mainRef.current) {
      const rootNode = mainRef.current.getRootNode();
      if (rootNode instanceof ShadowRoot) {
        rootNode.host.setAttribute('data-theme', themeMode || 'light');
      } else {
        document.documentElement.setAttribute('data-theme', themeMode || 'light');
      }
    }
  }, [themeMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (mainRef.current) {
        const rootNode = mainRef.current.getRootNode();
        const host = rootNode instanceof ShadowRoot ? rootNode.host : document.documentElement;
        host.setAttribute('lang', language || 'ca');
      }
    }
  }, [language]);

  useEffect(() => {
    const mainEl = mainRef.current;
    const contentEl = contentRef.current;
    const indicatorEl = indicatorRef.current;
    if (!mainEl || !contentEl || !indicatorEl) return;

    let pullStart = null;
    let pullDistance = 0;
    let rafId = null;
    let state = ''; // '', 'pulling', 'ready'

    const updateUI = (distance, newState) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const translateY = Math.min(distance, PULL_THRESHOLD + 40);
        contentEl.style.transform = `translateY(${translateY}px)`;
        indicatorEl.style.transform = `translateY(${translateY}px)`;
        
        if (state !== newState) {
          state = newState;
          if (state === 'ready') {
            indicatorEl.innerText = t('pull.release', 'Deixa anar per recarregar...');
          } else if (state === 'pulling') {
            indicatorEl.innerText = t('pull.pull', 'Estira per recarregar...');
          } else {
            indicatorEl.innerText = '';
          }
        }
        rafId = null;
      });
    };

    const onTouchStart = (e) => {
      if (contentEl.scrollTop === 0) {
        pullStart = e.touches[0].clientY;
        pullDistance = 0;
        contentEl.style.transition = 'none';
        indicatorEl.style.transition = 'none';
      } else {
        pullStart = null;
      }
    };

    const onTouchMove = (e) => {
      if (pullStart === null) return;
      const y = e.touches[0].clientY;
      const distance = y - pullStart;
      if (distance > 0) {
        pullDistance = distance;
        updateUI(distance, distance > PULL_THRESHOLD ? 'ready' : 'pulling');
      }
    };

    const onTouchEnd = () => {
      if (pullStart === null) return;
      if (pullDistance > PULL_THRESHOLD) {
        window.location.reload();
      }
      pullStart = null;
      pullDistance = 0;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      state = '';
      contentEl.style.transition = 'transform 0.3s ease-out';
      contentEl.style.transform = 'translateY(0px)';
      indicatorEl.style.transition = 'transform 0.3s ease-out';
      indicatorEl.style.transform = 'translateY(0px)';
      indicatorEl.innerText = '';
    };

    mainEl.addEventListener('touchstart', onTouchStart, { passive: true });
    mainEl.addEventListener('touchmove', onTouchMove, { passive: false });
    mainEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      mainEl.removeEventListener('touchstart', onTouchStart);
      mainEl.removeEventListener('touchmove', onTouchMove);
      mainEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [t]);

  return (
    <>
      <a href="#main-content" className="sr-only sr-only-focusable sdp-skip-link">Salta al contingut principal</a>
      <nav id="app-sidebar" className="app-sidebar" aria-label="Navegació principal">
        <button type="button" className="brand sdp-unstyled-btn" aria-label="Obrir o tancar menú Sóc de Poble" aria-expanded="true" aria-controls="app-sidebar" onClick={(e) => {
          const root = e.target.getRootNode();
          const sidebar = root.querySelector('.app-sidebar') || document.querySelector('.app-sidebar');
          const host = root instanceof ShadowRoot ? root.host : document.body;
          const willClose = sidebar?.classList.contains('sidebar-open');
          sidebar?.classList.toggle('sidebar-open');
          host.classList.toggle('sidebar-closed');
          e.currentTarget.setAttribute('aria-expanded', !willClose);
        }}>
          <BrandMark className="app-brand__mark" />
        </button>

        <button
          type="button"
          className="sidebar-control-btn"
          onClick={() => navigate('/control')}
        >
          <Settings className="icona-linia" size={24} strokeWidth={2.1} aria-hidden="true" focusable="false" />
          <span className="nav-item__text">PANELL DE CONTROL</span>
        </button>

        <div className="app-sidebar-nav" aria-label="Seccions">
          {activeNavSections.map((section) => {
            const Icon = section.icon;
            const labels = section.kind === 'gestoria' 
              ? { label: section.label, shortLabel: section.shortLabel } 
              : getSectionLabels(section.id, language);
            return (
              <React.Fragment key={section.id}>
                {section.id === 'projecte' && <hr className="app-sidebar-divider" aria-hidden="true" />}
                <NavLink to={buildPath(section.path)} className="nav-item" aria-label={labels.label}>
                  <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
                  <span className="nav-item__text">
                    {labels.label}
                  </span>
                </NavLink>
              </React.Fragment>
            );
          })}
          
          <div className="app-sidebar-nav-footer">
            {SYSTEM_SECTIONS.map((section) => {
              const Icon = section.icon;
              const labels = getSectionLabels(section.id, language);
              return (
                <NavLink key={section.id} to={section.path} className="nav-item nav-item--system" aria-label={labels.label}>
                  <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
                  <span className="nav-item__text">
                    {labels.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <main 
        id="main-content"
        ref={mainRef}
        tabIndex="-1"
        className="app-main" 
        aria-busy={status === 'loading' ? 'true' : 'false'}
      >
        <TopBar />
        
        <div 
          ref={indicatorRef}
          className="pull-to-refresh-indicator sdp-ptr-indicator" 
          aria-hidden="true"
        >
        </div>

        <div ref={contentRef} className="app-main__content">
          {children}
        </div>
      </main>

      {mobileNav}
    </>
  );
}

const TopBar = memo(function TopBar() {
  const navigate = useNavigate();
  const { t, toggleTheme } = useUIActions();
  const { themeMode } = useUIState();
  const { currentUser } = useSession();
  const navigateWithTransition = (path) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !prefersReducedMotion) {
      document.startViewTransition(() => navigate(path));
    } else {
      navigate(path);
    }
  };

  return (
    <header className="bar-black">
      <button type="button" className="mobile-logo-wrapper sdp-unstyled-btn" aria-label="Obrir menú" aria-expanded="false" aria-controls="app-sidebar" onClick={(e) => {
        const root = e.target.getRootNode();
        const sidebar = root.querySelector('.app-sidebar') || document.querySelector('.app-sidebar');
        const host = root instanceof ShadowRoot ? root.host : document.body;
        const willOpen = !sidebar?.classList.contains('sidebar-open');
        sidebar?.classList.toggle('sidebar-open');
        host.classList.toggle('sidebar-closed');
        e.currentTarget.setAttribute('aria-expanded', willOpen);
      }}>
        <BrandMark variant="light" className="mobile-logo" />
      </button>

      <div className="right-icons">
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/traduccions')} aria-label={t('nav.idioma', 'Idioma')} title={t('nav.idioma', 'Idioma')}>
          <TranslateIcon className="icon" aria-hidden="true" focusable="false" />
        </button>
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/ia')} aria-label={t('nav.ia', 'L\'ànima de la iaia')} title={t('nav.ia', 'L\'ànima de la iaia')}>
          <IaiaIcon className="icon iaia-icon" aria-hidden="true" focusable="false" />
        </button>
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/cerca')} aria-label={t('nav.cerca', 'Cerca')} title={t('nav.cerca', 'Cerca')}>
          <Search aria-hidden="true" focusable="false" />
        </button>
        <button type="button" className="icon sdp-top-bar-btn" onClick={toggleTheme} aria-label={t('nav.tema', 'Tema')} title={t('nav.tema', 'Tema')}>
          {themeMode === 'dark' ? <Sun aria-hidden="true" focusable="false" /> : <MoonStar aria-hidden="true" focusable="false" />}
        </button>
        <button 
          type="button" 
          className="icon sdp-top-bar-btn sdp-top-bar-btn--avatar" 
          onClick={() => navigateWithTransition(currentUser ? '/el-meu-perfil' : '/registre')} 
          aria-label={t('nav.perfil', 'Perfil')} 
          title={t('nav.perfil', 'Perfil')}
        >
          {(() => {
            const avatar = currentUser?.avatar_url || currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;
            if (currentUser && avatar) {
              return <img src={avatar} alt={currentUser?.user_metadata?.name || currentUser?.full_name || 'El meu perfil'} className="sdp-avatar__imatge" />;
            }
            if (currentUser) {
              return (
                <div className="sdp-avatar-placeholder">
                  <UserRound size={18} aria-hidden="true" focusable="false" />
                </div>
              );
            }
            return <UserRound aria-hidden="true" focusable="false" />;
          })()}
        </button>
      </div>
    </header>
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
      <TextSection page={page} pageKey={pageKey} />
    </Suspense>
  );
}





export default function App({ config }) {
  // Stabilize config to avoid re-rendering entire app when host sends new obj reference
  const stableConfig = useMemo(() => config, [JSON.stringify(config)]);

  return (
    <StrictMode>
      <AppShell mobileNav={<MobileNav />}>
        <AppContent config={stableConfig} />
      </AppShell>
    </StrictMode>
  );
}

function AppContent({ config }) {
  const { actorKey } = useIdentitat();

  return (
    <CoreContentProvider key={`core-${actorKey}`} config={config}>
      <MurProvider key={`mur-${actorKey}`} config={config}>
        <NotesDataProvider key={`notes-${actorKey}`} config={config}>
          <NotesProvider>
            <XatProvider key={`xat-${actorKey}`} config={config}>
              <MultimediaProvider key={`media-${actorKey}`} config={config}>
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

  // Eliminar el bloqueig global per a error o loading del Core permet a Sóc de Poble
  // mantindre l'accessibilitat a les seccions independents (Xat, Mur, Notes)
  // i delegar la degradació del contingut base a cada component afectat.
  useEffect(() => {
    if (core.status === 'error') {
      console.warn("CoreContent degradat: l'aplicació arranca amb dades parcials o sense catàleg.", core.error);
    }
  }, [core.status, core.error]);

  return (
    <RouteErrorBoundary>
      <AppRoutes />
    </RouteErrorBoundary>
  );
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] Error capturat a la ruta:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="sdp-route-error">
          <h2 className="sdp-route-error__titol">Hi ha hagut un problema</h2>
          <p>Aquesta secció no ha pogut carregar-se correctament.</p>
          <pre className="sdp-error-pre">
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="sdp-boto sdp-boto--secundari sdp-route-error__reintent">
            Intentar de nou
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function ActorRedirect({ to }) {
  const { actorType, actorId } = useIdentitat();
  const base = actorType === 'entitat' ? `/e/${actorId}` : '/jo';
  return <Navigate to={`${base}/${to}`} replace />;
}

function AppRoutes() {
  const { agents = [] } = useCoreContent();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={`/jo${DEFAULT_SECTION_PATH}`} replace />} />
        
        {/* Rutes per a Identitat Activa */}
        <Route path="/jo/*" element={<ActorRoutes agents={agents} />} />
        <Route path="/e/:slug/*" element={<ActorRoutes agents={agents} />} />

        {/* Rutes Públiques (Visitants sense registre) */}
        <Route path="/mur" element={<MurSection />} />
        <Route path="/mercat" element={<MercatSection />} />
        <Route path="/pobles" element={<PoblesSection />} />

        {/* Rutes globals i administratives */}
        <Route path="/admin/*" element={<RequireAuth rol="superadmin"><AdminSection /></RequireAuth>} />
        <Route path="/cerca" element={<SearchSection />} />
        <Route path="/login" element={<Navigate to="/registre" replace />} />
        <Route path="/accedir" element={<Navigate to="/registre" replace />} />
        <Route path="/registre" element={<OnboardingSection />} />
        <Route path="/crear-compte" element={<Navigate to="/registre" replace />} />
        
        <Route path="/control" element={<ControlSection />} />
        <Route path="/utilitats" element={<ControlSection />} />
        <Route path="/connectar" element={<ConnectarSection agents={agents} />} />
        <Route path="/projecte" element={<Navigate to="/jo/projecte" replace />} />
        <Route path="/page/:slug" element={<PageDetailSection />} />
        <Route path="/el-projecte" element={<Navigate to="/jo/projecte" replace />} />
        <Route path="/skills" element={<Navigate to="/jo/skills" replace />} />
        <Route path="/constitucio" element={<Navigate to="/jo/constitucio" replace />} />
        <Route path="/disseny" element={<Navigate to="/jo/disseny" replace />} />
        <Route path="/legal" element={<TextRoute pageKey="legal" />} />
        <Route path="/roadmap" element={<Navigate to="/jo/roadmap" replace />} />
        <Route path="/ruta" element={<Navigate to="/jo/roadmap" replace />} />
        <Route path="/versions" element={<TextRoute pageKey="versions" />} />
        <Route path="/traduccions" element={<TranslationsSection />} />
        <Route path="/realitat" element={<RequireAuth rol="superadmin"><RealitatSection /></RequireAuth>} />
        <Route path="/ia" element={<Navigate to="/jo/ia" replace />} />
        <Route path="/anima" element={<Navigate to="/jo/ia" replace />} />
        <Route path="/iaia" element={<Navigate to="/jo/xat/iaia-maria" replace />} />
        <Route path="/el-meu-perfil" element={<Navigate to="/jo/el-meu-perfil" replace />} />
        <Route path="/perfil" element={<Navigate to="/jo/el-meu-perfil" replace />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function ActorRoutes({ agents }) {
  // Aquestes rutes són relatives a `/jo` o `/e/:slug`. 
  // No necessiten la / inicial.
  return (
    <Routes>
      <Route path="/" element={<ActorRedirect to="xat" />} />
      <Route path="xat" element={<XatSection />} />
      <Route path="control-xat" element={<XatControlSection />} />
      <Route path="xat/:threadId" element={<XatSection />} />
      <Route path="mur" element={<MurSection />} />
      <Route path="mercat" element={<MercatSection />} />
      <Route path="multimedia" element={<MultimediaSection />} />
      <Route path="pobles" element={<PoblesSection />} />
      <Route path="poblacio" element={<PoblacioSection />} />
      <Route path="notes" element={<NotesSection />} />
      <Route path="dispositius" element={<DevicesSection />} />
      {/* Globals: sota /jo queien a NotFoundPage (el botó central del mòbil). */}
      <Route path="control" element={<Navigate to="/control" replace />} />
      <Route path="el-meu-perfil" element={<PerfilShell />} />
      <Route path="perfil" element={<ProfileSection agents={agents} />} />
      <Route path="perfil/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="gent/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="empresa/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="ajuntament/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="grup/:agentId" element={<ProfileSection agents={agents} />} />
      
      <Route path="projecte" element={<TextRoute pageKey="projecte" />} />
      <Route path="skills" element={<TextRoute pageKey="skills" />} />
      <Route path="constitucio" element={<TextRoute pageKey="constitucio" />} />
      <Route path="disseny" element={<DesignSection />} />
      <Route path="roadmap" element={<TextRoute pageKey="roadmap" />} />
      <Route path="ia" element={<TextRoute pageKey="anima" />} />
      
      <Route path=":sectionId/:itemId" element={<ItemDetailSection />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const MobileNav = memo(function MobileNav() {
  const { language } = useUIState();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const { actorType, actorId } = useIdentitat();
  
  const buildPath = (basePath) => {
    
    if (actorType === 'entitat') {
      return `/e/${actorId}${basePath}`;
    }
    return `/jo${basePath}`;
  };

  const activeMobileLeading = MOBILE_NAV_LEADING;
  const activeMobileTrailing = MOBILE_NAV_TRAILING;

  return (
      <nav className="mobile-nav" aria-label="Navegació mòbil">
        {activeMobileLeading.map((section) => {
          const Icon = section.icon;
          const labels = section.kind === 'gestoria' 
            ? { label: section.label, shortLabel: section.shortLabel } 
            : getSectionLabels(section.id, language);
          return (
            <NavLink key={section.id} to={buildPath(section.path)} className="nav-item" aria-label={labels.label}>
              <Icon className="nav-item__icon" strokeWidth={2.1} aria-hidden="true" focusable="false" />
              <span className="nav-item__text">
                <strong>{labels.shortLabel}</strong>
              </span>
            </NavLink>
          );
        })}
        <button type="button" className="mobile-nav__cta" onClick={() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (document.startViewTransition && !prefersReducedMotion) {
            document.startViewTransition(() => navigate('/control'));
          } else {
            navigate('/control');
          }
        }} aria-label={t('nav.panel', 'Panell de control')}>
          <Settings size={20} strokeWidth={2.8} />
        </button>
        {activeMobileTrailing.map((section) => {
          const Icon = section.icon;
          const labels = section.kind === 'gestoria' 
            ? { label: section.label, shortLabel: section.shortLabel } 
            : getSectionLabels(section.id, language);
          return (
            <NavLink key={section.id} to={buildPath(section.path)} className="nav-item" aria-label={labels.label}>
              <Icon className="nav-item__icon" strokeWidth={2.1} aria-hidden="true" focusable="false" />
              <span className="nav-item__text">
                <strong>{labels.shortLabel}</strong>
              </span>
            </NavLink>
          );
        })}
      </nav>
  );
});
