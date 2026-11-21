import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {startLocalPostgres} from './r32_25-postgres-local.mjs';
export const MIGRATION='20261121090000_r32_25_push_directes_i_bandols.sql';
export const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
export const MIGRATIONS=['2609080000_initial_schema.sql', '2609080100_xat_v2.sql', '2609080200_xat_v2_correccions.sql', '2609080300_xat_v2_membres.sql', '2609110600_perfil_avatar_i_permisos.sql', '2609121500_correccio_privacitat_perfils.sql', '2609140000_schema_notes.sql', '2609150000_seguretat_profunda_deepseek.sql', '2609200600_xat_limit_correccio.sql', '2609261200_publicacions_autoria.sql', '2609261500_identitat_perfil_f1.sql', '2609262232_copyright_editor.sql', '2609270200_xat_f0_fonament.sql', '2609272200_xat_entitats.sql', '2609282035_perfil_emoticona.sql', '2609282100_xat_de_pagina.sql', '2609291210_xat_cerca_accents.sql', '2610042330_xat_pagina_iaia.sql', '2610081543_xat_consentiment_i_metadades.sql', '2610090100_convergencia_xat_de_pagina.sql', '2610201500_moderacio_denuncies_i_bloquejos.sql', '2610220240_xat_adjunts_i_quota.sql', '2610241400_normes_exigides_ugc.sql', '2610282100_usuari_i_poble_canonic.sql', '2610290400_xat_e2ee_claus_i_sobres.sql', '2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql', '2611020417_xat_avisos_push.sql', '2611030330_politica_privacitat_2_4.sql', '2611080431_xat_push_leases.sql', '2611080432_xat_lliurament_i_presencia.sql', '2609130500_bucket_mitjans.sql', '2609271400_notes_paperera.sql', '2610042350_convergencia_perfil_i_create_organization.sql', '2610061448_superadmin_aal2.sql', '2610081401_organitzacions_poble.sql', '2610241440_baixa_completa_ugc_i_fitxers.sql', '2611011500_autoria_ajuntament_mateix_poble.sql', '2611110100_cua_purga_storage_ugc.sql', '2611111735_copublicacio_registrada.sql', '2611112005_mur_lectura_publica_foraster.sql', '2611112149_mur_estat_public_i_padro.sql', '2611121430_mur_foraster_projeccio_publica_opcio_a.sql', '2611121830_frontera_contingut_editorial_i_notes_privades.sql', '2611121850_mur_text_dates_i_contactes.sql', '2611122200_mur_membres_i_actes_v2.sql'];
export async function database(engine) {
 if(engine==='native'){const c=await startLocalPostgres();return {...c,exec:q=>c.db.query(q),query:(...a)=>c.db.query(...a)};}
 if(!process.env.SDP_PGLITE_MODULE)throw Error('SDP_PGLITE_MODULE obligatori: cap SQL omés');
 const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);
 const base=pathToFileURL(process.env.SDP_PGLITE_MODULE);const {pgcrypto}=await import(new URL('./contrib/pgcrypto.js',base));const {unaccent}=await import(new URL('./contrib/unaccent.js',base));const d=new PGlite({extensions:{pgcrypto,unaccent}});return {exec:q=>d.exec(q),query:(...a)=>d.query(...a),close:()=>d.close()};
}
export async function bootstrap(db) {
 await db.exec(read('tests/fixtures/missatgeria-r21-2/bootstrap-platform.sql'));
 await db.exec(`create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade);`);
 for(const f of MIGRATIONS){try{await db.exec(read('supabase/migrations/'+f));}catch(e){e.message=f+': '+e.message;throw e;}}
}
export const migrate=db=>db.exec(read('supabase/migrations/'+MIGRATION));
export const id=n=>'32250000-0000-4000-8000-'+String(n).padStart(12,'0');
export const T=id(1),T2=id(2),A=id(11),B=id(12),C=id(13),H=id(21),H2=id(22);
export async function actor(db,who,sql,params=[],role='authenticated') {
 await db.exec('begin');try{await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[who??'',role]);await db.exec('set local role '+role);const r=await db.query(sql,params);await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}
}
export async function seed(db) {
 await db.query("insert into public.towns(id,slug,name) values($1,'r3225','Poble de prova'),($2,'r3225-altre','Altre poble')",[T,T2]);
 for(const [who,town]of[[A,T],[B,T],[C,T2]]){
 await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[who,who+'@example.invalid',{full_name:'Persona sintètica '+who,tenant_id:town,accepta_rgpd:true}]);
 await actor(db,who,"select public.accepta_normes_convivencia('2026-10-24')");}
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);
 for(const [org,town]of[[H,T],[H2,T2]])await db.query("insert into public.organizations(id,tenant_id,slug,name,kind,created_by) values($1,$2,$3,'Ajuntament sintètic','city_hall',$4)",[org,town,'ajuntament-'+org,A]);
 await db.exec("insert into private.ajustos(clau,valor) values('push_xat_actiu','si') on conflict(clau)do update set valor=excluded.valor");
}
export const clock=(db,iso)=>db.exec("create or replace function private.avisos_push_ara() returns timestamptz language sql stable set search_path='' as $$select '"+iso+"'::timestamptz$$");
export async function clear(db){await db.exec('delete from private.xat_push_cua;delete from private.avisos_push_bandols_avisats;');}
export async function post(db,n,{org=H,town=T,visibility='public',moderation='visible',labels=['Bàndol urgent'],created=null}={}){
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);
 return db.query("insert into public.section_submissions(id,tenant_id,owner_user_id,author_org_id,section_id,title,payload,visibility,moderation_state,created_at) values($1,$2,$3,$4,'mur','Bàndol sintètic',$5,$6,$7,coalesce($8::timestamptz,private.avisos_push_ara()))",[id(n),town,A,org,{content:'Text públic sintètic',status:'published',visibility:'public',labels},visibility,moderation,created]);
}
export const count=async(db,table)=>Number((await db.query('select count(*) n from '+table)).rows[0].n);
