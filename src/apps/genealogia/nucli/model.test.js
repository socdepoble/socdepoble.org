// @vitest-environment node
/* Arbre Genealògic · la llista blanca del model: valors per defecte, camps
   desconeguts fora, coacció, claus perilloses i índexs. */
import { describe, expect, test } from 'vitest';
import { ANY, ARA, ARBRE_ID, complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { creaPersona, creaRelacio, indexa, netejaArbre, netejaEntrevista, netejaFont, netejaPersona, netejaRelacio } from './model.js';

describe('netejaPersona', () => {
  test('valors per defecte i camps desconeguts fora', () => {
    const p = netejaPersona({ id: uid(1), arbreId: ARBRE_ID, nom: ' Pere ', creada: ARA, modificada: ARA, colorPreferit: 'blau', privada: true }, { anyActual: ANY });
    expect(p).toEqual({
      id: uid(1), arbreId: ARBRE_ID, nom: 'Pere', cognom1: '', cognom2: '', malnom: '', casa: '', lloc: '', sexe: 'U',
      naixement: { precisio: 'desconeguda', any: null, mes: null, dia: null }, defuncio: null, viva: 'desconegut', ofici: '',
      generacio: null, estat: 'falta-confirmar', fonts: [], notes: '', origen: null, creada: ARA, modificada: ARA
    });
    expect(Object.hasOwn(p, 'privada')).toBe(false);
  });

  test('coacció i rebuig de valors no vàlids, amb el camp a l’error', () => {
    const base = { id: uid(1), arbreId: ARBRE_ID, creada: ARA, modificada: ARA };
    const llança = (camps, camp) => {
      try {
        netejaPersona({ ...base, ...camps }, { anyActual: ANY });
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
        expect(error.camp).toBe(camp);
        return;
      }
      throw new Error(`no ha llançat per a ${camp}`);
    };
    llança({ nom: { a: 1 } }, 'nom');
    llança({ sexe: 'X' }, 'sexe');
    llança({ viva: 'potser' }, 'viva');
    llança({ estat: '[CONFIRMAT]' }, 'estat');
    llança({ naixement: '1908-13' }, 'naixement');
    llança({ defuncio: 'ahir' }, 'defuncio');
    llança({ id: '../x' }, 'id');
    llança({ creada: 'ahir' }, 'creada');
    llança({ fonts: new Array(21).fill({ id: uid(9) }) }, 'fonts');
    expect(netejaPersona({ ...base, nom: 1908, naixement: '~1908' }, { anyActual: ANY })).toMatchObject({ nom: '1908', naixement: { precisio: 'aproximada', any: 1908 } });
  });

  test('una persona feta a partir d’un objecte amb __proto__ no contamina res', () => {
    const cru = JSON.parse(`{"id":"${uid(1)}","arbreId":"${ARBRE_ID}","creada":"${ARA}","modificada":"${ARA}","__proto__":{"admin":true}}`);
    const p = netejaPersona(cru, { anyActual: ANY });
    expect(p.admin).toBeUndefined();
    expect({}.admin).toBeUndefined();
  });
});

describe('netejaFont i netejaRelacio', () => {
  test('font: només https i arxiu amb forma de slug', () => {
    expect(netejaFont({ id: uid(5), tipus: 'parroquial', url: 'https://pares.cultura.gob.es/', arxiuId: 'pares', consultada: '2026-11-10' }))
      .toMatchObject({ tipus: 'parroquial', url: 'https://pares.cultura.gob.es/', arxiuId: 'pares', consultada: '2026-11-10' });
    expect(netejaFont({ id: uid(5) }).tipus).toBe('altra');
    expect(() => netejaFont({ id: uid(5), url: 'http://exemple.org' })).toThrow(TypeError);
    expect(() => netejaFont({ id: uid(5), arxiuId: 'PARES/../x' })).toThrow(TypeError);
    expect(() => netejaFont({ id: uid(5), tipus: 'rumor' })).toThrow(TypeError);
  });

  test('relació: de ≠ a, tipus tancat, estat derivat de l’evidència', () => {
    const r = creaRelacio({ id: uid(9), arbreId: ARBRE_ID, tipus: 'progenitor', de: uid(1), a: uid(2), evidencia: { fontEscrita: true, vincleExplicit: true }, ara: ARA });
    expect(r.estat).toBe('confirmat');
    expect(r.evidencia).toEqual({ fontEscrita: true, memoriaOral: false, vincleExplicit: true });
    expect(() => netejaRelacio({ ...r, a: uid(1) })).toThrow(TypeError);
    expect(() => netejaRelacio({ ...r, tipus: 'cosi' })).toThrow(TypeError);
    expect(netejaRelacio({ ...r, evidencia: { fontEscrita: 'si' } }).evidencia.fontEscrita).toBe(false);
  });
});

describe('arbre i entrevista', () => {
  test('netejaArbre', () => {
    expect(netejaArbre({ id: ARBRE_ID, titol: 'x'.repeat(200), creat: ARA, modificat: ARA, extra: 1 })).toEqual({
      id: ARBRE_ID, titol: 'x'.repeat(80), malnomCasa: '', poble: '', mas: '', arrelId: null, creat: ARA, modificat: ARA
    });
    expect(() => netejaArbre({ id: ARBRE_ID })).toThrow(TypeError);
  });

  test('netejaEntrevista: només passos coneguts i valors del seu tipus', () => {
    const neta = netejaEntrevista({ arbreId: ARBRE_ID, pas: 2, respostes: { casa: 'Ca la Prova', 'g4-jo': { nom: 'Anna', naixement: '1978', extra: 'x' } }, completada: false, modificada: null });
    expect(neta.respostes['g4-jo']).toEqual({ nom: 'Anna', cognom1: '', cognom2: '', naixement: '1978', lloc: '', ofici: '', viva: 'desconegut', difunta: false });
    expect(() => netejaEntrevista({ arbreId: ARBRE_ID, respostes: { inventat: 'x' } })).toThrow(TypeError);
    expect(() => netejaEntrevista({ arbreId: ARBRE_ID, respostes: { font: 'rumor' } })).toThrow(TypeError);
    expect(() => netejaEntrevista({ arbreId: ARBRE_ID, pas: 99 })).toThrow(TypeError);
    expect(() => netejaEntrevista({ arbreId: ARBRE_ID, respostes: { 'g1-besavi': [{ nom: 'X' }] } })).toThrow(TypeError);
  });
});

describe('indexa', () => {
  test('progenitors, fills i relacions, sense les puntes absents', () => {
    const c = complet([persona(1), persona(2), persona(3)], [rel(10, 'progenitor', 1, 3), rel(11, 'progenitor', 2, 3), rel(12, 'parella', 1, 2), rel(13, 'progenitor', 1, 99)]);
    const { perId, progenitorsDe, fillsDe, relacionsDe } = indexa(c);
    expect(perId.size).toBe(3);
    expect(progenitorsDe.get(uid(3))).toEqual([uid(1), uid(2)]);
    expect(fillsDe.get(uid(1))).toEqual([uid(3)]);
    expect(relacionsDe.get(uid(1)).map((r) => r.id)).toEqual([uid(10), uid(12)]);
  });

  test('creaPersona posa els valors de l’entrevista oral', () => {
    const p = creaPersona({ id: uid(1), arbreId: ARBRE_ID, ara: ARA, nom: 'Anna', naixement: '1978', viva: 'si' }, { anyActual: ANY });
    expect(p).toMatchObject({ estat: 'falta-confirmar', sexe: 'U', viva: 'si', naixement: { precisio: 'exacta', any: 1978 } });
  });
});
