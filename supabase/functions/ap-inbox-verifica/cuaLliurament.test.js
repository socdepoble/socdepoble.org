// @vitest-environment node
/* B5 (marató 261101_2143; spec B5-FEDERACIO §2.5 i §4.1) · La cua d'eixida signada: l'espera
   exponencial amb jitter injectable, la classificació de cada resposta, l'enviament signat (la
   signatura es verifica amb la mateixa biblioteca que fa servir un node receptor) i el buidatge
   amb la cua en memòria, que té la semàntica de les RPC ap_cua_*. Cap xarxa: fetch i el
   resoledor són dobles locals; les claus es generen en temps d'execució. */
import { describe, expect, test } from 'vitest';
import { webcrypto } from 'node:crypto';
import { CUA, classificaLliurament, creaCuaEnMemoria, drenaCua, esperaReintent, importaClauPrivada, lliura, xarxaDe } from './cuaLliurament.js';
import { verificaSignaturaHttpActivityPub } from '../../../src/data/federacio/inboxActivityPub.js';
import { AGENT_USUARI } from '../noticies/gestor.js';

const subtle = webcrypto.subtle;
const ORIGEN = 'https://socdepoble.org';
const TORRE = 'la-torre-de-les-macanes';
const ACTOR = `${ORIGEN}/ap/actors/${TORRE}.json`;
const INBOX = 'https://mastodon.example/users/anna/inbox';
const ARA = Date.UTC(2026, 10, 2, 1, 0, 0);
const HORA = 3_600_000;

const parell = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pem = (etiqueta, der) => `-----BEGIN ${etiqueta}-----\n${Buffer.from(der).toString('base64').replace(/(.{64})/g, '$1\n')}\n-----END ${etiqueta}-----\n`;
const PEM_PRIVADA = pem('PRIVATE KEY', await subtle.exportKey('pkcs8', parell.privateKey));
const PEM_PUBLICA = pem('PUBLIC KEY', await subtle.exportKey('spki', parell.publicKey));
const clauPrivada = await importaClauPrivada(PEM_PRIVADA, { subtle });
const claus = new Map([[TORRE, clauPrivada]]);

const accept = (n = 1) => ({
  '@context': 'https://www.w3.org/ns/activitystreams', id: `${ACTOR}#accepts/${String(n).padStart(32, '0')}`, type: 'Accept', actor: ACTOR,
  to: ['https://mastodon.example/users/anna'], object: { id: `https://mastodon.example/users/anna#follows/${n}`, type: 'Follow' }
});
const fila = (extra = {}) => ({ id: 1, slug: TORRE, inbox: INBOX, activitat_id: accept().id, cos: accept(), intents: 1, ...extra });
const publica = async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : []);
const privada = async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : ['fd00::1']);
const rellotge = (inici = ARA) => { let t = inici; return { ara: () => t, avanca: (ms) => { t += ms; } }; };
const fetchQue = (respon) => {
  const crides = [];
  const f = async (url, init) => { crides.push({ url, init }); return respon(url, init, crides.length); };
  return Object.assign(f, { crides });
};

describe('esperaReintent: exponencial fitada amb equal jitter', () => {
  test('amb jitter 0,5 és exactament x·0,75 i és monòtona fins al sostre de 6 h', () => {
    const esperes = Array.from({ length: 12 }, (_, i) => esperaReintent(i + 1, { aleatori: () => 0.5 }));
    expect(esperes).toEqual([45, 90, 180, 360, 720, 1440, 2880, 5760, 11520, 16200, 16200, 16200]);
    for (let i = 1; i < esperes.length; i += 1) expect(esperes[i]).toBeGreaterThanOrEqual(esperes[i - 1]);
  });

  test('aleatori als extrems dona [x/2, x]; un aleatori estrany es fita; un intent invàlid compta com el primer', () => {
    expect([esperaReintent(3, { aleatori: () => 0 }), esperaReintent(3, { aleatori: () => 1 })]).toEqual([120, 240]);
    expect([esperaReintent(3, { aleatori: () => 7 }), esperaReintent(3, { aleatori: () => -3 }), esperaReintent(3, { aleatori: () => NaN })]).toEqual([240, 120, 240]);
    for (const dolent of [0, -1, 1.5, NaN, '3', null]) expect([dolent, esperaReintent(dolent, { aleatori: () => 0.5 })]).toEqual([dolent, 45]);
    expect(esperaReintent(1e6, { aleatori: () => 1 })).toBe(CUA.MAXIM_ESPERA_S);
  });

  test('Retry-After n’és el mínim; mai menys d’1 s ni més d’1 dia', () => {
    expect(esperaReintent(1, { aleatori: () => 0.5, retryAfterS: 3600 })).toBe(3600);
    expect(esperaReintent(8, { aleatori: () => 0.5, retryAfterS: 30 })).toBe(5760);
    expect(esperaReintent(1, { aleatori: () => 0.5, retryAfterS: 10 * 86400 })).toBe(86400);
    expect(esperaReintent(1, { aleatori: () => 0, baseS: 1 })).toBe(1);
    expect(esperaReintent(1, { aleatori: () => 0, baseS: 0.01, maximS: 0 })).toBe(1);
    expect(esperaReintent(30, { aleatori: () => 1, maximS: 1e9 })).toBe(86400);
  });
});

describe('classificaLliurament', () => {
  test('la taula sencera', () => {
    const casos = [
      [{ status: 200 }, 'fet'], [{ status: 202 }, 'fet'], [{ status: 204 }, 'fet'],
      [{ status: 301 }, 'fallit'], [{ status: 302 }, 'fallit'], [{ status: 308 }, 'fallit'],
      ...[400, 401, 403, 404, 405, 410, 413, 415, 422].map((s) => [{ status: s }, 'fallit']),
      [{ status: 409 }, 'fallit'], [{ status: 451 }, 'fallit'],
      ...[408, 425, 429, 500, 502, 503, 504, 599].map((s) => [{ status: s }, 'reintent']),
      [{ error: 'xarxa' }, 'reintent'], [{ error: 'temps' }, 'reintent'], [{ error: 'dns' }, 'reintent'],
      [{ error: 'sense_dns' }, 'reintent'], [{ error: 'sense_clau' }, 'reintent'],
      [{ error: 'adreca_vetada' }, 'fallit'], [{ error: 'redireccio' }, 'fallit'], [{ error: 'fila_invalida' }, 'fallit'],
      [{ status: 0 }, 'reintent'], [{ status: 'x' }, 'reintent'], [{}, 'reintent']
    ];
    for (const [entrada, resultat] of casos) expect([entrada, classificaLliurament(entrada).resultat]).toEqual([entrada, resultat]);
    expect(classificaLliurament({ status: 503 }).motiu).toBe('http_503');
    expect(classificaLliurament({ status: 302 }).motiu).toBe('redireccio');
    expect(classificaLliurament({ error: 'adreca_vetada' }).motiu).toBe('adreca_vetada');
    // Un error amb text arbitrari no arriba al registre de la fila.
    expect(classificaLliurament({ error: 'Bearer eyJsecret…' })).toEqual({ resultat: 'reintent', motiu: 'error' });
  });
});

describe('xarxaDe i importaClauPrivada', () => {
  test('una sola adreça no pública veta; sense resoledor, mai pública; una família caiguda, desconeguda', async () => {
    expect(await xarxaDe('mastodon.example', { resolDns: publica })).toBe('publica');
    expect(await xarxaDe('mastodon.example', { resolDns: privada })).toBe('privada');
    expect(await xarxaDe('mastodon.example')).toBe('sense-dns');
    expect(await xarxaDe('mastodon.example', { resolDns: async (h, t) => { if (t === 'AAAA') throw new Error('x'); return ['93.184.216.34']; } })).toBe('desconeguda');
    expect(await xarxaDe('mastodon.example', { resolDns: async (h, t) => { if (t === 'AAAA') throw new Error('x'); return ['127.0.0.1']; } })).toBe('privada');
    expect(await xarxaDe('mastodon.example', { resolDns: async () => [] })).toBe('desconeguda');
  });

  test('només RSA PKCS#8 de 2048 bits o més', async () => {
    expect(clauPrivada?.algorithm?.name).toBe('RSASSA-PKCS1-v1_5');
    const petita = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 1024, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign']);
    expect(await importaClauPrivada(pem('PRIVATE KEY', await subtle.exportKey('pkcs8', petita.privateKey)), { subtle })).toBe(null);
    for (const dolenta of [PEM_PUBLICA, PEM_PRIVADA.replace('PRIVATE KEY', 'RSA PRIVATE KEY'), '-----BEGIN PRIVATE KEY-----\n!!!\n-----END PRIVATE KEY-----', null, 'x'.repeat(20000)]) {
      expect(await importaClauPrivada(dolenta, { subtle })).toBe(null);
    }
  });
});

describe('lliura: una fila signada, i res quan no toca', () => {
  test('la signatura es verifica amb la biblioteca del receptor: keyId de l’actor, Digest dels bytes enviats, redirect manual', async () => {
    const f = fetchQue(() => new Response(null, { status: 202 }));
    expect(await lliura({ fila: fila(), claus, origen: ORIGEN, fetch: f, resolDns: publica, ara: () => ARA, subtle })).toEqual({ status: 202, retryAfterS: null });
    expect(f.crides).toHaveLength(1);
    const [{ url, init }] = f.crides;
    expect([url, init.method, init.redirect, init.body]).toEqual([INBOX, 'POST', 'manual', JSON.stringify(accept())]);
    expect(init.headers).toMatchObject({ 'content-type': 'application/activity+json', 'user-agent': AGENT_USUARI });
    // La capçalera Host la posa el fetch des de l'URL (Deno i undici no deixen fixar-la a mà).
    expect(Object.keys(init.headers)).not.toContain('host');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const desti = new URL(url);
    const verificacio = await verificaSignaturaHttpActivityPub({
      metode: 'POST', cami: `${desti.pathname}${desti.search}`, capcaleres: { ...init.headers, host: desti.host }, cos: init.body,
      obtenClauPublica: async (keyId) => ({ clau: { id: keyId, owner: ACTOR, publicKeyPem: PEM_PUBLICA } }), hostEsperat: 'mastodon.example', ara: ARA, subtle
    });
    expect(verificacio).toMatchObject({ valida: true, keyId: `${ACTOR}#main-key`, actor: ACTOR, algorisme: 'rsa-sha256' });
    // Un cos alterat d'un sol octet ja no verifica.
    const alterat = await verificaSignaturaHttpActivityPub({
      metode: 'POST', cami: desti.pathname, capcaleres: { ...init.headers, host: desti.host }, cos: init.body.replace('Accept', 'Acceptx'),
      obtenClauPublica: async (keyId) => ({ clau: { id: keyId, owner: ACTOR, publicKeyPem: PEM_PUBLICA } }), hostEsperat: 'mastodon.example', ara: ARA, subtle
    });
    expect(alterat).toEqual({ valida: false, motiu: 'digest_mismatch' });
  });

  test('cap enviament: adreça privada, sense resoledor, sense clau o fila invàlida', async () => {
    const f = fetchQue(() => new Response(null, { status: 202 }));
    const amb = (extra) => lliura({ fila: fila(), claus, origen: ORIGEN, fetch: f, resolDns: publica, ara: () => ARA, subtle, ...extra });
    expect(await amb({ resolDns: privada })).toEqual({ error: 'adreca_vetada' });
    expect(await amb({ resolDns: null })).toEqual({ error: 'sense_dns' });
    // ARB-M13-02 · DNS desconegut (una família sense resposta que no és NotFound, o cap adreça): fallada tancada.
    expect(await amb({ resolDns: async (h, t) => { if (t === 'AAAA') throw new Error('SERVFAIL'); return ['93.184.216.34']; } })).toEqual({ error: 'dns' });
    expect(await amb({ resolDns: async () => [] })).toEqual({ error: 'dns' });
    expect(await amb({ claus: new Map() })).toEqual({ error: 'sense_clau' });
    expect(await amb({ claus: new Map([[TORRE, { algorithm: null }]]) })).toEqual({ error: 'sense_clau' });
    for (const dolenta of [fila({ inbox: 'http://mastodon.example/inbox' }), fila({ inbox: 'https://10.0.0.1/inbox' }), fila({ inbox: 'https://nas.local/i' }),
      fila({ slug: '../x' }), fila({ cos: [1] }), fila({ cos: { type: 'Accept' } }), null]) {
      expect(await amb({ fila: dolenta })).toEqual({ error: 'fila_invalida' });
    }
    expect(f.crides).toHaveLength(0);
  });

  test('3xx (o una redirecció opaca) és redireccio; Retry-After en segons o en data; el cos de la resposta es cancel·la', async () => {
    const ambResposta = (resposta) => lliura({ fila: fila(), claus, origen: ORIGEN, fetch: async () => resposta, resolDns: publica, ara: () => ARA, subtle });
    expect(await ambResposta(new Response(null, { status: 302, headers: { location: 'https://10.0.0.1/' } }))).toEqual({ error: 'redireccio' });
    expect(await ambResposta({ type: 'opaqueredirect', status: 0, headers: new Headers() })).toEqual({ error: 'redireccio' });
    expect(await ambResposta(new Response(null, { status: 429, headers: { 'retry-after': '120' } }))).toEqual({ status: 429, retryAfterS: 120 });
    expect(await ambResposta(new Response(null, { status: 503, headers: { 'retry-after': new Date(ARA + 90_000).toUTCString() } }))).toEqual({ status: 503, retryAfterS: 90 });
    expect(await ambResposta(new Response(null, { status: 503, headers: { 'retry-after': 'demà' } }))).toEqual({ status: 503, retryAfterS: null });
    let cancelat = false;
    let llegits = 0;
    const cos = new ReadableStream({ pull(c) { llegits += 1; c.enqueue(new Uint8Array(1024)); }, cancel() { cancelat = true; } });
    expect(await ambResposta(new Response(cos, { status: 202 }))).toEqual({ status: 202, retryAfterS: null });
    await new Promise((r) => setTimeout(r, 0));
    expect(cancelat).toBe(true);
    expect(llegits).toBeLessThanOrEqual(1);
  });

  test('topall: un servidor que no respon, o un DNS que penja, és «temps»; una fallada de xarxa, «xarxa»', async () => {
    const penja = () => new Promise(() => {});
    const base = { fila: fila(), claus, origen: ORIGEN, resolDns: publica, ara: () => ARA, subtle, topallMs: 30 };
    expect(await lliura({ ...base, fetch: penja })).toEqual({ error: 'temps' });
    expect(await lliura({ ...base, fetch: async () => new Response(null, { status: 202 }), resolDns: penja })).toEqual({ error: 'temps' });
    expect(await lliura({ ...base, fetch: async () => { throw new TypeError('fetch failed'); } })).toEqual({ error: 'xarxa' });
  });
});

describe('drenaCua amb la cua en memòria (la semàntica de ap_cua_*)', () => {
  const prepara = async ({ files = 1, maximIntents } = {}) => {
    const r = rellotge();
    const cua = creaCuaEnMemoria({ ara: r.ara, ...(maximIntents ? { maximIntents } : {}) });
    for (let n = 1; n <= files; n += 1) expect(await cua.encua({ slug: TORRE, inbox: INBOX, activitat: accept(n) })).toBe(true);
    return { ...r, cua };
  };
  const drena = (cua, ara, fetch, extra = {}) => drenaCua({ cua, claus, origen: ORIGEN, fetch, resolDns: publica, ara, subtle, aleatori: () => 0.5, ...extra });

  test('2xx: fet; una fila ja feta no es torna a resoldre', async () => {
    const { cua, ara } = await prepara();
    const f = fetchQue(() => new Response(null, { status: 202 }));
    expect(await drena(cua, ara, f)).toEqual({ fets: 1, reintents: 0, fallits: 0, sense_provar: 0, lots: 1, esgotat: false });
    expect(cua.instantania()).toMatchObject([{ estat: 'fet', intents: 1, error: null, resolt: ARA }]);
    expect(await cua.resol({ id: 1, resultat: 'fet' })).toBe(null);
    expect(await drena(cua, ara, f)).toMatchObject({ fets: 0, lots: 0 });
    await expect(cua.resol({ id: 1, resultat: 'altre' })).rejects.toThrow(TypeError);
  });

  test('503: reintent amb l’espera exacta (jitter 0,5), i al desé intent, fallit', async () => {
    const { cua, ara, avanca } = await prepara();
    const f = fetchQue(() => new Response(null, { status: 503 }));
    const esperes = [];
    for (let n = 1; n <= CUA.MAXIM_INTENTS; n += 1) {
      const r = await drena(cua, ara, f);
      const [estat] = cua.instantania();
      if (n < CUA.MAXIM_INTENTS) {
        expect([n, r.reintents, estat.estat, estat.error]).toEqual([n, 1, 'pendent', 'http_503']);
        esperes.push((estat.proper - ara()) / 1000);
        // Abans de l'espera, la fila no torna.
        avanca(estat.proper - ara() - 1);
        expect((await drena(cua, ara, f)).lots).toBe(0);
        avanca(1);
      } else {
        expect([n, r.fallits, estat.estat, estat.intents]).toEqual([n, 1, 'fallit', CUA.MAXIM_INTENTS]);
      }
    }
    expect(esperes).toEqual([45, 90, 180, 360, 720, 1440, 2880, 5760, 11520]);
    expect(f.crides).toHaveLength(CUA.MAXIM_INTENTS);
  });

  test('429 amb Retry-After: l’espera n’és com a mínim el Retry-After; un 410 és fallit al primer intent', async () => {
    const { cua, ara } = await prepara({ files: 2 });
    const f = fetchQue((url, init, n) => (n === 1 ? new Response(null, { status: 429, headers: { 'retry-after': '3600' } }) : new Response(null, { status: 410 })));
    expect(await drena(cua, ara, f)).toMatchObject({ reintents: 1, fallits: 1 });
    const [primera, segona] = cua.instantania();
    expect([primera.estat, (primera.proper - ara()) / 1000, segona.estat, segona.error]).toEqual(['pendent', 3600, 'fallit', 'http_410']);
  });

  test('ARB-M13-06 · el Retry-After només val per a 429 i 503: un 500 amb Retry-After d’una hora espera el de la fórmula', async () => {
    const { cua, ara } = await prepara();
    const f = fetchQue(() => new Response(null, { status: 500, headers: { 'retry-after': '3600' } }));
    expect(await drena(cua, ara, f)).toMatchObject({ reintents: 1 });
    const [fila500] = cua.instantania();
    expect([fila500.estat, fila500.error, (fila500.proper - ara()) / 1000]).toEqual(['pendent', 'http_500', 45]);
  });

  test('encuar és idempotent per (activitat, inbox); un Accept resolt es torna a enviar com a molt una vegada per hora', async () => {
    const { cua, ara, avanca } = await prepara();
    expect(await cua.encua({ slug: TORRE, inbox: INBOX, activitat: accept(1) })).toBe(false);
    expect(await cua.encua({ slug: TORRE, inbox: 'https://altra.example/inbox', activitat: accept(1) })).toBe(true);
    const f = fetchQue(() => new Response(null, { status: 202 }));
    expect(await drena(cua, ara, f)).toMatchObject({ fets: 2 });
    avanca(HORA - 1);
    expect(await cua.encua({ slug: TORRE, inbox: INBOX, activitat: accept(1) })).toBe(false);
    avanca(2);
    expect(await cua.encua({ slug: TORRE, inbox: INBOX, activitat: accept(1) })).toBe(true);
    expect(await cua.encua({ slug: TORRE, inbox: INBOX, activitat: accept(1) })).toBe(false);
    expect(await drena(cua, ara, f)).toMatchObject({ fets: 1 });
    expect(f.crides).toHaveLength(3);
    expect(cua.instantania().filter((x) => x.inbox === INBOX)).toHaveLength(1);
    // Formes que la migració rebutja, rebutjades també ací.
    for (const dolent of [{ slug: TORRE, inbox: 'http://x.example/i', activitat: accept(9) }, { slug: 'A B', inbox: INBOX, activitat: accept(9) },
      { slug: TORRE, inbox: INBOX, activitat: { id: 'no-url' } }, { slug: TORRE, inbox: INBOX, activitat: [] }]) {
      await expect(cua.encua(dolent)).rejects.toThrow(TypeError);
    }
    await expect(cua.encua({ slug: TORRE, inbox: INBOX, activitat: { ...accept(9), farcit: 'x'.repeat(CUA.MAXIM_COS) } })).rejects.toThrow(RangeError);
  });

  test('el pressupost es respecta: el que no cap queda sense provar i torna amb la reserva', async () => {
    const { cua, ara, avanca } = await prepara({ files: 6 });
    // Cada enviament gasta 15 s de paret; pressupost 45 s i topall 10 s: n'hi caben tres.
    const f = fetchQue(() => { avanca(15_000); return new Response(null, { status: 202 }); });
    expect(await drena(cua, ara, f, { pressupostMs: 45_000, topallMs: 10_000 })).toEqual({ fets: 3, reintents: 0, fallits: 0, sense_provar: 3, lots: 1, esgotat: true });
    expect(await drena(cua, ara, f, { pressupostMs: 45_000, topallMs: 10_000 })).toMatchObject({ lots: 0 });
    avanca(CUA.RESERVA_MS);
    expect(await drena(cua, ara, f, { pressupostMs: 45_000, topallMs: 10_000 })).toMatchObject({ fets: 3, sense_provar: 0 });
    expect(cua.instantania().map((x) => x.estat)).toEqual(Array(6).fill('fet'));
  });

  test('lots i sostre de lots; una base caiguda fa llançar el buidatge', async () => {
    const { cua, ara } = await prepara({ files: 5 });
    const f = fetchQue(() => new Response(null, { status: 202 }));
    expect(await drena(cua, ara, f, { lot: 2, maxLots: 2 })).toMatchObject({ fets: 4, lots: 2 });
    expect(await drena(cua, ara, f, { lot: 2 })).toMatchObject({ fets: 1, lots: 1 });
    const caiguda = { reclama: async () => { throw new Error('magatzem_no_disponible'); } };
    await expect(drena(caiguda, ara, f)).rejects.toThrow('magatzem_no_disponible');
  });

  test('paritat amb la migració: mai un cos distint amb el mateix id; 50 reclamacions sense resolució, fallida', async () => {
    const { cua, avanca } = await prepara();
    const [f] = await cua.reclama(5);
    expect(await cua.resol({ id: f.id, resultat: 'fet' })).toBe('fet');
    avanca(HORA + 1);
    expect(await cua.encua({ slug: TORRE, inbox: INBOX, activitat: { ...accept(1), type: 'Reject' } })).toBe(false);
    expect(await cua.encua({ slug: TORRE, inbox: INBOX, activitat: accept(1) })).toBe(true);
    // Un worker que cau sempre amb la fila: cada reclamació suma un intent i la reserva la torna.
    for (let n = 0; n < CUA.MAXIM_RECLAMACIONS; n += 1) { expect((await cua.reclama(5)).length).toBe(1); avanca(CUA.RESERVA_MS); }
    expect(await cua.reclama(5)).toEqual([]);
    expect(cua.instantania()).toMatchObject([{ estat: 'fallit', intents: CUA.MAXIM_RECLAMACIONS, error: 'reclamacions_esgotades' }]);
  });

  test('la purga de la cua: fet de fa més de 7 dies, fallit de fa més de 30', async () => {
    const { cua, ara, avanca } = await prepara({ files: 2, maximIntents: 1 });
    const f = fetchQue((url, init, n) => new Response(null, { status: n === 1 ? 202 : 503 }));
    expect(await drena(cua, ara, f)).toMatchObject({ fets: 1, fallits: 1 });
    avanca(7 * 24 * HORA + 1);
    expect(await cua.purga()).toBe(1);
    avanca(23 * 24 * HORA);
    expect(await cua.purga()).toBe(1);
    expect(cua.instantania()).toEqual([]);
  });
});
