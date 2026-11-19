import { expect, test } from 'vitest';
import { performance } from 'node:perf_hooks';
import { tokenitza, titolDeDocument, construeixIndex, documentsDePageCopy, respostaDeLaIAIA, oblidaIndexDeLaWiki } from './iaiaLocal.js';
import { textPlaIaia, senseDestinsIaia, substituixCodiIaia, senseComentarisTancatsIaia, senseTanquesIaia, substituixNomsCodiIaia, senseContactesIaia, senseFrontmatterIaia } from './iaiaTextSegur.js';
const oldPlain=(md,point=true)=>{const s=md.replace(/[ \t]+#+[ \t]*$/,'').replace(/<[^>]*>/g,'').replace(/`([^`\n]+)`/g,'$1').replace(/!?\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/(\*\*|__)(\S(?:[^\n]*?\S)?)\1/g,'$2').replace(/\*(\S(?:[^*\n]*?\S)?)\*/g,'$1').replace(/(^|[\s(])_(\S(?:[^_\n]*?\S)?)_(?=$|[\s).,;:!?])/g,'$1$2').trim();const p=/^([\s\S]*[^.])\.$/.exec(s);return point&&p?p[1].replace(/\s+$/,''):s;};
test('linear scanners preserve bounded historical inline/prose/comment/code/email contracts',()=>{
 let state=1234567;const alphabet='aA _*[]()<>`#\n\t.!@/\\-';const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
 for(let k=0;k<4000;k++){const s=Array.from({length:random()%96},()=>alphabet[random()%alphabet.length]).join('');
  expect(textPlaIaia(s),JSON.stringify(s)).toBe(oldPlain(s));
  expect(senseDestinsIaia(s)).toBe(s.replace(/\]\([^)]*\)/g,']'));
  expect(substituixCodiIaia(s,()=> ' ')).toBe(s.replace(/`[^`\n]+`/g,' '));
  expect(senseComentarisTancatsIaia(s)).toBe(s.replace(/<!--[\s\S]*?-->/g,''));
  expect(senseTanquesIaia(s,'```')).toBe(s.replace(/```[^\n]*\n[\s\S]*?```/g,''));
  expect(senseFrontmatterIaia(s)).toBe(s.replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/,''));
  expect(substituixNomsCodiIaia(s)).toBe(s.replace(/\S*[_/\\]\S*|\S+\.(?:md|mjs|js|jsx|json|css|html|sql)\b/giu,' '));
  expect(senseContactesIaia(s)).toBe(s.replace(/@?[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gu,'[contacte omés]'));
 }
});
test('actual IAIA64KiB Markdown/title/code/email paths stay bounded',()=>{
 for(const run of [()=>tokenitza(']('.repeat(32768)),()=>titolDeDocument({id:'lab',content:'# '+'<'.repeat(65534)}),()=>construeixIndex([{id:'lab',title:'Camp',content:'camp\n\n'+'```abc'.repeat(10922)}]),()=>documentsDePageCopy({projecte:{title:'a'.repeat(65534)+'@b',html:'<p>Camp</p>'}})]){const start=performance.now();run();expect(performance.now()-start).toBeLessThan(150);}
});
test('overbudget Unicode/corpus fails explicitly without changing source or claiming no results',async()=>{
 const input='a'+'\u0315\u0300'.repeat(1000);expect(()=>tokenitza(input)).toThrowError();expect(input.length).toBe(2001);
 const document={id:'lab',title:'Camp',content:'a'.repeat(2*1024*1024)};expect(()=>construeixIndex([document])).toThrowError();expect(document.content.length).toBe(2*1024*1024);
 const answer=await respostaDeLaIAIA('camp document',{capaLocal:false,carrega:async()=>({items:[document]})});expect(answer).toMatch(/No he pogut preparar/);expect(answer).not.toContain('/wikidepoble?item=');
});
test('small deadline refuses corpus work before synchronous construction, long question remains null without load',async()=>{
 const answer=await respostaDeLaIAIA('camp document',{capaLocal:false,tempsMaxim:1,carrega:async()=>({items:[{id:'lab',title:'Camp',content:'camp '.repeat(13107)}]})});expect(answer).toMatch(/No he pogut preparar/);
 let calls=0;expect(await respostaDeLaIAIA('<'.repeat(65536),{carrega:async()=>{calls++;return{items:[]};}})).toBeNull();expect(calls).toBe(0);
});

test('deadline and corpus preflight also cover cold offline atlas construction',async()=>{
 oblidaIndexDeLaWiki();const answer=await respostaDeLaIAIA('zzqx document',{tempsMaxim:1,carrega:async()=>({items:[]})});expect(answer).toMatch(/No he pogut preparar/);oblidaIndexDeLaWiki();
});
test('inline edge cases and frontmatter match the old grammar without trimming visible text',()=>{
 for(const s of ['*@**A*','__*__-__','***x***','__x__ __y__','a._x_','---\n---','---\n\n---\nbody','---\n\n---\nbody\n---','---\nx\n---\n   body']){expect(textPlaIaia(s)).toBe(oldPlain(s));expect(senseFrontmatterIaia(s)).toBe(s.replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/,''));}
 for(const s of ['a.js','a.JSX!','a.js.md!','.js','.js.js','x/y','a@host.test','@@a@b.c','a@b.c+d@e.f']){expect(substituixNomsCodiIaia(s)).toBe(s.replace(/\S*[_/\\]\S*|\S+\.(?:md|mjs|js|jsx|json|css|html|sql)\b/giu,' '));expect(senseContactesIaia(s)).toBe(s.replace(/@?[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gu,'[contacte omés]'));}
});
