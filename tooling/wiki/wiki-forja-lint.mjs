#!/usr/bin/env node
/**
 * IDEA-130 · Tractor lleuger de lectura i diagnòstic per a la Wiki (`wiki-forja-lint.mjs`)
 *
 * Responsabilitats (només lectura: no escriu cap fitxer; `--diff` compara dos commits):
 * 1. `wiki-sync` diferencial (`analitzaWikiSyncDiferencial`): donada una llista de fitxers
 *    modificats (`--files`) o un rang de commits (`--diff`), identifica quins documents
 *    de `_wiki_de_poble/02_saber/` o `_wiki_de_poble/03_actuar/` mencionen aquests fitxers
 *    o els seus mòduls i caldria sincronitzar.
 * 2. Detector de Gaps semàntics (`detectaGapsWiki`):
 *    - Pàgines de `_wiki_de_poble/` sense secció `## Vincles`.
 *    - Rutes `src/...` esmentades a la Wiki que ja no existisquen al disc.
 *    - Recompte d'etiquetes `skill-forge` (`[DECISION]`, `[SEQUENCE]`, `[CORRECTION]`,
 *      `[DEADEND]`, `[CONVENTION]`, `[DISCOVERY]`, `[CHECKPOINT]`) a `10_actes/` i `04_escriptori/`.
 *
 * Respecta `AGENTS.md` §5: MAI llig `_wiki_de_poble/90_arxiu_historic/`.
 *
 * K3 (Onada R10) · Abast tancat:
 *  - Els noms de la Wiki i de l'Escriptori ixen de la SSOT (`lib/project_paths.mjs`).
 *  - `--diff` només admet un rang de git net: un valor que comença per `-` (per exemple
 *    `--output=fitxer`, que faria escriure git) no arriba mai a git.
 *  - Segona ronda: el rang ha de tindre dos extrems (`A..B` o `A...B`). Git el resol
 *    arbre contra arbre. Una revisió sola (`b8904b465`) compararia amb l'arbre de
 *    treball, i aquell `git diff` pot reescriure la memòria cau de `.git/index`
 *    (tooling/brain/mapa-consola.mjs, matís 261026): es rebutja.
 *  - Una ruta `src/...` que ix de l'arrel amb `..` no es mira al disc: va a
 *    `rutesSrcForaDeLArrel`.
 *  - Una ruta `src/...` inexistent no sempre és una llacuna: un pla (una ADR en
 *    esborrany) o un exemple de plantilla citen fitxers que encara no existixen.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PROJECT_DIR, WIKI_DIR, ESCRIPTORI_DIR } from './lib/project_paths.mjs';

/* Noms relatius de la SSOT: l'eina també treballa sobre una arrel sintètica (`--arrel`). */
const NOM_WIKI = path.relative(PROJECT_DIR, WIKI_DIR);
const NOM_ESCRIPTORI = path.relative(WIKI_DIR, ESCRIPTORI_DIR);

/* Un extrem net: refs, `~`, `^` i `@{…}`, amb punts solts però mai `..`; mai una opció. */
const EXTREM_GIT = String.raw`[A-Za-z0-9](?:[A-Za-z0-9_/~^@{}-]|\.(?!\.))*`;
/* Un rang de git net amb dos extrems: `A..B` o `A...B` (arbre contra arbre). */
const RANG_GIT_SEGUR = new RegExp(`^${EXTREM_GIT}\\.\\.\\.?${EXTREM_GIT}$`);

/**
 * Cert si el valor de `--diff` és un rang de git de dos extrems que no pot passar per
 * opció. Una revisió sola torna fals: compararia amb l'arbre de treball.
 */
export function esRangGitSegur(rang) {
  const net = String(rang ?? '').trim();
  return net.length > 0 && net.length <= 200 && RANG_GIT_SEGUR.test(net);
}

export const ETQ_SKILL_FORGE = Object.freeze([
  'DECISION',
  'SEQUENCE',
  'CORRECTION',
  'DEADEND',
  'CONVENTION',
  'DISCOVERY',
  'CHECKPOINT',
]);

const CARPETES_PROHIBIDES = new Set(['90_arxiu_historic', '.git', 'node_modules']);

/**
 * Llista recursivament tots els fitxers `.md` dins d'un directori excloent `90_arxiu_historic`.
 * @param {string} dirAbs
 * @returns {string[]}
 */
export function llistaMarkdownSegur(dirAbs) {
  if (!fs.existsSync(dirAbs)) return [];
  const resultat = [];
  const entrades = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const entrada of entrades) {
    if (CARPETES_PROHIBIDES.has(entrada.name)) continue;
    const rutaCompleta = path.join(dirAbs, entrada.name);
    if (entrada.isDirectory()) {
      resultat.push(...llistaMarkdownSegur(rutaCompleta));
    } else if (entrada.isFile() && entrada.name.endsWith('.md')) {
      resultat.push(rutaCompleta);
    }
  }
  return resultat.sort();
}

/**
 * Extreu fitxers modificats des d'un rang git (`--diff`) de manera segura.
 * Un rang que no passa `esRangGitSegur` torna [] sense cridar git.
 * @param {string} arrel
 * @param {string} diffRange
 * @param {typeof execFileSync} [executa] injectable a les proves
 * @returns {string[]}
 */
export function obteFitxersDesDeGitDiff(arrel, diffRange, executa = execFileSync) {
  const net = String(diffRange || '').trim();
  if (!esRangGitSegur(net)) return [];
  try {
    const eixida = executa('git', ['diff', '--name-only', net, '--'], {
      cwd: arrel,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return eixida
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Identifica quins documents de `_wiki_de_poble/02_saber/` o `_wiki_de_poble/03_actuar/`
 * caldria revisar/sincronitzar quan canvien determinats fitxers del repositori.
 *
 * @param {{ arrel: string, fitxersModificats: string[] }} opcions
 */
export function analitzaWikiSyncDiferencial({ arrel, fitxersModificats = [] }) {
  const arrelAbs = path.resolve(arrel);
  const netejats = Array.from(
    new Set(
      (Array.isArray(fitxersModificats) ? fitxersModificats : [])
        .map((f) => String(f || '').trim().replace(/\\/g, '/').replace(/^\.\//, ''))
        .filter(Boolean)
    )
  );

  const carpetesSaberActuar = [
    path.join(arrelAbs, NOM_WIKI, '02_saber'),
    path.join(arrelAbs, NOM_WIKI, '03_actuar'),
  ];

  const docsCandidats = carpetesSaberActuar.flatMap((d) => llistaMarkdownSegur(d));
  const suggeriments = [];

  const tokensCerca = netejats.map((rutaRel) => {
    const base = path.basename(rutaRel);
    const senseExt = base.replace(/\.[^.]+$/, '');
    return { rutaRel, base, senseExt };
  });

  for (const docAbs of docsCandidats) {
    if ( tokensCerca.length === 0 ) continue;
    const contingut = fs.readFileSync(docAbs, 'utf8');
    const docRel = path.relative(arrelAbs, docAbs).replace(/\\/g, '/');
    const coincidencies = [];

    for (const token of tokensCerca) {
      if (
        contingut.includes(token.rutaRel) ||
        (token.base.length >= 4 && contingut.includes(token.base)) ||
        (token.senseExt.length >= 6 && contingut.includes(token.senseExt))
      ) {
        coincidencies.push(token.rutaRel);
      }
    }

    if (coincidencies.length > 0) {
      suggeriments.push({
        doc: docRel,
        fitxersRelacionats: Array.from(new Set(coincidencies)),
      });
    }
  }

  return {
    fitxersAnalitzats: netejats,
    totalDocsInspeccionats: docsCandidats.length,
    suggerimentsSync: suggeriments,
  };
}

/**
 * Executa el detector de Gaps semàntics sobre `_wiki_de_poble/` (excloent `90_arxiu_historic/`).
 *
 * @param {{ arrel: string }} opcions
 */
export function detectaGapsWiki({ arrel }) {
  const arrelAbs = path.resolve(arrel);
  const wikiAbs = path.join(arrelAbs, NOM_WIKI);
  const prefixActes = `${NOM_WIKI.replace(/\\/g, '/')}/10_actes/`;

  const carpetesCanonica = ['01_ser', '02_saber', '03_actuar', '10_actes'];
  const docsCanonics = carpetesCanonica.flatMap((c) =>
    llistaMarkdownSegur(path.join(wikiAbs, c))
  );

  const senseVincles = [];
  const rutesSrcInexistents = [];
  const rutesSrcForaDeLArrel = [];
  const jaVistes = new Set();

  const regexVincles = /^##\s+Vincles\b/m;
  const regexRutaSrc = /\b(src\/[A-Za-z0-9_./-]+\.(?:jsx?|mjs|cjs|ts|tsx|css|json))\b/g;

  for (const docAbs of docsCanonics) {
    const docRel = path.relative(arrelAbs, docAbs).replace(/\\/g, '/');
    const contingut = fs.readFileSync(docAbs, 'utf8');

    if (!regexVincles.test(contingut)) {
      senseVincles.push(docRel);
    }

    // Només comprovem rutes `src/` vigents en `01_ser`, `02_saber` i `03_actuar`
    // (les actes històriques de `10_actes` poden esmentar rutes antigues legítimes).
    if (!docRel.startsWith(prefixActes)) {
      let match;
      while ((match = regexRutaSrc.exec(contingut)) !== null) {
        const rutaSrc = match[1];
        const clau = `${docRel}::${rutaSrc}`;
        if (jaVistes.has(clau)) continue;
        jaVistes.add(clau);

        const candidatAbs = path.resolve(arrelAbs, rutaSrc);
        const relativa = path.relative(arrelAbs, candidatAbs);
        if (relativa.startsWith('..') || path.isAbsolute(relativa)) {
          // Fora de l'arrel: no es mira al disc.
          rutesSrcForaDeLArrel.push({ doc: docRel, ruta: rutaSrc });
          continue;
        }
        if (!fs.existsSync(candidatAbs)) {
          rutesSrcInexistents.push({
            doc: docRel,
            ruta: rutaSrc,
          });
        }
      }
    }
  }

  // Recompte d'etiquetes skill-forge a `10_actes/` i a l'Escriptori
  const recompteSkillForgeActes = Object.fromEntries(
    ETQ_SKILL_FORGE.map((etq) => [etq, 0])
  );

  const docsActesIEscriptori = [
    ...llistaMarkdownSegur(path.join(wikiAbs, '10_actes')),
    ...llistaMarkdownSegur(path.join(wikiAbs, NOM_ESCRIPTORI)),
  ];

  for (const docAbs of docsActesIEscriptori) {
    const contingut = fs.readFileSync(docAbs, 'utf8');
    for (const etq of ETQ_SKILL_FORGE) {
      const pat = new RegExp(`\\[${etq}\\]`, 'g');
      const trobats = contingut.match(pat);
      if (trobats) {
        recompteSkillForgeActes[etq] += trobats.length;
      }
    }
  }

  return {
    totalDocsCanonics: docsCanonics.length,
    senseVincles,
    rutesSrcInexistents,
    rutesSrcForaDeLArrel,
    recompteSkillForgeActes,
  };
}

/**
 * Punt d'entrada CLI lleuger i de només lectura.
 * @param {string[]} argv
 * @param {{ stdout?: { write: Function }, stderr?: { write: Function }, executa?: typeof execFileSync }} [io]
 *   injectable a les proves: cap prova no crida git ni escriu a la consola real.
 */
export function executaCli(
  argv = process.argv.slice(2),
  { stdout = process.stdout, stderr = process.stderr, executa = execFileSync } = {}
) {
  let arrel = PROJECT_DIR;
  let fitxersArg = [];
  let diffRange = '';
  let formatJson = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--arrel' && argv[i + 1]) {
      arrel = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === '--files' && argv[i + 1]) {
      fitxersArg = argv[i + 1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
    } else if (arg === '--diff' && argv[i + 1]) {
      diffRange = argv[i + 1];
      i += 1;
    } else if (arg === '--json') {
      formatJson = true;
    }
  }

  const diffRebutjat = Boolean(diffRange) && !esRangGitSegur(diffRange);
  if (diffRebutjat) {
    stderr.write('[wiki-forja-lint] --diff rebutjat: cal un rang net de dos extrems (A..B o A...B), mai una opció.\n');
    process.exitCode = 2;
  }
  const desDeDiff = diffRange ? obteFitxersDesDeGitDiff(arrel, diffRange, executa) : [];
  const fitxersModificats = Array.from(new Set([...fitxersArg, ...desDeDiff]));

  const wikiSync = analitzaWikiSyncDiferencial({ arrel, fitxersModificats });
  const gaps = detectaGapsWiki({ arrel });

  const informe = {
    ok: !diffRebutjat,
    arrel,
    wikiSync,
    gaps,
  };

  if (formatJson) {
    stdout.write(`${JSON.stringify(informe, null, 2)}\n`);
  } else {
    stdout.write(
      `[wiki-forja-lint] Docs canònics inspeccionats: ${gaps.totalDocsCanonics} | ` +
        `Sense ## Vincles: ${gaps.senseVincles.length} | ` +
        `Rutes src/ inexistents: ${gaps.rutesSrcInexistents.length} | ` +
        `Rutes src/ fora de l'arrel: ${gaps.rutesSrcForaDeLArrel.length} | ` +
        `Suggeriments wiki-sync: ${wikiSync.suggerimentsSync.length}\n`
    );
  }

  return informe;
}

const rutaActual = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(rutaActual)) {
  executaCli();
}
