import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {contextLocal, SOURCES, MAX_BYTES} from '../tooling/brain/context-local.mjs';
import {checkLocal} from '../tooling/gates/hooks-local.mjs';
import {fixture, validDoc, writeDoc, REPO} from './helpers/documental.mjs';

function setup(t) {
  const root = fixture(t);
  for (const file of SOURCES) {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive:true});
    fs.copyFileSync(path.join(REPO, file), path.join(root, file));
  }
  return root;
}
const patch = (command, cwd) => ({hook_event_name:'PreToolUse', tool_name:'apply_patch', tool_input:{command}, cwd});

test('context conté els bytes íntegres i frescos de cada font, sense fitxers persistents', t => {
  const root = setup(t);
  const text = contextLocal(root);
  for (const file of SOURCES) assert.ok(text.includes(fs.readFileSync(path.join(root, file), 'utf8')));
  fs.appendFileSync(path.join(root, 'AGENTS.md'), '\nRegla nova de prova\n');
  assert.match(contextLocal(root), /Regla nova de prova/);
});
test('fonts buides, absents, excessives o symlinks externs fallen tancades', t => {
  const root = setup(t), file = path.join(root, 'AGENTS.md');
  fs.writeFileSync(file, ''); assert.throws(() => contextLocal(root), /buida/);
  fs.writeFileSync(file, 'x'.repeat(MAX_BYTES + 1)); assert.throws(() => contextLocal(root), /massa gran/);
  fs.unlinkSync(file); assert.throws(() => contextLocal(root));
  fs.symlinkSync(path.join(REPO, 'AGENTS.md'), file); assert.throws(() => contextLocal(root), /fora/);
  assert.equal(checkLocal({tool_name:'Bash',tool_input:{command:'pwd'}},root).code,2);
});
for (const host of ['claude','codex']) test(`${host}: dispara el SessionStart configurat des d’un subdirectori`, () => {
  const file = host === 'claude' ? '.claude/settings.json' : '.codex/hooks.json';
  const config = JSON.parse(fs.readFileSync(path.join(REPO,file),'utf8'));
  const hook = config.hooks.SessionStart.flatMap(group => group.hooks).find(h => h.command.includes('context-local.mjs'));
  const cwd = path.join(REPO,'tooling');
  const run = spawnSync('/bin/sh',['-c',hook.command], {cwd, env:{...process.env,CLAUDE_PROJECT_DIR:REPO},input:JSON.stringify({hook_event_name:'SessionStart',cwd,source:'startup'}),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const output = JSON.parse(run.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName,'SessionStart');
  for (const source of SOURCES) assert.ok(output.additionalContext.includes(fs.readFileSync(path.join(REPO,source),'utf8')));
  if (host === 'codex') assert.equal(hook.additionalContextLimit,0);
  assert.ok(config.hooks.PreToolUse.some(group => !group.matcher && group.hooks.some(h => h.command.includes('hooks-local.mjs'))));
});
test('Codex valida Add i Update sense executar ni escriure el pegat', t => {
  const root = setup(t), d = validDoc(root);
  const add = content => `*** Begin Patch\n*** Add File: ${d.file}\n${content.trimEnd().split('\n').map(line=>'+'+line).join('\n')}\n*** End Patch`;
  assert.equal(checkLocal(patch(add(d.content),root),root).code,0);
  assert.equal(fs.existsSync(path.join(root,d.file)),false);
  assert.equal(checkLocal(patch(add('Sense contracte'),root),root).code,2);
  writeDoc(root,d);
  const update = value => `*** Begin Patch\n*** Update File: ${d.file}\n@@\n-status: esborrany\n+status: ${value}\n*** End Patch`;
  assert.equal(checkLocal(patch(update('actiu'),root),root).code,0);
  assert.equal(checkLocal(patch(update('patata'),root),root).code,2);
  assert.equal(fs.readFileSync(path.join(root,d.file),'utf8'),d.content);
});
test('Codex comprova tots els fitxers i bloqueja moviments, producció i pegats ambigus',t=>{
  const root=setup(t),d=validDoc(root);writeDoc(root,d);
  const cases=[
    `*** Begin Patch\n*** Add File: src/test.js\n+ok\n*** Add File: ${d.file}nou.md\n+incorrecte\n*** End Patch`,
    `*** Begin Patch\n*** Delete File: ${d.file}\n*** End Patch`,
    `*** Begin Patch\n*** Update File: ${d.file}\n*** Move to: ${d.file}nou.md\n@@\n-x\n+y\n*** End Patch`,
    '*** Begin Patch\n*** Add File: _wiki_de_poble/04_escriptori/01_produccio/test.md\n+x\n*** End Patch',
    `*** Begin Patch\n*** Update File: ${d.file}\n@@\n-inexistent\n+text\n*** End Patch`
  ];
  for(const value of cases) assert.equal(checkLocal(patch(value,root),root).code,2);
  assert.equal(checkLocal(patch('*** Begin Patch\n*** Add File: src/test.js\n+ok\n*** End Patch',root),root).code,0);
});
test('Claude conserva validació de documents i shell de lectura no es bloqueja',t=>{
  const root=setup(t),d=validDoc(root);
  assert.equal(checkLocal({tool_name:'Write',tool_input:{file_path:d.file,content:d.content}},root).code,0);
  assert.equal(checkLocal({tool_name:'Write',tool_input:{file_path:d.file,content:'invàlid'}},root).code,2);
  assert.equal(checkLocal({tool_name:'Bash',tool_input:{command:'pwd'}},root).code,0);
});
test('CLI rebutja payload corrupte i indica context SEGUIT de create',()=>{
  const hook=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/hooks-local.mjs')],{input:'{',encoding:'utf8'});
  assert.equal(hook.status,2);
  const gate=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-reflex.mjs')],{input:'{}',encoding:'utf8'});
  assert.equal(gate.status,2);
  assert.match(gate.stderr,/document\.mjs context.*DESPRÉS:.*document\.mjs create/s);
});

for (const host of ['claude','codex']) test(`${host}: PreToolUse configurat permet lectura i bloqueja document sense rebut`,()=>{
  const file = host === 'claude' ? '.claude/settings.json' : '.codex/hooks.json';
  const config = JSON.parse(fs.readFileSync(path.join(REPO,file),'utf8'));
  const hook = config.hooks.PreToolUse.flatMap(group=>group.hooks).find(h=>h.command.includes('hooks-local.mjs'));
  const run = payload => spawnSync('/bin/sh',['-c',hook.command],{cwd:path.join(REPO,'tooling'),env:{...process.env,CLAUDE_PROJECT_DIR:REPO},input:JSON.stringify({hook_event_name:'PreToolUse',cwd:REPO,...payload}),encoding:'utf8'});
  const read=run({tool_name:'Bash',tool_input:{command:'pwd'}});
  assert.equal(read.status,0,read.stderr);
  assert.equal(JSON.parse(read.stdout).hookSpecificOutput.hookEventName,'PreToolUse');
  const bad=run(host==='claude' ? {tool_name:'Write',tool_input:{file_path:'_wiki_de_poble/04_escriptori/260923_1630_informe_prova.md',content:'sense rebut'}} : {tool_name:'apply_patch',tool_input:{command:'*** Begin Patch\n*** Add File: _wiki_de_poble/04_escriptori/260923_1630_informe_prova.md\n+sense rebut\n*** End Patch'}});
  assert.equal(bad.status,2,bad.stderr);
  assert.match(bad.stderr,/BLOQUEIG/);
});
