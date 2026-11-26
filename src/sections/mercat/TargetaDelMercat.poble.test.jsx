/**
 * R22 (Llibre Mestre, «4a Etiqueta Geogràfica Final») · La targeta del Mercat
 * pinta la pastilla del poble com a última etiqueta, amb un enllaç a
 * /pobles/<slug>, a partir de les fitxes de /pobles del proveïdor de contingut.
 * Dades sintètiques.
 * C26-2 (v1.2.26) · Canvi intencionat, IDEA-365 (21:40, regla 1: «un producte del /mercat que
 * també ix al /mur porta Mur + Mercat»): mentre el Mur mostre productes, la primera pastilla és
 * «Mur», davant de «Mercat». El poble continua sent l'última. La mateixa llista pinta la Card del
 * Mur i la UniversalPage (TargetaDelMur.paritatProducte.v1226.test.jsx).
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ towns: [] }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: mocks.towns }) }));

import { TargetaDelMercat } from './TargetaDelMercat.jsx';

const OLI = {
  id: 'oli-sintetic', type: 'product', title: 'Oli sintètic', category_slug: 'alimentacio', tag: 'oli-verge-extra',
  author_name: 'Venedora sintètica', poble_id: 'la-torre-de-les-macanes'
};

afterEach(cleanup);
beforeEach(() => { mocks.towns = []; });

test('l’última etiqueta de la targeta és el poble, enllaçat a la seua pàgina', () => {
  mocks.towns = [{ id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', etiqueta_curta_poble: 'La Torre' }];
  const { container } = render(<TargetaDelMercat item={OLI} />);
  const etiquetes = [...container.querySelectorAll('li.sp-card-label')];
  expect(etiquetes.map((li) => li.textContent)).toEqual(['Mur', 'Mercat', 'Alimentació', 'Oli Verge Extra', 'La Torre']);
  const enllac = etiquetes.at(-1).querySelector('a');
  expect(enllac.getAttribute('href')).toBe('/pobles/la-torre-de-les-macanes');
  expect(enllac.textContent).toBe('La Torre');
});

test('sense cap fitxa de poble, les etiquetes de sempre', () => {
  const { container } = render(<TargetaDelMercat item={OLI} />);
  expect([...container.querySelectorAll('li.sp-card-label')].map((li) => li.textContent)).toEqual(['Mur', 'Mercat', 'Alimentació', 'Oli Verge Extra']);
});
