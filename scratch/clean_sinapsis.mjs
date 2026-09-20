import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modified = 0;
let errors = 0;

walkDir('_wiki_de_poble', function(filePath) {
  if (filePath.endsWith('.md')) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      const regex1 = /\n*## Sinapsis Entrants \(Autogenerat\)[\s\S]*?<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->\n*/g;
      const regex2 = /\n*## Sinapsis Entrants[\s\S]*?<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->\n*/g;
      const regex3 = /\[\[([^\]|]+)\|0[1-9]_[A-Z][A-Z_a-z]*\/([^\]]+)\]\]/g; // Catch uppercase alias like 00_SER_Brain_Identitat/00_BIOS.md
      
      let newContent = content.replace(regex1, '\n\n').replace(regex2, '\n\n');
      
      // Remove any leftover uppercase paths in links
      newContent = newContent.replace(/\[\[(.*?)\|0[0-9]_[A-Z_a-z]+\/(.*?)\]\]/g, '[[$1]]');
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        modified++;
      }
    } catch (e) {
      console.error(e);
      errors++;
    }
  }
});

console.log(`Cleaned Sinapsis Entrants from ${modified} files. Errors: ${errors}`);
