/* v1.2.25 · K-CAB-ENT0108 (cablatge de les claus de G9, ENT0108-VS-03) · El role=alert de Google a /registre diu les
   altes tancades, el compte suspés i el correu de Google sense confirmar amb la seua frase del diccionari canònic
   (section.login.error.*), en la llengua de la interfície (el `t` de UIContext), i no la frase genèrica de DESCONEGUT
   ni cap text de GoTrue. L'entrada és la de veres (data/oauthRelay.js) amb un emergent fals, o un rebuig amb el codi. */
import React from 'react';
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), google: vi.fn(), llengua: 'ca', t: null }));
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => m.navigate,
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: null, registerWithPassword: vi.fn(), loginWithPassword: vi.fn(), loginWithGoogle: m.google }),
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' }, language: m.llengua, llenguaDelText: m.llengua, t: m.t }),
}));
import OnboardingSection from './OnboardingSection.jsx';
import { textosOnboardingExtra } from './i18nOnboardingExtra.js';
import { createTranslator } from '../../config/i18n.js';
import { cancelAuthAttempts } from '../../data/authAttempt.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { entraAmbGoogle, _intern } from '../../data/oauthRelay.js';

const IDIOMES = ['ca', 'es', 'en', 'eu', 'gl'];
const ESPERA = Object.freeze({ timeout: 5000 });
const CRU = /access_denied|signup_disabled|user_banned|provider_email|Signups|banned|\{/;
const CASOS = [
  ['signup_disabled', 'ALTES_TANCADES', 'section.login.error.altesTancades'],
  ['user_banned', 'COMPTE_SUSPES', 'section.login.error.compteSuspes'],
  ['provider_email_needs_verification', 'CORREU_GOOGLE_PENDENT', 'section.login.error.confirmaCorreuGoogle']
];
const configProva = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.socdepoble.test', supabaseAnonKey: 'anon-key-publica' });
const alertaGoogle = () => screen.queryByRole('alert');
const premGoogle = async () => { await act(async () => { fireEvent.click(screen.getByRole('button', { name: m.t('section.login.google.boto', 'Entrar amb Google') })); }); };
const obriPopupFals = () => {
  const popup = { location: { href: '' }, closed: false, close: vi.fn() };
  vi.spyOn(window, 'open').mockReturnValue(popup);
  return popup;
};

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.google]) f.mockReset();
  m.llengua = 'ca';
  m.t = createTranslator('ca');
  vi.stubGlobal('crypto', webcrypto);
});
afterEach(() => {
  cancelAuthAttempts();
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe('K-CAB-ENT0108 · les tres frases a /registre', () => {
  for (const [, nom, clau] of CASOS) {
    test.each(IDIOMES)(`${nom} · %s: el role=alert de Google diu ${clau} en la llengua de la interfície`, async (llengua) => {
      m.llengua = llengua;
      m.t = createTranslator(llengua);
      m.google.mockRejectedValue(Object.assign(new Error('No s’ha pogut completar l’entrada amb Google.'), { code: CODI_ENTRADA[nom] }));
      render(<OnboardingSection />);
      await premGoogle();
      await vi.waitFor(() => expect(alertaGoogle()).not.toBeNull(), ESPERA);
      expect([llengua, alertaGoogle().textContent]).toEqual([llengua, m.t(clau)]);
      expect(alertaGoogle().textContent).not.toBe(textosOnboardingExtra(llengua).googleDesconegut);
    });
  }

  test.each(CASOS)('de veres · l’emergent torna access_denied amb error_code %s: el veí llig la frase de %s, mai GoTrue', async (codiGoTrue, _nom, clau) => {
    m.llengua = 'eu';
    m.t = createTranslator('eu');
    m.google.mockImplementation(() => entraAmbGoogle({}, configProva));
    const popup = obriPopupFals();
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'), ESPERA);
    const intent = new URL(new URL(popup.location.href).searchParams.get('redirect_to')).searchParams.get(_intern.PARAM_INTENT);
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin, source: popup,
        data: { type: 'sdp:oauth', id: intent, error: 'access_denied', error_code: codiGoTrue, error_description: 'Signups not allowed' },
      }));
    });
    await vi.waitFor(() => expect(alertaGoogle()).not.toBeNull(), ESPERA);
    expect(alertaGoogle().textContent).toBe(createTranslator('eu')(clau));
    expect(document.body.textContent).not.toMatch(CRU);
  });

  test('control · un error_code que no tenim traduït continua dient la frase de DESCONEGUT de textosOnboardingExtra', async () => {
    m.llengua = 'gl';
    m.t = createTranslator('gl');
    m.google.mockImplementation(() => entraAmbGoogle({}, configProva));
    const popup = obriPopupFals();
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'), ESPERA);
    const intent = new URL(new URL(popup.location.href).searchParams.get('redirect_to')).searchParams.get(_intern.PARAM_INTENT);
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin, source: popup, data: { type: 'sdp:oauth', id: intent, error: 'access_denied', error_code: 'unexpected_failure' },
      }));
    });
    await vi.waitFor(() => expect(alertaGoogle()).not.toBeNull(), ESPERA);
    expect(alertaGoogle().textContent).toBe(textosOnboardingExtra('gl').googleDesconegut);
  });
});
