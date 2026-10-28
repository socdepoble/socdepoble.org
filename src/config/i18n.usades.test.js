// @vitest-environment node
/* Pla 261028_1526 (P1-22, TE-02) · Tota clau literal que el codi de src/
   demana al traductor és als cinc diccionaris. Sense esta guarda, una clau
   absent no falla enlloc: createTranslator torna la reserva valenciana en
   totes les llengües, LLEI_07 només compara els diccionaris entre ells i
   ningú no ho veu (24 claus en estaven així).
   Es llig el text de la font, sense importar cap mòdul de producció:
    · les crides t('…'), tradueix('…') i els embolcalls que passen la clau
      tal qual, tr('…') i ambNom('…') (panellDeLaFoto.js, OnboardingSection.jsx,
      BlocRelacio.jsx, BlocFormarPart.jsx, CapcaleraConversa.jsx);
    · els parells ['…', reserva];
    · els ajudants de prefix `const x = (nom, reserva) => [`prefix.${nom}`, …]`
      (textosComu.js, textosModeracio.js, DetallPrivacitat.jsx) i les seues
      crides amb un nom literal.
   Falsos positius que es deixen fora: només compta una clau d'un espai de noms
   del valencià (el primer segment d'alguna clau de ca.js), i així no hi entren
   el lector de cel·les d'apps/salut (t('ingesta.beguda')), els parells de
   dominis de gestoria (['amazon.es', 'amazon.com']) ni els noms de fitxer
   d'assetResolver. El tr() de UniversalListCard.jsx no passa la clau tal qual:
   la resol parellComu() a section.comu.*, i ho guarda i18n.comu.test.js. Les
   crides dinàmiques (`section.xat.sistema.${clau}`) no es poden llegir i
   porten la seua reserva. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';

const ARREL = process.cwd();
const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
const ESPAIS = [...new Set(Object.keys(CA).map((clau) => clau.split('.')[0]))].join('|');
const CLAU = String.raw`(?:${ESPAIS})\.[\w.-]+`;
const CRIDA = new RegExp(String.raw`\b(t|tradueix|tr|ambNom)\(\s*(['"\x60])(${CLAU})\2`, 'g');
const PARELL = new RegExp(String.raw`\[\s*(['"])(${CLAU})\1\s*,`, 'g');
const AJUDANT = /const\s+(\w+)\s*=\s*\(\s*(\w+)\s*,\s*\w+\s*\)\s*=>[^\n]*`([\w.-]+\.)\$\{\2\}`/g;
/* El tr() d'esta peça és parellComu(), no el traductor. */
const TR_PROPI = new Set(['src/components/PedraSeca/UniversalListCard/UniversalListCard.jsx']);

function fitxers(dir, acc = []) {
  for (const e of readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) { if (rel !== 'src/config/idiomes') fitxers(rel, acc); }
    else if (/\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name)) acc.push(rel);
  }
  return acc;
}

/** clau → fitxers que la demanen. */
function clausUsades() {
  const usades = new Map();
  const anota = (clau, rel) => usades.set(clau, (usades.get(clau) ?? new Set()).add(rel));
  for (const rel of fitxers('src')) {
    const font = readFileSync(path.join(ARREL, rel), 'utf8');
    for (const [, funcio, , clau] of font.matchAll(CRIDA)) {
      if (funcio !== 'tr' || !TR_PROPI.has(rel)) anota(clau, rel);
    }
    for (const [, , clau] of font.matchAll(PARELL)) anota(clau, rel);
    for (const [, nom, , prefix] of font.matchAll(AJUDANT)) {
      for (const [, , tros] of font.matchAll(new RegExp(String.raw`\b${nom}\(\s*(['"])([\w.-]+)\1\s*,`, 'g'))) anota(prefix + tros, rel);
    }
  }
  return usades;
}

const USADES = clausUsades();

describe('claus usades al codi', () => {
  test('l’escàner les troba: crides, parells i ajudants de prefix', () => {
    expect(USADES.size).toBeGreaterThan(1000);
    for (const clau of ['common.cancela', 'section.perfil.privacitat.dades.natiu', 'section.perfil.privacitat.baixa.punt.apple',
      'section.comu.cancela', 'section.moderacio.error.autobloqueig', 'section.mercat.afegeixAlCabas']) {
      expect(USADES.has(clau), clau).toBe(true);
    }
    // Els falsos positius de la recon no hi entren.
    for (const clau of ['ingesta.beguda', 'amazon.es', 'error.llistaInvalida']) expect(USADES.has(clau), clau).toBe(false);
  });

  test.each(Object.keys(DICCIONARIS))('%s: cap clau demanada amb un literal hi falta', (codi) => {
    const dic = DICCIONARIS[codi];
    const falten = [...USADES].filter(([clau]) => typeof dic[clau] !== 'string' || dic[clau].trim() === '')
      .map(([clau, on]) => `${clau} (${[...on].join(', ')})`);
    expect(falten).toEqual([]);
  });
});
