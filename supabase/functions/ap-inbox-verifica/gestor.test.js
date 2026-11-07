// @vitest-environment node
/* B5 (marató 261101_2143; spec B5-FEDERACIO §2.4 i §4.1) · El gestor de ap-inbox-verifica: apagat
   per defecte, configuració sense secrets a la resposta, la frontera HTTP (405, 404, 415, 413 abans
   de llegir i cos il·limitat tallat), la substitució del host i del camí públics a la cadena
   signada, quota (429) i base caiguda (503), la passada de la cua amb el secret del cron,
   l'obtenidor de claus i documents (redirecció, sostre, DNS, memòria cau, rotació) i la frontera
   d'imports del mòdul. Cap xarxa: el fetch i el resoledor són dobles; les claus es generen ací. */
import { describe, expect, test, vi } from 'vitest';
import { createHash, createSign, generateKeyPairSync, webcrypto } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AP, configDe, creaGestor, creaObtenidor, llegixCosFitat } from './gestor.js';
import { creaCuaEnMemoria } from './cuaLliurament.js';
import { MAXIM_COS_INBOX, creaMagatzemInboxEnMemoria, verificaSignaturaHttpActivityPub } from '../../../src/data/federacio/inboxActivityPub.js';

const subtle = webcrypto.subtle;
const DIR = path.dirname(fileURLToPath(import.meta.url));
const ARA = Date.UTC(2026, 10, 2, 1, 0, 0);
const TORRE = 'la-torre-de-les-macanes';
const ORIGEN = 'https://socdepoble.org';
const LOCAL = `${ORIGEN}/ap/actors/${TORRE}.json`;
const FUNCIO = 'https://abcdefghijklmnop.supabase.co';
const URL_INBOX = `${FUNCIO}/ap-inbox-verifica/ap/inbox/${TORRE}`;
const REMOT = 'https://mastodon.example/users/anna';
const KEY = `${REMOT}#main-key`;
const SECRET = 'c'.repeat(40);
const CLAU_SERVEI = 'eyJhbGciOiJIUzI1NiJ9.servei-de-prova.signatura';
const enc = new TextEncoder();

const remota = generateKeyPairSync('rsa', { modulusLength: 2048 });
const remotaNova = generateKeyPairSync('rsa', { modulusLength: 2048 });
const local = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM_LOCAL = local.privateKey.export({ type: 'pkcs8', format: 'pem' });
const PEM_LOCAL_PUBLICA = local.publicKey.export({ type: 'spki', format: 'pem' });
const docActor = (parell = remota) => ({
  '@context': 'https://www.w3.org/ns/activitystreams', id: REMOT, type: 'Person', inbox: `${REMOT}/inbox`,
  publicKey: { id: KEY, owner: REMOT, publicKeyPem: parell.publicKey.export({ type: 'spki', format: 'pem' }) }
});
const ENV = Object.freeze({
  SDP_AP_ACTIVA: '1', SDP_AP_CLAUS_PRIVADES: JSON.stringify({ [TORRE]: PEM_LOCAL }), SDP_CRON_SECRET: SECRET,
  SUPABASE_URL: FUNCIO, SUPABASE_SERVICE_ROLE_KEY: CLAU_SERVEI
});
const publica = async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : []);
const follow = (n = 1) => ({ '@context': 'https://www.w3.org/ns/activitystreams', id: `${REMOT}#follows/${n}`, type: 'Follow', actor: REMOT, object: LOCAL });

/* Una petició (la forma que usa el gestor: method, url, headers, body) signada com un servidor remot. */
function signada(activitat, { url = URL_INBOX, camiSignat = `/ap/inbox/${TORRE}`, hostSignat = 'socdepoble.org', host = null, parell = remota, data = ARA, extra = {} } = {}) {
  const cos = typeof activitat === 'string' ? activitat : JSON.stringify(activitat);
  const capcaleres = { date: new Date(data).toUTCString(), digest: `SHA-256=${createHash('sha256').update(cos).digest('base64')}`, 'content-type': 'application/activity+json' };
  const cadena = `(request-target): post ${camiSignat}\nhost: ${hostSignat}\ndate: ${capcaleres.date}\ndigest: ${capcaleres.digest}`;
  capcaleres.signature = `keyId="${KEY}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${createSign('RSA-SHA256').update(cadena).sign(parell.privateKey, 'base64')}"`;
  return peticio(url, { headers: { ...capcaleres, host: host ?? new URL(url).host, ...extra }, cos });
}
function peticio(url, { method = 'POST', headers = {}, cos = null, body = undefined } = {}) {
  const flux = cos === null ? null : new ReadableStream({ start(c) { c.enqueue(typeof cos === 'string' ? enc.encode(cos) : cos); c.close(); } });
  return { method, url, headers: new Headers(headers), body: body === undefined ? flux : body };
}
/* La xarxa remota: documents per GET i inboxes que reben POST. */
function xarxa({ document = () => docActor(), estatInbox = 202 } = {}) {
  const crides = [];
  const fetch = async (url, init = {}) => {
    crides.push({ url, init });
    if ((init.method ?? 'GET') === 'GET' && url === REMOT) return new Response(JSON.stringify(document()), { status: 200, headers: { 'content-type': 'application/activity+json; charset=utf-8' } });
    if (init.method === 'POST' && url === `${REMOT}/inbox`) return new Response(null, { status: estatInbox });
    return new Response('no', { status: 404 });
  };
  return { fetch, crides, gets: () => crides.filter((c) => (c.init.method ?? 'GET') === 'GET'), posts: () => crides.filter((c) => c.init.method === 'POST') };
}
function registre() {
  const linies = [];
  return { linies, error: (...a) => linies.push(a.join(' ')), info: (...a) => linies.push(a.join(' ')) };
}
function munta({ env = ENV, fetch = xarxa().fetch, magatzem = creaMagatzemInboxEnMemoria(), cua = null, resolDns = publica, espera = null, ara = () => ARA } = {}) {
  const r = registre();
  const c = cua ?? creaCuaEnMemoria({ ara });
  return { gestor: creaGestor({ env, fetch, resolDns, ara, subtle, magatzem, cua: c, espera, registre: r, aleatori: () => 0.5 }), magatzem, cua: c, registre: r };
}
const cosDe = async (resposta) => JSON.parse(await resposta.text());

describe('configDe', () => {
  test('per defecte: origen i inbox pública de socdepoble.org, sense prefix; claus només dels actors possibles', () => {
    const c = configDe({ ...ENV, SDP_AP_CLAUS_PRIVADES: JSON.stringify({ [TORRE]: PEM_LOCAL, socdepoble: PEM_LOCAL, penaguila: PEM_LOCAL, sella: 7 }) });
    expect(c).toMatchObject({ activa: true, origen: ORIGEN, inboxPublica: { host: 'socdepoble.org', prefix: '' }, prefixIntern: '/ap-inbox-verifica', nodesDeConfianca: [], secretCron: SECRET });
    expect([...c.actors.keys()].sort()).toEqual(['la-torre-de-les-macanes', 'socdepoble']);
    expect(c.actors.get(TORRE).keyId).toBe(`${LOCAL}#main-key`);
    expect(c.supabase).toEqual({ base: FUNCIO, clau: CLAU_SERVEI });
  });

  test('inbox pública amb prefix, nodes de confiança https, secret curt i SDP_AP_ACTIVA que no és «1»', () => {
    const c = configDe({ ...ENV, SDP_AP_ACTIVA: 'true', SDP_AP_INBOX_PUBLICA: `${FUNCIO}/functions/v1/ap-inbox-verifica/`, SDP_AP_NODES_CONFIANCA: ' https://xixona.example , http://dolent.example, no-url, https://a.example/cami ', SDP_CRON_SECRET: 'curt' });
    expect(c).toMatchObject({ activa: false, inboxPublica: { host: 'abcdefghijklmnop.supabase.co', prefix: '/functions/v1/ap-inbox-verifica' }, nodesDeConfianca: ['https://xixona.example'], secretCron: null });
  });

  test('error de configuració amb els NOMS de les variables, mai els valors', () => {
    expect(configDe({})).toEqual({ error: 'config', falten: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] });
    const dolenta = configDe({ ...ENV, SDP_AP_CLAUS_PRIVADES: '{no és json', SDP_AP_ORIGEN: 'http://socdepoble.org', SDP_AP_INBOX_PUBLICA: 'https://x.example/a?b=1', SUPABASE_URL: 'ftp://x' });
    expect(dolenta).toEqual({ error: 'config', falten: ['SDP_AP_ORIGEN', 'SDP_AP_INBOX_PUBLICA', 'SDP_AP_CLAUS_PRIVADES', 'SUPABASE_URL'] });
    expect(configDe({ ...ENV, SDP_AP_CLAUS_PRIVADES: '["llista"]' })).toMatchObject({ error: 'config', falten: ['SDP_AP_CLAUS_PRIVADES'] });
    expect(configDe({ ...ENV, SDP_AP_CLAUS_PRIVADES: JSON.stringify({ x: 'y'.repeat(AP.MAXIM_CLAUS_JSON) }) })).toMatchObject({ falten: ['SDP_AP_CLAUS_PRIVADES'] });
    // Sense claus no és un error: simplement no hi ha cap actor local.
    expect(configDe({ ...ENV, SDP_AP_CLAUS_PRIVADES: '' }).actors.size).toBe(0);
  });
});

describe('apagada per defecte i configuració', () => {
  test('sense SDP_AP_ACTIVA=1: la inbox respon 503 federacio_apagada i la cua tampoc no fa res', async () => {
    for (const valor of [undefined, '', '0', 'true', 'si', ' 1x']) {
      const x = xarxa();
      const { gestor, magatzem } = munta({ env: { ...ENV, SDP_AP_ACTIVA: valor }, fetch: x.fetch });
      const r = await gestor(signada(follow()));
      expect([valor, r.status, await cosDe(r)]).toEqual([valor, 503, { error: 'federacio_apagada' }]);
      const g = await gestor(peticio(URL_INBOX, { method: 'GET' }));
      expect(g.status).toBe(503);
      const cua = await gestor(peticio(`${FUNCIO}/ap-inbox-verifica/cua`, { headers: { [AP.CAPCALERA_CRON]: SECRET } }));
      expect([cua.status, await cosDe(cua)]).toEqual([503, { ok: false, error: 'federacio_apagada' }]);
      expect(x.crides).toEqual([]);
      expect(magatzem.instantania().activitats).toEqual([]);
    }
  });

  test('encesa amb la configuració incompleta: 503 config, sense dir quins secrets falten; el registre diu els noms, no els valors', async () => {
    const { gestor, registre: r } = munta({ env: { SDP_AP_ACTIVA: '1', SDP_AP_CLAUS_PRIVADES: JSON.stringify({ [TORRE]: PEM_LOCAL }) } });
    const resposta = await gestor(signada(follow()));
    const text = await resposta.text();
    expect([resposta.status, JSON.parse(text)]).toEqual([503, { error: 'config' }]);
    expect(text).not.toMatch(/SUPABASE|SERVICE|SECRET|PRIVADES/);
    expect(r.linies.join('\n')).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(r.linies.join('\n')).not.toContain('PRIVATE KEY');
    // La cua sense secret de cron: també config.
    const { gestor: senseSecret } = munta({ env: { ...ENV, SDP_CRON_SECRET: 'curt' } });
    expect((await senseSecret(peticio(`${FUNCIO}/ap-inbox-verifica/cua`, { headers: { [AP.CAPCALERA_CRON]: 'curt' } }))).status).toBe(503);
  });
});

describe('la frontera HTTP de la inbox', () => {
  test('R11-AP-01 · un cos interromput retorna 400 sense propagar errors ni detalls del flux', async () => {
    const { gestor, magatzem } = munta();
    const body = new ReadableStream({ start(control) { control.error(new Error('detall privat del transport')); } });
    const r = await gestor(peticio(URL_INBOX, { headers: { 'content-type': 'application/activity+json' }, body }));
    expect([r.status, await cosDe(r)]).toEqual([400, { error: 'invalid_body' }]);
    expect(magatzem.instantania().activitats).toEqual([]);
  });

  test('R11-AP-01 · el termini de lectura talla i cancel·la un cos que no acaba', async () => {
    const { gestor, magatzem } = munta();
    let cancelat = false;
    const body = new ReadableStream({ cancel() { cancelat = true; } });
    // Importació WebCrypto real abans de substituir els rellotges.
    await gestor(peticio(URL_INBOX, { headers: { 'content-type': 'application/activity+json' }, cos: '{' }));
    vi.useFakeTimers();
    try {
      const pendent = gestor(peticio(URL_INBOX, { headers: { 'content-type': 'application/activity+json' }, body }));
      await vi.advanceTimersByTimeAsync(AP.TOPALL_MS + 1);
      const r = await pendent;
      expect([r.status, await cosDe(r), cancelat]).toEqual([408, { error: 'request_timeout' }, true]);
      expect(magatzem.instantania().activitats).toEqual([]);
    } finally { vi.useRealTimers(); }
  });

  test('R11-AP-01 · rebutjar un cos massa gran no espera una cancel·lació bloquejada', async () => {
    const { gestor } = munta();
    let cancelat = false;
    const body = new ReadableStream({
      start(control) { control.enqueue(new Uint8Array(MAXIM_COS_INBOX + 1)); },
      cancel() { cancelat = true; return new Promise(() => {}); }
    });
    const r = await gestor(peticio(URL_INBOX, { headers: { 'content-type': 'application/activity+json' }, body }));
    expect([r.status, await cosDe(r), cancelat]).toEqual([413, { error: 'payload_too_large' }, true]);
  });

  test('405, 404 (ruta, inbox sense clau o actor no federat), 415 i 400', async () => {
    const { gestor } = munta();
    const get = await gestor(peticio(URL_INBOX, { method: 'GET' }));
    expect([get.status, get.headers.get('allow'), get.headers.get('cache-control')]).toEqual([405, 'POST', 'no-store']);
    expect((await gestor(peticio(`${FUNCIO}/ap-inbox-verifica/res`))).status).toBe(404);
    expect((await gestor(signada(follow(), { url: `${FUNCIO}/ap-inbox-verifica/ap/inbox/socdepoble`, camiSignat: '/ap/inbox/socdepoble' }))).status).toBe(404);
    expect((await gestor(signada(follow(), { url: `${FUNCIO}/ap-inbox-verifica/ap/inbox/sella`, camiSignat: '/ap/inbox/sella' }))).status).toBe(404);
    expect((await gestor(signada(follow(), { extra: { 'content-type': 'text/plain' } }))).status).toBe(415);
    expect((await gestor(peticio('no és una url'))).status).toBe(400);
    expect((await gestor(peticio(`${FUNCIO}/ap-inbox-verifica/cua`, { method: 'GET' }))).status).toBe(405);
  });

  test('413 per Content-Length abans de llegir; un cos il·limitat es talla en passar el sostre', async () => {
    const { gestor } = munta();
    let lectures = 0;
    let cancelat = false;
    const infinit = () => ({ getReader: () => ({ read: async () => { lectures += 1; return { done: false, value: new Uint8Array(64 * 1024) }; }, cancel: async () => { cancelat = true; }, releaseLock() {} }) });
    const declarat = await gestor(peticio(URL_INBOX, { headers: { 'content-type': 'application/activity+json', 'content-length': String(MAXIM_COS_INBOX + 1) }, body: infinit() }));
    expect([declarat.status, await cosDe(declarat), lectures]).toEqual([413, { error: 'payload_too_large' }, 0]);
    const sense = await gestor(peticio(URL_INBOX, { headers: { 'content-type': 'application/activity+json' }, body: infinit() }));
    expect([sense.status, lectures, cancelat]).toEqual([413, MAXIM_COS_INBOX / (64 * 1024) + 1, true]);
    expect(await llegixCosFitat({ body: null }, 10)).toEqual(new Uint8Array(0));
    // Una inbox sense actor local o un tipus que no és d'ActivityPub tampoc no lligen cap octet.
    lectures = 0;
    expect((await gestor(peticio(`${FUNCIO}/ap-inbox-verifica/ap/inbox/sella`, { headers: { 'content-type': 'application/activity+json' }, body: infinit() }))).status).toBe(404);
    expect((await gestor(peticio(URL_INBOX, { headers: { 'content-type': 'text/plain' }, body: infinit() }))).status).toBe(415);
    expect(lectures).toBe(0);
  });

  test('Follow signat: 202, seguidor desat, l’Accept a la cua i la passada curta en segon pla el lliura signat', async () => {
    const x = xarxa();
    const promeses = [];
    const { gestor, magatzem, cua } = munta({ fetch: x.fetch, espera: (p) => promeses.push(p) });
    const r = await gestor(signada(follow()));
    expect([r.status, await cosDe(r)]).toEqual([202, { estat: 'processada' }]);
    expect(magatzem.instantania().seguidors).toMatchObject([{ slug: TORRE, actor: REMOT, inbox: `${REMOT}/inbox` }]);
    expect(cua.instantania()).toMatchObject([{ slug: TORRE, inbox: `${REMOT}/inbox`, estat: 'pendent', cos: { type: 'Accept', actor: LOCAL, object: { id: follow().id } } }]);
    // La clau del remot: un GET al document de l'actor (sense el fragment), redirect manual i Accept d'ActivityPub.
    expect(x.gets()).toHaveLength(1);
    expect(x.gets()[0].init).toMatchObject({ redirect: 'manual', headers: { accept: expect.stringContaining('application/activity+json') } });
    expect(promeses).toHaveLength(1);
    await promeses[0];
    expect(cua.instantania()).toMatchObject([{ estat: 'fet', intents: 1 }]);
    const [{ url, init }] = x.posts();
    const verificacio = await verificaSignaturaHttpActivityPub({
      metode: 'POST', cami: new URL(url).pathname, capcaleres: { ...init.headers, host: new URL(url).host }, cos: init.body, hostEsperat: 'mastodon.example', ara: ARA, subtle,
      obtenClauPublica: async (keyId) => ({ clau: { id: keyId, owner: LOCAL, publicKeyPem: PEM_LOCAL_PUBLICA } })
    });
    expect(verificacio).toMatchObject({ valida: true, actor: LOCAL });
    // La repetició: duplicada, el mateix Accept, i cap fila nova (menys d'una hora després de resoldre's).
    const repetida = await gestor(signada(follow()));
    expect([repetida.status, await cosDe(repetida), cua.instantania().length]).toEqual([202, { estat: 'duplicada' }, 1]);
  });

  test('el host i el camí que es verifiquen són els públics: una petició signada per a un altre host o camí no verifica', async () => {
    const { gestor } = munta();
    // El Host que posa la passarel·la no compta: es verifica amb el públic (socdepoble.org).
    expect((await gestor(signada(follow(1), { host: 'abcdefghijklmnop.supabase.co' }))).status).toBe(202);
    const altreHost = await gestor(signada(follow(2), { hostSignat: 'altre.example', host: 'altre.example' }));
    expect([altreHost.status, await cosDe(altreHost)]).toEqual([401, { error: 'signature_invalid' }]);
    const altreCami = await gestor(signada(follow(3), { camiSignat: `/functions/v1/ap-inbox-verifica/ap/inbox/${TORRE}` }));
    expect([altreCami.status, await cosDe(altreCami)]).toEqual([401, { error: 'signature_invalid' }]);
    // Amb la inbox pública a la funció: el camí signat porta el prefix i el host és el de Supabase.
    const { gestor: directe } = munta({ env: { ...ENV, SDP_AP_INBOX_PUBLICA: `${FUNCIO}/functions/v1/ap-inbox-verifica` } });
    const bona = signada(follow(4), { camiSignat: `/functions/v1/ap-inbox-verifica/ap/inbox/${TORRE}`, hostSignat: 'abcdefghijklmnop.supabase.co' });
    expect((await directe(bona)).status).toBe(202);
    expect((await directe(signada(follow(5)))).status).toBe(401);
    // La URL llarga (/functions/v1/…) també s'entén com a camí intern.
    expect((await directe(signada(follow(6), { url: `${FUNCIO}/functions/v1/ap-inbox-verifica/ap/inbox/${TORRE}`, camiSignat: `/functions/v1/ap-inbox-verifica/ap/inbox/${TORRE}`, hostSignat: 'abcdefghijklmnop.supabase.co' }))).status).toBe(202);
  });

  test('quota → 429 amb Retry-After; base caiguda → 503 amb Retry-After; la cua caiguda en encuar, també 503', async () => {
    const base = creaMagatzemInboxEnMemoria();
    const ple = { ...base, reclamaActivitat: async () => { throw new RangeError('Quota de la inbox esgotada per a este origen.'); } };
    const r429 = await munta({ magatzem: ple }).gestor(signada(follow()));
    expect([r429.status, r429.headers.get('retry-after'), await cosDe(r429)]).toEqual([429, '600', { error: 'quota' }]);
    const caigut = { ...base, reclamaActivitat: async () => { throw new Error('magatzem_no_disponible'); } };
    const r503 = await munta({ magatzem: caigut }).gestor(signada(follow()));
    expect([r503.status, r503.headers.get('retry-after'), await cosDe(r503)]).toEqual([503, '60', { error: 'magatzem_no_disponible' }]);
    const cuaCaiguda = { ...creaCuaEnMemoria({ ara: () => ARA }), encua: async () => { throw new Error('magatzem_no_disponible'); } };
    const m = creaMagatzemInboxEnMemoria();
    const rCua = await munta({ magatzem: m, cua: cuaCaiguda }).gestor(signada(follow()));
    expect(rCua.status).toBe(503);
    // La rèplica del remot (que reintenta el 503) és duplicada i torna a encuar el MATEIX Accept.
    const cua = creaCuaEnMemoria({ ara: () => ARA });
    expect((await munta({ magatzem: m, cua }).gestor(signada(follow()))).status).toBe(202);
    expect(cua.instantania()).toHaveLength(1);
    // ARB-M13-04 · Reclamació en_curs respon 503 amb Retry-After perquè el remot reintente.
    const enCurs = { ...base, reclamaActivitat: async () => 'en_curs' };
    const rEnCurs = await munta({ magatzem: enCurs }).gestor(signada(follow()));
    expect([rEnCurs.status, rEnCurs.headers.get('retry-after'), await cosDe(rEnCurs)]).toEqual([503, '60', { estat: 'en_curs', motiu: 'activity_in_progress' }]);
  });
});

describe('la passada de la cua (POST /cua)', () => {
  test('sense el secret, o amb un altre, 401; amb el secret, lliura i torna només recomptes', async () => {
    const x = xarxa({ estatInbox: 503 });
    const t = { ara: ARA };
    const ara = () => t.ara;
    const cua = creaCuaEnMemoria({ ara });
    const { gestor, registre: r } = munta({ fetch: x.fetch, cua, ara });
    await gestor(signada(follow()));
    const URL_CUA = `${FUNCIO}/ap-inbox-verifica/cua`;
    expect((await gestor(peticio(URL_CUA))).status).toBe(401);
    expect((await gestor(peticio(URL_CUA, { headers: { [AP.CAPCALERA_CRON]: `${SECRET}x` } }))).status).toBe(401);
    const primera = await gestor(peticio(URL_CUA, { headers: { [AP.CAPCALERA_CRON]: SECRET } }));
    expect([primera.status, await cosDe(primera)]).toEqual([200, { ok: true, fets: 0, reintents: 1, fallits: 0, sense_provar: 0, lots: 1, esgotat: false, purga: { activitats: 0, alertes: 0, lapides: 0, cua: 0 } }]);
    expect(cua.instantania()[0]).toMatchObject({ estat: 'pendent', error: 'http_503', proper: ARA + 45_000 });
    t.ara += 45_000;
    const segona = await gestor(peticio(URL_CUA, { headers: { [AP.CAPCALERA_CRON]: SECRET } }));
    expect(await cosDe(segona)).toMatchObject({ reintents: 1 });
    expect(r.linies.join('\n')).not.toMatch(/mastodon|PRIVATE|eyJ|c{40}/);
  });

  test('una base caiguda durant la passada: 502 sense detall', async () => {
    const cua = { reclama: async () => { throw new Error('magatzem_no_disponible'); } };
    const { gestor } = munta({ cua });
    const r = await gestor(peticio(`${FUNCIO}/ap-inbox-verifica/cua`, { headers: { [AP.CAPCALERA_CRON]: SECRET } }));
    expect([r.status, await cosDe(r)]).toEqual([502, { ok: false, error: 'base' }]);
  });

  test('sense magatzem injectat, el gestor parla amb PostgREST amb la clau de servei', async () => {
    const crides = [];
    const fetch = async (url, init) => { crides.push({ url, init }); return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }); };
    const gestor = creaGestor({ env: ENV, fetch, resolDns: publica, ara: () => ARA, subtle, registre: registre() });
    const r = await gestor(peticio(`${FUNCIO}/ap-inbox-verifica/cua`, { headers: { [AP.CAPCALERA_CRON]: SECRET } }));
    expect(r.status).toBe(502);
    expect(crides.map((c) => c.url)).toEqual([`${FUNCIO}/rest/v1/rpc/ap_cua_reclama`, `${FUNCIO}/rest/v1/rpc/ap_purga`]);
    expect(crides[0].init.headers).toMatchObject({ apikey: CLAU_SERVEI, Authorization: `Bearer ${CLAU_SERVEI}` });
  });
});

describe('l’obtenidor de claus i documents', () => {
  const obtenidor = (fetch, extra = {}) => creaObtenidor({ fetch, resolDns: publica, ara: () => ARA, ...extra });
  const document = (doc = docActor(), capcaleres = {}) => async () => new Response(JSON.stringify(doc), { status: 200, headers: { 'content-type': 'application/activity+json', ...capcaleres } });

  test('una redirecció és fallada (redirect manual), i també un tipus que no és JSON', async () => {
    let init = null;
    await expect(obtenidor(async (url, i) => { init = i; return new Response(null, { status: 302, headers: { location: 'https://10.0.0.1/' } }); }).obtenDocument(REMOT)).rejects.toThrow('estat');
    expect(init.redirect).toBe('manual');
    await expect(obtenidor(async () => ({ type: 'opaqueredirect', status: 0, headers: new Headers() })).obtenDocument(REMOT)).rejects.toThrow('estat');
    await expect(obtenidor(document(docActor(), { 'content-type': 'text/html' })).obtenDocument(REMOT)).rejects.toThrow('tipus');
    await expect(obtenidor(async () => new Response('[1]', { headers: { 'content-type': 'application/json' } })).obtenDocument(REMOT)).rejects.toThrow('document');
    await expect(obtenidor(document()).obtenDocument('http://mastodon.example/users/anna')).rejects.toThrow('url_invalida');
  });

  test('el sostre d’1 MiB: per Content-Length sense llegir, i per flux tallant la lectura', async () => {
    let lectures = 0;
    const gran = () => new Response(new ReadableStream({ pull(c) { lectures += 1; c.enqueue(new Uint8Array(256 * 1024)); } }), { headers: { 'content-type': 'application/activity+json' } });
    await expect(obtenidor(async () => gran()).obtenDocument(REMOT)).rejects.toThrow('massa_gran');
    expect(lectures).toBeLessThanOrEqual(7);
    await expect(obtenidor(document(docActor(), { 'content-length': String(AP.MAXIM_DOCUMENT + 1) })).obtenDocument(REMOT)).rejects.toThrow('massa_gran');
  });

  test('DNS després del filtre lèxic: una adreça privada o cap resoledor, cap fetch', async () => {
    let crides = 0;
    const comptador = async () => { crides += 1; return document()(); };
    await expect(obtenidor(comptador, { resolDns: async (h, t) => (t === 'A' ? ['93.184.216.34'] : ['::1']) }).obtenDocument(REMOT)).rejects.toThrow('xarxa_privada');
    await expect(obtenidor(comptador, { resolDns: null }).obtenDocument(REMOT)).rejects.toThrow('xarxa_sense-dns');
    // ARB-M13-02 · Una família sense resposta (que no és NotFound) o cap adreça: desconeguda, tampoc cap fetch.
    await expect(obtenidor(comptador, { resolDns: async (h, t) => { if (t === 'AAAA') throw new Error('SERVFAIL'); return ['93.184.216.34']; } }).obtenDocument(REMOT)).rejects.toThrow('xarxa_desconeguda');
    await expect(obtenidor(comptador, { resolDns: async () => [] }).obtenDocument(REMOT)).rejects.toThrow('xarxa_desconeguda');
    expect(crides).toBe(0);
  });

  test('ARB-M13-01 · la memòria cau desa només {id, inbox} i la clau, expulsa la més antiga en passar del sostre i no guarda una clau que no s’importa', async () => {
    const actor = (n) => `https://node${n}.example/users/a`;
    const pem = remota.publicKey.export({ type: 'spki', format: 'pem' });
    const doc = (url) => ({ id: url, type: 'Person', inbox: `${url}/inbox`, summary: 'x'.repeat(200_000), publicKey: { id: `${url}#main-key`, owner: url, publicKeyPem: url.includes('node9') ? `${pem}${' '.repeat(9000)}` : pem } });
    const demanats = [];
    const o = creaObtenidor({
      fetch: async (url) => { demanats.push(url); return new Response(JSON.stringify(doc(url)), { status: 200, headers: { 'content-type': 'application/activity+json' } }); },
      resolDns: publica, ara: () => ARA, cauClaus: 2
    });
    const primera = await o.obtenClauPublica(`${actor(1)}#main-key`);
    // El document que torna (i el que es desa) és la projecció: cap altre camp del document remot.
    expect(primera.documentActor).toEqual({ id: actor(1), inbox: `${actor(1)}/inbox` });
    expect(Object.keys(primera.clau).sort()).toEqual(['id', 'owner', 'publicKeyPem']);
    await o.obtenClauPublica(`${actor(2)}#main-key`);
    await o.obtenClauPublica(`${actor(3)}#main-key`);
    expect(demanats).toHaveLength(3);
    // Plena amb dues: la tercera ha tret la primera (la més antiga); la segona i la tercera continuen.
    expect((await o.obtenClauPublica(`${actor(3)}#main-key`)).deCau).toBe(true);
    expect((await o.obtenClauPublica(`${actor(2)}#main-key`)).deCau).toBe(true);
    expect((await o.obtenClauPublica(`${actor(1)}#main-key`)).deCau).toBe(false);
    expect(demanats).toHaveLength(4);
    // Una clau més llarga del que s'importa es torna (la biblioteca dirà key_unsupported), però no es desa ni expulsa ningú.
    expect((await o.obtenClauPublica(`${actor(9)}#main-key`)).deCau).toBe(false);
    expect((await o.obtenClauPublica(`${actor(9)}#main-key`)).deCau).toBe(false);
    expect((await o.obtenClauPublica(`${actor(1)}#main-key`)).deCau).toBe(true);
    expect(demanats).toHaveLength(6);
  });

  test('memòria cau per keyId amb vida i sostre; sostre d’obtencions per minut', async () => {
    let crides = 0;
    const t = { ara: ARA };
    const o = creaObtenidor({ fetch: async () => { crides += 1; return document()(); }, resolDns: publica, ara: () => t.ara, cauClaus: 2, obtencionsPerMinut: 3 });
    expect(await o.obtenClauPublica(KEY)).toMatchObject({ clau: { id: KEY, owner: REMOT }, deCau: false });
    expect(await o.obtenClauPublica(KEY)).toMatchObject({ deCau: true });
    expect(crides).toBe(1);
    t.ara += AP.VIDA_CLAU_MS + 1;
    expect(await o.obtenClauPublica(KEY)).toMatchObject({ deCau: false });
    expect(crides).toBe(2);
    expect(await o.obtenClauPublica(`${REMOT}#una-altra`)).toBe(null);
    o.oblida(KEY);
    expect(await o.obtenClauPublica(KEY)).toMatchObject({ deCau: false });
    await expect(o.obtenDocument(REMOT)).rejects.toThrow('massa_obtencions');
    t.ara += 60_000;
    expect(await o.obtenDocument(REMOT)).toMatchObject({ id: REMOT });
  });

  test('rotació de clau: una signatura invàlida amb la clau de la memòria cau es torna a provar una vegada amb la fresca', async () => {
    let actual = remota;
    const x = xarxa({ document: () => docActor(actual) });
    const { gestor } = munta({ fetch: x.fetch });
    expect((await gestor(signada(follow(1)))).status).toBe(202);
    actual = remotaNova;
    expect((await gestor(signada(follow(2), { parell: remotaNova }))).status).toBe(202);
    expect(x.gets()).toHaveLength(2);
    // Una signatura que no és de cap de les dues: un sol reintent, i 401.
    const intrusa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const r = await gestor(signada(follow(3), { parell: intrusa }));
    expect([r.status, await cosDe(r)]).toEqual([401, { error: 'signature_invalid' }]);
    expect(x.gets()).toHaveLength(3);
    // ARB-M13-06 · Només signature_invalid torna a obtenir la clau: un altre 401 amb la clau de la memòria cau
    // (ací, una signatura RSA que es declara ed25519: key_unsupported) no fa cap GET nou.
    const declarada = signada(follow(4), { parell: remotaNova });
    declarada.headers.set('signature', declarada.headers.get('signature').replace('algorithm="rsa-sha256"', 'algorithm="ed25519"'));
    const r2 = await gestor(declarada);
    expect([r2.status, await cosDe(r2)]).toEqual([401, { error: 'key_unsupported' }]);
    expect(x.gets()).toHaveLength(3);
  });
});

describe('frontera del mòdul', () => {
  const fonts = readdirSync(DIR).filter((nom) => /\.(?:js|ts)$/.test(nom) && !/\.test\.js$/.test(nom));
  const importsDe = (font) => [...font.matchAll(/^import[^;]*?from\s+'([^']+)'/gms)].map((m) => m[1]);

  test('els imports són relatius: dins de supabase/functions o els dos mòduls purs de src/data', () => {
    const permesos = new Set(['../../../src/data/activitypub.js', '../../../src/data/federacio/inboxActivityPub.js', '../noticies/gestor.js', '../purga-fitxers/gestor.js',
      './cuaLliurament.js', './magatzemPostgrest.js', './gestor.js']);
    expect(fonts.sort()).toEqual(['conformitatMagatzem.js', 'cuaLliurament.js', 'gestor.js', 'index.ts', 'magatzemPostgrest.js']);
    for (const nom of fonts) {
      const font = readFileSync(path.join(DIR, nom), 'utf8');
      for (const desti of importsDe(font)) expect([nom, desti, permesos.has(desti)]).toEqual([nom, desti, true]);
      expect([nom, /from\s+'(?:npm:|jsr:|https?:)/.test(font)]).toEqual([nom, false]);
    }
    expect(importsDe(readFileSync(path.join(DIR, 'conformitatMagatzem.js'), 'utf8'))).toEqual([]);
    expect(importsDe(readFileSync(path.join(DIR, 'index.ts'), 'utf8'))).toEqual(['./gestor.js']);
  });

  test('cap Deno. ni Buffer fora d’index.ts, i cap secret escrit al codi', () => {
    for (const nom of fonts.filter((n) => n !== 'index.ts')) {
      // Sense els comentaris, que en parlen («mai Deno.* ni Buffer»).
      const font = readFileSync(path.join(DIR, nom), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect([nom, /\bDeno\./.test(font), /\bBuffer\b/.test(font), /arrayBuffer\(\)/.test(font)]).toEqual([nom, false, false, false]);
      expect([nom, /BEGIN (?:RSA )?PRIVATE KEY-----\n[A-Za-z0-9+/]/.test(font), /eyJ[A-Za-z0-9_-]{20,}/.test(font)]).toEqual([nom, false, false]);
    }
    expect(readFileSync(path.join(DIR, 'index.ts'), 'utf8')).toContain('Deno.serve(creaGestor(');
  });
});
