import { describe, expect, test } from 'vitest';
import { capesActors, agentsAtomics, xifresDelMas } from './actorsMapa.js';

const n = (id, tipus, atributs = {}, font = null) => ({ id, tipus, font, atributs });
const a = (de, cap, tipus, confianca = 'declarat') => ({ de, a: cap, tipus, confianca, evidencia: null });

/* Un Mas en miniatura amb la forma del Mapa real: dos arnesos, candats amb i
   sense consumidor, la cadena d'arrencada i tres tasques. */
const MAPA = Object.freeze({
  nodes: [
    n('agent:claude-code', 'agent', { arnes: 'Claude Code' }, 'CLAUDE.md'),
    n('agent:antigravity', 'agent', { arnes: 'Antigravity' }, '.agents/hooks.json'),
    n('hook:claude:PreToolUse', 'hook', { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true }),
    n('hook:antigravity:PreToolUse', 'hook', { arnes: 'Antigravity', esdeveniment: 'PreToolUse', consumidor_acreditat: false }),
    n('script:tooling/gates/hooks-local.mjs', 'script'),
    n('document:CLAUDE.md', 'document'), n('document:AGENTS.md', 'document'),
    n('document:.agents/cervell.json', 'document'),
    n('skill:sdp-workflow', 'skill'), n('skill:core-identitat', 'skill'), n('skill:wiki-cicle-de-vida', 'skill'),
    n('ruta:acta', 'ruta'), n('document:_wiki/10_actes', 'document')
  ],
  arestes: [
    a('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
    a('agent:antigravity', 'hook:antigravity:PreToolUse', 'dispara'),
    a('hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat'),
    a('hook:antigravity:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat'),
    a('agent:claude-code', 'document:CLAUDE.md', 'carrega'),
    a('document:CLAUDE.md', 'document:AGENTS.md', 'carrega'),
    a('document:CLAUDE.md', 'skill:sdp-workflow', 'carrega'),
    a('document:.agents/cervell.json', 'skill:sdp-workflow', 'carrega'),
    a('document:.agents/cervell.json', 'document:AGENTS.md', 'carrega'),
    a('ruta:acta', 'document:_wiki/10_actes', 'escriu'),
    a('skill:sdp-workflow', 'skill:wiki-cicle-de-vida', 'crida', 'inferit')
  ],
  tasques: [
    { id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'org.x.plaquetes' }, cadencia: { cada_segons: 3600 }, script: 'scripts/p.mjs', font: null },
    { id: 'reflex', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 'org.x.reflex' }, cadencia: { permanent: true }, script: 'tooling/r.mjs', font: null },
    { id: 'frontissa', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: 'tooling/f.mjs', font: null },
    { id: 'higiene', estat: 'declarat-sense-llancador', llancador: null, cadencia: null, script: null, font: null },
    // El registre li posa launchd, però cap plist la llança: no corre sola.
    { id: 'time-machine', estat: 'declarat-sense-llancador', llancador: { tipus: 'launchd', etiqueta: 'org.x.tm' }, cadencia: { cada_segons: 1800 }, script: 'tooling/tm.mjs', font: null }
  ],
  avisos: [
    { node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' },
    { node: 'skill:core-identitat', codi: 'fora-index', severitat: 'mitjana', evidencia: null },
    { node: 'skill:wiki-cicle-de-vida', codi: 'pes', severitat: 'baixa', evidencia: null }
  ],
  salut: []
});

describe('capesActors', () => {
  const capes = capesActors(MAPA);

  test('els arnesos porten els seus candats i el que carreguen en arrencar', () => {
    const claude = capes.arnesos.find((x) => x.node.id === 'agent:claude-code');
    expect(claude.nom).toBe('Claude Code');
    expect(claude.candats).toBe(1);
    expect(claude.acreditats).toBe(1);
    // CLAUDE.md i el que CLAUDE.md carrega, sense repetir AGENTS.md ni sdp-workflow.
    expect(claude.arrencada.documents.map((x) => x.id)).toEqual(['document:AGENTS.md', 'document:CLAUDE.md']);
    expect(claude.arrencada.skills.map((x) => x.id)).toEqual(['skill:sdp-workflow']);
    const antigravity = capes.arnesos.find((x) => x.node.id === 'agent:antigravity');
    // Desmentit (false) no és desconegut: Antigravity continua SENSE CONSUMIDOR.
    expect(antigravity).toMatchObject({ candats: 1, acreditats: 0, desconeguts: 0 });
    expect(antigravity.arrencada.documents).toEqual([]);
    expect(claude.desconeguts).toBe(0);
  });

  test('cada carregador diu què carrega i quin arnés el carrega, o cap', () => {
    const perId = Object.fromEntries(capes.carregadors.map((c) => [c.node.id, c]));
    expect(Object.keys(perId).sort()).toEqual(['document:.agents/cervell.json', 'document:CLAUDE.md']);
    expect(perId['document:CLAUDE.md'].carrega.map((x) => x.id)).toEqual(['document:AGENTS.md', 'skill:sdp-workflow']);
    expect(perId['document:CLAUDE.md'].perQui.map((x) => x.id)).toEqual(['agent:claude-code']);
    expect(perId['document:.agents/cervell.json'].perQui).toEqual([]);
  });

  test('els candats són els hooks dels arnesos i els hooks de git del registre de tasques', () => {
    // El Mapa no llig .husky/: d'un hook de git no se sap si està instal·lat.
    expect(capes.candats.map((c) => `${c.arnes}|${c.esdeveniment}|${c.acreditat}`)).toEqual([
      'Antigravity|PreToolUse|false',
      'Claude Code|PreToolUse|true',
      'git|pre-commit|null'
    ]);
    expect(capes.candats[1].scripts).toEqual(['tooling/gates/hooks-local.mjs']);
    expect(capes.candats[2].scripts).toEqual(['tooling/f.mjs']);
  });

  test('corre sol el que té llançador de launchd; el que no en té, falta, encara que el registre el declare', () => {
    expect(capes.programades.map((t) => t.id)).toEqual(['plaquetes', 'reflex']);
    expect(capes.senseLlancador.map((t) => t.id)).toEqual(['higiene', 'time-machine']);
  });

  test('el sòl és on les peces escriuen o lligen', () => {
    expect(capes.sol.map((p) => p.node.id)).toEqual(['document:_wiki/10_actes']);
  });
});

/* T10 (ordre del Mestre, 260930) · Codex: candats per acreditar (null) i una
   càrrega d'arrencada que passa per un script de SessionStart. */
const AMB_CODEX = Object.freeze({
  ...MAPA,
  nodes: [
    ...MAPA.nodes,
    n('agent:codex', 'agent', { arnes: 'Codex' }, '.codex/hooks.json'),
    n('hook:codex:SessionStart', 'hook', { arnes: 'Codex', esdeveniment: 'SessionStart', consumidor_acreditat: null }),
    n('script:tooling/brain/context-local.mjs', 'script'),
    n('document:.agents/BOOTSTRAP.md', 'document')
  ],
  arestes: [
    ...MAPA.arestes,
    a('agent:codex', 'hook:codex:SessionStart', 'dispara'),
    a('hook:codex:SessionStart', 'script:tooling/brain/context-local.mjs', 'dispara', 'derivat'),
    a('agent:codex', 'document:AGENTS.md', 'carrega'),
    a('agent:codex', 'script:tooling/brain/context-local.mjs', 'carrega', 'derivat'),
    a('script:tooling/brain/context-local.mjs', 'document:AGENTS.md', 'carrega', 'derivat'),
    a('script:tooling/brain/context-local.mjs', 'document:.agents/BOOTSTRAP.md', 'carrega', 'derivat')
  ]
});

describe('capesActors · un arnés que carrega per script d’arrencada', () => {
  const capes = capesActors(AMB_CODEX);

  test('els candats per acreditar es compten a part, i AGENTS.md no es repetix', () => {
    const codex = capes.arnesos.find((x) => x.node.id === 'agent:codex');
    expect(codex).toMatchObject({ nom: 'Codex', candats: 1, acreditats: 0, desconeguts: 1 });
    expect(codex.arrencada.documents.map((x) => x.id)).toEqual(['document:.agents/BOOTSTRAP.md', 'document:AGENTS.md']);
    expect(codex.arrencada.skills).toEqual([]);
  });

  test('l’script d’arrencada és un carregador, i el carrega Codex', () => {
    const script = capes.carregadors.find((c) => c.node.id === 'script:tooling/brain/context-local.mjs');
    expect(script.carrega.map((x) => x.id)).toEqual(['document:.agents/BOOTSTRAP.md', 'document:AGENTS.md']);
    expect(script.perQui.map((x) => x.id)).toEqual(['agent:codex']);
    expect(capes.candats.map((c) => `${c.arnes}|${c.esdeveniment}|${c.acreditat}`)).toContain('Codex|SessionStart|null');
  });

  test('Codex continua sense ser un agent atòmic: carregar no és un contracte', () => {
    expect(agentsAtomics(AMB_CODEX)).toEqual([]);
  });
});

describe('agents atòmics i xifres del Mas', () => {
  test('un arnés sense contracte no és un agent atòmic', () => {
    expect(agentsAtomics(MAPA)).toEqual([]);
    const ambContracte = { ...MAPA, arestes: [...MAPA.arestes, a('agent:antigravity', 'document:_wiki/10_actes', 'escriu')] };
    expect(agentsAtomics(ambContracte).map((x) => x.node.id)).toEqual(['agent:antigravity']);
  });

  test('la prosa no fa contracte', () => {
    const inferit = { ...MAPA, arestes: [...MAPA.arestes, a('agent:antigravity', 'document:_wiki/10_actes', 'escriu', 'inferit')] };
    expect(agentsAtomics(inferit)).toEqual([]);
  });

  test('les cinc xifres de la capçalera d’Emowe, amb dades del Mapa', () => {
    expect(xifresDelMas(MAPA)).toEqual({
      skills: 3, agents: 2, opaques: 3, programades: 2, vives: 1, ambAvisos: 2
    });
  });
});
