import React from 'react';
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn() }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: [], noteFolders: [], scopeKey: 'tenant-user', workspaceKey: 'session', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send }) }));
vi.mock('../../data/backendPort.js', () => ({ promoteToPublic: vi.fn(), teCapacitat: () => false }));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes, etiquetesDeNota } from './NotesContext';
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
