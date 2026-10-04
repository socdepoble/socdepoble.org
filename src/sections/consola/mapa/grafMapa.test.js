import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  ESTIL_MAPA, TEXTOS_AVIS, dadesDelNode, documentWiki, etiquetaNode, filtresInicials, fitxerDelNode, grafDelMapa,
  notaEixides, opcionsPeces, relacionsDe, relacionsPerVerb, filesEntradesEixides, rutaEditable
} from './grafMapa.js';
import { ExploradorMapa } from './ExploradorMapa.jsx';
import { PrivacitatConsola } from '../peces.jsx';

/* El canvas té les seues proves (BrainGraph.test.jsx). Ací només importa què
   rep el graf i on queda respecte de la cerca, dels filtres i del detall. */
const grafRebut = vi.hoisted(() => ({ props: null }));
vi.mock('../../../components/universal/graph/BrainGraph', async () => {
  const { createElement: h } = await import('react');
  return {
    default: (props) => {
      grafRebut.props = props;
      return h('canvas', { 'aria-label': props.textos.canvas });
    }
  };
});
/* T4 · el detall navega a la Wiki (sense RouterProvider, useNavigate
   llança), avisa amb toasts i casa les rutes amb el manifest publicat. */
const navega = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => vi.fn());
/* Correcció 261004 (verificador de la segona passada) · el recompte de la
   barra i els interruptors de tipus enllacen amb les targetes dels nodes i
   de les arestes: Link pinta un <a> amb el seu destí. */
vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => navega,
    Link: ({ to, children, ...props }) => h('a', { href: to, ...props }, children)
  };
});
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: toast }) }));
vi.mock('../../../data/wikiManifest', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:03_actuar/plantilles', parentId: null, label: 'PLANTILLES' }],
    items: [{ id: 'prompt_local', title: 'prompt_local', categoryId: 'folder:03_actuar/plantilles' }]
  }
}));

const PLANTILLA = 'plantilla:_wiki_de_poble/03_actuar/plantilles/prompt_local.md';
const MAPA = Object.freeze({
  nodes: [
    { id: 'ruta:prompt.local', tipus: 'ruta', font: '.agents/protocolledge.json', atributs: {} },
    { id: PLANTILLA, tipus: 'plantilla', font: null, atributs: {} },
    { id: 'skill:wiki-documentacio-i-reflex', tipus: 'skill', font: '.agents/skills/wiki-documentacio-i-reflex/SKILL.md', atributs: { core: true } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} },
    { id: 'skill:core-automillora', tipus: 'skill', font: null, atributs: {} },
    { id: 'script:npm:porta', tipus: 'script', font: 'package.json', atributs: {} },
    { id: 'hook:claude:PreToolUse', tipus: 'hook', font: '.claude/settings.json', atributs: {} }
  ],
  arestes: [
    { de: 'ruta:prompt.local', a: PLANTILLA, tipus: 'encamina', confianca: 'declarat', evidencia: null },
    { de: 'ruta:prompt.local', a: 'skill:wiki-documentacio-i-reflex', tipus: 'governa', confianca: 'declarat', evidencia: null },
    { de: 'ruta:prompt.local', a: 'document:_wiki_de_poble/04_escriptori', tipus: 'escriu', confianca: 'declarat', evidencia: null },
    { de: 'skill:wiki-documentacio-i-reflex', a: 'skill:sdp-workflow', tipus: 'crida', confianca: 'inferit', evidencia: null }
  ],
  tasques: [],
  avisos: [{ node: 'skill:core-automillora', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' }],
  salut: []
});

describe('etiquetaNode', () => {
  test('lleva el prefix i la ruta', () => {
    expect(etiquetaNode({ id: 'skill:sdp-workflow' })).toBe('sdp-workflow');
    expect(etiquetaNode({ id: PLANTILLA })).toBe('prompt_local.md');
    expect(etiquetaNode({ id: 'script:npm:porta' })).toBe('npm run porta');
    expect(etiquetaNode({ id: 'hook:claude:PreToolUse' })).toBe('PreToolUse · claude');
    expect(etiquetaNode({ id: 'document:_wiki_de_poble/04_escriptori' })).toBe('04_escriptori');
  });
});

describe('grafDelMapa', () => {
  test('sense filtres ho pinta tot, i l’inferit va discontinu', () => {
    const { nodes, links } = grafDelMapa(MAPA);
    expect(nodes).toHaveLength(MAPA.nodes.length);
    expect(links).toHaveLength(4);
    expect(links.find((l) => l.confianca === 'inferit').discontinu).toBe(true);
    expect(links.filter((l) => l.discontinu)).toHaveLength(1);
  });

  test('apagar un tipus lleva els seus nodes i les seues línies', () => {
    const filtres = filtresInicials();
    filtres.tipus.plantilla = false;
    const { nodes, links } = grafDelMapa(MAPA, filtres);
    expect(nodes.some((n) => n.type === 'plantilla')).toBe(false);
    expect(links.some((l) => l.type === 'encamina')).toBe(false);
  });

  test('sense òrfens desapareixen les peces sense cap relació', () => {
    const filtres = { ...filtresInicials(), orfes: false };
    const ids = grafDelMapa(MAPA, filtres).nodes.map((n) => n.id);
    expect(ids).not.toContain('skill:core-automillora');
    expect(ids).not.toContain('hook:claude:PreToolUse');
    expect(ids).toContain('skill:sdp-workflow');
  });

  test('apagar l’inferit pot deixar òrfena una skill que només tenia prosa', () => {
    const filtres = filtresInicials();
    filtres.confiances.inferit = false;
    filtres.orfes = false;
    expect(grafDelMapa(MAPA, filtres).nodes.map((n) => n.id)).not.toContain('skill:sdp-workflow');
  });

  test('la cerca mostra la coincidència i els seus veïns directes', () => {
    const ids = grafDelMapa(MAPA, { ...filtresInicials(), cerca: 'reflex' }).nodes.map((n) => n.id).sort();
    expect(ids).toEqual(['ruta:prompt.local', 'skill:sdp-workflow', 'skill:wiki-documentacio-i-reflex']);
  });
});

describe('relacionsDe i entrades/eixides', () => {
  test('una ruta llig i escriu; una skill sense contracte és una caixa opaca', () => {
    const ruta = relacionsDe(MAPA, 'ruta:prompt.local');
    expect(ruta.escriu.map((a) => a.a)).toEqual(['document:_wiki_de_poble/04_escriptori']);
    expect(ruta.crida).toHaveLength(2);
    expect(ruta.opaca).toBe(false);
    const skill = relacionsDe(MAPA, 'skill:wiki-documentacio-i-reflex');
    expect(skill.opaca).toBe(true);
    expect(skill.elCriden.map((a) => a.de)).toEqual(['ruta:prompt.local']);
    expect(relacionsDe(MAPA, 'skill:core-automillora').avisos.map((a) => a.codi)).toEqual(['orfe']);
  });

  test('les files porten skills i rutes, amb les opaques al final', () => {
    const files = filesEntradesEixides(MAPA);
    expect(files.map((f) => f.node.tipus).every((t) => t === 'skill' || t === 'ruta')).toBe(true);
    expect(files[0].node.id).toBe('ruta:prompt.local');
    expect(files.slice(1).every((f) => f.opaca)).toBe(true);
    expect(filesEntradesEixides(MAPA, '04_escriptori').map((f) => f.node.id)).toEqual(['ruta:prompt.local']);
  });
});

/* T4 (ordre del Mestre, 260930) · la lògica pura del detall. */
describe('detall de la peça: lògica pura', () => {
  test('fitxerDelNode: el fitxer mateix, on es declara, o no se sap', () => {
    expect(fitxerDelNode({ id: 'skill:sdp-workflow', font: null })).toEqual({ ruta: '.agents/skills/sdp-workflow/SKILL.md', rol: 'fitxer' });
    expect(fitxerDelNode({ id: PLANTILLA, font: null })).toEqual({ ruta: '_wiki_de_poble/03_actuar/plantilles/prompt_local.md', rol: 'fitxer' });
    // L'script del router es declara a l'índex, però el fitxer és el de l'id.
    expect(fitxerDelNode({ id: 'script:tooling/session/persona_router.mjs', font: '.agents/skills_index.json' }))
      .toEqual({ ruta: 'tooling/session/persona_router.mjs', rol: 'fitxer' });
    expect(fitxerDelNode({ id: 'script:npm:porta', font: 'package.json' })).toEqual({ ruta: 'package.json', rol: 'declarat' });
    expect(fitxerDelNode({ id: 'ruta:prompt.local', font: '.agents/protocolledge.json' })).toEqual({ ruta: '.agents/protocolledge.json', rol: 'declarat' });
    expect(fitxerDelNode({ id: 'agent:codex', font: null })).toEqual({ ruta: null, rol: null });
  });

  test('documentWiki casa id i carpeta com el compilador de la Wiki', () => {
    const manifest = {
      items: [
        { id: 'prompt_local', title: 'Prompt local', categoryId: 'folder:03_actuar/plantilles' },
        { id: 'genoma', title: 'Genoma', categoryId: null }
      ]
    };
    expect(documentWiki('_wiki_de_poble/03_actuar/plantilles/prompt_local.md', manifest))
      .toEqual({ id: 'prompt_local', titol: 'Prompt local', href: '/wikidepoble?item=prompt_local' });
    expect(documentWiki('_wiki_de_poble/genoma.md', manifest)?.id).toBe('genoma');
    // Mateix nom en una altra carpeta: no és el document publicat.
    expect(documentWiki('_wiki_de_poble/04_escriptori/prompt_local.md', manifest)).toBeNull();
    expect(documentWiki('.agents/skills/sdp-workflow/SKILL.md', manifest)).toBeNull();
    expect(documentWiki('_wiki_de_poble/04_escriptori', manifest)).toBeNull();
    expect(documentWiki(null, manifest)).toBeNull();
  });

  test('rutaEditable: només en desenvolupament, relativa, amb extensió i present', () => {
    expect(rutaEditable('package.json', true)).toBe(true);
    expect(rutaEditable('.agents/skills/sdp-workflow/SKILL.md', true)).toBe(true);
    expect(rutaEditable('package.json', false)).toBe(false);
    expect(rutaEditable('~/Library/LaunchAgents/org.sdp.plist', true)).toBe(false);
    expect(rutaEditable('/etc/hosts.txt', true)).toBe(false);
    expect(rutaEditable('../fora.md', true)).toBe(false);
    expect(rutaEditable('_wiki_de_poble/04_escriptori', true)).toBe(false);
    expect(rutaEditable(null, true)).toBe(false);
    for (const codi of ['script-absent', 'font-absent', 'skill-fantasma', 'fitxer-absent']) {
      expect(rutaEditable('tooling/x.mjs', true, [{ codi }])).toBe(false);
    }
    expect(rutaEditable('tooling/x.mjs', true, [{ codi: 'orfe' }])).toBe(true);
  });

  test('rutaEditable: cap esquema ni unitat (l’obridor de Vite obri una URL file:// fora del repositori)', () => {
    expect(rutaEditable('file:///private/etc/pf.conf', true)).toBe(false);
    expect(rutaEditable('C:/x.txt', true)).toBe(false);
    expect(rutaEditable('https://exemple.org/x.md', true)).toBe(false);
  });

  test('relacionsPerVerb: verbs humans, ordre del contracte i sense tocar relacionsDe', () => {
    const { ixen, entren } = relacionsPerVerb(MAPA, 'ruta:prompt.local');
    expect(ixen.map((f) => [f.verb, f.id])).toEqual([
      ['Escriu a', 'document:_wiki_de_poble/04_escriptori'],
      ['Encamina a', PLANTILLA],
      ['Governa', 'skill:wiki-documentacio-i-reflex']
    ]);
    expect(entren).toEqual([]);
    const skill = relacionsPerVerb(MAPA, 'skill:wiki-documentacio-i-reflex');
    expect(skill.entren).toEqual([{
      id: 'ruta:prompt.local', tipusPeca: 'ruta', tipus: 'governa', verb: 'El governa', confianca: 'declarat', evidencia: null
    }]);
    expect(skill.ixen.map((f) => [f.verb, f.confianca])).toEqual([['Crida', 'inferit']]);
  });

  test('notaEixides diu el motiu honest quan el Mapa no pot dir prou', () => {
    const nota = (id) => notaEixides({ id }, relacionsPerVerb(MAPA, id).ixen);
    // Una skill amb una crida de prosa continua sent una caixa opaca.
    expect(nota('skill:wiki-documentacio-i-reflex')).toMatch(/^Caixa opaca/);
    expect(notaEixides({ id: 'script:tooling/brain/build_skills_index.mjs' }, [])).toMatch(/no analitza el codi/);
    expect(nota('document:_wiki_de_poble/04_escriptori')).toMatch(/^Un document no actua/);
    expect(nota('script:npm:porta')).toMatch(/cap relació que isca/);
    expect(nota('ruta:prompt.local')).toBeNull();
  });

  test('cada codi d’avís del compilador té text humà', () => {
    const font = readFileSync(resolve(process.cwd(), 'src/sections/consola/mapa/construeixMapa.js'), 'utf8');
    const codis = new Set([...font.matchAll(/\bavis\([^,]+,\s*'([a-z-]+)'/g)].map((m) => m[1]));
    expect(codis.size).toBeGreaterThanOrEqual(18);
    for (const codi of codis) expect(TEXTOS_AVIS, codi).toHaveProperty(codi);
  });

  test('dadesDelNode: etiquetes en valencià, booleans en text i cap clau amagada', () => {
    const dades = dadesDelNode({ atributs: { paraules: 120, desconeguda: 'x', al_disc: null, core: true, ordre: 'npm run y' } });
    expect(dades.map((d) => [d.etiqueta, d.text, d.boolea])).toEqual([
      ['Skill del nucli', 'sí', true],
      ['Al disc', 'sense dada', true],
      ['Paraules', '120', false],
      ['Ordre', 'npm run y', false],
      ['desconeguda', 'x', false]
    ]);
    expect(dades.find((d) => d.clau === 'ordre').mono).toBe(true);
    expect(dadesDelNode({ atributs: { al_segell: false } })[0]).toMatchObject({ text: 'no', to: 'neutre' });
    expect(dadesDelNode({})).toEqual([]);
  });

  test('opcionsPeces: «Tipus · nom», noms repetits amb la ruta i la peça amagada al final', () => {
    const nodes = [
      { id: 'document:AGENTS.md', type: 'document' },
      { id: 'document:.agents/AGENTS.md', type: 'document' },
      { id: 'skill:sdp-workflow', type: 'skill' }
    ];
    expect(opcionsPeces(nodes, { id: 'hook:claude:Stop', tipus: 'hook' })).toEqual([
      { valor: '', etiqueta: 'Cap peça triada' },
      { valor: 'document:.agents/AGENTS.md', etiqueta: 'Document · .agents/AGENTS.md' },
      { valor: 'document:AGENTS.md', etiqueta: 'Document · AGENTS.md' },
      { valor: 'skill:sdp-workflow', etiqueta: 'Skill · sdp-workflow' },
      { valor: 'hook:claude:Stop', etiqueta: 'Hook · Stop · claude (amagada pels filtres)' }
    ]);
  });

  test('opcionsPeces en mode privacitat: els noms repetits porten un ordinal, mai la ruta', () => {
    const nodes = [
      { id: 'document:AGENTS.md', type: 'document' },
      { id: 'document:.agents/AGENTS.md', type: 'document' },
      { id: 'skill:sdp-workflow', type: 'skill' }
    ];
    // L'ordinal ix de l'identificador, no de l'ordre en què arriben les peces.
    expect(opcionsPeces(nodes, null, { privat: true })).toEqual([
      { valor: '', etiqueta: 'Cap peça triada' },
      { valor: 'document:.agents/AGENTS.md', etiqueta: 'Document · AGENTS.md (1)' },
      { valor: 'document:AGENTS.md', etiqueta: 'Document · AGENTS.md (2)' },
      { valor: 'skill:sdp-workflow', etiqueta: 'Skill · sdp-workflow' }
    ]);
  });
});

const pinta = (mapa = MAPA, privat = false) => render(
  createElement(PrivacitatConsola.Provider, { value: privat }, createElement(ExploradorMapa, { mapa }))
);
const detall = (container) => container.querySelector('.sdp-explorador__detall');
const tria = (id) => act(() => { grafRebut.props.onSeleccio(id); });
const titolDetall = (container) => detall(container).querySelector('h3');

describe('Explorador: la llegenda i els filtres primer, el graf al final (T3)', () => {
  afterEach(cleanup);
  const segueix = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const idsDelGraf = () => grafRebut.props.graf.nodes.map((n) => n.id).sort();

  test('llegenda, cerca i filtres plegats damunt; el graf i el detall, l’últim bloc', () => {
    const { container } = pinta();
    const seccio = container.querySelector('.sdp-explorador');
    const llegenda = container.querySelector('.sdp-explorador__llegenda');
    const cerca = screen.getByRole('searchbox', { name: 'Filtra per nom' });
    const plegables = [...container.querySelectorAll('.sdp-explorador__filtres details')];
    const graf = container.querySelector('.sdp-wiki-graf');
    expect(graf.querySelector('canvas')).toBeTruthy();
    expect(segueix(llegenda, cerca)).toBe(true);
    expect(plegables).toHaveLength(3);
    for (const d of plegables) {
      expect(segueix(cerca, d)).toBe(true);
      expect(segueix(d, graf)).toBe(true);
      expect(d.open).toBe(false);
    }
    // El marc (graf + detall) és l'últim fill: davall ja només hi ha el peu de la Consola.
    const marc = seccio.lastElementChild;
    expect(marc.classList.contains('sdp-explorador__marc')).toBe(true);
    expect([...marc.children]).toEqual([graf, detall(container)]);
    expect(grafRebut.props.enquadra).toBe(true);
    expect(container.querySelector('[role="search"] [role="status"]').textContent).toBe('8 peces · 4 relacions');
    // Els filtres ja són davall de la cerca: el botó que hi baixava no hi és.
    expect(screen.queryByRole('button', { name: /^Filtres/ })).toBeNull();
  });

  /* Correcció 261004 (verificador de la segona passada, punt 2) · Les xifres
     de l'Explorador són targetes (nodes i arestes, al capdamunt, que diuen
     que es tracten ací), i els recomptes de la barra i dels interruptors de
     tipus enllacen amb elles. */
  test('els nodes i les arestes són targetes, i els recomptes hi enllacen', () => {
    const { container } = pinta();
    const seccio = container.querySelector('.sdp-explorador');
    const graella = seccio.firstElementChild;
    expect(graella.className).toBe('sdp-card-grid sdp-consola__graella');
    /* Correcció 261004 (verificador de la tercera passada, punt 5) · i els
       enllaços trencats i les peces òrfenes, que la coberta destaca. */
    expect([...graella.querySelectorAll('article.sp-card')].map((t) => [
      t.querySelector('h3').textContent, t.querySelector('a.sp-card-link-overlay').getAttribute('href')
    ])).toEqual([['8 nodes', '/consola/xifres/nodes'], ['4 arestes', '/consola/xifres/arestes'],
      ['1 enllaç trencat o peça òrfena', '/consola/xifres/enllacos-trencats']]);
    const estat = container.querySelector('[role="search"] [role="status"]');
    const enllacos = () => [...estat.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(enllacos()).toEqual([['8 peces', '/consola/xifres/nodes'], ['4 relacions', '/consola/xifres/arestes']]);
    /* Amb un filtre, el recompte diu quantes en mostra «de» el total, i el total continua enllaçat.
       Correcció 261004 (verificador de la tercera passada, punt 3) · derogat «3 de 8 peces»: «d’8». */
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'reflex' } });
    expect(estat.textContent).toMatch(/^3 d’8 peces · \d+ de 4 relacions$/);
    expect(enllacos().map(([, href]) => href)).toEqual(['/consola/xifres/nodes', '/consola/xifres/arestes']);
    // Els recomptes per tipus dels interruptors porten a la targeta dels nodes.
    const tipus = container.querySelector('.sdp-explorador__filtres details');
    expect([...tipus.querySelectorAll('.sdp-explorador__opcions > p a')].map((a) => [a.textContent, a.getAttribute('href')]))
      .toEqual([['8 nodes', '/consola/xifres/nodes']]);
  });

  test('els filtres plegats continuen filtrant, i Restablir torna el focus al primer plegable', () => {
    const { container } = pinta();
    expect(grafRebut.props.graf.nodes).toHaveLength(MAPA.nodes.length);
    fireEvent.click(screen.getByRole('switch', { name: 'Plantilla (1)', hidden: true }));
    expect(grafRebut.props.graf.nodes.some((n) => n.type === 'plantilla')).toBe(false);
    fireEvent.click(screen.getByRole('switch', { name: /^Fletxes/, hidden: true }));
    expect(grafRebut.props.fletxes).toBe(false);
    const primer = container.querySelector('details');
    expect(primer.querySelector('summary').textContent).toBe('Tipus de peça8 de 9');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'reflex' } });
    expect(idsDelGraf()).toEqual(['ruta:prompt.local', 'skill:sdp-workflow', 'skill:wiki-documentacio-i-reflex']);

    // Restablir desapareix en quedar tot a l'inici: el focus passa al primer plegable.
    const restablir = within(container.querySelector('.sdp-explorador__filtres')).getByRole('button', { name: 'Restablir filtres' });
    restablir.focus();
    fireEvent.click(restablir);
    expect(grafRebut.props.graf.nodes).toHaveLength(MAPA.nodes.length);
    expect(grafRebut.props.fletxes).toBe(true);
    expect(screen.queryByRole('button', { name: 'Restablir filtres' })).toBeNull();
    expect(document.activeElement).toBe(primer.querySelector('summary'));
  });

  test('sense cap peça ho diu damunt del graf i ofereix tornar', () => {
    const { container } = pinta();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no-existix' } });
    expect(grafRebut.props.graf.nodes).toHaveLength(0);
    const buit = container.querySelector('.sdp-explorador__buit');
    expect(buit.textContent).toContain('Cap peça casa amb «no-existix»');
    const restablir = within(buit).getByRole('button', { name: 'Restablir filtres' });
    restablir.focus();
    fireEvent.click(restablir);
    expect(grafRebut.props.graf.nodes).toHaveLength(MAPA.nodes.length);
    expect(container.querySelector('.sdp-explorador__buit')).toBeNull();
    // El botó ja no hi és: el focus torna a la cerca, no al body.
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Filtra per nom' }));
  });

  test('la llegenda dels tipus usa els mateixos tokens que pinta el canvas', () => {
    // vitest corre des de l'arrel del repositori; import.meta.url no hi és un file://.
    const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
    for (const [tipus, color] of Object.entries(ESTIL_MAPA.colors)) {
      expect(css).toContain(`.sdp-explorador__punt[data-tipus="${tipus}"] { background: ${color}; }`);
    }
  });
});

describe('Explorador: el detall de la peça (T4)', () => {
  let escriu;
  beforeEach(() => {
    navega.mockClear();
    toast.mockClear();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200 })));
    escriu = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escriu }, configurable: true });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    delete navigator.clipboard;
  });

  test('sense peça triada, el detall explica què fer; el graf no pinta el seu inspector', () => {
    const { container } = pinta();
    expect(grafRebut.props.inspector).toBe(false);
    expect(grafRebut.props.seleccio).toBe('');
    expect(detall(container).textContent).toContain('Fes clic en un punt del graf o tria una peça de la llista');
    expect(screen.getByRole('combobox', { name: 'Tria una peça' }).value).toBe('');
    expect(titolDetall(container)).toBeNull();
  });

  test('el clic al graf tria la peça: tipus, nom, què és i on viu, i el graf la marca', () => {
    const { container } = pinta();
    tria(PLANTILLA);
    expect(grafRebut.props.seleccio).toBe(PLANTILLA);
    expect(titolDetall(container).textContent).toBe('prompt_local.md');
    expect(detall(container).textContent).toContain('Plantilla documental');
    expect(within(detall(container)).getByRole('heading', { level: 4, name: 'On viu' })).toBeTruthy();
    expect(detall(container).querySelector('.sdp-explorador__ruta').textContent)
      .toBe('_wiki_de_poble/03_actuar/plantilles/prompt_local.md');
    expect(screen.getByRole('combobox', { name: 'Tria una peça' }).value).toBe(PLANTILLA);
  });

  test('«Obrir a la Wiki» només per a un document publicat, i navega dins de l’app', () => {
    const { container } = pinta();
    tria(PLANTILLA);
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Obrir a la Wiki' }));
    expect(navega).toHaveBeenCalledWith('/wikidepoble?item=prompt_local');
    // Una skill no es publica a la Wiki: cap botó que no porte enlloc.
    tria('skill:wiki-documentacio-i-reflex');
    expect(within(detall(container)).queryByRole('button', { name: 'Obrir a la Wiki' })).toBeNull();
  });

  test('«Obrir a l’editor» demana a Vite que l’obriga i el toast no diu «obert»', async () => {
    const { container } = pinta();
    tria('skill:wiki-documentacio-i-reflex');
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Obrir a l’editor' }));
    expect(fetch).toHaveBeenCalledWith('/__open-in-editor?file=.agents%2Fskills%2Fwiki-documentacio-i-reflex%2FSKILL.md');
    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      'S’ha demanat a l’editor que obriga .agents/skills/wiki-documentacio-i-reflex/SKILL.md.', 'info'));
    expect(toast.mock.calls.flat().join(' ')).not.toMatch(/obert/i);
  });

  test('si el servidor no respon, el toast ho diu', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    const { container } = pinta();
    tria('hook:claude:PreToolUse');
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Obrir a l’editor' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/^No s’ha pogut fer la petició/), 'error'));
  });

  test('amb el mode privacitat, ni la ruta ni el toast ensenyen el camí', async () => {
    const { container } = pinta(MAPA, true);
    tria('skill:wiki-documentacio-i-reflex');
    expect(detall(container).querySelector('.sdp-explorador__ruta').textContent).not.toContain('.agents/skills');
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Obrir a l’editor' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('S’ha demanat a l’editor que obriga el fitxer.', 'info'));
  });

  test('fora de desenvolupament no hi ha «Obrir a l’editor»; copiar continua', () => {
    vi.stubEnv('DEV', false);
    const { container } = pinta();
    tria('skill:wiki-documentacio-i-reflex');
    expect(within(detall(container)).queryByRole('button', { name: 'Obrir a l’editor' })).toBeNull();
    expect(within(detall(container)).getByRole('button', { name: 'Copiar la ruta' })).toBeTruthy();
  });

  test('«Copiar la ruta» la posa al porta-retalls i avisa; si falla, també ho diu', async () => {
    const { container } = pinta();
    tria('script:npm:porta');
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Copiar la ruta' }));
    expect(escriu).toHaveBeenCalledWith('package.json');
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Ruta copiada al porta-retalls.', 'success'));
    escriu.mockImplementationOnce(() => Promise.reject(new Error('NotAllowedError')));
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Copiar la ruta' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/^No s’ha pogut copiar la ruta/), 'error'));
  });

  test('una peça declarada diu on es declara, i no és un fitxer propi', () => {
    const { container } = pinta();
    tria('ruta:prompt.local');
    const d = within(detall(container));
    expect(d.getByRole('heading', { level: 4, name: 'On es declara' })).toBeTruthy();
    expect(detall(container).textContent).toContain('Esta peça no és un fitxer propi: viu dins d’este fitxer.');
    expect(d.getByRole('button', { name: 'Obrir a l’editor' })).toBeTruthy();
  });

  test('«Vore la peça» tria la veïna, el graf la marca i el focus passa al nom nou', () => {
    const { container } = pinta();
    tria('ruta:prompt.local');
    const fila = within(detall(container)).getByRole('button', { name: 'Vore la peça wiki-documentacio-i-reflex' });
    expect(fila.closest('li').textContent).toContain('Governa');
    fireEvent.click(fila);
    expect(grafRebut.props.seleccio).toBe('skill:wiki-documentacio-i-reflex');
    expect(titolDetall(container).textContent).toBe('wiki-documentacio-i-reflex');
    expect(document.activeElement).toBe(titolDetall(container));
    // Qui hi arriba, amb el verb des de l'altre cap i la confiança en text.
    const arriba = within(detall(container)).getByRole('button', { name: 'Vore la peça prompt.local' }).closest('li');
    expect(arriba.textContent).toContain('El governa');
    expect(arriba.textContent).toContain('declarat');
  });

  test('dades amb etiquetes en valencià i booleans amb text', () => {
    const { container } = pinta();
    tria('skill:wiki-documentacio-i-reflex');
    const dades = detall(container).querySelector('.sdp-explorador__dades');
    expect(dades.querySelector('dt').textContent).toBe('Skill del nucli');
    expect(dades.querySelector('dd .sdp-insignia').textContent).toBe('sí');
  });

  test('els avisos es diuen amb paraules; un codi desconegut es pinta tal qual', () => {
    const mapa = { ...MAPA, avisos: [...MAPA.avisos, { node: 'skill:core-automillora', codi: 'codi-nou', severitat: 'baixa', evidencia: null }] };
    const { container } = pinta(mapa);
    tria('skill:core-automillora');
    const avisos = [...detall(container).querySelectorAll('.sdp-explorador__avis')];
    expect(avisos).toHaveLength(2);
    expect(avisos.find((li) => li.textContent.includes(TEXTOS_AVIS.orfe)).textContent).toContain('mitjana');
    expect(avisos.find((li) => li.textContent.includes('codi-nou')).querySelector('p').textContent).toBe('codi-nou');
  });

  test('si els filtres amaguen la peça, ho diu i Restablir la torna al graf', () => {
    const { container } = pinta();
    tria(PLANTILLA);
    expect(within(detall(container)).queryByText('No es veu al graf amb estos filtres')).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Plantilla (1)', hidden: true }));
    expect(within(detall(container)).getByText('No es veu al graf amb estos filtres')).toBeTruthy();
    // El selector no menteix: la peça hi continua, dita.
    const selector = screen.getByRole('combobox', { name: 'Tria una peça' });
    expect(selector.value).toBe(PLANTILLA);
    expect(selector.selectedOptions[0].textContent).toContain('(amagada pels filtres)');
    fireEvent.click(within(detall(container)).getByRole('button', { name: 'Restablir filtres' }));
    expect(grafRebut.props.graf.nodes.some((n) => n.id === PLANTILLA)).toBe(true);
    expect(within(detall(container)).queryByText('No es veu al graf amb estos filtres')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Tria una peça' }));
  });

  test('un fitxer que falta no s’ofereix a l’editor, i es diu per què', () => {
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes, { id: 'script:tooling/x.mjs', tipus: 'script', font: 'package.json', atributs: {} }],
      avisos: [...MAPA.avisos, { node: 'script:tooling/x.mjs', codi: 'script-absent', severitat: 'alta', evidencia: 'package.json' }]
    };
    const { container } = pinta(mapa);
    tria('script:tooling/x.mjs');
    expect(within(detall(container)).queryByRole('button', { name: 'Obrir a l’editor' })).toBeNull();
    expect(detall(container).textContent).toContain('El fitxer no és al disc: no es pot obrir a l’editor.');
    expect(detall(container).textContent).toContain(TEXTOS_AVIS['script-absent']);
  });

  /* L'absència només val per al fitxer propi de la peça: una ordre npm no
     declarada viu a package.json, i package.json sí que és al disc. */
  test('una ordre npm no declarada no fa absent package.json: s’ofereix a l’editor i no diu «no és al disc»', () => {
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes, { id: 'script:npm:gen', tipus: 'script', font: 'package.json', atributs: {} }],
      avisos: [...MAPA.avisos, { node: 'script:npm:gen', codi: 'script-absent', severitat: 'alta', evidencia: 'package.json' }]
    };
    const { container } = pinta(mapa);
    tria('script:npm:gen');
    expect(detall(container).querySelector('.sdp-explorador__ruta').textContent).toBe('package.json');
    expect(within(detall(container)).getByRole('button', { name: 'Obrir a l’editor' })).toBeTruthy();
    expect(detall(container).textContent).not.toContain('El fitxer no és al disc');
    // L'avís continua dit al seu bloc.
    expect(detall(container).textContent).toContain(TEXTOS_AVIS['script-absent']);
  });

  test('un document que un contracte declara i no és al disc porta el seu avís i no s’ofereix a l’editor', () => {
    const doc = 'document:docs/no-hi-es.md';
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes, { id: doc, tipus: 'document', font: 'docs/no-hi-es.md', atributs: {} }],
      avisos: [...MAPA.avisos, { node: doc, codi: 'fitxer-absent', severitat: 'alta', evidencia: '.agents/skills/sdp-workflow/SKILL.md → docs/no-hi-es.md' }]
    };
    const { container } = pinta(mapa);
    tria(doc);
    expect(within(detall(container)).queryByRole('button', { name: 'Obrir a l’editor' })).toBeNull();
    expect(detall(container).textContent).toContain('El fitxer no és al disc: no es pot obrir a l’editor.');
    expect(TEXTOS_AVIS).toHaveProperty('fitxer-absent');
    expect(detall(container).textContent).toContain(TEXTOS_AVIS['fitxer-absent']);
  });

  test('amb el mode privacitat, el selector distingix els noms repetits sense ensenyar la ruta', () => {
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes,
        { id: 'document:AGENTS.md', tipus: 'document', font: null, atributs: {} },
        { id: 'document:.agents/AGENTS.md', tipus: 'document', font: null, atributs: {} }]
    };
    pinta(mapa, true);
    const textos = [...screen.getByRole('combobox', { name: 'Tria una peça' }).options].map((o) => o.textContent);
    expect(textos).toContain('Document · AGENTS.md (1)');
    expect(textos).toContain('Document · AGENTS.md (2)');
    expect(textos.join(' ')).not.toContain('.agents/');
  });

  test('més de huit relacions es pleguen en «Mostra’n N més»', () => {
    const fills = Array.from({ length: 11 }, (_, i) => ({ id: `document:doc${i}.md`, tipus: 'document', font: null, atributs: {} }));
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes, ...fills],
      arestes: [...MAPA.arestes, ...fills.map((f) => ({ de: 'ruta:prompt.local', a: f.id, tipus: 'llig', confianca: 'declarat', evidencia: '.agents/protocolledge.json' }))]
    };
    const { container } = pinta(mapa);
    tria('ruta:prompt.local');
    const mes = detall(container).querySelector('.sdp-explorador__mes');
    expect(mes.querySelector('summary').textContent).toBe('Mostra’n 6 més');
    expect(mes.querySelectorAll('li')).toHaveLength(6);
  });
});
