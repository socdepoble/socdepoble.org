// @vitest-environment node
/* Fase E (261020, tasca 2; pla 261020_2045) · l'extractor i la fusió
   d'especificacions del Rebost d'«El Comú»: reimplementació pròpia a partir
   del comportament (auditoria 261020_2030 §2.2), amb les unitats de les nostres
   cinc llengües. */
import { describe, expect, test } from 'vitest';
import {
  extrauEspecificacio, fusionaEspecificacions, partsDe, quantitatDe, quantitatEn, sumaEspecificacio, unitatDe, valorDeNombre
} from './extractorEspecificacio.js';

const extret = (text) => extrauEspecificacio(text);

describe('extrauEspecificacio · la quantitat davant o darrere del nom', () => {
  test('davant, amb unitat i «de» o «d’»: el nom ix net i amb majúscula', () => {
    expect(extret('2 kg de tomaca de penjar')).toEqual({ nom: 'Tomaca de penjar', especificacio: '2 kg', quantitat: 2, unitat: 'kg' });
    expect(extret('2 kg d’arròs')).toEqual({ nom: 'Arròs', especificacio: '2 kg', quantitat: 2, unitat: 'kg' });
    expect(extret("2 kg d'arròs").nom).toBe('Arròs');
    expect(extret('2 litres de llet')).toEqual({ nom: 'Llet', especificacio: '2 litres', quantitat: 2, unitat: 'l' });
    expect(extret('1,5 kg Creïlles')).toEqual({ nom: 'Creïlles', especificacio: '1,5 kg', quantitat: 1.5, unitat: 'kg' });
    expect(extret('1/2 kg de carn')).toEqual({ nom: 'Carn', especificacio: '1/2 kg', quantitat: 0.5, unitat: 'kg' });
  });

  test('darrere: l’exemple de l’auditoria, que el patró que citava no casava', () => {
    expect(extret('Tomaca de penjar 2 kg')).toEqual({ nom: 'Tomaca de penjar', especificacio: '2 kg', quantitat: 2, unitat: 'kg' });
    expect(extret('Creïlles 3kg')).toEqual({ nom: 'Creïlles', especificacio: '3 kg', quantitat: 3, unitat: 'kg' });
    expect(extret('Ous 1 dotzena')).toEqual({ nom: 'Ous', especificacio: '1 dotzena', quantitat: 1, unitat: 'dotzena' });
    expect(extret('Pa 2 barres')).toEqual({ nom: 'Pa', especificacio: '2 barres', quantitat: 2, unitat: 'barra' });
  });

  test('un nombre sense unitat és un compte; «x6» i «2 x» també', () => {
    expect(extret('3 tomaques')).toEqual({ nom: 'Tomaques', especificacio: '3', quantitat: 3, unitat: 'u' });
    expect(extret('3 tomaques madures').nom).toBe('Tomaques madures');
    expect(extret('Cervesa x6')).toEqual({ nom: 'Cervesa', especificacio: '6', quantitat: 6, unitat: 'u' });
    expect(extret('2 x Cafè sol')).toEqual({ nom: 'Cafè sol', especificacio: '2', quantitat: 2, unitat: 'u' });
  });

  test('el que no es pot separar sense dubte es queda sencer com a nom', () => {
    expect(extret('Pa')).toEqual({ nom: 'Pa', especificacio: '', quantitat: null, unitat: null });
    expect(extret('2 kg')).toEqual({ nom: '2 kg', especificacio: '', quantitat: null, unitat: null });
    expect(extret('Llet 2 cartons')).toEqual({ nom: 'Llet 2 cartons', especificacio: '', quantitat: null, unitat: null });
    expect(extret('   ')).toEqual({ nom: '', especificacio: '', quantitat: null, unitat: null });
    expect(extret(null).nom).toBe('');
  });

  test('les unitats de les cinc llengües, sense accents ni majúscules', () => {
    expect(['kg', 'Kg.', 'quilos', 'kilos'].map(unitatDe)).toEqual(['kg', 'kg', 'kg', 'kg']);
    expect(['racions', 'raciones', 'dotzenes', 'docena', 'paquet', 'pots', 'llanda', 'latas', 'bossa', 'safata'].map(unitatDe))
      .toEqual(['racio', 'racio', 'dotzena', 'dotzena', 'paquet', 'pot', 'llanda', 'llanda', 'bossa', 'safata']);
    expect(unitatDe('cartons')).toBeNull();
    expect(valorDeNombre('1,5')).toBe(1.5);
    expect(valorDeNombre('3/4')).toBe(0.75);
    expect(valorDeNombre('1/0')).toBeNull();
  });
});

describe('fusionaEspecificacions · dues peticions del mateix article', () => {
  test('pendent: es concatenen, i una petició sense quantitat val «1»', () => {
    expect(fusionaEspecificacions('2 kg', '1 kg')).toBe('2 kg + 1 kg');
    expect(fusionaEspecificacions('6', '12', { pendent: true })).toBe('6 + 12');
    expect(fusionaEspecificacions('', '')).toBe('1 + 1');
    expect(fusionaEspecificacions('6', '')).toBe('6 + 1');
  });

  test('ja comprat: la nova és una compra neta', () => {
    expect(fusionaEspecificacions('6', '12', { pendent: false })).toBe('12');
    expect(fusionaEspecificacions('6', '', { pendent: false })).toBe('');
  });

  test('passat el límit de 80 caràcters, es plega a la suma o es queda com estava', () => {
    const onze = Array(11).fill('1 kg').join(' + ');
    expect(`${onze} + 1 kg`.length).toBe(81);
    expect(fusionaEspecificacions(onze, '1 kg')).toBe('12 kg');
    const barrejada = `${Array(10).fill('1 kg').join(' + ')} + 2 barres`;
    expect(barrejada.length).toBeLessThanOrEqual(80);
    expect(fusionaEspecificacions(barrejada, '1 kg')).toBe(barrejada);
  });
});

describe('sumaEspecificacio i quantitatEn · la suma, a banda', () => {
  test('mateixa unitat, unitats de la mateixa magnitud i magnituds diferents', () => {
    expect(sumaEspecificacio('2 kg + 1 kg')).toEqual({ quantitat: 3, unitat: 'kg' });
    expect(sumaEspecificacio('2 kg + 500 g')).toEqual({ quantitat: 2.5, unitat: 'kg' });
    expect(sumaEspecificacio('1 + 1')).toEqual({ quantitat: 2, unitat: 'u' });
    expect(sumaEspecificacio('1 dotzena + 6')).toEqual({ quantitat: 1.5, unitat: 'dotzena' });
    expect(sumaEspecificacio('2 kg + 1 l')).toBeNull();
    expect(sumaEspecificacio('')).toBeNull();
  });

  test('en una unitat donada (el comparador de preus)', () => {
    expect(quantitatEn('500 g', 'kg')).toBe(0.5);
    expect(quantitatEn('2 kg + 1 kg', 'kg')).toBe(3);
    expect(quantitatEn('1 dotzena', 'u')).toBe(12);
    expect(quantitatEn('2 l', 'kg')).toBeNull();
    expect(partsDe(' 2 kg +  1 kg ')).toEqual(['2 kg', '1 kg']);
    expect(quantitatDe('2 cartons')).toBeNull();
  });
});
