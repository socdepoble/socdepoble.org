/** Prova exacta del registre de fonts POSSE; sense socket de servidor, accés al Node 0 ni SQL extern.
 * Onada R32.2 · Conserva els pins acceptats (114 d'R30 i 116 d'R32) i afig el 119 del catàleg real
 * (les tres R32, NO aplicades a Producció; 20261116170000 amb set ALTER FUNCTION literals). Cap perfil
 * de 117 no s'accepta: ni l'experimental del kit R32 de Codex ni el catàleg sense les dues R31 originals,
 * perquè ordre_desplegament.json posa 20261116040000 abans de 20261116170000 i de 20261116170200.
 * Onada R32.4 · El 119 es conserva com a perfil històric i s'afig el 120 del catàleg real amb 20261117150000
 * (la pàgina /page/sistema-nervios al registre de copublicació, NO aplicada a cap base).
 * Onada v1.2.7 · El 120 es conserva com a perfil històric i s'afig el 121 amb 20261117140000 (kit R32.5 de Codex:
 * safata i revisió LSSI cautelar, NO aplicada). El 120 del kit (calculat sobre la v1.2.5, sense 20261117150000)
 * no és cap catàleg publicat i no s'accepta. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {creaPlaMigracions} from '../tooling/node0/hidrata-postgres-node0.mjs';
import {comparaVersions} from '../scripts/supabase/verifica-migracions.mjs';
import {verificaEsquemaPosseNodeZero} from '../tooling/node0/posse/instal-la-posse-node0.mjs';
const sql=fs.readFileSync(new URL('../tooling/node0/posse/posse-ledger.sql',import.meta.url),'utf8');
const ordre=JSON.parse(fs.readFileSync(new URL('../supabase/ordre_desplegament.json',import.meta.url),'utf8'));
// El catàleg R32.2 es fixa fins a la darrera R32: una onada posterior no trenca esta instantània.
const rows=creaPlaMigracions().migrations.filter(row=>comparaVersions(row.version,'20261116170200')<=0);
// El catàleg R32.4 es fixa fins a 20261117150000, amb el mateix criteri; 20261117140000 (R32.5), de versió anterior
// però integrada després, no en formava part.
const rows120=creaPlaMigracions().migrations.filter(row=>comparaVersions(row.version,'20261117150000')<=0&&row.version!=='20261117140000');
// El catàleg de la v1.2.7 es fixa també fins a 20261117150000: el 120 d'R32.4 més 20261117140000.
const rows121=creaPlaMigracions().migrations.filter(row=>comparaVersions(row.version,'20261117150000')<=0);
// El catàleg de la v1.2.8 és el complet real: el 121 més 20261117173000 (R32.7) i 20261117193000 (R32.8).
const rows123=creaPlaMigracions().migrations;
// El 120 del kit R32.5 de Codex: els 119 d'R32.2 més 20261117140000, sense 20261117150000.
const kitR325=rows121.filter(row=>row.version!=='20261117150000');
const r32=new Set(['20261116170000','20261116170100','20261116170200']);
const base116=rows.filter(row=>!r32.has(row.version));
const historical=rows.filter(row=>comparaVersions(row.version,'20261115230000')<=0);
const r31Originals={
 '20261116031000_r31_push_sessio_i_revocacio.sql':'5c681904b9e85ab872b5207f1006e9cd9dc8b6a637636c0d3583c0357e7f21d0',
 '20261116040000_r31_definer_search_path.sql':'ec947ff60c7197172fbf90ca3de16f7a1e3aaefb27316123389cca35084bca67'
};
const r31=new Set(rows.filter(row=>Object.hasOwn(r31Originals,row.file)).map(row=>row.version));
// Les tres R32 sense les dues R31: cap ordre vàlid hi arriba.
const senseR31=rows.filter(row=>!r31.has(row.version));
const sha=text=>createHash('sha256').update(text).digest('hex');
// Hash canònic: version TAB file TAB sha256, ordre binari de versions, salt de línia entre files i cap al final.
const ledgerHash=entries=>sha([...entries].sort((a,b)=>Buffer.compare(Buffer.from(a.version),Buffer.from(b.version)))
  .map(({version,file,sha256})=>`${version}\t${file}\t${sha256}`).join('\n'));
const pins=[...sql.match(/-- POSSE_MIGRATION_PINS_BEGIN\n([\s\S]*?)\n-- POSSE_MIGRATION_PINS_END/)[1]
  .matchAll(/\((\d+),'([a-f0-9]{64})'\)/g)].map(([,count,hash])=>`${count}:${hash}`);
const oldPins=[
  '76:091d1e11b6e773c531cb88a5f79d1d932f96d19bc50fca837cbdd1dea30b0260',
  '77:9b021cd927914be1ab8223a976a4b2518a96a0d85f068999aeebd174969dc94e',
  '78:76d70ba0f769ddeda61980e489814adbd318146a00825574879ac985b2be52b1',
  '79:a4c9054de9898e7a7c0de7825f23fde105c9bed77c833fadee69e2a9c5840798',
  '80:6d03b86a5f9236a3d1734b4c52e23752c23b42a19009b666e22b40f0ba14d858',
  '81:2b805488de510fb5c433c238dcf81b14d1b877920c2c4b221c88005c86ee8187',
  '85:c068a25593a05717070adc14f32d9d4c95762d15f3bb3facd7b622c10224ee5b',
  '85:33070384775ba945ca7a464fda17c9cafb450f954fa96585eba1097cc96f857e',
  '86:2dee56621a634f1699b2124a19f35923c82686e18a0b9e2a4fa5c7b762ea2eab',
  '114:9072d6ee39c18ff2156573d2cbf0fa6a815b1e5c4fd3a3073fd158beac3d1fd5',
  '116:34ddc81cbf6670272e99603f985db38f85663f93b901e5ea3b212552b556d589'
];
// 119 recalculat amb causa registrada: set ALTER FUNCTION literals substituïxen l'ALTER dinàmic de 20261116170000.
const PIN119='119:4c3151035be4784842fba08d88e59425a22ed3d89e64016c8dd99c81f08774b2';
// 120 calculat des dels bytes reals del catàleg (els 119 anteriors més 20261117150000), amb el ledgerHash d'esta prova.
const PIN120='120:91dabe476f642579862bffbb10b8d56f946722b8efd65deedf43e7f8fbae9f71';
// 121 calculat des dels bytes reals del catàleg (el 120 d'R32.4 més 20261117140000), amb el ledgerHash d'esta prova.
const PIN121='121:851f46d48edca7e5147c8075469a0f5c46992f7e033ca87996b51fa1df1241e0';
// 123 calculat des dels bytes reals del catàleg (el 121 de la v1.2.7 més les dues de Codex R32.7 i R32.8).
const PIN123='123:1de4ff25c313f242b463d00445377f5692f87b762927a13e1ed20464ab1f0bab';
// Perfil 120 del kit R32.5 de Codex, calculat sobre la v1.2.5 (sense 20261117150000): no és canònic.
const PIN_EXPERIMENTAL_120='120:3e45e1da922cb8a51c43ae23504b4e279eae11f0db7f1046b1f31156800edb85';
// Perfil experimental del kit R32 de Codex, calculat amb la versió anterior de 20261116170000: no és canònic.
const PIN_EXPERIMENTAL_117='117:1d55fe9ef6d0bb1a31aea153f5408699340403a9994d75b5399580eb0b8bc94a';
function ready(entries){
  const functionHashes=Object.fromEntries(['source_current','source_for_bridge','remote_current','assert_current','assert_history','rpc','credential_proof'].map(name=>{
    const start=sql.indexOf(`CREATE OR REPLACE FUNCTION node0_posse.${name}(`),body=sql.indexOf('AS $f$',start),end=sql.indexOf('$f$;',body+6);
    return[name,sha(sql.slice(body+6,end))];
  }));
  return{version:'posse.r11.v1',migrations:entries.length,migrationLedgerSha256:ledgerHash(entries),ownerStable:true,tablesPrivate:true,sourceInstalled:true,remoteInstalled:true,functionHashes};
}
test('R32.2 adds only three R32 sources to HEAD116 and preserves every exact canonical pin',()=>{
 assert.equal(rows.length,119);assert.equal(base116.length,116);assert.equal(historical.length,114);assert.equal(senseR31.length,117);
 assert.deepEqual(base116.filter(row=>Object.hasOwn(r31Originals,row.file)).map(({file,sha256})=>[file,sha256]).sort(),Object.entries(r31Originals).sort());
 assert.equal(ledgerHash(historical),'9072d6ee39c18ff2156573d2cbf0fa6a815b1e5c4fd3a3073fd158beac3d1fd5');
 assert.equal(ledgerHash(base116),'34ddc81cbf6670272e99603f985db38f85663f93b901e5ea3b212552b556d589');
 assert.equal(`119:${ledgerHash(rows)}`,PIN119);
 // Els pins d'R32.2 es conserven en el mateix ordre; les onades posteriors només n'afigen al final.
 assert.deepEqual(pins.slice(0,oldPins.length+1),[...oldPins,PIN119]);
 for(const forbidden of ['20261115231000','20261115233000'])assert.equal(rows.some(row=>row.version===forbidden),false);
 assert.equal(rows.filter(row=>r32.has(row.version)).length,3);
 // Cap perfil de 117 és un pin: ni l'experimental de Codex ni el catàleg real sense les dues R31.
 for(const pin of[PIN_EXPERIMENTAL_117,`117:${ledgerHash(senseR31)}`])assert.equal(pins.includes(pin),false,pin);
 for(const despres of['20261116170000','20261116170200'])assert.ok(ordre.restriccions.some(r=>r.abans==='20261116040000'&&r.despres===despres),`20261116040000 abans de ${despres}`);
 // L'ordre canònic no repetix restriccions: cap consumidor no ha de desduplicar-les.
 const parells=ordre.restriccions.map(r=>`${r.abans}>${r.despres}`);
 assert.equal(new Set(parells).size,parells.length,'restriccions repetides a ordre_desplegament.json');
});
test('R32.4 adds only 20261117150000 to the 119 and pins the exact 120',()=>{
 const nous=rows120.filter(row=>!rows.some(anterior=>anterior.version===row.version));
 assert.equal(rows120.length,120);
 assert.deepEqual(nous.map(({version,file})=>[version,file]),[['20261117150000','20261117150000_r324_copublicacio_pagina_sistema_nervios.sql']]);
 assert.equal(`120:${ledgerHash(rows120)}`,PIN120);
 // Els pins d'R32.4 es conserven en el mateix ordre; les onades posteriors només n'afigen al final.
 assert.deepEqual(pins.slice(0,oldPins.length+2),[...oldPins,PIN119,PIN120]);
 assert.ok(ordre.restriccions.some(r=>r.abans==='2611111735'&&r.despres==='20261117150000'),'2611111735 abans de 20261117150000');
});
test('v1.2.7 adds only the R32.5 LSSI source 20261117140000 to the 120 and pins the exact 121',()=>{
 const nous=rows121.filter(row=>!rows120.some(anterior=>anterior.version===row.version));
 assert.equal(rows121.length,121);
 assert.deepEqual(nous.map(({version,file,sha256})=>[version,file,sha256]),[['20261117140000','20261117140000_r32_5_lssi_revisio_cautelar.sql','82218b186f1ee6becc08f77056efa6ae02808f357da6facb6df03643d74b82c0']]);
 assert.equal(`121:${ledgerHash(rows121)}`,PIN121);
 // Llista exacta de l'onada actual: els onze anteriors, el 119 d'R32.2, el 120 d'R32.4 i el 121 de la v1.2.7.
 assert.deepEqual(pins.slice(0,oldPins.length+3),[...oldPins,PIN119,PIN120,PIN121]);
 // El 120 del kit es reprodueix byte a byte des del catàleg real, però no és cap pin.
 assert.equal(kitR325.length,120);
 assert.equal(`120:${ledgerHash(kitR325)}`,PIN_EXPERIMENTAL_120);
 assert.equal(pins.includes(PIN_EXPERIMENTAL_120),false);
 assert.ok(ordre.restriccions.some(r=>r.abans==='2611122200'&&r.despres==='20261117140000'),'2611122200 abans de 20261117140000');
});
test('v1.2.8 adds only the R32.7 and R32.8 sources to the 121 and pins the exact 123',()=>{
 const nous=rows123.filter(row=>!rows121.some(anterior=>anterior.version===row.version)).map(row=>row.version);
 assert.deepEqual(nous,['20261117173000','20261117193000']);
 assert.equal(rows123.length,123);
 assert.equal(`123:${ledgerHash(rows123)}`,PIN123);
 assert.deepEqual(pins,[...oldPins,PIN119,PIN120,PIN121,PIN123]);
});

test('the real installer accepts 114,116,119,120,121 and rejects exact-count drift, the R32.5 kit 120 and every 117 profile',async()=>{
 for(const entries of[historical,base116,rows,rows120,rows121,rows123])assert.equal(await verificaEsquemaPosseNodeZero({db:{query:async()=>ready(entries)}}),true);
 const corrupt120=structuredClone(rows120);corrupt120.at(-1).sha256='0'.repeat(64);
 for(const state of[ready(corrupt120),{...ready(rows120),migrations:119},{...ready(rows),migrations:120}])await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>state}}),/posse_schema_drift/);
 const corrupt121=structuredClone(rows121);corrupt121.find(row=>row.version==='20261117140000').sha256='0'.repeat(64);
 for(const state of[ready(corrupt121),ready(kitR325),{...ready(rows121),migrations:120},{...ready(rows120),migrations:121}])await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>state}}),/posse_schema_drift/);
 const corrupt=structuredClone(rows);corrupt.find(row=>r32.has(row.version)).sha256='0'.repeat(64);
 const r31Corrupt=structuredClone(rows);r31Corrupt.find(row=>Object.hasOwn(r31Originals,row.file)).sha256='0'.repeat(64);
 const [,experimental]=PIN_EXPERIMENTAL_117.split(':');
 for(const state of[ready(corrupt),ready(r31Corrupt),ready(senseR31),{...ready(rows),migrations:114},{...ready(rows),migrations:116},{...ready(base116),migrations:119},{...ready(historical),migrations:116},{...ready(rows),migrations:117,migrationLedgerSha256:experimental}])await assert.rejects(verificaEsquemaPosseNodeZero({db:{query:async()=>state}}),/posse_schema_drift/);
});
test('PostgreSQL evaluates the actual install guard for both preserved and full ledgers and rejects the 117 without R31',{skip:!process.env.SDP_PGLITE_MODULE&&'Explicit local PGlite required'},async t=>{
  const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);
  const initial=new PGlite();await initial.exec('create database socdepoble_node0');const image=await initial.dumpDataDir('none');await initial.close();
  const db=new PGlite({database:'socdepoble_node0',loadDataDir:image});t.after(()=>db.close());
  await db.exec('create schema node0; create table node0.schema_migrations(version text primary key,file text,sha256 text)');
  const guard=sql.match(/DO \$guard\$[\s\S]*?END \$guard\$;/)[0];
  const carrega=async entries=>{
    await db.exec('truncate node0.schema_migrations');
    for(const {version,file,sha256} of entries)await db.query('insert into node0.schema_migrations values($1,$2,$3)',[version,file,sha256]);
  };
  for(const entries of[historical,base116,rows,rows120,rows121]){
    await carrega(entries);
    await db.exec(guard);
    assert.equal((await db.query('select count(*)::int n from node0.schema_migrations')).rows[0].n,entries.length);
    await db.query("update node0.schema_migrations set sha256=repeat('0',64) where version=$1",[entries.at(-1).version]);
    await assert.rejects(db.exec(guard),/posse_install_guard/);
  }
  await carrega(senseR31);
  await assert.rejects(db.exec(guard),/posse_install_guard/);
  await carrega(kitR325);
  await assert.rejects(db.exec(guard),/posse_install_guard/);
});
