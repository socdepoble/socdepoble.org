import { expect, test } from 'vitest';
import { construeixAmbitCuaRural, creaCuaSincronitzacioRural } from '../estatSincronitzacioRural.js';

const AMBIT = construeixAmbitCuaRural({ backend: 'backend-fixture', tenantId: 'poble-fixture', usuariId: 'persona-fixture' });
const FIL = 'ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb';
const MISSATGE = '11111111-2222-4333-8444-555555555555';

test('R29: la purga antiga no desactiva la partició nova de la mateixa persona després d’una espera', async () => {
  let completa;
  const esborrat = new Promise(resolve => { completa = resolve; });
  const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: {
    esborra: () => esborrat, desa: async () => {},
  } });
  const purga = cua.purgaAmbit(AMBIT);
  cua.canviaAmbitActiu(AMBIT);
  await cua.encua({ filId: FIL, client_msg_id: MISSATGE, text: 'Sessió nova' });
  completa();
  await purga;
  expect(cua.obteAmbitActiu()).toBe(AMBIT);
  expect(cua.llistaMissatges()).toHaveLength(1);
  await expect(cua.drenaPendents(async (_fil, payload) => ({ id: payload.client_msg_id, seq: 1 }))).resolves.toHaveLength(1);
});

test('R29: una fallada de persistència de la purga no restaura l’àmbit tancat', async () => {
  const errorDisc = new Error('Fixture de persistència no disponible');
  const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: {
    esborra: async () => { throw errorDisc; },
  } });
  await expect(cua.purgaAmbit(AMBIT)).rejects.toBe(errorDisc);
  expect(cua.obteAmbitActiu()).toBeNull();
  await expect(cua.encua({ filId: FIL, client_msg_id: MISSATGE, text: 'Sessió tancada' })).rejects.toMatchObject({ codi: 'AMBIT_INVALID' });
});
