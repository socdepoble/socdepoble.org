import { useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';
const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', DIRECT = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', JO = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', OTHER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const mock = vi.hoisted(() => ({ session: {}, entrada: 1, source: null,
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), publicaAdjuntXat: vi.fn(),
  marcaLlegit: vi.fn(), creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(), obriFilDePagina: vi.fn(), teCapacitat: vi.fn(),
  carregaAccionsMissatges: vi.fn(), alternaReaccio: vi.fn(), alternaDestacat: vi.fn(), alternaFixat: vi.fn(), eliminaPerAMi: vi.fn(), urlAdjuntXat: vi.fn(), forwardText: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: 'persona', actor: null }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, f) => f }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../data/identitat.js', async original => ({ ...(await original()),
  capturaSessio: () => { const entrada = mock.entrada; return () => { if (entrada !== mock.entrada) throw new DOMException('changed', 'AbortError'); }; }
}));
vi.mock('../../data/xat/serveiXat.js', async original => ({ ...(await original()), serveiXat: { enviaMissatge: mock.forwardText } }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
const estat = extra => ({ missatgeId: ID, filId: FIL, reaccions: [], destacat: false, fixat: false, amagat: false, ...extra });
let value;
function Sonda() { const x = useXat(); useLayoutEffect(() => { value = x; }); return null; }
const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid' };
const arbre = () => <XatProvider config={CONFIG}><Sonda /></XatProvider>;
async function munta() {
  const vista = render(arbre()); await waitFor(() => expect(value.status).toBe('ready'));
  act(() => value.obriFil(FIL)); await waitFor(() => expect(value.getThreadMessages(FIL)).toHaveLength(1)); return vista;
}
beforeEach(() => {
  vi.resetAllMocks(); mock.session = { currentUser: { id: JO }, generacio: 1 }; mock.entrada = 1;
  mock.source = { id: ID, filId: FIL, usuariId: OTHER, autorNom: 'Anna', text: 'Cita autoritzada', tipus: 'text', seq: 1 };
  mock.loadFils.mockResolvedValue([{ id: FIL, tipus: 'grup', titol: 'Grup', ultimSeq: 1, altres: [] }, { id: DIRECT, tipus: 'directe', titol: 'Directe', ultimSeq: 0, altres: [] }]);
  mock.loadMissatges.mockImplementation(async id => id === FIL ? [mock.source] : []);
  mock.teCapacitat.mockImplementation(nom => ['xatMultimedia', 'xatAccionsMissatge'].includes(nom));
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.creaFilDirecte.mockResolvedValue(DIRECT);
  mock.carregaAccionsMissatges.mockResolvedValue({ missatges: [estat()], teMes: false, seguentId: null });
  mock.alternaDestacat.mockResolvedValue(estat({ destacat: true })); mock.eliminaPerAMi.mockResolvedValue(estat({ amagat: true }));
  mock.forwardText.mockImplementation(async (filId, entrada) => ({ ...entrada, filId, usuariId: JO, tipus: 'text', seq: 2 }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('els sis callbacks són públics i el batch hidrata sense revelar metadades noves al missatge brut', async () => {
  await munta();
  for (const nom of ['alternaReaccio', 'alternaDestacat', 'alternaFixat', 'eliminaPerAMi', 'responEnPrivat', 'reenviaAConverses']) expect(value[nom]).toEqual(expect.any(Function));
  await waitFor(() => expect(mock.carregaAccionsMissatges).toHaveBeenCalled());
  await act(async () => { await value.alternaDestacat({ id: ID, threadId: FIL }, true); });
  expect(value.getThreadMessages(FIL)[0]).toMatchObject({ id: ID, seq: 1, destacat: true });
  expect(mock.source).not.toHaveProperty('destacat');
});
test('elimina per a mi sobreviu a una recàrrega autoritària; no elimina ni renumera el port', async () => {
  await munta(); await act(async () => { await value.eliminaPerAMi(ID); });
  expect(value.getThreadMessages(FIL)).toEqual([]);
  await act(async () => { value.recarregaFil(FIL); });
  await waitFor(() => expect(mock.loadMissatges.mock.calls.length).toBeGreaterThan(1));
  expect(value.getThreadMessages(FIL)).toEqual([]); expect(mock.source.seq).toBe(1); expect(mock.source.text).toBe('Cita autoritzada');
});
test('403 fa rollback i exposa errorAccions; SQL absent queda explícitament local', async () => {
  await munta(); const denied = Object.assign(new Error('No permés'), { status: 403 }); mock.alternaDestacat.mockRejectedValueOnce(denied);
  await act(async () => { await expect(value.alternaDestacat(ID, true)).rejects.toBe(denied); });
  expect(value.getThreadMessages(FIL)[0].destacat).toBe(false); expect(value.errorAccions).toBe(denied);
  mock.alternaDestacat.mockRejectedValueOnce(Object.assign(new Error('SQL absent'), { code: 'XAT_ACCIONS_SQL_ABSENT' }));
  await act(async () => { expect(await value.alternaDestacat(ID, true)).toMatchObject({ estat: 'local' }); });
  expect(value.getThreadMessages(FIL)[0]).toMatchObject({ destacat: true, estatAccions: 'local' });
});
test('respondre en privat crea directe i cita textual sense missatge automàtic', async () => {
  await munta();
  await act(async () => { expect(await value.responEnPrivat(ID)).toMatchObject({ filId: DIRECT, respostaA: null, cita: { text: 'Cita autoritzada' } }); });
  expect(mock.creaFilDirecte).toHaveBeenCalledWith(OTHER, null, expect.any(Object));
  expect(value.filActiu).toBe(DIRECT); expect(value.esborranyPrivat.respostaA).toBeNull();
  expect(mock.enviaMissatge).not.toHaveBeenCalled(); expect(mock.forwardText).not.toHaveBeenCalled();
});
test('reenviar text usa servei idempotent amb senyal i fusiona només ACK corresponent', async () => {
  await munta(); let resultat;
  await act(async () => { resultat = await value.reenviaAConverses([ID], [{ id: DIRECT }]); });
  expect(resultat.resultats[0].estat).toBe('confirmat');
  expect(mock.forwardText).toHaveBeenCalledWith(DIRECT, { id: resultat.resultats[0].id, text: 'Cita autoritzada' }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(value.getThreadMessages(DIRECT)[0]).toMatchObject({ text: 'Cita autoritzada', seq: 2 });
});
/* D-v128-2-PREVIA · El que amagues amb «Elimina per a mi» no torna a eixir a la vista prèvia de chatThreads
   (la fila, «Reenvia a…», /cerca) ni a la cerca del Xat. */
test('elimina per a mi trau el text amagat de la vista prèvia del fil i de la cerca del Xat', async () => {
  const { cercaXat } = await import('./cercaXat.js');
  const ANTERIOR = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const anterior = { id: ANTERIOR, filId: FIL, usuariId: JO, autorNom: 'Jo', text: 'Bon dia a tothom', tipus: 'text', seq: 1 };
  mock.source = { ...mock.source, seq: 2 };
  mock.loadFils.mockResolvedValue([{ id: FIL, tipus: 'grup', titol: 'Grup', ultimSeq: 2, ultimText: 'Cita autoritzada', ultimTipus: 'text', ultimAutorId: OTHER, altres: [] }]);
  mock.loadMissatges.mockImplementation(async id => id === FIL ? [anterior, mock.source] : []);
  render(arbre()); await waitFor(() => expect(value.status).toBe('ready'));
  act(() => value.obriFil(FIL)); await waitFor(() => expect(value.getThreadMessages(FIL)).toHaveLength(2));
  const fil = () => value.chatThreads.find(f => f.id === FIL);
  const troba = terme => cercaXat({ terme, fils: value.chatThreads, missatgesPerFil: value.getThreadMessages, joId: JO });
  expect(fil()).toMatchObject({ ultimText: 'Cita autoritzada', ultimAutorId: OTHER });
  expect(troba('autoritzada').converses).toHaveLength(1);
  const llistaAbans = value.chatThreads;

  await act(async () => { await value.eliminaPerAMi(ID); });
  expect(value.getThreadMessages(FIL).map(m => m.id)).toEqual([ANTERIOR]);
  expect(fil()).toMatchObject({ ultimText: 'Bon dia a tothom', ultimAutorId: JO, ultimSeq: 2 });
  expect(troba('autoritzada')).toMatchObject({ converses: [], missatges: [] });
  expect(troba('tothom').converses).toHaveLength(1);
  expect(llistaAbans.find(f => f.id === FIL).ultimText).toBe('Cita autoritzada');

  mock.eliminaPerAMi.mockResolvedValueOnce(estat({ missatgeId: ANTERIOR, amagat: true }));
  await act(async () => { await value.eliminaPerAMi(ANTERIOR); });
  expect(value.getThreadMessages(FIL)).toEqual([]);
  expect(fil()).toMatchObject({ ultimText: '', ultimTipus: null, ultimAutorId: null });
  expect(troba('tothom')).toMatchObject({ converses: [], missatges: [] });
});
test('sense cap missatge amagat, chatThreads és la mateixa llista (la vista per defecte no canvia)', async () => {
  await munta();
  const abans = value.chatThreads;
  await act(async () => { await value.alternaDestacat({ id: ID, threadId: FIL }, true); });
  expect(value.chatThreads).toBe(abans);
});
/* D-v128-2-PREVIA (revisió) · Les files de la comunitat (FitxaComunitat, VistaComunitats) lligen
   comunitats[].fills[]: també perden el text amagat, i l'ordre i els no llegits no canvien. */
test('elimina per a mi trau el text amagat de les files de la comunitat', async () => {
  const COM = '99999999-9999-4999-8999-999999999999';
  const ANTERIOR = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const anterior = { id: ANTERIOR, filId: FIL, usuariId: JO, autorNom: 'Jo', text: 'Bon dia a tothom', tipus: 'text', seq: 1 };
  mock.source = { ...mock.source, seq: 2 };
  mock.loadFils.mockResolvedValue([
    { id: COM, tipus: 'comunitat', titol: 'La Torre', ultimSeq: 0, altres: [] },
    { id: FIL, tipus: 'grup', titol: 'General', comunitatId: COM, ultimSeq: 2, ultimText: 'Cita autoritzada', ultimTipus: 'text', ultimAutorId: OTHER, ultimAl: '2026-11-19T08:00:00Z', noLlegits: 0, altres: [] }
  ]);
  mock.loadMissatges.mockImplementation(async id => id === FIL ? [anterior, mock.source] : []);
  render(arbre()); await waitFor(() => expect(value.status).toBe('ready'));
  act(() => value.obriFil(FIL)); await waitFor(() => expect(value.getThreadMessages(FIL)).toHaveLength(2));
  const comunitat = () => value.comunitats.find(c => c.fil.id === COM);
  const fill = () => comunitat().fills.find(f => f.id === FIL);
  expect(fill()).toMatchObject({ ultimText: 'Cita autoritzada' });
  const abans = { ultimAl: comunitat().ultimAl, noLlegits: comunitat().noLlegits };
  await act(async () => { await value.eliminaPerAMi(ID); });
  expect(fill()).toMatchObject({ ultimText: 'Bon dia a tothom', ultimAutorId: JO, ultimSeq: 2, seqPrevia: 1 });
  expect(fill().searchText ?? '').not.toContain('autoritzada');
  expect({ ultimAl: comunitat().ultimAl, noLlegits: comunitat().noLlegits }).toEqual(abans);
});
/* D-v128-2-PREVIA (revisió) · Les marques de la fila són les del missatge que s'ensenya. */
test('elimina per a mi: les marques de la fila són les del missatge visible, no les de l’amagat', async () => {
  const { estatDeLUltim } = await import('./missatges.js');
  const ANTERIOR = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const anterior = { id: ANTERIOR, filId: DIRECT, usuariId: JO, autorNom: 'Jo', text: 'Llegit ja', tipus: 'text', seq: 1 };
  const amagable = { id: ID, filId: DIRECT, usuariId: JO, autorNom: 'Jo', text: 'Encara no llegit', tipus: 'text', seq: 2 };
  mock.loadFils.mockResolvedValue([
    { id: DIRECT, tipus: 'directe', titol: 'Anna', ultimSeq: 2, ultimText: 'Encara no llegit', ultimTipus: 'text', ultimAutorId: JO, llegitPelsAltresFinsSeq: 1, rebutPelsAltresFinsSeq: 1, altres: [{ id: OTHER, tipus: 'persona', nom: 'Anna' }] }
  ]);
  mock.loadMissatges.mockImplementation(async id => id === DIRECT ? [anterior, amagable] : []);
  mock.eliminaPerAMi.mockResolvedValue(estat({ missatgeId: ID, filId: DIRECT, amagat: true }));
  mock.carregaAccionsMissatges.mockResolvedValue({ missatges: [], teMes: false, seguentId: null });
  render(arbre()); await waitFor(() => expect(value.status).toBe('ready'));
  act(() => value.obriFil(DIRECT)); await waitFor(() => expect(value.getThreadMessages(DIRECT)).toHaveLength(2));
  const fil = () => value.chatThreads.find(f => f.id === DIRECT);
  expect(estatDeLUltim(fil(), JO)).toBe('enviat');
  await act(async () => { await value.eliminaPerAMi(ID); });
  expect(fil()).toMatchObject({ ultimText: 'Llegit ja', ultimSeq: 2 });
  expect(value.getThreadMessages(DIRECT)[0].estatEnviament).toBe('llegit');
  expect(estatDeLUltim(fil(), JO)).toBe('llegit');
});
