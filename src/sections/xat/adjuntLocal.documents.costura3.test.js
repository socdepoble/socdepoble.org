/* v1.2.25 · Costura 3a (Claude, K-COSTURA3A, rebasada sobre l'adjuntLocal.js de G9 i K-G9-ADJUNT) · Els codis de
   documents de C1 ('document-format' i 'document-mida', a ERRORS_ADJUNT_XAT de src/data/xatMultimedia.js) tenen clau
   a CLAUS_ERROR_ADJUNT i text als cinc diccionaris canònics: textDErrorAdjunt ja no els desvia al diccionari paral·lel
   (i18nVistesXatV1225.js). 'document-contingut' només el llança la preparació local de G1 (preparaDocument): no és del
   motor de C1 i continua fora de la paritat. La safata (ControlsAdjunt.jsx, costura 3b) queda fora d'esta costura. */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { CLAUS_ERROR_ADJUNT, preparaDocument, textDErrorAdjunt } from './adjuntLocal.js';
import { textXatV1225 } from './i18nVistesXatV1225.js';
import { ERRORS_ADJUNT_XAT } from '../../data/xatMultimedia.js';
import ca from '../../config/idiomes/ca.js';
import es from '../../config/idiomes/es.js';
import en from '../../config/idiomes/en.js';
import eu from '../../config/idiomes/eu.js';
import gl from '../../config/idiomes/gl.js';

const DICCIONARIS = { ca, es, en, eu, gl };
const CLAUS = {
  'document-format': 'section.xat.adjunts.error.documentFormat',
  'document-mida': 'section.xat.adjunts.error.documentMida'
};

describe('v1.2.25 · Costura 3a · errors dels documents del xat en les cinc llengües', () => {
  test('els dos codis de C1 tenen la seua clau a CLAUS_ERROR_ADJUNT i el seu text a ERRORS_ADJUNT_XAT', () => {
    for (const [codi, clau] of Object.entries(CLAUS)) {
      expect(CLAUS_ERROR_ADJUNT[codi], codi).toBe(clau);
      expect(typeof ERRORS_ADJUNT_XAT[codi], codi).toBe('string');
    }
  });

  test.each(Object.keys(DICCIONARIS))('%s: les dues claus tenen text propi; el valencià és el d’ERRORS_ADJUNT_XAT', (llengua) => {
    const dicc = DICCIONARIS[llengua];
    for (const [codi, clau] of Object.entries(CLAUS)) {
      expect(typeof dicc[clau], `${llengua} · ${clau}`).toBe('string');
      expect(dicc[clau].trim().length, `${llengua} · ${clau}`).toBeGreaterThan(10);
      if (llengua === 'ca') expect(dicc[clau]).toBe(ERRORS_ADJUNT_XAT[codi]);
      else expect(dicc[clau], `${llengua} · ${clau} no pot ser el valencià`).not.toBe(ca[clau]);
    }
    expect(dicc[CLAUS['document-format']]).toMatch(/PDF.*TXT.*CSV.*ODT.*DOCX/);
    expect(dicc[CLAUS['document-mida']]).toContain('10 MB');
  });

  test.each(Object.keys(DICCIONARIS))('%s: cada clau és una sola vegada al diccionari (cap duplicat que el darrer valor tape)', (llengua) => {
    const font = readFileSync(`${process.cwd()}/src/config/idiomes/${llengua}.js`, 'utf8');
    for (const clau of Object.values(CLAUS)) expect([llengua, clau, font.split(`'${clau}':`).length - 1]).toEqual([llengua, clau, 1]);
  });

  test('textDErrorAdjunt tradueix els dos codis pel diccionari canònic de cada llengua, no pel diccionari paral·lel', () => {
    for (const [llengua, dicc] of Object.entries(DICCIONARIS)) {
      const t = (clau, reserva) => dicc[clau] ?? reserva;
      for (const [codi, clau] of Object.entries(CLAUS)) {
        const text = textDErrorAdjunt({ code: codi, message: 'cru' }, t, 'reserva', llengua);
        expect(text, `${llengua} · ${codi}`).toBe(dicc[clau]);
        expect(text, `${llengua} · ${codi}`).not.toBe(textXatV1225(llengua, codi === 'document-format' ? 'documents.errorFormat' : 'documents.errorMida'));
      }
    }
  });

  test('sense traductor que tinga la clau, la reserva és el text valencià de C1 (mai el missatge cru ni la clau)', () => {
    const t = (_clau, reserva) => reserva;
    for (const codi of Object.keys(CLAUS)) {
      expect(textDErrorAdjunt({ code: codi, message: 'cru' }, t, 'reserva', 'en')).toBe(ERRORS_ADJUNT_XAT[codi]);
    }
  });

  test("'document-contingut' (preparació local de G1) continua traduït pel diccionari paral·lel i fora de la paritat amb el motor de C1", () => {
    expect(Object.hasOwn(CLAUS_ERROR_ADJUNT, 'document-contingut')).toBe(false);
    expect(Object.hasOwn(ERRORS_ADJUNT_XAT, 'document-contingut')).toBe(false);
    const t = (_clau, reserva) => reserva;
    for (const llengua of Object.keys(DICCIONARIS)) {
      const text = textDErrorAdjunt({ code: 'document-contingut', message: 'cru' }, t, 'reserva', llengua);
      expect(text, llengua).toBe(textXatV1225(llengua, 'documents.errorContingut'));
      expect(text, llengua).not.toBe('cru');
    }
  });

  test('la preparació local de G1 llança document-format i document-mida, i la interfície els diu en cada llengua', async () => {
    const exe = new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00])], 'programa.exe', { type: 'application/octet-stream' });
    const gran = new File([new Uint8Array(10_000_001)], 'gran.pdf', { type: 'application/pdf' });
    for (const [fitxer, codi] of [[exe, 'document-format'], [gran, 'document-mida']]) {
      const error = await preparaDocument(fitxer).then(() => null, (e) => e);
      expect(error, codi).toMatchObject({ code: codi });
      for (const [llengua, dicc] of Object.entries(DICCIONARIS)) {
        const t = (clau, reserva) => dicc[clau] ?? reserva;
        expect(textDErrorAdjunt(error, t, 'reserva', llengua), `${llengua} · ${codi}`).toBe(dicc[CLAUS[codi]]);
      }
    }
  });
});
