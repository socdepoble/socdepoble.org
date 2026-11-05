import test from 'node:test';
import assert from 'node:assert/strict';
import { projectaPublicacioFederada, publicacionsDelBuild } from './publicacions-federades.mjs';
import { preparaFederacio, preparaFederacioDelBuild, fitxersWebFingerEstatic, reglesFirebaseWebFinger } from './genera-federacio.mjs';
import * as ap from '../../src/data/activitypub.js';
/* Decisió del Mestre del 31-10-2026 (Ronda 2): només La Torre es federa. */
const TORRE = 'la-torre-de-les-macanes';
const origen = 'https://socdepoble.org', pobles = [{ slug: TORRE, nom: 'La Torre de les Maçanes' }];
const item = { id: 'avis-1', title: 'Obres al carrer', content: '<p>Demà al matí.</p>', poble_id: TORRE, author_entity_id: 'ajuntament', visibility: 'public', status: 'published', created_at: '2026-10-31T10:00:00Z' };
test('Note, Article i Event reals del payload generen Create i objectes recuperables', async () => {
  const publicacions = [item, { ...item, id: 'noticia', type: 'news' }, { ...item, id: 'acte', type: 'event', date: '2026-11-01', time: '12:00' }]
    .map(i => projectaPublicacioFederada('mur', i, { pobles, origen }));
  assert.ok(publicacions.every(Boolean));
  const preparat = await preparaFederacio({ origen, publicacions });
  const out = preparat.fitxers.get(`ap/outbox/${TORRE}.json`);
  /* D05 (pla 261101_1246) · Expectativa actualitzada a posta: les 3 publicacions i la pàgina pública del poble (abans, 3). */
  assert.equal(out.totalItems, 4); assert.deepEqual(new Set(out.orderedItems.map(a => a.object.type)), new Set(['Note','Article','Event']));
  assert.equal(out.orderedItems.at(-1).object.url, `${origen}/pobles/${TORRE}`);
  for (const activitat of out.orderedItems) {
    assert.equal(activitat.type, 'Create');
    assert.deepEqual(preparat.fitxers.get(new URL(activitat.object.id).pathname.slice(1)), { '@context': ap.CONTEXT_AS, ...activitat.object });
  }
});
test('privat, esborrany, persona, submissió, altre poble i text sospitós no es publiquen', () => {
  for (const canvi of [{ visibility: 'private' }, { status: 'draft' }, { author_entity_id: null }, { owner_user_id: null }, { poble_id: 'tibi' }, { title: "sb_" + "secret_abcdefghijklmnopqrstuvwxyz1234567890" }])
    assert.equal(projectaPublicacioFederada('mur', { ...item, ...canvi }, { pobles, origen }), null);
  assert.equal(projectaPublicacioFederada('mercat', item, { pobles, origen }), null);
  assert.equal(projectaPublicacioFederada('events', item, { pobles, origen }), null);
});
test('lectura anònima compartida, només GET, sense submissions, error de xarxa talla', async () => {
  const env = { VITE_DATA_MODE: 'remote', VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_abcdefghijklmnopqrstuvwxyz1234567890', VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111' };
  let crides = 0;
  const fetchImpl = async (url, op) => { crides++; assert.equal(op.method, 'GET'); assert.ok(url.includes('app_content')); const key = new URL(url).searchParams.get('key').slice(3);
    return new Response(JSON.stringify([{ key, payload: key === 'feedPosts' ? [item] : [] }]), { headers: { 'content-type':'application/json' } }); };
  assert.equal((await publicacionsDelBuild({ env, origen, pobles, fetchImpl })).length, 1); assert.equal(crides, 2);
  await assert.rejects(publicacionsDelBuild({ env, origen, pobles, fetchImpl: async () => { throw new Error('offline'); } }), /offline/);
});
/* R2-COR-02: l'escapada del build sense xarxa (SDP_SOCIAL_SENSE_REMOT=1, la del flake) també val per a l'outbox. */
test('SDP_SOCIAL_SENSE_REMOT=1: cap petició, [] i un avís, encara que la configuració siga remota', async (t) => {
  const env = { VITE_DATA_MODE: 'remote', VITE_SUPABASE_URL: 'https://backend.invalid', VITE_SUPABASE_ANON_KEY: 'sb_publishable_abcdefghijklmnopqrstuvwxyz1234567890', VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111' };
  const abans = process.env.SDP_SOCIAL_SENSE_REMOT;
  process.env.SDP_SOCIAL_SENSE_REMOT = '1';
  t.after(() => { if (abans === undefined) delete process.env.SDP_SOCIAL_SENSE_REMOT; else process.env.SDP_SOCIAL_SENSE_REMOT = abans; });
  const avisos = t.mock.method(console, 'warn', () => {});
  let crides = 0;
  const fetchImpl = async () => { crides++; throw new Error('cap xarxa'); };
  assert.deepEqual(await publicacionsDelBuild({ env, origen, pobles, fetchImpl }), []);
  assert.equal(crides, 0);
  assert.equal(avisos.mock.callCount(), 1);
  assert.match(String(avisos.mock.calls[0].arguments[0]), /SDP_SOCIAL_SENSE_REMOT=1/);
  const preparat = await preparaFederacioDelBuild({ origen, env, fetchImpl });
  // D05 · Expectativa actualitzada a posta: sense xarxa, només la pàgina pública del poble (abans, 0).
  assert.equal(preparat.fitxers.get(`ap/outbox/${TORRE}.json`).totalItems, 1);
  assert.equal(crides, 0);
});
test('només el projecte i La Torre tenen actor, JRD estàtic i reescriptura; NodeInfo 2.1 sense entrades per poble', async () => {
  const p = await preparaFederacio({ origen }); const files = fitxersWebFingerEstatic(p); const regles = reglesFirebaseWebFinger(p);
  assert.deepEqual(p.actors.map(a => a.slug), ['socdepoble', TORRE]);
  for (const actor of p.actors) { assert.ok(files.has(`.well-known/webfinger/${actor.slug}.json`)); assert.ok(regles.rewrites.some(r => r.destination.endsWith(`/${actor.slug}.json`))); }
  for (const mostra of ['penaguila', 'benifallim', 'sella', 'orxeta', 'relleu', 'alcoleja', 'xixona', 'tibi']) {
    assert.equal(files.has(`.well-known/webfinger/${mostra}.json`), false, mostra);
    assert.equal(p.fitxers.has(`ap/actors/${mostra}.json`) || p.fitxers.has(`ap/outbox/${mostra}.json`), false, mostra);
    assert.equal(regles.rewrites.some(r => r.destination.endsWith(`/${mostra}.json`)), false, mostra);
  }
  const nodeinfo = files.get('nodeinfo/2.1.json');
  assert.equal(nodeinfo.version, '2.1'); assert.ok(files.has('.well-known/nodeinfo'));
  assert.deepEqual(nodeinfo.usage, { users: {} });
  assert.equal(JSON.stringify(nodeinfo).includes('penaguila'), false);
});
test('una publicació pública d’un poble de mostra no crea cap actor ni outbox federat', async () => {
  const env = { VITE_DATA_MODE: 'remote', VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_abcdefghijklmnopqrstuvwxyz1234567890', VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111' };
  const fetchImpl = async (url) => { const key = new URL(url).searchParams.get('key').slice(3);
    return new Response(JSON.stringify([{ key, payload: key === 'feedPosts' ? [item, { ...item, id: 'avis-sella', poble_id: 'sella' }] : [] }]), { headers: { 'content-type':'application/json' } }); };
  const p = await preparaFederacioDelBuild({ origen, env, fetchImpl });
  assert.deepEqual(p.actors.map(a => a.slug), ['socdepoble', TORRE]);
  // D05 · Expectativa actualitzada a posta: l'avís de La Torre i la pàgina pública del poble (abans, 1).
  assert.equal(p.fitxers.get(`ap/outbox/${TORRE}.json`).totalItems, 2);
  assert.equal(p.fitxers.has('ap/outbox/sella.json'), false);
});
