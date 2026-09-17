import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';

const RouterContext = createContext();
const RouterPrefixContext = createContext('');

/**
 * Escapa expressions regulars per evitar col·lisions.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function RouterProvider({ children, basename = '' }) {
  const base = useMemo(() => {
    return basename.endsWith('/') ? basename.slice(0, -1) : basename;
  }, [basename]);

  const getNormalizedPath = useCallback(() => {
    let p = window.location.pathname;
    if (base && p.startsWith(base)) {
      p = p.slice(base.length) || '/';
    }
    return p;
  }, [base]);

  const [currentPath, setCurrentPath] = useState(getNormalizedPath());
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const handlePopState = (event) => {
      // Prevenció: ignora popstates espuris si no ha canviat la ruta
      const newPath = getNormalizedPath();
      const newSearch = window.location.search;
      setCurrentPath(newPath);
      setSearchParams(new URLSearchParams(newSearch));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getNormalizedPath]);

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
    
    let targetPath = to;
    if (to.startsWith('/')) {
        targetPath = base + to;
    }

    const state = options.state || null;

    if (options.replace) {
      window.history.replaceState(state, '', targetPath);
    } else {
      window.history.pushState(state, '', targetPath);
    }
    
    const url = new URL(targetPath, window.location.origin);
    setCurrentPath(getNormalizedPath());
    setSearchParams(new URLSearchParams(url.search));
  }, [base, getNormalizedPath]);

  const contextValue = useMemo(() => ({
    currentPath,
    searchParams,
    navigate,
    basename: base
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

export function useLocation() {
  const { currentPath, searchParams } = useRouter();
  return { pathname: currentPath, search: searchParams.toString(), state: window.history.state };
}

export function useSearchParams() {
  const { searchParams, navigate } = useRouter();
  
  const setParams = useCallback((newParams, options = { replace: true }) => {
    const currentUrl = new URL(window.location.href);
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
  }, [navigate]);
  
  return [searchParams, setParams];
}

const RouteParamsContext = createContext({});

export function useParams() {
  return useContext(RouteParamsContext);
}

export function Link({ to, children, className, onClick, ...props }) {
  const { navigate } = useRouter();
  
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
  
  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

export function NavLink({ to, children, className, activeClassName = 'active', ...props }) {
  const { currentPath } = useRouter();
  const isActive = currentPath === to || currentPath.startsWith(to + '/');
  
  let combinedClassName = typeof className === 'function' ? className({ isActive }) : className;
  if (isActive && typeof className !== 'function') {
    combinedClassName = combinedClassName ? `${combinedClassName} ${activeClassName}` : activeClassName;
  }
  
  return (
    <Link to={to} className={combinedClassName} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  );
}

export function Navigate({ to, replace }) {
  const { navigate } = useRouter();
  useLayoutEffect(() => {
    navigate(to, { replace: replace !== false });
  }, [navigate, to, replace]);
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
            currentParams[k] = matchResult[i + 1] || '';
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

export function MemoryRouter({ children, basename = '' }) {
  const base = useMemo(() => {
    return basename.endsWith('/') ? basename.slice(0, -1) : basename;
  }, [basename]);

  const [currentPath, setCurrentPath] = useState(base || '/');
  const [searchParams, setSearchParams] = useState(new URLSearchParams());
  
  const navigate = useCallback((to, options = {}) => {
    if (!to) return;
    let targetPath = to;
    if (to.startsWith('/')) {
        targetPath = base + to;
    }
    const url = new URL(targetPath, 'http://localhost');
    let p = url.pathname;
    if (base && p.startsWith(base)) {
      p = p.slice(base.length) || '/';
    }
    setCurrentPath(p);
    setSearchParams(url.searchParams);
  }, [base]);

  const contextValue = useMemo(() => ({
    currentPath,
    searchParams,
    navigate,
    basename: base
  }), [currentPath, searchParams, navigate, base]);

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
    params[k] = match[i + 1] || '';
  });
  
  return {
    params,
    pathname: match[0],
    pattern
  };
}
