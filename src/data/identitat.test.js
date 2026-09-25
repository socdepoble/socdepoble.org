import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ policy: null }));
vi.mock('../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => m.policy }));
import * as identitat from './identitat.js';
import { adoptaSessioExterna, desaSessio, esborraSessio, usuariDeSessio, CLAU_JWT, CLAU_REFRESC, CLAU_USUARI } from './identitat.js';
import { getEfimer, setEfimer, getVal, setVal } from '../config/storage.js';

const EMISSOR = 'https://auth.example.test';
const SUB = '11111111-2222-4333-8444-555555555555';
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (claims) => `${b64u({ alg: 'none' })}.${b64u(claims)}.c2ln`;
const claims = (extra = {}) => ({ sub: SUB, iss: EMISSOR, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, email: 'veina@example.test', ...extra });
const politica = () => ({ auth: { issuer: EMISSOR, audiences: ['authenticated'] } });
afterEach(() => { esborraSessio(); window.sessionStorage.clear(); window.localStorage.clear(); m.policy = null; vi.restoreAllMocks(); });

/* ───────── adoptaSessioExterna: la porta de l'amfitrió (Sollutia) ───────── */

test('sense emissor a la política no s’adopta cap sessió externa', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(adoptaSessioExterna({ access_token: jwt(claims()) })).toBe(false);
  expect(getEfimer(CLAU_JWT, null)).toBeNull();
});
test('token vàlid: desa les tres peces, avisa la interfície i oblida el convidat', () => {
  m.policy = politica();
  setVal('socdepoble-guest-session-id', '99999999-2222-4333-8444-555555555555');
  const avisos = []; const escolta = (e) => avisos.push(e.detail.user.id);
  window.addEventListener('sdp:auth-change', escolta);
  const ok = adoptaSessioExterna({ access_token: jwt(claims()), refresh_token: 'r1', user: { id: SUB, user_metadata: { full_name: 'Veïna', role: 'superadmin' } } });
  window.removeEventListener('sdp:auth-change', escolta);
  expect(ok).toBe(true);
  expect(usuariDeSessio()).toMatchObject({ id: SUB, user_metadata: { full_name: 'Veïna' } });
  expect(usuariDeSessio().user_metadata.role).toBeUndefined();   // metadata només per llista blanca
  expect(getEfimer(CLAU_REFRESC)).toBe('r1');
  expect(avisos).toEqual([SUB]);
  expect(getVal('socdepoble-guest-session-id', null)).toBeNull();
});
test('rebutja emissor alié, emissor declarat per l’amfitrió distint de la política i forma no JWT', () => {
  m.policy = politica(); vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(adoptaSessioExterna({ access_token: jwt(claims({ iss: 'https://atacant.example' })) })).toBe(false);
  expect(adoptaSessioExterna({ access_token: jwt(claims()) }, { emissorEsperat: 'https://altre.example' })).toBe(false);
  expect(adoptaSessioExterna({ access_token: 'opac' })).toBe(false);
  expect(adoptaSessioExterna(null)).toBe(false);
  expect(getEfimer(CLAU_JWT, null)).toBeNull();
});
test('rebutja token caducat, sense caducitat o amb sub que no és un uuid', () => {
  m.policy = politica();
  expect(adoptaSessioExterna({ access_token: jwt(claims({ exp: Math.floor(Date.now() / 1000) - 1 })) })).toBe(false);
  expect(adoptaSessioExterna({ access_token: jwt(claims({ exp: undefined })) })).toBe(false);
  expect(adoptaSessioExterna({ access_token: jwt(claims({ sub: 'admin' })) })).toBe(false);
  expect(getEfimer(CLAU_JWT, null)).toBeNull();
});
test('rebutja token sense audiència o amb una audiència que la política no admet', () => {
  m.policy = politica(); vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(adoptaSessioExterna({ access_token: jwt(claims({ aud: undefined })) })).toBe(false);
  expect(adoptaSessioExterna({ access_token: jwt(claims({ aud: ['altra-app'] })) })).toBe(false);
  expect(adoptaSessioExterna({ access_token: jwt(claims({ aud: ['altra-app', 'authenticated'] })) })).toBe(true);
});
test('un blob d’usuari d’una altra persona no s’hereta: ni la identitat ni la metadata', () => {
  m.policy = politica();
  const alie = { id: '99999999-2222-4333-8444-555555555555', email: 'altra@example.test', user_metadata: { full_name: 'Altra', avatar_url: 'https://img.example/altra.png' } };
  expect(adoptaSessioExterna({ access_token: jwt(claims()), user: alie })).toBe(true);
  expect(usuariDeSessio()).toEqual({ id: SUB, email: 'veina@example.test', user_metadata: {} });
});

/* ───────── desaSessio i sessioRecuperable (D6) ───────── */

test('desaSessio sense refresh token no deixa la cadena "undefined" com a refresh token', () => {
  expect(desaSessio({ access_token: jwt(claims()), user: { id: SUB } })).toBe(true);
  expect(window.sessionStorage.getItem('sdp_embed_' + CLAU_REFRESC)).toBeNull();
  expect(getEfimer(CLAU_REFRESC, null)).toBeNull();
});
test('sessioRecuperable: només amb JWT caducat, refresh token i usuari desats', () => {
  const caducat = jwt(claims({ exp: Math.floor(Date.now() / 1000) - 60 }));
  expect(identitat.sessioRecuperable()).toBe(false);                       // res desat
  desaSessio({ access_token: jwt(claims()), refresh_token: 'r1', user: { id: SUB } });
  expect(identitat.sessioRecuperable()).toBe(false);                       // vigent: no cal
  setEfimer(CLAU_JWT, caducat);
  expect(usuariDeSessio()).toBeNull();
  expect(identitat.sessioRecuperable()).toBe(true);
  window.sessionStorage.removeItem('sdp_embed_' + CLAU_REFRESC);
  expect(identitat.sessioRecuperable()).toBe(false);                       // sense refresh token
  setEfimer(CLAU_REFRESC, 'r1'); window.sessionStorage.removeItem('sdp_embed_' + CLAU_USUARI);
  expect(identitat.sessioRecuperable()).toBe(false);                       // sense usuari
});

for (const key of [CLAU_JWT, CLAU_REFRESC, CLAU_USUARI]) {
  test(`quota en ${key}: mai barreja B amb A, inclús si falla la neteja`, () => {
    desaSessio({ access_token: jwt(claims()), refresh_token: 'rA', user: { id: SUB } });
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(k, v) {
      if (k === 'sdp_embed_' + key) throw new DOMException('Quota', 'QuotaExceededError');
      return original.call(this, k, v);
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
    expect(desaSessio({ access_token: jwt(claims({ sub: 'B' })), refresh_token: 'rB', user: { id: 'B' } })).toBe(false);
    for (const k of [CLAU_JWT, CLAU_REFRESC, CLAU_USUARI]) expect(getEfimer(k)).toBeNull();
    expect(usuariDeSessio()).toBeNull();
    expect(identitat.sessioRecuperable()).toBe(false);
  });
}
test('serialització circular: cap escriptura parcial ni èxit fals', () => {
  const user = { id: SUB }; user.self = user;
  const write = vi.spyOn(Storage.prototype, 'setItem');
  expect(desaSessio({ access_token: 'synthetic', user })).toBe(false);
  expect(write).not.toHaveBeenCalled(); expect(usuariDeSessio()).toBeNull();
});
test('guarda d’entrada: refresh legítim passa; reentrada del mateix actor avorta', () => {
  const session = { access_token: jwt(claims()), user: { id: SUB } };
  desaSessio(session); const guard = identitat.capturaSessio();
  expect(desaSessio(session, { renovacio: true })).toBe(true); expect(guard).not.toThrow();
  desaSessio(session); expect(guard).toThrow('La sessió ha canviat');
});
test('una renovació no pot substituir l’actor', () => {
  desaSessio({ access_token: jwt(claims()), user: { id: SUB } });
  expect(desaSessio({ access_token: 'synthetic', user: { id: 'B' } }, { renovacio: true })).toBe(false);
  expect(usuariDeSessio().id).toBe(SUB);
});
