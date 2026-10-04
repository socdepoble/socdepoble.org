import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';

/* Correcció 261004 (verificador de la segona passada, punt 1) · Ordre del
   Mestre, 261004: «Per a tindre pàgina pròpia has de ser una targeta (i
   viceversa).» Prova de propietat amb el router de veres: per a cada vista
   de la Consola (el tauler, les nou pàgines, el pols i els seus cinc panells)
   i amb el Mapa i consola.json presents o absents (producció), els slugs de
   les targetes que es pinten al DOM són exactament els que diu el registre
   (VISTES_XIFRES), i eixes són les úniques pàgines de xifra que existixen:
   qualsevol altre slug, també amb el prefix d'una família, és «Xifra no
   trobada». Tota pàgina porta la barra taronja. Només es falsegen les fonts. */
const fonts = vi.hoisted(() => ({ mapa: null, consola: null, llegint: false }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
// `llegint`: el Mapa encara no ha arribat (verificador de la tercera passada, punt 5).
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => {
    if (fonts.llegint) return { estat: 'loading', mapa: null, error: null, carrega: () => {} };
    return fonts.mapa
      ? { estat: 'ready', mapa: fonts.mapa, error: null, carrega: () => {} }
      : { estat: 'absent', mapa: null, error: null, carrega: () => {} };
  }
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(fonts.consola)
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { IDS_VISTES, targetesDeLaConsola, xifresDeVista } from './xifresMas.js';

const aresta = (de, cap, tipus, confianca = 'declarat') => ({ de, a: cap, tipus, confianca, evidencia: null });
const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
/* Un Mapa que pinta de tot: cada família de peces i cada xifra condicional. */
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
  credits: [{ proveidor: 'Claude', consumit: 6, limit: 100 }, { proveidor: 'Recàrrega automàtica', valor: 'DESACTIVADA', tipus: 'ajust', actiu: false }],
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
  segell: { hash: 'abcdef0123456789', timestamp: '2026-10-02T07:01:17.116Z', filesCount: 2, manifest: { 'a/SKILL.md': '1111', 'b/SKILL.md': '2222' } },
  immunitari: { operacions: 3, ultima: { op: 'OP-3', tipus: 'ADOPTA', fitxer: 'x.md', data: '2026-08-03T13:43:04.716Z' } },
  fonts: { diari: { estat: 'ok', 'línies_descartades': 1 }, immunitari: { estat: 'ok', 'línies_descartades': 0 } },
  termometria: { artefactesActius: 162, abast: 'Escriptori' }
};

let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  localStorage.clear();
  fonts.mapa = null;
  fonts.consola = null;
  fonts.llegint = false;
});

function Aplicacio() {
  return (
    <RouterProvider>
      <Routes>
        <Route path="/consola/*" element={<ConsolaSection />} />
      </Routes>
    </RouterProvider>
  );
}
const rutaDe = (vista) => (vista === 'tauler' ? '/consola' : `/consola/${vista}`);
/* Obri una ruta i espera que les dues fonts hagen acabat de llegir-se. */
async function obri(ruta) {
  window.history.replaceState(null, '', ruta);
  render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
}
const PREFIX = '/consola/xifres/';
const pintades = () => [...document.querySelectorAll(`a.sp-card-link-overlay[href^="${PREFIX}"]`)]
  .map((a) => a.getAttribute('href').slice(PREFIX.length));

const AMB = [['amb', true], ['sense', false]];
/* El tauler depén de les dues fonts; les pàgines del Mapa, del Mapa; el pols i
   els seus panells, de consola.json. */
const CASOS = IDS_VISTES.flatMap((vista) => {
  if (vista === 'tauler') return AMB.flatMap(([m, ambMapa]) => AMB.map(([c, ambConsola]) => [vista, `${m} Mapa i ${c} consola.json`, ambMapa, ambConsola]));
  if (vista === 'pols' || vista.startsWith('pols/')) return AMB.map(([c, ambConsola]) => [vista, `${c} consola.json`, true, ambConsola]);
  return AMB.map(([m, ambMapa]) => [vista, `${m} Mapa`, ambMapa, true]);
});

test.each(CASOS)('%s (%s): pinta exactament les targetes del registre, i cada una té la seua pàgina', async (vista, _nom, ambMapa, ambConsola) => {
  fonts.mapa = ambMapa ? MAPA : null;
  fonts.consola = ambConsola ? CONSOLA : null;
  await obri(rutaDe(vista));
  const registre = xifresDeVista(vista, fonts.mapa, fonts.consola).map((x) => x.slug);
  expect(pintades()).toEqual(registre);
  // Cada targeta pintada té pàgina amb les fonts d'ara (el viceversa, en el sentit targeta → pàgina).
  const ambPagina = targetesDeLaConsola(fonts.mapa, fonts.consola);
  for (const slug of pintades()) expect(ambPagina.has(slug), slug).toBe(true);
  // Tota pàgina porta la barra taronja.
  expect(document.querySelector('section.bar-orange'), vista).not.toBeNull();
  expect(errors).not.toHaveBeenCalled();
});

/* En el sentit pàgina → targeta: un slug que cap vista no pinta no té
   pàgina, també amb el prefix d'una família o d'una cadència. */
test.each([
  ['arnes-patata', true], ['lloc-qualsevol-cosa', true], ['agent-atomic-xyz', true], ['credit-res', true],
  ['cadencia-mes', true],
  ['arnes-claude-code', false], ['cadencia-dia', false], ['tasques-sense-llancador', false], ['lloc-wiki-de-poble-04-escriptori', false],
  ['credit-claude', false]
])('/consola/xifres/%s amb Mapa=%s (i sense consola.json si no n’hi ha): «Xifra no trobada»', async (slug, ambMapa) => {
  fonts.mapa = ambMapa ? MAPA : null;
  fonts.consola = null;
  await obri(`${PREFIX}${slug}`);
  expect(document.querySelector('h1').textContent).toBe('Xifra no trobada');
  expect(document.querySelector('section.bar-orange')).not.toBeNull();
  expect(errors).not.toHaveBeenCalled();
});

/* Correcció 261004 (verificador de la tercera passada, punt 5) · Mentre es
   llig el Mapa, el viceversa també es complix: cada vista del Mapa diu
   «Llegint el mapa…» i pinta, amb el seu nom i sense cap número, les targetes
   que es pinten sense Mapa, que són exactament les que ja tenen pàgina.
   Abans la vista quedava buida i la pàgina de cada una d'eixes xifres ja
   existia (/consola/xifres/skills-sense-avisos, sense cap targeta). */
const VISTES_DEL_MAPA = IDS_VISTES.filter((v) => v !== 'tauler' && v !== 'pols' && !v.startsWith('pols/'));
test.each(VISTES_DEL_MAPA)('%s mentre es llig el Mapa: «Llegint el mapa…» i les targetes amb el seu nom, cada una amb pàgina', async (vista) => {
  fonts.llegint = true;
  fonts.consola = CONSOLA;
  window.history.replaceState(null, '', rutaDe(vista));
  render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(pintades().length).toBeGreaterThan(0));
  expect(document.body.textContent).toContain('Llegint el mapa…');
  expect(pintades()).toEqual(xifresDeVista(vista, null, CONSOLA).map((x) => x.slug));
  const ambPagina = targetesDeLaConsola(null, CONSOLA);
  for (const slug of pintades()) expect(ambPagina.has(slug), slug).toBe(true);
  // Cap número inventat mentre es llig.
  for (const x of xifresDeVista(vista, null, CONSOLA)) expect(x.titol, x.slug).not.toMatch(/\d/);
  expect(document.querySelector('section.bar-orange'), vista).not.toBeNull();
  expect(errors).not.toHaveBeenCalled();
});

test('la pàgina d’una xifra del Mapa, mentre es llig: el títol de la targeta que pinta la seua vista, i «Llegint el mapa…»', async () => {
  fonts.llegint = true;
  fonts.consola = CONSOLA;
  window.history.replaceState(null, '', `${PREFIX}skills-sense-avisos`);
  render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.querySelector('h1')?.textContent).toBe('Skills sense cap avís'));
  expect(document.body.textContent).toContain('Llegint el mapa…');
  expect(xifresDeVista('inventari', null, CONSOLA).map((x) => x.slug)).toContain('skills-sense-avisos');
  expect(document.querySelector('section.bar-orange')).not.toBeNull();
});

test.each([
  ['arnes-claude-code', 'Claude Code'], ['cadencia-dia', '1 tasca diària'], ['tasques-sense-llancador', '1 tasca sense llançador'],
  ['credit-claude', 'Claude']
])('/consola/xifres/%s amb les dues fonts: la pàgina existix, amb el títol de la seua targeta', async (slug, titol) => {
  fonts.mapa = MAPA;
  fonts.consola = CONSOLA;
  await obri(`${PREFIX}${slug}`);
  expect(document.querySelector('h1').textContent).toBe(titol);
  expect(document.querySelector('section.bar-orange')).not.toBeNull();
  expect(errors).not.toHaveBeenCalled();
});
