import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { fork } from 'node:child_process';
import { creaIdbFalsEstructurat } from './helpers/idbFalsEstructurat.js';
import { CONTRACTE_NUCLI } from '../src/data/contracte.js';
import * as port from '../src/data/backendPort.js';
import * as revisions from '../src/data/supabase/revisionsPagines.js';
import { desaPublicacioPropia } from '../src/data/supabase/publicacionsPropies.js';
import { appendSectionSubmissionNetworkOnly, loadCoreContent } from '../src/data/supabase/content.js';
import { buildSeedAppData } from '../src/data/supabase/runtime.js';
import { configuraBackendSessio, desaSessio, esborraSessio, usuariDeSessio } from '../src/data/identitat.js';
import { desaRevisioEditorialAmbServidor, revisioEditorial, avisDeLaRevisioEditorial, _reiniciaRevisionsEditorialsPerAProves } from '../src/data/revisionsEditorials.js';
import { desferUltimaRevisioEditorial, historialRevisionsEditorials, restauraVersioEditorial } from '../src/data/historialRevisionsEditorials.js';
import { revisaPaginaSistema } from '../src/data/revisionsEditorialsDelNavegador.js';
import { _reiniciaEdicionsPendentsPerAProves } from '../src/data/edicionsPendents.js';
import { _reiniciaCosturaEdicionsPerAProves, carregaHistorialEditorialServidor, desaPublicacioPropiaAmbFallback, desaRevisioPaginaAmbFallback, sincronitzaEdicionsPendents, edicionsPendents } from '../src/data/costuraEdicions.js';

const uuid = n => `47000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = uuid(1), B = uuid(2), ORG = uuid(3), T = 'ac3bec76-255b-5ca2-8886-28fcceab4267';
const config = { dataMode: 'remote', tenantId: T, supabaseUrl: 'https://rpc.example.test', supabaseAnonKey: 'sb_publishable_fixture' };
let pg, asClient, child, idb, offline, missing, lost, accountAfterCommit, revisionGate;
const calls = [];
const install = (enabled = true) => port.setBackendImplementation({ ...Object.fromEntries(CONTRACTE_NUCLI.map(k => [k, () => null])),
  getCurrentUser: usuariDeSessio, ...(enabled ? { ...revisions, desaPublicacioPropia } : {}) }, true);
const login = actor => { configuraBackendSessio(config); desaSessio({ access_token: actor, user: { id: actor } }); };
const sql = {
  llista_revisions_pagina: ['p_tenant_id','p_section_id','p_slug','p_item_id','p_limit','p_before_version'],
  desa_revisio_pagina: ['p_tenant_id','p_section_id','p_slug','p_item_id','p_payload_jsonb','p_actor_entity_id','p_expected_version','p_operation_id'],
  restaura_revisio_pagina: ['p_tenant_id','p_section_id','p_slug','p_item_id','p_version_num','p_expected_version','p_operation_id'],
  publica_section_submission_beta_cas: ['p_id','p_tenant_id','p_section_id','p_payload','p_title','p_description','p_author_org_id','p_preserve_author','p_expected_updated_at','p_operation_id']
  ,publica_nota_al_mur: ['p_note_id','p_act_id','p_section_id','p_payload','p_expected_revision','p_operation_id']
};
const page = (id = 'descarregues') => ({ id, title: 'Original', content: '<p>Canònic</p>', author_org_id: ORG });
const input = (n, sectionId = 'mur', extra = {}) => ({ id: uuid(n), sectionId, operationId: uuid(n + 10000), expectedUpdatedAt: null,
  payload: { title: 'Títol', content: '<p>Cos</p>', ...extra } });
const rowOf = async id => (await pg.query('select * from public.section_submissions where id=$1', [id])).rows[0];
const revisionCount = async (slug, item = null) => (await pg.query('select count(*)::int n from public.page_revisions where slug is not distinct from $1 and item_id is not distinct from $2', [slug, item])).rows[0].n;

beforeAll(async () => {
  child = fork(`${process.cwd()}/tests/fixtures/r3247-rpc-pglite-child.mjs`, [], { execArgv: [], serialization: 'advanced', stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  let seq = 0; const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    child.once('error', reject); child.once('exit', code => { if (code) reject(Error(`PGlite exit ${code}`)); });
    child.on('message', message => {
      if (message.ready) { resolve(message); return; }
      const handlers = pending.get(message.id); pending.delete(message.id);
      if (!handlers) return;
      if (message.error) handlers.reject(Object.assign(Error(message.error.message), { code: message.error.code })); else handlers.resolve(message.value);
    });
  });
  child.stderr.on('data', text => process.stderr.write(text));
  await ready;
  const invoke = (method, args) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); child.send({ id, method, args }); });
  pg = { query: (...args) => invoke('query', args), close: () => invoke('close', []) };
  asClient = (_pg, ...args) => invoke('asClient', args);
  for (const actor of [A, B]) {
    await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)', [actor, `${actor}@example.invalid`, { full_name: 'Prova', tenant_id: T, accepta_rgpd: true }]);
    await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [T, actor]);
    await pg.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent()) ON CONFLICT DO NOTHING', [actor]);
  }
  await pg.query("INSERT INTO public.organizations(id,tenant_id,slug,name,kind,created_by) VALUES($1,$2,'r3247-prova','Prova','entity',$3)", [ORG, T, A]);
  for (const actor of [A, B]) await pg.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING", [ORG, T, actor, actor === A ? 'owner' : 'admin']);
  await pg.query("INSERT INTO private.ajustos(clau,valor) VALUES('copublicacio_actor_socdepoble',$1) ON CONFLICT(clau) DO UPDATE SET valor=excluded.valor", [ORG]);
}, 120000);
beforeEach(() => {
  _reiniciaEdicionsPendentsPerAProves(); _reiniciaCosturaEdicionsPerAProves(); _reiniciaRevisionsEditorialsPerAProves();
  idb = creaIdbFalsEstructurat(); vi.stubGlobal('indexedDB', idb);
  offline = false; missing = null; lost = null; accountAfterCommit = null; revisionGate = null; calls.length = 0;
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '0');
  login(A); install();
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    if (offline) throw new TypeError('Sense xarxa');
    const name = new URL(url).pathname.split('/').at(-1), actor = options.headers.Authorization.replace('Bearer ', '');
    if (name === 'app_content') {
      calls.push({ name, body: null });
      const authenticated = /^[0-9a-f-]{36}$/i.test(actor);
      const rows = await asClient(pg, { uid: authenticated ? actor : null, role: authenticated ? 'authenticated' : 'anon' }, "select key,payload,version from public.app_content where tenant_id=$1 and key in ('towns','agents')", [T]);
      return new Response(JSON.stringify(rows), { status: 200 });
    }
    const body = JSON.parse(options.body);
    calls.push({ name, body });
    if (!Object.hasOwn(sql, name)) throw Error(`Transport inesperat: ${url}`);
    if (name === missing) return new Response(JSON.stringify({ code: 'PGRST202', message: 'RPC absent' }), { status: 404 });
    if (name === 'llista_revisions_pagina' && revisionGate) await revisionGate(body);
    let ack;
    try {
      const keys = sql[name];
      ack = (await asClient(pg, { uid: actor }, `select public.${name}(${keys.map((_, i) => `$${i + 1}`).join(',')}) as ack`, keys.map(k => body[k])))[0].ack;
    } catch (error) { return new Response(JSON.stringify({ code: error.code, message: error.message }), { status: error.code === '40001' ? 409 : error.code === '42501' ? 403 : 400 }); }
    if (accountAfterCommit === name) { accountAfterCommit = null; login(B); }
    if (lost === name) { lost = null; throw new TypeError('Resposta perduda després del commit'); }
    return new Response(JSON.stringify(ack), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
});
afterAll(async () => { _reiniciaEdicionsPendentsPerAProves(); esborraSessio(); try { await pg?.close(); } finally { child?.kill(); vi.unstubAllGlobals(); } });

test('Sistema: caller existent → port → transport real → SQL; Desfer síncron afegix versió', async () => {
  const first = await desaRevisioEditorialAmbServidor('sistema', page(), { title: 'Revisada' }, { config });
  expect(first).toMatchObject({ desti: 'servidor', versio: 1, persistent: true });
  expect(revisioEditorial('sistema', 'descarregues')).toMatchObject({ title: 'Revisada' });
  const undone = desferUltimaRevisioEditorial('sistema', 'descarregues');
  expect(undone).toMatchObject({ restaurada: true, camps: null });
  expect(undone).not.toBeInstanceOf(Promise);
  expect(await undone.sincronitzacio).toMatchObject({ desti: 'servidor', versio: 2 });
  expect(await revisionCount('descarregues')).toBe(2);
  expect((await carregaHistorialEditorialServidor('sistema', 'descarregues', config)).map(x => x.versio)).toEqual([1, 2]);
  expect(calls.some(x => x.name === 'desa_revisio_pagina')).toBe(true);
});

test.each(['mur', 'mercat', 'events'])('edició pròpia %s: token exacte, owner/signatura i contingut preservats', async section => {
  const n = { mur: 100, mercat: 101, events: 102 }[section];
  const sub = input(n, section);
  const created = await desaPublicacioPropiaAmbFallback(sub, config);
  expect(created).toMatchObject({ desti: 'servidor', versio: 1 });
  const edited = await desaPublicacioPropiaAmbFallback({ ...sub, operationId: uuid(n + 11000), expectedUpdatedAt: created.publicacio.updatedAt,
    payload: { ...sub.payload, content: '<p>Nou</p>' } }, config);
  expect(edited).toMatchObject({ desti: 'servidor', versio: 2 });
  const row = await rowOf(sub.id);
  expect(row.owner_user_id).toBe(A); expect(row.author_org_id).toBeNull(); expect(row.payload.content).toBe('<p>Nou</p>');
  expect(await revisionCount(null, sub.id)).toBe(2);
});

test.each(['calendari','mapa','vehicle','animalets','treball','habitatge'])('vertical %s: conserva fitxa amb dades i estat', async ambit => {
  const n = 200 + ['calendari','mapa','vehicle','animalets','treball','habitatge'].indexOf(ambit);
  const sub = input(n, 'mur', { ambit, estat: 'reservat', dades: { municipi: 'La Torre', contacte: 'Contacte' } });
  const first = await desaPublicacioPropiaAmbFallback(sub, config);
  expect(first.desti).toBe('servidor');
  const before = (await rowOf(sub.id)).payload;
  const next = await desaPublicacioPropiaAmbFallback({ ...sub, operationId: uuid(n + 12000), expectedUpdatedAt: first.publicacio.updatedAt, payload: { ...before, content: '<p>Editada</p>' } }, config);
  expect(next.desti).toBe('servidor');
  const after = (await rowOf(sub.id)).payload;
  expect(after.ambit).toBe(before.ambit); expect(after.dades).toEqual(before.dades); expect(after.estat).toBe('reservat');
});

test('entitat: una coadministradora edita mantenint creadora i author_org_id', async () => {
  const sub = { ...input(300), actor: { tipus: 'entitat', id: ORG } };
  const first = await desaPublicacioPropiaAmbFallback(sub, config);
  login(B); _reiniciaCosturaEdicionsPerAProves();
  const next = await desaPublicacioPropiaAmbFallback({ ...sub, expectedUpdatedAt: first.publicacio.updatedAt, operationId: uuid(11300), payload: { content: 'Coadministrada' } }, config);
  expect(next).toMatchObject({ desti: 'servidor', publicacio: { ownerUserId: A, authorOrgId: ORG } });
});

test('events: caller editorial existent edita fila pròpia i manté fitxa calendari', async () => {
  const sub = input(301, 'events', { date: '2026-12-01', location: 'Plaça' });
  const first = await desaPublicacioPropiaAmbFallback(sub, config);
  const result = await desaRevisioEditorialAmbServidor('events', { ...sub.payload, id: sub.id, updated_at: first.publicacio.updatedAt }, { title: 'Acte nou' }, { config });
  expect(result.desti).toBe('servidor'); expect((await rowOf(sub.id)).payload).toMatchObject({ title: 'Acte nou', date: '2026-12-01', location: 'Plaça' });
});

test('offline durable: reobertura conserva UUID i precondició; el replay només aplica una vegada', async () => {
  offline = true; const sub = input(400);
  const first = await desaPublicacioPropiaAmbFallback(sub, config);
  expect(first).toMatchObject({ desti: 'navegador', pendent: true, persistent: true });
  expect(await rowOf(sub.id)).toBeUndefined();
  _reiniciaEdicionsPendentsPerAProves(); _reiniciaCosturaEdicionsPerAProves(); offline = false;
  expect((await edicionsPendents(config)).entries[0].input.submission).toMatchObject({ operationId: sub.operationId, expectedUpdatedAt: null });
  expect(await sincronitzaEdicionsPendents(config)).toMatchObject([{ desti: 'servidor', versio: 1 }]);
  expect(await sincronitzaEdicionsPendents(config)).toEqual([]);
  expect(await revisionCount(null, sub.id)).toBe(1);
});

test('cap sessió, mode local, capacitat absent i altre compte/tenant no envien el diari alié', async () => {
  esborraSessio(); const sub = input(401);
  expect(await desaPublicacioPropiaAmbFallback(sub, config)).toMatchObject({ desti: 'navegador', motiu: 'sense-sessio' });
  login(B); expect(await sincronitzaEdicionsPendents(config)).toEqual([]);
  login(A); expect(await sincronitzaEdicionsPendents(config)).toEqual([]);
  expect(await sincronitzaEdicionsPendents({ ...config, tenantId: uuid(999) })).toEqual([]);
  expect(await desaPublicacioPropiaAmbFallback(input(402), { ...config, dataMode: 'local' })).toMatchObject({ motiu: 'mode-navegador' });
  install(false); expect(await desaPublicacioPropiaAmbFallback(input(403), config)).toMatchObject({ motiu: 'sense-rpc' });
  expect(calls).toEqual([]); install();
  expect(await sincronitzaEdicionsPendents(config)).toMatchObject([{ desti: 'servidor' }]);
});

test.each(['publica_section_submission_beta_cas', 'desa_revisio_pagina'])('commit amb ACK perdut en %s: mateix UUID, cap duplicat', async rpc => {
  const n = rpc === 'desa_revisio_pagina' ? 501 : 500, sub = input(n); lost = rpc;
  const first = await desaPublicacioPropiaAmbFallback(sub, config);
  expect(first.desti).toBe('navegador');
  expect((await rowOf(sub.id)).id).toBe(sub.id);
  expect(await sincronitzaEdicionsPendents(config)).toMatchObject([{ desti: 'servidor', versio: 1 }]);
  expect(await revisionCount(null, sub.id)).toBe(1);
  const attempts = calls.filter(x => x.name === rpc);
  expect(attempts).toHaveLength(2); expect(attempts[0].body).toEqual(attempts[1].body);
});

test('409 propi explícit conserva exactament l’intent; no rebase ni upsert silenciós', async () => {
  const sub = input(600), created = await desaPublicacioPropiaAmbFallback(sub, config);
  _reiniciaCosturaEdicionsPerAProves();
  await desaPublicacioPropia({ ...sub, operationId: uuid(16001), expectedUpdatedAt: created.publicacio.updatedAt, payload: { title: 'Servidor guanyador' } }, config);
  const local = { ...sub, operationId: uuid(16002), expectedUpdatedAt: created.publicacio.updatedAt, payload: { title: 'Esborrany perdedor' } };
  expect(await desaPublicacioPropiaAmbFallback(local, config)).toMatchObject({ status: 409, motiu: 'conflicte-versio' });
  const saved = (await edicionsPendents(config)).entries.find(x => x.operationId === local.operationId);
  expect(saved.input.submission).toEqual(local); expect(saved.status).toBe('conflicte');
  expect((await rowOf(sub.id)).payload.title).toBe('Servidor guanyador');
  const count = calls.length; await sincronitzaEdicionsPendents(config); expect(calls.length).toBe(count);
});

test('dues escriptures directes amb el mateix token tenen un sol guanyador 409', async () => {
  const sub = input(601), created = await desaPublicacioPropia(sub, config);
  const results = await Promise.allSettled([1, 2].map(n => desaPublicacioPropia({ ...sub, operationId: uuid(16100 + n), expectedUpdatedAt: created.updatedAt, payload: { title: `Intent ${n}` } }, config)));
  expect(results.filter(x => x.status === 'fulfilled')).toHaveLength(1);
  expect(results.find(x => x.status === 'rejected').reason).toMatchObject({ code: 'conflicte-versio', status: 409 });
});

test('canvi A→B després de commit: ACK tardà no confirma ni reproduïx amb B', async () => {
  accountAfterCommit = 'publica_section_submission_beta_cas'; const sub = input(700);
  expect(await desaPublicacioPropiaAmbFallback(sub, config)).toMatchObject({ motiu: 'avortada', desti: 'navegador' });
  expect(await sincronitzaEdicionsPendents(config)).toEqual([]);
  login(A); expect(await sincronitzaEdicionsPendents(config)).toMatchObject([{ desti: 'servidor' }]);
  expect((await rowOf(sub.id)).owner_user_id).toBe(A); expect(await revisionCount(null, sub.id)).toBe(1);
});

test('RPC absent conserva etapa pendent i no usa mai taula directa; IDB indisponible ho diu', async () => {
  missing = 'desa_revisio_pagina'; const sub = input(701);
  expect(await desaPublicacioPropiaAmbFallback(sub, config)).toMatchObject({ desti: 'navegador', motiu: 'no-disponible', publicacio: { id: sub.id } });
  const edits = calls.filter(x => x.name === 'publica_section_submission_beta_cas').length;
  missing = null; await sincronitzaEdicionsPendents(config);
  expect(calls.filter(x => x.name === 'publica_section_submission_beta_cas')).toHaveLength(edits);
  _reiniciaEdicionsPendentsPerAProves(); _reiniciaCosturaEdicionsPerAProves(); vi.stubGlobal('indexedDB', undefined); offline = true;
  const failure = await desaPublicacioPropiaAmbFallback(input(702), config);
  expect(failure).toMatchObject({ desada: false, persistent: false, motiu: 'sense-persistencia', desti: 'navegador' });
  expect(avisDeLaRevisioEditorial(failure)).toContain('Conserva o exporta');
  _reiniciaEdicionsPendentsPerAProves(); expect((await edicionsPendents(config)).entries).toEqual([]);
});

test.each(['mur','mercat'])('caller real Notes → CAS nota %s → diari d’historial; consulta recupera tall de commit', async sectionId => {
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1');
  const n = sectionId === 'mur' ? 800 : 801, noteId = uuid(n + 1000);
  await pg.query('insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,$4,$5)', [noteId,T,A,'Nota','<p>Privat</p>']);
  const sub = { ...input(n, sectionId, { ambit: sectionId === 'mur' ? 'treball' : 'mercat', estat: 'reservat', dades: { contacte: 'Contacte', preu: '12' } }), noteId, expectedNoteRevision: 1 };
  delete sub.expectedUpdatedAt;
  // El tall deixa Notes amb un ACK però sense historial al servidor.
  missing = 'desa_revisio_pagina';
  const first = await appendSectionSubmissionNetworkOnly(sub, config);
  expect(first).toMatchObject({ historial: { pendent: true, desti: 'navegador' } });
  expect(first.publicacio.payload.content).toBe('<p>Cos</p>');
  expect(await revisionCount(null, sub.id)).toBe(0);
  expect(calls.filter(x => x.name === 'publica_section_submission_beta_cas')).toHaveLength(0);
  _reiniciaEdicionsPendentsPerAProves(); _reiniciaCosturaEdicionsPerAProves();
  missing = null;
  const replay = await appendSectionSubmissionNetworkOnly({ id: sub.id, sectionId, noteId, expectedNoteRevision: 1, operationId: sub.operationId, consulta: true }, config);
  expect(replay).toMatchObject({ replay: true, historial: { desti: 'servidor', versio: 1 } });
  expect(await revisionCount(null, sub.id)).toBe(1);
  expect((await rowOf(sub.id)).payload).toMatchObject({ ambit: sub.payload.ambit, estat: 'reservat' });
  expect(calls.filter(x => x.name === 'publica_section_submission_beta_cas')).toHaveLength(0);
});

test('pàgina oberta sense token: divergència remota dóna 409 i conserva el text local', async () => {
  await revisions.desaRevisioPagina({ seccio: 'sistema', id: 'legal', camps: { title: 'Remota' }, versio: 0, operationId: uuid(19000), actorEntityId: ORG }, config);
  const result = await desaRevisioEditorialAmbServidor('sistema', page('legal'), { title: 'Local pendent' }, { config });
  expect(result).toMatchObject({ status: 409, motiu: 'conflicte-versio', desti: 'navegador' });
  expect(revisioEditorial('sistema', 'legal').title).toBe('Local pendent'); expect(await revisionCount('legal')).toBe(1);
});

test('dos intents del servei amb el mateix token no es rebasen; captura abans del primer await', async () => {
  const sub = input(900), first = await desaPublicacioPropia(sub, config);
  const left = { ...sub, operationId: uuid(19100), expectedUpdatedAt: first.updatedAt, payload: { title: 'Capturada' } };
  const right = { ...left, operationId: uuid(19101), payload: { title: 'Concurrent' } };
  const l = desaPublicacioPropiaAmbFallback(left, config), r = desaPublicacioPropiaAmbFallback(right, config);
  left.payload.title = 'Mutació tardana';
  const results = await Promise.all([l, r]);
  expect(results.filter(x => x.desti === 'servidor')).toHaveLength(1);
  expect(results.find(x => x.desti !== 'servidor')).toMatchObject({ status: 409, motiu: 'conflicte-versio' });
  expect((await rowOf(sub.id)).payload.title).toBe('Capturada');
  expect((await edicionsPendents(config)).entries.find(x => x.operationId === left.operationId).input.submission.payload.title).toBe('Capturada');
});

test('reintentar el mateix intent conserva l’UUID d’historial i no torna a publicar', async () => {
  const sub = input(901), first = await desaPublicacioPropiaAmbFallback(sub, config);
  expect(first.desti).toBe('servidor'); const count = calls.length;
  const replay = await desaPublicacioPropiaAmbFallback(sub, config);
  expect(replay).toMatchObject({ desti: 'servidor', versio: 1 }); expect(calls.length).toBe(count);
});

test('quota IDB: el resultat i l’avís no afirmen una còpia durable; la recàrrega ho evidencia', async () => {
  idb.omplit = true; offline = true;
  const sub = input(902, 'mur', { ambit: 'treball', estat: 'reservat', dades: { contacte: 'Text que cal conservar' } });
  const result = await desaPublicacioPropiaAmbFallback(sub, config);
  expect(result).toMatchObject({ desada: false, persistent: false, motiu: 'sense-persistencia' });
  expect(avisDeLaRevisioEditorial(result)).toContain('ni confirmar-la al servidor');
  expect((await edicionsPendents(config)).entries[0].input.submission).toEqual(sub);
  _reiniciaEdicionsPendentsPerAProves(); idb.omplit = false;
  expect((await edicionsPendents(config)).entries).toEqual([]);
});

test('diari malformat falla tancat abans del transport i conserva la fila corrupta', async () => {
  offline = true; await desaPublicacioPropiaAmbFallback(input(903), config);
  const stored = idb.files('sdp-rural-v1', 'estat')[0];
  _reiniciaEdicionsPendentsPerAProves();
  const broken = { revision: stored.valor.revision + 1, entries: [{ operationId: 'incorrecta' }] };
  await new Promise((resolve, reject) => {
    const open = idb.open('sdp-rural-v1', 1);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('estat', 'readwrite');
      tx.objectStore('estat').put(broken, stored.clau);
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
    }; open.onerror = () => reject(open.error);
  });
  offline = false; const count = calls.length;
  await expect(sincronitzaEdicionsPendents(config)).rejects.toMatchObject({ code: 'diari-invalid' });
  expect(calls.length).toBe(count); expect(idb.files('sdp-rural-v1', 'estat')[0].valor).toEqual(broken);
});

async function remotePage(id, camps, n) {
  const rows = await revisions.llistaRevisionsPagina({ seccio: 'sistema', id, limit: 1 }, config);
  return revisions.desaRevisioPagina({ seccio: 'sistema', id, camps, versio: rows[0]?.versio ?? 0, actorEntityId: ORG, operationId: uuid(n) }, config);
}

test('dispositiu nou: loadCoreContent hidrata pàgina real amb html, versió i widgets canònics intactes', async () => {
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1');
  const original = (await buildSeedAppData(A)).pages.find(x => x.id === 'descarregues');
  expect(typeof original.html).toBe('string'); expect(original.html.length).toBeGreaterThan(100);
  const remote = await remotePage('descarregues', { title: 'Nova remota', content: '<p>Nou dispositiu</p>' }, 19200);
  const core = await loadCoreContent(A, config), hydrated = core.pages.find(x => x.id === 'descarregues');
  expect(hydrated).toMatchObject({ title: 'Nova remota', html: '<p>Nou dispositiu</p>', _paginaVersio: remote.versio });
  expect(core.pages.length).toBe((await buildSeedAppData(A)).pages.length);
  for (const [key, value] of Object.entries(original)) if (!['title','html','content','author_org_id'].includes(key)) expect(hydrated[key]).toEqual(value);
  expect(revisaPaginaSistema('descarregues', hydrated)).toBe(hydrated);
  expect(historialRevisionsEditorials('sistema', 'descarregues').at(-1).versio).toBe(remote.versio);
  const next = await desaRevisioEditorialAmbServidor('sistema', hydrated, { content: '<p>Següent</p>' }, { config });
  expect(next).toMatchObject({ desti: 'servidor', versio: remote.versio + 1 });
  expect(await desaRevisioEditorialAmbServidor('sistema', hydrated, { content: '<p>Segona desada del mateix editor</p>' }, { config })).toMatchObject({ desti: 'servidor', versio: remote.versio + 2 });
});

test('Sistema realhtml: Desfer original recupera el cos al servidor, i el nou dispositiu el llig', async () => {
  const base = { id: 'consola', title: 'Original html', html: '<p>Original en html</p>', author_org_id: ORG };
  expect(await desaRevisioEditorialAmbServidor('sistema', base, { content: '<p>Editada</p>' }, { config })).toMatchObject({ desti: 'servidor' });
  const undo = desferUltimaRevisioEditorial('sistema', base.id);
  expect(await undo.sincronitzacio).toMatchObject({ desti: 'servidor', versio: 2 });
  expect((await revisions.llistaRevisionsPagina({ seccio: 'sistema', id: base.id, limit: 1 }, config))[0].camps.content).toBe('<p>Original en html</p>');
  _reiniciaRevisionsEditorialsPerAProves(); _reiniciaCosturaEdicionsPerAProves(); vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1');
  expect((await loadCoreContent(A, config)).pages.find(x => x.id === base.id).html).toBe('<p>Original en html</p>');
});

test('hidratació respecta esborrany creat en vol i no persistix historial privat al registre global', async () => {
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1');
  await remotePage('descarregues', { title: 'Remota nova', content: '<p>Remota nova</p>' }, 19201);
  let release, reached;
  const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
  revisionGate = async body => { if (body.p_slug === 'descarregues') { revisionGate = null; reached(); await wait; } };
  const loading = loadCoreContent(A, config); await started;
  await desaRevisioEditorialAmbServidor('sistema', page(), { content: '<p>Esborrany viu</p>' }, { config: { ...config, dataMode: 'local' } });
  release(); const core = await loading, hydrated = core.pages.find(x => x.id === 'descarregues');
  expect(hydrated.html).toBe('<p>Remota nova</p>'); expect(revisaPaginaSistema('descarregues', hydrated).html).toBe('<p>Esborrany viu</p>');
  const historyKey = 'sdp_embed_publicacions.revisions.historial.v1';
  expect(window.localStorage.getItem(historyKey)).not.toContain('Remota nova');
});

test('historial remot lligat a sessió: després d’A→B desapareix, sense tocar registres locals', async () => {
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1');
  await loadCoreContent(A, config);
  expect(historialRevisionsEditorials('sistema', 'descarregues').length).toBeGreaterThan(0);
  expect(window.localStorage.getItem('sdp_embed_publicacions.revisions.historial.v1')).toBe('{}');
  login(B);
  expect(historialRevisionsEditorials('sistema', 'descarregues')).toEqual([]);
});

test('restaurar una versió remota des del nou dispositiu usa RPC append-only amb restored_from', async () => {
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1'); await loadCoreContent(A, config);
  const rows = historialRevisionsEditorials('sistema', 'descarregues'), target = rows.at(-2), before = rows.at(-1).versio;
  const restored = restauraVersioEditorial('sistema', 'descarregues', target.versio);
  expect(await restored.sincronitzacio).toMatchObject({ desti: 'servidor', versio: before + 1 });
  const latest = (await revisions.llistaRevisionsPagina({ seccio: 'sistema', id: 'descarregues', limit: 1 }, config))[0];
  expect(latest.restauradaDe).toBe(target.versio); expect(latest.camps).toEqual(target.campsNous);
});

test('lectura tardana A→B s’avorta; flags/capacitat/sessió absents no fan lectures de revisions', async () => {
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1');
  let release, reached;
  const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
  revisionGate = async () => { revisionGate = null; reached(); await wait; };
  const loading = loadCoreContent(A, config); await started; login(B); release();
  await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
  calls.length = 0; install(false); await loadCoreContent(B, config);
  expect(calls.filter(x => x.name === 'llista_revisions_pagina')).toEqual([]);
  install(); esborraSessio(); calls.length = 0; await loadCoreContent(null, config);
  expect(calls.filter(x => x.name === 'llista_revisions_pagina')).toEqual([]);
});

test('API directa de pàgina: dos intents amb el mateix token explícit donen 409 sense continuar l’editor', async () => {
  vi.stubEnv('VITE_SDP_REVISIONS_PAGINES', '1');
  const item = (await loadCoreContent(A, config)).pages.find(x => x.id === 'descarregues');
  expect(await desaRevisioPaginaAmbFallback('sistema', item, { content: 'Primer intent directe' }, config)).toMatchObject({ desti: 'servidor' });
  expect(await desaRevisioPaginaAmbFallback('sistema', item, { content: 'Segon intent directe' }, config)).toMatchObject({ status: 409, motiu: 'conflicte-versio' });
});

test('actor omés conserva signatura d’entitat de l’ACK tant en fila com en historial', async () => {
  const sub = { ...input(904), actor: { tipus: 'entitat', id: ORG } };
  const first = await desaPublicacioPropiaAmbFallback(sub, config); login(B);
  const next = await desaPublicacioPropiaAmbFallback({ id: sub.id, sectionId: 'mur', operationId: uuid(19300), expectedUpdatedAt: first.publicacio.updatedAt, payload: { content: 'Preserva l’entitat' } }, config);
  expect(next).toMatchObject({ desti: 'servidor', publicacio: { ownerUserId: A, authorOrgId: ORG } });
  expect((await revisions.llistaRevisionsPagina({ seccio: 'mur', id: sub.id, limit: 1 }, config))[0].actorEntityId).toBe(ORG);
});
