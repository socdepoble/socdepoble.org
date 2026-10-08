/* Revisió adversarial independent de F4, ronda 2 (bloquejant de Codex,
   relleus 16 i 17 de l'auditoria 261004_2240; sonda
   /tmp/sdp-a2-review-pMQehY/f4-media-load-probe.test.jsx). Propòsit d'este
   fitxer: les VORES de la selecció d'una publicació, amb l'actor i
   l'historial mutables i els errors de cada font: ordre d'arribada de les
   tres fonts (R1), ids amb paraules clau i prefixos malformats (R2), canvi
   d'identitat (R3), Arrere/Avant (R4), qui recarrega la font (Reintentar),
   l'entrada que espera (R6), StrictMode (R7) i, de la sonda de Codex que
   el `test.only` deixava sense executar, el contracte de F2 amb Multimèdia
   carregant (R8; la resta ja la cobrix NotesSection.url.test.jsx). Mateix
   arnés que NotesSection.fontPublicacio.test.jsx (router en memòria i espai
   de treball de veres, fonts del MAS simulades).
   Poliment de F4 (261005) · Les observacions R2d, R4b i R6c d'esta ronda, i
   C2 i I1 de la ronda 1, ja estan corregides: són proves positives, cap
   test.fails. E1, E2 i E3 de la ronda 1 són entrades dels bucles R2 i R2c, i
   C1, C2 i I1 viuen ací al grup «Reintentar» (vegeu la capçalera de
   NotesSection.fontPublicacio.revisio.test.jsx). Dades sintètiques. */
import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';

const PERSONA = Object.freeze({ tipus: 'persona', id: 'uuid-prova', rol: 'persona' });
const ENTITAT = Object.freeze({ tipus: 'entitat', id: 'uuid-entitat', rol: 'entitat' });
const ALTRES = [{ id: 'uuid-a', title: 'Llista de la compra', folderId: 'f-notes', updatedAt: '2026-01-03T09:00:00Z' }];
const FOTO = { id: 'media-one', title: 'Foto del bancal', ownerUserId: PERSONA.id, kind: 'image', src: '/a.jpg' };
const POST = { id: 'p2', title: 'Directa', ownerUserId: PERSONA.id };
const BUIT = Object.freeze([]);
const FOTO_ID = 'publicacio:multimedia:media-one';

const dades = vi.hoisted(() => ({}));
const inicial = () => Object.assign(dades, {
  actor: PERSONA,
  notes: ALTRES, noteFolders: [], notesStatus: 'ready', notesComplete: true, notesRefresh: vi.fn(), notesError: null,
  resolveNote: vi.fn(async () => ({ status: 'not-found' })),
  murStatus: 'ready', murError: null, feed: BUIT, mercat: BUIT, events: BUIT, murRefresh: vi.fn(),
  mediaStatus: 'ready', mediaError: null, media: BUIT, mediaRefresh: vi.fn()
});
inicial();

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.noteFolders, status: dades.notesStatus, canCreate: true, teSessio: true,
    notesComplete: dades.notesComplete, resolveNote: dades.resolveNote, refresh: dades.notesRefresh,
    error: dades.notesError,
    obriConfiguracioNotes: () => {}, creaNota: async () => ({ id: 'nova' })
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'remote' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: dades.actor, memberships: [] }) }));
/* Com MurContext i MultimediaContext de veres: l'error de la font és el
   rebuig capturat per useScopedResource, un objecte nou a cada fallada. */
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({
    status: dades.murStatus, error: dades.murError, refresh: dades.murRefresh,
    sortedFeedPosts: dades.feed, sortedEvents: dades.events, sortedMarketItems: dades.mercat
  })
}));
vi.mock('../multimedia/MultimediaContext.jsx', () => ({
  useMultimedia: () => ({ status: dades.mediaStatus, error: dades.mediaError, refresh: dades.mediaRefresh, mediaItems: dades.media })
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

/* La URL de l'entrada actual del router, un Arrere i un Avant. */
function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
      <button type="button" onClick={() => navigate(1)}>Avant de prova</button>
    </>
  );
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
const url = () => screen.getByTestId('url').textContent;
const nota = () => new URL(url(), 'http://localhost').searchParams.get('nota');
const carpetaUrl = () => new URL(url(), 'http://localhost').searchParams.get('carpeta');
const detall = () => screen.queryByTestId('detall')?.textContent ?? null;
const rail = () => screen.getByRole('navigation', { name: 'CARPETES' });
const ruta = (id, carpeta) => (carpeta ? `/notes?carpeta=${carpeta}&nota=${encodeURIComponent(id)}` : `/notes?nota=${encodeURIComponent(id)}`);
const arrere = () => act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });

/* ── R1 · Ordre d'arribada: les tres fonts alhora ─────────────────────────── */
test('R1a · foto oberta; Notes i Multimèdia revaliden alhora; Notes arriba primer: la foto es conserva', () => {
  Object.assign(dades, { media: [FOTO] });
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  expect(detall()).toBe(FOTO_ID);
  Object.assign(dades, { notesStatus: 'loading', mediaStatus: 'loading', media: BUIT });
  repinta();
  Object.assign(dades, { notesStatus: 'ready' });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(dades.resolveNote).not.toHaveBeenCalled();
});

test('R1b · la foto no espera el Mur: Mur carregant i Multimèdia llesta l’obrin de seguida', () => {
  Object.assign(dades, { murStatus: 'loading', media: [FOTO] });
  munta(ruta(FOTO_ID, 'f-media'));
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(dades.murRefresh).not.toHaveBeenCalled();
});

test('R1c · una publicació del Mur no espera Multimèdia: Multimèdia en error i el Mur llest l’obrin sense avís', () => {
  Object.assign(dades, { mediaStatus: 'error', feed: [POST] });
  munta(ruta('publicacio:mur:p2', 'f-mur'));
  expect(nota()).toBe('publicacio:mur:p2');
  expect(detall()).toBe('publicacio:mur:p2');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(dades.mediaRefresh).not.toHaveBeenCalled();
});

test('R1d · enllaç a la foto sense carpeta, amb n1 i Multimèdia carregant: no salta a n1 i obri la foto a Multimèdia', () => {
  Object.assign(dades, { notes: [{ id: 'n1', title: 'Primera', folderId: 'f-mur' }], mediaStatus: 'loading' });
  const repinta = munta(ruta(FOTO_ID));
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBeNull();
  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
});

test('R1e · foto oberta del Mur: la recàrrega del Mur (publicar) no la perd', () => {
  Object.assign(dades, { feed: [POST] });
  const repinta = munta(ruta('publicacio:mur:p2', 'f-mur'));
  expect(detall()).toBe('publicacio:mur:p2');
  Object.assign(dades, { murStatus: 'loading', feed: BUIT });
  repinta();
  expect(nota()).toBe('publicacio:mur:p2');
  expect(detall()).toBe('publicacio:mur:p2');
  Object.assign(dades, { murStatus: 'ready', feed: [POST] });
  repinta();
  expect(detall()).toBe('publicacio:mur:p2');
});

/* ── R2 · Ids i noms de fitxer amb paraules clau ───────────────────────────
   'a:b' és E2 de la ronda 1 (un id de mitjà amb dos punts). */
const IDS_PARANYS = ['loading', 'error', 'n1', 'publicacio:mur:p2', 'a:b', 'a/b', 'a?b&c=d#e', 'foto amb espais.jpg', 'ñandú·l·l', '%2F', '__proto__'];
for (const idMitja of IDS_PARANYS) {
  test(`R2 · mitjà amb id ${JSON.stringify(idMitja)}: loading → ready conserva l’id i l’obri`, () => {
    const id = `publicacio:multimedia:${idMitja}`;
    Object.assign(dades, { mediaStatus: 'loading', murStatus: 'ready' });
    const repinta = munta(ruta(id, 'f-media'));
    expect(nota()).toBe(id);
    expect(detall()).toBeNull();
    Object.assign(dades, { mediaStatus: 'ready', media: [{ ...FOTO, id: idMitja, src: `/${idMitja}` }] });
    repinta();
    expect(nota()).toBe(id);
    expect(detall()).toBe(id);
    expect(dades.resolveNote).not.toHaveBeenCalled();
  });
}

test('R2b · id niat publicacio:multimedia:publicacio:mur:p2 espera Multimèdia, no el Mur', () => {
  const id = 'publicacio:multimedia:publicacio:mur:p2';
  Object.assign(dades, { mediaStatus: 'ready', murStatus: 'loading' });
  munta(ruta(id, 'f-media'));
  // Multimèdia llesta sense la peça: avís, no «Carregant…» per culpa del Mur.
  expect(nota()).toBe(id);
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
});

/* Una secció sense font coneguda: 'receptes' i 'constructor' són E1 i E3 de
   la ronda 1; la resta, noms de propietats del prototip i caixes errònies. */
for (const seccio of ['receptes', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf', 'toString', 'Mur', 'MULTIMEDIA']) {
  test(`R2c · secció ${seccio}: avís sense resolveNote ni excepció`, () => {
    const id = `publicacio:${seccio}:x`;
    munta(ruta(id, 'f-notes'));
    expect(nota()).toBe(id);
    expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
    expect(dades.resolveNote).not.toHaveBeenCalled();
  });
}

/* R2d (corregit al poliment de F4) · Un id amb el prefix però mal format
   (secció buida o sense tercer segment) no casa amb PREFIX_PUBLICACIO
   (masDeLUsuari.js) i abans es tractava com una nota: amb la llista parcial
   anava a resolveNote. Ara el camí el decidix el prefix (esIdDePublicacio,
   com la proposta de Codex amb startsWith('publicacio:')): via de
   publicació sense font, com una secció desconeguda. Amb la llista completa
   és el canvi visible declarat a NotesSection.jsx: ja no cau a la primera
   nota, es queda amb l'avís. */
for (const id of ['publicacio::x', 'publicacio:mur']) {
  test(`R2d · ${id} amb la llista parcial va per la via de publicació: l’avís, l’id es queda i no va a resolveNote`, () => {
    Object.assign(dades, { notesComplete: false });
    munta(ruta(id, 'f-notes'));
    expect(nota()).toBe(id);
    expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
    expect(dades.resolveNote.mock.calls.map(([crida]) => crida)).not.toContain(id);
  });

  test(`R2d · ${id} amb la llista completa tampoc cau a la primera nota: es queda amb l’avís`, () => {
    munta(ruta(id, 'f-notes'));
    expect(nota()).toBe(id);
    expect(detall()).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
    expect(dades.resolveNote).not.toHaveBeenCalled();
  });
}

/* ── R3 · Canvi d'identitat ─────────────────────────────────────────────── */
test('R3 · foto de la persona oberta; es canvia a l’entitat i Multimèdia recarrega: no es conserva la foto aliena', () => {
  Object.assign(dades, { media: [FOTO] });
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  expect(detall()).toBe(FOTO_ID);
  Object.assign(dades, { actor: ENTITAT, mediaStatus: 'loading', media: BUIT });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBeNull();
  expect(screen.getByText('Carregant…')).toBeTruthy();
});

/* ── R4 · Historial ─────────────────────────────────────────────────────── */
test('R4a · Arrere a la foto mentre Multimèdia encara carrega: l’id es queda i en arribar s’obri', () => {
  Object.assign(dades, { notes: [{ id: 'n3', title: 'Pròpia', folderId: 'f-media' }], media: [FOTO] });
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  expect(detall()).toBe(FOTO_ID);
  Object.assign(dades, { mediaStatus: 'loading', media: BUIT });
  repinta();
  fireEvent.click(screen.getByRole('button', { name: 'Pròpia' }));
  expect(nota()).toBe('n3');
  arrere();
  expect(nota()).toBe(FOTO_ID);
  expect(screen.queryByTestId('detall')?.textContent).not.toBe('n3');
  Object.assign(dades, { mediaStatus: 'ready', media: [FOTO] });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
});

/* ── Reintentar · La font es recarrega només quan la persona el prem ──────
   L'espai de treball torna a cridar la resolució a cada canvi de la seua
   clau de petició; només la crida del botó és un Reintentar (NotesSection ·
   resolPublicacio, l'episodi). C1, C2 i I1 són de la ronda 1; R4b i R5,
   d'esta. Cada prova sense recàrrega comprova després que el botó continua
   recarregant: l'arranjament no pot haver apagat el Reintentar. */
const errorDeMultimedia = (missatge) => Object.assign(dades, { mediaStatus: 'error', mediaError: new Error(missatge) });
const reintenta = () => fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Reintentar' }));

test('C1 · StrictMode: muntar amb Multimèdia en error no recarrega la font tota sola', () => {
  errorDeMultimedia('Multimèdia caiguda');
  munta(ruta(FOTO_ID, 'f-media'), { estricte: true });
  expect(nota()).toBe(FOTO_ID);
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  expect(dades.mediaRefresh).not.toHaveBeenCalled();
  reintenta();
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
});

test('C2 · una revalidació de Notes amb la foto en error no recarrega Multimèdia tota sola', () => {
  errorDeMultimedia('Multimèdia caiguda');
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  Object.assign(dades, { notesStatus: 'loading' });
  repinta();
  Object.assign(dades, { notesStatus: 'ready' });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  expect(dades.mediaRefresh).not.toHaveBeenCalled();
  reintenta();
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
});

test('R4b · tornar Arrere a la foto amb la font en error (ja mostrat) no recarrega la font tota sola', () => {
  errorDeMultimedia('Multimèdia caiguda');
  munta(ruta(FOTO_ID, 'f-media'));
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  fireEvent.click(screen.getByRole('button', { name: 'Nota sense títol' }));
  expect(nota()).not.toBe(FOTO_ID);
  arrere();
  expect(nota()).toBe(FOTO_ID);
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  expect(dades.mediaRefresh).not.toHaveBeenCalled();
  reintenta();
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
});

/* I1 · La recàrrega torna a fallar sense que el Bloc veja cap estat
   intermedi (des d'un error, useScopedResource posa 'loading' i el rebuig pot
   arribar abans de pintar): l'estat primitiu continua 'error' i només canvia
   l'objecte d'error, que la font porta des del poliment de F4 (fontsDelMas).
   Decisió 2 del Mestre (261007) · Una recàrrega sobre dades bones conserva
   'ready'; 'loading' només ix per aïllament o, com ací, des d'un error. */
test('I1 · Reintentar amb la font que torna a fallar sense estat intermedi torna a l’avís, no es queda en «Carregant…»', () => {
  errorDeMultimedia('Primera fallada');
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  reintenta();
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Carregant…')).toBeTruthy();
  errorDeMultimedia('Segona fallada');
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(screen.queryByText('Carregant…')).toBeNull();
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
  reintenta();
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(2);
});

test('R5 · error → Reintentar → loading → error: torna l’avís, una sola recàrrega; el segon Reintentar en fa una altra', () => {
  errorDeMultimedia('Primera fallada');
  const repinta = munta(ruta(FOTO_ID, 'f-media'));
  reintenta();
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
  Object.assign(dades, { mediaStatus: 'loading', mediaError: null });
  repinta();
  expect(screen.getByText('Carregant…')).toBeTruthy();
  errorDeMultimedia('Segona fallada');
  repinta();
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(1);
  reintenta();
  expect(dades.mediaRefresh).toHaveBeenCalledTimes(2);
  expect(nota()).toBe(FOTO_ID);
});

/* ── R6 · L'entrada que espera: CREAR NOTA i altres carpetes ────────────── */
test('R6a · /notes amb el Mur carregant: CREAR NOTA obri la nota preparada i s’hi queda en arribar el Mur', async () => {
  Object.assign(dades, { murStatus: 'loading' });
  const repinta = munta('/notes');
  expect(nota()).toBeNull();
  await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'CREAR NOTA' })[0]); });
  const preparada = nota();
  expect(preparada).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(detall()).toBe(preparada);
  Object.assign(dades, { murStatus: 'ready', feed: [POST] });
  repinta();
  expect(nota()).toBe(preparada);
});

test('R6b · /notes amb el Mur en error: triar Multimèdia al rail obri la foto', () => {
  Object.assign(dades, { murStatus: 'error', media: [FOTO] });
  munta('/notes');
  expect(screen.getByRole('alert').textContent).toContain('No s’han pogut carregar les dades.');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Multimèdia' }));
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(carpetaUrl()).toBe('f-media');
});

/* R6c (corregit al poliment de F4) · Variant d'A1 (ronda 1): una carpeta de
   la URL que no existix (un enllaç vell a una carpeta esborrada) la
   reconciliació la canvia per la primera (Mur), i abans seccioDEntrada només
   mirava la de la URL: amb el Mur carregant s'hi fixava la nota preparada.
   Ara la secció d'entrada es deriva de la mateixa carpeta que la
   reconciliació. */
test('R6c · /notes?carpeta=<carpeta esborrada> amb el Mur carregant no hi fixa la preparada abans que arribe', () => {
  Object.assign(dades, { murStatus: 'loading' });
  const repinta = munta('/notes?carpeta=f-esborrada');
  const abans = nota();
  expect(screen.getByText('Carregant…')).toBeTruthy();
  Object.assign(dades, { murStatus: 'ready', feed: [POST] });
  repinta();
  expect({ abans, despres: nota() }).toEqual({ abans: null, despres: 'publicacio:mur:p2' });
  expect(carpetaUrl()).toBe('f-mur');
});

/* Control de R6c · Una ?carpeta= que sí és de la navegació (Multimèdia) i
   la font del Mur carregant: la carpeta d'entrada és la de la URL, no la
   primera, i no espera el Mur. */
test('R6c (control) · /notes?carpeta=f-media amb el Mur carregant i Multimèdia llesta obri la foto sense esperar el Mur', () => {
  Object.assign(dades, { murStatus: 'loading', media: [FOTO] });
  munta('/notes?carpeta=f-media');
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(screen.queryByText('Carregant…')).toBeNull();
});

/* Constatació (canvi visible) · Mentre la carpeta d'entrada espera la seua
   font, la llista diu «No hi ha notes.» i el detall «Carregant…»; abans la
   llista oferia la «Nota sense títol». */
test('R6d · /notes?carpeta=f-media carregant: llista «No hi ha notes.» i detall «Carregant…»', () => {
  Object.assign(dades, { mediaStatus: 'loading' });
  munta('/notes?carpeta=f-media');
  expect(screen.getByText('No hi ha notes.')).toBeTruthy();
  expect(screen.getByText('Carregant…')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Nota sense títol' })).toBeNull();
});

/* ── R7 · StrictMode ────────────────────────────────────────────────────── */
test('R7 · StrictMode: foto oberta, Multimèdia passa directament a error: es conserva i no es recarrega', () => {
  Object.assign(dades, { media: [FOTO] });
  const repinta = munta(ruta(FOTO_ID, 'f-media'), { estricte: true });
  expect(detall()).toBe(FOTO_ID);
  Object.assign(dades, { mediaStatus: 'error', media: BUIT });
  repinta();
  expect(nota()).toBe(FOTO_ID);
  expect(detall()).toBe(FOTO_ID);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(dades.mediaRefresh).not.toHaveBeenCalled();
});

test('R7b · StrictMode: Mur carregant amb l’enllaç a una publicació del Mercat, i després llest', () => {
  Object.assign(dades, { murStatus: 'loading' });
  const id = 'publicacio:mercat:m9';
  const repinta = munta(ruta(id, 'f-mercat'), { estricte: true });
  expect(nota()).toBe(id);
  Object.assign(dades, { murStatus: 'ready', mercat: [{ id: 'm9', title: 'Samarreta', ownerUserId: PERSONA.id }] });
  repinta();
  expect(nota()).toBe(id);
  expect(detall()).toBe(id);
});

/* ── R8 · La sonda de Codex, amb Multimèdia carregant: les notes ordinàries
   no esperen la font aliena. ──────────────────────────────────────────────
   R8.1-R8.8 repetien una per una les proves de NotesSection.url.test.jsx
   (mateixes notes n1, n2 i m1, mateixes URL i assercions), i ja no viuen
   ací: eixe fitxer no simula MultimediaContext i rep la seua reserva sense
   proveïdor ({ status: 'loading' }), és a dir, ja les passa amb Multimèdia
   carregant. Ací només queda R8.9, el contracte de F2. */
const NOTES_URL = [
  { id: 'n1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' },
  { id: 'n2', title: 'Segona', folderId: 'f-mur', updatedAt: '2026-01-02T09:00:00Z' },
  { id: 'm1', title: 'Samarreta', folderId: 'f-mercat', updatedAt: '2026-01-01T09:00:00Z' }
];
const ambSondaUrl = () => Object.assign(dades, { notes: NOTES_URL, mediaStatus: 'loading', murStatus: undefined });
const carpetaActiva = () => within(rail()).getAllByRole('button').find((b) => b.getAttribute('aria-current') === 'page')?.getAttribute('aria-label');

test('R8.9 · Multimèdia (carregant) triada al rail des d’una nota no peta ni crida resolveNote', () => {
  ambSondaUrl();
  munta('/notes?nota=n1');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Multimèdia' }));
  expect(carpetaActiva()).toBe('Multimèdia');
  expect(dades.resolveNote).not.toHaveBeenCalled();
});
