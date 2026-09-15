#!/usr/bin/env node
/**
 * plaquetes.mjs v1.1 - Sistema Immunitari de Sóc de Poble
 * Diagnòstic, quarantena i curació de fantasmes i orfes.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import readline from 'readline';

const args = process.argv.slice(2);
const REPO_ROOT = process.cwd();
const IMMUNITARI_DIR = path.join(REPO_ROOT, '.immunitari');
const CONFIG_PATH = path.join(IMMUNITARI_DIR, 'config.json');
const RECEPTES_DIR = path.join(IMMUNITARI_DIR, 'receptes');
const APROVACIONS_DIR = path.join(IMMUNITARI_DIR, 'aprovacions');
const QUARANTENA_DIR = path.join(IMMUNITARI_DIR, 'quarantena');
const JOURNAL_PATH = path.join(IMMUNITARI_DIR, 'journal.ndjson');
const BASELINE_PATH = path.join(IMMUNITARI_DIR, 'baseline.json');
const SCRIPTS_DIR = path.join(REPO_ROOT, 'scripts', 'immunitari');

const IS_AUTONOM = args.includes('--autonom') || process.env.PLAQUETES_AUTONOM;
if (IS_AUTONOM) {
  console.log("🤖 PLAQUETES V2: Mode Autònom Activat. Només s'executaran tasques L0 i L1.");
}

const REGISTRE_TASQUES_PATH = path.join(REPO_ROOT, '.agents', 'cron', 'registre_tasques.json');
let registreTasques = { plaquetes: [] };
if (fs.existsSync(REGISTRE_TASQUES_PATH)) {
  registreTasques = JSON.parse(fs.readFileSync(REGISTRE_TASQUES_PATH, 'utf8'));
}

function getNivell(idTasca) {
  const tasca = registreTasques.plaquetes.find(t => t.id === idTasca);
  return tasca ? tasca.nivell : 'L3'; // Fall-closed: Si no existeix, màxim risc (L3)
}

function assegura(targetPath) {
  const rp = path.resolve(targetPath);
  if (rp.includes(SCRIPTS_DIR) || rp.includes(path.join(REPO_ROOT, '.git'))) {
    console.error(`🩸 LÍNIA ROJA R4: Escriptura vetada a ${targetPath}`);
    process.exit(2);
  }
}

function escriuAtomic(targetPath, content) {
  assegura(targetPath);
  const tmpPath = targetPath + '.plaquetes.tmp';
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, targetPath);
}

function runGit(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    console.error(`Error de git: git ${cmd}`);
    process.exit(1);
  }
}

function arbreNet() {
  try {
    return execSync('git status --porcelain', { encoding: 'utf8' }).trim() === '';
  } catch (e) {
    return false;
  }
}

const cmd = args[0] || 'diagnostic';

if (cmd === 'init') {
  if (!fs.existsSync(IMMUNITARI_DIR)) fs.mkdirSync(IMMUNITARI_DIR, { recursive: true });
  if (!fs.existsSync(RECEPTES_DIR)) fs.mkdirSync(RECEPTES_DIR, { recursive: true });
  if (!fs.existsSync(APROVACIONS_DIR)) fs.mkdirSync(APROVACIONS_DIR, { recursive: true });
  if (!fs.existsSync(QUARANTENA_DIR)) fs.mkdirSync(QUARANTENA_DIR, { recursive: true });

  const defaultConfig = {
    vault: "_wiki_de_poble",
    ignoraObjectius: ["00_AGENTS_I_SKILLS_MIRROR"],
    exclouFonts: ["00_AGENTS_I_SKILLS_MIRROR"],
    hubsTaxonomics: ["Graf", "Maquina", "Identitat", "Coneixement", "Govern", "Sollutia", "07_plantilles", "skills"],
    hubsDelegats: true,
    indexAdopcio: "00_INDEX",
    memorialLapides: "00_MEMORIAL_Lapides"
  };
  
  if (!fs.existsSync(CONFIG_PATH)) {
    escriuAtomic(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
  }
  
  const gitignorePath = path.join(IMMUNITARI_DIR, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    escriuAtomic(gitignorePath, "journal.ndjson\n");
  }
  console.log("🩸 Sistema Immunitari inicialitzat a .immunitari/");
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const vaultDir = path.join(REPO_ROOT, config.vault);

function extreuFantasmes(content) {
  const linkRegex = /\[\[(.*?)\]\]/g;
  let matches = [];
  let match;
  const net = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  while ((match = linkRegex.exec(net)) !== null) {
    let raw = match[1];
    if (raw.includes('|')) raw = raw.split('|')[0];
    if (raw.includes('#')) raw = raw.split('#')[0];
    if (raw.trim() && !raw.startsWith('http')) matches.push(raw.trim());
  }
  return matches;
}

function llistaFitxers(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (let file of list) {
    if (file.startsWith('.')) continue;
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      results = results.concat(llistaFitxers(p));
    } else if (file.endsWith('.md')) {
      results.push(p);
    }
  }
  return results;
}

function llistaBrossa(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (let file of list) {
    if (file.startsWith('.')) continue;
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      results = results.concat(llistaBrossa(p));
    } else {
      if (file.endsWith('.zip')) {
        results.push(p);
      } else if (file.endsWith('.mjs') && (p.includes('quarantena') || p.includes('Bandeja_d_Entrada'))) {
        results.push(p);
      } else if (file.endsWith('.json') && p.includes('quarantena')) {
        results.push(p);
      } else if (file === 'metadata_schema.json' && p.includes('03_GOVERNAR')) {
        results.push(p);
      }
    }
  }
  return results;
}

if (cmd === 'diagnostic') {
  console.log("🩸 Rastrejant el graf...");
  const isPorta = args.includes('--porta');
  const fitxers = llistaFitxers(vaultDir);
  
  const basenames = new Set();
  fitxers.forEach(f => basenames.add(path.basename(f, '.md').toLowerCase()));
  
  let fantasmes = [];
  let referits = new Set();

  fitxers.forEach(f => {
    if (config.exclouFonts.some(exc => f.includes(exc))) return;
    const links = extreuFantasmes(fs.readFileSync(f, 'utf8'));
    
    links.forEach(l => {
      referits.add(l.toLowerCase());
      if (!basenames.has(l.toLowerCase()) && !fs.existsSync(path.join(REPO_ROOT, l))) {
        fantasmes.push({ font: f, objectiu: l });
      }
    });
  });

  let orfes = [];
  let buits = [];
  fitxers.forEach(f => {
    const cont = fs.readFileSync(f, 'utf8').trim();
    if (cont === '') {
      buits.push(f);
      return;
    }
    const base = path.basename(f, '.md').toLowerCase();

    if (!referits.has(base) && 
        base !== config.indexAdopcio.toLowerCase() && 
        base !== config.memorialLapides.toLowerCase() &&
        !config.ignoraObjectius.some(ign => f.includes(ign))) {
      orfes.push(f);
    }
  });
  
  const brossa = llistaBrossa(vaultDir);
  buits = buits.concat(brossa);

  if (isPorta) {
    if (!fs.existsSync(BASELINE_PATH)) {
      console.error("🩸 Error: no hi ha baseline segellada. Executa 'segella' primer.");
      process.exit(1);
    }
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    const totalFerides = fantasmes.length + orfes.length;
    if (totalFerides > baseline.ferides) {
      console.error(`🩸 PORTA TANCADA: S'han detectat ${totalFerides} ferides noves (baseline: ${baseline.ferides}).`);
      process.exit(1);
    } else {
      console.log(`🩸 PORTA OBERTA: El Mas respira (${totalFerides} ferides totals).`);
      process.exit(0);
    }
  }

  const ops = [];
  let idC = 1;
  const genId = () => `OP-${String(idC++).padStart(3, '0')}`;
  
  const perFont = {};
  fantasmes.forEach(f => {
    if (!perFont[f.font]) perFont[f.font] = [];
    perFont[f.font].push(f.objectiu);
  });
  
  for (const [font, objs] of Object.entries(perFont)) {
    const objectiusUnics = [...new Set(objs)];
    const filtrats = objectiusUnics.filter(o => !(config.hubsDelegats && config.hubsTaxonomics.includes(o)));
    if (filtrats.length > 0) {
      if (!IS_AUTONOM || ['L0', 'L1'].includes(getNivell('lapida-fantasmes'))) {
        ops.push({
          id: genId(),
          tipus: "LAPIDA",
          fitxer: path.relative(REPO_ROOT, font),
          objectius: filtrats,
          hashFont: crypto.createHash('sha256').update(fs.readFileSync(font)).digest('hex')
        });
      }
    }
  }

  orfes.forEach(o => {
    if (!IS_AUTONOM || ['L0', 'L1'].includes(getNivell('adopta-orfes'))) {
      ops.push({
        id: genId(),
        tipus: "ADOPTA",
        fitxer: path.relative(REPO_ROOT, o)
      });
    }
  });

  buits.forEach(b => {
    if (!IS_AUTONOM || ['L0', 'L1'].includes(getNivell('quarantena-brossa'))) {
      ops.push({
        id: genId(),
        tipus: "DESTRUEIX",
        fitxer: path.relative(REPO_ROOT, b)
      });
    }
  });

  if (ops.length === 0) {
    console.log("🩸 El Mas respira. Zero operables.");
    process.exit(0);
  }

  const recepta = { id: `R-${Date.now()}`, data: new Date().toISOString(), operacions: ops };
  const receptaId = `${Date.now()}_RECEPTA`;
  escriuAtomic(path.join(RECEPTES_DIR, `${receptaId}.json`), JSON.stringify(recepta, null, 2));
  console.log(`🩸 Recepta ${receptaId} generada amb ${ops.length} operacions.`);
  process.exit(0);
}

if (cmd === 'aprova') {
  const receptaId = args[1];
  if (!receptaId) { console.error("🩸 Necessites un ID de recepta."); process.exit(1); }
  const rPath = path.join(RECEPTES_DIR, `${receptaId}.json`);
  if (!fs.existsSync(rPath)) { console.error("🩸 Recepta no trobada."); process.exit(1); }
  
  const cont = fs.readFileSync(rPath, 'utf8');
  const fullHash = crypto.createHash('sha256').update(cont).digest('hex');
  const shortHash = fullHash.substring(0, 12);
  
  console.log(`Has de signar mecànicament introduint els primers 12 caràcters del hash: ${shortHash}`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Confirma el hash: ', (resposta) => {
    if (resposta.trim() === shortHash) {
      const aprov = { recepta: receptaId, hash: fullHash, data: new Date().toISOString() };
      escriuAtomic(path.join(APROVACIONS_DIR, `${receptaId}.aprovat.json`), JSON.stringify(aprov, null, 2));
      console.log("🩸 Aprovació segellada mecànicament.");
    } else {
      console.error("🩸 Hash incorrecte. Aprovació denegada.");
    }
    rl.close();
  });
}

if (cmd === 'aplica') {
  const receptaId = args[1];
  if (!arbreNet()) { console.error("🩸 LÍNIA ROJA R2: L'arbre git no està net."); process.exit(2); }
  const aPath = path.join(APROVACIONS_DIR, `${receptaId}.aprovat.json`);
  if (!fs.existsSync(aPath)) { console.error("🩸 Falta aprovació."); process.exit(1); }
  
  const recepta = JSON.parse(fs.readFileSync(path.join(RECEPTES_DIR, `${receptaId}.json`), 'utf8'));
  const memPath = path.join(vaultDir, `${config.memorialLapides}.md`);
  const indexPath = path.join(vaultDir, `${config.indexAdopcio}.md`);

  recepta.operacions.forEach(op => {
    const fPath = path.join(REPO_ROOT, op.fitxer);
    
    if (op.tipus === 'LAPIDA') {
      const currentHash = crypto.createHash('sha256').update(fs.readFileSync(fPath)).digest('hex');
      if (currentHash !== op.hashFont) { console.warn(`🩸 Saltant ${op.id} - mutat.`); return; }
      
      let txt = fs.readFileSync(fPath, 'utf8');
      op.objectius.forEach(obj => {
        if (op.fitxer.includes('INDEX')) {
          const regex = new RegExp(`\\[\\[${obj}(?:\\|[^\\]]+)?\\]\\]`);
          txt = txt.split('\n').filter(line => !regex.test(line) && !line.includes(`[[${config.memorialLapides}#${obj}|`)).join('\n');
        } else {
          txt = txt.split(`[[${obj}]]`).join(`[[${config.memorialLapides}#${obj}|${obj} †]]`);
        }
      });
      escriuAtomic(fPath, txt);
      
      const memPath = path.join(vaultDir, `${config.memorialLapides}.md`);
      let memContent = fs.existsSync(memPath) ? fs.readFileSync(memPath, 'utf8') : '# Memorial de Llàpides\n\n';
      op.objectius.forEach(obj => {
        memContent += `- [${new Date().toISOString()}] Enllaç tancat a ${op.fitxer} (apuntava a: ${obj})\n`;
      });
      escriuAtomic(memPath, memContent);
      runGit(`add "${fPath}" "${memPath}"`);
      const msgFile = path.join(REPO_ROOT, '.git', 'COMMIT_MSG_PLAQUETES');
      fs.writeFileSync(msgFile, `[PLAQUETES ${op.id}] LAPIDA: ${op.objectius.join(', ')}`);
      runGit(`commit --no-verify -F "${msgFile}"`);
      fs.unlinkSync(msgFile);
    }
    
    if (op.tipus === 'ADOPTA') {
      const indexPath = path.join(vaultDir, `${config.indexAdopcio}.md`);
      let idxContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : `# ${config.indexAdopcio}\n\n`;
      if (!idxContent.includes("## Adopcions de Les Plaquetes")) idxContent += "\n## Adopcions de Les Plaquetes\n";
      idxContent += `- [[${path.basename(op.fitxer, '.md')}]]\n`;
      escriuAtomic(indexPath, idxContent);
      runGit(`add "${indexPath}"`);
      const msgFile = path.join(REPO_ROOT, '.git', 'COMMIT_MSG_PLAQUETES');
      fs.writeFileSync(msgFile, `[PLAQUETES ${op.id}] ADOPTA: ${op.fitxer}`);
      runGit(`commit --no-verify -F "${msgFile}"`);
      fs.unlinkSync(msgFile);
    }
    
    if (op.tipus === 'DESTRUEIX') {
      const qPath = path.join(QUARANTENA_DIR, path.basename(op.fitxer) + '.' + Date.now() + '.quarantena');
      fs.renameSync(fPath, qPath);
      runGit(`add "${fPath}"`);
      const msgFile = path.join(REPO_ROOT, '.git', 'COMMIT_MSG_PLAQUETES');
      fs.writeFileSync(msgFile, `[PLAQUETES ${op.id}] DESTRUEIX (Quarantena): ${op.fitxer}`);
      runGit(`commit --no-verify -F "${msgFile}"`);
      fs.unlinkSync(msgFile);
    }
    
    const jEntry = JSON.stringify({ op: op.id, tipus: op.tipus, fitxer: op.fitxer, data: new Date().toISOString() }) + "\n";
    fs.appendFileSync(JOURNAL_PATH, jEntry);
  });
  console.log("🩸 Operacions aplicades i versionades.");
}

if (cmd === 'reversa') {
  const opId = args[1];
  try {
    const sha = runGit(`log --grep="\\[PLAQUETES ${opId}\\]" --format="%H" -n 1`);
    if (!sha) throw new Error("No trobat");
    runGit(`revert --no-edit ${sha}`);
    console.log(`🩸 Reversa quirúrgica de ${opId} completada.`);
  } catch (e) {
    console.error(`🩸 Error revertint ${opId}. Arbre net?`);
  }
}

if (cmd === 'segella') {
  const fitxers = llistaFitxers(vaultDir);
  const basenames = new Set();
  fitxers.forEach(f => basenames.add(path.basename(f, '.md').toLowerCase()));
  let ferides = 0; let referits = new Set();
  fitxers.forEach(f => {
    if (config.exclouFonts.some(exc => f.includes(exc))) return;
    const links = extreuFantasmes(fs.readFileSync(f, 'utf8'));
    links.forEach(l => { referits.add(l.toLowerCase()); if (!basenames.has(l.toLowerCase()) && !fs.existsSync(path.join(REPO_ROOT, l))) ferides++; });
  });
  fitxers.forEach(f => {
    const base = path.basename(f, '.md').toLowerCase();
    if (!referits.has(base) && base !== config.indexAdopcio.toLowerCase() && base !== config.memorialLapides.toLowerCase() && !config.ignoraObjectius.some(ign => f.includes(ign))) ferides++;
  });
  escriuAtomic(BASELINE_PATH, JSON.stringify({ ferides, data: new Date().toISOString() }));
  console.log(`🩸 Baseline segellada amb ${ferides} ferides legals.`);
}
