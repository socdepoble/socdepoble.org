#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callbackPath = join(__dirname, '../../public/auth/callback.html');

try {
  let html = readFileSync(callbackPath, 'utf8');
  
  // Amb la nova arquitectura, callback.html valida dinàmicament i rebutja localhost: (u.hostname !== 'localhost')
  // Comprovem si per descuit hi ha algun orígen de desenvolupament hardcodejat.
  const localhostRegex = /['"]http(s)?:\/\/(localhost|127\.0\.0\.1)(:\d+)?['"]/i;
  
  if (localhostRegex.test(html)) {
    console.error("❌ [SANEJAMENT] ERROR CRÍTIC: callback.html conté dominis 'localhost' hardcodejats al codi!");
    process.exit(1);
  }
  
  console.log('✅ [SANEJAMENT] callback.html validat correctament sota la nova política dinàmica.');
} catch (err) {
  console.error('❌ [SANEJAMENT] Fallo crític:', err.message);
  process.exit(1);
}
