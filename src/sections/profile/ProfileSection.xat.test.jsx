/**
 * Onada 8 + R21.5 (PS-07) · Les targetes d'entitat amb xat propi: al directori
 * (ProfileSection), la d'una entitat porta el botó secundari «Anar al xat»
 * (mai primari blau repetit en graella), cap al xat comú de la seua pàgina,
 * i conserva les seues etiquetes. Una persona no porta botó ni etiquetes
 * (Dignitat Humana), i les IA queden fora del directori de Gent i Entitats.
 */
import React from 'react';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => React.useState(() => new URLSearchParams()),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));

import ProfileSection from './ProfileSection.jsx';
import { objecteDePerfil, rutaXatDePagina } from '../../config/navigation.js';

afterEach(cleanup);

const AGENTS = [
  { id: 'forn', name: 'Forn de la Plaça', type: 'COMPANY', role: 'Forn', tag: 'Comerç' },
  { id: 'pepa', name: 'Pepa', type: 'PERSON', role: 'Fornera', tag: 'Veïna' },
  { id: 'iaia', name: 'IAIA MarIA', type: 'AI', role: 'Matriarca', tag: 'IA' }
];
const targeta = (arrel, nom) => [...arrel.querySelectorAll('article.sp-card')].find((a) => a.querySelector('.sp-card-title')?.textContent === nom);

test('l’entitat porta «Anar al xat» en varietat secundària (PS-07) cap al seu xat comú, i les etiquetes es queden', () => {
  const { container } = render(<ProfileSection agents={AGENTS} />);
  const forn = targeta(container, 'Forn de la Plaça');
  const boto = within(forn).getByRole('link', { name: 'Anar al xat' });
  expect(boto.getAttribute('href')).toBe(rutaXatDePagina(objecteDePerfil({ tipus: 'entitat', id: 'forn', nom: 'Forn de la Plaça' })));
  expect(boto.getAttribute('href')).toMatch(/^\/xat\?sobre=entitat:forn&/);
  expect(boto.closest('.sp-card-accio')).not.toBeNull();
  expect(boto.classList.contains('sdp-boto--secundari')).toBe(true);
  expect(boto.classList.contains('sdp-boto--primari')).toBe(false);
  expect([...forn.querySelectorAll('.sp-card-labels > li')].map((li) => li.textContent)).toEqual(['Comerç']);
});

test('una persona no porta botó ni categories (Dignitat Humana), i una IA no ix al directori de Gent i Entitats', () => {
  const { container } = render(<ProfileSection agents={AGENTS} />);
  const pepa = targeta(container, 'Pepa');
  expect(within(pepa).queryByRole('link', { name: 'Anar al xat' })).toBeNull();
  expect(pepa.querySelector('.sp-card-accio')).toBeNull();
  expect(pepa.querySelector('.sp-card-labels')).toBeNull();
  expect(targeta(container, 'IAIA MarIA')).toBeUndefined();
});
