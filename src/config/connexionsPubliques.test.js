// @vitest-environment node
/* D-P016 (Onada R9, ordre del Mestre del 261106) · Un sol interruptor per a les
   sis RPC de 2611032100. IDEA-133 (Onada R10, B2-04) · Encés: la migració és a
   producció (GET de només lectura del 6-11-2026: connexions_publiques_de i
   membres_i_entitats_connectades_de responen 200).
     · és una constant literal (Rollup la plega, com AVISOS_PUSH_XAT_ACTIUS);
     · les sis funcions que nomena són les que crea la migració, i totes passen
       per executaConnexions, l'únic lloc de seguiments.js que la consulta;
     · cap altre mòdul de src/ no la importa. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES } from './connexionsPubliques.js';

const arrel = process.cwd();
const llig = (rel) => readFileSync(path.join(arrel, rel), 'utf8');
const RPC = ['preferencies_connexions', 'desa_visibilitat_connexions', 'connexions_publiques_de',
  'membres_i_entitats_connectades_de', 'inclou_persona_en_entitat', 'solicita_unir_se_a_entitat'];

test('encés (B2-04), com a constant literal, i documentat amb el fet llegit a producció', () => {
  expect(CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES).toBe(true);
  const font = llig('src/config/connexionsPubliques.js');
  expect(font).toMatch(/^export const CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES = true;$/m);
  expect(font).toMatch(/ENCENDRE \(true\) QUAN S'APLIQUE 2611032100: fet a l'Onada R10/);
  // El comentari diu el fet llegit, no l'estat apagat de R9.
  expect(font).toMatch(/connexions_publiques_de i membres_i_entitats_connectades_de\s+responen 200 a anon/);
  expect(font).not.toMatch(/Hui \(R8, sense la migració\)/);
  for (const nom of RPC) expect(font, nom).toContain(nom);
  // Ni seguiments.js ni la vista no diuen ja que la migració no és a producció.
  expect(llig('src/data/supabase/seguiments.js')).not.toMatch(/Sense la migració 2611032100 a producció/);
  expect(llig('src/sections/profile/ConnexionsPubliques.jsx')).not.toMatch(/Mentre no\s+s'aplique la migració \(D-10\)/);
});

test('les sis RPC són les que crea la migració 2611032100 i totes passen per executaConnexions', () => {
  const sql = llig('supabase/migrations/2611032100_connexions_publiques_i_membres.sql');
  for (const nom of RPC) expect(sql, nom).toMatch(new RegExp(`create or replace function public\\.${nom}\\(`));
  const seguiments = llig('src/data/supabase/seguiments.js');
  expect(seguiments).toContain("import { CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES } from '../../config/connexionsPubliques.js';");
  for (const nom of RPC) expect(seguiments, nom).toMatch(new RegExp(`executaConnexions\\(ctx, '[A-Za-z]+', net, '${nom}'`));
  // L'interruptor es consulta una sola vegada, a la branca remota d'executaConnexions, abans de rpc().
  expect(seguiments.match(/CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES/g)).toHaveLength(2);
  const cos = seguiments.slice(seguiments.indexOf('async function executaConnexions('), seguiments.indexOf('function filaConnexions('));
  expect(cos.indexOf('!CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES')).toBeGreaterThan(cos.indexOf('if (ctx.local)'));
  expect(cos.indexOf('!CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES')).toBeLessThan(cos.indexOf('await rpc(nomRpc'));
  expect(cos).toContain("throw errorDeConnexions('NO-DISPONIBLE');");
});

test('cap altre mòdul de producció de src/ no importa l’interruptor', () => {
  const src = path.join(arrel, 'src');
  const importen = readdirSync(src, { recursive: true })
    .map(String)
    .filter((f) => /\.(?:jsx?|mjs)$/.test(f) && !/\.test\.(?:jsx?|mjs)$/.test(f))
    .filter((f) => readFileSync(path.join(src, f), 'utf8').includes('config/connexionsPubliques.js'))
    .map((f) => f.split(path.sep).join('/'));
  expect(importen).toEqual(['data/supabase/seguiments.js']);
});
