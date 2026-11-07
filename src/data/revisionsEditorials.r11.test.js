import { beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ generation: 0, seed: vi.fn(), editorial: vi.fn() }));
vi.mock('./backendPort.js', () => ({ teCapacitat: cap => ['revisionsLlavor', 'edicioEditorial'].includes(cap),
  desaRevisioSeed: (...args) => state.seed(...args), adminActualitzaPublicacioEditorial: (...args) => state.editorial(...args) }));
vi.mock('./identitat.js', () => ({ capturaSessio: () => { const epoch = state.generation; return () => { if (epoch !== state.generation) throw new DOMException('Changed', 'AbortError'); }; } }));
import { _reiniciaRevisionsEditorialsPerAProves, desaRevisioEditorial, desaRevisioEditorialAmbServidor,
  revisioEditorial, revisaElement, migraRevisionsEditorialsAlServidor, rebutjadaPelServidor } from './revisionsEditorials.js';
import { aplicaRevisionsSeed, marcaFontRevisioSeed } from './seedRevisions.js';
import { marcaFilesEditorials } from './editorialPublicada.js';
const config = { backendId: 'supabase', backendUrl: 'https://backend.example', tenantId: '11111111-1111-4111-8111-111111111111', dataMode: 'remote' };
beforeEach(() => { state.generation = 0; state.seed.mockReset(); state.editorial.mockReset(); _reiniciaRevisionsEditorialsPerAProves(); });

test('existing app_content version keeps the original editorial CAS even with seed capability', async () => {
  state.editorial.mockResolvedValue({ versio: 3 });
  expect(await desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialClau: 'feedPosts', _editorialVersio: 2 }, { title: 'New' }, { config, esSuperadmin: true })).toMatchObject({ desti: 'servidor', versio: 3 });
  expect(state.editorial).toHaveBeenCalledTimes(1); expect(state.seed).not.toHaveBeenCalled();
});
test('first seed save sends only current explicit changes; unowned legacy fields stay local', async () => {
  desaRevisioEditorial('mur', 'post', { title: 'Legacy private draft', content: '<p>Unattributed old body</p>' });
  state.seed.mockImplementation(async input => ({ ...input, versio: input.versio + 1 }));
  expect(await desaRevisioEditorialAmbServidor('mur', { id: 'post', _seedFontVersio: 1 }, { title: 'Current title' }, { config })).toMatchObject({ desti: 'servidor', versio: 1 });
  expect(state.seed.mock.calls[0][0].camps).toEqual({ title: 'Current title' });
  expect(revisioEditorial('mur', 'post').content).toContain('Unattributed');
  expect(revisaElement('mur', { id: 'post', _seedRevisioVersio: 1, content: 'Server body' }).content).toContain('Unattributed');
});
test('selected migration retains every local revision on success or rejection', async () => {
  desaRevisioEditorial('mur', 'one', { title: 'One' }); desaRevisioEditorial('events', 'two', { content: '<p>Two</p>' });
  state.seed.mockImplementation(async input => { if (input.id === 'two') throw Object.assign(new Error('Conflict'), { code: 'conflicte-versio' }); return { ...input, versio: input.versio + 1 }; });
  const selected = [{ seccio: 'mur', id: 'one', camps: { title: 'One' }, versio: 0, fontVersio: 1 }, { seccio: 'events', id: 'two', camps: { content: '<p>Two</p>' }, versio: 0, fontVersio: 1 }];
  const result = await migraRevisionsEditorialsAlServidor(selected, { config });
  expect(result.map(row => row.desti)).toEqual(['servidor', 'navegador']);
  expect(revisioEditorial('mur', 'one')).toEqual({ title: 'One' }); expect(revisioEditorial('events', 'two')).toEqual({ content: '<p>Two</p>' });
  expect(revisaElement('mur', { id: 'one', title: 'Server current', _seedRevisioVersio: 1 }).title).toBe('Server current');
});
test('changed selection and session switch cannot migrate further rows', async () => {
  desaRevisioEditorial('mur', 'one', { title: 'Actual' });
  await expect(migraRevisionsEditorialsAlServidor([{ seccio: 'mur', id: 'one', camps: { title: 'Old' }, versio: 0, fontVersio: 1 }], { config })).rejects.toThrow('ha canviat');
  expect(state.seed).not.toHaveBeenCalled();
  state.seed.mockImplementation(async input => { state.generation++; return { ...input, versio: 1 }; });
  const result = await migraRevisionsEditorialsAlServidor([{ seccio: 'mur', id: 'one', camps: { title: 'Actual' }, versio: 0, fontVersio: 1 }], { config });
  expect(result[0]).toMatchObject({ desti: 'navegador', motiu: 'avortada' }); expect(revisioEditorial('mur', 'one')).toEqual({ title: 'Actual' });
});
test('an acknowledged local revision never overlays a newer canonical source', async () => {
  state.seed.mockImplementation(async input => ({ ...input, versio: input.versio + 1 }));
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _seedFontVersio: 1 }, { title: 'Old seed edition' }, { config });
  const current = { id: 'post', title: 'New canonical edition', _editorialVersio: 2 };
  expect(revisaElement('mur', current)).toBe(current);
});

/* Àrbitre R11 (R33-L2-01) · La forma REAL que produïx el lector: tota peça
   d'app_content porta _editorialVersio i també _seedFontVersio (la versió de la fila). */
const delLector = (revisions = []) => marcaFontRevisioSeed(aplicaRevisionsSeed(marcaFilesEditorials([{ id: 'post', owner_user_id: 'A', title: 'Canonical' }], 'feedPosts', 4), revisions, 4), 4)[0];
test('R33-L2-01 · the owner (not superadmin) reaches desaRevisioSeed with the loader shape, first save and after an overlay', async () => {
  state.seed.mockImplementation(async input => ({ ...input, versio: input.versio + 1 }));
  const first = delLector();
  expect([first._editorialVersio, first._seedFontVersio, first._seedRevisioVersio]).toEqual([4, 4, undefined]);
  expect(await desaRevisioEditorialAmbServidor('mur', first, { title: 'Owner title' }, { config, esSuperadmin: false })).toMatchObject({ desti: 'servidor', versio: 1 });
  expect(state.seed.mock.calls[0][0]).toMatchObject({ seccio: 'mur', id: 'post', versio: 0, fontVersio: 4, camps: { title: 'Owner title' } });
  const revised = delLector([{ seccio: 'mur', id: 'post', camps: { title: 'Owner title' }, versio: 1, fontVersio: 4 }]);
  expect(await desaRevisioEditorialAmbServidor('mur', revised, { lead: 'Owner lead' }, { config, esSuperadmin: false })).toMatchObject({ desti: 'servidor', versio: 2 });
  expect(state.seed.mock.calls[1][0]).toMatchObject({ versio: 1, fontVersio: 4 });
  expect(state.editorial).not.toHaveBeenCalled();
});
test('R33-L2-01 · superadmin keeps the row RPC; without the seed marker nothing is sent; a client-side refusal is not a server refusal', async () => {
  state.editorial.mockResolvedValue({ versio: 5 });
  expect(await desaRevisioEditorialAmbServidor('mur', delLector(), { title: 'Admin' }, { config, esSuperadmin: true })).toMatchObject({ desti: 'servidor', versio: 5 });
  expect(state.seed).not.toHaveBeenCalled();
  const { _seedFontVersio, ...senseLectura } = delLector();
  expect(_seedFontVersio).toBe(4);
  expect(await desaRevisioEditorialAmbServidor('mur', senseLectura, { title: 'No read' }, { config, esSuperadmin: false })).toEqual({ desada: true, desti: 'navegador', motiu: 'sense-permis' });
  const refused = await desaRevisioEditorialAmbServidor('mur', delLector(), { tags: ['x'.repeat(81)] }, { config, esSuperadmin: false });
  expect(refused).toEqual({ desada: true, desti: 'navegador', motiu: 'revisio-no-enviable' });
  expect(rebutjadaPelServidor(refused)).toBe(false); expect(state.seed).not.toHaveBeenCalled();
});
