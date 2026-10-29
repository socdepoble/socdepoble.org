#!/usr/bin/env node
/**
 * tractor_cognitiu.mjs — Tractor interactiu per a la higiene de l'espai de treball.
 *
 * Escaneja l'arrel del repositori i del workspace a la recerca de fitxers orfes
 * (no seguits per git i que no siguen de configuració oculta) i demana al Mestre 
 * de manera interactiva què fer amb cadascun.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

function seguitsPerGit(root) {
  try {
    const out = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    return new Set(out.split('\0').filter(Boolean));
  } catch { return new Set(); }
}

// Les carpetes legítimes del workspace (fora del repo)
const carpetesWorkspace = new Set([
  '_arxiu_wiki_de_poble', '_comunicacio_de_poble', '_cultura_de_poble',
  '_gestoria_de_poble', '_multimedia_de_poble', '_raw_de_poble',
  '_builds_de_poble', '_investigacio_ia_de_poble', '_paperera_de_poble',
  'oficina_de_poble', 'socdepoble.org', '.DS_Store', '.gitignore'
]);

function getCandidats(dirPath, isWorkspace) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const gitFiles = seguitsPerGit(dirPath);
  
  return entries
    .filter(e => e.isFile())
    .filter(e => !e.name.startsWith('.')) // Ignora .env, .gitignore (ja tractats o sensibles)
    .filter(e => !gitFiles.has(e.name))
    .filter(e => !(isWorkspace && carpetesWorkspace.has(e.name)))
    .map(e => path.join(dirPath, e.name))
    .sort();
}

function askQuestion(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const repoRoot = arrelSegura();
  const workspaceRoot = path.resolve(repoRoot, '..');
  
  const candidatsRepo = getCandidats(repoRoot, false);
  const candidatsWorkspace = getCandidats(workspaceRoot, true);
  
  const tots = [...candidatsWorkspace, ...candidatsRepo];
  
  if (tots.length === 0) {
    console.log("✨ L'espai de treball i el repositori estan impecables. No hi ha brossa solta.");
    process.exit(0);
  }

  console.log(`🔎 S'han trobat ${tots.length} fitxers orfes (no seguits per git):`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const paperera = path.join(repoRoot, '.sdp-paperera', `quarantena-${timestamp}`);
  const arxiu = path.join(repoRoot, '_wiki_de_poble', '90_arxiu_historic');
  
  let creatPaperera = false;

  for (const filePath of tots) {
    console.log(`\n📄 Fitxer: ${path.relative(workspaceRoot, filePath)}`);
    let resolt = false;
    while (!resolt) {
      const resp = await askQuestion(rl, '   Què fem? [A]rxiu històric | [Q]uarantena | [E]sborrar | [I]gnorar: ');
      const opcio = resp.trim().toUpperCase();
      
      try {
        if (opcio === 'A') {
          const dest = path.join(arxiu, path.basename(filePath));
          fs.renameSync(filePath, dest);
          console.log(`   ✅ Mogut a l'Arxiu Històric: ${dest}`);
          resolt = true;
        } else if (opcio === 'Q') {
          if (!creatPaperera) { fs.mkdirSync(paperera, { recursive: true }); creatPaperera = true; }
          const dest = path.join(paperera, path.basename(filePath));
          fs.renameSync(filePath, dest);
          console.log(`   ☣️  Mogut a Quarantena: ${dest}`);
          resolt = true;
        } else if (opcio === 'E') {
          fs.unlinkSync(filePath);
          console.log(`   💥 Esborrat definitivament.`);
          resolt = true;
        } else if (opcio === 'I') {
          console.log(`   ⏭️  Ignorat.`);
          resolt = true;
        } else {
          console.log(`   ❌ Opció invàlida. Escull A, Q, E o I.`);
        }
      } catch (err) {
        console.error(`   ❌ Error movent el fitxer: ${err.message}`);
        resolt = true; // Salta al següent en cas d'error de permisos
      }
    }
  }
  
  rl.close();
  console.log('\n🏁 Neteja interactiva completada.');
}

if (esMain(import.meta.url)) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
