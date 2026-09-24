import { describe, expect, test } from 'vitest';
import { etiquetaNode, filtresInicials, grafDelMapa, relacionsDe, filesEntradesEixides } from './grafMapa.js';

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
