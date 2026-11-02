// @vitest-environment node
/* IDEA-42 (B7h, marató 261101_2143; spec B7-PEDRA §2.9c) · posicioDeRetall:
   el punt focal { cx, cy, zoom } del diàleg → la posició CSS de la targeta
   16:9 (object-position = transform-origin = p, transform: scale(zoom)).
   La prova no es fia de la fórmula: reprodueix la geometria que pinta el
   navegador (object-fit: cover dins d'una caixa 16:9, posició p i escala al
   voltant de p) i comprova que es veu exactament el marc del diàleg. */
import { describe, expect, test } from 'vitest';
import { FORMATS, ZOOM_MAX, limita, lliscador, marcBase, posicioDeRetall, rectDeRetall } from './enquadrament.js';

const R169 = 16 / 9;

/* La finestra de la foto (en fraccions) que es veu en un eix: la caixa fa 1,
   la foto pintada en fa S (cover), desplaçada p·(1 − S) (object-position p) i
   escalada z al voltant del punt p de la caixa (transform-origin p). */
function finestra(p, S, z) {
  const foto = (x) => (x - p * (1 - S)) / S;
  const abansDeLEscala = (x) => p + (x - p) / z;
  return [foto(abansDeLEscala(0)), foto(abansDeLEscala(1))];
}
/* S de cada eix amb cover: el costat que sobreïx, la proporció de la foto partida per la de la caixa. */
const escales = (ratioFoto) => (ratioFoto > R169 ? { x: ratioFoto / R169, y: 1 } : { x: 1, y: R169 / ratioFoto });

describe('la geometria pintada ensenya el marc del diàleg', () => {
  const FOTOS = [[1376, 768], [723, 1024], [2000, 1000], [1600, 900], [1000, 1000], [900, 1600]];
  const ESTATS = [
    { cx: 0.5, cy: 0.5, zoom: 1 }, { cx: 0.2, cy: 0.8, zoom: 1 }, { cx: 0.31, cy: 0.27, zoom: 1.7 },
    { cx: 0.9, cy: 0.1, zoom: 2.5 }, { cx: 0, cy: 1, zoom: 3.2 }, { cx: 0.66, cy: 0.42, zoom: 1.25 }
  ];

  test.each(FOTOS)('foto %s × %s: el centre i la mida de la finestra són els del marc (limita), en tots dos eixos', (W, H) => {
    const S = escales(W / H);
    for (const estat of ESTATS) {
      const p = posicioDeRetall(estat, W / H);
      expect(p, JSON.stringify(estat)).not.toBeNull();
      /* El marc de referència, per definició (capçalera d'enquadrament.js): el
         rectangle 16:9 més gran dins de la foto, partit pel zoom (a [1, ZOOM_MAX];
         sense el mínim de 200 px, que demana píxels), centrat en c i dins de la foto. */
      const base = marcBase(W, H, R169);
      const zoom = Math.min(ZOOM_MAX, Math.max(1, estat.zoom));
      const dins = (c, m) => Math.min(1 - m, Math.max(m, c));
      const l = { zoom, cx: dins(estat.cx, base.w / zoom / W / 2), cy: dins(estat.cy, base.h / zoom / H / 2) };
      for (const [eix, c, costat, total, s] of [['x', l.cx, base.w, W, S.x], ['y', l.cy, base.h, H, S.y]]) {
        const [inici, fi] = finestra(p[eix] / 100, s, p.zoom);
        const mig = costat / l.zoom / total / 2;
        expect(fi - inici, `${eix} · ${JSON.stringify(estat)}`).toBeCloseTo(2 * mig, 3);
        expect((inici + fi) / 2, `${eix} · ${JSON.stringify(estat)}`).toBeCloseTo(c, 3);
        expect(inici).toBeGreaterThanOrEqual(-1e-3);
        expect(fi).toBeLessThanOrEqual(1 + 1e-3);
      }
      expect(p.zoom).toBeCloseTo(l.zoom, 3);
    }
  });

  test('coincidix amb el lliscador del diàleg (el mateix percentatge, sense arrodonir a enter)', () => {
    const [W, H] = [1376, 768];
    for (const estat of [{ cx: 0.31, cy: 0.5, zoom: 1 }, { cx: 0.7, cy: 0.35, zoom: 2 }]) {
      const e = limita({ format: '16:9', ...estat }, W, H);
      const p = posicioDeRetall(estat, W / H);
      expect(Math.round(p.x)).toBe(lliscador(e, 'x', W, H));
      expect(Math.round(p.y)).toBe(lliscador(e, 'y', W, H));
    }
  });

  test('el retall destructiu del diàleg (rectDeRetall) i la finestra de la targeta són la mateixa zona', () => {
    const [W, H] = [1376, 768];
    const estat = { cx: 0.4, cy: 0.45, zoom: 1.6 };
    const rect = rectDeRetall({ format: '16:9', ...estat }, W, H);
    const p = posicioDeRetall(estat, W / H);
    const S = escales(W / H);
    const [x0, x1] = finestra(p.x / 100, S.x, p.zoom);
    const [y0, y1] = finestra(p.y / 100, S.y, p.zoom);
    expect(x0 * W).toBeCloseTo(rect.x, -0.5);
    expect(x1 * W).toBeCloseTo(rect.x + rect.w, -0.5);
    expect(y0 * H).toBeCloseTo(rect.y, -0.5);
    expect(y1 * H).toBeCloseTo(rect.y + rect.h, -0.5);
  });
});

describe('límits i valors que no són de veres', () => {
  test('centrat i sense ampliar: 50 % 50 %, zoom 1', () => {
    expect(posicioDeRetall({ cx: 0.5, cy: 0.5, zoom: 1 }, 1376 / 768)).toEqual({ x: 50, y: 50, zoom: 1 });
  });

  test('l’eix que no sobreïx a zoom 1 es queda al 50 %, i els extrems van a 0 i 100', () => {
    expect(posicioDeRetall({ cx: 0, cy: 0, zoom: 1 }, 2)).toEqual({ x: 0, y: 50, zoom: 1 });
    expect(posicioDeRetall({ cx: 1, cy: 1, zoom: 1 }, 2)).toEqual({ x: 100, y: 50, zoom: 1 });
    expect(posicioDeRetall({ cx: 1, cy: 0, zoom: 1 }, 723 / 1024)).toEqual({ x: 50, y: 0, zoom: 1 });
  });

  test('el zoom es retalla a [1, ZOOM_MAX] i x i y no ixen mai de [0, 100]', () => {
    expect(posicioDeRetall({ cx: 0.5, cy: 0.5, zoom: 99 }, 1.5).zoom).toBe(ZOOM_MAX);
    expect(posicioDeRetall({ cx: 0.5, cy: 0.5, zoom: 0.1 }, 1.5).zoom).toBe(1);
    for (const [cx, cy] of [[-5, 7], [3, -2], [1e9, -1e9]]) {
      const p = posicioDeRetall({ cx, cy, zoom: 2 }, 1.5);
      for (const v of [p.x, p.y]) expect(v >= 0 && v <= 100).toBe(true);
    }
  });

  test('dos decimals com a molt (una cadena CSS estable)', () => {
    const p = posicioDeRetall({ cx: 0.123456, cy: 0.654321, zoom: 1.234567 }, 1376 / 768);
    for (const v of [p.x, p.y]) expect(Math.round(v * 100) / 100).toBe(v);
    expect(p.zoom).toBe(1.2346);
  });

  test.each([
    ['sense punt', null], ['un text', '50% 50%'], ['cx en text', { cx: '0.5', cy: 0.5, zoom: 1 }],
    ['cx NaN', { cx: Number.NaN, cy: 0.5, zoom: 1 }], ['zoom infinit', { cx: 0.5, cy: 0.5, zoom: Number.POSITIVE_INFINITY }],
    ['sense zoom', { cx: 0.5, cy: 0.5 }], ['una injecció', { cx: 'calc(1px); color: red', cy: 0.5, zoom: 1 }]
  ])('%s → null', (_, punt) => {
    expect(posicioDeRetall(punt, 1.5)).toBeNull();
  });

  test.each([null, undefined, 0, -1.5, Number.NaN, Number.POSITIVE_INFINITY, '1.5'])('sense una proporció de foto de veres (%s) → null (la targeta, centrada)', (ratio) => {
    expect(posicioDeRetall({ cx: 0.5, cy: 0.5, zoom: 1 }, ratio)).toBeNull();
  });

  test('un format sense proporció fixa (original) o desconegut → null; un altre de FORMATS, el seu', () => {
    expect(posicioDeRetall({ cx: 0.5, cy: 0.5, zoom: 1 }, 1.5, 'original')).toBeNull();
    expect(posicioDeRetall({ cx: 0.5, cy: 0.5, zoom: 1 }, 1.5, '7:3')).toBeNull();
    expect(FORMATS.some((f) => f.valor === '1:1')).toBe(true);
    expect(posicioDeRetall({ cx: 0, cy: 0.5, zoom: 1 }, 2, '1:1')).toEqual({ x: 0, y: 50, zoom: 1 });
  });

  test('un punt que no es deixa llegir (getter o Proxy que llancen) → null, sense llançar', () => {
    expect(posicioDeRetall({ get cx() { throw new Error('trampa'); }, cy: 0.5, zoom: 1 }, 1.5)).toBeNull();
    expect(posicioDeRetall(new Proxy({}, { get() { throw new Error('trampa'); } }), 1.5)).toBeNull();
  });
});
