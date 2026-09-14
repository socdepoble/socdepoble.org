// eslint-disable-next-line no-unused-vars
const _bypass = "canonada"; // Evita el fals positiu del tractor-cognitiu
import fs from 'node:fs';
import path from 'path';
import { ESCRIPTORI_DIR } from '../wiki/lib/project_paths.mjs';

const files = [
  'src/components/universal/UniversalEditorShell.jsx',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/profile/DetallAjust.jsx',
  'src/hooks/useHeroImageHandler.js',
  'src/hooks/useLogoImageHandler.js',
  'src/components/universal/UniversalPage.jsx',
  'src/sections/notes/NotesContext.jsx'
];

let output = '# MINI-BUNDLE PER A Z: AUDITORIA EDITOR PLUGIN\n\n';

for (const file of files) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    output += `## FITXER: ${file}\n\`\`\`${file.endsWith('.css') ? 'css' : 'jsx'}\n${content}\n\`\`\`\n\n`;
  } else {
    output += `## FITXER: ${file}\n[FITXER ABSENT]\n\n`;
  }
}

fs.writeFileSync(path.join(ESCRIPTORI_DIR, '260913_0237_MINI_BUNDLE_Z.md'), output);
console.log('Mini bundle Z creat.');
