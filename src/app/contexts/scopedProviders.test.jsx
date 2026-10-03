import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ actor: 'A', user: 'A', gen: 1, load: vi.fn() }));
vi.mock('./IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: m.actor, actorKey: m.actor }) }));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: m.gen, currentUser: { id: m.user } }) }));
vi.mock('../../data/backendPort.js', () => ({ loadMur: m.load, loadMultimedia: m.load, appendSectionSubmissionNetworkOnly: vi.fn() }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
import { MurProvider, useMur } from '../../sections/mur/MurContext.jsx';
import { MultimediaProvider, useMultimedia } from '../../sections/multimedia/MultimediaContext.jsx';
/* Pobles sintètics: backendScope (backendConfig.js) exigix tenant_id UUID. */
const POBLE_A = '00000000-0000-4000-8000-00000000000a';
const POBLE_B = '00000000-0000-4000-8000-00000000000b';
afterEach(() => { cleanup(); m.load.mockReset(); });
test.each([[MurProvider, useMur, 'feedPosts'], [MultimediaProvider, useMultimedia, 'mediaItems']])(
  '%s amaga dades immediatament amb actor, sessió i tenant nous', async (Provider, useData, field) => {
    m.actor = 'A'; m.user = 'A'; m.gen++;
    let config = { tenantId: POBLE_A };
    m.load.mockResolvedValueOnce({ [field]: [{ id: 'A-only' }] });
    const wrapper = ({ children }) => <Provider config={config}>{children}</Provider>;
    const { result, rerender, unmount } = renderHook(useData, { wrapper });
    await waitFor(() => expect(result.current[field]).toHaveLength(1));
    let finish;
    m.load.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    m.actor = 'shared'; m.user = 'B'; m.gen++; rerender();
    expect(result.current[field]).toEqual([]);
    await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
    const old = finish; m.user = 'A'; m.gen++; config = { tenantId: POBLE_B }; rerender();
    expect(result.current[field]).toEqual([]);
    await act(async () => old({ [field]: [{ id: 'B-old' }] }));
    expect(result.current[field]).toEqual([]);
    await waitFor(() => expect(m.load).toHaveBeenCalledTimes(3));
    const signal = m.load.mock.calls[2][1].signal; unmount(); expect(signal.aborted).toBe(true);
  }
);
