#!/usr/bin/env node
/**
 * tooling/gates/tancament.mjs
 * Orquestrador del gatekeeper (pre-commit o manual)
 */

import { VerificadorSCC } from './verificador-scc.mjs';
import { R } from '../lib/arrel.mjs';

import { execFileSync } from 'node:child_process';

async function main() {
  const args = process.argv.slice(2);
  const isJsonMode = args.includes('--json');
  
  let turnId = null;
  const turnIdIndex = args.indexOf('--turn-id');
  if (turnIdIndex !== -1 && args.length > turnIdIndex + 1) {
    turnId = args[turnIdIndex + 1];
  } else {
    // try to find it as --turn-id=xxx
    const turnIdArg = args.find(a => a.startsWith('--turn-id='));
    if (turnIdArg) turnId = turnIdArg.split('=')[1];
  }
  
  const rootDir = R('.');

  // Catàleg de només lectura: el tancament mai regenera espills.
  try {
    if (!isJsonMode) console.log("🧠 Comprovant el catàleg de skills...");
    execFileSync(process.execPath, ['tooling/brain/cataleg_skills.mjs', '--check'], { cwd: rootDir, stdio: 'pipe' });
  } catch (e) {
    throw new Error(`Catàleg divergent: ${e.stdout?.toString() || e.message}`);
  }

  // La compilació de la Wiki ha estat desacoblada al procés de 'prebuild' (npm run build)
  // per evitar mutar l'estat durant una auditoria de només lectura.
  try {
    if (!isJsonMode) console.log("🧠 Verificant els enllaços de la Wiki (compile-wiki-to-app --check)...");
    execFileSync(process.execPath, ['tooling/wiki/compile-wiki-to-app.mjs', '--check'], { cwd: rootDir, stdio: 'pipe' });
  } catch (e) {
    throw new Error(`Error verificant els enllaços de la Wiki: ${e.stdout?.toString() || e.message}`);
  }
  
  const verificador = new VerificadorSCC(rootDir);
  const result = await verificador.runAudits();

  if (isJsonMode) {
    if (turnId) result.turn_id = turnId;
    // Escriure JSON net per stdout
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(result.valid ? 0 : 1);
  }

  // Sortida per humans (si no porta --json)
  if (result.valid) {
    console.log("\n✅ AUDITORIA SCC COMPLETADA AMB ÈXIT.");
    console.log("   Tots els nodes estan actius i l'escriptori està impol·lut. Sessió neta.");
    process.exit(0);
  } else {
    console.error("\n❌ ERROR CRÍTIC: EL TANCAMENT HA FALLAT PER VIOLACIÓ DE REGLES.");
    
    for (const err of result.errors) {
      console.error(`\n🚨 [${err.code}] ${err.message}`);
      if (err.affected_files && err.affected_files.length > 0) {
        console.error("   Fitxers afectats:");
        for (const file of err.affected_files) {
          console.error(`     - ${file}`);
        }
      }
    }
    console.error("\n🔒 Resol aquests defectes abans de continuar.");
    process.exit(1);
  }
}

main().catch(e => {
  console.error("\n💥 Error inesperat durant l'auditoria:", e);
  process.exit(1);
});
