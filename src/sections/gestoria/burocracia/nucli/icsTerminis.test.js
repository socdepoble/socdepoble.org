// @vitest-environment node
/* Burocràcia · el generador .ics propi: títols genèrics, cap nom ni xifra,
   UID opac i estable, avisos a 15, 7 i 2 dies i el format de l'RFC 5545.
   Dades sintètiques i un DTSTAMP fix. */
import { describe, expect, test } from 'vitest';
import { creaTitular } from '../../identitat/nucli/titular.js';
import { DESCRIPCIO_GENERICA, icsDeTerminis, PRODID_TERMINIS, TITOL_GENERIC, TITOLS, uidDeTermini } from './icsTerminis.js';
import { calendariObligacions } from './obligacions.js';

const ARA = new Date(Date.UTC(2026, 9, 4, 6, 0, 0));
const desplega = (text) => text.replace(/\r\n /g, '');
const linies = (text) => desplega(text).split('\r\n').filter(Boolean);
const octets = (linia) => new TextEncoder().encode(linia).length;

const TERMINIS = [
  { id: 'aeat-303:2026:3T', venciment: '2026-10-20', categoria: 'fiscal', nom: 'Forn de Prova', model: '303', organisme: 'AEAT', importEstimat: 123456, titular: 'tit_prova_activitat' },
  { id: 'tgss-reta:2026:12', venciment: '2026-12-31', categoria: 'cotitzacio' },
  { id: 'prova_sense_categoria', venciment: '2026-11-02' },
  { id: 'prova_pendent', venciment: null, categoria: 'tributs-locals' },
  { id: 'prova_complit', venciment: '2026-10-21', complit: true }
];

describe('icsDeTerminis', () => {
  const ics = icsDeTerminis(TERMINIS, { ara: ARA });

  test('l’embolcall de l’RFC 5545, amb CRLF i línies de 75 octets com a molt', () => {
    expect(ics.startsWith(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:${PRODID_TERMINIS}\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n`)).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    for (const linia of ics.split('\r\n')) expect(octets(linia), linia).toBeLessThanOrEqual(75);
  });

  test('un acte de tot el dia per termini amb venciment; sense pendents ni complits', () => {
    const l = linies(ics);
    expect(l.filter((x) => x === 'BEGIN:VEVENT')).toHaveLength(3);
    expect(l.filter((x) => x.startsWith('DTSTART'))).toEqual(['DTSTART;VALUE=DATE:20261020', 'DTSTART;VALUE=DATE:20261102', 'DTSTART;VALUE=DATE:20261231']);
    expect(l).toContain('DTEND;VALUE=DATE:20261021');
    expect(l).toContain('DTEND;VALUE=DATE:20270101');
    expect(l.filter((x) => x === 'DTSTAMP:20261004T060000Z')).toHaveLength(3);
    expect(l.filter((x) => x === 'CLASS:PRIVATE')).toHaveLength(3);
    expect(l.filter((x) => x === 'TRANSP:TRANSPARENT')).toHaveLength(3);
  });

  test('títols genèrics per categoria i una descripció que no diu res', () => {
    const resums = linies(ics).filter((x) => x.startsWith('SUMMARY:'));
    expect(resums).toEqual([`SUMMARY:${TITOLS.fiscal}`, `SUMMARY:${TITOL_GENERIC}`, `SUMMARY:${TITOLS.cotitzacio}`]);
    expect(linies(ics).filter((x) => x.startsWith('DESCRIPTION:') && !x.includes('Termini'))).toEqual(Array(3).fill(`DESCRIPTION:${DESCRIPCIO_GENERICA}`));
  });

  test('cap nom, model, organisme, import, titular ni id llegible ix de l’ordinador', () => {
    for (const vetat of ['Forn', 'AEAT', '123456', '1.234,56', 'tit_prova', 'aeat-303', 'tgss-reta', 'prova_sense_categoria']) {
      expect(desplega(ics), vetat).not.toContain(vetat);
    }
    const textos = linies(ics).filter((x) => /^(?:SUMMARY|DESCRIPTION):/.test(x));
    expect(textos.filter((x) => /\d/.test(x))).toEqual([]);
  });

  test('un avís dins del calendari a 15, 7 i 2 dies', () => {
    const disparadors = linies(ics).filter((x) => x.startsWith('TRIGGER:'));
    expect(disparadors).toEqual(Array(3).fill(['TRIGGER:-P15D', 'TRIGGER:-P7D', 'TRIGGER:-P2D']).flat());
    expect(linies(ics).filter((x) => x === 'ACTION:DISPLAY')).toHaveLength(9);
    expect(linies(icsDeTerminis(TERMINIS, { ara: ARA, llindars: [3] })).filter((x) => x.startsWith('TRIGGER:'))).toEqual(Array(3).fill('TRIGGER:-P3D'));
  });

  test('UID opac i estable: importar-ho dues vegades actualitza, no duplica', () => {
    expect(icsDeTerminis(TERMINIS, { ara: ARA })).toBe(ics);
    const uid = uidDeTermini('aeat-303:2026:3T');
    expect(uid).toMatch(/^[0-9a-f]{16}-termini@socdepoble$/);
    expect(linies(ics)).toContain(`UID:${uid}`);
    expect(uidDeTermini('aeat-130:2026:3T')).not.toBe(uid);
    const repetit = icsDeTerminis([TERMINIS[0], { ...TERMINIS[0] }], { ara: ARA });
    expect(linies(repetit).filter((x) => x === 'BEGIN:VEVENT')).toHaveLength(1);
  });

  test('l’UID només depén de l’id: si un festiu corre la data, reimportar actualitza el mateix acte', () => {
    const abans = icsDeTerminis([{ id: 'aeat-303:2026:2T', venciment: '2026-07-20', categoria: 'fiscal' }], { ara: ARA });
    const despres = icsDeTerminis([{ id: 'aeat-303:2026:2T', venciment: '2026-07-21', categoria: 'fiscal' }], { ara: ARA });
    const uid = (text) => linies(text).filter((x) => x.startsWith('UID:'));
    expect(uid(despres)).toEqual(uid(abans));
    expect(uid(abans)).toEqual([`UID:${uidDeTermini('aeat-303:2026:2T')}`]);
    expect(linies(despres)).toContain('DTSTART;VALUE=DATE:20260721');
    // El mateix id dues vegades amb dates diferents: un sol acte, el de la data més primerenca.
    const dues = icsDeTerminis([
      { id: 'aeat-303:2026:2T', venciment: '2026-07-21', categoria: 'fiscal' },
      { id: 'aeat-303:2026:2T', venciment: '2026-07-20', categoria: 'fiscal' }
    ], { ara: ARA });
    expect(linies(dues).filter((x) => x.startsWith('DTSTART'))).toEqual(['DTSTART;VALUE=DATE:20260720']);
  });

  test('una llista buida és un calendari buit i vàlid', () => {
    expect(icsDeTerminis([], { ara: ARA })).toBe(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:${PRODID_TERMINIS}\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nEND:VCALENDAR\r\n`);
  });

  test('entrades que no valen', () => {
    expect(() => icsDeTerminis('no', { ara: ARA })).toThrow(TypeError);
    expect(() => icsDeTerminis([{ id: 'prova', venciment: '2026-02-30' }], { ara: ARA })).toThrow(/aaaa-mm-dd/);
    expect(() => icsDeTerminis([{ venciment: '2026-10-20' }], { ara: ARA })).toThrow(/porta un id/);
    expect(() => icsDeTerminis(TERMINIS, { ara: new Date('no') })).toThrow(TypeError);
    expect(() => icsDeTerminis(TERMINIS, { ara: ARA, llindars: [0] })).toThrow(RangeError);
  });

  test('amb el calendari d’obligacions: un acte per ocurrència amb venciment', () => {
    const titular = creaTitular({ id: 'tit_prova_activitat', tipus: 'persona', ambit: 'ACTIVITAT', alies: 'Activitat de prova', persona: 'tit_prova_llar' });
    const { ocurrencies } = calendariObligacions(2026, {
      titular, regimIva: 'general', estimacioIrpf: 'directa', retencio70: false, intracomunitari: false, reta: true, tributsLocals: true,
      marques: [{ id: 'marca_prova', sollicitud: '2016-09-15' }]
    });
    const text = icsDeTerminis(ocurrencies, { ara: ARA });
    expect(linies(text).filter((x) => x === 'BEGIN:VEVENT')).toHaveLength(ocurrencies.filter((o) => o.venciment).length);
    expect(text).not.toContain('Activitat de prova');
    expect(text).not.toContain('marca_prova');
    expect(linies(text)).toContain(`SUMMARY:${TITOLS['propietat-industrial']}`);
  });
});
