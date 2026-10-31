/**
 * P0-24 (D06/D10) · Suite d'invariants de revisió d'App Store i Google Play
 * per a oauthRelay.js i l'actiu soc_de_poble_ibanez.webp:
 *   1. Recuperació neta davant cancel·lació explícita de l'usuari o reintent.
 *   2. Recuperació neta davant cancel·lació al proveïdor OAuth (access_denied) en camins 1, 2 i 3.
 *   3. Recuperació neta davant timeout (TEMPS_MAXIM_MS = 180.000 ms) sense deixar estat pendent.
 *   4. Recuperació de contrasenya (BOT-02: urlDeTornadaRecuperacio i recullMarcaDeRecuperacio).
 *   5. Detecció de PWA / Standalone (P6: esAppInstallada) sense obrir emergent a iOS.
 *   6. Integritat binària RIFF/WEBP, SHA-256 i traçabilitat al cens de public/assets/soc_de_poble_ibanez.webp.
 */
import { createHash, webcrypto } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { backendScope } from '../config/backendConfig.js';
import { getEfimer, getVal, setEfimer, setVal } from '../config/storage.js';
import { CENS_IMATGES } from '../sections/multimedia/censImatges.js';
import { beginAuthAttempt, cancelAuthAttempts } from './authAttempt.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import {
  _intern,
  entraAmbGoogle,
  esAppInstallada,
  gestionaTornada,
  recullMarcaDeRecuperacio,
  urlDeTornadaRecuperacio,
} from './oauthRelay.js';

const configProva = () => ({
  hasSupabaseConfig: true,
  supabaseUrl: 'https://backend.socdepoble.test',
  supabaseAnonKey: 'anon-key-publica',
});

const obriPopupFals = () => {
  const popup = { location: { href: '' }, closed: false, close: vi.fn() };
  vi.spyOn(window, 'open').mockReturnValue(popup);
  return popup;
};

const extreuIntentDePopup = (popup) => {
  const url = new URL(popup.location.href);
  const redirectTo = url.searchParams.get('redirect_to');
  return new URL(redirectTo).searchParams.get(_intern.PARAM_INTENT);
};

afterEach(() => {
  cancelAuthAttempts();
  esborraSessio();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('P0-24 (D06/D10): Invariants de revisió d’App Store i Google Play a oauthRelay.js', () => {
  it('netaja completament l’estat pendent i tanca l’emergent quan la persona cancel·la l’entrada', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const popup = obriPopupFals();

    const promesa = entraAmbGoogle({}, configProva);
    const resultat = expect(promesa).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Entrada cancel·lada.',
    });

    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'));
    const intent = extreuIntentDePopup(popup);
    expect(intent).toMatch(_intern.FORMA_INTENT);
    expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeTruthy();
    expect(getEfimer(_intern.CLAU_INTENT, null)).toBe(intent);
    expect(getVal(_intern.clauEspera(intent), null)).toEqual({
      t: expect.any(Number),
      cami: _intern.CAMI.EMERGENT,
    });

    cancelAuthAttempts();
    await resultat;

    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeNull();
    expect(getEfimer(_intern.CLAU_INTENT, null)).toBeNull();
    expect(getEfimer('sdp:oauth:backend', null)).toBeNull();
    expect(getVal(_intern.clauEspera(intent), null)).toBeNull();
    expect(getVal(_intern.clauTraspas(intent), null)).toBeNull();
    expect(getVal(_intern.CLAU_INDEX, null)).toBeNull();
    expect(usuariDeSessio()).toBeNull();
  });

  it('recupera netament quan l’usuari cancel·la a la pantalla de Google (access_denied) per postMessage o camí 3', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const popup = obriPopupFals();

    const promesa = entraAmbGoogle({}, configProva);
    const resultat = expect(promesa).rejects.toThrow('access_denied');

    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'));
    const intent = extreuIntentDePopup(popup);

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        source: popup,
        data: { type: 'sdp:oauth', id: intent, error: 'access_denied' },
      }),
    );

    await resultat;
    expect(popup.close).toHaveBeenCalled();
    expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeNull();
    expect(getEfimer(_intern.CLAU_INTENT, null)).toBeNull();
    expect(getVal(_intern.clauEspera(intent), null)).toBeNull();

    // Camí 3 (redirecció completa): torna amb error=access_denied i restaura la instantània de la pàgina
    const intentCami3 = 'BBBBBBBBBBBBBBBBBBBBBB';
    window.history.replaceState(
      { pestanya: 'mercat' },
      '',
      `/?page_id=42&error=access_denied&error_description=User+cancelled&${_intern.PARAM_INTENT}=${intentCami3}`,
    );
    setEfimer(_intern.CLAU_VERIFICADOR, 'verificador-cami3');
    setEfimer(_intern.CLAU_INTENT, intentCami3);
    setEfimer('sdp:oauth:backend', backendScope(configProva()));
    setVal(_intern.clauEspera(intentCami3), {
      t: Date.now(),
      cami: _intern.CAMI.REDIRECCIO,
    });
    setEfimer(`${_intern.PREFIX_INSTANTANIA}${intentCami3}`, {
      v: 1,
      url: `${window.location.origin}/?page_id=42#cataleg`,
      estat: { pestanya: 'mercat' },
      nota: null,
      t: Date.now(),
    });

    await expect(gestionaTornada({}, configProva)).rejects.toThrow('access_denied');
    expect(window.location.search).toBe('?page_id=42');
    expect(window.location.hash).toBe('#cataleg');
    expect(window.history.state).toEqual({ pestanya: 'mercat' });
    expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeNull();
    expect(getEfimer(_intern.CLAU_INTENT, null)).toBeNull();
    expect(getVal(_intern.clauEspera(intentCami3), null)).toBeNull();
  });

  it('aborta per timeout determinista (TEMPS_MAXIM_MS) i neteja tot l’estat pendent si l’emergent queda abandonat', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('crypto', webcrypto);
    const popup = obriPopupFals();

    const promesa = entraAmbGoogle({}, configProva);
    const resultat = expect(promesa).rejects.toThrow(
      "L'entrada ha tardat massa. Torna a provar.",
    );

    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'));
    const intent = extreuIntentDePopup(popup);

    await vi.advanceTimersByTimeAsync(_intern.TEMPS_MAXIM_MS + 10);
    await resultat;

    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeNull();
    expect(getEfimer(_intern.CLAU_INTENT, null)).toBeNull();
    expect(getVal(_intern.clauEspera(intent), null)).toBeNull();
    expect(getVal(_intern.clauTraspas(intent), null)).toBeNull();
    // Un nou intent posterior pot començar netament
    const nou = beginAuthAttempt();
    expect(() => nou.assertCurrent()).not.toThrow();
  });

  it('gestiona la marca de recuperació de contrasenya (BOT-02) i neteja els errors d’enllaç caducat', () => {
    window.history.replaceState({ origen: 'login' }, '', '/registre?poble=torre');
    const urlRecup = urlDeTornadaRecuperacio(window.location);
    expect(urlRecup).toBe(`${window.location.origin}/registre?poble=torre&sdp_auth=recuperacio`);

    // Sense la marca sdp_auth=recuperacio no toca la URL
    window.history.replaceState(
      { origen: 'amfitrio' },
      '',
      '/?page_id=9&error=checkout_failed#seccio',
    );
    expect(recullMarcaDeRecuperacio()).toBeNull();
    expect(window.location.search).toBe('?page_id=9&error=checkout_failed');
    expect(window.location.hash).toBe('#seccio');

    // Amb la marca i un error d'enllaç caducat al fragment (otp_expired), el detecta i neteja la URL
    window.history.replaceState(
      { origen: 'recuperacio' },
      '',
      '/?poble=torre&sdp_auth=recuperacio#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    );
    expect(recullMarcaDeRecuperacio()).toEqual({ error: true });
    expect(window.location.search).toBe('?poble=torre');
    expect(window.location.hash).toBe('');
    expect(window.history.state).toEqual({ origen: 'recuperacio' });
  });

  it('detecta l’execució com a PWA instal·lada (esAppInstallada) i evita obrir un emergent a iOS', () => {
    expect(
      esAppInstallada({
        matchMedia: (q) => ({ matches: q === '(display-mode: standalone)' }),
        navigator: { standalone: false },
      }),
    ).toBe(true);

    expect(
      esAppInstallada({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      }),
    ).toBe(true);

    expect(
      esAppInstallada({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false },
      }),
    ).toBe(false);
  });

  it('verifica la presència física, capçalera RIFF/WEBP, SHA-256 i registre al cens de soc_de_poble_ibanez.webp (BOT-M1)', () => {
    const camiRelatiu = 'public/assets/soc_de_poble_ibanez.webp';
    const camiAbsolut = resolve(process.cwd(), camiRelatiu);
    expect(existsSync(camiAbsolut)).toBe(true);

    const bytes = readFileSync(camiAbsolut);
    expect(bytes.byteLength).toBe(370584);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');

    const sha256 = createHash('sha256').update(bytes).digest('hex');
    expect(sha256).toBe('f57811606312f17a6af01a5b8960c4d8c1424a53c51cc56c58b988d50c5af5ea');

    const fitxaCens = CENS_IMATGES.find((item) => item.src === '/assets/soc_de_poble_ibanez.webp');
    expect(fitxaCens).toMatchObject({
      src: '/assets/soc_de_poble_ibanez.webp',
      titol: 'Sóc de Poble a l’estil Ibáñez',
      ambit: 'contingut',
      origen: 'ia',
    });
  });
});

// COOP pot donar closed=true mentre l’entrada continua viva. No es confon
// retorn de focus amb cancel·lació: el límit real són 180 s, no 18 s.
it('no cancel·la falsament per closed de COOP ni per focus; la cancel·lació explícita neteja', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('crypto', webcrypto);
  const popup = obriPopupFals();
  let resolta = false;
  const promesa = entraAmbGoogle({}, configProva);
  const resultat = expect(promesa).rejects.toMatchObject({ name: 'AbortError' });
  promesa.then(() => { resolta = true; }, () => { resolta = true; });
  await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'));
  popup.closed = true;
  window.dispatchEvent(new Event('focus'));
  await vi.advanceTimersByTimeAsync(1200);
  expect(resolta).toBe(false);
  expect(getEfimer(_intern.CLAU_INTENT, null)).toBeTruthy();
  expect(_intern.TEMPS_MAXIM_MS).toBe(180000);
  cancelAuthAttempts();
  await resultat;
  expect(getEfimer(_intern.CLAU_INTENT, null)).toBeNull();
});

it('PWA instal·lada: entraAmbGoogle real evita window.open i registra el camí de redirecció', async () => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const obri = vi.spyOn(window, 'open');
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  void entraAmbGoogle({}, configProva);
  await vi.waitFor(() => expect(redirigeix).toHaveBeenCalled());
  expect(obri).not.toHaveBeenCalled();
  expect(redirigeix).toHaveBeenCalledWith(expect.stringContaining('/auth/v1/authorize'));
  const intent = getEfimer(_intern.CLAU_INTENT, null);
  expect(getVal(_intern.clauEspera(intent), null)).toEqual({ t: expect.any(Number), cami: _intern.CAMI.REDIRECCIO });
});
