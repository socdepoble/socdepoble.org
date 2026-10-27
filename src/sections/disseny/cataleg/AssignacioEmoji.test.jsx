/* Ordre del Mestre (261007) · La pantalla «Assignar» d'Emojis XL
   (AssignacioEmoji.jsx): la capçalera amb l'emoji i el seu nom, la cerca, la
   llista agrupada (Notes personals, Wiki de Poble, Disseny i Pàgines de Sóc
   de Poble) amb les carpetes i els documents de cada grup, l'assignació de
   veres d'una nota pel canal del Bloc i l'honestedat amb les pàgines del
   codi i les carpetes. El Bloc és un useNotes de mentida; la Wiki compilada,
   una de mostra, i les eines locals de la Wiki, un doble de
   modulsLocalsActius (les de veres, a destinsEmoji.test.js). */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const bloc = vi.hoisted(() => ({ valor: null }));
const eines = vi.hoisted(() => ({ crides: [] }));
const sessio = vi.hoisted(() => ({ valor: null }));
vi.mock('../../notes/NotesContext.jsx', () => ({ useNotes: () => bloc.valor }));
/* Gauntlet 261016 (Bloc 3.4) · Qui és superadmin: la Maquinària de la IAIA només ix per a ell fora de DEV. */
vi.mock('../../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSessioOpcional: () => sessio.valor,
}));
vi.mock('../../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:01_ser', label: 'SER' }],
    items: [
      { id: 'genoma', title: 'Genoma', subtitle: 'Qui som', categoryId: 'folder:01_ser' },
      { id: 'cronica', title: 'Crònica del mas', subtitle: 'Les actes', categoryId: null }
    ]
  }
}));
vi.mock('../../wiki-de-poble/WikiDePobleSection.jsx', () => ({
  modulsLocalsActius: (env) => {
    eines.crides.push(env);
    return env?.DEV === true
      ? { categories: [], items: [{ id: 'tractors_aprovacio', title: 'Aprovació de tractors', subtitle: 'La teua signatura', icon: '🚜', categoryId: 'maquinaria_cat' }] }
      : { categories: [], items: [] };
  }
}));

import { AssignacioEmoji } from './AssignacioEmoji.jsx';
import { PAGE_COPY } from '../../text/pageContent.js';
import { NOM_CARPETA_CONNECTATS } from '../../notes/carpetes.js';
import { ICONA_PORTADA } from '../../wiki-de-poble/iconesWiki.js';
import { CATALOG_CATEGORIES } from './manifest.js';
import { textCarpetaBloc, textCarpetaWiki, textDelCodi } from './destinsEmoji.js';

const setLocalNoteField = vi.fn();
const NOTES = [
  { id: 'n1', title: 'La nota', subtitle: 'Del hort', formattedDate: '07/10/26', icon: '' },
  { id: 'n2', title: 'Formatges', lead: 'Curats', icon: '🧀' }
];
/* Dues carpetes del servidor (una dins de l'altra); el Bloc hi afig la Safata d’Entrada. */
const CARPETES = [{ id: 'f-mur', name: 'Mur', parentId: null }, { id: 'f-hort', name: 'Hort', parentId: 'f-mur' }];
const CERCA = 'Cerca una nota, una pàgina o una carpeta';
/* Les pàgines de Sóc de Poble que viuen al PAGE_COPY, sense les portades de la Wiki i de Disseny.
   Onada 8 (261009) · Amb el Cervell, pàgina del sistema darrere de Disseny.
   La Consola també ho és, però no es repetix: ja és al grup de la Wiki, com
   abans (Llei del Píxel).
   Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) · Amb
   «Descàrregues i Aplicacions», l'última de SYSTEM_PAGES. */
const PAGINES = ['projecte', 'constitucio', 'roadmap', 'notes', 'cervell', 'versions', 'legal', 'xat', 'drets-autor', 'descarregues', 'anima', 'fedivers'];

beforeEach(() => {
  setLocalNoteField.mockReset();
  eines.crides.length = 0;
  sessio.valor = null;
  bloc.valor = { notes: NOTES, noteFolders: CARPETES, status: 'ready', teSessio: true, setLocalNoteField };
});
afterEach(cleanup);

async function munta(props = {}) {
  const onFet = vi.fn();
  const vista = render(<AssignacioEmoji emoji="🧀" nom="cheese wedge" onFet={onFet} {...props} />);
  /* La Wiki compilada arriba amb una importació dinàmica. Per text i no per
     rol: el nom accessible de cent files de Disseny es calcula a cada sondeig. */
  await screen.findByText('Genoma');
  return { ...vista, onFet };
}

const grup = (titol) => screen.getByRole('heading', { level: 3, name: titol }).closest('section');
const botons = (titol) => within(grup(titol)).getAllByRole('button');
const files = (titol) => botons(titol).map((boto) => boto.querySelector('.sdp-xat-fila__nom').textContent);
/* La fila d'un grup pel seu nom; `n`, la segona si n'hi ha dues (una carpeta i un document). */
const fila = (titol, nom, n = 0) => botons(titol).filter((boto) => boto.querySelector('.sdp-xat-fila__nom').textContent === nom)[n];
const glif = (boto) => boto.querySelector('.sdp-assigna-emoji__actual');
const etiqueta = (boto) => boto.querySelector('.sdp-assigna-emoji__codi')?.textContent ?? null;

test('capçalera: l’emoji en gran (decoratiu) i el seu nom oficial en anglés', async () => {
  const { container } = await munta();
  const cap = container.querySelector('.sdp-assigna-emoji__cap');
  expect(cap.querySelector('.sdp-emojis-xl__glif').textContent).toBe('🧀');
  expect(cap.querySelector('.sdp-emojis-xl__glif').getAttribute('aria-hidden')).toBe('true');
  const nom = within(cap).getByRole('heading', { level: 2, name: 'cheese wedge' });
  expect(nom.getAttribute('lang')).toBe('en');
  expect(within(cap).getByText('Tria on vols posar esta emoticona.')).toBeTruthy();
});

test('la llista agrupada: quatre grups i, en cada un, la portada, les carpetes i els documents, amb files del Xat i el glif actual a l’esquerra', async () => {
  const { container } = await munta();
  expect([...container.querySelectorAll('.sdp-xat-seccio__titol')].map((h) => h.textContent))
    .toEqual(['Notes personals', 'Wiki de Poble', 'Disseny', 'Pàgines de Sóc de Poble']);
  /* Notes: les carpetes del Bloc (amb la Safata d’Entrada) i després les notes. */
  expect(files('Notes personals')).toEqual(['Mur', 'Hort', NOM_CARPETA_CONNECTATS, 'La nota', 'Formatges']);
  /* Wiki: la portada, les carpetes (Maquinària de la IAIA i les del manifest),
     la Consola, les eines locals i els documents. */
  expect(files('Wiki de Poble')).toEqual([
    PAGE_COPY.wikidepoble.title, 'Maquinària de la IAIA', 'SER', PAGE_COPY.consola.title, 'Aprovació de tractors', 'Genoma', 'Crònica del mas'
  ]);
  expect(eines.crides).toEqual([{ DEV: true }]);
  /* Disseny: la portada, les famílies del catàleg i els espècimens. */
  const disseny = files('Disseny');
  expect(disseny[0]).toBe(PAGE_COPY.disseny.title);
  expect(disseny.slice(1, 1 + CATALOG_CATEGORIES.length)).toEqual(CATALOG_CATEGORIES.map((categoria) => categoria.label));
  expect(disseny.filter((titol) => titol === 'Emojis XL')).toHaveLength(2);
  /* Les pàgines del sistema i les de text de la navegació, amb el seu PAGE_COPY. */
  expect(files('Pàgines de Sóc de Poble')).toEqual(PAGINES.map((clau) => PAGE_COPY[clau].title));

  const nota = fila('Notes personals', 'La nota');
  /* P1-36 (261026_2126) · Un destí és una fila senzilla: els 72px d'abans, no la targeta de conversa. */
  expect(nota.className).toBe('sdp-xat-fila sdp-xat-fila--senzilla');
  expect(nota.getAttribute('type')).toBe('button');
  expect(nota.hasAttribute('aria-disabled')).toBe(false);
  expect(glif(nota).textContent).toBe('🪶');
  expect(glif(nota).getAttribute('aria-hidden')).toBe('true');
  expect(nota.querySelector('.sdp-xat-fila__hora').textContent).toBe('07/10/26');
  expect(nota.querySelector('.sdp-xat-fila__previa').textContent).toBe('Del hort');
  /* Les carpetes del Bloc: la seua icona de Lucide i on pengen. */
  const hort = fila('Notes personals', 'Hort');
  expect(glif(hort).querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  expect(hort.querySelector('.sdp-xat-fila__previa').textContent).toBe('Carpeta de Mur');
  /* Disseny: la família i l'espècimen Emojis XL porten 🌻; la carpeta diu quants n'hi ha. */
  const [familia, especimen] = [fila('Disseny', 'Emojis XL'), fila('Disseny', 'Emojis XL', 1)];
  expect([glif(familia).textContent, glif(especimen).textContent]).toEqual(['🌻', '🌻']);
  expect(familia.querySelector('.sdp-xat-fila__previa').textContent).toBe('Carpeta · 1 espècimen');
  /* La Wiki: el glif de la Wiki (iconesWiki.js). Ordre del Mestre (pla
     261007_0012, §0.7) · la portada (📖) i cada carpeta (Maquinària de la
     IAIA, 🎛️; SER, 🌱) porten el seu emoji, el que pinta l'arbre, i cap
     icona. La portada de Disseny porta una imatge a la seua llista: ací, la
     icona de document. */
  const wiki = botons('Wiki de Poble');
  expect(wiki.map((boto) => glif(boto).textContent)).toEqual([ICONA_PORTADA, '🎛️', '🌱', '⚙️', '🚜', '📄', '📄']);
  expect(wiki.filter((boto) => glif(boto).querySelector('svg'))).toEqual([]);
  expect(fila('Wiki de Poble', 'SER').querySelector('.sdp-xat-fila__previa').textContent).toBe('Carpeta · 1 document');
  expect(glif(botons('Disseny')[0]).querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  /* Les pàgines del sistema: la icona de la barra lateral (un component). */
  expect(glif(fila('Pàgines de Sóc de Poble', PAGE_COPY.constitucio.title)).querySelector('svg')).not.toBeNull();
});

test('les pàgines i les carpetes del codi es llisten amb honestedat: el grup ho avisa i cada fila és inerta, amb el seu motiu', async () => {
  await munta();
  for (const titol of ['Wiki de Poble', 'Disseny', 'Pàgines de Sóc de Poble']) {
    expect(within(grup(titol)).getByText(/viatgen dins del codi de l’app: des d’ací no se’n pot canviar l’emoji/)).toBeTruthy();
    expect(botons(titol).every((boto) => boto.getAttribute('aria-disabled') === 'true')).toBe(true);
  }
  /* Les carpetes de la Wiki porten un emoji fix del codi («Icona fixa»); la resta del codi, «Al codi». */
  expect(botons('Wiki de Poble').map(etiqueta)).toEqual(['Al codi', 'Icona fixa', 'Icona fixa', 'Al codi', 'Al codi', 'Al codi', 'Al codi']);
  expect(botons('Disseny').every((boto) => etiqueta(boto) === 'Al codi')).toBe(true);
  expect(botons('Pàgines de Sóc de Poble').every((boto) => etiqueta(boto) === 'Al codi')).toBe(true);
  /* Notes: les carpetes, inertes amb «Icona fixa»; les notes, vives i sense etiqueta. */
  const notes = botons('Notes personals');
  expect(notes.map((boto) => [boto.getAttribute('aria-disabled'), etiqueta(boto)])).toEqual([
    ['true', 'Icona fixa'], ['true', 'Icona fixa'], ['true', 'Icona fixa'], [null, null], [null, null]
  ]);
  expect(within(grup('Notes personals')).queryByText(/dins del codi/)).toBeNull();
});

test('prémer una carpeta (de la Wiki o del Bloc) o una pàgina del sistema no escriu res: l’avís de davall de la fila diu per què', async () => {
  const { onFet } = await munta();
  const casos = [
    ['Wiki de Poble', 'SER', textCarpetaWiki('SER')],
    ['Notes personals', 'Hort', textCarpetaBloc('Hort')],
    ['Disseny', 'Fonaments', textDelCodi('Fonaments')],
    ['Pàgines de Sóc de Poble', PAGE_COPY.constitucio.title, textDelCodi(PAGE_COPY.constitucio.title)]
  ];
  for (const [titol, nom, text] of casos) {
    const boto = fila(titol, nom);
    fireEvent.click(boto);
    const avis = within(boto.closest('li')).getByRole('status');
    expect(avis.textContent).toBe(text);
    expect(boto.getAttribute('aria-describedby')).toBe(avis.id);
  }
  expect(setLocalNoteField).not.toHaveBeenCalled();
  expect(onFet).not.toHaveBeenCalled();
});

/* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   Prova actualitzada a propòsit. El grup de la Wiki és la Wiki que veu qui
   mira: en producció, la Maquinària de la IAIA (i la Consola) només per a qui
   és superadmin (wiki-de-poble/maquinaria.js), com a la Wiki i a /consola. */
test('en producció la Wiki no porta eines locals: ni es demanen; sense superadmin, ni la Maquinària ni la Consola', async () => {
  vi.stubEnv('DEV', false);
  try {
    await munta();
    expect(eines.crides).toEqual([]);
    expect(files('Wiki de Poble')).toEqual([PAGE_COPY.wikidepoble.title, 'SER', 'Genoma', 'Crònica del mas']);
  } finally {
    vi.unstubAllEnvs();
  }
});

test('Bloc 3.4 · en producció i amb superadmin, la Maquinària de la IAIA només té la Consola', async () => {
  vi.stubEnv('DEV', false);
  sessio.valor = { esSuperadmin: true };
  try {
    await munta();
    expect(eines.crides).toEqual([]);
    expect(files('Wiki de Poble')).toEqual([PAGE_COPY.wikidepoble.title, 'Maquinària de la IAIA', 'SER', PAGE_COPY.consola.title, 'Genoma', 'Crònica del mas']);
    expect(fila('Wiki de Poble', 'Maquinària de la IAIA').querySelector('.sdp-xat-fila__previa').textContent).toBe('Carpeta · 1 document');
  } finally {
    vi.unstubAllEnvs();
  }
});

test('prémer una pàgina del codi no escriu res ni la dona per feta: un avís davall de la fila ho explica', async () => {
  const { onFet } = await munta();
  const genoma = within(grup('Wiki de Poble')).getByRole('button', { name: /^Genoma/ });
  fireEvent.click(genoma);
  const avis = within(grup('Wiki de Poble')).getByRole('status');
  expect(avis.textContent).toBe('No s’ha canviat res: «Genoma» viu al codi de l’app i el seu emoji es canvia amb un commit.');
  expect(genoma.getAttribute('aria-describedby')).toBe(avis.id);
  expect(genoma.closest('li').contains(avis)).toBe(true);
  expect(setLocalNoteField).not.toHaveBeenCalled();
  expect(onFet).not.toHaveBeenCalled();
});

test('assignació de veres: la nota rep l’emoji pel canal del Bloc (camp icon) i la pantalla avisa qui la munta', async () => {
  const { onFet } = await munta();
  fireEvent.click(within(grup('Notes personals')).getByRole('button', { name: /^La nota/ }));
  expect(setLocalNoteField).toHaveBeenCalledExactlyOnceWith('n1', 'icon', '🧀');
  expect(onFet).toHaveBeenCalledExactlyOnceWith('Fet: 🧀 és ara l’emoji de «La nota».');
});

test('una nota que ja porta l’emoji: res a escriure, i ho diu', async () => {
  const { onFet } = await munta();
  const formatges = within(grup('Notes personals')).getByRole('button', { name: /^Formatges/ });
  expect(formatges.querySelector('.sdp-assigna-emoji__actual').textContent).toBe('🧀');
  fireEvent.click(formatges);
  expect(within(formatges.closest('li')).getByRole('status').textContent).toBe('«Formatges» ja porta 🧀: no hi havia res a canviar.');
  expect(setLocalNoteField).not.toHaveBeenCalled();
  expect(onFet).not.toHaveBeenCalled();
});

test('un glif que no és un sol emoji no s’escriu en cap nota: ho diu davall de la fila', async () => {
  const { onFet } = await munta({ emoji: 'ab' });
  const nota = within(grup('Notes personals')).getByRole('button', { name: /^La nota/ });
  fireEvent.click(nota);
  expect(within(nota.closest('li')).getByRole('status').textContent).toBe('ab no pot ser l’emoticona d’una nota: ha de ser un sol emoji.');
  expect(setLocalNoteField).not.toHaveBeenCalled();
  expect(onFet).not.toHaveBeenCalled();
});

test('la cerca filtra els quatre grups amb el plegat de /cerca, carpetes incloses, i amaga els grups buits', async () => {
  const { container } = await munta();
  const titols = () => [...container.querySelectorAll('.sdp-xat-seccio__titol')].map((h) => h.textContent);
  const camp = screen.getByRole('searchbox', { name: CERCA });
  fireEvent.change(camp, { target: { value: 'CRONICA' } });
  expect(titols()).toEqual(['Wiki de Poble']);
  expect(files('Wiki de Poble')).toEqual(['Crònica del mas']);

  fireEvent.change(camp, { target: { value: 'nota hort' } });
  expect(titols()).toEqual(['Notes personals']);
  expect(files('Notes personals')).toEqual(['La nota']);

  /* Una carpeta es troba pel nom i per la previa: «carpeta de mur» és Mur
     («Carpeta del Bloc») i Hort («Carpeta de Mur»); «hort carpeta», només Hort. */
  fireEvent.change(camp, { target: { value: 'carpeta de mur' } });
  expect(titols()).toEqual(['Notes personals']);
  expect(files('Notes personals')).toEqual(['Mur', 'Hort']);
  fireEvent.change(camp, { target: { value: 'hort carpeta' } });
  expect(files('Notes personals')).toEqual(['Hort']);

  fireEvent.change(camp, { target: { value: 'constitucio' } });
  expect(titols()).toEqual(['Pàgines de Sóc de Poble']);
  expect(files('Pàgines de Sóc de Poble')).toEqual([PAGE_COPY.constitucio.title]);

  fireEvent.change(camp, { target: { value: 'xyzzy' } });
  expect(container.querySelectorAll('.sdp-xat-seccio')).toHaveLength(0);
  expect(screen.getByRole('status').textContent).toBe('Cap nota, pàgina ni carpeta amb eixe nom.');

  fireEvent.click(screen.getByRole('button', { name: 'Esborra la cerca' }));
  expect(camp.value).toBe('');
  expect(document.activeElement).toBe(camp);
  expect(container.querySelectorAll('.sdp-xat-seccio')).toHaveLength(4);
});

test('Escape amb text esborra la cerca sense arribar a la pantalla; buit, el deixa passar', async () => {
  const fora = vi.fn();
  await munta();
  document.addEventListener('keydown', fora);
  try {
    const camp = screen.getByRole('searchbox', { name: CERCA });
    fireEvent.change(camp, { target: { value: 'genoma' } });
    fireEvent.keyDown(camp, { key: 'Escape' });
    expect(camp.value).toBe('');
    expect(fora).not.toHaveBeenCalled();
    fireEvent.keyDown(camp, { key: 'Escape' });
    expect(fora).toHaveBeenCalledTimes(1);
  } finally {
    document.removeEventListener('keydown', fora);
  }
});

test('els estats del Bloc es diuen, mai una llista buida muda', async () => {
  const estatDeNotes = () => within(grup('Notes personals')).getByRole('status').textContent;
  bloc.valor = null;
  await munta();
  expect(estatDeNotes()).toBe('El Bloc de notes no està disponible ací.');
  cleanup();

  bloc.valor = { notes: [], status: 'loading', setLocalNoteField };
  await munta();
  expect(estatDeNotes()).toBe('Carregant les teues notes…');
  cleanup();

  bloc.valor = { notes: [], status: 'error', setLocalNoteField };
  await munta();
  expect(estatDeNotes()).toBe('No s’han pogut carregar les notes.');
  cleanup();

  bloc.valor = { notes: [], status: 'ready', teSessio: false, setLocalNoteField };
  await munta();
  expect(estatDeNotes()).toBe('Connecta per veure les teues notes.');
  cleanup();

  bloc.valor = { notes: [], status: 'ready', teSessio: true, setLocalNoteField };
  await munta();
  expect(estatDeNotes()).toBe('Encara no tens cap nota.');
}, 30000);

test('amb el Bloc a mitges (notesComplete false) ho diu al peu del grup; complet, no', async () => {
  const PEU = 'Només hi ha les notes ja carregades: si no hi trobes la teua, obri el Bloc i torna.';
  bloc.valor = { notes: NOTES, status: 'ready', notesComplete: false, teSessio: true, setLocalNoteField };
  await munta();
  expect(within(grup('Notes personals')).getByText(PEU).className).toBe('sdp-xat-resultats__avis');
  cleanup();

  bloc.valor = { notes: NOTES, status: 'ready', notesComplete: true, teSessio: true, setLocalNoteField };
  await munta();
  expect(within(grup('Notes personals')).queryByText(PEU)).toBeNull();
});

/* Revisió del 261007 (M2-13) · Mentre la Wiki o les notes carreguen, una
   cerca sense cap fila no afirma que no hi ha res: diu que encara carrega. */
test('M2-13 · una cerca sense resultats mentre carreguen la Wiki o les notes no és un negatiu', async () => {
  bloc.valor = { notes: [], status: 'loading', setLocalNoteField };
  render(<AssignacioEmoji emoji="🧀" nom="cheese wedge" onFet={vi.fn()} />);
  fireEvent.change(screen.getByRole('searchbox', { name: CERCA }), { target: { value: 'xyzzy' } });
  expect(screen.getByRole('status').textContent).toBe('Encara es carreguen la Wiki i les notes…');
  expect(screen.queryByText('Cap nota, pàgina ni carpeta amb eixe nom.')).toBeNull();
  // La Wiki arriba; les notes encara carreguen: encara no és cap negatiu.
  await waitFor(() => expect(eines.crides).toHaveLength(1));
  await act(async () => {});
  expect(screen.getByRole('status').textContent).toBe('Encara es carreguen la Wiki i les notes…');
  cleanup();
  // Tot carregat: ara sí, cap resultat.
  bloc.valor = { notes: [], status: 'ready', teSessio: true, setLocalNoteField };
  await munta();
  fireEvent.change(screen.getByRole('searchbox', { name: CERCA }), { target: { value: 'xyzzy' } });
  expect(screen.getByRole('status').textContent).toBe('Cap nota, pàgina ni carpeta amb eixe nom.');
});

test('la Wiki compilada es demana en obrir la pantalla: mentrestant, la portada i «Carregant la Wiki…»', async () => {
  render(<AssignacioEmoji emoji="🧀" nom="cheese wedge" onFet={vi.fn()} />);
  expect(files('Wiki de Poble')).toEqual([PAGE_COPY.wikidepoble.title]);
  expect(within(grup('Wiki de Poble')).getByRole('status').textContent).toBe('Carregant la Wiki…');
  await waitFor(() => expect(files('Wiki de Poble')).toHaveLength(7));
  expect(within(grup('Wiki de Poble')).queryByRole('status')).toBeNull();
  await act(async () => {});
});
