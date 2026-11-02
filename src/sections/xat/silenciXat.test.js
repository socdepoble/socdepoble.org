// @vitest-environment node
/* B8C-5 (marató 261101_2143; B8-CLIENT §5.1) · Les regles pures del silenci d'una
   conversa: les opcions del diàleg (parells [clau, reserva] que llig la guarda
   i18n.usades, amb la reserva idèntica al valencià), qui es pot silenciar, el
   silenci en memòria (sense servidor) i l'avís de després. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import CA from '../../config/idiomes/ca.js';
import { DURADES_SILENCI, SILENCI_SEMPRE, finsAlDelSilenci } from '../../data/contracte.js';
import {
  DURADA_PER_DEFECTE, OPCIONS_SILENCI, TEXTOS_SILENCI, aplicaSilencisLocals, estatSilenciLocal, potSilenciar,
  properaCaducitat, textDelSilenci
} from './silenciXat.js';

const ARA = Date.parse('2026-11-02T10:00:00Z');
const HORA = 3600000;
const iso = (ms) => new Date(ms).toISOString();
const t = (_, reserva) => reserva;

describe('opcions i textos', () => {
  test('tres durades, en ordre, totes del contracte; «8 hores» per defecte; cap «cap» al diàleg', () => {
    expect(OPCIONS_SILENCI.map((o) => o.durada)).toEqual(['8h', '1setmana', 'sempre']);
    expect(OPCIONS_SILENCI.every((o) => DURADES_SILENCI.includes(o.durada))).toBe(true);
    expect(DURADA_PER_DEFECTE).toBe('8h');
    expect(Object.isFrozen(OPCIONS_SILENCI)).toBe(true);
  });

  test('cada text és un parell [clau, reserva] i la reserva és, caràcter a caràcter, el valor valencià', () => {
    const parells = [...OPCIONS_SILENCI.map((o) => o.text), ...Object.values(TEXTOS_SILENCI)];
    for (const parell of parells) {
      expect(Array.isArray(parell) && parell.length === 2, String(parell)).toBe(true);
      const [clau, reserva] = parell;
      expect(CA[clau], clau).toBe(reserva);
    }
  });

  test('la guarda i18n.usades troba les claus a la font (parell literal, no una terna)', () => {
    const font = readFileSync(path.join(process.cwd(), 'src/sections/xat/silenciXat.js'), 'utf8');
    const PARELL = /\[\s*(['"])(section\.[\w.-]+)\1\s*,/g;
    const trobades = new Set([...font.matchAll(PARELL)].map(([, , clau]) => clau));
    for (const clau of ['section.xat.silenci.8h', 'section.xat.silenci.1setmana', 'section.xat.silenci.sempre', 'section.xat.silenci.menu', 'section.xat.silenci.nomesLocal']) {
      expect(trobades.has(clau), clau).toBe(true);
    }
  });
});

describe('potSilenciar', () => {
  test.each([
    ['un directe teu', { id: 'f-1', participant: true }, true],
    ['un fil sense marca de participant (llavor)', { id: 'f-2' }, true],
    ['una fila d’ajuda per defecte', { id: 'sdp-per-defecte:iaia', perDefecte: 'iaia' }, false],
    ['un id d’ajuda sense la marca', { id: 'sdp-per-defecte:javi' }, false],
    ['el xat de només lectura de Javi', { id: 'fake-javi' }, false],
    ['un fil de pàgina que llegixes com a visitant', { id: 'f-3', participant: false }, false],
    ['un fil sense id', { id: '' }, false],
    ['un id que no és text', { id: 7 }, false],
    ['res', null, false]
  ])('%s → %s', (_, fil, esperat) => {
    expect(potSilenciar(fil)).toBe(esperat);
  });
});

describe('silenci en memòria', () => {
  const fils = Object.freeze([
    Object.freeze({ id: 'a', silenciat: false, noLlegits: 2 }),
    Object.freeze({ id: 'b', silenciat: true, noLlegits: 1 }),
    Object.freeze({ id: 'c', silenciat: false, noLlegits: 0 })
  ]);

  test('sense mapa, o amb un mapa buit, la mateixa referència', () => {
    expect(aplicaSilencisLocals(fils, new Map(), ARA)).toBe(fils);
    expect(aplicaSilencisLocals(fils, null, ARA)).toBe(fils);
  });

  test('una entrada que no canvia res conserva la referència de la llista i dels fils', () => {
    const mapa = new Map([['b', iso(ARA + HORA)], ['zz', iso(ARA + HORA)]]);
    expect(aplicaSilencisLocals(fils, mapa, ARA)).toBe(fils);
  });

  test('silencia en memòria, desfà en memòria (null mana sobre el servidor) i només toca el fil del mapa', () => {
    const mapa = new Map([['a', iso(ARA + 8 * HORA)], ['b', null]]);
    const resultat = aplicaSilencisLocals(fils, mapa, ARA);
    expect(resultat).not.toBe(fils);
    expect(resultat.map((f) => f.silenciat)).toEqual([true, false, false]);
    expect(resultat[2]).toBe(fils[2]);
    expect(fils[0].silenciat).toBe(false);
  });

  test('una entrada caducada no mana: torna a manar la fila del servidor', () => {
    const mapa = new Map([['a', iso(ARA - 1)], ['b', iso(ARA - 1)]]);
    expect(aplicaSilencisLocals(fils, mapa, ARA)).toBe(fils);
    expect(estatSilenciLocal(mapa, 'a', ARA)).toBeNull();
  });

  test('estatSilenciLocal: true, false o null', () => {
    const mapa = new Map([['a', iso(ARA + HORA)], ['b', null], ['s', SILENCI_SEMPRE]]);
    expect(estatSilenciLocal(mapa, 'a', ARA)).toBe(true);
    expect(estatSilenciLocal(mapa, 'b', ARA)).toBe(false);
    expect(estatSilenciLocal(mapa, 's', ARA)).toBe(true);
    expect(estatSilenciLocal(mapa, 'x', ARA)).toBeNull();
    expect(estatSilenciLocal(undefined, 'a', ARA)).toBeNull();
  });

  test('properaCaducitat: la més pròxima de les vigents; cap null, cap caducada, cap data il·legible', () => {
    const mapa = new Map([['a', iso(ARA + 8 * HORA)], ['b', iso(ARA + HORA)], ['c', null], ['d', iso(ARA - HORA)], ['e', 'no és cap data']]);
    expect(properaCaducitat(mapa, ARA)).toBe(ARA + HORA);
    expect(properaCaducitat(new Map([['c', null]]), ARA)).toBeNull();
    expect(properaCaducitat(new Map(), ARA)).toBeNull();
    expect(properaCaducitat(new Map([['s', SILENCI_SEMPRE]]), ARA)).toBe(Date.parse(SILENCI_SEMPRE));
  });
});

describe('textDelSilenci', () => {
  test('la sentinella de la llavor i la del servidor (+00:00) diuen «Conversa silenciada», sense cap any 9999', () => {
    expect(textDelSilenci(SILENCI_SEMPRE, 'ca-ES', t)).toBe('Conversa silenciada');
    expect(textDelSilenci('9999-12-31T00:00:00+00:00', 'ca-ES', t)).toBe('Conversa silenciada');
    expect(textDelSilenci(finsAlDelSilenci('sempre', ARA), 'es-ES', t)).toBe('Conversa silenciada');
  });

  test('una data de fi diu «fins al» amb la data en la llengua de la interfície', () => {
    const fi = '2026-11-02T18:00:00Z';
    const esperada = new Intl.DateTimeFormat('ca-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(fi));
    expect(textDelSilenci(fi, 'ca-ES', t)).toBe(`Conversa silenciada fins al ${esperada}`);
    const enAngles = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(fi));
    expect(textDelSilenci(fi, 'en-GB', (clau, reserva) => (clau === 'section.xat.silenci.fetFins' ? 'Chat muted until {data}' : reserva)))
      .toBe(`Chat muted until ${enAngles}`);
  });

  test('null diu que ja no està silenciada; una data il·legible no inventa cap data', () => {
    expect(textDelSilenci(null, 'ca-ES', t)).toBe('La conversa ja no està silenciada');
    expect(textDelSilenci('demà', 'ca-ES', t)).toBe('Conversa silenciada');
  });

  test('un locale invàlid passa al valencià; un $ del traductor no es reinterpreta', () => {
    const fi = '2026-11-02T18:00:00Z';
    expect(() => textDelSilenci(fi, 'no_és_cap_locale!!', t)).not.toThrow();
    expect(textDelSilenci(fi, 'ca-ES', (clau, reserva) => (clau === 'section.xat.silenci.fetFins' ? '$& {data} $1' : reserva)))
      .toMatch(/^\$& .+ \$1$/);
  });

  test('sense traductor, les reserves', () => {
    expect(textDelSilenci(null, 'ca-ES')).toBe('La conversa ja no està silenciada');
  });
});
