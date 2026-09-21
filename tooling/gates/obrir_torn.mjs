#!/usr/bin/env node
/**
 * tooling/gates/obrir_torn.mjs
 * Gatekeeper d'entrada: Comprova que no hi haja un SDP-LOCK abans d'iniciar la sessió.
 * També informa de l'estat actual de la Bandeja d'Entrada.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const lockFile = join(repoRoot, '.agents', 'SDP-LOCK');
const inboxDir = join(repoRoot, '_wiki_de_poble', '04_escriptori', '00_Bandeja_d_Entrada');

const isJsonMode = process.argv.includes('--json');
const turn_id = `torn_${Date.now()}`;

if (isJsonMode) {
  if (existsSync(lockFile)) {
    console.log(JSON.stringify({ valid: false, turn_id: null, error: 'SDP-LOCK actiu' }));
    process.exit(1);
  }
  console.log(JSON.stringify({ valid: true, turn_id: turn_id }));
  process.exit(0);
}

console.log("🌅 Obrint el Mas de Sóc de Poble...");

if (existsSync(lockFile)) {
  const lockMsg = readFileSync(lockFile, 'utf8');
  console.error("\n❌ SDP-LOCK ACTIU! EL MAS ESTÀ PRECINTAT.");
  console.error("No pots obrir un nou torn fins que no arregles el caos que vas deixar a l'escriptori o al graf en la sessió anterior.");
  console.error("\nMotiu del bloqueig:\n");
  console.error(lockMsg);
  console.error("\nAcció requerida: Executa `node tooling/gates/tancament.mjs` per veure què falla i soluciona-ho per alliberar el pany.");
  process.exit(1);
}

console.log("✅ El mas està net. Cap SDP-LOCK actiu.");

try {
  if (existsSync(inboxDir)) {
    const items = readdirSync(inboxDir).filter(f => !f.startsWith('.'));
    if (items.length > 0) {
      console.log(`\n📥 Atenció: Tens ${items.length} elements pendents a la Bandeja d'Entrada:`);
      for (const item of items) {
        console.log(`   - ${item}`);
      }
    } else {
      console.log("\n📭 La Bandeja d'Entrada està totalment buida.");
    }
  }
} catch (e) {
  // Ignorar si no es pot llegir la safata
}

console.log(`\n🚀 Pots començar el torn lliurement. ID: ${turn_id}`);
process.exit(0);
