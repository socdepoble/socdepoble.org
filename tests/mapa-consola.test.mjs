// DESTÍ: tests/mapa-consola.test.mjs (substituïx el fitxer sencer; s'executa amb node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { recullMapa, llegeixPlist, compteLlicons, mencionsDeSkills, hooksGit, errorRecent } from '../tooling/brain/mapa-consola.mjs';
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
