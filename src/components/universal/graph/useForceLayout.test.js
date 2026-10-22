/* Gauntlet 261022_0225 (crítica Claude, F1) · La repulsió del graf: exacta
   (i idèntica a la d'abans) fins a LLINDAR_EXACTE nodes, i Barnes-Hut per
   damunt, amb un error de força xicotet i sense penjar-se amb nodes al mateix
   punt. */
import { describe, expect, test, vi } from 'vitest';
import { LLINDAR_EXACTE, aplicaRepulsio } from './useForceLayout';

/* La suma de tots amb tots tal com era abans del Gauntlet (useForceLayout.js:70-97). */
function repulsioDAbans(nodes, repulsio) {
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distSq = dx * dx + dy * dy;
      if (distSq === 0) {
        dx = (Math.random() - 0.5) * 10;
        dy = (Math.random() - 0.5) * 10;
        distSq = dx * dx + dy * dy;
      }
      const dist = Math.sqrt(distSq);
      const force = repulsio / Math.max(distSq, 100);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }
}

/* Posicions pseudoaleatòries però fixes (cap punt repetit). */
function nodesFixos(n, escampa = 3000) {
  let llavor = 20261022;
  const aleatori = () => { llavor = (llavor * 1103515245 + 12345) % 2147483648; return llavor / 2147483648; };
  return Array.from({ length: n }, (_, i) => ({ id: `n${i}`, x: aleatori() * escampa, y: aleatori() * escampa, vx: 0, vy: 0 }));
}
const copia = (nodes) => nodes.map((node) => ({ ...node }));

describe('aplicaRepulsio', () => {
  test.each([[2], [300], [LLINDAR_EXACTE]])('amb %i nodes és la suma exacta d’abans, bit a bit', (n) => {
    const base = nodesFixos(n, 800);
    const ara = copia(base);
    const abans = copia(base);
    aplicaRepulsio(ara, 800);
    repulsioDAbans(abans, 800);
    expect(ara).toEqual(abans);
  });

  test('per damunt del llindar, Barnes-Hut s’acosta a la suma exacta (error mitjà < 5 %)', () => {
    for (const escampa of [600, 3000]) {
      const base = nodesFixos(3000, escampa);
      const ara = copia(base);
      const exacta = copia(base);
      aplicaRepulsio(ara, 800);
      repulsioDAbans(exacta, 800);
      let error = 0;
      let modul = 0;
      for (let i = 0; i < base.length; i++) {
        error += Math.hypot(ara[i].vx - exacta[i].vx, ara[i].vy - exacta[i].vy);
        modul += Math.hypot(exacta[i].vx, exacta[i].vy);
      }
      expect(error / modul).toBeLessThan(0.05);
      // Només suma velocitats: cap posició es mou en este pas.
      expect(ara.map(({ x, y }) => [x, y])).toEqual(base.map(({ x, y }) => [x, y]));
    }
  });

  test('amb molts nodes al mateix punt, s’acaba i dona velocitats finites', () => {
    /* Un node lluny eixampla la caixa: la pila passa pel quadtree i el límit de profunditat. */
    const nodes = Array.from({ length: LLINDAR_EXACTE + 200 }, (_, i) => ({ id: `n${i}`, x: i % 2 ? 10 : 10 + 1e-9, y: 10, vx: 0, vy: 0 }));
    nodes.push({ id: 'lluny', x: 5000, y: 5000, vx: 0, vy: 0 });
    aplicaRepulsio(nodes, 800);
    expect(nodes.every((node) => Number.isFinite(node.vx) && Number.isFinite(node.vy))).toBe(true);
  });

  /* REV-ESTRES-6 · Tots al mateix punt: la suma exacta, no una fulla amb cada parella dues vegades. */
  test('si tots els nodes són al mateix punt, és la suma exacta d’abans', () => {
    let pas = 0;
    const aleatori = vi.spyOn(Math, 'random').mockImplementation(() => ((pas++ * 0.618034) % 1));
    try {
      const base = Array.from({ length: LLINDAR_EXACTE + 50 }, (_, i) => ({ id: `n${i}`, x: 0, y: 0, vx: 0, vy: 0 }));
      const ara = copia(base);
      const abans = copia(base);
      pas = 0;
      aplicaRepulsio(ara, 800);
      pas = 0;
      repulsioDAbans(abans, 800);
      expect(ara).toEqual(abans);
    } finally {
      aleatori.mockRestore();
    }
  });
});
