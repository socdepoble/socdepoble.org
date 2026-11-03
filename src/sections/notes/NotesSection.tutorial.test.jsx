/* IDEA-59 / P1-72 (ordre del Mestre, 261101 02:03 i 02:55, punt 0: regressió
   crítica) · La Card tutorial «Bloc de notes» (la mà amb la ploma) sempre és
   dins de NOTES (Tot), també amb sessió, i l'entrada nua de /notes l'obri
   triada; amb el router en memòria de veres i l'espai de treball de veres.
     · Amb sessió (dades remotes) la n1 no arriba mai del servidor: el Bloc hi
       posa la Card de lectura (notaTutorial.js) i el detall és l'estat buit
       de l'editor, la Card (NotesDetail sense nota). Abans: «Mur» i la nota
       preparada (P4, 94d14cfd2), perquè l'efecte que obria la n1 (1e2f29b24)
       només actuava amb la n1 a la llista (el mode 'seed').
     · Crear una nota nova és un sol clic; obrir-ne qualsevol altra, també.
     · Un enllaç amb ?nota= o ?carpeta= mana, com sempre.
     · La Card només és a «Tot», mai duplicada, ni al Snippet Curador.
   Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({
  notes: [], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, buit: [],
  detalls: [], nomesLectura: undefined,
  /* T11-03 · L'àmbit de la cua (scopeKey) i, per a les proves del NotesProvider
     de veres, la resta de dades del Bloc (buides per a la resta de proves). */
  scopeKey: undefined, dadesDelBloc: {}
}));
const NOTA_A = Object.freeze({ id: '0f0e0d0c-0b0a-4000-8000-0000000000a1', title: 'Llista de la compra', folderId: 'f-notes', updatedAt: '2026-10-30T09:00:00Z' });
const NOTA_B = Object.freeze({ id: '0f0e0d0c-0b0a-4000-8000-0000000000b2', title: 'Festes de la Torre', folderId: 'f-pobles', updatedAt: '2026-10-29T09:00:00Z' });

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.buit, status: dades.status, canCreate: dades.canCreate, teSessio: dades.teSessio,
    notesComplete: true, config: dades.config, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: vi.fn(async (entrada) => ({ ...entrada, revision: 1 })), setLocalNoteField: vi.fn(),
    resolveNote: vi.fn(async () => ({ status: 'not-found' })), scopeKey: dades.scopeKey
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config, nomesLectura: dades.nomesLectura, ...dades.dadesDelBloc }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
/* El detall diu quina nota rep l'editor: «cap» és l'estat buit, la Card. */
vi.mock('./NotesDetail.jsx', () => ({
  default: ({ activeNote }) => {
    dades.detalls.push(activeNote);
    return <p data-testid="detall">{activeNote === null ? 'card' : (activeNote?.id ?? 'cap')}</p>;
  }
}));
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" className="fitxa-de-prova" data-kind={item.kind} aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';
import { KIND_TUTORIAL, NOTA_TUTORIAL, marcaTutorialRetirada, tutorialRetirada } from './notaTutorial.js';
import { NotesProvider } from './NotesContext';
import { NotesContext } from './objectesDeContext.js';
import { SessionContext, UIActionsContext, UIContext } from '../../app/contexts/objectesDeContext.js';
import { delVal, getVal, setVal } from '../../config/storage.js';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
/* T11-03 · Dos àmbits sintètics de la cua (scopeKey) per a la marca de la n1 retirada. */
const AMBIT = 'seed_persona::uuid-prova_tenant-prova';
const ALTRE_AMBIT = 'seed_persona::uuid-altra_tenant-prova';
beforeEach(() => {
  Object.assign(dades, {
    notes: [NOTA_A, NOTA_B], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, detalls: [], nomesLectura: undefined,
    scopeKey: AMBIT, dadesDelBloc: {}
  });
  for (const ambit of [AMBIT, ALTRE_AMBIT]) delVal(`notes.tutorialRetirada.${ambit}`);
});
afterEach(() => cleanup());

function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
    </>
  );
}
const arbre = (ruta) => (
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
    <Sonda />
  </MemoryRouter>
);
const munta = (ruta = '/notes') => {
  const vista = render(arbre(ruta));
  return { ...vista, torna: () => vista.rerender(arbre(ruta)) };
};
const columnaNotes = () => screen.getByRole('complementary', { name: 'NOTES' });
const rail = () => screen.getByRole('navigation', { name: 'CARPETES' });
const url = () => screen.getByTestId('url').textContent;
const detall = () => screen.getByTestId('detall').textContent;
const card = () => within(columnaNotes()).queryAllByRole('button', { name: 'Bloc de notes' });
const totPremut = () => screen.getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed') === 'true';

test('amb sessió (remot), l’entrada nua de /notes obri «Tot» amb la Card tutorial triada i visible al detall', () => {
  munta();
  expect(totPremut()).toBe(true);
  expect(card()).toHaveLength(1);
  expect(card()[0].getAttribute('aria-current')).toBe('true');
  expect(card()[0].dataset.kind).toBe(KIND_TUTORIAL);
  // La columna 3: l'estat buit de l'editor, la Card en lectura (cap nota, cap editor de la n1).
  expect(detall()).toBe('card');
  expect(dades.detalls.every((nota) => nota === null)).toBe(true);
  // No hi entra «Mur» ni la nota preparada; la URL es queda nua.
  expect(url()).toBe('/notes');
  expect(within(columnaNotes()).getByRole('button', { name: 'Nota sense títol' }).getAttribute('aria-current')).toBeNull();
});

test('la Card és la nota tutorial de la llavor: títol i imatge de la mà amb la ploma', () => {
  expect(NOTA_TUTORIAL).toMatchObject({
    id: 'n1',
    title: 'Bloc de notes',
    subtitle: 'El teu estudi d\'escriptura privat i lliure de distraccions',
    heroImage: '/assets/notes/bloc_notes_vintage.jpg',
    labels: ['General', 'Mur', 'Productivitat', 'Tutorial']
  });
  expect(NOTA_TUTORIAL.lead.startsWith('Benvingut al teu nou espai editorial.')).toBe(true);
  expect(Object.isFrozen(NOTA_TUTORIAL)).toBe(true);
});

test('la Card només és a «Tot»: triar una carpeta no la porta, i tornar a «Tot» sí', () => {
  munta();
  fireEvent.click(within(rail()).getByRole('button', { name: 'Pobles' }));
  expect(card()).toHaveLength(0);
  expect(detall()).toBe(NOTA_B.id);
  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  expect(card()).toHaveLength(1);
});

test('crear una nota nova és un sol clic (CREAR NOTA) i obrir qualsevol altra, també', async () => {
  munta();
  await act(async () => { fireEvent.click(within(columnaNotes()).getByRole('button', { name: 'CREAR NOTA' })); });
  const nova = detall();
  expect(nova).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(url()).toContain(`nota=${nova}`);
  fireEvent.click(within(columnaNotes()).getByRole('button', { name: NOTA_A.title }));
  expect(detall()).toBe(NOTA_A.id);
  fireEvent.click(card()[0]);
  expect(detall()).toBe('card');
  expect(url()).toBe('/notes?carpeta=__all__&nota=n1');
});

test('els enllaços explícits manen: ?nota= obri la nota, ?carpeta= la primera de la carpeta, i cap no salta a la Card', () => {
  munta(`/notes?nota=${NOTA_A.id}`);
  expect(detall()).toBe(NOTA_A.id);
  cleanup();
  munta('/notes?carpeta=f-pobles');
  expect(detall()).toBe(NOTA_B.id);
  expect(url()).toBe(`/notes?carpeta=f-pobles&nota=${NOTA_B.id}`);
  expect(card()).toHaveLength(0);
});

test('l’Arrere fins a l’entrada nua torna a «Tot» amb la Card', () => {
  munta();
  fireEvent.click(within(columnaNotes()).getByRole('button', { name: NOTA_A.title }));
  expect(detall()).toBe(NOTA_A.id);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
  expect(url()).toBe('/notes');
  expect(detall()).toBe('card');
  expect(totPremut()).toBe(true);
});

test('mentre la llista carrega no hi ha Card (cap canvi de peça en arribar la n1 de veres); en arribar, sí', () => {
  Object.assign(dades, { status: 'loading', canCreate: false });
  const { torna } = munta();
  expect(card()).toHaveLength(0);
  Object.assign(dades, { status: 'ready', canCreate: true });
  act(() => { torna(); });
  expect(card()).toHaveLength(1);
  expect(card()[0].getAttribute('aria-current')).toBe('true');
});

test('una revalidació (la renovació de la sessió) conserva la Card triada: no parpelleja', () => {
  const { torna } = munta();
  expect(detall()).toBe('card');
  Object.assign(dades, { status: 'revalidating' });
  act(() => { torna(); });
  expect(card()).toHaveLength(1);
  expect(detall()).toBe('card');
});

test('en mode «seed», amb la n1 de veres a la llista, cap Card duplicada: s’obri la n1 (editable)', () => {
  Object.assign(dades, { config: { dataMode: 'seed' }, notes: [{ ...NOTA_TUTORIAL, folderId: 'f-mur' }, NOTA_A] });
  munta();
  expect(card()).toHaveLength(1);
  expect(card()[0].dataset.kind).toBe('note');
  expect(detall()).toBe('n1');
});

test('sense sessió (remot): la Card també hi és, sense CREAR NOTA', () => {
  Object.assign(dades, { notes: [], teSessio: false, canCreate: false });
  munta();
  expect(card()).toHaveLength(1);
  expect(card()[0].getAttribute('aria-current')).toBe('true');
  expect(screen.queryByRole('button', { name: 'CREAR NOTA' })).toBeNull();
  expect(detall()).toBe('card');
});

/* Gauntlet 261101 · X-C-notes (C-07) · La frase final de la Card val amb
   sessió i sense: sense sessió (dades remotes) no hi ha «CREAR NOTA», i la
   Card no pot manar prémer-lo sense dir que primer cal entrar.
   O6-CLAUDE-2 (ordre del Mestre, Onada 6, 261103) · El paràgraf porta negretes d'escaneig: es compara
   el seu text, sense etiquetes. */
test('la frase final de la Card val per als dos casos: CREAR NOTA i, si no hi és, entrar abans', () => {
  const finals = NOTA_TUTORIAL.content.match(/<p>[\s\S]*?<\/p>/g)
    .map((p) => p.replace(/<[^>]+>/g, ''))
    .filter((p) => p.includes('CREAR NOTA'));
  expect(finals).toHaveLength(1);
  expect(finals[0]).toContain('si no hi veus el botó, primer entra amb el teu compte');
});

/* Gauntlet 261101 · X-C-notes (C-02) · A l'entrada nua la Card és la fitxa
   triada però «Tot» la deixa l'última (data de la llavor): la seua fila es
   desplaça a la vista dins de la columna de la llista (mai la finestra), i
   el focus no es mou. Amb un enllaç explícit, res. jsdom no té maquetació:
   una de mentida, amb la columna de 300 px i la fila de la Card a 900 px. */
function maquetacioDeLaColumna() {
  const desats = new WeakMap();
  const definix = (nom, get, set) => Object.defineProperty(HTMLElement.prototype, nom, { configurable: true, get, ...(set ? { set } : {}) });
  const esColumna = (el) => el.classList.contains('sdp-workspace-column__body');
  const esFilaDeLaCard = (el) => el.localName === 'li' && Boolean(el.querySelector(':scope > [data-kind="tutorial"]'));
  definix('scrollHeight', function scrollHeight() { return esColumna(this) ? 1200 : 0; });
  definix('clientHeight', function clientHeight() { return esColumna(this) ? 300 : 0; });
  definix('scrollTop', function scrollTop() { return desats.get(this) ?? 0; }, function scrollTop(valor) { desats.set(this, valor); });
  const rectAbans = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function rect() {
    const top = esFilaDeLaCard(this) ? 900 : 0;
    const height = esFilaDeLaCard(this) ? 240 : 0;
    return { top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {} };
  };
  return () => {
    for (const nom of ['scrollHeight', 'clientHeight', 'scrollTop']) delete HTMLElement.prototype[nom];
    HTMLElement.prototype.getBoundingClientRect = rectAbans;
  };
}

test('entrada nua: la fila de la Card es desplaça a la vista dins de la columna, sense moure el focus', () => {
  const restaura = maquetacioDeLaColumna();
  try {
    munta();
    const fila = card()[0].closest('li');
    const columna = fila.closest('.sdp-workspace-column__body');
    expect(columna.scrollTop).toBe(900);
    expect(document.activeElement).toBe(document.body);
    expect(fila.querySelector(':scope > span[hidden]')).not.toBeNull();
    // Triar una altra nota: la URL deixa de ser nua i el marcador se'n va.
    fireEvent.click(within(columnaNotes()).getByRole('button', { name: NOTA_A.title }));
    expect(fila.querySelector(':scope > span[hidden]')).toBeNull();
    cleanup();
    munta(`/notes?nota=${NOTA_A.id}`);
    fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
    const columnaDeLEnllac = card()[0].closest('.sdp-workspace-column__body');
    expect(columnaDeLEnllac.scrollTop).toBe(0);
  } finally {
    restaura();
  }
});

/* D-4 (decisió del Mestre, pla 261101_1246) · La Card «Bloc de notes» és
   sempre la primera fila de «Tot», amb qualsevol ordenació. Les dates de
   les notes sintètiques són més noves que la de la llavor (25-04-2026): sense
   la fixació, per data la Card era l'última. «Ametlers del barranc» va
   davant de «Bloc de notes» per nom: sense la fixació, per nom també perdia
   la primera fila. */
const NOTA_C = Object.freeze({ id: '0f0e0d0c-0b0a-4000-8000-0000000000c3', title: 'Ametlers del barranc', folderId: 'f-mur', updatedAt: '2026-10-31T09:00:00Z' });
const titolsDeLaLlista = () => within(columnaNotes()).getAllByRole('listitem')
  .map((fila) => fila.querySelector('.fitxa-de-prova')?.textContent ?? null)
  .filter(Boolean);

test('D-4 · per data, la Card és la primera fila de «Tot», davant de les notes més noves i de la «Nota sense títol»', () => {
  munta();
  const titols = titolsDeLaLlista();
  expect(titols[0]).toBe('Bloc de notes');
  expect(titols.indexOf('Bloc de notes')).toBeLessThan(titols.indexOf(NOTA_A.title));
  expect(titols.indexOf('Bloc de notes')).toBeLessThan(titols.indexOf('Nota sense títol'));
  // La resta, en l'ordre de sempre (per data): la més nova primer.
  expect(titols.indexOf(NOTA_A.title)).toBeLessThan(titols.indexOf(NOTA_B.title));
  // El rail de la llista (columna plegada) i les fletxes en seguixen el mateix ordre: UniversalWorkspace.fixatATot.test.jsx.
});

test('D-4 · per nom (A-Z), la Card també és la primera fila de «Tot»', () => {
  Object.assign(dades, { notes: [NOTA_A, NOTA_B, NOTA_C] });
  munta();
  fireEvent.click(within(columnaNotes()).getByRole('button', { name: 'Ordenar per data o nom' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nom (A-Z)' }));
  const titols = titolsDeLaLlista();
  expect(titols[0]).toBe('Bloc de notes');
  expect(titols[1]).toBe(NOTA_C.title);
  expect(titols.indexOf(NOTA_B.title)).toBeLessThan(titols.indexOf(NOTA_A.title));
});

test('D-4 · en mode «seed», la n1 de veres (editable) és la primera fila de «Tot»; dins de la seua carpeta, l’ordre de sempre', () => {
  Object.assign(dades, { config: { dataMode: 'seed' }, notes: [{ ...NOTA_TUTORIAL, folderId: 'f-mur' }, NOTA_A, NOTA_C] });
  munta();
  expect(card()[0].dataset.kind).toBe('note');
  expect(titolsDeLaLlista()[0]).toBe('Bloc de notes');
  // A la carpeta «Mur» la n1 no va fixada: per data, la nota més nova davant.
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mur' }));
  const titols = titolsDeLaLlista();
  expect(titols).toContain('Bloc de notes');
  expect(titols.indexOf(NOTA_C.title)).toBeLessThan(titols.indexOf('Bloc de notes'));
});

/* D-7 (pla 261101_1246; P1-71) · Si el proveïdor de dades del Bloc és de
   només lectura (sense IdentitatProvider), el Bloc es llig com un visitant:
   ni CREAR NOTA ni nota preparada, encara que hi haja sessió. La Card hi és i
   és la primera fila. La reserva per la identitat: NotesSection.senseIdentitat.test.jsx. */
test('D-7 · amb el Bloc de només lectura i sessió: cap CREAR NOTA ni nota preparada, i la Card dalt de «Tot»', () => {
  Object.assign(dades, { notes: [], nomesLectura: true });
  munta();
  expect(screen.queryByRole('button', { name: 'CREAR NOTA' })).toBeNull();
  expect(within(columnaNotes()).queryByRole('button', { name: 'Nota sense títol' })).toBeNull();
  expect(card()).toHaveLength(1);
  expect(titolsDeLaLlista()).toEqual(['Bloc de notes']);
  expect(detall()).toBe('card');
});

/* Al Snippet Curador (?mode=desa) no hi ha Card: NotesSection.test.jsx (model). */

/* T11-03 (Gemini, Tall 11; marató 261101_2143, ordre del Mestre) · D-M1, el
   defecte: en mode 'seed', arxivar, enviar a la paperera o esborrar la n1 de
   veres es recorda per àmbit (una preferència del dispositiu, storage.js), i
   la Card de lectura ja no torna a «Tot». Abans hi tornava fixada: el Bloc no
   distingia la n1 arxivada d'una llavor esborrada. La marca només val en
   'seed' i mai amaga la n1 si hi és. */
describe('T11-03 · la n1 retirada en mode «seed» no torna com a Card', () => {
  test('mode «seed» sense la n1 i amb la marca: cap Card a «Tot», i l’entrada nua obri una altra fila', () => {
    Object.assign(dades, { config: { dataMode: 'seed' }, notes: [NOTA_A, NOTA_B] });
    expect(marcaTutorialRetirada(AMBIT)).toBe(true);
    munta();
    expect(totPremut()).toBe(true);
    expect(card()).toHaveLength(0);
    expect(within(columnaNotes()).queryAllByRole('button').filter((boto) => boto.dataset.kind === KIND_TUTORIAL)).toHaveLength(0);
    expect(detall()).not.toBe('card');
    expect(within(columnaNotes()).getAllByRole('button').filter((boto) => boto.getAttribute('aria-current') === 'true')).toHaveLength(1);
  });

  test('mode «seed» sense la n1 i sense marca (una llavor esborrada sense cap acció): la Card hi és', () => {
    Object.assign(dades, { config: { dataMode: 'seed' }, notes: [NOTA_A, NOTA_B] });
    munta();
    expect(card()).toHaveLength(1);
    expect(card()[0].dataset.kind).toBe(KIND_TUTORIAL);
    expect(titolsDeLaLlista()[0]).toBe('Bloc de notes');
  });

  test('en remot, una marca del mateix àmbit no amaga la Card: només val en «seed»', () => {
    expect(marcaTutorialRetirada(AMBIT)).toBe(true);
    munta();
    expect(card()).toHaveLength(1);
    expect(card()[0].dataset.kind).toBe(KIND_TUTORIAL);
    expect(detall()).toBe('card');
  });

  test('la marca d’un altre àmbit (una altra identitat del dispositiu) no amaga la Card', () => {
    Object.assign(dades, { config: { dataMode: 'seed' }, notes: [NOTA_A, NOTA_B] });
    expect(marcaTutorialRetirada(ALTRE_AMBIT)).toBe(true);
    munta();
    expect(card()).toHaveLength(1);
  });

  test('mode «seed» amb la n1 a la llista i la marca: s’obri la n1 editable (la marca no l’amaga)', () => {
    Object.assign(dades, { config: { dataMode: 'seed' }, notes: [{ ...NOTA_TUTORIAL, folderId: 'f-mur' }, NOTA_A] });
    expect(marcaTutorialRetirada(AMBIT)).toBe(true);
    munta();
    expect(card()).toHaveLength(1);
    expect(card()[0].dataset.kind).toBe('note');
    expect(detall()).toBe('n1');
  });

  test('si la n1 ix de la llista amb el Bloc obert (arxivada), la Card no hi entra', () => {
    Object.assign(dades, { config: { dataMode: 'seed' }, notes: [{ ...NOTA_TUTORIAL, folderId: 'f-mur' }, NOTA_A] });
    const { torna } = munta();
    expect(card()[0].dataset.kind).toBe('note');
    // L'ordre del NotesProvider: la marca, i la llista sense la n1.
    expect(marcaTutorialRetirada(AMBIT)).toBe(true);
    Object.assign(dades, { notes: [NOTA_A] });
    act(() => { torna(); });
    expect(card()).toHaveLength(0);
  });
});

describe('T11-03 · la marca de la n1 retirada (notaTutorial.js)', () => {
  test('és per àmbit: la clau el porta i dos àmbits no es barregen', () => {
    expect(tutorialRetirada(AMBIT)).toBe(false);
    expect(marcaTutorialRetirada(AMBIT)).toBe(true);
    expect(tutorialRetirada(AMBIT)).toBe(true);
    expect(tutorialRetirada(ALTRE_AMBIT)).toBe(false);
    expect(getVal(`notes.tutorialRetirada.${AMBIT}`)).toBe(true);
    expect(getVal(`notes.tutorialRetirada.${ALTRE_AMBIT}`)).toBeNull();
  });

  test('sense àmbit (buit o no textual) no es llig ni s’escriu res', () => {
    for (const ambit of [undefined, null, '', 0, {}]) {
      expect(marcaTutorialRetirada(ambit)).toBe(false);
      expect(tutorialRetirada(ambit)).toBe(false);
    }
    expect(getVal('notes.tutorialRetirada.undefined')).toBeNull();
    expect(getVal('notes.tutorialRetirada.')).toBeNull();
  });

  test('només un true desat compta com a retirada', () => {
    expect(marcaTutorialRetirada(AMBIT)).toBe(true);
    delVal(`notes.tutorialRetirada.${AMBIT}`);
    expect(tutorialRetirada(AMBIT)).toBe(false);
    /* ARB-T11C-03 · Un valor cert que no és el booleà (la cadena 'true', un 1,
       un text o un objecte desats per una altra mà) no retira la n1. */
    for (const valor of ['true', 1, 'sí', {}]) {
      expect(setVal(`notes.tutorialRetirada.${AMBIT}`, valor)).toBe(true);
      expect(tutorialRetirada(AMBIT)).toBe(false);
    }
  });
});

/* T11-03 · El NotesProvider de veres (dades del Bloc simulades): l'acció
   explícita amb èxit sobre la n1 en 'seed' posa la marca de l'àmbit; una
   altra nota, un altre mode o una acció fallida, no. NotesContext escriu la
   clau sense importar notaTutorial.js (paquet d'arrencada): estes proves la
   lligen amb tutorialRetirada, i fixen que les dues casen. Els contextos de
   la interfície i de la sessió, amb els seus objectes (objectesDeContext.js). */
describe('T11-03 · NotesProvider: la marca naix de l’acció explícita sobre la n1', () => {
  const mou = vi.fn();
  const esborra = vi.fn();
  let avisos;
  const embolcall = ({ children }) => (
    <UIContext.Provider value={{ locale: 'ca', externalConfig: {} }}>
      <UIActionsContext.Provider value={{ normalizeSearchText: (text) => text, t: (_clau, reserva) => reserva }}>
        <SessionContext.Provider value={{ currentUser: null }}>
          <NotesProvider>{children}</NotesProvider>
        </SessionContext.Provider>
      </UIActionsContext.Provider>
    </UIContext.Provider>
  );
  const bloc = (config) => {
    dades.config = config;
    dades.dadesDelBloc = {
      notes: [{ ...NOTA_TUTORIAL, revision: 1 }, { ...NOTA_A, revision: 1 }], noteFolders: [], status: 'ready',
      scopeKey: AMBIT, workspaceKey: 'sessio-de-prova', notesComplete: true, mouNota: mou, esborraNota: esborra, updateNote: vi.fn()
    };
    return renderHook(() => React.useContext(NotesContext), { wrapper: embolcall }).result;
  };
  beforeEach(() => {
    mou.mockReset().mockImplementation(async (id, estat, revision) => ({ id, estat, revision: revision + 1 }));
    esborra.mockReset().mockImplementation(async (id) => ({ id }));
    avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => avisos.mockRestore());

  test.each(['arxivada', 'paperera'])('mode «seed»: moure la n1 a «%s» la marca a l’àmbit de la cua', async (estat) => {
    const ctx = bloc({ dataMode: 'seed' });
    await act(async () => { expect(await ctx.current.mouNota({ id: 'n1', revision: 1 }, estat)).toBe(true); });
    expect(mou).toHaveBeenCalledWith('n1', estat, 1);
    expect(tutorialRetirada(AMBIT)).toBe(true);
    expect(tutorialRetirada(ALTRE_AMBIT)).toBe(false);
  });

  test('mode «seed»: esborrar la n1 definitivament també la marca', async () => {
    const ctx = bloc({ dataMode: 'seed' });
    await act(async () => { expect(await ctx.current.esborraNota({ id: 'n1', revision: 1 })).toBe(true); });
    expect(esborra).toHaveBeenCalledWith('n1', 1);
    expect(tutorialRetirada(AMBIT)).toBe(true);
  });

  test('mode «seed»: arxivar o esborrar una altra nota no marca res', async () => {
    const ctx = bloc({ dataMode: 'seed' });
    await act(async () => { expect(await ctx.current.mouNota({ id: NOTA_A.id, revision: 1 }, 'arxivada')).toBe(true); });
    await act(async () => { expect(await ctx.current.esborraNota({ id: NOTA_B.id, revision: 1 })).toBe(true); });
    expect(tutorialRetirada(AMBIT)).toBe(false);
  });

  test.each(['remote', 'local'])('en mode «%s», arxivar o esborrar una nota amb l’id n1 no marca res', async (dataMode) => {
    const ctx = bloc({ dataMode });
    await act(async () => { expect(await ctx.current.mouNota({ id: 'n1', revision: 1 }, 'arxivada')).toBe(true); });
    await act(async () => { expect(await ctx.current.esborraNota({ id: 'n1', revision: 1 })).toBe(true); });
    expect(tutorialRetirada(AMBIT)).toBe(false);
  });

  test('si moure o esborrar la n1 falla, la n1 continua i no hi ha marca', async () => {
    mou.mockRejectedValue(new Error('disc ple'));
    esborra.mockRejectedValue(new Error('disc ple'));
    const ctx = bloc({ dataMode: 'seed' });
    await act(async () => { expect(await ctx.current.mouNota({ id: 'n1', revision: 1 }, 'arxivada')).toBe(false); });
    await act(async () => { expect(await ctx.current.esborraNota({ id: 'n1', revision: 1 })).toBe(false); });
    expect(tutorialRetirada(AMBIT)).toBe(false);
  });

  test('recuperar-la («activa») es refusa sense tocar la marca', async () => {
    const ctx = bloc({ dataMode: 'seed' });
    await act(async () => { expect(await ctx.current.mouNota({ id: 'n1', revision: 1 }, 'activa')).toBe(false); });
    expect(mou).not.toHaveBeenCalled();
    expect(tutorialRetirada(AMBIT)).toBe(false);
  });
});
