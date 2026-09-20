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

walkDir('_wiki_de_poble', function(filePath) {
  if (filePath.endsWith('.md')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace [[target|DIR/target.md]] with [[target]] if DIR contains uppercase letters.
    // e.g. [[00_bios|00_SER_Brain_Identitat/00_BIOS.md]] -> [[00_bios]]
    let newContent = content.replace(/\[\[([^\]|]+)\|0[0-9]_[A-Z_a-z]+\/([^\]]+)\]\]/g, '[[$1]]');
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modified++;
    }
  }
});
console.log(`Cleaned uppercase links from ${modified} files.`);
