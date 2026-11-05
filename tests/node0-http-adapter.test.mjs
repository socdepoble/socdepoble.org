import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPACITATS, CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { BACKEND_ID_NODE_ZERO, CONVIDAT_NODE_ZERO, URL_NODE_ZERO, creaAdaptadorNodeZeroHttp, normalitzaEndpointNodeZero } from '../src/data/local/adaptadorNodeZeroHttp.js';

const json = (value, init = {}) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' }, ...init });
const buit = { towns: [], pages: [], agents: [] };
const barrera = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('endpoint: HTTPS i loopback de proves, sense credencials ni rutes arbitràries', () => {
  assert.equal(normalitzaEndpointNodeZero(), URL_NODE_ZERO);
  assert.equal(normalitzaEndpointNodeZero(`${URL_NODE_ZERO}/`), URL_NODE_ZERO);
  assert.equal(normalitzaEndpointNodeZero('http://127.0.0.1:4340/api/v1/node0'), 'http://127.0.0.1:4340/api/v1/node0');
  assert.equal(normalitzaEndpointNodeZero('http://[::1]:4340/api/v1/node0'), 'http://[::1]:4340/api/v1/node0');
  for (const invalid of ['//socdepoble.cat/api/v1/node0', '/api/v1/node0', 'http://socdepoble.cat/api/v1/node0', 'https://user:pass@socdepoble.cat/api/v1/node0', `${URL_NODE_ZERO}?token=x`, `${URL_NODE_ZERO}#x`, `${URL_NODE_ZERO}/../private`, `${URL_NODE_ZERO}/x`, ` ${URL_NODE_ZERO}`, 'https://socdepoble.cat/\\api/v1/node0', 'https://socdepoble.cat/%61pi/v1/node0']) {
    assert.throws(() => normalitzaEndpointNodeZero(invalid), TypeError, invalid);
  }
});

test('factoria rebutja tokens/fallbacks, getters i configuracions invàlides sense executar codi', () => {
  let llegides = 0;
  const getter = Object.defineProperty({}, 'endpoint', { get() { llegides++; return URL_NODE_ZERO; } });
  assert.throws(() => creaAdaptadorNodeZeroHttp(getter), TypeError);
  assert.throws(() => creaAdaptadorNodeZeroHttp(Object.create(getter)), TypeError);
  assert.equal(llegides, 0);
  for (const options of [{ token: 'SECRET' }, { fallback: {} }, { tenantId: 'poble' }, { fetchImpl: null }, { timeoutMs: 0 }, { timeoutMs: Infinity }, { timeoutMs: 60001 }, { timeoutMs: 1.2 }, [], null]) assert.throws(() => creaAdaptadorNodeZeroHttp(options), TypeError);
});

test('configuració fixa i mètodes nucli presents; només capacitat salut', async () => {
  const a = creaAdaptadorNodeZeroHttp({ tenantId: 'A0000000-0000-4000-8000-000000000001', fetchImpl: async () => json(buit) });
  assert.ok(Object.isFrozen(a)); assert.ok(Object.isFrozen(a.configuracio));
  assert.equal(a.configuracio.backendId, BACKEND_ID_NODE_ZERO);
  assert.equal(a.configuracio.tenantId, 'a0000000-0000-4000-8000-000000000001');
  assert.equal(a.getRuntimeDataMode({ dataMode: 'seed' }), 'remote');
  assert.equal(a.getBackendConfigurat(), true); assert.equal(a.getCurrentUser(), null);
  assert.equal(a.getDefaultUserId(), CONVIDAT_NODE_ZERO);
  for (const name of CONTRACTE_NUCLI) assert.equal(typeof a[name], 'function', name);
  assert.deepEqual(Object.entries(CAPACITATS).filter(([, methods]) => methods.every(name => typeof a[name] === 'function')).map(([cap]) => cap), ['salut']);
  assert.deepEqual(a.operacions, { lecturaPublica: true, escriptura: false, autenticacio: false, xat: false });
  assert.equal(await a.getProfile('altra-persona'), null); assert.deepEqual(await a.listMyOrganizations(), []);
  a.destroy();
});

test('lectures passen pel node fixat: GET públic, sense tokens/cookies, redirects, cache o query d’owner', async () => {
  const calls = [];
  const shapes = { core: buit, mur: { feedPosts: [], events: [], marketItems: [] }, multimedia: { mediaItems: [] }, notes: { notes: [], noteFolders: [] } };
  const a = creaAdaptadorNodeZeroHttp({ endpoint: 'http://localhost:4340/api/v1/node0', fetchImpl: async (url, init) => { calls.push({ url, init }); return json(shapes[url.split('/').at(-1)]); } });
  const config = { signal: new AbortController().signal, backendUrl: 'https://attacker.invalid', token: 'SECRET', tenantId: 'OTHER', headers: { Authorization: 'SECRET' } };
  assert.deepEqual(await a.loadCoreContent('private-owner', config), buit);
  assert.deepEqual(await a.loadMur('private-owner', config), shapes.mur);
  assert.deepEqual(await a.loadMultimedia('private-owner', config), shapes.multimedia);
  assert.deepEqual(await a.loadNotes('private-owner', config), shapes.notes);
  assert.deepEqual(calls.map(c => c.url), Object.keys(shapes).map(route => `http://localhost:4340/api/v1/node0/${route}`));
  for (const { init } of calls) {
    assert.equal(init.method, 'GET'); assert.equal(init.credentials, 'omit'); assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store'); assert.equal(init.referrerPolicy, 'no-referrer');
    assert.deepEqual(init.headers, { Accept: 'application/json' }); assert.equal('body' in init, false);
  }
  a.destroy();
});

test('DTO extern: projecció primitiva, cap camp privat ni claus hostils, sense mutar la font', async () => {
  const row = JSON.parse('{"id":"p1","title":{"toString":0},"summary":42,"content":"<p>Text</p>","lat":{"x":1},"lng":1.5,"image_url":{"x":1},"labels":["Poble",{"label":"maliciosa"}],"email":"privat@poble.invalid","contact_email":"secret","password_hash":"secret","__proto__":{"polluted":true},"ownerUserId":"owner"}');
  const before = JSON.stringify(row);
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => json({ feedPosts: [row, null, 1, { title: 'sense id' }, { id: ['maliciós'] }], events: [], marketItems: [] }) });
  const result = await a.loadMur();
  assert.deepEqual(result.feedPosts, [{ id: 'p1', title: '', summary: '42', content: '<p>Text</p>', image_url: '', ownerUserId: 'owner', lng: 1.5, labels: ['Poble'] }]);
  assert.equal(JSON.stringify(row), before); assert.equal({}.polluted, undefined);
  result.feedPosts[0].labels.push('client');
  assert.deepEqual((await a.loadMur()).feedPosts[0].labels, ['Poble']);
  a.destroy();
});

test('respostes malformades rebutgen, sense normalitzar una fallada del servidor a una llista buida', async () => {
  for (const value of [null, [], { towns: [] }, { ...buit, agents: {} }, { ...buit, towns: Array.from({ length: 5001 }, () => ({ id: 'x' })) }]) {
    const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => json(value) });
    await assert.rejects(a.loadCoreContent(), { codi: 'BACKEND_RESPOSTA_INVALIDA' }); a.destroy();
  }
  for (const response of [new Response('<html>SPA fallback</html>', { headers: { 'Content-Type': 'text/html' } }), new Response('{invalid', { headers: { 'Content-Type': 'application/json' } }), new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': '3000000' } })]) {
    const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => response });
    await assert.rejects(a.loadCoreContent(), { codi: 'BACKEND_RESPOSTA_INVALIDA' }); a.destroy();
  }
});

test('public DTO preserves sensitive and content warning without accepting a truthy spoof',async()=>{
  const rows=[{id:'cw',sensitive:true,content_warning:'Avís explícit'},{id:'plain',sensitive:false},{id:'spoof',sensitive:'true'}];
  const adapter=creaAdaptadorNodeZeroHttp({fetchImpl:async()=>json({feedPosts:rows,events:[],marketItems:[]})});
  try{const result=await adapter.loadMur();assert.equal(result.feedPosts[0].sensitive,true);assert.equal(result.feedPosts[0].content_warning,'Avís explícit');assert.equal(result.feedPosts[1].sensitive,false);assert.equal(Object.hasOwn(result.feedPosts[2],'sensitive'),false);}
  finally{adapter.destroy();}
});

test('la projecció pública conserva l’entitat autora i l’enllaç de la botiga del Mercat', async () => {
  const row = { id: 'oli-real', title: 'Oli de La Torre', author_entity_id: 'olidelatorre', author_name: 'Oli de La Torre', external_url: 'https://olidelatorre.com/producte', seller: 'Oli de La Torre' };
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => json({ feedPosts: [], events: [], marketItems: [row] }) });
  const { marketItems } = await a.loadMur();
  assert.equal(marketItems[0].author_entity_id, 'olidelatorre');
  assert.equal(marketItems[0].external_url, row.external_url);
  a.destroy();
});

test('cos incremental sobredimensionat es cancel·la abans de JSON.parse', async () => {
  let cancel = false;
  const response = new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(2 * 1024 * 1024 + 1)); }, cancel() { cancel = true; } }), { headers: { 'Content-Type': 'application/json' } });
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => response });
  await assert.rejects(a.loadCoreContent(), { codi: 'BACKEND_RESPOSTA_INVALIDA' }); assert.equal(cancel, true); a.destroy();
});

test('errors HTTP traduïts: sense exposar cos, tokens ni credencials del servidor', async () => {
  for (const [status, codi] of [[401, 'sense-permis'], [403, 'sense-permis'], [404, 'sense-capacitat'], [501, 'sense-capacitat'], [500, 'NODE0_HTTP']]) {
    const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => new Response('SECRET_DATABASE_PASSWORD', { status }) });
    await assert.rejects(a.loadCoreContent(), e => e.codi === codi && e.status === status && !JSON.stringify(e).includes('SECRET') && !e.message.includes('SECRET'));
    a.destroy();
  }
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => { throw new Error('https://SECRET@db.invalid'); } });
  await assert.rejects(a.loadCoreContent(), e => e.codi === 'backend-inabastable' && !e.message.includes('SECRET') && !('cause' in e)); a.destroy();
});

test('escriptures, entrada i xat rebutgen sense fer cap petició ni fallback', async () => {
  let calls = 0;
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => { calls++; throw new Error('No ha d’arribar'); } });
  const names = ['appendChatMessages', 'appendSectionSubmissionNetworkOnly', 'updateNote', 'loginWithMagicLink', 'registerWithPassword', 'loginWithPassword', 'loginWithGoogle', 'createOrganization', 'updateOrganization', 'updateProfile', 'updateUserPassword', 'recullTornadaOAuth', 'createNote', 'loadFils', 'loadMissatges', 'enviaMissatge', 'marcaLlegit', 'creaFilDirecte', 'carregaMembres', 'subscribeToXat', 'unsubscribeFromXat'];
  for (const name of names) await assert.rejects(a[name]({ token: 'SECRET' }), { codi: 'sense-capacitat' });
  assert.equal(calls, 0); a.destroy();
});

test('senyal ja avortat o avortat al mateix tic no arriba a fetch', async () => {
  let calls = 0;
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => { calls++; return json(buit); } });
  const ac = new AbortController(); ac.abort();
  await assert.rejects(a.loadCoreContent(null, { signal: ac.signal }), { name: 'AbortError' });
  const ac2 = new AbortController(); const pending = a.loadCoreContent(null, { signal: ac2.signal }); ac2.abort();
  await assert.rejects(pending, { name: 'AbortError' }); assert.equal(calls, 0); a.destroy();
});

test('avortament durant resposta i destroy no deixen eixir dades tardanes encara que el transport ignore el senyal', async () => {
  for (const mode of ['abort', 'destroy']) {
    const entrat = barrera(), reply = barrera();
    const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => { entrat.resolve(); return reply.promise; } });
    const ac = new AbortController();
    const pending = a.loadCoreContent(null, { signal: ac.signal });
    await entrat.promise;
    if (mode === 'abort') ac.abort(); else a.destroy();
    await assert.rejects(pending, mode === 'abort' ? { name: 'AbortError' } : { codi: 'NODE0_TANCAT' });
    reply.resolve(json(buit));
    if (mode === 'destroy') {
      assert.throws(() => a.getCurrentUser(), { codi: 'NODE0_TANCAT' });
      await assert.rejects(a.loadCoreContent(), { codi: 'NODE0_TANCAT' });
    }
    a.destroy();
  }
});

test('timeout talla també un fetch que ignore AbortSignal i no inicia altre backend', async () => {
  let calls = 0;
  const a = creaAdaptadorNodeZeroHttp({ timeoutMs: 5, fetchImpl: () => { calls++; return new Promise(() => {}); } });
  await assert.rejects(a.loadCoreContent(), { codi: 'backend-inabastable' }); assert.equal(calls, 1); a.destroy();
});

test('avortament cancel·la un lector de cos estancat i allibera el flux', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ pull() {}, cancel() { cancelled = true; } });
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => new Response(stream, { headers: { 'Content-Type': 'application/json' } }) });
  const ac = new AbortController();
  const pending = a.loadCoreContent(null, { signal: ac.signal });
  await new Promise(setImmediate);
  ac.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(cancelled, true);
  a.destroy();
});

test('salut mira PostgreSQL real, no només HTTP200; no rebutja en malaltia o xarxa caiguda', async () => {
  for (const [value, status, expected] of [[{ postgresql: { ok: true } }, 200, true], [{ postgresql: { ok: false } }, 200, false], [{ postgresql: { ok: false } }, 503, false], [{ postgresql: { ok: 'true' } }, 200, false], [{ ok: true }, 200, false], ['SPA', 200, false]]) {
    const a = creaAdaptadorNodeZeroHttp({ fetchImpl: async () => json(value, { status }) });
    assert.deepEqual(await a.comprovaServidor(), { ok: expected }); a.destroy();
    assert.deepEqual(await a.comprovaServidor(), { ok: false });
  }
});

