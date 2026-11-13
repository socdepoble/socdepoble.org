// @vitest-environment node
/* R22.1 · Gauntlet r221-dades-03, r221-dades-06 i r221-ui-04 · Prova estàtica
   de 20261113060000_r22_1_hero_video_url.sql contra el client: la columna que
   el client escriu (CAMPS_PERFIL_OPCIONALS d'auth.js, CAMPS_ORG, la fitxa
   local) és la que la migració crea i concedix; la vista, la RPC de l'editor i
   perfil_public en són còpies exactes de les vigents amb hero_video_url al
   final; i el catàleg la nomena. La prova real és
   tests/r22-1-hero-video-url-postgres.test.mjs (PostgreSQL 18.6). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const NOM = '20261113060000_r22_1_hero_video_url.sql';
const llig = (relatiu) => readFileSync(path.join(ARREL, relatiu), 'utf8');
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const SQL = llig(`supabase/migrations/${NOM}`);
const CODI = senseComentaris(SQL);
const llistaDe = (font, re) => [...(re.exec(font)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

/* Les columnes d'una vista o del returns table d'una funció, en ordre. */
const columnesDeLaVista = (codi) => (/create or replace view public\.organization_directory[^\n]*\nas\nselect\n([\s\S]*?)\nfrom public\.organizations\nwhere visibility = 'public';/i
  .exec(codi)?.[1] ?? '').split(',').map((c) => c.trim()).filter(Boolean);
const retornDe = (codi, funcio) => (new RegExp(`create function public\\.${funcio}\\([^)]*\\)\\s*returns table \\(([\\s\\S]*?)\\)\\s*language`, 'i')
  .exec(codi)?.[1] ?? '').split(',').map((c) => c.trim().replace(/\s+/g, ' ')).filter(Boolean);
const cosDe = (codi, funcio) => {
  const inici = codi.search(new RegExp(`create function public\\.${funcio}\\(`, 'i'));
  const cos = codi.slice(codi.indexOf('$$', inici) + 2);
  return cos.slice(0, cos.indexOf('$$')).replace(/\s+/g, ' ').trim();
};

describe('el client i la migració diuen la mateixa columna', () => {
  test('auth.js: hero_video_url és opcional, fora de CAMPS_PERFIL (la paritat de 2610160250 no canvia)', () => {
    const auth = llig('src/data/supabase/auth.js');
    expect(llistaDe(auth, /const CAMPS_PERFIL = Object\.freeze\(\[([^\]]*)\]\);/)).not.toContain('hero_video_url');
    expect(llistaDe(auth, /const CAMPS_PERFIL_OPCIONALS = Object\.freeze\(\[([^\]]*)\]\);/)).toEqual(['hero_video_url']);
    for (const columna of ['hero_video_url']) {
      expect(CODI).toMatch(new RegExp(`alter table public\\.profiles\\s+add column if not exists ${columna} text;`, 'i'));
      expect(CODI).toMatch(new RegExp(`grant update \\(${columna}\\) on table public\\.profiles to authenticated;`, 'i'));
    }
    /* La fitxa local desa el mateix que el remot (sense ella el vídeo es perdia en silenci). */
    const local = llistaDe(llig('src/data/local/compteLocal.js'), /const CAMPS_PERFIL = Object\.freeze\(\[([^\]]*)\]\);/);
    expect([...local].sort()).toEqual([...llistaDe(auth, /const CAMPS_PERFIL = Object\.freeze\(\[([^\]]*)\]\);/), 'hero_video_url'].sort());
  });

  test('organizations: la columna, el seu CHECK, UPDATE a authenticated i SELECT a anon i authenticated, com hero_url', () => {
    expect(CODI).toMatch(/alter table public\.organizations\s+add column if not exists hero_video_url text;/i);
    expect(CODI).toMatch(/grant select \(hero_video_url\) on table public\.organizations to anon, authenticated;/i);
    expect(CODI).toMatch(/grant update \(hero_video_url\) on table public\.organizations to authenticated;/i);
    for (const taula of ['profiles', 'organizations']) {
      expect(CODI).toMatch(new RegExp(`alter table public\\.${taula}\\s+drop constraint if exists ${taula}_hero_video_url_valida;\\s*alter table public\\.${taula}\\s+add constraint ${taula}_hero_video_url_valida check`, 'i'));
    }
    /* Cap permís més ample ni cap retirada; cap anon que escriga. */
    expect(CODI).not.toMatch(/grant (insert|delete|all|update)[^;]*\banon\b/i);
    expect(CODI).not.toMatch(/\brevoke (select|update)\b/i);
    expect(CODI).not.toMatch(/\b(drop column|drop table|truncate|delete from|insert into|update public\.)/i);
    expect(llistaDe(llig('src/data/localPerfils.js'), /const CAMPS_ORG = \[([^\]]*)\]/)).toContain('hero_video_url');
  });

  test('la vista és la de 2610281730 amb hero_video_url al final; COLUMNES_DIRECTORI la demana', () => {
    const anterior = columnesDeLaVista(senseComentaris(llig('supabase/migrations/2610281730_membres_concurrents_i_correu_public.sql')));
    expect(anterior.at(-1)).toBe('correu_public');
    expect(columnesDeLaVista(CODI)).toEqual([...anterior, 'hero_video_url']);
    expect(CODI).toMatch(/revoke all on table public\.organization_directory from public, anon, authenticated;\s*grant select on table public\.organization_directory to anon, authenticated;/i);
    const directori = llig('src/data/supabase/organizations.js');
    expect(llistaDe(directori, /const COLUMNES_DIRECTORI = Object\.freeze\(\[([\s\S]*?)\]\);/)).toContain('hero_video_url');
    expect(/const COLUMNES_ORG = '([^']+)'/.exec(directori)?.[1].split(',')).toContain('hero_video_url');
  });

  test('list_my_organizations i perfil_public: les vigents amb hero_video_url al final, el mateix cos i els mateixos permisos', () => {
    const editor = senseComentaris(llig('supabase/migrations/2610081401_organitzacions_poble.sql'));
    expect(retornDe(CODI, 'list_my_organizations')).toEqual([...retornDe(editor, 'list_my_organizations'), 'hero_video_url text']);
    expect(cosDe(CODI, 'list_my_organizations')).toBe(cosDe(editor, 'list_my_organizations')
      .replace('organization.town_name from', 'organization.town_name, organization.hero_video_url from'));
    expect(CODI).toMatch(/drop function if exists public\.list_my_organizations\(uuid\);\s*create function public\.list_my_organizations/i);
    expect(CODI).toMatch(/revoke execute on function public\.list_my_organizations\(uuid\) from public, anon;\s*grant execute on function public\.list_my_organizations\(uuid\) to authenticated;/i);

    const fitxa = senseComentaris(llig('supabase/migrations/2610282100_usuari_i_poble_canonic.sql'));
    expect(retornDe(CODI, 'perfil_public')).toEqual([...retornDe(fitxa, 'perfil_public'), 'hero_video_url text']);
    expect(cosDe(CODI, 'perfil_public')).toBe(cosDe(fitxa, 'perfil_public')
      .replace('case when d.sencera then p.username end from', 'case when d.sencera then p.username end, case when d.sencera then p.hero_video_url end from'));
    expect(CODI).toMatch(/drop function if exists public\.perfil_public\(uuid\);\s*create function public\.perfil_public/i);
    expect(CODI).toMatch(/revoke execute on function public\.perfil_public\(uuid\) from public, anon;\s*grant execute on function public\.perfil_public\(uuid\) to authenticated;/i);
  });

  test('una transacció, temps d’espera curts, recàrrega de PostgREST i commit; NO aplicada a la capçalera', () => {
    expect(CODI.trimStart()).toMatch(/^begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
    expect(CODI).toMatch(/notify pgrst, 'reload schema';\s*commit;\s*$/i);
    expect(CODI).not.toMatch(/\brollback\b/i);
    expect(SQL).toMatch(/NO aplicada a cap base\s*\n?--\s*remota: l'aplica el Mestre/);
    expect(SQL).toMatch(/Va després de 20261113003000/);
    expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  });
});

describe('el catàleg la nomena', () => {
  test('supabase/README.md: vinyeta després de 20261113003000 i abans de seed.sql, i la fila 101', () => {
    const readme = llig('supabase/README.md');
    const posicio = readme.indexOf(`- \`migrations/${NOM}\``);
    expect(posicio).toBeGreaterThan(readme.indexOf('- `migrations/20261113003000_r21_9b_canal_beta_testers_i_sync_aparadors.sql`'));
    expect(posicio).toBeLessThan(readme.indexOf('- `seed.sql`'));
    const entrada = readme.slice(posicio).split('\n\n').slice(0, 2).join('\n\n');
    expect(entrada).toMatch(/\*\*NO aplicada: l'aplica el Mestre\.\*\*/);
    expect(entrada).toContain('tests/r22-1-hero-video-url-postgres.test.mjs');
    expect(readme).toContain(`| 101 | \`20261113060000\` | \`${NOM}\` |`);
  });

  test('supabase/migrations/README.md: secció R22.1 amb l’ordre manual', () => {
    const readme = llig('supabase/migrations/README.md');
    expect(readme).toMatch(/## R22\.1 · Vídeo principal de capçalera/);
    expect(readme).toContain('`20261113003000` → `20261113060000`');
  });
});
