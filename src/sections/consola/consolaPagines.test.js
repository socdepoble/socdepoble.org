import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from '../text/pageContent.js';
import {
  CLAU_VISTES, CODIS_VIGILANCIA, ETIQUETES, IDS_PAGINES, LLINDAR_REBUTS_RANCIS_DIES, LLINDAR_SATURACIO, RUTA_CONSOLA,
  avisosDeVigilancia, dataUltimaOperacio, diesDes, etiquetesPagina, etiquetesPols, llegixVistes, marcaVista,
  mesuresPagina, paginaConsola, paginesConsola, rebutsRancis, resumPagina, segmentPagina, signaturaPagina, ultimRebut
} from './consolaPagines.js';

describe('catàleg de pàgines de la Consola', () => {
  test('nou pàgines en l’ordre de les pestanyes d’Emowe, cadascuna amb ruta pròpia', () => {
    expect(IDS_PAGINES).toEqual(['pols', 'explorador', 'fluxos', 'calendari', 'inventari', 'entrades', 'agents', 'actors', 'salut']);
    expect(paginesConsola().map((p) => p.ruta)).toEqual(IDS_PAGINES.map((id) => `${RUTA_CONSOLA}/${id}`));
  });

  test('cada pàgina té títol i entradeta; PAGE_COPY mana quan porta la pàgina', () => {
    for (const p of paginesConsola()) {
      expect(p.title, `falta el títol de ${p.id}`).not.toBe(p.id);
      expect(p.lead.length, `falta l'entradeta de ${p.id}`).toBeGreaterThan(20);
      const copy = PAGE_COPY.consola.pagines.find((c) => c.id === p.id);
      if (copy) expect(p.title).toBe(copy.title);
    }
  });

  test('cada pàgina té un H2 d’introducció curt, diferent del títol i sense punt final', () => {
    const subtitols = paginesConsola().map((p) => p.subtitle);
    for (const [i, s] of subtitols.entries()) {
      const { id, title } = paginesConsola()[i];
      expect(typeof s, `falta el subtítol de ${id}`).toBe('string');
      expect(s.length).toBeGreaterThan(10);
      expect(s.length).toBeLessThanOrEqual(60);
      expect(s).not.toMatch(/[.:;]$/);
      expect(s).not.toBe(title);
    }
    expect(new Set(subtitols).size).toBe(IDS_PAGINES.length);
  });

  test('una pàgina desconeguda no existix', () => {
    expect(paginaConsola('pestanyes')).toBeNull();
  });
});

describe('segmentPagina', () => {
  test.each([
    [undefined, ''], ['', ''], ['/', ''], ['calendari', 'calendari'], ['/calendari/', 'calendari'],
    ['actors', 'actors'], ['desconeguda', null], ['calendari/extra', null]
  ])('%s → %s', (comodi, esperat) => {
    expect(segmentPagina(comodi)).toBe(esperat);
  });
});

describe('resumPagina', () => {
  const mapa = {
    nodes: [
      { id: 'skill:a', tipus: 'skill' }, { id: 'skill:b', tipus: 'skill' }, { id: 'ruta:r', tipus: 'ruta' },
      { id: 'script:s', tipus: 'script' }, { id: 'agent:claude-code', tipus: 'agent', atributs: {} },
      { id: 'hook:claude:PreToolUse', tipus: 'hook', atributs: {} }
    ],
    arestes: [
      { de: 'skill:a', a: 'skill:b', tipus: 'crida', confianca: 'inferit' },
      { de: 'agent:claude-code', a: 'hook:claude:PreToolUse', tipus: 'dispara', confianca: 'declarat' },
      { de: 'ruta:r', a: 'skill:a', tipus: 'governa', confianca: 'declarat' }
    ],
    tasques: [{ id: 'v', estat: 'viu', llancador: { tipus: 'launchd' } }, { id: 'm', estat: 'mort' }, { id: 'd', estat: 'desconegut' }],
    avisos: [{ node: 'skill:a', severitat: 'alta' }, { node: 'skill:b', severitat: 'baixa' }],
    salut: [{}, {}]
  };
  const ambMapa = { mapa, estatMapa: 'ready' };

  test('resumix dades reals del Mapa', () => {
    expect(resumPagina('explorador', ambMapa)).toBe('6 nodes · 3 arestes');
    expect(resumPagina('calendari', ambMapa)).toBe('3 tasques · 1 vives · 1 mortes');
    expect(resumPagina('inventari', ambMapa)).toBe('2 skills al Mapa');
    expect(resumPagina('entrades', ambMapa)).toBe('2 skills · 1 rutes documentals');
    expect(resumPagina('salut', ambMapa)).toBe('2 avisos (1 alts) · 2 mètriques');
  });

  test('les vistes noves també resumixen dades, no promeses', () => {
    expect(resumPagina('fluxos', ambMapa)).toBe('0 cadenes declarades · 1 suggeriments de la prosa');
    expect(resumPagina('agents', ambMapa)).toBe('0 agents atòmics · 1 arnesos que conversen');
    expect(resumPagina('actors', ambMapa)).toBe('1 arnesos · 1 candats · 1 tasques programades');
  });

  test('sense Mapa diu per què, mai una xifra', () => {
    expect(resumPagina('explorador', { mapa: null, estatMapa: 'loading' })).toBe('Llegint el Mapa…');
    expect(resumPagina('salut', { mapa: null, estatMapa: 'error' })).toBe('No s’ha pogut llegir el Mapa');
    expect(resumPagina('calendari', { mapa: null, estatMapa: 'estrany' })).toBe('Mapa no disponible en este entorn');
    for (const id of ['fluxos', 'agents', 'actors']) {
      expect(resumPagina(id, { mapa: null, estatMapa: 'absent' })).toBe('Mapa no disponible en este entorn');
    }
  });

  test('el pols llig consola.json', () => {
    const dades = {
      consums: [{}, {}], rebuts: [{}],
      skills: [
        { alDisc: true, alManifest: true, core: true },
        { alDisc: true, alManifest: false, core: false }
      ]
    };
    expect(resumPagina('pols', { dades, estatDades: 'ready' })).toBe('2 registres de consum · 1 rebuts · 2 skills (1 orfes)');
    expect(resumPagina('pols', { dades: null, estatDades: 'absent' })).toBe('Dades no disponibles en este entorn');
  });

  test('una pàgina desconeguda no té resum', () => {
    expect(resumPagina('pestanyes', ambMapa)).toBe('');
  });
});

/* T2 (ordre del Mestre, 260930) · Les mètriques són les parts del resum:
   la targeta les pinta en h5 i el resum, unit amb « · », continua sent la
   signatura de «Canvis nous» que hi ha guardada a cada navegador. */
describe('mesuresPagina · les parts del resum', () => {
  const mapa = {
    nodes: [
      { id: 'skill:a', tipus: 'skill' }, { id: 'skill:b', tipus: 'skill' }, { id: 'ruta:r', tipus: 'ruta' },
      { id: 'agent:claude-code', tipus: 'agent', atributs: {} }
    ],
    arestes: [{ de: 'skill:a', a: 'skill:b', tipus: 'crida', confianca: 'inferit' }],
    tasques: [{ id: 'v', estat: 'viu', llancador: { tipus: 'launchd' } }, { id: 'm', estat: 'mort' }],
    avisos: [{ node: 'skill:a', severitat: 'alta' }],
    salut: [{}]
  };
  const dades = { consums: [{}], rebuts: [{}, {}], skills: [{ alDisc: true, alManifest: false, core: false }] };
  const fonts = { mapa, estatMapa: 'ready', dades, estatDades: 'ready' };

  test('cada pàgina torna una llista de mètriques, una xifra amb el que compta', () => {
    expect(mesuresPagina('pols', fonts)).toEqual(['1 registres de consum', '2 rebuts', '1 skills (1 orfes)']);
    expect(mesuresPagina('explorador', fonts)).toEqual(['4 nodes', '1 arestes']);
    expect(mesuresPagina('calendari', fonts)).toEqual(['2 tasques', '1 vives', '1 mortes']);
    expect(mesuresPagina('inventari', fonts)).toEqual(['2 skills al Mapa']);
    expect(mesuresPagina('entrades', fonts)).toEqual(['2 skills', '1 rutes documentals']);
    expect(mesuresPagina('salut', fonts)).toEqual(['1 avisos (1 alts)', '1 mètriques']);
    expect(mesuresPagina('agents', fonts)).toEqual(['0 agents atòmics', '1 arnesos que conversen']);
  });

  test('el resum és exactament les mètriques unides amb « · »: la signatura no canvia', () => {
    for (const id of IDS_PAGINES) {
      expect(resumPagina(id, fonts), id).toBe(mesuresPagina(id, fonts).join(' · '));
      expect(signaturaPagina(id, fonts), id).toBe(mesuresPagina(id, fonts).join(' · '));
    }
  });

  test('sense font no hi ha mètriques (el resum diu per què), i una pàgina desconeguda tampoc en té', () => {
    for (const id of IDS_PAGINES) {
      expect(mesuresPagina(id, { estatDades: 'loading', estatMapa: 'loading' }), id).toBeNull();
    }
    expect(mesuresPagina('pestanyes', fonts)).toBeNull();
    expect(mesuresPagina('explorador')).toBeNull();
  });
});

/* ── Etiquetes d'un colp d'ull ─────────────────────────────────────────── */

const MAPA_BUIT = Object.freeze({ nodes: [], arestes: [], tasques: [], avisos: [], salut: [] });
const mapaAmb = (extra) => ({ ...MAPA_BUIT, ...extra });
const ambMapa = (mapa) => ({ mapa, estatMapa: 'ready' });
const textos = (id, fonts, vist) => etiquetesPagina(id, fonts, vist).map((e) => e.text);
const avis = (node, codi, severitat) => ({ node, codi, severitat, evidencia: null });
const skill = (id) => ({ id: `skill:${id}`, tipus: 'skill', atributs: {} });
const DADES = Object.freeze({
  consums: [], rebuts: [], credits: null, segell: null, immunitari: { operacions: 0 },
  skills: [{ nom: 'a', alDisc: true, alManifest: true, core: true }]
});

describe('etiquetesPagina · de quina font parla i quan no n’hi ha', () => {
  test('cada etiqueta porta el to d’Insignia que li toca', () => {
    expect(ETIQUETES).toEqual({
      reparar: { text: 'Cal reparar', to: 'error' },
      important: { text: 'Important', to: 'avis' },
      nou: { text: 'Canvis nous', to: 'info' },
      senseFont: { text: 'Sense font', to: 'neutre' }
    });
  });

  test('sense font: «Sense font»; llegint, res; lectura fallida, «Cal reparar»', () => {
    for (const id of IDS_PAGINES) {
      const clau = id === 'pols' ? 'estatDades' : 'estatMapa';
      expect(textos(id, { [clau]: 'absent' }), id).toEqual(['Sense font']);
      expect(textos(id, { [clau]: 'loading' }), id).toEqual([]);
      expect(textos(id, { [clau]: 'error' }), id).toEqual(['Cal reparar']);
      expect(textos(id, {}), id).toEqual(['Sense font']);
    }
  });

  test('un Mapa net no porta cap etiqueta: no hi ha base per a dir res', () => {
    for (const id of IDS_PAGINES.filter((p) => p !== 'pols')) {
      expect(textos(id, ambMapa(MAPA_BUIT)), id).toEqual([]);
    }
    expect(textos('pols', { dades: DADES, estatDades: 'ready' })).toEqual([]);
  });

  test('una lectura fallida que conserva l’última instantània bona també és una fallada', () => {
    expect(textos('salut', { mapa: MAPA_BUIT, estatMapa: 'error' })).toEqual(['Cal reparar']);
  });

  test('una pàgina desconeguda no porta etiquetes', () => {
    expect(etiquetesPagina('pestanyes', ambMapa(MAPA_BUIT))).toEqual([]);
  });
});

describe('etiquetesPagina · regles per pàgina, amb les severitats del Mapa', () => {
  test('pols: skills fora del manifest o esborrades del disc demanen reparar', () => {
    const orfe = { ...DADES, skills: [{ nom: 'o', alDisc: true, alManifest: false, core: false }] };
    const fantasma = { ...DADES, skills: [{ nom: 'f', alDisc: false, alManifest: true, core: false }] };
    expect(textos('pols', { dades: orfe, estatDades: 'ready' })).toEqual(['Cal reparar']);
    expect(textos('pols', { dades: fantasma, estatDades: 'ready' })).toEqual(['Cal reparar']);
  });

  test('pols: la saturació documental és important, només si la font la mesura', () => {
    const satura = { ...DADES, termometria: { artefactesActius: LLINDAR_SATURACIO + 1 } };
    const alLlindar = { ...DADES, termometria: { artefactesActius: LLINDAR_SATURACIO } };
    const brossa = { ...DADES, termometria: { artefactesActius: '999' } };
    expect(textos('pols', { dades: satura, estatDades: 'ready' })).toEqual(['Important']);
    expect(textos('pols', { dades: alLlindar, estatDades: 'ready' })).toEqual([]);
    expect(textos('pols', { dades: brossa, estatDades: 'ready' })).toEqual([]);
  });

  test('explorador: enllaços trencats o orfes, reparar (també els que el Mapa gradua de mitjans); la resta no hi compta', () => {
    expect(textos('explorador', ambMapa(mapaAmb({ avisos: [avis('script:x.mjs', 'script-absent', 'alta')] })))).toEqual(['Cal reparar']);
    expect(textos('explorador', ambMapa(mapaAmb({ avisos: [avis('skill:a', 'skill-fantasma', 'alta')] })))).toEqual(['Cal reparar']);
    expect(textos('explorador', ambMapa(mapaAmb({ avisos: [avis('document:x.md', 'font-absent', 'alta')] })))).toEqual(['Cal reparar']);
    expect(textos('explorador', ambMapa(mapaAmb({ avisos: [avis('skill:a', 'orfe', 'mitjana')] })))).toEqual(['Cal reparar']);
    expect(textos('explorador', ambMapa(mapaAmb({ avisos: [avis('skill:a', 'crida-inexistent', 'mitjana')] })))).toEqual(['Cal reparar']);
    expect(textos('explorador', ambMapa(mapaAmb({ avisos: [avis('skill:a', 'fora-index', 'mitjana')] })))).toEqual([]);
    expect(textos('explorador', ambMapa(mapaAmb({ avisos: [avis('tasca:t', 'tasca-morta', 'alta')] })))).toEqual([]);
  });

  test('fluxos: un lloc on s’escriu i ningú no llig és una cadena a mitges', () => {
    const nodes = [{ id: 'ruta:acta', tipus: 'ruta' }, { id: 'ruta:prompt', tipus: 'ruta' }, { id: 'document:04', tipus: 'document' }];
    const escriu = { de: 'ruta:acta', a: 'document:04', tipus: 'escriu', confianca: 'declarat' };
    const llig = { de: 'ruta:prompt', a: 'document:04', tipus: 'llig', confianca: 'declarat' };
    expect(textos('fluxos', ambMapa(mapaAmb({ nodes, arestes: [escriu] })))).toEqual(['Important']);
    expect(textos('fluxos', ambMapa(mapaAmb({ nodes, arestes: [escriu, llig] })))).toEqual([]);
  });

  test('calendari: una tasca morta demana reparar; una sense llançador o sense declaració, important', () => {
    // No s'anomena `t`: la Porta Consell (L6) llig `t('…')` com una clau d'i18n.
    const ambEstat = (estat) => ({ id: estat, estat, llancador: null, cadencia: null, script: null, font: null });
    expect(textos('calendari', ambMapa(mapaAmb({ tasques: [ambEstat('viu'), ambEstat('mort')] })))).toEqual(['Cal reparar']);
    expect(textos('calendari', ambMapa(mapaAmb({ tasques: [ambEstat('declarat-sense-llancador')] })))).toEqual(['Important']);
    expect(textos('calendari', ambMapa(mapaAmb({ tasques: [ambEstat('llancador-sense-declaracio')] })))).toEqual(['Important']);
    expect(textos('calendari', ambMapa(mapaAmb({ tasques: [ambEstat('viu'), ambEstat('desconegut')] })))).toEqual([]);
  });

  test('inventari: el semàfor de la pàgina, roig a partir de 3 avisos per skill', () => {
    const nodes = [skill('a'), skill('b'), { id: 'tasca:t', tipus: 'tasca', atributs: {} }];
    const tres = ['orfe', 'fora-index', 'pes'].map((c) => avis('skill:a', c, 'baixa'));
    expect(textos('inventari', ambMapa(mapaAmb({ nodes, avisos: tres })))).toEqual(['Cal reparar']);
    expect(textos('inventari', ambMapa(mapaAmb({ nodes, avisos: tres.slice(0, 2) })))).toEqual(['Important']);
    // Els avisos d'una peça que no és skill no pinten l'inventari.
    expect(textos('inventari', ambMapa(mapaAmb({ nodes, avisos: [avis('tasca:t', 'tasca-morta', 'alta')] })))).toEqual([]);
  });

  test('entrades: una skill opaca és important; una que declara què llig, no', () => {
    const nodes = [skill('a'), { id: 'document:d', tipus: 'document', atributs: {} }];
    expect(textos('entrades', ambMapa(mapaAmb({ nodes })))).toEqual(['Important']);
    const arestes = [{ de: 'skill:a', a: 'document:d', tipus: 'llig', confianca: 'declarat' }];
    expect(textos('entrades', ambMapa(mapaAmb({ nodes, arestes })))).toEqual([]);
  });

  test('actors: un vigilant de launchd mort demana reparar; un candat sense consumidor, important', () => {
    const tasca = (estat) => ({ id: 'v', estat, llancador: { tipus: 'launchd' }, cadencia: null, script: null, font: null });
    expect(textos('actors', ambMapa(mapaAmb({ tasques: [tasca('mort')] })))).toEqual(['Cal reparar']);
    expect(textos('actors', ambMapa(mapaAmb({ tasques: [tasca('viu')] })))).toEqual([]);
    const hook = { id: 'hook:ag:Post', tipus: 'hook', atributs: { consumidor_acreditat: false } };
    expect(textos('actors', ambMapa(mapaAmb({ nodes: [hook] })))).toEqual(['Important']);
    const acreditat = { ...hook, atributs: { consumidor_acreditat: true } };
    expect(textos('actors', ambMapa(mapaAmb({ nodes: [acreditat] })))).toEqual([]);
  });

  test('salut: avisos alts, reparar; mitjans, important; baixos, res', () => {
    expect(textos('salut', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'baixa'), avis('b', 'y', 'alta')] })))).toEqual(['Cal reparar']);
    expect(textos('salut', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'mitjana')] })))).toEqual(['Important']);
    expect(textos('salut', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'baixa')] })))).toEqual([]);
  });

  test('agents: cap regla pròpia, el nivell el diuen les pàgines que en mesuren les peces', () => {
    expect(textos('agents', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'alta')] })))).toEqual([]);
  });
});

describe('Canvis nous · signatura del resum', () => {
  const mapa = mapaAmb({ nodes: [skill('a')] });

  test('la signatura és el resum, i només amb la font carregada', () => {
    expect(signaturaPagina('explorador', ambMapa(mapa))).toBe('1 nodes · 0 arestes');
    expect(signaturaPagina('explorador', { mapa: null, estatMapa: 'loading' })).toBeNull();
    expect(signaturaPagina('pols', { dades: DADES, estatDades: 'ready' })).toBe('0 registres de consum · 0 rebuts · 1 skills (0 orfes)');
    expect(signaturaPagina('pestanyes', ambMapa(mapa))).toBeNull();
  });

  test('«Canvis nous» només si el resum és diferent del que es va vore', () => {
    expect(textos('explorador', ambMapa(mapa), '0 nodes · 0 arestes')).toEqual(['Canvis nous']);
    expect(textos('explorador', ambMapa(mapa), '1 nodes · 0 arestes')).toEqual([]);
    expect(textos('explorador', ambMapa(mapa), undefined)).toEqual([]);
    expect(textos('explorador', ambMapa(mapa), null)).toEqual([]);
    // Va després del nivell i no el substituïx.
    const ambAvis = mapaAmb({ nodes: [skill('a')], avisos: [avis('skill:a', 'orfe', 'mitjana')] });
    expect(textos('explorador', ambMapa(ambAvis), 'abans')).toEqual(['Cal reparar', 'Canvis nous']);
    const ambAvisMitja = mapaAmb({ nodes: [skill('a')], tasques: [{ id: 't', estat: 'declarat-sense-llancador' }] });
    expect(textos('calendari', ambMapa(ambAvisMitja), 'abans')).toEqual(['Important', 'Canvis nous']);
    // Sense font no hi ha res a comparar.
    expect(textos('explorador', { mapa: null, estatMapa: 'absent' }, 'abans')).toEqual(['Sense font']);
  });
});

describe('etiquetesPols · les cinc targetes del pols', () => {
  test('sense consola.json totes diuen per què', () => {
    const text = (estat) => Object.values(etiquetesPols(null, estat)).map((l) => l.map((e) => e.text));
    expect(text('absent')).toEqual(Array(5).fill(['Sense font']));
    expect(text('error')).toEqual(Array(5).fill(['Cal reparar']));
    expect(text('loading')).toEqual(Array(5).fill([]));
  });

  test('amb dades, només on hi ha base', () => {
    const text = (dades) => Object.fromEntries(Object.entries(etiquetesPols(dades, 'ready')).map(([k, l]) => [k, l.map((e) => e.text)]));
    expect(text(DADES)).toEqual({ carrega: ['Sense font'], consums: [], credits: ['Sense font'], rebuts: [], skills: [] });
    expect(text({
      ...DADES,
      termometria: { artefactesActius: LLINDAR_SATURACIO + 10 },
      credits: [{ proveidor: 'p', consumit: 1, limit: 2 }],
      skills: [{ nom: 'f', alDisc: false, alManifest: true, core: false }]
    })).toEqual({ carrega: ['Important'], consums: [], credits: [], rebuts: [], skills: ['Cal reparar'] });
  });

  /* T12 (ordre del Mestre, 260930) · un diari de rebuts que fa més d'una
     setmana que no rep res és important: ja no diu què llig l'eixam hui. */
  test('rebuts: «Important» quan l’últim passa de 7 dies; al llindar o sense cap rebut datat, res', () => {
    const ARA = Date.parse('2026-09-30T12:00:00.000Z');
    const DIA = 24 * 60 * 60 * 1000;
    const rebut = (fa) => ({ t: new Date(ARA - fa).toISOString(), peticio: null, protocols: [], fonts: [] });
    const rebuts = (llista) => etiquetesPols({ ...DADES, rebuts: llista }, 'ready', ARA).rebuts.map((e) => e.text);
    expect(LLINDAR_REBUTS_RANCIS_DIES).toBe(7);
    expect(rebuts([rebut(8 * DIA)])).toEqual(['Important']);
    // Mana l'instant, no els dies sencers: 7 dies i un mil·lisegon ja en són més de 7.
    expect(rebuts([rebut(7 * DIA + 1)])).toEqual(['Important']);
    expect(rebuts([rebut(7 * DIA)])).toEqual([]);                      // al llindar, encara no
    // Mana el més recent, no el primer de la llista.
    expect(rebuts([rebut(20 * DIA), rebut(2 * DIA)])).toEqual([]);
    expect(rebuts([])).toEqual([]);
    expect(rebuts([{ t: null, peticio: null, protocols: [], fonts: [] }])).toEqual([]);
    expect(etiquetesPols({ ...DADES, rebuts: [rebut(8 * DIA)] }, 'ready', ARA).rebuts).toEqual([ETIQUETES.important]);
  });
});

describe('T12 · dates de les fonts del pols i codis de vigilància', () => {
  const DIA = 24 * 60 * 60 * 1000;

  test('ultimRebut: el més recent amb data llegible, tal com arriba; sense cap, null', () => {
    expect(ultimRebut([
      { t: '2026-09-19T23:03:39Z' }, { t: '2026-09-20T01:03:39.000Z' }, { t: null }, { t: 'no és una data' }
    ])).toBe('2026-09-20T01:03:39.000Z');
    expect(ultimRebut([{ t: null }])).toBeNull();
    expect(ultimRebut([])).toBeNull();
    expect(ultimRebut(undefined)).toBeNull();
  });

  test('diesDes: dies sencers, mai negatius; una data il·legible no en té', () => {
    const ara = Date.parse('2026-09-30T00:00:00Z');
    expect(diesDes('2026-09-20T00:00:00Z', ara)).toBe(10);
    expect(diesDes(new Date(ara - DIA + 1).toISOString(), ara)).toBe(0);
    expect(diesDes('2026-10-02T00:00:00Z', ara)).toBe(0);
    expect(diesDes(null, ara)).toBeNull();
    expect(diesDes('ahir', ara)).toBeNull();
  });

  test('rebutsRancis coincidix amb l’etiqueta', () => {
    const ara = Date.parse('2026-09-30T00:00:00Z');
    expect(rebutsRancis([{ t: '2026-09-22T00:00:00Z' }], ara)).toBe(true);
    expect(rebutsRancis([{ t: '2026-09-22T23:00:00Z' }], ara)).toBe(true);   // 7 dies i una hora
    expect(rebutsRancis([{ t: '2026-09-23T00:00:00Z' }], ara)).toBe(false);
    expect(rebutsRancis([], ara)).toBe(false);
  });

  test('dataUltimaOperacio: només si consola.json porta immunitari.ultima.data i és una data', () => {
    const amb = (ultima) => ({ ...DADES, immunitari: { operacions: 15, ultima } });
    expect(dataUltimaOperacio(amb({ op: 'OP-015', tipus: 'DESTRUEIX', data: '2026-08-03T13:43:04.716Z' }))).toBe('2026-08-03T13:43:04.716Z');
    expect(dataUltimaOperacio(amb(null))).toBeNull();
    expect(dataUltimaOperacio(amb({ op: 'OP-1' }))).toBeNull();
    expect(dataUltimaOperacio(amb({ data: 'dilluns' }))).toBeNull();
    expect(dataUltimaOperacio(DADES)).toBeNull();
    expect(dataUltimaOperacio(null)).toBeNull();
  });

  test('CODIS_VIGILANCIA és un conjunt tancat i només aquells avisos alcen l’alerta', () => {
    expect(CODIS_VIGILANCIA).toEqual(['segell-trencat', 'ledger-invalid']);
    expect(Object.isFrozen(CODIS_VIGILANCIA)).toBe(true);
    const mapa = mapaAmb({ avisos: [
      avis('skill:a', 'orfe', 'alta'),
      avis('document:.agents/SKILLS_SEAL.json', 'segell-trencat', 'alta'),
      avis('document:.agents/LEDGER.md', 'ledger-invalid', 'alta')
    ] });
    expect(avisosDeVigilancia(mapa).map((a) => a.codi)).toEqual(['segell-trencat', 'ledger-invalid']);
    expect(avisosDeVigilancia(MAPA_BUIT)).toEqual([]);
    expect(avisosDeVigilancia(null)).toEqual([]);
  });
});

describe('record de visites (localStorage embolcallat)', () => {
  const magatzem = () => {
    const dades = new Map();
    return {
      getItem: (k) => (dades.has(k) ? dades.get(k) : null),
      setItem: (k, v) => { dades.set(k, String(v)); },
      dades
    };
  };
  const trencat = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceeded'); } };

  test('marca i llig per pàgina, conservant les altres', () => {
    const m = magatzem();
    expect(llegixVistes(m)).toEqual({});
    expect(marcaVista('calendari', '3 tasques', m)).toBe(true);
    expect(marcaVista('salut', '2 avisos', m)).toBe(true);
    expect(llegixVistes(m)).toEqual({ calendari: '3 tasques', salut: '2 avisos' });
    expect(JSON.parse(m.dades.get(CLAU_VISTES))).toEqual({ calendari: '3 tasques', salut: '2 avisos' });
  });

  test('no anota pàgines desconegudes ni signatures buides', () => {
    const m = magatzem();
    expect(marcaVista('pestanyes', 'x', m)).toBe(false);
    expect(marcaVista('salut', null, m)).toBe(false);
    expect(m.dades.size).toBe(0);
  });

  test('si l’emmagatzematge falla, no hi ha record i res no peta', () => {
    expect(llegixVistes(trencat)).toBeNull();
    expect(marcaVista('salut', '2 avisos', trencat)).toBe(false);
    expect(llegixVistes(null)).toBeNull();
    expect(marcaVista('salut', '2 avisos', null)).toBe(false);
  });

  test('un record il·legible no és cap base: es refà en la visita següent', () => {
    const m = magatzem();
    m.setItem(CLAU_VISTES, '{no és json');
    expect(llegixVistes(m)).toBeNull();
    expect(marcaVista('salut', '2 avisos', m)).toBe(true);
    expect(llegixVistes(m)).toEqual({ salut: '2 avisos' });
    m.setItem(CLAU_VISTES, '[1,2]');
    expect(llegixVistes(m)).toEqual({});
  });
});
