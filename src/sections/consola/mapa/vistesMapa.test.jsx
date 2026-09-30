import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { PrivacitatConsola } from '../peces.jsx';
import { FluxosMapa } from './FluxosMapa.jsx';
import { AgentsAtomics } from './AgentsAtomics.jsx';
import { ActorsMapa } from './ActorsMapa.jsx';
import { CalendariMapa } from './CalendariMapa.jsx';
import { InventariMapa } from './InventariMapa.jsx';
import { EntradesEixides } from './EntradesEixides.jsx';
import { MapaConsola } from './MapaConsola.jsx';

afterEach(cleanup);

const n = (id, tipus, atributs = {}) => ({ id, tipus, font: null, atributs });
const a = (de, cap, tipus, confianca = 'declarat', evidencia = null) => ({ de, a: cap, tipus, confianca, evidencia });

/* La forma del Mapa real del 25-09: totes les rutes deixen la faena a
   l'Escriptori i cap no declara que la llig, dos arnesos, candats amb i sense
   consumidor, i una menció de prosa entre skills. */
const MAPA = Object.freeze({
  schema: 'sdp.mapa.v1',
  generat: '2026-09-25T13:12:23.715Z',
  tall: { branca: 'backup-notes-publish', commit: '18acb41b', arbre_net: false },
  nodes: [
    n('agent:claude-code', 'agent', { arnes: 'Claude Code' }),
    n('agent:antigravity', 'agent', { arnes: 'Antigravity' }),
    n('hook:claude:PreToolUse', 'hook', { arnes: 'Claude Code', esdeveniment: 'PreToolUse', consumidor_acreditat: true }),
    n('hook:antigravity:PostToolUse', 'hook', { arnes: 'Antigravity', esdeveniment: 'PostToolUse', consumidor_acreditat: false }),
    n('script:tooling/gates/hooks-local.mjs', 'script'),
    n('document:CLAUDE.md', 'document'), n('document:AGENTS.md', 'document'),
    n('document:.agents/cervell.json', 'document'),
    n('document:_wiki_de_poble/04_escriptori', 'document'),
    n('ruta:acta', 'ruta'), n('ruta:auditoria', 'ruta'), n('ruta:prompt.local', 'ruta'),
    n('skill:sdp-workflow', 'skill', { core: true, status: 'canonic', al_disc: true }),
    n('skill:wiki-busca-skills', 'skill', { status: 'canonic', al_disc: true }),
    n('tasca:plaquetes-diagnostic', 'tasca'), n('tasca:reflex-daemon', 'tasca')
  ],
  arestes: [
    a('agent:claude-code', 'hook:claude:PreToolUse', 'dispara'),
    a('agent:antigravity', 'hook:antigravity:PostToolUse', 'dispara'),
    a('hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs', 'dispara', 'derivat'),
    a('agent:claude-code', 'document:CLAUDE.md', 'carrega'),
    a('document:CLAUDE.md', 'document:AGENTS.md', 'carrega'),
    a('document:CLAUDE.md', 'skill:sdp-workflow', 'carrega'),
    a('document:.agents/cervell.json', 'skill:sdp-workflow', 'carrega'),
    a('ruta:acta', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    a('ruta:auditoria', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    a('ruta:prompt.local', 'document:_wiki_de_poble/04_escriptori', 'escriu'),
    a('ruta:prompt.local', 'document:AGENTS.md', 'llig'),
    a('ruta:prompt.local', 'skill:sdp-workflow', 'governa'),
    a('skill:sdp-workflow', 'skill:wiki-busca-skills', 'crida', 'inferit', '.agents/skills/sdp-workflow/SKILL.md')
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

/** Tota targeta de resum és la del Panell de Control i viu dins de .sdp-card-grid; la que no obri res, quieta. */
const esClicable = (t) => [...t.children].some((c) => c.classList.contains('sp-card-link-overlay'));
function totesDeControl() {
  const targetes = [...document.querySelectorAll('article.sp-card')];
  expect(targetes.length).toBeGreaterThan(0);
  for (const t of targetes) {
    expect(t.className).toBe(esClicable(t) ? 'sp-card sp-card--action' : 'sp-card sp-card--action sdp-consola__quieta');
    expect(t.parentElement.classList.contains('sdp-card-grid')).toBe(true);
    expect(t.querySelector('.sp-card-title-icon svg').getAttribute('width')).toBe('40');
  }
  expect(document.querySelector('.sdp-consola__resum, .sdp-consola__xifra, .sdp-consola__tauler')).toBeNull();
  return targetes;
}

const titols = () => [...document.querySelectorAll('article.sp-card h3')].map((h) => h.textContent);

describe('Fluxos de treball', () => {
  test('sense cap cadena ho diu, i la prosa queda com a suggeriment', () => {
    render(<FluxosMapa mapa={MAPA} />);
    totesDeControl();
    // 0 cadenes · 1 suggeriment · 2 punts de trobada (04_escriptori i AGENTS.md)
    expect(titols()).toEqual(['0', '1', '2']);
    expect(screen.getByText('Cap cadena declarada')).toBeTruthy();
    const suggeriments = screen.getByRole('region', { name: 'Suggeriments de la prosa' });
    expect(within(suggeriments).getByText('sdp-workflow')).toBeTruthy();
    expect(within(suggeriments).getByText('wiki-busca-skills')).toBeTruthy();
    const punts = screen.getByRole('region', { name: 'Punts de trobada' });
    const fila = within(punts).getByText('04_escriptori').closest('tr');
    expect(within(fila).getByText('ningú')).toBeTruthy();
  });

  test('una cadena declarada es pinta pas a pas amb el seu enllaç', () => {
    const mapa = { ...MAPA, arestes: [...MAPA.arestes, a('ruta:acta', 'document:_wiki_de_poble/04_escriptori', 'llig')] };
    render(<FluxosMapa mapa={mapa} />);
    expect(screen.queryByText('Cap cadena declarada')).toBeNull();
    const cadena = screen.getByRole('region', { name: 'Cadena auditoria → acta' });
    expect(within(cadena).getAllByRole('row').slice(1)).toHaveLength(2);
    expect(cadena.textContent).toContain('auditoria deixa 04_escriptori i acta el llig');
    expect(screen.getByRole('region', { name: 'Cadena prompt.local → acta' })).toBeTruthy();
    // Jerarquia: seccions en H3 i cada cadena, un nivell per davall.
    expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
    expect([...document.querySelectorAll('section > h3')].map((h) => h.textContent))
      .toEqual(['Cadenes declarades', 'Suggeriments de la prosa', 'Punts de trobada']);
    expect([...document.querySelectorAll('section > h4')].map((h) => h.textContent))
      .toEqual(expect.arrayContaining(['auditoria → acta', 'prompt.local → acta']));
  });
});

describe('Agents atòmics', () => {
  test('cap agent atòmic, i les quatre peces mesurades amb el Mapa', () => {
    render(<AgentsAtomics mapa={MAPA} />);
    const targetes = totesDeControl();
    expect(screen.getByText('Agents atòmics al Mas: cap')).toBeTruthy();
    expect(titols()).toEqual(['Fluxos de treball', 'Tauler', 'Agents que treballen sols', 'Qui avisa quan algo es trenca']);
    // T11 (ordre del Mestre, 260930): les peces són dades. A cada pàgina s'entra
    // per la seua targeta del tauler; ací no hi ha cap porta, ni se'n promet cap.
    expect(screen.queryAllByRole('link')).toEqual([]);
    expect(targetes.every((t) => t.classList.contains('sdp-consola__quieta'))).toBe(true);
    expect(document.body.textContent).not.toMatch(/porta a la pàgina/);
    // Sense enllaç, el text nomena la pàgina de cada peça amb el títol del catàleg.
    expect(document.body.textContent).toContain(
      'el detall és, per este ordre, a les pàgines «Fluxos de treball», «Entrades i eixides», «Calendari de processos» i «Avisos i salut» de la Consola.');
    expect(document.body.textContent).not.toMatch(/pàgina del tauler/);
    const etiquetes = [...document.querySelectorAll('.sp-card-label')].map((l) => l.textContent);
    expect(etiquetes).toEqual(['FALTA', 'SENSE LECTOR', 'PARCIAL', 'PARCIAL']);
    expect(document.body.textContent).not.toMatch(/ejemplo|exemple/i);
  });
});

describe('Actors', () => {
  test('capa per capa, amb el que troba el Mapa', () => {
    render(<ActorsMapa mapa={MAPA} />);
    totesDeControl();
    // L'H2 és la introducció de la pàgina (UniversalPage): les capes van en H3.
    expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
    expect([...document.querySelectorAll('section > h3')].map((h) => h.textContent)).toEqual([
      'Els que conversen', 'La memòria d’arrencada', 'Els candats', 'El que corre sol', 'El sòl'
    ]);
    expect(titols()).toEqual(expect.arrayContaining(['Antigravity', 'Claude Code', 'CLAUDE.md', 'cervell.json', 'PreToolUse', 'pre-commit', 'plaquetes-diagnostic', 'reflex-daemon']));
    const etiquetes = [...document.querySelectorAll('.sp-card-label')].map((l) => l.textContent);
    expect(etiquetes).toEqual(expect.arrayContaining(['ACTIU', 'SENSE CONSUMIDOR', 'DESCONEGUT', 'VIU', 'MORT', 'FALTA']));
    expect(screen.getByText(/cap arnés declara que el carrega/)).toBeTruthy();
    // T10: mentre Codex no arriba al Mapa, la pàgina diu per què no hi és.
    const conversen = screen.getByRole('heading', { level: 3, name: 'Els que conversen' }).closest('section');
    expect(conversen.textContent).toContain('Els dotze membres del Consell no hi apareixen');
    expect(conversen.textContent).toContain('Codex tampoc: al Mapa no ha arribat cap .codex/hooks.json.');
  });

  test('el mode privacitat amaga les rutes dels scripts', () => {
    render(<PrivacitatConsola.Provider value><ActorsMapa mapa={MAPA} /></PrivacitatConsola.Provider>);
    expect(document.body.textContent).not.toContain('hooks-local.mjs');
    expect(document.body.textContent).not.toContain('reflex_daemon.mjs');
  });

  /* T10 (ordre del Mestre, 260930): Codex entra a «Els que conversen» amb la
     forma que li dona el compilador (candats per acreditar, AGENTS.md per
     convenció i les fonts de context-local.mjs per derivació). */
  const MAPA_CODEX = Object.freeze({
    ...MAPA,
    nodes: [
      ...MAPA.nodes,
      n('agent:codex', 'agent', { arnes: 'Codex' }),
      n('hook:codex:SessionStart', 'hook', { arnes: 'Codex', esdeveniment: 'SessionStart', consumidor_acreditat: null }),
      n('script:tooling/brain/context-local.mjs', 'script')
    ],
    arestes: [
      ...MAPA.arestes,
      a('agent:codex', 'hook:codex:SessionStart', 'dispara'),
      a('hook:codex:SessionStart', 'script:tooling/brain/context-local.mjs', 'dispara', 'derivat'),
      a('agent:codex', 'document:AGENTS.md', 'carrega'),
      a('agent:codex', 'script:tooling/brain/context-local.mjs', 'carrega', 'derivat'),
      a('script:tooling/brain/context-local.mjs', 'document:AGENTS.md', 'carrega', 'derivat')
    ]
  });

  test('Codex conversa amb candats per acreditar: DESCONEGUT, i la targeta de Claude no canvia', () => {
    render(<ActorsMapa mapa={MAPA_CODEX} />);
    totesDeControl();
    const conversen = screen.getByRole('heading', { level: 3, name: 'Els que conversen' }).closest('section');
    const arnesos = [...conversen.querySelectorAll('article.sp-card')];
    expect(arnesos.map((t) => t.querySelector('h3').textContent)).toEqual(['Antigravity', 'Claude Code', 'Codex']);
    const [antigravity, claude, codex] = arnesos;
    expect(codex.textContent).toContain('1 candat · en arrencar carrega 1 document i 0 skills');
    expect(within(codex).getByText('DESCONEGUT')).toBeTruthy();
    expect(claude.textContent).toContain('1 candat · en arrencar carrega 2 documents i 1 skill');
    expect(within(claude).getByText('ACTIU')).toBeTruthy();
    expect(within(antigravity).getByText('SENSE CONSUMIDOR')).toBeTruthy();
    expect(conversen.textContent).not.toContain('Codex i les dotze');
    // Amb Codex al Mapa, la frase de la seua absència desapareix; la del Consell queda.
    expect(conversen.textContent).not.toContain('Codex tampoc');
    expect(conversen.textContent).toContain('Els dotze membres del Consell no hi apareixen');
    expect(conversen.textContent).toContain('DESCONEGUT vol dir');
    expect(screen.getByText(/el carrega Codex/)).toBeTruthy();
  });

  test('el candat de Codex no porta la icona de git', () => {
    render(<ActorsMapa mapa={MAPA_CODEX} />);
    const candats = screen.getByRole('heading', { level: 3, name: 'Els candats' }).closest('section');
    const icona = (titol) => within(candats).getByRole('heading', { level: 3, name: titol })
      .closest('article').querySelector('.sp-card-title-icon svg').getAttribute('class');
    expect(icona('SessionStart')).toMatch(/circle-dashed/);
    expect(icona('pre-commit')).toMatch(/git-branch/);
  });
});

describe('les altres vistes del Mapa també usen la targeta del Control', () => {
  test.each([
    ['Calendari', () => <CalendariMapa mapa={MAPA} locale="ca-ES" />],
    ['Inventari', () => <InventariMapa mapa={MAPA} locale="ca-ES" />],
    ['Entrades i eixides', () => <EntradesEixides mapa={MAPA} />],
    ['Avisos i salut', () => <MapaConsola locale="ca-ES" font={{ estat: 'ready', mapa: MAPA, error: null, carrega: vi.fn() }} />]
  ])('%s', (_, Vista) => {
    render(<Vista />);
    totesDeControl();
  });

  test('dins de la Consola, Avisos i salut no repetix el Refrescar de la capçalera', () => {
    render(<MapaConsola locale="ca-ES" font={{ estat: 'ready', mapa: MAPA, error: null, carrega: vi.fn() }} />);
    expect(screen.queryByRole('button', { name: /Refrescar/ })).toBeNull();
    expect(document.querySelectorAll('details.sdp-consola__detall')).toHaveLength(5);
  });

  /* T9 (ordre del Mestre, 260930): cap taula de la Consola porta el modificador
     de la caixa de 70vh; el vertical és el de la pàgina. */
  test('les taules llargues són taules denses sense cap caixa pròpia', () => {
    const regio = (nom) => document.querySelector(`[role="region"][aria-label="${nom}"]`).className;
    render(<><InventariMapa mapa={MAPA} locale="ca-ES" /><EntradesEixides mapa={MAPA} /></>);
    expect(regio('Inventari de skills')).toBe('sdp-taula sdp-taula--densa');
    expect(regio('Entrades i eixides')).toBe('sdp-taula sdp-taula--densa');
    cleanup();
    render(<MapaConsola locale="ca-ES" font={{ estat: 'ready', mapa: MAPA, error: null, carrega: vi.fn() }} />);
    expect(regio('Avisos del mapa')).toBe('sdp-taula sdp-taula--densa');
    expect(regio('Arestes del mapa')).toBe('sdp-taula sdp-taula--densa');
  });

  test('el calendari conserva a la taula el que abans deien les caixes', () => {
    render(<CalendariMapa mapa={MAPA} locale="ca-ES" />);
    const taula = screen.getByRole('region', { name: 'Tasques per cadència' });
    expect(within(taula).getByText('plaquetes-diagnostic')).toBeTruthy();
    expect(within(taula).getByText('cada hora · en arrencar')).toBeTruthy();
    expect(within(taula).getByText('higiene-basica')).toBeTruthy();
  });
});
