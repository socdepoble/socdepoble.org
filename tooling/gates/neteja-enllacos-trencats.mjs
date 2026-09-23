#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const ARREL = path.resolve(process.cwd());
const WIKI_DIR = path.join(ARREL, '_wiki_de_poble');

function getAllMdFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.startsWith('.') || file === '90_arxiu_historic' || file === '04_escriptori') continue;
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
const brokenLinksByFile = new Map();

for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf-8');
  const regex = /\[\[(.*?)\]\]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    let link = match[1].split('|')[0].split('#')[0];
    if (!link) continue;
    if (!link.endsWith('.md') && !link.includes('.')) link += '.md';
    
    let found = false;
    const basename = path.basename(link);
    for (const target of allFiles) {
      if (path.basename(target) === basename) {
        if (link.includes('/')) {
            const normalizedLink = link.replace(/^\/+/, '');
            if (target.replace(/\\/g, '/').endsWith(normalizedLink)) {
                found = true;
                break;
            }
        } else {
            found = true;
            break;
        }
      }
    }
    
    if (!found) {
      if (!brokenLinksByFile.has(f)) brokenLinksByFile.set(f, []);
      brokenLinksByFile.get(f).push(match[0]);
    }
  }
}

let modifiedFiles = 0;
for (const [file, brokenLinks] of brokenLinksByFile.entries()) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;
  
  for (const link of brokenLinks) {
    // Si la línia conté només l'enllaç (com en llistes), l'esborrem sencera.
    const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexFullLine = new RegExp(`^.*${escapedLink}.*$\\n?`, 'gm');
    content = content.replace(regexFullLine, '');
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedFiles++;
    console.log(`✅ Netejats ${brokenLinks.length} enllaços trencats a ${path.relative(ARREL, file)}`);
  }
}

console.log(`\n Neteja completada. Fitxers modificats: ${modifiedFiles}`);
}
