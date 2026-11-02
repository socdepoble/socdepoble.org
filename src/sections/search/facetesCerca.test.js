/**
 * IDEA-46 (B6-B1, marató 261101_2143) · Les facetes pures de l'espai de
 * cerca (facetesCerca.js): trams de data amb el rellotge i el desfasament
 * injectats, facetes d'una entrada, grups amb recomptes i ordre estable,
 * elements de l'espai i etiquetes. Entrades fetes amb els adaptadors de
 * veres d'indexCerca.js; noms de persona sintètics. Amb l'entorn per
 * defecte (jsdom): la regla de les imatges (isSafeAsset) mira la finestra.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ESTATS, RESERVES_I18N } from '../../utils/publicacioUniversal.js';
import fontFacetes from './facetesCerca.js?raw';
import {
  ESTATS_FACETA, GRUPS_FACETES, TRAMS_DATA, ambEtiquetes, facetesDeLEntrada, grupsDeFacetes, idDeFaceta, itemsDeLEspai, tramsDeData
} from './facetesCerca.js';
import {
  TIPUS_CERCA, deActe, deAgent, deNota, dePagina, dePoble, deProducte, dePublicacio, esCorreu, marcaTemps, plega
} from './indexCerca.js';

const DIA = 86_400_000;
const HORA = 3_600_000;
const CET = 60;
/* Diumenge 1-11-2026, 22:00 en hora local (CET, UTC+1). */
const ARA = Date.UTC(2026, 10, 1, 21, 0);
const OPCIONS = Object.freeze({ ara: ARA, desfasMinuts: CET });
/* Una hora local (CET) com a marca UTC. */
const local = (any, mes, dia, hora = 12, minut = 0) => Date.UTC(any, mes - 1, dia, hora, minut) - CET * 60_000;
const iso = (ms) => new Date(ms).toISOString();
const trams = (marca, opcions = OPCIONS) => tramsDeData(marca, opcions);
const ids = (grup) => grup.options.map((opcio) => opcio.id);
const TORRE = 'La Torre de les Maçanes';

afterEach(() => {
  vi.useRealTimers();
});

describe('tramsDeData', () => {
  test('acumulatius: una entrada d’avui és hui, setmana, mes i any', () => {
    expect(trams(local(2026, 11, 1, 8))).toEqual(['hui', 'setmana', 'mes', 'any']);
    expect(trams(local(2026, 11, 1, 0, 0))).toEqual(['hui', 'setmana', 'mes', 'any']);
    expect(trams(local(2026, 11, 1, 23, 59))).toEqual(['hui', 'setmana', 'mes', 'any']);
  });

  test('setmana, mes i any arriben fins al mateix dia de fa una setmana, un mes o un any, inclòs', () => {
    expect(trams(local(2026, 10, 31))).toEqual(['setmana', 'mes', 'any']);
    expect(trams(local(2026, 10, 25))).toEqual(['setmana', 'mes', 'any']);
    expect(trams(local(2026, 10, 24))).toEqual(['mes', 'any']);
    expect(trams(local(2026, 10, 1))).toEqual(['mes', 'any']);
    expect(trams(local(2026, 9, 30))).toEqual(['any']);
    expect(trams(local(2025, 11, 1))).toEqual(['any']);
  });

  test('abans és més d’un any enrere', () => {
    expect(trams(local(2025, 10, 31, 23, 59))).toEqual(['abans']);
    expect(trams(local(2020, 2, 29))).toEqual(['abans']);
    expect(trams(Date.UTC(1965, 5, 1))).toEqual(['abans']);
  });

  test('futur és després del final del dia local (l’agenda)', () => {
    expect(trams(local(2026, 11, 2, 0, 0))).toEqual(['futur']);
    expect(trams(local(2027, 6, 24))).toEqual(['futur']);
  });

  test('el dia local canvia a les 23:00 UTC en CET: a les 23:30 UTC ja és l’endemà', () => {
    const ara = Date.UTC(2026, 10, 1, 23, 30);
    const desprésDeMitjanit = Date.UTC(2026, 10, 1, 23, 10);
    const abansDeMitjanit = Date.UTC(2026, 10, 1, 22, 50);
    expect(tramsDeData(desprésDeMitjanit, { ara, desfasMinuts: CET })).toContain('hui');
    expect(tramsDeData(abansDeMitjanit, { ara, desfasMinuts: CET })).toEqual(['setmana', 'mes', 'any']);
    /* En UTC, les dues són del mateix dia. */
    expect(tramsDeData(abansDeMitjanit, { ara, desfasMinuts: 0 })).toContain('hui');
  });

  test('el desfasament és l’hora local menys UTC (el signe contrari de getTimezoneOffset)', () => {
    /* Les 23:10 UTC del dia 1 ja són el dia 2 en CET (+60), i encara el dia 1 amb −60. */
    const marca = Date.UTC(2026, 10, 1, 23, 10);
    expect(tramsDeData(marca, { ara: ARA, desfasMinuts: 60 })).toEqual(['futur']);
    expect(tramsDeData(marca, { ara: ARA, desfasMinuts: -60 })).toContain('hui');
    /* Nova York (−300): les 04:00 UTC del dia 2 són les 23:00 del dia 1. */
    const araNY = Date.UTC(2026, 10, 1, 23, 30);
    expect(tramsDeData(Date.UTC(2026, 10, 2, 4, 0), { ara: araNY, desfasMinuts: -300 })).toContain('hui');
    expect(tramsDeData(Date.UTC(2026, 10, 2, 5, 10), { ara: araNY, desfasMinuts: -300 })).toEqual(['futur']);
  });

  test('`ara` pot ser un Date', () => {
    expect(tramsDeData(local(2026, 11, 1, 8), { ara: new Date(ARA), desfasMinuts: CET })).toEqual(['hui', 'setmana', 'mes', 'any']);
  });

  test('una data absent o invàlida no entra en cap tram', () => {
    for (const marca of [0, NaN, Infinity, -Infinity, '2026-11-01', null, undefined, {}, [], 9e15, -9e15]) {
      expect(trams(marca), String(marca)).toEqual([]);
    }
  });

  test('sense `ara` vàlid no hi ha cap tram: el mòdul no té rellotge propi', () => {
    for (const ara of [undefined, null, NaN, Infinity, '2026-11-01', new Date('no és cap data'), 9e15]) {
      expect(tramsDeData(local(2026, 11, 1, 8), { ara, desfasMinuts: CET }), String(ara)).toEqual([]);
    }
    expect(tramsDeData(local(2026, 11, 1, 8))).toEqual([]);
  });

  test('un desfasament invàlid compta com 0 (UTC)', () => {
    const ara = Date.UTC(2026, 10, 1, 23, 30);
    const marca = Date.UTC(2026, 10, 1, 22, 50);
    expect(tramsDeData(marca, { ara, desfasMinuts: CET })).not.toContain('hui');
    /* 1500 (UTC+25) i −1380 (UTC−23) mourien les dues marques a dies distints, com el 60. */
    for (const desfasMinuts of ['60', NaN, Infinity, 1500, -1380, null]) {
      expect(tramsDeData(marca, { ara, desfasMinuts }), String(desfasMinuts)).toEqual(tramsDeData(marca, { ara, desfasMinuts: 0 }));
    }
  });

  test('un mes enrere retalla el dia a l’últim del mes; un any enrere, també als anys de traspàs', () => {
    const ara31m = local(2027, 3, 31, 12);
    expect(tramsDeData(local(2027, 2, 28), { ara: ara31m, desfasMinuts: CET })).toEqual(['mes', 'any']);
    expect(tramsDeData(local(2027, 2, 27), { ara: ara31m, desfasMinuts: CET })).toEqual(['any']);
    const ara29f = local(2028, 2, 29, 12);
    expect(tramsDeData(local(2027, 2, 28), { ara: ara29f, desfasMinuts: CET })).toEqual(['any']);
    expect(tramsDeData(local(2027, 2, 27), { ara: ara29f, desfasMinuts: CET })).toEqual(['abans']);
  });

  /* Correcció ARB-B6B1-02 · L'horari d'Europa/Madrid de 2026 com a funció pura:
     CEST (+120) del 29-3 a les 01:00 UTC al 25-10 a les 01:00 UTC; CET (+60) la resta. */
  const madrid = (ms) => (ms >= Date.UTC(2026, 2, 29, 1) && ms < Date.UTC(2026, 9, 25, 1) ? 120 : 60);

  test('amb un desfasament per marca (funció), una data AAAA-MM-DD d’estiu avaluada a l’hivern no cau al dia d’abans', () => {
    /* La mitjanit local de l'1-10 i del 25-10 és en CEST: les 22:00 UTC del dia anterior. */
    const u1oct = Date.UTC(2026, 8, 30, 22);
    const u25oct = Date.UTC(2026, 9, 24, 22);
    expect(tramsDeData(u1oct, { ara: ARA, desfasMinuts: madrid })).toEqual(['mes', 'any']);
    expect(tramsDeData(u25oct, { ara: ARA, desfasMinuts: madrid })).toEqual(['setmana', 'mes', 'any']);
    /* Amb el número d'hivern per a totes, les dues cauen al dia d'abans (per això la vista passa la funció). */
    expect(tramsDeData(u1oct, { ara: ARA, desfasMinuts: CET })).toEqual(['any']);
    expect(tramsDeData(u25oct, { ara: ARA, desfasMinuts: CET })).toEqual(['mes', 'any']);
  });

  test('el dia del canvi d’hora, un acte d’eixe dia és «hui»', () => {
    const migdia25oct = Date.UTC(2026, 9, 25, 11);
    const mitjanit25oct = Date.UTC(2026, 9, 24, 22);
    expect(tramsDeData(mitjanit25oct, { ara: migdia25oct, desfasMinuts: madrid })).toEqual(['hui', 'setmana', 'mes', 'any']);
    expect(tramsDeData(mitjanit25oct, { ara: migdia25oct, desfasMinuts: CET })).not.toContain('hui');
  });

  test('amb la funció del navegador, les dates AAAA-MM-DD de l’índex cauen al seu dia en qualsevol zona', () => {
    const navegador = (ms) => -new Date(ms).getTimezoneOffset();
    const opcions = { ara: new Date(2026, 10, 1, 22).getTime(), desfasMinuts: navegador };
    expect(tramsDeData(deActe({ id: 'a1', title: 'Concert', date: '2026-10-01' }).data, opcions)).toEqual(['mes', 'any']);
    expect(tramsDeData(dePagina({ key: 'pg', title: 'Pàgina', date: '2026-10-01' }).data, opcions)).toEqual(['mes', 'any']);
    expect(tramsDeData(marcaTemps('2026-10-25'), opcions)).toEqual(['setmana', 'mes', 'any']);
    expect(tramsDeData(marcaTemps('2026-10-24'), opcions)).toEqual(['mes', 'any']);
    const diaDelCanvi = { ara: new Date(2026, 9, 25, 12).getTime(), desfasMinuts: navegador };
    expect(tramsDeData(marcaTemps('2026-10-25'), diaDelCanvi)).toContain('hui');
  });

  test('la funció es pregunta per a `ara` i per a la marca; si llança o torna un valor invàlid, compta com 0', () => {
    const marca = Date.UTC(2026, 10, 1, 22, 50);
    const ara = Date.UTC(2026, 10, 1, 23, 30);
    const espia = vi.fn(() => CET);
    expect(tramsDeData(marca, { ara, desfasMinuts: espia })).toEqual(tramsDeData(marca, { ara, desfasMinuts: CET }));
    expect(espia.mock.calls.map(([ms]) => ms).sort()).toEqual([marca, ara].sort());
    const enUTC = tramsDeData(marca, { ara, desfasMinuts: 0 });
    expect(enUTC).toContain('hui');
    for (const invalida of [() => NaN, () => '60', () => 1500, () => undefined, () => { throw new Error('zona'); }]) {
      expect(tramsDeData(marca, { ara, desfasMinuts: invalida })).toEqual(enUTC);
    }
  });

  test('els trams són coherents dia a dia: niuats, en l’ordre de TRAMS_DATA i un sol extrem', () => {
    const ordre = TRAMS_DATA.map((tram) => tram.id);
    for (let dies = -3; dies <= 800; dies += 1) {
      const resultat = trams(ARA - dies * DIA);
      const posicions = resultat.map((id) => ordre.indexOf(id));
      expect(posicions.every((p, i) => p >= 0 && (i === 0 || p > posicions[i - 1])), `${dies}`).toBe(true);
      expect(['futur', 'any', 'abans'].filter((id) => resultat.includes(id)), `${dies}`).toHaveLength(1);
      if (resultat.includes('hui')) expect(resultat, `${dies}`).toContain('setmana');
      if (resultat.includes('setmana')) expect(resultat, `${dies}`).toContain('mes');
      if (resultat.includes('mes')) expect(resultat, `${dies}`).toContain('any');
      expect(resultat.includes('futur'), `${dies}`).toBe(dies < 0);
      expect(resultat.includes('hui'), `${dies}`).toBe(dies === 0);
      expect(resultat.includes('setmana'), `${dies}`).toBe(dies >= 0 && dies <= 7);
    }
  });
});

/* ── Entrades de veres (adaptadors d'indexCerca.js) ── */

const P1 = dePublicacio({ id: 'p1', title: 'Festa de la Cirera', town_name: TORRE, date: iso(local(2026, 11, 1, 10)) });
const P2 = dePublicacio({ id: 'p2', title: 'Obres a la plaça', town_name: 'la torre de les maçanes', date: iso(local(2026, 10, 29, 10)) });
const A1 = deActe({ id: 'a1', title: 'Concert al llavador', date: iso(local(2026, 11, 3, 19)) });
const M1 = deProducte({ id: 'm1', title: 'Mel de romer', population: 'Benifallim', created_at: iso(local(2026, 9, 22, 9)) });
const V1 = dePoble({ id: 'benifallim', title: 'Benifallim', comarca: "l'Alcoià", created_at: iso(local(2024, 5, 2, 9)) });
const N1 = deNota({ id: 'n1', title: 'Llista del forn', updatedAt: iso(local(2026, 11, 1, 9)) });
const E1 = deAgent({ id: 'x1', name: 'Pere Fictici', type: 'PERSON', town_name: 'Benifallim' });
const ENTRADES = Object.freeze([P1, P2, A1, M1, V1, N1, E1].map((e) => Object.freeze(e)));

describe('facetesDeLEntrada', () => {
  test('el tipus, el poble (slug del plegat) i els trams de data', () => {
    expect(facetesDeLEntrada(P1, OPCIONS)).toEqual([
      'tipus:publicacions', 'poble:la-torre-de-les-macanes', 'data:hui', 'data:setmana', 'data:mes', 'data:any'
    ]);
    expect(facetesDeLEntrada(A1, OPCIONS)).toEqual(['tipus:agenda', 'data:futur']);
    expect(facetesDeLEntrada(E1, OPCIONS)).toEqual(['tipus:persones', 'poble:benifallim']);
  });

  test('la ela geminada i els accents es pleguen: Ul·ldecona i Ulldecona són el mateix poble', () => {
    const amb = deProducte({ id: 'q1', title: 'Oli', population: 'Ul·ldecona' });
    const sense = deProducte({ id: 'q2', title: 'Vi', population: 'ULLDECONA' });
    expect(facetesDeLEntrada(amb, OPCIONS)).toContain('poble:ulldecona');
    expect(facetesDeLEntrada(sense, OPCIONS)).toContain('poble:ulldecona');
  });

  test('un tipus desconegut (o «tot») no fa cap faceta de tipus; una entrada que no és objecte, cap', () => {
    expect(facetesDeLEntrada({ clau: 'x:1', tipus: 'tot', titol: 'X' }, OPCIONS)).toEqual([]);
    expect(facetesDeLEntrada({ clau: 'x:2', tipus: 'cosa', titol: 'X' }, OPCIONS)).toEqual([]);
    for (const res of [null, undefined, 'publicacions:p1', 7]) expect(facetesDeLEntrada(res, OPCIONS)).toEqual([]);
  });

  test('un poble amb forma de correu no fa cap faceta, tampoc pel plegat que l’índex conserva (ARB-B6B1-03)', () => {
    const ambCorreu = dePublicacio({ id: 'c1', title: 'Amb correu', town_name: 'veina@exemple.com' });
    expect(ambCorreu.poble).toBe('');
    expect(facetesDeLEntrada(ambCorreu, OPCIONS).filter((id) => id.startsWith('poble:'))).toEqual([]);
    /* Un poble que s'escriu com el correu plegat no se l'emporta al seu recompte. */
    const trampa = dePublicacio({ id: 'c2', title: 'Trampa', town_name: 'Veina Exemple Com' });
    const pobles = grupsDeFacetes([ambCorreu, trampa], OPCIONS).find((g) => g.id === 'pobles');
    expect(pobles.options).toEqual([{ id: 'poble:veina-exemple-com', text: 'Veina Exemple Com', count: 1 }]);
    const nomesPlegat = { clau: 'persones:c3', tipus: 'persones', titol: 'Plegat', poble: '', poblePlegat: 'veina@exemple.com', data: 0 };
    expect(facetesDeLEntrada(nomesPlegat, OPCIONS)).toEqual(['tipus:persones']);
    const nomesGrafia = { clau: 'persones:c4', tipus: 'persones', titol: 'Grafia', poble: 'veina@exemple.com', data: 0 };
    expect(facetesDeLEntrada(nomesGrafia, OPCIONS)).toEqual(['tipus:persones']);
    expect(grupsDeFacetes([nomesGrafia], OPCIONS).map((g) => g.id)).toEqual(['tipus']);
  });

  test('idDeFaceta compon grup i valor', () => {
    expect(idDeFaceta('tipus', 'agenda')).toBe('tipus:agenda');
    expect(idDeFaceta('poble', 'la-torre-de-les-macanes')).toBe('poble:la-torre-de-les-macanes');
  });
});

describe('grupsDeFacetes', () => {
  test('els grups en l’ordre de GRUPS_FACETES, amb clau i text; sense cap fitxa d’àmbit, cap grup Estat', () => {
    const grups = grupsDeFacetes(ENTRADES, OPCIONS);
    expect(grups.map((g) => [g.id, g.clau, g.text])).toEqual(GRUPS_FACETES.filter((g) => g.id !== 'estat').map((g) => [g.id, g.clau, g.text]));
    expect(GRUPS_FACETES.map((g) => g.id)).toEqual(['tipus', 'estat', 'pobles', 'data']);
  });

  test('Tipus: en l’ordre de TIPUS_CERCA, sense «tot» i només els que tenen recompte', () => {
    const [tipus] = grupsDeFacetes(ENTRADES, OPCIONS);
    expect(tipus.options.map((o) => [o.id, o.count])).toEqual([
      ['tipus:persones', 1], ['tipus:pobles', 1], ['tipus:publicacions', 2], ['tipus:agenda', 1], ['tipus:mercat', 1], ['tipus:notes', 1]
    ]);
    const agenda = tipus.options.find((o) => o.id === 'tipus:agenda');
    const deLaCerca = TIPUS_CERCA.find((t) => t.id === 'agenda');
    expect(agenda).toEqual({ id: 'tipus:agenda', clau: deLaCerca.clau, text: deLaCerca.text, count: 1 });
  });

  test('Pobles: una sola opció per poble plegat, amb la primera grafia, de més a menys recompte', () => {
    const pobles = grupsDeFacetes(ENTRADES, OPCIONS).find((g) => g.id === 'pobles');
    expect(pobles.options).toEqual([
      { id: 'poble:benifallim', text: 'Benifallim', count: 3 },
      { id: 'poble:la-torre-de-les-macanes', text: TORRE, count: 2 }
    ]);
    /* El nom d'un poble no porta clau: no es traduïx. */
    expect(pobles.options.every((o) => !('clau' in o))).toBe(true);
  });

  test('Pobles: en empat, per l’ordre alfabètic català (l’accent no passa davant)', () => {
    const fes = (id, poble) => dePublicacio({ id, title: `Publicació ${id}`, town_name: poble });
    const pobles = grupsDeFacetes([fes('1', 'Alcoi'), fes('2', 'Àger'), fes('3', 'Benilloba')], OPCIONS).find((g) => g.id === 'pobles');
    expect(pobles.options.map((o) => o.text)).toEqual(['Àger', 'Alcoi', 'Benilloba']);
  });

  test('Data: en l’ordre de TRAMS_DATA, acumulatius i només els que tenen recompte', () => {
    const data = grupsDeFacetes(ENTRADES, OPCIONS).find((g) => g.id === 'data');
    expect(data.options.map((o) => [o.id, o.count])).toEqual([
      ['data:futur', 1], ['data:hui', 2], ['data:setmana', 3], ['data:mes', 3], ['data:any', 4], ['data:abans', 1]
    ]);
    expect(data.options[1]).toEqual({ id: 'data:hui', clau: 'section.search.espai.data.hui', text: 'Hui', count: 2 });
  });

  test('un grup sense cap opció no hi és; sense entrades, cap grup', () => {
    expect(grupsDeFacetes([N1, A1], OPCIONS).map((g) => g.id)).toEqual(['tipus', 'data']);
    expect(grupsDeFacetes([E1], { desfasMinuts: CET }).map((g) => g.id)).toEqual(['tipus', 'pobles']);
    for (const res of [[], null, undefined, 'entrades', {}]) expect(grupsDeFacetes(res, OPCIONS)).toEqual([]);
  });

  test('cap correu a cap etiqueta, encara que l’entrada no passe per l’índex', () => {
    const ambCorreu = { clau: 'persones:c1', tipus: 'persones', titol: 'Correu', poble: 'veina@exemple.com', poblePlegat: plega('veina@exemple.com'), data: 0 };
    const grups = grupsDeFacetes([ambCorreu, P1], OPCIONS);
    const etiquetes = grups.flatMap((g) => [g.text, ...g.options.map((o) => o.text)]);
    expect(etiquetes.some((text) => text.includes('@'))).toBe(false);
    expect(grups.find((g) => g.id === 'pobles').options.map((o) => o.id)).toEqual(['poble:la-torre-de-les-macanes']);
    expect(itemsDeLEspai([ambCorreu], OPCIONS)[0].categoryIds).toEqual(['tipus:persones']);
  });

  test('una entrada amb només el poble plegat (una fusió de fonts) compta si algú porta la grafia', () => {
    const fusionada = { clau: 'persones:f1', tipus: 'persones', titol: 'Fusionada', poble: '', poblePlegat: 'la torre de les macanes', data: 0 };
    const sola = { clau: 'persones:f2', tipus: 'persones', titol: 'Sola', poble: '', poblePlegat: 'vilafantasma', data: 0 };
    const grups = grupsDeFacetes([fusionada, P1, P2, sola], OPCIONS);
    expect(grups.find((g) => g.id === 'pobles').options).toEqual([{ id: 'poble:la-torre-de-les-macanes', text: TORRE, count: 3 }]);
    const items = itemsDeLEspai([fusionada, P1, P2, sola], OPCIONS);
    expect(items[0].categoryIds).toContain('poble:la-torre-de-les-macanes');
    expect(items[3].categoryIds).toEqual(['tipus:persones']);
  });

  test('una clau repetida compta una sola vegada (la primera); sense clau, no compta', () => {
    const repetida = { ...P2, clau: P1.clau };
    const grups = grupsDeFacetes([P1, repetida, { tipus: 'publicacions', titol: 'Sense clau' }], OPCIONS);
    expect(grups[0].options).toEqual([{ id: 'tipus:publicacions', clau: 'section.search.tipus.publicacions', text: 'Publicacions', count: 1 }]);
  });

  test('el recompte de cada opció és el nombre d’elements que la porten', () => {
    const grups = grupsDeFacetes(ENTRADES, OPCIONS);
    const items = itemsDeLEspai(ENTRADES, OPCIONS);
    for (const opcio of grups.flatMap((g) => g.options)) {
      expect(items.filter((item) => item.categoryIds.includes(opcio.id)).length, opcio.id).toBe(opcio.count);
    }
    const totes = new Set(grups.flatMap(ids));
    for (const item of items) for (const id of item.categoryIds) expect(totes.has(id), id).toBe(true);
  });
});

describe('itemsDeLEspai', () => {
  test('un element per entrada, en l’ordre del rànquing, amb la forma de UniversalWorkspace', () => {
    const items = itemsDeLEspai(ENTRADES, OPCIONS);
    expect(items.map((i) => i.id)).toEqual(ENTRADES.map((e) => e.clau));
    expect(items[0]).toEqual({
      id: 'publicacions:p1',
      title: 'Festa de la Cirera',
      subtitle: P1.meta.join(' · '),
      updatedAt: new Date(P1.data).toISOString(),
      categoryIds: facetesDeLEntrada(P1, OPCIONS),
      entrada: P1
    });
    expect(items[0].entrada).toBe(P1);
    for (const item of items) {
      expect(item).not.toHaveProperty('searchText');
      expect(item).not.toHaveProperty('tags');
    }
  });

  test('sense data, cap updatedAt; la imatge, només si l’entrada en porta una que /cerca pinta', () => {
    const [persona] = itemsDeLEspai([E1], OPCIONS);
    expect(persona.updatedAt).toBeUndefined();
    expect(persona).not.toHaveProperty('image');
    const ambFoto = dePublicacio({ id: 'f1', title: 'Amb foto', image_url: 'https://exemple.org/foto.webp' });
    expect(itemsDeLEspai([ambFoto], OPCIONS)[0].image).toBe('https://exemple.org/foto.webp');
    const ambRefOpaca = dePublicacio({ id: 'f2', title: 'Opaca', image_url: 'sdp-media://mitjans/x/y.webp' });
    expect(itemsDeLEspai([ambRefOpaca], OPCIONS)[0]).not.toHaveProperty('image');
  });

  test('la meta amb forma de correu no passa al subtítol', () => {
    const entrada = { clau: 'persones:m1', tipus: 'persones', titol: 'Meta', meta: ['Veïna', 'veina@exemple.com', 'Benifallim'], data: 0 };
    expect(itemsDeLEspai([entrada], OPCIONS)[0].subtitle).toBe('Veïna · Benifallim');
  });

  test('la meta es descarta amb la mateixa forma de correu que esCorreu (totes les cadenes curtes de «a@. »)', () => {
    const lletres = ['a', '@', '.', ' '];
    const cadenes = [''];
    for (let i = 0; i < cadenes.length && cadenes[i].length < 7; i += 1) for (const l of lletres) cadenes.push(cadenes[i] + l);
    cadenes.push('a@b.c', 'x a@b..c y', 'a@.b.c', 'a@.c', 'a@b.', '@b.c', 'a@@b.c', 'a@b@c.d', 'a @b.c', 'a@b\n.c', 'a\t@b.c', 'Sr. Lluís @usuari');
    const subtitolDe = (valor) => itemsDeLEspai([{ clau: 'persones:m', tipus: 'persones', titol: 'M', meta: [valor], data: 0 }], OPCIONS)[0].subtitle;
    for (const valor of cadenes) {
      expect(subtitolDe(valor), JSON.stringify(valor)).toBe(valor.trim() && !esCorreu(valor) ? valor : '');
    }
  });

  test('una meta o un poble de milers de caràcters sense espais no fa cap retrocés quadràtic (ARB-B6B1-01)', () => {
    const llarg = 'a'.repeat(20_000);
    const entrades = Array.from({ length: 20 }, (_, i) => ({
      clau: `publicacions:r${i}`, tipus: 'publicacions', titol: `R${i}`, meta: [llarg, `${llarg}@`], poble: llarg, poblePlegat: llarg, data: 0
    }));
    const inici = performance.now();
    const items = itemsDeLEspai(entrades, OPCIONS);
    grupsDeFacetes(entrades, OPCIONS);
    /* Lineal, uns pocs mil·lisegons; amb l'expressió regular eren uns 340 ms per element (més de 6 s). */
    expect(performance.now() - inici).toBeLessThan(750);
    expect(items[0].subtitle).toBe(`${llarg} · ${llarg}@`);
  });

  test('no toca les entrades que rep (congelades) i dona el mateix resultat dues vegades', () => {
    expect(() => itemsDeLEspai(ENTRADES, OPCIONS)).not.toThrow();
    expect(itemsDeLEspai(ENTRADES, OPCIONS)).toEqual(itemsDeLEspai(ENTRADES, OPCIONS));
    expect(grupsDeFacetes(ENTRADES, OPCIONS)).toEqual(grupsDeFacetes(ENTRADES, OPCIONS));
  });
});

describe('ambEtiquetes', () => {
  test('tradueix les opcions amb clau i deixa el nom del poble tal qual', () => {
    const t = vi.fn((clau, reserva) => (clau === 'section.search.tipus.agenda' ? 'Agenda (es)' : `${reserva}*`));
    const grups = grupsDeFacetes(ENTRADES, OPCIONS);
    const amb = ambEtiquetes(grups, t);
    expect(amb[0].label).toBe('Tipus*');
    expect(amb[0].options.find((o) => o.id === 'tipus:agenda').label).toBe('Agenda (es)');
    expect(amb[1].options.map((o) => o.label)).toEqual(['Benifallim', TORRE]);
    expect(t.mock.calls.every(([clau]) => typeof clau === 'string' && clau.startsWith('section.search.'))).toBe(true);
    /* Els grups d'entrada no es toquen. */
    expect(grups[0]).not.toHaveProperty('label');
  });

  test('sense traductor (o si torna buit), l’etiqueta és el text en valencià', () => {
    const grups = grupsDeFacetes(ENTRADES, OPCIONS);
    expect(ambEtiquetes(grups).map((g) => g.label)).toEqual(['Tipus', 'Pobles', 'Data']);
    expect(ambEtiquetes(grups, () => '')[2].options[0].label).toBe('Pròximament');
    expect(ambEtiquetes(null)).toEqual([]);
  });
});

describe('puresa', () => {
  test('el resultat no depén del rellotge del sistema, només de l’`ara` injectat', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-15T12:00:00Z'));
    const primer = [grupsDeFacetes(ENTRADES, OPCIONS), itemsDeLEspai(ENTRADES, OPCIONS)];
    vi.setSystemTime(new Date('1999-12-31T23:59:00Z'));
    const segon = [grupsDeFacetes(ENTRADES, OPCIONS), itemsDeLEspai(ENTRADES, OPCIONS)];
    expect(segon).toEqual(primer);
  });

  test('frontera: cap React, cap xarxa, cap rellotge ni atzar propis', () => {
    const codi = fontFacetes.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    expect(codi).not.toMatch(/from\s+['"]react|fetch\(|Date\.now|new Date\(\)|Math\.random|performance\.now/);
    /* IDEA-61 · El contracte pur del flux universal (JS pur, sense xarxa ni rellotge) és l'única importació nova. */
    expect([...codi.matchAll(/import\s[^;]*from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]))
      .toEqual(['../../utils/publicacioUniversal.js', './indexCerca.js']);
  });
});

/* ── IDEA-61 (T0, prompt 261102_1532) · Fitxes d'àmbit ────────────────────── */

/* Viuen a la secció 'mur' amb l'àmbit, l'estat i les dades al payload
   (publicacioUniversal.js); el mercat, a la seua secció. */
const DADES_VEHICLE = Object.freeze({ modalitat: 'oferisc_places', lloc_eixida: TORRE, lloc_arribada: 'Alcoi', data_eixida: '2026-11-03', places: 3 });
const C1 = dePublicacio({
  id: 'c1', title: 'Cotxe a Alcoi', ambit: 'vehicle', estat: 'disponible', dades: DADES_VEHICLE, town_name: TORRE, created_at: iso(local(2026, 11, 1, 8))
});
const C2 = dePublicacio({
  id: 'c2', title: 'Cotxe a Xixona', ambit: 'vehicle', estat: 'reservat', dades: { ...DADES_VEHICLE, lloc_arribada: 'Xixona' }, created_at: iso(local(2026, 10, 20, 8))
});
const T1 = dePublicacio({ id: 't1', title: 'Busquem fuster', ambit: 'treball', estat: 'zzz', dades: { modalitat: 'oferta_feina', ofici: 'Fusteria' } });
const H1 = dePublicacio({ id: 'h1', title: 'Casa al carrer Major', ambit: 'habitatge', estat: 'tancat', dades: { modalitat: 'lloguer', preu: '400 €' } });
const MP = deProducte({ id: 'mp', title: 'Mel del flux', ambit: 'mercat', estat: 'complet', dades: { preu: '8 €' } });
const AMB_FITXES = Object.freeze([...ENTRADES, C1, C2, T1, H1, MP]);
const senseData = (e) => facetesDeLEntrada(e, OPCIONS).filter((id) => !id.startsWith('data:'));

describe('IDEA-61 · la faceta Estat de les fitxes d’àmbit', () => {
  test('ESTATS_FACETA són els ESTATS del contracte, en el seu ordre, amb la clau i la reserva idèntiques', () => {
    expect(ESTATS_FACETA.map((e) => e.id)).toEqual([...ESTATS]);
    for (const e of ESTATS_FACETA) expect([e.clau, e.text], e.id).toEqual([`ambit.estat.${e.id}`, RESERVES_I18N[`ambit.estat.${e.id}`]]);
    expect(ESTATS_FACETA.map((e) => e.text)).toEqual(['Disponible', 'Reservat', 'Complet', 'Tancat']);
  });

  test('una fitxa d’àmbit porta tipus:<ambit> i estat:<estat> darrere del tipus; un estat desconegut és «disponible»; una entrada de sempre, cap estat', () => {
    expect(senseData(C1)).toEqual(['tipus:vehicle', 'estat:disponible', 'poble:la-torre-de-les-macanes']);
    expect(senseData(C2)).toEqual(['tipus:vehicle', 'estat:reservat']);
    expect(senseData(T1)).toEqual(['tipus:treball', 'estat:disponible']);
    expect(senseData(H1)).toEqual(['tipus:habitatge', 'estat:tancat']);
    expect(senseData(MP)).toEqual(['tipus:mercat', 'estat:complet']);
    for (const e of ENTRADES) expect(facetesDeLEntrada(e, OPCIONS).some((id) => id.startsWith('estat:')), e.clau).toBe(false);
    /* Una entrada que no ve de l'índex i porta un `ambit` que no és del vocabulari tampoc. */
    expect(facetesDeLEntrada({ clau: 'publicacions:x', tipus: 'publicacions', titol: 'X', ambit: 'cotxe', estat: 'reservat', data: 0 }, OPCIONS)).toEqual(['tipus:publicacions']);
    expect(facetesDeLEntrada({ clau: 'publicacions:y', tipus: 'publicacions', titol: 'Y', ambit: 'mur', estat: 'reservat', data: 0 }, OPCIONS)).toEqual(['tipus:publicacions']);
  });

  test('el grup Estat, entre Tipus i Pobles, en l’ordre d’ESTATS_FACETA i només amb els estats que tenen recompte', () => {
    const grups = grupsDeFacetes(AMB_FITXES, OPCIONS);
    expect(grups.map((g) => g.id)).toEqual(['tipus', 'estat', 'pobles', 'data']);
    const estat = grups[1];
    expect([estat.clau, estat.text]).toEqual(['section.search.faceta.estat', 'Estat']);
    expect(estat.options).toEqual([
      { id: 'estat:disponible', clau: 'ambit.estat.disponible', text: 'Disponible', count: 2 },
      { id: 'estat:reservat', clau: 'ambit.estat.reservat', text: 'Reservat', count: 1 },
      { id: 'estat:complet', clau: 'ambit.estat.complet', text: 'Complet', count: 1 },
      { id: 'estat:tancat', clau: 'ambit.estat.tancat', text: 'Tancat', count: 1 }
    ]);
    /* La faceta de tipus naix sola de TIPUS_CERCA: les tres verticals, al seu lloc, darrere del Mercat. */
    expect(grups[0].options.map((o) => o.id)).toEqual([
      'tipus:persones', 'tipus:pobles', 'tipus:publicacions', 'tipus:agenda', 'tipus:mercat', 'tipus:vehicle', 'tipus:treball', 'tipus:habitatge', 'tipus:notes'
    ]);
    expect(grups[0].options.find((o) => o.id === 'tipus:vehicle')).toEqual({ id: 'tipus:vehicle', clau: 'section.search.tipus.vehicle', text: 'Compartir cotxe', count: 2 });
    /* Un sol estat per element, i el recompte quadra. */
    const items = itemsDeLEspai(AMB_FITXES, OPCIONS);
    for (const item of items) expect(item.categoryIds.filter((id) => id.startsWith('estat:')).length, item.id).toBeLessThanOrEqual(1);
    for (const opcio of estat.options) expect(items.filter((item) => item.categoryIds.includes(opcio.id)), opcio.id).toHaveLength(opcio.count);
    /* Només amb un estat: el grup hi és igualment, amb una sola opció. */
    expect(grupsDeFacetes([C2], OPCIONS).find((g) => g.id === 'estat').options.map((o) => [o.id, o.count])).toEqual([['estat:reservat', 1]]);
  });

  test('ambEtiquetes tradueix l’Estat i els seus estats per la seua clau; sense traductor, el text en valencià', () => {
    const t = vi.fn((clau, reserva) => (clau === 'ambit.estat.reservat' ? 'Reservado' : clau === 'section.search.faceta.estat' ? 'Estado' : reserva));
    const amb = ambEtiquetes(grupsDeFacetes([C1, C2], OPCIONS), t);
    expect(amb.map((g) => g.label)).toEqual(['Tipus', 'Estado', 'Pobles', 'Data']);
    expect(amb[1].options.map((o) => o.label)).toEqual(['Disponible', 'Reservado']);
    expect(amb[0].options.map((o) => o.label)).toEqual(['Compartir cotxe']);
    expect(ambEtiquetes(grupsDeFacetes([C1, C2], OPCIONS))[1].options.map((o) => o.label)).toEqual(['Disponible', 'Reservat']);
  });
});

/* Les 24 h d'un dia local: cap hora del mateix dia cau a «futur». */
test('cap hora del dia local d’avui és futur', () => {
  for (let h = 0; h < 24; h += 1) expect(trams(local(2026, 11, 1, h, 30)), `${h}`).toContain('hui');
  expect(trams(local(2026, 11, 1, 0, 0) + 24 * HORA)).toEqual(['futur']);
});
