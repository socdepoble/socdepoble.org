import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  update: vi.fn(), send: vi.fn(), toast: vi.fn(), mou: vi.fn(), esborra: vi.fn(), notes: [],
  scopeKey: 'tenant-user', workspaceKey: 'session',
  /* Grup E (261008) · la guarda de re-signatura: l'actor actiu i les publicacions del Mur carregades. */
  actor: null, feed: undefined
}));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: mocks.notes, noteFolders: [], scopeKey: mocks.scopeKey, workspaceKey: mocks.workspaceKey, config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, mouNota: mocks.mou, esborraNota: mocks.esborra
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send, feedPosts: mocks.feed }) }));
/* Poliment T41/T43 · qui signa: l'actor d'IdentitatContext (proves a NotesContext.dataPublicacio). */
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null }) }));
vi.mock('../../data/backendPort.js', () => ({ promoteToPublic: vi.fn(), teCapacitat: () => false }));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes, etiquetesDeNota } from './NotesContext';
import { bgSaveManager, draftFields } from './GlobalSaveManager.js';
import { motiuSignaturaAliena, publicaAmbMotiu } from './visibilitatNota.js';
afterEach(cleanup);
test('doble clic i reintent després de POST confirmat reutilitzen el mateix ID', async () => {
  let revision = 1;
  let linkFails = true;
  const stored = new Map();
  mocks.send.mockImplementation(async submission => { stored.set(submission.id, submission); });
  mocks.update.mockImplementation(async (id, changes) => {
    if (changes.isPublished && linkFails) { linkFails = false; throw new Error('timeout després de POST'); }
    return { id, ...changes, revision: ++revision };
  });
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  const note = { id: 'stable-note', title: 'Nova', content: '<p>Cos</p>', revision: 1 };
  await act(async () => {
    const first = result.current.publishNote(note);
    expect(result.current.publishNote(note)).toBe(first);
    expect(await first).toBe(false);
  });
  await act(async () => { expect(await result.current.publishNote(note)).toBe(true); });
  expect(stored.size).toBe(1);
  expect(mocks.send.mock.calls.map(([submission]) => submission.id)).toEqual(['stable-note', 'stable-note']);
  expect(mocks.update.mock.calls.at(-1)[1]).toEqual({ isPublished: true, publishedSubmissionId: 'stable-note' });
});


test('esborrar talla els desats posteriors: cap update arriba a una nota que ja no hi és', async () => {
  mocks.update.mockReset();
  mocks.toast.mockReset();
  mocks.esborra.mockReset().mockResolvedValue({ id: 'x' });
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.esborraNota({ id: 'x', revision: 4 })).toBe(true); });
  expect(mocks.esborra).toHaveBeenCalledWith('x', 4);
  expect(mocks.toast).toHaveBeenCalledWith('Nota borrada definitivament.', 'success');
  // El desat que l'editor fa en desmuntar-se, i qualsevol tecla tardana.
  await act(async () => {
    expect(await result.current.saveNoteField('x', 'content', '<p>tard</p>')).toBe(false);
    result.current.setLocalNoteField('x', 'title', 'Tard');
  });
  expect(mocks.update).not.toHaveBeenCalled();
});

test('la paperera desa primer el que queda pendent i llig la revisió dins del torn', async () => {
  const ordre = [];
  mocks.notes = [{ id: 'y', revision: 1 }];
  mocks.toast.mockReset();
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => {
    ordre.push(['update', revision]); return { id, ...changes, revision: revision + 1 };
  });
  mocks.mou.mockReset().mockImplementation(async (id, estat, revision) => {
    ordre.push(['mou', estat, revision]); return { id, estat, revision: revision + 1 };
  });
  try {
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let pendent;
    act(() => { pendent = result.current.saveNoteField('y', 'title', 'Últim'); });
    await act(async () => { expect(await result.current.mouNota({ id: 'y', revision: 1 }, 'paperera')).toBe(true); });
    expect(await pendent).toBe(true);
    // El desat en curs ha avançat la revisió a 2: moure amb la 1 seria un 409 fals.
    expect(ordre).toEqual([['update', 1], ['mou', 'paperera', 2]]);
    expect(mocks.toast).toHaveBeenCalledWith('Nota a la paperera. Es guardarà 30 dies.', 'success');
  } finally { mocks.notes = []; }
});

test('si moure falla, la nota continua viva i es pot tornar a desar', async () => {
  mocks.toast.mockReset();
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
  mocks.mou.mockReset().mockRejectedValue(new Error('xarxa'));
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.mouNota({ id: 'z', revision: 0 }, 'arxivada')).toBe(false); });
  expect(mocks.toast).toHaveBeenCalledWith('No s’ha pogut moure la nota. Continua on estava.', 'error');
  let desat;
  act(() => { desat = result.current.saveNoteField('z', 'title', 'Encara'); });
  await act(async () => { await bgSaveManager.flush('tenant-user', 'z'); });
  expect(await desat).toBe(true);
  expect(mocks.update).toHaveBeenCalledWith('z', { title: 'Encara' }, expect.any(Number));
});

/* T47b (ordre del Mestre, 260928) · Correcció de revisió: sense la migració
   d'`icon`, l'esborrany del dispositiu és l'única còpia de l'emoticona. Arxivar
   o enviar a la paperera no la pot destruir. */
test('T47b · arxivar una nota amb l’emoticona en quarantena la conserva a l’esborrany', async () => {
  mocks.toast.mockReset();
  /* T47 · Com l'adaptador (notes.js + columnesOpcionals.js): l'emoticona sense
     columna no es desa i torna nomenada a campsNoDesats. */
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => {
    const { icon, ...resta } = changes;
    return { id, ...resta, revision: revision + 1, ...(icon !== undefined ? { campsNoDesats: ['icon'] } : {}) };
  });
  mocks.mou.mockReset().mockImplementation(async (id, estat, revision) => ({ id, estat, revision: revision + 1 }));
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  act(() => {
    result.current.setLocalNoteField('q', 'title', 'Hort');
    result.current.setLocalNoteField('q', 'icon', '🌿');
  });
  await act(async () => { expect(await result.current.mouNota({ id: 'q', revision: 0 }, 'arxivada')).toBe(true); });
  expect(mocks.update.mock.calls.map(([, changes]) => changes)).toEqual([{ title: 'Hort', icon: '🌿' }]);
  expect(mocks.mou).toHaveBeenCalledWith('q', 'arxivada', 1);
  expect(mocks.toast).toHaveBeenCalledWith('Nota arxivada.', 'success');
  const esborrany = await bgSaveManager.write('tenant-user:q', value => value);
  expect(draftFields(esborrany)).toEqual({ icon: '🌿' });
});

/* T47 (ordre del Mestre, 260928) · Si el desat previ no es confirma, publicar
   no arriba a provar-ho: el selector ha de dir per què (ací, el conflicte D01),
   no «torna-ho a provar», que no servix de res. */
test('T47 · amb el desat previ en conflicte, publishNote rebutja amb el motiu i no publica', async () => {
  mocks.toast.mockReset();
  mocks.send.mockReset();
  mocks.update.mockReset().mockRejectedValue(Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 }));
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  const note = { id: 'en-conflicte', title: 'Meu', revision: 1 };
  let error;
  await act(async () => { error = await result.current.publishNote(note).catch(motiu => motiu); });
  expect(error).toMatchObject({ name: 'ErrorPublicacio' });
  expect(error.message).toBe('No es pot publicar fins que es desen els canvis. Hi ha una versió més recent d’esta nota. El teu esborrany es guarda en este dispositiu fins que tries quina vols conservar.');
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalledWith(error.message, 'error');
});

test('mouNota només fa eixir notes del Bloc: recuperar-les no es fa per ací', async () => {
  mocks.toast.mockReset();
  mocks.mou.mockReset().mockResolvedValue({ id: 'r' });
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.mouNota({ id: 'r', revision: 1 }, 'activa')).toBe(false); });
  expect(mocks.mou).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  // La nota no queda marcada com a eixida: es continua desant.
  let desat;
  act(() => { desat = result.current.saveNoteField('r', 'title', 'Viva'); });
  await act(async () => { await bgSaveManager.flush('tenant-user', 'r'); });
  expect(await desat).toBe(true);
});

/* T47b (ordre del Mestre, 260928) · La tecla que un editor d'abans lliura tard
   (debounce de TipTap o desmuntatge) no es perd si és del MATEIX actor; d'un
   altre actor, mai no es desa amb la sessió nova. */
test('T47b · una tecla tardana d’un editor d’abans del mateix actor es desa; d’un altre actor, no', async () => {
  mocks.toast.mockReset();
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
  try {
    mocks.workspaceKey = 'entrada-1';
    const { result, rerender } = renderHook(useNotes, { wrapper: NotesProvider });
    const vella = result.current.setLocalNoteField;
    const desaVella = result.current.saveNoteField;
    expect(result.current.scopeKey).toBe('tenant-user');

    // Mateix actor, entrada nova (eixir i tornar a entrar amb el mateix compte).
    mocks.workspaceKey = 'entrada-2';
    rerender();
    expect(result.current.setLocalNoteField).not.toBe(vella);
    act(() => { vella('m', 'title', 'Tardana'); });
    let desat;
    act(() => { desat = desaVella('m', 'lead', 'Entradilla tardana'); });
    await act(async () => { await bgSaveManager.flush('tenant-user', 'm'); });
    expect(await desat).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith('m', { title: 'Tardana', lead: 'Entradilla tardana' }, expect.any(Number));

    // Un altre actor: la tecla de l'editor d'A no es desa amb B.
    const deA = result.current.setLocalNoteField;
    mocks.scopeKey = 'tenant-altra';
    mocks.workspaceKey = 'entrada-3';
    rerender();
    mocks.update.mockClear();
    act(() => { deA('m2', 'title', 'De A'); });
    await act(async () => {
      await bgSaveManager.flush('tenant-user', 'm2');
      await bgSaveManager.flush('tenant-altra', 'm2');
    });
    expect(mocks.update).not.toHaveBeenCalled();
  } finally {
    mocks.scopeKey = 'tenant-user';
    mocks.workspaceKey = 'session';
  }
});

test('les etiquetes editorials compartides no incorporen la carpeta i respecten les categories explícites', () => {
  const categoria = vi.fn();
  const note = { folderId: 'f-mur', categories: ['Sistema'], tags: ['Productivitat', 'Tutorial'], labels: ['Antiga'] };
  const labels = etiquetesDeNota(note, [{ id: 'f-mur', name: 'Mur' }], { categoria });
  expect(labels.map(label => [label.text, label.className])).toEqual([
    ['Sistema', 'sdp-badge-category'], ['Productivitat', 'sdp-badge-tag'], ['Tutorial', 'sdp-badge-tag']
  ]);
  labels[0].onClick(); expect(categoria).toHaveBeenCalledWith('Sistema');
  expect(etiquetesDeNota({ categories: [], tags: ['Actual'], labels: ['Antiga'] }, []).map(label => label.text)).toEqual(['Actual']);
});

test('notes legacy sense categories conserven els labels explícits, sense perdre els de la llavor', () => {
  const labels = ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble'];
  expect(etiquetesDeNota({ folderId: 'f-mur', labels, tags: ['Tutorial'] }, [{ id: 'f-mur', name: 'Mur' }]).map(label => label.text)).toEqual(labels);
});

/* ── Grup E de l'Onada 4 (prompt 261008_1201, risc «que estiga clavat el
   comportament») ── Una nota publicada s'edita com a esborrany privat i el Mur
   només canvia amb «Actualitzar al Mur» (un upsert amb el mateix id signat
   per l'actor actiu). La guarda de re-signatura: si la publicació carregada
   la signa una altra identitat, no s'envia res i el motiu va en línia pel
   canal de sempre (ErrorPublicacio → publicaAmbMotiu). */
describe('Grup E · la guarda de re-signatura de publishNote', () => {
  const PEP = Object.freeze({ tipus: 'persona', id: 'u-pep', rol: 'persona' });
  const FORN = Object.freeze({ tipus: 'entitat', id: 'org-forn', slug: 'forn-de-la-torre', rol: 'owner' });
  const publicada = (id) => ({ id, title: 'Pa de cada dia', content: '<p>Cos</p>', revision: 1, isPublished: true, publishedSubmissionId: id });
  /* Com elementDeFilaPublicada (mapejadorSeccions.js): l'autoria, de les columnes. */
  const delForn = (id) => ({ id, title: 'Pa de cada dia', ownerUserId: 'u-pep', author_org_id: 'org-forn', authorOrgId: 'org-forn', author_name: 'Forn de la Torre' });
  const dePep = (id) => ({ id, title: 'Pa de cada dia', ownerUserId: 'u-pep', author_org_id: null, authorOrgId: null, author_name: 'Pep' });

  beforeEach(() => {
    mocks.toast.mockReset();
    mocks.send.mockReset().mockResolvedValue(undefined);
    mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: (revision ?? 1) + 1 }));
  });
  afterEach(() => {
    mocks.actor = null;
    mocks.feed = undefined;
  });

  test('la signa l’entitat i l’actor és la persona: no s’envia res i el motiu diu qui la signa', async () => {
    Object.assign(mocks, { actor: PEP, feed: [delForn('g-1')] });
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let error;
    await act(async () => { error = await result.current.publishNote(publicada('g-1')).catch((motiu) => motiu); });
    const motiu = motiuSignaturaAliena('Forn de la Torre');
    expect(motiu).toBe('Esta publicació la signa Forn de la Torre: canvia a eixa identitat per a actualitzar-la.');
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'info');
    // El canal en línia del selector (NotesEditor · publicaAmbMotiu) diu el motiu, no «torna-ho a provar».
    await act(async () => {
      await expect(publicaAmbMotiu(() => result.current.publishNote(publicada('g-1')))).rejects.toThrow(motiu);
    });
  });

  test('la signa la persona i l’actor és l’entitat: tampoc', async () => {
    Object.assign(mocks, { actor: FORN, feed: [dePep('g-2')] });
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let error;
    await act(async () => { error = await result.current.publishNote(publicada('g-2')).catch((motiu) => motiu); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuSignaturaAliena('Pep') });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test('la signa la mateixa identitat: s’actualitza com sempre (el mateix id)', async () => {
    Object.assign(mocks, { actor: FORN, feed: [delForn('g-3')] });
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(publicada('g-3'))).toBe(true); });
    expect(mocks.send.mock.calls.map(([submission]) => submission.id)).toEqual(['g-3']);
  });

  test('fora de la finestra carregada, sense signatura coneguda, sense actor o encara no publicada: com abans', async () => {
    const casos = [
      { actor: PEP, feed: [], nota: publicada('g-4') },
      { actor: PEP, feed: [{ id: 'g-5', title: 'Sense autor' }], nota: publicada('g-5') },
      { actor: null, feed: [delForn('g-6')], nota: publicada('g-6') },
      { actor: PEP, feed: [delForn('g-7')], nota: { ...publicada('g-7'), isPublished: false, publishedSubmissionId: null } }
    ];
    for (const { actor, feed, nota } of casos) {
      Object.assign(mocks, { actor, feed });
      const { result, unmount } = renderHook(useNotes, { wrapper: NotesProvider });
      await act(async () => { expect(await result.current.publishNote(nota)).toBe(true); });
      unmount();
    }
    expect(mocks.send.mock.calls.map(([submission]) => submission.id)).toEqual(['g-4', 'g-5', 'g-6', 'g-7']);
    expect(mocks.toast.mock.calls.filter(([, tipus]) => tipus === 'info')).toEqual([]);
  });
});
