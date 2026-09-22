#!/usr/bin/env node
/** Read-only view of the canonical contract. Context receipts are issued by document.mjs. */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, options } from '../documental/cli.mjs';
import { loadContract, resolveRoute, hashFile, json } from '../documental/core.mjs';
export const protocolledge=()=>json(path.join(ROOT,'.agents/protocolledge.json'));
export const esquema=()=>json(path.join(ROOT,'tooling/wiki/schema.json'));
export function admesos(key) {const p=esquema().properties[key];return p?.enum||p?.items?.enum||null;}
export const hashPlantilla=hashFile;
export function resolRuta({intencio,recipient,root=ROOT}={}) {return resolveRoute(loadContract(root),{route:intencio,recipient});}
export function contracte({intencio,root=ROOT}={}) {
  const contract=loadContract(root),route=resolveRoute(contract,{route:intencio});
  return {ruta:route,plantilla:route.plantilla,hash:route.templateHash,camps:route.output,seccions:route.seccions,problemes:[]};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try{const o=options();console.log(JSON.stringify(contracte({intencio:o.route||o._[0],root:path.resolve(o.arrel||ROOT)}),null,2));}
  catch(e){console.error(e.message);process.exitCode=1;}
}

/** A suggestion only: authorisation always uses the explicit route bound in the receipt. */
export function suggeriment(file, root=ROOT) {
  const c=loadContract(root), text=path.basename(file||'').replaceAll('_',' ').toLowerCase();
  const candidates=c.router.rutes.map(r=>({r,score:Math.max(0,...(r.claus||[]).filter(k=>text.includes(k.toLowerCase())).map(k=>k.length))})).sort((a,b)=>b.score-a.score);
  if(!candidates[0]?.score || candidates[0].score===candidates[1]?.score) return null;
  return candidates[0].r;
}
