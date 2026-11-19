import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { creaOpcionsMotorAccions } from '../creaOpcionsMotorAccions.js';

const mock = vi.hoisted(() => ({ entrada: 1, publica: vi.fn(), urlAdjuntXat: vi.fn(),
  carregaAccionsMissatges: vi.fn(), alternaReaccio: vi.fn(), alternaDestacat: vi.fn(),
  alternaFixat: vi.fn(), eliminaPerAMi: vi.fn() }));
const tros = vi.hoisted(() => {
  let allibera, avisa;
  return { arribat: new Promise(r => { allibera = r; }), demanat: new Promise(r => { avisa = r; }),
    allibera: () => allibera(), avisa: () => avisa() };
});
vi.mock('../../backendPort.js', () => mock);
vi.mock('../../identitat.js', () => ({ entradaSessio: () => mock.entrada,
  capturaSessio: () => { const entrada = mock.entrada; return () => {
    if (entrada !== mock.entrada) throw new DOMException('Sessió canviada.', 'AbortError');
  }; } }));
vi.mock('../serveiXat.js', async () => {
  tros.avisa(); await tros.arribat;
  return { serveiXat: { enviaMissatge: mock.publica } };
});
vi.mock('../../xatMultimedia.js', () => ({ MAXIM_ADJUNT_XAT: { imatge: 4, video: 8, veu: 4 },
  MIME_XAT: { 'image/jpeg': 'imatge' }, errorAdjuntXat: code => Object.assign(new Error(code), { code }) }));

const ID = 'missatge-1', FIL = 'fil-1', DESTI = { id: 'desti-1' };
let pont, opcions, missatges, fils;
beforeEach(() => {
  vi.clearAllMocks(); mock.entrada = 1;
  missatges = {}; fils = [{ id: DESTI.id, ultimSeq: 0 }];
  pont = { entornAccions: { current: { ambit: 'A', actiu: true, usuariId: 'jo', modeDades: 'remote',
    config: { tenantId: 'tenant-A' }, missatgesPerFil: { [FIL]: [{ id: ID, usuariId: 'vei' }] },
    esPersonaBloquejada: () => false, creaFil: vi.fn(), obriFil: vi.fn(), enviaAmbNormes: vi.fn(), sendChatMedia: vi.fn() } },
    filsRef: { current: [{ id: FIL, participant: true }] }, desmuntat: { current: false },
    moderacioRef: { current: null }, setEstatAccions: vi.fn(), esXatPrivatDeLaIAIA: () => false,
    mutaMissatges: vi.fn(fn => { missatges = fn(missatges); }), mutaFils: vi.fn(fn => { fils = fn(fils); }) };
  opcions = creaOpcionsMotorAccions(pont);
  mock.publica.mockImplementation(async (filId, entrada) => ({ ...entrada, filId, usuariId: 'jo', tipus: 'text', seq: 2 }));
  mock.urlAdjuntXat.mockResolvedValue('https://autoritzat.invalid/adjunt');
});
afterEach(() => { vi.unstubAllGlobals(); });

test('canviar sessió mentre arriba serveiXat impedeix qualsevol publicació remota', async () => {
  const resultat = opcions.enviaText(DESTI, 'Text antic', { clientMsgId: ID }).catch(e => e);
  await tros.demanat;
  mock.entrada += 1;
  tros.allibera();
  expect(await resultat).toMatchObject({ name: 'AbortError' });
  expect(mock.publica).not.toHaveBeenCalled();
  expect(pont.mutaMissatges).not.toHaveBeenCalled();
});

test('les refs noves governen context, permisos i callbacks sense tornar a crear opcions', async () => {
  const abans = opcions.obteContext();
  mock.entrada += 1;
  const creaFil = vi.fn(() => 'nou'), obriFil = vi.fn(), sendChatMedia = vi.fn(() => 'adjunt');
  pont.entornAccions.current = { ...pont.entornAccions.current, ambit: 'B', usuariId: 'nou', creaFil, obriFil, sendChatMedia };
  expect(opcions.obteContext()).toMatchObject({ ambit: 'B', usuariId: 'nou', actiu: true });
  expect(opcions.obteContext().clau).not.toBe(abans.clau);
  expect(opcions.creaPrivat('vei')).toBe('nou'); opcions.obreFil('nou');
  expect(opcions.enviaAdjunt('fitxer')).toBe('adjunt');
  expect(creaFil).toHaveBeenCalledWith('vei'); expect(obriFil).toHaveBeenCalledWith('nou');
  expect(opcions.obteMissatge(ID)).toMatchObject({ id: ID });
  pont.filsRef.current = [{ id: FIL, participant: false }];
  expect(opcions.obteMissatge(ID)).toBeNull();
  pont.filsRef.current = [{ id: FIL, participant: true }];
  pont.entornAccions.current.esPersonaBloquejada = () => true;
  expect(opcions.obteMissatge(ID)).toBeNull();
  pont.desmuntat.current = true;
  expect(opcions.obteContext().actiu).toBe(false);
});

test('l’AbortSignal i la porta de normes paren l’enviament abans del port', async () => {
  const control = new AbortController(); control.abort();
  await expect(opcions.enviaText(DESTI, 'Text', { clientMsgId: ID, signal: control.signal })).rejects.toMatchObject({ name: 'AbortError' });
  pont.moderacioRef.current = { asseguraNormes: vi.fn(async () => false) };
  await expect(opcions.enviaText(DESTI, 'Text', { clientMsgId: ID })).rejects.toMatchObject({ name: 'AbortError' });
  expect(mock.publica).not.toHaveBeenCalled();
});

test('només un ACK del mateix ID, fil i seq definitiu es fusiona', async () => {
  for (const resposta of [{ id: 'altre', filId: DESTI.id, seq: 2 }, { id: ID, filId: 'altre', seq: 2 },
    { id: ID, filId: DESTI.id, seq: 0 }, { id: ID, filId: DESTI.id, seq: 2, encuat: true }]) {
    mock.publica.mockResolvedValueOnce(resposta);
    await expect(opcions.enviaText(DESTI, 'Text', { clientMsgId: ID })).rejects.toMatchObject({ code: 'sense-confirmacio' });
  }
  expect(pont.mutaMissatges).not.toHaveBeenCalled();
  const control = new AbortController();
  expect(await opcions.enviaText(DESTI, 'Text', { clientMsgId: ID, signal: control.signal })).toMatchObject([{ id: ID, seq: 2, sender: 'me' }]);
  expect(mock.publica).toHaveBeenLastCalledWith(DESTI.id, { id: ID, text: 'Text' }, { tenantId: 'tenant-A', signal: control.signal });
  expect(missatges[DESTI.id]).toHaveLength(1); expect(fils[0].ultimSeq).toBe(2);
});

test('el mode local conserva l’enviador del context sense passar pel servei remot', async () => {
  const local = vi.fn(async () => ['local']); pont.entornAccions.current = { ...pont.entornAccions.current, modeDades: 'local', enviaAmbNormes: local };
  const extra = { clientMsgId: ID };
  expect(await opcions.enviaText(DESTI, 'Text', extra)).toEqual(['local']);
  expect(local).toHaveBeenCalledWith(DESTI, 'Text', extra); expect(mock.publica).not.toHaveBeenCalled();
});

test('l’adjunt usa URL autoritzada renovada, sense credencials ni redireccions', async () => {
  const signal = new AbortController().signal;
  const fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['abc']) })); vi.stubGlobal('fetch', fetch);
  const m = { tipus: 'imatge', metadades: { adjunt: { id: 'adjunt', mime: 'image/jpeg' } } };
  const blob = await opcions.lligBlob(m, { signal });
  expect(blob.size).toBe(3); expect(blob.type).toBe('image/jpeg');
  expect(mock.urlAdjuntXat).toHaveBeenCalledWith('adjunt', { tenantId: 'tenant-A', signal }, { renova: true });
  expect(fetch).toHaveBeenCalledWith('https://autoritzat.invalid/adjunt', { signal, credentials: 'omit', redirect: 'error' });
});

test('l’stream que supera el límit es cancel·la i sempre allibera el lector', async () => {
  const reader = { read: vi.fn().mockResolvedValueOnce({ done: false, value: new Uint8Array(3) }).mockResolvedValueOnce({ done: false, value: new Uint8Array(2) }),
    cancel: vi.fn(async () => {}), releaseLock: vi.fn() };
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, body: { getReader: () => reader } })));
  await expect(opcions.lligBlob({ tipus: 'imatge', metadades: { adjunt: { id: 'adjunt', mime: 'image/jpeg' } } }, {})).rejects.toThrow('límit');
  expect(reader.cancel).toHaveBeenCalledTimes(1); expect(reader.releaseLock).toHaveBeenCalledTimes(1);
});
