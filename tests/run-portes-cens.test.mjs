/**
 * tests/run-portes-cens.test.mjs — CL-08 (pla 261028_1526, §3.6.2) · El mode --cens de
 * tooling/gates/run-portes.mjs: la selecció com a funció pura, i un cens sobre portes fingides en
 * una arrel temporal (cap porta real s'executa): dos roges que no paren la resta, una que esgota el
 * seu temps, una omesa perquè pot mutar l'arbre i una que l'escriu i ix al resum com a efecte
 * lateral. Cada pas és un grup de processos: els néts cauen amb el pas (en esgotar el temps, en
 * acabar i amb el Ctrl-C), i un nét fora del grup no penja el cens. El CLI només es prova en els
 * errors d'ús, que paren abans d'executar cap porta.
 *
 * Ús:  node --test tests/run-portes-cens.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { censDePortes, passos, seleccionaPassos } from '../tooling/gates/run-portes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dorm = (ms) => new Promise((resol) => setTimeout(resol, ms));
const fingida = (nom, codi, extra = {}) => ({ nom, cmd: process.execPath, args: ['-e', codi], ...extra });

/* Els néts de les portes fingides es parlen per fitxers a l'arrel temporal, fora de l'inventari:
   en arrancar marquen viu-<marca> amb el seu pid, i només escriuen src/tard-<marca>.js quan hi veuen
   «dispara». Si el cens els ha tombat, no escriuen mai. */
const codiDelNet = (marca) => `const fs = require('node:fs'); fs.writeFileSync('viu-${marca}', String(process.pid));
setInterval(() => { if (fs.existsSync('dispara')) { fs.writeFileSync('src/tard-${marca}.js', ''); process.exit(0); } }, 25);
setTimeout(() => process.exit(0), 20000);`;
const llancaNet = (marca, opcions = "{ stdio: 'ignore' }") =>
  `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(codiDelNet(marca))}], ${opcions})`;
const esperaQueAparega = async (fitxer, ms = 15000) => {
  for (const fi = Date.now() + ms; !fs.existsSync(fitxer); await dorm(25)) if (Date.now() > fi) return false;
  return true;
};
/** Els néts que quedaren vius (una prova roja) no sobreviuen a la prova. */
const tombaNets = (arrel) => {
  for (const nom of fs.existsSync(arrel) ? fs.readdirSync(arrel).filter((n) => n.startsWith('viu-')) : []) {
    try { process.kill(Number(fs.readFileSync(path.join(arrel, nom), 'utf8')), 'SIGKILL'); } catch { /* ja no hi és */ }
  }
};

test('seleccionaPassos({ cens }): totes les portes, cap bateria de proves, i les que poden mutar només amb ambMutacions', () => {
  const abans = JSON.stringify(passos);
  const cens = seleccionaPassos({ cens: true });
  assert.deepEqual(cens, passos.filter(pas => !pas.prova && !pas.potMutar));
  assert.deepEqual(passos.filter(pas => pas.potMutar).map(pas => pas.nom), ['Porta Build'], 'la Porta Build pot llançar npm run build');
  assert.ok(!cens.some(pas => pas.prova), 'cap bateria de proves');
  for (const nom of ['Segell de skills', 'Linter', 'Tractor Pedra Seca', 'Llaurador Índexs', 'Porta Teixit', 'Porta Catàleg']) {
    assert.ok(cens.some(pas => pas.nom === nom), `${nom}: porta perduda`);
  }
  assert.deepEqual(seleccionaPassos({ cens: true, ambMutacions: true }), passos.filter(pas => !pas.prova));
  assert.deepEqual(seleccionaPassos({ cens: true }), cens, 'la mateixa entrada, la mateixa selecció');
  assert.equal(JSON.stringify(passos), abans, 'la selecció no toca la llista de passos');
  for (const modes of [{ cens: true, diagnostic: true }, { cens: true, nomesPortes: true }]) {
    assert.throws(() => seleccionaPassos(modes), /modes diferents/, JSON.stringify(modes));
  }
  assert.throws(() => seleccionaPassos({ ambMutacions: true }), /només té sentit amb --cens/);
  // Els modes d'abans no canvien.
  assert.deepEqual(seleccionaPassos(), passos);
  assert.deepEqual(seleccionaPassos({ diagnostic: true }), passos.filter(pas => pas.readOnly));
  assert.deepEqual(seleccionaPassos({ nomesPortes: true }), passos.filter(pas => !pas.prova));
});

test('censDePortes: les roges no paren la resta, el temps per pas talla, l’omesa no corre i l’inventari delata qui escriu', async t => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cens-portes-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, 'src'), { recursive: true });
  fs.writeFileSync(path.join(arrel, 'src/a.js'), 'export const a = 1;\n');
  const seleccionats = [
    fingida('Fingida roja 1', "console.log('primera roja'); process.exit(3)"),
    fingida('Fingida verda', "console.log('verd')"),
    fingida('Fingida roja 2', "console.error('segona roja'); process.exit(1)"),
    fingida('Fingida lenta', 'setTimeout(() => {}, 60000)'),
    fingida('Fingida que escriu', "require('node:fs').writeFileSync('src/b.js', 'export const b = 1;\\n')")
  ];
  const omesos = [fingida('Fingida que muta', "require('node:fs').writeFileSync('src/c.js', '')", { potMutar: true })];
  const linies = [];
  const resum = await censDePortes({ seleccionats, omesos, arrel, tempsPerPasMs: 1500, escriu: linia => linies.push(linia) });
  const files = linies.map(linia => JSON.parse(linia));
  assert.equal(files.length, seleccionats.length + omesos.length + 1, 'una línia JSON per pas i una de resum');
  assert.deepEqual(files[0], { nom: 'Fingida que muta', omes: 'potMutar' });
  const de = nom => files.find(fila => fila.nom === nom);
  assert.equal(de('Fingida roja 1').exit, 3);
  assert.match(de('Fingida roja 1').cua.join('\n'), /primera roja/);
  assert.equal(de('Fingida roja 2').exit, 1);
  assert.match(de('Fingida roja 2').cua.join('\n'), /segona roja/);
  assert.equal(de('Fingida verda').exit, 0);
  assert.equal(de('Fingida verda').cua, undefined, 'una verda no porta cua');
  assert.equal(de('Fingida lenta').exit, null);
  assert.equal(de('Fingida lenta').tempsEsgotat, true);
  for (const fila of files.slice(1, -1)) assert.ok(Number.isInteger(fila.ms) && fila.ms >= 0, fila.nom);
  assert.deepEqual(files.at(-1), resum);
  assert.deepEqual(resum.roges, ['Fingida roja 1', 'Fingida roja 2', 'Fingida lenta']);
  assert.deepEqual([resum.failures, resum.valid, resum.executats, resum.total], [3, false, 5, 6]);
  assert.deepEqual(resum.omesos, ['Fingida que muta']);
  assert.deepEqual(resum.efectes, ['src/b.js']);
  assert.equal(fs.existsSync(path.join(arrel, 'src/c.js')), false, 'l’omesa no s’executa');
  // Un cens tot verd i sense escriptures és vàlid i no delata res.
  const verd = await censDePortes({ seleccionats: [fingida('Fingida verda', "console.log('verd')")], arrel, escriu: () => {} });
  assert.deepEqual([verd.failures, verd.valid, verd.efectes], [0, true, []]);
});

test('censDePortes: els néts cauen amb el pas, en esgotar el temps i en acabar, i un nét fora del grup no penja el cens', async t => {
  const [arrel, arrelFora] = ['sdp-cens-nets-', 'sdp-cens-fora-'].map((prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  t.after(() => { for (const a of [arrel, arrelFora]) { tombaNets(a); fs.rmSync(a, { recursive: true, force: true }); } });
  for (const a of [arrel, arrelFora]) fs.mkdirSync(path.join(a, 'src'));
  const esperaElNet = (marca) => `const fs = require('node:fs'); setInterval(() => { if (fs.existsSync('viu-${marca}')) process.exit(0); }, 25); setTimeout(() => process.exit(9), 10000);`;
  // El nét de la lenta retén les canonades: si el rellotge només tombara el fill, el pas esperaria l'escotilla dels 2 s.
  const seleccionats = [
    fingida('Fingida lenta amb un nét', `${llancaNet('a', "{ stdio: 'inherit' }")}; setTimeout(() => process.exit(0), 20000);`),
    fingida('Fingida que acaba i deixa un nét', `${llancaNet('b')}.unref(); ${esperaElNet('b')}`)
  ];
  const fora = [fingida('Fingida amb un nét fora del grup', `${llancaNet('e', "{ detached: true, stdio: 'inherit' }")}.unref(); ${esperaElNet('e')}`)];
  const inici = Date.now();
  const [linies, liniesFora] = [[], []];
  const [resum, resumFora] = await Promise.all([
    censDePortes({ seleccionats, arrel, tempsPerPasMs: 2500, escriu: (linia) => linies.push(JSON.parse(linia)) }),
    censDePortes({ seleccionats: fora, arrel: arrelFora, tempsPerPasMs: 1500, escriu: (linia) => liniesFora.push(JSON.parse(linia)) })
      .then((r) => ({ ...r, ms: Date.now() - inici }))
  ]);
  // Sense els néts vius abans del tall, la prova no diria res.
  for (const [a, marca] of [[arrel, 'a'], [arrel, 'b'], [arrelFora, 'e']]) assert.ok(await esperaQueAparega(path.join(a, `viu-${marca}`), 5000), `el nét ${marca} ha arrancat`);
  assert.equal(linies[0].tempsEsgotat, true);
  assert.ok(linies[0].ms < 2500 + 1500, `en esgotar el temps cau el grup sencer, no sols el fill (${linies[0].ms} ms)`);
  assert.deepEqual([linies[1].exit, linies[1].tempsEsgotat], [0, undefined], 'la que acaba és verda');
  assert.deepEqual([resum.roges, resum.efectes], [['Fingida lenta amb un nét'], []]);
  fs.writeFileSync(path.join(arrel, 'dispara'), '');
  await dorm(1000);
  for (const marca of ['a', 'b']) assert.equal(fs.existsSync(path.join(arrel, `src/tard-${marca}.js`)), false, `el nét ${marca} ha caigut amb el seu pas`);
  // El nét de fora del grup retenia les canonades: als 2 s del tall es tallen, i el pas és roig encara que haja eixit amb 0.
  assert.ok(resumFora.ms < 1500 + 2000 + 2500, `el cens no es penja (${resumFora.ms} ms)`);
  assert.deepEqual([liniesFora[0].tempsEsgotat, resumFora.roges], [true, ['Fingida amb un nét fora del grup']]);
});

test('censDePortes: el Ctrl-C tomba el grup del pas en curs i el cens ix amb 130', async t => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cens-ctrlc-'));
  fs.mkdirSync(path.join(arrel, 'src'));
  const pas = fingida('Fingida llarga', `${llancaNet('c')}; setTimeout(() => process.exit(0), 20000);`);
  const modul = pathToFileURL(path.join(ROOT, 'tooling/gates/run-portes.mjs')).href;
  const codi = `const { censDePortes } = await import(${JSON.stringify(modul)});
await censDePortes({ seleccionats: [${JSON.stringify(pas)}], arrel: ${JSON.stringify(arrel)}, tempsPerPasMs: 60000, escriu: () => {} });`;
  const cens = spawn(process.execPath, ['--input-type=module', '-e', codi], { cwd: arrel, stdio: 'ignore' });
  const eixida = new Promise((resol) => cens.on('exit', (codi, senyal) => resol({ codi, senyal })));
  t.after(() => { cens.kill('SIGKILL'); tombaNets(arrel); fs.rmSync(arrel, { recursive: true, force: true }); });
  assert.ok(await esperaQueAparega(path.join(arrel, 'viu-c')), 'el nét ha arrancat');
  cens.kill('SIGINT');
  assert.deepEqual(await eixida, { codi: 130, senyal: null });
  fs.writeFileSync(path.join(arrel, 'dispara'), '');
  await dorm(1000);
  assert.equal(fs.existsSync(path.join(arrel, 'src/tard-c.js')), false, 'el nét ha caigut amb el cens');
});

test('run-portes: els errors d’ús del cens paren amb 1 abans d’executar cap porta', t => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cens-us-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const env = { ...process.env };
  delete env.SDP_DINS_DE_PORTA;
  for (const [args, missatge] of [
    [['--amb-mutacions'], /només té sentit amb --cens/],
    [['--cens', '--diagnostic'], /modes diferents/],
    [['--cens', '--nomes-portes'], /modes diferents/],
    [['--cens', '--temps-per-pas=0'], /--temps-per-pas=SEGONS/]
  ]) {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'tooling/gates/run-portes.mjs'), ...args], { cwd: arrel, env, encoding: 'utf8', timeout: 30000 });
    assert.equal(r.status, 1, args.join(' '));
    assert.match(r.stderr, missatge, args.join(' '));
    assert.equal(r.stdout.trim(), '', `${args.join(' ')}: cap porta executada`);
  }
});
