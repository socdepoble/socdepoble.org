// Prova de laboratori del pegat C2 (T10 Codex al Mapa, T12 fonts de vigilància).
// Pla: _wiki_de_poble/04_escriptori/260930_0040_pla_implementacio_consola.md (part B).
// Només llig el repositori; tot el que escriu va a os.tmpdir(). Si el
// laboratori s'arxiva o el pegat ja s'ha aplicat, cada prova fa skip i no
// queda roja.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.join(ARREL, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude');
const PEGAT = path.join(LAB, 'pegats/t10-t12-mapa.mjs');
const FONTS_LAB = path.join(LAB, 'nous/tooling/brain/fonts-vigilancia.mjs');
const FONTS_REPO = path.join(ARREL, 'tooling/brain/fonts-vigilancia.mjs');
const RUTES = ['tooling/brain/fonts-vigilancia.mjs', 'tooling/brain/mapa-consola.mjs', 'tests/fonts-vigilancia.test.mjs', 'tests/mapa-consola.test.mjs'];
const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');

/** El pegat ja és al repo: el fitxer que havia de crear hi és i és idèntic al del laboratori. */
function jaAplicat() {
  return fs.existsSync(FONTS_REPO) && fs.existsSync(FONTS_LAB)
    && fs.readFileSync(FONTS_REPO).equals(fs.readFileSync(FONTS_LAB));
}

/** Prova que fa skip quan el laboratori ja no hi és (arxivat) o el pegat ja s'ha aplicat. */
function provaLab(nom, cos) {
  test(nom, async (t) => {
    if (!fs.existsSync(PEGAT)) { t.skip('laboratori 260930_0040_governanca_claude absent'); return; }
    if (jaAplicat()) { t.skip('pegat ja aplicat: tooling/brain/fonts-vigilancia.mjs és idèntic al del laboratori'); return; }
    await cos(t);
  });
}
const operacions = async () => (await import(pathToFileURL(PEGAT).href)).operacions;
const fontsLab = async () => import(pathToFileURL(FONTS_LAB).href);
const importacions = (codi) => [...codi.matchAll(/^\s*import\s[^'"]*?['"]([^'"]+)['"]/gm), ...codi.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]);

provaLab('operacions: forma, sha de partida i fitxers nous presents', async (t) => {
  const ops = await operacions();
  assert.deepEqual(ops.map((op) => op.ruta), RUTES);
  for (const op of ops) {
    assert.ok(typeof op.descripcio === 'string' && op.descripcio.length > 20, `${op.ruta}: descripció`);
    assert.ok(!path.isAbsolute(op.ruta) && !op.ruta.split('/').includes('..'), `${op.ruta}: ruta relativa i dins del repo`);
    assert.equal(['crea', 'substituix', 'aplica'].filter((k) => k in op).length, 1, `${op.ruta}: una sola acció`);
    const actual = path.join(ARREL, op.ruta);
    if (op.crea) {
      assert.equal(op.crea, `nous/${op.ruta}`);
      assert.ok(fs.existsSync(path.join(LAB, op.crea)), `${op.crea} no és al laboratori`);
      assert.ok(!fs.existsSync(actual), `${op.ruta} ja existix: el pegat l’havia de crear`);
    } else {
      assert.equal(op.substituix, `nous/${op.ruta}`);
      const nou = fs.readFileSync(path.join(LAB, op.substituix));
      const vell = fs.readFileSync(actual);
      const shaActual = sha256(vell);
      t.diagnostic(`${op.ruta} · sha actual ${shaActual}`);
      assert.equal(op.base, shaActual, `${op.ruta}: el fitxer ha canviat des del pegat (sha actual ${shaActual})`);
      assert.notEqual(sha256(nou), shaActual, `${op.ruta}: la substitució no canvia res`);
    }
  }
});

provaLab('fitxers nous: sintaxi vàlida, cap import relatiu on no toca i la closca conserva la seua API', async () => {
  for (const ruta of RUTES) execFileSync(process.execPath, ['--check', path.join(LAB, 'nous', ruta)], { stdio: 'pipe' });
  const fonts = fs.readFileSync(FONTS_LAB, 'utf8');
  assert.deepEqual(importacions(fonts).filter((s) => !s.startsWith('node:')), [], 'fonts-vigilancia.mjs només pot importar node:*');
  assert.ok(!/\.sdp-reflex/.test(fonts.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), 'fonts-vigilancia.mjs no ha de nomenar .sdp-reflex fora dels comentaris');
  assert.deepEqual(importacions(fs.readFileSync(PEGAT, 'utf8')), [], 'el pegat es carrega sense imports');

  const vell = fs.readFileSync(path.join(ARREL, 'tooling/brain/mapa-consola.mjs'), 'utf8');
  const nou = fs.readFileSync(path.join(LAB, 'nous/tooling/brain/mapa-consola.mjs'), 'utf8');
  const exportacions = (codi) => [...codi.matchAll(/^export\s+(?:async\s+)?(?:function|const)\s+(\w+)/gm)].map((m) => m[1]).sort();
  assert.deepEqual(exportacions(nou), exportacions(vell), 'la closca exporta el mateix que abans');
  const noves = importacions(nou).filter((s) => !importacions(vell).includes(s));
  assert.deepEqual(noves.sort(), ['./context-local.mjs', './fonts-vigilancia.mjs']);
  // Tot el cos de l'antiga closca continua present, fora de la capçalera i del retorn de recullFonts.
  const funcions = ['git', 'seccio', 'llancadors', 'frontissa', 'recullMapa', 'main'];
  for (const f of funcions) {
    const cos = (codi) => new RegExp(`^(?:export )?function ${f}\\([\\s\\S]*?^}`, 'm').exec(codi)?.[0];
    assert.equal(cos(nou), cos(vell), `function ${f} idèntica`);
  }
  // L'ampliació de la prova de la closca conserva, lletra per lletra, cada prova que ja hi havia.
  const provesVelles = fs.readFileSync(path.join(ARREL, 'tests/mapa-consola.test.mjs'), 'utf8');
  const provesNoves = fs.readFileSync(path.join(LAB, 'nous/tests/mapa-consola.test.mjs'), 'utf8');
  const blocs = [...provesVelles.matchAll(/^test\([\s\S]*?^\}\);$/gm)].map((m) => m[0]);
  assert.ok(blocs.length >= 5);
  for (const bloc of blocs) assert.ok(provesNoves.includes(bloc), `prova antiga alterada: ${bloc.split('\n')[0]}`);
});

/** Un Mas mínim amb les quatre fonts de vigilància. */
function masVigilancia() {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-vigilancia-'));
  const escriu = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
    fs.writeFileSync(path.join(arrel, rel), text);
  };
  const desk = '_wiki_de_poble/04_escriptori';
  escriu('.agents/runtime/turns/torn_x.json', JSON.stringify({ turn_id: 'torn_x', actor: 'claude', scope: 'code', state: 'planned',
    createdAt: '2026-09-30T00:00:00.000Z', expiresAt: '2026-10-01T00:00:00.000Z', receipts: { r: { file: `${desk}/260930_0040_a.md` } }, plan: {} }));
  escriu(`${desk}/00_index_escriptori.md`, '- [[260930_0040_a]]\n');
  escriu(`${desk}/260930_0040_a.md`, '# a\n');
  escriu(`${desk}/260930_0040_b.md`, '# b\n');
  const cos = '# L\n\n260930 | recaiguda | core-higiene-escriptori | safata';
  escriu('.agents/LEDGER.md', `${cos}\n\n<!-- HASH: ${sha256(cos)} -->`);
  escriu('.agents/ESTAT.md', '## ESTAT_ACTUAL · 260930_0040 · Claude · Relleu\n');
  return arrel;
}

provaLab('fonts-vigilancia des del laboratori: comportament contra una fixture', async () => {
  const { resumTorns, resumEscriptori, resumLedger, resumEstat } = await fontsLab();
  const arrel = masVigilancia();
  assert.deepEqual(resumTorns(arrel), [{ id: 'torn_x', actor: 'claude', scope: 'code', state: 'planned',
    createdAt: '2026-09-30T00:00:00.000Z', expiresAt: '2026-10-01T00:00:00.000Z', rebuts: 1, ambPla: true }]);
  assert.deepEqual(resumEscriptori(arrel), { documents: [
    { nom: '260930_0040_a.md', ancorat: true, ambRebut: true },
    { nom: '260930_0040_b.md', ancorat: false, ambRebut: false }
  ], safata: 0, limitSafata: 20 });
  assert.deepEqual(resumLedger(arrel), { valid: true, fossils: 0, malformades: 0,
    entrades: [{ data: '260930', tipus: 'recaiguda', skill: 'core-higiene-escriptori', resum: 'safata' }] });
  assert.equal(Date.parse(resumEstat(arrel).data), new Date(2026, 8, 30, 0, 40).getTime());
  for (const f of [resumTorns, resumEscriptori, resumLedger, resumEstat]) assert.equal(f(path.join(arrel, 'no-existix')), null);
});

provaLab('fonts-vigilancia des del laboratori: lectura del repo real, contrastada amb les primitives originals', async (t) => {
  const { resumTorns, resumEscriptori, resumLedger, resumEstat } = await fontsLab();
  const { anchored } = await import('../tooling/documental/core.mjs');
  const { ledgerStatus } = await import('../tooling/documental/ledger.mjs');

  // Torns: els mateixos que es poden parsejar, comptats de manera independent.
  const dirTorns = path.join(ARREL, '.agents/runtime/turns');
  const crus = fs.readdirSync(dirTorns).filter((n) => /^torn_.+\.json$/.test(n)).map((n) => {
    try { return JSON.parse(fs.readFileSync(path.join(dirTorns, n), 'utf8')); } catch { return null; }
  }).filter(Boolean);
  const torns = resumTorns(ARREL);
  assert.equal(torns.length, crus.length);
  const perId = new Map(crus.map((c) => [c.turn_id, c]));
  for (const tr of torns) {
    const cru = perId.get(tr.id);
    assert.ok(cru, `${tr.id} sense registre`);
    assert.equal(tr.rebuts, Object.keys(cru.receipts || {}).length, `${tr.id}: rebuts`);
    assert.equal(tr.ambPla, cru.plan != null, `${tr.id}: pla`);
    assert.equal(tr.state, cru.state, `${tr.id}: estat`);
  }
  const ara = Date.now();
  t.diagnostic(`torns ${torns.length} · tancats ${torns.filter((x) => x.state === 'closed').length} · caducats oberts ${torns.filter((x) => x.state !== 'closed' && Date.parse(x.expiresAt) <= ara).length}`);

  // Escriptori: àncora idèntica a anchored() de core.mjs i rebut comptat a part.
  const escriptori = resumEscriptori(ARREL);
  const index = fs.readFileSync(path.join(ARREL, '_wiki_de_poble/04_escriptori/00_index_escriptori.md'), 'utf8');
  const rebuts = new Set(crus.flatMap((c) => Object.values(c.receipts || {}).map((r) => r?.file)));
  const solts = fs.readdirSync(path.join(ARREL, '_wiki_de_poble/04_escriptori'), { withFileTypes: true })
    .filter((e) => e.isFile() && /\.md$/i.test(e.name) && !e.name.startsWith('.') && e.name !== '00_index_escriptori.md').map((e) => e.name).sort();
  assert.deepEqual(escriptori.documents.map((d) => d.nom), solts);
  for (const d of escriptori.documents) {
    const ruta = `_wiki_de_poble/04_escriptori/${d.nom}`;
    assert.equal(d.ancorat, anchored(index, ruta), `${d.nom}: àncora divergent de core.mjs`);
    assert.equal(d.ambRebut, rebuts.has(ruta), `${d.nom}: rebut`);
  }
  t.diagnostic(`escriptori ${escriptori.documents.length} documents · ancorats ${escriptori.documents.filter((d) => d.ancorat).length} · amb rebut ${escriptori.documents.filter((d) => d.ambRebut).length} · safata ${escriptori.safata}/${escriptori.limitSafata}`);

  // LEDGER: la validesa implica la de ledger.mjs i afig la de verify-ledger.mjs.
  const crusLedger = fs.readFileSync(path.join(ARREL, '.agents/LEDGER.md'), 'utf8');
  const ledger = resumLedger(ARREL);
  const estricte = /\n\n<!-- HASH: ([a-f0-9]{64}) -->$/.exec(crusLedger);
  assert.equal(ledger.valid, ledgerStatus(crusLedger).valid && Boolean(estricte) && sha256(crusLedger.slice(0, estricte.index)) === estricte[1]);
  assert.equal(ledger.fossils, Math.max((crusLedger.match(/<!-- HASH: [a-f0-9]{64} -->/g) || []).length - 1, 0));
  assert.ok(ledger.entrades.length > 0);
  const recaigudes = ledger.entrades.filter((e) => e.tipus === 'recaiguda').map((e) => `${e.data} ${e.skill}`);
  t.diagnostic(`ledger valid=${ledger.valid} · ${ledger.entrades.length} entrades · fòssils ${ledger.fossils} · malformades ${ledger.malformades} · recaigudes ${recaigudes.join(', ')}`);

  // ESTAT: bytes del disc; data ISO o null (una capçalera sense hora no es pot datar).
  const estat = resumEstat(ARREL);
  assert.equal(estat.bytes, fs.statSync(path.join(ARREL, '.agents/ESTAT.md')).size);
  assert.ok(estat.data === null || Number.isFinite(Date.parse(estat.data)));
  t.diagnostic(`estat data=${estat.data} · ${estat.bytes} B`);
});

/**
 * Munta el paquet en un mirall de os.tmpdir(): els fitxers nous com a còpies
 * i la resta del repo com a enllaços (el carregador ESM resol els enllaços al
 * camí real). Així les proves que entren amb el codi corren amb els imports
 * relatius del destí sense tocar el repositori.
 */
provaLab('paquet muntat en un mirall temporal: les proves que entren amb el codi passen', async (t) => {
  const mirall = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-mirall-mapa-'));
  const enllacos = [];
  const enllaca = (rel) => {
    const desti = path.join(mirall, rel);
    fs.mkdirSync(path.dirname(desti), { recursive: true });
    fs.symlinkSync(path.join(ARREL, rel), desti);
    enllacos.push(desti);
  };
  try {
    try {
      for (const rel of ['src', 'node_modules', 'tooling/lib', 'tooling/documental', 'tooling/wiki', 'tooling/brain/context-local.mjs']) enllaca(rel);
    } catch (error) {
      t.skip(`sense enllaços simbòlics: ${error.message}`);
      return;
    }
    for (const ruta of RUTES) {
      fs.mkdirSync(path.dirname(path.join(mirall, ruta)), { recursive: true });
      fs.copyFileSync(path.join(LAB, 'nous', ruta), path.join(mirall, ruta));
    }
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/fonts-vigilancia.test.mjs', 'tests/mapa-consola.test.mjs'],
      { cwd: mirall, env, encoding: 'utf8', timeout: 180000 });
    const eixida = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
    const compte = (clau) => Number(new RegExp(`^# ${clau} (\\d+)$`, 'm').exec(eixida)?.[1] ?? NaN);
    t.diagnostic(`mirall: pass ${compte('pass')} · fail ${compte('fail')} · skipped ${compte('skipped')}`);
    assert.equal(r.status, 0, eixida.split('\n').filter((l) => /not ok|Error|expected|actual|#/.test(l)).slice(0, 80).join('\n'));
    assert.equal(compte('fail'), 0);
    assert.ok(compte('pass') >= 20, `massa poques proves al mirall: ${compte('pass')}`);

    // La closca nova compila el Mapa del repo real (només lectura: git i la frontissa en --json).
    const verifica = path.join(mirall, 'verifica-mapa-real.mjs');
    fs.writeFileSync(verifica, [
      "import { recullMapa } from './tooling/brain/mapa-consola.mjs';",
      "import { normalitzaMapa } from './src/sections/consola/mapa/mapaContent.js';",
      'const mapa = recullMapa(process.argv[2]);',
      'normalitzaMapa(mapa);',
      'const te = (de, a) => mapa.arestes.some((x) => x.de === de && x.a === a && x.tipus === "carrega");',
      'console.log(JSON.stringify({',
      '  codex: mapa.nodes.some((n) => n.id === "agent:codex"),',
      '  agentsMd: te("agent:codex", "document:AGENTS.md"),',
      '  bootstrap: te("script:tooling/brain/context-local.mjs", "document:.agents/BOOTSTRAP.md"),',
      '  absentCodex: mapa.avisos.some((a) => a.node === "document:.codex/hooks.json" && a.codi === "font-absent"),',
      '  nodes: mapa.nodes.length, arestes: mapa.arestes.length, avisos: mapa.avisos.length',
      '}));', ''
    ].join('\n'));
    const real = spawnSync(process.execPath, [verifica, ARREL], { cwd: mirall, env, encoding: 'utf8', timeout: 120000 });
    assert.equal(real.status, 0, real.stderr);
    const resum = JSON.parse(real.stdout.trim().split('\n').pop());
    t.diagnostic(`mapa real: ${resum.nodes} nodes · ${resum.arestes} arestes · ${resum.avisos} avisos`);
    assert.deepEqual([resum.codex, resum.agentsMd, resum.bootstrap, resum.absentCodex], [true, true, true, false]);
  } finally {
    for (const e of enllacos) fs.unlinkSync(e);
    fs.rmSync(mirall, { recursive: true, force: true });
  }
});

provaLab('lint: els fitxers nous i esta prova passen ESLint amb la configuració del repo, sense avisos', async (t) => {
  let ESLint;
  try { ({ ESLint } = await import('eslint')); } catch { t.skip('ESLint no instal·lat'); return; }
  const eslint = new ESLint({ cwd: ARREL });
  const problemes = [];
  const recull = (resultats) => {
    for (const r of resultats) for (const m of r.messages) problemes.push(`${path.relative(ARREL, r.filePath)}:${m.line} ${m.ruleId ?? ''} ${m.message}`);
  };
  for (const ruta of RUTES) {
    recull(await eslint.lintText(fs.readFileSync(path.join(LAB, 'nous', ruta), 'utf8'), { filePath: path.join(ARREL, ruta) }));
  }
  recull(await eslint.lintFiles([fileURLToPath(import.meta.url), PEGAT]));
  assert.deepEqual(problemes, []);
});
