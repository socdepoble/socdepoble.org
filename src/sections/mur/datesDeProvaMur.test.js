/**
 * Tasca 5 (ordre del Mestre, 261001) · Les dates de prova del Mur.
 *
 * Les nou importants, amb dia i hora d'esta setmana (mai en el futur); les
 * molt tècniques, del 2 al 15 de setembre, també amb hora; els actes, amb el
 * seu dia de sempre. Cap prova depén del dia en què s'executa: `ara`
 * s'injecta i es recorren tots els dies d'una setmana, les vores (dilluns de
 * matinada, diumenge a mitjanit) i la setmana del canvi d'hora.
 */
import { describe, expect, test } from 'vitest';
import { APP_SEED } from '../../data/appSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { dataDElement, momentDElement } from '../../components/universal/editorial.js';
import {
  IMPORTANTS_DEL_MUR, TECNIQUES_DEL_MUR, dillunsDe, llavorAmbDatesDeProva, momentsDEstaSetmana
} from './datesDeProvaMur.js';

/* Hora local. La setmana de l'ordre (del 28-09 al 04-10-2026) i la del canvi
   d'hora (diumenge 25-10-2026, les 03:00 tornen a ser les 02:00). */
const MOMENTS = [
  ['dilluns de matinada, encara sense jornada', new Date(2026, 8, 28, 0, 0, 30)],
  ['dilluns a les 03:00', new Date(2026, 8, 28, 3, 0)],
  ['dilluns, el primer mig minut de jornada', new Date(2026, 8, 28, 8, 0, 30)],
  ['dilluns a migdia', new Date(2026, 8, 28, 12, 0)],
  ['dimarts de matí', new Date(2026, 8, 29, 9, 0)],
  ['dimecres de vesprada', new Date(2026, 8, 30, 15, 0)],
  ['dijous a l’hora de l’ordre', new Date(2026, 9, 1, 1, 15)],
  ['divendres de nit', new Date(2026, 9, 2, 22, 30)],
  ['dissabte a mitjanit', new Date(2026, 9, 3, 23, 59)],
  ['diumenge, l’últim segon', new Date(2026, 9, 4, 23, 59, 59)],
  ['diumenge del canvi d’hora', new Date(2026, 9, 25, 23, 0)],
  ['hui, quan s’executa la prova', new Date()]
];

const N = IMPORTANTS_DEL_MUR.length;
const clau = ([coleccio, id]) => `${coleccio}:${id}`;
const diaLocal = (valor) => {
  const d = new Date(valor);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
};

/* Les targetes del Mur amb la data que els dona MurSection: una pàgina de
   sistema porta el copy com a data de CREACIÓ (created_at), sense `date`. */
function targetesDelMur(llavor) {
  const pagines = new Map((llavor.pages || []).map((pagina) => [pagina.id, pagina]));
  return [
    ...llavor.events.map((item) => ({ clau: `events:${item.id}`, item })),
    ...llavor.feedPosts.map((item) => ({ clau: `feedPosts:${item.id}`, item })),
    ...llavor.marketItems.map((item) => ({ clau: `marketItems:${item.id}`, item })),
    ...SYSTEM_PAGES.filter(({ key }) => pagines.has(key)).map(({ key }) => ({
      clau: `pages:${key}`, item: { ...pagines.get(key), date: undefined, created_at: pagines.get(key).date }
    }))
  ];
}

describe('les importants: dia i hora d’esta setmana, mai en el futur', () => {
  test.each(MOMENTS)('%s', (_, ara) => {
    const dilluns = dillunsDe(ara);
    expect([dilluns.getDay(), dilluns.getHours(), dilluns.getMinutes()]).toEqual([1, 0, 0]);
    expect(ara.getTime() - dilluns.getTime()).toBeLessThan(8 * 24 * 60 * 60 * 1000);
    const moments = momentsDEstaSetmana(N, ara).map((moment) => moment.getTime());
    expect(moments).toHaveLength(N);
    for (const moment of moments) {
      expect(moment).toBeGreaterThanOrEqual(dilluns.getTime());
      expect(moment).toBeLessThan(ara.getTime());
    }
    // De la més nova a la més vella, sense cap empat.
    moments.slice(1).forEach((moment, i) => expect(moment).toBeLessThan(moments[i]));
    // Amb jornada començada, cap a les quatre de la matinada.
    const jornada = new Date(dilluns.getFullYear(), dilluns.getMonth(), dilluns.getDate(), 8);
    if (ara.getTime() - jornada.getTime() >= N * 60 * 1000) {
      for (const moment of moments) {
        expect(new Date(moment).getHours()).toBeGreaterThanOrEqual(8);
        expect(new Date(moment).getHours()).toBeLessThan(22);
        expect(moment % 60000).toBe(0);
      }
    }
  });
});

describe('la llavor del Mur amb les dates de prova', () => {
  test('cada targeta nomenada existix a la llavor: cap id fantasma', () => {
    const existents = new Set(targetesDelMur(APP_SEED).map(({ clau: c }) => c));
    for (const fila of [...IMPORTANTS_DEL_MUR, ...TECNIQUES_DEL_MUR]) expect(existents.has(clau(fila)), clau(fila)).toBe(true);
    expect(N).toBeGreaterThanOrEqual(8);
    expect(N).toBeLessThanOrEqual(9);
  });

  test.each(MOMENTS)('%s: les importants dalt, les tècniques del 2 al 15 de setembre i els actes al seu dia', (_, ara) => {
    const llavor = llavorAmbDatesDeProva(APP_SEED, ara);
    const dilluns = dillunsDe(ara).getTime();
    const ordenades = targetesDelMur(llavor)
      .map((targeta) => ({ ...targeta, moment: momentDElement(targeta.item) }))
      .sort((a, b) => b.moment - a.moment);
    const esperat = [...IMPORTANTS_DEL_MUR.map(clau), ...TECNIQUES_DEL_MUR.map(clau)];
    expect(ordenades.slice(0, esperat.length).map(({ clau: c }) => c)).toEqual(esperat);

    for (const { item, moment } of ordenades.slice(0, N)) {
      expect(moment).toBeGreaterThanOrEqual(dilluns);
      expect(moment).toBeLessThan(ara.getTime());
      expect(dataDElement(item).time).toMatch(/^\d{2}:\d{2}$/);
    }
    for (const { item, moment } of ordenades.slice(N, esperat.length)) {
      const [any, mes, dia] = diaLocal(moment);
      expect([any, mes]).toEqual([2026, 9]);
      expect(dia).toBeGreaterThanOrEqual(2);
      expect(dia).toBeLessThanOrEqual(15);
      expect(dataDElement(item).time).toMatch(/^\d{2}:\d{2}$/);
    }
    // Els actes conserven el dia de l'acte (el 2n Aplec, el 29-01-2023).
    expect(llavor.events).toBe(APP_SEED.events);
    expect(ordenades.at(-1).clau).toBe('events:aplec-2023');
  });

  /* Ordre del Mestre (261007) · «Drets d'autor» no és cap de les importants:
     amb la seua data real (2026-01-30, 00:00 hora local) cau avall, darrere
     de les importants i de les tècniques, i les importants continuen dalt. */
  test.each(MOMENTS)('%s: «Drets d’autor» va avall, amb la seua data de creació', (_, ara) => {
    expect([...IMPORTANTS_DEL_MUR, ...TECNIQUES_DEL_MUR].map(clau)).not.toContain('pages:drets-autor');
    const ordenades = targetesDelMur(llavorAmbDatesDeProva(APP_SEED, ara))
      .map((targeta) => ({ ...targeta, moment: momentDElement(targeta.item) }))
      .sort((a, b) => b.moment - a.moment);
    const posicio = ordenades.findIndex(({ clau: c }) => c === 'pages:drets-autor');
    expect(posicio).toBeGreaterThanOrEqual(N + TECNIQUES_DEL_MUR.length);
    expect(ordenades[posicio].moment).toBe(Date.parse(PAGE_COPY['drets-autor'].date));
    expect(ordenades[posicio].item.created_at).toBe('2026-01-30T00:00:00+01:00');
  });

  test('la llavor original no canvia: el copy conserva la seua data de creació', () => {
    const abans = JSON.stringify(APP_SEED.pages.map(({ id, date }) => [id, date]));
    llavorAmbDatesDeProva(APP_SEED, new Date(2026, 8, 30, 15, 0));
    expect(JSON.stringify(APP_SEED.pages.map(({ id, date }) => [id, date]))).toBe(abans);
    expect(APP_SEED.pages.find(({ id }) => id === 'projecte').date).toBe(PAGE_COPY.projecte.date);
    expect(APP_SEED.marketItems.find(({ id }) => id === 'mac-mini-m4').created_at).toBe('2026-02-15T12:00:00.000Z');
  });

  test('cap data de prova no té la forma d’un dia serialitzat (mitjanit UTC exacta), que es llegiria sense hora', () => {
    const nomenades = new Set([...IMPORTANTS_DEL_MUR, ...TECNIQUES_DEL_MUR].map(clau));
    for (const [, ara] of MOMENTS) {
      const dates = targetesDelMur(llavorAmbDatesDeProva(APP_SEED, ara))
        .filter(({ clau: c }) => nomenades.has(c))
        .map(({ item }) => item.created_at);
      expect(dates).toHaveLength(nomenades.size);
      for (const data of dates) expect(String(data)).not.toMatch(/T00:00:00\.000Z$/);
    }
  });

  test('una llavor sense cap targeta nomenada torna igual (els actes, pobles i multimèdia no es toquen)', () => {
    const llavor = { feedPosts: [{ id: 'crònica' }], events: [{ id: 'aplec' }], marketItems: [{ id: 'mel' }], mediaItems: [{ id: 'foto' }] };
    expect(llavorAmbDatesDeProva(llavor, new Date(2026, 8, 30, 15, 0))).toEqual(llavor);
  });
});
