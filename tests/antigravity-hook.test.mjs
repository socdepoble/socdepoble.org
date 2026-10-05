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
