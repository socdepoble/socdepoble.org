// @vitest-environment node
/* Fase D (261020, tasca 2; pla 261020_1300) · Les claus section.moderacio.*:
   cada una té valor propi, no buit, a les cinc llengües (la paritat de
   LLEI_07, que el hook de l'implementador no deixa executar), amb els mateixos
   buits ({nom}, {termini}) que el valencià; el valor valencià és la reserva
   de textosModeracio.js (i de la còpia dels avisos de ModeracioContext.jsx);
   i tota clau section.moderacio.* que el codi llig amb t('…') existix. El
   diccionari no s'exporta: les claus de cada llengua es lligen del text de la
   font, com a tests/lint_xat.test.mjs. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from './i18n.js';
import { TEXTOS_ERROR_MODERACIO, TEXTOS_MODERACIO, TEXTOS_MOTIUS } from '../components/PedraSeca/organismes/textosModeracio.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const LLENGUES = SUPPORTED_LANGUAGES.map((llengua) => llengua.code);

/** { llengua: Map<clau, valor> } de les claus section.moderacio.* de cada diccionari.
 *  Fase D (261020, tasca 4.1) · L1 · Cada llengua viu al seu fitxer,
 *  src/config/idiomes/<codi>.js (abans, un bloc de TRANSLATIONS a i18n.js). */
function clausPerLlengua() {
  const resultat = {};
  for (const l of LLENGUES) {
    const claus = new Map();
    for (const m of llig(`src/config/idiomes/${l}.js`).matchAll(/^\s*'(section\.moderacio\.[\w.]+)'\s*:\s*(['"])(.*)\2,?\s*$/gm)) {
      expect(claus.has(m[1]), `${l}: ${m[1]} duplicada`).toBe(false);
      claus.set(m[1], m[3]);
    }
    resultat[l] = claus;
  }
  return resultat;
}

const PARELLS = [
  ...Object.values(TEXTOS_MODERACIO),
  ...Object.values(TEXTOS_MOTIUS).flatMap(({ etiqueta, ajuda }) => [etiqueta, ajuda]),
  ...Object.values(TEXTOS_ERROR_MODERACIO)
];
const buits = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('section.moderacio.* a les cinc llengües', () => {
  const per = clausPerLlengua();

  test('les cinc llengües porten exactament les mateixes claus, cap de buida', () => {
    const referencia = [...per.ca.keys()].sort();
    expect(referencia.length).toBeGreaterThanOrEqual(PARELLS.length);
    for (const l of LLENGUES) {
      expect([...per[l].keys()].sort(), l).toEqual(referencia);
      for (const [clau, valor] of per[l]) expect(valor.trim(), `${l}: ${clau}`).not.toBe('');
    }
  });

  test('cada traducció conserva els buits del valencià ({nom}, {termini})', () => {
    for (const [clau, valor] of per.ca) {
      for (const l of LLENGUES) expect(buits(per[l].get(clau)), `${l}: ${clau}`).toEqual(buits(valor));
    }
  });

  test('cada parell de textosModeracio.js és al diccionari i la reserva és el valor valencià', () => {
    const ca = createTranslator('ca');
    for (const [clau, reserva] of PARELLS) {
      expect(per.ca.has(clau), clau).toBe(true);
      expect(ca(clau), clau).toBe(reserva);
    }
  });

  test('els avisos de ModeracioContext.jsx porten la mateixa clau i la mateixa reserva', () => {
    const font = llig('src/app/contexts/ModeracioContext.jsx');
    const ca = createTranslator('ca');
    const avisos = [...font.matchAll(/\['(section\.moderacio\.[\w.]+)',\s*'([^']+)'\]/g)];
    expect(avisos.length).toBeGreaterThanOrEqual(4);
    for (const [, clau, reserva] of avisos) expect(ca(clau), clau).toBe(reserva);
  });

  test('tota clau section.moderacio.* que el codi llig amb t(…) existix, amb la mateixa reserva', () => {
    const ca = createTranslator('ca');
    const fonts = [
      'src/sections/xat/components/Bombolla.jsx', 'src/sections/xat/components/CapcaleraConversa.jsx',
      'src/sections/xat/components/FilaConversa.jsx', 'src/sections/xat/conversa.js', 'src/sections/xat/XatControlSection.jsx'
    ];
    let vistes = 0;
    for (const f of fonts) {
      for (const m of llig(f).matchAll(/\bt\(\s*'(section\.moderacio\.[\w.]+)',\s*'([^']*)'/g)) {
        vistes += 1;
        expect(per.ca.has(m[1]), `${f}: ${m[1]}`).toBe(true);
        expect(ca(m[1]), `${f}: ${m[1]}`).toBe(m[2]);
      }
    }
    expect(vistes).toBeGreaterThanOrEqual(6);
  });
});
