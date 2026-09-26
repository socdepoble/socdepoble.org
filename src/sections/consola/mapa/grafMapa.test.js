import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ESTIL_MAPA, etiquetaNode, filtresInicials, grafDelMapa, mostraGraf, relacionsDe, filesEntradesEixides } from './grafMapa.js';
import { ExploradorMapa } from './ExploradorMapa.jsx';

/* El canvas té les seues proves (BrainGraph.test.jsx). Ací només importa què
   rep el graf i on queda respecte de la cerca i dels filtres. */
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

const MAPA = Object.freeze({
  nodes: [
    { id: 'ruta:prompt.local', tipus: 'ruta', font: '.agents/protocolledge.json', atributs: {} },
    { id: 'plantilla:_wiki_de_poble/03_actuar/plantilles/prompt_local.md', tipus: 'plantilla', font: null, atributs: {} },
    { id: 'skill:wiki-documentacio-i-reflex', tipus: 'skill', font: '.agents/skills/wiki-documentacio-i-reflex/SKILL.md', atributs: { core: true } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} },
    { id: 'skill:core-automillora', tipus: 'skill', font: null, atributs: {} },
    { id: 'script:npm:porta', tipus: 'script', font: 'package.json', atributs: {} },
    { id: 'hook:claude:PreToolUse', tipus: 'hook', font: '.claude/settings.json', atributs: {} }
  ],
  arestes: [
    { de: 'ruta:prompt.local', a: 'plantilla:_wiki_de_poble/03_actuar/plantilles/prompt_local.md', tipus: 'encamina', confianca: 'declarat', evidencia: null },
    { de: 'ruta:prompt.local', a: 'skill:wiki-documentacio-i-reflex', tipus: 'governa', confianca: 'declarat', evidencia: null },
    { de: 'ruta:prompt.local', a: 'document:_wiki_de_poble/04_escriptori', tipus: 'escriu', confianca: 'declarat', evidencia: null },
    { de: 'skill:wiki-documentacio-i-reflex', a: 'skill:sdp-workflow', tipus: 'crida', confianca: 'inferit', evidencia: null }
  ],
  tasques: [],
  avisos: [{ node: 'skill:core-automillora', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' }],
  salut: []
});

describe('mostraGraf', () => {
  /* jsdom no calcula layout: la geometria es fixa a mà per a cada cas. */
  function escenari({ daltMarc, scrollTop = 0, desborda = true }) {
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    const marc = document.createElement('div');
    marc.style.scrollMarginTop = '74px';
    scroller.append(marc);
    document.body.append(scroller);
    Object.defineProperty(scroller, 'scrollHeight', { value: desborda ? 3000 : 500 });
    Object.defineProperty(scroller, 'clientHeight', { value: 500 });
    scroller.scrollTop = scrollTop;
    scroller.getBoundingClientRect = () => ({ top: 64 });
    marc.getBoundingClientRect = () => ({ top: daltMarc });
    return { scroller, marc };
  }
  afterEach(() => { document.body.replaceChildren(); });

  test('un graf per davall de mitja pantalla puja fins a la barra blava', () => {
    const { scroller, marc } = escenari({ daltMarc: 638 });
    // jsdom no sempre coneix scroll-margin-top: es resta el que calcule.
    const marge = Number.parseFloat(getComputedStyle(marc).scrollMarginTop) || 0;
    expect(mostraGraf(marc)).toBe(scroller);
    expect(scroller.scrollTop).toBe(638 - 64 - marge);
    expect(scroller.scrollTop).toBeGreaterThan(0);
  });

  test('un graf que ja es veu no mou res', () => {
    const { scroller, marc } = escenari({ daltMarc: 200 });
    expect(mostraGraf(marc)).toBeNull();
    expect(scroller.scrollTop).toBe(0);
  });

  test('si qui llig ja ha desplaçat, mana ell', () => {
    const { scroller, marc } = escenari({ daltMarc: 900, scrollTop: 40 });
    expect(mostraGraf(marc)).toBeNull();
    expect(scroller.scrollTop).toBe(40);
  });

  test('sense cap contenidor desplaçable, no fa res', () => {
    const { marc } = escenari({ daltMarc: 900, desborda: false });
    expect(mostraGraf(marc)).toBeNull();
    expect(mostraGraf(null)).toBeNull();
  });
});

describe('etiquetaNode', () => {
  test('lleva el prefix i la ruta', () => {
    expect(etiquetaNode({ id: 'skill:sdp-workflow' })).toBe('sdp-workflow');
    expect(etiquetaNode({ id: 'plantilla:_wiki_de_poble/03_actuar/plantilles/prompt_local.md' })).toBe('prompt_local.md');
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

describe('Explorador: el graf primer', () => {
  afterEach(cleanup);
  const pinta = () => render(createElement(ExploradorMapa, { mapa: MAPA }));
  const segueix = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const idsDelGraf = () => grafRebut.props.graf.nodes.map((n) => n.id).sort();

  test('cerca damunt, graf després i filtres davall, tots plegats', () => {
    const { container } = pinta();
    const cerca = screen.getByRole('searchbox', { name: 'Filtra per nom' });
    const graf = container.querySelector('.sdp-wiki-graf');
    const plegables = [...container.querySelectorAll('details')];
    expect(graf.querySelector('canvas')).toBeTruthy();
    expect(segueix(cerca, graf)).toBe(true);
    expect(plegables).toHaveLength(3);
    for (const d of plegables) {
      expect(segueix(graf, d)).toBe(true);
      expect(d.open).toBe(false);
    }
    expect(grafRebut.props.enquadra).toBe(true);
    expect(container.querySelector('[role="search"] [role="status"]').textContent).toBe('8 peces · 4 relacions');
  });

  test('els filtres plegats continuen filtrant, i el botó de la barra hi porta', () => {
    const { container } = pinta();
    expect(grafRebut.props.graf.nodes).toHaveLength(MAPA.nodes.length);
    fireEvent.click(screen.getByRole('switch', { name: 'Plantilla (1)', hidden: true }));
    expect(grafRebut.props.graf.nodes.some((n) => n.type === 'plantilla')).toBe(false);
    fireEvent.click(screen.getByRole('switch', { name: /^Fletxes/, hidden: true }));
    expect(grafRebut.props.fletxes).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Filtres (2)' }));
    const primer = container.querySelector('details');
    expect(primer.open).toBe(true);
    expect(document.activeElement).toBe(primer.querySelector('summary'));
    expect(primer.querySelector('summary').textContent).toBe('Tipus de peça8 de 9');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'reflex' } });
    expect(idsDelGraf()).toEqual(['ruta:prompt.local', 'skill:sdp-workflow', 'skill:wiki-documentacio-i-reflex']);

    // Restablir desapareix en quedar tot a l'inici: el focus passa al primer plegable.
    const restablir = screen.getByRole('button', { name: 'Restablir filtres' });
    restablir.focus();
    fireEvent.click(restablir);
    expect(grafRebut.props.graf.nodes).toHaveLength(MAPA.nodes.length);
    expect(grafRebut.props.fletxes).toBe(true);
    expect(screen.getByRole('button', { name: 'Filtres' })).toBeTruthy();
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
