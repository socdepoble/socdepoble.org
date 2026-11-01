// @vitest-environment node
/* P0-24 (G2120-07, marató 261101_2143) · El botó Arrere d'Android, tal com és
   als fitxers (sense gradle): EnrereNatiuPlugin.java n'és l'únic amo, encén el
   callback només amb capes o historial (el gest predictiu de «tornar a l'inici»
   queda al sistema), pregunta la pàgina per la mateixa funció i el mateix
   connector que src/natiu/enrereNatiu.js, i sense res a tancar torna arrere o
   deixa fer el sistema. La compilació de veres: `./gradlew --offline
   :app:compileDebugJavaWithJavac` en una còpia (especificació B3-BACK, §4).
   L'anàlisi és literal a posta, com projecteAndroid.test.js: un refactor del
   Java la posa en roig i obliga a mirar-lo.
   Sense android/app/src/main, se salta dient per què. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CONNECTOR_ENRERE, FUNCIO_ENRERE, METODE_ESTAT } from './enrereNatiu.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const JAVA = path.join(ARREL, 'android', 'app', 'src', 'main', 'java', 'org', 'socdepoble', 'app');
const HI_HA_PROJECTE = fs.existsSync(path.join(JAVA, 'MainActivity.java'));
const llig = (nom) => fs.readFileSync(path.join(JAVA, nom), 'utf8');
/* Els comentaris de Java fora; «content://» dins d'una cadena no és cap comentari. */
const senseComentarisJava = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:"])\/\/[^\n]*/g, '');

/** El cos d'un mètode (o d'un bloc) a partir de la seua signatura, per claus. */
function cosDelMetode(codi, signatura) {
  const inici = codi.indexOf(signatura);
  if (inici < 0) return '';
  const obri = codi.indexOf('{', inici);
  let fondaria = 1;
  let i = obri + 1;
  for (; i < codi.length && fondaria; i += 1) {
    if (codi[i] === '{') fondaria += 1;
    else if (codi[i] === '}') fondaria -= 1;
  }
  return codi.slice(obri + 1, i - 1);
}

describe.skipIf(!HI_HA_PROJECTE)('l’Arrere d’Android (EnrereNatiuPlugin.java)', () => {
  test('MainActivity ja no registra cap callback propi: un sol amo del botó', () => {
    const codi = senseComentarisJava(llig('MainActivity.java'));
    expect(codi).not.toMatch(/OnBackPressedCallback|addCallback\(|canGoBack\(|goBack\(/);
    // I en tot el paquet només el connector en registra un.
    const ambCallback = fs.readdirSync(JAVA).filter((nom) => nom.endsWith('.java'))
      .filter((nom) => /addCallback\(/.test(senseComentarisJava(llig(nom))));
    expect(ambCallback).toEqual(['EnrereNatiuPlugin.java']);
  });

  test('el connector es diu com el crida el JS, i el mètode d’estat també', () => {
    const codi = senseComentarisJava(llig('EnrereNatiuPlugin.java'));
    expect(/@CapacitorPlugin\(name = "([^"]+)"\)/.exec(codi)?.[1]).toBe(CONNECTOR_ENRERE);
    expect(codi).toMatch(new RegExp(`@PluginMethod\\s+public void ${METODE_ESTAT}\\(PluginCall call\\)`));
    const estat = cosDelMetode(codi, `public void ${METODE_ESTAT}(PluginCall call)`);
    expect(estat).toMatch(/call\.getInt\("capes", 0\)/);
    expect(estat).toMatch(/Math\.max\(0, capes\)/);
    expect(estat).toMatch(/call\.resolve\(\);/);
  });

  test('pregunta la pàgina per la mateixa funció global i només un "true" consumix l’Arrere', () => {
    const codi = senseComentarisJava(llig('EnrereNatiuPlugin.java'));
    expect(codi).toContain(`var f=window.${FUNCIO_ENRERE};`);
    expect(codi).toContain('f()===true');
    const enrere = cosDelMetode(codi, 'private void enrere()');
    expect(enrere).toMatch(/if \(capesObertes > 0/);
    expect(enrere).toMatch(/bridge\.eval\(PREGUNTA,/);
    expect(enrere).toMatch(/if \(!"true"\.equals\(valor\)\) perDefecte\(\);/);
  });

  test('el callback naix apagat i només s’encén amb capes o historial (gest predictiu)', () => {
    const codi = senseComentarisJava(llig('EnrereNatiuPlugin.java'));
    expect(codi).toMatch(/new OnBackPressedCallback\(false\)/);
    expect(codi).not.toMatch(/new OnBackPressedCallback\(true\)/);
    expect(cosDelMetode(codi, 'private void actualitza()'))
      .toMatch(/callback\.setEnabled\(capesObertes > 0 \|\| \(webView != null && webView\.canGoBack\(\)\)\);/);
    // Cada canvi d'historial del router (pushState, popstate) torna a mirar-ho.
    expect(cosDelMetode(codi, 'public void doUpdateVisitedHistory(WebView view, String url, boolean isReload)'))
      .toMatch(/super\.doUpdateVisitedHistory\(view, url, isReload\);\s*actualitza\(\);/);
    // Una pàgina nova comença sense capes.
    expect(cosDelMetode(codi, 'public void onPageStarted(WebView view, String url, Bitmap favicon)'))
      .toMatch(/super\.onPageStarted\(view, url, favicon\);\s*capesObertes = 0;\s*actualitza\(\);/);
    // El client és un fill del del pont (no en perd res) i s'instal·la en load().
    expect(cosDelMetode(codi, 'public void load()')).toMatch(/bridge\.setWebViewClient\(\s*new BridgeWebViewClient\(bridge\)/);
    // L'estat de la pàgina s'aplica al fil principal.
    expect(cosDelMetode(codi, `public void ${METODE_ESTAT}(PluginCall call)`)).toMatch(/bridge\.executeOnMainThread\(/);
  });

  test('sense res a tancar: historial → goBack; si no, el sistema, i el callback sempre torna a avaluar-se', () => {
    const codi = senseComentarisJava(llig('EnrereNatiuPlugin.java'));
    const perDefecte = cosDelMetode(codi, 'private void perDefecte()');
    // Una resposta tardana amb l'activitat plegant no fa res.
    expect(perDefecte).toMatch(/if \(activitat == null \|\| activitat\.isFinishing\(\) \|\| activitat\.isDestroyed\(\)\) return;/);
    expect(perDefecte).toMatch(/if \(webView != null && webView\.canGoBack\(\)\) \{\s*webView\.goBack\(\);\s*return;\s*\}/);
    expect(perDefecte).toMatch(
      /callback\.setEnabled\(false\);\s*try \{\s*activitat\.getOnBackPressedDispatcher\(\)\.onBackPressed\(\);\s*\} finally \{\s*actualitza\(\);\s*\}/
    );
  });
});

test.skipIf(HI_HA_PROJECTE)('sense android/ en este arbre, les proves de l’Arrere se salten', () => {
  expect(HI_HA_PROJECTE).toBe(false);
});
