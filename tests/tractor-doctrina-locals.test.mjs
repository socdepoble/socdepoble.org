/**
 * Porta Doctrina · camins locals (B1 · 261101, D3).
 *
 * Un camí citat que no existix i que Git ignora (artefacte de build, entorn, estat local)
 * mai viatja amb un commit: a l'arbre preparat del hook sempre falta. La porta el classifica
 * EXTERN amb el motiu «local: ignorat per Git» i no el compta com a absent. Només valen els
 * .gitignore versionats d'una arrel que siga el nivell superior del seu repositori: sense Git,
 * amb un camí no ignorat o ignorat només per la configuració de la màquina (exclusions
 * personals, .git/info/exclude, repositori pare), continua sent ABSENT (fail-closed).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DOCTRINA = fileURLToPath(new URL('../tooling/gates/tractor-doctrina.mjs', import.meta.url));
const SENSE_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

function fixture(t, { cites, gitignore = '', git = true, versiona = true, extra = {}, dins = null }) {
  const root = dins ?? fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-doctrina-locals-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  };
  put('.agents/AGENTS.md', '# BIOS de prova\n');
  put('src/present.js', 'export const present = true;\n');
  put('.agents/norma.md', `# Norma\n\n${cites.map((c) => `- Vegeu \`${c}\`.`).join('\n')}\n`);
  if (gitignore) put('.gitignore', gitignore);
  for (const [rel, text] of Object.entries(extra)) put(rel, text);
  if (git) assert.equal(spawnSync('git', ['init', '-q'], { cwd: root, env: SENSE_GIT }).status, 0, 'git init');
  // Com a l'arbre preparat del hook: el .gitignore és a l'índex (només compten les regles versionades).
  if (git && gitignore && versiona) assert.equal(spawnSync('git', ['add', '--', '.gitignore'], { cwd: root, env: SENSE_GIT }).status, 0, 'git add');
  return {
    root,
    git: (...args) => spawnSync('git', args, { cwd: root, env: SENSE_GIT, encoding: 'utf8' }),
    run(args = [], env = {}) {
      const r = spawnSync(process.execPath, [DOCTRINA, '--json', ...args], {
        cwd: root, env: { ...SENSE_GIT, SDP_ARREL: root, ...env }, encoding: 'utf8', timeout: 60_000,
      });
      let data = null;
      try { data = JSON.parse(r.stdout); } catch { /* l'asserció de baix ho diu */ }
      assert.ok(data, `la porta ha de tornar JSON (exit ${r.status}): ${r.stderr}`);
      return { status: r.status, data, absents: data.absents.map((a) => a.cami), locals: data.externs.filter((e) => e.motiu === 'local: ignorat per Git').map((e) => e.cami) };
    },
  };
}

test('un artefacte ignorat i absent és local; un camí de codi absent continua sent ABSENT', (t) => {
  const f = fixture(t, { cites: ['dist/app.js', 'src/inexistent.js', 'src/present.js'], gitignore: 'dist/\n' });
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents, ['src/inexistent.js']);
  assert.deepEqual(r.locals, ['dist/app.js']);
});

test('si només falten locals, la porta ix amb 0', (t) => {
  const f = fixture(t, { cites: ['dist/app.js', '.env', 'src/present.js'], gitignore: 'dist/\n.env\n' });
  const r = f.run();
  assert.equal(r.status, 0, JSON.stringify(r.data));
  assert.deepEqual(r.absents, []);
  assert.deepEqual(r.locals.sort(), ['.env', 'dist/app.js']);
});

test('sense repositori Git la mateixa fixture falla tancada: tots dos són ABSENT', (t) => {
  const f = fixture(t, { cites: ['dist/app.js', 'src/inexistent.js'], gitignore: 'dist/\n', git: false });
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents.sort(), ['dist/app.js', 'src/inexistent.js']);
  assert.deepEqual(r.locals, []);
});

test('una regla de directori («carpeta/sub/») classifica el camí citat sense barra final', (t) => {
  const f = fixture(t, {
    cites: ['carpeta/sub', 'carpeta/altra'],
    gitignore: 'carpeta/sub/\n',
    extra: { 'carpeta/llegeix.txt': 'ancora de primer nivell\n' },
  });
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.locals, ['carpeta/sub']);
  assert.deepEqual(r.absents, ['carpeta/altra']);
});

test('un fitxer versionat que falta al disc no s’amaga encara que case amb una regla', (t) => {
  const f = fixture(t, { cites: ['dist/versionat.js'], gitignore: 'dist/\n', extra: { 'dist/versionat.js': 'x\n' } });
  assert.equal(f.git('add', '-f', 'dist/versionat.js').status, 0);
  fs.rmSync(path.join(f.root, 'dist/versionat.js'));
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents, ['dist/versionat.js']);
  assert.deepEqual(r.locals, []);
});

test('GIT_DIR heretat d’un altre repositori no classifica camins d’una arrel sense Git', (t) => {
  const alie = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-doctrina-alie-')));
  t.after(() => fs.rmSync(alie, { recursive: true, force: true }));
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: alie, env: SENSE_GIT }).status, 0);
  const f = fixture(t, { cites: ['dist/app.js'], gitignore: 'dist/\n', git: false });
  const r = f.run([], { GIT_DIR: path.join(alie, '.git') });
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents, ['dist/app.js']);
});

/* Només regles versionades de l'arrel (P3-1 del Gauntlet): cap configuració de la màquina pot callar una promesa. */

test('les exclusions personals (XDG git/ignore i core.excludesFile de l’usuari) no fan local un camí', (t) => {
  const f = fixture(t, { cites: ['src/promesa.js'] });
  const casa = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-doctrina-casa-')));
  t.after(() => fs.rmSync(casa, { recursive: true, force: true }));
  fs.mkdirSync(path.join(casa, 'xdg/git'), { recursive: true });
  fs.mkdirSync(path.join(casa, 'usuari'));
  fs.writeFileSync(path.join(casa, 'xdg/git/ignore'), 'src/promesa.js\n');
  fs.writeFileSync(path.join(casa, 'exclou.txt'), 'src/promesa.js\n');
  fs.writeFileSync(path.join(casa, 'usuari/.gitconfig'), `[core]\n\texcludesFile = ${path.join(casa, 'exclou.txt')}\n`);
  const entorns = {
    xdg: { HOME: casa, XDG_CONFIG_HOME: path.join(casa, 'xdg') },
    excludesFile: { HOME: path.join(casa, 'usuari'), XDG_CONFIG_HOME: path.join(casa, 'buit') },
  };
  for (const [nom, env] of Object.entries(entorns)) {
    // Control: amb este entorn, Git sí que l'ignora; la porta no se'n fia.
    const control = spawnSync('git', ['check-ignore', '-q', '--', 'src/promesa.js'], { cwd: f.root, env: { ...SENSE_GIT, ...env } });
    assert.equal(control.status, 0, `${nom}: el control ha de veure l’exclusió personal`);
    const r = f.run([], env);
    assert.equal(r.status, 1, nom);
    assert.deepEqual(r.absents, ['src/promesa.js'], nom);
    assert.deepEqual(r.locals, [], nom);
  }
});

test('.git/info/exclude i un .gitignore no versionat no fan local un camí; el versionat sí', (t) => {
  const f = fixture(t, { cites: ['src/exclos.js', 'brut/x.js', 'dist/app.js'], gitignore: 'dist/\n' });
  fs.appendFileSync(path.join(f.root, '.git/info/exclude'), 'src/exclos.js\n');
  fs.mkdirSync(path.join(f.root, 'brut'));
  fs.writeFileSync(path.join(f.root, 'brut/.gitignore'), 'x.js\n');
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents.sort(), ['brut/x.js', 'src/exclos.js']);
  assert.deepEqual(r.locals, ['dist/app.js']);
});

test('sense versionar, el mateix .gitignore de l’arrel tampoc classifica res', (t) => {
  const f = fixture(t, { cites: ['dist/app.js'], gitignore: 'dist/\n', versiona: false });
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents, ['dist/app.js']);
});

test('una negació («!gen/keep.js») no és una regla d’ignorar encara que check-ignore -v la case', (t) => {
  const f = fixture(t, { cites: ['gen/keep.js', 'gen/x.js'], gitignore: 'gen/*.js\n!gen/keep.js\n' });
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents, ['gen/keep.js']);
  assert.deepEqual(r.locals, ['gen/x.js']);
});

test('una arrel sense .git propi dins d’un repositori pare no hereta les regles del pare', (t) => {
  const pare = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-doctrina-pare-')));
  t.after(() => fs.rmSync(pare, { recursive: true, force: true }));
  fs.mkdirSync(path.join(pare, 'subarrel'));
  fs.writeFileSync(path.join(pare, '.gitignore'), 'dist/\n');
  // Des d'una subcarpeta, check-ignore dona la font relativa al nivell superior del pare (`.gitignore`) i
  // ls-files la llig relativa al directori actual (`subarrel/.gitignore`): sense exigir que ARREL siga el
  // nivell superior, els dos noms coincidixen i la regla del pare passaria per versionada d'ARREL.
  fs.writeFileSync(path.join(pare, 'subarrel/.gitignore'), 'gen/\n');
  for (const args of [['init', '-q'], ['add', '--', '.gitignore', 'subarrel/.gitignore']]) {
    assert.equal(spawnSync('git', args, { cwd: pare, env: SENSE_GIT }).status, 0, `git ${args[0]}`);
  }
  const f = fixture(t, { cites: ['dist/app.js', 'gen/a.js'], git: false, dins: path.join(pare, 'subarrel') });
  assert.equal(f.git('check-ignore', '-q', '--', 'dist/app.js').status, 0, 'control: el pare sí que l’ignora');
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents.sort(), ['dist/app.js', 'gen/a.js']);
  assert.deepEqual(r.locals, []);
});

test('un core.excludesFile relatiu de la configuració del clon no aplica un .gitignore versionat fora del seu lloc', (t) => {
  // `regles/.gitignore` és versionat, però només val dins de `regles/`; com a core.excludesFile (config
  // local del clon, que no viatja) valdria per a tot l'arbre. La porta el desactiva amb -c.
  const f = fixture(t, { cites: ['src/promesa.js'], extra: { 'regles/.gitignore': 'src/promesa.js\n' } });
  assert.equal(f.git('add', '--', 'regles/.gitignore').status, 0);
  assert.equal(f.git('config', 'core.excludesFile', 'regles/.gitignore').status, 0);
  assert.equal(f.git('check-ignore', '-q', '--', 'src/promesa.js').status, 0, 'control: amb la config del clon, Git l’ignora');
  const r = f.run();
  assert.equal(r.status, 1);
  assert.deepEqual(r.absents, ['src/promesa.js']);
  assert.deepEqual(r.locals, []);
});

test('--extern-fatal també fa fatals els locals, com qualsevol extern', (t) => {
  const f = fixture(t, { cites: ['dist/app.js'], gitignore: 'dist/\n' });
  assert.equal(f.run().status, 0);
  assert.equal(f.run(['--extern-fatal']).status, 1);
});
