#!/usr/bin/env node
/**
 * tractor-doctrina.mjs — la doctrina no pot citar fitxers que no existixen.
 *
 * Recorre els documents normatius (`.agents/**\/*.md` per defecte), n'extrau
 * cada referència a un camí i comprova que existix al disc. Quan no existix,
 * busca un fitxer amb el mateix nom base al repositori i proposa la correcció.
 *
 * Motiu: `AGENTS.md` exigix llegir `src/universal/UniversalComponents.jsx`, que
 * no existix (el real és `src/components/universal/...`), i acaba dient «Si
 * falta algun fitxer de l'índex, demanar-lo. Mai inventar». Llegit al peu de la
 * lletra, cada sessió hauria de bloquejar-se. Cap ho fa. Aquesta porta força
 * que la doctrina siga verificable en compte de aspiracional.
 *
 * Classificació:
 *   TROBAT   el camí existix (fitxer o directori)
 *   ABSENT   el camí no existix dins del repositori          → error
 *   EXTERN   el camí ix del repositori (`../…`), està a la
 *            llista d'ignorats o és local (Git l'ignora)      → informatiu
 *
 * Local (B1 · 261101): un camí absent que Git ignora (`git check-ignore`) mai
 * viatja amb un commit, així que tampoc existix a l'arbre preparat del hook.
 * Només es pregunta per als absents i només valen els `.gitignore` versionats
 * d'una arrel que siga el nivell superior del seu repositori (ni exclusions
 * personals, ni `.git/info/exclude`, ni un repositori pare). Sense Git, amb
 * error o amb qualsevol altra font, continua ABSENT.
 *
 * Pedra Seca: zero dependències, ESM, fail-closed.
 *
 *   node tooling/gates/tractor-doctrina.mjs
 *   node tooling/gates/tractor-doctrina.mjs --json
 *   node tooling/gates/tractor-doctrina.mjs --abast=.agents,tooling/wiki
 *   node tooling/gates/tractor-doctrina.mjs --extern-fatal
 *   node tooling/gates/tractor-doctrina.mjs --exclou=.agents/cervells
 *   node tooling/gates/tractor-doctrina.mjs --tots      # inclou blocs de codi
 *
 * Llista d'exempcions: `.agents/doctrina-ignora.txt`, un prefix per línia,
 * `#` per a comentaris. Serveix per a rutes que viuen fora del repo auditat i
 * per a locals generats que Git no pot classificar en un arbre net (`.husky/_`).
 */

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import {isExecutionEvidence} from '../lib/corpus-scope.mjs';
import { operationalDocumentText } from '../lib/document-corpus.mjs';
import { arrelSegura as arrelDelProjecte } from '../lib/arrel.mjs';
import path from 'node:path';

/* ─────────────────────────────── Arrel i arguments ─────────────────────────────── */


const arg = (nom) => {
  const trobat = process.argv.find((a) => a.startsWith(`--${nom}=`));
  return trobat ? trobat.slice(nom.length + 3) : null;
};

const ARREL = arrelDelProjecte();
const JSON_OUT = process.argv.includes('--json');
const EXTERN_FATAL = process.argv.includes('--extern-fatal');
const INCLOU_CODI = process.argv.includes('--tots');
const ABAST = (arg('abast') || '.agents').split(',').map((s) => s.trim()).filter(Boolean);
const EXCLOU = (arg('exclou') || '').split(',').map((s) => s.trim()).filter(Boolean);

if (!ARREL) {
  console.error("❌ [DOCTRINA] No trobe l'arrel del projecte (cal AGENTS.md o .agents/AGENTS.md). Usa --arrel=/ruta.");
  process.exit(1);
}

const R = (p) => path.join(ARREL, p);
const rel = (p) => path.relative(ARREL, p) || p;

/* ─────────────────────────────── Exempcions ─────────────────────────────── */

/* Auditoria 260830: aquesta ruta apuntava només a `.agents/`, on el fitxer
   mai va estar. `ignorats` quedava buit i `esIgnorat()` retornava sempre
   false, així que l'exempció de `_wiki_de_poble` (repositori separat) no
   s'aplicava mai. Ara es busca als dos llocs i es diu quin s'ha usat. */
const CANDIDATS_IGNORA = [R('.agents/doctrina-ignora.txt'), R('tooling/gates/doctrina-ignora.txt')];
const FITXER_IGNORA = CANDIDATS_IGNORA.find((c) => fs.existsSync(c)) ?? CANDIDATS_IGNORA[0];
const ignorats = fs.existsSync(FITXER_IGNORA)
  ? fs.readFileSync(FITXER_IGNORA, 'utf8').split(/\r?\n/)
      .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean)
  : [];

const esIgnorat = (p) => ignorats.some((pref) => p === pref || p.startsWith(pref.endsWith('/') ? pref : `${pref}/`));

/* ─────────────────────────────── Índex del repositori ─────────────────────────────── */

const EXCLOU_DIR = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'vendor', 'coverage', '.sdp-paperera', '.sdp-reflex']);

const perNomBase = new Map(); // nom base → [camins relatius]

/* Directoris de primer nivell del repositori: serveixen d'àncora per a
   distingir un camí de projecte d'un fragment de prosa amb barres. */
const ANCORES = new Set(
  fs.readdirSync(ARREL, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !EXCLOU_DIR.has(e.name))
    .map((e) => e.name)
);

function indexa(dir) {
  let entrades;
  try { entrades = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entrades) {
    if (EXCLOU_DIR.has(e.name)) continue;
    const complet = path.join(dir, e.name);
    if (isExecutionEvidence(rel(complet))) continue;
    if (e.isDirectory()) { indexa(complet); continue; }
    const clau = e.name;
    if (!perNomBase.has(clau)) perNomBase.set(clau, []);
    perNomBase.get(clau).push(rel(complet));
  }
}
indexa(ARREL);

/* ─────────────────────────────── Documents a auditar ─────────────────────────────── */

function recullMd(dir, acc = []) {
  let entrades;
  try { entrades = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrades) {
    if (EXCLOU_DIR.has(e.name)) continue;
    const complet = path.join(dir, e.name);
    if (isExecutionEvidence(rel(complet))) continue;
    if (e.isDirectory()) recullMd(complet, acc);
    else if (e.name.endsWith('.md')) acc.push(complet);
  }
  return acc;
}

const documents = [];
for (const a of ABAST) {
  const abs = R(a);
  if (!fs.existsSync(abs)) {
    console.error(`❌ [DOCTRINA] L'abast '${a}' no existix. No audite un abast fantasma.`);
    process.exit(1);
  }
  if (fs.statSync(abs).isDirectory()) documents.push(...recullMd(abs));
  else if (abs.endsWith('.md')) documents.push(abs);
}

const documentsFiltrats = documents.filter((d) => !isExecutionEvidence(rel(d)) && !EXCLOU.some((x) => rel(d).startsWith(x)));
documents.length = 0;
documents.push(...documentsFiltrats);

if (documents.length === 0) {
  console.error(`❌ [DOCTRINA] Cap document .md dins de l'abast (${ABAST.join(', ')}).`);
  process.exit(1);
}

/* ─────────────────────────────── Extracció de candidats ─────────────────────────────── */

const EXTENSIONS = new Set([
  'md', 'mjs', 'cjs', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'scss', 'html', 'php',
  'py', 'sh', 'yaml', 'yml', 'toml', 'sql', 'txt', 'svg', 'canvas', 'lock', 'env',
]);

const COMANDAMENTS = new Set([
  'npm', 'npx', 'node', 'git', 'python', 'python3', 'sh', 'bash', 'zsh', 'ls', 'cd',
  'rm', 'cp', 'mv', 'cat', 'echo', 'run', 'sudo', 'chmod', 'mkdir', 'touch', 'grep',
]);

/** Decidix si un token té forma de camí de fitxer i no de comandament o concepte. */
function esCandidat(brut) {
  const t = brut.trim().replace(/[.,;:]+$/, '')
    .replace(/:[0-9]+(?:[-–][0-9]+)?(?:,[0-9]+(?:[-–][0-9]+)?)*(?::[0-9]+)?$/, '');
  if (!t || t.length > 240) return null;
  // Metavariables documentades de la CLI i patró de taxonomia, mai camins reals.
  if (t.split('/').some(segment => /(?:^|_)aammdd(?:_hhmm)?(?:[_.]|$)/i.test(segment)) || /^(?:PLA|REBUT)\.json$/.test(t)) return null;
  // Una extensió nua no promet un fitxer; .env sí que és un nom concret.
  if (/^\.[a-z0-9]+$/i.test(t) && EXTENSIONS.has(t.slice(1).toLowerCase()) && t.toLowerCase() !== '.env') return null;
  if (/^(https?:|mailto:|#|<|\{)/.test(t)) return null;
  if (/[*?<>|"']/.test(t)) return null;              // globs i cometes: no és un camí concret
  if (/\s/.test(t)) return null;                      // cap camí amb espais a la doctrina
  if (/\(\)$/.test(t)) return null;                   // sdp_prefix(), resolveInside()
  if (/^[A-Z_]+$/.test(t)) return null;               // constants
  if (COMANDAMENTS.has(t)) return null;
  if (t.endsWith(':')) return null;

  const ext = /\.([a-z0-9]+)$/i.exec(t)?.[1]?.toLowerCase();
  const teExtensio = ext && EXTENSIONS.has(ext);
  const teBarra = t.includes('/');

  // Un token sense barra i sense extensió és un concepte (`gate`, `porta`, `seal`).
  if (!teBarra && !teExtensio) return null;

  /* Ancoratge: un token amb barres però sense extensió coneguda només és un
     camí si arranca en un directori real del repositori o en `./`, `../`, `~/`.
     Sense això, qualsevol fragment de prosa amb una barra passa per camí. */
  if (teBarra && !teExtensio) {
    const primer = t.split('/')[0];
    if (!ANCORES.has(primer) && !['.', '..', '~'].includes(primer) && primer !== '') return null;
  }

  return t.replace(/\/+$/, '') || null;
}

/** Extrau candidats d'una línia, amb prioritat als espais de codi i als enllaços. */
function candidatsDeLinia(linia, dinsCodi) {
  const out = new Set();

  // 1 · espais de codi inline: `això`
  for (const m of linia.matchAll(/`([^`\n]+)`/g)) {
    for (const tros of m[1].split(/\s+/)) {
      const c = esCandidat(tros);
      if (c) out.add(c);
    }
  }

  // 2 · enllaços markdown relatius: [text](camí)
  for (const m of linia.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (/^doc-[0-9a-f-]+/i.test(m[1])) continue;      // enllaç per id de document, no per camí
    const c = esCandidat(m[1].split('#')[0]);
    if (c) out.add(c);
  }

  // 3 · dins de blocs de codi o prosa nua: només tokens amb extensió coneguda
  if (dinsCodi ? INCLOU_CODI : true) {
    const netejada = linia.replace(/`[^`\n]*`/g, ' ').replace(/\[\[[^\]]*\]\]/g, ' ');
    for (const m of netejada.matchAll(/[A-Za-z0-9_./~-]+\.[a-z0-9]{1,6}\b/g)) {
      const c = esCandidat(m[0]);
      if (c && (c.includes('/') || /\.(mjs|cjs|jsx?|tsx?|md|json|php|py|css|html|sh)$/i.test(c))) out.add(c);
    }
  }

  return [...out];
}

/* ─────────────────────────────── Resolució ─────────────────────────────── */

const existeix = (abs) => { try { fs.statSync(abs); return true; } catch { return false; } };

/* Entorn sense GIT_*: dins d'un hook, GIT_DIR o GIT_INDEX_FILE apuntarien a un altre
   repositori i classificarien camins d'ARREL amb regles alienes (com git-staged.mjs). */
const ENTORN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

const git = (args, input) => spawnSync('git', args, { cwd: ARREL, env: ENTORN_GIT, encoding: 'utf8', timeout: 10_000, input });

/* Només compten les regles versionades d'ARREL: el veredicte no pot dependre de la màquina.
   · ARREL ha de ser el nivell superior del seu repositori (dins d'un repositori pare, les regles són alienes);
   · `core.excludesFile=/dev/null` lleva les exclusions personals (~/.config/git/ignore, core.excludesFile);
   · `.git/info/exclude` no es pot desactivar: es descarta per la font que dona `check-ignore -v`,
     igual que un `.gitignore` no versionat (cap dels dos viatja amb el commit). */
let arrelGitPropia = null;
const esArrelGit = () => {
  if (arrelGitPropia === null) {
    const r = git(['rev-parse', '--show-toplevel']);
    try { arrelGitPropia = r.status === 0 && fs.realpathSync(r.stdout.replace(/\n$/, '')) === fs.realpathSync(ARREL); }
    catch { arrelGitPropia = false; }
  }
  return arrelGitPropia;
};

// --literal-pathspecs: cap glob del camí s'expandix. Torna null si Git falla.
const esVersionat = (cami) => {
  const r = git(['--literal-pathspecs', 'ls-files', '-z', '--', cami]);
  return r.status === 0 ? r.stdout !== '' : null;
};

/* Font acceptada: un `.gitignore` versionat d'ARREL. `.git/info/exclude` mai és versionable i un camí
   de fora del repositori fa fallar ls-files (null): tots dos queden fora sense més guardes. */
const fontsAcceptades = new Map();
const esFontVersionada = (font) => {
  if (!fontsAcceptades.has(font)) {
    const gitignore = font === '.gitignore' || font.endsWith('/.gitignore');
    fontsAcceptades.set(font, gitignore && esVersionat(font) === true);
  }
  return fontsAcceptades.get(font);
};

/** Git l'ignora (com a fitxer o com a directori) per una regla versionada i no el versiona: no viatja amb el commit. */
const esLocal = (cami) => {
  let net = cami;
  while (net.endsWith('/')) net = net.slice(0, -1);
  if (!net || net.includes('\0') || !esArrelGit()) return false;
  // Versionat (fitxer o directori amb fitxers) i absent és un esborrat, no un local.
  if (esVersionat(net) !== false) return false;
  // Una sola crida per a les dues formes (fitxer i directori, per a regles «carpeta/»); -n dona un registre
  // per camí: font, línia, patró i camí. Exit 1 = cap regla; 128 = error (fail-closed).
  const r = git(['-c', 'core.excludesFile=/dev/null', 'check-ignore', '--stdin', '-z', '-v', '-n'], `${net}\0${net}/\0`);
  if (r.status !== 0) return false;
  const camps = r.stdout.split('\0');
  for (let i = 0; i + 3 < camps.length; i += 4) {
    const [font, , patro] = camps.slice(i, i + 3);
    // Amb -v, una negació («!x») també casa, però vol dir que NO s'ignora.
    if (patro && !patro.startsWith('!') && esFontVersionada(font)) return true;
  }
  return false;
};

function resol(cami, dirDoc) {
  if (cami.startsWith('../') || cami.startsWith('~/') || path.isAbsolute(cami)) return { estat: 'EXTERN' };
  if (esIgnorat(cami)) return { estat: 'EXTERN', motiu: 'exempció declarada' };

  if (existeix(R(cami))) return { estat: 'TROBAT', on: cami };
  const candidates = [...perNomBase.values()].flat().filter(p => p === cami || p.endsWith('/' + cami));
  if (candidates.length === 1) return { estat: 'TROBAT', on: candidates[0] };
  const desDelDoc = path.resolve(dirDoc, cami);
  if (existeix(desDelDoc) && desDelDoc.startsWith(ARREL)) return { estat: 'TROBAT', on: rel(desDelDoc) };

  /* Suggeriment: entre els fitxers amb el mateix nom base, prioritzem els que
     comparteixen més segments finals amb el camí citat. Sense això, un nom
     genèric com `SKILL.md` proposa qualsevol cosa. */
  const base = path.basename(cami);
  const segCitats = cami.split('/').filter(Boolean).reverse();
  const suggerits = (perNomBase.get(base) || [])
    .map((cand) => {
      const seg = cand.split('/').filter(Boolean).reverse();
      let comuns = 0;
      while (comuns < seg.length && comuns < segCitats.length && seg[comuns] === segCitats[comuns]) comuns += 1;
      return { cand, comuns };
    })
    .sort((a, b) => b.comuns - a.comuns || a.cand.length - b.cand.length)
    .filter((x, i) => x.comuns > 1 || i === 0)
    .slice(0, 3)
    .map((x) => x.cand);
  /* Local: Git l'ignora, així que mai viatja amb un commit ni existix a l'arbre preparat del hook. */
  if (esLocal(cami)) return { estat: 'EXTERN', motiu: 'local: ignorat per Git' };
  return { estat: 'ABSENT', suggerits };
}

/* ─────────────────────────────── Recorregut ─────────────────────────────── */

const absents = [];
const externs = [];
let totalReferencies = 0;
const vistos = new Set();

for (const doc of documents) {
  const linies = operationalDocumentText(fs.readFileSync(doc, 'utf8'), rel(doc)).split(/\r?\n/);
  const dirDoc = path.dirname(doc);
  let dinsCodi = false;

  for (const [i, linia] of linies.entries()) {
    if (/^\s*(```|~~~)/.test(linia)) { dinsCodi = !dinsCodi; continue; }

    for (const cami of candidatsDeLinia(linia, dinsCodi)) {
      totalReferencies += 1;
      const clau = `${rel(doc)}|${cami}`;
      if (vistos.has(clau)) continue;
      vistos.add(clau);

      const r = resol(cami, dirDoc);
      if (r.estat === 'ABSENT') absents.push({ doc: rel(doc), linia: i + 1, cami, suggerits: r.suggerits });
      else if (r.estat === 'EXTERN') externs.push({ doc: rel(doc), linia: i + 1, cami, motiu: r.motiu || 'fora del repositori' });
    }
  }
}

/* ─────────────────────────────── Eixida ─────────────────────────────── */

const resum = {
  documents: documents.length,
  referencies: totalReferencies,
  uniques: vistos.size,
  absents: absents.length,
  externs: externs.length,
};

if (JSON_OUT) {
  console.log(JSON.stringify({ resum, absents, externs }, null, 2));
  process.exit(absents.length > 0 || (EXTERN_FATAL && externs.length > 0) ? 1 : 0);
}

console.log(`\n📜 [DOCTRINA] ${resum.documents} documents · ${resum.uniques} referències úniques a camins\n`);

if (absents.length) {
  const perDoc = new Map();
  for (const a of absents) {
    if (!perDoc.has(a.doc)) perDoc.set(a.doc, []);
    perDoc.get(a.doc).push(a);
  }
  for (const [doc, llista] of [...perDoc].sort()) {
    console.log(`  ── ${doc} (${llista.length}) ─────────────────`);
    for (const a of llista) {
      console.log(`   · línia ${a.linia}: ${a.cami}`);
      if (a.suggerits.length) console.log(`       ↳ potser volies: ${a.suggerits.join(' | ')}`);
    }
    console.log('');
  }
}

if (externs.length && (EXTERN_FATAL || process.argv.includes('--verbos'))) {
  console.log(`  ── externs (${externs.length}) ─────────────────`);
  for (const e of externs) console.log(`   · ${e.doc}:${e.linia} ${e.cami} (${e.motiu})`);
  console.log('');
} else if (externs.length) {
  console.log(`  ℹ️  ${externs.length} referències externes al repositori (--verbos per a veure-les)\n`);
}

if (absents.length > 0 || (EXTERN_FATAL && externs.length > 0)) {
  console.error(`❌ [DOCTRINA] ${absents.length} camins citats que no existixen. La doctrina promet fitxers que no pot entregar.\n`);
  process.exit(1);
}

console.log('✅ [DOCTRINA] Tots els camins citats a la normativa existixen al disc.\n');
process.exit(0);
