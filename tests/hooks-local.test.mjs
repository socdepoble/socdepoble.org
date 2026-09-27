import os from 'node:os';
import {knownRead, knownPureRead} from '../tooling/gates/mutation-policy.mjs';
import {checkPostTool} from '../tooling/gates/segell-auto.mjs';
import {verificaSegell} from '../tooling/gates/segella.mjs';
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

const shell = (root, command, tool_name = 'Bash') => ({tool_name, cwd:root, tool_input: tool_name === 'Bash' ? {command} : {cmd:command,workdir:root}});
const reads = ['ls', '/bin/ls -la src', 'ls "folder with spaces"', 'grep -Rn "knownRead" tooling', "grep -E 'a|b$' src/example.js", "grep -f patterns.txt --include='*.js' src", 'grep -- -pattern file.txt', "rg --no-config --files -g '*.mjs'", "rg -n 'a|b\\b' src", 'cat AGENTS.md', 'head -n 40 AGENTS.md', 'tail -20 AGENTS.md', 'wc -l AGENTS.md', 'pwd'];
const denied = ['ls; touch injected', 'ls && touch injected', 'ls | tee injected', 'ls > injected', 'ls 2> injected', 'ls $(touch injected)', 'ls `touch injected`', 'ls "$(touch injected)"', 'ls <(touch injected)', 'ls\ntouch injected', 'ls\u00a0src', 'ls\\;touch injected', 'ls *', 'ls # ignored', 'env ls', 'command ls', 'sh -c ls', 'node -e x', './ls', '/tmp/ls', 'rg --pre touch text', 'rg --pre=touch text', 'rg --pre-glob=*.txt text', 'rg --hostname-bin=touch text', 'rg --hyperlink-format=file text', 'rg -z text', 'rg --search-zip text', 'rg --output injected text', 'grep --invented text', 'cat --output injected', 'find . -exec touch injected ;', 'sed -i s/a/b/ file', 'ls "unfinished'];

test('lectures literals són comunes als tres dialectes de shell i al pre-hook', t => {
  const root = setup(t);
  for (const name of ['Bash','exec_command','run_command']) for (const command of reads) {
    const payload = shell(root, command, name);
    assert.equal(knownPureRead(payload, root), true, `${name}: ${command}`);
    assert.equal(checkLocal(payload, root).code, 0, `${name}: ${command}`);
  }
});
test('composició, executables i opcions capaces de llançar processos no obtenen lectura', t => {
  const root = setup(t);
  for (const command of denied) {
    const payload = shell(root, command);
    assert.equal(knownRead(payload, root), false, command);
    assert.equal(checkLocal(payload, root).code, 2, command);
  }
  assert.equal(fs.existsSync(path.join(root, 'injected')), false);
});
test('els noms heretats d’Object no són executables de lectura', t => {
  const root = setup(t);
  for (const command of ['constructor','toString','valueOf','__proto__','hasOwnProperty']) {
    assert.equal(knownPureRead(shell(root,command),root),false,command);
    assert.equal(checkLocal(shell(root,command),root).code,2,command);
  }
});
test('les cometes simples són literals; dobles, globbing i selectors no amplien autoritat', t => {
  const root = setup(t);
  for (const command of ["grep '$(touch injected)' file", "grep '`touch injected`' file", "grep 'a;b>c' file"]) assert.equal(knownRead(shell(root, command),root),true,command);
  for (const input of [{cmd:'ls',shell:'/tmp/sh'},{cmd:'ls',env:{RIPGREP_CONFIG_PATH:'config'}},{cmd:'ls',workdir:os.tmpdir()},{cmd:'ls',command:'touch injected'}]) {
    assert.equal(checkLocal({tool_name:'exec_command',cwd:root,tool_input:input},root).code,2,JSON.stringify(input));
  }
});
test('ripgrep amb configuració heretada exigix --no-config', t => {
  const root = setup(t), previous = process.env.RIPGREP_CONFIG_PATH;
  try {
    process.env.RIPGREP_CONFIG_PATH = '/tmp/untrusted-rg-config';
    assert.equal(knownPureRead(shell(root,'rg --files'),root),false);
    assert.equal(knownPureRead(shell(root,'rg --no-config --files'),root),true);
  } finally {
    if (previous === undefined) delete process.env.RIPGREP_CONFIG_PATH;
    else process.env.RIPGREP_CONFIG_PATH = previous;
  }
});
test('retorn de subagents i descoberta de skills passen; les seues mutacions es revisen', t => {
  const root = setup(t);
  for (const name of ['SubagentHandback','StructuredOutput','Skill','ListSkills','Read','Glob','Grep']) {
    const payload = {tool_name:name,tool_input:{result:'informe'}};
    assert.equal(knownPureRead(payload,root),true,name);
    assert.equal(checkLocal(payload,root).code,0,name);
  }
  assert.equal(checkLocal({tool_name:'SkillWrite',tool_input:{}},root).code,2);
  assert.equal(checkLocal({tool_name:'Write',tool_input:{file_path:'.agents/skills/new/SKILL.md',content:'x'}},root).code,2);
});
test('post-hook permet lectures amb segell divergent, però continua denunciant writes i opacs', t => {
  const root = setup(t);
  fs.mkdirSync(path.join(root,'.agents/skills/prova'),{recursive:true});
  const skill = path.join(root,'.agents/skills/prova/SKILL.md');
  fs.writeFileSync(skill,'regla inicial'); verificaSegell(root,{update:true});
  const seal = fs.readFileSync(path.join(root,'.agents/SKILLS_SEAL.json'),'utf8');
  fs.writeFileSync(skill,'regla divergent');
  for (const event of ['PostToolUse','PostToolUseFailure']) {
    for (const payload of [shell(root,'ls -la'),shell(root,"grep -n 'regla' AGENTS.md"),{tool_name:'SubagentHandback',tool_input:{}}]) {
      assert.match(checkPostTool({...payload,hook_event_name:event},root).motiu,/segell no comprovat/);
    }
    for (const payload of [shell(root,'ls > injected'),shell(root,'node tooling/gates/segella.mjs'),shell(root,'node --test tests/security-chain.test.mjs'),{tool_name:'Write',tool_input:{file_path:'src/x.js'}},{tool_name:'unknown',tool_input:{}}]) {
      assert.throws(()=>checkPostTool({...payload,hook_event_name:event},root),/Origen/);
    }
  }
  assert.equal(fs.readFileSync(path.join(root,'.agents/SKILLS_SEAL.json'),'utf8'),seal);
  assert.equal(verificaSegell(root).ok,false);
});
test('CLI post-hook evita bucle d’informes sense declarar segell verd', t => {
  const root = setup(t);
  const input=JSON.stringify({hook_event_name:'PostToolUse',tool_name:'SubagentHandback',tool_input:{report:'resultat'}});
  const result=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/segell-auto.mjs')],{cwd:root,env:{...process.env,SDP_ARREL:root},input,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.match(JSON.parse(result.stdout).motiu,/segell no comprovat/);
  assert.equal(fs.existsSync(path.join(root,'.agents/SKILLS_SEAL.json')),false);
});
