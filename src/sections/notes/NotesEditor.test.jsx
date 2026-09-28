import React from 'react';
import { render, screen, cleanup, fireEvent, within, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  return {
    adapter: null, upload: vi.fn(), config: { tenantId: 'tenant-A' }, notes: [], setLocal: vi.fn(), session: {},
    mou: vi.fn(), esborra: vi.fn(), potEsborrar: false, publish: vi.fn(), compartir: vi.fn(),
    scopeKey: undefined, NET, desament: vi.fn(() => NET), identitat: { actorId: 'user' }
  };
});
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_key, fallback) => fallback, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notes: mocks.notes, setLocalNoteField: mocks.setLocal, notesComplete: true,
    mouNota: mocks.mou, esborraNota: mocks.esborra, potEsborrar: mocks.potEsborrar,
    publishNote: mocks.publish, compartirNota: mocks.compartir, scopeKey: mocks.scopeKey
  }),
  etiquetesDeNota: () => []
}));
/* T47b · L'estat de la cua es controla des de la prova; la traducció és la de veres. */
vi.mock('./useEstatDesamentNota.js', async importOriginal => ({
  ...await importOriginal(),
  useEstatDesamentNota: (scope, id) => mocks.desament(scope, id)
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: mocks.upload, teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import NotesEditor from './NotesEditor.jsx';
import { desaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { ERROR_PUBLICAR, ErrorPublicacio, MOTIU_LOCAL } from './visibilitatNota.js';

beforeEach(() => {
  mocks.notes = [];
  mocks.session = {};
  mocks.config = { tenantId: 'tenant-A' };
  mocks.potEsborrar = false;
  mocks.scopeKey = undefined;
  mocks.identitat = { actorId: 'user' };
  mocks.desament.mockReset().mockReturnValue(mocks.NET);
  mocks.setLocal.mockReset();
  mocks.mou.mockReset().mockResolvedValue(true);
  mocks.esborra.mockReset().mockResolvedValue(true);
});
afterEach(cleanup);

/* La botonera viu dins de l'adaptador (la pinta el DocumentEditor, ací fals):
   es munta a part i els diàlegs els pinta el NotesEditor. */
function botonera() {
  const { container } = render(mocks.adapter.classificacio);
  return within(container).getAllByRole('button');
}
const escrits = () => mocks.setLocal.mock.calls.map(([id, camp, valor]) => [id, camp, valor]);

test('la pujada usa la configuració del workspace A i després la de B', async () => {
  mocks.upload.mockResolvedValue({ url: 'sdp-media://result' });
  const { rerender } = render(<NotesEditor />);
  const file = new Blob(['image'], { type: 'image/png' });
  await mocks.adapter.uploadMedia(file);
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: 'tenant-A' }, mocks.config);
  mocks.config = { tenantId: 'tenant-B' };
  rerender(<NotesEditor />);
  await mocks.adapter.uploadMedia(file);
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: 'tenant-B' }, mocks.config);
});


test('l’editor conserva la data i hora de la nota, també fora de la llavor', () => {
  const note = { id: 'personal', formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' };
  render(<NotesEditor activeNote={note} />);
  expect(mocks.adapter.document).toBe(note);
  expect(mocks.adapter.document.formattedTime).toBe('09:37');
});

/* T5 · una nota connectada és d'altri: es compartix, no es publica, i l'editor ho diu. */
/* T41 (ordre del Mestre, 260928) · PUBLICAR obri el selector de visibilitat:
   l'adaptador ja no publica directament, porta `visibilitat` i és onTria qui
   publica o compartix, només en confirmar «pública». */
test('una nota connectada compartix en lloc de publicar i avisa de qui és el contingut', async () => {
  const connectada = { id: 'c', folderId: 'f-connectats', categories: ['Sistema'], tags: [], origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Sóc de Poble' } };
  mocks.session = { currentUser: { id: 'U' } };
  mocks.compartir.mockReset().mockResolvedValue(true);
  render(<NotesEditor activeNote={connectada} />);
  expect(mocks.adapter.publishLabel).toBe('Compartir');
  expect(mocks.adapter).not.toHaveProperty('publish');
  expect(mocks.adapter.visibilitat.textos.publica.etiqueta).toBe('Compartit al teu Mur');
  expect(await mocks.adapter.visibilitat.onTria(true, connectada)).toBe(true);
  expect(mocks.compartir).toHaveBeenCalledWith(connectada);
  mocks.compartir.mockClear();
  expect(await mocks.adapter.visibilitat.onTria(false, connectada)).toBe(true);
  expect(mocks.compartir).not.toHaveBeenCalled();
  expect(screen.getByText(/Este contingut és de Sóc de Poble/)).toBeTruthy();
});

test('una nota pròpia publica al confirmar «pública», sense etiqueta especial ni avís', async () => {
  mocks.session = { currentUser: { id: 'U' } };
  mocks.publish.mockReset().mockResolvedValue(true);
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.publishLabel).toBeNull();
  expect(mocks.adapter.visibilitat.bloqueig).toBeNull();
  expect(mocks.adapter.visibilitat.textos.publica.etiqueta).toBe('Publicada al Mur');
  expect(mocks.adapter.visibilitat.textos.reversible).toBeNull();
  await mocks.adapter.visibilitat.onTria(true, nota);
  expect(mocks.publish).toHaveBeenCalledWith(nota);
  expect(screen.queryByText(/Element connectat/)).toBeNull();
  // publishNote no llança (fa un toast, que la finestra modal tapa): el motiu va en línia.
  mocks.publish.mockResolvedValueOnce(false);
  await expect(mocks.adapter.visibilitat.onTria(true, nota)).rejects.toThrow(/No s’ha pogut publicar al Mur/);
});

test('T41 · bloquejos honestos: Foraster, mode local i nota ja publicada', () => {
  // La còpia de prova del Foraster no es publica.
  render(<NotesEditor />);
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: 'Connecta amb el teu compte per a publicar la nota al Mur.' });
  expect(mocks.adapter.visibilitat.comNom).toBeNull();
  cleanup();
  // En mode seed/local no hi ha Mur on publicar.
  mocks.session = { currentUser: { id: 'U' } };
  mocks.config = { tenantId: 'tenant-A', dataMode: 'local' };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.visibilitat.bloqueig.opcio).toBe('publica');
  expect(mocks.adapter.visibilitat.bloqueig.motiu).toMatch(/Connecta un backend/);
  cleanup();
  // Una nota publicada no es pot retirar del Mur: privada bloquejada, amb el motiu.
  mocks.config = { tenantId: 'tenant-A' };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [], isPublished: true }} />);
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'privada', motiu: expect.stringMatching(/encara no té contracte de dades/) });
});

/* T47 (ordre del Mestre, 260928) · Sense servidor (seed/local) no hi ha Mur:
   és el motiu de veres, també per al Foraster; «connecta amb el teu compte»
   no l'arreglaria. En remot, el Foraster continua rebent el seu. */
test('T47 · en seed/local el Foraster rep el motiu de veres: no hi ha servidor', () => {
  mocks.config = { tenantId: 'tenant-A', dataMode: 'seed' };
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: MOTIU_LOCAL });
});

/* T47 · publishNote rebutja amb ErrorPublicacio quan tornar-ho a provar no
   servix (desat previ en conflicte…): el selector diu eixe motiu tal qual.
   ERROR_PUBLICAR queda per a la xarxa i per a qualsevol error tècnic. */
test('T47 · el selector diu el motiu de publishNote; la xarxa continua sent ERROR_PUBLICAR', async () => {
  mocks.session = { currentUser: { id: 'U' } };
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  const motiu = 'No es pot publicar fins que es desen els canvis. Hi ha una versió més recent d’esta nota.';
  mocks.publish.mockReset().mockRejectedValueOnce(new ErrorPublicacio(motiu));
  render(<NotesEditor activeNote={nota} />);
  await expect(mocks.adapter.visibilitat.onTria(true, nota)).rejects.toThrow(motiu);
  mocks.publish.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(mocks.adapter.visibilitat.onTria(true, nota)).rejects.toThrow(ERROR_PUBLICAR);
  mocks.publish.mockResolvedValueOnce(false);
  await expect(mocks.adapter.visibilitat.onTria(true, nota)).rejects.toThrow(ERROR_PUBLICAR);
});

test('T41 · el selector diu amb quina identitat es publica (la que signa al Mur)', () => {
  mocks.session = { currentUser: { id: 'U' } };
  mocks.identitat = { actorId: 'O', actor: { tipus: 'entitat', id: 'O', nom: 'Forn & Cia' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.visibilitat.comNom).toBe('Forn & Cia');
});

/* Poliment T41/T43 · la barra taronja, el selector i el payload del Mur
   (publishNote, autoriaNota) diuen el mateix nom. */
test('amb una entitat activa, la barra taronja diu l’entitat i el seu logo, mai la persona', () => {
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa', avatar_url: 'https://exemple.org/pepa.png', town_name: 'Benifallim' } } };
  mocks.identitat = { actorId: 'O', actor: { tipus: 'entitat', id: 'O', nom: 'Forn & Cia', avatar: 'https://exemple.org/forn.png' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.barAuthorName).toBe('Forn & Cia');
  expect(mocks.adapter.barAuthorAvatar).toBe('https://exemple.org/forn.png');
  expect(mocks.adapter.barAuthorLocation).toBe('');
  expect(mocks.adapter.visibilitat.comNom).toBe(mocks.adapter.barAuthorName);
});

test('el selector no diu mai un correu: sense nom, «Veí» (el mateix que ix al Mur)', () => {
  mocks.session = { currentUser: { id: 'U', email: 'pepa@exemple.org' } };
  mocks.identitat = { actorId: 'U', actor: { tipus: 'persona', id: 'U', nom: 'pepa@exemple.org' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.visibilitat.comNom).toBe('Veí');
});

test('T40 · el Bloc activa el calendari de publicació (també a la còpia de prova)', () => {
  mocks.session = { currentUser: { id: 'U' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.ambDataPublicacio).toBe(true);
  cleanup();
  mocks.session = {};
  const { rerender } = render(<NotesEditor />);
  expect(mocks.adapter.ambDataPublicacio).toBe(true);
  // La còpia de prova guarda la data com qualsevol altre camp (al seu esborrany).
  act(() => mocks.adapter.updateLocal('prova-local', 'publishDate', '2026-09-28T10:00:00.000Z'));
  rerender(<NotesEditor />);
  expect(mocks.adapter.document.publishDate).toBe('2026-09-28T10:00:00.000Z');
});

test('E8 · la barra grisa no té interfície morta: l’adaptador porta la botonera, no metaActions', () => {
  render(<NotesEditor activeNote={{ id: 'personal', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter).not.toHaveProperty('metaActions');
  expect(botonera().map((b) => b.textContent)).toEqual(['CarpetesMur', 'Categories1', 'Etiquetes0', 'Emoticona—']);
});

test('carpeta: se’n tria una i s’escriu el folderId de la nota', () => {
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  fireEvent.click(botonera()[0]);
  fireEvent.click(screen.getByRole('radio', { name: 'Altres notes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(escrits()).toEqual([['p', 'folderId', 'f-notes']]);
});

test('E5 · el primer desat de la nota de benvinguda conserva totes les etiquetes antigues', () => {
  const n1 = { id: 'n1', folderId: 'f-mur', labels: ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble'], tags: ['Tutorial'] };
  mocks.notes = [n1];
  render(<NotesEditor activeNote={n1} />);
  expect(botonera().map((b) => b.textContent)).toEqual(['CarpetesMur', 'Categories0', 'Etiquetes4', 'Emoticona—']);
  fireEvent.click(botonera()[2]);
  for (const nom of n1.labels) expect(screen.getByRole('checkbox', { name: nom }).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(escrits()).toEqual([
    ['n1', 'categories', ['General']],
    ['n1', 'tags', ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble']]
  ]);
});

test('reanomenar una categoria la canvia a totes les notes que la porten', () => {
  mocks.notes = [
    { id: 'a', folderId: 'f-mur', categories: ['Receptes'], tags: [] },
    { id: 'b', folderId: 'f-mur', categories: ['Receptes', 'Hort'], tags: [] },
    { id: 'c', folderId: 'f-mur', categories: ['Agenda'], tags: [] }
  ];
  render(<NotesEditor activeNote={mocks.notes[0]} />);
  fireEvent.click(botonera()[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Reanomenar «Receptes»' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Nou nom per a «Receptes»' }), { target: { value: 'Cuina' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  expect(escrits()).toEqual([['a', 'categories', ['Cuina']], ['b', 'categories', ['Cuina', 'Hort']]]);
});

test('esborrar una categoria la lleva de totes les notes; qui es queda sense rep «General»', () => {
  mocks.notes = [
    { id: 'a', folderId: 'f-mur', categories: ['Receptes', 'Hort'], tags: [] },
    { id: 'b', folderId: 'f-mur', categories: ['Receptes'], tags: [] }
  ];
  render(<NotesEditor activeNote={mocks.notes[0]} />);
  fireEvent.click(botonera()[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Esborrar «Receptes»' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar: esborrar «Receptes»' }));
  expect(escrits()).toEqual([['a', 'categories', ['Hort']], ['b', 'categories', ['General']]]);
});

test('orfandat: la darrera categoria de la nota no es pot desmarcar', () => {
  const nota = { id: 'a', folderId: 'f-mur', categories: ['Receptes'], tags: [] };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  fireEvent.click(botonera()[1]);
  expect(screen.getByRole('checkbox', { name: 'Receptes' }).disabled).toBe(true);
  expect(screen.getByText(/Cal almenys una categoria/)).toBeTruthy();
});

test('sense EDITAR: el Foraster sense nota escriu directament en una còpia local', () => {
  const { rerender } = render(<NotesEditor />);
  expect(mocks.adapter.identityActions ?? null).toBeNull();
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.saveRemote).toBeUndefined();
  mocks.adapter.updateLocal('prova-local', 'title', 'Prova meua');
  rerender(<NotesEditor />);
  expect(mocks.adapter.document.title).toBe('Prova meua');
});

/* ── Borrar: diàleg de paperera, arxiu o esborrat definitiu ─────────────── */
const nota = { id: 'p', title: '<p>Llista de la compra</p>', folderId: 'f-notes', categories: ['General'], tags: [], revision: 2 };
function obriBorrar() {
  mocks.session = { currentUser: { id: 'u' } };
  mocks.potEsborrar = true;
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  act(() => mocks.adapter.deleteDocument(nota));
  return screen.getByRole('dialog');
}

test('sense la capacitat cicleNotes, o per al Foraster amb notes remotes, no hi ha «Borrar»', () => {
  mocks.session = { currentUser: { id: 'u' } };
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.deleteDocument).toBeUndefined();
  cleanup();
  mocks.session = {};
  mocks.potEsborrar = true;
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.deleteDocument).toBeUndefined();
  cleanup();
  // La còpia de prova del Foraster tampoc es borra.
  mocks.config = { tenantId: 'tenant-A', dataMode: 'seed' };
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.deleteDocument).toBeUndefined();
});

test('en mode seed les notes són del dispositiu: el Foraster les pot borrar', () => {
  mocks.config = { tenantId: 'tenant-A', dataMode: 'seed' };
  mocks.potEsborrar = true;
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.deleteDocument).toBeTypeOf('function');
});

test('el diàleg ofereix tres eixides, amb la definitiva al final', () => {
  const dialeg = obriBorrar();
  expect(within(dialeg).getByRole('heading').textContent).toBe('Què vols fer amb «Llista de la compra»?');
  const botons = within(dialeg).getAllByRole('button').map((b) => b.textContent);
  expect(botons).toEqual(['', 'Guardar durant 30 dies', 'Arxivar', 'Borrar definitivament']);
  expect(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }).className).toContain('sdp-boto--perill');
  expect(within(dialeg).getByText(/es guarda a la paperera 30 dies; després s’esborra per sempre/)).toBeTruthy();
});

test('«Guardar durant 30 dies» mou a la paperera i «Arxivar», a l’arxiu', async () => {
  let dialeg = obriBorrar();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Guardar durant 30 dies' })); });
  expect(mocks.mou).toHaveBeenLastCalledWith(nota, 'paperera');
  expect(screen.queryByRole('dialog')).toBeNull();
  cleanup();
  dialeg = obriBorrar();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Arxivar' })); });
  expect(mocks.mou).toHaveBeenLastCalledWith(nota, 'arxivada');
  expect(mocks.esborra).not.toHaveBeenCalled();
});

test('«Borrar definitivament» demana un segon pas dins del mateix diàleg', async () => {
  const dialeg = obriBorrar();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(within(dialeg).getByRole('heading').textContent).toBe('Borrar per sempre «Llista de la compra»?');
  expect(within(dialeg).getAllByRole('button').map((b) => b.textContent)).toEqual(['', 'Enrere', 'Borrar per sempre']);
  // Llei de la Por Orgànica: un Intro distret al segon pas torna arrere.
  expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: 'Enrere' }));
  expect(mocks.esborra).not.toHaveBeenCalled();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Enrere' }));
  expect(within(dialeg).getByRole('button', { name: 'Arxivar' })).toBeTruthy();
  // «Enrere» desmunta el botó que tenia el focus: torna a «Borrar definitivament», no al body.
  expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar per sempre' })); });
  expect(mocks.esborra).toHaveBeenCalledWith(nota);
  expect(mocks.mou).not.toHaveBeenCalled();
});

test('Escape i «Tancar» tanquen sense tocar la nota; si falla, el diàleg es queda obert', async () => {
  let dialeg = obriBorrar();
  fireEvent(dialeg, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  cleanup();
  dialeg = obriBorrar();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(mocks.mou).not.toHaveBeenCalled();
  expect(mocks.esborra).not.toHaveBeenCalled();
  cleanup();
  mocks.mou.mockResolvedValueOnce(false);
  dialeg = obriBorrar();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Arxivar' })); });
  expect(screen.getByRole('dialog')).toBeTruthy();
});

/* ── T47b (ordre del Mestre, 260928) · La ploma a la barra taronja ─────── */
test('T47b · una nota de veres porta a la barra taronja l’estat de la cua de Notes', () => {
  mocks.session = { currentUser: { id: 'u' } };
  mocks.scopeKey = 'ambit-A';
  const viva = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  mocks.desament.mockReturnValue({ estat: 'pendent', problema: null, quarantena: [] });
  const { rerender } = render(<NotesEditor activeNote={viva} />);
  expect(mocks.desament).toHaveBeenCalledWith('ambit-A', 'p');
  expect(mocks.adapter.estatDesament).toEqual({ estat: 'pendent', detall: '' });

  // Esperant la renovació de la sessió: dins de Notes és «pendent», no «torna a entrar».
  mocks.desament.mockReturnValue({ estat: 'sessio', problema: { tipus: 'sessio' }, quarantena: [] });
  rerender(<NotesEditor activeNote={viva} />);
  expect(mocks.adapter.estatDesament).toEqual({ estat: 'pendent', detall: '' });

  mocks.desament.mockReturnValue({ estat: 'error', problema: { tipus: 'temporal', missatge: 'xarxa', intents: 1 }, quarantena: [] });
  rerender(<NotesEditor activeNote={viva} />);
  expect(mocks.adapter.estatDesament.estat).toBe('error');
  expect(mocks.adapter.estatDesament.detall).toContain('Es tornarà a provar sol');

  mocks.desament.mockReturnValue(mocks.NET);
  rerender(<NotesEditor activeNote={viva} />);
  expect(mocks.adapter.estatDesament).toEqual({ estat: 'net', detall: '' });
});

/* T47 (ordre del Mestre, 260928) · Una nota oberta amb un esborrany D01 no té
   res al gestor encara (no s'envia fins que la persona tria): la ploma no pot
   dir «Tots els canvis estan desats». */
test('T47 · una nota oberta amb un esborrany en conflicte D01 pinta l’avís del conflicte, no «tot desat»', () => {
  mocks.session = { currentUser: { id: 'u' } };
  mocks.scopeKey = 'ambit-A';
  const enConflicte = {
    id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [],
    draftConflict: { baseRevision: 1, remoteRevision: 3 }
  };
  render(<NotesEditor activeNote={enConflicte} />);
  expect(mocks.adapter.estatDesament).toEqual({
    estat: 'error',
    detall: 'Hi ha una versió més recent d’esta nota. El teu esborrany es guarda en este dispositiu fins que tries quina vols conservar.'
  });
});

test('T40 · amb la data en quarantena (sense la columna publish_date), el calendari ho diu; sense, no', () => {
  mocks.session = { currentUser: { id: 'u' } };
  mocks.scopeKey = 'ambit-A';
  const viva = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  const { rerender } = render(<NotesEditor activeNote={viva} />);
  expect(mocks.adapter.avisDataPublicacio).toBeNull();
  mocks.desament.mockReturnValue({ estat: 'error', problema: null, quarantena: ['publishDate'] });
  rerender(<NotesEditor activeNote={viva} />);
  expect(mocks.adapter.avisDataPublicacio).toBe('Al servidor encara no hi ha on guardar la data de publicació. Es guarda en este dispositiu i només s’aplica si publiques des d’ací.');
  // La ploma diu el nom de persona del camp, no «publishDate».
  expect(mocks.adapter.estatDesament.detall).toBe('El servidor encara no pot guardar la data de publicació: es guarda en este dispositiu.');
  // Una altra columna en quarantena no toca el calendari.
  mocks.desament.mockReturnValue({ estat: 'error', problema: null, quarantena: ['icon'] });
  rerender(<NotesEditor activeNote={viva} />);
  expect(mocks.adapter.avisDataPublicacio).toBeNull();
});

test('T47b · la còpia de prova del Foraster no porta ploma: no ix del dispositiu', () => {
  mocks.scopeKey = 'ambit-A';
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter).not.toHaveProperty('estatDesament');
  expect(mocks.desament).toHaveBeenCalledWith('ambit-A', null);
});

test('una persona connectada sense nota veu l’estat buit, sense cap botó', () => {
  mocks.session = { currentUser: { id: 'u' } };
  render(<NotesEditor />);
  expect(mocks.adapter.document).toBeNull();
  expect(mocks.adapter.identityActions ?? null).toBeNull();
});

/* T39 (ordre del Mestre, 260928) · la vista de drets d'autor diu d'on ve la
   llicència de sèrie de l'actor; la còpia del Foraster i una nota connectada
   (obra d'altri) no hereten res. */
test('T39 · dretsAutor: «publicacio» amb la llicència de sèrie de l’actor; «neutre» per al Foraster i per a una connexió', () => {
  render(<NotesEditor />);
  expect(mocks.adapter.dretsAutor).toEqual({ ambit: 'neutre' });
  cleanup();
  mocks.session = { currentUser: { id: 'user' } };
  desaLlicenciaPerDefecte('user', 'CC BY-SA 4.0');
  try {
    const meua = { id: 'meua', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
    render(<NotesEditor activeNote={meua} />);
    expect(mocks.adapter.dretsAutor).toEqual({ ambit: 'publicacio', perDefecte: 'CC BY-SA 4.0' });
    cleanup();
    // Una entitat: el copyright de la seua pertinença (del servidor) guanya.
    mocks.identitat = { actorId: 'org-1', actor: { tipus: 'entitat', id: 'org-1', nom: 'Forn' }, memberships: [{ id: 'org-1', copyright: 'CC BY 4.0' }] };
    render(<NotesEditor activeNote={meua} />);
    expect(mocks.adapter.dretsAutor).toEqual({ ambit: 'publicacio', perDefecte: 'CC BY 4.0' });
    cleanup();
    const connectada = { id: 'c', folderId: 'f-connectats', categories: ['Sistema'], tags: [], origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Sóc de Poble' } };
    render(<NotesEditor activeNote={connectada} />);
    expect(mocks.adapter.dretsAutor).toEqual({ ambit: 'neutre' });
  } finally {
    desaLlicenciaPerDefecte('user', '');
  }
});
