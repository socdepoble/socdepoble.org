// DESTÍ: tests/mapa-consola.test.mjs (substituïx el fitxer sencer; s'executa amb node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { recullMapa, recullFonts, llegeixPlist, compteLlicons, mencionsDeSkills, hooksGit, errorRecent } from '../tooling/brain/mapa-consola.mjs';
import { SOURCES } from '../tooling/brain/context-local.mjs';
import { normalitzaMapa } from '../src/sections/consola/mapa/mapaContent.js';

const ARA = Date.parse('2026-09-24T12:00:00Z');

function escriu(arrel, rel, text) {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), text);
}

/** Un Mas fictici amb una skill carregada per CLAUDE.md i una d'orfe. */
function mas() {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa-'));
  escriu(arrel, 'CLAUDE.md', '@.agents/skills/sdp-workflow/SKILL.md\n\nREFLEX\n');
  escriu(arrel, '.agents/skills/sdp-workflow/SKILL.md', '---\ntype: skill\nstatus: canonic\ndescription: Workflow principal de treball.\nname: sdp-workflow\n---\n# W\nCrida wiki-orfe i wiki-inexistent; no .sdp-reflex.\n\n## Lliçons del Mestre\n\n- una\n- dues\n');
  escriu(arrel, '.agents/skills/wiki-orfe/SKILL.md', '---\ntype: skill\nstatus: canonic\ndescription: Una skill que ningú crida.\nname: wiki-orfe\n---\n# O\n');
  escriu(arrel, '.agents/skills_index.json', JSON.stringify({ core: [{ name: 'sdp-workflow', triggers_on: ['workflow'] }], plugins: {} }));
  escriu(arrel, 'tooling/wiki/schema.json', JSON.stringify({
    type: 'object', additionalProperties: false, required: ['type', 'status', 'description'],
    properties: { type: { type: 'string' }, status: { type: 'string' }, description: { type: 'string' }, name: { type: 'string' } }
  }));
  escriu(arrel, 'package.json', JSON.stringify({ scripts: { 'porta:x': 'node tooling/gates/x.mjs' } }));
  escriu(arrel, '.claude/settings.json', JSON.stringify({ hooks: { PreToolUse: [{ hooks: [{ command: 'node tooling/gates/hooks-local.mjs' }] }] } }));
  escriu(arrel, 'tooling/gates/hooks-local.mjs', '');
  return arrel;
}

test('compila un mapa que compleix el contracte de la interfície', () => {
  const arrel = mas();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  const mapa = recullMapa(arrel, { home, plataforma: 'linux', ara: ARA });
  assert.doesNotThrow(() => normalitzaMapa(mapa));
  assert.equal(mapa.tall, null, 'fora de git no hi ha tall');
  const aresta = (de, a) => mapa.arestes.find((x) => x.de === de && x.a === a);
  assert.equal(aresta('document:CLAUDE.md', 'skill:sdp-workflow').confianca, 'declarat');
  assert.equal(aresta('hook:claude:PreToolUse', 'script:tooling/gates/hooks-local.mjs').confianca, 'derivat');
  assert.equal(aresta('skill:sdp-workflow', 'skill:wiki-orfe').confianca, 'inferit');
  const avisos = (node) => mapa.avisos.filter((a) => a.node === node).map((a) => a.codi).sort();
  assert.deepEqual(avisos('skill:wiki-orfe'), ['fora-index', 'orfe']);
  assert.ok(avisos('skill:sdp-workflow').includes('crida-inexistent'));
  assert.deepEqual(avisos('script:tooling/gates/x.mjs'), ['script-absent']);
  assert.ok(mapa.avisos.some((a) => a.codi === 'font-absent' && a.node === 'document:.agents/protocolledge.json'));
  assert.equal(mapa.nodes.find((n) => n.id === 'skill:sdp-workflow').atributs.llicons, 2);
});

test('llig els llançadors de launchd del Mas i pinta mort el que apunta a un script absent', () => {
  const arrel = mas();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  escriu(home, 'Library/LaunchAgents/com.socdepoble.reflex_daemon.plist', `<?xml version="1.0"?>
<plist version="1.0"><dict>
  <key>Label</key><string>com.socdepoble.reflex_daemon</string>
  <key>ProgramArguments</key><array><string>/usr/local/bin/node</string><string>${arrel}/tooling/wiki/core/reflex_daemon.mjs</string></array>
  <key>KeepAlive</key><true/>
</dict></plist>`);
  escriu(home, 'Library/LaunchAgents/com.altra.cosa.plist', '<plist><dict><key>Label</key><string>com.altra.cosa</string></dict></plist>');
  const mapa = recullMapa(arrel, { home, plataforma: 'darwin', ara: ARA });
  assert.deepEqual(mapa.tasques.map((t) => [t.id, t.estat]), [['launchd:com.socdepoble.reflex_daemon', 'mort']]);
  assert.equal(mapa.tasques[0].script, 'tooling/wiki/core/reflex_daemon.mjs');
});

/* Un plist en bucle de KeepAlive acaba el registre amb «Node.js v24…», no amb
   la línia d'error: cal mirar la cua. I un error de fa dies a cron.err amb
   cron.out fresc és història: Plaquetes no s'ha de pintar mort per això. */
test('la traça d’error només compta si l’ha escrita l’última execució', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logs-'));
  const errors = path.join(dir, 'cron.err');
  const eixida = path.join(dir, 'cron.out');
  fs.writeFileSync(errors, 'node:internal/modules/cjs/loader:1228\n  throw err;\nError: Cannot find module x\n    at a\n    at b\n\nNode.js v24.13.0\n');
  assert.equal(errorRecent({ errors, eixida: null }), true, 'sense registre d’eixida, l’error és l’últim que se sap');
  assert.equal(errorRecent({ errors, eixida: errors }), true, 'mateix fitxer per a tot: mana la cua');
  fs.writeFileSync(eixida, 'ok\n');
  const vell = new Date(Date.now() - 3600 * 1000);
  fs.utimesSync(errors, vell, vell);
  assert.equal(errorRecent({ errors, eixida }), false, 'eixida més recent que l’error: història, no estat');
  assert.equal(errorRecent({ errors: path.join(dir, 'no.err'), eixida }), false);
  assert.equal(errorRecent({ errors: null, eixida }), false);
});

test('hooks de git: viu si el hook cita l’script, mort si no; sense core.hooksPath, git no els veu', () => {
  const arrel = mas();
  escriu(arrel, '.husky/pre-commit', 'node tooling/gates/frontissa-contingut.mjs || exit 1\nexec node tooling/gates/git-staged.mjs\n');
  escriu(arrel, 'tooling/gates/frontissa-contingut.mjs', '');
  escriu(arrel, '.agents/cron/registre_tasques.json', JSON.stringify({ tasques: [
    { id: 'frontissa-contingut', script: 'tooling/gates/frontissa-contingut.mjs', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' } },
    { id: 'porta-oblidada', script: 'tooling/gates/hooks-local.mjs', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' } },
    { id: 'post', script: 'tooling/gates/hooks-local.mjs', llancador: { tipus: 'git-hook', esdeveniment: 'post-commit' } }
  ] }));
  // Fora de git no hi ha font: cap judici.
  assert.equal(hooksGit(arrel), null);
  execFileSync('git', ['-C', arrel, 'init', '-q']);
  // Amb git però sense core.hooksPath: el hook existix però git no l'executa.
  const absents = [];
  assert.deepEqual(hooksGit(arrel, { absents }), { 'pre-commit': '' });
  assert.equal(absents.length, 1);
  assert.equal(absents[0].ruta, '.husky/_');
  execFileSync('git', ['-C', arrel, 'config', 'core.hooksPath', '.husky/_']);
  assert.equal(hooksGit(arrel)['pre-commit'].includes('frontissa-contingut'), true);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  const mapa = recullMapa(arrel, { home, plataforma: 'linux', ara: ARA });
  const estat = Object.fromEntries(mapa.tasques.map((t) => [t.id, t.estat]));
  assert.equal(estat['frontissa-contingut'], 'viu');
  assert.equal(estat['porta-oblidada'], 'mort');
  assert.equal(estat.post, 'desconegut', '.husky/post-commit no existix: no es jutja');
  assert.ok(mapa.arestes.some((a) => a.de === 'hook:git:pre-commit' && a.a === 'tasca:frontissa-contingut' && a.tipus === 'dispara'));
  assert.doesNotThrow(() => normalitzaMapa(mapa));
});

test('peces de lectura: plist, lliçons i mencions', () => {
  const p = llegeixPlist('<key>Label</key><string>org.x</string><key>StartInterval</key><integer>3600</integer><key>RunAtLoad</key><true/>');
  assert.deepEqual([p.etiqueta, p.interval, p.enArrencar, p.keepAlive], ['org.x', 3600, true, false]);
  assert.equal(compteLlicons('# X\n## Lliçons del Mestre\n- a\n- b\n## Vincles\n- c\n'), 2);
  assert.equal(compteLlicons('# X\n'), 0);
  assert.deepEqual(mencionsDeSkills('usa core-context-panic i `wiki-cicle-de-vida`; no .sdp-reflex ni wiki-integrity.yml'),
    ['core-context-panic', 'wiki-cicle-de-vida']);
  // Una skill absorbida citada a l'Historial és història, no una crida.
  assert.deepEqual(mencionsDeSkills('# X\n\n## Historial\n\n> absorbix `core-safe-restore`\n\n## Àmbit\n\ncrida sdp-workflow\n'), ['sdp-workflow']);
  assert.deepEqual(mencionsDeSkills('# X\n\ncrida sdp-workflow\n\n## Historial\n\nabsorbix core-safe-restore\n'), ['sdp-workflow']);
});

/* ── T10 · Codex: la mateixa configuració que .codex/hooks.json del Mas ── */
const HOOKS_CODEX = { hooks: {
  SessionStart: [{ hooks: [
    { type: 'command', command: 'node "$(git rev-parse --show-toplevel)/tooling/brain/context-local.mjs"', timeout: 10, additionalContextLimit: 0 },
    { type: 'command', command: 'node "$(git rev-parse --show-toplevel)/tooling/brain/despertar.mjs"', timeout: 10 }
  ] }],
  PreToolUse: [{ hooks: [{ type: 'command', command: 'node "$(git rev-parse --show-toplevel)/tooling/gates/hooks-local.mjs"', timeout: 10 }] }],
  PostToolUse: [{ hooks: [{ type: 'command', command: 'cd "$(git rev-parse --show-toplevel)" && node tooling/gates/segell-auto.mjs', timeout: 10 }] }]
} };

test('Codex: .codex/hooks.json i AGENTS.md fan l’arnés, i la càrrega d’arrencada ix de les SOURCES reals', () => {
  const arrel = mas();
  escriu(arrel, 'AGENTS.md', '# BIOS\n');
  escriu(arrel, '.codex/hooks.json', JSON.stringify(HOOKS_CODEX));
  for (const script of ['tooling/brain/context-local.mjs', 'tooling/brain/despertar.mjs', 'tooling/gates/segell-auto.mjs']) escriu(arrel, script, '');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  const fonts = recullFonts(arrel, { home, plataforma: 'linux', ara: ARA });
  assert.deepEqual(fonts.hooksCodex, HOOKS_CODEX);
  assert.equal(fonts.agentsMd, true);
  assert.deepEqual(fonts.contextArrencada, { script: 'tooling/brain/context-local.mjs', fonts: [...SOURCES] });
  assert.ok(fonts.contextArrencada.fonts.includes('.agents/BOOTSTRAP.md'));
  assert.ok(!fonts.absents.some((a) => a.ruta === '.codex/hooks.json'));

  const mapa = recullMapa(arrel, { home, plataforma: 'linux', ara: ARA });
  assert.doesNotThrow(() => normalitzaMapa(mapa));
  const aresta = (de, a, tipus) => mapa.arestes.find((x) => x.de === de && x.a === a && x.tipus === tipus);
  assert.ok(mapa.nodes.some((n) => n.id === 'agent:codex'));
  assert.deepEqual(mapa.nodes.filter((n) => n.id.startsWith('hook:codex:')).map((n) => n.id).sort(),
    ['hook:codex:PostToolUse', 'hook:codex:PreToolUse', 'hook:codex:SessionStart']);
  assert.equal(aresta('agent:codex', 'document:AGENTS.md', 'carrega')?.confianca, 'declarat');
  // Prova les SOURCES reals: BOOTSTRAP no el nomena cap fixture, només context-local.mjs.
  assert.equal(aresta('script:tooling/brain/context-local.mjs', 'document:.agents/BOOTSTRAP.md', 'carrega')?.confianca, 'derivat');
  assert.ok(!mapa.arestes.some((x) => x.de === 'script:tooling/brain/despertar.mjs' && x.tipus === 'carrega'),
    'despertar.mjs no exporta les seues fonts: no es modela');
});

test('sense .codex/hooks.json: font absent i cap arnés Codex; sense AGENTS.md ni script, cap càrrega', () => {
  const arrel = mas();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  const fonts = recullFonts(arrel, { home, plataforma: 'linux', ara: ARA });
  assert.equal(fonts.hooksCodex, null);
  assert.equal(fonts.agentsMd, false);
  assert.equal(fonts.contextArrencada, null, 'l’script no és a l’arrel llegida: no carrega res');
  assert.ok(fonts.absents.some((a) => a.ruta === '.codex/hooks.json' && a.motiu === 'absent'));
  const mapa = recullMapa(arrel, { home, plataforma: 'linux', ara: ARA });
  assert.ok(mapa.avisos.some((a) => a.codi === 'font-absent' && a.node === 'document:.codex/hooks.json'));
  assert.ok(!mapa.nodes.some((n) => n.id === 'agent:codex'));
  assert.doesNotThrow(() => normalitzaMapa(mapa));
});

/* ── T12 · Fonts de vigilància: la forma del contracte, exacta ── */
const claus = (objecte) => Object.keys(objecte).sort();
const esTextONull = (v) => v === null || typeof v === 'string';

function comprovaContracte({ torns, escriptori, ledger, estat }) {
  assert.ok(Array.isArray(torns));
  for (const t of torns) {
    assert.deepEqual(claus(t), ['actor', 'ambPla', 'createdAt', 'expiresAt', 'id', 'rebuts', 'scope', 'state']);
    assert.equal(typeof t.id, 'string');
    for (const camp of ['actor', 'scope', 'state', 'createdAt', 'expiresAt']) assert.ok(esTextONull(t[camp]), camp);
    assert.ok(Number.isInteger(t.rebuts) && t.rebuts >= 0);
    assert.equal(typeof t.ambPla, 'boolean');
  }
  assert.deepEqual(claus(escriptori), ['documents', 'limitSafata', 'safata']);
  assert.equal(escriptori.limitSafata, 20);
  assert.ok(Number.isInteger(escriptori.safata) && escriptori.safata >= 0);
  for (const d of escriptori.documents) {
    assert.deepEqual(claus(d), ['ambRebut', 'ancorat', 'nom']);
    assert.equal(typeof d.nom, 'string');
    assert.equal(typeof d.ancorat, 'boolean');
    assert.equal(typeof d.ambRebut, 'boolean');
  }
  assert.deepEqual(claus(ledger), ['entrades', 'fossils', 'malformades', 'peusHistorics', 'valid']);
  assert.equal(typeof ledger.valid, 'boolean');
  assert.ok(Number.isInteger(ledger.fossils) && Number.isInteger(ledger.malformades) && Number.isInteger(ledger.peusHistorics));
  for (const e of ledger.entrades) {
    assert.deepEqual(claus(e), ['data', 'resum', 'skill', 'tipus']);
    assert.match(e.data, /^\d{6}$/);
  }
  assert.deepEqual(claus(estat), ['bytes', 'data']);
  assert.ok(esTextONull(estat.data));
  assert.ok(Number.isInteger(estat.bytes));
}

test('fonts de vigilància: torns, Escriptori, LEDGER i ESTAT arriben amb la forma del contracte', () => {
  const arrel = mas();
  const desk = '_wiki_de_poble/04_escriptori';
  escriu(arrel, '.agents/runtime/turns/torn_a.json', JSON.stringify({
    schema: 'sdp.turn.v1', turn_id: 'torn_a', actor: 'claude', scope: 'code', state: 'planned',
    createdAt: '2026-09-24T10:00:00.000Z', expiresAt: '2026-09-25T10:00:00.000Z',
    receipts: { r: { id: 'r', file: `${desk}/260924_1000_pla_implementacio_x.md` } }, plan: { file: `${desk}/260924_1000_pla_implementacio_x.md`, hash: 'h' }, history: []
  }));
  escriu(arrel, `${desk}/00_index_escriptori.md`, '# Índex\n\n- [[260924_1000_pla_implementacio_x]]\n');
  escriu(arrel, `${desk}/260924_1000_pla_implementacio_x.md`, '# Pla\n');
  escriu(arrel, `${desk}/260924_1001_prompt_orfe.md`, '# Prompt\n');
  const cos = '# LEDGER\n\n260924 | torn | claude | pla vinculat\n260924 | recaiguda | core-higiene-escriptori | safata bruta';
  escriu(arrel, '.agents/LEDGER.md', `${cos}\n\n<!-- HASH: ${crypto.createHash('sha256').update(cos).digest('hex')} -->`);
  escriu(arrel, '.agents/ESTAT.md', '# ESTAT\n\n## ESTAT_ACTUAL · 2026-09-24 11:30 · Claude · Relleu\n');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  const fonts = recullFonts(arrel, { home, plataforma: 'linux', ara: ARA });
  comprovaContracte(fonts);
  assert.deepEqual(fonts.torns.map((t) => [t.id, t.rebuts, t.ambPla]), [['torn_a', 1, true]]);
  assert.deepEqual(fonts.escriptori.documents, [
    { nom: '260924_1000_pla_implementacio_x.md', ancorat: true, ambRebut: true },
    { nom: '260924_1001_prompt_orfe.md', ancorat: false, ambRebut: false }
  ]);
  assert.equal(fonts.ledger.valid, true);
  assert.deepEqual(fonts.ledger.entrades.map((e) => e.tipus), ['torn', 'recaiguda']);
  assert.equal(Date.parse(fonts.estat.data), new Date(2026, 8, 24, 11, 30).getTime());
  assert.doesNotThrow(() => normalitzaMapa(recullMapa(arrel, { home, plataforma: 'linux', ara: ARA })));
});

test('fonts de vigilància absents: null, i no s’afigen a les fonts absents obligatòries', () => {
  const arrel = mas();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  const fonts = recullFonts(arrel, { home, plataforma: 'linux', ara: ARA });
  assert.deepEqual([fonts.torns, fonts.escriptori, fonts.ledger, fonts.estat], [null, null, null, null]);
  assert.ok(!fonts.absents.some((a) => /runtime\/turns|04_escriptori|LEDGER|ESTAT/.test(a.ruta)));
  assert.doesNotThrow(() => normalitzaMapa(recullMapa(arrel, { home, plataforma: 'linux', ara: ARA })));
});

/* ── 261006 (prompt 261006_0224, T1) · El Mapa no compta els peus històrics com a fòssils ── */
test('LEDGER 261006: els peus intercalats arriben com a peus històrics i les mètriques del Mapa no els compten', () => {
  const peu = (c) => `<!-- HASH: ${c.repeat(64)} -->`;
  const valorDe = (mapa, nom) => mapa.salut.find((m) => m.metrica === nom)?.valor;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
  const amb = (cos) => {
    const arrel = mas();
    escriu(arrel, '.agents/LEDGER.md', `${cos}\n\n<!-- HASH: ${crypto.createHash('sha256').update(cos).digest('hex')} -->`);
    return { fonts: recullFonts(arrel, { home, plataforma: 'linux', ara: ARA }), mapa: recullMapa(arrel, { home, plataforma: 'linux', ara: ARA }) };
  };
  const net = amb(['# LEDGER', '', '260924 | torn | claude | a', '', peu('a'), '', '260924 | torn | claude | b', '', peu('b'), '', '260924 | torn | claude | c'].join('\n'));
  assert.deepEqual([net.fonts.ledger.valid, net.fonts.ledger.peusHistorics, net.fonts.ledger.fossils, net.fonts.ledger.malformades], [true, 2, 0, 0]);
  assert.equal(valorDe(net.mapa, 'ledger-fossils'), 0, 'dos peus històrics no són cap segell per revisar');
  assert.equal(valorDe(net.mapa, 'ledger-mal-formades'), 0);
  assert.ok(!net.mapa.avisos.some((a) => a.codi === 'ledger-invalid'));
  assert.doesNotThrow(() => normalitzaMapa(net.mapa));
  // Un segell enganxat a prosa sí que és un fòssil, i el Mapa el compta.
  const brut = amb(['# LEDGER', '', '260924 | torn | claude | a', `- nota ${peu('a')}`, '260924 | torn | claude | b'].join('\n'));
  assert.deepEqual([brut.fonts.ledger.peusHistorics, brut.fonts.ledger.fossils], [1, 1]);
  assert.equal(valorDe(brut.mapa, 'ledger-fossils'), 1);
});
