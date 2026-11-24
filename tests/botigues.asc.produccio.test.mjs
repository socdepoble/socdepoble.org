import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import { fileURLToPath } from 'node:url';
import { ClauAsc, ErrorAsc, ascDisponible, clientAsc, consultaAppStore, preparaProduccio, resolAppId } from '../scripts/botigues/app-store-connect.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIGEST = 'ab'.repeat(32), VERSION = '1.2.24', BUILD = '29';
const PEM = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const KID = 'SYNTHKEY01', ISSUER = '11111111-2222-3333-4444-555555555555';
const EMAIL = 'synthetic-private-contact@example.invalid';
const key = () => new ClauAsc({ clau: PEM.privateKey, kid: KID, issuer: ISSUER });
const attrs = (type, id, attributes = {}, relationships = {}) => ({ type, id, attributes, relationships });
const link = (type, id) => ({ data: { type, id } });
const noSecrets = (value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  for (const secret of [PEM.privateKey, KID, ISSUER, EMAIL, 'Bearer ', 'BEGIN PRIVATE KEY']) assert.equal(text.includes(secret), false, 'no private material in public output');
};
const baseVersion = (id, version, state) => attrs('appStoreVersions', id, { versionString: version, platform: 'IOS', appStoreState: state, releaseType: 'AFTER_APPROVAL', createdDate: id === 'old' ? '2026-10-01' : '2026-11-24' });

async function simulator(t, options = {}) {
  const s = {
    calls: [], writes: [], uploaded: [], tokens: [], waits: 0, fail: null, next: null,
    versions: [baseVersion('old', '1.0', 'READY_FOR_SALE'), ...(options.noTarget ? [] : [baseVersion('target', VERSION, 'PREPARE_FOR_SUBMISSION')])],
    builds: [attrs('builds', 'b29', { version: BUILD, processingState: 'VALID', usesNonExemptEncryption: false })],
    prerelease: { b29: attrs('preReleaseVersions', 'p29', { version: VERSION, platform: 'IOS' }) },
    linked: { old: attrs('builds', 'b1', { version: '1', processingState: 'VALID', usesNonExemptEncryption: false }), target: null },
    locs: { old: [attrs('appStoreVersionLocalizations', 'loc-old', { locale: 'ca', description: 'Synthetic description', supportUrl: 'https://example.invalid', keywords: 'synthetic' })], target: options.noTarget ? [] : [attrs('appStoreVersionLocalizations', 'loc-target', { locale: 'ca', whatsNew: 'Old notes' })] },
    sets: {}, images: {}, details: {}, submissions: [], items: {}, seq: 0,
    asset: Buffer.from('synthetic-image-bytes-not-a-private-screenshot')
  };
  s.prerelease.b1 = attrs('preReleaseVersions', 'p1', { version: '1.0', platform: 'IOS' });
  const detail = (id) => attrs('appStoreReviewDetails', id, { contactFirstName: 'Synthetic', contactLastName: 'Reviewer', contactEmail: EMAIL, contactPhone: '000000000', demoAccountRequired: false, notes: 'Do not print review notes' });
  s.details.old = detail('rd-old');
  s.details.target = options.noTarget ? null : detail('rd-target');
  for (const loc of ['loc-old', ...(options.noTarget ? [] : ['loc-target'])]) {
    s.sets[loc] = ['APP_IPHONE_61', ...(options.noIpad && loc === 'loc-old' ? [] : ['APP_IPAD_PRO_3GEN_129'])].map((display, i) => attrs('appScreenshotSets', `${loc}-set${i}`, { screenshotDisplayType: display }));
    for (const set of s.sets[loc]) s.images[set.id] = [attrs('appScreenshots', `${set.id}-image`, { assetDeliveryState: { state: 'COMPLETE' }, imageAsset: { width: 100, height: 200, templateUrl: '' } })];
  }
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1'); const p = url.pathname, method = req.method;
      const chunks = []; for await (const b of req) chunks.push(b); const bytes = Buffer.concat(chunks);
      let body = null; if (bytes.length && req.headers['content-type']?.includes('application/json')) body = JSON.parse(bytes.toString());
      s.calls.push({ method, path: p }); if (method !== 'GET') s.writes.push({ method, path: p, body });
      const send = (data, code = 200, extra = {}) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify({ data, ...extra })); };
      if (p.startsWith('/v1/')) {
        const token = req.headers.authorization?.slice(7); s.tokens.push(token);
        const parts = token?.split('.') ?? [];
        if (parts.length !== 3 || !crypto.verify('sha256', Buffer.from(parts.slice(0, 2).join('.')), { key: PEM.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(parts[2], 'base64url'))) return send(null, 401);
      } else assert.equal(req.headers.authorization, undefined, 'asset transfer has no API bearer');
      if (s.fail && s.fail(req, url, body)) { res.writeHead(s.fail.status ?? 403); return res.end(JSON.stringify({ errors: [{ detail: `${EMAIL} ${KID} ${ISSUER} ${PEM.privateKey}` }] })); }
      if (p.startsWith('/images/')) { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(s.asset); }
      if (p.startsWith('/upload/')) { s.uploaded.push(bytes); res.writeHead(204); return res.end(); }
      if (method === 'GET') {
        if (p === '/v1/apps') return send([attrs('apps', '123', { bundleId: 'org.socdepoble.app' })]);
        if (p === '/v1/apps/123/appStoreVersions') return send(s.versions, 200, s.next ? { links: { next: s.next } } : {});
        if (p === '/v1/builds') { if (s.onBuildRead) s.onBuildRead(); return send(s.builds); }
        let m;
        if ((m = p.match(/^\/v1\/builds\/([^/]+)\/preReleaseVersion$/))) return send(s.prerelease[m[1]]);
        if ((m = p.match(/^\/v1\/appStoreVersions\/([^/]+)\/build$/))) return send(s.linked[m[1]] ?? null);
        if ((m = p.match(/^\/v1\/appStoreVersions\/([^/]+)\/appStoreVersionLocalizations$/))) return send(s.locs[m[1]] ?? []);
        if ((m = p.match(/^\/v1\/appStoreVersionLocalizations\/([^/]+)\/appScreenshotSets$/))) return send(s.sets[m[1]] ?? []);
        if ((m = p.match(/^\/v1\/appScreenshotSets\/([^/]+)\/appScreenshots$/))) return send(s.images[m[1]] ?? []);
        if ((m = p.match(/^\/v1\/appStoreVersions\/([^/]+)\/appStoreReviewDetail$/))) return send(s.details[m[1]] ?? null);
        if (p === '/v1/apps/123/reviewSubmissions') return send(s.submissions);
        if ((m = p.match(/^\/v1\/reviewSubmissions\/([^/]+)\/items$/))) return send(s.items[m[1]] ?? []);
        if ((m = p.match(/^\/v1\/appScreenshots\/([^/]+)$/))) return send(Object.values(s.images).flat().find((x) => x.id === m[1]));
      }
      const d = body?.data;
      if (method === 'POST') {
        if (p === '/v1/appStoreVersions') { const v = attrs(d.type, 'target', { ...d.attributes, appStoreState: 'PREPARE_FOR_SUBMISSION' }); s.versions.push(v); return send(v, 201); }
        if (p === '/v1/appStoreVersionLocalizations') { const v = attrs(d.type, `loc-new${++s.seq}`, d.attributes); (s.locs[d.relationships.appStoreVersion.data.id] ??= []).push(v); return send(v, 201); }
        if (p === '/v1/appScreenshotSets') { const v = attrs(d.type, `set-new${++s.seq}`, d.attributes); (s.sets[d.relationships.appStoreVersionLocalization.data.id] ??= []).push(v); return send(v, 201); }
        if (p === '/v1/appScreenshots') {
          const v = attrs(d.type, `shot-new${++s.seq}`, { ...d.attributes, assetDeliveryState: { state: 'AWAITING_UPLOAD' }, uploadOperations: [{ method: 'PUT', url: `${s.origin}/upload/part`, offset: 0, length: d.attributes.fileSize, requestHeaders: [{ name: 'Content-Type', value: 'image/png' }] }] });
          if (s.changeUpload) s.changeUpload(v.attributes.uploadOperations);
          (s.images[d.relationships.appScreenshotSet.data.id] ??= []).push(v); return send(v, 201);
        }
        if (p === '/v1/appStoreReviewDetails') { const v = attrs(d.type, 'rd-new', d.attributes); s.details[d.relationships.appStoreVersion.data.id] = v; return send(v, 201); }
        if (p === '/v1/reviewSubmissions') { const v = attrs(d.type, 'submission-new', { state: 'READY_FOR_REVIEW', platform: 'IOS' }); s.submissions.push(v); return send(v, 201); }
        if (p === '/v1/reviewSubmissionItems') { const v = attrs(d.type, 'item-new', {}, d.relationships); (s.items[d.relationships.reviewSubmission.data.id] ??= []).push(v); return send(v, 201); }
      }
      if (method === 'PATCH') {
        let m;
        if ((m = p.match(/^\/v1\/appStoreVersions\/([^/]+)\/relationships\/build$/))) { s.linked[m[1]] = s.builds.find((x) => x.id === d.id); res.writeHead(204); return res.end(); }
        if ((m = p.match(/^\/v1\/appStoreVersions\/([^/]+)$/))) { const v = s.versions.find((x) => x.id === m[1]); Object.assign(v.attributes, d.attributes); return send(v); }
        if ((m = p.match(/^\/v1\/appStoreVersionLocalizations\/([^/]+)$/))) { const v = Object.values(s.locs).flat().find((x) => x.id === m[1]); Object.assign(v.attributes, d.attributes); return send(v); }
        if ((m = p.match(/^\/v1\/appStoreReviewDetails\/([^/]+)$/))) { const v = Object.values(s.details).find((x) => x?.id === m[1]); Object.assign(v.attributes, d.attributes); return send(v); }
        if ((m = p.match(/^\/v1\/appScreenshots\/([^/]+)$/))) {
          const v = Object.values(s.images).flat().find((x) => x.id === m[1]);
          assert.equal(d.attributes.sourceFileChecksum, crypto.createHash('md5').update(s.asset).digest('hex'));
          assert.equal(Buffer.concat(s.uploaded.slice(-1)).equals(s.asset), true);
          Object.assign(v.attributes, d.attributes, { assetDeliveryState: { state: 'COMPLETE' } }); return send(v);
        }
        if ((m = p.match(/^\/v1\/reviewSubmissions\/([^/]+)$/))) { const v = s.submissions.find((x) => x.id === m[1]); v.attributes.state = 'WAITING_FOR_REVIEW'; s.versions.find((x) => x.id === 'target').attributes.appStoreState = 'WAITING_FOR_REVIEW'; if (s.submissionAck) return send(s.submissionAck(v)); return send(v); }
      }
      send(null, 404);
    } catch { res.writeHead(500); res.end('synthetic simulator failure'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  s.origin = `http://127.0.0.1:${server.address().port}`;
  for (const shot of Object.values(s.images).flat()) shot.attributes.imageAsset.templateUrl = `${s.origin}/images/{w}x{h}.{f}`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
  s.client = clientAsc({ clau: key(), valors: { SDP_APP_ID: 'org.socdepoble.app' }, baseUrl: s.origin, fetchImpl: (url, init) => {
    if (new URL(url).origin !== s.origin) throw Error('External network forbidden by synthetic harness');
    return fetch(url, init);
  }, espera: async () => { s.waits++; } });
  s.prepare = (more = {}) => preparaProduccio({ client: s.client, versio: VERSION, build: BUILD, sha256: DIGEST, confirma: `produccio:${VERSION}+${BUILD}@${DIGEST.slice(0, 12)}`, notes: { ca: 'Novetats sintètiques' }, ...more });
  return s;
}

test('ASC ES256 token has verified P1363 signature, bounded lifetime and private inspect/JSON', () => {
  const k = key(); noSecrets(JSON.stringify(k)); noSecrets(util.inspect(k, { showHidden: true })); assert.deepEqual(Object.keys(k), []);
  const jwt = k.jwt({ ara: 1700000000000, durada: 600 }), [h, p, signature] = jwt.split('.');
  const header = JSON.parse(Buffer.from(h, 'base64url')), payload = JSON.parse(Buffer.from(p, 'base64url'));
  assert.equal(header.alg, 'ES256'); assert.equal(payload.aud, 'appstoreconnect-v1'); assert.equal(payload.exp - payload.iat, 600);
  assert.equal(Buffer.from(signature, 'base64url').length, 64);
  assert.equal(crypto.verify('sha256', Buffer.from(`${h}.${p}`), { key: PEM.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url')), true);
  assert.throws(() => k.jwt({ durada: 601 }), ErrorAsc);
  assert.throws(() => new ClauAsc({ clau: 'bad', kid: KID, issuer: ISSUER }), (e) => { noSecrets(e.message + util.inspect(e)); return e instanceof ErrorAsc; });
});

test('ASC credentials availability is descriptor-only; never invokes getters', () => {
  assert.equal(ascDisponible({ SDP_ASC_KEY_ID: KID, SDP_ASC_ISSUER_ID: ISSUER, SDP_ASC_KEY_PATH: '/synthetic.p8' }), true);
  assert.equal(ascDisponible({ SDP_ASC_KEY_ID: KID }), false);
  assert.equal(ascDisponible({ get SDP_ASC_KEY_ID() { throw Error('do not run'); } }), false);
});

test('ASC read-only state resolves exact bundle and target; summaries omit private review data', async (t) => {
  const s = await simulator(t); const r = await consultaAppStore({ client: s.client, versio: VERSION, build: BUILD });
  assert.equal(r.readyForSale, false); assert.equal(r.reviewDetail, true); assert.deepEqual(r.captures, { iphone: 1, ipad: 1 });
  assert.equal(s.writes.length, 0); noSecrets(r); noSecrets(util.inspect(s.client));
  assert.equal(await resolAppId({ client: s.client }), '123');
  await assert.rejects(resolAppId({ client: s.client, appId: '999' }), ErrorAsc);
  const latest = await consultaAppStore({ client: s.client }); assert.equal(latest.builds[0].build, BUILD); assert.equal(latest.readyForSale, false);
});

test('ASC public availability requires exact IOS marketing version, linked build and VALID', async (t) => {
  const s = await simulator(t); s.linked.target = s.builds[0]; const v = s.versions.find((x) => x.id === 'target');
  for (const state of ['WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_DEVELOPER_RELEASE']) { v.attributes.appStoreState = state; assert.equal((await consultaAppStore({ client: s.client, versio: VERSION, build: BUILD })).readyForSale, false); }
  v.attributes.appStoreState = 'READY_FOR_SALE'; assert.equal((await consultaAppStore({ client: s.client, versio: VERSION, build: BUILD })).readyForSale, true);
  s.builds[0].attributes.processingState = 'PROCESSING'; assert.equal((await consultaAppStore({ client: s.client, versio: VERSION, build: BUILD })).readyForSale, false);
  s.builds[0].attributes.processingState = 'VALID'; s.prerelease.b29.attributes.version = '1.2.23'; assert.equal((await consultaAppStore({ client: s.client, versio: VERSION, build: BUILD })).readyForSale, false);
});

test('ASC exact production confirmation blocks all requests, not just final submission', async (t) => {
  const s = await simulator(t);
  for (const confirma of [undefined, VERSION + '+' + BUILD, `produccio:${VERSION}+${BUILD}@000000000000`]) await assert.rejects(s.prepare({ confirma }), (e) => e instanceof ErrorAsc && e.tipus === 'confirma');
  assert.deepEqual(s.calls, []);
});

test('ASC existing version preparation uses AFTER_APPROVAL, all notes, exact linked build then submits once', async (t) => {
  const s = await simulator(t); s.versions.find((x) => x.id === 'target').attributes.releaseType = 'MANUAL';
  const r = await s.prepare({ enviaRevisio: true });
  assert.equal(r.prepared, true); assert.equal(r.submitted, true); assert.equal(r.reviewSubmission.state, 'WAITING_FOR_REVIEW');
  assert.equal(r.releaseType, 'AFTER_APPROVAL'); assert.equal(r.linkedBuild.id, 'b29'); noSecrets(r);
  const paths = s.writes.map((x) => x.path);
  assert.equal(paths.filter((p) => p === '/v1/reviewSubmissions').length, 1); assert.equal(paths.filter((p) => p === '/v1/reviewSubmissionItems').length, 1);
  assert.ok(paths.indexOf('/v1/appStoreVersions/target/relationships/build') < paths.indexOf('/v1/reviewSubmissions/submission-new'));
  const count = s.writes.length; const again = await s.prepare({ enviaRevisio: true }); assert.equal(again.submitted, true); assert.equal(s.writes.length, count, 'already-submitted retry is read only');
});

test('ASC no version: inherits locale/review and uploads iPhone+iPad without reparenting approved assets', async (t) => {
  const s = await simulator(t, { noTarget: true }); const oldIds = s.images['loc-old-set0'].map((x) => x.id);
  const r = await s.prepare(); assert.equal(r.prepared, true); assert.equal(r.submitted, false); assert.deepEqual(r.captures, { iphone: 1, ipad: 1 });
  assert.equal(s.uploaded.length, 2); assert.deepEqual(s.images['loc-old-set0'].map((x) => x.id), oldIds);
  assert.equal(s.writes.filter((x) => x.path === '/v1/appStoreReviewDetails').length, 1);
  assert.equal(s.writes.some((x) => /reviewSubmission/.test(x.path)), false); noSecrets(r);
});

test('ASC build visibility and processing polling is bounded and never mutates before VALID', async (t) => {
  const s = await simulator(t); let reads = 0; const b = s.builds[0]; s.builds = [];
  s.onBuildRead = () => { reads++; if (reads >= 2) s.builds = [b]; };
  await s.prepare({ esperaValid: { intents: 3, intervalMs: 0 } }); assert.equal(s.waits, 1);
  const s2 = await simulator(t); s2.builds[0].attributes.processingState = 'PROCESSING';
  await assert.rejects(s2.prepare({ esperaValid: { intents: 3, intervalMs: 0 } }), (e) => e.tipus === 'valid');
  assert.equal(s2.waits, 2); assert.equal(s2.writes.length, 0);
});

test('ASC missing approved iPad screenshots refuses before creation or metadata writes', async (t) => {
  const s = await simulator(t, { noTarget: true, noIpad: true }); await assert.rejects(s.prepare(), (e) => e.tipus === 'captures'); assert.equal(s.writes.length, 0);
});

test('ASC notes validation checks every locale before any mutation', async (t) => {
  const s = await simulator(t); s.locs.target.push(attrs('appStoreVersionLocalizations', 'loc-es', { locale: 'es' }));
  for (const notes of [{ ca: 'Only one locale' }, { ca: 'x', es: ' '.repeat(10) }, { ca: 'x', es: 'x'.repeat(4001) }, { ca: PEM.privateKey, es: 'Valid text' }]) await assert.rejects(s.prepare({ notes }), (e) => e.tipus === 'notes');
  assert.equal(s.writes.length, 0);
  await s.prepare({ notes: { ca: 'x'.repeat(4000), es: 'Sí' } }); assert.equal(s.locs.target[0].attributes.whatsNew.length, 4000);
});

for (const status of [403, 409]) test(`ASC HTTP${status} reports bounded fixed diagnostic without Apple payload/secrets`, async (t) => {
  const s = await simulator(t); s.fail = () => true; s.fail.status = status;
  await assert.rejects(s.prepare(), (e) => { assert.ok(e instanceof ErrorAsc); assert.equal(e.status, status); assert.ok(e.message.length < 250); noSecrets(e.message + e.stack + JSON.stringify(e)); return true; }); assert.equal(s.writes.length, 0);
});

test('ASC foreign next-page URL and redirects never receive the bearer', async (t) => {
  const s = await simulator(t); s.next = 'https://attacker.invalid/v1/apps'; await assert.rejects(consultaAppStore({ client: s.client, versio: VERSION, build: BUILD }), (e) => e.tipus === 'endpoint'); assert.equal(s.writes.length, 0);
  const c = clientAsc({ clau: key(), baseUrl: s.origin, fetchImpl: async () => new Response(null, { status: 302, headers: { Location: 'https://attacker.invalid/' } }) });
  await assert.rejects(c.request('GET', '/v1/apps'), (e) => e.status === 302);
});

test('ASC pagination repeated page is rejected and request budget is finite', async (t) => {
  const s = await simulator(t); s.next = `${s.origin}/v1/apps/123/appStoreVersions?filter[platform]=IOS&limit=200`;
  await assert.rejects(consultaAppStore({ client: s.client, versio: VERSION, build: BUILD }), (e) => e.tipus === 'resposta'); assert.ok(s.calls.length <= 3);
});

test('ASC asset URL, upload gaps and unauthorized headers fail closed without submission', async (t) => {
  for (const fault of ['source', 'upload', 'gap', 'header']) {
    const s = await simulator(t, { noTarget: true });
    if (fault === 'source') s.images['loc-old-set0'][0].attributes.imageAsset.templateUrl = 'http://169.254.169.254/latest';
    s.changeUpload = (ops) => { if (fault === 'upload') ops[0].url = 'https://attacker.invalid/upload'; if (fault === 'gap') ops[0].offset = 1; if (fault === 'header') ops[0].requestHeaders = [{ name: 'Authorization', value: 'not-allowed' }]; };
    await assert.rejects(s.prepare({ enviaRevisio: true }), (e) => e.tipus === 'upload');
    assert.equal(s.uploaded.length, 0); assert.equal(s.writes.some((x) => /reviewSubmission/.test(x.path)), false);
  }
});

test('ASC active unrelated review item is not submitted or combined with this version', async (t) => {
  const s = await simulator(t); s.submissions = [attrs('reviewSubmissions', 'other-submission', { state: 'READY_FOR_REVIEW', platform: 'IOS' })];
  s.items['other-submission'] = [attrs('reviewSubmissionItems', 'other-item', {}, { appStoreVersion: link('appStoreVersions', 'other-version') })];
  await assert.rejects(s.prepare({ enviaRevisio: true }), (e) => e.tipus === 'submission');
  assert.equal(s.writes.some((x) => /reviewSubmission/.test(x.path)), false);
});

test('ASC submission receipt requires actual matching WAITING/IN_REVIEW state, never bare HTTP success', async (t) => {
  for (const kind of ['missing', 'ready', 'wrongId']) {
    const s = await simulator(t);
    s.submissionAck = (v) => attrs('reviewSubmissions', kind === 'wrongId' ? 'foreign-submission' : v.id, kind === 'missing' ? {} : { state: kind === 'ready' ? 'READY_FOR_REVIEW' : 'WAITING_FOR_REVIEW' });
    await assert.rejects(s.prepare({ enviaRevisio: true }), (e) => e.tipus === 'submission');
  }
});

test('ASC request timeout also bounds a transport that ignores AbortSignal; no raw exception echo', async () => {
  const c = clientAsc({ clau: key(), timeoutMs: 5, fetchImpl: () => new Promise(() => {}) });
  await assert.rejects(c.request('GET', '/v1/apps'), (e) => e.tipus === 'termini');
  const broken = clientAsc({ clau: key(), fetchImpl: async () => { throw Error(`${KID} ${EMAIL} ${PEM.privateKey}`); } });
  await assert.rejects(broken.request('GET', '/v1/apps'), (e) => { noSecrets(e.message + e.stack); return e.tipus === 'transport'; });
});

test('ASC key path is bounded, outside repository, mode0600 and not a final symlink', async (t) => {
  const tmpRoot = path.join(ROOT, '.r3278', 'tmp'); fs.mkdirSync(tmpRoot, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(tmpRoot, 'asc-')); t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const repo = path.join(tmp, 'repo'); fs.mkdirSync(repo); const file = path.join(tmp, 'synthetic.p8'); fs.writeFileSync(file, PEM.privateKey, { mode: 0o600 });
  const vals = { SDP_ASC_KEY_ID: KID, SDP_ASC_ISSUER_ID: ISSUER, SDP_ASC_KEY_PATH: file };
  const mk = () => clientAsc({ valors: vals, arrel: repo, fetchImpl: async () => new Response('{"data":[]}') });
  assert.deepEqual(await mk().request('GET', '/v1/apps'), { data: [] });
  fs.chmodSync(file, 0o644); await assert.rejects(mk().request('GET', '/v1/apps'), (e) => { noSecrets(e.message); return e.tipus === 'clau'; });
  fs.chmodSync(file, 0o600); const alias = path.join(tmp, 'alias.p8'); fs.symlinkSync(file, alias); vals.SDP_ASC_KEY_PATH = alias; await assert.rejects(mk().request('GET', '/v1/apps'), (e) => e.tipus === 'clau');
  vals.SDP_ASC_KEY_PATH = path.join(repo, 'inside.p8'); fs.writeFileSync(vals.SDP_ASC_KEY_PATH, PEM.privateKey, { mode: 0o600 }); await assert.rejects(mk().request('GET', '/v1/apps'), (e) => e.tipus === 'clau');
});
