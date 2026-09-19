#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callbackPath = join(__dirname, '../../public/auth/callback.html');

try {
  let html = readFileSync(callbackPath, 'utf8');
  
  // Amb la nova arquitectura, callback.html valida dinàmicament.
  // Ens assegurem que si admet localhost, siga EXCLUSIVAMENT quan el propi relé està servint-se des de localhost.
  const teLocalhost = /localhost|127\.0\.0\.1/i.test(html);
  const teCondicioSegura = html.includes("window.location.hostname === 'localhost'");
  
  if (teLocalhost && !teCondicioSegura) {
    console.error("❌ [SANEJAMENT] ERROR CRÍTIC: callback.html admet localhost de forma insegura (sense verificar window.location.hostname)!");
    process.exit(1);
  }
  
  console.log('✅ [SANEJAMENT] callback.html validat correctament sota la nova política dinàmica.');
} catch (err) {
  console.error('❌ [SANEJAMENT] Fallo crític:', err.message);
  process.exit(1);
}
