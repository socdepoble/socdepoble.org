#!/usr/bin/env node
/**
 * tractor-persistencia.mjs — Porta mecànica de la capa de persistència.
 *
 * Imposa els quatre contractes que fan segura la convivència
 * localStorage (síncron) + IndexedDB (asíncron):
 *
 *   L1  getVal/setVal són SÍNCRONS per contracte. Cap `await` damunt.
 *   L2  Ningú toca localStorage fora de src/config/storage.js.
 *   L3  Els id de missatge són UUID, mai Date.now().
 *   L4  La UI es pinta ABANS de la xarxa (setRawData precedix l'await de transport).
 *
 * Ús: node tractor-persistencia.mjs --arrel=.
 * Eixida: 0 = pas, 1 = bloqueig.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const ARREL = path.resolve(
  (args.find((a) => a.startsWith('--arrel=')) || '--arrel=.').slice(8)
);
const SRC = path.join(ARREL, 'src');
const CAPA = path.join('src', 'config', 'storage.js');

const infraccions = [];
const registra = (llei, fitxer, linia, missatge) =>
  infraccions.push({ llei, fitxer, linia, missatge });

function camina(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) camina(p, out);
    else if (/\.(js|jsx|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

const PUBLIC = path.join(ARREL, 'public');
const fitxers = [...camina(SRC), ...camina(PUBLIC)];
if (fitxers.length === 0) {
  console.error(`❌ [PERSISTÈNCIA] Zero fonts sota ${SRC}. Arrel equivocada.`);
  process.exit(1);
}

for (const abs of fitxers) {
  const rel = path.relative(ARREL, abs);
  const text = fs.readFileSync(abs, 'utf8');
  const linies = text.split('\n');

  linies.forEach((l, i) => {
    const n = i + 1;
    const net = l.replace(/\/\/.*$/, '');

    // L1 — await damunt d'una funció síncrona per contracte
    if (/await\s+(getVal|setVal|delVal)\s*\(/.test(net)) {
      registra('L1', rel, n,
        "`await` damunt de getVal/setVal. Són síncrones per contracte: l'await amaga la migració a promesa i falsifica la revisió.");
    }

    // L2 — accés cru a localStorage fora de la capa
    if (/(localStorage|sessionStorage)\s*\./.test(net) && rel !== CAPA) {
      registra('L2', rel, n,
        'Accés directe a localStorage o sessionStorage fora de src/config/storage.js. Cap migració a IndexedDB podrà atrapar esta crida.');
    }

    // L3 — id de missatge derivat del rellotge
    if (/(messageId|message_id)\s*[:=]\s*`?\$?\{?\s*(Date\.now\(\)|nowTs)/.test(net)) {
      registra('L3', rel, n,
        'Identificador de missatge derivat de Date.now(). Dos missatges al mateix mil·lisegon col·lidixen i un es perd en silenci.');
    }
  });

  // L4 — ordre pintada/xarxa dins de sendChatMessage
  const m = text.match(/const\s+sendChatMessage\s*=\s*async[\s\S]*?\n\s{4}\};/);
  if (m) {
    const cos = m[0];
    const iXarxa = cos.search(/await\s+appendChatMessages\s*\(/);
    const iPintada = cos.search(/setRawData\s*\(/);
    if (iXarxa !== -1 && iPintada !== -1 && iXarxa < iPintada) {
      const n = text.slice(0, m.index + iXarxa).split('\n').length;
      registra('L4', rel, n,
        'La xarxa (appendChatMessages) precedix la pintada (setRawData). Si el transport llança, el missatge no arriba mai a la pantalla: Offline-First trencat.');
    }
  }
}

const perLlei = (ll) => infraccions.filter((i) => i.llei === ll);
const NOMS = {
  L1: 'getVal/setVal síncrones',
  L2: 'localStorage encapsulat',
  L3: 'UUID de missatge',
  L4: 'pintada abans que xarxa'
};

console.log('\n🪨 TRACTOR DE PERSISTÈNCIA\n');
for (const ll of ['L1', 'L2', 'L3', 'L4']) {
  const v = perLlei(ll);
  console.log(`${ll} · ${NOMS[ll].padEnd(30)} ${v.length === 0 ? '✅ pas' : `❌ ${v.length} infracció(ns)`}`);
  for (const i of v) console.log(`      ${i.fitxer}:${i.linia}\n      └─ ${i.missatge}`);
}

console.log(`\n${fitxers.length} fonts revisades · ${infraccions.length} infraccions\n`);
process.exit(infraccions.length > 0 ? 1 : 0);
