/** Rebuild the standalone transaction from immutable sources. No remote connection. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { bundleGuards } from './r32_14_sql_contracte.mjs';
import { cosMigracio } from '../node0/hidrata-postgres-node0.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const sources=[
 'supabase/migrations/20261117173000_r32_7_xat_reaccions_destacats_fixats_amagats.sql',
 'supabase/migrations/20261117193000_r32_8_xat_quota_250mb_video_60s_i_ubicacio.sql',
 'supabase/migrations/20261118230000_a03_xat_push_credencials_per_configuracio.sql',
 'supabase/snippets/r32_10_xat_privades_rls_repara.sql',
 'supabase/snippets/r32_10_fossils_acl_enduriment.sql',
 'supabase/snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql',
 'supabase/migrations/20261119143000_r32_14_xat_fils_previa_sense_amagats.sql'];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=s=>createHash('sha256').update(s).digest('hex');
function adapt(file,sql){
 let body=cosMigracio(sql);
 if(file.includes('r32_10_fossils'))body=body.replace('select * into p from pg_catalog.pg_proc where oid=v_oid;',`if v_oid is null and not exists(select 1 from private.r32_fossils_backup where signature=v.signature)
      and not exists(select 1 from private.r3210_fossils_acl_backup where signature=v.signature) then continue; end if;
    select * into p from pg_catalog.pg_proc where oid=v_oid;`);
 if(file.includes('r32_13_')){
  body=body.replaceAll('create table private.','create table if not exists private.').replaceAll('create function ','create or replace function ').replaceAll('create index r3213_','create index if not exists r3213_');
  for(const name of ['r3213_lssi_insercio','r3213_lssi_decisio']){
   const line=body.split('\n').find(x=>x.startsWith('create trigger '+name+' '));
   if(!line)throw Error('Missing canonical trigger '+name);
   body=body.replace(line,`do $r3214_trigger$ begin
 if not exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.denuncies'::pg_catalog.regclass and tgname='${name}') then
  ${line}
 end if;
end $r3214_trigger$;`);
  }
  body=body.replace("where x.visibility='public' and d.objecte_tipus in('publicacio','producte','esdeveniment');", "where x.visibility='public' and d.objecte_tipus in('publicacio','producte','esdeveniment') on conflict(denuncia_id) do nothing;");
  body=body.replace("from private.r3213_lssi_flux f;", "from private.r3213_lssi_flux f where not exists(select 1 from private.r3213_lssi_audit a where a.denuncia_id=f.denuncia_id);");
 }
 return body;
}
export function generate({contractPath='tooling/migrations/r32_14_sql_postimatges.json'}={}){
 const contract=JSON.parse(read(contractPath));
 const verify=bundleGuards(contract),postVerify=bundleGuards(contract,{post:true});
 return `-- R32.14 · ÚNIC SUPER-BUNDLE PENDENT DE PRODUCCIÓ. Aplicació humana.
-- Una sola transacció: qualsevol dependència absent o deriva desconeguda avorta TOT.
-- Requerix el catàleg previ de producció, no una instal·lació Supabase buida.
-- r32_11_publicacions_cas ja aplicada: es preserva, no es torna a instal·lar.
-- Fòssils inexistents sense backup continuen absents; els presents mantenen pins.
-- R32.13: CREATE IF NOT EXISTS + CREATE OR REPLACE; imports/auditoria sense duplicats.
-- No activa clients, treballadors, DNS ni push. Cap credencial és necessària.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
select pg_catalog.pg_advisory_xact_lock(1935960372,1732140000);
${verify}
${sources.map(file=>{const sql=read(file);return `\n-- SOURCE ${file} SHA256 ${sha(sql)}\n${adapt(file,sql)}`;}).join('\n')}
${postVerify}
notify pgrst,'reload schema';
commit;
`;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const args=process.argv.slice(2);
 if(args.length!==1||!['--check','--stdout'].includes(args[0]))throw Error('Usage: genera-super-bundle-r32_14.mjs --check|--stdout');
 const result=generate(),file=path.join(root,'supabase/snippets/r32_14_super_bundle_produccio_pendent.sql');
 if(args[0]==='--check'){
  if(fs.readFileSync(file,'utf8')!==result)throw Error('Super-bundle stale');
  console.log(JSON.stringify({file,sha256:sha(result),bytes:Buffer.byteLength(result),sources:sources.length}));
 }else process.stdout.write(result);
}
