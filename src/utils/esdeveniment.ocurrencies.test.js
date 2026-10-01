/* T10 (ordre del Mestre, 261001) · ocurrenciesEnRang: a quina hora comença i
   acaba cada ocurrència d'un esdeveniment dins d'un rang. La prova clau és la
   de COHERÈNCIA: per a cada dia de la graella d'octubre i de març de 2026 (els
   dos mesos del canvi d'hora), ocorreElDia diu el mateix que les ocurrències.
   Les proves corren en Europe/Madrid (vite.config.js); amb un altre TZ
   explícit, les d'hores reals es salten (la guarda MADRID). */
import { describe, expect, test } from 'vitest';
import { creaEsdeveniment, ocorreElDia, ocurrenciesEnRang } from './esdeveniment.js';
import { clauDeData, rangDeLaGraella, sumaDies } from './periodes.js';

const MADRID = process.env.TZ === 'Europe/Madrid';
const rfc = (d) => d.toISOString().replace(/\.\d{3}/, '').replace(/[-:]/g, '');
const esd = (id, camps) => creaEsdeveniment({ id, titol: id, ...camps });
const cobrix = (oc, clau) => oc.diaInici <= clau && clau < oc.diaFi;
const enRang = (e, desde, fins, opcions) => ocurrenciesEnRang(e, desde, fins, opcions).ocurrencies;

/* La bateria: cada forma d'esdeveniment que el calendari pinta o no pinta. */
const BATERIA = [
  esd('dia', { inici: { data: '2026-10-12' } }),
  esd('multidia', { inici: { data: '2026-09-28' }, fi: { data: '2026-10-04' } }),
  esd('sense-fi', { inici: { dataHora: '2026-10-07T10:00' } }),
  esd('nit', { inici: { dataHora: '2026-10-10T22:00' }, fi: { dataHora: '2026-10-11T02:00' } }),
  esd('fins-mitjanit', { inici: { dataHora: '2026-10-14T10:00' }, fi: { dataHora: '2026-10-15T00:00' } }),
  esd('mercat', { inici: { dataHora: '2026-09-03T09:00' }, fi: { dataHora: '2026-09-03T13:00' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] }),
  esd('darrer-divendres', { inici: { data: '2026-01-30' }, recurrencia: ['RRULE:FREQ=MONTHLY;BYDAY=-1FR'] }),
  esd('tres-dies', { inici: { dataHora: '2026-10-20T18:00' }, fi: { dataHora: '2026-10-20T19:30' }, recurrencia: ['RRULE:FREQ=DAILY;COUNT=3'] }),
  esd('exdate', { inici: { data: '2026-09-01' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=TU', 'EXDATE;VALUE=DATE:20261013'] }),
  esd('fins-canvi-hora', { inici: { dataHora: '2026-10-20T10:00' }, recurrencia: [`RRULE:FREQ=DAILY;UNTIL=${rfc(new Date(2026, 9, 25, 10, 0))}`] }),
  esd('fins-canvi-hora-marc', { inici: { dataHora: '2026-03-20T10:00' }, recurrencia: [`RRULE:FREQ=DAILY;UNTIL=${rfc(new Date(2026, 2, 29, 10, 0))}`] }),
  esd('cancellat', { inici: { data: '2026-10-05' }, estat: 'cancellat' }),
  esd('no-suportada', { inici: { data: '2026-10-05' }, recurrencia: ['RRULE:FREQ=YEARLY'] }),
  esd('xarxa', { inici: { dataHora: '2026-09-20T21:00' }, fi: { dataHora: '2026-09-20T23:00' }, recurrencia: ['RRULE:FREQ=HOURLY;INTERVAL=7'] }),
  esd('xarxa-count', { inici: { dataHora: '2026-10-24T20:00' }, recurrencia: ['RRULE:FREQ=HOURLY;INTERVAL=3;COUNT=6'] }),
  esd('cap-de-setmana', { inici: { dataHora: '2026-09-05T23:00' }, fi: { dataHora: '2026-09-07T01:00' }, recurrencia: ['RRULE:FREQ=WEEKLY'] }),
  esd('dues-hores', { inici: { dataHora: '2026-09-01T10:00' }, fi: { dataHora: '2026-09-01T12:00' }, recurrencia: ['RRULE:FREQ=DAILY;INTERVAL=3;BYHOUR=8,23;BYMINUTE=30'] }),
  esd('fira', { inici: { data: '2026-09-05' }, fi: { data: '2026-09-07' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] }),
  esd('desfasament', { inici: { dataHora: '2026-10-24T23:30:00Z' }, fi: { dataHora: '2026-10-25T01:30:00Z' } }),
  esd('marc', { inici: { dataHora: '2026-03-28T23:00' }, fi: { dataHora: '2026-03-29T03:30' } })
];

describe('coherència amb ocorreElDia (la prova clau)', () => {
  test.each([['octubre', { any: 2026, mes: 9 }], ['març', { any: 2026, mes: 2 }], ['setembre', { any: 2026, mes: 8 }]])(
    'cada dia de la graella de %s: ocorreElDia === alguna ocurrència cobrix el dia', (_, cursor) => {
      const { desde, fins } = rangDeLaGraella(cursor);
      for (const e of BATERIA) {
        expect(e, 'la bateria es crea sencera').not.toBeNull();
        const { ocurrencies } = ocurrenciesEnRang(e, desde, fins);
        for (let dia = desde; dia < fins; dia = sumaDies(dia, 1)) {
          const clau = clauDeData(dia);
          const esperat = ocorreElDia(e, dia.getFullYear(), dia.getMonth(), dia.getDate());
          expect(ocurrencies.some((oc) => cobrix(oc, clau)), `${e.id} · ${clau}`).toBe(esperat);
        }
        // En ordre cronològic, i cap ocurrència fora del rang.
        expect(ocurrencies.map((oc) => oc.inici), e.id).toEqual([...ocurrencies.map((oc) => oc.inici)].sort((a, b) => a - b));
        for (const oc of ocurrencies) expect(oc.diaInici < clauDeData(fins) && oc.diaFi > clauDeData(desde), `${e.id} · ${oc.clau}`).toBe(true);
      }
    });

  test('un rang que comença a mitjan dia compta el dia sencer, com ocorreElDia', () => {
    const nit = BATERIA.find((e) => e.id === 'nit');
    expect(enRang(nit, new Date(2026, 9, 11, 12), new Date(2026, 9, 11, 13))).toHaveLength(1);
    expect(enRang(nit, new Date(2026, 9, 12), new Date(2026, 9, 13))).toEqual([]);
  });
});

describe('la forma de cada ocurrència', () => {
  const OCTUBRE = rangDeLaGraella({ any: 2026, mes: 9 });

  test('tot el dia: les mitjanits locals i els dies, fi exclusiva; la clau és uid@inici', () => {
    const [festes] = enRang(BATERIA[1], OCTUBRE.desde, OCTUBRE.fins);
    expect(festes).toMatchObject({
      totElDia: true, inici: new Date(2026, 8, 28).getTime(), fi: new Date(2026, 9, 4).getTime(),
      diaInici: '2026-09-28', diaFi: '2026-10-04', clau: `multidia@socdepoble.org@${new Date(2026, 8, 28).getTime()}`
    });
    expect(festes.esd).toBe(BATERIA[1]);
    expect(Object.isFrozen(festes)).toBe(true);
  });

  test('durada zero: fi === inici i diaFi és l’endemà', () => {
    const [oc] = enRang(esd('zero', { inici: { dataHora: '2026-10-07T10:00' } }), OCTUBRE.desde, OCTUBRE.fins);
    expect(oc).toMatchObject({ totElDia: false, inici: new Date(2026, 9, 7, 10).getTime(), diaInici: '2026-10-07', diaFi: '2026-10-08' });
    expect(oc.fi).toBe(oc.inici);
  });

  test('de 22:00 a 02:00: una sola ocurrència de dos dies; fins a les 00:00 exactes, un sol dia', () => {
    const nit = enRang(BATERIA[3], OCTUBRE.desde, OCTUBRE.fins);
    expect(nit).toHaveLength(1);
    expect(nit[0]).toMatchObject({ diaInici: '2026-10-10', diaFi: '2026-10-12', fi: new Date(2026, 9, 11, 2).getTime() });
    const [mitjanit] = enRang(BATERIA[4], OCTUBRE.desde, OCTUBRE.fins);
    expect(mitjanit).toMatchObject({ diaInici: '2026-10-14', diaFi: '2026-10-15' });
    expect(cobrix(mitjanit, '2026-10-15')).toBe(false);
  });

  test('un setmanal a les 10:00 comença a les 10:00 de paret també els diumenges del canvi d’hora', () => {
    const setmanal = esd('missa', { inici: { dataHora: '2026-03-01T10:00' }, fi: { dataHora: '2026-03-01T11:00' }, recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SU'] });
    const delDia = (any, mes, dia) => enRang(setmanal, new Date(any, mes, dia), new Date(any, mes, dia + 1));
    const [octubre] = delDia(2026, 9, 25);
    expect(octubre.inici).toBe(new Date(2026, 9, 25, 10).getTime());
    expect(octubre.fi - octubre.inici).toBe(3600000);
    expect(delDia(2026, 2, 29)[0].inici).toBe(new Date(2026, 2, 29, 10).getTime());
    if (!MADRID) return;
    expect(octubre.inici).toBe(Date.UTC(2026, 9, 25, 9));
    expect(delDia(2026, 2, 29)[0].inici).toBe(Date.UTC(2026, 2, 29, 8));
  });

  test('diverses hores al dia (BYHOUR × BYMINUTE): una ocurrència per hora; el primer dia, només les que no precedixen l’inici', () => {
    const duesHores = BATERIA.find((e) => e.id === 'dues-hores');
    const primer = enRang(duesHores, new Date(2026, 8, 1), new Date(2026, 8, 2));
    expect(primer.map((oc) => new Date(oc.inici).getHours())).toEqual([23]);
    const quart = enRang(duesHores, new Date(2026, 8, 4), new Date(2026, 8, 5));
    // La de les 23:30 passa de mitjanit: cobrix també l'endemà.
    expect(quart.map((oc) => [oc.diaInici, new Date(oc.inici).getHours(), oc.diaFi])).toEqual([
      ['2026-09-04', 8, '2026-09-05'], ['2026-09-04', 23, '2026-09-06']
    ]);
  });

  test('una xarxa MINUTELY d’una setmana es retalla en maxOcurrencies i ho diu', () => {
    const xarxa = esd('minut', { inici: { dataHora: '2026-10-19T00:00' }, recurrencia: ['RRULE:FREQ=MINUTELY'] });
    const { ocurrencies, retallat } = ocurrenciesEnRang(xarxa, new Date(2026, 9, 19), new Date(2026, 9, 26));
    expect(retallat).toBe(true);
    expect(ocurrencies).toHaveLength(500);
    expect(ocurrenciesEnRang(xarxa, new Date(2026, 9, 19), new Date(2026, 9, 26), { maxOcurrencies: 10 }).ocurrencies).toHaveLength(10);
    const curta = ocurrenciesEnRang(esd('hora', { inici: { dataHora: '2026-10-19T00:00' }, recurrencia: ['RRULE:FREQ=HOURLY;COUNT=5'] }), new Date(2026, 9, 19), new Date(2026, 9, 26));
    expect(curta).toMatchObject({ retallat: false });
    expect(curta.ocurrencies).toHaveLength(5);
  });

  test('cancel·lat, regla que no es pinta, rang buit o invàlid: cap ocurrència', () => {
    expect(ocurrenciesEnRang(BATERIA.find((e) => e.id === 'cancellat'), OCTUBRE.desde, OCTUBRE.fins)).toEqual({ ocurrencies: [], retallat: false });
    expect(enRang(BATERIA.find((e) => e.id === 'no-suportada'), OCTUBRE.desde, OCTUBRE.fins)).toEqual([]);
    expect(enRang(BATERIA[0], OCTUBRE.fins, OCTUBRE.desde)).toEqual([]);
    expect(enRang(BATERIA[0], 'demà', OCTUBRE.fins)).toEqual([]);
    expect(enRang(null, OCTUBRE.desde, OCTUBRE.fins)).toEqual([]);
  });

  test('un mercat dels dissabtes que comença un dijous no té cap ocurrència el dijous (la regla RFC)', () => {
    const mercat = BATERIA.find((e) => e.id === 'mercat');
    expect(enRang(mercat, new Date(2026, 8, 3), new Date(2026, 8, 4))).toEqual([]);
    expect(enRang(mercat, new Date(2026, 8, 5), new Date(2026, 8, 6))[0].inici).toBe(new Date(2026, 8, 5, 9).getTime());
  });

  /* Un esdeveniment repetit de més d'un dia: els dies coberts es compten amb
     l'aritmètica de 24 h d'ocorreElDia (extraDies), per coherència, i la
     discrepància amb els instants reals va en les dos direccions. A la tardor,
     el cap de setmana de dissabte a les 23:00 i 26 hores de durada acaba
     dilluns a les 00:00 (el diumenge en té 25), però ocorreElDia, i per tant
     les ocurrències, també compten el dilluns. A la primavera, de dissabte a
     la 01:00 a dilluns a la 01:00 (47 hores: el diumenge en té 23), el dilluns
     es perd, i el mateix acte sense repetir sí que el compta. És una
     aproximació heretada: les proves la deixen vista, no l'amaguen. */
  test('hereta l’aritmètica de 24 h d’ocorreElDia en un repetit de més d’un dia que travessa el canvi d’hora', () => {
    if (!MADRID) return;
    const capDeSetmana = BATERIA.find((e) => e.id === 'cap-de-setmana');
    const [oc] = enRang(capDeSetmana, new Date(2026, 9, 24), new Date(2026, 9, 25));
    expect(oc.fi).toBe(new Date(2026, 9, 26).getTime());
    expect(oc.diaFi).toBe('2026-10-27');
    expect(ocorreElDia(capDeSetmana, 2026, 9, 26)).toBe(true);
  });

  test('al canvi d’hora de març, la mateixa aritmètica perd l’últim dia d’un repetit que l’acte sense repetir sí que compta', () => {
    if (!MADRID) return;
    const camps = { inici: { dataHora: '2026-03-28T01:00' }, fi: { dataHora: '2026-03-30T01:00' } };
    const repetit = esd('marc-repetit', { ...camps, recurrencia: ['RRULE:FREQ=WEEKLY'] });
    const unic = esd('marc-unic', camps);
    const [r] = enRang(repetit, new Date(2026, 2, 28), new Date(2026, 2, 29));
    const [u] = enRang(unic, new Date(2026, 2, 28), new Date(2026, 2, 29));
    // La mateixa fi real (dilluns a la 01:00), però el repetit acaba de comptar el diumenge.
    expect(r.fi).toBe(new Date(2026, 2, 30, 1).getTime());
    expect(r.fi).toBe(u.fi);
    expect([r.diaInici, r.diaFi]).toEqual(['2026-03-28', '2026-03-30']);
    expect([u.diaInici, u.diaFi]).toEqual(['2026-03-28', '2026-03-31']);
    expect(ocorreElDia(repetit, 2026, 2, 30)).toBe(false);
    expect(ocorreElDia(unic, 2026, 2, 30)).toBe(true);
    // La coherència es manté: el dilluns no el compten ni ocorreElDia ni les ocurrències.
    expect(enRang(repetit, new Date(2026, 2, 30), new Date(2026, 2, 31))).toEqual([]);
  });
});
