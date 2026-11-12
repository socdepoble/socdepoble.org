import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ language: 'ca', destins: [] }));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main> }));
vi.mock('../../components/universal/workspace/ProjeccionsEnSuperficie.jsx', () => ({ default: ({ desti }) => { m.destins.push(desti); return <section aria-label="Referències publicades" />; } }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIActionsOpcional: () => ({ language: m.language }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
import PaginesImportadesSection from './PaginesImportadesSection.jsx';
import { DESTINACIONS_WORKSPACE_WP, rutaWorkspaceWp } from '../../data/importacio/destinacionsWorkspaceWp.js';
afterEach(() => { cleanup(); m.destins = []; m.language = 'ca'; });

test.each([
  ['ca', 'Pàgines del fons documental'], ['es', 'Páginas del fondo documental'],
  ['en', 'Documentary collection pages'], ['gl', 'Páxinas do fondo documental'],
  ['eu', 'Dokumentu bildumako orrialdeak']
])('la superfície de pàgina %s llig les referències del mateix lector neutral', (language, title) => {
  m.language = language; render(<PaginesImportadesSection />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title);
  expect(m.destins).toEqual(['pagina']);
});

test('les cinc destinacions tenen una ruta de superfície i un valor alié no navega', () => {
  expect(DESTINACIONS_WORKSPACE_WP.map(rutaWorkspaceWp)).toEqual([
    '/mur', '/page/arbres-monumentals', '/page/herbari', '/page/receptes', '/page/importacions-editorials'
  ]);
  for (const valor of ['__proto__', {}, null, 'https://extern.test']) expect(rutaWorkspaceWp(valor)).toBeNull();
});
