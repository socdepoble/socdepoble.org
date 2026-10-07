/* Llei de la Roda Dentada (ordre del Mestre, 261007) · La preferència de les
   carpetes a la vista de cada espai de treball (carpetesVisibles.js): el
   patró de preferenciesApps.js (només es guarda el que està amagat, una sola
   clau de storage.js, còpia en memòria i oients). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { STORAGE_PREFIX, delVal, getVal, setVal } from '../../../config/storage.js';
import {
  AMAGADES_MAXIMES, CLAU_CARPETES_VISIBLES, ESPAIS_MAXIMS, ESPAI_COMU,
  _reiniciaCarpetesVisibles, carpetesAmagadesDe, desaCarpetaAmagada, espaiDe,
  esEspaiValid, llegeixCarpetesVisibles, normalitzaCarpetesVisibles, subscriuCarpetesVisibles
} from './carpetesVisibles.js';
import * as barril from './index.js';

beforeEach(() => {
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});
afterEach(() => {
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});

const desat = () => getVal(CLAU_CARPETES_VISIBLES, null);

describe('l’espai de treball', () => {
  test('el primer candidat vàlid; sense cap, l’espai comú', () => {
    expect(espaiDe('wiki', 'notes')).toBe('wiki');
    expect(espaiDe(undefined, 'notes')).toBe('notes');
    expect(espaiDe('Wiki', null, 'perfil')).toBe('perfil');
    expect(espaiDe(undefined, null)).toBe(ESPAI_COMU);
    expect(espaiDe('', 42, {}, 'amb espais')).toBe(ESPAI_COMU);
  });

  test('la forma és la de la clau del mestre-detall', () => {
    for (const valid of ['wiki', 'notes', 'disseny', 'perfil', 'a', 'gestoria-2']) expect([valid, esEspaiValid(valid)]).toEqual([valid, true]);
    for (const invalid of ['', 'Wiki', '2wiki', 'wiki_poble', 'x'.repeat(41), null, 7]) expect([invalid, esEspaiValid(invalid)]).toEqual([invalid, false]);
  });
});

describe('desar i llegir', () => {
  test('sense res desat, cap carpeta amagada (la mateixa referència buida)', () => {
    expect(carpetesAmagadesDe('notes')).toEqual({});
    expect(carpetesAmagadesDe('notes')).toBe(carpetesAmagadesDe('wiki'));
    expect(Object.isFrozen(carpetesAmagadesDe('notes'))).toBe(true);
  });

  test('només es guarda el que està amagat, i per espai', () => {
    desaCarpetaAmagada('notes', 'f-mur', true);
    desaCarpetaAmagada('notes', 'f-mercat', true);
    desaCarpetaAmagada('wiki', 'folder:ser', true);
    expect(desat()).toEqual({ v: 1, espais: { notes: { 'f-mur': false, 'f-mercat': false }, wiki: { 'folder:ser': false } } });
    expect({ ...carpetesAmagadesDe('notes') }).toEqual({ 'f-mur': false, 'f-mercat': false });
    expect({ ...carpetesAmagadesDe('wiki') }).toEqual({ 'folder:ser': false });
    expect({ ...carpetesAmagadesDe('disseny') }).toEqual({});

    /* Tornar-la a la vista és esborrar l'amagada; un espai buit desapareix. */
    desaCarpetaAmagada('notes', 'f-mur', false);
    desaCarpetaAmagada('wiki', 'folder:ser', false);
    expect(desat()).toEqual({ v: 1, espais: { notes: { 'f-mercat': false } } });
  });

  test('la clau és la de storage.js, amb el seu prefix', () => {
    desaCarpetaAmagada('perfil', 'jo', true);
    expect(STORAGE_PREFIX).toBe('sdp_embed_');
    expect(JSON.parse(globalThis.localStorage.getItem(`${STORAGE_PREFIX}${CLAU_CARPETES_VISIBLES}`))).toEqual({ v: 1, espais: { perfil: { jo: false } } });
  });

  test('es llig una vegada: la còpia en memòria i la mateixa referència mentre no canvia', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mur': false } } });
    const primera = carpetesAmagadesDe('notes');
    expect({ ...primera }).toEqual({ 'f-mur': false });
    expect(carpetesAmagadesDe('notes')).toBe(primera);
    /* Un canvi de fora no es veu fins que es reinicia (com preferenciesApps). */
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: {} });
    expect(carpetesAmagadesDe('notes')).toBe(primera);
    _reiniciaCarpetesVisibles();
    expect({ ...carpetesAmagadesDe('notes') }).toEqual({});
  });

  test('un canvi que no canvia res no escriu ni avisa', () => {
    const oient = vi.fn();
    const deixa = subscriuCarpetesVisibles(oient);
    desaCarpetaAmagada('notes', 'f-mur', false);
    expect(oient).not.toHaveBeenCalled();
    expect(desat()).toBeNull();
    desaCarpetaAmagada('notes', 'f-mur', true);
    desaCarpetaAmagada('notes', 'f-mur', true);
    expect(oient).toHaveBeenCalledTimes(1);
    deixa();
    desaCarpetaAmagada('notes', 'f-mur', false);
    expect(oient).toHaveBeenCalledTimes(1);
  });

  test('espais o ids no vàlids no canvien res', () => {
    desaCarpetaAmagada('Notes', 'f-mur', true);
    desaCarpetaAmagada('notes', '', true);
    desaCarpetaAmagada('notes', null, true);
    desaCarpetaAmagada('notes', 'x'.repeat(161), true);
    expect(desat()).toBeNull();
    expect({ ...carpetesAmagadesDe('Notes') }).toEqual({});
  });

  test('un id numèric es guarda com a text (els ids del Workspace ho són)', () => {
    desaCarpetaAmagada('wiki', 3, true);
    expect({ ...carpetesAmagadesDe('wiki') }).toEqual({ 3: false });
  });

  test('sense prototip: «constructor» i «__proto__» són ids i espais com qualsevol altre', () => {
    expect(carpetesAmagadesDe('constructor')).toEqual({});
    desaCarpetaAmagada('notes', 'constructor', true);
    desaCarpetaAmagada('notes', '__proto__', true);
    const amagades = carpetesAmagadesDe('notes');
    expect(Object.keys(amagades).sort()).toEqual(['__proto__', 'constructor']);
    expect(amagades.constructor).toBe(false);
    expect(amagades.toString).toBeUndefined();
    _reiniciaCarpetesVisibles();
    expect(Object.keys(carpetesAmagadesDe('notes')).sort()).toEqual(['__proto__', 'constructor']);
  });
});

describe('res que puga créixer', () => {
  test('com a molt AMAGADES_MAXIMES carpetes per espai', () => {
    for (let i = 0; i < AMAGADES_MAXIMES + 5; i += 1) desaCarpetaAmagada('notes', `c${i}`, true);
    expect(Object.keys(carpetesAmagadesDe('notes'))).toHaveLength(AMAGADES_MAXIMES);
    /* Tornar-ne una a la vista sempre es pot. */
    desaCarpetaAmagada('notes', 'c0', false);
    expect(Object.keys(carpetesAmagadesDe('notes'))).toHaveLength(AMAGADES_MAXIMES - 1);
  });

  test('com a molt ESPAIS_MAXIMS espais', () => {
    for (let i = 0; i < ESPAIS_MAXIMS + 3; i += 1) desaCarpetaAmagada(`espai-${i}`, 'mur', true);
    expect(Object.keys(llegeixCarpetesVisibles().espais)).toHaveLength(ESPAIS_MAXIMS);
    expect({ ...carpetesAmagadesDe(`espai-${ESPAIS_MAXIMS}`) }).toEqual({});
    /* Un espai que ja hi era encara pot amagar-ne més. */
    desaCarpetaAmagada('espai-0', 'mercat', true);
    expect({ ...carpetesAmagadesDe('espai-0') }).toEqual({ mur: false, mercat: false });
  });
});

describe('normalitzaCarpetesVisibles', () => {
  test('una forma desconeguda o d’una altra versió no amaga res', () => {
    for (const cru of [null, 'text', 42, [], { v: 2, espais: { notes: { mur: false } } }, { v: 1 }, { v: 1, espais: [] }]) {
      expect(normalitzaCarpetesVisibles(cru).espais).toEqual({});
    }
  });

  test('només valors `false`, espais vàlids i mapes no buits', () => {
    const net = normalitzaCarpetesVisibles({
      v: 1,
      espais: {
        notes: { mur: false, mercat: true, pobles: 'no', '': false },
        Wiki: { ser: false },
        disseny: { fonaments: true },
        perfil: 'res'
      }
    });
    expect(JSON.parse(JSON.stringify(net))).toEqual({ v: 1, espais: { notes: { mur: false } } });
  });

  test('el que ve de l’emmagatzematge es normalitza en llegir-lo', () => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { mur: false, mercat: 'sí' } } });
    _reiniciaCarpetesVisibles();
    expect({ ...carpetesAmagadesDe('notes') }).toEqual({ mur: false });
  });
});

test('el barril del Workspace exporta la preferència', () => {
  expect(barril.carpetesAmagadesDe).toBe(carpetesAmagadesDe);
  expect(barril.desaCarpetaAmagada).toBe(desaCarpetaAmagada);
  expect(barril.subscriuCarpetesVisibles).toBe(subscriuCarpetesVisibles);
  expect(barril.espaiDe).toBe(espaiDe);
  expect(barril.ESPAI_COMU).toBe(ESPAI_COMU);
});
