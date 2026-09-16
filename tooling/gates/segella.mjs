#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const agentsDir = path.resolve(process.cwd(), '.agents/skills');
const sealFile = path.resolve(process.cwd(), '.agents/SKILLS_SEAL.json');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllFiles(agentsDir).sort();
let combinedHash = crypto.createHash('sha256');

for (const file of files) {
  const content = fs.readFileSync(file);
  const relativePath = path.relative(process.cwd(), file);
  combinedHash.update(relativePath);
  combinedHash.update(content);
}

const finalHash = combinedHash.digest('hex');

const oldSeal = fs.existsSync(sealFile) ? JSON.parse(fs.readFileSync(sealFile)) : { hash: null };
if (oldSeal.hash !== null && oldSeal.hash !== finalHash && !process.argv.includes('--update')) {
  console.error(`❌ [Llei Z] Ruptura de segell detectada! El hash actual ${finalHash.substring(0,8)} no coincideix amb el segellat ${oldSeal.hash.substring(0,8)}. T'han modificat les regles d'amagat? Usa --update si és intencionat.`);
  process.exit(1);
}

if (oldSeal.hash === finalHash && process.argv.includes('--update') === false) {
  console.log(`✅ [Llei Z] Skills cryptosegellats sense canvis. Hash: ${finalHash.substring(0, 8)}...`);
  process.exit(0);
}

const seal = {
  timestamp: new Date().toISOString(),
  hash: finalHash,
  filesCount: files.length
};

fs.writeFileSync(sealFile, JSON.stringify(seal, null, 2));
console.log(`✅ [Llei Z] Nou segell de skills desat. Hash: ${finalHash.substring(0, 8)}...`);
process.exit(0);
