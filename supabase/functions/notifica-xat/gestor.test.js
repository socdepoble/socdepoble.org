// @vitest-environment node
/* B8-SERVIDOR · S2 (marató 261101_2143) · El worker notifica-xat (gestor.js)
   amb un fetch fals encaminat per l'adreça: PostgREST (les RPC del worker
   amb una cua de lots en memòria) i els serveis de push. Tot és sintètic: la
   clau VAPID es genera ací, cap prova toca la xarxa i cap clau és de veres.
   Prova la porta del cron, el camí apagat (només xat_push_neteja,
   ARB-B8S-03), el camí bo, les expulsions (només 404/410 i l'«expulsa» dels
   natius), les pauses (només la credencial pròpia i el ritme: una resposta
   d'un sol aparell no atura els altres, G1-B-seg-01), la guarda SSRF
   amb files manipulades, el pressupost, els lots, la concurrència, la base
   que falla o penja, i que cap endpoint, testimoni, JWT ni secret no ix al
   registre ni a la resposta.
   Al final, la frontera: cap fitxer de src/ nomena les RPC del worker ni els
   seus secrets, i index.ts només li passa la llista de B8-SERVIDOR §2.6. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { aBase64url, deBase64url } from '../_shared/apple.js';
import { NOTIFICA, RPC_DEL_WORKER, creaGestor, enviaAmbLimit, formaDelDispositiu, igualsEnTempsConstant, trossos } from './gestor.js';

const subtle = globalThis.crypto.subtle;
const URL_SB = 'https://projecte.exemple.test';
const SECRET_CRON = 's'.repeat(64);
const CLAU_LEGADA = 'eyJhbGciOiJIUzI1NiJ9.servei.sintetic';
const CLAU_NOVA = 'sb_secret_sintetica_0000';
const CONTACTE = 'mailto:avisos@exemple.test';
const FCM = 'fcm.googleapis.com';
const MOZ = 'updates.push.services.mozilla.com';
const APPLE = 'web.push.apple.com';
const WNS = 'wns2-par02p.notify.windows.com';

let VAPID;
beforeAll(async () => {
  const par = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  VAPID = {
    publica: aBase64url(new Uint8Array(await subtle.exportKey('raw', par.publicKey))),
    privada: (await subtle.exportKey('jwk', par.privateKey)).d,
    clauPublica: par.publicKey
  };
});

const envBase = (extra = {}) => ({
  SUPABASE_URL: URL_SB, SUPABASE_SERVICE_ROLE_KEY: CLAU_LEGADA, SDP_CRON_SECRET: SECRET_CRON, SDP_PUSH_ACTIU: 'si',
  SDP_PUSH_VAPID_PUBLICA: VAPID.publica, SDP_PUSH_VAPID_PRIVADA: VAPID.privada, SDP_PUSH_VAPID_SUBJECTE: CONTACTE, ...extra
});

/* Aparells sintètics: els endpoints i els testimonis porten «canari» o una forma reconeixible. */
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const W = (n, host = FCM) => ({ id: id(n), tipus: 'web', adreca: `https://${host}/canari/endpoint-${n}`, llengua: 'ca' });
const IOS = (n, llengua = 'en') => ({ id: id(n), tipus: 'apns', adreca: n.toString(16).padStart(64, 'c'), llengua });
const AND = (n, llengua = 'gl') => ({ id: id(n), tipus: 'fcm', adreca: `canari_fcm_${n}_${'x'.repeat(32)}`, llengua });
const lot = (dispositius, { missatges = 1, retallats = 0 } = {}) => ({ missatges, retallats, dispositius });
const espera = (ms) => new Promise((resol) => { setTimeout(resol, ms); });
/* Una barreja determinista (mulberry32 + Fisher-Yates): l'ordre de xat_push_reclama és `order by random()`. */
const barreja = (llista, llavor) => {
  let s = llavor >>> 0;
  const aleatori = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copia = [...llista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatori() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};
/* Un subtle real que signa una sola vegada (l'autoprova de clauVapid): la signatura del JWT propi falla després. */
const subtleQueNoSignaElJwt = () => {
  let signatures = 0;
  return {
    digest: (...a) => subtle.digest(...a),
    importKey: (...a) => subtle.importKey(...a),
    verify: (...a) => subtle.verify(...a),
    sign: (...a) => (++signatures === 1 ? subtle.sign(...a) : Promise.reject(new Error('sense clau')))
  };
};

/** El món fals: la base (PostgREST) amb una cua de lots i els serveis de push. */
function creaMon({ lots = [], push = () => ({ estat: 201 }), base = () => null, neteja = { dispositius: 2, cua: 3 } } = {}) {
  const mon = {
    lots: [...lots],
    crides: [],
    push: [],
    expulsats: [],
    enVol: 0,
    maxEnVol: 0,
    fetch: async (url, opcions = {}) => {
      const u = new URL(url);
      const cos = typeof opcions.body === 'string' ? JSON.parse(opcions.body) : null;
      const crida = { url, origen: u.origin, cami: u.pathname, host: u.hostname, metode: opcions.method, capcaleres: opcions.headers, cos, opcions, senyal: opcions.signal };
      mon.crides.push(crida);
      if (u.origin === URL_SB) {
        const falla = await base(u.pathname, cos, opcions);
        if (falla) return falla;
        if (u.pathname === '/rest/v1/rpc/xat_push_neteja') return Response.json(neteja);
        if (u.pathname === '/rest/v1/rpc/xat_push_reclama') return Response.json(mon.lots.shift() ?? { missatges: 0, retallats: 0, dispositius: [] });
        if (u.pathname === '/rest/v1/rpc/xat_push_expulsa') { mon.expulsats.push([...cos.p_ids]); return Response.json(cos.p_ids.length); }
        if (u.pathname === '/rest/v1/rpc/xat_push_credencial') return Response.json(null);
        return new Response('{}', { status: 404 });
      }
      mon.push.push(crida);
      mon.enVol += 1;
      mon.maxEnVol = Math.max(mon.maxEnVol, mon.enVol);
      try {
        const r = await push(crida, mon.push.length - 1);
        /* `cos` (opcional): el JSON d'error d'un servei, p. ex. el { reason } d'Apple. */
        return r.cos === undefined ? new Response(null, { status: r.estat }) : Response.json(r.cos, { status: r.estat });
      } finally {
        mon.enVol -= 1;
      }
    }
  };
  return mon;
}

const peticio = ({ metode = 'POST', secret = SECRET_CRON } = {}) => new Request(`${URL_SB}/functions/v1/notifica-xat`, {
  method: metode,
  headers: secret === null ? {} : { 'x-sdp-cron': secret }
});

function creaRegistre() {
  const linies = [];
  const desa = (...args) => linies.push(args.map(String).join(' '));
  return { linies, info: desa, warn: desa, error: desa, log: desa };
}

let registre;
beforeEach(() => { registre = creaRegistre(); });

const gestorDe = (mon, extra = {}) => creaGestor({ env: envBase(), fetch: mon.fetch, registre, ...extra });
const cami = (mon) => mon.crides.filter((c) => c.origen === URL_SB).map((c) => c.cami.replace('/rest/v1/rpc/', ''));
const RESPOSTA_BUIDA = Object.freeze({ ok: true, missatges: 0, retallats: 0, dispositius: 0, enviats: 0, expulsats: 0, fallits: 0, sense_proveidor: 0, sense_provar: 0, lots: 0, esgotat: false });

describe('les constants de B8-SERVIDOR §2.6', () => {
  /* G1-B-seg-01: ja no hi ha REBUTJATS_PER_PAUSAR (l'interruptor de rebutjats el podia disparar una sola persona). */
  test('NOTIFICA: lots, concurrència, pressupost, topall, expulsions i sostres', () => {
    expect(NOTIFICA).toEqual({
      CAPCALERA: 'x-sdp-cron', SECRET_MINIM: 32, LOT: 50, MAX_LOTS: 10, CONCURRENCIA: 8, PRESSUPOST_MS: 45000, TOPALL_MS: 8000,
      MAXIM_EXPULSA: 1000, MAXIM_COS_BASE: 2 * 1024 * 1024, MAXIM_DISPOSITIUS: 5000
    });
    expect(Object.isFrozen(NOTIFICA)).toBe(true);
    /* L'últim enviament web acaba dins del pressupost; amb el topall de l'expulsió, la passada cap en els 60 s del cron. */
    expect(NOTIFICA.PRESSUPOST_MS + NOTIFICA.TOPALL_MS).toBeLessThanOrEqual(60000);
  });
});

describe('la porta: només el cron amb el secret', () => {
  test('un GET és 405 i no crida res', async () => {
    const mon = creaMon();
    const r = await gestorDe(mon)(peticio({ metode: 'GET' }));
    expect(r.status).toBe(405);
    expect(r.headers.get('Allow')).toBe('POST');
    expect(mon.crides).toEqual([]);
  });

  test.each([
    ['sense secret', { SDP_CRON_SECRET: '' }],
    ['un secret curt', { SDP_CRON_SECRET: 'curt' }],
    ['sense clau de servei', { SUPABASE_SERVICE_ROLE_KEY: '' }],
    ['sense URL', { SUPABASE_URL: '' }],
    ['una URL amb camí', { SUPABASE_URL: `${URL_SB}/rest/v1` }]
  ])('%s és 503 config i no crida res, ni apagat', async (_, extra) => {
    for (const actiu of ['si', undefined]) {
      const mon = creaMon();
      const r = await creaGestor({ env: envBase({ ...extra, SDP_PUSH_ACTIU: actiu }), fetch: mon.fetch, registre })(peticio());
      expect(r.status).toBe(503);
      expect(await r.json()).toEqual({ ok: false, error: 'config' });
      expect(mon.crides).toEqual([]);
    }
  });

  test.each([['sense capçalera', null], ['un secret equivocat', 'x'.repeat(64)], ['un prefix del secret', SECRET_CRON.slice(0, 63)]])(
    '%s és 401 i no crida res', async (_, secret) => {
      const mon = creaMon({ lots: [lot([W(1)])] });
      const r = await gestorDe(mon)(peticio({ secret }));
      expect(r.status).toBe(401);
      expect(mon.crides).toEqual([]);
    });

  test('la comparació és per resum: iguals, diferents i de llargària diferent', async () => {
    expect(await igualsEnTempsConstant(SECRET_CRON, SECRET_CRON)).toBe(true);
    expect(await igualsEnTempsConstant(SECRET_CRON, `${SECRET_CRON}x`)).toBe(false);
    expect(await igualsEnTempsConstant('', SECRET_CRON)).toBe(false);
  });

  /* ARB-N01-02 (A01): els dos resums es comparen sencers. Amb un digest fals que només els fa diferir en un byte,
     qualsevol posició ha de donar fals (si es comparara només l'últim, 1 de cada 256 capçaleres falses passaria). */
  test('el resum es compara sencer: una diferència en qualsevol dels 32 bytes dona fals', async () => {
    const digestQueDifereixEn = (posicio) => ({
      digest: async (_, dades) => {
        const resum = new Uint8Array(32);
        if (posicio !== null && new TextDecoder().decode(dades) === 'a') resum[posicio] = 1;
        return resum.buffer;
      }
    });
    expect(await igualsEnTempsConstant('a', 'b', digestQueDifereixEn(null))).toBe(true);
    for (let posicio = 0; posicio < 32; posicio++) {
      expect(await igualsEnTempsConstant('a', 'b', digestQueDifereixEn(posicio)), `byte ${posicio}`).toBe(false);
    }
  });
});

describe('apagat (SDP_PUSH_ACTIU no és «si»): només la neteja, ARB-B8S-03', () => {
  test.each([[undefined], [''], ['no'], ['SI'], [' si'], ['si '], ['true'], ['1']])(
    'amb %j: una sola crida, a xat_push_neteja, i cap servei de push, reclam ni natiu', async (actiu) => {
      let natius = 0;
      const mon = creaMon({ lots: [lot([W(1), IOS(2)])] });
      const r = await creaGestor({
        env: envBase({ SDP_PUSH_ACTIU: actiu }), fetch: mon.fetch, registre,
        creaEnviadorsNatius: async () => { natius += 1; return {}; }
      })(peticio());
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ ok: true, apagat: true, neteja: { dispositius: 2, cua: 3 } });
      expect(mon.crides.map((c) => `${c.metode} ${c.url}`)).toEqual([`POST ${URL_SB}/rest/v1/rpc/xat_push_neteja`]);
      expect(mon.crides[0].cos).toEqual({});
      expect(mon.push).toEqual([]);
      expect(mon.lots).toHaveLength(1);
      expect(natius).toBe(0);
    });

  test('els recomptes de la neteja només es creuen si són enters no negatius', async () => {
    const mon = creaMon({ neteja: { dispositius: '9', cua: -1, extra: 'canari' } });
    const r = await creaGestor({ env: envBase({ SDP_PUSH_ACTIU: undefined }), fetch: mon.fetch, registre })(peticio());
    expect(await r.json()).toEqual({ ok: true, apagat: true, neteja: { dispositius: 0, cua: 0 } });
  });

  test.each([
    ['un 500', () => new Response('{"message":"x"}', { status: 500 })],
    ['la xarxa', () => { throw new TypeError('fetch failed'); }]
  ])('amb la base caiguda (%s): 502 apagat, que el cron ho veja', async (_, falla) => {
    const mon = creaMon({ base: falla });
    const r = await creaGestor({ env: envBase({ SDP_PUSH_ACTIU: 'no' }), fetch: mon.fetch, registre })(peticio());
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ ok: false, apagat: true, error: 'base' });
    expect(cami(mon)).toEqual(['xat_push_neteja']);
  });
});

describe('el camí bo', () => {
  test('tres serveis: un POST sense cos per aparell, amb VAPID que verifica, i els recomptes', async () => {
    const mon = creaMon({ lots: [lot([W(1, FCM), W(2, MOZ), W(3, APPLE)], { missatges: 2, retallats: 4 })] });
    const r = await gestorDe(mon)(peticio());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ...RESPOSTA_BUIDA, missatges: 2, retallats: 4, dispositius: 3, enviats: 3, lots: 1 });
    expect(cami(mon)).toEqual(['xat_push_neteja', 'xat_push_reclama', 'xat_push_reclama']);
    expect(mon.crides.find((c) => c.cami.endsWith('xat_push_reclama')).cos).toEqual({ p_limit: NOTIFICA.LOT });
    expect(mon.push.map((c) => c.url).sort()).toEqual([W(1, FCM), W(2, MOZ), W(3, APPLE)].map((d) => d.adreca).sort());
    for (const c of mon.push) {
      expect(c.metode).toBe('POST');
      expect(c.opcions).not.toHaveProperty('body');
      expect(c.capcaleres).toMatchObject({ TTL: '86400', Urgency: 'normal', Topic: 'sdp-xat', 'Content-Length': '0' });
      expect(c.capcaleres).not.toHaveProperty('apikey');
      expect(JSON.stringify(c.capcaleres)).not.toContain(CLAU_LEGADA);
      const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(c.capcaleres.Authorization);
      expect(k).toBe(VAPID.publica);
      const [h, p, s] = jwt.split('.');
      expect(JSON.parse(new TextDecoder().decode(deBase64url(p)))).toMatchObject({ aud: `https://${c.host}`, sub: CONTACTE });
      expect(await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, VAPID.clauPublica, deBase64url(s), new TextEncoder().encode(`${h}.${p}`))).toBe(true);
    }
  });

  test('cada crida porta redirect: error i un senyal de topall; les RPC, les capçaleres de servei', async () => {
    const mon = creaMon({ lots: [lot([W(1), W(2, WNS)])] });
    await gestorDe(mon)(peticio());
    expect(mon.crides.length).toBeGreaterThan(3);
    for (const c of mon.crides) {
      expect(c.opcions.redirect).toBe('error');
      expect(c.senyal).toBeInstanceOf(AbortSignal);
    }
    for (const c of mon.crides.filter((x) => x.origen === URL_SB)) {
      expect(c.capcaleres).toMatchObject({ apikey: CLAU_LEGADA, Authorization: `Bearer ${CLAU_LEGADA}`, 'Content-Type': 'application/json' });
    }
  });

  test('la clau nova sb_secret_ només va a apikey', async () => {
    const mon = creaMon({ lots: [lot([W(1)])] });
    await creaGestor({ env: envBase({ SUPABASE_SERVICE_ROLE_KEY: CLAU_NOVA }), fetch: mon.fetch, registre })(peticio());
    for (const c of mon.crides.filter((x) => x.origen === URL_SB)) {
      expect(c.capcaleres.apikey).toBe(CLAU_NOVA);
      expect(c.capcaleres).not.toHaveProperty('Authorization');
    }
  });

  test('xat_push_neteja una sola vegada per passada, encara que hi haja tres lots', async () => {
    const mon = creaMon({ lots: [lot([W(1)]), lot([W(2)]), lot([W(3)])] });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toMatchObject({ enviats: 3, lots: 3 });
    expect(cami(mon).filter((c) => c === 'xat_push_neteja')).toHaveLength(1);
    expect(cami(mon)[0]).toBe('xat_push_neteja');
  });

  test('la cua buida: neteja, una reclamació i res més', async () => {
    const mon = creaMon();
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toEqual(RESPOSTA_BUIDA);
    expect(cami(mon)).toEqual(['xat_push_neteja', 'xat_push_reclama']);
    expect(mon.push).toEqual([]);
  });

  test('un lot amb missatges i cap destinatari compta i continua fins a missatges: 0', async () => {
    const mon = creaMon({ lots: [lot([], { missatges: 3 }), lot([W(1)])] });
    expect(await (await gestorDe(mon)(peticio())).json()).toMatchObject({ missatges: 4, dispositius: 1, enviats: 1, lots: 2 });
  });

  test('MAX_LOTS limita la passada encara que quede cua', async () => {
    const mon = creaMon({ lots: Array.from({ length: 5 }, (_, i) => lot([W(i + 1)])) });
    const r = await gestorDe(mon, { opcions: { MAX_LOTS: 2 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 2, lots: 2, esgotat: false });
    expect(cami(mon).filter((c) => c === 'xat_push_reclama')).toHaveLength(2);
    expect(mon.lots).toHaveLength(3);
  });
});

describe('les expulsions: només 404 i 410', () => {
  test('404 i 410 → xat_push_expulsa amb aquells ids i prou; 500, la xarxa i el topall són fallits', async () => {
    const estats = { 1: 201, 2: 404, 3: 410, 4: 500, 5: 'xarxa', 6: 'penja' };
    const mon = creaMon({
      lots: [lot([1, 2, 3, 4, 5, 6].map((n) => W(n, n % 2 ? FCM : MOZ)))],
      push: (c) => {
        const estat = estats[Number(c.url.split('endpoint-')[1])];
        if (estat === 'xarxa') throw new TypeError(`fetch failed ${c.url}`);
        if (estat === 'penja') return new Promise((_resol, rebutja) => { c.senyal.addEventListener('abort', () => rebutja(new DOMException('avortat', 'AbortError'))); });
        return { estat };
      }
    });
    const r = await gestorDe(mon, { opcions: { TOPALL_MS: 30, PRESSUPOST_MS: 5000 } })(peticio());
    expect(await r.json()).toEqual({ ...RESPOSTA_BUIDA, missatges: 1, dispositius: 6, enviats: 1, expulsats: 2, fallits: 3, lots: 1 });
    expect(mon.expulsats.flat().sort()).toEqual([id(2), id(3)]);
  });

  test('es parteixen en trossos de MAXIM_EXPULSA i compta el que torna la base', async () => {
    const mon = creaMon({ lots: [lot([1, 2, 3, 4, 5].map((n) => W(n)))], push: () => ({ estat: 410 }) });
    const r = await gestorDe(mon, { opcions: { MAXIM_EXPULSA: 2 } })(peticio());
    expect(await r.json()).toMatchObject({ expulsats: 5, fallits: 0 });
    expect(mon.expulsats.map((t) => t.length)).toEqual([2, 2, 1]);
  });

  test('401 i 403 no expulsen mai, ni amb cap enviat abans', async () => {
    const mon = creaMon({ lots: [lot([W(1), W(2), W(3)])], push: (_c, i) => ({ estat: [201, 403, 401][i] }) });
    const r = await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 1, fallits: 2, expulsats: 0 });
    expect(cami(mon)).not.toContain('xat_push_expulsa');
  });
});

describe('les pauses: només la credencial pròpia i el ritme (ARB-B8S-02, G1-B-seg-01)', () => {
  /* Abans un 401 pausava el web per a tota la passada, i cinc 403 sense cap enviat també: una sola persona ho podia provocar. */
  test('un 401 no pausa el web: es proven tots, un treballador, i cap expulsió', async () => {
    const mon = creaMon({ lots: [lot(Array.from({ length: 10 }, (_, i) => W(i + 1, [FCM, MOZ][i % 2])))], push: () => ({ estat: 401 }) });
    const r = await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 0, fallits: 10, sense_provar: 0, expulsats: 0 });
    expect(mon.push).toHaveLength(10);
    expect(registre.linies.at(-1)).toContain('web rebutjat 401=10');
  });

  test('vint 401 amb peticions alhora: vint peticions, cap pausa ni expulsió, i mai més de CONCURRENCIA en vol', async () => {
    const mon = creaMon({ lots: [lot(Array.from({ length: 20 }, (_, i) => W(i + 1)))], push: async () => { await espera(2); return { estat: 401 }; } });
    const cos = await (await gestorDe(mon)(peticio())).json();
    expect(mon.push).toHaveLength(20);
    expect(mon.maxEnVol).toBeLessThanOrEqual(NOTIFICA.CONCURRENCIA);
    expect(cos).toMatchObject({ fallits: 20, sense_provar: 0, expulsats: 0 });
  });

  test('deu 403 sense cap enviat: deu peticions, cap pausa ni expulsió', async () => {
    const mon = creaMon({ lots: [lot(Array.from({ length: 10 }, (_, i) => W(i + 1, [FCM, MOZ, APPLE][i % 3])))], push: () => ({ estat: 403 }) });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toMatchObject({ enviats: 0, fallits: 10, sense_provar: 0, expulsats: 0 });
    expect(mon.push).toHaveLength(10);
    expect(cami(mon)).not.toContain('xat_push_expulsa');
  });

  test('amb un enviat abans, els 403 no pausen: es proven tots', async () => {
    const mon = creaMon({ lots: [lot(Array.from({ length: 10 }, (_, i) => W(i + 1)))], push: (_c, i) => ({ estat: i === 0 ? 201 : 403 }) });
    const r = await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 1, fallits: 9, sense_provar: 0 });
    expect(mon.push).toHaveLength(10);
  });

  test('un 429 d’un amfitrió el pausa a ell i prou', async () => {
    const mon = creaMon({
      lots: [lot([W(1, FCM), W(2, FCM), W(3, FCM), W(4, MOZ), W(5, MOZ)])],
      push: (c) => ({ estat: c.host === FCM ? 429 : 201 })
    });
    const r = await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 2, fallits: 1, sense_provar: 2 });
    expect(mon.push.map((c) => c.host)).toEqual([FCM, MOZ, MOZ]);
  });

  test('la pausa del web (la clau pròpia que no signa) no atura els natius', async () => {
    const apns = [];
    const mon = creaMon({ lots: [lot([W(1), W(2), IOS(3), IOS(4)])] });
    const r = await gestorDe(mon, {
      subtle: subtleQueNoSignaElJwt(),
      opcions: { CONCURRENCIA: 1 },
      creaEnviadorsNatius: async () => ({ apns: async (d) => { apns.push(d); return { resultat: 'enviat', estat: 200 }; } })
    })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 2, fallits: 1, sense_provar: 1 });
    expect(mon.push).toEqual([]);
    expect(apns).toHaveLength(2);
  });
});

/* G1-B-seg-01 (Gauntlet 1, P2): una persona amb sessió pot desar una subscripció
   web feta amb una altra applicationServerKey (Mozilla respon 401 errno 109,
   FCM i Apple 403) o un testimoni natiu inventat (BadDeviceToken). Cap
   resposta que puga ser d'un sol aparell pot pausar el proveïdor per als
   altres: es tracta per aparell, sense expulsar. Només pausa un senyal que no
   pot vindre d'un aparell (la credencial pròpia: la signatura del JWT VAPID,
   APNs 403, FCM 401 o 403 sense codi d'aparell, la credencial natiu que falla). */
describe('G1-B-seg-01: una resposta d’un sol aparell no atura els avisos dels altres', () => {
  const ATAC = (n, host = MOZ) => ({ id: id(5000 + n), tipus: 'web', adreca: `https://${host}/canari/atacant-${n}`, llengua: 'ca' });
  const legitims = (n, desde = 1) => Array.from({ length: n }, (_, i) => W(desde + i, [FCM, MOZ, APPLE][i % 3]));
  const deuAtacants = () => Array.from({ length: 10 }, (_, i) => ATAC(i + 1, [MOZ, FCM, APPLE][i % 3]));
  const pushAtac = (estat) => (c) => ({ estat: c.url.includes('/atacant-') ? estat : 201 });

  test.each([[401], [403]])('una subscripció web amb %i la primera de la cua: els quaranta legítims reben l’avís i no s’expulsa res', async (estat) => {
    const mon = creaMon({ lots: [lot([ATAC(1), ...legitims(40)])], push: pushAtac(estat) });
    const r = await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 40, fallits: 1, sense_provar: 0, expulsats: 0 });
    expect(mon.push).toHaveLength(41);
    expect(cami(mon)).not.toContain('xat_push_expulsa');
  });

  test.each([[401], [403]])('deu subscripcions amb %i (el sostre d’un compte) barrejades a l’atzar entre quaranta: tots els legítims, en les 25 passades', async (estat) => {
    for (let llavor = 1; llavor <= 25; llavor++) {
      const mon = creaMon({ lots: [lot(barreja([...deuAtacants(), ...legitims(40)], llavor))], push: pushAtac(estat) });
      const cos = await (await gestorDe(mon)(peticio())).json();
      expect(cos, `llavor ${llavor}`).toMatchObject({ enviats: 40, fallits: 10, sense_provar: 0, expulsats: 0 });
    }
  });

  test.each([[401], [403]])('l’atacant sol al lot 1 (deu de %i) i els legítims al lot 2: res no travessa els lots', async (estat) => {
    const mon = creaMon({ lots: [lot(deuAtacants()), lot(legitims(40))], push: pushAtac(estat) });
    const cos = await (await gestorDe(mon)(peticio())).json();
    expect(cos).toMatchObject({ lots: 2, enviats: 40, fallits: 10, sense_provar: 0, expulsats: 0 });
  });

  test.each([
    ['apns BadDeviceToken', 'apns', IOS, { resultat: 'rebutjat', estat: 400 }],
    ['apns DeviceTokenNotForTopic', 'apns', IOS, { resultat: 'rebutjat', estat: 400 }],
    ['fcm SENDER_ID_MISMATCH', 'fcm', AND, { resultat: 'rebutjat', estat: 403 }],
    ['apns 429 TooManyRequests (d’un testimoni)', 'apns', IOS, { resultat: 'reintenta', estat: 429 }]
  ])('natius, %s: deu testimonis de l’atacant sols al lot 1 i trenta legítims al lot 2, tots avisats', async (_, tipus, fes, resposta) => {
    const atacants = new Set(Array.from({ length: 10 }, (__, i) => fes(900 + i).adreca));
    const crides = [];
    const mon = creaMon({ lots: [lot(Array.from({ length: 10 }, (__, i) => fes(900 + i))), lot(Array.from({ length: 30 }, (__, i) => fes(i + 1)))] });
    const r = await gestorDe(mon, {
      creaEnviadorsNatius: async () => ({ [tipus]: async (d) => { crides.push(d.adreca); return atacants.has(d.adreca) ? resposta : { resultat: 'enviat', estat: 200 }; } })
    })(peticio());
    expect(await r.json()).toMatchObject({ lots: 2, enviats: 30, fallits: 10, sense_provar: 0, expulsats: 0 });
    expect(crides).toHaveLength(40);
    expect(cami(mon)).not.toContain('xat_push_expulsa');
  });

  /* Els controls: el senyal global sí que pausa, i només el seu proveïdor. */
  test('la signatura del JWT VAPID propi que falla («config», estat 0) sí que pausa el web: cap petició', async () => {
    const mon = creaMon({ lots: [lot(legitims(10))] });
    const r = await gestorDe(mon, { subtle: subtleQueNoSignaElJwt(), opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 0, fallits: 1, sense_provar: 9, expulsats: 0 });
    expect(mon.push).toEqual([]);
    expect(registre.linies.at(-1)).toContain('web config=1');
  });

  test('un «config» natiu (la credencial pròpia: APNs 403) pausa APNs i prou: FCM i el web continuen', async () => {
    const apns = [];
    const mon = creaMon({ lots: [lot([...Array.from({ length: 10 }, (_, i) => IOS(i + 1)), AND(11), AND(12), W(13)])] });
    const r = await gestorDe(mon, {
      opcions: { CONCURRENCIA: 1 },
      creaEnviadorsNatius: async () => ({
        apns: async (d) => { apns.push(d); return { resultat: 'config', estat: 403 }; },
        fcm: async () => ({ resultat: 'enviat', estat: 200 })
      })
    })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 3, fallits: 1, sense_provar: 9, expulsats: 0 });
    expect(apns).toHaveLength(1);
  });
});

/* A-02 (àrbitre de F2-NOTIFICA-XAT, el mateix tipus de defecte per la via del
   429): Apple documenta el 429 de Web Push com «massa peticions al mateix
   destí», amb el reason TooManyRequests d'UN testimoni. Una persona (o un xat
   molt actiu) que el provoque no pot pausar web.push.apple.com per a tots: es
   compta per aparell, i eixe aparell es salta la resta de la passada (no es
   martelleja un testimoni retallat). La resta de 429 continuen pausant. */
describe('A-02: un 429 d’un sol aparell d’Apple no pausa els altres ni es martelleja', () => {
  const SAFARI = (n) => ({ id: id(7000 + n), tipus: 'web', adreca: `https://${APPLE}/canari/safari-${n}`, llengua: 'ca' });
  const RETALLAT = { id: id(6999), tipus: 'web', adreca: `https://${APPLE}/canari/retallat`, llengua: 'ca' };
  const safaris = (n, desde = 1) => Array.from({ length: n }, (_, i) => SAFARI(desde + i));
  const TMR = { estat: 429, cos: { reason: 'TooManyRequests' } };
  const pushRetallat = (resposta) => (c) => (c.url.endsWith('/retallat') ? resposta : { estat: 201 });

  test('el retallat el primer de la cua: els quaranta Safari legítims reben l’avís', async () => {
    const mon = creaMon({ lots: [lot([RETALLAT, ...safaris(40)])], push: pushRetallat(TMR) });
    const r = await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 40, fallits: 1, sense_provar: 0, expulsats: 0 });
    expect(mon.push).toHaveLength(41);
    expect(registre.linies.at(-1)).toContain('web reintenta 429=1');
  });

  test('el retallat sol al lot 1 i quaranta Safari al lot 2: res no travessa els lots', async () => {
    const mon = creaMon({ lots: [lot([RETALLAT, ...safaris(3)]), lot(safaris(40, 100))], push: pushRetallat(TMR) });
    const cos = await (await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio())).json();
    expect(cos).toMatchObject({ lots: 2, enviats: 43, fallits: 1, sense_provar: 0, expulsats: 0 });
  });

  test('el mateix aparell retallat en deu lots: una sola petició a eixe aparell, i tots els altres avisats', async () => {
    const lots = Array.from({ length: 10 }, (_, i) => lot([RETALLAT, ...safaris(2, 1 + 2 * i)]));
    const mon = creaMon({ lots, push: pushRetallat(TMR) });
    const cos = await (await gestorDe(mon)(peticio())).json();
    expect(mon.push.filter((c) => c.url.endsWith('/retallat'))).toHaveLength(1);
    expect(cos).toMatchObject({ lots: 10, enviats: 20, fallits: 1, sense_provar: 9, expulsats: 0 });
  });

  test('natius: un APNs «reintenta» 429 (TooManyRequests) en deu lots es busca una sola vegada', async () => {
    const crides = [];
    const lots = Array.from({ length: 10 }, (_, i) => lot([IOS(900), IOS(1 + 2 * i), IOS(2 + 2 * i)]));
    const mon = creaMon({ lots });
    const r = await gestorDe(mon, {
      creaEnviadorsNatius: async () => ({ apns: async (d) => { crides.push(d.adreca); return d.adreca === IOS(900).adreca ? { resultat: 'reintenta', estat: 429 } : { resultat: 'enviat', estat: 200 }; } })
    })(peticio());
    expect(crides.filter((a) => a === IOS(900).adreca)).toHaveLength(1);
    expect(await r.json()).toMatchObject({ lots: 10, enviats: 20, fallits: 1, sense_provar: 9, expulsats: 0 });
  });

  /* Els controls: el salt és només del 429 d'un aparell; la resta continua com abans. */
  test.each([
    ['sense cos', { estat: 429 }],
    ['amb un altre motiu', { estat: 429, cos: { reason: 'ServiceUnavailable' } }]
  ])('un 429 d’Apple %s continua pausant web.push.apple.com i prou: FCM continua', async (_, resposta) => {
    const mon = creaMon({ lots: [lot([RETALLAT, ...safaris(3), W(1, FCM), W(2, FCM), W(3, FCM)])], push: pushRetallat(resposta) });
    const cos = await (await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio())).json();
    expect(cos).toMatchObject({ enviats: 3, fallits: 1, sense_provar: 3, expulsats: 0 });
    expect(mon.push.filter((c) => c.host === APPLE)).toHaveLength(1);
    expect(registre.linies.at(-1)).toContain('web ritme 429=1');
  });

  test('un TooManyRequests d’un altre amfitrió (Mozilla) no es creu: pausa Mozilla, com qualsevol 429', async () => {
    const mon = creaMon({
      lots: [lot([{ ...RETALLAT, adreca: `https://${MOZ}/canari/retallat` }, W(1, MOZ), W(2, MOZ), W(3, FCM)])],
      push: pushRetallat(TMR)
    });
    const cos = await (await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio())).json();
    expect(cos).toMatchObject({ enviats: 1, fallits: 1, sense_provar: 2 });
  });

  test('un «reintenta» sense 429 (un 500) no salta l’aparell: es torna a provar en cada lot', async () => {
    const lots = Array.from({ length: 3 }, (_, i) => lot([RETALLAT, SAFARI(1 + i)]));
    const mon = creaMon({ lots, push: pushRetallat({ estat: 500 }) });
    const cos = await (await gestorDe(mon)(peticio())).json();
    expect(mon.push.filter((c) => c.url.endsWith('/retallat'))).toHaveLength(3);
    expect(cos).toMatchObject({ lots: 3, enviats: 3, fallits: 3, sense_provar: 0 });
  });
});

describe('la guarda SSRF del worker: una fila manipulada no es busca mai', () => {
  test('metadades del núvol, http, majúscules, port, tipus i ids estranys, testimonis dolents i repetits: sense_provar', async () => {
    const manipulades = [
      { id: id(2), tipus: 'web', adreca: 'https://169.254.169.254/latest', llengua: 'ca' },
      { id: id(3), tipus: 'web', adreca: 'http://fcm.googleapis.com/x', llengua: 'ca' },
      { id: id(4), tipus: 'web', adreca: 'https://FCM.googleapis.com/x', llengua: 'ca' },
      { id: id(5), tipus: 'web', adreca: 'https://fcm.googleapis.com:444/x', llengua: 'ca' },
      { id: id(6), tipus: 'smtp', adreca: 'https://fcm.googleapis.com/x', llengua: 'ca' },
      { id: 'no-es-un-uuid', tipus: 'web', adreca: W(7).adreca, llengua: 'ca' },
      { id: 'ABCDEF00-0000-4000-8000-000000000008', tipus: 'web', adreca: W(8).adreca, llengua: 'ca' },
      { id: id(9), tipus: 'apns', adreca: 'XYZ'.repeat(30), llengua: 'ca' },
      { id: id(10), tipus: 'fcm', adreca: 'curt', llengua: 'ca' },
      { id: id(11), tipus: 'web', adreca: { endpoint: W(11).adreca }, llengua: 'ca' },
      null,
      'https://169.254.169.254/latest',
      W(1)
    ];
    const mon = creaMon({ lots: [lot([W(1), ...manipulades])] });
    const r = await gestorDe(mon, { creaEnviadorsNatius: async () => ({ apns: async () => ({ resultat: 'enviat' }), fcm: async () => ({ resultat: 'enviat' }) }) })(peticio());
    const cos = await r.json();
    expect(cos).toMatchObject({ dispositius: 14, enviats: 1, sense_provar: 13, expulsats: 0, fallits: 0 });
    expect(mon.push.map((c) => c.url)).toEqual([W(1).adreca]);
    expect(mon.crides.map((c) => c.host)).not.toContain('169.254.169.254');
    expect(JSON.stringify(cos)).not.toContain('169.254');
  });

  test('formaDelDispositiu: les formes bones i la llengua', () => {
    expect(formaDelDispositiu(W(1, MOZ))).toEqual({ id: id(1), tipus: 'web', adreca: W(1, MOZ).adreca, llengua: 'ca', clauDePausa: `web ${MOZ}` });
    expect(formaDelDispositiu(IOS(2, 'xx'))).toEqual({ id: id(2), tipus: 'apns', adreca: IOS(2).adreca, llengua: 'ca', clauDePausa: 'apns' });
    expect(formaDelDispositiu(AND(3, 'eu'))).toMatchObject({ tipus: 'fcm', llengua: 'eu', clauDePausa: 'fcm' });
    expect(formaDelDispositiu({ ...IOS(4), adreca: 'a'.repeat(63) })).toBeNull();
    expect(formaDelDispositiu({ ...IOS(4), adreca: 'a'.repeat(201) })).toBeNull();
    expect(formaDelDispositiu({ ...IOS(4), adreca: 'A'.repeat(64) })).toBeNull();
    expect(formaDelDispositiu({ ...AND(5), adreca: 'a'.repeat(1025) })).toBeNull();
    expect(formaDelDispositiu({ ...AND(5), adreca: `${'a'.repeat(40)}/x` })).toBeNull();
    expect(formaDelDispositiu(undefined)).toBeNull();
  });

  /* ARB-N01-02 (A06): com a molt MAXIM_DISPOSITIUS aparells per lot; la fila 5.001 no es busca encara que siga bona. */
  test('una fila de més del sostre de MAXIM_DISPOSITIUS no es busca: sense_provar', async () => {
    const total = NOTIFICA.MAXIM_DISPOSITIUS + 1;
    const mon = creaMon({ lots: [lot(Array.from({ length: total }, (_, i) => W(i + 1)))] });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toEqual({ ...RESPOSTA_BUIDA, missatges: 1, dispositius: total, enviats: NOTIFICA.MAXIM_DISPOSITIUS, sense_provar: 1, lots: 1 });
    expect(mon.push).toHaveLength(NOTIFICA.MAXIM_DISPOSITIUS);
    expect(mon.push.some((c) => c.url === W(total).adreca)).toBe(false);
    expect(mon.push.some((c) => c.url === W(NOTIFICA.MAXIM_DISPOSITIUS).adreca)).toBe(true);
  });
});

describe('el pressupost de temps i la concurrència', () => {
  test('cap enviament si no hi cap un topall sencer: esgotat, i la resta sense provar', async () => {
    let t = 0;
    const mon = creaMon({ lots: [lot([W(1), W(2), W(3), W(4)]), lot([W(5)])], push: () => { t += 40; return { estat: 201 }; } });
    const r = await gestorDe(mon, { ara: () => t, opcions: { PRESSUPOST_MS: 100, TOPALL_MS: 30, CONCURRENCIA: 1 } })(peticio());
    /* 0 ms: lot (100 ≥ 60) · 1 (100 ≥ 30) → 40 · 2 (60 ≥ 30) → 80 · 3 i 4 (20 < 30) sense provar; cap lot més. */
    expect(await r.json()).toEqual({ ...RESPOSTA_BUIDA, missatges: 1, dispositius: 4, enviats: 2, sense_provar: 2, lots: 1, esgotat: true });
    expect(mon.lots).toHaveLength(1);
  });

  test('cap lot nou si no hi caben dos topalls', async () => {
    let t = 0;
    const mon = creaMon({ lots: [lot([W(1), W(2)]), lot([W(3)])], push: () => { t += 45; return { estat: 201 }; } });
    const r = await gestorDe(mon, { ara: () => t, opcions: { PRESSUPOST_MS: 100, TOPALL_MS: 30, CONCURRENCIA: 1 } })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 2, lots: 1, esgotat: true });
    expect(cami(mon).filter((c) => c === 'xat_push_reclama')).toHaveLength(1);
  });

  /* ARB-N01-02 (A15): el cas que discrimina la regla de §2.6 pas 5. Hi cap un topall (50 ≥ 30) però no dos (50 < 60). */
  test('amb un topall i mig de pressupost, cap lot nou: la segona reclamació no es fa', async () => {
    let t = 0;
    const mon = creaMon({ lots: [lot([W(1), W(2)]), lot([W(3)])], push: () => { t += 25; return { estat: 201 }; } });
    const r = await gestorDe(mon, { ara: () => t, opcions: { PRESSUPOST_MS: 100, TOPALL_MS: 30, CONCURRENCIA: 1 } })(peticio());
    /* 0 ms: lot (100 ≥ 60) · 1 → 25 · 2 (75 ≥ 30) → 50 · lot nou? 50 < 60: no. */
    expect(t).toBe(50);
    expect(await r.json()).toEqual({ ...RESPOSTA_BUIDA, missatges: 1, dispositius: 2, enviats: 2, lots: 1, esgotat: true });
    expect(cami(mon).filter((c) => c === 'xat_push_reclama')).toHaveLength(1);
    expect(mon.lots).toHaveLength(1);
  });

  test('mai més de CONCURRENCIA peticions alhora, i les arriba a fer', async () => {
    const mon = creaMon({ lots: [lot(Array.from({ length: 30 }, (_, i) => W(i + 1, [FCM, MOZ][i % 2])))], push: async () => { await espera(5); return { estat: 201 }; } });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toMatchObject({ enviats: 30 });
    expect(mon.maxEnVol).toBe(NOTIFICA.CONCURRENCIA);
  });

  test('enviaAmbLimit: n treballadors en ordre, i el primer error després d’acabar', async () => {
    let enVol = 0;
    let maxim = 0;
    const fets = [];
    await enviaAmbLimit([1, 2, 3, 4, 5, 6, 7], 3, async (x) => {
      enVol += 1; maxim = Math.max(maxim, enVol);
      await espera(2);
      fets.push(x); enVol -= 1;
    });
    expect(maxim).toBe(3);
    expect(fets.sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const vistos = [];
    await expect(enviaAmbLimit([1, 2, 3], 2, async (x) => { vistos.push(x); if (x === 1) throw new Error('u'); })).rejects.toThrow('u');
    expect(vistos.sort()).toEqual([1, 2, 3]);
    await enviaAmbLimit([], 8, () => { throw new Error('mai'); });
    expect(trossos([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe('sense VAPID o sense natius: sense_proveidor, mai expulsió', () => {
  test.each([
    ['sense pública', { SDP_PUSH_VAPID_PUBLICA: undefined }],
    ['sense privada', { SDP_PUSH_VAPID_PRIVADA: undefined }],
    ['sense contacte', { SDP_PUSH_VAPID_SUBJECTE: undefined }],
    ['amb els noms vells (SDP_VAPID_*)', { SDP_PUSH_VAPID_PUBLICA: undefined, SDP_PUSH_VAPID_PRIVADA: undefined, SDP_VAPID_PUBLICA: 'x', SDP_VAPID_PRIVADA: 'y' }]
  ])('%s: els aparells web en sense_proveidor, cap push ni expulsió', async (_, extra) => {
    const mon = creaMon({ lots: [lot([W(1), W(2, MOZ)])] });
    const r = await creaGestor({ env: envBase(extra), fetch: mon.fetch, registre })(peticio());
    expect(await r.json()).toMatchObject({ ok: true, dispositius: 2, sense_proveidor: 2, enviats: 0, expulsats: 0 });
    expect(mon.push).toEqual([]);
    expect(cami(mon)).not.toContain('xat_push_expulsa');
    expect(registre.linies.some((l) => l.includes('Sense VAPID'))).toBe(true);
  });

  test('sense creaEnviadorsNatius, els natius en sense_proveidor', async () => {
    const mon = creaMon({ lots: [lot([IOS(1), AND(2), W(3)])] });
    const r = await gestorDe(mon)(peticio());
    expect(await r.json()).toMatchObject({ enviats: 1, sense_proveidor: 2, expulsats: 0 });
    expect(mon.push).toHaveLength(1);
  });
});

describe('els enviadors natius (S3, preparats i inactius)', () => {
  test('creaEnviadorsNatius només es crida si algun lot porta natius, una vegada per passada i amb les dependències', async () => {
    const crides = [];
    const fals = async (deps) => { crides.push(deps); return { apns: async () => ({ resultat: 'enviat', estat: 200 }), fcm: async () => ({ resultat: 'enviat', estat: 200 }) }; };
    const nomesWeb = creaMon({ lots: [lot([W(1)]), lot([W(2)])] });
    await gestorDe(nomesWeb, { creaEnviadorsNatius: fals })(peticio());
    expect(crides).toHaveLength(0);

    const env = envBase();
    const mon = creaMon({ lots: [lot([W(1)]), lot([IOS(2)]), lot([AND(3), IOS(4)])] });
    const r = await creaGestor({ env, fetch: mon.fetch, registre, creaEnviadorsNatius: fals })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 4, lots: 3 });
    expect(crides).toHaveLength(1);
    const [deps] = crides;
    expect(Object.keys(deps).sort()).toEqual(['ara', 'env', 'fetch', 'registre', 'rpc', 'subtle', 'topallMs']);
    expect(deps.env).toBe(env);
    expect(deps.fetch).toBe(mon.fetch);
    expect(deps.topallMs).toBe(NOTIFICA.TOPALL_MS);
    expect(deps.registre).toBe(registre);
  });

  test('el rpc que reben va a PostgREST amb la clau de servei, i només a les RPC del worker', async () => {
    let rpc = null;
    const mon = creaMon({ lots: [lot([IOS(1)])] });
    await gestorDe(mon, { creaEnviadorsNatius: async (deps) => { rpc = deps.rpc; return {}; } })(peticio());
    const abans = mon.crides.length;
    expect(await rpc('xat_push_credencial', { p_proveidor: 'apns' })).toBeNull();
    const crida = mon.crides[abans];
    expect(crida.url).toBe(`${URL_SB}/rest/v1/rpc/xat_push_credencial`);
    expect(crida.cos).toEqual({ p_proveidor: 'apns' });
    expect(crida.capcaleres).toMatchObject({ apikey: CLAU_LEGADA });
    await expect(rpc('pg_sleep', {})).rejects.toMatchObject({ codi: 'rpc' });
    await expect(rpc('xat_push_desa', {})).rejects.toMatchObject({ codi: 'rpc' });
    expect(mon.crides).toHaveLength(abans + 1);
    expect(RPC_DEL_WORKER).toEqual(['xat_push_neteja', 'xat_push_reclama', 'xat_push_expulsa', 'xat_push_credencial', 'xat_push_desa_credencial']);
  });

  test('cada enviador natiu rep només { tipus, adreca, llengua } validats', async () => {
    const rebuts = [];
    const mon = creaMon({ lots: [lot([IOS(1, 'es'), AND(2, 'zz')])] });
    await gestorDe(mon, {
      creaEnviadorsNatius: async () => ({
        apns: async (d) => { rebuts.push(d); return { resultat: 'enviat' }; },
        fcm: async (d) => { rebuts.push(d); return { resultat: 'enviat' }; }
      })
    })(peticio());
    expect(rebuts).toEqual([{ tipus: 'apns', adreca: IOS(1).adreca, llengua: 'es' }, { tipus: 'fcm', adreca: AND(2).adreca, llengua: 'ca' }]);
  });

  test.each([
    ['llança', async () => { throw new Error('secret mal format'); }],
    ['torna una forma estranya', async () => ({ apns: 'no és una funció', fcm: null })],
    ['torna null', async () => null]
  ])('si creaEnviadorsNatius %s: {} i sense_proveidor, la passada continua', async (_, fals) => {
    const mon = creaMon({ lots: [lot([IOS(1), AND(2), W(3)])] });
    const r = await gestorDe(mon, { creaEnviadorsNatius: fals })(peticio());
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ enviats: 1, sense_proveidor: 2 });
  });

  test.each([
    ['apns', 'BadDeviceToken', { resultat: 'rebutjat', estat: 400 }],
    ['apns', 'DeviceTokenNotForTopic', { resultat: 'rebutjat', estat: 400 }],
    ['fcm', 'SENDER_ID_MISMATCH', { resultat: 'rebutjat', estat: 403 }]
  ])('un «rebutjat» de %s (%s) no pausa (G1-B-seg-01): deu aparells, deu peticions i cap expulsió', async (tipus, _motiu, resposta) => {
    const fes = tipus === 'apns' ? IOS : AND;
    const crides = [];
    const mon = creaMon({ lots: [lot(Array.from({ length: 10 }, (_, i) => fes(i + 1)))] });
    const r = await gestorDe(mon, { creaEnviadorsNatius: async () => ({ [tipus]: async (d) => { crides.push(d); return resposta; } }) })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 0, fallits: 10, sense_provar: 0, expulsats: 0 });
    expect(crides).toHaveLength(10);
    expect(cami(mon)).not.toContain('xat_push_expulsa');
  });

  test('l’«expulsa» d’APNs (410) i d’FCM (404 UNREGISTERED) sí que expulsa', async () => {
    const mon = creaMon({ lots: [lot([IOS(1), AND(2), IOS(3)])] });
    const r = await gestorDe(mon, {
      creaEnviadorsNatius: async () => ({
        apns: async (d) => (d.adreca === IOS(1).adreca ? { resultat: 'expulsa', estat: 410 } : { resultat: 'enviat', estat: 200 }),
        fcm: async () => ({ resultat: 'expulsa', estat: 404 })
      })
    })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 1, expulsats: 2 });
    expect(mon.expulsats.flat().sort()).toEqual([id(1), id(2)]);
  });

  /* ARB-N01-02 (A26): només l'«expulsa» expulsa (D-B8S-13). Un «invalid» d'un enviador natiu no s'ha provat: sense_provar. */
  test('un «invalid» d’un enviador natiu no expulsa mai: sense_provar, ni fallit', async () => {
    const mon = creaMon({ lots: [lot([IOS(1), AND(2), IOS(3)])] });
    const r = await gestorDe(mon, {
      creaEnviadorsNatius: async () => ({
        apns: async () => ({ resultat: 'invalid' }),
        fcm: async () => ({ resultat: 'invalid', estat: 400 })
      })
    })(peticio());
    expect(await r.json()).toEqual({ ...RESPOSTA_BUIDA, missatges: 1, dispositius: 3, sense_provar: 3, lots: 1 });
    expect(cami(mon)).not.toContain('xat_push_expulsa');
    expect(mon.expulsats).toEqual([]);
  });

  test('un enviador natiu que penja, que llança o que torna brossa: fallit, i la passada acaba', async () => {
    const mon = creaMon({ lots: [lot([IOS(1), IOS(2), IOS(3), IOS(4)])] });
    const respostes = [
      () => new Promise(() => {}),
      async () => { throw new Error(`fallada ${IOS(2).adreca}`); },
      async () => ({ resultat: `classe-${IOS(3).adreca}`, estat: 'canari' }),
      async () => undefined
    ];
    let i = 0;
    const inici = Date.now();
    const r = await gestorDe(mon, { opcions: { TOPALL_MS: 20, PRESSUPOST_MS: 5000, CONCURRENCIA: 1 }, creaEnviadorsNatius: async () => ({ apns: () => respostes[i++]() }) })(peticio());
    expect(await r.json()).toMatchObject({ enviats: 0, fallits: 4, expulsats: 0 });
    expect(Date.now() - inici).toBeLessThan(2000);
    for (const linia of registre.linies) expect(linia).not.toContain(IOS(3).adreca);
  });
});

describe('la base que falla o penja', () => {
  test.each([
    ['la neteja', 'xat_push_neteja'],
    ['la reclamació', 'xat_push_reclama']
  ])('si %s respon 500: 502 i cap push', async (_, rpc) => {
    const mon = creaMon({ lots: [lot([W(1)])], base: (c) => (c.endsWith(rpc) ? new Response('{"message":"x"}', { status: 500 }) : null) });
    const r = await gestorDe(mon)(peticio());
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ ...RESPOSTA_BUIDA, ok: false, error: 'base' });
    expect(mon.push).toEqual([]);
    expect(registre.linies).toContain('[notifica-xat] La base no respon: base 500');
  });

  test('si falla l’expulsió: 502 amb els recomptes de la passada', async () => {
    const mon = creaMon({
      lots: [lot([W(1), W(2)])], push: (_c, i) => ({ estat: i === 0 ? 201 : 410 }),
      base: (c) => (c.endsWith('xat_push_expulsa') ? new Response('{}', { status: 503 }) : null)
    });
    const r = await gestorDe(mon, { opcions: { CONCURRENCIA: 1 } })(peticio());
    expect(r.status).toBe(502);
    expect(await r.json()).toMatchObject({ ok: false, error: 'base', enviats: 1, expulsats: 0, lots: 1 });
  });

  test.each([[[]], [null], ['text'], [7]])('una reclamació amb forma estranya (%j) és 502', async (forma) => {
    const mon = creaMon({ base: (c) => (c.endsWith('xat_push_reclama') ? Response.json(forma) : null) });
    const r = await gestorDe(mon)(peticio());
    expect(r.status).toBe(502);
    expect(registre.linies).toContain('[notifica-xat] La base no respon: forma');
  });

  test('un cos de més de MAXIM_COS_BASE no es llig sencer: 502 «cos»', async () => {
    const mon = creaMon({ lots: [lot(Array.from({ length: 20 }, (_, i) => W(i + 1)))] });
    const r = await gestorDe(mon, { opcions: { MAXIM_COS_BASE: 256 } })(peticio());
    expect(r.status).toBe(502);
    expect(registre.linies).toContain('[notifica-xat] La base no respon: cos');
    expect(mon.push).toEqual([]);
  });

  test('una Content-Length declarada de més es rebutja sense llegir el cos', async () => {
    let llegit = 0;
    const flux = new ReadableStream({ pull(c) { llegit += 1; c.enqueue(new TextEncoder().encode('{}')); c.close(); } }, { highWaterMark: 0 });
    const mon = creaMon({ base: (c) => (c.endsWith('xat_push_neteja') ? new Response(flux, { status: 200, headers: { 'Content-Length': String(3 * 1024 * 1024) } }) : null) });
    const r = await gestorDe(mon)(peticio());
    expect(r.status).toBe(502);
    expect(registre.linies).toContain('[notifica-xat] La base no respon: cos');
    expect(llegit).toBe(0);
  });

  test('una reclamació que envia les capçaleres i penja el cos: «temps» al topall, 502, i el lector es cancel·la', async () => {
    const estat = { cancel: 0 };
    let enviat = false;
    const flux = new ReadableStream({
      pull(c) {
        if (!enviat) { enviat = true; c.enqueue(new TextEncoder().encode('{"missatges":1,')); return undefined; }
        return new Promise(() => {});
      },
      cancel() { estat.cancel += 1; }
    }, { highWaterMark: 0 });
    let senyal = null;
    const mon = creaMon({ base: (c, _cos, opcions) => { if (!c.endsWith('xat_push_reclama')) return null; senyal = opcions.signal; return new Response(flux, { status: 200 }); } });
    const inici = Date.now();
    const r = await gestorDe(mon, { opcions: { TOPALL_MS: 20, PRESSUPOST_MS: 5000 } })(peticio());
    expect(r.status).toBe(502);
    expect(Date.now() - inici).toBeLessThan(1000);
    expect(senyal.aborted).toBe(true);
    expect(estat.cancel).toBe(1);
    expect(registre.linies).toContain('[notifica-xat] La base no respon: temps');
  });

  test('el cos d’un error de la base que penja es cancel·la sense esperar-lo', async () => {
    const estat = { cancel: 0 };
    const flux = new ReadableStream({ pull: () => new Promise(() => {}), cancel() { estat.cancel += 1; } }, { highWaterMark: 0 });
    const mon = creaMon({ base: (c) => (c.endsWith('xat_push_reclama') ? new Response(flux, { status: 500 }) : null) });
    const inici = Date.now();
    const r = await gestorDe(mon, { opcions: { TOPALL_MS: 5000 } })(peticio());
    expect(r.status).toBe(502);
    expect(Date.now() - inici).toBeLessThan(1000);
    expect(estat.cancel).toBe(1);
  });
});

describe('cap endpoint, testimoni, JWT ni secret ix del worker (canaris)', () => {
  test('ni a les respostes ni al registre, en cap dels camins', async () => {
    const jwts = new Set();
    const aparells = [W(1, FCM), W(2, MOZ), W(3, APPLE), IOS(4), AND(5)];
    const camins = [
      { push: (c) => { jwts.add(c.capcaleres.Authorization); return { estat: 201 }; } },
      { push: () => ({ estat: 410 }) },
      { push: () => ({ estat: 401 }) },
      { push: (c) => { throw new TypeError(`fetch failed ${c.url}`); } },
      { base: (c) => (c.endsWith('xat_push_expulsa') ? new Response(JSON.stringify({ message: W(1).adreca }), { status: 500 }) : null), push: () => ({ estat: 404 }) },
      { base: (c) => (c.endsWith('xat_push_reclama') ? new Response(JSON.stringify({ message: `${IOS(4).adreca} ${AND(5).adreca}` }), { status: 500 }) : null) }
    ];
    for (const extra of camins) {
      for (const actiu of ['si', undefined]) {
        registre = creaRegistre();
        const mon = creaMon({ lots: [lot(aparells)], ...extra });
        const r = await creaGestor({
          env: envBase({ SDP_PUSH_ACTIU: actiu }), fetch: mon.fetch, registre,
          creaEnviadorsNatius: async () => ({
            apns: async (d) => ({ resultat: 'enviat', estat: 200, eco: d.adreca }),
            fcm: async (d) => { throw new Error(`fcm ${d.adreca}`); }
          })
        })(peticio());
        const text = await r.text();
        const canaris = ['canari', ...aparells.map((d) => d.adreca), IOS(4).adreca.slice(0, 40), SECRET_CRON, CLAU_LEGADA, VAPID.privada, VAPID.publica, 'vapid t=', ...jwts];
        for (const canari of canaris) {
          expect(text).not.toContain(canari);
          for (const linia of registre.linies) expect(linia).not.toContain(canari);
        }
      }
    }
    expect(jwts.size).toBeGreaterThan(0);
  });

  test('el registre diu recomptes i classes', async () => {
    const mon = creaMon({ lots: [lot([W(1), W(2, MOZ)])], push: (c) => ({ estat: c.host === FCM ? 201 : 410 }) });
    await gestorDe(mon)(peticio());
    const resum = registre.linies.at(-1);
    expect(resum).toContain('enviats=1');
    expect(resum).toContain('expulsats=1');
    expect(resum).toContain('web enviat 201=1');
    expect(resum).toContain('web expulsa 410=1');
  });
});

describe('la frontera', () => {
  const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const fitxers = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const c = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : fitxers(c);
    return /\.(js|jsx|mjs|ts|tsx|json|html)$/.test(e.name) ? [c] : [];
  });
  /* wikiManifest.js el genera la Wiki: és prosa, no codi. */
  const GENERATS = new Set(['src/data/wikiManifest.js']);
  const sensComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

  /* Gauntlet R10 · VFC-05 · La frontera cobrix les cinc RPC del worker, també xat_push_desa_credencial (la
     dels enviadors natius, natius.js), i no les del client (xat_push_desa i xat_push_retira, de
     dispositiusAvisos.js) ni la funció privada de validació que els comentaris de src/ citen. */
  const RPC_FRONTERA = /xat_push_(?:reclama|expulsa|neteja|(?:desa_)?credencial)/;
  const FRONTERA = new RegExp(`${RPC_FRONTERA.source}|SDP_PUSH_VAPID_PRIVADA|SDP_APNS_CLAU_P8|SDP_FCM_COMPTE_SERVEI`);

  test('VFC-05 · la frontera cobrix cada RPC de RPC_DEL_WORKER i deixa passar les del client', () => {
    for (const nom of RPC_DEL_WORKER) expect(nom).toMatch(RPC_FRONTERA);
    expect(RPC_DEL_WORKER).toContain('xat_push_desa_credencial');
    for (const nom of ['xat_push_desa', 'xat_push_retira', 'private.xat_push_adreca_valida']) expect(nom).not.toMatch(FRONTERA);
  });

  test('cap fitxer de src/ crida les RPC del worker ni nomena els secrets del servidor', () => {
    const trobats = fitxers(path.join(ARREL, 'src'))
      .filter((f) => !/\.test\.jsx?$/.test(f) && !GENERATS.has(path.relative(ARREL, f)))
      .filter((f) => FRONTERA.test(readFileSync(f, 'utf8')))
      .map((f) => path.relative(ARREL, f));
    expect(trobats).toEqual([]);
  });

  test('index.ts només fa de pont: la llista exacta de B8-SERVIDOR §2.6 (o la variant sense natius), mai tot l’entorn', () => {
    const index = sensComentaris(readFileSync(path.join(ARREL, 'supabase/functions/notifica-xat/index.ts'), 'utf8'));
    const BASE = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SDP_CRON_SECRET', 'SDP_PUSH_ACTIU', 'SDP_PUSH_VAPID_PUBLICA', 'SDP_PUSH_VAPID_PRIVADA', 'SDP_PUSH_VAPID_SUBJECTE'];
    const NATIUS = ['SDP_APNS_EQUIP', 'SDP_APNS_CLAU_ID', 'SDP_APNS_CLAU_P8', 'SDP_APNS_TOPIC', 'SDP_APNS_ENTORN', 'SDP_FCM_COMPTE_SERVEI'];
    const llegides = [...index.matchAll(/Deno\.env\.get\('([A-Z0-9_]+)'\)/g)].map((m) => m[1]);
    const ambNatius = index.includes("from './natius.js'");
    expect(index).toContain("import { creaGestor } from './gestor.js';");
    expect(index).toContain('Deno.serve(creaGestor(');
    expect(index).not.toContain('toObject');
    expect(index).not.toMatch(/SDP_VAPID_/);
    if (ambNatius) {
      expect(llegides).toEqual([...BASE, ...NATIUS]);
      expect(index).toContain("import { creaEnviadorsNatius } from './natius.js';");
      expect(index).toMatch(/\n\s*creaEnviadorsNatius\s*\n/);
      /* L'import no pot quedar penjat: natius.js hi ha de ser i exportar-lo. */
      const natius = path.join(ARREL, 'supabase/functions/notifica-xat/natius.js');
      expect(existsSync(natius)).toBe(true);
      expect(readFileSync(natius, 'utf8')).toMatch(/export (async )?function creaEnviadorsNatius\b/);
    } else {
      expect(llegides).toEqual(BASE);
      expect(index).not.toContain('creaEnviadorsNatius');
    }
  });

  test('el gestor i webpush.js no usen APIs fora del Baseline compartit, i només importen el que toca', () => {
    for (const [nom, imports] of [['gestor.js', ['../_shared/apple.js', './webpush.js']], ['webpush.js', ['../_shared/apple.js']]]) {
      const codi = sensComentaris(readFileSync(path.join(ARREL, 'supabase/functions/notifica-xat', nom), 'utf8'));
      expect(codi).not.toMatch(/\bBuffer\b|\bDeno\.|AbortSignal\.(timeout|any)|\brequire\(|from 'node:|\bprocess\./);
      expect([...codi.matchAll(/^\s*import\s[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1])).toEqual(imports);
    }
  });
});
