/**
 * BarraActualitzacioRecomanada.test.jsx — Proves unitàries de la barra suau i
 * no bloquejant d'actualització d'apps natives (`versioRecomanada`) (Onada R22 · T2).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const ui = vi.hoisted(() => ({ t: (_clau, reserva) => reserva }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActionsOpcional: () => ({ t: (...args) => ui.t(...args) })
}));

import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import {
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE,
  descartaActualitzacioRecomanada,
  llegixActualitzacioRecomanada,
  netejaActualitzacioRecomanadaPerProves,
  obriBotigaActualitzacio,
  publicaActualitzacioRecomanada
} from '../../../config/actualitzacioRecomanada.js';
import { bloqueigDeVersio, estatDeVersio } from '../../../natiu/versioMinima.js';
import BarraActualitzacioRecomanada from './BarraActualitzacioRecomanada.jsx';

beforeEach(() => {
  ui.t = (_clau, reserva) => reserva;
  netejaActualitzacioRecomanadaPerProves();
});

afterEach(() => {
  netejaActualitzacioRecomanadaPerProves();
  cleanup();
});

describe('estatDeVersio', () => {
  test('estatDeVersio distingix bloquejada (< versioMinima), recomanada (< versioRecomanada) i al dia (null)', async () => {
    const portBloquejat = {
      teCapacitat: () => true,
      versioMinimaClient: async () => ({ versioMinima: 6, versioRecomanada: 7, enllac: ENLLAC_ANDROID_PLAY })
    };
    expect(await estatDeVersio({ plataforma: 'android', versio: 5, port: portBloquejat })).toEqual({
      estat: 'bloquejada',
      versioMinima: 6,
      enllac: ENLLAC_ANDROID_PLAY
    });
    expect(await bloqueigDeVersio({ plataforma: 'android', versio: 5, port: portBloquejat })).toEqual({
      versioMinima: 6,
      enllac: ENLLAC_ANDROID_PLAY
    });

    const portRecomanat = {
      teCapacitat: () => true,
      versioMinimaClient: async () => ({ versioMinima: 2, versioRecomanada: 6, enllac: null })
    };
    expect(await estatDeVersio({ plataforma: 'android', versio: 5, port: portRecomanat })).toEqual({
      estat: 'recomanada',
      plataforma: 'android',
      versioRecomanada: 6,
      enllac: ENLLAC_ANDROID_PLAY,
      marketUrl: ENLLAC_ANDROID_MARKET
    });
    expect(await bloqueigDeVersio({ plataforma: 'android', versio: 5, port: portRecomanat })).toBeNull();

    const portSenseRecomanada = {
      teCapacitat: () => true,
      versioMinimaClient: async () => ({ versioMinima: 2, enllac: null })
    };
    expect(await estatDeVersio({
      plataforma: 'ios',
      versio: 5,
      port: portSenseRecomanada,
      fontViva: async () => ({ versioRecomanada: 7, canals: { ios: { enllac: ENLLAC_IOS_APP_STORE } } })
    })).toEqual({
      estat: 'recomanada',
      plataforma: 'ios',
      versioRecomanada: 7,
      enllac: ENLLAC_IOS_APP_STORE,
      marketUrl: null
    });

    expect(await estatDeVersio({
      plataforma: 'ios',
      versio: 7,
      port: portSenseRecomanada,
      fontViva: async () => ({ versioRecomanada: 7 })
    })).toBeNull();
  });
});

describe('actualitzacioRecomanada i BarraActualitzacioRecomanada', () => {
  test('ajorna per versió i torna a aparéixer quan la versioRecomanada puja', () => {
    publicaActualitzacioRecomanada({
      plataforma: 'android',
      versioRecomanada: 6,
      enllac: ENLLAC_ANDROID_PLAY,
      marketUrl: ENLLAC_ANDROID_MARKET
    });
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(6);

    descartaActualitzacioRecomanada();
    expect(llegixActualitzacioRecomanada()).toBeNull();

    publicaActualitzacioRecomanada({
      plataforma: 'android',
      versioRecomanada: 6,
      enllac: ENLLAC_ANDROID_PLAY,
      marketUrl: ENLLAC_ANDROID_MARKET
    });
    expect(llegixActualitzacioRecomanada()).toBeNull();

    publicaActualitzacioRecomanada({
      plataforma: 'android',
      versioRecomanada: 7,
      enllac: ENLLAC_ANDROID_PLAY,
      marketUrl: ENLLAC_ANDROID_MARKET
    });
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(7);
  });

  test('renderitza en valencià i castellà per a Android i iOS, obri una sola botiga (https) i s’amaga en descartar', () => {
    const { container, rerender } = render(<BarraActualitzacioRecomanada />);
    expect(container.firstChild).toBeNull();

    ui.t = (clau, reserva) => CA[clau] ?? reserva;
    publicaActualitzacioRecomanada({
      plataforma: 'android',
      versioRecomanada: 6,
      enllac: ENLLAC_ANDROID_PLAY,
      marketUrl: ENLLAC_ANDROID_MARKET
    });
    rerender(<BarraActualitzacioRecomanada />);
    expect(screen.getByRole('region', { name: CA['natiu.actualitzacioRecomanada.regio'] })).toBeTruthy();
    expect(screen.getByRole('button', { name: CA['natiu.actualitzacioRecomanada.accioAndroid'] })).toBeTruthy();

    /* Auditoria del kit de Gemini R22 · Una sola destinació, l'https de Play
       (actualitzacioRecomanada.obertura.test.js: amb 'noopener' window.open
       torna sempre null i la branca market:// obria dues botigues). */
    const intents = [];
    const finestra = { open: (url) => { intents.push(url); return null; } };
    expect(obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra }))
      .toBe(ENLLAC_ANDROID_PLAY);
    expect(intents).toEqual([ENLLAC_ANDROID_PLAY]);

    ui.t = (clau, reserva) => ES[clau] ?? reserva;
    publicaActualitzacioRecomanada({
      plataforma: 'ios',
      versioRecomanada: 8,
      enllac: ENLLAC_IOS_APP_STORE,
      marketUrl: null
    });
    rerender(<BarraActualitzacioRecomanada />);
    expect(screen.getByRole('button', { name: ES['natiu.actualitzacioRecomanada.accioIos'] })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: `${ES['natiu.actualitzacioRecomanada.mesTard']} · ${ES['natiu.actualitzacioRecomanada.tanca']}` }));
    expect(container.firstChild).toBeNull();
  });
});
