#!/usr/bin/env node
/**
 * tractor-cognitiu.mjs — Porta de la Consciència Contextual
 *
 * Mecanitza les troballes de l'Auditoria Cognitiva del Consell (Seient Núm. 5).
 * No opina, no reescriu, no toca res: compta i falla tancat.
 *
 * Cada porta correspon a una troballa numerada de l'informe
 * 260825_0115_INFORME_Auditoria_Cognitiva_de_Skills_Sinapsis_i_Ceguesa_Contextual.md
 *
 *   P1  B-1  Frontmatter fantasma dins del cos de les skills
 *   P2  D-1  Noms de skill duplicats i col·lisions de node
 *   P3  C-4  Guardes de seguretat importades i mai cridades
 *   P4  C-3  Escriptura directa saltant-se la Canonada
 *   P5  R-1  Skills inabastables per l'índex RAG
 *   P6  C-2  Política d'idioma de les skills
 *   P7  C-1  Doble font canònica per a la llista del Consell
 *   P8  B-6  Esquema del frontmatter: triggers destruïts per la fusió
 *   P9  D-2  Fitxers acompanyants dins d'una skill sense cap consumidor
 *
 * ÚS:
 *   node tractor-cognitiu.mjs                 # informe humà, exit 1 si hi ha bloquejants
 *   node tractor-cognitiu.mjs --json          # informe JSON per a la Consola
 *   node tractor-cognitiu.mjs --arrel=/ruta   # arrel explícita
 *   node tractor-cognitiu.mjs --avisos        # els AVISOS també fan fallar la porta
 *
 * Zero dependències externes (Pedra Seca). Node >= 20.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ───────────────────────────── CLI ───────────────────────────── */

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const AVISOS_BLOQUEGEN = args.includes('--avisos');
const ARREL_ARG = (args.find((a) => a.startsWith('--arrel=')) || '').split('=')[1] || null;

/* ─────────────────── Descobriment d'arrel (mai cwd) ─────────────────── */

const MARCADORS = ['AGENTS.md', 'package.json'];
const DIRECTORIS = ['.agents/skills', 'tooling'];

function descobreixArrel(inici) {
  let cursor = path.resolve(inici);
  while (true) {
    const teFitxers = MARCADORS.every((f) => fs.existsSync(path.join(cursor, f)));
    const teDirs = DIRECTORIS.some((d) => fs.existsSync(path.join(cursor, d)));
    if (teFitxers && teDirs) return cursor;
    const pare = path.dirname(cursor);
    if (pare === cursor) return null;
    cursor = pare;
  }
}

const ARREL = ARREL_ARG
  ? path.resolve(ARREL_ARG)
  : descobreixArrel(path.dirname(fileURLToPath(import.meta.url)));

if (!ARREL) {
  console.error("❌ [TRACTOR COGNITIU] No s'ha trobat l'arrel del projecte (cal AGENTS.md + package.json).");
  console.error('   Usa --arrel=/ruta/al/projecte.');
  process.exit(2);
}

/* ─────────────────────────── Utilitats ─────────────────────────── */

const rel = (p) => path.relative(ARREL, p).split(path.sep).join('/');

function camina(dir, filtre, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const complet = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) camina(complet, filtre, acc);
    else if (filtre.test(e.name)) acc.push(complet);
  }
  return acc;
}

/** Separa el frontmatter real (el primer i únic) del cos. */
function separaFrontmatter(raw) {
  if (!/^\uFEFF?---[ \t]*\r?\n/.test(raw)) return { fm: '', cos: raw };
  const resta = raw.replace(/^\uFEFF?---[ \t]*\r?\n/, '');
  const tanca = resta.search(/^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m);
  if (tanca < 0) return { fm: '', cos: raw };
  const finalMarca = resta.slice(tanca).match(/^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m)[0];
  return { fm: resta.slice(0, tanca), cos: resta.slice(tanca + finalMarca.length) };
}

/** Emmascara els blocs de codi tancats amb ``` o ~~~ perquè no contaminen els recomptes. */
function llevaCodi(cos) {
  return cos.replace(/^[ \t]{0,3}(`{3,}|~{3,})[\s\S]*?^[ \t]{0,3}\1[ \t]*$/gm, '');
}

const camp = (fm, nom) => {
  const m = fm.match(new RegExp(`^${nom}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
};

/* ────────────────────────── Recollida ────────────────────────── */

const troballes = [];
const registra = (porta, grau, fitxer, missatge, detall = null) =>
  troballes.push({ porta, grau, fitxer, missatge, detall });

const DIR_SKILLS = path.join(ARREL, '.agents', 'skills');
const skills = camina(DIR_SKILLS, /^SKILL\.md$/).map((p) => {
  const raw = fs.readFileSync(p, 'utf8');
  const { fm, cos } = separaFrontmatter(raw);
  return { ruta: p, carpeta: path.basename(path.dirname(p)), raw, fm, cos };
});

if (skills.length === 0) {
  console.error(`❌ [TRACTOR COGNITIU] Zero SKILL.md sota ${rel(DIR_SKILLS)}. Arrel equivocada o cànon buit.`);
  process.exit(2);
}

/* ══════════ P1 · B-1 — Frontmatter fantasma dins del cos ══════════ */

let fantasmes = 0;
for (const s of skills) {
  const cos = llevaCodi(s.cos);
  const delimitadors = (cos.match(/^---[ \t]*$/gm) || []).length;
  const antics = (cos.match(/^##\s+Antic:\s*(.+)$/gm) || []).map((l) => l.replace(/^##\s+Antic:\s*/, '').trim());
  const nomsIncrustats = (cos.match(/^name:\s*(.+)$/gm) || []).map((l) => l.replace(/^name:\s*/, '').trim());
  const canonicsIncrustats = (cos.match(/^status:\s*canonic\s*$/gm) || []).length;

  if (delimitadors > 0) {
    fantasmes += nomsIncrustats.length;
    registra(
      'P1', 'BLOQUEJANT', rel(s.ruta),
      `${delimitadors} delimitadors '---' i ${nomsIncrustats.length} camps 'name:' dins del cos: entren sencers al GENOMA com a noms canònics sense fitxer.`,
      { antics, nomsIncrustats, canonicsIncrustats },
    );
  }
  if (canonicsIncrustats > 0) {
    registra('P1', 'BLOQUEJANT', rel(s.ruta),
      `${canonicsIncrustats} declaracions 'status: canonic' extra al cos. Només en pot haver una, i va al frontmatter.`);
  }
  if (antics.length > 0 && !/^supersedes:/m.test(s.fm)) {
    registra('P1', 'AVÍS', rel(s.ruta),
      `Absorbix ${antics.length} skills antigues sense declarar 'supersedes:' al frontmatter.`, { antics });
  }
}

/* ══════════ P2 · D-1 — Duplicats i col·lisions de node ══════════ */

const perNom = new Map();
for (const s of skills) {
  const nom = camp(s.fm, 'name') || s.carpeta;
  if (!perNom.has(nom)) perNom.set(nom, []);
  perNom.get(nom).push(rel(s.ruta));
}
for (const [nom, rutes] of perNom) {
  if (rutes.length > 1) {
    registra('P2', 'BLOQUEJANT', rutes.join(' | '),
      `El nom de skill '${nom}' apareix ${rutes.length} vegades. Dos fonts per a la mateixa autoritat.`);
  }
}

const nodes = new Map();
for (const f of camina(DIR_SKILLS, /\.md$/)) {
  const base = path.basename(f, '.md');
  if (!nodes.has(base)) nodes.set(base, []);
  nodes.get(base).push(rel(f));
}
for (const [base, rutes] of nodes) {
  if (base !== 'SKILL' && rutes.length > 1) {
    registra('P2', 'AVÍS', rutes.join(' | '),
      `${rutes.length} fitxers es diuen '${base}.md': col·lisió garantida a l'índex de wikilinks.`);
  }
}

/* ══════════ P3 · C-4 — Guardes importades i mai cridades ══════════ */

const GUARDES = ['openReflex', 'sealReflex', 'claimReceiptForMutation', 'completeMutationClaim'];
const fontsJs = [
  ...camina(path.join(ARREL, 'tooling'), /\.(mjs|js|cjs)$/),
  ...camina(path.join(ARREL, 'scripts'), /\.(mjs|js|cjs)$/)
];

for (const f of fontsJs) {
  const src = fs.readFileSync(f, 'utf8');
  const senseComentaris = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  const soques = (senseComentaris.match(/['"`]by\x70ass['"`]/g) || []).length;
  const escriu = /\bfs\.(promises\.)?writeFi\x6ce(Sync)?\s*\(/.test(senseComentaris)
    || /\bwriteFi\x6ce(Sync)?\s*\(/.test(senseComentaris);
  if (soques > 0 && escriu) {
    registra('P3', 'BLOQUEJANT', rel(f),
      `${soques} soques 'bypass' codificades a mà en un fitxer que escriu al disc. El fre està capat.`);
  }

  const importades = GUARDES.filter((g) =>
    new RegExp(`import\\s*\\{[^}]*\\b${g}\\b[^}]*\\}`, 's').test(senseComentaris));
  if (importades.length === 0) continue;

  const mortes = importades.filter((g) => {
    const crides = (senseComentaris.match(new RegExp(`\\b${g}\\s*\\(`, 'g')) || []).length;
    return crides === 0;
  });
  if (mortes.length > 0) {
    registra('P3', 'BLOQUEJANT', rel(f),
      `Importa ${mortes.length} guarda(es) del Reflex i no en crida cap: ${mortes.join(', ')}.`,
      { mortes, importades });
  }
}

/* ══════════ P4 · C-3 — Escriptura directa saltant-se la Canonada ══════════ */

const GENERADORS = /(bundle|petorreta|acta|genoma|prompt|informe|compile)/i;
for (const f of fontsJs) {
  if (!GENERADORS.test(path.basename(f))) continue;
  const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const directe = /\bfs\.writeFileSync\s*\(/.test(src) || /\bfs\.promises\.writeFile\s*\(/.test(src);
  const usaCanonada = /canonada/i.test(src) || /\bescriu\s*\(/.test(src);
  if (directe && !usaCanonada) {
    registra('P4', 'BLOQUEJANT', rel(f),
      "Generador que escriu amb fs directe sense passar per canonada.mjs (socdepoble-workflow §3, LA CANONADA).");
  }
}

/* ══════════ P5 · R-1 — Skills inabastables per l'índex RAG ══════════ */

const CANDIDATS_RAG = [
  'tooling/wiki/core/edge_rag.mjs',
  'tooling/wiki/core/build_rag_index.mjs',
  'tooling/wiki/build_rag_index.mjs',
];
const ragPath = CANDIDATS_RAG.map((p) => path.join(ARREL, p)).find((p) => fs.existsSync(p));

if (!ragPath) {
  registra('P5', 'AVÍS', '(RAG)', "No s'ha localitzat el motor RAG als camins canònics; porta P5 no verificada.");
} else {
  const ragSrc = fs.readFileSync(ragPath, 'utf8');
  const filtraPunt = /startsWith\(['"]\.['"]\)/.test(ragSrc);
  const excepcioSkills = /\.agents/.test(ragSrc);
  if (filtraPunt && !excepcioSkills) {
    registra('P5', 'BLOQUEJANT', rel(ragPath),
      "El caminador descarta tot directori que comence per punt i no fa excepció per a .agents/skills: el cànon és inabastable per cerca semàntica.");
  }

  const paths = path.join(ARREL, 'tooling/wiki/lib/project_paths.mjs');
  if (fs.existsSync(paths)) {
    const src = fs.readFileSync(paths, 'utf8');
    const arrelWiki = /WIKI_DIR\s*=\s*path\.join\(PROJECT_DIR,\s*['"]_wiki_de_poble['"]\)/.test(src);
    if (arrelWiki && !excepcioSkills) {
      registra('P5', 'BLOQUEJANT', rel(paths),
        "L'arrel del RAG és _wiki_de_poble; .agents/skills en queda fora. Cap skill és recuperable per cerca.");
    }
  }
}

const teixidora = path.join(ARREL, 'tooling/wiki/teixidora_sinapsis.mjs');
if (fs.existsSync(teixidora)) {
  const src = fs.readFileSync(teixidora, 'utf8');
  if (/JURISDICCIONS_EXCLOSES[\s\S]{0,400}?AGENTS_I_SKILLS_MIRROR/.test(src)) {
    registra('P5', 'AVÍS', rel(teixidora),
      "El mirall de skills està a JURISDICCIONS_EXCLOSES: cap sinapsi lateral entre skills és possible (topologia d'estrela permanent).");
  }
}

/* ══════════ P6 · C-2 — Política d'idioma ══════════ */

const idiomes = new Map();
for (const s of skills) {
  const l = camp(s.fm, 'lang') || '(sense)';
  idiomes.set(l, (idiomes.get(l) || 0) + 1);
}
const majoritari = [...idiomes.entries()].sort((a, b) => b[1] - a[1])[0];
const senseLang = idiomes.get('(sense)') || 0;

if (idiomes.size > 2 || (idiomes.size === 2 && !idiomes.has('(sense)'))) {
  registra('P6', 'AVÍS', '.agents/skills',
    `Idioma declarat incoherent: ${[...idiomes.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}. Majoritari '${majoritari[0]}'.`);
}
if (senseLang > 0) {
  registra('P6', 'AVÍS', '.agents/skills',
    `${senseLang} skills sense camp 'lang' al frontmatter. Una política que no es declara no es pot imposar.`);
}

/* ══════════ P7 · C-1 — Doble font canònica del Consell ══════════ */

const fontsConsell = [];
for (const s of skills) {
  const cos = llevaCodi(s.cos);
  const llistaDura = /(Zeta|Z\.ai)[^\n]{0,200}(Qwen|Deepseek)[^\n]{0,200}(Claude|ChatGPT)/i.test(cos);
  const punter = /02_EQUIP_IA\.md/.test(cos);
  if (llistaDura) fontsConsell.push({ ruta: rel(s.ruta), mena: 'llista dura' });
  if (punter) fontsConsell.push({ ruta: rel(s.ruta), mena: 'punter a 02_EQUIP_IA.md' });
}
if (fontsConsell.length > 1) {
  registra('P7', 'BLOQUEJANT', fontsConsell.map((f) => f.ruta).join(' | '),
    `${fontsConsell.length} fonts per a la llista del Consell: ${fontsConsell.map((f) => f.mena).join(' vs ')}. Dos regles canòniques que es contradiuen no en deixen cap de viva.`);
}

/* ══════════ P8 · B-6 — Esquema destruït per la fusió ══════════ */

const OBLIGATORIS = ['name', 'description'];
const OPERATIUS = ['triggers_ca', 'triggers_en', 'version', 'status'];
let senseTriggers = 0;

for (const s of skills) {
  const falten = OBLIGATORIS.filter((c) => !camp(s.fm, c));
  if (falten.length > 0) {
    registra('P8', 'BLOQUEJANT', rel(s.ruta),
      `Al frontmatter li falten camps obligatoris: ${falten.join(', ')}.`);
  }
  const teTrigger = /^triggers_[a-z]{2}:/m.test(s.fm);
  if (!teTrigger) {
    senseTriggers++;
    const alCos = /^triggers_[a-z]{2}:/m.test(s.cos);
    registra('P8', 'BLOQUEJANT', rel(s.ruta),
      alCos
        ? "Zero 'triggers_*' al frontmatter, però n'hi ha dins del cos: els disparadors pertanyen a skills mortes. La skill no es pot activar mai."
        : "Zero 'triggers_*' al frontmatter: no hi ha cap manera de saber quan s'ha de carregar esta skill.");
  }
  const faltenOp = OPERATIUS.filter((c) => !camp(s.fm, c) && !/^triggers_/.test(c));
  if (faltenOp.length > 0 && teTrigger) {
    registra('P8', 'AVÍS', rel(s.ruta), `Sense ${faltenOp.join(', ')} al frontmatter.`);
  }
}

/* ══════════ P9 · D-2 — Acompanyants sense consumidor ══════════ */

const totesLesFonts = [
  ...camina(path.join(ARREL, 'tooling'), /\.(mjs|js|cjs|py|sh)$/),
  ...camina(path.join(ARREL, '.agents'), /\.(mjs|js|cjs|py|sh)$/),
];
const corpus = totesLesFonts.map((f) => {
  try { return fs.readFileSync(f, 'utf8'); } catch { return ''; }
}).join('\n');

for (const f of camina(DIR_SKILLS, /\.(json|mjs|js|ya?ml)$/)) {
  const base = path.basename(f);
  const usos = (corpus.match(new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (usos === 0) {
    registra('P9', 'BLOQUEJANT', rel(f),
      `Fitxer acompanyant dins d'una skill que cap script del projecte llig. Codi mort disfressat de cànon.`);
  }
}

/* ────────────────────────── Informe ────────────────────────── */

const bloquejants = troballes.filter((t) => t.grau === 'BLOQUEJANT');
const avisos = troballes.filter((t) => t.grau === 'AVÍS');

const resum = {
  arrel: ARREL,
  skills_revisades: skills.length,
  fonts_js_revisades: fontsJs.length,
  noms_fantasma_al_genoma: fantasmes,
  bloquejants: bloquejants.length,
  avisos: avisos.length,
  troballes,
};

if (JSON_OUT) {
  console.log(JSON.stringify(resum, null, 2));
} else {
  const PORTES = {
    P1: 'B-1 · Frontmatter fantasma al cos',
    P2: 'D-1 · Duplicats i col·lisions de node',
    P3: 'C-4 · Guardes del Reflex capades',
    P4: 'C-3 · Escriptura fora de la Canonada',
    P5: 'R-1 · Skills inabastables pel RAG',
    P6: 'C-2 · Política d\'idioma',
    P7: 'C-1 · Doble font canònica del Consell',
    P8: 'B-6 · Esquema i disparadors destruïts',
    P9: 'D-2 · Acompanyants sense consumidor',
  };

  console.log('\n🧠 TRACTOR COGNITIU — Porta de la Consciència Contextual');
  console.log(`   Arrel: ${ARREL}`);
  console.log(`   ${skills.length} skills · ${fontsJs.length} fonts JS revisades\n`);

  for (const [codi, titol] of Object.entries(PORTES)) {
    const t = troballes.filter((x) => x.porta === codi);
    const bl = t.filter((x) => x.grau === 'BLOQUEJANT').length;
    const icona = bl > 0 ? '❌' : t.length > 0 ? '⚠️ ' : '✅';
    console.log(`${icona} ${codi}  ${titol}${t.length ? `  (${bl} bloquejants, ${t.length - bl} avisos)` : ''}`);
    for (const x of t) {
      console.log(`      · [${x.grau}] ${x.fitxer}`);
      console.log(`        ${x.missatge}`);
      if (x.detall?.antics?.length) {
        console.log(`        fantasmes: ${x.detall.antics.join(', ')}`);
      }
    }
  }

  if (fantasmes > 0) {
    const total = skills.length + fantasmes;
    const pct = ((fantasmes / total) * 100).toFixed(0);
    console.log(`\n📉 GENOMA: ${total} noms de skill exposats, ${skills.length} amb fitxer, ${fantasmes} sense.`);
    console.log(`   ${pct}% dels noms que l'agent llig sobre si mateix apunten al no-res.`);
  }
  if (senseTriggers > 0) {
    console.log(`\n🔇 EMPENTA: ${senseTriggers}/${skills.length} skills sense cap 'triggers_*'.`);
    console.log(`   Sense disparador no hi ha càrrega automàtica; sense RAG no hi ha cerca.`);
    console.log(`   L'única via que queda és que l'humà dicte la ruta. Això no és desídia de l'agent: és topologia.`);
  }

  console.log(`\n   ${bloquejants.length} bloquejants · ${avisos.length} avisos`);
}

const falla = bloquejants.length > 0 || (AVISOS_BLOQUEGEN && avisos.length > 0);
if (falla) {
  if (!JSON_OUT) console.error('\n❌ PORTA TANCADA. El bancal no passa.\n');
  process.exit(1);
}
if (!JSON_OUT) console.log('\n✅ Bancal passat.\n');
process.exit(0);
