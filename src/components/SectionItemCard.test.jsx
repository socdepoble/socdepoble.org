/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · SectionItemCard
 * accepta `authorHref` i el reenvia a UniversalCard: la boina enllaça a la
 * pàgina de qui signa. Sense la prop, el DOM de sempre (Llei del Píxel): una
 * targeta sense autor ni poble no porta boina.
 * Gauntlet 261016 (Bloc 3) · Des d'ara el directori (ProfileSection) porta el
 * poble de cada agent a la boina (`location`, amb el seu avatar), sense nom
 * d'autor ni enllaç: ho fixa ProfileSection.poble.test.jsx.
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
import { DEFAULT_AUTHOR } from './universal/UniversalUtils.js';

afterEach(cleanup);

const BASE = { to: '/gent/pepa', title: 'Pepa', subtitle: 'Forner', excerpt: 'Pa de llenya', image: '/assets/x.png' };

/* Onada 8 (261009) · La boina de Sóc de Poble és el seu perfil
   (DEFAULT_AUTHOR.href); una ruta vella /projecte també hi porta. */
test('amb authorHref, la boina és un enllaç a la pàgina de qui signa', () => {
  const { container } = render(<SectionItemCard {...BASE} author="Sóc de Poble" location="La Torre de les Maçanes" authorHref={DEFAULT_AUTHOR.href} />);
  const enllac = container.querySelector('header.sp-card-header a.sp-card-author-link');
  expect(enllac.getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
  expect(enllac.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  /* La boina, dalt de tot; la imatge, després (D-B). */
  const article = container.querySelector('article');
  expect(article.firstElementChild.className).toBe('sp-card-header');
});

test('Onada 8 · una ruta vella /projecte enllaça al perfil de Sóc de Poble', () => {
  const { container } = render(<SectionItemCard {...BASE} author="Sóc de Poble" authorHref="/projecte" />);
  expect(container.querySelector('a.sp-card-author-link').getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
});

/* Directiva de Dignitat Humana (pla 261015_1900) · La ranura `accio` és de les
   entitats (la persona no té «Anar al xat»): ací, la targeta d'una entitat del
   directori. La d'una persona (/gent/…) no porta categories (UniversalCard). */
const ENTITAT = { ...BASE, to: '/empresa/forn', title: 'Forn de la Plaça' };
test('Onada 8 · la ranura accio i les etiquetes passen a UniversalCard; sense, el DOM de sempre', () => {
  const ambAccio = render(<SectionItemCard {...ENTITAT} eyebrow="Entitat" accio={<button type="button">Anar al xat</button>} etiquetesAmbAccio />).container;
  const cos = ambAccio.querySelector('.sp-card-body');
  expect([...cos.children].map((fill) => fill.className).filter((c) => c.startsWith('sp-card-labels') || c === 'sp-card-accio'))
    .toEqual(['sp-card-labels', 'sp-card-accio']);
  cleanup();
  const sense = render(<SectionItemCard {...ENTITAT} eyebrow="Entitat" />).container.innerHTML;
  cleanup();
  expect(render(<SectionItemCard {...ENTITAT} eyebrow="Entitat" accio={null} etiquetesAmbAccio />).container.innerHTML).toBe(sense);
  cleanup();
  // La persona del directori: cap categoria, encara que en porte una.
  expect(render(<SectionItemCard {...BASE} eyebrow="Veïna" />).container.querySelector('.sp-card-labels')).toBeNull();
});

test('sense authorHref, la boina de sempre (sense enllaç), i sense autor, cap boina: el DOM no canvia', () => {
  const { container } = render(<SectionItemCard {...BASE} author="Pepa" />);
  expect(container.querySelector('a.sp-card-author-link')).toBeNull();
  expect(container.querySelector('span.sp-card-author-block')).not.toBeNull();
  const ambUndefined = render(<SectionItemCard {...BASE} author="Pepa" authorHref={undefined} />).container.innerHTML;
  expect(ambUndefined).toBe(container.innerHTML);
  cleanup();
  /* Sense autor ni poble (abans, «el directori»): cap boina. */
  const senseBoina = render(<SectionItemCard {...BASE} />).container;
  expect(senseBoina.querySelector('header.sp-card-header')).toBeNull();
  expect(senseBoina.querySelector('article').firstElementChild.className).toBe('sp-card-link-overlay');
});

test('una ruta que la frontera no admet no fa cap enllaç', () => {
  const { container } = render(<SectionItemCard {...BASE} author="Pepa" authorHref="//fora.example/perfil" />);
  expect(container.querySelector('a.sp-card-author-link')).toBeNull();
});
