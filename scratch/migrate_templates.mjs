import fs from 'fs';
import path from 'path';

const dir = '_wiki_de_poble/02_saber/07_plantilles';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Substituir claus YAML al frontmatter
  content = content.replace(/^tipus:/gm, 'type:');
  content = content.replace(/^estat:/gm, 'status:');
  
  // Substituir referències documentades al text (amb backticks)
  content = content.replace(/`tipus`/g, '`type`');
  content = content.replace(/`estat`/g, '`status`');
  
  // Substitucions d'exemples dins del text
  content = content.replace(/tipus: /g, 'type: ');
  content = content.replace(/estat: /g, 'status: ');

  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log("Migració completada per a totes les plantilles.");
