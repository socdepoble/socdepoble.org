// @vitest-environment node
/* Arbre Genealògic · la llei «Cognom ≠ Parentiu»: compartir cognom no crea
   ni confirma cap vincle; l'estat del vincle el dona l'evidència. */
import { describe, expect, test } from 'vitest';
import { complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { avisosCognom, estatDeVincle, MAX_AVISOS_COGNOM, mateixCognom, normalitzaCognom, verificaVincle } from './parentiu.js';

describe('Cognom ≠ Parentiu', () => {
  test('estatDeVincle: font escrita → confirmat; memòria oral → aproximat; si no, falta confirmar', () => {
    expect(estatDeVincle({ fontEscrita: true, vincleExplicit: true })).toBe('confirmat');
    expect(estatDeVincle({ memoriaOral: true, vincleExplicit: true })).toBe('aproximat');
    expect(estatDeVincle({ fontEscrita: true, memoriaOral: true })).toBe('falta-confirmar');
    expect(estatDeVincle(null)).toBe('falta-confirmar');
    expect(estatDeVincle({ fontEscrita: 'true', vincleExplicit: 1 })).toBe('falta-confirmar');
  });

  test('mateixCognom normalitza accents, majúscules i espais, i mira els dos cognoms', () => {
    expect(mateixCognom({ cognom1: 'Martí' }, { cognom1: ' marti ' })).toBe(true);
    expect(mateixCognom({ cognom1: 'Pérez', cognom2: 'Soler' }, { cognom1: 'Soler' })).toBe(true);
    expect(mateixCognom({ cognom1: 'Pérez' }, { cognom1: 'Peris' })).toBe(false);
    expect(mateixCognom({ cognom1: '' }, { cognom1: '' })).toBe(false);
  });

  test('el mateix cognom sense vincle explícit no és parentiu', () => {
    const a = { cognom1: 'Prova' };
    const b = { cognom1: 'Prova' };
    expect(verificaVincle(a, b, {})).toEqual({ vincleValid: false, estat: 'falta-confirmar', motiu: 'cognom-no-es-parentiu' });
    expect(verificaVincle(a, { cognom1: 'Altre' }, {})).toMatchObject({ vincleValid: false, motiu: 'sense-vincle' });
    expect(verificaVincle(a, b, { fontEscrita: true, vincleExplicit: true })).toEqual({ vincleValid: true, estat: 'confirmat', motiu: 'font-documental' });
    expect(verificaVincle(a, b, { memoriaOral: true, vincleExplicit: true })).toEqual({ vincleValid: true, estat: 'aproximat', motiu: 'memoria-oral' });
  });

  test('avisosCognom: només parelles que l’arbre no connecta, i mai crea relacions', () => {
    const c = complet(
      [persona(1, { cognom1: 'Prova' }), persona(2, { cognom1: 'Prova' }), persona(3, { cognom1: 'Prova' }), persona(4, { cognom1: 'Altre' })],
      [rel(10, 'progenitor', 1, 2)]
    );
    const abans = JSON.stringify(c);
    expect(avisosCognom(c)).toEqual([{ a: uid(1), b: uid(3) }, { a: uid(2), b: uid(3) }]);
    expect(JSON.stringify(c)).toBe(abans);
    expect(c.relacions).toHaveLength(1);
  });

  test('l’avantpassat amb el mateix cognom, connectat per l’arbre, no avisa', () => {
    const c = complet([persona(1, { cognom1: 'Prova' }), persona(2), persona(3, { cognom1: 'Prova' })], [rel(10, 'progenitor', 1, 2), rel(11, 'progenitor', 2, 3)]);
    expect(avisosCognom(c)).toEqual([]);
  });

  /* v1.2.15 · Node 0 R796 · avisosCognom era O(n²) per cognom: les parelles ja connectades no comptaven per al tall
     de MAX_AVISOS_COGNOM i es comparaven una a una (3,6 s amb 3.000 persones connectades amb el mateix cognom). Ara
     se salten a blocs. Referència: l'algorisme d'abans, en literal, per a comprovar que l'eixida és idèntica. */
  const referencia = (c) => {
    const pare = new Map(c.persones.map((p) => [p.id, p.id]));
    const arrel = (id) => { let x = id; while (pare.get(x) !== x) x = pare.get(x); return x; };
    for (const r of c.relacions) {
      if (!pare.has(r.de) || !pare.has(r.a)) continue;
      const x = arrel(r.de); const y = arrel(r.a);
      if (x !== y) pare.set(x < y ? y : x, x < y ? x : y);
    }
    const perCognom = new Map();
    for (const p of c.persones) {
      for (const cg of new Set([p.cognom1, p.cognom2].map(normalitzaCognom).filter(Boolean))) {
        if (!perCognom.has(cg)) perCognom.set(cg, []);
        perCognom.get(cg).push(p.id);
      }
    }
    const vistes = new Set(); const avisos = [];
    for (const cg of [...perCognom.keys()].sort()) {
      const ids = [...perCognom.get(cg)].sort();
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          if (avisos.length >= MAX_AVISOS_COGNOM) return avisos;
          const clau = `${ids[i]}|${ids[j]}`;
          if (vistes.has(clau) || arrel(ids[i]) === arrel(ids[j])) continue;
          vistes.add(clau); avisos.push({ a: ids[i], b: ids[j] });
        }
      }
    }
    return avisos.sort((x, y) => (x.a === y.a ? (x.b < y.b ? -1 : 1) : (x.a < y.a ? -1 : 1)));
  };

  test('R796 · la mateixa eixida que l’algorisme d’abans en arbres aleatoris (components entrellaçats, dos cognoms i el tall)', () => {
    let llavor = 7;
    const aleatori = (n) => { llavor = (llavor * 1103515245 + 12345) % 2147483648; return llavor % n; };
    const COGNOMS = ['Prova', 'Martí', 'marti', 'Ferrer', 'Soler'];
    for (let cas = 0; cas < 40; cas += 1) {
      const n = 5 + aleatori(cas < 35 ? 60 : 400);
      const persones = Array.from({ length: n }, (_, i) => persona(i + 1, {
        cognom1: COGNOMS[aleatori(COGNOMS.length)], ...(aleatori(2) ? { cognom2: COGNOMS[aleatori(COGNOMS.length)] } : {}),
      }));
      const relacions = [];
      for (let k = 0; k < aleatori(n); k += 1) {
        const de = 1 + aleatori(n); const a = 1 + aleatori(n);
        if (de !== a) relacions.push(rel(10000 + k, 'progenitor', de, a));
      }
      const c = complet(persones, relacions);
      expect(avisosCognom(c), `cas ${cas}`).toEqual(referencia(c));
    }
  });

  test('R796 · 20.000 persones connectades amb el mateix cognom (MAX_PERSONES) no costen O(n²)', () => {
    const persones = Array.from({ length: 20000 }, (_, i) => persona(i + 1, { cognom1: 'Prova' }));
    const relacions = persones.slice(1).map((_, i) => rel(100000 + i, 'progenitor', i + 1, i + 2));
    const c = complet(persones, relacions);
    const inici = performance.now();
    expect(avisosCognom(c)).toEqual([]);
    // Abans: uns 70 s (quadràtic; 3,6 s amb 3.000). Ara, mil·lisegons; el marge cobrix una màquina carregada.
    expect(performance.now() - inici).toBeLessThan(5000);
  }, 30000);
});
