import fs from 'fs';
import path from 'path';

const skillsDir = './.agents/skills';
const indexFile = path.join(skillsDir, '00_INDEX_SKILLS.md');
const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.'));

let newContent = `---
tipus: document
estat: canonic
description: Índex de skills i capacitats
tags:
  - core
  - disseny
  - identitat
---
\n# Índex de Skills\n\n`;

for (const dir of dirs) {
  const skillMdPath = path.join(skillsDir, dir.name, 'SKILL.md');
  if (fs.existsSync(skillMdPath)) {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const match = content.match(/^description:\s*(.+)/m);
    const desc = match ? match[1].trim() : 'Sense descripció';
    newContent += `- [[${dir.name}/SKILL|${dir.name}]]: ${desc}\n`;
  }
}

fs.writeFileSync(indexFile, newContent);
console.log('Índex reconstruït.');
