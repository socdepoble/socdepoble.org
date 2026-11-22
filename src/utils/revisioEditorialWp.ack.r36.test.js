import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ cap: false, save: vi.fn() }));
vi.mock('../data/backendPort.js', () => ({
  teCapacitat: () => m.cap,
  desaRevisioEditorialWp: (...args) => m.save(...args)
}));
import {
  CLAU_STORAGE_REVISIO_WP, desaRevisioArticleImportat,
  desaRevisioArticleImportatAmbServidor, llegeixEstatRevisioEditorial
} from './revisioEditorialWp.js';
import { desaSessio, esborraSessio } from '../data/identitat.js';

const initial = { estats: { 619: 'aprovat' }, anotacions: { 619: 'anterior' }, versions: { 619: 'v0' }, pendents: {}, destinacions: { 619: 'herbari' } };
const patch = { estat: 'amb_observacions', nota: 'nota nova', autoria: 'Custòdia', desti: 'herbari' };
function storageWith(write = () => {}) {
  const map = new Map([[CLAU_STORAGE_REVISIO_WP, JSON.stringify(initial)]]);
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => { write(); map.set(key, value); } };
}
beforeEach(() => { m.cap = false; m.save.mockReset(); });
afterEach(() => { vi.restoreAllMocks(); esborraSessio(); });

test.each(['QuotaExceededError', 'SecurityError'])('%s no és ACK local i preserva el registre durable', async (name) => {
  const storage = storageWith(() => { throw Object.assign(new Error('denegat'), { name }); });
  const result = await desaRevisioArticleImportatAmbServidor(619, patch, { storage });
  expect(result).toMatchObject({ remot: false, desatLocal: false });
  expect(llegeixEstatRevisioEditorial(storage).anotacions['619']).toBe('anterior');
  expect(m.save).not.toHaveBeenCalled();
});

test('getter localStorage denegat no és ACK local', async () => {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('denegat', 'SecurityError'); });
  expect(await desaRevisioArticleImportatAmbServidor(619, patch)).toMatchObject({ remot: false, desatLocal: false });
});

test('storage rebutjat i transport offline no confirmen cap destí', async () => {
  m.cap = true; m.save.mockRejectedValue(new TypeError('offline'));
  const storage = storageWith(() => { throw new Error('quota'); });
  const result = await desaRevisioArticleImportatAmbServidor(619, patch, { storage });
  expect(result).toMatchObject({ remot: false, desatLocal: false });
  expect(m.save).toHaveBeenCalledWith(expect.objectContaining({ ...patch, wpId: 619, actualitzatEsperat: 'v0' }), {});
  expect(llegeixEstatRevisioEditorial(storage).versions['619']).toBe('v0');
});

test('conflicte remot amb storage fallit no promet còpia local', async () => {
  m.cap = true; m.save.mockRejectedValue(Object.assign(new Error('409'), { code: 'conflicte-versio' }));
  const result = await desaRevisioArticleImportatAmbServidor(619, patch, { storage: storageWith(() => { throw new Error('quota'); }) });
  expect(result).toMatchObject({ remot: false, desatLocal: false, conflicte: true });
});

test.each([false, true])('storage funcional confirma el local encara que el remot siga absent/offline (%s)', async (cap) => {
  m.cap = cap; m.save.mockRejectedValue(new TypeError('offline'));
  const storage = storageWith();
  expect(await desaRevisioArticleImportatAmbServidor(619, patch, { storage })).toMatchObject({ remot: false, desatLocal: true });
  expect(llegeixEstatRevisioEditorial(storage).anotacions['619']).toBe('nota nova');
});

test('ACK remot positiu continua sent real encara que storage rebutge', async () => {
  m.cap = true; m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v1' });
  const storage = storageWith(() => { throw new Error('quota'); });
  expect(await desaRevisioArticleImportatAmbServidor(619, patch, { storage })).toMatchObject({ remot: true, desatLocal: false, fila: { actualitzatA: 'v1' } });
  expect(llegeixEstatRevisioEditorial(storage).anotacions['619']).toBe('anterior');
});

test('si storage es recupera en rebre ACK, la còpia confirmada inclou text i token', async () => {
  m.cap = true; m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v1' });
  let writes = 0;
  const storage = storageWith(() => { if (++writes === 1) throw new Error('quota inicial'); });
  expect(await desaRevisioArticleImportatAmbServidor(619, patch, { storage })).toMatchObject({ remot: true, desatLocal: true });
  expect(llegeixEstatRevisioEditorial(storage)).toMatchObject({ anotacions: { 619: 'nota nova' }, versions: { 619: 'v1' } });
});

test('si només falla copiar el token de l’ACK remot, no es dona eixa còpia per confirmada', async () => {
  m.cap = true; m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v1' });
  let writes = 0;
  const storage = storageWith(() => { if (++writes > 1) throw new Error('quota en ACK'); });
  expect(await desaRevisioArticleImportatAmbServidor(619, patch, { storage })).toMatchObject({ remot: true, desatLocal: false });
  expect(llegeixEstatRevisioEditorial(storage)).toMatchObject({ anotacions: { 619: 'nota nova' }, versions: { 619: 'v0' } });
});

test('l’export síncron manté el contracte de registre dels altres callers', () => {
  const record = desaRevisioArticleImportat(619, patch, storageWith());
  expect(record.anotacions['619']).toBe('nota nova');
  expect(record).not.toHaveProperty('desatLocal');
  expect(record).not.toHaveProperty('estat');
});

test.each(['B', 'A'])('helper: canvi d’entrada a %s durant import del port no despatxa RPC', async actor => {
  desaSessio({ access_token: 'r36-A', user: { id: 'A' } });
  m.cap = true;
  const pending = desaRevisioArticleImportatAmbServidor(619, patch, { storage: storageWith() });
  esborraSessio(); desaSessio({ access_token: 'r36-'+actor, user: { id: actor } });
  expect(await pending).toMatchObject({ remot: false, desatLocal: true, cancelada: true, motiu: 'sessio-canviada' });
  expect(m.save).not.toHaveBeenCalled();
});

test('helper: un ACK després de canviar sessió no reescriu còpia ni token local', async () => {
  desaSessio({ access_token: 'r36-A', user: { id: 'A' } });
  let resolve; m.cap = true; m.save.mockImplementation(() => new Promise(r => { resolve = r; }));
  const storage = storageWith();
  const pending = desaRevisioArticleImportatAmbServidor(619, patch, { storage });
  await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
  esborraSessio(); desaSessio({ access_token: 'r36-B', user: { id: 'B' } });
  resolve({ wpId: 619, actualitzatA: 'v1' });
  expect(await pending).toMatchObject({ remot: false, desatLocal: true, cancelada: true, motiu: 'sessio-canviada' });
  expect(llegeixEstatRevisioEditorial(storage).versions['619']).toBe('v0');
  expect(llegeixEstatRevisioEditorial(storage).pendents['619']).toBe(true);
});

test('canari del caller històric void: cancel·lar no crea cap rebuig no capturat', async () => {
  desaSessio({ access_token: 'r36-A', user: { id: 'A' } });
  m.cap = true;
  const pending = desaRevisioArticleImportatAmbServidor(619, patch, { storage: storageWith() });
  void pending;
  esborraSessio();
  expect(await pending).toMatchObject({ cancelada: true, remot: false });
  expect(m.save).not.toHaveBeenCalled();
});

test.each(['text posterior diferent', 'anterior', 'nota antiga pendent'])('ACK antic no substituïx una intenció posterior, encara que torne a «%s»', async finalText => {
  let quota = true, resolve;
  const storage = storageWith(() => { if (quota) throw new Error('quota'); });
  m.cap = true; m.save.mockImplementationOnce(() => new Promise(r => { resolve = r; })).mockRejectedValue(new TypeError('offline'));
  const old = desaRevisioArticleImportatAmbServidor(619, { ...patch, estat: 'aprovat', nota: 'nota antiga pendent' }, { storage });
  await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
  quota = false;
  desaRevisioArticleImportat(619, { estat: 'aprovat', nota: 'intermèdia' }, storage);
  await desaRevisioArticleImportatAmbServidor(619, { ...patch, estat: 'aprovat', nota: finalText }, { storage });
  const latest = storage.getItem(CLAU_STORAGE_REVISIO_WP);
  resolve({ wpId: 619, actualitzatA: 'v1' });
  expect(await old).toMatchObject({ remot: true, desatLocal: false });
  expect(storage.getItem(CLAU_STORAGE_REVISIO_WP)).toBe(latest);
  expect(llegeixEstatRevisioEditorial(storage).pendents['619']).toBe(true);
});

test('una intenció d’un altre wpId no impedix recuperar la còpia de l’ACK vigent', async () => {
  let quota = true, resolve;
  const storage = storageWith(() => { if (quota) throw new Error('quota'); });
  m.cap = true; m.save.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  const pending = desaRevisioArticleImportatAmbServidor(619, patch, { storage });
  await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
  quota = false; desaRevisioArticleImportat(16839, { estat: 'aprovat', nota: 'un altre document' }, storage);
  resolve({ wpId: 619, actualitzatA: 'v1' });
  expect(await pending).toMatchObject({ remot: true, desatLocal: true });
  expect(llegeixEstatRevisioEditorial(storage).anotacions).toMatchObject({ 619: 'nota nova', 16839: 'un altre document' });
});
