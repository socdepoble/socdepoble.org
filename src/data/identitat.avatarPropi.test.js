/* Pla 261018_1605 (Tasca 3, D6; ordre del Mestre, 18-10-2026) · La foto
   pròpia de la sessió davant de la de Google. Revisió adversarial (18-10-2026) ·
   Renovar el token desa l'usuari tal com el torna GoTrue: conservar la pròpia
   d'abans ressuscitava una foto esborrada (o canviada per la de Google) en un
   altre dispositiu. La prioritat de la pròpia la tornen la fila de profiles i
   reafirmaAvatarPropi (auth.js). Triar-ne una de pròpia a l'app guarda la de
   Google a `picture`. */
import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ policy: null }));
vi.mock('../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => m.policy }));
import { actualitzaUsuariSessio, desaSessio, esborraSessio, usuariDeSessio, CLAU_USUARI } from './identitat.js';
import { getEfimer } from '../config/storage.js';

const SUB = '11111111-2222-4333-8444-555555555555';
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = () => `${b64u({ alg: 'none' })}.${b64u({ sub: SUB, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.c2ln`;
const GOOGLE = 'https://lh3.googleusercontent.com/a/foto-google';
const PROPIA = 'sdp-media://mitjans/poble/11111111-2222-4333-8444-555555555555/avatars/propia.webp';
const PROPIA_NOVA = 'sdp-media://mitjans/poble/11111111-2222-4333-8444-555555555555/avatars/nova.webp';
const sessio = (user_metadata = {}, extra = {}) => ({ access_token: jwt(), refresh_token: 'r1', user: { id: SUB, user_metadata, ...extra } });
const desat = () => getEfimer(CLAU_USUARI, null);

afterEach(() => { esborraSessio(); window.sessionStorage.clear(); window.localStorage.clear(); vi.restoreAllMocks(); });

/* ───────── desaSessio · renovació ───────── */

test('renovació amb la foto de Google: es desa la de GoTrue, sense ressuscitar la pròpia d’abans', () => {
  expect(desaSessio(sessio({ avatar_url: PROPIA }))).toBe(true);
  expect(desaSessio(sessio({ avatar_url: GOOGLE, picture: GOOGLE, full_name: 'Veïna' }), { renovacio: true })).toBe(true);
  expect(desat()).toEqual({ id: SUB, user_metadata: { avatar_url: GOOGLE, picture: GOOGLE, full_name: 'Veïna' } });
  expect(usuariDeSessio().user_metadata.avatar_url).toBe(GOOGLE);
});

test('renovació sense foto (esborrada en un altre dispositiu): guanya l’entrant, sense cap foto', () => {
  desaSessio(sessio({ avatar_url: PROPIA }));
  expect(desaSessio(sessio({ full_name: 'Veïna' }), { renovacio: true })).toBe(true);
  expect(desat()).toEqual({ id: SUB, user_metadata: { full_name: 'Veïna' } });
});

test('renovació amb una foto pròpia nova: la nova substituïx la pròpia d’abans', () => {
  desaSessio(sessio({}, { avatar_url: PROPIA }));
  desaSessio(sessio({ avatar_url: PROPIA_NOVA }), { renovacio: true });
  expect(desat()).toEqual({ id: SUB, user_metadata: { avatar_url: PROPIA_NOVA } });
});

test('una entrada nova (no és cap renovació) no hereta res de l’anterior', () => {
  desaSessio(sessio({ avatar_url: PROPIA }));
  desaSessio(sessio({ avatar_url: GOOGLE }));
  expect(desat()).toEqual({ id: SUB, user_metadata: { avatar_url: GOOGLE } });
});

/* ───────── actualitzaUsuariSessio ───────── */

test('triar una foto pròpia guarda la de Google a picture i la pròpia mana a user_metadata i al primer nivell', () => {
  desaSessio(sessio({ avatar_url: GOOGLE, full_name: 'Veïna' }));
  const avisos = []; const escolta = (e) => avisos.push(e.detail.user);
  window.addEventListener('sdp:auth-change', escolta);
  try {
    const actualitzat = actualitzaUsuariSessio({ avatar_url: PROPIA });
    expect(actualitzat).toMatchObject({ avatar_url: PROPIA, user_metadata: { avatar_url: PROPIA, picture: GOOGLE, full_name: 'Veïna' } });
  } finally { window.removeEventListener('sdp:auth-change', escolta); }
  expect(desat()).toMatchObject({ avatar_url: PROPIA, user_metadata: { avatar_url: PROPIA, picture: GOOGLE } });
  expect(avisos).toHaveLength(1);
});

test('triar una foto pròpia no xafa una picture que ja hi era, ni hi posa una foto pròpia d’abans', () => {
  desaSessio(sessio({ avatar_url: GOOGLE, picture: 'https://lh3.googleusercontent.com/a/una-altra' }));
  actualitzaUsuariSessio({ avatar_url: PROPIA });
  expect(desat().user_metadata).toEqual({ avatar_url: PROPIA, picture: 'https://lh3.googleusercontent.com/a/una-altra' });
  esborraSessio();
  desaSessio(sessio({ avatar_url: PROPIA }));
  actualitzaUsuariSessio({ avatar_url: PROPIA_NOVA });
  expect(desat().user_metadata).toEqual({ avatar_url: PROPIA_NOVA });
});

test('esborrar la foto lleva avatar_url i picture: esborrar vol dir inicials', () => {
  desaSessio(sessio({ avatar_url: GOOGLE }));
  actualitzaUsuariSessio({ avatar_url: PROPIA });
  actualitzaUsuariSessio({ avatar_url: '' });
  expect(desat()).toEqual({ id: SUB, user_metadata: {} });
});

test('una foto que no és segura no entra; la de Google sí, sense tocar picture', () => {
  desaSessio(sessio({ avatar_url: PROPIA }));
  actualitzaUsuariSessio({ avatar_url: 'https://atacant.example/foto.png' });
  expect(desat().user_metadata).toEqual({ avatar_url: PROPIA });
  actualitzaUsuariSessio({ avatar_url: GOOGLE });
  expect(desat()).toMatchObject({ avatar_url: GOOGLE, user_metadata: { avatar_url: GOOGLE } });
  expect(desat().user_metadata).not.toHaveProperty('picture');
});
