import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn() }));
vi.mock('../data/backendPort.js', () => ({ teCapacitat: () => true, llistaRevisionsEditorialsWp: (...a) => m.list(...a), desaRevisioEditorialWp: (...a) => m.save(...a) }));
import { creaRevisionsEditorialsWpLocal } from '../data/revisionsEditorialsWpMemoria.js';
import { desaRevisioArticleImportatAmbServidor, sincronitzaRevisionsEditorialsWpAmbServidor, llegeixEstatRevisioEditorial, consultaRevisioEditorialWp, CLAU_STORAGE_REVISIO_WP } from './revisioEditorialWp.js';
const mem = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }; };
const fila = (actualitzatA = '2026-11-15T22:00:00.000001Z') => ({ wpId: 1, estat: 'aprovat', nota: 'del servidor', autoria: 'Autora', desti: 'mur', actualitzatA });
beforeEach(() => { m.list.mockReset().mockResolvedValue([fila()]); m.save.mockReset(); });
test('CAS local conforma èxit seqüencial, versió obsoleta i reintent explícit', () => {
 const api = creaRevisionsEditorialsWpLocal(() => ({ id: 'a' }), () => '2026-11-15T00:00:00Z');
 const input = { wpId: 1, estat: 'aprovat' };
 const a = api.desaRevisioEditorialWp(input);
 const b = api.desaRevisioEditorialWp({ ...input, nota: 'b', actualitzatEsperat: a.actualitzatA });
 expect(b.actualitzatA).not.toBe(a.actualitzatA);
 expect(() => api.desaRevisioEditorialWp({ ...input, nota: 'c', actualitzatEsperat: a.actualitzatA })).toThrow('ha canviat');
 expect(() => api.desaRevisioEditorialWp(input)).toThrow('ha canviat');
 expect(api.desaRevisioEditorialWp({ ...input, nota: 'c revisada', actualitzatEsperat: b.actualitzatA }).nota).toBe('c revisada');
});
test('la versió llegida es transmet exacta i el conflicte conserva la nota local', async () => {
 const storage = mem(); await sincronitzaRevisionsEditorialsWpAmbServidor({ storage });
 m.save.mockRejectedValue(Object.assign(new Error('409'), { code: 'conflicte-versio' }));
 const r = await desaRevisioArticleImportatAmbServidor(1, { estat: 'amb_observacions', nota: 'la meua nota' }, { storage });
 expect(r).toMatchObject({ remot: false, conflicte: true });
 expect(m.save.mock.calls[0][0].actualitzatEsperat).toBe(fila().actualitzatA);
 expect(llegeixEstatRevisioEditorial(storage).anotacions['1']).toBe('la meua nota');
 await sincronitzaRevisionsEditorialsWpAmbServidor({ storage });
 expect(llegeixEstatRevisioEditorial(storage).anotacions['1']).toBe('la meua nota');
 expect(llegeixEstatRevisioEditorial(storage).versions['1']).toBe(fila().actualitzatA);
});
test('consulta no destructiva i reintent amb versió revisada confirma només el contingut enviat', async () => {
 const storage = mem(); await sincronitzaRevisionsEditorialsWpAmbServidor({ storage });
 m.save.mockRejectedValueOnce(Object.assign(new Error('409'), { code: 'conflicte-versio' }));
 await desaRevisioArticleImportatAmbServidor(1, { estat: 'aprovat', nota: 'local' }, { storage });
 m.list.mockResolvedValue([fila('2026-11-15T22:00:00.000002Z')]);
 const remote = await consultaRevisioEditorialWp(1);
 expect(llegeixEstatRevisioEditorial(storage).anotacions['1']).toBe('local');
 m.save.mockResolvedValue({ ...remote, nota: 'local', actualitzatA: '2026-11-15T22:00:00.000003Z' });
 const r = await desaRevisioArticleImportatAmbServidor(1, { estat: 'aprovat', nota: 'local' }, { storage, actualitzatEsperat: remote.actualitzatA });
 expect(r.remot).toBe(true); expect(r.estat.pendents['1']).toBeUndefined();
 expect(m.save.mock.calls.at(-1)[0].actualitzatEsperat).toBe(remote.actualitzatA);
});
test('un ACK anterior no elimina una anotació més nova', async () => {
 const storage = mem(); let resolve;
 m.save.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
 const pending = desaRevisioArticleImportatAmbServidor(1, { estat: 'aprovat', nota: 'primera' }, { storage });
 await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
 m.save.mockRejectedValueOnce(new Error('xarxa'));
 await desaRevisioArticleImportatAmbServidor(1, { estat: 'aprovat', nota: 'segona' }, { storage });
 resolve(fila()); await pending;
 expect(llegeixEstatRevisioEditorial(storage).anotacions['1']).toBe('segona');
 expect(llegeixEstatRevisioEditorial(storage).pendents['1']).toBe(true);
});

test('les anotacions antigues sense token es conserven fins a revisar-les explícitament', async () => {
 const storage = mem();
 storage.setItem(CLAU_STORAGE_REVISIO_WP, JSON.stringify({ estats: { 1: 'amb_observacions' }, anotacions: { 1: 'Nota antiga només local' }, destinacions: {} }));
 await sincronitzaRevisionsEditorialsWpAmbServidor({ storage });
 expect(llegeixEstatRevisioEditorial(storage).anotacions['1']).toBe('Nota antiga només local');
 expect(llegeixEstatRevisioEditorial(storage).pendents['1']).toBe(true);
 expect(llegeixEstatRevisioEditorial(storage).versions['1']).toBeUndefined();
});

/* Onada R30 · P1-79 (àrbitre) · Una anotació d'abans de R30 que el servidor ja té igual no queda
   protegida per sempre: se n'adopta la versió i la sincronització següent porta el canvi d'una
   altra editora, com hui. */
test('una anotació antiga igual a la del servidor deixa de ser pendent i torna a seguir el servidor', async () => {
 const storage = mem();
 storage.setItem(CLAU_STORAGE_REVISIO_WP, JSON.stringify({ estats: { 1: 'aprovat' }, anotacions: { 1: 'del servidor' }, destinacions: {} }));
 expect(llegeixEstatRevisioEditorial(storage).pendents['1']).toBe(true);
 await sincronitzaRevisionsEditorialsWpAmbServidor({ storage });
 expect(llegeixEstatRevisioEditorial(storage).pendents['1']).toBeUndefined();
 expect(llegeixEstatRevisioEditorial(storage).versions['1']).toBe(fila().actualitzatA);
 m.list.mockResolvedValue([{ ...fila('2026-11-15T22:00:00.000009Z'), nota: 'd’una altra editora' }]);
 await sincronitzaRevisionsEditorialsWpAmbServidor({ storage });
 expect(llegeixEstatRevisioEditorial(storage).anotacions['1']).toBe('d’una altra editora');
 expect(llegeixEstatRevisioEditorial(storage).versions['1']).toBe('2026-11-15T22:00:00.000009Z');
});

/* Onada R30 · P1-79 (àrbitre) · El mode local (adaptadorLocal) guarda les revisions en memòria: en
   recarregar no n'hi ha cap, però el navegador encara recorda la versió. Una versió que el servidor
   ja no té no pot ser la base del CAS (seria un conflicte fals a cada recàrrega): la sincronització
   l'oblida i el desament següent crea, com fins ara. */
test('una versió que el servidor ja no té s’oblida en sincronitzar: després de recarregar el mode local es desa sense conflicte', async () => {
 const storage = mem();
 let api = creaRevisionsEditorialsWpLocal(() => ({ id: 'a' }), () => new Date());
 m.list.mockImplementation(() => api.llistaRevisionsEditorialsWp());
 m.save.mockImplementation(entrada => api.desaRevisioEditorialWp(entrada));
 expect(await desaRevisioArticleImportatAmbServidor(1, { estat: 'aprovat', nota: 'primera' }, { storage })).toMatchObject({ remot: true });
 expect(llegeixEstatRevisioEditorial(storage).versions['1']).toBeTypeOf('string');
 api = creaRevisionsEditorialsWpLocal(() => ({ id: 'a' }), () => new Date());
 await sincronitzaRevisionsEditorialsWpAmbServidor({ storage });
 expect(llegeixEstatRevisioEditorial(storage).versions['1']).toBeUndefined();
 expect(llegeixEstatRevisioEditorial(storage).anotacions['1']).toBe('primera');
 const r = await desaRevisioArticleImportatAmbServidor(1, { estat: 'aprovat', nota: 'segona' }, { storage });
 expect(r.remot).toBe(true);
 expect(r.conflicte).not.toBe(true);
 expect(api.llistaRevisionsEditorialsWp()[0].nota).toBe('segona');
});
