#!/usr/bin/env node
/** Explicit abandonment reconciliation. Never deletes turns or creates receipts. */
import fs from 'node:fs';
import path from 'node:path';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { sanejaTornsCaducats, verificaTracaCaducitat } from '../session/saneja_torns_caducats.mjs';
import { validaSolicitudBaseEfimera } from '../session/base-efimera.mjs';
import { canonical } from '../documental/core.mjs';

export function reconciliaTornsCaducats(root, { ara = Date.now(), apply = false, ephemeral = null } = {}) {
  root = fs.realpathSync(root);
  const result = sanejaTornsCaducats(root, { ara, sec: !apply, ephemeral });
  const traces = [];
  if (apply) {
    const dir = path.join(root, '.agents/runtime/turns');
    const unsafe = fs.existsSync(dir) && canonical(dir) !== dir;
    if (unsafe) result.errors.push({ file: '.agents/runtime/turns', error: 'Directori de torns substituït; no es llig cap registre alié' });
    const names = unsafe ? [] : ephemeral ? [`${ephemeral.turnId}.json`] : fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => /^torn_.+\.json$/.test(n)).sort() : [];
    for (const name of names) {
      try {
        const file = path.join(dir, name), st = fs.lstatSync(file);
        if (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1) throw new Error('Registre no regular');
        const turn = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (turn.closure?.schema === 'sdp.turn-expiry.v1') traces.push(verificaTracaCaducitat(root, turn.closure.audit));
      } catch (error) { result.errors.push({ file: `.agents/runtime/turns/${name}`, error: error.message }); }
    }
  }
  return { schema: 'sdp.turn-expiry.reconciliation.v1', rellotge: new Date(ara).toISOString(),
    mode: apply ? 'apply' : 'dry-run', ...result, traces,
    valid: result.valid && result.errors.length === 0,
    noCertifica: ['La caducitat és abandó administratiu, mai execució verificada ni rebut documental.',
      'Els torns tancats sense rebut continuen bloquejant la Consola.',
      'La base absent només és una observació de Git local; l’origen efímer és una declaració explícita.',
      'CAS i pany cooperatiu per torn; un procés extern que ignore el pany pot causar conflicte.'] };
}

/** No clock override: injected timestamps belong exclusively to the callable test API. */
export function opcionsReconciliacio(args) {
  const values = new Map(), flags = new Set();
  const keys = new Map([['turn-id', 'turnId'], ['expected-base', 'base'], ['expected-sha256', 'sha256'], ['reason', 'reason']]);
  for (const arg of args) {
    if (['--apply', '--dry-run', '--json', '--unreconstructible-ephemeral-base'].includes(arg)) {
      if (flags.has(arg)) throw new Error(`Bandera duplicada: ${arg}`);
      flags.add(arg); continue;
    }
    const match = /^--([a-z0-9-]+)=(.+)$/.exec(arg);
    if (!match || (!keys.has(match[1]) && match[1] !== 'arrel') || values.has(match[1])) throw new Error('Argument de reconciliació desconegut o duplicat');
    values.set(match[1], match[2]);
  }
  if (flags.has('--apply') && flags.has('--dry-run')) throw new Error('--apply i --dry-run són excloents');
  const targeted = flags.has('--unreconstructible-ephemeral-base');
  if (!targeted && [...keys.keys()].some(key => values.has(key))) throw new Error('Cal declarar --unreconstructible-ephemeral-base per a una base absent');
  const ephemeral = targeted ? validaSolicitudBaseEfimera(Object.fromEntries([...keys].map(([key, field]) => [field, values.get(key)]))) : null;
  return { apply: flags.has('--apply'), ephemeral };
}
if (esMain(import.meta.url)) {
  try {
    const options = opcionsReconciliacio(process.argv.slice(2));
    // The command always observes the actual clock. Injected clocks are confined to tests.
    const result = reconciliaTornsCaducats(arrelSegura(), options);
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.valid ? 0 : 1;
  } catch (error) { console.log(JSON.stringify({ valid: false, error: error.message })); process.exitCode = 2; }
}
