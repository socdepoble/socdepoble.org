#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Tractor d'Orfandat: Revisa tota la Wiki i comprova que cada document estiga ancorat al graf.
const ARREL = path.resolve(process.cwd());
const WIKI_DIR = path.join(ARREL, '_wiki_de_poble');

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
  
  // Extraiem [[Enllaços]]
  const regexWiki = /\[\[(.*?)\]\]/g;
  let match;
  while ((match = regexWiki.exec(content)) !== null) {
    processLink(match[1], f);
  }

  // Extraiem [Text](Enllaços)
  const regexMd = /\[.*?\]\((.*?)\)/g;
  while ((match = regexMd.exec(content)) !== null) {
    let link = match[1];
    if (link.startsWith('http') || link.startsWith('mailto:')) continue; // Ignorem externs
    processLink(decodeURIComponent(link), f);
  }
}

function processLink(rawLink, sourceFile) {
    let link = rawLink.split('|')[0]; 
    link = link.split('#')[0]; 
    link = link.split('?')[0]; 
    if (!link) return;
    
    if (!link.endsWith('.md') && !link.includes('.')) {
      link += '.md';
    }
    
    let found = false;
    const basename = path.basename(link);
    for (const target of allFiles) {
      if (path.basename(target) === basename) {
        linkedFiles.add(target);
        found = true;
        if (link.includes('/')) {
            const normalizedLink = link.replace(/^\/+/, '');
            if (!target.replace(/\\/g, '/').endsWith(normalizedLink)) {
                found = false;
                linkedFiles.delete(target);
            } else {
                found = true;
                linkedFiles.add(target);
                break;
            }
        } else {
            break;
        }
      }
    }
    
    if (!found) {
      console.error(`❌ [ENLLAÇ TRENCAT] El fitxer "${path.relative(ARREL, sourceFile)}" apunta a "${rawLink}" però el destí no existeix o la ruta és incorrecta.`);
      brokenLinks++;
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
