/* IDEA-125 · El registre compartit de la revisió d'importació: avisa qui l'escolta, llig el que
   ha desat el camí de sempre i no és una segona font de veritat. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ desa: vi.fn() }));
vi.mock('../backendPort.js', () => ({
  teCapacitat: (nom) => nom === 'revisionsEditorialsWp',
  desaRevisioEditorialWp: (...a) => m.desa(...a),
  llistaRevisionsEditorialsWp: async () => []
}));

import { desaRevisio, llegeixRevisio, subscriu } from './revisioImportacioWpStore.js';
import { CLAU_STORAGE_REVISIO_WP, llegeixEstatRevisioEditorial } from '../../utils/revisioEditorialWp.js';

const baixes = [];
beforeEach(() => {
  localStorage.clear();
  m.desa.mockReset().mockResolvedValue({ wpId: 619, actualitzatA: '2026-11-18T22:00:00.000001Z' });
});
afterEach(() => { while (baixes.length) baixes.pop()(); });

test('desaRevisio avisa els subscrits, desa pel camí del CAS i llegeixRevisio en torna estat, nota i versió', async () => {
  const oient = vi.fn();
  baixes.push(subscriu(oient));
  const resultat = await desaRevisio(619, { estat: 'aprovat', nota: 'x' });
  expect(oient).toHaveBeenCalled();
  expect(resultat.remot).toBe(true);
  expect(m.desa).toHaveBeenCalledWith(expect.objectContaining({ wpId: 619, estat: 'aprovat', nota: 'x', actualitzatEsperat: null }), expect.anything());
  expect(llegeixRevisio(619)).toEqual({ estat: 'aprovat', nota: 'x', versio: '2026-11-18T22:00:00.000001Z' });
  expect(llegeixEstatRevisioEditorial().estats['619']).toBe('aprovat');
});

test('el segon desat porta la versió confirmada com a base del CAS, i el conflicte es torna tal qual', async () => {
  await desaRevisio(619, { estat: 'aprovat', nota: 'x' });
  m.desa.mockRejectedValueOnce(Object.assign(new Error('conflicte'), { code: 'conflicte-versio' }));
  const resultat = await desaRevisio(619, { estat: 'amb_observacions', nota: 'y' });
  expect(m.desa.mock.calls[1][0].actualitzatEsperat).toBe('2026-11-18T22:00:00.000001Z');
  expect(resultat).toMatchObject({ remot: false, conflicte: true });
  expect(llegeixRevisio(619)).toMatchObject({ estat: 'amb_observacions', nota: 'y' });
});

test('un StorageEvent d’una altra pestanya sobre la clau del registre avisa; una altra clau no', () => {
  const oient = vi.fn();
  baixes.push(subscriu(oient));
  window.dispatchEvent(new StorageEvent('storage', { key: 'una-altra-clau' }));
  expect(oient).not.toHaveBeenCalled();
  window.dispatchEvent(new StorageEvent('storage', { key: CLAU_STORAGE_REVISIO_WP }));
  expect(oient).toHaveBeenCalledTimes(1);
});

test('donar-se de baixa para els avisos', async () => {
  const oient = vi.fn();
  subscriu(oient)();
  await desaRevisio(619, { estat: 'aprovat', nota: '' });
  window.dispatchEvent(new StorageEvent('storage', { key: CLAU_STORAGE_REVISIO_WP }));
  expect(oient).not.toHaveBeenCalled();
});

test('sense res desat, l’estat per defecte és el del Banc: el Catàleg d’Arbres aprovat, la resta pendent', () => {
  expect(llegeixRevisio(619)).toEqual({ estat: 'aprovat', nota: '', versio: null });
  expect(llegeixRevisio(16839)).toEqual({ estat: 'pendent_admin', nota: '', versio: null });
});

test('sense autoria ni destí del cridador, el port rep els de l’article (els mateixos que envia el Banc); amb ells, els del cridador', async () => {
  await desaRevisio(619, { estat: 'aprovat', nota: 'x' });
  expect(m.desa.mock.calls[0][0]).toMatchObject({ autoria: 'Associació El Rentonar', desti: 'arbres-monumentals' });
  await desaRevisio(16839, { estat: 'aprovat', nota: '' });
  expect(m.desa.mock.calls[1][0]).toMatchObject({ autoria: 'Sóc de Poble', desti: 'mur' });
  await desaRevisio(619, { estat: 'aprovat', nota: 'x', autoria: 'Algú', desti: 'pagina' });
  expect(m.desa.mock.calls[2][0]).toMatchObject({ autoria: 'Algú', desti: 'pagina' });
});
