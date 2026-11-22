/* v1.2.20 · Gauntlet R1 (L2-01) · La revisió privada d'una pàgina de WordPress escriu en un esborrany
   en memòria (scopeKey null: ni cua de desat ni nota creada). El panell ja diu «Esborrany en memòria:
   no s'ha creat cap nota»; l'editor no pot dir alhora «Esborrany privat desat al servidor».
   ImportacioPaginaWpNotes i NotesEditor són de veres; DocumentEditor és un doble que guarda l'adaptador. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ sessio: null, base: null, adapter: null }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => state.sessio, useSession: () => state.sessio, ESTAT: { DINS: 'dins' }
}));
vi.mock('../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a>, useNavigate: () => vi.fn() }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => ({ actor: { tipus: 'persona', id: 'actor-a', nom: 'Pepa' }, actorId: 'actor-a', memberships: [] })
}));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({ UniversalWorkspace: ({ renderDetail }) => <div data-testid="workspace">{renderDetail()}</div> }));
vi.mock('./NotesContext.jsx', async (importOriginal) => {
  const real = await importOriginal();
  const { useContext } = await import('react'); const { NotesContext } = await import('./objectesDeContext.js');
  return {
    ...real,
    useNotes: () => useContext(NotesContext) ?? state.base,
    ValorDeNotes: ({ value, children }) => <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  };
});
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { state.adapter = adapter; return <div data-testid="editor" />; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
import ImportacioPaginaWpNotes from './ImportacioPaginaWpNotes.jsx';
import { TEXTOS_HONESTEDAT_DESAT } from './honestedatDesat.js';

const slug = 'el-lexic-del-blat-al-comtat';
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  state.adapter = null;
  state.sessio = { currentUser: { id: 'fixture-admin-a' }, generacio: 1, estat: 'dins', esSuperadmin: true, nivell: 'aal2' };
  state.base = {
    teSessio: true, config: { dataMode: 'supabase' }, scopeKey: 'account-a', workspaceKey: 'account-a', t: (_c, r) => r,
    noteFolders: [], notes: [], notesComplete: true, creaNota: vi.fn(), updateNote: vi.fn(), publishNote: vi.fn(), saveNoteField: vi.fn()
  };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('L2-01 · la revisió d’una pàgina WP diu que els canvis només són en esta pantalla, també després d’escriure', async () => {
  render(<ImportacioPaginaWpNotes clau={slug} />);
  await screen.findByTestId('editor');
  expect(screen.getByText(/Esborrany en memòria: no s’ha creat cap nota/)).toBeTruthy();
  const { memoria, privada } = TEXTOS_HONESTEDAT_DESAT.ca;
  expect(state.adapter.textEstatDesament).toBe(memoria);
  await act(async () => { await state.adapter.saveRemote(state.adapter.document.id, 'title', 'Títol revisat'); });
  expect(state.adapter.document.title).toBe('Títol revisat');
  expect(state.base.saveNoteField).not.toHaveBeenCalled();
  expect(state.adapter.textEstatDesament).toBe(memoria);
  expect(state.adapter.textEstatDesament).not.toBe(privada);
});
