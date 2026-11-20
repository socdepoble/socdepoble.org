import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inventari, projeccions, catalegCLI } from '../tooling/brain/cataleg_skills.mjs';
import { tokensDeclarats, main } from '../tooling/brain/fronteres-skills.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
function fixture(t, files = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp_r32_4_codex_t1-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => { const abs = path.join(root, rel); fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); };
  for (const [rel, text] of Object.entries(files)) put(rel, text);
  return { root, put };
}
function run(script, root, args = []) {
  const r = spawnSync(process.execPath, [path.join(ROOT, script), ...args], { cwd: root, encoding: 'utf8', timeout: 15000, env: { ...process.env, SDP_ARREL: root } });
  assert.equal(r.error, undefined);
  assert.equal(r.signal, null);
  return { ...r, output: r.stdout + r.stderr };
}
const TOKENS = ':root {\n--sdp-conegut:red;\n}\n';
const SKILL = `---
name: sdp-prova
type: skill
status: actiu
description: Procediment de prova del catàleg.
triggers_on:
  - prova
contracte.llig:
  - docs
contracte.escriu:
  - docs
---
# Prova
Cos.
`;
function brain(t) {
  const f = fixture(t, { '.agents/AGENTS.md': '# BIOS\n', '.agents/PROFILE.md': '# Perfil\n', '.agents/BASELINE.md': '# Base\n', '.agents/consell.json': '{}', '.agents/skills/sdp-prova/SKILL.md': SKILL, 'src/css/tokens.css': TOKENS, 'docs/a.md': '# Document\n', 'package.json': '{"scripts":{}}' });
  for (const [rel, text] of projeccions(inventari(f.root))) f.put(rel, text);
  return f;
}

const GRAELLA = {
  'src/components/layout/AppGridShell.jsx': 'export default function AppGridShell({children}) { return <div inert>{children}</div>; }',
  'src/components/layout/AppGridColumn.jsx': 'export default function AppGridColumn({children}) { return <div>{children}</div>; }',
  'src/css/app-grid-shell.css': '.a {color:var(--sdp-conegut)}',
  'src/css/tokens.css': TOKENS,
  '_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md': '## AppGridShell\n| `children` | contingut |\n## AppGridColumn\n| `children` | contingut |\n'
};
test('graella: un CSS absent no es certifica com a contracte coherent', t => {
  const { root } = fixture(t, GRAELLA);
  fs.unlinkSync(path.join(root, 'src/css/app-grid-shell.css'));
  const r = run('tooling/gates/tractor-graella.mjs', root, [`--arrel=${root}`]);
  assert.equal(r.status, 2, r.output);
  assert.match(r.output, /app-grid-shell\.css/);
});
test('graella: no omet la llei de tokens quan la font no té declaracions', t => {
  const { root, put } = fixture(t, GRAELLA);
  put('src/css/tokens.css', '/* cap token */');
  const r = run('tooling/gates/tractor-graella.mjs', root, [`--arrel=${root}`]);
  assert.equal(r.status, 2, r.output);
});
test('graella: la fixture completa passa i la font no s’escriu', t => {
  const { root } = fixture(t, GRAELLA);
  const before = fs.readFileSync(path.join(root, '_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md'));
  const r = run('tooling/gates/tractor-graella.mjs', root, [`--arrel=${root}`]);
  assert.equal(r.status, 0, r.output);
  assert.deepEqual(fs.readFileSync(path.join(root, '_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md')), before);
});
for (const args of [['--nomes', 'T99'], ['--nomes'], ['--baselina'], ['--root'], ['--root', '']]) test(`tokens: rebutja ús que desactivaria les lleis ${JSON.stringify(args)}`, t => {
  const { root } = fixture(t, { 'src/css/tokens.css': TOKENS });
  const r = run('tooling/gates/tractor-tokens.mjs', root, ['--root', root, ...args]);
  assert.equal(r.status, 2, r.output);
});
test('tokens: una font de vocabulari buida no és vocabulari verificat', t => {
  const { root } = fixture(t, { 'src/css/tokens.css': '/* res */' });
  const r = run('tooling/gates/tractor-tokens.mjs', root, ['--root', root]);
  assert.equal(r.status, 2, r.output);
});
test('tokens: refusa un symlink de font abans de travessar-lo', t => {
  const { root, put } = fixture(t, { 'src/css/tokens.css': TOKENS });
  put('exterior.css', '.a {color:red}');
  fs.symlinkSync(path.join(root, 'exterior.css'), path.join(root, 'src/css/enllac.css'));
  const r = run('tooling/gates/tractor-tokens.mjs', root, ['--root', root]);
  assert.equal(r.status, 2, r.output);
  assert.match(r.output, /[Ss]ymlink/);
});
for (const cens of [{}, { membres: [] }, { membres: [{ id: 'm', nom: 'M', fortalesa:'f', debilitat:'d', rol:'r', actiu:'false' }] }, { membres: [{ id: 'm', nom: 'M', fortalesa:'f', debilitat:'d', rol:'r', actiu:false }] }]) test(`cens: esquema o conjunt actiu no certificable ${JSON.stringify(cens)}`, t => {
  const { root } = fixture(t, { '.agents/consell.json': JSON.stringify(cens), '.agents/skills/core-consell-i-colmena/SKILL.md': 'Font: .agents/consell.json', '_wiki_de_poble/context.md': 'Doctrina.' });
  const r = run('tooling/gates/tractor-cens.mjs', root, ['--arrel', root]);
  assert.equal(r.status, 2, r.output);
});
const PARAMS = 'item, active, onSelect, untitled, idElement, llenguaContingut, nomAccessible, imageAlt';
function fitxa(t, source) {
  return fixture(t, { '.agents/AGENTS.md':'# BIOS', 'src/components/universal/workspace/UniversalWorkspace.jsx': source, 'src/css/modules.css': '', 'src/css/tokens.css':TOKENS });
}
test('fitxa F1: el contracte real de DefaultItemCard refusa props obertes', t => {
  const { root } = fitxa(t, `export function DefaultItemCard({${PARAMS}, ...resta}) { return <button type="button" className="sdp-gestor-fitxa"/>; }`);
  const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', 'F1']);
  assert.equal(r.status, 1, r.output);
});
test('fitxa F2: absència de fitxa no equival a botó natiu comprovat', t => {
  const { root } = fitxa(t, `export function DefaultItemCard({${PARAMS}}) { return <div/>; }`);
  const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', 'F2']);
  assert.equal(r.status, 1, r.output);
});
test('fitxa F5: una projecció opaca es detecta en qualsevol font', t => {
  const { root, put } = fitxa(t, `export function DefaultItemCard({${PARAMS}}) { return <button type="button" className="sdp-gestor-fitxa"/>; }`);
  put('src/projeccio.js', 'export const getItemCard = item => ({titol:item.title, ...item});');
  const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', 'F5']);
  assert.equal(r.status, 1, r.output);
});
test('catàleg: rebutja triggers_on buit en lloc d’inventariar una skill inactivable', t => {
  const { root, put } = brain(t);
  put('.agents/skills/sdp-prova/SKILL.md', SKILL.replace('triggers_on:\n  - prova', 'triggers_on: []'));
  assert.throws(() => inventari(root), /triggers_on/);
});
test('catàleg CLI: --arrel buit o múltiple no deriva a una arrel accidental', t => {
  const { root } = brain(t);
  for (const args of [['--check','--arrel='], ['--check', `--arrel=${root}`, `--arrel=${root}`]]) assert.equal(catalegCLI(args, root), 2);
});
test('fronteres: src symlink no es converteix en mapa de tokens buit', t => {
  const { root } = brain(t);
  fs.renameSync(path.join(root,'src'), path.join(root,'fonts'));
  fs.symlinkSync(path.join(root,'fonts'), path.join(root,'src'));
  assert.throws(() => tokensDeclarats(root), /[Ss]ymlink/);
  assert.equal(main([], { arrel:root, sortida: { log() {}, error() {} } }), 2);
});

test('graella: els comentaris de la font no inventen definicions de tokens', t => {
  const { root, put } = fixture(t, GRAELLA);
  put('src/css/tokens.css', `${TOKENS}\n/* --sdp-fantasma:red; */`);
  put('src/css/app-grid-shell.css', '.a {color:var(--sdp-fantasma)}');
  const r = run('tooling/gates/tractor-graella.mjs', root, [`--arrel=${root}`]);
  assert.equal(r.status, 1, r.output);
  assert.match(r.output, /token-inventat/);
});
test('fitxa F2: refusa controls niats i embolcalls amb un botó canònic dins', t => {
  for (const cos of ['<button type="button" className="sdp-gestor-fitxa"><a href="/">Enllaç</a></button>', '<div><button type="button" className="sdp-gestor-fitxa"/></div>']) {
    const { root } = fitxa(t, `export function DefaultItemCard({${PARAMS}}) { return ${cos}; }`);
    const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', 'F2']);
    assert.equal(r.status, 1, r.output);
  }
});
test('fitxa F1/F2/F5: el contracte explícit i la projecció literal passen', t => {
  const { root, put } = fitxa(t, `export function DefaultItemCard({${PARAMS}}) { return <button type="button" className="sdp-gestor-fitxa"><span className="sdp-gestor-fitxa__titol">{item.title}</span></button>; }`);
  put('src/projeccio.js', 'export const getItemCard = item => ({titol:item.title, subtitol:item.subtitle});');
  for (const llei of ['F1','F2','F5']) {
    const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', llei]);
    assert.equal(r.status, 0, r.output);
  }
});
test('catàleg CLI: audita --arrel del seu argv en compte de l’arrel per defecte', t => {
  const base = brain(t);
  const target = brain(t);
  target.put('.agents/skills/sdp-prova/SKILL.md', SKILL.replace('triggers_on:\n  - prova', 'triggers_on: []'));
  assert.equal(catalegCLI([`--arrel=${target.root}`, '--check'], base.root), 2);
});
test('fitxa F5: un camí que pot acabar sense objecte no és projecció tancada', t => {
  const { root, put } = fitxa(t, `export function DefaultItemCard({${PARAMS}}) { return <button type="button" className="sdp-gestor-fitxa"/>; }`);
  put('src/projeccio.js', 'export function getItemCard(item) { if (item.title) return {titol:item.title}; }');
  const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', 'F5']);
  assert.equal(r.status, 1, r.output);
});
// GOV-03 · F3 «Sense forma d'article» cobrix tota la llista, no només DefaultItemCard: l'HTML cru i les
// targetes d'article d'una fila fora de la fitxa cauen; les etiquetes d'article de l'espai de treball, no.
const FITXA_NETA = `export function DefaultItemCard({${PARAMS}}) { return <button type="button" className="sdp-gestor-fitxa"/>; }`;
test('fitxa F3: un <li> de la llista amb HTML cru o amb una targeta d’article fora de la fitxa falla', t => {
  for (const [fila, motiu] of [
    ['<li key={i.id}><div dangerouslySetInnerHTML={{__html: i.cos}}/></li>', /HTML cru/],
    ['<li key={i.id}><UniversalCard item={i}/></li>', /targeta d'article/]
  ]) {
    const { root } = fitxa(t, `${FITXA_NETA}\nexport function Llista({items}) { return <ul>{items.map(i => ${fila})}</ul>; }`);
    const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', 'F3']);
    assert.equal(r.status, 1, r.output);
    assert.match(r.output, motiu);
    assert.match(r.output, /UniversalWorkspace\.jsx:2\b/);
  }
});
test('fitxa F3: les etiquetes d’article de l’espai de treball fora de la fitxa continuen exemptes', t => {
  const { root } = fitxa(t, `${FITXA_NETA}\nexport function Espai({items}) { return <article><header><h2>Gestor</h2><p>Text</p></header><ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul></article>; }`);
  const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`, '--nomes', 'F3']);
  assert.equal(r.status, 0, r.output);
});

// Independent cold-review fixtures: comments, quoted CLI, path traversal, async values and opaque props.
const CRITIC_CASES = [
  {
    "name": "graella_positive",
    "script": "tooling/gates/tractor-graella.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE"
    ],
    "expected": 0,
    "files": {
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/app-grid-shell.css": ".a{color:var(--sdp-conegut)}",
      "src/components/layout/AppGridColumn.jsx": "export default function AppGridColumn({children}) { return <div>{children}</div>; }",
      "src/components/layout/AppGridShell.jsx": "export default function AppGridShell({children}) { return <div inert>{children}</div>; }",
      "_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md": "## AppGridShell\n| `children` | contingut |\n## AppGridColumn\n| `children` | contingut |\n"
    },
    "write": false
  },
  {
    "name": "graella_inert_comment",
    "script": "tooling/gates/tractor-graella.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/app-grid-shell.css": ".a{color:var(--sdp-conegut)}",
      "src/components/layout/AppGridColumn.jsx": "export default function AppGridColumn({children}) { return <div>{children}</div>; }",
      "src/components/layout/AppGridShell.jsx": "export default function AppGridShell({children}) { /* inert */ return <div>{children}</div>; }",
      "_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md": "## AppGridShell\n| `children` | contingut |\n## AppGridColumn\n| `children` | contingut |\n"
    },
    "write": false
  },
  {
    "name": "graella_signature_comment",
    "script": "tooling/gates/tractor-graella.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/app-grid-shell.css": ".a{color:var(--sdp-conegut)}",
      "src/components/layout/AppGridColumn.jsx": "export default function AppGridColumn({children}) { return <div>{children}</div>; }",
      "src/components/layout/AppGridShell.jsx": "/* export default function AppGridShell({children}) */\nexport default function Actual({undocumented}) { return <div inert>{undocumented}</div>; }",
      "_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md": "## AppGridShell\n| `children` | contingut |\n## AppGridColumn\n| `children` | contingut |\n"
    },
    "write": false
  },
  {
    "name": "graella_string_token",
    "script": "tooling/gates/tractor-graella.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      "src/css/tokens.css": ":root{--sdp-conegut:red;content:\"--sdp-fantasma: red;\";}",
      "src/css/app-grid-shell.css": ".a{color:var(--sdp-fantasma)}",
      "src/components/layout/AppGridColumn.jsx": "export default function AppGridColumn({children}) { return <div>{children}</div>; }",
      "src/components/layout/AppGridShell.jsx": "export default function AppGridShell({children}) { return <div inert>{children}</div>; }",
      "_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md": "## AppGridShell\n| `children` | contingut |\n## AppGridColumn\n| `children` | contingut |\n"
    },
    "write": false
  },
  {
    "name": "graella_real_cut",
    "script": "tooling/gates/tractor-graella.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/app-grid-shell.css": ".a{color:var(--sdp-conegut)}",
      "src/components/layout/AppGridColumn.jsx": "export default function AppGridColumn({children}) { return <div>{children}</div>; }",
      "src/components/layout/AppGridShell.jsx": "export default function AppGridShell({children}) { return <div inert>{children}</div>; }\nconst w=0; const size=w<777;",
      "_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md": "## AppGridShell\n| `children` | contingut |\n## AppGridColumn\n| `children` | contingut |\n"
    },
    "write": false
  },
  {
    "name": "tokens_positive",
    "script": "tooling/gates/tractor-tokens.mjs",
    "args": [
      "--root",
      "ROOT_FIXTURE"
    ],
    "expected": 0,
    "files": {
      "src/a.css": ".a{color:var(--sdp-conegut)}",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n"
    },
    "write": false
  },
  {
    "name": "tokens_ghost_control",
    "script": "tooling/gates/tractor-tokens.mjs",
    "args": [
      "--root",
      "ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      "src/a.css": ".a{color:var(--sdp-fantasma)}",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n"
    },
    "write": false
  },
  {
    "name": "tokens_string_def",
    "script": "tooling/gates/tractor-tokens.mjs",
    "args": [
      "--root",
      "ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      "src/a.css": ".a{color:var(--sdp-fantasma)}",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\ncontent:\"--sdp-fantasma:red;\";\n}\n"
    },
    "write": false
  },
  {
    "name": "tokens_template_comment",
    "script": "tooling/gates/tractor-tokens.mjs",
    "args": [
      "--root",
      "ROOT_FIXTURE",
      "--nomes",
      "T1"
    ],
    "expected": 0,
    "files": {
      "src/a.js": "export const css=`.a { ${ (()=>{ /* var(--sdp-fantasma) */ return \"\"; })() } }`;",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n"
    },
    "write": false
  },
  {
    "name": "tokens_escaped_ghost",
    "script": "tooling/gates/tractor-tokens.mjs",
    "args": [
      "--root",
      "ROOT_FIXTURE",
      "--nomes",
      "T1"
    ],
    "expected": 1,
    "files": {
      "src/a.css": ".a{color:var(--sdp-\\66 antasma)}",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n"
    },
    "write": false
  },
  {
    "name": "fitxa_projection_positive",
    "script": "tooling/gates/tractor-fitxa-gestor.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--nomes",
      "F5"
    ],
    "expected": 0,
    "files": {
      ".agents/AGENTS.md": "# BIOS\n",
      "src/proj.js": "export const getItemCard = item => ({titol:item.title});",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/modules.css": ".a{}",
      "src/components/universal/workspace/UniversalWorkspace.jsx": "export function DefaultItemCard({item, active, onSelect, untitled, idElement, llenguaContingut, nomAccessible, imageAlt}) { return <button type=\"button\" className=\"sdp-gestor-fitxa\"/>; }"
    },
    "write": false
  },
  {
    "name": "fitxa_alias_projection",
    "script": "tooling/gates/tractor-fitxa-gestor.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--nomes",
      "F5"
    ],
    "expected": 1,
    "files": {
      ".agents/AGENTS.md": "# BIOS\n",
      "src/proj.jsx": "const mapper=item=>({...item}); export function Consumer(){return <UniversalManager getItemCard={mapper}/>;}",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/modules.css": ".a{}",
      "src/components/universal/workspace/UniversalWorkspace.jsx": "export function DefaultItemCard({item, active, onSelect, untitled, idElement, llenguaContingut, nomAccessible, imageAlt}) { return <button type=\"button\" className=\"sdp-gestor-fitxa\"/>; }"
    },
    "write": false
  },
  {
    "name": "fitxa_async_projection",
    "script": "tooling/gates/tractor-fitxa-gestor.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--nomes",
      "F5"
    ],
    "expected": 1,
    "files": {
      ".agents/AGENTS.md": "# BIOS\n",
      "src/proj.js": "export const getItemCard = async item => ({titol:item.title});",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/modules.css": ".a{}",
      "src/components/universal/workspace/UniversalWorkspace.jsx": "export function DefaultItemCard({item, active, onSelect, untitled, idElement, llenguaContingut, nomAccessible, imageAlt}) { return <button type=\"button\" className=\"sdp-gestor-fitxa\"/>; }"
    },
    "write": false
  },
  {
    "name": "fitxa_async_card",
    "script": "tooling/gates/tractor-fitxa-gestor.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--nomes",
      "F2"
    ],
    "expected": 1,
    "files": {
      ".agents/AGENTS.md": "# BIOS\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/modules.css": ".a{}",
      "src/components/universal/workspace/UniversalWorkspace.jsx": "export async function DefaultItemCard({item, active, onSelect, untitled, idElement, llenguaContingut, nomAccessible, imageAlt}) { return <button type=\"button\" className=\"sdp-gestor-fitxa\"/>; }"
    },
    "write": false
  },
  {
    "name": "fitxa_li_spread",
    "script": "tooling/gates/tractor-fitxa-gestor.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--nomes",
      "F7"
    ],
    "expected": 1,
    "files": {
      ".agents/AGENTS.md": "# BIOS\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/modules.css": ".a{}",
      "src/components/universal/workspace/UniversalWorkspace.jsx": "export function DefaultItemCard({item, active, onSelect, untitled, idElement, llenguaContingut, nomAccessible, imageAlt}) { return <button type=\"button\" className=\"sdp-gestor-fitxa\"/>; }\nexport function List(){ const handlers={onClick:()=>{}};return <li {...handlers}/>;}"
    },
    "write": false
  },
  {
    "name": "fitxa_unknown_cli",
    "script": "tooling/gates/tractor-fitxa-gestor.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--nomes",
      "F5",
      "--nomess",
      "F2"
    ],
    "expected": 2,
    "files": {
      ".agents/AGENTS.md": "# BIOS\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      "src/css/modules.css": ".a{}",
      "src/components/universal/workspace/UniversalWorkspace.jsx": "export function DefaultItemCard({item, active, onSelect, untitled, idElement, llenguaContingut, nomAccessible, imageAlt}) { return <button type=\"button\" className=\"sdp-gestor-fitxa\"/>; }"
    },
    "write": false
  },
  {
    "name": "fronteres_positive",
    "script": "tooling/brain/fronteres-skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--json"
    ],
    "expected": 0,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n"
    },
    "write": false
  },
  {
    "name": "fronteres_traversal",
    "script": "tooling/brain/fronteres-skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--json"
    ],
    "expected": 1,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n```js\nreadFileSync(\"src/../outside/a.md\");\n```\n"
    },
    "write": false
  },
  {
    "name": "fronteres_quoted_node",
    "script": "tooling/brain/fronteres-skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--json"
    ],
    "expected": 1,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n```sh\nnode \"tooling/gates/absent.mjs\"\n```\n"
    },
    "write": false
  },
  {
    "name": "fronteres_node_option",
    "script": "tooling/brain/fronteres-skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--json"
    ],
    "expected": 1,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n```sh\nnode --trace-warnings tooling/gates/absent.mjs\n```\n"
    },
    "write": false
  },
  {
    "name": "fronteres_comment_exclude",
    "script": "tooling/brain/fronteres-skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--json"
    ],
    "expected": 1,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n```sh\nsed -i \"s/a/b/\" docs/a.md # --exclude=01_produccio\n```\n"
    },
    "write": false
  },
  {
    "name": "fronteres_string_token",
    "script": "tooling/brain/fronteres-skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--json"
    ],
    "expected": 1,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root{--sdp-conegut:red;content:\"--sdp-fantasma: red;\";}",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\nUsa `var(--sdp-fantasma)`.\n"
    },
    "write": false
  },
  {
    "name": "fronteres_outside_control",
    "script": "tooling/brain/fronteres-skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--json"
    ],
    "expected": 1,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n```js\nreadFileSync(\"outside/a.md\");\n```\n"
    },
    "write": false
  },
  {
    "name": "cataleg_default_check",
    "script": "tooling/brain/cataleg_skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--check"
    ],
    "expected": 1,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n"
    },
    "write": false
  },
  {
    "name": "cataleg_write_positive",
    "script": "tooling/brain/cataleg_skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--escriu"
    ],
    "expected": 0,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n"
    },
    "write": true
  },
  {
    "name": "cataleg_readonly_positive",
    "script": "tooling/brain/cataleg_skills.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--check"
    ],
    "expected": 0,
    "files": {
      "package.json": "{\"scripts\":{}}",
      ".agents/BASELINE.md": "# Base\n",
      ".agents/manifest.yaml": "# GENERAT per tooling/brain/cataleg_skills.mjs; no editar a mà.\nschema: socdepoble.manifest.v1\nidentity: PROFILE.md\nbios: AGENTS.md\nbaseline: BASELINE.md\nindex_skills: skills/00_INDEX_SKILLS.md\nconsell: consell.json\nskills:\n  - skills/sdp-prova/SKILL.md\n",
      ".agents/consell.json": "{}",
      ".agents/AGENTS.md": "# BIOS\n",
      ".agents/PROFILE.md": "# Profile\n",
      "outside/a.md": "# Outside\n",
      "docs/a.md": "# Doc\n",
      "src/css/tokens.css": ":root {\n--sdp-conegut:red;\n}\n",
      ".agents/skills/00_INDEX_SKILLS.md": "---\ntype: index\nstatus: generat\ndescription: Catàleg determinista de les skills actives, generat des de les fonts canòniques.\ntags:\n  - skills\n  - core\n---\n\n# Catàleg de skills\n\nFont executiva única: `.agents/skills/`. Este índex només referencia les fonts.\n\n- [[sdp-prova/SKILL|sdp-prova]]: Procediment de prova.\n\n\n## Vincles\n- [[.agents/index]]\n",
      ".agents/skills/sdp-prova/SKILL.md": "---\nname: sdp-prova\ntype: skill\nstatus: actiu\ndescription: Procediment de prova.\ntriggers_on:\n  - prova\ncontracte.llig:\n  - src\ncontracte.escriu:\n  - docs\n---\n# Prova\n"
    },
    "write": false
  },
  {
    "name": "cens_positive",
    "script": "tooling/gates/tractor-cens.mjs",
    "args": [
      "--arrel",
      "ROOT_FIXTURE"
    ],
    "expected": 0,
    "files": {
      ".agents/consell.json": "{\"membres\": [{\"id\": \"m\", \"nom\": \"Membre\", \"fortalesa\": \"f\", \"debilitat\": \"d\", \"rol\": \"r\", \"actiu\": true}]}",
      "_wiki_de_poble/context.md": "Doctrina.\n",
      ".agents/skills/core-consell-i-colmena/SKILL.md": "Font .agents/consell.json\n"
    },
    "write": false
  },
  {
    "name": "cens_comment_source",
    "script": "tooling/gates/tractor-cens.mjs",
    "args": [
      "--arrel",
      "ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      ".agents/consell.json": "{\"membres\": [{\"id\": \"m\", \"nom\": \"Membre\", \"fortalesa\": \"f\", \"debilitat\": \"d\", \"rol\": \"r\", \"actiu\": true}]}",
      "_wiki_de_poble/context.md": "Doctrina.\n",
      ".agents/skills/core-consell-i-colmena/SKILL.md": "<!-- consell.json -->\n# Executiva sense font\n"
    },
    "write": false
  },
  {
    "name": "cens_wrong_count",
    "script": "tooling/gates/tractor-cens.mjs",
    "args": [
      "--arrel",
      "ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      ".agents/consell.json": "{\"membres\": [{\"id\": \"m\", \"nom\": \"Membre\", \"fortalesa\": \"f\", \"debilitat\": \"d\", \"rol\": \"r\", \"actiu\": true}]}",
      "_wiki_de_poble/context.md": "El Consell té dues membres.\n",
      ".agents/skills/core-consell-i-colmena/SKILL.md": "Font .agents/consell.json\n"
    },
    "write": false
  },
  {
    "name": "fitxa_f8_missing_text",
    "script": "tooling/gates/tractor-fitxa-gestor.mjs",
    "args": [
      "--arrel=ROOT_FIXTURE",
      "--nomes",
      "F8"
    ],
    "expected": 1,
    "files": {
      ".agents/AGENTS.md": "# BIOS\n",
      "src/css/tokens.css": ":root{--sdp-fitxa-mida:96px;--sdp-accio:red}",
      "src/css/modules.css": ".sdp-gestor-fitxa{min-height:var(--sdp-fitxa-mida)}\n.sdp-gestor-fitxa__media{flex:0 0 var(--sdp-fitxa-mida);width:var(--sdp-fitxa-mida);height:var(--sdp-fitxa-mida)}\n.sdp-gestor-fitxa__titol{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:90px;line-height:1}\n.sdp-gestor-fitxa__subtitol{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:40px;line-height:1}\n.sdp-gestor-fitxa[aria-current=true]{border-left-color:var(--sdp-accio)}",
      "src/components/universal/workspace/UniversalWorkspace.jsx": "export function DefaultItemCard({item,active,onSelect}) { return <button type=\"button\" className=\"sdp-gestor-fitxa\"/>; }"
    },
    "write": false
  },
  {
    "name": "cens_1000",
    "script": "tooling/gates/tractor-cens.mjs",
    "args": [
      "--arrel",
      "ROOT_FIXTURE"
    ],
    "expected": 1,
    "files": {
      ".agents/consell.json": "{\"membres\": [{\"id\": \"m\", \"nom\": \"Membre\", \"fortalesa\": \"f\", \"debilitat\": \"d\", \"rol\": \"r\", \"actiu\": true}]}",
      "_wiki_de_poble/context.md": "El Consell té 1000 membres.\n",
      ".agents/skills/core-consell-i-colmena/SKILL.md": "Font .agents/consell.json\n"
    },
    "write": false
  }
];
for (const cas of CRITIC_CASES) test(`Peix crític CLI: ${cas.name}`, t => {
  const { root } = fixture(t, cas.files);
  const abans = instantaniaFixture(root);
  const args = cas.args.map(a => a.replaceAll('ROOT_FIXTURE',root));
  const r = run(cas.script, root, args);
  assert.equal(r.status, cas.expected, r.output);
  if (!cas.write) assert.deepEqual(instantaniaFixture(root),abans,'read-only: contingut i conjunt de fitxers');
});

test('Peix crític: CSS escapable conegut conserva el positiu i no compta text de content', t => {
  for (const [def, use] of [[TOKENS, 'var(--sdp-\\63 onegut)'], [':root { --sdp-\\63 onegut:red; }', 'var(--sdp-conegut)']]) {
    const { root } = fixture(t, { 'src/css/tokens.css':def, 'src/a.css':`.a { color:${use}; content:"var(--sdp-ignorat)"; }` });
    const r = run('tooling/gates/tractor-tokens.mjs', root, ['--root',root]);
    assert.equal(r.status,0,r.output);
  }
});
test('Peix crític F5: un alias local amb objecte literal passa', t => {
  const { root, put } = fitxa(t, `export function DefaultItemCard({${PARAMS}}) { return <button type="button" className="sdp-gestor-fitxa"/>; }`);
  put('src/consumer.jsx', 'const mapper=item=>({titol:item.title}); export const Consumer=()=> <UniversalManager getItemCard={mapper}/>;');
  const r = run('tooling/gates/tractor-fitxa-gestor.mjs', root, [`--arrel=${root}`,'--nomes','F5']);
  assert.equal(r.status,0,r.output);
});
test('Peix crític F2: node amb opció i ruta citada declara i valida el motor real', t => {
  const { root, put } = brain(t);
  put('tooling/prova.mjs','export const prova=1;');
  put('.agents/skills/sdp-prova/SKILL.md', SKILL.replace('---\n# Prova', 'motors:\n  - tooling/prova.mjs\n---\n# Prova') + '\n```sh\nnode --trace-warnings "tooling/prova.mjs"\n```');
  const r = run('tooling/brain/fronteres-skills.mjs', root, [`--arrel=${root}`]);
  assert.equal(r.status,0,r.output);
});
for (const font of ['/* sense tancar', ':root { --sdp-a:"cadena; }', ':root { --sdp-a:var(--sdp-b);']) test(`Peix crític: CSS incomplet és error de mesura ${font}`, t => {
  const { root } = fixture(t, { 'src/css/tokens.css':font });
  const r = run('tooling/gates/tractor-tokens.mjs',root,['--root',root]);
  assert.equal(r.status,2,r.output);
});
test('Peix crític: JS invàlid no queda certificat per una cerca lèxica', t => {
  const { root } = fixture(t, {'src/css/tokens.css':TOKENS, 'src/a.js':'export const a = ;'});
  const r = run('tooling/gates/tractor-tokens.mjs',root,['--root',root]);
  assert.equal(r.status,2,r.output);
});
for (const script of ['tooling/gates/tractor-graella.mjs','tooling/gates/tractor-tokens.mjs','tooling/gates/tractor-fitxa-gestor.mjs','tooling/gates/tractor-cens.mjs','tooling/brain/fronteres-skills.mjs','tooling/brain/cataleg_skills.mjs']) test(`Peix crític CLI: symlink de font refusa abans de mesurar ${script}`, t => {
  let f, args;
  if (script.endsWith('tractor-graella.mjs')) { f=fixture(t,GRAELLA); args=[`--arrel=${f.root}`]; }
  else if (script.endsWith('tractor-fitxa-gestor.mjs')) { f=fitxa(t,`export function DefaultItemCard({${PARAMS}}) { return <button type="button" className="sdp-gestor-fitxa"/>; }`); args=[`--arrel=${f.root}`,'--nomes','F1']; }
  else if (script.endsWith('tractor-cens.mjs')) { f=fixture(t,{'.agents/consell.json':JSON.stringify({membres:[{id:'m',nom:'M',fortalesa:'f',debilitat:'d',rol:'r'}]}),'.agents/skills/core-consell-i-colmena/SKILL.md':'Font consell.json','_wiki_de_poble/a.md':'Doctrina'}); args=['--arrel',f.root]; }
  else { f=brain(t); args=script.endsWith('tractor-tokens.mjs')?['--root',f.root]:[`--arrel=${f.root}`]; }
  f.put('destinatari.txt','Font exterior de prova');
  const link=script.endsWith('tractor-cens.mjs')?'_wiki_de_poble/enllac.md':script.endsWith('cataleg_skills.mjs')?'.agents/skills/enllac':'src/css/enllac.css';
  fs.symlinkSync(path.join(f.root,'destinatari.txt'),path.join(f.root,link));
  const r=run(script,f.root,args); assert.equal(r.status,2,r.output); assert.match(r.output,/[Ss]ymlink/);
});

function instantaniaFixture(root) {
  const files = {};
  function walk(dir) {
    for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
      const p = path.join(dir,e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) files[path.relative(root,p)] = fs.readFileSync(p);
    }
  }
  walk(root); return files;
}
for (const command of ['sed -i "s/a/b/" docs/a.md && echo --exclude=01_produccio', 'sed -i "s/a/b/" docs/a.md # Mai', 'echo --exclude=01_produccio | xargs sed -i "s/a/b/"']) test(`Peix crític F3: text aliè no eximix escriptura ${command}`, t => {
  const {root,put}=brain(t);
  put('.agents/skills/sdp-prova/SKILL.md',SKILL+'\n```sh\n'+command+'\n```');
  const r=run('tooling/brain/fronteres-skills.mjs',root,[`--arrel=${root}`]);
  assert.equal(r.status,1,r.output);
  assert.match(r.output,/F3/);
});
for (const script of ['tooling/gates/tractor-graella.mjs','tooling/gates/tractor-tokens.mjs','tooling/gates/tractor-fitxa-gestor.mjs','tooling/gates/tractor-cens.mjs','tooling/brain/fronteres-skills.mjs','tooling/brain/cataleg_skills.mjs']) test(`Peix crític CLI: UTF-8 invàlid és error de lectura ${script}`, t => {
  let f,args,broken;
  if (script.endsWith('tractor-graella.mjs')) { f=fixture(t,GRAELLA); args=[`--arrel=${f.root}`]; broken='src/css/app-grid-shell.css'; }
  else if (script.endsWith('tractor-fitxa-gestor.mjs')) { f=fitxa(t,`export function DefaultItemCard({${PARAMS}}) { return <button type="button" className="sdp-gestor-fitxa"/>; }`); args=[`--arrel=${f.root}`,'--nomes','F1']; broken='src/css/modules.css'; }
  else if (script.endsWith('tractor-cens.mjs')) { f=fixture(t,{'.agents/consell.json':JSON.stringify({membres:[{id:'m',nom:'M',fortalesa:'f',debilitat:'d',rol:'r'}]}),'.agents/skills/core-consell-i-colmena/SKILL.md':'Font consell.json','_wiki_de_poble/a.md':'Doctrina'}); args=['--arrel',f.root]; broken='_wiki_de_poble/a.md'; }
  else { f=brain(t); args=script.endsWith('tractor-tokens.mjs')?['--root',f.root]:[`--arrel=${f.root}`]; broken=script.endsWith('cataleg_skills.mjs')?'.agents/skills/sdp-prova/SKILL.md':'src/css/tokens.css'; }
  fs.appendFileSync(path.join(f.root,broken),Buffer.from([0xff]));
  const r=run(script,f.root,args); assert.equal(r.status,2,r.output);
});

for (const segonPresent of [false,true]) test(`Peix crític F2: --test comprova tots els mòduls literals, segon present=${segonPresent}`, t => {
  const {root,put}=brain(t);
  put('tests/a.test.mjs','export const a=1;');
  if (segonPresent) put('tests/b.test.mjs','export const b=1;');
  const motors='motors:\n  - tests/a.test.mjs\n  - tests/b.test.mjs\n';
  put('.agents/skills/sdp-prova/SKILL.md',SKILL.replace('---\n# Prova',motors+'---\n# Prova')+'\n```sh\nnode --test tests/a.test.mjs tests/b.test.mjs\n```');
  const r=run('tooling/brain/fronteres-skills.mjs',root,[`--arrel=${root}`]);
  assert.equal(r.status,segonPresent?0:1,r.output);
  if (!segonPresent) assert.match(r.output,/motor absent tests\/b\.test\.mjs/);
});
for (const command of ['node --test tests/*.test.mjs','node --test','node "$MOTOR"']) test(`Peix crític F2: descoberta, glob o expressió no resolta no és motor comprovat ${command}`, t => {
  const {root,put}=brain(t);
  put('.agents/skills/sdp-prova/SKILL.md',SKILL+'\n```sh\n'+command+'\n```');
  const r=run('tooling/brain/fronteres-skills.mjs',root,[`--arrel=${root}`]);
  assert.equal(r.status,1,r.output);
  assert.match(r.output,/F2/);
});
