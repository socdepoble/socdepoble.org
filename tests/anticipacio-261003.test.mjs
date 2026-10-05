/** Corredor del laboratori 261003_1330_anticipacio_claude (torn torn_dba36e21, T6).
 *
 *  El nucli `anticipacio.mjs` viu al laboratori com a `.txt` i l'aplicarà
 *  l'executor amb una lease del Mestre. Mentre no s'aplique, este corredor el
 *  copia com a `.mjs` a un directori de os.tmpdir() amb espais al nom (com
 *  l'arrel real) i el prova contra Escriptoris sintètics, també a os.tmpdir().
 *  Les portes reals (checkTaula i ranci de porta-olivera.mjs) s'importen del
 *  repositori com a lectura i s'injecten, igual que farà la CLI. Cap prova
 *  escriu al repositori ni hi llig dades personals: noms i textos sintètics.
 *
 *  Fa skip si el laboratori no hi és, o si tooling/gates/anticipacio.mjs ja
 *  està instal·lat: llavors manen les proves de la instal·lació.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_anticipacio_claude';
const LAB = path.join(REPO, REL_LAB);
const FONT = path.join(LAB, 'nous/tooling/gates/anticipacio.mjs.txt');
const MANIFEST_LAB = path.join(LAB, 'nous/.agents/skills/core-anticipacio/tractor.json.txt');
const INSTALLAT = fs.existsSync(path.join(REPO, 'tooling/gates/anticipacio.mjs'));
const ACTIU = fs.existsSync(FONT) && !INSTALLAT;
const MOTIU_SKIP = INSTALLAT
  ? 'tooling/gates/anticipacio.mjs ja està instal·lat: manen les proves de la instal·lació'
  : 'laboratori 261003_1330_anticipacio_claude absent';

let a = null;
let MODUL = null;
if (ACTIU) {
  const carpeta = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp anticipacio ')));
  after(() => fs.rmSync(carpeta, { recursive: true, force: true }));
  MODUL = path.join(carpeta, 'anticipacio.mjs');
  fs.copyFileSync(FONT, MODUL);
  a = await import(pathToFileURL(MODUL).href);
}
const olivera = ACTIU ? await import(pathToFileURL(path.join(REPO, 'tooling/gates/porta-olivera.mjs')).href) : null;

function salta(t) {
  if (ACTIU) return false;
  t.skip(MOTIU_SKIP);
  return true;
}

/* ── Mas sintètic ─────────────────────────────────────────────────────────── */

const DESK = '_wiki_de_poble/04_escriptori';
// Hora fixa en local: cap prova depén del dia en què s'execute.
const ARA = new Date(2026, 9, 3, 13, 30);
const DIA = '261003';
const AHIR = '261002';
const TORN = 'torn_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const REBUT = '11111111-2222-4333-8444-555555555555';
const ESTAT = '# ESTAT\n\n## ESTAT_ACTUAL · 2026-10-02 · Claude · relleu sintètic\n- Torn de prova.\n';
const PLA = `---\ntype: document\nstatus: esborrany\ndescription: Pla sintètic de prova\nreflex: sdp:${TORN}:${REBUT}\n---\n# Pla sintètic\n\n## Canvis proposats\n\nCanvis comprovats amb evidència.\n`;
const PLA_BUIT = PLA.replace('Canvis comprovats amb evidència.', '[pendent]');
const PROMPT = `${DESK}/${DIA}_1250_prompt_claude_onada_3.md`;
const PLA_BO = `${DIA}_1250_pla_implementacio_onada_3.md`;
const DEPS = Object.freeze({ checkTaula: (r, o) => olivera.checkTaula(r, o), ranci: (r, d) => olivera.ranci(r, d) });
const APROVAT = Object.freeze({ ...DEPS, aprovacio: () => ({ estat: 'aprovat', motiu: 'aprovació sintètica', caduca: null }) });
const torn = (pla = PLA_BO) => ({ turn_id: TORN, actor: 'MarIA', plan: pla ? { file: `${DESK}/${pla}` } : null });

function posa(arrel, rel, text) {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), text);
}

/**
 * Un repositori fals amb l'Escriptori, l'índex, l'ESTAT i les actes. Cada fitxer
 * visible que no és a `vius` s'ancora davall de «## Documents», inclosos els
 * recursos amb extensió explícita. L'àncora acredita presència, no vida: B3
 * encara jutja els solts d'ahir fora de la política Markdown de ranci.
 */
function mas(t, { docs = {}, vius = [], estat = ESTAT, ledger = '# LEDGER\n', actes = [`${AHIR}_2300_acta_marmota.md`], ordre = 'directe' } = {}) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-anticipacio-mas-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  for (const dir of [`${DESK}/00_bandeja_d_entrada`, `${DESK}/02_investigacio_ia`, '_wiki_de_poble/10_actes', '.agents/runtime/turns']) {
    fs.mkdirSync(path.join(arrel, dir), { recursive: true });
  }
  const noms = Object.keys(docs);
  for (const nom of ordre === 'invers' ? [...noms].reverse() : noms) posa(arrel, `${DESK}/${nom}`, docs[nom]);
  const declarats = vius.join('\n');
  const referent = (nom) => nom.replace(/\.md$/, '');
  const ancores = noms.filter((n) => !n.startsWith('.') && !declarats.includes(`[[${referent(n)}]]`))
    .map((n) => `- [[${referent(n)}]]`);
  posa(arrel, `${DESK}/00_index_escriptori.md`, `---\ntype: index\n---\n# Índex de l'Escriptori\n\n## Activitat en curs\n\n${declarats}\n\n## Documents\n\n${ancores.join('\n')}\n`);
  posa(arrel, '.agents/ESTAT.md', estat);
  posa(arrel, '.agents/LEDGER.md', ledger);
  for (const acta of actes) posa(arrel, `_wiki_de_poble/10_actes/${acta}`, '# Acta sintètica\n');
  return arrel;
}

/** L'Escriptori del matí del 261003, tal com el va trobar MarIA: quatre vius d'ahir i un ranci. */
const DOCS_261003 = Object.freeze({
  [`${AHIR}_1650_pla_implementacio_massiva_claude.md`]: PLA,
  [`${AHIR}_1650_prompt_claude_massiu.md`]: '# Prompt sintètic\n',
  [`${AHIR}_1700_auditoria_claude.md`]: '# Auditoria sintètica\n',
  [`${AHIR}_1700_informe_estudi_mercat.md`]: '# Informe sintètic\n',
  [`${AHIR}_2015_prompt_fable_auditoria_extrema.md`]: '# Prompt sintètic\n',
  [PLA_BO]: PLA,
});
const VIUS_261003 = Object.freeze([
  `- [[${AHIR}_1650_pla_implementacio_massiva_claude]]`,
  `- [[${AHIR}_1650_prompt_claude_massiu]]`,
  `- [[${AHIR}_1700_auditoria_claude]]`,
  `- [[${AHIR}_1700_informe_estudi_mercat]]`,
]);
const ids = (llista) => llista.map((x) => x.id);
// La marca d'ordre de bytes, escrita amb el seu codi: un BOM literal no es veu i l'ESLint el rebutja fora de les cadenes.
const BOM = String.fromCharCode(0xfeff);
/* Una prova WebAuthn sintètica i ben formada (base64url canònic): la Wiki l'exigix en nivell signatura. */
const PROVA_WEBAUTHN = Object.freeze({ tipus: 'webauthn', credencial: 'AAAA', authenticatorData: 'AAAA', clientDataJSON: 'AAAA', signatura: 'AAAA' });
const NONCE = 'AAAAAAAAAAAAAAAAAAAAAA';
/** Un registre sdp.aprovacio.v1 de signatura, vàlid per a la Wiki, amb els camps que es vulguen canviar. */
const registreAprovacio = (empremta, data, canvis = {}) => ({ schema: 'sdp.aprovacio.v1', tractor: 'skill.core-anticipacio', versio: '0.1.0', empremta,
  decisio: 'aprovat', nivell: 'signatura', data, caduca: null, nonce: NONCE, prova: { ...PROVA_WEBAUTHN }, ...canvis });

/* ── 0. El codi que entra ─────────────────────────────────────────────────── */

test('el nucli del laboratori i este corredor passen l’ESLint del repositori sense cap missatge', async (t) => {
  if (salta(t)) return;
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  const missatges = [];
  for (const [text, rel] of [[fs.readFileSync(FONT, 'utf8'), 'tooling/gates/anticipacio.mjs'], [fs.readFileSync(fileURLToPath(import.meta.url), 'utf8'), 'tests/anticipacio-261003.test.mjs']]) {
    const [r] = await eslint.lintText(text, { filePath: path.join(REPO, rel) });
    missatges.push(...r.messages.map((m) => `${rel}:${m.line} ${m.ruleId} ${m.message}`));
  }
  assert.deepEqual(missatges, []);
});

test('el nucli només importa mòduls de Node: es pot copiar a qualsevol carpeta i turns.mjs el pot importar sense cicles', (t) => {
  if (salta(t)) return;
  const imports = [...fs.readFileSync(FONT, 'utf8').matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
  assert.deepEqual(imports.sort(), ['node:crypto', 'node:fs', 'node:path', 'node:url']);
  assert.equal(a.avui(ARA), DIA);
  assert.equal(a.sumaJornades(DIA, 2), '261005');
  assert.equal(a.sumaJornades('261231', 1), '270101');
  assert.equal(a.sumaJornades(DIA, -7), '260926');
});

/* ── 1. La repetició del 261003 ───────────────────────────────────────────── */

test('la repetició del 261003: quatre vius d’ahir sense «fins» i un ranci → B2 (i B1 pel ranci) en prompt.local', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: DOCS_261003, vius: VIUS_261003 });
  const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS });
  assert.equal(m.schema, 'sdp.miseries.v1');
  assert.equal(m.abast.mode, 'convocatoria');
  assert.deepEqual(ids(m.bloquejants), ['B1', 'B2']);
  const b2 = m.bloquejants.find((b) => b.id === 'B2');
  assert.deepEqual(b2.docs, [`${AHIR}_1650_pla_implementacio_massiva_claude.md`, `${AHIR}_1650_prompt_claude_massiu.md`, `${AHIR}_1700_auditoria_claude.md`, `${AHIR}_1700_informe_estudi_mercat.md`]);
  assert.match(b2.detall, /sense «· fins AAMMDD · motiu»/);
  assert.match(m.bloquejants[0].detall, /2015_prompt_fable_auditoria_extrema/, 'el ranci el veu la porta Olivera, i no es compta dues vegades');

  assert.equal(m.fase, 'observacio', 'sense aprovació de la Wiki, Fase 0');
  assert.equal(a.bloqueja(m), false, 'en Fase 0 no es denega res');
  assert.match(a.informe(m), /Fase 0, passa i es traça com a observació/);

  const porta = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: APROVAT });
  assert.equal(porta.fase, 'porta');
  assert.equal(a.bloqueja(porta), true);
  const text = a.informe(porta);
  assert.match(text, /DENEGAT/);
  assert.match(text, /B2 · Vius heretats sense caducitat vigent/);
  assert.match(text, /fins 261005/, 'el remei diu el límit de renovació');
});

test('amb els d’ahir arxivats, la mateixa convocatòria no té cap bloquejant', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: APROVAT });
  assert.deepEqual(m.bloquejants, []);
  assert.equal(a.bloqueja(m), false);
  assert.match(a.informe(m), /cap bloquejant/);
});

test('un viu d’ahir protegit per «fins» vigent i amb motiu no és B2; caducat, massa llunyà o sense motiu, sí', (t) => {
  if (salta(t)) return;
  const nom = `${AHIR}_1700_auditoria_claude`;
  const prova = (linia) => {
    const arrel = mas(t, { docs: { [`${nom}.md`]: '# A\n', [PLA_BO]: PLA }, vius: [linia] });
    return a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS });
  };
  assert.deepEqual(ids(prova(`- [[${nom}]] · fins 261004 · Codex encara l'ha de llegir`).bloquejants), []);
  assert.deepEqual(ids(prova(`- [[${nom}]] · fins 261005 · rèplica de Claude pendent`).bloquejants), []);
  assert.match(prova(`- [[${nom}]] · fins 261002 · ja passat`).bloquejants[0].detall, /«fins 261002» caducat/);
  assert.match(prova(`- [[${nom}]] · fins 261231 · per si de cas`).bloquejants[0].detall, /passa del límit de 2 jornades \(261005\)/);
  assert.match(prova(`- [[${nom}]] · fins 261004`).bloquejants[0].detall, /sense motiu/);
  assert.equal(a.vigencia({ fins: '261003', motiu: 'avui encara' }, DIA), null, 'el mateix dia encara és vigent');
});

test('declaracions: capçalera ## o ###, àlies d’Obsidian, i el bloc acaba en la capçalera següent', (t) => {
  if (salta(t)) return;
  const d = a.declaracions([
    '## Activitat tancada', '- [[no_compta]]',
    '### Activitat en curs (tarda)', '- [[x_1]] · fins 261004 · motiu u', '| [[x_2\\|àlies]] | taula |', '- [[02_investigacio_ia/lab]]',
    '## Recursos', '- [[tampoc]]',
  ].join('\n'));
  assert.deepEqual(d, [{ nom: 'x_1', fins: '261004', motiu: 'motiu u' }, { nom: 'x_2', fins: null, motiu: '' }]);
});

/* ── 2. Els altres bloquejants ────────────────────────────────────────────── */

test('B3: solts d’ahir fora de ranci amb recursos ancorats (categoria no de torn, .html, sense segell), però no el ranci que ja és B1', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, {
    docs: {
      [`${AHIR}_1650_planificacio_claude_massiva.md`]: '# P\n',
      [`${AHIR}_0310_visio_arquitectonica_expansio.md`]: '# V\n',
      [`${AHIR}_1200_esborrany_maqueta.html`]: '<p>maqueta</p>\n',
      'notes_soltes.txt': 'notes\n',
      [PLA_BO]: PLA,
    },
  });
  posa(arrel, `${DESK}/.DS_Store`, 'brossa del Finder');
  const taula = olivera.checkTaula(arrel, { dia: DIA });
  assert.equal(taula.valid, true, taula.errors.join(' · '));
  const index = fs.readFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), 'utf8');
  assert.ok(index.includes(`- [[${AHIR}_1200_esborrany_maqueta.html]]`));
  assert.ok(index.includes('- [[notes_soltes.txt]]'));
  const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS });
  assert.deepEqual(ids(m.bloquejants), ['B3'], 'àncores presents: B3 encara exigeix decidir la vida o el destí dels solts');
  assert.deepEqual(m.bloquejants[0].docs, [`${AHIR}_0310_visio_arquitectonica_expansio.md`, `${AHIR}_1200_esborrany_maqueta.html`, `${AHIR}_1650_planificacio_claude_massiva.md`, 'notes_soltes.txt']);
  assert.match(m.bloquejants[0].detall, /categoria «planificacio»/);
  assert.match(m.bloquejants[0].detall, /extensió \.html/);
  assert.match(m.bloquejants[0].detall, /nom sense segell/);
  // AGENTS §0.1 i §12: 01_produccio/ i 02_investigacio_ia/ són del Mestre. El remei pregunta; no mana moure res.
  assert.match(m.bloquejants[0].remei, /^Pregunta al Mestre on va cadascun: 01_produccio\/ i 02_investigacio_ia\/ són decisió seua/);

  const declarat = mas(t, { docs: { [`${AHIR}_1650_planificacio_claude_massiva.md`]: '# P\n', [PLA_BO]: PLA }, vius: [`- [[${AHIR}_1650_planificacio_claude_massiva]] · fins 261004 · pendent de lectura`] });
  assert.deepEqual(a.miseries(declarat, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS }).bloquejants, []);
});

/* L'arnés ancóra els recursos per defecte; una absència real continua sent B1,
   i no substituïx la decisió de B3 sobre els solts d'ahir. */
for (const recurs of [`${AHIR}_1200_esborrany_maqueta.html`, 'notes_soltes.txt']) {
  test(`B1+B3: un recurs sense àncora (${recurs}) continua roig sense perdre B3`, (t) => {
    if (salta(t)) return;
    const docs = { [`${AHIR}_1200_esborrany_maqueta.html`]: '<p>maqueta</p>\n', 'notes_soltes.txt': 'notes\n', [PLA_BO]: PLA };
    const arrel = mas(t, { docs });
    const index = path.join(arrel, DESK, '00_index_escriptori.md');
    const abans = fs.readFileSync(index, 'utf8');
    const ancora = `- [[${recurs}]]`;
    assert.equal(abans.split(ancora).length, 2);
    fs.writeFileSync(index, abans.replace(ancora, ''));
    const taula = olivera.checkTaula(arrel, { dia: DIA });
    assert.equal(taula.valid, false);
    assert.ok(taula.errors.some((error) => error.includes(recurs)), taula.errors.join(' · '));
    const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS });
    assert.deepEqual(ids(m.bloquejants), ['B1', 'B3']);
    assert.deepEqual(m.bloquejants.find((b) => b.id === 'B3').docs, [`${AHIR}_1200_esborrany_maqueta.html`, 'notes_soltes.txt']);
  });
}

test('B4: pla absent, d’una altra hora, buit, sense vincular, amb sufix d’actor o invàlid; el bo passa i el pla mateix no es demana', (t) => {
  if (salta(t)) return;
  const prova = (docs, { pla = PLA_BO, ruta = 'prompt.local', deps = DEPS } = {}) => {
    const m = a.miseries(mas(t, { docs }), { ara: ARA, ruta, fitxer: PROMPT, torn: torn(pla), deps });
    return m.bloquejants.filter((b) => b.id === 'B4').map((b) => b.detall).join(' · ');
  };
  assert.match(prova({}), /Cap pla 261003_1250_pla_implementacio_…/);
  assert.match(prova({ [`${DIA}_1100_pla_implementacio_onada_3.md`]: PLA }, { pla: `${DIA}_1100_pla_implementacio_onada_3.md` }), /n'hi ha d'una altra hora: 261003_1100_pla_implementacio_onada_3\.md/);
  assert.match(prova({ [PLA_BO]: PLA_BUIT }), /té seccions «\[pendent\]»/);
  assert.match(prova({ [PLA_BO]: PLA }, { pla: null }), /no està vinculat al torn/);
  assert.match(prova({ [`${DIA}_1250_pla_implementacio_maria.md`]: PLA }, { pla: `${DIA}_1250_pla_implementacio_maria.md` }), /sufix d'un actor/);
  const valida = (root, text) => (text.includes('status: actiu') ? [] : ['status: esborrany no es pot convocar']);
  assert.match(prova({ [PLA_BO]: PLA }, { deps: { ...DEPS, validateDocument: valida } }), /validateDocument: status: esborrany/);
  assert.equal(prova({ [PLA_BO]: PLA }), '', 'el pla de la mateixa hora, ple, vinculat i amb el cognom bo passa');
  assert.equal(prova({}, { ruta: 'pla.implementacio' }), '', 'el pla no es demana a si mateix');
  assert.equal(a.cognomDe('261003_1250_prompt_claude_onada_3.md'), 'onada_3');

  // Lliçó 260922: el pla porta el cognom de la petorreta, encara que tinga la mateixa hora.
  const altre = `${DIA}_1250_pla_implementacio_fortificacio.md`;
  assert.match(prova({ [altre]: PLA }, { pla: altre }), /el cognom és «fortificacio» i el de la petorreta, «onada_3» \(lliçó 260922\)/);
  // Una frase que esmenta «[pendent]» no és un esquelet; una línia o una cel·la que només ho diu, sí.
  const enProsa = PLA.replace('Canvis comprovats amb evidència.', 'El pla de les 10:48 tenia 5 «[pendent]» i ara està complet.');
  assert.equal(prova({ [PLA_BO]: enProsa }), '', 'cap fals positiu per una menció en prosa');
  assert.match(prova({ [PLA_BO]: `${PLA}\n| Model IA | [pendent] |\n` }), /té seccions «\[pendent\]»/);
  // Amb validateDocument injectat, mana ell (el mateix criteri que plaDeHui estricte), no l'expressió.
  assert.equal(prova({ [PLA_BO]: PLA_BUIT }, { deps: { ...DEPS, validateDocument: () => [] } }), '');
  assert.match(prova({ [PLA_BO]: enProsa }, { deps: { ...DEPS, validateDocument: () => ['Secció absent o pendent: Verificació'] } }), /validateDocument: Secció absent o pendent: Verificació/);
});

test('B5: una mutació de governança a mitges bloqueja la convocatòria', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  posa(arrel, '.agents/runtime/mutation.pending.json', '{}\n');
  assert.deepEqual(ids(a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS }).bloquejants), ['B5']);
});

test('B6: sense Escriptori, sense porta Olivera o amb una porta que peta, falla tancat', (t) => {
  if (salta(t)) return;
  const buit = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-anticipacio-buit-')));
  t.after(() => fs.rmSync(buit, { recursive: true, force: true }));
  const sense = a.miseries(buit, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, deps: APROVAT });
  assert.deepEqual(ids(sense.bloquejants), ['B6']);
  assert.match(sense.bloquejants[0].detall, /Escriptori absent/);
  assert.equal(a.bloqueja(sense), true);

  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  const senseOlivera = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: {} });
  assert.deepEqual(ids(senseOlivera.bloquejants), ['B6']);
  assert.match(senseOlivera.bloquejants[0].detall, /^B1: porta Olivera no carregada/);
  const peta = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: { ...DEPS, checkTaula: () => { throw new Error('disc il·legible'); } } });
  assert.match(peta.bloquejants[0].detall, /B1: disc il·legible/);
});

/* ── 3. Auditories i actes ────────────────────────────────────────────────── */

test('auditoria i acta mai bloquegen, ni amb la taula del 261003 ni en Fase 1, i el resultat porta igualment el preflight', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: DOCS_261003, vius: VIUS_261003 });
  for (const [ruta, fitxer] of [['auditoria', `${DESK}/${DIA}_1330_auditoria_claude.md`], ['acta', `${DESK}/${DIA}_1400_acta_marmota.md`], ['auditoria', `${DESK}/${DIA}_1330_prompt_disfressat.md`]]) {
    const m = a.miseries(arrel, { ara: ARA, ruta, fitxer, torn: torn(), deps: APROVAT });
    assert.equal(m.abast.mode, 'lliurament', ruta);
    assert.deepEqual(m.bloquejants, [], ruta);
    assert.equal(a.bloqueja(m), false, ruta);
    assert.match(a.informe(m), /Mai es bloqueja/);
    assert.deepEqual(Object.keys(a.rebutDe(m)).sort(), ['at', 'avisos', 'bloquejants', 'digest', 'fase']);
  }
  assert.equal(a.esConvocatoria('prompt.local'), true);
  assert.equal(a.esConvocatoria('prompt.consell'), true);
  assert.equal(a.esConvocatoria('pla.implementacio'), true);
  assert.equal(a.esConvocatoria('planificacio'), false);
  assert.equal(a.esConvocatoria('auditoria', `${DESK}/${DIA}_1330_prompt_x.md`), false, 'amb ruta, mana la ruta');
  assert.equal(a.esConvocatoria(null, `${DESK}/${DIA}_1250_prompt_claude_x.md`), true);
  assert.equal(a.esConvocatoria(null, `${DESK}/${DIA}_1250_pla_implementacio_x.md`), true);
  assert.equal(a.esConvocatoria(null, `${DESK}/${DIA}_1330_auditoria_claude.md`), false);
});

test('sense ruta ni fitxer és una simulació: calcula els bloquejants (sense B4) i diu què passaria en convocar', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: DOCS_261003, vius: VIUS_261003 });
  const m = a.miseries(arrel, { ara: ARA, deps: DEPS });
  assert.equal(m.abast.mode, 'simulacio');
  assert.deepEqual(ids(m.bloquejants), ['B1', 'B2']);
  assert.equal(a.bloqueja({ ...m, fase: 'porta' }), false, 'una simulació no denega res');
  assert.match(a.informe(m), /si convocares ara/);
});

/* ── 4. La secció 0 ───────────────────────────────────────────────────────── */

/** Una convocatòria amb dos avisos: sense Acta Marmota d'ahir (A2) i una recaiguda recent (A6). En Fase 1 per defecte. */
function ambAvisos(t, deps = APROVAT) {
  const arrel = mas(t, { docs: { [PLA_BO]: PLA }, actes: [], ledger: `# LEDGER\n${AHIR} | recaiguda | core-higiene-escriptori | prova sintètica\n` });
  return a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps });
}
const document = (s0) => `---\ntype: prompt\nreflex: sdp:${TORN}:${REBUT}\n---\n# Prompt\n\n<!-- SDP:SECTION prompt.local.s0 -->\n## 0. Preflight (Per a l'agent orquestrador)\n\n${s0}\n\n<!-- SDP:SECTION prompt.local.s1 -->\n## Registre\n\n| Camp | Valor |\n| --- | --- |\n`;
const decidix = (s0, decisions) => s0.replace(/^- \[ \] (A\d) (.*→ decisió: )$/gm, (tot, id, resta) => (id in decisions ? `- [x] ${id} ${resta}${decisions[id]}` : tot));

test('seccioZero: la marca porta el digest i una casella per avís; verificaSeccioZero només la dona per bona marcada i decidida', (t) => {
  if (salta(t)) return;
  const m = ambAvisos(t);
  assert.deepEqual(ids(m.avisos), ['A2', 'A6']);
  const rebut = a.rebutDe(m);
  const s0 = a.seccioZero(m);
  assert.match(s0, new RegExp(`^<!-- SDP:PREFLIGHT digest=${m.digest} fase=porta bloquejants= avisos=A2,A6 -->$`, 'm'));
  assert.equal((s0.match(/^- \[ \] A\d · .* → decisió: $/gm) || []).length, 2);

  // En Fase 0 la marca hi és, però els avisos no porten casella: la regla vella de la porta no bloqueja res.
  const zero = a.seccioZero(ambAvisos(t, DEPS));
  assert.match(zero, /fase=observacio bloquejants= avisos=A2,A6 -->/);
  assert.equal((zero.match(/\[[ xX]\]/g) || []).length, 0);
  assert.equal((zero.match(/^- A\d · .* → decisió: $/gm) || []).length, 2);

  // Substituïx la secció 0 de prompt_local.md: en les dos fases en conserva la clàusula DOGMA del receptor.
  for (const s of [s0, zero]) {
    assert.match(s, /^\*\*OBLIGACIÓ PER A L'AGENT LOCAL \(Claude\/Codex\):\*\* la plantilla prompt_local\.md és DOGMA\..*\*\*REBUTJA L'ORDRE\*\*/m);
    assert.match(s, /Substituïx les tres caselles de la plantilla/);
  }
  assert.match(s0, /^Fase 1 \(porta\): rebutja'l també si el digest no és el del rebut/m);
  assert.match(zero, /^Fase 0 \(observació\): .*digues-ho al Mestre/m);

  const tal = a.verificaSeccioZero(document(s0), rebut);
  assert.equal(tal.valid, false, 'tal com naix, les caselles estan per marcar');
  assert.match(tal.errors.join('\n'), /A2: casella sense marcar/);

  const bona = decidix(s0, { A2: "la fa el Mestre en tancar la jornada", A6: 'aplique la lliçó 261002: arxivar amb l’eina' });
  assert.deepEqual(a.verificaSeccioZero(document(bona), rebut), { valid: true, errors: [], marca: { digest: m.digest, fase: 'porta', bloquejants: [], avisos: ['A2', 'A6'] } });

  const senseDecisio = decidix(s0, { A2: 'la fa el Mestre', A6: '' });
  assert.match(a.verificaSeccioZero(document(senseDecisio), rebut).errors.join('\n'), /A6: casella marcada sense decisió/);

  const falsificat = bona.replace(m.digest, 'f'.repeat(64));
  assert.equal(a.verificaSeccioZero(document(falsificat)).valid, true, 'sense rebut només es veu la coherència interna');
  assert.match(a.verificaSeccioZero(document(falsificat), rebut).errors.join('\n'), /no és el del rebut/);

  const retallat = bona.replace('avisos=A2,A6', 'avisos=A2').replace(/^- \[x\] A6 .*$/m, '');
  assert.match(a.verificaSeccioZero(document(retallat), rebut).errors.join('\n'), /Els avisos de la marca \(A2\) no són els del rebut \(A2,A6\)/);

  const senseCaselles = s0.replace(/^- \[ \] .*$/gm, '');
  assert.deepEqual(a.verificaSeccioZero(document(senseCaselles), rebut).errors, ["A2: falta la casella de l'avís.", "A6: falta la casella de l'avís."]);

  const aMa = "**Atenció Orquestradora:** El Pla d'Implementació s'ha generat a l'escriptori i el prompt està validat.";
  assert.match(a.verificaSeccioZero(document(aMa), rebut).errors[0], /no porta la marca SDP:PREFLIGHT/, 'el cas del 261003: secció 0 reescrita sense caselles');
  assert.match(a.verificaSeccioZero('# Prompt sense secció 0\n', rebut).errors[0], /no porta la secció «0\. Preflight»/);
  const plantilla = `${bona}\n- [ ] **Escriptori net i indexat**`;
  assert.match(a.verificaSeccioZero(document(plantilla), rebut).errors.join('\n'), /caselles sense marcar \(\*\*Escriptori\)/);
});

test('seccioZero sense avisos: res a decidir, i la secció continua tenint text visible per a validateSections', (t) => {
  if (salta(t)) return;
  const m = a.miseries(mas(t, { docs: { [PLA_BO]: PLA } }), { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS });
  assert.deepEqual(m.avisos, []);
  const s0 = a.seccioZero(m);
  assert.match(s0, /Cap avís: res a decidir\./);
  assert.ok(s0.replace(/<!--[\s\S]*?-->/g, '').trim().length > 0);
  assert.equal(a.verificaSeccioZero(document(s0), a.rebutDe(m)).valid, true);
});

test('preflightDelRebut llig el preflight del rebut que nomena el reflex, i torna null si no hi és', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, {});
  const preflight = { digest: 'a'.repeat(64), fase: 'observacio', bloquejants: [], avisos: ['A2'] };
  posa(arrel, `.agents/runtime/turns/${TORN}.json`, `${JSON.stringify({ turn_id: TORN, receipts: { [REBUT]: { id: REBUT, preflight } } }, null, 2)}\n`);
  assert.deepEqual(a.preflightDelRebut(arrel, document('x')), preflight);
  assert.equal(a.preflightDelRebut(arrel, document('x').replace(REBUT, '99999999-2222-4333-8444-555555555555')), null);
  assert.equal(a.preflightDelRebut(arrel, '# sense frontmatter\n'), null);
});

/* ── 5. Excepció del Mestre i determinisme ────────────────────────────────── */

test('l’excepció del Mestre: caducada, futura, massa llarga o d’un altre autor no té cap efecte; vigent deixa passar i es pot acotar', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: DOCS_261003, vius: VIUS_261003 });
  const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: APROVAT });
  const hores = (h) => new Date(ARA.getTime() + h * 3600000).toISOString();
  const excepcio = (e) => {
    posa(arrel, '.agents/runtime/anticipacio.excepcio.json', typeof e === 'string' ? e : JSON.stringify(e));
    return a.excepcioVigent(arrel, { ara: ARA });
  };
  assert.deepEqual(a.excepcioVigent(arrel, { ara: ARA }), { vigent: false, estat: 'absent' });
  const caducada = excepcio({ autor: 'Mestre', motiu: 'urgència sintètica', des: hores(-5), fins: hores(-1) });
  assert.equal(caducada.estat, 'caducada');
  assert.equal(a.bloqueja(m, { excepcio: caducada }), true, 'una excepció caducada no té efecte');
  assert.equal(excepcio({ autor: 'Mestre', motiu: 'urgència sintètica', des: hores(1), fins: hores(2) }).estat, 'futura');
  assert.equal(excepcio({ autor: 'Mestre', motiu: 'urgència sintètica', des: hores(-1), fins: hores(4) }).estat, 'invàlida', 'més de 4 h');
  assert.equal(excepcio({ autor: 'MarIA', motiu: 'urgència sintètica', des: hores(-1), fins: hores(1) }).estat, 'invàlida');
  assert.equal(excepcio('{ trencat').estat, 'il·legible');

  const vigent = excepcio({ autor: 'Mestre', motiu: 'urgència sintètica', des: hores(-1), fins: hores(1) });
  assert.equal(vigent.vigent, true);
  assert.equal(a.bloqueja(m, { excepcio: vigent }), false);
  assert.match(a.informe(m, { excepcio: vigent }), /passa per l'excepció del Mestre/);
  assert.equal(a.entradaDeTraca('deliverContext', m, { excepcio: vigent }).decisio, 'excepcio');
  const acotada = excepcio({ autor: 'Mestre', motiu: 'només el pla', des: hores(-1), fins: hores(1), abast: ['B4'] });
  assert.equal(a.bloqueja(m, { excepcio: acotada }), true, 'una excepció per a B4 no cobrix B2');
});

test('el digest és determinista: no depén de l’hora del dia, de l’arrel ni de l’ordre de creació, i canvia amb la taula', (t) => {
  if (salta(t)) return;
  const opcions = { ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS };
  const u = mas(t, { docs: DOCS_261003, vius: VIUS_261003 });
  const dos = mas(t, { docs: DOCS_261003, vius: VIUS_261003, ordre: 'invers' });
  const m1 = a.miseries(u, { ...opcions, ara: ARA });
  const m2 = a.miseries(u, { ...opcions, ara: new Date(ARA.getTime() + 2 * 3600000) });
  const m3 = a.miseries(dos, { ...opcions, ara: ARA });
  assert.notEqual(m1.at, m2.at);
  assert.equal(m1.digest, m2.digest);
  assert.equal(m1.digest, m3.digest);
  assert.match(m1.digest, /^[0-9a-f]{64}$/);
  fs.unlinkSync(path.join(u, DESK, `${AHIR}_1700_informe_estudi_mercat.md`));
  assert.notEqual(a.miseries(u, { ...opcions, ara: ARA }).digest, m1.digest);
  assert.notEqual(a.miseries(dos, { ...opcions, ara: ARA, fitxer: `${DESK}/${DIA}_1300_prompt_codex_onada_3.md` }).digest, m1.digest, 'el digest lliga la secció 0 a una petorreta');

  // readdirSync no garantix l'ordre a tmpfs ni a ext4: la mateixa taula, llistada al revés, dona el mateix digest.
  const taula = (ordre) => () => ({ valid: false, errors: ordre ? ['Sense àncora a l’índex: 261002_1000_c.md, 261002_0900_b.md, 261002_0800_a.md', 'Safata amb 1 element'] : ['Safata amb 1 element', 'Sense àncora a l’índex: 261002_0800_a.md, 261002_0900_b.md, 261002_1000_c.md'] });
  const ambTaula = (ordre) => a.miseries(u, { ...opcions, ara: ARA, deps: { ...DEPS, checkTaula: taula(ordre) } });
  assert.equal(ambTaula(true).digest, ambTaula(false).digest);
  assert.match(ambTaula(true).bloquejants[0].detall, /261002_0800_a\.md, 261002_0900_b\.md, 261002_1000_c\.md/);
});

/* ── 6. Avisos ────────────────────────────────────────────────────────────── */

test('A1: l’ESTAT es data amb AAMMDD_HHMM, AAAA-MM-DD o ISO, i és ranci si hi ha faena de jornades anteriors posterior', (t) => {
  if (salta(t)) return;
  assert.equal(a.segellEstat('## ESTAT_ACTUAL · 260923_1310 · Claude · x'), '260923_1310');
  assert.equal(a.segellEstat('## ESTAT_ACTUAL · 2026-10-02 · Claude · x'), '261002_2359');
  assert.equal(a.segellEstat('## ESTAT_ACTUAL · 2026-10-02T07:00:50.010Z · Codex · x'), a.segellLocal(new Date('2026-10-02T07:00:50.010Z')));
  assert.equal(a.segellEstat('## ESTAT_ACTUAL · sense data'), null);
  const docs = { [`${AHIR}_1700_auditoria_claude.md`]: '# A\n', [PLA_BO]: PLA };
  const vius = [`- [[${AHIR}_1700_auditoria_claude]] · fins 261004 · encara es llig`];
  const ranci = a.miseries(mas(t, { docs, vius, estat: '## ESTAT_ACTUAL · 2026-10-01 · x\n' }), { ara: ARA, deps: DEPS });
  // L'acta d'ahir també és faena posterior al relleu: dos documents, i l'últim és ella.
  assert.match(ranci.avisos.find((x) => x.id === 'A1').detall, /^L'últim relleu de l'ESTAT és de 261001_2359 i hi ha 2 document\(s\) .*\(l'últim, 261002_2300_acta_marmota\.md\)/);
  assert.ok(!ids(a.miseries(mas(t, { docs, vius }), { ara: ARA, deps: DEPS }).avisos).includes('A1'), 'relleu del mateix dia: no és ranci');
  assert.match(a.miseries(mas(t, { docs, vius, estat: '## ESTAT_ACTUAL · relleu\n' }), { ara: ARA, deps: DEPS }).avisos.find((x) => x.id === 'A1').detall, /no porta cap data llegible/);
});

test('A2: la jornada anterior amb activitat necessita una Acta Marmota, a 10_actes/ o a l’Escriptori', (t) => {
  if (salta(t)) return;
  const sense = a.miseries(mas(t, { docs: { [PLA_BO]: PLA }, actes: [] }), { ara: ARA, deps: DEPS });
  assert.match(sense.avisos.find((x) => x.id === 'A2').detall, /\(261002\)/);
  const incidencia = a.miseries(mas(t, { docs: { [PLA_BO]: PLA }, actes: [`${AHIR}_1920_acta_incidencia.md`] }), { ara: ARA, deps: DEPS });
  assert.ok(ids(incidencia.avisos).includes('A2'), 'una acta d’incidència no és una Acta Marmota');
  const majuscules = a.miseries(mas(t, { docs: { [PLA_BO]: PLA }, actes: [`${AHIR}_0845_ACTA_MARMOTA_Super_Tancament.md`] }), { ara: ARA, deps: DEPS });
  assert.ok(!ids(majuscules.avisos).includes('A2'));
});

test('A3: torns propis d’altres jornades sense tancar, amb els d’altres actors com a xifra; capçalera llegida sense parsejar l’inventari', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  const registre = (id, actor, state, creat, caduca) => posa(arrel, `.agents/runtime/turns/${id}.json`, `${JSON.stringify({
    schema: 'sdp.turn.v1', turn_id: id, actor, scope: 'documents', state, revision: 1,
    createdAt: creat.toISOString(), updatedAt: creat.toISOString(), expiresAt: caduca.toISOString(),
    initial: { 'src/x.js': 'a'.repeat(64) }, receipts: {}, plan: null, history: [{ state: 'closed', action: 'parany', at: creat.toISOString() }],
  }, null, 2)}\n`);
  const id = (n) => `torn_${String(n).repeat(8)}-bbbb-4ccc-8ddd-eeeeeeeeeeee`;
  registre(id(1), 'MarIA', 'context_loaded', new Date(2026, 9, 2, 12), new Date(2026, 9, 3, 18));
  registre(id(2), 'maria', 'planned', new Date(2026, 9, 1, 9), new Date(2026, 9, 2, 9));
  registre(id(3), 'MarIA', 'closed', new Date(2026, 9, 2, 10), new Date(2026, 9, 3, 10));
  registre(id(4), 'Codex', 'context_loaded', new Date(2026, 9, 2, 8), new Date(2026, 9, 3, 8));
  registre(id(5), 'MarIA', 'opened', new Date(2026, 9, 3, 9), new Date(2026, 9, 4, 9));
  const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: { ...torn(), turn_id: id(5) }, deps: DEPS });
  assert.match(m.avisos.find((x) => x.id === 'A3').detall, /^2 torn\(s\) de «MarIA» d'altres jornades sense tancar \(1 oberts, 1 caducats\); heretats d'altres actors: 1\. Primers: torn_11111111, torn_22222222\.$/);
  assert.equal(a.capcaleraTorn(fs.readFileSync(path.join(arrel, `.agents/runtime/turns/${id(1)}.json`), 'utf8')).state, 'context_loaded', 'la història niada no enganya');
  assert.equal(a.capcaleraTorn(JSON.stringify({ turn_id: 'x', actor: 'y', state: 'closed', createdAt: 'c', expiresAt: 'e' })).state, 'closed', 'sense sagnat, es parseja sencer');
  assert.ok(!ids(a.miseries(arrel, { ara: ARA, deps: DEPS }).avisos).includes('A3'), 'sense torn no hi ha «propis»');
});

test('A3 llig només els primers 4 KB de cada registre; el sencer, només si la capçalera no hi cap', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  const id = (n) => `torn_${String(n).repeat(8)}-bbbb-4ccc-8ddd-eeeeeeeeeeee`;
  // Un inventari d'unes desenes de KB, com els registres reals (de 81 a 357 KB).
  const inventari = Object.fromEntries(Array.from({ length: 800 }, (_, i) => [`src/fitxer_${i}.js`, 'a'.repeat(64)]));
  const camps = (n) => ({ schema: 'sdp.turn.v1', turn_id: id(n), actor: 'MarIA', scope: 'documents', state: 'context_loaded', revision: 1,
    createdAt: new Date(2026, 9, 1, 9).toISOString(), updatedAt: new Date(2026, 9, 1, 9).toISOString(), expiresAt: new Date(2026, 9, 2, 9).toISOString() });
  posa(arrel, `.agents/runtime/turns/${id(1)}.json`, `${JSON.stringify({ ...camps(1), initial: inventari, receipts: {} }, null, 2)}\n`);
  // L'inventari davant de la capçalera: la capçalera no cap als 4 KB i s'ha de llegir sencer.
  const { expiresAt, ...resta } = camps(2);
  posa(arrel, `.agents/runtime/turns/${id(2)}.json`, `${JSON.stringify({ ...resta, initial: inventari, expiresAt }, null, 2)}\n`);
  assert.ok(fs.statSync(path.join(arrel, `.agents/runtime/turns/${id(1)}.json`)).size > 10 * 4096);

  const sencers = [];
  const original = fs.readFileSync;
  fs.readFileSync = function espia(fitxer, ...opcions) {
    if (String(fitxer).includes(`${path.sep}turns${path.sep}`)) sencers.push(path.basename(String(fitxer)));
    return original.call(this, fitxer, ...opcions);
  };
  let m;
  try { m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: { ...torn(), turn_id: id(5) }, deps: DEPS }); }
  finally { fs.readFileSync = original; }
  assert.deepEqual(sencers, [`${id(2)}.json`], 'només el registre amb la capçalera darrere de l’inventari es llig sencer');
  assert.match(m.avisos.find((x) => x.id === 'A3').detall, /^2 torn\(s\) de «MarIA» d'altres jornades sense tancar \(0 oberts, 2 caducats\)/);
});

test('A4: laboratoris aplicats i no arxivats, mig aplicats o pendents de més de 3 jornades, comparant nous/ amb la ruta real', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  const lab = `${DESK}/02_investigacio_ia`;
  posa(arrel, 'tooling/gates/f.mjs', 'export const f = 1;\n');
  posa(arrel, 'tooling/gates/g.mjs', 'export const g = 1;\n');
  posa(arrel, '.agents/hooks.json', '{"vell":true}\n');
  posa(arrel, `${lab}/261002_1510_fatiga/nous/tooling/gates/f.mjs`, 'export const f = 1;\n');
  posa(arrel, `${lab}/261002_1510_fatiga/nous/.agents/hooks.json`, '{"nou":true}\n');
  posa(arrel, `${lab}/261002_1745_olivera/nous/tooling/gates/g.mjs.txt`, 'export const g = 1;\n');
  posa(arrel, `${lab}/260920_1000_vell/nous/tooling/h.mjs`, 'export const h = 1;\n');
  posa(arrel, `${lab}/261002_1800_recent/nous/tooling/k.mjs`, 'export const k = 1;\n');
  posa(arrel, `${lab}/260920_1100_sense_nous/LLEGIU_PRIMER.txt`, 'res\n');
  assert.deepEqual(a.laboratoris(arrel, { dia: DIA }), [
    { lab: '260920_1000_vell', estat: 'pendent des del 260920', iguals: 0, total: 1 },
    { lab: '261002_1510_fatiga', estat: 'mig aplicat', iguals: 1, total: 2 },
    { lab: '261002_1745_olivera', estat: 'aplicat i no arxivat', iguals: 1, total: 1 },
  ]);
  const a4 = a.miseries(arrel, { ara: ARA, deps: DEPS }).avisos.find((x) => x.id === 'A4');
  assert.match(a4.detall, /261002_1510_fatiga: mig aplicat \(1\/2/);
  // 02_investigacio_ia/ és zona protegida (AGENTS §0.1): el remei no mana arxivar res, ho porta al Mestre.
  assert.match(a4.remei, /^Digues-ho al Mestre: 02_investigacio_ia\/ és zona protegida/);
  assert.doesNotMatch(a4.remei, /arxiva el laboratori/);
});

test('A6: recaigudes dels últims 7 dies, i les Lliçons del Mestre de la skill de la ruta i de les recaigudes', (t) => {
  if (salta(t)) return;
  const ledger = `# LEDGER\n${AHIR} | recaiguda | core-higiene-escriptori | prova\n## 260929 | recaiguda | wiki-cicle-de-vida | prova\n260920 | recaiguda | antiga | fora de la finestra\n261002 | correcció | core-higiene-escriptori | no compta\n`;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA }, ledger });
  posa(arrel, '.agents/protocolledge.json', JSON.stringify({ rutes: [{ id: 'prompt.local', skill: '.agents/skills/wiki-documentacio-i-reflex/SKILL.md' }] }));
  posa(arrel, '.agents/skills/wiki-documentacio-i-reflex/SKILL.md', '# R\n\n## Lliçons del Mestre\n\n- **260922** | **Lliçó de la ruta**: text.\n\n## Vincles\n- [[00_INDEX_SKILLS]]\n');
  posa(arrel, '.agents/skills/core-higiene-escriptori/SKILL.md', '# H\n\n## Lliçons del Mestre\n\n- **261002 · Lliçó d’higiene.** Text.\n');
  assert.deepEqual(a.recaigudes(ledger, DIA), [{ dia: AHIR, skill: 'core-higiene-escriptori' }, { dia: '260929', skill: 'wiki-cicle-de-vida' }]);
  const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS });
  assert.match(m.avisos.find((x) => x.id === 'A6').detall, /^2 recaiguda\(es\) en 7 dies: core-higiene-escriptori \(261002\); wiki-cicle-de-vida \(260929\)/);
  assert.deepEqual(m.llicons, ['wiki-documentacio-i-reflex · 260922 | Lliçó de la ruta: text.', 'core-higiene-escriptori · 261002 · Lliçó d’higiene. Text.']);
});

/* ── 7. Fase, aprovació i empremta ────────────────────────────────────────── */

test('fase: sense fitxa, Fase 0; aprovada amb l’empremta bona, Fase 1; un canvi de font, revocada o caducada, Fase 0 i A7', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  assert.deepEqual(a.faseAprovacio(arrel, { ara: ARA }), { fase: 'observacio', estat: 'pendent', motiu: 'sense fitxa sdp.tractor.v1 (.agents/skills/core-anticipacio/tractor.json)', caduca: null });

  const manifest = { schema: 'sdp.tractor.v1', id: 'skill.core-anticipacio', nom: 'Anticipació', versio: '0.1.0', descripcio: 'Prova', fitxa: '.agents/skills/core-anticipacio/SKILL.md', fonts: ['tooling/gates/anticipacio.mjs'], llig: ['x'], escriu: ['y'], xarxa: 'cap', dadesPersonals: false, nivellMinim: 'signatura', caducitatDies: 90 };
  posa(arrel, '.agents/skills/core-anticipacio/tractor.json', JSON.stringify(manifest));
  posa(arrel, manifest.fitxa, '# Fitxa sintètica\r\n');
  posa(arrel, 'tooling/gates/anticipacio.mjs', `${BOM}export const versio = 1;\n`);
  const empremta = a.empremtaDe({ manifest, fitxa: '# Fitxa sintètica\n', fonts: new Map([['tooling/gates/anticipacio.mjs', 'export const versio = 1;\n']]) });
  const registre = (r) => JSON.stringify(registreAprovacio(empremta, new Date(ARA.getTime() - 86400000).toISOString(), r));
  posa(arrel, '.agents/aprovacions/registre_aprovacions_tractors_2026-10-02.jsonl', `${registre({})}\n`);
  const aprovada = a.faseAprovacio(arrel, { ara: ARA });
  assert.equal(aprovada.fase, 'porta', aprovada.motiu);
  assert.equal(a.miseries(arrel, { ara: ARA, deps: DEPS }).fase, 'porta');

  // Els criteris estructurals de la Wiki: un registre que la Wiki deixaria «pendent» no obri la Fase 1.
  for (const [canvi, motiu] of [
    [{ prova: undefined }, /El nivell signatura exigix una prova WebAuthn/],
    [{ prova: { ...PROVA_WEBAUTHN, tipus: 'u2f' } }, /prova\.tipus ha de ser «webauthn»/],
    [{ comentari: 'afegit a mà' }, /Camp desconegut: «comentari»/],
    [{ nonce: 'AAAA' }, /nonce ha de ser base64url de 16 bytes/],
    [{ caduca: new Date(ARA.getTime() - 2 * 86400000).toISOString() }, /caduca ha de ser posterior a data/],
    [{ data: '2026-10-02' }, /data ha de ser una data ISO en UTC/],
  ]) {
    posa(arrel, '.agents/aprovacions/registre_aprovacions_tractors_2026-10-02.jsonl', `${registre(canvi)}\n`);
    const f = a.faseAprovacio(arrel, { ara: ARA });
    assert.deepEqual([f.fase, f.estat], ['observacio', 'pendent'], JSON.stringify(canvi));
    assert.match(f.motiu, motiu);
  }
  posa(arrel, '.agents/aprovacions/registre_aprovacions_tractors_2026-10-02.jsonl', `${registre({})}\n{ trencat\n`);
  assert.match(a.faseAprovacio(arrel, { ara: ARA }).motiu, /1 línia\(es\) il·legibles/);
  posa(arrel, '.agents/skills/core-anticipacio/tractor.json', JSON.stringify({ ...manifest, extra: true }));
  assert.match(a.faseAprovacio(arrel, { ara: ARA }).motiu, /el manifest no és vàlid: Camp desconegut: «extra»/);
  posa(arrel, '.agents/skills/core-anticipacio/tractor.json', JSON.stringify(manifest));

  posa(arrel, '.agents/aprovacions/registre_aprovacions_tractors_2026-10-02.jsonl', `${registre({ nivell: 'confirmacio', prova: undefined })}\n`);
  const confirmacio = a.faseAprovacio(arrel, { ara: ARA });
  assert.equal(confirmacio.estat, 'pendent');
  assert.match(confirmacio.motiu, /cal el nivell «signatura»/, 'cal el nivell mínim del manifest');
  posa(arrel, '.agents/aprovacions/registre_aprovacions_tractors_2026-10-02.jsonl', `${registre({})}\n${registre({ decisio: 'revocat' })}\n`);
  assert.equal(a.faseAprovacio(arrel, { ara: ARA }).estat, 'revocat', 'una revocació empatada guanya');
  posa(arrel, '.agents/aprovacions/registre_aprovacions_tractors_2026-10-02.jsonl', `${registre({ caduca: new Date(ARA.getTime() - 3600000).toISOString() })}\n`);
  assert.equal(a.faseAprovacio(arrel, { ara: ARA }).estat, 'caducat');

  posa(arrel, '.agents/aprovacions/registre_aprovacions_tractors_2026-10-02.jsonl', `${registre({})}\n`);
  posa(arrel, 'tooling/gates/anticipacio.mjs', 'export const versio = 2;\n');
  const divergent = a.miseries(arrel, { ara: ARA, deps: DEPS });
  assert.equal(divergent.fase, 'observacio');
  assert.equal(divergent.aprovacio.estat, 'empremta-divergent');
  assert.match(divergent.avisos.find((x) => x.id === 'A7').detall, /aprovació empremta-divergent/);
  posa(arrel, '.agents/runtime/antigravity-hook.off', '');
  assert.match(a.miseries(arrel, { ara: ARA, deps: DEPS }).avisos.find((x) => x.id === 'A7').detall, /hook d'Antigravity apagat/);
});

test('l’empremta síncrona del nucli és la mateixa que calcula la Wiki, i la fitxa del laboratori és un manifest vàlid', async (t) => {
  if (salta(t)) return;
  const { calculaEmpremta } = await import(pathToFileURL(path.join(REPO, 'src/sections/tractors/nucli/empremta.js')).href);
  const { validaManifest } = await import(pathToFileURL(path.join(REPO, 'src/sections/tractors/nucli/registre.js')).href);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_LAB, 'utf8'));
  assert.deepEqual(validaManifest(manifest), []);
  assert.equal(manifest.id, a.TRACTOR);
  const fonts = manifest.fonts.map((ruta, i) => ({ ruta, contingut: `// font sintètica ${i}\r\nexport const n = ${i};\n` }));
  const fitxa = `${BOM}# Fitxa sintètica\r\n\nAmb accents: aprovació, misèries.\n`;
  const wiki = await calculaEmpremta({ manifest: { ...manifest, estat: 'derivat' }, fitxa, fonts });
  assert.equal(a.empremtaDe({ manifest: { ...manifest, estat: 'derivat' }, fitxa, fonts: new Map(fonts.map((f) => [f.ruta, f.contingut])) }), wiki);
});

test('aprovació: errorsManifest i errorsRegistre diuen el mateix que la Wiki, missatge a missatge, i l’estat és el d’avaluaEstat', async (t) => {
  if (salta(t)) return;
  const { validaManifest, validaRegistre, avaluaEstat } = await import(pathToFileURL(path.join(REPO, 'src/sections/tractors/nucli/registre.js')).href);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_LAB, 'utf8'));
  const manifests = [manifest, { ...manifest, estat: 'derivat' }, { ...manifest, extra: 1 }, { ...manifest, schema: 'x' }, { ...manifest, id: 'SenseAmbit' },
    { ...manifest, nom: ' ' }, { ...manifest, versio: '1.0' }, { ...manifest, descripcio: '' }, { ...manifest, fitxa: '../fora.md' }, { ...manifest, fitxa: '/abs.md' },
    { ...manifest, fonts: [] }, { ...manifest, fonts: ['a.mjs', 'a.mjs'] }, { ...manifest, fonts: ['a/./b.mjs'] }, { ...manifest, llig: [''] }, { ...manifest, escriu: 'x' },
    { ...manifest, xarxa: '' }, { ...manifest, dadesPersonals: 'no' }, { ...manifest, nivellMinim: 'res' }, { ...manifest, caducitatDies: 0 },
    { ...manifest, caducitatDies: 1.5 }, { ...manifest, caducitatDies: null }, { ...manifest, caducitatDies: undefined }, null, [], 'x'];
  for (const m of manifests) assert.deepEqual(a.errorsManifest(m), validaManifest(m), JSON.stringify(m)?.slice(0, 120));

  const e = `sha256:${'a'.repeat(64)}`;
  const data = '2026-10-02T11:30:00.000Z';
  const bo = registreAprovacio(e, data);
  const sense = (clau) => Object.fromEntries(Object.entries(bo).filter(([k]) => k !== clau));
  const registres = [bo, { ...bo, data: '2026-10-02T11:30:00Z' }, sense('prova'), { ...bo, prova: null }, { ...bo, prova: [] }, { ...bo, prova: { ...PROVA_WEBAUTHN, extra: 'x' } },
    { ...bo, prova: { ...PROVA_WEBAUTHN, tipus: 'u2f' } }, { ...bo, prova: { ...PROVA_WEBAUTHN, signatura: 'AAAA=' } }, { ...bo, prova: { ...PROVA_WEBAUTHN, credencial: '' } },
    { ...bo, prova: { ...PROVA_WEBAUTHN, clientDataJSON: 'A' } }, { ...bo, prova: { ...PROVA_WEBAUTHN, authenticatorData: 'AB' } },
    { ...sense('prova'), nivell: 'confirmacio' }, { ...bo, nivell: 'confirmacio' }, { ...bo, nivell: 'res' }, { ...bo, comentari: 'x' },
    { ...bo, nonce: 'AAAA' }, { ...bo, nonce: `${NONCE}==` }, { ...bo, nonce: 'AAAAAAAAAAAAAAAAAAAAAB' }, sense('nonce'),
    { ...bo, data: '2026-10-02' }, { ...bo, data: '2026-10-02T13:30:00+02:00' }, { ...bo, data: '2026-02-30T10:00:00Z' }, { ...bo, data: 1791027000000 },
    { ...bo, data: 1791027000000, caduca: '2026-10-01T00:00:00.000Z' },
    { ...bo, caduca: data }, { ...bo, caduca: '2026-10-01T00:00:00.000Z' }, { ...bo, caduca: '2026-11-01T00:00:00.000Z' }, sense('caduca'),
    { ...bo, versio: '1' }, { ...bo, tractor: 'X' }, { ...bo, empremta: 'sha256:abc' }, { ...bo, decisio: 'potser' }, { ...bo, decisio: 'revocat' },
    { ...bo, schema: 'sdp.aprovacio.v2' }, {}, null, [], 'x'];
  for (const r of registres) assert.deepEqual(a.errorsRegistre(r), validaRegistre(r), JSON.stringify(r)?.slice(0, 160));

  // L'estat sencer, des del disc (el nucli) i des de la memòria (la Wiki), per als mateixos registres.
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  posa(arrel, '.agents/skills/core-anticipacio/tractor.json', JSON.stringify(manifest));
  const fonts = new Map([[manifest.fitxa, '# Fitxa sintètica\n'], ...manifest.fonts.map((f) => [f, `// font sintètica de ${f}\n`])]);
  for (const [ruta, text] of fonts) posa(arrel, ruta, text);
  const empremta = a.empremtaDe({ manifest, fitxa: fonts.get(manifest.fitxa), fonts: new Map(manifest.fonts.map((f) => [f, fonts.get(f)])) });
  const ahir = new Date(ARA.getTime() - 86400000).toISOString();
  const r = (canvis) => registreAprovacio(empremta, ahir, canvis);
  const escenaris = [[], [r({})], [r({ prova: undefined })], [r({}), r({ decisio: 'revocat' })], [r({ caduca: new Date(ARA.getTime() - 3600000).toISOString() })],
    [r({ empremta: `sha256:${'b'.repeat(64)}` })], [r({ versio: '0.2.0' })], [r({ data: new Date(ARA.getTime() + 3600000).toISOString() })],
    [r({ nivell: 'confirmacio', prova: undefined })], [r({}), { ...r({}), tractor: 'skill.una-altra', nonce: 'x' }], [r({ comentari: 'x' })]];
  const estats = [];
  for (const llista of escenaris) {
    const linies = llista.map((x) => JSON.parse(JSON.stringify(x)));
    posa(arrel, '.agents/aprovacions/registre.jsonl', linies.map((x) => `${JSON.stringify(x)}\n`).join(''));
    const nucli = a.avaluaAprovacio(arrel, { ara: ARA }).estat;
    assert.equal(nucli, avaluaEstat({ manifest, empremta, registres: linies, ara: ARA }).estat, JSON.stringify(llista).slice(0, 160));
    estats.push(nucli);
  }
  assert.deepEqual(estats, ['pendent', 'aprovat', 'pendent', 'revocat', 'caducat', 'empremta-divergent', 'empremta-divergent', 'pendent', 'pendent', 'aprovat', 'pendent']);
});

/* ── 8. La skill i el plec ────────────────────────────────────────────────── */

/**
 * Els `triggers_on` de cada .agents/skills/NOM/SKILL.md, en minúscules. Admet les dos formes del
 * repositori: la llista en bloc (`  - text`, amb cometes o sense) i la llista en línia (`[a, "b"]`).
 */
function disparadorsInstallats() {
  const dir = path.join(REPO, '.agents/skills');
  const out = [];
  for (const nom of fs.readdirSync(dir).sort()) {
    const fitxer = path.join(dir, nom, 'SKILL.md');
    if (!fs.existsSync(fitxer)) continue;
    const cap = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(fitxer, 'utf8').replace(/\r\n/g, '\n'));
    if (!cap) continue;
    const enLinia = /^triggers_on:[ \t]*\[(.*)\][ \t]*$/m.exec(cap[1]);
    const enBloc = /^triggers_on:[ \t]*\n((?:[ \t]+-[^\n]*(?:\n|$))+)/m.exec(cap[1]);
    const crus = enLinia ? enLinia[1].split(',') : enBloc ? enBloc[1].split('\n').map((l) => l.replace(/^[ \t]+-[ \t]*/, '')) : [];
    out.push(...crus.map((x) => x.trim().replace(/^["']|["']$/g, '').toLowerCase()).filter(Boolean));
  }
  return out;
}

test('la skill core-anticipacio té el format de les skills reals i els seus disparadors no xoquen amb cap skill instal·lada', (t) => {
  if (salta(t)) return;
  const text = fs.readFileSync(path.join(LAB, 'nous/.agents/skills/core-anticipacio/SKILL.md.txt'), 'utf8');
  const [, cap, cos] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  assert.match(cap, /^type: skill$/m);
  assert.match(cap, /^name: core-anticipacio$/m);
  assert.match(cap, /^status: esborrany$/m, 'fora de .agents/skills/ fins a l’aprovació');
  assert.match(cap, /^version: 0\.1\.0$/m);
  const descripcio = /^description: "(.*)"$/m.exec(cap)[1];
  assert.ok(descripcio.length >= 12 && descripcio.length <= 220, `${descripcio.length} caràcters`);
  const disparadors = [...cap.matchAll(/^ {2}- (.+)$/gm)].map((m) => m[1].toLowerCase());
  assert.ok(disparadors.length >= 3 && disparadors.every((d) => d.split(' ').length >= 2 && d.split(' ').length <= 5 && !d.includes(',')), disparadors.join(' | '));
  assert.equal(fs.existsSync(path.join(REPO, '.agents/skills/core-anticipacio')), false, 'el nom és nou');
  // Dels SKILL.md, que són a git: .agents/skills_index.json és un derivat ignorat i un clon net no el porta.
  const instal = disparadorsInstallats();
  assert.ok(instal.length > 20, `disparadors instal·lats: ${instal.length}`);
  for (const d of disparadors) assert.deepEqual(instal.filter((x) => x.includes(d) || d.includes(x)), [], d);
  const seccions = [...cos.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(seccions, ["Quan s'activa", 'Entrades i eixides', 'Procediment: observa → resol → decidix → convoca → verifica', 'Límits', "Flux d'aprovació", 'Lliçons del Mestre', 'Vincles']);
  assert.match(cos, /## Lliçons del Mestre\n\n## Vincles\n- \[\[00_INDEX_SKILLS\]\]\n$/, 'Lliçons buides i Vincles al final');
});

test('el plec de core-higiene-escriptori s’aplica sencer i una sola vegada sobre la 3.2.0 del laboratori 1745', (t) => {
  if (salta(t)) return;
  const base = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/261002_1745_olivera_arxiva_claude/nous/.agents/skills/core-higiene-escriptori/SKILL.md.txt');
  if (!fs.existsSync(base)) return t.skip('laboratori 261002_1745_olivera_arxiva_claude absent: la base del plec ja no hi és');
  const plec = fs.readFileSync(path.join(LAB, 'core-higiene-escriptori.plec.txt'), 'utf8');
  let text = fs.readFileSync(base, 'utf8');
  const parelles = [...plec.matchAll(/>>>>> ANTES\n([\s\S]*?)\n<<<<< FI\n>>>>> DESPRÉS\n([\s\S]*?)\n<<<<< FI/g)];
  assert.equal(parelles.length, 3);
  for (const [, antes, despres] of parelles) {
    assert.equal(text.split(antes).length - 1, 1, antes.slice(0, 60));
    text = text.replace(antes, () => despres);
  }
  const [, llico] = />>>>> AFEGIR\n([\s\S]*?)\n<<<<< FI/.exec(plec);
  const ultima = /^- \*\*261002 · .*$/m.exec(text);
  assert.ok(ultima, 'la lliçó 261002 del lab 1745 és el punt d’inserció');
  text = `${text.slice(0, ultima.index + ultima[0].length)}\n${llico}${text.slice(ultima.index + ultima[0].length)}`;
  assert.equal(text.split('\n').length - 1, 62);
  assert.match(text, /^version: 3\.3\.0$/m);
  assert.equal((text.match(/fins AAMMDD · motiu/g) || []).length, 2);
  assert.match(text, /- \*\*261002 · [^\n]*\n- \*\*261003 · Cada viu porta data de caducitat i motiu\.\*\*/);
  assert.match(text, /\n## Vincles\n- \[\[00_INDEX_SKILLS\]\]\n$/);
  for (const camp of ['name: core-higiene-escriptori', 'tags: [govern]', '  - classificacio de documents de treball']) assert.ok(text.includes(camp), camp);
});

/* ── 9. Ordres de shell per als hooks ─────────────────────────────────────── */

test('saltaHooks: --no-verify, -n en commit, HUSKY i hooksPath; no un -am, un --no-edit ni el -n de push', (t) => {
  if (salta(t)) return;
  for (const ordre of ['git commit --no-verify -m "x"', 'git commit -nm "x"', 'HUSKY=0 git commit -m x', 'git -c core.hooksPath=/dev/null commit -m x',
    'git push --no-verify origin main', 'git add . && git commit --no-verify -m "Onada 2 completada"']) assert.equal(a.saltaHooks(ordre), true, ordre);
  for (const ordre of ['git commit -am "x"', 'git commit --amend --no-edit', 'git push -n origin', 'npm test', 'git status --short', null]) assert.equal(a.saltaHooks(ordre), false, String(ordre));
});

test('convocatoriaDeShell: només un document.mjs context|create escrit sol i amb ruta que convoca', (t) => {
  if (salta(t)) return;
  assert.deepEqual(a.convocatoriaDeShell(`node tooling/wiki/document.mjs context --turn-id ${TORN} --route prompt.local --file ${PROMPT}`), { ruta: 'prompt.local', fitxer: PROMPT, tornId: TORN });
  assert.deepEqual(a.convocatoriaDeShell(`node tooling/wiki/document.mjs create --route=pla.implementacio --file '${DESK}/${PLA_BO}' --turn-id x`), { ruta: 'pla.implementacio', fitxer: `${DESK}/${PLA_BO}`, tornId: null });
  assert.equal(a.convocatoriaDeShell(`node tooling/wiki/document.mjs create --route auditoria --file ${DESK}/${DIA}_1330_auditoria_claude.md`), null);
  assert.equal(a.convocatoriaDeShell(`node tooling/wiki/document.mjs plan --turn-id ${TORN} --file ${DESK}/${PLA_BO}`), null);
  assert.equal(a.convocatoriaDeShell(`cd x && node tooling/wiki/document.mjs context --route prompt.local --file ${PROMPT}`), null);
  assert.equal(a.convocatoriaDeShell(`node tooling/wiki/document.mjs context --route prompt.local --file ${PROMPT} && rm -rf x`), null);
});

/* ── 10. INTEGRACIO.txt, aplicada de veres a una còpia de tooling/ ────────── */

/**
 * Els canvis d'INTEGRACIO.txt: per a cada «ANTES (línia N | línies A-B | línies A i B)»,
 * el fitxer de la capçalera més pròxima, el bloc ANTES i el bloc DESPRÉS (que conserva
 * l'ANTES si l'etiqueta diu «les … línies iguals»); i cada «AFEGIR després de la línia N».
 */
function canvisIntegracio(text) {
  const l = text.split('\n');
  const out = [];
  let fitxer = null;
  const bloc = (des) => {
    let k = des;
    while (l[k].trim() !== '>>>>>') k += 1;
    const cos = [];
    let j = k + 1;
    while (l[j].trim() !== '<<<<<') cos.push(l[j++]);
    return { cos: cos.join('\n'), fi: j };
  };
  for (let i = 0; i < l.length; i++) {
    const cap = /^(?:\d+(?:\.\d+)?\.?|-)[ \t]+((?:tooling|tests|\.claude)\/[\w./-]+?)(?=[\s:,(]|$)/.exec(l[i]);
    if (cap) fitxer = cap[1];
    const antes = /ANTES \(líni(?:a|es) (\d+)(?:-(\d+)| i (\d+))?/.exec(l[i]);
    const afegir = /AFEGIR després de la línia (\d+)/.exec(l[i]);
    if (!antes && !afegir) continue;
    const a = bloc(i + 1);
    if (afegir) { out.push({ fitxer, linia: Number(afegir[1]), afegir: a.cos }); i = a.fi; continue; }
    let d = a.fi + 1;
    while (!/^\s*DESPRÉS/.test(l[d])) d += 1;
    const b = bloc(d + 1);
    out.push({ fitxer, des: Number(antes[1]), fins: antes[2] ? Number(antes[2]) : null, i: antes[3] ? Number(antes[3]) : null, antes: a.cos, despres: b.cos, conserva: /línies iguals/.test(l[d]) });
    i = b.fi;
  }
  return out;
}

/** El mateix contracte que el corredor del lab 1745: fonts de l'arrel que lligen hooks i proves. */
const FONTS_ARREL = ['.agents/protocolledge.json', '.agents/hooks.json', '.agents/BOOTSTRAP.md', '.claude/settings.json', '.codex/hooks.json',
  'AGENTS.md', '_wiki_de_poble/01_ser/02_genotip.md', '_wiki_de_poble/00_index.md'];
const SUITES = ['tests/porta-olivera-v3.test.mjs', 'tests/antigravity-hook.test.mjs', 'tests/documental.test.mjs', 'tests/document-command-policy.test.mjs',
  'tests/document-create-race.test.mjs', 'tests/sistema_nervios.test.mjs'];

function arbre(t, canvis = []) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-anticipacio-arbre-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store)$/.test(src);
  for (const d of ['tooling', 'scripts/immunitari', 'tests/helpers']) {
    if (fs.existsSync(path.join(REPO, d))) fs.cpSync(path.join(REPO, d), path.join(dir, d), { recursive: true, filter: fora });
  }
  const router = JSON.parse(fs.readFileSync(path.join(REPO, '.agents/protocolledge.json'), 'utf8'));
  for (const f of [...FONTS_ARREL, ...router.rutes.map((r) => r.plantilla), ...SUITES]) {
    if (fs.existsSync(path.join(REPO, f))) posa(dir, f, fs.readFileSync(path.join(REPO, f)));
  }
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  posa(dir, '.agents/AGENTS.md', '# BIOS de la còpia de proves\n');
  if (canvis.length) {
    // Els fitxers nous de la lease (INTEGRACIO §11): el nucli, la fitxa i la skill amb «status: actiu».
    posa(dir, 'tooling/gates/anticipacio.mjs', fs.readFileSync(FONT));
    posa(dir, '.agents/skills/core-anticipacio/tractor.json', fs.readFileSync(MANIFEST_LAB));
    posa(dir, '.agents/skills/core-anticipacio/SKILL.md', fs.readFileSync(path.join(LAB, 'nous/.agents/skills/core-anticipacio/SKILL.md.txt'), 'utf8')
      .replace(/^status: esborrany$/m, 'status: actiu'));
    const perFitxer = new Map();
    for (const c of canvis) perFitxer.set(c.fitxer, [...(perFitxer.get(c.fitxer) || []), c]);
    for (const [rel, llista] of perFitxer) {
      const original = fs.readFileSync(path.join(REPO, rel), 'utf8');
      const linies = original.split('\n');
      let text = original;
      const una = (de, a) => {
        assert.equal(text.split(de).length, 2, `${rel}: «${de.slice(0, 70)}» ha d'aparéixer una sola vegada`);
        text = text.replace(de, () => a);
      };
      for (const c of llista) {
        if (c.afegir !== undefined) { una(linies[c.linia - 1], `${linies[c.linia - 1]}\n${c.afegir}`); continue; }
        if (c.i) {
          const [a1, a2] = c.antes.split('\n');
          const [d1, d2] = c.despres.split('\n');
          una(a1, d1);
          una(a2, d2);
        } else una(c.antes, c.conserva ? `${c.antes}\n${c.despres}` : c.despres);
      }
      posa(dir, rel, text);
    }
  }
  return dir;
}

/** Noms de les proves que fallen, en TAP: la comparació amb l'arbre sense canvis diu què és nou. */
function suites(dir) {
  const env = { ...process.env };
  delete env.SDP_ARREL;
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...SUITES], { cwd: dir, env, encoding: 'utf8', timeout: 240000 });
  const noms = (patro) => [...new Set([...r.stdout.matchAll(patro)].map((m) => m[1].trim()).filter((n) => !/\.test\.mjs$/.test(n)))].sort(compara);
  return { fallen: noms(/^\s*not ok \d+ - (.+)$/gm), verdes: noms(/^\s*ok \d+ - (.+)$/gm), status: r.status };
}
const compara = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/**
 * Els fragments es van verificar contra el HEAD b22b168b9. Si algun original ha canviat des
 * d'aleshores (el lab 1745 s'aplica abans, D4), no és una fallada d'esta prova: és el senyal
 * de refer INTEGRACIO.txt (LLEGIU_PRIMER §5), i les dos proves ho diuen amb un skip.
 *
 * Git només veu els fitxers que seguix. Un fitxer fora de git (.claude/settings.json: .claude/ és
 * a .gitignore) es compara amb l'empremta que INTEGRACIO en guarda; si no hi és o ha canviat,
 * també és deriva. Que un fitxer fora de git no porte empremta és un defecte d'INTEGRACIO: roig.
 */
const TALL = 'b22b168b9';
const git = (...args) => spawnSync('git', args, { cwd: REPO, encoding: 'utf8' });
const sha256 = (dades) => createHash('sha256').update(dades).digest('hex');

/** `Empremta de verificació: RUTA sha256:HEX` (INTEGRACIO §8), per a cada fitxer que git no seguix. */
function empremtesFora(text) {
  return new Map([...text.matchAll(/^Empremta de verificació: (\S+) sha256:([0-9a-f]{64})$/gm)].map((m) => [m[1], m[2]]));
}

function deriva(canvis, empremtes) {
  if (git('rev-parse', '--verify', '--quiet', `${TALL}^{commit}`).status !== 0) {
    return { motiu: `no es pot comparar amb ${TALL}: el commit no és en este clon`, senseEmpremta: [] };
  }
  const fitxers = [...new Set(canvis.map((c) => c.fitxer))];
  const fora = fitxers.filter((f) => git('cat-file', '-e', `${TALL}:${f}`).status !== 0);
  const senseEmpremta = fora.filter((f) => !empremtes.has(f));
  const derivats = [];
  for (const f of fora.filter((x) => empremtes.has(x))) {
    const abs = path.join(REPO, f);
    if (!fs.existsSync(abs)) { derivats.push(`${f}: fora de git i absent`); continue; }
    const ara = sha256(fs.readFileSync(abs));
    if (ara !== empremtes.get(f)) derivats.push(`${f}: fora de git, empremta sha256:${ara} i INTEGRACIO en guarda sha256:${empremtes.get(f)}`);
  }
  const seguits = fitxers.filter((f) => !fora.includes(f));
  const d = git('diff', '--name-only', TALL, '--', ...seguits);
  if (d.status !== 0) return { motiu: `no es pot comparar amb ${TALL} (${(d.stderr || '').trim() || `git ix amb ${d.status}`})`, senseEmpremta };
  derivats.push(...d.stdout.trim().split('\n').filter(Boolean));
  return { motiu: derivats.length ? `deriva des de ${TALL} (${derivats.join('; ')}): cal refer INTEGRACIO.txt sobre el codi nou (LLEGIU_PRIMER §5)` : null, senseEmpremta };
}

test('INTEGRACIO.txt: cada bloc ANTES és literal al codi actual, a la línia que diu i una sola vegada', (t) => {
  if (salta(t)) return;
  const text = fs.readFileSync(path.join(LAB, 'INTEGRACIO.txt'), 'utf8');
  const canvis = canvisIntegracio(text);
  const { motiu, senseEmpremta } = deriva(canvis, empremtesFora(text));
  assert.deepEqual(senseEmpremta, [], 'cada fitxer fora de git porta la seua empremta a INTEGRACIO');
  if (motiu) return t.skip(motiu);
  assert.deepEqual(canvis.map((c) => `${c.fitxer}:${c.des ?? c.linia}`), [
    'tooling/documental/turns.mjs:6', 'tooling/documental/turns.mjs:71', 'tooling/documental/turns.mjs:77', 'tooling/documental/turns.mjs:86',
    'tooling/gates/obrir_torn.mjs:5', 'tooling/gates/obrir_torn.mjs:8',
    'tooling/wiki/document.mjs:10', 'tooling/wiki/document.mjs:17', 'tooling/wiki/document.mjs:34', 'tooling/wiki/document.mjs:40', 'tooling/wiki/document.mjs:52',
    'tooling/documental/import.mjs:7', 'tooling/documental/import.mjs:14',
    'tooling/gates/porta-olivera.mjs:50', 'tooling/gates/porta-olivera.mjs:118', 'tooling/gates/porta-olivera.mjs:177', 'tooling/gates/porta-olivera.mjs:189',
    'tooling/gates/porta-olivera.mjs:243', 'tooling/gates/porta-olivera.mjs:349',
    'tooling/gates/antigravity-hook.mjs:57', 'tooling/gates/antigravity-hook.mjs:75', 'tooling/gates/antigravity-hook.mjs:171', 'tooling/gates/antigravity-hook.mjs:78',
    'tooling/gates/antigravity-hook.mjs:138', 'tooling/gates/antigravity-hook.mjs:201', 'tooling/gates/antigravity-hook.mjs:213', 'tooling/gates/antigravity-hook.mjs:228',
    'tooling/gates/antigravity-hook.mjs:249', 'tooling/gates/antigravity-hook.mjs:190', 'tooling/gates/antigravity-hook.mjs:260',
    'tooling/brain/despertar.mjs:22', 'tooling/brain/despertar.mjs:80', 'tooling/brain/despertar.mjs:120', 'tooling/brain/despertar.mjs:131',
    'tooling/gates/mutation-policy.mjs:134', '.claude/settings.json:22', 'tests/porta-olivera-v3.test.mjs:86',
    'tooling/gates/tractor-arrel.mjs:219',
  ]);
  for (const c of canvis) {
    const original = fs.readFileSync(path.join(REPO, c.fitxer), 'utf8');
    const linies = original.split('\n');
    const on = `${c.fitxer}:${c.des ?? c.linia}`;
    if (c.afegir !== undefined) { assert.equal(original.split(linies[c.linia - 1]).length, 2, on); continue; }
    const a = c.antes.split('\n');
    if (c.i) {
      assert.deepEqual([linies[c.des - 1], linies[c.i - 1]], a, on);
      continue;
    }
    if (c.fins) assert.equal(c.fins - c.des + 1, a.length, `${on}: el rang no casa amb el bloc`);
    assert.equal(linies.slice(c.des - 1, c.des - 1 + a.length).join('\n'), c.antes, on);
    assert.equal(original.split(c.antes).length, 2, `${on}: el bloc apareix més d'una vegada`);
  }
});

test('INTEGRACIO.txt aplicada a una còpia: compila, deliverContext denega la repetició del 261003 en Fase 1, i les suites no tenen cap fallada nova', async (t) => {
  if (salta(t)) return;
  const text = fs.readFileSync(path.join(LAB, 'INTEGRACIO.txt'), 'utf8');
  const canvis = canvisIntegracio(text);
  const { motiu } = deriva(canvis, empremtesFora(text));
  if (motiu) return t.skip(motiu);
  const dir = arbre(t, canvis);
  // La mateixa còpia sense cap canvi: la referència de la Porta Arrel i de les suites.
  let abansDir = null;
  const abans = () => (abansDir ??= arbre(t));
  for (const rel of [...new Set(canvis.map((c) => c.fitxer))].filter((f) => f.endsWith('.mjs')).concat('tooling/gates/anticipacio.mjs')) {
    const r = spawnSync(process.execPath, ['--check', path.join(dir, rel)], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${rel}: ${r.stderr}`);
  }
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(dir, '.claude/settings.json'), 'utf8')));

  const importa = (rel) => import(pathToFileURL(path.join(dir, rel)).href);
  const torns = await importa('tooling/documental/turns.mjs');
  const doc = await importa('tooling/wiki/document.mjs');
  const portaOlivera = await importa('tooling/gates/porta-olivera.mjs');
  const politica = await importa('tooling/gates/mutation-policy.mjs');
  const ajuda = await importa('tests/helpers/documental.mjs');
  const nucli = await importa('tooling/gates/anticipacio.mjs');
  const despertar = await importa('tooling/brain/despertar.mjs');
  const dia = nucli.avui(new Date());
  const ahir = nucli.sumaJornades(dia, -1);

  await t.test('Fase 0: el torn i el rebut porten preflight, la secció 0 naix amb la marca i sense caselles, i la traça diu «observacio»', () => {
    const root = fs.realpathSync(ajuda.fixture(t));
    const turn = torns.openTurn(root, { actor: 'MarIA', scope: 'documents', anticipacio: doc.ANTICIPACIO });
    assert.match(turn.preflight.digest, /^[0-9a-f]{64}$/);
    const file = `${DESK}/${dia}_1250_prompt_claude_prova.md`;
    const creat = doc.createDraft(root, turn.turn_id, { route: 'prompt.local', file, title: 'Prova', description: 'Prompt de prova de la integració' });
    const rebut = Object.values(torns.readTurn(root, turn.turn_id).receipts).find((r) => r.file === file);
    assert.equal(creat.preflight.digest, rebut.preflight.digest);
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(text, new RegExp(`<!-- SDP:PREFLIGHT digest=${rebut.preflight.digest} fase=observacio `));
    assert.doesNotMatch(text, /\[ \]/, 'en Fase 0 cap casella buida: la porta vella no bloqueja res');
    assert.match(text, /## 0\. Preflight \(Per a l'agent orquestrador\)\n\n<!-- SDP:PREFLIGHT [\s\S]*\*\*REBUTJA L'ORDRE\*\*/, 'la clàusula DOGMA de la plantilla viatja a la secció 0');
    assert.match(fs.readFileSync(path.join(root, '.agents/runtime/anticipacio.log'), 'utf8'), /"punt":"deliverContext".*"decisio":"observacio"/);
    assert.equal(politica.knownRead({ tool_name: 'Bash', tool_input: { command: 'node tooling/gates/anticipacio.mjs --informe' } }, dir), true);
  });

  await t.test('Fase 1: la repetició del 261003 es denega sense escriure cap rebut; l’auditoria passa i l’excepció del Mestre també', () => {
    const root = fs.realpathSync(ajuda.fixture(t));
    const manifest = { schema: 'sdp.tractor.v1', id: 'skill.core-anticipacio', nom: 'Anticipació', versio: '0.1.0', descripcio: 'Prova', fitxa: '.agents/skills/core-anticipacio/SKILL.md', fonts: ['.agents/protocolledge.json'], llig: ['x'], escriu: ['y'], xarxa: 'cap', dadesPersonals: false, nivellMinim: 'signatura', caducitatDies: 90 };
    posa(root, '.agents/skills/core-anticipacio/tractor.json', JSON.stringify(manifest));
    posa(root, manifest.fitxa, '# Fitxa de prova\n');
    const empremta = nucli.empremtaDe({ manifest, fitxa: '# Fitxa de prova\n', fonts: new Map([['.agents/protocolledge.json', fs.readFileSync(path.join(root, '.agents/protocolledge.json'), 'utf8')]]) });
    const aprovacio = (canvis) => posa(root, '.agents/aprovacions/registre.jsonl', `${JSON.stringify(registreAprovacio(empremta, new Date(Date.now() - 3600000).toISOString(), canvis))}\n`);
    aprovacio({ prova: undefined });
    assert.equal(nucli.faseAprovacio(root).fase, 'observacio', 'un registre de signatura sense prova WebAuthn no obri la Fase 1');
    aprovacio({});
    assert.equal(nucli.faseAprovacio(root).fase, 'porta');
    const vell = `${ahir}_1650_prompt_claude_massiu`;
    posa(root, `${DESK}/${vell}.md`, '# Prompt d’ahir\n');
    fs.appendFileSync(path.join(root, `${DESK}/00_index_escriptori.md`), `\n## Activitat en curs\n\n- [[${vell}]]\n`);
    const turn = torns.openTurn(root, { actor: 'MarIA', scope: 'documents', anticipacio: doc.ANTICIPACIO });
    const prompt = `${DESK}/${dia}_1250_prompt_claude_prova.md`;
    assert.throws(() => torns.deliverContext(root, turn.turn_id, { route: 'prompt.local', file: prompt }, { anticipacio: doc.ANTICIPACIO }), /DENEGAT[\s\S]*B2 · Vius heretats/);
    assert.deepEqual(torns.readTurn(root, turn.turn_id).receipts, {}, 'cap rebut d’una convocatòria denegada');
    const auditoria = torns.deliverContext(root, turn.turn_id, { route: 'auditoria', file: `${DESK}/${dia}_1330_auditoria_claude.md` }, { anticipacio: doc.ANTICIPACIO });
    assert.deepEqual(auditoria.preflight.bloquejants, []);
    assert.equal(Object.values(torns.readTurn(root, turn.turn_id).receipts)[0].preflight.fase, 'porta');

    const sense = portaOlivera.checkOlivera(root, { contingut: document("**Atenció:** el prompt està validat."), fitxer: prompt });
    assert.match(sense.errors.join('\n'), /no porta la marca SDP:PREFLIGHT/);

    const hook = (mode, payload) => JSON.parse(spawnSync(process.execPath, [path.join(dir, 'tooling/gates/antigravity-hook.mjs'), mode], { input: JSON.stringify(payload), env: { ...process.env, SDP_ARREL: root }, encoding: 'utf8', timeout: 20000 }).stdout);
    const crea = hook('pre-tool', { toolCall: { name: 'run_command', args: { CommandLine: `node tooling/wiki/document.mjs create --turn-id ${turn.turn_id} --route prompt.local --file ${prompt} --title x --description y` } } });
    assert.equal(crea.decision, 'deny');
    assert.match(crea.reason, /B2 · Vius heretats/);
    assert.equal(hook('pre-tool', { toolCall: { name: 'run_command', args: { CommandLine: 'git commit --no-verify -m x' } } }).decision, 'force_ask');
    assert.match(hook('pre-invocation', { invocationNum: 1 }).injectSteps[0].ephemeralMessage, /Misèries abans d'actuar · Fase 1[\s\S]*B2/);

    const hores = (h) => new Date(Date.now() + h * 3600000).toISOString();
    posa(root, '.agents/runtime/anticipacio.excepcio.json', JSON.stringify({ autor: 'Mestre', motiu: 'prova de la integració', des: hores(-1), fins: hores(1) }));
    assert.match(torns.deliverContext(root, turn.turn_id, { route: 'prompt.local', file: prompt }, { anticipacio: doc.ANTICIPACIO }).reflex, /^sdp:torn_/);
    assert.match(fs.readFileSync(path.join(root, '.agents/runtime/anticipacio.log'), 'utf8'), /"decisio":"excepcio"/);
  });

  await t.test('despertar: llig l’ESTAT amb data ISO i el canal fresc porta «Misèries abans d’actuar»', () => {
    assert.equal(despertar.estatActual('## ESTAT_ACTUAL · 2026-10-02 · Claude · x\n- a\n').segell, '261002_2359');
    assert.equal(despertar.estatActual('## ESTAT_ACTUAL · 260923_1310 · Claude · x\n- a\n').segell, '260923_1310');
    posa(dir, '.agents/ESTAT.md', '# ESTAT\n\n## ESTAT_ACTUAL · 2026-10-02 · Claude · relleu de prova\n- a\n');
    posa(dir, `${DESK}/00_index_escriptori.md`, '---\ntype: index\n---\n# Índex\n');
    const r = spawnSync(process.execPath, [path.join(dir, 'tooling/brain/despertar.mjs')], { cwd: dir, encoding: 'utf8', timeout: 20000 });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /## 0\. Misèries abans d'actuar[\s\S]*\[Anticipació · misèries abans d'actuar\]/);
    assert.doesNotMatch(fs.readFileSync(path.join(dir, '.agents/ON_ESTIC.md'), 'utf8'), /Misèries/, 'el canal ranci no les porta');
  });

  await t.test('importació de prompt.local (§3.5): l’original sencer va a «Instrucció del torn» i la secció 0 és la de la màquina', async () => {
    const { importDocument } = await importa('tooling/documental/import.mjs');
    const root = fs.realpathSync(ajuda.fixture(t));
    const turn = torns.openTurn(root, { actor: 'MarIA', scope: 'documents', anticipacio: doc.ANTICIPACIO });
    // El lloc on importava el codi d'abans (la secció 0 «[pendent]») ja no existix en cap esborrany de prompt.local.
    const esborrany = doc.draft(torns.deliverContext(root, turn.turn_id, { route: 'prompt.local', file: `${DESK}/${dia}_1250_prompt_claude_esborrany.md` }, { anticipacio: doc.ANTICIPACIO }), { title: 'x', description: 'Esborrany de comprovació' });
    assert.ok(!esborrany.includes("## 0. Preflight (Per a l'agent orquestrador)\n\n[pendent]"), 'sense §3.5, el replace d’import.mjs:18 no trobaria res');
    const file = `${DESK}/${dia}_1300_prompt_claude_llegat.md`;
    posa(root, file, "---\ntype: prompt\nstatus: esborrany\ndescription: Prompt antic sintètic\n---\n# Llegat sintètic\n\nInstrucció original que s'ha de conservar sencera.\n\n## Detall\n\n- Primer punt sintètic.\n");
    importDocument(root, turn.turn_id, { file, route: 'prompt.local', title: 'Llegat', description: 'Importació sintètica de prova' });
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(text, /## Instrucció del torn\n\nImportació explícita de [^\n]+\n\n### Llegat sintètic\n\nInstrucció original que s'ha de conservar sencera\.\n\n### Detall\n\n- Primer punt sintètic\./);
    assert.match(text, /## 0\. Preflight \(Per a l'agent orquestrador\)\n\n<!-- SDP:PREFLIGHT digest=[0-9a-f]{64} fase=observacio /);
  });

  await t.test('el hook d’Antigravity passa el fitxer de la petorreta a la porta Olivera (§5.9): l’hora del pla de §4.3 també compta ací', async () => {
    const hook = await importa('tooling/gates/antigravity-hook.mjs');
    const root = fs.realpathSync(ajuda.fixture(t));
    const rel = `${DESK}/${dia}_1250_prompt_claude_prova.md`;
    const vistos = [];
    const portes = { esPetorreta: () => true, vigilat: () => false, operacio: () => ({ fitxer: rel, contingut: '# x\n' }),
      olivera: (contingut, fitxer) => { vistos.push(fitxer); return []; }, plantilla: () => [] };
    assert.deepEqual(hook.preTool({ toolCall: { name: 'write_to_file', args: { TargetFile: path.join(root, rel), CodeContent: '# x\n' } } }, { root, portes }), { decision: 'allow' });
    assert.deepEqual(vistos, [rel]);
  });

  await t.test('Porta Arrel (§12): cap infracció nova respecte de la còpia sense canvis; sense §12, A5 denunciaria l’excepció del Mestre', () => {
    const infraccions = (arrel) => {
      const env = { ...process.env };
      delete env.SDP_ARREL;
      const r = spawnSync(process.execPath, [path.join(arrel, 'tooling/gates/tractor-arrel.mjs'), '--json'], { cwd: arrel, env, encoding: 'utf8', timeout: 60000 });
      assert.ok([0, 1].includes(r.status), r.stderr);
      const informe = JSON.parse(r.stdout);
      assert.equal(informe.arrel, arrel, 'la porta jutja la còpia, no el repositori');
      return informe.infraccions.map((i) => `${i.llei} ${i.fitxer}: ${i.detall}`).sort(compara);
    };
    const referencia = infraccions(abans());
    assert.deepEqual(infraccions(dir).filter((x) => !referencia.includes(x)), []);
    const porta = path.join(dir, 'tooling/gates/tractor-arrel.mjs');
    const ambCanvi = fs.readFileSync(porta);
    fs.writeFileSync(porta, fs.readFileSync(path.join(REPO, 'tooling/gates/tractor-arrel.mjs')));
    try {
      const noves = infraccions(dir).filter((x) => !referencia.includes(x));
      assert.deepEqual(noves, [
        'A5 tooling/gates/anticipacio.mjs: cita .agents/runtime/anticipacio.excepcio.json, que no existix',
        'A5 tooling/gates/antigravity-hook.mjs: cita .agents/runtime/anticipacio.excepcio.json, que no existix',
      ]);
    } finally { fs.writeFileSync(porta, ambCanvi); }
  });

  await t.test('les suites dels fitxers tocats no tenen cap fallada nova respecte de la mateixa còpia sense canvis', () => {
    const despres = suites(dir);
    const referencia = suites(abans());
    assert.deepEqual(despres.fallen.filter((n) => !referencia.fallen.includes(n)), [], `fallades noves (abans: ${referencia.fallen.join(' | ') || 'cap'})`);
    assert.deepEqual(referencia.verdes.filter((n) => !despres.verdes.includes(n)), [], 'proves que eren verdes i ja no ho són');
    assert.ok(despres.verdes.length > 0);
  });
});

/* ── 11. Traça i CLI ──────────────────────────────────────────────────────── */

test('traca escriu una línia JSON amb identificadors (mai el text), i entradaDeTraca diu la decisió', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: DOCS_261003, vius: VIUS_261003 });
  const m = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: DEPS });
  assert.equal(a.traca(arrel, a.entradaDeTraca('deliverContext', m)), true);
  const linies = fs.readFileSync(path.join(arrel, '.agents/runtime/anticipacio.log'), 'utf8').trim().split('\n');
  assert.equal(linies.length, 1);
  const e = JSON.parse(linies[0]);
  assert.deepEqual({ ...e, t: 'T' }, { t: 'T', punt: 'deliverContext', ruta: 'prompt.local', fitxer: PROMPT, mode: 'convocatoria', fase: 'observacio', digest: m.digest, bloquejants: ['B1', 'B2'], avisos: [], decisio: 'observacio' });
  const porta = a.miseries(arrel, { ara: ARA, ruta: 'prompt.local', fitxer: PROMPT, torn: torn(), deps: APROVAT });
  assert.equal(a.entradaDeTraca('pre-tool', porta).decisio, 'bloqueja');
  assert.equal(a.entradaDeTraca('pre-tool', a.miseries(arrel, { ara: ARA, ruta: 'auditoria', fitxer: `${DESK}/${DIA}_1330_auditoria_claude.md`, deps: APROVAT })).decisio, 'lliurament');
});

test('CLI (camí amb espais): sense les portes del repositori falla tancat amb B6, és lectura i rebutja banderes dolentes', (t) => {
  if (salta(t)) return;
  const arrel = mas(t, { docs: { [PLA_BO]: PLA } });
  // El fill usa la mateixa jornada sintètica que el Mas. El Date del pare no
  // es toca; els constructors amb arguments i Date.now conserven el contracte.
  const rellotge = path.join(arrel, 'rellotge-sintetic.mjs');
  fs.writeFileSync(rellotge, `import assert from 'node:assert/strict';
const DateReal = globalThis.Date;
const ara = ${ARA.getTime()};
class DateSintetic extends DateReal {
  constructor(...args) { if (args.length) super(...args); else super(ara); }
  static now() { return ara; }
}
globalThis.Date = DateSintetic;
assert.equal(new Date().getTime(), ara);
assert.equal(Date.now(), ara);
assert.equal(new Date(0).getTime(), 0);
assert.equal(new Date('2000-01-01T00:00:00.000Z').getTime(), DateReal.parse('2000-01-01T00:00:00.000Z'));
assert.equal(new Date(2020, 0, 2).getTime(), new DateReal(2020, 0, 2).getTime());
`);
  const cli = (...args) => spawnSync(process.execPath, ['--import', pathToFileURL(rellotge).href, MODUL, ...args], { cwd: arrel, env: { ...process.env, SDP_ARREL: arrel }, encoding: 'utf8', timeout: 20000 });
  const json = cli('--json', '--ruta', 'prompt.local', '--fitxer', PROMPT);
  assert.equal(json.status, 1, json.stderr);
  assert.match(json.stderr, /dependència no carregada: porta-olivera\.mjs/);
  const m = JSON.parse(json.stdout);
  assert.equal(m.schema, 'sdp.miseries.v1');
  assert.deepEqual(ids(m.bloquejants), ['B6']);
  const text = cli('--informe');
  assert.equal(text.status, 1);
  assert.match(text.stdout, /^\[Anticipació · misèries abans d'actuar\] \d{6} · sense ruta/);
  assert.equal(fs.existsSync(path.join(arrel, '.agents/runtime/anticipacio.log')), false, 'la CLI no escriu cap traça');
  assert.equal(cli('--informe', '--json').status, 2);
  assert.equal(cli('--turn-id', 'no-es-un-torn', '--informe').status, 2);
  assert.equal(cli().status, 2);
});
