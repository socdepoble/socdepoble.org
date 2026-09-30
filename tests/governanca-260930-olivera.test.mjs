/** Prova de laboratori del paquet T5 · porta Olivera v3 i skill d'higiene (àrea C3, torn 260930_0040).
 *
 *  El paquet viu a `02_investigacio_ia/260930_0040_governanca_claude/` i l'aplicarà
 *  l'executor amb una lease del Mestre. Ací es comprova abans, sense escriure res
 *  al repositori:
 *    (a) cada operació de `pegats/t5-olivera.mjs` s'aplica en memòria contra el
 *        contingut ACTUAL i el resultat es valida amb les mateixes eines que el
 *        consumiran (js-yaml + esquema, parseYamlLite, catàleg, índex del router);
 *    (b) la porta nova importa `../lib/arrel.mjs` i no es pot carregar des del
 *        laboratori: es construïx a os.tmpdir() una còpia de `tooling/` amb la porta
 *        nova superposada, s'hi posen les proves que entren amb el codi (i
 *        `sistema_nervios`, que ja la importa) i s'executen allí.
 *  Si una operació ja està aplicada (després de l'executor), es valida l'estat
 *  final en compte del pegat. Si el laboratori s'arxiva, totes les proves fan skip.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude');
const PEGAT = path.join(LAB, 'pegats/t5-olivera.mjs');
const HI_HA_LAB = fs.existsSync(PEGAT);
const ABSENT = 'laboratori 260930_0040_governanca_claude absent (arxivat o aplicat i retirat)';

// Els mòduls del repo només es carreguen amb el laboratori present: arxivat, este
// fitxer ha de fer skip encara que eixos mòduls canvien.
const { parseDocument, validateSchema, checkSchema } = HI_HA_LAB ? await import('../tooling/documental/core.mjs') : {};
const { parseFrontmatter } = HI_HA_LAB ? await import('../tooling/wiki/lib/frontmatter.mjs') : {};
const { projeccions } = HI_HA_LAB ? await import('../tooling/brain/cataleg_skills.mjs') : {};
const { construeixIndex } = HI_HA_LAB ? await import('../tooling/brain/build_skills_index.mjs') : {};
const { encamina } = HI_HA_LAB ? await import('../tooling/session/persona_router.mjs') : {};

const SKILL = 'core-higiene-escriptori';
const RUTES = [
  'tooling/gates/porta-olivera.mjs',
  'tests/porta-olivera-v3.test.mjs',
  'tests/tractor-fortification.test.mjs',
  `.agents/skills/${SKILL}/SKILL.md`,
  '.agents/skills/00_INDEX_SKILLS.md',
  '.agents/skills_index.json'
];

const sha = (text) => createHash('sha256').update(text).digest('hex');
const llig = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const nou = (rel) => fs.readFileSync(path.join(LAB, rel), 'utf8');
const operacions = HI_HA_LAB ? (await import(pathToFileURL(PEGAT).href)).operacions : [];
const op = (ruta) => operacions.find((o) => o.ruta === ruta);

/**
 * Estat d'una operació contra el repositori viu: el contingut que quedaria (o que ja
 * hi ha, si l'executor ja l'ha aplicada). Qualsevol altra situació és una deriva i
 * falla: el pegat s'ha de tornar a derivar.
 */
function resultat(o) {
  const existix = fs.existsSync(path.join(REPO, o.ruta));
  if (o.crea) {
    const final = nou(o.crea);
    if (existix) {
      assert.equal(llig(o.ruta), final, `${o.ruta} ja existix i no és la còpia del laboratori`);
      return { aplicada: true, text: final };
    }
    return { aplicada: false, text: final };
  }
  const actual = llig(o.ruta);
  if (o.substituix) {
    const final = nou(o.substituix);
    if (actual === final) return { aplicada: true, text: final };
    assert.equal(sha(actual), o.base, `${o.ruta}: el sha viu no és la base del pegat; torna a derivar-lo`);
    return { aplicada: false, text: final };
  }
  try {
    return { aplicada: false, text: o.aplica(actual), abans: actual };
  } catch (e) {
    if (/no es duplica/.test(e.message)) return { aplicada: true, text: actual };
    throw e;
  }
}

const liniesCanviades = (a, b) => {
  const x = a.split('\n'), y = b.split('\n');
  assert.equal(x.length, y.length, 'el pegat no afig ni lleva línies');
  return x.map((l, i) => (l === y[i] ? null : i)).filter((i) => i !== null);
};

/* ── (a) Operacions en memòria ────────────────────────────────────────────── */

test('el paquet T5 declara les sis operacions esperades, cada una d’un sol tipus i amb ruta relativa', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  assert.deepEqual(operacions.map((o) => o.ruta), RUTES);
  for (const o of operacions) {
    const tipus = ['crea', 'substituix', 'aplica'].filter((k) => k in o);
    assert.equal(tipus.length, 1, `${o.ruta}: ${tipus.join(', ')}`);
    assert.ok(typeof o.descripcio === 'string' && o.descripcio.length > 20, o.ruta);
    assert.ok(!path.isAbsolute(o.ruta) && !o.ruta.split('/').includes('..'), o.ruta);
    if (o.crea || o.substituix) assert.match(o.crea || o.substituix, /^nous\//);
    if (o.substituix) assert.match(o.base, /^[a-f0-9]{64}$/);
    if (o.aplica) assert.equal(typeof o.aplica, 'function');
  }
});

test('la porta i la prova v3 són còpies finals sintàcticament vàlides, i la base és la del repo viu', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  for (const ruta of ['tooling/gates/porta-olivera.mjs', 'tests/porta-olivera-v3.test.mjs']) {
    const o = op(ruta);
    resultat(o);
    const r = spawnSync(process.execPath, ['--check', path.join(LAB, o.crea || o.substituix)], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  }
  // L'API que importen hooks-local i les proves existents continua exportada.
  const porta = nou(op('tooling/gates/porta-olivera.mjs').substituix);
  for (const nom of ['ARREL', 'avui', 'inventari', 'ranci', 'plaDeHui', 'ancoratge', 'checkOlivera', 'esPetorreta', 'destiDeShell', 'checkPayload']) {
    assert.match(porta, new RegExp(`^export (?:const|function) ${nom}\\b`, 'm'), nom);
  }
});

test('la skill nova té frontmatter vàlid per a l’esquema, per a parseYamlLite i per al catàleg', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const o = op(`.agents/skills/${SKILL}/SKILL.md`);
  const { text } = resultat(o);

  const schema = JSON.parse(llig('tooling/wiki/schema.json'));
  checkSchema(schema);
  const { data, body } = parseDocument(text);
  assert.deepEqual(validateSchema(data, schema), []);

  const lite = parseFrontmatter(text);
  assert.equal(lite.hasFrontmatter, true);
  assert.deepEqual(lite.errors, []);
  // Les mateixes condicions que inventari() de cataleg_skills.mjs.
  assert.equal(lite.data.name, SKILL);
  assert.equal(lite.data.type, 'skill');
  assert.equal(lite.data.status, 'actiu');
  assert.ok(Array.isArray(lite.data.triggers_on) && lite.data.triggers_on.every((d) => typeof d === 'string' && d.trim()));
  assert.equal(lite.data.core, undefined, 'continua sent plugin, no core');
  // Els tres lectors lligen la mateixa descripció: js-yaml, parseYamlLite i el parser
  // mínim d'una línia de consola-iaia/matrix (per això no és un bloc `>-`).
  assert.equal(data.description, lite.data.description);
  assert.equal(/^description:[ \t]*(.*)$/m.exec(text)[1], data.description);
  assert.deepEqual(data.triggers_on, lite.data.triggers_on);
  assert.equal(data.version, '3.1.0');
  const llargada = [...data.description].length;
  assert.ok(llargada >= 12 && llargada <= 220, `descripció de ${llargada} caràcters`);
  for (const paraula of ['prompt', 'petorreta', 'pla', 'brut']) assert.match(data.description, new RegExp(paraula));

  // Cos: procediment complet, qui la fa, la lliçó en positiu i cap frase paralitzant.
  for (const tros of ['## Qui la fa', 'observa → actua → verifica → informa', '--hook', '--arxiva --nom', '--sec',
    '## Activitat en curs', 'document.mjs handoff', '## Lliçons del Mestre', '260929', '## Vincles', '[[00_INDEX_SKILLS]]']) {
    assert.ok(body.includes(tros), tros);
  }
  assert.doesNotMatch(body, /per si sola no autoritza/);
  assert.doesNotMatch(body, /node tooling\/gates\/porta-olivera\.mjs`/, 'mai el binari sense bandera');
});

test('els disparadors nous encaminen cap a la skill amb les peticions de T5', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const { text } = resultat(op(`.agents/skills/${SKILL}/SKILL.md`));
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-olivera-router-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, `.agents/skills/${SKILL}`), { recursive: true });
  fs.writeFileSync(path.join(arrel, `.agents/skills/${SKILL}/SKILL.md`), text);
  const index = construeixIndex(arrel);
  const dispara = (prompt) => encamina(prompt, index).some((s) => s.name === SKILL);
  for (const prompt of ['Prepara una petorreta per a Claude', 'Escriu el prompt per a Codex', "Fes el pla d'implementació de la consola", "L'escriptori brut una altra vegada", "Neteja l'escriptori abans de començar"]) {
    assert.equal(dispara(prompt), true, prompt);
  }
  assert.equal(dispara('Hola, com va la tomaca?'), false);
});

test('00_INDEX_SKILLS.md canvia només la línia de la skill, amb la forma exacta de projeccions()', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const skill = parseFrontmatter(resultat(op(`.agents/skills/${SKILL}/SKILL.md`)).text).data;
  const o = op('.agents/skills/00_INDEX_SKILLS.md');
  const r = resultat(o);
  const esperada = projeccions([{ id: SKILL, description: skill.description.replace(/\s+/g, ' ') }])
    .get('.agents/skills/00_INDEX_SKILLS.md').split('\n').find((l) => l.startsWith(`- [[${SKILL}/`));
  const linia = r.text.split('\n').filter((l) => l.startsWith(`- [[${SKILL}/`));
  assert.deepEqual(linia, [esperada]);
  if (r.aplicada) return;
  assert.equal(liniesCanviades(r.abans, r.text).length, 1);
  assert.throws(() => o.aplica(r.text), /no es duplica/, 'idempotent-segur');
  assert.throws(() => o.aplica(r.abans.replace(`- [[${SKILL}/`, `- [[${SKILL}-x/`)), /exactament 1/, 'ancoratge absent');
});

test('skills_index.json porta l’entrada que construeixIndex() trauria de la skill nova, i res més canvia', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const { text: skill } = resultat(op(`.agents/skills/${SKILL}/SKILL.md`));
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-olivera-index-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.mkdirSync(path.join(arrel, `.agents/skills/${SKILL}`), { recursive: true });
  fs.writeFileSync(path.join(arrel, `.agents/skills/${SKILL}/SKILL.md`), skill);
  const esperada = construeixIndex(arrel).plugins[SKILL];

  const o = op('.agents/skills_index.json');
  const r = resultat(o);
  const index = JSON.parse(r.text);
  assert.equal(`${JSON.stringify(index, null, 2)}\n`, r.text, 'forma de build_skills_index.mjs');
  assert.deepEqual(index.plugins[SKILL], esperada);
  if (r.aplicada) return;
  const abans = JSON.parse(r.abans);
  delete abans.plugins[SKILL];
  delete index.plugins[SKILL];
  assert.deepEqual(index, abans, 'la resta de l’índex no es toca');
  assert.deepEqual(Object.keys(JSON.parse(r.text).plugins), Object.keys(JSON.parse(r.abans).plugins), 'ni l’ordre de les claus');
  assert.throws(() => o.aplica(r.text), /no es duplica/);
  assert.throws(() => o.aplica(r.abans.replace('"core-higiene-escriptori": {', '"core-higiene-escriptori" : {')), /forma de build_skills_index/);
});

test('la skill es reescriu sencera només sobre la base coneguda', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const o = op(`.agents/skills/${SKILL}/SKILL.md`);
  const r = resultat(o);
  if (r.aplicada) return;
  assert.throws(() => o.aplica(r.text), /no es duplica/);
  assert.throws(() => o.aplica(`${r.abans}\n- lliçó afegida per un altre agent\n`), /ha canviat/);
});

test('tractor-fortification canvia una sola línia: la invocació del binari passa --hook', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const o = op('tests/tractor-fortification.test.mjs');
  const r = resultat(o);
  assert.match(r.text, /'tooling\/gates\/porta-olivera\.mjs'\),'--hook'\],\{cwd:root,env:\{\.\.\.process\.env,SDP_ARREL:root\},input:'\{'/);
  if (r.aplicada) return;
  assert.equal(liniesCanviades(r.abans, r.text).length, 1);
  assert.throws(() => o.aplica(r.text), /no es duplica/);
});

test('cap altra prova de tests/ invoca el binari sense bandera esperant el mode hook', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const tests = path.join(REPO, 'tests');
  const sospitoses = [];
  for (const nom of fs.readdirSync(tests).filter((n) => n.endsWith('.test.mjs') && !n.startsWith('governanca-260930'))) {
    const text = nom === 'tractor-fortification.test.mjs' ? resultat(op('tests/tractor-fortification.test.mjs')).text : fs.readFileSync(path.join(tests, nom), 'utf8');
    for (const m of text.matchAll(/porta-olivera\.mjs'\)\]/g)) sospitoses.push(`${nom}@${m.index}`);
  }
  assert.deepEqual(sospitoses, []);
});

test('el codi que entra passa l’ESLint del repositori, sense més avisos que el que substituïx', async (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  const missatges = async (text, rel) => (await eslint.lintText(text, { filePath: path.join(REPO, rel) }))[0].messages
    .map((m) => `${rel}:${m.line} ${m.severity === 2 ? 'error' : 'avís'} ${m.ruleId} ${m.message}`);
  for (const ruta of ['tooling/gates/porta-olivera.mjs', 'tests/porta-olivera-v3.test.mjs', 'tests/tractor-fortification.test.mjs']) {
    const ara = await missatges(resultat(op(ruta)).text, ruta);
    const abans = fs.existsSync(path.join(REPO, ruta)) ? await missatges(llig(ruta), ruta) : [];
    assert.deepEqual(ara.filter((m) => / error /.test(m)), [], ara.join('\n'));
    assert.ok(ara.length <= abans.length, `avisos nous:\n${ara.join('\n')}`);
  }
});

/* ── (b) La porta nova, en una còpia de tooling/ ──────────────────────────── */

/** Còpia de `tooling/` a os.tmpdir() amb la porta del laboratori superposada i les proves que entren amb el codi. */
function arbreDeProves(t) {
  const arbre = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-olivera-arbre-')));
  t.after(() => fs.rmSync(arbre, { recursive: true, force: true }));
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store)$/.test(src);
  fs.cpSync(path.join(REPO, 'tooling'), path.join(arbre, 'tooling'), { recursive: true, filter: fora });
  fs.cpSync(path.join(REPO, 'scripts/immunitari'), path.join(arbre, 'scripts/immunitari'), { recursive: true, filter: fora });
  fs.copyFileSync(path.join(LAB, op('tooling/gates/porta-olivera.mjs').substituix), path.join(arbre, 'tooling/gates/porta-olivera.mjs'));
  fs.mkdirSync(path.join(arbre, 'tests'));
  fs.copyFileSync(path.join(LAB, op('tests/porta-olivera-v3.test.mjs').crea), path.join(arbre, 'tests/porta-olivera-v3.test.mjs'));
  fs.writeFileSync(path.join(arbre, 'tests/tractor-fortification.test.mjs'), resultat(op('tests/tractor-fortification.test.mjs')).text);
  fs.copyFileSync(path.join(REPO, 'tests/sistema_nervios.test.mjs'), path.join(arbre, 'tests/sistema_nervios.test.mjs'));
  // La plantilla viva: la bateria v3 hi contrasta el nom de la secció 0.
  const plantilla = '_wiki_de_poble/03_actuar/plantilles/prompt_local.md';
  fs.mkdirSync(path.dirname(path.join(arbre, plantilla)), { recursive: true });
  fs.copyFileSync(path.join(REPO, plantilla), path.join(arbre, plantilla));
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(arbre, 'node_modules'), 'dir');
  // Marcador propi: els mòduls que resolen l'arrel en carregar-se ho fan dins de la
  // còpia i mai no apunten al repositori real.
  fs.mkdirSync(path.join(arbre, '.agents'));
  fs.writeFileSync(path.join(arbre, '.agents/AGENTS.md'), '# BIOS de la còpia de proves\n');
  return arbre;
}

function nodeTest(arbre, fitxers) {
  const env = { ...process.env };
  delete env.SDP_ARREL;
  // Sense açò, el `node --test` fill parlaria el protocol intern del pare i no l'informe.
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...fitxers], { cwd: arbre, env, encoding: 'utf8', timeout: 180000 });
}

test('en una còpia de tooling/ amb la porta nova passen porta-olivera-v3, tractor-fortification i sistema_nervios', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const arbre = arbreDeProves(t);
  assert.match(fs.readFileSync(path.join(arbre, 'tooling/gates/porta-olivera.mjs'), 'utf8'), /export function checkTaula/);
  const r = nodeTest(arbre, ['tests/porta-olivera-v3.test.mjs', 'tests/tractor-fortification.test.mjs', 'tests/sistema_nervios.test.mjs']);
  const informe = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, informe);
  assert.match(r.stdout, /ℹ fail 0/);
  assert.match(r.stdout, /ℹ skipped 0/, 'cap prova de la bateria s’ha saltat a la còpia');
  assert.match(r.stdout, /✔ la secció 0 de la plantilla viva prompt_local\.md/);
  const passades = Number(/ℹ pass (\d+)/.exec(r.stdout)?.[1] ?? 0);
  assert.ok(passades >= 25, `només ${passades} proves passades:\n${informe}`);
});

/**
 * Una bateria que no cau quan la porta torna enrere no protegix res. Cada mutant
 * reintroduïx una fallada coneguda del 260929-30 i la bateria v3 l'ha de posar roja
 * per una asserció (hi ha d'haver proves verdes: el mòdul carrega), no per sintaxi.
 */
test('la bateria v3 mossega: cada regressió coneguda de la porta la posa roja', (t) => {
  if (!HI_HA_LAB) return t.skip(ABSENT);
  const arbre = arbreDeProves(t);
  const desti = path.join(arbre, 'tooling/gates/porta-olivera.mjs');
  const original = fs.readFileSync(desti, 'utf8');
  const mutants = {
    'viu per data': ["&& !viu.has(d.nom.replace(/\\.md$/, ''))", ''],
    'només «Abans de generar»': ['(?:Abans de generar|Preflight)', 'Abans de generar'],
    'sense bandera llig stdin': ['if (!o.hook) { process.exitCode = informe(arrel); return; }', 'if (o.informe) { process.exitCode = informe(arrel); return; }'],
    '--sec ignorat': ['if (sec) {', 'if (false) {'],
    'subcarpeta pel seu nom final': ["if (!solt || solt.includes('/')) {", 'if (!solt) {'],
    'categoria no transitòria per nom': ['if (!TRANSITORIES.test(d.categoria)) {', 'if (false) {'],
    'informe que exigix el pla de hui': ['return checkTaula(arrel, { dia }).valid ? 0 : 1;', 'return checkOlivera(arrel, { dia }).valid ? 0 : 1;'],
    'Safata invisible': ['if (bustia.elements.length) {', 'if (false) {']
  };
  for (const [nom, [vell, nou]] of Object.entries(mutants)) {
    assert.equal(original.split(vell).length, 2, `el mutant «${nom}» no troba el seu ancoratge a la porta`);
    fs.writeFileSync(desti, original.replace(vell, () => nou));
    const r = nodeTest(arbre, ['tests/porta-olivera-v3.test.mjs']);
    assert.notEqual(r.status, 0, `el mutant «${nom}» sobreviu a la bateria v3`);
    assert.match(r.stdout, /✔/, `el mutant «${nom}» no ha carregat:\n${r.stdout}\n${r.stderr}`);
  }
  fs.writeFileSync(desti, original);
});
