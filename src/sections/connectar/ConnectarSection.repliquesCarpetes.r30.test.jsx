import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Onada R30 · PF-01 (àrbitre, P2) · «On arriba» (ConnectarSection de veres) pinta els mateixos
   botons de carpeta abans i després de migrar una carpeta que només era al navegador. Connectar
   mai ha ensenyat les carpetes locals (carpetesCreades): després de migrar, la càrrega del port
   porta la rèplica remota «Festes» (f-<uuid>), i sense el filtre (useCarpetesDelBlocVisibles)
   eixiria com una opció nova; triar-la partiria la carpeta en dues «Festes» al Bloc d'este
   dispositiu. Els mateixos simulacres que ConnectarSection.test.jsx. Dades sintètiques. */
const AMBIT = 'supabase:poble_persona::1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5_7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const REPLICA = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), update: vi.fn(), refresh: vi.fn(), user: { id: 'U' },
  params: new URLSearchParams(), folders: [], notes: [], scopeKey: null, config: {}, t: (_, alternativa) => alternativa,
  identitat: { actor: { tipus: 'persona', nom: 'Pepa Soler' }, identitats: [{ tipus: 'persona', nom: 'Pepa Soler' }] },
  xat: { chatThreads: [], cercaMembres: vi.fn(), creaFil: vi.fn(), sendChatMessage: vi.fn() },
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }), useUIActionsOpcional: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => mocks.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../notes/NotesDataContext', () => ({
  useNotesData: () => ({
    noteFolders: mocks.folders, notes: mocks.notes, scopeKey: mocks.scopeKey, creaNota: mocks.crea, updateNote: mocks.update,
    canCreate: true, config: mocks.config, status: 'ready', error: null, refresh: mocks.refresh
  })
}));
vi.mock('./organitzacio/BlocAdministrarOrganitzacio.jsx', () => ({ BlocAdministrarOrganitzacio: () => null }));
import ConnectarSection from './ConnectarSection.jsx';
import { NOTE_FOLDERS_SEED } from '../../data/carpetesSeed.js';
import { _reiniciaCarpetesCreades, desaCarpetaCreada } from '../../components/universal/classificacio/carpetesCreades.js';
import { _reiniciaMigracioCarpetes, registraReplica } from '../../components/universal/classificacio/migracioCarpetesLocals.js';

const PARAMS = 'item_id=samarreta-socdepoble&title=Samarreta&sectionId=mercat&targetUserId=socdepoble&autorTipus=entitat&author=S%C3%B3c%20de%20Poble';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
  mocks.params = new URLSearchParams(PARAMS);
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [] };
  mocks.xat.cercaMembres.mockResolvedValue([]);
  mocks.folders = [...NOTE_FOLDERS_SEED];
  mocks.notes = [{ id: 'n-1', title: 'Les festes', folderId: 'f-festes' }];
  mocks.scopeKey = AMBIT;
  desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

/* Els noms dels botons del grup «On arriba» (sense la insignia «Triada»), en l'ordre en què es pinten. */
const botonsDeCarpeta = () => {
  const vista = render(<ConnectarSection />);
  const grup = screen.getByRole('group', { name: 'On arriba' });
  const noms = within(grup).getAllByRole('button').map((boto) => boto.querySelector('.sdp-connectar__carpeta-nom')?.textContent);
  vista.unmount();
  return noms;
};

test('abans i després de migrar, «On arriba» pinta els mateixos botons i cap «Festes» nova', () => {
  const abans = botonsDeCarpeta();
  expect(abans).toContain('Safata d’Entrada');
  expect(abans).not.toContain('Festes');
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  mocks.folders = [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }];
  const despres = botonsDeCarpeta();
  expect(despres).toEqual(abans);
  expect(despres).not.toContain('Festes');
});

test('una rèplica que ja té notes (d’un altre dispositiu) es pot triar, com qualsevol carpeta del servidor', () => {
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  mocks.folders = [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }];
  mocks.notes = [...mocks.notes, { id: 'n-2', title: 'Des del mòbil', folderId: REPLICA }];
  expect(botonsDeCarpeta().filter((nom) => nom === 'Festes')).toHaveLength(1);
});
