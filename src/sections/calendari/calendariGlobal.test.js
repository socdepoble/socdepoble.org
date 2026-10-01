/* Ordre del Mestre, 261001 · De totes les targetes del poble al calendari:
   cada una el dia de la seua data, amb la regla del filtre ?date= del Mur. */
import { describe, expect, test } from 'vitest';
import {
  TEXTOS_TARGETES, acteDeLAgendaAEsdeveniment, clauDeMes, cursorDeMes, diaDeLaClau, entradaDeLAgenda,
  entradaDeLaTargeta, entradaOcorreElDia, entradesDelCalendari, entradesDelDia, entradesDelMes, entradesDelRang, mesDObertura,
  mesDeLaUrl, rangDelMes, recompteTargetes, rutaDeLaTargeta, targetaAEsdeveniment, tipusDeLaTargeta
} from './calendariGlobal.js';
import { diaIso } from '../../components/universal/editorial.js';
import { ocorreElDia, ocurrenciesEnRang } from '../../utils/esdeveniment.js';

const publicacio = (camps) => ({ id: 'p1', type: 'feed', title: 'Crònica', ...camps });
const producte = (camps) => ({ id: 'm1', type: 'market', title: 'Oli de la Torre', ...camps });
const acte = (camps) => ({ id: 'a1', type: 'event', title: 'Aplec', ...camps });
const sistema = { id: 'projecte', type: 'sistema', isSystem: true, title: 'El projecte', created_at: '2026-08-20T00:00:00.000Z', mainHref: '/projecte' };

describe('el tipus i la ruta de cada targeta', () => {
  test('publicació, producte, acte i pàgina del sistema: els de l’objecte connectable i els de l’enllaç de la targeta', () => {
    expect([publicacio(), producte(), acte(), { ...producte(), type: 'product' }, sistema].map(tipusDeLaTargeta))
      .toEqual(['publicacio', 'producte', 'esdeveniment', 'producte', 'pagina']);
    expect([publicacio(), producte(), acte(), sistema].map(rutaDeLaTargeta))
      .toEqual(['/mur/p1', '/mercat/m1', '/events/a1', '/projecte']);
  });
});

describe('targetaAEsdeveniment', () => {
  test('una publicació amb hora és un esdeveniment amb hora, el dia local de la seua pastilla', () => {
    const creat = '2026-09-29T22:30:00.000Z';
    const esd = targetaAEsdeveniment(publicacio({ created_at: creat }));
    expect(esd).toMatchObject({
      id: 'p1', titol: 'Crònica', totElDia: false, uid: 'publicacio:p1@socdepoble.org',
      font: { tipus: 'publicacio', id: 'p1', ruta: '/mur/p1' }
    });
    const local = new Date(creat);
    expect(ocorreElDia(esd, local.getFullYear(), local.getMonth(), local.getDate())).toBe(true);
    expect(entradaDeLaTargeta(publicacio({ created_at: creat })).dia).toBe(diaIso(local));
  });

  test('una pàgina del sistema (un dia serialitzat) és de tot el dia, sense cap hora inventada', () => {
    expect(targetaAEsdeveniment(sistema)).toMatchObject({ inici: { data: '2026-08-20' }, totElDia: true, font: { tipus: 'pagina', ruta: '/projecte' } });
  });

  test('la data triada al calendari (publish_date) mana sobre la de creació, com a la pastilla', () => {
    const esd = targetaAEsdeveniment(producte({ created_at: '2026-09-01T10:00:00.000Z', publish_date: '2026-09-15' }));
    expect(esd.inici).toEqual({ data: '2026-09-15' });
  });

  test('sense cap data real, cap esdeveniment; sense títol, el de Google Calendar per a la píndola', () => {
    expect(targetaAEsdeveniment(publicacio())).toBeNull();
    expect(targetaAEsdeveniment(null)).toBeNull();
    expect(targetaAEsdeveniment(publicacio({ title: '', created_at: '2026-09-29T10:00:00.000Z' })).titol).toBe('(sense títol)');
  });
});

describe('entrades del calendari', () => {
  test('un acte porta el seu model; un acte sense dia real, la seua pastilla com qualsevol targeta', () => {
    const ambDia = entradaDeLaTargeta(acte({ date: '2026-10-17' }));
    expect(ambDia).toMatchObject({ clau: 'event-a1', dia: null, acte: { inici: { data: '2026-10-17' } } });
    expect(ambDia.esdeveniment).toBe(ambDia.acte);
    const senseDia = entradaDeLaTargeta(acte({ created_at: '2026-10-05T08:15:00+00:00' }));
    expect(senseDia.acte).toBeNull();
    expect(senseDia.esdeveniment.font).toMatchObject({ tipus: 'esdeveniment', ruta: '/events/a1' });
    expect(senseDia.dia).toBe(diaIso(new Date('2026-10-05T08:15:00+00:00')));
  });

  test('totes les llistes juntes, de la més nova a la més vella; les que no porten data, al final', () => {
    const entrades = entradesDelCalendari(
      [acte({ date: '2026-10-17' })],
      [publicacio({ created_at: '2026-09-29T10:00:00.000Z' }), publicacio({ id: 'p2', title: 'Sense data' })],
      null,
      [producte({ created_at: '2026-10-01T07:30:00.000Z' })],
      [sistema]
    );
    expect(entrades.map((e) => e.item.title)).toEqual(['Aplec', 'Oli de la Torre', 'Crònica', 'El projecte', 'Sense data']);
  });

  test('un dia: un acte els dies que ocorre (i el de la seua pastilla); la resta, el dia de la pastilla', () => {
    const festes = entradaDeLaTargeta(acte({ date: '2026-09-28', fi: { data: '2026-10-04' } }));
    expect(['2026-09-27', '2026-09-28', '2026-10-03', '2026-10-04'].map((clau) => entradaOcorreElDia(festes, clau)))
      .toEqual([false, true, true, false]);
    const oli = entradaDeLaTargeta(producte({ created_at: '2026-10-01T07:30:00.000Z' }));
    expect(entradaOcorreElDia(oli, diaIso(new Date('2026-10-01T07:30:00.000Z')))).toBe(true);
    expect(entradesDelDia([festes, oli], '2026-09-30')).toEqual([festes]);
  });

  /* Revisió del carril A (ordre del Mestre, 261001), P3 · Una targeta amb
     data però sense id no té esdeveniment (creaEsdeveniment torna null): no
     pot eixir a la llista d'un dia o d'un mes que la graella no pinta. */
  test('una targeta amb data però sense id: cap esdeveniment, cap dia, ni a la llista del dia ni a la del mes', () => {
    const senseId = entradaDeLaTargeta(publicacio({ id: undefined, created_at: '2026-09-29T10:00:00.000Z' }));
    expect(senseId.esdeveniment).toBeNull();
    expect(senseId.dia).toBeNull();
    expect(senseId.moment).not.toBeNull(); // l'ordre del Mur no canvia
    const ambId = entradaDeLaTargeta(publicacio({ created_at: '2026-09-29T10:00:00.000Z' }));
    const dia = diaIso(new Date('2026-09-29T10:00:00.000Z'));
    expect(entradesDelDia([senseId, ambId], dia)).toEqual([ambId]);
    expect(entradesDelMes([senseId, ambId], { any: 2026, mes: 8 })).toEqual([ambId]);
  });

  test('D5 · una clau que no existix no troba cap targeta', () => {
    const marc = entradaDeLaTargeta(acte({ date: '2026-03-02' }));
    expect(entradaOcorreElDia(marc, '2026-02-30')).toBe(false);
    expect(entradaOcorreElDia(entradaDeLaTargeta(publicacio({ publish_date: '2026-03-02' })), '2026-02-30')).toBe(false);
  });

  test('un mes: les targetes pel dia de la pastilla, i els actes cada mes que ocorren', () => {
    const festes = entradaDeLaTargeta(acte({ date: '2026-09-28', fi: { data: '2026-10-04' } }));
    const mercat = entradaDeLaTargeta(acte({ id: 'mercat', title: 'Mercat', date: '2026-09-05', recurrencia: ['RRULE:FREQ=WEEKLY'] }));
    const cronica = entradaDeLaTargeta(publicacio({ publish_date: '2026-09-15' }));
    const senseData = entradaDeLaTargeta(publicacio({ id: 'p2' }));
    const totes = [festes, mercat, cronica, senseData];
    expect(entradesDelMes(totes, { any: 2026, mes: 8 })).toEqual([festes, mercat, cronica]);
    expect(entradesDelMes(totes, { any: 2026, mes: 9 })).toEqual([festes, mercat]);
    expect(entradesDelMes(totes, { any: 2026, mes: 7 })).toEqual([]);
  });
});

describe('l’agenda de Sollutia (ActeDTO) passa pel mateix model', () => {
  test('un acte amb hora i lloc; la seua entrada s’ordena pel seu inici', () => {
    const dto = { id: 's1', titol: 'Concert a la plaça', inici: '2026-10-10T17:00:00.000Z', lloc: 'Plaça Major' };
    expect(acteDeLAgendaAEsdeveniment(dto)).toMatchObject({
      id: 's1', titol: 'Concert a la plaça', lloc: 'Plaça Major', totElDia: false,
      inici: { dataHora: '2026-10-10T17:00:00.000Z' }, font: { tipus: 'agenda', id: 's1', ruta: null }
    });
    const entrada = entradaDeLAgenda(dto);
    expect(entrada).toMatchObject({ clau: 'agenda-s1', item: null, agenda: dto, moment: Date.parse('2026-10-10T17:00:00.000Z') });
    const local = new Date('2026-10-10T17:00:00.000Z');
    expect(entradaOcorreElDia(entrada, diaIso(local))).toBe(true);
  });

  test('un dia sol és de tot el dia; amb fi, fins a la fi', () => {
    const esd = acteDeLAgendaAEsdeveniment({ id: 's2', titol: 'Fira', inici: '2026-10-10', fi: '2026-10-12' });
    expect(esd).toMatchObject({ inici: { data: '2026-10-10' }, fi: { data: '2026-10-12' }, totElDia: true });
  });

  test('fallada tancada: sense títol, sense inici o amb una fi que no és cap data, cap esdeveniment', () => {
    expect(acteDeLAgendaAEsdeveniment({ id: 's3', inici: '2026-10-10' })).toBeNull();
    expect(acteDeLAgendaAEsdeveniment({ id: 's3', titol: 'Sense inici' })).toBeNull();
    expect(acteDeLAgendaAEsdeveniment({ id: 's3', titol: 'Fi dolenta', inici: '2026-10-10', fi: 'demà' })).toBeNull();
    expect(acteDeLAgendaAEsdeveniment({ id: 's3', titol: 'Fi numèrica', inici: '2026-10-10', fi: 7 })).toBeNull();
    expect(entradaDeLAgenda(null)).toBeNull();
  });
});

describe('peces de la pàgina', () => {
  test('diaDeLaClau: el dia local d’una clau que existix, o null', () => {
    expect(diaDeLaClau('2026-10-01')).toEqual(new Date(2026, 9, 1));
    expect(diaDeLaClau('2026-02-30')).toBeNull();
    expect(diaDeLaClau('0026-10-01')).toBeNull();
    expect(diaDeLaClau('demà')).toBeNull();
    expect(diaDeLaClau(null)).toBeNull();
  });

  test('mesDObertura: el de hui si té targetes; si no, el de la més recent fins a hui; si totes són futures, el de la més pròxima', () => {
    const AVUI = new Date(2026, 9, 1, 12, 0);
    const setembre = entradaDeLaTargeta(publicacio({ created_at: '2026-09-29T10:00:00.000Z' }));
    const agost = entradaDeLaTargeta(publicacio({ id: 'p2', publish_date: '2026-08-10' }));
    const hui = entradaDeLaTargeta(producte({ publish_date: '2026-10-01' }));
    const desembre = entradaDeLaTargeta(acte({ date: '2026-12-05' }));
    const gener = entradaDeLaTargeta(acte({ id: 'a2', date: '2027-01-20' }));
    const senseData = entradaDeLaTargeta(publicacio({ id: 'p3' }));
    expect(mesDObertura([setembre, hui, desembre], AVUI)).toEqual({ any: 2026, mes: 9 });
    expect(mesDObertura([agost, desembre, setembre, senseData], AVUI)).toEqual({ any: 2026, mes: 8 });
    expect(mesDObertura([gener, desembre], AVUI)).toEqual({ any: 2026, mes: 11 });
    expect(mesDObertura([senseData], AVUI)).toEqual({ any: 2026, mes: 9 });
    expect(mesDObertura([], AVUI)).toEqual({ any: 2026, mes: 9 });
  });

  /* Carril A (ordre del Mestre, 261001) · El ?mes= de /calendari, on porta la
     pastilla de les targetes, amb la mateixa regla que el ?date=. */
  test('cursorDeMes: el mes d’una clau «AAAA-MM» vàlida (any ≥ 1000, mes 01–12), o null', () => {
    expect(cursorDeMes('2026-09')).toEqual({ any: 2026, mes: 8 });
    expect(cursorDeMes('2026-12')).toEqual({ any: 2026, mes: 11 });
    expect(cursorDeMes('1000-01')).toEqual({ any: 1000, mes: 0 });
    for (const brossa of ['2026-13', '2026-00', '2026-9', '0026-01', '0999-12', '2026-09-01', '09/2026', 'demà', '', null, undefined, 202609]) {
      expect(cursorDeMes(brossa), String(brossa)).toBeNull();
    }
  });

  test('clauDeMes: la clau «AAAA-MM» d’un mes, amb el zero; i torna el mateix mes', () => {
    expect(clauDeMes({ any: 2026, mes: 0 })).toBe('2026-01');
    expect(clauDeMes({ any: 2026, mes: 11 })).toBe('2026-12');
    for (const mes of ['2026-01', '2026-09', '2027-12']) expect(clauDeMes(cursorDeMes(mes))).toBe(mes);
  });

  test('mesDeLaUrl: primer el del ?date=, després el del ?mes= vàlid i, si no, el d’obertura', () => {
    const OBERTURA = { any: 2026, mes: 9 };
    expect(mesDeLaUrl({ date: '2026-08-14', mes: '2026-03' }, OBERTURA)).toEqual({ any: 2026, mes: 7 });
    expect(mesDeLaUrl({ date: null, mes: '2026-03' }, OBERTURA)).toEqual({ any: 2026, mes: 2 });
    expect(mesDeLaUrl({ date: 'demà', mes: '2026-03' }, OBERTURA)).toEqual({ any: 2026, mes: 2 });
    for (const mes of ['2026-13', '0026-01', '2026-3', 'demà', null]) {
      expect(mesDeLaUrl({ date: null, mes }, OBERTURA), String(mes)).toBe(OBERTURA);
    }
    expect(mesDeLaUrl(undefined, OBERTURA)).toBe(OBERTURA);
  });

  test('rangDelMes: [primer dia del mes, primer dia del següent)', () => {
    expect(rangDelMes({ any: 2026, mes: 11 })).toEqual({ desde: new Date(2026, 11, 1), fins: new Date(2027, 0, 1) });
  });

  test('el recompte diu targetes, no actes', () => {
    expect([0, 1, 2].map(recompteTargetes)).toEqual(['0 targetes', '1 targeta', '2 targetes']);
    expect(TEXTOS_TARGETES.recompte).toBe(recompteTargetes);
    expect(TEXTOS_TARGETES.mesBuit('d’octubre de 2026')).toBe('Cap targeta al calendari d’octubre de 2026.');
  });
});

/* T10 (ordre del Mestre, 261001) · La llista de davall de la vista Setmana:
   les entrades d'un rang de claus, amb la regla d'entradesDelMes. */
describe('entradesDelRang', () => {
  const festes = entradaDeLaTargeta(acte({ date: '2026-09-28', fi: { data: '2026-10-04' } }));
  const mercat = entradaDeLaTargeta(acte({ id: 'mercat', title: 'Mercat', date: '2026-09-05', recurrencia: ['RRULE:FREQ=WEEKLY'] }));
  const cronica = entradaDeLaTargeta(publicacio({ publish_date: '2026-09-15' }));
  const del29 = entradaDeLaTargeta(publicacio({ id: 'p3', created_at: '2026-09-29T10:00:00.000Z' }));
  const senseData = entradaDeLaTargeta(publicacio({ id: 'p2' }));
  const totes = [festes, mercat, cronica, del29, senseData];

  test('per al rang del mes, el mateix que entradesDelMes', () => {
    expect(entradesDelRang(totes, { desde: '2026-09-01', fins: '2026-10-01' })).toEqual(entradesDelMes(totes, { any: 2026, mes: 8 }));
    expect(entradesDelRang(totes, { desde: '2026-10-01', fins: '2026-11-01' })).toEqual(entradesDelMes(totes, { any: 2026, mes: 9 }));
    expect(entradesDelRang(totes, { desde: '2026-08-01', fins: '2026-09-01' })).toEqual(entradesDelMes(totes, { any: 2026, mes: 7 }));
  });

  test('la setmana del 28-09 al 04-10: Festes, el mercat (el dissabte) i la publicació del 29-09, en l’ordre d’arribada', () => {
    expect(entradesDelRang(totes, { desde: '2026-09-28', fins: '2026-10-05' })).toEqual([festes, mercat, del29]);
    // fins és exclusiu: el 28-09 sol ja no veu la publicació del 29.
    expect(entradesDelRang(totes, { desde: '2026-09-28', fins: '2026-09-29' })).toEqual([festes]);
  });

  test('un rang amb una clau que no existix no en troba cap', () => {
    expect(entradesDelRang(totes, { desde: '2026-02-30', fins: '2026-03-07' })).toEqual([]);
    expect(entradesDelRang(totes, { desde: '2026-09-28', fins: 'demà' })).toEqual([]);
    expect(entradesDelRang(totes)).toEqual([]);
  });

  /* La graella de les vistes noves es basa en ocurrenciesEnRang (la regla
     RFC: l'inici només compta si la regla el genera); la llista, en
     entradaOcorreElDia, que sempre hi afig el dia de la pastilla. Un mercat dels
     dissabtes que comença un dijous: el dijous ix a la llista, no a la graella. */
  test('el mercat dels dissabtes que comença un dijous: a la llista el dijous, a la graella no', () => {
    const dijous = entradaDeLaTargeta(acte({ id: 'dijous', title: 'Mercat', date: '2026-09-03', recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] }));
    expect(entradaOcorreElDia(dijous, '2026-09-03')).toBe(true);
    expect(ocurrenciesEnRang(dijous.esdeveniment, new Date(2026, 8, 3), new Date(2026, 8, 4)).ocurrencies).toEqual([]);
    expect(entradesDelRang([dijous], { desde: '2026-08-31', fins: '2026-09-07' })).toEqual([dijous]);
  });
});
