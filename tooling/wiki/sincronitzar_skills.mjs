import fs from 'fs';
import path from 'path';

const SKILLS_DIR = path.join(process.cwd(), '.agents/skills');
const DEST_DIR = path.join(process.cwd(), '_wiki_de_poble/02_saber/skills_mirror');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

console.log('🧠 [Sincronitzador] Iniciant bolcat del cervell a la Wiki (Identitat)...');

if (!fs.existsSync(SKILLS_DIR)) {
  console.error('❌ No s\'ha trobat el directori de skills:', SKILLS_DIR);
  process.exit(1);
}

const skillsDirs = fs.readdirSync(SKILLS_DIR).filter(file => {
  return fs.statSync(path.join(SKILLS_DIR, file)).isDirectory();
});

let count = 0;

for (const skillName of skillsDirs) {
  const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    let content = fs.readFileSync(skillPath, 'utf8');
    const destPath = path.join(DEST_DIR, `agents_${skillName.toLowerCase().replace(/-/g, '_')}.md`);
    
    // Injectem el títol a sota del frontmatter per no trencar les metadades YAML
    let finalContent = content;
    const fmMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    if (fmMatch) {
      finalContent = content.replace(fmMatch[0], `${fmMatch[0]}\n<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/${skillName}/SKILL.md -->\n\n`);
    } else {
      finalContent = `<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/${skillName}/SKILL.md -->\n\n` + content;
    }
    
    // Remove taxonomy generation to prevent ETIQUETA-FALSA errors in teixidor.
    
    fs.writeFileSync(destPath, finalContent, 'utf8');
    console.log(`✅ Espill creat: agents_${skillName.toLowerCase().replace(/-/g, '_')}.md`);
    count++;
  }
}

const indexPath = path.join(SKILLS_DIR, '00_INDEX_SKILLS.md');
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  let finalContent = content;
  const fmMatch = content.match(/^---\n[\s\S]*?\n---\n/);
  if (fmMatch) {
    finalContent = content.replace(fmMatch[0], `${fmMatch[0]}\n<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/00_INDEX_SKILLS.md -->\n\n`);
  } else {
    finalContent = `<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/00_INDEX_SKILLS.md -->\n\n` + content;
  }
  fs.writeFileSync(path.join(DEST_DIR, '00_index_skills.md'), finalContent, 'utf8');
  console.log(`✅ Espill creat: 00_index_skills.md`);
}

console.log(`🎉 [Sincronitzador] ${count} skills i el seu índex sincronitzats correctament a l'arrel de la Identitat.`);
