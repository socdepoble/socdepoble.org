/** Synthetic metadata only. This fixture is not a production capture. */
export function snapshotCase(){
 const row={schema_name:'public',object_name:'fixture',kind:'r',rls_enabled:true,rls_forced:false,reloptions:[],total_bytes:8192,approx_live_rows:0,dead_tuples:0,seq_scans:0,idx_scans:0,last_autovacuum:null,anon_select:false,anon_insert:false,anon_update:false,anon_delete:false,auth_select:true,auth_insert:true,auth_update:true,auth_delete:true};
 return {generated_at_utc:'2026-11-23T00:00:00+00:00',postgres_version:'Synthetic PostgreSQL metadata fixture',r1_taules_sense_rls_en_public:[],r1_vistes_sense_security_invoker:[],r1_inventari_taules_mides_i_files:[row],r2_alertes_politiques_rls:[],r2_total_politiques_auditades:0,r3_security_definers_amb_alerta:[],r3_total_security_definers:0,r4_columnes_exposades_anon:[],r5_fk_sense_index:[],r6_triggers_desactivats:[],r7_storage_buckets_salut:[],r8_integritat_dades_agregada:{auth_users_total:0,profiles_total:0,auth_sense_profile:0,profiles_sense_auth:0,organizations_total:0,notes_total:0,xat_fils_total:0,xat_missatges_total:0,xat_fils_sense_participants:0}};
}
export const clone=value=>JSON.parse(JSON.stringify(value));
