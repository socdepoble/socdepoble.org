// @vitest-environment node
/* P0-01 (ordre del Mestre, 20-10-2026) · Prova estàtica de la migració
   2610181915_organitzacions_correu_i_membres.sql: el correu privat d'una
   organització (`contact_email`) no s'exposa a `anon` ni a `authenticated` en
   cap consulta directa; només el llig qui l'administra, per l'RPC
   contacte_organitzacio. Cap base de dades: es llig el SQL (patró de
   perfilPublicPerDefecte.migracio.test.js). La migració la llança el Mestre. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const NOM = '2610181915_organitzacions_correu_i_membres.sql';
/* P0-01 cap avant (261021): si la versió d'abans de NOM ja consta com a aplicada, l'eina no la repetix. */
const NOU = '2610211715_revoca_correu_organitzacions.sql';
const sensComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const sentencies = (sql) => sensComentaris(sql).split(';').map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
const SENTENCIES = sentencies(readFileSync(path.join(MIGRACIONS, NOM), 'utf8'));
/* Un GRANT de taula sencera (o de totes les taules) de SELECT o ALL a un rol
   públic: un REVOKE de columna no el lleva, i tornaria a exposar contact_email. */
const grantDeTaula = (s) => /^grant\b[^(]*\b(select|all)\b[^(]*\bon (?:(?:table )?(?:public\.)?organizations\b|all tables in schema public\b)/.test(s)
  && /\bto\b.*\b(anon|authenticated|public)\b/.test(s);

/** Els GRANT de SELECT que donen una columna a anon o authenticated. */
const grantsDe = (llista, columna) => llista.filter((s) => s.startsWith('grant select')
  && new RegExp(`\\(([^)]*\\b${columna}\\b[^)]*)\\)`).test(s) && /\bto\b.*\b(anon|authenticated|public)\b/.test(s));

describe('P0-01 · contact_email fora dels rols públics', () => {
  test('cap GRANT de SELECT de contact_email a anon, authenticated ni public', () => {
    expect(grantsDe(SENTENCIES, 'contact_email')).toEqual([]);
    /* public_email sí: és l'opt-in de la fitxa pública. */
    expect(SENTENCIES).toContain('grant select (public_email) on table public.organizations to anon, authenticated');
  });

  test('el REVOKE explícit tanca una base on ja s’haguera aplicat la versió d’abans, i va davant del GRANT', () => {
    const revoke = 'revoke select (contact_email) on table public.organizations from public, anon, authenticated';
    expect(SENTENCIES).toContain(revoke);
    expect(SENTENCIES.indexOf(revoke)).toBeLessThan(SENTENCIES.indexOf('grant select (public_email) on table public.organizations to anon, authenticated'));
  });

  test('el llig només l’RPC contacte_organitzacio, per a qui administra, i mai sense sessió', () => {
    const cos = SENTENCIES.join(';\n');
    expect(cos).toMatch(/create or replace function public\.contacte_organitzacio\(p_organization_id uuid\)[\s\S]*security definer/);
    expect(cos).toMatch(/not private\.can_manage_organization\(p_organization_id\)/);
    expect(SENTENCIES).toContain('revoke execute on function public.contacte_organitzacio(uuid) from public, anon');
    expect(SENTENCIES).toContain('grant execute on function public.contacte_organitzacio(uuid) to authenticated');
  });

  test('cap altra migració dona contact_email a un rol públic', () => {
    const totes = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql'));
    const culpables = totes.filter((f) => {
      const ss = sentencies(readFileSync(path.join(MIGRACIONS, f), 'utf8'));
      return grantsDe(ss, 'contact_email').length > 0 || ss.some(grantDeTaula);
    });
    expect(culpables).toEqual([]);
  });

  test('la migració cap avant 2610211715 només repetix el REVOKE, en una sola transacció, i va després', () => {
    const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
    expect(ordre.indexOf(NOU)).toBeGreaterThan(ordre.indexOf(NOM));
    const cru = readFileSync(path.join(MIGRACIONS, NOU), 'utf8');
    expect(cru).toMatch(/NO aplicada: l'aplica el Mestre, mai un agent/);
    expect(sentencies(cru)).toEqual([
      'begin',
      "set local lock_timeout = '5s'",
      "set local statement_timeout = '60s'",
      'revoke select (contact_email) on table public.organizations from public, anon, authenticated',
      "notify pgrst, 'reload schema'",
      'commit'
    ]);
  });

  test('cap vista ni funció llig contact_email fora de les dues RPC de qui administra', () => {
    const altres = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql') && f !== NOM && f !== NOU);
    expect(altres.filter((f) => /\bcontact_email\b/i.test(sensComentaris(readFileSync(path.join(MIGRACIONS, f), 'utf8'))))).toEqual([]);
    const cru = sensComentaris(readFileSync(path.join(MIGRACIONS, NOM), 'utf8'));
    const cossos = [...cru.matchAll(/create or replace function public\.(\w+)\([\s\S]*?\$\$([\s\S]*?)\$\$/gi)];
    expect(cossos.filter(([, , cos]) => /\bcontact_email\b/i.test(cos)).map(([, nom]) => nom))
      .toEqual(['contacte_organitzacio', 'desa_contacte_organitzacio']);
    expect(sentencies(cru.replace(/\$\$[\s\S]*?\$\$/g, '$$$$')).filter((s) => /\bcontact_email\b/.test(s))).toEqual([
      'alter table public.organizations add column if not exists contact_email text',
      'revoke select (contact_email) on table public.organizations from public, anon, authenticated',
      'grant update (contact_email, public_email) on table public.organizations to authenticated'
    ]);
  });

  test('l’entrada del catàleg supabase/README.md la diu NO aplicada i explica el P0-01', () => {
    const readme = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
    const entrada = readme.slice(readme.indexOf(`migrations/${NOM}`));
    expect(entrada.length).toBeGreaterThan(0);
    const bloc = entrada.slice(0, entrada.indexOf('\n- `migrations/', 1));
    expect(bloc).toMatch(/P0-01/);
    expect(bloc).toMatch(/NO aplicada: l'aplica el Mestre, mai un agent/);
  });

  test('la sonda: el detector veu un GRANT dolent', () => {
    const dolent = sentencies(['grant select (contact_email, public_email) on table public.organizations', ' to anon, authenticated;'].join(''));
    expect(grantsDe(dolent, 'contact_email')).toHaveLength(1);
    const taula = ['grant select on table public.organizations to anon', 'grant all on table public.organizations to anon, authenticated',
      'grant select on all tables in schema public to anon', 'grant insert, select on organizations to authenticated'];
    expect(taula.filter(grantDeTaula)).toEqual(taula);
    expect(grantDeTaula('grant select (public_email) on table public.organizations to anon, authenticated')).toBe(false);
  });
});
