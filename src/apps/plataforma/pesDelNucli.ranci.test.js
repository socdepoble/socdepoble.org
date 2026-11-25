// @vitest-environment node
/* PWA-03 (v1.2.25) · El pressupost de pes (pesDelNucli.test.js) llig el dist de build:wp, que no es
   reconstruïx sol. Un build d'una altra versió no és cap mesura de l'arbre: el de la 1.2.0-dev
   (14-11-2026) hi donava 1.732.976 B d'arrencada i el CSS de la Gestoria, dos rojos falsos que podien
   tapar una inflada real. La suite se salta sencera amb el motiu «build ranci, no mesurat»: ni roja ni
   verda. Un manifest il·legible, en canvi, és un artefacte trencat: roig (Gauntlet PWA03-V5).
   Esta prova executa la de veres en un Vitest fill (com tooling/gates/teclat-superficies.mjs), amb el
   directori de treball en una arrel temporal: un package.json i una capçalera del connector sintètics i
   un dist que no passaria cap prova del pressupost (un sol tros, sense manifest de Vite). Si la suite el
   mesura, cau; si el salta, no en passa ni en cau cap. El motiu es llig al títol de la suite saltada,
   amb --reporter=verbose (també l'avís [pesDelNucli] de la consola) o a l'informe JSON; l'eixida per
   defecte de Vitest no el garantix i pot donar només el recompte de saltades. */
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, expect, test } from 'vitest';

const ARREL = process.cwd();
const VITEST = path.join(ARREL, 'node_modules/vitest/vitest.mjs');
const PROVA = 'src/apps/plataforma/pesDelNucli.test.js';
const SUITE = 'pressupost de pes del nucli';
const TRENCAT = 'els manifests de wordpress-plugin/dist';
const MOTIU = 'build ranci, no mesurat';
/* L'arbre sintètic: una versió de l'App i una línia del connector que cap build real no porta. */
const VERSIO_DE_L_APP = '7.3.5';
const LINIA_DEL_CONNECTOR = '7.1.9';
/* PWA03-V3 · La línia del connector no s'apuja amb cada versió de l'App (de la 1.2.0 a la 1.2.8 es va
   quedar a 1.1.15): una release compilada fa unes quantes versions, a 33e46f278 (App 1.2.2) i llegida a
   11ca49daa (App 1.2.7), porta la mateixa línia, però la versio-viva.json de la seua App. */
const UNA_APP_VELLA = '7.3.1';
const ENTRADA = 'trossos/soc-de-poble-AAAAAAAA.js';
const viva = (versio) => JSON.stringify({ versioSistema: versio });

const temporals = [];
afterAll(() => { for (const dir of temporals) rmSync(dir, { recursive: true, force: true }); });

function arrelAmbUnDist(release, { inventari, manifestDeVite, versioViva, illegible } = {}) {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-pes-ranci-'));
  temporals.push(arrel);
  const escriu = (rel, text) => {
    mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
    writeFileSync(path.join(arrel, rel), text);
  };
  copyFileSync(path.join(ARREL, 'vite.standalone.config.js'), path.join(arrel, 'vite.standalone.config.js'));
  escriu('package.json', JSON.stringify({ version: VERSIO_DE_L_APP }));
  escriu('wordpress-plugin/socdepoble-enxufe.php', `<?php\n/**\n * Plugin Name:       Sóc de Poble\n * Version:           ${LINIA_DEL_CONNECTOR}\n */\n`);
  escriu(`wordpress-plugin/dist/${ENTRADA}`, 'export {};\n');
  escriu('wordpress-plugin/dist/sdp-inventari.json', inventari ?? JSON.stringify({ fitxers: [{ cami: ENTRADA, mida: 11 }] }));
  if (manifestDeVite !== undefined) escriu('wordpress-plugin/dist/.vite/manifest.json', manifestDeVite);
  if (versioViva !== undefined) escriu('wordpress-plugin/dist/versio-viva.json', versioViva);
  escriu('wordpress-plugin/dist/sdp-release.json', typeof release === 'string' ? release : JSON.stringify({
    generat: '2026-11-14T16:26:23.118Z', inventari: { fitxers: 1 }, formatDelPaquet: { format: 'trossos', modul: ENTRADA, trossos: 1 }, ...release
  }));
  /* VF4-02 · Un manifest present que no es pot llegir: una carpeta al seu lloc (EISDIR) o sense permís (EACCES). */
  if (illegible) {
    const [manifest, com] = illegible, cami = path.join(arrel, 'wordpress-plugin/dist', manifest);
    if (com === 'carpeta') { rmSync(cami, { force: true }); mkdirSync(cami); } else chmodSync(cami, 0);
  }
  return arrel;
}

/* Les proves del dist, tal com les compta el Vitest fill (informe JSON; l'eixida verbose porta l'avís de la
   consola). Sense les variables del Vitest pare. */
function correElPressupost(arrel) {
  const informe = path.join(arrel, 'informe.json');
  const env = Object.fromEntries(Object.entries(process.env).filter(([clau]) => !clau.startsWith('VITEST')));
  const resultat = spawnSync(process.execPath, [VITEST, 'run', '--root', ARREL, PROVA, '-t', `${SUITE}|${TRENCAT}`, '--maxWorkers=1',
    '--reporter=verbose', '--reporter=json', `--outputFile.json=${informe}`], { cwd: arrel, encoding: 'utf8', env, timeout: 110000 });
  if (resultat.error) throw resultat.error;
  const totes = JSON.parse(readFileSync(informe, 'utf8')).testResults.flatMap((fitxer) => fitxer.assertionResults);
  return {
    estat: resultat.status,
    proves: totes.filter((prova) => prova.ancestorTitles[0]?.startsWith(SUITE)),
    trencades: totes.filter((prova) => prova.title.startsWith(TRENCAT)),
    sortida: `${resultat.stdout}\n${resultat.stderr}`
  };
}

const SALTADA = new Set(['skipped', 'pending']);

test.each([
  ['un -dev d’una altra versió (el dist del 14-11-2026)', { versio: '1.2.0-dev' }, '1.2.0-dev'],
  ['una release d’una altra línia del connector', { versio: '7.1.8' }, '7.1.8'],
  ['un manifest sense versió', {}, 'sense versió'],
  ['un build vell d’una altra forma (sense formatDelPaquet, inventari i manifest de Vite il·legibles)',
    { versio: '1.0.5', formatDelPaquet: undefined }, '1.0.5', { inventari: '{', manifestDeVite: '{' }],
  ['la línia del connector sense versio-viva.json', { versio: LINIA_DEL_CONNECTOR }, LINIA_DEL_CONNECTOR],
  ['la línia del connector congelada, amb la versio-viva.json d’una App vella (33e46f278 llegit a 11ca49daa)',
    { versio: LINIA_DEL_CONNECTOR }, `${LINIA_DEL_CONNECTOR} (versio-viva.json de la ${UNA_APP_VELLA})`, { versioViva: viva(UNA_APP_VELLA) }]
])('PWA-03 · %s: el pressupost se salta sencer amb «build ranci, no mesurat», ni roig ni verd', (_, release, versioDelTitol, forma) => {
  const { estat, proves, trencades, sortida } = correElPressupost(arrelAmbUnDist(release, forma));
  expect(estat, sortida).toBe(0);
  expect(proves.length, sortida).toBe(7);
  expect(trencades).toEqual([]);
  expect(proves.filter((prova) => !SALTADA.has(prova.status)).map((prova) => `${prova.status}: ${prova.title}`)).toEqual([]);
  for (const prova of proves) {
    expect(prova.ancestorTitles[0]).toContain(MOTIU);
    expect(prova.ancestorTitles[0]).toContain(versioDelTitol);
    expect(prova.ancestorTitles[0]).toContain(VERSIO_DE_L_APP);
  }
  expect(sortida).toContain(`[pesDelNucli] ${MOTIU}`);
}, 120000);

test.each([
  ['un sdp-release.json il·legible', '{'],
  ['una versio-viva.json il·legible al costat d’un -dev d’este arbre', { versio: `${VERSIO_DE_L_APP}-dev` }, { versioViva: '{' }],
  /* VF4-02 · Sense versio-viva.json, un sdp-release.json que no es pot llegir no és absent: abans, el pressupost se saltava en
     silenci com a «build del cap». */
  ['un sdp-release.json que és una carpeta (EISDIR), sense versio-viva.json', { versio: `${VERSIO_DE_L_APP}-dev` }, { illegible: ['sdp-release.json', 'carpeta'] }],
  ...(process.getuid?.() === 0 ? [] : [['un sdp-release.json sense permís de lectura (EACCES), sense versio-viva.json', { versio: `${VERSIO_DE_L_APP}-dev` }, { illegible: ['sdp-release.json', 'EACCES'] }]]),
  ['una versio-viva.json que és una carpeta al costat d’un -dev d’este arbre', { versio: `${VERSIO_DE_L_APP}-dev` }, { illegible: ['versio-viva.json', 'carpeta'] }]
])('PWA03-V5 · %s és un artefacte trencat, no un build vell: roig, amb el pressupost saltat', (_, release, forma) => {
  const { estat, proves, trencades, sortida } = correElPressupost(arrelAmbUnDist(release, forma));
  expect(estat, sortida).toBe(1);
  expect(trencades.map((prova) => prova.status), sortida).toEqual(['failed']);
  expect(proves.length, sortida).toBe(7);
  for (const prova of proves) {
    expect(SALTADA.has(prova.status), prova.title).toBe(true);
    expect(prova.ancestorTitles[0]).toContain('manifest il·legible');
    expect(prova.ancestorTitles[0]).not.toContain(MOTIU);
    expect(prova.ancestorTitles[0]).not.toContain('build del cap');
  }
}, 120000);

test.each([
  ['`${version}-dev`, un build:wp d’este arbre', { versio: `${VERSIO_DE_L_APP}-dev` }],
  ['la versió de package.json, una release amb SDP_VERSIO de l’App', { versio: VERSIO_DE_L_APP }],
  ['la línia del connector amb la versio-viva.json d’esta App, la release de WordPress d’este arbre',
    { versio: LINIA_DEL_CONNECTOR }, { versioViva: viva(VERSIO_DE_L_APP) }]
])('PWA-03 · %s sí es mesura: el pressupost corre i el dist sintètic hi cau', (_, release, forma) => {
  const { estat, proves, trencades, sortida } = correElPressupost(arrelAmbUnDist(release, forma));
  expect(estat, sortida).toBe(1);
  expect(proves.length, sortida).toBe(7);
  expect(trencades).toEqual([]);
  expect(proves.filter((prova) => SALTADA.has(prova.status)).map((prova) => prova.title)).toEqual([]);
  expect(proves.some((prova) => prova.status === 'failed')).toBe(true);
  for (const prova of proves) expect(prova.ancestorTitles[0]).not.toContain(MOTIU);
}, 120000);
