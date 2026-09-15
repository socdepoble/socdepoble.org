#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log("🌙 [SOMIADOR] Iniciant cicle de son (Consolidació i Neteja)...");

const ARREL = path.resolve(process.cwd());
const ESCRIPTORI = path.join(ARREL, '_wiki_de_poble/04_escriptori');
const HISTORIC = path.join(ARREL, '_wiki_de_poble/90_arxiu_historic');

// Creem la carpeta d'arxiu de la sessió actual
const d = new Date();
const dirName = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_Sessio_Tancada`;
const destPath = path.join(HISTORIC, dirName);

const filesToMove = [];
const items = fs.readdirSync(ESCRIPTORI, { withFileTypes: true });

for (const item of items) {
  // Ignorar fitxers del sistema
  if (item.name === '.DS_Store') continue;

  if (item.isDirectory()) {
    // Excloure carpetes de sistema permanents de l'escriptori
    if (item.name === '00_bandeja_d_entrada' || item.name === '00_Bandeja_d_Entrada') continue;
    if (item.name === '01_produccio' || item.name === '01_Produccio') continue;
  } else {
    // Si és fitxer, filtrar per extensió i per nom
    if (!item.name.endsWith('.md') && !item.name.endsWith('.json')) continue;
    // No moure els INDEX
    if (item.name.toLowerCase().includes('index')) continue;
    // No moure l'ancora
    if (item.name === '.ancora_sessio.json') continue;
  }
  
  filesToMove.push(item.name);
}

if (filesToMove.length > 0) {
  console.log(`🧹 Movent ${filesToMove.length} arxius de l'Escriptori a l'Històric (${dirName})...`);
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }
  for (const f of filesToMove) {
    fs.renameSync(path.join(ESCRIPTORI, f), path.join(destPath, f));
  }
} else {
  console.log("✨ L'Escriptori ja està net.");
}

console.log("🚜 [SOMIADOR] Reancorant el sistema amb el Llaurador...");
try {
  execSync('node tooling/wiki/llaurador_indexs.mjs --escriu', { stdio: 'inherit' });
} catch {
  throw new Error("Error al llaurador.");
}

console.log("🧶 [SOMIADOR] Verificant teixit final...");
try {
  execSync('node tooling/wiki/teixidor.mjs --baseline', { stdio: 'inherit' });
} catch {
  throw new Error("Error congelant baseline teixit.");
}

console.log("💤 [SOMIADOR] Cicle de son finalitzat. El cervell ha madurat i descansat.");
