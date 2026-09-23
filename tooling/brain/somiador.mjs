#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { protectedTurnFiles } from '../documental/turns.mjs';
import { anchored } from '../documental/core.mjs';

console.log("🌙 [SOMIADOR] Iniciant cicle de son (Consolidació i Neteja en 4 Fases)...");

const ARREL = path.resolve(process.cwd());
const ESCRIPTORI = path.join(ARREL, '_wiki_de_poble/04_escriptori');
// Arxiu extern pesant
const ARXIU_EXTERN = path.join(ARREL, '../_arxiu_wiki_de_poble');
// Arxiu intern lleuger (per a DESTIL i PROPOSTA)
const HISTORIC = path.join(ARREL, '_wiki_de_poble/90_arxiu_historic');

const d = new Date();
const any = String(d.getFullYear());
const dirName = `${any.slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_Sessio_Tancada`;
const destExternPath = path.join(ARXIU_EXTERN, any, dirName);
const destInternPath = path.join(HISTORIC, dirName);

const protectedFiles = protectedTurnFiles(ARREL);
const desktopIndex = fs.readFileSync(path.join(ESCRIPTORI,'00_index_escriptori.md'),'utf8');
const dryRun = process.argv.includes('--dry-run');
const items = fs.readdirSync(ESCRIPTORI, { withFileTypes: true });

const episodis = {};
const altres = [];

// Fase 1: Inventari
for (const item of items) {
  if (item.isDirectory() || item.name === '.DS_Store' || item.name.toLowerCase().includes('index') || item.name === '.ancora_sessio.json') continue;
  
  const relative = `_wiki_de_poble/04_escriptori/${item.name}`;
  if (protectedFiles.has(relative) || anchored(desktopIndex, relative)) continue;
  // Extraure segell horari AAMMDD_HHMM
  const match = item.name.match(/^(\d{6}_\d{4})/);
  if (match) {
    const segell = match[1];
    if (!episodis[segell]) episodis[segell] = [];
    episodis[segell].push(item.name);
  } else {
    altres.push(item.name);
  }
}

// Fase 4: Purga Física Determinista
let mogutsExtern = 0;
let mogutsIntern = 0;

function moveFile(fileName, isExternal) {
  const src = path.join(ESCRIPTORI, fileName);
  const destDir = isExternal ? destExternPath : destInternPath;
  if (dryRun) { console.log(`[DRY-RUN] ${src} → ${destDir}`); return; }
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, fileName);
  if (fs.existsSync(destPath)) {
    throw new Error(`[SOMIADOR] Col·lisió detectada: ${destPath} ja existeix. Aturant procés per no sobreescriure i perdre dades.`);
  }
  fs.renameSync(src, destPath);
  if (isExternal) mogutsExtern++; else mogutsIntern++;
}

for (const files of Object.values(episodis)) {
  // Fases 2 i 3: Si tinguérem accés directe a l'API LLM ací es faria la destil·lació.
  // De moment confiem en que l'agent ho ha fet manualment o ho farà.
  
  for (const f of files) {
    const stat = fs.statSync(path.join(ESCRIPTORI, f));
    const sizeKB = stat.size / 1024;
    
    // Purga a l'exterior: BUNDLES, fitxers > 500KB
    if (f.includes('BUNDLE') || sizeKB > 500) {
      moveFile(f, true);
    } else {
      // PROMPTS, INFORME, ACTA... van a l'intern si volem, o podem externalitzar els PROMPTS.
      // Claude deia: PROMPTs amb DESTIL van fora. Com que no tenim DESTIL automàtic ací, els posem a l'intern.
      moveFile(f, false);
    }
  }
}

for (const f of altres) {
    const stat = fs.statSync(path.join(ESCRIPTORI, f));
    if (stat.size / 1024 > 500) moveFile(f, true);
    else moveFile(f, false);
}

console.log(`🧹 Fase 4 completada: ${mogutsExtern} arxius pesants a l'arxiu extern, ${mogutsIntern} arxius lleugers a l'històric intern.`);

console.log("🚜 [SOMIADOR] Reancorant el sistema amb el Llaurador...");
try {
  if (!dryRun) execSync('node tooling/wiki/llaurador_indexs.mjs --escriu', { stdio: 'inherit' });
} catch {
  console.error("Error al llaurador.");
}

console.log("💤 [SOMIADOR] Cicle de son finalitzat. El cervell ha madurat i descansat.");
