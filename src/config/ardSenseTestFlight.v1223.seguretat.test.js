/* v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · «Mantín ocult/desactivat l'anunci o botó públic de
   TestFlight a ard.json fins que s'òbriga formalment la ronda amb Beta Testers.»
   Estat verificat el 23-11-2026 al worktree d'integració: public/.well-known/ard.json no porta cap camp ni entrada de
   TestFlight (cap commit l'hi ha posat mai: git log -S testflightIosBuild no en dona cap), public/versio-viva.json només
   anuncia Google Play i l'App Store, i la ranura 'testflight' de canalsDeBotiga.js és tancada (url: null), de manera que
   /page/descarregues (InstalaLaPwa.jsx) no pinta el botó ni la guia de TestFlight. Però hi ha un generador:
   scripts/botigues/publica-tot.mjs --sincronitza-proves --build-testflight M escriu testflightIosBuild a
   public/.well-known/ard.json (i a dist/.well-known/ard.json), i el pla de publicació d'iOS el demana després de cada
   pujada. Esta prova és el pany fins que el Mestre òbriga la ronda: cau si ard.json, la seua còpia de dist/,
   versio-viva.json, una pàgina pública o un fitxer de public/ anuncien TestFlight o una beta pública de l'App.
   L'ÚNICA bandera és RONDA_BETA_TESTERS_OBERTA, ací davall: obrir la ronda és posar-la a true per ordre del Mestre, en el
   mateix canvi que obri la ranura 'testflight' de canalsDeBotiga.js (l'enllaç públic que done Apple) i que deixa
   --sincronitza-proves escriure testflightIosBuild. Fora d'ard.json i de les superfícies públiques, la paraula
   «TestFlight» pot continuar a les cròniques datades de /versions i a l'índex de la Wiki (actes velles): són història,
   no un anunci ni un enllaç.
   v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · Es diu .seguretat.test.js perquè entre al pre-commit
   (`npm run test:precommit`, pel glob de les proves de seguretat de PRECOMMIT_INCLUDE a vitest.precommit.config.js) i no
   només a la suite sencera: un commit amb testflightIosBuild a ard.json no passa el hook. El pany del generador (que --sincronitza-proves
   es refuse sense SDP_RONDA_BETA_TESTERS=1) és del carril de botigues, i les dues banderes han d'anar d'acord. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CANALS_DE_BOTIGA, canalsOberts } from './canalsDeBotiga.js';
import { llegixCanalsManifest, llegixVersioViva } from './manifestVersio.js';
import { ENLLAC_TESTFLIGHT } from './actualitzacioRecomanada.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { localitzaPagina } from '../sections/text/pageContent.r10.js';

/** La bandera explícita de la ronda amb Beta Testers. Tancada fins a l'ordre formal del Mestre. */
const RONDA_BETA_TESTERS_OBERTA = false;

const ARREL = process.cwd();
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

/* Un anunci de TestFlight o d'una beta pública de l'App: el nom del canal, les adreces d'Apple (l'enllaç públic /join/,
   la de l'App de TestFlight i el seu esquema) i «beta» com a paraula. */
const ANUNCI_EN_MANIFEST = /testflight|beta\.itunes\.apple\.com|itms-beta:|\bbeta\b/i;
/* En les pàgines i fitxers públics: un enllaç per a instal·lar l'App de proves (l'enllaç públic /join/ de TestFlight,
   l'adreça de l'App de TestFlight o el seu esquema). La paraula «Beta Testers» sola no: és el nom del canal de xat del
   poble (migració 20261113003000), que les cròniques de /versions i el Llibre d'Or nomenen. */
const ENLLAC_DE_PROVES = /testflight\.apple\.com|beta\.itunes\.apple\.com|itms-beta:/i;

const llegixJson = (ruta) => JSON.parse(readFileSync(resolve(ARREL, ruta), 'utf8'));

/** Els fitxers de text de public/ que serveix la web (també .well-known). */
function fitxersPublics(dir = resolve(ARREL, 'public'), eixida = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, ent.name);
    if (ent.isDirectory()) fitxersPublics(ruta, eixida);
    else if (/\.(?:json|txt|md|html|webmanifest|xml)$/i.test(ent.name)) eixida.push(ruta);
  }
  return eixida;
}

/** Totes les cadenes d'un objecte de pàgina (html, lead, subtitle, title…), amb el seu camí. */
function cadenesDe(valor, cami = '') {
  if (typeof valor === 'string') return [[cami, valor]];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => cadenesDe(v, `${cami}[${i}]`));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([clau, v]) => cadenesDe(v, cami ? `${cami}.${clau}` : clau));
  }
  return [];
}

describe.skipIf(RONDA_BETA_TESTERS_OBERTA)('v1.2.23 · D-V1223-BOTO-BETA-OCULT · cap anunci públic de TestFlight fins a la ronda amb Beta Testers', () => {
  test.each([
    ['public/.well-known/ard.json'],
    ['dist/.well-known/ard.json'],
  ])('%s no porta testflightIosBuild ni cap entrada o text de TestFlight o de beta', (ruta) => {
    if (!existsSync(resolve(ARREL, ruta))) {
      // dist/ només hi és després d'un «npm run build»; la font de veritat és la de public/.
      expect(ruta.startsWith('dist/'), `${ruta} ha d'existir`).toBe(true);
      return;
    }
    const manifest = llegixJson(ruta);
    expect(Object.hasOwn(manifest, 'testflightIosBuild'), `${ruta}: testflightIosBuild`).toBe(false);
    expect(llegixCanalsManifest(manifest).testflightIosBuild, `${ruta}: lectura de l'App`).toBeNull();
    expect(JSON.stringify(manifest), ruta).not.toMatch(ANUNCI_EN_MANIFEST);
  });

  test('public/versio-viva.json només anuncia les botigues obertes (Google Play i App Store), sense TestFlight ni beta', () => {
    const viva = llegixJson('public/versio-viva.json');
    expect(llegixVersioViva(viva)).toBeTruthy();
    expect(Object.keys(viva.canals ?? {}).sort()).toEqual(['android', 'ios']);
    expect(JSON.stringify(viva)).not.toMatch(ANUNCI_EN_MANIFEST);
  });

  test('la ranura de TestFlight de /page/descarregues és tancada: cap botó ni guia de TestFlight', () => {
    const ranura = CANALS_DE_BOTIGA.find((canal) => canal.id === 'testflight');
    expect(ranura, 'la ranura testflight continua a la llista').toBeTruthy();
    expect(ranura.url).toBeNull();
    expect(canalsOberts().map((canal) => canal.id)).not.toContain('testflight');
  });

  test('cap pàgina pública, en cap de les cinc llengües, enllaça TestFlight', () => {
    let revisades = 0;
    for (const [clau, pagina] of Object.entries(PAGE_COPY)) {
      for (const llengua of LLENGUES) {
        const loc = localitzaPagina(pagina, llengua, clau);
        for (const [cami, text] of cadenesDe(loc)) {
          revisades += 1;
          expect(text, `${clau}.${llengua}.${cami}`).not.toMatch(ENLLAC_DE_PROVES);
          expect(text, `${clau}.${llengua}.${cami}`).not.toContain(ENLLAC_TESTFLIGHT);
        }
      }
    }
    expect(revisades).toBeGreaterThan(500);
  });

  test('cap fitxer de public/ (llms.txt, md, opendata, manifests) enllaça TestFlight', () => {
    const fitxers = fitxersPublics();
    expect(fitxers.length).toBeGreaterThan(10);
    for (const ruta of fitxers) {
      expect(readFileSync(ruta, 'utf8'), relative(ARREL, ruta)).not.toMatch(ENLLAC_DE_PROVES);
    }
  });
});

test('v1.2.23 · D-V1223-BOTO-BETA-OCULT · la bandera de la ronda amb Beta Testers és un booleà explícit', () => {
  expect(typeof RONDA_BETA_TESTERS_OBERTA).toBe('boolean');
});
