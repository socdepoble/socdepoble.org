#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Tractor d'Orfandat: Revisa tota la Wiki (menys 90_arxiu_historic)
// i comprova que cada document estiga ancorat al graf (tinga almenys 1 enllaç entrant).

const ARREL = path.resolve(process.cwd());
const WIKI_DIR = path.join(ARREL, '_wiki_de_poble');

function getAllMdFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.startsWith('.') || file === '90_arxiu_historic' || file === '04_escriptori') {
      continue; // Ignorem carpetes ocultes, arxiu i l'escriptori (l'escriptori té el seu propi verificador)
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
const fileContents = new Map();
const linkedFiles = new Set();
let errors = 0;

// Llegim tot en memòria i extreiem els enllaços
for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf-8');
  fileContents.set(f, content);
  
  // Extraiem els enllaços tipus [[Nom del fitxer]] o [[Ruta/Nom del fitxer]] o [[Nom del fitxer|Text]]
  const regex = /\[\[(.*?)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let link = match[1].split('|')[0]; // Llevem el text de visualització si n'hi ha
    link = link.split('#')[0]; // Llevem l'ancoratge de capçalera si n'hi ha
    if (!link) continue;
    
    // Assegurem extensió
    if (!link.endsWith('.md') && !link.includes('.')) {
      link += '.md';
    }
    
    // Resolem el fitxer
    let found = false;
    // Si té ruta exacta (relativa a l'arrel de la wiki normalment, o al fitxer)
    // Obsidian permet referenciar només pel nom base.
    const basename = path.basename(link);
    for (const target of allFiles) {
      if (path.basename(target) === basename) {
        linkedFiles.add(target);
        found = true;
        // Podríem comprovar si la ruta exacta (si s'ha donat) coincideix, però per simplificar considerem
        // que qualsevol enllaç amb el mateix basename apunta al fitxer correcte.
        // No obstant, si el link té ruta, comprovem que la ruta de target acabe amb eixa ruta
        if (link.includes('/')) {
            const normalizedLink = link.replace(/^\/+/, ''); // Lleva barres inicials
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
      console.error(`❌ [ENLLAÇ TRENCAT] El fitxer "${path.relative(ARREL, f)}" apunta a "[[${match[1]}]]" però el destí no existeix o la ruta és incorrecta.`);
      errors++;
    }
  }
}

for (const targetFile of allFiles) {
  const basename = path.basename(targetFile, '.md');
  
  // Els índexs mestres o arrel no poden ser orfes (són l'arrel del graf)
  if (basename.toLowerCase() === '00_index' || basename === '00_INDEX_ESCRIPTORI' || basename === '00_index_actuar' || basename === '00_INDEX_Actes' || basename === '00_index_identitat' || basename === '00_INDEX_SKILLS' || basename === '00_INDEX_ARXIU' || basename === '00_index_maquina' || basename === '00_index_plantilles') {
    continue;
  }
  
  if (!linkedFiles.has(targetFile)) {
    const relPath = path.relative(ARREL, targetFile);
    console.error(`❌ [ORFANDAT] El fitxer "${relPath}" no té cap enllaç entrant (és un orfe). Assigna-li un índex.`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n💥 ATURADA CRÍTICA: S'han detectat ${errors} fitxers orfes a la Wiki. Connecta'ls al graf abans de continuar.`);
  process.exit(1);
}

console.log("✅ Totes les connexions del graf de la Wiki estan segures (0 orfes).");
process.exit(0);
