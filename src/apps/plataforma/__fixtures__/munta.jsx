/* Suport de proves de la Plataforma d'Apps Enxufables: el muntatge comú.
   UIProvider + router de navegador sobre la URL de jsdom + la plataforma amb
   un registre i un entorn propis. Cap fitxer de producció l'importa. */
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, Route, Routes, useLocation } from '../../../app/contexts/RouterContext.jsx';
import { UIProvider } from '../../../app/contexts/UIContext.jsx';
import { RouteSEO } from '../../../hooks/RouteSEO.jsx';
import { ProveidorPlataforma } from '../PlataformaContext.jsx';
import RutaApps from '../RutaApps.jsx';

/* Un node de producció on tot està encés: cada prova en retoca una capa. */
export const ENTORN_OBERT = Object.freeze({ produccio: true, teDret: () => true, teCapacitat: () => true, amaDelDocument: true });

export function preparaNavegador() {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
}

export function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

/** Munta `fills` (o la ruta /app/* de l'App) a la URL `url`. */
export function muntaPlataforma(url, { registre, entorn = ENTORN_OBERT, externalConfig = {}, fills = null, seo = false } = {}) {
  preparaNavegador();
  window.history.replaceState(null, '', url);
  return render(
    <UIProvider externalConfig={externalConfig}>
      <BrowserRouter>
        <ProveidorPlataforma registre={registre} entorn={entorn}>
          {seo ? <RouteSEO /> : null}
          {fills || (
            <Routes>
              <Route path="/app/*" element={<RutaApps />} />
              <Route path="/*" element={<p>Fora de les apps</p>} />
            </Routes>
          )}
          <Ubicacio />
        </ProveidorPlataforma>
      </BrowserRouter>
    </UIProvider>
  );
}
