/* IDEA-61 (T0, prompt 261102_1532; L2-A3, àrbitre del compositor) · El
   sanejador del canal d'escriptura de Notes coneix el camp `fitxa`: un objecte
   { ambit, estat, dades } coaccionat pel contracte, o null. Abans queia a
   netejaText(objecte) i la nota preparada per ?ambit= es creava amb
   «[object Object]», que els adaptadors nul·lificaven: la fitxa es perdia en
   eixir del Bloc amb la creació en vol. */
import { describe, expect, test } from 'vitest';
import { netejaCamp } from './netejaCamp.js';

const VIATGE = Object.freeze({
  ambit: 'vehicle', estat: 'reservat',
  dades: { modalitat: 'busque_lloc', lloc_eixida: '  Xixona ', lloc_arribada: 'Alcoi', data_eixida: '2026-11-20', places: '3', aliena: 'x' }
});

describe('netejaCamp · fitxa', () => {
  test('una fitxa d’àmbit torna coaccionada pel contracte: només els camps de l’àmbit, nets', () => {
    const neta = netejaCamp('fitxa', VIATGE);
    expect(neta).toMatchObject({ ambit: 'vehicle', estat: 'reservat' });
    expect(neta.dades).toEqual({ modalitat: 'busque_lloc', lloc_eixida: 'Xixona', lloc_arribada: 'Alcoi', data_eixida: '2026-11-20', places: 3 });
    expect(JSON.stringify(neta)).not.toContain('[object Object]');
    /* Idempotent: la mateixa fitxa dues vegades no canvia. */
    expect(netejaCamp('fitxa', neta)).toEqual(neta);
  });

  test('«Mur», res, un text o un àmbit desconegut: null (la nota deixa de ser una fitxa)', () => {
    expect(netejaCamp('fitxa', { ambit: 'mur', estat: 'disponible', dades: {} })).toBeNull();
    expect(netejaCamp('fitxa', null)).toBeNull();
    expect(netejaCamp('fitxa', undefined)).toBeNull();
    expect(netejaCamp('fitxa', 'vehicle')).toBeNull();
    expect(netejaCamp('fitxa', { ambit: 'xyz', dades: { preu: '1' } })).toBeNull();
    expect(netejaCamp('fitxa', ['vehicle'])).toBeNull();
  });

  test('la resta de camps no canvien de camí: un objecte fora de «fitxa» continua sent text', () => {
    expect(netejaCamp('title', 'Hola món')).toBe('Hola món');
    expect(netejaCamp('copyright', 'CC BY')).toBe('CC BY');
    expect(typeof netejaCamp('subtitle', { ambit: 'vehicle' })).toBe('string');
  });
});
