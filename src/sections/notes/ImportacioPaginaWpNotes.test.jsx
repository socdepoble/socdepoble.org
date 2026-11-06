import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ sessio: null, base: null, actorId: 'actor-a', channels: [] }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => state.sessio }));
vi.mock('../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({ useIdentitatOReserva: () => ({ actorId: state.actorId }) }));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({ UniversalWorkspace: ({ renderDetail }) => <div data-testid="workspace">{renderDetail()}</div> }));
vi.mock('./NotesContext.jsx', async () => {
  const { useContext } = await import('react'); const { NotesContext } = await import('./objectesDeContext.js');
  return { useNotes: () => useContext(NotesContext) ?? state.base };
});
vi.mock('./NotesEditor.jsx', async () => {
  const { useNotes } = await import('./NotesContext.jsx');
  const { useCanalAmbit } = await import('../../components/universal/ambits/canalAmbit.js');
  return { default: function MockNotesEditor({ activeNote }) {
    const ctx = useNotes(), channel = useCanalAmbit(); state.channels.push(channel?.pendent);
    return <div data-testid="notes-editor"><h2>{activeNote.title}</h2>
      <textarea aria-label="Cos en revisió" value={activeNote.content} onChange={event => ctx.setLocalNoteField(activeNote.id, 'content', event.target.value)} />
      <button onClick={() => ctx.publishNote(activeNote).catch(() => {})}>Publica des de l’editor</button>
    </div>;
  } };
});
vi.mock('../../utils/transformadorEditorialWpBlogger.js', async original => {
  const real = await original(); return { ...real, carregaPaginaImportadaPerRevisio: vi.fn(real.carregaPaginaImportadaPerRevisio) };
});
import ImportacioPaginaWpNotes from './ImportacioPaginaWpNotes.jsx';
import { carregaPaginaImportadaPerRevisio } from '../../utils/transformadorEditorialWpBlogger.js';
const slug = 'el-lexic-del-blat-al-comtat';
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto); vi.clearAllMocks(); state.channels = []; state.actorId = 'actor-a';
  state.sessio = { currentUser: { id: 'fixture-admin-a' }, generacio: 1, estat: 'dins', esSuperadmin: true, nivell: 'aal2' };
  state.base = { teSessio: true, config: { dataMode: 'supabase' }, scopeKey: 'account-a', workspaceKey: 'account-a',
    creaNota: vi.fn(), updateNote: vi.fn(), publishNote: vi.fn(), saveNoteField: vi.fn() };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('IDEA-111 · /notes en revisió privada', () => {
  test('obri el NotesEditor amb canal mur/Edició avançada, i editar no escriu al backend', async () => {
    render(<ImportacioPaginaWpNotes clau={slug} />);
    const editor = await screen.findByRole('textbox', { name: 'Cos en revisió' });
    expect(editor.value).toContain('data-sdp-youtube="VBzEBQq_4LA"');
    expect(state.channels).toContain('mur');
    expect(screen.getByRole('button', { name: 'Aprova esta revisió' }).disabled).toBe(false);
    fireEvent.change(editor, { target: { value: '<p>Una revisió encara privada</p>' } });
    expect(state.base.creaNota).not.toHaveBeenCalled(); expect(state.base.updateNote).not.toHaveBeenCalled();
    expect(state.base.saveNoteField).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Publica des de l’editor' }));
    await screen.findByText(/WP_REVISIO_PENDENT/);
    expect(state.base.publishNote).not.toHaveBeenCalled(); expect(state.base.creaNota).not.toHaveBeenCalled();
  });
  test('canviar actor/compte elimina els canvis anteriors; ni el retorn A→B→A els recupera', async () => {
    const view = render(<ImportacioPaginaWpNotes clau={slug} />);
    const editor = await screen.findByRole('textbox', { name: 'Cos en revisió' });
    fireEvent.change(editor, { target: { value: '<p>SECRET EDITORIAL DEL COMPTE A</p>' } });
    state.actorId = 'actor-b'; state.sessio = { ...state.sessio, generacio: 2, currentUser: { id: 'b' } };
    state.base = { ...state.base, scopeKey: 'b', workspaceKey: 'b' }; view.rerender(<ImportacioPaginaWpNotes clau={slug} />);
    expect(view.container.textContent).not.toContain('SECRET EDITORIAL');
    await screen.findByRole('textbox', { name: 'Cos en revisió' });
    expect(screen.getByRole('textbox').value).not.toContain('SECRET EDITORIAL');
    state.actorId = 'actor-a'; state.sessio = { ...state.sessio, generacio: 3, currentUser: { id: 'fixture-admin-a' } };
    state.base = { ...state.base, scopeKey: 'account-a', workspaceKey: 'account-a' }; view.rerender(<ImportacioPaginaWpNotes clau={slug} />);
    expect((await screen.findByRole('textbox')).value).not.toContain('SECRET EDITORIAL');
  });
  test('una càrrega antiga resolta després d’un canvi de slug no xafa la nova', async () => {
    let finish;
    vi.mocked(carregaPaginaImportadaPerRevisio).mockImplementationOnce(() => new Promise(r => { finish = r; }));
    const view = render(<ImportacioPaginaWpNotes clau={slug} />);
    const next = 'el-lexic-del-raim-i-del-vi-al-comtat'; view.rerender(<ImportacioPaginaWpNotes clau={next} />);
    const editor = await screen.findByRole('textbox'); expect(editor.value).toContain('vpTVDipdXi4');
    finish({ slug, title: 'RESPOSTA ANTIGA', htmlNet: 'Text antic' });
    await waitFor(() => expect(screen.getByRole('textbox').value).toContain('vpTVDipdXi4'));
    expect(view.container.textContent).not.toContain('RESPOSTA ANTIGA');
  });
  test('sense sessió o sense segon factor no carrega ni munta cap editor', () => {
    state.sessio = null; const view = render(<ImportacioPaginaWpNotes clau={slug} />);
    expect(carregaPaginaImportadaPerRevisio).not.toHaveBeenCalled(); expect(screen.queryByTestId('notes-editor')).toBeNull();
    state.sessio = { currentUser: { id: 'a' }, estat: 'dins', esSuperadmin: true, nivell: 'aal1' };
    view.rerender(<ImportacioPaginaWpNotes clau={slug} />); expect(carregaPaginaImportadaPerRevisio).not.toHaveBeenCalled();
  });
});
