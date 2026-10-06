import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   «Per a tindre pàgina pròpia has de ser una targeta (i viceversa).» Cada
   xifra del Mas és una targeta amb boina i porta a la seua pàgina pròpia
   (PaginaApp) a /consola/xifres/<slug>: el mateix títol, subtítol i
   entradeta, Sóc de Poble a la barra taronja, la dada viva detallada (les
   evidències en <Mono>, que el mode privacitat amaga) i la pàgina de la
   Consola que la tracta. Router de veres; només es falsegen les fonts. */
const fonts = vi.hoisted(() => ({ mapa: null, estat: 'ready' }));
const toast = vi.hoisted(() => vi.fn());
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: fonts.estat, mapa: fonts.mapa, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(null)
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { CLAU_PRIVACITAT, paginaConsola, paginesConsola } from './consolaPagines.js';
import { SLUGS_XIFRES, detallXifra, rutaXifra, xifraDelMas } from './xifresMas.js';
import { evidenciesDe } from './mapa/mapaContent.js';

const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
const TORN = 'torn-261003-a · claude · open · caducat el 2026-10-03T21:00:00Z';
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:core-identitat', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:perduda', tipus: 'skill', font: null, atributs: { al_disc: false } },
    { id: 'document:.agents/runtime/turns', tipus: 'document', font: null, atributs: {} },
    { id: 'document:.agents/LEDGER.md', tipus: 'document', font: null, atributs: {} }
  ],
  arestes: [],
  tasques: [{ id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: 'tooling/brain/plaquetes.mjs', font: null }],
  avisos: [
    { node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' },
    { node: 'skill:perduda', codi: 'skill-fantasma', severitat: 'alta', evidencia: 'disc' },
    { node: 'skill:sdp-workflow', codi: 'segell-divergent', severitat: 'alta', evidencia: '.agents/SKILLS_SEAL.json' },
    { node: 'document:.agents/LEDGER.md', codi: 'ledger-invalid', severitat: 'alta', evidencia: 'signatura del LEDGER no vàlida · 8 segells fòssils · node tooling/verify-ledger.mjs' },
    { node: 'document:.agents/runtime/turns', codi: 'torns-caducats', severitat: 'mitjana', evidencia: '1 de 2 torns caducats sense tancar',
      evidencies: ['1 de 2 torns caducats sense tancar', TORN] }
  ],
  salut: [
    metrica('ledger-fossils', { valor: 8, unitat: 'segells fòssils', font: '.agents/LEDGER.md', prova: 'node tooling/brain/mapa-consola.mjs --json' }),
    metrica('ledger-mal-formades', { valor: 2, unitat: 'línies mal formades', font: '.agents/LEDGER.md', prova: 'node tooling/brain/mapa-consola.mjs --json' }),
    metrica('torns-caducats-oberts', { valor: 0.5, numerador: 1, denominador: 2, font: '.agents/runtime/turns', prova: 'node tooling/brain/mapa-consola.mjs --json' }),
    metrica('segell-skills-coherent', { valor: 0.5, numerador: 1, denominador: 2, font: '.agents/SKILLS_SEAL.json (només SKILL.md) · disc', prova: 'node tooling/brain/mapa-consola.mjs --json' })
  ]
};

let errors;
beforeEach(() => {
  fonts.mapa = MAPA;
  fonts.estat = 'ready';
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  localStorage.clear();
  toast.mockClear();
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
/* Les pàgines (i les de les xifres) acaben amb el peu de dades; el tauler, no. */
const obri = async (ruta, espera = /^Instantània/) => {
  window.history.replaceState(null, '', ruta);
  render(<Aplicacio />);
  await screen.findAllByText(espera);
};
const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const barraTaronja = () => document.querySelector('section.bar-orange');
const xifresDelTauler = () => screen.getByRole('region', { name: 'El Mas en xifres' });

/* Correcció 261004 (verificador, punt 10) · el que la dada viva d'una xifra
   ha de pintar en <Mono>: les cel·les de ruta, ordre o empremta, la ruta de
   cada peça que no és una skill i totes les evidències dels avisos. */
const rutaDelNode = (node) => String(node).replace(/^[a-z]+:/, '');
function monosEsperats(detall) {
  return detall.taules.flatMap((t) => t.files.flatMap((f) => f.celes.flatMap((c) => {
    if ('mono' in c) return [c.mono];
    if ('node' in c) return String(c.node).startsWith('skill:') ? [] : [rutaDelNode(c.node)];
    if ('avis' in c) return evidenciesDe(c.avis);
    return [];
  })));
}
/** Cada dada de màquina de la dada viva és dins d'un <Mono>, i n'hi ha tantes com en diu el detall. */
function dadaVivaEnMono(slug) {
  const seccio = screen.getByRole('heading', { level: 3, name: 'La dada viva' }).closest('section');
  const monos = [...seccio.querySelectorAll('code.sdp-consola__mono')].map((c) => c.textContent);
  const esperats = monosEsperats(detallXifra(slug, MAPA));
  for (const m of esperats) expect(monos, `${slug}: ${m}`).toContain(m);
  expect(monos.length, slug).toBe(esperats.length);
}

test.each(SLUGS_XIFRES)('/consola/xifres/%s: H1 = títol de la targeta, Sóc de Poble a la barra taronja i la dada viva', async (slug) => {
  // La targeta del tauler.
  window.history.replaceState(null, '', '/consola');
  render(<Aplicacio />);
  await screen.findByText('El Mas en xifres');
  const targeta = [...xifresDelTauler().querySelectorAll('article.sp-card')]
    .find((t) => t.querySelector('a.sp-card-link-overlay').getAttribute('href') === rutaXifra(slug));
  const titol = targeta.querySelector('h3').textContent;
  const subtitol = targeta.querySelector('h4').textContent;
  const entradeta = targeta.querySelector('.sp-card-text > p').textContent;
  expect(titol).toBe(xifraDelMas(slug, MAPA).titol);

  // Tota la targeta porta a la seua pàgina, amb el mateix títol, subtítol i entradeta.
  fireEvent.click(targeta.querySelector('a.sp-card-link-overlay'));
  expect(window.location.pathname).toBe(`/consola/xifres/${slug}`);
  expect(h1()).toBe(titol);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(document.querySelector('.page-intro h2').textContent).toBe(subtitol);
  expect(document.querySelector('.page-intro p.lead').textContent).toBe(entradeta);
  // La Pàgina Universal sencera: doble barra, i Sóc de Poble a la taronja, enllaçat a /projecte.
  const autor = barraTaronja().firstElementChild;
  expect(autor.getAttribute('href')).toBe('/projecte');
  expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  expect(barraTaronja().querySelector('time.btn-date-time').getAttribute('datetime')).toBeTruthy();
  expect(document.querySelector('header.bar-blue')).not.toBeNull();
  // Al cos: la dada viva, d'on ix i la pàgina de la Consola que la tracta.
  const seccions = [...document.querySelectorAll('article.content-wrapper section > h3')].map((h) => h.textContent);
  expect(seccions).toEqual(['La dada viva', 'D’on ix', 'On es tracta']);
  const tracta = paginaConsola(xifraDelMas(slug).pagina);
  expect(screen.getByRole('link', { name: tracta.title }).getAttribute('href')).toMatch(new RegExp(`^${tracta.ruta}`));
  /* Correcció 261004 (verificador, punt 10) · abans es mirava si hi havia
     algun <code> al document (el de «D'on ix» sempre hi era). Ara, la dada
     viva d'esta xifra: cada evidència i cada ruta, en <Mono>. */
  dadaVivaEnMono(slug);
  // La molla torna a la Consola i el peu de dades continua al final.
  expect(within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' })
    .getAttribute('href')).toBe('/consola');
  expect(document.querySelector('.sdp-consola__peu [role="status"]').textContent).toMatch(/^Instantània del Mapa: /);
  expect(errors).not.toHaveBeenCalled();
});

/* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · Tota pàgina que
   signa Sóc de Poble, també les de sistema, porta el seu logotip dalt de
   l'H1: el tauler de la Consola (UniversalPage, autor per defecte) i la
   pàgina d'una xifra (PaginaApp amb AUTORIA_SOCDEPOBLE, ruta /projecte).
   Abans no en portaven cap. */
const logosDelTitol = () => [...document.querySelectorAll('header.page-title > img.page-title-logo')];
const esperaLogoSdp = () => {
  expect(logosDelTitol().map((img) => [img.className, img.getAttribute('src')])).toEqual([
    ['page-title-logo light-only', '/assets/system/ui/logo-socdepoble-rect-negre.svg'],
    ['page-title-logo dark-only', '/assets/system/ui/logo-socdepoble-rect-blanc.svg']
  ]);
  expect(logosDelTitol()[1].nextElementSibling.tagName).toBe('H1');
};
test('logotips · el tauler de la Consola i la pàgina d’una xifra porten el logotip de Sóc de Poble dalt de l’H1', async () => {
  await obri('/consola', 'El Mas en xifres');
  esperaLogoSdp();
  cleanup();
  await obri('/consola/xifres/torns-caducats');
  expect(barraTaronja().firstElementChild.getAttribute('href')).toBe('/projecte');
  esperaLogoSdp();
});

test('la dada viva detallada: torns un a un, línies del LEDGER, segell, avisos i òrfenes', async () => {
  await obri('/consola/xifres/torns-caducats');
  expect(h1()).toBe('1 torn caducat');
  // Correcció 261004 (verificador, punt 7) · el 2 és el total de torns, i la frase ho diu.
  expect(screen.getByText('1 torn obert i caducat d’un total de 2 torns').className).toBe('sdp-consola__dada');
  const torns = screen.getByRole('region', { name: 'Torns caducats, un a un' });
  expect([...torns.querySelectorAll('tbody th code.sdp-consola__mono')].map((c) => c.textContent)).toEqual([TORN]);
  cleanup();

  await obri('/consola/xifres/linies-ledger');
  expect(h1()).toBe('10 línies del LEDGER per revisar');
  const metriques = screen.getByRole('region', { name: 'Mètriques del LEDGER' });
  expect([...metriques.querySelectorAll('tbody th')].map((th) => th.textContent)).toEqual(['ledger-fossils', 'ledger-mal-formades']);
  expect(within(screen.getByRole('region', { name: 'Avisos del LEDGER' })).getByText(/node tooling\/verify-ledger\.mjs/)).toBeTruthy();
  expect(screen.getByText(/una a una, encara no ho diu el Mapa/)).toBeTruthy();
  cleanup();

  await obri('/consola/xifres/skills-fora-del-segell');
  expect(h1()).toBe('1 skill fora del segell');
  const segell = screen.getByRole('region', { name: 'Skills fora del segell o divergents' });
  expect(segell.querySelector('tbody th').textContent).toBe('sdp-workflow');
  cleanup();

  await obri('/consola/xifres/avisos-alts');
  expect(h1()).toBe('3 avisos alts');
  expect(screen.getByRole('region', { name: 'Avisos alts' }).querySelectorAll('tbody tr')).toHaveLength(3);
  cleanup();

  await obri('/consola/xifres/skills-orfenes');
  expect(h1()).toBe('1 skill òrfena');
  expect(screen.getByRole('region', { name: 'Skills òrfenes' }).querySelector('tbody th').textContent).toBe('core-identitat');
  expect(screen.getByRole('region', { name: 'Skills fantasma' }).querySelector('tbody th').textContent).toBe('perduda');
  expect(errors).not.toHaveBeenCalled();
});

test('una xifra sense mesura diu «sense mesura», mai 0, ni a la targeta ni a la pàgina', async () => {
  fonts.mapa = { ...MAPA, salut: [], avisos: MAPA.avisos.filter((a) => a.codi !== 'torns-caducats') };
  await obri('/consola/xifres/torns-caducats');
  expect(h1()).toBe('Torns sense mesura');
  expect(screen.getByText('Sense mesura')).toBeTruthy();
  expect(screen.getByText(/El Mapa no porta la mètrica torns-caducats-oberts/)).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Torns caducats, un a un' })).toBeNull();
  expect(screen.queryByText('Cap torn caducat.')).toBeNull();
  expect(document.querySelector('article.content-wrapper').textContent).not.toMatch(/\b0 torns/);
});

test('sense Mapa, la pàgina de la xifra diu per què i no inventa cap número', async () => {
  fonts.mapa = null;
  fonts.estat = 'absent';
  await obri('/consola/xifres/skills');
  expect(h1()).toBe('Skills del cens');
  expect(screen.getByText('Mapa no disponible')).toBeTruthy();
  expect(document.querySelector('table')).toBeNull();
  expect(barraTaronja().firstElementChild.getAttribute('href')).toBe('/projecte');
});

test('una xifra que no existix no peta: estat buit honest i camí de tornada', async () => {
  await obri('/consola/xifres/no-existix', 'Cap xifra amb este nom');
  expect(window.location.pathname).toBe('/consola/xifres/no-existix');
  expect(h1()).toBe('Xifra no trobada');
  expect(screen.getByText('Cap xifra amb este nom')).toBeTruthy();
  expect(barraTaronja().firstElementChild.getAttribute('href')).toBe('/projecte');
  fireEvent.click(screen.getByRole('link', { name: 'Torna a la Consola' }));
  expect(window.location.pathname).toBe('/consola');
  expect(h1()).toBe('Consola Termodinàmica');
  expect(errors).not.toHaveBeenCalled();
});

test('Connectar de la targeta porta a la pàgina de la xifra; Compartir comparteix la seua adreça', async () => {
  const copia = vi.fn(() => Promise.resolve());
  vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText: copia } });
  window.history.replaceState(null, '', '/consola');
  render(<Aplicacio />);
  await screen.findByText('El Mas en xifres');
  await act(async () => {
    fireEvent.click(within(xifresDelTauler()).getByRole('button', { name: 'Compartir 1 torn caducat' }));
  });
  expect(copia).toHaveBeenCalledWith(`${window.location.origin}/consola/xifres/torns-caducats`);
  fireEvent.click(within(xifresDelTauler()).getByRole('button', { name: 'Connectar amb 1 torn caducat' }));
  expect(window.location.pathname).toBe('/consola/xifres/torns-caducats');
  // Des de la pàgina, Compartir de la barra blava comparteix l'adreça de la pàgina.
  copia.mockClear();
  await act(async () => {
    fireEvent.click(within(document.querySelector('header.bar-blue')).getByRole('button', { name: 'Compartir' }));
  });
  await waitFor(() => expect(copia).toHaveBeenCalledWith(`${window.location.origin}/consola/xifres/torns-caducats`));
});

/* Correcció 261004 (verificador, observació) · els noms de fitxer de
   l'entradeta van en <Mono>: el mode privacitat també els amaga, a la
   targeta i a l'entradeta de la pàgina. Derogat per l'ordre del Mestre del
   261004 (xat: cap xifra solta): «l'entradeta és copy fix: nomena el fitxer i
   es continua llegint». */
test('el mode privacitat del peu amaga les evidències i els fitxers de la pàgina de la xifra', async () => {
  localStorage.setItem(CLAU_PRIVACITAT, '1');
  await obri('/consola/xifres/torns-caducats');
  const pagina = document.body.textContent;
  expect(pagina).not.toContain('torn-261003-a');
  expect(pagina).not.toContain('.agents/runtime/turns');
  expect(pagina).not.toContain('mapa.json');
  expect(pagina).not.toContain('node tooling/');
  // La frase de l'entradeta es continua llegint; el fitxer, no.
  expect(document.querySelector('.page-intro p.lead').textContent).toMatch(/^Compta els torns de treball/);
  expect(within(document.querySelector('.page-intro')).getAllByText('dada amagada pel mode privacitat').length).toBeGreaterThan(0);
  expect(within(document.querySelector('.sdp-consola__peu')).getByRole('switch').getAttribute('aria-checked')).toBe('true');
});

/* Correcció 261004 (verificador, punt 4) · una pàgina per prova: totes
   juntes, amb les targetes noves de cada pàgina, passaven del temps límit. */
const h1Rapid = () => document.querySelector('h1')?.textContent;
test('les rutes de la Consola continuen igual: el tauler', async () => {
  await obri('/consola', 'El Mas en xifres');
  expect(h1Rapid()).toBe('Consola Termodinàmica');
});

test.each(paginesConsola().map((p) => [p.id, p]))('les rutes de la Consola continuen igual: /consola/%s', async (_id, p) => {
  await obri(p.ruta);
  expect(h1Rapid()).toBe(p.title);
});

test.each(['/consola/xifres', '/consola/xifres/torns-caducats/extra', '/consola/pols/rebuts/extra', '/consola/pestanyes'])(
  'les xifres i els panells sols i les subrutes desconegudes (%s) tornen al tauler', async (ruta) => {
    window.history.replaceState(null, '', ruta);
    render(<Aplicacio />);
    await waitFor(() => expect(window.location.pathname, ruta).toBe('/consola'));
    expect(h1Rapid()).toBe('Consola Termodinàmica');
  });

/* Correcció 261004 (verificador, punt 1) · les xifres de dins de les pàgines
   i les peces del Mapa també tenen pàgina pròpia: el mateix títol, subtítol i
   entradeta que la seua targeta, Sóc de Poble a la barra taronja i la dada
   viva, amb tota dada de màquina en <Mono>. */
const DE_LES_PAGINES = [
  'skills-sense-avisos', 'skills-fora-d-algun-cens', 'avisos', 'metriques-amb-mesura', 'nodes', 'arestes',
  'cadenes-declarades', 'suggeriments-de-la-prosa', 'punts-de-trobada',
  'peca-fluxos-de-treball', 'peca-tauler', 'peca-agents-sols', 'peca-vigilants', 'cadencia-dia',
  'arnes-claude-code', 'tasca-plaquetes'
];
test.each(DE_LES_PAGINES)('/consola/xifres/%s: la pàgina diu el mateix que la targeta, amb la boina i la dada viva', async (slug) => {
  await obri(rutaXifra(slug));
  const xifra = xifraDelMas(slug, MAPA);
  expect(h1Rapid()).toBe(xifra.titol);
  expect(document.querySelector('.page-intro h2').textContent).toBe(xifra.subtitol);
  expect(document.querySelector('.page-intro p.lead').textContent).toBe(xifra.entradeta);
  expect(barraTaronja().firstElementChild.getAttribute('href')).toBe('/projecte');
  expect(document.querySelector('a[href^="/consola/"]:not([href="/consola"])').getAttribute('href')).toBe(xifra.tracta.ruta);
  dadaVivaEnMono(slug);
});

test('una xifra d’una pàgina porta a la seua pàgina pròpia: de l’Inventari a «skills sense cap avís»', async () => {
  await obri('/consola/inventari');
  const targeta = document.querySelector('a.sp-card-link-overlay[href="/consola/xifres/skills-sense-avisos"]').closest('article');
  const titol = targeta.querySelector('h3').textContent;
  fireEvent.click(targeta.querySelector('a.sp-card-link-overlay'));
  expect(window.location.pathname).toBe('/consola/xifres/skills-sense-avisos');
  expect(h1Rapid()).toBe(titol);
  expect(errors).not.toHaveBeenCalled();
});

test('una cadència sense tasques no té targeta ni pàgina: «Xifra no trobada»', async () => {
  await obri('/consola/xifres/cadencia-mes', 'Cap xifra amb este nom');
  expect(h1Rapid()).toBe('Xifra no trobada');
});

test('una xifra de consola.json sense consola.json: la pàgina existix i diu que la dada només és en local', async () => {
  await obri('/consola/xifres/rebuts-de-lectura');
  expect(h1Rapid()).toBe('Rebuts de lectura');
  expect(screen.getByText('Consola no disponible')).toBeTruthy();
  expect(document.querySelector('table')).toBeNull();
  expect(screen.getByRole('link', { name: 'Rebuts' }).getAttribute('href')).toBe('/consola/pols/rebuts');
  // El peu data la seua font, consola.json (absent ací).
  expect(document.querySelector('.sdp-consola__peu [role="status"]').textContent).toBe('Instantània encara no disponible.');
});
