// @vitest-environment node
/* IDEA-42 (B7h, marató 261101_2143; spec B7-PEDRA §2.9a) · La portada d'una
   publicació coaccionada: el cartell sencer (portada_sencera) i el punt focal
   de la targeta 16:9 (enquadrament_targeta). Les dues claus són un jsonb que
   el veí escriu per l'API i acaben en una classe i en propietats CSS
   (core-seguretat-audit): cap valor hostil arriba a la vista, ni en escriure
   (mapSectionSubmissionToItem) ni en llegir (elementDeFilaPublicada). */
import { describe, expect, test } from 'vitest';
import {
  FORMES_DE_TARGETA, ZOOM_MAXIM_DE_TARGETA, elementDeFilaPublicada, mapSectionSubmissionToItem, portadaDeLaPublicacio
} from './mapejadorSeccions.js';
import { FORMATS, ZOOM_MAX } from '../components/universal/enquadrament/enquadrament.js';

const BO = Object.freeze({ format: '16:9', cx: 0.3, cy: 0.7, zoom: 1.5 });
const SENSE = { sencera: false, targeta: null };

describe('portadaDeLaPublicacio · coacció', () => {
  test('el contracte: el booleà true i un enquadrament net passen tal qual', () => {
    expect(portadaDeLaPublicacio({ portada_sencera: true, enquadrament_targeta: { ...BO } }))
      .toEqual({ sencera: true, targeta: { format: '16:9', cx: 0.3, cy: 0.7, zoom: 1.5 } });
    expect(portadaDeLaPublicacio({ enquadrament_targeta: { format: '16:9', cx: 0, cy: 1, zoom: ZOOM_MAXIM_DE_TARGETA } }).targeta)
      .toEqual({ format: '16:9', cx: 0, cy: 1, zoom: 4 });
  });

  test.each([
    ['la cadena "true"', 'true'], ['1', 1], ['un objecte', { valueOf: () => true }], ['una llista', [true]], ['null', null]
  ])('portada_sencera: %s no és true', (_, valor) => {
    expect(portadaDeLaPublicacio({ portada_sencera: valor }).sencera).toBe(false);
  });

  test('una portada_sencera heretada del prototip (contaminació) no compta', () => {
    const hostil = Object.create({ portada_sencera: true, enquadrament_targeta: { ...BO } });
    expect(portadaDeLaPublicacio(hostil)).toEqual(SENSE);
  });

  test.each([
    ['un format fora de la llista', { ...BO, format: '4:3' }],
    ['el format amb espais', { ...BO, format: ' 16:9' }],
    ['el format que no és text', { ...BO, format: ['16:9'] }],
    ['cx en text', { ...BO, cx: '0.3' }],
    ['cx NaN', { ...BO, cx: Number.NaN }],
    ['cy infinit', { ...BO, cy: Number.POSITIVE_INFINITY }],
    ['cx per davall de 0', { ...BO, cx: -0.01 }],
    ['cy per damunt d’1', { ...BO, cy: 1.01 }],
    ['zoom per davall d’1', { ...BO, zoom: 0.99 }],
    ['zoom per damunt del màxim', { ...BO, zoom: ZOOM_MAXIM_DE_TARGETA + 0.01 }],
    ['zoom absent', { format: '16:9', cx: 0.5, cy: 0.5 }],
    ['un objecte niat', { ...BO, cx: { valueOf: () => 0.5 } }],
    ['una injecció CSS', { ...BO, cx: '50%; background: url(//x)' }],
    ['una llista', [0.5, 0.5, 1]],
    ['una cadena', '16:9 50% 50%'],
    ['un número', 0.5]
  ])('enquadrament_targeta: %s → null', (_, valor) => {
    expect(portadaDeLaPublicacio({ enquadrament_targeta: valor }).targeta).toBeNull();
  });

  test('només un objecte pla: una instància d’una classe o un Date, fora; sense prototip, val', () => {
    class Marc { constructor() { Object.assign(this, BO); } }
    expect(portadaDeLaPublicacio({ enquadrament_targeta: new Marc() }).targeta).toBeNull();
    expect(portadaDeLaPublicacio({ enquadrament_targeta: Object.assign(new Date(), BO) }).targeta).toBeNull();
    const pla = Object.assign(Object.create(null), BO);
    expect(portadaDeLaPublicacio({ enquadrament_targeta: pla }).targeta).toEqual({ ...BO });
  });

  test('els camps heretats del prototip no compten (ni amb Object.prototype contaminat); les claus de més no viatgen', () => {
    expect(portadaDeLaPublicacio({ enquadrament_targeta: Object.assign(Object.create({ zoom: 1 }), { format: '16:9', cx: 0.5, cy: 0.5 }) }).targeta).toBeNull();
    try {
      Object.defineProperty(Object.prototype, 'zoom', { value: 1, configurable: true, writable: true });
      Object.defineProperty(Object.prototype, 'portada_sencera', { value: true, configurable: true, writable: true });
      expect(portadaDeLaPublicacio({ enquadrament_targeta: { format: '16:9', cx: 0.5, cy: 0.5 } })).toEqual(SENSE);
    } finally {
      delete Object.prototype.zoom;
      delete Object.prototype.portada_sencera;
    }
    const ambDeMes = { ...BO, rect: { x: 0 }, src: 'https://rastreig.example/p.gif', __proto__x: 1 };
    expect(Object.keys(portadaDeLaPublicacio({ enquadrament_targeta: ambDeMes }).targeta)).toEqual(['format', 'cx', 'cy', 'zoom']);
  });

  test('el -0 d’un JSON es queda en 0', () => {
    const { targeta } = portadaDeLaPublicacio(JSON.parse('{"enquadrament_targeta":{"format":"16:9","cx":-0,"cy":0.5,"zoom":1}}'));
    expect(Object.is(targeta.cx, 0)).toBe(true);
  });

  test('un valor que no es deixa llegir (getter o Proxy que llancen) torna la de sèrie, sense llançar', () => {
    const getter = { get portada_sencera() { throw new Error('trampa'); } };
    expect(portadaDeLaPublicacio(getter)).toEqual(SENSE);
    const proxy = { enquadrament_targeta: new Proxy({}, { getPrototypeOf() { throw new Error('trampa'); } }) };
    expect(portadaDeLaPublicacio(proxy)).toEqual(SENSE);
    const camp = { enquadrament_targeta: { format: '16:9', get cx() { throw new Error('trampa'); }, cy: 0.5, zoom: 1 } };
    expect(portadaDeLaPublicacio(camp)).toEqual(SENSE);
  });

  test.each([null, undefined, 'x', 3, [], true])('un payload que no és un objecte (%s) no porta portada', (payload) => {
    expect(portadaDeLaPublicacio(payload)).toEqual(SENSE);
  });

  test('idempotent: el resultat net tornat a coaccionar és el mateix', () => {
    const una = portadaDeLaPublicacio({ portada_sencera: true, enquadrament_targeta: { ...BO, extra: 1 } });
    expect(portadaDeLaPublicacio({ portada_sencera: una.sencera, enquadrament_targeta: una.targeta })).toEqual(una);
  });

  test('les constants són les del diàleg: el zoom màxim i un format que FORMATS coneix', () => {
    expect(ZOOM_MAXIM_DE_TARGETA).toBe(ZOOM_MAX);
    for (const forma of FORMES_DE_TARGETA) expect(FORMATS.find((f) => f.valor === forma)?.ratio).toBeGreaterThan(0);
  });
});

describe('el mapejador reescriu les dues claus', () => {
  const escriu = (payload, sectionId = 'mur') => mapSectionSubmissionToItem({ sectionId, payload: { id: 'p1', title: 'Aplec', ...payload } });
  const llig = (payload) => elementDeFilaPublicada({ id: 'p1', payload: { title: 'Aplec', ...payload }, createdAt: '2026-11-01T00:00:00Z' });

  test.each(['mur', 'events', 'mercat', 'notes', 'multimedia', 'desconeguda'])('en escriure (%s): hostil fora, net tal qual', (seccio) => {
    const hostil = escriu({ portada_sencera: 'true', enquadrament_targeta: { format: '16:9', cx: 'calc(100%)', cy: 0.5, zoom: 1 } }, seccio);
    expect(Object.hasOwn(hostil, 'portada_sencera')).toBe(false);
    expect(Object.hasOwn(hostil, 'enquadrament_targeta')).toBe(false);
    const net = escriu({ portada_sencera: true, enquadrament_targeta: { ...BO, injectat: '<script>' } }, seccio);
    expect(net.portada_sencera).toBe(true);
    expect(net.enquadrament_targeta).toEqual({ ...BO });
  });

  test('en llegir una fila d’un veí: hostil fora, net tal qual', () => {
    const hostil = llig({ portada_sencera: 1, enquadrament_targeta: { format: '16:9', cx: 2, cy: 0.5, zoom: 1 } });
    expect(Object.hasOwn(hostil, 'portada_sencera')).toBe(false);
    expect(Object.hasOwn(hostil, 'enquadrament_targeta')).toBe(false);
    const net = llig({ portada_sencera: true, enquadrament_targeta: { ...BO } });
    expect([net.portada_sencera, net.enquadrament_targeta]).toEqual([true, { ...BO }]);
  });

  test('portada_sencera: false no viatja (la de sèrie és no dir-ho)', () => {
    expect(Object.hasOwn(escriu({ portada_sencera: false }), 'portada_sencera')).toBe(false);
    expect(Object.hasOwn(llig({ portada_sencera: false }), 'portada_sencera')).toBe(false);
  });

  test('sense cap de les dues claus, l’element és el de sempre (cap clau nova)', () => {
    for (const element of [escriu({}), escriu({}, 'events'), llig({})]) {
      expect(Object.hasOwn(element, 'portada_sencera')).toBe(false);
      expect(Object.hasOwn(element, 'enquadrament_targeta')).toBe(false);
    }
    const dia = '2026-11-01T10:00:00.000Z';
    expect(escriu({ summary: 'x', created_at: dia, portada_sencera: 'no', enquadrament_targeta: 'x' }))
      .toEqual(escriu({ summary: 'x', created_at: dia }));
    expect(llig({ summary: 'x', portada_sencera: 0 })).toEqual(llig({ summary: 'x' }));
  });
});
