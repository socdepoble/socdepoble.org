import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const clientFile = path.join(root, 'src/data/adaptadors/sollutia/client.js');

try {
  const content = fs.readFileSync(clientFile, 'utf8');
  if (!content.includes("credentials: 'omit'")) throw new Error("Falta credentials: 'omit' per evitar fuites de cookies");
  if (!content.includes("redirect: 'error'")) throw new Error("Falta redirect: 'error' per evitar phishing");
  if (!content.includes("esOrigenPermes")) throw new Error("Falta comprovació d'origen (esOrigenPermes)");
  if (!content.includes("method: 'GET'")) throw new Error("Només s'autoritzen peticions GET");
  
  if (!content.includes("export const ESCRIPTURES_PERMESES = []") && !content.includes("export const ESCRIPTURES_PERMESES = [];")) throw new Error("ESCRIPTURES_PERMESES ha d'estar buida segons l'ADR");
  
  console.log("✅ tractor-frontissa: La frontissa de Sollutia compleix el Model B.");
  process.exit(0);
} catch (e) {
  console.error("❌ tractor-frontissa: Error arquitectònic en client.js");
  console.error(e.message);
  process.exit(1);
}
