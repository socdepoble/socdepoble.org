import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  carregaMapa, normalitzaMapa, resumMapa, valorMetrica, textCadencia, textLlancador, FONT_MAPA
} from './mapaContent.js';

const minim = () => ({
  schema: 'sdp.mapa.v1',
  generat: '2026-09-24T12:00:00.000Z',
  tall: { branca: 'b', commit: 'c0ffee00', arbre_net: true },
  nodes: [
    { id: 'skill:a', tipus: 'skill', font: '.agents/skills/a/SKILL.md', atributs: {} },
    { id: 'skill:b', tipus: 'skill', font: null, atributs: {} }
  ],
  arestes: [{ de: 'skill:a', a: 'skill:b', tipus: 'crida', confianca: 'inferit', evidencia: 'x' }],
  tasques: [{ id: 't', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'org.x' }, cadencia: { cada_segons: 60 }, script: null, font: null }],
  avisos: [
    { node: 'skill:b', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' },
    { node: 'skill:a', codi: 'fora-segell', severitat: 'alta', evidencia: 'segell' }
  ],
  salut: [
    { metrica: 'm1', valor: 0.5, unitat: 'fraccio', numerador: 1, denominador: 2, font: 'f', prova: 'p' },
    { metrica: 'm2', valor: 'N/A', unitat: 'minuts', numerador: null, denominador: null, font: 'f', prova: null }
  ]
});

const resposta = (status, cos, tipus = 'application/json; charset=utf-8') => ({
  status,
  ok: status >= 200 && status < 300,
  statusText: String(status),
  headers: { get: (nom) => (nom.toLowerCase() === 'content-type' ? tipus : null) },
  json: async () => cos
});

afterEach(() => vi.unstubAllGlobals());

describe('carregaMapa', () => {
  it('404 vol dir que no hi ha mapa en este entorn', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(404, null)));
    await expect(carregaMapa()).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledWith(FONT_MAPA, expect.objectContaining({ cache: 'no-store' }));
  });

  it('l’HTML de l’aplicació no és un mapa: absència, no error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(200, '<!doctype html>', 'text/html')));
    await expect(carregaMapa()).resolves.toBeNull();
  });

  it('una resposta simulada sense capçaleres tampoc és un mapa', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, ok: true, json: async () => minim() })));
    await expect(carregaMapa()).resolves.toBeNull();
  });

  it('un error del servidor es diu, no es pinta com a buit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(500, null)));
    await expect(carregaMapa()).rejects.toThrow('Mapa 500');
  });

  it('normalitza una resposta bona', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(200, minim())));
    const mapa = await carregaMapa();
    expect(mapa.nodes).toHaveLength(2);
    expect(mapa.salut[1]).toMatchObject({ valor: 'N/A', prova: null });
  });
});

describe('normalitzaMapa · el contracte falla en veu alta', () => {
  it.each([
    ['un esquema desconegut', (m) => { m.schema = 'sdp.mapa.v2'; }, 'schema'],
    ['un tipus de node desconegut', (m) => { m.nodes[0].tipus = 'robot'; }, 'nodes[0].tipus'],
    ['un id duplicat', (m) => { m.nodes[1].id = 'skill:a'; }, 'duplicat'],
    ['una aresta cap a un node absent', (m) => { m.arestes[0].a = 'skill:z'; }, 'node absent'],
    ['una confiança inventada', (m) => { m.arestes[0].confianca = 'segur'; }, 'confianca'],
    ['un avís sobre un node absent', (m) => { m.avisos[0].node = 'skill:z'; }, 'node absent'],
    ['una severitat inventada', (m) => { m.avisos[0].severitat = 'critica'; }, 'severitat'],
    ['un estat de tasca inventat', (m) => { m.tasques[0].estat = 'verd'; }, 'estat'],
    ['un valor numèric sense prova', (m) => { m.salut[0].prova = null; }, 'prova'],
    ['un valor que no és número ni N/A', (m) => { m.salut[0].valor = '100%'; }, 'valor']
  ])('rebutja %s', (_nom, trenca, missatge) => {
    const m = minim();
    trenca(m);
    expect(() => normalitzaMapa(m)).toThrow(missatge);
  });

  it('accepta un N/A sense prova i un tall absent', () => {
    const m = minim();
    m.tall = null;
    expect(normalitzaMapa(m).tall).toBeNull();
  });
});

describe('resumMapa i textos', () => {
  it('compta i ordena els avisos per severitat', () => {
    const r = resumMapa(normalitzaMapa(minim()));
    expect(r).toMatchObject({ nodes: 2, arestes: 1, avisos: 2, tasques: 1, alts: 1 });
    expect(r.avisosOrdenats.map((a) => a.codi)).toEqual(['fora-segell', 'orfe']);
    expect(r.perTipus).toEqual([['skill', 2]]);
  });

  it('pinta fraccions com «n / d», magnituds amb unitat i N/A sense adorn', () => {
    const [m1, m2] = normalitzaMapa(minim()).salut;
    expect(valorMetrica(m1)).toBe('1 / 2');
    expect(valorMetrica(m2)).toBe('N/A');
    expect(valorMetrica({ ...m2, valor: 45 })).toBe('45 minuts');
  });

  it('descriu llançadors i cadències, i un guió quan no n’hi ha', () => {
    expect(textLlancador({ tipus: 'launchd', etiqueta: 'org.x' })).toBe('launchd · org.x');
    expect(textLlancador(null)).toBe('—');
    expect(textCadencia({ cada_segons: 3600, en_arrencar: true })).toBe('cada 3600 s · en arrencar');
    expect(textCadencia(null)).toBe('—');
  });
});
