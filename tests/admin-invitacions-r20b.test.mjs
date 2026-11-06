import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {creaFixtureR20b} from './fixtures/r20b-municipal-fixture.mjs';
import {CONTRACTE_NUCLI} from '../src/data/contracte.js';
import {preparaClientPrivatNodeZero} from '../src/data/node0/clientPrivatNodeZero.js';
import {compilaOperacioNodeZero} from '../tooling/node0/backend-node0.mjs';
const enabled=Boolean(process.env.SDP_PGLITE_MODULE);
test('Node0 administration contract maps the new invitation RPC and validates responses behind the capability gate',async()=>{
 const tenant='11111111-1111-4111-8111-111111111111',actor='22222222-2222-4222-8222-222222222222',person='33333333-3333-4333-8333-333333333333',org='44444444-4444-4444-8444-444444444444',invitationId='55555555-5555-4555-8555-555555555555',at='2026-11-06T00:00:00Z';
 const calls=[],status={node:'node0',postgresql:{ok:true},capabilities:{userSessions:true,actorBinding:true,administracioUsuaris:false}};
 const publicAdapter={...Object.fromEntries(CONTRACTE_NUCLI.map(name=>[name,()=>{}])),configuracio:{backendId:'sdp-node0-http',backendUrl:'https://example.invalid/api/v1/node0',tenantId:tenant},lligEstatNodeZero:async()=>status};
 const value={invitacioId:invitationId,usuariId:person,organitzacioId:org,rol:'member',estat:'pendent',caducaAl:at};
 let response=value;
 const transport={demanaAuth:async()=>({user:{id:actor,email:'actor@example.invalid',email_confirmed_at:at}}),demanaPrivat:async(action,body,config)=>{calls.push({action,body,config});return response;}};
 const off=await preparaClientPrivatNodeZero({publicAdapter,transport,habilitaPrivat:true,emetCanvi:()=>{}});assert.equal(off.adapter.adminAssignaMembreOrganitzacio,undefined);
 status.capabilities.administracioUsuaris=true;const on=await preparaClientPrivatNodeZero({publicAdapter,transport,habilitaPrivat:true,emetCanvi:()=>{}});
 assert.deepEqual(await on.adapter.adminAssignaMembreOrganitzacio({usuariId:person,organitzacioId:org}),value);
 assert.deepEqual(calls[0],{action:'adminAssignaMembreOrganitzacio',body:{entrada:{usuariId:person,organitzacioId:org}},config:{expectedActor:actor}});
 response={...value,rol:'admin'};await assert.rejects(on.adapter.adminAssignaMembreOrganitzacio({usuariId:person,organitzacioId:org}));
 const compiled=compilaOperacioNodeZero('adminAssignaMembreOrganitzacio',{entrada:{usuariId:person,organitzacioId:org}},tenant);assert.match(compiled,/public\.admin_convida_a_entitat/);assert.doesNotMatch(compiled,/admin_assigna_membre/);
 assert.match(compilaOperacioNodeZero('adminLlistaUsuarisRegistrats',{entrada:{limit:1,cursorCreat:at,cursorId:person}},tenant),/admin_llista_usuaris_registrats/);
 assert.throws(()=>compilaOperacioNodeZero('adminAssignaMembreOrganitzacio',{entrada:{usuariId:person,organitzacioId:org,rol:'admin'}},tenant));
});
test('R20b76→77: invitations, consent, audit and private entity chat boundary',{skip:!enabled&&'Explicit local PGlite required'},async t=>{
 const f=await creaFixtureR20b();let owner,attacker,victim,org,fil,invitation;
 const invite=(actor,person,organization=org)=>f.as(actor,'SELECT public.admin_convida_a_entitat($1,$2,$3) AS value',[f.tenantId,person,organization]).then(r=>r[0].value);
 const reply=(actor,id,accept=true)=>f.as(actor,'SELECT public.respon_invitacio_admin($1,$2) AS value',[id,accept]).then(r=>r[0].value);
 const membership=async(person,organization=org)=>(await f.pg.query('SELECT role FROM public.organization_memberships WHERE organization_id=$1 AND user_id=$2',[organization,person])).rows[0]?.role??null;
 const list=(actor,limit=25,cursor=null,tenant=f.tenantId)=>f.as(actor,'SELECT public.admin_llista_usuaris_registrats($1,$2,$3,$4) AS value',[tenant,cursor?.created_at??null,cursor?.id??null,limit]).then(r=>r[0].value);
 const messages=actor=>f.as(actor,'SELECT text FROM public.xat_missatges WHERE fil_id=$1',[fil]);
 try{
  await t.test('real baseline76 is unchanged; proposed SQL77 installs through the shipping ledger',async()=>{
   assert.equal(await f.count(),76);
   const before=(await f.pg.query("SELECT pg_get_functiondef('private.can_manage_organization(uuid)'::regprocedure) AS source")).rows[0].source;
   await f.phase(['2611052345']);assert.equal(await f.count(),77);
   const after=(await f.pg.query("SELECT pg_get_functiondef('private.can_manage_organization(uuid)'::regprocedure) AS source")).rows[0].source;
   assert.equal(createHash('sha256').update(before).digest('hex'),createHash('sha256').update(after).digest('hex'));
   owner=await f.person('r20b-owner',{admin:true});attacker=await f.person('r20b-attacker',{admin:true});victim=await f.person('r20b-victim');org=await f.organization(owner,'r20b-organization');
   fil=(await f.as(victim,'SELECT public.crea_fil_directe($1,$2,null) AS id',[f.tenantId,org]))[0].id;
   await f.as(victim,"SELECT * FROM public.xat_envia($1,$2,'text','R20B-PRIVATE-SYNTHETIC',null,'{}')",[randomUUID(),fil]);
   assert.equal((await messages(victim))[0]?.text,'R20B-PRIVATE-SYNTHETIC');assert.equal((await messages(owner))[0]?.text,'R20B-PRIVATE-SYNTHETIC');
  });
  await t.test('K3-02 after fix: self-assignment and admin/editor cannot expose a private message',async()=>{
   assert.deepEqual(await messages(attacker),[]);
   for(const rol of ['admin','editor','membre'])await assert.rejects(f.as(attacker,'SELECT public.admin_assigna_membre_organitzacio($1,$2,$3,$4,false)',[f.tenantId,attacker,org,rol]),e=>e.code==='42501');
   await assert.rejects(invite(attacker,victim),e=>e.code==='42501'&&e.message.includes('SDP-ORGMEM-002'));
   assert.equal(await membership(attacker),null);assert.deepEqual(await messages(attacker),[]);
   assert.equal((await f.pg.query('SELECT count(*)::int AS n FROM public.xat_participants WHERE fil_id=$1 AND usuari_id=$2',[fil,attacker])).rows[0].n,0);
  });
  await t.test('anon, service_role, ordinary user and superadmin aal1 are denied before the administration surface',async()=>{
   for(const role of ['anon','service_role'])await assert.rejects(f.as(null,'SELECT public.admin_llista_usuaris_registrats($1)',[f.tenantId],{role}),e=>e.code==='42501');
   await assert.rejects(list(victim),e=>e.code==='42501');
   await assert.rejects(f.as(owner,'SELECT public.admin_llista_usuaris_registrats($1)',[f.tenantId],{aal:'aal1'}),e=>e.code==='42501');
   for(const table of ['admin_accions','admin_invitacions'])for(const role of ['anon','authenticated','service_role']){
    assert.equal((await f.pg.query('SELECT relrowsecurity AS rls FROM pg_class WHERE oid=$1::regclass',[`private.${table}`])).rows[0].rls,true);
    for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal((await f.pg.query('SELECT has_table_privilege($1,$2,$3) AS allowed',[role,`private.${table}`,privilege])).rows[0].allowed,false);
   }
  });
  await t.test('profile list uses consent and tenant filters, cursor≤50 and masked email only',async()=>{
   const noConsent=await f.person('r20b-no-consent',{consent:false}),withdrawn=await f.person('r20b-withdrawn');
   await f.as(withdrawn,"SELECT public.demana_baixa('Synthetic withdrawal')");
   const otherTenant=randomUUID();await f.pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'r20b-other','Other R20b')",[otherTenant]);
   const other=await f.person('r20b-other-town',{tenant:otherTenant});
   const rows=await list(owner);assert.ok(rows.some(r=>r.id===victim));
   for(const id of [noConsent,withdrawn,other])assert.equal(rows.some(r=>r.id===id),false);
   for(const row of rows){assert.equal(row.consentiment,true);assert.equal(row.baixa,false);assert.equal(row.email,undefined);assert.match(row.correu_mascarat,/^r\*\*\*@example[.]invalid$/);}
   const first=await list(owner,1),second=await list(owner,1,first[0]);assert.equal(first.length,1);assert.equal(second.length,1);assert.notEqual(first[0].id,second[0].id);
   await assert.rejects(list(owner,51),e=>e.code==='22023');
   await assert.rejects(f.as(owner,'SELECT public.admin_llista_usuaris_registrats($1,null,$2,25)',[f.tenantId,victim]),e=>e.code==='22023');
   await assert.rejects(invite(owner,noConsent),e=>e.code==='22023');await assert.rejects(invite(owner,withdrawn),e=>e.code==='22023');await assert.rejects(invite(owner,other),e=>e.code==='22023');
  });
  await t.test('inviting creates no membership; only the named recipient may accept',async()=>{
   invitation=await invite(owner,attacker);assert.equal(invitation.rol,'member');assert.equal(invitation.estat,'pendent');assert.equal(await membership(attacker),null);
   assert.equal((await invite(owner,attacker)).invitacioId,invitation.invitacioId,'idempotent pending invitation');
   await assert.rejects(reply(victim,invitation.invitacioId),e=>e.code==='42501');
   const incoming=(await f.as(attacker,'SELECT public.les_meues_invitacions_admin($1) AS value',[f.tenantId]))[0].value;
   assert.equal(incoming.length,1);assert.equal(incoming[0].invitacioId,invitation.invitacioId);
   assert.equal((await reply(attacker,invitation.invitacioId)).acceptada,true);assert.equal(await membership(attacker),'member');
   assert.deepEqual(await messages(attacker),[],'consenting member acceptance must not confer entity-manager chat access');
  });
  await t.test('accepted replay never reinstates a member removed by the real owner',async()=>{
   await f.as(owner,"SELECT * FROM public.lleva_membre_organitzacio($1,$2,'persona')",[org,attacker]);assert.equal(await membership(attacker),null);
   assert.equal((await reply(attacker,invitation.invitacioId)).estat,'acceptada');assert.equal(await membership(attacker),null);assert.deepEqual(await messages(attacker),[]);
  });
  await t.test('rejecting or an expired invitation creates no membership',async()=>{
   const recipient=await f.person('r20b-decline'),i=await invite(owner,recipient);assert.equal((await reply(recipient,i.invitacioId,false)).estat,'rebutjada');assert.equal(await membership(recipient),null);
   const expired=await invite(owner,recipient);
   // Only the fixture clock boundary changes; no authority/check is replaced.
   await f.pg.query("UPDATE private.admin_invitacions SET creada_al=clock_timestamp()-interval '15 days',caduca_al=clock_timestamp()-interval '1 day' WHERE id=$1",[expired.invitacioId]);
   assert.equal((await reply(recipient,expired.invitacioId)).estat,'caducada');assert.equal(await membership(recipient),null);
  });
  await t.test('consent withdrawal and sender role revocation are rechecked at acceptance',async()=>{
   const recipient=await f.person('r20b-consent-revocation'),i=await invite(owner,recipient);
   await f.as(recipient,"SELECT public.revoca_consentiment('rgpd_acepta')");await assert.rejects(reply(recipient,i.invitacioId),e=>e.code==='42501');assert.equal(await membership(recipient),null);
   await f.as(recipient,"SELECT public.registra_consentiment('rgpd_acepta',null)");
   await f.pg.query('DELETE FROM public.user_platform_roles WHERE user_id=$1',[owner]);assert.equal((await reply(recipient,i.invitacioId)).estat,'revocada');assert.equal(await membership(recipient),null);
   await f.pg.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin')",[owner]);
  });
  await t.test('canonical SDP-ORGMEM-006 and organization-authority revocation remain effective',async()=>{
   const helper=await f.person('r20b-helper',{admin:true}),recipient=await f.person('r20b-helper-recipient');
   await f.as(owner,"SELECT * FROM public.desa_membre_organitzacio($1,$2,'persona','admin')",[org,helper]);
   await assert.rejects(f.as(helper,"SELECT * FROM public.desa_membre_organitzacio($1,$2,'persona','admin')",[org,recipient]),e=>e.code==='42501'&&e.message.includes('SDP-ORGMEM-006'));
   const i=await invite(helper,recipient);await f.as(owner,"SELECT * FROM public.lleva_membre_organitzacio($1,$2,'persona')",[org,helper]);
   assert.equal((await reply(recipient,i.invitacioId)).estat,'revocada');assert.equal(await membership(recipient),null);
  });
  await t.test('sender consent is required at proposal and acceptance; expiration and quota are audited atomically',async()=>{
   const recipient=await f.person('r20b-sender-consent'),i=await invite(owner,recipient);
   await f.as(owner,"SELECT public.revoca_consentiment('rgpd_acepta')");
   await assert.rejects(invite(owner,victim),e=>e.code==='42501');assert.equal((await reply(recipient,i.invitacioId)).estat,'revocada');assert.equal(await membership(recipient),null);
   await f.as(owner,"SELECT public.registra_consentiment('rgpd_acepta',null)");
   const expired=await invite(owner,recipient);
   await f.pg.query("UPDATE private.admin_invitacions SET creada_al=clock_timestamp()-interval '15 days',caduca_al=clock_timestamp()-interval '1 day' WHERE id=$1",[expired.invitacioId]);
   const replacement=await invite(owner,recipient);assert.notEqual(replacement.invitacioId,expired.invitacioId);
   assert.equal((await f.pg.query("SELECT count(*)::int AS n FROM private.admin_accions WHERE accio='caduca_invitacio' AND detall->>'invitacioId'=$1",[expired.invitacioId])).rows[0].n,1);
   let pending=(await f.pg.query("SELECT count(*)::int AS n FROM private.admin_invitacions WHERE creada_per=$1 AND estat='pendent'",[owner])).rows[0].n;
   while(pending<20){const target=await f.person('r20b-quota-'+pending);await invite(owner,target);pending++;}
   const extra=await f.person('r20b-quota-overflow'),before=(await f.pg.query('SELECT count(*)::int AS n FROM private.admin_accions')).rows[0].n;
   await assert.rejects(invite(owner,extra),e=>e.code==='54000');assert.equal(await membership(extra),null);
   assert.equal((await f.pg.query('SELECT count(*)::int AS n FROM private.admin_accions')).rows[0].n,before,'failed invitation has neither partial write nor audit success');
  });
  await t.test('writes append audit rows in the same transaction; audit rows cannot be rewritten or deleted',async()=>{
   const rows=(await f.pg.query('SELECT actor,accio,detall FROM private.admin_accions ORDER BY id')).rows;
   for(const action of ['llista_usuaris','convida_membre','respon_invitacio'])assert.ok(rows.some(r=>r.accio===action));
   assert.ok(!JSON.stringify(rows).includes('@example.invalid'));
   await assert.rejects(f.pg.exec("UPDATE private.admin_accions SET accio='forged'"),e=>e.code==='42501');
   await assert.rejects(f.pg.exec('DELETE FROM private.admin_accions'),e=>e.code==='42501');
   assert.equal((await f.pg.query('SELECT count(*)::int AS n FROM private.admin_accions')).rows[0].n,rows.length);
  });
  await t.test('G2-02: an ordinary owner keeps a non-member superadmin out of the private entity chat',async()=>{
   const plainOwner=await f.person('g2-plain-owner'),outsider=await f.person('g2-outsider',{admin:true}),neighbour=await f.person('g2-neighbour');
   const plainOrg=await f.organization(plainOwner,'g2-plain-organization');
   const plainFil=(await f.as(neighbour,'SELECT public.crea_fil_directe($1,$2,null) AS id',[f.tenantId,plainOrg]))[0].id;
   await f.as(neighbour,"SELECT * FROM public.xat_envia($1,$2,'text','G2-PRIVATE-SYNTHETIC',null,'{}')",[randomUUID(),plainFil]);
   const read=uid=>f.as(uid,'SELECT text FROM public.xat_missatges WHERE fil_id=$1',[plainFil]);
   assert.equal((await read(plainOwner))[0]?.text,'G2-PRIVATE-SYNTHETIC');
   for(const rol of ['admin','owner','editor','membre'])await assert.rejects(f.as(outsider,'SELECT public.admin_assigna_membre_organitzacio($1,$2,$3,$4,false)',[f.tenantId,outsider,plainOrg,rol]),e=>e.code==='42501');
   await assert.rejects(invite(outsider,outsider,plainOrg),e=>e.code==='42501');
   await assert.rejects(invite(outsider,neighbour,plainOrg),e=>e.code==='42501'&&e.message.includes('SDP-ORGMEM-002'));
   await assert.rejects(f.as(outsider,"INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'admin')",[plainOrg,f.tenantId,outsider]),e=>e.code==='42501');
   await assert.rejects(f.as(outsider,"INSERT INTO private.admin_invitacions(tenant_id,persona,organitzacio,creada_per,estat) VALUES($1,$2,$3,$4,'acceptada')",[f.tenantId,outsider,plainOrg,plainOwner]),e=>e.code==='42501');
   assert.equal(await membership(outsider,plainOrg),null);assert.deepEqual(await read(outsider),[]);
   assert.equal((await f.pg.query('SELECT count(*)::int AS n FROM public.xat_participants WHERE fil_id=$1 AND usuari_id=$2',[plainFil,outsider])).rows[0].n,0);
  });
  await t.test('G2-03: invitations never block the RGPD purge of senders or organization owners',async()=>{
   const purge=async uid=>{await f.as(uid,"SELECT public.demana_baixa('Synthetic G2 purge')");await f.pg.query("UPDATE private.baixes SET purga_prevista_al=now()-interval '1 day' WHERE user_id=$1",[uid]);return (await f.pg.query('SELECT private.purga_una_baixa($1) AS done',[uid])).rows[0].done;};
   const gone=async uid=>(await f.pg.query('SELECT count(*)::int AS n FROM auth.users WHERE id=$1',[uid])).rows[0].n===0;
   const soleOwner=await f.person('g2-sole-owner',{admin:true}),soleOrg=await f.organization(soleOwner,'g2-sole-organization'),declined=await f.person('g2-declined');
   const a=await invite(soleOwner,declined,soleOrg);await reply(declined,a.invitacioId,false);
   const sender=await f.person('g2-sender',{admin:true}),accepted=await f.person('g2-accepted');
   await f.as(owner,"SELECT * FROM public.desa_membre_organitzacio($1,$2,'persona','admin')",[org,sender]);
   const b=await invite(sender,accepted);await reply(accepted,b.invitacioId,true);
   const plainOwner=await f.person('g2-purged-owner'),plainOrg=await f.organization(plainOwner,'g2-purged-organization'),helper=await f.person('g2-purge-helper',{admin:true}),other=await f.person('g2-purge-other');
   await f.as(plainOwner,"SELECT * FROM public.desa_membre_organitzacio($1,$2,'persona','admin')",[plainOrg,helper]);
   const c=await invite(helper,other,plainOrg);await reply(other,c.invitacioId,false);
   await f.as(plainOwner,"SELECT * FROM public.lleva_membre_organitzacio($1,$2,'persona')",[plainOrg,helper]);
   for(const uid of [soleOwner,sender,plainOwner]){assert.equal(await purge(uid),true);assert.equal(await gone(uid),true);}
   assert.equal(await membership(accepted),'member','the accepted membership survives the sender purge');
   assert.equal((await f.pg.query('SELECT count(*)::int AS n FROM private.admin_invitacions WHERE id = ANY($1::uuid[])',[[a.invitacioId,b.invitacioId,c.invitacioId]])).rows[0].n,0);
   assert.ok((await f.pg.query("SELECT count(*)::int AS n FROM private.admin_accions WHERE accio='respon_invitacio' AND detall->>'invitacioId' = ANY($1::text[])",[[a.invitacioId,b.invitacioId,c.invitacioId]])).rows[0].n>=3,'the append-only audit keeps the answers');
  });
 }finally{await f.close();}
});
