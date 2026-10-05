/* Revisió adversarial independent de F4, ronda 1 (bloquejant de Codex,
   relleus 16, 17, 21 i 22 de l'auditoria 261004_2240). Propòsit d'este
   fitxer: l'ORDRE D'ARRIBADA de Notes i de la font d'una publicació triada,
   amb StrictMode i sense. Mateix arnés que NotesSection.fontPublicacio.test.jsx
   (router en memòria i espai de treball de veres, fonts del MAS simulades).
   Dades sintètiques.

   On ha anat la resta de la ronda 1 (poliment de F4, 261005):
   · A1 (/notes amb el Mur carregant) ja era al fitxer base
     («l'entrada nua de /notes espera el Mur…»): ací en queda el control A0.
   · B1, B2, B3, G1, G2 i G3 eren les mateixes proves que la còpia literal de
     la proposta de Codex (NotesSection.fontPublicacio.sondaCodex.test.jsx:
     subcarpeta, nota publicada al Mur, snippet privat, nota ordinària sense
     bloqueig, llista parcial amb resolveNote i Reintentar de Notes). Es
     conserven allà, on són el contracte de l'altra part.
   · E1, E2 i E3 (ids vores) són entrades dels bucles R2 i R2c de
     NotesSection.fontPublicacio.revisio2.test.jsx.
   · C1, C2 i I1 (qui recarrega la font) viuen amb R4b i R5 al grup
     «Reintentar» de revisio2, que té l'arnés d'Arrere i els errors de font;
     C2 i I1 ja estan corregits i són proves positives.

   F1/F2 · L'autotria d'una carpeta pública pendent ara passa per la política
   opcional canAutoSelect del Workspace. Les regressions de baix acrediten
   que la preparada de reserva no es fixa abans que arribe la publicació,
   sense bloquejar una nota disponible ni una tria manual. */
import React, { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';

const ACTOR = { tipus: 'persona', id: 'uuid-prova', rol: 'persona' };
const ALTRES = [{ id: 'uuid-a', title: 'Llista de la compra', folderId: 'f-notes', updatedAt: '2026-01-03T09:00:00Z' }];
const FOTO = { id: 'media-one', title: 'Foto del bancal', ownerUserId: ACTOR.id, kind: 'image', src: '/a.jpg' };
const POST = { id: 'p2', title: 'Directa', ownerUserId: ACTOR.id };
const BUIT = Object.freeze([]);
const FOTO_ID = 'publicacio:multimedia:media-one';

const dades = vi.hoisted(() => ({}));
const inicial = () => Object.assign(dades, {
  notes: ALTRES, notesStatus: 'ready', notesComplete: true,
  resolveNote: vi.fn(async () => ({ status: 'not-found' })),
  murStatus: 'ready', feed: BUIT, mercat: BUIT, events: BUIT, murRefresh: vi.fn(),
  mediaStatus: 'ready', media: BUIT, mediaRefresh: vi.fn()
});
inicial();

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: [], status: dades.notesStatus, canCreate: true, teSessio: true,
    notesComplete: dades.notesComplete, resolveNote: dades.resolveNote, refresh: () => {}, error: null,
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
vi.mock('./SnippetCurador.jsx', () => ({ SnippetCurador: () => <p data-testid="curador">Snippet privat</p> }));
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
const arbre = (ruta, estricte) => {
  const nucli = (
    <MemoryRouter rutaInicial={ruta}>
      <NotesSection />
      <Sonda />
    </MemoryRouter>
  );
  return estricte ? <StrictMode>{nucli}</StrictMode> : nucli;
};
const munta = (ruta, { estricte = false } = {}) => {
  const vista = render(arbre(ruta, estricte));
  return () => vista.rerender(arbre(ruta, estricte));
};
const nota = () => new URL(screen.getByTestId('url').textContent, 'http://localhost').searchParams.get('nota');
const detall = () => screen.queryByTestId('detall')?.textContent ?? null;
const rail = () => screen.getByRole('navigation', { name: 'CARPETES' });

/* ── A · L'entrada nua de /notes amb el Mur llest primer ─────────────────
   Control de la parella del fitxer base (allà, el Mur carregant no hi fixa
   la nota preparada): ací el Mur arriba abans i s'obri la seua publicació. */
test('A0 (control) · /notes amb el Mur llest primer obri la publicació del Mur', () => {
  Object.assign(dades, { feed: [POST] });
  munta('/notes');
  expect(nota()).toBe('publicacio:mur:p2');
  expect(detall()).toBe('publicacio:mur:p2');
});

/* ── D · StrictMode en el camí bo ────────────────────────────────────────── */
test('D1 · StrictMode: la sonda de Codex (Multimèdia carregant → llesta) conserva l’id i obri la foto', () => {
  Object.assign(dades, { notes: [], mediaStatus: 'loading' });
  const repinta = munta(`/notes?carpeta=f-media&nota=${encodeURIComponent(FOTO_ID)}`, { estricte: true });
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBeNull();
  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(dades.resolveNote).not.toHaveBeenCalled();
});

test('D2 · StrictMode: una foto oberta es conserva mentre Multimèdia recarrega', () => {
  Object.assign(dades, { media: [FOTO] });
  const repinta = munta(`/notes?carpeta=f-media&nota=${encodeURIComponent(FOTO_ID)}`, { estricte: true });
  expect(detall()).toBe(FOTO_ID);
  Object.assign(dades, { mediaStatus: 'loading', media: BUIT });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
});

/* ── H · Notes i la font carregant alhora, en els dos ordres d'arribada ─── */
test('H1 · Notes i Multimèdia carregant → Notes llestes → Multimèdia llesta: l’id es queda i la foto s’obri', () => {
  Object.assign(dades, { notesStatus: 'loading', mediaStatus: 'loading' });
  const repinta = munta(`/notes?carpeta=f-media&nota=${encodeURIComponent(FOTO_ID)}`);
  expect(nota()).toBe(FOTO_ID);
  Object.assign(dades, { notesStatus: 'ready' });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBeNull();
  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(dades.resolveNote).not.toHaveBeenCalled();
});

test('H2 · Multimèdia llesta primer i Notes després: l’id es queda i la foto s’obri', () => {
  Object.assign(dades, { notesStatus: 'loading', media: [FOTO] });
  const repinta = munta(`/notes?carpeta=f-media&nota=${encodeURIComponent(FOTO_ID)}`);
  Object.assign(dades, { notesStatus: 'ready' });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
});

/* F1/F2 · Regressions de la selecció automàtica, després del relleu 08. */
test('F1 · una nota fantasma a Multimèdia no fixa la preparada abans que arribe la foto', () => {
 Object.assign(dades,{mediaStatus:'loading'});
 const repinta=munta('/notes?carpeta=f-media&nota=fantasma');
 expect(nota()).toBe('fantasma');
 Object.assign(dades,{mediaStatus:'ready',media:[FOTO]});repinta();
 expect(nota()).toBe(FOTO_ID);expect(detall()).toBe(FOTO_ID);
 expect(dades.mediaRefresh).not.toHaveBeenCalled();
});
test('F2 · triar Multimèdia pendent conserva la carpeta sense preparada i obri la foto quan arriba', () => {
 Object.assign(dades,{mediaStatus:'loading'});
 const repinta=munta('/notes?carpeta=f-notes&nota=uuid-a');
 fireEvent.click(within(rail()).getByRole('button',{name:'Multimèdia'}));
 expect(nota()).toBeNull();
 Object.assign(dades,{mediaStatus:'ready',media:[FOTO]});repinta();
 expect(nota()).toBe(FOTO_ID);expect(detall()).toBe(FOTO_ID);
 expect(dades.mediaRefresh).not.toHaveBeenCalled();
});

for(const source of ['media','mur'])for(const status of ['loading','revalidating','error']) {
 test(`F4-autotria · rail ${source} ${status} espera la peça en StrictMode sense recàrrega automàtica`,()=>{
  const folder=source==='media'?'f-media':'f-mur',name=source==='media'?'Multimèdia':'Mur';
  Object.assign(dades,{[`${source}Status`]:status});
  const repinta=munta('/notes?carpeta=f-notes&nota=uuid-a',{estricte:true});
  fireEvent.click(within(rail()).getByRole('button',{name}));expect(nota()).toBeNull();
  const collection=source==='media'?'media':'feed',item=source==='media'?FOTO:POST;
  Object.assign(dades,{[`${source}Status`]:'ready',[collection]:[item]});repinta();
  const id=source==='media'?FOTO_ID:'publicacio:mur:p2';
  expect(nota()).toBe(id);expect(detall()).toBe(id);
  expect(new URL(screen.getByTestId('url').textContent,'http://localhost').searchParams.get('carpeta')).toBe(folder);
  expect(dades.mediaRefresh).not.toHaveBeenCalled();expect(dades.murRefresh).not.toHaveBeenCalled();
  expect(dades.resolveNote).not.toHaveBeenCalled();
 });
}
for(const status of ['loading','revalidating','error'])test(`F4-autotria · una nota ordinària de la carpeta ${status} continua obrint-se`,()=>{
 Object.assign(dades,{mediaStatus:status,notes:[...ALTRES,{id:'nota-media',folderId:'f-media',title:'Nota pròpia'}]});
 const repinta=munta('/notes?carpeta=f-notes&nota=uuid-a');
 fireEvent.click(within(rail()).getByRole('button',{name:'Multimèdia'}));
 expect(nota()).toBe('nota-media');expect(detall()).toBe('nota-media');
 Object.assign(dades,{mediaStatus:'ready',media:[FOTO]});repinta();
 expect(nota()).toBe('nota-media');expect(detall()).toBe('nota-media');
 expect(dades.mediaRefresh).not.toHaveBeenCalled();
});
test('F4-autotria · CREAR NOTA continua triant la preparada amb la font pendent',async ()=>{
 Object.assign(dades,{mediaStatus:'loading'});
 const repinta=munta('/notes?carpeta=f-media');
 expect(nota()).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'CREAR NOTA'}));
 await waitFor(()=>expect(nota()).toMatch(/^[0-9a-f-]{36}$/));
 const id=nota();expect(detall()).toBe(id);
 Object.assign(dades,{mediaStatus:'ready',media:[FOTO]});repinta();
 expect(nota()).toBe(id);expect(detall()).toBe(id);expect(dades.mediaRefresh).not.toHaveBeenCalled();
});

/* Una tria manual en una carpeta no autoritza el fallback de la següent. */
for (const source of ['media', 'mur']) {
  test(`F4-transició · crear a Notes i després triar ${source} pendent espera la publicació`, async () => {
    const name = source === 'media' ? 'Multimèdia' : 'Mur';
    const folder = source === 'media' ? 'f-media' : 'f-mur';
    const collection = source === 'media' ? 'media' : 'feed';
    const publicacio = source === 'media' ? FOTO : POST;
    const publicacioId = source === 'media' ? FOTO_ID : 'publicacio:mur:p2';
    Object.assign(dades, { [`${source}Status`]: 'loading' });
    const repinta = munta('/notes?carpeta=f-notes&nota=uuid-a', { estricte: true });
    fireEvent.click(screen.getByRole('button', { name: 'CREAR NOTA' }));
    await waitFor(() => expect(nota()).toMatch(/^[0-9a-f-]{36}$/));
    const preparadaId = nota();
    expect(detall()).toBe(preparadaId);
    fireEvent.click(within(rail()).getByRole('button', { name }));
    expect(nota()).toBeNull();
    expect(new URL(screen.getByTestId('url').textContent, 'http://localhost').searchParams.get('carpeta')).toBe(folder);
    Object.assign(dades, { [`${source}Status`]: 'ready', [collection]: [publicacio] });
    repinta();
    expect(nota()).toBe(publicacioId);
    expect(detall()).toBe(publicacioId);
    expect(dades.mediaRefresh).not.toHaveBeenCalled();
    expect(dades.murRefresh).not.toHaveBeenCalled();
    expect(dades.resolveNote).not.toHaveBeenCalled();
  });
}
