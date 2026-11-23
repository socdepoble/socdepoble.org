export const sid=n=>`46040000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export const STOWN='ac3bec76-255b-5ca2-8886-28fcceab4267';
export const SA=sid(1),SB=sid(2),SO=sid(3),SF=sid(10);
export async function sembraStorageR3246(pg){
 for(const uid of [SA,SB,SO]){
  await pg.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[uid,`${uid}@example.invalid`,{full_name:'Fixture Storage',tenant_id:STOWN,accepta_rgpd:true}]);
  await pg.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing',[STOWN,uid]);
  await pg.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent()) on conflict do nothing',[uid]);
 }
 await pg.query("insert into public.xat_fils(id,tenant_id,tipus,titol,creat_per) values($1,$2,'grup','Storage R32.46',$3)",[SF,STOWN,SA]);
 await pg.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2),($1,$3)',[SF,SA,SB]);
}
