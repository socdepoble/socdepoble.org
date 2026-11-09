// @vitest-environment node
import { expect, test, vi } from 'vitest';
test('una confirmació-zero no passa d’A a B ni d’una generació anterior', async () => {
  vi.resetModules();
  await import('./motorAvisosPushXat.js');
  const push = await import('./avisosPushXat.js');
  const confirmaLectura = vi.fn(async () => {});
  push.registraAvisosPush({ tipus: 'web', motiu: () => null, estat: async () => ({ estat: 'actiu' }), activa: async () => ({ estat: 'actiu' }), desactiva: async () => ({ estat: 'inactiu' }), sincronitza: async () => ({ estat: 'actiu' }), neteja: async () => {}, oblida() {}, escoltaToc: () => () => {}, capturaLectura: () => 'worker-wake-a', confirmaLectura });
  expect(push.capturaLecturaAvisosPush('a')).toBe(null);
  const server = id => ({ ambit: id, desa: async () => {}, retira: async () => {} });
  push.fixaServidorAvisosPush(server('a'));
  const reading = push.capturaLecturaAvisosPush('a');
  expect(reading.marca).toBe('worker-wake-a');
  expect(push.capturaLecturaAvisosPush('b')).toBe(null);
  push.fixaServidorAvisosPush(server('b'));
  await push.confirmaZeroAvisosPush(reading);
  expect(confirmaLectura).not.toHaveBeenCalled();
  const current = push.capturaLecturaAvisosPush('b');
  await push.confirmaZeroAvisosPush(current);
  expect(confirmaLectura).toHaveBeenCalledWith('worker-wake-a');
  push.fixaServidorAvisosPush(null);
  await push.confirmaZeroAvisosPush(current);
  expect(confirmaLectura).toHaveBeenCalledTimes(1);
});
