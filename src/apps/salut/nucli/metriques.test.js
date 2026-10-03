// @vitest-environment node
/* Salut · mesures d'una jornada: un diari sintètic amb el resultat calculat a
   mà (vegades de dia i de nit, orina de nit amb la primera del matí, NPi, Ni,
   mitjana i màxim), i els casos sense índexs: cobertura parcial, jornada no
   completa, sense la primera de l'endemà i sense pes. */
import { describe, expect, test } from 'vitest';
import { assignaJornades } from './hores.js';
import { diesSenseDeposicio, metriquesJornada, metriquesPeriode, textCobertura } from './metriques.js';

let n = 0;
const uuid = () => { n += 1; return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`; };
const a = (tipus, moment, camps = {}) => ({ id: uuid(), tipus, moment, ofsetMin: 120, ...camps });
const orina = (moment, volumMl) => a('miccio', moment, { volumMl, mesura: 'mesurat', lloc: 'vater' });
const PERSONA = { horaAlcarHabitual: '07:00', horaGitarHabitual: '22:00', pesKg: 70 };
const D = '2026-10-05';

/* La jornada del 5 d'octubre, completa i amb tot mesurat. */
function diari(canvis = {}) {
  const llista = [
    a('son', `${D}T07:00`, { event: 'alcar-se' }),
    orina(`${D}T07:10`, 300),
    a('ingesta', `${D}T08:00`, { volumMl: 200, beguda: 'aigua' }),
    orina(`${D}T10:00`, 200),
    a('ingesta', `${D}T12:00`, { volumMl: 250, beguda: 'aigua' }),
    orina(`${D}T13:00`, 250),
    orina(`${D}T17:00`, 150),
    a('ingesta', `${D}T19:30`, { volumMl: 150, beguda: 'cafe' }),
    a('ingesta', `${D}T20:00`, { volumMl: 200, beguda: 'aigua', rebutjada: true }),
    a('ingesta', `${D}T21:00`, { volumMl: 100, beguda: 'aigua' }),
    a('son', `${D}T22:00`, { event: 'gitar-se' }),
    orina(`${D}T22:15`, 100),
    a('son', `${D}T22:30`, { event: 'adormir-se' }),
    orina('2026-10-06T02:00', 200),
    a('son', '2026-10-06T03:00', { event: 'despertar', motiu: 'orinar' }),
    orina('2026-10-06T04:30', 150),
    a('son', '2026-10-06T07:00', { event: 'alcar-se' }),
    orina('2026-10-06T07:15', 350),
    a('escapament', `${D}T15:00`, { quantitat: 'gotes', circumstancia: 'en-esforc' }),
    a('deposicio', `${D}T09:00`, { bristol: 4, quantitat: 'normal' }),
    a('conducta', `${D}T18:00`, { conductes: ['cridar'], intensitat: 2, resultat: 'es-calma-prompte' })
  ];
  return assignaJornades(canvis.llista ? canvis.llista(llista) : llista, canvis.persona || PERSONA);
}
const COMPLETA = new Map([[D, { data: D, completa: true }]]);

describe('una jornada completa i mesurada', () => {
  const m = metriquesJornada(D, diari(), { persona: PERSONA, jornades: COMPLETA });

  test('vegades de dia (la primera i l’última incloses) i de nit (sense la primera del matí)', () => {
    expect(m.completa).toBe(true);
    expect(m.limits.estimat).toBe(false);
    expect(m.frequenciaDiurna).toBe(5);
    expect(m.nicturia).toBe(2);
    expect(m.frequencia24h).toBe(7);
    expect(m.cobertura).toBe(100);
    expect(textCobertura(m)).toBe('100 %');
  });

  test('volums: la finestra de 24 h va de després de la primera del matí fins a la de l’endemà', () => {
    expect(m.motiuSenseVolums).toBeNull();
    // 200 + 250 + 150 + 100 (dia, sense la de les 07:10) + 200 + 150 (nit) + 350 (primera de l'endemà)
    expect(m.volum24h).toBe(1400);
    // Nit + primera del matí següent.
    expect(m.volumNocturn).toBe(700);
    expect(m.indexPoliuriaNocturna).toBe(50);
    expect(m.volumMaxim).toBe(350);
    expect(m.indexNicturia).toBe(2);
    expect(m.volumMitja).toBe(200);
    expect(m.mlPerKg24h).toBe(20);
  });

  test('intervals de dia, begudes, vespre i la diferència apuntada (no és un balanç)', () => {
    expect(m.intervalMitjaMin).toBe(226);
    expect(m.intervalMesLlargMin).toBe(315);
    expect(m.ingestaTotal).toBe(700);
    expect(m.ingestaPerTipus).toEqual({ aigua: 550, cafe: 150 });
    expect(m.begudesRebutjades).toBe(1);
    // Les 3 hores abans de gitar-se (22:00): 19:30 i 21:00.
    expect(m.ingestaVespre).toBe(250);
    // 700 begut − 1350 orinat dins de la jornada.
    expect(m.diferenciaApuntada).toBe(-650);
    expect(m.escapaments).toBe(1);
    expect(m.deposicions).toBe(1);
    expect(m.bristol).toEqual([4]);
    expect(m.episodis).toBe(1);
  });
});

describe('la nit comença quan s’adorm, no quan es torna a adormir (SAL-01)', () => {
  /* Es desperta a les 02:00, orina i la família apunta que es torna a adormir a
     les 02:20, com demana la guia: la nit continua sent la de les 22:30. */
  const nitAmbDespertar = (ambGitarSe) => assignaJornades([
    a('son', `${D}T07:00`, { event: 'alcar-se' }),
    orina(`${D}T07:10`, 300),
    orina(`${D}T13:00`, 250),
    ...(ambGitarSe ? [a('son', `${D}T22:00`, { event: 'gitar-se' })] : []),
    a('son', `${D}T22:30`, { event: 'adormir-se' }),
    orina('2026-10-06T02:00', 200),
    a('son', '2026-10-06T02:00', { event: 'despertar', motiu: 'orinar' }),
    ...(ambGitarSe ? [a('son', '2026-10-06T02:10', { event: 'gitar-se' })] : []),
    a('son', '2026-10-06T02:20', { event: 'adormir-se' }),
    orina('2026-10-06T04:30', 150),
    a('son', '2026-10-06T07:00', { event: 'alcar-se' }),
    orina('2026-10-06T07:15', 350)
  ], PERSONA);

  test.each([
    ['sense gitar-se', false],
    ['amb un gitar-se abans i un altre després del despertar', true]
  ])('%s: dos vegades de nit i tota l’orina de nit', (_, ambGitarSe) => {
    const m = metriquesJornada(D, nitAmbDespertar(ambGitarSe), { persona: PERSONA, jornades: COMPLETA });
    expect(m.limits.adormir.moment).toBe(`${D}T22:30`);
    expect(m.frequenciaDiurna).toBe(2);
    expect(m.nicturia).toBe(2);
    // 200 + 150 (nit) + 350 (primera de l'endemà)
    expect(m.volumNocturn).toBe(700);
    // 250 (dia, sense la primera del matí) + 700
    expect(m.volum24h).toBe(950);
  });

  test('un adormir-se d’abans de gitar-se (al sofà) no comença la nit', () => {
    const apunts = assignaJornades([
      a('son', `${D}T07:00`, { event: 'alcar-se' }),
      a('son', `${D}T20:00`, { event: 'adormir-se' }),
      orina(`${D}T21:30`, 200),
      a('son', `${D}T22:00`, { event: 'gitar-se' }),
      a('son', `${D}T22:30`, { event: 'adormir-se' }),
      orina('2026-10-06T03:00', 200),
      a('son', '2026-10-06T07:00', { event: 'alcar-se' })
    ], PERSONA);
    const m = metriquesJornada(D, apunts, { persona: PERSONA, jornades: COMPLETA });
    expect(m.limits.adormir.moment).toBe(`${D}T22:30`);
    expect(m.frequenciaDiurna).toBe(1);
    expect(m.nicturia).toBe(1);
  });

  test('les begudes del vespre són les de les 3 hores abans de gitar-se la primera vegada', () => {
    const apunts = assignaJornades([
      a('son', `${D}T07:00`, { event: 'alcar-se' }),
      a('ingesta', `${D}T21:00`, { volumMl: 100, beguda: 'aigua' }),
      a('son', `${D}T22:00`, { event: 'gitar-se' }),
      a('son', `${D}T22:30`, { event: 'adormir-se' }),
      a('son', '2026-10-06T02:00', { event: 'despertar', motiu: 'orinar' }),
      a('ingesta', '2026-10-06T02:05', { volumMl: 50, beguda: 'aigua' }),
      a('son', '2026-10-06T02:10', { event: 'gitar-se' }),
      a('son', '2026-10-06T07:00', { event: 'alcar-se' })
    ], PERSONA);
    const m = metriquesJornada(D, apunts, { persona: PERSONA, jornades: COMPLETA });
    expect(m.ingestaVespre).toBe(100);
  });
});

describe('sense índexs quan falten dades', () => {
  test('cobertura parcial: cap volum ni índex, i el text diu «parcial»', () => {
    const apunts = diari({ llista: (l) => l.map((x) => (x.moment === `${D}T13:00` ? { ...x, mesura: 'no-mesurat', volumMl: undefined } : x)) });
    const m = metriquesJornada(D, apunts, { persona: PERSONA, jornades: COMPLETA });
    expect(m.cobertura).toBe(86);
    expect(textCobertura(m)).toBe('parcial (86 %)');
    expect(m.motiuSenseVolums).toBe('cobertura');
    expect(m.volum24h).toBeNull();
    expect(m.indexPoliuriaNocturna).toBeNull();
    expect(m.indexNicturia).toBeNull();
    expect(m.diferenciaApuntada).toBe(700 - 1100);
    expect(m.frequenciaDiurna).toBe(5);
  });

  test('una jornada no completa compta les vegades però no calcula volums', () => {
    const m = metriquesJornada(D, diari(), { persona: PERSONA, jornades: new Map() });
    expect(m.completa).toBe(false);
    expect(m.motiuSenseVolums).toBe('no-completa');
    expect(m.volum24h).toBeNull();
    expect(m.diferenciaApuntada).toBeNull();
    expect(m.nicturia).toBe(2);
  });

  test('sense la primera micció de l’endemà no hi ha orina de nit', () => {
    const apunts = diari({ llista: (l) => l.filter((x) => x.moment !== '2026-10-06T07:15') });
    const m = metriquesJornada(D, apunts, { persona: PERSONA, jornades: COMPLETA });
    expect(m.motiuSenseVolums).toBe('sense-mati-seguent');
    expect(m.volumNocturn).toBeNull();
  });

  test('sense pes no hi ha ml per kg', () => {
    const persona = { ...PERSONA, pesKg: undefined };
    const m = metriquesJornada(D, diari({ persona }), { persona, jornades: COMPLETA });
    expect(m.volum24h).toBe(1400);
    expect(m.mlPerKg24h).toBeNull();
  });
});

describe('període', () => {
  test('la mitjana només compta les jornades completes', () => {
    const apunts = diari();
    const periode = metriquesPeriode(D, 2, apunts, { persona: PERSONA, jornades: COMPLETA });
    expect(periode.jornades.map((m) => m.data)).toEqual([D, '2026-10-06']);
    expect(periode.completes).toBe(1);
    expect(periode.mitjana.volum24h).toBe(1400);
    expect(periode.mitjana.nicturia).toBe(2);
  });

  test('dies sense deposició: null si mai s’ha apuntat cap', () => {
    const apunts = diari();
    expect(diesSenseDeposicio(apunts, '2026-10-08')).toBe(3);
    expect(diesSenseDeposicio(apunts.filter((x) => x.tipus !== 'deposicio'), '2026-10-08')).toBeNull();
  });
});
