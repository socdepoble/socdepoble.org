/* v1.2.17 · Gauntlet R1 (L1-03, L1-08) · La benvinguda del Foraster (IDEA-313) al seu full diferit
   (src/css/diferit-acollida-foraster.css). jsdom no resol la cascada ni fa disposició: es comproven
   les regles del full, com XatSection.acces.capes.test.js, i es munta la targeta viva per a saber que
   els selectors casen de veres amb algun element (un selector sense cap element no guarda cap píxel).
   L1-03 · Mode Sènior, coherent amb B11b de diferit-mode-senior.css (l'accés del Xat) per a l'«Entrar» de
   56 px amb la lletra dels botons Sènior; les dues línies porten l'escala de la prosa Sènior pròpia de la
   targeta (IDEA-323.3, v1.2.22: l'accés ja no té cap paràgraf).
   L1-08 · Pedra Seca: cap ombra (la vora ja separa), títol a 1.2, línies a 1.6 i el botó centrat i de
   48 px. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { AcollidaForasterXat } from './AcollidaForasterXat.jsx';
import { desaBenvingudaForasterTancada } from './acollidaForasterXatModel.js';

const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const llig = (cami) => senseComentaris(readFileSync(resolve(process.cwd(), cami), 'utf8'));
const full = llig('src/css/diferit-acollida-foraster.css');
const senior = llig('src/css/diferit-mode-senior.css');
const tokens = llig('src/css/tokens.css');
const net = (text) => text.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();

/** Els selectors d'una llista separats per les comes de primer nivell (no les de dins de :is()). */
function separaSelectors(text) {
  const trossos = [];
  let fondaria = 0;
  let actual = '';
  for (const caracter of text) {
    if (caracter === '(') fondaria += 1;
    else if (caracter === ')') fondaria -= 1;
    if (caracter === ',' && fondaria === 0) {
      trossos.push(net(actual));
      actual = '';
    } else actual += caracter;
  }
  trossos.push(net(actual));
  return trossos.filter(Boolean);
}

/** Cada regla del full: { selectors, declaracions } (les de dins de @layer i @media també). */
function regles(text) {
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selectors: separaSelectors(m[1].split(';').pop()),
    declaracions: m[2].split(';').map((d) => d.split(':')).filter(([prop]) => net(prop || ''))
      .map(([prop, ...resta]) => [net(prop), net(resta.join(':'))])
  }));
}

/** El valor d'una propietat a les regles d'un selector exacte (l'última guanya). */
function valor(selector, propietat, text = full) {
  let trobat = null;
  for (const regla of regles(text)) {
    if (!regla.selectors.includes(net(selector))) continue;
    for (const [prop, val] of regla.declaracions) if (prop === propietat) trobat = val;
  }
  return trobat;
}

const SENIOR = ':is(:root[data-sdp-senior="true"], :host([data-sdp-senior="true"]), .sdp-root[data-sdp-senior="true"])';
const ENTRAR_SENIOR = `${SENIOR} .sdp-foraster-xat__entrar`;
const TEXT_SENIOR = `${SENIOR} .sdp-foraster-xat__text`;
const LLETRA_BOTO_SENIOR = 'clamp(1.0625rem, 1.02rem + 0.25vw, 1.1875rem)';
const LLETRA_PROSA_SENIOR = 'clamp(1.25rem, 1.18rem + 0.35vw, 1.4375rem)';

beforeEach(() => { desaBenvingudaForasterTancada(false); });
afterEach(() => { cleanup(); desaBenvingudaForasterTancada(false); });

test('L1-08 · Pedra Seca: cap ombra a la targeta (la vora ja separa), títol a 1.2 i línies a 1.6', () => {
  expect(valor('.sdp-foraster-xat', 'box-shadow')).toBeNull();
  expect(full).not.toMatch(/box-shadow/);
  expect(valor('.sdp-foraster-xat', 'border')).toBe('1px solid var(--sdp-vora)');
  expect(valor('.sdp-foraster-xat__titol', 'line-height')).toBe('1.2');
  expect(valor('.sdp-foraster-xat__text', 'line-height')).toBe('1.6');
  /* El text, a l'inici. */
  expect(valor('.sdp-foraster-xat__titol', 'text-align')).toBe('start');
  expect(valor('.sdp-foraster-xat__text', 'text-align')).toBe('start');
});

test('L1-08 · l’«Entrar» continua centrat i de 48 px', () => {
  expect(valor('.sdp-foraster-xat__accions', 'display')).toBe('flex');
  expect(valor('.sdp-foraster-xat__accions', 'justify-content')).toBe('center');
  expect(valor('.sdp-foraster-xat__entrar', 'min-height')).toBe('var(--sdp-touch)');
  expect(valor('.sdp-foraster-xat__entrar', 'text-align')).toBe('center');
  expect(valor('.sdp-foraster-xat__entrar', 'justify-content')).toBe('center');
  expect(valor(':root', '--sdp-touch', tokens)).toBe('48px');
});

test('L1-03 · en Sènior, l’«Entrar» va a 56 px amb la lletra dels botons Sènior i les línies amb la de la prosa', () => {
  expect(valor(ENTRAR_SENIOR, 'min-height')).toBe('3.5rem');
  expect(valor(ENTRAR_SENIOR, 'font-size')).toBe(LLETRA_BOTO_SENIOR);
  expect(valor(TEXT_SENIOR, 'font-size')).toBe(LLETRA_PROSA_SENIOR);
  expect(valor(TEXT_SENIOR, 'line-height')).toBe('1.65');
});

/* v1.2.22 · IDEA-323.3 (Gauntlet R1, L1-04) · Fora senseBlocEstret: l'accés ja no té cap paràgraf de benvinguda que el
   bloc ≤ 359 px repetisca, i el full Sènior no en conserva cap regla en cap bloc. */
test('L1-03 · les píndoles de l’accés amb els mateixos valors Sènior que l’«Entrar» de la targeta, i cap regla per a un paràgraf de l’accés', () => {
  /* B11b · IDEA-323.3 (v1.2.22, ordre del Mestre del 261122) · L'accés ja no porta la benvinguda: l'única és la
     d'esta targeta (TEXT_SENIOR), i el full Sènior no en conserva cap regla. */
  expect(senior).not.toContain('.sdp-xat-acces > p');
  /* Les píndoles de l'accés («Entrar», «Registrar-se») dins de la regla de les dianes Sènior. */
  const pindoles = regles(senior).find((regla) => regla.selectors.some((s) => s.startsWith(SENIOR) && s.includes('.sdp-xat-acces .sdp-xat-pindola')));
  expect(pindoles).toBeTruthy();
  const dePindola = Object.fromEntries(pindoles.declaracions);
  expect(dePindola['min-height']).toBe(valor(ENTRAR_SENIOR, 'min-height'));
  expect(dePindola['font-size']).toBe(valor(ENTRAR_SENIOR, 'font-size'));
});

test('L1-03 · sense Sènior, cap píxel: les regles de base no canvien i les Sènior porten totes el selector de les tres arrels', () => {
  expect(valor('.sdp-foraster-xat__entrar', 'font-size')).toBe('var(--sdp-text-small)');
  expect(valor('.sdp-foraster-xat__text', 'font-size')).toBe('var(--sdp-text-small)');
  const ambSenior = regles(full).flatMap((regla) => regla.selectors).filter((s) => s.includes('data-sdp-senior'));
  expect(ambSenior.sort()).toEqual([ENTRAR_SENIOR, TEXT_SENIOR].map(net).sort());
});

test('al DOM viu, cada classe del full casa amb un element de la targeta i les regles Sènior només amb l’arrel Sènior', () => {
  const { unmount } = render(createElement('div', { className: 'sdp-root', 'data-sdp-senior': 'true' }, createElement(AcollidaForasterXat, { idioma: 'ca', onNavega: () => {} })));
  const classes = new Set(full.match(/\.sdp-foraster-xat[\w-]*/g));
  expect(classes.size).toBeGreaterThan(0);
  for (const classe of classes) expect(document.querySelectorAll(classe).length, classe).toBeGreaterThan(0);
  const entrar = screen.getByRole('button', { name: 'Entrar' });
  expect(entrar.matches(ENTRAR_SENIOR)).toBe(true);
  const linies = [...document.querySelectorAll('.sdp-foraster-xat p')];
  expect(linies).toHaveLength(2);
  for (const linia of linies) expect(linia.matches(TEXT_SENIOR)).toBe(true);
  unmount();
  /* Sense l'atribut Sènior, cap de les dues regles no hi casa. */
  render(createElement('div', { className: 'sdp-root' }, createElement(AcollidaForasterXat, { idioma: 'ca', onNavega: () => {} })));
  expect(screen.getByRole('button', { name: 'Entrar' }).matches(ENTRAR_SENIOR)).toBe(false);
  for (const linia of document.querySelectorAll('.sdp-foraster-xat p')) expect(linia.matches(TEXT_SENIOR)).toBe(false);
});
