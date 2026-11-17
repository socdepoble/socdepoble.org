// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const METODES = Object.freeze(['registraDenunciaPublica', 'adminSafataDenuncies', 'adminRevisaDenuncia']);
let port;
let contracte;
beforeEach(async () => {
  vi.resetModules();
  port = await import('./backendPort.js');
  contracte = await import('./contracte.js');
});
afterEach(() => port.destroy());
const nucli = () => Object.fromEntries(contracte.CONTRACTE_NUCLI.map(nom => [nom, () => nom]));

describe('R32.5 · moderacioLssi és opcional i completa al port neutral', () => {
  test('tres mètodes exactes, congelats, delegats i fora del nucli', () => {
    expect(contracte.CAPACITATS.moderacioLssi).toEqual(METODES);
    expect(Object.isFrozen(contracte.CAPACITATS.moderacioLssi)).toBe(true);
    expect(contracte.CONTRACTE_NUCLI).toHaveLength(32);
    for (const nom of METODES) {
      expect(contracte.CONTRACTE_NUCLI).not.toContain(nom);
      expect(contracte.CONTRACTE_BACKEND.filter(metode => metode === nom)).toHaveLength(1);
      expect(typeof port[nom]).toBe('function');
    }
  });

  test('delega les tres crides amb arguments i context intactes', async () => {
    const impl = nucli();
    for (const nom of METODES) impl[nom] = vi.fn(async function (...args) { return { nom, args, contextCorrecte: this === impl }; });
    port.setBackendImplementation(impl);
    expect(port.teCapacitat('moderacioLssi')).toBe(true);
    const config = Object.freeze({ backendId: 'node-prova', tenantId: 'poble-prova' });
    const peticions = [
      { publicacioId: '10000000-0000-4000-8000-000000000001', motiu: 'illegal', detall: 'Revisió humana' },
      { estat: 'pendent', limit: 20 },
      { id: '10000000-0000-4000-8000-000000000002', decisio: 'revisada', justificacio: 'Revisió completada', estatEsperat: 'pendent' }
    ];
    for (const [index, nom] of METODES.entries()) {
      await expect(port[nom](peticions[index], config)).resolves.toEqual({ nom, args: [peticions[index], config], contextCorrecte: true });
      expect(impl[nom]).toHaveBeenCalledExactlyOnceWith(peticions[index], config);
      expect(typeof port.getBackendImplementation()[nom]).toBe('function');
    }
  });

  test.each([1, 2, 3, 4, 5, 6])('rebutja qualsevol subconjunt parcial (%i) sense perdre el backend anterior', mascara => {
    const anterior = nucli();
    port.setBackendImplementation(anterior);
    const segellat = port.getBackendImplementation();
    const parcial = nucli();
    for (const [index, nom] of METODES.entries()) if (mascara & (1 << index)) parcial[nom] = vi.fn();
    expect(() => port.setBackendImplementation(parcial)).toThrow('Capacitat parcial: moderacioLssi');
    expect(port.getBackendImplementation()).toBe(segellat);
    expect(port.teCapacitat('moderacioLssi')).toBe(false);
  });

  test('un backend sense el grup és vàlid i rebutja crides sense simular denúncies', () => {
    port.setBackendImplementation(nucli());
    expect(port.teCapacitat('moderacioLssi')).toBe(false);
    for (const nom of METODES) {
      expect(port.getBackendImplementation()[nom]).toBeUndefined();
      expect(() => port[nom]({})).toThrow('no està implementat');
    }
  });

  test('substituir un backend complet per un d’absent no conserva mètodes antics', () => {
    port.setBackendImplementation({ ...nucli(), ...Object.fromEntries(METODES.map(nom => [nom, vi.fn()])) });
    expect(port.teCapacitat('moderacioLssi')).toBe(true);
    port.setBackendImplementation(nucli());
    expect(port.teCapacitat('moderacioLssi')).toBe(false);
    for (const nom of METODES) expect(port.getBackendImplementation()[nom]).toBeUndefined();
  });

  test('exports apagats undefined representen absència completa', () => {
    const apagada = { ...nucli(), ...Object.fromEntries(METODES.map(nom => [nom, undefined])) };
    expect(() => port.setBackendImplementation(apagada)).not.toThrow();
    expect(port.teCapacitat('moderacioLssi')).toBe(false);
  });
});
