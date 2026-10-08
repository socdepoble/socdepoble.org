/* F4 (bloquejant de Codex, relleus 16, 17 i 21 de l'auditoria 261004_2240;
   sonda /tmp/sdp-a2-review-pMQehY/f4-media-load-probe.test.jsx, feta
   persistent) · Una publicació del MAS és de la seua font (MurContext o
   MultimediaContext), que exposa [] fora de 'ready'. Amb el router en memòria
   i l'espai de treball de veres: mentre la font de la publicació triada
   carrega o falla, la tria no es dona per absent ni es resol com a nota
   privada; l'id es queda a la URL i el detall no és cap nota aliena. Una nota
   ordinària no espera fonts alienes. Dades sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';

const ACTOR = { tipus: 'persona', id: 'uuid-prova', rol: 'persona' };
const NOTES = [
  { id: 'n1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' },
  { id: 'n2', title: 'Segona', folderId: 'f-mur', updatedAt: '2026-01-02T09:00:00Z' }
];
const FOTO = { id: 'media-one', title: 'Foto del bancal', ownerUserId: ACTOR.id, kind: 'image', src: '/a.jpg' };
const POST = { id: 'p2', title: 'Directa', ownerUserId: ACTOR.id };
const BUIT = Object.freeze([]);

/* Cada llista és la mateixa referència entre pintades, com als contextos de
   veres (memo): només canvia quan la prova canvia l'estat de la font. */
const dades = vi.hoisted(() => ({}));
const inicial = () => Object.assign(dades, {
  notes: NOTES, notesComplete: true, resolveNote: vi.fn(async () => ({ status: 'not-found' })),
  murStatus: 'ready', feed: BUIT, mercat: BUIT, events: BUIT, murRefresh: vi.fn(),
  mediaStatus: 'loading', media: BUIT, mediaRefresh: vi.fn()
});
inicial();

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: [], status: 'ready', canCreate: true, teSessio: true,
    notesComplete: dades.notesComplete, resolveNote: dades.resolveNote,
    obriConfiguracioNotes: () => {}, creaNota: async () => ({ id: 'nova' })
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'remote' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: ACTOR, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({ status: dades.murStatus, refresh: dades.murRefresh, sortedFeedPosts: dades.feed, sortedEvents: dades.events, sortedMarketItems: dades.mercat })
}));
vi.mock('../multimedia/MultimediaContext.jsx', () => ({
  useMultimedia: () => ({ status: dades.mediaStatus, refresh: dades.mediaRefresh, mediaItems: dades.media })
}));
vi.mock('./NotesDetail.jsx', () => ({ default: ({ activeNote }) => <p data-testid="detall">{activeNote?.id ?? 'cap'}</p> }));
vi.mock('./PublicacioDetall.jsx', () => ({
  PublicacioDetall: ({ item }) => <p data-testid="detall">{item.id}</p>,
  PublicacioFitxa: ({ item, active, onSelect }) => (
    <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => {
  cleanup();
  inicial();
});

function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>;
}
const arbre = (ruta) => (
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
    <Sonda />
  </MemoryRouter>
);
/* Munta la ruta i torna `repinta`: la font canvia d'estat i el Bloc es torna
   a pintar amb el mateix router (la mateixa entrada de l'historial). */
const munta = (ruta) => {
  const vista = render(arbre(ruta));
  return () => vista.rerender(arbre(ruta));
};
const nota = () => new URL(screen.getByTestId('url').textContent, 'http://localhost').searchParams.get('nota');
const detall = () => screen.queryByTestId('detall')?.textContent ?? null;
const ruta = (id, carpeta) => `/notes?carpeta=${carpeta}&nota=${encodeURIComponent(id)}`;
const FOTO_ID = 'publicacio:multimedia:media-one';

test('sonda de Codex · un enllaç copiat a una foto sobreviu a Multimèdia carregant amb les notes ja llestes', () => {
  // Les dades de la sonda: cap nota, notes llestes i completes, Multimèdia carregant.
  Object.assign(dades, { notes: [] });
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  const abans = nota();
  expect(nota()).toBe(FOTO_ID);
  // El detall espera la font: ni la nota preparada ni cap altra nota.
  expect(detall()).toBeNull();
  expect(screen.getByText('Carregant…')).toBeTruthy();
  // Cap id virtual va al port de notes.
  expect(dades.resolveNote).not.toHaveBeenCalled();

  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  // L'asserció literal de la sonda.
  expect({ abans, despres: nota() }).toEqual({ abans: FOTO_ID, despres: FOTO_ID });
  expect(detall()).toBe(FOTO_ID);
});

test('el mateix patró al Mur: una publicació del Mur no salta a n1 mentre el Mur carrega', () => {
  Object.assign(dades, { murStatus: 'loading' });
  const repinta = munta(ruta('publicacio:mur:p2', 'f-mur'));
  expect(nota()).toBe('publicacio:mur:p2');
  expect(detall()).toBeNull();

  Object.assign(dades, { murStatus: 'ready', feed: [POST] });
  repinta();
  expect(nota()).toBe('publicacio:mur:p2');
  expect(detall()).toBe('publicacio:mur:p2');
});

/* Totes les seccions del MAS i tots els estats pendents ('revalidating' encara
   no l'emet cap font: es llig si arriba). */
const PER_SECCIO = {
  mur: { carpeta: 'f-mur', estat: 'murStatus', llista: 'feed' },
  mercat: { carpeta: 'f-mercat', estat: 'murStatus', llista: 'mercat' },
  events: { carpeta: 'f-events', estat: 'murStatus', llista: 'events' },
  multimedia: { carpeta: 'f-media', estat: 'mediaStatus', llista: 'media' }
};
for (const [seccio, { carpeta, estat, llista }] of Object.entries(PER_SECCIO)) {
  for (const pendent of ['loading', 'revalidating', 'error']) {
    test(`${seccio} · ${pendent} → ready: l’id copiat es queda i la publicació s’obri`, () => {
      const id = `publicacio:${seccio}:peca`;
      Object.assign(dades, { [estat]: pendent });
      const repinta = munta(ruta(id, carpeta));
      expect(nota()).toBe(id);
      expect(detall()).toBeNull();

      Object.assign(dades, { [estat]: 'ready', [llista]: [{ id: 'peca', title: 'Peça pròpia', ownerUserId: ACTOR.id }] });
      repinta();
      expect(nota()).toBe(id);
      expect(detall()).toBe(id);
      expect(dades.resolveNote).not.toHaveBeenCalled();
    });
  }
}

test('una foto ja oberta no es perd quan Multimèdia torna a carregar o falla: es conserva l’última vista', () => {
  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  expect(detall()).toBe(FOTO_ID);

  // La font torna a 'loading' amb []. Decisió 2 del Mestre (261007) · Una
  // recàrrega ja conserva 'ready' (useScopedResource.js); 'loading' només ix
  // per aïllament o des d'un error, i el Bloc s'hi ha de comportar igual.
  Object.assign(dades, { mediaStatus: 'loading', media: BUIT });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);

  // La recàrrega falla: continua l'última vista.
  Object.assign(dades, { mediaStatus: 'error' });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);

  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
});

test('amb la font en error, l’id es queda i el detall ho diu; Reintentar recarrega la font', async () => {
  Object.assign(dades, { mediaStatus: 'error' });
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  const avis = await screen.findByRole('alert');
  expect(avis.textContent).toContain('No s’ha pogut obrir l’element.');
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBeNull();
  // Mostrar l'error no recarrega res tot sol.
  expect(dades.mediaRefresh).not.toHaveBeenCalled();

  fireEvent.click(within(avis).getByRole('button', { name: 'Reintentar' }));
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
  expect(nota()).toBe(FOTO_ID);

  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(dades.resolveNote).not.toHaveBeenCalled();
});

test('una nota ordinària no espera Multimèdia: s’obri, i una absent cau a la primera com sempre', () => {
  munta(ruta('n2', 'f-mur'));
  expect(nota()).toBe('n2');
  expect(detall()).toBe('n2');
  cleanup();

  munta(ruta('fantasma', 'f-mur'));
  expect(nota()).toBe('n1');
  expect(detall()).toBe('n1');
  expect(dades.resolveNote).not.toHaveBeenCalled();
});

/* Les fonts no són exhaustives (el port limita cada secció a 50; fase 2) i
   no hi ha resolució per ID: una font llesta que no porta la publicació no
   en demostra l'absència. L'id es queda i el detall ho diu; mai salta a una
   altra peça ni pregunta al port de notes. */
for (const completa of [true, false]) {
  test(`amb notesComplete=${completa}, una publicació que la font llesta no porta es queda a la URL amb l’avís, sense resolveNote`, async () => {
    Object.assign(dades, { notesComplete: completa });
    const repinta = munta(ruta(FOTO_ID, 'f-media'));
    expect(nota()).toBe(FOTO_ID);

    // La font arriba i el mitjà que porta no és de l'actor.
    Object.assign(dades, { mediaStatus: 'ready', media: [{ ...FOTO, ownerUserId: 'uuid-altri' }] });
    repinta();
    const avis = await screen.findByRole('alert');
    expect(avis.textContent).toContain('No s’ha pogut obrir l’element.');
    expect(screen.queryByText('L’element no és accessible o ja no existix.')).toBeNull();
    expect(nota()).toBe(FOTO_ID);
    expect(detall()).toBeNull();
    expect(dades.resolveNote.mock.calls.map(([id]) => id)).not.toContain(FOTO_ID);
  });
}

test('entrar a la carpeta Multimèdia abans de la seua font no hi fixa la nota preparada: espera i obri la foto', () => {
  const repinta = munta('/notes?carpeta=f-media');
  expect(nota()).toBeNull();
  expect(detall()).toBeNull();
  expect(screen.getByText('Carregant…')).toBeTruthy();

  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
});

test('entrar a la carpeta Multimèdia amb la font en error: cap nota preparada, l’avís amb Reintentar recarrega la font', () => {
  Object.assign(dades, { mediaStatus: 'error' });
  const repinta = munta('/notes?carpeta=f-media');
  expect(nota()).toBeNull();
  expect(detall()).toBeNull();
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toContain('No s’han pogut carregar les dades.');
  fireEvent.click(within(avis).getByRole('button', { name: 'Reintentar' }));
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);

  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
});

test('una nota de la carpeta d’entrada no espera la font: va davant de les publicacions', () => {
  Object.assign(dades, { notes: [...NOTES, { id: 'n3', title: 'Pròpia', folderId: 'f-media' }], mediaStatus: 'error' });
  munta('/notes?carpeta=f-media');
  expect(nota()).toBe('n3');
  expect(detall()).toBe('n3');
  expect(screen.queryByRole('alert')).toBeNull();
});

/* Revisió de F4 (ronda 1, A1; relleu 22 de Codex) · L'entrada nua de /notes
   pinta activa la primera carpeta (Mur), com /notes?carpeta=f-mur, i ha
   d'esperar igual la seua font: el resultat no pot dependre de l'ordre
   d'arribada. Sense n1, perquè l'efecte de n1 no tape l'espera. */
const SENSE_N1 = [{ id: 'uuid-a', title: 'Llista de la compra', folderId: 'f-notes', updatedAt: '2026-01-03T09:00:00Z' }];

test('l’entrada nua de /notes espera el Mur com /notes?carpeta=f-mur: cap nota preparada fixada, i en arribar s’obri la publicació', () => {
  Object.assign(dades, { notes: SENSE_N1, murStatus: 'loading' });
  const repinta = munta('/notes');
  expect(nota()).toBeNull();
  expect(detall()).toBeNull();
  expect(screen.getByText('Carregant…')).toBeTruthy();

  Object.assign(dades, { murStatus: 'ready', feed: [POST] });
  repinta();
  expect(nota()).toBe('publicacio:mur:p2');
  expect(detall()).toBe('publicacio:mur:p2');
  expect(dades.resolveNote).not.toHaveBeenCalled();
});

test('l’entrada nua de /notes amb el Mur en error: l’avís amb Reintentar recarrega el Mur, no Multimèdia', () => {
  Object.assign(dades, { notes: SENSE_N1, murStatus: 'error' });
  munta('/notes');
  expect(nota()).toBeNull();
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toContain('No s’han pogut carregar les dades.');
  fireEvent.click(within(avis).getByRole('button', { name: 'Reintentar' }));
  expect(dades.murRefresh).toHaveBeenCalledTimes(1);
  expect(dades.mediaRefresh).not.toHaveBeenCalled();
});

test('l’entrada nua de /notes no espera Multimèdia, que no és la carpeta d’entrada: amb el Mur llest s’obri la nota preparada', () => {
  // mediaStatus continua 'loading' (inicial).
  Object.assign(dades, { notes: SENSE_N1 });
  munta('/notes');
  expect(nota()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(detall()).toBe(nota());
  expect(screen.queryByText('Carregant…')).toBeNull();
});

test('l’entrada nua de /notes amb n1 l’obri com sempre encara que el Mur carregue', () => {
  Object.assign(dades, { murStatus: 'loading' });
  munta('/notes');
  expect(nota()).toBe('n1');
  expect(detall()).toBe('n1');
});
