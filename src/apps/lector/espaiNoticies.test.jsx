/* Notícies del Poble · Bloc 0 del Gauntlet (ordre del Mestre, 261016, prompt 261016_0015):
   /app/lector/noticies sobre l'espai de treball del Bloc de notes (UniversalWorkspace), dins de
   la plataforma de veres (RutaApps → AppLector → EspaiNoticies), amb la llavor sintètica, un
   «ara» fix i el magatzem sobre el navegador fals de P2. Ample (1400 px), mitjana (800 px) i
   estret (375 px). Totes les dades són inventades.
     · l'arbre: «Hui», «Per a després», les categories i, dins, les fonts que se seguixen, amb
       el recompte de no llegides (la Insignia de l'espai);
     · la selecció ix de la URL (enllaç profund) i la tria de la persona hi torna (push);
     · la llista és la fila per defecte de l'espai (DefaultItemCard) i el detall, la lectura;
     · «Marca-ho tot com a llegit» al detall sense notícia (amb una cerca, només els resultats:
       L1-2, girat a regressió per l'F2 del Gauntlet);
     · una altra carpeta o una altra font torna la llista a dalt (P2 de Codex, 261016);
     · cap UniversalCard ni GraellaTargetes al flux de notícies;
     · l'enllaç vell /noticies/<carpeta>/<font>?article= continua obrint la notícia;
     · Encàrrec F del Gauntlet (261016, auditoria adversarial del Lector): la notícia oberta es
       queda a la seua carpeta encara que en lleves «Desa per a després»; amb la carpeta de la URL
       amagada a la roda dentada, el detall és el de la llista que es veu; i, en estret, l'Arrere
       del sistema torna a la llista com l'aspa;
     · E1 del Gauntlet (261016): les dreceres d'un sol caràcter de Feedly (J/K, N/P, O, M, S, V,
       Maj+A, Maj+J/Maj+K), només amb el focus dins de la closca (WCAG 2.1.4). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CLAU_CARPETES_VISIBLES, _reiniciaCarpetesVisibles } from '../../components/universal/workspace/carpetesVisibles.js';
import { ALL_CATEGORY_ID } from '../../components/universal/workspace/workspaceState.js';
import { delVal, setVal } from '../../config/storage.js';
import { validaRutes } from '../plataforma/index.js';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import { ARA, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import { creaAdaptadorRemot } from './fontRemota.js';
import { CATEGORIES_LLAVOR, FONTS_LLAVOR } from './llavor/cataleg.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { NOM_BASE, STORE } from './magatzem.js';
import manifestLector from './manifest.js';
import { CAMI_FONTS_VELL, CAMI_TOTES, RUTES_NOTICIES } from './rutes.js';
import { accioDeTecla, ordreDeLArbre } from './vistes/dreceres.js';
import {
  PREFIX_CARPETA, PREFIX_FONT, carpetaDeOpcio, fontDeOpcio, opcioDeCarpeta, opcioDeFont, rutaDeSeleccio, seleccioDeRuta
} from './vistes/navegacio.js';

const CORREFOC = 'El correfoc de les festes passarà pel barranc';
const ASSAIG = 'Assaig obert de tabals per a qui vulga provar';
const LLAVADOR = 'El ple aprova la reforma del llavador vell';

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => within(document.getElementById(id));
const esquerra = () => columna('app-grid-sidebar');
const mig = () => columna('app-grid-list');
const detall = () => columna('app-grid-main');
const closca = () => document.querySelector('.app-grid-shell');
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
/* L'arbre de l'espai: la navegació de la columna esquerra. */
const arbre = () => within(document.getElementById('app-grid-sidebar').querySelector('nav.sdp-workspace-column__body'));
/* Una fila de l'arbre pel seu nom (el nom accessible suma el recompte: «Hui 6 sense llegir»). */
const filaDeLArbre = (nom) => arbre().getByRole('button', { name: new RegExp(`^${nom}(?: \\d+ sense llegir)?$`) });
/* El que es veu d'una fila: el nom i, si n'hi ha, la xifra de la Insignia. */
const vistaDe = (fila) => {
  const xifra = fila.querySelector('.sdp-insignia [aria-hidden="true"]');
  return [fila.querySelector('.sdp-workspace-nav-item__label').textContent, xifra ? xifra.textContent : null];
};
/* Les files de la llista: la fitxa per defecte de l'espai (DefaultItemCard). */
const fitxes = () => [...document.getElementById('app-grid-list').querySelectorAll('button.sdp-gestor-fitxa')];
const titolsDeLaLlista = () => fitxes().map((fitxa) => fitxa.querySelector('.sdp-gestor-fitxa__titol').textContent);
const fitxa = (titol) => fitxes().find((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent === titol);
/* L'H1 de la lectura, que viu al detall (l'app arriba amb lazy(): s'espera a tot el document). */
async function titolDelLector(titol) {
  const h1 = await screen.findByRole('heading', { level: 1, name: titol });
  expect(document.getElementById('app-grid-main').contains(h1)).toBe(true);
  return h1;
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  ambAmplada(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('les rutes i la traducció camí ↔ selecció (navegacio.js)', () => {
  /* Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, la gestió de fonts deixa de
     ser una pàgina i la taula de la closca (RUTES) se'n va: les rutes de notícies, totes soles,
     cobrixen les entrades del manifest (una: les notícies). */
  test('les rutes de notícies són vàlides, sense columnes, i cobrixen les entrades', () => {
    const { manifest } = validaManifestApp(manifestLector);
    expect(validaRutes(RUTES_NOTICIES)).toEqual({ ok: true, errors: [] });
    expect(RUTES_NOTICIES.every((ruta) => !('Mig' in ruta) && !('Detall' in ruta) && !('Esquerra' in ruta))).toBe(true);
    expect(RUTES_NOTICIES.map((ruta) => ruta.path)).toEqual(expect.arrayContaining([CAMI_TOTES, CAMI_FONTS_VELL]));
    expect(new Set(RUTES_NOTICIES.map((ruta) => ruta.path.split('/')[0]))).toEqual(new Set(manifest.entrades.map((e) => e.slug)));
  });

  test('el camí dona la selecció; la selecció, el camí; «Totes» és la categoria null', () => {
    const ruta = (...trams) => ['/app/lector', ...trams].join('/');
    const fonts = [{ id: 'colla-dimonis', categoriaId: 'festes' }, { id: 'radio', categoriaId: null }];
    expect(seleccioDeRuta({}, {})).toEqual({ categoryId: opcioDeCarpeta('hui'), itemId: null });
    expect(seleccioDeRuta({ carpeta: 'festes' }, { article: 'a-1' })).toEqual({ categoryId: 'carpeta:festes', itemId: 'a-1' });
    expect(seleccioDeRuta({ carpeta: 'hui', font: 'colla-dimonis' }, {})).toEqual({ categoryId: 'font:colla-dimonis', itemId: null });
    expect(seleccioDeRuta({ carpeta: 'hui' }, { totes: true })).toEqual({ categoryId: null, itemId: null });
    /* Un ?article= que no és un id opac no obri res. */
    expect(seleccioDeRuta({ carpeta: 'hui' }, { article: '../x' }).itemId).toBeNull();
    expect(rutaDeSeleccio({ categoryId: 'carpeta:despres', itemId: null }, { fonts, ruta })).toBe('/app/lector/noticies/despres');
    expect(rutaDeSeleccio({ categoryId: 'font:colla-dimonis', itemId: 'a-1' }, { fonts, ruta })).toBe('/app/lector/noticies/festes/colla-dimonis?article=a-1');
    expect(rutaDeSeleccio({ categoryId: 'font:radio', itemId: null }, { fonts, ruta })).toBe('/app/lector/noticies/hui/radio');
    expect(rutaDeSeleccio({ categoryId: 'font:ja-no-hi-es', itemId: null }, { fonts, ruta })).toBe('/app/lector/noticies/hui');
    /* El «Tot» de l'espai (el seu id intern, que la porta no exposa) i null són «Totes». */
    expect(rutaDeSeleccio({ categoryId: ALL_CATEGORY_ID, itemId: null }, { fonts, ruta })).toBe('/app/lector/noticies/totes');
    expect(rutaDeSeleccio({ categoryId: null, itemId: 'a-1' }, { fonts, ruta })).toBe('/app/lector/noticies/totes?article=a-1');
    /* Els prefixos separen categories i fonts amb el mateix id. */
    expect(opcioDeCarpeta('esports')).not.toBe(opcioDeFont('esports'));
    expect([carpetaDeOpcio('carpeta:esports'), fontDeOpcio('carpeta:esports'), fontDeOpcio('font:esports')]).toEqual(['esports', null, 'esports']);
    expect([carpetaDeOpcio(PREFIX_CARPETA), fontDeOpcio(PREFIX_FONT), carpetaDeOpcio(null)]).toEqual([null, null, null]);
  });
});

describe('en ample: l’arbre, la llista i la lectura de costat', () => {
  test('l’arbre amb els recomptes de no llegides: Hui, Per a després, les categories i, dins, les fonts', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    expect(closca().dataset.layout).toBe('ample');
    /* «Hui» per defecte, sense cap carpeta al camí. */
    const hui = filaDeLArbre('Hui');
    expect(hui.getAttribute('aria-current')).toBe('page');
    expect(hui.getAttribute('aria-expanded')).toBeNull();
    /* Les arrels, en ordre, amb la xifra que es veu i el text sencer per al lector de pantalla. */
    const arrels = [...document.querySelectorAll('#app-grid-sidebar nav.sdp-workspace-column__body > .sdp-workspace-groups > .sdp-workspace-group > ul > li > .sdp-workspace-folder-row > .sdp-workspace-nav-item:first-child')];
    expect(arrels.map(vistaDe)).toEqual([
      ['Hui', '6'], ['Per a després', null], ['Ajuntament i serveis', '7'], ['Cultura i festes', '3'], ['Camp i temps', '3'], ['Esports', '3']
    ]);
    expect(hui.querySelector('.sdp-insignia').className).toBe('sdp-insignia sdp-insignia--neutre');
    expect(hui.querySelector('.sdp-insignia .sdp-sr-only').textContent).toBe('6 sense llegir');
    expect(filaDeLArbre('Ajuntament i serveis').getAttribute('aria-expanded')).toBe('false');
    /* Les fonts, dins de la seua categoria: en desplegar-la, amb el seu recompte. */
    fireEvent.click(arbre().getByRole('button', { name: 'Desplegar Ajuntament i serveis' }));
    expect(vistaDe(filaDeLArbre('La Veu de la Plaça'))).toEqual(['La Veu de la Plaça', '4']);
    expect(vistaDe(filaDeLArbre('El Pregoner del Carrer Major'))).toEqual(['El Pregoner del Carrer Major', '3']);
    /* Desplegar no tria res: la carpeta i la URL continuen. */
    expect(ubicacio()).toBe('/app/lector/noticies');
    /* La llista: les sis notícies de «Hui», de la més nova a la més vella; cap obri pel seu compte. */
    expect(fitxes()).toHaveLength(6);
    expect(titolsDeLaLlista()[0]).toBe(CORREFOC);
    expect(fitxes().some((boto) => boto.getAttribute('aria-current') === 'true')).toBe(false);
    /* El detall sense notícia: la carpeta, quantes en porta i «Marca-ho tot com a llegit». */
    expect(detall().getByText('6 notícies, 6 sense llegir. Obri’n una de la llista per a llegir-la.')).toBeTruthy();
    expect(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(false);
    /* Cap botó de crear: és un lector. */
    expect(mig().queryByRole('button', { name: /CREAR/ })).toBeNull();
  });

  /* La regla de modules.css que porta la Insignia del recompte a l'extrem de la fila. jsdom no
     aplica el full: es llig el text, dins de la capa de components del bloc de l'espai, i es
     comprova que el seu selector casa amb la insígnia de l'arbre i amb cap altra de la pantalla. */
  test('la insígnia del recompte va a l’extrem de la fila i no s’encongix (modules.css)', async () => {
    const SELECTOR = '.sdp-workspace-nav-item > .sdp-insignia';
    const modules = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
    const capa = modules.slice(modules.indexOf('@layer components {'), modules.indexOf('@layer legacy {'));
    const regla = capa.match(new RegExp(`\\n${SELECTOR.replace(/[.>]/g, (c) => `\\${c}`)} \\{([^}]*)\\}`));
    expect(regla, 'la regla és a la primera capa de components').not.toBeNull();
    expect(regla[1].replace(/\s+/g, ' ').trim()).toBe('margin-inline-start: auto; flex: none;');
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const insignies = [...document.querySelectorAll('.sdp-insignia')];
    expect(insignies.length).toBeGreaterThan(0);
    expect(insignies.every((insignia) => insignia.matches(SELECTOR))).toBe(true);
    expect(insignies.every((insignia) => insignia.closest('nav.sdp-workspace-column__body'))).toBe(true);
  });

  test('la fila de la llista: la fitxa de l’espai amb el títol, «font · data · Nou», la icona de la categoria i cap imatge', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const correfoc = fitxa(CORREFOC);
    expect(correfoc.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Colla de Dimonis de la Font Vella · 11:30 03/10/26 · Nou');
    /* La icona de la seua categoria (Cultura i festes: PartyPopper), mai una imatge de fora. */
    expect(correfoc.querySelector('.sdp-gestor-fitxa__media svg').getAttribute('class')).toMatch(/lucide-party-popper/);
    expect(document.getElementById('app-grid-list').querySelectorAll('img')).toHaveLength(0);
  });

  test('cap UniversalCard ni GraellaTargetes al flux de notícies: l’espai de treball de veres, una sola closca', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    expect(document.querySelectorAll('.sp-card, .sdp-card-grid, .sdp-card-llista')).toHaveLength(0);
    expect(document.querySelectorAll('.app-grid-shell')).toHaveLength(1);
    expect(document.querySelector('.app-grid-page').classList.contains('sdp-workspace--universal')).toBe(true);
    /* Cap doble reserva de la barra mòbil: l'espai no viu dins de l'àrea única de la plataforma. */
    expect(document.querySelector('.sdp-app-unica')).toBeNull();
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    expect(document.querySelectorAll('.sp-card, .sdp-card-grid, .sdp-card-llista')).toHaveLength(0);
  });

  test('triar a l’arbre navega (push): una categoria es desplega i filtra, i una font, dins seu', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    const abans = window.history.length;
    fireEvent.click(filaDeLArbre('Cultura i festes'));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    expect(window.history.length).toBe(abans + 1);
    await screen.findByRole('region', { name: 'Cultura i festes' });
    expect(filaDeLArbre('Cultura i festes').getAttribute('aria-current')).toBe('page');
    expect(filaDeLArbre('Cultura i festes').getAttribute('aria-expanded')).toBe('true');
    expect(titolsDeLaLlista()).toEqual([CORREFOC, ASSAIG, 'Gràcies per les festes de Sant Miquel']);
    fireEvent.click(filaDeLArbre('Colla de Dimonis de la Font Vella'));
    expect(ubicacio()).toBe('/app/lector/noticies/festes/colla-dimonis');
    await screen.findByRole('region', { name: 'Colla de Dimonis de la Font Vella' });
    expect(fitxes()).toHaveLength(3);
    /* Cap notícia s'obri sola en triar: res no queda llegit. */
    expect(ubicacio()).not.toMatch(/article=/);
    expect(vistaDe(filaDeLArbre('Colla de Dimonis de la Font Vella'))).toEqual(['Colla de Dimonis de la Font Vella', '3']);
  });

  test('«Totes» (el «Tot» de l’espai): /noticies/totes, totes les notícies que se seguixen', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(esquerra().getByRole('button', { name: 'Totes' }));
    expect(ubicacio()).toBe('/app/lector/noticies/totes');
    await screen.findByRole('region', { name: 'Totes' });
    expect(fitxes()).toHaveLength(16);
    expect(esquerra().getByRole('button', { name: 'Totes' }).getAttribute('aria-pressed')).toBe('true');
  });

  test('la selecció ix de la URL (enllaç profund): una categoria, una font i la seua categoria desplegada', async () => {
    munta('/app/lector/noticies/esports');
    await screen.findByRole('region', { name: 'Esports' });
    expect(filaDeLArbre('Esports').getAttribute('aria-current')).toBe('page');
    expect(fitxes()).toHaveLength(3);
    cleanup();
    munta('/app/lector/noticies/camp/cooperativa');
    await screen.findByRole('region', { name: 'Cooperativa de l’Horta Vella' });
    expect(filaDeLArbre('Cooperativa de l’Horta Vella').getAttribute('aria-current')).toBe('page');
    expect(filaDeLArbre('Camp i temps').getAttribute('aria-expanded')).toBe('true');
    expect(titolsDeLaLlista()).toEqual(['Comença la collita del caqui amb bona previsió', 'Preus de referència de la setmana', 'Avís de pluges fortes per a dilluns']);
    expect(ubicacio()).toBe('/app/lector/noticies/camp/cooperativa');
  });

  test('una carpeta que no existix: l’espai torna a «Hui» i la URL ho diu (replace, sense cap pas d’historial)', async () => {
    munta('/app/lector/noticies/inventada');
    const abans = window.history.length;
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/hui'));
    expect(window.history.length).toBe(abans);
    expect(filaDeLArbre('Hui').getAttribute('aria-current')).toBe('page');
  });

  test('obrir una fila: la lectura al detall, el recompte baixa, la fila perd «Nou» i el disc ho guarda', async () => {
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const abans = window.history.length;
    fireEvent.click(fitxa(CORREFOC));
    const titol = await titolDelLector(CORREFOC);
    const id = new URLSearchParams(window.location.search).get('article');
    expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${id}`);
    expect(window.history.length).toBe(abans + 1);
    expect(document.activeElement).toBe(titol);
    /* L'arbre i la llista es queden; la fila oberta, marcada. */
    expect(document.getElementById('app-grid-sidebar').hasAttribute('inert')).toBe(false);
    expect(fitxa(CORREFOC).getAttribute('aria-current')).toBe('true');
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '5']);
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', '2']);
    expect(fitxa(CORREFOC).querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Colla de Dimonis de la Font Vella · 11:30 03/10/26');
    await waitFor(() => expect(desat(idb)?.llegits).toEqual([id]));
  });

  test('«Marca-ho tot com a llegit» marca les de la carpeta que es veu, i res més', async () => {
    const { idb } = munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }));
    expect(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(true);
    expect(detall().getByText('3 notícies, totes llegides. Obri’n una de la llista per a llegir-la.')).toBeTruthy();
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', null]);
    expect(filaDeLArbre('Cultura i festes').getAttribute('aria-label')).toBeNull();
    /* «Hui» perd la del correfoc (era de festes); les altres carpetes no es toquen. */
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '5']);
    expect(vistaDe(filaDeLArbre('Esports'))).toEqual(['Esports', '3']);
    expect(fitxes().every((boto) => !boto.textContent.endsWith('Nou'))).toBe(true);
    await waitFor(() => expect(desat(idb)?.llegits).toHaveLength(3));
  });

  test('«Per a després» compta les desades que encara no s’han llegit', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Desa per a després' }));
    /* Desada i llegida (obrir-la la llig): res a dir. */
    expect(vistaDe(filaDeLArbre('Per a després'))).toEqual(['Per a després', null]);
    fireEvent.click(detall().getByRole('button', { name: 'Marca com a no llegit' }));
    expect(vistaDe(filaDeLArbre('Per a després'))).toEqual(['Per a després', '1']);
    expect(filaDeLArbre('Per a després').querySelector('.sdp-sr-only').textContent).toBe('1 sense llegir');
    fireEvent.click(filaDeLArbre('Per a després'));
    await screen.findByRole('region', { name: 'Per a després' });
    expect(titolsDeLaLlista()).toEqual([CORREFOC]);
  });

  /* Encàrrec F del Gauntlet (261016, P2) · La fila d'una notícia d'una font que se seguix és de
     «Per a després» només mentre està desada. Llevar-ne «Desa per a després» amb la notícia oberta
     li llevava la carpeta, i l'espai, reconciliant, portava la persona a «Cultura i festes» i
     reescrivia la URL (replace). Com a Feedly, la notícia es queda on era fins que la persona navega;
     en tancar-la, «Per a després» ja no la porta. */
  test('llevar «Desa per a després» dins de «Per a després»: la carpeta, la llista i la URL es queden', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [correfoc] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    const entorn = prepara();
    await entorn.magatzem.desa({ llegits: [], despres: [correfoc], noSeguides: [] });
    const { idb } = munta('/app/lector/noticies/despres', entorn);
    await screen.findByRole('region', { name: 'Per a després' });
    await waitFor(() => expect(titolsDeLaLlista()).toEqual([CORREFOC]));
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    const oberta = `/app/lector/noticies/despres?article=${correfoc.id}`;
    expect(ubicacio()).toBe(oberta);
    const abans = window.history.length;
    fireEvent.click(detall().getByRole('button', { name: 'Desa per a després' }));
    expect(detall().getByRole('button', { name: 'Desa per a després' }).getAttribute('aria-pressed')).toBe('false');
    await waitFor(() => expect(desat(idb)?.despres).toEqual([]));
    await act(async () => {});
    expect(ubicacio()).toBe(oberta);
    expect(window.history.length).toBe(abans);
    expect(filaDeLArbre('Per a després').getAttribute('aria-current')).toBe('page');
    expect(filaDeLArbre('Cultura i festes').getAttribute('aria-current')).toBeNull();
    expect(titolsDeLaLlista()).toEqual([CORREFOC]);
    expect(fitxa(CORREFOC).getAttribute('aria-current')).toBe('true');
    /* Tancar-la: «Per a després», ja sense ella. */
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    expect(ubicacio()).toBe('/app/lector/noticies/despres');
    await screen.findByRole('region', { name: 'Per a després' });
    expect(fitxes()).toHaveLength(0);
  });

  test('una notícia desada d’una font que ja no hi és: a «Per a després», amb l’autor de l’article i mai «Sóc de Poble»', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    const adaptador = {
      ...llavor,
      llistaFonts: async () => {
        const { categories, fonts } = await llavor.llistaFonts();
        return { categories, fonts: fonts.filter((font) => font.id !== 'colla-dimonis') };
      },
      llistaArticles: async (opcions) => (await llavor.llistaArticles(opcions)).filter((article) => article.fontId !== 'colla-dimonis')
    };
    const entorn = prepara({ adaptador });
    await entorn.magatzem.desa({ llegits: [], despres: [{ ...primer, autor: 'Redacció de la Colla' }], noSeguides: [] });
    munta('/app/lector/noticies/despres', entorn);
    await screen.findByRole('region', { name: 'Per a després' });
    await waitFor(() => expect(titolsDeLaLlista()).toEqual([CORREFOC]));
    expect(fitxa(CORREFOC).querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe('Redacció de la Colla · 11:30 03/10/26 · Nou');
    expect(document.getElementById('app-grid-list').textContent).not.toMatch(/Sóc de Poble/);
    /* Ni a «Hui» ni a cap categoria: la font ja no se seguix (ni hi és). */
    expect(arbre().queryByRole('button', { name: /^Colla de Dimonis/ })).toBeNull();
  });
});

describe('els enllaços vells continuen obrint el que obrien', () => {
  test('/noticies/<carpeta>/<font>?article=<id> obri la notícia, amb la font triada i sense canviar la URL', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    munta(`/app/lector/noticies/festes/colla-dimonis?article=${primer.id}`);
    await titolDelLector(CORREFOC);
    expect(ubicacio()).toBe(`/app/lector/noticies/festes/colla-dimonis?article=${primer.id}`);
    expect(filaDeLArbre('Colla de Dimonis de la Font Vella').getAttribute('aria-current')).toBe('page');
    expect(fitxa(CORREFOC).getAttribute('aria-current')).toBe('true');
  });

  test('la font dins de «Hui» (/noticies/hui/<font>?article=, els enllaços de «Les que seguixes») també', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    munta(`/app/lector/noticies/hui/colla-dimonis?article=${primer.id}`);
    await titolDelLector(CORREFOC);
    expect(ubicacio()).toBe(`/app/lector/noticies/hui/colla-dimonis?article=${primer.id}`);
    expect(filaDeLArbre('Colla de Dimonis de la Font Vella').getAttribute('aria-current')).toBe('page');
  });

  test('/noticies/<carpeta>/fonts (les fonts d’una carpeta en estret, 261004) es canonitza a la carpeta', async () => {
    munta('/app/lector/noticies/festes/fonts');
    const abans = window.history.length;
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/festes'));
    expect(window.history.length).toBe(abans);
    await screen.findByRole('region', { name: 'Cultura i festes' });
  });

  test('una notícia que no és a la llista (d’una font que ja no se seguix) també s’obri, i en tancar-la es torna a la carpeta', async () => {
    const entorn = prepara();
    await entorn.magatzem.desa({ llegits: [], despres: [], noSeguides: ['veu-placa'] });
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [llavador] = await llavor.llistaArticles({ fontId: 'veu-placa' });
    munta(`/app/lector/noticies/hui?article=${llavador.id}`, entorn);
    await titolDelLector(LLAVADOR);
    expect(fitxes().map((boto) => boto.querySelector('.sdp-gestor-fitxa__titol').textContent)).not.toContain(LLAVADOR);
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
  });
});

describe('en tancar, el focus torna a la fila', () => {
  test('l’aspa i l’arrere del navegador: el focus a la fila de la notícia; una altra carpeta, no', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(fitxa(ASSAIG));
    await titolDelLector(ASSAIG);
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(document.activeElement).toBe(fitxa(ASSAIG)));
    fireEvent.click(fitxa(ASSAIG));
    await titolDelLector(ASSAIG);
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/festes'));
    await waitFor(() => expect(document.activeElement).toBe(fitxa(ASSAIG)));
    /* Amb l'article obert, una altra carpeta: el focus és de l'arbre, on l'ha posat la persona. */
    fireEvent.click(fitxa(ASSAIG));
    await titolDelLector(ASSAIG);
    const totes = esquerra().getByRole('button', { name: 'Totes' });
    totes.focus();
    fireEvent.click(totes);
    expect(ubicacio()).toBe('/app/lector/noticies/totes');
    await screen.findByRole('region', { name: 'Totes' });
    expect(document.activeElement).toBe(totes);
  });
});

/* P2 de Codex (auditoria 261016_0021, relleu 02:26) · L'espai conserva el node de la llista d'una
   carpeta a l'altra, i el scroll s'hi quedava (240 a «Hui», 240 a «Esports»). Ara una altra
   carpeta o una altra font comença de dalt, com a Feedly, sense moure el focus de ningú; obrir i
   tancar una notícia de la mateixa carpeta la deixa on era. jsdom no fa layout: es llig i
   s'escriu scrollTop, que sí que guarda. */
describe('en canviar de carpeta, la llista torna a dalt', () => {
  const cosDeLaLlista = () => document.querySelector('#app-grid-list .sdp-workspace-column__body');

  test('obrir i tancar una notícia la deixa on era; una altra carpeta, a dalt, amb el focus a l’arbre', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const cos = cosDeLaLlista();
    cos.scrollTop = 240;
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    await waitFor(() => expect(document.activeElement).toBe(fitxa(CORREFOC)));
    expect(cosDeLaLlista()).toBe(cos);
    expect(cos.scrollTop).toBe(240);
    /* Amb la notícia oberta, una altra carpeta: el mateix node (l'espai no el remunta), a dalt. */
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    const esports = filaDeLArbre('Esports');
    esports.focus();
    fireEvent.click(esports);
    await screen.findByRole('region', { name: 'Esports' });
    expect(ubicacio()).toBe('/app/lector/noticies/esports');
    expect(fitxes()).toHaveLength(3);
    expect(cosDeLaLlista()).toBe(cos);
    expect(cos.scrollTop).toBe(0);
    expect(document.activeElement).toBe(esports);
  });

  test('sense cap notícia oberta: una categoria, una font i «Totes» també comencen de dalt', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const cos = cosDeLaLlista();
    cos.scrollTop = 120;
    fireEvent.click(filaDeLArbre('Cultura i festes'));
    await screen.findByRole('region', { name: 'Cultura i festes' });
    expect(cos.scrollTop).toBe(0);
    cos.scrollTop = 80;
    fireEvent.click(filaDeLArbre('Colla de Dimonis de la Font Vella'));
    await screen.findByRole('region', { name: 'Colla de Dimonis de la Font Vella' });
    expect(cos.scrollTop).toBe(0);
    cos.scrollTop = 60;
    fireEvent.click(esquerra().getByRole('button', { name: 'Totes' }));
    await screen.findByRole('region', { name: 'Totes' });
    expect(cos.scrollTop).toBe(0);
    /* Ni l'arbre ni el detall es mouen: només la llista. */
    const cosDeLArbre = document.querySelector('#app-grid-sidebar nav.sdp-workspace-column__body');
    cosDeLArbre.scrollTop = 50;
    cos.scrollTop = 70;
    fireEvent.click(filaDeLArbre('Esports'));
    await screen.findByRole('region', { name: 'Esports' });
    expect([cos.scrollTop, cosDeLArbre.scrollTop]).toEqual([0, 50]);
  });

  test('l’arrere del navegador cap a una altra carpeta també la torna a dalt, i el focus de l’amfitrió no es mou', async () => {
    const campDeLAmfitrio = document.createElement('input');
    document.body.append(campDeLAmfitrio);
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      const cos = cosDeLaLlista();
      campDeLAmfitrio.focus();
      cos.scrollTop = 240;
      window.history.pushState(null, '', '/app/lector/noticies/esports');
      await act(async () => { window.dispatchEvent(new PopStateEvent('popstate')); });
      await screen.findByRole('region', { name: 'Esports' });
      await waitFor(() => expect(fitxes()).toHaveLength(3));
      expect(cos.scrollTop).toBe(0);
      expect(document.activeElement).toBe(campDeLAmfitrio);
    } finally {
      campDeLAmfitrio.remove();
    }
  });

  test('la llista plegada (el rail de documents) també torna a dalt', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(mig().getByRole('button', { name: 'Replegar NOTÍCIES' }));
    const rail = document.querySelector('#app-grid-list nav.sdp-workspace-rail--documents');
    expect(rail).not.toBeNull();
    rail.scrollTop = 90;
    fireEvent.click(filaDeLArbre('Esports'));
    await screen.findByRole('region', { name: 'Esports' });
    expect(document.querySelector('#app-grid-list nav.sdp-workspace-rail--documents')).toBe(rail);
    expect(rail.querySelectorAll('button')).toHaveLength(3);
    expect(rail.scrollTop).toBe(0);
  });
});

/* L1-2 (Codex, relleu 02:26; encàrrec L1 del Gauntlet), girat a regressió per l'F2 del Gauntlet
   (261016) · Fins ara era un [DEFECTE] (convenció de gestoria/defectes.onada12.test.js: la prova
   afirmava el comportament defectuós): amb una cerca que deixava una notícia a la vista, «Marca-ho
   tot com a llegit» marcava les sis de «Hui», també les cinc que la cerca amagava, i el botó no
   deia res de l'abast. La cerca és estat intern de l'espai (WorkspaceContext.jsx, filteredItems):
   ara l'espai passa a renderDetail els ids que es veuen a la llista i si hi ha filtre
   (UniversalWorkspace.jsx, DetailColumn: `visibleItemIds` i `filtered`), i el Lector, com a
   Feedly, marca només els resultats i ho diu al nom del botó. El resum del detall continua sent
   de la carpeta, i sense cerca el botó i l'abast són els de sempre. */
describe('«Marca-ho tot com a llegit» amb una cerca activa (L1-2)', () => {
  const cerca = (text) => {
    fireEvent.click(mig().getByRole('button', { name: 'Cercar notícies' }));
    fireEvent.change(mig().getByRole('searchbox', { name: 'Cercar notícies' }), { target: { value: text } });
  };

  test('la cerca en deixa una a la vista: el botó ho diu i marca només eixa; sense cerca, el de sempre', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [correfoc] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    expect(fitxes()).toHaveLength(6);
    cerca('correfoc');
    expect(titolsDeLaLlista()).toEqual([CORREFOC]);
    /* L'abast, al nom del botó; el resum és el de la carpeta. */
    expect(detall().queryByRole('button', { name: 'Marca-ho tot com a llegit' })).toBeNull();
    fireEvent.click(detall().getByRole('button', { name: 'Marca com a llegit el resultat' }));
    await waitFor(() => expect(desat(idb)?.llegits).toEqual([correfoc.id]));
    expect(detall().getByRole('button', { name: 'Marca com a llegit el resultat' }).disabled).toBe(true);
    /* Les cinc que la cerca amaga continuen sense llegir. */
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '5']);
    expect(detall().getByText('6 notícies, 5 sense llegir. Obri’n una de la llista per a llegir-la.')).toBeTruthy();
    /* Tancar la cerca: el text i l'abast de sempre, la carpeta sencera. */
    fireEvent.click(mig().getByRole('button', { name: 'Tancar' }));
    expect(fitxes()).toHaveLength(6);
    const tot = detall().getByRole('button', { name: 'Marca-ho tot com a llegit' });
    expect(tot.disabled).toBe(false);
    fireEvent.click(tot);
    await waitFor(() => expect(desat(idb)?.llegits).toHaveLength(6));
  });

  test('amb diversos resultats, el nom en diu el nombre i només es marquen eixos', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const delPregoner = (await llavor.llistaArticles({ fontId: 'pregoner' })).map((article) => article.id);
    expect(delPregoner).toHaveLength(3);
    const { idb } = munta('/app/lector/noticies/ajuntament');
    await screen.findByRole('region', { name: 'Ajuntament i serveis' });
    expect(fitxes()).toHaveLength(7);
    /* El nom de la font és dins del text de cerca de cada fila (searchText). */
    cerca('pregoner');
    expect(fitxes()).toHaveLength(3);
    fireEvent.click(detall().getByRole('button', { name: 'Marca com a llegits els 3 resultats' }));
    await waitFor(() => expect([...(desat(idb)?.llegits || [])].sort()).toEqual([...delPregoner].sort()));
    expect(vistaDe(filaDeLArbre('Ajuntament i serveis'))).toEqual(['Ajuntament i serveis', '4']);
    /* Una cerca sense cap resultat: res a marcar, i el botó ho diu. */
    fireEvent.change(mig().getByRole('searchbox', { name: 'Cercar notícies' }), { target: { value: 'cap notícia diu açò' } });
    expect(fitxes()).toHaveLength(0);
    expect(detall().getByRole('button', { name: 'Cap resultat per a marcar' }).disabled).toBe(true);
  });
});

/* Encàrrec F del Gauntlet (261016, P2) · La Llei de la Roda Dentada (261007): amb la carpeta de
   la URL amagada a «Carpetes a la vista», l'espai la mostra des del seu «Tot» i no canvia la URL
   (UniversalWorkspace.jsx, seleccioALaVista). El detall sense notícia es feia amb la carpeta de la
   URL: «Hui · 6 notícies» al costat d'una llista de 16, i «Marca-ho tot com a llegit» en deixava
   10 de visibles sense llegir. És la classe de defecte de l'L1-2 (el botó no actua sobre el que
   es veu), per un camí sense cerca. Ara el títol, el resum i el botó són de la llista que es veu. */
describe('amb la carpeta de la URL amagada a la roda dentada', () => {
  const amaga = (...ids) => {
    setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { lector: Object.fromEntries(ids.map((id) => [id, false])) } });
    _reiniciaCarpetesVisibles();
  };

  afterEach(() => {
    delVal(CLAU_CARPETES_VISIBLES);
    _reiniciaCarpetesVisibles();
  });

  test('«Hui» amagat i l’entrada per defecte: la llista, el detall i «Marca-ho tot» són de «Totes»', async () => {
    amaga(opcioDeCarpeta('hui'));
    const { idb } = munta('/app/lector/noticies');
    await waitFor(() => expect(fitxes()).toHaveLength(16));
    expect(arbre().queryByRole('button', { name: /^Hui\b/ })).toBeNull();
    expect(esquerra().getByRole('button', { name: 'Totes' }).getAttribute('aria-pressed')).toBe('true');
    expect(ubicacio()).toBe('/app/lector/noticies');
    expect(screen.queryByRole('region', { name: 'Totes' })).not.toBeNull();
    expect(screen.queryByRole('region', { name: 'Hui' })).toBeNull();
    expect(detall().getByText('16 notícies, 16 sense llegir. Obri’n una de la llista per a llegir-la.')).toBeTruthy();
    fireEvent.click(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }));
    await waitFor(() => expect(desat(idb)?.llegits).toHaveLength(16));
    expect(fitxes().every((boto) => !boto.textContent.endsWith('Nou'))).toBe(true);
    expect(detall().getByText('16 notícies, totes llegides. Obri’n una de la llista per a llegir-la.')).toBeTruthy();
  });

  test('la font d’una categoria amagada (l’enllaç de la barra taronja): el detall és de «Totes», no de la font', async () => {
    amaga(opcioDeCarpeta('festes'));
    const { idb } = munta('/app/lector/noticies/festes/colla-dimonis');
    await waitFor(() => expect(fitxes()).toHaveLength(16));
    expect(ubicacio()).toBe('/app/lector/noticies/festes/colla-dimonis');
    expect(screen.queryByRole('region', { name: 'Totes' })).not.toBeNull();
    expect(detall().getByText('16 notícies, 16 sense llegir. Obri’n una de la llista per a llegir-la.')).toBeTruthy();
    fireEvent.click(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }));
    await waitFor(() => expect(desat(idb)?.llegits).toHaveLength(16));
  });
});

/* E1 del Gauntlet (261016, IDs I01 parcial i b0_lector.5) · La navegació ràpida de Feedly
   (docs.feedly.com, «Keyboard shortcuts»): J/K obrin la notícia següent o l'anterior de la llista
   que es veu, N/P hi mouen el focus sense obrir-la, O obri o tanca, M commuta llegida, S «Per a
   després», V l'original en una pestanya nova, Maj+A marca la llista que es veu (amb una cerca,
   els resultats) i Maj+J/Maj+K canvien de carpeta. WCAG 2.1.4: només amb el focus dins de la
   closca, mai en un camp de text ni amb un diàleg o un panell per damunt, i mai amb Ctrl, ⌘ o Alt.
   `fireEvent.keyDown` torna false quan la drecera atén la tecla (preventDefault). */
describe('les dreceres de teclat a la manera de Feedly (E1, 261016)', () => {
  const prem = (node, key, extra = {}) => fireEvent.keyDown(node, { key, ...extra });
  const cerca = (text) => {
    fireEvent.click(mig().getByRole('button', { name: 'Cercar notícies' }));
    fireEvent.change(mig().getByRole('searchbox', { name: 'Cercar notícies' }), { target: { value: text } });
  };

  test('accioDeTecla: les lletres de Feedly, Maj només per a A, J i K; cap modificador, composició ni repetició d’una acció', () => {
    const tecla = (key, extra = {}) => accioDeTecla({ key, ...extra });
    expect(['j', 'k', 'n', 'p', 'o', 'm', 's', 'v'].map((key) => tecla(key)))
      .toEqual(['seguent', 'anterior', 'tria-seguent', 'tria-anterior', 'obri', 'llegit', 'despres', 'original']);
    expect(['A', 'J', 'K'].map((key) => tecla(key, { shiftKey: true }))).toEqual(['tot-llegit', 'carpeta-seguent', 'carpeta-anterior']);
    /* El bloqueig de majúscules no canvia la lletra. */
    expect(tecla('J')).toBe('seguent');
    for (const modificador of ['ctrlKey', 'metaKey', 'altKey']) expect(tecla('j', { [modificador]: true }), modificador).toBeNull();
    expect(tecla('j', { defaultPrevented: true })).toBeNull();
    expect(tecla('j', { isComposing: true })).toBeNull();
    expect(tecla('S', { shiftKey: true })).toBeNull();
    for (const key of ['a', 'x', 'Enter', 'ArrowDown', ' ', '?', '', undefined]) expect(tecla(key), String(key)).toBeNull();
    /* Mantenir premuda una tecla repetix el moviment, mai una acció. */
    expect(tecla('j', { repeat: true })).toBe('seguent');
    expect(tecla('J', { repeat: true, shiftKey: true })).toBe('carpeta-seguent');
    for (const key of ['v', 'o', 'm', 's']) expect(tecla(key, { repeat: true }), key).toBeNull();
    expect(tecla('A', { repeat: true, shiftKey: true })).toBeNull();
    expect(accioDeTecla(null)).toBeNull();
  });

  test('ordreDeLArbre: cada arrel i, darrere, les seues filles, en l’ordre de l’arbre', () => {
    expect(ordreDeLArbre([
      { id: 'font:radio', order: 6, parentId: null },
      { id: 'carpeta:hui', order: 0 },
      { id: 'font:b', order: 5, parentId: 'carpeta:x' },
      { id: 'carpeta:x', order: 2, parentId: null },
      { id: 'font:a', order: 4, parentId: 'carpeta:x' },
      { id: 'carpeta:y', order: 3 }
    ])).toEqual(['carpeta:hui', 'carpeta:x', 'font:a', 'font:b', 'carpeta:y', 'font:radio']);
    expect(ordreDeLArbre(null)).toEqual([]);
  });

  test('J obri la primera i després la següent, K l’anterior: push, la lectura al detall i el focus a l’H1', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const titols = titolsDeLaLlista();
    expect(titols).toHaveLength(6);
    const hui = filaDeLArbre('Hui');
    hui.focus();
    const abans = window.history.length;
    expect(prem(hui, 'j')).toBe(false);
    let h1 = await titolDelLector(titols[0]);
    expect(window.history.length).toBe(abans + 1);
    expect(ubicacio()).toMatch(/^\/app\/lector\/noticies\/hui\?article=/);
    expect(document.activeElement).toBe(h1);
    /* Obrir-la la llig, com un clic. */
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '5']);
    prem(h1, 'j');
    h1 = await titolDelLector(titols[1]);
    expect(window.history.length).toBe(abans + 2);
    expect(fitxa(titols[1]).getAttribute('aria-current')).toBe('true');
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '4']);
    prem(h1, 'k');
    h1 = await titolDelLector(titols[0]);
    expect(window.history.length).toBe(abans + 3);
    /* K a la primera: res, i la tecla no s'atén. */
    const oberta = ubicacio();
    expect(prem(h1, 'k')).toBe(true);
    expect(ubicacio()).toBe(oberta);
    expect(window.history.length).toBe(abans + 3);
  });

  test('N/P mouen el focus per la llista sense obrir res; O obri la fila del focus i, oberta, la tanca', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    expect(titolsDeLaLlista()).toEqual([CORREFOC, ASSAIG, 'Gràcies per les festes de Sant Miquel']);
    const festes = filaDeLArbre('Cultura i festes');
    festes.focus();
    expect(prem(festes, 'n')).toBe(false);
    expect(document.activeElement).toBe(fitxa(CORREFOC));
    prem(document.activeElement, 'n');
    expect(document.activeElement).toBe(fitxa(ASSAIG));
    prem(document.activeElement, 'p');
    expect(document.activeElement).toBe(fitxa(CORREFOC));
    /* P a la primera: res. */
    expect(prem(document.activeElement, 'p')).toBe(true);
    expect(document.activeElement).toBe(fitxa(CORREFOC));
    /* Triar no obri ni llig res. */
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', '3']);
    prem(document.activeElement, 'n');
    expect(prem(document.activeElement, 'o')).toBe(false);
    const h1 = await titolDelLector(ASSAIG);
    expect(ubicacio()).toMatch(/^\/app\/lector\/noticies\/festes\?article=/);
    prem(h1, 'o');
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(document.activeElement).toBe(fitxa(ASSAIG)));
    /* Sense notícia oberta i sense fila al focus, O no fa res. */
    expect(prem(festes, 'o')).toBe(true);
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
  });

  test('M commuta llegida i S «Per a després», a la fila del focus i a la notícia oberta', async () => {
    const { idb } = munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    const correfoc = fitxa(CORREFOC);
    correfoc.focus();
    expect(prem(correfoc, 'm')).toBe(false);
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', '2']);
    expect(fitxa(CORREFOC).querySelector('.sdp-gestor-fitxa__subtitol').textContent).not.toMatch(/Nou$/);
    prem(fitxa(CORREFOC), 'm');
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', '3']);
    /* Desada i sense llegir: «Per a després» la compta. Res no s'ha obert. */
    expect(prem(fitxa(CORREFOC), 's')).toBe(false);
    expect(vistaDe(filaDeLArbre('Per a després'))).toEqual(['Per a després', '1']);
    await waitFor(() => expect(desat(idb)?.despres).toHaveLength(1));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    /* La notícia oberta: les mateixes accions que els botons de la seua capçalera. */
    prem(fitxa(CORREFOC), 'o');
    const h1 = await titolDelLector(CORREFOC);
    const desa = () => detall().getByRole('button', { name: 'Desa per a després' });
    expect(desa().getAttribute('aria-pressed')).toBe('true');
    prem(h1, 's');
    expect(desa().getAttribute('aria-pressed')).toBe('false');
    await waitFor(() => expect(desat(idb)?.despres).toEqual([]));
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', '2']);
    prem(h1, 'm');
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', '3']);
    expect(ubicacio()).toMatch(/[?&]article=/);
  });

  test('S a «Per a després» lleva la fila del focus i el focus passa a la veïna', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [correfoc, assaig] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    const entorn = prepara();
    await entorn.magatzem.desa({ llegits: [], despres: [correfoc, assaig], noSeguides: [] });
    munta('/app/lector/noticies/despres', entorn);
    await screen.findByRole('region', { name: 'Per a després' });
    await waitFor(() => expect(fitxes()).toHaveLength(2));
    const [primera, segona] = fitxes();
    const titolSegona = segona.querySelector('.sdp-gestor-fitxa__titol').textContent;
    primera.focus();
    expect(prem(primera, 's')).toBe(false);
    await waitFor(() => expect(fitxes()).toHaveLength(1));
    expect(titolsDeLaLlista()).toEqual([titolSegona]);
    await waitFor(() => expect(document.activeElement).toBe(fitxa(titolSegona)));
  });

  test('V obri l’original en una pestanya nova (noopener): una sola volta, mai amb un modificador', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [correfoc] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    expect(new URL(correfoc.enllac).hostname).toBe('example.org');
    const obertes = [];
    vi.spyOn(window, 'open').mockImplementation((...args) => { obertes.push(args); return null; });
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    const fila = fitxa(CORREFOC);
    fila.focus();
    expect(prem(fila, 'v')).toBe(false);
    expect(obertes).toEqual([[correfoc.enllac, '_blank', 'noopener,noreferrer']]);
    /* Mantenir-la premuda no obri pestanyes de més; amb ⌘, Ctrl o Alt és del navegador. */
    expect(prem(fila, 'v', { repeat: true })).toBe(true);
    for (const modificador of ['metaKey', 'ctrlKey', 'altKey']) expect(prem(fila, 'v', { [modificador]: true }), modificador).toBe(true);
    expect(obertes).toHaveLength(1);
    /* No l'obri dins de l'app ni la marca com a llegida. */
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    expect(vistaDe(filaDeLArbre('Cultura i festes'))).toEqual(['Cultura i festes', '3']);
  });

  test('Maj+A marca la llista que es veu: amb una cerca, només els resultats; des de la caixa de la cerca, res', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [correfoc] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    cerca('correfoc');
    expect(titolsDeLaLlista()).toEqual([CORREFOC]);
    /* Escriure a la caixa de la cerca és escriure: cap drecera. */
    const caixa = mig().getByRole('searchbox', { name: 'Cercar notícies' });
    caixa.focus();
    expect(prem(caixa, 'A', { shiftKey: true })).toBe(true);
    expect(prem(caixa, 'j')).toBe(true);
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '6']);
    fitxa(CORREFOC).focus();
    expect(prem(fitxa(CORREFOC), 'A', { shiftKey: true })).toBe(false);
    await waitFor(() => expect(desat(idb)?.llegits).toEqual([correfoc.id]));
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '5']);
    /* Sense cerca, la carpeta sencera, com el botó. */
    fireEvent.click(mig().getByRole('button', { name: 'Tancar' }));
    expect(fitxes()).toHaveLength(6);
    fitxes()[1].focus();
    prem(fitxes()[1], 'A', { shiftKey: true });
    await waitFor(() => expect(desat(idb)?.llegits).toHaveLength(6));
    expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', null]);
    /* Ja no en queda cap: la tecla no s'atén. */
    expect(prem(fitxes()[1], 'A', { shiftKey: true })).toBe(true);
  });

  test('Maj+J/Maj+K: la carpeta següent o l’anterior de l’arbre (push), amb el focus a l’arbre si la fila se’n va', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const abans = window.history.length;
    fitxa(CORREFOC).focus();
    expect(prem(fitxa(CORREFOC), 'J', { shiftKey: true })).toBe(false);
    await screen.findByRole('region', { name: 'Per a després' });
    expect(ubicacio()).toBe('/app/lector/noticies/despres');
    expect(window.history.length).toBe(abans + 1);
    /* La fila del focus ja no hi és: el focus va a la carpeta nova, a l'arbre. */
    await waitFor(() => expect(document.activeElement).toBe(filaDeLArbre('Per a després')));
    const passos = ['/app/lector/noticies/ajuntament', '/app/lector/noticies/ajuntament/veu-placa', '/app/lector/noticies/ajuntament/pregoner',
      '/app/lector/noticies/festes'];
    for (const cami of passos) {
      prem(document.activeElement, 'J', { shiftKey: true });
      await waitFor(() => expect(ubicacio()).toBe(cami));
    }
    /* Cap notícia s'obri en canviar de carpeta. */
    expect(ubicacio()).not.toMatch(/article=/);
    prem(document.activeElement, 'K', { shiftKey: true });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/ajuntament/pregoner'));
    /* J, després de canviar de carpeta, obri la primera de la carpeta nova. */
    expect(closca().contains(document.activeElement)).toBe(true);
    prem(document.activeElement, 'j');
    await waitFor(() => expect(ubicacio()).toMatch(/^\/app\/lector\/noticies\/ajuntament\/pregoner\?article=/));
  });

  test('Maj+K a «Hui» no fa res; des de «Totes», Maj+J va a «Hui» i Maj+K no fa res', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const hui = filaDeLArbre('Hui');
    hui.focus();
    expect(prem(hui, 'K', { shiftKey: true })).toBe(true);
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    const totes = esquerra().getByRole('button', { name: 'Totes' });
    fireEvent.click(totes);
    await screen.findByRole('region', { name: 'Totes' });
    totes.focus();
    expect(prem(totes, 'K', { shiftKey: true })).toBe(true);
    expect(ubicacio()).toBe('/app/lector/noticies/totes');
    prem(totes, 'J', { shiftKey: true });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/hui'));
  });

  test('WCAG 2.1.4: res amb el focus fora de la closca (l’amfitrió o perdut), en un camp, amb un diàleg obert o amb la tecla ja atesa', async () => {
    const campDeLAmfitrio = document.createElement('input');
    document.body.append(campDeLAmfitrio);
    const propi = document.createElement('div');
    propi.setAttribute('role', 'dialog');
    propi.setAttribute('aria-modal', 'true');
    const atesa = (event) => { if (event.key === 'j') event.preventDefault(); };
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      const intacta = () => {
        expect(ubicacio()).toBe('/app/lector/noticies/hui');
        expect(vistaDe(filaDeLArbre('Hui'))).toEqual(['Hui', '6']);
      };
      /* L'amfitrió: el focus és seu. */
      campDeLAmfitrio.focus();
      for (const key of ['j', 'n', 'm', 's', 'o']) expect(prem(campDeLAmfitrio, key), key).toBe(true);
      expect(prem(campDeLAmfitrio, 'A', { shiftKey: true })).toBe(true);
      expect(document.activeElement).toBe(campDeLAmfitrio);
      intacta();
      /* El focus perdut (el body) no és el del Lector. */
      campDeLAmfitrio.blur();
      expect(prem(document.body, 'j')).toBe(true);
      intacta();
      /* Un camp de text i un element editable dins de la closca. */
      const camp = document.createElement('input');
      const editable = document.createElement('div');
      editable.setAttribute('contenteditable', 'true');
      document.getElementById('app-grid-list').append(camp, editable);
      for (const node of [camp, editable]) expect(prem(node, 'j'), node.tagName).toBe(true);
      camp.remove();
      editable.remove();
      intacta();
      /* Un diàleg modal propi, dins de la closca. */
      document.getElementById('app-grid-list').append(propi);
      fitxa(CORREFOC).focus();
      expect(prem(fitxa(CORREFOC), 'j')).toBe(true);
      propi.remove();
      intacta();
      /* Una tecla que ja ha atès un altre (defaultPrevented) no es torna a atendre. */
      document.addEventListener('keydown', atesa, { capture: true });
      prem(fitxa(CORREFOC), 'j');
      intacta();
      document.removeEventListener('keydown', atesa, { capture: true });
      /* Sense res d'això, la mateixa tecla obri la notícia següent. */
      expect(prem(fitxa(CORREFOC), 'j')).toBe(false);
      await waitFor(() => expect(ubicacio()).toMatch(/[?&]article=/));
    } finally {
      document.removeEventListener('keydown', atesa, { capture: true });
      campDeLAmfitrio.remove();
      propi.remove();
    }
  });

  test('en mitjana, amb el panell de la navegació obert per damunt, les dreceres callen', async () => {
    ambAmplada(800);
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    /* El panell tancat: valen. */
    fitxa(CORREFOC).focus();
    expect(prem(fitxa(CORREFOC), 'n')).toBe(false);
    expect(document.activeElement).toBe(fitxa(ASSAIG));
    fireEvent.click(document.querySelector('#app-grid-sidebar button[aria-controls="app-grid-sidebar"]'));
    await waitFor(() => expect(closca().dataset.panell).toBe('left'));
    const esports = filaDeLArbre('Esports');
    esports.focus();
    expect(prem(esports, 'j')).toBe(true);
    expect(prem(esports, 'J', { shiftKey: true })).toBe(true);
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
  });
});

describe('els estats del port', () => {
  test('carregant: la llista i el detall ho diuen', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    munta('/app/lector/noticies/hui', prepara({ adaptador: { ...llavor, llistaArticles: () => new Promise(() => {}) } }));
    await screen.findAllByText('Carregant les notícies…');
    expect(mig().getByRole('status').textContent).toBe('Carregant les notícies…');
    expect(detall().getByRole('status').textContent).toBe('Carregant les notícies…');
  });

  test('error: ho diu i «Reintentar» torna a demanar-ho', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    let falla = true;
    const adaptador = { ...llavor, llistaFonts: () => (falla ? Promise.reject(new Error('caigut')) : llavor.llistaFonts()) };
    munta('/app/lector/noticies/hui', prepara({ adaptador }));
    await screen.findAllByText('No s’han pogut carregar les notícies.');
    expect(mig().getByRole('alert').textContent).toBe('No s’han pogut carregar les notícies.Reintentar');
    expect(detall().getByRole('alert').textContent).toBe('No s’han pogut carregar les notícies.');
    falla = false;
    fireEvent.click(mig().getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(fitxes()).toHaveLength(6));
  });

  test('sense base local, l’avís de memòria, dins del detall', async () => {
    munta('/app/lector/noticies/hui', prepara({ sensebase: true }));
    await screen.findByRole('region', { name: 'Hui' });
    expect(detall().getByText('Només en la memòria')).toBeTruthy();
  });
});

describe('en mitjana (800 px): la navegació en rail i la llista al costat', () => {
  beforeEach(() => { ambAmplada(800); });

  test('el rail de l’arbre porta els recomptes al nom; desplegar-lo i triar una carpeta navega i el tanca', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    const rail = within(document.getElementById('app-grid-sidebar').querySelector('nav.sdp-workspace-rail'));
    expect(rail.getByRole('button', { name: 'Hui 6 sense llegir' }).getAttribute('title')).toBe('Hui 6 sense llegir');
    fireEvent.click(rail.getByRole('button', { name: 'Esports 3 sense llegir' }));
    expect(ubicacio()).toBe('/app/lector/noticies/esports');
    await screen.findByRole('region', { name: 'Esports' });
    expect(fitxes()).toHaveLength(3);
  });
});

describe('en estret (375 px): el mestre-detall de l’espai', () => {
  beforeEach(() => { ambAmplada(375); });

  test('primer l’arbre; una carpeta porta a la llista; una notícia, a la lectura; tancar-la torna a la llista', async () => {
    munta('/app/lector/noticies');
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    await waitFor(() => expect(closca().dataset.panell).toBe('left'));
    fireEvent.click(filaDeLArbre('Cultura i festes'));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    fireEvent.click(detall().getByRole('button', { name: 'Tornar arrere' }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
  });

  /* Encàrrec F del Gauntlet (261016, P2) · L'Arrere del sistema (el d'Android, history.back) lleva
     ?article= sense passar per l'aspa, «Tornar» ni Esc, i la closca només aplica el panell
     d'eixida en muntar: es quedava al detall buit («Tria una notícia») en lloc de la llista, com
     fan les apps de missatgeria i els lectors de notícies. Ara tornar de la notícia a la llista obri el panell de la llista sempre,
     i el focus va a la fila quan el panell ja és obert. Com el navegador, el doble de focus() no
     enfoca res dins d'una columna tancada (inert), que jsdom no aplica. */
  test('l’Arrere del sistema després de llegir una notícia torna a la llista, amb el focus a la seua fila', async () => {
    const focusDeVeres = HTMLElement.prototype.focus;
    const dinsDInert = [];
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function focus(...args) {
      if (this.closest('[inert]')) {
        dinsDInert.push(this);
        return undefined;
      }
      return focusDeVeres.apply(this, args);
    });
    munta('/app/lector/noticies');
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    await waitFor(() => expect(closca().dataset.panell).toBe('left'));
    fireEvent.click(filaDeLArbre('Cultura i festes'));
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    dinsDInert.length = 0;
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/festes'));
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    expect(document.getElementById('app-grid-list').hasAttribute('inert')).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(fitxa(CORREFOC)));
    expect(dinsDInert).not.toContain(fitxa(CORREFOC));
    /* L'aspa, com sempre: la llista i el focus a la fila, en el mateix pas. */
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    await waitFor(() => expect(document.activeElement).toBe(fitxa(CORREFOC)));
  });

  test('un enllaç profund a una notícia obri primer la lectura', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    munta(`/app/lector/noticies/festes?article=${primer.id}`);
    await titolDelLector(CORREFOC);
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(closca().dataset.panell).toBe('');
  });
});

/* T5 (P1-07, 261024) · Les fonts territorials (fontRemota.js) que no responen, amb un servei fals
   que servix els feeds de la llavor. Si no respon cap de les que se seguixen, el detall ho diu
   (FontsSenseResposta.jsx: per què, «Torna-ho a provar» i les portes a la resta del poble) i la
   llista també; si en cauen algunes, la resta es veu i el detall avisa (AvisFonts). Sense xarxa al
   dispositiu, el motiu és sempre la connexió, i quan torna es tornen a demanar soles. L'error del
   port (status 'error'), el de sempre: «els estats del port», més amunt, no es toca. */
describe('les fonts callades', () => {
  const CATALEG = Object.freeze({
    categories: CATEGORIES_LLAVOR,
    fonts: FONTS_LLAVOR.map(({ id, nom, categoriaId, descripcio }) => ({ id, nom, categoriaId, descripcio, lloc: null }))
  });
  const XML = Object.fromEntries(FONTS_LLAVOR.map((font) => [font.id, font.xml]));
  const PORTES = Object.freeze([['Passa pel Mur', '/mur'], ['Mira l’Agenda', '/calendari'], ['Fes una volta pel Mercat', '/mercat'],
    ['Coneix els pobles', '/pobles']]);
  /* `motiuDe(id)`: per què no respon la font, o null si respon. Es pot canviar enmig de la prova. */
  function remot(motiuDe, opcions = {}) {
    const servei = {
      fonts: async () => CATALEG,
      feed: vi.fn(async (id) => {
        const motiu = motiuDe(id);
        if (motiu) throw Object.assign(new Error('caiguda'), { motiu });
        return { font: id, xml: XML[id], obtingut: null, obsoleta: false };
      })
    };
    return { servei, entorn: prepara({ adaptador: creaAdaptadorRemot({ servei, ...opcions }) }) };
  }
  /* navigator.onLine és un getter del prototip: es tapa a la instància (sessioApp.test.jsx). */
  const posaEnLinia = (valor) => act(() => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => valor });
    window.dispatchEvent(new Event(valor ? 'online' : 'offline'));
  });
  afterEach(() => {
    delete window.navigator.onLine;
  });

  test('si no respon cap: el motiu, les quatre portes al poble i «Torna-ho a provar», que les torna a demanar', async () => {
    let motiu = 'temps';
    const { servei, entorn } = remot(() => motiu);
    munta('/app/lector/noticies/festes', entorn);
    await screen.findByText('Ara mateix no arriben les notícies');
    expect(detall().getByText('Les fonts han tardat massa a contestar. Pot ser la cobertura o que la seua web va carregada.')).toBeTruthy();
    expect(detall().getByText('Mentrestant, el poble no s’atura:')).toBeTruthy();
    const portes = PORTES.map(([nom]) => detall().getByRole('link', { name: nom }));
    expect(portes.map((porta) => porta.getAttribute('href'))).toEqual(PORTES.map(([, cami]) => cami));
    expect(portes.every((porta) => porta.className === 'sdp-boto sdp-boto--secundari')).toBe(true);
    expect(detall().queryByText('Alguna font no ha contestat')).toBeNull();
    expect(detall().queryByText(/desat per a després/)).toBeNull();
    /* La llista, buida, ho diu; l'arbre i la carpeta continuen allí. */
    expect(fitxes()).toHaveLength(0);
    expect(mig().getByText('Les fonts no responen ara mateix.')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Cultura i festes' })).toBeTruthy();
    motiu = null;
    const abans = servei.feed.mock.calls.length;
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    await waitFor(() => expect(fitxes()).toHaveLength(3));
    expect(servei.feed.mock.calls.length - abans).toBe(FONTS_LLAVOR.length);
    expect(detall().queryByText('Ara mateix no arriben les notícies')).toBeNull();
    expect(mig().queryByText('Les fonts no responen ara mateix.')).toBeNull();
  });

  /* Actualitzada a posta (261024 Lector): Gemini G2-02.1, sense «del poble» quan es parla del servei.
     I els dos motius nous de la interfície amb el servei: una adreça que el servei no llig (no s'ha
     demanat res: correcció R5-08, mai «les fonts han enviat») i les teues quan el servei les té apagades. */
  test.each([
    ['servidor', 'El servei de notícies no respon. Pot ser cosa d’un moment.'],
    ['adreca', 'El servei de notícies no llig estes adreces (no són públiques o no són segures), i no ha demanat res a cap web.'],
    ['personals-off', 'Les fonts teues queden guardades en este dispositiu. El servei de notícies encara no les llig: les llegirà quan el servei les active.'],
    ['font', 'Les fonts han enviat una cosa que no sabem llegir com a notícies.'],
    ['limit', 'Hem demanat les notícies massa vegades seguides. Espera un moment i torna-ho a provar.'],
    ['sense-connexio', 'Sembla que este dispositiu no té connexió. Quan torne, les notícies arribaran soles.']
  ])('el motiu %s, en paraules de la gent', async (motiu, text) => {
    munta('/app/lector/noticies/esports', remot(() => motiu).entorn);
    await screen.findByText('Ara mateix no arriben les notícies');
    expect(detall().getByText(text)).toBeTruthy();
  });

  test('si en cauen algunes: la resta es veu i el detall diu quines, amb «Torna-ho a provar»', async () => {
    let caigudes = new Set(['pregoner', 'cooperativa']);
    const { entorn } = remot((id) => (caigudes.has(id) ? 'servidor' : null));
    munta('/app/lector/noticies/festes', entorn);
    await waitFor(() => expect(fitxes()).toHaveLength(3));
    const avis = await screen.findByText('Alguna font no ha contestat');
    expect(avis.closest('[role="status"]').textContent).toContain(
      'El Pregoner del Carrer Major i Cooperativa de l’Horta Vella no han respost ara mateix. La resta de notícies estan al dia.'
    );
    expect(detall().queryByText('Ara mateix no arriben les notícies')).toBeNull();
    caigudes = new Set(['pregoner']);
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    await waitFor(() => expect(detall().getByText(/^El Pregoner del Carrer Major no ha respost ara mateix\./)).toBeTruthy());
    caigudes = new Set();
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    await waitFor(() => expect(detall().queryByText('Alguna font no ha contestat')).toBeNull());
  });

  test('n’hi ha prou que en responga una: és l’avís, no el detall de les callades, també en una carpeta buida', async () => {
    const { entorn } = remot((id) => (id === 'club-pilota' ? null : 'temps'));
    munta('/app/lector/noticies/festes', entorn);
    /* Cultura i festes es queda buida (la Colla no respon), però el Club de Pilota sí: és l'avís. */
    await screen.findByText('Alguna font no ha contestat');
    expect(detall().queryByText('Ara mateix no arriben les notícies')).toBeNull();
    expect(detall().getByText('No hi ha cap notícia ací')).toBeTruthy();
    expect(mig().getByText('No hi ha cap notícia ací.')).toBeTruthy();
  });

  test('sense xarxa al dispositiu, el motiu és la connexió; quan torna, les notícies es tornen a demanar soles', async () => {
    let sensexarxa = true;
    const { servei, entorn } = remot(() => (sensexarxa ? 'servidor' : null));
    posaEnLinia(false);
    munta('/app/lector/noticies/festes', entorn);
    await screen.findByText('Sembla que este dispositiu no té connexió. Quan torne, les notícies arribaran soles.');
    const abans = servei.feed.mock.calls.length;
    sensexarxa = false;
    posaEnLinia(true);
    await waitFor(() => expect(fitxes()).toHaveLength(3));
    expect(servei.feed.mock.calls.length - abans).toBe(FONTS_LLAVOR.length);
    /* Una sola volta: tornar a tindre xarxa no fa cap bucle. */
    await act(async () => {});
    expect(servei.feed.mock.calls.length - abans).toBe(FONTS_LLAVOR.length);
  });

  test('les desades continuen a «Per a després», i el detall de les callades ho diu', async () => {
    let caigudes = new Set(['pregoner']);
    /* Sense memòria (ttlMs 0): la segona ronda torna a demanar-les totes, i totes cauen. */
    const { entorn } = remot((id) => (caigudes.has(id) ? 'temps' : null), { ttlMs: 0 });
    munta('/app/lector/noticies/festes', entorn);
    await waitFor(() => expect(fitxes()).toHaveLength(3));
    fireEvent.click(fitxa(CORREFOC));
    await titolDelLector(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Desa per a després' }));
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    await screen.findByText('Alguna font no ha contestat');
    caigudes = new Set(FONTS_LLAVOR.map((font) => font.id));
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    /* «Cultura i festes» encara porta la desada: es veu com sempre. */
    await waitFor(() => expect(titolsDeLaLlista()).toEqual([CORREFOC]));
    fireEvent.click(filaDeLArbre('Esports'));
    await screen.findByRole('region', { name: 'Esports' });
    expect(detall().getByText('Ara mateix no arriben les notícies')).toBeTruthy();
    expect(detall().getByText(/^Les notícies que has desat per a després continuen ací\./)).toBeTruthy();
    const obri = detall().getByRole('link', { name: 'Obri-les' });
    expect(obri.getAttribute('href')).toBe('/app/lector/noticies/despres');
    fireEvent.click(obri);
    await screen.findByRole('region', { name: 'Per a després' });
    expect(titolsDeLaLlista()).toEqual([CORREFOC]);
  });
});
