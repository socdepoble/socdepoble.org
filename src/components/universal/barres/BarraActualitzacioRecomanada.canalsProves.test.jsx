/**
 * Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · La barra de sempre amb els canals
 * nous: TestFlight (iOS) i la web (la PWA), en les cinc llengües, i el botó d'un toc de cada un. Sense
 * canal, la barra és la d'abans.
 * Onada v1.2.16 · ZERO APK fora de botiga (ordre del Mestre, 21-11-2026) · L'APK directe ja no és cap
 * canal: l'avís no entra al registre, la barra no es pinta i cap botó no obri l'APK, tampoc amb una
 * `mostra` que no passa pel registre.
 * v1.2.17 · T-04 · La neteja ja és feta: la barra no té cap branca ni cap text de l'APK (ni la suma SHA-256),
 * i una `mostra` amb el canal 'apk' cau al text de Google Play de sempre amb un botó que no obri res. El
 * mòdul de configuració ja no exporta l'adreça de l'APK: la prova en guarda el literal (APK_DIRECTE).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const ui = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActionsOpcional: () => ({ t: (_clau, reserva) => reserva, language: ui.language })
}));

import {
  ESQUEMA_TESTFLIGHT,
  FONT_MANIFEST,
  FONT_WEB,
  fixaRecarregaWeb,
  llegixActualitzacioRecomanada,
  netejaActualitzacioRecomanadaPerProves,
  publicaActualitzacioRecomanada
} from '../../../config/actualitzacioRecomanada.js';
import BarraActualitzacioRecomanada from './BarraActualitzacioRecomanada.jsx';
import { TEXTOS_ACTUALITZACIO, textosActualitzacio } from './textosActualitzacio.js';

// v1.2.17 · T-04 · L'adreça de l'APK que la v1.2.16 publicava: el botó no l'ha d'obrir mai.
const APK_DIRECTE = 'https://socdepoble.org/descarregues/socdepoble-android-latest.apk';
const SHA = '0123456789abcdef'.repeat(4);
const tf = { plataforma: 'ios', canal: 'testflight', versioRecomanada: 12, versio: '1.2.7' };
const apk = { plataforma: 'android', canal: 'apk', versioRecomanada: 12, versio: '1.2.7', sha256: SHA };
const web = { plataforma: 'web', canal: 'web', versioRecomanada: 1_002_007, versio: '1.2.7' };

beforeEach(() => {
  ui.language = 'ca';
  netejaActualitzacioRecomanadaPerProves();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  netejaActualitzacioRecomanadaPerProves();
});

describe('els textos', () => {
  test('cinc llengües amb les mateixes claus, cap buida; una llengua desconeguda és el valencià', () => {
    expect(Object.keys(TEXTOS_ACTUALITZACIO)).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    const claus = Object.keys(TEXTOS_ACTUALITZACIO.ca);
    for (const [llengua, textos] of Object.entries(TEXTOS_ACTUALITZACIO)) {
      expect(Object.keys(textos), llengua).toEqual(claus);
      for (const text of Object.values(textos)) expect(text.trim().length, llengua).toBeGreaterThan(5);
      expect(textos.detallWeb, llengua).toContain('{versio}');
      // v1.2.17 · T-04 · Cap text de l'APK directe ni de la seua suma, en cap llengua.
      expect(Object.values(textos).join(' '), llengua).not.toMatch(/APK|SHA-256/);
      if (llengua !== 'ca') expect(textos.detallTestflight, llengua).not.toBe(TEXTOS_ACTUALITZACIO.ca.detallTestflight);
    }
    // v1.2.17 · T-04 · Només els canals vius: TestFlight i la web.
    expect(claus).toEqual(['detallTestflight', 'accioTestflight', 'detallWeb', 'accioWeb']);
    expect(textosActualitzacio('es-ES')).toBe(TEXTOS_ACTUALITZACIO.es);
    expect(textosActualitzacio('fr')).toBe(TEXTOS_ACTUALITZACIO.ca);
    expect(textosActualitzacio(null)).toBe(TEXTOS_ACTUALITZACIO.ca);
    // Valencià AVL: «vinga» (v1.2.17 · T-04: el text de l'APK, amb «esta», ja no hi és).
    expect(TEXTOS_ACTUALITZACIO.ca.detallTestflight).toMatch(/quan et vinga bé\.$/);
  });
});

describe('la barra', () => {
  test('TestFlight: el text i el botó de TestFlight, sense cap botiga d\'Android', () => {
    publicaActualitzacioRecomanada(tf, FONT_MANIFEST);
    const finestraOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(<BarraActualitzacioRecomanada />);
    expect(container.querySelector('[data-canal="testflight"][data-plataforma="ios"]')).not.toBeNull();
    expect(screen.getByText(TEXTOS_ACTUALITZACIO.ca.detallTestflight)).toBeTruthy();
    expect(container.textContent).not.toMatch(/Google Play|APK|App Store/);
    fireEvent.click(screen.getByRole('button', { name: /Actualitza a TestFlight/ }));
    expect(finestraOpen).toHaveBeenCalledWith(ESQUEMA_TESTFLIGHT, '_blank', 'noopener,noreferrer');
  });

  test('v1.2.16 · ZERO APK: un avís APK, amb la suma bona, no entra al registre, no pinta cap barra i no obri cap APK', () => {
    publicaActualitzacioRecomanada(apk, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()).toBeNull();
    const finestraOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container, rerender } = render(<BarraActualitzacioRecomanada />);
    expect(container.innerHTML).toBe('');
    // Ni amb una mostra que no passa pel registre: el botó no obri res.
    rerender(<BarraActualitzacioRecomanada mostra={apk} />);
    /* v1.2.17 · T-04 · La barra ja no té cap text de l'APK: la mostra cau al text de Google Play de sempre, sense
       cap suma (ni <code>), i el seu botó continua sense obrir res (obriBotigaActualitzacio). */
    expect(container.textContent).not.toMatch(/APK|SHA-256/);
    expect(container.textContent).not.toContain(SHA);
    expect(container.querySelector('code')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Actualitza a Google Play/ }));
    expect(finestraOpen).not.toHaveBeenCalled();
    expect(finestraOpen.mock.calls.flat()).not.toContain(APK_DIRECTE);
  });

  test('la web: la versió nova al text i el botó que la carrega', () => {
    publicaActualitzacioRecomanada(web, FONT_WEB);
    const recarrega = vi.fn();
    fixaRecarregaWeb(recarrega);
    const { container } = render(<BarraActualitzacioRecomanada />);
    expect(container.querySelector('[data-canal="web"]')).not.toBeNull();
    expect(screen.getByText('Pots continuar ara i carregar la versió 1.2.7 quan et vinga bé.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Carrega la versió nova/ }));
    expect(recarrega).toHaveBeenCalledTimes(1);
  });

  test('«Més tard» ajorna el build del canal', () => {
    publicaActualitzacioRecomanada(tf, FONT_MANIFEST);
    render(<BarraActualitzacioRecomanada />);
    fireEvent.click(screen.getByRole('button', { name: /^Més tard/ }));
    expect(llegixActualitzacioRecomanada()).toBeNull();
  });

  test('en les cinc llengües, cada canal diu el seu text', () => {
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      for (const [avis, clau] of [[tf, 'detallTestflight'], [web, 'detallWeb']]) {
        const { container, unmount } = render(<BarraActualitzacioRecomanada mostra={avis} llengua={llengua} />);
        const esperat = TEXTOS_ACTUALITZACIO[llengua][clau].replace('{versio}', '1.2.7');
        expect(container.querySelector('.sdp-barra-actualitzacio__detall').textContent, `${llengua} ${clau}`).toBe(esperat);
        unmount();
      }
    }
    // Sense la prop, la llengua de la interfície.
    ui.language = 'eu';
    const { container } = render(<BarraActualitzacioRecomanada mostra={tf} />);
    expect(container.textContent).toContain(TEXTOS_ACTUALITZACIO.eu.accioTestflight);
  });

  test('sense canal, la barra de sempre (Google Play i l\'App Store) i cap atribut data-canal', () => {
    const { container, rerender } = render(<BarraActualitzacioRecomanada mostra={{ plataforma: 'android', versioRecomanada: 12 }} />);
    expect(container.querySelector('[data-canal]')).toBeNull();
    expect(container.textContent).toContain('Actualitza a Google Play');
    rerender(<BarraActualitzacioRecomanada mostra={{ plataforma: 'ios', versioRecomanada: 12 }} />);
    expect(container.textContent).toContain('Actualitza a l’App Store');
    expect(container.querySelector('code')).toBeNull();
  });
});
