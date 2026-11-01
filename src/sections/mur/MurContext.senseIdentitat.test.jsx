/* D-7 (pla 261101_1246; P1-71) · MurProvider muntat FORA d'IdentitatProvider
   (el que deixa una recàrrega en calent amb un context vell), amb una sessió:
   no llança (sense ErrorBoundary, si llançara la prova cauria), llig el Mur
   com un visitant (actorId null) i refusa publicar abans de cap xarxa.
   IdentitatContext.jsx és el de veres. Dades sintètiques. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const m = vi.hoisted(() => ({ loadMur: vi.fn(), envia: vi.fn() }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'persona-a' } }) }));
vi.mock('../../data/backendPort.js', () => ({
  loadMur: m.loadMur,
  loadSeccioPage: vi.fn(),
  appendSectionSubmissionNetworkOnly: m.envia,
  teCapacitat: () => false
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));

import { MurProvider, useMur } from './MurContext.jsx';

const POBLE = '00000000-0000-4000-8000-00000000000a';
afterEach(() => { cleanup(); m.loadMur.mockReset(); m.envia.mockReset(); vi.restoreAllMocks(); });

test('sense IdentitatProvider: llig com a anònim i no escriu cap error', async () => {
  const errors = vi.spyOn(console, 'error');
  m.loadMur.mockResolvedValue({ feedPosts: [{ id: 'p1', title: 'Fira' }], events: [], marketItems: [] });
  const wrapper = ({ children }) => <MurProvider config={{ tenantId: POBLE }}>{children}</MurProvider>;
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(m.loadMur).toHaveBeenCalled();
  expect(m.loadMur.mock.calls.every(([actorId]) => actorId === null)).toBe(true);
  expect(result.current.feedPosts.map((p) => p.id)).toEqual(['p1']);
  expect(errors).not.toHaveBeenCalled();
});

test('sense IdentitatProvider: publicar es refusa amb ErrorIdentitatDeLectura i no arriba al port', async () => {
  m.loadMur.mockResolvedValue({ feedPosts: [], events: [], marketItems: [] });
  const wrapper = ({ children }) => <MurProvider config={{ tenantId: POBLE }}>{children}</MurProvider>;
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await expect(result.current.sendSectionSubmission({ section: 'mur', payload: { title: 'Hola' } }))
    .rejects.toMatchObject({ name: 'ErrorIdentitatDeLectura', code: 'SDP-IDENTITAT-001' });
  expect(m.envia).not.toHaveBeenCalled();
});
