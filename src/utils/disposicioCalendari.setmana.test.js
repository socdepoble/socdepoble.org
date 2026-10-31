/* Fase visual del calendari (prompt 261001_0445) · Front Setmana: el rang
   d'hores dinàmic, la forma de cada bloc per densitat (contra les mètriques
   del CSS), el dia que mostra la tira del mòbil i l'encaix dels actes del
   final del dia. Llavor neutra. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import {
  diaDeLaTira, disposaDia, disposaSetmana, encaixaFinalDelDia, formaDelBloc, ocurrenciesDeLaLlista, rangHorari
} from './disposicioCalendari.js';
import { creaEsdeveniment } from './esdeveniment.js';
import { diesDeLaSetmana, rangDeLaSetmana } from './periodes.js';

const DILLUNS = new Date(2026, 8, 28);
const DIES = diesDeLaSetmana(DILLUNS);
const acte = (id, inici, fi = null) => creaEsdeveniment({
  id, titol: `Acte ${id}`, inici: { dataHora: inici }, fi: fi ? { dataHora: fi } : null
});
const perDiaDe = (esdeveniments, opcions) => {
  const { desde, fins } = rangDeLaSetmana(DILLUNS);
  return disposaSetmana(ocurrenciesDeLaLlista(esdeveniments, desde, fins).ocurrencies, DIES, opcions).perDia;
};

test('rangHorari sense actes: de 7 a 22', () => {
  expect(rangHorari(perDiaDe([]))).toEqual({ horaInicial: 7, horaFinal: 22 });
  expect(rangHorari(new Map())).toEqual({ horaInicial: 7, horaFinal: 22 });
  expect(rangHorari(undefined)).toEqual({ horaInicial: 7, horaFinal: 22 });
});

test('rangHorari: un acte a les 05:30 avança l’inici a les 5; un que acaba a les 23:10, la fi a les 24', () => {
  expect(rangHorari(perDiaDe([acte('a', '2026-09-29T05:30', '2026-09-29T06:00')]))).toEqual({ horaInicial: 5, horaFinal: 22 });
  expect(rangHorari(perDiaDe([acte('b', '2026-09-30T22:30', '2026-09-30T23:10')]))).toEqual({ horaInicial: 7, horaFinal: 24 });
  // Acabar just a les 22:00 no estén res; un minut més, sí.
  expect(rangHorari(perDiaDe([acte('c', '2026-09-30T21:00', '2026-09-30T22:00')]))).toEqual({ horaInicial: 7, horaFinal: 22 });
  expect(rangHorari(perDiaDe([acte('d', '2026-09-30T21:00', '2026-09-30T22:01')]))).toEqual({ horaInicial: 7, horaFinal: 23 });
});

test('rangHorari compta la fi VISUAL: un acte sense fi a les 21:50 ocupa fins a les 22:20', () => {
  expect(rangHorari(perDiaDe([acte('e', '2026-10-01T21:50')]))).toEqual({ horaInicial: 7, horaFinal: 23 });
  expect(rangHorari(perDiaDe([acte('e', '2026-10-01T21:50')], { minimMinuts: 10 }))).toEqual({ horaInicial: 7, horaFinal: 22 });
});

test('rangHorari mai ix de 0–24: el tros de matinada d’un acte que creua la mitjanit comença a les 0', () => {
  const ball = acte('f', '2026-10-02T22:00', '2026-10-03T02:00');
  expect(rangHorari(perDiaDe([ball]))).toEqual({ horaInicial: 0, horaFinal: 24 });
});

test('rangHorari fa cabre la línia d’«ara»: les 06:15 i les 23:30', () => {
  expect(rangHorari(perDiaDe([]), { minuts: [375] })).toEqual({ horaInicial: 6, horaFinal: 22 });
  expect(rangHorari(perDiaDe([]), { minuts: [1410] })).toEqual({ horaInicial: 7, horaFinal: 24 });
  expect(rangHorari(perDiaDe([]), { minuts: [NaN, undefined, 720] })).toEqual({ horaInicial: 7, horaFinal: 22 });
});

test('rangHorari: límits propis i una llista de llistes en lloc del Map', () => {
  const llistes = [...perDiaDe([acte('g', '2026-09-28T09:00', '2026-09-28T10:00')]).values()];
  expect(rangHorari(llistes, { inici: 9, fi: 10 })).toEqual({ horaInicial: 9, horaFinal: 10 });
  expect(rangHorari(new Map(), { inici: 12, fi: 12 })).toEqual({ horaInicial: 12, horaFinal: 13 });
});

test.each([
  [0, 'curt'], [30, 'curt'], [45, 'curt'], [49, 'curt'], [50, 'una-linia'], [69, 'una-linia'],
  [70, 'dues-linies'], [89, 'dues-linies'], [90, 'llarg'], [600, 'llarg'], [NaN, 'curt']
])('formaDelBloc(%s) → %s', (minuts, forma) => {
  expect(formaDelBloc(minuts)).toBe(forma);
  expect(formaDelBloc(minuts, { densitat: 'normal' })).toBe(forma);
  expect(formaDelBloc(minuts, { densitat: 'responsiva' })).toBe(forma);
});

test.each([
  [45, 'curt'], [53, 'curt'], [54, 'una-linia'], [70, 'una-linia'], [77, 'una-linia'], [78, 'dues-linies'],
  [90, 'dues-linies'], [100, 'dues-linies'], [101, 'dues-linies'], [102, 'llarg'], [600, 'llarg'], [NaN, 'curt']
])('formaDelBloc(%s, compacta) → %s', (minuts, forma) => {
  expect(formaDelBloc(minuts, { densitat: 'compacta' })).toBe(forma);
});

/* Els llindars contra el CSS: cada forma és la més gran les línies de la qual
   caben en l'alçada útil del bloc, amb les mètriques que pinta modules.css
   (hora, separació i farciment) i la línia de tokens.css. El mig píxel és el
   de baix de l'interval, que acaba a la línia de base (vegeu formaDelBloc). */
const llig = (nom) => readFileSync(resolve(process.cwd(), 'src/css', nom), 'utf8');
const TOKENS = llig('tokens.css');
const MODULES = llig('modules.css');
const valorDe = (text, nom) => new RegExp(`${nom}\\s*:\\s*([^;]+);`).exec(text)?.[1].trim();
const cosDe = (selector) => new RegExp(`\\n\\s*${selector.replace(/[.]/g, '\\.')}\\s*\\{([^{}]*)\\}`).exec(MODULES)?.[1];
const enPx = (valor) => (valor.endsWith('rem') ? parseFloat(valor) * 16 : parseFloat(valor));

test('cap forma demana més línies de les que caben, i cap en deixa una que hi cabria (normal i compacta)', () => {
  const linia = enPx(valorDe(TOKENS, '--sdp-text-meta')) * Number(valorDe(TOKENS, '--sdp-leading-tight'));
  const espai1 = enPx(valorDe(TOKENS, '--sdp-space-1'));
  expect(valorDe(MODULES, '--cal-separacio')).toBe('var(--sdp-space-1)');
  expect(valorDe(cosDe('.sdp-cal-setmana__bloc'), 'padding-block')).toBe('var(--sdp-space-1) 0');
  expect(valorDe(cosDe('.sdp-cal-setmana--compacta .sdp-cal-setmana__bloc'), 'padding-block')).toBe('0');
  const metriques = {
    normal: { hora: enPx(valorDe(cosDe('.sdp-cal-setmana'), '--cal-hora')), farciment: espai1 },
    compacta: { hora: enPx(valorDe(cosDe('.sdp-cal-setmana--compacta'), '--cal-hora')), farciment: 0 }
  };
  expect([linia, metriques.normal.hora, metriques.compacta.hora]).toEqual([expect.closeTo(16.1, 5), 48, 40]);
  const LINIES = { curt: 1, 'una-linia': 2, 'dues-linies': 3, llarg: 4 };
  const dolents = [];
  for (const [densitat, { hora, farciment }] of Object.entries(metriques)) {
    for (let m = 1; m <= 240; m++) {
      const forma = formaDelBloc(m, { densitat });
      const util = (m * hora) / 60 - espai1 - farciment;
      const caben = (n) => n * linia - 0.5 <= util;
      if (forma !== 'curt' && !caben(LINIES[forma])) dolents.push(`${densitat} ${m} min: ${forma} no hi cap`);
      if (forma !== 'llarg' && caben(LINIES[forma] + 1)) dolents.push(`${densitat} ${m} min: ${forma}, i hi cabria una línia més`);
    }
  }
  expect(dolents).toEqual([]);
});

/* Els actes del final del dia (encaixaFinalDelDia). */
const DIJOUS = '2026-10-01';
const delDijous = (esdeveniments, opcions) => perDiaDe(esdeveniments, opcions).get(DIJOUS);
const resum = (disposats) => disposats.map((d) => [d.segment.ocurrencia.esd.id, d.segment.iniciMin, d.iniciVisualMin, d.fiVisualMin, d.columna, d.columnes]);

test('encaixaFinalDelDia: un acte sense fi a les 23:56 es pinta des de les 23:30, i la seua hora continua sent la real', () => {
  const tard = acte('tard', `${DIJOUS}T23:56`);
  const disposats = delDijous([tard]);
  expect(disposats[0].fiVisualMin - disposats[0].segment.iniciMin).toBe(4); // sense encaixar, 4 minuts: no es veuria
  const [encaixat] = encaixaFinalDelDia(disposats);
  expect([encaixat.segment.iniciMin, encaixat.iniciVisualMin, encaixat.fiVisualMin]).toEqual([1436, 1410, 1440]);
  expect(encaixat.segment).toBe(disposats[0].segment);
  expect(encaixat.segment.ocurrencia.inici).toBe(new Date(2026, 9, 1, 23, 56).getTime());
  // Amb una alçada mínima de 10 minuts, des de les 23:50; amb el sostre just (23:30), no es mou.
  expect(encaixaFinalDelDia(delDijous([tard], { minimMinuts: 10 }), { minimMinuts: 10 })[0].iniciVisualMin).toBe(1430);
  expect(encaixaFinalDelDia(delDijous([acte('just', `${DIJOUS}T23:30`)]))[0].iniciVisualMin).toBe(1410);
});

test('encaixaFinalDelDia: un acte de 23:50 a 24:00 també fa l’alçada mínima; i els solapaments es tornen a calcular', () => {
  const [curt] = encaixaFinalDelDia(delDijous([acte('deu', `${DIJOUS}T23:50`, '2026-10-02T00:00')]));
  expect([curt.iniciVisualMin, curt.fiVisualMin]).toEqual([1410, 1440]);
  const llista = [acte('abans', `${DIJOUS}T23:00`, `${DIJOUS}T23:45`), acte('tard', `${DIJOUS}T23:56`)];
  expect(resum(delDijous(llista)).map((r) => r.slice(4))).toEqual([[0, 1], [0, 1]]);
  expect(resum(encaixaFinalDelDia(delDijous(llista)))).toEqual([
    ['abans', 1380, 1380, 1425, 0, 2],
    ['tard', 1436, 1410, 1440, 1, 2]
  ]);
});

test('encaixaFinalDelDia sense actes tardans: la geometria de disposaDia, amb iniciVisualMin = iniciMin', () => {
  const llista = [acte('a', `${DIJOUS}T09:00`, `${DIJOUS}T10:00`), acte('b', `${DIJOUS}T09:30`, `${DIJOUS}T10:30`)];
  const disposats = delDijous(llista);
  const encaixats = encaixaFinalDelDia(disposats);
  expect(encaixats.map((d) => ({ ...d, iniciVisualMin: undefined }))).toEqual(disposats);
  expect(encaixats.map((d) => d.iniciVisualMin)).toEqual([540, 570]);
  expect(encaixaFinalDelDia([])).toEqual([]);
  expect(encaixaFinalDelDia(undefined)).toEqual([]);
  expect(encaixaFinalDelDia(disposaDia([]))).toEqual([]);
});

test('rangHorari compta l’inici visual: l’acte de les 23:56 estén la fi a les 24 i no avança l’inici', () => {
  const perDia = perDiaDe([acte('tard', `${DIJOUS}T23:56`)]);
  const encaixat = new Map([...perDia].map(([clau, disposats]) => [clau, encaixaFinalDelDia(disposats)]));
  expect(rangHorari(encaixat)).toEqual({ horaInicial: 7, horaFinal: 24 });
  // Un inici visual de matinada sí que l'avança.
  const matinada = new Map([['x', [{ segment: { iniciMin: 400 }, iniciVisualMin: 300, fiVisualMin: 430 }]]]);
  expect(rangHorari(matinada)).toEqual({ horaInicial: 5, horaFinal: 22 });
});

test('diaDeLaTira: el dia triat de la setmana; si no, hui; si no, el dilluns', () => {
  expect(diaDeLaTira(DIES, '2026-10-02', '2026-10-01')).toBe('2026-10-02');
  expect(diaDeLaTira(DIES, null, '2026-10-01')).toBe('2026-10-01');
  expect(diaDeLaTira(DIES, '2026-10-20', '2026-10-01')).toBe('2026-10-01');
  expect(diaDeLaTira(DIES, '2026-10-20', '2026-11-01')).toBe('2026-09-28');
  expect(diaDeLaTira([], null, '2026-10-01')).toBeNull();
});
