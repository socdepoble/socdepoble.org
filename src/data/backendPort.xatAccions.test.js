// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';

let port;
let contracte;
const metodes = ['carregaAccionsMissatges', 'alternaReaccio', 'alternaDestacat', 'alternaFixat', 'eliminaPerAMi', 'eliminaPerATothom'];
beforeEach(async () => {
  vi.resetModules();
  port = await import('./backendPort.js');
  contracte = await import('./contracte.js');
});
const nucli = () => Object.fromEntries(contracte.CONTRACTE_NUCLI.map((nom) => [nom, () => nom]));
const grup = () => Object.fromEntries(metodes.map((nom) => [nom, () => null]));

test('un backend antic conserva el nucli i no anuncia interaccions absents', () => {
  port.setBackendImplementation(nucli());
  expect(contracte.CONTRACTE_NUCLI).toHaveLength(32);
  expect(port.teCapacitat('xatAccionsMissatge')).toBe(false);
  for (const nom of metodes) {
    expect(contracte.CONTRACTE_NUCLI).not.toContain(nom);
    expect(() => port[nom]({})).toThrow('no està implementat');
  }
});

test.each(metodes)('el grup parcial sense %s es rebutja abans de substituir el backend', (absent) => {
  port.setBackendImplementation(nucli());
  const abans = port.getBackendImplementation();
  const parcial = grup();
  delete parcial[absent];
  expect(() => port.setBackendImplementation({ ...nucli(), ...parcial })).toThrow('Capacitat parcial: xatAccionsMissatge');
  expect(port.getBackendImplementation()).toBe(abans);
});

test.each(metodes)('%s conserva receptor, config, promesa i error sense fallback local al port', async (nom) => {
  const input = Object.freeze({ filId: 'fil', missatgeId: 'missatge', actiu: true });
  const config = Object.freeze({ signal: new AbortController().signal });
  const resposta = { origen: 'remot', missatgeId: 'missatge' };
  const error = Object.assign(new Error('denegat'), { code: '42501' });
  const promesa = Promise.resolve(resposta);
  const backend = { ...nucli(), ...grup(), observat: null, [nom](a, b) { this.observat = [a, b]; return promesa; } };
  port.setBackendImplementation(backend);
  expect(port.teCapacitat('xatAccionsMissatge')).toBe(true);
  expect(port[nom](input, config)).toBe(promesa);
  expect(await promesa).toBe(resposta);
  expect(backend.observat[0]).toBe(input);
  expect(backend.observat[1]).toBe(config);
  port.setBackendImplementation({ ...nucli(), ...grup(), [nom]: () => Promise.reject(error) });
  await expect(port[nom](input, config)).rejects.toBe(error);
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('xatAccionsMissatge')).toBe(false);
});
