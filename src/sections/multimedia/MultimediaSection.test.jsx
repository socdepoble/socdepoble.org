/** T64 · La botonera Galeria / Cronologia de /multimedia, centrada (fins al
 *  Bloc E). IDEA-55 + P1-71 (Onada 261029_1605, Bloc E) · /multimedia és ara
 *  un UniversalWorkspace de tres columnes: sense pastilles de mode; la vista
 *  «Carpeta local» munta la Barra de volums. La regla CSS del modificador de
 *  centrat es conserva (la fan servir SearchSection i OnboardingSteps). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, cleanup, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';

const mocks = vi.hoisted(() => ({
  multimedia: {
    mediaItems: [
      { id: 'm1', title: 'Era', src: '/era.webp', created_at: '2026-09-01T10:00:00Z' },
      { id: 'm2', title: 'Font', src: '/font.webp', created_at: '2026-08-01T10:00:00Z' }
    ],
    mediaTimelineGroups: [{ key: '2026-09', label: 'Setembre 2026', items: [{ id: 'm1', title: 'Era', src: '/era.webp' }] }]
  }
}));

// La UniversalPage només pinta el títol i el cos: es prova l'estructura de la secció.
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <article><header className="page-title"><h1>{title}</h1></header>{children}</article>
}));
/* Bloc E · El router en memòria de veres: l'espai de treball llig i escriu ?categoria=&item=. */
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => ({ mitjans: [], cens: new Map() }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
/* IDEA-55 (Onada 261029_1605) · El Bloc de Notes del Gestor d'arxius locals. */
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ canCreate: true, creaNota: async () => ({ id: 'n-1' }) }) }));
import MultimediaSection from './MultimediaSection.jsx';

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const munta = (ruta = '/multimedia') => render(<MemoryRouter rutaInicial={ruta}><MultimediaSection /></MemoryRouter>);

test('Bloc E · la secció és un UniversalWorkspace de tres columnes, sense cap pastilla de mode', () => {
  const { container } = munta();
  for (const id of ['app-grid-sidebar', 'app-grid-list', 'app-grid-main']) expect(container.querySelector(`#${id}`)).not.toBeNull();
  expect(screen.queryByRole('group', { name: 'Mode de vista' })).toBeNull();
  expect(container.querySelector('.sdp-pindola--centrada')).toBeNull();
  expect(within(container.querySelector('#app-grid-main')).getByRole('heading', { level: 1, name: 'Arxiu visual' })).not.toBeNull();
});

/* Gauntlet 261029 (cicle 1, IDEA-57) · La capçalera de facetes de l'Arxiu visual
   d'abans del Bloc E no la pinta ningú: la regla ja no és a modules.css (la
   de les opcions, .univ-manager-facet-item, sí: la fa servir el Tauler). */
test('IDEA-57 · cap regla morta .univ-manager-facet-header', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
  expect(css).not.toMatch(/\.univ-manager-facet-header\b/);
  expect(css).toMatch(/\.univ-manager-facet-item\s*\{/);
});

/* El centrat el fa el modificador canònic, no cap CSS nou de Multimèdia: com a
   fill flex de .univ-manager-toolbar, margin-inline:auto reparteix l'espai
   lliure a banda i banda. Ha d'anar DESPRÉS de .sdp-pindola (mateixa capa i
   especificitat) perquè el seu display no el trepitge ningú. */
test('T64 · .sdp-pindola--centrada centra la caixa (width fit-content, margin-inline auto) i va després de .sdp-pindola', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
  const regla = css.match(/\.sdp-pindola--centrada\s*\{([^}]*)\}/);
  expect(regla).not.toBeNull();
  expect(regla[1]).toMatch(/margin-inline:\s*auto/);
  expect(regla[1]).toMatch(/width:\s*fit-content/);
  expect(css.indexOf('.sdp-pindola {')).toBeGreaterThan(-1);
  expect(css.indexOf('.sdp-pindola {')).toBeLessThan(regla.index);
});

/* IDEA-54/55 (Onada 261029_1605) · «Carpeta local · Volums muntats» munta la
   Barra de volums del Gestor d'arxius locals, amb «Vincular carpeta local». */
test('la vista local_root munta la Barra de volums amb «Vincular carpeta local»', async () => {
  const { container } = munta('/multimedia?categoria=local_root');
  const detall = within(container.querySelector('#app-grid-main'));
  expect(detall.getByRole('heading', { level: 1, name: 'Carpeta local · Volums muntats' })).not.toBeNull();
  expect(await detall.findByRole('heading', { level: 3, name: 'Volums i carpetes locals' })).not.toBeNull();
  expect(detall.getByRole('button', { name: 'Vincular carpeta local' })).not.toBeNull();
});
