import { expect, test, vi } from 'vitest';
import { GlobalSaveManager, draftFields } from './GlobalSaveManager.js';

const campsPublicacio = { isPublished: true, publishedSubmissionId: 'acte-fals', publicadaRevision: 123 };
const creaGestor = (inicial = {}) => {
  let registre = structuredClone(inicial);
  const persist = async (_key, transforma) => { registre = transforma(structuredClone(registre || {})); return registre; };
  return { gestor: new GlobalSaveManager({ persist, delay: 60000, finestra: null }), llig: () => registre };
};

test('DOL-54 · un esborrany antic no altera l’estat públic en hidratar-se', () => {
  expect(draftFields({ title: 'Treball privat', ...campsPublicacio, _baseRevision: 4 })).toEqual({ title: 'Treball privat' });
});

test('DOL-54 · ni la primera tecla ni una extensió poden encuar un acte de publicació', async () => {
  const { gestor, llig } = creaGestor();
  const update = vi.fn();
  for (const [camp, valor] of Object.entries(campsPublicacio)) {
    expect(await gestor.enqueue('A', 'n', camp, valor, () => ({ revision: 4 }), update, vi.fn(), vi.fn())).toBe(false);
  }
  expect(gestor.queues.size).toBe(0);
  expect(llig()).toEqual({});
  expect(update).not.toHaveBeenCalled();
});

test('DOL-54 · reprendre des del disc conserva el text però mai publica', async () => {
  const { gestor } = creaGestor({ ...campsPublicacio, title: 'Treball privat', _baseRevision: 4,
    _operationVersion: 1, _fieldVersions: { title: 1, isPublished: 1, publishedSubmissionId: 1, publicadaRevision: 1 } });
  const update = vi.fn(async (_id, dades) => ({ ...dades, revision: 5 }));
  gestor.repren('A', 'n', { getBase: () => ({ revision: 4 }), update });
  expect(await gestor.flush('A', 'n')).toBe(true);
  expect(update).toHaveBeenCalledExactlyOnceWith('n', { title: 'Treball privat' }, 4);
});

test('DOL-54 · un esborrany antic només de publicació no fa cap RPC', async () => {
  const { gestor } = creaGestor({ ...campsPublicacio, _baseRevision: 4,
    _operationVersion: 1, _fieldVersions: { isPublished: 1, publishedSubmissionId: 1, publicadaRevision: 1 } });
  const update = vi.fn();
  gestor.repren('A', 'n', { getBase: () => ({ revision: 4 }), update });
  expect(await gestor.flush('A', 'n')).toBe(true);
  expect(update).not.toHaveBeenCalled();
});
