import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  avaluaCoherenciaEditorial,
  validaMapaCoherencia,
  xifresEscolesNode0,
} from '../tooling/gates/tractor-coherencia-editorial-viva.mjs';
import { seleccionaPassos } from '../tooling/gates/run-portes.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ARREL, 'tooling/gates/tractor-coherencia-editorial-viva.mjs');
const MAPA_REL = '.agents/coherencia-editorial-mapa.json';
const llegixMapa = () => JSON.parse(fs.readFileSync(path.join(ARREL, MAPA_REL), 'utf8'));

/* R32 · Arrel de prova: enllaços simbòlics a l'arbre real i còpies reals només dels
   fitxers que la prova muta. El repositori no s'escriu mai. */
function creaArrelMutada(t, substitucions) {
  const desti = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cev-mutada-'));
  t.after(() => fs.rmSync(desti, { recursive: true, force: true }));
  const rutes = Object.keys(substitucions);
  const sembra = (origen, dst, prefix) => {
    for (const nom of fs.readdirSync(origen)) {
      const rel = prefix ? `${prefix}/${nom}` : nom;
      if (Object.hasOwn(substitucions, rel)) fs.writeFileSync(path.join(dst, nom), substitucions[rel]);
      else if (rutes.some((r) => r.startsWith(`${rel}/`))) {
        fs.mkdirSync(path.join(dst, nom));
        sembra(path.join(origen, nom), path.join(dst, nom), rel);
      } else fs.symlinkSync(path.join(origen, nom), path.join(dst, nom));
    }
  };
  sembra(ARREL, desti, '');
  return desti;
}

test('el repositori actual passa les 6 lleis CEV-1..CEV-6 sense cap infracció', async () => {
  const res = await avaluaCoherenciaEditorial({ arrel: ARREL });
  assert.equal(res.valid, true, JSON.stringify(res.infraccions, null, 2));
  assert.deepEqual(res.lleisVerdes, ['CEV-1', 'CEV-2', 'CEV-3', 'CEV-4', 'CEV-5', 'CEV-6']);
  assert.equal(res.resum.membresConsell, 12);
  assert.ok(res.resum.skillsActives >= 43);
});

test('CEV-6 detecta un canvi de codi orfe de revisió editorial i el bloqueja amb --strict-propagation', async () => {
  const avis = await avaluaCoherenciaEditorial({
    arrel: ARREL,
    changed: ['package.json'],
    strictPropagation: false,
  });
  assert.equal(avis.valid, true);
  assert.equal(avis.avisosPropagacio.length, 1);
  assert.equal(avis.avisosPropagacio[0].domini, 'versio_i_botigues');

  const bloc = await avaluaCoherenciaEditorial({
    arrel: ARREL,
    changed: ['package.json'],
    strictPropagation: true,
  });
  assert.equal(bloc.valid, false);
  assert.equal(bloc.infraccions[0].llei, 'CEV-6');

  const satisfet = await avaluaCoherenciaEditorial({
    arrel: ARREL,
    changed: ['package.json', 'src/sections/text/pageContent.js'],
    strictPropagation: true,
  });
  assert.equal(satisfet.valid, true);
  assert.equal(satisfet.avisosPropagacio.length, 0);
});

test('CLI --json retorna eixida estructurada i codi 0 sobre el repositori sa', () => {
  const r = spawnSync(process.execPath, [CLI, '--arrel', ARREL, '--json'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.infraccions.length, 0);
});

test('fail-closed si falta .agents/coherencia-editorial-mapa.json', async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cev-empty-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const res = await avaluaCoherenciaEditorial({ arrel: tmp });
  assert.equal(res.valid, false);
  assert.equal(res.infraccions[0].llei, 'CEV-1');
});

test('CEV-6 no certifica una referència Git desconeguda, ni en mode consultiu', async () => {
  for (const strictPropagation of [false, true]) {
    const res = await avaluaCoherenciaEditorial({ arrel: ARREL, gitDiff: '__p2_nonexistent_ref__', strictPropagation });
    assert.equal(res.valid, false);
    assert.equal(res.lleisVerdes.includes('CEV-6'), false);
    assert.ok(res.infraccions.some(row => row.llei === 'CEV-6' && row.fitxer === '.git'));
  }
});

test('CLI Git ref invàlida o Git inaccessible falla tancat; HEAD vàlid continua disponible', () => {
  for (const [ref, extra] of [['__p2_nonexistent_ref__', {}], ['--no-index', {}], ['HEAD', { env: { ...process.env, PATH: '' } }]]) {
    const result = spawnSync(process.execPath, [CLI, '--arrel', ARREL, '--json', '--strict-propagation', `--git-diff=${ref}`], { encoding: 'utf8', ...extra });
    assert.equal(result.status, 1, result.stderr);
    const res = JSON.parse(result.stdout);
    assert.equal(res.valid, false);
    assert.equal(res.lleisVerdes.includes('CEV-6'), false);
    assert.ok(res.infraccions.some(row => row.llei === 'CEV-6' && row.fitxer === '.git'));
  }
  const good = spawnSync(process.execPath, [CLI, '--arrel', ARREL, '--json', '--git-diff=HEAD'], { encoding: 'utf8' });
  assert.equal(good.status, 0, good.stderr);
  assert.equal(JSON.parse(good.stdout).valid, true);
});

test('CLI no convertix arguments desconeguts o incomplets en una comprovació sense canvis', () => {
  for (const args of [['--strict-propagaton'], ['--changed'], ['--changed=,'], ['--changed', '--json'], ['--arrel'], ['--arrel='], ['ref-sense-opcio']]) {
    const result = spawnSync(process.execPath, [CLI, '--json', ...args], { cwd: ARREL, encoding: 'utf8' });
    assert.equal(result.status, 2, `${args}: ${result.stdout} ${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Error d’execució:/);
  }
});

test('el tractor editorial és executable en la cadena completa, de portes, de cens i de diagnòstic', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ARREL, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['porta:coherencia-editorial'], 'node tooling/gates/tractor-coherencia-editorial-viva.mjs');
  for (const mode of [{}, { nomesPortes: true }, { cens: true }, { diagnostic: true }]) {
    const steps = seleccionaPassos(mode).filter(step => step.script === 'porta:coherencia-editorial');
    assert.equal(steps.length, 1, JSON.stringify(mode));
    assert.equal(steps[0].readOnly, true);
    assert.notEqual(steps[0].prova, true);
    assert.notEqual(steps[0].potMutar, true);
    const child = spawnSync(process.execPath, [...steps[0].args, '--json'], { cwd: ARREL, encoding: 'utf8', env: { ...process.env, SDP_DINS_DE_PORTA: '1' } });
    assert.equal(child.status, 0, child.stderr);
    assert.equal(JSON.parse(child.stdout).valid, true);
  }
});

test('CLI també executa la comprovació quan el seu camí conté espais', (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cev amb espais-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const executable = path.join(tmp, 'porta editorial.mjs');
  // Només es redirigixen imports locals al mateix codi del repositori. La
  // lògica de main de producció es copia intacta al camí amb espais.
  const source = fs.readFileSync(CLI, 'utf8').replace(/from (['"])(\.\.?\/[^'"]+)\1/g,
    (_match, quote, specifier) => `from ${quote}${pathToFileURL(path.resolve(path.dirname(CLI), specifier)).href}${quote}`);
  fs.writeFileSync(executable, source);
  const child = spawnSync(process.execPath, [executable, '--arrel', ARREL, '--json'], { encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr);
  assert.ok(child.stdout, child.stderr);
  const result = JSON.parse(child.stdout);
  assert.equal(result.valid, true);
  assert.equal(result.infraccions.length, 0);
});

test('CEV-1 valida el mapa sencer: el mapa viu passa i cada forat de configuració és roig', () => {
  assert.deepEqual(validaMapaCoherencia(llegixMapa(), ARREL), []);
  const casos = [
    ['llengues buides', (m) => { m.llengues = []; }],
    ['una llengua de menys', (m) => { m.llengues = ['ca', 'es', 'en', 'eu']; }],
    ['lèxic buit', (m) => { m.lexicProhibit = []; }],
    ['patró de lèxic invàlid', (m) => { m.lexicProhibit[0].patro = '(sense tancar'; }],
    ['pàgines multilingües buides', (m) => { m.paginesMultilingues = []; }],
    ['dominis buits', (m) => { m.dominisPropagacio = []; }],
    ['font de codi inexistent', (m) => { m.dominisPropagacio.find((d) => d.id === 'xat_push_i_privacitat').fontsCodi.push('src/data/push/'); }],
    ['funció edge inexistent', (m) => { m.dominisPropagacio.find((d) => d.id === 'xat_push_i_privacitat').fontsCodi.push('supabase/functions/web-push-send/'); }],
    ['directori de veu inexistent', (m) => { m.dominisPropagacio.find((d) => d.id === 'node0_maquinari_i_veu').fontsCodi.push('src/data/veu/'); }],
    ['destí editorial inexistent', (m) => { m.dominisPropagacio[0].destinsEditorials.push('src/sections/text/noExistix.js'); }],
    ['fitxer declarat com a directori', (m) => { m.dominisPropagacio[0].fontsCodi.push('package.json/'); }],
    ['ruta que ix de l’arrel', (m) => { m.dominisPropagacio[0].fontsCodi.push('../socdepoble.org/package.json'); }],
    ['ruta de versions absent', (m) => { delete m.versions.contracteNatiu; }],
    ['cens d’escoles no enter', (m) => { m.invariantsCens.escolesNode0 = '8'; }],
    ['patró d’escoles sense grup', (m) => { m.invariantsCens.escolesNode0Patrons.eu = 'eskola lokal'; }],
  ];
  for (const [nom, muta] of casos) {
    const mapa = llegixMapa();
    muta(mapa);
    assert.ok(validaMapaCoherencia(mapa, ARREL).length > 0, nom);
  }
});

test('CEV-1 atura la porta amb un mapa que vigila camins inexistents o llengües buides', async (t) => {
  for (const muta of [
    (m) => { m.dominisPropagacio.find((d) => d.id === 'xat_push_i_privacitat').fontsCodi = ['src/data/push/', 'supabase/functions/web-push-send/']; },
    (m) => { m.llengues = []; },
  ]) {
    const mapa = llegixMapa();
    muta(mapa);
    const arrel = creaArrelMutada(t, { [MAPA_REL]: JSON.stringify(mapa, null, 2) });
    const res = await avaluaCoherenciaEditorial({ arrel });
    assert.equal(res.valid, false);
    assert.deepEqual(res.lleisVerdes, []);
    assert.ok(res.infraccions.length > 0 && res.infraccions.every((row) => row.llei === 'CEV-1'), JSON.stringify(res.infraccions));
  }
});

test('CEV-6 vigila el codi real de l’E2EE, dels avisos push i de la veu del Node 0', async () => {
  const fonts = [
    ['src/config/xifratXat.js', 'xat_push_i_privacitat'],
    ['src/data/xifratXatActivacio.js', 'xat_push_i_privacitat'],
    ['src/config/avisosPushXat.js', 'xat_push_i_privacitat'],
    ['src/natiu/avisosPushNatius.js', 'xat_push_i_privacitat'],
    ['supabase/functions/notifica-xat/index.ts', 'xat_push_i_privacitat'],
    ['src/services/veuNode0.js', 'node0_maquinari_i_veu'],
    ['src/components/universal/veu/BarraReproductorVeu.jsx', 'node0_maquinari_i_veu'],
  ];
  for (const [font, domini] of fonts) {
    assert.equal(fs.existsSync(path.join(ARREL, font)), true, font);
    const res = await avaluaCoherenciaEditorial({ arrel: ARREL, changed: [font], strictPropagation: true });
    assert.equal(res.valid, false, font);
    assert.ok(res.infraccions.some((row) => row.llei === 'CEV-6' && row.detall.includes(`«${domini}»`)), font);
  }
  // Si es reescriu també el text públic que declara l'estat de l'E2EE, la propagació queda acreditada.
  const ambText = await avaluaCoherenciaEditorial({
    arrel: ARREL,
    changed: ['src/config/xifratXat.js', 'public/llms.txt'],
    strictPropagation: true,
  });
  assert.equal(ambText.valid, true, JSON.stringify(ambText.infraccions));
  const motiuLex02 = llegixMapa().lexicProhibit.find((r) => r.id === 'LEX-02').motiu;
  assert.doesNotMatch(motiuLex02, /opt-in/i, 'LEX-02 no pot descriure un opt-in E2EE que la bandera compilada no permet');
});

/* Les huit escoles en xifra i en lletra, i la mutació a set en les cinc llengües. */
const MUTACIONS_ESCOLES = [
  [/(?<![\d.,])8(\s+(?:escoles|escuelas|local|eskola|escolas)\b)/g, '7$1'],
  [/\bHuit(\s+escoles)/g, 'Set$1'],
  [/\bOcho(\s+escuelas)/g, 'Siete$1'],
  [/\bEight(\s+local)/g, 'Seven$1'],
  [/\bzortzi(\s+eskola)/g, 'zazpi$1'],
  [/\bOito(\s+escolas)/g, 'Sete$1'],
];
const muta = (txt, regles) => regles.reduce((acc, [re, per]) => acc.replace(re, per), txt);

test('CEV-3 compta les escoles del Node 0 ancorades al substantiu, no qualsevol «8» del text', async () => {
  const mapa = llegixMapa();
  const { PAGE_COPY } = await import('../src/sections/text/pageContent.js');
  const { localitzaPagina } = await import('../src/sections/text/pageContent.r10.js');
  for (const lang of mapa.llengues) {
    const nz = localitzaPagina(PAGE_COPY['node-zero'], lang, 'node-zero');
    const txt = `${nz.title} ${nz.lead} ${nz.html}`;
    const patro = mapa.invariantsCens.escolesNode0Patrons[lang];
    const viu = xifresEscolesNode0(txt, lang, patro);
    assert.ok(viu.length >= 2, `${lang}: ${viu}`);
    assert.ok(viu.every((n) => n === 8), `${lang}: ${viu}`);
    const mutat = muta(txt, MUTACIONS_ESCOLES);
    // L'antiga comprovació \b8\b continuava verda: «8 àmbits», «8.132 municipis».
    assert.match(mutat, /\b8\b/, lang);
    assert.ok(xifresEscolesNode0(mutat, lang, patro).every((n) => n === 7), lang);
    // Mutar només les xifres deixa la forma en lletra a 8: dues xifres diferents, també roig.
    const nomesXifres = xifresEscolesNode0(muta(txt, MUTACIONS_ESCOLES.slice(0, 1)), lang, patro);
    assert.ok(nomesXifres.includes(7), lang);
  }
  // Un article davant del substantiu no és una xifra.
  assert.deepEqual(xifresEscolesNode0('<p>les escoles locals del Node 0</p>', 'ca', mapa.invariantsCens.escolesNode0Patrons.ca), []);
});

test('CEV-3 cau en les cinc llengües si el text de node-zero passa a set escoles', async (t) => {
  const fonts = ['src/sections/text/pageContent.js', 'src/sections/text/pageContent.r10.js'];
  const substitucions = Object.fromEntries(fonts.map((rel) => [rel, muta(fs.readFileSync(path.join(ARREL, rel), 'utf8'), MUTACIONS_ESCOLES)]));
  const arrel = creaArrelMutada(t, substitucions);
  const res = await avaluaCoherenciaEditorial({ arrel });
  assert.equal(res.valid, false);
  assert.equal(res.lleisVerdes.includes('CEV-3'), false);
  const files = res.infraccions.filter((row) => row.llei === 'CEV-3').map((row) => row.fitxer);
  assert.deepEqual(files, ['ca', 'es', 'en', 'eu', 'gl'].map((lang) => `PAGE_COPY.node-zero.${lang}`));
});
