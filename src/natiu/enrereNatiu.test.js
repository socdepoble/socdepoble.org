// @vitest-environment node
/* P0-24 (G2120-07, marató 261101_2143) · L'adaptador de l'Arrere d'Android:
   l'estat cap al natiu i la resposta al natiu. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { _reiniciaPilaEnrere, obriCapaEnrere } from '../config/pilaEnrere.js';
import { CONNECTOR_ENRERE, FUNCIO_ENRERE, METODE_ESTAT, connectaEnrereNatiu } from './enrereNatiu.js';

const microtasques = () => new Promise((r) => setTimeout(r, 0));
const finestraAmbPont = (nativePromise = vi.fn(() => Promise.resolve())) => ({ Capacitor: { nativePromise } });

afterEach(() => { _reiniciaPilaEnrere(); });

describe('connectaEnrereNatiu', () => {
  test('fora d’Android (iOS, web), sense pont o amb una pila incompleta: null i cap global', () => {
    const f = finestraAmbPont();
    expect(connectaEnrereNatiu({ plataforma: 'ios', finestra: f })).toBeNull();
    expect(connectaEnrereNatiu({ plataforma: 'web', finestra: f })).toBeNull();
    expect(connectaEnrereNatiu()).toBeNull();
    expect(connectaEnrereNatiu({ plataforma: 'android', finestra: {} })).toBeNull();
    expect(connectaEnrereNatiu({ plataforma: 'android', finestra: f, pila: { capesEnrereObertes: () => 0 } })).toBeNull();
    expect(FUNCIO_ENRERE in f).toBe(false);
    expect(f.Capacitor.nativePromise).not.toHaveBeenCalled();
  });

  test('informa el natiu de l’estat inicial i de cada canvi, agrupat per microtasca i sense repetir', async () => {
    const f = finestraAmbPont();
    const asa = connectaEnrereNatiu({ plataforma: 'android', finestra: f });
    await microtasques();
    expect(f.Capacitor.nativePromise).toHaveBeenCalledTimes(1);
    expect(f.Capacitor.nativePromise).toHaveBeenLastCalledWith(CONNECTOR_ENRERE, METODE_ESTAT, { capes: 0 });
    const llevaA = obriCapaEnrere(() => {});
    const llevaB = obriCapaEnrere(() => {});
    await microtasques();
    expect(f.Capacitor.nativePromise).toHaveBeenCalledTimes(2);
    expect(f.Capacitor.nativePromise).toHaveBeenLastCalledWith(CONNECTOR_ENRERE, METODE_ESTAT, { capes: 2 });
    // Obrir i tancar en el mateix tic: el nombre no canvia i el natiu no en sap res.
    obriCapaEnrere(() => {})();
    await microtasques();
    expect(f.Capacitor.nativePromise).toHaveBeenCalledTimes(2);
    llevaB(); llevaA();
    await microtasques();
    expect(f.Capacitor.nativePromise).toHaveBeenCalledTimes(3);
    expect(f.Capacitor.nativePromise).toHaveBeenLastCalledWith(CONNECTOR_ENRERE, METODE_ESTAT, { capes: 0 });
    asa.tanca();
    obriCapaEnrere(() => {});
    await microtasques();
    expect(f.Capacitor.nativePromise).toHaveBeenCalledTimes(3);
  });

  test('la funció global tanca la capa de dalt i diu true; amb la pila buida, false (el natiu navega)', () => {
    const f = finestraAmbPont();
    connectaEnrereNatiu({ plataforma: 'android', finestra: f });
    expect(Object.getOwnPropertyDescriptor(f, FUNCIO_ENRERE).enumerable).toBe(false);
    expect(f[FUNCIO_ENRERE]()).toBe(false);
    const tancaA = vi.fn();
    const tancaB = vi.fn();
    obriCapaEnrere(tancaA);
    obriCapaEnrere(tancaB);
    expect(f[FUNCIO_ENRERE]()).toBe(true);
    expect(tancaB).toHaveBeenCalledTimes(1);
    expect(tancaA).not.toHaveBeenCalled();
  });

  test('una pila que llança no tomba la resposta: false (el natiu fa el camí per defecte)', () => {
    const f = finestraAmbPont();
    const pila = {
      capesEnrereObertes: () => 1,
      escoltaCapesEnrere: () => () => {},
      tancaCapaSuperior: () => { throw new Error('trencada'); }
    };
    connectaEnrereNatiu({ plataforma: 'android', finestra: f, pila });
    expect(f[FUNCIO_ENRERE]()).toBe(false);
  });

  /* Corrector 261102 (ARB-B3B-02) · El nombre NO canvia (0 → 0): només el
     reintent explica el segon enviament. */
  test('un estat rebutjat es torna a enviar en el canvi següent encara que el nombre siga el mateix', async () => {
    let crides = 0;
    const nativePromise = vi.fn(() => (crides++ === 0 ? Promise.reject(new Error('encara no')) : Promise.resolve()));
    const f = finestraAmbPont(nativePromise);
    connectaEnrereNatiu({ plataforma: 'android', finestra: f });
    await microtasques();
    expect(nativePromise).toHaveBeenCalledTimes(1);
    // Obrir i tancar en el mateix tic: avisa, però el nombre torna a ser 0.
    obriCapaEnrere(() => {})();
    await microtasques();
    expect(nativePromise).toHaveBeenCalledTimes(2);
    expect(nativePromise).toHaveBeenLastCalledWith(CONNECTOR_ENRERE, METODE_ESTAT, { capes: 0 });
    // Ara el 0 sí que ha arribat: el mateix gest ja no el repetix.
    obriCapaEnrere(() => {})();
    await microtasques();
    expect(nativePromise).toHaveBeenCalledTimes(2);
  });

  test('un pont que sempre rebutja no deixa cap rebuig sense amo', async () => {
    const nativePromise = vi.fn(() => Promise.reject(new Error('sense connector')));
    const f = finestraAmbPont(nativePromise);
    connectaEnrereNatiu({ plataforma: 'android', finestra: f });
    await microtasques();
    const lleva = obriCapaEnrere(() => {});
    await microtasques();
    lleva();
    await microtasques();
    expect(nativePromise).toHaveBeenCalledTimes(3);
    expect(nativePromise).toHaveBeenLastCalledWith(CONNECTOR_ENRERE, METODE_ESTAT, { capes: 0 });
  });

  test('un pont que llança de manera síncrona tampoc tomba res', async () => {
    const nativePromise = vi.fn(() => { throw new Error('pont mort'); });
    const f = finestraAmbPont(nativePromise);
    expect(connectaEnrereNatiu({ plataforma: 'android', finestra: f })).not.toBeNull();
    await microtasques();
    expect(nativePromise).toHaveBeenCalledTimes(1);
  });

  test('tanca() lleva la global només si encara és la seua i deixa de respondre', () => {
    const f = finestraAmbPont();
    const vella = connectaEnrereNatiu({ plataforma: 'android', finestra: f });
    const respostaVella = f[FUNCIO_ENRERE];
    const nova = connectaEnrereNatiu({ plataforma: 'android', finestra: f });
    vella.tanca();
    expect(typeof f[FUNCIO_ENRERE]).toBe('function');
    obriCapaEnrere(() => {});
    expect(respostaVella()).toBe(false);
    nova.tanca();
    expect(FUNCIO_ENRERE in f).toBe(false);
  });
});
