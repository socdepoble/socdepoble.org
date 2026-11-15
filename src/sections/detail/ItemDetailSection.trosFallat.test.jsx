/* Onada R29 · R29-RUT-01 · /receptes/:slug amb el tros de la recepta que no
   arriba (xarxa rural, o una pestanya vella després d'un desplegament, amb la
   recàrrega automàtica vetada). L'ItemDetailSection de veres dins del
   RouteErrorBoundary de veres: amb lazyRoute, l'error és un LazyRouteError,
   la barrera oferix «Recarrega l’aplicació» i l'incident s'anota com a
   «tros». Amb el lazy nu de React, arribava un TypeError: «Intentar de nou»
   (que React no pot complir: guarda el rebuig) i l'incident com a «ruta». */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary.jsx';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext.jsx';
import { _reiniciaAutocuracio, incidents } from '../../utils/autocuracio.js';
import ItemDetailSection from './ItemDetailSection.jsx';

vi.mock('../patrimoni/ReceptaDetailSection.jsx', () => {
  throw new TypeError('Failed to fetch dynamically imported module: /assets/ReceptaDetailSection-prova.js');
});
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...await importOriginal(),
  useUIActions: () => ({ t: (_clau, reserva) => reserva })
}));

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); _reiniciaAutocuracio(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('el tros de la recepta que no arriba oferix recarregar, mai un reintent fals', async () => {
  render(
    <MemoryRouter rutaInicial="/receptes/x">
      <RouteErrorBoundary resetKey="/receptes/x?" externalConfig={{ manageDocumentHead: true }} enLinia mostraDetall={false}>
        <Routes>
          <Route path="/:sectionId/:itemId" element={<ItemDetailSection />} />
        </Routes>
      </RouteErrorBoundary>
    </MemoryRouter>
  );
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Recarrega l’aplicació' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Intentar de nou' })).toBeNull();
  expect(incidents().map(({ tipus, on }) => [tipus, on])).toEqual([['tros', 'receptes']]);
});
