/**
 * Bucle adversarial (auditoria Codex 261002_0148, punt 12) · L'adreça de
 * tornada de Google és una capacitat de qui servix la pàgina. A l'SPA pròpia,
 * la de public/auth/; incrustada en un amfitrió (l'element <soc-de-poble>),
 * només la que l'amfitrió declara, del seu origen; sense, cap font i un motiu
 * llegible. Sense client de Google, res de res: ni panell ni motiu.
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CLAU_RETORN_AMFITRIO, MOTIU_SENSE_RETORN, RUTA_RETORN_GOOGLE, adrecaDeRetornGoogle, configFontsDeLEntorn, esIncrustada,
  fontsGoogleConfigurades, llegixConfigFonts, retornDeclaratPerLAmfitrio
} from './configFonts.js';
import { oblidaTot } from './sessioFonts.js';
import { useFontsCalendari } from './useFontsCalendari.js';

const CLIENT = '123456789012-provesprovesproves.apps.googleusercontent.com';
const AMB_CLIENT = Object.freeze({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT });
const AMFITRIO = 'https://poble.example';
const RETORN = `${AMFITRIO}/calendari/tornada-google.html`;
const OCTUBRE = { desde: new Date(2026, 9, 1), fins: new Date(2026, 10, 1) };

let avis;
beforeEach(() => { avis = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => {
  cleanup();
  oblidaTot();
  avis.mockRestore();
  document.querySelectorAll('soc-de-poble').forEach((element) => element.remove());
});

describe('sense amfitrió (l’SPA pròpia)', () => {
  test('la ruta de public/auth/ de l’origen de l’app, com sempre', () => {
    const config = llegixConfigFonts(AMB_CLIENT, { origen: 'https://socdepoble.org', incrustada: false });
    expect(config).toMatchObject({ configurades: true, motiu: null, redirectUri: `https://socdepoble.org${RUTA_RETORN_GOOGLE}` });
    expect(llegixConfigFonts(AMB_CLIENT, { origen: 'http://localhost:3340', incrustada: false }).redirectUri).toBe(`http://localhost:3340${RUTA_RETORN_GOOGLE}`);
  });

  test('sense client de Google, ni font ni motiu, incrustada o no: la pàgina de sempre', () => {
    for (const incrustada of [false, true]) {
      expect(llegixConfigFonts({}, { origen: AMFITRIO, incrustada })).toMatchObject({ configurades: false, motiu: null, avisos: [] });
    }
  });
});

describe('incrustada en un amfitrió', () => {
  test('sense adreça declarada, cap font: el motiu per al veí i, a la consola, què ha de fer l’amfitrió', () => {
    const config = llegixConfigFonts(AMB_CLIENT, { origen: AMFITRIO, incrustada: true });
    expect(config).toMatchObject({ configurades: false, motiu: MOTIU_SENSE_RETORN, redirectUri: null, fonts: [] });
    expect(config.avisos.join(' ')).toMatch(/no porta auth\//);
    expect(config.avisos.join(' ')).toContain(CLAU_RETORN_AMFITRIO);
    expect(fontsGoogleConfigurades(AMB_CLIENT, { origen: AMFITRIO, incrustada: true })).toBe(false);
  });

  test('amb una adreça del seu origen, declarada: es passa tal qual a Google', () => {
    const config = llegixConfigFonts(AMB_CLIENT, { origen: AMFITRIO, incrustada: true, retorn: `  ${RETORN}  ` });
    expect(config).toMatchObject({ configurades: true, motiu: null, redirectUri: RETORN });
  });

  test('una adreça declarada d’un altre origen, mal escrita o insegura: cap font (no es cau a la de per defecte)', () => {
    const dolentes = [
      'https://socdepoble.org/auth/calendari-google.html', // un altre origen: la pàgina no parlaria amb l'app
      'http://poble.example/calendari/tornada.html', // http fora de local
      `${RETORN}#fragment`,
      'https://usuari:clau@poble.example/tornada.html',
      'https://poble.example/torna da.html',
      '/calendari/tornada.html',
      42
    ];
    for (const retorn of dolentes) {
      const config = llegixConfigFonts(AMB_CLIENT, { origen: AMFITRIO, incrustada: true, retorn });
      expect(config, String(retorn)).toMatchObject({ configurades: false, motiu: MOTIU_SENSE_RETORN });
    }
    expect(llegixConfigFonts(AMB_CLIENT, { origen: AMFITRIO, retorn: 'https://socdepoble.org/x' }).avisos.join(' ')).toMatch(/mateix origen/);
  });

  test('també a l’SPA pròpia, l’adreça declarada mana sobre la de per defecte', () => {
    expect(adrecaDeRetornGoogle({ origen: 'http://localhost:3340', declarada: 'http://localhost:3340/proves/tornada.html' }))
      .toEqual({ redirectUri: 'http://localhost:3340/proves/tornada.html' });
  });
});

describe('com ho sap l’app', () => {
  test('incrustada vol dir que la munta l’element <soc-de-poble> del contracte d’amfitrió', () => {
    expect(esIncrustada(document)).toBe(false);
    document.body.append(document.createElement('soc-de-poble'));
    expect(esIncrustada(document)).toBe(true);
    expect(esIncrustada(null)).toBe(false);
    expect(esIncrustada({ querySelector: () => { throw new Error('document estrany'); } })).toBe(false);
  });

  test('l’adreça declarada és la de configura({ config: { retornCalendariGoogle } }), a la política de l’amfitrió', () => {
    expect(retornDeclaratPerLAmfitrio({ rawHostConfig: { [CLAU_RETORN_AMFITRIO]: RETORN } })).toBe(RETORN);
    for (const politica of [null, undefined, {}, { rawHostConfig: {} }, { rawHostConfig: { [CLAU_RETORN_AMFITRIO]: '' } }]) {
      expect(retornDeclaratPerLAmfitrio(politica)).toBeUndefined();
    }
    // Sense cap política (les proves, una pàgina sense amfitrió): res declarat.
    expect(retornDeclaratPerLAmfitrio()).toBeUndefined();
  });

  test('configFontsDeLEntorn mira el document de veres: amb l’element, cap font; sense, la de sempre', () => {
    const fora = configFontsDeLEntorn(AMB_CLIENT, { origen: 'http://localhost:3000' });
    expect(fora.configurades).toBe(true);
    document.body.append(document.createElement('soc-de-poble'));
    const dins = configFontsDeLEntorn(AMB_CLIENT, { origen: 'http://localhost:3000' });
    expect(dins).toMatchObject({ configurades: false, motiu: MOTIU_SENSE_RETORN });
    expect(avis).toHaveBeenCalledWith('[calendari] Fonts de Google:', expect.stringContaining(CLAU_RETORN_AMFITRIO));
  });
});

describe('el hook', () => {
  test('incrustat sense adreça: inert (cap panell, cap petició) i amb el motiu que la pàgina pot mostrar', () => {
    const fetchImpl = vi.fn();
    const config = llegixConfigFonts(AMB_CLIENT, { origen: AMFITRIO, incrustada: true });
    const { result } = renderHook(() => useFontsCalendari(OCTUBRE, { config, fetchImpl }));
    expect(result.current).toMatchObject({ configurades: false, motiu: MOTIU_SENSE_RETORN, entrades: [], comptes: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('incrustat amb l’adreça declarada: «Connecta» obri Google amb eixa adreça de tornada', () => {
    const obriFinestra = vi.fn(() => null);
    const config = llegixConfigFonts(AMB_CLIENT, { origen: AMFITRIO, incrustada: true, retorn: RETORN });
    const { result } = renderHook(() => useFontsCalendari(OCTUBRE, { config, obriFinestra }));
    expect(result.current).toMatchObject({ configurades: true, motiu: null });
    act(() => result.current.connecta(''));
    expect(new URL(obriFinestra.mock.calls[0][0]).searchParams.get('redirect_uri')).toBe(RETORN);
  });
});
