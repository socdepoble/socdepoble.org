/**
 * R12 (Onada R6, Bloc 4, B4-S1) · creaCarpetaCreada persistix la carpeta pel
 * port (`carpetesNotes` → `note_folders`) quan el backend en té i treballem en
 * remot; si no, es queda al magatzem del navegador per àmbit, com fins ara.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { STORAGE_PREFIX } from '../../../config/storage.js';

const port = vi.hoisted(() => ({ capacitats: new Set(), crea: vi.fn() }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: (cap) => port.capacitats.has(cap),
  creaCarpetaNotes: (...args) => port.crea(...args)
}));

import { CLAU_CARPETES_CREADES, _reiniciaCarpetesCreades, carpetesCreades, creaCarpetaCreada, subscriuCarpetesCreades } from './carpetesCreades.js';

const CLAU = STORAGE_PREFIX + CLAU_CARPETES_CREADES;
const REMOT = Object.freeze({ dataMode: 'remote', tenantId: '11111111-1111-4111-8111-111111111111' });
const DEL_SERVIDOR = Object.freeze({ id: 'f-0f0e0d0c-0b0a-4908-8706-050403020100', nom: 'Festes', parentId: null });
const SERIE = [{ id: 'f-mur', nom: 'Mur' }];

beforeEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
  port.capacitats = new Set(['carpetesNotes']);
  port.crea.mockReset();
});
afterEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
});

test('amb carpetes al backend, la carpeta es crea pel port i pren l’id del servidor', async () => {
  port.crea.mockResolvedValue(DEL_SERVIDOR);
  const oient = vi.fn();
  const desfes = subscriuCarpetesCreades(oient);
  await expect(creaCarpetaCreada('notes-a', '  Festes ', { existents: SERIE, config: REMOT })).resolves.toEqual({ id: DEL_SERVIDOR.id, nom: 'Festes', nova: true, desti: 'servidor' });
  expect(port.crea).toHaveBeenCalledWith({ nom: 'Festes' }, REMOT);
  /* La de servidor també es veu ací de seguida (i a les altres pestanyes pel storage). */
  expect(carpetesCreades('notes-a')).toEqual([{ id: DEL_SERVIDOR.id, nom: 'Festes' }]);
  expect(JSON.parse(localStorage.getItem(CLAU)).ambits['notes-a']).toEqual([{ id: DEL_SERVIDOR.id, nom: 'Festes' }]);
  expect(oient).toHaveBeenCalled();
  desfes();
});

test('un nom que ja hi és (de sèrie o creat) no torna a eixir cap a la xarxa', async () => {
  await expect(creaCarpetaCreada('notes-a', 'mur', { existents: SERIE, config: REMOT })).resolves.toEqual({ id: 'f-mur', nom: 'Mur', nova: false, desti: 'existent' });
  expect(port.crea).not.toHaveBeenCalled();
});

test('sense la capacitat o en mode seed/local, el magatzem del navegador de sempre', async () => {
  port.capacitats = new Set();
  await expect(creaCarpetaCreada('notes-a', 'Hort', { config: REMOT })).resolves.toEqual({ id: 'f-hort', nom: 'Hort', nova: true, desti: 'navegador' });
  port.capacitats = new Set(['carpetesNotes']);
  await expect(creaCarpetaCreada('notes-a', 'Vinya', { config: { dataMode: 'seed' } })).resolves.toMatchObject({ id: 'f-vinya', desti: 'navegador' });
  await expect(creaCarpetaCreada('notes-a', 'Olivera', { config: { dataMode: 'local' } })).resolves.toMatchObject({ id: 'f-olivera', desti: 'navegador' });
  await expect(creaCarpetaCreada('notes-a', 'Garrofer')).resolves.toMatchObject({ id: 'f-garrofer', desti: 'navegador' });
  expect(port.crea).not.toHaveBeenCalled();
  expect(carpetesCreades('notes-a').map((c) => c.id)).toEqual(['f-hort', 'f-vinya', 'f-olivera', 'f-garrofer']);
});

test('un servidor sense la migració 76 (404) torna al navegador; un altre error es propaga sense carpeta a mitges', async () => {
  port.crea.mockRejectedValueOnce(Object.assign(new Error('L\'esquema requerit no està aplicat (falta "crea_carpeta_notes").'), { status: 404 }));
  await expect(creaCarpetaCreada('notes-a', 'Festes', { config: REMOT })).resolves.toMatchObject({ id: 'f-festes', desti: 'navegador' });
  port.crea.mockRejectedValueOnce(Object.assign(new Error('No pertanys a este poble.'), { status: 403 }));
  await expect(creaCarpetaCreada('notes-a', 'Collita', { config: REMOT })).rejects.toThrow('No pertanys');
  expect(carpetesCreades('notes-a').map((c) => c.id)).toEqual(['f-festes']);
});

test('un nom buit torna null i no fa res', async () => {
  await expect(creaCarpetaCreada('notes-a', '   ', { config: REMOT })).resolves.toBeNull();
  expect(port.crea).not.toHaveBeenCalled();
});
