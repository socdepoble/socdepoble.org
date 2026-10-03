// @vitest-environment node
/* El catàleg dels sentinelles amb el glob real de Vite: cada sentinella és
   complet (fitxa i fonts amb el text del disc), té una empremta pròpia i no
   toca res dels tractors de la Gestoria. */
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { TRACTORS_GESTORIA } from '../gestoria/tractors.js';
import {
  BASE_SENTINELLES, RUTES_SENTINELLES, SENTINELLES, TRACTORS_SENTINELLES, empremtesDeSentinelles, sentinellaDe
} from './registreSentinelles.js';
import { TRACTORS } from './registreTractors.js';

const subtle = webcrypto.subtle;

describe('el catàleg', () => {
  test('un tractor per sentinella, en el mateix ordre i amb el manifest derivat', () => {
    expect(BASE_SENTINELLES).toBe('src/sections/tractors');
    expect(TRACTORS_SENTINELLES.map((t) => t.id)).toEqual(SENTINELLES.map((s) => s.id));
    for (const [i, t] of TRACTORS_SENTINELLES.entries()) expect(t.manifest).toBe(SENTINELLES[i].manifest);
  });

  test('cada sentinella és complet: la fitxa i les fonts són el text del disc', () => {
    for (const t of TRACTORS_SENTINELLES) {
      expect(t.fontsAbsents, t.id).toEqual([]);
      expect(t.fitxa, t.id).toBe(readFileSync(t.manifest.fitxa, 'utf8'));
      for (const font of t.fonts) expect(font.contingut, font.ruta).toBe(readFileSync(font.ruta, 'utf8'));
    }
  });

  test('el glob serveix el carril, la porta i els mòduls purs de la Gestoria, sense proves', () => {
    for (const esperada of [
      'src/sections/tractors/registreSentinelles.js', 'src/sections/tractors/PanellSentinelles.jsx', 'src/sections/tractors/PanellTractors.jsx',
      'src/sections/tractors/nucli/aprovacio.js', 'src/sections/tractors/sentinelles/executa.js',
      'src/sections/tractors/sentinelles/fitxes/sentinella_estructural.md', 'src/sections/gestoria/nucli/c43.js'
    ]) expect(RUTES_SENTINELLES, esperada).toContain(esperada);
    expect(RUTES_SENTINELLES.filter((ruta) => /\.test\./.test(ruta) || ruta.includes('/__fixtures__/'))).toEqual([]);
    expect(Object.isFrozen(RUTES_SENTINELLES)).toBe(true);
  });

  test('sentinellaDe troba pel seu id i res més', () => {
    expect(sentinellaDe('sentinella.consol-vendes')).toBe(SENTINELLES[3]);
    expect(sentinellaDe('gestoria.factures')).toBeNull();
  });
});

describe('les empremtes', () => {
  test('totes es calculen i són diferents', async () => {
    const infos = await empremtesDeSentinelles(subtle);
    expect(infos.map((i) => [i.id, i.estat])).toEqual(SENTINELLES.map((s) => [s.id, 'ok']));
    expect(new Set(infos.map((i) => i.empremta)).size).toBe(SENTINELLES.length);
  });
});

describe('la Gestoria no es toca', () => {
  test('el catàleg dels tractors continua sent el de la Gestoria, sense cap sentinella', () => {
    expect(TRACTORS.map((t) => t.id)).toEqual(TRACTORS_GESTORIA.map((m) => m.id));
    for (const m of TRACTORS_GESTORIA) {
      expect(m.fonts.filter((ruta) => /sentinell/i.test(ruta)), m.id).toEqual([]);
    }
  });
});
