/* Fase visual del calendari (prompt 261001_0445) · La classe de color d'un acte
   segons la seua font: llista blanca, i la resta com una publicació. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { classeDeFont } from './disposicioCalendari.js';

test.each([
  ['esdeveniment', 'sdp-cal-font--esdeveniment'],
  ['publicacio', 'sdp-cal-font--publicacio'],
  ['producte', 'sdp-cal-font--producte'],
  ['pagina', 'sdp-cal-font--pagina'],
  ['agenda', 'sdp-cal-font--agenda'],
  ['poble', 'sdp-cal-font--publicacio'],
  ['nota', 'sdp-cal-font--publicacio'],
  ['gcal', 'sdp-cal-font--publicacio'],
  ['<script>', 'sdp-cal-font--publicacio']
])('font %s → %s', (tipus, classe) => {
  expect(classeDeFont({ font: { tipus } })).toBe(classe);
});

test('sense font, o sense esdeveniment, es pinta com una publicació', () => {
  expect(classeDeFont({})).toBe('sdp-cal-font--publicacio');
  expect(classeDeFont(null)).toBe('sdp-cal-font--publicacio');
});

test('cada classe que pot eixir té regla al bloc SDP:calendari-vistes de modules.css', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
  for (const tipus of ['esdeveniment', 'publicacio', 'producte', 'pagina', 'agenda']) {
    expect(css).toMatch(new RegExp(`\\.sdp-cal-font--${tipus}\\s*\\{[^}]*--sdp-cal-bloc-fons:`));
  }
});
