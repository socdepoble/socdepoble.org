/* T7 (P2) · graella.js: els llindars i els camins de plegat de la closca.
   La fórmula de referència és la que AppGridShell.jsx portava escrita a mà
   abans del T7: el mòdul ha de donar exactament les mateixes mides. */
import { describe, expect, test } from 'vitest';
import { COLUMNES, PUNTS_DE_TALL, amplariaMinimaAmple, columnesTancades, midaDeGraella, minimsDeGraella, navegacioPlegadaDeLaFinestra, navegacioPlegadaEnArrencar, pistesAjustades } from './graella.js';

const PER_DEFECTE = { left: 260, middle: 280 };
const AMPLES = { left: 420, middle: 520 };

/* AppGridShell.jsx abans del T7 (measure), amb la frontera de la decisió 1
   del Mestre (30-10-2026 ~15:00): 720 justos ja són «estret» (abans, w < 720). */
function midaDAbans(w, { left, middle }, cw) {
  const actualLeft = left ? 56 : cw.left;
  const actualMiddle = middle ? 56 : cw.middle;
  const minAmple = Math.max(900, actualLeft + actualMiddle + 320 + 1 * 2);
  if (w <= 720) return 'estret';
  if (w < minAmple) return 'mitja';
  return 'ample';
}

describe('PUNTS_DE_TALL', () => {
  test('els números de sempre, congelats', () => {
    expect(PUNTS_DE_TALL).toEqual({ estret: 720, ample: 900, plegada: 56, detall: 320, separador: 1, eines: 500, compacte: 1023 });
    expect(Object.isFrozen(PUNTS_DE_TALL)).toBe(true);
    expect(COLUMNES).toEqual(['left', 'middle', 'right']);
  });
});

/* Ordre del Mestre (30-10-2026, Bloc de Notes) · «Si l'amplària de la
   finestra està en la franja intermèdia estreta (721 px – 1023 px)»,
   l'UniversalWorkspace arrenca amb la navegació plegada en rail; «amb les 3
   columnes obertes a partir de 1024 px». Fins a 720 és la vista mòbil. */
describe('navegacioPlegadaEnArrencar', () => {
  test('plega de 721 a 1023, les dues vores incloses; ni a 720 ni a 1024', () => {
    expect([375, 720, 721, 760, 900, 1023, 1024, 1440].map(navegacioPlegadaEnArrencar))
      .toEqual([false, false, true, true, true, true, false, false]);
  });

  test('les vores són les de PUNTS_DE_TALL (estret i compacte), no cap número propi', () => {
    expect(navegacioPlegadaEnArrencar(PUNTS_DE_TALL.estret)).toBe(false);
    expect(navegacioPlegadaEnArrencar(PUNTS_DE_TALL.estret + 1)).toBe(true);
    expect(navegacioPlegadaEnArrencar(PUNTS_DE_TALL.compacte)).toBe(true);
    expect(navegacioPlegadaEnArrencar(PUNTS_DE_TALL.compacte + 1)).toBe(false);
  });

  test('sense una amplària vàlida no plega res', () => {
    expect([undefined, null, NaN, 'ample', -1].map(navegacioPlegadaEnArrencar)).toEqual([false, false, false, false, false]);
  });

  test('navegacioPlegadaDeLaFinestra llig la finestra d’ara', () => {
    const finestra = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    try {
      const mesures = [900, 1024, 720].map((amplada) => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => amplada });
        return navegacioPlegadaDeLaFinestra();
      });
      expect(mesures).toEqual([true, false, false]);
    } finally {
      if (finestra) Object.defineProperty(window, 'innerWidth', finestra);
      else delete window.innerWidth;
    }
  });
});

describe('midaDeGraella', () => {
  test('els llindars amb les amplàries per defecte: 720 i 900', () => {
    expect(midaDeGraella(0, {}, PER_DEFECTE)).toBe('estret');
    expect(midaDeGraella(719, {}, PER_DEFECTE)).toBe('estret');
    /* Decisió 1 del Mestre (30-10-2026 ~15:00): «<= 720 px per a vista
       mòbil». Abans, 720 justos eren «mitja» i la CSS (max-width: 720px) ja
       pintava el mòbil. */
    expect(midaDeGraella(720, {}, PER_DEFECTE)).toBe('estret');
    expect(midaDeGraella(721, {}, PER_DEFECTE)).toBe('mitja');
    expect(midaDeGraella(899, {}, PER_DEFECTE)).toBe('mitja');
    expect(midaDeGraella(900, {}, PER_DEFECTE)).toBe('ample');
  });

  test('columnes desades amples pugen la mínima; plegar-ne una la torna a baixar', () => {
    expect(amplariaMinimaAmple({}, AMPLES)).toBe(420 + 520 + 320 + 2);
    expect(midaDeGraella(1000, {}, AMPLES)).toBe('mitja');
    expect(amplariaMinimaAmple({ left: true }, AMPLES)).toBe(900);
    expect(midaDeGraella(1000, { left: true }, AMPLES)).toBe('ample');
    expect(amplariaMinimaAmple({ left: true, middle: true }, AMPLES)).toBe(900);
  });

  test('sense amplàries ni plegat, la mínima és la d’«ample»', () => {
    expect(amplariaMinimaAmple()).toBe(PUNTS_DE_TALL.ample);
    expect(midaDeGraella(950)).toBe('ample');
  });

  test('dona les mateixes mides que la fórmula d’abans del T7', () => {
    const plegats = [{}, { left: true }, { middle: true }, { left: true, middle: true }];
    for (const amplades of [PER_DEFECTE, AMPLES, { left: 210, middle: 250 }, { left: 300, middle: 340 }]) {
      for (const plegades of plegats) {
        for (let w = 0; w <= 1600; w += 7) {
          expect(midaDeGraella(w, plegades, amplades), `${w} ${JSON.stringify(plegades)} ${JSON.stringify(amplades)}`)
            .toBe(midaDAbans(w, { left: false, middle: false, ...plegades }, amplades));
        }
      }
    }
  });
});

/* Ordre del Mestre (30-10-2026 ~12:45) · Fora de mòbil, l'UniversalWorkspace
   manté sempre les tres columnes fixes: amb columnesFixes, mai «mitja». */
describe('midaDeGraella amb columnesFixes', () => {
  test('per damunt d’«estret», sempre «ample», amb les desades que siguen; per davall, «estret»', () => {
    for (const amplada of [721, 764, 800, 820, 899, 943, 1180]) {
      expect([amplada, midaDeGraella(amplada, {}, PER_DEFECTE, { columnesFixes: true })]).toEqual([amplada, 'ample']);
      expect([amplada, midaDeGraella(amplada, {}, AMPLES, { columnesFixes: true })]).toEqual([amplada, 'ample']);
    }
    expect(midaDeGraella(719, {}, PER_DEFECTE, { columnesFixes: true })).toBe('estret');
    /* Decisió 1 del Mestre (30-10-2026 ~15:00): 720 justos, mòbil. */
    expect(midaDeGraella(720, {}, PER_DEFECTE, { columnesFixes: true })).toBe('estret');
    expect(midaDeGraella(720, { left: true, middle: true }, PER_DEFECTE, { columnesFixes: true })).toBe('estret');
    expect(midaDeGraella(375, { left: true, middle: true }, PER_DEFECTE, { columnesFixes: true })).toBe('estret');
  });

  test('sense l’opció (el Xat, les apps), la mida d’abans: 800 amb les desades per defecte és «mitja»', () => {
    expect(midaDeGraella(800, {}, PER_DEFECTE)).toBe('mitja');
    expect(midaDeGraella(800, {}, PER_DEFECTE, { columnesFixes: false })).toBe('mitja');
  });
});

describe('pistesAjustades', () => {
  const MINIMS = { left: 200, middle: 240 };

  test('si hi caben amb el detall i els separadors, les desades sense tocar', () => {
    expect(pistesAjustades(1180, {}, PER_DEFECTE, MINIMS)).toEqual(PER_DEFECTE);
    /* 260 + 280 + 320 + 2 = 862: just hi caben. */
    expect(pistesAjustades(862, {}, PER_DEFECTE, MINIMS)).toEqual(PER_DEFECTE);
  });

  test('si no hi caben, cada columna cedix l’excés en proporció al seu marge i el detall conserva el mínim', () => {
    /* 800: espai 478 per a 540, excés 62; marges 60 i 40. */
    const a800 = pistesAjustades(800, {}, PER_DEFECTE, MINIMS);
    expect(a800).toEqual({ left: 222, middle: 256 });
    expect(800 - a800.left - a800.middle - PUNTS_DE_TALL.separador * 2).toBe(PUNTS_DE_TALL.detall);
    const a820 = pistesAjustades(820, {}, PER_DEFECTE, MINIMS);
    expect(a820).toEqual({ left: 234, middle: 264 });
  });

  test('mai per davall del mínim de cada columna: llavors s’estreny el detall', () => {
    expect(pistesAjustades(721, {}, PER_DEFECTE, MINIMS)).toEqual(MINIMS);
    expect(pistesAjustades(721, {}, AMPLES, MINIMS)).toEqual(MINIMS);
  });

  test('una columna plegada és el rail: la desplegada cedix sola, i la plegada conserva la desada', () => {
    /* Navegació plegada a 800: 56 + 280 + 322 = 658, hi cap. */
    expect(pistesAjustades(800, { left: true }, PER_DEFECTE, MINIMS)).toEqual(PER_DEFECTE);
    /* A 721 amb la llista ampla: espai 721 − 56 − 322 = 343 per a 520. */
    expect(pistesAjustades(721, { left: true }, AMPLES, MINIMS)).toEqual({ left: 420, middle: 343 });
    expect(pistesAjustades(721, { left: true, middle: true }, AMPLES, MINIMS)).toEqual(AMPLES);
  });

  test('sense amplària mesurada (0) o sense marge, les desades', () => {
    expect(pistesAjustades(0, {}, PER_DEFECTE, MINIMS)).toEqual(PER_DEFECTE);
    expect(pistesAjustades(600, {}, MINIMS, MINIMS)).toEqual(MINIMS);
  });
});

/* Gauntlet 261030 (cicle 4) · De 720 a 761 amb navegació i llista obertes,
   els mínims (200 + 240 + 320 + 2 = 762) no hi caben: valen els sòls, el
   detall conserva el seu mínim i els separadors no queden congelats. */
describe('minimsDeGraella i pistesAjustades amb sòls', () => {
  const MINIMS = { left: 200, middle: 240 };
  const SOLS = { left: 160, middle: 180 };
  const detall = (amplada, p) => amplada - p.left - p.middle - PUNTS_DE_TALL.separador * 2;

  test('els mínims valen mentre hi caben; per davall de 762 amb les dues obertes, els sòls', () => {
    expect(minimsDeGraella(762, {}, MINIMS, SOLS)).toEqual(MINIMS);
    expect(minimsDeGraella(800, {}, MINIMS, SOLS)).toEqual(MINIMS);
    expect(minimsDeGraella(761, {}, MINIMS, SOLS)).toEqual(SOLS);
    expect(minimsDeGraella(720, {}, MINIMS, SOLS)).toEqual(SOLS);
    /* Amb una plegada, la desplegada hi cap: 721 − 56 − 322 = 343. */
    expect(minimsDeGraella(721, { left: true }, MINIMS, SOLS)).toEqual(MINIMS);
    expect(minimsDeGraella(0, {}, MINIMS, SOLS)).toEqual(MINIMS);
    expect(minimsDeGraella(740, {}, MINIMS)).toEqual(MINIMS);
  });

  test('per davall de 762 cedixen fins als sòls i el detall conserva el mínim, sense salt a 762', () => {
    expect(pistesAjustades(762, {}, PER_DEFECTE, MINIMS, SOLS)).toEqual(MINIMS);
    expect(pistesAjustades(761, {}, PER_DEFECTE, MINIMS, SOLS)).toEqual({ left: 199, middle: 240 });
    for (const amplada of [720, 721, 740, 744, 761]) {
      const p = pistesAjustades(amplada, {}, PER_DEFECTE, MINIMS, SOLS);
      expect([amplada, detall(amplada, p)]).toEqual([amplada, PUNTS_DE_TALL.detall]);
      expect(p.left >= SOLS.left && p.middle >= SOLS.middle).toBe(true);
    }
    expect(pistesAjustades(740, {}, PER_DEFECTE, MINIMS, SOLS)).toEqual({ left: 191, middle: 227 });
    expect(pistesAjustades(740, {}, AMPLES, MINIMS, SOLS)).toEqual({ left: 191, middle: 227 });
    /* Per damunt de 762, les xifres de sempre. */
    expect(pistesAjustades(800, {}, PER_DEFECTE, MINIMS, SOLS)).toEqual({ left: 222, middle: 256 });
  });

  test('una desada per davall del mínim (arrossegada en estret) es pinta al mínim que val ara', () => {
    const estreta = { left: 170, middle: 258 };
    expect(pistesAjustades(1180, {}, estreta, MINIMS, SOLS)).toEqual({ left: 200, middle: 258 });
    expect(pistesAjustades(740, {}, estreta, MINIMS, SOLS)).toEqual({ left: 170, middle: 248 });
    /* La plegada conserva la seua desada. */
    expect(pistesAjustades(1180, { left: true }, estreta, MINIMS, SOLS)).toEqual(estreta);
  });
});

describe('columnesTancades', () => {
  test('ample: cap; mitjà: la navegació si no és el panell; estret: tot el que no és el panell', () => {
    expect(columnesTancades('ample', null)).toEqual({ left: false, middle: false, right: false });
    expect(columnesTancades('mitja', null)).toEqual({ left: true, middle: false, right: false });
    expect(columnesTancades('mitja', 'left')).toEqual({ left: false, middle: false, right: false });
    expect(columnesTancades('estret', null)).toEqual({ left: true, middle: true, right: false });
    expect(columnesTancades('estret', 'left')).toEqual({ left: false, middle: true, right: true });
    expect(columnesTancades('estret', 'middle')).toEqual({ left: true, middle: false, right: true });
  });
});

/* Decisió 3 del Mestre (30-10-2026 ~15:00: «entre 721 i 761 px ... les 3
   columnes hi càpiguen sense desbordament horitzontal») · Amb navegació i
   llista obertes, per a qualsevol amplada desada (la clau sdp-grid-widths és
   compartida: compacta, per defecte, ampla, les màximes i les mínimes), les
   pistes, els dos separadors i el detall cabem en la closca, i el detall no
   baixa del seu mínim (PUNTS_DE_TALL.detall). */
describe('de 721 a 761, cap desbordament horitzontal', () => {
  const MINIMS = { left: 200, middle: 240 };
  const SOLS = { left: 160, middle: 180 };
  const DESADES = [
    { left: 210, middle: 250 }, PER_DEFECTE, { left: 300, middle: 340 },
    { left: 340, middle: 520 }, MINIMS
  ];
  test.each([721, 730, 744, 761])('a %i les tres columnes hi caben amb el detall de 320', (amplada) => {
    for (const desades of DESADES) {
      for (const plegades of [{}, { left: true }, { middle: true }]) {
        const p = pistesAjustades(amplada, plegades, desades, MINIMS, SOLS);
        const ocupat = (plegades.left ? PUNTS_DE_TALL.plegada : p.left)
          + (plegades.middle ? PUNTS_DE_TALL.plegada : p.middle)
          + PUNTS_DE_TALL.separador * 2;
        const cas = `${amplada} ${JSON.stringify(desades)} ${JSON.stringify(plegades)}`;
        expect(amplada - ocupat, cas).toBeGreaterThanOrEqual(PUNTS_DE_TALL.detall);
      }
    }
  });
});
