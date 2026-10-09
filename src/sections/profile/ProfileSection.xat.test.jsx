/**
 * Onada 8 (261009; requeriments, punt 4) · Les targetes d'entitat amb xat
 * propi: al directori (ProfileSection), la d'una entitat porta el botó gran
 * «Anar al xat», cap al xat comú de la seua pàgina (el de «Comentar · En
 * públic»), i conserva les seues etiquetes. Una persona o una IA no en
 * porten: el seu xat és el directe, «Comentar · En privat».
 */
import React from 'react';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));

import ProfileSection from './ProfileSection.jsx';
import { objecteDePerfil, rutaXatDePagina } from '../../config/navigation.js';

afterEach(cleanup);

const AGENTS = [
  { id: 'forn', name: 'Forn de la Plaça', type: 'COMPANY', role: 'Forn', tag: 'Comerç' },
  { id: 'pepa', name: 'Pepa', type: 'PERSON', role: 'Forner', tag: 'Veïna' },
  { id: 'iaia', name: 'IAIA MarIA', type: 'AI', role: 'Agent', tag: 'IA' }
];
const targeta = (arrel, nom) => [...arrel.querySelectorAll('article.sp-card')].find((a) => a.querySelector('.sp-card-title')?.textContent === nom);

test('l’entitat porta «Anar al xat» cap al seu xat comú, i les etiquetes es queden', () => {
  const { container } = render(<ProfileSection agents={AGENTS} />);
  const forn = targeta(container, 'Forn de la Plaça');
  const boto = within(forn).getByRole('link', { name: 'Anar al xat' });
  expect(boto.getAttribute('href')).toBe(rutaXatDePagina(objecteDePerfil({ tipus: 'entitat', id: 'forn', nom: 'Forn de la Plaça' })));
  expect(boto.getAttribute('href')).toMatch(/^\/xat\?sobre=entitat:forn&/);
  expect(boto.closest('.sp-card-accio')).not.toBeNull();
  expect([...forn.querySelectorAll('.sp-card-labels > li')].map((li) => li.textContent)).toEqual(['Comerç']);
});

test('una persona o una IA, cap botó: el DOM de sempre', () => {
  const { container } = render(<ProfileSection agents={AGENTS} />);
  for (const nom of ['Pepa', 'IAIA MarIA']) {
    const fitxa = targeta(container, nom);
    expect([nom, within(fitxa).queryByRole('link', { name: 'Anar al xat' })]).toEqual([nom, null]);
    expect([nom, fitxa.querySelector('.sp-card-accio')]).toEqual([nom, null]);
    expect([nom, fitxa.querySelectorAll('.sp-card-labels > li').length]).toEqual([nom, 1]);
  }
});
