import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { normalitzaBase, resolRuta, treuBase } from './politicaRouter.js';

const RouterContext = createContext();
const RouterPrefixContext = createContext('');

/* `currentPath` és la ruta de l'app, o `null` FORA DE BASE: el router de
   navegador té una base declarada i la URL del document no hi cau (és una
   pàgina de l'amfitrió). Fora de base l'app queda inert: <Routes> no pinta,
   cap NavLink s'encén, cap <Navigate> escriu a l'historial i
   useLocation().pathname val ''. Vegeu politicaRouter.js. */

// Origen fictici per a partir una ruta de l'app en camí i consulta.
const ORIGEN_RUTES = 'http://x.invalid';

function entradaDeMemoria(ruta, state = null) {
  const url = new URL(ruta, ORIGEN_RUTES);
  return { path: url.pathname, search: url.searchParams, state };
}

/* La ruta inicial es revalida ací encara que l'element ja la sanege: el
   MemoryRouter també el munten a mà les proves i qualsevol amfitrió React. */
function entradaInicial(rutaInicial) {
  const ruta = typeof rutaInicial === 'string' && rutaInicial.startsWith('/') ? resolRuta(rutaInicial) : null;
  return entradaDeMemoria(ruta || '/');
}

/**
 * Escapa expressions regulars per evitar col·lisions.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeDecode(val) {
  try { return decodeURIComponent(val); } catch { return val; }
}

export function RouterProvider({ children, basename = '' }) {
  // Base declarada per l'amfitrió; una d'invàlida val com a absent.
  const base = useMemo(() => normalitzaBase(basename), [basename]);

  // Fora de base la consulta tampoc és nostra: la de l'amfitrió no arriba a l'app.
  const llegeixUbicacio = useCallback(() => {
    const ruta = treuBase(window.location.pathname, base);
    return { ruta, cerca: new URLSearchParams(ruta === null ? '' : window.location.search) };
  }, [base]);

  const [ubicacio, setUbicacio] = useState(llegeixUbicacio);
  const currentPath = ubicacio.ruta;
  const searchParams = ubicacio.cerca;

  // Si la base canvia en calent, la ruta es torna a llegir; si no, res no canvia.
  useEffect(() => {
    const nova = llegeixUbicacio();
    setUbicacio(prev => (prev.ruta === nova.ruta && prev.cerca.toString() === nova.cerca.toString() ? prev : nova));
  }, [llegeixUbicacio]);

  useEffect(() => {
    const handlePopState = () => {
      // L'amfitrió pot tornar arrere a una pàgina seua: llavors la ruta és null i l'app queda inert.
      setUbicacio(llegeixUbicacio());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [llegeixUbicacio]);

  const navigate = useCallback((to, options = {}) => {
    if (!to) return;
    if (to === -1) {
      window.history.back();
      return;
    }
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    // Una ruta relativa es resol sobre la ruta de l'app ABANS de posar-hi la base:
    // a l'historial només hi arriben URL absolutes.
    const ruta = resolRuta(to, llegeixUbicacio().ruta || '/');
    if (ruta === null) return;
    const targetPath = base + ruta;

    const state = options.state || null;

    if (options.replace) {
      window.history.replaceState(state, '', targetPath);
    } else {
      window.history.pushState(state, '', targetPath);
    }

    setUbicacio(llegeixUbicacio());
  }, [base, llegeixUbicacio]);

  const contextValue = useMemo(() => ({
    currentPath,
    searchParams,
    navigate,
    basename: base,
    memoria: false
  }), [currentPath, searchParams, navigate, base]);

  return (
    <RouterContext.Provider value={contextValue}>
      <RouterPrefixContext.Provider value="">
        {children}
      </RouterPrefixContext.Provider>
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter s'ha de cridar dins de RouterProvider");
  return ctx;
}

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

/* `state`: en memòria ve de l'entrada del router (navigate(to, { state })),
   mai de window.history.state, que és de l'amfitrió. Al navegador l'app és
   ama de l'historial i el pot llegir, excepte fora de base.
   Gauntlet 261017 (M07, C07) · `hash`, camp nou: el fragment (#…) de la URL
   del document, al navegador i dins de la base. En memòria i fora de base,
   '': l'entrada de memòria no el guarda i el fragment de fora és de
   l'amfitrió. Els dobles d'abans no el porten: qui el llig hi posa ''. */
export function useLocation() {
  const { currentPath, searchParams, memoria, estat } = useRouter();
  const foraDeBase = currentPath === null;
  let state = null;
  let hash = '';
  if (memoria) state = estat;
  else if (!foraDeBase) {
    state = window.history.state;
    hash = window.location.hash;
  }
  return { pathname: foraDeBase ? '' : currentPath, search: searchParams.toString(), state, hash };
}

export function useSearchParams() {
  const { searchParams, navigate, currentPath } = useRouter();

  const setParams = useCallback((newParams, options = { replace: true }) => {
    const currentUrl = new URL(currentPath || '/', 'http://localhost');
    currentUrl.search = searchParams.toString();
    if (newParams instanceof URLSearchParams) {
      currentUrl.search = newParams.toString();
    } else {
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          currentUrl.searchParams.delete(key);
        } else {
          currentUrl.searchParams.set(key, value);
        }
      });
    }
    navigate(currentUrl.pathname + currentUrl.search, options);
  }, [navigate, currentPath, searchParams]);
  
  return [searchParams, setParams];
}

const RouteParamsContext = createContext({});

export function useParams() {
  return useContext(RouteParamsContext);
}

/* L'href és el de la ruta resolta sobre la ruta de l'app: el que s'obri en una
   pestanya nova és el mateix lloc on porta el clic. */
function hrefDe(to, basename, currentPath) {
  if (typeof to !== 'string') return to;
  if (to.startsWith('/')) return basename + to;
  const ruta = resolRuta(to, currentPath || '/');
  return ruta === null ? to : basename + ruta;
}

export function Link({ to, children, className, onClick, ...props }) {
  const { navigate, basename, currentPath } = useRouter();
  
  const handleClick = (e) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      // Verificació creuada per no trencar links externs o ancoratges purs
      if (typeof to === 'string' && (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:'))) {
        return; // Deixem que el navegador gestione links externs
      }
      
      e.preventDefault();
      if (onClick) onClick(e);
      navigate(to);
    }
  };
  
  const href = hrefDe(to, basename, currentPath);
  
  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

/* T27 (ordre del Mestre, 260927 nit) · `matchPaths`: rutes filles que també
   encenen l'enllaç (p. ex. /control-xat per a «Xat»), perquè la barra
   principal no es quede mai sense element actiu dins d'una jerarquia. */
export function NavLink({ to, children, className, activeClassName = 'active', matchPaths = [], ...props }) {
  const { currentPath } = useRouter();
  // Fora de base (currentPath null) no s'encén res: l'app no és a cap de les seues rutes.
  const coincidix = (ruta) => currentPath !== null && (currentPath === ruta || currentPath.startsWith(ruta + '/'));
  const isActive = coincidix(to) || matchPaths.some(coincidix);
  
  let combinedClassName = typeof className === 'function' ? className({ isActive }) : className;
  if (isActive && typeof className !== 'function') {
    combinedClassName = combinedClassName ? `${combinedClassName} ${activeClassName}` : activeClassName;
  }
  
  // A11Y: l'estat actiu també es diu als lectors de pantalla, no només amb .active.
  // Un aria-current explícit del consumidor el sobreescriu ({...props} va després).
  return (
    <Link to={to} className={combinedClassName} aria-current={isActive ? 'page' : undefined} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  );
}

export function Navigate({ to, replace }) {
  const { navigate, currentPath } = useRouter();
  // Fora de base cap redirecció: la URL és de l'amfitrió i no se li segresta.
  const foraDeBase = currentPath === null;
  useLayoutEffect(() => {
    if (foraDeBase) return;
    navigate(to, { replace: replace !== false });
  }, [navigate, to, replace, foraDeBase]);
  return null;
}

// Convert express style route path to regex
function pathToRegex(path, exact = false) {
  if (path === '*') return { regex: /(.*)/, keys: [] };
  
  const keys = [];
  let regexStr = escapeRegExp(path);
  
  // Restaurem sintaxi d'expressió
  regexStr = regexStr.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    keys.push(key);
    return '([^\\/]+)';
  });
  
  if (regexStr.endsWith('/\\*')) {
      regexStr = regexStr.replace(/\/\\\*$/, '(?:\\/(.*))?');
      keys.push('*');
  } else {
      regexStr = regexStr.replace(/\\\*/g, '(.*)');
  }

  // Exact matching vs Prefix matching
  const finalRegexStr = exact ? '^' + regexStr + '$' : '^' + regexStr + '(?=\\/|$)';
  return { regex: new RegExp(finalRegexStr), keys };
}

function resolvePath(base, path) {
  if (path === '/' || path === '') return base === '' ? '/' : base;
  if (path.startsWith('/')) return path;
  if (base === '/') return '/' + path;
  return base + '/' + path;
}

export function Routes({ children }) {
  const { currentPath } = useRouter();
  const parentPrefix = useContext(RouterPrefixContext);
  
  // Extracció dels params al nivell superior per memoidzació
  const { matchFound, elementToRender, params, newPrefix } = useMemo(() => {
    // Fora de base no es pinta cap ruta: ni tan sols el comodí '*'.
    if (currentPath === null) return { matchFound: false, elementToRender: null, params: {}, newPrefix: '' };
    let match = false;
    let element = null;
    let currentParams = {};
    let prefix = '';

    React.Children.forEach(children, child => {
      if (match || !React.isValidElement(child)) return;
      
      if (child.props.path !== undefined) {
        const isExact = child.props.exact || !child.props.path.includes('*');
        const absolutePath = resolvePath(parentPrefix, child.props.path);
        const { regex, keys } = pathToRegex(absolutePath, isExact);
        const matchResult = currentPath.match(regex);
        
        if (matchResult) {
          match = true;
          keys.forEach((k, i) => {
            currentParams[k] = safeDecode(matchResult[i + 1] || '');
          });
          
          let np = absolutePath.replace(/\*$/, '');
          if (np.endsWith('/') && np.length > 1) {
              np = np.slice(0, -1);
          }
          prefix = np;
          element = child.props.element;
        }
      } else if (child.props.index) {
         if (currentPath === parentPrefix || currentPath === parentPrefix + '/') {
             match = true;
             element = child.props.element;
         }
      }
    });
    return { matchFound: match, elementToRender: element, params: currentParams, newPrefix: prefix };
  }, [children, currentPath, parentPrefix]);

  if (!matchFound) {
    return null;
  }

  return (
    <RouteParamsContext.Provider value={params}>
      <RouterPrefixContext.Provider value={newPrefix}>
         {elementToRender}
      </RouterPrefixContext.Provider>
    </RouteParamsContext.Provider>
  );


}

export function Route() {
  return null;
}

export function BrowserRouter({ children, basename }) {
  return <RouterProvider basename={basename}>{children}</RouterProvider>;
}

/* Router en memòria: l'historial és una llista pròpia i MAI toca
   window.history ni window.location, que són de l'amfitrió. `rutaInicial` és
   on aterra qui entra (p. ex. /pobles/<id>); si no és una ruta de l'app, '/'.
   La base només prefixa els href dels enllaços.
   `onCanvi(ruta)` (opcional): avisa qui munta el router de la ruta de l'app
   (camí + consulta) en muntar i a cada canvi. L'element el fa servir per a
   emetre `sdp-navega` cap a l'amfitrió (clàusula dels slugs), però la tapa
   abans: la consulta i els ids no ixen (contracteAmfitrio.js:tapaRuta).
   Onada 12 (261011; ordres 261011_0130, punt 4) · `alSaltar(n)` (opcional):
   qui munta el router pot atendre els salts numèrics (navigate(-1)) amb
   l'historial del navegador quan l'amfitrió ha declarat `ruta-a-url`
   (PedraSecaEmbed.jsx, ReflexDeRuta). Si torna true, el salt ja és seu i la
   llista pròpia no es mou; si no, el salt és el de sempre, en memòria. El
   context porta `index` (la posició en la llista pròpia) perquè el reflex
   distingisca una entrada nova (puja) d'una substitució (no canvia), i
   navigate(ruta, { replace: true, posicio }) torna a una entrada de la llista
   (la que el popstate del navegador assenyala) en lloc de reescriure l'última. */
export function MemoryRouter({ children, basename = '', rutaInicial = '/', onCanvi, alSaltar }) {
  const base = useMemo(() => normalitzaBase(basename), [basename]);

  const [state, setState] = useState(() => ({
    history: [entradaInicial(rutaInicial)],
    index: 0
  }));

  const entrada = state.history[state.index];
  const currentPath = entrada.path;
  const searchParams = entrada.search;
  const estat = entrada.state;

  // L'últim callback, sense tornar a avisar quan només canvia la seua identitat.
  const onCanviRef = useRef(onCanvi);
  useEffect(() => { onCanviRef.current = onCanvi; }, [onCanvi]);
  const cerca = searchParams.toString();
  const rutaActual = cerca ? `${currentPath}?${cerca}` : currentPath;
  useEffect(() => {
    if (typeof onCanviRef.current === 'function') onCanviRef.current(rutaActual);
  }, [rutaActual]);

  const navigate = useCallback((to, options = {}) => {
    if (!to && to !== 0) return;
    if (typeof to === 'number' && typeof alSaltar === 'function' && alSaltar(to) === true) return;

    setState(prev => {
      if (typeof to === 'number') {
        const newIdx = Math.max(0, Math.min(prev.index + to, prev.history.length - 1));
        return { ...prev, index: newIdx };
      }

      // La relativa es resol sobre la ruta de l'app; un destí de fora no mou res.
      const ruta = resolRuta(to, prev.history[prev.index].path);
      if (ruta === null) return prev;

      const newEntry = entradaDeMemoria(ruta, options.state ?? null);
      /* `posicio` (el reflex, en un popstate): si la llista ja té esta ruta
         en eixa posició, s'hi va sense retallar res i amb el seu estat. */
      const vella = Number.isInteger(options.posicio) ? prev.history[options.posicio] : null;
      if (vella && vella.path === newEntry.path && vella.search.toString() === newEntry.search.toString()) {
        return { ...prev, index: options.posicio };
      }
      let newHistory = prev.history.slice(0, prev.index + 1);
      
      if (options.replace) {
        newHistory[newHistory.length - 1] = newEntry;
        return { history: newHistory, index: newHistory.length - 1 };
      } else {
        newHistory.push(newEntry);
        return { history: newHistory, index: newHistory.length - 1 };
      }
    });
  }, [alSaltar]);

  const index = state.index;
  const contextValue = useMemo(() => ({
    currentPath,
    searchParams,
    navigate,
    basename: base,
    memoria: true,
    estat,
    index
  }), [currentPath, searchParams, navigate, base, estat, index]);

  return (
    <RouterContext.Provider value={contextValue}>
      <RouterPrefixContext.Provider value="">
        {children}
      </RouterPrefixContext.Provider>
    </RouterContext.Provider>
  );
}
export function matchPath(pattern, pathname) {
  if (typeof pattern === 'string') {
    pattern = { path: pattern, exact: false };
  }
  const isExact = pattern.exact !== false;
  const { regex, keys } = pathToRegex(pattern.path, isExact);
  const match = pathname.match(regex);
  if (!match) return null;
  
  const params = {};
  keys.forEach((k, i) => {
    params[k] = safeDecode(match[i + 1] || '');
  });
  
  return {
    params,
    pathname: match[0],
    pattern
  };
}
