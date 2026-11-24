import {asClient} from './r3246-catalogue-pglite.mjs';
import {sembraStorageR3246,SA,SB,SO,SF,STOWN,sid} from './r3246-storage-casos.mjs';
export {SA,SB,SO,SF,STOWN,sid};
export const SC=sid(4),SD=sid(5),ORG=sid(30),EF=sid(31);
export async function sembraR3264(pg){
 await sembraStorageR3246(pg);
 for(const uid of [SC,SD]){
  await pg.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[uid,`${uid}@example.invalid`,{full_name:'Fixture R3264',tenant_id:STOWN,accepta_rgpd:true}]);
  await pg.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing',[STOWN,uid]);
 }
 await pg.query("insert into public.organizations(id,tenant_id,slug,name,kind,created_by) values($1,$2,'r3264','R3264','entity',$3)",[ORG,STOWN,SA]);
 await pg.query("insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values($1,$4,$2,'admin'),($1,$4,$3,'member') on conflict(organization_id,user_id) do update set role=excluded.role",[ORG,SC,SB,STOWN]);
 await pg.query("insert into public.xat_participants(fil_id,usuari_id,rol) values($1,$2,'admin')",[SF,SD]);
}
export async function enviaR3264(pg,id,{uid=SA,fil=SF,text='Missatge sintètic',meta={}}={}){
 await asClient(pg,{uid},'select * from public.xat_envia($1,$2,$3,$4,null,$5)',[id,fil,'text',text,meta]);
 return id;
}
// Època sintètica de forma vàlida, sense roster ni participants actius: les
// comprovacions reals del trigger i de la CHECK continuen habilitades.
export async function sembraXifratR3264(pg,id){
 await pg.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per) values($1,$2,'grup','E2EE R3264',$3)",[EF,STOWN,SA]);
 await pg.query("insert into public.xat_epoques(fil_id,epoca,declaracio,firma,hash,paquet_hash,autor_id,autor_kid,motiu) values($1,1,decode(repeat('00',360),'hex'),decode(repeat('00',64),'hex'),decode(repeat('00',32),'hex'),decode(repeat('00',32),'hex'),$2,decode(repeat('00',16),'hex'),1)",[EF,SA]);
 await pg.query('update public.xat_fils set epoca_actual=1,cap_epoca_hash=$2,e2ee_des_de_seq=1 where id=$1',[EF,Buffer.alloc(32).toString('base64url')]);
 const b=n=>Buffer.alloc(n).toString('base64url');
 const sobre={v:1,epoca:1,iv:b(12),ct:b(272),kid:b(16),tf:b(32)};
 await pg.query("insert into public.xat_missatges(id,fil_id,usuari_id,text,tipus,versio_xifrat,xifrat,metadades) values($1,$2,$3,null,'text',1,$4,$5)",[id,EF,SA,sobre,{privat:'sintètic'}]);
}
