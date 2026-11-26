/* P0-CONSOLIDACIO-3-CATEDRES (Emowe/Tellado) · llms.txt i /md/<slug>.md ixen
   de publication-policy.mjs i de res més. Arrel de prova en mkdtemp: un sol
   document públic entre un privat, un arxivat, un de l'escriptori, una
   petorreta i un enllaç simbòlic al privat. Cap xarxa. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { projectaLlms, diferenciesLlms, escriuLlms, CAP_LLMS } from './genera-llms.mjs';
import { buildSlugIndex } from '../wiki/core/build_slug_index.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), 'genera-llms.mjs');

function creaArrel(t, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-llms-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const fitxers = {
    '_wiki_de_poble/02_saber/public.md': '---\ntype: document\nstatus: canonic\nvisibility: public\ntitle: Document Obert\ndescription: Descripció oberta del document.\nauthorId: autor-secret-77\nnoteUuid: nota-secreta-88\n---\n# Cos obert\n\nCamí local /Users/javi/x i res més.\n',
    '_wiki_de_poble/02_saber/privat.md': '---\ntype: document\nstatus: canonic\nvisibility: private\ntitle: Document Privat Amagat\ndescription: No ha d’eixir.\n---\nCos privat.\n',
    '_wiki_de_poble/03_actuar/arxivat.md': '---\ntype: document\nstatus: arxivat\ntitle: Document Arxivat Vell\ndescription: Arxivat.\n---\nCos arxivat.\n',
    '_wiki_de_poble/04_escriptori/esborrany.md': '---\ntype: document\nstatus: canonic\ntitle: Esborrany De Escriptori\ndescription: Escriptori.\n---\nCos de l’escriptori.\n',
    '_wiki_de_poble/02_saber/petorreta_x.md': '---\ntype: document\nstatus: canonic\ntitle: Petorreta Interna\ndescription: Petorreta.\n---\nCos de petorreta.\n',
    ...extra,
  };
  for (const [rel, text] of Object.entries(fitxers)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  fs.mkdirSync(path.join(root, '_wiki_de_poble/01_ser'), { recursive: true });
  fs.symlinkSync(path.join(root, '_wiki_de_poble/02_saber/privat.md'), path.join(root, '_wiki_de_poble/01_ser/enllac.md'));
  fs.mkdirSync(path.join(root, 'public'));
  return root;
}

const cli = (root, mode) => spawnSync(process.execPath, [CLI, '--root', root, mode], { encoding: 'utf8' });

test('(a) un sol document públic, amb el mateix slug que slugIndex.json', async (t) => {
  const root = creaArrel(t);
  const { fitxers } = projectaLlms({ root });
  assert.deepEqual([...fitxers.keys()], ['document-obert']);
  const index = await buildSlugIndex(root);
  assert.deepEqual(index.docs.map((d) => d.slug), ['document-obert']);
});

test('(b) llms.txt porta la capçalera curada i un sol enllaç /md/, cap del privat, l’arxivat, l’escriptori, la petorreta ni l’enllaç', (t) => {
  const root = creaArrel(t);
  const { llms } = projectaLlms({ root });
  assert.ok(llms.startsWith(`${CAP_LLMS.join('\n')}\n`));
  const enllacos = [...llms.matchAll(/\]\((https:\/\/socdepoble\.org\/md\/[^)]+)\)/g)].map((m) => m[1]);
  assert.deepEqual(enllacos, ['https://socdepoble.org/md/document-obert.md']);
  assert.match(llms, /- \[Document Obert\]\(https:\/\/socdepoble\.org\/md\/document-obert\.md\): Descripció oberta del document\.\n$/);
  for (const amagat of ['Privat Amagat', 'document-privat', 'Arxivat Vell', 'document-arxivat', 'Esborrany De Escriptori', 'Petorreta Interna', 'petorreta', 'enllac']) {
    assert.equal(llms.includes(amagat), false, amagat);
  }
});

test('(c) el .md emmascara els camins locals i no copia cap altra clau del frontmatter', (t) => {
  const root = creaArrel(t);
  const text = projectaLlms({ root }).fitxers.get('document-obert');
  assert.match(text, /^# Document Obert\n\n> Descripció oberta del document\.\n/);
  assert.match(text, /https:\/\/socdepoble\.org\/wikidepoble\?item=public\n/);
  assert.match(text, /Camí local ~\/x i res més\./);
  for (const fuga of ['/Users/javi', 'authorId', 'autor-secret-77', 'noteUuid', 'nota-secreta-88', 'visibility']) assert.equal(text.includes(fuga), false, fuga);
});

test('(d) --escriu i --comprova: 0 amb la projecció; 1 si llms.txt s’edita a mà o sobra un .md; --escriu esborra el sobrer', (t) => {
  const root = creaArrel(t);
  assert.equal(cli(root, '--comprova').status, 1, 'sense escriure encara, el disc no és la projecció');
  assert.equal(cli(root, '--escriu').status, 0);
  assert.deepEqual(fs.readdirSync(path.join(root, 'public/md')), ['document-obert.md', 'skills']);
  assert.equal(cli(root, '--comprova').status, 0);
  assert.deepEqual(diferenciesLlms(root), []);

  fs.appendFileSync(path.join(root, 'public/llms.txt'), '- [A mà](https://socdepoble.org/mur): línia afegida a mà\n');
  const roig = cli(root, '--comprova');
  assert.equal(roig.status, 1);
  assert.match(roig.stderr, /public\/llms\.txt no és la projecció/);

  assert.equal(cli(root, '--escriu').status, 0);
  fs.writeFileSync(path.join(root, 'public/md/document-privat-amagat.md'), 'Cos privat.\n');
  assert.equal(cli(root, '--comprova').status, 1);
  assert.equal(cli(root, '--escriu').status, 0);
  assert.deepEqual(fs.readdirSync(path.join(root, 'public/md')), ['document-obert.md', 'skills']);
  assert.equal(cli(root, '--comprova').status, 0);
});

test('un slug que no és un nom de fitxer segur, o un slug duplicat, atura la projecció abans d’escriure', (t) => {
  const fora = creaArrel(t, { '_wiki_de_poble/02_saber/fora.md': '---\ntype: document\nstatus: canonic\nslug: ../../fora\n---\nCos.\n' });
  assert.throws(() => projectaLlms({ root: fora }), /Slug no publicable/);
  assert.equal(cli(fora, '--escriu').status, 1);
  assert.equal(fs.existsSync(path.join(fora, 'public/llms.txt')), false);
  const doble = creaArrel(t, { '_wiki_de_poble/03_actuar/doble.md': '---\ntype: document\nstatus: canonic\ntitle: Document Obert\n---\nCos.\n' });
  assert.throws(() => projectaLlms({ root: doble }), /Slug duplicat/);
});

test('public/md no pot ser un enllaç simbòlic: --escriu no hi seguix', (t) => {
  const root = creaArrel(t);
  const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-llms-fora-'));
  t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  fs.symlinkSync(fora, path.join(root, 'public/md'));
  assert.throws(() => escriuLlms(root), /carpeta real/);
  assert.deepEqual(fs.readdirSync(fora), []);
});

test('un .DS_Store del Finder a public/md no fa roja la comprovació: els noms amb punt inicial els governa .gitignore', (t) => {
  const root = creaArrel(t);
  assert.equal(cli(root, '--escriu').status, 0);
  fs.writeFileSync(path.join(root, 'public/md/.DS_Store'), 'Finder');
  assert.deepEqual(diferenciesLlms(root), []);
  assert.equal(cli(root, '--comprova').status, 0);
});

test('public/md queda fora del corpus de la Porta Frontmatter: és projecció, no document d’autor', () => {
  const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const abast = JSON.parse(fs.readFileSync(path.join(ARREL, 'tooling/wiki/frontmatter-abast.json'), 'utf8'));
  assert.ok(abast.exclou.includes('public/md'), 'frontmatter-abast.json exclou public/md');
  const r = spawnSync(process.execPath, [path.join(ARREL, 'tooling/wiki/tractor-frontmatter.mjs'), '--json'], { cwd: ARREL, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const informe = JSON.parse(r.stdout);
  const text = JSON.stringify(informe);
  assert.equal(text.includes('public/md/'), false, 'cap troballa ni document de public/md al tractor');
});
