#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,options} from '../documental/cli.mjs';
import {relativePath} from '../documental/core.mjs';
export function checkAuthority(root,{write=false}={}) {
 const errors=[];
 try {
  const source=fs.readFileSync(path.join(root,'AGENTS.md'),'utf8');
  const mirror=path.join(root,'.agents/AGENTS.md');
  if(write) fs.writeFileSync(mirror,source);
  if(fs.readFileSync(mirror,'utf8')!==source) errors.push('Mirall AGENTS divergent');
  const map=JSON.parse(fs.readFileSync(path.join(root,'.agents/cervell.json'),'utf8'));
  if(map.dimensions.length!==8||new Set(map.dimensions.map(x=>x.id)).size!==8) errors.push('Calen huit dimensions úniques');
  const links=[...source.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(m=>m[1]).filter(x=>!/^https?:/.test(x));
  for(const rel of [...map.entrada,...map.dimensions.map(x=>x.ruta),...links]) {
   relativePath(root,rel);
   let current=root;
   for(const part of rel.split('/')) {
    if(!fs.readdirSync(current).includes(part)) {errors.push(`Ruta absent o caixa divergent: ${rel}`);break;}
    current=path.join(current,part);
   }
  }
 }catch(e){errors.push(e.message);}
 return {valid:!errors.length,errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const o=options(),result=checkAuthority(path.resolve(o.arrel||ROOT),{write:!!o.write});
 console.log(JSON.stringify(result,null,2));process.exitCode=result.valid?0:1;
}
