#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

import { fileURLToPath } from 'node:url';

export const passos = [
  { nom: 'Tractor Psicopatia', cmd: 'node', args: ['tooling/gates/tractor-psicopatia.mjs'], script: 'porta:psicopatia' },
  { nom: 'Porta 58px', cmd: 'node', args: ['tooling/gates/01_porta_pedra_seca_58px.mjs'], script: 'porta:58px' },
  { nom: 'Linter', cmd: 'npm', args: ['run', 'lint'] },
  { nom: 'Porta Importacions', cmd: 'npm', args: ['run', 'porta:importacions'], script: 'porta:importacions' },
  { nom: 'Porta Build', cmd: 'node', args: ['tooling/gates/tractor-build-previ.mjs'], script: 'porta:build' },
  { nom: 'Porta Promesa', cmd: 'node', args: ['tooling/gates/tractor-promesa.mjs'], script: 'porta:promesa' },
  { nom: 'Porta TDZ', cmd: 'node', args: ['tooling/gates/tractor-tdz.mjs'], script: 'porta:tdz' },
  { nom: 'Porta Arrel', cmd: 'node', args: ['tooling/gates/tractor-arrel.mjs'], script: 'porta:arrel' },
  { nom: 'Porta Enxufe', cmd: 'node', args: ['tooling/gates/tractor-enxufe.mjs'], script: 'porta:enxufe' },
  { nom: 'Porta Maquinari', cmd: 'node', args: ['tooling/gates/tractor-doctrina-maquinari.mjs'], script: 'porta:maquinari' },
  { nom: 'Porta Graella', cmd: 'node', args: ['tooling/gates/tractor-graella.mjs'], script: 'porta:graella' },
  { nom: 'Porta InnerHTML', cmd: 'node', args: ['tooling/gates/tractor-innerhtml.mjs'], script: 'porta:innerhtml' },
  { nom: 'Porta Rutes', cmd: 'node', args: ['tooling/gates/tractor-rutes.mjs'], script: 'porta:rutes' },
  { nom: 'Porta Rutes Web', cmd: 'node', args: ['tooling/gates/tractor-rutes-web.mjs'], script: 'porta:rutes-web' },
  { nom: 'Porta Frontera', cmd: 'node', args: ['tooling/gates/tractor-sollutia.mjs'], script: 'porta:frontera' },
  { nom: 'Porta Frontera Auth', cmd: 'node', args: ['tooling/wiki/tractor-frontera-auth.mjs'], script: 'porta:frontera-auth' },
  { nom: 'Tractor Cognitiu', cmd: 'node', args: ['tooling/wiki/tractor-cognitiu.mjs', '--arrel=.'], script: 'porta:cognitiu' },
  { nom: 'Porta Cens', cmd: 'node', args: ['tooling/gates/tractor-cens.mjs'], script: 'porta:cens' },
  { nom: 'Porta Consell', cmd: 'node', args: ['tooling/gates/tractor-consell.mjs'], script: 'porta:consell' },
  { nom: 'Porta Registre', cmd: 'node', args: ['tooling/gates/tractor-registre.mjs'], script: 'porta:registre' },

  { nom: 'Porta Manifest', cmd: 'node', args: ['tooling/gates/tractor-manifest.mjs'], script: 'porta:manifest' },
  { nom: 'Porta Doctrina', cmd: 'node', args: ['tooling/gates/tractor-doctrina.mjs'], script: 'porta:doctrina' },
  { nom: 'Porta Reflex', cmd: 'node', args: ['tooling/wiki/reflex_petorreta.mjs', 'doctor', '--ci'], script: 'porta:reflex' },
  { nom: 'Tractor Pedra Seca', cmd: 'node', args: ['tooling/brain/tractor-pedra-seca.mjs'], script: 'porta:pedra-seca' },
  { nom: 'Design Guard', cmd: 'node', args: ['tooling/gates/design_guard.mjs', '--arrel=src'], script: 'porta:design-guard' },
  { nom: 'Porta Tokens', cmd: 'node', args: ['tooling/gates/tractor-tokens.mjs'], script: 'porta:tokens' },
  { nom: 'Porta Fitxa Gestor', cmd: 'node', args: ['tooling/gates/tractor-fitxa-gestor.mjs'], script: 'porta:fitxa' },
  { nom: 'Porta Cromàtic', cmd: 'node', args: ['tooling/gates/tractor-cromatic.mjs'], script: 'porta:cromatic' },
  { nom: 'Porta Crom (closca immutable)', cmd: 'node', args: ['tooling/gates/tractor-crom.mjs'], script: 'porta:crom' },
  { nom: 'Porta Vocabulari', cmd: 'node', args: ['tooling/gates/tractor-vocabulari.mjs'], script: 'porta:vocabulari' },
  { nom: 'Porta Estucat', cmd: 'node', args: ['tooling/gates/tractor-estucat.mjs', '--arrel=.'], script: 'porta:estucat' },
  { nom: 'Llaurador Índexs', cmd: 'node', args: ['tooling/wiki/llaurador_indexs.mjs', '--check', '--lock-token'], script: 'porta:llaurador' },
  { nom: 'Porta Frontmatter', cmd: 'node', args: ['tooling/wiki/tractor-frontmatter.mjs'], script: 'porta:frontmatter' },
  { nom: 'Porta Esquemes', cmd: 'node', args: ['tooling/wiki/tractor-esquemes.mjs'], script: 'porta:esquemes' },
  { nom: 'Porta Nomenclatura', cmd: 'node', args: ['tooling/wiki/tractor-nomenclatura.mjs', '--arrel=.'], script: 'porta:nomenclatura' },
  { nom: 'Porta Teixit', cmd: 'node', args: ['tooling/wiki/teixidor.mjs', '--lock-token'], script: 'porta:teixit' },
  { nom: 'Porta SCC', cmd: 'node', args: ['tooling/gates/verificador-scc.mjs'], script: 'porta:scc' },
  { nom: 'SEO Manifest', cmd: 'node', args: ['tooling/gates/build-seo-manifest.mjs', '--verifica', '--lock-token'], script: 'porta:seo' },
  { nom: 'Porta Persistència', cmd: 'node', args: ['tooling/gates/tractor-persistencia.mjs'], script: 'porta:persistencia' },
  { nom: 'Porta Shim', cmd: 'node', args: ['tooling/gates/tractor-shim.mjs'], script: 'porta:shim' },
  { nom: 'Porta Cadena', cmd: 'node', args: ['tooling/gates/tractor-cadena.mjs'], script: 'porta:cadena' }
,
  { nom: 'Tractor Llavor', cmd: 'node', args: ['tooling/gates/tractor-llavor.mjs'], script: 'porta:llavor' }
,
  { nom: 'Porta Matrix', cmd: 'node', args: ['tooling/brain/matrix.mjs', 'crear un prompt'], script: 'porta:matrix' },
  { nom: 'Porta Utilitats SDP', cmd: 'node', args: ['tooling/gates/tractor-utilitats-sdp.mjs'], script: 'porta:utilitatssdp' },
  { nom: 'Porta Inline-Styles (Salfumà)', cmd: 'node', args: ['tooling/gates/tractor-inline-styles.mjs'], script: 'porta:inlinestyles' },
  { nom: 'Porta Classes (Salfumà)', cmd: 'node', args: ['tooling/gates/tractor-classes.mjs'], script: 'porta:classes' },
  { nom: 'Porta RLS', cmd: 'node', args: ['tooling/gates/tractor-rls.mjs'], script: 'porta:rls' },
  { nom: 'Porta Catàleg', cmd: 'node', args: ['tooling/gates/tractor-cataleg.mjs'], script: 'porta:cataleg' },
  { nom: 'Porta Frontissa', cmd: 'node', args: ['tooling/gates/tractor-frontissa.mjs'], script: 'porta:frontissa' },
  { nom: 'Proves', cmd: 'npm', args: ['run', 'test', '--', '--run'] },
  { nom: 'Porta Segella', cmd: 'node', args: ['tooling/gates/segella.mjs'], script: 'porta:segella' }
];

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  let failed = false;
  let errors = [];

  console.log("\n🚀 INICIANT CADENA AGREGATIVA DE PORTES...\n");

  for (const pas of passos) {
    console.log(`\n────────────────────────────────────────────────────────────────────────`);
    console.log(`⏳ Executant ${pas.nom}...`);
    console.log(`────────────────────────────────────────────────────────────────────────\n`);
    const result = spawnSync(pas.cmd, pas.args, { stdio: 'inherit', encoding: 'utf-8' });
    if (result.error || result.status !== 0) {
      console.log(`\n❌ [FRACÀS] ${pas.nom}`);
      failed = true;
      errors.push(pas.nom);
    } else {
      console.log(`\n✅ [OK] ${pas.nom}`);
    }
  }

  console.log(`\n========================================================================`);
  if (failed) {
    console.error(`💥 RESUM DE FALLIDES (${errors.length} tractor/s):`);
    for (const err of errors) {
      console.error(`   - ❌ ${err}`);
    }
    console.error(`\n🔒 Resol els deutes abans de fer commit.\n`);
    process.exit(1);
  } else {
    console.log(`🎉 TOTES LES PORTES HAN PASSAT AMB ÈXIT. MUR DE PEDRA SECA INTACTE.`);
  }
  console.log(`========================================================================\n`);
  process.exit(0);
}
