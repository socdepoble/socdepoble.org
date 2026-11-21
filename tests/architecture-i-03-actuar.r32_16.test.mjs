import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CAPACITATS, CONTRACTE_BACKEND, CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { publicWikiFiles } from '../tooling/wiki/lib/publication-policy.mjs';
import { markdownProse } from '../tooling/lib/markdown-prose.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function taulesAmplesDe(markdown) {
  const prose = markdownProse(markdown, { preserveInlineCode: true });
  const lines = prose.split(/\r?\n/);
  const trobades = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*\|.*\|\s*$/.test(lines[i]) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const cols = lines[i].split('|').slice(1, -1).length;
      if (cols >= 3) trobades.push({ linia: i + 1, columnes: cols, capcalera: lines[i].trim() });
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) i += 1;
    } else {
      i += 1;
    }
  }
  return trobades;
}

function llistaMarkdownRecursiva(dirAbs) {
  const resultat = [];
  for (const entrada of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (entrada.name.startsWith('.')) continue;
    const cami = path.join(dirAbs, entrada.name);
    if (entrada.isDirectory()) resultat.push(...llistaMarkdownRecursiva(cami));
    else if (entrada.isFile() && entrada.name.endsWith('.md')) resultat.push(cami);
  }
  return resultat.sort();
}

test('R32.16 · ARCHITECTURE.md existeix, té to tècnic sobri i quadra exactament amb els comptadors del codi viu', () => {
  const ruta = path.join(ARREL, 'ARCHITECTURE.md');
  assert.equal(fs.existsSync(ruta), true, 'ARCHITECTURE.md ha d’existir a l’arrel');
  const text = fs.readFileSync(ruta, 'utf8');

  // Frontmatter v2.1 i Vincles
  assert.match(text, /^---\ntype: "document"\nstatus: "canonic"/);
  assert.match(text, /## Vincles[\s\S]*- \[\[00_index\]\]/);

  // Exactitud matemàtica amb src/data/contracte.js (Llei 0)
  assert.equal(CONTRACTE_NUCLI.length, 32);
  assert.ok(text.includes(`${CONTRACTE_NUCLI.length} mètodes`), 'ha de reflectir CONTRACTE_NUCLI.length');
  assert.ok(text.includes(`${Object.keys(CAPACITATS).length} capacitats`), 'ha de reflectir Object.keys(CAPACITATS).length');
  assert.ok(text.includes(`${CONTRACTE_BACKEND.length} mètodes totals`), 'ha de reflectir CONTRACTE_BACKEND.length');

  // Fronteres Sollutia Model B, Shadow DOM, RLS i Mode Sènior
  for (const peça of [
    'src/data/backendPort.js',
    'src/data/adaptadors/sollutia/',
    'adoptaSessioExterna',
    "credentials: 'omit'",
    'ESCRIPTURES_PERMESES',
    '3.145.728 B',
    '1.591.000 B',
    '10 MiB',
    'SECURITY DEFINER',
    'data-sdp-senior="true"',
    '56 × 56 px'
  ]) {
    assert.ok(text.includes(peça), `ARCHITECTURE.md ha de documentar ${peça}`);
  }

  // Zero taules amples (>= 3 col), zero termes prohibits per psicopatia i zero Llei 32
  assert.deepEqual(taulesAmplesDe(text), []);
  assert.doesNotMatch(text, /\bOffline[- ]First\b|\bLocal[- ]First\b|\biPad\s*A10\b|\biOS\s*15\b/i);
  assert.doesNotMatch(text, /sobir[àa]|soberan|sovereign|subiran/i);
});

test('R32.16 · P0-128 escombrat complet de _wiki_de_poble/03_actuar/: 0 taules de >= 3 columnes en tots els fitxers i públics', () => {
  const fitxers03Actuar = llistaMarkdownRecursiva(path.join(ARREL, '_wiki_de_poble/03_actuar'));
  assert.ok(fitxers03Actuar.length >= 14);
  const infraccions = [];
  for (const abs of fitxers03Actuar) {
    const rel = path.relative(ARREL, abs).split(path.sep).join('/');
    for (const t of taulesAmplesDe(fs.readFileSync(abs, 'utf8'))) {
      infraccions.push(`${rel}:${t.linia} (${t.columnes} col)`);
    }
  }
  assert.deepEqual(infraccions, []);

  const publics03 = publicWikiFiles(ARREL)
    .map((f) => path.relative(ARREL, f).split(path.sep).join('/'))
    .filter((rel) => rel.startsWith('_wiki_de_poble/03_actuar/'));
  assert.ok(publics03.includes('_wiki_de_poble/03_actuar/00_index_actuar.md'));
});
