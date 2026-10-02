/**
 * T1 (prompt comú 261002_0125) · El contracte de fonts: una font es valida
 * en crear-se, i les seues entrades tenen la MATEIXA forma que les de
 * l'agenda de Sollutia (el calendari no en distingix la font). Fallada
 * tancada: mai mitja font.
 */
import { describe, expect, test } from 'vitest';
import { creaEsdeveniment } from '../../../utils/esdeveniment.js';
import { entradaDeLAgenda, entradaOcorreElDia, entradesDelMes } from '../calendariGlobal.js';
import {
  COLORS_DE_FONT, ERRORS_DE_FONT, ErrorDeFont, aErrorDeFont, creaFont, entradaDeFont, entradesDeFont, errorPla,
  validaEntradesDeFont
} from './contracteFonts.js';

const llista = async () => [];
const ambHora = (id, dataHora, extra = {}) => creaEsdeveniment({ id, titol: `Acte ${id}`, inici: { dataHora, zona: 'Europe/Madrid' }, ...extra });
const deTotElDia = (id, data, fi = null) => creaEsdeveniment({ id, titol: `Dia ${id}`, inici: { data }, fi: fi ? { data: fi } : null });

describe('creaFont', () => {
  test('una font vàlida ix congelada, amb la casella marcada per defecte i el compte net', () => {
    const font = creaFont({ id: 'privat', nom: ' El meu calendari ', tipus: 'gcal', colorToken: 'accio', compte: ' veina@example.org ', llistaEntrades: llista });
    expect(Object.isFrozen(font)).toBe(true);
    expect(font).toMatchObject({ id: 'privat', nom: 'El meu calendari', tipus: 'gcal', colorToken: 'accio', activa: true, compte: 'veina@example.org' });
    expect(creaFont({ id: 'org', nom: 'Org', tipus: 'gcal', colorToken: 'accent', activa: false, llistaEntrades: llista }).compte).toBeNull();
  });

  test('el color és el NOM d’un token, mai un color cru', () => {
    expect(COLORS_DE_FONT).toEqual(['accio', 'accent', 'exit', 'avis', 'error']);
    expect(() => creaFont({ id: 'a', nom: 'A', tipus: 'gcal', colorToken: 'rgb(1, 2, 3)', llistaEntrades: llista })).toThrow(TypeError);
    expect(() => creaFont({ id: 'a', nom: 'A', tipus: 'gcal', colorToken: '--sdp-accio', llistaEntrades: llista })).toThrow(TypeError);
  });

  test('sense id net, nom, tipus o llistaEntrades no hi ha font', () => {
    const base = { id: 'a', nom: 'A', tipus: 'gcal', colorToken: 'accio', llistaEntrades: llista };
    expect(() => creaFont({ ...base, id: 'Amb Majúscules' })).toThrow(TypeError);
    expect(() => creaFont({ ...base, id: '' })).toThrow(TypeError);
    expect(() => creaFont({ ...base, nom: '  ' })).toThrow(TypeError);
    expect(() => creaFont({ ...base, tipus: null })).toThrow(TypeError);
    expect(() => creaFont({ ...base, llistaEntrades: [] })).toThrow(TypeError);
  });
});

describe('ErrorDeFont', () => {
  test('porta el tipus, el missatge per defecte i, si de cas, l’estat HTTP i el motiu', () => {
    const error = new ErrorDeFont(ERRORS_DE_FONT.SENSE_ACCES, undefined, { estat: 403, motiu: 'forbidden' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'ErrorDeFont', tipus: 'SENSE_ACCES', estat: 403, motiu: 'forbidden' });
    expect(error.message).toBe('Este compte no pot llegir este calendari.');
    expect(Object.keys(ERRORS_DE_FONT)).toEqual(['SENSE_CONFIGURACIO', 'SENSE_AUTORITZACIO', 'TOKEN_CADUCAT', 'SENSE_ACCES', 'XARXA', 'RESPOSTA_INVALIDA']);
  });

  test('un tipus desconegut i qualsevol error sense tipus són de XARXA: no se n’inventa cap altre', () => {
    expect(new ErrorDeFont('INVENTAT').tipus).toBe('XARXA');
    const causa = new TypeError('Failed to fetch');
    const tipat = aErrorDeFont(causa);
    expect(tipat).toMatchObject({ tipus: 'XARXA', cause: causa });
    const propi = new ErrorDeFont('TOKEN_CADUCAT');
    expect(aErrorDeFont(propi)).toBe(propi);
    expect(errorPla(propi)).toEqual({ tipus: 'TOKEN_CADUCAT', missatge: 'La connexió ha caducat: torna a connectar el compte.' });
  });
});

describe('entradaDeFont', () => {
  test('té la forma de les entrades de l’agenda de Sollutia, més la font, i el mateix moment', () => {
    const esd = ambHora('ev1', '2026-10-10T19:00:00+02:00');
    const entrada = entradaDeFont('privat', esd);
    const agenda = entradaDeLAgenda({ id: 'ev1', titol: 'Acte ev1', inici: '2026-10-10T19:00:00+02:00' });
    expect(Object.keys(entrada).sort()).toEqual([...Object.keys(agenda), 'font'].sort());
    expect(entrada).toMatchObject({ font: 'privat', item: null, acte: esd, esdeveniment: esd, dia: null, moment: agenda.moment });
    expect(entrada.clau).toBe(`font-privat-ev1@${Date.UTC(2026, 9, 10, 17)}`);
    expect(entrada.agenda).toMatchObject({ id: 'ev1', titol: 'Acte ev1', inici: '2026-10-10T19:00:00+02:00', fi: null, font: 'privat' });
    expect(Object.isFrozen(entrada)).toBe(true);
  });

  test('el calendari la situa amb les mateixes regles que la resta: el dia que ocorre i el seu mes', () => {
    const entrada = entradaDeFont('org', deTotElDia('fira', '2026-10-17', '2026-10-19'));
    expect(entradaOcorreElDia(entrada, '2026-10-17')).toBe(true);
    expect(entradaOcorreElDia(entrada, '2026-10-18')).toBe(true);
    expect(entradaOcorreElDia(entrada, '2026-10-19')).toBe(false); // fi exclusiva
    expect(entradesDelMes([entrada], { any: 2026, mes: 9 })).toEqual([entrada]);
    expect(entrada.clau).toBe(`font-org-fira@${new Date(2026, 9, 17).getTime()}`);
  });

  test('sense esdeveniment o amb un id de font que no és net, cap entrada', () => {
    expect(entradaDeFont('privat', null)).toBeNull();
    expect(entradaDeFont('Privat', ambHora('x', '2026-10-10T19:00:00+02:00'))).toBeNull();
  });
});

describe('entradesDeFont i validaEntradesDeFont', () => {
  test('el mateix acte en dues fonts són dues claus; en la mateixa, fallada tancada', () => {
    const esd = ambHora('ev1', '2026-10-10T19:00:00+02:00');
    const [privat] = entradesDeFont('privat', [esd]);
    const [org] = entradesDeFont('org', [esd]);
    expect(privat.clau).not.toBe(org.clau);
    expect(() => entradesDeFont('privat', [esd, esd])).toThrow(expect.objectContaining({ tipus: 'RESPOSTA_INVALIDA' }));
  });

  test('un esdeveniment que no ha passat pel model o una resposta que no és una llista: RESPOSTA_INVALIDA, mai mitja font', () => {
    const bo = ambHora('ev1', '2026-10-10T19:00:00+02:00');
    expect(() => entradesDeFont('privat', [bo, null])).toThrow(expect.objectContaining({ tipus: 'RESPOSTA_INVALIDA' }));
    expect(() => entradesDeFont('privat', { items: [] })).toThrow(expect.objectContaining({ tipus: 'RESPOSTA_INVALIDA' }));
    expect(entradesDeFont('privat', [])).toEqual([]);
  });

  test('la interfície rebutja el que no és una entrada d’eixa font (un adaptador de demà que s’equivoque)', () => {
    const entrades = entradesDeFont('privat', [ambHora('ev1', '2026-10-10T19:00:00+02:00')]);
    expect(validaEntradesDeFont('privat', entrades)).toBe(entrades);
    expect(() => validaEntradesDeFont('org', entrades)).toThrow(expect.objectContaining({ tipus: 'RESPOSTA_INVALIDA' }));
    expect(() => validaEntradesDeFont('privat', [{ clau: 'x', font: 'privat' }])).toThrow(expect.objectContaining({ tipus: 'RESPOSTA_INVALIDA' }));
    expect(() => validaEntradesDeFont('privat', 'res')).toThrow(expect.objectContaining({ tipus: 'RESPOSTA_INVALIDA' }));
  });
});
