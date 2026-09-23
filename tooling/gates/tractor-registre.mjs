#!/usr/bin/env node
/**
 * tractor-registre.mjs — la porta que li faltava al cervell.
 *
 * Comprova mecànicament que el registre declarat (`00_INDEX_SKILLS.md`), les
 * carpetes del disc, els frontmatters dels `SKILL.md` i les obligacions del
 * BIOS (`.agents/rules/00_BIOS_COGNITIU.md`) diuen el mateix.
 *
 * Cap d'aquestes comprovacions és d'estil. Totes detecten una divergència que
 * fa que un agent carregue una cosa distinta de la que el sistema declara.
 *
 * Lleis aplicades (cada una amb codi propi per a poder-la citar en un ADR):
 *   R1  FANTASMA        skill al registre sense carpeta al disc
 *   R2  CLANDESTINA     carpeta al disc que el registre no declara
 *   R3  TRIGGER-DOBLE   dos skills comparteixen un trigger
 *   R4  NOM-DISCORDANT  `name:` del frontmatter ≠ nom de carpeta
 *   R5  BIOS-ORFE       skill obligatòria del BIOS sense carpeta al disc
 *   R6  BIOS-NO-REGIST  skill obligatòria del BIOS absent del registre
 *   R7  FRONTMATTER     `SKILL.md` sense frontmatter o malformat
 *   R8  ESTAT-INVALID   `status:` fora del vocabulari permés
 *   R9  BUIDA           skill activa amb cos per davall del mínim (stub)
 *   R10 CONFLICTE-ORFE  `conflicts_with:` apunta a una skill inexistent
 *   R11 ALIAS-PREFIX    el registre usa un nom que només difereix per prefix
 *                       d'una carpeta real (p. ex. ui-pedra-seca / pedra-seca)
 *
 * Pedra Seca: zero dependències, ESM, fail-closed, eixida per stdout.
 *
 *   node tooling/gates/tractor-registre.mjs
 *   node tooling/gates/tractor-registre.mjs --json
 *   node tooling/gates/tractor-registre.mjs --avisos-com-error
 *   node tooling/gates/tractor-registre.mjs --minim-cos=250
 *   node tooling/gates/tractor-registre.mjs --cervell=inicial_2026-08-24T21-26-15-657Z
 *   node tooling/gates/tractor-registre.mjs --arrel=/ruta/al/repo
 */

import fs from 'node:fs';
import { arrelSegura as arrelDelProjecte } from '../lib/arrel.mjs';
import path from 'node:path';

/* ─────────────────────────────── Configuració ─────────────────────────────── */

const ESTATS_VALIDS = new Set(['canonic', 'active', 'actiu', 'draft', 'esborrany', 'arxivat', 'deprecated']);
const ESTATS_ACTIUS = new Set(['canonic', 'active', 'actiu']);
const MINIM_COS_DEFECTE = 400; // caràcters de cos útil per a no considerar-la un stub

/* ─────────────────────────────── Arrel ─────────────────────────────── */


const arg = (nom) => {
  const trobat = process.argv.find((a) => a.startsWith(`--${nom}=`));
  return trobat ? trobat.slice(nom.length + 3) : null;
};

const ARREL = arrelDelProjecte();
const JSON_OUT = process.argv.includes('--json');
const AVISOS_FATALS = process.argv.includes('--avisos-com-error');
const MINIM_COS = Number(arg('minim-cos') ?? MINIM_COS_DEFECTE);

if (!ARREL) {
  console.error("❌ [REGISTRE] No trobe l'arrel del projecte (cal AGENTS.md o .agents/AGENTS.md). Usa --arrel=/ruta.");
  process.exit(1);
}

const R = (p) => path.join(ARREL, p);
const rel = (p) => path.relative(ARREL, p) || p;

/* ─────────────────────── Frontmatter (subconjunt canònic) ─────────────────────── */

/**
 * No implementa YAML complet. Cobrix el subconjunt del frontmatter de skills:
 * escalars citats i simples, llistes en bloc (`- x`) i inline (`[a, b]`), i
 * mapes d'un nivell. Retorna `malformat: true` en compte d'endevinar.
 */
function llegeixFrontmatter(cru) {
  const net = cru.replace(/^\uFEFF/, '');
  if (!/^---[ \t]*\r?\n/.test(net)) {
    return { hiHa: false, malformat: false, dades: {}, cos: net };
  }
  const resta = net.slice(net.indexOf('\n') + 1);
  const tanca = /^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m.exec(resta);
  if (!tanca) return { hiHa: false, malformat: true, dades: {}, cos: net };

  const bloc = resta.slice(0, tanca.index);
  const cos = resta.slice(tanca.index + tanca[0].length);
  const dades = {};

  let clauLlista = null;
  let indentMapa = null;
  let clauMapa = null;

  for (const brut of bloc.split(/\r?\n/)) {
    if (!brut.trim() || /^\s*#/.test(brut)) continue;
    const indent = brut.length - brut.trimStart().length;
    const linia = brut.trim();

    if (linia.startsWith('- ')) {
      if (!clauLlista) continue; // element de llista sense clau: l'ignorem, no l'endevinem
      dades[clauLlista].push(descita(linia.slice(2).trim()));
      continue;
    }

    const m = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(linia);
    if (!m) continue;
    const [, clau, valorBrut] = m;

    // mapa imbricat d'un nivell (p. ex. freshness:)
    if (indentMapa !== null && indent > indentMapa) {
      dades[clauMapa][clau] = descita(valorBrut);
      continue;
    }
    indentMapa = null;
    clauMapa = null;
    clauLlista = null;

    const valor = valorBrut.trim();
    if (valor === '') {
      // pot ser llista en bloc o mapa imbricat: ho decidix la línia següent
      dades[clau] = [];
      clauLlista = clau;
      indentMapa = indent;
      clauMapa = clau;
      continue;
    }
    if (/^\[.*\]$/.test(valor)) {
      const dins = valor.slice(1, -1).trim();
      dades[clau] = dins === '' ? [] : dins.split(',').map((x) => descita(x.trim()));
      continue;
    }
    dades[clau] = descita(valor);
  }

  // les claus que van quedar com a [] però van rebre parells clau:valor
  for (const [k, v] of Object.entries(dades)) {
    if (Array.isArray(v) && v.length === 0 && clauMapa === k) dades[k] = {};
  }

  return { hiHa: true, malformat: false, dades, cos };
}

function descita(v) {
  const s = String(v).trim();
  if (/^'[\s\S]*'$/.test(s)) return s.slice(1, -1).replace(/''/g, "'");
  if (/^"([\s\S]*)"$/.test(s)) return s.slice(1, -1);
  return s;
}

/* ─────────────────────────────── Localitza el cervell ─────────────────────────────── */

const DIR = R('.agents/skills');
const CERVELL = 'únic';
if (!fs.existsSync(DIR)) {
  console.error(`❌ [REGISTRE] No existix ${rel(DIR)}. Sense cervell no hi ha res a validar.`);
  process.exit(1);
}

/* ─────────────────────────────── Fonts ─────────────────────────────── */

const problemes = [];
const avisos = [];
const falla = (llei, subjecte, missatge) => problemes.push({ llei, subjecte, missatge });
const avisa = (llei, subjecte, missatge) => avisos.push({ llei, subjecte, missatge });

/* 1 · Registre declarat ------------------------------------------------------ */

const FITXER_INDEX = path.join(DIR, '00_INDEX_SKILLS.md');
if (!fs.existsSync(FITXER_INDEX)) {
  console.error(`❌ [REGISTRE] Falta ${rel(FITXER_INDEX)}. El registre canònic no existix: no puc validar res contra res.`);
  process.exit(1);
}

const crualIndex = fs.readFileSync(FITXER_INDEX, 'utf8');
/*
 * Formes acceptades d'una línia de registre. TOTES han de conviure: la Wiki és
 * d'Obsidian i el wikilink és portador del graf; obligar a backticks trencaria
 * les sinapsis. El lector s'adapta al registre, no al revés.
 *
 *   F1  - `nom-skill`: descripció
 *   F2  - [[nom-skill/SKILL|nom-skill]]: descripció
 *   F3  - [[nom-skill]]: descripció
 *   F4  - **nom-skill**: descripció
 *
 * 260831 (Seient Núm. 5): només s'implementava F1. El registre real usa F2, així
 * que el lector tornava 0 skills, disparava R0 i després acusava les 13 skills
 * reals de clandestines (R2). Tretze falsos positius que tapaven els verdaders.
 */
const FORMES_REGISTRE = [
  /^\s*[-*]\s*`([a-z0-9][a-z0-9._-]*)`\s*:/i,
  /^\s*[-*]\s*\[\[([a-z0-9][a-z0-9._-]*)\/SKILL\s*\|[^\]]*\]\]\s*:/i,
  /^\s*[-*]\s*\[\[([a-z0-9][a-z0-9._-]*)(?:\s*\|[^\]]*)?\]\]\s*:/i,
  /^\s*[-*]\s*\*\*([a-z0-9][a-z0-9._-]*)\*\*\s*:/i,
];

const declarades = new Map(); // nom → { linia }
for (const [i, linia] of crualIndex.split(/\r?\n/).entries()) {
  for (const forma of FORMES_REGISTRE) {
    const m = forma.exec(linia);
    if (m) { declarades.set(m[1], { linia: i + 1 }); break; }
  }
}

if (declarades.size === 0) {
  falla('R0', rel(FITXER_INDEX),
    "El lector del registre no ha trobat cap skill. O el format ha canviat o el registre és buit; en tots dos casos no puc certificar res.");
}

/* 2 · Carpetes al disc ------------------------------------------------------- */

const alDisc = new Map(); // nom carpeta → { fm, cos, ruta }
for (const e of fs.readdirSync(DIR, { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  const skillMd = path.join(DIR, e.name, 'SKILL.md');
  if (!fs.existsSync(skillMd)) {
    falla('R7', `${CERVELL}/${e.name}`, "Carpeta de skill sense `SKILL.md`. O és una skill trencada o és brossa que ocupa lloc al cervell.");
    continue;
  }
  const cru = fs.readFileSync(skillMd, 'utf8');
  const fm = llegeixFrontmatter(cru);
  alDisc.set(e.name, { fm, ruta: skillMd, cru });
}

/* 3 · Obligacions del BIOS --------------------------------------------------- */

const FITXER_BIOS = R('.agents/rules/00_BIOS_COGNITIU.md');
const obligatories = new Map(); // nom → linia
if (!fs.existsSync(FITXER_BIOS)) {
  avisa('R5', rel(FITXER_BIOS), "El BIOS no existix: no puc verificar les skills transversals obligatòries.");
} else {
  const cruBios = fs.readFileSync(FITXER_BIOS, 'utf8').split(/\r?\n/);
  let dins = false;
  for (const [i, linia] of cruBios.entries()) {
    if (/skills?\s+transversals?\s+obligat/i.test(linia)) { dins = true; continue; }
    if (dins && /^#{1,6}\s/.test(linia)) dins = false;
    if (!dins) continue;
    const m = /^\s*\d+\.\s*`([a-z0-9][a-z0-9._-]*)`/i.exec(linia);
    if (m) obligatories.set(m[1], i + 1);
  }
}

/* ─────────────────────────────── Lleis ─────────────────────────────── */

const noms = new Set([...declarades.keys(), ...alDisc.keys()]);

/* R1 · Fantasmes: declarades sense carpeta */
for (const [nom, info] of declarades) {
  if (alDisc.has(nom)) continue;
  const semblant = [...alDisc.keys()].find((d) => d.endsWith(`-${nom}`) || nom.endsWith(`-${d}`) || d === nom.replace(/^[a-z]+-/, ''));
  if (semblant) {
    falla('R11', nom,
      `El registre (línia ${info.linia}) declara '${nom}' però al disc hi ha '${semblant}'. Un carregador per nom erra la skill sencera per un prefix.`);
  } else {
    falla('R1', nom, `Declarada al registre (línia ${info.linia}) i sense carpeta al disc. Fantasma.`);
  }
}

/* R2 · Clandestines: al disc sense declarar */
for (const nom of alDisc.keys()) {
  if (declarades.has(nom)) continue;
  const alias = [...declarades.keys()].some((d) => d.endsWith(`-${nom}`) || nom.endsWith(`-${d}`));
  if (alias) continue; // ja reportada com a R11
  falla('R2', nom, "Existix al disc i el registre que es diu 'únic registre oficial' no la declara. Es carregarà sense governança.");
}

/* R4 · nom del frontmatter ≠ carpeta | R7 frontmatter | R8 estat | R9 stub | R10 conflictes */
const triggers = new Map(); // trigger → [skills]

for (const [nom, { fm, ruta }] of alDisc) {
  if (fm.malformat) {
    falla('R7', nom, `Frontmatter malformat a ${rel(ruta)} (obri \`---\` i no tanca). El RAG el descarta en silenci.`);
    continue;
  }
  if (!fm.hiHa) {
    falla('R7', nom, `${rel(ruta)} no té frontmatter. Sense \`name\` ni \`status\` no és carregable de forma determinista.`);
    continue;
  }

  const d = fm.dades;

  if (!d.name) {
    falla('R4', nom, "El frontmatter no declara `name:`.");
  } else if (String(d.name) !== nom) {
    falla('R4', nom, `El frontmatter diu \`name: ${d.name}\` i la carpeta es diu '${nom}'. Dos identificadors per a la mateixa skill.`);
  }

  const estat = String(d.status || d.estat || '').toLowerCase();
  if (!estat) {
    falla('R8', nom, "Sense `status:`. Una skill sense estat no es pot arxivar ni desactivar mai.");
  } else if (!ESTATS_VALIDS.has(estat)) {
    falla('R8', nom, `\`status: ${estat}\` no és del vocabulari permés (${[...ESTATS_VALIDS].join(', ')}).`);
  }

  if (ESTATS_ACTIUS.has(estat)) {
    const cosUtil = fm.cos.replace(/^#.*$/gm, '').replace(/\s+/g, ' ').trim();
    if (cosUtil.length < MINIM_COS) {
      falla('R9', nom,
        `Activa (\`${estat}\`) amb només ${cosUtil.length} caràcters de cos útil (mínim ${MINIM_COS}). És un stub que es declara operatiu.`);
    }
  }

  const llistaTriggers = []
    .concat(d.triggers_ca || [], d.triggers || [], d.triggers_on || [])
    .flatMap((t) => String(t).split(',').map((x) => x.trim().toLowerCase()))
    .filter(Boolean);

  /*
   * R12 · un trigger repetit DINS de la mateixa skill no és una col·lisió entre
   * skills: és brossa al frontmatter. Abans es colava a `triggers` dues vegades
   * i R3 informava «compartit per 2 skills: X, X», que no vol dir res i fa
   * desconfiar de la porta sencera. Es separa i es compta una sola vegada.
   */
  const vistosLocal = new Set();
  for (const t of llistaTriggers) {
    if (t === nom) continue; // `triggers_on: [<nom propi>]` és autoreferència, no col·lisió
    if (vistosLocal.has(t)) {
      falla('R12', nom, `Trigger \`${t}\` repetit dins del seu propi frontmatter. No col·lisiona amb ningú, però infla el registre i emmascara les col·lisions reals.`);
      continue;
    }
    vistosLocal.add(t);
    if (!triggers.has(t)) triggers.set(t, []);
    triggers.get(t).push(nom);
  }

  /*
   * R13 · `supersedes` / `substitueix` que apunta a una skill VIVA al disc.
   * Declarar-se successora d'una skill que encara es carrega no desactiva res:
   * queden les dues actives disputant-se els mateixos triggers, i qui guanya
   * depén de l'ordre de lectura del directori.
   */
  for (const clau of ['supersedes', 'substitueix', 'replaces']) {
    for (const s of [].concat(d[clau] || [])) {
      const sn = String(s).trim().split(/[\s(]/)[0];
      if (!sn || sn === nom) continue;
      if (alDisc.has(sn)) {
        falla('R13', nom, `Declara \`${clau}: ${sn}\` i '${sn}' continua al disc i al registre. Una successió que no esborra la predecessora no és una successió: són dues skills actives.`);
      }
    }
  }

  for (const c of [].concat(d.conflicts_with || [])) {
    const cn = String(c).trim();
    if (!cn) continue;
    if (!noms.has(cn)) {
      falla('R10', nom, `\`conflicts_with: ${cn}\` apunta a una skill que no existix ni al disc ni al registre.`);
    }
  }
}

/* R3 · triggers duplicats
 *
 * Un gallet compartit no és per si mateix un defecte: «petorreta» ha
 * d'encendre alhora el protocol de reflexió i les regles del Consell.
 * El defecte és que no hi haja ORDRE. Amb `prioritat` distinta al
 * frontmatter, la càrrega és determinista i la porta calla; sense ella,
 * qui guanya depén de l'ordre de lectura del directori, que no és una llei.
 */
function prioritatDe(nom) {
  const abs = path.join(ARREL, '.agents', 'skills', nom, 'SKILL.md');
  if (!fs.existsSync(abs)) return null;
  const m = fs.readFileSync(abs, 'utf8').match(/^prioritat:\s*(\d+)\s*$/m);
  return m ? Number(m[1]) : null;
}

for (const [t, quines] of triggers) {
  if (quines.length < 2) continue;
  const prios = quines.map(prioritatDe);
  const totes = prios.every((p) => p !== null);
  const distintes = new Set(prios).size === prios.length;
  if (totes && distintes) continue; /* ordre declarat: resolt */
  falla('R3', t,
    `Trigger compartit per ${quines.length} skills: ${quines.join(', ')}. `
    + (totes
      ? 'Totes declaren «prioritat» però repetixen valor: l\'empat no desempata res.'
      : 'Cap ordre declarat. Afig `prioritat:` (menor = abans) al frontmatter de cadascuna; sense això la resolució queda a l\'atzar de l\'ordre de càrrega.'));
}

/* R5 / R6 · obligacions del BIOS */
for (const [nom, linia] of obligatories) {
  if (!alDisc.has(nom)) {
    falla('R5', nom,
      `El BIOS (línia ${linia}) la declara transversal OBLIGATÒRIA sota tancament fort i no existix al disc. O el sistema hauria de bloquejar-se sempre, o la regla és decorativa.`);
  }
  if (!declarades.has(nom)) {
    falla('R6', nom, `Obligatòria segons el BIOS (línia ${linia}) i absent del registre canònic.`);
  }
}

/* ─────────────────────────────── Eixida ─────────────────────────────── */

const resum = {
  cervell: CERVELL,
  declarades: declarades.size,
  alDisc: alDisc.size,
  interseccio: [...declarades.keys()].filter((n) => alDisc.has(n)).length,
  obligatoriesBios: obligatories.size,
  problemes: problemes.length,
  avisos: avisos.length,
};

if (JSON_OUT) {
  console.log(JSON.stringify({ resum, problemes, avisos }, null, 2));
  process.exit(problemes.length > 0 || (AVISOS_FATALS && avisos.length > 0) ? 1 : 0);
}

console.log(`\n🧠 [REGISTRE] Cervell: ${CERVELL}`);
console.log(`   Registre declara ${resum.declarades} · disc en té ${resum.alDisc} · coincidixen ${resum.interseccio}`);
if (resum.declarades > 0) {
  const exactitud = Math.round((resum.interseccio / resum.declarades) * 100);
  console.log(`   Exactitud del registre: ${exactitud}%`);
}
console.log(`   BIOS exigix ${resum.obligatoriesBios} skills transversals\n`);

const perLlei = new Map();
for (const p of problemes) {
  if (!perLlei.has(p.llei)) perLlei.set(p.llei, []);
  perLlei.get(p.llei).push(p);
}

for (const [llei, llista] of [...perLlei].sort()) {
  console.log(`  ── ${llei} (${llista.length}) ─────────────────────────────`);
  for (const p of llista) console.log(`   · ${p.subjecte}: ${p.missatge}`);
  console.log('');
}

for (const a of avisos) console.log(`  ⚠️  ${a.llei} ${a.subjecte}: ${a.missatge}`);
if (avisos.length) console.log('');

if (problemes.length > 0 || (AVISOS_FATALS && avisos.length > 0)) {
  console.error(`❌ [REGISTRE] ${problemes.length} divergències. El cervell declarat i el cervell real no són el mateix.\n`);
  process.exit(1);
}

console.log('✅ [REGISTRE] El registre, el disc, els frontmatters i el BIOS diuen el mateix.\n');
process.exit(0);
