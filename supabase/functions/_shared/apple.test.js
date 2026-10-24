// @vitest-environment node
/* T1 (261024; P0-04, auditoria Codex C-01) · El protocol d'Apple de
   _shared/apple.js, en Node (el mateix codi corre en Deno a compte-apple).
   La clau P-256 es genera dins de la prova: cap .p8 de veres, cap equip ni
   cap client de veres, cap xarxa. */
import { describe, expect, test, vi } from 'vitest';
import {
  APPLE, aBase64, aBase64url, capcaleresDeServei, classificaResposta, cosDIntercanvi, cosDeRevocacio, deBase64, deBase64url,
  desxifra, esErrorDelClient, postApple, reclamsCasen, reclamsDelTestimoni, secretDeClient, xifra
} from './apple.js';

const subtle = globalThis.crypto.subtle;
const EQUIP = 'TEAM000001';
const CLAU = 'KEY0000001';
const CLIENT = 'org.exemple.sintetic';
const ARA = Date.UTC(2026, 9, 24, 12, 0, 0);
const CLAU_TESTIMONIS = aBase64(new Uint8Array(32).map((_, i) => i + 1));

async function parellDeClaus() {
  const parell = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const der = new Uint8Array(await subtle.exportKey('pkcs8', parell.privateKey));
  const linies = aBase64(der).match(/.{1,64}/g).join('\n');
  const etiqueta = ['PRIVATE', 'KEY'].join(' ');
  return { publica: parell.publicKey, pem: `-----BEGIN ${etiqueta}-----\n${linies}\n-----END ${etiqueta}-----\n` };
}
const json = (part) => JSON.parse(new TextDecoder().decode(deBase64url(part)));
const jwtSintetic = (reclams) => `${aBase64url(new TextEncoder().encode('{"alg":"RS256"}'))}.${aBase64url(new TextEncoder().encode(JSON.stringify(reclams)))}.c2ln`;

describe('base64 i base64url', () => {
  test('anada i tornada, també amb bytes que donen + i / i sense farciment', () => {
    const bytes = new Uint8Array([251, 255, 191, 0, 1, 2, 62, 63]);
    expect(deBase64(aBase64(bytes))).toEqual(bytes);
    const url = aBase64url(bytes);
    expect(url).not.toMatch(/[+/=]/);
    expect(deBase64url(url)).toEqual(bytes);
  });
});

describe('el client_secret ES256', () => {
  test('capçalera { alg, kid }, reclams d’Apple, cinc minuts i una signatura de 64 bytes que verifica la clau pública', async () => {
    const { publica, pem } = await parellDeClaus();
    const jwt = await secretDeClient({ teamId: EQUIP, keyId: CLAU, clientId: CLIENT, clauPem: pem, ara: ARA });
    const [capcalera, reclams, signatura] = jwt.split('.');
    expect(json(capcalera)).toEqual({ alg: 'ES256', kid: CLAU });
    const iat = Math.floor(ARA / 1000);
    expect(json(reclams)).toEqual({ iss: EQUIP, iat, exp: iat + 300, aud: 'https://appleid.apple.com', sub: CLIENT });
    const crua = deBase64url(signatura);
    expect(crua.length).toBe(64);
    const valida = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publica, crua, new TextEncoder().encode(`${capcalera}.${reclams}`));
    expect(valida).toBe(true);
  });

  test('admet la clau enganxada amb «\\n» literals i el sostre exacte de sis mesos', async () => {
    const { pem } = await parellDeClaus();
    const jwt = await secretDeClient({ teamId: EQUIP, keyId: CLAU, clientId: CLIENT, clauPem: pem.replace(/\n/g, '\\n'),
      ara: ARA, duradaS: APPLE.DURADA_MAXIMA_S });
    const { iat, exp } = json(jwt.split('.')[1]);
    expect(exp - iat).toBe(15777000);
  });

  test('rebutja sense equip, sense clau, amb un client sense forma, més de sis mesos o una clau que no és P-256, sense dir cap secret', async () => {
    const { pem } = await parellDeClaus();
    const base = { teamId: EQUIP, keyId: CLAU, clientId: CLIENT, clauPem: pem, ara: ARA };
    const casos = [
      { ...base, teamId: '' }, { ...base, keyId: undefined }, { ...base, clientId: 'amb espais' },
      { ...base, duradaS: APPLE.DURADA_MAXIMA_S + 1 }, { ...base, duradaS: 0 }, { ...base, clauPem: 'no és cap clau' },
      { ...base, clauPem: pem.replace(/[A-Za-z0-9+/]{64}\n/, 'AAAA\n') }
    ];
    for (const cas of casos) {
      const error = await secretDeClient(cas).then(() => null, (e) => e);
      expect(error, JSON.stringify({ ...cas, clauPem: '…' })).toMatchObject({ codi: 'config' });
      expect(error.message).toMatch(/^SDP-APPLE-CONFIG:/);
      expect(error.message).not.toContain(pem.slice(40, 80));
    }
  });
});

describe('els cossos de /auth/token i /auth/revoke', () => {
  test('l’intercanvi: exactament client_id, client_secret, code i grant_type, sense redirect_uri', () => {
    const cos = cosDIntercanvi({ clientId: CLIENT, secret: 's.e.c', codi: 'c0de.0.abc' });
    expect(Object.fromEntries(cos)).toEqual({ client_id: CLIENT, client_secret: 's.e.c', code: 'c0de.0.abc', grant_type: 'authorization_code' });
  });
  test('la revocació: el refresh token per defecte, o el tipus que es diga', () => {
    expect(Object.fromEntries(cosDeRevocacio({ clientId: CLIENT, secret: 's.e.c', testimoni: 'r.0.xyz' })))
      .toEqual({ client_id: CLIENT, client_secret: 's.e.c', token: 'r.0.xyz', token_type_hint: 'refresh_token' });
    expect(cosDeRevocacio({ clientId: CLIENT, secret: 's', testimoni: 't', tipus: 'access_token' }).get('token_type_hint')).toBe('access_token');
  });
});

describe('postApple i la classificació', () => {
  const resposta = (estat, text) => ({ status: estat, text: async () => text });

  test('POST form-urlencoded a Apple, sense seguir redireccions; un 200 buit dona cos null', async () => {
    const fetch = vi.fn(async () => resposta(200, ''));
    const r = await postApple(APPLE.REVOCA, new URLSearchParams({ token: 'r' }), { fetch });
    expect(r).toEqual({ estat: 200, cos: null, fallada: null });
    const [url, opcions] = fetch.mock.calls[0];
    expect(url).toBe('https://appleid.apple.com/auth/revoke');
    expect(opcions).toMatchObject({ method: 'POST', redirect: 'error', body: 'token=r',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    expect(opcions.signal).toBeInstanceOf(AbortSignal);
  });

  test('només les dues adreces d’Apple', async () => {
    await expect(postApple('https://exemple.test/auth/revoke', new URLSearchParams(), { fetch: vi.fn() })).rejects.toThrow(TypeError);
  });

  test('la xarxa caiguda i el temps esgotat no llancen: són fallades per reintentar', async () => {
    const xarxa = await postApple(APPLE.TOKEN, new URLSearchParams(), { fetch: async () => { throw new TypeError('fetch failed'); } });
    expect(xarxa).toEqual({ estat: 0, cos: null, fallada: 'xarxa' });
    const penjat = (_url, { signal }) => new Promise((_, rebutja) => signal.addEventListener('abort', () => rebutja(new DOMException('a', 'AbortError'))));
    const temps = await postApple(APPLE.TOKEN, new URLSearchParams(), { fetch: penjat, topallMs: 15 });
    expect(temps).toEqual({ estat: 0, cos: null, fallada: 'temps' });
    expect(classificaResposta(xarxa)).toEqual({ classe: 'reintenta', detall: 'reintenta:xarxa' });
    expect(classificaResposta(temps)).toEqual({ classe: 'reintenta', detall: 'reintenta:temps' });
  });

  test.each([
    ['200 amb el cos buit', { estat: 200, cos: null }, { classe: 'acceptada', detall: null }],
    ['400 invalid_grant', { estat: 400, cos: { error: 'invalid_grant' } }, { classe: 'ja_invalid', detall: 'invalid_grant' }],
    ['400 invalid_client', { estat: 400, cos: { error: 'invalid_client' } }, { classe: 'config', detall: 'config:invalid_client' }],
    ['400 invalid_request', { estat: 400, cos: { error: 'invalid_request' } }, { classe: 'config', detall: 'config:invalid_request' }],
    ['400 sense cos', { estat: 400, cos: null }, { classe: 'config', detall: 'config:400' }],
    ['401', { estat: 401, cos: null }, { classe: 'config', detall: 'config:401' }],
    ['429', { estat: 429, cos: null }, { classe: 'reintenta', detall: 'reintenta:429' }],
    ['503', { estat: 503, cos: { error: 'x' } }, { classe: 'reintenta', detall: 'reintenta:503' }],
    ['un error amb forma estranya no entra al detall', { estat: 400, cos: { error: 'r.0.TESTIMONI-QUE-NO-HA-D-EIXIR' } }, { classe: 'config', detall: 'config:400' }]
  ])('%s', (_nom, entrada, esperat) => {
    expect(classificaResposta(entrada)).toEqual(esperat);
  });

  /* R1-01 (261024 correccions) · Només el client (o el seu client_secret) que falla val per a tot el lot. */
  test.each([
    ['400 invalid_client', { estat: 400, cos: { error: 'invalid_client' } }, true],
    ['401 invalid_client', { estat: 401, cos: { error: 'invalid_client' } }, true],
    ['400 unauthorized_client', { estat: 400, cos: { error: 'unauthorized_client' } }, true],
    ['401 sense cos', { estat: 401, cos: null }, true],
    ['400 invalid_request', { estat: 400, cos: { error: 'invalid_request' } }, false],
    ['400 sense cos', { estat: 400, cos: null }, false],
    ['403', { estat: 403, cos: null }, false],
    ['400 invalid_grant', { estat: 400, cos: { error: 'invalid_grant' } }, false],
    ['503', { estat: 503, cos: null }, false],
    ['200', { estat: 200, cos: null }, false]
  ])('esErrorDelClient · %s', (_nom, entrada, esperat) => {
    expect(esErrorDelClient(classificaResposta(entrada))).toBe(esperat);
  });
  test('esErrorDelClient sense res no llança i diu que no', () => {
    expect(esErrorDelClient()).toBe(false);
    expect(esErrorDelClient({ classe: 'reintenta', detall: 'config:invalid_client' })).toBe(false);
  });
});

describe('l’id_token de l’intercanvi i el vincle A/B', () => {
  test('llig iss, aud i sub; només casa si és d’Apple, del nostre client i del mateix subjecte', () => {
    const reclams = reclamsDelTestimoni(jwtSintetic({ iss: APPLE.EMISSOR, aud: CLIENT, sub: '000123.a.0001', email: 'x@exemple.test' }));
    expect(reclams).toEqual({ iss: APPLE.EMISSOR, aud: CLIENT, sub: '000123.a.0001' });
    expect(reclamsCasen(reclams, { clientId: CLIENT, subjecte: '000123.a.0001' })).toBe(true);
    expect(reclamsCasen(reclams, { clientId: CLIENT, subjecte: '000999.b.0002' })).toBe(false);
    expect(reclamsCasen({ ...reclams, aud: 'altre.client' }, { clientId: CLIENT, subjecte: '000123.a.0001' })).toBe(false);
    expect(reclamsCasen({ ...reclams, aud: [CLIENT] }, { clientId: CLIENT, subjecte: '000123.a.0001' })).toBe(true);
    expect(reclamsCasen({ ...reclams, iss: 'https://exemple.test' }, { clientId: CLIENT, subjecte: '000123.a.0001' })).toBe(false);
    expect(reclamsCasen({ ...reclams, sub: undefined }, { clientId: CLIENT, subjecte: undefined })).toBe(false);
    expect(() => reclamsDelTestimoni('no-és-un-jwt')).toThrow(TypeError);
  });
});

describe('la custòdia xifrada', () => {
  test('anada i tornada; un iv nou cada volta; mai el text clar al xifrat', async () => {
    const a = await xifra('r.0.testimoni-sintetic', CLAU_TESTIMONIS, { context: 'A' });
    const b = await xifra('r.0.testimoni-sintetic', CLAU_TESTIMONIS, { context: 'A' });
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(atob(a)).not.toContain('testimoni-sintetic');
    expect(await desxifra(a, CLAU_TESTIMONIS, { context: 'A' })).toBe('r.0.testimoni-sintetic');
  });

  test('una altra clau o una altra persona (el context) no desxifren; una clau que no és de 32 bytes és config', async () => {
    const xifrat = await xifra('r.0.testimoni-sintetic', CLAU_TESTIMONIS, { context: 'A' });
    const altra = aBase64(new Uint8Array(32).fill(9));
    await expect(desxifra(xifrat, altra, { context: 'A' })).rejects.toMatchObject({ codi: 'clau' });
    await expect(desxifra(xifrat, CLAU_TESTIMONIS, { context: 'B' })).rejects.toMatchObject({ codi: 'clau' });
    await expect(xifra('x', aBase64(new Uint8Array(16)), { context: 'A' })).rejects.toMatchObject({ codi: 'config' });
    await expect(xifra('x', 'no és base64!', { context: 'A' })).rejects.toMatchObject({ codi: 'config' });
  });
});

describe('la clau de servei', () => {
  test('la legada (JWT) va a apikey i a Authorization; la nova sb_secret_, només a apikey', () => {
    expect(capcaleresDeServei('eyJsintetic.x.y')).toEqual({ apikey: 'eyJsintetic.x.y', Authorization: 'Bearer eyJsintetic.x.y' });
    expect(capcaleresDeServei('sb_secret_sintetic')).toEqual({ apikey: 'sb_secret_sintetic' });
  });
});
