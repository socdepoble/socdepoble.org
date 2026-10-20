/**
 * Fase D (261020, tasca 2; pla 261020_1300 · Google Play UGC; crítica 261020,
 * 1) · Connectar també envia missatges de xat: les normes de convivència es
 * pregunten UNA sola vegada, abans del primer enviament (no una per
 * destinatari, com ho faria la porta de XatContext). Declinar-les no envia
 * res, no obri cap conversa, no toca la nota i deixa cada destinatari
 * «pendent», amb el motiu. «Tot el poble» (el Mur) no les demana: no envia
 * res. Amb el xat, el Bloc i la moderació simulats.
 */
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ creaFil: vi.fn(), send: vi.fn(), update: vi.fn(), moderacio: null }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => ({ creaFil: mocks.creaFil, sendChatMessage: mocks.send }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ updateNote: mocks.update }) }));
vi.mock('../../components/PedraSeca/hooks/moderacioDePoble.js', () => ({ useModeracio: () => mocks.moderacio }));
import { useAplicaAbast } from './useAplicaAbast.js';

const NOTA = { id: 'n-1', revision: 3 };
const ORIGEN = { tipus: 'connexio', itemId: 'sella', titol: 'Sella', objecte: 'poble' };
const PERSONES = { mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }, { id: 'u2', nom: 'Toni', filId: 'f-vell' }] };
const CAL_ACCEPTAR = 'Per a publicar, cal acceptar les normes de convivència.';

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.moderacio = null;
  mocks.creaFil.mockImplementation(async (id) => `f-${id}`);
  mocks.send.mockImplementation(async (fil, text) => [{ id: 'm', text }]);
  mocks.update.mockResolvedValue({ id: 'n-1' });
});

const aplica = (args) => renderHook(() => useAplicaAbast()).result.current.aplica(args);

test('declinar-les una vegada: cap enviament, cap conversa, cap registre a la nota, i tots «pendent»', async () => {
  const asseguraNormes = vi.fn().mockResolvedValue(false);
  mocks.moderacio = { asseguraNormes };
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: PERSONES, missatge: 'Hola' });
  expect(asseguraNormes).toHaveBeenCalledTimes(1);
  expect(mocks.creaFil).not.toHaveBeenCalled();
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(resultats).toEqual([
    { clau: 'xat-persona:u1', tipus: 'xat-persona', id: 'u1', nom: 'Pepa', estat: 'pendent', detall: CAL_ACCEPTAR },
    { clau: 'xat-persona:u2', tipus: 'xat-persona', id: 'u2', nom: 'Toni', estat: 'pendent', detall: CAL_ACCEPTAR }
  ]);
});

test('acceptades (o ja acceptades): una sola pregunta i els enviaments de sempre', async () => {
  const asseguraNormes = vi.fn().mockResolvedValue(true);
  mocks.moderacio = { asseguraNormes };
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: PERSONES, missatge: 'Hola' });
  expect(asseguraNormes).toHaveBeenCalledTimes(1);
  expect(mocks.send).toHaveBeenCalledTimes(2);
  expect(resultats.map((r) => r.estat)).toEqual(['fet', 'fet']);
});

test('«Tot el poble» no envia res: no les demana', async () => {
  const asseguraNormes = vi.fn().mockResolvedValue(false);
  mocks.moderacio = { asseguraNormes };
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'poble' }, missatge: 'x' });
  expect(asseguraNormes).not.toHaveBeenCalled();
  expect(resultats.map((r) => r.estat)).toEqual(['pendent']);
});

test('sense proveïdor de moderació, com sempre', async () => {
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: PERSONES, missatge: 'Hola' });
  expect(mocks.send).toHaveBeenCalledTimes(2);
  expect(resultats.map((r) => r.estat)).toEqual(['fet', 'fet']);
});
