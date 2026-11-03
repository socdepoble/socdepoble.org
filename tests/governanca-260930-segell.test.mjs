/* Torn torn_d8024ad3 (260930) · Diagnòstic de només lectura del segell de
   skills abans de la reconciliació explícita del Mestre: hash actual complet,
   hash segellat i quines SKILL.md divergixen del manifest. No escriu res. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import { calculaSegell } from '../tooling/gates/segella.mjs';

const ARREL = path.resolve(import.meta.dirname, '..');

test('segell de skills: divergències respecte del manifest segellat (diagnòstic)', () => {
  const segellat = JSON.parse(fs.readFileSync(path.join(ARREL, '.agents/SKILLS_SEAL.json'), 'utf8'));
  const actual = calculaSegell(ARREL);
  const rutes = new Set([...Object.keys(segellat.manifest || {}), ...Object.keys(actual.manifest)]);
  const divergents = [...rutes].sort().filter((r) => segellat.manifest?.[r] !== actual.manifest[r])
    .map((r) => `${r}: ${segellat.manifest?.[r] ? 'segellat' : 'NOU'} → ${actual.manifest[r] ? 'disc' : 'ESBORRAT'}`);
  console.log(`HASH_ACTUAL=${actual.hash}`);
  console.log(`HASH_SEGELLAT=${segellat.hash}`);
  console.log(`DIVERGENTS=${JSON.stringify(divergents)}`);
  assert.equal(typeof actual.hash, 'string');
});


test('API del segell importable des de stdin sense executar la CLI ni llançar ENOENT', () => {
  const url=pathToFileURL(path.join(ARREL,'tooling/gates/segella.mjs')).href;
  const source=`import {calculaSegell} from ${JSON.stringify(url)}; process.stdout.write(typeof calculaSegell);`;
  const r=spawnSync(process.execPath,['--input-type=module','-'],{cwd:ARREL,input:source,encoding:'utf8',timeout:10000});
  assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,'function');
});
