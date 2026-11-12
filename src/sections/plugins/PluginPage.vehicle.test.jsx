/**
 * llibre-deutes-02 (261104) · /plugin/vehicle ja no està en obres.
 * IDEA-61 (T0, prompt 261102_1532) va obrir Vehicle Compartit: el Panell
 * porta Publicar a /notes?ambit=vehicle i la secció és /vehicle
 * (destinsControl.js; App.jsx, SeccioVertical). La pàgina del plugin
 * continuava pintant el botó inert «Obrir Vehicle Compartit (en obres)» i
 * l'avís «Esta eina encara està en obres.», i l'entradilla (la vista prèvia
 * social de la pàgina) deia «Eina en obres». Dos missatges contradictoris
 * del mateix Mas.
 *
 * Ara: un sol enllaç «Obrir Vehicle Compartit» cap a /vehicle, sense avís
 * ni toast d'en obres. /vehicle és una secció d'App i no una app de la
 * plataforma: no passa per cap interruptor d'app, i s'obri igual en
 * desenvolupament que en un build de producció.
 *
 * Router en memòria i plataforma de veres, com PluginPage.test.jsx.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import PluginPage from './PluginPage.jsx';
import { pluginPerId } from './registrePlugins.js';

/* Un node on tot el que és compilat està encés (com el servidor de dev). */
/* P0-113 (ordre del Mestre, 261111: «TOT el sistema és 100% gratuït») · Fora `teDret`: cap eina
   necessita cap dret. */
const ENTORN_OBERT = Object.freeze({ produccio: false, teCapacitat: () => true, amaDelDocument: true });
/* Un node de producció. Vehicle no és cap app de la plataforma: cap interruptor el tanca. */
const ENTORN_PRODUCCIO = Object.freeze({ produccio: true, teCapacitat: () => true, amaDelDocument: true });

function Ubicacio() {
  const { pathname } = useLocation();
  return <p data-testid="ubicacio">{pathname}</p>;
}

function munta(ruta, entorn) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  return render(
    <UIProvider externalConfig={{}}>
      <NotificationProvider>
        <MemoryRouter rutaInicial={ruta} basename="">
          <ProveidorPlataforma entorn={entorn}>
            <Routes>
              <Route path="/plugin/:id" element={<PluginPage />} />
              <Route path="*" element={<p>Fora de la pàgina</p>} />
            </Routes>
            <Ubicacio />
          </ProveidorPlataforma>
        </MemoryRouter>
      </NotificationProvider>
    </UIProvider>
  );
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('llibre-deutes-02 · /plugin/vehicle obri la secció /vehicle', () => {
  test.each([['desenvolupament', ENTORN_OBERT], ['producció', ENTORN_PRODUCCIO]])(
    'en %s: un enllaç «Obrir Vehicle Compartit» cap a /vehicle, sense botó inert ni avís d’en obres', (_nom, entorn) => {
      const { container } = munta('/plugin/vehicle', entorn);
      const plugin = pluginPerId('vehicle');
      // L'entradilla de la pàgina (i de la vista prèvia social) ja no diu «en obres».
      expect(container.querySelector('.page-intro .lead').textContent).toBe(plugin.entradilla);
      expect(plugin.entradilla).not.toMatch(/en obres/i);
      // Un sol control, l'enllaç de baix, a l'ample sencer com els altres plugins oberts.
      const enllac = screen.getByRole('link', { name: 'Obrir Vehicle Compartit' });
      expect(enllac.getAttribute('href')).toBe('/vehicle');
      expect(enllac.getAttribute('aria-disabled')).toBeNull();
      expect(enllac.parentElement).toBe(container.querySelector('.sdp-pagina-accio'));
      expect(screen.queryByRole('button', { name: /Obrir Vehicle Compartit/ })).toBeNull();
      expect(screen.queryByText('Esta eina encara està en obres.')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
      fireEvent.click(enllac);
      expect(ubicacio()).toBe('/vehicle');
      expect(screen.queryByText('“Obrir Vehicle Compartit” encara està en obres.')).toBeNull();
    }
  );
});
