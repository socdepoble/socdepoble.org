/* D3 i D16 (ordres del Mestre, 260930) · El Panell de Control (/control i
   l'àlies /utilitats): cap targeta porta a una ruta que no és a la taula de
   rutes d'App, «Ajustos del xat» obri el Control del xat (l'entrada que
   substituïx «Novetats», amagada del rail), «Missatges per a dubtes» obri el
   Xat, «Gestoria de Poble» diu «EN OBRES» sense clic, i la pàgina i la
   pestanya del navegador es diuen «Panell de Control».

   Router propi en memòria (MemoryRouter) i les targetes de veres
   (UniversalCard); només se substituïxen la UniversalPage (la seua
   maquinària no entra en joc), l'eixida segura (SessionContext) i l'i18n. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { RouteSEO } from '../../hooks/RouteSEO';
import { createTranslator } from '../../config/i18n';
import fontApp from '../../app/App.jsx?raw';

/* `traductor` (correcció de la revisió, 260930) · per defecte el t torna la
   reserva, com sempre; una prova hi posa el traductor real d'una llengua. */
const estat = vi.hoisted(() => ({ demana: vi.fn(), traductor: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: (clau, reserva) => (estat.traductor ? estat.traductor(clau, reserva) : reserva),
    resolveAsset: (valor) => valor
  }),
  /* La capçalera del document és opt-in: sense manageDocumentHead el títol
     de la pestanya no s'escriu i la prova de RouteSEO no provaria res. */
  useUIState: () => ({ externalConfig: { manageDocumentHead: true } })
}));
vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: () => ({ demana: estat.demana, ocupat: false, avis: null, error: null })
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, children }) => (
    <section data-pagina="control">
      <p data-titol="pagina">{title}</p>
      <p>{subtitle}</p>
      {children}
    </section>
  )
}));

import ControlSection from './ControlSection.jsx';

/* Les rutes estàtiques de la taula d'App (App.jsx): sense paràmetres ni
   comodins, perquè una ruta com «/:usuari» o «*» no faça passar per bona una
   ruta que no té secció (la «/gestoria» d'abans queia a NotFoundPage). */
function rutesEstatiques() {
  const rutes = new Set();
  for (const m of fontApp.matchAll(/<Route\s+path="([^"]+)"/g)) {
    const ruta = m[1].replace(/^\//, '');
    if (!ruta.includes(':') && !ruta.includes('*')) rutes.add(ruta);
  }
  return rutes;
}
const camiDe = (ruta) => ruta.split('?')[0].replace(/^\//, '');

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

function pinta(ruta = '/control') {
  return render(
    <MemoryRouter rutaInicial={ruta}>
      <ControlSection />
      <RouteSEO />
      <Ubicacio />
    </MemoryRouter>
  );
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

beforeEach(() => {
  estat.demana.mockReset();
  estat.traductor = null;
  const titol = document.createElement('title');
  titol.textContent = 'Amfitrió';
  document.head.replaceChildren(titol);
});
afterEach(cleanup);

test('D3 · la taula de rutes d’App té les rutes que el Panell necessita i no té /gestoria', () => {
  const rutes = rutesEstatiques();
  for (const ruta of ['control', 'utilitats', 'xat', 'control-xat', 'mur', 'mercat', 'notes']) {
    expect(rutes.has(ruta), ruta).toBe(true);
  }
  expect(rutes.has('gestoria')).toBe(false);
});

/* CU (261003) · Una pintada per clic: la targeta del Snippet obri la seua
   fitxa i desmunta el Panell, i un clic sobre un botó desmuntat no navegaria
   (es comptaria el destí de l'anterior). */
test('D3 · cap targeta ni botó del Panell navega a una ruta que no és a la taula d’App', () => {
  const rutes = rutesEstatiques();
  const clicables = () => [
    ...document.querySelectorAll('button.sp-card-link-overlay'),
    screen.getByRole('button', { name: /Missatges per a dubtes/ })
  ];
  pinta();
  const total = clicables().length;
  expect(total).toBeGreaterThan(1);
  const destins = [];
  for (let i = 0; i < total; i += 1) {
    cleanup();
    pinta();
    fireEvent.click(clicables()[i]);
    destins.push(ubicacio());
  }
  expect(new Set(destins).size).toBe(destins.length - 1); // Mur i Agenda porten a /mur
  expect(destins.filter((desti) => !rutes.has(camiDe(desti)))).toEqual([]);
  expect(destins).not.toContain('/gestoria');
  expect(destins).not.toContain('/xat/0001');
});

/* Ordre del Mestre, 261001 · El Panell és compacte: només les eines
   d'edició (Mur, Mercat, Agenda, Notes i Ajustos del xat), tal com diu l'Acta
   Marmota 261001_0045 (§1, «Control de Poble»). «Publicar al Xat» ja no hi
   és; el Xat continua obert des de «Missatges per a dubtes» (prova de baix). */
test('D3 · les targetes que naveguen i el seu destí, amb «Ajustos del xat» → /control-xat (D16)', () => {
  pinta();
  const esperats = [
    ['Publicar al Mur', '/mur'],
    ['Publicar al Mercat', '/mercat'],
    ["Publicar a l'Agenda", '/mur'],
    ['Editor de Notes', '/notes'],
    ['Ajustos del xat', '/control-xat'],
    /* CU (261003) · l'única Utilitat que navega: la seua fitxa. */
    ['Snippet', '/control?fitxa=snippet']
  ];
  expect([...document.querySelectorAll('button.sp-card-link-overlay')].map((b) => b.getAttribute('aria-label')))
    .toEqual(esperats.map(([titol]) => titol));
  for (const [titol, desti] of esperats) {
    fireEvent.click(screen.getByRole('button', { name: titol }));
    expect(ubicacio(), titol).toBe(desti);
  }
});

test('D16 · «Ajustos del xat» porta el dibuix de la capçalera del Control del xat (CircleDashed)', () => {
  pinta();
  const targeta = screen.getByRole('button', { name: 'Ajustos del xat' }).closest('article');
  expect(targeta.querySelector('.sp-card-title-icon svg.lucide-circle-dashed')).toBeTruthy();
  expect(within(targeta).queryByText('EN OBRES')).toBeNull();
});

/* Correcció de la revisió (260930) · «Ajustos del xat» és l'única porta al
   Control del xat (D16), que sí es tradueix: la targeta es tradueix amb ell. */
test('D16 · en anglés, la targeta «Ajustos del xat» es tradueix i continua obrint /control-xat', () => {
  estat.traductor = createTranslator('en');
  pinta();
  const boto = screen.getByRole('button', { name: 'Chat settings' });
  expect(within(boto.closest('article')).getByText('Column width and chat preferences')).toBeTruthy();
  expect(screen.queryByText('Ajustos del xat')).toBeNull();
  expect(screen.queryByText('Amplària de les columnes i preferències del xat')).toBeNull();
  fireEvent.click(boto);
  expect(ubicacio()).toBe('/control-xat');
});

test('D3 · «Gestoria de Poble» diu «EN OBRES» i no es pot prémer; cap targeta diu «ACTIU»', () => {
  pinta();
  const titol = screen.getByText('Gestoria de Poble');
  const targeta = titol.closest('article');
  expect(targeta.querySelector('.sp-card-link-overlay')).toBeNull();
  expect(within(targeta).getByText('EN OBRES').classList.contains('sdp-badge-tag')).toBe(true);
  expect(screen.queryByText('ACTIU')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Gestoria de Poble' })).toBeNull();
});

test('D3 · «Missatges per a dubtes» obri el Xat (/xat), no un fil inexistent', () => {
  pinta();
  fireEvent.click(screen.getByRole('button', { name: /Missatges per a dubtes/ }));
  expect(ubicacio()).toBe('/xat');
});

/* CU (Onada 3, 261003) · Control › Utilitats guanya el Snippet, amb la seua
   fitxa de detall (FitxaSnippet.test.jsx en prova el contingut). */
const utilitats = () => [
  ...screen.getByRole('heading', { level: 2, name: 'Utilitats i Connectors (Plugins)' })
    .closest('section').querySelectorAll('article .sp-card-title')
].map((titol) => titol.textContent);

test('CU · la llista d’Utilitats és la d’abans amb el Snippet al final, sense etiqueta i amb clic', () => {
  pinta();
  expect(utilitats()).toEqual([
    'Gestoria de Poble', 'Consola de Mètriques', 'Curation AI (Lector RSS)', 'Cervell (Node Graph)', 'Snippet'
  ]);
  const targeta = screen.getByText('Snippet', { selector: '.sp-card-title' }).closest('article');
  expect(within(targeta).getByText('Extensió de Chrome per a desar webs al Bloc')).toBeTruthy();
  expect(targeta.querySelector('.sp-card-title-icon svg.lucide-scissors')).toBeTruthy();
  expect(targeta.querySelector('.sdp-badge-tag')).toBeNull();
  expect(targeta.classList.contains('sp-card')).toBe(true);
  /* Les altres quatre continuen sense clic. */
  for (const titol of ['Gestoria de Poble', 'Consola de Mètriques', 'Curation AI (Lector RSS)', 'Cervell (Node Graph)']) {
    expect(screen.queryByRole('button', { name: titol }), titol).toBeNull();
  }
});

test('CU · la targeta del Snippet obri la seua fitxa sobre la mateixa ruta, a /control i a /utilitats', () => {
  for (const ruta of ['/control', '/utilitats']) {
    pinta(ruta);
    fireEvent.click(screen.getByRole('button', { name: 'Snippet' }));
    expect(ubicacio(), ruta).toBe(`${ruta}?fitxa=snippet`);
    expect(document.querySelector('[data-titol="pagina"]').textContent, ruta).toBe('Snippet');
    expect(screen.getByRole('heading', { level: 2, name: 'Què és' })).toBeTruthy();
    expect(screen.getByText('Instal·la a Chrome').closest('.sdp-control-actions'), ruta).toBeTruthy();
    expect(screen.queryByText('Utilitats i Connectors (Plugins)'), ruta).toBeNull();
    cleanup();
  }
});

/* CU · Correcció de la revisió · Obrir la fitxa només canvia la consulta: App
   no mou el focus (mira el camí) i ningú torna a dalt el desplaçador del
   contingut. Al mòbil, la fitxa s'obria al final, amb el títol i el botó
   amagats per dalt i el focus al <body>. jsdom no fa maquetació: el
   desplaçador és un element amb overflow-y (el llig getComputedStyle) i unes
   mides fixades a mà, com a enllacosInterns.test.js. */
function Arrere() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Arrere</button>;
}

/* <main> > desplaçador > l'app, o, amb `deLAmfitrio`, desplaçador > <main> > l'app. */
function pintaDinsDeLApp({ ruta = '/control', posicio = 4000, deLAmfitrio = false } = {}) {
  const main = document.createElement('main');
  main.tabIndex = -1;
  const desplacador = document.createElement('div');
  desplacador.style.setProperty('overflow-y', 'auto');
  Object.defineProperty(desplacador, 'scrollHeight', { configurable: true, value: 6000 });
  Object.defineProperty(desplacador, 'clientHeight', { configurable: true, value: 750 });
  desplacador.scrollTop = posicio;
  const contenidor = document.createElement('div');
  if (deLAmfitrio) {
    main.append(contenidor);
    desplacador.append(main);
    document.body.append(desplacador);
  } else {
    desplacador.append(contenidor);
    main.append(desplacador);
    document.body.append(main);
  }
  render(
    <MemoryRouter rutaInicial={ruta}>
      <ControlSection />
      <Ubicacio />
      <Arrere />
    </MemoryRouter>,
    { container: contenidor }
  );
  return { main, desplacador, treu: () => (deLAmfitrio ? desplacador : main).remove() };
}

test('CU · la fitxa s’obri des de dalt amb el focus a <main>, i en tornar arrere el Panell és on era', () => {
  const { main, desplacador, treu } = pintaDinsDeLApp({ posicio: 4000 });
  try {
    expect(document.activeElement).toBe(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'Snippet' }));
    expect(ubicacio()).toBe('/control?fitxa=snippet');
    expect(desplacador.scrollTop).toBe(0);
    expect(document.activeElement).toBe(main);

    /* La persona baixa per la fitxa, el focus se'n va, i torna arrere. */
    desplacador.scrollTop = 300;
    screen.getByRole('button', { name: 'Arrere' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Arrere' }));
    expect(ubicacio()).toBe('/control');
    expect(screen.getByText('Snippet', { selector: '.sp-card-title' })).toBeTruthy();
    expect(desplacador.scrollTop).toBe(4000);
    expect(document.activeElement).toBe(main);
  } finally {
    treu();
  }
});

test('CU · en entrar directament a la fitxa no es mou res, i el desplaçador de l’amfitrió no és nostre', () => {
  const directa = pintaDinsDeLApp({ ruta: '/control?fitxa=snippet', posicio: 700 });
  try {
    expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Snippet');
    expect(directa.desplacador.scrollTop).toBe(700);
    expect(document.activeElement).toBe(document.body);
  } finally {
    directa.treu();
  }
  cleanup();

  const amfitrio = pintaDinsDeLApp({ posicio: 4000, deLAmfitrio: true });
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Snippet' }));
    expect(ubicacio()).toBe('/control?fitxa=snippet');
    expect(amfitrio.desplacador.scrollTop).toBe(4000);
    expect(document.activeElement).toBe(amfitrio.main);
  } finally {
    amfitrio.treu();
  }
});

test('CU · un enllaç a la fitxa l’obri directament; una fitxa que no existix pinta el Panell', () => {
  pinta('/control?fitxa=snippet');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Snippet');
  cleanup();
  pinta('/utilitats?fitxa=brossa');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Panell de Control');
  expect(utilitats()).toContain('Snippet');
});

test('D3 · el títol de la pàgina és «Panell de Control», i la pestanya també a /control i a /utilitats', () => {
  pinta('/control');
  expect(document.querySelector('[data-titol="pagina"]').textContent).toBe('Panell de Control');
  expect(document.title).toBe('Panell de Control | Sóc de Poble');
  cleanup();
  pinta('/utilitats');
  expect(document.title).toBe('Panell de Control | Sóc de Poble');
});
