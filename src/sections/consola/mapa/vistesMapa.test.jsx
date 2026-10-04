import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

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
import { TEXTOS_AVIS } from './grafMapa.js';

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

/* Ordre del Mestre, 261004 (xat: cap xifra solta) · Tota targeta de les
   vistes del Mapa és una UniversalCard sencera: la boina de Sóc de Poble
   (l'autor porta a /projecte, la data a la pastilla), la icona a la
   insígnia lateral, títol, subtítol, entradeta, tota la targeta porta a la
   seua pàgina pròpia (/consola/xifres/<slug>) i el peu canònic.
   Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): «tota
   targeta de resum és la del Panell de Control» (UniversalCard «action»,
   icona de 40 px, sense boina ni pàgina; quieta si no obria res). */
function totesAmbBoina() {
  const targetes = [...document.querySelectorAll('article.sp-card')];
  expect(targetes.length).toBeGreaterThan(0);
  for (const t of targetes) {
    const titol = t.querySelector('h3.sp-card-title').textContent;
    expect(t.className, titol).toBe('sp-card sdp-consola__targeta');
    expect(t.parentElement.className).toBe('sdp-card-grid sdp-consola__graella');
    expect(t.firstElementChild.className).toBe('sp-card-header');
    expect(t.querySelector('.sp-card-header a.sp-card-author-link').getAttribute('href')).toBe('/projecte');
    expect(t.querySelector('.sp-card-header .sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(t.querySelector('.sp-card-header time.btn-date-time')).not.toBeNull();
    expect(t.querySelector('.sp-card-calendar-badge svg').getAttribute('width')).toBe('48');
    expect(t.querySelector('h4.sp-card-subtitle').textContent.length, titol).toBeGreaterThan(0);
    expect(t.querySelector('.sp-card-text > p').textContent.split(/(?<=\.) /).length, titol).toBeGreaterThanOrEqual(3);
    expect(t.querySelector('a.sp-card-link-overlay').getAttribute('href'), titol).toMatch(/^\/consola\/xifres\/[a-z0-9-]+$/);
    expect([...t.querySelectorAll('.sp-card-footer button')].map((b) => b.getAttribute('aria-label')), titol)
      .toEqual([`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`, `Connectar amb ${titol}`]);
  }
  expect(document.querySelector('.sdp-consola__resum, .sdp-consola__xifra, .sdp-consola__tauler, .sp-card--action, .sdp-consola__quieta')).toBeNull();
  return targetes;
}

const titols = () => [...document.querySelectorAll('article.sp-card h3')].map((h) => h.textContent);

describe('Fluxos de treball', () => {
  test('sense cap cadena ho diu, i la prosa queda com a suggeriment', () => {
    render(<FluxosMapa mapa={MAPA} />);
    totesAmbBoina();
    // 0 cadenes · 1 suggeriment · 2 punts de trobada (04_escriptori i AGENTS.md) · 1 lloc sense lector (04_escriptori)
    expect(titols()).toEqual(['0 cadenes declarades', '1 suggeriment de la prosa', '2 punts de trobada', '1 lloc amb faena i cap lector']);
    expect(screen.getByText('Cap cadena declarada')).toBeTruthy();
    /* Correcció 261004 (verificador de la segona passada, punt 2) · el
       recompte de l'estat buit enllaça amb la seua targeta. */
    const buit = screen.getByText('Cap cadena declarada').closest('.sdp-buit');
    expect([...buit.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]))
      .toEqual([['1 lloc', '/consola/xifres/llocs-sense-lector']]);
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
    totesAmbBoina();
    expect(screen.getByText('Agents atòmics al Mas: cap')).toBeTruthy();
    /* Correcció 261004 (verificador de la tercera passada, punt 5) · davant,
       la targeta del recompte («0 agents atòmics»), que la coberta destacava
       sense targeta. */
    expect(titols()).toEqual(['0 agents atòmics', 'Fluxos de treball', 'Tauler', 'Agents que treballen sols', 'Qui avisa quan algo es trenca']);
    /* Ordre del Mestre, 261004 (xat: cap xifra solta) · cada peça porta a la
       seua pàgina pròpia. Derogat per l'ordre del Mestre del 261004 (xat: cap
       xifra solta): la T11 del 260930 (les peces són dades, cap porta, i
       totes quietes). */
    expect([...document.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href'))).toEqual([
      '/consola/xifres/agents-atomics',
      '/consola/xifres/peca-fluxos-de-treball', '/consola/xifres/peca-tauler', '/consola/xifres/peca-agents-sols', '/consola/xifres/peca-vigilants'
    ]);
    // El text nomena la pàgina del detall de fons de cada peça amb el títol del catàleg.
    expect(document.body.textContent).toContain(
      'cada targeta diu com està hui i porta a la seua pàgina, i el detall de fons és, per este ordre, a les pàgines «Fluxos de treball», «Entrades i eixides», «Calendari de processos» i «Avisos i salut» de la Consola.');
    expect(document.body.textContent).not.toMatch(/pàgina del tauler/);
    const etiquetes = [...document.querySelectorAll('.sp-card-label')].map((l) => l.textContent);
    expect(etiquetes).toEqual(['FALTA', 'SENSE LECTOR', 'PARCIAL', 'PARCIAL']);
    expect(document.body.textContent).not.toMatch(/ejemplo|exemple/i);
    /* Correcció 261004 (verificador de la segona passada, punts 2 i 3) · el
       recompte dels agents enllaça amb la seua targeta, i concorda. */
    const buit = screen.getByText('Agents atòmics al Mas: cap').closest('.sdp-buit');
    expect([...buit.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]))
      .toEqual([['Els 2 agents', '/consola/xifres/agents']]);
    expect(buit.textContent).toContain('Els 2 agents que troba el Mapa són arnesos que conversen amb el Mestre');
  });

  test('amb un sol agent, la frase concorda: mai «Els 1 agents»', () => {
    const un = { ...MAPA, nodes: MAPA.nodes.filter((x) => x.id !== 'agent:antigravity') };
    render(<AgentsAtomics mapa={un} />);
    const buit = screen.getByText('Agents atòmics al Mas: cap').closest('.sdp-buit');
    expect(buit.textContent).not.toContain('Els 1 agents');
    expect(buit.textContent).toContain('L’únic agent que troba el Mapa és un arnés que conversa amb el Mestre (pàgina Actors): no declara què llig ni què deixa, així que tot el que fa passa per la conversa.');
    expect(buit.querySelector('a').getAttribute('href')).toBe('/consola/xifres/agents');
  });
});

describe('Actors', () => {
  test('capa per capa, amb el que troba el Mapa', () => {
    render(<ActorsMapa mapa={MAPA} />);
    totesAmbBoina();
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

  /* Ordre del Mestre, 261004 (xat: cap xifra solta) · també els títols i
     els subtítols de les targetes que porten una ruta (titolPrivat), i els
     noms de fitxer de les entradetes, en <Mono>. */
  test('el mode privacitat amaga les rutes dels scripts', () => {
    render(<PrivacitatConsola.Provider value><ActorsMapa mapa={MAPA} /></PrivacitatConsola.Provider>);
    expect(document.body.textContent).not.toContain('hooks-local.mjs');
    expect(document.body.textContent).not.toContain('reflex_daemon.mjs');
    expect(document.body.textContent).not.toContain('mapa.json');
    expect(document.body.textContent).not.toContain('registre_tasques.json');
    const capes = (nom) => [...screen.getByRole('heading', { level: 3, name: nom }).closest('section').querySelectorAll('article h3')].map((h) => h.textContent);
    expect(capes('La memòria d’arrencada')).toEqual(['Carregador d’arrencada', 'Carregador d’arrencada']);
    // Correcció 261004 (verificador de la tercera passada, punt 5) · el recompte del sòl, davant, no porta cap ruta.
    expect(capes('El sòl')).toEqual(['2 llocs del sòl', 'Lloc del sòl', 'Lloc del sòl']);
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
    totesAmbBoina();
    const conversen = screen.getByRole('heading', { level: 3, name: 'Els que conversen' }).closest('section');
    /* Correcció 261004 (verificador de la segona passada) · la capa comença
       per la xifra «agents» del tauler, que es tracta ací. */
    const [recompte, ...arnesos] = [...conversen.querySelectorAll('article.sp-card')];
    expect(recompte.querySelector('h3').textContent).toBe('3 agents');
    expect(recompte.querySelector('a.sp-card-link-overlay').getAttribute('href')).toBe('/consola/xifres/agents');
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
    // Ordre del Mestre, 261004 (xat: cap xifra solta) · la icona, a la insígnia lateral.
    const icona = (titol) => within(candats).getByRole('heading', { level: 3, name: titol })
      .closest('article').querySelector('.sp-card-calendar-badge svg').getAttribute('class');
    expect(icona('SessionStart')).toMatch(/circle-dashed/);
    expect(icona('pre-commit')).toMatch(/git-branch/);
  });
});

/* Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): «les
   altres vistes del Mapa també usen la targeta del Control». */
describe('les altres vistes del Mapa també són targetes amb boina i pàgina pròpia', () => {
  test.each([
    ['Calendari', () => <CalendariMapa mapa={MAPA} locale="ca-ES" />],
    ['Inventari', () => <InventariMapa mapa={MAPA} locale="ca-ES" />],
    ['Entrades i eixides', () => <EntradesEixides mapa={MAPA} />],
    ['Avisos i salut', () => <MapaConsola locale="ca-ES" font={{ estat: 'ready', mapa: MAPA, error: null, carrega: vi.fn() }} />]
  ])('%s', (_, Vista) => {
    render(<Vista />);
    totesAmbBoina();
  });

  /* Correcció 261004 (verificador de la segona passada) · Avisos i salut pinta
     les anomalies del tauler que s'hi tracten i les tasques del Mapa; els
     nodes i les arestes, a l'Explorador. */
  test('sense Mapa, Avisos i salut pinta les seues targetes amb el nom: cap pàgina sense targeta', () => {
    render(<MapaConsola locale="ca-ES" font={{ estat: 'absent', mapa: null, error: null, carrega: vi.fn() }} />);
    totesAmbBoina();
    expect(titols()).toEqual(['Avisos del Mapa', 'Avisos alts', 'Mètriques de salut amb mesura', 'Línies del LEDGER',
      'Torns caducats', 'Skills fora del segell', 'Tasques del Mapa']);
    expect(document.body.textContent).not.toMatch(/\d+ (avisos|nodes|arestes|tasques)/);
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

/* T3 (ordre del Mestre, 260930) · Llei del Píxel. La coberta del tauler
   compta amb els mateixos predicats que les pàgines, i per això estos ixen
   de les vistes a mòduls purs. Estes guardes fixen el que es veu avui i han
   de passar igual abans i després de l'extracció. */
describe('Llei del Píxel · les vistes no canvien quan els seus càlculs ixen a mòduls purs', () => {
  const titolsIDescripcions = () => [...document.querySelectorAll('article.sp-card')]
    .map((t) => [t.querySelector('h3').textContent, t.querySelector('h4').textContent]);

  test('Inventari: xifres, semàfor per skill, avisos i filtres', () => {
    render(<InventariMapa mapa={MAPA} locale="ca-ES" />);
    /* Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): les
       xifres soltes ['2', '1 / 2', '1', '0']. Ara són targetes que diuen què
       compten, i porten a la seua pàgina pròpia. */
    // Correcció 261004 (verificador de la segona passada) · també «skills amb avisos», la del tauler que es tracta ací.
    /* Correcció 261004 (verificador de la tercera passada, punt 5) · els estats
       que la coberta destaca tenen targeta: quantes en roig i en ambre, i les
       skills sense disparador útil. Derogat «Semàfor ambre o roig a l’Inventari». */
    expect(titolsIDescripcions()).toEqual([
      ['2 skills', 'Al cens del Mapa del Mas'],
      ['1 skill sense cap avís', 'De 2 skills al cens: semàfor verd a l’Inventari'],
      ['1 skill amb avisos', '0 en roig · 1 en ambre a l’Inventari'],
      ['1 skill òrfena', '0 skills fantasma: nomenades i sense carpeta al disc'],
      ['0 skills fora d’algun cens', 'Índex, catàleg de Claude, segell o disc'],
      ['0 skills sense disparador útil', 'El router no les pot triar soles']
    ]);
    const taula = screen.getByRole('region', { name: 'Inventari de skills' });
    const files = () => [...taula.querySelectorAll('tbody tr')].map((tr) => {
      const [semafor, , , , , , , , avisos] = tr.children;
      return [tr.querySelector('th').textContent, semafor.textContent, semafor.firstElementChild?.className ?? null,
        avisos.textContent, avisos.firstElementChild?.className ?? null];
    });
    /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515): la
       columna Avisos ja no pinta el codi cru sol, sinó el codi amb el color
       de la severitat, la frase de TEXTOS_AVIS i l'evidència en <Mono>. */
    expect(files()).toEqual([
      ['wiki-busca-skills', 'ambre · 1', 'sdp-insignia sdp-insignia--avis', `orfe${TEXTOS_AVIS.orfe}mapa`, 'sdp-consola__avis'],
      ['sdp-workflow', 'verd', 'sdp-insignia sdp-insignia--exit', 'cap', null]
    ]);
    const avis = taula.querySelector('.sdp-consola__avis');
    expect([...avis.children].map((el) => `${el.tagName}.${el.className}`))
      .toEqual(['SPAN.sdp-insignia sdp-insignia--avis', 'P.', 'CODE.sdp-consola__mono']);
    const filtres = screen.getByRole('group', { name: 'Quines skills es mostren' });
    expect(within(filtres).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Totes', 'Amb avisos', 'Òrfenes', 'Fora d’algun cens', 'Nucli']);
    fireEvent.click(within(filtres).getByRole('button', { name: 'Òrfenes' }));
    expect(files().map(([nom]) => nom)).toEqual(['wiki-busca-skills']);
    fireEvent.click(within(filtres).getByRole('button', { name: 'Fora d’algun cens' }));
    expect(taula.querySelector('tbody').textContent).toBe('Cap skill casa amb el filtre.');
    fireEvent.click(within(filtres).getByRole('button', { name: 'Nucli' }));
    expect(files().map(([nom]) => nom)).toEqual(['sdp-workflow']);
  });

  test('Fluxos: el buit diu quants llocs reben faena i ningú no la replega', () => {
    render(<FluxosMapa mapa={MAPA} />);
    expect(screen.getByText('Cap cadena declarada').closest('.sdp-buit').querySelector('.sdp-buit__text').textContent)
      .toContain('Cap ruta ni skill declara que llig el que una altra deixa: 1 lloc rep faena i ningú no declara que la replega.');
  });

  test('Agents atòmics: la descripció de cada peça', () => {
    render(<AgentsAtomics mapa={MAPA} />);
    /* Correcció 261004 (verificador de la segona passada, punt 3) · cada
       recompte concorda i el subtítol comença en majúscula. Derogat per
       l'ordre del Mestre del 261004 (xat: cap xifra solta): «1 suggeriments»,
       «1 de 2 … són vives», «vigilants vius: …» i «1 avisos alts». */
    // Correcció 261004 (verificador de la tercera passada, punt 5) · davant, el recompte dels agents atòmics.
    expect(titolsIDescripcions()).toEqual([
      ['0 agents atòmics', 'Agents que declaren què lligen o què deixen'],
      ['Fluxos de treball', '0 cadenes declarades · 1 suggeriment de la prosa'],
      ['Tauler', '04_escriptori rep la faena de 3 peces · ningú no declara que la llig'],
      ['Agents que treballen sols', '1 de 2 tasques que llança launchd és viva'],
      ['Qui avisa quan algo es trenca', 'Vigilants vius: 1 / 2 · 1 avís alt al Mapa']
    ]);
    expect([...document.querySelectorAll('.sp-card-label')].map((l) => l.className))
      .toEqual(['sp-card-label sdp-badge-tag', 'sp-card-label sdp-badge-tag', 'sp-card-label sdp-badge-tag', 'sp-card-label sdp-badge-tag']);
  });

  test('Actors: al sòl, només el lloc amb faena i cap lector porta SENSE LECTOR', () => {
    render(<ActorsMapa mapa={MAPA} />);
    const sol = screen.getByRole('heading', { level: 3, name: 'El sòl' }).closest('section');
    // Correcció 261004 (verificador de la tercera passada, punt 5) · davant, el recompte del sòl, que diu quants no tenen lector.
    expect([...sol.querySelectorAll('article.sp-card')].map((t) => [
      t.querySelector('h3').textContent, [...t.querySelectorAll('.sp-card-label')].map((l) => l.textContent)
    ])).toEqual([['2 llocs del sòl', []], ['04_escriptori', ['SENSE LECTOR']], ['AGENTS.md', []]]);
    expect(sol.querySelector('article h4').textContent).toBe('Documents i plantilles on treballen · 1 sense lector');
  });

  /* Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): les
     xifres soltes ['2', 'avisos, 1 d’alts'], ['1 / 2', …], ['16', 'nodes'] i
     ['13', 'arestes']. Ara diuen què compten al títol.
     Correcció 261004 (verificador de la segona passada, punt 2) · Els nodes i
     les arestes es pinten a l'Explorador, la pàgina que nomena el seu «On es
     tracta»; ací, les anomalies del tauler que es tracten ací i les tasques
     del Mapa («Veure les N tasques» no tenia cap targeta). Els desplegables
     ja no porten cap recompte. */
  test('Avisos i salut: les seues xifres, amb les mètriques mesurades', () => {
    render(<MapaConsola locale="ca-ES" font={{ estat: 'ready', mapa: MAPA, error: null, carrega: vi.fn() }} />);
    expect(titolsIDescripcions()).toEqual([
      ['2 avisos del Mapa', '1 alt · 1 mitjà · 0 baixos'],
      ['1 avís alt', 'Severitat alta: cal actuar'],
      // Correcció 261004 (verificador de la tercera passada, punts 3 i 5) · derogat «De 2 mètriques: la resta, N/A».
      ['1 mètrica de salut amb mesura', 'De 2 mètriques: 1 sense mesura (N/A)'],
      ['LEDGER sense mesura', 'Segells fòssils i línies mal formades'],
      ['Torns sense mesura', 'Oberts i sense tancar'],
      ['Segell sense mesura', 'O divergents (només els SKILL.md)'],
      ['4 tasques al Mapa', '1 viva · 1 morta · 1 sense llançador · 1 d’estat desconegut']
    ]);
    expect([...document.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href'))).toEqual(
      ['avisos', 'avisos-alts', 'metriques-amb-mesura', 'linies-ledger', 'torns-caducats', 'skills-fora-del-segell', 'tasques-del-mapa']
        .map((s) => `/consola/xifres/${s}`));
    expect([...document.querySelectorAll('details > summary')].map((s) => s.textContent)).toEqual([
      'Veure els avisos, el més greu primer', 'Veure les tasques i els seus llançadors', 'Veure la funció de salut',
      'Veure els nodes per tipus i les arestes per confiança', 'Veure totes les arestes'
    ]);
  });
});

/* Ordre del Mestre, 261004 (prompt 261004_0515, §6: cap anomalia del cervell
   sense mostrar) · Cada avís amb la seua frase, i totes les evidències, en
   tipografia de màquina i amagades pel mode privacitat. */
describe('261004 · avisos dits per a persones, amb totes les evidències', () => {
  const ambEvidencies = {
    ...MAPA,
    avisos: [...MAPA.avisos.map((x) => (x.codi === 'orfe' ? x : { ...x, evidencies: [x.evidencia, 'launchd · última línia amb error'] })),
      { node: 'skill:sdp-workflow', codi: 'codi-nou', severitat: 'baixa', evidencia: null }]
  };
  const salut = (privat = false) => render(
    <PrivacitatConsola.Provider value={privat}>
      <MapaConsola locale="ca-ES" font={{ estat: 'ready', mapa: ambEvidencies, error: null, carrega: vi.fn() }} />
    </PrivacitatConsola.Provider>
  );
  const filesAvisos = () => [...screen.getByRole('region', { name: 'Avisos del mapa' }).querySelectorAll('tbody tr')]
    .map((tr) => [tr.children[1].textContent, tr.children[3].textContent]);

  test('Avisos i salut: «codi: frase», i l’evidència, una o totes', () => {
    salut();
    expect(filesAvisos()).toEqual([
      [`tasca-morta: ${TEXTOS_AVIS['tasca-morta']}`, 'tooling/wiki/core/reflex_daemon.mjslaunchd · última línia amb error'],
      [`orfe: ${TEXTOS_AVIS.orfe}`, 'mapa'],
      ['codi-nou', '—']
    ]);
    const llista = screen.getByRole('list', { name: '2 evidències' });
    expect(llista.className).toBe('sdp-consola__evidencies');
    expect([...llista.querySelectorAll('li > code.sdp-consola__mono')].map((c) => c.textContent))
      .toEqual(['tooling/wiki/core/reflex_daemon.mjs', 'launchd · última línia amb error']);
  });

  test('amb el mode privacitat, cap evidència es veu (abans la taula d’avisos l’ensenyava)', () => {
    salut(true);
    const taula = screen.getByRole('region', { name: 'Avisos del mapa' });
    expect(taula.textContent).not.toContain('reflex_daemon');
    expect(taula.textContent).not.toContain('launchd · última');
    // La frase no és cap dada privada: es continua llegint.
    expect(taula.textContent).toContain(TEXTOS_AVIS['tasca-morta']);
  });

  test('Inventari: cada avís de la skill, amb totes les evidències', () => {
    const mapa = { ...MAPA, avisos: [{ node: 'skill:sdp-workflow', codi: 'crida-inexistent', severitat: 'mitjana',
      evidencia: 'a → x', evidencies: ['a → x', 'a → y'] }] };
    render(<InventariMapa mapa={mapa} locale="ca-ES" />);
    const avis = document.querySelector('.sdp-consola__avis');
    expect(avis.querySelector('.sdp-insignia').textContent).toBe('crida-inexistent');
    expect(avis.querySelector('p').textContent).toBe(TEXTOS_AVIS['crida-inexistent']);
    expect([...avis.querySelectorAll('ul.sdp-consola__evidencies > li')].map((li) => li.textContent)).toEqual(['a → x', 'a → y']);
  });

  test('Inventari sense router llegible: el filtre continua funcionant com a estat local', () => {
    render(<InventariMapa mapa={MAPA} locale="ca-ES" />);
    const filtres = screen.getByRole('group', { name: 'Quines skills es mostren' });
    fireEvent.click(within(filtres).getByRole('button', { name: 'Amb avisos' }));
    const noms = [...screen.getByRole('region', { name: 'Inventari de skills' }).querySelectorAll('tbody th')].map((th) => th.textContent);
    expect(noms).toEqual(['wiki-busca-skills']);
  });
});
