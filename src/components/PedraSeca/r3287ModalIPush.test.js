/**
 * r3287ModalIPush.test.js — Verificació quirúrgica Lot 3 (Peix 2 i Peix 4 · R32.87):
 *   1. modalLocal.js: ordenació estable sense NaN (`Infinity - Infinity`) per tabIndex 0.
 *   2. avisosPushNatius.js: guàrdia simètrica en iOS contra events `registration` tardans.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { obriModalLocal } from './organismes/modalLocal.js';
import { creaAvisosPushNatius } from '../../natiu/avisosPushNatius.js';

describe('R32.87 Lot 3 · modalLocal i avisosPushNatius iOS', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('modalLocal manté l’ordre de focus sense NaN entre controls amb tabIndex 0 i positius', () => {
    const arrel = document.createElement('div');
    arrel.className = 'sdp-root';
    const capa = document.createElement('div');
    const dialeg = document.createElement('dialog');
    dialeg.setAttribute('open', '');
    const b1 = document.createElement('button');
    b1.textContent = 'Primer 0';
    const b2 = document.createElement('button');
    b2.textContent = 'Prioritari 1';
    b2.tabIndex = 1;
    const b3 = document.createElement('button');
    b3.textContent = 'Segon 0';
    dialeg.append(b1, b2, b3);
    capa.append(dialeg);
    arrel.append(capa);
    document.body.append(arrel);

    const tanca = obriModalLocal(dialeg, () => {});
    try {
      expect(document.activeElement).toBe(b2);
    } finally {
      tanca();
      arrel.remove();
    }
  });

  it('avisosPushNatius en iOS ignora un event registration quan el dispositiu no està registrat', async () => {
    vi.stubEnv('VITE_SDP_PUSH_NATIU', '1');
    let regCb = null;
    const pushPlugin = {
      checkPermissions: vi.fn(async () => ({ receive: 'granted' })),
      requestPermissions: vi.fn(async () => ({ receive: 'granted' })),
      register: vi.fn(async () => {}),
      unregister: vi.fn(async () => {}),
      addListener: vi.fn(async (ev, cb) => {
        if (ev === 'registration') regCb = cb;
        return { remove: vi.fn(async () => {}) };
      }),
      removeAllListeners: vi.fn(async () => {}),
    };
    const nucli = {
      Capacitor: {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
        isPluginAvailable: (nom) => nom === 'PushNotifications',
      },
      registerPlugin: () => pushPlugin,
    };

    const avisos = creaAvisosPushNatius({ nucli });
    const rebuts = [];
    const talla = avisos.escoltaRegistre((d) => rebuts.push(d));
    await Promise.resolve();

    expect(typeof regCb).toBe('function');
    // Event tardà o espuri sense haver completat register(): ha de quedar filtrat també en iOS
    await regCb({ value: 'token-ios-espuri' });
    expect(rebuts).toEqual([]);
    talla();
  });
});
