import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { descobreixConfiguracioPublica, preparaPublicacionsPubliques, projectaDadesPubliques, validaPlaPublic, generaSqlPublic, getPublic, main } from '../tooling/node0/hidrata-publicacions-publiques-node0.mjs';
const base = 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co';
const jwt = (role='anon') => `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({role,ref:'aaaaaaaaaaaaaaaaaaaa',iss:'supabase'})).toString('base64url')}.${'z'.repeat(43)}`;
const entities = ['socdepoble','rentonar','olidelatorre'].map((slug,i) => ({ id:`00000000-0000-4000-8000-00000000000${i}`,slug,name:slug,kind:'company',logo_url:`/assets/${slug}.png`,copyright:'CC BY 4.0',created_at:'2026-11-01T12:00:00Z',updated_at:'2026-11-01T12:00:00Z',owner_user_id:'PRIVATE_OWNER',contact_email:'private@example.invalid',telephone:'PRIVATE_PHONE' }));
const rows = ['towns','feedPosts','events','marketItems'].map(key => ({ key,version:2,payload:[{id:`${key.toLowerCase()}-1`,title:'Publicació del poble',author_org_id:entities[2].id,description:'<script>bad()</script><h3>Text digne</h3><p>&lt;img src=x onerror=evil&gt;</p>',image_url:'/assets/public.png',date:'2026-11-04',time:'17:00',price:'3,50 €',external_url:'https://olidelatorre.com/producte/oli',owner_user_id:'PRIVATE_OWNER',email:'PRIVATE_EMAIL',payload:{role:'admin'}}] }));
const response = (data,type='application/json') => new Response(typeof data==='string'?data:JSON.stringify(data),{headers:{'Content-Type':type}});
function fixture({role='anon',extraConfig='',content=rows,directory=entities}={}) {
  const calls=[];
  const fetchImpl=async(url,opts)=>{
    calls.push({url,opts});
    if(url==='https://socdepoble.org') return response('<script type="module" src="/assets/index-public.js"></script>','text/html');
    if(url==='https://socdepoble.org/assets/index-public.js') return response(`const x={supabaseUrl:"${base}",supabaseAnonKey:"${jwt(role)}",tenantId:"11111111-2222-3333-4444-555555555555"};${extraConfig}`,'text/javascript');
    if(url.startsWith(`${base}/rest/v1/app_content?`)) return response(content);
    if(url.startsWith(`${base}/rest/v1/organization_directory?`)) return response(directory);
    assert.fail('unexpected URL');
  };
  return{fetchImpl,calls};
}
async function prepared(){return(await preparaPublicacionsPubliques(fixture())).plan;}
const clone=v=>JSON.parse(JSON.stringify(v));
const hash=b=>createHash('sha256').update(b).digest('hex');

test('descobrix configuració publicada sense executar JS remot',async()=>{
  const f=fixture({extraConfig:'throw new Error("never execute remote code");'});const config=await descobreixConfiguracioPublica(f);
  assert.equal(config.origin,base);assert.equal(config.tenant,'11111111-2222-3333-4444-555555555555');assert.equal(config.proof.role,'anon');assert.equal(f.calls.length,2);
});
test('clau privilegiada i dos backends candidats fallen tancats',async()=>{
  await assert.rejects(descobreixConfiguracioPublica(fixture({role:'service_role'})),/public_config_ambiguous/);
  await assert.rejects(descobreixConfiguracioPublica(fixture({extraConfig:'const other="https://bbbbbbbbbbbbbbbbbbbb.supabase.co";'})),/public_config_ambiguous/);
});
test('ingesta usa únicament GET anònims, select explícit i cap endpoint personal',async()=>{
  const f=fixture();const {plan}=await preparaPublicacionsPubliques(f);
  assert.equal(validaPlaPublic(plan),7);
  for(const {url,opts} of f.calls){assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');assert.equal(opts.credentials,'omit');assert.equal(/profiles|auth\/|users|rpc\//.test(url),false);assert.equal(url.includes('select=*'),false);}
  assert.equal(JSON.stringify(plan).includes(jwt()),false);assert.match(plan.sources.configuration.anonKeySha256,/^[a-f0-9]{64}$/);
});
test('DTO elimina propietat, correu, telèfon i payload; autoria només entitat verificada',async()=>{
  const plan=await prepared();const serial=JSON.stringify(plan.groups);
  for(const privateValue of ['PRIVATE_OWNER','PRIVATE_EMAIL','PRIVATE_PHONE','private@example.invalid','"payload"','"owner_user_id"','"role"'])assert.equal(serial.includes(privateValue),false,privateValue);
  const p=plan.groups.marketItems[0];assert.equal(p.author_entity_id,'olidelatorre');assert.equal(p.seller,'olidelatorre');assert.equal(p.image_url,'https://socdepoble.org/assets/public.png');
  assert.equal(p.body.includes('bad()'),false);assert.equal(p.content,'<p>Text digne &lt;img src=x onerror=evil&gt;</p>');
  assert.equal(p.provenance.access,'anonymous-public');assert.equal(p.provenance.sourceVersion,2);assert.match(p.provenance.recordSha256,/^[a-f0-9]{64}$/);
});
test('identitat aliena, col·lecció duplicada i valors JSONB malformats rebutjats',async()=>{
  const p=await prepared();const opts={contentProof:p.sources.content,entitiesProof:p.sources.organizations};
  const unverified=clone(rows);unverified[1].payload[0].author_org_id='foreign';assert.throws(()=>projectaDadesPubliques(unverified,entities,opts),/public_document_author_unverified/);
  assert.throws(()=>projectaDadesPubliques([...rows,rows[0]],entities,opts),/public_collection_invalid/);
  const malformed=clone(rows);malformed[0].payload[0].title={toString:0};assert.throws(()=>projectaDadesPubliques(malformed,entities,opts),/public_document_invalid/);
});
test('dies inexistents no es normalitzen a una data inventada',async()=>{
  const p=await prepared();const bad=clone(rows);bad.find(r=>r.key==='events').payload[0].date='2026-02-31';
  const groups=projectaDadesPubliques(bad,entities,{contentProof:p.sources.content,entitiesProof:p.sources.organizations});
  assert.equal('date' in groups.events[0],false);
  p.groups.events[0].date='2026-02-31';assert.throws(()=>validaPlaPublic(p),/public_plan_event_day_invalid/);
});
test('un GET accessible no anul·la una marca explícita de privacitat al payload',async()=>{
  const p=await prepared();
  for(const flags of [{visibility:'private'},{visibility:'unlisted'},{is_public:false},{publicat:false}]){
    const privateRows=clone(rows);Object.assign(privateRows[1].payload[0],flags);
    assert.throws(()=>projectaDadesPubliques(privateRows,entities,{contentProof:p.sources.content,entitiesProof:p.sources.organizations}),/public_document_not_public/);
  }
});
for(const [name,mutate] of [
  ['camp privat',p=>{p.groups.marketItems[0].owner_user_id='secret';}],
  ['visibilitat privada',p=>{p.groups.marketItems[0].visibility='private';}],
  ['autoria inexistent',p=>{p.groups.marketItems[0].author_entity_id='foreign';}],
  ['HTML remot dins content',p=>{p.groups.marketItems[0].content='<img src=x onerror=evil>'; }],
  ['provenance alterada',p=>{p.groups.marketItems[0].provenance.sourceSha256='0'.repeat(64);}],
  ['origen alié',p=>{p.sources.content.url='https://evil.example/api';}],
  ['valor objecte JSONB',p=>{p.groups.marketItems[0].price={x:1};}]
])test(`pla guardat rebutja ${name}`,async()=>{const p=await prepared();mutate(p);assert.throws(()=>validaPlaPublic(p));});
test('SQL només projeccions públiques locals, transacció i tombstones als dos destins',async()=>{
  const sql=generaSqlPublic(await prepared());
  assert.ok(sql.startsWith('BEGIN;'));assert.ok(sql.endsWith('COMMIT;\n'));
  assert.match(sql,/current_database\(\)<>'socdepoble_node0'/);assert.match(sql,/pg_advisory_xact_lock/);
  assert.equal(/(?:INSERT|UPDATE|DELETE|ALTER|CREATE)\s+(?:INTO\s+)?(?:auth\.|public\.organizations|public\.profiles)/i.test(sql),false);
  assert.equal((sql.match(/FROM node0\.tombstones/g)||[]).length,12);
  assert.match(sql,/ON CONFLICT\(tenant_id,key\) DO UPDATE/);assert.match(sql,/rank DESC/);
  assert.match(sql,/OR node0\.public_documents\.source_uri IS DISTINCT FROM EXCLUDED\.source_uri/);
  assert.match(sql,/public_hydration_existing_document_invalid/);
  assert.match(sql,/public_hydration_existing_duplicates/);
});
test('apply exigix pla guardat i empremta; error de màquina no arriba a PostgreSQL',async t=>{
  await assert.rejects(main(['--apply']),/public_apply_saved_plan_required/);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'node0-public-plan-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'plan.json');const bytes=JSON.stringify(await prepared());fs.writeFileSync(file,bytes,{mode:0o600});
  await assert.rejects(main([`--plan=${file}`,'--sha256='+'0'.repeat(64)]),/public_plan_hash_mismatch/);
  const old=os.networkInterfaces;os.networkInterfaces=()=>({lo:[{address:'127.0.0.1'}]});
  try{await assert.rejects(main(['--apply',`--plan=${file}`,`--sha256=${hash(bytes)}`],{env:{},stdout:{write:()=>assert.fail('no apply')}}),/public_apply_wrong_machine/);}finally{os.networkInterfaces=old;}
  let out='';await main([`--plan=${file}`,`--sha256=${hash(bytes)}`],{stdout:{write:s=>{out+=s;}}});assert.equal(JSON.parse(out).applied,false);
});
test('HTTP origen, redireccions i mida es rebutgen abans de generar dades',async()=>{
  await assert.rejects(getPublic('https://evil.example/api',{fetchImpl:()=>assert.fail('no fetch')}),/public_source_origin_rejected/);
  await assert.rejects(getPublic('https://socdepoble.org/',{fetchImpl:async()=>{const r=response('{}');Object.defineProperty(r,'url',{value:'https://evil.example/'});return r;}}),/public_source_http_200/);
  await assert.rejects(getPublic('https://socdepoble.org/',{limit:2,fetchImpl:async()=>response('123')}),/public_source_response_limit/);
});
