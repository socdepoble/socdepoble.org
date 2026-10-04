/* La Nevera de Casa · la integració final de la nit del 261004 (front «lector-nevera»), dins de
   la plataforma de veres. Cada prova fallaria sense el seu arreglo:
     F04  cada targeta del catàleg porta subtítol (la secció) i entradeta (d'on ix l'article);
     F04  la fitxa de l'article és una pàgina pròpia (PaginaApp, ?fitxa=<id>) que es pot
          recarregar, sense perdre la commutació del clic principal; un article propi («Tu») no
          posa cap dada personal a la URL;
     T3   un sol espaiat entre targetes: el selector del full casa amb les targetes de la Nevera;
     V2   (arreglo del verificador) la fitxa de La compra es veu també en estret.
   Totes les dades són sintètiques. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppNevera from './AppNevera.jsx';
import { creaMagatzemNevera } from './magatzem.js';
import manifestNevera from './manifest.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const tancats = [];

function munta(url) {
  const magatzem = creaMagatzemNevera({ idb: creaIdbFals().idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  tancats.push(magatzem);
  const App = () => <AppNevera magatzem={magatzem} descarrega={vi.fn()} />;
  const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
  muntaPlataforma(url, { registre, entorn: ENTORN });
}

const detall = () => within(document.getElementById('app-grid-main'));
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const targetaDe = (boto) => boto.closest('article.sp-card');

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('F04 · l’anatomia sencera de les targetes de la Nevera', () => {
  test('cada targeta del catàleg porta subtítol (la secció) i entradeta (d’on ix l’article)', async () => {
    munta('/app/nevera/llista/casa');
    await screen.findByRole('region', { name: 'Catàleg' });
    const llet = targetaDe(detall().getByRole('button', { name: 'Llet' }));
    expect(llet.querySelector('.sp-card-subtitle').textContent).toBe('Llet i formatge');
    expect(llet.querySelector('.sp-card-text').textContent).toBe('Article de base del catàleg');
    const targetes = [...document.querySelectorAll('#app-grid-main article.sp-card')];
    expect(targetes.length).toBeGreaterThan(50);
    expect(targetes.filter((targeta) => !targeta.querySelector('.sp-card-subtitle')?.textContent)).toEqual([]);
    expect(targetes.filter((targeta) => !targeta.querySelector('.sp-card-text')?.textContent)).toEqual([]);
  });

  test('un article propi: subtítol i entradeta reals, la boina «Tu» i cap dada personal a la URL de la seua fitxa', async () => {
    munta('/app/nevera/cataleg');
    const camp = await screen.findByRole('combobox', { name: 'Busca o crea un article' });
    fireEvent.change(camp, { target: { value: 'Tofu' } });
    fireEvent.click(detall().getByRole('button', { name: 'Afig' }));
    const tofu = targetaDe(detall().getByRole('button', { name: 'Tofu' }));
    expect(tofu.querySelector('.sp-card-subtitle').textContent).toBe('Articles propis');
    /* Derogat per l'ordre del Mestre, 261004 (arreglo del verificador) · Ja no diu «creat en este
       dispositiu»: una còpia recuperada d'un altre dispositiu porta articles propis que no s'hi
       han creat (vestits.test.js). */
    expect(tofu.querySelector('.sp-card-text').textContent).toBe('Article propi');
    /* El toc obri el diàleg de sempre; d'allí, la fitxa. */
    fireEvent.click(detall().getByRole('button', { name: 'Tofu' }));
    const dialeg = screen.getByRole('dialog', { name: 'Tofu' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Fitxa de l’article' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/cataleg/casa?fitxa=p-1'));
    expect(ubicacio()).not.toMatch(/tofu/i);
    const titol = await detall().findByRole('heading', { level: 1, name: 'Tofu' });
    const pagina = titol.closest('.sdp-universal-page-container');
    const boina = pagina.querySelector('section.bar-orange');
    expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Tu');
    expect(within(boina).queryByRole('link')).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Tofu' })).toBeNull();
  });
});

describe('F04 · la fitxa de l’article, pàgina pròpia sense perdre la commutació', () => {
  test('a La compra: el toc commuta com sempre; la fitxa (de la URL o del diàleg) és una PaginaApp, i Tornar torna a la targeta', async () => {
    munta('/app/nevera/llista/casa');
    await screen.findByRole('region', { name: 'Catàleg' });
    /* La commutació del clic principal, intacta. */
    fireEvent.click(detall().getByRole('button', { name: 'Llet' }));
    expect(detall().getByRole('button', { name: 'Llet' }).getAttribute('aria-pressed')).toBe('true');
    /* El detall secundari (el botó dret) i, des del diàleg, la fitxa. */
    fireEvent.contextMenu(detall().getByRole('button', { name: 'Llet' }));
    const dialeg = screen.getByRole('dialog', { name: 'Llet' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Fitxa de l’article' }));
    expect(ubicacio()).toBe('/app/nevera/llista/casa?fitxa=llet');
    const titol = await detall().findByRole('heading', { level: 1, name: 'Llet' });
    await waitFor(() => expect(document.activeElement).toBe(titol));
    const pagina = titol.closest('.sdp-universal-page-container');
    /* La boina de qui signa (el projecte, enllaçat), el subtítol, l'entradeta i l'estat. */
    const boina = pagina.querySelector('section.bar-orange');
    expect(within(boina).getByRole('link', { name: /^Sóc de Poble/ }).getAttribute('href')).toBe('/projecte');
    expect(pagina.textContent).toContain('Llet i formatge');
    expect(pagina.textContent).toContain('Article de base del catàleg');
    expect(within(pagina).getByText('A la llista', { selector: '.sp-card-label' })).toBeTruthy();
    /* Cap Compartir: les dades viuen al dispositiu. */
    expect([...pagina.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label'))).not.toContain('Compartir');
    /* L'acció principal obri el diàleg de sempre damunt de la fitxa; tancar-lo la deixa. */
    fireEvent.click(within(pagina).getByRole('button', { name: 'Posa-ho a la llista' }));
    expect(ubicacio()).toBe('/app/nevera/llista/casa?fitxa=llet&article=llet');
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Llet' })).getByRole('button', { name: 'Cancel·la' }));
    expect(ubicacio()).toBe('/app/nevera/llista/casa?fitxa=llet');
    /* Tornar: la graella de nou i el focus a la targeta. */
    fireEvent.click(within(pagina).getByRole('button', { name: 'Tornar arrere' }));
    expect(ubicacio()).toBe('/app/nevera/llista/casa');
    await waitFor(() => expect(document.activeElement?.dataset.element).toBe('llet'));
  });

  test('la fitxa es pot recarregar: ?fitxa=<id> a la URL pinta la pàgina de l’article', async () => {
    munta('/app/nevera/cataleg/casa?fitxa=ous');
    const titol = await screen.findByRole('heading', { level: 1, name: 'Ous' });
    expect(titol.closest('#app-grid-main')).not.toBeNull();
    expect(document.querySelectorAll('#app-grid-main article.sp-card')).toHaveLength(0);
  });
});

/* Arreglo del verificador (ordre del Mestre, 261004, «la fitxa de La compra no és compartible entre
   amplades») · La compra és l'entrada per defecte i hi va primer la col·lecció: en estret, el camí
   sense tram (el que genera l'ample) obria el panell «Per comprar» damunt de la fitxa, que és
   contingut de la columna del catàleg (no un diàleg, com ?article=). */
describe('la fitxa de La compra en estret (375 px)', () => {
  const closca = () => document.querySelector('.app-grid-shell');
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
  });

  test('un enllaç ?fitxa= sense tram (el de l’ample) pinta la fitxa a la vista, sense cap panell damunt', async () => {
    munta('/app/nevera/llista/casa?fitxa=llet');
    const titol = await screen.findByRole('heading', { level: 1, name: 'Llet' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/llista/casa/cataleg?fitxa=llet'));
    expect(closca().dataset.panell).toBe('');
    expect(titol.closest('#app-grid-main')).not.toBeNull();
    expect(document.getElementById('app-grid-main').hasAttribute('inert')).toBe(false);
  });

  test('la fitxa oberta en ample continua a la vista quan la finestra s’estreteix (el gir d’una tauleta)', async () => {
    const observadors = [];
    vi.stubGlobal('ResizeObserver', class { constructor(avisa) { observadors.push(avisa); } observe() {} disconnect() {} });
    const amplada = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
    munta('/app/nevera/llista/casa');
    await screen.findByRole('region', { name: 'Catàleg' });
    fireEvent.contextMenu(detall().getByRole('button', { name: 'Llet' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Llet' })).getByRole('button', { name: 'Fitxa de l’article' }));
    /* En ample, el camí de sempre (Llei del Píxel). */
    expect(ubicacio()).toBe('/app/nevera/llista/casa?fitxa=llet');
    const titol = await detall().findByRole('heading', { level: 1, name: 'Llet' });
    amplada.mockReturnValue(375);
    await act(async () => { for (const avisa of observadors) avisa([]); });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    await waitFor(() => expect(ubicacio()).toBe('/app/nevera/llista/casa/cataleg?fitxa=llet'));
    expect(closca().dataset.panell).toBe('');
    expect(titol.isConnected).toBe(true);
    expect(document.getElementById('app-grid-main').hasAttribute('inert')).toBe(false);
  });
});

describe('T3 · un sol espaiat entre targetes de la Nevera (modules.css)', () => {
  test('la regla viu al bloc del front i el seu selector casa amb les targetes de la graella de la Nevera', async () => {
    const MODULES = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
    const inici = MODULES.indexOf('Front «lector-nevera».');
    const bloc = MODULES.slice(MODULES.indexOf('@layer components {', inici), MODULES.indexOf('\n}\n', inici) + 2);
    const SELECTOR = '[data-sdp-app="nevera"] .sdp-card-grid > .sp-card';
    expect(bloc).toMatch(/\[data-sdp-app="nevera"\] \.sdp-card-grid > \.sp-card \{\s*margin-block-end: 0;\s*\}/);
    munta('/app/nevera/llista/casa');
    await screen.findByRole('region', { name: 'Catàleg' });
    expect(document.querySelectorAll(SELECTOR).length).toBeGreaterThan(50);
  });
});
