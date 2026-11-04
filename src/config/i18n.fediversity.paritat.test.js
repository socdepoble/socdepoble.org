// @vitest-environment node
/**
 * i18n.fediversity.paritat.test.js · Ronda 13 (Paritat 100% dels 5 idiomes oficials)
 *
 * Verifica que totes les claus de:
 *   - `ambit.*` (els 8 àmbits de publicació, modalitats, estats i camps)
 *   - `editor.closca.tancaEdicioAvancada`
 *   - `section.control.<ambit>.publicar` i `section.control.<ambit>.saberMes`
 * existeixen amb paritat exacta i sense cadenes buides als 5 diccionaris
 * (`ca`, `es`, `en`, `eu`, `gl`).
 *
 * Retirada del panell Node 0 i Mastodon (decisió de l'àrbitre, fusió del kit
 * v3.0.0 sobre 8f4559b3b) · El panell, la seua fitxa i la safata POSSE no entren
 * en esta integració. Les seues claus `section.control.node0.*` se'n van dels
 * 5 diccionaris, i amb elles `editor.ambit.triat`, que AH-04 havia deixat sense
 * cap lector (Gauntlet G3: G3-ah-conformitat-10, G3-g2-matriu-23 i
 * G3-pedra-seca-i18n-09).
 */

import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';
import { RESERVES_I18N } from '../utils/publicacioUniversal.js';
import { DESTINS_CONTROL } from '../sections/control/destinsControl.js';

const IDIOMES = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });
const CODIS_IDIOMA = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

describe('i18n.fediversity.paritat · Ronda 13 (Paritat 5 llengües ca/es/en/eu/gl)', () => {
  test('1. Cap clau del panell retirat (section.control.node0.*) ni editor.ambit.triat queda als 5 diccionaris', () => {
    for (const codi of CODIS_IDIOMA) {
      const mortes = Object.keys(IDIOMES[codi])
        .filter((clau) => clau.startsWith('section.control.node0.') || clau === 'editor.ambit.triat');
      expect(mortes, codi).toEqual([]);
    }
  });

  test('2. TOTES les 64 claus de RESERVES_I18N (8 àmbits, 4 estats, modalitats i camps) existeixen als 5 idiomes i zero claus ambit.* mortes queden als diccionaris', () => {
    const entrades = Object.entries(RESERVES_I18N);
    expect(entrades.length).toBe(64);

    for (const [clau, reservaCa] of entrades) {
      expect(typeof reservaCa).toBe('string');
      expect(reservaCa.trim().length).toBeGreaterThan(0);
      expect(Object.hasOwn(CA, clau), `Falta ${clau} en 'ca.js'`).toBe(true);
      expect(CA[clau]).toBe(reservaCa);
      for (const codi of CODIS_IDIOMA) {
        const valor = IDIOMES[codi][clau];
        expect(typeof valor, `Falta ${clau} en '${codi}'`).toBe('string');
        expect(valor.trim().length, `Cadena buida a ${clau} en '${codi}'`).toBeGreaterThan(0);
      }
    }

    // Verifica que cap clau ambit.* dels diccionaris siga òrfena respecte a RESERVES_I18N
    for (const codi of CODIS_IDIOMA) {
      for (const clau of Object.keys(IDIOMES[codi])) {
        if (clau.startsWith('ambit.')) {
          expect(Object.hasOwn(RESERVES_I18N, clau), `Clau ambit.* morta/òrfena ${clau} en '${codi}'`).toBe(true);
        }
      }
    }
  });

  test('3. Les portes dels 8 destins de /control i editor.closca.tancaEdicioAvancada tenen paritat en ca, es, en, eu i gl', () => {
    const clausObligatories = [
      'editor.closca.tancaEdicioAvancada',
      ...DESTINS_CONTROL.flatMap((d) => [d.noms.publicar[0], d.noms.saberMes[0]])
    ];

    for (const clau of clausObligatories) {
      for (const codi of CODIS_IDIOMA) {
        const valor = IDIOMES[codi][clau];
        expect(typeof valor, `Falta ${clau} en '${codi}'`).toBe('string');
        expect(valor.trim().length, `Cadena buida a ${clau} en '${codi}'`).toBeGreaterThan(0);
      }
    }
  });

  test('4. Els 5 diccionaris tenen exactament el mateix conjunt de claus per al namespace ambit.*', () => {
    const filtra = (dict) => Object.keys(dict)
      .filter((k) => k.startsWith('ambit.'))
      .sort();

    const baseCa = filtra(CA);
    for (const codi of ['es', 'en', 'eu', 'gl']) {
      expect(filtra(IDIOMES[codi])).toEqual(baseCa);
    }
  });
});
