import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import AppLector from './AppLector.jsx';
import { creaFontNoticies } from './fontNoticies.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { creaMagatzemLector } from './magatzem.js';
import manifest from './manifest.js';
import { dataCurtaLector, textosLector } from './i18nLector.js';
import { llegixData, msDeData } from './nucli/dates.js';

const magatzems = [];

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
});

afterEach(() => {
  cleanup();
  magatzems.splice(0).forEach((m) => m.tanca());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

describe('Onada R32.33 · Lector · vores de fus horari (-0 / NaN) i dates curtes en 5 llengues', () => {
  test('llegixData i msDeData accepten -00:00 i +00:00 sense deixar -0 ni NaN, i dataCurtaLector cobreix 5 llengues', () => {
    const iso = llegixData('2026-10-03T09:30:00-00:00');
    expect(iso).toBe('2026-10-03T09:30:00.000Z');
    const ms = msDeData('2026-10-03T09:30:00-00:00');
    expect(Object.is(ms, -0)).toBe(false);

    const ara = msDeData('2026-10-10T12:00:00Z');
    expect(dataCurtaLector(iso, ara, 0, 'ca')).toBe('3 d’octubre');
    expect(dataCurtaLector(iso, ara, 0, 'es')).toBe('3 de octubre');
    expect(dataCurtaLector(iso, ara, 0, 'en')).toBe('3 October');
    expect(dataCurtaLector(iso, ara, 0, 'eu')).toBe('urriak 3');
    expect(dataCurtaLector(iso, ara, 0, 'gl')).toBe('3 de outubro');
  });

  test.each(LLENGUES_APP)(
    'AppLector en %s no propaga -0 en UTC ni NaN quan el rellotge falla',
    async (lang) => {
      vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);
      const araFix = Date.parse('2026-10-03T12:00:00.000Z');
      const font = creaFontNoticies(creaAdaptadorLlavor({ ara: araFix }));
      const magatzem = creaMagatzemLector({ idb: null, navegador: {}, Canal: null });
      magatzems.push(magatzem);
      const App = () => <AppLector magatzem={magatzem} font={font} ara={() => NaN} />;
      const registre = creaRegistre({ internes: [{ ...manifest, carrega: () => Promise.resolve({ default: App }) }] });

      muntaPlataforma('/app/lector/noticies/hui', {
        registre,
        entorn: { ...ENTORN_OBERT, produccio: false },
        externalConfig: { language: lang },
      });

      const tx = textosLector(lang);
      expect(await screen.findByText(tx.espai.all, {}, { timeout: 5000 })).toBeTruthy();
      expect(document.body.textContent).not.toContain('NaN');
    }
  );
});
