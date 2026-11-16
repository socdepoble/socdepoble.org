/* Onada R30 · PF-01 (àrbitre, P2) · El diàleg «Carpeta» d'una connexió (ConnexioDetall de
   veres) ofereix les mateixes carpetes abans i després de migrar una carpeta que només era al
   navegador. Com Connectar, el detall mai ha ensenyat les carpetes locals (carpetesCreades):
   després de migrar, la rèplica remota «Festes» (f-<uuid>) arriba amb les del port, i sense el
   filtre (useCarpetesDelBlocVisibles) seria una opció nova. Els mateixos simulacres que
   ConnexioDetall.test.jsx. Dades sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

const AMBIT = 'supabase:poble_persona::1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5_7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const REPLICA = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), user: { id: 'U' }, t: (_, alternativa) => alternativa,
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  notes: {
    noteFolders: [], notes: [], scopeKey: null, setLocalNoteField: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(),
    compartirNota: vi.fn(), potEsborrar: true, config: {}
  }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('./NotesContext.jsx', () => ({ useNotes: () => mocks.notes }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
import { ConnexioDetall } from './ConnexioDetall.jsx';
import { NOTE_FOLDERS_SEED } from '../../data/carpetesSeed.js';
import { _reiniciaCarpetesCreades, desaCarpetaCreada } from '../../components/universal/classificacio/carpetesCreades.js';
import { _reiniciaMigracioCarpetes, registraReplica } from '../../components/universal/classificacio/migracioCarpetesLocals.js';

const SAMARRETA = { id: 'samarreta-socdepoble', title: 'Samarreta', image_url: '/assets/x.png', author_name: 'Sóc de Poble' };
const CONNEXIO = Object.freeze({
  id: 'n-9', title: 'Samarreta', folderId: 'f-connectats', content: '<p>Element connectat.</p>',
  origen: { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta', autorNom: 'Sóc de Poble', ruta: '/mercat/samarreta-socdepoble', objecte: 'producte' }
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [SAMARRETA] };
  Object.assign(mocks.notes, {
    noteFolders: [...NOTE_FOLDERS_SEED], notes: [CONNEXIO, { id: 'n-1', title: 'Les festes', folderId: 'f-festes' }], scopeKey: AMBIT
  });
  desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

/* Les opcions del diàleg «Carpeta», pel seu nom accessible i en l'ordre en què es pinten. */
const opcionsDelDialeg = () => {
  const vista = render(<ConnexioDetall nota={CONNEXIO} />);
  fireEvent.click(screen.getByRole('button', { name: 'Carpeta: Safata d’Entrada' }));
  const noms = screen.getAllByRole('radio', { hidden: true }).map((opcio) => opcio.labels[0]?.textContent.trim());
  vista.unmount();
  return noms;
};

test('abans i després de migrar, el diàleg ofereix les mateixes carpetes i cap «Festes» nova', () => {
  const abans = opcionsDelDialeg();
  expect(abans).toContain('Mur');
  expect(abans).not.toContain('Festes');
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  mocks.notes.noteFolders = [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }];
  const despres = opcionsDelDialeg();
  expect(despres).toEqual(abans);
  expect(despres).not.toContain('Festes');
});
