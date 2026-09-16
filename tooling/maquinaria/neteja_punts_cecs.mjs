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
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(res, callback);
      }
    } else if (entry.name.endsWith('.md')) {
      callback(res);
    }
  }
}

let puntsCecs = 0;

console.log("🔍 Escanejant la Wiki a la recerca de Punts Cecs (Pàgines sense cap enllaç d'eixida)...\\n");

walkDir(wikiDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Un "punt cec" és aquell que no té cap enllaç Wiki [[...]]
  const hasWikiLink = /\[\[.+?\]\]/.test(content);
  const isArchive = filePath.includes('90_arxiu_historic');
  const isTemplate = filePath.includes('07_plantilles');
  
  if (!hasWikiLink && !isArchive && !isTemplate) {
    puntsCecs++;
    console.log(`⚠️ Punt Cec: ${path.relative(wikiDir, filePath)}`);
  }
});

console.log(`\n🎉 Escaneig completat! S'han trobat ${puntsCecs} documents operatius sense cap enllaç.`);
