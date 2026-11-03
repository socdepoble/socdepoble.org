// @vitest-environment node
/* Carril F-botigues (marató 261101, T6; Llibre Mestre P0-23) · El contracte
   entre el domini i les apps natives, mentre no hi ha cap empremta real de Play:
     · firebase.json porta "appAssociation": "NONE". Amb AUTO (el valor per
       defecte), Firebase Hosting genera ell mateix /.well-known/assetlinks.json i
       /.well-known/apple-app-site-association a partir de les apps del projecte
       de Firebase (API firebasehosting v1beta1, ServingConfig.appAssociation:
       «automatically created from the apps that exist in the Firebase project»),
       fora del repositori. Amb NONE, «these paths will result in a 404 unless
       caught with a Rewrite»: el fitxer, si n'hi ha, és el que emet el build;
     · cap fitxer d'associació estàtic a public/ (ni carpeta public/.well-known):
       l'únic que el pot publicar és el generador del build
       (tooling/vite/associacio-apps.mjs), i només amb empremtes reals;
     · l'App no reclama cap enllaç web: cap intent-filter amb android:autoVerify
       ni cap esquema http(s) a AndroidManifest.xml, i cap domini associat a
       App.entitlements. Per a obrir enllaços de socdepoble.org dins de l'App
       calen, junts, les empremtes de Play, l'intent-filter, l'escolta de
       l'enllaç a l'entrada nativa i el canvi d'esta prova (guia de publicació a
       les botigues, _wiki_de_poble/02_saber/architecture/guia_publicacio_app_store_i_google_play.md). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const llig = (rel) => fs.readFileSync(path.join(ARREL, rel), 'utf8');

test('firebase.json: appAssociation NONE, i cap capçalera ni reescriptura per als fitxers d’associació', () => {
  const hosting = JSON.parse(llig('firebase.json')).hosting;
  expect(hosting.appAssociation).toBe('NONE');
  const regles = [...hosting.rewrites, ...hosting.headers].map((r) => `${r.source ?? ''}${r.regex ?? ''}${r.destination ?? ''}`);
  expect(regles.filter((r) => /assetlinks|apple-app-site-association/.test(r))).toEqual([]);
  // La reescriptura de l'SPA no cobrix /.well-known/: sense fitxer del build, 404 (mai l'index.html).
  /* O4-CLAUDE-3 · Es comprova pel glob, no per la cadena (la forma exacta de
     la reescriptura la fixa src/config/firebaseHosting.test.js; O3-GEMINI-1 hi
     va afegir /opendata/ i /nodeinfo/). Com allí, el «!» inicial s'inverteix ací
     i les «regex» (RE2 a Firebase) s'avaluen amb RegExp. */
  const casaGlob = (glob, cami) => {
    let patro = glob;
    let negat = false;
    while (patro.startsWith('!')) { patro = patro.slice(1); negat = !negat; }
    return path.matchesGlob(cami, patro) !== negat;
  };
  const casaRegla = (regla, cami) => (regla.regex ? new RegExp(regla.regex, 'u').test(cami) : casaGlob(regla.source, cami));
  const spa = hosting.rewrites.at(-1);
  expect(spa.destination).toBe('/index.html');
  expect(casaGlob(spa.source, '/xat'), 'la reescriptura de l’SPA continua portant l’app a /index.html').toBe(true);
  for (const cami of ['/.well-known/assetlinks.json', '/.well-known/apple-app-site-association']) {
    // Cap reescriptura (ni la de l'SPA ni les de WebFinger) i, de capçaleres, com a molt les generals de tot el lloc
    // («**» no casa amb un segment que comença per punt al minimatch de superstatic, sense «dot»).
    expect(hosting.rewrites.filter((r) => casaRegla(r, cami)), cami).toEqual([]);
    expect(hosting.headers.filter((r) => casaRegla(r, cami)).map((r) => r.source ?? r.regex)
      .filter((font) => !['**', '!/@(assets|fonts)/**'].includes(font)), cami).toEqual([]);
  }
});

test('cap fitxer d’associació estàtic: ni public/.well-known ni apple-app-site-association a public/', () => {
  expect(fs.existsSync(path.join(ARREL, 'public', '.well-known'))).toBe(false);
  expect(fs.existsSync(path.join(ARREL, 'public', 'apple-app-site-association'))).toBe(false);
  expect(fs.existsSync(path.join(ARREL, 'public', 'assetlinks.json'))).toBe(false);
});

test('AndroidManifest.xml: cap App Link declarat (ni autoVerify ni esquema http/https)', () => {
  const manifest = llig('android/app/src/main/AndroidManifest.xml').replace(/<!--[\s\S]*?-->/g, '');
  expect(manifest).not.toMatch(/android:autoVerify/);
  expect(manifest).not.toMatch(/android:scheme\s*=\s*"https?"/);
  expect(manifest).not.toMatch(/android:host\s*=/);
  // L'activitat principal continua sent l'única exportada amb intents d'entrada (LAUNCHER i Compartir).
  expect(manifest.match(/<intent-filter>/g)).toHaveLength(3);
});

/* Gauntlet 261101 · F-06 · Amb el projecte d'iOS a l'arbre, un App.entitlements
   absent és una regressió i ha de fallar, no passar en silenci. Sense projecte
   (un clon sense ios/), la prova s'omet i ho diu. */
const HI_HA_PROJECTE_IOS = fs.existsSync(path.join(ARREL, 'ios', 'App', 'App.xcodeproj'));

test.skipIf(!HI_HA_PROJECTE_IOS)('App.entitlements: existix i no porta cap domini associat (Universal Links apagats)', () => {
  const entitlements = path.join(ARREL, 'ios', 'App', 'App', 'App.entitlements');
  expect(fs.existsSync(entitlements)).toBe(true);
  expect(fs.readFileSync(entitlements, 'utf8')).not.toMatch(/com\.apple\.developer\.associated-domains/);
});
