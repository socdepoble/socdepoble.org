#!/usr/bin/env node
/**
 * llevar-catch-orfes.mjs — converteix `catch (x)` orfe en `catch` sense binding.
 *
 * Només toca les línies que ESLint marca com a `no-unused-vars` i que
 * l'AST confirma que són el paràmetre d'un CatchClause. Res més.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as espree from 'espree';

const ESCRIU = process.argv.includes('--escriu');

function informe() {
  try {
    return JSON.parse(execFileSync('npx', ['eslint', 'src', 'tooling', 'scripts', 'tests', '-f', 'json'], {
      encoding: 'utf8', maxBuffer: 256 * 1024 * 1024
    }));
  } catch (err) {
    if (err.stdout) return JSON.parse(err.stdout);
    throw err;
  }
}

function recorre(node, visita) {
  if (!node || typeof node.type !== 'string') return;
  visita(node);
  for (const clau of Object.keys(node)) {
    if (clau === 'parent') continue;
    const fill = node[clau];
    if (Array.isArray(fill)) fill.forEach((n) => recorre(n, visita));
    else if (fill && typeof fill.type === 'string') recorre(fill, visita);
  }
}

let tocats = 0;
let fitxers = 0;

for (const fitxer of informe()) {
  const marcats = new Set(
    fitxer.messages
      .filter((m) => m.ruleId === 'no-unused-vars')
      .map((m) => `${m.line}:${m.column}`)
  );
  if (!marcats.size) continue;

  const codi = fs.readFileSync(fitxer.filePath, 'utf8');
  const net = codi.startsWith('#!') ? `//${codi.slice(2)}` : codi;
  let arbre;
  try {
    arbre = espree.parse(net, {
      ecmaVersion: 2022, sourceType: 'module', loc: true, range: true, ecmaFeatures: { jsx: true }
    });
  } catch (err) {
    console.log(`  saltat (no analitzable): ${fitxer.filePath} — ${err.message}`);
    continue;
  }

  const edicions = [];
  recorre(arbre, (node) => {
    if (node.type !== 'CatchClause' || !node.param) return;
    const p = node.param;
    if (p.type !== 'Identifier') return; // no toquem destructuracions
    if (!marcats.has(`${p.loc.start.line}:${p.loc.start.column + 1}`)) return;
    // Del final de `catch` fins al `{` del cos: ho substituïm per `catch `.
    const iniCos = node.body.range[0];
    edicions.push({ ini: node.range[0], fi: iniCos, text: 'catch ', linia: p.loc.start.line, nom: p.name });
  });

  if (!edicions.length) continue;
  fitxers += 1;
  tocats += edicions.length;
  const rel = fitxer.filePath.split('socdepoble.org/')[1] || fitxer.filePath;
  for (const e of edicions) console.log(`  ${rel}:${e.linia}  catch (${e.nom}) → catch`);

  if (!ESCRIU) continue;
  let nou = codi;
  for (const e of edicions.sort((a, b) => b.ini - a.ini)) {
    nou = nou.slice(0, e.ini) + e.text + nou.slice(e.fi);
  }
  fs.writeFileSync(fitxer.filePath, nou, 'utf8');
}

console.log(`\n${ESCRIU ? 'Aplicat' : 'Assaig'}: ${tocats} clàusules catch en ${fitxers} fitxers.`);
if (!ESCRIU) console.log('Cap fitxer tocat. Repeteix amb --escriu.');
