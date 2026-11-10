import { describe, expect, test } from 'vitest';
import { FORMATS, marcBase, posicioDeRetall } from './enquadrament.js';
import { posicioEnCaixa, ratioDelMarc, retallCssDelZoom } from '../../../utils/enquadramentUrl.js';

/* P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
   «Es veu igual que abans». Abans, el marc es retallava dins del fitxer i el
   fitxer anava a una caixa amb object-fit: cover i l'ancoratge de la caixa.
   Ara, la foto sencera va a la mateixa caixa amb la posició, l'ampliació i el
   clip de posicioEnCaixa. Un simulador del navegador (cover, object-position
   i transform: scale al mateix punt) diu quina part de la foto es veu en
   cada cas, i les dues han de ser la mateixa. */

const entre = (v, a, b) => Math.min(b, Math.max(a, v));

/** La part de la foto (fraccions de la foto) que es veu en una caixa de proporció B. */
function regioVisible({ R, B, px, py, zoom = 1 }) {
  const s = Math.max(B / R, 1); // cover: la foto (R × 1) escalada cobrix la caixa (B × 1)
  const ox = (B - R * s) * px;
  const oy = (1 - s) * py;
  const origen = { x: px * B, y: py }; // transform-origin, el mateix punt que object-position
  const abans = (q) => ({ x: origen.x + (q.x - origen.x) / zoom, y: origen.y + (q.y - origen.y) / zoom });
  const a = abans({ x: 0, y: 0 });
  const b = abans({ x: B, y: 1 });
  return { esquerra: (a.x - ox) / (R * s), dalt: (a.y - oy) / s, ample: (b.x - a.x) / (R * s), alt: (b.y - a.y) / s };
}

/** El marc del diàleg (amb les mateixes fites que limita), en unitats de la foto (alçada 1). */
function marc({ format, zoom, cx, cy }, R) {
  const rf = ratioDelMarc(format, R);
  const base = marcBase(R, 1, rf);
  const w = base.w / zoom;
  const h = base.h / zoom;
  return { esquerra: entre(cx * R, w / 2, R - w / 2) - w / 2, dalt: entre(cy, h / 2, 1 - h / 2) - h / 2, w, h, rf };
}

/** ABANS: el fitxer retallat (el marc) a la caixa, sense transformació. */
function abans(estat, R, B, alineacio) {
  const f = marc(estat, R);
  const dins = regioVisible({ R: f.rf, B: B ?? f.rf, px: alineacio.x, py: alineacio.y });
  return {
    esquerra: (f.esquerra + dins.esquerra * f.w) / R, dalt: f.dalt + dins.dalt * f.h, ample: (dins.ample * f.w) / R, alt: dins.alt * f.h,
  };
}

/** ARA: la foto sencera a la caixa, amb el que diu posicioEnCaixa. */
function ara(estat, R, B, alineacio) {
  const punt = posicioEnCaixa(estat, R, B, { alineacio });
  const ratioCaixa = B ?? ratioDelMarc(estat.format, R);
  return regioVisible({ R, B: ratioCaixa, px: punt.x / 100, py: punt.y / 100, zoom: punt.zoom });
}

const FOTOS = [4 / 3, 3 / 4, 16 / 9, 1, 3 / 2];
const MARCS = [
  { format: '16:9', zoom: 1, cx: 0.5, cy: 0.5 },
  { format: '1:1', zoom: 1.7, cx: 0.2, cy: 0.8 },
  { format: '9:16', zoom: 1, cx: 0.9, cy: 0.1 },
  { format: '4:5', zoom: 3, cx: 0.35, cy: 0.65 },
  { format: '21:9', zoom: 1.25, cx: 0.6, cy: 0.4 },
  { format: 'original', zoom: 2, cx: 0.7, cy: 0.3 },
];
/* [nom, proporció de la caixa (null: la del marc, la portada), ancoratge]. */
const CAIXES = [
  ['la portada de la fitxa (la forma del marc)', null, { x: 0.5, y: 0.5 }],
  ['la targeta universal (quadrada, ancorada dalt)', 1, { x: 0.5, y: 0 }],
  ['la miniatura del llistat (quadrada, centrada)', 1, { x: 0.5, y: 0.5 }],
  ['la targeta 16:9 del Mur (centrada)', 16 / 9, { x: 0.5, y: 0.5 }],
];

describe('posicioEnCaixa · la foto sencera es veu igual que el retall d’abans', () => {
  for (const [nom, B, alineacio] of CAIXES) {
    test(`${nom}: cada foto i cada marc`, () => {
      for (const R of FOTOS) {
        for (const estat of MARCS) {
          const esperat = abans(estat, R, B, alineacio);
          const vist = ara(estat, R, B, alineacio);
          for (const clau of ['esquerra', 'dalt', 'ample', 'alt']) {
            expect(Math.abs(vist[clau] - esperat[clau]), `${nom} · foto ${R.toFixed(3)} · ${JSON.stringify(estat)} · ${clau}`).toBeLessThan(1e-3);
          }
        }
      }
    });
  }

  test('amb la caixa de la forma del marc, és posicioDeRetall (la targeta 16:9 d’IDEA-42)', () => {
    for (const R of FOTOS) {
      const estat = { format: '16:9', zoom: 1.8, cx: 0.3, cy: 0.7 };
      expect(posicioEnCaixa(estat, R, 16 / 9)).toEqual(posicioDeRetall(estat, R));
    }
  });

  test('sense proporció de la foto, o amb un estat que no és de números, null: la imatge es queda centrada', () => {
    expect(posicioEnCaixa({ format: '16:9', zoom: 1, cx: 0.5, cy: 0.5 }, null, 1)).toBeNull();
    expect(posicioEnCaixa({ format: '16:9', zoom: 'x', cx: 0.5, cy: 0.5 }, 1.5, 1)).toBeNull();
    expect(posicioEnCaixa(null, 1.5, 1)).toBeNull();
  });
});

describe('ratioDelMarc', () => {
  test('les formes del diàleg, una «a:b» que no hi és i l’original (la de la foto)', () => {
    expect(ratioDelMarc('16:9', 2)).toBeCloseTo(16 / 9);
    expect(ratioDelMarc('2:1', 2)).toBe(2);
    expect(ratioDelMarc('original', 1.25)).toBe(1.25);
    expect(ratioDelMarc('original', null)).toBeNull();
    expect(ratioDelMarc('quadrat', 1)).toBeNull();
    expect(FORMATS.every((f) => f.valor === 'original' || ratioDelMarc(f.valor, 1) === f.ratio)).toBe(true);
  });
});

describe('retallCssDelZoom · la foto ampliada no ix de la seua caixa', () => {
  test('les vores de l’inset, transformades amb scale(zoom) al voltant del punt, cauen a les vores de la caixa', () => {
    for (const [x, y, zoom] of [[50, 50, 2], [12.5, 80, 1.5], [0, 100, 4], [73.21, 4.4, 3.3]]) {
      const inset = retallCssDelZoom({ x, y, zoom });
      const [dalt, dreta, baix, esquerra] = /^inset\((.+)\)$/.exec(inset)[1].split(' ').map((v) => Number.parseFloat(v));
      const transforma = (p, o) => o + zoom * (p - o);
      expect(transforma(esquerra, x)).toBeCloseTo(0, 2);
      expect(transforma(100 - dreta, x)).toBeCloseTo(100, 2);
      expect(transforma(dalt, y)).toBeCloseTo(0, 2);
      expect(transforma(100 - baix, y)).toBeCloseTo(100, 2);
    }
  });

  test('sense ampliació, cap clip (el focus no es retalla)', () => {
    expect(retallCssDelZoom({ x: 50, y: 50, zoom: 1 })).toBeNull();
    expect(retallCssDelZoom(null)).toBeNull();
  });
});
