/**
 * PWA-03 (v1.2.25) · De quina versió és un build. Un build d'una altra versió no és cap mesura de
 * l'arbre: ni verd ni roig. src/apps/plataforma/pesDelNucli.test.js el salta i la Vigilant
 * (tooling/gates/tractor-vigilant.mjs) el deixa no-mesurat, amb el mateix motiu i este mateix criteri.
 *
 * Un build és d'este arbre si la seua versió (la `versio` de sdp-release.json o, sense release, la
 * `versioSistema` de la versio-viva.json que el build copia de public/) és:
 *  · `${package.version}-dev`, la d'un build sense SDP_VERSIO (versioDelBuild de vite.standalone.config.js);
 *  · la de package.json, la d'un build amb SDP_VERSIO igual a la de l'App;
 *  · la línia del connector (la capçalera Version: de wordpress-plugin/socdepoble-enxufe.php, que la
 *    release de WordPress passa com a SDP_VERSIO, scripts/botigues/publica-tot.mjs), però NOMÉS si la
 *    versio-viva.json del mateix build porta la versioSistema de package.json. La línia no s'apuja amb
 *    cada versió de l'App (de l'App 1.2.0 a la 1.2.8 es va quedar a 1.1.15), així que a soles no data
 *    cap build; la versio-viva.json sí, perquè src/sections/text/pageContent.versions.test.js la lliga
 *    a package.json (Gauntlet PWA03-V3).
 * Un manifest present que no és JSON és un artefacte trencat, no un build vell: no se salta ni s'exclou
 * (Gauntlet PWA03-V5). Un de present que no es pot llegir (EACCES, una carpeta al seu lloc), també: qui el
 * llig hi passa MANIFEST_ILLEGIBLE en lloc del text (PWA03VF-02, VF4-02). Sense package.json l'arbre no té
 * versió, i cap build no s'hi pot dir seu.
 * Mòdul pur: rep els textos i no llig cap fitxer ni toca la xarxa.
 */
export const MOTIU_BUILD_RANCI = 'build ranci, no mesurat';

/* El valor d'un manifest present que no s'ha pogut llegir: no és absent (null), és un build trencat. */
export const MANIFEST_ILLEGIBLE = Symbol('manifest il·legible');

/* Les carpetes on els builds deixen els seus manifests (build:web, build:natiu, build:wp i
   build:wp:directori; la mateixa llista que tooling/gates/tractor-higiene-paquets.mjs). Només el manifest
   de l'arrel d'una d'estes carpetes diu de quina versió és el build: un de niat no exclou res (Gauntlet
   PWA03-V1). public/ és la font, no cap build: es mesura sempre. */
export const ARRELS_DE_BUILD = Object.freeze(['dist', 'dist-natiu', 'wordpress-plugin/dist', 'wordpress-plugin/builds/directori/dist']);

/* La capçalera Version: del connector, com la llig get_file_data de WordPress (`:(.*)$` i trim): la primera
   línia Version: mana. Per als casos bons dona el mateix que capcalera() de wordpress-plugin/eines/empaqueta.mjs,
   però en temps lineal: la forma `[ \t]*(.+?)[ \t]*$` hi feia retrocés quadràtic, 1,7 s amb 40.000 espais dins
   del valor (PWA03VF-04). Una línia Version: buida no dona cap línia. */
const CAPCALERA_VERSION = /^[ \t/*#@]*Version:(.*)$/mi;

/** Les versions d'este arbre ({ app, dev, linia }), a partir del text de package.json i del de la
 *  capçalera del connector; null si package.json no en té cap. */
export function versionsDeLArbre({ paquet, connector } = {}) {
  let app = null;
  try { app = JSON.parse(paquet ?? '')?.version ?? null; } catch { app = null; }
  if (typeof app !== 'string' || !app.trim()) return null;
  const linia = typeof connector === 'string' ? CAPCALERA_VERSION.exec(connector)?.[1].trim() || null : null;
  return Object.freeze({ app, dev: `${app}-dev`, linia });
}

const cadena = (manifest, clau) => typeof manifest?.[clau] === 'string' ? manifest[clau] : null;

/** L'estat d'un build a partir del text dels manifests de la seua arrel (null o absent si no hi són,
 *  MANIFEST_ILLEGIBLE si hi són però no s'han pogut llegir):
 *  · null: cap manifest; no se'n sap la versió i res no l'exclou;
 *  · 'trencat': un manifest present no s'ha pogut llegir o no és JSON;
 *  · 'mesurat': és d'este arbre (el criteri de dalt);
 *  · 'ranci': de qualsevol altra versió, sense versió o d'un arbre sense versió.
 *  `versio` és la que decidix (la de la release o, sense, la de versio-viva.json); `versioViva`, la de
 *  versio-viva.json. */
export function estatDelBuild({ release = null, viva = null } = {}, arbre = null) {
  if (release === MANIFEST_ILLEGIBLE || viva === MANIFEST_ILLEGIBLE) return Object.freeze({ estat: 'trencat', versio: null, versioViva: null });
  if (typeof release !== 'string' && typeof viva !== 'string') return Object.freeze({ estat: null, versio: null, versioViva: null });
  let deRelease, deViva;
  try {
    deRelease = typeof release === 'string' ? JSON.parse(release) : undefined;
    deViva = typeof viva === 'string' ? JSON.parse(viva) : undefined;
  } catch {
    return Object.freeze({ estat: 'trencat', versio: null, versioViva: null });
  }
  const versioViva = cadena(deViva, 'versioSistema');
  const versio = typeof release === 'string' ? cadena(deRelease, 'versio') : versioViva;
  const mesurat = arbre !== null && versio !== null
    && (versio === arbre.app || versio === arbre.dev || (versio === arbre.linia && versioViva === arbre.app));
  return Object.freeze({ estat: mesurat ? 'mesurat' : 'ranci', versio, versioViva });
}
