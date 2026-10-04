// @vitest-environment node
/* Facturació · frontera de la fase 0 (ordre del Mestre del 261004). El nucli
   és JS pur: sense React, sense DOM, sense xarxa; només importa el seu propi
   carril, dues peces del nucli de la Gestoria (nif, dates) i el resum de la
   Porta d'Aprovació (canonic.js). I encara no està endollat: cap fitxer de
   fora el fa servir (ni ContenidorGestoria, cosa que canviaria l'empremta
   dels tractors, ni el backend, que és la frontera D3). Quan s'endolle, amb
   ordre, esta prova es canvia amb el motiu escrit. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARRIL = 'src/sections/gestoria/facturacio';
const PERMESOS_FORA = Object.freeze([
  'src/sections/gestoria/nucli/nif.js',
  'src/sections/gestoria/nucli/dates.js',
  'src/sections/tractors/nucli/canonic.js'
]);

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta);
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
function especificadors(codi) {
  return [...codi.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g)].map((m) => m[2]);
}
const resol = (ruta, especificador) => (especificador.startsWith('.')
  ? path.posix.normalize(path.posix.join(path.posix.dirname(ruta), especificador))
  : especificador);

const PRODUCCIO = fitxersDe(CARRIL).filter((ruta) => !esProva(ruta));

describe('el nucli de facturació és pur', () => {
  /* Onada 2 (ordre del Mestre del 261004): configEmpresa, llegat i pressupost
     entren al cens, purs i sense endollar com la resta. Integració final
     (ordre del Mestre, 261004): entra emissio.js, el cas d'ús d'emissió (F02
     de l'auditoria de Codex), pur i també sense endollar. */
  test('el cens: els mòduls de la fase 0, de l’onada 2 i de la integració final, sense cap JSX', () => {
    expect(PRODUCCIO).toEqual([
      `${CARRIL}/comu.js`, `${CARRIL}/configEmpresa.js`, `${CARRIL}/emissio.js`, `${CARRIL}/facturaEmesa.js`, `${CARRIL}/llegat.js`,
      `${CARRIL}/pressupost.js`, `${CARRIL}/registre/cadena.js`, `${CARRIL}/registre/empremta.js`,
      `${CARRIL}/registre/port.js`, `${CARRIL}/registre/portIndexedDB.js`, `${CARRIL}/registre/qr.js`,
      `${CARRIL}/registre/registreAlta.js`, `${CARRIL}/registre/registreAnulacio.js`, `${CARRIL}/registre/validacio.js`,
      `${CARRIL}/serie.js`
    ]);
  });

  test('el llegat i el pressupost queden fora de la cadena: no importen res del registre', () => {
    for (const ruta of [`${CARRIL}/llegat.js`, `${CARRIL}/pressupost.js`, `${CARRIL}/configEmpresa.js`]) {
      expect(especificadors(llig(ruta)).filter((e) => resol(ruta, e).startsWith(`${CARRIL}/registre/`)), ruta).toEqual([]);
    }
  });

  test('només importa el seu carril i les tres peces permeses', () => {
    const fora = PRODUCCIO.flatMap((ruta) => especificadors(llig(ruta))
      .map((e) => [e, resol(ruta, e)])
      .filter(([, desti]) => !desti.startsWith(`${CARRIL}/`) && !PERMESOS_FORA.includes(desti))
      .map(([e]) => `${ruta}: ${e}`));
    expect(fora).toEqual([]);
  });

  test('sense DOM ni globals de pantalla', () => {
    const dom = /\b(?:document|window)\s*\.|\blocation\s*\./;
    expect(PRODUCCIO.filter((ruta) => dom.test(llig(ruta)))).toEqual([]);
  });

  test('cap mòdul exporta res per a editar, actualitzar o esborrar', () => {
    const moduls = import.meta.glob(['./**/*.js', '!./**/*.test.js'], { eager: true });
    expect(Object.keys(moduls)).toHaveLength(PRODUCCIO.length);
    const noms = Object.values(moduls).flatMap((m) => Object.keys(m));
    expect(noms.length).toBeGreaterThan(30);
    expect(noms.filter((nom) => /^(?:edita|actualitza|modifica|esborra|elimina|buida|substituix)/i.test(nom))).toEqual([]);
  });
});

describe('encara no està endollat', () => {
  test('cap fitxer de src de fora del carril l’importa', () => {
    const importadors = fitxersDe('src').filter((ruta) => !ruta.startsWith(`${CARRIL}/`) && !esProva(ruta))
      .flatMap((ruta) => especificadors(llig(ruta)).filter((e) => resol(ruta, e).startsWith(`${CARRIL}/`)).map((e) => `${ruta}: ${e}`));
    expect(importadors).toEqual([]);
  });
});
