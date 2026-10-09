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
    ['^2', '1.0.0', false],
    ['^0', '1.0.0', false],
    ['1', '1.0.0', false],
    ['>=1', '1.0.0', false],
    ['^1', '1.0', false],
    [undefined, '1.0.0', false]
  ])('nucliSatisfa(%j, %j) és %j', (rang, versio, esperat) => {
    expect(nucliSatisfa(rang, versio)).toBe(esperat);
  });
});
