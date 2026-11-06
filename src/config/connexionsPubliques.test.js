// @vitest-environment node
/* D-P016 (Onada R9, ordre del Mestre del 261106) · Un sol interruptor per a les
   sis RPC de 2611032100, apagat fins que s'aplique la migració a producció.
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

test('apagat, com a constant literal, i documentat per a encendre’l quan s’aplique 2611032100', () => {
  expect(CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES).toBe(false);
  const font = llig('src/config/connexionsPubliques.js');
  expect(font).toMatch(/^export const CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES = (?:true|false);$/m);
  expect(font).toMatch(/ENCENDRE \(true\) QUAN S'APLIQUE 2611032100/);
  for (const nom of RPC) expect(font, nom).toContain(nom);
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
