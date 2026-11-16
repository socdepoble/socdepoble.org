/* Onada R30 · PF-01 (àrbitre, P2) · El grup «Notes personals» de l'assignació d'emojis
   (AssignacioEmoji de veres) pinta les mateixes carpetes del Bloc abans i després de migrar una
   carpeta que només era al navegador. Les carpetes d'este grup són les del port (mai les locals
   de carpetesCreades): després de migrar, la rèplica remota «Festes» (f-<uuid>) hi arriba, i
   sense el filtre (useCarpetesDelBlocVisibles) seria un destí nou. Els mateixos simulacres que
   AssignacioEmoji.test.jsx. Dades sintètiques. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const AMBIT = 'supabase:poble_persona::1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5_7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const REPLICA = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';

const bloc = vi.hoisted(() => ({ valor: null }));
vi.mock('../../notes/NotesContext.jsx', () => ({ useNotes: () => bloc.valor }));
vi.mock('../../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSessioOpcional: () => null,
}));
vi.mock('../../../data/wikiManifest.js', () => ({
  wikiManifest: { categories: [], items: [{ id: 'genoma', title: 'Genoma', subtitle: 'Qui som', categoryId: null }] }
}));
vi.mock('../../wiki-de-poble/WikiDePobleSection.jsx', () => ({ modulsLocalsActius: () => ({ categories: [], items: [] }) }));

import { AssignacioEmoji } from './AssignacioEmoji.jsx';
import { NOTE_FOLDERS_SEED } from '../../../data/carpetesSeed.js';
import { _reiniciaCarpetesCreades, desaCarpetaCreada } from '../../../components/universal/classificacio/carpetesCreades.js';
import { _reiniciaMigracioCarpetes, registraReplica } from '../../../components/universal/classificacio/migracioCarpetesLocals.js';

const NOTES = Object.freeze([{ id: 'n-1', title: 'Les festes', folderId: 'f-festes', icon: '' }]);

beforeEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
  bloc.valor = { notes: NOTES, noteFolders: [...NOTE_FOLDERS_SEED], scopeKey: AMBIT, status: 'ready', teSessio: true, setLocalNoteField: vi.fn() };
  desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

/* Els noms de les files de «Notes personals» (les carpetes del Bloc i després les notes). */
const filesDelBloc = async () => {
  const vista = render(<AssignacioEmoji emoji="🧀" nom="cheese wedge" onFet={vi.fn()} />);
  await screen.findByText('Genoma');
  const grup = screen.getByRole('heading', { level: 3, name: 'Notes personals' }).closest('section');
  const noms = within(grup).getAllByRole('button').map((boto) => boto.querySelector('.sdp-xat-fila__nom').textContent);
  vista.unmount();
  return noms;
};

test('abans i després de migrar, «Notes personals» pinta les mateixes carpetes i cap «Festes» nova', async () => {
  const abans = await filesDelBloc();
  expect(abans).toContain('Mur');
  expect(abans).not.toContain('Festes');
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  bloc.valor = { ...bloc.valor, noteFolders: [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }] };
  const despres = await filesDelBloc();
  expect(despres).toEqual(abans);
  expect(despres).not.toContain('Festes');
});
