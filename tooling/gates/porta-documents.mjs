#!/usr/bin/env node
/** Checks the actual worktree, commit or staging area; independent of the editor that wrote it. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, options } from '../documental/cli.mjs';
import { DESK, protectedPath, humanZone, loadContract, anchored } from '../documental/core.mjs';
import { validateDocument } from '../documental/turns.mjs';
const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});
export function checkDocuments(root,{staged=false,base=null,all=false}={}) {
  loadContract(root);
  let files;
  const split=s=>s.split('\0').filter(Boolean);
  if(all) {
    files=[];
    function walk(dir) {for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
      const p=`${dir}/${e.name}`;
      if(humanZone(`${p}/`)) continue;
      if(e.isDirectory()) walk(p); else if(e.name.toLowerCase().endsWith('.md')) files.push(p);
    }}
    walk(DESK);
  } else if(staged) files=split(git(root,['diff','--cached','--name-only','--diff-filter=ACMR','-z']));
  else if(base) files=split(git(root,['diff',base,'HEAD','--name-only','--diff-filter=ACMR','-z']));
  else files=[...split(git(root,['diff','HEAD','--name-only','--diff-filter=ACMR','-z'])),...split(git(root,['ls-files','--others','--exclude-standard','-z']))];
  files=[...new Set(files)].filter(file=>protectedPath(root,file)&&!humanZone(file));
  const read=file=>staged?git(root,['show',`:${file}`]):base?git(root,['show',`HEAD:${file}`]):fs.readFileSync(path.join(root,file),'utf8');
  const errors=[];
  const readRecord=id=>{
    const turn=JSON.parse(read(`.agents/runtime/turns/${id}.json`));
    if(turn.turn_id!==id||turn.schema!=='sdp.turn.v1'||turn.state!=='closed'||!turn.verification?.files) throw new Error('Cal versionar el rebut del torn tancat amb el document');
    return turn;
  };
  // Staging a different contract from the worktree must never validate against the wrong rules.
  if(staged||base) for(const f of ['.agents/protocolledge.json','tooling/wiki/schema.json',...loadContract(root).router.rutes.map(r=>r.plantilla)]) {
    if(read(f)!==fs.readFileSync(path.join(root,f),'utf8')) errors.push(`Contracte de l’índex diferent del disc: ${f}`);
  }
  const index=files.length?read(`${DESK}/00_index_escriptori.md`):'';
  for(const file of files) {
    try {
      errors.push(...validateDocument(root,read(file),file,{closed:true,...((staged||base)?{readRecord}:{})}).map(e=>`${file}: ${e}`));
      if(file!==`${DESK}/00_index_escriptori.md`&&!anchored(index,file)) errors.push(`Sense àncora: ${file}`);
    }catch(e){errors.push(`${file}: ${e.message}`);}
  }
  return {valid:!errors.length,checked:files.length,errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try{const o=options(),r=checkDocuments(path.resolve(o.arrel||ROOT),o);console.log(JSON.stringify(r,null,2));process.exitCode=r.valid?0:1;}
  catch(e){console.error(JSON.stringify({valid:false,errors:[e.message]}));process.exitCode=1;}
}
