import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { buidaCauTraduccions } from '../PedraSeca/hooks/useTraduccioPagina.js';

/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · El descobriment de
   veres, sense cap doble del context: l'externalConfig.traductorUrl que el
   plugin fa arribar (traductor-url → PedraSecaEmbed, ronda D1 de Codex) i el
   UIProvider real. Amb el router en memòria, com a tota incrustació: la
   traducció no toca ni la ruta de l'app ni la barra d'adreces de l'amfitrió. */

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';

beforeEach(() => {
  buidaCauTraduccions();
  // jsdom no porta matchMedia i el UIProvider la consulta per al tema.
  if (typeof window.matchMedia !== 'function') {
    vi.stubGlobal('matchMedia', (consulta) => ({
      matches: false, media: consulta, addEventListener() {}, removeEventListener() {},
    }));
  }
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const pinta = (externalConfig) => render(
  <UIProvider externalConfig={externalConfig}>
    <MemoryRouter rutaInicial="/festes">
      <UniversalPage chrome="context" title="Festes">
        <p>Bon dia a tothom.</p>
      </UniversalPage>
    </MemoryRouter>
  </UIProvider>
);

test('amb traductorUrl a l’externalConfig: menú, petició al mateix origen i pàgina en anglés', async () => {
  const fetch = vi.fn(async (_, { body }) => {
    const { textos } = JSON.parse(body);
    return { ok: true, status: 200, json: async () => ({ traduccions: textos.map((t) => `EN ${t}`), origen: 'CA', desti: 'EN-GB', cache: false }) };
  });
  vi.stubGlobal('fetch', fetch);
  const adreca = window.location.href;
  const { container } = pinta({ traductorUrl: URL_SERVEI });
  const traduir = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(traduir.getAttribute('aria-haspopup')).toBe('menu');
  fireEvent.click(traduir);
  await act(async () => {
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Anglés' }));
  });
  expect(fetch.mock.calls[0][0]).toBe(`${window.location.origin}${URL_SERVEI}`);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ textos: ['Festes', 'Bon dia a tothom.'], desti: 'EN-GB', origen: 'CA', format: 'text' });
  expect(container.querySelector('h1').textContent).toBe('EN Festes');
  expect(container.querySelector('article.sdp-traduccio-cos').getAttribute('lang')).toBe('en-GB');
  expect(window.location.href).toBe(adreca);
});

test('sense traductorUrl (socdepoble.org): Traduir no anuncia cap menú i no fa cap petició', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { container } = pinta({});
  const traduir = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(traduir.hasAttribute('aria-haspopup')).toBe(false);
  fireEvent.click(traduir);
  expect(screen.queryByRole('menu')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
