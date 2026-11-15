/**
 * Porta Frontmatter · F9 i vincles a notes arxivades (B1 · 261101, D4).
 *
 * L'arxivat de la porta Olivera reescriu `[[x]]` com `[[../90_arxiu_historic/x|x]]`. L'arxiu
 * és fora del resolutor (AGENTS §5), així que F9 el donava per «unresolved» i el document
 * que el portava quedava amb deute. Ara el vincle és vàlid si, des de la carpeta del
 * document, porta a una nota de primer nivell de l'arxiu que existix amb la caixa exacta.
 * No compta com a nota viva: cal encara una nota interna resoluble.
 *
 * Onada R28 · sql-node0-integritat-01 · Amb la regla versionada `/_wiki_de_poble/90_arxiu_historic/`
 * (D-R27-4), la nota arxivada nova no entra a l'índex i falta a l'arbre preparat del hook. Absent del
 * disc, el vincle només val si Git la ignora per una regla no negada d'un .gitignore versionat i no és
 * a l'índex; sense Git, amb .git/info/exclude, amb un .gitignore no versionat, amb una negació, amb un
 * error de caixa o amb un camí versionat i esborrat continua sent F9.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TRACTOR = fileURLToPath(new URL('../tooling/wiki/tractor-frontmatter.mjs', import.meta.url));
const ESQUEMA = fileURLToPath(new URL('../tooling/wiki/schema.json', import.meta.url));
const SENSE_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

const doc = (titol, vincles) => `---
type: document
status: actiu
description: Document de prova per als vincles a l'arxiu històric de la Wiki.
---
# ${titol}

Cos.

## Vincles

${vincles.map((v) => `- ${v}`).join('\n')}
`;

/** Corpus mínim; torna les fallades F9 per document (només els documents amb fallades).
    Onada R28 · Amb `git`, el corpus és un repositori: `gitignore` s'hi escriu (i s'afig a l'índex si
    `versiona`, com a l'arbre preparat del hook), `exclou` va a .git/info/exclude i cada camí d'`esborrats`
    s'escriu, s'afig a l'índex amb -f i s'esborra del disc (versionat i absent). */
function f9(t, fitxers, { git = false, gitignore = null, versiona = true, exclou = null, esborrats = [] } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-f9-arxiu-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  };
  const ordreGit = (...args) => assert.equal(spawnSync('git', args, { cwd: root, env: SENSE_GIT }).status, 0, `git ${args.join(' ')}`);
  fs.mkdirSync(path.join(root, 'tooling/wiki'), { recursive: true });
  fs.copyFileSync(ESQUEMA, path.join(root, 'tooling/wiki/schema.json'));
  put('.agents/AGENTS.md', doc('BIOS de prova', ['[[00_index]]'])); // marcador d'arrel (tooling/lib/arrel.mjs)
  put('_wiki_de_poble/00_index.md', doc('Índex', ['[[a]]']));
  for (const [rel, text] of Object.entries(fitxers)) put(rel, text);
  if (git) {
    ordreGit('init', '-q');
    if (gitignore !== null) put('.gitignore', gitignore);
    if (gitignore !== null && versiona) ordreGit('add', '--', '.gitignore');
    if (exclou !== null) put('.git/info/exclude', exclou);
    for (const rel of esborrats) {
      put(rel, nota);
      ordreGit('add', '-f', '--', rel);
      fs.rmSync(path.join(root, rel));
    }
  }
  const r = spawnSync(process.execPath, [TRACTOR, `--arrel=${root}`, '--json'], { cwd: root, env: SENSE_GIT, encoding: 'utf8', timeout: 60_000 });
  // stdout ha de ser JSON pur també amb exit 0: el veredicte verd va a stderr.
  let informe = null;
  try { informe = JSON.parse(r.stdout); } catch { /* l'asserció ho diu */ }
  assert.ok(informe, `el tractor ha de tornar només JSON per stdout (exit ${r.status}): ${r.stdout.slice(-200)}`);
  const per = {};
  for (const x of informe.fallades.F9) (per[x.n] ??= []).push(x.detall);
  Object.defineProperty(per, 'status', { value: r.status, enumerable: false });
  return per;
}

const A = '_wiki_de_poble/04_escriptori/a.md';
const B = '_wiki_de_poble/90_arxiu_historic/b.md';
const nota = doc('Arxivada', ['[[00_index]]']);

test('nota viva + vincle a una nota arxivada existent: cap F9', (t) => {
  const per = f9(t, { [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/b|b]]']), [B]: nota });
  assert.deepEqual(per[A], undefined);
  assert.equal(per.status, 0, 'corpus net: la porta ix amb 0 i stdout continua sent JSON');
});

test('la forma amb extensió .md i la que ve de .agents/ (camí relatiu creuat) també valen', (t) => {
  const per = f9(t, {
    [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/b.md|b]]']),
    '.agents/estat.md': doc('Estat', ['[[00_index]]', '[[../_wiki_de_poble/90_arxiu_historic/b|b]]']),
    [B]: nota,
  });
  assert.deepEqual(per[A], undefined);
  assert.deepEqual(per['.agents/estat.md'], undefined);
});

test('si la nota no és a l’arxiu, el vincle continua sent «unresolved»', (t) => {
  const per = f9(t, { [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/b|b]]']) });
  assert.deepEqual(per[A], ['../90_arxiu_historic/b: unresolved']);
});

test('un vincle arxivat no és nota viva: sol, falta una nota interna', (t) => {
  const per = f9(t, { [A]: doc('A', ['[[../90_arxiu_historic/b|b]]']), [B]: nota });
  assert.deepEqual(per[A], ['Falta una nota interna única i diferent']);
});

test('un camí que passa per 90_arxiu_historic però n’ix no s’accepta encara que el fitxer existisca', (t) => {
  const per = f9(t, {
    [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/../../.sdp-paperera/c|c]]']),
    '.sdp-paperera/c.md': nota,
  });
  assert.deepEqual(per[A], ['../90_arxiu_historic/../../.sdp-paperera/c: unresolved']);
});

test('entrar a l’arxiu i eixir cap a una carpeta germana amb un prefix de la mateixa llargària no passa per arxivat', (t) => {
  // «02_saber_inventat» i «90_arxiu_historic» fan 17 caràcters: sense la guarda de prefix, el nom
  // tallat seria «b.md», que sí que és a l'arxiu. El destí real (_wiki_de_poble/02_saber_inventat/b.md) no existix.
  const per = f9(t, { [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/../02_saber_inventat/b|b]]']), [B]: nota });
  assert.deepEqual(per[A], ['../90_arxiu_historic/../02_saber_inventat/b: unresolved']);
});

test('un nom codificat (%20) es descodifica com al resolutor i troba la nota arxivada', (t) => {
  const per = f9(t, {
    [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/nota%20amb%20espais|nota]]']),
    '_wiki_de_poble/90_arxiu_historic/nota amb espais.md': nota,
  });
  assert.deepEqual(per[A], undefined);
});

test('caixa exacta i primer nivell: «B» per «b.md» i una subcarpeta de l’arxiu són F9', (t) => {
  const per = f9(t, {
    [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/B|B]]', '[[../90_arxiu_historic/sub/d|d]]']),
    [B]: nota,
    '_wiki_de_poble/90_arxiu_historic/sub/d.md': nota,
  });
  assert.deepEqual(per[A], ['../90_arxiu_historic/B: unresolved', '../90_arxiu_historic/sub/d: unresolved']);
});

test('una carpeta de sessió (aammdd_Nom, --sessio de la porta Olivera) també val; dos nivells o un nom que no és de sessió, no', (t) => {
  const per = f9(t, {
    [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/261101_Prova/e|e]]', '[[../90_arxiu_historic/261101_Prova/sub/e|e]]', '[[../90_arxiu_historic/Prova/e|e]]']),
    '_wiki_de_poble/90_arxiu_historic/261101_Prova/e.md': nota,
    '_wiki_de_poble/90_arxiu_historic/261101_Prova/sub/e.md': nota,
    '_wiki_de_poble/90_arxiu_historic/Prova/e.md': nota,
  });
  assert.deepEqual(per[A], ['../90_arxiu_historic/261101_Prova/sub/e: unresolved', '../90_arxiu_historic/Prova/e: unresolved']);
});

/* Onada R28 · sql-node0-integritat-01 · L'arbre preparat del hook no porta les notes arxivades
   noves, que el .gitignore versionat ignora (D-R27-4). */
const REGLA_ARXIU = '/_wiki_de_poble/04_escriptori/01_produccio/\n/_wiki_de_poble/90_arxiu_historic/\n';
const ARXIVATS_ABSENTS = ['[[00_index]]', '[[../90_arxiu_historic/b|b]]', '[[../90_arxiu_historic/261116_Sessio/c|c]]'];
const F9_ABSENTS = ['../90_arxiu_historic/b: unresolved', '../90_arxiu_historic/261116_Sessio/c: unresolved'];

test('positiu: una nota arxivada absent que ignora el .gitignore versionat (com a l’arbre preparat) no és F9', (t) => {
  const per = f9(t, { [A]: doc('A', ARXIVATS_ABSENTS) }, { git: true, gitignore: REGLA_ARXIU });
  assert.deepEqual(per[A], undefined);
  assert.equal(per.status, 0, 'el document viu amb el vincle reescrit per Olivera passa la porta');
});

test('negatiu: la mateixa fixture sense Git continua sent F9', (t) => {
  const per = f9(t, { [A]: doc('A', ARXIVATS_ABSENTS), '.gitignore': REGLA_ARXIU });
  assert.deepEqual(per[A], F9_ABSENTS);
  assert.equal(per.status, 1);
});

test('negatiu: un .gitignore que no és a l’índex o una regla de .git/info/exclude no valen', (t) => {
  const noVersionat = f9(t, { [A]: doc('A', ARXIVATS_ABSENTS) }, { git: true, gitignore: REGLA_ARXIU, versiona: false });
  assert.deepEqual(noVersionat[A], F9_ABSENTS);
  const exclusioLocal = f9(t, { [A]: doc('A', ARXIVATS_ABSENTS) }, { git: true, exclou: REGLA_ARXIU });
  assert.deepEqual(exclusioLocal[A], F9_ABSENTS);
});

test('negatiu: sense regla per a l’arxiu o amb una negació que torna a incloure la nota, és F9', (t) => {
  const senseRegla = f9(t, { [A]: doc('A', ARXIVATS_ABSENTS) }, { git: true, gitignore: 'dist/\n' });
  assert.deepEqual(senseRegla[A], F9_ABSENTS);
  const negada = f9(t, { [A]: doc('A', ['[[00_index]]', '[[../90_arxiu_historic/b|b]]']) }, {
    git: true, gitignore: '/_wiki_de_poble/90_arxiu_historic/*\n!/_wiki_de_poble/90_arxiu_historic/b.md\n',
  });
  assert.deepEqual(negada[A], ['../90_arxiu_historic/b: unresolved']);
});

test('negatiu: amb la regla, la caixa, la forma de l’arxiu, els esborrats versionats i els vincles de fora continuen sent F9', (t) => {
  const per = f9(t, {
    [A]: doc('A', [
      '[[00_index]]',
      '[[../90_arxiu_historic/B|B]]', // b.md és al disc: error de caixa
      '[[../90_arxiu_historic/sub/d|d]]', // subcarpeta que no és de sessió
      '[[../90_arxiu_historic/esborrada|esborrada]]', // a l'índex i absent del disc: un esborrat
      '[[../02_saber/absent|absent]]', // fora de l'arxiu
    ]),
    [B]: nota,
  }, { git: true, gitignore: REGLA_ARXIU, esborrats: ['_wiki_de_poble/90_arxiu_historic/esborrada.md'] });
  assert.deepEqual(per[A], [
    '../90_arxiu_historic/B: unresolved',
    '../90_arxiu_historic/sub/d: unresolved',
    '../90_arxiu_historic/esborrada: unresolved',
    '../02_saber/absent: unresolved',
  ]);
});
