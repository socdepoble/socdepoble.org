// @vitest-environment node
/* Fase E (261020, tasca 2; pla 261020_2045 «El Comú») · Les claus
   section.comu.*: cada una té valor propi, no buit, a les cinc llengües (la
   paritat de LLEI_07), amb els mateixos buits ({nom}, {import}…) que el
   valencià; el valor valencià és la reserva de textosComu.js; i tota clau que
   la peça demana pel nom (estats, filtres, modes, columnes i errors) existix.
   Com a i18n.moderacio.test.js, les claus es lligen del text de la font. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import '../../tests/helpers/diccionaris.js';
import { SUPPORTED_LANGUAGES, createTranslator } from './i18n.js';
import { TEXTOS_COMU, camelDe, parellComu, parellDError } from '../components/PedraSeca/UniversalListCard/textosComu.js';
import { CODIS_COMU, MODES_COMU } from '../components/PedraSeca/UniversalListCard/nucliComu.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const LLENGUES = SUPPORTED_LANGUAGES.map((llengua) => llengua.code);
const buitsDe = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function clausPerLlengua() {
  const resultat = {};
  for (const l of LLENGUES) {
    const claus = new Map();
    for (const m of llig(`src/config/idiomes/${l}.js`).matchAll(/^\s*'(section\.comu\.[\w.]+)'\s*:\s*(['"])(.*)\2,?\s*$/gm)) {
      expect(claus.has(m[1]), `${l}: ${m[1]} duplicada`).toBe(false);
      claus.set(m[1], m[3]);
    }
    resultat[l] = claus;
  }
  return resultat;
}

const PARELLS = Object.values(TEXTOS_COMU);
const PER_LLENGUA = clausPerLlengua();

describe('section.comu.* · paritat a les cinc llengües', () => {
  test('les cinc llengües hi són i totes porten les mateixes claus que textosComu.js', () => {
    expect(LLENGUES).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    const claus = PARELLS.map(([clau]) => clau).sort();
    expect(claus.length).toBeGreaterThan(200);
    for (const l of LLENGUES) expect([...PER_LLENGUA[l].keys()].sort(), l).toEqual(claus);
  });

  test('cap valor buit, els mateixos buits que el valencià i la reserva és el valor valencià', () => {
    for (const [clau, reserva] of PARELLS) {
      expect(PER_LLENGUA.ca.get(clau), clau).toBe(reserva);
      for (const l of LLENGUES) {
        const valor = PER_LLENGUA[l].get(clau);
        expect(valor.trim(), `${l}: ${clau}`).not.toBe('');
        expect(buitsDe(valor), `${l}: ${clau}`).toEqual(buitsDe(reserva));
      }
    }
  });

  test('el traductor de l’app les troba (no cau a la reserva), també en les llengües diferides', () => {
    for (const l of LLENGUES) {
      const t = createTranslator(l);
      expect(t('section.comu.rebost.buidaCistell', 'RESERVA')).not.toBe('RESERVA');
    }
    expect(createTranslator('es')('section.comu.cens.reclama', 'x')).toBe('Me lo quedo');
  });
});

describe('les claus que la peça demana pel nom', () => {
  test('modes, estats, filtres, progrés, afegit i columnes de cada mode', () => {
    const falten = [];
    const cal = (nom) => { if (!Object.hasOwn(TEXTOS_COMU, nom)) falten.push(nom); };
    for (const mode of Object.values(MODES_COMU)) {
      const camel = camelDe(mode.id);
      cal(`mode.${camel}`);
      cal(`afegit.${camel}`);
      cal(`ajuda.${camel}`);
      if (mode.id !== 'escola_educand') cal(`progres.${camel}`);
      for (const estat of mode.estats) cal(`estat.${camelDe(estat)}`);
      for (const f of mode.filtres) cal(`filtre.${camelDe(f.valor)}`);
      for (const c of mode.columnes) cal(`columna.${c.clau}`);
    }
    expect(falten).toEqual([]);
  });

  test('cada codi d’error del nucli té el seu text; un de desconegut, «desconegut»', () => {
    for (const codi of CODIS_COMU) expect(parellDError({ codi })[0], codi).toBe(`section.comu.error.${camelDe(codi)}`);
    expect(parellDError({ codi: 'inventat' })[0]).toBe('section.comu.error.desconegut');
    expect(parellComu('no.existix')).toEqual(['section.comu.no.existix', 'no.existix']);
  });

  test('tota clau literal que el JSX llig amb tr(…) existix', () => {
    const jsx = llig('src/components/PedraSeca/UniversalListCard/UniversalListCard.jsx');
    const literals = [...jsx.matchAll(/\btr\('([\w.]+)'/g)].map((m) => m[1]);
    expect(literals.length).toBeGreaterThan(60);
    expect(literals.filter((nom) => !Object.hasOwn(TEXTOS_COMU, nom))).toEqual([]);
  });
});
