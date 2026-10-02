/**
 * T1 (prompt comú 261002_0125) · La sessió de les fonts viu només en
 * memòria: el token no ix mai a l'instantània, caduca sol i es pot oblidar;
 * la connexió es pot cancel·lar; les caselles recorden el que tria el veí.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  acabaConnexio, cancellaConnexio, casellaDe, clauDelCompte, desaToken, estatDelCompte, iniciaConnexio, instantania,
  oblidaToken, oblidaTot, posaCasella, subscriu, tokenDe
} from './sessioFonts.js';

const COMPTE = 'veina@example.org';
const TOKEN = 'ya29.token-de-proves-0123456789';

afterEach(() => {
  oblidaTot();
  vi.useRealTimers();
});

describe('tokens', () => {
  test('desa el token en memòria: l’instantània només diu que està connectat, i cada token nou és una versió nova', () => {
    const avisa = vi.fn();
    const deixa = subscriu(avisa);
    desaToken(COMPTE, { token: TOKEN, caduca: Date.now() + 60000 });
    expect(tokenDe(COMPTE)).toBe(TOKEN);
    const estat = estatDelCompte(instantania(), COMPTE);
    expect(estat).toMatchObject({ connectat: true, connectant: false, error: null });
    expect(JSON.stringify(instantania())).not.toContain(TOKEN);
    desaToken(COMPTE, { token: `${TOKEN}-2`, caduca: Date.now() + 60000 });
    expect(estatDelCompte(instantania(), COMPTE).versio).toBeGreaterThan(estat.versio);
    expect(avisa).toHaveBeenCalledTimes(2);
    deixa();
  });

  test('un token caducat no es dona: s’oblida i el compte diu TOKEN_CADUCAT', () => {
    desaToken(COMPTE, { token: TOKEN, caduca: 2000 }, 1000);
    expect(tokenDe(COMPTE, 1500)).toBe(TOKEN);
    expect(tokenDe(COMPTE, 2000)).toBeNull();
    expect(estatDelCompte(instantania(), COMPTE)).toMatchObject({ connectat: false, error: { tipus: 'TOKEN_CADUCAT' } });
  });

  test('quan arriba l’hora de caducar, el compte es desconnecta sol', () => {
    vi.useFakeTimers();
    desaToken(COMPTE, { token: TOKEN, caduca: Date.now() + 5000 });
    vi.advanceTimersByTime(5000);
    expect(estatDelCompte(instantania(), COMPTE)).toMatchObject({ connectat: false, error: { tipus: 'TOKEN_CADUCAT' } });
    expect(tokenDe(COMPTE)).toBeNull();
  });

  test('oblidar el token el desconnecta sense error; un token sense valor o ja caducat no es desa', () => {
    desaToken(COMPTE, { token: TOKEN, caduca: Date.now() + 60000 });
    oblidaToken(COMPTE);
    expect(tokenDe(COMPTE)).toBeNull();
    expect(estatDelCompte(instantania(), COMPTE)).toMatchObject({ connectat: false, error: null });
    expect(() => desaToken(COMPTE, { token: '', caduca: Date.now() + 1 })).toThrow(TypeError);
    expect(() => desaToken(COMPTE, { token: TOKEN, caduca: 5 }, 10)).toThrow(TypeError);
  });

  test('el compte sense adreça té la clau buida', () => {
    expect(clauDelCompte(null)).toBe('');
    expect(clauDelCompte(COMPTE)).toBe(COMPTE);
    expect(estatDelCompte(instantania(), '')).toMatchObject({ connectat: false, versio: 0 });
  });
});

describe('connexió i caselles', () => {
  test('una connexió es pot cancel·lar (avorta l’intent) i una de nova cancel·la la vella', () => {
    const primer = iniciaConnexio(COMPTE);
    expect(estatDelCompte(instantania(), COMPTE).connectant).toBe(true);
    const segon = iniciaConnexio(COMPTE);
    expect(primer.signal.aborted).toBe(true);
    cancellaConnexio(COMPTE);
    expect(segon.signal.aborted).toBe(true);
    expect(estatDelCompte(instantania(), COMPTE)).toMatchObject({ connectant: false, error: null });
  });

  test('acabar un intent que ja no és el viu no toca res; el viu diu el seu error', () => {
    const vell = iniciaConnexio(COMPTE);
    const viu = iniciaConnexio(COMPTE);
    acabaConnexio(COMPTE, vell, new Error('tard'));
    expect(estatDelCompte(instantania(), COMPTE)).toMatchObject({ connectant: true, error: null });
    acabaConnexio(COMPTE, viu, new Error('Failed to fetch'));
    expect(estatDelCompte(instantania(), COMPTE)).toMatchObject({ connectant: false, error: { tipus: 'XARXA' } });
  });

  test('la casella: la de la font fins que el veí la canvia', () => {
    const font = { id: 'privat', activa: true };
    expect(casellaDe(instantania(), font)).toBe(true);
    posaCasella('privat', false);
    expect(casellaDe(instantania(), font)).toBe(false);
    expect(casellaDe(instantania(), { id: 'org', activa: false })).toBe(false);
  });

  test('oblidaTot ho torna tot a l’inici', () => {
    desaToken(COMPTE, { token: TOKEN, caduca: Date.now() + 60000 });
    const intent = iniciaConnexio('');
    posaCasella('privat', false);
    oblidaTot();
    expect(tokenDe(COMPTE)).toBeNull();
    expect(intent.signal.aborted).toBe(true);
    expect(instantania()).toEqual({ comptes: {}, caselles: {} });
  });
});
