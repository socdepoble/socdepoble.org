import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const ast=postcss.parse(readFileSync(new URL('../src/css/modules.css',import.meta.url),'utf8'));
const all=[];ast.walkRules(rule=>all.push(rule));
const declara=selector=>Object.fromEntries(all.filter(r=>r.selectors.includes(selector)).flatMap(r=>r.nodes.filter(d=>d.type==='decl').map(d=>[d.prop,d.value])));
test('compte deixa el scroll al pare; l’editor conserva el seu contenidor',()=>{
 const standalone=declara('.sdp-drets'),inline=declara('.perfil-compte .sdp-drets');
 assert.equal(standalone['overflow-y'],'auto');assert.equal(standalone['overscroll-behavior'],'contain');
 assert.equal(inline.overflow,'visible');assert.equal(inline.flex,'none');assert.equal(inline['overscroll-behavior'],'auto');
 const footer=declara('.sdp-drets__peu');assert.equal(footer.position,'sticky');assert.equal(footer.bottom,'0');
});
