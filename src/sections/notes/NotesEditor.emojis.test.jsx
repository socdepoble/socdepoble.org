/* Bloc 3.8 del Gauntlet (261016) · La ranura d'emoticona del document amb la
   graella del catàleg Emojis XL: un clic a un emoji l'assigna com a icona de
   la nota activa i tanca el diàleg, per les tres vies d'escriptura del Bloc
   (NotesEditor · escriu):
     · una nota de veres: setLocalNoteField(id, 'icon', glif), la cua del Bloc;
     · la còpia de prova del Foraster: el seu sandbox (res al servidor);
     · la «Nota sense títol» preparada: el canal de la preparada (escriu).
   I l'adaptador porta el canal d'emojis del Bloc (registraInsercio i
   obreEmojis) només dins del Bloc. Les dades del catàleg, sintètiques: el
   mateix camí d'import() que fa servir el Bloc (canalEmojis.js). */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  return {
    NET, adapter: null, notes: [], setLocal: vi.fn(), saveNoteField: vi.fn(), session: {}, showToast: vi.fn(),
    config: { tenantId: '00000000-0000-4000-8000-0000000000a1' }
  };
});
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notes: mocks.notes, setLocalNoteField: mocks.setLocal, saveNoteField: mocks.saveNoteField, notesComplete: true
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: () => mocks.NET
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
/* El catàleg, sintètic: dues famílies, la primera oberta. */
vi.mock('../disseny/cataleg/dades/emojisUnicode18.js', () => ({
  GRUPS_EMOJIS: [
    { id: 'menjar', nom: 'Menjar i beguda', emojis: [['1F345', '🍅', 'tomato'], ['1F33D', '🌽', 'ear of corn']] },
    { id: 'natura', nom: 'Animals i natura', emojis: [['1F33F', '🌿', 'herb']] }
  ]
}));
import NotesEditor from './NotesEditor.jsx';
import { NotaPreparadaContext } from './notaPreparada.js';
import { CanalEmojisContext } from './canalEmojis.js';

beforeEach(() => {
  mocks.notes = [];
  mocks.session = {};
  mocks.adapter = null;
  mocks.setLocal.mockReset();
  mocks.saveNoteField.mockReset();
  mocks.showToast.mockReset();
});
afterEach(cleanup);

const dialeg = () => screen.queryByRole('dialog', { name: 'Emoticona del document' });
/* Gauntlet 261016 (Bloc 3.9; ordre del Mestre: fora la ploma central de la
   barra taronja) · El diàleg ja no s'obri des de l'espai central
   (onObriEmoticona, que l'adaptador ja no porta): s'obri des del botó
   «Emojis XL» de la botonera, dins de l'«Edició avançada». La graella hi
   arriba a demanda. */
async function triaALaRanura(nom) {
  expect(mocks.adapter.onObriEmoticona).toBeNull();
  const botonera = render(mocks.adapter.classificacio);
  fireEvent.click(within(botonera.container).getByRole('button', { name: /^Emojis XL/ }));
  botonera.unmount();
  const obert = dialeg();
  expect(obert).toBeTruthy();
  // La graella, no la drecera de teclat de l'OS.
  expect(within(obert).queryByText(/Control \+ Ordre/)).toBeNull();
  fireEvent.click(await within(obert).findByRole('button', { name: nom }));
}

test('una nota de veres: un clic a la graella escriu la icona per setLocalNoteField i tanca', async () => {
  mocks.session = { currentUser: { id: 'u' } };
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  await triaALaRanura('tomato');
  expect(mocks.setLocal.mock.calls).toEqual([['p', 'icon', '🍅']]);
  expect(dialeg()).toBeNull();
  // Una segona vegada des del mateix botó «Emojis XL»: el mateix diàleg i la mateixa via.
  const botonera = render(mocks.adapter.classificacio);
  fireEvent.click(within(botonera.container).getByRole('button', { name: /^Emojis XL/ }));
  botonera.unmount();
  await within(dialeg()).findByRole('button', { name: 'tomato' });
  /* La segona família arrenca plegada: s'obri com ho fa el navegador (jsdom
     no fa el clic del summary). */
  const familia = within(dialeg()).getByText(/^Animals i natura \(/).closest('details');
  act(() => { familia.open = true; familia.dispatchEvent(new Event('toggle')); });
  fireEvent.click(within(dialeg()).getByRole('button', { name: 'herb' }));
  expect(mocks.setLocal.mock.calls.at(-1)).toEqual(['p', 'icon', '🌿']);
  expect(dialeg()).toBeNull();
  expect(mocks.saveNoteField).not.toHaveBeenCalled();
});

test('el mateix emoji que ja porta la nota no escriu res, i el diàleg es tanca igual', async () => {
  mocks.session = { currentUser: { id: 'u' } };
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [], icon: '🍅' };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  await triaALaRanura('tomato');
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(dialeg()).toBeNull();
});

test('la còpia de prova del Foraster: la icona va al seu sandbox, i la barra taronja la mostra', async () => {
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.emoticona).toBe('');
  await triaALaRanura('tomato');
  expect(dialeg()).toBeNull();
  expect(mocks.adapter.emoticona).toBe('🍅');
  expect(mocks.adapter.document.icon).toBe('🍅');
  // Res no ix del dispositiu: ni la cua del Bloc ni cap desat remot.
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(mocks.adapter.saveRemote).toBeUndefined();
});

test('la «Nota sense títol» preparada: la icona va pel canal de la preparada', async () => {
  mocks.session = { currentUser: { id: 'u' } };
  const preparada = { id: '0f0e0d0c-0b0a-4000-8000-000000000001', folderId: 'f-mur', isPublished: false, preparada: true };
  const escriu = vi.fn();
  render(
    <NotaPreparadaContext.Provider value={{ escriu }}>
      <NotesEditor activeNote={preparada} />
    </NotaPreparadaContext.Provider>
  );
  await triaALaRanura('tomato');
  expect(escriu).toHaveBeenCalledWith(preparada.id, 'icon', '🍅');
  expect(mocks.setLocal).not.toHaveBeenCalled();
  expect(dialeg()).toBeNull();
});

test('el canal d’emojis del Bloc arriba a l’adaptador; fora del Bloc, cap clau nova', () => {
  mocks.session = { currentUser: { id: 'u' } };
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter).not.toHaveProperty('registraInsercio');
  expect(mocks.adapter).not.toHaveProperty('obreEmojis');
  cleanup();
  const canal = Object.freeze({ registra: vi.fn(), obri: vi.fn() });
  render(
    <CanalEmojisContext.Provider value={canal}>
      <NotesEditor activeNote={nota} />
    </CanalEmojisContext.Provider>
  );
  expect(mocks.adapter.registraInsercio).toBe(canal.registra);
  expect(mocks.adapter.obreEmojis).toBe(canal.obri);
});
