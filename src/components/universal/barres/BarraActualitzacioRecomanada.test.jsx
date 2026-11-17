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
import EN from '../../../config/idiomes/en.js';
import ES from '../../../config/idiomes/es.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';
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

/* Onada R32.3 (ordre del Mestre, 16-11-2026 22:09) · L'avís automàtic de versió nova
   (natiu/actualitzacioAppNativa.js) es pinta en esta mateixa barra: en les 5 llengües, amb el
   botó d'un toc de cada plataforma. Les claus són les de sempre (cap de nova). */
describe('R32.3 · l’avís en les 5 llengües i el botó d’un toc per plataforma', () => {
  const LLENGUES = Object.freeze([['ca', CA], ['es', ES], ['en', EN], ['eu', EU], ['gl', GL]]);
  const CLAUS = Object.freeze(['regio', 'titol', 'detallIos', 'detallAndroid', 'accioIos', 'accioAndroid', 'mesTard', 'tanca']);
  const AVISOS = Object.freeze({
    android: { plataforma: 'android', versioRecomanada: 10, enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET },
    ios: { plataforma: 'ios', versioRecomanada: 10, enllac: ENLLAC_IOS_APP_STORE, marketUrl: null }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test.each(LLENGUES)('%s · totes les claus de la barra tenen traducció pròpia', (llengua, diccionari) => {
    for (const clau of CLAUS) {
      const text = diccionari[`natiu.actualitzacioRecomanada.${clau}`];
      expect(typeof text === 'string' && text.trim().length > 0, `${llengua} · ${clau}`).toBe(true);
      if (llengua !== 'ca') expect(text, `${llengua} · ${clau}`).not.toBe(CA[`natiu.actualitzacioRecomanada.${clau}`]);
    }
  });

  test.each(LLENGUES.flatMap(([llengua, diccionari]) => [['android', llengua, diccionari], ['ios', llengua, diccionari]]))(
    '%s · %s · regió, títol, detall i botó en la llengua de l’App; el toc obri la botiga de la plataforma',
    async (plataforma, _llengua, diccionari) => {
      vi.useFakeTimers();
      const obertes = [];
      vi.spyOn(window, 'open').mockImplementation((url) => { obertes.push(url); return null; });
      ui.t = (clau, reserva) => diccionari[clau] ?? reserva;
      publicaActualitzacioRecomanada(AVISOS[plataforma]);
      render(<BarraActualitzacioRecomanada />);
      const sufix = plataforma === 'ios' ? 'Ios' : 'Android';
      const regio = screen.getByRole('region', { name: diccionari['natiu.actualitzacioRecomanada.regio'] });
      expect(regio.getAttribute('data-plataforma')).toBe(plataforma);
      expect(regio.textContent).toContain(diccionari['natiu.actualitzacioRecomanada.titol']);
      expect(regio.textContent).toContain(diccionari[`natiu.actualitzacioRecomanada.detall${sufix}`]);
      fireEvent.click(screen.getByRole('button', { name: diccionari[`natiu.actualitzacioRecomanada.accio${sufix}`] }));
      expect(obertes).toEqual([plataforma === 'ios' ? ENLLAC_IOS_APP_STORE : ENLLAC_ANDROID_MARKET]);
      // jsdom no passa mai a segon pla: a Android, passada l'espera, la reserva https de Google Play.
      await vi.advanceTimersByTimeAsync(2000);
      expect(obertes).toEqual(plataforma === 'ios' ? [ENLLAC_IOS_APP_STORE] : [ENLLAC_ANDROID_MARKET, ENLLAC_ANDROID_PLAY]);
      // L'ajornament per versió de sempre: «Més tard» l'amaga per a esta versió.
      fireEvent.click(screen.getByRole('button', {
        name: `${diccionari['natiu.actualitzacioRecomanada.mesTard']} · ${diccionari['natiu.actualitzacioRecomanada.tanca']}`
      }));
      expect(screen.queryByRole('region')).toBeNull();
      publicaActualitzacioRecomanada(AVISOS[plataforma]);
      expect(llegixActualitzacioRecomanada()).toBeNull();
    }
  );
});
