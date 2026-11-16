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
/* L'mtime es fixa explícitament: alguns sistemes de fitxers daten amb un
   rellotge gruixut que pot quedar uns mil·lisegons darrere de Date.now(). */
function escriuEscriptori(nom, contingut, mtimeMs = Date.now() + 1000) {
  const desk = path.join(root, '_wiki_de_poble/04_escriptori');
  fs.mkdirSync(desk, { recursive: true });
  const fitxer = path.join(desk, nom);
  fs.writeFileSync(fitxer, contingut);
  fs.utimesSync(fitxer, new Date(mtimeMs), new Date(mtimeMs));
  return fitxer;
}
const AUDITORIA = '260101_0000_auditoria_codex.md';
const INFORME = '261022_0235_auditoria_claude.md';
function informesAmbCites(mtimeMs) {
  escriuEscriptori(AUDITORIA, '# Història\nEs citava «100% en verd». No és el dictamen d’esta onada.', mtimeMs);
  escriuEscriptori(INFORME, '# Esborrany\nEl «Commit consolidat» històric apareix com a context.\nEstat: pendent.', mtimeMs);
}

test('desconvocatòria ignora cites, commits i informes antics i no inventa consens', () => {
  const inicial = obrirGuarda(root, mode);
  informesAmbCites();
  const abans = fs.readFileSync(ruta(), 'utf8');
  const estat = comprovarGuarda(root);
  coincideix(estat, { activa: true, finalitzada: false, deuriaParar: false, motiu: null, hiHaAuditoriaAprovada: false, hiHaInformeClaudeTancat: false, detalls: [], evidenciesDescartades: [] });
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

/* R32 · troballa del Node 0 (tanda R31): amb fitxer d'estat, l'evidència ha de
   ser posterior a l'inici de la guàrdia (mtime > inici) i, si no es pot
   acreditar, la porta falla tancada. Els SHA fixos d'octubre ja no són rebut. */
const iniciDe = () => Date.parse(JSON.parse(fs.readFileSync(ruta(), 'utf8')).inici);
const HORA = 60 * 60 * 1000;

test('R32 · positiu: amb estat legacy, evidències posteriors a l’inici tanquen la guàrdia', () => {
  obrirGuarda(root, { onada: 'legacy-r32' });
  informesAmbCites(iniciDe() + 1000);
  const estat = comprovarGuarda(root);
  coincideix(estat, {
    deuriaParar: true, finalitzada: true, activa: false, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: true,
    detalls: [`Auditoria aprovada trobada: ${AUDITORIA}`, `Informe Claude tancat trobat: ${INFORME}`],
    evidenciesDescartades: [],
  });
  assert.match(estat.motiu, /100% verd/);
  coincideix(JSON.parse(fs.readFileSync(ruta(), 'utf8')), { activa: false, finalitzada: true, onada: 'legacy-r32' });
});

test('R32 · negatiu: un artefacte anterior a l’inici no compta i l’estat no canvia', () => {
  obrirGuarda(root, { onada: 'legacy-r32' });
  const inici = iniciDe();
  informesAmbCites(inici - HORA);
  const abans = fs.readFileSync(ruta(), 'utf8');
  const estat = comprovarGuarda(root);
  coincideix(estat, { deuriaParar: false, finalitzada: false, activa: true, motiu: null, hiHaAuditoriaAprovada: false, hiHaInformeClaudeTancat: false, detalls: [] });
  assert.equal(estat.evidenciesDescartades.length, 2);
  for (const nom of [AUDITORIA, INFORME]) {
    assert.ok(estat.evidenciesDescartades.some((d) => d.startsWith(`${nom}: modificada abans de l'inici`)), nom);
  }
  assert.equal(fs.readFileSync(ruta(), 'utf8'), abans);
});

test('R32 · negatiu: una sola evidència antiga (1 ms abans de l’inici) impedix el tancament per consens', () => {
  obrirGuarda(root, { onada: 'legacy-r32' });
  const inici = iniciDe();
  escriuEscriptori(AUDITORIA, 'Dictamen: 100% en verd.', inici + 1000);
  escriuEscriptori(INFORME, 'Commit consolidat de l’onada.', inici - 1);
  const estat = comprovarGuarda(root);
  coincideix(estat, { deuriaParar: false, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: false, detalls: [`Auditoria aprovada trobada: ${AUDITORIA}`] });
  assert.equal(estat.evidenciesDescartades.length, 1);
  assert.ok(estat.evidenciesDescartades[0].startsWith(`${INFORME}: `));
});

test('R32 · un enllaç simbòlic nou cap a un informe antic no rejoveneix l’evidència', () => {
  obrirGuarda(root, { onada: 'legacy-r32' });
  const inici = iniciDe();
  escriuEscriptori(AUDITORIA, 'Dictamen: 100% en verd.', inici + 1000);
  const antic = path.join(root, 'informe_antic.md');
  fs.writeFileSync(antic, 'Commit consolidat de l’onada.');
  fs.utimesSync(antic, new Date(inici - HORA), new Date(inici - HORA));
  fs.symlinkSync(antic, path.join(root, '_wiki_de_poble/04_escriptori', INFORME));
  fs.mkdirSync(path.join(root, '_wiki_de_poble/04_escriptori/261116_0000_informe_claude.md'));
  const estat = comprovarGuarda(root);
  coincideix(estat, { deuriaParar: false, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: false });
  assert.deepEqual(estat.evidenciesDescartades.map((d) => d.split(': ')[0]), [INFORME]);
});

/* En un procés fill amb termini: un open() síncron bloquejat pararia el bucle
   d'esdeveniments i el timeout de node:test no podria interrompre'l. */
test('R32 · un FIFO amb nom d’informe no penja la consulta ni compta com a evidència', {
  skip: process.platform === 'win32' && 'sense mkfifo',
}, () => {
  obrirGuarda(root, { onada: 'legacy-r32' });
  escriuEscriptori(AUDITORIA, 'Dictamen: 100% en verd.', iniciDe() + 1000);
  const fifo = path.join(root, '_wiki_de_poble/04_escriptori', INFORME);
  assert.equal(spawnSync('mkfifo', [fifo]).status, 0);
  const programa = fileURLToPath(new URL('./guarda-nocturna.mjs', import.meta.url));
  const vigila = spawnSync(process.execPath, [programa, '--arrel', root], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(vigila.signal, null, 'la consulta s’ha penjat obrint el FIFO');
  assert.equal(vigila.status, 2);
  coincideix(JSON.parse(vigila.stdout).estat, { deuriaParar: false, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: false, evidenciesDescartades: [] });
});

test('R32 · un candidat il·legible no compta i queda declarat amb el codi d’error', {
  skip: (process.platform === 'win32' || process.getuid?.() === 0) && 'els permisos POSIX no bloquegen esta lectura',
}, () => {
  obrirGuarda(root, { onada: 'legacy-r32' });
  escriuEscriptori(AUDITORIA, 'Dictamen: 100% en verd.', iniciDe() + 1000);
  const tancat = escriuEscriptori(INFORME, 'Commit consolidat de l’onada.', iniciDe() + 1000);
  fs.chmodSync(tancat, 0o000);
  try {
    const estat = comprovarGuarda(root);
    coincideix(estat, { deuriaParar: false, hiHaInformeClaudeTancat: false, evidenciesDescartades: [`${INFORME}: no s'ha pogut llegir (EACCES)`] });
  } finally {
    fs.chmodSync(tancat, 0o600);
  }
});

test('R32 · absència del fitxer d’estat: es conserva el reconeixement històric sense data de referència', () => {
  informesAmbCites(Date.parse('2025-10-01T00:00:00Z'));
  const estat = comprovarGuarda(root);
  coincideix(estat, { activa: false, deuriaParar: true, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: true, evidenciesDescartades: [], dadaGuarda: null });
  assert.equal(fs.existsSync(ruta()), false);
});

test('R32 · absència del fitxer d’estat: sense evidències no inventa cap parada i torna booleans', () => {
  coincideix(comprovarGuarda(root), { activa: false, finalitzada: false, deuriaParar: false, motiu: null, detalls: [], evidenciesDescartades: [] });
  assert.equal(fs.existsSync(ruta()), false);
});

test('R32 · els SHA fixos d’octubre (32eabf12, 4d67f7ab) ja no tanquen cap informe', () => {
  for (const ambEstat of [false, true]) {
    if (ambEstat) obrirGuarda(root, { onada: 'legacy-r32' });
    escriuEscriptori(AUDITORIA, 'Dictamen: 100% en verd.', Date.now() + 1000);
    escriuEscriptori(INFORME, 'Commits de llançament 32eabf12 i 4d67f7ab.', Date.now() + 1000);
    coincideix(comprovarGuarda(root), { deuriaParar: false, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: false, evidenciesDescartades: [] });
  }
});

test('R32 · falla tancat: un estat il·legible no accepta evidències, atura i no reescriu el fitxer', () => {
  fs.mkdirSync(path.dirname(ruta()), { recursive: true });
  fs.writeFileSync(ruta(), '{"activa": true, "inici": ');
  informesAmbCites(Date.now() + HORA);
  const estat = comprovarGuarda(root);
  coincideix(estat, { activa: false, deuriaParar: true, hiHaAuditoriaAprovada: false, hiHaInformeClaudeTancat: false, detalls: [], dadaGuarda: null });
  assert.match(estat.motiu, /il·legible o sense termini vàlid/);
  assert.ok(estat.evidenciesDescartades.every((d) => d.endsWith("l'estat de la guàrdia no té cap inici vàlid")));
  assert.equal(estat.evidenciesDescartades.length, 2);
  assert.equal(fs.readFileSync(ruta(), 'utf8'), '{"activa": true, "inici": ');
});

test('R32 · falla tancat: sense inici vàlid cap evidència compta, però el TTL vàlid continua governant', () => {
  const dada = obrirGuarda(root, { onada: 'legacy-r32' });
  for (const inici of ['ahir', undefined, 1731700000000]) {
    fs.writeFileSync(ruta(), JSON.stringify({ ...dada, inici }));
    const abans = fs.readFileSync(ruta(), 'utf8');
    informesAmbCites(Date.now() + HORA);
    const estat = comprovarGuarda(root);
    coincideix(estat, { activa: true, deuriaParar: false, motiu: null, hiHaAuditoriaAprovada: false, hiHaInformeClaudeTancat: false, detalls: [] });
    assert.equal(estat.evidenciesDescartades.length, 2, String(inici));
    assert.equal(fs.readFileSync(ruta(), 'utf8'), abans);
  }
});

test('R32 · falla tancat: una guàrdia activa sense termini vàlid s’atura i ho registra', () => {
  const dada = obrirGuarda(root, mode);
  fs.writeFileSync(ruta(), JSON.stringify({ ...dada, expira: 'mai' }));
  const estat = comprovarGuarda(root);
  coincideix(estat, { activa: false, deuriaParar: true, hiHaAuditoriaAprovada: false });
  assert.match(estat.motiu, /sense termini vàlid/);
  coincideix(JSON.parse(fs.readFileSync(ruta(), 'utf8')), { activa: false, finalitzada: true, onada: mode.onada, motiu_finalitzacio: estat.motiu });
});

test('R32 · la CLI legacy continua (exit 2) amb evidència antiga i para (exit 0) amb evidència nova', () => {
  const programa = fileURLToPath(new URL('./guarda-nocturna.mjs', import.meta.url));
  const cli = (...args) => spawnSync(process.execPath, [programa, '--arrel', root, ...args], { encoding: 'utf8' });
  assert.equal(cli('--inici', '--onada', 'legacy-cli').status, 0);
  const inici = iniciDe();
  informesAmbCites(inici - HORA);
  const antiga = cli();
  assert.equal(antiga.status, 2);
  assert.equal(JSON.parse(antiga.stdout).estat.evidenciesDescartades.length, 2);
  informesAmbCites(inici + 1000);
  const nova = cli();
  assert.equal(nova.status, 0);
  coincideix(JSON.parse(nova.stdout).estat, { deuriaParar: true, hiHaAuditoriaAprovada: true, hiHaInformeClaudeTancat: true, evidenciesDescartades: [] });
});
