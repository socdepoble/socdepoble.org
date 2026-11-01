// @vitest-environment node
/* Lector de notícies · les notícies germanes (IDEA-30; B6-C de la marató 261101_2143), nucli pur.
   Dades sintètiques (fonts inventades, adreces d'example.org) i la llavor sencera del Lector, que
   ha de donar 0 germanes: la vista de llavor no canvia. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { LIMITS_GERMANES, analitzaFeed, germanesDe, indexGermanes } from './index.js';

const DIA = 86400000;
const BASE = Date.UTC(2026, 9, 10, 10, 0, 0);
const iso = (ms) => new Date(ms).toISOString();

let comptador = 0;
/* Un resum sintètic amb la forma del model (nucli/model.js). */
function resum({ id, fontId = 'font-a', titol, resum: text = '', dies = 0, data, enllac } = {}) {
  comptador += 1;
  const clau = id || `r-${comptador}`;
  return {
    id: clau,
    fontId,
    titol,
    enllac: enllac === undefined ? `https://example.org/${fontId}/${clau}` : enllac,
    data: data === undefined ? iso(BASE + dies * DIA) : data,
    autor: null,
    resum: text,
    imatge: null
  };
}

const ids = (germanes) => germanes.map((g) => g.resum.id);
const germanesEntre = (article, llista, opcions) => germanesDe(article, indexGermanes(llista), opcions);

/* El cas del Mestre (sintètic): dues veus sobre el mateix fet, amb paraules distintes. */
const MACRO = resum({
  id: 'macro', fontId: 'veu-vall', titol: 'La macrourbanització del pantà de Beniarrés torna al ple',
  resum: 'Els veïns demanen aturar la macrourbanització al costat del pantà.'
});
const ALLEGACIONS = resum({
  id: 'allegacions', fontId: 'colla-terra', titol: 'Al·legacions contra la urbanització del pantà de Beniarrés',
  resum: 'La colla presenta al·legacions: la macrourbanització amenaça el pantà.', dies: 2
});

describe('la regla', () => {
  test('el cas del pantà: dues fonts, dos termes del títol en comú → germanes, en les dues direccions', () => {
    const [germana] = germanesEntre(MACRO, [MACRO, ALLEGACIONS]);
    expect(germana.resum).toBe(ALLEGACIONS);
    expect(germana.termes).toEqual(['panta', 'beniarres']);
    /* 2 × 2 del títol + 3 de títol i resum (pantà, Beniarrés i macrourbanització). */
    expect(germana.puntuacio).toBe(7);
    expect(ids(germanesEntre(ALLEGACIONS, [MACRO, ALLEGACIONS]))).toEqual(['macro']);
  });

  test('la mateixa font, el mateix id o el mateix enllaç → cap: no és una altra veu', () => {
    const mateixaFont = { ...ALLEGACIONS, fontId: MACRO.fontId };
    expect(germanesEntre(MACRO, [MACRO, mateixaFont])).toEqual([]);
    expect(germanesEntre(MACRO, [MACRO, { ...MACRO, fontId: 'colla-terra' }])).toEqual([]);
    /* La mateixa peça servida per una altra font (l'àncora no compta). */
    const mateixEnllac = { ...ALLEGACIONS, enllac: `${MACRO.enllac}#comentaris` };
    expect(germanesEntre(MACRO, [MACRO, mateixEnllac])).toEqual([]);
    /* Dues fonts que servixen el mateix enllaç: una sola germana, la de més puntuació. */
    const copia = { ...ALLEGACIONS, id: 'copia', fontId: 'tercera', titol: 'El pantà de Beniarrés', resum: '' };
    expect(ids(germanesEntre(MACRO, [MACRO, ALLEGACIONS, copia]))).toEqual(['allegacions']);
    /* El mateix id encara que l'article no siga a l'índex (l'índex ja descarta els ids repetits). */
    expect(germanesEntre(MACRO, [{ ...ALLEGACIONS, id: MACRO.id }])).toEqual([]);
  });

  test('els paràmetres de seguiment (utm_*, fbclid, gclid) no fan una altra peça; la resta de la consulta, sí', () => {
    const peca = 'https://example.org/noticia/panta?id=7';
    const a = { ...MACRO, enllac: peca };
    for (const enllac of [`${peca}&utm_source=rss&utm_medium=feed`, `${peca}&UTM_Campaign=x#dalt`, `${peca}&fbclid=abc`,
      `${peca}&gclid=abc`]) {
      expect(germanesEntre(a, [a, { ...ALLEGACIONS, enllac }]), enllac).toEqual([]);
    }
    /* Escrita d'una altra manera, la mateixa consulta (els espais, %20 o +). */
    const ambEspai = { ...MACRO, enllac: 'https://example.org/cerca?q=pant%C3%A0%20nou' };
    expect(germanesEntre(ambEspai, [ambEspai, { ...ALLEGACIONS, enllac: 'https://example.org/cerca?q=pant%C3%A0+nou&utm_id=1' }]))
      .toEqual([]);
    /* Una altra peça del mateix lloc (un altre id) sí que és una altra veu. */
    expect(ids(germanesEntre(a, [a, { ...ALLEGACIONS, enllac: 'https://example.org/noticia/panta?id=8' }]))).toEqual(['allegacions']);
    /* Un enllaç que no és una adreça absoluta es compara tal qual, sense el fragment. */
    const relatiu = { ...MACRO, enllac: 'noticia/panta' };
    expect(germanesEntre(relatiu, [relatiu, { ...ALLEGACIONS, enllac: 'noticia/panta#x' }])).toEqual([]);
  });

  test('un sol terme del títol en comú → cap (ni amb el resum ple de coincidències)', () => {
    const a = resum({ id: 'a', fontId: 'f1', titol: 'Escola de pilota: tornen els entrenaments', resum: 'Escola, pilota i trinquet.' });
    const b = resum({ id: 'b', fontId: 'f2', titol: 'Obertes les inscripcions de l’escola de tardor', resum: 'Escola de pilota i trinquet.' });
    expect(germanesEntre(a, [a, b])).toEqual([]);
  });

  test('accents, majúscules i ela geminada (l·l, ŀl, l.l) es pleguen', () => {
    const a = resum({ id: 'a', fontId: 'f1', titol: 'AL·LEGACIONS AL PANTÀ' });
    for (const titol of ['Allegacions sobre el panta', 'Les aŀlegacions del pantà', 'Al.legacions: el Pantà']) {
      const b = resum({ id: 'b', fontId: 'f2', titol });
      expect(ids(germanesEntre(a, [a, b])), titol).toEqual(['b']);
    }
    /* Sense plegar, «al» i «legacions» no serien el terme: un altre mot no casa. */
    const c = resum({ id: 'c', fontId: 'f2', titol: 'Legacions al pantà' });
    expect(germanesEntre(a, [a, c])).toEqual([]);
  });

  test('els mots buits i els números sols no compten com a termes', () => {
    const a = resum({ id: 'a', fontId: 'f1', titol: 'Pressupost 2026 sobre aquesta plaça' });
    const b = resum({ id: 'b', fontId: 'f2', titol: 'Festes 2026 sobre aquesta plaça' });
    const c = resum({ id: 'c', fontId: 'f3', titol: 'Pressupost de la plaça' });
    expect(ids(germanesEntre(a, [a, b, c]))).toEqual(['c']);
  });

  test('la finestra de 30 dies, si les dues dates són vàlides', () => {
    const dins = { ...ALLEGACIONS, data: iso(BASE + 30 * DIA) };
    const fora = { ...ALLEGACIONS, data: iso(BASE + 30 * DIA + 60000) };
    const enrere = { ...ALLEGACIONS, data: iso(BASE - 31 * DIA) };
    const senseData = { ...ALLEGACIONS, data: null };
    const malament = { ...ALLEGACIONS, data: '31 de febrer' };
    expect(ids(germanesEntre(MACRO, [MACRO, dins]))).toEqual(['allegacions']);
    expect(germanesEntre(MACRO, [MACRO, fora])).toEqual([]);
    expect(germanesEntre(MACRO, [MACRO, enrere])).toEqual([]);
    expect(ids(germanesEntre(MACRO, [MACRO, senseData]))).toEqual(['allegacions']);
    expect(ids(germanesEntre(MACRO, [MACRO, malament]))).toEqual(['allegacions']);
    expect(ids(germanesEntre({ ...MACRO, data: null }, [MACRO, fora]))).toEqual(['allegacions']);
  });

  test('un terme ubic (en més del 20 % dels resums, amb 10 o més) no compta', () => {
    const a = resum({ id: 'a', fontId: 'f1', titol: 'Regadiu nou a la séquia mare' });
    const b = resum({ id: 'b', fontId: 'f2', titol: 'Obres de regadiu a la séquia' });
    const c = resum({ id: 'c', fontId: 'f3', titol: 'El regadiu de la vall' });
    const farciment = (n) => Array.from({ length: n }, (_, i) => resum({ id: `z${i}`, fontId: 'f9', titol: `Notícia ${['una', 'dues', 'tres', 'quatre', 'cinc', 'sis', 'set'][i]} sense relació` }));
    /* 10 resums: «regadiu» és a 3 (30 %) i ja no compta; només queda «sequia» → cap germana. */
    const deu = [a, b, c, ...farciment(7)];
    expect(indexGermanes(deu).ubics.has('regadiu')).toBe(true);
    expect(germanesEntre(a, deu)).toEqual([]);
    /* 9 resums: per davall del mínim, la regla no s'aplica i són germanes. */
    const nou = [a, b, c, ...farciment(6)];
    expect(indexGermanes(nou).ubics.size).toBe(0);
    expect(ids(germanesEntre(a, nou))).toEqual(['b']);
  });

  test('el llindar és «més del 20 %»: just el 20 % encara compta', () => {
    const farciment = (n) => Array.from({ length: n }, (_, i) => resum({ id: `y${i}`, fontId: 'f9', titol: `Rètol ${'abcdefghijklm'[i]}xxxx` }));
    const a = resum({ id: 'a', fontId: 'f1', titol: 'Regadiu nou a la séquia mare' });
    const b = resum({ id: 'b', fontId: 'f2', titol: 'Obres de regadiu a la séquia' });
    const c = resum({ id: 'c', fontId: 'f3', titol: 'Regadiu i séquia de la vall' });
    /* 2 de 10 (20 %): «regadiu» i «sequia» compten i són germanes. */
    const deu = [a, b, ...farciment(8)];
    expect(indexGermanes(deu).ubics.has('regadiu')).toBe(false);
    expect(ids(germanesEntre(a, deu))).toEqual(['b']);
    /* 3 de 15 (20 %): també; 3 de 14 (21 %), ja no. */
    expect(ids(germanesEntre(a, [a, b, c, ...farciment(12)]))).toEqual(['b', 'c']);
    expect(germanesEntre(a, [a, b, c, ...farciment(11)])).toEqual([]);
  });

  test('un terme ubic tampoc no puja la puntuació pel resum', () => {
    /* «aigua» és als 10 resums (ubic); al títol no hi és, i al resum de l'article i de la germana, sí. */
    const a = resum({ id: 'a', fontId: 'f1', titol: 'Pantà de Beniarrés ple', resum: 'Aigua per a tot l’estiu.' });
    const b = resum({ id: 'b', fontId: 'f2', titol: 'El pantà de Beniarrés', resum: 'Aigua i reg.' });
    const farciment = Array.from({ length: 8 }, (_, i) => resum({ id: `w${i}`, fontId: 'f9', titol: `Rètol ${i}`, resum: 'Aigua.' }));
    const llista = [a, b, ...farciment];
    expect(indexGermanes(llista).ubics.has('aigua')).toBe(true);
    /* 2 × 2 del títol + 2 de títol i resum (pantà i Beniarrés; «aigua» no). */
    expect(germanesEntre(a, llista).map((g) => g.puntuacio)).toEqual([6]);
  });

  test('el sostre de termes: només els 30 primers del títol (i 60 de títol i resum) compten', () => {
    const farcit = Array.from({ length: 30 }, (_, i) => `mot${String.fromCharCode(97 + (i % 26))}${i}`).join(' ');
    /* Els termes comuns venen darrere dels 30 primers: no compten. */
    const llarg = resum({ id: 'llarg', fontId: 'f1', titol: `${farcit} pantà Beniarrés` });
    const curt = resum({ id: 'curt', fontId: 'f2', titol: 'Pantà de Beniarrés' });
    expect(germanesEntre(llarg, [llarg, curt])).toEqual([]);
    expect(germanesEntre(curt, [llarg, curt])).toEqual([]);
    /* Amb un terme de farciment menys (29 + 2 = 31), «panta» entra i «beniarres» no: un sol terme, cap. */
    const quasi = resum({ id: 'quasi', fontId: 'f1', titol: `${farcit.split(' ').slice(1).join(' ')} pantà Beniarrés` });
    expect(germanesEntre(quasi, [quasi, curt])).toEqual([]);
    /* Amb 28 (28 + 2 = 30), tots dos: germanes. */
    const just = resum({ id: 'just', fontId: 'f1', titol: `${farcit.split(' ').slice(2).join(' ')} pantà Beniarrés` });
    expect(ids(germanesEntre(just, [just, curt]))).toEqual(['curt']);
  });

  test('les fonts admeses: un Set o una llista; una altra cosa no n’admet cap', () => {
    const tercera = { ...ALLEGACIONS, id: 'tercera', fontId: 'tercera', enllac: 'https://example.org/tercera/x' };
    const llista = [MACRO, ALLEGACIONS, tercera];
    expect(ids(germanesEntre(MACRO, llista)).sort()).toEqual(['allegacions', 'tercera']);
    expect(ids(germanesEntre(MACRO, llista, { fonts: new Set(['tercera']) }))).toEqual(['tercera']);
    expect(ids(germanesEntre(MACRO, llista, { fonts: ['colla-terra'] }))).toEqual(['allegacions']);
    expect(germanesEntre(MACRO, llista, { fonts: 'colla-terra' })).toEqual([]);
    expect(germanesEntre(MACRO, llista, { fonts: [] })).toEqual([]);
  });
});

describe('l’ordre i el sostre', () => {
  /* Set candidates de fonts distintes. Puntuacions: c2 12; c1, c3, c4, c5 i c6 9 (empat: mana la data, i
     entre c4 i c5, de la mateixa data, l'id); c7 6. */
  const article = resum({ id: 'art', fontId: 'f0', titol: 'Incendi forestal a la serra de Mariola', resum: 'Bombers i voluntaris a la serra.' });
  const candidates = [
    resum({ id: 'c1', fontId: 'f1', titol: 'Incendi forestal a Mariola', dies: -1 }),
    resum({ id: 'c2', fontId: 'f2', titol: 'Incendi forestal a la serra de Mariola controlat', dies: -2 }),
    resum({ id: 'c3', fontId: 'f3', titol: 'Incendi a la serra', resum: 'Bombers i voluntaris de Mariola.', dies: -3 }),
    resum({ id: 'c4', fontId: 'f4', titol: 'Incendi forestal a Mariola', dies: 0 }),
    resum({ id: 'c5', fontId: 'f5', titol: 'Incendi forestal a Mariola', dies: 0 }),
    resum({ id: 'c6', fontId: 'f6', titol: 'Serra de Mariola: incendi', dies: -5 }),
    resum({ id: 'c7', fontId: 'f7', titol: 'Forestal Mariola', dies: -6 })
  ];

  test('per puntuació, després la data (la més nova primer) i després l’id; com a molt 5', () => {
    const germanes = germanesEntre(article, [article, ...candidates]);
    expect(LIMITS_GERMANES.maxim).toBe(5);
    expect(germanes.map((g) => [g.resum.id, g.puntuacio])).toEqual([
      ['c2', 12], ['c4', 9], ['c5', 9], ['c1', 9], ['c3', 9]
    ]);
    expect(Object.isFrozen(germanes[0])).toBe(true);
  });

  test('determinista: l’ordre d’entrada no canvia res; opcions.maxim retalla (de 1 a 20)', () => {
    const a = germanesEntre(article, [article, ...candidates]);
    const b = germanesEntre(article, [...candidates].reverse().concat(article));
    expect(ids(b)).toEqual(ids(a));
    expect(ids(germanesEntre(article, candidates, { maxim: 2 }))).toEqual(['c2', 'c4']);
    expect(germanesEntre(article, candidates, { maxim: 99 })).toHaveLength(7);
    expect(germanesEntre(article, candidates, { maxim: 0 })).toHaveLength(5);
    expect(germanesEntre(article, candidates, { maxim: 1.5 })).toHaveLength(5);
  });
});

describe('mai llança', () => {
  test('entrades invàlides o estranyes → [] o l’índex buit', () => {
    const index = indexGermanes([MACRO, ALLEGACIONS]);
    for (const article of [null, undefined, 42, 'text', [], {}, { id: 'x', fontId: 'f', titol: '' }, { ...MACRO, id: 7 }]) {
      expect(germanesDe(article, index), String(article)).toEqual([]);
    }
    for (const dolent of [null, undefined, {}, { docs: 'no' }, 3]) expect(germanesDe(MACRO, dolent)).toEqual([]);
    expect(germanesDe(MACRO, index, null)).toEqual(germanesDe(MACRO, index));
    for (const dolenta of [null, undefined, 'x', 3, {}]) expect(indexGermanes(dolenta).docs).toEqual([]);
    expect(indexGermanes([null, 1, 'x', {}, MACRO, { ...MACRO }]).docs.map((d) => d.resum.id)).toEqual(['macro']);
  });

  test('un objecte que llança en llegir-lo no fa caure res', () => {
    const trampa = new Proxy({}, { get() { throw new Error('trampa'); } });
    expect(() => indexGermanes([trampa, MACRO])).not.toThrow();
    expect(indexGermanes([trampa, MACRO]).docs).toEqual([]);
    expect(germanesDe(trampa, indexGermanes([MACRO, ALLEGACIONS]))).toEqual([]);
    expect(germanesDe(MACRO, indexGermanes([MACRO, ALLEGACIONS]), trampa)).toEqual([]);
  });

  test('una llista de 600: es queden els 500 més nous i les germanes respecten el sostre', () => {
    const llista = Array.from({ length: 600 }, (_, i) => resum({
      id: `m${String(i).padStart(3, '0')}`, fontId: `f${i % 7}`, titol: 'Concert de la banda al pantà de Beniarrés', dies: -i / 100
    }));
    const index = indexGermanes(llista);
    expect(index.docs).toHaveLength(LIMITS_GERMANES.candidats);
    expect(index.docs.at(-1).resum.id).toBe('m499');
    /* Tots els termes són a tots els resums (ubics): cap no compta i cap germana. */
    expect(germanesDe(llista[0], index)).toEqual([]);
    const article = resum({ id: 'nou', fontId: 'fx', titol: 'Banda i concert al pantà' });
    /* 9 resums (per davall del mínim d'ubiqüitat): 8 germanes possibles, 5 de tornada. */
    const germanes = germanesDe(article, indexGermanes([article, ...llista.slice(0, 8)]));
    expect(germanes).toHaveLength(5);
  });
});

describe('la llavor sencera del Lector', () => {
  const DIR = path.join(process.cwd(), 'src/apps/lector/llavor');
  const articles = readdirSync(DIR).filter((f) => f.endsWith('.xml')).sort()
    .flatMap((f) => analitzaFeed(readFileSync(path.join(DIR, f), 'utf8'), { fontId: f.replace('.xml', '') }).articles);

  test('16 notícies de 5 fonts i 0 germanes: la vista de llavor no canvia', () => {
    expect(articles).toHaveLength(16);
    expect(new Set(articles.map((a) => a.fontId)).size).toBe(5);
    const index = indexGermanes(articles);
    expect(articles.flatMap((article) => germanesDe(article, index))).toEqual([]);
  });

  test('sonda: la llavor té parells de fonts distintes amb UN terme del títol en comú (la regla de 2 mossega)', () => {
    const ambEscola = articles.filter((a) => /escola/i.test(a.titol));
    const ambAvis = articles.filter((a) => /^Avís/.test(a.titol));
    expect(new Set(ambEscola.map((a) => a.fontId)).size).toBe(2);
    expect(new Set(ambAvis.map((a) => a.fontId)).size).toBe(2);
  });
});
