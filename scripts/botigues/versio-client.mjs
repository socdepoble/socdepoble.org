/**
 * scripts/botigues/versio-client.mjs — P0-23 (BOT-A2; revisió 261025; rebasat a l'assalt 261101) ·
 * El --build de cada pujada és VERSIO_CLIENT_NATIU de src/data/contracte.js.
 *
 * L'app nativa diu al node la versió que porta el seu codi (VERSIO_CLIENT_NATIU), no el número
 * de la botiga, i el node la compara amb el seu mínim (2611011510 i les migracions que la tornen
 * a crear; src/natiu/versioMinima.js). Si un build N ixquera amb la constant d'un build d'abans,
 * quan el mínim pujara a N l'app nova es bloquejaria ella mateixa, sense cap build més nou a la
 * botiga. A iOS el número de build de la pujada viu a la línia d'ordres de puja-ios.mjs (el
 * CURRENT_PROJECT_VERSION del pbxproj diu 2 des de 8bd00f0ab, però l'arxiu es compila amb el
 * --build): per això ho mira el script, abans de tocar res. puja-android.mjs ho mira igual, a més
 * del versionCode de build.gradle. contracte.js és pur (cap import): Node el carrega tal com és.
 * Proves: tests/botigues.test.mjs.
 */
import { VERSIO_CLIENT_NATIU } from '../../src/data/contracte.js';

export { VERSIO_CLIENT_NATIU };

/** Per què este --build no pot eixir amb el codi de l'arbre, o null si pot. Pur. */
export function problemaDeVersioClient(build, versio = VERSIO_CLIENT_NATIU) {
  if (String(build) === String(versio)) return null;
  return `el --build ${build} no és VERSIO_CLIENT_NATIU (${versio}, src/data/contracte.js): `
    + 'l\'app diria al node una altra versió que la de la botiga. Posa a la constant el número d\'este build, '
    + 'comet-ho, torna a fer npm run build:natiu i npx cap sync, i torna-hi (P0-23)';
}
