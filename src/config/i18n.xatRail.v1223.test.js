// @vitest-environment node
/* v1.2.23 · Carril T (ordre del Mestre 261123) · Verificador de K3 · El peu del rail del Xat amb sessió és el
   selector d'identitat (IDEA-327 v2, ClosCaXat.jsx: t('section.xat.rail.ambQuiActues', '{nom}: Amb qui actues?')
   amb .replace('{nom}', …)). Cap prova fixava el text en anglés, i la crònica i el changelog en diuen la forma
   «{nom}: Who are you acting as?». Ací es fixa en les cinc llengües, amb el traductor de veres en anglés (el
   diccionari carregat per tests/helpers/diccionaris.js), i que la clau del menú que ha eixit
   (section.xat.rail.tancaMenu, sense consumidor) no torna a cap diccionari. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import '../../tests/helpers/diccionaris.js';
import { createTranslator } from './i18n.js';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';

const CLAU = 'section.xat.rail.ambQuiActues';
const ESPERAT = Object.freeze({
  ca: '{nom}: Amb qui actues?',
  es: '{nom}: ¿Con quién actúas?',
  en: '{nom}: Who are you acting as?',
  eu: '{nom}: Norekin ari zara?',
  gl: '{nom}: Con quen actúas?',
});
const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });

describe('v1.2.23 · el selector d’identitat del peu del rail del Xat', () => {
  test('en anglés: «{nom}: Who are you acting as?», també pel traductor de veres i amb el nom posat', () => {
    expect(EN[CLAU]).toBe('{nom}: Who are you acting as?');
    const t = createTranslator('en');
    expect(t(CLAU, '{nom}: Amb qui actues?')).toBe('{nom}: Who are you acting as?');
    expect(t(CLAU, '{nom}: Amb qui actues?').replace('{nom}', 'Javi')).toBe('Javi: Who are you acting as?');
  });

  test.each(Object.keys(ESPERAT))('%s: el text exacte, amb un sol {nom} al principi', (llengua) => {
    expect(DICCIONARIS[llengua][CLAU]).toBe(ESPERAT[llengua]);
    expect(DICCIONARIS[llengua][CLAU].match(/\{\w+\}/g)).toEqual(['{nom}']);
  });

  test('la reserva valenciana del consumidor (ClosCaXat.jsx) és el valor de ca.js', () => {
    const font = readFileSync(path.join(process.cwd(), 'src/sections/xat/components/ClosCaXat.jsx'), 'utf8');
    expect(font).toContain(`t('${CLAU}', '${ESPERAT.ca}')`);
  });

  test('section.xat.rail.tancaMenu ha eixit dels cinc diccionaris (sense consumidor)', () => {
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      expect(Object.hasOwn(dic, 'section.xat.rail.tancaMenu'), llengua).toBe(false);
    }
  });
});
