#!/usr/bin/env node
import {arrelSegura, CAMINS} from '../lib/arrel.mjs';
import {extractDocumentLinks, resolveDocumentLink} from '../lib/document-links.mjs';
import fs from 'node:fs';
import path from 'node:path';

// Tractor d'Orfandat: Revisa tota la Wiki i comprova que cada document estiga ancorat al graf.
const ARREL = arrelSegura();
const WIKI_DIR = path.join(ARREL, CAMINS.wiki);

function getAllMdFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.startsWith('.') || file === '90_arxiu_historic') {
      continue; // Ignorem carpetes ocultes i arxiu històric
    }
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllMdFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllMdFiles(WIKI_DIR);
// Afegir fitxers de l'arrel
if (fs.existsSync(path.join(ARREL, 'AGENTS.md'))) allFiles.push(path.join(ARREL, 'AGENTS.md'));
if (fs.existsSync(path.join(ARREL, 'CLAUDE.md'))) allFiles.push(path.join(ARREL, 'CLAUDE.md'));

const fileContents = new Map();
const linkedFiles = new Set();
let brokenLinks = 0;
let orphans = 0;

for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf-8');
  fileContents.set(f, content);
  
  for (const link of extractDocumentLinks(content)) {
    try { linkedFiles.add(resolveDocumentLink(link, f, allFiles, ARREL)); }
    catch (e) { console.error(`${path.relative(ARREL,f)}: ${e.message}`); brokenLinks++; }
  }
}

for (const targetFile of allFiles) {
  // L'Escriptori i arrels no es conten com a orfes en aquest tractor
  const relPath = path.relative(ARREL, targetFile);
  if (relPath.includes('04_escriptori') || relPath === 'AGENTS.md' || relPath === 'CLAUDE.md') {
    continue; 
  }

  const basename = path.basename(targetFile, '.md').toLowerCase();
  
  const rootIndexes = ['00_index', '00_index_escriptori', '00_index_actuar', '00_index_actes', '00_index_identitat', '00_index_skills', '00_index_arxiu', '00_index_maquina', '00_index_plantilles'];
  
  if (rootIndexes.includes(basename)) {
    continue;
  }
  
  if (!linkedFiles.has(targetFile)) {
    console.error(`❌ [ORFANDAT] El fitxer "${relPath}" no té cap enllaç entrant (és un orfe). Assigna-li un índex.`);
    orphans++;
  }
}

const errors = brokenLinks + orphans;
if (errors > 0) {
  console.error(`\n💥 ATURADA CRÍTICA: S'han detectat ${brokenLinks} enllaços trencats i ${orphans} orfes. Connecta'ls al graf abans de continuar.`);
  process.exit(1);
}

console.log(`✅ Totes les connexions del graf de la Wiki estan segures (0 enllaços trencats, 0 orfes).`);
process.exit(0);
