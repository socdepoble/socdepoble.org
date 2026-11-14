/* R24 · Gauntlet Loop, ronda 2 (G-client-6, G-client-7 i G-client-8) · Prova de regressió permanent · retencio-assets.mjs.
   Dues promeses del contracte de l'ordre:
     · «--retira <nom> no copia eixe tros (un defecte de seguretat corregit) i
       el rebut ho diu»;
     · «retén builds SENCERS o res: un build a mitges tornaria a donar 404».
   Cap build ni xarxa: dist/ i arxiu fingits en un mkdtemp. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESQUEMA, arxiva, incorpora, main } from './retencio-assets.mjs';

const sha = (text) => createHash('sha256').update(text).digest('hex');

function temporal(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function build({ entrada, tros }) {
  return {
    [entrada]: `import{r as e}from"./react-ReactR01.js";const x=()=>import(${JSON.stringify(`./${tros}`)});export{e as c_};`,
    [tros]: `import{c_ as a}from"./${entrada}";export default a;`,
    'react-ReactR01.js': 'export const r=1;'
  };
}

function escriuDist(dir, fitxers, entrada) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html><head>
<script type="module" crossorigin src="/assets/${entrada}"></script>
</head><body><div id="root"></div></body></html>`);
  for (const [nom, text] of Object.entries(fitxers)) fs.writeFileSync(path.join(dir, 'assets', nom), text);
  return dir;
}

const A = build({ entrada: 'index-EntradA1.js', tros: 'Vulnera-VulnerA1.js' });
const B = build({ entrada: 'index-EntradB2.js', tros: 'XatSection-XatSecB2.js' });

test('G-client · --retira en una segona incorpora: el tros ja copiat continua a dist/assets i el rebut diu que s’ha retirat', (t) => {
  const arrel = temporal(t, 'sdp-retencio-retira-');
  const arxiu = path.join(arrel, 'arxiu');
  fs.mkdirSync(arxiu);
  const dist = path.join(arrel, 'dist');
  escriuDist(dist, A, 'index-EntradA1.js');
  arxiva({ dist, arxiu, creat: new Date('2026-11-13T05:00:00Z') });
  escriuDist(dist, B, 'index-EntradB2.js');
  arxiva({ dist, arxiu, creat: new Date('2026-11-14T04:00:00Z') });
  const ara = new Date('2026-11-14T05:00:00Z');
  // Primera passada (la normal): retén A sencer, també Vulnera-VulnerA1.js.
  incorpora({ dist, arxiu, ara });
  assert.ok(fs.existsSync(path.join(dist, 'assets', 'Vulnera-VulnerA1.js')));
  // El Mestre descobrix que Vulnera és un defecte de seguretat i torna a passar incorpora amb --retira (sense tornar a compilar).
  const rebut = incorpora({ dist, arxiu, ara, retira: ['Vulnera-VulnerA1.js'] });
  assert.deepEqual(rebut.retinguts[0].retirats, ['Vulnera-VulnerA1.js'], 'el rebut diu que l’ha retirat');
  assert.equal(fs.existsSync(path.join(dist, 'assets', 'Vulnera-VulnerA1.js')), false,
    'el tros retirat NO ha de quedar a dist/assets (es desplegaria igualment)');
  assert.deepEqual(rebut.retiratsDeDist, ['Vulnera-VulnerA1.js'], 'el rebut diu que l’ha esborrat de dist/assets');
  /* La resta del build A continua retinguda. */
  assert.ok(fs.existsSync(path.join(dist, 'assets', 'index-EntradA1.js')));
});

test('G-client · un build retingut amb una font absent del pool es copia a mitges: «sencers o res» es trenca', (t) => {
  const arrel = temporal(t, 'sdp-retencio-mitges-');
  const arxiu = path.join(arrel, 'arxiu');
  fs.mkdirSync(path.join(arxiu, 'pool'), { recursive: true });
  fs.mkdirSync(path.join(arxiu, 'builds'), { recursive: true });
  const dist = path.join(arrel, 'dist');
  // Build vell A al pool, amb una font que el pool ja no té (pool podat o còpia fallida).
  const font = 'zfont-FontAAA1.woff2';
  const fitxersA = { ...A, [font]: 'woff2-bytes' };
  for (const [nom, text] of Object.entries(A)) fs.writeFileSync(path.join(arxiu, 'pool', nom), text);
  const manifestA = {
    schema: ESQUEMA, creat: '2026-11-13T05:00:00.000Z', entrada: 'index-EntradA1.js', commit: null,
    fitxers: Object.entries(fitxersA).map(([nom, text]) => ({ nom, bytes: Buffer.byteLength(text), sha256: sha(text) }))
      .sort((x, y) => (x.nom < y.nom ? -1 : 1)),
    totalBytes: 0
  };
  fs.writeFileSync(path.join(arxiu, 'builds', '261113_0600_index-EntradA1.json'), JSON.stringify(manifestA));
  escriuDist(dist, B, 'index-EntradB2.js');
  arxiva({ dist, arxiu, creat: new Date('2026-11-14T04:00:00Z') });
  const abans = new Set(fs.readdirSync(path.join(dist, 'assets')));
  let error = null;
  try { incorpora({ dist, arxiu, ara: new Date('2026-11-14T05:00:00Z') }); } catch (e) { error = e; }
  const afegits = fs.readdirSync(path.join(dist, 'assets')).filter((nom) => !abans.has(nom));
  assert.ok(error, 'incorpora avorta (pool corrupte)');
  assert.deepEqual(afegits, [], `cap fitxer del build A no ha de quedar copiat a mitges; n’hi ha: ${afegits.join(', ')}`);
});

test('G-client · --arxiu dins de --dist: el pool, els manifests i el rebut acaben dins de dist/ (es desplegarien)', (t) => {
  const arrel = temporal(t, 'sdp-retencio-dins-');
  const dist = path.join(arrel, 'dist');
  escriuDist(dist, A, 'index-EntradA1.js');
  const arxiu = path.join(dist, 'retencio');
  fs.mkdirSync(arxiu);
  let error = null;
  try { arxiva({ dist, arxiu, creat: new Date('2026-11-13T05:00:00Z') }); } catch (e) { error = e; }
  const escrit = fs.existsSync(path.join(dist, 'retencio', 'pool', 'Vulnera-VulnerA1.js'));
  assert.ok(error || !escrit, 'arxiva accepta un arxiu dins de dist/ i hi escriu el pool (públic a Hosting)');
  assert.ok(error, 'arxiva refusa un --arxiu dins de --dist');
  assert.deepEqual(fs.readdirSync(arxiu), [], 'cap pool ni manifest dins de dist/');
  /* Com a ordre: codi 2 (ús), en tots dos sentits i també per a incorpora. */
  const sorda = { out: () => {}, err: () => {} };
  assert.equal(main(['arxiva', '--dist', dist, '--arxiu', arxiu], sorda), 2);
  assert.equal(main(['incorpora', '--dist', dist, '--arxiu', arxiu], sorda), 2);
  assert.equal(main(['arxiva', '--dist', dist, '--arxiu', dist], sorda), 2);
  const fora = path.join(arrel, 'arxiu-pare');
  const distDins = path.join(fora, 'dist');
  escriuDist(distDins, A, 'index-EntradA1.js');
  assert.equal(main(['arxiva', '--dist', distDins, '--arxiu', fora], sorda), 2, 'un --dist dins de --arxiu també');
  assert.equal(fs.existsSync(path.join(fora, 'pool')), false);
});

test('sobreviu · noms de manifest amb «..», barres inverses o enllaços simbòlics no escapen de dist/assets (POSIX)', (t) => {
  const arrel = temporal(t, 'sdp-retencio-trav-');
  const arxiu = path.join(arrel, 'arxiu');
  fs.mkdirSync(path.join(arxiu, 'builds'), { recursive: true });
  fs.mkdirSync(path.join(arxiu, 'pool'), { recursive: true });
  const dist = path.join(arrel, 'dist');
  escriuDist(dist, B, 'index-EntradB2.js');
  arxiva({ dist, arxiu, creat: new Date('2026-11-14T04:00:00Z') });
  // «/» no casa amb NOM_AMB_EMPREMTA: manifest invàlid i incorpora avorta.
  const amb = (nom) => ({ schema: ESQUEMA, creat: '2026-11-13T05:00:00.000Z', entrada: 'index-EntradA1.js', commit: null,
    fitxers: [{ nom: 'index-EntradA1.js', bytes: 1, sha256: sha('e') }, { nom, bytes: 1, sha256: sha('y') }] });
  fs.writeFileSync(path.join(arxiu, 'builds', '261113_0600_x.json'), JSON.stringify(amb('../fora-AAAAAAAA.js')));
  assert.throws(() => incorpora({ dist, arxiu, ara: new Date('2026-11-14T05:00:00Z') }), /manifest invàlid/);
  // Barres inverses: en POSIX són part del nom; el fitxer queda DINS de dist/assets.
  const nom = '..\\..\\fora-AAAAAAAA.js';
  fs.writeFileSync(path.join(arxiu, 'builds', '261113_0600_x.json'), JSON.stringify(amb(nom)));
  fs.writeFileSync(path.join(arxiu, 'pool', 'index-EntradA1.js'), 'e');
  fs.writeFileSync(path.join(arxiu, 'pool', nom), 'y');
  incorpora({ dist, arxiu, ara: new Date('2026-11-14T05:00:00Z') });
  assert.equal(fs.existsSync(path.join(dist, 'assets', nom)), true);
  assert.equal(fs.readdirSync(arrel).some((n) => n.includes('fora')), false);
  // Un enllaç simbòlic amb empremta a dist/assets avorta arxiva.
  fs.symlinkSync('/etc/hosts', path.join(dist, 'assets', 'enllac-AAAAAAAA.js'));
  assert.throws(() => arxiva({ dist, arxiu }), /enllaç simbòlic/);
});
