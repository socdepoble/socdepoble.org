/* T10 (ordre del Mestre, 261001) · L'estat de /calendari a la URL. La prova
   de compatibilitat és la del píxel: per a cada URL que avui obri la pàgina
   (les de CalendariSection.test.jsx), el cursor és el de mesDeLaUrl i els
   paràmetres que s'escriuen són els d'ara. Les vistes noves només amb un
   ?vista= de la llista (fase visual, prompt 261001_0445: Setmana, Dues
   setmanes, Mes, Any i Agenda). */
import { describe, expect, test } from 'vitest';
import {
  anyDeLaUrl, canviaVista, estatDeLaUrl, navega, obriDia, paramsDeLEstat, rangDeLaVista, triaDia, vistaDeLaUrl, VISTES
} from './estatCalendari.js';
import { clauDeMes, mesDeLaUrl } from './calendariGlobal.js';
import { mouMes } from '../../utils/calendari.js';

const AVUI = new Date(2026, 9, 1);
const OBERTURA = { any: 2026, mes: 9 };
const llig = (consulta) => {
  const p = new URLSearchParams(consulta);
  return { vista: p.get('vista'), setmana: p.get('setmana'), date: p.get('date'), mes: p.get('mes'), any: p.get('any') };
};
const estat = (consulta, opcions = {}) => estatDeLaUrl(llig(consulta), { obertura: OBERTURA, avui: AVUI, ...opcions });
/* El que fa setSearchParams (RouterContext): null esborra, la resta es posa. */
function aplica(consulta, params) {
  const url = new URLSearchParams(consulta);
  for (const [clau, valor] of Object.entries(params)) (valor == null ? url.delete(clau) : url.set(clau, valor));
  return url.toString();
}
/* Els paràmetres buits de les vistes noves: paramsDeLEstat els escriu tots. */
const BUITS = Object.freeze({ vista: null, setmana: null, mes: null, any: null, date: null });

/* Les URLs d'avui: les de CalendariSection.test.jsx, i el ?mes= brossa. */
const URLS_D_AVUI = [
  '', 'mes=2026-10', 'mes=2026-09', 'date=2026-10-01', 'date=2026-09-29', 'date=2026-02-30', 'date=2026-10-10',
  'date=2026-10-01&mes=2026-08', ...['2026-13', '2026-00', '0026-01', '2026-9', '2026-09-01', 'demà', ''].map((m) => `mes=${encodeURIComponent(m)}`),
  'date=0026-10-01', 'date=demà', 'date=&mes=2026-03'
];

describe('compatibilitat: sense ?vista= tot és com ara', () => {
  test.each(URLS_D_AVUI)('«%s»: el cursor de mesDeLaUrl, sense vista i amb el ?date= tal qual', (consulta) => {
    const p = llig(consulta);
    const e = estat(consulta);
    expect(e.vista).toBeNull();
    expect(e.cursor).toEqual(mesDeLaUrl({ date: p.date || null, mes: p.mes || null }, OBERTURA));
    expect(e.diaTriat).toBe(p.date || null);
    // Un ?vista= que no és cap de les vistes noves no canvia res.
    for (const vista of ['SETMANA', 'dia', '', 'Mes', 'setmana ', 'Agenda', 'ANY', 'dues setmanes', 'dues_setmanes']) {
      expect(estat(`${consulta}&vista=${encodeURIComponent(vista)}`), vista).toEqual(e);
    }
    // Un ?any= sense vista tampoc.
    expect(estat(`${consulta}&any=2031`)).toEqual(e);
  });

  test.each(URLS_D_AVUI)('«%s»: les fletxes, «Hui» i els dies escriuen el mateix que CalendariSection', (consulta) => {
    const e = estat(consulta);
    // canviaMes (CalendariSection) · { mes: clauDeMes(nou), date: null }
    for (const [direccio, nou] of [['anterior', mouMes(e.cursor, -1)], ['seguent', mouMes(e.cursor, 1)], ['hui', { any: 2026, mes: 9 }]]) {
      expect(aplica(consulta, paramsDeLEstat(navega(e, direccio, AVUI))), direccio).toBe(aplica(consulta, { mes: clauDeMes(nou), date: null }));
    }
    // triaDia (CalendariSection) · un dia: { date, mes: null }; el mateix dia: { date: null, mes: clauDeMes(cursor) }
    expect(aplica(consulta, paramsDeLEstat(triaDia(e, '2026-10-17')))).toBe(aplica(consulta, { date: '2026-10-17', mes: null }));
    if (e.diaTriat) {
      expect(aplica(consulta, paramsDeLEstat(triaDia(e, e.diaTriat)))).toBe(aplica(consulta, { date: null, mes: clauDeMes(e.cursor) }));
    }
  });

  test('?vista=mes sobre una URL d’avui vàlida veu el mateix mes', () => {
    for (const consulta of ['', 'mes=2026-09', 'date=2026-09-29', 'date=2026-10-01&mes=2026-08', 'mes=2026-13']) {
      const p = llig(consulta);
      expect(estat(`vista=mes&${consulta}`).cursor, consulta).toEqual(mesDeLaUrl({ date: p.date, mes: p.mes }, OBERTURA));
    }
    // En les vistes noves un ?date= que no existix no tria res (fallada tancada): mana el ?mes= o l'obertura.
    expect(estat('vista=mes&date=2026-02-30')).toMatchObject({ diaTriat: null, cursor: OBERTURA });
    expect(estat('vista=mes&date=2026-02-30&mes=2026-03')).toMatchObject({ diaTriat: null, cursor: { any: 2026, mes: 2 } });
  });
});

describe('vistes i àncora', () => {
  test('les cinc vistes noves, i res més', () => {
    expect(VISTES).toEqual(['setmana', 'dues-setmanes', 'mes', 'any', 'agenda']);
    expect(['setmana', 'dues-setmanes', 'mes', 'any', 'agenda', 'SETMANA', 'dia', 'Agenda', 'dues_setmanes', '', null, undefined].map(vistaDeLaUrl))
      .toEqual(['setmana', 'dues-setmanes', 'mes', 'any', 'agenda', null, null, null, null, null, null, null]);
  });

  test('?any=: quatre xifres a partir del 1000, com les claus de mes', () => {
    expect(['2026', '1000', '9999'].map(anyDeLaUrl)).toEqual([2026, 1000, 9999]);
    for (const brossa of ['0999', '26', '2026-01', ' 2026', '20266', 'demà', '', null, undefined, 2026]) expect(anyDeLaUrl(brossa), String(brossa)).toBeNull();
  });

  test('setmana: el ?date= vàlid mana, després el ?setmana=, després el ?mes= (el dia 1) i després l’obertura', () => {
    expect(estat('vista=setmana&date=2026-10-01&setmana=2026-W45')).toMatchObject({ vista: 'setmana', diaTriat: '2026-10-01', dilluns: new Date(2026, 8, 28), cursor: { any: 2026, mes: 9 } });
    expect(estat('vista=setmana&setmana=2026-W40&mes=2026-03')).toMatchObject({ diaTriat: null, dilluns: new Date(2026, 8, 28), cursor: { any: 2026, mes: 9 } });
    expect(estat('vista=setmana&mes=2026-09')).toMatchObject({ dilluns: new Date(2026, 7, 31), cursor: { any: 2026, mes: 8 } });
    // Sense àncora: la setmana de hui si hui és del mes d'obertura; si no, la de l'1 d'eixe mes.
    expect(estat('vista=setmana').dilluns).toEqual(new Date(2026, 8, 28));
    expect(estat('vista=setmana', { obertura: { any: 2026, mes: 8 } }).dilluns).toEqual(new Date(2026, 7, 31));
  });

  test('setmana: un ?date= o un ?setmana= brossa no trien res', () => {
    for (const date of ['2026-02-30', '0026-10-01', 'demà']) {
      expect(estat(`vista=setmana&date=${encodeURIComponent(date)}&mes=2026-03`), date).toMatchObject({ diaTriat: null, dilluns: new Date(2026, 1, 23) });
    }
    expect(estat('vista=setmana&setmana=2027-W53')).toMatchObject({ diaTriat: null, dilluns: new Date(2026, 8, 28) });
  });

  test('el mes d’una setmana és el del seu dijous', () => {
    expect(estat('vista=setmana&setmana=2026-W53').cursor).toEqual({ any: 2026, mes: 11 });
    expect(estat('vista=setmana&setmana=2026-W44').cursor).toEqual({ any: 2026, mes: 9 });
  });

  test('dues setmanes: un dia de dins del període del ?setmana= no el mou; un de fora porta la seua setmana', () => {
    expect(estat('vista=dues-setmanes')).toMatchObject({ vista: 'dues-setmanes', diaTriat: null, dilluns: new Date(2026, 8, 28), cursor: { any: 2026, mes: 9 } });
    expect(estat('vista=dues-setmanes&setmana=2026-W40&date=2026-10-08')).toMatchObject({ diaTriat: '2026-10-08', dilluns: new Date(2026, 8, 28), cursor: { any: 2026, mes: 9 } });
    expect(estat('vista=dues-setmanes&setmana=2026-W40&date=2026-10-20')).toMatchObject({ diaTriat: '2026-10-20', dilluns: new Date(2026, 9, 19) });
    expect(estat('vista=dues-setmanes&date=2026-10-08').dilluns).toEqual(new Date(2026, 9, 5));
    expect(estat('vista=dues-setmanes&setmana=2026-W42').dilluns).toEqual(new Date(2026, 9, 12));
  });

  test('mes i agenda: el ?date=, el ?mes= i l’obertura, en eixe ordre', () => {
    for (const vista of ['mes', 'agenda']) {
      expect(estat(`vista=${vista}&mes=2026-03`), vista).toMatchObject({ vista, diaTriat: null, cursor: { any: 2026, mes: 2 } });
      expect(estat(`vista=${vista}&date=2026-05-04&mes=2026-03`), vista).toMatchObject({ diaTriat: '2026-05-04', cursor: { any: 2026, mes: 4 } });
      expect(estat(`vista=${vista}`).cursor, vista).toEqual(OBERTURA);
    }
  });

  /* Correcció de la revisió · La graella de Mes pinta els dies dels mesos
     veïns de la primera i l'última fila: el seu ?date= no mou el ?mes=. */
  test('mes: un ?date= d’un mes veí que cau dins de la graella del ?mes= no la mou', () => {
    // Octubre de 2026: del dilluns 28-09 al diumenge 01-11.
    expect(estat('vista=mes&mes=2026-10&date=2026-11-01')).toMatchObject({ diaTriat: '2026-11-01', cursor: { any: 2026, mes: 9 }, dilluns: new Date(2026, 9, 26) });
    expect(estat('vista=mes&mes=2026-10&date=2026-09-28').cursor).toEqual({ any: 2026, mes: 9 });
    // Fora de la graella, mana el dia; i a l'Agenda, que no pinta veïns, també.
    expect(estat('vista=mes&mes=2026-10&date=2026-11-02').cursor).toEqual({ any: 2026, mes: 10 });
    expect(estat('vista=agenda&mes=2026-10&date=2026-11-01').cursor).toEqual({ any: 2026, mes: 10 });
  });

  test('any: el ?date=, el ?any= (amb el mes de hui si és l’any en curs; si no, gener), el ?mes= i l’obertura', () => {
    expect(estat('vista=any&any=2027')).toMatchObject({ vista: 'any', diaTriat: null, cursor: { any: 2027, mes: 0 } });
    expect(estat('vista=any&any=2026').cursor).toEqual({ any: 2026, mes: 9 });
    expect(estat('vista=any&date=2025-05-04&any=2027')).toMatchObject({ diaTriat: '2025-05-04', cursor: { any: 2025, mes: 4 } });
    expect(estat('vista=any&any=0999&mes=2024-03').cursor).toEqual({ any: 2024, mes: 2 });
    expect(estat('vista=any').cursor).toEqual(OBERTURA);
  });
});

describe('paramsDeLEstat', () => {
  test('setmana: ?vista=setmana amb la setmana ISO, o el ?date= si hi ha dia; lleva el ?mes= i l’?any=', () => {
    expect(paramsDeLEstat(estat('vista=setmana&mes=2026-10'))).toEqual({ ...BUITS, vista: 'setmana', setmana: '2026-W40' });
    expect(paramsDeLEstat(estat('vista=setmana&date=2026-10-02'))).toEqual({ ...BUITS, vista: 'setmana', date: '2026-10-02' });
  });

  test('mes i agenda: ?vista= amb el ?mes=, o el ?date=; lleven el ?setmana= i l’?any=', () => {
    expect(paramsDeLEstat(estat('vista=mes&setmana=2026-W40'))).toEqual({ ...BUITS, vista: 'mes', mes: '2026-10' });
    expect(paramsDeLEstat(estat('vista=mes&date=2026-10-02'))).toEqual({ ...BUITS, vista: 'mes', date: '2026-10-02' });
    expect(paramsDeLEstat(estat('vista=agenda&mes=2026-03&any=2031'))).toEqual({ ...BUITS, vista: 'agenda', mes: '2026-03' });
  });

  test('dues setmanes: el ?setmana= de la primera, també amb dia triat', () => {
    expect(paramsDeLEstat(estat('vista=dues-setmanes&setmana=2026-W40&date=2026-10-08')))
      .toEqual({ ...BUITS, vista: 'dues-setmanes', setmana: '2026-W40', date: '2026-10-08' });
  });

  test('any: l’?any=, o el ?date= si hi ha dia', () => {
    expect(paramsDeLEstat(estat('vista=any&any=2027&mes=2026-03'))).toEqual({ ...BUITS, vista: 'any', any: '2027' });
    expect(paramsDeLEstat(estat('vista=any&date=2027-02-03'))).toEqual({ ...BUITS, vista: 'any', date: '2027-02-03' });
  });

  test('anada i tornada: la URL que s’escriu torna el mateix estat', () => {
    for (const consulta of [
      'vista=setmana&setmana=2026-W43', 'vista=setmana&date=2026-10-21', 'vista=mes&mes=2026-03', 'vista=mes&date=2026-12-31',
      'vista=dues-setmanes&setmana=2026-W43', 'vista=dues-setmanes&setmana=2026-W43&date=2026-10-27', 'vista=agenda&mes=2026-05',
      'vista=agenda&date=2026-05-04', 'vista=any&any=2031', 'vista=any&date=2031-02-03'
    ]) {
      const e = estat(consulta);
      expect(estat(aplica('', paramsDeLEstat(e))), consulta).toEqual(e);
    }
  });
});

describe('navega, canviaVista, triaDia i obriDia', () => {
  test('setmana: la següent, l’anterior (també creuant l’any) i la de hui; sempre sense dia triat', () => {
    const des = (consulta, direccio, avui = AVUI) => navega(estat(consulta), direccio, avui);
    expect(des('vista=setmana&date=2026-10-21', 'seguent')).toMatchObject({ dilluns: new Date(2026, 9, 26), diaTriat: null });
    expect(des('vista=setmana&setmana=2026-W14', 'anterior')).toMatchObject({ dilluns: new Date(2026, 2, 23), diaTriat: null });
    expect(des('vista=setmana&setmana=2026-W53', 'seguent')).toMatchObject({ dilluns: new Date(2027, 0, 4), cursor: { any: 2027, mes: 0 } });
    expect(des('vista=setmana&setmana=2026-W10', 'hui', new Date(2026, 9, 22))).toMatchObject({ dilluns: new Date(2026, 9, 19), diaTriat: null });
    const e = estat('vista=setmana');
    expect(navega(e, 'demà', AVUI)).toBe(e);
  });

  test('dues setmanes: de dos en dos, i «Hui» comença per la setmana de hui', () => {
    const e = estat('vista=dues-setmanes&setmana=2026-W40&date=2026-10-08');
    expect(navega(e, 'seguent', AVUI)).toMatchObject({ vista: 'dues-setmanes', dilluns: new Date(2026, 9, 12), diaTriat: null });
    expect(navega(e, 'anterior', AVUI)).toMatchObject({ dilluns: new Date(2026, 8, 14), cursor: { any: 2026, mes: 8 } });
    expect(navega(estat('vista=dues-setmanes&setmana=2026-W10'), 'hui', AVUI).dilluns).toEqual(new Date(2026, 8, 28));
  });

  test('mes i agenda: el mes d’abans, el de després i el de hui, sense dia triat', () => {
    expect(navega(estat('vista=mes&date=2026-10-17'), 'anterior', AVUI)).toMatchObject({ vista: 'mes', cursor: { any: 2026, mes: 8 }, diaTriat: null });
    expect(navega(estat('vista=mes&mes=2026-12'), 'seguent', AVUI).cursor).toEqual({ any: 2027, mes: 0 });
    expect(navega(estat('vista=mes&mes=2026-03'), 'hui', AVUI).cursor).toEqual({ any: 2026, mes: 9 });
    expect(navega(estat('vista=agenda&mes=2026-12'), 'seguent', AVUI)).toMatchObject({ vista: 'agenda', cursor: { any: 2027, mes: 0 } });
    expect(navega(estat('vista=agenda&date=2026-05-04'), 'hui', AVUI)).toMatchObject({ vista: 'agenda', cursor: { any: 2026, mes: 9 }, diaTriat: null });
  });

  test('any: l’any d’abans, el de després i el de hui', () => {
    expect(navega(estat('vista=any&any=2026'), 'seguent', AVUI)).toMatchObject({ vista: 'any', cursor: { any: 2027, mes: 0 }, diaTriat: null });
    expect(navega(estat('vista=any&any=2027'), 'anterior', AVUI).cursor).toEqual({ any: 2026, mes: 9 });
    expect(navega(estat('vista=any&date=2031-02-03'), 'hui', AVUI)).toMatchObject({ cursor: { any: 2026, mes: 9 }, diaTriat: null });
  });

  test('canviaVista: del mes a la setmana de hui, o de l’1; amb dia triat, la seua', () => {
    expect(canviaVista(estat('vista=mes&mes=2026-10'), 'setmana', AVUI)).toMatchObject({ vista: 'setmana', dilluns: new Date(2026, 8, 28), diaTriat: null });
    expect(canviaVista(estat('vista=mes&mes=2026-12'), 'setmana', AVUI).dilluns).toEqual(new Date(2026, 10, 30));
    expect(canviaVista(estat('vista=mes&date=2026-10-21'), 'setmana', AVUI)).toMatchObject({ dilluns: new Date(2026, 9, 19), diaTriat: '2026-10-21' });
    // Sense ?vista= (el calendari d'ara) també es pot passar a una vista nova.
    expect(canviaVista(estat('mes=2026-10'), 'setmana', AVUI).vista).toBe('setmana');
  });

  test('canviaVista: de la setmana al mes de hui si hui n’és, o al del dijous; amb dia triat, el seu', () => {
    const setmana = estat('vista=setmana&setmana=2026-W40');
    expect(canviaVista(setmana, 'mes', new Date(2026, 8, 29))).toMatchObject({ vista: 'mes', cursor: { any: 2026, mes: 8 } });
    expect(canviaVista(setmana, 'mes', new Date(2026, 10, 15))).toMatchObject({ vista: 'mes', cursor: { any: 2026, mes: 9 } });
    expect(canviaVista(estat('vista=setmana&date=2026-09-30'), 'mes', new Date(2026, 10, 15))).toMatchObject({ cursor: { any: 2026, mes: 8 }, diaTriat: '2026-09-30' });
    expect(canviaVista(setmana, 'setmana', AVUI)).toBe(setmana);
    expect(canviaVista(setmana, 'dia', AVUI)).toBe(setmana);
  });

  test('canviaVista entre les vistes noves: el mateix període, i el dia triat sempre', () => {
    // Setmana ↔ Dues setmanes: el mateix dilluns; de dues a una, la de hui si hui n'és.
    expect(canviaVista(estat('vista=setmana&setmana=2026-W42'), 'dues-setmanes', AVUI)).toMatchObject({ vista: 'dues-setmanes', dilluns: new Date(2026, 9, 12) });
    const dues = estat('vista=dues-setmanes&setmana=2026-W42');
    expect(canviaVista(dues, 'setmana', AVUI).dilluns).toEqual(new Date(2026, 9, 12));
    expect(canviaVista(dues, 'setmana', new Date(2026, 9, 21)).dilluns).toEqual(new Date(2026, 9, 19));
    // Dues setmanes → Mes: el de hui si hui n'és; si no, el del primer dijous.
    expect(canviaVista(estat('vista=dues-setmanes&setmana=2026-W40'), 'mes', AVUI).cursor).toEqual({ any: 2026, mes: 9 });
    expect(canviaVista(estat('vista=dues-setmanes&setmana=2026-W38'), 'mes', AVUI).cursor).toEqual({ any: 2026, mes: 8 });
    // Mes ↔ Agenda ↔ Any: el mateix mes; de l'Any, el mes de hui o gener.
    expect(canviaVista(estat('vista=mes&mes=2026-03'), 'agenda', AVUI)).toMatchObject({ vista: 'agenda', cursor: { any: 2026, mes: 2 } });
    expect(canviaVista(estat('vista=mes&mes=2026-03'), 'any', AVUI)).toMatchObject({ vista: 'any', cursor: { any: 2026, mes: 2 } });
    expect(canviaVista(estat('vista=any&any=2027'), 'mes', AVUI).cursor).toEqual({ any: 2027, mes: 0 });
    expect(canviaVista(estat('vista=any&any=2027'), 'setmana', AVUI).dilluns).toEqual(new Date(2026, 11, 28));
    expect(canviaVista(estat('vista=any&any=2026'), 'setmana', AVUI).dilluns).toEqual(new Date(2026, 8, 28));
    // El dia triat passa d'una vista a l'altra.
    for (const nova of ['setmana', 'dues-setmanes', 'mes', 'any']) {
      expect(canviaVista(estat('vista=agenda&date=2026-05-04'), nova, AVUI), nova).toMatchObject({ vista: nova, diaTriat: '2026-05-04', cursor: { any: 2026, mes: 4 } });
    }
  });

  /* Correcció de la revisió · Si l'1 cau en divendres, dissabte o diumenge, el
     dijous de la seua setmana és del mes d'abans: de Mes (o d'Any) a una vista
     de setmanes i de tornada, la regla del dijous perdia el mes (o l'any). */
  test('canviaVista: anar de Mes o d’Any a les setmanes i tornar conserva el mes, també si l’1 cau en cap de setmana', () => {
    const tornada = (consulta, setmanes, cap) => canviaVista(canviaVista(estat(consulta), setmanes, AVUI), cap, AVUI);
    // L'1 de novembre de 2026 és diumenge: la seua setmana és la W44 (del 26-10 a l'1-11), amb el dijous a octubre.
    expect(paramsDeLEstat(canviaVista(estat('vista=mes&mes=2026-11'), 'setmana', AVUI))).toEqual({ ...BUITS, vista: 'setmana', setmana: '2026-W44' });
    expect(paramsDeLEstat(tornada('vista=mes&mes=2026-11', 'setmana', 'mes'))).toEqual({ ...BUITS, vista: 'mes', mes: '2026-11' });
    expect(tornada('vista=mes&mes=2026-11', 'dues-setmanes', 'mes').cursor).toEqual({ any: 2026, mes: 10 });
    // L'any 2027: la setmana de l'1 de gener comença el 28-12-2026.
    expect(paramsDeLEstat(tornada('vista=any&any=2027', 'setmana', 'any'))).toEqual({ ...BUITS, vista: 'any', any: '2027' });
    expect(paramsDeLEstat(tornada('vista=any&any=2027', 'dues-setmanes', 'any'))).toEqual({ ...BUITS, vista: 'any', any: '2027' });
    // Tots els mesos de 2026 i 2027, amb les dos vistes de setmanes, cap a Mes i cap a Agenda.
    for (let i = 0; i < 24; i += 1) {
      const mes = clauDeMes({ any: 2026 + Math.floor(i / 12), mes: i % 12 });
      for (const setmanes of ['setmana', 'dues-setmanes']) {
        for (const vista of ['mes', 'agenda']) {
          expect(tornada(`vista=${vista}&mes=${mes}`, setmanes, vista).cursor, `${vista} ${mes} ${setmanes}`).toEqual(estat(`vista=${vista}&mes=${mes}`).cursor);
        }
      }
    }
    // Una setmana on comença un mes porta a eixe mes; una sense cap dia 1, al del dijous.
    expect(canviaVista(estat('vista=setmana&setmana=2026-W44'), 'mes', AVUI).cursor).toEqual({ any: 2026, mes: 10 });
    expect(canviaVista(estat('vista=setmana&setmana=2026-W43'), 'mes', AVUI).cursor).toEqual({ any: 2026, mes: 9 });
  });

  test('triaDia: tria un dia (el període el seguix) i, tornat a clicar, el lleva sense moure el període', () => {
    const triat = triaDia(estat('vista=setmana&setmana=2026-W40'), '2026-10-21');
    expect(triat).toMatchObject({ diaTriat: '2026-10-21', dilluns: new Date(2026, 9, 19), cursor: { any: 2026, mes: 9 } });
    expect(triaDia(triat, '2026-10-21')).toMatchObject({ diaTriat: null, dilluns: new Date(2026, 9, 19) });
    const e = estat('vista=mes');
    expect(triaDia(e, '2026-02-30')).toBe(e);
  });

  test('triaDia a dues setmanes: un dia de la segona fila no mou la graella', () => {
    const dues = estat('vista=dues-setmanes&setmana=2026-W40');
    expect(triaDia(dues, '2026-10-09')).toMatchObject({ diaTriat: '2026-10-09', dilluns: new Date(2026, 8, 28) });
    expect(triaDia(dues, '2026-10-20')).toMatchObject({ diaTriat: '2026-10-20', dilluns: new Date(2026, 9, 19) });
  });

  /* Correcció de la revisió · Clicar la cel·la «1 de nov.» des d'octubre feia
     saltar la graella a novembre, i tornar-la a clicar no la tornava. */
  test('triaDia a Mes: un dia d’un mes veí no mou la graella i, tornat a clicar, deixa el mateix ?mes=', () => {
    const octubre = estat('vista=mes&mes=2026-10');
    const triat = triaDia(octubre, '2026-11-01');
    expect(triat).toMatchObject({ diaTriat: '2026-11-01', cursor: { any: 2026, mes: 9 } });
    expect(paramsDeLEstat(triat)).toEqual({ ...BUITS, vista: 'mes', mes: '2026-10', date: '2026-11-01' });
    // La URL que s'escriu torna el mateix estat.
    expect(estat(aplica('vista=mes&mes=2026-10', paramsDeLEstat(triat)))).toEqual(triat);
    expect(paramsDeLEstat(triaDia(triat, '2026-11-01'))).toEqual({ ...BUITS, vista: 'mes', mes: '2026-10' });
    // Un dia del mes, com sempre: només el ?date=; un de fora de la graella porta el seu mes.
    expect(paramsDeLEstat(triaDia(octubre, '2026-10-17'))).toEqual({ ...BUITS, vista: 'mes', date: '2026-10-17' });
    expect(triaDia(octubre, '2026-11-02').cursor).toEqual({ any: 2026, mes: 10 });
  });

  test('obriDia: el dia de l’Any obri la seua setmana, amb el dia triat', () => {
    const any = estat('vista=any&any=2026');
    expect(obriDia(any, '2026-03-18')).toEqual({ vista: 'setmana', diaTriat: '2026-03-18', cursor: { any: 2026, mes: 2 }, dilluns: new Date(2026, 2, 16) });
    expect(paramsDeLEstat(obriDia(any, '2026-03-18'))).toEqual({ ...BUITS, vista: 'setmana', date: '2026-03-18' });
    for (const brossa of ['2026-02-30', 'demà', null]) expect(obriDia(any, brossa)).toBe(any);
  });
});

describe('rangDeLaVista', () => {
  test('setmana, dues setmanes, mes (les setmanes que toquen el mes) i any', () => {
    expect(rangDeLaVista(estat('vista=setmana&setmana=2026-W40'), AVUI)).toEqual({ desde: new Date(2026, 8, 28), fins: new Date(2026, 9, 5) });
    expect(rangDeLaVista(estat('vista=dues-setmanes&setmana=2026-W40'), AVUI)).toEqual({ desde: new Date(2026, 8, 28), fins: new Date(2026, 9, 12) });
    expect(rangDeLaVista(estat('vista=mes&mes=2026-10'), AVUI)).toEqual({ desde: new Date(2026, 8, 28), fins: new Date(2026, 10, 2) });
    // Febrer de 2027 comença en dilluns i té 28 dies: quatre files justes.
    expect(rangDeLaVista(estat('vista=mes&mes=2027-02'), AVUI)).toEqual({ desde: new Date(2027, 1, 1), fins: new Date(2027, 2, 1) });
    expect(rangDeLaVista(estat('vista=any&any=2026'), AVUI)).toEqual({ desde: new Date(2026, 0, 1), fins: new Date(2027, 0, 1) });
  });

  test('agenda: el mes en curs comença a la mitjanit de hui; un altre mes, el dia 1', () => {
    const migdia = new Date(2026, 9, 15, 13, 30);
    expect(rangDeLaVista(estat('vista=agenda&mes=2026-10'), migdia)).toEqual({ desde: new Date(2026, 9, 15), fins: new Date(2026, 10, 1) });
    expect(rangDeLaVista(estat('vista=agenda&mes=2026-11'), migdia)).toEqual({ desde: new Date(2026, 10, 1), fins: new Date(2026, 11, 1) });
  });

  /* Correcció de la revisió · Un dia triat del mes en curs anterior a hui (el
     que ve de Mes) quedava fora de l'Agenda i de l'agenda de Sollutia que es
     demana, mentre la llista de davall el prometia. */
  test('agenda: un dia triat del mes en curs anterior a hui hi entra; un de posterior no l’avança', () => {
    const migdia = new Date(2026, 9, 15, 13, 30);
    expect(rangDeLaVista(estat('vista=agenda&date=2026-10-03'), migdia)).toEqual({ desde: new Date(2026, 9, 3), fins: new Date(2026, 10, 1) });
    expect(rangDeLaVista(estat('vista=agenda&date=2026-10-20'), migdia).desde).toEqual(new Date(2026, 9, 15));
    // Un altre mes ja comença per l'1, que el conté.
    expect(rangDeLaVista(estat('vista=agenda&date=2026-11-20'), migdia).desde).toEqual(new Date(2026, 10, 1));
  });
});
