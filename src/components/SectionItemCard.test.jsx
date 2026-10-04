/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · SectionItemCard
 * accepta `authorHref` i el reenvia a UniversalCard: la boina enllaça a la
 * pàgina de qui signa. Sense la prop, el DOM de sempre (Llei del Píxel): el
 * directori (ProfileSection), que no porta autor, no canvia.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('./universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import SectionItemCard from './SectionItemCard.jsx';

afterEach(cleanup);

const BASE = { to: '/gent/pepa', title: 'Pepa', subtitle: 'Forner', excerpt: 'Pa de llenya', image: '/assets/x.png' };

test('amb authorHref, la boina és un enllaç a la pàgina de qui signa', () => {
  const { container } = render(<SectionItemCard {...BASE} author="Sóc de Poble" location="La Torre de les Maçanes" authorHref="/projecte" />);
  const enllac = container.querySelector('header.sp-card-header a.sp-card-author-link');
  expect(enllac.getAttribute('href')).toBe('/projecte');
  expect(enllac.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  /* La boina, dalt de tot; la imatge, després (D-B). */
  const article = container.querySelector('article');
  expect(article.firstElementChild.className).toBe('sp-card-header');
});

test('sense authorHref, la boina de sempre (sense enllaç), i sense autor, cap boina: el DOM no canvia', () => {
  const { container } = render(<SectionItemCard {...BASE} author="Pepa" />);
  expect(container.querySelector('a.sp-card-author-link')).toBeNull();
  expect(container.querySelector('span.sp-card-author-block')).not.toBeNull();
  const ambUndefined = render(<SectionItemCard {...BASE} author="Pepa" authorHref={undefined} />).container.innerHTML;
  expect(ambUndefined).toBe(container.innerHTML);
  cleanup();
  const directori = render(<SectionItemCard {...BASE} />).container;
  expect(directori.querySelector('header.sp-card-header')).toBeNull();
  expect(directori.querySelector('article').firstElementChild.className).toBe('sp-card-link-overlay');
});

test('una ruta que la frontera no admet no fa cap enllaç', () => {
  const { container } = render(<SectionItemCard {...BASE} author="Pepa" authorHref="//fora.example/perfil" />);
  expect(container.querySelector('a.sp-card-author-link')).toBeNull();
});
