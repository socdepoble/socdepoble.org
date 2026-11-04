// @vitest-environment node
/* Contracte estàtic: esta suite no executa PostgreSQL ni aplica la migració. */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const llig = nom => readFileSync(`supabase/migrations/${nom}`, 'utf8').replace(/--[^\n]*/g, '');
const actual = llig('2611031500_notes_logo_mode_nit.sql');
const anterior = llig('2610072230_mur_imatges_propies.sql');
const neteja = sql => sql.match(/create or replace function private\.mur_neteja_imatges\([\s\S]*?\$\$;/)?.[0];

test('IDEA70-02 · columna additiva i la mateixa neteja del trigger amb el camp de nit', () => {
  expect(actual).toMatch(/^begin;/m);
  expect(actual).toMatch(/^commit;/m);
  expect(actual).toContain('alter table public.notes add column if not exists logo_image_dark text;');
  expect(neteja(anterior)).toBeTruthy();
  expect(neteja(actual)).toBe(neteja(anterior).replace("'logo_image']", "'logo_image', 'logo_image_dark']"));
  expect(anterior).toContain('new.payload := private.mur_neteja_imatges(new.payload, private.origens_mitjans_propis());');
  expect(anterior).toMatch(/when \(new\.section_id in \('mur', 'mercat', 'events'\)\)/);
});

test('conserva origen, revocacions i abast; no amplia RLS ni reescriu files publicades', () => {
  expect(actual).toContain('private.mur_imatge_propia(v_payload -> v_clau, p_origens)');
  expect(actual).toContain("set search_path = ''");
  expect(actual).toContain('revoke execute on function private.mur_neteja_imatges(jsonb, text[]) from public, anon, authenticated;');
  expect(actual).not.toMatch(/\bgrant\b|\bpolicy\b|\bsecurity definer\b|\bdrop trigger\b|\bcreate trigger\b/i);
  expect(actual).not.toMatch(/\bupdate\s+public\.|\bdelete\s+from\s+public\./i);
  expect(actual).not.toMatch(/create or replace function private\.(?:mur_imatge_propia|origens_mitjans_propis|trg_mur_imatges_propies)\(/);
  expect(actual).toContain("notify pgrst, 'reload schema';");
});
