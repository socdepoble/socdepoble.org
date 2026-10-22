// Executar manualment: node tests/xat-multimedia-postgres.audit.mjs
// Gauntlet 261022_0225 (crítica Claude) · Dos camins, i l'eixida diu quin ha corregut:
//  · real: storage-api i supabase/postgres de veres (si les dues imatges ja són
//    locals), en una xarxa Docker interna. La pujada, la signatura i la baixada
//    passen per l'API HTTP de Storage amb el JWT de cada persona.
//  · fixture: postgres:15 amb storage.objects de taula. La sonda de permisos i
//    l'escriptura final de Storage s'emulen en SQL; l'API HTTP NO s'exercita.
// Sense ports publicats, volums de l'amfitrió ni descàrregues (--pull=never).
// SDP_AUDIT_CAMI=real|fixture força un camí; SDP_AUDIT_PREFIX, el nom dels contenidors.
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const IMATGE_PG = 'public.ecr.aws/supabase/postgres:17.11.0.004';
const IMATGE_STORAGE = 'public.ecr.aws/supabase/storage-api:v1.79.36';
const prefix = `${process.env.SDP_AUDIT_PREFIX || 'sdp-xat-media-test'}-${process.pid}`;
const xarxa = `${prefix}-net`, pg = `${prefix}-pg`, st = `${prefix}-storage`;
const docker = (...args) => spawnSync('docker', args, { encoding: 'utf8' });
const teImatge = (img) => docker('image', 'inspect', img).status === 0;
if (docker('version', '--format', '{{.Server.Version}}').status !== 0) {
  console.error('NO EXECUTADA: Docker no respon. Cap comprovació ha corregut.');
  process.exit(2);
}
const cami = process.env.SDP_AUDIT_CAMI || (teImatge(IMATGE_PG) && teImatge(IMATGE_STORAGE) ? 'real' : 'fixture');
const real = cami === 'real';
const superusuari = real ? 'supabase_admin' : 'postgres';
let passades = 0;
const pass = (text) => { passades++; console.log(`PASS [${cami}] ${text}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const psqlArgs = (usuari) => ['exec', '-i', pg, 'psql', '-U', usuari, '-h', 'localhost', '-d', 'postgres', '-At', '-q', '-v', 'ON_ERROR_STOP=1'];
const sql = (text, { ok = true, com = superusuari } = {}) => {
  const r = spawnSync('docker', psqlArgs(com), { input: text, encoding: 'utf8' });
  if (ok) assert.equal(r.status, 0, r.stderr);
  return r;
};
const asyncSql = (text) => new Promise((resolve) => {
  const p = spawn('docker', psqlArgs(superusuari));
  let out = '', err = '';
  p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
  p.on('exit', (status) => resolve({ status, out, err })); p.stdin.end(text);
});
const ultima = (r) => r.stdout.trim().split('\n').at(-1);
// Revisió R1 · Toca storage.objects sense el disparador d'escriptura final, com
// una escriptura que se n'escapara: així es prova la segona barrera (la publicació).
const senseDisparador = (cos) => sql(`begin;set local session_replication_role = replica;${cos}commit;`);
const U = (n) => `10000000-0000-4000-8000-00000000000${n}`;
const F = (n) => `30000000-0000-4000-8000-00000000000${n}`;
const ID = (n) => `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const com = (n) => `set local role authenticated; set local request.jwt.claim.sub='${U(n)}';`;
const coma = (n, cos) => `begin;${com(n)}${cos}commit;`;
const reserva = (n, id, bytes, mime = 'image/webp', fil = 1, durada = null) =>
  sql(coma(n, `select xat_reserva_adjunt('${ID(id)}','${F(fil)}',${bytes},'${mime}',${durada ?? 'null'});`), { ok: false });
const usats = (n) => Number(ultima(sql(coma(n, "select xat_quota()->>'usats';"))));

// ── Camí real: JWT HS256 amb un secret d'esta execució i HTTP des del contenidor de Storage.
const secret = randomBytes(32).toString('hex');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (payload) => {
  const ara = Math.floor(Date.now() / 1000);
  const cap = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ iat: ara, exp: ara + 3600, ...payload })}`;
  return `${cap}.${createHmac('sha256', secret).update(cap).digest('base64url')}`;
};
const token = (n) => (n === 'anon' ? jwt({ role: 'anon' }) : jwt({ role: 'authenticated', aud: 'authenticated', sub: U(n) }));
function http(peticions) {
  const codi = `const q=${JSON.stringify(peticions)};(async()=>{const o=[];for(const p of q){if(p.path==='@signat'&&!o.at(-1)?.json?.signedURL){o.push({status:0});continue;}const h={...p.headers};let body;if(p.bytes!=null)body=Buffer.alloc(p.bytes,7);if(p.json){body=JSON.stringify(p.json);h['content-type']='application/json';}
const r=await fetch('http://127.0.0.1:5000'+(p.path==='@signat'?o.at(-1).json.signedURL:p.path),{method:p.method||'GET',headers:h,body});const b=Buffer.from(await r.arrayBuffer());let j=null;try{j=JSON.parse(b)}catch{}o.push({status:r.status,len:b.length,json:j});}process.stdout.write(JSON.stringify(o));})().catch(e=>process.stdout.write(JSON.stringify([{error:String(e)}])));`;
  const r = spawnSync('docker', ['exec', '-i', st, 'node', '-'], { input: codi, encoding: 'utf8', maxBuffer: 1 << 20 });
  return JSON.parse(r.stdout || '[{"error":"sense eixida"}]');
}
// storage-api respon 400 i porta l'estat real dins del cos (statusCode).
const estat = (r) => (r.json?.statusCode ? Number(r.json.statusCode) : r.status);

// ── Les tres operacions de Storage, iguals per als dos camins.
// Fixture: la sonda (INSERT com a authenticated, desfet) i l'escriptura final com a superusuari.
function sondaFixture(n, id, mime, bytes) {
  const sonda = sql(`begin;${n === 'anon' ? 'set local role anon;' : com(n)}set local storage.operation='storage.object.upload';
insert into storage.objects(bucket_id,name,owner_id,version,metadata) values('xat_adjunts','${ID(id)}','${n === 'anon' ? '' : U(n)}','sonda','{"mimetype":"${mime}","contentLength":${bytes}}');rollback;`, { ok: false });
  return sonda.status === 0 ? 0 : /row-level security/.test(sonda.stderr) ? 403 : 500;
}
function finalFixture(n, id, mime, bytes) {
  const final = sql(`insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('xat_adjunts','${ID(id)}','${U(n)}','${U(n)}',gen_random_uuid()::text,'{"size":${bytes},"mimetype":"${mime}"}');`, { ok: false });
  return final.status === 0 ? 200 : /duplicate key/.test(final.stderr) ? 409 : 500;
}
function puja(n, id, mime, bytes, { upsert = false } = {}) {
  if (real) {
    const r = http([{ method: 'POST', path: `/object/xat_adjunts/${ID(id)}`, bytes,
      headers: { authorization: `Bearer ${token(n)}`, 'content-type': mime, 'x-upsert': String(upsert) } }])[0];
    return estat(r);
  }
  return sondaFixture(n, id, mime, bytes) || finalFixture(n, id, mime, bytes);
}
// Revisió R1 · La reserva es cancel·la quan la sonda ja ha passat i els bytes
// encara arriben (real: POST lent, 20 trossos en 3 s; fixture: entre la sonda
// i l'escriptura final). Torna la resposta de xat_cancella_reserva i l'estat.
async function pujaICancella(n, id, mime, bytes) {
  const cancella = () => ultima(sql(coma(n, `select xat_cancella_reserva('${ID(id)}');`)));
  if (!real) {
    assert.equal(sondaFixture(n, id, mime, bytes), 0, 'la sonda havia de passar');
    const resposta = cancella();
    return { cancella: resposta, estat: finalFixture(n, id, mime, bytes) };
  }
  const codi = `const http=require('http');const N=${bytes},K=20,T=3000,tros=Math.ceil(N/K);let i=0;
const req=http.request({host:'127.0.0.1',port:5000,method:'POST',path:'/object/xat_adjunts/${ID(id)}',headers:{authorization:'Bearer ${token(n)}','content-type':'${mime}','content-length':N,'x-upsert':'false'}},(r)=>{let b='';r.on('data',(d)=>{b+=d;});r.on('end',()=>process.stdout.write(JSON.stringify({status:r.statusCode,body:b.slice(0,300)})));});
req.on('error',(e)=>process.stdout.write(JSON.stringify({status:0,body:String(e)})));
const pas=()=>{if(i>=K){req.end();return;}req.write(Buffer.alloc(Math.min(tros,N-i*tros),7));i++;setTimeout(pas,T/K);};pas();`;
  const enCurs = new Promise((resolve) => {
    const p = spawn('docker', ['exec', '-i', st, 'node', '-']);
    let out = ''; p.stdout.on('data', (d) => { out += d; }); p.on('exit', () => resolve(out)); p.stdin.end(codi);
  });
  await wait(1200);
  const resposta = cancella();
  const r = JSON.parse((await enCurs) || '{"status":0}');
  let cos = null; try { cos = JSON.parse(r.body); } catch { /* cos no JSON */ }
  return { cancella: resposta, estat: cos?.statusCode ? Number(cos.statusCode) : r.status };
}
function llig(n, id) {
  if (real) {
    const [signa, baixa] = http([{ method: 'POST', path: `/object/sign/xat_adjunts/${ID(id)}`, json: { expiresIn: 60 }, headers: { authorization: `Bearer ${token(n)}` } }]
      .concat(n === 'anon' ? [] : [{ path: '@signat' }]));
    if (estat(signa) !== 200) return { estat: estat(signa) };
    return { estat: baixa.status, bytes: baixa.len };
  }
  const r = sql(`begin;${n === 'anon' ? 'set local role anon;' : com(n)}select count(*) from storage.objects where bucket_id='xat_adjunts' and name='${ID(id)}';commit;`);
  return ultima(r) === '1' ? { estat: 200 } : { estat: 404 };
}
function esborra(n, id) {
  if (real) {
    const r = http([{ method: 'DELETE', path: '/object/xat_adjunts', json: { prefixes: [ID(id)] }, headers: { authorization: `Bearer ${token(n)}` } }])[0];
    return Array.isArray(r.json) ? r.json.length : -1;
  }
  return Number(ultima(sql(`begin;${com(n)}with d as (delete from storage.objects where bucket_id='xat_adjunts' and name='${ID(id)}' returning 1) select count(*) from d;commit;`)));
}

async function arrancaReal() {
  assert.equal(docker('network', 'create', '--internal', xarxa).status, 0, 'xarxa interna');
  const p = docker('run', '-d', '--pull=never', '--name', pg, '--network', xarxa, '-e', 'POSTGRES_PASSWORD=postgres', '-e', `JWT_SECRET=${secret}`, IMATGE_PG);
  assert.equal(p.status, 0, p.stderr);
  for (let i = 0; i < 120; i++) { if (sql("alter role supabase_storage_admin with password 'postgres';", { ok: false }).status === 0) break; await wait(500); }
  const s = docker('run', '-d', '--pull=never', '--name', st, '--network', xarxa,
    '-e', 'STORAGE_BACKEND=file', '-e', 'FILE_STORAGE_BACKEND_PATH=/tmp/storage', '-e', 'TENANT_ID=stub', '-e', 'REGION=local', '-e', 'GLOBAL_S3_BUCKET=stub',
    '-e', `AUTH_JWT_SECRET=${secret}`, '-e', `PGRST_JWT_SECRET=${secret}`, '-e', `ANON_KEY=${token('anon')}`, '-e', `SERVICE_KEY=${jwt({ role: 'service_role' })}`,
    '-e', `DATABASE_URL=postgresql://supabase_storage_admin:postgres@${pg}:5432/postgres`, '-e', 'FILE_SIZE_LIMIT=52428800',
    '-e', 'UPLOAD_FILE_SIZE_LIMIT=52428800', '-e', 'UPLOAD_FILE_SIZE_LIMIT_STANDARD=52428800', '-e', 'ENABLE_IMAGE_TRANSFORMATION=false', IMATGE_STORAGE);
  assert.equal(s.status, 0, s.stderr);
  for (let i = 0; i < 120; i++) {
    if (docker('exec', st, 'node', '-e', "fetch('http://127.0.0.1:5000/status').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))").status === 0) return;
    await wait(500);
  }
  assert.fail(`storage-api no arranca: ${docker('logs', '--tail', '20', st).stderr}`);
}
async function arrancaFixture() {
  const r = docker('run', '--rm', '-d', '--pull=never', '--network', 'none', '--name', pg, '-e', 'POSTGRES_PASSWORD=fixture-only', 'postgres:15');
  assert.equal(r.status, 0, r.stderr);
  for (let i = 0; i < 60; i++) { if (docker('exec', pg, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres').status === 0) break; await wait(250); }
  await wait(500);
}
const CADENA = ['2609080100_xat_v2.sql', '2609080200_xat_v2_correccions.sql', '2609270200_xat_f0_fonament.sql', '2609272200_xat_entitats.sql', '2610081543_xat_consentiment_i_metadades.sql'];
// La cua canònica de 2609261500, tal qual.
const PURGA = `create table if not exists private.purga_storage_pendent (id bigint generated always as identity primary key,
  user_id uuid not null, bucket_id text not null, nom text not null, referenciat boolean not null default false,
  creat_al timestamptz not null default now(), feta_al timestamptz, unique (bucket_id, nom));
revoke all on table private.purga_storage_pendent from public, anon, authenticated;`;
// Fixture: les columnes i l'ajuda de storage.objects que usa la migració (storage-api v1.79.36).
const STORAGE_FIXTURE = `create role service_role nologin bypassrls; create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid,owner_id text,
  version text,metadata jsonb,created_at timestamptz default now(),updated_at timestamptz default now(),unique(bucket_id,name));
create function storage.operation() returns text language sql stable as $$ select current_setting('storage.operation', true) $$;
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;`;

try {
  console.log(real
    ? `CAMÍ: real · ${IMATGE_STORAGE} + ${IMATGE_PG}, xarxa interna ${xarxa}; HTTP de Storage amb el JWT de cada persona.`
    : 'CAMÍ: fixture · postgres:15, storage.objects és una taula; la sonda i l\'escriptura final s\'emulen en SQL. L\'API HTTP de Storage NO s\'exercita.');
  if (real) await arrancaReal(); else await arrancaFixture();
  if (real) {
    sql('create extension if not exists pg_cron; grant usage on schema cron to postgres; grant all on all tables in schema cron to postgres;');
    sql(readFileSync('tests/fixtures/xat-entitats/bootstrap-supabase.sql', 'utf8'), { com: 'postgres' });
  } else {
    sql(readFileSync('tests/fixtures/xat-entitats/bootstrap.sql', 'utf8'));
    sql(STORAGE_FIXTURE);
  }
  sql('create publication supabase_realtime;', { ok: false });
  for (const f of CADENA) sql(readFileSync(`supabase/migrations/${f}`, 'utf8'), { com: 'postgres' });
  sql(PURGA, { com: 'postgres' });
  // La migració, com l'aplicaria el Mestre: rol postgres, una sola transacció.
  sql(readFileSync('supabase/migrations/2610220240_xat_adjunts_i_quota.sql', 'utf8'), { com: 'postgres' });
  pass('la migració s\'aplica com a postgres');
  if (real) {
    assert.equal(ultima(sql("select count(*) from cron.job where jobname='sdp-neteja-xat-adjunts';")), '1');
    pass('pg_cron actiu: la neteja queda programada (sdp-neteja-xat-adjunts)');
  }
  sql(readFileSync('tests/fixtures/xat-entitats/media-regression.sql', 'utf8'));
  pass('media-regression.sql: idempotència, sostre per tipus, sonda, finestra de 15 minuts, cua de purga, pendents i freqüència, permisos');

  // F1 · reserva → pujada → publicació, i lectura de participant, de fora i anon.
  assert.match(reserva(1, 1, 1000).stdout, /"pujat": false/);
  assert.equal(puja(1, 1, 'image/webp', 1000), 200);
  assert.match(reserva(1, 1, 1000).stdout, /"pujat": true/);
  assert.equal(ultima(sql(`select metadata->>'size'||'|'||(metadata->>'mimetype')||'|'||owner_id from storage.objects where name='${ID(1)}';`)), `1000|image/webp|${U(1)}`);
  const pub = JSON.parse(ultima(sql(coma(1, `select xat_publica_adjunt('${ID(1)}', '  ');`))));
  assert.equal(pub.tipus, 'imatge'); assert.equal(pub.cos, null);
  assert.equal(JSON.parse(ultima(sql(coma(1, `select xat_publica_adjunt('${ID(1)}', null);`)))).seq, pub.seq);
  pass(`reserva, ${real ? 'POST de Storage amb el JWT' : 'sonda i escriptura final emulades'}, publicació idempotent; sense peu, text null (F13)`);
  const lectura = llig(2, 1);
  assert.equal(lectura.estat, 200); if (real) assert.equal(lectura.bytes, 1000);
  assert.equal(llig(3, 1).estat, 404);
  assert.equal(llig('anon', 1).estat, 404);
  assert.match(sql(coma(3, `select xat_llegix_adjunt('${ID(1)}');`), { ok: false }).stderr, /SDP-XAT-006/);
  pass(real ? 'participant: signatura i baixada 200 (1000 bytes); de fora i anon: 404' : 'participant veu l\'objecte; de fora i anon, no');
  // Revisió R6 · Ningú no llista el bucket, ni qui hi participa ni qui ha pujat.
  for (const n of [1, 2, 3]) {
    if (real) {
      const llista = http([{ method: 'POST', path: '/object/list/xat_adjunts', json: { prefix: '', limit: 100 }, headers: { authorization: `Bearer ${token(n)}` } }])[0];
      assert.equal(llista.status, 200); assert.deepEqual(llista.json, []);
    } else {
      assert.equal(ultima(sql(`begin;${com(n)}set local storage.operation='storage.object.list_v2';select count(*) from storage.objects where bucket_id='xat_adjunts';commit;`)), '0');
    }
  }
  pass('cap llistat del bucket, tampoc per a qui participa o ha pujat');

  // La sonda rebutja el que no és la reserva.
  assert.equal(reserva(1, 2, 2000).status, 0);
  assert.equal(puja(1, 2, 'image/jpeg', 2000), 403, 'MIME fals');
  assert.equal(puja(1, 2, 'image/webp', 2001), 403, 'llargària falsa');
  assert.equal(puja(2, 2, 'image/webp', 2000), 403, 'reserva aliena');
  assert.equal(puja('anon', 2, 'image/webp', 2000), 403, 'anon');
  assert.equal(puja(1, 99, 'image/webp', 2000), 403, 'nom sense reserva');
  assert.equal(puja(1, 1, 'image/webp', 1000, { upsert: true }), 403, 'reescriure un publicat');
  pass('sonda: MIME, llargària, reserva aliena, anon, nom lliure i publicat, rebutjats');
  if (real) {
    const signada = http([{ method: 'POST', path: `/object/upload/sign/xat_adjunts/${ID(2)}`, bytes: 2000,
      headers: { authorization: `Bearer ${token(1)}`, 'content-type': 'image/webp' } }])[0];
    assert.equal(estat(signada), 403);
    assert.equal(estat(http([{ method: 'DELETE', path: '/object/xat_adjunts', json: { prefixes: [ID(1)] }, headers: { authorization: `Bearer ${token(1)}` } }])[0]), 200);
    assert.equal(ultima(sql(`select count(*) from storage.objects where name='${ID(1)}';`)), '1');
    pass('URL de pujada signada (capçaleres falsejades) rebutjada; ningú no esborra un publicat');
  }
  // L'escriptura final ha de casar amb la reserva (F1 i R1) i ser de qui ha reservat (F2).
  assert.equal(puja(1, 2, 'image/webp', 2000), 200);
  assert.match(sql(`update storage.objects set metadata = jsonb_set(metadata, '{size}', '1999') where name='${ID(2)}';`, { ok: false }).stderr, /SDP-XAT-021/);
  assert.match(sql(`update storage.objects set owner_id='${U(2)}' where name='${ID(2)}';`, { ok: false }).stderr, /SDP-XAT-021/);
  pass('disparador: una escriptura amb una altra mida o d\'una altra persona → SDP-XAT-021');
  // Si una escriptura escapara del disparador, la publicació també la rebutja.
  senseDisparador(`update storage.objects set metadata = jsonb_set(metadata, '{size}', '1999') where name='${ID(2)}';`);
  assert.match(sql(coma(1, `select xat_publica_adjunt('${ID(2)}', 'peu');`), { ok: false }).stderr, /SDP-XAT-021/);
  senseDisparador(`update storage.objects set metadata = jsonb_set(metadata, '{size}', '2000'), owner_id='${U(2)}' where name='${ID(2)}';`);
  assert.match(sql(coma(1, `select xat_publica_adjunt('${ID(2)}', 'peu');`), { ok: false }).stderr, /SDP-XAT-021/);
  senseDisparador(`update storage.objects set owner_id='${U(1)}' where name='${ID(2)}';`);
  assert.equal(JSON.parse(ultima(sql(coma(1, `select xat_publica_adjunt('${ID(2)}', 'peu');`)))).cos, 'peu');
  pass('publicació: mida final falsa o objecte d\'una altra persona → SDP-XAT-021');
  // Només es llig la versió publicada; reescriure un publicat ja no passa del disparador.
  assert.match(sql(`update storage.objects set version='canviada' where name='${ID(2)}';`, { ok: false }).stderr, /SDP-XAT-021/);
  senseDisparador(`update storage.objects set version='canviada' where name='${ID(2)}';`);
  assert.equal(llig(2, 2).estat, 404);
  senseDisparador(`update storage.objects o set version=a.versio from xat_adjunts a where a.id=o.name::uuid and o.name='${ID(2)}';`);
  assert.equal(llig(2, 2).estat, 200);
  pass('reescriure un publicat, rebutjat; una versió diferent de la publicada no es llig');
  // Revisió R1 · Cancel·lar a mitja pujada: l'escriptura final falla, no queda cap objecte i la quota torna.
  assert.equal(reserva(1, 3, 2000000).status, 0);
  assert.equal(usats(1), 2003000);
  const enCurs = await pujaICancella(1, 3, 'image/webp', 2000000);
  assert.equal(enCurs.cancella, 't');
  assert.equal(enCurs.estat, 500, JSON.stringify(enCurs));
  assert.equal(ultima(sql(`select count(*) from storage.objects where name='${ID(3)}';`)), '0');
  assert.equal(usats(1), 3000);
  pass(`cancel·lar a mitja pujada: ${real ? 'Storage respon 500' : 'l\'escriptura final falla'}, cap objecte i la quota torna`);

  // Quota exacta i +1 (persona 2, sense adjunts encara).
  assert.equal(reserva(2, 10, 19999900, 'video/mp4', 1, 5000).status, 0);
  assert.match(reserva(2, 11, 101).stderr, /SDP-XAT-020/);
  assert.equal(reserva(2, 11, 100).status, 0);
  assert.equal(usats(2), 20000000);
  assert.match(reserva(2, 12, 64).stderr, /SDP-XAT-020/);
  for (const id of [10, 11]) assert.equal(ultima(sql(coma(2, `select xat_cancella_reserva('${ID(id)}');`))), 't');
  assert.equal(usats(2), 0);
  pass('20.000.000 bytes exactes acceptats; un byte més rebutjat; sense objecte, la quota torna');
  // Dos reserves de 12 MB alhora en dos fils: exactament una.
  const dos = await Promise.all([
    asyncSql(coma(2, `select xat_reserva_adjunt('${ID(13)}','${F(1)}',12000000,'video/mp4',8000);select pg_sleep(0.4);`)),
    asyncSql(coma(2, `select xat_reserva_adjunt('${ID(14)}','${F(2)}',12000000,'video/mp4',8000);select pg_sleep(0.4);`))
  ]);
  assert.equal(dos.filter((r) => r.status === 0).length, 1, JSON.stringify(dos));
  assert.match(dos.find((r) => r.status !== 0).err, /SDP-XAT-020/);
  assert.equal(usats(2), 12000000);
  const guanya = dos[0].status === 0 ? 13 : 14;
  pass('12 MB + 12 MB concurrents en dos fils: exactament una reserva');
  // Descartar allibera la quota: 12 MB pujats, marca, DELETE de Storage i alliberament.
  assert.equal(puja(2, guanya, 'video/mp4', 12000000), 200);
  assert.equal(ultima(sql(coma(2, `select xat_cancella_reserva('${ID(guanya)}');`))), 'f');
  assert.equal(esborra(2, guanya), 0, 'sense la marca no s\'esborra');
  assert.match(ultima(sql(coma(2, `select xat_prepara_descart('${ID(guanya)}');`))), new RegExp(ID(guanya)));
  assert.equal(puja(2, guanya, 'video/mp4', 12000000, { upsert: true }), 403, 'pujar damunt d\'un descart');
  assert.equal(esborra(2, guanya), 1);
  assert.equal(ultima(sql(coma(2, `select xat_cancella_reserva('${ID(guanya)}');`))), 't');
  assert.equal(usats(2), 0);
  pass(`12 MB pujats i descartats: ${real ? 'DELETE de Storage amb el JWT' : 'DELETE com a authenticated'} i la quota torna a 0`);
  // El descart concurrent guanya a la publicació.
  assert.equal(reserva(2, 15, 3000).status, 0);
  assert.equal(puja(2, 15, 'image/webp', 3000), 200);
  const descart = asyncSql(`set application_name='sdp-descart';begin;${com(2)}select xat_prepara_descart('${ID(15)}');select pg_sleep(3);commit;`);
  let pendent = false;
  for (let i = 0; i < 80 && !pendent; i++) { pendent = ultima(sql("select count(*) from pg_stat_activity where application_name='sdp-descart' and wait_event='PgSleep';")) === '1'; if (!pendent) await wait(25); }
  assert.equal(pendent, true, 'No s’ha observat la marca de descart pendent');
  const publica = asyncSql(`set application_name='sdp-publica';${coma(2, `select xat_publica_adjunt('${ID(15)}','Foto');`)}`);
  let bloquejada = false;
  for (let i = 0; i < 80 && !bloquejada; i++) { bloquejada = ultima(sql("select count(*) from pg_stat_activity where application_name='sdp-publica' and wait_event_type='Lock';")) === '1'; if (!bloquejada) await wait(25); }
  assert.equal(bloquejada, true, 'No s’ha observat la publicació esperant el descart');
  assert.equal((await descart).status, 0);
  assert.match((await publica).err, /SDP-XAT-006/);
  assert.equal(esborra(2, 15), 1);
  assert.equal(ultima(sql(coma(2, `select xat_cancella_reserva('${ID(15)}');`))), 't');
  pass('descart concurrent: la publicació espera i perd (SDP-XAT-006)');

  // F2 · Baixa de la persona 1: l'objecte orfe va a la cua i ningú no l'adopta.
  sql(`delete from xat_missatges where usuari_id='${U(1)}'; delete from profiles where id='${U(1)}';`);
  assert.equal(ultima(sql(`select count(*) from private.purga_storage_pendent where bucket_id='xat_adjunts' and nom in ('${ID(1)}','${ID(2)}');`)), '2');
  assert.match(reserva(2, 1, 1000, 'image/webp', 2).stderr, /SDP-XAT-008/);
  pass('baixa: els objectes van a la cua de purga i un altre participant no els pot tornar a reservar');
  // F4 · La neteja: missatge caducat, pendent d'un dia, reserva vella i objecte orfe.
  assert.equal(reserva(2, 20, 4000, 'image/webp', 2).status, 0);
  assert.equal(puja(2, 20, 'image/webp', 4000), 200);
  sql(coma(2, `select xat_publica_adjunt('${ID(20)}', null);`));
  sql(`update xat_missatges set caduca_al = now() - interval '1 minute' where id='${ID(20)}';`);
  assert.equal(reserva(2, 21, 5000, 'image/webp', 2).status, 0);
  assert.equal(puja(2, 21, 'image/webp', 5000), 200);
  assert.equal(reserva(2, 22, 6000, 'image/webp', 2).status, 0);
  sql(`update xat_adjunts set creat_al = now() - interval '2 days' where id='${ID(21)}'; update xat_adjunts set creat_al = now() - interval '2 hours' where id='${ID(22)}';`);
  // Un objecte sense reserva només naix si una escriptura final s'escapa del disparador.
  senseDisparador(`insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata,created_at) values('xat_adjunts','${ID(23)}','${U(2)}','${U(2)}','v','{"size":64}',now()-interval '2 hours');`);
  assert.equal(usats(2), 15000);
  assert.equal(ultima(sql('select private.xat_neteja_adjunts(500);')), '4');
  assert.equal(ultima(sql(`select string_agg(right(nom, 2), ',' order by nom) from private.purga_storage_pendent where nom in ('${ID(20)}','${ID(21)}','${ID(22)}','${ID(23)}');`)), '20,21,23');
  assert.equal(ultima(sql('select private.xat_neteja_adjunts(500);')), '0');
  // Revisió R2 · Els binaris a la cua continuen comptant (4000 + 5000 + 64) fins que el worker els purga.
  assert.equal(usats(2), 9064);
  assert.match(reserva(2, 24, 19990937, 'video/mp4', 2, 5000).stderr, /SDP-XAT-020/);
  sql(`update private.purga_storage_pendent set feta_al = now() where bucket_id='xat_adjunts' and nom in ('${ID(20)}','${ID(21)}','${ID(23)}');`);
  assert.equal(usats(2), 0);
  pass('neteja: caducat, pendent d\'un dia i objecte orfe a la cua; reserva vella alliberada; repetir no fa res; la quota no torna fins a la purga');
  console.log(`RESUM: ${passades} comprovacions passades pel camí ${cami}${real ? ' (storage-api real)' : ' (sense storage-api)'}.`);
} finally {
  for (const c of [st, pg]) docker('rm', '-f', c);
  if (real) docker('network', 'rm', xarxa);
}
