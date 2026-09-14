import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
const _metaUrl = typeof import.meta.url === 'string' && import.meta.url.startsWith('file:') 
  ? import.meta.url 
  : `file://${import.meta.url}`;
const schema = readFileSync(fileURLToPath(new URL('../../supabase/migrations/260908_0000_initial_schema.sql', _metaUrl)), 'utf-8');

describe('contracte SQL de l’onboarding', () => {
  it.each(['profiles', 'organizations', 'organization_memberships'])('activa RLS a %s', (table) => {
    expect(schema).toContain(`alter table public.${table} enable row level security;`);
  });

  it('manté el perfil personal privat i només llegible pel propietari', () => {
    expect(schema).toContain("visibility text not null default 'private' check (visibility = 'private')");
    expect(schema).toMatch(/create policy "profiles read own"[\s\S]*?id = \(select auth\.uid\(\)\)/);
  });

  it('limita les escriptures a columnes segures i blinda les membresies', () => {
    expect(schema).toContain('revoke all on table public.organizations from anon, authenticated;');
    expect(schema).toContain('revoke all on table public.organization_memberships from anon, authenticated;');
    expect(schema).toMatch(/grant insert \([\s\S]*?created_by[\s\S]*?\) on table public\.organizations to authenticated;/);
    expect(schema).not.toContain('grant insert on table public.organizations to authenticated;');
    expect(schema).not.toMatch(/grant\s+(?:insert|update|delete)[^;]*public\.organization_memberships/i);
  });

  it('crea organitzacions com a invocador sota RLS i amb identitat de sessió', () => {
    const functionBlock = schema.match(/create (?:or replace )?function public\.create_organization[\s\S]*?\n\$\$;/)?.[0] || '';
    expect(functionBlock).toContain('security invoker');
    expect(functionBlock).toContain("set search_path = ''");
    expect(functionBlock).toContain('v_user_id uuid := (select auth.uid())');
    expect(schema).toContain('create policy "members create organizations"');
    expect(schema).toContain('and created_by = (select auth.uid())');
    expect(schema).toContain('after insert on public.organizations');
    expect(schema).toContain("'owner'");
    expect(schema).toContain('grant execute on function public.create_organization(uuid, text, text, text, text, text, uuid) to authenticated;');
  });

  it('el directori públic no exposa la persona creadora', () => {
    const viewBlock = schema.match(/create or replace view public\.organization_directory[\s\S]*?where visibility = 'public';/)?.[0] || '';
    expect(viewBlock).not.toContain('created_by');
    expect(viewBlock).not.toContain('user_id');
  });
});
