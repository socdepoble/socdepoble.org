// @vitest-environment node
/* Arbre Genealògic · la llei «Cognom ≠ Parentiu»: compartir cognom no crea
   ni confirma cap vincle; l'estat del vincle el dona l'evidència. */
import { describe, expect, test } from 'vitest';
import { complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { avisosCognom, estatDeVincle, mateixCognom, verificaVincle } from './parentiu.js';

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
});
