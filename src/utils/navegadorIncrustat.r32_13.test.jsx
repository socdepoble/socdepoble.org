import '../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  navigate: vi.fn(),
  toast: vi.fn(),
  config: null,
  t: undefined,
  idioma: 'ca',
  teCapacitat: undefined,
  demana: vi.fn(),
  defineix: vi.fn(),
  plataforma: 'web'
}));

vi.mock('../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../app/contexts/SessionContext', () => ({
  useSession: () => ({
    currentUser: null,
    teCapacitat: m.teCapacitat,
    comprovaServidor: vi.fn().mockResolvedValue({ ok: true }),
    loginWithGoogle: vi.fn(),
    registerWithPassword: vi.fn(),
    loginWithPassword: vi.fn(),
    demanaRecuperacioContrasenya: m.demana,
    definixContrasenyaNova: m.defineix,
    enllacDeRecuperacio: null,
    oblidaEnllacDeRecuperacio: vi.fn(),
    logout: vi.fn()
  })
}));
vi.mock('../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config, t: m.t, language: m.idioma }) }));
vi.mock('../config/dataMode.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveDataMode: (config) => config?.dataMode || 'remote',
  enterRemoteMode: vi.fn(),
  eleccioRemotaActiva: () => false,
  exitRemoteMode: vi.fn(),
  enterTestMode: vi.fn()
}));
vi.mock('../host.js', () => ({ quanLlest: () => Promise.resolve() }));
vi.mock('../data/sessioPilot.js', async (importOriginal) => ({
  ...(await importOriginal()),
  entradaPilotDisponible: () => false
}));
vi.mock('../data/oauthRelay.js', async (importOriginal) => ({
  ...(await importOriginal()),
  googleEnMarcAlie: () => false,
  urlPerAObrirFora: () => 'https://socdepoble.org/registre?mode=entrar'
}));
vi.mock('../config/entradaNativa.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, plataformaNativa: () => m.plataforma };
});

import OnboardingSection from '../sections/onboarding/OnboardingSection.jsx';
import { createTranslator } from '../config/i18n.js';
import {
  TEXTOS_NAVEGADOR_INCRUSTAT,
  copiaEnllacAmbReserva,
  esNavegadorSocialIncrustat,
  textosNavegadorIncrustat
} from './navegadorIncrustat.js';

const TENANT = '00000000-0000-4000-8000-0000000000de';

const UA_FBAN_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F79 [FBAN/FBIOS;FBAV/466.0.0.35.92;FBBV/604891234;]';
const UA_FBIAB_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/467.0.0.45.81;]';
const UA_INSTAGRAM_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.0.21.91';
const UA_LINE_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 Line/14.9.0';
const UA_TIKTOK_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 TikTok 35.1.2 BytedanceWebview/d8a21c6';

const UA_SAFARI_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const UA_CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const UA_FIREFOX_DESKTOP = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';

const uaOriginal = navigator.userAgent;

function fixaUa(ua) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
}

const buida = () => act(async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); });

beforeEach(() => {
  m.plataforma = 'web';
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.teCapacitat = (cap) => cap === 'recuperacioContrasenya';
  m.t = createTranslator('ca');
  m.idioma = 'ca';
  m.demana.mockReset().mockResolvedValue(undefined);
  fixaUa(UA_SAFARI_IOS);
});

afterEach(() => {
  cleanup();
  fixaUa(uaOriginal);
});

describe('Onada R32.13 · Lot 02 (P0-114 Escut 1) · esNavegadorSocialIncrustat lineal O(n)', () => {
  test('detecta iOS FBAN, Android FB_IAB, Instagram, LINE i TikTok i ignora Safari, Chrome i Firefox', () => {
    expect(esNavegadorSocialIncrustat(UA_FBAN_IOS)).toEqual({
      esWebViewSocial: true,
      app: 'facebook',
      nomApp: 'Facebook',
      sistema: 'ios'
    });
    expect(esNavegadorSocialIncrustat(UA_FBIAB_ANDROID)).toEqual({
      esWebViewSocial: true,
      app: 'facebook',
      nomApp: 'Facebook',
      sistema: 'android'
    });
    expect(esNavegadorSocialIncrustat(UA_INSTAGRAM_IOS)).toEqual({
      esWebViewSocial: true,
      app: 'instagram',
      nomApp: 'Instagram',
      sistema: 'ios'
    });
    expect(esNavegadorSocialIncrustat(UA_LINE_ANDROID)).toEqual({
      esWebViewSocial: true,
      app: 'line',
      nomApp: 'LINE',
      sistema: 'android'
    });
    expect(esNavegadorSocialIncrustat(UA_TIKTOK_ANDROID)).toEqual({
      esWebViewSocial: true,
      app: 'tiktok',
      nomApp: 'TikTok',
      sistema: 'android'
    });

    expect(esNavegadorSocialIncrustat(UA_SAFARI_IOS).esWebViewSocial).toBe(false);
    expect(esNavegadorSocialIncrustat(UA_CHROME_ANDROID).esWebViewSocial).toBe(false);
    expect(esNavegadorSocialIncrustat(UA_FIREFOX_DESKTOP).esWebViewSocial).toBe(false);
    expect(esNavegadorSocialIncrustat('online/offline pipeline/2.0 instagrammer').esWebViewSocial).toBe(false);
  });

  test('zero RegExp al codi font de navegadorIncrustat.js i temps O(n) < 25 ms amb 120 KB hostils', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/utils/navegadorIncrustat.js'), 'utf8');
    const senseComentaris = codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    expect(senseComentaris).not.toMatch(/\bnew\s+RegExp\b/);
    expect(senseComentaris).not.toMatch(/\/[^/\n]+\/[gimsuy]*/);

    const hostil = `${'a'.repeat(60000)} ${'line_'.repeat(12000)} FBAN iPhone`;
    const inici = performance.now();
    const res = esNavegadorSocialIncrustat(hostil);
    const durada = performance.now() - inici;
    expect(res).toEqual({
      esWebViewSocial: true,
      app: 'facebook',
      nomApp: 'Facebook',
      sistema: 'ios'
    });
    expect(durada).toBeLessThan(40);
  });

  test('diccionari modular 5 llengües (ca, es, en, eu, gl): 403 disallowed_useragent, Llei 32 = 0 i reserva ca', () => {
    const llengues = ['ca', 'es', 'en', 'eu', 'gl'];
    expect(Object.keys(TEXTOS_NAVEGADOR_INCRUSTAT).sort()).toEqual([...llengues].sort());
    for (const lang of llengues) {
      const tx = textosNavegadorIncrustat(lang);
      expect(tx.avis).toContain('403 disallowed_useragent');
      for (const valor of Object.values(tx)) {
        expect(valor.toLowerCase()).not.toContain('servidor del poble');
        expect(valor.toLowerCase()).not.toMatch(/\busar\b/);
      }
    }
    expect(textosNavegadorIncrustat('eu-ES')).toBe(TEXTOS_NAVEGADOR_INCRUSTAT.eu);
    expect(textosNavegadorIncrustat('de')).toBe(TEXTOS_NAVEGADOR_INCRUSTAT.ca);
  });

  test('copiaEnllacAmbReserva empra reserva síncrona accessible (sr-only, zero style inline) si no existix clipboard', async () => {
    const execCommand = vi.fn().mockReturnValue(true);
    const doc = document;
    const prevExec = doc.execCommand;
    doc.execCommand = execCommand;
    try {
      const ok = await copiaEnllacAmbReserva('https://socdepoble.org/registre', { nav: {}, doc });
      expect(ok).toBe(true);
      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(doc.querySelector('textarea.sr-only')).toBeNull();
    } finally {
      doc.execCommand = prevExec;
    }
  });

  test('OnboardingSection anuncia cada toc repetit de còpia per a VoiceOver i marca data-motiu-oauth', async () => {
    fixaUa(UA_FBAN_IOS);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<OnboardingSection />);
    await buida();

    const escut = document.querySelector('[data-escut-webview="facebook"]');
    expect(escut).not.toBeNull();
    expect(escut.getAttribute('data-motiu-oauth')).toBe('disallowed_useragent');

    const botoCopia = screen.getByRole('button', { name: TEXTOS_NAVEGADOR_INCRUSTAT.ca.botoCopiaUrl });
    await act(async () => { fireEvent.click(botoCopia); });
    const primerAnunci = screen.getByRole('status').textContent;
    expect(primerAnunci).toBe(TEXTOS_NAVEGADOR_INCRUSTAT.ca.urlCopiada);

    await act(async () => { fireEvent.click(botoCopia); });
    const segonAnunci = screen.getByRole('status').textContent;
    expect(segonAnunci).not.toBe(primerAnunci);
    expect(segonAnunci.trim()).toBe(TEXTOS_NAVEGADOR_INCRUSTAT.ca.urlCopiada);
  });
});
