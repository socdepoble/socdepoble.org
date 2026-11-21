import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-seo-wiki-r329-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => { const f = path.join(root, rel);fs.mkdirSync(path.dirname(f), { recursive: true });fs.writeFileSync(f, text);return f; };
  for (const rel of ['tooling/gates/build-seo-manifest.mjs','tooling/lib/arrel.mjs','tooling/wiki/lib/publication-policy.mjs','src/config/rutaSocial.js']) write(rel, fs.readFileSync(path.join(REPO, rel), 'utf8'));
  fs.symlinkSync(path.join(REPO, 'node_modules'),path.join(root,'node_modules'));
  write('package.json','{"type":"module"}');write('.agents/AGENTS.md','# Fixture');
  write('src/config/sections.js',`export const SECTIONS=[${Array.from({length:16},(_,i)=>`{id:'public${i}',path:'/public${i}'}`).join(',')}];`);
  // La regla real seoWiki té proves Vitest pròpies. Esta sonda del CLI verifica
  // que el productor usa la regla importada i no inventa una segona portada.
  write('src/sections/wiki-de-poble/seoWiki.js',`export function metadadesDeDocumentPublic(item){return {title:'Regla compartida '+item.title,description:'Descripció compartida',image:item.image?{url:'https://socdepoble.org'+item.image,alt:item.imageAlt}:null,...(item.bloquejada?{imatge:{estat:'bloquejada'}}:{})};}`);
  const source = items => write('src/data/wikiManifest.js', `export const wikiManifest=${JSON.stringify({items})};`);
  const run = (...args) => spawnSync(process.execPath,['tooling/gates/build-seo-manifest.mjs',...args],{cwd:root,encoding:'utf8',env:{...process.env,SDP_ARREL:root}});
  return { root, source, run, write };
}
const article = {id:'un_capitol',title:'Un capítol',image:'/assets/ui/foto.jpg',imageAlt:'Foto de prova',date:'2020-05-06T12:13:14+01:00',updated:'2026-11-17T20:15:00+01:00',version:'2.0',revisions:3,attributes:{visibility:'public'}};

test('anti-doorway: les fitxes de poble naixen noindex fins a verificar contingut local', t => {
  const { source, run, write } = fixture(t);
  source([]);
  write('src/sections/pobles/townsSeed.js', `export const MOCK_TOWNS=${JSON.stringify([
    { id: 'sense-cos', title: 'Poble', contingut_local_verificat: true },
    { id: 'plantilla', content: 'Benvinguts al poble' },
    { id: 'boolea-fals', content: 'Crònica', contingut_local_verificat: 'true' },
    { id: 'cos-buit', content: '<p> </p>', contingut_local_verificat: true },
    { id: 'contrastat', content: 'Crònica local contrastada per la redacció.', contingut_local_verificat: true },
    { id: 'privat', content: 'Crònica local', contingut_local_verificat: true, visibility: 'private' }
  ])};`);
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const routes = JSON.parse(result.stdout).routes;
  for (const id of ['sense-cos', 'plantilla', 'boolea-fals', 'cos-buit']) assert.equal(routes[`pobles/${id}`].index, false);
  assert.equal(routes['pobles/contrastat'].index, true);
  assert.equal(routes['pobles/privat'], undefined);
  assert.equal(routes.public0.index, true);
});

test('CLI publica la ruta de compartir Wiki, portada pròpia, dates editorials i verifica lastmod', t => {
  const {root,source,run}=fixture(t);
  source([article,{id:'privat',attributes:{visibility:'private'}},{id:'arxivat',attributes:{status:'arxivat'}}]);
  const result=run('--escriu');assert.equal(result.status,0,result.stderr);
  const out=path.join(root,'wordpress-plugin/dist/seo-routes.json'),manifest=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.deepEqual(manifest.routes['wikidepoble/un_capitol'],{status:200,index:true,title:'Regla compartida Un capítol',description:'Descripció compartida',image:'https://socdepoble.org/assets/ui/foto.jpg',imageAlt:'Foto de prova',type:'Article',lastmod:article.updated,published:article.date,version:'2.0',revisions:3});
  assert.equal(manifest.routes['wikidepoble/privat'],undefined);assert.equal(manifest.routes['wikidepoble/arxivat'],undefined);
  assert.equal(run('--verifica').status,0);
  manifest.routes['wikidepoble/un_capitol'].lastmod='1999-01-01';fs.writeFileSync(out,JSON.stringify(manifest));assert.equal(run('--verifica').status,1);
});
for(const [label,items] of [['identitat duplicada',[article,article]],['identitat invàlida',[{...article,id:'../secret'}]],['imatge externa',[{...article,image:'https://extern.invalid/foto.jpg'}]],['booleà invàlid',[{...article,mur:'true'}]],['imatge bloquejada',[{...article,bloquejada:true}]]]) {
  test(`CLI falla tancat i no escriu si hi ha ${label}`, t=>{
    const {root,source,run}=fixture(t);source(items);const r=run('--escriu');assert.equal(r.status,1);assert.match(r.stderr,/Wiki/);assert.equal(fs.existsSync(path.join(root,'wordpress-plugin/dist/seo-routes.json')),false);
  });
}
