import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · Les
   il·lustracions a les capçaleres de les targetes del tauler i el Diagnòstic
   del Mas al peu de /consola, amb el router de veres, la UniversalPage i les
   targetes de veres (el patró de ConsolaSection.index.test.jsx):
    · cada targeta del tauler porta la il·lustració de la seua pàgina, sense
      la insígnia lateral; les xifres, la icona; la Wiki, cap imatge;
    · el Diagnòstic ve darrere de l'Índex i de totes les targetes, amb l'accés
      ràpid i un sol <pre> d'un sol node de text, que diu exactament el que
      diu la dada (diagnosiConsola.js) amb les fonts de la secció;
    · el mode privacitat recordat arriba al <pre>;
    · la imatge de la targeta és la imatge SEO de la seua pàgina.
   Només es falsegen les fonts i el que no té res a vore (SEO, avisos, graf). */
const fonts = vi.hoisted(() => ({ mapa: null, consola: null }));
const seo = vi.hoisted(() => ({ crides: [] }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (args) => { seo.crides.push(args); } }));
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
import { TITOL_INDEX, TITOL_MAS } from './indexConsola.js';
import { CLAU_PRIVACITAT, IDS_PAGINES, paginesConsola } from './consolaPagines.js';
import { IMATGES_CONSOLA, miniaturaDe } from './imatgesConsola.js';
import { ETIQUETA_ACCES, MASCARA, TITOL_DIAGNOSI, diagnosiTextual } from './diagnosiConsola.js';

/* Un Mapa amb un avís de vigilància (ruta i evidència) i un lloc sense lector (ruta). */
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'agent:codex', tipus: 'agent', font: null, atributs: { arnes: 'Codex' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:core-identitat', tipus: 'skill', font: null, atributs: {} },
    { id: 'document:_wiki_de_poble/04_escriptori', tipus: 'document', font: null, atributs: {} },
    { id: 'document:.agents/LEDGER.md', tipus: 'document', font: null, atributs: {} },
    { id: 'ruta:acta', tipus: 'ruta', font: null, atributs: {} }
  ],
  arestes: [
    { de: 'ruta:acta', a: 'document:_wiki_de_poble/04_escriptori', tipus: 'escriu', confianca: 'declarat', evidencia: null },
    { de: 'agent:codex', a: 'document:_wiki_de_poble/04_escriptori', tipus: 'escriu', confianca: 'declarat', evidencia: null }
  ],
  tasques: [{ id: 'setmanal', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 's' }, cadencia: { cron: '0 3 * * 1' }, script: null, font: null }],
  avisos: [
    { node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' },
    { node: 'document:.agents/LEDGER.md', codi: 'ledger-invalid', severitat: 'alta', evidencia: 'signatura del LEDGER no vàlida · 8 segells fòssils' }
  ],
  salut: []
};
const CONSOLA = {
  generat: '2026-09-25T13:00:00.000Z',
  rebuts: [{ t: '2026-09-20T01:03:39.000Z', peticio: 'ced19fcaab00ffff', protocols: ['a/b.md'], fonts: [{ ruta: 'x', sha256: 'y' }] }],
  consums: [{ agent: 'claude', entrada: 10, eixida: 5 }],
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
  segell: null,
  immunitari: { operacions: 3 },
  fonts: { diari: { estat: 'ok', 'línies_descartades': 0 } },
  termometria: { artefactesActius: 162, abast: 'Escriptori' }
};

let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  seo.crides = [];
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
async function obri(ruta) {
  window.history.replaceState(null, '', ruta);
  render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
}
const ambFonts = () => { fonts.mapa = MAPA; fonts.consola = CONSOLA; };
/* Les fonts tal com les veu la secció (fontsDe, ConsolaSection.jsx). */
const fontsDeLaSeccio = () => ({
  dades: fonts.consola, estatDades: fonts.consola ? 'ready' : 'absent',
  mapa: fonts.mapa, estatMapa: fonts.mapa ? 'ready' : 'absent'
});
const diagnosi = () => screen.getByRole('region', { name: TITOL_DIAGNOSI });
const despres = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

test.each([['amb', true], ['sense', false]])('/consola %s fonts: cada targeta del tauler porta la il·lustració de la seua pàgina; les xifres, la icona', async (_nom, amb) => {
  if (amb) ambFonts();
  await obri('/consola');
  const tauler = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  const targetes = [...tauler.querySelectorAll('article.sp-card')];
  expect(targetes).toHaveLength(IDS_PAGINES.length);
  for (const [i, id] of IDS_PAGINES.entries()) {
    const t = targetes[i];
    const img = t.querySelector('.sp-card-media-container > img.sp-card-media');
    /* Gauntlet 261030 (P1Y, vinyetes-1024-jpg-a-miniatures) · La ruta que es
       pinta és la de la miniatura (la bessona .webp de les vinyetes de 1024 px). */
    expect([img.getAttribute('src'), img.getAttribute('alt')], id).toEqual([miniaturaDe(IMATGES_CONSOLA[id].imatge), IMATGES_CONSOLA[id].imatgeAlt]);
    expect(img.getAttribute('loading'), id).toBe('lazy');
    expect(img.hasAttribute('style'), id).toBe(false);
    // La imatge o la icona: amb il·lustració, cap insígnia lateral.
    expect(t.querySelector('.sp-card-calendar-badge'), id).toBeNull();
    // La resta de la targeta no canvia: continua portant a la seua pàgina, amb la boina i el peu.
    expect(t.querySelector('a.sp-card-link-overlay').getAttribute('href'), id).toBe(`/consola/${id}`);
    expect(t.querySelector(':scope > .sp-card-header'), id).not.toBeNull();
    expect(t.querySelector('.sp-card-footer .sp-card-connect'), id).not.toBeNull();
  }
  // «El Mas en xifres» conserva la icona a la insígnia lateral i cap mitjà.
  const xifres = screen.getByRole('region', { name: TITOL_MAS });
  expect(xifres.querySelector('img.sp-card-media, .sp-card-media-container')).toBeNull();
  expect(xifres.querySelectorAll('.sp-card-calendar-badge svg').length).toBe(xifres.querySelectorAll('article.sp-card').length);
  expect(errors).not.toHaveBeenCalled();
});

test.each([['amb', true], ['sense', false]])('/consola %s fonts: el Diagnòstic del Mas tanca el tauler, amb l’accés ràpid i un sol <pre> que diu el que diu la dada', async (_nom, amb) => {
  if (amb) ambFonts();
  await obri('/consola');
  const regio = diagnosi();
  expect(regio.tagName).toBe('SECTION');
  expect(regio.className).toBe('sdp-consola__diagnosi');
  // Darrere de l'Índex de la Consola i de totes les targetes.
  expect(despres(screen.getByRole('region', { name: TITOL_INDEX }), regio)).toBe(true);
  for (const t of document.querySelectorAll('article.sp-card')) expect(despres(t, regio)).toBe(true);
  expect(regio.querySelector('article, button, .sp-card, details, img')).toBeNull();
  // Un sol H2, el títol; cap altra capçalera a dins.
  expect([...regio.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => [h.tagName, h.textContent])).toEqual([['H2', TITOL_DIAGNOSI]]);
  // L'accés ràpid: les nou pàgines, en l'ordre del tauler, cada una amb el seu títol.
  const acces = screen.getByRole('navigation', { name: ETIQUETA_ACCES });
  expect(acces.className).toBe('sdp-consola__acces');
  expect(regio.contains(acces)).toBe(true);
  expect([...acces.querySelectorAll('li > a')].map((a) => [a.textContent, a.getAttribute('href')]))
    .toEqual(paginesConsola().map((p) => [p.title, p.ruta]));
  // Un sol <pre>, darrere de l'accés ràpid, amb un sol node de text: el de la dada.
  const pres = regio.querySelectorAll('pre');
  expect(pres).toHaveLength(1);
  const [pre] = pres;
  expect(pre.className).toBe('sdp-consola__diagnosi-text');
  expect(despres(acces, pre)).toBe(true);
  expect(pre.childNodes).toHaveLength(1);
  expect(pre.firstChild.nodeType).toBe(Node.TEXT_NODE);
  expect(pre.textContent).toBe(diagnosiTextual(fontsDeLaSeccio(), { locale: 'ca-ES', privat: false }));
  expect(pre.textContent).toMatch(/^DIAGNÒSTIC DEL MAS · Consola Termodinàmica\n/);
  if (amb) {
    expect(pre.textContent).toContain('VIGILÀNCIA TRENCADA');
    expect(pre.textContent).toContain('.agents/LEDGER.md');
  } else {
    expect(pre.textContent).not.toMatch(/\b0 (rebuts|registres|operacions)\b/);
  }
  // L'última secció amb títol de la pàgina.
  const seccions = [...document.querySelectorAll('section[aria-labelledby]')];
  expect(seccions.at(-1)).toBe(regio);
  expect(errors).not.toHaveBeenCalled();
});

test('el mode privacitat recordat arriba al <pre>: cap ruta ni evidència, la marca de Privat', async () => {
  ambFonts();
  localStorage.setItem(CLAU_PRIVACITAT, '1');
  await obri('/consola');
  const pre = diagnosi().querySelector('pre');
  expect(pre.textContent).toBe(diagnosiTextual(fontsDeLaSeccio(), { locale: 'ca-ES', privat: true }));
  for (const tros of ['.agents/LEDGER.md', '_wiki_de_poble/04_escriptori', 'signatura del LEDGER no vàlida']) {
    expect(pre.textContent, tros).not.toContain(tros);
  }
  expect(pre.textContent).toContain(MASCARA);
  expect(pre.textContent).toContain('Mode privacitat');
  // Els títols de l'accés ràpid no són cap dada privada: es continuen llegint.
  expect(screen.getByRole('navigation', { name: ETIQUETA_ACCES }).textContent).toContain('El pols del cervell');
  expect(errors).not.toHaveBeenCalled();
});

test('la Consola incrustada de la Wiki no pinta ni les il·lustracions ni el Diagnòstic: conserva els seus píxels', async () => {
  ambFonts();
  render(<RouterProvider><ConsolaIncrustada /></RouterProvider>);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
  expect(screen.getByRole('region', { name: TITOL_MAS })).toBeTruthy();
  expect(screen.queryByRole('region', { name: TITOL_DIAGNOSI })).toBeNull();
  expect(screen.queryByRole('navigation', { name: ETIQUETA_ACCES })).toBeNull();
  expect(document.querySelector('.sdp-consola__diagnosi, pre')).toBeNull();
  expect(document.querySelectorAll('img.sp-card-media')).toHaveLength(0);
  // Les nou targetes amb la icona a la insígnia lateral, com abans.
  const tauler = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect(tauler.querySelectorAll('.sp-card-calendar-badge svg')).toHaveLength(IDS_PAGINES.length);
  expect(errors).not.toHaveBeenCalled();
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · Expectatives actualitzades a
   posta: la imatge SEO va al head per la variant social de 1200x630 de la portada
   de la targeta (selector compartit, seoConsola.js), i el tauler /consola porta la
   de PAGE_COPY.consola, la de /page/consola. Abans: l'original cru i el tauler sense. */
const variantSocial = (ruta) => `https://socdepoble.org${ruta.replace(/\.[^./]+$/, '-social-1200x630.jpg')}`;
test('la imatge de la targeta d’una pàgina és la imatge SEO de la seua pàgina; el tauler, la de la Consola, i els panells, sense', async () => {
  ambFonts();
  await obri('/consola/explorador');
  expect(seo.crides.at(-1).image.url).toBe(variantSocial(IMATGES_CONSOLA.explorador.imatge));
  // La portada (hero) no es pinta: cap img de la il·lustració a la pàgina.
  expect(document.querySelector(`img[src="${IMATGES_CONSOLA.explorador.imatge}"]`)).toBeNull();
  cleanup();
  seo.crides = [];
  await obri('/consola/salut');
  expect(seo.crides.at(-1).image.url).toBe(variantSocial(IMATGES_CONSOLA.salut.imatge));
  cleanup();
  seo.crides = [];
  await obri('/consola');
  expect(seo.crides.at(-1).image.url).toBe(variantSocial(IMATGES_CONSOLA.index.imatge));
  cleanup();
  seo.crides = [];
  await obri('/consola/pols/rebuts');
  expect(seo.crides.at(-1).image).toBeUndefined();
  expect(errors).not.toHaveBeenCalled();
});
