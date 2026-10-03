/** Corredor del tractor de fatiga 261002 (torn torn_ffcc22bb, encàrrec 1).
 *
 *  El paquet viu a `02_investigacio_ia/261002_1510_tractor_fatiga_claude/nous/`
 *  i l'aplicarà l'executor amb una lease del Mestre. Mentre no s'aplique, estes
 *  proves importen les versions noves del laboratori; quan l'executor ha deixat
 *  la transacció acceptada del paquet (operationId `sdp-fatiga-261002-*` a
 *  `.agents/seal-transactions/`), importen els fitxers reals. Si el laboratori
 *  s'ha arxivat i no hi ha transacció, fan skip.
 *
 *  Tot el que escriuen va a os.tmpdir(): un brain fals d'Antigravity amb
 *  transcripcions i pujades sintètiques, i una arrel falsa (SDP_ARREL) per a la
 *  traça. Cap dada real de cap conversa.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261002_1510_tractor_fatiga_claude';
const LAB = path.join(REPO, REL_LAB);
const OPERACIO = 'sdp-fatiga-261002-';

/** Transacció acceptada del paquet, o null (mateix criteri que prepara-pla.mjs). */
function transaccio() {
  const dir = path.join(REPO, '.agents/seal-transactions');
  if (!fs.existsSync(dir)) return null;
  for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    let t;
    try { t = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8')); } catch { continue; }
    if (t?.state === 'accepted' && typeof t.operationId === 'string' && t.operationId.startsWith(OPERACIO) && Array.isArray(t.files)) return t;
  }
  return null;
}

const TRANSACCIO = transaccio();
const BASE = TRANSACCIO ? REPO : (fs.existsSync(path.join(LAB, 'nous')) ? path.join(LAB, 'nous') : null);
const DE_BASE = (rel) => path.join(BASE, rel);
const REL_SKILL = '.agents/skills/core-context-panic/SKILL.md';
const SKILL_BASE = TRANSACCIO ? REL_SKILL : `${REL_SKILL}.txt`;
const HOOK = BASE ? DE_BASE('tooling/gates/fatiga-hook.mjs') : null;
const termo = BASE ? await import(pathToFileURL(DE_BASE('tooling/brain/termometre_context.mjs')).href) : null;
const ganxo = BASE ? await import(pathToFileURL(HOOK).href) : null;
const pla = !TRANSACCIO && BASE ? await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href) : null;

function salta(t, { nomesLab = false } = {}) {
  if (!BASE) { t.skip('laboratori 261002_1510_tractor_fatiga_claude absent i paquet sense transacció'); return true; }
  if (nomesLab && TRANSACCIO) { t.skip(`paquet aplicat per l'executor (transacció ${TRANSACCIO.id}): el laboratori ja no mana`); return true; }
  return false;
}

/* ── Brain fals ───────────────────────────────────────────────────────────── */

const ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const ID_ALTRE = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const ID_ABSENT = 'cccccccc-dddd-4eee-8fff-aaaaaaaaaaaa';

function mas(t) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-fatiga-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const home = path.join(arrel, 'home');
  const brain = path.join(home, '.gemini', 'antigravity-ide', 'brain');
  fs.mkdirSync(brain, { recursive: true });
  fs.mkdirSync(path.join(arrel, '.agents/runtime'), { recursive: true });
  return { arrel, home, brain };
}

const linia = (pas, type, content = '', source = 'SYSTEM', creat = '2026-10-02T10:00:00Z') =>
  JSON.stringify({ step_index: pas, source, type, status: 'DONE', created_at: creat, ...(content ? { content } : {}) });
const peticio = (text) => `<USER_REQUEST>\n${text}\n</USER_REQUEST>\n<ADDITIONAL_METADATA>\nhora sintètica\n</ADDITIONAL_METADATA>`;
const efimer = (nivell) => `[FATIGA·N${nivell} · conv aaaaaaaa] avís sintètic`;
const registreCron = (tasca) => `Created At: 2026-10-02T01:28:37+02:00\nTool is running as a background task with task id: ${ID}/task-${tasca}\nTask Description: Cron: */10 * * * *, Prompt: revisa l'escriptori`;
const disparament = (tasca, k) => `The following is a <SYSTEM_MESSAGE> not actually sent by the user.\n\n<SYSTEM_MESSAGE>\n[Message] timestamp=2026-10-02T02:00:00Z sender=${ID}/task-${tasca} priority=MESSAGE_PRIORITY_HIGH content=revisa l'escriptori (iteration ${k})\n</SYSTEM_MESSAGE>`;
const tascaAcabada = (tasca) => `The following is a <SYSTEM_MESSAGE> not actually sent by the user.\n\n<SYSTEM_MESSAGE>\n[Message] timestamp=2026-10-02T02:00:00Z sender=${ID}/task-${tasca} priority=MESSAGE_PRIORITY_HIGH content=Task id "${ID}/task-${tasca}" finished with result:\n\nThe command exited with code 0.\n</SYSTEM_MESSAGE>`;

/**
 * Transcripció sintètica de `passos` registres amb la forma real de l'IDE. Els
 * passos que no diu cap opció són respostes del model.
 */
function transcriptSintetic({ passos = 10, humans = [0], avisos = [], reconeix = [], checkpoints = [], registres = [] } = {}) {
  const per = new Map();
  for (const p of checkpoints) per.set(p, linia(p, 'CHECKPOINT', '{{ CHECKPOINT }} resum sintètic'));
  for (const p of humans) per.set(p, linia(p, 'USER_INPUT', peticio(reconeix.includes(p) ? `vist ${termo.RECONEIX}` : ''), 'USER_EXPLICIT'));
  for (const a of avisos) per.set(a.pas, linia(a.pas, 'EPHEMERAL_MESSAGE', efimer(a.nivell), 'SYSTEM_SDK'));
  for (const r of registres) per.set(r.pas, linia(r.pas, r.type, r.content, r.source ?? 'SYSTEM', r.creat));
  const out = [];
  for (let p = 0; p < passos; p++) out.push(per.get(p) ?? linia(p, p % 3 ? 'PLANNER_RESPONSE' : 'VIEW_FILE', 'pas sintètic', 'MODEL'));
  return `${out.join('\n')}\n`;
}

function conversa(brain, id, { transcript = transcriptSintetic(), pujades = 0, veu = 0, brossa = true } = {}) {
  const dir = path.join(brain, id);
  const logs = path.join(dir, '.system_generated', 'logs');
  fs.mkdirSync(logs, { recursive: true });
  fs.writeFileSync(path.join(logs, 'transcript.jsonl'), transcript);
  const up = path.join(dir, '.user_uploaded');
  fs.mkdirSync(up, { recursive: true });
  for (let i = 0; i < pujades; i++) fs.writeFileSync(path.join(up, `media_${1000 + i}.png`), 'png sintètic');
  for (let i = 0; i < veu; i++) fs.writeFileSync(path.join(up, `uploaded_media_${2000 + i}.img`), 'veu sintètica');
  if (brossa) {
    fs.writeFileSync(path.join(up, '.DS_Store'), 'finder');
    fs.writeFileSync(path.join(up, 'media_9999.png.tmp'), 'a mitges');
  }
  return { dir, transcript: path.join(logs, 'transcript.jsonl') };
}

/* ── Calibratge i llindars ────────────────────────────────────────────────── */

test('calibratge amb les sessions reals: 2890/177/85,6 → N3; 2456/213/98,3 → N3; 120/19/9,4 → N0; ~2000 passos i 150 pujades → N2', (t) => {
  if (salta(t)) return;
  const L = termo.LLINDARS_DEFECTE;
  const n = (passos, pujades, mb) => termo.nivellFatiga({ passos, pujades, mb }, L);
  const llarga = n(2890, 177, 85.6);
  assert.equal(llarga.nivell, 3);
  assert.deepEqual(llarga.motius, ['passos 2890 ≥ 2800 (N3)', 'pujades 177 ≥ 150 (N2)', 'MB 85,6 ≥ 80 (N2)']);
  assert.equal(n(2456, 213, 98.3).nivell, 3);
  assert.deepEqual(n(120, 19, 9.4), { nivell: 0, motius: [] });
  assert.equal(n(1990, 150, 40).nivell, 2, 'les 150 pujades soles ja són N2');
  assert.equal(n(2000, 149, 40).nivell, 2, 'els 2000 passos sols ja són N2');
  assert.equal(n(1199, 99, 49.9).nivell, 0);
  assert.equal(n(1200, 0, 0).nivell, 1);
});

/* Les dues sessions llargues del 261001-261002, si són en esta màquina: el parser
   ha de llegir la forma real de l'IDE i donar el nivell que diu el calibratge.
   Només llig i només compara xifres; en un altre clon, skip. */
test('calibratge contra les transcripcions reals de la màquina (23b0cc39 i ab2072b5), si hi són', (t) => {
  if (salta(t)) return;
  const brain = termo.BRAIN;
  const dirs = fs.existsSync(brain) ? fs.readdirSync(brain) : [];
  const sessio = (prefix) => dirs.find((d) => d.startsWith(prefix)) ?? null;
  const reals = ['23b0cc39', 'ab2072b5'].map(sessio).filter(Boolean);
  if (reals.length < 2) { t.skip('les sessions de calibratge no són en esta màquina'); return; }
  for (const id of reals) {
    const t0 = Date.now();
    const r = termo.avaluaFatiga({ conversationId: id, invocationNum: 2 }, { llindars: termo.LLINDARS_DEFECTE });
    const ms = Date.now() - t0;
    assert.equal(r.error, undefined, `${id.slice(0, 8)}: ${r.error}`);
    assert.equal(r.nivell, 3, `${id.slice(0, 8)}: ${r.motius.join('; ')}`);
    assert.ok(ms < termo.PRESSUPOST_MS, `${id.slice(0, 8)}: ${ms} ms`);
    assert.equal(r.mesura.pujades, r.mesura.imatges + r.mesura.veu + r.mesura.altres);
    assert.ok(r.mesura.humans > 0 && r.mesura.resums > 0, 'llig USER_INPUT i CHECKPOINT reals');
  }
  const llarga = termo.avaluaFatiga({ conversationId: sessio('23b0cc39'), invocationNum: 2 }, { llindars: termo.LLINDARS_DEFECTE }).mesura;
  assert.ok(llarga.passos >= 2800, `passos: ${llarga.passos}`);
  assert.ok(llarga.resums >= 40, `resums: ${llarga.resums}`);
  assert.ok(llarga.programats >= 1 && llarga.crons >= 80, `/schedule: ${llarga.programats} programats, ${llarga.crons} disparaments`);
  assert.ok(llarga.pujades >= 177, `pujades: ${llarga.pujades}`);
});

test('llindars per entorn: JSON parcial validat, àlies SDP_LIMIT_ARTEFACTES i valors per defecte davant de qualsevol error', (t) => {
  if (salta(t)) return;
  const D = termo.LLINDARS_DEFECTE;
  assert.deepEqual(termo.llindarsDe({}), D);
  assert.ok(Object.isFrozen(D) && Object.isFrozen(D[2]));
  const parcial = termo.llindarsDe({ SDP_FATIGA_LLINDARS: '{"2":{"pujades":120}}' });
  assert.equal(parcial[2].pujades, 120);
  assert.deepEqual({ ...parcial[1] }, { ...D[1] });
  assert.equal(parcial[3].passos, D[3].passos);
  for (const dolent of ['{', '[]', '{"4":{"passos":1}}', '{"1":{"passos":3000}}', '{"2":{"pujades":-1}}', '{"2":{"resums":5}}', '{"2":5}']) {
    assert.deepEqual(termo.llindarsDe({ SDP_FATIGA_LLINDARS: dolent }), D, `invàlid: ${dolent}`);
  }
  // L'àlies fixa N2.pujades i arrossega el veí que trencaria l'ordre; la resta no es mou.
  const baix = termo.llindarsDe({ SDP_LIMIT_ARTEFACTES: '90' });
  assert.deepEqual([baix[1].pujades, baix[2].pujades, baix[3].pujades], [90, 90, D[3].pujades]);
  assert.equal(baix[2].passos, D[2].passos);
  const alt = termo.llindarsDe({ SDP_LIMIT_ARTEFACTES: '500' });
  assert.deepEqual([alt[1].pujades, alt[2].pujades, alt[3].pujades], [D[1].pujades, 500, 500]);
  for (const dolent of ['molts', '0', '-3']) assert.deepEqual(termo.llindarsDe({ SDP_LIMIT_ARTEFACTES: dolent }), D, `àlies invàlid: ${dolent}`);
  const tots = termo.llindarsDe({ SDP_LIMIT_ARTEFACTES: '90', SDP_FATIGA_LLINDARS: '{"3":{"mb":200}}' });
  assert.equal(tots[2].pujades, 90);
  assert.equal(tots[3].mb, 200);

  // El mòdul llig l'entorn en carregar-se: LLINDARS i MISSATGE porten el llindar real.
  const r = spawnSync(process.execPath, ['--input-type=module', '-e',
    'const m = await import(process.argv[1]); console.log(JSON.stringify({ n2: m.LLINDARS[2], missatge: m.MISSATGE }));',
    pathToFileURL(DE_BASE('tooling/brain/termometre_context.mjs')).href], {
    env: { ...process.env, SDP_LIMIT_ARTEFACTES: '90', SDP_FATIGA_LLINDARS: '{"2":{"passos":1500}}' }, encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  const eixida = JSON.parse(r.stdout);
  assert.deepEqual(eixida.n2, { passos: 1500, pujades: 90, mb: D[2].mb });
  assert.match(eixida.missatge, /\b90 artefactes/);
  assert.doesNotMatch(eixida.missatge, /150/);
});

/* ── Conversa, pujades i transcripció ─────────────────────────────────────── */

test('resolConversa: payload, mai «la més recent» ni tempmediaStorage, i el directori s’ha de dir com la conversa', (t) => {
  if (salta(t)) return;
  const { brain } = mas(t);
  const bona = conversa(brain, ID);
  const altra = conversa(brain, ID_ALTRE);
  const temp = conversa(brain, 'tempmediaStorage');
  // La més recent i tempmediaStorage són a un pas: ni el temps ni el nom les fan triar.
  const futur = new Date(Date.now() + 60000);
  fs.utimesSync(temp.transcript, futur, futur);
  fs.utimesSync(altra.transcript, futur, futur);

  const esperada = { id: ID, dir: bona.dir, transcript: bona.transcript };
  assert.deepEqual(termo.resolConversa({ conversationId: ID, artifactDirectoryPath: bona.dir }, { brain }), esperada);
  assert.deepEqual(termo.resolConversa({ transcriptPath: bona.transcript }, { brain }), esperada, 'sense id, el directori d’un UUID');
  assert.deepEqual(termo.resolConversa({ conversationId: ID }, { brain }), esperada, 'només amb l’id, per brain');
  // L'artefacte d'una altra conversa no val: es passa al candidat següent.
  assert.deepEqual(termo.resolConversa({ conversationId: ID, artifactDirectoryPath: altra.dir, transcriptPath: bona.transcript }, { brain }), esperada);

  assert.equal(termo.resolConversa({ conversationId: ID, artifactDirectoryPath: altra.dir, transcriptPath: altra.transcript }, { brain: path.join(brain, 'cap') }), null, 'basename ≠ id');
  assert.equal(termo.resolConversa({ transcriptPath: temp.transcript }, { brain }), null);
  assert.equal(termo.resolConversa({ conversationId: 'tempmediaStorage' }, { brain }), null);
  assert.equal(termo.resolConversa({ artifactDirectoryPath: temp.dir }, { brain }), null);
  assert.equal(termo.resolConversa({}, { brain }), null, 'sense identitat no hi ha conversa, encara que n’hi haja de recents');
  assert.equal(termo.resolConversa({ conversationId: ID_ABSENT }, { brain }), null);
  assert.equal(termo.resolConversa({ conversationId: `../${ID}` }, { brain }), null);
  assert.equal(termo.resolConversa(null, { brain }), null);
  fs.rmSync(bona.transcript);
  assert.equal(termo.resolConversa({ conversationId: ID, artifactDirectoryPath: bona.dir }, { brain }), null, 'sense transcripció no hi ha conversa');
});

test('comptaPujades: captures i notes de veu, sense .DS_Store, *.tmp ni carpetes', (t) => {
  if (salta(t)) return;
  const { brain } = mas(t);
  const { dir } = conversa(brain, ID, { pujades: 3, veu: 2 });
  fs.writeFileSync(path.join(dir, '.user_uploaded', 'informe.pdf'), 'pdf');
  fs.writeFileSync(path.join(dir, '.user_uploaded', '.amagat'), 'x');
  fs.mkdirSync(path.join(dir, '.user_uploaded', 'carpeta'));
  const p = termo.comptaPujades(dir);
  assert.deepEqual({ ...p, bytes: undefined }, { n: 6, bytes: undefined, imatges: 3, veu: 2, altres: 1 });
  assert.equal(p.bytes, 3 * Buffer.byteLength('png sintètic') + 2 * Buffer.byteLength('veu sintètica') + 3);
  assert.deepEqual(termo.comptaPujades(path.join(brain, ID_ABSENT)), { n: 0, bytes: 0, imatges: 0, veu: 0, altres: 0 });
});

test('llegixTranscript: passos fora d’ordre, línies corruptes comptades, avisos, reconeixement escrit i disparaments del planificador', (t) => {
  if (salta(t)) return;
  // El model respon (6) entre l'avís (5) i els torns del Mestre (7 i 8): el Mestre l'ha pogut vore.
  const linies = [
    linia(0, 'USER_INPUT', peticio('hola'), 'USER_EXPLICIT'),
    linia(6, 'PLANNER_RESPONSE', `responc ${termo.RECONEIX} i [FATIGA·N3 de mentida]`, 'MODEL'),
    linia(4, 'CHECKPOINT', 'resum'),
    '{',
    'no és json',
    '[1,2]',
    linia(5, 'EPHEMERAL_MESSAGE', efimer(2), 'SYSTEM_SDK'),
    linia(7, 'USER_INPUT', `<USER_REQUEST>\n\n</USER_REQUEST>\n<ADDITIONAL_METADATA>\n${termo.RECONEIX}\n</ADDITIONAL_METADATA>`, 'USER_EXPLICIT'),
    linia(8, 'USER_INPUT', peticio(`d’acord, ${termo.RECONEIX}`), 'USER_EXPLICIT'),
    linia(9, 'GENERIC', registreCron(9), 'MODEL'),
    linia(10, 'SYSTEM_MESSAGE', disparament(9, 1)),
    linia(11, 'SYSTEM_MESSAGE', tascaAcabada(77)),
    linia(12, 'SYSTEM_MESSAGE', disparament(9, 2)),
    linia(13, 'CHECKPOINT', 'resum'),
  ].join('\n');
  const r = termo.llegixTranscript(linies);
  assert.equal(r.passos, 14);
  assert.equal(r.corruptes, 3);
  assert.equal(r.resums, 2);
  assert.equal(r.humans, 3);
  assert.equal(r.ultimHuma, 8);
  assert.deepEqual(r.ultimAvis, { pas: 5, nivell: 2 }, 'la marca d’una resposta del model no és un avís');
  assert.deepEqual(r.reconeixement, { pas: 8, nivell: 2 }, 'només compta el que el Mestre escriu dins de la petició');
  assert.equal(r.humansDesDeAvis, 2);
  assert.equal(r.crons, 2);
  assert.equal(r.ultimCron, 12);
  assert.equal(r.programats, 1);
  // El recompte lleuger (regex per capçalera) diu el mateix que el parse complet.
  assert.deepEqual(termo.llegixTranscript(linies, { lleuger: true }), r);
});

test('mesuraFatiga: per damunt de 20 MB compta per regex, i dins del pressupost', (t) => {
  if (salta(t)) return;
  const { brain } = mas(t);
  const gros = linia(3, 'PLANNER_RESPONSE', 'x'.repeat(termo.LIMIT_PARSE_BYTES + 1024), 'MODEL');
  const text = `${[linia(0, 'USER_INPUT', peticio(''), 'USER_EXPLICIT'), linia(1, 'CHECKPOINT', 'resum'), linia(2, 'EPHEMERAL_MESSAGE', efimer(1), 'SYSTEM_SDK'), gros, linia(4, 'USER_INPUT', peticio(''), 'USER_EXPLICIT')].join('\n')}\n`;
  const c = conversa(brain, ID, { transcript: text, pujades: 2, veu: 1 });
  const t0 = Date.now();
  const m = termo.mesuraFatiga({ id: ID, ...c }, { passosPayload: 3 });
  assert.ok(Date.now() - t0 < termo.PRESSUPOST_MS, `pressupost: ${Date.now() - t0} ms`);
  assert.equal(m.mode, 'regex');
  assert.equal(m.passos, 5);
  assert.equal(m.humans, 2);
  assert.equal(m.resums, 1);
  assert.deepEqual(m.ultimAvis, { pas: 2, nivell: 1 });
  assert.equal(m.pujades, 3);
  assert.ok(m.mb > 20, `MB: ${m.mb}`);
  const petita = conversa(brain, ID_ALTRE, { transcript: transcriptSintetic({ passos: 4 }) });
  const p = termo.mesuraFatiga({ id: ID_ALTRE, ...petita }, { passosPayload: 2500 });
  assert.equal(p.mode, 'parse');
  assert.equal(p.passos, 2500, 'initialNumSteps de l’IDE guanya si és més gran');
  assert.equal(p.passosTranscript, 4);
});

/* ── Política i missatge ──────────────────────────────────────────────────── */

test('decidixAvis: N1 una vegada, N2 per pujada de nivell o cada 10 torns, reconeixement escrit, N3 a cada torn i amb el planificador, mai dues vegades dins del mateix torn', (t) => {
  if (salta(t)) return;
  const d = termo.decidixAvis;
  const e = (x) => ({ ultimAvis: null, ultimHuma: 20, ultimCron: null, humansDesDeAvis: 0, reconeixement: null, ...x });
  assert.equal(d(e({}), 0), false);
  // N1
  assert.equal(d(e({}), 1), true);
  assert.equal(d(e({ ultimAvis: { pas: 10, nivell: 1 }, humansDesDeAvis: 30 }), 1), false, 'N1 només una vegada per conversa');
  // N2
  assert.equal(d(e({ ultimAvis: { pas: 10, nivell: 1 }, humansDesDeAvis: 1 }), 2), true, 'l’últim avís era de nivell inferior');
  assert.equal(d(e({ ultimAvis: { pas: 25, nivell: 1 } }), 2), false, 'dins del mateix torn, ni pujant de nivell');
  assert.equal(d(e({ ultimAvis: { pas: 10, nivell: 2 }, humansDesDeAvis: 9 }), 2), false);
  assert.equal(d(e({ ultimAvis: { pas: 10, nivell: 2 }, humansDesDeAvis: termo.CADENCIA_VEU }), 2), true, 'cadència de veu');
  assert.equal(d(e({ ultimAvis: { pas: 10, nivell: 2 }, humansDesDeAvis: 12, reconeixement: { pas: 15, nivell: 2 } }), 2), false, 'reconegut per escrit');
  assert.equal(d(e({ ultimAvis: { pas: 10, nivell: 2 }, humansDesDeAvis: 12, reconeixement: { pas: 8, nivell: 2 } }), 2), true, 'un reconeixement anterior a l’avís no el silencia');
  assert.equal(d(e({ ultimAvis: { pas: 10, nivell: 2 }, humansDesDeAvis: 12, reconeixement: { pas: 15, nivell: 1 } }), 2), true, 'reconéixer N1 no silencia N2');
  // N3
  assert.equal(d(e({ ultimAvis: { pas: 25, nivell: 3 } }), 3), false, 'mai dues vegades dins del mateix torn');
  assert.equal(d(e({ ultimAvis: { pas: 15, nivell: 3 } }), 3), true, 'a cada torn del Mestre');
  assert.equal(d(e({ ultimAvis: { pas: 15, nivell: 3 }, reconeixement: { pas: 18, nivell: 3 } }), 3), true, 'N3 no es pot silenciar');
  assert.equal(d(e({ ultimAvis: { pas: 25, nivell: 3 }, ultimCron: 30 }), 3), true, 'a cada disparament del planificador');
  assert.equal(d(e({ ultimAvis: { pas: 31, nivell: 3 }, ultimCron: 30 }), 3), false);
  assert.equal(d(e({ ultimAvis: { pas: 25, nivell: 2 } }), 3), false, 'pujar a N3 dins del mateix torn espera al torn següent');

  // Integrat amb una transcripció: avís de N2 i deu torns de veu (petició buida) després.
  const humans = Array.from({ length: 11 }, (_, i) => i * 3);
  const llegit = termo.llegixTranscript(transcriptSintetic({ passos: 40, humans, avisos: [{ pas: 1, nivell: 2 }] }));
  assert.equal(llegit.humansDesDeAvis, 10);
  assert.equal(d(llegit, 2), true);
  const reconegut = termo.llegixTranscript(transcriptSintetic({ passos: 40, humans, avisos: [{ pas: 1, nivell: 2 }], reconeix: [3] }));
  assert.equal(d(reconegut, 2), false);
});

/* Ordre real de l'IDE (capçaleres de 23b0cc39: 597/598, 1559/1560, 2771/2772; ab2072b5:
   1387/1388, 1509/1512): un missatge del Mestre o un disparament que arriba mentre el
   model treballa queda registrat DESPRÉS de l'efímer del hook de la crida que el
   consumix, amb un created_at anterior i sense cap registre del model entremig. */
test('ordre real de l’IDE: l’avís seguit del USER_INPUT o del disparament de la mateixa crida pertany a eixe torn', (t) => {
  if (salta(t)) return;
  const d = termo.decidixAvis;
  const enCua = (pas, text = '') => ({ pas, type: 'USER_INPUT', content: peticio(text), source: 'USER_EXPLICIT', creat: '2026-10-02T09:59:50Z' });
  const sistema = (pas, type = 'EPHEMERAL_MESSAGE') => ({ pas, type, content: 'registre propi de l’IDE' });
  // Torn 10 sense avís (N2 sense cadència); a mitjan bucle puja a N3 (20) i el Mestre ha dictat (22).
  const base = { passos: 30, humans: [0, 10], avisos: [{ pas: 1, nivell: 2 }, { pas: 20, nivell: 3 }] };
  const text = transcriptSintetic({ ...base, registres: [sistema(21, 'CONVERSATION_HISTORY'), enCua(22, `vist ${termo.RECONEIX}`), sistema(23)] });
  const carrera = termo.llegixTranscript(text);
  assert.equal(carrera.ultimHuma, 22);
  assert.deepEqual(carrera.ultimAvis, { pas: 22, nivell: 3 }, 'l’avís passa al torn que el model va vore amb ell');
  assert.equal(carrera.humansDesDeAvis, 0);
  assert.deepEqual(carrera.reconeixement, { pas: 22, nivell: 2 }, 'el missatge en cua reconeix l’avís que ja havia vist, no el que arriba amb ell');
  assert.equal(d(carrera, 3), false, 'un sol N3 per un sol missatge del Mestre');
  assert.deepEqual(termo.llegixTranscript(text, { lleuger: true }), carrera);
  const seguent = termo.llegixTranscript(transcriptSintetic({ ...base, humans: [0, 10, 28], registres: [sistema(21, 'CONVERSATION_HISTORY'), enCua(22), sistema(23)] }));
  assert.equal(d(seguent, 3), true, 'el torn següent torna a portar N3');

  // El mateix amb un disparament del planificador a mitjan bucle.
  const cron = termo.llegixTranscript(transcriptSintetic({ ...base, registres: [{ pas: 21, type: 'SYSTEM_MESSAGE', content: disparament(5, 7) }, sistema(22)] }));
  assert.equal(cron.ultimCron, 21);
  assert.deepEqual(cron.ultimAvis, { pas: 21, nivell: 3 });
  assert.equal(d(cron, 3), false);
  const cronSeguent = termo.llegixTranscript(transcriptSintetic({ ...base, registres: [{ pas: 21, type: 'SYSTEM_MESSAGE', content: disparament(5, 7) }, sistema(22), { pas: 28, type: 'SYSTEM_MESSAGE', content: disparament(5, 8) }] }));
  assert.equal(d(cronSeguent, 3), true);

  // Un avís atribuït al torn actual té el pas del torn: ja compta «dins del torn».
  const e = { ultimHuma: 20, ultimCron: null, humansDesDeAvis: 0, reconeixement: null };
  assert.equal(d({ ...e, ultimAvis: { pas: 20, nivell: 3 } }, 3), false);
  assert.equal(d({ ...e, ultimAvis: { pas: 20, nivell: 1 } }, 2), false, 'ni pujant de nivell');

  // Límit conegut de PreInvocation: N3 ja avisat al torn 10 (pas 11). Quan corre el hook
  // de la crida que consumix el missatge nou, eixe missatge encara no és a la transcripció...
  const nivellN3 = { passos: 21, humans: [0, 10], avisos: [{ pas: 11, nivell: 3 }] };
  assert.equal(d(termo.llegixTranscript(transcriptSintetic(nivellN3)), 3), false, 'la crida que el consumix encara no el veu');
  // ...i l'avís arriba a la crida següent del mateix torn (si el model tanca el bucle, al torn següent).
  const tard = termo.llegixTranscript(transcriptSintetic({ ...nivellN3, passos: 26, registres: [enCua(21), sistema(22)] }));
  assert.equal(d(tard, 3), true, 'N3 arriba una crida tard');
});

test('missatgeFatiga: capçalera, xifres reals, frase literal del cas 4 a N2 i N3, i cap «150» fix quan els llindars canvien', (t) => {
  if (salta(t)) return;
  const L = termo.llindarsDe({ SDP_FATIGA_LLINDARS: '{"1":{"passos":300,"pujades":40,"mb":10},"2":{"passos":400,"pujades":90,"mb":20},"3":{"passos":600,"pujades":120,"mb":30}}' });
  const m = { id: ID, passos: 500, pujades: 95, imatges: 70, veu: 25, altres: 0, mb: 12.34, resums: 4, crons: 0, programats: 0, ultimCron: null };
  const { nivell, motius } = termo.nivellFatiga(m, L);
  assert.equal(nivell, 2);
  const n2 = termo.missatgeFatiga(nivell, m, motius, ID);
  assert.ok(n2.startsWith('[FATIGA·N2 · conv aaaaaaaa]'), n2);
  assert.equal(Number(termo.MARCA.exec(n2)[1]), 2);
  assert.ok(n2.includes(termo.FRASE_CAS4));
  for (const x of ['500 passos', '95 pujades (70 captures, 25 notes de veu)', '12,3 MB', '4 resums automàtics', 'passos 500 ≥ 400 (N2)', 'pujades 95 ≥ 90 (N2)', 'MB 12,3 ≥ 10 (N1)', termo.RECONEIX]) {
    assert.ok(n2.includes(x), `falta «${x}»: ${n2}`);
  }
  assert.doesNotMatch(n2.replace(termo.FRASE_CAS4, ''), /150/, 'fora de la frase literal, cap llindar fix');

  const n3 = termo.missatgeFatiga(3, { ...m, crons: 85, programats: 1, ultimCron: 2888 }, ['passos 700 ≥ 600 (N3)'], ID);
  assert.ok(n3.startsWith('[FATIGA·N3 · conv aaaaaaaa]'));
  assert.ok(n3.includes(termo.FRASE_CAS4));
  assert.match(n3, /No comences cap tasca nova/);
  assert.match(n3, /Acta Marmota/);
  assert.match(n3, /\/schedule \(85 disparaments; l'últim, al pas 2888\)/);
  assert.match(n3, /cancel·lar-lo/);
  assert.doesNotMatch(termo.missatgeFatiga(3, m, [], ID), /\/schedule/, 'sense planificador no se’n parla');

  const n1 = termo.missatgeFatiga(1, m, ['passos 350 ≥ 300 (N1)'], ID);
  assert.ok(n1.startsWith('[FATIGA·N1 · conv aaaaaaaa]'));
  assert.ok(!n1.includes(termo.FRASE_CAS4), 'N1 no atura la màquina');
});

test('la frase del cas 4 és literal a la skill, el frontmatter és idèntic i la resta de la skill no canvia', (t) => {
  if (salta(t)) return;
  const nova = fs.readFileSync(DE_BASE(SKILL_BASE), 'utf8');
  assert.ok(nova.includes(`*"${termo.FRASE_CAS4}"*`), 'frase literal, amb el mateix format');
  // La regla dels /schedule és una decisió que el Mestre pot llevar abans d'aplicar: no es comprova ací.
  for (const x of ['[FATIGA·N1', '[FATIGA·N3', 'sdp-fatiga', termo.RECONEIX, 'Acta Marmota', `cada ${termo.CADENCIA_VEU} torns`]) assert.ok(nova.includes(x), `falta «${x}»`);
  if (TRANSACCIO) return;
  const real = fs.readFileSync(path.join(REPO, REL_SKILL), 'utf8');
  const frontmatter = (x) => x.slice(0, x.indexOf('\n---\n', 4) + 5);
  assert.equal(frontmatter(nova), frontmatter(real));
  // Fora del cas 4, cada línia de l'original continua al mateix ordre (l'eina d'escriptura perd l'espai final).
  const cas4 = (l) => l.startsWith('4. **Saturació') || l.startsWith('**NOU:**');
  const noves = nova.split('\n').map((l) => l.trimEnd());
  let i = 0;
  for (const l of real.split('\n').map((x) => x.trimEnd()).filter((x) => !cas4(x))) {
    while (i < noves.length && noves[i] !== l) i++;
    assert.ok(i < noves.length, `línia original perduda: «${l}»`);
    i++;
  }
});

/* ── Compatibilitat ───────────────────────────────────────────────────────── */

test('compatibilitat: comptaArtefactes, avis i MISSATGE per a preflight_matrix_wrapper i backend_consolidacio', (t) => {
  if (salta(t)) return;
  const { arrel, brain } = mas(t);
  const { dir, transcript } = conversa(brain, ID, { pujades: 2, veu: 1 });
  fs.writeFileSync(path.join(dir, 'task.md'), '# tasca');
  fs.writeFileSync(path.join(dir, 'implementation_plan.md'), '# pla');
  assert.equal(termo.comptaArtefactes(transcript), 5, 'dos .md i tres pujades; .DS_Store i *.tmp no compten');
  assert.equal(termo.avis(transcript), null);
  // La forma de tests/backend_consolidacio.test.mjs: sessions/.system_generated/transcript.jsonl.
  const sessio = path.join(arrel, 'sessions/.system_generated/transcript.jsonl');
  fs.mkdirSync(path.dirname(sessio), { recursive: true });
  fs.writeFileSync(sessio, `${JSON.stringify({ type: 'USER_INPUT', content: 'auditoria backend' })}\n`);
  assert.equal(termo.comptaArtefactes(sessio), 0);
  assert.equal(termo.avis(sessio), null);
  const limit = termo.LLINDARS[2].pujades;
  const plena = conversa(brain, ID_ALTRE, { pujades: limit });
  assert.deepEqual(termo.avis(plena.transcript), { n: limit, missatge: termo.MISSATGE });
  assert.ok(termo.MISSATGE.includes(`${limit} artefactes`));
  assert.throws(() => termo.comptaArtefactes(undefined));
  const wrapper = fs.readFileSync(path.join(REPO, '.agents/hooks/preflight_matrix_wrapper.mjs'), 'utf8');
  const importats = /import \{([^}]+)\} from '\.\.\/\.\.\/tooling\/brain\/termometre_context\.mjs'/.exec(wrapper)?.[1].split(',').map((x) => x.trim()) ?? [];
  assert.ok(importats.length, 'el wrapper importa el termòmetre');
  for (const nom of importats) assert.equal(typeof termo[nom], 'function', `exporta ${nom}`);
});

/* ── hooks.json i registre de tasques ─────────────────────────────────────── */

test('.agents/hooks.json: sdp-olivera intacte i sdp-fatiga a PreInvocation, amb la forma que valida antigravity-hook.test', (t) => {
  if (salta(t)) return;
  const hooks = JSON.parse(fs.readFileSync(DE_BASE('.agents/hooks.json'), 'utf8'));
  assert.deepEqual(hooks['sdp-fatiga'], { PreInvocation: [{ type: 'command', command: 'cd .. && node tooling/gates/fatiga-hook.mjs', timeout: 5 }] });
  const [h] = hooks['sdp-fatiga'].PreInvocation;
  const m = /^cd \.\. && node (\S+\.mjs)(?: (\S+))?$/.exec(h.command);
  assert.ok(m && fs.existsSync(DE_BASE(m[1])), 'l’script del hook viatja amb el paquet');
  if (TRANSACCIO) return;
  const real = JSON.parse(fs.readFileSync(path.join(REPO, '.agents/hooks.json'), 'utf8'));
  const resta = Object.fromEntries(Object.entries(hooks).filter(([nom]) => nom !== 'sdp-fatiga'));
  assert.deepEqual(resta, real, 'la resta és còpia exacta de l’actual');
  assert.deepEqual(Object.keys(hooks), [...Object.keys(real), 'sdp-fatiga']);
});

test('registre de tasques: còpia exacta i la tasca fatiga-cognitiva amb llançador antigravity-hook', (t) => {
  if (salta(t)) return;
  const text = fs.readFileSync(DE_BASE('.agents/cron/registre_tasques.json'), 'utf8');
  const registre = JSON.parse(text);
  const fatiga = registre.tasques.find((x) => x.id === 'fatiga-cognitiva');
  assert.deepEqual(fatiga.llancador, { tipus: 'antigravity-hook', esdeveniment: 'PreInvocation', hook: 'sdp-fatiga' });
  assert.equal(fatiga.script, 'tooling/gates/fatiga-hook.mjs');
  assert.deepEqual(fatiga.escriu, ['.agents/runtime/fatiga-hook.log']);
  assert.equal(fatiga.registre, '.agents/runtime/fatiga-hook.log');
  assert.equal(fatiga.nivell, 'L0');
  assert.deepEqual(fatiga.arguments, []);
  if (TRANSACCIO) return;
  const realText = fs.readFileSync(path.join(REPO, '.agents/cron/registre_tasques.json'), 'utf8');
  const real = JSON.parse(realText);
  assert.deepEqual({ ...registre, tasques: registre.tasques.filter((x) => x.id !== 'fatiga-cognitiva') }, real);
  const tall = realText.lastIndexOf('    }\n  ]\n}');
  assert.ok(tall > 0 && text.startsWith(realText.slice(0, tall + '    }'.length)), 'el text anterior es conserva byte a byte');
});

/* ── Nucli del hook ───────────────────────────────────────────────────────── */

test('decidixFatiga: injecta l’avís, calla en fase 0, sense identitat no és error, i l’ERR només a la primera invocació', (t) => {
  if (salta(t)) return;
  const p = { conversationId: ID, transcriptPath: '/camí/privat/transcript.jsonl', invocationNum: 1, initialNumSteps: 2100, modelName: 'auto' };
  const avis = () => ({ nivell: 2, missatge: '[FATIGA·N2 · conv aaaaaaaa] prova', mesura: { id: ID } });
  const r = ganxo.decidixFatiga(p, { avalua: avis });
  assert.deepEqual(r.eixida, { injectSteps: [{ ephemeralMessage: '[FATIGA·N2 · conv aaaaaaaa] prova' }] });
  assert.deepEqual(r.traca, { conv: 'aaaaaaaa', inv: 1, passosPayload: 2100, claus: ['conversationId', 'initialNumSteps', 'invocationNum', 'modelName', 'transcriptPath'], nivell: 2, avis: true });
  assert.ok(!JSON.stringify(r.traca).includes('/camí/privat'), 'la traça no porta valors del payload');

  const f0 = ganxo.decidixFatiga(p, { avalua: avis, fase0: true });
  assert.deepEqual(f0.eixida, {});
  assert.equal(f0.traca.fase0, true);
  assert.equal(f0.traca.avis, true);

  assert.deepEqual(ganxo.decidixFatiga(p, { avalua: () => ({ nivell: 1, missatge: null }) }).eixida, {});
  const sense = ganxo.decidixFatiga({ invocationNum: 1 }, { avalua: () => ({ error: ganxo.SENSE_IDENTITAT }) });
  assert.deepEqual(sense.eixida, {});
  assert.equal(sense.traca.nivell, 'sense-identitat');

  const peta = () => { throw new Error('disc il·legible'); };
  assert.match(ganxo.decidixFatiga(p, { avalua: peta }).eixida.injectSteps[0].ephemeralMessage, /^\[FATIGA·ERR\] sensor no operatiu \(disc il·legible\)/);
  assert.deepEqual(ganxo.decidixFatiga({ ...p, invocationNum: 2 }, { avalua: peta }).eixida, {});
  assert.deepEqual(ganxo.decidixFatiga(p, { avalua: peta, fase0: true }).eixida, {});
  assert.equal(ganxo.decidixFatiga(p, { avalua: peta }).traca.nivell, 'error');
  assert.deepEqual(ganxo.decidixFatiga(null, { error: 'payload il·legible' }).eixida, {});
  assert.deepEqual(ganxo.decidixFatiga(p, { avalua: () => ({ error: 'res' }) }).eixida.injectSteps.length, 1);
  assert.equal(termo.MARCA.test('[FATIGA·ERR] sensor no operatiu'), false, 'un ERR no compta com a avís');
});

/* ── Procés real ──────────────────────────────────────────────────────────── */

function executa({ arrel, home }, entrada) {
  const env = { ...process.env, SDP_ARREL: arrel, HOME: home };
  delete env.SDP_FATIGA_LLINDARS;
  delete env.SDP_LIMIT_ARTEFACTES;
  const r = spawnSync(process.execPath, [HOOK], {
    cwd: arrel, env, input: typeof entrada === 'string' ? entrada : JSON.stringify(entrada), encoding: 'utf8', timeout: 20000,
  });
  assert.equal(r.status, 0, `el hook ix sempre amb 0 (stderr: ${r.stderr})`);
  const linies = r.stdout.trim().split('\n');
  assert.equal(linies.length, 1, `una sola línia JSON per stdout: ${r.stdout}`);
  return JSON.parse(linies[0]);
}
const traces = (arrel) => {
  const f = path.join(arrel, ganxo.TRACA);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
};

test('procés: brain fals de ~2100 passos i 151 pujades → [FATIGA·N2]; una vegada per torn; interruptor, fase 0, payload il·legible i sense identitat', (t) => {
  if (salta(t)) return;
  const m = mas(t);
  const humans = Array.from({ length: 41 }, (_, i) => i * 50);   // l'últim, al pas 2000
  const c = conversa(m.brain, ID, { transcript: transcriptSintetic({ passos: 2100, humans, checkpoints: [701, 1401] }), pujades: 120, veu: 31 });
  conversa(m.brain, ID_ALTRE);   // una altra conversa, que mai s'ha de triar
  const payload = { conversationId: ID, workspacePaths: [m.arrel], transcriptPath: c.transcript, artifactDirectoryPath: c.dir, modelName: 'auto', invocationNum: 1, initialNumSteps: 2100 };

  const r = executa(m, payload);
  const missatge = r.injectSteps?.[0]?.ephemeralMessage ?? '';
  assert.match(missatge, /^\[FATIGA·N2 · conv aaaaaaaa\]/);
  for (const x of ['2100 passos', '151 pujades (120 captures, 31 notes de veu)', '2 resums automàtics', termo.FRASE_CAS4]) assert.ok(missatge.includes(x), `falta «${x}»`);
  let l = traces(m.arrel);
  assert.equal(l.length, 1);
  assert.equal(l[0].conv, 'aaaaaaaa');
  assert.equal(l[0].nivell, 2);
  assert.equal(l[0].avis, true);
  assert.deepEqual(l[0].claus, Object.keys(payload).sort());
  assert.ok(Number.isInteger(l[0].ms) && l[0].ms < termo.PRESSUPOST_MS, `pressupost: ${l[0].ms} ms`);
  assert.ok(!fs.readFileSync(path.join(m.arrel, ganxo.TRACA), 'utf8').includes(m.arrel), 'cap ruta del payload a la traça');

  // Només amb l'id: el brain de HOME, la mateixa conversa.
  assert.match(executa(m, { conversationId: ID, invocationNum: 1 }).injectSteps[0].ephemeralMessage, /^\[FATIGA·N2 · conv aaaaaaaa\]/);

  // L'IDE ja ha registrat l'efímer després de l'últim torn: no es repetix dins del mateix torn.
  fs.appendFileSync(c.transcript, `${linia(2100, 'EPHEMERAL_MESSAGE', missatge, 'SYSTEM_SDK')}\n`);
  assert.deepEqual(executa(m, { ...payload, invocationNum: 2 }), {});
  assert.equal(traces(m.arrel).at(-1).avis, false);

  // Interruptor: {} sense mesurar ni traçar.
  const abans = traces(m.arrel).length;
  fs.writeFileSync(path.join(m.arrel, ganxo.INTERRUPTOR), '');
  assert.deepEqual(executa(m, payload), {});
  assert.equal(traces(m.arrel).length, abans);
  fs.rmSync(path.join(m.arrel, ganxo.INTERRUPTOR));

  // Fase 0: mesura i traça, no injecta. Amb un torn nou, l'avís hauria tocat.
  fs.appendFileSync(c.transcript, `${linia(2101, 'USER_INPUT', peticio(''), 'USER_EXPLICIT')}\n`);
  fs.writeFileSync(path.join(m.arrel, ganxo.FASE0), '');
  assert.deepEqual(executa(m, payload), {});
  l = traces(m.arrel).at(-1);
  assert.equal(l.fase0, true);
  assert.equal(l.nivell, 2);
  assert.equal(l.avis, false, 'N2 sense deu torns nous: no tocava');
  fs.rmSync(path.join(m.arrel, ganxo.FASE0));

  // Payload il·legible: {} i traça d'error.
  assert.deepEqual(executa(m, '{'), {});
  assert.equal(traces(m.arrel).at(-1).nivell, 'error');

  // Sense identitat: {} i traça, encara que hi haja converses al brain.
  assert.deepEqual(executa(m, { invocationNum: 1, workspacePaths: [m.arrel] }), {});
  assert.equal(traces(m.arrel).at(-1).nivell, 'sense-identitat');
  assert.deepEqual(executa(m, { invocationNum: 1, conversationId: ID_ABSENT }), {});
  assert.equal(traces(m.arrel).at(-1).nivell, 'sense-identitat');
});

test('procés: un sensor que no pot llegir injecta [FATIGA·ERR] només a la primera invocació', (t) => {
  if (salta(t)) return;
  if (process.getuid?.() === 0) { t.skip('root llig els fitxers sense permís'); return; }
  const m = mas(t);
  const c = conversa(m.brain, ID, { transcript: transcriptSintetic({ passos: 30 }) });
  fs.chmodSync(c.transcript, 0o000);
  t.after(() => { try { fs.chmodSync(c.transcript, 0o600); } catch { /* ja esborrat */ } });
  const payload = { conversationId: ID, transcriptPath: c.transcript, invocationNum: 1 };
  assert.match(executa(m, payload).injectSteps[0].ephemeralMessage, /^\[FATIGA·ERR\] sensor no operatiu/);
  assert.deepEqual(executa(m, { ...payload, invocationNum: 2 }), {});
  assert.equal(traces(m.arrel).at(-1).nivell, 'error');
});

/* ── Generador del pla ────────────────────────────────────────────────────── */

test('prepara-pla: cinc fitxers contrastats amb el commit base, pla que l’executor accepta i Petorreta que el seal accepta', async (t) => {
  if (salta(t, { nomesLab: true })) return;
  assert.deepEqual(pla.fitxersNous().map((f) => f.ruta), [
    '.agents/cron/registre_tasques.json', '.agents/hooks.json', '.agents/skills/core-context-panic/SKILL.md',
    'tooling/brain/termometre_context.mjs', 'tooling/gates/fatiga-hook.mjs',
  ]);
  const estat = pla.estat(REPO);
  const deriva = estat.filter((f) => f.estat === 'deriva');
  assert.deepEqual(deriva.map((f) => `${f.ruta}: ${f.motiu}`), [], 'cap original ha canviat des del commit base');
  if (estat.every((f) => f.estat === 'aplicat')) { t.skip('tot és al disc sense transacció: aplicat a mà?'); return; }
  const { plan, scopes, targets } = await pla.preparaPla(REPO);
  assert.equal(plan.schema, 'sdp.mutation.v1');
  assert.ok(plan.operationId.startsWith(pla.OPERACIO));
  assert.equal(plan.files.find((f) => f.path === 'tooling/gates/fatiga-hook.mjs')?.before ?? null, null);
  assert.ok(plan.files.filter((f) => f.path !== 'tooling/gates/fatiga-hook.mjs').every((f) => /^[a-f0-9]{64}$/.test(f.before)));
  assert.deepEqual(scopes, ['.agents/cron/registre_tasques.json', '.agents/hooks.json', '.agents/skills/core-context-panic/SKILL.md', 'tooling/brain/termometre_context.mjs', 'tooling/gates'].filter((s) => targets.some((x) => x === s || x.startsWith(`${s}/`))));
  const petorreta = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: 'a'.repeat(64), rulesSha256: 'b'.repeat(64), planSha256: pla.sha(JSON.stringify(plan)), targets });
  const { validatePetorreta } = await import(pathToFileURL(path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs')).href);
  assert.deepEqual(validatePetorreta(path.join(REPO, '.sdp-reflex/bootstrap/prova', pla.NOM_PETORRETA), petorreta), []);
  assert.deepEqual(pla.sensibles(petorreta), []);
  const manifest = JSON.parse(pla.manifest(REPO));
  assert.ok(manifest.sources.some((s) => s.path === pla.LLEGIU));
  for (const s of manifest.sources) assert.deepEqual(pla.sensibles(fs.readFileSync(path.join(REPO, s.path), 'utf8')), [], s.path);
});
