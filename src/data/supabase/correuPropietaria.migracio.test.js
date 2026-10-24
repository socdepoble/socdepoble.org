// @vitest-environment node
/* C11-02 (auditoria Codex 261024_2254, CWE-200; full de ruta P1-11 del
   Mestre, 261024) · Prova estàtica de la migració
   2610242320_correu_propietaria_nomes_titular.sql: el correu d'accés de la
   propietària (auth.users.email) només el rep ella mateixa
   (m.user_id = v_uid); la resta del contracte de contacte_organitzacio és el
   de 2610181915, byte a byte llevat d'eixa condició. Cap base de dades: es
   llig el SQL (patró d'organitzacionsCorreu.migracio.test.js). La migració la
   llança el Mestre. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const NOM = '2610242320_correu_propietaria_nomes_titular.sql';
const ORIGINAL = '2610181915_organitzacions_correu_i_membres.sql';
const llig = (nom) => readFileSync(path.join(MIGRACIONS, nom), 'utf8');
const sensComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const normal = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const sentencies = (sql) => sensComentaris(sql).replace(/\$\$[\s\S]*?\$\$/g, '$$$$').split(';').map(normal).filter(Boolean);
/** La definició sencera (capçalera i cos) d'una funció, normalitzada. */
const definicio = (sql, funcio) => {
  const trobada = new RegExp(`create or replace function public\\.${funcio}\\([\\s\\S]*?\\$\\$[\\s\\S]*?\\$\\$`, 'i').exec(sensComentaris(sql));
  return trobada ? normal(trobada[0]) : null;
};

describe('C11-02 · el correu d’accés de la propietària, només per a ella', () => {
  test('va després de 2610181915 i de 2610211715, i es diu NO aplicada', () => {
    const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
    expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf(ORIGINAL));
    expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610211715_revoca_correu_organitzacions.sql'));
    expect(llig(NOM)).toMatch(/NO aplicada: l'aplica el Mestre, mai un agent/);
  });

  test('la lectura d’auth.users exigix que la propietària siga qui mira', () => {
    const nova = definicio(llig(NOM), 'contacte_organitzacio');
    expect(nova).toMatch(/join auth\.users u on u\.id = m\.user_id where m\.organization_id = p_organization_id and m\.role = 'owner' and m\.user_id = v_uid limit 1/);
    expect(nova).toMatch(/v_uid uuid := \(select auth\.uid\(\)\)/);
  });

  test('la resta del contracte és el de 2610181915: només hi afig la condició', () => {
    const nova = definicio(llig(NOM), 'contacte_organitzacio');
    const antiga = definicio(llig(ORIGINAL), 'contacte_organitzacio');
    expect(antiga).not.toBeNull();
    expect(nova).toBe(antiga.replace("and m.role = 'owner' limit 1", "and m.role = 'owner' and m.user_id = v_uid limit 1"));
    expect(nova).toMatch(/security definer stable set search_path = ''/);
  });

  test('una sola transacció: la funció, els mateixos permisos d’execució i res més', () => {
    expect(sentencies(llig(NOM))).toEqual([
      'begin',
      "set local lock_timeout = '5s'",
      "set local statement_timeout = '60s'",
      expect.stringMatching(/^create or replace function public\.contacte_organitzacio\(p_organization_id uuid\)/),
      'revoke execute on function public.contacte_organitzacio(uuid) from public, anon',
      'grant execute on function public.contacte_organitzacio(uuid) to authenticated',
      "notify pgrst, 'reload schema'",
      'commit'
    ]);
    /* desa_contacte_organitzacio no es torna a crear: crida esta funció i hereta la correcció. */
    expect(definicio(llig(NOM), 'desa_contacte_organitzacio')).toBeNull();
    expect(definicio(llig(ORIGINAL), 'desa_contacte_organitzacio')).toMatch(/select \* from public\.contacte_organitzacio\(p_organization_id\)/);
  });

  test('l’entrada del catàleg supabase/README.md la diu NO aplicada i explica el C11-02', () => {
    const readme = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
    const inici = readme.indexOf(`migrations/${NOM}`);
    expect(inici).toBeGreaterThan(-1);
    const entrada = readme.slice(inici);
    const bloc = entrada.slice(0, entrada.indexOf('\n- `', 1));
    expect(bloc).toMatch(/C11-02/);
    expect(bloc).toMatch(/NO aplicada: l'aplica el Mestre, mai un agent/);
  });
});
