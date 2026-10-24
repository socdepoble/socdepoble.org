// @vitest-environment node
/* T2 (261024; P0-18, DSA arts. 11 i 12) · Una sola adreça de contacte. Tota
   adreça de correu de l'Avís legal (el text que es pinta), dels textos de la
   moderació dels cinc diccionaris i de la seua reserva (textosModeracio.js),
   de «Informa d'un error» (informeDError.js) i de la que index.html porta per
   a qui no té JavaScript és CORREU_CONTACTE (config/contacte.js). Cada font
   ha de portar-ne almenys una: la prova no passa en buit. index.html només
   es llig. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { CORREU_CONTACTE } from './contacte.js';
import { legalContent } from '../sections/text/legalContent.js';
import { CORREU_DE_RESERVA, enllacDeCorreu } from '../sections/xat/informeDError.js';
import { TEXTOS_ERROR_MODERACIO, TEXTOS_MODERACIO } from '../components/PedraSeca/organismes/textosModeracio.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const RE_CORREU = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const correusDe = (text) => [...String(text).matchAll(RE_CORREU)].map((m) => m[0]);
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

describe('una sola adreça de contacte', () => {
  test('la font única és l’adreça pública del projecte', () => {
    expect(CORREU_CONTACTE).toBe('socdepoble@socdepoble.org');
    expect(correusDe(CORREU_CONTACTE)).toEqual([CORREU_CONTACTE]);
  });

  test('l’Avís legal: tota adreça i tot mailto: és la de contacte', () => {
    const correus = correusDe(legalContent.html);
    expect(correus.length).toBeGreaterThanOrEqual(5);
    expect(new Set(correus)).toEqual(new Set([CORREU_CONTACTE]));
    const mailtos = [...legalContent.html.matchAll(/href="mailto:([^"?]*)/g)].map((m) => m[1]);
    expect(mailtos.length).toBeGreaterThanOrEqual(5);
    expect(new Set(mailtos)).toEqual(new Set([CORREU_CONTACTE]));
  });

  test('els textos de la moderació, a les cinc llengües i a la reserva valenciana', () => {
    for (const llengua of LLENGUES) {
      const linies = llig(`src/config/idiomes/${llengua}.js`).split('\n').filter((l) => /^\s*'section\.moderacio\./.test(l));
      const correus = linies.flatMap(correusDe);
      expect(correus.length, llengua).toBeGreaterThanOrEqual(2);
      expect(new Set(correus), llengua).toEqual(new Set([CORREU_CONTACTE]));
    }
    const reserves = [...Object.values(TEXTOS_MODERACIO), ...Object.values(TEXTOS_ERROR_MODERACIO)].map(([, reserva]) => reserva);
    const correus = reserves.flatMap(correusDe);
    expect(correus.length).toBeGreaterThanOrEqual(2);
    expect(new Set(correus)).toEqual(new Set([CORREU_CONTACTE]));
    expect(new Set(correusDe(llig('src/components/PedraSeca/organismes/textosModeracio.js')))).toEqual(new Set([CORREU_CONTACTE]));
  });

  test('«Informa d’un error» envia a l’adreça de contacte i no en copia cap altra', () => {
    expect(CORREU_DE_RESERVA).toBe(CORREU_CONTACTE);
    expect(enllacDeCorreu('', '')).toBe(`mailto:${CORREU_CONTACTE}`);
    expect(correusDe(llig('src/sections/xat/informeDError.js'))).toEqual([]);
  });

  test('index.html (sense JavaScript) porta la mateixa adreça', () => {
    const correus = correusDe(llig('index.html'));
    expect(correus.length).toBeGreaterThanOrEqual(1);
    expect(new Set(correus)).toEqual(new Set([CORREU_CONTACTE]));
  });
});
