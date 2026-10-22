import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { aturarGuarda, comprovarGuarda, obrirGuarda } from './guarda-nocturna.mjs';

let root;
const coincideix = (actual, esperat) => {
  for (const [clau, valor] of Object.entries(esperat)) assert.deepEqual(actual[clau], valor);
};
const ruta = () => path.join(root, '.agents/runtime/guarda_nocturna.json');
const mode = { onada: 'onada-actual', modeTancament: 'desconvocatoria', maxHores: 6 };
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-guarda-gauntlet-'));
  fs.mkdirSync(path.join(root, '.agents'));
  fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# Fixture de la guàrdia\n');
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });
function informesAmbCites() {
  const desk = path.join(root, '_wiki_de_poble/04_escriptori');
  fs.mkdirSync(desk, { recursive: true });
  fs.writeFileSync(path.join(desk, '260101_0000_auditoria_codex.md'), '# Història\nEs citava «100% en verd». No és el dictamen d’esta onada.');
  fs.writeFileSync(path.join(desk, '261022_0235_auditoria_claude.md'), '# Esborrany\nEl commit històric 32eabf12 apareix com a context.\nEstat: pendent.');
}

test('desconvocatòria ignora cites, commits i informes antics i no inventa consens', () => {
  const inicial = obrirGuarda(root, mode);
  informesAmbCites();
  const abans = fs.readFileSync(ruta(), 'utf8');
  const estat = comprovarGuarda(root);
  coincideix(estat, { activa: true, finalitzada: false, deuriaParar: false, motiu: null, hiHaAuditoriaAprovada: false, hiHaInformeClaudeTancat: false, detalls: [] });
  assert.deepEqual(estat.dadaGuarda, inicial);
  assert.equal(fs.readFileSync(ruta(), 'utf8'), abans);
});

test('el TTL tanca el mode explícit encara que no hi haja informes ni consens', () => {
  const dada = obrirGuarda(root, mode);
  fs.writeFileSync(ruta(), JSON.stringify({ ...dada, expira: new Date(Date.now() - 1000).toISOString() }));
  const estat = comprovarGuarda(root);
  assert.equal(estat.deuriaParar, true);
  assert.match(estat.motiu, /TTL expirat/);
  assert.equal(estat.hiHaAuditoriaAprovada, false);
  coincideix(JSON.parse(fs.readFileSync(ruta())), { activa: false, finalitzada: true, onada: mode.onada });
});

test('només la desconvocatòria expressa de la mateixa onada modifica el seu estat', () => {
  obrirGuarda(root, mode);
  const abans = fs.readFileSync(ruta(), 'utf8');
  assert.throws(() => aturarGuarda(root, 'Ordre antiga', { onada: 'altra-onada' }), /mateixa onada/);
  assert.throws(() => aturarGuarda(root), /mateixa onada/);
  assert.equal(fs.readFileSync(ruta(), 'utf8'), abans);
  const final = aturarGuarda(root, 'MarIA: informes rebuts, desconvocatòria expressa', { onada: mode.onada });
  coincideix(final, { activa: false, finalitzada: true, onada: mode.onada });
  coincideix(comprovarGuarda(root), { deuriaParar: true, motiu: final.motiu_finalitzacio, hiHaAuditoriaAprovada: false });
});

for (const maxHores of [0, -1, 7, Infinity, NaN]) test(`el mode explícit rebutja un TTL invàlid ${maxHores} abans de crear estat`, () => {
  assert.throws(() => obrirGuarda(root, { ...mode, maxHores }), /TTL/);
  assert.equal(fs.existsSync(ruta()), false);
});

test('el mode legacy continua sense camp nou, amb el seu reconeixement i aturada de sempre', () => {
  assert.equal(Object.hasOwn(obrirGuarda(root, { onada: 'legacy' }), 'modeTancament'), false);
  informesAmbCites();
  coincideix(comprovarGuarda(root), { deuriaParar: true, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: true });
  assert.equal(aturarGuarda(root, 'Manual legacy').motiu_finalitzacio, 'Manual legacy');
});

test('la CLI conserva el mode, avisa continuïtat amb exit 2 i requerix l’onada en aturar', () => {
  const programa = fileURLToPath(new URL('./guarda-nocturna.mjs', import.meta.url));
  const cli = (...args) => spawnSync(process.execPath, [programa, '--arrel', root, ...args], { encoding: 'utf8' });
  assert.equal(cli('--inici', '--onada', mode.onada, '--mode-tancament', 'desconvocatoria').status, 0);
  informesAmbCites();
  const vigila = cli();
  assert.equal(vigila.status, 2);
  assert.equal(JSON.parse(vigila.stdout).estat.deuriaParar, false);
  assert.equal(cli('--aturar', '--onada', 'antiga').status, 1);
  assert.equal(cli('--aturar', '--onada', mode.onada, '--motiu', 'Desconvocatòria de MarIA').status, 0);
  assert.equal(cli().status, 0);
});
