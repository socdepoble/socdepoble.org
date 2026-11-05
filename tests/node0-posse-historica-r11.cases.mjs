// Synthetic pure-function tests only; no network, DB, accounts or credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {planificaReconciliacioHistorica} from '../tooling/node0/posse/reconciliacio-historica.mjs';
const bridgeId='00000000-0000-4000-8000-000000000001',remoteAccountIdentity='https://mastodont.cat/users/depoble';
const ref=n=>({tenantId:'ac3bec76-255b-5ca2-8886-28fcceab4267',sectionId:'mur',id:'20000000-0000-4000-8000-'+String(n).padStart(12,'0')});
const canonical=n=>'https://socdepoble.org/mur/synthetic-r9-'+n;
const legacy=n=>'https://socdepoble.net/synthetic-r9-'+n+'/';
const record=(n,patch={})=>({recordId:ref(n),recordRevision:'1',canonicalUrl:canonical(n),primaryCertified:true,...patch});
const mapping=(n,url=legacy(n))=>({legacyUrl:url,recordId:ref(n),canonicalUrl:canonical(n),proofSha256:'a'.repeat(64)});
const entry=(id,links,patch={})=>({id,accountIdentity:remoteAccountIdentity,url:'https://mastodont.cat/@depoble/'+id,links,...patch});
async function plan({records=[record(1)],mappings=[],inventory=[]}={}){
  const result=await planificaReconciliacioHistorica({bridgeId,remoteAccountIdentity,records,mappings,inventory,verifyInventoryEntry:async value=>value});
  assert.equal(result.state,'prepared-plan-only');assert.equal(result.remoteDispatch,false);
  for(const row of result.actions){assert.equal(row.requiresHumanConfirmation,true);assert.equal(row.remoteDispatch,false);assert.equal(row.remoteDraftHashVerified,false);assert.ok(!Object.hasOwn(row,'published'));}
  return result.actions;
}
function existing(row,id){assert.equal(row.action,'review-link-existing');assert.deepEqual(row.existing,[{externalStatusId:id,externalUrl:'https://mastodont.cat/@depoble/'+id}]);}
function ambiguous(rows,ids){assert.ok(rows.every(row=>row.action==='review-ambiguous-match'));if(ids)for(const row of rows)assert.deepEqual(row.existing.map(v=>v.externalStatusId).sort(),ids);}

test('exact certified canonical URL preserves verified remote identity for review',async()=>existing((await plan({inventory:[entry('900',[canonical(1)])]}))[0],'900'));
test('proved legacy alias retains the existing review-only behavior',async()=>existing((await plan({mappings:[mapping(1)],inventory:[entry('900',[legacy(1)])]}))[0],'900'));
test('canonical plus repeated legacy aliases for one record remain one match',async()=>existing((await plan({mappings:[mapping(1),mapping(1)],inventory:[entry('900',[canonical(1),legacy(1),legacy(1)])]}))[0],'900'));
test('a duplicate inventory observation of the same ID and URL is idempotent',async()=>existing((await plan({inventory:[entry('900',[canonical(1)]),entry('900',[canonical(1)])]}))[0],'900'));
test('two record identities claiming one canonical URL require review even with empty inventory',async()=>ambiguous(await plan({records:[record(1),record(2,{canonicalUrl:canonical(1)})]})));
test('canonical collision remains ambiguous when one primary is not certified',async()=>ambiguous(await plan({records:[record(1),record(2,{canonicalUrl:canonical(1),primaryCertified:false})]})));
test('one remote status linking two canonical records cannot auto-link either record',async()=>ambiguous(await plan({records:[record(1),record(2)],inventory:[entry('900',[canonical(1),canonical(2)])]}),['900']));
test('two remote statuses for one canonical publication preserve both IDs for review',async()=>{const rows=await plan({inventory:[entry('900',[canonical(1)]),entry('901',[canonical(1)])]});ambiguous(rows,['900','901']);});
test('two proved legacy owners of the same alias remain ambiguous and preserve observed ID',async()=>ambiguous(await plan({records:[record(1),record(2)],mappings:[mapping(1,legacy(1)),mapping(2,legacy(1))],inventory:[entry('900',[legacy(1)])]}),['900']));
test('legacy alias colliding with another certified canonical URL blocks both identities',async()=>ambiguous(await plan({records:[record(1),record(2)],mappings:[mapping(2,canonical(1))],inventory:[entry('900',[canonical(1)])]}),['900']));
test('duplicate ID with contradictory remote URLs is refused instead of silently overwritten',async()=>assert.rejects(plan({inventory:[entry('900',[canonical(1)]),entry('900',[canonical(1)],{url:'https://mastodont.cat/@depoble/901'})]}),/POSSE_HISTORICAL_PLAN_INVALID/));
test('an uncertified current canonical URL never supplies a match or publication proof',async()=>{const rows=await plan({records:[record(1,{primaryCertified:false})],inventory:[entry('900',[canonical(1)])]});assert.equal(rows[0].action,'stage-needs-primary');assert.deepEqual(rows[0].existing,[]);});
test('an unmatched certified record is only prepared and remains unconfirmed',async()=>{const rows=await plan({inventory:[entry('900',['https://unrelated.example/other'])]});assert.equal(rows[0].action,'prepare-create');assert.deepEqual(rows[0].existing,[]);});
test('inventory from a foreign account is rejected',async()=>assert.rejects(plan({inventory:[entry('900',[canonical(1)],{accountIdentity:'https://other.example/users/foreign'})]}),/POSSE_HISTORICAL_PLAN_INVALID/));
test('an unproved legacy mapping is rejected',async()=>assert.rejects(plan({mappings:[{...mapping(1),proofSha256:'bad'}]}),/POSSE_HISTORICAL_PLAN_INVALID/));
