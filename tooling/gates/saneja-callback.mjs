#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callbackPath = join(__dirname, '../../public/auth/callback.html');

try {
  let html = readFileSync(callbackPath, 'utf8');
  
  // Regex que captura l'array ORIGENS_PERMESOS i elimina qualsevol cosa que contingui 'localhost' o '127.0.0.1'
  const regex = /((?:const|var|let)\s+ORIGENS_PERMESOS\s*=\s*\[)([\s\S]*?)(\];)/;
  const match = html.match(regex);
  
  if (match) {
    const origens = match[2].split(',').map(o => o.trim()).filter(Boolean); // Filter empty out
    const origensNets = origens.filter(o => !o.includes('localhost') && !o.includes('127.0.0.1'));
    
    if (origensNets.length < origens.length) {
      const nouArray = `\n      ${origensNets.join(',\n      ')}\n    `;
      html = html.replace(regex, `$1${nouArray}$3`);
      writeFileSync(callbackPath, html, 'utf8');
      console.log('✅ [SANEJAMENT] Orígens de desenvolupament eliminats de callback.html.');
    } else {
      console.log('ℹ️ [SANEJAMENT] callback.html ja està net.');
    }
  } else {
    console.error("❌ [SANEJAMENT] No s'ha trobat la declaració d'ORIGENS_PERMESOS a callback.html!");
    process.exit(1);
  }
  
  // Asseveració post-processament: fallar zumbant si encara queda localhost (només l'esquema)
  if (html.includes('http://localhost') || html.includes('http://127.0.0.1')) {
    console.error("❌ [SANEJAMENT] ERROR CRÍTIC: callback.html encara conté 'http://localhost' després del sanejament!");
    process.exit(1);
  }
} catch (err) {
  console.error('❌ [SANEJAMENT] Fallo crític:', err.message);
  process.exit(1);
}
