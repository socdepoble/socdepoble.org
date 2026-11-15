/* Onada R29 · R29-RUT-04 · Un tros ACCESSORI que no arriba (la guia dels
   canals de /page/descarregues, l'aparador i la targeta del WhatsApp de
   /page/node-zero) es queda dins de la seua barrera: la pàgina de text, que
   ja era carregada, continua sencera i la barrera de la ruta no salta. Abans,
   el tros (lazy nu o lazyRoute sense barrera pròpia) tombava la pàgina
   sencera darrere de «Hi ha hagut un problema». */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary.jsx';

const m = vi.hoisted(() => ({ slug: 'node-zero' }));
const noArriba = vi.hoisted(() => () => { throw new TypeError('Failed to fetch dynamically imported module'); });
vi.mock('../../app/contexts/RouterContext', () => ({ Navigate: ({ to }) => <p>{to}</p>, useParams: () => ({ slug: m.slug }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: { [m.slug]: { title: m.slug, html: '<p>Cos</p>' } } }) }));
/* Onada R29 · L'H1 del doble viu dins del seu <header class="page-title">, com a la pàgina real (design_guard). */
vi.mock('../text/TextSection', () => ({ default: ({ children, peuDePagina }) => <article><header className="page-title"><h1>Pàgina de text</h1></header>{children}{peuDePagina}</article> }));
vi.mock('../control/PublicarDeLaPagina.jsx', () => ({ PublicarDeLaPagina: ({ clau }) => <button>Publicar {clau}</button> }));
vi.mock('./InstalaLaPwa.jsx', () => ({ InstalaLaPwa: () => null, useInstalacioDeLaPagina: () => null }));
vi.mock('../../app/contexts/ProveidorProjeccionsCataleg.jsx', () => ({ default: ({ children }) => <>{children}</> }));
vi.mock('../text/AparadorFediversity.jsx', () => noArriba());
vi.mock('../../components/patrimoni/IaiaWhatsappCard.jsx', () => noArriba());
vi.mock('./GuiaCanalsActualitzacio.jsx', () => noArriba());
import PageDetailSection from './PageDetailSection.jsx';

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test.each(['node-zero', 'descarregues'])('/page/%s: l’accessori que no arriba no tapa la pàgina', async (slug) => {
  m.slug = slug;
  render(
    <RouteErrorBoundary resetKey={`/page/${slug}?`} externalConfig={{ manageDocumentHead: true }} enLinia mostraDetall={false}>
      <PageDetailSection />
    </RouteErrorBoundary>
  );
  await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('heading', { level: 1, name: 'Pàgina de text' })).toBeTruthy();
  expect(screen.getByRole('button', { name: `Publicar ${slug}` })).toBeTruthy();
});
