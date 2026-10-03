// @vitest-environment node
/* Salut · alertes suaus: cada regla amb un cas que la dispara i un que no;
   el límit de líquids del metge apaga les d'ingesta; descartar amaga; i el
   peu «Que no hi haja cap avís…» sempre hi és. Cap text porta noms de
   malalties ni recomana tractaments. */
import { describe, expect, test } from 'vitest';
import { PEU_ALERTES, REGLES, avaluaAlertes, clauDescart } from './alertes.js';
import { assignaJornades, sumaDies } from './hores.js';

let n = 0;
const uuid = () => { n += 1; return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`; };
const a = (tipus, moment, camps = {}) => ({ id: uuid(), tipus, moment, ofsetMin: 120, ...camps });
const PERSONA = { horaAlcarHabitual: '07:00', horaGitarHabitual: '22:00', majorDe65: true };
const D = '2026-10-05';

function avalua(llista, { persona = PERSONA, completes = [], des = D, fins = D, ...resta } = {}) {
  const jornades = new Map(completes.map((data) => [data, { data, completa: true }]));
  return avaluaAlertes({ apunts: assignaJornades(llista, persona), jornades, persona, des, fins, ofsetDe: () => 120, ...resta });
}
const ids = (resultat) => resultat.alertes.map((alerta) => alerta.id);
const orina = (moment, volumMl, camps = {}) => a('miccio', moment, { volumMl, mesura: 'mesurat', lloc: 'vater', ...camps });
const beu = (moment, volumMl) => a('ingesta', moment, { volumMl, beguda: 'aigua' });

/* Una jornada completa i mesurada: 4 de dia, `nit` de nit, i la primera de l'endemà. */
function jornada(data, { nit = 0, begut = 1800, volumNit = 150 } = {}) {
  const endema = sumaDies(data, 1);
  return [
    a('son', `${data}T07:00`, { event: 'alcar-se' }),
    orina(`${data}T07:30`, 250), orina(`${data}T11:00`, 250), orina(`${data}T15:00`, 250), orina(`${data}T21:30`, 250),
    beu(`${data}T09:00`, begut),
    a('son', `${data}T22:30`, { event: 'adormir-se' }),
    ...Array.from({ length: nit }, (_, i) => orina(`${endema}T0${2 + i}:00`, volumNit)),
    a('son', `${endema}T07:00`, { event: 'alcar-se' }),
    orina(`${endema}T07:15`, 300)
  ];
}

describe('cada regla', () => {
  test('risc (urgent): un episodi amb perill o una caiguda', () => {
    expect(ids(avalua([a('conducta', `${D}T18:00`, { conductes: ['empentar'], intensitat: 3, resultat: 'no-es-calma', risc: ['caiguda'] })]))).toContain('risc');
    expect(ids(avalua([a('observacio', `${D}T18:00`, { que: 'caiguda' })]))).toContain('risc');
    expect(ids(avalua([a('conducta', `${D}T18:00`, { conductes: ['cridar'], intensitat: 1, resultat: 'es-calma-prompte' })]))).not.toContain('risc');
  });

  test('canvi-brusc: el doble d’episodis que la mitjana dels 7 dies d’abans (amb 3 dies de base), o una observació', () => {
    const base = ['2026-10-01', '2026-10-02', '2026-10-03'].flatMap((d) => [a('conducta', `${d}T18:00`, { conductes: ['cridar'], intensitat: 1, resultat: 'es-calma-prompte' })]);
    const avui = (quants) => Array.from({ length: quants }, (_, i) => a('conducta', `${D}T1${i}:00`, { conductes: ['cridar'], intensitat: 2, resultat: 'no-es-calma' }));
    expect(ids(avalua([...base, ...avui(2)]))).toContain('canvi-brusc');
    expect(ids(avalua([...base, ...avui(1)]))).not.toContain('canvi-brusc');
    /* Sense 3 dies de base no es compara. */
    expect(ids(avalua([...base.slice(0, 2), ...avui(3)]))).not.toContain('canvi-brusc');
    expect(ids(avalua([a('observacio', `${D}T09:00`, { que: 'canvi-brusc' })]))).toContain('canvi-brusc');
  });

  test('febre: una presa alta, dos més baixes en 24 h, o un grau sobre l’habitual', () => {
    const t = (moment, temperaturaDecimes) => a('observacio', moment, { que: 'temperatura', temperaturaDecimes });
    expect(ids(avalua([t(`${D}T09:00`, 378)]))).toContain('febre');
    expect(ids(avalua([t(`${D}T09:00`, 372), t(`${D}T20:00`, 373)]))).toContain('febre');
    expect(ids(avalua([t(`${D}T09:00`, 372)]))).not.toContain('febre');
    expect(ids(avalua([t(`${D}T09:00`, 371)], { persona: { ...PERSONA, tempHabitualDecimes: 360 } }))).toContain('febre');
    expect(ids(avalua([t(`${D}T09:00`, 369)], { persona: { ...PERSONA, tempHabitualDecimes: 360 } }))).not.toContain('febre');
  });

  test('orina-diferent: sang, cremor o dolor; tèrbola només amb temperatura alta', () => {
    expect(ids(avalua([orina(`${D}T09:00`, 200, { aspecte: ['sang-visible'] })]))).toContain('orina-diferent');
    expect(ids(avalua([orina(`${D}T09:00`, 200, { molesties: ['cremor'] })]))).toContain('orina-diferent');
    expect(ids(avalua([orina(`${D}T09:00`, 200, { aspecte: ['terbola'] })]))).not.toContain('orina-diferent');
    expect(ids(avalua([orina(`${D}T09:00`, 200, { aspecte: ['terbola'] }), a('observacio', `${D}T10:00`, { que: 'temperatura', temperaturaDecimes: 380 })])))
      .toContain('orina-diferent');
  });

  test('beu-poc i davall-referencia, i el límit de líquids les apaga', () => {
    const dos = [...jornada(D, { begut: 800 }), ...jornada('2026-10-06', { begut: 900 })];
    const opcions = { completes: [D, '2026-10-06'], fins: '2026-10-06' };
    expect(ids(avalua(dos, opcions))).toEqual(expect.arrayContaining(['beu-poc', 'davall-referencia']));
    const limit = { ...PERSONA, limitLiquidsMl: 1000 };
    const ambLimit = ids(avalua(dos, { ...opcions, persona: limit }));
    expect(ambLimit).not.toContain('beu-poc');
    expect(ambLimit).not.toContain('davall-referencia');
    const un = [...jornada(D, { begut: 800 }), ...jornada('2026-10-06', { begut: 1700 })];
    expect(ids(avalua(un, opcions))).not.toContain('beu-poc');
    expect(ids(avalua([...jornada(D, { begut: 1700 })], { completes: [D] }))).not.toContain('davall-referencia');
    /* Una jornada no completa no compta. */
    expect(ids(avalua(dos, { ...opcions, completes: [D] }))).not.toContain('beu-poc');
  });

  test('nicturia: 2 o més de nit en 2 jornades completes', () => {
    const opcions = { completes: [D, '2026-10-06'], fins: '2026-10-06' };
    expect(ids(avalua([...jornada(D, { nit: 2 }), ...jornada('2026-10-06', { nit: 3 })], opcions))).toContain('nicturia');
    expect(ids(avalua([...jornada(D, { nit: 2 }), ...jornada('2026-10-06', { nit: 1 })], opcions))).not.toContain('nicturia');
  });

  test('orina-nit: NPi per damunt de la referència (33 % o 20 %)', () => {
    /* Dia sense la primera: 750 ml; nit 2 × 300 + 300 de l'endemà = 900; 24 h = 1650; NPi 54,5 %. */
    expect(ids(avalua(jornada(D, { nit: 2, volumNit: 300 }), { completes: [D] }))).toContain('orina-nit');
    /* Nit 0 + 300: 24 h = 1050; NPi 28,6 %: per davall de 33, però per damunt de 20. */
    expect(ids(avalua(jornada(D), { completes: [D] }))).not.toContain('orina-nit');
    expect(ids(avalua(jornada(D), { completes: [D], persona: { ...PERSONA, majorDe65: false } }))).toContain('orina-nit');
  });

  test('molta-orina: més de 40 ml per kg (només amb pes)', () => {
    const persona = { ...PERSONA, pesKg: 25 };
    expect(ids(avalua(jornada(D, { nit: 2, volumNit: 300 }), { completes: [D], persona }))).toContain('molta-orina');
    expect(ids(avalua(jornada(D, { nit: 2, volumNit: 300 }), { completes: [D] }))).not.toContain('molta-orina');
  });

  test('ventre: 3 dies sense deposició (si se n’apunten) o dures; s’apaga amb les deposicions', () => {
    const deposicio = (moment, bristol) => a('deposicio', moment, { bristol, quantitat: 'normal' });
    expect(ids(avalua([deposicio('2026-10-02T09:00', 4)]))).toContain('ventre');
    expect(ids(avalua([deposicio('2026-10-04T09:00', 4)]))).not.toContain('ventre');
    expect(ids(avalua([]))).not.toContain('ventre');
    expect(ids(avalua([deposicio('2026-10-03T09:00', 1), deposicio('2026-10-04T09:00', 4), deposicio(`${D}T09:00`, 2)]))).toContain('ventre');
    expect(ids(avalua([deposicio('2026-10-02T09:00', 4)], { tipusApagats: ['deposicio'] }))).not.toContain('ventre');
  });

  test('medicacio-rebutjada: 2 preses no fetes en 3 dies', () => {
    const presa = (moment, estat) => a('medicacio', moment, { nom: 'la pastilla del matí', pauta: 'fixa', estat });
    expect(ids(avalua([presa('2026-10-03T09:00', 'rebutjada'), presa(`${D}T09:00`, 'oblidada')]))).toContain('medicacio-rebutjada');
    expect(ids(avalua([presa('2026-10-01T09:00', 'rebutjada'), presa(`${D}T09:00`, 'oblidada')]))).not.toContain('medicacio-rebutjada');
    expect(ids(avalua([presa(`${D}T09:00`, 'presa'), presa(`${D}T21:00`, 'oblidada')]))).not.toContain('medicacio-rebutjada');
  });

  test('pell: un canvi amb la pell ferida', () => {
    expect(ids(avalua([a('absorbent', `${D}T09:00`, { estat: 'mullat', pell: 'ferida' })]))).toContain('pell');
    expect(ids(avalua([a('absorbent', `${D}T09:00`, { estat: 'mullat', pell: 'envermellida' })]))).not.toContain('pell');
  });

  test('escapaments-augmenten: per dia, la meitat més que el període anterior', () => {
    const escapament = (moment) => a('escapament', moment, { quantitat: 'humit', circumstancia: 'no-se-sap' });
    const periodes = [{ id: uuid(), inici: '2026-09-28', dies: 3, estat: 'acabat' }, { id: uuid(), inici: D, dies: 3, estat: 'en-curs' }];
    const abans = [escapament('2026-09-28T09:00'), escapament('2026-09-29T09:00'), escapament('2026-09-30T09:00')];
    const ara = [escapament(`${D}T09:00`), escapament(`${D}T13:00`), escapament('2026-10-06T09:00'), escapament('2026-10-06T13:00')];
    const opcions = { periodes, des: D, fins: '2026-10-07' };
    expect(ids(avalua([...abans, ...ara], opcions))).toContain('escapaments-augmenten');
    /* Un escapament en dos dies apuntats: 0,5 per dia, menys que abans. */
    expect(ids(avalua([...abans, ara[0], orina('2026-10-06T09:00', 200)], opcions))).not.toContain('escapaments-augmenten');
  });
});

describe('el conjunt', () => {
  test('les urgents primer, el peu sempre, i descartar n’amaga una per a eixe període', () => {
    const llista = [a('observacio', `${D}T18:00`, { que: 'caiguda' }), a('absorbent', `${D}T09:00`, { estat: 'mullat', pell: 'ferida' })];
    const resultat = avalua(llista);
    expect(ids(resultat)).toEqual(['risc', 'pell']);
    expect(resultat.peu).toBe(PEU_ALERTES);
    expect(avalua([]).peu).toBe('Que no hi haja cap avís no vol dir que tot vaja bé.');
    expect(avalua([]).alertes).toEqual([]);
    const descartat = avalua(llista, { descartades: [clauDescart('pell', D, D)] });
    expect(ids(descartat)).toEqual(['risc']);
    expect(descartat.descartades).toBe(1);
    /* Un altre període no hereta el descart. */
    expect(ids(avalua(llista, { des: '2026-10-04', descartades: [clauDescart('pell', D, D)] }))).toContain('pell');
  });

  test('cada regla és congelada, té nivell conegut, criteri i textos sense noms de malalties', () => {
    const vetat = new RegExp(['diagn', 'òstic|infec', 'ció|demè', 'ncia|poliú', 'ria|tractament recomanat|dosi recomanada'].join(''), 'i');
    for (const regla of REGLES) {
      expect(Object.isFrozen(regla)).toBe(true);
      expect(['informa', 'parla-ho', 'urgent']).toContain(regla.nivell);
      expect(regla.criteri.length).toBeGreaterThan(10);
      for (const text of [regla.text, regla.perQue, regla.criteri]) expect(vetat.test(text), `${regla.id}: ${text}`).toBe(false);
    }
    expect(new Set(REGLES.map((r) => r.id)).size).toBe(REGLES.length);
  });
});
