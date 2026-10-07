import fs from 'fs';
const INICI_ENTRADA = /^\d{6} \|/;
const ENTRADA_EN_LINIA = /\d{6} \|/g;
// const MARCA_HASH = /<!-- HASH: [a-f0-9]{64} -->/g;

const cos = fs.readFileSync('.agents/LEDGER.md', 'utf8');
const lines = cos.split('\n');
for (let i = 0; i < lines.length; i++) {
  let cru = lines[i];
  let resta = cru.replace(/\r$/, '').replace(/^[ \t]*#{1,6}[ \t]+/, '');
  let anomala = false;
  const senseHash = resta.replace(/^(?:[ \t]*<!-- HASH: [a-f0-9]{64} -->)+[ \t]*/, '');
  if (senseHash !== resta) { anomala = true; resta = senseHash; }
  if (!INICI_ENTRADA.test(resta)) continue;
  const inicis = [...resta.matchAll(ENTRADA_EN_LINIA)].map((m) => m.index);
  if (inicis[0] !== 0) { console.log(`Linia ${i+1}: ${cru}`); continue; }
  if (inicis.length > 1) { anomala = true; console.log(`Linia ${i+1}: Multiples inicis (anomala)`); }
  // (entradaCanonica omitted)
  if (anomala) console.log(`Linia ${i+1}: ${cru}`);
}
