/**
 * T2 (prompt 1140, ordre del Mestre, 261001) · «Pobles mutilat»: les targetes
 * de /pobles pinten l'avatar del poble i la pastilla de data i hora sencera.
 *
 * Abans la pastilla llegia `dynamic_time` i `dynamic_date`, camps que no
 * escriu cap codi: la targeta eixia sense pastilla. Ara és la regla de Pedra
 * Seca §10 (editorial.js · dataDElement): la data de creació del poble, o la
 * de l'última versió si és posterior. Les proves s'executen a Europe/Madrid
 * (vite.config.js), i per això les hores literals són les de València.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams('')],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));

import PoblesSection from './PoblesSection.jsx';
import { TOWNS } from './townsContent.js';
import { dataDElement } from '../../components/universal/editorial.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

const llavor = (towns) => ({ status: 'ready', error: null, sortedTowns: towns });
const targetes = (arrel) => [...arrel.querySelectorAll('article.sp-card')];
const titol = (targeta) => targeta.querySelector('.sp-card-title').textContent;
const pastilla = (targeta) => {
  const control = targeta.querySelector('.sp-card-meta .btn-date-time');
  return control ? [...control.querySelectorAll('span')].map((s) => s.textContent) : null;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.core = llavor(TOWNS);
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('T2 · cada poble de la llavor porta el seu avatar i la pastilla sencera (hora i dia)', () => {
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista).toHaveLength(TOWNS.length);
  for (const targeta of llista) {
    const town = TOWNS.find((t) => t.title === titol(targeta));
    expect(targeta.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src')).toBe(town.avatar_url);
    const { time, date } = dataDElement(town);
    expect(time).toMatch(/^\d{2}:\d{2}$/);
    expect(date).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
    expect(pastilla(targeta)).toEqual([time, date]);
  }
});

test('T2 · la pastilla diu la data de creació en hora local i porta al Calendari d’eixe mes', () => {
  render(<PoblesSection />);
  // La Torre: created_at «2026-08-20T08:00:00.000Z» → 10:00 a València.
  const boto = screen.getByRole('button', { name: '10:00 20/08/26 · Obri el calendari d’eixe mes' });
  boto.click();
  expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-08');
});

test('T2 · l’ordre ix de la mateixa data que la pastilla: de la més nova a la més vella', () => {
  const { container } = render(<PoblesSection />);
  expect(targetes(container).map(titol)).toEqual([
    'La Torre de les Maçanes', 'Xixona', 'Tibi', 'Alcoleja', 'Relleu', 'Orxeta', 'Sella', 'Penàguila', 'Benifallim'
  ]);
});

test('T2 · una versió posterior guanya a la creació; sense cap data real, cap pastilla inventada i al final', () => {
  mocks.core = llavor([
    { id: 'sense', title: 'Sense data', comarca: 'Enlloc', content: '.' },
    { id: 'vell', title: 'Vell', comarca: 'L’Alcoià', content: '.', created_at: '2026-08-01T08:00:00Z', updated_at: '2026-09-30T16:45:00Z' },
    { id: 'nou', title: 'Nou', comarca: 'L’Alcoià', content: '.', created_at: '2026-09-01T08:00:00Z' }
  ]);
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista.map(titol)).toEqual(['Vell', 'Nou', 'Sense data']);
  expect(pastilla(llista[0])).toEqual(['18:45', '30/09/26']);
  expect(pastilla(llista[1])).toEqual(['10:00', '01/09/26']);
  expect(pastilla(llista[2])).toBeNull();
  expect(llista[2].textContent).not.toMatch(/--/);
});

test('T2 · un poble remot sense avatar_url pinta la seua imatge com a avatar; sense cap imatge, el cercle de reserva', () => {
  mocks.core = llavor([
    { id: 'remot', title: 'Remot', comarca: 'La Marina', content: '.', image_url: '/assets/towns/sella/1.jpg', created_at: '2026-09-01T08:00:00Z' },
    { id: 'nu', title: 'Nu', comarca: 'La Marina', content: '.', created_at: '2026-08-01T08:00:00Z' }
  ]);
  const { container } = render(<PoblesSection />);
  const [remot, nu] = targetes(container);
  expect(remot.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src')).toBe('/assets/towns/sella/1.jpg');
  expect(nu.querySelector('.sp-card-author img')).toBeNull();
  expect(nu.querySelector('.sp-card-author .sp-card-avatar--fallback')).not.toBeNull();
});

test('T2 · incrustat en un amfitrió, l’avatar del poble penja del paquet (resolRecursPropi)', () => {
  fixaBaseRecursos('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist');
  mocks.core = llavor([TOWNS.find((t) => t.id === 'sella')]);
  const { container } = render(<PoblesSection />);
  expect(container.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src'))
    .toBe('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist/assets/towns/sella/2.jpg');
});
