// @vitest-environment node
/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · D'on ve l'App: la classificació de la
   resposta dels connectors natius (OrigenInstallacioPlugin.java i el de ControladorSdp.swift) i la
   consulta pel pont de Capacitor, amb tall. Cap Capacitor de veres: un pont simulat. */
import { describe, expect, test, vi } from 'vitest';
import {
  CONNECTOR_ORIGEN,
  INSTALADORS_PLAY,
  METODE_ORIGEN,
  ORIGENS,
  classificaOrigen,
  consultaOrigenInstallacio
} from './origenInstallacio.js';

describe('classificaOrigen', () => {
  test('Android: Google Play, instal·lació directa i el que no s\'entén', () => {
    expect(INSTALADORS_PLAY).toEqual(['com.android.vending', 'com.google.android.feedback']);
    for (const instalador of INSTALADORS_PLAY) expect(classificaOrigen('android', { llegit: true, instalador })).toBe(ORIGENS.PLAY);
    for (const instalador of ['com.google.android.packageinstaller', 'com.android.packageinstaller', 'com.android.chrome', 'org.mozilla.firefox', undefined, null, '']) {
      expect(classificaOrigen('android', { llegit: true, instalador }), String(instalador)).toBe(ORIGENS.DIRECTA);
    }
    for (const resposta of [
      { llegit: false }, { instalador: 'com.android.vending' }, { llegit: 'true', instalador: 'com.android.vending' },
      { llegit: true, instalador: 7 }, { llegit: true, instalador: 'no és un paquet' }, { llegit: true, instalador: `a.${'b'.repeat(300)}` },
      null, undefined, [], 'com.android.vending'
    ]) expect(classificaOrigen('android', resposta), JSON.stringify(resposta)).toBe(ORIGENS.DESCONEGUT);
  });

  test('iOS: el nom del rebut diu TestFlight o l\'App Store; qualsevol altra cosa, desconegut', () => {
    expect(classificaOrigen('ios', { llegit: true, rebut: 'sandboxReceipt' })).toBe(ORIGENS.TESTFLIGHT);
    expect(classificaOrigen('ios', { llegit: true, rebut: 'receipt' })).toBe(ORIGENS.APP_STORE);
    for (const resposta of [{ llegit: true, rebut: '' }, { llegit: true }, { llegit: false, rebut: 'receipt' }, { llegit: true, rebut: 'Receipt' }, null]) {
      expect(classificaOrigen('ios', resposta), JSON.stringify(resposta)).toBe(ORIGENS.DESCONEGUT);
    }
    // Cap plataforma més: la web i el connector no tenen origen.
    expect(classificaOrigen('web', { llegit: true, instalador: 'com.android.vending' })).toBe(ORIGENS.DESCONEGUT);
  });
});

describe('consultaOrigenInstallacio', () => {
  const finestraAmb = (nativePromise) => ({ Capacitor: { nativePromise } });

  test('pregunta al connector «OrigenInstallacio».consulta i classifica la resposta', async () => {
    const nativePromise = vi.fn(async () => ({ llegit: true, instalador: 'com.google.android.packageinstaller' }));
    await expect(consultaOrigenInstallacio({ plataforma: 'android', finestra: finestraAmb(nativePromise) })).resolves.toBe(ORIGENS.DIRECTA);
    expect(nativePromise).toHaveBeenCalledWith(CONNECTOR_ORIGEN, METODE_ORIGEN, {});
    const ios = vi.fn(async () => ({ llegit: true, rebut: 'sandboxReceipt' }));
    await expect(consultaOrigenInstallacio({ plataforma: 'ios', finestra: finestraAmb(ios) })).resolves.toBe(ORIGENS.TESTFLIGHT);
  });

  test('sense pont, fora d\'Android i iOS, amb un connector que no existix (un binari d\'abans) o que llança: desconegut', async () => {
    const pregunta = vi.fn(async () => ({ llegit: true, rebut: 'receipt' }));
    await expect(consultaOrigenInstallacio({ plataforma: 'web', finestra: finestraAmb(pregunta) })).resolves.toBe(ORIGENS.DESCONEGUT);
    expect(pregunta).not.toHaveBeenCalled();
    await expect(consultaOrigenInstallacio({ plataforma: 'ios', finestra: {} })).resolves.toBe(ORIGENS.DESCONEGUT);
    await expect(consultaOrigenInstallacio({ plataforma: 'ios', finestra: null })).resolves.toBe(ORIGENS.DESCONEGUT);
    const noImplementat = vi.fn(async () => { throw Object.assign(new Error('"OrigenInstallacio" plugin is not implemented on ios'), { code: 'UNIMPLEMENTED' }); });
    await expect(consultaOrigenInstallacio({ plataforma: 'ios', finestra: finestraAmb(noImplementat) })).resolves.toBe(ORIGENS.DESCONEGUT);
    const sincron = vi.fn(() => { throw new Error('pont trencat'); });
    await expect(consultaOrigenInstallacio({ plataforma: 'android', finestra: finestraAmb(sincron) })).resolves.toBe(ORIGENS.DESCONEGUT);
    const ambGetter = { get Capacitor() { throw new Error('accés vetat'); } };
    await expect(consultaOrigenInstallacio({ plataforma: 'android', finestra: ambGetter })).resolves.toBe(ORIGENS.DESCONEGUT);
  });

  test('una promesa del pont que no torna mai (Capacitor gotchas 261026): el tall diu desconegut', async () => {
    const penjada = vi.fn(() => new Promise(() => {}));
    const inici = Date.now();
    await expect(consultaOrigenInstallacio({ plataforma: 'ios', finestra: finestraAmb(penjada), tempsMaxim: 10 })).resolves.toBe(ORIGENS.DESCONEGUT);
    expect(Date.now() - inici).toBeLessThan(2000);
  });
});
