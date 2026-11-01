/**
 * Consell L8 · taula de rutes SEO a l'arbre preparat del hook (B1 · 261101, D5).
 *
 * `wordpress-plugin/dist/seo-routes.json` és artefacte de build (dist/ a .gitignore): l'arbre
 * preparat del pre-commit no el porta mai. Dins del pre-commit (SDP_PRE_COMMIT=1) es prova el
 * productor en sec; fora, l'absència continua sent infracció.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comprovaTaulaRutes, TAULA_RUTES, PRODUCTOR_RUTES } from '../tooling/lib/taula-rutes-seo.mjs';

const CONSELL = fileURLToPath(new URL('../tooling/scripts/tractor-consell-core.mjs', import.meta.url));
const TAULA_BONA = JSON.stringify({ routes: { pobles: { index: true }, mur: { index: true }, login: { index: false } }, aliases: {} });

function arrel(t, fitxers = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-l8-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [rel, text] of Object.entries(fitxers)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

/** Doble d'spawnSync que recorda les crides i torna el resultat donat. */
function espia(resultat) {
  const crides = [];
  const executa = (cmd, args, opcions) => { crides.push({ cmd, args, opcions }); return resultat; };
  return { executa, crides };
}

test('present: no executa res ni diu res', (t) => {
  const root = arrel(t, { [TAULA_RUTES]: '{}' });
  const e = espia({ status: 0, stdout: TAULA_BONA });
  assert.deepEqual(comprovaTaulaRutes({ arrel: root, env: { SDP_PRE_COMMIT: '1' }, executa: e.executa }), { estat: 'present', missatge: '' });
  assert.equal(e.crides.length, 0);
});

test('absent fora del pre-commit: infracció amb l’ordre que la genera, sense executar el productor', (t) => {
  const root = arrel(t);
  for (const env of [{}, { SDP_PRE_COMMIT: 'true' }, { SDP_PRE_COMMIT: '0' }]) {
    const e = espia({ status: 0, stdout: TAULA_BONA });
    const r = comprovaTaulaRutes({ arrel: root, env, executa: e.executa });
    assert.equal(r.estat, 'falla', JSON.stringify(env));
    assert.match(r.missatge, /npm run build:seo/);
    assert.doesNotMatch(r.missatge, /sdp_resolve_request/);
    assert.equal(e.crides.length, 0);
  }
});

test('absent al pre-commit amb productor verd: avís amb el recompte; el productor va en sec sobre la mateixa arrel', (t) => {
  const root = arrel(t);
  const e = espia({ status: 0, stdout: `${TAULA_BONA}\n` });
  const r = comprovaTaulaRutes({ arrel: root, env: { SDP_PRE_COMMIT: '1', SDP_ARREL: '/una/altra/arrel' }, executa: e.executa });
  assert.equal(r.estat, 'avis');
  assert.match(r.missatge, /Absent a l'arbre preparat/);
  assert.match(r.missatge, /3 rutes \(2 indexables\)/);
  assert.equal(e.crides.length, 1);
  const [{ cmd, args, opcions }] = e.crides;
  assert.equal(cmd, process.execPath);
  assert.deepEqual(args, [path.join(root, PRODUCTOR_RUTES)]);
  assert.ok(!args.includes('--escriu'), 'mai escriu la taula');
  assert.equal(opcions.cwd, root);
  assert.equal(opcions.env.SDP_ARREL, root, 'el productor llig el mateix arbre que el Consell');
  assert.ok(opcions.timeout > 0);
});

test('absent al pre-commit amb productor roig, penjat o mut: infracció', (t) => {
  const root = arrel(t);
  const casos = [
    [{ status: 1, stdout: '', stderr: '\n❌ [SEO] No escric el manifest. Un manifest incomplet és pitjor que cap:\n\n   · seed trencada\n\n' }, /falla en sec: · seed trencada$/],
    [{ status: null, signal: 'SIGTERM', stdout: '', stderr: '', error: new Error('spawnSync node ETIMEDOUT') }, /falla en sec: spawnSync node ETIMEDOUT$/],
    [{ status: 0, stdout: 'no és JSON', stderr: '' }, /no torna cap taula amb rutes/],
    [{ status: 0, stdout: JSON.stringify({ routes: {} }), stderr: '' }, /no torna cap taula amb rutes/],
  ];
  for (const [resultat, patro] of casos) {
    const r = comprovaTaulaRutes({ arrel: root, env: { SDP_PRE_COMMIT: '1' }, executa: espia(resultat).executa });
    assert.equal(r.estat, 'falla');
    assert.match(r.missatge, patro);
  }
});

/* Amb processos reals: un productor de prova a la fixture, que exigix rebre la seua arrel. */
function ambProductor(t, cos, fitxers = {}) {
  const root = arrel(t, fitxers);
  const abs = path.join(root, PRODUCTOR_RUTES);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `if (process.env.SDP_ARREL !== ${JSON.stringify(root)}) { console.error('arrel equivocada'); process.exit(4); }\n${cos}\n`);
  return root;
}

test('procés real: productor verd → avís; roig → última línia; penjat → temps esgotat', (t) => {
  const bo = ambProductor(t, `process.stdout.write(${JSON.stringify(TAULA_BONA)});`);
  assert.equal(comprovaTaulaRutes({ arrel: bo, env: { ...process.env, SDP_PRE_COMMIT: '1' } }).estat, 'avis');
  assert.ok(!fs.existsSync(path.join(bo, TAULA_RUTES)), 'en sec: no ha escrit la taula');

  const roig = ambProductor(t, `console.error('\\n❌ [SEO] No escric el manifest:\\n   · seed trencada'); process.exit(1);`);
  const r = comprovaTaulaRutes({ arrel: roig, env: { ...process.env, SDP_PRE_COMMIT: '1' } });
  assert.equal(r.estat, 'falla');
  assert.match(r.missatge, /seed trencada$/);

  const penjat = ambProductor(t, 'setInterval(() => {}, 1000);');
  const p = comprovaTaulaRutes({ arrel: penjat, env: { ...process.env, SDP_PRE_COMMIT: '1' }, tempsMs: 500 });
  assert.equal(p.estat, 'falla');
  assert.match(p.missatge, /ETIMEDOUT/);
});

test('Consell sencer (CLI): L8 verd amb avís al pre-commit, infracció fora i amb el productor roig', (t) => {
  const php = { 'wordpress-plugin/socdepoble.php': "<?php\ndefined('ABSPATH') || exit;\n" };
  const consell = (root, env) => {
    const r = spawnSync(process.execPath, [CONSELL, '--root', root], { encoding: 'utf8', env: { PATH: process.env.PATH, ...env }, timeout: 60_000 });
    return { status: r.status, eixida: `${r.stdout}${r.stderr}` };
  };
  const bo = ambProductor(t, `process.stdout.write(${JSON.stringify(TAULA_BONA)});`, php);
  const dins = consell(bo, { SDP_PRE_COMMIT: '1' });
  assert.equal(dins.status, 0, dins.eixida);
  assert.match(dins.eixida, /✅ L8 · Contracte PHP/);
  assert.match(dins.eixida, /\[L8 · Contracte PHP\] wordpress-plugin\/dist\/seo-routes\.json — Absent a l'arbre preparat/);

  const fora = consell(bo, {});
  assert.equal(fora.status, 1, fora.eixida);
  assert.match(fora.eixida, /L8 · Contracte PHP {2}\(1\)\n\s+wordpress-plugin\/dist\/seo-routes\.json\n\s+↳ Taula de rutes absent: executa npm run build:seo/);
  assert.doesNotMatch(fora.eixida, /✅ L8/, 'una infracció de L8 no pot anar acompanyada del verd de L8');

  const roig = ambProductor(t, `console.error('   · seed trencada'); process.exit(1);`, php);
  const caigut = consell(roig, { SDP_PRE_COMMIT: '1' });
  assert.equal(caigut.status, 1, caigut.eixida);
  assert.match(caigut.eixida, /↳ El productor de la taula de rutes falla en sec: · seed trencada/);
  assert.doesNotMatch(caigut.eixida, /✅ L8/, 'una infracció de L8 no pot anar acompanyada del verd de L8');
});
