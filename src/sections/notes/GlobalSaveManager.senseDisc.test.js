/* Gauntlet 261017 (Bloc 0.1) · Sense IndexedDB (Node i Vitest) no hi ha disc,
   i la cua de Notes ho tracta com un cas net: les lectures i la purga tornen
   buit, el desat va a la memòria de la pestanya amb el mateix CAS, i la consola
   queda muda. Abans, cada crida abocava un «ReferenceError: indexedDB is not
   defined». Amb un IndexedDB que no es deixa obrir (Firefox 100–114 en privat),
   tot continua com sempre, també l'avís. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  GlobalSaveManager, getDraftsForScope, llegeixEsborranys, mutateDraft, purgaEsborranys
} from './GlobalSaveManager.js';

const SCOPE = 'local:[proves]_persona::u1_poble';
let avis;

beforeEach(() => {
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('sense IndexedDB, les lectures i la purga tornen buit i el desat ho diu amb ErrorSenseDisc, sense cap avís', async () => {
  vi.stubGlobal('indexedDB', undefined);
  await expect(getDraftsForScope(SCOPE, new GlobalSaveManager())).resolves.toEqual({});
  await expect(llegeixEsborranys(() => true)).resolves.toEqual([]);
  await expect(purgaEsborranys(() => true)).resolves.toEqual([]);
  const error = await mutateDraft(`${SCOPE}:n1`, () => ({ title: 'A' })).catch((e) => e);
  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe('ErrorSenseDisc');
  expect(avis).not.toHaveBeenCalled();
});

test('sense IndexedDB, la cua desa des de la memòria amb el mateix CAS, ho diu a la ploma i oblida en eixir, sense cap avís', async () => {
  vi.stubGlobal('indexedDB', undefined);
  const manager = new GlobalSaveManager({ delay: 60000 });
  const update = vi.fn(async (_id, cos, revisio) => ({ ...cos, revision: revisio + 1 }));
  const desat = manager.enqueue(SCOPE, 'n1', 'title', 'Hola', () => ({ revision: 3 }), update, vi.fn(), vi.fn());
  await manager.flush(SCOPE, 'n1');
  expect(await desat).toBe(true);
  expect(update).toHaveBeenCalledWith('n1', { title: 'Hola' }, 3);
  expect(manager.estat(SCOPE, 'n1')).toMatchObject({ estat: 'net', pestanya: true });

  // Una tecla que encara no ha eixit es conserva en la memòria, i l'avís d'eixida la veu.
  manager.enqueue(SCOPE, 'n1', 'subtitle', 'Bon dia', () => ({ revision: 4 }), update, vi.fn(), vi.fn());
  expect(await manager.rebaseDraft(SCOPE, 'n1', 4)).toEqual({ subtitle: 'Bon dia' });
  expect(await manager.pendentsDe('u1')).toEqual([{ entitat: 'nota', id: 'n1', camps: ['subtitle'] }]);
  expect(await manager.oblidaUsuari('u1')).toEqual([`${SCOPE}:n1`]);
  expect(await manager.pendentsDe('u1')).toEqual([]);
  expect(update).toHaveBeenCalledTimes(1);
  expect(avis).not.toHaveBeenCalled();
});

test('control: amb un IndexedDB que no es deixa obrir, el desat passa a la pestanya i continua avisant', async () => {
  const falla = new Error('InvalidStateError');
  vi.stubGlobal('indexedDB', {
    open: () => {
      const peticio = {};
      queueMicrotask(() => { peticio.error = falla; peticio.onerror(); });
      return peticio;
    }
  });
  const manager = new GlobalSaveManager({ delay: 60000 });
  const update = vi.fn(async (_id, cos) => ({ ...cos, revision: 1 }));
  const desat = manager.enqueue(SCOPE, 'n2', 'title', 'A', () => ({}), update, vi.fn(), vi.fn());
  await manager.flush(SCOPE, 'n2');
  expect(await desat).toBe(true);
  expect(update).toHaveBeenCalledWith('n2', { title: 'A' }, 0);
  expect(manager.estat(SCOPE, 'n2').pestanya).toBe(true);
  expect(avis).toHaveBeenCalledWith('[Notes] El dispositiu no guarda l’esborrany; es guarda en esta pestanya:', falla);
  await expect(getDraftsForScope(SCOPE, manager)).resolves.toEqual({});
  expect(avis).toHaveBeenCalledWith('[Notes] No es poden llegir els esborranys del dispositiu:', falla);
});
