import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { construeixManifest, verificaEnllacos } from '../tooling/wiki/compile-wiki-to-app.mjs';
import { checkSchema, validateSchema } from '../tooling/documental/core.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-wiki-r329-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); return file;
  };
  return { root, write };
}
const doc = (meta = '') => `---\ntype: document\n${meta}---\n# Capítol de prova\nCos íntegre.\n`;

test('tots els públics propaguen editorial resolta, booleans estrictes i dates manuals exactes', t => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/01_ser/article.md', doc('image: /assets/ui/foto.jpg\nimageAlt: La foto del capítol\ndate: 2026-11-17T00:14:00+01:00\nupdated: 2026-11-17T20:15:00+01:00\nversion: 2.1.0\nrevisions: 7\nmur: true\n'));
  write('_wiki_de_poble/02_saber/llegat.md', '# Llegat sense frontmatter');
  write('_wiki_de_poble/03_actuar/dades.json', JSON.stringify({ title: 'JSON públic', mur: false, revisions: 4 }));
  const m = construeixManifest(root);
  assert.equal(m.items.length, 3);
  const a = m.items.find(i => i.id === 'article');
  for (const key of ['image','imageAlt','date','updated','version','revisions','mur']) assert.equal(a[key], a.attributes[key], key);
  assert.equal(a.image, '/assets/ui/foto.jpg'); assert.equal(a.imageAlt, 'La foto del capítol'); assert.equal(a.mur, true);
  assert.equal(a.date, '2026-11-17T00:14:00+01:00'); assert.equal(a.updated, '2026-11-17T20:15:00+01:00'); assert.equal(a.revisions, 7); assert.equal(a.version, '2.1.0');
  for (const i of m.items) { assert.ok(Number.isFinite(Date.parse(i.date))); assert.ok(Number.isFinite(Date.parse(i.updated))); assert.equal(typeof i.mur, 'boolean'); assert.ok(Number.isSafeInteger(i.revisions)); }
  assert.equal(m.items.find(i => i.id === 'llegat').mur, false);
});

test('sense .git ni rellotge, la reserva és estable fins i tot si canvia mtime', t => {
  const { root, write } = fixture(t);
  const file = write('_wiki_de_poble/01_ser/sense_data.md', '# Llegat');
  write('_wiki_de_poble/02_saber/261117_2024_cronica.md', '# Crònica');
  const a = construeixManifest(root).items;
  fs.utimesSync(file, new Date('2000-01-01'), new Date('2030-01-01'));
  assert.deepEqual(construeixManifest(root).items, a);
  assert.equal(a.find(i => i.id === 'sense_data').date, '1970-01-01T00:00:00Z');
  assert.equal(a.find(i => i.id === '261117_2024_cronica').date, '2026-11-17T20:24:00Z');
  assert.equal(a.find(i => i.id === 'sense_data').revisions, 0);
});

test('git --follow usa committer ISO i compta commits a través d’un canvi de nom', t => {
  const { root, write } = fixture(t);
  const git = (args, when = '2024-01-01T01:02:03+00:00') => {
    const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'user.name=Prova', '-c', 'user.email=prova@example.invalid', ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE:'2001-01-01T00:00:00+00:00', GIT_COMMITTER_DATE:when } });
    assert.equal(r.status, 0, r.stderr); return r.stdout;
  };
  git(['init','--quiet']);
  write('_wiki_de_poble/01_ser/abans.md', doc()); git(['add','.']); git(['commit','--quiet','-m','creació']);
  git(['mv','_wiki_de_poble/01_ser/abans.md','_wiki_de_poble/01_ser/ara.md']);git(['commit','--quiet','-m','renom'], '2025-02-03T04:05:06+01:00');
  write('_wiki_de_poble/01_ser/ara.md', `${doc()}Actualització.\n`);git(['add','.']);git(['commit','--quiet','-m','revisió'], '2026-03-04T05:06:07+01:00');
  const [i] = construeixManifest(root).items;
  assert.equal(i.date, '2024-01-01T01:02:03Z');assert.equal(i.updated, '2026-03-04T05:06:07+01:00');assert.equal(i.revisions, 3);
  write('_wiki_de_poble/01_ser/ara.md', doc('date: 2020-05-06\nupdated: 2026-06-07T01:02:03Z\nrevisions: 19\n'));
  const [manual] = construeixManifest(root).items;
  assert.equal(manual.date, '2020-05-06');assert.equal(manual.updated,'2026-06-07T01:02:03Z');assert.equal(manual.revisions,19);
});

for (const meta of ['mur: "true"','mur: si','mur: 1','revisions: -1','revisions: 1.5','revisions: "2"','date: ahir','date: 2026-02-30','updated: 2026-11-17T25:00:00Z','image: https://extern.invalid/a.jpg','image: /assets/../secret.jpg','image: /assets/a.svg','image: /assets/a.jpg?x=1','imageAlt: [a,b]','version: [a,b]']) {
  test(`metadada editorial invàlida falla sense publicar: ${meta}`, t => {
    const { root, write } = fixture(t); write('_wiki_de_poble/01_ser/incorrecte.md', doc(`${meta}\n`));
    assert.throws(() => construeixManifest(root), /metadad|editorial/i);
  });
}

test('literals YAML en CRLF/comentaris i JSON tipat conserven false sense truthiness', t => {
  const {root,write}=fixture(t);
  write('_wiki_de_poble/01_ser/crlf.md',doc('mur: false # decisió editorial\nrevisions: 0 # cap commit\n').replaceAll('\n','\r\n'));
  write('_wiki_de_poble/01_ser/json.json',JSON.stringify({mur:true,revisions:2,date:'2024-02-29',updated:'2026-11-17T20:24:02.123+01:00'}));
  const items=construeixManifest(root).items;
  assert.equal(items.find(i=>i.id==='crlf').mur,false);assert.equal(items.find(i=>i.id==='crlf').revisions,0);
  assert.equal(items.find(i=>i.id==='json').mur,true);assert.equal(items.find(i=>i.id==='json').date,'2024-02-29');
  assert.deepEqual(items.find(i=>i.id==='crlf').origenEditorial,{date:'reserva',updated:'reserva',revisions:'frontmatter'});
});

test('els atributs privats invàlids mai es publiquen ni bloquegen el llibre públic', t=>{
  const {root,write}=fixture(t);
  write('_wiki_de_poble/01_ser/public.md',doc());
  write('_wiki_de_poble/01_ser/privat.md',doc('visibility: private\nmur: "true"\nimage: https://privat.invalid/secret.jpg\n'));
  assert.deepEqual(construeixManifest(root).items.map(i=>i.id),['public']);
});
for(const value of [false,'true',-1,1.5,9007199254740992,null]) {
  test(`JSON revisions invàlid no es coerceix: ${JSON.stringify(value)}`, t=>{
    const {root,write}=fixture(t);write('_wiki_de_poble/01_ser/a.json',JSON.stringify({revisions:value}));assert.throws(()=>construeixManifest(root),/editorial/);
  });
}
for(const date of ['2023-02-29','2026-13-01','2026-11-17T20:24:00','2026-11-17T20:24:00+01:99','2026-11-17T20:24:60Z']) {
  test(`data impossible/ambigua no s’inventa: ${date}`,t=>{
    const {root,write}=fixture(t);write('_wiki_de_poble/01_ser/a.md',doc(`date: ${date}\n`));assert.throws(()=>construeixManifest(root),/editorial/);
  });
}


test('schema viu i validator documental admeten rangs i default inert sense relaxar tipus',()=>{
  const schema=JSON.parse(fs.readFileSync(new URL('../tooling/wiki/schema.json',import.meta.url),'utf8'));
  assert.doesNotThrow(()=>checkSchema(schema));
  for(const value of [-1,1.5,9007199254740992,'2',null]) assert.ok(validateSchema(value,schema.properties.revisions).length);
  for(const value of [0,1,9007199254740991]) assert.deepEqual(validateSchema(value,schema.properties.revisions),[]);
  assert.deepEqual(validateSchema(false,schema.properties.mur),[]);assert.ok(validateSchema('false',schema.properties.mur).length);
  const doc={type:'document',status:'canonic',description:'Una descripció prou llarga'};
  assert.deepEqual(validateSchema(doc,schema),[]);assert.equal(Object.hasOwn(doc,'mur'),false,'default és anotació, no mutació');
  for(const invalid of [{type:'string',minimum:0},{type:'number',minimum:'0'},{type:'number',maximum:Infinity},{type:'integer',minimum:5,maximum:4},{type:'number',minimum:0,exclusiveMinimum:1}]) assert.throws(()=>checkSchema(invalid));
  assert.deepEqual(validateSchema(0.5,{type:'number',minimum:0,maximum:1}),[]);assert.ok(validateSchema(NaN,{type:'number'}).length);
});


test('quatre SKILL canòniques enllacen al graf públic sense llegir governança; una absent continua trencada',t=>{
  const {root,write}=fixture(t);
  const skills=['sdp-workflow','core-tecniques-investigacio','core-gauntlet-loop','sdp-vigilant-tellado'];
  write('_wiki_de_poble/01_ser/sistema.md',doc()+skills.map(id=>`[[${id}_SKILL|${id}]]`).join('\n')+'\n[[absent_SKILL|No existix]]');
  for(const id of skills)write(`.agents/skills/${id}/SKILL.md`,'Cos privat mai exportable');
  const read=fs.readFileSync;
  t.mock.method(fs,'readFileSync',function(file,...args){if(String(file).includes('/.agents/'))throw new Error('No llegiu governança privada');return read.call(this,file,...args);});
  const manifest=construeixManifest(root),[item]=manifest.items;
  for(const id of skills)assert.ok(item.content.includes(`(/consola/explorador?peca=${encodeURIComponent('skill:'+id)})`));
  assert.ok(!JSON.stringify(manifest.items).includes('Cos privat'));assert.equal(manifest.items.length,1);
  const result=verificaEnllacos(root,manifest,{log:{log(){},error(){}}});assert.deepEqual(result.trencats,[{item:'sistema',target:'absent_SKILL'}]);
});

test('un symlink SKILL no crea un fals destí públic ni exposa un fitxer extern',t=>{
  const {root,write}=fixture(t);write('_wiki_de_poble/01_ser/a.md',doc()+'[[fora_SKILL|Fora]]');
  const external=write('outside/secret.md','SECRET');fs.mkdirSync(path.join(root,'.agents/skills/fora'),{recursive:true});fs.symlinkSync(external,path.join(root,'.agents/skills/fora/SKILL.md'));
  const m=construeixManifest(root);assert.ok(m.items[0].content.includes('(?item=fora_SKILL)'));assert.equal(verificaEnllacos(root,m,{log:{log(){},error(){}}}).trencats.length,1);
});
