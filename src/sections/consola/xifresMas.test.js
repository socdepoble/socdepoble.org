import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  CODIS_ALTS, GRUPS_XIFRES, IDS_FAMILIES, IDS_VISTES, RUTA_XIFRES, SLUGS_FIXOS, SLUGS_XIFRES, VISTES_XIFRES,
  XIFRA_DE_CODI, detallXifra, rutaXifra, segmentXifra, targetesDeLaConsola, vistaDe, xifraDelMas,
  xifresDeFamilia, xifresDeGrup, xifresDeLaGraella, xifresDeVista
} from './xifresMas.js';
import { CODIS_VIGILANCIA, IDS_PAGINES, segmentPagina } from './consolaPagines.js';
import { IDS_PANELLS } from './polsConsola.js';
import { normalitzaSlug, trossosEntradeta } from './xifresComu.js';
import { ICONES_XIFRES } from './XifresMas.jsx';

/* Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada xifra i cada peça
   del Mapa que la Consola pinta és una targeta i té pàgina pròpia amb un slug
   estable: el que no depén de React (rutes, textos, mesures i detall). */

const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:core-identitat', tipus: 'skill', font: null, atributs: {} },
    { id: 'document:.agents/runtime/turns', tipus: 'document', font: null, atributs: {} }
  ],
  arestes: [],
  tasques: [{ id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: 'tooling/x.mjs', font: null }],
  avisos: [{ node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' }],
  salut: []
};
const AMB_SALUT = {
  ...MAPA,
  nodes: [...MAPA.nodes, { id: 'document:.agents/SKILLS_SEAL.json', tipus: 'document', font: null, atributs: {} }],
  avisos: [...MAPA.avisos,
    { node: 'skill:sdp-workflow', codi: 'segell-divergent', severitat: 'alta', evidencia: '.agents/SKILLS_SEAL.json' },
    { node: 'document:.agents/runtime/turns', codi: 'torns-caducats', severitat: 'mitjana', evidencia: '2 de 3 torns caducats sense tancar',
      evidencies: ['2 de 3 torns caducats sense tancar', 't1 · claude · open · caducat el 2026-10-01T00:00:00Z', 't2 · codex · sense estat · sense caducitat llegible'] },
    { node: 'document:.agents/SKILLS_SEAL.json', codi: 'segell-trencat', severitat: 'alta', evidencia: '1 de 2 skills fora del segell' }],
  salut: [
    metrica('ledger-fossils', { valor: 8, unitat: 'segells fòssils', font: '.agents/LEDGER.md', prova: 'node tooling/brain/mapa-consola.mjs --json' }),
    metrica('ledger-mal-formades', { valor: 2, unitat: 'línies mal formades', font: '.agents/LEDGER.md' }),
    metrica('torns-caducats-oberts', { valor: 0.667, numerador: 2, denominador: 3, font: '.agents/runtime/turns', prova: 'node tooling/brain/mapa-consola.mjs --json' }),
    metrica('segell-skills-coherent', { valor: 0.5, numerador: 1, denominador: 2, font: '.agents/SKILLS_SEAL.json (només SKILL.md) · disc' })
  ]
};
const CONSOLA = {
  generat: '2026-09-25T13:00:00.000Z',
  consums: [{ agent: 'claude', entrada: 1200, eixida: 300 }, { agent: 'codex', entrada: 1, eixida: 1 }],
  skills: [
    { nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true },
    { nom: 'nova', estat: null, descripcio: '', core: false, alDisc: true, alManifest: false }
  ]
};

describe('rutes', () => {
  test('cada xifra té una ruta compartible, estable i sense la xifra', () => {
    expect(RUTA_XIFRES).toBe('/consola/xifres');
    expect(SLUGS_XIFRES).toEqual(['skills', 'agents', 'skills-opaques', 'coses-que-corren-soles', 'skills-amb-avisos',
      'avisos-alts', 'linies-ledger', 'torns-caducats', 'skills-fora-del-segell', 'skills-orfenes']);
    for (const slug of SLUGS_FIXOS) {
      expect(slug).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(rutaXifra(slug)).toBe(`/consola/xifres/${slug}`);
    }
    expect(new Set(SLUGS_FIXOS).size).toBe(SLUGS_FIXOS.length);
  });

  test.each([
    ['xifres/torns-caducats', 'torns-caducats'], ['/xifres/skills/', 'skills'], ['xifres/no-existix', 'no-existix'],
    ['xifres', null], ['xifres/', null], ['xifres/a/b', null], ['', null], ['calendari', null], [undefined, null]
  ])('segmentXifra(%s) → %s', (comodi, esperat) => {
    expect(segmentXifra(comodi)).toBe(esperat);
  });

  test('les rutes de sempre no canvien: segmentPagina no sap res de les xifres', () => {
    expect(segmentPagina('xifres/torns-caducats')).toBeNull();
    expect(segmentPagina('calendari')).toBe('calendari');
    expect(segmentPagina('')).toBe('');
  });

  test('cada graella només nomena xifres que existixen', () => {
    for (const [grup, slugs] of Object.entries(GRUPS_XIFRES)) {
      for (const slug of slugs) expect(SLUGS_FIXOS, `${grup}: ${slug}`).toContain(slug);
    }
  });
});

describe('la targeta i la pàgina diuen el mateix', () => {
  test('títol amb la xifra, subtítol curt i entradeta en tres frases (què, d’on, per què)', () => {
    const xifres = xifresDeLaGraella(MAPA);
    expect(xifres.map((x) => x.slug)).toEqual(SLUGS_XIFRES);
    for (const x of xifres) {
      expect(x.ruta).toBe(rutaXifra(x.slug));
      expect(x.entradeta.split(/(?<=\.) /).length, x.slug).toBeGreaterThanOrEqual(3);
      expect(x.imatge).toBeNull();
      // La pàgina diu exactament el mateix que la targeta.
      expect(xifraDelMas(x.slug, MAPA)).toEqual(x);
    }
  });

  /* Correcció 261004 (verificador) · els noms de fitxer de les entradetes
     van en <Mono>: a xifresMas.js, entre accents greus. Cap nom de fitxer
     fora de les marques, en cap xifra. */
  test('cada entradeta marca els seus noms de fitxer, i en té tres frases', () => {
    const FITXER = /[\w.-]+\.(?:json|jsonl|ndjson|md|mjs|yaml)\b|\/__iaia\/|~\/Library|\.agents\//;
    // Totes les targetes de la Consola, sense font i amb les dues (també les peces).
    const totes = [
      ...targetesDeLaConsola().values(),
      ...targetesDeLaConsola(AMB_SALUT, CONSOLA).values()
    ];
    expect(totes.length).toBeGreaterThan(50);
    for (const x of totes) {
      const fora = trossosEntradeta(x.entradetaMarcada).filter((t) => 'text' in t).map((t) => t.text).join(' ');
      expect(fora, x.slug).not.toMatch(FITXER);
      expect(x.entradeta.split(/(?<=\.) /).length, x.slug).toBeGreaterThanOrEqual(3);
    }
  });

  test('una mesura absent diu «sense mesura», mai 0', () => {
    const perSlug = Object.fromEntries(xifresDeLaGraella(MAPA).map((x) => [x.slug, x.titol]));
    expect(perSlug['linies-ledger']).toBe('LEDGER sense mesura');
    expect(perSlug['torns-caducats']).toBe('Torns sense mesura');
    expect(perSlug['skills-fora-del-segell']).toBe('Segell sense mesura');
    const amb = Object.fromEntries(xifresDeLaGraella(AMB_SALUT).map((x) => [x.slug, x.titol]));
    expect(amb).toMatchObject({
      'linies-ledger': '10 línies del LEDGER per revisar', 'torns-caducats': '2 torns caducats',
      'skills-fora-del-segell': '1 skill fora del segell', 'avisos-alts': '2 avisos alts'
    });
  });

  /* Correcció 261004 (verificador, punt 5) · amb una sola de les dues
     mesures del LEDGER, l'absent no es compta com a 0. */
  test('LEDGER amb una sola mesura: el títol diu només la que hi és, i la pàgina avisa', () => {
    const nomesFossils = { ...AMB_SALUT, salut: AMB_SALUT.salut.filter((m) => m.metrica !== 'ledger-mal-formades') };
    const x = xifraDelMas('linies-ledger', nomesFossils);
    expect(x.titol).toBe('8 segells fòssils al LEDGER per revisar');
    // Correcció 261004 (verificador de la segona passada, punt 3) · la mesura absent ho diu; derogat «— línies».
    expect(x.subtitol).toBe('8 segells fòssils · línies mal formades sense mesura');
    expect(xifraDelMas('linies-ledger', { ...AMB_SALUT, salut: [
      { ...AMB_SALUT.salut[0], valor: 1 }, { ...AMB_SALUT.salut[1], valor: 1 }
    ] }).subtitol).toBe('1 segell fòssil · 1 línia mal formada');
    const d = detallXifra('linies-ledger', nomesFossils);
    expect(d.senseMesura).toBeNull();
    expect(d.mesura).toMatch(/^Les línies mal formades no tenen mesura/);
    const nomesMal = { ...AMB_SALUT, salut: AMB_SALUT.salut.filter((m) => m.metrica !== 'ledger-fossils') };
    expect(xifraDelMas('linies-ledger', nomesMal).titol).toBe('2 línies mal formades al LEDGER per revisar');
  });

  /* Correcció 261004 (verificador, punt 6) · l'entradeta dels avisos alts diu
     tots els codis d'alta del compilador. Si el compilador n'escriu un de nou,
     esta prova es fa roja fins que CODIS_ALTS el nomene. */
  test('«avisos-alts» nomena tots els codis d’alta que escriu el compilador', () => {
    const compilador = readFileSync(resolve(process.cwd(), 'src/sections/consola/mapa/construeixMapa.js'), 'utf8');
    const alts = [...new Set([...compilador.matchAll(/avis\([^;]*?'([a-z-]+)', 'alta'/g)].map((m) => m[1]))].sort();
    expect(alts.length).toBeGreaterThan(5);
    expect(Object.keys(CODIS_ALTS).sort()).toEqual(alts);
    const entradeta = xifraDelMas('avisos-alts', MAPA).entradeta;
    for (const nom of Object.values(CODIS_ALTS)) expect(entradeta).toContain(nom);
  });

  /* Correcció 261004 (verificador de la segona passada, punt 1) · Sense font,
     les xifres que es pinten sempre porten el seu nom; les condicionals
     (cadències, tasques sense llançador) no es pot saber si existixen, i no
     tenen ni targeta ni pàgina. */
  test('sense font: el nom de la xifra, sense cap número inventat; un slug desconegut és null', () => {
    const x = xifraDelMas('torns-caducats');
    expect(x.titol).toBe('Torns caducats');
    expect(x.titol).not.toMatch(/\d/);
    const senseFont = SLUGS_FIXOS.map((slug) => [slug, xifraDelMas(slug)]);
    for (const [slug, xifra] of senseFont.filter(([, xf]) => xf)) expect(xifra.titol, slug).not.toMatch(/\d/);
    expect(senseFont.filter(([, xf]) => !xf).map(([slug]) => slug).sort()).toEqual([
      'cadencia-altra', 'cadencia-arrencada', 'cadencia-dia', 'cadencia-esdeveniment', 'cadencia-mes',
      'cadencia-permanent', 'cadencia-sense', 'cadencia-setmana', 'tasques-sense-llancador'
    ]);
    expect(xifraDelMas('no-existix', MAPA)).toBeNull();
    expect(detallXifra('no-existix', MAPA)).toBeNull();
    expect(detallXifra('torns-caducats', null)).toBeNull();
  });

  /* Correcció 261004 (verificador, punt 9) · sense Mapa, les deu targetes del
     tauler es pinten igual: cap pàgina sense targeta. */
  test('sense Mapa, el tauler continua tenint les deu xifres, amb el seu nom', () => {
    expect(xifresDeLaGraella(null).map((x) => [x.slug, x.titol])).toEqual(SLUGS_XIFRES.map((s) => [s, xifraDelMas(s).titol]));
  });
});

describe('les xifres de dins de les pàgines i del pols', () => {
  /* Correcció 261004 (verificador de la segona passada) · cada pàgina pinta
     també les xifres del tauler que es tracten ací (skills amb avisos a
     l'Inventari; les anomalies i les tasques a Avisos i salut), i els nodes i
     les arestes van a l'Explorador. */
  test('cada pàgina pinta les seues, i cada una porta a la pàgina que la tracta', () => {
    // Correcció 261004 (verificador de la tercera passada, punt 5) · i les skills sense disparador útil.
    expect(xifresDeGrup('inventari', MAPA).map((x) => [x.slug, x.titol])).toEqual([
      ['skills', '2 skills'], ['skills-sense-avisos', '1 skill sense cap avís'], ['skills-amb-avisos', '1 skill amb avisos'],
      ['skills-orfenes', '1 skill òrfena'], ['skills-fora-d-algun-cens', '0 skills fora d’algun cens'],
      ['skills-sense-disparador', '0 skills sense disparador útil']
    ]);
    expect(xifresDeGrup('salut', MAPA).map((x) => x.titol)).toEqual([
      '1 avís del Mapa', '0 avisos alts', '0 mètriques de salut amb mesura', 'LEDGER sense mesura', 'Torns sense mesura',
      'Segell sense mesura', '1 tasca al Mapa'
    ]);
    // Correcció 261004 (verificador de la tercera passada, punt 5) · les mortes, també a zero: la coberta les destaca.
    expect(xifraDelMas('tasques-del-mapa', MAPA).subtitol).toBe('1 viva · 0 mortes');
    // Correcció 261004 (verificador de la tercera passada, punt 5) · i els enllaços trencats (l'òrfena del Mapa).
    expect(xifresDeGrup('explorador', MAPA).map((x) => x.titol)).toEqual(['4 nodes', '0 arestes', '1 enllaç trencat o peça òrfena']);
    expect(xifraDelMas('enllacos-trencats', MAPA).subtitol).toBe('1 peça òrfena');
    expect(xifraDelMas('arestes', MAPA).subtitol).toBe('0 declarades · 0 derivades · 0 inferides de la prosa');
    expect(xifresDeGrup('fluxos', MAPA).map((x) => x.titol)).toEqual([
      '0 cadenes declarades', '0 suggeriments de la prosa', '0 punts de trobada', '0 llocs amb faena i cap lector'
    ]);
    expect(xifresDeGrup('inventari', MAPA)[4].tracta).toEqual({ ruta: '/consola/inventari?filtre=cens', titol: 'Inventari de skills' });
  });

  /* Correcció 261004 (verificador de la segona passada, punt 1) · Derogat per
     l'ordre del Mestre del 261004 (xat: cap xifra solta): «sense Mapa no es
     pot saber: el nom, i la pàgina diu per què no hi ha dada». Una cadència
     sense Mapa no té targeta enlloc, i per tant tampoc pàgina. */
  test('les cadències només tenen targeta (i pàgina) quan hi ha tasques', () => {
    expect(xifresDeGrup('calendari', MAPA).map((x) => [x.slug, x.titol, x.subtitol])).toEqual([
      ['coses-que-corren-soles', '1 cosa que corre sola', 'Tasques que llança launchd · 1 viva'],
      ['cadencia-dia', '1 tasca diària', 'plaquetes']
    ]);
    expect(xifraDelMas('cadencia-mes', MAPA)).toBeNull();
    expect(detallXifra('cadencia-mes', MAPA)).toBeNull();
    expect(xifraDelMas('cadencia-mes')).toBeNull();
    expect(xifraDelMas('cadencia-dia')).toBeNull();
    expect(xifresDeGrup('calendari', null).map((x) => x.slug)).toEqual(['coses-que-corren-soles']);
  });

  test('les del pols viuen de consola.json: sense registre, «sense mesura»; el panell o la pàgina que les tracta', () => {
    expect(xifraDelMas('registres-de-consum', null, CONSOLA).titol).toBe('2 registres de consum');
    expect(xifraDelMas('registres-de-consum', null, CONSOLA).tracta).toEqual({ ruta: '/consola/pols', titol: 'El pols del cervell' });
    /* Frase aprovada pel Mestre (D2, 261006) en retirar les xifres de tòkens. */
    expect(xifraDelMas('registres-de-consum', null, CONSOLA).entradeta)
      .toContain('Un agent que no anota el seu consum no compta, encara que gaste: sense registres, la Consola no en sap res.');
    expect(xifresDeGrup('skills-pols', null, CONSOLA).map((x) => x.titol)).toEqual([
      '2 skills al disc o al manifest', '1 skill del nucli', '1 skill fora del manifest', '0 skills sense disc',
      'Segell de skills absent'
    ]);
    const buit = { ...CONSOLA, consums: [] };
    expect(xifraDelMas('registres-de-consum', null, buit).titol).toBe('0 registres de consum');
    expect(detallXifra('registres-de-consum', null, buit).senseMesura).toMatch(/ningú no ha mesurat/);
    expect(xifraDelMas('registres-de-consum', MAPA).titol).toBe('Registres de consum');
    expect(detallXifra('registres-de-consum', MAPA)).toBeNull();
    expect(xifraDelMas('skills-sense-disc', null, CONSOLA).tracta).toEqual({ ruta: '/consola/pols/skills', titol: 'Skills' });
    expect(detallXifra('registres-de-consum', null, CONSOLA).generador).toBe('tooling/vite/consola-iaia.mjs');
  });
});

describe('les peces del Mapa, una a una', () => {
  const ACTORS = {
    ...MAPA,
    nodes: [...MAPA.nodes,
      { id: 'hook:claude:PreToolUse', tipus: 'hook', font: null, atributs: { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true } },
      { id: 'script:tooling/gates/hooks-local.mjs', tipus: 'script', font: null, atributs: {} },
      { id: 'document:CLAUDE.md', tipus: 'document', font: null, atributs: {} },
      { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} },
      { id: 'ruta:acta', tipus: 'ruta', font: null, atributs: {} }],
    arestes: [
      { de: 'agent:claude-code', a: 'hook:claude:PreToolUse', tipus: 'dispara', confianca: 'declarat', evidencia: null },
      { de: 'hook:claude:PreToolUse', a: 'script:tooling/gates/hooks-local.mjs', tipus: 'dispara', confianca: 'derivat', evidencia: null },
      { de: 'agent:claude-code', a: 'document:CLAUDE.md', tipus: 'carrega', confianca: 'declarat', evidencia: null },
      { de: 'document:CLAUDE.md', a: 'skill:sdp-workflow', tipus: 'carrega', confianca: 'declarat', evidencia: null },
      { de: 'ruta:acta', a: 'document:_wiki_de_poble/04_escriptori', tipus: 'escriu', confianca: 'declarat', evidencia: null }
    ]
  };

  test('cada família dona un slug estable derivat de l’id, i la pàgina diu el mateix', () => {
    expect(IDS_FAMILIES).toEqual(['arnes', 'carregador', 'candat', 'tasca', 'lloc', 'agent-atomic']);
    // Onada 6 (semàfor) · ACTIU en verd i SENSE LECTOR en taronja, amb el vocabulari d'Insignia.
    expect(xifresDeFamilia('arnes', ACTORS).map((x) => [x.slug, x.titol, x.subtitol, x.etiquetes])).toEqual([
      ['arnes-claude-code', 'Claude Code', '1 candat · en arrencar carrega 1 document i 1 skill', [{ text: 'ACTIU', to: 'exit' }]]
    ]);
    expect(xifresDeFamilia('candat', ACTORS).map((x) => [x.slug, x.titol, x.subtitol, x.subtitolPrivat, x.icona])).toEqual([
      ['candat-claude-pretooluse', 'PreToolUse', 'Claude Code · dispara hooks-local.mjs', 'Claude Code · dispara 1 script', 'lock']
    ]);
    expect(xifresDeFamilia('carregador', ACTORS).map((x) => [x.slug, x.titol, x.titolPrivat])).toEqual([
      ['carregador-claude-md', 'CLAUDE.md', 'Carregador d’arrencada']
    ]);
    expect(xifresDeFamilia('tasca', ACTORS).map((x) => [x.slug, x.subtitol, x.subtitolPrivat])).toEqual([
      ['tasca-plaquetes', 'cada hora · x.mjs', 'cada hora']
    ]);
    expect(xifresDeFamilia('lloc', ACTORS).map((x) => [x.slug, x.titol, x.etiquetes])).toEqual([
      ['lloc-wiki-de-poble-04-escriptori', '04_escriptori', [{ text: 'SENSE LECTOR', to: 'avis' }]]
    ]);
    for (const id of IDS_FAMILIES) {
      for (const x of xifresDeFamilia(id, ACTORS)) {
        expect(x.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(xifraDelMas(x.slug, ACTORS), x.slug).toEqual(x);
        expect(detallXifra(x.slug, ACTORS).taules.length, x.slug).toBeGreaterThan(0);
      }
    }
  });

  /* React necessita claus úniques: cap taula del detall repetix columna ni
     fila (el registre de consum repetia «Registres»). */
  test('cap taula del detall repetix columna ni clau de fila', () => {
    const detalls = [
      ...SLUGS_FIXOS.map((slug) => [slug, detallXifra(slug, ACTORS, CONSOLA)]),
      ...IDS_FAMILIES.flatMap((id) => xifresDeFamilia(id, ACTORS).map((x) => [x.slug, detallXifra(x.slug, ACTORS)]))
    ].filter(([, d]) => d);
    expect(detalls.length).toBeGreaterThan(30);
    for (const [slug, d] of detalls) {
      expect(new Set(d.taules.map((t) => t.titol)).size, slug).toBe(d.taules.length);
      for (const t of d.taules) {
        expect(new Set(t.columnes).size, `${slug} · ${t.titol}`).toBe(t.columnes.length);
        expect(new Set(t.files.map((f) => f.clau)).size, `${slug} · ${t.titol}`).toBe(t.files.length);
        for (const f of t.files) expect(f.celes.length, `${slug} · ${t.titol}`).toBe(t.columnes.length);
      }
    }
  });

  /* Correcció 261004 (verificador de la segona passada, punt 1) · Derogat
     per l'ordre del Mestre del 261004 (xat: cap xifra solta): «sense Mapa, el
     nom de la família» (qualsevol slug amb el prefix d'una família obria una
     pàgina, i cap targeta no la pintava). Sense Mapa, cap peça té pàgina. */
  test('una peça que el Mapa no porta no existix; sense Mapa, cap peça té pàgina', () => {
    expect(xifraDelMas('arnes-codex', ACTORS)).toBeNull();
    expect(detallXifra('arnes-codex', ACTORS)).toBeNull();
    for (const slug of ['arnes-codex', 'arnes-claude-code', 'arnes-patata', 'carregador-claude-md', 'candat-x',
      'tasca-plaquetes', 'lloc-qualsevol-cosa', 'agent-atomic-xyz', 'credit-res']) {
      expect(xifraDelMas(slug), slug).toBeNull();
      expect(detallXifra(slug), slug).toBeNull();
    }
    expect(xifraDelMas('arnes-claude-code', ACTORS)).not.toBeNull();
    expect(xifresDeFamilia('arnes', null)).toEqual([]);
  });

  test('dos ids que es normalitzen igual no comparteixen slug', () => {
    expect(normalitzaSlug('document:.agents/LEDGER.md')).toBe('document-agents-ledger-md');
    const doble = {
      ...MAPA,
      tasques: [
        { id: 'copia.diaria', estat: 'viu', llancador: { tipus: 'launchd' }, cadencia: { cada_segons: 60 }, script: null, font: null },
        { id: 'copia_diaria', estat: 'viu', llancador: { tipus: 'launchd' }, cadencia: { cada_segons: 60 }, script: null, font: null }
      ]
    };
    expect(xifresDeFamilia('tasca', doble).map((x) => x.slug)).toEqual(['tasca-copia-diaria', 'tasca-copia-diaria-2']);
  });
});

describe('el detall de cada pàgina', () => {
  /* Correcció 261004 (verificador, punt 7) · el denominador és el total de
     torns, i la frase ho diu: no «2 de 3 torns oberts i caducats». */
  test('torns caducats un a un, sense el recompte, amb la font i la prova de la mètrica', () => {
    const d = detallXifra('torns-caducats', AMB_SALUT);
    expect(d.senseMesura).toBeNull();
    expect(d.mesura).toBe('2 torns oberts i caducats d’un total de 3 torns');
    expect(d.taules[0].files.map((f) => f.celes[0])).toEqual([
      { mono: 't1 · claude · open · caducat el 2026-10-01T00:00:00Z' }, { mono: 't2 · codex · sense estat · sense caducitat llegible' }
    ]);
    expect([d.font, d.prova]).toEqual(['.agents/runtime/turns', 'node tooling/brain/mapa-consola.mjs --json']);
  });

  test('sense la mètrica, el detall diu per què i no pinta cap taula de zeros', () => {
    for (const slug of ['torns-caducats', 'linies-ledger', 'skills-fora-del-segell']) {
      const d = detallXifra(slug, MAPA);
      expect(d.senseMesura, slug).toMatch(/^El Mapa no porta/);
      expect(d.mesura, slug).toBeNull();
    }
  });

  /* Correcció 261004 (verificador, punt 8) · la taula de la xifra del segell
     només porta skills; el segell trencat, a part. */
  test('el segell: la taula de skills quadra amb el títol, i el segell trencat va a part', () => {
    const segell = detallXifra('skills-fora-del-segell', AMB_SALUT);
    /* Correcció 261004 (verificador de la tercera passada, punts 2 i 3) · concorda
       amb el que compta. Derogat «1 de 2 SKILL.md fora del segell o divergents». */
    expect(segell.mesura).toBe('1 SKILL.md fora del segell o divergent d’un total de 2 SKILL.md');
    expect(segell.taules[0].files).toHaveLength(Number(xifraDelMas('skills-fora-del-segell', AMB_SALUT).titol.split(' ')[0]));
    expect(segell.taules[0].files[0].celes).toEqual([
      { node: 'skill:sdp-workflow' }, { codi: 'segell-divergent' }, { severitat: 'alta' }, { avis: AMB_SALUT.avisos[1] }
    ]);
    expect(segell.taules[0].files.some((f) => f.celes[1].codi === 'segell-trencat')).toBe(false);
    expect(segell.taules[1].titol).toBe('Estat del segell sencer');
    expect(segell.taules[1].files.map((f) => f.celes[1].codi)).toEqual(['segell-trencat']);
  });

  test('el LEDGER, les òrfenes i les tasques es desglossen amb les evidències en mono', () => {
    const ledger = detallXifra('linies-ledger', AMB_SALUT);
    expect(ledger.taules[0].files.map((f) => f.clau)).toEqual(['ledger-fossils', 'ledger-mal-formades']);
    expect(ledger.nota).toMatch(/una a una/);
    const orfenes = detallXifra('skills-orfenes', MAPA);
    expect(orfenes.taules.map((t) => [t.titol, t.files.length])).toEqual([['Skills òrfenes', 1], ['Skills fantasma', 0]]);
    const tasques = detallXifra('coses-que-corren-soles', MAPA);
    expect(tasques.taules[0].files[0].celes).toEqual([{ text: 'plaquetes' }, { estat: 'viu' }, { text: 'cada 3600 s' }, { mono: 'tooling/x.mjs' }]);
    const agents = detallXifra('agents', MAPA);
    expect(agents.taules[0].files[0].celes).toEqual([{ text: 'claude-code' }, { text: 'Claude Code' }, { mono: 'CLAUDE.md' }]);
  });
});

/* Correcció 261004 (verificador de la segona passada, punt 1) · El viceversa
   estricte, amb una sola font (VISTES_XIFRES): per a cada combinació de
   fonts, el conjunt de targetes que pinten les vistes és exactament el de
   les pàgines que existixen, i qualsevol altre slug (també amb el prefix
   d'una família) és «Xifra no trobada». Que cada vista pinte al DOM el que
   diu el registre ho comprova ConsolaSection.viceversa.test.jsx. */
describe('el viceversa estricte: targetes pintades === pàgines', () => {
  const aresta = (de, cap, tipus, confianca = 'declarat') => ({ de, a: cap, tipus, confianca, evidencia: null });
  const MAPA_PLE = {
    ...AMB_SALUT,
    nodes: [...AMB_SALUT.nodes,
      { id: 'agent:codex', tipus: 'agent', font: null, atributs: { arnes: 'Codex' } },
      { id: 'hook:claude:PreToolUse', tipus: 'hook', font: null, atributs: { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true } },
      { id: 'script:tooling/gates/hooks-local.mjs', tipus: 'script', font: null, atributs: {} },
      { id: 'document:CLAUDE.md', tipus: 'document', font: null, atributs: {} },
      { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} },
      { id: 'ruta:acta', tipus: 'ruta', font: null, atributs: {} }],
    arestes: [
      aresta('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
      aresta('hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat'),
      aresta('agent:claude-code', 'document:CLAUDE.md', 'carrega'),
      aresta('document:CLAUDE.md', 'skill:sdp-workflow', 'carrega'),
      aresta('ruta:acta', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
      // Codex declara on deixa la faena: és un agent atòmic.
      aresta('agent:codex', 'document:_wiki_de_poble/04_escriptori', 'escriu')
    ],
    tasques: [...MAPA.tasques,
      { id: 'setmanal', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 's' }, cadencia: { cron: '0 3 * * 1' }, script: null, font: null },
      { id: 'pre-commit', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: 'x.mjs', font: null },
      { id: 'higiene', estat: 'declarat-sense-llancador', llancador: null, cadencia: null, script: null, font: null }]
  };
  const CONSOLA_PLE = {
    ...CONSOLA,
    rebuts: [{ t: '2026-09-20T01:03:39.000Z', peticio: 'ced19fcaab00ffff', protocols: ['a/b.md'], fonts: [{ ruta: 'x', sha256: 'y' }] }],
    segell: { hash: 'abcdef0123456789', timestamp: '2026-10-02T07:01:17.116Z', filesCount: 2, manifest: { 'a/SKILL.md': '1111', 'b/SKILL.md': '2222' } },
    immunitari: { operacions: 3, ultima: { op: 'OP-3', tipus: 'ADOPTA', fitxer: 'x.md', data: '2026-08-03T13:43:04.716Z' } },
    fonts: { diari: { estat: 'ok', 'línies_descartades': 1 }, immunitari: { estat: 'ok', 'línies_descartades': 0 } },
    termometria: { artefactesActius: 162, abast: 'Escriptori' },
    /* Fase A (pas 2.2 del pla, 261006) · El middleware encara publica els
       crèdits a consola.json: amb ells a les dades, ni 'credit-claude' ni
       'proveidors-de-credits' (FALSOS) poden tindre targeta ni pàgina. */
    credits: [{ proveidor: 'Claude', consumit: 6, limit: 100 }]
  };
  const FONTS = [
    ['amb el Mapa i consola.json', MAPA_PLE, CONSOLA_PLE],
    ['amb el Mapa i sense consola.json', MAPA_PLE, null],
    ['sense el Mapa i amb consola.json', null, CONSOLA_PLE],
    ['sense cap font (producció)', null, null]
  ];
  const FALSOS = ['arnes-patata', 'lloc-qualsevol-cosa', 'agent-atomic-xyz', 'carregador-res', 'candat-res', 'tasca-res',
    'credit-res', 'cadencia-mes', 'no-existix', 'xifres', '', 'credit-claude', 'proveidors-de-credits',
    'tokens-d-entrada', 'tokens-d-eixida'];
  const UNIVERS = [...new Set([
    ...SLUGS_FIXOS, ...IDS_FAMILIES.flatMap((id) => xifresDeFamilia(id, MAPA_PLE, CONSOLA_PLE).map((x) => x.slug)), ...FALSOS
  ])];

  test('el Mapa i consola.json de la prova pinten de tot: cada família i cada xifra condicional', () => {
    for (const id of IDS_FAMILIES) expect(xifresDeFamilia(id, MAPA_PLE, CONSOLA_PLE).length, id).toBeGreaterThan(0);
    expect(xifraDelMas('tasques-sense-llancador', MAPA_PLE)).not.toBeNull();
    expect(xifresDeGrup('calendari', MAPA_PLE).length).toBeGreaterThan(2);
  });

  test.each(FONTS)('%s: un slug té pàgina si i només si alguna vista en pinta la targeta', (_nom, mapa, dades) => {
    const pintades = new Set(IDS_VISTES.flatMap((v) => xifresDeVista(v, mapa, dades).map((x) => x.slug)));
    const ambPagina = UNIVERS.filter((slug) => xifraDelMas(slug, mapa, dades) !== null);
    expect(ambPagina.sort()).toEqual([...pintades].sort());
    expect([...targetesDeLaConsola(mapa, dades).keys()].sort()).toEqual([...pintades].sort());
    for (const slug of FALSOS) {
      expect(xifraDelMas(slug, mapa, dades), slug).toBeNull();
      expect(detallXifra(slug, mapa, dades), slug).toBeNull();
    }
    // La pàgina diu exactament el mateix que la targeta.
    for (const v of IDS_VISTES) for (const x of xifresDeVista(v, mapa, dades)) expect(xifraDelMas(x.slug, mapa, dades)).toEqual(x);
  });

  test.each(FONTS)('%s: cada targeta es pinta a la pàgina que la tracta, i «On es tracta» hi porta', (_nom, mapa, dades) => {
    for (const v of IDS_VISTES) {
      for (const x of xifresDeVista(v, mapa, dades)) {
        const desti = vistaDe(x);
        expect(IDS_VISTES, x.slug).toContain(desti);
        expect(xifresDeVista(desti, mapa, dades).map((y) => y.slug), `${x.slug} → ${desti}`).toContain(x.slug);
        expect(x.tracta.ruta.split('?')[0], x.slug).toBe(`/consola/${desti}`);
      }
    }
  });

  test('les vistes són el tauler, les nou pàgines i els tres panells; cada xifra fixa i cada família és en alguna', () => {
    expect([...IDS_VISTES].sort()).toEqual(['tauler', ...IDS_PAGINES, ...IDS_PANELLS.map((p) => `pols/${p}`)].sort());
    const trossos = Object.values(VISTES_XIFRES).flat();
    expect([...new Set(trossos.filter((t) => t.grup).map((t) => t.grup))].sort()).toEqual(Object.keys(GRUPS_XIFRES).sort());
    expect([...new Set(trossos.filter((t) => t.familia).map((t) => t.familia))].sort()).toEqual([...IDS_FAMILIES].sort());
    const enGrups = new Set(Object.values(GRUPS_XIFRES).flat());
    for (const slug of SLUGS_FIXOS) expect(enGrups.has(slug), slug).toBe(true);
  });

  test('cada targeta porta una icona que existix, i l’alerta de vigilància sap la xifra de cada codi', () => {
    for (const x of targetesDeLaConsola(MAPA_PLE, CONSOLA_PLE).values()) expect(ICONES_XIFRES[x.icona], `${x.slug}: ${x.icona}`).toBeTruthy();
    for (const codi of CODIS_VIGILANCIA) expect(SLUGS_XIFRES, codi).toContain(XIFRA_DE_CODI[codi]);
  });
});

/* Correcció 261004 (verificador de la segona passada, punt 3) · Cap recompte
   amb el plural fix: amb un 1, cada targeta concorda. */
describe('la concordança de les targetes', () => {
  test('amb un sol element, cap targeta diu «1 …s»', () => {
    const UN = {
      schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
      nodes: [
        { id: 'skill:a', tipus: 'skill', font: null, atributs: {} },
        { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} }
      ],
      arestes: [{ de: 'skill:a', a: 'document:_wiki_de_poble/04_escriptori', tipus: 'escriu', confianca: 'declarat', evidencia: null }],
      tasques: [{ id: 't', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 60 }, script: null, font: null }],
      avisos: [{ node: 'skill:a', codi: 'pes', severitat: 'alta', evidencia: 'x' }],
      salut: [{ metrica: 'vigilants-vius', valor: 1, unitat: 'fraccio', numerador: 1, denominador: 1, font: 'x', prova: 'p' }]
    };
    const textos = [...targetesDeLaConsola(UN).values()].flatMap((x) => [x.titol, x.subtitol]);
    expect(textos.length).toBeGreaterThan(30);
    const PLURAL_FIX = /(?:^|[^\d])1 (?:skills|avisos|tasques|nodes|arestes|peces|cadenes|suggeriments|punts|llocs|línies|segells|rebuts|registres|operacions|fitxers|artefactes|agents|arnesos|candats|coses|vives|mortes|alts)\b/;
    expect(textos.filter((t) => PLURAL_FIX.test(t))).toEqual([]);
    const tauler = xifraDelMas('peca-tauler', UN).subtitol;
    /* Correcció 261004 (verificador de la tercera passada, punt 3) · «de»
       s'apostrofa davant d'1. Derogat «rep la faena de 1 peça» i «1 de 1 tasca». */
    expect(tauler).toBe('04_escriptori rep la faena d’1 peça · ningú no declara que la llig');
    expect(xifraDelMas('peca-vigilants', UN).subtitol).toBe('Vigilants vius: 1 / 1 · 1 avís alt al Mapa');
    expect(xifraDelMas('peca-fluxos-de-treball', UN).subtitol).toBe('0 cadenes declarades · 0 suggeriments de la prosa');
    expect(xifraDelMas('peca-agents-sols', UN).subtitol).toBe('1 d’1 tasca que llança launchd és viva');
    // Cap «de» davant d'una xifra que es llig amb vocal, en cap targeta.
    expect(textos.filter((t) => /\bde (?:1|8|11|8\d)\b/.test(t))).toEqual([]);
    expect(xifraDelMas('llocs-del-sol', UN).titol).toBe('1 lloc del sòl');
  });

  /* Correcció 261004 (verificador de la tercera passada, punts 2 i 3) · Amb una
     sola fantasma, una sola skill al cens, una sola mètrica o un sol agent: la
     frase concorda i «de» s'apostrofa. */
  test('subtítols amb un 1: «nomenada», «D’1 skill», «D’1 mètrica», «D’1 agent»', () => {
    const fantasma = {
      ...MAPA,
      nodes: [{ id: 'skill:x', tipus: 'skill', font: null, atributs: {} }],
      avisos: [{ node: 'skill:x', codi: 'skill-fantasma', severitat: 'alta', evidencia: 'disc' }],
      salut: [metrica('vigilants-vius', { valor: 'N/A' })]
    };
    expect(xifraDelMas('skills-orfenes', fantasma).subtitol).toBe('1 skill fantasma: nomenada i sense carpeta al disc');
    expect(xifraDelMas('skills-orfenes', AMB_SALUT).subtitol).toBe('0 skills fantasma: nomenades i sense carpeta al disc');
    expect(xifraDelMas('skills-sense-avisos', fantasma).subtitol).toBe('D’1 skill al cens: semàfor verd a l’Inventari');
    expect(xifraDelMas('metriques-amb-mesura', fantasma).subtitol).toBe('D’1 mètrica: 1 sense mesura (N/A)');
    expect(xifraDelMas('metriques-amb-mesura', AMB_SALUT).subtitol).toBe('De 4 mètriques: 0 sense mesura (N/A)');
    const unAgent = { ...CONSOLA, consums: [{ agent: 'claude', entrada: 10, eixida: 5 }] };
    expect(xifraDelMas('registres-de-consum', null, unAgent).subtitol).toBe('D’1 agent');
    expect(xifraDelMas('registres-de-consum', null, CONSOLA).subtitol).toBe('De 2 agents');
  });
});

/* Correcció 261004 (verificador de la tercera passada, punt 4) · Una font
   absent no és cap zero. El middleware publica `operacions: 0`, `rebuts: []`
   i `consums: []` també quan el journal o el diari no existixen, i ho diu a
   fonts.<font>.estat. La targeta diu «sense mesura» i la seua pàgina, per què. */
describe('una mesura absent no es compta com a 0', () => {
  const SENSE_FONTS = {
    ...CONSOLA, consums: [], rebuts: [], immunitari: { operacions: 0, ultima: null },
    fonts: { diari: { estat: 'absent' }, immunitari: { estat: 'absent' } }
  };
  test('sense journal ni diari: operacions, rebuts i registres sense mesura', () => {
    const titol = (slug) => xifraDelMas(slug, null, SENSE_FONTS).titol;
    expect(titol('operacions-immunitaries')).toBe('Operacions immunitàries sense mesura');
    expect(xifraDelMas('operacions-immunitaries', null, SENSE_FONTS).subtitol).toBe('El journal immunitari no es pot llegir');
    expect(titol('rebuts-de-lectura')).toBe('Rebuts de lectura sense mesura');
    expect(titol('registres-de-consum')).toBe('Registres de consum sense mesura');
    expect(xifraDelMas('ultim-rebut', null, SENSE_FONTS).subtitol).toBe('El diari de sessió no es pot llegir');
    for (const slug of ['operacions-immunitaries', 'rebuts-de-lectura', 'registres-de-consum', 'ultim-rebut']) {
      expect(titol(slug), slug).not.toMatch(/\b0\b/);
      expect(detallXifra(slug, null, SENSE_FONTS).senseMesura, slug).toMatch(/no existix o no es pot llegir/);
    }
  });
  test('amb les fonts llegibles, el zero és una mesura', () => {
    const AMB_FONTS = { ...SENSE_FONTS, fonts: { diari: { estat: 'ok' }, immunitari: { estat: 'ok' } } };
    expect(xifraDelMas('operacions-immunitaries', null, AMB_FONTS).titol).toBe('0 operacions immunitàries');
    expect(xifraDelMas('rebuts-de-lectura', null, AMB_FONTS).titol).toBe('0 rebuts de lectura');
    expect(xifraDelMas('registres-de-consum', null, AMB_FONTS).titol).toBe('0 registres de consum');
    expect(detallXifra('operacions-immunitaries', null, AMB_FONTS).senseMesura).toBeNull();
  });
});

/* Onada 6 (requisits 8 i 9) · Les deu xifres del tauler porten el semàfor
   segons el seu valor (Cal reparar en roig, Important en taronja, En ordre en
   verd; sense mesura, cap) i diuen a la vista quins són els seus problemes. */
describe('Onada 6 · el semàfor i els problemes d’«El Mas en xifres»', () => {
  const etiqueta = (x) => (x.etiquetes ? x.etiquetes.map((e) => `${e.text}:${e.to}`) : null);
  /* Correcció de l'Onada 6 (revisió adversarial) · cada problema porta la seua
     marca amb el to del semàfor: «[marca:to] text|ruta». */
  const problemes = (x) => (x.problemes
    ? x.problemes.map((p) => `${p.marca ? `[${p.marca}:${p.to}] ` : ''}${p.ruta ? `${p.text}|${p.ruta}` : p.text}`)
    : null);
  const perSlug = (mapa) => Object.fromEntries(xifresDeLaGraella(mapa).map((x) => [x.slug, [etiqueta(x), problemes(x)]]));

  test('un Mapa amb una òrfena: cada xifra, el seu color i els seus problemes', () => {
    expect(perSlug(MAPA)).toEqual({
      skills: [['En ordre:exit'], []],
      agents: [['Important:avis'], ['[sense candats:avis] Claude Code']],
      'skills-opaques': [['Important:avis'], ['[opaca:avis] core-identitat', '[opaca:avis] sdp-workflow']],
      'coses-que-corren-soles': [['En ordre:exit'], []],
      'skills-amb-avisos': [['Important:avis'], ['[ambre:avis] core-identitat · orfe']],
      'avisos-alts': [['En ordre:exit'], []],
      // Sense cap mesura del LEDGER, dels torns ni del segell: cap color, mai un verd.
      'linies-ledger': [null, []],
      'torns-caducats': [null, []],
      'skills-fora-del-segell': [null, []],
      'skills-orfenes': [['Important:avis'], ['[mitjana:avis] core-identitat · orfe']]
    });
  });

  test('avisos alts i torns caducats: roig i taronja, i quins són (les rutes, a part)', () => {
    const x = perSlug(AMB_SALUT);
    expect(x['avisos-alts']).toEqual([['Cal reparar:error'], [
      '[alta:error] sdp-workflow · segell-divergent', '[alta:error] segell-trencat|.agents/SKILLS_SEAL.json'
    ]]);
    expect(x['torns-caducats']).toEqual([['Important:avis'], [
      '|t1 · claude · open · caducat el 2026-10-01T00:00:00Z', '|t2 · codex · sense estat · sense caducitat llegible'
    ]]);
    expect(x['skills-fora-del-segell']).toEqual([['Cal reparar:error'], ['[alta:error] sdp-workflow · segell-divergent']]);
    expect(x['linies-ledger']).toEqual([['Important:avis'], []]);
  });

  /* Correcció de l'Onada 6 (revisió adversarial) · la xifra del cens pren el
     color de la gravetat dels avisos del cens, com «Skills fora d'algun cens»
     i l'Inventari: una skill fora del segell (alta) ja és roja. Derogat:
     «només la fantasma és roja». */
  test('skills: el cens pel més greu dels seus avisos, i quines en falten', () => {
    const skill = (nom) => ({ id: `skill:${nom}`, tipus: 'skill', font: null, atributs: {} });
    const amb = (avisos) => ({ ...MAPA, nodes: [...MAPA.nodes, skill('x'), skill('y')], avisos });
    const fora = (node, codi, severitat) => ({ node, codi, severitat, evidencia: null });
    // La marca és la severitat dels avisos del cens: «ambre» o «roig» són el color de la skill sencera a l'Inventari.
    expect(perSlug(amb([fora('skill:x', 'fora-cataleg-claude', 'mitjana')])).skills)
      .toEqual([['Important:avis'], ['[mitjana:avis] x · fora-cataleg-claude']]);
    expect(perSlug(amb([fora('skill:x', 'fora-cataleg-claude', 'mitjana'), fora('skill:y', 'fora-segell', 'alta')])).skills)
      // La roja primer, com a l'Inventari.
      .toEqual([['Cal reparar:error'], ['[alta:error] y · fora-segell', '[mitjana:avis] x · fora-cataleg-claude']]);
    /* Una skill roja a l'Inventari per un avís que no és del cens no es diu
       «ambre» ací: la marca només parla dels avisos del cens. */
    const roja = amb([fora('skill:x', 'fora-cataleg-claude', 'mitjana'), fora('skill:x', 'frontmatter-invalid', 'alta')]);
    expect(perSlug(roja).skills).toEqual([['Important:avis'], ['[mitjana:avis] x · fora-cataleg-claude']]);
    expect(perSlug(roja)['skills-amb-avisos'][1]).toEqual(['[roig:error] x · fora-cataleg-claude, frontmatter-invalid']);
    // Un avís que no és del cens (l'orfe) no hi compta.
    expect(perSlug(amb([fora('skill:x', 'orfe', 'mitjana')])).skills).toEqual([['En ordre:exit'], []]);
  });

  /* Onada 6 (contradiccions) · L'alerta del tauler enllaça amb esta xifra: amb
     la signatura trencada, el títol ho diu (abans: «0 línies del LEDGER per revisar»). */
  test('el LEDGER amb la signatura trencada ho diu al títol i va en roig', () => {
    const invalid = {
      ...AMB_SALUT,
      nodes: [...AMB_SALUT.nodes, { id: 'document:.agents/LEDGER.md', tipus: 'document', font: null, atributs: {} }],
      avisos: [...AMB_SALUT.avisos, { node: 'document:.agents/LEDGER.md', codi: 'ledger-invalid', severitat: 'alta', evidencia: 'x' }],
      salut: AMB_SALUT.salut.map((m) => (m.metrica.startsWith('ledger-') ? { ...m, valor: 0 } : m))
    };
    const x = xifraDelMas('linies-ledger', invalid);
    expect(x.titol).toBe('LEDGER amb la signatura trencada');
    expect(x.subtitol).toBe('0 segells fòssils · 0 línies mal formades');
    expect(etiqueta(x)).toEqual(['Cal reparar:error']);
    expect(problemes(x)).toEqual(['[alta:error] ledger-invalid|.agents/LEDGER.md']);
    expect(XIFRA_DE_CODI['ledger-invalid']).toBe('linies-ledger');
  });

  test('sense Mapa, cap color i cap problema', () => {
    for (const x of xifresDeLaGraella(null)) {
      expect(x.etiquetes, x.slug).toBeNull();
      expect(x.problemes, x.slug).toBeNull();
    }
  });

  test('cada xifra amb font porta com a molt una etiqueta, i sempre del semàfor', () => {
    for (const mapa of [MAPA, AMB_SALUT]) {
      for (const x of xifresDeLaGraella(mapa)) {
        if (!x.etiquetes) continue;
        expect(x.etiquetes, x.slug).toHaveLength(1);
        expect(['error', 'avis', 'exit'], x.slug).toContain(x.etiquetes[0].to);
      }
    }
  });
});

/* Correcció de l'Onada 6 (revisió adversarial, problema alt: «els requisits 8
   i 9 només s'han aplicat a les 9 cobertes i a les 10 xifres del tauler») ·
   Les xifres de dins de les pàgines i del pols també porten el semàfor segons
   el seu valor i diuen a la vista quins són els seus problemes, amb la marca
   del seu color. Les que només diuen una mida informen: cap etiqueta. */
describe('Correcció Onada 6 · el semàfor i els problemes de les xifres de les pàgines', () => {
  const etiqueta = (x) => (x?.etiquetes ? x.etiquetes.map((e) => `${e.text}:${e.to}`) : null);
  const problemes = (x) => (x?.problemes
    ? x.problemes.map((p) => `${p.marca ? `[${p.marca}:${p.to}] ` : ''}${p.ruta ? `${p.text}|${p.ruta}` : p.text}`)
    : null);
  const de = (slug, mapa, dades = null) => {
    const x = xifraDelMas(slug, mapa, dades);
    return [etiqueta(x), problemes(x)];
  };
  const fora = (node, codi, severitat) => ({ node, codi, severitat, evidencia: null });
  const skill = (nom) => ({ id: `skill:${nom}`, tipus: 'skill', font: null, atributs: {} });

  test('Avisos i salut: els avisos pel més greu, les mètriques i les tasques', () => {
    expect(de('avisos', MAPA)).toEqual([['Important:avis'], ['[mitjana:avis] core-identitat · orfe']]);
    expect(de('avisos', AMB_SALUT)).toEqual([['Cal reparar:error'], [
      '[alta:error] sdp-workflow · segell-divergent', '[alta:error] segell-trencat|.agents/SKILLS_SEAL.json',
      '[mitjana:avis] core-identitat · orfe', '[mitjana:avis] torns-caducats|.agents/runtime/turns'
    ]]);
    // Les mètriques: verd només amb totes mesurades; amb una N/A, cap etiqueta i quina és.
    expect(de('metriques-amb-mesura', MAPA)).toEqual([null, []]);
    expect(de('metriques-amb-mesura', AMB_SALUT)).toEqual([['En ordre:exit'], []]);
    const ambNA = { ...AMB_SALUT, salut: [...AMB_SALUT.salut, metrica('cadena-portes', { valor: 'N/A', prova: null })] };
    expect(de('metriques-amb-mesura', ambNA)).toEqual([null, ['[N/A:neutre] cadena-portes']]);
    // Les tasques, pel pitjor estat.
    expect(de('tasques-del-mapa', MAPA)).toEqual([['En ordre:exit'], []]);
    const ambMorta = { ...MAPA, tasques: [...MAPA.tasques, { id: 'reflex', estat: 'mort', llancador: null, cadencia: null, script: null, font: null }] };
    expect(de('tasques-del-mapa', ambMorta)).toEqual([['Cal reparar:error'], ['[mort:error] reflex']]);
    expect(de('tasques-del-mapa', { ...MAPA, tasques: [] })).toEqual([null, []]);
  });

  test('Inventari: el cens, els disparadors i les skills sense avís, per gravetat', () => {
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes, skill('x'), skill('y')],
      avisos: [...MAPA.avisos, fora('skill:x', 'fora-cataleg-claude', 'mitjana'), fora('skill:y', 'disparador-decoratiu', 'mitjana')]
    };
    expect(de('skills-fora-d-algun-cens', mapa)).toEqual([['Important:avis'], ['[mitjana:avis] x · fora-cataleg-claude']]);
    expect(de('skills-fora-d-algun-cens', MAPA)).toEqual([['En ordre:exit'], []]);
    expect(de('skills-sense-disparador', mapa)).toEqual([['Important:avis'], ['[mitjana:avis] y · disparador-decoratiu']]);
    // La xifra de les netes diu el color del cens sencer i quines no ho són.
    expect(de('skills-sense-avisos', mapa)).toEqual([['Important:avis'], [
      '[ambre:avis] core-identitat · orfe', '[ambre:avis] x · fora-cataleg-claude', '[ambre:avis] y · disparador-decoratiu'
    ]]);
    const ambAlt = { ...mapa, avisos: [...mapa.avisos, fora('skill:x', 'fora-segell', 'alta')] };
    expect(de('skills-fora-d-algun-cens', ambAlt)[0]).toEqual(['Cal reparar:error']);
  });

  test('Explorador: els enllaços trencats amb la gravetat del seu avís; la mida, cap etiqueta', () => {
    expect(de('enllacos-trencats', MAPA)).toEqual([['Important:avis'], ['[mitjana:avis] core-identitat · orfe']]);
    const ambScript = { ...MAPA, nodes: [...MAPA.nodes, { id: 'script:tooling/x.mjs', tipus: 'script', font: null, atributs: {} }],
      avisos: [...MAPA.avisos, fora('script:tooling/x.mjs', 'script-absent', 'alta')] };
    expect(de('enllacos-trencats', ambScript)).toEqual([['Cal reparar:error'], [
      '[alta:error] script-absent|tooling/x.mjs', '[mitjana:avis] core-identitat · orfe'
    ]]);
    expect(de('enllacos-trencats', { ...MAPA, avisos: [] })).toEqual([['En ordre:exit'], []]);
    for (const slug of ['nodes', 'arestes', 'rutes-documentals', 'cadenes-declarades', 'suggeriments-de-la-prosa', 'punts-de-trobada', 'agents-atomics']) {
      expect(xifraDelMas(slug, MAPA).etiquetes, slug).toBeNull();
    }
  });

  test('el pols: les skills fora del manifest o sense disc, en roig; la mida, cap etiqueta', () => {
    expect(de('skills-fora-del-manifest', null, CONSOLA)).toEqual([['Cal reparar:error'], ['[fora del manifest:error] nova']]);
    expect(de('skills-sense-disc', null, CONSOLA)).toEqual([['En ordre:exit'], []]);
    // Sense segell, FALTA (taronja).
    expect(de('segell-de-skills', null, CONSOLA)).toEqual([['FALTA:avis'], null]);
    for (const slug of ['registres-de-consum', 'skills-del-manifest', 'skills-del-nucli']) {
      expect(xifraDelMas(slug, null, CONSOLA).etiquetes, slug).toBeNull();
    }
  });

  test('cap targeta verda diu cap problema, i sense font cap color ni cap problema', () => {
    const ambNA = { ...AMB_SALUT, salut: [...AMB_SALUT.salut, metrica('cadena-portes', { valor: 'N/A', prova: null })] };
    for (const [mapa, dades] of [[MAPA, CONSOLA], [AMB_SALUT, CONSOLA], [ambNA, null]]) {
      for (const x of targetesDeLaConsola(mapa, dades).values()) {
        if (!SLUGS_FIXOS.includes(x.slug) || !x.etiquetes) continue;
        expect(x.etiquetes, x.slug).toHaveLength(1);
        if (x.etiquetes[0].to === 'exit') expect(x.problemes ?? [], x.slug).toEqual([]);
      }
    }
    for (const vista of IDS_VISTES) {
      for (const x of xifresDeVista(vista, null, null)) {
        expect(x.etiquetes, `${vista}:${x.slug}`).toBeNull();
        expect(x.problemes, `${vista}:${x.slug}`).toBeNull();
      }
    }
  });
});
