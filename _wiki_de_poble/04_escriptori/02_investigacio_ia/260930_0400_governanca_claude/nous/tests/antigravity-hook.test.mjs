/** Proves del hook d'Antigravity (tooling/gates/antigravity-hook.mjs) i de .agents/hooks.json.
 *
 *  Payload i eixida són els del contracte documentat de l'IDE 2.5.5
 *  (~/.gemini/antigravity-ide/builtin/skills/agy-customizations/docs/hooks.md):
 *  `{toolCall: {name, args}, stepIdx, conversationId, …}` per stdin i
 *  `{decision, reason}` o `{injectSteps}` per stdout. No el dialecte `toolArgs`
 *  que modelaven les proves antigues i que cap document de l'IDE descriu.
 *
 *  260930b (tooling-portes-1 a -5): per a l'IDE, `allow` AUTOAPROVA l'eina
 *  (hooks.md: «Automatically allow the tool execution») i `ask` torna la
 *  decisió al seu permís. Amb `matcher "*"`, l'`allow` per defecte feia del hook
 *  un aprovador universal. Ara `allow` només val per a les tres lectures que
 *  acredita la traça; la resta és `ask`, i l'interruptor d'apagada també. Els
 *  camins es comparen sense distingir caixa, perquè APFS no la distingix, i un
 *  document existent escrit amb una altra caixa del nom es jutja com el real. La
 *  traça no desa els secrets en línia de les ordres.
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
// Espai de noms, no imports amb nom: contra un hook sense una exportació nova, la
// bateria carrega igual i cada prova diu què falla.
import * as hook from '../tooling/gates/antigravity-hook.mjs';

const { preTool, preInvocation, calenPortes, sensePosicions, perError, DESK, INTERRUPTOR, TRACA, MODES } = hook;

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
const shell = (CommandLine, extra = {}) => preTool(crida('run_command', { CommandLine, ...extra }), { root: ROOT });

/**
 * Portes falses: registren què se'ls demana i tornen el que diu la prova. `reals`
 * fa de disc que no distingix caixa: la grafia de l'eina → el nom real del fitxer.
 */
function portes({ olivera = [], plantilla = [], taula = { valid: true, errors: [] }, operacio = null, existents = [], reals = {} } = {}) {
  const crides = { operacio: [], olivera: 0, plantilla: 0 };
  return {
    crides,
    esPetorreta: (rel) => /^_wiki_de_poble\/04_escriptori\/\d{6}_\d{4}_(?:prompt|macro_prompt|micro_prompt|petorreta)_[^/]+\.md$/.test(rel),
    vigilat: (nom) => /^\d{6}_\d{4}_(?:prompt|macro_prompt|micro_prompt|petorreta|pla)(?:_|\.md$)/.test(nom),
    existix: (rel) => existents.includes(rel),
    nomReal: (rel) => reals[rel] ?? (existents.includes(rel) ? path.posix.basename(rel) : null),
    enCataleg: (nom) => nom === '00_index_escriptori.md'
      || /^\d{6}_\d{4}_(?:prompt|petorreta|pla_implementacio|pla|auditoria|informe|acta)_[a-z0-9_]+\.md$/.test(nom),
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

test('run_command del payload documentat (npm test) → ask sense objecció i sense carregar portes', () => {
  const p = crida('run_command', { CommandLine: 'npm test' });
  assert.equal(calenPortes('pre-tool', p, ROOT), null);
  const r = preTool(p, { root: ROOT });
  assert.equal(r.decision, 'ask', 'allow autoaprovaria l’ordre sense passar pel permís de l’IDE');
  assert.match(r.reason, /cap objecció/);
});

test('lectures conegudes → allow; qualsevol altra eina que no escriu → ask', () => {
  assert.deepEqual([...hook.LECTURES].sort(), ['grep_search', 'list_dir', 'view_file']);
  for (const [nom, args] of [
    ['view_file', { AbsolutePath: alTaulell('260930_1200_prompt_prova.md') }],
    ['list_dir', { DirectoryPath: path.join(ROOT, DESK) }],
    ['grep_search', { Query: 'Olivera', SearchPath: ROOT }]
  ]) {
    const p = crida(nom, args);
    assert.equal(calenPortes('pre-tool', p, ROOT), null, nom);
    assert.deepEqual(preTool(p, { root: ROOT }), { decision: 'allow' }, nom);
  }
  for (const nom of ['manage_task', 'browser_subagent', 'eina_nova']) {
    assert.equal(preTool(crida(nom, {}), { root: ROOT }).decision, 'ask', nom);
  }
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

test('prompt que passa les dues portes → ask sense errors: allow només és per a lectures', () => {
  const p = crida('write_to_file', { TargetFile: alTaulell('260930_1200_prompt_claude_prova.md'), CodeContent: '---\n---\n' });
  const f = portes();
  const r = preTool(p, { root: ROOT, portes: f });
  assert.equal(r.decision, 'ask');
  assert.match(r.reason, /sense errors/);
  assert.equal(f.crides.olivera, 1);
  assert.equal(f.crides.plantilla, 1);
});

test('un pla només passa per la Plantilla viva: Olivera jutja petorretes', () => {
  const p = crida('write_to_file', { TargetFile: alTaulell('260930_1200_pla_implementacio_prova.md'), CodeContent: '---\n---\n' });
  const f = portes({ olivera: ['no s’hauria de consultar'] });
  assert.equal(preTool(p, { root: ROOT, portes: f }).decision, 'ask');
  assert.equal(f.crides.olivera, 0);
  assert.equal(f.crides.plantilla, 1);
});

test('fora del repositori, subcarpetes i documents no vigilats → ask, i res no es reconstruïx', () => {
  const fora = crida('write_to_file', { TargetFile: path.join(os.homedir(), '.zshrc'), CodeContent: 'x' });
  assert.equal(calenPortes('pre-tool', fora, ROOT), null);
  const r = preTool(fora, { root: ROOT });
  assert.equal(r.decision, 'ask', 'una escriptura fora del repo no s’autoaprova');
  assert.match(r.reason, /fora del repositori/);
  const lab = crida('write_to_file', { TargetFile: alTaulell('02_investigacio_ia/260930_1200_prompt_x.md'), CodeContent: 'x' });
  assert.equal(calenPortes('pre-tool', lab, ROOT), null);
  assert.equal(preTool(lab, { root: ROOT }).decision, 'ask');
  const index = crida('replace_file_content', { TargetFile: alTaulell('00_index_escriptori.md'), TargetContent: 'a', ReplacementContent: 'b' });
  const f = portes();
  const ri = preTool(index, { root: ROOT, portes: f });
  assert.equal(ri.decision, 'ask');
  assert.match(ri.reason, /cap objecció/);
  assert.equal(f.crides.operacio.length, 0, 'un document no vigilat no es reconstruïx');
});

test('zona humana i peces del mateix hook → ask, amb qualsevol caixa', () => {
  for (const rel of [`${DESK}/01_produccio/pagina.html`, '_wiki_de_poble/04_Escriptori/01_Produccio/pagina.html']) {
    const r = preTool(crida('write_to_file', { TargetFile: path.join(ROOT, rel), CodeContent: 'x' }), { root: ROOT });
    assert.equal(r.decision, 'ask', rel);
    assert.match(r.reason, /zona humana/, rel);
  }
  for (const rel of ['.agents/hooks.json', 'tooling/gates/antigravity-hook.mjs', INTERRUPTOR,
    '.AGENTS/HOOKS.JSON', 'Tooling/Gates/Antigravity-Hook.mjs', '.agents/runtime/Antigravity-Hook.off']) {
    const r = preTool(crida('write_to_file', { TargetFile: path.join(ROOT, rel), CodeContent: '' }), { root: ROOT });
    assert.equal(r.decision, 'ask', rel);
    assert.match(r.reason, /Mestre/, rel);
  }
});

test('un .md nou al primer nivell amb una categoria fora del catàleg → ask sense reconstruir; un existent o l’índex, no', () => {
  for (const nom of ['260930_0405_missatge_per_a_claude.md', 'notes_reunio.md', '260930_1200_Prompt_x.md']) {
    const p = crida('write_to_file', { TargetFile: alTaulell(nom), CodeContent: '# addendum\n' });
    assert.equal(calenPortes('pre-tool', p, ROOT), 'escriptura', nom);
    const f = portes();
    const r = preTool(p, { root: ROOT, portes: f });
    assert.equal(r.decision, 'ask', nom);
    assert.match(r.reason, /tooling\/wiki\/taxonomia\.json/, nom);
    assert.equal(f.crides.operacio.length, 0, `${nom}: no es reconstruïx`);
  }
  // Un document que ja hi és no naix ara: el nom ja el va jutjar la porta de taxonomia en el commit.
  const vell = `${DESK}/260930_0405_missatge_per_a_claude.md`;
  const edicio = preTool(crida('replace_file_content', { TargetFile: path.join(ROOT, vell), TargetContent: 'a', ReplacementContent: 'b' }), { root: ROOT, portes: portes({ existents: [vell] }) });
  assert.equal(edicio.decision, 'ask');
  assert.doesNotMatch(edicio.reason, /taxonomia/);
  const index = preTool(crida('write_to_file', { TargetFile: alTaulell('00_index_escriptori.md'), CodeContent: '# Índex\n' }), { root: ROOT, portes: portes() });
  assert.doesNotMatch(index.reason, /taxonomia/);
});

test('un camí de l’Escriptori amb una caixa no canònica → ask: les portes no el reconeixerien', () => {
  const p = crida('write_to_file', { TargetFile: path.join(ROOT, '_wiki_de_poble/04_Escriptori/260930_1200_prompt_x.md'), CodeContent: '# x\n' });
  assert.equal(calenPortes('pre-tool', p, ROOT), 'escriptura', 'APFS: és el mateix directori');
  const f = portes();
  const r = preTool(p, { root: ROOT, portes: f });
  assert.equal(r.decision, 'ask');
  assert.match(r.reason, /caixa/);
  assert.equal(f.crides.operacio.length, 0);
});

test('un document existent escrit amb una altra caixa del nom es jutja com el document real', () => {
  const real = `${DESK}/260930_1200_prompt_claude_prova.md`;
  const grafia = `${DESK}/260930_1200_PROMPT_Claude_Prova.md`;
  const p = crida('write_to_file', { TargetFile: path.join(ROOT, grafia), CodeContent: '# de memòria\n' });
  assert.equal(calenPortes('pre-tool', p, ROOT), 'escriptura');
  const f = portes({ olivera: ['Cap Pla d’Implementació de hui'], existents: [grafia, real], reals: { [grafia]: path.posix.basename(real) } });
  const r = preTool(p, { root: ROOT, portes: f });
  assert.equal(r.decision, 'deny', 'APFS escriu al fitxer real: les portes l’han de jutjar com a tal');
  assert.match(r.reason, /Porta Olivera · _wiki_de_poble\/04_escriptori\/260930_1200_prompt_claude_prova\.md/);
  assert.equal(f.crides.operacio[0].toolArgs.TargetFile, path.join(ROOT, real), 'es reconstruïx el document real');
  assert.equal(f.crides.olivera, 1);
  // Amb el nom real, res no canvia: el mateix camí arriba a la porta documental.
  const g = portes({ existents: [real] });
  preTool(crida('write_to_file', { TargetFile: path.join(ROOT, real), CodeContent: '---\n---\n' }), { root: ROOT, portes: g });
  assert.equal(g.crides.operacio[0].toolArgs.TargetFile, path.join(ROOT, real));
});

test('la traça emmascara els secrets en línia d’una ordre', () => {
  // Fixtures muntades per trossos: el codi font no ha de pareixer cap clau.
  const jwt = ['ey', 'J', 'a'.repeat(24), '.', 'b'.repeat(24), '.', 'c'.repeat(12)].join('');
  const supabase = ['sb', 'secret', 'x'.repeat(16)].join('_');
  const ordre = [
    'GITHUB_TOKEN=valor-secret-1 npm test',
    'curl -H "Authorization: Bearer tok-secret-2" https://usuari:clau-secreta-3@exemple.invalid/api',
    "psql --password='clau-secreta-4'",
    `echo ${jwt} ${supabase}`
  ].join(' && ');
  const net = hook.emmascara(ordre);
  for (const s of ['valor-secret-1', 'tok-secret-2', 'clau-secreta-3', 'clau-secreta-4', jwt, supabase]) assert.ok(!net.includes(s), s);
  assert.match(net, /^GITHUB_TOKEN=\*\*\* npm test && /, 'la resta de l’ordre es conserva');
  assert.match(net, /Bearer \*\*\*" https:\/\/usuari:\*\*\*@exemple\.invalid\/api/);
  assert.equal(hook.emmascara('npm test -- tests/porta-olivera-v3.test.mjs'), 'npm test -- tests/porta-olivera-v3.test.mjs');
});

test('trasllat, còpia o esborrat per shell que toca l’Escriptori → ask amb la via canònica', () => {
  for (const CommandLine of [
    `mv ${DESK}/260929_2346_prompt_x.md _wiki_de_poble/90_arxiu_historic/`,
    `git mv ${DESK}/a.md ${DESK}/b.md`,
    `cd ${DESK} && mv a.md b.md`,
    `cp /tmp/p.md ${DESK}/260930_1200_prompt_x.md`,
    `rm ${DESK}/260930_0320_prompt_claude.md`,
    `rsync -a ${DESK}/ /tmp/copia/`,
    `ditto ${DESK} /tmp/copia`,
    `/bin/mv ${DESK}/a.md /tmp/`,
    `\\mv ${DESK}/a.md /tmp/`,
    'mv _wiki_de_poble/04_Escriptori/a.md /tmp/'
  ]) {
    const r = shell(CommandLine);
    assert.equal(r.decision, 'ask', CommandLine);
    assert.match(r.reason, /--arxiva/, CommandLine);
  }
  const cwd = shell('mv a.md b.md', { Cwd: path.join(ROOT, DESK) });
  assert.match(cwd.reason, /--arxiva/);
});

test('la resta de shell → ask sense objecció, mai allow', () => {
  for (const CommandLine of [`ls ${DESK}`, 'mv src/a.js src/b.js', 'node tooling/gates/porta-olivera.mjs --arxiva --sec', 'npm install left-pad', 'git push --force']) {
    const r = shell(CommandLine);
    assert.equal(r.decision, 'ask', CommandLine);
    assert.match(r.reason, /cap objecció/, CommandLine);
  }
});

test('redirecció de shell a un document del primer nivell → ask, també amb >| i amb una altra caixa', () => {
  for (const CommandLine of [
    `cat <<'EOF' > "${DESK}/260930_1200_prompt_x.md"`,
    `echo x >| ${DESK}/260930_1200_prompt_x.md`,
    `printf x | tee -a ${DESK}/260930_1200_prompt_x.md`
  ]) {
    const r = shell(CommandLine);
    assert.equal(r.decision, 'ask', CommandLine);
    assert.match(r.reason, /document\.mjs context → create/, CommandLine);
  }
  assert.deepEqual(hook.redireccionsAlTaulell('echo x >| _wiki_de_poble/04_Escriptori/260930_1200_prompt_x.md', ROOT), ['_wiki_de_poble/04_Escriptori/260930_1200_prompt_x.md']);
  assert.match(shell('npm test > /dev/null 2>&1').reason, /cap objecció/);
});

test('zona humana per shell → ask, amb qualsevol caixa i també pel directori de treball', () => {
  for (const [CommandLine, extra] of [
    [`echo x > ${DESK}/01_produccio/pagina.html`, {}],
    ['cat _wiki_de_poble/04_escriptori/01_Produccio/x.html', {}],
    ['echo x > pagina.html', { Cwd: path.join(ROOT, DESK, '01_produccio') }]
  ]) {
    const r = shell(CommandLine, extra);
    assert.equal(r.decision, 'ask', CommandLine);
    assert.match(r.reason, /zona humana/, CommandLine);
  }
});

test('peces del hook per shell → ask, amb qualsevol caixa', () => {
  assert.match(shell(`touch ${INTERRUPTOR}`).reason, /interruptor/);
  assert.match(shell('touch .agents/runtime/ANTIGRAVITY-HOOK.OFF').reason, /interruptor/);
  for (const CommandLine of [
    "printf '{}' > .agents/hooks.json",
    "sed -i '' 's/pre-tool/x/' tooling/gates/antigravity-hook.mjs",
    'rm .AGENTS/HOOKS.JSON',
    'echo {} > .agents/runtime/turns/torn_x.json'
  ]) {
    const r = shell(CommandLine);
    assert.equal(r.decision, 'ask', CommandLine);
    assert.match(r.reason, /Mestre/, CommandLine);
  }
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

test('procés: interruptor d’apagada → ask, mai allow; no comprova res i deixa una traça «apagat»', (t) => {
  const arrel = mas(t);
  fs.writeFileSync(path.join(arrel, INTERRUPTOR), '');
  const r = executa(arrel, 'pre-tool', crida('run_command', { CommandLine: `mv ${DESK}/a.md ${DESK}/b.md` }));
  assert.equal(r.decision, 'ask', 'apagar el hook no pot obrir la porta');
  assert.match(r.reason, /apagat/);
  assert.doesNotMatch(r.reason, /--arxiva/, 'apagat vol dir sense comprovar');
  assert.deepEqual(executa(arrel, 'pre-invocation', { invocationNum: 1 }), {});
  assert.deepEqual(traces(arrel).map((l) => [l.mode, l.decisio]), [['pre-tool', 'apagat'], ['pre-invocation', 'apagat']]);
});

test('procés: eixida JSON per stdout i una línia de traça per invocació, amb l’ordre de shell', (t) => {
  const arrel = mas(t);
  assert.deepEqual(executa(arrel, 'pre-tool', crida('view_file', { AbsolutePath: path.join(arrel, 'README.md') })), { decision: 'allow' });
  assert.equal(executa(arrel, 'pre-tool', crida('run_command', { CommandLine: `mv ${DESK}/a.md x.md` })).decision, 'ask');
  const l = traces(arrel);
  assert.equal(l.length, 2);
  assert.equal(l[0].mode, 'pre-tool');
  assert.equal(l[0].eina, 'view_file');
  assert.equal(l[0].decisio, 'allow');
  assert.equal(l[1].decisio, 'ask');
  assert.equal(l[1].ordre, `mv ${DESK}/a.md x.md`, 'sense l’ordre, la traça no permet auditar què s’ha aprovat');
});

test('procés: la traça no desa els secrets en línia de l’ordre', (t) => {
  const arrel = mas(t);
  assert.equal(executa(arrel, 'pre-tool', crida('run_command', { CommandLine: 'GITHUB_TOKEN=valor-secret-1 npm test' })).decision, 'ask');
  const [l] = traces(arrel);
  assert.equal(l.ordre, 'GITHUB_TOKEN=*** npm test');
  assert.ok(!fs.readFileSync(path.join(arrel, TRACA), 'utf8').includes('valor-secret-1'), 'el secret no arriba al disc');
});

test('procés: un prompt existent escrit amb una altra caixa del nom → deny amb la Plantilla viva, si el disc no distingix caixa', (t) => {
  const arrel = mas(t);
  const real = path.join(arrel, DESK, `${avui()}_1200_prompt_claude_prova.md`);
  const grafia = path.join(arrel, DESK, `${avui()}_1200_PROMPT_claude_prova.md`);
  fs.writeFileSync(real, '# existent\n');
  if (!fs.existsSync(grafia)) return t.skip('este disc distingix caixa: la grafia és un fitxer nou i la jutja el catàleg');
  const r = executa(arrel, 'pre-tool', crida('write_to_file', { TargetFile: grafia, CodeContent: '# Prompt sense plantilla\n' }));
  assert.equal(r.decision, 'deny', r.reason);
  assert.match(r.reason, /\[Plantilla viva\]/);
  assert.match(r.reason, new RegExp(`${avui()}_1200_prompt_claude_prova\\.md`));
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

test('procés: un .md nou amb una categoria fora del catàleg real → ask', (t) => {
  const arrel = mas(t);
  const p = crida('write_to_file', { TargetFile: path.join(arrel, DESK, `${avui()}_0405_missatge_per_a_claude.md`), CodeContent: '# addendum\n' });
  const r = executa(arrel, 'pre-tool', p);
  assert.equal(r.decision, 'ask', r.reason);
  assert.match(r.reason, /«missatge»/);
});

test('procés: PreInvocation injecta amb la taula bruta, calla amb la neta i avisa si l’Escriptori no hi és', (t) => {
  const arrel = mas(t);
  assert.deepEqual(executa(arrel, 'pre-invocation', { invocationNum: 1, initialNumSteps: 10 }), {});
  fs.writeFileSync(path.join(arrel, DESK, '250101_1200_prompt_vell.md'), '# vell\n');
  const r = executa(arrel, 'pre-invocation', { invocationNum: 2, initialNumSteps: 10 });
  assert.match(r.injectSteps[0].ephemeralMessage, /AGENTS §0\.1/);
  assert.match(r.injectSteps[0].ephemeralMessage, /250101_1200_prompt_vell\.md/);
  fs.rmSync(path.join(arrel, DESK), { recursive: true });
  assert.match(executa(arrel, 'pre-invocation', { invocationNum: 3 }).injectSteps[0].ephemeralMessage, /Escriptori absent/);
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
