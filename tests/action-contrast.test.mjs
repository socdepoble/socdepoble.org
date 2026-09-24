import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const css=fs.readFileSync(new URL('../src/css/components.css',import.meta.url),'utf8');
const tokens=fs.readFileSync(new URL('../src/css/tokens.css',import.meta.url),'utf8');
const declarations=source=>Object.fromEntries([...source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const dark=tokens.indexOf(':root[data-theme="dark"]');
assert(dark>0);
const base=declarations(tokens.slice(0,dark));
const resolve=(value,map,seen=new Set())=>value.replace(/var\((--[\w-]+)\)/g,(_,name)=>{
  assert(!seen.has(name),`cycle ${name}`);assert(map[name],`missing ${name}`);
  return resolve(map[name],map,new Set([...seen,name]));
}).trim();
const luminance=hex=>{
  assert.match(hex,/^#[0-9a-f]{6}$/i);
  const v=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return .2126*v[0]+.7152*v[1]+.0722*v[2];
};
const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const rule=selector=>{
  const body=new RegExp('(?:^|\\n)\\s*'+escaped(selector)+'\\s*\\{([^{}]*)\\}','m').exec(css)?.[1];
  assert(body,`missing rule ${selector}`);
  return Object.fromEntries(body.split(';').map(part=>/^\s*([\w-]+):\s*(.+)$/.exec(part.trim())).filter(Boolean).map(m=>[m[1],m[2].trim()]));
};
for(const mode of ['light','dark']){
  const map=mode==='light'?base:{...base,...declarations(tokens.slice(dark))};
  for(const [selector,hover] of [
    ['.sdp-boto--primari',':hover:not(:disabled)'],['.btn-secondary',':hover:not(:disabled)'],
    ['.pill--primary',':hover'],['.sdp-paginacio__num[aria-current="page"]',null],['.btn-connectar',':hover:not(:disabled)']
  ]){
    for(const state of hover?['normal','hover']:['normal'])test(`${mode} ${selector} ${state}: text d’acció supera AA`,()=>{
      const props={...rule(selector),...(state==='hover'?rule(selector+hover):{})};
      assert(props.color&&props.background);
      const a=luminance(resolve(props.color,map)),b=luminance(resolve(props.background,map));
      const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      assert(ratio>=4.5,`contrast ${ratio.toFixed(2)}:1`);
    });
  }
}
