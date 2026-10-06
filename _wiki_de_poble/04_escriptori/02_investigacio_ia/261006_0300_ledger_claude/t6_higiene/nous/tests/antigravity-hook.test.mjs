/** Proves del hook d'Antigravity (tooling/gates/antigravity-hook.mjs) i de .agents/hooks.json.
 *
 *  Payload i eixida són els del contracte documentat de l'IDE 2.5.5
 *  (~/.gemini/antigravity-ide/builtin/skills/agy-customizations/docs/hooks.md):
 *  `{toolCall: {name, args}, stepIdx, conversationId, …}` per stdin i
 *  `{decision, reason}` o `{injectSteps}` per stdout. No el dialecte `toolArgs`
 *  que modelaven les proves antigues i que cap document de l'IDE descriu.
 *
 *  Tres blocs: el nucli amb portes falses, el procés real contra un Mas de prova
 *  a os.tmpdir() (amb les portes de veres) i l'esquema del hooks.json versionat.
 *  Les proves «[261006 t6]» són les del briefing de taula (laboratori
 *  261006_0300_ledger_claude/t6_higiene).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  preTool, preInvocation, calenPortes, sensePosicions, perError, DESK, INTERRUPTOR, TRACA, MODES
} from '../tooling/gates/antigravity-hook.mjs';

/* El briefing no exporta res nou (vegeu el comentari del hook): les proves en
   repetixen els dos literals que necessiten. */
const BRIEFINGS = '.agents/runtime/antigravity-briefing.log';
const MARCA_BRIEFING = '[Briefing de taula';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const SCRIPT = fileURLToPath(new URL('../tooling/gates/antigravity-hook.mjs', import.meta.url));
const ROOT = path.join(os.tmpdir(), 'sdp-mas-fals');
const avui = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getFullYear() % 100)}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};

/** Payload amb la forma exacta de la documentació (camps comuns inclosos). */
const crida = (name, args) => ({
  toolCall: { name, args }, stepIdx: 19, conversationId: 'ec33ebf9-0cba-4100-8142-c61503f6c587',
  workspacePaths: [ROOT], modelName: 'auto'
});
const alTaulell = (nom, root = ROOT) => path.join(root, DESK, nom);

/** Portes falses: registren què se'ls demana i tornen el que diu la prova. */
function portes({ olivera = [], plantilla = [], taula = { valid: true, errors: [] }, operacio = null } = {}) {
  const crides = { operacio: [], olivera: 0, plantilla: 0 };
  return {
    crides,
    esPetorreta: (rel) => /^_wiki_de_poble\/04_escriptori\/\d{6}_\d{4}_(?:prompt|macro_prompt|micro_prompt|petorreta)_[^/]+\.md$/.test(rel),
    vigilat: (nom) => /^\d{6}_\d{4}_(?:prompt|macro_prompt|micro_prompt|petorreta|pla)(?:_|\.md$)/.test(nom),
    operacio: (p) => {
      crides.operacio.push(p);
      if (operacio) return operacio(p);
      return { fitxer: path.relative(ROOT, p.toolArgs.TargetFile).split(path.sep).join('/'), contingut: p.toolArgs.CodeContent ?? '# reconstruït\n' };
    },
    olivera: () => { crides.olivera++; return olivera; },
    plantilla: () => { crides.plantilla++; return plantilla; },
    taula: () => taula
  };
}

/* ── Nucli ────────────────────────────────────────────────────────────────── */

test('run_command del payload documentat (npm test) → allow sense carregar portes', () => {
  const p = crida('run_command', { CommandLine: 'npm test' });
  assert.equal(calenPortes('pre-tool', p, ROOT), null);
  assert.deepEqual(preTool(p, { root: ROOT }), { decision: 'allow' });
});

test('view_file → allow sense carregar portes', () => {
  const p = crida('view_file', { AbsolutePath: alTaulell('260930_1200_prompt_prova.md') });
  assert.equal(calenPortes('pre-tool', p, ROOT), null);
  assert.equal(preTool(p, { root: ROOT }).decision, 'allow');
});

test('prompt escrit al primer nivell amb errors → deny, i el motiu porta cada error i la via de sortida', () => {
  const p = crida('write_to_file', { TargetFile: alTaulell('260930_1200_prompt_claude_prova.md'), CodeContent: '# de memòria\n' });
  assert.equal(calenPortes('pre-tool', p, ROOT), 'escriptura');
  const f = portes({ olivera: ['Cap Pla d’Implementació de hui'], plantilla: ['reflex: sense rebut de document.mjs context'] });
  const r = preTool(p, { root: ROOT, portes: f });
  assert.equal(r.decision, 'deny');
  assert.match(r.reason, /Porta Olivera · _wiki_de_poble\/04_escriptori\/260930_1200_prompt_claude_prova\.md/);
  assert.match(r.reason, /Cap Pla d’Implementació de hui/);
  assert.match(r.reason, /\[Plantilla viva\] reflex: sense rebut/);
  assert.match(r.reason, /AGENTS §0\.1/);
  assert.match(r.reason, /document\.mjs context → create/);
});

test('prompt que passa les dues portes → allow', () => {
  const p = crida('write_to_file', { TargetFile: alTaulell('260930_1200_prompt_claude_prova.md'), CodeContent: '---\n---\n' });
  const f = portes();
  assert.equal(preTool(p, { root: ROOT, portes: f }).decision, 'allow');
  assert.equal(f.crides.olivera, 1);
  assert.equal(f.crides.plantilla, 1);
});

test('un pla només passa per la Plantilla viva: Olivera jutja petorretes', () => {
  const p = crida('write_to_file', { TargetFile: alTaulell('260930_1200_pla_implementacio_prova.md'), CodeContent: '---\n---\n' });
  const f = portes({ olivera: ['no s’hauria de consultar'] });
  assert.equal(preTool(p, { root: ROOT, portes: f }).decision, 'allow');
  assert.equal(f.crides.olivera, 0);
  assert.equal(f.crides.plantilla, 1);
});

test('fora del repositori (artefactes de l’IDE), subcarpetes i documents no vigilats → allow', () => {
  const fora = crida('write_to_file', { TargetFile: path.join(os.homedir(), '.gemini/antigravity/brain/x/implementation_plan.md'), CodeContent: 'x' });
  assert.equal(calenPortes('pre-tool', fora, ROOT), null);
  assert.equal(preTool(fora, { root: ROOT }).decision, 'allow');
  const lab = crida('write_to_file', { TargetFile: alTaulell('02_investigacio_ia/260930_1200_prompt_x.md'), CodeContent: 'x' });
  assert.equal(calenPortes('pre-tool', lab, ROOT), null);
  assert.equal(preTool(lab, { root: ROOT }).decision, 'allow');
  const index = crida('replace_file_content', { TargetFile: alTaulell('00_index_escriptori.md'), TargetContent: 'a', ReplacementContent: 'b' });
  const f = portes();
  assert.equal(preTool(index, { root: ROOT, portes: f }).decision, 'allow');
  assert.equal(f.crides.operacio.length, 0, 'un document no vigilat no es reconstruïx');
});

test('zona humana i peces del mateix hook → force_ask', () => {
  const produccio = crida('write_to_file', { TargetFile: alTaulell('01_produccio/pagina.html'), CodeContent: 'x' });
  assert.equal(preTool(produccio, { root: ROOT }).decision, 'force_ask');
  for (const rel of ['.agents/hooks.json', 'tooling/gates/antigravity-hook.mjs', INTERRUPTOR]) {
    const r = preTool(crida('write_to_file', { TargetFile: path.join(ROOT, rel), CodeContent: '' }), { root: ROOT });
    assert.equal(r.decision, 'force_ask', rel);
  }
  assert.equal(preTool(crida('run_command', { CommandLine: `touch ${INTERRUPTOR}` }), { root: ROOT }).decision, 'force_ask');
});

test('mv que toca l’Escriptori → force_ask amb la via canònica; la resta de shell → allow', () => {
  for (const CommandLine of [
    `mv ${DESK}/260929_2346_prompt_x.md _wiki_de_poble/90_arxiu_historic/`,
    `git mv ${DESK}/a.md ${DESK}/b.md`,
    `cd ${DESK} && mv a.md b.md`
  ]) {
    const r = preTool(crida('run_command', { CommandLine }), { root: ROOT });
    assert.equal(r.decision, 'force_ask', CommandLine);
    assert.match(r.reason, /--arxiva/);
  }
  assert.equal(preTool(crida('run_command', { CommandLine: 'mv a.md b.md', Cwd: path.join(ROOT, DESK) }), { root: ROOT }).decision, 'force_ask');
  assert.equal(preTool(crida('run_command', { CommandLine: `ls ${DESK}` }), { root: ROOT }).decision, 'allow');
  assert.equal(preTool(crida('run_command', { CommandLine: 'mv src/a.js src/b.js' }), { root: ROOT }).decision, 'allow');
  assert.equal(preTool(crida('run_command', { CommandLine: 'node tooling/gates/porta-olivera.mjs --arxiva --sec' }), { root: ROOT }).decision, 'allow');
});

test('redirecció de shell a un document del primer nivell → force_ask; a /dev/null → allow', () => {
  const r = preTool(crida('run_command', { CommandLine: `cat <<'EOF' > "${DESK}/260930_1200_prompt_x.md"` }), { root: ROOT });
  assert.equal(r.decision, 'force_ask');
  assert.match(r.reason, /document\.mjs context → create/);
  assert.equal(preTool(crida('run_command', { CommandLine: 'npm test > /dev/null 2>&1' }), { root: ROOT }).decision, 'allow');
});

test('payload incomplet → ask, mai allow', () => {
  assert.equal(preTool({}, { root: ROOT }).decision, 'ask');
  assert.equal(preTool({ toolCall: {} }, { root: ROOT }).decision, 'ask');
  assert.equal(preTool(crida('run_command', {}), { root: ROOT }).decision, 'ask');
  assert.equal(preTool(crida('write_to_file', { CodeContent: 'x' }), { root: ROOT }).decision, 'ask');
});

test('portes absents quan calen → llança, i perError ho convertix en ask', () => {
  const p = crida('write_to_file', { TargetFile: alTaulell('260930_1200_prompt_x.md'), CodeContent: 'x' });
  assert.throws(() => preTool(p, { root: ROOT }), /portes no carregades/);
  assert.equal(perError('pre-tool', new Error('boom')).decision, 'ask');
  assert.match(perError('pre-invocation', new Error('boom')).injectSteps[0].ephemeralMessage, /no s'ha pogut comprovar/);
});

test('edició per trossos: es lleven StartLine/EndLine sense AllowMultiple, i es conserven amb AllowMultiple', () => {
  const args = {
    TargetFile: alTaulell('260930_1200_prompt_x.md'),
    ReplacementChunks: [
      { StartLine: 3, EndLine: 5, TargetContent: 'a', ReplacementContent: 'b' },
      { StartLine: 7, EndLine: 9, TargetContent: 'c', ReplacementContent: 'd', AllowMultiple: true }
    ]
  };
  const nets = sensePosicions(args);
  assert.deepEqual(nets.ReplacementChunks[0], { TargetContent: 'a', ReplacementContent: 'b' });
  assert.equal(nets.ReplacementChunks[1].StartLine, 7);
  assert.equal(args.ReplacementChunks[0].StartLine, 3, 'no muta els arguments de l’IDE');
  const f = portes();
  preTool(crida('multi_replace_file_content', args), { root: ROOT, portes: f });
  assert.deepEqual(f.crides.operacio[0].toolArgs.ReplacementChunks[0], { TargetContent: 'a', ReplacementContent: 'b' });
  assert.equal(f.crides.operacio[0].cwd, ROOT);
});

test('document que no es pot reconstruir → ask amb el motiu de la porta documental', () => {
  const p = crida('replace_file_content', { TargetFile: alTaulell('260930_1200_prompt_x.md'), TargetContent: 'a', ReplacementContent: 'b' });
  const f = portes({ operacio: () => { throw new Error('Edició absent o ambigua; no es pot reconstruir'); } });
  const r = preTool(p, { root: ROOT, portes: f });
  assert.equal(r.decision, 'ask');
  assert.match(r.reason, /ambigua/);
});

test('PreInvocation: taula bruta → missatge efímer curt; taula neta → {}', () => {
  const brut = preInvocation({ portes: portes({ taula: { valid: false, errors: ['Sense àncora a l’índex: 250101_1200_prompt_vell.md'] } }) });
  const msg = brut.injectSteps[0].ephemeralMessage;
  assert.match(msg, /AGENTS §0\.1/);
  assert.match(msg, /observa .* → actua .* → verifica .* → informa/);
  assert.match(msg, /250101_1200_prompt_vell\.md/);
  assert.ok(msg.length < 800, 'efímer vol dir curt');
  assert.deepEqual(preInvocation({ portes: portes() }), {});
  assert.throws(() => preInvocation({ portes: portes({ taula: null }) }), /il·legible/);
});

/** Memòria falsa del briefing: recorda les claus que ja ha vist. */
function memoria() {
  const vistes = [];
  return { vistes, primera: (clau) => { if (vistes.includes(clau)) return false; vistes.push(clau); return true; } };
}
const HERETATS = Object.freeze({ dia: '261006', documents: ['261006_0224_prompt_claude_ledger.md', '261005_1303_prompt_opus_local.md', '261005_1303_pla_implementacio_opus.md'], artefactes: 0 });

test('[261006 t6] PreInvocation: taula neta amb vius declarats → briefing una vegada per conversa i jornada', () => {
  const m = memoria();
  const f = { ...portes(), heretats: () => HERETATS };
  const p = { invocationNum: 1, initialNumSteps: 1, conversationId: 'conv-a' };
  const r = preInvocation({ portes: f, payload: p, primera: m.primera });
  const msg = r.injectSteps[0].ephemeralMessage;
  assert.ok(msg.startsWith(MARCA_BRIEFING), msg);
  assert.match(msg, /AGENTS §0\.1 · primera crida de la conversa\]/);
  assert.match(msg, /verd no vol dir consumit/);
  assert.match(msg, /3 document\(s\) continuen declarats vius a «## Activitat en curs», 2 d'abans de hui \(261005_1303_pla_implementacio_opus, 261005_1303_prompt_opus_local, 261006_0224_prompt_claude_ledger\)/,
    'tots els declarats vius, els més antics primer, i quants són d’abans de hui');
  assert.doesNotMatch(msg, /prompt_opus_local\.md/, 'els noms van sense .md, com els admet --nom');
  assert.match(msg, /core-higiene-escriptori, pas 0/);
  assert.match(msg, /es queda declarat i ho dius al Mestre \(qui i per a què\)/);
  assert.match(msg, /node tooling\/gates\/porta-olivera\.mjs --arxiva --sec --nom NOM/);
  assert.match(msg, /ni mv, ni rm, ni scripts sobre l'índex/);
  assert.doesNotMatch(msg, /sense esperar l'ordre/, 'el briefing no empeny a actuar fora de les vies');
  assert.doesNotMatch(msg, /al costat de l'àncora/, '--arxiva deixaria el motiu solt a l’índex');
  assert.ok(msg.length < 1100, `efímer curt: ${msg.length}`);
  assert.deepEqual(m.vistes, ['conv-a:261006']);
  assert.deepEqual(preInvocation({ portes: f, payload: { ...p, invocationNum: 2 }, primera: m.primera }), {}, 'la segona crida de la mateixa conversa i jornada calla');
  assert.ok(preInvocation({ portes: f, payload: { conversationId: 'conv-b' }, primera: m.primera }).injectSteps, 'una altra conversa el rep');
  assert.ok(preInvocation({ portes: { ...f, heretats: () => ({ ...HERETATS, dia: '261007' }) }, payload: p, primera: m.primera }).injectSteps, 'una jornada nova el torna a dir');
  assert.deepEqual(m.vistes, ['conv-a:261006', 'conv-b:261006', 'conv-a:261007']);
});

test('[261006 t6] PreInvocation: sense heretats, sense memòria o amb la taula bruta → cap briefing', () => {
  let crides = 0;
  const primera = () => { crides++; return true; };
  assert.deepEqual(preInvocation({ portes: { ...portes(), heretats: () => ({ dia: '261006', documents: [], artefactes: 0 }) }, primera }), {});
  assert.equal(crides, 0, 'sense res a dir no es gasta la memòria');
  assert.deepEqual(preInvocation({ portes: { ...portes(), heretats: () => HERETATS } }), {}, 'sense memòria no hi ha briefing: es repetiria a cada crida');
  assert.deepEqual(preInvocation({ portes: portes(), primera }), {}, 'portes sense heretats: el comportament d’abans');
  const brut = preInvocation({
    portes: { ...portes({ taula: { valid: false, errors: ['Sense àncora a l’índex: x.md'] } }), heretats: () => { throw new Error('no s’ha de calcular'); } },
    primera
  });
  assert.match(brut.injectSteps[0].ephemeralMessage, /^\[Escriptori brut/);
  assert.equal(crides, 0, 'la taula bruta mana i no consumix el briefing');
  assert.deepEqual(preInvocation({ portes: { ...portes(), heretats: () => HERETATS }, primera: () => false }), {});
  assert.throws(() => preInvocation({ portes: { ...portes(), heretats: () => null }, primera }), /heretats ha tornat un resultat il·legible/);
});

test('[261006 t6] text del briefing: artefactes sols, ordre, retall de noms, unió i clau de memòria', () => {
  const claus = [];
  const primera = (clau) => { claus.push(clau); return true; };
  const briefing = (h, payload = null) => preInvocation({ portes: { ...portes(), heretats: () => ({ dia: '261006', ...h }) }, payload, primera });
  assert.deepEqual(briefing({ documents: [], artefactes: 0 }), {});
  const art = briefing({ documents: [], artefactes: 90 }).injectSteps[0].ephemeralMessage;
  assert.ok(art.startsWith(MARCA_BRIEFING));
  assert.match(art, /90 artefacte\(s\) d'abans de hui continuen al primer nivell/);
  assert.doesNotMatch(art, /document\(s\)/);
  const molts = Array.from({ length: 9 }, (_, i) => `26100${9 - i}_0900_prompt_${9 - i}.md`);
  const m = briefing({ documents: molts, artefactes: 2 }, { conversationId: 'abc' }).injectSteps[0].ephemeralMessage;
  assert.match(m, /9 document\(s\) continuen declarats vius a «## Activitat en curs», 5 d'abans de hui \(261001_0900_prompt_1, /, 'ordenats per data encara que l’índex els porte desordenats');
  assert.match(m, /261006_0900_prompt_6 \+3\)/);
  assert.doesNotMatch(m, /prompt_7/);
  assert.match(m, /, i 2 artefacte\(s\)/);
  assert.ok(m.length < 1100, `efímer curt: ${m.length}`);
  const hui = briefing({ documents: ['261006_0224_prompt_claude_ledger.md'], artefactes: 0 }).injectSteps[0].ephemeralMessage;
  assert.match(hui, /1 document\(s\) continuen declarats vius a «## Activitat en curs» \(261006_0224_prompt_claude_ledger\)/, 'sense cap d’abans de hui no se’n diu cap recompte');
  assert.deepEqual(claus, ['sense-conversa:261006', 'abc:261006', 'sense-conversa:261006'], 'la clau és la conversa i la jornada; sense conversa, «sense-conversa»');
});

test('[261006 t6] el cas del 5-10: dotze declarats vius, sis d’abans de hui i sis de la marató de la mateixa nit', () => {
  // Llista literal de l'informe de la porta al transcript 62fa5929 (pas 14, 09:39:11Z).
  const vius = ['261004_2045_pla_implementacio_marato_excelencia', '261004_2119_auditoria_adversarial_claude_codex',
    '261004_2230_pla_implementacio_equip_claude_codex', '261004_2230_prompt_equip_claude_codex', '261004_2240_auditoria_codex',
    '261004_2245_auditoria_claude', '261005_0335_pla_implementacio_avaluacio', '261005_0335_prompt_avaluacio',
    '261005_0345_avaluacio_final_marato', '261005_0345_tasques_pendents_consola_visual', '261005_0410_prompt_tancament_codex',
    '261005_0432_auditoria_codex'].map((n) => `${n}.md`);
  const r = preInvocation({ portes: { ...portes(), heretats: () => ({ dia: '261005', documents: vius, artefactes: 0 }) }, payload: { conversationId: '62fa5929' }, primera: () => true });
  const msg = r.injectSteps[0].ephemeralMessage;
  assert.match(msg, /12 document\(s\) continuen declarats vius a «## Activitat en curs», 6 d'abans de hui \(261004_2045_pla_implementacio_marato_excelencia, /);
  assert.match(msg, /261004_2245_auditoria_claude \+6\)/, 'els sis de la marató de la mateixa nit també hi són, comptats');
  assert.ok(msg.length < 1100, `efímer curt: ${msg.length}`);
});

test('[261006 t6] briefing: els noms que la porta no deixa eixir per nom (BUNDLE, PROMPT i ABSENTS de crear_bundle) no reben l’ordre --nom', () => {
  const briefing = (h) => preInvocation({ portes: { ...portes(), heretats: () => ({ dia: '261005', ...h }) }, payload: { conversationId: '62fa5929' }, primera: () => true }).injectSteps[0].ephemeralMessage;
  // Els tres fitxers que scratch_anchor.mjs va declarar vius el 5-10 (transcript 62fa5929:78). La porta del
  // 0055 només deixa eixir per nom la part termodinàmica en minúscules (NOM_ARTEFACTE): «--nom …BUNDLE_null»
  // responia «no és cap document solt» (transcript 62fa5929:131).
  const nulls = ['261005_1154_PROMPT_null.md', '261005_1154_ABSENTS_null.json', '261005_1154_BUNDLE_null.md'];
  const sols = briefing({ documents: nulls, artefactes: 0 });
  assert.match(sols, /3 no pot\(en\) eixir per nom \(majúscules o nom no termodinàmic; ANC-06: 261005_1154_ABSENTS_null\.json, 261005_1154_BUNDLE_null, 261005_1154_PROMPT_null\): per a eixos, pregunta al Mestre\./);
  assert.doesNotMatch(sols, /--nom/, 'cap ordre --nom que la porta rebutjaria sempre');
  assert.match(sols, /si no, pregunta al Mestre, perquè la porta no els deixa eixir per nom\./);
  assert.match(sols, /ni mv, ni rm, ni scripts sobre l'índex/);
  // El 5-10 sencer després de scratch_anchor: els dotze de l'informe i els tres fitxers *_null.
  const dotze = ['261004_2045_pla_implementacio_marato_excelencia', '261004_2119_auditoria_adversarial_claude_codex',
    '261004_2230_pla_implementacio_equip_claude_codex', '261004_2230_prompt_equip_claude_codex', '261004_2240_auditoria_codex',
    '261004_2245_auditoria_claude', '261005_0335_pla_implementacio_avaluacio', '261005_0335_prompt_avaluacio',
    '261005_0345_avaluacio_final_marato', '261005_0345_tasques_pendents_consola_visual', '261005_0410_prompt_tancament_codex',
    '261005_0432_auditoria_codex'].map((n) => `${n}.md`);
  const mixt = briefing({ documents: [...dotze, ...nulls], artefactes: 0 });
  assert.match(mixt, /15 document\(s\) continuen declarats vius a «## Activitat en curs», 6 d'abans de hui \(/);
  assert.match(mixt, /\. 3 no pot\(en\) eixir per nom \(majúscules o nom no termodinàmic; ANC-06: 261005_1154_ABSENTS_null\.json, /);
  assert.match(mixt, /si no, node tooling\/gates\/porta-olivera\.mjs --arxiva --sec --nom NOM/, 'els altres sí que reben l’ordre');
  // Artefactes no declarats: el host diu quants no poden eixir per nom.
  const art = briefing({ documents: [], artefactes: 2, artefactesSenseNom: 1 });
  assert.match(art, /2 artefacte\(s\) d'abans de hui continuen al primer nivell\. 1 no pot\(en\) eixir per nom \(majúscules o nom no termodinàmic; ANC-06\): per a eixos, pregunta al Mestre\./);
  assert.match(art, /--arxiva --sec --nom NOM/);
  assert.doesNotMatch(briefing({ documents: [], artefactes: 1, artefactesSenseNom: 1 }), /--nom/);
  assert.doesNotMatch(briefing({ documents: dotze, artefactes: 0 }), /no pot\(en\) eixir per nom/, 'sense noms rebutjats, cap frase de més');
  for (const m of [sols, mixt, art]) assert.ok(m.length < 1100, `efímer curt: ${m.length}`);
});

/* ── Guarda de l'índex i de l'arxiu ───────────────────────────────────────── */

/** Arrel de prova amb l'Escriptori i l'índex: la guarda resol rutes i llig scripts reals. */
function arrelGuarda(t) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-guarda-index-')));
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), '# Índex\n');
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}

test('[261006 t6] guarda de l’índex: heretoc, sed -i, perl -i i tee sobre l’índex → force_ask; lectures, git i la porta → allow', (t) => {
  const arrel = arrelGuarda(t);
  const idx = `${DESK}/00_index_escriptori.md`;
  // El scratch_clean.mjs del 5-10 (transcript 62fa5929), escurçat.
  const heretoc = `cat << 'EOF' > scratch_clean.mjs\nimport fs from 'fs';\nconst indexPath = '${idx}';\nlet content = fs.readFileSync(indexPath, 'utf-8');\nfs.writeFileSync(indexPath, content);\nEOF\nnode scratch_clean.mjs`;
  for (const [CommandLine, Cwd] of [
    [heretoc],
    [`sed -i '' '/261002_0026_prompt_codex_claude/d' ${idx}`],
    ["sed -i '' 's/261001_1000_/261001_0400_/g' 00_index_escriptori.md", path.join(arrel, DESK)],
    [`sed -E -i '' 's/a/b/' ${idx}`],
  ]) {
    const r = preTool(crida('run_command', Cwd ? { CommandLine, Cwd } : { CommandLine }), { root: arrel });
    assert.equal(r.decision, 'force_ask', CommandLine);
    assert.match(r.reason, /índex de l'Escriptori per shell o per un script ad hoc/, CommandLine);
    assert.match(r.reason, /pregunta al Mestre/);
  }
  for (const CommandLine of [`perl -pi -e 's/a/b/' ${idx}`, `echo x | tee -a ${idx}`]) {
    assert.equal(preTool(crida('run_command', { CommandLine }), { root: arrel }).decision, 'force_ask', CommandLine);
  }
  for (const CommandLine of [
    `cat ${idx} | grep 1303`,
    `git add ${idx}`,
    `git diff ${idx}`,
    `grep -c 'Activitat en curs' ${idx} > /tmp/sdp-n.txt`,
    'node tooling/gates/porta-olivera.mjs --arxiva --nom 261005_1155_prompt_fable.md',
    'npm run olivera:arxiva',
    "sed -n '1,20p' README.md",
  ]) {
    assert.equal(preTool(crida('run_command', { CommandLine }), { root: arrel }).decision, 'allow', CommandLine);
  }
});

test('[261006 t6] guarda de l’índex: un script ad hoc que el nomena i escriu → force_ask; versionat o que només llig → allow', (t) => {
  const arrel = arrelGuarda(t);
  const escriu = `const fs = require('fs');\nconst f = '${DESK}/00_index_escriptori.md';\nfs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('a', 'b'));\n`;
  fs.writeFileSync(path.join(arrel, 'update_index.cjs'), escriu);
  fs.mkdirSync(path.join(arrel, 'scratch'));
  fs.writeFileSync(path.join(arrel, 'scratch/llig.mjs'), `import fs from 'fs';\nconsole.log(fs.readFileSync('${DESK}/00_index_escriptori.md', 'utf8'));\n`);
  fs.writeFileSync(path.join(arrel, 'scratch/fix.py'), `p = '${DESK}/00_index_escriptori.md'\nwith open(p, 'w') as f:\n    f.write('x')\n`);
  for (const dir of ['tooling/brain', 'tests']) fs.mkdirSync(path.join(arrel, dir), { recursive: true });
  fs.writeFileSync(path.join(arrel, 'tooling/brain/x.mjs'), escriu);
  fs.writeFileSync(path.join(arrel, 'tests/x.test.mjs'), escriu);
  const fora = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-guarda-fora-')));
  t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fora, 'fix.js'), escriu);

  const decidix = (CommandLine) => preTool(crida('run_command', { CommandLine }), { root: arrel });
  const a = decidix('node update_index.cjs');
  assert.equal(a.decision, 'force_ask');
  assert.match(a.reason, /Script: update_index\.cjs\./);
  assert.equal(decidix('python3 scratch/fix.py').decision, 'force_ask');
  const b = decidix(`node ${path.join(fora, 'fix.js')}`);
  assert.equal(b.decision, 'force_ask', 'un script de la carpeta de l’IDE, fora del repositori, també');
  assert.match(b.reason, /fix\.js/);
  for (const CommandLine of ['node scratch/llig.mjs', 'node tooling/brain/x.mjs', 'node --test tests/x.test.mjs', 'node no-existix.mjs', "node -e 'console.log(1)'"]) {
    assert.equal(decidix(CommandLine).decision, 'allow', CommandLine);
  }
});

test('[261006 t6] guarda de l’índex: un script ad hoc cridat amb el camí absolut d’una arrel amb espais (entre cometes o amb «\\ ») → force_ask', (t) => {
  // L'arrel real és «…/Som de Poble/socdepoble.org» i MarIA hi escriu camins absoluts entre cometes
  // dobles (transcript 62fa5929:1180-1208). Partit pels espais, el camí deixava una cometa oberta i passava.
  const fora = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-guarda-espais-')));
  t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  const arrel = path.join(fora, 'Som de Poble', 'socdepoble.org');
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), '# Índex\n');
  const escriu = `import fs from 'fs';\nconst indexPath = '${DESK}/00_index_escriptori.md';\nfs.writeFileSync(indexPath, fs.readFileSync(indexPath, 'utf8'));\n`;
  fs.writeFileSync(path.join(arrel, 'scratch_clean.mjs'), escriu);
  fs.mkdirSync(path.join(arrel, 'scratch'));
  fs.writeFileSync(path.join(arrel, 'scratch/llig.mjs'), `import fs from 'fs';\nconsole.log(fs.readFileSync('${DESK}/00_index_escriptori.md', 'utf8'));\n`);
  fs.mkdirSync(path.join(arrel, 'tooling/brain'), { recursive: true });
  fs.writeFileSync(path.join(arrel, 'tooling/brain/x.mjs'), escriu);
  const script = path.join(arrel, 'scratch_clean.mjs');
  assert.match(script, / de Poble\//, 'la prova necessita un camí amb espais');
  const decidix = (args) => preTool(crida('run_command', args), { root: arrel });
  for (const CommandLine of [
    `node "${script}"`,
    `node '${script}'`,
    `node ${script.replaceAll(' ', '\\ ')}`,
    `node "${script}" && node tooling/gates/porta-olivera.mjs`,
  ]) {
    const r = decidix({ CommandLine });
    assert.equal(r.decision, 'force_ask', CommandLine);
    assert.match(r.reason, /Script: scratch_clean\.mjs\./, CommandLine);
  }
  assert.equal(decidix({ CommandLine: 'node scratch_clean.mjs', Cwd: arrel }).decision, 'force_ask', 'Cwd amb espais i camí relatiu');
  for (const CommandLine of [
    `node "${path.join(arrel, 'scratch/llig.mjs')}"`,
    `node "${path.join(arrel, 'tooling/brain/x.mjs')}"`,
    `node "${path.join(arrel, 'no-existix.mjs')}"`,
  ]) {
    assert.equal(decidix({ CommandLine }).decision, 'allow', CommandLine);
  }
});

test('[261006 t6] [DEFECTE] escapaments coneguts de la guarda d’scripts ad hoc: un cd dins de la mateixa ordre i un script de shell amb sed -i', (t) => {
  // Deute confirmat i declarat (LLEGIU §5): estes proves passen perquè reproduïxen l'escapament.
  const arrel = arrelGuarda(t);
  const escriu = `import fs from 'fs';\nconst indexPath = '${DESK}/00_index_escriptori.md';\nfs.writeFileSync(indexPath, fs.readFileSync(indexPath, 'utf8'));\n`;
  fs.writeFileSync(path.join(arrel, 'scratch_clean.mjs'), escriu);
  fs.mkdirSync(path.join(arrel, 'scratch'));
  fs.writeFileSync(path.join(arrel, 'scratch/neteja.sh'), `sed -i '' '/prompt_vell/d' ${DESK}/00_index_escriptori.md\n`);
  const decidix = (CommandLine) => preTool(crida('run_command', { CommandLine }), { root: arrel });
  // El camí es resol contra Cwd, no contra el cd previ: «../scratch_clean.mjs» des de l'arrel ix del repositori i no existix.
  assert.equal(decidix('cd scratch && node ../scratch_clean.mjs').decision, 'allow');
  // API_ESCRIPTURA no mira sed: un script de shell que fa sed -i sobre l'índex no es reconeix com a escriptura.
  assert.equal(decidix('sh scratch/neteja.sh').decision, 'allow');
  // Les mateixes escriptures dites a l'ordre, o amb el camí resolt des de Cwd, sí que pregunten.
  assert.equal(decidix(`sed -i '' '/prompt_vell/d' ${DESK}/00_index_escriptori.md`).decision, 'force_ask');
  assert.equal(decidix('node scratch_clean.mjs').decision, 'force_ask');
});

test('[261006 t6] esborrar o moure dins de 90_arxiu_historic → force_ask amb AGENTS §5; llegir-lo → allow', (t) => {
  const arrel = arrelGuarda(t);
  fs.mkdirSync(path.join(arrel, '_wiki_de_poble/90_arxiu_historic'), { recursive: true });
  const decidix = (args) => preTool(crida('run_command', args), { root: arrel });
  // El rm -f del 5-10 (transcript 62fa5929) sobre tres fitxers que acabaven d'arribar a l'arxiu.
  const r = decidix({ CommandLine: 'rm -f _wiki_de_poble/90_arxiu_historic/261005_1154_BUNDLE_null.md' });
  assert.equal(r.decision, 'force_ask');
  assert.match(r.reason, /AGENTS §5/);
  assert.equal(decidix({ CommandLine: 'rm x.md', Cwd: path.join(arrel, '_wiki_de_poble/90_arxiu_historic') }).decision, 'force_ask');
  const mv = decidix({ CommandLine: `mv ${DESK}/260929_2346_prompt_x.md _wiki_de_poble/90_arxiu_historic/` });
  assert.equal(mv.decision, 'force_ask');
  assert.match(mv.reason, /--arxiva/, 'un trasllat des de l’Escriptori continua portant la via canònica');
  assert.equal(decidix({ CommandLine: 'ls _wiki_de_poble/90_arxiu_historic' }).decision, 'allow');
});

/* ── Procés real contra un Mas de prova ───────────────────────────────────── */

function mas(t) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-antigravity-hook-'));
  fs.mkdirSync(path.join(arrel, '.agents/runtime'), { recursive: true });
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  // Marcador d'arrel: les portes reals validen SDP_ARREL contra .agents/AGENTS.md.
  fs.writeFileSync(path.join(arrel, '.agents/AGENTS.md'), '# BIOS de prova\n');
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), '# Índex\n');
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}

function executa(arrel, mode, entrada) {
  const r = spawnSync(process.execPath, [SCRIPT, mode], {
    cwd: arrel, env: { ...process.env, SDP_ARREL: arrel },
    input: typeof entrada === 'string' ? entrada : JSON.stringify(entrada), encoding: 'utf8', timeout: 20000
  });
  assert.equal(r.status, 0, `el hook ix sempre amb 0 i decidix per stdout (stderr: ${r.stderr})`);
  const linies = r.stdout.trim().split('\n');
  assert.equal(linies.length, 1, `una sola línia JSON per stdout: ${r.stdout}`);
  return JSON.parse(linies[0]);
}

const traces = (arrel) => {
  const f = path.join(arrel, TRACA);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
};

test('procés: interruptor d’apagada → allow sense comprovar ni traçar', (t) => {
  const arrel = mas(t);
  fs.writeFileSync(path.join(arrel, INTERRUPTOR), '');
  const r = executa(arrel, 'pre-tool', crida('run_command', { CommandLine: `mv ${DESK}/a.md ${DESK}/b.md` }));
  assert.deepEqual(r, { decision: 'allow' });
  assert.deepEqual(executa(arrel, 'pre-invocation', { invocationNum: 1 }), {});
  assert.deepEqual(traces(arrel), []);
});

test('procés: eixida JSON per stdout i una línia de traça per invocació', (t) => {
  const arrel = mas(t);
  assert.deepEqual(executa(arrel, 'pre-tool', crida('view_file', { AbsolutePath: path.join(arrel, 'README.md') })), { decision: 'allow' });
  assert.equal(executa(arrel, 'pre-tool', crida('run_command', { CommandLine: `mv ${DESK}/a.md x.md` })).decision, 'force_ask');
  const l = traces(arrel);
  assert.equal(l.length, 2);
  assert.equal(l[0].mode, 'pre-tool');
  assert.equal(l[0].eina, 'view_file');
  assert.equal(l[0].decisio, 'allow');
  assert.equal(l[1].decisio, 'force_ask');
});

test('procés: payload il·legible, buit o mode desconegut → ask', (t) => {
  const arrel = mas(t);
  assert.equal(executa(arrel, 'pre-tool', '{').decision, 'ask');
  assert.equal(executa(arrel, 'pre-tool', '').decision, 'ask');
  assert.equal(executa(arrel, 'post-tool', crida('view_file', {})).decision, 'ask');
});

test('procés: un prompt escrit de memòria al primer nivell → deny amb la Plantilla viva', (t) => {
  const arrel = mas(t);
  const p = crida('write_to_file', { TargetFile: path.join(arrel, DESK, `${avui()}_1200_prompt_claude_prova.md`), CodeContent: '# Prompt sense plantilla\n' });
  const r = executa(arrel, 'pre-tool', p);
  assert.equal(r.decision, 'deny', r.reason);
  assert.match(r.reason, /\[Plantilla viva\]/);
  assert.match(r.reason, /secció 0/);
});

test('procés: PreInvocation injecta amb la taula bruta i calla amb la neta', (t) => {
  const arrel = mas(t);
  assert.deepEqual(executa(arrel, 'pre-invocation', { invocationNum: 1, initialNumSteps: 10 }), {});
  fs.writeFileSync(path.join(arrel, DESK, '250101_1200_prompt_vell.md'), '# vell\n');
  const r = executa(arrel, 'pre-invocation', { invocationNum: 2, initialNumSteps: 10 });
  assert.match(r.injectSteps[0].ephemeralMessage, /AGENTS §0\.1/);
  assert.match(r.injectSteps[0].ephemeralMessage, /250101_1200_prompt_vell\.md/);
});

test('[261006 t6] procés: la taula bruta deixa el motiu a la traça', (t) => {
  const arrel = mas(t);
  fs.writeFileSync(path.join(arrel, DESK, '250101_1200_prompt_vell.md'), '# vell\n');
  executa(arrel, 'pre-invocation', { invocationNum: 1, conversationId: 'conv-brut' });
  const [l] = traces(arrel);
  assert.equal(l.decisio, 'injecta');
  assert.match(l.motiu, /^\[Escriptori brut · AGENTS §0\.1\]/);
  assert.match(l.motiu, /250101_1200_prompt_vell\.md/);
  assert.equal(fs.existsSync(path.join(arrel, BRIEFINGS)), false, 'la taula bruta no gasta el briefing');
});

test('[261006 t6] procés: briefing real amb la porta instal·lada, una vegada per conversa i jornada', (t) => {
  const arrel = mas(t);
  const vell = '250101_1200_prompt_vell';
  fs.writeFileSync(path.join(arrel, DESK, `${vell}.md`), '# vell\n');
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), `# Índex\n\n## Activitat en curs\n\n- [[${vell}]]\n`);
  const a = executa(arrel, 'pre-invocation', { invocationNum: 1, initialNumSteps: 1, conversationId: 'conv-real' });
  assert.ok(a.injectSteps[0].ephemeralMessage.startsWith(MARCA_BRIEFING), JSON.stringify(a));
  assert.match(a.injectSteps[0].ephemeralMessage, /1 document\(s\) continuen declarats vius a «## Activitat en curs», 1 d'abans de hui \(250101_1200_prompt_vell\)/);
  assert.deepEqual(executa(arrel, 'pre-invocation', { invocationNum: 2, conversationId: 'conv-real' }), {});
  assert.ok(executa(arrel, 'pre-invocation', { invocationNum: 1, conversationId: 'conv-altra' }).injectSteps);
  const l = traces(arrel);
  assert.deepEqual(l.map((x) => x.decisio), ['briefing', 'res', 'briefing']);
  assert.match(l[0].motiu, /^\[Briefing de taula/);
  assert.equal(l[1].motiu, undefined);
  const memoria = fs.readFileSync(path.join(arrel, BRIEFINGS), 'utf8').trim().split('\n').map((x) => JSON.parse(x).clau);
  assert.deepEqual(memoria, [`conv-real:${avui()}`, `conv-altra:${avui()}`]);
  // Arxivat el document, la taula queda neta i sense heretats: cap briefing nou.
  fs.renameSync(path.join(arrel, DESK, `${vell}.md`), path.join(arrel, `${vell}.md`));
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), '# Índex\n');
  assert.deepEqual(executa(arrel, 'pre-invocation', { invocationNum: 1, conversationId: 'conv-tercera' }), {});
});

test('[261006 t6] procés: els vius de hui també hi entren, un .md en majúscules declarat viu és document i un artefacte d’abans de hui ancorat compta', (t) => {
  const arrel = mas(t);
  const hui = `${avui()}_0900_prompt_hui`;
  const bundle = '250101_1154_BUNDLE_null.md';
  const captura = '250101_1200_produccio_captura.png';
  const absents = '250101_1154_ABSENTS_null.json';
  fs.writeFileSync(path.join(arrel, DESK, `${hui}.md`), '# hui\n');
  fs.writeFileSync(path.join(arrel, DESK, bundle), '# bundle\n');
  fs.writeFileSync(path.join(arrel, DESK, captura), 'png');
  fs.writeFileSync(path.join(arrel, DESK, absents), '[]\n');
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), `# Índex\n\n## Activitat en curs\n\n- [[${hui}]]\n- [[${bundle}]]\n\n## Recursos\n\n- [[${captura}]]\n- [[${absents}]]\n`);
  const r = executa(arrel, 'pre-invocation', { invocationNum: 1, conversationId: 'conv-artefacte' });
  const msg = r.injectSteps[0].ephemeralMessage;
  assert.ok(msg.startsWith(MARCA_BRIEFING), msg);
  assert.match(msg, new RegExp(`2 document\\(s\\) continuen declarats vius a «## Activitat en curs», 1 d'abans de hui \\(250101_1154_BUNDLE_null, ${hui}\\)`));
  assert.match(msg, /, i 2 artefacte\(s\) d'abans de hui continuen al primer nivell/, 'la captura i l’ABSENTS no són declarats vius: compten com a artefactes');
  // El BUNDLE declarat i l'ABSENTS no declarat no ixen per nom: es diuen a banda; la resta conserva l'ordre --nom.
  assert.match(msg, /\. 2 no pot\(en\) eixir per nom \(majúscules o nom no termodinàmic; ANC-06: 250101_1154_BUNDLE_null\): per a eixos, pregunta al Mestre\./);
  assert.match(msg, /--arxiva --sec --nom NOM/);
  // Sense res declarat ni artefactes, res a dir: ni briefing ni memòria gastada.
  for (const f of [`${hui}.md`, bundle, captura, absents]) fs.renameSync(path.join(arrel, DESK, f), path.join(arrel, f));
  fs.writeFileSync(path.join(arrel, DESK, '00_index_escriptori.md'), '# Índex\n');
  assert.deepEqual(executa(arrel, 'pre-invocation', { invocationNum: 1, conversationId: 'conv-buida' }), {});
  const memoria = fs.readFileSync(path.join(arrel, BRIEFINGS), 'utf8').trim().split('\n').map((x) => JSON.parse(x).clau);
  assert.deepEqual(memoria, [`conv-artefacte:${avui()}`]);
});

/* ── Esquema de .agents/hooks.json ────────────────────────────────────────── */

test('.agents/hooks.json: format documentat, sense Stop, i ordres que fan cd .. cap a scripts existents', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(REPO, '.agents/hooks.json'), 'utf8'));
  assert.ok(hooks && typeof hooks === 'object' && !Array.isArray(hooks), 'objecte de hooks amb nom');
  const AGRUPATS = new Set(['PreToolUse', 'PostToolUse']);
  const PLANS = new Set(['PreInvocation', 'PostInvocation']);
  const MODE_PER_ESDEVENIMENT = { PreToolUse: 'pre-tool', PreInvocation: 'pre-invocation' };
  const vistos = new Set();
  for (const [nom, spec] of Object.entries(hooks)) {
    assert.ok(spec && typeof spec === 'object' && !Array.isArray(spec), `${nom}: cada clau de primer nivell és un hook amb nom`);
    assert.ok(!Object.hasOwn(spec, 'Stop'), `${nom}: Stop queda fora (un continue mal comptat és un bucle)`);
    for (const [clau, valor] of Object.entries(spec)) {
      if (clau === 'enabled') { assert.equal(typeof valor, 'boolean'); continue; }
      assert.ok(AGRUPATS.has(clau) || PLANS.has(clau), `${nom}.${clau}: esdeveniment no documentat`);
      assert.ok(Array.isArray(valor) && valor.length, `${nom}.${clau}: llista no buida`);
      const handlers = AGRUPATS.has(clau)
        ? valor.flatMap((g) => {
          assert.equal(typeof g.matcher, 'string', `${nom}.${clau}: cada grup porta matcher`);
          assert.ok(Array.isArray(g.hooks) && g.hooks.length, `${nom}.${clau}: cada grup porta hooks`);
          return g.hooks;
        })
        : valor.map((h) => {
          assert.ok(!Object.hasOwn(h, 'matcher') && !Object.hasOwn(h, 'hooks'), `${nom}.${clau}: esdeveniment pla, sense grups`);
          return h;
        });
      for (const h of handlers) {
        assert.equal(h.type ?? 'command', 'command');
        assert.equal(typeof h.command, 'string');
        assert.ok(h.command.startsWith('cd .. && node '), `${nom}.${clau}: el directori de treball és .agents/, cal cd .. (${h.command})`);
        const m = /^cd \.\. && node (\S+\.mjs)(?: (\S+))?$/.exec(h.command);
        assert.ok(m, `${nom}.${clau}: ordre amb forma inesperada (${h.command})`);
        assert.ok(fs.existsSync(path.join(REPO, m[1])), `${m[1]} ha d'existir`);
        if (m[1] === 'tooling/gates/antigravity-hook.mjs') {
          assert.ok(MODES.includes(m[2]), `mode conegut: ${m[2]}`);
          assert.equal(m[2], MODE_PER_ESDEVENIMENT[clau], `${clau} crida el mode ${MODE_PER_ESDEVENIMENT[clau]}`);
        }
        assert.ok(Number.isInteger(h.timeout) && h.timeout > 0 && h.timeout <= 30, `${nom}.${clau}: timeout en segons`);
        vistos.add(clau);
      }
    }
  }
  assert.ok(vistos.has('PreToolUse') && vistos.has('PreInvocation'), 'PreToolUse i PreInvocation declarats');
});
