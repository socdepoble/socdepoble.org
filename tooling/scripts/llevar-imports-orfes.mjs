#!/usr/bin/env node
/**
 * llevar-imports-orfes.mjs — Segador d'importacions òrfenes.
 *
 * Pren l'informe JSON d'ESLint, en trau els `no-unused-vars` que són
 * especificadors d'`import`, i reescriu la declaració amb els que sobreviuen.
 * No toca res més: ni variables locals, ni arguments, ni `catch`.
 *
 * Reconstruïm la sentència sencera des de l'AST en lloc d'entretallar comes:
 * entretallar text és el que trenca els imports multilínia.
 *
 * Ús:
 *   node tooling/scripts/llevar-imports-orfes.mjs                 # assaig (no escriu)
 *   node tooling/scripts/llevar-imports-orfes.mjs --escriu        # aplica
 *   node tooling/scripts/llevar-imports-orfes.mjs --escriu --nomes=src
 *
 * Dependències: cap de nova. `espree` ja ve amb ESLint.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as espree from 'espree';

const ARGV = process.argv.slice(2);
const ESCRIU = ARGV.includes('--escriu');
const NOMES = (ARGV.find((a) => a.startsWith('--nomes=')) || '').slice(8);
const ARREL = process.cwd();
const OBJECTIUS = ['src', 'tooling', 'scripts', 'tests'];

function informeEslint() {
  const args = ['eslint', ...OBJECTIUS, '-f', 'json'];
  try {
    return JSON.parse(execFileSync('npx', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }));
  } catch (err) {
    // ESLint ix amb codi 1 quan hi ha avisos amb --max-warnings; la eixida val igual.
    if (err.stdout) return JSON.parse(err.stdout);
    throw err;
  }
}

function analitza(codi) {
  // El shebang no és JavaScript. El bescanviem per un comentari de la mateixa
  // llargària perquè els rangs de l'AST continuen quadrant amb el text real.
  const net = codi.startsWith('#!') ? `//${codi.slice(2)}` : codi;
  return espree.parse(net, {
    ecmaVersion: 2022,
    sourceType: 'module',
    loc: true,
    range: true,
    ecmaFeatures: { jsx: true }
  });
}

// La font d'un import es copia tal qual (cometes incloses) del text original.
function reescriuImport(node, codi, vius) {
  const font = codi.slice(node.source.range[0], node.source.range[1]);
  const perDefecte = vius.find((s) => s.type === 'ImportDefaultSpecifier');
  const espai = vius.find((s) => s.type === 'ImportNamespaceSpecifier');
  const nomenats = vius.filter((s) => s.type === 'ImportSpecifier');

  const trossos = [];
  if (perDefecte) trossos.push(perDefecte.local.name);
  if (espai) trossos.push(`* as ${espai.local.name}`);
  if (nomenats.length) {
    trossos.push(`{ ${nomenats
      .map((s) => (s.imported.name === s.local.name ? s.local.name : `${s.imported.name} as ${s.local.name}`))
      .join(', ')} }`);
  }
  return `import ${trossos.join(', ')} from ${font};`;
}

const informe = informeEslint();
let fitxersTocats = 0;
let especificadorsLlevats = 0;
const sentenciesSenceres = [];
const saltats = [];

for (const fitxer of informe) {
  const rel = path.relative(ARREL, fitxer.filePath);
  if (NOMES && !rel.startsWith(NOMES)) continue;

  const orfes = fitxer.messages.filter(
    (m) => m.ruleId === 'no-unused-vars' && /is defined but never used/.test(m.message)
  );
  if (!orfes.length) continue;

  const codi = fs.readFileSync(fitxer.filePath, 'utf8');
  let arbre;
  try {
    arbre = analitza(codi);
  } catch (err) {
    saltats.push(`${rel} — no s'ha pogut analitzar: ${err.message}`);
    continue;
  }

  // Un especificador s'identifica per línia i columna exactes: així no confonem
  // dos noms iguals en àmbits diferents.
  const marcats = new Set(orfes.map((m) => `${m.line}:${m.column}`));
  const edicions = [];

  for (const node of arbre.body) {
    if (node.type !== 'ImportDeclaration' || node.specifiers.length === 0) continue;
    const morts = node.specifiers.filter((s) => marcats.has(`${s.local.loc.start.line}:${s.local.loc.start.column + 1}`));
    if (!morts.length) continue;

    const vius = node.specifiers.filter((s) => !morts.includes(s));
    especificadorsLlevats += morts.length;
    if (vius.length === 0) {
      sentenciesSenceres.push(`${rel}:${node.loc.start.line} → ${codi.slice(node.source.range[0], node.source.range[1])}`);
      edicions.push({ range: node.range, text: '', lineWipe: true });
    } else {
      edicions.push({ range: node.range, text: reescriuImport(node, codi, vius), lineWipe: false });
    }
  }

  if (!edicions.length) continue;
  fitxersTocats += 1;

  if (!ESCRIU) continue;

  let nou = codi;
  for (const e of edicions.sort((a, b) => b.range[0] - a.range[0])) {
    let [ini, fi] = e.range;
    if (e.lineWipe) {
      // Engolim el salt de línia només si la sentència ocupa la línia tota
      // sola. Hi ha fitxers amb sis imports en la mateixa línia: menjar-se
      // fins al salt se n'enduria els veïns vius.
      let inici = ini;
      while (inici > 0 && nou[inici - 1] !== '\n') inici -= 1;
      let final = fi;
      while (final < nou.length && nou[final] !== '\n') final += 1;
      if (nou.slice(inici, ini).trim() === '' && nou.slice(fi, final).trim() === '') {
        ini = inici;
        fi = Math.min(final + 1, nou.length);
      }
    }
    nou = nou.slice(0, ini) + e.text + nou.slice(fi);
  }
  fs.writeFileSync(fitxer.filePath, nou, 'utf8');
}

console.log(`${ESCRIU ? 'Aplicat' : 'Assaig'}: ${especificadorsLlevats} especificadors òrfens en ${fitxersTocats} fitxers.`);
if (sentenciesSenceres.length) {
  console.log(`\n${sentenciesSenceres.length} sentències queden buides i es lleven senceres.`);
  console.log('Revisa-les: si el mòdul tenia efectes col·laterals, cal deixar-hi un import nu.');
  for (const s of sentenciesSenceres) console.log(`  · ${s}`);
}
if (saltats.length) {
  console.log(`\n${saltats.length} fitxers saltats:`);
  for (const s of saltats) console.log(`  · ${s}`);
}
if (!ESCRIU) console.log('\nCap fitxer tocat. Torna a executar amb --escriu quan ho hages llegit.');
