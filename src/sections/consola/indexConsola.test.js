import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/* Onada 11 (261010; prompt 261010_1730, tasca 5) · L'Índex de la Consola és
   dada abans que vista: la jerarquia ix de les fonts d'ara (consolaPagines.js,
   polsConsola.js, xifresMas.js) i no inventa ni una ruta ni un número. */
import {
  ID_INDEX, ID_MAS, IMATGES_INDEX, TEXT_INDEX, TITOL_INDEX, TITOL_MAS, indexConsola, nodesDeLIndex
} from './indexConsola.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { IMATGES_CONSOLA } from './imatgesConsola.js';
import { IDS_PAGINES, paginaConsola } from './consolaPagines.js';
import { IDS_PANELLS, panellPols, rutaPanell } from './polsConsola.js';
import {
  SLUGS_FIXOS, SLUGS_XIFRES, rutaXifra, targetesDeLaConsola, xifresDeLaGraella, xifresDeVista
} from './xifresMas.js';

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

  test('les nou pàgines en H3, en l’ordre d’IDS_PAGINES, i «El Mas en xifres» tancant', () => {
    const a = arrel();
    expect(ids(a.fills)).toEqual([...IDS_PAGINES, ID_MAS]);
    expect(a.fills.every((f) => f.nivell === 3)).toBe(true);
    const mas = a.fills.at(-1);
    expect(mas.titol).toBe(TITOL_MAS);
    expect(mas.ruta).toBeNull();
  });

  test('cada pàgina porta el títol, la ruta, el «per a què» i l’entradeta de paginaConsola', () => {
    for (const f of arrel().fills.slice(0, -1)) {
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
    for (const f of a.fills.slice(0, -1)) {
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

describe('amb el Mapa i consola.json de prova', () => {
  test('apareixen les peces de les famílies i les xifres condicionals, amb el títol de la seua targeta', () => {
    const a = arrel(MAPA, CONSOLA);
    const actors = ids(pagina(a, 'actors').fills);
    expect(actors).toContain('arnes-claude-code');
    expect(actors.some((id) => id.startsWith('tasca-'))).toBe(true);
    expect(actors.some((id) => id.startsWith('lloc-'))).toBe(true);
    expect(actors).toContain('tasques-sense-llancador');
    expect(ids(pagina(a, 'calendari').fills)).toContain('cadencia-dia');
    expect(pagina(a, 'actors').fills.find((x) => x.id === 'arnes-claude-code').titol).toBe('Claude Code');
    // Cada peça és exactament la que la vista pinta, en el mateix ordre.
    for (const f of a.fills.slice(0, -1)) {
      const xifres = f.id === 'pols' ? f.fills.slice(IDS_PANELLS.length) : f.fills;
      const vista = xifresDeVista(f.id, MAPA, CONSOLA);
      expect(ids(xifres), f.id).toEqual(vista.map((x) => x.slug));
      expect(xifres.map((x) => x.titol), f.id).toEqual(vista.map((x) => x.titol));
    }
    expect(ids(pagina(a, ID_MAS).fills)).toEqual(SLUGS_XIFRES);
    expect(pagina(a, ID_MAS).fills.map((x) => x.titol)).toEqual(xifresDeLaGraella(MAPA).map((x) => x.titol));
  });

  test('cada H4 d’una xifra té pàgina pròpia amb les fonts d’ara (el viceversa) i la ruta de rutaXifra', () => {
    const ambPagina = targetesDeLaConsola(MAPA, CONSOLA);
    for (const n of nodesDeLIndex(indexConsola(MAPA, CONSOLA)).filter((x) => x.nivell === 4 && !x.id.startsWith('pols/'))) {
      expect(ambPagina.has(n.id), n.id).toBe(true);
      expect(n.ruta).toBe(rutaXifra(n.id));
    }
  });

  test('una peça amb ruta al títol porta la seua versió privada; les altres, cap', () => {
    const actors = pagina(arrel(MAPA, CONSOLA), 'actors').fills;
    const lloc = actors.find((x) => x.id.startsWith('lloc-'));
    expect(lloc.titolPrivat).toBe('Lloc del sòl');
    expect(actors.find((x) => x.id === 'arnes-claude-code').titolPrivat).toBeNull();
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

describe('les il·lustracions', () => {
  test('la taula de l’Índex només nomena l’H2, i el seu fitxer és a public/', () => {
    // Ordre del Mestre, 13-10-2026 (front F) · abans [index, explorador, salut]; ara les dues de les pàgines són de les targetes.
    expect(Object.keys(IMATGES_INDEX)).toEqual([ID_INDEX]);
    const { imatge, imatgeAlt } = IMATGES_INDEX[ID_INDEX];
    expect(imatge).toMatch(/^\/assets\/(ui\/plugins\/[a-z]+_vinyeta|nano_cards\/[a-z_]+_nano_card)\.jpg$/);
    expect(esFitxerAmbPes(imatge), `${imatge} no és a public/`).toBe(true);
    expect(imatgeAlt.length).toBeGreaterThan(20);
  });

  test('la ruta i el text alternatiu de l’H2 són els de PAGE_COPY.consola, i són els de la taula única', () => {
    expect(IMATGES_INDEX[ID_INDEX]).toEqual({ imatge: PAGE_COPY.consola.image, imatgeAlt: PAGE_COPY.consola.imageAlt });
    expect(IMATGES_INDEX[ID_INDEX]).toBe(IMATGES_CONSOLA.index);
  });

  test('l’H2 porta la seua il·lustració; els H3 porten imatge null i imatgeAlt buit; els H4, cap camp', () => {
    for (const fonts of [[], [MAPA, CONSOLA]]) {
      const plans = nodesDeLIndex(indexConsola(...fonts));
      for (const n of plans.filter((x) => x.nivell < 4)) {
        const esperada = n.nivell === 2 ? IMATGES_INDEX[ID_INDEX] : { imatge: null, imatgeAlt: '' };
        expect({ imatge: n.imatge, imatgeAlt: n.imatgeAlt }, n.id).toEqual(esperada);
      }
      for (const n of plans.filter((x) => x.nivell === 4)) {
        expect(n.imatge, n.id).toBeUndefined();
        expect(n.imatgeAlt, n.id).toBeUndefined();
      }
      // Un sol node amb il·lustració: la de l'H2. La de cada pàgina és a la seua targeta, una sola vegada a /consola.
      expect(plans.filter((x) => x.imatge).map((x) => x.id)).toEqual([ID_INDEX]);
      // Cap il·lustració de les targetes no torna a l'Índex.
      const deLesTargetes = IDS_PAGINES.map((id) => IMATGES_CONSOLA[id].imatge);
      expect(plans.filter((x) => deLesTargetes.includes(x.imatge))).toEqual([]);
    }
  });

  test('una peça del Mapa amb el nom d’una clau de la taula no rep cap imatge (només els nivells 2 i 3)', () => {
    // Els ids dels H4 són slugs de xifra o `pols/<id>`: cap coincidix amb una clau de la taula.
    const h4 = nodesDeLIndex(indexConsola(MAPA, CONSOLA)).filter((n) => n.nivell === 4).map((n) => n.id);
    for (const id of Object.keys(IMATGES_INDEX)) expect(h4).not.toContain(id);
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

  test('tota <img> escrita a la secció porta la classe de la llei, sense estil en línia', () => {
    const imatges = jsx(SECCIO).flatMap((fitxer) => [...readFileSync(fitxer, 'utf8').matchAll(/<img\b[^>]*>/g)]
      .map((m) => [path.relative(SECCIO, fitxer), m[0].replace(/\s+/g, ' ')]));
    expect(imatges.map(([fitxer]) => fitxer)).toEqual(['IndexConsola.jsx']);
    for (const [fitxer, marca] of imatges) {
      expect(marca, fitxer).toContain('className="sdp-consola__index-imatge"');
      expect(marca, fitxer).not.toMatch(/\bstyle=/);
    }
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

  test('les 14 vinyetes i les 4 nano cards són a public/, amb pes', () => {
    const rutes = [
      ...VINYETES.map((id) => `/assets/ui/plugins/${id}_vinyeta.jpg`),
      ...NANO_CARDS.map((id) => `/assets/nano_cards/${id}_nano_card.jpg`)
    ];
    expect(rutes).toHaveLength(18);
    for (const ruta of rutes) expect(esFitxerAmbPes(ruta), ruta).toBe(true);
    // La carpeta de vinyetes no en porta cap altra: les 14 i les ALTRES_VINYETES són totes les que hi ha.
    expect(readdirSync(alDisc('/assets/ui/plugins')).filter((f) => f.endsWith('.jpg')).sort())
      .toEqual([...VINYETES, ...ALTRES_VINYETES].map((id) => `${id}_vinyeta.jpg`).sort());
  });
});
