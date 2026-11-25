/* ENT-01 i ENT-08 (v1.2.25; auditoria 261125_0347, proposta atòmica 3) · El
   role=alert de Google a /registre no anuncia mai text cru (access_denied,
   Load failed, «Circuit Breaker»): pel codi, una frase en la llengua de la
   interfície (i18nOnboardingExtra.js, 5 llengües); un error del motor sense
   codi (TypeError, SyntaxError…), la de DESCONEGUT. La persona que diu «No» a
   Google no rep cap avís i el focus torna al botó de Google, i «Cancel·la
   l’entrada» rebaixa el comptador del fre.
   L'entrada és la de veres (data/oauthRelay.js), amb un emergent fals. */
import React from 'react';
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), google: vi.fn(), llengua: 'ca' }));
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
  useUIState: () => ({ externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' }, language: m.llengua, llenguaDelText: m.llengua }),
}));
import OnboardingSection from './OnboardingSection.jsx';
import { textosOnboardingExtra } from './i18nOnboardingExtra.js';
import { missatgeDEntrada, missatgeDEntradaAmbGoogle } from './onboardingModel.js';
import { cancelAuthAttempts } from '../../data/authAttempt.js';
import { entraAmbGoogle, _intern } from '../../data/oauthRelay.js';
import { getEfimer, setEfimer } from '../../config/storage.js';

const IDIOMES = ['ca', 'es', 'en', 'eu', 'gl'];
const CLAU_FRE = 'sdp:oauth:cb';
/* Una màquina carregada pot passar de l'espera per defecte (1 s) de vi.waitFor. */
const ESPERA = Object.freeze({ timeout: 5000 });
const CRU = /access_denied|Load failed|aborted|Circuit Breaker|\{/;
const configProva = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.socdepoble.test', supabaseAnonKey: 'anon-key-publica' });
const botoGoogle = () => screen.getByRole('button', { name: 'Entrar amb Google' });
const botoCancela = () => screen.queryByRole('button', { name: 'Cancel·la l’entrada' });
const alertaGoogle = () => screen.queryByRole('alert');
const obriPopupFals = () => {
  const popup = { location: { href: '' }, closed: false, close: vi.fn() };
  vi.spyOn(window, 'open').mockReturnValue(popup);
  return popup;
};
/* L'adaptador de veres: loginWithGoogle és entraAmbGoogle d'oauthRelay.js. */
const googleDeVeres = () => m.google.mockImplementation(() => entraAmbGoogle({}, configProva));
const premGoogle = async () => { await act(async () => { fireEvent.click(botoGoogle()); }); };

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.google]) f.mockReset();
  m.llengua = 'ca';
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

describe('ENT-01 · la persona diu «No» a Google', () => {
  test('cap role=alert ni cap text cru, i el botó torna', async () => {
    googleDeVeres();
    const popup = obriPopupFals();
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'), ESPERA);
    const intent = new URL(new URL(popup.location.href).searchParams.get('redirect_to')).searchParams.get(_intern.PARAM_INTENT);
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin, source: popup, data: { type: 'sdp:oauth', id: intent, error: 'access_denied' },
      }));
    });
    await vi.waitFor(() => expect(botoGoogle().disabled).toBe(false), ESPERA);
    expect(alertaGoogle()).toBeNull();
    expect(document.body.textContent).not.toMatch(CRU);
  });

  test('qui esperava amb el focus a «Cancel·la l’entrada» el recupera al botó de Google, com en cancel·lar', async () => {
    googleDeVeres();
    const popup = obriPopupFals();
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'), ESPERA);
    act(() => { botoCancela().focus(); });
    expect(document.activeElement).toBe(botoCancela());
    const intent = new URL(new URL(popup.location.href).searchParams.get('redirect_to')).searchParams.get(_intern.PARAM_INTENT);
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin, source: popup, data: { type: 'sdp:oauth', id: intent, error: 'access_denied' },
      }));
    });
    await vi.waitFor(() => expect(botoGoogle().disabled).toBe(false), ESPERA);
    expect(botoCancela()).toBeNull();
    expect(alertaGoogle()).toBeNull();
    expect(document.activeElement).toBe(botoGoogle());
  });
});

describe('ENT-08 · el fre de les entrades seguides', () => {
  test.each(IDIOMES)('%s · la cinquena entrada seguida pinta MASSA_INTENTS en la llengua de la interfície, sense «Circuit Breaker»', async (codi) => {
    m.llengua = codi;
    googleDeVeres();
    obriPopupFals();
    setEfimer(CLAU_FRE, { count: 4, time: Date.now() });
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(alertaGoogle()).not.toBeNull(), ESPERA);
    expect(alertaGoogle().textContent).toBe(textosOnboardingExtra(codi).googleMassaIntents);
    expect(alertaGoogle().textContent).not.toMatch(CRU);
    expect(window.open).not.toHaveBeenCalled();
  });

  test('«Cancel·la l’entrada» rebaixa el comptador: un intent cancel·lat no compta', async () => {
    googleDeVeres();
    const popup = obriPopupFals();
    setEfimer(CLAU_FRE, { count: 3, time: Date.now() });
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'), ESPERA);
    expect(getEfimer(CLAU_FRE, null)).toMatchObject({ count: 4 });
    await act(async () => { fireEvent.click(botoCancela()); });
    expect(getEfimer(CLAU_FRE, null)).toMatchObject({ count: 3 });
    expect(alertaGoogle()).toBeNull();
  });
});

describe('ENT-01 · els errors amb codi, en les 5 llengües', () => {
  test.each(['googleServidorInabastable', 'googleMassaIntents', 'googleDesconegut'])('%s té una frase pròpia en cada llengua, sense text cru', (clau) => {
    const frases = IDIOMES.map((codi) => textosOnboardingExtra(codi)[clau]);
    expect(new Set(frases).size).toBe(IDIOMES.length);
    for (const frase of frases) expect(frase).not.toMatch(CRU);
  });

  test.each(IDIOMES)('%s · el navegador sense xarxa (Load failed) pinta SERVIDOR_INABASTABLE en la seua llengua', async (codi) => {
    m.llengua = codi;
    m.google.mockRejectedValue(new TypeError('Load failed'));
    render(<OnboardingSection />);
    await premGoogle();
    expect(alertaGoogle()?.textContent).toBe(textosOnboardingExtra(codi).googleServidorInabastable);
  });

  test.each(IDIOMES)('%s · un bescanvi que el servidor rebutja (DESCONEGUT) pinta la frase de Google, mai el cos', async (codi) => {
    m.llengua = codi;
    m.google.mockRejectedValue(Object.assign(new Error('No s’ha pogut completar l’entrada (400).'), { code: 'desconegut', status: 400 }));
    render(<OnboardingSection />);
    await premGoogle();
    expect(alertaGoogle()?.textContent).toBe(textosOnboardingExtra(codi).googleDesconegut);
  });

  test('en · un bescanvi que torna un 200 amb HTML pinta la frase de Google, mai el SyntaxError del navegador', async () => {
    m.llengua = 'en';
    googleDeVeres();
    const popup = obriPopupFals();
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON'); },
    })));
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'), ESPERA);
    const intent = new URL(new URL(popup.location.href).searchParams.get('redirect_to')).searchParams.get(_intern.PARAM_INTENT);
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin, source: popup, data: { type: 'sdp:oauth', id: intent, code: 'codi-de-google' },
      }));
    });
    await vi.waitFor(() => expect(alertaGoogle()).not.toBeNull(), ESPERA);
    expect(alertaGoogle().textContent).toBe(textosOnboardingExtra('en').googleDesconegut);
  });
});

describe('ENT-01 · un error del motor sense codi no arriba mai al veí', () => {
  /* Un context sense crypto.subtle (una pàgina servida per http): generaRepte
     llança un TypeError del navegador abans d'obrir res. */
  test.each(IDIOMES)('%s · sense crypto.subtle pinta la frase de Google en la seua llengua, mai «Cannot read properties…»', async (codi) => {
    m.llengua = codi;
    vi.stubGlobal('crypto', { getRandomValues: (bytes) => webcrypto.getRandomValues(bytes) });
    googleDeVeres();
    obriPopupFals();
    render(<OnboardingSection />);
    await premGoogle();
    await vi.waitFor(() => expect(alertaGoogle()).not.toBeNull(), ESPERA);
    expect(alertaGoogle().textContent).toBe(textosOnboardingExtra(codi).googleDesconegut);
    expect(alertaGoogle().textContent).not.toMatch(/Cannot read|digest|undefined/);
  });

  test('el model: TypeError, SyntaxError i DOMException són DESCONEGUT; les frases pròpies d’un adaptador, i la cancel·lació, es conserven', () => {
    const textos = textosOnboardingExtra('gl');
    for (const motor of [new TypeError('Invalid URL'), new SyntaxError('Unexpected end of JSON input'), new DOMException('The operation is insecure.', 'SecurityError')]) {
      expect(missatgeDEntradaAmbGoogle(motor, textos)).toBe(textos.googleDesconegut);
      expect(missatgeDEntradaAmbGoogle(motor, undefined)).toBe(missatgeDEntrada({ code: 'desconegut' }));
    }
    expect(missatgeDEntradaAmbGoogle(new Error('L\'entrada ha tardat massa. Torna a provar.'), textos)).toBe('L\'entrada ha tardat massa. Torna a provar.');
    expect(missatgeDEntradaAmbGoogle(new DOMException('L’intent d’entrada ha caducat.', 'AbortError'), textos)).toBe('L’intent d’entrada ha caducat.');
  });
});
