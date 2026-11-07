// @vitest-environment node
/* Lot 3 de Codex (E2EE, fases 1b i 1c) i l'esmena D1 de l'auditoria de Claude
   (Ronda 3, 31-10-2026) · Prova estàtica de les migracions
   2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql i
   2610312000_e2ee_lot3_validadors_service_role.sql, en l'estil de
   xatE2ee.migracio.test.js: cap base de dades, només es llig el SQL. Comprova
   que els fitxers són els auditats (SHA-256), una sola transacció, la guarda
   de la cadena abans de cap objecte, RLS i permisos de les taules noves, cap
   política oberta, cada SECURITY DEFINER amb search_path, cap permís per a
   anon, l'E2EE apagat per defecte (configuració general=false, cohort buida i
   la constant del client a false), l'esmena D1 (només service_role) i les
   entrades de supabase/README.md (Onada R10, B4 segona ronda: la 2610311800 és a
   producció segons la lectura REST del 6-11-2026; la 2610312000, no acreditada).
   L'execució de veres (cadena de 60 + 1500 + 1800 + 1900 + 2000 dues voltes)
   es fa a PGlite fora del repositori; aplicar-les és cosa del Mestre. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';

const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const NOM_1800 = '2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql';
const NOM_2000 = '2610312000_e2ee_lot3_validadors_service_role.sql';
const crua = (nom) => readFileSync(path.join(MIGRACIONS, nom));
const sha = (nom) => createHash('sha256').update(crua(nom)).digest('hex');
const sensComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const SQL_1800 = crua(NOM_1800).toString('utf8');
const SQL_2000 = crua(NOM_2000).toString('utf8');
const CODI_1800 = sensComentaris(SQL_1800);
const CODI_2000 = sensComentaris(SQL_2000);
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');

const TAULES_PUBLIQUES = Object.freeze(['xat_epoques', 'xat_epoques_membres', 'xat_claus_fil', 'xat_reembolcalls']);
const TAULES_PRIVADES = Object.freeze(['xat_cohort_e2ee', 'xat_configuracio_e2ee']);

/** Cada funció creada: esquema.nom i la capçalera fins a «AS $…$». */
function funcions(codi) {
  const re = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(\w+)\.(\w+)\s*\(([\s\S]*?)\bAS\s+\$\w*\$/gi;
  return [...codi.matchAll(re)].map((m) => ({ nom: `${m[1]}.${m[2]}`.toLowerCase(), capcalera: m[3].replace(/\s+/g, ' ') }));
}

describe('2610311800 · E2EE fases 1b i 1c (fitxer, NO aplicat)', () => {
  test('és el fitxer auditat del kit (SHA-256 bdfb4bca…)', () => {
    expect(sha(NOM_1800)).toBe('bdfb4bca6565333450a9e5466779f8d56d8407a2563ff2b89fc7e39a26230668');
  });

  test('una sola transacció, i la guarda de la cadena (SDP-XAT-900) abans de cap ALTER ni CREATE', () => {
    expect(CODI_1800.match(/^BEGIN;$/gm)).toHaveLength(1);
    expect(CODI_1800.match(/^COMMIT;$/gm)).toHaveLength(1);
    expect(CODI_1800.trimEnd().endsWith('COMMIT;')).toBe(true);
    const guarda = CODI_1800.indexOf("SDP-XAT-900: falta la cadena anterior del Xat.");
    expect(guarda).toBeGreaterThan(0);
    expect(guarda).toBeLessThan(CODI_1800.search(/^(ALTER|CREATE)\b/m));
    expect(CODI_1800).toContain("has_schema_privilege('anon', 'public', 'CREATE')");
  });

  test('cada taula nova té RLS, i les públiques només donen SELECT a authenticated', () => {
    for (const taula of TAULES_PUBLIQUES) {
      expect(CODI_1800, taula).toContain(`ALTER TABLE public.${taula} ENABLE ROW LEVEL SECURITY;`);
    }
    for (const taula of TAULES_PRIVADES) {
      expect(CODI_1800, taula).toContain(`ALTER TABLE private.${taula} ENABLE ROW LEVEL SECURITY;`);
    }
    const llista = TAULES_PUBLIQUES.map((t) => `public.${t}`).join(', ');
    expect(CODI_1800).toContain(`REVOKE ALL ON ${llista} FROM PUBLIC,anon,authenticated,service_role;`);
    expect(CODI_1800).toContain(`GRANT SELECT ON ${llista} TO authenticated;`);
    expect(CODI_1800).toContain('REVOKE ALL ON private.xat_cohort_e2ee,private.xat_configuracio_e2ee FROM PUBLIC,anon,authenticated,service_role;');
    expect(CODI_1800).not.toMatch(/GRANT[^;]*\bTO\s+[^;]*\banon\b/i);
    expect(CODI_1800).not.toMatch(/GRANT\s+(INSERT|UPDATE|ALL)[^;]*\bON\s+(public|private)\.xat_(epoques|claus_fil|reembolcalls|cohort|configuracio)/i);
  });

  test('cap política oberta: ni USING (true) ni WITH CHECK (true), i les noves són per a authenticated', () => {
    expect(CODI_1800).not.toMatch(/USING\s*\(\s*true\s*\)/i);
    expect(CODI_1800).not.toMatch(/WITH\s+CHECK\s*\(\s*true\s*\)/i);
    const politiques = [...CODI_1800.matchAll(/CREATE POLICY (\w+) ON ([\w.]+)[^;]*?\bTO\s+(\w+)/g)];
    expect(politiques.length).toBeGreaterThanOrEqual(6);
    for (const [, nom, , rol] of politiques) expect(rol, nom).toBe('authenticated');
  });

  test('cada funció SECURITY DEFINER fixa el search_path', () => {
    const totes = funcions(CODI_1800);
    expect(totes.length).toBeGreaterThanOrEqual(20);
    const definers = totes.filter((f) => /SECURITY DEFINER/i.test(f.capcalera));
    expect(definers.length).toBeGreaterThan(0);
    for (const f of definers) expect(f.capcalera, f.nom).toMatch(/SET search_path = (public, pg_temp|'')/);
  });

  test('l’E2EE queda apagat: configuració general=false, cap persona a la cohort i el client a false', () => {
    expect(CODI_1800).toContain('general boolean NOT NULL DEFAULT false');
    expect(CODI_1800).toContain('INSERT INTO private.xat_configuracio_e2ee(id) VALUES(true) ON CONFLICT DO NOTHING;');
    expect(CODI_1800).not.toMatch(/INSERT INTO private\.xat_cohort_e2ee/i);
    expect(CODI_1800).not.toMatch(/UPDATE private\.xat_configuracio_e2ee/i);
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  });
});

describe('2610312000 · esmena D1: validadors per a service_role (fitxer, NO aplicat)', () => {
  test('és l’esmena auditada (SHA-256 228cd673…), una sola transacció, i diu que no està aplicada', () => {
    expect(sha(NOM_2000)).toBe('228cd673178c38cc490405af5dfe5d4027a3d50df9bcc03391aab09e383041ca');
    expect(CODI_2000.match(/^BEGIN;$/gm)).toHaveLength(1);
    expect(CODI_2000.match(/^COMMIT;$/gm)).toHaveLength(1);
    expect(SQL_2000).toContain("NO aplicada: l'aplica el Mestre");
    expect(SQL_2000).toContain('Requerix el 2610311800');
  });

  test('només les dues funcions pures passen a SECURITY DEFINER, i només service_role rep EXECUTE', () => {
    expect(CODI_2000).toContain('ALTER FUNCTION private.xat_lot3_b64(text, integer) SECURITY DEFINER;');
    expect(CODI_2000).toContain('ALTER FUNCTION private.xat_sobre_format_v1_valid(jsonb) SECURITY DEFINER;');
    expect(CODI_2000.match(/ALTER FUNCTION/g)).toHaveLength(2);
    expect(CODI_2000).toMatch(/REVOKE ALL ON FUNCTION private\.xat_lot3_b64\(text, integer\), private\.xat_sobre_format_v1_valid\(jsonb\)\s+FROM PUBLIC, anon, authenticated;/);
    const grants = [...CODI_2000.matchAll(/GRANT[\s\S]*?;/g)].map((m) => m[0]);
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatch(/TO service_role;$/);
    expect(CODI_2000).not.toMatch(/\bTO\s+(anon|authenticated|PUBLIC)\b/i);
    // Els validadors que esmena són els que crea el 2610311800, amb el mateix search_path.
    const validadors = funcions(CODI_1800).filter((f) => ['private.xat_lot3_b64', 'private.xat_sobre_format_v1_valid'].includes(f.nom));
    expect(validadors).toHaveLength(2);
    for (const f of validadors) expect(f.capcalera, f.nom).toContain('SET search_path = public, pg_temp');
  });
});

/* Onada R10 · B4 segona ronda (B4V-T3) · La lectura REST del 6-11-2026 (només GET amb la clau anònima) troba la
   taula xat_epoques (401 42501), que només crea la 2610311800. La 2610312000 només canvia dues funcions de
   private, que anon no veu: l'acta 261101_0334 la dona aplicada, i la fila ho diu sense donar-la per acreditada. */
describe('supabase/README.md · el catàleg en diu l’estat remot que acredita la lectura', () => {
  test.each([
    ['2610311800', NOM_1800, '| Aplicada a producció (lectura REST del 6-11: la taula `xat_epoques` existix, 401 42501; acta 261101_0334) |'],
    ['2610312000', NOM_2000, "| Estat remot no acreditat (l'acta 261101_0334 la dona aplicada; la lectura REST no veu `private.xat_lot3_b64`); ho pot acreditar la columna `te_esmena_2610312000` del Pas 0 |"]
  ])('%s consta amb el seu estat i la seua evidència', (versio, nom, estat) => {
    expect(README).toContain(`migrations/${nom}`);
    const fila = README.split('\n').find((linia) => linia.startsWith('|') && linia.includes(`\`${versio}\``));
    expect(fila, versio).toBeTruthy();
    expect(fila).toContain(estat);
    expect(fila).not.toContain('NO aplicada');
  });
});
