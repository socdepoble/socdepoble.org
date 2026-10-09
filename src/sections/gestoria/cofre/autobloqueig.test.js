// @vitest-environment node
/* El vigilant de l'autobloqueig del cofre (Onada 6, ordre del Mestre,
   261009: cofre xifrat). Rellotge i temporitzadors simulats: el temps només
   avança quan la prova ho diu, i un «son» de l'ordinador és avançar el
   rellotge sense disparar cap temporitzador. La finestra i el document són
   EventTarget de veres. */
import { describe, expect, test } from 'vitest';
import { TEMPS_AUTOBLOQUEIG, vigilaInactivitat } from './autobloqueig.js';

const MINUT = 60 * 1000;

function entornFals() {
  const finestra = new EventTarget();
  const doc = new EventTarget();
  doc.visibilityState = 'visible';
  finestra.document = doc;
  return finestra;
}

function creaTemporitzadors() {
  let ara = 5000000;
  let seguent = 1;
  const pendents = new Map();
  return {
    pendents,
    rellotge: () => ara,
    setTimeout: (fn, ms) => {
      const id = seguent++;
      pendents.set(id, { fn, quan: ara + Math.max(0, ms) });
      return id;
    },
    clearTimeout: (id) => {
      pendents.delete(id);
    },
    avanca(ms) {
      const fi = ara + ms;
      for (;;) {
        const proper = [...pendents].filter(([, t]) => t.quan <= fi).sort((a, b) => a[1].quan - b[1].quan)[0];
        if (!proper) break;
        pendents.delete(proper[0]);
        ara = proper[1].quan;
        proper[1].fn();
      }
      ara = fi;
    },
    /* L'ordinador dorm: el rellotge avança i cap temporitzador no salta. */
    dorm(ms) {
      ara += ms;
    }
  };
}

function munta() {
  const entorn = entornFals();
  const t = creaTemporitzadors();
  const motius = [];
  const vigilant = vigilaInactivitat({ bloqueja: (motiu) => motius.push(motiu), entorn, rellotge: t.rellotge, temporitzadors: t });
  const amaga = (oculta) => {
    entorn.document.visibilityState = oculta ? 'hidden' : 'visible';
    entorn.document.dispatchEvent(new Event('visibilitychange'));
  };
  return { entorn, t, motius, vigilant, amaga };
}

describe('els temps', () => {
  test('10 minuts d’inactivitat i 5 amagat', () => {
    expect(TEMPS_AUTOBLOQUEIG).toEqual({ inactivitat: 10 * MINUT, oculta: 5 * MINUT });
    expect(Object.isFrozen(TEMPS_AUTOBLOQUEIG)).toBe(true);
  });
});

describe('inactivitat', () => {
  test('sense cap activitat, als 10 minuts; una sola vegada', () => {
    const { t, motius, vigilant } = munta();
    t.avanca(10 * MINUT - 1);
    expect(motius).toEqual([]);
    t.avanca(1);
    expect(motius).toEqual(['inactivitat']);
    expect(vigilant.actiu).toBe(false);
    t.avanca(60 * MINUT);
    expect(motius).toEqual(['inactivitat']);
    expect(t.pendents.size).toBe(0);
  });

  test('cada tecla, punter, roda o toc torna a comptar', () => {
    const { entorn, t, motius } = munta();
    for (const tipus of ['keydown', 'pointerdown', 'wheel', 'touchstart']) {
      t.avanca(9 * MINUT);
      entorn.dispatchEvent(new Event(tipus));
    }
    expect(motius).toEqual([]);
    t.avanca(10 * MINUT);
    expect(motius).toEqual(['inactivitat']);
  });

  test('després d’un son més llarg que el límit, la primera activitat bloqueja en lloc de renovar', () => {
    const { entorn, t, motius } = munta();
    t.dorm(30 * MINUT);
    entorn.dispatchEvent(new Event('pointerdown'));
    expect(motius).toEqual(['inactivitat']);
  });

  test('en tornar (pageshow o focus) es revisa el rellotge', () => {
    const { entorn, t, motius } = munta();
    t.dorm(11 * MINUT);
    entorn.dispatchEvent(new Event('focus'));
    expect(motius).toEqual(['inactivitat']);
    const altre = munta();
    altre.t.dorm(12 * MINUT);
    altre.entorn.dispatchEvent(new Event('pageshow'));
    expect(altre.motius).toEqual(['inactivitat']);
  });
});

describe('pestanya amagada i pagehide', () => {
  test('amagada més de 5 minuts: es bloqueja encara que el temporitzador no salte', () => {
    const { t, motius, amaga } = munta();
    amaga(true);
    t.dorm(6 * MINUT);
    amaga(false);
    expect(motius).toEqual(['oculta']);
  });

  test('amagada 5 minuts amb el temporitzador viu: es bloqueja als 5', () => {
    const { t, motius, amaga } = munta();
    amaga(true);
    t.avanca(5 * MINUT - 1);
    expect(motius).toEqual([]);
    t.avanca(1);
    expect(motius).toEqual(['oculta']);
  });

  test('amagada menys de 5 minuts: tornar a la vista no bloqueja', () => {
    const { t, motius, amaga } = munta();
    amaga(true);
    t.avanca(4 * MINUT);
    amaga(false);
    t.avanca(2 * MINUT);
    expect(motius).toEqual([]);
  });

  test('pagehide bloqueja de colp', () => {
    const { entorn, motius } = munta();
    entorn.dispatchEvent(new Event('pagehide'));
    expect(motius).toEqual(['pagehide']);
  });
});

describe('aturar', () => {
  test('atura() lleva escoltes i temporitzadors: res no bloqueja després', () => {
    const { entorn, t, motius, vigilant, amaga } = munta();
    vigilant.atura();
    vigilant.atura();
    expect(vigilant.actiu).toBe(false);
    expect(t.pendents.size).toBe(0);
    entorn.dispatchEvent(new Event('pagehide'));
    amaga(true);
    t.avanca(60 * MINUT);
    expect(motius).toEqual([]);
  });

  test('sense finestra (entorn sense esdeveniments), el temporitzador d’inactivitat continua vigilant', () => {
    const t = creaTemporitzadors();
    const motius = [];
    vigilaInactivitat({ bloqueja: (motiu) => motius.push(motiu), entorn: {}, rellotge: t.rellotge, temporitzadors: t });
    t.avanca(10 * MINUT);
    expect(motius).toEqual(['inactivitat']);
    expect(() => vigilaInactivitat({ entorn: {} })).toThrow(TypeError);
  });
});
