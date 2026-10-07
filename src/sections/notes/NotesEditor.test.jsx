import React from 'react';
import { render, screen, cleanup, fireEvent, within, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  /* L0 · backendConfig exigix un tenant_id UUID: abasts sintètics, en minúscules. */
  const TENANT_A = '00000000-0000-4000-8000-0000000000a1';
  const TENANT_B = '00000000-0000-4000-8000-0000000000b1';
  return {
    TENANT_A, TENANT_B, showToast: vi.fn(), onToast: undefined, noteFolders: [],
    adapter: null, upload: vi.fn(), config: { tenantId: TENANT_A }, notes: [], setLocal: vi.fn(), session: {},
    mou: vi.fn(), esborra: vi.fn(), potEsborrar: false, publish: vi.fn(), compartir: vi.fn(),
    scopeKey: undefined, NET, desament: vi.fn(() => NET), identitat: { actorId: 'user' }
  };
});
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: mocks.noteFolders, t: (_key, fallback) => fallback, config: mocks.config, workspaceKey: mocks.config.tenantId,
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
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter, onToast }) => { mocks.adapter = adapter; mocks.onToast = onToast; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: mocks.upload, teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
import NotesEditor from './NotesEditor.jsx';
import { desaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import {
  ERROR_PUBLICAR, ErrorPublicacio, MOTIU_LOCAL, MOTIU_LOCAL_CONNEXIO, MOTIU_PREPARADA, MOTIU_PREPARADA_CREANT, MOTIU_PREPARADA_FALLIDA
} from './visibilitatNota.js';
import { NotaPreparadaContext } from './notaPreparada.js';

beforeEach(() => {
  mocks.notes = [];
  mocks.noteFolders = [];
  mocks.onToast = undefined;
  mocks.showToast.mockReset();
  mocks.session = {};
  mocks.config = { tenantId: mocks.TENANT_A };
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
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: mocks.TENANT_A }, mocks.config);
  mocks.config = { tenantId: mocks.TENANT_B };
  rerender(<NotesEditor />);
  await mocks.adapter.uploadMedia(file);
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: mocks.TENANT_B }, mocks.config);
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
  expect(screen.getByText(/Este contingut el signa Sóc de Poble/)).toBeTruthy();
});

/* Poliment W3C · L'avís d'una connexió diu la veritat del MAS: es canvia de
   carpeta i compartir-la ix al Mur citant l'origen.
   D4 (excepció del Mestre, 260930) · la connexió s'obri a l'editor i és una
   còpia editable: l'avís també ho diu. */
test('l’avís d’una connexió diu que és una còpia editable, no promet etiquetar-la ni diu el que no fa', () => {
  const connectada = { id: 'c', folderId: 'f-connectats', categories: ['Sistema'], tags: [], origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } };
  mocks.session = { currentUser: { id: 'U' } };
  render(<NotesEditor activeNote={connectada} />);
  const avis = screen.getByText(/Este contingut el signa Pepa\./).textContent;
  expect(avis).not.toMatch(/etiquet/);
  expect(avis).toContain('el pots editar');
  expect(avis).toContain('el pots canviar de carpeta');
  expect(avis).toContain('citant-ne l’origen');
  expect(avis).toContain('al teu Mur');
  // És editable de veres: l'editor escriu a la nota, no és un lector.
  /* Revisió de D4 (260930) · Abans era `toBe(connectada)`: ara el document
     porta els drets de l'ORIGINAL al copyright que es pinta ('' si no en
     declara) i la resta de la nota idèntica. updateLocal continua sent el de
     la nota, amb el mateix id. */
  expect(mocks.adapter.document).toEqual({ ...connectada, copyright: '' });
  expect(mocks.adapter.document.id).toBe(connectada.id);
  expect(mocks.adapter.updateLocal).toBe(mocks.setLocal);
  expect(mocks.adapter.visibilitat.textos.descripcio).toContain('el pots editar');
  // Sense drets reservats a l'origen, cap avís de drets.
  expect(screen.queryByText('Contingut amb drets reservats')).toBeNull();
  expect(mocks.adapter.visibilitat.textos.descripcio).not.toContain('drets reservats');
});

/* D4 · Els drets reservats de l'original (origen.drets amb «©»): avís a
   l'editor i al selector de visibilitat abans de republicar. */
test('D4 · una connexió amb drets reservats avisa a l’editor i al selector; uns drets oberts, no', () => {
  const ambDrets = (drets) => ({
    id: 'c', folderId: 'f-connectats', categories: ['Sistema'], tags: [],
    origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa', drets }
  });
  mocks.session = { currentUser: { id: 'U' } };
  render(<NotesEditor activeNote={ambDrets('© Pepa Soler')} />);
  const avis = screen.getByText('Contingut amb drets reservats', { selector: '.sdp-alerta__titol' }).closest('.sdp-alerta');
  expect(avis.textContent).toContain('se’n citarà l’autoria i l’enllaç');
  expect(mocks.adapter.visibilitat.textos.descripcio).toContain('Contingut amb drets reservats.');
  expect(mocks.adapter.visibilitat.textos.publica.accio).toBe('Compartir al Mur');
  cleanup();
  render(<NotesEditor activeNote={ambDrets('CC BY-SA 4.0')} />);
  expect(screen.queryByText('Contingut amb drets reservats')).toBeNull();
  expect(mocks.adapter.visibilitat.textos.descripcio).not.toContain('drets reservats');
  cleanup();
  // Un contingut de fora o una nota pròpia no porten drets d'origen: cap avís encara que en diguen.
  render(<NotesEditor activeNote={{ ...EXTERN, origen: { ...EXTERN.origen, drets: '© Fals' } }} />);
  expect(screen.queryByText('Contingut amb drets reservats')).toBeNull();
});

/* Revisió de D4 (260930) · Els drets d'una connexió són els de l'original:
   l'editor els pinta (no el copyright de la nota ni «© Sóc de Poble») i no
   deixa relicenciar l'obra d'altri (la ranura de la llicència és de lectura). */
test('Revisió de D4 · una connexió pinta els drets de l’original i no oferix «Elegir drets d’autor»', () => {
  mocks.session = { currentUser: { id: 'U' } };
  const ambDrets = {
    id: 'c', folderId: 'f-connectats', categories: ['Sistema'], tags: [], copyright: 'CC0 1.0',
    origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa', drets: '© Pepa Soler' }
  };
  render(<NotesEditor activeNote={ambDrets} />);
  expect(mocks.adapter.document.copyright).toBe('© Pepa Soler');
  expect(mocks.adapter.document.content).toBe(ambDrets.content);
  const { container: ranura } = render(mocks.adapter.llicencia);
  expect(ranura.textContent).toBe('Drets de l’original: © Pepa Soler');
  expect(within(ranura).queryByRole('button')).toBeNull();
  expect(ranura.textContent).not.toMatch(/Elegir drets|Sóc de Poble|CC0/);
  cleanup();
  // Sense drets a l'origen, cap copyright propi pintat (ni el de la nota) i la ranura ho diu.
  render(<NotesEditor activeNote={{ ...ambDrets, origen: { ...ambDrets.origen, drets: undefined } }} />);
  expect(mocks.adapter.document.copyright).toBe('');
  const { container: senseDrets } = render(mocks.adapter.llicencia);
  expect(senseDrets.textContent).toBe('L’original no declara drets');
  cleanup();
  // Una nota pròpia continua amb el seu copyright i el botó de sempre (cap ranura).
  const propia = { id: 'p', folderId: 'f-notes', categories: ['Sistema'], tags: [], copyright: 'CC BY 4.0' };
  render(<NotesEditor activeNote={propia} />);
  expect(mocks.adapter.document).toBe(propia);
  expect(mocks.adapter).not.toHaveProperty('llicencia');
});

/* T71b · un contingut de fora (origen 'extern') és una còpia de la persona i
   s'edita, però al Mur es COMPARTIX citant l'origen: mai es publica com a propi. */
const EXTERN = {
  id: 'e', folderId: 'f-connectats', categories: ['Sistema'], tags: [],
  content: '<p>Font: <a href="https://exemple.org/recepta">exemple.org</a></p>',
  origen: { tipus: 'extern', url: 'https://exemple.org/recepta', lloc: 'exemple.org', titol: 'Coca de llanda' }
};

test('T71b · un contingut de fora es compartix («Compartir», compartirNota), no es publica', async () => {
  mocks.session = { currentUser: { id: 'U' } };
  mocks.compartir.mockReset().mockResolvedValue(true);
  mocks.publish.mockReset().mockResolvedValue(true);
  render(<NotesEditor activeNote={EXTERN} />);
  expect(mocks.adapter.publishLabel).toBe('Compartir');
  expect(mocks.adapter.visibilitat.bloqueig).toBeNull();
  expect(mocks.adapter.visibilitat.textos.publica.etiqueta).toBe('Compartit al teu Mur');
  expect(mocks.adapter.visibilitat.textos.publica.accio).toBe('Compartir al Mur');
  // És seua i l'edita: el selector no diu que siga d'altri ni que només es llig.
  expect(mocks.adapter.visibilitat.textos.descripcio).toMatch(/còpia teua.*el pots editar/);
  expect(mocks.adapter.visibilitat.textos.descripcio).not.toMatch(/d’altri|llegixes/);
  expect(await mocks.adapter.visibilitat.onTria(true, EXTERN)).toBe(true);
  expect(mocks.compartir).toHaveBeenCalledWith(EXTERN);
  expect(mocks.publish).not.toHaveBeenCalled();
  // Continua sent editable: l'editor escriu a la nota, no és un lector.
  expect(mocks.adapter.document).toBe(EXTERN);
  expect(mocks.adapter.updateLocal).toBe(mocks.setLocal);
});

test('T71b · l’avís del contingut de fora diu d’on ve, que és teu i com ix al Mur', () => {
  mocks.session = { currentUser: { id: 'U' } };
  render(<NotesEditor activeNote={EXTERN} />);
  const avis = screen.getByText(/Este contingut de fora és una còpia teua \(web d’origen: exemple\.org\)/).textContent;
  expect(avis).toContain('el pots editar');
  expect(avis).toContain('al teu Mur citant-ne l’origen');
  expect(screen.getByText('Contingut de fora')).toBeTruthy();
  expect(screen.queryByText(/Este contingut el signa/)).toBeNull();
  cleanup();
  // Sense lloc desat, no s'inventa cap domini.
  render(<NotesEditor activeNote={{ ...EXTERN, origen: { tipus: 'extern', url: 'https://exemple.org/recepta' } }} />);
  expect(screen.getByText(/\(web d’origen: desconeguda\)/)).toBeTruthy();
  cleanup();
  // Una nota pròpia no porta l'avís.
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-notes', categories: ['Sistema'], tags: [] }} />);
  expect(screen.queryByText('Contingut de fora')).toBeNull();
});

test('T71b · en mode local, el motiu del contingut de fora és el de compartir (el mateix que publishNote)', () => {
  mocks.session = { currentUser: { id: 'U' } };
  mocks.config = { tenantId: mocks.TENANT_A, dataMode: 'local' };
  render(<NotesEditor activeNote={EXTERN} />);
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: MOTIU_LOCAL_CONNEXIO });
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
  mocks.config = { tenantId: mocks.TENANT_A, dataMode: 'local' };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.visibilitat.bloqueig.opcio).toBe('publica');
  expect(mocks.adapter.visibilitat.bloqueig.motiu).toMatch(/Connecta un backend/);
  cleanup();
  // Una nota publicada no es pot retirar del Mur: privada bloquejada, amb el motiu.
  mocks.config = { tenantId: mocks.TENANT_A };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [], isPublished: true }} />);
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'privada', motiu: expect.stringMatching(/encara no té contracte de dades/) });
});

/* T47 (ordre del Mestre, 260928) · Sense servidor (seed/local) no hi ha Mur:
   és el motiu de veres, també per al Foraster; «connecta amb el teu compte»
   no l'arreglaria. En remot, el Foraster continua rebent el seu. */
test('T47 · en seed/local el Foraster rep el motiu de veres: no hi ha servidor', () => {
  mocks.config = { tenantId: mocks.TENANT_A, dataMode: 'seed' };
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

/* P4 (ordre del Mestre, 261003; desfà la targeta viva de l'editor de T50) ·
   El panell dret de vista prèvia ocupava 24rem al costat de l'editor i no
   s'hi podia fer res: l'adaptador del Bloc ja no porta `targetaViva` (ni
   aside ni xip «Vista targeta») ni el seu avís, en cap estat. La targeta viva
   continua a la fitxa activa de la llista (NotaFitxa). El DOM de veres, a
   NotesEditor.p4.test.jsx. */
test('P4 · l’adaptador del Bloc no porta la targeta viva: ni amb nota, ni a l’estat buit, ni a la còpia de prova', () => {
  mocks.session = { currentUser: { id: 'U' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter).not.toHaveProperty('targetaViva');
  expect(mocks.adapter).not.toHaveProperty('avisTargetaViva');
  cleanup();
  render(<NotesEditor />);
  expect(mocks.adapter.document).toBeNull();
  expect(mocks.adapter).not.toHaveProperty('targetaViva');
  cleanup();
  mocks.session = {};
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter).not.toHaveProperty('targetaViva');
  expect(mocks.adapter).not.toHaveProperty('avisTargetaViva');
});

/* ── P4 · La «Nota sense títol» (notaPreparada.js) ────────────────────── */
const PREPARADA = Object.freeze({
  id: '0f0e0d0c-0b0a-4000-8000-000000000001', folderId: 'f-mur', copyright: 'CC BY-NC-SA 4.0',
  isPublished: false, preparada: true
});
const ambPreparada = (escriu, activeNote = PREPARADA, desa = undefined) => render(
  <NotaPreparadaContext.Provider value={{ escriu, desa }}>
    <NotesEditor activeNote={activeNote} />
  </NotaPreparadaContext.Provider>
);

test('P4 · la nota preparada escriu pel canal del Bloc, sense ploma, sense «Borrar» i sense publicar', () => {
  const escriu = vi.fn();
  const desa = vi.fn();
  mocks.session = { currentUser: { id: 'u' } };
  mocks.scopeKey = 'ambit-A';
  mocks.potEsborrar = true;
  ambPreparada(escriu, PREPARADA, desa);
  expect(mocks.adapter.document).toBe(PREPARADA);
  expect(mocks.adapter.updateLocal).toBe(escriu);
  // La imatge de capçalera només arriba per saveRemote: el desat amb pausa del canal.
  expect(mocks.adapter.saveRemote).toBe(desa);
  // Encara no hi ha res a la cua: cap ploma.
  expect(mocks.desament).toHaveBeenCalledWith('ambit-A', null);
  expect(mocks.adapter).not.toHaveProperty('estatDesament');
  expect(mocks.adapter.deleteDocument).toBeUndefined();
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA });
  // Els botons de classificació es conserven i hi escriuen pel mateix canal.
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Categories (0)', 'Etiquetes (0)', 'Emoticona (—)']);
  fireEvent.click(botonera()[0]);
  fireEvent.click(screen.getByRole('radio', { name: 'Altres notes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(escriu).toHaveBeenCalledWith(PREPARADA.id, 'folderId', 'f-notes');
  expect(mocks.setLocal).not.toHaveBeenCalled();
});

test('P4 · una nota de veres dins del Bloc continua escrivint a la cua; sense el context, la marca no canvia res', () => {
  const escriu = vi.fn();
  mocks.session = { currentUser: { id: 'u' } };
  const viva = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  ambPreparada(escriu, viva);
  expect(mocks.adapter.updateLocal).toBe(mocks.setLocal);
  expect(mocks.adapter.visibilitat.bloqueig).toBeNull();
  cleanup();
  // Fora del Bloc (cap proveïdor), una nota marcada no té canal propi: la de sempre.
  render(<NotesEditor activeNote={PREPARADA} />);
  expect(mocks.adapter.updateLocal).toBe(mocks.setLocal);
  expect(escriu).not.toHaveBeenCalled();
});

/* Revisió de P4 · La creació de la preparada a la barra taronja (EstatDesament)
   i el motiu de PUBLICAR segons la creació: en camí, o sense arribar. */
test('revisió de P4 · la preparada en camí: núvol a la barra i el motiu de la creació', () => {
  mocks.session = { currentUser: { id: 'u' } };
  mocks.scopeKey = 'ambit-A';
  const creacio = { estat: 'enviant', detall: '' };
  render(
    <NotaPreparadaContext.Provider value={{ escriu: vi.fn(), creacio, reintenta: vi.fn() }}>
      <NotesEditor activeNote={PREPARADA} />
    </NotaPreparadaContext.Provider>
  );
  expect(mocks.adapter.estatDesament).toBe(creacio);
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA_CREANT });
  // La cua de Notes continua sense mirar-se: la preparada no hi és.
  expect(mocks.desament).toHaveBeenCalledWith('ambit-A', null);
});

test('revisió de P4 · la preparada que no s’ha pogut crear: avís a la barra, «Torna-ho a provar» i el motiu de la fallada', () => {
  mocks.session = { currentUser: { id: 'u' } };
  mocks.scopeKey = 'ambit-A';
  const reintenta = vi.fn();
  const creacio = { estat: 'error', detall: 'No s’ha pogut crear la nota (caigut). El que hi has escrit encara només és en esta pestanya.' };
  render(
    <NotaPreparadaContext.Provider value={{ escriu: vi.fn(), creacio, reintenta }}>
      <NotesEditor activeNote={PREPARADA} />
    </NotaPreparadaContext.Provider>
  );
  const { estatDesament } = mocks.adapter;
  expect(estatDesament).toMatchObject(creacio);
  expect(estatDesament.accions.map((accio) => accio.text)).toEqual(['Torna-ho a provar']);
  estatDesament.accions[0].onClick();
  expect(reintenta).toHaveBeenCalledTimes(1);
  expect(mocks.adapter.visibilitat.bloqueig).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA_FALLIDA });
  cleanup();
  // Una nota de veres no hereta res de la preparada: ni la ploma ni el motiu.
  render(
    <NotaPreparadaContext.Provider value={{ escriu: vi.fn(), creacio, reintenta }}>
      <NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />
    </NotaPreparadaContext.Provider>
  );
  expect(mocks.adapter.estatDesament).toEqual({ estat: 'net', detall: '' });
  expect(mocks.adapter.visibilitat.bloqueig).toBeNull();
});

test('T50 · D2 · la barra taronja diu el que diu autoriaDeNota (la nota de benvinguda, la sessió, la còpia de prova)', async () => {
  const { autoriaDeNota, AUTORIA_BENVINGUDA } = await import('./autoriaNota.js');
  const n1 = { id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa', town_name: 'Benifallim' } } };
  render(<NotesEditor activeNote={n1} />);
  expect({ nom: mocks.adapter.barAuthorName, avatar: mocks.adapter.barAuthorAvatar, poble: mocks.adapter.barAuthorLocation }).toEqual(AUTORIA_BENVINGUDA);
  cleanup();
  const propia = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  render(<NotesEditor activeNote={propia} />);
  const esperat = autoriaDeNota({ notaId: 'p', actor: undefined, actorId: 'user', agents: [], currentUser: mocks.session.currentUser });
  expect(esperat).toEqual({ nom: 'Pepa', avatar: null, poble: 'Benifallim' });
  expect({ nom: mocks.adapter.barAuthorName, avatar: mocks.adapter.barAuthorAvatar, poble: mocks.adapter.barAuthorLocation }).toEqual(esperat);
  cleanup();
  // T65 (decisió del Mestre, 260928: «Editable, signa Sóc de Poble») · Sense
  // sessió, la còpia de prova de la benvinguda ja no la signa el Foraster.
  mocks.session = {};
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect({ nom: mocks.adapter.barAuthorName, avatar: mocks.adapter.barAuthorAvatar, poble: mocks.adapter.barAuthorLocation }).toEqual(AUTORIA_BENVINGUDA);
});

/* T65 (decisió del Mestre, 260928: «Editable, signa Sóc de Poble») · La nota
   de benvinguda la signa sempre Sóc de Poble, amb el seu avatar oficial, siga
   qui siga qui la llija o l'edite. Continua editable i desada al dispositiu. */
const barra = () => ({ nom: mocks.adapter.barAuthorName, avatar: mocks.adapter.barAuthorAvatar, poble: mocks.adapter.barAuthorLocation });
const SOC_DE_POBLE = { nom: 'Sóc de Poble', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', poble: 'La Torre de les Maçanes' };

test('T65 · el Foraster edita la benvinguda i la barra continua signant Sóc de Poble', () => {
  const { rerender } = render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(barra()).toEqual(SOC_DE_POBLE);
  // Continua editable: la primera tecla escriu a la còpia, i la signatura no canvia.
  act(() => mocks.adapter.updateLocal('prova-local', 'title', 'Ho he escrit jo'));
  rerender(<NotesEditor />);
  expect(mocks.adapter.document.title).toBe('Ho he escrit jo');
  expect(mocks.adapter.saveRemote).toBeUndefined();
  expect(barra()).toEqual(SOC_DE_POBLE);
});

test('T65 · una persona connectada sense notes veu la benvinguda signada per Sóc de Poble, no pel seu nom', () => {
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa', avatar_url: 'https://exemple.org/pepa.png', town_name: 'Benifallim' } } };
  render(<NotesEditor />);
  expect(mocks.adapter.document).toBeNull();
  expect(barra()).toEqual(SOC_DE_POBLE);
  cleanup();
  // Tampoc amb una entitat activa.
  mocks.identitat = { actorId: 'O', actor: { tipus: 'entitat', id: 'O', nom: 'Forn & Cia', avatar: 'https://exemple.org/forn.png' } };
  render(<NotesEditor />);
  expect(barra()).toEqual(SOC_DE_POBLE);
});

test('T65 · la benvinguda (n1) oberta amb sessió signa Sóc de Poble; una nota normal, la persona', () => {
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa', avatar_url: 'https://exemple.org/pepa.png', town_name: 'Benifallim' } } };
  render(<NotesEditor activeNote={{ id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(barra()).toEqual(SOC_DE_POBLE);
  cleanup();
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(barra()).toEqual({ nom: 'Pepa', avatar: 'https://exemple.org/pepa.png', poble: 'Benifallim' });
});

test('T65 · una nota normal del Foraster (mode seed) continua signant el Foraster', () => {
  mocks.config = { tenantId: mocks.TENANT_A, dataMode: 'seed' };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-notes', categories: ['General'], tags: [] }} />);
  expect(barra()).toEqual({ nom: 'Foraster', avatar: null, poble: 'Poble de la persona forastera' });
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». L'adaptador porta barAuthorHref,
   la ruta de signaturaDeNota: la benvinguda, a /projecte; el Foraster, cap. */
test('261007 · la benvinguda porta a /projecte: la còpia de prova del Foraster, l’estat buit i n1 oberta', () => {
  mocks.session = {};
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.barAuthorHref).toBe('/projecte');
  cleanup();
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa' } } };
  render(<NotesEditor />);
  expect(mocks.adapter.document).toBeNull();
  expect(mocks.adapter.barAuthorHref).toBe('/projecte');
  cleanup();
  render(<NotesEditor activeNote={{ id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.barAuthorHref).toBe('/projecte');
});

test('261007 · el Foraster no té pàgina: una nota seua no porta cap enllaç', () => {
  mocks.config = { tenantId: mocks.TENANT_A, dataMode: 'seed' };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-notes', categories: ['General'], tags: [] }} />);
  expect(barra().nom).toBe('Foraster');
  expect(mocks.adapter.barAuthorHref).toBeNull();
});

test('261007 · una nota pròpia porta a la fitxa de la persona; amb una entitat activa, a la de l’entitat', () => {
  mocks.session = { currentUser: { id: 'U', user_metadata: { name: 'Pepa' } } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.barAuthorName).toBe('Pepa');
  expect(mocks.adapter.barAuthorHref).toBe('/gent/U');
  cleanup();
  mocks.identitat = { actorId: 'O', actor: { tipus: 'entitat', id: 'O', nom: 'Forn & Cia' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.barAuthorName).toBe('Forn & Cia');
  expect(mocks.adapter.barAuthorHref).toBe('/empresa/O');
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

/* T7 (P8, ordre del Mestre) · El que ja està triat (carpeta, categoria) es
   veu en píndoles; un grup buit (etiquetes) conserva el seu botó de resum. */
test('E8 · la barra grisa no té interfície morta: l’adaptador porta la botonera, no metaActions', () => {
  render(<NotesEditor activeNote={{ id: 'personal', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter).not.toHaveProperty('metaActions');
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', 'Emoticona (—)']);
  expect(botonera().map((b) => b.getAttribute('aria-label'))).toEqual(['Carpetes: Mur', 'Categories: Sistema', null, null]);
});

/* T51 (ordre del Mestre, 260928) · L'espai central de la barra taronja: el
   camp CRU de la nota i el mateix DialegEmoticona que el botó de la botonera
   (que es conserva: el prova E8). */
test('T51 · l’adaptador passa l’emoticona crua de la nota, i onObriEmoticona obri el DialegEmoticona', () => {
  mocks.session = { currentUser: { id: 'u' } };
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [], icon: '🌿' };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.emoticona).toBe('🌿');
  expect(screen.queryByRole('dialog')).toBeNull();
  act(() => mocks.adapter.onObriEmoticona());
  expect(screen.getByRole('dialog', { name: 'Emoticona del document' })).toBeTruthy();
  // La botonera continua amb el seu botó «Emoticona», l'últim.
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Sistema', 'Etiquetes (0)', '🌿Emoticona']);
});

test('T51 · sense emoticona el camp cru és buit (mai la 🪶 de la llista); sense nota, cap botó', () => {
  mocks.session = { currentUser: { id: 'u' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.emoticona).toBe('');
  expect(mocks.adapter.onObriEmoticona).toBeTypeOf('function');
  cleanup();
  // Estat buit (persona connectada sense nota): cap document, cap botó.
  render(<NotesEditor />);
  expect(mocks.adapter.document).toBeNull();
  expect(mocks.adapter.onObriEmoticona).toBeNull();
  cleanup();
  // La còpia de prova del Foraster sí que en té: la primera tecla ja edita.
  mocks.session = {};
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.onObriEmoticona).toBeTypeOf('function');
  // Sense data pròpia: la d'ara la posa la closca (UniversalEditorShell.test, T51).
  expect(mocks.adapter.document.formattedTime ?? null).toBeNull();
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
  // T7B-V1 · Les quatre etiquetes, dins d'un sol botó (un objectiu per grup).
  expect(botonera().map((b) => b.textContent)).toEqual(['Mur', 'Categories (0)', 'SistemaProductivitatTutorialSóc de Poble', 'Emoticona (—)']);
  fireEvent.click(botonera().find((b) => b.getAttribute('aria-label') === 'Etiquetes: Sistema, Productivitat, Tutorial, Sóc de Poble'));
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
  mocks.config = { tenantId: mocks.TENANT_A, dataMode: 'seed' };
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.deleteDocument).toBeUndefined();
});

test('en mode seed les notes són del dispositiu: el Foraster les pot borrar', () => {
  mocks.config = { tenantId: mocks.TENANT_A, dataMode: 'seed' };
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

/* T7 · Defecte: cap muntatge (NotesDetail, el catàleg) passava onToast i els
   avisos de l'editor (una capçalera que no puja) només anaven a la consola. */
test('T7 · sense onToast, els avisos de l’editor van al missatge ràpid de l’app (useToast)', () => {
  mocks.session = { currentUser: { id: 'u' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.onToast).toBe(mocks.showToast);
  mocks.onToast('No s’ha pogut pujar la imatge.', 'error');
  expect(mocks.showToast).toHaveBeenCalledWith('No s’ha pogut pujar la imatge.', 'error');
  cleanup();
  // Un onToast explícit continua manant.
  const propi = vi.fn();
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} onToast={propi} />);
  expect(mocks.onToast).toBe(propi);
});

/* T7 (P8) · Fora els controls desactivats sense funció dels diàlegs: a la
   persona superadministradora li queda l'avís, sense els dos botons morts. */
test('T7 · el diàleg de categories de la superadministració porta l’avís i cap botó desactivat', () => {
  mocks.session = { currentUser: { id: 'u' }, esSuperadmin: true };
  const nota = { id: 'a', folderId: 'f-mur', categories: ['Receptes', 'Hort'], tags: [] };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  fireEvent.click(botonera().find((b) => b.getAttribute('aria-label') === 'Categories: Receptes, Hort'));
  const dialeg = screen.getByRole('dialog', { name: 'Categories de la nota' });
  expect(within(dialeg).getByText(/Les categories de sistema i de projecte encara no tenen model de dades/)).toBeTruthy();
  expect(within(dialeg).queryByRole('button', { name: 'Categories de sistema' })).toBeNull();
  expect(within(dialeg).queryByRole('button', { name: 'Categories de projecte' })).toBeNull();
  // «Sistema» és de sèrie: ni llapis ni paperera.
  expect(within(dialeg).queryByRole('button', { name: 'Reanomenar «Sistema»' })).toBeNull();
});

/* T7 (P5) · El contracte { id, nom, parentId } arriba al diàleg de carpeta:
   amb carpetes niades, l'arbre amb el camí al nom accessible. */
test('T7 · el diàleg de carpeta rep el parentId de les carpetes del Bloc', () => {
  mocks.noteFolders = [
    { id: 'f-tot', name: 'Tot', parentId: null },
    { id: 'tic', name: 'TIC', parentId: null },
    { id: 'foto', name: 'Foto', parentId: 'tic' }
  ];
  const nota = { id: 'p', folderId: 'foto', categories: ['Sistema'], tags: [] };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  const carpeta = botonera()[0];
  expect(carpeta.getAttribute('aria-label')).toBe('Carpetes: Foto');
  fireEvent.click(carpeta);
  expect(screen.getByRole('radio', { name: 'TIC › Foto' }).checked).toBe(true);
  expect(screen.queryByRole('radio', { name: 'Tot' })).toBeNull();
  fireEvent.click(screen.getByRole('radio', { name: 'TIC' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(escrits()).toEqual([['p', 'folderId', 'tic']]);
});
