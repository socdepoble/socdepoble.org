import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ user: 'A', generation: 1, load: vi.fn(), append: vi.fn(), pagina: vi.fn(), capacitat: true, identitat: null }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
/* Decisió 4 del Mestre (261007) · el port porta també la paginació de les
   seccions (loadSeccioPage) i la pregunta de la capacitat. */
vi.mock('../../data/backendPort.js', () => ({
  loadMur: (...args) => m.load(...args), appendSectionSubmissionNetworkOnly: (...args) => m.append(...args),
  loadSeccioPage: (...args) => m.pagina(...args), teCapacitat: (cap) => cap === 'paginacioSeccions' && m.capacitat
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: m.user }, generacio: m.generation }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat || ({ actorId: m.user, actorKey: m.user }) }));
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
import { MurProvider, useMur } from './MurContext';
const config = { tenantId: '00000000-0000-0000-0000-000000000000' };
const wrapper = ({ children }) => <MurProvider config={config}>{children}</MurProvider>;
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); m.user = 'A'; m.generation = 1; m.identitat = null; m.capacitat = true; m.pagina.mockReset(); m.load.mockResolvedValue({ feedPosts: [] }); m.append.mockResolvedValue({ id: 'new' }); });
test('publicar invalida Mur i la càrrega següent inclou la publicació', async () => {
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  m.load.mockResolvedValue({ feedPosts: [{ id: 'new' }] });
  await act(async () => result.current.sendSectionSubmission({ sectionId: 'mur' }));
  await waitFor(() => expect(result.current.feedPosts[0]?.id).toBe('new'));
  expect(m.load).toHaveBeenCalledTimes(2);
});
test('callback antic i escriptura tardana no refresquen la sessió següent', async () => {
  let resolve;
  m.append.mockImplementation(() => new Promise(done => { resolve = done; }));
  const { result, rerender } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const oldSend = result.current.sendSectionSubmission;
  const pending = oldSend({ sectionId: 'mur' });
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  m.user = 'B'; m.generation++; rerender();
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await act(async () => resolve({ id: 'old' })); await rejected;
  await expect(oldSend({})).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.append).toHaveBeenCalledTimes(1); expect(m.load).toHaveBeenCalledTimes(2);
});

/* ── Auditoria 261007 (B) · publicar no depén de la lectura del Mur ── */

test('publica mentre el Mur encara carrega (loadMur pendent)', async () => {
  m.load.mockReturnValue(new Promise(() => {}));
  const { result } = renderHook(useMur, { wrapper });
  expect(result.current.status).toBe('loading');
  let desat;
  await act(async () => { desat = await result.current.sendSectionSubmission({ sectionId: 'mur', title: 'Hola' }); });
  expect(desat).toEqual({ id: 'new' });
  expect(m.append).toHaveBeenCalledTimes(1);
  expect(m.append).toHaveBeenCalledWith({ sectionId: 'mur', title: 'Hola', actor: { tipus: 'persona', id: 'A' } }, config);
});

test('publica encara que la lectura del Mur haja fallat, i torna a carregar', async () => {
  m.load.mockRejectedValueOnce(new Error('403'));
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('error'));
  let desat;
  await act(async () => { desat = await result.current.sendSectionSubmission({ sectionId: 'mur' }); });
  expect(desat).toEqual({ id: 'new' });
  expect(m.append).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(m.load).toHaveBeenCalledTimes(2);
});

test('el mètode de publicar és el mateix en carregar i quan el Mur ja és llest', async () => {
  let acaba;
  m.load.mockReturnValue(new Promise(done => { acaba = done; }));
  const { result } = renderHook(useMur, { wrapper });
  const enCarrega = result.current.sendSectionSubmission;
  await act(async () => acaba({ feedPosts: [] }));
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(result.current.sendSectionSubmission).toBe(enCarrega);
});

test('sense proveïdor, useMur continua sense cap Mur on publicar', async () => {
  const { result } = renderHook(useMur);
  await expect(result.current.sendSectionSubmission({})).rejects.toThrow('El Mur no està llest');
});

/* ── I2 · qui signa: la identitat activa viatja al port com a `actor` ── */

async function envia(sub) {
  const { result } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  let desat;
  await act(async () => { desat = await result.current.sendSectionSubmission(sub); });
  return desat;
}

test('I2 · amb una entitat activa, la publicació porta l’actor entitat', async () => {
  m.identitat = { actorId: 'ORG', actorKey: 'entitat::ORG', actor: { tipus: 'entitat', id: 'ORG', nom: 'Forn' } };
  const sub = { sectionId: 'mur', title: 'Pa calent' };
  expect(await envia(sub)).toEqual({ id: 'new' });
  expect(m.append).toHaveBeenCalledWith({ ...sub, actor: { tipus: 'entitat', id: 'ORG' } }, config);
  expect(sub).not.toHaveProperty('actor');
});

test('I2 · com a persona, l’actor és la persona', async () => {
  m.identitat = { actorId: 'U', actorKey: 'persona::U', actor: { tipus: 'persona', id: 'U', nom: 'Pep' } };
  await envia({ title: 'Hola' });
  expect(m.append).toHaveBeenCalledWith({ title: 'Hola', actor: { tipus: 'persona', id: 'U' } }, config);
});

test('I2 · sense `actor` (només actorId, com als mocs parcials) cau a la persona', async () => {
  await envia({ title: 'Hola' });
  expect(m.append).toHaveBeenCalledWith({ title: 'Hola', actor: { tipus: 'persona', id: 'A' } }, config);
});

test('I2 · l’actor de la identitat mana sobre un actor que porte la publicació', async () => {
  m.identitat = { actorId: 'U', actorKey: 'persona::U', actor: { tipus: 'persona', id: 'U' } };
  await envia({ title: 'Hola', actor: { tipus: 'entitat', id: 'ALTRA' } });
  expect(m.append.mock.calls[0][0].actor).toEqual({ tipus: 'persona', id: 'U' });
});

/* ── Decisió 2 del Mestre (261007) · Renovació silenciosa ──
   La renovació del JWT puja la generació amb la mateixa persona i el mateix
   actor: el Mur (i el Mercat i el Calendari, que en beuen) no torna a
   «Carregant», i una publicació en vol no s'avorta. Un canvi real de persona
   continua avortant-la («callback antic i escriptura tardana…», ací dalt). */

test('Decisió 2 · una renovació (mateixa persona, generació nova) no torna el Mur a loading', async () => {
  m.load.mockResolvedValueOnce({ feedPosts: [{ id: 'p1' }] });
  const estats = [];
  const { result, rerender } = renderHook(() => {
    const mur = useMur();
    estats.push(mur.status);
    return mur;
  }, { wrapper });
  await waitFor(() => expect(result.current.feedPosts).toHaveLength(1));
  const desDeLlest = estats.length;
  let acaba;
  m.load.mockImplementationOnce(() => new Promise(done => { acaba = done; }));
  m.generation++; rerender();
  expect(result.current.status).toBe('ready');
  expect(result.current.feedPosts.map(post => post.id)).toEqual(['p1']);
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  expect(result.current.feedPosts.map(post => post.id)).toEqual(['p1']);
  await act(async () => acaba({ feedPosts: [{ id: 'p1' }, { id: 'p2' }] }));
  expect(result.current.feedPosts.map(post => post.id)).toEqual(['p1', 'p2']);
  expect(estats.slice(desDeLlest)).toEqual(expect.not.arrayContaining(['loading']));
});

test('Decisió 2 · una renovació no avorta una publicació en vol ni canvia el mètode de publicar', async () => {
  let resol;
  m.append.mockImplementation(() => new Promise(done => { resol = done; }));
  const { result, rerender } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const publica = result.current.sendSectionSubmission;
  const pendent = publica({ sectionId: 'mur' });
  m.generation++; rerender();
  expect(result.current.sendSectionSubmission).toBe(publica);
  // La revalidació de la renovació ja ha eixit quan el servidor respon.
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  await act(async () => resol({ id: 'nova' }));
  await expect(pendent).resolves.toEqual({ id: 'nova' });
  // La càrrega inicial, la revalidació de la renovació i el refresh de publicar.
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(3));
  expect(result.current.status).toBe('ready');
});

/* Decisió 2 · Pendents del relleu aplicats amb la peça de paginació: el valor
   es memoritza sobre camps i exposa errorRevalidacio. */

test('Decisió 2 · mentre es revalida, el valor és el mateix objecte: cap consumidor es torna a pintar en va', async () => {
  m.load.mockResolvedValueOnce({ feedPosts: [{ id: 'p1' }] });
  const { result, rerender } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.feedPosts).toHaveLength(1));
  const abans = result.current;
  m.load.mockImplementationOnce(() => new Promise(() => {}));
  m.generation++; rerender();
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  expect(result.current).toBe(abans);
});

test('Decisió 2 · una revalidació fallida conserva el Mur i exposa errorRevalidacio, sense tocar status ni error', async () => {
  m.load.mockResolvedValueOnce({ feedPosts: [{ id: 'p1' }] });
  const { result, rerender } = renderHook(useMur, { wrapper });
  await waitFor(() => expect(result.current.feedPosts).toHaveLength(1));
  expect(result.current.errorRevalidacio).toBeNull();
  const caiguda = new Error('Load failed');
  m.load.mockRejectedValueOnce(caiguda);
  m.generation++; rerender();
  await waitFor(() => expect(result.current.errorRevalidacio).toBe(caiguda));
  expect(result.current).toMatchObject({ status: 'ready', error: null });
  expect(result.current.feedPosts.map((post) => post.id)).toEqual(['p1']);
});

/* ── Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
   PROGRESSIVA (LOAD MORE).» carregaMes, hiHaMes, carregantMes i errorMes. ── */

const primera = (ids, paginacio) => ({ feedPosts: ids.map((id) => ({ id })), events: [], marketItems: [], ...(paginacio ? { paginacio } : {}) });
const ids = (llista) => llista.map((element) => element.id);
async function murLlest(valor) {
  m.load.mockResolvedValueOnce(valor);
  const pintat = renderHook(useMur, { wrapper });
  await waitFor(() => expect(pintat.result.current.status).toBe('ready'));
  return pintat;
}

test('Decisió 4 · carregaMes afegix la pàgina següent sense duplicats i hiHaMes segueix el cursor fins al final', async () => {
  const { result } = await murLlest(primera(['p1', 'p2'], { mur: 'c1' }));
  expect([result.current.hiHaMes('mur'), result.current.hiHaMes('events'), result.current.hiHaMes('mercat')]).toEqual([true, false, false]);
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }, { id: 'p3' }], complete: false, nextCursor: 'c2' });
  let afegida;
  await act(async () => { afegida = await result.current.carregaMes('mur'); });
  expect(afegida).toBe(true);
  expect(m.pagina).toHaveBeenLastCalledWith({ seccio: 'mur', cursor: 'c1', signal: expect.any(AbortSignal) }, config);
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2', 'p3']);
  expect(ids(result.current.sortedFeedPosts).sort()).toEqual(['p1', 'p2', 'p3']);
  expect(result.current.hiHaMes('mur')).toBe(true);
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p4' }], complete: true, nextCursor: null });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(m.pagina).toHaveBeenLastCalledWith({ seccio: 'mur', cursor: 'c2', signal: expect.any(AbortSignal) }, config);
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2', 'p3', 'p4']);
  expect(result.current.hiHaMes('mur')).toBe(false);
  // Sense cursor, carregaMes no torna a demanar res.
  await act(async () => { expect(await result.current.carregaMes('mur')).toBe(false); });
  expect(m.pagina).toHaveBeenCalledTimes(2);
});

test('Decisió 4 · el Mercat i el Calendari es paginen per separat (marketItems, events)', async () => {
  const { result } = await murLlest({ feedPosts: [], events: [{ id: 'e1' }], marketItems: [{ id: 'm1' }], paginacio: { mercat: 'cm', events: 'ce' } });
  m.pagina.mockImplementation(async ({ seccio }) => ({ elements: [{ id: `${seccio}-2` }], complete: true, nextCursor: null }));
  await act(async () => { await result.current.carregaMes('mercat'); });
  expect(ids(result.current.marketItems)).toEqual(['m1', 'mercat-2']);
  expect(ids(result.current.events)).toEqual(['e1']);
  expect([result.current.hiHaMes('mercat'), result.current.hiHaMes('events')]).toEqual([false, true]);
});

test('Decisió 4 · mentre carrega, carregantMes és cert, el botó continua i una segona crida no repetix la petició', async () => {
  const { result } = await murLlest(primera(['p1'], { mur: 'c1' }));
  let acaba;
  m.pagina.mockImplementationOnce(() => new Promise((done) => { acaba = done; }));
  let primeraCrida;
  act(() => { primeraCrida = result.current.carregaMes('mur'); });
  expect(result.current.carregantMes('mur')).toBe(true);
  expect(result.current.hiHaMes('mur')).toBe(true);
  await act(async () => { expect(await result.current.carregaMes('mur')).toBe(false); });
  expect(m.pagina).toHaveBeenCalledTimes(1);
  await act(async () => { acaba({ elements: [{ id: 'p2' }], complete: true, nextCursor: null }); await primeraCrida; });
  expect(result.current.carregantMes('mur')).toBe(false);
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
});

test('Decisió 4 · sense la capacitat, hiHaMes és fals encara que loadMur porte un cursor, i carregaMes no crida el port', async () => {
  m.capacitat = false;
  const { result } = await murLlest(primera(['p1'], { mur: 'c1' }));
  expect(result.current.hiHaMes('mur')).toBe(false);
  await act(async () => { expect(await result.current.carregaMes('mur')).toBe(false); });
  expect(m.pagina).not.toHaveBeenCalled();
  expect(ids(result.current.feedPosts)).toEqual(['p1']);
});

test('Decisió 4 · una secció que no es pagina no fa res', async () => {
  const { result } = await murLlest(primera(['p1'], { mur: 'c1' }));
  for (const seccio of ['notes', 'multimedia', 'toString']) {
    expect(result.current.hiHaMes(seccio)).toBe(false);
    await act(async () => { expect(await result.current.carregaMes(seccio)).toBe(false); });
  }
  expect(m.pagina).not.toHaveBeenCalled();
});

test('Decisió 4 · un error es queda a errorMes, el Mur no es buida i el reintent torna al mateix cursor', async () => {
  const { result } = await murLlest(primera(['p1'], { mur: 'c1' }));
  const caiguda = Object.assign(new Error('Supabase 503'), { status: 503 });
  m.pagina.mockRejectedValueOnce(caiguda);
  await act(async () => { expect(await result.current.carregaMes('mur')).toBe(false); });
  expect(result.current.errorMes('mur')).toBe(caiguda);
  expect(result.current).toMatchObject({ status: 'ready', error: null });
  expect(ids(result.current.feedPosts)).toEqual(['p1']);
  expect(result.current.hiHaMes('mur')).toBe(true);
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }], complete: true, nextCursor: null });
  await act(async () => { expect(await result.current.carregaMes('mur')).toBe(true); });
  expect(m.pagina.mock.calls.map(([opcions]) => opcions.cursor)).toEqual(['c1', 'c1']);
  expect(result.current.errorMes('mur')).toBeNull();
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
});

test('Decisió 4 · AÏLLAMENT: un canvi de persona buida les pàgines extres i els cursors en el mateix pintat', async () => {
  const { result, rerender } = await murLlest(primera(['p1'], { mur: 'c1' }));
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }], complete: false, nextCursor: 'c2' });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
  let acaba;
  m.load.mockImplementationOnce(() => new Promise((done) => { acaba = done; }));
  m.user = 'B'; rerender();
  expect(result.current.status).toBe('loading');
  expect(result.current.feedPosts).toEqual([]);
  expect(result.current.hiHaMes('mur')).toBe(false);
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  await act(async () => acaba(primera(['q1'])));
  expect(ids(result.current.feedPosts)).toEqual(['q1']);
  expect(result.current.hiHaMes('mur')).toBe(false);
});

/* Relleu 261008 (revisió adversarial) · Les extres de l'àmbit vell es buiden
   en l'efecte de l'àmbit, sense esperar cap «Mostra més» nou: tornar a la
   persona d'abans (amb un altre objecte de configuració, com en una
   reconnexió) no les recupera, i la primera pàgina torna a manar sola. */
test('Decisió 4 · AÏLLAMENT: tornar a l’àmbit d’abans no recupera les extres de l’àmbit vell', async () => {
  let configActual = config;
  const embolcall = ({ children }) => <MurProvider config={configActual}>{children}</MurProvider>;
  m.load.mockResolvedValueOnce(primera(['p1'], { mur: 'c1' }));
  const { result, rerender } = renderHook(useMur, { wrapper: embolcall });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }], complete: false, nextCursor: 'c2' });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
  m.load.mockResolvedValueOnce(primera(['q1']));
  m.user = 'B'; rerender();
  await waitFor(() => expect(ids(result.current.feedPosts)).toEqual(['q1']));
  m.load.mockResolvedValueOnce(primera(['p1'], { mur: 'c1' }));
  m.user = 'A'; configActual = { ...config };
  rerender();
  await waitFor(() => expect(ids(result.current.feedPosts)).toEqual(['p1']));
  expect(result.current.hiHaMes('mur')).toBe(true);
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }], complete: true, nextCursor: null });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(m.pagina).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c1' }), configActual);
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
});

test('Decisió 4 · AÏLLAMENT: una pàgina que arriba després d’un canvi d’àmbit es descarta i la petició s’avorta', async () => {
  const { result, rerender } = await murLlest(primera(['p1'], { mur: 'c1' }));
  let acaba;
  let senyal;
  m.pagina.mockImplementationOnce(({ signal }) => { senyal = signal; return new Promise((done) => { acaba = done; }); });
  let tardana;
  act(() => { tardana = result.current.carregaMes('mur'); });
  m.load.mockResolvedValueOnce(primera(['q1'], { mur: 'cq' }));
  m.user = 'B'; rerender();
  expect(senyal.aborted).toBe(true);
  await waitFor(() => expect(ids(result.current.feedPosts)).toEqual(['q1']));
  await act(async () => { acaba({ elements: [{ id: 'p2-de-A' }], complete: true, nextCursor: null }); });
  expect(await tardana).toBe(false);
  expect(ids(result.current.feedPosts)).toEqual(['q1']);
  expect(result.current.carregantMes('mur')).toBe(false);
  expect(result.current.hiHaMes('mur')).toBe(true);
});

/* Decisió 2 · L'AÏLLAMENT és backend, persona i actor: el canvi de persona
   ja el fixa la prova d'ací dalt; estos dos casos fixen els altres dos. */
test.each([
  ['un canvi d’actor (de la persona a una entitat)', (actual) => {
    m.identitat = { actorId: 'ORG', actorKey: 'entitat::ORG', actor: { tipus: 'entitat', id: 'ORG' } };
    return actual;
  }],
  ['un canvi de backend (un altre poble)', (actual) => ({ ...actual, tenantId: '11111111-1111-4111-8111-111111111111' })]
])('Decisió 4 · AÏLLAMENT: %s també buida les pàgines extres i els cursors en el mateix pintat', async (_, canvia) => {
  let configActual = config;
  const embolcall = ({ children }) => <MurProvider config={configActual}>{children}</MurProvider>;
  m.load.mockResolvedValueOnce(primera(['p1'], { mur: 'c1' }));
  const { result, rerender } = renderHook(useMur, { wrapper: embolcall });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }], complete: false, nextCursor: 'c2' });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
  m.load.mockReturnValueOnce(new Promise(() => {}));
  configActual = canvia(configActual);
  rerender();
  expect(result.current.status).toBe('loading');
  expect(result.current.feedPosts).toEqual([]);
  expect(result.current.hiHaMes('mur')).toBe(false);
  await act(async () => { expect(await result.current.carregaMes('mur')).toBe(false); });
  expect(m.pagina).toHaveBeenCalledTimes(1);
});

test('Decisió 4 · FRESCOR: una renovació conserva les extres i, amb la mateixa cua, continua des de la pàgina més fonda', async () => {
  const { result, rerender } = await murLlest(primera(['p1'], { mur: 'c1' }));
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }], complete: false, nextCursor: 'c2' });
  await act(async () => { await result.current.carregaMes('mur'); });
  const estats = [];
  m.load.mockResolvedValueOnce(primera(['p1'], { mur: 'c1' }));
  m.generation++; rerender();
  estats.push(result.current.status);
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  await act(async () => {});
  estats.push(result.current.status);
  expect(estats).toEqual(['ready', 'ready']);
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p3' }], complete: true, nextCursor: null });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(m.pagina).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c2' }), config);
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2', 'p3']);
});

/* Relleu 261008 (revisió adversarial) · Decisions 2 i 4 · Esta prova fixava
   un forat: p2, empesa fora de la primera pàgina per la publicació nova, no
   era a la primera ni a les extres i desapareixia del mig de la llista fins
   al clic següent. Una revalidació no ha de llevar res del que ja es veia:
   ara p2 es queda (extresVigents) i el cursor continua tornant a la cua nova. */
test('Decisió 4 · FRESCOR: si la cua ha canviat (una publicació nova), conserva les extres i les empeses avall, torna a partir de la cua nova i no duplica', async () => {
  const { result, rerender } = await murLlest(primera(['p1', 'p2'], { mur: 'c1' }));
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p3' }], complete: false, nextCursor: 'c2' });
  await act(async () => { await result.current.carregaMes('mur'); });
  // Publicar refresca: p0 entra dalt i empeny p2 fora de la primera pàgina.
  m.load.mockResolvedValueOnce(primera(['p0', 'p1'], { mur: 'c1-nou' }));
  await act(async () => { await result.current.sendSectionSubmission({ sectionId: 'mur' }); });
  await waitFor(() => expect(ids(result.current.feedPosts)).toEqual(['p0', 'p1', 'p2', 'p3']));
  expect(result.current.hiHaMes('mur')).toBe(true);
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p2' }, { id: 'p3' }], complete: false, nextCursor: 'c2-nou' });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(m.pagina).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c1-nou' }), config);
  expect(ids(result.current.feedPosts)).toEqual(['p0', 'p1', 'p2', 'p3']);
  expect(result.current.hiHaMes('mur')).toBe(true);
  // Una altra renovació amb la mateixa cua: p2 ja és de les extres desades i continua des de c2-nou.
  const carregues = m.load.mock.calls.length;
  m.load.mockResolvedValueOnce(primera(['p0', 'p1'], { mur: 'c1-nou' }));
  m.generation++; rerender();
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(carregues + 1));
  await act(async () => {});
  expect(ids(result.current.feedPosts)).toEqual(['p0', 'p1', 'p2', 'p3']);
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'p4' }], complete: true, nextCursor: null });
  await act(async () => { await result.current.carregaMes('mur'); });
  expect(m.pagina).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c2-nou' }), config);
  expect(ids(result.current.feedPosts)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4']);
});

/* Relleu 261008 (revisió adversarial) · Un error de «Mostra més» és del
   cursor que ha fallat: una revalidació que deixa la secció completa, o que
   en mou la cua, no deixa l'avís per sempre amb un reintent que no fa res. */
test.each([
  ['deixa la secció completa (el Mercat baixa a 50)', undefined, false],
  ['mou la cua de la primera pàgina', { mercat: 'cm-nou' }, true]
])('Decisió 4 · un error de «Mostra més» se’n va quan una renovació %s', async (_, paginacio, mes) => {
  const { result, rerender } = await murLlest({ feedPosts: [], events: [], marketItems: [{ id: 'm1' }], paginacio: { mercat: 'cm' } });
  m.pagina.mockRejectedValueOnce(new Error('Supabase 503'));
  await act(async () => { await result.current.carregaMes('mercat'); });
  expect(result.current.errorMes('mercat')).toBeInstanceOf(Error);
  m.load.mockResolvedValueOnce({ feedPosts: [], events: [], marketItems: [{ id: 'm1' }], ...(paginacio ? { paginacio } : {}) });
  m.generation++; rerender();
  await waitFor(() => expect(result.current.errorMes('mercat')).toBeNull());
  expect(result.current).toMatchObject({ status: 'ready', error: null });
  expect(result.current.hiHaMes('mercat')).toBe(mes);
  expect(ids(result.current.marketItems)).toEqual(['m1']);
  if (!mes) return;
  m.pagina.mockResolvedValueOnce({ elements: [{ id: 'm2' }], complete: true, nextCursor: null });
  await act(async () => { expect(await result.current.carregaMes('mercat')).toBe(true); });
  expect(m.pagina).toHaveBeenLastCalledWith(expect.objectContaining({ seccio: 'mercat', cursor: 'cm-nou' }), config);
});

test('Decisió 4 · FRESCOR: una pàgina demanada abans d’una renovació s’afig igual (mateix àmbit)', async () => {
  const { result, rerender } = await murLlest(primera(['p1'], { mur: 'c1' }));
  let acaba;
  m.pagina.mockImplementationOnce(() => new Promise((done) => { acaba = done; }));
  let crida;
  act(() => { crida = result.current.carregaMes('mur'); });
  m.load.mockResolvedValueOnce(primera(['p1'], { mur: 'c1' }));
  m.generation++; rerender();
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  await act(async () => { acaba({ elements: [{ id: 'p2' }], complete: true, nextCursor: null }); });
  expect(await crida).toBe(true);
  expect(ids(result.current.feedPosts)).toEqual(['p1', 'p2']);
  expect(result.current.hiHaMes('mur')).toBe(false);
});

test('Decisió 4 · sense proveïdor, useMur no ofereix cap pàgina més', async () => {
  const { result } = renderHook(useMur);
  expect(result.current.hiHaMes('mur')).toBe(false);
  expect(result.current.carregantMes('mur')).toBe(false);
  expect(result.current.errorMes('mur')).toBeNull();
  expect(await result.current.carregaMes('mur')).toBe(false);
});
