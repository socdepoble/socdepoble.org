#!/usr/bin/env node
/** Llei Z · Segell criptogràfic de les skills.
 *
 *  Què protegix: que ningú modifique les regles d'amagat. Per tant el hash ha de
 *  cobrir les REGLES, no el que el sistema operatiu deixa caure dins de la
 *  carpeta. Un `.DS_Store` que el Finder escriu en obrir `.agents/skills/` no és
 *  una regla, i fins al 260923 trencava el segell i emmudia les 45 portes que
 *  venen darrere.
 *
 *  Superfície segellada: `.agents/skills/**\/*.md` (les 16 SKILL.md i
 *  00_INDEX_SKILLS.md). Qualsevol altra extensió queda fora del hash i es
 *  reporta com a ignorada perquè l'exclusió siga visible, no silenciosa.
 *
 *  Ús: segella.mjs [--update] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const SEGELLABLE = /\.md$/i;

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isSymbolicLink()) throw new Error(`Symlink en superfície segellada: ${filePath}`);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

/** Calcula el hash de la superfície segellable. Retorna també què ha quedat fora. */
export function calculaSegell(root = process.cwd()) {
  const agentsDir = path.resolve(root, '.agents/skills');
  if (fs.existsSync(agentsDir) && fs.lstatSync(agentsDir).isSymbolicLink()) throw new Error('Directori de skills amb symlink');
  const tots = getAllFiles(agentsDir).sort();
  const files = tots.filter((f) => SEGELLABLE.test(path.basename(f)));
  const ignorats = tots.filter((f) => !SEGELLABLE.test(path.basename(f)))
    .map((f) => path.relative(root, f));

  const manifest = {};
  const combinedHash = crypto.createHash('sha256');
  for (const file of files) {
    manifest[path.relative(root, file)] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    combinedHash.update(path.relative(root, file));
    combinedHash.update(fs.readFileSync(file));
  }
  return { hash: combinedHash.digest('hex'), manifest, files: files.map((f) => path.relative(root, f)), ignorats };
}

/** Compara o actualitza el segell. No llança: torna un resultat descriptible. */
export function verificaSegell(root = process.cwd(), { update = false, expectedHash, expectedPrevious, reason } = {}) {
  const sealFile = path.resolve(root, '.agents/SKILLS_SEAL.json');
  const { hash, files, ignorats, manifest } = calculaSegell(root);
  if (fs.existsSync(path.join(root, '.agents/runtime/mutation.pending.json'))) {
    if (update) throw new Error('Operació incompleta: reconciliació requerida, --update prohibit');
    return {ok: false, motiu: 'operació incompleta', hash, files, ignorats};
  }
  const existeix = fs.existsSync(sealFile);

  if (!existeix && !update) {
    return { ok: false, motiu: 'absent', hash, anterior: null, files, ignorats };
  }
  const oldSeal = existeix ? JSON.parse(fs.readFileSync(sealFile, 'utf8')) : { hash: null };

  if (!update) {
    let traceValid = true;
    if (oldSeal.transaction) {
      try {
        if (!/^[a-f0-9-]{36}$/.test(oldSeal.transaction)) throw new Error('Id invàlid');
        const r=JSON.parse(fs.readFileSync(path.join(root,'.agents/seal-transactions',`${oldSeal.transaction}.json`),'utf8'));
        traceValid=r.id===oldSeal.transaction && r.state==='accepted' && r.afterSeal===hash;
      } catch { traceValid=false; }
    }
    const ok = traceValid && oldSeal.hash !== null && oldSeal.hash === hash;
    return { ok, motiu: ok ? 'intacte' : 'ruptura', hash, anterior: oldSeal.hash, files, ignorats };
  }

  let transaction;
  if (existeix) {
    if (expectedHash !== hash || expectedPrevious !== oldSeal.hash || !reason?.trim()) throw new Error('Reconciliació explícita: cal expectedHash, expectedPrevious i reason després de revisar el diff');
    const runtime = path.join(root,'.agents/runtime');
    fs.mkdirSync(runtime,{recursive:true});
    const lock=path.join(runtime,'mutation.lock'), fd=fs.openSync(lock,'wx',0o600);
    const pending=path.join(runtime,'mutation.pending.json');
    const syncDir=dir=>{const d=fs.openSync(dir,'r');try{fs.fsyncSync(d);}finally{fs.closeSync(d);}};
    const durable=(file,text,flag='wx')=>{const out=fs.openSync(file,flag,0o600);try{fs.writeFileSync(out,text);fs.fsyncSync(out);}finally{fs.closeSync(out);}};
    try {
      if (calculaSegell(root).hash !== expectedHash || JSON.parse(fs.readFileSync(sealFile,'utf8')).hash !== expectedPrevious) throw new Error('CAS de reconciliació divergent');
      transaction=crypto.randomUUID();
      const record={id:transaction,state:'accepted',kind:'explicit-reconciliation',reason,beforeSeal:expectedPrevious,afterSeal:hash,manifest};
      durable(pending,JSON.stringify({...record,state:'prepared'})+'\n'); syncDir(runtime);
      durable(path.join(runtime,'segell.log'),JSON.stringify(record)+'\n','a');
      const evidence=path.join(root,'.agents/seal-transactions');fs.mkdirSync(evidence,{recursive:true});
      durable(path.join(evidence,`${transaction}.json`),JSON.stringify(record,null,2)+'\n'); syncDir(evidence);
      const temp=`${sealFile}.${transaction}.tmp`;
      durable(temp,JSON.stringify({timestamp:new Date().toISOString(),hash,filesCount:files.length,manifest,transaction},null,2)+'\n');
      if (calculaSegell(root).hash !== expectedHash || JSON.parse(fs.readFileSync(sealFile,'utf8')).hash !== expectedPrevious) throw new Error('Canvi concurrent durant la reconciliació');
      fs.renameSync(temp,sealFile); syncDir(path.dirname(sealFile));
      fs.unlinkSync(pending); syncDir(runtime);
    } finally {fs.closeSync(fd);fs.unlinkSync(lock);}
  } else {
    // Bootstrap has no prior generation to approve. Later updates require an exact reviewed CAS.
    const seal = { timestamp: new Date().toISOString(), hash, filesCount: files.length, manifest };
    fs.writeFileSync(sealFile, `${JSON.stringify(seal, null, 2)}\n`, {flag:'wx'});
  }
  return {
    ok: true,
    motiu: oldSeal.hash === hash ? 'intacte' : 'resegellat',
    hash,
    anterior: oldSeal.hash,
    files,
    ignorats
  };
}

function main() {
  const update = process.argv.includes('--update');
  const json = process.argv.includes('--json');
  const option = name => process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
  const r = verificaSegell(process.cwd(), { update, expectedHash:option('expected-hash'), expectedPrevious:option('expected-previous'), reason:option('reason') });

  if (json) {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  }

  if (!r.ok && r.motiu !== 'absent' && r.motiu !== 'ruptura') { console.error(r.motiu); process.exit(1); }
  if (r.motiu === 'absent') {
    console.error('Segell absent; cal una actualització explícita amb --update');
    process.exit(1);
  }
  if (r.motiu === 'ruptura') {
    console.error(`❌ [Llei Z] Ruptura de segell detectada! El hash actual ${r.hash.substring(0, 8)} no coincideix amb el segellat ${r.anterior.substring(0, 8)}. T'han modificat les regles d'amagat? Usa --update si és intencionat.`);
    process.exit(1);
  }
  if (r.ignorats.length) {
    console.log(`ℹ️ [Llei Z] ${r.ignorats.length} fitxer(s) fora del segell perquè no són regles: ${r.ignorats.join(', ')}`);
  }
  if (r.motiu === 'resegellat') {
    console.log(`✅ [Llei Z] Nou segell de skills desat. Hash: ${r.hash.substring(0, 8)}... (anterior ${String(r.anterior).substring(0, 8)})`);
  } else {
    console.log(`✅ [Llei Z] Skills cryptosegellats sense canvis. Hash: ${r.hash.substring(0, 8)}...`);
  }
  process.exit(0);
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { main(); } catch(e) { console.error(e.message); process.exitCode=1; }
}
