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

/* IDEA-54/55 (Onada 261029_1605) · «Carpeta local · Volums muntats» i la
   Barra de volums del Gestor d'arxius locals, amb «Vincular carpeta local».
   P1-71 (marató nocturna 261101) · La Barra viu a la Columna 1, davall de les
   vistes (contracte d'IDEA-55): una sola, i cap a la columna del detall.
   Gauntlet 261101 (G-D5) · El seu títol és un h2, abans de l'H1 de la pàgina.
   Gauntlet 2 261101 (G2-09) · I fora del landmark de navegació: són accions. */
test('la vista local_root i la Barra de volums amb «Vincular carpeta local», a la Columna 1', async () => {
  const { container } = munta('/multimedia?categoria=local_root');
  const detall = within(container.querySelector('#app-grid-main'));
  const navegacio = within(container.querySelector('#app-grid-sidebar'));
  expect(detall.getByRole('heading', { level: 1, name: 'Carpeta local · Volums muntats' })).not.toBeNull();
  expect(await navegacio.findByRole('heading', { level: 2, name: 'Volums i carpetes locals' })).not.toBeNull();
  expect(navegacio.getByRole('button', { name: 'Vincular carpeta local' })).not.toBeNull();
  expect(detall.queryByRole('heading', { name: 'Volums i carpetes locals' })).toBeNull();
  expect(container.querySelectorAll('[data-accio="vincula"]')).toHaveLength(1);
  expect(container.querySelector('[data-accio="vincula"]').closest('nav')).toBeNull();
});

/* Gauntlet 261101 (G-D1 i G-D5) · jsdom no pinta: es llig el bloc P1-71 de
   modules.css sense comentaris. A la Columna 1 (de 200 a 260 px), la targeta
   de la Barra parteix les paraules que no caben (noms de volum sense espais),
   cap píndola no passa de l'ample, l'avís posa la icona damunt del text, i el
   títol h2 porta la cara del h3 del Gestor (mida, pes, alineació, espaiat i
   filet). Ho ha mesurat Chrome a :3340 (1440, 1280 i 1024 px).
   Gauntlet 2 261101 · G2-05: `anywhere` només als textos amb el nom d'un
   volum (el nom de la píndola i l'avís), mai a l'etiqueta d'un botó, que
   ocupa la fila sencera i parteix pels espais; G2-01: la icona d'un botó o
   d'una píndola no s'encongix (flex: none); G2-04: el h2 porta també el color
   del h3, el blau d'acció. Mesurat amb Chrome a :3340 (1440, 1280, 1024, 820
   i 390 px): icones de 20×20 i 18×18, cap etiqueta partida a mitja paraula. */
test('G-D1, G-D5, G2-01, G2-04 i G2-05 · el peu de la Columna 1 no desborda, no parteix etiquetes ni encongix icones, i el seu h2 té la cara del h3', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const cos = (selector) => {
    const escapat = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return css.match(new RegExp(`(?:^|[};]) ?${escapat} ?\\{([^}]*)\\}`))?.[1] ?? null;
  };
  const PEU = '.sdp-workspace .sdp-workspace-column__peu';
  expect(cos(`${PEU} .sdp-arxiu-local__panell`)).toMatch(/padding: var\(--sdp-space-3\)/);
  /* G2-05 · Cap `anywhere` heretable per la targeta sencera (ni als botons). */
  expect(cos(`${PEU} .sdp-arxiu-local__panell`)).not.toMatch(/overflow-wrap/);
  expect(cos(`${PEU} :is(.pill > span, .sdp-alerta__titol, .sdp-alerta__text)`)).toMatch(/overflow-wrap: anywhere/);
  expect(css).not.toMatch(/sdp-workspace-column__peu[^{}]*\.sdp-boto[^{}]*\{[^}]*overflow-wrap/);
  const boto = cos(`${PEU} .sdp-boto`);
  for (const decl of ['inline-size: 100%', 'gap: var(--sdp-space-1)', 'padding-inline: var(--sdp-space-2)']) expect(boto).toContain(decl);
  /* G2-01 · Les icones dels botons i de les píndoles, sense encongir-se. */
  expect(cos(`${PEU} :is(.sdp-boto, .pill) > svg`)).toMatch(/flex: none/);
  expect(cos(`${PEU} .pill`)).toMatch(/max-inline-size: 100%/);
  expect(cos(`${PEU} .sdp-alerta`)).toMatch(/flex-direction: column/);
  expect(cos(`${PEU} .sdp-alerta__cos`)).toMatch(/inline-size: 100%/);
  const titol = cos(`${PEU} .sdp-arxiu-local__panell > h2`);
  for (const decl of [
    'font-size: var(--sdp-text-h5)', 'font-weight: var(--sdp-pes-negreta)', 'letter-spacing: inherit', 'text-align: start',
    'color: var(--sdp-accio-text)', 'padding-block-end: var(--sdp-space-3)', 'border-block-end: 1px solid var(--sdp-vora)'
  ]) expect(titol).toContain(decl);
});
