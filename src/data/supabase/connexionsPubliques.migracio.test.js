import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
const sql = readFileSync('supabase/migrations/2611032100_connexions_publiques_i_membres.sql', 'utf8');
test('FEDI23 · SQL explicita privacitat per defecte, ACL mínimes i autoritat real', () => {
  expect(sql).toContain("default 'privada'");
  expect(sql.match(/enable row level security;/g)).toHaveLength(4);
  expect(sql).toContain('private.can_manage_organization(p_id)');
  expect(sql).toContain('from public.desa_membre_organitzacio(');
  expect(sql).toContain('references public.organization_memberships(organization_id,user_id) on delete cascade');
  expect(sql).toContain('private.connexions_neteja_rol');
  expect(sql).not.toMatch(/grant[^;]+to service_role/i);
  expect(sql).not.toContain('user_metadata');
});
test('DTO públic i petició pendent no projecten correus ni concedixen rols de servidor', () => {
  const publica = sql.slice(sql.indexOf('create or replace function private.connexions_fitxa'), sql.indexOf('create or replace function private.connexions_arestes'));
  expect(publica).not.toMatch(/email|contact_email|owner_user_id|seguidor/);
  const pendent = sql.slice(sql.indexOf('create or replace function public.solicita_unir_se_a_entitat'), sql.indexOf('revoke all on function private.connexions_neteja_rol'));
  expect(pendent).not.toMatch(/insert into public.organization_memberships|set role|user_metadata/);
  expect(pendent).toContain("'estat','pendent'");
});
