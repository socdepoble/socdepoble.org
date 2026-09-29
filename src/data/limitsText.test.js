import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAXIM_EMOTICONA, MAXIM_LEMA } from './limitsText.js';

/* T49 · La paritat entre el client i la base de dades. Els servidors de
   mentida de les proves del Perfil no la poden vigilar (si copien la
   constant, no detecten cap divergència): per això ací es llig l'SQL. */
const MIGRACIONS = resolve(process.cwd(), 'supabase/migrations');
const MIGRACIO_LEMA = '2609281500_lema_entradilla_256.sql';
const llig = (fitxer) => readFileSync(resolve(MIGRACIONS, fitxer), 'utf8');
/* En ordre alfabètic, el mateix en què s'apliquen (supabase/README.md). */
const migracions = () => readdirSync(MIGRACIONS).filter((fitxer) => fitxer.endsWith('.sql')).sort();

describe('T49 · límit de l’entradilla (lema)', () => {
  it('l’entradilla admet 256 caràcters', () => {
    expect(MAXIM_LEMA).toBe(256);
  });

  it('la migració posa el mateix límit al CHECK de les dues taules i al retall de create_organization', () => {
    const sql = llig(MIGRACIO_LEMA);
    expect(sql).toContain(`check (char_length(lema) <= ${MAXIM_LEMA})`);
    expect(sql).toContain("foreach v_taula in array array['profiles', 'organizations'] loop");
    expect(sql).toContain(`v_lema text := left(btrim(coalesce(p_lema, '')), ${MAXIM_LEMA});`);
  });

  it('l’última migració que fixa el lema (CHECK o RPC) diu el mateix que el client', () => {
    /* Una migració futura que el torne a tocar ha de casar amb MAXIM_LEMA. */
    const ultimaAmb = (patro) => llig(migracions().filter((fitxer) => patro.test(llig(fitxer))).at(-1));
    expect(ultimaAmb(/char_length\(lema\)/i)).toContain(`char_length(lema) <= ${MAXIM_LEMA}`);
    expect(ultimaAmb(/create\s+or\s+replace\s+function\s+public\.create_organization\b/i))
      .toContain(`left(btrim(coalesce(p_lema, '')), ${MAXIM_LEMA})`);
  });

  it('la RPC nova només canvia el retall del lema respecte de la definició vigent (2609160600)', () => {
    const cos = (sql) => sql.match(/create or replace function public\.create_organization\([\s\S]*?\n\$\$;/)[0]
      .replace(/[ \t]+$/gm, '');
    const vella = cos(llig('2609160600_politiques_superadmin_organitzacions.sql'));
    const nova = cos(llig(MIGRACIO_LEMA));
    expect(nova).toBe(vella.replace(
      "v_lema text := left(btrim(coalesce(p_lema, '')), 120);",
      `v_lema text := left(btrim(coalesce(p_lema, '')), ${MAXIM_LEMA});`,
    ));
    for (const permis of [
      'revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from public;',
      'revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from anon;',
      'grant execute on function public.create_organization(uuid, text, text, text, text, text, uuid) to authenticated;',
    ]) expect(llig(MIGRACIO_LEMA)).toContain(permis);
  });
});

/* T66 · El mateix per a l'emoticona de la fitxa de la persona (profiles.icon). */
const MIGRACIO_EMOTICONA = '2609282035_perfil_emoticona.sql';

describe('T66 · límit de l’emoticona (icon)', () => {
  it('l’emoticona admet 16 punts de codi', () => {
    expect(MAXIM_EMOTICONA).toBe(16);
  });

  it('la migració posa el mateix límit al CHECK de profiles', () => {
    expect(llig(MIGRACIO_EMOTICONA))
      .toContain(`add constraint profiles_icon_llargaria check (char_length(icon) <= ${MAXIM_EMOTICONA});`);
  });

  it('l’última migració que fixa el CHECK de l’icon diu el mateix que el client', () => {
    /* Una migració futura que el torne a tocar ha de casar amb MAXIM_EMOTICONA. */
    const ultima = llig(migracions().filter((fitxer) => /char_length\(icon\)/i.test(llig(fitxer))).at(-1));
    expect(ultima).toMatch(new RegExp(`char_length\\(icon\\) <= ${MAXIM_EMOTICONA}\\)`));
  });
});
