import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Onada 11 (261010; prompt 261010_1730, tasca 5) · L'Índex de la Consola al
   tauler de /consola, amb el router de veres, la UniversalPage i les targetes
   de veres: ve darrere de totes les targetes, és text pur (H2, H3 per pàgina,
   H4 per targeta, cada títol enllaçat a la seua pàgina), diu exactament el
   que diu la dada (indexConsola.js), l'Índex de secció de la barra blava el
   recull, els seus enllaços porten on toca, el mode privacitat amaga els
   fitxers i les rutes, i la Consola incrustada de la Wiki no el pinta. Només
   es falsegen les fonts i el que no té res a vore (SEO, avisos, graf). */
const fonts = vi.hoisted(() => ({ mapa: null, consola: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => (fonts.mapa
    ? { estat: 'ready', mapa: fonts.mapa, error: null, carrega: () => {} }
    : { estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(fonts.consola)
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection, { ConsolaIncrustada } from './ConsolaSection.jsx';
import { IMATGES_INDEX, TITOL_INDEX, TITOL_MAS, indexConsola, nodesDeLIndex } from './indexConsola.js';
import { IMATGES_CONSOLA } from './imatgesConsola.js';
import { TITOL_DIAGNOSI } from './diagnosiConsola.js';
import { CLAU_PRIVACITAT, IDS_PAGINES, paginesConsola } from './consolaPagines.js';
import { rutaPanell } from './polsConsola.js';
import { rutaXifra } from './xifresMas.js';

/* El mateix Mapa de prova que ConsolaSection.viceversa.test.jsx: pinta de tot. */
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
/* Obri una ruta i espera que les fonts hagen acabat de llegir-se. */
async function obri(ruta) {
  window.history.replaceState(null, '', ruta);
  render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
}
const ambFonts = () => { fonts.mapa = MAPA; fonts.consola = CONSOLA; };
const index = () => screen.getByRole('region', { name: TITOL_INDEX });
const h1 = () => document.querySelector('h1')?.textContent;
/* Les capçaleres d'un contenidor, en l'ordre del document: nivell, text i l'enllaç del títol si en porta. */
const capcaleres = (dins) => [...dins.querySelectorAll('h2, h3, h4')]
  .map((h) => [h.tagName.toLowerCase(), h.textContent, h.querySelector('a')?.getAttribute('href') ?? null]);
const esperades = () => nodesDeLIndex(indexConsola(fonts.mapa, fonts.consola)).map((n) => [`h${n.nivell}`, n.titol, n.ruta]);

test.each([['amb', true], ['sense', false]])('/consola %s fonts: l’índex ve darrere de totes les targetes, en text pur, i diu exactament el que diu la dada', async (_nom, amb) => {
  if (amb) ambFonts();
  await obri('/consola');
  const regio = index();
  expect(regio.tagName).toBe('SECTION');
  expect(regio.className).toBe('sdp-consola__index');
  // Darrere d'«El Mas en xifres» (l'última graella del tauler) i de totes les targetes.
  const mas = screen.getByRole('region', { name: TITOL_MAS });
  expect(Boolean(mas.compareDocumentPosition(regio) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  for (const t of document.querySelectorAll('article.sp-card')) {
    expect(Boolean(t.compareDocumentPosition(regio) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  }
  // Text pur: cap targeta, cap botó, cap llista; capçaleres, paràgrafs i enllaços.
  expect(regio.querySelector('article, button, .sp-card, ul, ol, details')).toBeNull();
  // Un sol H2 (el títol), i els H3 i H4 en l'ordre de la jerarquia, amb el títol enllaçat a la seua ruta.
  const dada = esperades();
  expect(capcaleres(regio)).toEqual(dada);
  expect(capcaleres(regio).filter(([n]) => n === 'h2')).toHaveLength(1);
  expect(capcaleres(regio).filter(([n]) => n === 'h3')).toHaveLength(paginesConsola().length + 1);
  // Cap enllaç fora dels títols, i cap títol amb ruta sense enllaç.
  expect(regio.querySelectorAll('a')).toHaveLength(dada.filter(([, , ruta]) => ruta).length);
  // Cada pàgina: el títol enllaçat a la seua ruta, el «per a què» i l'entradeta del copy.
  for (const p of paginesConsola()) {
    const h3 = [...regio.querySelectorAll('h3')].find((h) => h.textContent === p.title);
    expect(h3.querySelector('a').getAttribute('href')).toBe(p.ruta);
    expect(h3.nextElementSibling.className).toBe('sdp-consola__index-peraque');
    expect(h3.nextElementSibling.textContent).toBe(p.subtitle);
    if (p.lead) expect(h3.nextElementSibling.nextElementSibling.textContent).toBe(p.lead);
  }
  // Cada targeta: el títol enllaçat i, davall, una línia de text.
  for (const h4 of regio.querySelectorAll('h4')) {
    expect(h4.querySelector('a')).not.toBeNull();
    expect(h4.nextElementSibling.tagName).toBe('P');
    expect(h4.nextElementSibling.textContent.length).toBeGreaterThan(20);
  }
  // Sense fonts, cap número a l'índex de les targetes (el nom de cada xifra i prou).
  if (!amb) for (const h4 of regio.querySelectorAll('h4')) expect(h4.textContent).not.toMatch(/\d/);
  expect(errors).not.toHaveBeenCalled();
});

/* Onada 12 (261011; ordres 261011_0130, punt 2) · Les il·lustracions de
   l'índex: una miniatura per a l'H2 i per a cada H3 que en té a la dada
   (IMATGES_INDEX), darrere de l'entradeta del seu títol i davant de les seues
   targetes. La jerarquia de text no canvia (la prova de dalt la fixa igual
   que a l'Onada 11), i la forma quadrada la posa una sola classe
   (src/css/imatgesASang.capes.test.js): cap estil en línia.
   Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla 261013_1405,
   front F): les miniatures dels H3 (Explorador i Avisos i salut) i «fora de
   l'índex, el tauler no guanya cap imatge de contingut». Les il·lustracions
   de les pàgines van a les capçaleres de les seues targetes del tauler
   (imatgesConsola.js), i cap imatge es pinta dues vegades a /consola (lliçó
   261010 de sdp-universal-page): a l'Índex només queda la de l'H2. */
test.each([['amb', true], ['sense', false]])('/consola %s fonts: l’Índex només pinta la miniatura de l’H2; les de les pàgines són a les seues targetes', async (_nom, amb) => {
  if (amb) ambFonts();
  await obri('/consola');
  const regio = index();
  const imatges = [...regio.querySelectorAll('img')];
  expect(imatges.map((img) => [img.getAttribute('src'), img.getAttribute('alt')]))
    .toEqual(Object.values(IMATGES_INDEX).map((x) => [x.imatge, x.imatgeAlt]));
  expect(imatges).toHaveLength(1);
  const [delIndex] = imatges;
  // Una sola classe, la de la Llei Visual; cap mida ni estil escrits al node.
  expect(delIndex.className).toBe('sdp-consola__index-imatge');
  expect(delIndex.hasAttribute('style')).toBe(false);
  expect(delIndex.hasAttribute('width')).toBe(false);
  expect(delIndex.getAttribute('loading')).toBe('lazy');
  // No és cap enllaç ni viu dins de cap capçalera: el títol continua sent text.
  expect(delIndex.closest('a, h2, h3, h4')).toBeNull();
  // La de l'H2: filla directa de l'índex, just darrere de la seua línia d'explicació.
  expect(delIndex.parentElement).toBe(regio);
  expect(delIndex.previousElementSibling.className).toBe('lead');
  expect(delIndex.previousElementSibling.previousElementSibling.tagName).toBe('H2');
  // Cap pàgina de l'índex porta miniatura: totes conserven el DOM de l'Onada 11.
  for (const seccio of regio.querySelectorAll('.sdp-consola__index-pagina')) expect(seccio.querySelector('img')).toBeNull();
  // Les nou targetes del tauler porten la il·lustració de la seua pàgina, en l'ordre d'IDS_PAGINES; les xifres, cap.
  const tauler = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect([...tauler.querySelectorAll('img.sp-card-media')].map((img) => [img.getAttribute('src'), img.getAttribute('alt')]))
    .toEqual(IDS_PAGINES.map((id) => [IMATGES_CONSOLA[id].imatge, IMATGES_CONSOLA[id].imatgeAlt]));
  expect(screen.getByRole('region', { name: TITOL_MAS }).querySelector('img.sp-card-media')).toBeNull();
  // Cap imatge de contingut es repetix a /consola.
  const totes = [...document.querySelectorAll('img.sp-card-media, img.sdp-consola__index-imatge')].map((img) => img.getAttribute('src'));
  expect(totes).toHaveLength(IDS_PAGINES.length + 1);
  expect(new Set(totes).size).toBe(totes.length);
  expect(errors).not.toHaveBeenCalled();
});

test('els panells del pols i les peces del Mapa són a l’índex, amb la ruta de la seua pàgina', async () => {
  ambFonts();
  await obri('/consola');
  const enllacos = [...index().querySelectorAll('h4 a')].map((a) => a.getAttribute('href'));
  for (const id of ['carrega', 'rebuts', 'skills']) expect(enllacos).toContain(rutaPanell(id));
  for (const slug of ['arnes-claude-code', 'cadencia-dia', 'tasques-sense-llancador', 'registres-de-consum', 'torns-caducats']) {
    expect(enllacos).toContain(rutaXifra(slug));
  }
  // Els noms de fitxer de les entradetes van en <Mono>, com a les targetes.
  const monos = [...index().querySelectorAll('code.sdp-consola__mono')].map((c) => c.textContent);
  expect(monos).toContain('manifest.yaml');
  expect(monos).toContain('mapa.json');
  expect(errors).not.toHaveBeenCalled();
});

test('navegar des de l’índex: una pàgina (H3), un panell del pols i una xifra (H4) obrin la seua pàgina, i la molla torna', async () => {
  ambFonts();
  await obri('/consola');
  const molla = () => within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' });

  fireEvent.click(within(index()).getByRole('link', { name: 'Calendari de processos' }));
  expect(window.location.pathname).toBe('/consola/calendari');
  expect(h1()).toBe('Calendari de processos');
  fireEvent.click(molla());
  expect(window.location.pathname).toBe('/consola');

  fireEvent.click(index().querySelector(`h4 a[href="${rutaPanell('rebuts')}"]`));
  expect(window.location.pathname).toBe(rutaPanell('rebuts'));
  expect(h1()).toBe('Rebuts');
  fireEvent.click(molla());
  expect(window.location.pathname).toBe('/consola');

  const xifra = index().querySelector(`h4 a[href="${rutaXifra('skills')}"]`);
  const titol = xifra.textContent;
  fireEvent.click(xifra);
  expect(window.location.pathname).toBe(rutaXifra('skills'));
  expect(h1()).toBe(titol);
  expect(errors).not.toHaveBeenCalled();
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · Darrere de
   l'Índex ve el Diagnòstic del Mas, amb el seu H2 i cap altra capçalera.
   Derogat EN PART per l'ordre del Mestre del 13-10-2026 (front F): l'Índex
   «al final» de l'Índex de secció (Onada 11). */
test('l’Índex de secció de la barra blava recull l’H2, els H3 i els H4 de l’índex, en ordre; i, al final, el Diagnòstic del Mas', async () => {
  ambFonts();
  await obri('/consola');
  fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
  const dialeg = screen.getByRole('dialog', { name: 'Taula de continguts' });
  const entrades = [...dialeg.querySelectorAll('li')].map((li) => [li.className, li.textContent]);
  const inici = entrades.findIndex(([classe, text]) => classe === 'toc-item toc-level-2' && text === TITOL_INDEX);
  expect(inici).toBeGreaterThan(0);
  const fi = entrades.findIndex(([classe], i) => i > inici && classe === 'toc-item toc-level-2');
  expect(fi).toBeGreaterThan(inici);
  expect(entrades.slice(inici, fi)).toEqual(esperades().map(([nivell, titol]) => [`toc-item toc-level-${nivell.slice(1)}`, titol]));
  expect(entrades.slice(fi)).toEqual([['toc-item toc-level-2', TITOL_DIAGNOSI]]);
  expect(errors).not.toHaveBeenCalled();
});

test('el mode privacitat amaga a l’índex els fitxers de les entradetes i els títols que porten una ruta', async () => {
  ambFonts();
  localStorage.setItem(CLAU_PRIVACITAT, '1');
  await obri('/consola');
  const text = index().textContent;
  expect(text).not.toContain('manifest.yaml');
  expect(text).not.toContain('mapa.json');
  expect(text).not.toContain('_wiki_de_poble/04_escriptori');
  expect(text).toContain('Lloc del sòl');
  expect(within(index()).getAllByText('dada amagada pel mode privacitat').length).toBeGreaterThan(0);
  // El títol d'una pàgina i les frases es continuen llegint.
  expect(within(index()).getByRole('link', { name: 'El pols del cervell' })).toBeTruthy();
  expect(errors).not.toHaveBeenCalled();
});

test('la Consola incrustada de la Wiki no pinta l’índex: conserva els seus píxels', async () => {
  ambFonts();
  render(<RouterProvider><ConsolaIncrustada /></RouterProvider>);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
  expect(screen.getByRole('region', { name: TITOL_MAS })).toBeTruthy();
  expect(screen.queryByRole('region', { name: TITOL_INDEX })).toBeNull();
  expect(document.querySelector('.sdp-consola__index')).toBeNull();
  expect(errors).not.toHaveBeenCalled();
});
