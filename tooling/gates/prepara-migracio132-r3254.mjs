#!/usr/bin/env node
import { preparaMigracio132 } from './lib/r3254-migracio132.mjs';

try {
  if (process.argv.slice(2).some(arg => arg !== '--sql') || process.argv.slice(2).length > 1) throw new Error('usage: node tooling/gates/prepara-migracio132-r3254.mjs [--sql]');
  const result = preparaMigracio132();
  process.stdout.write(process.argv.includes('--sql') ? result.sql : JSON.stringify(result.report, null, 2) + '\n');
} catch (error) {
  process.stderr.write(String(error.message) + '\n'); process.exitCode = 1;
}
