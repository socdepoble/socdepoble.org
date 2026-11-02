// @vitest-environment node
/* B8-SERVIDOR · S2 (marató 261101_2143) · Les peces del Web Push de
   notifica-xat (webpush.js): la llista blanca contra SSRF, la clau VAPID amb
   autoprova, el JWT ES256 (RFC 8292), la petició sense cos (RFC 8030), la
   classificació de les respostes i l'enviador d'una passada. Tot és
   sintètic: les claus es generen ací amb WebCrypto i cap prova toca la xarxa. */
import { beforeAll, describe, expect, test } from 'vitest';
import { aBase64url, deBase64url } from '../_shared/apple.js';
import {
  AMFITRIONS_EXACTES, SUFIXOS_ADMESOS, WEB_PUSH, amfitrioAdmes, classificaWebPush, clauVapid, contacteVapid,
  creaEnviadorWeb, formaDeLEndpoint, jwtVapid, peticioWebPush
} from './webpush.js';

const subtle = globalThis.crypto.subtle;
const ECDSA = { name: 'ECDSA', namedCurve: 'P-256' };
const ES256 = { name: 'ECDSA', hash: 'SHA-256' };
const CONTACTE = 'mailto:avisos@exemple.test';

/** Un parell VAPID nou: { publica (base64url del punt cru), privada (d), clauPublica }. */
async function parellVapid() {
  const par = await subtle.generateKey(ECDSA, true, ['sign', 'verify']);
  const jwk = await subtle.exportKey('jwk', par.privateKey);
  return { publica: aBase64url(new Uint8Array(await subtle.exportKey('raw', par.publicKey))), privada: jwk.d, clauPublica: par.publicKey };
}

const llegixJson = (b64) => JSON.parse(new TextDecoder().decode(deBase64url(b64)));

let A;
let B;
beforeAll(async () => {
  A = await parellVapid();
  B = await parellVapid();
});

/* Els quatre serveis reals (endpoints de forma real, opacs) i els exactes de la llista. */
const REALS = Object.freeze([
  'https://fcm.googleapis.com/fcm/send/dQw4w9WgXcQ:APA91bH-opac_0123456789',
  'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABl-opac',
  'https://web.push.apple.com/QGx1bGx5LW9wYWM',
  'https://wns2-par02p.notify.windows.com/w/?token=BQYAAAB%2bopac'
]);

/* Enganys: cap no ha de passar (els de la spec, §3 S2, i els del kit de Codex auditat). */
const ENGANYS = Object.freeze([
  ['port explícit 443', 'https://fcm.googleapis.com:443/x'],
  ['port 444', 'https://fcm.googleapis.com:444/x'],
  ['credencials', 'https://u:p@fcm.googleapis.com/x'],
  ['usuari sol', 'https://x@fcm.googleapis.com/x'],
  ['fragment', 'https://fcm.googleapis.com/x#f'],
  ['majúscules a l’amfitrió', 'https://FCM.googleapis.com/x'],
  ['tot en majúscules', 'https://FCM.GOOGLEAPIS.COM/x'],
  ['IP literal', 'https://127.0.0.1/x'],
  ['metadades del núvol', 'https://169.254.169.254/latest'],
  ['IPv6 literal', 'https://[::1]/x'],
  ['espai', 'https://fcm.googleapis.com/x y'],
  ['tabulador', 'https://fcm.googleapis.com/x\ty'],
  ['no ASCII', 'https://fcm.googleapis.com/é'],
  ['punt final', 'https://fcm.googleapis.com./x'],
  ['més de 2048', `https://fcm.googleapis.com/${'a'.repeat(2030)}`],
  ['barra inversa amb @', 'https://fcm.googleapis.com\\@evil.com/x'],
  ['%2f amb @', 'https://fcm.googleapis.com%2f@evil.com/x'],
  ['esquema en majúscules', 'HTTPS://fcm.googleapis.com/x'],
  ['http', 'http://fcm.googleapis.com/x'],
  ['sense camí', 'https://fcm.googleapis.com'],
  ['consulta abans del camí', 'https://fcm.googleapis.com?x=/y'],
  ['sufix sense punt', 'https://evilnotify.windows.com/x'],
  ['apple com a prefix', 'https://push.apple.com.evil.com/x'],
  ['google com a prefix', 'https://fcm.googleapis.com.evil/x'],
  ['etiqueta buida al davant', 'https://.push.apple.com/x'],
  ['etiqueta buida al mig', 'https://a..push.apple.com/x'],
  ['servei desconegut', 'https://evil.example.com/x'],
  ['subdomini de google', 'https://evil.fcm.googleapis.com/x']
]);

describe('les constants del contracte (B8-SERVIDOR §2.9)', () => {
  test('TTL d’un dia, urgència normal, tema sdp-xat i JWT de 12 h', () => {
    expect(WEB_PUSH).toEqual({ TTL_S: 86400, URGENCIA: 'normal', TEMA: 'sdp-xat', DURADA_JWT_S: 43200, MAXIM_ENDPOINT: 2048 });
    expect(Object.isFrozen(WEB_PUSH)).toBe(true);
  });

  test('el tema complix RFC 8030 §5.4 i el JWT no passa de 24 h (RFC 8292 §2)', () => {
    expect(WEB_PUSH.TEMA).toMatch(/^[A-Za-z0-9_-]{1,32}$/);
    expect(WEB_PUSH.DURADA_JWT_S).toBeLessThanOrEqual(86400);
  });
});

describe('formaDeLEndpoint i amfitrioAdmes: la llista blanca contra SSRF', () => {
  test.each(REALS)('el servei real %s passa, amb l’audiència i l’amfitrió', (endpoint) => {
    const host = endpoint.slice(8, endpoint.indexOf('/', 8));
    expect(formaDeLEndpoint(endpoint)).toEqual({ endpoint, audiencia: `https://${host}`, amfitrio: host });
  });

  test('els amfitrions exactes passen tal qual', () => {
    for (const host of AMFITRIONS_EXACTES) expect(formaDeLEndpoint(`https://${host}/x`)?.amfitrio).toBe(host);
  });

  test.each(ENGANYS)('rebutja %s', (_, endpoint) => {
    expect(formaDeLEndpoint(endpoint)).toBeNull();
  });

  test('el límit de 2048: just 2048 passa i 2049 no', () => {
    const base = 'https://fcm.googleapis.com/';
    expect(formaDeLEndpoint(base + 'a'.repeat(2048 - base.length))).not.toBeNull();
    expect(formaDeLEndpoint(base + 'a'.repeat(2049 - base.length))).toBeNull();
  });

  test.each([[null], [undefined], [42], [{ endpoint: REALS[0] }], ['']])('una entrada que no és text (%s) és null', (entrada) => {
    expect(formaDeLEndpoint(entrada)).toBeNull();
  });

  test('amfitrioAdmes: exactes, sufixos amb etiqueta i res més', () => {
    for (const host of AMFITRIONS_EXACTES) expect(amfitrioAdmes(host)).toBe(true);
    for (const sufix of SUFIXOS_ADMESOS) {
      expect(amfitrioAdmes(`a${sufix}`)).toBe(true);
      expect(amfitrioAdmes(sufix)).toBe(false);
    }
    for (const host of ['', 'x'.repeat(254), 'Push.apple.com', 'a..push.apple.com', 'evilpush.apple.com', 'fcm.googleapis.com.', 'a:b', null]) {
      expect(amfitrioAdmes(host)).toBe(false);
    }
  });
});

describe('clauVapid', () => {
  test('un parell generat amb WebCrypto dona una clau que signa i la mateixa pública', async () => {
    const k = await clauVapid({ publica: A.publica, privada: A.privada });
    expect(k).not.toBeNull();
    expect(k.publica).toBe(A.publica);
    const sonda = new TextEncoder().encode('sonda');
    expect(await subtle.verify(ES256, A.clauPublica, await subtle.sign(ES256, k.clau, sonda), sonda)).toBe(true);
  });

  test('un parell barrejat és null (l’autoprova o la importació el tomba)', async () => {
    expect(await clauVapid({ publica: A.publica, privada: B.privada })).toBeNull();
  });

  test('l’autoprova: un runtime que importa el parell però la sonda no verifica dona null', async () => {
    /* Node ja rebutja un parell barrejat en importar-lo; un altre runtime potser no. */
    const sensePresa = new Proxy(subtle, {
      get(objecte, nom) {
        if (nom === 'verify') return async () => false;
        const valor = Reflect.get(objecte, nom, objecte);
        return typeof valor === 'function' ? valor.bind(objecte) : valor;
      }
    });
    expect(await clauVapid({ publica: A.publica, privada: A.privada }, sensePresa)).toBeNull();
  });

  test.each([
    ['privada curta', () => ({ publica: A.publica, privada: 'abc' })],
    ['pública curta', () => ({ publica: A.publica.slice(1), privada: A.privada })],
    ['pública amb caràcters de base64 estàndard', () => ({ publica: `${A.publica.slice(0, 86)}+`, privada: A.privada })],
    ['pública que no és un punt sense comprimir (0x02)', () => {
      const punt = deBase64url(A.publica);
      punt[0] = 2;
      return { publica: aBase64url(punt), privada: A.privada };
    }],
    ['escalar zero', () => ({ publica: A.publica, privada: 'A'.repeat(43) })],
    ['sense res', () => ({})],
    ['tipus estranys', () => ({ publica: 1, privada: 2 })]
  ])('%s és null', async (_, entrada) => {
    expect(await clauVapid(entrada())).toBeNull();
  });
});

describe('contacteVapid', () => {
  test.each([
    ['mailto:avisos@exemple.test', 'mailto:avisos@exemple.test'],
    ['  mailto:avisos@exemple.test \n', 'mailto:avisos@exemple.test'],
    ['https://socdepoble.org', 'https://socdepoble.org'],
    ['mailto:@exemple.test', null],
    ['mailto:avisos@', null],
    ['mailto:', null],
    ['ftp://exemple.test', null],
    ['http://exemple.test', null],
    ['mailto:a b@exemple.test', null],
    [`mailto:${'a'.repeat(200)}@x.test`, null],
    ['', null],
    [undefined, null]
  ])('%j → %j', (entrada, esperat) => {
    expect(contacteVapid(entrada)).toBe(esperat);
  });
});

describe('jwtVapid', () => {
  test('capçalera ES256, reclams exactes i una signatura P1363 de 64 bytes que verifica amb la pública', async () => {
    const { clau } = await clauVapid({ publica: A.publica, privada: A.privada });
    const ara = Date.UTC(2026, 10, 2, 1, 0, 0) + 999;
    const jwt = await jwtVapid({ clau, audiencia: 'https://fcm.googleapis.com', contacte: CONTACTE, ara });
    const [capcalera, reclams, signatura] = jwt.split('.');
    expect(jwt.split('.')).toHaveLength(3);
    expect(llegixJson(capcalera)).toEqual({ typ: 'JWT', alg: 'ES256' });
    expect(llegixJson(reclams)).toEqual({ aud: 'https://fcm.googleapis.com', exp: Math.floor(ara / 1000) + 43200, sub: CONTACTE });
    const bytes = deBase64url(signatura);
    expect(bytes).toHaveLength(64);
    expect(await subtle.verify(ES256, A.clauPublica, bytes, new TextEncoder().encode(`${capcalera}.${reclams}`))).toBe(true);
    expect(await subtle.verify(ES256, B.clauPublica, bytes, new TextEncoder().encode(`${capcalera}.${reclams}`))).toBe(false);
  });
});

describe('peticioWebPush: un push sense cos', () => {
  test('POST, redirect: error, cap body i exactament les cinc capçaleres', () => {
    const { url, opcions } = peticioWebPush({ endpoint: REALS[0], jwt: 'a.b.c', publica: A.publica });
    expect(url).toBe(REALS[0]);
    expect(Object.keys(opcions).sort()).toEqual(['headers', 'method', 'redirect']);
    expect(opcions.method).toBe('POST');
    expect(opcions.redirect).toBe('error');
    expect(opcions).not.toHaveProperty('body');
    expect(opcions.headers).toEqual({
      Authorization: `vapid t=a.b.c, k=${A.publica}`,
      TTL: '86400',
      Urgency: 'normal',
      Topic: 'sdp-xat',
      'Content-Length': '0'
    });
    expect(Object.keys(opcions.headers).map((c) => c.toLowerCase())).not.toContain('content-encoding');
  });
});

describe('classificaWebPush', () => {
  test.each([
    [200, 'enviat'], [201, 'enviat'], [202, 'enviat'],
    [404, 'expulsa'], [410, 'expulsa'],
    [401, 'rebutjat'],
    [403, 'rebutjat'],
    [429, 'ritme'],
    [500, 'reintenta'], [502, 'reintenta'], [503, 'reintenta'], [504, 'reintenta'], [599, 'reintenta'],
    [0, 'reintenta'], [undefined, 'reintenta'],
    [204, 'fallit'], [301, 'fallit'], [400, 'fallit'], [413, 'fallit']
  ])('%s → %s', (estat, esperat) => {
    expect(classificaWebPush(estat)).toBe(esperat);
  });

  test('cap 401, 403 ni 400 no expulsa (una configuració dolenta no buida la taula)', () => {
    for (const estat of [400, 401, 403]) expect(classificaWebPush(estat)).not.toBe('expulsa');
  });

  /* G1-B-seg-01: Mozilla respon 401 (errno 109) a UNA subscripció feta amb una
     altra applicationServerKey, i FCM i Apple 403. Cap codi del servei de push
     no és un senyal global: el «config» del web només el dona la signatura del
     JWT propi (creaEnviadorWeb). */
  test('cap estat d’un servei de push és «config»: 401 i 403 són «rebutjat», per aparell', () => {
    expect(classificaWebPush(401)).toBe('rebutjat');
    expect(classificaWebPush(403)).toBe('rebutjat');
    for (let estat = 100; estat <= 599; estat++) expect(classificaWebPush(estat), String(estat)).not.toBe('config');
  });

  /* A-02 (àrbitre de F2-NOTIFICA-XAT): Apple documenta el 429 de Web Push com
     «massa peticions al mateix destí» i el reason TooManyRequests com d'UN
     testimoni. Només eixe motiu deixa de pausar; el motiu no canvia res més. */
  test.each([
    [429, 'TooManyRequests', 'reintenta'],
    [429, null, 'ritme'],
    [429, 'ServiceUnavailable', 'ritme'],
    [429, 'toomanyrequests', 'ritme'],
    [403, 'TooManyRequests', 'rebutjat'],
    [410, 'TooManyRequests', 'expulsa'],
    [503, 'TooManyRequests', 'reintenta'],
    [201, 'TooManyRequests', 'enviat']
  ])('%s amb el motiu %s → %s (A-02)', (estat, motiu, esperat) => {
    expect(classificaWebPush(estat, motiu)).toBe(esperat);
  });
});

describe('creaEnviadorWeb', () => {
  const envDe = (p) => ({ SDP_PUSH_VAPID_PUBLICA: p.publica, SDP_PUSH_VAPID_PRIVADA: p.privada, SDP_PUSH_VAPID_SUBJECTE: CONTACTE });

  test.each([
    ['sense pública', (e) => ({ ...e, SDP_PUSH_VAPID_PUBLICA: undefined })],
    ['sense privada', (e) => ({ ...e, SDP_PUSH_VAPID_PRIVADA: '' })],
    ['sense contacte', (e) => ({ ...e, SDP_PUSH_VAPID_SUBJECTE: undefined })],
    ['contacte dolent', (e) => ({ ...e, SDP_PUSH_VAPID_SUBJECTE: 'avisos@exemple.test' })],
    ['parell barrejat', (e) => ({ ...e, SDP_PUSH_VAPID_PRIVADA: B.privada })],
    ['els noms vells sense PUSH_', (e) => ({ SDP_VAPID_PUBLICA: e.SDP_PUSH_VAPID_PUBLICA, SDP_VAPID_PRIVADA: e.SDP_PUSH_VAPID_PRIVADA, SDP_VAPID_CONTACTE: CONTACTE })]
  ])('%s → null, sense cap fetch', async (_, canvia) => {
    let crides = 0;
    const enviador = await creaEnviadorWeb({ env: canvia(envDe(A)), fetch: async () => { crides += 1; return new Response(null, { status: 201 }); } });
    expect(enviador).toBeNull();
    expect(crides).toBe(0);
  });

  /* L'audiència del JWT que es va a signar, o null (l'autoprova signa una sonda que no és un JWT). */
  const audienciaDe = (dades) => {
    try {
      const parts = new TextDecoder().decode(dades).split('.');
      return parts.length === 2 ? (llegixJson(parts[1]).aud ?? null) : null;
    } catch { return null; }
  };

  /* ARB-N01-01: les signatures de WebCrypto acaben en qualsevol ordre, així que les crides es miren per URL, mai per
     posició. La segona variant endarrereix la signatura de FCM i força cada vegada que Mozilla isca primer. */
  test.each([
    ['en l’ordre en què acaben les signatures', 0],
    ['amb la signatura de FCM endarrerida', 20]
  ])('envia el push sense cos, amb un JWT per audiència dins de la passada, i cancel·la el cos de la resposta (%s)', async (_, retardFcm) => {
    const crides = [];
    const cancels = [];
    const fetch = async (url, opcions) => {
      crides.push({ url, opcions });
      const index = cancels.length;
      cancels.push(0);
      return new Response(new ReadableStream({ cancel() { cancels[index] += 1; } }), { status: 201 });
    };
    let signatures = 0;
    const espia = new Proxy(subtle, {
      get(objecte, nom) {
        const valor = Reflect.get(objecte, nom, objecte);
        if (nom === 'sign') {
          return async (...args) => {
            signatures += 1;
            if (retardFcm && audienciaDe(args[2]) === 'https://fcm.googleapis.com') await new Promise((resol) => { setTimeout(resol, retardFcm); });
            return valor.apply(objecte, args);
          };
        }
        return typeof valor === 'function' ? valor.bind(objecte) : valor;
      }
    });
    const ara = () => Date.UTC(2026, 10, 2, 1, 0, 0);
    const enviador = await creaEnviadorWeb({ env: envDe(A), fetch, subtle: espia, ara });
    expect(signatures).toBe(1); /* l'autoprova */
    const r = await Promise.all([
      enviador({ endpoint: REALS[0] }),
      enviador(`${REALS[0]}-segon`),
      enviador({ endpoint: REALS[1] })
    ]);
    expect(r).toEqual([
      { resultat: 'enviat', amfitrio: 'fcm.googleapis.com', estat: 201 },
      { resultat: 'enviat', amfitrio: 'fcm.googleapis.com', estat: 201 },
      { resultat: 'enviat', amfitrio: 'updates.push.services.mozilla.com', estat: 201 }
    ]);
    /* Dos amfitrions, dos JWT (més l'autoprova): el segon de Google reutilitza el primer, acabe qui acabe abans. */
    expect(signatures).toBe(3);
    const autoritzacio = Object.fromEntries(crides.map((c) => [c.url, c.opcions.headers.Authorization]));
    expect(Object.keys(autoritzacio).sort()).toEqual([REALS[0], `${REALS[0]}-segon`, REALS[1]].sort());
    expect(autoritzacio[`${REALS[0]}-segon`]).toBe(autoritzacio[REALS[0]]);
    expect(autoritzacio[REALS[1]]).not.toBe(autoritzacio[REALS[0]]);
    /* La variant endarrerida inverteix l'ordre de veres: la prova ja no en depén. */
    if (retardFcm) expect(crides[0].url).toBe(REALS[1]);
    for (const c of crides) {
      expect(c.opcions).not.toHaveProperty('body');
      expect(c.opcions.redirect).toBe('error');
      expect(c.opcions.signal).toBeInstanceOf(AbortSignal);
      const [, jwt] = /^vapid t=([^,]+), k=(.+)$/.exec(c.opcions.headers.Authorization);
      const [h, p, s] = jwt.split('.');
      expect(llegixJson(p).aud).toBe(`https://${new URL(c.url).hostname}`);
      expect(await subtle.verify(ES256, A.clauPublica, deBase64url(s), new TextEncoder().encode(`${h}.${p}`))).toBe(true);
    }
    expect(cancels).toEqual([1, 1, 1]);
  });

  test('un endpoint fora de la llista blanca no es busca mai: «invalid»', async () => {
    let crides = 0;
    const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => { crides += 1; return new Response(null, { status: 201 }); } });
    for (const [, endpoint] of ENGANYS) expect((await enviador({ endpoint })).resultat).toBe('invalid');
    expect(await enviador(undefined)).toEqual({ resultat: 'invalid', amfitrio: null, estat: 0 });
    expect(crides).toBe(0);
  });

  test('la xarxa caiguda és «reintenta» i l’enviador no llança mai', async () => {
    const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => { throw new TypeError('fetch failed'); } });
    expect(await enviador({ endpoint: REALS[2] })).toEqual({ resultat: 'reintenta', amfitrio: 'web.push.apple.com', estat: 0 });
  });

  test('un servei que no respon s’avorta pel topall i és «reintenta»', async () => {
    let senyal = null;
    const fetch = (_url, opcions) => new Promise((_resol, rebutja) => {
      senyal = opcions.signal;
      opcions.signal.addEventListener('abort', () => rebutja(new DOMException('avortat', 'AbortError')));
    });
    const enviador = await creaEnviadorWeb({ env: envDe(A), fetch, topallMs: 20 });
    const inici = Date.now();
    expect((await enviador({ endpoint: REALS[3] })).resultat).toBe('reintenta');
    expect(Date.now() - inici).toBeLessThan(1000);
    expect(senyal.aborted).toBe(true);
  });

  test.each([[404, 'expulsa'], [410, 'expulsa'], [401, 'rebutjat'], [403, 'rebutjat'], [429, 'ritme'], [500, 'reintenta'], [400, 'fallit']])(
    'un %s del servei és «%s»', async (estat, resultat) => {
      const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => new Response(null, { status: estat }) });
      expect(await enviador({ endpoint: REALS[0] })).toEqual({ resultat, amfitrio: 'fcm.googleapis.com', estat });
    });

  /* G1-B-seg-01: l'únic «config» del web és la clau pròpia que no signa el JWT (estat 0, cap petició). */
  test('si la clau pròpia no signa el JWT: «config» amb estat 0 i cap petició al servei', async () => {
    let signatures = 0;
    let crides = 0;
    const subtleQueFalla = {
      importKey: (...a) => subtle.importKey(...a),
      verify: (...a) => subtle.verify(...a),
      sign: (...a) => (++signatures === 1 ? subtle.sign(...a) : Promise.reject(new Error('sense clau')))
    };
    const enviador = await creaEnviadorWeb({ env: envDe(A), subtle: subtleQueFalla, fetch: async () => { crides += 1; return new Response(null, { status: 201 }); } });
    expect(await enviador({ endpoint: REALS[0] })).toEqual({ resultat: 'config', amfitrio: 'fcm.googleapis.com', estat: 0 });
    expect(crides).toBe(0);
  });

  /* A-02: el 429 d'Apple Web Push porta { reason } (el vocabulari d'APNs).
     Només TooManyRequests (un sol aparell) deixa de pausar l'amfitrió. És
     l'únic cos que es llig: d'Apple, amb 429, fins a 4 KiB i dins del topall. */
  describe('A-02: el 429 d’Apple Web Push', () => {
    const SAFARI = REALS[2];
    /* Un cos que compta les lectures: amb highWaterMark 0, pull només corre quan algú llig. */
    const cosEspia = (text, comptes) => new ReadableStream({
      pull(c) { comptes.llegit += 1; c.enqueue(new TextEncoder().encode(text)); c.close(); },
      cancel() { comptes.cancels += 1; }
    }, { highWaterMark: 0 });

    test.each([
      ['TooManyRequests (un sol aparell)', '{"reason":"TooManyRequests"}', 'reintenta'],
      ['sense cos', null, 'ritme'],
      ['un altre motiu', '{"reason":"ServiceUnavailable"}', 'ritme'],
      ['un cos que no és JSON', 'TooManyRequests', 'ritme'],
      ['un motiu sense forma', '{"reason":"Too Many Requests"}', 'ritme'],
      ['un motiu que no és text', '{"reason":["TooManyRequests"]}', 'ritme'],
      ['un JSON que no és objecte', '"TooManyRequests"', 'ritme']
    ])('%s (cos %s) → «%s»', async (_, text, resultat) => {
      const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => new Response(text, { status: 429 }) });
      expect(await enviador({ endpoint: SAFARI })).toEqual({ resultat, amfitrio: 'web.push.apple.com', estat: 429 });
    });

    test('els altres serveis amb el mateix cos continuen sent «ritme», i el seu cos no es llig: es cancel·la', async () => {
      for (const [endpoint, amfitrio] of [[REALS[0], 'fcm.googleapis.com'], [REALS[1], 'updates.push.services.mozilla.com'], [REALS[3], 'wns2-par02p.notify.windows.com']]) {
        const comptes = { llegit: 0, cancels: 0 };
        const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => new Response(cosEspia('{"reason":"TooManyRequests"}', comptes), { status: 429 }) });
        expect(await enviador({ endpoint }), amfitrio).toEqual({ resultat: 'ritme', amfitrio, estat: 429 });
        expect(comptes, amfitrio).toEqual({ llegit: 0, cancels: 1 });
      }
    });

    test.each([[403, 'rebutjat'], [410, 'expulsa'], [201, 'enviat'], [503, 'reintenta']])(
      'Apple amb %i: el cos no es llig (es cancel·la) i el resultat és «%s»', async (estat, resultat) => {
        const comptes = { llegit: 0, cancels: 0 };
        const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => new Response(cosEspia('{"reason":"TooManyRequests"}', comptes), { status: estat }) });
        expect(await enviador({ endpoint: SAFARI })).toEqual({ resultat, amfitrio: 'web.push.apple.com', estat });
        expect(comptes).toEqual({ llegit: 0, cancels: 1 });
      });

    test('un cos de més de 4 KiB no es llig sencer: «ritme» i el lector es cancel·la', async () => {
      const comptes = { trossos: 0, cancels: 0 };
      const infinit = new ReadableStream({
        pull(c) { comptes.trossos += 1; c.enqueue(new Uint8Array(1024).fill(0x20)); },
        cancel() { comptes.cancels += 1; }
      }, { highWaterMark: 0 });
      const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => new Response(infinit, { status: 429 }) });
      expect(await enviador({ endpoint: SAFARI })).toEqual({ resultat: 'ritme', amfitrio: 'web.push.apple.com', estat: 429 });
      expect(comptes.trossos).toBeLessThanOrEqual(5);
      expect(comptes.cancels).toBe(1);
    });

    test('una Content-Length declarada de més de 4 KiB: «ritme» sense llegir res', async () => {
      const comptes = { llegit: 0, cancels: 0 };
      const enviador = await creaEnviadorWeb({
        env: envDe(A),
        fetch: async () => new Response(cosEspia('{"reason":"TooManyRequests"}', comptes), { status: 429, headers: { 'content-length': '5000' } })
      });
      expect((await enviador({ endpoint: SAFARI })).resultat).toBe('ritme');
      expect(comptes).toEqual({ llegit: 0, cancels: 1 });
    });

    test('un cos que penja: el topall talla, «ritme», i el lector es cancel·la', async () => {
      let cancels = 0;
      const penja = new ReadableStream({ pull: () => new Promise(() => {}), cancel() { cancels += 1; } }, { highWaterMark: 0 });
      const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => new Response(penja, { status: 429 }), topallMs: 30 });
      const inici = Date.now();
      expect(await enviador({ endpoint: SAFARI })).toEqual({ resultat: 'ritme', amfitrio: 'web.push.apple.com', estat: 429 });
      expect(Date.now() - inici).toBeLessThan(1000);
      expect(cancels).toBe(1);
    });

    test('un cos que falla a mitja lectura: «ritme» i l’enviador no llança', async () => {
      let n = 0;
      const trencat = new ReadableStream({
        pull(c) { n += 1; if (n === 1) c.enqueue(new TextEncoder().encode('{"reason":')); else c.error(new Error('trencat')); }
      }, { highWaterMark: 0 });
      const enviador = await creaEnviadorWeb({ env: envDe(A), fetch: async () => new Response(trencat, { status: 429 }) });
      expect(await enviador({ endpoint: SAFARI })).toEqual({ resultat: 'ritme', amfitrio: 'web.push.apple.com', estat: 429 });
    });
  });
});
