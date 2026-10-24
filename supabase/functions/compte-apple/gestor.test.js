// @vitest-environment node
/* T1 (261024; P0-04, App Store 5.1.1(v); auditoria Codex C-01) · La funció
   compte-apple (gestor.js) amb un fetch fals encaminat per l'adreça: GoTrue,
   PostgREST (una taula en memòria que fa de private.autoritzacions_apple) i
   Apple. Tot és sintètic: la clau P-256 es genera ací, cap compte de veres,
   cap xarxa. Prova el vincle A/B, el 200 buit, invalid_grant, invalid_client,
   el temps esgotat i el reintent, l'ordre revoca → registra, que cap cos de
   resposta porta el codi ni el testimoni, i el preflight CORS.
   Al final, la frontera: cap fitxer de src/ nomena els secrets d'Apple, i el
   README del Mestre explica com desplegar-la. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { CORS, creaGestor } from './gestor.js';
import { aBase64, aBase64url, deBase64url, desxifra, xifra } from '../_shared/apple.js';

const subtle = globalThis.crypto.subtle;
const URL_SB = 'https://projecte.exemple.test';
const CLIENT = 'org.exemple.sintetic';
const CLAU_TESTIMONIS = aBase64(new Uint8Array(32).map((_, i) => 200 - i));
const SECRET_CRON = 'c'.repeat(64);
const PERSONES = Object.freeze({
  A: { id: '00000000-0000-4000-8000-00000000000a', jwt: 'jwtA.sessio.sintetica', sub: '000111.aaaa.0001' },
  B: { id: '00000000-0000-4000-8000-00000000000b', jwt: 'jwtB.sessio.sintetica', sub: '000222.bbbb.0002' },
  C: { id: '00000000-0000-4000-8000-00000000000c', jwt: 'jwtC.sessio.sintetica', sub: null }   // sense Apple
});
/* Cada codi d'Apple és d'una persona: l'intercanvi torna el refresh token i l'id_token d'eixa persona. */
const CODIS = Object.freeze({ 'codiA.0.sintetic': 'A', 'codiB.0.sintetic': 'B' });
const refrescDe = (qui) => `r${qui}.0.refresc-sintetic-${qui}`;
/* R1-01 (261024 correccions) · El client d'una configuració anterior (un altre bundle). */
const CLIENT_ANTIC = 'org.exemple.antic';
const subDelSecret = (cos) => JSON.parse(new TextDecoder().decode(deBase64url(cos.client_secret.split('.')[1]))).sub;
const jwtDApple = (reclams) => ['{"alg":"RS256","kid":"x"}', JSON.stringify(reclams)]
  .map((t) => aBase64url(new TextEncoder().encode(t))).join('.') + '.c2ln';

let PEM;
beforeAll(async () => {
  const parell = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const der = new Uint8Array(await subtle.exportKey('pkcs8', parell.privateKey));
  const etiqueta = ['PRIVATE', 'KEY'].join(' ');
  PEM = `-----BEGIN ${etiqueta}-----\n${aBase64(der).match(/.{1,64}/g).join('\n')}\n-----END ${etiqueta}-----\n`;
});
const entorn = (extra = {}) => ({
  SUPABASE_URL: URL_SB, SUPABASE_ANON_KEY: 'anon-sintetica', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_sintetic',
  APPLE_TEAM_ID: 'TEAM000001', APPLE_KEY_ID: 'KEY0000001', APPLE_CLIENT_ID: CLIENT, APPLE_PRIVATE_KEY: PEM,
  APPLE_TESTIMONIS_CLAU: CLAU_TESTIMONIS, SDP_CRON_SECRET: SECRET_CRON, ...extra
});

/* ── El món fals ── */
let m;
beforeEach(() => {
  m = {
    crides: [],                    // etiquetes en ordre: 'gotrue', 'apple token', 'apple revoke', 'rpc <nom>'
    cossos: [],                    // { etiqueta, cos } de cada petició
    autoritzacions: new Map(),     // user_id → { client_id, testimoni_xifrat, intents, ultim_error }
    registres: [],                 // { user_id, origen, resultat, detall }
    baixes: new Set(),             // user_id amb private.baixes
    revoca: () => ({ status: 200, text: '' }),
    token: null,                   // substitut de la resposta de /auth/token
    respostes: []                  // textos de totes les respostes de la funció
  };
});
const resposta = ({ status = 200, text = '' }) => ({ ok: status >= 200 && status < 300, status, text: async () => text, json: async () => JSON.parse(text) });
const jsonResp = (status, objecte) => resposta({ status, text: objecte === undefined ? '' : JSON.stringify(objecte) });

async function fetchFals(url, opcions = {}) {
  const headers = opcions.headers ?? {};
  if (url === `${URL_SB}/auth/v1/user`) {
    m.crides.push('gotrue');
    expect(headers.apikey).toBe('anon-sintetica');
    const qui = Object.entries(PERSONES).find(([, p]) => headers.Authorization === `Bearer ${p.jwt}`)?.[0];
    if (!qui) return jsonResp(401, { msg: 'invalid JWT' });
    const p = PERSONES[qui];
    const identitats = p.sub ? [{ identity_id: 'i', id: p.sub, user_id: p.id, provider: 'apple', identity_data: { sub: p.sub } }] : [];
    return jsonResp(200, { id: p.id, app_metadata: { providers: p.sub ? ['apple'] : ['email'] }, identities: identitats });
  }
  if (url === 'https://appleid.apple.com/auth/token') {
    m.crides.push('apple token');
    const cos = Object.fromEntries(new URLSearchParams(opcions.body));
    m.cossos.push({ etiqueta: 'apple token', cos });
    if (m.token) return resposta(await m.token(opcions));
    const qui = CODIS[cos.code];
    if (!qui) return jsonResp(400, { error: 'invalid_grant' });
    return jsonResp(200, { access_token: 'acces', token_type: 'bearer', expires_in: 3600, refresh_token: refrescDe(qui),
      id_token: jwtDApple({ iss: 'https://appleid.apple.com', aud: CLIENT, sub: PERSONES[qui].sub }) });
  }
  if (url === 'https://appleid.apple.com/auth/revoke') {
    m.crides.push('apple revoke');
    m.cossos.push({ etiqueta: 'apple revoke', cos: Object.fromEntries(new URLSearchParams(opcions.body)) });
    return resposta(await m.revoca(opcions));
  }
  const rpc = new RegExp(`^${URL_SB.replace(/\./g, '\\.')}/rest/v1/rpc/(\\w+)$`).exec(url);
  if (rpc) {
    const [, nom] = rpc;
    m.crides.push(`rpc ${nom}`);
    expect(headers.apikey).toBe('sb_secret_sintetic');
    const args = JSON.parse(opcions.body);
    m.cossos.push({ etiqueta: `rpc ${nom}`, cos: args });
    return rpcFalsa(nom, args);
  }
  throw new Error(`adreça desconeguda: ${url}`);
}

/* Una imitació mínima de les quatre RPC de 2610241420_revocacio_apple.sql. */
function rpcFalsa(nom, args) {
  if (nom === 'apple_desa_autoritzacio') {
    const p = Object.values(PERSONES).find((x) => x.id === args.p_user_id);
    if (!p || p.sub !== args.p_sub) return jsonResp(403, { code: '42501', message: 'SDP-APPLE-001' });
    m.autoritzacions.set(args.p_user_id, { client_id: args.p_client_id, testimoni_xifrat: args.p_xifrat, intents: 0, ultim_error: null });
    return jsonResp(200, { desat: true });
  }
  if (nom === 'apple_autoritzacio_de') {
    const a = m.autoritzacions.get(args.p_user_id);
    return jsonResp(200, a ? [{ client_id: a.client_id, testimoni_xifrat: a.testimoni_xifrat }] : []);
  }
  if (nom === 'apple_revocacions_pendents') {
    return jsonResp(200, [...m.autoritzacions.entries()].filter(([uid]) => m.baixes.has(uid))
      .map(([user_id, a]) => ({ user_id, client_id: a.client_id, testimoni_xifrat: a.testimoni_xifrat })));
  }
  if (nom === 'apple_registra_revocacio') {
    const a = m.autoritzacions.get(args.p_user_id);
    if (args.p_resultat === 'fallida') {
      if (a && a.testimoni_xifrat === args.p_xifrat) { a.intents++; a.ultim_error = args.p_detall; }
    } else if (args.p_resultat === 'sense_testimoni') {
      /* Actualitzada a posta (261024 correccions): R1-03, la RPC només l'anota si la baixa existix i
         si eixa persona no en té cap de les últimes 24 hores (el rellotge de la prova és fix). */
      const jaAnotat = m.registres.some((x) => x.user_id === args.p_user_id && x.resultat === 'sense_testimoni');
      if (!a && m.baixes.has(args.p_user_id) && !jaAnotat) {
        m.registres.push({ user_id: args.p_user_id, origen: args.p_origen, resultat: args.p_resultat, detall: args.p_detall });
      }
    } else if (a && a.testimoni_xifrat === args.p_xifrat) {
      m.autoritzacions.delete(args.p_user_id);
      m.registres.push({ user_id: args.p_user_id, origen: args.p_origen, resultat: args.p_resultat, detall: args.p_detall });
    }
    return resposta({ status: 204 });
  }
  return jsonResp(404, { message: 'funció desconeguda' });
}

/* ── La crida ── */
function gestor(opcions = {}) {
  const g = creaGestor({ env: entorn(opcions.env), fetch: fetchFals, ara: () => Date.UTC(2026, 9, 24, 12), topallAppleMs: opcions.topallAppleMs ?? 2000 });
  return async (peticio) => {
    const r = await g(peticio);
    const text = await r.clone().text();
    m.respostes.push(text);
    return { estat: r.status, cos: text ? JSON.parse(text) : null, capcaleres: r.headers };
  };
}
const peticio = (cos, { qui, cron, metode = 'POST' } = {}) => new Request(`${URL_SB}/functions/v1/compte-apple`, {
  method: metode,
  headers: { 'Content-Type': 'application/json', apikey: 'anon-sintetica',
    ...(qui ? { Authorization: `Bearer ${PERSONES[qui].jwt}` } : {}), ...(cron !== undefined ? { 'x-sdp-cron': cron } : {}) },
  body: metode === 'POST' || metode === 'PUT' ? (typeof cos === 'string' ? cos : JSON.stringify(cos)) : undefined
});
const custodia = (qui, codi, opcions) => gestor(opcions)(peticio({ accio: 'custodia', codi }, { qui }));
const revoca = (qui, opcions) => gestor(opcions)(peticio({ accio: 'revoca' }, { qui }));
const buida = (cron, opcions) => gestor(opcions)(peticio({ accio: 'buida' }, { cron }));
/* Cap cos de resposta no porta cap codi ni cap testimoni (ni xifrat). */
function capSecretALesRespostes() {
  const tot = m.respostes.join('\n');
  for (const prohibit of [...Object.keys(CODIS), refrescDe('A'), refrescDe('B'), 'refresc-sintetic', 'jwtA', 'jwtB', PEM.slice(30, 70)]) {
    expect(tot, prohibit).not.toContain(prohibit);
  }
  for (const a of m.autoritzacions.values()) expect(tot).not.toContain(a.testimoni_xifrat);
}

describe('la porta', () => {
  test('el preflight OPTIONS: 204 amb CORS per a authorization, apikey i content-type, i cap crida', async () => {
    const r = await gestor()(peticio(null, { metode: 'OPTIONS' }));
    expect(r.estat).toBe(204);
    expect(r.capcaleres.get('access-control-allow-origin')).toBe('*');
    expect(r.capcaleres.get('access-control-allow-methods')).toBe('POST, OPTIONS');
    for (const capcalera of ['authorization', 'apikey', 'content-type']) {
      expect(r.capcaleres.get('access-control-allow-headers')).toContain(capcalera);
    }
    expect(m.crides).toEqual([]);
  });

  test('cada resposta porta CORS i no es guarda en cap memòria cau', async () => {
    const r = await gestor()(peticio({ accio: 'res' }));
    expect(r.capcaleres.get('access-control-allow-origin')).toBe(CORS['Access-Control-Allow-Origin']);
    expect(r.capcaleres.get('cache-control')).toBe('no-store');
  });

  test('un altre mètode, un cos que no és JSON, massa llarg o una acció desconeguda: 405 o 400, sense cap crida', async () => {
    expect((await gestor()(peticio(null, { metode: 'GET' }))).estat).toBe(405);
    expect((await gestor()(peticio('no és json'))).cos).toEqual({ ok: false, error: 'peticio' });
    expect((await gestor()(peticio({ accio: 'custodia', codi: 'x'.repeat(5000) }))).estat).toBe(400);
    expect((await gestor()(peticio({ accio: 'esborra-ho-tot' }))).estat).toBe(400);
    expect(m.crides).toEqual([]);
  });

  test('sense els secrets d’Apple al servidor: 503 config, sense cap crida', async () => {
    const r = await custodia('A', 'codiA.0.sintetic', { env: { APPLE_PRIVATE_KEY: '' } });
    expect(r).toMatchObject({ estat: 503, cos: { ok: false, error: 'config' } });
    expect(m.crides).toEqual([]);
  });
});

describe('custodia', () => {
  test('A: GoTrue, Apple i el desat xifrat amb la clau i la persona; la resposta no porta res', async () => {
    const r = await custodia('A', 'codiA.0.sintetic');
    expect(r).toMatchObject({ estat: 200, cos: { ok: true, resultat: 'desat' } });
    expect(m.crides).toEqual(['gotrue', 'apple token', 'rpc apple_desa_autoritzacio']);
    const intercanvi = m.cossos.find((c) => c.etiqueta === 'apple token').cos;
    expect(intercanvi).toMatchObject({ client_id: CLIENT, code: 'codiA.0.sintetic', grant_type: 'authorization_code' });
    const [capcalera, reclams] = intercanvi.client_secret.split('.').map((part, i) => (i < 2 ? JSON.parse(new TextDecoder().decode(deBase64url(part))) : part));
    expect(capcalera).toEqual({ alg: 'ES256', kid: 'KEY0000001' });
    expect(reclams).toMatchObject({ iss: 'TEAM000001', sub: CLIENT, aud: 'https://appleid.apple.com' });
    const desat = m.cossos.find((c) => c.etiqueta === 'rpc apple_desa_autoritzacio').cos;
    expect(desat).toMatchObject({ p_user_id: PERSONES.A.id, p_sub: PERSONES.A.sub, p_client_id: CLIENT });
    expect(desat.p_xifrat).not.toContain('refresc-sintetic');
    expect(await desxifra(desat.p_xifrat, CLAU_TESTIMONIS, { context: PERSONES.A.id })).toBe(refrescDe('A'));
    await expect(desxifra(desat.p_xifrat, CLAU_TESTIMONIS, { context: PERSONES.B.id })).rejects.toMatchObject({ codi: 'clau' });
    capSecretALesRespostes();
  });

  test('el vincle A/B: la sessió de B amb el codi d’A dona 409 i no desa res', async () => {
    const r = await custodia('B', 'codiA.0.sintetic');
    expect(r).toMatchObject({ estat: 409, cos: { ok: false, error: 'subjecte' } });
    expect(m.crides).toEqual(['gotrue', 'apple token']);
    expect(m.autoritzacions.size).toBe(0);
    capSecretALesRespostes();
  });

  test('un id_token d’un altre client o d’un altre emissor tampoc no es desa', async () => {
    m.token = () => ({ status: 200, text: JSON.stringify({ refresh_token: refrescDe('A'),
      id_token: jwtDApple({ iss: 'https://appleid.apple.com', aud: 'altre.client', sub: PERSONES.A.sub }) }) });
    expect((await custodia('A', 'codiA.0.sintetic')).estat).toBe(409);
    m.token = () => ({ status: 200, text: JSON.stringify({ refresh_token: refrescDe('A'),
      id_token: jwtDApple({ iss: 'https://exemple.test', aud: CLIENT, sub: PERSONES.A.sub }) }) });
    expect((await custodia('A', 'codiA.0.sintetic')).estat).toBe(409);
    expect(m.crides.filter((c) => c === 'rpc apple_desa_autoritzacio')).toEqual([]);
  });

  test('sense sessió, 401; sense identitat d’Apple, 409; cap dels dos parla amb Apple', async () => {
    expect((await custodia(undefined, 'codiA.0.sintetic')).cos).toEqual({ ok: false, error: 'sense-sessio' });
    expect((await custodia('C', 'codiA.0.sintetic')).cos).toEqual({ ok: false, error: 'subjecte' });
    expect(m.crides).toEqual(['gotrue']);
  });

  test('un codi sense forma no ix de la funció; un codi caducat o gastat (invalid_grant) és codi_caducat', async () => {
    expect((await custodia('A', 'curt')).estat).toBe(400);
    expect((await custodia('A', 'amb espais i tot')).estat).toBe(400);
    expect(m.crides).toEqual([]);
    const r = await custodia('A', 'codiCaducat.0.sintetic');
    expect(r).toMatchObject({ estat: 200, cos: { ok: false, resultat: 'codi_caducat' } });
    expect(m.autoritzacions.size).toBe(0);
  });

  test('Apple caiguda (503) dona 502; invalid_client dona 503 config; cap desa res', async () => {
    m.token = () => ({ status: 503, text: '' });
    expect((await custodia('A', 'codiA.0.sintetic')).cos).toEqual({ ok: false, error: 'apple' });
    m.token = () => ({ status: 400, text: JSON.stringify({ error: 'invalid_client' }) });
    expect((await custodia('A', 'codiA.0.sintetic')).cos).toEqual({ ok: false, error: 'config' });
    expect(m.autoritzacions.size).toBe(0);
  });
});

describe('revoca', () => {
  beforeEach(async () => {
    await custodia('A', 'codiA.0.sintetic');
    m.crides.length = 0;
    m.cossos.length = 0;
  });

  test('200 amb el cos buit: Apple PRIMER, després registra «revocat»; la fila desapareix', async () => {
    const xifrat = m.autoritzacions.get(PERSONES.A.id).testimoni_xifrat;
    const r = await revoca('A');
    expect(r).toMatchObject({ estat: 200, cos: { ok: true, resultat: 'revocat' } });
    expect(m.crides).toEqual(['gotrue', 'rpc apple_autoritzacio_de', 'apple revoke', 'rpc apple_registra_revocacio']);
    expect(m.cossos.find((c) => c.etiqueta === 'apple revoke').cos).toMatchObject(
      { client_id: CLIENT, token: refrescDe('A'), token_type_hint: 'refresh_token' });
    expect(m.cossos.find((c) => c.etiqueta === 'rpc apple_registra_revocacio').cos).toEqual(
      { p_user_id: PERSONES.A.id, p_origen: 'baixa', p_xifrat: xifrat, p_resultat: 'revocat', p_detall: null });
    expect(m.autoritzacions.has(PERSONES.A.id)).toBe(false);
    expect(m.registres).toEqual([{ user_id: PERSONES.A.id, origen: 'baixa', resultat: 'revocat', detall: null }]);
    capSecretALesRespostes();
  });

  test('invalid_grant (ja revocada des del telèfon): terminal, ja_invalid, i la fila desapareix', async () => {
    m.revoca = () => ({ status: 400, text: JSON.stringify({ error: 'invalid_grant' }) });
    expect((await revoca('A')).cos).toEqual({ ok: true, resultat: 'ja_invalid' });
    expect(m.registres.map((x) => x.resultat)).toEqual(['ja_invalid']);
    expect(m.autoritzacions.size).toBe(0);
  });

  test('invalid_client: 503 config, «fallida» registrada DESPRÉS d’Apple i la fila es queda per al buidatge', async () => {
    m.revoca = () => ({ status: 400, text: JSON.stringify({ error: 'invalid_client' }) });
    expect((await revoca('A')).cos).toEqual({ ok: false, error: 'config' });
    expect(m.crides.slice(-2)).toEqual(['apple revoke', 'rpc apple_registra_revocacio']);
    expect(m.cossos.at(-1).cos).toMatchObject({ p_resultat: 'fallida', p_detall: 'config:invalid_client' });
    expect(m.autoritzacions.get(PERSONES.A.id)).toMatchObject({ intents: 1, ultim_error: 'config:invalid_client' });
    expect(m.registres).toEqual([]);
  });

  test('Apple penjada: el topall talla, 502 i «fallida reintenta:temps»; un 500 és igual de reintentable', async () => {
    m.revoca = (opcions) => new Promise((_, rebutja) => opcions.signal.addEventListener('abort', () => rebutja(new DOMException('a', 'AbortError'))));
    expect((await revoca('A', { topallAppleMs: 20 })).cos).toEqual({ ok: false, error: 'apple' });
    expect(m.cossos.at(-1).cos).toMatchObject({ p_resultat: 'fallida', p_detall: 'reintenta:temps' });
    m.revoca = () => ({ status: 500, text: '' });
    expect((await revoca('A')).estat).toBe(502);
    expect(m.autoritzacions.get(PERSONES.A.id)).toMatchObject({ intents: 2, ultim_error: 'reintenta:500' });
    /* El reintent: quan Apple torna, la mateixa fila es revoca. */
    m.revoca = () => ({ status: 200, text: '' });
    expect((await revoca('A')).cos).toEqual({ ok: true, resultat: 'revocat' });
    expect(m.autoritzacions.size).toBe(0);
  });

  test('sense testimoni custodiat (entrada d’abans de la custòdia): sense_testimoni, sense parlar amb Apple', async () => {
    expect((await revoca('B')).cos).toEqual({ ok: true, resultat: 'sense_testimoni' });
    expect(m.crides).toEqual(['gotrue', 'rpc apple_autoritzacio_de', 'rpc apple_registra_revocacio']);
    expect(m.cossos.at(-1).cos).toEqual({ p_user_id: PERSONES.B.id, p_origen: 'baixa', p_resultat: 'sense_testimoni', p_xifrat: null, p_detall: null });
    /* Actualitzada a posta (261024 correccions): R1-03. La funció la crida just ABANS de demana_baixa: sense
       baixa encara no s'anota res. Amb la baixa, s'anota una vegada; repetir-la el mateix dia no omple el registre. */
    expect(m.registres).toEqual([]);
    m.baixes.add(PERSONES.B.id);
    await revoca('B');
    await revoca('B');
    expect(m.registres).toEqual([{ user_id: PERSONES.B.id, origen: 'baixa', resultat: 'sense_testimoni', detall: null }]);
  });

  test('una persona sense Apple no registra res; sense sessió, 401 sense preguntar a GoTrue', async () => {
    expect((await revoca('C')).cos).toEqual({ ok: true, resultat: 'sense_apple' });
    expect((await revoca(undefined)).estat).toBe(401);
    expect(m.crides).toEqual(['gotrue']);
  });

  test('un xifrat que no es desxifra (la clau canviada) és fallida config:clau, sense parlar amb Apple', async () => {
    const r = await revoca('A', { env: { APPLE_TESTIMONIS_CLAU: aBase64(new Uint8Array(32).fill(7)) } });
    expect(r.cos).toEqual({ ok: false, error: 'config' });
    expect(m.crides).not.toContain('apple revoke');
    expect(m.cossos.at(-1).cos).toMatchObject({ p_resultat: 'fallida', p_detall: 'config:clau' });
  });

  test('R1-01 · una fila desada amb un altre client_id es revoca amb eixe client: client_id i sub del client_secret casen', async () => {
    m.autoritzacions.get(PERSONES.A.id).client_id = CLIENT_ANTIC;
    expect((await revoca('A')).cos).toEqual({ ok: true, resultat: 'revocat' });
    const cos = m.cossos.find((c) => c.etiqueta === 'apple revoke').cos;
    expect(cos.client_id).toBe(CLIENT_ANTIC);
    expect(subDelSecret(cos)).toBe(CLIENT_ANTIC);
  });
});

describe('buida (el buidatge horari)', () => {
  beforeEach(async () => {
    await custodia('A', 'codiA.0.sintetic');
    await custodia('B', 'codiB.0.sintetic');
    m.baixes.add(PERSONES.A.id).add(PERSONES.B.id);
    m.crides.length = 0;
    m.cossos.length = 0;
  });

  test('sense el secret, o amb un altre: 401 i cap RPC; un secret massa curt al servidor és 503', async () => {
    expect((await buida(undefined)).estat).toBe(401);
    expect((await buida('c'.repeat(63))).estat).toBe(401);
    expect((await buida(`${SECRET_CRON}x`)).estat).toBe(401);
    expect((await buida('curt', { env: { SDP_CRON_SECRET: 'curt' } })).estat).toBe(503);
    expect(m.crides).toEqual([]);
  });

  test('amb dos pendents: cada revocació d’Apple va abans del seu registre; cap sessió de ningú', async () => {
    const r = await buida(SECRET_CRON);
    expect(r).toMatchObject({ estat: 200, cos: { ok: true, fetes: 2, fallides: 0, pendents: 2 } });
    expect(m.crides).toEqual(['rpc apple_revocacions_pendents', 'apple revoke', 'rpc apple_registra_revocacio', 'apple revoke', 'rpc apple_registra_revocacio']);
    const revocats = m.cossos.filter((c) => c.etiqueta === 'apple revoke').map((c) => c.cos.token);
    expect(revocats.sort()).toEqual([refrescDe('A'), refrescDe('B')].sort());
    expect(m.registres.map((x) => [x.origen, x.resultat])).toEqual([['cron', 'revocat'], ['cron', 'revocat']]);
    expect(m.autoritzacions.size).toBe(0);
    capSecretALesRespostes();
  });

  test('un 503 d’Apple deixa la fila per a l’hora següent i continua amb la resta', async () => {
    let n = 0;
    m.revoca = () => (n++ === 0 ? { status: 503, text: '' } : { status: 200, text: '' });
    const r = await buida(SECRET_CRON);
    expect(r.cos).toMatchObject({ ok: true, fetes: 1, fallides: 1 });
    expect(m.autoritzacions.size).toBe(1);
    expect([...m.autoritzacions.values()][0]).toMatchObject({ intents: 1, ultim_error: 'reintenta:503' });
  });

  test('invalid_client para el lot (cap altra no passaria) i ho diu amb 503', async () => {
    m.revoca = () => ({ status: 400, text: JSON.stringify({ error: 'invalid_client' }) });
    const r = await buida(SECRET_CRON);
    expect(r).toMatchObject({ estat: 503, cos: { ok: false, error: 'config', fetes: 0, fallides: 1 } });
    expect(m.crides.filter((c) => c === 'apple revoke')).toHaveLength(1);
    expect(m.autoritzacions.size).toBe(2);
  });

  /* ── R1-01 (261024 correccions) · Una fila dolenta al capdavant no para el lot ── */
  const tokenDe = (opcions) => new URLSearchParams(opcions.body).get('token');
  const nomesB = () => {
    expect(m.autoritzacions.has(PERSONES.B.id)).toBe(false);
    expect(m.registres).toEqual([{ user_id: PERSONES.B.id, origen: 'cron', resultat: 'revocat', detall: null }]);
  };

  test('el primer xifrat no es desxifra (una clau anterior): fallida config:clau d’eixa fila i el lot revoca la segona', async () => {
    m.autoritzacions.get(PERSONES.A.id).testimoni_xifrat = await xifra(refrescDe('A'), aBase64(new Uint8Array(32).fill(7)), { context: PERSONES.A.id });
    const r = await buida(SECRET_CRON);
    expect(r).toMatchObject({ estat: 200, cos: { ok: true, fetes: 1, fallides: 1, pendents: 2 } });
    expect(m.crides).toEqual(['rpc apple_revocacions_pendents', 'rpc apple_registra_revocacio', 'apple revoke', 'rpc apple_registra_revocacio']);
    expect(m.autoritzacions.get(PERSONES.A.id)).toMatchObject({ intents: 1, ultim_error: 'config:clau' });
    nomesB();
    capSecretALesRespostes();
  });

  test.each([
    ['400 invalid_request', { status: 400, text: JSON.stringify({ error: 'invalid_request' }) }, 'config:invalid_request'],
    ['400 sense cos', { status: 400, text: '' }, 'config:400'],
    ['403', { status: 403, text: '' }, 'config:403']
  ])('un %s d’un sol testimoni és fallida d’eixa fila i el lot continua', async (_nom, dolenta, detall) => {
    m.revoca = (opcions) => (tokenDe(opcions) === refrescDe('A') ? dolenta : { status: 200, text: '' });
    const r = await buida(SECRET_CRON);
    expect(r).toMatchObject({ estat: 200, cos: { ok: true, fetes: 1, fallides: 1 } });
    expect(m.crides.filter((c) => c === 'apple revoke')).toHaveLength(2);
    expect(m.autoritzacions.get(PERSONES.A.id)).toMatchObject({ intents: 1, ultim_error: detall });
    nomesB();
  });

  test('una fila d’un altre client_id: el seu client_secret; si Apple el rebutja (invalid_client), és d’eixa fila i el lot continua', async () => {
    m.autoritzacions.get(PERSONES.A.id).client_id = CLIENT_ANTIC;
    m.revoca = (opcions) => (new URLSearchParams(opcions.body).get('client_id') === CLIENT_ANTIC
      ? { status: 400, text: JSON.stringify({ error: 'invalid_client' }) } : { status: 200, text: '' });
    const r = await buida(SECRET_CRON);
    expect(r).toMatchObject({ estat: 200, cos: { ok: true, fetes: 1, fallides: 1 } });
    const [deA, deB] = m.cossos.filter((c) => c.etiqueta === 'apple revoke').map((c) => c.cos);
    expect([deA.client_id, subDelSecret(deA)]).toEqual([CLIENT_ANTIC, CLIENT_ANTIC]);
    expect([deB.client_id, subDelSecret(deB)]).toEqual([CLIENT, CLIENT]);
    expect(m.autoritzacions.get(PERSONES.A.id)).toMatchObject({ intents: 1, ultim_error: 'config:invalid_client' });
    nomesB();
  });

  test('una clau dels testimonis sense forma no val per a ningú: el lot para a la primera fila amb 503', async () => {
    const r = await buida(SECRET_CRON, { env: { APPLE_TESTIMONIS_CLAU: 'curta' } });
    expect(r).toMatchObject({ estat: 503, cos: { ok: false, error: 'config', fetes: 0, fallides: 1 } });
    expect(m.crides).toEqual(['rpc apple_revocacions_pendents', 'rpc apple_registra_revocacio']);
    expect(m.autoritzacions.size).toBe(2);
  });

  test('una clau privada que no es pot llegir para el lot abans de tocar cap fila', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await buida(SECRET_CRON, { env: { APPLE_PRIVATE_KEY: 'no és cap PEM' } });
    expect(r).toMatchObject({ estat: 503, cos: { ok: false, error: 'config' } });
    expect(m.crides).toEqual(['rpc apple_revocacions_pendents']);
    expect(m.autoritzacions.size).toBe(2);
    expect(error).toHaveBeenCalledWith('[compte-apple] Acció interrompuda:', 'buida', 'config');
    error.mockRestore();
  });
});

/* ── La frontera: el client no sap res dels secrets d'Apple ── */
const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(directori, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.isSymbolicLink()) continue;
    const ruta = path.join(directori, entrada.name);
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (entrada.isFile()) fitxers.push(ruta);
  }
  return fitxers;
}

describe('la frontera de src/ i el README', () => {
  test('cap fitxer de src/ nomena l’adreça d’Apple, una clau privada, els noms dels secrets ni el client_secret', () => {
    const vetats = ['appleid.apple.com', 'BEGIN PRIVATE KEY', 'APPLE_PRIVATE_KEY', 'APPLE_KEY_ID', 'client_secret'];
    const fitxers = fitxersDe(path.join(ARREL, 'src'));
    expect(fitxers.length).toBeGreaterThan(100);
    const trobats = [];
    for (const fitxer of fitxers) {
      const text = readFileSync(fitxer, 'latin1');
      for (const vetat of vetats) if (text.includes(vetat)) trobats.push(`${path.relative(ARREL, fitxer)} · ${vetat}`);
    }
    expect(trobats).toEqual([]);
  });

  test('el README de supabase/ explica els secrets, el desplegament, el buidatge, el camí manual i el tauler', () => {
    const readme = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
    const inici = readme.indexOf('## Funció `compte-apple` (revocació d\'Apple)');
    expect(inici, 'falta la secció').toBeGreaterThan(readme.indexOf('## Vincles'));
    /* Els salts de línia del paràgraf no compten. */
    const seccio = readme.slice(inici).replace(/\s+/g, ' ');
    for (const nom of ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_CLIENT_ID', 'APPLE_PRIVATE_KEY', 'APPLE_TESTIMONIS_CLAU', 'SDP_CRON_SECRET']) {
      expect(seccio, nom).toContain(nom);
    }
    expect(seccio).toContain('supabase functions deploy compte-apple --no-verify-jwt');
    expect(seccio).toContain('x-sdp-cron');
    expect(seccio).toMatch(/cada hora/);
    expect(seccio).toMatch(/\.p8/);
    expect(seccio).toMatch(/fora del repositori/);
    expect(seccio).toMatch(/revocació manual/i);
    expect(seccio).toContain('mai esborreu un usuari d\'Apple des del tauler');
    expect(readme).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  });
});
