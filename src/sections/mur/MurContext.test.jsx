import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ user: 'A', generation: 1, load: vi.fn(), append: vi.fn(), identitat: null }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../data/backendPort.js', () => ({ loadMur: (...args) => m.load(...args), appendSectionSubmissionNetworkOnly: (...args) => m.append(...args) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: m.user }, generacio: m.generation }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat || ({ actorId: m.user, actorKey: m.user }) }));
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
import { MurProvider, useMur } from './MurContext';
const config = { tenantId: 'poble' };
const wrapper = ({ children }) => <MurProvider config={config}>{children}</MurProvider>;
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); m.user = 'A'; m.generation = 1; m.identitat = null; m.load.mockResolvedValue({ feedPosts: [] }); m.append.mockResolvedValue({ id: 'new' }); });
test('publicar invalida Mur i la càrrega següent inclou la publicació', async () => {
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  m.load.mockResolvedValue({ feedPosts: [{ id: 'new' }] });
  await act(async () => result.current.sendSectionSubmission({ sectionId: 'mur' }));
  await waitFor(() => expect(result.current.feedPosts[0]?.id).toBe('new'));
  expect(m.load).toHaveBeenCalledTimes(2);
});
test('callback antic i escriptura tardana no refresquen la sessió següent', async () => {
  let resolve;
  m.append.mockImplementation(() => new Promise(done => { resolve = done; }));
  const { result, rerender } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const oldSend = result.current.sendSectionSubmission;
  const pending = oldSend({ sectionId: 'mur' });
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  m.user = 'B'; m.generation++; rerender();
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await act(async () => resolve({ id: 'old' })); await rejected;
  await expect(oldSend({})).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.append).toHaveBeenCalledTimes(1); expect(m.load).toHaveBeenCalledTimes(2);
});

/* ── I2 · qui signa: la identitat activa viatja al port com a `actor` ── */

async function envia(sub) {
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  let desat;
  await act(async () => { desat = await result.current.sendSectionSubmission(sub); });
  return desat;
}

test('I2 · amb una entitat activa, la publicació porta l’actor entitat', async () => {
  m.identitat = { actorId: 'ORG', actorKey: 'entitat::ORG', actor: { tipus: 'entitat', id: 'ORG', nom: 'Forn' } };
  const sub = { sectionId: 'mur', title: 'Pa calent' };
  expect(await envia(sub)).toEqual({ id: 'new' });
  expect(m.append).toHaveBeenCalledWith({ ...sub, actor: { tipus: 'entitat', id: 'ORG' } }, config);
  expect(sub).not.toHaveProperty('actor');
});

test('I2 · com a persona, l’actor és la persona', async () => {
  m.identitat = { actorId: 'U', actorKey: 'persona::U', actor: { tipus: 'persona', id: 'U', nom: 'Pep' } };
  await envia({ title: 'Hola' });
  expect(m.append).toHaveBeenCalledWith({ title: 'Hola', actor: { tipus: 'persona', id: 'U' } }, config);
});

test('I2 · sense `actor` (només actorId, com als mocs parcials) cau a la persona', async () => {
  await envia({ title: 'Hola' });
  expect(m.append).toHaveBeenCalledWith({ title: 'Hola', actor: { tipus: 'persona', id: 'A' } }, config);
});

test('I2 · l’actor de la identitat mana sobre un actor que porte la publicació', async () => {
  m.identitat = { actorId: 'U', actorKey: 'persona::U', actor: { tipus: 'persona', id: 'U' } };
  await envia({ title: 'Hola', actor: { tipus: 'entitat', id: 'ALTRA' } });
  expect(m.append.mock.calls[0][0].actor).toEqual({ tipus: 'persona', id: 'U' });
});
