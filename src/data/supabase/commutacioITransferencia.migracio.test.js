// @vitest-environment node
/* Contracte estàtic complementari. El comportament, RLS i COMMIT s'executen
   en PostgreSQL 17.5 al Lot5/proves/organitzacions.pglite.test.mjs. */
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {test,expect} from 'vitest';
const root=process.cwd(),nom='2610311500_commutacio_grup_empresa_i_transferencia_propietat.sql';
const sql=readFileSync(path.join(root,'supabase/migrations',nom),'utf8');
const funcions=[...sql.matchAll(/create or replace function\s+(\w+\.\w+)\s*\(([^)]*)\)([\s\S]*?)as \$\$([\s\S]*?)\$\$;/gi)].map(m=>({nom:m[1],args:m[2].replace(/\s+/g,' ').trim(),cap:m[3],cos:m[4]}));
const f=n=>funcions.find(f=>f.nom===n);
test('Migració ordenada després dels prerequisits i en una transacció',()=>{
 const noms=readdirSync(path.join(root,'supabase/migrations')).sort();for(const prefix of ['2609080000','2610181915','2610242320','2610250300','2610281730'])expect(noms.indexOf(nom)).toBeGreaterThan(noms.findIndex(n=>n.startsWith(prefix)));
 expect(sql).toMatch(/^begin;/m);expect(sql).toMatch(/commit;\s*$/i);expect(sql.match(/^begin;/gm)).toHaveLength(1);
});
test('Quatre funcions conegudes, sense taules o índexs nous ni retirada de RLS',()=>{
 expect(funcions.map(f=>f.nom).sort()).toEqual(['private.forca_visibilitat_publica_empresa','public.desa_membre_organitzacio','public.lleva_membre_organitzacio','public.transfereix_propietat_organitzacio']);
 const codi=sql.replace(/^--.*$/gm,'');expect(codi).not.toMatch(/(?:create\s+(?:unique\s+)?(?:table|index)|disable\s+(?:row level security|trigger))/i);
});
test('SECURITY DEFINER amb search_path buit i ACL explícites',()=>{
 for(const fn of funcions){expect(fn.cap).toMatch(/security definer/i);expect(fn.cap).toMatch(/set search_path = ''/i);expect(sql).toContain('revoke all on function '+fn.nom);}
 for(const fn of funcions.filter(f=>f.nom.startsWith('public.')))expect(sql).toMatch(new RegExp('grant execute on function '+fn.nom.replaceAll('.','\\.')+'\\([^;]+to authenticated;','i'));
});
test('Guarda de tipus i mare cobreix també UPDATE exclusiu de parent',()=>{
 expect(sql).toMatch(/before insert or update of kind, visibility, parent_organization_id on public.organizations/i);
 const body=f('private.forca_visibilitat_publica_empresa').cos;expect(body).toContain("m.role = 'owner'");expect(body).toContain('private.can_create_group');expect(body).toContain('new.parent_organization_id = new.id');expect(body).toContain('for share');expect(body).toContain("new.visibility := 'public'");expect(body).toContain('new.parent_organization_id := null');
});
test('RPC de transferència conserva signatura i democió abans de promoció',()=>{
 const fn=f('public.transfereix_propietat_organitzacio');expect(fn.args).toBe('p_organization_id uuid, p_nou_owner_id uuid');expect(fn.cos.indexOf("set role = 'admin'")).toBeLessThan(fn.cos.indexOf("set role = 'owner'"));expect(fn.cos).toContain('for update');expect(fn.cos).toContain('pr.baixa_demanada_at is null');
});
test('Pany compartit abans de comprovar autoritat de les RPC existents',()=>{
 for(const nom of ['public.transfereix_propietat_organitzacio','public.desa_membre_organitzacio','public.lleva_membre_organitzacio']){const body=f(nom).cos;expect(body).toContain("'sdp-orgowner:'");const a=body.indexOf('private.can_manage_organization');if(a>=0)expect(body.indexOf("'sdp-orgowner:'")).toBeLessThan(a);}
});
test('Esquema real de membres, sense les columnes o taules fantasma de la guia',()=>{
 const codi=sql.replace(/^--.*$/gm,'');expect(codi).toContain('public.organization_memberships');expect(codi).not.toMatch(/\borganization_members\b|organization_owner_contact|\bowner_user_id\b|\bstatus\b/);expect(codi).toMatch(/notify pgrst, 'reload schema';\s*commit;/);
});
/* Revisió R3 (SQL-01) · Una entitat o un ajuntament només canvia de titular per
   reclamació (resol_reclamacio): la RPC llig el tipus de la fila bloquejada i
   rebutja tot el que no siga grup o empresa abans de tocar cap pertinença. */
test('R3 SQL-01 · la transferència només val per a group i company',()=>{
 const cos=f('public.transfereix_propietat_organitzacio').cos;
 expect(cos).toMatch(/select o\.tenant_id, o\.kind into v_tenant, v_kind\s+from public\.organizations o\s+where o\.id = p_organization_id\s+for update;/);
 const guarda=cos.search(/if v_kind not in \('group','company'\) then\s+raise exception 'SDP-ORGMEM-001: [^;]*reclamaci/);
 expect(guarda).toBeGreaterThan(cos.indexOf("SDP-ORGMEM-006"));
 expect(guarda).toBeLessThan(cos.indexOf("set role = 'admin'"));
});
/* Revisió R3 (SQL-02) · created_by ja no vol dir pertinença després d'una
   transferència: la lectura autenticada torna a ser la de 2609160600 sense
   eixa branca (fila pública, membre real o superadmin). */
test('R3 SQL-02 · orgs_read_auth es torna a crear sense created_by',()=>{
 const codi=sql.replace(/^--.*$/gm,'');
 const m=/drop policy if exists "orgs_read_auth" on public\.organizations;\s*create policy "orgs_read_auth" on public\.organizations\s+for select to authenticated\s+using \(([\s\S]*?)\);\n/.exec(codi);
 expect(m).not.toBeNull();
 const us=m[1];
 expect(us).not.toMatch(/created_by/);
 expect(us).toMatch(/visibility = 'public'/);
 expect(us).toMatch(/exists \(\s*select 1 from public\.organization_memberships m\s+where m\.organization_id = organizations\.id\s+and m\.user_id = \(select auth\.uid\(\)\)\s*\)/);
 expect(us).toMatch(/\(select private\.es_superadmin\(\)\)/);
});
