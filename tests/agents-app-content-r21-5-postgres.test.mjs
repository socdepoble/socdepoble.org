import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { AGENTS } from '../src/data/agentsSeed.js';
import { hidrataCatalegAgents } from '../src/data/catalegAgents.js';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MIGRATION='supabase/migrations/2611121700_purga_agents_app_content_i_hidratacio_canonica.sql';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const id=n=>`25000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const LEGACY=[
  '11111111-1a1a-0001-0000-000000000001','11111111-1a1a-0001-0000-000000000002','11111111-1a1a-0001-0000-000000000003',
  '11111111-1111-4111-a111-000000000009','11111111-1111-4111-a111-000000000003','11111111-1111-4111-a111-000000000004',
  '11111111-1111-4111-a111-000000000005','11111111-1111-4111-a111-000000000008','11111111-1111-4111-a111-000000000007',
  '11111111-0000-0000-0000-000000000004','11111111-1111-4111-a111-000000000010','11111111-1111-4111-a111-000000000011'
];
const REALS=[
  {id:'real-vicent',name:'Vicent',type:'PERSON',personaKey:'AGRONOM',systemPrompt:'Dada antiga sense autoritat',created_at:'2017-01-01T00:00:00Z',unknown:{mime:'image/png',bytes:[0,255]}},
  {id:'real-andreu',name:'Andreu Soler',type:'PERSON',avatar_url:'/real.webp',town_name:'Un altre poble'},
  {id:'real-pepica',name:'Pepica',type:'person',custom:['legítima',{preserva:true}]},
  {id:'real-company',name:'Entitat del poble',type:'COMPANY',custom:{array:[1,2,3],nested:{privat:'conserva'}}},
  {id:'real-company',name:'Una segona fila legítima amb el mateix ID',type:'COMPANY',custom:{no_dedupe:true}},
  {id:'unknown-system',name:'Registre desconegut',type:'SYSTEM',custom:'no authorised purge by type'},
  {id:' SOCDEPOBLE ',name:'Identificador no UUID literal',type:'COMPANY'},
  {id:'ABCDEF11-ABCD-4000-8000-000000000099',name:'Una persona real amb UUID en majúscules',type:'PERSON'}
];

test('R21.5 app_content: purga exacta, hidratació canònica i preservació literal de persones/entitats sobre PG18.6', {timeout:90000},async t=>{
  const cluster=await startLocalPostgres(),db=cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as v")).rows[0].v,'180006');
    await db.query(read('tests/fixtures/missatgeria-r21-2/bootstrap-platform.sql'));
    await db.query(read('supabase/migrations/2609080000_initial_schema.sql'));
    for(let n=1;n<=5;n++)await db.query('insert into public.towns(id,slug,name) values($1,$2,$3)',[id(n),`agents-${n}`,`Poble sintètic ${n}`]);
    const put=(town,key,payload)=>db.query('insert into public.app_content(tenant_id,key,payload,version) values($1,$2,$3::jsonb,41) on conflict(tenant_id,key) do update set payload=excluded.payload',[town,key,JSON.stringify(payload)]);
    const row=async town=>(await db.query("select payload,version,updated_at::text as updated from public.app_content where tenant_id=$1 and key='agents'",[town])).rows[0];
    const snapshot=async()=> (await db.query('select tenant_id,key,payload::text,version,updated_at::text from public.app_content order by tenant_id,key')).rows;
    const sql=read(MIGRATION);t.diagnostic(`${MIGRATION} sha256=${createHash('sha256').update(sql).digest('hex')}`);
    const apply=async()=>{try{await db.query(sql);}catch(error){await db.query('rollback');throw error;}};
    const stale=[{id:'socdepoble',name:'Marca obsoleta',type:'COMPANY',town_name:'Sóc de Poble',private_album:['must disappear on canonical only']},
      {id:'0001',name:'Javi antic',type:'PERSON',town_name:'Incorrecte'},
      {id:'11111111-1a1a-0000-0000-000000000000',name:'IAIA antiga',type:'ANIMAL',short_bio:'Cocinera de Rebost',systemPrompt:'L’Ull i L’Archon'},
      {id:'socdepoble',name:'Duplicat antic',type:'COMPANY'}];
    stale.push({id:'11111111-1A1A-0000-0000-000000000000',name:'IAIA uppercase antiga',type:'ANIMAL'});
    stale.push({id:'\u00A011111111-1A1A-0000-0000-000000000000\u00A0',name:'IAIA amb espais antiga',type:'PERSON'});
    const bots=[...LEGACY.flatMap((legacy,i)=>['PERSON','COMPANY','AI','ANIMAL','OTHER'].map(type=>({id:legacy,name:`Àlies antic ${i}`,type}))),
      ...LEGACY.map(legacy=>({id:legacy.toUpperCase(),name:'Ficció amb UUID en majúscules',type:'PERSON'})),
      {id:'unknown-ai',name:'Vicent',type:' ai '},{id:'unknown-animal',name:'Un personatge',type:'Animal'},
      {id:'unicode-space-ai',name:'Bot',type:'\u00A0\u2003ai\uFEFF'},
      {id:'ascii-space-animal',name:'Bot',type:'\tanimal\n'}];
    await put(id(1),'agents',[...stale,...bots,...REALS]);await put(id(2),'agents',bots);await put(id(3),'agents',[]);
    await put(id(4),'other-key',{preserva:'completament',nested:[1,{a:true}]});
    const accessBefore=(await db.query("select relacl::text,relrowsecurity from pg_class where oid='public.app_content'::regclass")).rows;
    const policiesBefore=(await db.query("select policyname,cmd,roles,qual,with_check from pg_policies where schemaname='public' and tablename='app_content' order by policyname")).rows;
    const realBytes=(await db.query("select e::text as value from public.app_content,jsonb_array_elements(payload) e where tenant_id=$1 and key='agents' and e->>'id' like 'real-%'",[id(1)])).rows;

    await t.test('La fila viva és obsoleta abans del canvi; els tres tenants queden nets després',async()=>{
      assert.equal((await row(id(1))).payload[0].town_name,'Sóc de Poble');await apply();
      for(const town of [id(1),id(2),id(3)]){
        const result=await row(town);assert.deepEqual(result.payload.slice(0,3),AGENTS);
        assert.deepEqual(result.payload.slice(0,3).map(a=>a.id),['socdepoble','0001','11111111-1a1a-0000-0000-000000000000']);
        assert.ok(result.payload.slice(0,3).every(a=>a.town_name==='La Torre de les Maçanes'&&a.created_at==='2026-09-08T00:00:00.000Z'));
        assert.ok(result.payload[2].short_bio.includes('guarda la memòria de casa'));
        assert.ok(!JSON.stringify(result.payload.slice(0,3)).includes('Cocinera'));
        assert.equal(result.version,42);
      }
      assert.equal((await row(id(2))).payload.length,3);assert.equal((await row(id(3))).payload.length,3);
      assert.deepEqual((await row(id(1))).payload,hidrataCatalegAgents([...stale,...bots,...REALS]),'SQL and client agree on identity case and ECMAScript whitespace');
    });
    await t.test('Cap nom, personaKey, duplicat legítim, camp desconegut o entitat real es purga',async()=>{
      assert.deepEqual((await row(id(1))).payload.slice(3),REALS);
      const after=(await db.query("select e::text as value from public.app_content,jsonb_array_elements(payload) e where tenant_id=$1 and key='agents' and e->>'id' like 'real-%'",[id(1)])).rows;
      assert.deepEqual(after,realBytes,'exact same JSONB serialization for every legitimate extra row, including duplicate IDs');
      assert.equal((await row(id(4))),undefined,'no new agents row manufactured for unrelated tenant');
      const other=(await db.query("select payload,version from public.app_content where tenant_id=$1 and key='other-key'",[id(4)])).rows[0];
      assert.deepEqual(other,{payload:{preserva:'completament',nested:[1,{a:true}]},version:41});
    });
    await t.test('Reaplicar és un no-op també per versió, timestamps, ACL i RLS',async()=>{
      const before=await snapshot();await apply();assert.deepEqual(await snapshot(),before);
      assert.deepEqual((await db.query("select relacl::text,relrowsecurity from pg_class where oid='public.app_content'::regclass")).rows,accessBefore);
      assert.deepEqual((await db.query("select policyname,cmd,roles,qual,with_check from pg_policies where schemaname='public' and tablename='app_content' order by policyname")).rows,policiesBefore);
    });
    await t.test('Payload malformat, tipus complex i excés de recursos aborten tot el lot sense exposar valors',async()=>{
      const malformed=[{agents:[]},null,['private-marker'],[null],[[]],[{id:{private:'marker'},name:'No es pot coaccionar',type:'PERSON'}],
        [{id:'complex-name',name:['private-marker'],type:'PERSON'}],[{id:'complex-type',name:'Tipus',type:{private:'marker'}}],
        Array.from({length:4097},(_,n)=>({id:`large-${n}`,name:'Registre',type:'PERSON'})),
        [{id:'huge',name:'Dada gran',type:'PERSON',unknown:'private-marker'+'x'.repeat(2*1024*1024)}]];
      for(const payload of malformed){
        await put(id(5),'agents',payload);await put(id(1),'agents',[...stale,...REALS]);const before=await snapshot();
        await assert.rejects(apply(),error=>error.code==='22023'&&/^SDP-AGENTS-001: 1 fila/.test(error.message)&&!error.message.includes('private-marker'));
        assert.deepEqual(await snapshot(),before,'an invalid tenant rolls back hydration of every other tenant');
        await db.query("delete from public.app_content where tenant_id=$1 and key='agents'",[id(5)]);await apply();
      }
    });
    await t.test('El límit de versió enter no impedix una purga necessària ni es desborda',async()=>{
      await put(id(5),'agents',bots);await db.query("update public.app_content set version=2147483647 where tenant_id=$1 and key='agents'",[id(5)]);
      await apply();const result=await row(id(5));assert.deepEqual(result.payload,AGENTS);assert.equal(result.version,2147483647);
    });
  } finally {await cluster.close();}
});
