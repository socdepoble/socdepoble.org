/* T10 (ordre del Mestre, 261001) · La geometria de les vistes Setmana i Mes:
   franja i graella, columnes de la setmana, carrils i «+N» del mes. Les
   ocurrències es fan amb ocurrenciesEnRang (la regla d'ocorreElDia), no a mà.
   Les proves corren en Europe/Madrid (vite.config.js). */
import { describe, expect, test } from 'vitest';
import {
  assignaCarrils, disposaDia, disposaMes, disposaSetmana, ocurrenciaCobrix, ocurrenciesDeLaLlista, posicioAra,
  retallaPerCapacitat, segmentaPerDies, segmentsDeFila, separaFranja
} from './disposicioCalendari.js';
import { creaEsdeveniment } from './esdeveniment.js';
import { diesDeLaSetmana, graellaDelMes, rangDeLaGraella, rangDeLaSetmana } from './periodes.js';

const MADRID = process.env.TZ === 'Europe/Madrid';
const LLUNY = { desde: new Date(2026, 0, 1), fins: new Date(2027, 0, 1) };
let comptador = 0;
/* L'única ocurrència d'un esdeveniment sense recurrència. */
function oc(inici, fi = null, titol = null) {
  comptador += 1;
  const moment = (v) => (v.includes('T') ? { dataHora: v } : { data: v });
  const esd = creaEsdeveniment({ id: `e${comptador}`, titol: titol ?? `Acte ${comptador}`, inici: moment(inici), fi: fi ? moment(fi) : null });
  return ocurrenciesDeLaLlista([esd], LLUNY.desde, LLUNY.fins).ocurrencies[0];
}
const setmana = (any, mes, dia) => diesDeLaSetmana(new Date(any, mes, dia));
/* Un segment d'un dia, fet a mà, per a provar disposaDia sense soroll. */
const seg = (clau, iniciMin, fiMin) => ({ ocurrencia: { clau }, clau, iniciMin, fiMin, continuaAbans: false, continuaDespres: false });
const perClau = (disposats) => Object.fromEntries(disposats.map((d) => [d.segment.ocurrencia.clau, d]));

describe('separaFranja', () => {
  test('tot el dia, o amb hora fins a la mateixa hora de paret de l’endemà o més: franja; si no, graella', () => {
    expect(separaFranja(oc('2026-10-12'))).toBe('franja');
    expect(separaFranja(oc('2026-10-12T10:00', '2026-10-13T10:00'))).toBe('franja');
    expect(separaFranja(oc('2026-10-12T10:00', '2026-10-13T09:59'))).toBe('graella');
    expect(separaFranja(oc('2026-10-12T22:00', '2026-10-13T02:00'))).toBe('graella');
    expect(separaFranja(oc('2026-10-12T10:00', '2026-10-15T08:00'))).toBe('franja');
    // Els dies del canvi d'hora en fan 25 i 23: el criteri és de paret.
    expect(separaFranja(oc('2026-10-24T10:00', '2026-10-25T10:00'))).toBe('franja');
    expect(separaFranja(oc('2026-03-28T10:00', '2026-03-29T10:00'))).toBe('franja');
  });
});

describe('segmentaPerDies', () => {
  test('de 22:00 a 02:00: dos trossos, el primer fins a les 24:00 i el segon des de les 00:00', () => {
    const nit = oc('2026-10-10T22:00', '2026-10-11T02:00');
    expect(segmentaPerDies(nit, setmana(2026, 9, 10)).map(({ clau, iniciMin, fiMin, continuaAbans, continuaDespres }) => (
      { clau, iniciMin, fiMin, continuaAbans, continuaDespres }
    ))).toEqual([
      { clau: '2026-10-10', iniciMin: 1320, fiMin: 1440, continuaAbans: false, continuaDespres: true },
      { clau: '2026-10-11', iniciMin: 0, fiMin: 120, continuaAbans: true, continuaDespres: false }
    ]);
  });

  test('fins a les 00:00 exactes, un sol tros fins a 1440; durada zero, inici = fi', () => {
    expect(segmentaPerDies(oc('2026-10-14T10:00', '2026-10-15T00:00'), setmana(2026, 9, 14)).map((s) => [s.clau, s.iniciMin, s.fiMin]))
      .toEqual([['2026-10-14', 600, 1440]]);
    expect(segmentaPerDies(oc('2026-10-14T10:00'), setmana(2026, 9, 14)).map((s) => [s.iniciMin, s.fiMin])).toEqual([[600, 600]]);
  });

  test('només els dies donats; tot el dia, de 0 a 1440', () => {
    const festes = oc('2026-09-28', '2026-10-04');
    expect(segmentaPerDies(festes, setmana(2026, 9, 1).slice(5)).map((s) => [s.clau, s.iniciMin, s.fiMin])).toEqual([['2026-10-03', 0, 1440]]);
  });

  test('el dia del canvi d’hora es pinta en minuts de paret', () => {
    if (!MADRID) return;
    // De 01:30 a 03:30 de paret el 29-03: una hora real, de 90 a 210 a la graella.
    expect(segmentaPerDies(oc('2026-03-29T01:30', '2026-03-29T03:30'), setmana(2026, 2, 29)).map((s) => [s.iniciMin, s.fiMin])).toEqual([[90, 210]]);
    // De les 02:30 d'estiu a les 02:30 d'hivern el 25-10: una hora real, alçada zero (la mínima la posa disposaDia).
    const doble = oc('2026-10-25T02:30:00+02:00', '2026-10-25T02:30:00+01:00');
    expect(doble.fi - doble.inici).toBe(3600000);
    expect(segmentaPerDies(doble, setmana(2026, 9, 25)).map((s) => [s.iniciMin, s.fiMin])).toEqual([[150, 150]]);
  });

  /* L'aproximació heretada d'ocorreElDia (vegeu ocurrenciesEnRang), vista a la
     graella: un diari del diumenge 29-03 a la 01:00 fins al dilluns a les
     00:30 dura 22,5 hores reals (el diumenge en té 23), l'aritmètica de 24 h
     no compta el dilluns i el tros de 00:00 a 00:30 no es pinta. */
  test('al canvi d’hora de març, l’última mitja hora d’un diari que passa de mitjanit no es pinta (heretat)', () => {
    if (!MADRID) return;
    const diari = creaEsdeveniment({
      id: 'diari-marc', titol: 'Diari', inici: { dataHora: '2026-03-29T01:00' }, fi: { dataHora: '2026-03-30T00:30' },
      recurrencia: ['RRULE:FREQ=DAILY']
    });
    const [primera] = ocurrenciesDeLaLlista([diari], new Date(2026, 2, 29), new Date(2026, 2, 30)).ocurrencies;
    expect(primera.fi).toBe(new Date(2026, 2, 30, 0, 30).getTime());
    expect([primera.diaInici, primera.diaFi]).toEqual(['2026-03-29', '2026-03-30']);
    expect(separaFranja(primera)).toBe('graella');
    const diumengeIDilluns = [...setmana(2026, 2, 29).slice(6), setmana(2026, 2, 30)[0]];
    expect(segmentaPerDies(primera, diumengeIDilluns).map(({ clau, iniciMin, fiMin, continuaDespres }) => [clau, iniciMin, fiMin, continuaDespres]))
      .toEqual([['2026-03-29', 60, 1440, false]]);
  });
});

describe('disposaDia: clústers, columnes voraces i expansió', () => {
  test('dos que es toquen (9–10 i 10–11) no se solapen: una columna i dos clústers', () => {
    const r = perClau(disposaDia([seg('a', 540, 600), seg('b', 600, 660)]));
    expect([r.a.columna, r.a.columnes, r.b.columna, r.b.columnes]).toEqual([0, 1, 0, 1]);
    expect(r.a.cluster).not.toBe(r.b.cluster);
  });

  test('dos alhora, dos columnes; la cadena A 9–10, B 9:30–10:30, C 10:15–11 fa un clúster de dos', () => {
    const dos = perClau(disposaDia([seg('a', 540, 600), seg('b', 540, 600)]));
    expect([dos.a.columna, dos.b.columna, dos.a.columnes]).toEqual([0, 1, 2]);
    const cadena = perClau(disposaDia([seg('a', 540, 600), seg('b', 570, 630), seg('c', 615, 660)]));
    expect([cadena.a.columna, cadena.b.columna, cadena.c.columna]).toEqual([0, 1, 0]);
    expect(new Set(Object.values(cadena).map((d) => d.cluster)).size).toBe(1);
    expect(Object.values(cadena).every((d) => d.columnes === 2 && d.amplada === 1)).toBe(true);
  });

  test('expansió: C 9–12, A 9–10, B 9–9:30 i D 10–11 → C=0, A=1, B=2 i D=1 amb amplada 2', () => {
    const entrada = [seg('c', 540, 720), seg('a', 540, 600), seg('b', 540, 570), seg('d', 600, 660)];
    const r = perClau(disposaDia(entrada));
    expect([r.c.columna, r.a.columna, r.b.columna, r.d.columna]).toEqual([0, 1, 2, 1]);
    expect([r.c.amplada, r.a.amplada, r.b.amplada, r.d.amplada]).toEqual([1, 1, 1, 2]);
    expect(r.d.columnes).toBe(3);
    // Amb el mateix inici, primer el més llarg; i permutar l'entrada no canvia res.
    expect(disposaDia(entrada).map((d) => d.segment.ocurrencia.clau)).toEqual(['c', 'a', 'b', 'd']);
    expect(disposaDia([...entrada].reverse())).toEqual(disposaDia(entrada));
  });

  test('durada zero: l’alçada mínima decidix el solapament, i la fi visual no passa de 1440', () => {
    const zeros = [seg('a', 600, 600), seg('b', 610, 610)];
    expect(disposaDia(zeros, { minimMinuts: 30 }).map((d) => d.columnes)).toEqual([2, 2]);
    expect(disposaDia(zeros, { minimMinuts: 5 }).map((d) => d.columnes)).toEqual([1, 1]);
    expect(disposaDia(zeros).map((d) => d.fiVisualMin)).toEqual([630, 640]);
    expect(disposaDia([seg('tard', 1430, 1430)])[0].fiVisualMin).toBe(1440);
    expect(disposaDia([])).toEqual([]);
  });
});

describe('segmentsDeFila i carrils', () => {
  test('Festes (28-09 → 04-10 exclusiu) a la seua setmana: columnes 0 a 6, barra', () => {
    const [s] = segmentsDeFila([oc('2026-09-28', '2026-10-04')], setmana(2026, 8, 28));
    expect(s).toMatchObject({ colInici: 0, colFi: 6, continuaAbans: false, continuaDespres: false, tipus: 'barra' });
  });

  test('un de diversos dies que travessa setmanes: cada fila en té un tros, amb la continuació marcada', () => {
    const llarg = oc('2026-09-25', '2026-10-07');
    const tros = (dia) => segmentsDeFila([llarg], setmana(2026, 8, dia))[0];
    expect(tros(21)).toMatchObject({ colInici: 4, colFi: 7, continuaAbans: false, continuaDespres: true });
    expect(tros(28)).toMatchObject({ colInici: 0, colFi: 7, continuaAbans: true, continuaDespres: true });
    expect(segmentsDeFila([llarg], setmana(2026, 9, 5))[0]).toMatchObject({ colInici: 0, colFi: 2, continuaAbans: true, continuaDespres: false });
    expect(segmentsDeFila([llarg], setmana(2026, 9, 12))).toEqual([]);
  });

  test('amb hora d’un sol dia és un punt; si passa de mitjanit, una barra', () => {
    const fila = setmana(2026, 9, 12);
    expect(segmentsDeFila([oc('2026-10-13T10:00', '2026-10-13T11:00')], fila)[0].tipus).toBe('punt');
    expect(segmentsDeFila([oc('2026-10-13T22:00', '2026-10-14T02:00')], fila)[0]).toMatchObject({ tipus: 'barra', colInici: 1, colFi: 3 });
  });

  test('assignaCarrils: la més llarga al carril 0, les que no se solapen el compartixen i un punt només ocupa el seu dia', () => {
    const fila = setmana(2026, 9, 12);
    const llarga = oc('2026-10-12', '2026-10-16', 'Llarga');
    const curta = oc('2026-10-13', null, 'Curta');
    const despres = oc('2026-10-17', '2026-10-19', 'Després');
    const punt = oc('2026-10-14T10:00', '2026-10-14T11:00', 'Punt');
    const carrils = Object.fromEntries(assignaCarrils(segmentsDeFila([curta, punt, despres, llarga], fila)).map((s) => [s.ocurrencia.esd.titol, s.carril]));
    expect(carrils).toEqual({ Llarga: 0, Després: 0, Curta: 1, Punt: 1 });
  });

  test('l’ordre de la fila: barres abans que punts, després l’hora i el títol en català', () => {
    const fila = setmana(2026, 9, 12);
    const titols = segmentsDeFila([
      oc('2026-10-14T12:00', '2026-10-14T13:00', 'Àpat'), oc('2026-10-14T09:00', '2026-10-14T10:00', 'Zumba'),
      oc('2026-10-14T09:00', '2026-10-14T10:00', 'Assaig'), oc('2026-10-14', null, 'Fira')
    ], fila).map((s) => s.ocurrencia.esd.titol);
    expect(titols).toEqual(['Fira', 'Assaig', 'Zumba', 'Àpat']);
  });
});

describe('retallaPerCapacitat: el «+N»', () => {
  const fila = setmana(2026, 9, 12);
  const delDimecres = (n) => assignaCarrils(segmentsDeFila(Array.from({ length: n }, (_, i) => oc('2026-10-14', null, `Acte ${i}`)), fila));

  test('cinc el mateix dia amb tres carrils: dos visibles i «+3»', () => {
    const { peces, mes } = retallaPerCapacitat(delDimecres(5), 3);
    expect(peces.map((p) => p.carril)).toEqual([0, 1]);
    expect(mes).toEqual([0, 0, 3, 0, 0, 0, 0]);
  });

  test('exactament tres: tots tres visibles i cap «+N»', () => {
    const { peces, mes } = retallaPerCapacitat(delDimecres(3), 3);
    expect(peces).toHaveLength(3);
    expect(mes.every((n) => n === 0)).toBe(true);
    expect(retallaPerCapacitat(delDimecres(9)).peces).toHaveLength(9);
  });

  test('una barra al carril 2 que travessa un dia ple es parteix en dues peces, i el dia ple la compta', () => {
    const barra = oc('2026-10-12', '2026-10-15', 'Barra');
    const dues = [oc('2026-10-12', '2026-10-15', 'A'), oc('2026-10-12', '2026-10-15', 'B')];
    const plens = [oc('2026-10-13', null, 'Ple 1')];
    const segments = assignaCarrils(segmentsDeFila([...dues, barra, ...plens], fila));
    expect(segments.find((s) => s.ocurrencia.esd.titol === 'Barra').carril).toBe(2);
    const { peces, mes } = retallaPerCapacitat(segments, 3);
    const deLaBarra = peces.filter((p) => p.segment.ocurrencia.esd.titol === 'Barra');
    expect(deLaBarra.map((p) => [p.colInici, p.colFi, p.continuaAbans, p.continuaDespres])).toEqual([[0, 1, false, true], [2, 3, true, false]]);
    expect(mes).toEqual([0, 2, 0, 0, 0, 0, 0]);
  });
});

describe('disposaMes i disposaSetmana', () => {
  test('el mes: sis files de set dies, cada una amb les seues peces, «+N» i els esdeveniments de cada dia', () => {
    const cursor = { any: 2026, mes: 9 };
    const { desde, fins } = rangDeLaGraella(cursor);
    const festes = creaEsdeveniment({ id: 'festes', titol: 'Festes', inici: { data: '2026-09-28' }, fi: { data: '2026-10-04' } });
    const mercat = creaEsdeveniment({ id: 'mercat', titol: 'Mercat', inici: { dataHora: '2026-10-03T09:00' }, fi: { dataHora: '2026-10-03T13:00' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] });
    const { ocurrencies } = ocurrenciesDeLaLlista([festes, null, mercat], desde, fins);
    const files = disposaMes(ocurrencies, graellaDelMes(cursor), { maxCarrils: 3 });
    expect(files).toHaveLength(6);
    expect(files[0].peces.map((p) => [p.segment.ocurrencia.esd.titol, p.colInici, p.colFi, p.carril, p.segment.tipus]))
      .toEqual([['Festes', 0, 6, 0, 'barra'], ['Mercat', 5, 6, 1, 'punt']]);
    expect(files[0].delDia[5]).toEqual([festes, mercat]);
    expect(files[0].delDia[6]).toEqual([]);
    expect(files[1].delDia[5]).toEqual([mercat]);
    expect(files.every((f) => f.mes.every((n) => n === 0))).toBe(true);
  });

  test('la setmana: la franja i la graella per dia, i els esdeveniments de cada dia', () => {
    const dies = setmana(2026, 9, 12);
    const { desde, fins } = rangDeLaSetmana(new Date(2026, 9, 12));
    const fira = creaEsdeveniment({ id: 'fira', titol: 'Fira', inici: { data: '2026-10-13' }, fi: { data: '2026-10-15' } });
    const ball = creaEsdeveniment({ id: 'ball', titol: 'Ball', inici: { dataHora: '2026-10-13T22:00' }, fi: { dataHora: '2026-10-14T02:00' } });
    const concert = creaEsdeveniment({ id: 'concert', titol: 'Concert', inici: { dataHora: '2026-10-13T10:00' } });
    const { ocurrencies } = ocurrenciesDeLaLlista([fira, ball, concert], desde, fins);
    const { franja, perDia, delDia } = disposaSetmana(ocurrencies, dies);
    expect(franja.peces.map((p) => [p.segment.ocurrencia.esd.titol, p.colInici, p.colFi])).toEqual([['Fira', 1, 3]]);
    expect(franja.carrils).toBe(1);
    expect(perDia.get('2026-10-13').map((d) => [d.segment.ocurrencia.esd.titol, d.segment.iniciMin, d.fiVisualMin])).toEqual([
      ['Concert', 600, 630], ['Ball', 1320, 1440]
    ]);
    expect(perDia.get('2026-10-14').map((d) => [d.segment.ocurrencia.esd.titol, d.segment.iniciMin, d.segment.fiMin])).toEqual([['Ball', 0, 120]]);
    expect(perDia.get('2026-10-12')).toEqual([]);
    // En l'ordre cronològic de les ocurrències: la Fira (00:00), el Concert (10:00) i el Ball (22:00).
    expect(delDia[1]).toEqual([fira, concert, ball]);
    expect(delDia[2]).toEqual([fira, ball]);
    expect(ocurrenciaCobrix(ocurrencies[0], '2026-10-15')).toBe(false);
  });
});

describe('posicioAra', () => {
  test('dins de la setmana, el dia i el minut; fora, null', () => {
    const dies = setmana(2026, 9, 21);
    expect(posicioAra(new Date(2026, 9, 22, 12, 34), dies)).toEqual({ clau: '2026-10-22', minut: 754 });
    expect(posicioAra(new Date(2026, 9, 26, 0, 0), dies)).toBeNull();
    expect(posicioAra(null, dies)).toBeNull();
    expect(posicioAra(new Date('demà'), dies)).toBeNull();
    if (MADRID) expect(posicioAra(Date.UTC(2026, 9, 25, 1, 30), dies)).toEqual({ clau: '2026-10-25', minut: 150 });
  });
});
