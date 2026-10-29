// @vitest-environment node
/* T7-P1: noms i agrupació de disseny_final_e2ee.md §8.3. Només contracte i
   delegació opaca: cap RPC, criptografia, adaptador real o activació del xat. */
import { beforeEach, describe, expect, test, vi } from 'vitest';

const ESPERADES = Object.freeze({
  clausXat: ['publicaIdentitatXat', 'laMevaIdentitatXat', 'desaFraseXat', 'clausDeXat', 'desaLlibretaXat', 'laMevaLlibretaXat',
    'estatXifratXat', 'epoquesDelFilXat', 'sobresMeusXat', 'obriEpocaXat', 'enviaXifratXat', 'reembolcallaXat', 'demanaXifratXat'],
  xatMultimediaXifrat: ['publicaAdjuntXifratXat', 'bytesAdjuntXat']
});
const CASOS = Object.entries(ESPERADES).flatMap(([cap, noms]) => noms.map((nom) => ({ cap, nom })));
let port; let contracte;
beforeEach(async () => {
  vi.resetModules();
  port = await import('./backendPort.js');
  contracte = await import('./contracte.js');
});
const nucli = () => Object.fromEntries(contracte.CONTRACTE_NUCLI.map((nom) => [nom, () => nom]));
const grup = (cap) => Object.fromEntries(ESPERADES[cap].map((nom) => [nom, () => nom]));

describe('T7-P1 · capacitats E2EE opcionals del port', () => {
  test('els dos grups són exactes, congelats i fora del nucli', () => {
    for (const [cap, noms] of Object.entries(ESPERADES)) {
      expect(contracte.CAPACITATS[cap]).toEqual(noms);
      expect(Object.isFrozen(contracte.CAPACITATS[cap])).toBe(true);
      for (const nom of noms) {
        expect(contracte.CONTRACTE_NUCLI).not.toContain(nom);
        expect(contracte.CONTRACTE_BACKEND.filter((n) => n === nom)).toHaveLength(1);
        expect(typeof port[nom], nom).toBe('function');
      }
    }
  });

  test('un backend antic continua vàlid: no anuncia ni fabrica capacitats E2EE', () => {
    const antic = nucli();
    const text = { id: 'prova', text: 'Camí anterior' };
    antic.enviaMissatge = vi.fn(() => text);
    port.setBackendImplementation(antic);
    const abans = port.getBackendImplementation();
    expect(port.enviaMissatge('fil', text, { mode: 'local' })).toBe(text);
    expect(antic.enviaMissatge).toHaveBeenCalledOnce();
    for (const [cap, noms] of Object.entries(ESPERADES)) {
      expect(port.teCapacitat(cap)).toBe(false);
      for (const nom of noms) {
        expect(Object.hasOwn(abans, nom)).toBe(false);
        expect(typeof port[nom]).toBe('function');
        expect(() => port[nom]()).toThrow('no està implementat');
      }
    }
    expect(Object.isFrozen(abans)).toBe(true);
  });

  test('substituir un backend amb E2EE per un d’antic retira capacitats i delegats anteriors', () => {
    const transport = vi.fn();
    port.setBackendImplementation({ ...nucli(), ...grup('clausXat'), ...grup('xatMultimediaXifrat'), enviaXifratXat: transport });
    expect(port.teCapacitat('clausXat')).toBe(true);
    expect(port.teCapacitat('xatMultimediaXifrat')).toBe(true);
    port.setBackendImplementation(nucli());
    expect(port.teCapacitat('clausXat')).toBe(false);
    expect(port.teCapacitat('xatMultimediaXifrat')).toBe(false);
    expect(() => port.enviaXifratXat()).toThrow('no està implementat');
    expect(() => port.bytesAdjuntXat()).toThrow('no està implementat');
    expect(transport).not.toHaveBeenCalled();
  });

  test.each(CASOS)('$cap incompleta sense $nom rebutja atòmicament i conserva el backend anterior', ({ cap, nom }) => {
    port.setBackendImplementation(nucli());
    const abans = port.getBackendImplementation();
    const parcial = grup(cap);
    delete parcial[nom];
    expect(() => port.setBackendImplementation({ ...nucli(), ...parcial })).toThrow(`Capacitat parcial: ${cap}`);
    expect(port.getBackendImplementation()).toBe(abans);
    expect(port.teCapacitat(cap)).toBe(false);
    expect(port.enviaMissatge()).toBe('enviaMissatge');
  });

  test.each(CASOS)('$nom conserva receptor heretat, arguments, promesa i resultat sense transformar-los', async ({ cap, nom }) => {
    const resultat = { opac: Uint8Array.of(1, 2, 3) };
    const promesa = Promise.resolve(resultat);
    const prototip = {
      ...grup(cap),
      [nom](...args) { this.crides.push(args); return promesa; }
    };
    const impl = Object.assign(Object.create(prototip), nucli(), { crides: [] });
    const primer = { bytes: Uint8Array.of(7, 8) };
    const segon = Object.freeze({ id: 'config-sintetica' });
    const tercer = { renova: true };
    port.setBackendImplementation(impl);
    expect(port.teCapacitat(cap)).toBe(true);
    for (const altre of Object.keys(ESPERADES).filter((c) => c !== cap)) expect(port.teCapacitat(altre)).toBe(false);
    const rebut = port[nom](primer, segon, tercer);
    expect(rebut).toBe(promesa);
    expect(await rebut).toBe(resultat);
    expect(impl.crides).toHaveLength(1);
    expect(impl.crides[0][0]).toBe(primer);
    expect(impl.crides[0][1]).toBe(segon);
    expect(impl.crides[0][2]).toBe(tercer);
  });

  test.each(Object.keys(ESPERADES))('%s rebutja un getter sense executar-lo', (cap) => {
    const impl = { ...nucli(), ...grup(cap) };
    const getter = vi.fn(() => { throw new Error('No s’ha d’executar.'); });
    Object.defineProperty(impl, ESPERADES[cap][0], { get: getter, enumerable: true });
    expect(() => port.validaBackendImplementation(impl)).toThrow('ha de ser un mètode');
    expect(getter).not.toHaveBeenCalled();
  });

  test('els errors síncrons i asíncrons del transport conserven la mateixa instància', async () => {
    const sincron = Object.assign(new Error('sintètic'), { code: 'PROVA-SYNC' });
    const asincron = Object.assign(new Error('sintètic'), { code: 'PROVA-ASYNC' });
    port.setBackendImplementation({ ...nucli(), ...grup('clausXat'),
      estatXifratXat: () => { throw sincron; }, enviaXifratXat: () => Promise.reject(asincron) });
    let rebut;
    try { port.estatXifratXat(); } catch (error) { rebut = error; }
    expect(rebut).toBe(sincron);
    await expect(port.enviaXifratXat()).rejects.toBe(asincron);
  });

  test('el servei fixaAmbit i un helper desconegut no es convertixen en transport del backend', () => {
    const impl = { ...nucli(), ...grup('clausXat'), fixaAmbit: vi.fn(), helperInventat: vi.fn() };
    const { candidate } = port.validaBackendImplementation(impl);
    expect(Object.hasOwn(candidate, 'fixaAmbit')).toBe(false);
    expect(Object.hasOwn(candidate, 'helperInventat')).toBe(false);
    expect(contracte.CONTRACTE_BACKEND).not.toContain('fixaAmbit');
    expect(contracte.CONTRACTE_BACKEND).not.toContain('helperInventat');
    expect(impl.fixaAmbit).not.toHaveBeenCalled();
  });
});
