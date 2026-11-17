import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../tooling/gates/tractor-cens.mjs', import.meta.url));

function executa(text) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cens-context-'));
  try {
    fs.mkdirSync(path.join(root, '.agents/skills/core-consell-i-colmena'), { recursive: true });
    fs.mkdirSync(path.join(root, '_wiki_de_poble'), { recursive: true });
    fs.writeFileSync(path.join(root, '.agents/consell.json'), JSON.stringify({
      membres: Array.from({ length: 12 }, (_, i) => ({ id: `membre-${i}`, nom: `Membre ${i}`, fortalesa: 'prova', debilitat: 'prova', rol: 'prova' })),
      no_membres: { NovaIA: 'No forma part del cens de la fixture.' }
    }));
    fs.writeFileSync(path.join(root, '.agents/skills/core-consell-i-colmena/SKILL.md'), 'Font: .agents/consell.json\n');
    fs.writeFileSync(path.join(root, '_wiki_de_poble/context.md'), text);
    const result = spawnSync(process.execPath, [SCRIPT, '--arrel', root], { encoding: 'utf8', timeout: 10_000 });
    assert.equal(result.error, undefined);
    return { code: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

for (const text of [
  'El Consell té només 11 IAs.',
  'El Consell: només onze IAs.',
  'El Consell està format per onze IAs.',
  'Les onze IAs del Consell revisen el treball.',
  'Totes les 11 IAs revisen el treball.',
  'Totes les IAs són onze.',
  'Totes les IAs són 11.',
  'Les IAs del Consell són onze.',
  'L’equip complet té 11 models.',
  'El cens consta de **11 IAs**.',
  'Quatre IAs locals revisen el treball; el Consell té només onze IAs.',
  'El Consell té només 11 IAs i 4 IAs locals fan la primera revisió.'
]) {
  test(`C4 refusa un recompte global contradictori: ${text}`, () => {
    const result = executa(text);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /C4 · Xifra contradictòria/);
  });
}

for (const text of [
  'Les 4 IAs locals (Claude, Codex, Gemini i Node 0) executen la passada.',
  'Les nou IAs revisores del Gauntlet auditen este lot.',
  'La revisió Gauntlet consta de 9 IAs i no declara el recompte del Consell.',
  'El Consell té 12 IAs; quatre IAs locals fan la primera revisió.',
  'El Consell convoca 4 IAs per a una tasca concreta.',
  'Totes les 4 IAs locals han tancat la passada.',
  'Un nou model s’ha afegit al laboratori.',
  'El Consell prova un nou model.',
  'Les dotze IAs del Consell revisen el treball.',
  'Totes les IAs són 12.'
]) {
  test(`C4 preserva un subconjunt o un recompte coherent: ${text}`, () => {
    const result = executa(text);
    assert.equal(result.code, 0, result.output);
  });
}

test('C3 continua refusant un membre explícit fora del cens', () => {
  const result = executa('El Consell inclou NovaIA.');
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /C3 · Membre fora del cens/);
});

// GOV-05 · Un comentari HTML de diverses línies no compta, però no desplaça el número de línia del diagnòstic.
test('C3 i C4 informen la línia real després d’un comentari HTML de quatre línies', () => {
  const capcalera = '# Context\n<!--\nnota interna\nde quatre línies\n-->\n\n';
  for (const [frase, llei] of [['El Consell inclou NovaIA.', /C3 · Membre fora del cens/], ['El Consell té només 11 IAs.', /C4 · Xifra contradictòria/]]) {
    const result = executa(`${capcalera}${frase}\n`);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, llei);
    assert.match(result.output, /_wiki_de_poble\/context\.md:7\n/, result.output);
  }
});

test('C4 conserva qualificadors locals o revisors immediats, també amb un total global correcte a la mateixa línia', () => {
  for (const text of [
    'El Consell té 4 IAs locals.',
    'El Consell compta amb nou models revisors.',
    'Consell de quatre IAs · relleu d’auditoria en curs',
    'Totes les IAs locals són quatre.',
    'El Consell té 4 IAs locals; el Consell té 12 IAs en total.',
    'El Consell té 12 IAs en total; el Consell té 9 IAs revisores.'
  ]) {
    const result = executa(text);
    assert.equal(result.code, 0, result.output);
  }
});

test('C4 no confon un qualificador local amb una exempció d’un total global explícit', () => {
  for (const text of [
    'El Consell té en total 4 IAs locals.',
    'El Consell té en total quatre IAs locals.',
    'El Consell té només 4 IAs locals en total.',
    'Totes les IAs del Consell són 4 IAs locals.',
    'El Consell té 4 IAs locals; el Consell té només 11 IAs en total.',
    'El Consell té només 11 IAs en total; el Consell té 4 IAs locals.'
  ]) {
    const result = executa(text);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /C4 · Xifra contradictòria/);
  }
});
