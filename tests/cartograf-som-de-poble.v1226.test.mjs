/* v1.2.26 · Lot C1-2 · Cartografia del contenidor dins de Git: --audit, --on-va i --inventari sobre un
   contenidor sintètic a una carpeta temporal (cap lectura del contenidor real del Mestre). Inclou els casos del
   Gauntlet 261126: cada condició de salut per separat, enllaç intermedi, enllaços que ixen, paraules senceres,
   codis d'eixida de la CLI, cap escriptura i el resolutor des d'un worktree. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditaContenidor, inventari, nomEstrany, recomanaUbicacio, textInventari, MAPA_WIKI, TAXONOMIA_CANONICA, CONTENIDOR_PER_DEFECTE, REPOSITORI } from '../tooling/gates/cartograf-som-de-poble.mjs';
import { contenidorDe } from '../tooling/lib/contenidor.mjs';

const EINA = fileURLToPath(new URL('../tooling/gates/cartograf-som-de-poble.mjs', import.meta.url));
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Prova', GIT_AUTHOR_EMAIL: 'prova@example.invalid', GIT_COMMITTER_NAME: 'Prova', GIT_COMMITTER_EMAIL: 'prova@example.invalid' };

function contenidor(fn) {
  // Un nivell més endins: l'auditoria també mira la carpeta pare (fitxers buits), i la del sistema no és nostra.
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-contenidor-'));
  const dir = path.join(base, 'Som de Poble');
  fs.mkdirSync(dir);
  const escriu = (rel, text = 'x') => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };
  try {
    for (const nom of Object.keys(TAXONOMIA_CANONICA).filter((n) => !n.endsWith('.md'))) fs.mkdirSync(path.join(dir, nom), { recursive: true });
    escriu(`socdepoble.org/${MAPA_WIKI}`, '# Mapa\n');
    escriu('README.md', '# Cartell\n');
    escriu('_cultura_de_poble/menjar_i_beure_de_poble/recepta.md', 'Arròs\n');
    return fn(dir, escriu, base);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
}
const cli = (...args) => spawnSync(process.execPath, [EINA, ...args], { encoding: 'utf8' });
function empremtaDe(dir) {
  const files = [];
  const camina = (d) => { for (const n of fs.readdirSync(d).sort()) { const p = path.join(d, n), s = fs.lstatSync(p); files.push(`${path.relative(dir, p)}:${s.size}:${s.mtimeMs}`); if (s.isDirectory()) camina(p); } };
  camina(dir); return files.join('\n');
}

test('el contenidor per defecte és el del repositori principal (també des d’un worktree), sense rutes absolutes al codi', () => {
  assert.equal(CONTENIDOR_PER_DEFECTE, contenidorDe(REPOSITORI));
  const codi = fs.readFileSync(EINA, 'utf8');
  assert.doesNotMatch(codi, /\/Users\//);
});

test('contenidorDe: des d’un worktree enllaçat torna el contenidor del repositori principal, i ignora GIT_DIR', () => {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-worktree-')));
  try {
    const principal = path.join(base, 'Contenidor', 'socdepoble.org');
    fs.mkdirSync(principal, { recursive: true });
    const git = (...a) => execFileSync('git', a, { env: ENV, encoding: 'utf8' });
    git('-C', principal, 'init', '-q'); fs.writeFileSync(path.join(principal, 'a.txt'), 'a'); git('-C', principal, 'add', '.'); git('-C', principal, 'commit', '-q', '-m', 'a');
    const wt = path.join(base, 'altre_lloc', 'wt');
    git('-C', principal, 'worktree', 'add', '-q', wt);
    assert.equal(contenidorDe(wt), path.join(base, 'Contenidor'));
    const abans = process.env.GIT_DIR; process.env.GIT_DIR = '/tmp';
    try { assert.equal(contenidorDe(wt), path.join(base, 'Contenidor')); } finally { if (abans === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = abans; }
    const sense = path.join(base, 'sense_git', 'repo'); fs.mkdirSync(sense, { recursive: true });
    assert.equal(contenidorDe(sense), path.join(base, 'sense_git'));
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('--audit: un contenidor sa amb mapa de la Wiki i cartell dona salut neta', () => contenidor((dir) => {
  const r = auditaContenidor(dir);
  assert.equal(r.teMapaWiki, true); assert.equal(r.teCartell, true);
  assert.equal(r.salutEstructuralOk, true, JSON.stringify(r));
}));

test('--audit: cada condició de salut, per separat, posa la salut en roig', () => {
  const casos = [
    ['carpeta fora de mapa', (dir) => fs.mkdirSync(path.join(dir, '_inventada_de_poble')), (r) => r.noCanoniquesArrel.includes('_inventada_de_poble')],
    ['symlink no autoritzat a l’arrel', (dir) => fs.symlinkSync('_cultura_de_poble', path.join(dir, '_drecera')), (r) => r.symlinksNoAutoritzats.some((s) => s.relPath === '_drecera')],
    ['symlink no autoritzat dins d’un fons', (dir) => fs.symlinkSync('/etc', path.join(dir, '_gestoria_de_poble', 'fora')), (r) => r.symlinksNoAutoritzats.some((s) => s.relPath === '_gestoria_de_poble/fora')],
    ['fitxer buit dins d’un fons', (dir, escriu) => escriu('_gestoria_de_poble/buit.txt', ''), (r) => r.fitxersBuits.includes('_gestoria_de_poble/buit.txt')],
    ['fitxer buit a la carpeta pare', (dir, escriu, base) => fs.writeFileSync(path.join(base, 'buit_pare.txt'), ''), (r) => r.fitxersBuitsPare.length === 1],
    ['sense mapa de la Wiki', (dir) => fs.unlinkSync(path.join(dir, 'socdepoble.org', MAPA_WIKI)), (r) => r.teMapaWiki === false],
    ['sense cartell ni mapa d’arrel', (dir) => fs.unlinkSync(path.join(dir, 'README.md')), (r) => r.teCartell === false]
  ];
  for (const [nom, prepara, comprova] of casos) contenidor((dir, escriu, base) => {
    prepara(dir, escriu, base);
    const r = auditaContenidor(dir);
    assert.equal(r.salutEstructuralOk, false, nom);
    assert.ok(comprova(r), nom);
  });
});

test('--audit: un camí d’escaneig amb un tros enllaçat es registra i no s’hi entra (mai ix del contenidor)', () => contenidor((dir, escriu, base) => {
  const fora = path.join(base, 'fora'); fs.mkdirSync(path.join(fora, 'assets', 'uploads'), { recursive: true });
  fs.writeFileSync(path.join(fora, 'assets', 'uploads', 'buit.txt'), '');
  fs.rmSync(path.join(dir, 'socdepoble.org', 'public'), { recursive: true, force: true });
  fs.symlinkSync(fora, path.join(dir, 'socdepoble.org', 'public'));
  const r = auditaContenidor(dir);
  assert.ok(r.symlinksNoAutoritzats.some((s) => s.relPath === 'socdepoble.org/public'));
  assert.equal(r.fitxersBuits.some((f) => f.includes('buit.txt')), false, 'no ha entrat a l’enllaç');
}));

test('--audit: duplicats i homònims s’informen sense jutjar-los', () => contenidor((dir, escriu) => {
  const pesat = 'x'.repeat(600 * 1024);
  escriu('_cultura_de_poble/a.bin', pesat); escriu('_multimedia_de_poble/b.bin', pesat);
  fs.mkdirSync(path.join(dir, '_cultura_de_poble', 'Fotos Festa')); fs.mkdirSync(path.join(dir, '_multimedia_de_poble', 'fotos_festa'));
  const r = auditaContenidor(dir);
  assert.equal(r.fitxersDuplicats.length, 1); assert.equal(r.fitxersDuplicats[0].justificacioCanonica, null);
  assert.ok(r.carpetesHomonimes.some((h) => h.nomNormalitzat === 'fotos_festa'));
  assert.equal(r.salutEstructuralOk, true);
}));

test('--on-va: paraules senceres; el receptari va a menjar_i_beure, un informe a l’Escriptori i «Claude» mai a la caixa forta', () => {
  assert.equal(recomanaUbicacio('llibre pdf de receptes de cuina').destiCanonic, '_cultura_de_poble/menjar_i_beure_de_poble/');
  assert.equal(recomanaUbicacio('informe de Claude').destiCanonic, 'socdepoble.org/');
  assert.notEqual(recomanaUbicacio('nota de Claude').destiCanonic, '_oficina_de_poble/');
  assert.equal(recomanaUbicacio('certificat p12 de la botiga').destiCanonic, '_oficina_de_poble/');
  assert.equal(recomanaUbicacio('xyzzy').destiCanonic, 'CONSULTAR_MESTRE');
  assert.notEqual(recomanaUbicacio('readme del mapa').destiCanonic, 'README.md');
});

test('--inventari: compta fitxers i mida, detecta noms codificats o invisibles, enllaços que ixen, i ignora node_modules', () => contenidor((dir, escriu, base) => {
  escriu('_investigacio_ia_de_poble/Som%20de%20Poble/nota.md', 'abc');
  escriu('socdepoble.org/node_modules/pesat/index.js', 'x'.repeat(1000));
  fs.symlinkSync('../_cultura_de_poble', path.join(dir, '_investigacio_ia_de_poble/enllac'));
  fs.symlinkSync(base, path.join(dir, '_investigacio_ia_de_poble/fora'));
  fs.mkdirSync(path.join(dir, 'socdepoble.org/.claude/skills'), { recursive: true });
  fs.symlinkSync('../../.agents/skills/core-x', path.join(dir, 'socdepoble.org/.claude/skills/core-x'));
  const r = inventari(dir);
  const inv = r.entrades.find((e) => e.nom === '_investigacio_ia_de_poble');
  assert.equal(inv.fitxers, 1); assert.equal(inv.bytes, 3);
  assert.deepEqual(inv.estranys.map((x) => x.relPath), ['_investigacio_ia_de_poble/Som%20de%20Poble']);
  assert.deepEqual(inv.symlinks.map((x) => [path.basename(x.relPath), x.surt]).sort(), [['enllac', false], ['fora', true]]);
  assert.deepEqual(r.symlinksQueSurten.map((x) => path.basename(x.relPath)), ['fora']);
  const repo = r.entrades.find((e) => e.nom === 'socdepoble.org');
  assert.ok(repo.ignorats.includes('socdepoble.org/node_modules'));
  assert.equal(repo.symlinks.find((x) => x.relPath.endsWith('core-x')).autoritzat, true, 'el mirall local de skills està autoritzat');
  assert.deepEqual(r.foraDeMapa, []);
  assert.match(textInventari(r).join('\n'), /codificat per URL/);
  assert.match(textInventari(r).join('\n'), /que ix del contenidor/);
  assert.throws(() => inventari(dir, { profunditatMaxima: 0 }), /--profunditat/);
}));

test('nomEstrany: codificat, espais als extrems, control i invisibles; la icona del Finder no', () => {
  assert.equal(nomEstrany('Som%20de%20Poble'), 'codificat per URL');
  assert.equal(nomEstrany(' carpeta'), 'espais als extrems');
  assert.equal(nomEstrany('a\u0007b'), 'caràcters de control');
  assert.equal(nomEstrany('Som\u200Bde Poble'), 'caràcters invisibles');
  assert.equal(nomEstrany('carpeta\u202E'), 'caràcters invisibles');
  assert.equal(nomEstrany('Icon\r'), null);
  assert.equal(nomEstrany('_cultura_de_poble'), null);
});

test('CLI: codis d’eixida, --strict i cap escriptura al contenidor', () => contenidor((dir) => {
  const abans = empremtaDe(dir);
  assert.equal(cli('--audit', `--arrel=${dir}`).status, 0);
  assert.equal(cli('--audit', '--strict', `--arrel=${dir}`).status, 0);
  assert.equal(cli('--inventari', '--strict', '--json', `--arrel=${dir}`).status, 0);
  assert.equal(cli('--on-va', 'informe', 'de', 'Claude').status, 0);
  assert.equal(empremtaDe(dir), abans, 'cap ordre no escriu res al contenidor');
  assert.equal(cli('--opcio-inventada').status, 2);
  assert.equal(cli('--on-va').status, 2);
  assert.equal(cli('--inventari', '--profunditat=0', `--arrel=${dir}`).status, 2);
  fs.mkdirSync(path.join(dir, '_inventada_de_poble'));
  assert.equal(cli('--audit', '--strict', `--arrel=${dir}`).status, 1);
  assert.equal(cli('--inventari', '--strict', `--arrel=${dir}`).status, 1);
}));
