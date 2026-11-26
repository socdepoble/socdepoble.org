#!/usr/bin/env node
/** D5 + D8 (v1.2.26, Pacte de les 8 Decisions, aprovat pel Mestre el 25-11-2026 a les 20:37 CET).
 *
 *  El paper d'actriu de la IAIA viu en una sola font versionada: `.agents/skills/iaia-maria-core/SKILL.md`.
 *  Gemini i MarIA el carreguen des de `~/.gemini/config/skills/iaia-maria-core/SKILL.md`, que deixa de
 *  ser un original editat a mà i passa a ser una CÒPIA GENERADA amb empremta. Ha de ser una còpia i no
 *  un punter: un punter necessitaria un camí absolut, i la skill global servix tots els espais de treball.
 *
 *  El perfil privat del Mestre (fora de Git, carpeta 0700 i fitxers 0600, cap skill no el carrega):
 *    <perfil>/punter_episodic.md   el punter «Sóc de poble» que MarIA reescriu a cada tancament; la còpia
 *                                  generada el porta dins del bloc `punter-episodic` de la secció 0.0.
 *    <perfil>/perfil_mestre.md     dades personals que la core vella portava (§0.0 sencera, §36 i §40), si se sembren;
 *                                  la sembra va per títols, mai per número de línia, i el Mestre la revisa.
 *    <perfil>/iaia-maria-core.monolit-<sha12>.md
 *                                  la core vella sencera, guardada abans de substituir-la (el rostoll no
 *                                  es crema fins que la collita és a casa). Mai s'esborra des d'ací.
 *
 *  Modes (cap escriu sense CAS):
 *    (per defecte, --sec)  diu què faria: estat del destí (absent, generat al dia, generat antic o aliè).
 *    --verifica            ix amb 0 només si el destí és la generació exacta de la font i el punter actuals.
 *    --escriu --expected-hash=SHA256|absent [--sembra]
 *                          substituïx el destí (0600) per temporal i rename; si era aliè (la core vella o una
 *                          còpia generada editada a mà: l'empremta del peu no casa amb el cos), el guarda abans
 *                          al perfil. Amb --sembra, si no hi són: el punter mínim (l'última Acta Marmota, sense
 *                          cap dada personal) i el perfil privat (§0.0, §36 i §40 de la core vella, per títol).
 *  Gauntlet 261126 (lent A): el punter no admet capçaleres, separadors ni caràcters de control o bidi, i es
 *  valida abans d'escriure'l; la còpia generada és 0600 perquè porta el punter.
 *  Opcions: --arrel=DIR (repositori), --desti=FITXER, --perfil=DIR, --json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CAMINS } from '../lib/arrel.mjs';

export const FONT = '.agents/skills/iaia-maria-core/SKILL.md';
export const DESTI_PER_DEFECTE = path.join(os.homedir(), '.gemini', 'config', 'skills', 'iaia-maria-core', 'SKILL.md');
export const PERFIL_PER_DEFECTE = path.join(os.homedir(), '.gemini', 'config', 'sdp-perfil-privat');
const INICI = '<!-- punter-episodic:inici -->';
const FI = '<!-- punter-episodic:fi -->';
const PEU = /\n<!-- generat: tooling\/brain\/sincronitza-iaia-core\.mjs · font ([a-f0-9]{64}) · punter ([a-f0-9]{64}|cap) · empremta ([a-f0-9]{64}) · [^\n]*-->\n$/;
const ACTA = /^\d{6}_\d{4}_acta_marmota_[a-z0-9_]+\.md$/;
// Control (llevat de salt de línia i tabulador) i marques bidi: no poden entrar al punter.
const PROHIBITS_PUNTER = /[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
const MAX_PUNTER = 6000;
const sha = (text) => createHash('sha256').update(text).digest('hex');

function llig(cami) {
  try {
    const estat = fs.lstatSync(cami);
    if (!estat.isFile() || estat.isSymbolicLink()) throw new Error(`no és un fitxer regular: ${cami}`);
    return fs.readFileSync(cami, 'utf8');
  } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

/** El punter no pot trencar el bloc: ni marcadors, ni comentaris, ni més de MAX_PUNTER bytes. */
export function validaPunter(text) {
  if (text === null) return null;
  const net = text.replace(/\r\n/g, '\n').trim();
  if (!net) return null;
  if (Buffer.byteLength(net) > MAX_PUNTER) throw new Error(`el punter episòdic passa de ${MAX_PUNTER} B`);
  if (net.includes('<!--') || net.includes('-->')) throw new Error('el punter episòdic no pot portar comentaris HTML');
  if (PROHIBITS_PUNTER.test(net)) throw new Error('el punter episòdic no pot portar caràcters de control ni marques bidi');
  if (net.split('\n').some((l) => /^\s*(#|---|===)/.test(l))) throw new Error('el punter episòdic no pot portar capçaleres ni separadors');
  return net;
}

/** Generació determinista: font amb el bloc del punter substituït i un peu amb les empremtes. */
export function genera(font, punter) {
  if (font.split(INICI).length !== 2 || font.split(FI).length !== 2 || font.indexOf(INICI) > font.indexOf(FI)) throw new Error('la font no porta un sol bloc punter-episodic');
  const cru = punter === null ? font : `${font.slice(0, font.indexOf(INICI) + INICI.length)}\n${punter}\n${font.slice(font.indexOf(FI))}`;
  const cos = cru.replace(/\n*$/, '\n');
  const empremta = sha(cos);
  return `${cos}\n<!-- generat: tooling/brain/sincronitza-iaia-core.mjs · font ${sha(font)} · punter ${punter === null ? 'cap' : sha(punter)} · empremta ${empremta} · no l'editis: edita la font del repositori o el punter del perfil -->\n`;
}

/** Estat del destí respecte de la generació esperada. */
export function estatDesti(desti, esperat) {
  if (desti === null) return 'absent';
  if (desti === esperat) return 'al-dia';
  const peu = PEU.exec(desti);
  // Una còpia generada que algú ha editat a mà ja no casa amb la seua empremta: és aliena i es guarda abans.
  return peu && sha(desti.slice(0, peu.index)) === peu[3] ? 'generat-antic' : 'alie';
}

/** El punter mínim: l'última Acta Marmota del repositori. Cap dada personal. */
export function punterMinim(arrel) {
  const dir = path.join(arrel, CAMINS.actes);
  const actes = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => ACTA.test(n)).sort() : [];
  return actes.length ? `Última Acta Marmota: \`${CAMINS.actes}/${actes.at(-1)}\`. Llig-la i el bloc ESTAT_ACTUAL de \`.agents/ESTAT.md\` abans de proposar res.` : null;
}

/** Una secció «## N…» fins a la següent capçalera de nivell 2. */
export function seccio(text, prefix) {
  const linies = text.split('\n');
  const i = linies.findIndex((l) => l.startsWith(prefix));
  if (i < 0) return null;
  let j = i + 1;
  while (j < linies.length && !linies[j].startsWith('## ')) j++;
  return linies.slice(i, j).join('\n').trim();
}

function escriuAtomic(cami, text, mode) {
  const temp = path.join(path.dirname(cami), `.${path.basename(cami)}.${randomUUID()}.tmp`);
  try {
    const fd = fs.openSync(temp, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, mode);
    try { fs.writeFileSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(temp, cami);
  } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
const escriuNou = (cami, text) => { const fd = fs.openSync(cami, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600); try { fs.writeFileSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); } };

function assegPerfil(perfil) {
  fs.mkdirSync(perfil, { recursive: true, mode: 0o700 });
  const estat = fs.lstatSync(perfil);
  if (!estat.isDirectory() || estat.isSymbolicLink()) throw new Error(`el perfil no és una carpeta real: ${perfil}`);
  fs.chmodSync(perfil, 0o700);
}

export function planifica({ arrel, desti = DESTI_PER_DEFECTE, perfil = PERFIL_PER_DEFECTE }) {
  const font = llig(path.join(arrel, FONT));
  if (font === null) throw new Error(`no hi ha la font ${FONT}`);
  const punter = validaPunter(llig(path.join(perfil, 'punter_episodic.md')));
  const esperat = genera(font, punter);
  const actual = llig(desti);
  return { desti, perfil, font: sha(font), punter: punter === null ? null : sha(punter), esperat, actual,
    hashActual: actual === null ? 'absent' : sha(actual), estat: estatDesti(actual, esperat), bytes: Buffer.byteLength(esperat) };
}

export function escriu({ arrel, desti = DESTI_PER_DEFECTE, perfil = PERFIL_PER_DEFECTE, expectedHash, sembra = false }) {
  let pla = planifica({ arrel, desti, perfil });
  if (pla.hashActual !== expectedHash) throw new Error(`CAS divergent: el destí és ${pla.hashActual}, no ${expectedHash}`);
  const accions = [];
  if (pla.estat === 'alie' || sembra) assegPerfil(perfil);
  if (pla.estat === 'alie') {
    const copia = path.join(perfil, `iaia-maria-core.monolit-${pla.hashActual.slice(0, 12)}.md`);
    if (!fs.existsSync(copia)) { escriuNou(copia, pla.actual); accions.push(`core vella guardada a ${copia} (0600)`); }
    else if (sha(fs.readFileSync(copia, 'utf8')) !== pla.hashActual) throw new Error(`${copia} ja existix amb uns altres bytes`);
  }
  if (sembra) {
    const ptr = path.join(perfil, 'punter_episodic.md');
    const minim = punterMinim(arrel);
    if (!fs.existsSync(ptr) && minim) {
      escriuNou(ptr, `${validaPunter(minim)}\n`); accions.push(`punter mínim sembrat (${Buffer.byteLength(minim)} B, sense dades personals)`);
    }
    const perfilMestre = path.join(perfil, 'perfil_mestre.md');
    if (!fs.existsSync(perfilMestre) && pla.actual !== null && pla.estat === 'alie') {
      const seccions = [['§0.0', seccio(pla.actual, '## 0.0')], ['§36', seccio(pla.actual, '## 36.')], ['§40', seccio(pla.actual, '## 40.')]].filter(([, t]) => t);
      if (seccions.length) {
        escriuNou(perfilMestre, `# Perfil privat del Mestre (0600; cap skill no el carrega)\n\nSembrat des de la core vella per títols: ${seccions.map(([n]) => n).join(', ')}. El Mestre el revisa.\n\n${seccions.map(([, t]) => t).join('\n\n')}\n`);
        accions.push(`perfil privat sembrat per títols (${seccions.map(([n]) => n).join(', ')}): el Mestre l'ha de revisar`);
      }
    }
    pla = { ...planifica({ arrel, desti, perfil }), hashActual: pla.hashActual, estat: pla.estat };
  }
  if (llig(desti) !== pla.actual) throw new Error('el destí ha canviat durant la sincronització');
  if (pla.estat !== 'al-dia' || pla.actual !== pla.esperat) {
    fs.mkdirSync(path.dirname(desti), { recursive: true });
    escriuAtomic(desti, pla.esperat, 0o600);
    accions.push(`còpia generada escrita a ${desti} (${pla.bytes} B)`);
  }
  return { ...pla, accions, estatFinal: estatDesti(llig(desti), pla.esperat) };
}

function main(argv) {
  const opcio = (nom) => argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  const conegudes = /^--(arrel|desti|perfil|expected-hash)=.+|^--(sec|verifica|escriu|sembra|json)$/;
  const estranyes = argv.filter((a) => !conegudes.test(a));
  if (estranyes.length || (argv.includes('--escriu') && !opcio('expected-hash'))) {
    process.stderr.write('Ús: sincronitza-iaia-core.mjs [--sec | --verifica | --escriu --expected-hash=SHA256|absent [--sembra]] [--arrel=DIR] [--desti=FITXER] [--perfil=DIR] [--json]\n');
    return 2;
  }
  const arrel = opcio('arrel') || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const base = { arrel, desti: opcio('desti') || DESTI_PER_DEFECTE, perfil: opcio('perfil') || PERFIL_PER_DEFECTE };
  const r = argv.includes('--escriu') ? escriu({ ...base, expectedHash: opcio('expected-hash'), sembra: argv.includes('--sembra') }) : planifica(base);
  const { esperat, actual, ...visible } = r;
  void esperat; void actual;
  if (argv.includes('--json')) process.stdout.write(`${JSON.stringify(visible, null, 2)}\n`);
  else {
    process.stdout.write(`Font ${FONT} · ${visible.font.slice(0, 12)} · punter ${visible.punter ? visible.punter.slice(0, 12) : 'cap'}\n`);
    process.stdout.write(`Destí ${visible.desti}: ${visible.estat} (${visible.hashActual === 'absent' ? 'absent' : visible.hashActual.slice(0, 12)}); la generació fa ${visible.bytes} B\n`);
    for (const a of visible.accions ?? []) process.stdout.write(`  · ${a}\n`);
    if (!argv.includes('--escriu') && visible.estat !== 'al-dia') process.stdout.write(`  Per a escriure-la: --escriu --expected-hash=${visible.hashActual}${visible.estat === 'alie' ? ' --sembra' : ''}\n`);
  }
  if (argv.includes('--verifica')) return visible.estat === 'al-dia' ? 0 : 1;
  return 0;
}

const principal = (() => { try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; } })();
if (principal) { try { process.exitCode = main(process.argv.slice(2)); } catch (e) { process.stderr.write(`sincronitza-iaia-core: ${e.message}\n`); process.exitCode = 1; } }
