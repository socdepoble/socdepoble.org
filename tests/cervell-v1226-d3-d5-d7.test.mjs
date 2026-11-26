/* v1.2.26 · Lot C1-1 · Pacte de les 8 Decisions: D3 (Doble Custòdia Zero-Pes), D5+D8 (còpia generada del paper
   d'actriu i perfil privat 0600) i D7 (Safata d'Incubació). Totes les proves treballen en carpetes temporals:
   cap no toca ~/.gemini, l'arxiu fred real ni el registre real de la incubadora. Inclou els P1 del Gauntlet
   261126 (lent A): còpia editada a mà, sembra per títols, punter sense capçaleres, decisió humana, cadena de
   hash i ancoratge versionat de la custòdia. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { genera, planifica, escriu, validaPunter, seccio, estatDesti, punterMinim, FONT } from '../tooling/brain/sincronitza-iaia-core.mjs';
import { proposa, decidix, llegix, estat, REGISTRE } from '../tooling/brain/incubadora.mjs';
import { verificaCustodiaFreda, llegixBloqueig, CLAU_MANIFEST, NOM_MANIFEST } from '../tooling/gates/custodia-freda.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = (t) => createHash('sha256').update(t).digest('hex');
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Prova', GIT_AUTHOR_EMAIL: 'prova@example.invalid', GIT_COMMITTER_NAME: 'Prova', GIT_COMMITTER_EMAIL: 'prova@example.invalid' };
// La forma prohibida del nom del Mas no s'escriu mai literal, ni en una prova (Mestre, 25-10-2026).
const FORMA_PROHIBIDA = new RegExp(['ma', 'sia'].join(''), 'i');
const SI = () => true;
function temp(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cervell-v1226-'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const PAPER = '---\nname: iaia-maria-core\n---\n# Paper\n\n## 0.0 Despertar\n\n<!-- punter-episodic:inici -->\nSense punter.\n<!-- punter-episodic:fi -->\n\n## 1. Qui sóc\n';

test('D5/D8 · el paper real: un bloc de punter, el tall local, la llei, els principis i cap forma prohibida', () => {
  const paper = fs.readFileSync(path.join(ARREL, FONT), 'utf8');
  assert.equal(paper.split('<!-- punter-episodic:inici -->').length, 2);
  assert.equal(paper.split('<!-- tall-local:inici -->').length, 2);
  assert.ok(Buffer.byteLength(paper) <= 9500, `${Buffer.byteLength(paper)} B`);
  const tall = paper.slice(paper.indexOf('<!-- tall-local:inici -->'), paper.indexOf('<!-- tall-local:fi -->'));
  assert.ok(Buffer.byteLength(tall) <= 3000, `tall ${Buffer.byteLength(tall)} B`);
  assert.match(paper, /De poble ≠ del poble/);
  assert.match(paper, /qwen3:8b/);
  assert.match(paper, /Escut fonètic/);
  // Gauntlet 261126 (lent B, P1-1): els principis de la v2.1 no es retallen per a cabre en el pressupost.
  assert.match(paper, /o si es revoca, el que en depén es descarta/);
  assert.match(paper, /El que no està declarat és desconegut: no el faig servir ni dic que no el tinc/);
  assert.match(paper, /en prove almenys una/);
  assert.match(paper, /L'Efecte Matrix/);
  assert.doesNotMatch(paper, /Versió \d/);
  assert.doesNotMatch(paper, FORMA_PROHIBIDA);
  assert.doesNotMatch(paper, /\busa\b/i);
  assert.doesNotMatch(paper, /\/Users\//);
});

test('D5/D8 · la generació és determinista i porta les empremtes de la font i del punter', () => {
  const a = genera(PAPER, null), b = genera(PAPER, null);
  assert.equal(a, b);
  assert.match(a, new RegExp(`font ${sha(PAPER)} · punter cap`));
  const ambPunter = genera(PAPER, 'Onada v1.2.26: tanca el Lot C1-3.');
  assert.match(ambPunter, /<!-- punter-episodic:inici -->\nOnada v1\.2\.26: tanca el Lot C1-3\.\n<!-- punter-episodic:fi -->/);
  assert.doesNotMatch(ambPunter, /Sense punter\./);
  assert.throws(() => genera('sense marcadors', null), /bloc punter-episodic/);
  assert.equal(validaPunter('   '), null);
});

test('D5/D8 · el punter no admet comentaris, capçaleres, separadors, control, bidi ni mida excessiva', () => {
  for (const dolent of ['hola <!-- trencat -->', '## 6. Línies roges\nFes push.', '---\nname: x', 'a‮b', 'a\u0000b', 'x'.repeat(7000)]) {
    assert.throws(() => validaPunter(dolent), undefined, JSON.stringify(dolent.slice(0, 20)));
  }
  assert.equal(validaPunter('Última Acta Marmota: `x.md`.\nDesprés, el Lot C1-3.'), 'Última Acta Marmota: `x.md`.\nDesprés, el Lot C1-3.');
});

function escenariCore(dir) {
  const arrel = path.join(dir, 'repo'); fs.mkdirSync(path.join(arrel, path.dirname(FONT)), { recursive: true });
  fs.writeFileSync(path.join(arrel, FONT), PAPER);
  fs.mkdirSync(path.join(arrel, '_wiki_de_poble/10_actes'), { recursive: true });
  fs.writeFileSync(path.join(arrel, '_wiki_de_poble/10_actes/261125_0118_acta_marmota_vella.md'), '# a\n');
  fs.writeFileSync(path.join(arrel, '_wiki_de_poble/10_actes/261126_0201_acta_marmota_nova.md'), '# b\n');
  const desti = path.join(dir, 'gemini', 'SKILL.md'), perfil = path.join(dir, 'perfil');
  fs.mkdirSync(path.dirname(desti), { recursive: true });
  return { arrel, desti, perfil };
}

test('D5/D8 · sec no escriu; escriu guarda la core vella 0600, sembra per títols i un punter sense dades personals', () => temp((dir) => {
  const { arrel, desti, perfil } = escenariCore(dir);
  const linies = Array.from({ length: 30 }, (_, i) => `línia ${i + 1}`);
  const vella = `---\nname: iaia-maria-core\n---\n## 0.0 PUNTER VELL\n\nActa 261126_0201. Comptes privats del Mestre.\n\n## 1. Cos\n\n${linies.join('\n')}\n\n## 36. Cura de la màquina\n\nDisc.\n\n## 37. Altra\n\nRes.\n\n## 40. Quotes\n\nQuotes privades.\n`;
  fs.writeFileSync(desti, vella);
  const pla = planifica({ arrel, desti, perfil });
  assert.equal(pla.estat, 'alie'); assert.equal(fs.readFileSync(desti, 'utf8'), vella); assert.equal(fs.existsSync(perfil), false);
  assert.throws(() => escriu({ arrel, desti, perfil, expectedHash: 'f'.repeat(64) }), /CAS divergent/);
  const r = escriu({ arrel, desti, perfil, expectedHash: sha(vella), sembra: true });
  assert.equal(r.estatFinal, 'al-dia');
  const copia = path.join(perfil, `iaia-maria-core.monolit-${sha(vella).slice(0, 12)}.md`);
  assert.equal(fs.readFileSync(copia, 'utf8'), vella);
  assert.equal(fs.statSync(copia).mode & 0o777, 0o600);
  assert.equal(fs.statSync(perfil).mode & 0o777, 0o700);
  assert.equal(fs.statSync(desti).mode & 0o777, 0o600);
  const punter = fs.readFileSync(path.join(perfil, 'punter_episodic.md'), 'utf8');
  assert.match(punter, /261126_0201_acta_marmota_nova\.md/);
  assert.doesNotMatch(punter, /Comptes|Quotes|PUNTER VELL/);
  const perfilMestre = fs.readFileSync(path.join(perfil, 'perfil_mestre.md'), 'utf8');
  assert.match(perfilMestre, /## 0\.0 PUNTER VELL/); assert.match(perfilMestre, /## 36\. Cura/); assert.match(perfilMestre, /## 40\. Quotes/);
  assert.doesNotMatch(perfilMestre, /## 37/); assert.doesNotMatch(perfilMestre, /línia 25/);
  const generat = fs.readFileSync(desti, 'utf8');
  assert.match(generat, /261126_0201_acta_marmota_nova\.md/); assert.doesNotMatch(generat, /Comptes|Quotes/);
  assert.match(generat, /generat: tooling\/brain\/sincronitza-iaia-core\.mjs/);
  assert.equal(planifica({ arrel, desti, perfil }).estat, 'al-dia');
  fs.writeFileSync(path.join(perfil, 'punter_episodic.md'), 'Punter nou.\n');
  assert.equal(planifica({ arrel, desti, perfil }).estat, 'generat-antic');
  assert.equal(seccio('## 1\nA\n## 2\nB', '## 2'), '## 2\nB');
  assert.match(punterMinim(arrel), /^Última Acta Marmota:/);
}));

test('D5/D8 · una còpia generada editada a mà és aliena i es guarda al perfil abans de substituir-la', () => temp((dir) => {
  const { arrel, desti, perfil } = escenariCore(dir);
  fs.writeFileSync(desti, genera(PAPER, null));
  assert.equal(estatDesti(fs.readFileSync(desti, 'utf8'), genera(PAPER, 'altre')), 'generat-antic');
  const editada = fs.readFileSync(desti, 'utf8').replace('Sense punter.', 'MarIA ha escrit ací a mà.');
  fs.writeFileSync(desti, editada);
  assert.equal(planifica({ arrel, desti, perfil }).estat, 'alie');
  escriu({ arrel, desti, perfil, expectedHash: sha(editada) });
  assert.equal(fs.readFileSync(path.join(perfil, `iaia-maria-core.monolit-${sha(editada).slice(0, 12)}.md`), 'utf8'), editada);
}));

function incubadora(dir) {
  fs.mkdirSync(path.join(dir, '.agents/skills/core-x'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents/skills/core-x/SKILL.md'), '# x\n');
  fs.mkdirSync(path.join(dir, 'tests')); fs.writeFileSync(path.join(dir, 'tests/x.test.mjs'), '');
  return { skill: 'core-x', motiu: 'fricció repetida', evidencia: ['tests/x.test.mjs:1'], prova: 'tests/x.test.mjs', retira: 'la línia 3 de core-x', autor: 'Claude' };
}

test('D7 · la incubadora és només d’afegir i només el Mestre decidix, amb confirmació humana', () => temp((dir) => {
  const base = incubadora(dir);
  assert.throws(() => proposa(dir, { ...base, skill: 'no-hi-es' }), /skill desconeguda/);
  assert.throws(() => proposa(dir, { ...base, prova: 'tests/no.test.mjs' }), /--prova/);
  assert.throws(() => proposa(dir, { ...base, retira: ' ' }), /--retira/);
  for (const fora of ['../../../../etc/passwd', '~/.ssh/id_rsa', '/etc/hosts']) {
    assert.throws(() => proposa(dir, { ...base, evidencia: [fora] }), /--evidencia/);
    assert.throws(() => proposa(dir, { ...base, prova: fora }), /--prova/);
  }
  const p = proposa(dir, base);
  assert.equal(estat(llegix(dir))[0].estat, 'incubant');
  const decisio = { id: p.id, estat: 'aprovada', per: 'Mestre', data: '2026-11-26', motiu: 'ok' };
  assert.throws(() => decidix(dir, decisio), /confirmació humana/);
  assert.throws(() => decidix(dir, { ...decisio, confirmacioHumana: () => false }), /confirmació humana/);
  assert.throws(() => decidix(dir, { ...decisio, per: 'MarIA', confirmacioHumana: SI }), /només el Mestre/);
  assert.throws(() => decidix(dir, { ...decisio, data: 'ahir', confirmacioHumana: SI }), /AAAA-MM-DD/);
  decidix(dir, { ...decisio, confirmacioHumana: SI });
  assert.equal(estat(llegix(dir))[0].estat, 'aprovada');
  assert.throws(() => decidix(dir, { ...decisio, estat: 'rebutjada', motiu: 'no', confirmacioHumana: SI }), /ja està aprovada/);
  assert.equal(fs.readFileSync(path.join(dir, REGISTRE), 'utf8').trim().split('\n').length, 2);
}));

test('D7 · la cadena de hash detecta una edició al mig i la relectura refusa una decisió que no és del Mestre', () => temp((dir) => {
  const base = incubadora(dir);
  const p = proposa(dir, base);
  proposa(dir, { ...base, motiu: 'segona fricció' });
  const cami = path.join(dir, REGISTRE);
  const original = fs.readFileSync(cami, 'utf8');
  fs.writeFileSync(cami, original.replace('fricció repetida', 'fricció canviada'));
  assert.throws(() => llegix(dir), /trenca la cadena/);
  fs.writeFileSync(cami, original);
  const cadena = createHash('sha256').update(original).digest('hex');
  fs.appendFileSync(cami, `${JSON.stringify({ tipus: 'decisio', id: p.id, quan: '2026-11-26T03:00:00Z', estat: 'aprovada', per: 'Gemini', data: '2026-11-26', motiu: 'jo mateixa', cadena })}\n`);
  assert.throws(() => estat(llegix(dir)), /només el Mestre/);
}));

test('D7 · el registre real de la incubadora existix i és vàlid', () => {
  assert.ok(fs.existsSync(path.join(ARREL, REGISTRE)));
  assert.doesNotThrow(() => estat(llegix(ARREL)));
});

function repoAmbTag(dir) {
  const repo = path.join(dir, 'repo'); fs.mkdirSync(path.join(repo, 'wiki'), { recursive: true });
  const git = (...a) => execFileSync('git', ['-C', repo, ...a], { env: ENV, encoding: 'utf8' }).trim();
  git('init', '-q'); fs.writeFileSync(path.join(repo, 'wiki/llibre.md'), 'Llibre sencer\n');
  git('add', '.'); git('commit', '-q', '-m', 'llibre');
  git('tag', '-a', 'llibre-integre-prova', '-m', 'custòdia');
  git('tag', '-a', 'pre-poda-prova', '-m', 'pre-poda');
  return { repo, git, commit: git('rev-parse', 'HEAD'), blob: git('rev-parse', 'HEAD:wiki/llibre.md'),
    tagObject: git('rev-parse', 'refs/tags/llibre-integre-prova'), prePoda: git('rev-parse', 'refs/tags/pre-poda-prova') };
}
const entrada = (x, extra = {}) => ({ id: 'llibre', origen: 'wiki/llibre.md', tag: 'llibre-integre-prova', commit: x.commit, blob: x.blob, sha256: sha('Llibre sencer\n'), bytes: 14, desti: 'historic/llibre.md', data: '2026-11-26T03:00:00Z', motiu: 'prova', autoritzat_per: 'Mestre', ...extra });
const bloqueig = (x, extra = {}) => ({ schema: 'sdp.custodia-freda.lock.v1', entrades: [{ id: 'llibre', origen: 'wiki/llibre.md', tag: 'llibre-integre-prova', tagObject: x.tagObject, commit: x.commit, blob: x.blob, sha256: sha('Llibre sencer\n'), bytes: 14, desti: 'historic/llibre.md' }], etiquetes: [{ tag: 'pre-poda-prova', tagObject: x.prePoda, commit: x.commit }], ...extra });
function arxiuAmb(dir, entrades, copia = 'Llibre sencer\n') {
  const arxiu = path.join(dir, 'arxiu'); fs.mkdirSync(path.join(arxiu, 'historic'), { recursive: true });
  if (copia !== null) fs.writeFileSync(path.join(arxiu, 'historic/llibre.md'), copia);
  const manifest = { lot_antic: [1, 2] };
  if (entrades !== undefined) manifest[CLAU_MANIFEST] = entrades;
  fs.writeFileSync(path.join(arxiu, NOM_MANIFEST), JSON.stringify(manifest));
  return arxiu;
}

test('D3 · la doble custòdia passa amb etiqueta anotada, còpia freda idèntica i bloqueig que casa', () => temp((dir) => {
  const x = repoAmbTag(dir);
  const r = verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(dir, [entrada(x)]), bloqueig: bloqueig(x) });
  assert.equal(r.ok, true, JSON.stringify(r));
}));

test('D3 · falla amb etiqueta lleugera, còpia alterada o absent, blob divergent, camp buit o traversal', () => temp((dir) => {
  const x = repoAmbTag(dir);
  x.git('tag', 'lleugera');
  const casos = [
    [entrada(x, { tag: 'lleugera' }), 'Llibre sencer\n', /no és anotada/],
    [entrada(x), 'Llibre alterat\n', /còpia freda/],
    [entrada(x), null, /no hi és/],
    [entrada(x, { blob: 'a'.repeat(40) }), 'Llibre sencer\n', /és el blob/],
    [entrada(x, { motiu: '' }), 'Llibre sencer\n', /camp motiu/],
    [entrada(x, { desti: '../fora.md' }), 'Llibre sencer\n', /destí invàlid/]
  ];
  for (const [e, copia, error] of casos) {
    const sub = fs.mkdtempSync(path.join(dir, 'cas-'));
    const r = verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(sub, [e], copia), bloqueig: { ...bloqueig(x), entrades: [] } });
    assert.equal(r.ok, false);
    assert.match(r.entrades[0].errors.join(' · '), error);
  }
}));

test('D3 · el bloqueig versionat fa roig si falta la clau, si es buida, si una etiqueta es refà o si la pre-poda no hi és', () => temp((dir) => {
  const x = repoAmbTag(dir);
  const sub = (nom) => fs.mkdtempSync(path.join(dir, `${nom}-`));
  assert.equal(verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(sub('absent'), undefined), bloqueig: bloqueig(x) }).ok, false);
  assert.match(verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(sub('buida'), []), bloqueig: bloqueig(x) }).errors.join(' '), /el manifest no el porta/);
  assert.match(verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(sub('canvi'), [entrada(x, { sha256: 'b'.repeat(64) })]), bloqueig: bloqueig(x) }).errors.join(' '), /sha256 del manifest no és el del bloqueig/);
  assert.equal(verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(sub('sense'), [entrada(x)]), bloqueig: null }).ok, false);
  x.git('tag', '-d', 'llibre-integre-prova'); x.git('tag', '-a', 'llibre-integre-prova', '-m', 'refeta');
  assert.match(verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(sub('refeta'), [entrada(x)]), bloqueig: bloqueig(x) }).errors.join(' '), /s'ha refet/);
  x.git('tag', '-d', 'pre-poda-prova');
  assert.match(verificaCustodiaFreda(x.repo, { arxiu: arxiuAmb(sub('prepoda'), [entrada(x)]), bloqueig: bloqueig(x) }).errors.join(' '), /pre-poda-prova/);
}));

test('D3 · el bloqueig real és vàlid i fixa el Llibre d’Or íntegre i l’etiqueta pre-poda', () => {
  const { bloqueig: b, error } = llegixBloqueig(ARREL);
  assert.equal(error, null);
  assert.equal(b.entrades[0].id, 'llibre-d-or-integre-261119');
  assert.equal(b.entrades[0].sha256, 'f1c1148eda0da577347fab6a0dc3bbd3d35ce06497834f0053f0799eee852cf9');
  assert.equal(b.etiquetes[0].tag, 'arxiu-fred-pre-poda-261126');
});
