/* Notícies del Poble · l'app dins de la plataforma de veres (RutaApps →
   AppLector → ClosaAplicacio → AppGridShell), amb la llavor sintètica, un
   «ara» fix i el magatzem sobre el navegador fals de P2. Ample (1400 px) i
   estret (375 px). Totes les dades són inventades. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { validaTaulaDeClosa } from '../plataforma/index.js';
import { validaManifestApp } from '../plataforma/manifestApp.js';
import { ARA, munta, prepara, tancats } from './__fixtures__/muntaLector.jsx';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { NOM_BASE, STORE } from './magatzem.js';
import manifestLector from './manifest.js';
import { ICONES_CATEGORIA } from './nucli/index.js';
import { RUTES, esCarpeta, esFont } from './rutes.js';
import { NOMS_ICONES_CATEGORIA, iconaDeCategoria } from './vistes/icones.js';

const CORREFOC = 'El correfoc de les festes passarà pel barranc';
const ASSAIG = 'Assaig obert de tabals per a qui vulga provar';

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => within(document.getElementById(id));
const esquerra = () => columna('app-grid-sidebar');
const mig = () => columna('app-grid-list');
const detall = () => columna('app-grid-main');
const closca = () => document.querySelector('.app-grid-shell');
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
/* Ordre del Mestre, 261004 (prompt 261004_0515) · Cada notícia és una UniversalCard: l'element
   principal (el botó de tota la targeta) porta data-element, i el seu nom és el títol.
   Derogat per l'ordre del Mestre, 261004 (integració final, F05) · L'element principal ja no és
   un botó: és l'enllaç de veres al detall (?article=<id>), el que fa servir Compartir. */
const files = () => [...document.getElementById('app-grid-main').querySelectorAll('a.sp-card-link-overlay[data-element]')];
const fila = (titol) => detall().getByRole('link', { name: titol });
const targetaDe = (titol) => fila(titol).closest('article.sp-card');
/* El detall és la Pàgina Universal: l'H1 i l'article de la pàgina (el cos). */
const titolDelLector = (titol) => detall().findByRole('heading', { level: 1, name: titol });
const cosDelLector = () => document.getElementById('app-grid-main').querySelector('article.content-wrapper');
const desat = (idb) => idb.files(NOM_BASE, STORE)[0];
/* Ordre del Mestre, 261004 (auditoria 0605) · La descripció accessible de l'element principal
   (aria-describedby): l'estat de la notícia que les etiquetes diuen a la vista. */
const descripcioDe = (boto) => {
  const id = boto.getAttribute('aria-describedby');
  return id ? document.getElementById(id).textContent : null;
};
/* Les etiquetes d'estat que es veuen (no el text per al lector de pantalla, que també el diu). */
const ETIQUETA = Object.freeze({ selector: '.sp-card-label' });
/* Derogat per l'ordre del Mestre, 261004 (integració final, arreglo 6; arreglo del verificador,
   «front roig i verificació emmascarada») · Les carpetes i les fonts de navegació ja no són
   TargetesColleccions (ni la llista del Workspace de les 11:41, que hi colava la inicial: «HHui6»):
   són UniversalCard. L'enllaç de la targeta es diu com el títol i el comptador n'és la descripció;
   el que es veu és el títol i el subtítol. El text que comproven les proves és el mateix. */
const textDeNavegacio = (enllac) => {
  const targeta = enllac.closest('article.sp-card');
  const subtitol = targeta.querySelector('.sp-card-subtitle').textContent;
  expect(descripcioDe(enllac)).toBe(subtitol);
  return `${targeta.querySelector('.sp-card-title').textContent} ${subtitol}`;
};

/* Les classes que existixen: els fulls canònics, els de Pedra Seca i el de la closca. */
function classesConegudes() {
  const fulls = [
    ...readdirSync(path.join(process.cwd(), 'src/css')).filter((f) => f.endsWith('.css')).map((f) => `src/css/${f}`),
    'src/components/PedraSeca/pecesApps.css', 'src/components/PedraSeca/catalegColleccio.css', 'src/components/layout/AppGridShell.css'
  ];
  const text = fulls.map((f) => readFileSync(path.join(process.cwd(), f), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  return new Set([...text.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  ambAmplada(1400);
});

afterEach(() => {
  cleanup();
  while (tancats.length) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('el contracte amb la plataforma', () => {
  test('el manifest és vàlid i la taula de rutes passa validaTaulaDeClosa', () => {
    const { ok, errors, manifest } = validaManifestApp(manifestLector);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(validaTaulaDeClosa(RUTES, manifest)).toEqual({ ok: true, errors: [] });
    expect(new Set(RUTES.map((ruta) => ruta.path.split('/')[0]))).toEqual(new Set(manifest.entrades.map((e) => e.slug)));
  });

  test('les icones de categoria: la llista tancada del nucli i la de la UI són la mateixa', () => {
    expect([...NOMS_ICONES_CATEGORIA].sort()).toEqual([...ICONES_CATEGORIA].sort());
    expect(iconaDeCategoria('toString')).toBeUndefined();
    expect(iconaDeCategoria(null)).toBeUndefined();
  });

  test('la carpeta i la font del camí: ids opacs; cap tram literal', () => {
    for (const valor of ['hui', 'despres', 'festes', 'cat-1']) expect(esCarpeta(valor), valor).toBe(true);
    for (const valor of ['fonts', 'totes', 'colleccio', 'Festes', '..', '']) expect(esCarpeta(valor), valor).toBe(false);
    for (const valor of ['veu-placa', 'radio']) expect(esFont(valor), valor).toBe(true);
    for (const valor of ['fonts', 'totes', 'hui', 'despres', 'A']) expect(esFont(valor), valor).toBe(false);
  });
});

describe('en ample: carpetes, fonts i notícies de costat', () => {
  test('«Hui» per defecte: carpetes amb comptadors, fonts de totes les carpetes i les notícies per seccions', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    expect(closca().dataset.layout).toBe('ample');
    const hui = esquerra().getByRole('link', { name: /^Hui/ });
    expect(hui.getAttribute('aria-current')).toBe('true');
    expect(hui.getAttribute('href')).toBe('/app/lector/noticies/hui');
    expect(textDeNavegacio(hui)).toBe('Hui 6 sense llegir');
    expect(textDeNavegacio(esquerra().getByRole('link', { name: /^Per a després/ }))).toBe('Per a després 0 desades');
    expect(esquerra().getByRole('link', { name: /^Cultura i festes/ }).getAttribute('href')).toBe('/app/lector/noticies/festes');
    expect(mig().getByRole('link', { name: /^Totes les fonts/ }).getAttribute('aria-current')).toBe('true');
    expect(files()).toHaveLength(6);
    expect(detall().getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Ajuntament i serveis 3 notícies', 'Cultura i festes 1 notícia', 'Camp i temps 1 notícia', 'Esports 1 notícia'
    ]);
    /* En ample el mig es veu al costat: ni «Torna» a les carpetes ni les fonts i el ✓ repetits al detall. */
    expect(esquerra().queryByRole('button', { name: 'Torna' })).toBeNull();
    expect(detall().queryByRole('link', { name: 'Fonts' })).toBeNull();
    expect(detall().queryByRole('button', { name: 'Marca-ho tot com a llegit' })).toBeNull();
    expect(mig().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(false);
  });

  /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515) · La fila horitzontal de
     LlistaArticles (miniatura 16:9, «font · fragment», hora relativa) ja no és el Lector: cada
     notícia és una UniversalCard, amb l'anatomia de sempre i la data absoluta a la boina. */
  test('la targeta: UniversalCard amb la boina (la font i la data absoluta), el títol, el resum, «Nou», el peu i cap imatge de fora', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const targeta = targetaDe(CORREFOC);
    /* Boina dalt, l'element principal, el cos i el peu blau: res abans de la boina. */
    expect([...targeta.children].map((e) => e.className)).toEqual(['sp-card-header', 'sp-card-link-overlay', 'sp-card-body', 'sp-card-footer']);
    expect(fila(CORREFOC).getAttribute('aria-label')).toBe(CORREFOC);
    const boina = targeta.querySelector('header.sp-card-header');
    /* L'autoria és la font, i porta a les seues notícies. */
    const autor = within(boina).getByRole('link', { name: 'Colla de Dimonis de la Font Vella' });
    expect(autor.getAttribute('href')).toBe('/app/lector/noticies/festes/colla-dimonis');
    /* La data absoluta (hh:mm dd/mm/aa, al fus de qui llig), en text: una notícia no és al Calendari. */
    const data = boina.querySelector('time.btn-date-time');
    expect(data.getAttribute('datetime')).toBe('2026-10-03T09:30:00.000Z');
    expect([...data.children].map((e) => e.textContent)).toEqual(['11:30', '03/10/26']);
    expect(within(boina).queryByRole('button')).toBeNull();
    /* El títol (h4 dins de la secció h3), el resum i l'etiqueta «Nou».
       Ordre del Mestre, 261004 (integració final, F04) · I el subtítol (h4 de la targeta): la
       secció de la font i l'autor de l'article, dades reals de la llavor. */
    expect(within(targeta).getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual([CORREFOC, 'Cultura i festes · La colla']);
    expect(targeta.querySelector('.sp-card-subtitle').textContent).toBe('Cultura i festes · La colla');
    expect(targeta.querySelector('.sp-card-text').textContent).toMatch(/^Enguany el correfoc eixirà de la Font Vella/);
    expect(within(targeta).getByText('Nou', ETIQUETA).className).toBe('sp-card-label sdp-badge-accent');
    /* El nom de l'element principal és el títol; l'estat el diu la seua descripció (auditoria 0605). */
    expect(descripcioDe(fila(CORREFOC))).toBe('Nou');
    expect(document.getElementById(fila(CORREFOC).getAttribute('aria-describedby')).className).toBe('sdp-nomes-lector');
    /* El peu per defecte: les quatre accions, amb el títol al nom. */
    const peu = within(targeta.querySelector('footer.sp-card-footer'));
    for (const nom of [`Traduir ${CORREFOC}`, `Comentar ${CORREFOC}`, `Compartir ${CORREFOC}`, `Connectar amb ${CORREFOC}`]) {
      expect(peu.getByRole('button', { name: nom }), nom).toBeTruthy();
    }
    /* Les imatges de la llavor són d'example.org, que l'amfitrió no ha permés: cap imatge, ni a les
       targetes ni a la boina, i cap resta de la variant 16:9 ni de les files pròpies. */
    /* Derogat per l'ordre del Mestre, 261004 (integració final, arreglo 6) · Les carpetes porten la
       boina de l'app, amb el seu logo (un recurs propi del paquet). Cap imatge a les targetes de
       notícia ni cap imatge de fora enlloc. */
    expect(document.getElementById('app-grid-main').querySelectorAll('img')).toHaveLength(0);
    for (const img of document.querySelectorAll('img')) expect(img.getAttribute('src')).not.toMatch(/^(?:https?:)?\/\//);
    expect(document.querySelector('.sdp-panoramica, .sdp-llista-articles, .sdp-graella-articles, .sdp-rajola')).toBeNull();
    expect(files()).toHaveLength(6);
  });

  test('el Connectar de la targeta fa el de sempre però no compta a la telemetria; Comentar diu que no hi ha xat', async () => {
    const vistos = [];
    const escolta = (event) => vistos.push(event.detail);
    window.addEventListener('sdp:telemetria', escolta);
    /* La plataforma de proves no munta l'avisador: l'avís arriba al de reserva del context. */
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      fireEvent.click(within(targetaDe(CORREFOC)).getByRole('button', { name: `Comentar ${CORREFOC}` }));
      expect(avis).toHaveBeenCalledWith(expect.any(String), 'Ací no hi ha cap xat comú on comentar.');
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
      fireEvent.click(within(targetaDe(CORREFOC)).getByRole('button', { name: `Connectar amb ${CORREFOC}` }));
      /* El clic s'ha fet (Connectar porta on sempre) i cap intent «connectar» ha eixit. */
      expect(ubicacio()).toMatch(/^\/connectar\?/);
      expect(vistos.filter((intent) => intent?.nom === 'connectar')).toEqual([]);
    } finally {
      window.removeEventListener('sdp:telemetria', escolta);
    }
  });

  test('una categoria i una font: el camí, el títol del panell i les notícies', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(esquerra().getByRole('link', { name: /^Cultura i festes/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    expect(files()).toHaveLength(3);
    fireEvent.click(mig().getByRole('link', { name: /^Colla de Dimonis de la Font Vella/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes/colla-dimonis');
    await screen.findByRole('region', { name: 'Colla de Dimonis de la Font Vella' });
    expect(files()).toHaveLength(3);
  });

  /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515) · Ni rajoles ni files pròpies:
     «Targetes» és la UniversalCard de sempre en la graella de sempre, i «Revista», la targeta plana
     en columna. Sense seccions (una carpeta de categoria), el títol de la targeta és h3. */
  test('la vista «Targetes» (?vista=graella): UniversalCard en la graella; «Revista»: la targeta plana en columna', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    const graella = () => detall().getByRole('group', { name: 'Cultura i festes' });
    /* «Revista» per defecte: la columna de les targetes planes. */
    expect(graella().className).toBe('sdp-card-llista');
    expect([...graella().children].map((e) => e.className)).toEqual(['sp-card sp-card--pla', 'sp-card sp-card--pla', 'sp-card sp-card--pla']);
    fireEvent.click(detall().getByRole('button', { name: 'Targetes' }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes?vista=graella');
    expect(graella().className).toBe('sdp-card-grid');
    expect([...graella().children].map((e) => e.className)).toEqual(['sp-card', 'sp-card', 'sp-card']);
    expect(files()).toHaveLength(3);
    expect(within(graella()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toContain(CORREFOC);
    /* Cap element de llista fet a mà per a les targetes: només les etiquetes de cada una. */
    expect([...graella().querySelectorAll('ul')].every((ul) => ul.classList.contains('sp-card-labels'))).toBe(true);
  });

  test('una carpeta que no existix ho diu i porta a «Hui»', async () => {
    munta('/app/lector/noticies/inventada');
    expect(await screen.findByText('Esta carpeta no existix')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ves a Hui' }).getAttribute('href')).toBe('/app/lector/noticies/hui');
  });
});

describe('la lectura immersiva', () => {
  test('obrir una targeta: l’article ocupa el panell, les barres laterals es queden, el focus va al títol i queda llegida', async () => {
    const { idb } = munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.element;
    fireEvent.click(fila(CORREFOC));
    expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${id}`);
    const titol = await titolDelLector(CORREFOC);
    expect(document.activeElement).toBe(titol);
    expect(files()).toHaveLength(0);
    expect(document.getElementById('app-grid-sidebar').hasAttribute('inert')).toBe(false);
    expect(document.getElementById('app-grid-list').hasAttribute('inert')).toBe(false);
    expect(textDeNavegacio(esquerra().getByRole('link', { name: /^Hui/ }))).toBe('Hui 5 sense llegir');
    /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515; D-A) · El títol propi (h2 i
       p.lead dins de .sdp-centre) ja no hi és: la Pàgina Universal de les apps (PaginaApp), amb la
       doble barra, l'H1 dins de header.page-title i el cos a l'article de la pàgina. */
    const pagina = titol.closest('.sdp-universal-page-container');
    expect([...pagina.children].map((e) => e.className)).toEqual(['bar-blue', 'bar-orange', 'page-title', 'content-wrapper']);
    expect(titol.parentElement.matches('header.page-title')).toBe(true);
    expect(detall().getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('.sdp-centre, p.lead')).toBeNull();
    /* La boina: la font (porta a les seues notícies), l'autor de l'article i la data en text. */
    const boina = pagina.querySelector('section.bar-orange');
    expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Colla de Dimonis de la Font Vella');
    expect(boina.querySelector('.sp-card-author-location').textContent).toBe('La colla');
    expect(boina.querySelector('a.sp-card-author').getAttribute('href')).toBe('/app/lector/noticies/festes/colla-dimonis');
    const data = boina.querySelector('time.btn-date-time');
    expect(data.getAttribute('datetime')).toBe('2026-10-03T09:30:00.000Z');
    expect([...data.children].map((e) => e.textContent)).toEqual(['11:30', '03/10/26']);
    /* La barra blava de sempre: Tornar tanca l'article; Traduir, sense traductor. */
    expect([...pagina.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label')))
      .toEqual(['Tornar arrere', 'Índex de secció', 'Traduir', 'Comentar', 'Compartir', 'Connectar']);
    const lectura = cosDelLector();
    expect(within(lectura).getByRole('heading', { level: 3, name: 'Recomanacions' })).toBeTruthy();
    expect(within(lectura).getAllByRole('listitem')).toHaveLength(3);
    await waitFor(() => expect(desat(idb)?.llegits).toEqual([id]));
  });

  test('«Tornar arrere» de la barra blava tanca l’article com l’aspa, i el focus torna a la targeta', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.element;
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Tornar arrere' }));
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    await waitFor(() => expect(document.activeElement?.dataset.element).toBe(id));
  });

  test('l’aspa tanca: torna la graella, el focus a la targeta i la insígnia «Nou» ja no hi és', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.element;
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    const aspa = detall().getByRole('button', { name: 'Tanca l’article' });
    /* Com a Feedly: l'aspa a l'esquerra de la barra, davant del nom de la font. */
    const nomFont = detall().getByText('Colla de Dimonis de la Font Vella', { selector: '.app-grid-col-header__titol' });
    expect(aspa.compareDocumentPosition(nomFont) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(aspa);
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    await waitFor(() => expect(document.activeElement?.dataset.element).toBe(id));
    expect(within(fila(CORREFOC).closest('article')).queryByText('Nou')).toBeNull();
    /* Llegida i sense desar: cap estat a dir, cap descripció. */
    expect(fila(CORREFOC).hasAttribute('aria-describedby')).toBe(false);
  });

  test('Esc també tanca, i arrere del navegador torna a la mateixa graella', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    const id = fila(ASSAIG).dataset.element;
    fireEvent.click(fila(ASSAIG));
    const titol = await titolDelLector(ASSAIG);
    fireEvent.keyDown(titol, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(document.activeElement?.dataset.element).toBe(id));
    fireEvent.click(fila(ASSAIG));
    await titolDelLector(ASSAIG);
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(ubicacio()).toBe('/app/lector/noticies/festes'));
    await waitFor(() => expect(document.activeElement?.dataset.element).toBe(id));
  });

  test('Esc tanca des del mig i amb el focus perdut; no des d’un camp de text', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    /* Un camp de text dins de la closca: Esc és seu. */
    const camp = document.createElement('input');
    document.getElementById('app-grid-list').append(camp);
    fireEvent.keyDown(camp, { key: 'Escape' });
    camp.remove();
    expect(ubicacio()).toMatch(/[?&]article=/);
    /* Des de «Marca-ho tot com a llegit», al mig. */
    const marca = mig().getByRole('button', { name: 'Marca-ho tot com a llegit' });
    marca.focus();
    fireEvent.keyDown(marca, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
    /* Amb el focus perdut (un clic on no s'enfoca res). */
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
  });

  /* Ordre del Mestre, 261004 (auditoria 0605, «Esc amb l'Índex de secció obert tanca el calaix i
     també l'article») · L'Índex és un diàleg modal pintat amb un portal fora de la closca, i el
     focus es queda al botó que l'ha obert (o al body, a Safari). Esc tanca només el que està obert
     més amunt: l'Índex. El següent Esc, ja sense diàleg, tanca l'article. */
  test('Esc amb l’Índex de secció obert tanca només l’Índex; el següent Esc, l’article', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    const index = detall().getByRole('button', { name: 'Índex de secció' });
    index.focus();
    fireEvent.click(index);
    expect(screen.getByRole('dialog', { name: 'Taula de continguts' })).toBeTruthy();
    fireEvent.keyDown(index, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
    expect(ubicacio()).toMatch(/[?&]article=/);
    /* Amb el focus perdut (el body), tampoc. */
    fireEvent.click(index);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Taula de continguts' })).toBeNull();
    expect(ubicacio()).toMatch(/[?&]article=/);
    /* Sense cap diàleg obert, Esc tanca l'article com sempre. */
    fireEvent.keyDown(index, { key: 'Escape' });
    expect(ubicacio()).toBe('/app/lector/noticies/hui');
  });

  /* Verificació «lector-nevera», D2 · Encastat a WordPress, el document és de l'amfitrió. Un modal
     seu (un bàner de galetes amagat però present, un <dialog> obert sense ser modal, un modal fora
     de la closca) no és l'Índex i no pot bloquejar Esc per sempre. Un diàleg modal propi, dins de
     la closca, sí que el bloqueja; amagat, no. */
  test('Esc: un diàleg de l’amfitrió, fora de la closca, no el bloqueja; un de propi i visible, sí', async () => {
    /* Un element amb atributs, sense HTML cru (qualitat de la plataforma). */
    const element = (etiqueta, atributs = {}, ...fills) => {
      const node = document.createElement(etiqueta);
      for (const [nom, valor] of Object.entries(atributs)) node.setAttribute(nom, valor);
      node.append(...fills);
      return node;
    };
    const MODAL = { role: 'dialog', 'aria-modal': 'true' };
    const amfitrio = element('div', {},
      element('div', { hidden: '' }, element('div', MODAL, 'Galetes')),
      element('dialog', { open: '' }, 'Avís de l’amfitrió'),
      element('div', MODAL, 'Modal de l’amfitrió'));
    const propi = element('div', MODAL);
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      fireEvent.click(fila(CORREFOC));
      await titolDelLector(CORREFOC);
      /* Un diàleg modal propi, dins de la closca: Esc és seu, també amb el focus perdut. */
      document.getElementById('app-grid-list').append(propi);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(ubicacio()).toMatch(/[?&]article=/);
      /* El mateix diàleg, amagat: ja no compta. */
      propi.hidden = true;
      document.body.append(amfitrio);
      fireEvent.keyDown(await titolDelLector(CORREFOC), { key: 'Escape' });
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
      /* Amb els diàlegs de l'amfitrió al document i el focus perdut, Esc també tanca. */
      fireEvent.click(fila(CORREFOC));
      await titolDelLector(CORREFOC);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
    } finally {
      amfitrio.remove();
      propi.remove();
    }
  });

  /* Ordre del Mestre, 261004 (auditoria 0605, «?seccio= de l'Índex sobreviu al tancament de
     l'article») · La secció que hi escriu l'Índex és de l'article: tancar-lo l'esborra, i la notícia
     següent no l'hereta (ni per a compartir-la ni en recarregar). jsdom no fa scroll: es registra. */
  test('la secció de l’Índex (?seccio=) és de l’article: tancar-lo l’esborra i la notícia següent no l’hereta', async () => {
    const scrollAbans = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView() {};
    try {
      munta('/app/lector/noticies/hui');
      await screen.findByRole('region', { name: 'Hui' });
      const id = fila(CORREFOC).dataset.element;
      const altre = files().map((boto) => boto.dataset.element).find((element) => element !== id);
      fireEvent.click(fila(CORREFOC));
      await titolDelLector(CORREFOC);
      fireEvent.click(detall().getByRole('button', { name: 'Índex de secció' }));
      const dialeg = screen.getByRole('dialog', { name: 'Taula de continguts' });
      fireEvent.click(within(dialeg).getByRole('button', { name: 'Recomanacions' }));
      expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${id}&seccio=recomanacions`);
      fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
      expect(ubicacio()).toBe('/app/lector/noticies/hui');
      fireEvent.click(document.querySelector(`a.sp-card-link-overlay[data-element="${altre}"]`));
      expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${altre}`);
    } finally {
      Element.prototype.scrollIntoView = scrollAbans;
    }
  });

  test('tancar torna la graella on era; canviar de carpeta amb l’article obert comença de dalt', async () => {
    vi.spyOn(Element.prototype, 'scrollTop', 'get').mockReturnValue(240);
    const posa = vi.spyOn(Element.prototype, 'scrollTop', 'set');
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    fireEvent.click(detall().getByRole('button', { name: 'Tanca l’article' }));
    await waitFor(() => expect(posa).toHaveBeenCalledWith(240));
    /* El cos de la graella (la regió amb nom de MarcColumna), no cap altre element. */
    expect(posa.mock.contexts.at(-1)).toBe(screen.getByRole('region', { name: 'Hui' }));
    posa.mockClear();
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    fireEvent.click(esquerra().getByRole('link', { name: /^Esports/ }));
    await screen.findByRole('region', { name: 'Esports' });
    expect(files()).toHaveLength(3);
    expect(posa).not.toHaveBeenCalled();
  });

  test('«Visita el lloc web» és un enllaç de veres a una pestanya nova, sense referent ni opener', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    const enllac = detall().getByRole('link', { name: 'Visita el lloc web (s’obri en una pestanya nova)' });
    expect(enllac.getAttribute('href')).toBe('https://example.org/colla-dimonis/correfoc-barranc');
    expect(enllac.getAttribute('target')).toBe('_blank');
    expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
    /* Tot enllaç del cos de la notícia ix a una pestanya nova, sense referent ni opener. */
    const delCos = within(cosDelLector()).getAllByRole('link');
    expect(delCos).toContain(enllac);
    for (const a of delCos) {
      expect(a.getAttribute('rel'), a.textContent).toBe('noopener noreferrer');
      expect(a.getAttribute('target'), a.textContent).toBe('_blank');
    }
    /* Fora del cos, l'únic enllaç és l'autoria de la boina (Pàgina Universal, ordre del Mestre del
       261004): una ruta de l'app, a les notícies de la font, mai una adreça de fora. */
    const fora = detall().getAllByRole('link').filter((a) => !delCos.includes(a));
    expect(fora.map((a) => a.getAttribute('href'))).toEqual(['/app/lector/noticies/festes/colla-dimonis']);
  });

  test('Pedra Seca pura: cap style=, cap imatge de fora i cap classe que no existisca, al lector i a la graella', async () => {
    const conegudes = classesConegudes();
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    const graella = document.getElementById('app-grid-main');
    const revisa = (arrel) => {
      expect(arrel.querySelectorAll('[style]')).toHaveLength(0);
      for (const img of arrel.querySelectorAll('img')) expect(img.getAttribute('src')).not.toMatch(/^(?:https?:)?\/\//);
      const classes = [...arrel.querySelectorAll('[class]')].flatMap((el) => [...el.classList]);
      expect(classes.length).toBeGreaterThan(5);
      expect(classes.filter((classe) => !conegudes.has(classe) && !classe.startsWith('lucide'))).toEqual([]);
    };
    revisa(graella);
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    revisa(graella);
  });

  test('un article amb vídeos: l’avís de privacitat; i «Marca com a no llegit»', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(fila(ASSAIG));
    await titolDelLector(ASSAIG);
    expect(detall().getByText('Imatges i vídeos a part')).toBeTruthy();
    expect(detall().getByText('Al final hi haurà coca i mistela.')).toBeTruthy();
    await waitFor(() => expect(textDeNavegacio(esquerra().getByRole('link', { name: /^Cultura i festes/ }))).toBe('Cultura i festes 2 sense llegir'));
    fireEvent.click(detall().getByRole('button', { name: 'Marca com a no llegit' }));
    expect(textDeNavegacio(esquerra().getByRole('link', { name: /^Cultura i festes/ }))).toBe('Cultura i festes 3 sense llegir');
  });

  test('«Desa per a després»: la carpeta el compta, es desa al disc i s’hi llig encara que la font ja no el servisca', async () => {
    const entorn = prepara();
    const { idb } = munta('/app/lector/noticies/hui', entorn);
    await screen.findByRole('region', { name: 'Hui' });
    const id = fila(CORREFOC).dataset.element;
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    const desa = detall().getByRole('button', { name: 'Desa per a després' });
    expect(desa.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(desa);
    expect(detall().getByRole('button', { name: 'Desa per a després' }).getAttribute('aria-pressed')).toBe('true');
    expect(textDeNavegacio(esquerra().getByRole('link', { name: /^Per a després/ }))).toBe('Per a després 1 desada');
    await waitFor(() => expect(desat(idb)?.despres.map((d) => d.id)).toEqual([id]));
    fireEvent.click(esquerra().getByRole('link', { name: /^Per a després/ }));
    await screen.findByRole('region', { name: 'Per a després' });
    expect(within(fila(CORREFOC).closest('article')).getByText('Desat per a després', ETIQUETA)).toBeTruthy();
    /* Llegida i desada: la descripció diu «Desat per a després», i no «Nou». */
    expect(descripcioDe(fila(CORREFOC))).toBe('Desat per a després');
  });

  test('una notícia que la font ja no servix sencera es llig del resum, i ho diu', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    munta('/app/lector/noticies/festes', prepara({ adaptador: { ...llavor, article: async () => null } }));
    await screen.findByRole('region', { name: 'Cultura i festes' });
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    expect(detall().getByText('Només el resum')).toBeTruthy();
    expect(detall().getByText(/^Enguany el correfoc eixirà de la Font Vella/)).toBeTruthy();
  });

  /* Verificació «lector-nevera», D3 (REGLA D'OR 1) · Una notícia desada d'una font que el port ja
     no servix: la targeta no en coneix la font, però l'article sí que té autor. La boina el diu,
     sense enllaç (com el lector, Lector.jsx), i mai «Sóc de Poble», que no l'ha escrita. L'autor
     és inventat. */
  test('una notícia desada d’una font que ja no hi és: la boina diu l’autor de l’article, sense enllaç', async () => {
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
    const boina = (await detall().findByRole('link', { name: CORREFOC })).closest('article.sp-card').querySelector('header.sp-card-header');
    expect(boina.querySelector('.sp-card-author-name').textContent).toBe('Redacció de la Colla');
    expect(within(boina).queryByRole('link')).toBeNull();
    expect(boina.textContent).not.toMatch(/Sóc de Poble/);
  });

  test('carregant i error de l’article; un enllaç a /noticies?article= es canonitza a «Hui»', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const [primer] = await llavor.llistaArticles({ fontId: 'colla-dimonis' });
    let falla = true;
    const adaptador = { ...llavor, article: (id) => (falla ? Promise.reject(new Error('caigut')) : llavor.article(id)) };
    munta(`/app/lector/noticies?article=${primer.id}`, prepara({ adaptador }));
    await waitFor(() => expect(ubicacio()).toBe(`/app/lector/noticies/hui?article=${primer.id}`));
    expect(await screen.findByText('No s’ha pogut obrir l’article')).toBeTruthy();
    falla = false;
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    expect(await titolDelLector(CORREFOC)).toBeTruthy();
  });
});

describe('els estats del port', () => {
  test('carregant: cada columna ho diu', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    const adaptador = { ...llavor, llistaArticles: () => new Promise(() => {}) };
    munta('/app/lector/noticies/hui', prepara({ adaptador }));
    expect(await screen.findByText('Carregant les notícies…')).toBeTruthy();
    expect(detall().getByRole('status').textContent).toBe('Carregant les notícies…');
  });

  test('error: ho diu i «Torna-ho a provar» torna a demanar-ho', async () => {
    const llavor = creaAdaptadorLlavor({ ara: ARA });
    let falla = true;
    const adaptador = { ...llavor, llistaFonts: () => (falla ? Promise.reject(new Error('caigut')) : llavor.llistaFonts()) };
    munta('/app/lector/noticies/hui', prepara({ adaptador }));
    expect(await screen.findByText('No s’han pogut carregar les notícies')).toBeTruthy();
    falla = false;
    fireEvent.click(detall().getByRole('button', { name: 'Torna-ho a provar' }));
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(files()).toHaveLength(6));
  });

  test('sense base local, l’avís de memòria a les carpetes', async () => {
    munta('/app/lector/noticies/hui', prepara({ sensebase: true }));
    await screen.findByRole('region', { name: 'Hui' });
    expect(esquerra().getByText('Només en la memòria')).toBeTruthy();
  });
});

describe('les fonts que se seguixen', () => {
  test('el catàleg: totes seguides; tocar-ne una la deixa de seguir, es desa i «Hui» ja no en porta', async () => {
    const { idb } = munta('/app/lector/fonts');
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const cooperativa = detall().getByRole('button', { name: /^Cooperativa de l’Horta Vella/ });
    expect(cooperativa.getAttribute('aria-pressed')).toBe('true');
    /* Els logos de les fonts són quadrats: l'excepció 16:9 és només per a les notícies. */
    expect(document.querySelector('.sdp-panoramica')).toBeNull();
    expect(mig().getByRole('link', { name: /^Cooperativa de l’Horta Vella/ }).getAttribute('href')).toBe('/app/lector/noticies/camp/cooperativa');
    fireEvent.click(cooperativa);
    expect(detall().getByRole('button', { name: /^Cooperativa de l’Horta Vella/ }).getAttribute('aria-pressed')).toBe('false');
    expect(mig().queryByRole('link', { name: /^Cooperativa de l’Horta Vella/ })).toBeNull();
    await waitFor(() => expect(desat(idb)?.noSeguides).toEqual(['cooperativa']));
    window.history.pushState(null, '', '/app/lector/noticies/hui');
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate')); });
    await screen.findByRole('region', { name: 'Hui' });
    expect(files()).toHaveLength(5);
    expect(textDeNavegacio(esquerra().getByRole('link', { name: /^Camp i temps/ }))).toBe('Camp i temps 0 tot llegit');
  });
});

describe('la boina de les targetes de font (REGLA D’OR 1, ordre del Mestre del 261004)', () => {
  test('cada targeta del catàleg de fonts porta la boina: la font mateixa, enllaçada a les seues notícies', async () => {
    munta('/app/lector/fonts');
    await screen.findByRole('region', { name: 'Fonts del poble' });
    const targetes = [...document.getElementById('app-grid-main').querySelectorAll('article.sp-card')];
    expect(targetes.length).toBeGreaterThan(3);
    for (const targeta of targetes) {
      expect(targeta.querySelector('header.sp-card-header .sp-card-author-name'), targeta.textContent).not.toBeNull();
    }
    const cooperativa = detall().getByRole('button', { name: /^Cooperativa de l’Horta Vella/ }).closest('article.sp-card');
    const autor = within(cooperativa.querySelector('header.sp-card-header')).getByRole('link', { name: /^Cooperativa de l’Horta Vella/ });
    expect(autor.getAttribute('href')).toBe('/app/lector/noticies/camp/cooperativa');
    /* El logo de la llavor és d'un origen que l'amfitrió no ha permés: ni a la boina. */
    expect(document.querySelectorAll('#app-grid-main img')).toHaveLength(0);
  });
});

describe('en mitjana (800 px): fonts i notícies de costat, les carpetes en panell', () => {
  beforeEach(() => { ambAmplada(800); });

  test('l’obridor «Carpetes» obri el panell; triar-ne una navega i el tanca; llegint, les fonts es queden', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    expect(document.getElementById('app-grid-sidebar').hasAttribute('inert')).toBe(true);
    const obridor = detall().getByRole('button', { name: 'Carpetes' });
    expect(obridor.dataset.obriColumna).toBe('esquerra');
    fireEvent.click(obridor);
    expect(closca().dataset.panell).toBe('left');
    fireEvent.click(esquerra().getByRole('link', { name: /^Cultura i festes/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    expect(document.getElementById('app-grid-list').hasAttribute('inert')).toBe(false);
  });

  test('«Torna» tanca el panell de les carpetes sense navegar i el focus torna a l’obridor', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    fireEvent.click(detall().getByRole('button', { name: 'Carpetes' }));
    expect(closca().dataset.panell).toBe('left');
    const torna = esquerra().getByRole('button', { name: 'Torna' });
    torna.focus();
    fireEvent.click(torna);
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    expect(document.activeElement?.dataset.obriColumna).toBe('esquerra');
  });

  test('amb el panell de les carpetes obert, Esc no tanca l’article que queda davall', async () => {
    munta('/app/lector/noticies/festes');
    await screen.findByRole('region', { name: 'Cultura i festes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('mitja'));
    fireEvent.click(fila(CORREFOC));
    await titolDelLector(CORREFOC);
    /* Llegint, l'obridor és el de les fonts, al mig (el lector no en porta). */
    fireEvent.click(mig().getByRole('button', { name: 'Carpetes' }));
    expect(closca().dataset.panell).toBe('left');
    fireEvent.keyDown(esquerra().getByRole('button', { name: 'Torna' }), { key: 'Escape' });
    expect(ubicacio()).toMatch(/[?&]article=/);
  });
});

describe('en estret (375 px): una columna, la que diu la ruta', () => {
  beforeEach(() => { ambAmplada(375); });

  test('/noticies: les carpetes; una categoria porta a les seues fonts; «Hui», a les notícies', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Carpetes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(closca().dataset.panell).toBe('left');
    expect(esquerra().getByRole('link', { name: /^Cultura i festes/ }).getAttribute('href')).toBe('/app/lector/noticies/festes/fonts');
    fireEvent.click(esquerra().getByRole('link', { name: /^Cultura i festes/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes/fonts');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    fireEvent.click(mig().getByRole('link', { name: /^Totes les fonts/ }));
    expect(ubicacio()).toBe('/app/lector/noticies/festes');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(detall().getByRole('button', { name: 'Carpetes' }).getAttribute('aria-controls')).toBe('app-grid-sidebar');
  });

  test('a /noticies les carpetes són la pàgina: sense «Torna»', async () => {
    munta('/app/lector/noticies');
    await screen.findByRole('region', { name: 'Carpetes' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(esquerra().queryByRole('button', { name: 'Torna' })).toBeNull();
  });

  test('«Hui»: el detall porta «Marca-ho tot com a llegit» (el ✓ de Feedly) i l’enllaç a les fonts de la carpeta', async () => {
    munta('/app/lector/noticies/hui');
    await screen.findByRole('region', { name: 'Hui' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(closca().dataset.panell).toBe('');
    expect(detall().getAllByText('Nou', ETIQUETA)).toHaveLength(6);
    fireEvent.click(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }));
    expect(detall().queryAllByText('Nou')).toHaveLength(0);
    expect(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(true);
    const fonts = detall().getByRole('link', { name: 'Fonts' });
    expect(fonts.getAttribute('href')).toBe('/app/lector/noticies/hui/fonts');
    fireEvent.click(fonts);
    expect(ubicacio()).toBe('/app/lector/noticies/hui/fonts');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    expect(textDeNavegacio(mig().getByRole('link', { name: /^Totes les fonts/ }))).toBe('Totes les fonts 0 tot llegit');
  });

  test('a les notícies d’una font, també: l’enllaç porta a les fonts de la carpeta', async () => {
    munta('/app/lector/noticies/festes/colla-dimonis');
    await screen.findByRole('region', { name: 'Colla de Dimonis de la Font Vella' });
    await waitFor(() => expect(closca().dataset.layout).toBe('estret'));
    expect(detall().getByRole('link', { name: 'Fonts' }).getAttribute('href')).toBe('/app/lector/noticies/festes/fonts');
    expect(detall().getByRole('button', { name: 'Marca-ho tot com a llegit' }).disabled).toBe(false);
  });
});

describe('sense port i sense llavor (producció)', () => {
  test('cap notícia inventada: l’app ho diu i no munta la closca', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SDP_LECTOR_LLAVOR', '0');
    vi.resetModules();
    try {
      const { default: AppSenseLlavor } = await import('./AppLector.jsx');
      render(<AppSenseLlavor />);
      expect(screen.getByText('Encara no hi ha cap font connectada')).toBeTruthy();
      expect(document.querySelector('.app-grid-shell')).toBeNull();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
