import test from 'node:test';
import assert from 'node:assert/strict';
import {formataPosse,canonicaPosse,textPosse,clauPosse} from '../tooling/node0/posse/formatador-posse.mjs';
const item=patch=>({recordId:{tenantId:'ac3bec76-255b-5ca2-8886-28fcceab4267',sectionId:'mur',id:'00000000-0000-4000-8000-000000000001'},canonicalUrl:'https://socdepoble.org/mur/historic-123',visibility:'public',title:'Crònica del poble',summary:'Ens trobem a la plaça',tags:['ElRentonar','Comtat'],...patch});
test('POSSE emits clean title, summary, tags and one.org canonical hyperlink',()=>{
  const post=formataPosse(item(),{defaultTags:['SocDePoble']});assert.equal(post.visibility,'public');assert.equal(post.language,'ca');assert.ok(post.status.startsWith('Crònica del poble\n\nEns trobem a la plaça'));
  assert.ok(post.status.includes('#SocDePoble #ElRentonar #Comtat'));assert.ok(post.status.endsWith('https://socdepoble.org/mur/historic-123'));assert.equal((post.status.match(/https:\/\//g)||[]).length,1);
});
test('default tags belong to each bridge and no site/editorial hashtag is imposed globally',()=>{
  const neutral=formataPosse(item({tags:[]}));assert.equal(neutral.tags.length,0);assert.equal(neutral.status.includes('#SocDePoble'),false);
  const other=formataPosse(item({tags:[]}),{defaultTags:['LaCooperativa']});assert.deepEqual(other.tags,['LaCooperativa']);assert.equal(other.status.includes('#SocDePoble'),false);
});
test('canonical requires.org public detail routes and rejects.cat/private/encoded routes',()=>{
  for(const url of['https://socdepoble.cat/mur/123','https://socdepoble.org/notes/private','https://socdepoble.org/api/v1/private','https://socdepoble.org/%6dur/123','https://socdepoble.org/mur/123?token=x','https://socdepoble.org/mur/123#anchor','https://socdepoble.org@evil.example/mur/123','https://socdepoble.org/mur/..','https://socdepoble.org/mur/123\u202e'])assert.throws(()=>canonicaPosse(url));
  for(const route of['mur','mercat','events','calendari','mapa','vehicle','animalets','treball','habitatge','page'])assert.equal(canonicaPosse('https://socdepoble.org/'+route+'/123'),'https://socdepoble.org/'+route+'/123');
});
test('shared R9 donor removes invisible spans, scripts, bidi and old links without double entity decoding',()=>{
  const clean=textPosse('<script>BAD</script><p>Hola <span class="invisible">HIDDEN</span><span class="ellipsis">poble</span> &amp;lt; &amp; la\u202e plaça</p> https://old.blogspot.com/post.html');
  assert.equal(clean,'Hola poble &lt; & la plaça');assert.equal(textPosse('See old.wordpress.com/post'),'See');assert.equal(textPosse('\ud800Salut\udc00'),'�Salut�');
});
test('grapheme-aware scalar budget respects100..500 and never cuts composed emoji',()=>{
  for(const maxim of[100,220,500]){const post=formataPosse(item({title:'👩🏽‍🌾'.repeat(80),summary:'e\u0301🇻🇦'.repeat(150),tags:[]}),{maxim});assert.ok([...post.status].length<=maxim);assert.equal(post.status.isWellFormed(),true);assert.ok(post.status.endsWith(item().canonicalUrl));}
});
test('source private/federated data and accessor fields fail before formatting',()=>{
  for(const patch of[{visibility:'private'},{visibility:'unlisted'},{source:'mastodon'},{title:{}},{recordId:'private:id'}])assert.throws(()=>formataPosse(item(patch)));
  const input=item();Object.defineProperty(input,'summary',{get(){throw Error('SECRET GETTER');}});assert.throws(()=>formataPosse(input),/posse_accessor_rejected/);
});
test('idempotency key is stable across content and slug edits but isolates primary record/account',()=>{
  const remote='https://mastodont.cat/users/depoble',key=clauPosse(item(),remote);assert.equal(key,clauPosse(item({title:'Edited title',summary:'Edited summary',canonicalUrl:'https://socdepoble.org/mur/new-slug'}),remote));assert.notEqual(key,clauPosse(item(),'https://another.example/users/42'));assert.notEqual(key,clauPosse(item({recordId:{...item().recordId,id:'00000000-0000-4000-8000-000000000002'}}),remote));
});
