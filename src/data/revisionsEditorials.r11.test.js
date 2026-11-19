import { beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ generation: 0, seed: vi.fn(), editorial: vi.fn() }));
import { CONTRACTE_NUCLI } from './contracte.js';
import { setBackendImplementation } from './backendPort.js';
vi.mock('./identitat.js', () => ({ entradaSessio: () => state.generation, capturaSessio: () => { const epoch = state.generation; return () => { if (epoch !== state.generation) throw new DOMException('Changed', 'AbortError'); }; } }));
import { _reiniciaRevisionsEditorialsPerAProves, desaRevisioEditorial, desaRevisioEditorialAmbServidor,
  revisioEditorial, revisaElement, migraRevisionsEditorialsAlServidor, rebutjadaPelServidor } from './revisionsEditorials.js';
import { aplicaRevisionsSeed, marcaFontRevisioSeed } from './seedRevisions.js';
import { marcaFilesEditorials } from './editorialPublicada.js';
const config = { backendId: 'supabase', backendUrl: 'https://backend.example', tenantId: '11111111-1111-4111-8111-111111111111', dataMode: 'remote' };
beforeEach(() => {
  state.generation = 0; state.seed.mockReset(); state.editorial.mockReset(); _reiniciaRevisionsEditorialsPerAProves();
  // El port real manté el mateix adaptador en imports dinàmics concurrents.
  // Un vi.mock del mòdul pot retornar el namespace original al segon import.
  setBackendImplementation({ ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, () => null])),
    loadSeedRevisions: async () => [], desaRevisioSeed: (...args) => state.seed(...args),
    adminActualitzaPublicacioEditorial: (...args) => state.editorial(...args) });
});

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


test('R32.10 · late row RPC acknowledgement after logout cannot mark the browser copy or confirm a version', async () => {
  let finish;
  state.editorial.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const pending = desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'Draft A' }, { config, esSuperadmin: true });
  await vi.waitFor(() => expect(state.editorial).toHaveBeenCalledTimes(1));
  state.generation++;
  finish({ versio: 3 });
  await expect(pending).resolves.toMatchObject({ desti: 'navegador', motiu: 'avortada' });
  const current = { id: 'post', title: 'Server title', _editorialVersio: 3 };
  expect(revisaElement('mur', current).title).toBe('Draft A');
  state.editorial.mockResolvedValueOnce({ versio: 3 });
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'Draft B' }, { config, esSuperadmin: true });
  expect(state.editorial.mock.calls[1][0].versio).toBe(2);
});

test('R32.10 · a queued row edit from the previous session never reaches the new session', async () => {
  let finish;
  state.editorial.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue({ versio: 4 });
  const element = { id: 'post', _editorialVersio: 2 };
  const first = desaRevisioEditorialAmbServidor('mur', element, { title: 'First' }, { config, esSuperadmin: true });
  await vi.waitFor(() => expect(state.editorial).toHaveBeenCalledTimes(1));
  const queued = desaRevisioEditorialAmbServidor('mur', element, { title: 'Queued' }, { config, esSuperadmin: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  state.generation++;
  finish({ versio: 3 });
  expect((await Promise.all([first, queued])).map(row => row.motiu)).toEqual(['avortada', 'avortada']);
  expect(state.editorial).toHaveBeenCalledTimes(1);
  expect(revisioEditorial('mur', 'post').title).toBe('Queued');
});

test('R32.10 · confirmed row versions are isolated by backend and by session entry', async () => {
  state.editorial.mockResolvedValueOnce({ versio: 8 }).mockResolvedValueOnce({ versio: 3 }).mockResolvedValueOnce({ versio: 2 });
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 7 }, { title: 'A' }, { config, esSuperadmin: true });
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'B' }, { config: { ...config, backendUrl: 'https://other.example' }, esSuperadmin: true });
  state.generation++;
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 1 }, { title: 'C' }, { config, esSuperadmin: true });
  expect(state.editorial.mock.calls.map(([input]) => input.versio)).toEqual([7, 2, 1]);
});

test('R32.10 · seed confirmations from a previous session cannot advance a new actor CAS', async () => {
  state.seed.mockImplementation(async input => ({ ...input, versio: input.versio + 1 }));
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _seedFontVersio: 1, _seedRevisioVersio: 5 }, { title: 'A' }, { config });
  state.generation++;
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _seedFontVersio: 1 }, { title: 'B' }, { config });
  expect(state.seed.mock.calls.map(([input]) => input.versio)).toEqual([5, 0]);
});

test('a queued call cannot move to a mutable new backend while reusing the old CAS', async () => {
  let finish;
  state.editorial.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue({ versio: 4 });
  const moving = { ...config };
  const first = desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'First' }, { config: moving, esSuperadmin: true });
  await vi.waitFor(() => expect(state.editorial).toHaveBeenCalledTimes(1));
  const queued = desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'Queued' }, { config: moving, esSuperadmin: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  moving.backendUrl = 'https://other.example';
  finish({ versio: 3 });
  await Promise.all([first, queued]);
  expect(state.editorial.mock.calls[1][1].backendUrl).toBe('https://backend.example');
});
test('an explicitly aborted queued call cannot invoke the write adapter', async () => {
  let finish;
  state.editorial.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue({ versio: 4 });
  const controller = new AbortController();
  const first = desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'First' }, { config, esSuperadmin: true });
  await vi.waitFor(() => expect(state.editorial).toHaveBeenCalledTimes(1));
  const queued = desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'Queued' }, { config, signal: controller.signal, esSuperadmin: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  controller.abort();
  finish({ versio: 3 });
  await Promise.all([first, queued]);
  expect(state.editorial).toHaveBeenCalledTimes(1);
});


test('R32.10 · seed inputs and queued row CAS are immutable at call time', async () => {
  state.seed.mockImplementation(async input => ({ ...input, versio: input.versio + 1 }));
  const fields = { title: 'Reviewed', tags: ['reviewed'] };
  const seed = desaRevisioEditorialAmbServidor('mur', { id: 'seed', _seedFontVersio: 1 }, fields, { config });
  fields.title = 'Mutated'; fields.tags.push('mutated');
  await seed;
  expect(state.seed.mock.calls[0][0].camps).toEqual({ title: 'Reviewed', tags: ['reviewed'] });
  let finish;
  state.editorial.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue({ versio: 4 });
  const row = { id: 'post', _editorialVersio: 2 };
  const first = desaRevisioEditorialAmbServidor('mur', row, { title: 'First' }, { config, esSuperadmin: true });
  await vi.waitFor(() => expect(state.editorial).toHaveBeenCalledTimes(1));
  const queued = desaRevisioEditorialAmbServidor('mur', row, { title: 'Next' }, { config, esSuperadmin: true });
  row._editorialVersio = 999;
  finish({ versio: 3 });
  await Promise.all([first, queued]);
  expect(state.editorial.mock.calls.map(([input]) => input.versio)).toEqual([2, 3]);
});

test('R32.10 · simultaneous backends and old unowned fields never cross the publication boundary', async () => {
  desaRevisioEditorial('mur', 'post', { content: '<p>Unowned local draft</p>' });
  state.editorial.mockImplementation(async input => ({ versio: input.versio + 1 }));
  const element = { id: 'post', _editorialVersio: 2 };
  const results = await Promise.all([
    desaRevisioEditorialAmbServidor('mur', element, { title: 'Backend A' }, { config, esSuperadmin: true }),
    desaRevisioEditorialAmbServidor('mur', element, { title: 'Backend B' }, { config: { ...config, backendUrl: 'https://other.example' }, esSuperadmin: true })
  ]);
  expect(results).toEqual([{ desada: true, desti: 'servidor', motiu: null, versio: 3 }, { desada: true, desti: 'servidor', motiu: null, versio: 3 }]);
  expect(state.editorial.mock.calls.map(([input]) => input.canvis)).toEqual([{ title: 'Backend A' }, { title: 'Backend B' }]);
  expect(revisioEditorial('mur', 'post').content).toBe('<p>Unowned local draft</p>');
  expect(revisaElement('mur', { id: 'post', _editorialVersio: 3 }).content).toBe('<p>Unowned local draft</p>');
});

test('R32.10 · already cancelled save keeps its browser draft and reports avortada consistently', async () => {
  const control = new AbortController(); control.abort();
  await expect(desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'Kept' }, { config, signal: control.signal, esSuperadmin: true })).resolves.toMatchObject({ desada: true, desti: 'navegador', motiu: 'avortada' });
  expect(state.editorial).not.toHaveBeenCalled();
  expect(revisioEditorial('mur', 'post').title).toBe('Kept');
});

test('R32.10 · an equal draft in another backend cannot inherit the first acknowledgement after its own rejection', async () => {
  let finishA, failB;
  state.editorial.mockImplementation((_input, options) => new Promise((resolve, reject) => {
    if (options.backendUrl === config.backendUrl) finishA = resolve;
    else failB = reject;
  }));
  const element = { id: 'post', _editorialVersio: 2 };
  const first = desaRevisioEditorialAmbServidor('mur', element, { title: 'Same draft' }, { config, esSuperadmin: true });
  const second = desaRevisioEditorialAmbServidor('mur', element, { title: 'Same draft' }, { config: { ...config, backendUrl: 'https://other.example' }, esSuperadmin: true });
  await vi.waitFor(() => expect(state.editorial).toHaveBeenCalledTimes(2));
  finishA({ versio: 3 });
  failB(Object.assign(new Error('Conflict in B'), { code: 'conflicte-versio' }));
  expect((await Promise.all([first, second])).map(result => result.motiu)).toEqual([null, 'conflicte-versio']);
  expect(revisaElement('mur', { id: 'post', title: 'Canonical B', _editorialVersio: 10 }).title).toBe('Same draft');
});

test('R32.10 · an equal seed draft in another backend keeps its own acknowledgement boundary', async () => {
  let finishA, failB, requestA;
  state.seed.mockImplementation((input, options) => new Promise((resolve, reject) => {
    if (options.backendUrl === config.backendUrl) { requestA = input; finishA = resolve; }
    else failB = reject;
  }));
  const element = { id: 'post', _seedFontVersio: 1 };
  const first = desaRevisioEditorialAmbServidor('mur', element, { title: 'Same seed draft' }, { config });
  const second = desaRevisioEditorialAmbServidor('mur', element, { title: 'Same seed draft' }, { config: { ...config, backendUrl: 'https://other.example' } });
  await vi.waitFor(() => expect(state.seed).toHaveBeenCalledTimes(2));
  finishA({ ...requestA, versio: 1 });
  failB(Object.assign(new Error('Seed conflict in B'), { code: 'conflicte-versio' }));
  expect((await Promise.all([first, second])).map(result => result.motiu)).toEqual([null, 'conflicte-versio']);
  expect(revisaElement('mur', { id: 'post', title: 'Canonical B', _seedFontVersio: 1, _seedRevisioVersio: 10 }).title).toBe('Same seed draft');
});

test('new field edit must not republish an already acknowledged field after a fresh remote revision', async () => {
  state.editorial.mockImplementation(async input => ({ versio: input.versio + 1 }));
  await desaRevisioEditorialAmbServidor('mur', { id: 'post', _editorialVersio: 2 }, { title: 'A published at v3' }, { config, esSuperadmin: true });
  const remote = { id: 'post', title: 'B by another editor at v4', _editorialVersio: 4 };
  expect(revisaElement('mur', remote)).toBe(remote);
  await desaRevisioEditorialAmbServidor('mur', remote, { lead: 'Only this lead edited now' }, { config, esSuperadmin: true });
  expect(state.editorial.mock.calls[1][0].canvis).toEqual({ entradilla: 'Only this lead edited now' });
  expect(revisaElement('mur', { ...remote, _editorialVersio: 5 }).title).toBe('B by another editor at v4');
});
test('explicit selected migration abort prevents a late ACK from hiding its retained local draft', async () => {
  desaRevisioEditorial('mur', 'post', { title: 'Reviewed selected draft' });
  let finish;
  const control = new AbortController();
  state.seed.mockImplementation(input => new Promise(resolve => { finish = () => resolve({ ...input, versio: input.versio + 1 }); }));
  const pending = migraRevisionsEditorialsAlServidor([{ seccio:'mur', id:'post', camps:{title:'Reviewed selected draft'}, versio:0, fontVersio:1 }], { config, signal: control.signal });
  await vi.waitFor(() => expect(state.seed).toHaveBeenCalledTimes(1));
  control.abort(); finish();
  const result = await pending;
  expect(result[0]).toMatchObject({ desti: 'navegador', motiu: 'avortada' });
  expect(revisaElement('mur', {id:'post',title:'Remote original',_seedFontVersio:1,_seedRevisioVersio:1}).title).toBe('Reviewed selected draft');
});
test('a row ACK must correspond to the version just submitted', async () => {
 state.editorial.mockResolvedValueOnce({ versio: 2 });
 const result = await desaRevisioEditorialAmbServidor('mur', {id:'post',_editorialVersio:2}, {title:'Still pending'}, {config,esSuperadmin:true});
 expect(result).toMatchObject({desti:'navegador',motiu:'resposta-invalida'});
 expect(revisaElement('mur',{id:'post',title:'Old server',_editorialVersio:2}).title).toBe('Still pending');
});

test('an older ACK retires only the captured value and keeps a later pending field', async () => {
  let finish;
  state.editorial.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce({ versio: 4 });
  const element = { id: 'post', _editorialVersio: 2 };
  const first = desaRevisioEditorialAmbServidor('mur', element, { title: 'First captured' }, { config, esSuperadmin: true });
  await vi.waitFor(() => expect(state.editorial).toHaveBeenCalledTimes(1));
  const queued = desaRevisioEditorialAmbServidor('mur', element, { title: 'Later title', lead: 'Later lead' }, { config, esSuperadmin: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  finish({ versio: 3 });
  await Promise.all([first, queued]);
  expect(state.editorial.mock.calls[1][0]).toEqual({ seccio:'mur', id:'post', versio:3, canvis:{title:'Later title',entradilla:'Later lead'} });
  expect(revisioEditorial('mur','post')).toEqual({title:'Later title',lead:'Later lead'});
  expect(revisaElement('mur',{id:'post',title:'Canonical title',entradilla:'Canonical lead',_editorialVersio:4}).title).toBe('Canonical title');
});

test('a rejected pending field survives retirement of an earlier acknowledged value', async () => {
  state.editorial.mockResolvedValueOnce({ versio: 3 })
    .mockRejectedValueOnce(Object.assign(new Error('Conflict'), { code: 'conflicte-versio' }))
    .mockResolvedValueOnce({ versio: 5 });
  await desaRevisioEditorialAmbServidor('mur', { id:'post', _editorialVersio:2 }, { title:'Accepted old title' }, { config, esSuperadmin:true });
  await expect(desaRevisioEditorialAmbServidor('mur', { id:'post', _editorialVersio:3 }, { lead:'Still pending lead' }, { config, esSuperadmin:true })).resolves.toMatchObject({ desti:'navegador', motiu:'conflicte-versio' });
  expect(revisioEditorial('mur','post')).toEqual({title:'Accepted old title',lead:'Still pending lead'});
  await desaRevisioEditorialAmbServidor('mur', { id:'post', _editorialVersio:4 }, { title:'Latest explicit title' }, { config, esSuperadmin:true });
  expect(state.editorial.mock.calls[2][0]).toEqual({ seccio:'mur', id:'post', versio:4, canvis:{title:'Latest explicit title',entradilla:'Still pending lead'} });
});
