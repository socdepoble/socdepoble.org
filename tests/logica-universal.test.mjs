import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { analyseSources, scanRepository } from '../tooling/gates/porta-logica-universal.mjs';

const PAGE = 'src/sections/example/Page.jsx';
const header = 'author="Veïna" location="Tibi" date="12/11/26" dateTime="2026-11-12"';
const codes = result => result.diagnostics.map(d => d.code);
const inspect = (source, extra = {}) => analyseSources({ [PAGE]: source, ...extra });

test('a content card requires all four header fields with actionable file and line', () => {
  const r = inspect('export function Page(){ return (\n<UniversalCard title="Una publicació"/>); }');
  assert.equal(r.valid, false);
  assert.equal(r.diagnostics[0].code, 'LU02');
  assert.equal(r.diagnostics[0].file, PAGE);
  assert.equal(r.diagnostics[0].line, 2);
  assert.match(r.diagnostics[0].message, /author absent.*location absent.*date absent.*dateTime absent/);
  assert.equal(inspect(`export const Page=()=> <UniversalCard ${header}/>`).valid, true);
});
test('comments, prose and JSX demonstration strings are not executable feed-grid', () => {
  const r = inspect(`// <div className="feed-grid"><UniversalCard/></div>\nexport const Page=()=> <code>{'<div className="feed-grid"/>'}</code>;`);
  assert.equal(r.valid, true);
  assert.deepEqual(codes(inspect('export const Page=()=> <div className="feed-grid other"/>')), ['LU01']);
  assert.equal(inspect('const cls="feed-"+"grid"; export const Page=()=> <div className={cls}/>').valid, false);
  assert.ok(codes(inspect('const cls=flag?"feed-grid":"sdp-card-grid"; const p=()=> <div className={cls}/>')).includes('LU01'));
  assert.ok(codes(inspect('const p=()=> <div className={`layout ${flag} feed-grid`}/>')).includes('LU01'));
});
test('import aliases, namespace components and local card aliases retain the contract', () => {
  for (const source of [
    'import {UniversalCard as U} from "../../components/PedraSeca"; export const Page=()=> <U/>;',
    'import * as UI from "../../components/PedraSeca"; export const Page=()=> <UI.UniversalCard/>;',
    'const Card=UniversalCard; export const Page=()=> <Card/>;',
    'import * as UI from "../../components/PedraSeca"; const Card=UI.UniversalCard; const p=()=> <Card/>;',
    'import {memo} from "react"; const Card=memo(UniversalCard); const p=()=> <Card/>;',
    'const Card=flag?UniversalCard:Other; const p=()=> <Card/>;'
  ]) assert.ok(codes(inspect(source)).includes('LU02'));
});
test('local object spreads, Object.assign/freeze and lexical shadowing are resolved', () => {
  const source = `const h={author:'A',location:'B',date:'12/11/26',dateTime:'2026-11-12'};
    function Wrong(){ const h={author:'Other'}; return <UniversalCard {...h}/>; }
    function Good(){ const p=Object.freeze(Object.assign({},h)); return <UniversalCard {...p}/>; }`;
  const r = inspect(source);
  assert.equal(r.diagnostics.length, 1);
  assert.equal(r.diagnostics[0].line, 2);
});
test('an imported/reexported props factory is traced without a helper-name whitelist', () => {
  const source = 'import {mystery as make} from "./barrel.js"; const p=make(item); export const Page=()=> <UniversalCard {...p}/>;';
  const r = inspect(source, {
    'src/sections/example/barrel.js': 'export {header as mystery} from "./factory.js";',
    'src/sections/example/factory.js': 'export function header(item){ return {author:item.author,location:item.town,date:item.date,dateTime:item.iso}; }'
  });
  assert.equal(r.valid, true);
  assert.ok(r.consultedModules.includes('src/sections/example/factory.js'));
});
test('conditional branches and unresolved dynamic spreads fail closed', () => {
  for (const source of [
    `const h=condition?{author:'A',location:'B',date:'D',dateTime:'I'}:{}; const p=()=> <UniversalCard {...h}/>;`,
    `function make(x){if(x) return {author:'A',location:'B',date:'D',dateTime:'I'}; return {};} const p=()=> <UniversalCard {...make(input)}/>;`,
    `const p=()=> <UniversalCard ${header} {...untrusted}/>;`,
    'const p=()=> <UniversalCard {...externalFactory(item)}/>;'
  ]) assert.ok(codes(inspect(source)).includes('LU02'));
  assert.equal(inspect(`const p=()=> <UniversalCard {...untrusted} ${header}/>;`).valid, true, 'explicit final header safely overrides an unknown earlier spread');
});
test('every branch value is checked, including nullable helper fields and attributes', () => {
  const r = inspect(`function h(x){if(x)return {author:'A',location:'B',date:'D',dateTime:'I'};return {author:null,location:'B',date:'D',dateTime:'I'};} const p=()=> <UniversalCard {...h(input)}/>;`);
  assert.ok(codes(r).includes('LU02'));
  assert.ok(codes(inspect(`const p=()=> <UniversalCard ${header} author={flag?'A':null}/>;`)).includes('LU02'));
});
test('a helper with implicit fallthrough cannot certify a complete header', () => {
  assert.ok(codes(inspect(`function h(x){if(x)return {author:'A',location:'B',date:'D',dateTime:'I'};} const p=()=> <UniversalCard {...h(input)}/>;`)).includes('LU02'));
  assert.equal(inspect(`function h(x){if(x)throw Error('invalid');return {author:'A',location:'B',date:'D',dateTime:'I'};} const p=()=> <UniversalCard {...h(input)}/>;`).valid, true);
});
test('explicitly blank author/location/date is rejected; unknown date label with null datetime is honest', () => {
  for (const value of ['null', 'undefined', 'false', '""']) assert.ok(codes(inspect(`const p=()=> <UniversalCard ${header} author={${value}}/>`)).includes('LU02'));
  assert.equal(inspect('const p=()=> <UniversalCard author="Autoria no indicada" location="Poble no indicat" date="Data no indicada" dateTime={null}/>').valid, true);
});
test('action/onboarding are explicitly classified and retained; a default content card is not exempt', () => {
  const r = inspect('const p=()=> <><UniversalCard variant="action"/><UniversalCard variant="onboarding"/><UniversalCard/></>;');
  assert.equal(r.coverage[0].cards, 3);
  assert.deepEqual(r.coverage[0].roles, { content: 1, action: 1, onboarding: 1, specimen: 0 });
  assert.equal(r.diagnostics.length, 1);
  assert.equal(inspect('const p=()=> <UniversalCard variant={x?"action":"default"}/>').valid, false);
  assert.equal(inspect('const p=()=> <UniversalCard variant={x?"action":"onboarding"}/>').valid, true);
});
test('a design directory alone grants no exemption; the canonical specimen composition is counted', () => {
  const file = 'src/sections/disseny/Example.jsx';
  assert.equal(analyseSources({ [file]: 'const p=()=> <UniversalCard/>;' }).valid, false);
  assert.equal(analyseSources({ [file]: 'const p=()=> <Especimen><UniversalCard/></Especimen>;' }).valid, false);
  const r = analyseSources({ [file]: 'import {Especimen} from "./cataleg/Especimen.jsx";const p=()=> <Especimen><UniversalCard/></Especimen>;', 'src/sections/disseny/cataleg/Especimen.jsx': 'export function Especimen({children}){return <section>{children}</section>;}' });
  assert.equal(r.valid, true);
  assert.equal(r.coverage[0].roles.specimen, 1);
  assert.equal(inspect('const p=()=> <Especimen><UniversalCard/></Especimen>;').valid, false);
});
test('primary buttons repeated in grids fail; a single page-level primary does not', () => {
  assert.equal(inspect('const p=()=> <Boto varietat="primari"/>;').valid, true);
  assert.ok(codes(inspect('const p=()=> <div className="sdp-card-grid">{items.map(i=><Boto varietat="primari"/>)}</div>;')).includes('LU03'));
  assert.ok(codes(inspect('const p=()=> <GraellaTargetes>{items.map(i=><PortaDePagina porta={{desti:"/x"}}/>)}</GraellaTargetes>;')).includes('LU03'));
  assert.equal(inspect('const p=()=> <GraellaTargetes>{items.map(i=><Boto varietat="secundari"/>)}</GraellaTargetes>;').valid, true);
});
test('repeated primary action hidden in an imported renderer is traced', () => {
  const r = inspect('import {Tile} from "./Tile.jsx"; const p=()=> <div className="sdp-card-grid">{items.map(i=><Tile/>)}</div>;', {
    'src/sections/example/Tile.jsx': 'export function Tile(){return <Boto varietat="primari"/>;}'
  });
  assert.ok(codes(r).includes('LU03'));
  assert.ok(r.diagnostics.some(d => d.file.endsWith('Tile.jsx')));
});
test('canonical button primitives honor explicit secondary props and their real declared defaults', () => {
  const extra = { 'src/components/PedraSeca/atoms/Boto.jsx': `export function Boto({varietat='primari'}){const cls=varietat==='secundari'?'sdp-boto--secundari':'sdp-boto--primari';return <button className={cls}/>;}` };
  const source = 'import {Boto} from "../../components/PedraSeca/atoms/Boto.jsx"; const p=()=> <div className="sdp-card-grid"><Boto varietat="secundari"/></div>;';
  assert.equal(inspect(source, extra).valid, true);
  assert.ok(codes(inspect(source.replace(' varietat="secundari"', ''), extra)).includes('LU03'));
});
test('HTML wrappers between a card and grid fail, but fragments and conditional/map nodes do not', () => {
  assert.ok(codes(inspect(`const p=()=> <div className="sdp-card-grid"><div><UniversalCard ${header}/></div></div>`)).includes('LU04'));
  assert.equal(inspect(`const p=()=> <div className="sdp-card-grid"><>{items.map(i=>i?<UniversalCard ${header}/>:null)}</></div>`).valid, true);
});
test('noncanonical AI/animal is forbidden in the active catalogue; canonical IAIA and real people survive', () => {
  const file = 'src/data/agentsSeed.js';
  const clean = `export const AGENTS_MAP={IAIA:{id:'11111111-1a1a-0000-0000-000000000000',type:'AI'},REAL:{id:'real-andreu',name:'Andreu',type:'PERSON'}};`;
  assert.equal(analyseSources({ [file]: clean }).valid, true);
  assert.ok(codes(analyseSources({ [file]: clean.replace("id:'real-andreu',name:'Andreu',type:'PERSON'", "id:'bot',name:'Bot',type:'AI'") })).includes('LU05'));
  assert.ok(codes(analyseSources({ [file]: 'export const AGENTS_MAP=remoteValue;' })).includes('LU05'));
});
test('a historical PERSON bot and a later active-export concatenation cannot evade the purge', () => {
  const file = 'src/data/agentsSeed.js';
  const extra = { 'src/data/catalegAgents.js': "export const IDS_FICCIO_LEGACY=Object.freeze(['11111111-1111-4111-a111-000000000009']);" };
  assert.ok(codes(analyseSources({ ...extra, [file]: "export const AGENTS_MAP={OLD:{id:'11111111-1111-4111-A111-000000000009',type:'PERSON'}};" })).includes('LU05'));
  const safe = "export const AGENTS_MAP={REAL:{id:'real-andreu',name:'Andreu',type:'PERSON'}};export const AGENTS=Object.values(AGENTS_MAP).filter(x=>x.type!=='SYSTEM').map(x=>({id:x.id,type:x.type,name:x.name}));";
  assert.equal(analyseSources({ ...extra, [file]: safe }).valid, true);
  const bad = safe.replace('Object.values(AGENTS_MAP).filter', "Object.values(AGENTS_MAP).concat([{id:'bot',type:'AI'}]).filter");
  assert.ok(codes(analyseSources({ ...extra, [file]: bad })).includes('LU05'));
  assert.ok(codes(analyseSources({ ...extra, [file]: safe.replace('name:x.name', "name:(x.type='AI',x.name)") })).includes('LU05'));
});
test('an imported card wrapper outside the scan roots must still satisfy the grid header contract', () => {
  const r = inspect('import Tile from "../../components/Tile.jsx"; const p=()=> <div className="sdp-card-grid"><Tile/></div>;', {
    'src/components/Tile.jsx': 'export default function Tile(){return <UniversalCard title="Missing header"/>;}'
  });
  assert.ok(codes(r).includes('LU02'));
  assert.ok(r.diagnostics.some(d => d.file === 'src/components/Tile.jsx'));
});
test('syntax errors and cyclic helpers fail without silently shrinking the census', () => {
  const r = inspect('const broken = <');
  assert.equal(r.scannedFiles, 1);
  assert.ok(codes(r).includes('LU00'));
  const cyclic = inspect('import {head} from "./a.js"; const p=()=> <UniversalCard {...head()}/>;', {
    'src/sections/example/a.js': 'export {head} from "./b.js";',
    'src/sections/example/b.js': 'export {head} from "./a.js";'
  });
  assert.ok(codes(cyclic).includes('LU02'));
});
test('repository scan includes no-card routes/apps and refuses symlinked source; CLI propagates failure', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-universal-gate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'src/sections'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src/apps'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src/sections/Page.jsx'), 'const p=()=> <div className="feed-grid"/>;');
  fs.writeFileSync(path.join(dir, 'src/apps/Table.jsx'), 'const p=()=> <table><tbody/></table>;');
  fs.writeFileSync(path.join(dir, 'src/apps/Future.mjs'), 'export const label="A future production module";');
  fs.writeFileSync(path.join(dir, 'src/apps/Future.tsx'), 'const name:string="card"; export const Card=()=> <div className="feed-grid"/>;');
  assert.equal(scanRepository(dir).scannedFiles, 4);
  const run = spawnSync(process.execPath, [path.resolve('tooling/gates/porta-logica-universal.mjs'), '--root', dir, '--json'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.equal(JSON.parse(run.stdout).valid, false);
  fs.symlinkSync(path.join(dir, 'src/sections/Page.jsx'), path.join(dir, 'src/apps/Linked.jsx'));
  assert.throws(() => scanRepository(dir), /Symlink/);
});
