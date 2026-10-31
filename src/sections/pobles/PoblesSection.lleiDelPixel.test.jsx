/**
 * VQ · Fase 3a de l'eina de pobles nous (261030; disseny
 * nit/viquipedia_disseny.md §4.1, §4.3 pas 3a-3 i §6.1) · Llei del Píxel a
 * /pobles: amb totes les fitxes completes (la llavor), cap petició, cap
 * import de la cau i cap base IndexedDB oberta, i la targeta diu el mateix
 * que la fitxa. Una fitxa incompleta omple els buits amb la cau, sense cap
 * petició i sense cap foto de Commons.
 */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {}, cauImportada: 0 }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams('')],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
/* La cau de veres, però comptant qui l'importa. */
vi.mock('./cauDeViquipedia.js', async (original) => {
  mocks.cauImportada += 1;
  return original();
});

import PoblesSection from './PoblesSection.jsx';
import { TOWNS } from './townsContent.js';
import { clauDeViquipedia } from './fitxaDelPoble.js';

const llavor = (towns) => ({ status: 'ready', error: null, sortedTowns: towns });
const targetes = (arrel) => [...arrel.querySelectorAll('article.sp-card')];
const titol = (targeta) => targeta.querySelector('.sp-card-title').textContent;

let fetch;
let obri;
beforeEach(() => {
  mocks.core = llavor(TOWNS);
  mocks.mur = { status: 'ready', feedPosts: [], marketItems: [], events: [] };
  fetch = vi.fn(() => { throw new Error('cap petició'); });
  vi.stubGlobal('fetch', fetch);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('la llavor (tot complet): cap petició, cap import de la cau, cap IndexedDB, i la targeta diu la fitxa', async () => {
  obri = vi.fn();
  vi.stubGlobal('indexedDB', { open: obri });
  const { container } = render(<PoblesSection />);
  await new Promise((resol) => { setTimeout(resol, 20); });
  expect(mocks.cauImportada).toBe(0);
  expect(obri).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  const llista = targetes(container);
  expect(llista).toHaveLength(TOWNS.length);
  for (const targeta of llista) {
    const town = TOWNS.find((t) => t.title === titol(targeta));
    expect(targeta.querySelector('.sp-card-text p, p.sp-card-text').textContent).toBe(town.content);
  }
  expect(container.innerHTML).not.toContain('wikimedia.org');
});

test('una fitxa incompleta omple els buits amb la cau: cap petició i cap foto de Commons', async () => {
  const incompleta = { id: 'vilanova-de-prova', title: 'Vilanova de Prova', provincia: 'Alacant', created_at: '2026-08-01T08:00:00.000Z' };
  const { cauDeViquipedia } = await import('./cauDeViquipedia.js');
  await cauDeViquipedia().desa(clauDeViquipedia(incompleta), {
    estat: 'parcial', id: 'vilanova-de-prova', title: 'Vilanova de Prova', author: 'Gent de Vilanova de Prova',
    content: 'Vilanova de Prova és un municipi inventat per a les proves.', provincia: 'Alacant', comarca: 'L’Alcoià',
    population: '120 hab', lat: 38.6, lng: -0.4, wikidata_id: 'Q1', wikipedia_title: 'Vilanova de Prova',
    copyright: 'Text: Viquipèdia (CC BY-SA 4.0)',
    imatges: { hero: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/A.jpg/1920px-A.jpg', fitxer: 'A.jpg', amplada: 3000, alcada: 2000 }, avatar: null, reserva: null }
  });
  mocks.core = llavor([TOWNS[0], incompleta]);
  const { container } = render(<PoblesSection />);
  const targeta = () => targetes(container).find((t) => titol(t) === 'Vilanova de Prova');
  await waitFor(() => expect(targeta().querySelector('p.sp-card-text').textContent).toBe('Vilanova de Prova és un municipi inventat per a les proves.'));
  expect(targeta().textContent).toContain('L’Alcoià');
  expect(targeta().textContent).toContain('120 hab');
  expect(fetch).not.toHaveBeenCalled();
  expect(container.innerHTML).not.toContain('wikimedia.org/wikipedia');
  // La completa, intacta.
  expect(targetes(container).find((t) => titol(t) === TOWNS[0].title).querySelector('p.sp-card-text').textContent).toBe(TOWNS[0].content);
});
