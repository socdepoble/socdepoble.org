#!/usr/bin/env node
/**
 * time-machine.mjs — Instantànies automàtiques del treball (Time Machine).
 *
 * DESTÍ: tooling/brain/time-machine.mjs (en quarantena al laboratori).
 *
 * PER QUÈ EXISTIX
 *   El 24-09 el text nocturn de MarIA no estava committejat i git no pot
 *   tornar el que mai ha guardat: «restaurar» va voler dir tornar a una versió
 *   d'un mes abans. Cada 30 minuts, si l'arbre ha canviat, este script en fa
 *   una fotografia completa, inclosos els fitxers nous encara no seguits.
 *
 * COM (engranatge intern de git, sense porcellana)
 *   GIT_INDEX_FILE=<git-dir>/time-machine.index git add -A
 *   GIT_INDEX_FILE=<git-dir>/time-machine.index git write-tree
 *   git commit-tree ARBRE [-p ANTERIOR] -m "tm <data>"
 *   git update-ref refs/time-machine/<branca> NOU ANTERIOR
 *
 *   · No toca la branca, l'índex ni HEAD de ningú.
 *   · commit-tree i update-ref no executen cap hook.
 *   · La referència és local: no es puja amb un push normal.
 *   · Respecta .gitignore. Si l'arbre és idèntic a l'última, no escriu res.
 *   · Avorta si un fitxer NOU (no present a HEAD) té nom de secret.
 *
 * ÚS
 *   node tooling/brain/time-machine.mjs               # una instantània si cal
 *   node tooling/brain/time-machine.mjs --llista [RUTA]
 *   node tooling/brain/time-machine.mjs --poda        # retenció
 *   node tooling/brain/time-machine.mjs --json        # eixida per a màquines
 *   node tooling/brain/time-machine.mjs --llancador   # imprimix el plist de launchd (no escriu res)
 *
 * RESTAURACIÓ (sempre quirúrgica, fitxer a fitxer; mai un checkout d'arbre):
 *   git log refs/time-machine/<branca> -- RUTA
 *   git show refs/time-machine/<branca>~N:RUTA
 *
 * RETENCIÓ (--poda): totes les de les últimes 48 h, l'última de cada hora
 * durant 14 dies i l'última de cada dia després. La poda reescriu només la
 * referència privada, amb CAS contra el valor llegit en començar.
 *
 * LÍMIT: una còpia local no sobreviu a una fallada del disc. La segona capa
 * (Time Machine de macOS o una còpia externa) és una decisió humana.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

export const PREFIX_REF = 'refs/time-machine';
/** Noms que mai entren en una instantània si són nous (els ja seguits ja són a la història). */
export const DENEGATS = /(^|\/)(?:\.env(?:\.[^/]*)?|id_rsa|id_ed25519|credentials?(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|\.wwebjs_auth|\.wwebjs_cache)(\/|$)|\.(?:pem|p12|pfx|key)$/i;
const IDENTITAT = {
  GIT_AUTHOR_NAME: 'Time Machine', GIT_AUTHOR_EMAIL: 'time-machine@localhost',
  GIT_COMMITTER_NAME: 'Time Machine', GIT_COMMITTER_EMAIL: 'time-machine@localhost'
};
const HORA = 3600;
const DIA = 24 * HORA;
const PANY_RANCI_MS = 10 * 60 * 1000;

/** Format intern de git («segons +0000»): cap ambigüitat de zona ni de mil·lisegons. */
const dataGit = (data) => `${Math.floor(data.getTime() / 1000)} +0000`;

/* Dins d'un hook, git exporta GIT_DIR i GIT_INDEX_FILE: heretats, apuntarien
   a un altre repositori o a l'índex real. Cada crida parteix d'un entorn net. */
function entornNet() {
  const e = { ...process.env };
  for (const v of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_PREFIX']) delete e[v];
  return e;
}

function git(arrel, args, { env = {}, entrada } = {}) {
  return execFileSync('git', ['-C', arrel, ...args], {
    encoding: 'utf8',
    env: { ...entornNet(), ...env },
    input: entrada,
    stdio: [entrada === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024
  }).trim();
}
function gitOpcional(arrel, args, opcions) {
  try { return git(arrel, args, opcions); } catch { return null; }
}

export function referencia(arrel) {
  const branca = gitOpcional(arrel, ['symbolic-ref', '--quiet', '--short', 'HEAD']) || 'detached';
  return `${PREFIX_REF}/${branca}`;
}

/** Una instantània si l'arbre ha canviat. Torna què ha passat, sense adorns. */
export function instantania(arrel, { ara = new Date() } = {}) {
  const dirGit = git(arrel, ['rev-parse', '--absolute-git-dir']);
  const index = path.join(dirGit, 'time-machine.index');
  const pany = path.join(dirGit, 'time-machine.lock');
  const ref = referencia(arrel);
  let fd;
  try { fd = fs.openSync(pany, 'wx'); } catch {
    // Un pany de més de 10 minuts és d'un procés mort: sense caducitat, bloquejaria per sempre.
    let edat = 0;
    try { edat = Date.now() - fs.statSync(pany).mtimeMs; } catch { /* ja no hi és */ }
    if (edat < PANY_RANCI_MS) return { fet: false, motiu: 'una altra instantània en curs', ref };
    fs.rmSync(pany, { force: true });
    try { fd = fs.openSync(pany, 'wx'); } catch { return { fet: false, motiu: 'una altra instantània en curs', ref }; }
  }
  try {
    const env = { GIT_INDEX_FILE: index };
    git(arrel, ['add', '-A'], { env });
    const seguits = new Set((gitOpcional(arrel, ['ls-tree', '-r', '-z', '--name-only', 'HEAD']) ?? '').split('\0').filter(Boolean));
    const noves = git(arrel, ['ls-files', '-z'], { env }).split('\0').filter((f) => f && !seguits.has(f));
    const secrets = noves.filter((f) => DENEGATS.test(f));
    if (secrets.length) {
      // L'índex privat queda com està: la pròxima volta tornarà a avortar fins que algú ho ignore o ho moga.
      return { fet: false, motiu: 'fitxers nous amb nom de secret', secrets, ref };
    }
    const arbre = git(arrel, ['write-tree'], { env });
    const anterior = gitOpcional(arrel, ['rev-parse', '--verify', '--quiet', ref]);
    if (anterior && gitOpcional(arrel, ['rev-parse', `${anterior}^{tree}`]) === arbre) {
      return { fet: false, motiu: 'sense canvis', ref, commit: anterior };
    }
    const args = ['commit-tree', arbre, ...(anterior ? ['-p', anterior] : []), '-m', `tm ${ara.toISOString()}`];
    const nou = git(arrel, args, { env: { ...IDENTITAT, GIT_AUTHOR_DATE: dataGit(ara), GIT_COMMITTER_DATE: dataGit(ara) } });
    git(arrel, ['update-ref', '-m', 'time-machine', ref, nou, anterior ?? '']);
    return { fet: true, ref, commit: nou, arbre, noves: noves.length };
  } finally {
    fs.closeSync(fd);
    fs.rmSync(pany, { force: true });
  }
}

/** Instantànies de la referència, de la més nova a la més antiga. */
export function llista(arrel, ruta = null) {
  const ref = referencia(arrel);
  if (!gitOpcional(arrel, ['rev-parse', '--verify', '--quiet', ref])) return { ref, instantanies: [] };
  const text = git(arrel, ['log', '--format=%H%x09%ct%x09%s', ref, ...(ruta ? ['--', ruta] : [])]);
  const instantanies = text ? text.split('\n').map((l) => {
    const [commit, segons, missatge] = l.split('\t');
    return { commit, data: new Date(Number(segons) * 1000).toISOString(), missatge };
  }) : [];
  return { ref, instantanies };
}

/**
 * Tria les que es conserven. `instantanies` va de la més nova a la més antiga;
 * dins de cada franja es queda la més nova (la primera que es veu).
 */
export function trieRetencio(instantanies, araSegons) {
  const vistes = new Set();
  return instantanies.filter((i) => {
    const t = Math.floor(Date.parse(i.data) / 1000);
    const edat = araSegons - t;
    if (edat <= 2 * DIA) return true;
    const franja = edat <= 14 * DIA ? `h${Math.floor(t / HORA)}` : `d${Math.floor(t / DIA)}`;
    if (vistes.has(franja)) return false;
    vistes.add(franja);
    return true;
  });
}

/** Reconstruïx la cadena amb les conservades (mateixos arbres i missatges). CAS sobre la punta. */
export function poda(arrel, { ara = new Date() } = {}) {
  const { ref, instantanies } = llista(arrel);
  if (!instantanies.length) return { podat: 0, ref };
  const punta = instantanies[0].commit;
  const conservades = trieRetencio(instantanies, Math.floor(ara.getTime() / 1000));
  if (conservades.length === instantanies.length) return { podat: 0, ref, conservades: conservades.length };
  let pare = null;
  for (const i of [...conservades].reverse()) {
    const arbre = git(arrel, ['rev-parse', `${i.commit}^{tree}`]);
    pare = git(arrel, ['commit-tree', arbre, ...(pare ? ['-p', pare] : []), '-m', i.missatge],
      { env: { ...IDENTITAT, GIT_AUTHOR_DATE: dataGit(new Date(i.data)), GIT_COMMITTER_DATE: dataGit(new Date(i.data)) } });
  }
  git(arrel, ['update-ref', '-m', 'time-machine: poda', ref, pare, punta]);
  return { podat: instantanies.length - conservades.length, conservades: conservades.length, ref };
}

export const ETIQUETA_LLANCADOR = 'org.socdepoble.time-machine';
export const INTERVAL_SEGONS = 1800;

const xml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Plist de launchd germà del de Plaquetes. Només s'imprimix: les rutes són de
 * la màquina (usuari, node) i no han d'entrar al repositori.
 */
export function plistLlancador({ arrel, node, home }) {
  const registre = path.join(home, 'Library', 'Logs', 'socdepoble-time-machine.log');
  const cami = [...new Set([path.dirname(node), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'])].join(':');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${ETIQUETA_LLANCADOR}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(node)}</string>
    <string>${xml(path.join(arrel, 'tooling/brain/time-machine.mjs'))}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xml(arrel)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${xml(cami)}</string>
  </dict>
  <key>StartInterval</key>
  <integer>${INTERVAL_SEGONS}</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${xml(registre)}</string>
  <key>StandardErrorPath</key>
  <string>${xml(registre)}</string>
</dict>
</plist>
`;
}

function main() {
  const argv = process.argv.slice(2);
  const arrel = arrelSegura();
  const json = argv.includes('--json');
  let r;
  if (argv.includes('--llancador')) {
    process.stdout.write(plistLlancador({ arrel, node: process.execPath, home: process.env.HOME || '' }));
    return;
  }
  if (argv.includes('--llista')) {
    const i = argv.indexOf('--llista');
    const ruta = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
    r = llista(arrel, ruta);
    if (!json) {
      console.log(`🕰️  ${r.ref}: ${r.instantanies.length} instantànies${ruta ? ` que toquen ${ruta}` : ''}`);
      for (const x of r.instantanies.slice(0, 30)) console.log(`   ${x.commit.slice(0, 10)}  ${x.data}`);
      if (ruta && r.instantanies.length) console.log(`   Llegir-ne una: git show ${r.instantanies[0].commit.slice(0, 10)}:${ruta}`);
      return;
    }
  } else if (argv.includes('--poda')) {
    r = poda(arrel);
    if (!json) { console.log(`🕰️  ${r.ref}: ${r.podat} podades, ${r.conservades ?? 0} conservades`); return; }
  } else {
    r = instantania(arrel);
    if (!json) {
      if (r.fet) console.log(`🕰️  Instantània ${r.commit.slice(0, 10)} a ${r.ref} (${r.noves} fitxers nous no seguits inclosos)`);
      else console.log(`🕰️  Cap instantània: ${r.motiu}${r.secrets ? ` → ${r.secrets.join(', ')}` : ''}`);
      if (r.secrets) process.exitCode = 2;
      return;
    }
  }
  console.log(JSON.stringify(r, null, 2));
  if (r.secrets) process.exitCode = 2;
}

if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(`[Time Machine] ${e.message}`); process.exitCode = 1; }
}
