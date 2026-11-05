#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { main } from './servidor-node0-soberania.mjs';
import { fitxerRegular } from './fitxers-segurs.mjs';
const file = process.argv[2] || path.join(os.homedir(), '.config/socdepoble/node0.env');
try {
  const {stat} = fitxerRegular(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077 || stat.size > 32768) throw new Error('unsafe_env');
  process.loadEnvFile(file);
  await main(process.env);
} catch { process.stderr.write('node0_secure_start_failed\n'); process.exitCode = 1; }
