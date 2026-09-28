/**
 * T43 (ordre del Mestre, 260928) · Executar la visibilitat: enviaments en
 * sèrie, un resultat per destinatari, una fallada no n'atura cap altra, i la
 * nota apunta què s'ha fet. Amb el xat i el Bloc simulats (cap xarxa).
 */
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ creaFil: vi.fn(), send: vi.fn(), update: vi.fn(), ordre: [] }));
vi.mock('../xat/XatContext.jsx', () => ({ useXat: () => ({ creaFil: mocks.creaFil, sendChatMessage: mocks.send }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ updateNote: mocks.update }) }));
import { useAplicaAbast } from './useAplicaAbast.js';

const NOTA = { id: 'n-1', revision: 3 };
const ORIGEN = { tipus: 'connexio', itemId: 'sella', titol: 'Sella', objecte: 'poble' };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.ordre = [];
  mocks.creaFil.mockImplementation(async (id) => { mocks.ordre.push(`fil:${id}`); return `f-${id}`; });
  mocks.send.mockImplementation(async (fil, text) => { mocks.ordre.push(`envia:${fil.id}`); return [{ id: 'm', text }]; });
  mocks.update.mockResolvedValue({ id: 'n-1' });
});

const aplica = (args) => renderHook(() => useAplicaAbast()).result.current.aplica(args);

test('privada: cap crida ni al xat ni a la nota', async () => {
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'privada' }, missatge: 'x' });
  expect(resultats).toEqual([]);
  expect(mocks.creaFil).not.toHaveBeenCalled();
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});

test('dues persones: una conversa nova i una que ja existia, en sèrie, i la nota ho apunta', async () => {
  const abast = { mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }, { id: 'u2', nom: 'Toni', filId: 'f-vell' }] };
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast, missatge: 'Hola' });
  expect(mocks.ordre).toEqual(['fil:u1', 'envia:f-u1', 'envia:f-vell']);
  expect(mocks.creaFil).toHaveBeenCalledTimes(1);
  expect(mocks.send).toHaveBeenCalledWith({ id: 'f-u1' }, 'Hola');
  expect(resultats.map((r) => [r.nom, r.estat])).toEqual([['Pepa', 'fet'], ['Toni', 'fet']]);
  const [id, canvis, revisio] = mocks.update.mock.calls[0];
  expect([id, revisio]).toEqual(['n-1', 3]);
  expect(canvis.origen.abast).toMatchObject({
    mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }, { id: 'u2', nom: 'Toni' }],
    aplicat: { persones: ['u1', 'u2'], grups: [], mur: false }
  });
  // El filId del padró no es guarda a la nota.
  expect(JSON.stringify(canvis.origen.abast)).not.toContain('f-vell');
});

test('una fallada no n’atura cap altra: cada destinatari té el seu resultat', async () => {
  mocks.creaFil.mockImplementationOnce(async () => { throw new Error('Esta persona no accepta missatges.'); });
  mocks.send.mockImplementation(async (fil) => (fil.id === 'g2' ? [] : [{ id: 'm' }]));
  const persones = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }, { id: 'u2', nom: 'Toni' }] }, missatge: 'x' });
  expect(persones.resultats.map((r) => [r.nom, r.estat, r.detall])).toEqual([
    ['Pepa', 'error', 'Esta persona no accepta missatges.'],
    ['Toni', 'fet', 'Enviat per xat.']
  ]);
  const grups = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'grups', grups: [{ id: 'g1', nom: 'Comissió' }, { id: 'g2', nom: 'Colla' }] }, missatge: 'x' });
  expect(mocks.creaFil).toHaveBeenCalledTimes(2); // només les dues persones: als grups no s'obri cap conversa
  expect(grups.resultats.map((r) => [r.nom, r.estat])).toEqual([['Comissió', 'fet'], ['Colla', 'error']]);
  expect(grups.resultats[1].detall).toContain('El trobaràs al xat');
  expect(mocks.update.mock.calls.at(-1)[1].origen.abast.aplicat).toMatchObject({ grups: ['g1'] });
});

test('creaFil sense conversa (sessió canviada) és un error, no un enviament fantasma', async () => {
  mocks.creaFil.mockResolvedValueOnce(null);
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }] }, missatge: 'x' });
  expect(resultats[0]).toMatchObject({ estat: 'error', detall: 'No s’ha pogut obrir la conversa.' });
  expect(mocks.send).not.toHaveBeenCalled();
});

test('tot el poble: un pas pendent, cap enviament ni registre automàtic', async () => {
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'poble' }, missatge: 'x' });
  expect(resultats).toHaveLength(1);
  expect(resultats[0]).toMatchObject({ tipus: 'mur', estat: 'pendent' });
  expect(resultats[0].detall).toContain('no Internet');
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});

test('si la nota no pot apuntar els enviaments, es diu (els missatges ja han eixit)', async () => {
  mocks.update.mockRejectedValueOnce(new Error('Conflicte de concurrència de revisió.'));
  const { resultats } = await aplica({ nota: NOTA, origen: ORIGEN, abast: { mode: 'grups', grups: [{ id: 'g1', nom: 'Comissió' }] }, missatge: 'x' });
  expect(resultats.map((r) => [r.clau, r.estat])).toEqual([['xat-grup:g1', 'fet'], ['registre', 'error']]);
  expect(resultats[1].detall).toContain('ja han eixit');
});
