import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

/* Onada 11 (261010; prompt 261010_1730, tasca 5) · L'Índex de la Consola és
   dada abans que vista: la jerarquia ix de les fonts d'ara (consolaPagines.js,
   polsConsola.js, xifresMas.js) i no inventa ni una ruta ni un número. */
import * as modulIndex from './indexConsola.js';
import {
  ID_EMPAQUETATS, ID_GOVERN, ID_INDEX, ID_INTRO, ID_MAS, SIGNIFICAT_ESTAT, TEXT_INDEX, TITOL_INDEX, TITOL_INTRO, TITOL_MAS, ambEnllacos,
  indexConsola, nodesDeLIndex, trossosMarcats
} from './indexConsola.js';
import { IMATGES_CONSOLA } from './imatgesConsola.js';
import {
  ETIQUETES, IDS_PAGINES, estatsPagina, etiquetesPagina, etiquetesPols, mesuresPagina, paginaConsola, problemesPagina
} from './consolaPagines.js';
import { IDS_PANELLS, panellPols, rutaPanell } from './polsConsola.js';
import {
  SLUGS_FIXOS, SLUGS_XIFRES, VISTES_XIFRES, rutaXifra, targetesDeLaConsola, xifresDeFamilia, xifresDeGrup, xifresDeLaGraella,
  xifresDeVista
} from './xifresMas.js';
import { paginesGovern, rutaGovern } from './govern/governConsola.js';
import { normalitzaMcr, recompteVist, vistaMatriu } from './govern/matriuGovern.js';
import { fraseDeRecompte } from './govern/comunicacioGovern.js';
import { PLATAFORMES, RUTA_EMPAQUETATS, TITOL_EMPAQUETATS, cobertaEmpaquetats, normalitzaEmpaquetats } from './empaquetats.js';
import { COLOR_D_ESTAT } from './semafor.js';
import { resumDeProblemes } from './resumProblemes.js';
import { VERSIO_SISTEMA } from '../../config/versio.js';

/* El mateix Mapa de prova que ConsolaSection.viceversa.test.jsx: pinta de
   tot (cada família de peces i cada xifra condicional). */
const aresta = (de, cap, tipus, confianca = 'declarat') => ({ de, a: cap, tipus, confianca, evidencia: null });
const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'agent:codex', tipus: 'agent', font: null, atributs: { arnes: 'Codex' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:core-identitat', tipus: 'skill', font: null, atributs: {} },
    { id: 'hook:claude:PreToolUse', tipus: 'hook', font: null, atributs: { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true } },
    { id: 'script:tooling/gates/hooks-local.mjs', tipus: 'script', font: null, atributs: {} },
    { id: 'document:CLAUDE.md', tipus: 'document', font: null, atributs: {} },
    { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} },
    { id: 'document:.agents/LEDGER.md', tipus: 'document', font: null, atributs: {} },
    { id: 'ruta:acta', tipus: 'ruta', font: null, atributs: {} }
  ],
  arestes: [
    aresta('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
    aresta('hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat'),
    aresta('agent:claude-code', 'document:CLAUDE.md', 'carrega'),
    aresta('document:CLAUDE.md', 'skill:sdp-workflow', 'carrega'),
    aresta('ruta:acta', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    aresta('agent:codex', 'document:_wiki_de_poble/04_escriptori', 'escriu')
  ],
  tasques: [
    { id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: 'tooling/x.mjs', font: null },
    { id: 'setmanal', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 's' }, cadencia: { cron: '0 3 * * 1' }, script: null, font: null },
    { id: 'pre-commit', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: 'x.mjs', font: null },
    { id: 'higiene', estat: 'declarat-sense-llancador', llancador: null, cadencia: null, script: null, font: null }
  ],
  avisos: [
    { node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' },
    { node: 'document:.agents/LEDGER.md', codi: 'ledger-invalid', severitat: 'alta', evidencia: 'signatura del LEDGER no vàlida · 8 segells fòssils' }
  ],
  salut: [metrica('ledger-fossils', { valor: 8, unitat: 'segells fòssils' }), metrica('ledger-mal-formades', { valor: 2, unitat: 'línies mal formades' })]
};
const CONSOLA = {
  generat: '2026-09-25T13:00:00.000Z',
  rebuts: [{ t: '2026-09-20T01:03:39.000Z', peticio: 'ced19fcaab00ffff', protocols: ['a/b.md'], fonts: [{ ruta: 'x', sha256: 'y' }] }],
  consums: [{ agent: 'claude', entrada: 10, eixida: 5 }],
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
  segell: { hash: 'abcdef0123456789', timestamp: '2026-10-02T07:01:17.116Z', filesCount: 2, manifest: { 'a/SKILL.md': '1111', 'b/SKILL.md': '2222' } },
  immunitari: { operacions: 3, ultima: { op: 'OP-3', tipus: 'ADOPTA', fitxer: 'x.md', data: '2026-08-03T13:43:04.716Z' } },
  fonts: { diari: { estat: 'ok', 'línies_descartades': 1 }, immunitari: { estat: 'ok', 'línies_descartades': 0 } },
  termometria: { artefactesActius: 162, abast: 'Escriptori' }
};

const CAMPS = ['id', 'nivell', 'titol', 'ruta', 'text', 'fills'];
const arrel = (...fonts) => indexConsola(...fonts)[0];
const pagina = (index, id) => index.fills.find((f) => f.id === id);
const ids = (nodes) => nodes.map((n) => n.id);
/* Les nou pàgines de la sala de màquines, entre els H3 de l'índex. */
const deLaSala = (index) => index.fills.filter((f) => IDS_PAGINES.includes(f.id));
/* El text pla d'un paràgraf de trossos. */
const pla = (trossos) => (trossos ?? []).map((s) => s.text ?? s.fort ?? s.mono ?? s.enllac).join('');

describe('la jerarquia', () => {
  test('un sol node arrel en H2, amb el títol i el text de l’índex, sense ruta', () => {
    const index = indexConsola();
    expect(index).toHaveLength(1);
    const [a] = index;
    expect(a.id).toBe(ID_INDEX);
    expect(a.nivell).toBe(2);
    expect(a.titol).toBe(TITOL_INDEX);
    expect(a.text).toBe(TEXT_INDEX);
    expect(a.ruta).toBeNull();
    for (const n of nodesDeLIndex(index)) expect(Object.keys(n)).toEqual(expect.arrayContaining(CAMPS));
  });

  /* Ordre del Mestre, 30-10-2026 (/consola, punt 2.3) · L'article recorre el
     tauler sencer, en el seu ordre: «Com es llig la Consola» (l'H3 just
     darrere de l'entradeta), el Govern del Mestre, les nou pàgines, El Mas en
     xifres i els empaquetats. Derogat EN PART: «les nou pàgines i El Mas en
     xifres tancant» (Onada 11). */
  test('els H3: «Com es llig la Consola», el Govern del Mestre, les nou pàgines en l’ordre d’IDS_PAGINES, «El Mas en xifres» i els empaquetats', () => {
    const a = arrel();
    expect(ids(a.fills)).toEqual([ID_INTRO, ID_GOVERN, ...IDS_PAGINES, ID_MAS, ID_EMPAQUETATS]);
    expect(a.fills.every((f) => f.nivell === 3)).toBe(true);
    expect(pagina(a, ID_INTRO).titol).toBe(TITOL_INTRO);
    expect(pagina(a, ID_INTRO).ruta).toBeNull();
    expect(pagina(a, ID_GOVERN).ruta).toBeNull();
    expect(pagina(a, ID_MAS).titol).toBe(TITOL_MAS);
    expect(pagina(a, ID_MAS).ruta).toBeNull();
    expect(pagina(a, ID_EMPAQUETATS).titol).toBe(TITOL_EMPAQUETATS);
    expect(pagina(a, ID_EMPAQUETATS).ruta).toBe(RUTA_EMPAQUETATS);
  });

  test('cada pàgina porta el títol, la ruta, el «per a què» i l’entradeta de paginaConsola', () => {
    for (const f of deLaSala(arrel())) {
      const p = paginaConsola(f.id);
      expect(f.titol).toBe(p.title);
      expect(f.ruta).toBe(p.ruta);
      expect(f.subtitol).toBe(p.subtitle);
      expect(f.subtitol).toMatch(/^Per a /);
      expect(f.text).toBe(p.lead);
    }
  });

  test('nodesDeLIndex aplana en l’ordre del document: l’H2, i cada H3 seguit dels seus H4', () => {
    const index = indexConsola(MAPA, CONSOLA);
    const plans = nodesDeLIndex(index);
    expect(plans[0].nivell).toBe(2);
    let nivellAnterior = 2;
    for (const n of plans.slice(1)) {
      expect([3, 4]).toContain(n.nivell);
      // Un H4 només pot vindre darrere d'un H3 o d'un altre H4, mai directament de l'H2.
      if (n.nivell === 4) expect(nivellAnterior).toBeGreaterThanOrEqual(3);
      nivellAnterior = n.nivell;
    }
    expect(plans).toHaveLength(1 + index[0].fills.reduce((n, f) => n + 1 + f.fills.length, 0));
  });
});

describe('el pols', () => {
  test('els tres panells en H4, en ordre, amb la ruta de rutaPanell i l’entradilla; després, les xifres de la seua vista', () => {
    const pols = pagina(arrel(), 'pols');
    const panells = pols.fills.slice(0, IDS_PANELLS.length);
    expect(ids(panells)).toEqual(IDS_PANELLS.map((id) => `pols/${id}`));
    for (const [i, id] of IDS_PANELLS.entries()) {
      const p = panellPols(id);
      expect(panells[i].nivell).toBe(4);
      expect(panells[i].titol).toBe(p.titol);
      expect(panells[i].ruta).toBe(rutaPanell(id));
      expect(panells[i].ruta).toBe(p.ruta);
      expect(panells[i].text).toBe(p.entradilla);
    }
    expect(panells.map((p) => p.titol)).toEqual(['Càrrega documental', 'Rebuts', 'Skills']);
    // L'entradilla de Skills nomena manifest.yaml entre accents greus: la vista el pinta en <Mono>.
    expect(panells[2].text).toContain('`manifest.yaml`');
    expect(ids(pols.fills.slice(IDS_PANELLS.length))).toEqual(xifresDeVista('pols').map((x) => x.slug));
  });
});

describe('sense Mapa ni consola.json', () => {
  test('cada pàgina porta les seues xifres fixes pel nom, cap peça de família i cap número', () => {
    const a = arrel();
    for (const f of deLaSala(a)) {
      const xifres = f.id === 'pols' ? f.fills.slice(IDS_PANELLS.length) : f.fills;
      expect(ids(xifres), f.id).toEqual(xifresDeVista(f.id).map((x) => x.slug));
      for (const x of xifres) {
        expect(SLUGS_FIXOS, x.id).toContain(x.id);
        expect(x.titol, x.id).not.toMatch(/\d/);
        expect(x.ruta).toBe(rutaXifra(x.id));
        expect(x.text.length).toBeGreaterThan(20);
      }
    }
    // Les pàgines amb famílies de peces (agents, actors) no en poden saber cap sense Mapa.
    expect(ids(pagina(a, 'actors').fills)).toEqual(['agents', 'candats', 'llocs-del-sol']);
    expect(ids(pagina(a, 'agents').fills)).toEqual(['agents-atomics', 'peca-fluxos-de-treball', 'peca-tauler', 'peca-agents-sols', 'peca-vigilants']);
    // Les condicionals del Calendari tampoc.
    expect(ids(pagina(a, 'calendari').fills)).toEqual(['coses-que-corren-soles']);
  });

  test('«El Mas en xifres»: les deu xifres del tauler pel nom, en l’ordre de la graella, cada una amb la seua pàgina', () => {
    const mas = pagina(arrel(), ID_MAS);
    expect(ids(mas.fills)).toEqual(SLUGS_XIFRES);
    expect(mas.fills.map((x) => x.titol)).toEqual(xifresDeLaGraella().map((x) => x.titol));
    for (const x of mas.fills) {
      expect(x.nivell).toBe(4);
      expect(x.titol).not.toMatch(/\d/);
      expect(x.ruta).toBe(rutaXifra(x.id));
    }
  });
});

/* Gauntlet 261030 (cicle 4, corrector de la Consola; troballa
   «redaccio-mecanica-repetida») · Expectativa actualitzada a propòsit: les
   peces d'una família ja no són un H4 cada una (34 llocs del sòl amb la
   mateixa entradeta). Van davall de la xifra que les compta, si la vista la
   pinta just davant, o en un H4 de família; i a la llista només les que
   marquen alguna cosa. El viceversa es conserva: cada xifra de grup és un
   H4, en ordre, i cada peça que marca alguna cosa és un element de llista
   amb l'enllaç a la seua pàgina. Abans: «Cada peça és exactament la que la
   vista pinta, en el mateix ordre», tot en H4. */
const membresDe = (pag) => pag.fills.flatMap((n) => n.membres?.llista ?? []);
const marcaAlgunaCosa = (x) => (x.etiquetes ?? []).some((e) => e.to === 'error' || e.to === 'avis') || Boolean(x.problemes?.length);

describe('amb el Mapa i consola.json de prova', () => {
  test('les xifres de grup són H4 en l’ordre de la vista; les peces de família, davall de la xifra que les compta o en el seu H4 de família', () => {
    const a = arrel(MAPA, CONSOLA);
    for (const f of deLaSala(a)) {
      const xifres = (f.id === 'pols' ? f.fills.slice(IDS_PANELLS.length) : f.fills).filter((n) => !n.id.startsWith('familia/'));
      const deGrup = (VISTES_XIFRES[f.id] ?? []).filter((tros) => tros.grup).flatMap((tros) => xifresDeGrup(tros.grup, MAPA, CONSOLA));
      expect(ids(xifres), f.id).toEqual(deGrup.map((x) => x.slug));
      expect(xifres.map((x) => x.titol), f.id).toEqual(deGrup.map((x) => x.titol));
      const peces = (VISTES_XIFRES[f.id] ?? []).filter((tros) => tros.familia).flatMap((tros) => xifresDeFamilia(tros.familia, MAPA, CONSOLA));
      expect(membresDe(f).map((m) => m.id), f.id).toEqual(peces.filter(marcaAlgunaCosa).map((x) => x.slug));
    }
    const actors = pagina(a, 'actors');
    // Cap peça de família és un H4.
    expect(actors.fills.filter((n) => /^(arnes|carregador|candat|tasca|lloc|agent-atomic)-/.test(n.id))).toEqual([]);
    // Els arnesos, davall de la xifra que els compta; les tasques, en el seu H4 de família (davant hi ha els candats).
    expect(actors.fills.find((n) => n.id === 'agents').membres.definicio.length).toBeGreaterThan(0);
    const tasques = actors.fills.find((n) => n.id === 'familia/tasca');
    expect(tasques.nivell).toBe(4);
    expect(tasques.ruta).toBeNull();
    expect(tasques.text).toContain('Una tasca programada és una faena que launchd llança sola');
    expect(actors.fills.find((n) => n.id === 'llocs-del-sol').membres.llista.map((m) => m.id)).toEqual(['lloc-wiki-de-poble-04-escriptori']);
    // La definició de la família no repetix cap frase que la xifra que la compta ja diu.
    for (const n of actors.fills.filter((x) => x.membres?.definicio)) {
      for (const frase of pla(n.membres.definicio).split(/(?<=\.)\s+/)) expect(n.text, `${n.id}: ${frase}`).not.toContain(frase);
    }
    expect(ids(actors.fills)).toContain('tasques-sense-llancador');
    expect(ids(pagina(a, 'calendari').fills)).toContain('cadencia-dia');
    expect(ids(pagina(a, ID_MAS).fills)).toEqual(SLUGS_XIFRES);
    expect(pagina(a, ID_MAS).fills.map((x) => x.titol)).toEqual(xifresDeLaGraella(MAPA).map((x) => x.titol));
  });

  test('cada H4 d’una xifra té pàgina pròpia amb les fonts d’ara (el viceversa) i la ruta de rutaXifra; cada peça de la llista, també', () => {
    const ambPagina = targetesDeLaConsola(MAPA, CONSOLA);
    const deXifra = (x) => x.nivell === 4 && !/^(pols|govern|empaquetats|familia)\//.test(x.id);
    const nodes = nodesDeLIndex(indexConsola(MAPA, CONSOLA));
    for (const n of nodes.filter(deXifra)) {
      expect(ambPagina.has(n.id), n.id).toBe(true);
      expect(n.ruta).toBe(rutaXifra(n.id));
    }
    const llista = nodes.flatMap((n) => n.membres?.llista ?? []);
    expect(llista.length).toBeGreaterThan(2);
    for (const m of llista) {
      expect(ambPagina.has(m.id), m.id).toBe(true);
      expect(m.trossos[0].ruta, m.id).toBe(rutaXifra(m.id));
    }
  });

  test('una peça amb ruta al títol porta la seua versió privada; les altres, cap', () => {
    const actors = pagina(arrel(MAPA, CONSOLA), 'actors');
    const lloc = membresDe(actors).find((m) => m.id.startsWith('lloc-'));
    expect(lloc.trossos[0]).toMatchObject({ enllac: '04_escriptori', privat: 'Lloc del sòl' });
    const arnes = membresDe(actors).find((m) => m.id === 'arnes-codex');
    expect(arnes.trossos[0]).toEqual({ enllac: 'Codex', ruta: rutaXifra('arnes-codex') });
    expect(pagina(arrel(), 'pols').fills[0].titolPrivat).toBeNull();
  });
});

/* Onada 12 (261011; ordres 261011_0130, punt 2) · Les il·lustracions de
   l'índex: una sola taula (IMATGES_INDEX), cap ruta inventada (el fitxer és
   al disc, dins de public/) i cap text alternatiu propi (és el de la font
   que ja pinta eixa imatge).
   Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla 261013_1405,
   front F): les miniatures d'explorador i salut. Les il·lustracions de les
   pàgines van a les capçaleres de les seues targetes del tauler
   (imatgesConsola.js, la taula única, que imatgesConsola.test.js prova contra
   el disc i les fonts), i l'Índex només conserva la de l'H2: una imatge no es
   pinta dues vegades a /consola (lliçó 261010 de sdp-universal-page). */
const PUBLIC = path.join(process.cwd(), 'public');
const alDisc = (ruta) => path.join(PUBLIC, ...ruta.split('/').filter(Boolean));
const esFitxerAmbPes = (ruta) => existsSync(alDisc(ruta)) && statSync(alDisc(ruta)).isFile() && statSync(alDisc(ruta)).size > 0;

/* Ordre del Mestre, 30-10-2026 (/consola, punt 2.1: «Fora la miniatura
   repetida») · Derogat: «l'Índex només conserva la de l'H2» i la taula
   IMATGES_INDEX. La vinyeta de la Consola ja és la portada de /page/consola i
   de la seua targeta del Mur (IMATGES_CONSOLA.index, que imatgesConsola.test.js
   continua provant contra el disc); l'Índex no en pinta cap. */
describe('les il·lustracions', () => {
  test('cap node de l’índex porta il·lustració, ni l’H2: la taula IMATGES_INDEX ja no existix', () => {
    expect('IMATGES_INDEX' in modulIndex).toBe(false);
    for (const fonts of [[], [MAPA, CONSOLA]]) {
      for (const n of nodesDeLIndex(indexConsola(...fonts))) {
        expect(n.imatge, n.id).toBeUndefined();
        expect(n.imatgeAlt, n.id).toBeUndefined();
      }
    }
    // La vinyeta de la Consola continua viva per a la seua portada i la seua targeta.
    expect(esFitxerAmbPes(IMATGES_CONSOLA.index.imatge), IMATGES_CONSOLA.index.imatge).toBe(true);
  });
});

/* Onada 12 (261011; ordres 261011_0130, punt 2) · Llei Visual del quadrat:
   «Totes les imatges a la Consola s'han de visualitzar sempre de forma
   quadrada». La regla (modules.css § CONSOLA; src/css/imatgesASang.capes.test.js)
   cobrix les dues úniques imatges de contingut que la Consola sap pintar: el
   mitjà d'una TargetaConsola i la miniatura de l'Índex. Esta prova tanca els
   altres dos camins, perquè ningú no n'òbriga un sense passar per la llei:
    · cap <img> escrit a mà dins de la secció que no porte la classe de la llei;
    · cap xifra ni peça porta `imatge` (xifresMas.js: «Cap xifra no porta
      imatge encara»). Si un dia en porta, la seua targeta ja ix quadrada
      (TargetaConsola), però la portada de la seua pàgina (PaginaXifra →
      PaginaApp, .hero-image) NO: caldrà estendre la llei a eixa portada
      abans de posar-la. Esta asserció és l'avís. */
describe('Llei Visual del quadrat · els camins d’imatge de la Consola', () => {
  const SECCIO = path.join(process.cwd(), 'src/sections/consola');
  const jsx = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ple = path.join(dir, e.name);
    if (e.isDirectory()) return jsx(ple);
    return /\.jsx$/.test(e.name) && !/\.test\.jsx$/.test(e.name) ? [ple] : [];
  });

  /* Ordre del Mestre, 30-10-2026 (/consola, punt 2.1) · Derogat EN PART: la
     miniatura de l'Índex era l'única <img> escrita a mà a la secció. Ara no
     n'hi ha cap: tota imatge de la Consola passa per la Targeta Universal. */
  test('cap <img> escrita a mà a la secció: tota imatge passa per la targeta', () => {
    const imatges = jsx(SECCIO).flatMap((fitxer) => [...readFileSync(fitxer, 'utf8').matchAll(/<img\b[^>]*>/g)]
      .map((m) => [path.relative(SECCIO, fitxer), m[0].replace(/\s+/g, ' ')]));
    expect(imatges).toEqual([]);
  });

  test('cap xifra ni cap peça porta imatge: la portada de la seua pàgina no es pinta', () => {
    const totes = [
      ...xifresDeLaGraella(), ...xifresDeLaGraella(MAPA),
      ...IDS_PAGINES.flatMap((id) => [...xifresDeVista(id), ...xifresDeVista(id, MAPA, CONSOLA)])
    ];
    expect(totes.length).toBeGreaterThan(20);
    for (const x of totes) expect(x.imatge, x.slug).toBeNull();
  });
});

/* Les 18 il·lustracions de MarIA (14 vinyetes i 4 nano cards) que les ordres
   donen per llestes: totes se servixen ja des de public/, i d'ací les prenen
   l'índex, el Panell de Control, el Mur i les pàgines. La zona humana
   (01_produccio) no es llig ni s'importa. */
describe('les 18 il·lustracions de les ordres', () => {
  const VINYETES = ['animalets', 'bascula', 'cervell', 'consola', 'disseny', 'gestoria', 'habitatge', 'mapa', 'rebost', 'rss', 'salut', 'tpv', 'treball', 'vehicle'];
  const NANO_CARDS = ['calendari', 'mercat', 'mur', 'snippet'];
  /* Les vinyetes de la carpeta que no són de les 18 de les ordres: la portada
     còmic de /fedivers (ESTAT 261014_1505; src/sections/text/pageContent.js). */
  const ALTRES_VINYETES = ['fedivers'];
  /* La nano card del Mercat només viu com a bessona .webp: l'original .jpg es
     va retirar a 1d45fb1a, i censImatges, legacyMedia, pageContent i la prova
     del Panell de Control ja la nomenen així. */
  const NOMES_BESSONA = new Set(['mercat']);
  /* Expectativa actualitzada a propòsit (ordre del Mestre, 261021, torn fase
     2, Mòdul B, P0-14) · Com la del Mercat, huit vinyetes ja només viuen com
     a WebP: el seu original .jpg ix de public/ (evacuat a
     _multimedia_de_poble/originals_raster_public/) i la bessona, amb les
     mateixes mides, és la il·lustració. Abans: les 15 eren .jpg. La Bàscula,
     el Cervell, la Consola i Disseny es conserven al disc en .jpg (cap
     esborrat, registrePlugins.test.js) i la Gestoria també (la cita una ADR
     viva de la Wiki). */
  const VINYETES_NOMES_WEBP = new Set(['animalets', 'fedivers', 'habitatge', 'mapa', 'rebost', 'salut', 'treball', 'vehicle']);
  const extensioDeVinyeta = (id) => (VINYETES_NOMES_WEBP.has(id) ? 'webp' : 'jpg');

  test('les 14 vinyetes i les 4 nano cards són a public/, amb pes', () => {
    const rutes = [
      ...VINYETES.map((id) => `/assets/ui/plugins/${id}_vinyeta.${extensioDeVinyeta(id)}`),
      ...NANO_CARDS.map((id) => `/assets/nano_cards/${id}_nano_card.${NOMES_BESSONA.has(id) ? 'webp' : 'jpg'}`)
    ];
    expect(rutes).toHaveLength(18);
    for (const ruta of rutes) expect(esFitxerAmbPes(ruta), ruta).toBe(true);
    for (const id of ALTRES_VINYETES) expect(esFitxerAmbPes(`/assets/ui/plugins/${id}_vinyeta.${extensioDeVinyeta(id)}`), id).toBe(true);
    // La carpeta de vinyetes no en porta cap altra: les 14 i les ALTRES_VINYETES són totes les que hi ha.
    // Pla 261029_0216 (R-01) · La variant social d'una vinyeta (-social-1200x630.jpg,
    // imatgeSocial.js · VARIANTS_SOCIALS) només va al <head>: no és cap vinyeta.
    const delDisc = readdirSync(alDisc('/assets/ui/plugins')).filter((f) => !f.endsWith('-social-1200x630.jpg'));
    expect(delDisc.filter((f) => f.endsWith('.jpg')).sort())
      .toEqual([...VINYETES, ...ALTRES_VINYETES].filter((id) => !VINYETES_NOMES_WEBP.has(id)).map((id) => `${id}_vinyeta.jpg`).sort());
    // Cada una té la seua .webp (la bessona o, sense original, la il·lustració), i cap altra.
    expect(delDisc.filter((f) => f.endsWith('.webp')).sort())
      .toEqual([...VINYETES, ...ALTRES_VINYETES].map((id) => `${id}_vinyeta.webp`).sort());
  });
});

/* Ordre del Mestre, 30-10-2026 (/consola, punt 2.3: «Redacció DIDÀCTICA,
   viva i ben lligada amb les dades reals de les targetes») · Cada H3 i cada
   H4 fa els tres moviments: què és (i, als H3, en paraules planes), què
   diuen ara les dades i què està en ordre i què queda, amb l'enllaç. El que
   diu ix de les funcions de les targetes; sense font, ho diu i no inventa. */
const HEAD = '7a1828ca779ef74284846c9e5a4122cd23945689';
const fila = (id, status, extra = {}) => ({
  id, source: '§0.5', requirement: `Requeriment ${id}`, status, evidence: 'Prova verda.',
  owner: 'Claude implementa; Codex verifica', priority: 'P2', acceptance: 'Prova del flux d’usuari.', ...extra
});
const ARA = Date.parse('2026-10-30T14:00:00.000Z');
const GOVERN = {
  servidor: { estat: 'ready' },
  head: HEAD,
  trasllat: null,
  certificacions: { registres: [{ id: 'x' }, { id: 'y' }], persistent: true },
  matriu: normalitzaMcr({
    at: new Date(ARA - 60 * 60 * 1000).toISOString(),
    baseline_head: HEAD,
    requirements: [
      fila('F04', '[FET I SEGELLAT]'), fila('F01', '[PARCIAL]', { priority: 'P1' }),
      fila('I09', '[NO FET / PENDENT]', { priority: 'P1' }), fila('G04', '[NO FET / PENDENT]', { owner: 'Codex' })
    ]
  })
};
const EMPAQUETATS = {
  estat: 'ready',
  valor: normalitzaEmpaquetats({
    schema: 'sdp.empaquetats.v1', generat: '2026-10-30T13:00:00.000Z', canonica: VERSIO_SISTEMA, carpeta: true,
    plataformes: {
      android: { versions: [VERSIO_SISTEMA], builds: ['1'], font: 'android/app/build.gradle', artefactes: [`261023_socdepoble_${VERSIO_SISTEMA}+1.aab`] },
      ios: { versions: [VERSIO_SISTEMA], builds: ['1'], font: 'ios/App/App.xcodeproj/project.pbxproj', artefactes: [] },
      pwa: { versions: [VERSIO_SISTEMA], font: 'package.json', artefactes: [] },
      wordpress: { versions: ['1.1.10'], estable: '1.1.9', font: 'wordpress-plugin/socdepoble-enxufe.php', artefactes: ['261029_1606_wordpress_directori_v1.1.10.zip'] }
    }
  })
};
const ambTot = () => indexConsola(MAPA, CONSOLA, 'ca-ES', { govern: GOVERN, empaquetats: EMPAQUETATS, ara: ARA });

describe('la redacció didàctica', () => {
  test('cada H3 i cada H4 fa els tres moviments: què és, què diuen ara les dades i què queda; els H3, també en paraules planes', () => {
    for (const index of [indexConsola(), ambTot()]) {
      for (const n of nodesDeLIndex(index).filter((x) => x.nivell > 2)) {
        expect(n.text.length, n.id).toBeGreaterThan(20);
        expect(pla(n.diu).length, n.id).toBeGreaterThan(10);
        expect(pla(n.queda).length, n.id).toBeGreaterThan(10);
        // Cada moviment obri amb unes paraules en negreta: es pot llegir a salts de vista.
        expect(n.diu[0].fort, n.id).toBeTruthy();
        expect(n.queda[0].fort, n.id).toBeTruthy();
        if (n.nivell === 3) {
          expect(n.explica.length, n.id).toBeGreaterThan(0);
          for (const p of n.explica) {
            expect(pla(p).length, n.id).toBeGreaterThan(80);
            expect(p.filter((s) => s.fort).length, n.id).toBeGreaterThan(1);
          }
        }
      }
    }
  });

  test('sense fonts no s’inventa cap número: cada pàgina diu per què no hi ha dades i què hi veu qui té accés', () => {
    const a = arrel();
    for (const f of deLaSala(a)) {
      expect(pla(f.diu), f.id).not.toMatch(/\d/);
      expect(pla(f.diu), f.id).toContain('Qui obri la Consola al servidor local hi veu');
      // Gauntlet 261030 (cicle 4) · l'etiqueta de la seua targeta (etiquetesPagina): «Sense font». Abans: «Sense font, sense semàfor».
      expect(pla(f.queda), f.id).toMatch(/^Sense font: /);
      for (const x of f.fills) {
        expect(pla(x.diu), x.id).not.toMatch(/\d/);
        expect(pla(x.queda), x.id).not.toMatch(/\d/);
      }
    }
    for (const id of [ID_GOVERN, ID_MAS, ID_EMPAQUETATS]) {
      const n = pagina(a, id);
      for (const x of [n, ...n.fills]) expect(pla(x.diu) + pla(x.queda), x.id).not.toMatch(/\d/);
    }
    // L'únic número és el recompte de les nou pàgines pel seu semàfor: sense font, totes.
    expect(pla(pagina(a, ID_INTRO).queda)).toContain('9 sense font');
    expect(pla(pagina(a, ID_INTRO).diu)).toMatch(/^Ara mateix, en este entorn, la Consola no llig cap font/);
  });

  test('amb fonts, cada pàgina diu el que calcula la seua targeta: les mètriques, el semàfor, el que queda i quants casos', () => {
    const fonts = { mapa: MAPA, dades: CONSOLA, estatMapa: 'ready', estatDades: 'ready' };
    for (const f of deLaSala(arrel(MAPA, CONSOLA, 'ca-ES', { ara: ARA }))) {
      const diu = pla(f.diu);
      for (const mesura of mesuresPagina(f.id, fonts)) expect(diu, f.id).toContain(mesura);
      const queda = pla(f.queda);
      const etiqueta = etiquetesPagina(f.id, fonts, undefined, ARA)[0];
      if (etiqueta) expect(f.queda[0].fort, f.id).toBe(etiqueta.text);
      for (const e of estatsPagina(f.id, fonts, ARA).filter((x) => x.to === 'error' || x.to === 'avis')) {
        expect(queda, f.id).toContain(e.text[0].toLocaleLowerCase('ca') + e.text.slice(1));
      }
      const n = problemesPagina(f.id, fonts).length;
      if (n) expect(queda, f.id).toContain(`(${n} ${n === 1 ? 'cas' : 'casos'})`);
      // Cada H3 acaba portant a la seua pàgina.
      expect(f.queda.filter((s) => s.enllac).map((s) => s.ruta), f.id).toContain(paginaConsola(f.id).ruta);
    }
  });

  /* Gauntlet 261030 (cicle 4; troballes «moviment-diu-buit-o-redundant» i
     «frases-falses-o-ambigues», e) · Una xifra es titula pel seu nom quan el
     títol amb dades és el mateix que sense (el seu nom): llavors diu només
     el subtítol. Si no, el títol i el subtítol, també quan el títol no porta
     cap dígit: «LEDGER amb la signatura trencada» és el fet. Abans es
     decidia per si el títol portava un dígit. */
  test('cada xifra diu ara el que diu la seua targeta: el títol i el subtítol; una xifra que es titula pel seu nom, només el subtítol', () => {
    const a = arrel(MAPA, CONSOLA, 'ca-ES', { ara: ARA });
    // Sense fonts, el títol de cada xifra és el seu nom.
    const noms = new Map([...xifresDeLaGraella(), ...IDS_PAGINES.flatMap((id) => xifresDeVista(id))].map((x) => [x.slug, x.titol]));
    let ambNom = 0;
    for (const f of deLaSala(a)) {
      const vista = new Map(xifresDeVista(f.id, MAPA, CONSOLA).map((x) => [x.slug, x]));
      for (const n of f.fills.filter((x) => vista.has(x.id))) {
        const x = vista.get(n.id);
        if (x.titol !== noms.get(x.slug) || !x.subtitol) {
          expect(pla(n.diu), n.id).toBe(`Ara mateix: ${x.titol}${x.subtitol ? ` · ${x.subtitol}` : ''}.`);
        } else {
          ambNom += 1;
          expect(pla(n.diu), n.id).toBe(`Ara mateix: ${x.subtitol}.`);
        }
      }
    }
    expect(ambNom).toBeGreaterThan(0);
    const ledger = pagina(a, 'salut').fills.find((n) => n.id === 'linies-ledger');
    expect(ledger.titol).toBe('LEDGER amb la signatura trencada');
    expect(pla(ledger.diu)).toMatch(/^Ara mateix: LEDGER amb la signatura trencada · /);
  });

  test('els enllaços dels paràgrafs porten a pàgines que ja són títols de l’índex', () => {
    const nodes = nodesDeLIndex(ambTot());
    const rutes = new Set(nodes.map((n) => n.ruta).filter(Boolean));
    const enllacos = nodes.flatMap((n) => [n.diu, n.queda, ...(n.explica ?? [])]).flat().filter((s) => s?.enllac);
    expect(enllacos.length).toBeGreaterThan(9);
    for (const s of enllacos) expect(rutes.has(s.ruta), s.ruta).toBe(true);
  });

  test('el Govern del Mestre diu el que diu la matriu: el recompte, les P1 obertes i les decisions d’este navegador', () => {
    const govern = pagina(ambTot()[0], ID_GOVERN);
    expect(govern.fills.map((x) => [x.id, x.ruta])).toEqual(paginesGovern().map((p) => [`govern/${p.id}`, rutaGovern(p.id)]));
    const vista = vistaMatriu(GOVERN.matriu, { head: HEAD, ara: ARA });
    expect(vista.caducitat.obsoleta).toBe(false);
    const de = (id) => govern.fills.find((x) => x.id === `govern/${id}`);
    expect(pla(de('requeriments').diu)).toBe(`Ara mateix: ${fraseDeRecompte(recompteVist(vista.files))}.`);
    expect(pla(de('requeriments').diu)).toBe('Ara mateix: 1 fet i segellat, 1 a mitges i 2 per a la tanda següent.');
    expect(pla(de('balanc').diu)).toBe('Ara mateix: 4 demanats, 1 fet i 3 a la tanda següent.');
    expect(pla(de('certificacio').diu)).toBe('Ara mateix: 2 decisions apuntades en este navegador.');
    expect(pla(de('comunicacio').diu)).toBe('Ara mateix: 2 P1 obertes i 2 responsables.');
    expect(pla(de('comunicacio').queda)).toContain('F01 i I09');
    expect(pla(govern.diu)).toContain('La matriu té 4 requeriments');
    expect(govern.queda[0].fort).toBe('Important');
    // Sense matriu, cap número: diu d'on arriba i què s'hi llig quan hi és.
    const sense = pagina(arrel(), ID_GOVERN);
    expect(pla(sense.diu)).toMatch(/^Ara mateix no hi ha cap matriu connectada: arriba pel servidor local .*Amb ella, ací es llig quants requeriments/);
    // Gauntlet f4b (govern) · Des de B2 la ruta existix: cap pas pendent de MarIA. Derogat: «(el pas que la connecta és de MarIA)».
    expect(pla(sense.diu)).not.toMatch(/MarIA|el pas que la connecta/);
  });

  test('els empaquetats diuen la Versió Canònica, quantes plataformes van al pas i quina no', () => {
    const emp = pagina(ambTot()[0], ID_EMPAQUETATS);
    expect(emp.fills.map((x) => x.titol)).toEqual(PLATAFORMES.map((p) => p.nom));
    expect(pla(emp.diu)).toContain(`la Versió Canònica del Sistema és v${VERSIO_SISTEMA}, i hi van al pas 2 de 3 plataformes (1 desfasada)`);
    expect(emp.queda[0].fort).toBe('Important');
    expect(pla(emp.queda)).toContain('no van al pas: Connector de WordPress');
    expect(emp.queda.filter((s) => s.enllac).map((s) => s.ruta)).toEqual([RUTA_EMPAQUETATS]);
    const wp = emp.fills.find((x) => x.id === 'empaquetats/wordpress');
    // Gauntlet 261030 (cicle 4) · Què declara és el motiu del seu semàfor, una sola vegada. Abans: «declara 1.1.10. La capçalera…».
    expect(pla(wp.diu)).toBe('Ara mateix: la capçalera diu 1.1.10 i el canal estable, 1.1.9.');
    expect(wp.queda[0].fort).toBe('Desfasat');
    const android = emp.fills.find((x) => x.id === 'empaquetats/android');
    expect(pla(android.diu)).toBe(`Ara mateix: declara ${VERSIO_SISTEMA}, la Versió Canònica del Sistema. Porta la build 1.`);
    // Hipervincles vius: cada plataforma porta a la pàgina dels empaquetats, on viu el seu detall.
    expect(emp.fills.map((x) => x.ruta)).toEqual(PLATAFORMES.map(() => RUTA_EMPAQUETATS));
  });

  test('trossosMarcats: els accents greus fan un fitxer, els dos asteriscs una negreta, i cap tros buit', () => {
    expect(trossosMarcats('Llig **el Mapa** (`mapa.json`) i res més.')).toEqual([
      { text: 'Llig ' }, { fort: 'el Mapa' }, { text: ' (' }, { mono: 'mapa.json' }, { text: ') i res més.' }
    ]);
    expect(trossosMarcats('')).toEqual([]);
    expect(trossosMarcats(null)).toEqual([]);
  });
});

/* Gauntlet 261030 (cicle 4, corrector de la Consola) · Les troballes dels
   crítics sobre la redacció de l'Índex (punt 2.3), cada una amb la seua
   prova. Els textos que es fixen literalment són els que l'Índex ha de dir;
   la resta es compara amb les funcions de les targetes. */
const tots = (index) => nodesDeLIndex(index).flatMap((n) => [
  trossosMarcats(n.text), ...(n.explica ?? []), n.diu, n.queda, n.membres?.definicio, n.membres?.resum,
  ...(n.membres?.llista ?? []).map((m) => m.trossos)
]).filter((p) => p?.length);
const fila3 = (id, status, priority = 'P2') => fila(id, status, { priority });
const governAmb = (requirements, extra = {}) => ({
  ...GOVERN, ...extra,
  matriu: normalitzaMcr({ at: new Date(ARA - 60 * 60 * 1000).toISOString(), baseline_head: HEAD, requirements })
});
const deGovern = (govern) => pagina(indexConsola(null, null, 'ca-ES', { govern, ara: ARA })[0], ID_GOVERN);
const fill = (n, id) => n.fills.find((x) => x.id === id);
const AMB_ERROR = {
  estatMapa: 'error', estatDades: 'error', empaquetats: { valor: null, estat: 'error' }, ara: ARA,
  govern: { matriu: null, head: null, trasllat: null, certificacions: { registres: [], persistent: true }, servidor: { estat: 'error' } }
};

describe('el Govern no fabrica cap verd (troballa P1 «govern-verd-fabricat»)', () => {
  test('una fila amb un estat que no s’entén («[FET]») no deixa dir «En ordre»: es diu per tornar a comprovar', () => {
    const g = deGovern(governAmb([fila3('R1', '[FET I SEGELLAT]'), fila3('R2', '[FET I SEGELLAT]'), fila3('R3', '[FET]')]));
    const req = fill(g, 'govern/requeriments');
    expect(pla(req.diu)).toBe('Ara mateix: 2 fets i segellats, 0 a mitges, 0 per a la tanda següent i 1 per tornar a comprovar.');
    expect(req.queda[0].fort).toBe('Queda faena');
    expect(pla(req.queda)).toContain('1 fila per tornar a comprovar');
    expect(g.queda[0].fort).toBe('Queda faena');
    expect(pla(g.queda)).toContain('1 fila per tornar a comprovar');
    for (const x of [g, ...g.fills]) expect(pla(x.queda), x.id).not.toMatch(/^En ordre/);
  });

  test('una P2 pendent tampoc: queda per a la tanda següent; «En ordre» només amb totes les files fetes i segellades', () => {
    const pendent = deGovern(governAmb([fila3('R1', '[FET I SEGELLAT]'), fila3('R2', '[NO FET / PENDENT]')]));
    expect(pla(fill(pendent, 'govern/requeriments').queda)).toBe('Queda faena: 1 per a la tanda següent.');
    expect(pla(pendent.queda)).toBe('Queda faena: cap P1 oberta, però 1 per a la tanda següent.');
    const fet = deGovern(governAmb([fila3('R1', '[FET I SEGELLAT]'), fila3('R2', '[FET I SEGELLAT]', 'P1')]));
    expect(fill(fet, 'govern/requeriments').queda[0].fort).toBe('En ordre');
    expect(fet.queda[0].fort).toBe('En ordre');
    // Una matriu sense cap fila no és cap verd.
    const buida = deGovern(governAmb([]));
    expect(fill(buida, 'govern/requeriments').queda[0].fort).toBe('Matriu buida');
    expect(buida.queda[0].fort).toBe('Queda faena');
  });

  test('les etiquetes dels H4 del Govern són les de les seues targetes: Hi ha P1 obertes, Cap P1 oberta i, sense matriu, Sense font', () => {
    const g = pagina(ambTot()[0], ID_GOVERN);
    expect(fill(g, 'govern/comunicacio').queda[0].fort).toBe('Hi ha P1 obertes');
    expect(fill(deGovern(governAmb([fila3('R1', '[FET I SEGELLAT]')])), 'govern/comunicacio').queda[0].fort).toBe('Cap P1 oberta');
    const trasllat = deGovern(governAmb([fila3('R1', '[NO FET / PENDENT]')], { trasllat: { ids: ['R9'], duplicats: [] } }));
    expect(pla(fill(trasllat, 'govern/balanc').queda)).toBe('El trasllat no quadra: en falten 1 i en sobren 1.');
    const sense = pagina(arrel(), ID_GOVERN);
    for (const id of ['requeriments', 'balanc', 'comunicacio']) expect(fill(sense, `govern/${id}`).queda[0].fort).toBe(ETIQUETES.senseFont.text);
    expect(sense.queda[0].fort).toBe(ETIQUETES.senseFont.text);
  });
});

describe('una font que falla o es carrega diu el mateix que la seua targeta (troballes «estat-error-contradiu-targetes»)', () => {
  test('amb l’última lectura fallida, cada bloc diu «Cal reparar» com la seua targeta, i enlloc «sense semàfor»', () => {
    const a = indexConsola(null, null, 'ca-ES', AMB_ERROR)[0];
    const fonts = { mapa: null, dades: null, estatMapa: 'error', estatDades: 'error' };
    for (const f of deLaSala(a)) {
      const etiqueta = etiquetesPagina(f.id, fonts, undefined, ARA)[0];
      expect(etiqueta, f.id).toBe(ETIQUETES.reparar);
      expect(f.queda[0].fort, f.id).toBe(etiqueta.text);
      expect(pla(f.queda), f.id).toContain('ha fallat');
    }
    const pols = pagina(a, 'pols');
    for (const id of IDS_PANELLS) expect(fill(pols, `pols/${id}`).queda[0].fort, id).toBe(etiquetesPols(null, 'error', ARA)[id][0].text);
    const govern = pagina(a, ID_GOVERN);
    for (const id of ['requeriments', 'balanc', 'comunicacio']) expect(fill(govern, `govern/${id}`).queda[0].fort, id).toBe(ETIQUETES.reparar.text);
    expect(govern.queda[0].fort).toBe(ETIQUETES.reparar.text);
    expect(pagina(a, ID_EMPAQUETATS).queda[0].fort).toBe(cobertaEmpaquetats(null, 'error').etiquetes[0].text);
    const text = tots([a]).map(pla).join('\n');
    expect(text).not.toMatch(/sense semàfor/i);
    expect(text).not.toMatch(/només (arriba|es llig) (pel|al) servidor local/);
    // La introducció i els blocs ja no es contradiuen: 9 per reparar, i cada bloc ho diu.
    expect(pla(pagina(a, ID_INTRO).queda)).toContain('9 per reparar');
    expect(pla(pagina(a, ID_INTRO).diu)).toContain('torna a provar-ho amb Refrescar');
  });

  test('mentre es carrega, cap etiqueta inventada: «Encara es carrega», i cap xifra diu «Sense dades en este entorn»', () => {
    const a = indexConsola(null, null, 'ca-ES', {
      estatMapa: 'loading', estatDades: 'loading', empaquetats: { valor: null, estat: 'loading' }, ara: ARA,
      govern: { matriu: null, head: null, trasllat: null, certificacions: { registres: [], persistent: true }, servidor: { estat: 'loading' } }
    })[0];
    for (const f of deLaSala(a)) expect(f.queda[0].fort, f.id).toBe('Encara es carrega');
    for (const n of nodesDeLIndex([a]).filter((x) => x.nivell === 4 && !x.id.startsWith('govern/certificacio'))) {
      expect(pla(n.diu), n.id).not.toMatch(/^Sense dades en este entorn/);
    }
    expect(fill(pagina(a, ID_GOVERN), 'govern/requeriments').diu[0].fort).toBe('Encara es llig la matriu');
  });

  test('el motiu és una frase sencera: «l’última lectura de <font> ha fallat», «<font> encara s’està carregant»', () => {
    const error = indexConsola(null, null, 'ca-ES', AMB_ERROR)[0];
    expect(pla(pagina(error, 'pols').diu)).toContain('Ara mateix no hi ha dades: l’última lectura de consola.json ha fallat.');
    expect(pla(pagina(error, 'explorador').diu)).toContain('l’última lectura del Mapa del Mas (mapa.json) ha fallat.');
    expect(pla(pagina(error, ID_EMPAQUETATS).diu)).toContain('l’última lectura de /__iaia/empaquetats.json ha fallat.');
    expect(pla(pagina(error, ID_MAS).diu)).toBe('Ara mateix no hi ha Mapa: l’última lectura del Mapa del Mas (mapa.json) ha fallat. Les deu targetes només porten el seu nom; amb el Mapa, cada una hi porta el seu recompte i el seu semàfor.');
    const text = tots([error]).map(pla).join('\n');
    expect(text).not.toMatch(/json\)? l’última lectura/);
    expect(text).not.toContain('Qui obri la Consola al servidor local');
    const carrega = indexConsola(null, null, 'ca-ES', { estatMapa: 'loading', estatDades: 'loading', ara: ARA })[0];
    expect(pla(pagina(carrega, 'pols').diu)).toContain('Ara mateix no hi ha dades: consola.json encara s’està carregant.');
  });
});

describe('cada moviment diu el fet, una sola vegada (troballes «moviment-diu-buit-o-redundant» i «frases-falses-o-ambigues»)', () => {
  test('l’alerta de vigilància diu quin avís és i enllaça la seua xifra', () => {
    const queda = pagina(arrel(MAPA, CONSOLA), ID_INTRO).queda;
    expect(pla(queda)).toContain('té 1 avís obert: la signatura del LEDGER no és vàlida (la seua xifra: LEDGER amb la signatura trencada)');
    expect(pla(queda)).not.toContain('el segell de les skills o la signatura del LEDGER');
    expect(queda.filter((s) => s.enllac).map((s) => s.ruta)).toContain(rutaXifra('linies-ledger'));
  });

  test('l’estat d’una peça es diu en minúscula i amb el que vol dir; cap paràgraf no el deixa en majúscules sense explicar', () => {
    expect(Object.keys(SIGNIFICAT_ESTAT).sort()).toEqual(Object.keys(COLOR_D_ESTAT).sort());
    const index = arrel(MAPA, CONSOLA, 'ca-ES', { ara: ARA });
    const intro = pla(pagina(index, ID_INTRO).explica.at(-1));
    for (const [k, que] of Object.entries(SIGNIFICAT_ESTAT)) expect(intro, k).toContain(`${k} (${que})`);
    const resta = tots([index]).filter((p) => p !== pagina(index, ID_INTRO).explica.at(-1)).map(pla);
    for (const k of Object.keys(SIGNIFICAT_ESTAT)) {
      for (const p of resta) expect(p.includes(`${k}:`) || p.includes(`${k} ·`), `${k} a «${p}»`).toBe(false);
    }
    const mort = membresDe(pagina(index, 'actors')).find((m) => m.id === 'tasca-setmanal');
    expect(pla(mort.trossos)).toContain(': mort, havia de córrer i no corre');
  });

  test('el tercer moviment d’un H4 nomena els problemes com la seua coberta (resumDeProblemes), no només quants són', () => {
    const salut = pagina(arrel(MAPA, CONSOLA, 'ca-ES', { ara: ARA }), 'salut');
    const ledger = fill(salut, 'linies-ledger');
    const x = xifresDeVista('salut', MAPA, CONSOLA).find((y) => y.slug === 'linies-ledger');
    const { visibles } = resumDeProblemes(x.problemes);
    expect(visibles.length).toBeGreaterThan(0);
    for (const l of visibles) expect(pla(ledger.queda)).toContain(`${l.marca} ${l.text}`);
    expect(pla(ledger.queda)).not.toMatch(/casos? per resoldre/);
  });

  test('sense fonts, només callen les targetes de la sala de màquines i del Mas en xifres; la certificació compta', () => {
    const diu = pla(pagina(arrel(), ID_INTRO).diu);
    expect(diu).not.toContain('cap targeta porta números');
    expect(diu).toContain('les targetes de la sala de màquines i del Mas en xifres no porten números');
  });
});

describe('hipervincles vius i cap paràgraf plantilla (troballes «hipervincles-vius-absents», «lead-promet-enllac» i «redaccio-mecanica-repetida»)', () => {
  test('l’entradeta no promet un enllaç per títol: cada títol amb enllaç porta on es tracta la seua peça', () => {
    expect(TEXT_INDEX).not.toContain('Cada títol porta a la seua pàgina');
    expect(TEXT_INDEX).toContain('Cada títol amb enllaç');
  });

  test('la prosa que nomena una pàgina hi porta: el pols, els empaquetats, les quatre peces dels agents i les anomalies del Mas', () => {
    const a = ambTot()[0];
    const rutes = (n) => n.explica.flat().filter((s) => s.enllac).map((s) => s.ruta);
    expect(rutes(pagina(a, ID_INTRO))).toEqual([paginaConsola('pols').ruta, RUTA_EMPAQUETATS]);
    expect(rutes(pagina(a, 'agents'))).toEqual(['peca-fluxos-de-treball', 'peca-tauler', 'peca-agents-sols', 'peca-vigilants'].map(rutaXifra));
    expect(rutes(pagina(a, ID_MAS))).toEqual(['avisos-alts', 'linies-ledger', 'torns-caducats', 'skills-fora-del-segell'].map(rutaXifra));
    expect(ambEnllacos('Llig el [pols](pols) i **res** més.')).toEqual([
      { text: 'Llig el ' }, { enllac: 'pols', ruta: paginaConsola('pols').ruta }, { text: ' i ' }, { fort: 'res' }, { text: ' més.' }
    ]);
  });

  /* Una pàgina que parla de si mateixa («Al voltant dels agents hi ha
     **actors**», davall de l'H3 Actors del Mas, que ja hi porta) no compta,
     ni una mesura amb el seu número («**1 registre de consum**»): és la dada,
     no el nom de la pàgina. */
  test('cap negreta nomena una altra pàgina que té ruta (pel seu id o pel seu títol): eixa menció porta l’enllaç', () => {
    for (const index of [indexConsola(), ambTot()]) {
      const nodes = nodesDeLIndex(index);
      // Cada nom de pàgina (l'id d'una pàgina o el títol d'un node amb ruta), amb la seua ruta.
      const noms = new Map([
        ...IDS_PAGINES.map((id) => [id, paginaConsola(id).ruta]), [ID_EMPAQUETATS, RUTA_EMPAQUETATS],
        ...nodes.filter((n) => n.ruta).map((n) => [n.titol.toLocaleLowerCase('ca'), n.ruta])
      ]);
      for (const n of nodes) {
        const negretes = tots([{ ...n, fills: [] }]).flat().filter((s) => s.fort).map((s) => s.fort.toLocaleLowerCase('ca'));
        expect(negretes.filter((x) => noms.has(x) && noms.get(x) !== n.ruta && !/\d/.test(x)), n.id).toEqual([]);
      }
    }
  });

  test('cap paràgraf de més de 80 caràcters es repetix més de dues vegades, en cap estat de les fonts', () => {
    const estats = [
      indexConsola(), ambTot(), indexConsola(null, null, 'ca-ES', AMB_ERROR),
      indexConsola(null, null, 'ca-ES', { estatMapa: 'loading', estatDades: 'loading', empaquetats: { valor: null, estat: 'loading' }, ara: ARA })
    ];
    for (const index of estats) {
      const compte = new Map();
      for (const p of tots(index).map(pla).filter((x) => x.length > 80)) compte.set(p, (compte.get(p) ?? 0) + 1);
      expect([...compte].filter(([, n]) => n > 2)).toEqual([]);
    }
  });
});

/* Decisió del Mestre (31-10-2026) · Gauntlet f9 (F3-index-de-la-consola-diu-que-sense-dev-no-hi-ha-dades) ·
   A la web publicada (DEV fals i la bandera SDP_CONSOLA_INSTANTANIA del build web), l'Índex diu
   d'on ve cada font (la instantània sanejada de cada publicació) i no promet Refrescar: cap frase
   del servidor local ni de «fora d'ell, la Consola no té dades». */
describe('a la web publicada, l’Índex diu la veritat de la instantània (decisió del Mestre, 31-10-2026)', () => {
  const aLaWebPublicada = () => { vi.stubEnv('DEV', false); vi.stubEnv('SDP_CONSOLA_INSTANTANIA', '1'); };
  afterEach(() => { vi.unstubAllEnvs(); });
  const FALSOS = [/fora d’ell, la Consola no té dades/, /servidor local/, /Refrescar/, /s’apunten en el navegador/, /decisions? apuntades? en este navegador/, /Qui hi té accés/];
  const governEn = (estat) => ({ matriu: null, head: null, trasllat: null, certificacions: { registres: [], persistent: true }, servidor: { estat } });

  test('amb totes les fonts: l’entradeta i el Govern diuen que la web publicada llig la instantània sanejada', () => {
    aLaWebPublicada();
    const index = arrel(MAPA, CONSOLA, 'ca-ES', { ara: ARA, govern: governAmb([fila3('A01', 'done')]) });
    const intro = pagina(index, ID_INTRO).explica.map(pla).join('\n');
    expect(intro).toContain('A la web publicada, com ara, totes ixen de la instantània sanejada que es fa en cada publicació');
    expect(pla(pagina(index, ID_GOVERN).explica[0])).toContain('a la web publicada, de la instantània sanejada de cada publicació');
    const text = tots([index]).map(pla).join('\n');
    for (const re of FALSOS) expect(text, String(re)).not.toMatch(re);
    expect(pla(fill(pagina(index, ID_GOVERN), 'govern/certificacio').diu)).toBe('A la web publicada no s’apunta cap decisió: el Mestre certifica a l’ordinador de desenvolupament, i ací es veu la matriu sencera.');
  });

  test('amb les lectures fallides (el sobre d’error de la instantània): «Cal reparar», la pàgina diu l’error i cap Refrescar', () => {
    aLaWebPublicada();
    const index = arrel(null, null, 'ca-ES', { ...AMB_ERROR, govern: governEn('error') });
    for (const f of deLaSala(index)) expect(f.queda[0].fort, f.id).toBe(ETIQUETES.reparar.text);
    expect(pla(pagina(index, ID_GOVERN).diu)).toMatch(/^Ara mateix no hi ha matriu: la matriu no ha pogut entrar en la instantània publicada/);
    expect(pla(pagina(index, ID_INTRO).diu)).toContain('la instantània es torna a fer en cada publicació de la web');
    const text = tots([index]).map(pla).join('\n');
    for (const re of FALSOS) expect(text, String(re)).not.toMatch(re);
  });

  test('sense cap font (una publicació que no la porta): ho diu així, sense remetre al servidor local', () => {
    aLaWebPublicada();
    const index = arrel(null, null, 'ca-ES', { ara: ARA, govern: governEn('absent'), empaquetats: { valor: null, estat: 'absent' } });
    expect(pla(pagina(index, 'pols').diu)).toContain('consola.json no ha arribat a la instantània d’esta publicació');
    expect(pla(pagina(index, ID_GOVERN).diu)).toMatch(/^Ara mateix no hi ha cap matriu: esta publicació de la web no la porta a la instantània/);
    const text = tots([index]).map(pla).join('\n');
    for (const re of FALSOS) expect(text, String(re)).not.toMatch(re);
  });

  test('el contrast: al servidor de desenvolupament, els textos de sempre', () => {
    const index = arrel(null, null, 'ca-ES', { ...AMB_ERROR, govern: governEn('error') });
    expect(tots([index]).map(pla).join('\n')).toMatch(/servidor local/);
    expect(pla(pagina(index, ID_INTRO).diu)).toContain('torna a provar-ho amb Refrescar');
  });
});
