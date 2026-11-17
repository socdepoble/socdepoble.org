import '../../../tests/helpers/diccionaris.js';
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

vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
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
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config, t: m.t, language: m.idioma }) }));
vi.mock('../../config/dataMode.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveDataMode: (config) => config?.dataMode || 'remote',
  enterRemoteMode: vi.fn(),
  eleccioRemotaActiva: () => false,
  exitRemoteMode: vi.fn(),
  enterTestMode: vi.fn()
}));
vi.mock('../../host.js', () => ({ quanLlest: () => Promise.resolve() }));
vi.mock('../../data/sessioPilot.js', async (importOriginal) => ({
  ...(await importOriginal()),
  entradaPilotDisponible: () => false
}));
vi.mock('../../data/oauthRelay.js', async (importOriginal) => ({
  ...(await importOriginal()),
  googleEnMarcAlie: () => false,
  urlPerAObrirFora: () => 'https://socdepoble.org/registre?mode=entrar'
}));
vi.mock('../../config/entradaNativa.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    plataformaNativa: () => m.plataforma
  };
});

import OnboardingSection from './OnboardingSection.jsx';
import { detectaWebViewInApp } from './detectaWebViewInApp.js';
import { TEXTOS_ESCUT_WEBVIEW, textosEscutWebview } from './textosEscutWebview.js';
import { createTranslator } from '../../config/i18n.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
const TENANT = '00000000-0000-4000-8000-0000000000de';

const UA_INSTAGRAM_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 332.0.0.29.93 (iPhone15,2; iOS 17_5; ca_ES)';
const UA_FACEBOOK_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/465.0.0.43.83;]';
const UA_TIKTOK_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_34.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/ca BytedanceWebview/d8a21c6';
const UA_LINE_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 Line/14.7.1';
const UA_SAFARI_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const UA_CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

const uaOriginal = navigator.userAgent;

function fixaUserAgent(ua) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true
  });
}

const buida = () => act(async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); });

beforeEach(() => {
  m.plataforma = 'web';
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.teCapacitat = (cap) => cap === 'recuperacioContrasenya';
  m.t = createTranslator('ca');
  m.idioma = 'ca';
  m.demana.mockReset().mockResolvedValue(undefined);
  fixaUserAgent(UA_SAFARI_IOS);
});

afterEach(() => {
  cleanup();
  fixaUserAgent(uaOriginal);
});

describe('P0-113 · detectaWebViewInApp (detector pur + blindatge Capacitor)', () => {
  test('detecta Instagram, Facebook/Messenger, TikTok i LINE amb sistema ios/android', () => {
    expect(detectaWebViewInApp(UA_INSTAGRAM_IOS)).toEqual({
      esWebViewSocial: true,
      app: 'instagram',
      nomApp: 'Instagram',
      sistema: 'ios'
    });
    expect(detectaWebViewInApp(UA_FACEBOOK_ANDROID)).toEqual({
      esWebViewSocial: true,
      app: 'facebook',
      nomApp: 'Facebook',
      sistema: 'android'
    });
    expect(detectaWebViewInApp(UA_TIKTOK_IOS)).toEqual({
      esWebViewSocial: true,
      app: 'tiktok',
      nomApp: 'TikTok',
      sistema: 'ios'
    });
    expect(detectaWebViewInApp(UA_LINE_ANDROID)).toEqual({
      esWebViewSocial: true,
      app: 'line',
      nomApp: 'LINE',
      sistema: 'android'
    });
  });

  test('ignora Safari iOS, Chrome Android i navegadors d’escriptori', () => {
    expect(detectaWebViewInApp(UA_SAFARI_IOS).esWebViewSocial).toBe(false);
    expect(detectaWebViewInApp(UA_CHROME_ANDROID).esWebViewSocial).toBe(false);
    expect(detectaWebViewInApp('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Version/17.5 Safari/605.1.15').esWebViewSocial).toBe(false);
  });

  test('exclou SEMPRE l’App nativa Capacitor (plataformaNativa, esNatiu, Capacitor.isNativePlatform i protocol capacitor:)', () => {
    expect(detectaWebViewInApp(UA_INSTAGRAM_IOS, { esNatiu: true }).esWebViewSocial).toBe(false);

    m.plataforma = 'ios';
    expect(detectaWebViewInApp(UA_FACEBOOK_ANDROID).esWebViewSocial).toBe(false);
    m.plataforma = 'android';
    expect(detectaWebViewInApp(UA_TIKTOK_IOS).esWebViewSocial).toBe(false);
    m.plataforma = 'web';

    expect(detectaWebViewInApp(UA_INSTAGRAM_IOS, {
      finestra: { Capacitor: { isNativePlatform: () => true }, location: { protocol: 'https:' } }
    }).esWebViewSocial).toBe(false);

    expect(detectaWebViewInApp(UA_FACEBOOK_ANDROID, {
      finestra: { location: { protocol: 'capacitor:' } }
    }).esWebViewSocial).toBe(false);
  });
});

describe('P0-113 · OnboardingSection Escut Empàtic OAuth en 5 llengües', () => {
  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: substituïx Google trencat per l’escut empàtic amb accions d’1 toc', async (idioma) => {
    fixaUserAgent(UA_INSTAGRAM_IOS);
    m.t = createTranslator(idioma);
    m.idioma = idioma;
    const dic = DICCIONARIS[idioma];
    const tx = TEXTOS_ESCUT_WEBVIEW[idioma];

    render(<OnboardingSection />);
    await buida();

    expect(screen.queryByRole('button', { name: dic['section.login.google.boto'] })).toBeNull();
    const escut = document.querySelector('[data-escut-webview="instagram"]');
    expect(escut).not.toBeNull();
    expect(escut.textContent).toContain(tx.avis.replace('{app}', 'Instagram'));
    expect(escut.textContent).toContain(tx.instruccionsIos.replace('{app}', 'Instagram'));
    expect(screen.getByRole('button', { name: tx.botoEnllacMagic })).toBeTruthy();
    expect(screen.getByRole('button', { name: tx.botoCorreu })).toBeTruthy();
    expect(screen.getByRole('button', { name: tx.botoCopiaUrl })).toBeTruthy();
  });

  test('1 toc en el botó de la contrasenya oblidada (R325-01) obri RecuperacioStep i en «Entra o crea un compte amb el correu» obri mode login', async () => {
    fixaUserAgent(UA_FACEBOOK_ANDROID);
    render(<OnboardingSection />);
    await buida();

    expect(document.querySelector('[data-escut-webview="facebook"]').textContent)
      .toContain(TEXTOS_ESCUT_WEBVIEW.ca.instruccionsAndroid.replace('{app}', 'Facebook'));

    fireEvent.click(screen.getByRole('button', { name: TEXTOS_ESCUT_WEBVIEW.ca.botoEnllacMagic }));
    expect(screen.getByRole('heading', { name: CA['section.login.recuperacio.titol'] })).toBeTruthy();
    expect(document.getElementById('rec-email')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: TEXTOS_ESCUT_WEBVIEW.ca.botoCorreu }));
    expect(screen.getByRole('heading', { name: CA['section.login.registre.titolEntrar'] })).toBeTruthy();
    expect(document.getElementById('reg-email')).not.toBeNull();
  });

  test('copia l’adreça per a Safari / Chrome amb feedback accessible i tolera errors del porta-retalls', async () => {
    fixaUserAgent(UA_TIKTOK_IOS);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    render(<OnboardingSection />);
    await buida();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TEXTOS_ESCUT_WEBVIEW.ca.botoCopiaUrl }));
    });
    expect(writeText).toHaveBeenCalledWith('https://socdepoble.org/registre?mode=entrar');
    expect(screen.getByRole('status').textContent).toBe(TEXTOS_ESCUT_WEBVIEW.ca.urlCopiada);

    writeText.mockRejectedValueOnce(new Error('Clipboard blocked'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: TEXTOS_ESCUT_WEBVIEW.ca.botoCopiaUrl }));
    });
    expect(screen.getByRole('status').textContent).toContain(TEXTOS_ESCUT_WEBVIEW.ca.errorCopia);
    expect(screen.getByRole('status').textContent).toContain('https://socdepoble.org/registre?mode=entrar');
  });

  test('textosEscutWebview normalitza la llengua (es-ES → es) i recau en valencià; cap diccionari no porta les claus', () => {
    expect(textosEscutWebview('es-ES')).toBe(TEXTOS_ESCUT_WEBVIEW.es);
    expect(textosEscutWebview('fr')).toBe(TEXTOS_ESCUT_WEBVIEW.ca);
    expect(textosEscutWebview(undefined)).toBe(TEXTOS_ESCUT_WEBVIEW.ca);
    for (const dic of Object.values(DICCIONARIS)) {
      expect(Object.keys(dic).filter((clau) => clau.startsWith('section.login.webview.'))).toEqual([]);
    }
  });

  test('en Safari estàndard mostra el botó normal d’Entrar amb Google sense escut WebView', async () => {
    fixaUserAgent(UA_SAFARI_IOS);
    render(<OnboardingSection />);
    await buida();

    expect(document.querySelector('[data-escut-webview]')).toBeNull();
    expect(screen.getByRole('button', { name: CA['section.login.google.boto'] })).toBeTruthy();
  });
});
