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

/* P0-CONSOLIDACIO-3-CATEDRES (Emowe/Tellado) · CEV-4 vigila que public/llms.txt i la
   llista de public/md siguen la projecció de publication-policy.mjs (genera-llms.mjs).
   L'arrel mutada porta una còpia real de la Wiki pública: la projecció no seguix
   enllaços simbòlics. */
function ambWikiReal(arrel) {
  fs.unlinkSync(path.join(arrel, '_wiki_de_poble'));
  for (const nom of ['00_index.md', '01_ser', '02_saber', '03_actuar']) {
    fs.cpSync(path.join(ARREL, '_wiki_de_poble', nom), path.join(arrel, '_wiki_de_poble', nom), { recursive: true });
  }
  return arrel;
}
const infraccionsLlms = (res) => res.infraccions.filter((row) => row.llei === 'CEV-4' && /^public\/(?:llms\.txt|md)$/.test(row.fitxer));

test('CEV-4 · llms.txt editat a mà o un .md que no és cap document públic posen roja la porta', async (t) => {
  const llms = fs.readFileSync(path.join(ARREL, 'public/llms.txt'), 'utf8');
  const control = ambWikiReal(creaArrelMutada(t, { 'public/llms.txt': llms }));
  assert.deepEqual(infraccionsLlms(await avaluaCoherenciaEditorial({ arrel: control })), []);

  const ama = ambWikiReal(creaArrelMutada(t, { 'public/llms.txt': `${llms}- [A mà](https://socdepoble.org/mur): línia afegida a mà\n` }));
  const resAMa = await avaluaCoherenciaEditorial({ arrel: ama });
  assert.equal(resAMa.lleisVerdes.includes('CEV-4'), false);
  assert.deepEqual(infraccionsLlms(resAMa).map((row) => row.fitxer), ['public/llms.txt']);
  assert.match(infraccionsLlms(resAMa)[0].detall, /editat a mà/);

  // Una substitució d'un .md real fa de public/md una carpeta pròpia de l'arrel mutada (mai el repositori).
  const unMd = fs.readdirSync(path.join(ARREL, 'public/md'))[0];
  const sobrer = ambWikiReal(creaArrelMutada(t, { [`public/md/${unMd}`]: fs.readFileSync(path.join(ARREL, 'public/md', unMd), 'utf8') }));
  assert.equal(fs.lstatSync(path.join(sobrer, 'public/md')).isSymbolicLink(), false);
  fs.writeFileSync(path.join(sobrer, 'public/md/document-privat.md'), '# Privat\n');
  const resSobrer = await avaluaCoherenciaEditorial({ arrel: sobrer });
  assert.deepEqual(infraccionsLlms(resSobrer).map((row) => row.fitxer), ['public/md']);
  assert.match(infraccionsLlms(resSobrer)[0].detall, /sobren: document-privat\.md/);
});

/* v1.2.26 (IDEA-364, C26-4) · La subcarpeta public/md/skills és part de la projecció pública que escriu
   genera-llms.mjs (public-skills.mjs): la porta la reconeix com a carpeta i el seu contingut el comprova
   «genera-llms.mjs --comprova». Un fitxer que es diga «skills», o l'absència de la carpeta, la posen roja. */
test('CEV-4 · public/md/skills és part de la projecció: carpeta reconeguda, fitxer «skills» o absència en roig', async (t) => {
  const unMd = fs.readdirSync(path.join(ARREL, 'public/md')).find((nom) => nom.endsWith('.md'));
  const arrel = () => ambWikiReal(creaArrelMutada(t, { [`public/md/${unMd}`]: fs.readFileSync(path.join(ARREL, 'public/md', unMd), 'utf8') }));
  const control = arrel();
  assert.equal(fs.statSync(path.join(control, 'public/md/skills')).isDirectory(), true);
  assert.deepEqual(infraccionsLlms(await avaluaCoherenciaEditorial({ arrel: control })), []);

  const fitxer = arrel();
  fs.unlinkSync(path.join(fitxer, 'public/md/skills'));
  fs.writeFileSync(path.join(fitxer, 'public/md/skills'), 'no és cap carpeta\n');
  const resFitxer = infraccionsLlms(await avaluaCoherenciaEditorial({ arrel: fitxer }));
  assert.deepEqual(resFitxer.map((row) => row.fitxer), ['public/md']);
  assert.match(resFitxer[0].detall, /sobren: skills; falten: cap;/);

  const absent = arrel();
  fs.unlinkSync(path.join(absent, 'public/md/skills'));
  const resAbsent = infraccionsLlms(await avaluaCoherenciaEditorial({ arrel: absent }));
  assert.match(resAbsent[0]?.detall ?? '', /sobren: cap; falten: skills;/);
});

/* v1.2.26 (C26-4, Gauntlet #4) · La policia de vocabulari passa per la projecció pública en MODE AVÍS:
   el que avisa ix a avisosVocabulari (fitxer de public/md, línia, codi i proposta) i mai a infraccions. */
test('CEV-4 · la policia de vocabulari avisa sobre la projecció pública i no fa caure cap llei', async (t) => {
  const arrel = ambWikiReal(creaArrelMutada(t, { 'public/llms.txt': fs.readFileSync(path.join(ARREL, 'public/llms.txt'), 'utf8') }));
  const control = await avaluaCoherenciaEditorial({ arrel });
  assert.ok(Array.isArray(control.avisosVocabulari));
  fs.writeFileSync(path.join(arrel, '_wiki_de_poble/02_saber/prova_vocabulari_v1226.md'),
    '---\ntype: document\nstatus: canonic\ntitle: Prova de vocabulari\n---\n# Prova de vocabulari\n\nLa IA del poble usa models.\n');
  const res = await avaluaCoherenciaEditorial({ arrel });
  const nous = res.avisosVocabulari.filter((avis) => !control.avisosVocabulari.some((c) => c.fitxer === avis.fitxer && c.linia === avis.linia && c.codi === avis.codi));
  assert.deepEqual(nous.map((avis) => avis.codi), ['VOC-DE-POBLE', 'VOC-UTILITZA']);
  for (const avis of nous) {
    assert.match(avis.fitxer, /^public\/md\/[^/]+\.md$/);
    assert.equal(avis.severitat, 'avis');
    assert.ok(avis.linia > 1 && avis.proposta);
  }
  // El document nou desquadra la projecció del disc (CEV-4), però cap infracció ve de la policia.
  assert.equal(res.infraccions.some((row) => /\bVOC-(?:DE-POBLE|UTILITZA)\b/.test(`${row.llei} ${row.detall}`)), false);
  assert.equal(res.infraccions.some((row) => /«(?:IA del poble|usa)»/.test(row.detall)), false);
});

/* v1.2.26 (D4 Opció B) · Un esborrany de la Wiki no té còpia a public/md (projectaLlms el descarta per noindex), però
   /wikidepoble el continua publicant: la policia de vocabulari també el llig, en mode avís, i l'avís porta el camí i
   la línia del fitxer de la Wiki, no cap camí de public/md. */
test('CEV-4 · la policia de vocabulari també llig els esborranys de la Wiki, amb el camí i la línia de la Wiki', async (t) => {
  const arrel = ambWikiReal(creaArrelMutada(t, { 'public/llms.txt': fs.readFileSync(path.join(ARREL, 'public/llms.txt'), 'utf8') }));
  const control = await avaluaCoherenciaEditorial({ arrel });
  // L'esborrany viu: «la filosofia del poble» a la línia 26 del fitxer (amb el frontmatter comptat).
  const antigravity = control.avisosVocabulari.filter((avis) => avis.fitxer === '_wiki_de_poble/02_saber/antigravity.md');
  assert.ok(antigravity.some((avis) => avis.linia === 26 && avis.codi === 'VOC-DE-POBLE' && /filosofia\s+del\s+poble/i.test(avis.original)),
    JSON.stringify(antigravity));
  assert.equal(fs.existsSync(path.join(arrel, 'public/md/antigravity.md')), false, 'l’esborrany no té còpia a public/md');

  const rel = '_wiki_de_poble/02_saber/prova_esborrany_vocabulari_v1226.md';
  fs.writeFileSync(path.join(arrel, rel),
    '---\ntype: document\nstatus: esborrany\ntitle: Prova d’esborrany\n---\n# Prova d’esborrany\n\nSense la filosofia del poble, res no té sentit.\n');
  const res = await avaluaCoherenciaEditorial({ arrel });
  const nous = res.avisosVocabulari.filter((avis) => !control.avisosVocabulari.some((c) => c.fitxer === avis.fitxer && c.linia === avis.linia && c.codi === avis.codi));
  assert.deepEqual(nous.map(({ fitxer, linia, codi, severitat }) => ({ fitxer, linia, codi, severitat })),
    [{ fitxer: rel, linia: 8, codi: 'VOC-DE-POBLE', severitat: 'avis' }]);
  assert.match(nous[0].original, /^filosofia del poble$/i);
  // Un esborrany no desquadra la projecció (no té fitxer a public/md) i la policia no fa caure cap llei.
  assert.deepEqual(infraccionsLlms(res), []);
  assert.equal(res.infraccions.some((row) => row.fitxer === rel || /filosofia del poble/i.test(row.detall)), false);
  // Un document indexable amb el mateix text avisa des de public/md, no des de la Wiki: cada document, un sol camí.
  fs.writeFileSync(path.join(arrel, rel), fs.readFileSync(path.join(arrel, rel), 'utf8').replace('status: esborrany', 'status: canonic'));
  const indexable = await avaluaCoherenciaEditorial({ arrel });
  assert.equal(indexable.avisosVocabulari.some((avis) => avis.fitxer === rel), false);
  assert.ok(indexable.avisosVocabulari.some((avis) => /^public\/md\/[^/]+\.md$/.test(avis.fitxer) && /filosofia del poble/i.test(avis.original)));
});
