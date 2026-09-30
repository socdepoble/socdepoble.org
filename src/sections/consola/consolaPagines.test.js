import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from '../text/pageContent.js';
import {
  CLAU_VISTES, CODIS_VIGILANCIA, ETIQUETES, IDS_PAGINES, LLINDAR_REBUTS_RANCIS_DIES, LLINDAR_SATURACIO, RUTA_CONSOLA,
  avisosDeVigilancia, dataUltimaOperacio, diesDes, etiquetesPagina, etiquetesPols, llegixVistes, marcaVista,
  mesuresPagina, paginaConsola, paginesConsola, rebutsRancis, resumPagina, segmentPagina, signaturaPagina, ultimRebut,
  LLINDAR_ROIG, ORDRE_TO, estatsPagina, faDies, nivellEstats, plural
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

/* ── T3 (ordre del Mestre, 260930) · la coberta de cada targeta ─────────────
   Desglossa els estats de dins de la seua pàgina, el que falla primer al
   capdavant. Viu a part de les mesures: la signatura de «Canvis nous» no en
   sap res, i el nivell de l'etiqueta és el to del primer estat. */

const n3 = (id, tipus, atributs = {}) => ({ id, tipus, font: null, atributs });
const a3 = (de, cap, tipus, confianca = 'declarat', evidencia = null) => ({ de, a: cap, tipus, confianca, evidencia });

/* La forma del Mapa real del 25-09 (la mateixa que vistesMapa.test.jsx). */
const MAPA_REAL = Object.freeze({
  schema: 'sdp.mapa.v1',
  generat: '2026-09-25T13:12:23.715Z',
  tall: null,
  nodes: [
    n3('agent:claude-code', 'agent', { arnes: 'Claude Code' }),
    n3('agent:antigravity', 'agent', { arnes: 'Antigravity' }),
    n3('hook:claude:PreToolUse', 'hook', { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true }),
    n3('hook:antigravity:PostToolUse', 'hook', { arnes: 'Antigravity', esdeveniment: 'PostToolUse', consumidor_acreditat: false }),
    n3('script:tooling/gates/hooks-local.mjs', 'script'),
    n3('document:CLAUDE.md', 'document'), n3('document:AGENTS.md', 'document'),
    n3('document:.agents/cervell.json', 'document'),
    n3('document:_wiki_de_poble/04_escriptori', 'document'),
    n3('ruta:acta', 'ruta'), n3('ruta:auditoria', 'ruta'), n3('ruta:prompt.local', 'ruta'),
    n3('skill:sdp-workflow', 'skill', { core: true, status: 'canonic', al_disc: true }),
    n3('skill:wiki-busca-skills', 'skill', { status: 'canonic', al_disc: true }),
    n3('tasca:plaquetes-diagnostic', 'tasca'), n3('tasca:reflex-daemon', 'tasca')
  ],
  arestes: [
    a3('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
    a3('agent:antigravity', 'hook:antigravity:PostToolUse', 'dispara'),
    a3('hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat'),
    a3('agent:claude-code', 'document:CLAUDE.md', 'carrega'),
    a3('document:CLAUDE.md', 'document:AGENTS.md', 'carrega'),
    a3('document:CLAUDE.md', 'skill:sdp-workflow', 'carrega'),
    a3('document:.agents/cervell.json', 'skill:sdp-workflow', 'carrega'),
    a3('ruta:acta', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    a3('ruta:auditoria', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    a3('ruta:prompt.local', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    a3('ruta:prompt.local', 'document:AGENTS.md', 'llig'),
    a3('ruta:prompt.local', 'skill:sdp-workflow', 'governa'),
    a3('skill:sdp-workflow', 'skill:wiki-busca-skills', 'crida', 'inferit', '.agents/skills/sdp-workflow/SKILL.md')
  ],
  tasques: [
    { id: 'plaquetes-diagnostic', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'org.socdepoble.plaquetes' }, cadencia: { cada_segons: 3600, en_arrencar: true }, script: 'scripts/immunitari/plaquetes.mjs', font: null },
    { id: 'reflex-daemon', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 'com.socdepoble.reflex_daemon' }, cadencia: { permanent: true }, script: 'tooling/wiki/core/reflex_daemon.mjs', font: null },
    { id: 'frontissa-contingut', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: 'tooling/gates/frontissa-contingut.mjs', font: null },
    { id: 'higiene-basica', estat: 'declarat-sense-llancador', llancador: null, cadencia: null, script: null, font: null }
  ],
  avisos: [
    { node: 'skill:wiki-busca-skills', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' },
    { node: 'tasca:reflex-daemon', codi: 'tasca-morta', severitat: 'alta', evidencia: 'tooling/wiki/core/reflex_daemon.mjs' }
  ],
  salut: [
    { metrica: 'vigilants-vius', valor: 0.5, unitat: 'fraccio', numerador: 1, denominador: 2, font: '~/Library/LaunchAgents', prova: 'node tooling/brain/mapa-consola.mjs --json' },
    { metrica: 'cadena-portes', valor: 'N/A', unitat: 'fraccio', numerador: null, denominador: null, font: 'tooling/gates/run-portes.mjs', prova: null }
  ]
});

const ARA_T3 = Date.parse('2026-09-30T12:00:00.000Z');
const DIA_T3 = 24 * 60 * 60 * 1000;
const rebutDeFa = (fa) => ({ t: new Date(ARA_T3 - fa).toISOString(), peticio: null, protocols: [], fonts: [] });
const orfeDisc = { nom: 'o', alDisc: true, alManifest: false, core: false };
const fantasma = (nom) => ({ nom, alDisc: false, alManifest: true, core: false });
const ambDades = (extra) => ({ dades: { ...DADES, ...extra }, estatDades: 'ready' });
/** Estats de la coberta com a [to, text], amb el rellotge fix de la prova. */
const estatsT3 = (id, fonts) => estatsPagina(id, fonts, ARA_T3)?.map((e) => [e.to, e.text]) ?? null;
const textosT3 = (id, fonts, vist) => etiquetesPagina(id, fonts, vist, ARA_T3).map((e) => e.text);

/* El Mapa del tauler de ConsolaSection.test.jsx: un sol orfe (mitjana). */
const MAPA_TAULER = Object.freeze(mapaAmb({
  nodes: [n3('agent:claude-code', 'agent', { arnes: 'Claude Code' }), skill('sdp-workflow'), skill('core-identitat')],
  tasques: [{ id: 'v', estat: 'viu', llancador: { tipus: 'launchd' }, cadencia: null, script: null, font: null }],
  avisos: [avis('skill:core-identitat', 'orfe', 'mitjana')]
}));

/* Els fixtures del describe «regles per pàgina», i els dos Mapes de forma real:
   cada un amb el nivell que el tauler li ha de pintar. */
function casosDeNivell() {
  const tasca = (estat, llancador = null) => ({ id: estat, estat, llancador, cadencia: null, script: null, font: null });
  const launchd = (estat) => ({ ...tasca(estat, { tipus: 'launchd' }), id: 'v' });
  const nodesFluxos = [{ id: 'ruta:acta', tipus: 'ruta' }, { id: 'ruta:prompt', tipus: 'ruta' }, { id: 'document:04', tipus: 'document' }];
  const escriu = { de: 'ruta:acta', a: 'document:04', tipus: 'escriu', confianca: 'declarat' };
  const llig = { de: 'ruta:prompt', a: 'document:04', tipus: 'llig', confianca: 'declarat' };
  const nodesInventari = [skill('a'), skill('b'), { id: 'tasca:t', tipus: 'tasca', atributs: {} }];
  const tres = ['orfe', 'fora-index', 'pes'].map((c) => avis('skill:a', c, 'baixa'));
  const hook = (acreditat) => ({ id: 'hook:ag:Post', tipus: 'hook', atributs: { consumidor_acreditat: acreditat } });
  return [
    ['pols', ambDades({ skills: [orfeDisc] })],
    ['pols', ambDades({ skills: [fantasma('f')] })],
    ['pols', ambDades({ termometria: { artefactesActius: LLINDAR_SATURACIO + 1 } })],
    ['pols', ambDades({ termometria: { artefactesActius: LLINDAR_SATURACIO } })],
    ['pols', ambDades({ termometria: { artefactesActius: '999' } })],
    ['pols', ambDades({})],
    ...['script-absent', 'skill-fantasma', 'font-absent', 'fitxer-absent', 'orfe', 'crida-inexistent', 'fora-index', 'tasca-morta']
      .map((codi) => ['explorador', ambMapa(mapaAmb({ avisos: [avis('x', codi, 'mitjana')] }))]),
    ['fluxos', ambMapa(mapaAmb({ nodes: nodesFluxos, arestes: [escriu] }))],
    ['fluxos', ambMapa(mapaAmb({ nodes: nodesFluxos, arestes: [escriu, llig] }))],
    ...[['viu', 'mort'], ['declarat-sense-llancador'], ['llancador-sense-declaracio'], ['viu', 'desconegut']]
      .map((estats) => ['calendari', ambMapa(mapaAmb({ tasques: estats.map((e) => tasca(e)) }))]),
    ['inventari', ambMapa(mapaAmb({ nodes: nodesInventari, avisos: tres }))],
    ['inventari', ambMapa(mapaAmb({ nodes: nodesInventari, avisos: tres.slice(0, 2) }))],
    ['inventari', ambMapa(mapaAmb({ nodes: nodesInventari, avisos: [avis('tasca:t', 'tasca-morta', 'alta')] }))],
    ['entrades', ambMapa(mapaAmb({ nodes: [skill('a'), { id: 'document:d', tipus: 'document', atributs: {} }] }))],
    ['actors', ambMapa(mapaAmb({ tasques: [launchd('mort')] }))],
    ['actors', ambMapa(mapaAmb({ tasques: [launchd('viu')] }))],
    ['actors', ambMapa(mapaAmb({ nodes: [hook(false)] }))],
    ['actors', ambMapa(mapaAmb({ nodes: [hook(true)] }))],
    ['salut', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'baixa'), avis('b', 'y', 'alta')] }))],
    ['salut', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'mitjana')] }))],
    ['salut', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'baixa')] }))],
    ['agents', ambMapa(mapaAmb({ avisos: [avis('a', 'x', 'alta')] }))],
    ...IDS_PAGINES.filter((id) => id !== 'pols').flatMap((id) => [[id, ambMapa(MAPA_REAL)], [id, ambMapa(MAPA_TAULER)]])
  ];
}

describe('T3 · estatsPagina: el desglossament de la coberta', () => {
  test('sense font no hi ha estats, i una pàgina desconeguda tampoc en té', () => {
    for (const id of IDS_PAGINES) {
      for (const estat of ['loading', 'absent', 'error']) {
        expect(estatsPagina(id, { estatDades: estat, estatMapa: estat }, ARA_T3), `${id}:${estat}`).toBeNull();
      }
      expect(estatsPagina(id, {}, ARA_T3), id).toBeNull();
      expect(estatsPagina(id), id).toBeNull();
    }
    expect(estatsPagina('pestanyes', ambMapa(MAPA_REAL), ARA_T3)).toBeNull();
  });

  test('una font neta no té res a desglossar: el zero s’amaga', () => {
    for (const id of IDS_PAGINES.filter((p) => p !== 'pols' && p !== 'agents')) {
      expect(estatsPagina(id, ambMapa(MAPA_BUIT), ARA_T3), id).toEqual([]);
    }
    expect(estatsPagina('pols', { dades: DADES, estatDades: 'ready' }, ARA_T3)).toEqual([]);
    // Un Mapa buit no té cap de les quatre peces en marxa: la pàgina ho diu, i la coberta també (sense nivell).
    expect(estatsT3('agents', ambMapa(MAPA_BUIT))).toEqual([
      ['info', 'Fluxos de treball: falta'], ['info', 'Tauler: falta'],
      ['info', 'Agents que treballen sols: falta'], ['info', 'Qui avisa quan algo es trenca: sense mesura']
    ]);
    expect(nivellEstats(estatsPagina('agents', ambMapa(MAPA_BUIT), ARA_T3))).toBeNull();
  });

  test('la forma del Mapa real, pàgina per pàgina', () => {
    const f = ambMapa(MAPA_REAL);
    expect(estatsT3('explorador', f)).toEqual([['error', '1 peça òrfena'], ['info', '1 relació inferida de la prosa']]);
    expect(estatsT3('fluxos', f)).toEqual([['avis', '1 lloc amb faena i cap lector']]);
    expect(estatsT3('calendari', f)).toEqual([
      ['error', '1 tasca morta'], ['avis', '1 tasca sense llançador'], ['info', '1 tasca d’estat desconegut']
    ]);
    expect(estatsT3('inventari', f)).toEqual([['avis', '1 skill amb semàfor ambre'], ['avis', '1 skill òrfena']]);
    expect(estatsT3('entrades', f)).toEqual([['avis', '2 skills opaques']]);
    expect(estatsT3('agents', f)).toEqual([
      ['info', 'Fluxos de treball: falta'], ['info', 'Tauler: sense lector'],
      ['info', 'Agents que treballen sols: parcial'], ['info', 'Qui avisa quan algo es trenca: parcial']
    ]);
    expect(estatsT3('actors', f)).toEqual([
      ['error', '1 tasca de launchd morta'], ['avis', '1 candat sense consumidor'], ['info', '1 candat per acreditar'],
      ['info', '1 tasca sense llançador'], ['info', '1 lloc sense lector']
    ]);
    expect(estatsT3('salut', f)).toEqual([
      ['error', '1 avís alt'], ['avis', '1 avís mitjà'], ['info', '1 mètrica sense mesura (N/A)']
    ]);
  });

  test('cada estat porta una clau única dins de la seua targeta i el recompte que el text diu', () => {
    const e = estatsPagina('explorador', ambMapa(MAPA_REAL), ARA_T3);
    expect(e).toEqual([
      { clau: 'orfe', n: 1, text: '1 peça òrfena', to: 'error' },
      { clau: 'inferides', n: 1, text: '1 relació inferida de la prosa', to: 'info' }
    ]);
    for (const [id, fonts] of casosDeNivell()) {
      const estats = estatsPagina(id, fonts, ARA_T3) ?? [];
      const claus = estats.map((x) => x.clau);
      expect(new Set(claus).size, id).toBe(claus.length);
      for (const { clau, n, text } of estats) {
        // Cada peça d'agents és una i el text en diu l'estat, no una xifra.
        if (id === 'agents') expect(n, `${id}:${clau}`).toBe(1);
        else expect(text.match(/\d+/)?.[0], `${id}:${clau}`).toBe(String(n));
      }
    }
    // El recompte dels rebuts rancis són els dies que el text diu.
    expect(estatsPagina('pols', ambDades({ rebuts: [rebutDeFa(9 * DIA_T3)] }), ARA_T3))
      .toEqual([{ clau: 'rebuts-rancis', n: 9, text: 'Últim rebut fa 9 dies', to: 'avis' }]);
  });

  test('l’explorador compta cada codi d’enllaç trencat en l’ordre de severitat, amb singular i plural', () => {
    const codis = ['orfe', 'crida-inexistent', 'skill-fantasma', 'fitxer-absent', 'font-absent', 'script-absent'];
    const mapa = mapaAmb({ avisos: [...codis, 'fitxer-absent'].map((c, i) => avis(`x${i}`, c, 'alta')) });
    expect(estatsT3('explorador', ambMapa(mapa))).toEqual([
      ['error', '1 script absent'], ['error', '1 font absent'], ['error', '2 fitxers absents'],
      ['error', '1 skill fantasma'], ['error', '1 crida a una skill inexistent'], ['error', '1 peça òrfena']
    ]);
    // L2 (260930): el compilador del Mapa diu «fitxer absent»; al tauler és un enllaç trencat.
    const absent = ambMapa(mapaAmb({ avisos: [avis('document:x.md', 'fitxer-absent', 'alta')] }));
    expect(estatsT3('explorador', absent)).toEqual([['error', '1 fitxer absent']]);
    expect(textosT3('explorador', absent)).toEqual(['Cal reparar']);
  });

  test('l’exemple del Mestre a l’inventari: el semàfor mana, no la severitat del codi', () => {
    const nodes = [skill('a'), skill('b'), skill('c')];
    const avisos = [
      avis('skill:a', 'orfe', 'mitjana'), avis('skill:a', 'fora-index', 'mitjana'), avis('skill:a', 'disparador-decoratiu', 'mitjana'),
      avis('skill:b', 'fora-segell', 'alta')
    ];
    expect(LLINDAR_ROIG).toBe(3);
    expect(estatsT3('inventari', ambMapa(mapaAmb({ nodes, avisos })))).toEqual([
      ['error', '1 skill amb semàfor roig'], ['avis', '1 skill amb semàfor ambre'], ['avis', '1 skill òrfena'],
      ['avis', '2 skills fora del cens'], ['avis', '1 skill sense disparador útil']
    ]);
    const nomesB = ambMapa(mapaAmb({ nodes, avisos: avisos.slice(3) }));
    expect(estatsT3('inventari', nomesB)).toEqual([['avis', '1 skill amb semàfor ambre'], ['avis', '1 skill fora del cens']]);
    expect(textosT3('inventari', nomesB)).toEqual(['Important']);
  });

  test('pols: orfes i fantasmes, error; saturació i rebuts rancis, avís; sense termometria ni crèdits, res', () => {
    const pols = (extra) => estatsT3('pols', ambDades(extra));
    expect(pols({ skills: [orfeDisc, fantasma('f'), fantasma('g')] })).toEqual([
      ['error', '1 orfe (disc sense manifest)'], ['error', '2 fantasmes (manifest sense disc)']
    ]);
    expect(pols({ termometria: { artefactesActius: LLINDAR_SATURACIO + 12 } })).toEqual([['avis', '12 artefactes per damunt del llindar']]);
    expect(pols({ termometria: { artefactesActius: LLINDAR_SATURACIO + 1 } })).toEqual([['avis', '1 artefacte per damunt del llindar']]);
    expect(pols({ termometria: { artefactesActius: LLINDAR_SATURACIO } })).toEqual([]);
    expect(pols({ rebuts: [rebutDeFa(8 * DIA_T3)] })).toEqual([['avis', 'Últim rebut fa 8 dies']]);
    expect(pols({ rebuts: [rebutDeFa(7 * DIA_T3)] })).toEqual([]);
    expect(pols({ credits: null, termometria: undefined })).toEqual([]);
    expect(pols({ rebuts: [rebutDeFa(8 * DIA_T3)], skills: [orfeDisc] })).toEqual([
      ['error', '1 orfe (disc sense manifest)'], ['avis', 'Últim rebut fa 8 dies']
    ]);
  });

  test('el més greu primer: el to no afluixa mai dins d’una coberta', () => {
    expect(ORDRE_TO).toEqual({ error: 0, avis: 1, info: 2 });
    for (const [id, fonts] of casosDeNivell()) {
      const ordres = (estatsPagina(id, fonts, ARA_T3) ?? []).map((e) => ORDRE_TO[e.to]);
      expect(ordres, id).toEqual([...ordres].sort((x, y) => x - y));
    }
  });

  test('nivellEstats: el to del primer estat, si és error o avís', () => {
    expect(nivellEstats(null)).toBeNull();
    expect(nivellEstats([])).toBeNull();
    expect(nivellEstats([{ to: 'info' }])).toBeNull();
    expect(nivellEstats([{ to: 'avis' }, { to: 'info' }])).toBe('avis');
    expect(nivellEstats([{ to: 'error' }, { to: 'avis' }])).toBe('error');
  });

  /* Invariant, no equivalència: etiquetesPagina calcula el nivell amb el
     desglossament, i ací es comprova que res no se'n desvia (llevat d'una
     lectura fallida, que cap cas no porta). L'equivalència amb les regles
     d'abans la guarden, en literal, el describe «regles per pàgina» i la
     prova següent. */
  test('invariant: l’etiqueta pinta el nivell del desglossament, amb el mateix rellotge', () => {
    const NIVELL = { error: 'Cal reparar', avis: 'Important' };
    const discrepancies = casosDeNivell().flatMap(([id, fonts], i) => {
      const nivell = nivellEstats(estatsPagina(id, fonts, ARA_T3));
      const pintat = textosT3(id, fonts).filter((e) => e === NIVELL.error || e === NIVELL.avis);
      const esperat = NIVELL[nivell] ? [NIVELL[nivell]] : [];
      return JSON.stringify(pintat) === JSON.stringify(esperat) ? [] : [`cas ${i} · ${id}: desglossament ${nivell}, etiqueta ${JSON.stringify(pintat)}`];
    });
    expect(discrepancies).toEqual([]);
  });

  /* En literal, els dos Mapes de forma real: el nivell que les regles d'abans
     pintaven a cada targeta (el del tauler, el mateix que «etiquetes d'un colp
     d'ull» de ConsolaSection.test.jsx). Cap dels dos no porta fitxer-absent ni
     rebuts, els dos casos que el Mestre ha fet canviar. */
  test('els dos Mapes de forma real porten, targeta per targeta, el nivell de les regles d’abans', () => {
    const nivells = (mapa) => Object.fromEntries(IDS_PAGINES.filter((id) => id !== 'pols')
      .map((id) => [id, textosT3(id, ambMapa(mapa))]));
    expect(nivells(MAPA_REAL)).toEqual({
      explorador: ['Cal reparar'], fluxos: ['Important'], calendari: ['Cal reparar'], inventari: ['Important'],
      entrades: ['Important'], agents: [], actors: ['Cal reparar'], salut: ['Cal reparar']
    });
    expect(nivells(MAPA_TAULER)).toEqual({
      explorador: ['Cal reparar'], fluxos: [], calendari: [], inventari: ['Important'],
      entrades: ['Important'], agents: [], actors: [], salut: ['Important']
    });
  });

  test('D1 (decisió del Mestre): al tauler, un diari de rebuts ranci fa «Important» la targeta del pols', () => {
    expect(textosT3('pols', ambDades({ rebuts: [rebutDeFa(8 * DIA_T3)] }))).toEqual(['Important']);
    expect(textosT3('pols', ambDades({ rebuts: [rebutDeFa(7 * DIA_T3)] }))).toEqual([]);
    // Coincidix amb la targeta Rebuts de dins del pols.
    expect(etiquetesPols({ ...DADES, rebuts: [rebutDeFa(8 * DIA_T3)] }, 'ready', ARA_T3).rebuts).toEqual([ETIQUETES.important]);
  });

  test('canviar només els estats no canvia la signatura de «Canvis nous»', () => {
    const base = mapaAmb({
      nodes: [skill('a'), skill('b'), n3('ruta:r', 'ruta'), n3('script:s', 'script'), n3('agent:claude-code', 'agent'), n3('hook:claude:PreToolUse', 'hook')],
      arestes: [
        a3('skill:a', 'skill:b', 'crida', 'inferit'), a3('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
        a3('ruta:r', 'skill:a', 'governa')
      ],
      avisos: [avis('skill:a', 'pes', 'alta')]
    });
    const decoratiu = { ...base, avisos: [...base.avisos, avis('skill:a', 'disparador-decoratiu', 'mitjana')] };
    expect(estatsT3('inventari', ambMapa(decoratiu))).not.toEqual(estatsT3('inventari', ambMapa(base)));
    expect(signaturaPagina('inventari', ambMapa(decoratiu))).toBe('2 skills al Mapa');
    expect(signaturaPagina('inventari', ambMapa(base))).toBe('2 skills al Mapa');
    const orfe = { ...base, avisos: [...base.avisos, avis('skill:b', 'orfe', 'mitjana')] };
    expect(estatsT3('explorador', ambMapa(orfe))).not.toEqual(estatsT3('explorador', ambMapa(base)));
    expect(signaturaPagina('explorador', ambMapa(orfe))).toBe('6 nodes · 3 arestes');
    expect(signaturaPagina('explorador', ambMapa(base))).toBe('6 nodes · 3 arestes');
    // Sense record de l'estat vist, la signatura igual no fa saltar «Canvis nous».
    expect(textosT3('inventari', ambMapa(decoratiu), '2 skills al Mapa')).not.toContain('Canvis nous');
  });

  test('plural i faDies, compartits amb la pàgina del pols', () => {
    expect(plural(1, 'dia', 'dies')).toBe('1 dia');
    expect(plural(0, 'dia', 'dies')).toBe('0 dies');
    expect(faDies(0)).toBe('avui');
    expect(faDies(1)).toBe('fa 1 dia');
    expect(faDies(8)).toBe('fa 8 dies');
  });
});
