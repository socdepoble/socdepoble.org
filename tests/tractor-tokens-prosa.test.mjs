/* Revisió adversarial (261031) · Porta Tokens, T3 (font única). La prosa que la
   interfície pinta («amb --sdp-x: …» dins d'un espècimen) no declara cap token;
   un srcDoc, un dangerouslySetInnerHTML, un cssText o una plantilla sí que porten
   CSS de veres i hi continuen comptant. Arbres sintètics a mkdtemp, cap xarxa. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = path.join(ROOT, 'tooling/gates/tractor-tokens.mjs');

function t3(t, fitxers) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-tokens-prosa-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  for (const [ruta, text] of Object.entries({ 'src/css/tokens.css': ':root {\n  --sdp-fons: #fff;\n}\n', ...fitxers })) {
    fs.mkdirSync(path.dirname(path.join(arrel, ruta)), { recursive: true });
    fs.writeFileSync(path.join(arrel, ruta), text);
  }
  const run = spawnSync(process.execPath, [PORTA, '--root', arrel, '--nomes', 'T3'], { encoding: 'utf8' });
  return { ...run, sortida: run.stdout + run.stderr };
}

test('T3 · la prosa pintada no declara cap token; srcDoc, dangerouslySetInnerHTML, cssText i plantilles sí', (t) => {
  const prosa = t3(t, {
    'src/Especimen.jsx': 'export const E = () => <p descripcio="amb --sdp-mostra-a: blau">amb --sdp-mostra-b: verd</p>;'
  });
  assert.equal(prosa.status, 0, prosa.sortida);
  for (const [nom, codi] of [
    ['srcDoc', 'export const E = () => <iframe title="x" srcDoc="<style>:root{--sdp-mutant-a: red}</style>" />;'],
    ['dangerouslySetInnerHTML', 'export const E = () => <div dangerouslySetInnerHTML={{ __html: "<style>:root{--sdp-mutant-b: red}</style>" }} />;'],
    ['cssText', "export const pinta = (el) => { el.style.cssText = '--sdp-mutant-c: red'; };"],
    ['plantilla', 'export const css = `:root { --sdp-mutant-d: red; }`;']
  ]) {
    const run = t3(t, { 'src/Mutant.jsx': codi });
    assert.equal(run.status, 1, `${nom} ha de caure\n${run.sortida}`);
    assert.match(run.sortida, /--sdp-mutant-[a-d]/, nom);
  }
});
