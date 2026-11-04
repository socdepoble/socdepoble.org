// @vitest-environment node
/* B5 (marató 261101_2143; spec B5-FEDERACIO §4.1) · Encaixada local entre DOS NODES de Sóc de Poble,
   cadascun amb el seu gestor de ap-inbox-verifica, el seu magatzem i la seua cua en memòria, les
   seues claus RSA (generades ací) i els documents d'actor de construeixActor amb la clau pública
   (el que publicaria la decisió D-2). Un fetch fa de xarxa entre els dos: els GET dels documents i
   els POST a les inboxes públiques, que la passarel·la de cada node passa a la seua funció.
     · La Torre: https://socdepoble.org, actor la-torre-de-les-macanes.
     · Un node germà: https://xixona.example, actor socdepoble del seu origen.
   NO és Mastodon: és el mateix perfil de signatura (draft-cavage-12, rsa-sha256) entre dos nodes
   nostres, dins del mateix procés. La interoperabilitat externa queda sense provar (cap desplegament,
   cap operació remota). */
import { describe, expect, test } from 'vitest';
import { generateKeyPairSync, verify, webcrypto } from 'node:crypto';
import { createServer, request as requestHttp } from 'node:http';
import { Readable } from 'node:stream';
import { AP, creaGestor } from './gestor.js';
import { creaCuaEnMemoria, importaClauPrivada } from './cuaLliurament.js';
import { construeixActor } from '../../../src/data/activitypub.js';
import { analitzaCapcaleraSignatura, creaMagatzemInboxEnMemoria, digestSha256, signaPeticioHttpActivityPub } from '../../../src/data/federacio/inboxActivityPub.js';

const subtle = webcrypto.subtle;
const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';
const HORA = 3_600_000;
const SECRET = 's'.repeat(40);
const enc = new TextEncoder();
const publica = async (host, tipus) => (tipus === 'A' ? ['93.184.216.34'] : []);
const silenci = { error: () => {}, info: () => {} };

function creaXarxa() {
  const nodes = new Map();
  const transit = [];
  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    const node = nodes.get(u.host);
    if (!node) throw new TypeError('fetch failed');
    if ((init.method ?? 'GET') === 'GET') {
      const document = node.documents.get(`${u.origin}${u.pathname}`);
      transit.push({ metode: 'GET', url, status: document ? 200 : 404 });
      return document ? new Response(JSON.stringify(document), { headers: { 'content-type': 'application/activity+json; charset=utf-8' } }) : new Response('no', { status: 404 });
    }
    // La passarel·la del node: el POST a la inbox pública arriba a la seua funció pel camí intern de Supabase.
    // La capçalera Host la posa la xarxa des de l'URL (el fetch de lliura no la fixa).
    const cos = typeof init.body === 'string' ? enc.encode(init.body) : init.body;
    const peticio = {
      method: 'POST', url: `https://${node.ref}.supabase.co/ap-inbox-verifica${u.pathname}${u.search}`,
      headers: new Headers({ ...init.headers, host: u.host }), body: new ReadableStream({ start(c) { c.enqueue(cos); c.close(); } })
    };
    const resposta = await node.gestor(peticio);
    transit.push({ metode: 'POST', url, status: resposta.status, cos: await resposta.clone().json() });
    return resposta;
  };
  return { nodes, transit, fetch };
}

async function creaNode(xarxa, rellotge, { origen, slug, nom, ref, confianca = '' }) {
  const parell = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const actor = construeixActor({ slug, nom, clauPublicaPem: parell.publicKey.export({ type: 'spki', format: 'pem' }) }, { origen });
  const privada = await importaClauPrivada(parell.privateKey.export({ type: 'pkcs8', format: 'pem' }), { subtle });
  const magatzem = creaMagatzemInboxEnMemoria();
  const cua = creaCuaEnMemoria({ ara: rellotge.ara });
  const env = {
    SDP_AP_ACTIVA: '1', SDP_AP_ORIGEN: origen, SDP_AP_CLAUS_PRIVADES: JSON.stringify({ [slug]: parell.privateKey.export({ type: 'pkcs8', format: 'pem' }) }),
    SDP_AP_NODES_CONFIANCA: confianca, SDP_CRON_SECRET: SECRET, SUPABASE_URL: `https://${ref}.supabase.co`, SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiJ9.prova.signatura'
  };
  const gestor = creaGestor({ env, fetch: xarxa.fetch, resolDns: publica, ara: rellotge.ara, subtle, magatzem, cua, registre: silenci, aleatori: () => 0.5 });
  xarxa.nodes.set(new URL(origen).host, { gestor, ref, documents: new Map([[actor.id, actor]]) });
  /* Signa i envia una activitat d'este node a una inbox; torna la resposta i una manera de reenviar la MATEIXA petició. */
  const envia = async (activitat, inbox) => {
    const cos = JSON.stringify(activitat);
    const capcaleres = await signaPeticioHttpActivityPub({ url: inbox, cos, keyId: `${actor.id}#main-key`, clauPrivada: privada, ara: rellotge.ara(), subtle });
    const fes = async () => {
      // Com lliura: la capçalera Host la posa la xarxa des de l'URL.
      const senseHost = Object.fromEntries(Object.entries(capcaleres).filter(([nom]) => nom !== 'host'));
      const r = await xarxa.fetch(inbox, { method: 'POST', headers: { ...senseHost, 'content-type': 'application/activity+json' }, body: cos });
      return { status: r.status, cos: await r.json() };
    };
    return { ...(await fes()), reenvia: fes };
  };
  const passaCua = async () => {
    const r = await gestor({ method: 'POST', url: `https://${ref}.supabase.co/ap-inbox-verifica/cua`, headers: new Headers({ [AP.CAPCALERA_CRON]: SECRET }), body: null });
    return { status: r.status, cos: await r.json() };
  };
  return { actor, magatzem, cua, envia, passaCua };
}

describe('encaixada entre dos nodes de Sóc de Poble (signatures reals, mateix procés)', () => {
  test('Follow → Accept signat i verificat; alerta de confiança desada i retirada amb làpida; rèpliques idempotents i vençudes', async () => {
    let t = Date.UTC(2026, 10, 2, 1, 0, 0);
    const rellotge = { ara: () => t };
    const xarxa = creaXarxa();
    const torre = await creaNode(xarxa, rellotge, { origen: 'https://socdepoble.org', slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes · Sóc de Poble', ref: 'torre0000000000a', confianca: 'https://xixona.example' });
    const germa = await creaNode(xarxa, rellotge, { origen: 'https://xixona.example', slug: 'socdepoble', nom: 'Xixona · Sóc de Poble', ref: 'xixona000000000b' });
    expect(torre.actor.inbox).toBe('https://socdepoble.org/ap/inbox/la-torre-de-les-macanes');

    // 1 · El node germà seguix La Torre: 202 i seguidor desat amb la inbox del document de l'actor.
    const follow = { '@context': 'https://www.w3.org/ns/activitystreams', id: `${germa.actor.id}#follows/1`, type: 'Follow', actor: germa.actor.id, object: torre.actor.id };
    const r1 = await germa.envia(follow, torre.actor.inbox);
    expect(r1).toMatchObject({ status: 202, cos: { estat: 'processada' } });
    expect(torre.magatzem.instantania().seguidors).toMatchObject([{ slug: 'la-torre-de-les-macanes', actor: germa.actor.id, inbox: germa.actor.inbox, followId: follow.id }]);
    expect(xarxa.transit).toContainEqual({ metode: 'GET', url: germa.actor.id, status: 200 });
    expect(torre.cua.instantania()).toMatchObject([{ estat: 'pendent', inbox: germa.actor.inbox, cos: { type: 'Accept', actor: torre.actor.id } }]);

    // 2 · La passada de la cua de La Torre signa l'Accept; el gestor del germà el VERIFICA (202, no 401) i
    //     l'ignora perquè encara no processa Accept.
    const passada = await torre.passaCua();
    expect(passada).toMatchObject({ status: 200, cos: { ok: true, fets: 1, reintents: 0, fallits: 0 } });
    const lliurament = xarxa.transit.find((p) => p.metode === 'POST' && p.url === germa.actor.inbox);
    expect(lliurament).toEqual({ metode: 'POST', url: germa.actor.inbox, status: 202, cos: { estat: 'ignorada', motiu: 'type_unsupported' } });
    expect(xarxa.transit).toContainEqual({ metode: 'GET', url: torre.actor.id, status: 200 });
    expect(torre.cua.instantania()).toMatchObject([{ estat: 'fet', intents: 1, error: null }]);
    // El mateix Follow repetit pel germà: duplicat, i cap Accept nou a la cua (menys d'una hora).
    expect(await r1.reenvia()).toMatchObject({ status: 202, cos: { estat: 'duplicada' } });
    expect(torre.cua.instantania()).toHaveLength(1);

    // 3 · Una alerta del germà (node de confiança): desada en text pla i amb la vigència del Mur.
    const nota = {
      id: 'https://xixona.example/ap/objectes/socdepoble/alerta-1.json', type: 'Note', attributedTo: germa.actor.id, to: [PUBLIC],
      published: new Date(t).toISOString(), content: '<p>Tall de la <b>CV-800</b> per pluges</p>', tag: [{ type: 'Hashtag', name: '#AlertaMunicipal' }]
    };
    const r3 = await germa.envia({ id: `${nota.id}#create`, type: 'Create', actor: germa.actor.id, to: [PUBLIC], object: nota }, torre.actor.inbox);
    expect(r3).toMatchObject({ status: 202, cos: { estat: 'processada' } });
    expect(await torre.magatzem.llistaAlertesVigents(t)).toMatchObject([{ id: nota.id, actor: germa.actor.id, via: null, text: 'Tall de la CV-800 per pluges', caduca: new Date(t + 72 * HORA).toISOString() }]);

    // 4 · El Delete del germà la retira amb làpida; la mateixa petició repetida és duplicada.
    const r4 = await germa.envia({ id: `${nota.id}#delete`, type: 'Delete', actor: germa.actor.id, to: [PUBLIC], object: { id: nota.id, type: 'Tombstone' } }, torre.actor.inbox);
    expect(r4).toMatchObject({ status: 202, cos: { estat: 'processada' } });
    expect(torre.magatzem.instantania()).toMatchObject({ alertes: [], lapides: [nota.id] });
    expect(await r4.reenvia()).toMatchObject({ status: 202, cos: { estat: 'duplicada' } });
    // Un Create posterior del mateix objecte no la ressuscita.
    const r5 = await germa.envia({ id: `${nota.id}#create-2`, type: 'Create', actor: germa.actor.id, to: [PUBLIC], object: nota }, torre.actor.inbox);
    expect(r5).toMatchObject({ status: 202, cos: { estat: 'ignorada', motiu: 'object_deleted' } });

    // 5 · La mateixa petició signada, 13 h després: la verificació ja la rebutja.
    t += 13 * HORA;
    expect(await r4.reenvia()).toEqual({ status: 401, cos: { error: 'date_out_of_window' } });
    expect(await r1.reenvia()).toEqual({ status: 401, cos: { error: 'date_out_of_window' } });
    expect(torre.magatzem.instantania().seguidors).toHaveLength(1);
  });

  test('un tercer que suplanta el germà amb la seua pròpia clau no passa; la inbox d’un actor sense clau és 404', async () => {
    const t = Date.UTC(2026, 10, 2, 1, 0, 0);
    const rellotge = { ara: () => t };
    const xarxa = creaXarxa();
    const torre = await creaNode(xarxa, rellotge, { origen: 'https://socdepoble.org', slug: 'la-torre-de-les-macanes', nom: 'La Torre', ref: 'torre0000000000a', confianca: 'https://xixona.example' });
    const germa = await creaNode(xarxa, rellotge, { origen: 'https://xixona.example', slug: 'socdepoble', nom: 'Xixona', ref: 'xixona000000000b' });
    const intrus = await creaNode(xarxa, rellotge, { origen: 'https://intrus.example', slug: 'socdepoble', nom: 'Intrús', ref: 'intrus00000000cc' });
    // L'intrús signa amb la seua clau una activitat que diu ser del germà: actor_mismatch.
    const falsa = { id: 'https://xixona.example/ap/objectes/socdepoble/x#create', type: 'Create', actor: germa.actor.id, to: [PUBLIC], object: { id: 'https://xixona.example/n/x', type: 'Note' } };
    expect(await intrus.envia(falsa, torre.actor.inbox)).toMatchObject({ status: 401, cos: { estat: 'rebutjada', motiu: 'actor_mismatch' } });
    // La inbox del projecte a La Torre no té clau en este node: 404, sense efecte.
    expect(await germa.envia({ id: `${germa.actor.id}#follows/2`, type: 'Follow', actor: germa.actor.id, object: 'https://socdepoble.org/ap/actors/socdepoble.json' }, 'https://socdepoble.org/ap/inbox/socdepoble'))
      .toMatchObject({ status: 404 });
    expect(torre.magatzem.instantania()).toMatchObject({ activitats: [], seguidors: [] });
  });
});

/* FEDI-06 · Transport HTTP real en dos sockets loopback. Els ids públics de
   fixture continuen sent https; només este transport injectat els resol a
   127.0.0.1. No s'afluixa urlRemota, DNS ni TLS en producte, i no s'afirma
   interoperabilitat remota o persistència de PostgreSQL amb esta prova. */
test('FEDI-06 · dos servidors HTTP: Ed25519 Follow → Accept i Create(Note), integritat, repetició i reinici del gestor', async () => {
  let t = Date.UTC(2026, 10, 3, 15, 0, 0);
  const nodes = new Map();
  const transit = [];
  const transport = async (url, init = {}) => {
    const u = new URL(url);
    const node = nodes.get(u.origin);
    if (!node) throw new TypeError('Origen fora de la xarxa HTTP de prova.');
    const headers = new Headers(init.headers);
    headers.set('host', u.host);
    /* node:http conserva el Host de la destinació pública sobre el socket
       loopback; fetch/undici el pot reconstruir amb 127.0.0.1:port. */
    return new Promise((resol, rebutja) => {
      const req = requestHttp(`${node.loopback}${u.pathname}${u.search}`, {
        method: init.method ?? 'GET', headers: Object.fromEntries(headers), signal: init.signal
      }, (r) => resol(new Response(Readable.toWeb(r), { status: r.statusCode, headers: r.headers })));
      req.once('error', rebutja);
      req.end(init.body);
    });
  };
  const servidors = [];
  const creaNodeHttp = async ({ origen, slug, confianca }) => {
    const parell = generateKeyPairSync('ed25519');
    const publicaPem = parell.publicKey.export({ type: 'spki', format: 'pem' });
    const privadaPem = parell.privateKey.export({ type: 'pkcs8', format: 'pem' });
    const actor = construeixActor({ slug, nom: slug, clauPublicaPem: publicaPem }, { origen });
    const privada = await importaClauPrivada(privadaPem, { subtle });
    expect(privada?.algorithm.name).toBe('Ed25519');
    const magatzem = creaMagatzemInboxEnMemoria();
    const cua = creaCuaEnMemoria({ ara: () => t });
    const env = {
      SDP_AP_ACTIVA: '1', SDP_AP_ORIGEN: origen, SDP_AP_CLAUS_PRIVADES: JSON.stringify({ [slug]: privadaPem }),
      SDP_AP_NODES_CONFIANCA: confianca, SDP_CRON_SECRET: SECRET,
      SUPABASE_URL: 'https://fedi-fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'prova-no-es-cap-secret'
    };
    let gestor;
    const reinicia = () => { gestor = creaGestor({ env, fetch: transport, resolDns: publica, ara: () => t, subtle, magatzem, cua, registre: silenci }); };
    reinicia();
    const servidor = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, origen);
        if (req.method === 'GET' && url.href === actor.id) {
          transit.push({ metode: 'GET', origen, cami: req.url, host: req.headers.host });
          res.writeHead(200, { 'content-type': 'application/activity+json' });
          res.end(JSON.stringify(actor));
          return;
        }
        const peticio = new Request(url, { method: req.method, headers: req.headers, body: Readable.toWeb(req), duplex: 'half' });
        const bytes = await peticio.clone().arrayBuffer();
        const r = await gestor(peticio);
        transit.push({ metode: req.method, origen, cami: req.url, host: req.headers.host, headers: req.headers, bytes: Buffer.from(bytes), status: r.status });
        res.writeHead(r.status, Object.fromEntries(r.headers));
        res.end(Buffer.from(await r.arrayBuffer()));
      } catch {
        res.writeHead(500); res.end('error de la infraestructura de prova');
      }
    });
    await new Promise((resol, rebutja) => {
      servidor.once('error', rebutja);
      servidor.listen(0, '127.0.0.1', resol);
    });
    servidors.push(servidor);
    const loopback = `http://127.0.0.1:${servidor.address().port}`;
    nodes.set(origen, { loopback });
    const envia = async (activitat, inbox) => {
      const cos = JSON.stringify(activitat);
      const headers = await signaPeticioHttpActivityPub({ url: inbox, cos, keyId: `${actor.id}#main-key`, clauPrivada: privada, ara: t, subtle });
      const fes = async ({ body = cos, capcaleres = headers, url = inbox } = {}) => {
        const r = await transport(url, { method: 'POST', headers: { ...capcaleres, 'content-type': 'application/activity+json' }, body });
        return { status: r.status, cos: await r.json() };
      };
      return { ...(await fes()), reenvia: fes, cosEnviat: cos, headers };
    };
    const passaCua = async () => {
      const r = await transport(`${origen}/ap-inbox-verifica/cua`, { method: 'POST', headers: { [AP.CAPCALERA_CRON]: SECRET } });
      return { status: r.status, cos: await r.json() };
    };
    return { actor, publicaPem, envia, passaCua, magatzem, cua, reinicia };
  };
  try {
    const torre = await creaNodeHttp({ origen: 'https://torre.example', slug: 'la-torre-de-les-macanes', confianca: 'https://xixona.example' });
    const germa = await creaNodeHttp({ origen: 'https://xixona.example', slug: 'socdepoble', confianca: 'https://torre.example' });
    const follow = { id: `${germa.actor.id}#follow-http-ed`, type: 'Follow', actor: germa.actor.id, object: torre.actor.id };
    const r1 = await germa.envia(follow, `${torre.actor.inbox}?lliurament=ed25519`);
    expect(r1).toMatchObject({ status: 202, cos: { estat: 'processada' } });
    expect(torre.magatzem.instantania().seguidors).toMatchObject([{ actor: germa.actor.id, followId: follow.id }]);
    expect(await torre.passaCua()).toMatchObject({ status: 200, cos: { fets: 1, fallits: 0, reintents: 0 } });
    const rebut = transit.find((r) => r.origen === 'https://xixona.example' && r.metode === 'POST' && r.cami === '/ap/inbox/socdepoble');
    expect(rebut?.status).toBe(202);
    expect(rebut.host).toBe('xixona.example');
    const accept = JSON.parse(rebut.bytes.toString());
    expect(accept).toMatchObject({ type: 'Accept', actor: torre.actor.id, to: [germa.actor.id], object: follow });
    const signatura = analitzaCapcaleraSignatura(rebut.headers.signature);
    expect(signatura).toMatchObject({ algorithm: 'hs2019', keyId: `${torre.actor.id}#main-key`, headers: ['(request-target)', 'host', 'date', 'digest'] });
    /* Segona API criptogràfica: verifica els bytes rebuts, sense el
       verificador ni el constructor de cadena de la biblioteca de producte. */
    const cadena = `(request-target): post ${rebut.cami}\nhost: ${rebut.host}\ndate: ${rebut.headers.date}\ndigest: ${rebut.headers.digest}`;
    expect(verify(null, Buffer.from(cadena), torre.publicaPem, Buffer.from(signatura.signature, 'base64'))).toBe(true);
    expect(rebut.headers.digest).toBe(await digestSha256(rebut.bytes, { subtle }));
    expect(transit.filter((r) => r.metode === 'GET').map((r) => r.origen)).toEqual(expect.arrayContaining(['https://torre.example', 'https://xixona.example']));
    expect(await r1.reenvia()).toMatchObject({ status: 202, cos: { estat: 'duplicada' } });
    expect(torre.cua.instantania()).toHaveLength(1);
    expect(await r1.reenvia({ url: `${torre.actor.inbox}?lliurament=alterat` })).toEqual({ status: 401, cos: { error: 'signature_invalid' } });

    const nota = { id: 'https://xixona.example/n/alerta-http', type: 'Note', attributedTo: germa.actor.id, to: [PUBLIC], published: new Date(t).toISOString(), content: '<p>Tall de la <b>CV-800</b> per pluges</p>', tag: [{ type: 'Hashtag', name: '#AlertaMunicipal' }] };
    const create = { id: `${nota.id}#create`, type: 'Create', actor: germa.actor.id, to: [PUBLIC], object: nota };
    const r2 = await germa.envia(create, torre.actor.inbox);
    expect(r2).toMatchObject({ status: 202, cos: { estat: 'processada' } });
    expect(await torre.magatzem.llistaAlertesVigents(t)).toMatchObject([{ id: nota.id, text: 'Tall de la CV-800 per pluges', actor: germa.actor.id }]);
    expect(await r2.reenvia({ body: r2.cosEnviat.replace('pluges', 'obres') })).toEqual({ status: 401, cos: { error: 'digest_mismatch' } });
    const alterat = r2.cosEnviat.replace('pluges', 'obres');
    expect(await r2.reenvia({ body: alterat, capcaleres: { ...r2.headers, digest: await digestSha256(alterat, { subtle }) } })).toEqual({ status: 401, cos: { error: 'signature_invalid' } });
    // Un gestor nou conserva idempotència i alertes en el magatzem injectat;
    // no equival a provar la durabilitat d'una base de dades de producció.
    torre.reinicia();
    expect(await r2.reenvia()).toMatchObject({ status: 202, cos: { estat: 'duplicada' } });
    expect(await torre.magatzem.llistaAlertesVigents(t)).toHaveLength(1);
    t += 2 * HORA;
    expect(await r2.reenvia()).toEqual({ status: 401, cos: { error: 'date_out_of_window' } });
    expect(await torre.magatzem.llistaAlertesVigents(t)).toHaveLength(1);
  } finally {
    await Promise.all(servidors.map((s) => new Promise((resol) => { s.closeAllConnections(); s.close(resol); })));
  }
});
