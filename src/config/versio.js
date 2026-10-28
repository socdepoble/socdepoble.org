/**
 * versio.js — la Versió Canònica del Sistema (P1-35; pla 261028_1526 §3.5.2).
 *
 * Decisió 6 del Mestre (261028) · La versió és la de package.json (hui
 * v1.0.0) i el build, la data de compilació aammdd a Europe/Madrid. Una sola
 * font: Android (build.gradle), iOS (project.pbxproj) i la web la repetixen,
 * i versio.test.js vigila que no divergisquen.
 *
 *  · VERSIO_SISTEMA · el camp `version` de package.json (una lectura: Vite
 *    importa el JSON per nom i al paquet només hi va eixe text).
 *  · BUILD_SISTEMA · la clau import.meta.env.SDP_BUILD que segellen els tres
 *    configs de Vite (vite.config.js, vite.standalone.config.js i
 *    vite.natiu.config.js) NOMÉS en compilar. En desenvolupament i a les
 *    proves no hi és i val null; fora de Vite (node --test) import.meta.env
 *    no existix, i el try/catch ho tolera (el patró d'assetResolver.js).
 *  · versioCanonica() · «v1.0.0» o «v1.0.0 (build 261028)».
 */
import { version } from '../../package.json';

export const VERSIO_SISTEMA = version;

/** El segell del build: sis xifres (aammdd) o null. */
const SEGELL = /^\d{6}$/;

function llegixBuild() {
  try {
    const build = import.meta.env.SDP_BUILD;
    return typeof build === 'string' && SEGELL.test(build) ? build : null;
  } catch {
    return null;
  }
}

export const BUILD_SISTEMA = llegixBuild();

/** «v<versió>» i, si el build està segellat, « (build aammdd)». */
export function versioCanonica(build = BUILD_SISTEMA) {
  const segell = typeof build === 'string' && SEGELL.test(build) ? build : null;
  return segell ? `v${VERSIO_SISTEMA} (build ${segell})` : `v${VERSIO_SISTEMA}`;
}
