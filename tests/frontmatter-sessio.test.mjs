/**
 * Porta de frontmatter en mode lectura, per a agents engabiats (el hook local
 * no admet `node tooling/wiki/tractor-frontmatter.mjs`). Executa el tractor
 * real amb --json i falla si algun .md modificat (a l'arbre o a l'índex) té
 * deute propi: és la mateixa zero tolerància que aplica el tractor als
 * fitxers tocats (tractor-frontmatter.mjs:448-455), sense cap filtre de
 * carpeta que l'amague. No escriu res.
 *
 * Ús:  node --test tests/frontmatter-sessio.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Els .md de `git diff --name-only HEAD` més els de `git diff --cached --name-only`. */
function modificats() {
  const noms = new Set();
  for (const args of [['diff', '--name-only', 'HEAD'], ['diff', '--cached', '--name-only']]) {
    const eixida = execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    for (const nom of eixida.split('\n')) if (nom.endsWith('.md')) noms.add(nom);
  }
  return [...noms];
}

/** Executa el tractor real una sola vegada: el JSON va a stdout i la zero tolerància a stderr. */
function tractor() {
  const r = spawnSync(process.execPath, ['tooling/wiki/tractor-frontmatter.mjs', '--json'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  // Amb deute el tractor ix amb 1, però el JSON ja és a stdout.
  return { stdout: r.stdout, stderr: r.stderr };
}

const EIXIDA = tractor();
const OBJECTIUS = new Set(modificats());

function trobades() {
  const dades = JSON.parse(EIXIDA.stdout.slice(EIXIDA.stdout.indexOf('{')));
  const llista = [];
  for (const [llei, items] of Object.entries(dades.fallades)) {
    for (const item of items) {
      if (OBJECTIUS.has(item.n)) llista.push({ n: item.n, text: `${item.n} · ${llei} · ${item.clau ?? ''} ${item.detall ?? item.valor ?? ''}`.trim() });
    }
  }
  return llista;
}

test('el cens de modificats és el mateix que vigila la zero tolerància del tractor', () => {
  // tractor-frontmatter.mjs:521-533 escriu una línia per fallada de cada fitxer modificat.
  const delTractor = new Set([...EIXIDA.stderr.matchAll(/El fitxer modificat (.+?) té deute actiu/g)].map((m) => m[1]));
  const nostres = new Set(trobades().map((t) => t.n));
  assert.deepEqual([...nostres].sort(), [...delTractor].sort(),
    'el test ha de vore els mateixos fitxers amb deute que la porta real; un filtre propi seria un verd fals');
});

test('frontmatter dels documents de la Wiki modificats (lectura)', () => {
  const { compte, max } = JSON.parse(EIXIDA.stdout.slice(EIXIDA.stdout.indexOf('{')));
  // Sense accés directe al tractor, esta línia és l'única manera de vore si el deute global puja.
  const recompte = Object.keys(compte).map((llei) => `${llei} ${compte[llei]}/${max[llei] ?? 0}`).join(' · ');
  const llista = trobades().map((t) => t.text);
  process.stdout.write(`deute global (compte/sostre): ${recompte}\n`);
  process.stdout.write(`${OBJECTIUS.size} documents modificats revisats\n${llista.join('\n') || '✅ Cap deute als documents modificats'}\n`);
  assert.equal(llista.length, 0, `${llista.length} fallades de frontmatter`);
});
