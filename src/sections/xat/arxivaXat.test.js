/**
 * arxivaXat.test.js — Proves pures de l'arxiu de converses i dels estats
 * d'entrega/lectura honestos del Xat (Onada R22 · T1).
 */
import { describe, expect, test } from 'vitest';
import { ID_FIL_DE_MOSTRA_DE_JAVI } from '../../data/xatsPerDefecte.js';
import {
  TEXTOS_ARXIVA,
  aplicaArxivatsLocals,
  estatArxivatLocal,
  potArxivar
} from './arxivaXat.js';
import {
  combinaMissatges,
  derivaEstat,
  estatDeLUltim,
  mapejaFil,
  sumaNoLlegits
} from './missatges.js';

describe('arxivaXat · potArxivar', () => {
  test('rebutja actors per defecte, xat de mostra de Javi, comunitats contenidores i visitants', () => {
    expect(potArxivar(null)).toBe(false);
    expect(potArxivar({})).toBe(false);
    expect(potArxivar({ id: '   ' })).toBe(false);
    expect(potArxivar({ id: 'sdp-per-defecte:iaia' })).toBe(false);
    expect(potArxivar({ id: 'sdp-per-defecte:javi' })).toBe(false);
    expect(potArxivar({ id: ID_FIL_DE_MOSTRA_DE_JAVI })).toBe(false);
    expect(potArxivar({ id: 'fake-entitat:socdepoble' })).toBe(false);
    expect(potArxivar({ id: 'fil-1', perDefecte: 'iaia' })).toBe(false);
    expect(potArxivar({ id: 'com-1', tipus: 'comunitat' })).toBe(false);
    expect(potArxivar({ id: 'pag-1', tipus: 'grup', participant: false })).toBe(false);
  });

  test('accepta converses directes, grups i canals propis on es participa', () => {
    expect(potArxivar({ id: 'fil-directe-1', tipus: 'directe' })).toBe(true);
    expect(potArxivar({ id: 'fil-grup-2', tipus: 'grup', participant: true })).toBe(true);
    expect(potArxivar({ id: 'fil-canal-3', tipus: 'canal', participant: true })).toBe(true);
  });
});

describe('arxivaXat · estatArxivatLocal i aplicaArxivatsLocals', () => {
  test('resol el mapa en memòria i conserva la mateixa referència quan res no canvia', () => {
    const base = [
      { id: 'f1', arxivat: false, noLlegits: 2 },
      { id: 'f2', arxivat: true, noLlegits: 1 }
    ];
    expect(estatArxivatLocal(null, 'f1')).toBeNull();
    expect(aplicaArxivatsLocals(base, new Map())).toBe(base);
    expect(aplicaArxivatsLocals(base, new Map([['f1', false]]))).toBe(base);

    const mapa = new Map([['f1', true], ['f2', false]]);
    expect(estatArxivatLocal(mapa, 'f1')).toBe(true);
    expect(estatArxivatLocal(mapa, 'f2')).toBe(false);
    expect(estatArxivatLocal(mapa, 'f3')).toBeNull();

    const resultat = aplicaArxivatsLocals(base, mapa);
    expect(resultat).not.toBe(base);
    expect(resultat).toEqual([
      { id: 'f1', arxivat: true, noLlegits: 2 },
      { id: 'f2', arxivat: false, noLlegits: 1 }
    ]);
    expect(sumaNoLlegits(resultat)).toBe(1);
  });

  test('TEXTOS_ARXIVA declara parells [clau, reserva] en valencià no buits', () => {
    for (const parell of Object.values(TEXTOS_ARXIVA)) {
      expect(Array.isArray(parell)).toBe(true);
      expect(parell[0]).toMatch(/^section\.xat\.arxiva\./);
      expect(parell[1].length).toBeGreaterThan(0);
    }
  });
});

describe('missatges · estats honestos d’enviament, lliurament i lectura (✓ / ✓✓)', () => {
  test('mapejaFil propaga rebutPelsAltresFinsSeq només quan el servidor el passa', () => {
    const senseRebut = mapejaFil({ id: 'f1', ultimSeq: 5, llegitPelsAltresFinsSeq: 3 });
    expect(Object.hasOwn(senseRebut, 'rebutPelsAltresFinsSeq')).toBe(false);

    const ambRebut = mapejaFil({
      id: 'f1',
      ultimSeq: 5,
      llegitPelsAltresFinsSeq: 3,
      rebutPelsAltresFinsSeq: 4
    });
    expect(ambRebut.rebutPelsAltresFinsSeq).toBe(4);
  });

  test('derivaEstat, combinaMissatges i estatDeLUltim distingeixen enviat (✓), lliurat (✓✓) i llegit (✓✓)', () => {
    const servidor = [
      { id: 'm1', sender: 'me', seq: 1, estatEnviament: 'enviat' },
      { id: 'm2', sender: 'me', seq: 2, estatEnviament: 'enviat' },
      { id: 'm3', sender: 'me', seq: 3, estatEnviament: 'enviat' },
      { id: 'm4', sender: 'other', seq: 4, estatEnviament: 'enviat' }
    ];
    const pendents = [{ id: 'p1', sender: 'me', seq: null, estatEnviament: 'pendent' }];

    expect(derivaEstat(servidor[0], 1, 2)).toBe('llegit');
    expect(derivaEstat(servidor[1], 1, 2)).toBe('lliurat');
    expect(derivaEstat(servidor[2], 1, 2)).toBe('enviat');

    const combinats = combinaMissatges(servidor, pendents, 1, 2);
    expect(combinats.map((m) => m.estatEnviament)).toEqual([
      'llegit',
      'lliurat',
      'enviat',
      'enviat',
      'pendent'
    ]);

    expect(estatDeLUltim({
      id: 'f1',
      ultimAutorId: 'jo',
      ultimSeq: 4,
      llegitPelsAltresFinsSeq: 2,
      rebutPelsAltresFinsSeq: 4
    }, 'jo')).toBe('lliurat');

    expect(estatDeLUltim({
      id: 'f1',
      ultimAutorId: 'jo',
      ultimSeq: 4,
      llegitPelsAltresFinsSeq: 2,
      rebutPelsAltresFinsSeq: 3
    }, 'jo')).toBe('enviat');

    expect(estatDeLUltim({
      id: 'f1',
      ultimAutorId: 'jo',
      ultimSeq: 4,
      llegitPelsAltresFinsSeq: 4,
      rebutPelsAltresFinsSeq: 4
    }, 'jo')).toBe('llegit');
  });
});
