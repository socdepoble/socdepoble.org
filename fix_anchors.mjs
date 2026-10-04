import { VerificadorSCC } from './tooling/gates/verificador-scc.mjs';
import { readFile, writeFile } from 'fs/promises';
import { relative } from 'path';

async function run() {
  const v = new VerificadorSCC(process.cwd());
  await v.runAudits();
  
  const unanchored = v.errors.filter(e => e.code === 'ESCRIPTORI_UNANCHORED').map(e => e.affected_files[0]);
  
  if (unanchored.length === 0) {
    console.log("No unanchored files found.");
    return;
  }
  
  let indexContent = await readFile('_wiki_de_poble/04_escriptori/00_index_escriptori.md', 'utf8');
  indexContent += "\n\n## Fix Automàtic d'Àncores\n";
  for (const file of unanchored) {
    const relToEscriptori = relative('_wiki_de_poble/04_escriptori', file);
    indexContent += `- [[${relToEscriptori}]]\n`;
  }
  
  await writeFile('_wiki_de_poble/04_escriptori/00_index_escriptori.md', indexContent);
  console.log(`Added ${unanchored.length} anchors.`);
}
run();
