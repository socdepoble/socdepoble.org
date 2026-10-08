/* Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
   261008: el «Sóc de Poble loguejat» és l'ENTITAT socdepoble) · Les pàgines
   del sistema que el Mur signa com a «Sóc de Poble» arriben del contingut
   core (targetesDeSistema), no de MurContext. La font del Mur del Bloc és
   pendent mentre el Mur O el contingut core carreguen: un enllaç copiat a
   /notes?nota=publicacio:mur:projecte no diu «No s'ha pogut obrir l'element»
   mentre el core carrega, i s'obri quan arriba. Un core que falla no fa
   esperar per sempre. Amb el router en memòria i l'espai de treball de veres,
   com NotesSection.fontPublicacio.test.jsx. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';

const SOC_DE_POBLE = Object.freeze({ tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG, rol: 'owner' });
const PERSONA = Object.freeze({ tipus: 'persona', id: 'uuid-prova', rol: 'persona' });
/* Cap nota a «Mur»: la carpeta d'entrada només té publicacions. */
const NOTES = [{ id: 'uuid-a', title: 'Llista de la compra', folderId: 'f-notes', updatedAt: '2026-01-03T09:00:00Z' }];
const BUIT = Object.freeze([]);
const SENSE_PAGINES = Object.freeze({});
const PROJECTE = 'publicacio:mur:projecte';

/* Cada llista és la mateixa referència entre pintades, com als contextos de
   veres (memo): només canvia quan la prova canvia l'estat de la font. */
const dades = vi.hoisted(() => ({}));
const inicial = () => Object.assign(dades, {
  actor: SOC_DE_POBLE, notes: NOTES, resolveNote: vi.fn(async () => ({ status: 'not-found' })),
  murStatus: 'ready', feed: BUIT, mercat: BUIT, murRefresh: vi.fn(),
  coreStatus: 'loading', pageCopy: SENSE_PAGINES, coreRefresh: vi.fn()
});
inicial();

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: [], status: 'ready', canCreate: true, teSessio: true,
    notesComplete: true, resolveNote: dades.resolveNote,
    obriConfiguracioNotes: () => {}, creaNota: async () => ({ id: 'nova' })
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'remote' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: dades.actor, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({ status: dades.murStatus, refresh: dades.murRefresh, sortedFeedPosts: dades.feed, sortedEvents: BUIT, sortedMarketItems: dades.mercat ?? BUIT })
}));
vi.mock('../multimedia/MultimediaContext.jsx', () => ({ useMultimedia: () => ({ status: 'ready', refresh: vi.fn(), mediaItems: BUIT }) }));
/* El proveïdor de veres porta `refresh`; pageCopy, la mateixa referència entre pintades. */
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: dades.coreStatus, pageCopy: dades.pageCopy, refresh: dades.coreRefresh })
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
const munta = (ruta) => {
  const vista = render(arbre(ruta));
  return () => vista.rerender(arbre(ruta));
};
const nota = () => new URL(screen.getByTestId('url').textContent, 'http://localhost').searchParams.get('nota');
const detall = () => screen.queryByTestId('detall')?.textContent ?? null;
const ruta = (id) => `/notes?carpeta=f-mur&nota=${encodeURIComponent(id)}`;
/* La resolució de l'espai de treball és asíncrona: l'avís ix en una microtasca
   posterior. Es deixa assentar abans de dir que NO hi és; la prova de control
   (core llest i sense la pàgina) diu que, en el mateix temps, sí que hi ix. */
const assenta = () => act(async () => { await new Promise((resol) => { setTimeout(resol, 50); }); });

test('un enllaç a una pàgina del sistema espera el contingut core: ni «No s’ha pogut obrir» ni cap nota; en arribar, s’obri', async () => {
  const repinta = munta(ruta(PROJECTE));
  await assenta();
  expect(nota()).toBe(PROJECTE);
  expect(detall()).toBeNull();
  expect(screen.getByText('Carregant…')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(dades.resolveNote).not.toHaveBeenCalled();

  Object.assign(dades, { coreStatus: 'ready', pageCopy: PAGE_COPY });
  repinta();
  expect(nota()).toBe(PROJECTE);
  expect(await screen.findByTestId('detall')).toBeTruthy();
  expect(detall()).toBe(PROJECTE);
  expect(dades.resolveNote).not.toHaveBeenCalled();
});

test('amb el core llest i sense la pàgina, l’avís de sempre: no espera per sempre', async () => {
  Object.assign(dades, { coreStatus: 'ready' });
  munta(ruta(PROJECTE));
  // Control de la primera prova: en el mateix temps d'assentar, l'avís ja hi és.
  await assenta();
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toContain('No s’ha pogut obrir l’element.');
  expect(nota()).toBe(PROJECTE);
  expect(detall()).toBeNull();
});

test('un core que falla no fa esperar: les pàgines no hi són i el detall ho diu', async () => {
  Object.assign(dades, { coreStatus: 'error' });
  munta(ruta(PROJECTE));
  const avis = await screen.findByRole('alert');
  expect(avis.textContent).toContain('No s’ha pogut obrir l’element.');
  expect(dades.coreRefresh).not.toHaveBeenCalled();
});

test('una persona no té cap pàgina del sistema al seu Bloc: amb el core llest, l’avís', async () => {
  Object.assign(dades, { actor: PERSONA, coreStatus: 'ready', pageCopy: PAGE_COPY });
  munta(ruta(PROJECTE));
  const avis = await screen.findByRole('alert');
  expect(avis.textContent).toContain('No s’ha pogut obrir l’element.');
  expect(detall()).toBeNull();
});

test('entrar a «Mur» amb el core carregant no hi fixa la nota preparada: espera i obri una pàgina del sistema', () => {
  const repinta = munta('/notes?carpeta=f-mur');
  expect(nota()).toBeNull();
  expect(detall()).toBeNull();
  expect(screen.getByText('Carregant…')).toBeTruthy();

  Object.assign(dades, { coreStatus: 'ready', pageCopy: PAGE_COPY });
  repinta();
  expect(nota()).toMatch(/^publicacio:mur:/);
  expect(detall()).toBe(nota());
});

test('el Mercat i l’agenda no esperen el core: una publicació del Mercat que no hi és diu l’avís de sempre; una que hi és, s’obri', async () => {
  // coreStatus continua 'loading' (inicial).
  munta('/notes?carpeta=f-mercat&nota=publicacio%3Amercat%3Apeca');
  await assenta();
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut obrir l’element.');
  cleanup();

  Object.assign(dades, { mercat: [{ id: 'peca', title: 'Samarreta', author_org_id: ENTITAT_PILOT_ID }] });
  munta('/notes?carpeta=f-mercat&nota=publicacio%3Amercat%3Apeca');
  expect(detall()).toBe('publicacio:mercat:peca');
});

test('el Mur carregant amb el core llest continua esperant el Mur, com sempre', () => {
  Object.assign(dades, { murStatus: 'loading', coreStatus: 'ready', pageCopy: PAGE_COPY });
  const repinta = munta(ruta('publicacio:mur:p2'));
  expect(nota()).toBe('publicacio:mur:p2');
  expect(detall()).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();

  Object.assign(dades, { murStatus: 'ready', feed: [{ id: 'p2', title: 'Directa', author_org_id: ENTITAT_PILOT_ID }] });
  repinta();
  expect(detall()).toBe('publicacio:mur:p2');
});

/* Revisió del grup E (troballa 1) · El cas simètric: el Mur carregant amb el
   core llest. Les pàgines del sistema són de la font del Mur (murAmbPagines):
   no entren a la carpeta abans que el Mur arribe, com les seues publicacions
   (MurContext exposa [] fora de 'ready'). Si no, l'espai de treball en triava
   una (?nota=publicacio:mur:projecte, amb replace) i, en arribar el Mur, la
   publicació més nova de l'entitat ja no s'obria: la tria depenia de l'ordre
   de la xarxa (relleu 21). */
test('entrar a «Mur» amb el Mur carregant i el core llest no hi fixa cap pàgina del sistema: espera i obri la publicació més nova', async () => {
  Object.assign(dades, { murStatus: 'loading', coreStatus: 'ready', pageCopy: PAGE_COPY });
  const repinta = munta('/notes?carpeta=f-mur');
  await assenta();
  expect(nota()).toBeNull();
  expect(detall()).toBeNull();
  expect(screen.getByText('Carregant…')).toBeTruthy();
  // La llista de la carpeta tampoc no pinta cap pàgina mentre el Mur carrega.
  expect(screen.queryByRole('button', { name: PAGE_COPY.projecte.title })).toBeNull();

  Object.assign(dades, { murStatus: 'ready', feed: [{ id: 'p1', title: 'La més nova', author_org_id: ENTITAT_PILOT_ID }] });
  repinta();
  expect(nota()).toBe('publicacio:mur:p1');
  expect(detall()).toBe('publicacio:mur:p1');
  // Amb el Mur llest, les pàgines hi tornen.
  expect(screen.getByRole('button', { name: PAGE_COPY.projecte.title })).toBeTruthy();
});

test('amb el Mur en error i el core llest, «Mur» diu l’error amb Reintentar, no una pàgina del sistema', async () => {
  Object.assign(dades, { murStatus: 'error', coreStatus: 'ready', pageCopy: PAGE_COPY });
  munta('/notes?carpeta=f-mur');
  await assenta();
  expect(nota()).toBeNull();
  expect(detall()).toBeNull();
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toContain('No s’han pogut carregar les dades.');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(dades.murRefresh).toHaveBeenCalledTimes(1);
  expect(dades.coreRefresh).not.toHaveBeenCalled();
});
