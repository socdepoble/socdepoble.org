import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wikiDir = path.resolve(__dirname, '../../_wiki_de_poble');

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      // Ignorem carpetes ocultes i node_modules per si de cas
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(res, callback);
      }
    } else if (entry.name.endsWith('.md')) {
      callback(res);
    }
  }
}

let filesFixed = 0;
let duplicatesRemoved = 0;

console.log('🔍 Escanejant la Wiki a la recerca d\'ancoratges duplicats...');

walkDir(wikiDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const newLines = [];
  const seenAnchors = new Set();
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Busquem línies que comencen per "Ancoratge de Seguretat:" (amb o sense negretes)
    const match = line.match(/^\s*\**Ancoratge de Seguretat:\**\s*(.+)/i);
    
    if (match) {
      const anchorValue = match[1].trim();
      
      if (seenAnchors.has(anchorValue)) {
        // És un duplicat idèntic! El descartem
        changed = true;
        duplicatesRemoved++;
        
        // Netegem també les línies en blanc i els separadors "---" immediatament anteriors
        // per no deixar residus buits on abans hi havia el duplicat.
        while (newLines.length > 0) {
          const lastLine = newLines[newLines.length - 1].trim();
          if (lastLine === '' || lastLine === '---') {
            newLines.pop();
          } else {
            break;
          }
        }
        continue;
      } else {
        seenAnchors.add(anchorValue);
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    filesFixed++;
    console.log(`✅ Netejat: ${path.relative(wikiDir, filePath)}`);
  }
});

console.log(`\n🎉 Operació completada!`);
console.log(`Fitxers modificats: ${filesFixed}`);
console.log(`Ancoratges duplicats esborrats: ${duplicatesRemoved}`);
