// @vitest-environment node
/* Gestoria · frontera dels models purs de l'onada 2 (passos 3, 4 i 5 del MAPA
   de l'empresa, ordre del Mestre del 261004): Identitat legal, Burocràcia i
   Projectes i subvencions. Són JS pur: sense React, sense DOM, sense xarxa;
   només importen els seus tres carrils i el calendari del nucli (dates.js).
   I encara NO estan endollats: cap fitxer de fora els fa servir, ni
   ContenidorGestoria ni cap font dels dos tractors signats, que així no
   canvien d'empremta. Quan s'endollen, amb ordre, esta prova es canvia amb el
   motiu escrit. Els patrons es componen a trossos perquè les portes que
   llegixen src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { TRACTORS_GESTORIA } from './tractors.js';

const ARREL = process.cwd();
const GESTORIA = 'src/sections/gestoria';
const CARRILS = Object.freeze([`${GESTORIA}/identitat`, `${GESTORIA}/burocracia`, `${GESTORIA}/projectes`]);
const PERMESOS_FORA = Object.freeze([`${GESTORIA}/nucli/dates.js`]);

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
const dinsCarrils = (ruta) => CARRILS.some((carril) => ruta.startsWith(`${carril}/`));
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
function especificadors(codi) {
  return [...codi.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g)].map((m) => m[2]);
}
const resol = (ruta, especificador) => (especificador.startsWith('.')
  ? path.posix.normalize(path.posix.join(path.posix.dirname(ruta), especificador))
  : especificador);

const TOTS = CARRILS.flatMap(fitxersDe);
const PRODUCCIO = TOTS.filter((ruta) => !esProva(ruta));

describe('els models purs', () => {
  test('el cens: els mòduls dels passos 3, 4 i 5, cadascun amb la seua prova, sense cap JSX', () => {
    expect([...PRODUCCIO].sort()).toEqual([
      `${GESTORIA}/identitat/nucli/document.js`, `${GESTORIA}/identitat/nucli/guardes.js`, `${GESTORIA}/identitat/nucli/titular.js`,
      `${GESTORIA}/burocracia/nucli/avisos.js`, `${GESTORIA}/burocracia/nucli/icsTerminis.js`, `${GESTORIA}/burocracia/nucli/obligacions.js`,
      `${GESTORIA}/burocracia/nucli/terminis.js`, `${GESTORIA}/projectes/nucli/expedient.js`
    ].sort());
    for (const ruta of PRODUCCIO) expect(TOTS, ruta).toContain(ruta.replace(/\.js$/, '.test.js'));
  });

  test('només importen els tres carrils i el calendari del nucli; cap paquet', () => {
    const fora = PRODUCCIO.flatMap((ruta) => especificadors(llig(ruta))
      .map((e) => [e, resol(ruta, e)])
      .filter(([, desti]) => !dinsCarrils(desti) && !PERMESOS_FORA.includes(desti))
      .map(([e]) => `${ruta}: ${e}`));
    expect(fora).toEqual([]);
  });

  test('sense DOM, ni globals de pantalla, ni xarxa, ni emmagatzematge', () => {
    /* «document.js» és un mòdul del carril i «document.tipus», el camp d'un
       error: del DOM es veten les globals i les entrades de document. */
    const vetats = [
      /\b(?:window|navigator|location|globalThis)\s*\./,
      /\bdocument\s*\.\s*(?:createElement|querySelector|getElement|body|head|cookie|addEventListener|documentElement|write)/,
      new RegExp(['\\bfet', 'ch\\s*\\('].join('')),
      new RegExp(['XMLHttp', 'Request|\\bWebSo', 'cket\\b'].join('')),
      new RegExp(['\\blocal', 'Storage\\b|\\bsession', 'Storage\\b|\\bindexed', 'DB\\b'].join('')),
      /\bhttps?:\/\//
    ];
    const trobats = PRODUCCIO.flatMap((ruta) => vetats.filter((patro) => patro.test(llig(ruta))).map((patro) => `${ruta}: ${patro}`));
    expect(trobats).toEqual([]);
    // Les sondes: els patrons sí que troben el que vetem.
    expect(vetats[0].test('window.open(')).toBe(true);
    expect(vetats[1].test('document.createElement(')).toBe(true);
    expect(vetats[1].test('document.tipus')).toBe(false);
  });

  test('cap literal amb forma de DNI, NIE o IBAN, proves incloses', () => {
    const vetats = [
      /\b\d{8}[-\s]?[A-HJ-NP-TV-Z]\b/i,
      /\b[XYZ][-\s]?\d{7}[-\s]?[A-HJ-NP-TV-Z]\b/i,
      /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){4,7}(?: ?[A-Z0-9]{1,3})?\b/
    ];
    const trobats = TOTS.flatMap((ruta) => vetats.map((patro) => patro.exec(llig(ruta))).filter(Boolean).map((m) => `${ruta}: «${m[0]}»`));
    expect(trobats).toEqual([]);
  });

  test('cap mòdul exporta res per a editar, actualitzar o esborrar', () => {
    const moduls = import.meta.glob(['./identitat/**/*.js', './burocracia/**/*.js', './projectes/**/*.js', '!./**/*.test.js'], { eager: true });
    expect(Object.keys(moduls)).toHaveLength(PRODUCCIO.length);
    const noms = Object.values(moduls).flatMap((m) => Object.keys(m));
    expect(noms.length).toBeGreaterThan(40);
    expect(noms.filter((nom) => /^(?:edita|actualitza|modifica|esborra|elimina|buida|substituix|purga)/i.test(nom))).toEqual([]);
  });
});

describe('encara no estan endollats', () => {
  test('cap fitxer de src de fora dels tres carrils els importa', () => {
    const importadors = fitxersDe('src').filter((ruta) => !dinsCarrils(ruta) && !esProva(ruta))
      .flatMap((ruta) => especificadors(llig(ruta)).filter((e) => dinsCarrils(resol(ruta, e))).map((e) => `${ruta}: ${e}`));
    expect(importadors).toEqual([]);
  });

  test('cap font dels tractors signats és d’estos carrils: les empremptes aprovades no canvien', () => {
    const fonts = TRACTORS_GESTORIA.flatMap((manifest) => manifest.fonts);
    expect(fonts.length).toBeGreaterThan(20);
    expect(fonts.filter(dinsCarrils)).toEqual([]);
  });
});
