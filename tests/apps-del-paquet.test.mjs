/* P0-113 (ordre del Mestre, 261111) · Les apps al paquet de l'amfitrió
   (vite.standalone.config.js, definicionsDeLesApps).

   Les apps internes són obertes per defecte i el literal de `carrega` és
   d'exclusió (VITE_SDP_APP_<ID> !== '0'). El paquet de l'amfitrió viu dins
   de la web d'un altre, i el build hi fixa la variable a '0':
     · sempre per a les apps amb dades de salut o financeres (la guarda d'ama
       del document es fia de manageDocumentHead, una clau que l'amfitrió pot
       declarar ell mateix), i cap variable de l'entorn ho canvia;
     · al monolític (IIFE, sense trossos diferits), per a totes, llevat d'un
       VITE_SDP_APP_<ID>=1 explícit.
   Al trossejat, la resta entren com a trossos diferits. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import configStandalone, {
  DADES_NOMES_AL_DOCUMENT_PROPI, appsInternesDelPaquet, definicionsDeLesApps, variableDeLApp
} from '../vite.standalone.config.js';

const BASE = {
  SDP_RELEASE: '', SDP_VARIANT: '', SDP_PAQUET: '',
  VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'sb_publishable_' + 'fixturesintetica'
};

/* process.env mana sobre els .env de disc (loadEnv): la prova no depén del .env local. */
function ambEntorn(valors, fer) {
  const abans = Object.fromEntries(Object.keys(valors).map((clau) => [clau, process.env[clau]]));
  Object.assign(process.env, valors);
  try { return fer(); } finally {
    for (const [clau, valor] of Object.entries(abans)) {
      if (valor === undefined) delete process.env[clau];
      else process.env[clau] = valor;
    }
  }
}

const zero = JSON.stringify('0');
const clau = (id) => `import.meta.env.${variableDeLApp(id)}`;

test('les apps internes del paquet: les cinc obertes per P0-113 i l’Arbre Genealògic (R19 · T3), amb les dades personals del seu manifest', () => {
  const apps = appsInternesDelPaquet();
  const perId = Object.fromEntries(apps.map((app) => [app.id, app]));
  for (const id of ['bar', 'nevera', 'salut', 'lector', 'gestoria', 'genealogia']) assert.ok(perId[id], id);
  assert.equal(perId.salut.dadesPersonals, 'salut');
  /* R19 · Loop 1 · L'Arbre Genealògic porta dades de persones vives (apps/genealogia/manifest.js). */
  assert.equal(perId.genealogia.dadesPersonals, 'salut');
  assert.equal(perId.gestoria.dadesPersonals, 'financeres');
  for (const id of ['bar', 'nevera', 'lector']) assert.equal(perId[id].dadesPersonals, null, id);
  assert.equal(perId.gestoria.variable, 'VITE_SDP_APP_GESTORIA');
  assert.deepEqual([...DADES_NOMES_AL_DOCUMENT_PROPI], ['salut', 'financeres']);
});

test('definicionsDeLesApps: salut i finances, sempre a 0; al trossejat, la resta decidix el literal; al monolític, 0 llevat d’un 1 explícit', () => {
  const apps = [
    { id: 'salut', variable: 'VITE_SDP_APP_SALUT', dadesPersonals: 'salut' },
    { id: 'gestoria', variable: 'VITE_SDP_APP_GESTORIA', dadesPersonals: 'financeres' },
    { id: 'bar', variable: 'VITE_SDP_APP_BAR', dadesPersonals: null }
  ];
  assert.deepEqual(definicionsDeLesApps(apps, { trossejat: true }), {
    'import.meta.env.VITE_SDP_APP_SALUT': zero, 'import.meta.env.VITE_SDP_APP_GESTORIA': zero
  });
  /* Cap variable de l'entorn porta les dades personals a una web d'altri. */
  const forcades = { VITE_SDP_APP_SALUT: '1', VITE_SDP_APP_GESTORIA: '1' };
  assert.deepEqual(definicionsDeLesApps(apps, { env: forcades, trossejat: true }), {
    'import.meta.env.VITE_SDP_APP_SALUT': zero, 'import.meta.env.VITE_SDP_APP_GESTORIA': zero
  });
  assert.equal(definicionsDeLesApps(apps, { trossejat: false })['import.meta.env.VITE_SDP_APP_BAR'], zero);
  assert.equal(definicionsDeLesApps(apps, { env: { VITE_SDP_APP_BAR: '1' }, trossejat: false })['import.meta.env.VITE_SDP_APP_BAR'], JSON.stringify('1'));
  assert.equal(definicionsDeLesApps(apps, { env: { VITE_SDP_APP_BAR: 'si' }, trossejat: false })['import.meta.env.VITE_SDP_APP_BAR'], zero);
});

test('la config del paquet porta les definicions: trossejat i monolític', () => {
  ambEntorn({ ...BASE, VITE_SDP_APP_SALUT: '', VITE_SDP_APP_GESTORIA: '', VITE_SDP_APP_BAR: '' }, () => {
    const trossejat = configStandalone({ mode: 'production', command: 'build' }).define;
    assert.equal(trossejat[clau('salut')], zero);
    assert.equal(trossejat[clau('gestoria')], zero);
    assert.equal(trossejat[clau('genealogia')], zero);
    for (const id of ['bar', 'nevera', 'lector']) assert.equal(clau(id) in trossejat, false, id);
  });
  ambEntorn({ ...BASE, SDP_PAQUET: 'monolitic', VITE_SDP_APP_BAR: '1', VITE_SDP_APP_SALUT: '1' }, () => {
    const monolitic = configStandalone({ mode: 'production', command: 'build' }).define;
    assert.equal(monolitic[clau('salut')], zero);
    assert.equal(monolitic[clau('gestoria')], zero);
    assert.equal(monolitic[clau('genealogia')], zero);
    assert.equal(monolitic[clau('bar')], JSON.stringify('1'));
    assert.equal(monolitic[clau('nevera')], zero);
    assert.equal(monolitic[clau('lector')], zero);
  });
});
