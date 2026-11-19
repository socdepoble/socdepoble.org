import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {creaFixturePosse,FONT_POLITICA_2_6_ABANS_A2,aplicaFontsHistoriques} from './node0-posse-fixture.mjs';
import {creaMotorPosse} from '../tooling/node0/posse/motor-posse.mjs';
import {creaRepositoriPosse} from '../tooling/node0/posse/repositori-posse.mjs';
import {hashSessioNodeZero} from '../tooling/node0/auth-node0.mjs';
import {verificaEsquemaPosseNodeZero,instalaEsquemaPosseNodeZero} from '../tooling/node0/posse/instal-la-posse-node0.mjs';
import {creaPlaMigracions} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {comparaVersions} from '../scripts/supabase/verifica-migracions.mjs';
const HASH='3'.repeat(64);
const sqlPosse=fs.readFileSync(new URL('../tooling/node0/posse/posse-ledger.sql',import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
// R9 (R9V-C3-01): the deployed canonical 76, it plus the /legal 2.5 seal (77), the R20b pair (78) and everything (79).
// R13-C7: the superadmin-only session counts (81) are left out of every earlier profile, as SQL80 was.
const R20B=['2611052345','2611060010'],SEGELL25=['2611061520'],SEED80=['2611070600'],SESSIONS81=['2611082238'];
const R9_A_R13=[[...R20B,...SEGELL25,...SEED80,...SESSIONS81],[...R20B,...SEED80,...SESSIONS81],[...SEGELL25,...SEED80,...SESSIONS81],[...SEED80,...SESSIONS81],SESSIONS81,[]].map(exclou=>[...exclou,'2611080430','2611080431','2611080432','2611080440','2611091500']);
// D-R27-3: cada perfil és «catàleg actual menys exclusions». Les migracions posteriors a R15
// (2611091500) es calculen amb l'ordre de versions del catàleg, de manera que una migració
// futura no trenca cap perfil històric; només el perfil complet actual necessita pin nou.
const CATALEG=creaPlaMigracions().migrations;
const POST_R15=CATALEG.filter(m=>comparaVersions(m.version,'2611091500')>0).map(m=>m.version);
// Onada R32: el complet de 114 d'R30 (fins a 20261115230000) es conserva com a perfil històric; les
// migracions posteriors (R31 20261116031000 i 20261116040000) en queden fora.
const POST_R30=CATALEG.filter(m=>comparaVersions(m.version,'20261115230000')>0).map(m=>m.version);
// PF-01 i CAS de publicacions del kit R30 de Codex: rebutjades a R30, no han d'aterrar ni arrossegades.
const REBUTJADES_R30=['20261115231000','20261115233000'];
// Perfils del kit R30.2/R31 construïts amb les dues rebutjades dins: cap pot obrir POSSE.
const PINS_KIT_REBUTJATS=[
 [116,'21a3cfc3a0d646166de72f1ae087e7999a668292ae0e411b9dd3ce978082f683'],
 [117,'8a0bc6de5f863ca386de0e654213a7b2ba57f07eda78a521029734f389346090'],
 [118,'69234edd70c404eb771f544a581b77f4192c39c1c81333d3785d1cf06b6de8d0'],
];
// Onada R32.2: el complet de 116 d'R32 (fins a 20261116040000) també es conserva com a perfil històric; les tres R32
// (20261116170000, 20261116170100 i 20261116170200, NO aplicades a Producció) en queden fora.
const POST_R32=CATALEG.filter(m=>comparaVersions(m.version,'20261116170200')>0).map(m=>m.version);
const POST_R31=CATALEG.filter(m=>comparaVersions(m.version,'20261116040000')>0).map(m=>m.version);
// Onada R32.4: el complet de 119 d'R32.2 (fins a 20261116170200) també es conserva com a perfil històric; 20261117150000
// (la pàgina /page/sistema-nervios al registre de copublicació, NO aplicada) en queda fora.
const POST_R324=CATALEG.filter(m=>comparaVersions(m.version,'20261117150000')>0).map(m=>m.version);
// Onada v1.2.7 (kit R32.5 de Codex): el complet de 120 d'R32.4 (fins a 20261117150000) també es conserva com a perfil
// històric. 20261117140000 (safata i revisió LSSI cautelar, NO aplicada) té una versió anterior però no hi era: en queda
// fora, igual que tot el que vinga després de 20261117150000.
// P1-74 (A-03): el complet de 123 de la v1.2.8 (fins a 20261117193000) també es conserva com a perfil històric;
// 20261118230000 (la caché de credencials natives per configuració, NO aplicada) en queda fora.
const POST_R32_8=CATALEG.filter(m=>comparaVersions(m.version,'20261117193000')>0).map(m=>m.version);
const POST_R32_4=['20261117140000',...CATALEG.filter(m=>comparaVersions(m.version,'20261117150000')>0).map(m=>m.version)];
// El 120 del kit R32.5 de Codex es va calcular sobre la v1.2.5: els 119 més 20261117140000, sense 20261117150000.
// No és cap catàleg publicat: el recompte 120 només val amb el registre exacte d'R32.4.
const PIN_KIT_R32_5_120='3e45e1da922cb8a51c43ae23504b4e279eae11f0db7f1046b1f31156800edb85';
// HistoricalR54, currentR15-A3 (only2.6 deferred), and fullsourceR15 are three
// separate exact ledgers. No historical source hash is regenerated or replaced.
// R54-85 i R15-86 inclouen 2611080440, reescrita per l'esmena A2 (776f77186): els seus pins
// es proven amb els bytes històrics genuïns del fixture, no es descarten.
const PERFILS=[
 ...[76,77,78,79,80,81].map((migracions,i)=>({migracions,exclou:[...R9_A_R13[i],...POST_R15],fonts:[]})),
 {migracions:85,exclou:['2611091500',...POST_R15],fonts:[FONT_POLITICA_2_6_ABANS_A2]},
 {migracions:85,exclou:['2611080440',...POST_R15],fonts:[]},
 {migracions:86,exclou:POST_R15,fonts:[FONT_POLITICA_2_6_ABANS_A2]},
 // R30: el complet de 114 es conserva (pin 9072d6ee…); R32 hi afig el complet real, sense repintar-lo.
 {migracions:114,exclou:POST_R30,fonts:[]},
 // R32: el complet de 116 (114 + R31 Push i definers) es conserva (pin 34ddc81c…); R32.2 hi afig el complet real.
 {migracions:116,exclou:POST_R31,fonts:[]},
 // R32.2: el complet de 119 (116 + les tres R32) es conserva (pin 4c315103…); R32.4 hi afig el complet real.
 {migracions:119,exclou:POST_R32,fonts:[]},
 // R32.4: el complet de 120 (119 + 20261117150000) es conserva (pin 91dabe47…); la v1.2.7 hi afig el complet real.
 {migracions:120,exclou:POST_R32_4,fonts:[]},
 // v1.2.7: el complet de 121 (120 + 20261117140000) es conserva (pin 851f46d4…); la v1.2.8 hi afig el complet real.
 {migracions:121,exclou:POST_R324,fonts:[]},
 // v1.2.8: el complet de 123 (121 + 20261117173000 d'R32.7 i 20261117193000 d'R32.8) es conserva (pin 1de4ff25…).
 {migracions:123,exclou:POST_R32_8,fonts:[]},
 // Catàleg complet actual (123 + 20261118230000 de P1-74 A-03, NO aplicada): cap exclusió.
 {migracions:124,exclou:[],fonts:[]},
];
const catalogues=PERFILS.map(({exclou,fonts})=>aplicaFontsHistoriques(CATALEG.filter(m=>!exclou.includes(m.version)),fonts));
const PINS=[...sqlPosse.match(/-- POSSE_MIGRATION_PINS_BEGIN\n([\s\S]*?)\n-- POSSE_MIGRATION_PINS_END/)[1].matchAll(/\((\d+),'([a-f0-9]{64})'\)/g)].map(([,count,hash])=>`${count}:${hash}`);
const ledgerHash=rows=>sha([...rows].sort((a,b)=>a.version<b.version?-1:a.version>b.version?1:0).map(m=>`${m.version}\t${m.file}\t${m.sha256}`).join('\n'));
function ready(rows){
 const functionHashes=Object.fromEntries(['source_current','source_for_bridge','remote_current','assert_current','assert_history','rpc','credential_proof'].map(name=>{const start=sqlPosse.indexOf(`CREATE OR REPLACE FUNCTION node0_posse.${name}(`),body=sqlPosse.indexOf('AS $f$',start),end=sqlPosse.indexOf('$f$;',body+6);return[name,sha(sqlPosse.slice(body+6,end))];}));
 return{version:'posse.r11.v1',migrations:rows.length,migrationLedgerSha256:ledgerHash(rows),ownerStable:true,tablesPrivate:true,sourceInstalled:true,remoteInstalled:true,functionHashes};
}
test('POSSE accepts exact source ledgers derived from the complete migration catalogue',async()=>{
 const all=creaPlaMigracions().migrations,known=new Set(all.map(row=>row.version));
 for(const [index,{migracions,exclou:excluded}] of PERFILS.entries()){
  assert.equal(new Set(excluded).size,excluded.length);
  assert.ok(excluded.every(version=>known.has(version)),'a missing historical migration must fail explicitly');
  assert.equal(catalogues[index].length,all.length-excluded.length);
  assert.equal(catalogues[index].length,migracions,'cada perfil reprodueix el recompte del seu catàleg històric');
  assert.equal(new Set(catalogues[index].map(row=>row.version)).size,catalogues[index].length);
 }
 assert.notEqual(ledgerHash(catalogues[6]),ledgerHash(catalogues[7]));
 // Cada pin del SQL el prova exactament un perfil reproduït, i cap perfil queda sense pin.
 assert.equal(PINS.length,16);
 assert.deepEqual(catalogues.map(rows=>`${rows.length}:${ledgerHash(rows)}`).sort(),[...PINS].sort());
 for(const rows of catalogues){let calls=0;assert.equal(await verificaEsquemaPosseNodeZero({db:{async query(sql,options){calls++;assert.equal(sql,'SELECT node0_posse.readiness();');assert.equal(options.privateValues,true);return ready(rows);}}}),true);assert.equal(calls,1);}
});
test('R23 counts without exact source identity proof never establish readiness',async()=>{
 const base=ready(catalogues[0]),wrong=structuredClone(catalogues[0]);wrong[0].sha256='0'.repeat(64);
 const unknown=structuredClone(catalogues[1]);unknown[0].file='unknown.sql';
 const unknownVersion=structuredClone(catalogues[0]);unknownVersion[0].version='9999999999';
 for(const state of[{...base,migrationLedgerSha256:undefined},{...base,migrationLedgerSha256:'0'.repeat(64)},ready(wrong),ready(unknown),ready(unknownVersion),{...base,migrations:75},{...base,migrations:77},{...base,migrations:78},{...base,migrations:79},{...base,migrations:80},{...base,migrations:81},{...ready(catalogues[3]),migrationLedgerSha256:ledgerHash(catalogues[2])}])await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>state}}),/posse_schema_drift/);
 for(const change of[{ownerStable:false},{tablesPrivate:false},{sourceInstalled:false},{remoteInstalled:false},{functionHashes:{}}])await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>({...base,...change})}}),/posse_schema_drift/);
 // Amb els bytes actuals de 2611080440 (A2, 776f77186) les composicions R54-85 i R15-86 no són
 // cap registre fixat; i els pins obsolets 111 (ea68491ba, sense 20261115030000), 112 (R28, sense
 // 20261115170000 de l'Onada R29) i 113 (R29, sense 20261115230000 de l'Onada R30) ja no s'accepten.
 const historics=PERFILS.filter(p=>p.fonts.length);assert.equal(historics.length,2);
 for(const {exclou} of historics)await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>ready(CATALEG.filter(m=>!exclou.includes(m.version)))}}),/posse_schema_drift/);
 await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>({...base,migrations:111,migrationLedgerSha256:'834e9473ddbdea38b02d8b59ccd268c0811dfdcf65fbcb407edf720e0f4f5233'})}}),/posse_schema_drift/);
 await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>({...base,migrations:112,migrationLedgerSha256:'542397eda905b620188f17be580e988c34558b306071a5a675a9368ca6c15485'})}}),/posse_schema_drift/);
 await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>({...base,migrations:113,migrationLedgerSha256:'e28b0846ee2c1f345d80fb3b0441b7a9e3fee9711ca6dee5e40841d96f49a7c5'})}}),/posse_schema_drift/);
 // Onada R32: els perfils del kit amb 20261115231000 i 20261115233000 tampoc no s'accepten.
 for(const [migrations,migrationLedgerSha256] of PINS_KIT_REBUTJATS)await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>({...base,migrations,migrationLedgerSha256})}}),/posse_schema_drift/);
 // Onada v1.2.7: el 120 del kit R32.5 es reprodueix byte a byte des del catàleg real i tampoc no s'accepta.
 const kit120=CATALEG.filter(m=>comparaVersions(m.version,'20261116170200')<=0||m.version==='20261117140000');
 assert.equal(kit120.length,120);assert.equal(ledgerHash(kit120),PIN_KIT_R32_5_120);
 await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>ready(kit120)}}),/posse_schema_drift/);
});
test('R32 POSSE pins the real catalogue: rejected R30 migrations are absent and the kit profiles stay out',()=>{
 const versions=new Set(CATALEG.map(m=>m.version));
 for(const v of REBUTJADES_R30)assert.equal(versions.has(v),false,`${v} no forma part del catàleg`);
 for(const [count,hash] of PINS_KIT_REBUTJATS)assert.equal(PINS.includes(`${count}:${hash}`),false,`${count}:${hash.slice(0,8)} no és cap pin`);
 assert.equal(PINS.includes(`120:${PIN_KIT_R32_5_120}`),false,'el 120 del kit R32.5 no és cap pin');
 // Recalculat, no repintat: el 114 d'R30 continua reproduint-se byte a byte des del catàleg real.
 assert.ok(PINS.includes('114:9072d6ee39c18ff2156573d2cbf0fa6a815b1e5c4fd3a3073fd158beac3d1fd5'));
 assert.equal(ledgerHash(catalogues[PERFILS.findIndex(p=>p.migracions===114)]),'9072d6ee39c18ff2156573d2cbf0fa6a815b1e5c4fd3a3073fd158beac3d1fd5');
 // Hash canònic: version TAB file TAB sha256, ordre binari de versions, salt de línia entre files i cap al final.
 const full=catalogues.at(-1),ordenat=[...full].sort((a,b)=>Buffer.compare(Buffer.from(a.version),Buffer.from(b.version)));
 assert.equal(ledgerHash(full),sha(ordenat.map(m=>[m.version,m.file,m.sha256].join('\t')).join('\n')));
 assert.notEqual(ledgerHash(full),sha(JSON.stringify(ordenat.map(({version,file,sha256})=>({version,file,sha256})))));
 assert.equal(PINS.at(-1),`${full.length}:${ledgerHash(full)}`,'l’últim pin és el del catàleg complet real');
});
test('R39 POSSE hashes use the PostgreSQL core without a pgcrypto schema assumption',()=>{
 assert.doesNotMatch(sqlPosse,/\b(?:public\.)?digest\(/);
 assert.equal([...sqlPosse.matchAll(/pg_catalog\.sha256\(convert_to\(/g)].length,8);
});
test('POSSE PostgreSQL installs all sixteen exact pinned profiles and rejects incomplete, unknown or drifted ledgers',{skip:!process.env.SDP_PGLITE_MODULE&&'Set SDP_PGLITE_MODULE for actual PostgreSQL SQL proof'},async t=>{
 assert.equal(PERFILS.length,16,'setze perfils fixats: 76..81, els dos 85, 86, el 114 d’R30, el 116 d’R31, el 119 d’R32.2, el 120 d’R32.4, el 121 de la v1.2.7, el 123 de la v1.2.8 i el complet actual 124');
 for(const [index,{exclou,fonts}] of PERFILS.entries()){
  const f=await creaFixturePosse({exclou,fonts});
  try{
   const version=(await f.pg.query('SELECT version() AS version')).rows[0].version;t.diagnostic(`PGlite: ${version}`);
   const expected=catalogues[index],saved=(await f.pg.query('SELECT version,file,sha256 FROM node0.schema_migrations ORDER BY version COLLATE "C"')).rows;
   assert.deepEqual(saved,expected.map(({version,file,sha256})=>({version,file,sha256})).sort((a,b)=>a.version<b.version?-1:1));
   if(!exclou.length){
    // Prova PostgreSQL sobre el catàleg reconciliat real, no només el pin.
    const pending=(await f.pg.query(`SELECT n.nspname,p.proname,p.proconfig FROM pg_catalog.pg_proc p
     JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE p.prosecdef AND n.nspname IN ('public','private')
     AND NOT coalesce(p.proconfig @> ARRAY['search_path=""']::text[],false)
     AND NOT coalesce(p.proconfig @> ARRAY['search_path=']::text[],false)`)).rows;
    assert.deepEqual(pending,[],'cap definer públic/privat pendent després de les 124 fonts');
    const e2ee=(await f.pg.query('SELECT public.xat_verifica_prerequisits_e2ee() AS contracte')).rows[0].contracte;
    assert.equal(e2ee.preparat_sql,true);assert.deepEqual(e2ee.faltants,[]);
    const push=(await f.pg.query("SELECT pg_get_constraintdef(oid) AS definicio FROM pg_constraint WHERE conname='xat_dispositius_push_sessio_fk'")).rows;
    assert.equal(push.length,1);assert.match(push[0].definicio,/FOREIGN KEY \(sessio_id\) REFERENCES auth.sessions\(id\) ON DELETE CASCADE/);
   }
   assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
   const before=(await f.pg.query('SELECT node0_posse.readiness() AS ready')).rows[0].ready;
   await f.pg.exec('CREATE SCHEMA extensions;ALTER EXTENSION pgcrypto SET SCHEMA extensions');
   assert.equal((await f.pg.query("SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto'")).rows[0].nspname,'extensions');
   assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
   await f.pg.exec(sqlPosse);
   assert.deepEqual((await f.pg.query('SELECT node0_posse.readiness() AS ready')).rows[0].ready,before);
   const scalar=async sql=>Object.values((await f.pg.query(sql)).rows[0])[0];
   assert.equal(await scalar("SELECT node0_posse.readiness()->>'migrationLedgerSha256'"),ledgerHash(expected));
   const rejectBoth=async()=>{
    await assert.rejects(verificaEsquemaPosseNodeZero({db:f.db}),/posse_schema_drift/);
    await assert.rejects(f.pg.exec(sqlPosse),/posse_install_guard/);await f.pg.exec('ROLLBACK');
   };
   const row=saved[0];
   await f.pg.query("UPDATE node0.schema_migrations SET sha256=repeat('0',64) WHERE version=$1",[row.version]);await rejectBoth();
   await f.pg.query('UPDATE node0.schema_migrations SET sha256=$1 WHERE version=$2',[row.sha256,row.version]);
   await f.pg.query("UPDATE node0.schema_migrations SET file='unknown.sql' WHERE version=$1",[row.version]);await rejectBoth();
   await f.pg.query('UPDATE node0.schema_migrations SET file=$1 WHERE version=$2',[row.file,row.version]);
   await f.pg.query("UPDATE node0.schema_migrations SET version='9999999999' WHERE version=$1",[row.version]);await rejectBoth();
   await f.pg.query("UPDATE node0.schema_migrations SET version=$1 WHERE version='9999999999'",[row.version]);
   await f.pg.query("INSERT INTO node0.schema_migrations(version,file,sha256) VALUES('9999999999','unknown.sql',repeat('0',64))");await rejectBoth();
   await f.pg.query("DELETE FROM node0.schema_migrations WHERE version='9999999999'");
   if(saved.length===79){
    const seal=saved.find(r=>r.version==='2611061520');await f.pg.query('DELETE FROM node0.schema_migrations WHERE version=$1',[seal.version]);
    assert.equal(await scalar("SELECT node0_posse.readiness()->>'migrationLedgerSha256'"),ledgerHash(catalogues[2]));assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
    await f.pg.query('INSERT INTO node0.schema_migrations(version,file,sha256) VALUES($1,$2,$3)',[seal.version,seal.file,seal.sha256]);
   }
   if(!exclou.length){
    const extra=saved.find(r=>r.version==='2611060010');await f.pg.query('DELETE FROM node0.schema_migrations WHERE version=$1',[extra.version]);assert.equal(await scalar('SELECT count(*)::int FROM node0.schema_migrations'),saved.length-1);await rejectBoth();
    await f.pg.query('INSERT INTO node0.schema_migrations(version,file,sha256) VALUES($1,$2,$3)',[extra.version,extra.file,extra.sha256]);
    const removed=saved.slice(0,2);for(const r of removed)await f.pg.query('DELETE FROM node0.schema_migrations WHERE version=$1',[r.version]);assert.equal(await scalar('SELECT count(*)::int FROM node0.schema_migrations'),saved.length-2);await rejectBoth();
    for(const r of removed)await f.pg.query('INSERT INTO node0.schema_migrations(version,file,sha256) VALUES($1,$2,$3)',[r.version,r.file,r.sha256]);
    // El catàleg complet sense el segell legal no és cap perfil revisat, siga quin siga el seu recompte (R13-C7: recompte no és identitat).
    const seal=saved.find(r=>r.version==='2611061520');await f.pg.query('DELETE FROM node0.schema_migrations WHERE version=$1',[seal.version]);
    assert.equal(await scalar('SELECT count(*)::int FROM node0.schema_migrations'),saved.length-1);await rejectBoth();
    await f.pg.query('UPDATE node0.schema_migrations SET sha256=repeat(\'0\',64) WHERE version=$1',[saved.at(-2).version]);await rejectBoth();
    await f.pg.query('UPDATE node0.schema_migrations SET sha256=$1 WHERE version=$2',[saved.at(-2).sha256,saved.at(-2).version]);
    await f.pg.query('INSERT INTO node0.schema_migrations(version,file,sha256) VALUES($1,$2,$3)',[seal.version,seal.file,seal.sha256]);
   }
   await f.pg.exec('ALTER SCHEMA node0_posse OWNER TO node0_runtime');await assert.rejects(verificaEsquemaPosseNodeZero({db:f.db}),/posse_schema_drift/);
   await assert.rejects(f.pg.exec(sqlPosse),/posse_owner_drift/);await f.pg.exec('ROLLBACK;ALTER SCHEMA node0_posse OWNER TO postgres');
   await f.pg.exec('SET ROLE node0_runtime');await assert.rejects(f.pg.exec(sqlPosse),/posse_install_guard/);await f.pg.exec('ROLLBACK;RESET ROLE');
   assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);await f.pg.exec(sqlPosse);assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
  }finally{await f.close();}
 }
});

test('R11 canonical SQL sources, institutional policy, durable approval and dedup gates',{skip:!process.env.SDP_PGLITE_MODULE&&'Set SDP_PGLITE_MODULE for actual PostgreSQL SQL proof'},async t=>{
 const f=await creaFixturePosse();let effects=0;
 const credential=()=>f.repo.certifyCredential({bridgeId:f.bridge.id,tokenSha256:f.tokenSha256,requiredScopes:['read:accounts','write:statuses']});
 const motor=creaMotorPosse({repository:f.repo,certificaArticle:input=>f.repo.certifyPrimary(input),authorizeBridge:async()=>({allowed:true,actorProof:HASH}),publishingEnabled:true,transportForBridge:async()=>({requiredScopes:()=>['read:accounts','write:statuses'],preflight:credential,publishStatus:async()=>{effects++;return{id:String(8000+effects),url:'https://mastodont.cat/@depoble/'+(8000+effects)};},validateResult:()=>true})});
 const prepare=row=>motor.prepare({bridgeId:f.bridge.id,recordId:row.recordId},{});
 const stored=p=>f.repo.loadPrepared(p.preparedId);
 const claim=async p=>{const d=await stored(p),c=await credential();return f.repo.claimConfirmed({bridgeId:f.bridge.id,preparedId:p.preparedId,expectedBridgeRevision:p.bridgeRevision,expectedRevision:p.recordRevision,draftHash:p.draftHash,editorialProof:d.snapshot.editorialProvenance.proofSha256,bridgePolicyProof:d.snapshot.bridge.policyProofSha256,actorProof:HASH,remoteAccountIdentity:f.bridge.remoteAccountIdentity,credentialCertificationId:c.certificationId});};
 const cadence=()=>f.pg.query('UPDATE node0_posse.bridges SET next_reserved_at=NULL WHERE id=$1',[f.bridge.id]);
 const scalar=async(sql,args=[])=>Object.values((await f.pg.query(sql,args)).rows[0])[0];
 try{
  await t.test('schema readiness checks all request-role grants and survives repeat installation',async()=>{
   assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
   let ownerCalls=0;const ownerDb={async query(sql,options){ownerCalls++;assert.equal(options.privateValues,false);const results=await f.pg.exec(sql);const row=[...results].reverse().find(x=>x.rows?.length)?.rows[0];return row?Object.values(row)[0]:null;}};
   assert.equal(await instalaEsquemaPosseNodeZero({db:ownerDb}),true);assert.equal(ownerCalls,2);

   for(const role of ['anon','authenticated','node0_runtime','node0_authenticator'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal(await scalar("SELECT has_table_privilege($1,'node0_posse.publication_certifications',$2)",[role,privilege]),false);
   await f.pg.exec('GRANT INSERT ON node0_posse.publication_certifications TO anon');await assert.rejects(verificaEsquemaPosseNodeZero({db:f.db}),/posse_schema_drift/);await f.pg.exec('REVOKE INSERT ON node0_posse.publication_certifications FROM anon');
   await f.pg.exec('CREATE OR REPLACE FUNCTION node0_posse.source_current(t uuid,s text,i uuid) RETURNS jsonb LANGUAGE sql AS $$SELECT NULL::jsonb$$');await assert.rejects(verificaEsquemaPosseNodeZero({db:f.db}),/posse_schema_drift/);
   await f.pg.exec(fs.readFileSync(new URL('../tooling/node0/posse/posse-ledger.sql',import.meta.url),'utf8'));assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
  });
  await t.test('only certified current originals of the two real mapped institutional authors are enumerated',async()=>{
   const yes=await f.source(),rent=await f.source({author:'rentonar'}),missing=await f.source({certified:false}),members=await f.source({visibility:'members'}),market=await f.source({section:'mercat',commercial:false}),oil=await f.source({author:'oli-comercial',commercial:false}),commercial=await f.source({commercial:true}),loop=await f.source({source:'mastodon'});
   await f.pg.exec('BEGIN');await f.pg.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[f.alice.id]);
   await f.pg.query(`UPDATE public.section_submissions SET payload=payload||'{"source":"mastodon"}'::jsonb WHERE id=$1`,[loop.recordId.id]);await f.pg.exec('COMMIT');
   await f.pg.query('UPDATE node0_posse.publication_certifications SET source_revision=(SELECT node0_posse.source_revision(s) FROM public.section_submissions s WHERE s.id=$1) WHERE record_id=$1',[loop.recordId.id]);
   const rows=await f.repo.listSourceRecords(f.bridge.id),ids=rows.map(r=>r.id);assert.ok(ids.includes(yes.recordId.id));assert.ok(ids.includes(rent.recordId.id));for(const no of [missing,members,market,oil,commercial,loop])assert.ok(!ids.includes(no.recordId.id));
   assert.equal(await f.repo.loadRecord(missing.recordId,{bridgeId:f.bridge.id}),null);assert.equal(await f.repo.loadRecord(members.recordId,{bridgeId:f.bridge.id}),null);
   const raw=await scalar('SELECT payload FROM public.section_submissions WHERE id=$1',[missing.recordId.id]);assert.equal(raw.visibility,'public','payload public alone cannot grant publication');
  });
  await t.test('default bridge reads canonical mapping and rejects wrong session actor, tenant and unrelated person',async()=>{
   const b=await f.repo.loadDefaultBridge();assert.equal(b.ownerOrgId,f.orgs.socdepoble.id);assert.equal(b.secretRef,undefined);
   await assert.rejects(f.repoFor(f.bob).loadDefaultBridge(),e=>e.code==='POSSE_CONFIRMATION_DENIED');
   const wrong=creaRepositoriPosse({db:f.db,sessionHash:hashSessioNodeZero({cookie:f.bob.cookie}),expectedActor:f.alice.id,tenantId:f.tenantId});await assert.rejects(wrong.loadDefaultBridge(),e=>e.code==='POSSE_CONFIRMATION_DENIED');
   const foreign=creaRepositoriPosse({db:f.db,sessionHash:hashSessioNodeZero({cookie:f.alice.cookie}),expectedActor:f.alice.id,tenantId:randomUUID()});await assert.rejects(foreign.loadDefaultBridge(),e=>e.code==='POSSE_CONFIRMATION_DENIED');
  });
  await t.test('durable drafts survive repository restart and repeated prepare is idempotent',async()=>{
   const row=await f.source(),a=await prepare(row),b=await prepare(row);assert.equal(a.preparedId,b.preparedId);assert.match(a.draftHash,/^[a-f0-9]{64}$/);
   const restarted=f.repoFor(f.alice);assert.equal((await restarted.loadPrepared(a.preparedId)).draftHash,a.draftHash);assert.equal(await scalar('SELECT count(*)::int FROM node0_posse.records WHERE record_id=$1',[row.recordId.id]),1);
   await assert.rejects(f.pg.query("UPDATE node0_posse.drafts SET snapshot='{}' WHERE id=$1",[a.preparedId]),e=>e.message==='posse_immutable_snapshot');
  });
  await t.test('uncertified edited source invalidates both preparation and confirmation',async()=>{
   const row=await f.source(),p=await prepare(row);await f.source({id:row.recordId.id,title:'Changed source',certified:false});await cadence();
   await assert.rejects(claim(p),e=>e.code==='POSSE_PREPARED_STALE');assert.equal(effects,0);
  });
  await t.test('institutional exclusions cannot be loosened through bridge configuration',async()=>{
   await assert.rejects(f.repo.configureBridge({...f.config,policy:{excludeCommercial:false,excludedSections:[]}}),e=>e.code==='POSSE_CONFIRMATION_DENIED');
   const b=await f.repo.loadBridge(f.bridge.id);assert.equal(b.policy.excludeCommercial,true);assert.ok(b.policy.excludedSections.includes('mercat'));
   await assert.rejects(f.repo.configureBridge({...f.config,linkedAuthors:[{kind:'entity',id:f.orgs['oli-comercial'].id,enabled:true}]}),e=>e.code==='POSSE_CONFIRMATION_DENIED');
  });
  await t.test('exact canonical remote link is a durable possible replica and blocks claim without GET dependency',async()=>{
   const row=await f.source(),p=await prepare(row);await f.observe(row);await cadence();
   await assert.rejects(claim(p),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
   const before=await scalar('SELECT count(*)::int FROM node0_posse.approvals');await f.repo.refreshHistorical(f.bridge.id);const h=await f.repo.historicalData(f.bridge.id);assert.ok(h.records.some(r=>r.recordId.id===row.recordId.id));assert.ok(h.inventory.some(o=>o.id==='7001'));
   assert.equal(await scalar('SELECT action FROM node0_posse.historical_plans WHERE bridge_id=$1 AND record_id=$2',[f.bridge.id,row.recordId.id]),'review-link-existing');assert.equal(await scalar('SELECT published_hash FROM node0_posse.records WHERE record_id=$1',[row.recordId.id]),null);assert.equal(await scalar('SELECT count(*)::int FROM node0_posse.approvals'),before);
  });
  await t.test('proved legacy URL aliases block new POST and other remote accounts cannot create false holds',async()=>{
   const row=await f.source(),p=await prepare(row);await f.observe(row,{id:'7100',account:'https://other.example/users/other'});await cadence();const c=await claim(p);assert.equal(c.state,'claimed');await f.repo.releaseUnsent({leaseId:c.leaseId});
   const legacy='https://socdepoble.net/2022/11/17/legacy-r11/';await f.pg.query('INSERT INTO node0_posse.legacy_aliases VALUES($1,$2,$3,$4,$5,$6)',[f.tenantId,'mur',row.recordId.id,legacy,row.canonicalUrl,HASH]);await f.observe(row,{id:'7101',links:[legacy]});await cadence();await assert.rejects(claim(p),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
  });
  await t.test('a canonical duplicate observed after claim blocks start and actual mutation gate',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.observe(row,{id:'7201'});await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');assert.equal(await scalar('SELECT dispatch_stage FROM node0_posse.attempts WHERE lease_id=$1',[c.leaseId]),null);await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('two confirmations share a stable record and one active lease',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const claims=await Promise.all([claim(p),claim(p)]);assert.deepEqual(claims.map(c=>c.state).sort(),['busy','claimed']);const c=claims.find(v=>v.state==='claimed');await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('credential proof is stable across scope subsets and rotation invalidates approved dispatch',async()=>{
   const a=await credential(),b=await f.repo.certifyCredential({bridgeId:f.bridge.id,tokenSha256:f.tokenSha256,requiredScopes:['write:statuses']});assert.equal(a.certificationId,b.certificationId);
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.pg.query("UPDATE node0_posse.remote_bindings SET credential_sha256=repeat('9',64) WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$1)",[f.bridge.id]);
   await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}),e=>e.code==='POSSE_PREPARED_STALE');await f.repo.releaseUnsent({leaseId:c.leaseId});await f.pg.query('UPDATE node0_posse.remote_bindings SET credential_sha256=$1 WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$2)',[f.tokenSha256,f.bridge.id]);
  });
  await t.test('published hash belongs to the exact approved version and later source changes require update',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const sent=await motor.publish({bridgeId:f.bridge.id,bridgeRevision:p.bridgeRevision,preparedId:p.preparedId,recordRevision:p.recordRevision,draftHash:p.draftHash,confirm:true},{});assert.equal(sent.created,true);assert.equal(effects,1);const d=await stored(p);assert.equal(d.publishedHash,p.draftHash);
   await f.source({id:row.recordId.id,title:'Edited public article'});const p2=await prepare(row),row2=(await f.repo.listPrepared(f.bridge.id)).find(d=>d.preparedId===p2.preparedId);assert.notEqual(row2.publishedHash,row2.draftHash);assert.equal(row2.externalStatusId,sent.externalStatusId);
  });
  await t.test('attested cover changes invalidate an already approved snapshot before dispatch',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);
   await f.pg.query(`UPDATE node0_posse.publication_certifications SET cover='{"public":true,"blobRef":"public/changed"}'::jsonb WHERE record_id=$1`,[row.recordId.id]);
   await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}),e=>e.code==='POSSE_PREPARED_STALE');
   await f.pg.query('UPDATE node0_posse.publication_certifications SET cover=NULL WHERE record_id=$1',[row.recordId.id]);await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('binding and ownership revocation are rechecked before dispatch',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.pg.query('UPDATE node0_posse.remote_bindings SET revoked_at=clock_timestamp() WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$1)',[f.bridge.id]);await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}));assert.equal(await scalar('SELECT dispatch_stage FROM node0_posse.attempts WHERE lease_id=$1',[c.leaseId]),null);await f.pg.query('UPDATE node0_posse.remote_bindings SET revoked_at=NULL WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$1)',[f.bridge.id]);await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('positive exact draft observation resolves uncertainty, URL match alone does not',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'});await f.repo.markIndeterminate({leaseId:c.leaseId,stage:'status-post',mediaId:null,externalStatusId:null,externalUrl:null});
   await f.observe(row,{id:'7501'});await assert.rejects(f.repo.reconcile({leaseId:c.leaseId,externalStatusId:'7501'}),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');await f.observe(row,{id:'7501',draftHash:p.draftHash});await f.repo.reconcile({leaseId:c.leaseId,externalStatusId:'7501'});assert.equal((await stored(p)).publishedHash,p.draftHash);
  });
 }finally{await f.close();}
});
