// @vitest-environment node
/* P1-35 (pla 261028_1526 §3.5.2; decisió 6 del Mestre, 261028) · La Versió
   Canònica del Sistema té una sola font, package.json: v1.0.0 i, en un build,
   « (build aammdd)» amb la data de compilació a Europe/Madrid. Les proves no
   porten segell (vite.config.js només el posa en compilar). La paritat:
   Android (build.gradle) i iOS (cada project.pbxproj) declaren la mateixa
   versió que package.json, i el seu número de build és el mateix. */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { BUILD_SISTEMA, VERSIO_SISTEMA, versioCanonica } from './versio.js';
import { VERSIO_CLIENT_NATIU } from '../data/contracte.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const PAQUET = JSON.parse(llig('package.json'));

/** Els project.pbxproj d'ios/, sense dependències ni derivats. */
function pbxprojs(carpeta = 'ios') {
  const eixida = [];
  for (const nom of readdirSync(resolve(ARREL, carpeta))) {
    if (['Pods', 'node_modules', 'DerivedData', 'build'].includes(nom)) continue;
    const ruta = join(carpeta, nom);
    if (!statSync(resolve(ARREL, ruta)).isDirectory()) continue;
    if (nom.endsWith('.xcodeproj')) {
      try { statSync(resolve(ARREL, ruta, 'project.pbxproj')); eixida.push(join(ruta, 'project.pbxproj')); } catch { /* sense projecte */ }
    } else eixida.push(...pbxprojs(ruta));
  }
  return eixida;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('la versió canònica', () => {
  test('ve de package.json, i a les proves no porta segell de build', () => {
    expect(VERSIO_SISTEMA).toBe(PAQUET.version);
    expect(BUILD_SISTEMA).toBeNull();
    expect(versioCanonica()).toBe(`v${PAQUET.version}`);
    /* Decisió 6 del Mestre (261028): v1.0.0. O6-CLAUDE-1 (ordre del Mestre,
       Onada 6, 261103): salt a v1.1.0. Onada R16: package.json, Android i iOS
       passen a 1.1.12, la versió del connector WordPress
       (wordpress-plugin/socdepoble-enxufe.php); el número de build (versionCode 2 i
       CURRENT_PROJECT_VERSION 2) no canvia fins a la pròxima pujada a les botigues.
       Onada R21 (COMMIT 3): package.json, Android i iOS passen a 1.2.0 amb el build 4 (VERSIO_CLIENT_NATIU 4), i el
       connector WordPress del repositori, a la 1.1.13 (la publicada a WordPress.org continua sent la 1.1.12). */
    expect(versioCanonica()).toBe('v1.2.0');
  });

  test('la forma: «vX.Y.Z» o «vX.Y.Z (build aammdd)»; un segell que no és aammdd no s’hi posa', () => {
    expect(versioCanonica('261028')).toBe(`v${VERSIO_SISTEMA} (build 261028)`);
    for (const build of [null, undefined, '', '2610', '26102800', 'aammdd', 261028]) {
      expect(versioCanonica(build), String(build)).toBe(`v${VERSIO_SISTEMA}`);
    }
    for (const v of [versioCanonica(), versioCanonica('261028')]) expect(v).toMatch(/^v\d+\.\d+\.\d+( \(build \d{6}\))?$/);
  });

  test('el segell que posa Vite en compilar es llig de import.meta.env.SDP_BUILD', async () => {
    vi.stubEnv('SDP_BUILD', '261028');
    const ambSegell = await import('./versio.js');
    expect(ambSegell.BUILD_SISTEMA).toBe('261028');
    expect(ambSegell.versioCanonica()).toBe(`v${VERSIO_SISTEMA} (build 261028)`);
    vi.resetModules();
    vi.stubEnv('SDP_BUILD', 'x; y');
    expect((await import('./versio.js')).BUILD_SISTEMA).toBeNull();
  });
});

/* Els configs de Vite no es poden importar dins de Vitest (el connector de
   React demana vite/internal): s'avaluen en un Node pla, com fan les proves de
   tests/*.test.mjs, una sola vegada per a tots els casos. TZ=UTC: el segell no
   depén de la zona de qui compila. */
const CASOS = Object.freeze([
  // Hivern (UTC+1): les 23:30 UTC del 27 ja són el 28 a la Torre.
  ['2026-10-27T23:30:00Z', '261028'],
  // Estiu (UTC+2): les 22:30 UTC de l'1 de juliol ja són el 2.
  ['2026-07-01T22:30:00Z', '260702'],
  ['2026-07-01T21:59:59Z', '260701'],
  ['2027-01-01T00:00:00Z', '270101']
]);
const ENTORNS = [...CASOS.map(([iso]) => ({ SOURCE_DATE_EPOCH: String(Date.parse(iso) / 1000) })), {}, { SOURCE_DATE_EPOCH: '' }, { SOURCE_DATE_EPOCH: 'ahir' }];

describe('el segell del build (vite.config.js i vite.standalone.config.js)', () => {
  let segells;
  beforeAll(() => {
    const codi = `const [a, b] = await Promise.all([import('./vite.config.js'), import('./vite.standalone.config.js')]);
const entorns = ${JSON.stringify(ENTORNS)};
console.log(JSON.stringify(entorns.map((e) => [a.segellDeBuild(e), b.segellDeBuild(e)])));`;
    const { status, stdout, stderr } = spawnSync(process.execPath, ['--input-type=module', '-e', codi], {
      cwd: ARREL, encoding: 'utf8', env: { ...process.env, TZ: 'UTC', VITEST: '' }, timeout: 60000
    });
    expect(status, stderr).toBe(0);
    segells = JSON.parse(stdout.trim().split('\n').at(-1));
  }, 60000);

  test.each(CASOS.map((cas, i) => [...cas, i]))('%s → %s, a Europe/Madrid, igual als dos fitxers', (_iso, esperat, i) => {
    expect(segells[i]).toEqual([esperat, esperat]);
  });

  test('sense SOURCE_DATE_EPOCH (o amb un de buit o invàlid), la data d’ara, la mateixa als dos', () => {
    for (const [lloc, paquet] of segells.slice(CASOS.length)) {
      expect(lloc).toMatch(/^\d{6}$/);
      expect(paquet).toBe(lloc);
    }
  });

  test('els tres configs el segellen només en compilar', () => {
    for (const fitxer of ['vite.config.js', 'vite.standalone.config.js', 'vite.natiu.config.js']) {
      const codi = llig(fitxer);
      expect(codi, fitxer).toMatch(/command === 'build' \? \{ (?:define: \{ )?'import\.meta\.env\.SDP_BUILD': JSON\.stringify\(segellDeBuild\(\w*\)\)/);
    }
    // Les proves avaluen vite.config.js com a `serve`: sense segell, i la versió s'hi llig sense build.
    expect(llig('vite.config.js').match(/'import\.meta\.env\.SDP_BUILD'/g)).toHaveLength(1);
  });
});

describe('paritat de versions amb les apps natives', () => {
  const gradle = llig('android/app/build.gradle');
  const versionName = /^[ \t]*versionName[ \t]+"([^"\n]+)"/m.exec(gradle)?.[1];
  const versionCode = /^[ \t]*versionCode[ \t]+(\d+)[ \t]*$/m.exec(gradle)?.[1];
  const projectes = pbxprojs();

  test('Android declara la versió de package.json', () => {
    expect(versionName).toBe(PAQUET.version);
    expect(versionCode).toMatch(/^\d+$/);
  });

  test('cada configuració de cada project.pbxproj declara la mateixa versió i el build d’Android', () => {
    expect(projectes).toEqual(expect.arrayContaining([join('ios', 'App', 'App.xcodeproj', 'project.pbxproj')]));
    for (const ruta of projectes) {
      const codi = llig(ruta);
      const versions = [...codi.matchAll(/^[ \t]*MARKETING_VERSION = ([^;\n]+);/gm)].map((m) => m[1].trim());
      const builds = [...codi.matchAll(/^[ \t]*CURRENT_PROJECT_VERSION = ([^;\n]+);/gm)].map((m) => m[1].trim());
      expect(versions.length, ruta).toBeGreaterThan(0);
      expect(builds.length, ruta).toBe(versions.length);
      expect(new Set(versions), ruta).toEqual(new Set([PAQUET.version]));
      expect(new Set(builds), ruta).toEqual(new Set([versionCode]));
    }
  });

  /* T8 · P0-23 (pla 261101_1246) · La porta de versió mínima de l'app nativa
     (src/natiu/versioMinima.js) compara el mínim del servidor amb
     VERSIO_CLIENT_NATIU, i el servidor el fixa amb el número de build de les
     botigues. La constant ha de ser el versionCode d'Android i cada
     CURRENT_PROJECT_VERSION d'iOS: si es puja el build sense pujar-la (o a
     l'inrevés), la porta compara el mínim amb un número que no és el del binari. */
  test('VERSIO_CLIENT_NATIU de contracte.js és el número de build dels binaris natius', () => {
    expect(Number.isSafeInteger(VERSIO_CLIENT_NATIU) && VERSIO_CLIENT_NATIU > 0).toBe(true);
    expect(String(VERSIO_CLIENT_NATIU)).toBe(versionCode);
    for (const ruta of projectes) {
      const builds = [...llig(ruta).matchAll(/^[ \t]*CURRENT_PROJECT_VERSION = ([^;\n]+);/gm)].map((m) => m[1].trim());
      expect(builds.length, ruta).toBeGreaterThan(0);
      expect(new Set(builds), ruta).toEqual(new Set([String(VERSIO_CLIENT_NATIU)]));
    }
  });
});
