/* Plataforma d'Apps Enxufables · el nucli dels mòduls (nucliModuls.js) i el
   seu contracte (contracteNucli.js, sdp.modul.v1, ADR-2026-12).
   L'objecte i la llista han de dir el mateix: una porta, un nom o una font
   nova a una banda sense l'altra posa açò en roig, i obliga a decidir si és
   un canvi menor (afegir) o major (llevar o canviar) de VERSIO_NUCLI. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { describe, expect, test } from 'vitest';
import * as Router from '../../app/contexts/RouterContext.jsx';
import * as PedraSeca from '../../components/PedraSeca/index.js';
import * as plataforma from './index.js';
import {
  ESQUEMA_MODUL, GLOBAL_DEL_NUCLI, NOMS_PER_FITXER_DE_PEDRA_SECA, PORTES_DEL_NUCLI, VERSIO_NUCLI, exposaElNom,
  globalDeLaPorta, nucliSatisfa, portaDeLaFont
} from './contracteNucli.js';
import { NUCLI } from './nucliModuls.js';
import { NOMS_DEL_NUCLI_1_0, NOMS_DEL_NUCLI_1_1 } from './__fixtures__/nomsDelNucli.js';

const ARREL = process.cwd();
const ordenat = (llista) => [...llista].sort();
const porta = (clau) => PORTES_DEL_NUCLI.find((candidata) => candidata.clau === clau);

describe('l’objecte SocDePoble.nucli', () => {
  test('congelat, versionat i amb exactament les portes del contracte', () => {
    expect(Object.isFrozen(NUCLI)).toBe(true);
    expect(NUCLI.versio).toBe(VERSIO_NUCLI);
    expect(VERSIO_NUCLI).toMatch(/^\d+\.\d+\.\d+$/);
    expect(ordenat(Object.keys(NUCLI))).toEqual(ordenat(['versio', ...PORTES_DEL_NUCLI.map((p) => p.clau)]));
    for (const { clau } of PORTES_DEL_NUCLI) expect(Object.isFrozen(NUCLI[clau]), clau).toBe(true);
  });

  test('cada porta porta exactament els noms del contracte, i són les instàncies de la pàgina', () => {
    for (const { clau, noms } of PORTES_DEL_NUCLI) {
      if (noms === '*') continue;
      expect(ordenat(Object.keys(NUCLI[clau])), clau).toEqual(ordenat(noms));
    }
    expect(NUCLI.React.useState).toBe(React.useState);
    expect(NUCLI.React.createElement).toBe(React.createElement);
    expect(NUCLI.React.Suspense).toBe(React.Suspense);
    expect(NUCLI.jsxRuntime.jsx).toBe(jsxRuntime.jsx);
    expect(NUCLI.router.useLocation).toBe(Router.useLocation);
    expect(NUCLI.router.Navigate).toBe(Router.Navigate);
    expect(NUCLI.router.useRouter).toBe(Router.useRouter);
    for (const nom of porta('pedraSeca').noms) expect(NUCLI.pedraSeca[nom], nom).toBe(PedraSeca[nom]);
  });

  test('la plataforma del nucli és l’API pública sencera (plataforma/index.js), ni més ni menys', () => {
    expect(ordenat(Object.keys(NUCLI.plataforma))).toEqual(ordenat(Object.keys(plataforma)));
    for (const nom of Object.keys(plataforma)) expect(NUCLI.plataforma[nom], nom).toBe(plataforma[nom]);
  });

  test('cap porta dona el backend, la sessió ni la identitat', () => {
    const vetats = /backend|supabase|session|identitat|adoptaSessio|getCurrentUser|teCapacitat/i;
    for (const { clau } of PORTES_DEL_NUCLI) {
      if (clau === 'React') continue;
      expect(Object.keys(NUCLI[clau]).filter((nom) => vetats.test(nom)), clau).toEqual([]);
    }
  });
});

describe('el contracte (contracteNucli.js)', () => {
  test('les fonts existixen al disc, i cada fitxer de Pedra Seca exporta els seus noms', () => {
    for (const { fonts } of PORTES_DEL_NUCLI) {
      for (const font of fonts.filter((f) => f.startsWith('src/'))) expect(() => readFileSync(path.join(ARREL, font)), font).not.toThrow();
    }
    for (const [fitxer, noms] of Object.entries(NOMS_PER_FITXER_DE_PEDRA_SECA)) {
      const codi = readFileSync(path.join(ARREL, fitxer), 'utf8');
      for (const nom of noms) expect(codi, `${fitxer}: ${nom}`).toMatch(new RegExp(`export (?:function|const|class) ${nom}\\b`));
    }
  });

  test('cap font és de dues portes, i cada global és SocDePoble.nucli.<clau>', () => {
    const fonts = PORTES_DEL_NUCLI.flatMap((p) => p.fonts);
    expect(new Set(fonts).size).toBe(fonts.length);
    expect(GLOBAL_DEL_NUCLI).toBe('SocDePoble.nucli');
    expect(globalDeLaPorta(portaDeLaFont('react'))).toBe('SocDePoble.nucli.React');
    expect(globalDeLaPorta(portaDeLaFont('src/components/PedraSeca/atoms/Boto.jsx'))).toBe('SocDePoble.nucli.pedraSeca');
    expect(portaDeLaFont('react-dom')).toBeNull();
    expect(portaDeLaFont('src/data/backendPort.js')).toBeNull();
    expect(portaDeLaFont('src/app/contexts/SessionContext.jsx')).toBeNull();
    expect(exposaElNom(porta('React'), 'useState')).toBe(true);
    expect(exposaElNom(porta('pedraSeca'), 'Boto')).toBe(true);
    expect(exposaElNom(porta('pedraSeca'), 'UniversalButton')).toBe(false);
    expect(ESQUEMA_MODUL).toBe('sdp.modul.v1');
  });

  test.each([
    ['^1', '1.0.0', true],
    ['^1', '1.7.3', true],
    ['^1.0', '1.0.0', true],
    ['^1.2', '1.1.9', false],
    ['^1.2', '1.2.0', true],
    ['^1.0', '1.1.0', true],
    ['^1.1', '1.1.0', true],
    ['^2', '1.0.0', false],
    ['^0', '1.0.0', false],
    ['1', '1.0.0', false],
    ['>=1', '1.0.0', false],
    ['^1', '1.0', false],
    [undefined, '1.0.0', false]
  ])('nucliSatisfa(%j, %j) és %j', (rang, versio, esperat) => {
    expect(nucliSatisfa(rang, versio)).toBe(esperat);
  });

  /* Onada 7 (261009) · el rang i prou: que l'1.1.0 només afig ho diu la de sota, amb els noms. */
  test('el rang: amb el nucli 1.1.0, un mòdul compilat contra l’1.0 continua entrant, i un de l’1.2 encara no', () => {
    expect(VERSIO_NUCLI).toBe('1.1.0');
    expect(nucliSatisfa('^1.0')).toBe(true);
    expect(nucliSatisfa('^1.1')).toBe(true);
    expect(nucliSatisfa('^1.2')).toBe(false);
  });

  /* Onada 7 (261009) · la promesa de l'1.1.0 («només s'afig») amb noms, no
     amb números. Cada porta i cada nom de l'1.0.0 continuen al contracte i a
     l'objecte: si no, un mòdul de '^1.0' entraria i rebria undefined. I el
     que s'hi ha afegit és exactament NOMS_DEL_NUCLI_1_1, que
     guardesDelModul.test.js obliga a estar en ús. */
  test('el nucli 1.1.0 conserva cada porta i cada nom de l’1.0.0, i només afig els de l’1.1.0', () => {
    const actuals = Object.fromEntries(PORTES_DEL_NUCLI.map(({ clau, noms }) => [clau, noms]));
    expect(Object.keys(NOMS_DEL_NUCLI_1_0).filter((clau) => !Object.hasOwn(actuals, clau))).toEqual([]);
    const afegits = {};
    for (const [clau, noms] of Object.entries(actuals)) {
      const abans = NOMS_DEL_NUCLI_1_0[clau] ?? [];
      if (abans === '*' || noms === '*') {
        expect(noms, clau).toBe(abans);
        continue;
      }
      expect(abans.filter((nom) => !noms.includes(nom)), `${clau}: llevats del contracte`).toEqual([]);
      expect(abans.filter((nom) => !Object.hasOwn(NUCLI[clau], nom)), `${clau}: llevats de l’objecte`).toEqual([]);
      const nous = noms.filter((nom) => !abans.includes(nom));
      if (nous.length) afegits[clau] = ordenat(nous);
    }
    expect(afegits).toEqual(Object.fromEntries(Object.entries(NOMS_DEL_NUCLI_1_1).map(([clau, noms]) => [clau, ordenat(noms)])));
  });
});
