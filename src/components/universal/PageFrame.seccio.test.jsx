/* T7 (P9) · L'Índex del PageFrame i la secció a la URL: slugs estables fets
   del text, ?seccio= escrit amb replace en clicar (conservant l'estat de
   l'entrada) i scroll en carregar, també quan el cos arriba tard. Router en
   memòria de veres. jsdom no implementa scrollIntoView: es registra.
   La secció «consumida» és de mòdul (PageFrame.jsx): cada prova fa servir un
   slug propi perquè no depenguen de l'ordre. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, RouterProvider, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { ancoraDelClic, hrefInternDeClic, preparaRecolocacio } from '../../app/enllacosInterns.js';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
/* La traducció de la pàgina, controlada per la prova: sense llengua, la
   pàgina original (el que dona el hook de veres fora d'un UIProvider). */
const traduccio = vi.hoisted(() => {
  const original = Object.freeze({ llengua: null, lang: null, carregant: null, titol: null, blocs: null, original: () => {} });
  return { original, valor: original };
});
vi.mock('../PedraSeca/hooks/useTraduccioPagina.js', () => ({ useTraduccioPagina: () => traduccio.valor }));

import { PageFrame, ancoraDe, encapcalamentsIndex } from './PageFrame.jsx';

const saltats = [];
const scrollAbans = Element.prototype.scrollIntoView;
/* Els fotogrames (requestAnimationFrame) en una cua que la prova buida quan
   vol, en l'ordre en què s'han demanat. */
let cua = [];
let seguentFotograma = 1;
beforeEach(() => {
  saltats.length = 0;
  traduccio.valor = traduccio.original;
  cua = [];
  Element.prototype.scrollIntoView = function scrollIntoView(opcions) { saltats.push([this, opcions]); };
  vi.stubGlobal('requestAnimationFrame', (fn) => {
    const id = seguentFotograma++;
    cua.push([id, fn]);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => { cua = cua.filter(([actual]) => actual !== id); });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Element.prototype.scrollIntoView = scrollAbans;
});
const fotograma = () => act(() => {
  const ara = cua;
  cua = [];
  ara.forEach(([, fn]) => fn(0));
});

function Sonda() {
  const { pathname, search, state } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <output data-testid="estat">{JSON.stringify(state)}</output>
      <button type="button" onClick={() => navigate('/wiki?item=doc', { state: { preloadedItem: { id: 'doc' } } })}>Obri el document</button>
      <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
    </>
  );
}

const COS = (
  <>
    <h2>Què és?</h2>
    <p>Text.</p>
    <h3>Vincles</h3>
    <h3 className="sr-only">Amagat</h3>
    <h3>Vincles</h3>
  </>
);
const pagina = (cos = COS, props = {}) => <PageFrame chrome="system" title="Document" {...props}>{cos}</PageFrame>;
const url = () => screen.getByTestId('url').textContent;
const obriIndex = () => fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
const entrada = (nom, posicio = 0) => within(screen.getByRole('dialog')).getAllByRole('button', { name: nom })[posicio];

test('encapcalamentsIndex: els de l’Índex, sense els sr-only ni els buits, amb slugs únics en ordre', () => {
  const { container } = render(
    <article><h2>Què és?</h2><h3>Vincles</h3><h3 className="sr-only">Amagat</h3><h4> </h4><h3>Vincles</h3></article>
  );
  expect(encapcalamentsIndex(container, 'h1, h2, h3, h4').map(({ element, slug }) => [element.tagName, slug]))
    .toEqual([['H2', 'que-es'], ['H3', 'vincles'], ['H3', 'vincles-2']]);
  expect(encapcalamentsIndex(null, 'h2')).toEqual([]);
});

test('l’Índex dona ids fets del text i, en clicar, escriu ?seccio= amb replace', () => {
  render(<MemoryRouter rutaInicial="/inici">{pagina()}<Sonda /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Obri el document' }));
  expect(url()).toBe('/wiki?item=doc');
  obriIndex();
  const [queEs, primer, segon] = [...document.querySelectorAll('article.content-wrapper h2, article.content-wrapper h3:not(.sr-only)')];
  expect(queEs.id).toMatch(/-que-es$/);
  expect(primer.id).toMatch(/-vincles$/);
  expect(segon.id).toMatch(/-vincles-2$/);
  expect(segon.dataset.sdpTocGenerated).toBe('true');

  fireEvent.click(entrada('Vincles', 1));
  expect(url()).toBe('/wiki?item=doc&seccio=vincles-2');
  /* El clic fa el scroll suau de sempre; la URL no en provoca cap altre. */
  expect(saltats).toEqual([[segon, { behavior: 'smooth', block: 'start' }]]);
  /* L'Índex tancat lleva els ids que havia posat, com sempre. */
  expect(segon.hasAttribute('id')).toBe(false);
  /* Replace: Arrere no passa per la URL sense secció. */
  fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' }));
  expect(url()).toBe('/inici');
});

test('escriure la secció conserva l’estat de l’entrada (el preloadedItem del detall)', () => {
  render(<MemoryRouter rutaInicial="/inici">{pagina()}<Sonda /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Obri el document' }));
  obriIndex();
  fireEvent.click(entrada('Què és?'));
  expect(url()).toBe('/wiki?item=doc&seccio=que-es');
  expect(JSON.parse(screen.getByTestId('estat').textContent)).toEqual({ preloadedItem: { id: 'doc' } });
});

test('en carregar amb ?seccio=, la pàgina fa scroll a la secció (en el fotograma següent) sense tocar el DOM', () => {
  const cos = <><h2>Introducció</h2><h2>Desenvolupament</h2><h2>Desenvolupament</h2></>;
  render(<MemoryRouter rutaInicial="/wiki?item=doc&seccio=desenvolupament-2">{pagina(cos)}<Sonda /></MemoryRouter>);
  const segon = document.querySelectorAll('article.content-wrapper h2')[2];
  expect(saltats).toEqual([]);
  fotograma();
  expect(saltats).toEqual([[segon, { block: 'start' }]]);
  expect(segon.hasAttribute('id')).toBe(false);
  expect(url()).toBe('/wiki?item=doc&seccio=desenvolupament-2');
});

test('si el cos arriba tard, la pàgina l’espera i hi fa scroll quan apareix', async () => {
  const arbre = (cos) => <MemoryRouter rutaInicial="/notes?nota=n1&seccio=arriba-tard">{pagina(cos)}<Sonda /></MemoryRouter>;
  const { rerender } = render(arbre(<p>Carregant…</p>));
  fotograma();
  expect(saltats).toEqual([]);
  rerender(arbre(<><h2>Primer</h2><h3>Arriba tard</h3></>));
  await act(async () => {});
  fotograma();
  expect(saltats.map(([el]) => el.textContent)).toEqual(['Arriba tard']);
  /* Ja trobada, no hi torna: un encapçalament nou igual no arrossega la pàgina. */
  rerender(arbre(<><h2>Primer</h2><h3>Arriba tard</h3><p>Més text</p></>));
  await act(async () => {});
  fotograma();
  expect(saltats).toHaveLength(1);
});

/* Correcció T3 · Un efecte que es desfà abans del fotograma (StrictMode, un
   remuntatge) cancel·la el scroll i no es menja la secció: el següent hi va. */
test('la secció només es consumix quan s’hi ha fet scroll: un muntatge desfet abans del fotograma no se la menja', () => {
  const cos = <><h2>Primer</h2><h2>Desfet i refet</h2></>;
  const arbre = (clau) => <MemoryRouter rutaInicial="/wiki?item=doc&seccio=desfet-i-refet">{pagina(cos, { key: clau })}<Sonda /></MemoryRouter>;
  const { rerender } = render(arbre('a'));
  rerender(arbre('b'));
  fotograma();
  const segon = document.querySelectorAll('article.content-wrapper h2')[1];
  expect(saltats).toEqual([[segon, { block: 'start' }]]);
});

test('una pàgina que es munta després amb la secció que ja ha escrit l’Índex no hi torna a saltar', () => {
  const cos = <><h2>Inici</h2><h2>Final del document</h2></>;
  const arbre = (clau) => <MemoryRouter rutaInicial="/wiki?item=a">{pagina(cos, { key: clau })}<Sonda /></MemoryRouter>;
  const { rerender } = render(arbre('a'));
  obriIndex();
  fireEvent.click(entrada('Final del document'));
  expect(url()).toBe('/wiki?item=a&seccio=final-del-document');
  expect(saltats).toHaveLength(1);
  /* Un altre document (la Wiki no esborra la secció en canviar d'element). */
  rerender(arbre('b'));
  fotograma();
  expect(saltats).toHaveLength(1);
});

test('sense router, l’Índex continua com abans: fa scroll i no escriu res', () => {
  render(pagina());
  obriIndex();
  const segon = document.querySelectorAll('article.content-wrapper h3:not(.sr-only)')[1];
  fireEvent.click(entrada('Vincles', 1));
  expect(saltats).toEqual([[segon, { behavior: 'smooth', block: 'start' }]]);
});

/* Correcció T2 · Amb la pàgina traduïda, l'Índex llig el cos traduït: el seu
   slug no és el de cap encapçalament de l'original, que és el que obri un
   enllaç copiat (la traducció no es conserva en recarregar). A més, canviar
   la consulta canvia la clau de la pàgina de useTraduccioPagina i la tornaria
   a l'original. Traduïda, l'Índex fa scroll i no toca la URL. */
test('amb la pàgina traduïda, l’Índex fa scroll al cos traduït i no escriu cap secció a la URL', () => {
  traduccio.valor = {
    ...traduccio.original,
    llengua: 'ES',
    lang: 'es',
    titol: 'Documento',
    blocs: [
      { etiqueta: 'h2', text: '¿Qué es?' },
      { etiqueta: 'p', text: 'Texto.' },
      { etiqueta: 'h3', text: 'Vínculos' },
      { etiqueta: 'h3', text: 'Vínculos' }
    ]
  };
  render(<MemoryRouter rutaInicial="/wiki?item=doc&seccio=que-es-traduida">{pagina()}<Sonda /></MemoryRouter>);
  fotograma();
  saltats.length = 0;
  obriIndex();
  const traduit = document.querySelectorAll('article.sdp-traduccio-cos h3')[1];
  fireEvent.click(entrada('Vínculos', 1));
  expect(saltats).toEqual([[traduit, { behavior: 'smooth', block: 'start' }]]);
  expect(url()).toBe('/wiki?item=doc&seccio=que-es-traduida');
  /* Sense traducció, el mateix clic escriu el slug de l'original. */
  cleanup();
  traduccio.valor = traduccio.original;
  render(<MemoryRouter rutaInicial="/wiki?item=doc">{pagina()}<Sonda /></MemoryRouter>);
  obriIndex();
  fireEvent.click(entrada('Vincles', 1));
  expect(url()).toBe('/wiki?item=doc&seccio=vincles-2');
});

/* Correcció T3 · L'interceptor d'enllaços d'App.jsx (router en memòria o amb
   base), amb les funcions de veres d'enllacosInterns.js: en el clic llig el
   desplaçador de l'enllaç i, en el fotograma següent, el torna a dalt si el
   destí no porta #fragment. El scroll a la secció de la URL s'ha de fer
   després d'eixa recol·locació, no abans. */
function AmbInterceptor({ children }) {
  const navigate = useNavigate();
  const alClicarEnllac = (e) => {
    const nadiu = e.nativeEvent;
    const arrel = e.currentTarget;
    const ancora = ancoraDelClic(nadiu, arrel);
    const desti = hrefInternDeClic(nadiu, ancora, '');
    if (desti === null) return;
    e.preventDefault();
    const recoloca = preparaRecolocacio(nadiu, ancora, arrel, desti);
    navigate(desti);
    requestAnimationFrame(recoloca);
  };
  return <div onClick={alClicarEnllac}><div data-testid="desplacador">{children}</div></div>;
}

test('un enllaç intern a una secció del document ja pintat hi porta, després que l’interceptor recoloque la vista', () => {
  const cos = <><h2>Inici</h2><p><a href="?item=doc&seccio=al-final">Ves al final</a></p><h2>Al final</h2></>;
  render(<MemoryRouter rutaInicial="/wiki?item=doc"><AmbInterceptor>{pagina(cos)}</AmbInterceptor><Sonda /></MemoryRouter>);
  const desplacador = screen.getByTestId('desplacador');
  desplacador.style.overflowY = 'auto';
  Object.defineProperty(desplacador, 'scrollHeight', { configurable: true, value: 2000 });
  Object.defineProperty(desplacador, 'clientHeight', { configurable: true, value: 500 });
  /* Ordre del Mestre, 261004 (integració final, auditoria d'amfitrió) · Derogat: el salt a la
     secció ja no és el scrollIntoView de l'encapçalament (dins de WordPress també movia la pàgina
     de l'amfitrió), sinó un scrollTo del desplaçador de l'app. Es registren les opcions de cada
     scrollTo: la recol·locació a dalt i, després, el salt a la secció. */
  desplacador.scrollTo = function scrollTo(opcions) { saltats.push([this, opcions.top === 0 && opcions.behavior === 'instant' ? 'a dalt' : opcions]); };
  desplacador.getBoundingClientRect = () => ({ top: 100 });

  fireEvent.click(screen.getByRole('link', { name: 'Ves al final' }));
  expect(url()).toBe('/wiki?item=doc&seccio=al-final');
  const final = document.querySelectorAll('article.content-wrapper h2')[1];
  final.getBoundingClientRect = () => ({ top: 1500 });
  fotograma();
  expect(saltats).toEqual([[desplacador, 'a dalt'], [desplacador, { top: 1400 }]]);
});

/* Correcció final (ordre del Mestre, 261004; revisió final, /consola?seccio=
   al-cens-del-mapa-del-mas a 375) · El salt es feia una sola vegada: quan
   arribaven les dades de la Consola, l'H3 de dalt de la mateixa targeta
   passava de «Skills del cens» (71 px) a «30 skills» (42 px) i el destí
   quedava 12 px davall de la barra taronja. Ara, fins a ESPERA_SECCIO_MS
   després del salt, la pàgina hi torna si la secció ja no és on toca, i
   para al primer gest de la persona. jsdom no té disposició: el desplaçador
   (scrollTop que es mou amb scrollTo) i la posició del destí al contingut
   es fixen a mà. */
function muntaSaltVigilat(desti) {
  const slug = desti.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cos = (dalt, peu) => <><h3>{dalt}</h3><p>Text de dalt.</p><h4>{desti}</h4><p>{peu}</p></>;
  const arbre = (dalt = 'Skills del cens', peu = 'Peu.') => (
    <MemoryRouter rutaInicial={`/consola?seccio=${slug}`}><div data-testid="desplacador">{pagina(cos(dalt, peu))}</div></MemoryRouter>
  );
  const resultat = render(arbre());
  const desplacador = screen.getByTestId('desplacador');
  desplacador.style.overflowY = 'auto';
  Object.defineProperty(desplacador, 'scrollHeight', { configurable: true, value: 5000 });
  Object.defineProperty(desplacador, 'clientHeight', { configurable: true, value: 600 });
  let scrollTop = 0;
  Object.defineProperty(desplacador, 'scrollTop', { configurable: true, get: () => scrollTop, set: (valor) => { scrollTop = valor; } });
  desplacador.getBoundingClientRect = () => ({ top: 100 });
  const moviments = [];
  desplacador.scrollTo = ({ top }) => { moviments.push(top); scrollTop = top; };
  /* On és el destí dins del contingut: la prova el mou quan el de dalt canvia d'alçada. */
  const posicio = { valor: 1500 };
  const element = document.querySelector('article.content-wrapper h4');
  element.getBoundingClientRect = () => ({ top: posicio.valor - scrollTop + 100 });
  /* Canvia el contingut (dalt i peu) i deixa córrer l'observador. */
  const canvia = async (dalt, peu) => {
    resultat.rerender(arbre(dalt, peu));
    await act(async () => {});
  };
  return { desplacador, element, moviments, posicio, canvia };
}

test('després del salt, si el contingut de dalt canvia d’alçada, la pàgina torna a portar-hi la secció', async () => {
  const { moviments, posicio, canvia } = muntaSaltVigilat('Al cens del mapa');
  fotograma();
  expect(moviments).toEqual([1500]);
  // Un canvi de baix no mou la secció: cap scroll de més.
  await canvia('Skills del cens', 'Peu nou.');
  expect(moviments).toEqual([1500]);
  // El de dalt s'encongix 29 px: la secció hi torna (abans quedava a −12 de la barra).
  posicio.valor = 1471;
  await canvia('30 skills', 'Peu nou.');
  expect(moviments).toEqual([1500, 1471]);
  // I si torna a créixer, també.
  posicio.valor = 1530;
  await canvia('30 skills del cens, ara amb més text', 'Peu nou.');
  expect(moviments).toEqual([1500, 1471, 1530]);
});

test.each([
  ['wheel', (node) => fireEvent.wheel(node)],
  ['touchstart', (node) => fireEvent.touchStart(node)],
  ['pointerdown', (node) => fireEvent.pointerDown(node)],
  ['keydown', (node) => fireEvent.keyDown(node, { key: 'ArrowDown' })]
])('el primer gest de la persona (%s) para la correcció del salt: qui ja llig no s’arrossega', async (gest, fes) => {
  const { desplacador, moviments, posicio, canvia } = muntaSaltVigilat(`Gest ${gest}`);
  fotograma();
  expect(moviments).toEqual([1500]);
  fes(desplacador);
  posicio.valor = 1471;
  await canvia('30 skills', 'Peu.');
  expect(moviments).toEqual([1500]);
});

test('la correcció del salt dura ESPERA_SECCIO_MS (3 s) des del salt, i després ja no mou res', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    const { moviments, posicio, canvia } = muntaSaltVigilat('Fins al termini');
    fotograma();
    act(() => { vi.advanceTimersByTime(2999); });
    posicio.valor = 1471;
    await canvia('30 skills', 'Peu.');
    expect(moviments).toEqual([1500, 1471]);
    act(() => { vi.advanceTimersByTime(1); });
    posicio.valor = 1400;
    await canvia('Encara més curt', 'Peu.');
    expect(moviments).toEqual([1500, 1471]);
  } finally {
    vi.useRealTimers();
  }
});

/* Una imatge sense mides (el logotip a Safari 16) canvia l'alçada sense tocar
   el DOM: només ho veu un ResizeObserver de l'article o de la pàgina. */
test('un canvi de mida sense canvi de DOM (ResizeObserver de l’article i de la pàgina) també torna a portar-hi la secció', () => {
  const observadors = [];
  vi.stubGlobal('ResizeObserver', class {
    constructor(avisa) { this.avisa = avisa; this.nodes = []; this.desconnectat = false; observadors.push(this); }
    observe(node) { this.nodes.push(node); }
    disconnect() { this.desconnectat = true; }
  });
  const { element, moviments, posicio } = muntaSaltVigilat('Davall del logotip');
  expect(observadors).toEqual([]);
  fotograma();
  expect(observadors).toHaveLength(1);
  const [observador] = observadors;
  const article = element.closest('article.content-wrapper');
  expect(observador.nodes).toEqual([article, article.closest('.sdp-universal-page-container')]);
  posicio.valor = 1656;
  act(() => observador.avisa([]));
  expect(moviments).toEqual([1500, 1656]);
  // En desmuntar-se la pàgina, l'observador es desconnecta.
  cleanup();
  expect(observador.desconnectat).toBe(true);
});

/* ─── Fase D (261020, tasca 3.2) · L'àncora declarada pel contingut ───
   /legal#esborra-compte és l'adreça que la Play Console demana. Un
   encapçalament la declara amb data-sdp-ancora (el sanejador no deixa cap id);
   al navegador, el fragment del document hi porta; en memòria, ?seccio=. Cada
   prova, amb la seua àncora (la secció consumida és de mòdul). */
describe('àncora declarada (data-sdp-ancora) i fragment del document', () => {
  afterEach(() => { window.history.replaceState(null, '', '/'); });
  const ambAncora = (ancora) => (
    <>
      <h4>16. Els teus drets</h4>
      <p>Text.</p>
      <h5 data-sdp-ancora={ancora}>Com esborrar el teu compte</h5>
      <p>Més text.</p>
      <h4>17. Seguretat</h4>
    </>
  );
  const h5 = () => document.querySelector('article.content-wrapper h5');

  test('al navegador, /legal#àncora salta a l’encapçalament que la declara', () => {
    window.history.replaceState(null, '', '/legal#ancora-navegador');
    render(<RouterProvider>{pagina(ambAncora('ancora-navegador'))}</RouterProvider>);
    fotograma();
    expect(saltats[0][0]).toBe(h5());
    expect(saltats[0][1]).toEqual({ block: 'start' });
  });

  test('en memòria, ?seccio=<àncora> també la troba', () => {
    render(<MemoryRouter rutaInicial="/legal?seccio=ancora-memoria">{pagina(ambAncora('ancora-memoria'))}<Sonda /></MemoryRouter>);
    fotograma();
    expect(saltats[0][0]).toBe(h5());
    expect(url()).toBe('/legal?seccio=ancora-memoria');
  });

  test('un fragment de paràmetres (#access_token=…) no fa cap salt', () => {
    window.history.replaceState(null, '', '/legal#access_token=a&refresh_token=b');
    render(<RouterProvider>{pagina(ambAncora('access_token'))}</RouterProvider>);
    fotograma();
    expect(saltats).toEqual([]);
  });

  test('?seccio= guanya al fragment', () => {
    window.history.replaceState(null, '', '/legal?seccio=17-seguretat#ancora-perd');
    render(<RouterProvider>{pagina(ambAncora('ancora-perd'))}</RouterProvider>);
    fotograma();
    expect(saltats[0][0].textContent).toBe('17. Seguretat');
  });

  test('el fragment amb el slug del text d’un encapçalament també hi porta', () => {
    window.history.replaceState(null, '', '/legal#16-els-teus-drets');
    render(<RouterProvider>{pagina(ambAncora('ancora-text'))}</RouterProvider>);
    fotograma();
    expect(saltats[0][0].textContent).toBe('16. Els teus drets');
  });

  test('ancoraDe: només una àncora en minúscules, xifres i guions, de 80 caràcters com a molt', () => {
    const amb = (valor) => { const el = document.createElement('h5'); if (valor !== null) el.setAttribute('data-sdp-ancora', valor); return el; };
    expect(ancoraDe(amb('esborra-compte'))).toBe('esborra-compte');
    for (const dolenta of [null, '', 'Esborra', 'a--b', '-a', 'a b', 'à', 'x'.repeat(81)]) expect(ancoraDe(amb(dolenta))).toBeNull();
    expect(ancoraDe(null)).toBeNull();
  });
});
