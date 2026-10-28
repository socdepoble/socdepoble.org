/* Pla 261027_0845 (Guarda Nocturna), §3 · La documentació pública de la
   Maquinària, a demanda (DocumentacioMaquinaria.jsx, amb lazyRoute), en mode
   producció: import.meta.env.DEV és fals ABANS d'importar la Wiki
   (vi.hoisted), com quan Vite el reemplaça al build. Si el tros no arriba
   (una connexió rural que cau), la fallada es queda dins del cos, com la de
   la Consola (WikiDePobleSection.consolaDiferida.test.jsx): la capçalera de
   la pàgina continua, la barrera de la ruta no rep res i es pot triar un
   altre document. El doble de la documentació falla en importar-se. */
import React from 'react';
import { afterAll, afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const fixture = vi.hoisted(() => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('PROD', true);
  return { itemId: 'tractors_aprovacio' };
});
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', async () => {
  const { SlotErrorBoundary } = await import('../../components/universal/workspace/SlotErrorBoundary.jsx');
  return {
    UniversalWorkspace: ({ model, renderDetail, className }) => (
      <div className={className}>
        <SlotErrorBoundary domini="detall" resetKey={fixture.itemId}>
          {renderDetail({ item: model.items.find((item) => item.id === fixture.itemId) })}
        </SlotErrorBoundary>
      </div>
    )
  };
});
vi.mock('../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [] } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), useLocation: () => ({ pathname: '/wikidepoble', search: `?item=${fixture.itemId}` }), Link: 'a'
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('./DocumentacioMaquinaria.jsx', () => { throw new TypeError('Failed to fetch dynamically imported module'); });

import WikiDePobleSection from './WikiDePobleSection.jsx';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary.jsx';
import { PAGE_COPY } from '../text/pageContent';

/* React avisa per consola de cada error que recull una barrera i, en
   desenvolupament, el torna a llançar dins d'un esdeveniment de jsdom: es
   dona per atés (el patró de consolaDiferida.test.jsx). */
const atesa = (event) => event.preventDefault();
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', atesa);
});
afterEach(() => {
  window.removeEventListener('error', atesa);
  cleanup();
  vi.restoreAllMocks();
  fixture.itemId = 'tractors_aprovacio';
});
afterAll(() => vi.unstubAllEnvs());

const ambLaRuta = () => (
  <RouteErrorBoundary resetKey="/wikidepoble" externalConfig={{ manageDocumentHead: true }} mostraDetall={false}>
    <WikiDePobleSection />
  </RouteErrorBoundary>
);

test('l’entorn de la prova és el de producció', () => {
  expect(import.meta.env.DEV).toBe(false);
});

test('la capçalera es pinta de seguida; si el tros no arriba, ho diu dins del cos i la resta de la Wiki continua', async () => {
  const { container } = render(ambLaRuta());
  expect([...document.querySelectorAll('h1')].map((h1) => h1.textContent)).toEqual(['Aprovació de tractors']);
  expect(screen.getByText('Carregant la documentació…')).toBeTruthy();
  const avis = await screen.findByRole('alert');
  expect(avis.className).toBe('sdp-alerta sdp-alerta--error');
  expect(avis.textContent).toBe('No s’ha pogut carregar la documentacióLa resta de la Wiki continua com sempre.');
  expect(avis.closest('header.page-title')).toBeNull();
  expect(avis.querySelector('button')).toBeNull();
  expect(container.querySelector('.sdp-wiki-workspace').contains(avis)).toBe(true);
  expect(document.querySelector('.sdp-route-error')).toBeNull();
  expect(screen.queryByText('Failed to fetch dynamically imported module')).toBeNull();
  expect([...document.querySelectorAll('h1')].map((h1) => h1.textContent)).toEqual(['Aprovació de tractors']);
});

test('es pot triar un altre document', async () => {
  const vista = render(ambLaRuta());
  await screen.findByRole('alert');
  fixture.itemId = '__intro';
  vista.rerender(ambLaRuta());
  expect(screen.queryByRole('alert')).toBeNull();
  expect(document.querySelector('header.page-title h1').textContent).toBe(PAGE_COPY.wikidepoble.title);
  expect(document.querySelector('.sdp-route-error')).toBeNull();
});

/* Pla 261028_1526 (P1-61, Fase 2) · WikiDetail registra el seu <head> amb
   useSEO, que necessita UIProvider. Els contractes visuals d'esta suite són
   independents del head: el real té la seua suite (WikiDePobleSection.seo.test.jsx). */
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
