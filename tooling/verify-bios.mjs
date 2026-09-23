#!/usr/bin/env node
/**
 * verify-bios.mjs — Comprova la presència dels fitxers essencials del BIOS i Regles de Sóc de Poble.
 * Refactoritzat segons les instruccions de Codex per evitar "falsos verds".
 */
import fs from 'node:fs';
import path from 'node:path';

const ESSENTIAL_FILES = [
  '.agents/ESTAT.md',
  '.agents/AGENTS.md',
  '.agents/LEDGER.md'
];

let errors = 0;
console.log('🔍 Iniciant verificació del BIOS Executable (L\'Herència de Pedra Seca)...');

// 1. Verifiquem arxius essencials
ESSENTIAL_FILES.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ FITXER CRÍTIC PERDUT: ${file}`);
    errors++;
  } else {
    console.log(`✅ ${file} està present.`);
  }
});

// 2. Verifiquem que .agents/skills no sigui un symlink trencat i contingui skills
const skillsDir = path.join(process.cwd(), '.agents/skills');
try {
  const stats = fs.lstatSync(skillsDir);
  if (stats.isSymbolicLink()) {
    console.error(`❌ ERROR CRÍTIC: .agents/skills és un enllaç simbòlic! Ha de ser una carpeta física.`);
    errors++;
  } else if (!stats.isDirectory()) {
    console.error(`❌ ERROR CRÍTIC: .agents/skills no és un directori!`);
    errors++;
  } else {
    const skillsFiles = fs.readdirSync(skillsDir);
    if (skillsFiles.length === 0) {
      console.error(`❌ ERROR CRÍTIC: .agents/skills està buit. On són els procediments?`);
      errors++;
    } else {
      console.log(`✅ .agents/skills existeix físicament i conté ${skillsFiles.length} elements.`);
    }
  }
} catch {
  console.error(`❌ ERROR CRÍTIC: La carpeta .agents/skills no existeix o no es pot llegir.`);
  errors++;
}

if (errors > 0) {
  console.error(`\n🚨 FALLADA CRÍTICA DEL BIOS: Hi ha ${errors} error(s) estructurals en el sistema auditat.`);
  process.exit(1);
} else {
  console.log('\n🟢 BIOS verificat. L\'arquitectura normativa està intacta. Podeu procedir.');
  process.exit(0);
}
