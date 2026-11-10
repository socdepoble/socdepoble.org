/* Revisió final R16a (carril FA) · Què sap la pestanya de la versió que té el
   Mur de cada nota: la revisió d'una publicació confirmada (marcaPublicada),
   un desat confirmat després (ja no la té) o res (no se sap). L'editor només
   pinta «Publicat» amb un true. */
import { expect, test, vi } from 'vitest';
import { GlobalSaveManager } from './GlobalSaveManager.js';

const AMBIT = 'tenant:[t]_persona::u1_x';
function setup() {
  const records = new Map();
  const persist = async (key, transform) => {
    const result = transform(structuredClone(records.get(key) || {}));
    records.set(key, structuredClone(result));
    return result;
  };
  const manager = new GlobalSaveManager({ persist, delay: 60000, purga: async () => [] });
  let revisio = 4;
  const update = vi.fn(async (_id, cos) => ({ ...cos, revision: ++revisio }));
  const desa = async (camp, valor) => {
    const promesa = manager.enqueue(AMBIT, 'n', camp, valor, () => ({ revision: revisio }), update, vi.fn(), vi.fn());
    await manager.flush(AMBIT, 'n');
    return promesa;
  };
  return { manager, desa, revisio: () => revisio };
}

test('sense cap publicació vista, no se sap; un desat confirmat diu que el Mur ja no té la versió', async () => {
  const { manager, desa } = setup();
  expect(manager.versioAlMur(AMBIT, 'n', 4)).toBeNull();
  expect(await desa('title', 'Nou')).toBe(true);
  expect(manager.versioAlMur(AMBIT, 'n', 5)).toBe(false);
});

test('una publicació confirmada val per a la seua revisió i avisa; el pròxim desat la deixa enrere', async () => {
  const { manager, desa, revisio } = setup();
  const oient = vi.fn();
  manager.subscriu(oient);
  manager.marcaPublicada(AMBIT, 'n', 4);
  expect(oient).toHaveBeenCalled();
  expect(manager.versioAlMur(AMBIT, 'n', 4)).toBe(true);
  await desa('content', '<p>Cos nou</p>');
  // La vista encara pot portar la 4: la revisió coneguda de la cua mana.
  expect(manager.versioAlMur(AMBIT, 'n', 4)).toBe(false);
  manager.marcaPublicada(AMBIT, 'n', revisio());
  expect(manager.versioAlMur(AMBIT, 'n', revisio())).toBe(true);
});

test('una revisió que no és vàlida no marca res', () => {
  const { manager } = setup();
  manager.marcaPublicada(AMBIT, 'n', undefined);
  manager.marcaPublicada(AMBIT, 'n', -1);
  expect(manager.versioAlMur(AMBIT, 'n', 0)).toBeNull();
});

test('esborrar, retirar o oblidar la persona oblida també la versió del Mur', async () => {
  const { manager } = setup();
  for (const oblida of [
    () => manager.oblida(AMBIT, 'n'),
    () => manager.retira(AMBIT, 'n'),
    () => manager.oblidaUsuari('u1')
  ]) {
    manager.marcaPublicada(AMBIT, 'n', 4);
    expect(manager.versioAlMur(AMBIT, 'n', 4)).toBe(true);
    await oblida();
    expect(manager.versioAlMur(AMBIT, 'n', 4)).toBeNull();
  }
});
