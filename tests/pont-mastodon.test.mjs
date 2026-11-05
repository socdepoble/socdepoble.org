import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  COMPTE_MASTODON as C, LIMITS_MASTODON, textMastodon, normalitzaEstatMastodon,
  normalitzaRssMastodon, lligPublicacionsMastodon, lligRespostaMastodon,
  formataPublicacioMastodon, publicaAMastodon, creaActivitatMastodon
} from '../src/data/federacio/pontMastodon.js';
import {
  publicaAMastodonServidor, clauIdempotenciaMastodon, signaCreateEd25519, encolaCreateMastodon
} from '../tooling/node0/pont-mastodon-servidor.mjs';
import { verificaRfc9421Independent } from './fixtures/node0-rfc9421/receiver-independent.mjs';

const compte = { id: '42', username: 'depoble', acct: 'depoble', url: C.perfil, uri: C.actor };
const wf = { subject: `acct:${C.acct}`, links: [{ rel: 'self', type: 'application/activity+json', href: C.actor }] };
const estat = (patch = {}) => ({ id: '123', uri: `${C.actor}/statuses/123`, url: `${C.perfil}/123`,
  visibility: 'public', created_at: '2026-11-04T12:00:00Z', content: '<p>Hola <a href="https://socdepoble.cat/page/fediversity">poble</a> &amp; món</p>', account: compte, ...patch });
const item = (patch = {}) => ({ title: 'Festa del poble', summary: 'Ens trobem a la plaça.', visibility: 'public', canonicalUrl: 'https://socdepoble.cat/mur/festa', tags: ['LaTorre'], ...patch });
const resposta = (v, type = 'application/json', status = 200) => new Response(typeof v === 'string' ? v : JSON.stringify(v), { status, headers: { 'Content-Type': type } });
function servidor(estats = [estat()], overrides = {}) {
  const crides = [];
  const fetchImpl = async (url, opts) => {
    crides.push({ url, opts });
    if (url.includes('/.well-known/webfinger')) return resposta(overrides.wf ?? wf);
    if (url.includes('/api/v1/accounts/lookup')) return resposta(overrides.compte ?? compte);
    if (url.includes('/api/v1/accounts/42/statuses')) return resposta(estats);
    throw new Error(`Unexpected URL: ${url}`);
  };
  return { fetchImpl, crides };
}
const rss = (extra = '') => `<rss><channel><link>${C.perfil}</link><item><link>${C.perfil}/123</link><pubDate>Wed, 04 Nov 2026 12:00:00 GMT</pubDate><description><![CDATA[<p>Hola <a href="https://socdepoble.cat/page/fediversity">poble</a></p>]]></description>${extra}</item></channel></rss>`;

test('DTO sanejat, procedència i imatges/enllaços conservats', () => {
  const p = normalitzaEstatMastodon(estat({ media_attachments: [{ type: 'image', url: 'https://mastodont.cat/system/image.png', description: '<b>La plaça</b>' }], tags: [{ name: 'SócDePoble' }], email: 'privat@example.test', payload: { admin: true } }), { compteId: '42' });
  assert.equal(p.body, 'Hola poble & món');
  assert.equal(p.uri, `${C.actor}/statuses/123`);
  assert.equal(p.federacio.compte, C.acct);
  assert.equal(p.source, 'mastodon');
  assert.deepEqual(p.links, ['https://socdepoble.cat/page/fediversity']);
  assert.deepEqual(p.images, [{ url: 'https://mastodont.cat/system/image.png', alt: 'La plaça' }]);
  assert.deepEqual(p.tags, ['SócDePoble']);
  assert.equal('email' in p || 'payload' in p || 'content' in p, false);
});
test('HTML maliciós queda com a text inert, scripts i estils eliminats', () => {
  assert.equal(textMastodon('<script>alert(1)</script><style>x</style><p>&lt;img onerror=1&gt; &#x1F331;</p>'), '<img onerror=1> 🌱');
  assert.equal(textMastodon({ toString() { throw new Error('coerció'); } }), '');
  assert.equal(textMastodon('\ud800'), '\ufffd');
  assert.equal(textMastodon('<'.repeat(100000)).length, 10000);
});
for (const [nom, patch] of [
  ['privat', { visibility: 'private' }], ['no llistat', { visibility: 'unlisted' }],
  ['boost', { reblog: {} }], ['autor alié', { account: { ...compte, id: '43' } }],
  ['nom suplantat', { account: { ...compte, username: 'intrus' } }], ['perfil suplantat', { account: { ...compte, url: 'https://evil.example/profile' } }],
  ['URI externa', { uri: 'https://evil.example/123' }], ['id diferent', { uri: `${C.actor}/statuses/124` }],
  ['tipus id JSONB', { id: {} }], ['data invàlida', { created_at: 'no' }]
]) test(`rebutja estat ${nom}`, () => assert.equal(normalitzaEstatMastodon(estat(patch), { compteId: '42' }), null));
test('URLs de mitjans locals, javascript i credencials descartades', () => {
  const p = normalitzaEstatMastodon(estat({ media_attachments: ['http://host/image', 'https://127.0.0.1/x', 'javascript:x', 'https://u:p@evil.example/x', 'https://host.local/x'].map((url) => ({ type: 'image', url })) }), { compteId: '42' });
  assert.deepEqual(p.images, []);
});
test('normalitzador sense identitat verificada falla tancat', () => {
  assert.equal(normalitzaEstatMastodon(estat()), null);
  assert.equal(normalitzaEstatMastodon(estat({ account: { ...compte, id: undefined } })), null);
});
test('ingesta API verifica WebFinger i compte abans de mapar/deduplicar', async () => {
  const s = servidor([estat(), estat(), estat({ visibility: 'private' })]);
  const r = await lligPublicacionsMastodon({ fetchImpl: s.fetchImpl });
  assert.equal(r.publicacions.length, 1); assert.equal(r.compte, C.acct);
  assert.equal(s.crides.length, 3);
  for (const { opts } of s.crides) { assert.equal(opts.method, 'GET'); assert.equal(opts.credentials, 'omit'); assert.equal(opts.redirect, 'error'); assert.equal(opts.headers.Authorization, undefined); }
});
test('WebFinger incorrecte falla tancat sense fetch addicional', async () => {
  const s = servidor([], { wf: { ...wf, subject: 'acct:intrus@mastodont.cat' } });
  await assert.rejects(lligPublicacionsMastodon({ fetchImpl: s.fetchImpl }), { code: 'MASTODON_WEBFINGER_NO_VERIFICAT' });
  assert.equal(s.crides.length, 1);
});
test('compte look-up alié no pot aportar estats', async () => {
  const s = servidor([], { compte: { ...compte, acct: 'intrus' } });
  await assert.rejects(lligPublicacionsMastodon({ fetchImpl: s.fetchImpl }), { code: 'MASTODON_COMPTE_NO_VERIFICAT' }); assert.equal(s.crides.length, 2);
});
test('redirecció, content type i grandària rebutjats', async () => {
  const url = `${C.origen}/test`;
  await assert.rejects(lligRespostaMastodon(url, { fetchImpl: async () => { const r = resposta({}); Object.defineProperty(r, 'url', { value: 'https://evil.example/x' }); return r; } }), { code: 'MASTODON_REDIRECCIO' });
  await assert.rejects(lligRespostaMastodon(url, { fetchImpl: async () => resposta('<html>', 'text/html') }), { code: 'MASTODON_TIPUS_INVALID' });
  await assert.rejects(lligRespostaMastodon(url, { fetchImpl: async () => resposta('x'.repeat(LIMITS_MASTODON.resposta + 1)) }), { code: 'MASTODON_RESPOSTA_GRAN' });
  await assert.rejects(lligRespostaMastodon('https://evil.example/data', { fetchImpl: () => assert.fail('no fetch') }), { code: 'MASTODON_URL_INVALIDA' });
});
test('HTTP fallit no reflectix el cos remot', async () => {
  await assert.rejects(lligRespostaMastodon(`${C.origen}/test`, { fetchImpl: async () => resposta('SECRET', 'application/json', 429) }), (e) => e.code === 'MASTODON_HTTP_429' && !e.message.includes('SECRET'));
});
test('senyal d’avortament es propaga', async () => {
  const c = new AbortController(); c.abort();
  await assert.rejects(lligRespostaMastodon(`${C.origen}/test`, { signal: c.signal, fetchImpl: () => assert.fail('cap dispatch') }), { code: 'MASTODON_AVORTAT' });
});
test('fetch que ignora el senyal acaba per termini, i rebutja resultat tardà', async () => {
  let allibera; const barrera = new Promise((resolve) => { allibera = resolve; });
  let calls = 0;
  const pendent = lligRespostaMastodon(`${C.origen}/test`, { terminiMs: 5, fetchImpl: async () => { calls++; await barrera; return resposta({ tard: true }); } });
  await assert.rejects(pendent, { code: 'MASTODON_TERMINI' }); assert.equal(calls, 1); allibera();
});
test('lector de cos que ignora AbortSignal també queda fitat', async () => {
  let allibera; const barrera = new Promise((resolve) => { allibera = resolve; });
  let cancelled = 0;
  const res = { ok: true, headers: new Headers({ 'content-type': 'application/json' }), body: { getReader: () => ({ read: async () => { await barrera; return { done: true }; }, cancel() { cancelled++; return new Promise(() => {}); }, releaseLock() {} }) } };
  await assert.rejects(lligRespostaMastodon(`${C.origen}/test`, { terminiMs: 5, fetchImpl: async () => res }), { code: 'MASTODON_TERMINI' }); assert.equal(cancelled, 1); allibera();
});
test('JSON malformat torna codi estable sense reflectir bytes remots', async () => {
  await assert.rejects(lligRespostaMastodon(`${C.origen}/test`, { fetchImpl: async () => resposta('secret-malformat') }), { code: 'MASTODON_JSON_INVALID' });
});
test('RSS públic verificat, dedup i media:content', async () => {
  const xml = rss('<media:content url="https://mastodont.cat/system/image.png" type="image/png" />');
  const r = await lligPublicacionsMastodon({ format: 'rss', fetchImpl: async (url) => url.includes('webfinger') ? resposta(wf) : resposta(xml, 'application/rss+xml') });
  assert.equal(r.publicacions.length, 1); assert.equal(r.publicacions[0].body, 'Hola poble');
  assert.equal(r.publicacions[0].images[0].url, 'https://mastodont.cat/system/image.png');
  assert.equal(normalitzaRssMastodon(xml.replace('</channel>', `${xml.slice(xml.indexOf('<item>'), xml.indexOf('</item>') + 7)}</channel>`)).length, 1);
});
test('RSS amb DTD/XXE i perfil incorrecte rebutjat', () => {
  assert.throws(() => normalitzaRssMastodon(`<!DOCTYPE rss [<!ENTITY secret SYSTEM "file:///etc/passwd">]>${rss()}`), { code: 'MASTODON_RSS_INVALID' });
  assert.throws(() => normalitzaRssMastodon(rss().replace(`<link>${C.perfil}</link>`, '<link>https://evil.example/profile</link>')), { code: 'MASTODON_RSS_AUTOR_INVALID' });
});
test('ActivityPub verifica actor, pública i autoria de Note', async () => {
  const note = { id: `${C.actor}/statuses/123`, type: 'Note', attributedTo: C.actor, content: '<p>Hola</p>', published: '2026-11-04T12:00:00Z', to: ['https://www.w3.org/ns/activitystreams#Public'], url: `${C.perfil}/123` };
  const fetchImpl = async (url) => resposta(url.includes('webfinger') ? wf : url === C.actor ? { id: C.actor, preferredUsername: 'depoble', outbox: `${C.actor}/outbox` } : { orderedItems: [{ type: 'Create', actor: C.actor, object: note }, { type: 'Create', actor: C.actor, object: { ...note, attributedTo: 'https://evil.example/actor' } }] });
  const r = await lligPublicacionsMastodon({ format: 'activitypub', fetchImpl }); assert.equal(r.publicacions.length, 1); assert.equal(r.publicacions[0].text, 'Hola');
});
test('format públic conserva títol, resum, hashtags i URL en ≤500 codepoints', () => {
  const p = formataPublicacioMastodon(item()); assert.match(p.status, /Festa del poble\n\nEns trobem/); assert.match(p.status, /#LaTorre/); assert.ok(p.status.endsWith(item().canonicalUrl));
  const llarg = formataPublicacioMastodon(item({ summary: '🌱'.repeat(900) })); assert.equal([...llarg.status].length, 500); assert.ok(llarg.status.includes('…'));
});
test('events i seccions verticals canòniques del router admeses', () => {
  const event = 'https://socdepoble.cat/events/cursos-pedra-en-sec-fageca-alcosser-2026';
  assert.ok(formataPublicacioMastodon(item({ canonicalUrl: event })).status.endsWith(event));
  for (const route of ['vehicle', 'treball', 'habitatge']) assert.ok(formataPublicacioMastodon(item({ canonicalUrl: `https://socdepoble.cat/${route}/p-123` })).status.endsWith(`/${route}/p-123`));
});
for (const [nom, patch] of [['privat', { visibility: 'private' }], ['sense visibilitat', { visibility: undefined }], ['cicle pont', { federacio: { origen: 'mastodon' } }], ['URL aliena', { canonicalUrl: 'https://evil.example/article' }], ['xat', { canonicalUrl: 'https://socdepoble.cat/xat/1' }], ['query', { canonicalUrl: 'https://socdepoble.cat/mur?token=secret' }], ['notes codificat', { canonicalUrl: 'https://socdepoble.cat/%6eotes/private' }], ['barra codificada', { canonicalUrl: 'https://socdepoble.cat/notes%2fprivate' }], ['API', { canonicalUrl: 'https://socdepoble.cat/api/v1/private' }], ['ruta inexistent', { canonicalUrl: 'https://socdepoble.cat/inventat/1' }]])
  test(`eixida rebutja ${nom}`, () => assert.throws(() => formataPublicacioMastodon(item(patch))));
test('client només delega a servidor, rebutja OAuth i validació privada precedix transport', async () => {
  await assert.rejects(publicaAMastodon(item(), { token: 'fake-test-token', publicaServidor: () => assert.fail('no transport') }), { code: 'MASTODON_SERVIDOR_REQUERIT' });
  await assert.rejects(publicaAMastodon(item({ visibility: 'private' }), { publicaServidor: () => assert.fail('no transport') }));
  assert.deepEqual(await publicaAMastodon(item(), { publicaServidor: async () => ({ estat: 'en_cua' }) }), { estat: 'en_cua' });
});
test('marca primitiva Mastodon evita cicle després de projectar el DTO HTTP', () => {
  const remote = normalitzaEstatMastodon(estat(), { compteId: '42' });
  const projected = { title: 'Republicació', body: remote.body, source: remote.source, visibility: 'public', canonicalUrl: 'https://socdepoble.cat/mur/importat' };
  assert.throws(() => formataPublicacioMastodon(projected), { code: 'MASTODON_PUBLICACIO_NO_PUBLICA' });
});
test('REST només servidor: endpoint fix, token local i Idempotency-Key estable', async () => {
  const crides = []; const fetchImpl = async (url, opts) => { crides.push({ url, opts }); return resposta(opts.method==='GET'?{...compte,source:{private:'SENTINEL_PRIVATE'}}:estat()); };
  const a = await publicaAMastodonServidor(item(), { token: 'test-token-inventat', fetchImpl });
  const b = await publicaAMastodonServidor(item(), { token: 'test-token-inventat', fetchImpl });
  assert.equal(a.idempotencyKey, b.idempotencyKey); assert.equal(a.idempotencyKey, clauIdempotenciaMastodon(item()));
  assert.notEqual(a.idempotencyKey, clauIdempotenciaMastodon(item({ summary: 'Editat' })));
  assert.deepEqual(crides.map(c=>c.opts.method),['GET','POST','GET','POST']);
  assert.equal(crides[0].url, `${C.origen}/api/v1/accounts/verify_credentials`); assert.equal(crides[0].opts.cache,'no-store'); assert.equal(Object.hasOwn(crides[0].opts,'body'),false);
  assert.equal(crides[1].url, `${C.origen}/api/v1/statuses`); assert.equal(crides[1].opts.redirect, 'error');
  for(const c of crides){assert.equal(c.opts.headers.Authorization,'Bearer test-token-inventat');assert.equal(c.opts.credentials,'omit');assert.equal(c.opts.redirect,'error');}
  assert.equal(crides[1].opts.headers['Idempotency-Key'], a.idempotencyKey); assert.equal(crides[3].opts.headers['Idempotency-Key'],a.idempotencyKey);
  assert.equal(JSON.parse(crides[1].opts.body).visibility, 'public'); assert.equal(JSON.stringify(a).includes('test-token'), false); assert.equal(JSON.stringify(a).includes('SENTINEL_PRIVATE'),false);
});
test('token preflight: compte alié falla abans del primer POST', async () => {
  let posts=0,failure;
  await publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl:async(_url,opts)=>{
    if(opts.method==='GET')return resposta({...compte,uri:C.actor,username:'foreign',acct:'foreign',url:'https://mastodont.cat/@foreign'});
    posts++;return resposta(estat());
  }}).catch(error=>{failure=error;});
  assert.equal(posts,0,'a token for another account must never create any status');
  assert.equal(failure?.code,'MASTODON_TOKEN_COMPTE_NO_VERIFICAT');
});
test('REST token absent, errors i respostes falses no es filtren ni publiquen', async () => {
  await assert.rejects(publicaAMastodonServidor(item(), { token: '', fetchImpl: () => assert.fail('no fetch') }), { code: 'MASTODON_TOKEN_ABSENT_O_INVALID' });
  await assert.rejects(publicaAMastodonServidor(item(), { token: 'fake-token', fetchImpl: async () => resposta('secret-remot', 'application/json', 403) }), { code: 'MASTODON_HTTP_403' });
  await assert.rejects(publicaAMastodonServidor(item(), { token: 'fake-token', fetchImpl: async (_url,opts) => resposta(opts.method==='GET'?compte:estat({ visibility: 'private' })) }), { code: 'MASTODON_RESULTAT_NO_VERIFICAT' });
  await assert.rejects(publicaAMastodonServidor(item(), { token: 'fake-token', fetchImpl: async () => { throw new Error('fake-token'); } }), (e) => e.code === 'MASTODON_TRANSPORT_FALLIT' && !e.message.includes('fake-token'));
});
test('REST avortat abans de dispatch no publica, timeout ambigu no reintenta', async () => {
  const c = new AbortController(); c.abort();
  await assert.rejects(publicaAMastodonServidor(item(), { token: 'fake-token', signal: c.signal, fetchImpl: () => assert.fail('no dispatch') }), { code: 'MASTODON_AVORTAT' });
  let calls = 0; let allibera; const barrera = new Promise((resolve) => { allibera = resolve; });
  const p = publicaAMastodonServidor(item(), { token: 'fake-token', terminiMs: 5, fetchImpl: async (_url,opts) => { if(opts.method==='GET')return resposta(compte);calls++; await barrera; return resposta(estat()); } });
  await assert.rejects(p, { code: 'MASTODON_ENVIAMENT_INDETERMINAT' }); assert.equal(calls, 1); allibera();
});
test('token preflight: cada camp d’identitat i el pin públic opcional es comproven abans del POST',async()=>{
  for(const patch of [{username:'other'},{acct:'depoble@mastodont.cat'},{url:C.perfil+'?spoof=1'},{uri:'https://mastodont.cat/users/other'},{id:''},{id:42},{id:'id\nspoof'}]){
    let posts=0;await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl:async(_url,opts)=>{if(opts.method==='POST')posts++;return resposta({...compte,...patch});}}),{code:'MASTODON_TOKEN_COMPTE_NO_VERIFICAT'});assert.equal(posts,0);
  }
  let posts=0;const fetchImpl=async(_url,opts)=>{if(opts.method==='POST')posts++;return resposta(opts.method==='GET'?compte:estat());};
  await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl,compteIdVerificat:'43'}),{code:'MASTODON_TOKEN_COMPTE_NO_VERIFICAT'});assert.equal(posts,0);
  await publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl,compteIdVerificat:'42'});assert.equal(posts,1);
});
test('token preflight: errors HTTP o transport de verificació tenen zero POST i no reflectixen secrets',async()=>{
  for(const status of[401,403,422]){
    let posts=0;await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl:async(_url,opts)=>{if(opts.method==='POST')posts++;return resposta({error:'SENTINEL_PRIVATE'},'application/json',status);}}),e=>e.code===`MASTODON_HTTP_${status}`&&!e.message.includes('SENTINEL_PRIVATE'));assert.equal(posts,0);
  }
  let posts=0;await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl:async(_url,opts)=>{if(opts.method==='POST')posts++;throw Error('fake-token SENTINEL_PRIVATE');}}),e=>e.code==='MASTODON_TRANSPORT_FALLIT'&&!e.message.includes('fake-token'));assert.equal(posts,0);
});
test('token preflight: GET tardà que ignora AbortSignal mai activa el POST després del termini',async()=>{
  let release,gets=0,posts=0;const barrier=new Promise(resolve=>{release=resolve;});
  const pending=publicaAMastodonServidor(item(),{token:'fake-token',terminiMs:5,fetchImpl:async(_url,opts)=>{if(opts.method==='GET'){gets++;await barrier;return resposta(compte);}posts++;return resposta(estat());}});
  await assert.rejects(pending,{code:'MASTODON_TERMINI'});assert.equal(gets,1);assert.equal(posts,0);release();await new Promise(resolve=>setImmediate(resolve));assert.equal(posts,0);
});
test('token preflight: avortament durant GET no és publicació ambigua ni permet POST tardà',async()=>{
  const controller=new AbortController();let release,started,posts=0;const barrier=new Promise(resolve=>{release=resolve;}),began=new Promise(resolve=>{started=resolve;});
  const pending=publicaAMastodonServidor(item(),{token:'fake-token',signal:controller.signal,fetchImpl:async(_url,opts)=>{if(opts.method==='GET'){started();await barrier;return resposta(compte);}posts++;return resposta(estat());}});
  await began;controller.abort();await assert.rejects(pending,{code:'MASTODON_AVORTAT'});release();await new Promise(resolve=>setImmediate(resolve));assert.equal(posts,0);
});
test('token preflight: lector encallat es cancel·la al termini i cap detall privat d’error travessa',async()=>{
  let cancelled=false,posts=0;
  const blocked=new Response(new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled=true;}}),{headers:{'Content-Type':'application/json'}});
  await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',terminiMs:5,fetchImpl:async(_url,opts)=>{if(opts.method==='POST')posts++;return blocked;}}),{code:'MASTODON_TERMINI'});assert.equal(cancelled,true);assert.equal(posts,0);
  const failing=new Response(new ReadableStream({start(controller){controller.error(Object.assign(Error('fake-token SENTINEL_PRIVATE'),{code:'MASTODON_TERMINI'}));}}),{headers:{'Content-Type':'application/json'}});
  await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl:async()=>failing}),e=>e.code==='MASTODON_TRANSPORT_FALLIT'&&!e.message.includes('SENTINEL_PRIVATE'));
});
test('token preflight: redirecció, JSON, MIME i pressupost de bytes fallen sense POST',async()=>{
  const cases=[()=>{const res=resposta(compte);Object.defineProperty(res,'redirected',{value:true});return res;},()=>{const res=resposta(compte);Object.defineProperty(res,'url',{value:'https://evil.example/account'});return res;},()=>resposta('{}','text/html'),()=>resposta('{invalid'),()=>new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':String(LIMITS_MASTODON.resposta+1)}}),()=>resposta({padding:'x'.repeat(LIMITS_MASTODON.resposta+1)})];
  for(const make of cases){let posts=0;await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl:async(_url,opts)=>{if(opts.method==='POST')posts++;return make();}}));assert.equal(posts,0);}
});
test('REST resultat de POST ha de pertànyer al mateix account id verificat, sense reintent',async()=>{
  let gets=0,posts=0;await assert.rejects(publicaAMastodonServidor(item(),{token:'fake-token',fetchImpl:async(_url,opts)=>{if(opts.method==='GET'){gets++;return resposta(compte);}posts++;return resposta(estat({account:{...compte,id:'other'}}));}}),{code:'MASTODON_RESULTAT_NO_VERIFICAT'});assert.equal(gets,1);assert.equal(posts,1);
});
test('Create(Note) Ed25519 RFC9421 es verifica independentment, i el cos alterat falla', async () => {
  const ara = Date.parse('2026-11-04T12:00:00Z'); const keys = await webcrypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const signed = await signaCreateEd25519(item(), { id: 'https://socdepoble.cat/ap/objects/festa', publicat: new Date(ara).toISOString(), clauPrivada: keys.privateKey, ara });
  assert.equal(signed.activitat.type, 'Create'); assert.equal(signed.activitat.object.type, 'Note'); assert.match(signed.capcaleres['signature-input'], /;alg="ed25519"$/);
  assert.match(signed.capcaleres['content-digest'], /^sha-256=:[A-Za-z0-9+/]+=*:$/); assert.match(signed.capcaleres.signature, /^sig1=:/);
  const pemBytes = await webcrypto.subtle.exportKey('spki', keys.publicKey);
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(pemBytes).toString('base64')}\n-----END PUBLIC KEY-----`;
  const actor = signed.activitat.actor; const keyId = `${actor}#ed25519`;
  const opts = { method: 'POST', url: signed.url, headers: signed.capcaleres, body: signed.cos, now: ara, keyId, publicKeyPem };
  assert.equal(verificaRfc9421Independent(opts).valida, true);
  assert.equal(verificaRfc9421Independent({ ...opts, body: `${signed.cos} ` }).valida, false);
});
test('cua AP només crida persistència injectada i empra id estable', async () => {
  const q = []; const opts = { id: 'https://socdepoble.cat/ap/objects/festa', publicat: '2026-11-04T12:00:00Z', encola: async (r) => { q.push(r); return { estat: 'en_cua', id: r.id }; } };
  const r = await encolaCreateMastodon(item(), opts); assert.equal(r.id, `${opts.id}#create`); assert.equal(q[0].desti, `${C.actor}/inbox`);
  assert.equal(q[0].activitat.object.attributedTo, 'https://socdepoble.cat/ap/actors/socdepoble');
  assert.deepEqual(q[0].activitat.cc, ['https://socdepoble.cat/ap/followers/socdepoble']);
  assert.deepEqual(q[0].activitat.object.cc, q[0].activitat.cc);
  await assert.rejects(encolaCreateMastodon(item(), {}), { code: 'MASTODON_CUA_DURABLE_REQUERIDA' });
  assert.throws(() => creaActivitatMastodon(item(), { ...opts, id: 'https://evil.example/ap/objects/festa' }));
});
