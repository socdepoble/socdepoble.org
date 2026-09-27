import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), user: { id: '11111111-1111-4111-8111-111111111111' } }));
vi.mock('./runtime.js', () => ({
  request: mocks.request,
  getResolvedConfig: config => ({ hasSupabaseConfig: true, runtimeDataMode: 'remote', ...config }),
  getCurrentUser: () => mocks.user,
  generateUUID: () => '22222222-2222-4222-8222-222222222222',
  buildSeedAppData: vi.fn(),
  ErrorSupabase: class extends Error { constructor(message, status) { super(message); this.status = status; } }
}));
import { loadNotes, createNote, updateNote, mouNota, esborraNota } from './notes.js';
const config = { tenantId: '33333333-3333-4333-8333-333333333333' };
beforeEach(() => mocks.request.mockReset());
test('tenant absent o ID/revisió invàlids no arriben a la xarxa', async () => {
  await expect(loadNotes(mocks.user.id, {})).rejects.toThrow('Poble');
  await expect(createNote({}, {})).rejects.toThrow('Poble');
  await expect(updateNote(mocks.user.id, {}, 1, {})).rejects.toThrow('Poble');
  await expect(updateNote('n1', {}, 1, config)).rejects.toThrow('Nota');
  await expect(updateNote(mocks.user.id, {}, -1, config)).rejects.toThrow('expectedRevision');
  expect(mocks.request).not.toHaveBeenCalled();
});
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
test('51 notes: primera pàgina lleugera, cursor progressiu i final confirmat', async () => {
  mocks.request.mockResolvedValueOnce(Array.from({ length: 50 }, (_, n) => ({ id: uuid(51 - n), revision: 1, content: 'cos alié' })))
    .mockResolvedValueOnce([{ id: uuid(1), revision: 1 }]).mockResolvedValueOnce([]);
  const first = await loadNotes(mocks.user.id, config);
  expect(first.notes).toHaveLength(50);
  expect(first.notesComplete).toBe(false);
  expect(first.notes[0]).not.toHaveProperty('content');
  expect(mocks.request).toHaveBeenCalledTimes(1);
  const second = await loadNotes(mocks.user.id, { ...config, cursor: first.nextCursor });
  expect(second.notes).toHaveLength(1);
  expect(second.notesComplete).toBe(false); // un servidor pot retallar a una sola fila
  const last = await loadNotes(mocks.user.id, { ...config, cursor: second.nextCursor });
  expect(last.notesComplete).toBe(true);
  expect(mocks.request.mock.calls[1][0]).toContain(`id=lt.${uuid(2)}`);
  expect(mocks.request.mock.calls.every(([url]) => !url.includes('select=*') && !url.includes('offset='))).toBe(true);
});
test('un servidor limitat a 20 files no declara final prematur i el rang confirma el final', async () => {
  mocks.request.mockImplementationOnce(async (_url, _config, options) => {
    options.onResponseMetadata({ contentRange: '0-19/1000' });
    return Array.from({ length: 20 }, (_, n) => ({ id: uuid(1000 - n), revision: 1 }));
  });
  const first = await loadNotes(mocks.user.id, config);
  expect(first.notesComplete).toBe(false);
  mocks.request.mockImplementationOnce(async (_url, _config, options) => {
    options.onResponseMetadata({ contentRange: '0-0/1' });
    return [{ id: uuid(1), revision: 1 }];
  });
  expect((await loadNotes(mocks.user.id, { ...config, cursor: first.nextCursor })).notesComplete).toBe(true);
});
test('el detall conserva el cos; una pàgina repetida o un cursor alié es rebutgen', async () => {
  mocks.request.mockResolvedValueOnce([{ id: uuid(5), revision: 1, content: '<p>cos</p>' }]);
  expect((await loadNotes(mocks.user.id, { ...config, noteId: uuid(5) })).notes[0].content).toBe('<p>cos</p>');
  mocks.request.mockResolvedValueOnce([{ id: uuid(5), revision: 1 }]);
  await expect(loadNotes(mocks.user.id, { ...config, cursor: JSON.stringify([config.tenantId, mocks.user.id, uuid(5)]) })).rejects.toThrow('no avança');
  await expect(loadNotes(mocks.user.id, { ...config, cursor: JSON.stringify(['altre', mocks.user.id, uuid(5)]) })).rejects.toThrow('Cursor');
});

test('el llistat i la consulta per ID només porten notes actives', async () => {
  mocks.request.mockResolvedValueOnce([{ id: uuid(3), revision: 1, status: 'activa', trashed_at: null }])
    .mockResolvedValueOnce([{ id: uuid(3), revision: 1, content: '<p>cos</p>' }]);
  const llista = await loadNotes(mocks.user.id, config);
  await loadNotes(mocks.user.id, { ...config, noteId: uuid(3) });
  const [urlLlista, urlDetall] = mocks.request.mock.calls.map(([url]) => url);
  expect(urlLlista).toContain('&status=eq.activa');
  expect(urlLlista).toContain(',status,trashed_at,');
  expect(urlDetall).toContain('&status=eq.activa');
  expect(llista.notes[0]).toMatchObject({ estat: 'activa', enPapereraAl: null });
});

test('moure i borrar porten la revisió esperada; un estat invàlid no arriba a la xarxa', async () => {
  await expect(mouNota(uuid(4), 'perduda', 2, config)).rejects.toThrow('Estat de nota invàlid');
  await expect(mouNota(uuid(4), 'paperera', -1, config)).rejects.toThrow('expectedRevision');
  await expect(esborraNota(uuid(4), undefined, config)).rejects.toThrow('expectedRevision');
  await expect(mouNota('n1', 'paperera', 2, config)).rejects.toThrow('Nota');
  expect(mocks.request).not.toHaveBeenCalled();

  mocks.request.mockResolvedValueOnce([{ id: uuid(4), revision: 3, status: 'paperera', trashed_at: '2026-09-27T10:00:00Z' }]);
  expect(await mouNota(uuid(4), 'paperera', 2, config)).toMatchObject({ estat: 'paperera', revision: 3 });
  const [urlMou, , opcionsMou] = mocks.request.mock.calls[0];
  expect(urlMou).toContain(`id=eq.${uuid(4)}`);
  expect(urlMou).toContain('&revision=eq.2');
  expect(opcionsMou).toMatchObject({ method: 'PATCH', body: { status: 'paperera' } });
  // La data de paperera la posa el servidor: el client no l'envia.
  expect(opcionsMou.body).not.toHaveProperty('trashed_at');

  mocks.request.mockResolvedValueOnce([{ id: uuid(4), revision: 3 }]);
  expect(await esborraNota(uuid(4), 3, config)).toEqual({ id: uuid(4) });
  const [urlBorra, , opcionsBorra] = mocks.request.mock.calls[1];
  expect(urlBorra).toContain('&revision=eq.3');
  expect(opcionsBorra).toMatchObject({ method: 'DELETE', headers: { Prefer: 'return=representation' } });
});

test('una resposta buida distingix nota absent (404) de revisió vella (409)', async () => {
  mocks.request.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  await expect(esborraNota(uuid(6), 1, config)).rejects.toMatchObject({ status: 404 });
  mocks.request.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: uuid(6) }]);
  await expect(mouNota(uuid(6), 'arxivada', 1, config)).rejects.toMatchObject({ status: 409 });
});
