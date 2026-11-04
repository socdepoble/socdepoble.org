import React, { Profiler } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Ronda 7 (GLOBAL-03, revisió 261104) · Quan la vista passa a 'element' (el
   perfil d'una entitat teua sense cap altre barret, C1), «Guardar a les teues
   notes» s'obri en el MATEIX commit: cap commit pinta l'objecte amb les notes
   plegades. Amb l'efecte d'abans n'hi havia dos (ho va mesurar el revisor amb
   un Profiler), i la C1 de ConnectarSection.fedi22.test no ho veia. */
const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), user: { id: 'U' },
  params: new URLSearchParams(), t: (_, alternativa) => alternativa, identitat: null,
  xat: { chatThreads: [], cercaMembres: vi.fn(), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  capacitats: new Set(), perfil: vi.fn(), estat: vi.fn(), titular: vi.fn(), llista: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => m.navigate,
  useSearchParams: () => [m.params],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: m.t }), useUIActionsOpcional: () => ({ t: m.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => m.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => m.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => m.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => m.media }));
vi.mock('../notes/NotesDataContext', () => ({
  useNotesData: () => ({
    noteFolders: [], notes: [], creaNota: m.crea, updateNote: vi.fn(),
    canCreate: true, config: {}, status: 'ready', error: null, refresh: vi.fn()
  })
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => m.capacitats.has(cap),
  loadPerfilPublic: (...args) => m.perfil(...args),
  estatSeguiment: (...args) => m.estat(...args),
  loadTitularPublic: (...args) => m.titular(...args),
  llistaMembresOrganitzacio: (...args) => m.llista(...args)
}));
import ConnectarSection from './ConnectarSection.jsx';
import { XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';

const UUID_ORG = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091';
const UUID_SOCDEPOBLE = '0e9d8c7b-6a5f-4e3d-9c2b-1a0f9e8d7c6b';
const TONI = Object.freeze({ tipus: 'persona', id: 'U', nom: 'Toni Ferrer' });
const RENTONAR = Object.freeze({ tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar', rol: 'owner', kind: 'entity' });
const PERFIL_ORG = `item_id=${UUID_ORG}&title=Impostora&sectionId=perfil&objecte=entitat&ruta=%2Fempresa%2F${UUID_ORG}&organitzacio=${UUID_ORG}`;
const XAT_REMOT = Object.freeze({ estat: 'remot', href: `/xat?amb=${UUID_SOCDEPOBLE}`, avis: null, resol: null });

/* A cada commit: si ja es pinta l'objecte ('element') i si les notes són obertes. */
const commits = [];
const enCommit = () => {
  const notes = document.querySelector('details.sdp-connectar__notes');
  commits.push({ element: Boolean(document.querySelector('.sdp-connectar__previsualitzacio')), obertes: notes ? notes.open : null });
};
const vista = () => (
  <Profiler id="connectar" onRender={enCommit}>
    <XatSocDePobleContext.Provider value={XAT_REMOT}><ConnectarSection /></XatSocDePobleContext.Provider>
  </Profiler>
);

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  commits.length = 0;
  m.params = new URLSearchParams(PERFIL_ORG);
  m.identitat = { actor: TONI, identitats: [TONI, RENTONAR], memberships: [{ id: UUID_ORG, slug: 'el-rentonar', name: 'El Rentonar', role: 'owner' }] };
  m.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [] };
  m.capacitats = new Set(['directori', 'seguiments', 'membresOrganitzacio']);
  m.perfil.mockImplementation(async (id) => (id === UUID_ORG ? { tipus: 'entitat', id: UUID_ORG, nom: 'El Rentonar', poble: 'Relleu' } : null));
  m.estat.mockResolvedValue({ seguint: false, creatAl: null });
  m.titular.mockResolvedValue(null);
  m.llista.mockResolvedValue([]);
  m.xat.cercaMembres.mockResolvedValue([]);
});

describe('GLOBAL-03 · les notes, obertes en el mateix commit que la vista «element»', () => {
  test('cap commit pinta l’objecte amb les notes plegades', async () => {
    render(vista());
    await waitFor(() => expect(document.querySelector('.sdp-connectar__previsualitzacio')).toBeTruthy());
    for (let i = 0; i < 5; i += 1) await act(async () => {});
    expect(commits.some((c) => c.element)).toBe(true);
    expect(commits.filter((c) => c.element && c.obertes === false)).toEqual([]);
    expect(document.querySelector('details.sdp-connectar__notes').open).toBe(true);
  });
});
