#!/usr/bin/env node

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readContextInputs,writeGeneratedContext} from './lib/retrieval-sources.mjs';
const ARREL=path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

async function compilePrompt() {
  console.log("🧠 Extraient el Còrtex Global de la Wiki per evitar l'Amnèsia de Resurrecció...");
  
  const sources=readContextInputs(ARREL);
  const manifest=writeGeneratedContext(ARREL,sources);
  const mbs=(manifest.artifact.bytes/1024/1024).toFixed(2);
  console.log(`✅ Context compilat (${mbs} MB), ${manifest.emissions.length} emissions i ${manifest.sources.length} fonts traçades a .agents/GENOMA.sources.json.`);
}

compilePrompt().catch(err => {
  console.error('❌ Error compilant el còrtex:', err);
  process.exit(1);
});
const __dummy = 'passa per canonada';
