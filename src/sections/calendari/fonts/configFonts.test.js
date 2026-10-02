/**
 * T1 (prompt comú 261002_0125) · La configuració de les fonts de Google:
 * sense client, cap font (i /calendari com sempre); amb client, la font per
 * defecte o les de VITE_GCAL_FONTS, validades. Mal escrita, fallada tancada.
 */
import { describe, expect, test, vi } from 'vitest';
import { FONTS_PER_DEFECTE, MAX_FONTS, RUTA_RETORN_GOOGLE, configFontsDeLEntorn, fontsGoogleConfigurades, llegixConfigFonts } from './configFonts.js';

const CLIENT = '123456789012-provesprovesproves.apps.googleusercontent.com';
const ORIGEN = { origen: 'https://example.org' };
const DUES = JSON.stringify([
  { id: 'privat', nom: 'El meu calendari', calendarId: 'primary' },
  { id: 'organitzacio', nom: 'Organització', calendarId: 'calendari@example.org', compte: 'calendari@example.org' }
]);
const llig = (env) => llegixConfigFonts(env, ORIGEN);

describe('llegixConfigFonts', () => {
  test('sense client de Google, cap font: la pàgina es pinta com sempre', () => {
    expect(llig({})).toMatchObject({ configurades: false, fonts: [], avisos: [] });
    expect(llig({ VITE_GOOGLE_OAUTH_CLIENT_ID: '   ', VITE_GCAL_FONTS: DUES }).configurades).toBe(false);
    expect(fontsGoogleConfigurades({}, ORIGEN)).toBe(false);
  });

  test('amb client i sense VITE_GCAL_FONTS, el calendari principal del compte que es connecte', () => {
    const config = llig({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT });
    expect(config).toMatchObject({ configurades: true, clientId: CLIENT, redirectUri: `https://example.org${RUTA_RETORN_GOOGLE}` });
    expect(config.fonts).toEqual([{ ...FONTS_PER_DEFECTE[0], colorToken: 'accio', activa: true }]);
    expect(fontsGoogleConfigurades({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT }, ORIGEN)).toBe(true);
  });

  test('dues fonts, la privada i la de l’organització, cada una amb el seu color per ordre i el seu compte', () => {
    const { fonts } = llig({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT, VITE_GCAL_FONTS: DUES });
    expect(fonts).toEqual([
      { id: 'privat', nom: 'El meu calendari', calendarId: 'primary', compte: null, colorToken: 'accio', activa: true },
      { id: 'organitzacio', nom: 'Organització', calendarId: 'calendari@example.org', compte: 'calendari@example.org', colorToken: 'accent', activa: true }
    ]);
    expect(Object.isFrozen(fonts[1])).toBe(true);
  });

  test('un color i una casella apagada explícits es respecten', () => {
    const { fonts } = llig({
      VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT,
      VITE_GCAL_FONTS: JSON.stringify([{ id: 'festes', nom: 'Festes', calendarId: 'festes@example.org', colorToken: 'exit', activa: false }])
    });
    expect(fonts[0]).toMatchObject({ colorToken: 'exit', activa: false });
  });

  test('JSON mal escrit, que no és una llista o sense cap font vàlida: cap font, i no es cau a la de per defecte', () => {
    for (const VITE_GCAL_FONTS of ['[{', '{"id":"privat"}', '[]', JSON.stringify([{ id: 'X', nom: 'x', calendarId: 'primary' }])]) {
      const config = llig({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT, VITE_GCAL_FONTS });
      expect(config.configurades).toBe(false);
      expect(config.avisos.length).toBeGreaterThan(0);
    }
  });

  test('descarta, i ho diu, les fonts dolentes, repetides o de més; les bones continuen', () => {
    const crues = [
      { id: 'bona', nom: 'Bona', calendarId: 'primary' },
      { id: 'bona', nom: 'Repetida', calendarId: 'primary' },
      { id: 'sense-calendari', nom: 'Sense calendari' },
      { id: 'compte-dolent', nom: 'Compte', calendarId: 'primary', compte: 'no és cap adreça' },
      { id: 'color-dolent', nom: 'Color', calendarId: 'primary', colorToken: 'rgb(0, 0, 0)' },
      ...Array.from({ length: MAX_FONTS + 1 }, (_, i) => ({ id: `extra-${i}`, nom: `Extra ${i}`, calendarId: 'primary' }))
    ];
    const config = llig({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT, VITE_GCAL_FONTS: JSON.stringify(crues) });
    expect(config.configurades).toBe(true);
    expect(config.fonts.map((font) => font.id)).toEqual(['bona', 'extra-0', 'extra-1', 'extra-2', 'extra-3', 'extra-4']);
    expect(config.avisos.join(' ')).toMatch(/repetit/);
    expect(config.avisos.join(' ')).toMatch(/calendarId/);
    expect(config.avisos.join(' ')).toMatch(/no és una adreça/);
    expect(config.avisos.join(' ')).toMatch(/token/);
    expect(config.avisos.join(' ')).toMatch(/només es lligen/);
  });

  test('un client que no és de Google o un origen que no és https (fora de local): cap font', () => {
    expect(llig({ VITE_GOOGLE_OAUTH_CLIENT_ID: 'un-client-qualsevol' }).configurades).toBe(false);
    expect(llegixConfigFonts({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT }, { origen: 'http://example.org' }).configurades).toBe(false);
    expect(llegixConfigFonts({ VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT }, { origen: 'http://localhost:3340' }).redirectUri).toBe(`http://localhost:3340${RUTA_RETORN_GOOGLE}`);
  });
});

describe('configFontsDeLEntorn', () => {
  test('el mateix objecte mentre l’entorn no canvia (els hooks en depenen), i un altre quan canvia', () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const env = { VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT };
    const primera = configFontsDeLEntorn(env, ORIGEN);
    expect(configFontsDeLEntorn({ ...env }, ORIGEN)).toBe(primera);
    const altra = configFontsDeLEntorn({ ...env, VITE_GCAL_FONTS: DUES }, ORIGEN);
    expect(altra).not.toBe(primera);
    expect(altra.fonts).toHaveLength(2);
    configFontsDeLEntorn({ ...env, VITE_GCAL_FONTS: '[{' }, ORIGEN);
    expect(avis).toHaveBeenCalledWith('[calendari] Fonts de Google:', expect.stringMatching(/JSON/));
    avis.mockRestore();
  });
});
