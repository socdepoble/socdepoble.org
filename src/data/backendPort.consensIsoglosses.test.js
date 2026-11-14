// @vitest-environment node
/* R24 · CODEX-R24-03 · El contracte del port per al consens del joc «D'on parles?»
   (JocDonParlesCard.jsx). La targeta crida getBackendImplementation() i mira si hi ha
   lligConsensIsoglossesPoble, votaVariantIsoglossaPoble i desaAportacioVeuPoble. El port
   només copia al backend segellat els noms de CONTRACTE_BACKEND (validaBackendImplementation):
   fins a R24 cap adaptador no podia fer-los arribar a la targeta, ni encara que els tinguera.
   Ara són una capacitat OPCIONAL completa ('consensIsoglosses'): tres o cap, mai a mitges, i
   fora del nucli de 32 mètodes. Cap adaptador real, cap xarxa. */
import { beforeEach, describe, expect, test, vi } from 'vitest';

const METODES = Object.freeze(['lligConsensIsoglossesPoble', 'votaVariantIsoglossaPoble', 'desaAportacioVeuPoble']);
let port; let contracte;
beforeEach(async () => {
  vi.resetModules();
  port = await import('./backendPort.js');
  contracte = await import('./contracte.js');
});
const nucli = () => Object.fromEntries(contracte.CONTRACTE_NUCLI.map((nom) => [nom, () => nom]));

describe('R24 · capacitat opcional consensIsoglosses del port neutral', () => {
  test('el grup és exacte, congelat, fora del nucli i delegat pel port', () => {
    expect(contracte.CAPACITATS.consensIsoglosses).toEqual(METODES);
    expect(Object.isFrozen(contracte.CAPACITATS.consensIsoglosses)).toBe(true);
    expect(contracte.CONTRACTE_NUCLI).toHaveLength(32);
    for (const nom of METODES) {
      expect(contracte.CONTRACTE_NUCLI).not.toContain(nom);
      expect(contracte.CONTRACTE_BACKEND.filter((n) => n === nom)).toHaveLength(1);
      expect(typeof port[nom], nom).toBe('function');
    }
  });

  test('un adaptador amb les tres les fa arribar al backend segellat que llig la targeta', async () => {
    const impl = { ...nucli(),
      lligConsensIsoglossesPoble: vi.fn(async () => [{ preguntaId: 'q01_creilla', variantClau: 'querilla', paraula: 'Querilla', poble: null, comarcaId: null, vots: 2 }]),
      votaVariantIsoglossaPoble: vi.fn(async (v) => ({ preguntaId: v.preguntaId, variantClau: v.variantClau, nou: true })),
      desaAportacioVeuPoble: vi.fn(async () => ({ id: '10000000-0000-4000-8000-000000000001', estatModeracio: 'pendent', creatA: '2026-11-14T06:00:00.000Z' }))
    };
    port.setBackendImplementation(impl);
    expect(port.teCapacitat('consensIsoglosses')).toBe(true);
    const segellat = port.getBackendImplementation();
    for (const nom of METODES) expect(typeof segellat[nom], nom).toBe('function');
    /* La mateixa forma de crida que la targeta (JocDonParlesCard.jsx). */
    await expect(segellat.lligConsensIsoglossesPoble()).resolves.toHaveLength(1);
    const vot = { preguntaId: 'q01_creilla', variantClau: 'querilla', paraulaEtiqueta: 'Querilla', poble: '', comarcaId: '', abastComarcal: 'no_ho_se' };
    await expect(port.votaVariantIsoglossaPoble(vot)).resolves.toMatchObject({ nou: true });
    expect(impl.votaVariantIsoglossaPoble).toHaveBeenCalledWith(vot);
    await expect(port.desaAportacioVeuPoble({ tipus: 'variant_isoglossa' })).resolves.toMatchObject({ estatModeracio: 'pendent' });
  });

  test('una capacitat a mitges tomba la validació; cap mètode vell sobreviu', () => {
    const parcial = { ...nucli(), lligConsensIsoglossesPoble: async () => [], votaVariantIsoglossaPoble: async () => ({}) };
    expect(() => port.validaBackendImplementation(parcial)).toThrow('Capacitat parcial: consensIsoglosses');
  });

  test('sense la capacitat, el backend continua vàlid i la targeta no hi troba res (mode local honest)', () => {
    port.setBackendImplementation(nucli());
    expect(port.teCapacitat('consensIsoglosses')).toBe(false);
    const segellat = port.getBackendImplementation();
    for (const nom of METODES) expect(segellat[nom], nom).toBeUndefined();
    expect(() => port.votaVariantIsoglossaPoble({})).toThrow('no està implementat');
  });

  test('una capacitat apagada en compilar (export undefined) és absent, no un error', () => {
    const apagada = { ...nucli(), ...Object.fromEntries(METODES.map((nom) => [nom, undefined])) };
    expect(() => port.setBackendImplementation(apagada)).not.toThrow();
    expect(port.teCapacitat('consensIsoglosses')).toBe(false);
  });
});
