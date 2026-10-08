// @vitest-environment node
/* Neteja 261007 (prompt 261007_1628, peça D: Consola, només canvis píxel
   idèntics) · Els tons i els textos de les insígnies de la Consola tenen una
   sola font, grafMapa.js. Abans n'hi havia set còpies (TO_CONFIANCA a
   MapaConsola, FluxosMapa i EntradesEixides; TO_SEVERITAT a AvisosMapa;
   TO_ESTAT i TEXT_ESTAT a MapaConsola, CalendariMapa i XifresMas). Esta prova
   fixa tres coses: els valors són els que es pintaven abans (la Llei del
   Píxel), cobrixen tot el vocabulari tancat del contracte (contracteMapa.js) i
   cap fitxer de la Consola no en torna a fer una còpia. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { CONFIANCES, ESTATS_TASCA, SEVERITATS } from './contracteMapa.js';
import { TEXT_ESTAT, TO_CONFIANCA, TO_ESTAT, TO_SEVERITAT } from './grafMapa.js';

/* Les còpies d'abans, tal com eren: el que es pintava. */
const ABANS = Object.freeze({
  confianca: { declarat: 'info', derivat: 'neutre', inferit: 'avis' },
  severitat: { alta: 'error', mitjana: 'avis', baixa: 'info' },
  estat: {
    viu: 'exit', mort: 'error', 'declarat-sense-llancador': 'neutre',
    'llancador-sense-declaracio': 'avis', desconegut: 'neutre'
  },
  text: {
    viu: 'viu', mort: 'mort', 'declarat-sense-llancador': 'sense llançador',
    'llancador-sense-declaracio': 'sense declaració', desconegut: 'desconegut'
  }
});
const TONS_INSIGNIA = ['neutre', 'info', 'exit', 'avis', 'error'];

describe('una sola font per als tons de la Consola', () => {
  test('els valors són els que es pintaven abans', () => {
    expect(TO_CONFIANCA).toEqual(ABANS.confianca);
    expect(TO_SEVERITAT).toEqual(ABANS.severitat);
    expect(TO_ESTAT).toEqual(ABANS.estat);
    expect(TEXT_ESTAT).toEqual(ABANS.text);
  });

  test('cobrixen tot el vocabulari del contracte, i res més', () => {
    expect(Object.keys(TO_CONFIANCA).sort()).toEqual([...CONFIANCES].sort());
    expect(Object.keys(TO_SEVERITAT).sort()).toEqual([...SEVERITATS].sort());
    expect(Object.keys(TO_ESTAT).sort()).toEqual([...ESTATS_TASCA].sort());
    expect(Object.keys(TEXT_ESTAT).sort()).toEqual([...ESTATS_TASCA].sort());
    for (const to of [TO_CONFIANCA, TO_SEVERITAT, TO_ESTAT].flatMap(Object.values)) {
      expect(TONS_INSIGNIA, to).toContain(to);
    }
  });

  test('són immutables', () => {
    for (const taula of [TO_CONFIANCA, TO_SEVERITAT, TO_ESTAT, TEXT_ESTAT]) expect(Object.isFrozen(taula)).toBe(true);
  });

  /* Una taula nova amb el mateix nom fora de grafMapa.js és una còpia. Només
     val la que en compon una a partir de la compartida (el N/A de les
     mètriques de XifresMas.jsx). */
  test('cap fitxer de la Consola no en fa una còpia', () => {
    const ARREL = path.join(process.cwd(), 'src/sections/consola');
    const fitxers = readdirSync(ARREL, { recursive: true })
      .map(String)
      .filter((f) => /\.(?:js|jsx)$/.test(f) && !/\.test\./.test(f) && path.basename(f) !== 'grafMapa.js');
    expect(fitxers.length).toBeGreaterThan(20);
    const copia = /const (?:TO_CONFIANCA|TO_SEVERITAT|TO_ESTAT|TEXT_ESTAT) = Object\.freeze\(\{(?!\s*\.\.\.)/;
    const copies = fitxers.filter((f) => copia.test(readFileSync(path.join(ARREL, f), 'utf8')));
    expect(copies).toEqual([]);
  });
});
