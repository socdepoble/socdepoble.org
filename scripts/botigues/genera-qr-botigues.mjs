/**
 * scripts/botigues/genera-qr-botigues.mjs — Onada R9 · C3 (IDEA-120; G8-12 i G8-14) · El QR de la
 * guia de descàrregues de l'Administració, PRECALCULAT.
 *
 * Per què precalculat: l'únic codificador QR del projecte és el de la Gestoria
 * (src/sections/gestoria/facturacio/qrDibuix.js, ISO/IEC 18004, nivell M), i les seues fronteres
 * (gestoria/privacitat.test.js i facturacio/frontera.test.js) no deixen que cap fitxer de src de
 * fora l'importe. Copiar-lo seria duplicar 500 línies. Ací, fora de src, es crida el codificador
 * de veres una sola vegada i se'n desa el camí SVG com a dades; la prova
 * src/sections/profile/admin/assistentBotigues.test.js el torna a calcular amb el mateix
 * codificador i el llig amb un lector independent: si no coincidix, cal tornar a executar este
 * script. Ni xarxa ni cap dependència nova.
 *
 *   node scripts/botigues/genera-qr-botigues.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const URL_GUIA_DESCARREGUES = 'https://socdepoble.org/descarregues';
export const DESTI = 'src/sections/profile/admin/qrGuiaDescarregues.js';

/** El text del mòdul de dades per a eixe camí SVG. Pur. */
export function moduleDelQr({ text, costat, d }) {
  return `/* GENERAT per scripts/botigues/genera-qr-botigues.mjs (Onada R9 · C3): no l'edites a mà.
   El QR de ${text}, amb el codificador de la Gestoria (qrDibuix.js, ISO/IEC 18004,
   nivell M i zona de silenci de 4 mòduls). assistentBotigues.test.js el torna a calcular i el llig
   amb un lector independent. */
export const QR_GUIA_DESCARREGUES = Object.freeze({
  text: ${JSON.stringify(text)},
  costat: ${costat},
  d: ${JSON.stringify(d)}
});
`;
}

async function main() {
  const { codificaQR, camiSvgQR } = await import(pathToFileURL(path.join(ARREL, 'src/sections/gestoria/facturacio/qrDibuix.js')).href);
  const { costat, d } = camiSvgQR(codificaQR(URL_GUIA_DESCARREGUES));
  fs.writeFileSync(path.join(ARREL, DESTI), moduleDelQr({ text: URL_GUIA_DESCARREGUES, costat, d }), 'utf8');
  process.stdout.write(`${DESTI}: ${costat}×${costat} mòduls\n`);
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) await main();
