import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

/* Ordre del Mestre, 261004 (xat: cap xifra solta) · Les cinc targetes del
   pols porten a la pàgina pròpia del seu panell (/consola/pols/<id>,
   PaginaApp) amb el contingut que abans obria un desplegable; Compartir
   comparteix eixa adreça. Sense consola.json (producció), la pàgina explica
   que la dada només existix en local. Les xifres de dins (tòkens, registres,
   skills) són targetes amb boina i pàgina pròpia. Router de veres; només es
   falsegen les fonts. */
const fonts = vi.hoisted(() => ({ consola: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(fonts.consola)
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { CLAU_PRIVACITAT } from './consolaPagines.js';

const DIA = 24 * 60 * 60 * 1000;
const AMB_REBUT = () => ({
  generat: '2026-09-25T13:00:00.000Z',
  rebuts: [{ t: '2026-09-20T01:03:39.000Z', peticio: 'ced19fcaab00ffff', protocols: ['_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md'],
    fonts: [{ ruta: '.agents/BOOTSTRAP.md', sha256: 'eb1c1b03a1400000' }] }],
  consums: [{ agent: 'claude', entrada: 10, eixida: 5 }], credits: [{ proveidor: 'Claude', consumit: 6, limit: 100 }],
  skills: [
    { nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true },
    { nom: 'nova', estat: null, descripcio: '', core: false, alDisc: true, alManifest: false }
  ],
  segell: null, immunitari: { operacions: 3 },
  termometria: { artefactesActius: 162, abast: 'Escriptori i actes vives' }
});

let errors;
beforeEach(() => {
  fonts.consola = AMB_REBUT();
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  localStorage.clear();
  vi.unstubAllGlobals();
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
const obri = async (ruta, espera = /^Instantània/) => {
  window.history.replaceState(null, '', ruta);
  render(<Aplicacio />);
  await screen.findAllByText(espera);
};
const h1 = () => document.querySelector('h1')?.textContent;
const barraTaronja = () => document.querySelector('section.bar-orange');

test.each([
  ['carrega', 'Càrrega documental'], ['consums', 'Consums'], ['credits', 'Crèdits'], ['rebuts', 'Rebuts'], ['skills', 'Skills']
])('/consola/pols/%s: pàgina pròpia amb el títol de la targeta, Sóc de Poble a la barra taronja i la molla', async (id, titol) => {
  await obri(`/consola/pols/${id}`, /^Instantània: /);
  expect(h1()).toBe(titol);
  expect(document.querySelector('.page-intro h2').textContent).toMatch(/^Per a /);
  expect(document.querySelector('.page-intro p.lead').textContent.length).toBeGreaterThan(20);
  expect(barraTaronja().firstElementChild.getAttribute('href')).toBe('/projecte');
  expect(document.querySelector('header.bar-blue')).not.toBeNull();
  const molla = document.querySelector('nav.sdp-molla');
  expect([...molla.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/consola', '/consola/pols']);
  // Cap desplegable: el detall és la pàgina.
  expect(document.querySelector('details')).toBeNull();
  // El peu de dades data consola.json.
  expect(document.querySelector('.sdp-consola__peu [role="status"]').textContent).toMatch(/^Instantània: /);
  expect(errors).not.toHaveBeenCalled();
});

/* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · La pàgina d'un
   panell del pols (PaginaApp amb AUTORIA_SOCDEPOBLE, ruta /projecte) signa
   Sóc de Poble i porta el seu logotip dalt de l'H1. Abans no en portava. */
test('logotips · /consola/pols/consums porta el logotip de Sóc de Poble dalt de l’H1', async () => {
  await obri('/consola/pols/consums', /^Instantània: /);
  const logos = [...document.querySelectorAll('header.page-title > img.page-title-logo')];
  expect(logos.map((img) => [img.className, img.getAttribute('src')])).toEqual([
    ['page-title-logo light-only', '/assets/system/ui/logo-socdepoble-rect-negre.svg'],
    ['page-title-logo dark-only', '/assets/system/ui/logo-socdepoble-rect-blanc.svg']
  ]);
  expect(logos[1].nextElementSibling.textContent).toBe('Consums');
});

/* Correcció 261004 (verificador de la segona passada, punt 2) · el recompte
   d'artefactes és una targeta amb pàgina pròpia, i l'avís de saturació hi
   enllaça. Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta):
   la barra de progrés respecte del llindar. */
const targetes = () => [...document.querySelectorAll('article.sp-card')];
const titols = () => targetes().map((t) => t.querySelector('h3').textContent);
const href = (t) => t.querySelector('a.sp-card-link-overlay').getAttribute('href');

/* Correcció 261004 (verificador de la tercera passada, punt 4) · El
   middleware publica `rebuts: []`, `consums: []` i `operacions: 0` també quan
   el diari de sessió o el journal no existixen (fonts.<font>.estat 'absent'):
   cap targeta ni coberta del pols no ho diu com un zero. */
test('sense el diari ni el journal: les targetes i les cobertes diuen «sense mesura», mai 0', async () => {
  fonts.consola = {
    ...AMB_REBUT(), rebuts: [], consums: [], immunitari: { operacions: 0, ultima: null },
    fonts: { diari: { estat: 'absent' }, immunitari: { estat: 'absent' } }
  };
  await obri('/consola/pols/rebuts', /^Instantània: /);
  expect(titols()).toEqual(['Rebuts de lectura sense mesura', 'Últim rebut sense data']);
  expect(screen.getByText('Diari de sessió no disponible')).toBeTruthy();
  expect(screen.queryByText('Cap rebut Matrix')).toBeNull();
  cleanup();
  await obri('/consola/pols/consums', /^Instantània: /);
  expect(titols()).toEqual(['Tòkens d’entrada sense mesura', 'Tòkens d’eixida sense mesura', 'Registres de consum sense mesura']);
  expect(screen.getByText('Diari de sessió no disponible')).toBeTruthy();
  cleanup();
  await obri('/consola/pols', /^Instantània: /);
  expect(titols()).toContain('Operacions immunitàries sense mesura');
  const rebuts = targetes().find((t) => t.querySelector('h3').textContent === 'Rebuts');
  expect(rebuts.querySelector('h5')).toBeNull();
  expect(rebuts.querySelector('.sdp-consola__dada').textContent).toBe('Sense mesura: el diari de sessió no es pot llegir');
  expect(document.body.textContent).not.toMatch(/\b0 (?:rebuts|registres|operacions)\b/);
  expect(errors).not.toHaveBeenCalled();
});

test('/consola/pols/carrega: la termometria és una targeta, i l’avís de saturació hi enllaça', async () => {
  await obri('/consola/pols/carrega', /^Instantània: /);
  expect(screen.getByText('Escriptori i actes vives')).toBeTruthy();
  const [artefactes] = targetes();
  expect([artefactes.querySelector('h3').textContent, artefactes.querySelector('h4').textContent, href(artefactes)])
    .toEqual(['162 artefactes actius', '12 artefactes per damunt del llindar de 150', '/consola/xifres/artefactes-actius']);
  expect([...artefactes.querySelectorAll('.sp-card-label')].map((l) => l.textContent)).toEqual(['SATURAT']);
  const avis = screen.getByText('Revisem la saturació').closest('.sdp-alerta');
  expect(avis.textContent).toContain('Hi ha 12 artefactes per damunt del llindar.');
  expect([...avis.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]))
    .toEqual([['162 artefactes actius', '/consola/xifres/artefactes-actius']]);
  expect(document.querySelector('[role="progressbar"], progress')).toBeNull();
});

test('/consola/pols/credits: cada proveïdor és una targeta amb pàgina pròpia, sense barres soltes', async () => {
  fonts.consola = { ...AMB_REBUT(), estrategia_consum: 'Primer, els crèdits que caduquen.', credits: [
    { proveidor: 'ChatGPT Pro 100 (Límit Setmanal %)', consumit: 60, limit: 100 },
    { proveidor: 'Crèdits restants (Codex / Work)', valor: '1702 crèdits', tipus: 'ajust', actiu: true }
  ] };
  await obri('/consola/pols/credits', /^Instantània: /);
  expect(screen.getByText('Primer, els crèdits que caduquen.')).toBeTruthy();
  /* Correcció 261004 (verificador de la tercera passada, punt 5) · davant dels
     proveïdors, la targeta del seu recompte: la coberta de Crèdits destacava
     «N proveïdors» sense cap targeta. */
  expect(targetes().map((t) => [t.querySelector('h3').textContent, t.querySelector('h4').textContent, href(t)])).toEqual([
    ['2 proveïdors de crèdits', '1 quota · 1 ajust', '/consola/xifres/proveidors-de-credits'],
    ['ChatGPT Pro 100 (Límit Setmanal %)', 'Consumit: 60 de 100', '/consola/xifres/credit-chatgpt-pro-100-limit-setmanal'],
    ['Crèdits restants (Codex / Work)', '1702 crèdits', '/consola/xifres/credit-credits-restants-codex-work']
  ]);
  expect(targetes().every((t) => t.querySelector(':scope > .sp-card-header a.sp-card-author-link').getAttribute('href') === '/projecte')).toBe(true);
  expect(document.querySelector('[role="progressbar"], progress, .sdp-consola__ajust')).toBeNull();
  // La pàgina del proveïdor existix amb consola.json, i diu el mateix que la targeta.
  fireEvent.click(targetes()[2].querySelector('a.sp-card-link-overlay'));
  expect(window.location.pathname).toBe('/consola/xifres/credit-credits-restants-codex-work');
  expect(h1()).toBe('Crèdits restants (Codex / Work)');
  expect(screen.getByRole('link', { name: 'Crèdits' }).getAttribute('href')).toBe('/consola/pols/credits');
  expect(errors).not.toHaveBeenCalled();
});

test('/consola/pols/consums i /skills: les xifres de dins són targetes amb boina que porten a la seua pàgina', async () => {
  await obri('/consola/pols/consums', /^Instantània: /);
  const consums = [...document.querySelectorAll('article.sp-card')];
  expect(consums.map((t) => t.querySelector('h3').textContent)).toEqual(['10 tòkens d’entrada', '5 tòkens d’eixida', '1 registre de consum']);
  expect(consums.map((t) => t.querySelector('a.sp-card-link-overlay').getAttribute('href'))).toEqual(
    ['tokens-d-entrada', 'tokens-d-eixida', 'registres-de-consum'].map((s) => `/consola/xifres/${s}`));
  expect(consums.every((t) => t.querySelector(':scope > .sp-card-header a.sp-card-author-link').getAttribute('href') === '/projecte')).toBe(true);
  expect(document.querySelector('.sp-card--action, .sdp-consola__quieta')).toBeNull();
  cleanup();

  await obri('/consola/pols/skills', /^Instantània: /);
  // Correcció 261004 (verificador de la segona passada, punt 2) · el segell també és una targeta.
  expect([...document.querySelectorAll('article.sp-card h3')].map((h) => h.textContent)).toEqual([
    '2 skills al disc o al manifest', '1 skill del nucli', '1 skill fora del manifest', '0 skills sense disc',
    'Segell de skills absent'
  ]);
  expect(document.querySelector('.sdp-consola__segell')).toBeNull();
  // T9 (260930) · la taula del pols no porta límit d'alçada propi.
  expect(screen.getByRole('region', { name: 'Inventari de skills' }).className).toBe('sdp-taula sdp-taula--densa');
});

/* Correcció 261004 (verificador de la segona passada, punts 2 i 3) · el
   nombre de rebuts i l'últim (fa quants dies, T12) són targetes amb pàgina
   pròpia, i el botó de cada rebut concorda. Derogat per l'ordre del Mestre del
   261004 (xat: cap xifra solta): la línia «Últim rebut: data (fa N dies)» i
   «Veure les 1 fonts». */
test('/consola/pols/rebuts: «Veure fonts» obri les fonts del rebut, i l’últim rebut és una targeta que diu fa quants dies', async () => {
  const fa10 = new Date(Date.now() - 10 * DIA - 60 * 1000).toISOString();
  fonts.consola = { ...AMB_REBUT(), rebuts: [{ ...AMB_REBUT().rebuts[0] }, { t: fa10, peticio: 'bbbb', protocols: [], fonts: [] }] };
  await obri('/consola/pols/rebuts', /^Instantània: /);
  // El més recent, no el primer de la llista; les targetes van abans de la taula.
  expect(targetes().map((t) => [t.querySelector('h3').textContent, t.querySelector('h4').textContent, href(t)])).toEqual([
    ['2 rebuts de lectura', 'Entrades matrix.rebut del diari de sessió', '/consola/xifres/rebuts-de-lectura'],
    ['Últim rebut fa 10 dies', new Date(fa10).toLocaleString('ca-ES'), '/consola/xifres/ultim-rebut']
  ]);
  expect([...targetes()[1].querySelectorAll('.sp-card-label')].map((l) => l.textContent)).toEqual(['FA MÉS DE 7 DIES']);
  expect(document.querySelector('.sdp-card-grid').nextElementSibling.getAttribute('role')).toBe('region');
  expect(document.querySelector('.sdp-consola__segell')).toBeNull();
  expect(screen.getByRole('region', { name: 'Rebuts de lectura Matrix' }).className).toBe('sdp-taula sdp-taula--densa');
  expect(document.querySelector('.sdp-taula--llarga')).toBeNull();
  expect(screen.getByRole('button', { name: /^Veure les fonts del rebut de .* \(0 fonts\)$/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /^Veure les fonts del rebut de .* \(1 font\)$/ }));
  expect(screen.getByText('.agents/BOOTSTRAP.md')).toBeTruthy();
  expect(screen.getByText('Petició ced19fcaab00 · ' + new Date('2026-09-20T01:03:39.000Z').toLocaleString('ca-ES'))).toBeTruthy();
});

test('/consola/pols/rebuts: la privacitat del peu amaga rutes, protocols i la petició del diàleg', async () => {
  localStorage.setItem(CLAU_PRIVACITAT, '1');
  await obri('/consola/pols/rebuts', /^Instantània: /);
  expect(document.body.textContent).not.toContain('auditoria_canonica.md');
  fireEvent.click(screen.getByRole('button', { name: /^Veure les fonts del rebut de .* \(1 font\)$/ }));
  expect(screen.queryByText('.agents/BOOTSTRAP.md')).toBeNull();
  expect(screen.queryByText(/^Petició ced19fcaab00/)).toBeNull();
});

test('Compartir de la targeta del pols comparteix l’adreça del panell; Connectar hi porta', async () => {
  const copia = vi.fn(() => Promise.resolve());
  vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText: copia } });
  await obri('/consola/pols', '1 registre');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Compartir Rebuts' }));
  });
  expect(copia).toHaveBeenCalledWith(`${window.location.origin}/consola/pols/rebuts`);
  fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Rebuts' }));
  expect(window.location.pathname).toBe('/consola/pols/rebuts');
  expect(h1()).toBe('Rebuts');
});

test('sense consola.json: la pàgina del panell existix i diu que la dada només és en local', async () => {
  fonts.consola = null;
  await obri('/consola/pols/consums', 'Consola no disponible');
  expect(h1()).toBe('Consums');
  expect(document.querySelector('table')).toBeNull();
  // Les xifres del panell continuen sent targetes, amb el seu nom i cap número.
  expect(titols()).toEqual(['Tòkens d’entrada', 'Tòkens d’eixida', 'Registres de consum']);
  expect(within(document.querySelector('.sdp-consola__peu')).getByRole('status').textContent).toBe('Instantània encara no disponible.');
});

/* Correcció 261004 (verificador de la segona passada, punt 1) · Sense
   consola.json, cada panell pinta les targetes que es pinten sempre, amb el
   seu nom; els proveïdors de crèdits no es poden saber, i ni targeta ni
   pàgina. */
test.each([
  ['carrega', ['Artefactes actius']],
  ['credits', []],
  ['rebuts', ['Rebuts de lectura', 'Últim rebut']],
  ['skills', ['Skills al disc o al manifest', 'Skills del nucli', 'Skills fora del manifest', 'Skills sense disc', 'Segell de skills']]
])('sense consola.json: /consola/pols/%s pinta les seues targetes amb el nom', async (id, esperats) => {
  fonts.consola = null;
  await obri(`/consola/pols/${id}`, 'Consola no disponible');
  expect(titols()).toEqual(esperats);
  expect(document.body.textContent).not.toMatch(/\d+ (artefactes|rebuts|fitxers)/);
});

test('sense consola.json: el pols pinta les operacions immunitàries i les línies descartades amb el nom', async () => {
  fonts.consola = null;
  await obri('/consola/pols', 'Consola no disponible');
  const pols = [...document.querySelectorAll('.sdp-card-grid')].at(-1);
  expect([...pols.querySelectorAll('article.sp-card h3')].map((h) => h.textContent)).toEqual(['Operacions immunitàries', 'Línies descartades']);
});

test('un panell que no existix no peta: estat buit honest i camí de tornada al pols', async () => {
  await obri('/consola/pols/no-existix', 'Cap panell amb este nom');
  expect(h1()).toBe('Panell no trobat');
  fireEvent.click(screen.getByRole('link', { name: 'Torna al pols del cervell' }));
  expect(window.location.pathname).toBe('/consola/pols');
  expect(h1()).toBe('El pols del cervell');
});
