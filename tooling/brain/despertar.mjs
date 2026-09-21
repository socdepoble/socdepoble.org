import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

function runGitCommand(cmd) {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: 'utf-8' }).trim();
  } catch {
    return 'Desconegut';
  }
}

function getDesktopFiles() {
  const desktopPath = path.join(rootDir, '_wiki_de_poble/04_escriptori');
  try {
    const files = fs.readdirSync(desktopPath).filter(f => f.toLowerCase() !== '00_bandeja_d_entrada' && f.toLowerCase() !== '01_produccio' && !f.startsWith('.'));
    if (files.length === 0) return "L'escriptori està net.";
    return files.map(f => `- ${f}`).join('\n');
  } catch {
    return "Error llegint l'escriptori.";
  }
}

function getLatestEstat() {
  const estatPath = path.join(rootDir, '.agents/ESTAT.md');
  try {
    const content = fs.readFileSync(estatPath, 'utf-8');
    // Extract first 1500 chars to get the most recent entries (after frontmatter)
    if (content.length < 1500) return content;
    return content.substring(0, 1500) + "\n...(retallat)...";
  } catch {
    return "ESTAT.md no trobat o buit.";
  }
}

function generateOnEstic() {


  const branch = runGitCommand('git rev-parse --abbrev-ref HEAD');
  const hash = runGitCommand('git rev-parse --short HEAD');
  const date = new Date().toISOString();

  const desktopFiles = getDesktopFiles();
  const estat = getLatestEstat();

  const content = `---
type: document
status: generat
description: Estat de la sessió actua generat per despertar.mjs
---
# ON_ESTIC.md (Context de Sessió Actiu)

**Generat automàticament el:** ${date}
**Branca Git:** ${branch}
**Commit:** ${hash}

## 1. Contingut de l'Escriptori (Taula de Treball)
Açò és el que hi ha ara mateix damunt la taula (\`_wiki_de_poble/04_escriptori/\`). Llig aquests fitxers si n'hi ha.
${desktopFiles}

## 2. Resum de l'ESTAT recent
Açò és l'últim que es va anotar a \`.agents/ESTAT.md\`:

${estat}

## 3. Què has de fer ara?
1. Revisa l'escriptori per veure si tens auditories, actes marmota o plantilles.
2. Mira l'ESTAT per veure quines tasques s'han deixat a mitges.
3. Espera les ordres del Mestre.
`;

  const outPath = path.join(rootDir, '.agents/ON_ESTIC.md');
  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`[despertar.mjs] ON_ESTIC.md generat amb èxit a ${date}`);
}

generateOnEstic();
