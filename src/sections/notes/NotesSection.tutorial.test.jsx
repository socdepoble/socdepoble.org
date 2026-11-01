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
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({
  notes: [], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, buit: [],
  detalls: []
}));
const NOTA_A = Object.freeze({ id: '0f0e0d0c-0b0a-4000-8000-0000000000a1', title: 'Llista de la compra', folderId: 'f-notes', updatedAt: '2026-10-30T09:00:00Z' });
const NOTA_B = Object.freeze({ id: '0f0e0d0c-0b0a-4000-8000-0000000000b2', title: 'Festes de la Torre', folderId: 'f-pobles', updatedAt: '2026-10-29T09:00:00Z' });

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.buit, status: dades.status, canCreate: dades.canCreate, teSessio: dades.teSessio,
    notesComplete: true, config: dades.config, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: vi.fn(async (entrada) => ({ ...entrada, revision: 1 })), setLocalNoteField: vi.fn(),
    resolveNote: vi.fn(async () => ({ status: 'not-found' }))
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config }) }));
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
import { KIND_TUTORIAL, NOTA_TUTORIAL } from './notaTutorial.js';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  Object.assign(dades, { notes: [NOTA_A, NOTA_B], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, detalls: [] });
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
   Card no pot manar prémer-lo sense dir que primer cal entrar. */
test('la frase final de la Card val per als dos casos: CREAR NOTA i, si no hi és, entrar abans', () => {
  const finals = NOTA_TUTORIAL.content.match(/<p>[^<]*CREAR NOTA[^<]*<\/p>/g);
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

/* Al Snippet Curador (?mode=desa) no hi ha Card: NotesSection.test.jsx (model). */
