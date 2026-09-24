// DESTÍ: tests/time-machine.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { instantania, llista, poda, trieRetencio, referencia, plistLlancador, DENEGATS } from '../tooling/brain/time-machine.mjs';

const git = (arrel, ...args) => execFileSync('git', ['-C', arrel, '-c', 'commit.gpgsign=false', ...args], { encoding: 'utf8' }).trim();

/** Un repositori de prova amb un commit i la branca `main`. */
function repositori() {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'time-machine-'));
  git(arrel, 'init', '-q', '-b', 'main');
  git(arrel, 'config', 'user.name', 'Prova');
  git(arrel, 'config', 'user.email', 'prova@localhost');
  fs.writeFileSync(path.join(arrel, 'seguit.txt'), 'u\n');
  fs.writeFileSync(path.join(arrel, '.gitignore'), 'ignorat.txt\n');
  git(arrel, 'add', '-A');
  git(arrel, 'commit', '-q', '-m', 'inici');
  return arrel;
}

test('fotografia també els fitxers no seguits i no toca HEAD, l’índex ni la branca', () => {
  const arrel = repositori();
  const head = git(arrel, 'rev-parse', 'HEAD');
  fs.writeFileSync(path.join(arrel, 'nou.txt'), 'text de MarIA sense commit\n');
  fs.writeFileSync(path.join(arrel, 'ignorat.txt'), 'no\n');
  const r = instantania(arrel, { ara: new Date('2026-09-24T12:00:00Z') });
  assert.equal(r.fet, true);
  assert.equal(r.ref, 'refs/time-machine/main');
  assert.equal(git(arrel, 'show', `${r.ref}:nou.txt`), 'text de MarIA sense commit');
  assert.throws(() => git(arrel, 'show', `${r.ref}:ignorat.txt`));
  assert.equal(git(arrel, 'rev-parse', 'HEAD'), head);
  assert.equal(git(arrel, 'status', '--porcelain'), '?? nou.txt');
});

test('si l’arbre no ha canviat no escriu res', () => {
  const arrel = repositori();
  const primera = instantania(arrel, { ara: new Date('2026-09-24T12:00:00Z') });
  const segona = instantania(arrel, { ara: new Date('2026-09-24T12:30:00Z') });
  assert.equal(segona.fet, false);
  assert.equal(segona.motiu, 'sense canvis');
  assert.equal(git(arrel, 'rev-parse', primera.ref), primera.commit);
});

test('avorta si un fitxer nou té nom de secret', () => {
  const arrel = repositori();
  fs.writeFileSync(path.join(arrel, '.env.local'), 'CLAU=x\n');
  const r = instantania(arrel);
  assert.equal(r.fet, false);
  assert.deepEqual(r.secrets, ['.env.local']);
  assert.equal(DENEGATS.test('src/app/App.jsx'), false);
  assert.equal(DENEGATS.test('.wwebjs_auth/session/x'), true);
});

test('la retenció es queda totes les de 48 h, una per hora fins a 14 dies i una per dia després', () => {
  const ara = Date.parse('2026-09-24T12:00:00Z') / 1000;
  const fa = (segons) => ({ commit: String(segons), data: new Date((ara - segons) * 1000).toISOString() });
  // 3 d + 60 s i 3 d + 120 s cauen dins de la mateixa hora (11:59 i 11:58);
  // 20 d + 60 s i 20 d + 3600 s, dins del mateix dia.
  const totes = [fa(60), fa(3600 * 30), fa(3 * 86400 + 60), fa(3 * 86400 + 120), fa(20 * 86400 + 60), fa(20 * 86400 + 3600)];
  assert.deepEqual(trieRetencio(totes, ara).map((i) => i.commit),
    [fa(60), fa(3600 * 30), fa(3 * 86400 + 60), fa(20 * 86400 + 60)].map((i) => i.commit));
});

test('la poda reescriu només la referència privada i conserva els arbres', () => {
  const arrel = repositori();
  // Quatre dies abans de la poda: franja horària. 10:00 i 10:10 comparteixen hora.
  const base = Date.parse('2026-09-20T10:00:00Z');
  for (const [minuts, text] of [[0, 'a'], [10, 'b'], [130, 'c']]) {
    fs.writeFileSync(path.join(arrel, 'nou.txt'), `${text}\n`);
    assert.equal(instantania(arrel, { ara: new Date(base + minuts * 60000) }).fet, true);
  }
  const r = poda(arrel, { ara: new Date('2026-09-24T12:00:00Z') });
  assert.equal(r.podat, 1);
  const { instantanies } = llista(arrel);
  assert.equal(instantanies.length, 2);
  assert.equal(git(arrel, 'show', `${referencia(arrel)}:nou.txt`), 'c');
  assert.equal(git(arrel, 'show', `${referencia(arrel)}~1:nou.txt`), 'b');
});

test('el plist del llançador escapa les rutes i no inventa cap usuari', () => {
  const xml = plistLlancador({ arrel: '/Users/x/Som & Poble', node: '/opt/homebrew/bin/node', home: '/Users/x' });
  assert.match(xml, /<string>org\.socdepoble\.time-machine<\/string>/);
  assert.match(xml, /Som &amp; Poble\/tooling\/brain\/time-machine\.mjs/);
  assert.match(xml, /<integer>1800<\/integer>/);
});
