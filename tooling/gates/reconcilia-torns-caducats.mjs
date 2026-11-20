#!/usr/bin/env node
/** Explicit abandonment reconciliation. Never deletes turns or creates receipts. */
import fs from 'node:fs';
import path from 'node:path';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { sanejaTornsCaducats, verificaTracaCaducitat } from '../session/saneja_torns_caducats.mjs';

export function reconciliaTornsCaducats(root, { ara = Date.now(), apply = false } = {}) {
  const result = sanejaTornsCaducats(root, { ara, sec: !apply });
  const traces = [];
  if (apply) {
    const dir = path.join(root, '.agents/runtime/turns');
    if (fs.existsSync(dir)) for (const name of fs.readdirSync(dir).filter(n => /^torn_.+\.json$/.test(n)).sort()) {
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
      'CAS i pany cooperatiu per torn; un procés extern que ignore el pany pot causar conflicte.'] };
}
if (esMain(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some(a => !['--apply', '--dry-run', '--json'].includes(a) && !a.startsWith('--arrel='))
      || (args.includes('--apply') && args.includes('--dry-run'))) throw new Error('Ús: [--apply | --dry-run] [--json] [--arrel=RUTA]');
    // The command always observes the actual clock. Injected clocks are confined to tests.
    const result = reconciliaTornsCaducats(arrelSegura(), { apply: args.includes('--apply') });
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.valid ? 0 : 1;
  } catch (error) { console.log(JSON.stringify({ valid: false, error: error.message })); process.exitCode = 2; }
}
