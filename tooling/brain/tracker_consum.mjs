import fs from 'fs';
import { CAMINS } from '../lib/arrel.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const CSV_PATH = path.join(ROOT_DIR, CAMINS.wiki, '10_metriques/consum_ia.csv');

// Utilitat per a afegir consum al CSV
const argv = process.argv.slice(2);
if (argv.length < 5) {
  console.error("Ús: node tracker_consum.mjs <IA> <Model> <Limit> <Mètrica> <Valor%> [Activitat] [CostUSD]");
  console.error("Exemple: node tracker_consum.mjs Claude Fable Semanal Consumit 6 'Auditoria UI' 0.30");
  process.exit(1);
}

const [ia, model, limit, metrica, valor, activitat = '-', cost = '-'] = argv;
const data = new Date().toISOString().replace('T', ' ').substring(0, 16);
const row = `\n${data},${ia},${model},${limit},${metrica},${valor},"${activitat}",${cost}`;

try {
  fs.appendFileSync(CSV_PATH, row, 'utf8');
  console.log(`✅ Consum afegit correctament a ${CSV_PATH}`);
} catch (err) {
  console.error("Error escrivint al CSV:", err);
  process.exit(1);
}
