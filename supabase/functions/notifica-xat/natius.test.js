// @vitest-environment node
/* B8-SERVIDOR · S3 (marató 261101_2143) · Els proveïdors natius de
   notifica-xat (natius.js): APNs amb JWT ES256 i FCM HTTP v1 amb OAuth RS256,
   preparats i inactius. Tot és sintètic: les claus (P-256 i RSA 2048) es
   generen ací, cap prova toca la xarxa i cap secret és de veres.
   Prova el text literal per llengua (idèntic a public/sw.js), els JWT
   verificats amb la clau pública, les peticions exactes, les dues taules de
   classificació (només APNs 410 i FCM 404 UNREGISTERED expulsen; mai
   BadDeviceToken, DeviceTokenNotForTopic ni SENDER_ID_MISMATCH: ARB-B8S-02),
   la caché de credencials (R3) lligada a la clau que la va fer
   (G1-B-doctr-02), els secrets absents o mal formats, i la integració amb el
   gestor real: deu aparells amb un error que pot ser de configuració no
   n'expulsen cap, i els testimonis dolents d'una persona no aturen els avisos
   dels altres (G1-B-seg-01). Cap testimoni, JWT, credencial ni clau ix al
   registre. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { aBase64, aBase64url, deBase64url } from '../_shared/apple.js';
import { creaGestor } from './gestor.js';
import {
  APNS, AVIS_NATIU, FCM, TEXTOS_AVIS, classificaApns, classificaFcm, codiFcm, compteDeServei, cosOAuth, credencialValida,
  creaEnviadorsNatius, demanaAccesFcm, esTestimoniApns, esTestimoniFcm, jwtApns, jwtApnsDeLaClau, jwtFcm, motiuApns, pemAPkcs8,
  peticioApns, peticioFcm, textDeLAvis
} from './natius.js';

const subtle = globalThis.crypto.subtle;
const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DIR = path.join(ARREL, 'supabase/functions/notifica-xat');

/* La marca del PEM, a trossos: l'escàner de secrets del repositori no ha de prendre esta prova per una clau. */
const ETIQUETA = ['PRIVATE', 'KEY'].join(' ');
const aPem = (der, etiqueta = ETIQUETA) => `-----BEGIN ${etiqueta}-----\n${aBase64(der).match(/.{1,64}/g).join('\n')}\n-----END ${etiqueta}-----\n`;
const ambBarresLiterals = (pem) => pem.replace(/\n/g, '\\n');

const EQUIP = 'EQUIP12345';
const CLAU_ID = 'CLAU000001';
const PROJECTE = 'sdp-proves-123';
const CORREU = `avisos@${PROJECTE}.iam.gserviceaccount.com`;
/* Canaris: cap d'estos valors no pot aparéixer al registre ni a la resposta. */
const IOS_T = 'ca5e'.repeat(16);
const AND_T = `canari_fcm_${'x'.repeat(32)}`;
const ACCES = `ya29.canari-acces_${'z'.repeat(40)}`;
const ARA = Date.UTC(2026, 10, 2, 1, 0, 0);
/* Un JWT d'APNs desat per una passada de fa deu minuts amb la clau d'ara (G1-B-doctr-02: la caché només creu els d'esta clau). */
let DESADA_APNS;

let EC;
let RSA;
let EC_ALTRE;
/* Una altra .p8 P-256 (la que el Mestre hauria posat per error amb el mateix kid). */
let EC_SEGONA;
beforeAll(async () => {
  const ec = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const altre = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-384' }, true, ['sign', 'verify']);
  const segona = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const rsa = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const derEc = new Uint8Array(await subtle.exportKey('pkcs8', ec.privateKey));
  EC = { publica: ec.publicKey, der: derEc, pem: aPem(derEc) };
  EC_ALTRE = { pem: aPem(new Uint8Array(await subtle.exportKey('pkcs8', altre.privateKey))) };
  EC_SEGONA = { pem: aPem(new Uint8Array(await subtle.exportKey('pkcs8', segona.privateKey))) };
  RSA = { publica: rsa.publicKey, pem: aPem(new Uint8Array(await subtle.exportKey('pkcs8', rsa.privateKey))) };
  DESADA_APNS = await jwtApns({ equip: EQUIP, clauId: CLAU_ID, clauPem: EC.pem, ara: ARA - 10 * 60 * 1000 });
});

/* L'empremta del compte de servei que encapçala el testimoni de FCM desat (G1-B-doctr-02):
   els 8 primers bytes de SHA-256(«correu|projecte»), en hexadecimal. */
const empremtaFcm = async (correu = CORREU, projecte = PROJECTE) => [...new Uint8Array(await subtle.digest('SHA-256', new TextEncoder().encode(`${correu}|${projecte}`)))]
  .slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');

const textDe = (bytes) => new TextDecoder().decode(bytes);
const llegixJwt = (jwt) => {
  const [c, r, s] = jwt.split('.');
  return { capcalera: JSON.parse(textDe(deBase64url(c))), reclams: JSON.parse(textDe(deBase64url(r))), signatura: deBase64url(s), dades: new TextEncoder().encode(`${c}.${r}`) };
};
const verificaEs256 = (jwt, publica) => { const j = llegixJwt(jwt); return subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publica, j.signatura, j.dades); };
const verificaRs256 = (jwt, publica) => { const j = llegixJwt(jwt); return subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, publica, j.signatura, j.dades); };

const compte = (extra = {}) => JSON.stringify({
  type: 'service_account', project_id: PROJECTE, private_key_id: 'id-de-la-clau', private_key: RSA.pem, client_email: CORREU,
  client_id: '1234567890', token_uri: 'https://evil.exemple.test/token', ...extra
});
const envApns = (extra = {}) => ({ SDP_APNS_EQUIP: EQUIP, SDP_APNS_CLAU_ID: CLAU_ID, SDP_APNS_CLAU_P8: EC.pem, ...extra });
const envFcm = (extra = {}) => ({ SDP_FCM_COMPTE_SERVEI: compte(), ...extra });

function creaRegistre() {
  const linies = [];
  const desa = (...args) => linies.push(args.map(String).join(' '));
  return { linies, info: desa, warn: desa, error: desa, log: desa };
}
let registre;
beforeEach(() => { registre = creaRegistre(); });

/* Un subtle que compta les signatures (per a saber si s'ha refet un JWT). */
function subtleQueCompta() {
  const compte = { signatures: 0 };
  return {
    compte,
    subtle: {
      importKey: (...a) => subtle.importKey(...a),
      exportKey: (...a) => subtle.exportKey(...a),
      verify: (...a) => subtle.verify(...a),
      digest: (...a) => subtle.digest(...a),
      sign: (...a) => { compte.signatures += 1; return subtle.sign(...a); }
    }
  };
}

const respon = ({ estat = 200, cos = null, cru = null, capcaleres = {} } = {}) => new Response(cru ?? (cos === null ? null : JSON.stringify(cos)), { status: estat, headers: capcaleres });
const errorFcm = (estat, errorCode, tipus = FCM.TIPUS_ERROR) => ({ estat, cos: { error: { code: estat, status: 'X', details: [{ '@type': tipus, errorCode }] } } });
const penja = (_, opcions) => new Promise((_resol, rebutja) => {
  opcions.signal.addEventListener('abort', () => rebutja(new Error('tallat')), { once: true });
});

/** El món fals dels natius: la caché de la base (rpc) i els tres serveis. */
function creaMon({ credencial = null, desa = true, apns = () => ({ estat: 200 }), fcm = () => ({ estat: 200 }), oauth = () => ({ estat: 200, cos: { access_token: ACCES, expires_in: 3599, token_type: 'Bearer' } }) } = {}) {
  const mon = {
    rpcs: [],
    crides: [],
    rpc: async (nom, cos) => {
      mon.rpcs.push({ nom, cos });
      if (nom === 'xat_push_credencial') return typeof credencial === 'function' ? credencial(cos, mon) : credencial;
      if (nom === 'xat_push_desa_credencial') return typeof desa === 'function' ? desa(cos, mon) : desa;
      throw new Error('rpc desconeguda');
    },
    fetch: async (url, opcions = {}) => {
      const crida = { url, opcions };
      mon.crides.push(crida);
      if (url === FCM.TOKEN) return respon(await oauth(crida));
      if (url.startsWith(`${APNS.PRODUCCIO}/`) || url.startsWith(`${APNS.SANDBOX}/`)) {
        const r = await apns(crida, opcions);
        return r instanceof Response ? r : respon(r);
      }
      if (url.startsWith(`${FCM.MISSATGES}/`)) {
        const r = await fcm(crida, opcions);
        return r instanceof Response ? r : respon(r);
      }
      throw new Error('xarxa no permesa');
    }
  };
  return mon;
}
const nomsRpc = (mon) => mon.rpcs.map((r) => r.nom);
const cridesA = (mon, prefix) => mon.crides.filter((c) => c.url.startsWith(prefix));
const enviadorsDe = (mon, env, extra = {}) => creaEnviadorsNatius({ env, fetch: mon.fetch, rpc: mon.rpc, ara: () => ARA, registre, topallMs: 200, ...extra });

describe('el text de l’avís: literal, en la llengua de la fila i idèntic a public/sw.js', () => {
  const sw = readFileSync(path.join(ARREL, 'public/sw.js'), 'utf8');

  test('TEXTOS_AVIS és exactament el bloc de sw.js (cinc llengües, títol i cos)', () => {
    const inici = sw.indexOf('const TEXTOS_AVIS = Object.freeze({');
    expect(inici).toBeGreaterThan(-1);
    const bloc = sw.slice(inici, sw.indexOf('});', inici));
    const llegits = Object.fromEntries([...bloc.matchAll(/(\w{2}): Object\.freeze\(\{ titol: '([^']+)', cos: '([^']+)' \}\)/g)].map((m) => [m[1], { titol: m[2], cos: m[3] }]));
    expect(Object.keys(llegits)).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    expect(llegits).toEqual(JSON.parse(JSON.stringify(TEXTOS_AVIS)));
    for (const { titol, cos } of Object.values(TEXTOS_AVIS)) {
      expect(sw).toContain(`titol: '${titol}', cos: '${cos}'`);
    }
    expect(Object.isFrozen(TEXTOS_AVIS) && Object.values(TEXTOS_AVIS).every(Object.isFrozen)).toBe(true);
  });

  test('l’etiqueta, el destí i el canal són els del client', () => {
    expect(sw).toContain(`const ETIQUETA_AVIS_XAT = '${AVIS_NATIU.ETIQUETA}';`);
    expect(sw).toContain(`const CAMI_DEL_XAT = '${AVIS_NATIU.DESTI}';`);
    const natiu = readFileSync(path.join(ARREL, 'src/natiu/avisosNatius.js'), 'utf8');
    expect(natiu).toContain(`export const CANAL_XAT = '${FCM.CANAL}';`);
    expect(AVIS_NATIU.TTL_S).toBe(86400);
  });

  test.each(Object.keys(TEXTOS_AVIS))('%s dona el seu text', (llengua) => {
    expect(textDeLAvis(llengua)).toBe(TEXTOS_AVIS[llengua]);
  });

  test.each([['zz'], [''], [null], [undefined], ['CA'], ['__proto__'], ['constructor'], ['toString'], [['ca']]])('%j cau en ca', (llengua) => {
    expect(textDeLAvis(llengua)).toBe(TEXTOS_AVIS.ca);
  });
});

describe('pemAPkcs8: el PKCS#8 de la .p8 i del compte de servei', () => {
  test('un PEM, amb «\\n» literals o amb CRLF, dona els mateixos bytes', () => {
    expect([...pemAPkcs8(EC.pem)]).toEqual([...EC.der]);
    expect([...pemAPkcs8(ambBarresLiterals(EC.pem))]).toEqual([...EC.der]);
    expect([...pemAPkcs8(EC.pem.replace(/\n/g, '\r\n'))]).toEqual([...EC.der]);
    expect([...pemAPkcs8(`  ${EC.pem}  `)]).toEqual([...EC.der]);
  });

  test.each([
    ['sense marca', () => aBase64(EC.der)],
    ['una clau SEC1', () => aPem(EC.der, `EC ${ETIQUETA}`)],
    ['una clau xifrada', () => aPem(EC.der, `ENCRYPTED ${ETIQUETA}`)],
    ['sense el final', () => EC.pem.slice(0, EC.pem.indexOf('-----END'))],
    ['el cos buit', () => `-----BEGIN ${ETIQUETA}-----\n-----END ${ETIQUETA}-----`],
    ['base64 amb brossa', () => EC.pem.replace(/\n(.)/, '\n*$1')],
    ['base64 de llargària dolenta', () => EC.pem.replace(/\n(.)/, '\n$1A')],
    ['un número', () => 42],
    ['null', () => null]
  ])('%s llança config sense repetir el valor', (_, fes) => {
    const entrada = fes();
    let error = null;
    try { pemAPkcs8(entrada); } catch (e) { error = e; }
    expect(error?.codi).toBe('config');
    expect(error.message).not.toContain(aBase64(EC.der).slice(0, 20));
  });
});

describe('jwtApns: ES256 amb { alg, kid } · { iss, iat }', () => {
  test.each([['PEM', () => EC.pem], ['PEM amb «\\n» literals', () => ambBarresLiterals(EC.pem)]])('amb %s verifica amb la pública', async (_, pem) => {
    const jwt = await jwtApns({ equip: EQUIP, clauId: CLAU_ID, clauPem: pem(), ara: ARA + 999 });
    const { capcalera, reclams, signatura } = llegixJwt(jwt);
    expect(capcalera).toEqual({ alg: 'ES256', kid: CLAU_ID });
    expect(reclams).toEqual({ iss: EQUIP, iat: Math.floor(ARA / 1000) });
    expect(signatura).toHaveLength(64);
    expect(await verificaEs256(jwt, EC.publica)).toBe(true);
  });

  test.each([
    ['un equip en minúscules', { equip: 'equip12345' }],
    ['un equip curt', { equip: 'EQUIP1234' }],
    ['una clau amb guió', { clauId: 'CLAU-00001' }],
    ['una clau que no és PEM', { clauPem: 'no-és-una-clau' }],
    ['una clau RSA', { clauPem: 'RSA' }],
    ['una clau P-384', { clauPem: 'P384' }]
  ])('%s: config', async (_, extra) => {
    const clauPem = extra.clauPem === 'RSA' ? RSA.pem : extra.clauPem === 'P384' ? EC_ALTRE.pem : (extra.clauPem ?? EC.pem);
    await expect(jwtApns({ equip: EQUIP, clauId: CLAU_ID, ara: ARA, ...extra, clauPem })).rejects.toMatchObject({ codi: 'config' });
  });
});

describe('peticioApns: URL, capçaleres i un cos amb només aps i sdp', () => {
  const peticio = (extra = {}) => peticioApns({ entorn: 'produccio', topic: APNS.TOPIC_PER_DEFECTE, testimoni: IOS_T, jwt: 'JWT', llengua: 'en', ara: ARA + 500, ...extra });

  test('producció i sandbox', () => {
    expect(peticio().url).toBe(`https://api.push.apple.com/3/device/${IOS_T}`);
    expect(peticio({ entorn: 'sandbox' }).url).toBe(`https://api.sandbox.push.apple.com/3/device/${IOS_T}`);
    expect(APNS).toEqual({ PRODUCCIO: 'https://api.push.apple.com', SANDBOX: 'https://api.sandbox.push.apple.com', DURADA_CREDENCIAL_S: 3000, TOPIC_PER_DEFECTE: 'org.socdepoble.app' });
  });

  test('les capçaleres exactes, POST i redirect: error', () => {
    const { opcions } = peticio();
    expect(opcions.method).toBe('POST');
    expect(opcions.redirect).toBe('error');
    expect(opcions.headers).toEqual({
      authorization: 'bearer JWT',
      'apns-topic': 'org.socdepoble.app',
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'apns-expiration': String(Math.floor(ARA / 1000) + 86400),
      'apns-collapse-id': 'sdp-xat',
      'content-type': 'application/json'
    });
  });

  test.each(Object.keys(TEXTOS_AVIS))('el cos en %s: el text literal, cap fil, remitent ni loc-key', (llengua) => {
    const { opcions } = peticio({ llengua });
    const cos = JSON.parse(opcions.body);
    expect(Object.keys(cos)).toEqual(['aps', 'sdp']);
    expect(cos).toEqual({
      aps: { alert: { title: TEXTOS_AVIS[llengua].titol, body: TEXTOS_AVIS[llengua].cos }, badge: 1, sound: 'default', 'thread-id': 'sdp-xat' },
      sdp: { v: 1, desti: '/xat' }
    });
    expect(opcions.body).not.toMatch(/loc-key|loc_key|fil|remitent/i);
  });

  test.each([
    ['majúscules', IOS_T.toUpperCase()], ['63 caràcters', IOS_T.slice(1)], ['201 caràcters', 'a'.repeat(201)],
    ['un camí', `${IOS_T.slice(0, 60)}/../x`], ['un testimoni de FCM', AND_T], ['un número', 7], ['null', null]
  ])('un testimoni amb %s no fa cap petició', (_, testimoni) => {
    expect(peticio({ testimoni })).toBeNull();
    expect(esTestimoniApns(testimoni)).toBe(false);
  });
});

describe('classificaApns: només el 410 expulsa (ARB-B8S-02, D-B8S-13)', () => {
  test.each([
    [200, null, 'enviat'],
    [410, 'Unregistered', 'expulsa'], [410, 'ExpiredToken', 'expulsa'], [410, null, 'expulsa'],
    [400, 'BadDeviceToken', 'rebutjat'], [400, 'DeviceTokenNotForTopic', 'rebutjat'],
    [400, 'BadTopic', 'rebutjat'], [400, 'TopicDisallowed', 'rebutjat'], [400, 'MissingTopic', 'rebutjat'],
    [400, 'BadCollapseId', 'fallit'], [400, 'PayloadEmpty', 'fallit'], [400, null, 'fallit'],
    [403, 'ExpiredProviderToken', 'config'], [403, 'InvalidProviderToken', 'config'], [403, 'BadCertificateEnvironment', 'config'], [403, null, 'config'],
    [404, 'BadPath', 'fallit'], [405, 'MethodNotAllowed', 'fallit'], [413, 'PayloadTooLarge', 'fallit'],
    [429, 'TooManyProviderTokenUpdates', 'ritme'], [429, 'TooManyRequests', 'reintenta'], [429, null, 'ritme'],
    [500, 'InternalServerError', 'reintenta'], [503, 'ServiceUnavailable', 'reintenta'], [0, null, 'reintenta']
  ])('%i %s → %s', (estat, motiu, esperat) => {
    expect(classificaApns(estat, motiu)).toBe(esperat);
  });

  test('cap altre estat ni motiu no expulsa mai', () => {
    const motius = [null, 'BadDeviceToken', 'DeviceTokenNotForTopic', 'Unregistered', 'ExpiredToken', 'BadPath', 'Shutdown'];
    for (let estat = 100; estat <= 599; estat++) {
      for (const motiu of motius) {
        if (estat !== 410) expect(classificaApns(estat, motiu), `${estat} ${motiu}`).not.toBe('expulsa');
      }
    }
  });

  test('motiuApns: només un nom de motiu', () => {
    expect(motiuApns({ reason: 'BadDeviceToken' })).toBe('BadDeviceToken');
    for (const cos of [null, 'BadDeviceToken', { reason: 'Bad Device' }, { reason: 'a'.repeat(65) }, { reason: 5 }, { motiu: 'x' }, []]) {
      expect(motiuApns(cos)).toBeNull();
    }
  });
});

describe('compteDeServei: la forma del JSON de Firebase', () => {
  test('un compte vàlid dona només el projecte, el correu i la clau (mai el token_uri)', () => {
    expect(compteDeServei(compte())).toEqual({ projecte: PROJECTE, correu: CORREU, clauPem: RSA.pem });
    expect(compteDeServei(`\n ${compte()} \n`)).toEqual({ projecte: PROJECTE, correu: CORREU, clauPem: RSA.pem });
  });

  test.each([
    ['sense type', { type: undefined }],
    ['un altre type', { type: 'authorized_user' }],
    ['un correu que no és de compte de servei', { client_email: 'algu@gmail.com' }],
    ['un correu amb el sufix al mig', { client_email: `x@${PROJECTE}.iam.gserviceaccount.com.evil.test` }],
    ['un correu en majúscules', { client_email: CORREU.toUpperCase() }],
    ['un correu sense arrova', { client_email: `${PROJECTE}.iam.gserviceaccount.com` }],
    ['un projecte amb majúscula', { project_id: 'Sdp-proves-123' }],
    ['un projecte curt', { project_id: 'sdp' }],
    ['un projecte amb barra', { project_id: 'sdp-proves/../x' }],
    ['un projecte acabat en guió', { project_id: 'sdp-proves-' }],
    ['sense clau', { private_key: undefined }],
    ['una clau que no és PEM', { private_key: 'xyz' }]
  ])('%s: null', (_, extra) => {
    expect(compteDeServei(compte(extra))).toBeNull();
  });

  test.each([
    ['no és JSON', () => '{type:'], ['una llista', () => '[]'], ['null', () => 'null'],
    ['massa llarg', () => compte({ farciment: 'x'.repeat(17000) })], ['buit', () => ''], ['un número', () => 5]
  ])('%s: null', (_, text) => {
    expect(compteDeServei(text())).toBeNull();
  });
});

describe('jwtFcm i l’intercanvi OAuth', () => {
  test('jwtFcm: RS256 · { iss, scope, aud, iat, exp: iat + 3600 }, verifica amb la pública', async () => {
    const jwt = await jwtFcm({ correu: CORREU, clauPem: RSA.pem, ara: ARA + 700 });
    const { capcalera, reclams } = llegixJwt(jwt);
    expect(capcalera).toEqual({ alg: 'RS256', typ: 'JWT' });
    const iat = Math.floor(ARA / 1000);
    expect(reclams).toEqual({ iss: CORREU, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 });
    expect(await verificaRs256(jwt, RSA.publica)).toBe(true);
  });

  test.each([['una clau P-256', { clauPem: 'EC' }], ['un correu dolent', { correu: 'algu@gmail.com' }], ['una clau que no és PEM', { clauPem: 'x' }]])('jwtFcm amb %s: config', async (_, extra) => {
    const clauPem = extra.clauPem === 'EC' ? EC.pem : (extra.clauPem ?? RSA.pem);
    await expect(jwtFcm({ correu: CORREU, ara: ARA, ...extra, clauPem })).rejects.toMatchObject({ codi: 'config' });
  });

  test('l’intercanvi rep el formulari exacte, a l’URL fixa, i torna el testimoni i la vida', async () => {
    const jwt = await jwtFcm({ correu: CORREU, clauPem: RSA.pem, ara: ARA });
    const mon = creaMon();
    expect(await demanaAccesFcm({ jwt, fetch: mon.fetch, topallMs: 200 })).toEqual({ acces: ACCES, vidaS: 3599 });
    expect(mon.crides).toHaveLength(1);
    const [{ url, opcions }] = mon.crides;
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(opcions.method).toBe('POST');
    expect(opcions.redirect).toBe('error');
    expect(opcions.headers).toEqual({ 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' });
    expect(opcions.body).toBe(`grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`);
    expect([...new URLSearchParams(opcions.body).keys()]).toEqual(['grant_type', 'assertion']);
    expect(cosOAuth('a.b.c').toString()).toBe('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=a.b.c');
    expect(opcions.signal).toBeInstanceOf(AbortSignal);
  });

  test.each([
    ['expires_in de més d’una hora es retalla', { access_token: ACCES, expires_in: 7200 }, 3600],
    ['sense expires_in, vida 0', { access_token: ACCES }, 0],
    ['un expires_in que no és enter, vida 0', { access_token: ACCES, expires_in: '3599' }, 0]
  ])('%s', async (_, cos, vida) => {
    const mon = creaMon({ oauth: () => ({ estat: 200, cos }) });
    expect(await demanaAccesFcm({ jwt: 'a.b.c', fetch: mon.fetch, topallMs: 200 })).toEqual({ acces: ACCES, vidaS: vida });
  });

  test.each([
    ['400 invalid_grant', () => ({ estat: 400, cos: { error: 'invalid_grant' } }), 'config'],
    ['401', () => ({ estat: 401 }), 'config'],
    ['403', () => ({ estat: 403 }), 'config'],
    ['404', () => ({ estat: 404 }), 'config'],
    ['un 200 sense testimoni', () => ({ estat: 200, cos: { token_type: 'Bearer' } }), 'config'],
    ['un 200 amb un testimoni que la base no pot desar', () => ({ estat: 200, cos: { access_token: 'amb espais i massa curt' } }), 'config'],
    ['un 200 de més de 16 KiB', () => ({ estat: 200, cos: { access_token: ACCES, farciment: 'x'.repeat(17000) } }), 'config'],
    ['429', () => ({ estat: 429 }), 'reintenta'],
    ['503', () => ({ estat: 503 }), 'reintenta']
  ])('%s → %s', async (_, oauth, codi) => {
    const mon = creaMon({ oauth });
    await expect(demanaAccesFcm({ jwt: 'a.b.c', fetch: mon.fetch, topallMs: 200 })).rejects.toMatchObject({ codi });
  });

  test('la xarxa i el topall → reintenta', async () => {
    await expect(demanaAccesFcm({ jwt: 'a.b.c', fetch: async () => { throw new Error('xarxa'); }, topallMs: 200 })).rejects.toMatchObject({ codi: 'reintenta' });
    const inici = Date.now();
    await expect(demanaAccesFcm({ jwt: 'a.b.c', fetch: penja, topallMs: 30 })).rejects.toMatchObject({ codi: 'reintenta' });
    expect(Date.now() - inici).toBeLessThan(2000);
  });
});

describe('peticioFcm i classificaFcm', () => {
  test.each(Object.keys(TEXTOS_AVIS))('el cos exacte en %s', (llengua) => {
    const p = peticioFcm({ projecte: PROJECTE, testimoni: AND_T, accessToken: ACCES, llengua });
    expect(p.url).toBe(`https://fcm.googleapis.com/v1/projects/${PROJECTE}/messages:send`);
    expect(p.opcions.method).toBe('POST');
    expect(p.opcions.redirect).toBe('error');
    expect(p.opcions.headers).toEqual({ authorization: `Bearer ${ACCES}`, 'content-type': 'application/json' });
    expect(JSON.parse(p.opcions.body)).toEqual({
      message: {
        token: AND_T,
        notification: { title: TEXTOS_AVIS[llengua].titol, body: TEXTOS_AVIS[llengua].cos },
        android: { priority: 'HIGH', ttl: '86400s', collapse_key: 'sdp-xat', notification: { tag: 'sdp-xat', channel_id: 'xat' } },
        data: { desti: '/xat' }
      }
    });
    expect(p.opcions.body).not.toMatch(/loc_key|loc-key|fil|remitent/i);
  });

  test.each([
    ['un projecte amb barra', { projecte: 'sdp-proves/../x' }], ['un testimoni curt', { testimoni: 'x'.repeat(31) }],
    ['un testimoni amb barra', { testimoni: `${AND_T}/x` }], ['un testimoni de 1.025', { testimoni: 'x'.repeat(1025) }]
  ])('%s: null', (_, extra) => {
    expect(peticioFcm({ projecte: PROJECTE, testimoni: AND_T, accessToken: ACCES, llengua: 'ca', ...extra })).toBeNull();
  });

  test('esTestimoniFcm', () => {
    expect(esTestimoniFcm(AND_T)).toBe(true);
    expect(esTestimoniFcm('a:b_c-d'.repeat(5))).toBe(true);
    for (const t of ['x'.repeat(31), 'x'.repeat(1025), `${AND_T} `, `${AND_T}.`, null]) expect(esTestimoniFcm(t)).toBe(false);
  });

  test.each([
    [200, null, 'enviat'],
    [404, 'UNREGISTERED', 'expulsa'],
    [404, null, 'fallit'], [404, 'INVALID_ARGUMENT', 'fallit'],
    [403, 'SENDER_ID_MISMATCH', 'rebutjat'],
    [403, null, 'config'], [403, 'THIRD_PARTY_AUTH_ERROR', 'rebutjat'], [401, 'THIRD_PARTY_AUTH_ERROR', 'rebutjat'], [401, 'SENDER_ID_MISMATCH', 'rebutjat'],
    [401, null, 'config'], [403, 'PERMISSION_DENIED', 'config'],
    [400, 'INVALID_ARGUMENT', 'fallit'], [400, 'UNREGISTERED', 'fallit'], [400, null, 'fallit'],
    [429, 'QUOTA_EXCEEDED', 'ritme'], [500, 'INTERNAL', 'reintenta'], [503, 'UNAVAILABLE', 'reintenta'], [0, null, 'reintenta']
  ])('%i %s → %s', (estat, codi, esperat) => {
    expect(classificaFcm(estat, codi)).toBe(esperat);
  });

  test('només el 404 UNREGISTERED expulsa', () => {
    for (let estat = 100; estat <= 599; estat++) {
      for (const codi of [null, 'UNREGISTERED', 'SENDER_ID_MISMATCH', 'INVALID_ARGUMENT', 'NOT_FOUND']) {
        if (!(estat === 404 && codi === 'UNREGISTERED')) expect(classificaFcm(estat, codi), `${estat} ${codi}`).not.toBe('expulsa');
      }
    }
  });

  test('codiFcm llig només el detall FcmError', () => {
    expect(codiFcm(errorFcm(404, 'UNREGISTERED').cos)).toBe('UNREGISTERED');
    expect(codiFcm({ error: { details: [{ '@type': 'type.googleapis.com/google.rpc.BadRequest' }, { '@type': FCM.TIPUS_ERROR, errorCode: 'SENDER_ID_MISMATCH' }] } })).toBe('SENDER_ID_MISMATCH');
    for (const cos of [
      { error: { details: [{ errorCode: 'UNREGISTERED' }] } }, errorFcm(404, 'UNREGISTERED', 'type.googleapis.com/altra.Error').cos, errorFcm(404, 'unregistered').cos,
      { error: { details: { errorCode: 'UNREGISTERED' } } }, { error: 'UNREGISTERED' }, null, 'UNREGISTERED'
    ]) {
      expect(codiFcm(cos)).toBeNull();
    }
  });
});

describe('creaEnviadorsNatius: preparats i inactius (D-B8S-10)', () => {
  test('sense cap secret: {} i ni una crida, ni a la base ni a la xarxa, ni cap línia', async () => {
    for (const env of [{}, undefined, null, { SDP_APNS_TOPIC: 'org.socdepoble.app', SDP_APNS_ENTORN: 'sandbox' }, { SDP_FCM_COMPTE_SERVEI: '   ' }]) {
      const mon = creaMon();
      const enviadors = await enviadorsDe(mon, env);
      expect(enviadors).toEqual({});
      expect(mon.rpcs).toEqual([]);
      expect(mon.crides).toEqual([]);
    }
    expect(registre.linies).toEqual([]);
  });

  test('cada proveïdor apareix només amb tots els seus secrets vàlids, i la creació no busca res', async () => {
    const casos = [[envApns(), ['apns']], [envFcm(), ['fcm']], [{ ...envApns(), ...envFcm() }, ['apns', 'fcm']]];
    for (const [env, claus] of casos) {
      const mon = creaMon();
      const enviadors = await enviadorsDe(mon, env);
      expect(Object.keys(enviadors).sort()).toEqual(claus);
      for (const clau of claus) expect(typeof enviadors[clau]).toBe('function');
      expect(mon.rpcs).toEqual([]);
      expect(mon.crides).toEqual([]);
    }
  });

  test('sense rpc (la caché de credencials) no hi ha cap proveïdor', async () => {
    const mon = creaMon();
    expect(await creaEnviadorsNatius({ env: { ...envApns(), ...envFcm() }, fetch: mon.fetch, registre })).toEqual({});
    expect(registre.linies.join('\n')).toContain('falta la caché de credencials');
  });

  test.each([
    ['SDP_APNS_EQUIP', { SDP_APNS_EQUIP: 'canari-equip' }],
    ['SDP_APNS_CLAU_ID', { SDP_APNS_CLAU_ID: 'CANARI' }],
    ['SDP_APNS_CLAU_P8', { SDP_APNS_CLAU_P8: 'canari-clau-p8-que-no-es-pem' }],
    ['SDP_APNS_CLAU_P8', { SDP_APNS_CLAU_P8: 'RSA' }],
    ['SDP_APNS_CLAU_P8', { SDP_APNS_CLAU_P8: 'P384' }],
    ['SDP_APNS_TOPIC', { SDP_APNS_TOPIC: 'canari..topic' }],
    ['SDP_APNS_TOPIC', { SDP_APNS_TOPIC: 'canari topic' }],
    ['SDP_APNS_ENTORN', { SDP_APNS_ENTORN: 'canari-production' }],
    ['SDP_APNS_CLAU_ID', { SDP_APNS_CLAU_ID: undefined }]
  ])('un %s mal format: APNs absent i el registre diu el nom, mai el valor', async (nom, extra) => {
    const mon = creaMon();
    const claus = { RSA: () => RSA.pem, P384: () => EC_ALTRE.pem };
    const env = envApns(claus[extra.SDP_APNS_CLAU_P8] ? { SDP_APNS_CLAU_P8: claus[extra.SDP_APNS_CLAU_P8]() } : extra);
    const enviadors = await enviadorsDe(mon, { ...env, ...envFcm() });
    expect(Object.keys(enviadors)).toEqual(['fcm']);
    const text = registre.linies.join('\n');
    expect(text).toContain(`APNs inactiu: ${nom}`);
    expect(text).not.toMatch(/canari|BEGIN|MII/i);
  });

  test('un compte de servei mal format: FCM absent i el registre no en diu cap valor', async () => {
    for (const valor of [compte({ client_email: 'canari@gmail.com' }), compte({ private_key: EC.pem }), '{"canari": true}', 'canari-no-json']) {
      registre = creaRegistre();
      const mon = creaMon();
      const enviadors = await enviadorsDe(mon, { ...envApns(), SDP_FCM_COMPTE_SERVEI: valor });
      expect(Object.keys(enviadors)).toEqual(['apns']);
      const text = registre.linies.join('\n');
      expect(text).toContain('FCM inactiu: SDP_FCM_COMPTE_SERVEI no vàlid.');
      expect(text).not.toMatch(/canari|BEGIN|MII|sdp-proves/i);
    }
  });
});

describe('la caché de credencials: com a molt una per proveïdor i passada (R3)', () => {
  test('APNs amb una credencial vigent: la usa i no refà cap JWT', async () => {
    const espia = subtleQueCompta();
    const mon = creaMon({ credencial: DESADA_APNS });
    const { apns } = await enviadorsDe(mon, envApns(), { subtle: espia.subtle });
    expect(await apns({ adreca: IOS_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(espia.compte.signatures).toBe(0);
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial']);
    expect(mon.rpcs[0].cos).toEqual({ p_proveidor: 'apns' });
    expect(mon.crides[0].opcions.headers.authorization).toBe(`bearer ${DESADA_APNS}`);
  });

  test('APNs sense credencial: en fa una, la desa amb 50 minuts i deu aparells alhora la comparteixen', async () => {
    const espia = subtleQueCompta();
    const mon = creaMon();
    const { apns } = await enviadorsDe(mon, envApns(), { subtle: espia.subtle });
    const resultats = await Promise.all(Array.from({ length: 10 }, () => apns({ adreca: IOS_T, llengua: 'es' })));
    expect(resultats.every((r) => r.resultat === 'enviat')).toBe(true);
    expect(espia.compte.signatures).toBe(1);
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial']);
    const { p_proveidor: proveidor, p_valor: valor, p_caduca_al: caducaAl } = mon.rpcs[1].cos;
    expect(proveidor).toBe('apns');
    expect(caducaAl).toBe(new Date(ARA + 3000 * 1000).toISOString());
    expect(Date.parse(caducaAl) - ARA).toBeLessThanOrEqual(50 * 60 * 1000);
    expect(await verificaEs256(valor, EC.publica)).toBe(true);
    expect(credencialValida(valor)).toBe(true);
    expect(new Set(mon.crides.map((c) => c.opcions.headers.authorization))).toEqual(new Set([`bearer ${valor}`]));
  });

  test('si una altra passada n’ha desada una que dura més, s’usa eixa', async () => {
    let lectures = 0;
    const mon = creaMon({ credencial: () => (++lectures === 1 ? null : DESADA_APNS), desa: false });
    const { apns } = await enviadorsDe(mon, envApns());
    await apns({ adreca: IOS_T, llengua: 'ca' });
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial', 'xat_push_credencial']);
    expect(mon.crides[0].opcions.headers.authorization).toBe(`bearer ${DESADA_APNS}`);
  });

  test.each([
    ['la lectura falla', { credencial: () => { throw new Error('base'); } }, ['xat_push_credencial'], 0],
    ['el desament falla', { desa: () => { throw new Error('base'); } }, ['xat_push_credencial', 'xat_push_desa_credencial'], 1]
  ])('APNs: si %s, reintenta i no s’envia res amb una credencial sense desar', async (_, opcions, rpcs, signatures) => {
    const espia = subtleQueCompta();
    const mon = creaMon(opcions);
    const { apns } = await enviadorsDe(mon, envApns(), { subtle: espia.subtle });
    const resultats = await Promise.all([1, 2, 3].map(() => apns({ adreca: IOS_T, llengua: 'ca' })));
    expect(resultats).toEqual(Array(3).fill({ resultat: 'reintenta', estat: 0 }));
    expect(nomsRpc(mon)).toEqual(rpcs);
    expect(espia.compte.signatures).toBe(signatures);
    expect(mon.crides).toEqual([]);
    expect(registre.linies.join('\n')).toContain('apns: sense credencial (reintenta)');
  });

  /* ARB-N02-02: un desament fals vol dir que una altra passada en té una de
     més llarga; si no es pot rellegir, la nova (sense desar) no s'usa. */
  test.each([
    ['la relectura falla', () => { throw new Error('base 503'); }],
    ['la relectura no en torna cap de vigent', () => null]
  ])('APNs: desament fals i %s → reintenta, cap enviament amb el JWT sense desar', async (_, segona) => {
    const espia = subtleQueCompta();
    let lectures = 0;
    const mon = creaMon({ credencial: (cos, m) => (++lectures === 1 ? null : segona(cos, m)), desa: false });
    const { apns } = await enviadorsDe(mon, envApns(), { subtle: espia.subtle });
    const resultats = [];
    for (let i = 0; i < 3; i++) resultats.push(await apns({ adreca: IOS_T, llengua: 'ca' }));
    expect(resultats).toEqual(Array(3).fill({ resultat: 'reintenta', estat: 0 }));
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial', 'xat_push_credencial']);
    expect(espia.compte.signatures).toBe(1);
    expect(mon.crides).toEqual([]);
  });

  /* ARB-N02-01: la promesa és una per passada també quan falla. Els aparells
     SEQÜENCIALS (no alhora) no tornen a demanar la credencial. */
  test.each([
    ['APNs amb la lectura de la base caiguda', 'apns', { credencial: () => { throw new Error('base'); } }, 'reintenta', ['xat_push_credencial'], 0],
    ['FCM amb l’OAuth a 503', 'fcm', { oauth: () => ({ estat: 503 }) }, 'reintenta', ['xat_push_credencial'], 1],
    ['FCM amb l’OAuth rebutjat (400)', 'fcm', { oauth: () => ({ estat: 400, cos: { error: 'invalid_grant' } }) }, 'config', ['xat_push_credencial'], 1],
    ['FCM amb el desament caigut', 'fcm', { desa: () => { throw new Error('base'); } }, 'reintenta', ['xat_push_credencial', 'xat_push_desa_credencial'], 1]
  ])('%s: tres aparells seqüencials, una sola lectura, un sol intercanvi i un sol avís', async (_, proveidor, opcions, esperat, rpcs, intercanvis) => {
    const mon = creaMon(opcions);
    const enviadors = await enviadorsDe(mon, proveidor === 'apns' ? envApns() : envFcm());
    const resultats = [];
    for (let i = 0; i < 3; i++) resultats.push(await enviadors[proveidor]({ adreca: proveidor === 'apns' ? IOS_T : AND_T, llengua: 'ca' }));
    expect(resultats).toEqual(Array(3).fill({ resultat: esperat, estat: 0 }));
    expect(nomsRpc(mon)).toEqual(rpcs);
    expect(cridesA(mon, FCM.TOKEN)).toHaveLength(intercanvis);
    expect(cridesA(mon, FCM.MISSATGES)).toEqual([]);
    expect(cridesA(mon, APNS.PRODUCCIO)).toEqual([]);
    expect(registre.linies.filter((l) => l.includes('sense credencial'))).toEqual([`[notifica-xat] ${proveidor}: sense credencial (${esperat}).`]);
  });

  test.each([['massa curta', 'curta'], ['amb espais', `${'a'.repeat(20)} b`], ['un número', 42]])('una credencial desada %s no es creu: se’n fa una de nova', async (_, dolenta) => {
    const espia = subtleQueCompta();
    const mon = creaMon({ credencial: dolenta });
    const { apns } = await enviadorsDe(mon, envApns(), { subtle: espia.subtle });
    expect((await apns({ adreca: IOS_T, llengua: 'ca' })).resultat).toBe('enviat');
    expect(espia.compte.signatures).toBe(1);
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial']);
  });

  test('FCM amb una credencial vigent: cap JWT ni cap intercanvi OAuth', async () => {
    const espia = subtleQueCompta();
    const mon = creaMon({ credencial: `${await empremtaFcm()}.${ACCES}` });
    const { fcm } = await enviadorsDe(mon, envFcm(), { subtle: espia.subtle });
    expect(await fcm({ adreca: AND_T, llengua: 'gl' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(espia.compte.signatures).toBe(0);
    expect(cridesA(mon, FCM.TOKEN)).toEqual([]);
    expect(mon.rpcs).toEqual([{ nom: 'xat_push_credencial', cos: { p_proveidor: 'fcm' } }]);
  });

  test.each([[3599, 3299], [7200, 3300], [1000, 700]])('FCM sense credencial: amb expires_in %i la desa amb %i s de vida', async (expira, vida) => {
    const mon = creaMon({ oauth: () => ({ estat: 200, cos: { access_token: ACCES, expires_in: expira } }) });
    const { fcm } = await enviadorsDe(mon, envFcm());
    await Promise.all([1, 2, 3, 4].map(() => fcm({ adreca: AND_T, llengua: 'ca' })));
    expect(cridesA(mon, FCM.TOKEN)).toHaveLength(1);
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial']);
    expect(mon.rpcs[1].cos).toEqual({ p_proveidor: 'fcm', p_valor: `${await empremtaFcm()}.${ACCES}`, p_caduca_al: new Date(ARA + vida * 1000).toISOString() });
    expect(cridesA(mon, FCM.MISSATGES).map((c) => c.opcions.headers.authorization)).toEqual(Array(4).fill(`Bearer ${ACCES}`));
  });

  test('FCM amb un testimoni de menys de cinc minuts: s’usa en la passada i no es desa', async () => {
    const mon = creaMon({ oauth: () => ({ estat: 200, cos: { access_token: ACCES, expires_in: 200 } }) });
    const { fcm } = await enviadorsDe(mon, envFcm());
    expect((await fcm({ adreca: AND_T, llengua: 'ca' })).resultat).toBe('enviat');
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial']);
  });

  test('FCM amb l’OAuth rebutjat: config per a tots, un sol intercanvi i cap enviament', async () => {
    const mon = creaMon({ oauth: () => ({ estat: 400, cos: { error: 'invalid_grant' } }) });
    const { fcm } = await enviadorsDe(mon, envFcm());
    const resultats = await Promise.all([1, 2, 3].map(() => fcm({ adreca: AND_T, llengua: 'ca' })));
    expect(resultats).toEqual(Array(3).fill({ resultat: 'config', estat: 0 }));
    expect(cridesA(mon, FCM.TOKEN)).toHaveLength(1);
    expect(cridesA(mon, FCM.MISSATGES)).toEqual([]);
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial']);
  });

  test('el token_uri del compte de servei no es busca mai: l’intercanvi va sempre a FCM.TOKEN', async () => {
    const mon = creaMon();
    const { fcm } = await enviadorsDe(mon, envFcm());
    await fcm({ adreca: AND_T, llengua: 'ca' });
    expect(mon.crides.map((c) => c.url)).toEqual([FCM.TOKEN, `${FCM.MISSATGES}/${PROJECTE}/messages:send`]);
  });
});

/* G1-B-doctr-02 (Gauntlet 1, P3): la credencial desada va lligada a la clau
   que la va fer. Si el Mestre rota o corregix SDP_APNS_CLAU_ID, SDP_APNS_EQUIP,
   la .p8 o el compte de servei de FCM, la desada no es creu i se'n fa una de
   nova, que la base accepta perquè dura més (desa només si dura més). */
describe('G1-B-doctr-02: la credencial desada va lligada a la clau que la va fer', () => {
  const ACCES_NOU = `ya29.canari-nou_${'n'.repeat(40)}`;
  const COMPTE_B = { project_id: 'sdp-altre-456', client_email: 'avisos@sdp-altre-456.iam.gserviceaccount.com' };
  /* Una base en memòria amb la semàntica del prototip: desa només si la nova dura més. */
  const baseDeCredencials = (inicial = null) => {
    const b = { fila: inicial };
    return {
      b,
      credencial: () => b.fila?.valor ?? null,
      desa: (cos) => {
        if (b.fila && Date.parse(b.fila.caducaAl) >= Date.parse(cos.p_caduca_al)) return false;
        b.fila = { valor: cos.p_valor, caducaAl: cos.p_caduca_al };
        return true;
      }
    };
  };

  test.each([
    ['un altre kid (SDP_APNS_CLAU_ID rotat o corregit)', { clauId: 'VELLAAAAAA' }],
    ['un altre equip (SDP_APNS_EQUIP canviat)', { equip: 'ALTRE12345' }],
    ['una altra .p8 amb el mateix kid (la clau corregida)', { clauPem: 'SEGONA' }]
  ])('APNs amb una credencial desada d’%s: no es creu, se’n fa una amb la clau d’ara, es desa i s’envia amb ella', async (_, extra) => {
    const clauPem = extra.clauPem === 'SEGONA' ? EC_SEGONA.pem : EC.pem;
    const vella = await jwtApns({ equip: EQUIP, clauId: CLAU_ID, ara: ARA - 10 * 60 * 1000, ...extra, clauPem });
    const base = baseDeCredencials({ valor: vella, caducaAl: new Date(ARA + 40 * 60 * 1000).toISOString() });
    const mon = creaMon(base);
    const { apns } = await enviadorsDe(mon, envApns());
    expect(await apns({ adreca: IOS_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial']);
    const nova = mon.rpcs[1].cos.p_valor;
    expect(nova).not.toBe(vella);
    expect(llegixJwt(nova).capcalera).toEqual({ alg: 'ES256', kid: CLAU_ID });
    expect(llegixJwt(nova).reclams.iss).toBe(EQUIP);
    expect(await verificaEs256(nova, EC.publica)).toBe(true);
    expect(base.b.fila.valor).toBe(nova);
    expect(mon.crides.map((c) => c.opcions.headers.authorization)).toEqual([`bearer ${nova}`]);
    expect(registre.linies.join('\n')).not.toMatch(/eyJ|VELLA|ALTRE/);
  });

  test('APNs: la credencial que fa una passada la creu la següent, sense refer cap JWT (R3: el 429 d’Apple)', async () => {
    const base = baseDeCredencials();
    const primera = creaMon(base);
    await (await enviadorsDe(primera, envApns())).apns({ adreca: IOS_T, llengua: 'ca' });
    expect(nomsRpc(primera)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial']);
    const espia = subtleQueCompta();
    const segona = creaMon(base);
    const { apns } = await enviadorsDe(segona, envApns(), { subtle: espia.subtle, ara: () => ARA + 60 * 1000 });
    expect(await apns({ adreca: IOS_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(nomsRpc(segona)).toEqual(['xat_push_credencial']);
    expect(espia.compte.signatures).toBe(0);
    expect(segona.crides[0].opcions.headers.authorization).toBe(`bearer ${base.b.fila.valor}`);
  });

  test('APNs: si el runtime no pot derivar la pública de la .p8, només es miren el kid i l’equip, i la desada d’ara es creu (cap JWT nou)', async () => {
    const espia = subtleQueCompta();
    const senseExportar = { ...espia.subtle, exportKey: () => Promise.reject(new Error('no exportable')) };
    const mon = creaMon({ credencial: DESADA_APNS });
    const { apns } = await enviadorsDe(mon, envApns(), { subtle: senseExportar });
    expect(await apns({ adreca: IOS_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial']);
    expect(espia.compte.signatures).toBe(0);
  });

  test('jwtApnsDeLaClau: només un JWT ES256 amb el kid, l’equip i la signatura d’ara; cap forma estranya llança', async () => {
    const der = pemAPkcs8(EC.pem);
    const extraible = await subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
    const { x, y } = await subtle.exportKey('jwk', extraible);
    const verificadora = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x, y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const clau = { equip: EQUIP, clauId: CLAU_ID, verificadora };
    expect(await jwtApnsDeLaClau(DESADA_APNS, clau)).toBe(true);
    expect(await jwtApnsDeLaClau(DESADA_APNS, { equip: EQUIP, clauId: CLAU_ID })).toBe(true);
    const [c, r, s] = DESADA_APNS.split('.');
    const b64 = (o) => aBase64url(new TextEncoder().encode(JSON.stringify(o)));
    const dolents = [
      ['un altre kid', await jwtApns({ equip: EQUIP, clauId: 'VELLAAAAAA', clauPem: EC.pem, ara: ARA })],
      ['un altre equip', await jwtApns({ equip: 'ALTRE12345', clauId: CLAU_ID, clauPem: EC.pem, ara: ARA })],
      ['una altra .p8', await jwtApns({ equip: EQUIP, clauId: CLAU_ID, clauPem: EC_SEGONA.pem, ara: ARA })],
      ['alg none', `${b64({ alg: 'none', kid: CLAU_ID })}.${r}.${s}`],
      ['la signatura d’un altre JWT', `${c}.${b64({ iss: EQUIP, iat: 1 })}.${s}`],
      ['dos trossos', `${c}.${r}`],
      ['quatre trossos', `${DESADA_APNS}.x`],
      ['una capçalera que no és JSON', `${aBase64url(new TextEncoder().encode('no-json'))}.${r}.${s}`],
      ['una capçalera que és un número', `${b64(5)}.${r}.${s}`],
      ['uns reclams null', `${c}.${b64(null)}.${s}`],
      ['un base64 trencat', `a.${r}.${s}`],
      ['massa curt', 'a.b.c'],
      ['null', null],
      ['un número', 7]
    ];
    for (const [nom, jwt] of dolents) expect(await jwtApnsDeLaClau(jwt, clau), nom).toBe(false);
  });

  test('APNs: desament fals i la relectura torna una altra credencial que no és d’esta clau → reintenta (ARB-N02-02)', async () => {
    const vella = await jwtApns({ equip: EQUIP, clauId: 'VELLAAAAAA', clauPem: EC.pem, ara: ARA });
    const mon = creaMon({ credencial: vella, desa: false });
    const { apns } = await enviadorsDe(mon, envApns());
    expect(await apns({ adreca: IOS_T, llengua: 'ca' })).toEqual({ resultat: 'reintenta', estat: 0 });
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial', 'xat_push_credencial']);
    expect(mon.crides).toEqual([]);
  });

  test('FCM: el testimoni d’un altre compte de servei (o projecte) no es creu: nou intercanvi, i es desa amb l’empremta del compte d’ara', async () => {
    const base = baseDeCredencials();
    const ambA = creaMon(base);
    await (await enviadorsDe(ambA, envFcm())).fcm({ adreca: AND_T, llengua: 'ca' });
    const desadaA = base.b.fila.valor;
    expect(desadaA).toBe(`${await empremtaFcm()}.${ACCES}`);

    const ambB = creaMon({ ...base, oauth: () => ({ estat: 200, cos: { access_token: ACCES_NOU, expires_in: 3599 } }) });
    const { fcm } = await enviadorsDe(ambB, { SDP_FCM_COMPTE_SERVEI: compte(COMPTE_B) }, { ara: () => ARA + 60 * 1000 });
    expect(await fcm({ adreca: AND_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(cridesA(ambB, FCM.TOKEN)).toHaveLength(1);
    expect(nomsRpc(ambB)).toEqual(['xat_push_credencial', 'xat_push_desa_credencial']);
    expect(base.b.fila.valor).toBe(`${await empremtaFcm(COMPTE_B.client_email, COMPTE_B.project_id)}.${ACCES_NOU}`);
    expect(cridesA(ambB, FCM.MISSATGES).map((c) => [c.url, c.opcions.headers.authorization])).toEqual([[`${FCM.MISSATGES}/${COMPTE_B.project_id}/messages:send`, `Bearer ${ACCES_NOU}`]]);
  });

  test('FCM: el testimoni del compte d’ara es creu (cap intercanvi) i viatja sense l’empremta', async () => {
    const espia = subtleQueCompta();
    const mon = creaMon({ credencial: `${await empremtaFcm()}.${ACCES}` });
    const { fcm } = await enviadorsDe(mon, envFcm(), { subtle: espia.subtle });
    expect(await fcm({ adreca: AND_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(cridesA(mon, FCM.TOKEN)).toEqual([]);
    expect(espia.compte.signatures).toBe(0);
    expect(cridesA(mon, FCM.MISSATGES)[0].opcions.headers.authorization).toBe(`Bearer ${ACCES}`);
  });

  test('FCM: un testimoni massa llarg per a dur l’empremta (4.096 amb ella) s’usa en la passada i no es desa', async () => {
    const llarg = `ya29.${'l'.repeat(4085)}`;
    const mon = creaMon({ oauth: () => ({ estat: 200, cos: { access_token: llarg, expires_in: 3599 } }) });
    const { fcm } = await enviadorsDe(mon, envFcm());
    expect(await fcm({ adreca: AND_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(nomsRpc(mon)).toEqual(['xat_push_credencial']);
    expect(cridesA(mon, FCM.MISSATGES)[0].opcions.headers.authorization).toBe(`Bearer ${llarg}`);
  });

  test.each([
    ['sense empremta (el format d’abans)', () => ACCES],
    ['amb l’empremta d’un altre compte', async () => `${await empremtaFcm(COMPTE_B.client_email, COMPTE_B.project_id)}.${ACCES}`],
    ['amb l’empremta i res darrere', async () => `${await empremtaFcm()}.`]
  ])('FCM: un testimoni desat %s no es creu: nou intercanvi', async (_, desada) => {
    const mon = creaMon({ credencial: await desada() });
    const { fcm } = await enviadorsDe(mon, envFcm());
    expect(await fcm({ adreca: AND_T, llengua: 'ca' })).toEqual({ resultat: 'enviat', estat: 200 });
    expect(cridesA(mon, FCM.TOKEN)).toHaveLength(1);
    expect(mon.rpcs[1].cos.p_valor).toBe(`${await empremtaFcm()}.${ACCES}`);
  });
});

describe('G1-B-seg-01: les respostes que poden ser d’un sol aparell no són de configuració', () => {
  test('APNs 429 TooManyRequests (un sol testimoni) es reintenta; TooManyProviderTokenUpdates (el JWT propi) és ritme', () => {
    expect(classificaApns(429, 'TooManyRequests')).toBe('reintenta');
    expect(classificaApns(429, 'TooManyProviderTokenUpdates')).toBe('ritme');
    expect(classificaApns(429, null)).toBe('ritme');
  });

  test('FCM THIRD_PARTY_AUTH_ERROR (la plataforma d’un testimoni) és rebutjat; un 401 o 403 sense codi d’aparell (el testimoni d’OAuth propi), config', () => {
    expect(classificaFcm(401, 'THIRD_PARTY_AUTH_ERROR')).toBe('rebutjat');
    expect(classificaFcm(403, 'THIRD_PARTY_AUTH_ERROR')).toBe('rebutjat');
    expect(classificaFcm(401, null)).toBe('config');
    expect(classificaFcm(403, null)).toBe('config');
  });
});

describe('els enviadors: resultats, entorn i fronteres', () => {
  test('APNs: l’entorn i el topic dels secrets', async () => {
    const casos = [[{}, APNS.PRODUCCIO, 'org.socdepoble.app'], [{ SDP_APNS_ENTORN: 'produccio' }, APNS.PRODUCCIO, 'org.socdepoble.app'],
      [{ SDP_APNS_ENTORN: 'sandbox', SDP_APNS_TOPIC: 'org.socdepoble.app.proves' }, APNS.SANDBOX, 'org.socdepoble.app.proves']];
    for (const [extra, host, topic] of casos) {
      const mon = creaMon({ credencial: DESADA_APNS });
      const { apns } = await enviadorsDe(mon, envApns(extra));
      await apns({ adreca: IOS_T, llengua: 'eu' });
      expect(mon.crides[0].url).toBe(`${host}/3/device/${IOS_T}`);
      expect(mon.crides[0].opcions.headers['apns-topic']).toBe(topic);
      expect(JSON.parse(mon.crides[0].opcions.body).aps.alert).toEqual({ title: 'Sóc de Poble', body: 'Mezu berriak dituzu' });
    }
  });

  test.each([
    [{ estat: 200 }, 'enviat'],
    [{ estat: 410, cos: { reason: 'Unregistered', timestamp: 1 } }, 'expulsa'],
    [{ estat: 400, cos: { reason: 'BadDeviceToken' } }, 'rebutjat'],
    [{ estat: 400, cos: { reason: 'DeviceTokenNotForTopic' } }, 'rebutjat'],
    [{ estat: 403, cos: { reason: 'InvalidProviderToken' } }, 'config'],
    [{ estat: 429, cos: { reason: 'TooManyRequests' } }, 'reintenta'],
    [{ estat: 429, cos: { reason: 'TooManyProviderTokenUpdates' } }, 'ritme'],
    [{ estat: 503 }, 'reintenta'],
    [{ estat: 400, cru: `{"reason":"BadDeviceToken","farciment":"${'x'.repeat(5000)}"}` }, 'fallit'],
    [{ estat: 400, cru: 'no és json' }, 'fallit']
  ])('APNs %j → %s', async (resposta, resultat) => {
    const mon = creaMon({ credencial: DESADA_APNS, apns: () => resposta });
    const { apns } = await enviadorsDe(mon, envApns());
    expect(await apns({ adreca: IOS_T, llengua: 'ca' })).toEqual({ resultat, estat: resposta.estat });
  });

  test.each([
    [{ estat: 200 }, 'enviat'],
    [errorFcm(404, 'UNREGISTERED'), 'expulsa'],
    [errorFcm(404, 'UNREGISTERED', 'type.googleapis.com/altra.Error'), 'fallit'],
    [errorFcm(403, 'SENDER_ID_MISMATCH'), 'rebutjat'],
    [errorFcm(400, 'INVALID_ARGUMENT'), 'fallit'],
    [errorFcm(401, 'THIRD_PARTY_AUTH_ERROR'), 'rebutjat'],
    [{ estat: 401, cos: { error: { code: 401, status: 'UNAUTHENTICATED' } } }, 'config'],
    [errorFcm(429, 'QUOTA_EXCEEDED'), 'ritme'],
    [{ estat: 500 }, 'reintenta']
  ])('FCM %j → %s', async (resposta, resultat) => {
    const mon = creaMon({ credencial: `${await empremtaFcm()}.${ACCES}`, fcm: () => resposta });
    const { fcm } = await enviadorsDe(mon, envFcm());
    expect(await fcm({ adreca: AND_T, llengua: 'ca' })).toEqual({ resultat, estat: resposta.estat });
  });

  test('un testimoni dolent és invalid i no busca res (ni la credencial)', async () => {
    const mon = creaMon({ credencial: DESADA_APNS });
    const { apns, fcm } = await enviadorsDe(mon, { ...envApns(), ...envFcm() });
    for (const adreca of [IOS_T.toUpperCase(), `${IOS_T}/x`, AND_T, null]) expect(await apns({ adreca, llengua: 'ca' })).toEqual({ resultat: 'invalid', estat: 0 });
    for (const adreca of ['x'.repeat(31), `${AND_T}/x`, null]) expect(await fcm({ adreca, llengua: 'ca' })).toEqual({ resultat: 'invalid', estat: 0 });
    expect(await apns(null)).toEqual({ resultat: 'invalid', estat: 0 });
    expect(mon.rpcs).toEqual([]);
    expect(mon.crides).toEqual([]);
  });

  test('la xarxa que falla o que penja: reintenta, dins del topall', async () => {
    for (const apnsFals of [async () => { throw new Error('xarxa'); }, penja]) {
      const mon = creaMon({ credencial: DESADA_APNS, apns: apnsFals });
      const { apns } = await enviadorsDe(mon, envApns(), { topallMs: 30 });
      const inici = Date.now();
      expect(await apns({ adreca: IOS_T, llengua: 'ca' })).toEqual({ resultat: 'reintenta', estat: 0 });
      expect(Date.now() - inici).toBeLessThan(2000);
    }
  });

  test('cada petició porta redirect: error i un senyal, i el cos d’un 200 es cancel·la sense llegir-lo', async () => {
    let cancellats = 0;
    const amb200 = () => new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"apns-id":"x"}')); }, cancel() { cancellats += 1; } }), { status: 200 });
    const mon = creaMon({ apns: amb200, fcm: amb200 });
    const { apns, fcm } = await enviadorsDe(mon, { ...envApns(), ...envFcm() });
    await apns({ adreca: IOS_T, llengua: 'ca' });
    await fcm({ adreca: AND_T, llengua: 'ca' });
    expect(mon.crides.length).toBe(3);
    for (const c of mon.crides) {
      expect(c.opcions.redirect).toBe('error');
      expect(c.opcions.signal).toBeInstanceOf(AbortSignal);
    }
    expect(cancellats).toBe(2);
  });
});

describe('integració amb el gestor real: mai expulsar per un error de configuració (ARB-B8S-02)', () => {
  const URL_SB = 'https://projecte.exemple.test';
  const SECRET_CRON = 's'.repeat(64);
  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const IOS = (n) => ({ id: id(n), tipus: 'apns', adreca: n.toString(16).padStart(64, 'c'), llengua: 'en' });
  const AND = (n) => ({ id: id(n), tipus: 'fcm', adreca: `canari_fcm_${n}_${'x'.repeat(32)}`, llengua: 'gl' });
  const peticio = () => new Request(`${URL_SB}/functions/v1/notifica-xat`, { method: 'POST', headers: { 'x-sdp-cron': SECRET_CRON } });

  function creaMonGestor({ dispositius = [], lots: perLots = null, apns = () => ({ estat: 200 }), fcm = () => ({ estat: 200 }) }) {
    let nextClaim=10000;
    const claimDevice=new Map();
    const lots = (perLots ?? [dispositius]).map((devices) => ({ protocol:'lease-v2',missatges:1,treballs:devices.length,retallats:0,
      dispositius:devices.map(d=>{
        const claim={id:id(++nextClaim),lease:id(nextClaim+10000)};claimDevice.set(claim.id,d.id);
        return {...d,lliuraments:[claim]};
      }) }));
    const mon = {
      base: [], expulsats: [], apns: [], fcm: [], oauth: [],
      fetch: async (url, opcions = {}) => {
        const u = new URL(url);
        if (u.origin === URL_SB) {
          const nom = u.pathname.replace('/rest/v1/rpc/', '');
          const cos = JSON.parse(opcions.body);
          mon.base.push({ nom, cos, capcaleres: opcions.headers });
          if (nom === 'xat_push_neteja') return Response.json({ dispositius: 0, cua: 0 });
          if (nom === 'xat_push_reclama_v2') return Response.json(lots.shift() ?? { protocol:'lease-v2',missatges:0,treballs:0,retallats:0,dispositius:[] });
          if (nom === 'xat_push_confirma_v2') {
            const retired=cos.p_resultats.filter(c=>c.resultat==='expulsa').map(c=>claimDevice.get(c.id));
            if(retired.length)mon.expulsats.push(retired);
            return Response.json({expulsats:retired.length});
          }
          if (nom === 'xat_push_credencial') return Response.json(null);
          if (nom === 'xat_push_desa_credencial') return Response.json(true);
          return new Response('{}', { status: 404 });
        }
        if (url === FCM.TOKEN) { mon.oauth.push(url); return Response.json({ access_token: ACCES, expires_in: 3599 }); }
        if (url.startsWith(APNS.PRODUCCIO)) { mon.apns.push(url); return respon(apns(url)); }
        if (url.startsWith(FCM.MISSATGES)) { const token = JSON.parse(opcions.body).message.token; mon.fcm.push(token); return respon(fcm(token)); }
        throw new Error('xarxa no permesa');
      }
    };
    return mon;
  }
  const env = (extra = {}) => ({ SUPABASE_URL: URL_SB, SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiJ9.servei.sintetic', SDP_CRON_SECRET: SECRET_CRON, SDP_PUSH_ACTIU: 'si', ...extra });
  const passa = async (mon, extra) => {
    const r = await creaGestor({ env: env(extra), fetch: mon.fetch, registre, creaEnviadorsNatius })(peticio());
    return { estat: r.status, cos: await r.json() };
  };
  const sensCanaris = (mon, cos) => {
    const tot = `${registre.linies.join('\n')}\n${JSON.stringify(cos)}`;
    expect(tot).not.toMatch(/canari|ca5e|eyJ|ya29|BEGIN|MII|cccccccc/i);
  };

  test.each([
    ['APNs 400 BadDeviceToken', 'apns', () => ({ estat: 400, cos: { reason: 'BadDeviceToken' } })],
    ['APNs 400 DeviceTokenNotForTopic', 'apns', () => ({ estat: 400, cos: { reason: 'DeviceTokenNotForTopic' } })],
    ['FCM 403 SENDER_ID_MISMATCH', 'fcm', () => errorFcm(403, 'SENDER_ID_MISMATCH')]
  ])('%s a deu aparells: cap expulsió, i cap pausa (G1-B-seg-01): deu peticions i deu fallits', async (_, proveidor, resposta) => {
    const dispositius = Array.from({ length: 10 }, (__, i) => (proveidor === 'apns' ? IOS(i + 1) : AND(i + 1)));
    const mon = creaMonGestor({ dispositius, [proveidor]: resposta });
    const { estat, cos } = await passa(mon, { ...envApns(), ...envFcm() });
    expect(estat).toBe(200);
    expect(mon.expulsats).toEqual([]);
    expect(mon.base.map((b) => b.nom)).not.toContain('xat_push_expulsa');
    expect(mon[proveidor]).toHaveLength(10);
    expect(cos).toMatchObject({ enviats: 0, expulsats: 0, fallits: 10, sense_provar: 0, sense_proveidor: 0 });
    sensCanaris(mon, cos);
  });

  /* G1-B-seg-01: l'atac reproduït amb els natius reals. Testimonis d'APNs
     inventats (64 xifres hexadecimals: Apple respon BadDeviceToken) o de FCM
     d'un altre projecte (SENDER_ID_MISMATCH) no aturen els avisos dels altres. */
  describe('G1-B-seg-01: un atacant amb testimonis dolents no atura els avisos dels altres', () => {
    const atacants = (n) => Array.from({ length: n }, (__, i) => IOS(900 + i));
    const esAtacant = (url) => atacants(10).some((d) => url.endsWith(`/${d.adreca}`));

    test('cinc testimonis APNs inventats al principi de la cua (la sonda original): els trenta legítims, avisats', async () => {
      const mon = creaMonGestor({
        dispositius: [...atacants(5), ...Array.from({ length: 30 }, (__, i) => IOS(i + 1))],
        apns: (url) => (esAtacant(url) ? { estat: 400, cos: { reason: 'BadDeviceToken' } } : { estat: 200 })
      });
      const { cos } = await passa(mon, envApns());
      expect(cos).toMatchObject({ enviats: 30, fallits: 5, sense_provar: 0, expulsats: 0 });
      expect(mon.apns).toHaveLength(35);
      expect(mon.base.map((b) => b.nom)).not.toContain('xat_push_expulsa');
      sensCanaris(mon, cos);
    });

    test.each([
      ['APNs BadDeviceToken', 'apns', { estat: 400, cos: { reason: 'BadDeviceToken' } }],
      ['APNs DeviceTokenNotForTopic', 'apns', { estat: 400, cos: { reason: 'DeviceTokenNotForTopic' } }],
      ['FCM SENDER_ID_MISMATCH', 'fcm', errorFcm(403, 'SENDER_ID_MISMATCH')],
      ['FCM THIRD_PARTY_AUTH_ERROR', 'fcm', errorFcm(401, 'THIRD_PARTY_AUTH_ERROR')]
    ])('%s: deu testimonis de l’atacant sols al lot 1, trenta legítims al lot 2, tots avisats', async (_, proveidor, dolenta) => {
      const fes = proveidor === 'apns' ? IOS : AND;
      const dolents = new Set(Array.from({ length: 10 }, (__, i) => fes(900 + i).adreca));
      const mon = creaMonGestor({
        lots: [Array.from({ length: 10 }, (__, i) => fes(900 + i)), Array.from({ length: 30 }, (__, i) => fes(i + 1))],
        apns: (url) => ([...dolents].some((t) => url.endsWith(`/${t}`)) ? dolenta : { estat: 200 }),
        fcm: (token) => (dolents.has(token) ? dolenta : { estat: 200 })
      });
      const { cos } = await passa(mon, { ...envApns(), ...envFcm() });
      expect(cos).toMatchObject({ lots: 2, enviats: 30, fallits: 10, sense_provar: 0, expulsats: 0 });
      expect(mon[proveidor]).toHaveLength(40);
      expect(mon.expulsats).toEqual([]);
      sensCanaris(mon, cos);
    });

    test('APNs 429 TooManyRequests d’un sol testimoni no pausa APNs: els altres trenta, avisats', async () => {
      const mon = creaMonGestor({
        dispositius: [IOS(900), ...Array.from({ length: 30 }, (__, i) => IOS(i + 1))],
        apns: (url) => (esAtacant(url) ? { estat: 429, cos: { reason: 'TooManyRequests' } } : { estat: 200 })
      });
      const { cos } = await passa(mon, envApns());
      expect(cos).toMatchObject({ enviats: 30, fallits: 1, sense_provar: 0, expulsats: 0 });
    });

    /* A-02: el testimoni que Apple retalla no es martelleja en els lots següents de la passada. */
    test('el mateix testimoni APNs amb 429 TooManyRequests en cinc lots rep una sola petició; els altres, avisats', async () => {
      const retallat = IOS(900);
      const mon = creaMonGestor({
        lots: Array.from({ length: 5 }, (__, i) => [retallat, IOS(1 + 2 * i), IOS(2 + 2 * i)]),
        apns: (url) => (url.endsWith(`/${retallat.adreca}`) ? { estat: 429, cos: { reason: 'TooManyRequests' } } : { estat: 200 })
      });
      const { cos } = await passa(mon, envApns());
      expect(mon.apns.filter((u) => u.endsWith(`/${retallat.adreca}`))).toHaveLength(1);
      expect(cos).toMatchObject({ lots: 5, enviats: 10, fallits: 1, sense_provar: 4, expulsats: 0 });
      sensCanaris(mon, cos);
    });

    test('el control: APNs 403 (el JWT propi) sí que pausa APNs, com a molt les peticions que ja eren en vol', async () => {
      const mon = creaMonGestor({ dispositius: Array.from({ length: 30 }, (__, i) => IOS(i + 1)), apns: () => ({ estat: 403, cos: { reason: 'InvalidProviderToken' } }) });
      const { cos } = await passa(mon, envApns());
      expect(mon.apns.length).toBeGreaterThanOrEqual(1);
      expect(mon.apns.length).toBeLessThanOrEqual(8);
      expect(cos).toMatchObject({ enviats: 0, expulsats: 0, fallits: mon.apns.length, sense_provar: 30 - mon.apns.length });
    });
  });

  test('APNs 410 i FCM 404 UNREGISTERED sí que expulsen, només aquells aparells', async () => {
    const dispositius = [IOS(1), IOS(2), AND(3), AND(4)];
    const mon = creaMonGestor({
      dispositius,
      apns: (url) => (url.endsWith(IOS(1).adreca) ? { estat: 410, cos: { reason: 'Unregistered' } } : { estat: 200 }),
      fcm: (() => { let n = 0; return () => (++n === 1 ? errorFcm(404, 'UNREGISTERED') : { estat: 200 }); })()
    });
    const { cos } = await passa(mon, { ...envApns(), ...envFcm() });
    expect(cos).toMatchObject({ enviats: 2, expulsats: 2, fallits: 0, sense_proveidor: 0 });
    expect(mon.expulsats.flat().sort()).toEqual([id(1), mon.fcm[0] === AND(3).adreca ? id(3) : id(4)].sort());
    sensCanaris(mon, cos);
  });

  test('sense secrets natius: sense_proveidor, cap credencial, cap servei i cap expulsió', async () => {
    const mon = creaMonGestor({ dispositius: [IOS(1), AND(2)] });
    const { cos } = await passa(mon, {});
    expect(cos).toMatchObject({ enviats: 0, expulsats: 0, sense_proveidor: 2 });
    expect(mon.apns).toEqual([]);
    expect(mon.fcm).toEqual([]);
    expect(mon.oauth).toEqual([]);
    expect(mon.base.map((b) => b.nom)).toEqual(['xat_push_neteja', 'xat_push_reclama_v2', 'xat_push_confirma_v2', 'xat_push_reclama_v2']);
  });

  test('les credencials passen pel rpc del gestor (PostgREST amb la clau de servei), una vegada per proveïdor', async () => {
    const mon = creaMonGestor({ dispositius: [IOS(1), IOS(2), AND(3), AND(4)] });
    const { cos } = await passa(mon, { ...envApns(), ...envFcm() });
    expect(cos).toMatchObject({ enviats: 4, expulsats: 0 });
    const credencials = mon.base.filter((b) => b.nom.startsWith('xat_push_') && b.nom.includes('credencial'));
    expect(credencials.map((b) => `${b.nom} ${b.cos.p_proveidor}`).sort()).toEqual([
      'xat_push_credencial apns', 'xat_push_credencial fcm', 'xat_push_desa_credencial apns', 'xat_push_desa_credencial fcm'
    ]);
    for (const b of credencials) expect(b.capcaleres.apikey).toBe('eyJhbGciOiJIUzI1NiJ9.servei.sintetic');
    expect(mon.oauth).toHaveLength(1);
    expect(registre.linies.join('\n')).toContain('apns enviat 200=2');
    sensCanaris(mon, cos);
  });
});

describe('la frontera de natius.js', () => {
  const sensComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const codi = sensComentaris(readFileSync(path.join(DIR, 'natius.js'), 'utf8'));

  test('només importa _shared/apple.js i no usa APIs fora del Baseline compartit', () => {
    expect([...codi.matchAll(/^\s*import\s[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1])).toEqual(['../_shared/apple.js']);
    expect(codi).not.toMatch(/\bBuffer\b|\bDeno\.|AbortSignal\.(timeout|any)|\brequire\(|from 'node:|\bprocess\./);
  });

  test('cap loc-key, cap fil, i el token_uri no es llig', () => {
    expect(codi).not.toMatch(/loc-key|loc_key|filId|fil_id|token_uri/);
  });

  test('cap font porta una marca de clau privada sencera (l’escàner de secrets del repositori)', () => {
    const marca = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
    for (const nom of ['natius.js', 'natius.test.js']) expect(readFileSync(path.join(DIR, nom), 'utf8'), nom).not.toMatch(marca);
  });

  test('exporta creaEnviadorsNatius com a funció (la importa index.ts)', () => {
    expect(codi).toMatch(/export async function creaEnviadorsNatius\b/);
    expect(readFileSync(path.join(DIR, 'index.ts'), 'utf8')).toContain("import { creaEnviadorsNatius } from './natius.js';");
  });
});
