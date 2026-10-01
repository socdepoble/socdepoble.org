/**
 * Ordre del Mestre, 261001 · L'anell de focus de la boina de les targetes.
 *
 * Troballa P2 de la revisió: en tema fosc l'anell dels controls de la boina
 * (.sp-card-header: la pastilla, ara un botó que porta al Calendari, el pin
 * i l'enllaç d'autoria) era --sdp-focus damunt de --sdp-accent, ≈1,26:1
 * (WCAG 2.4.7 i 1.4.11). La barra de pàgina ja ho tenia resolt (C15,
 * modules.css). jsdom no pinta l'anell: es comprova la regla escrita (mateix
 * patró que BarraTaronja.test.jsx) i que el selector casa amb el DOM de veres.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { UniversalCard } from './UniversalCard.jsx';

afterEach(cleanup);

const cssNet = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const moduls = cssNet('src/css/modules.css');

const C15 = /section\.bar-orange \.bar-actions :focus-visible \{ outline-color: (var\(--sdp-[a-z-]+\)); \}/;
const C15_DIALEG = /section\.bar-orange \.bar-actions dialog :focus-visible \{ outline-color: (var\(--sdp-[a-z-]+\)); \}/;
const BOINA = /\.sp-card-header :focus-visible \{ outline-color: (var\(--sdp-[a-z-]+\)); \}/;
const BOINA_DIALEG = /\.sp-card-header dialog :focus-visible \{ outline-color: (var\(--sdp-[a-z-]+\)); \}/;

/* La regla viu dins d'un bloc `@layer components {` encara obert (profunditat 1). */
const dinsDeComponents = (css, index) => {
  const abans = css.slice(0, index);
  const capa = abans.lastIndexOf('@layer components {');
  if (capa < 0) return false;
  const tram = abans.slice(capa);
  return tram.split('{').length - tram.split('}').length === 1;
};

test('la boina porta el mateix anell que la barra de pàgina (C15), al seu costat i dins de @layer components', () => {
  const c15 = moduls.match(C15);
  const c15Dialeg = moduls.match(C15_DIALEG);
  const boina = moduls.match(BOINA);
  const boinaDialeg = moduls.match(BOINA_DIALEG);
  expect([c15, c15Dialeg, boina, boinaDialeg].every(Boolean)).toBe(true);
  // El color del text de la barra, no el --sdp-focus de ≈1,26:1.
  expect(boina[1]).toBe(c15[1]);
  expect(boina[1]).toBe('var(--sdp-sobre-accent)');
  // Els <dialog> que hi nasquen tenen el fons del tema: l'anell de sempre, com a la C15.
  expect(boinaDialeg[1]).toBe(c15Dialeg[1]);
  // Al costat de la C15: just darrere, sense cap regla pel mig.
  const finalC15 = c15Dialeg.index + c15Dialeg[0].length;
  expect(moduls.slice(finalC15, boina.index).trim()).toBe('');
  expect(boinaDialeg.index).toBeGreaterThan(boina.index);
  expect(dinsDeComponents(moduls, boina.index)).toBe(true);
  expect(dinsDeComponents(moduls, boinaDialeg.index)).toBe(true);
  // Una sola regla de cada: cap còpia que la contradiga en un altre lloc del full.
  expect(moduls.split('.sp-card-header :focus-visible').length).toBe(2);
});

/* Troballa P2 de la segona revisió · L'enllaç d'autoria de la barra de PÀGINA
   és fill directe de section.bar-orange, germà de .bar-actions: la C15 no
   l'abastava i en fosc continuava a ≈1,26:1, mentre el mateix enllaç dins de
   la boina ja pintava l'anell bo. */
test('l’enllaç d’autoria de la barra de pàgina porta el mateix anell que el de la boina', () => {
  const autoria = moduls.match(/section\.bar-orange > \.sp-card-author-link:focus-visible \{ outline-color: (var\(--sdp-[a-z-]+\)); \}/);
  expect(autoria).not.toBeNull();
  expect(autoria[1]).toBe(moduls.match(BOINA)[1]);
  expect(dinsDeComponents(moduls, autoria.index)).toBe(true);
});

test('el selector casa amb els controls de veres de la boina (pastilla, pin i autoria), i no amb els del peu', () => {
  const { container } = render(
    <UniversalCard
      title="Mel de romer"
      author="Pepa"
      authorHref="/perfil/pepa"
      showPin
      onPin={() => {}}
      time="10:05"
      date="30/09/26"
      dateTime="2026-09-30T12:05:00+02:00"
      mainHref="/mercat/mel"
      hasFooter
      showShare
    />
  );
  const boina = container.querySelector('header.sp-card-header');
  const pastilla = boina.querySelector('button.btn-date-time');
  const pin = boina.querySelector('.btn-icon-orange');
  const autoria = boina.querySelector('a.sp-card-author-link');
  for (const control of [pastilla, pin, autoria]) {
    expect(control).not.toBeNull();
    expect(control.matches('.sp-card-header *')).toBe(true);
    expect(control.closest('dialog')).toBeNull();
  }
  // El peu té el seu anell (base.css, .sp-card-footer): la regla no l'abasta.
  const peu = container.querySelector('.sp-card-footer button');
  expect(peu).not.toBeNull();
  expect(peu.matches('.sp-card-header *')).toBe(false);
});
