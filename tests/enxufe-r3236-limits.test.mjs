import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const root = process.env.SDP_WP_TEST_ROOT || path.resolve(import.meta.dirname, '..');
const studio = path.join(os.homedir(), '.studio/php-bin');
const php = [process.env.PHP_BIN, 'php', ...(fs.existsSync(studio) ? fs.readdirSync(studio).sort().reverse().map(v => path.join(studio, v, 'php')) : [])].filter(Boolean).find(p => spawnSync(p, ['-v'], {timeout:5000}).status === 0);
const options = {skip:!php && 'PHP absent (PHP_BIN o WordPress Studio).'};
const sha = text => createHash('sha256').update(text).digest('hex');
const manifest = JSON.stringify({schema:'sdp.release.v1',producte:'soc-de-poble',versio:'1.2.19',entrada:{cami:'soc-de-poble.standalone.js',sha256:'a'.repeat(64),integrity:`sha384-${'a'.repeat(64)}`},node:{origen:'https://example.invalid',mode:'remote',desenvolupament:false}});
const inventory = JSON.stringify({fitxers:[{cami:'trossos/required.js'}]});
const seo = JSON.stringify({routes:{mur:{title:'Mur',description:'Descripció'}}});
const readme = '=== Sóc de Poble ===\nStable tag: 1.1.27\n\n== Description ==\nText\n';
const specs = [{reader:'manifest',cap:64*1024,text:manifest},{reader:'inventory',cap:1024*1024,text:inventory},{reader:'readme',cap:256*1024,text:readme},{reader:'seo',cap:2*1024*1024,text:seo}];
function run(cas) {
  // Args poden superar ARG_MAX: el runner envia JSON per stdin, sense fitxers de cache.
  const r = spawnSync(php,['-d','display_errors=stderr',path.join(import.meta.dirname,'fixtures/enxufe-r3236-limits.php'),root],{input:JSON.stringify(cas),encoding:'utf8',maxBuffer:12*1024*1024,timeout:10000});
  assert.equal(r.status,0,r.stderr || r.stdout); return JSON.parse(r.stdout);
}
function input(spec,text=spec.text,extra={}) { return {reader:spec.reader,contents:[text],hash:sha(text),module_exists:true,...extra}; }
for (const spec of specs) {
  test(`${spec.reader}: cap exacte vàlid i lectures curtes conserven el document`,options,()=>{
    const text=spec.text+' '.repeat(spec.cap-Buffer.byteLength(spec.text));
    const r=run(input(spec,text,{read_chunk:17}));
    assert.notEqual(r.result,null); assert.notEqual(r.result,false); assert.equal(r.stats.opens,1); assert.deepEqual(r.stats.warnings,[]);
  });
  test(`${spec.reader}: cap+1 es rebutja abans de parsejar encara que stat diga menys`,options,()=>{
    const text=spec.text+' '.repeat(spec.cap+1-Buffer.byteLength(spec.text));
    const r=run(input(spec,text,{stat_size:1})); assert.equal(r.result,spec.reader==='inventory'?false:null);
  });
  test(`${spec.reader}: lectura retornada acotada també si el fitxer creix molt`,options,()=>{
    const text=spec.text+' '.repeat(spec.cap*3);
    const r=run(input(spec,text,{stat_size:1})); assert.equal(r.result,spec.reader==='inventory'?false:null);
    assert.ok(r.stats.bytes<=spec.cap+8192,`${r.stats.bytes} llegits`);
  });
  test(`${spec.reader}: absent, open fallit i read fallit no produeixen document`,options,()=>{
    for(const extra of [{missing:true},{open_fails:true},{read_fails:true}]) {
      const r=run(input(spec,spec.text,extra)); assert.equal(r.result,spec.reader==='inventory'?false:null);
    }
  });
  if(spec.reader!=='readme') test(`${spec.reader}: JSON curt/truncat es rebutja`,options,()=>assert.equal(run(input(spec,'{"broken":')).result,spec.reader==='inventory'?false:null));
}
test('inventari: el hash i els camins provenen de la mateixa lectura, sense finestra A→B',options,()=>{
  const r=run({reader:'inventory',contents:[inventory,JSON.stringify({fitxers:[]})],hash:sha(inventory),module_exists:false});
  assert.equal(r.result,false,'el mòdul exigit per A falta; B no pot amagar-lo'); assert.equal(r.stats.opens,1);
});
test('inventari: hash distint es rebutja i mòdul present passa',options,()=>{
  assert.equal(run(input(specs[1],inventory,{hash:'0'.repeat(64)})).result,false);
  assert.equal(run(input(specs[1])).result,true);
});
test('query: frontera exacta 8192 bytes i 64 segments; host params vàlids preservats',options,()=>{
  for(const query of ['sdp=/mur','sdp=/mur&host=ok','sdp=/mur&pad='+'x'.repeat(8192-13),'sdp=/mur'+'&host=ok'.repeat(63)]) {
    const r=run(input(specs[3],seo,{reader:'query',query})); assert.equal(r.result,true,query.length); assert.ok(r.unslash_parser>0);
  }
});
test('query: excés de bytes/segments rebutjat abans d’unslash i sense prendre SEO a l’amfitrió',options,()=>{
  for(const query of ['sdp=/mur&pad='+'x'.repeat(8193-13),'sdp=/mur'+'&host=ok'.repeat(64)]) {
    const r=run(input(specs[3],seo,{reader:'query',query})); assert.equal(r.result,false); assert.equal(r.unslash_parser,0); assert.deepEqual(r.stats.filters,[]); assert.equal(r.host_title,'Títol de l’amfitrió'); assert.equal(r.stats.opens,0);
  }
});
test('query: duplicats, arrays, noms codificats/NUL continuen sense projecció',options,()=>{
  for(const query of ['host=ok','sdp=/mur&sdp=/gent','sdp[]=/mur','s%64p=/mur','sdp%00=/mur']) assert.equal(run(input(specs[3],seo,{reader:'query',query})).result,false,query);
});
test('els dos builtins de producció són funcions PHP reals',options,()=>assert.deepEqual(run(input(specs[0])).builtins,[true,true]));
test('canari readme: el text escapa etiquetes i conserva només el marcatge controlat',options,()=>{
  const r=run(input(specs[2],readme,{line_canary:'<img src=x onerror=alert(1)> **Fort** `</script>` javascript:alert(1) https://example.invalid/x'}));
  assert.doesNotMatch(r.render,/<img|<script|<\/script|href="javascript:/i);
  assert.match(r.render,/&lt;img/); assert.match(r.render,/<strong>Fort<\/strong>/); assert.match(r.render,/<code>&lt;\/script&gt;<\/code>/); assert.match(r.render,/<a href="https:\/\/example.invalid\/x">/);
});
test('canari SEO: el títol real escapa també el nom de l’amfitrió',options,()=>{
  const r=run(input(specs[3],seo,{reader:'query',query:'sdp=/mur',site_name:'</title><script>alert(1)</script>'}));
  assert.doesNotMatch(r.host_title,/<script|<\/title>/i); assert.match(r.host_title,/&lt;script&gt;/);
});
test('el detector real reconeix els builtins i continua rebutjant una funció desconeguda',()=>{
  const source=fs.readFileSync(path.join(import.meta.dirname,'enxufe-plugin.test.mjs'),'utf8');
  const slice=(from,to)=>{const start=source.indexOf(from),end=source.indexOf(to,start);assert.ok(start>=0&&end>start);return source.slice(start,end);};
  const script=slice('function nomesCodi(', 'function desequilibris(')+slice('const PHP_INTERN =', '/** -1, 0 o 1,')+slice('function usosDeWordPress(', 'const TEXTOS =')+'\nusosDeWordPress(textos).fora;';
  const fora=vm.runInNewContext(script,{FUNCIONS_WP:{},CLASSES_WP:{},METODES_WP:{},GANXOS_WP:{},GANXOS_EXTERNS:new Set(),EDITOR_WP:{},DADES_WP:{},textos:{'probe.php':"<?php hash('sha256', 'x'); substr_count('x', '&'); funcio_r3236_inexistent();",'includes/bloc/editor.js':'','includes/bloc/block.json':'{}'}},{timeout:1000});
  assert.deepEqual(Array.from(fora),['probe.php: funció funcio_r3236_inexistent']);
});
