#!/usr/bin/env node
/** Host adapters; the contract and receipt checker are shared with the final disk/index gate. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, options } from '../documental/cli.mjs';
import { protectedPath, relativePath, humanZone, parseDocument } from '../documental/core.mjs';
import { suggeriment } from '../wiki/plantilles.mjs';
import { validateDocument } from '../documental/turns.mjs';

function replace(base, oldText, newText, all=false) {
  if (typeof oldText!=='string' || !oldText || typeof newText!=='string') throw new Error('Edició sense text original/resultant');
  const parts=base.split(oldText), count=parts.length-1;
  if (!count || (!all && count!==1)) throw new Error('Edició absent o ambigua; no es pot reconstruir');
  return all ? parts.join(newText) : base.replace(oldText,()=>newText);
}
export function normalitza(payload, root=ROOT) {
  const cwd=payload.cwd ? path.resolve(payload.cwd) : root;
  const ti=payload.tool_input, ta=payload.toolArgs;
  if (!ti && !ta) throw new Error('Dialecte de hook desconegut');
  const dialecte=ti?'claude':'antigravity';
  const fitxer=ti?.file_path||ti?.notebook_path||ta?.TargetFile;
  if (!fitxer) throw new Error('Operació sense ruta; usa la porta final per a shell/Bash');
  if (!protectedPath(root,fitxer,cwd)) return {dialecte,fitxer,fora:true};
  const rel=relativePath(root,fitxer,cwd);
  if(humanZone(rel)) throw new Error('Zona de producció humana protegida');
  let contingut;
  if(typeof ti?.content==='string') contingut=ti.content;
  else if(typeof ta?.CodeContent==='string') contingut=ta.CodeContent;
  else {
    contingut=fs.readFileSync(path.join(root,rel),'utf8');
    if(ti) contingut=replace(contingut,ti.old_string,ti.new_string,ti.replace_all===true);
    else if(Array.isArray(ta.ReplacementChunks)) {
      if(!ta.ReplacementChunks.length) throw new Error('Edició sense fragments');
      // Reject line-based dialects until their exact semantics are implemented.
      for(const chunk of ta.ReplacementChunks) {
        if(chunk.StartLine!==undefined || chunk.EndLine!==undefined) throw new Error('Edició per línies no suportada; envia el document complet');
        contingut=replace(contingut,chunk.TargetContent,chunk.ReplacementContent,chunk.AllowMultiple===true);
      }
    } else contingut=replace(contingut,ta.TargetContent,ta.ReplacementContent,ta.AllowMultiple===true);
  }
  return {dialecte,fitxer:rel,contingut};
}
export function validar(content,file,root=ROOT) {return validateDocument(root,content,file);}
export const llegirFrontmatter=parseDocument;
export function checkPayload(payload,root=ROOT) {
  try {
    const op=normalitza(payload,root);
    if(op.fora) return {code:0,errors:[]};
    const errors=validar(op.contingut,op.fitxer,root);
    return {code:errors.length?(op.dialecte==='claude'?2:1):0,errors,file:op.fitxer};
  } catch(e) {return {code:payload.toolArgs?1:2,errors:[e.message]};}
}
function main() {
  const o=options(),root=path.resolve(o.arrel||ROOT);
  const raw=fs.readFileSync(0,'utf8');
  let result;
  if(raw.trim()) {
    try {result=checkPayload(JSON.parse(raw),root);}
    catch {result={code:2,errors:['Payload il·legible; no es pot demostrar que siga una operació vàlida']};}
  } else if(o._[0]) {
    const file=o._[0];
    const errors=protectedPath(root,file)?validar(fs.readFileSync(path.resolve(root,file),'utf8'),file,root):[];
    result={code:errors.length?1:0,errors};
  } else result={code:1,errors:['Falta payload o fitxer; cap comprovació executada']};
  if(result.errors.length) {
    try {
      const route=suggeriment(result.file||o._[0],root);
      if(route) console.error(`Plantilla suggerida: ${route.id} → ${route.plantilla}\nSkill: ${route.skill}\nSeccions: ${route.seccions.join(', ')}\n${JSON.stringify(route.output,null,2)}\nEl rebut s’emet amb document.mjs context; aquest missatge no n’inventa cap.`);
    } catch { /* The actual validation error below remains blocking. */ }
  }
  if(result.errors.length) console.error(`[PORTA-REFLEX] BLOQUEIG\n${result.errors.join('\n')}\nRecuperació: document.mjs context --turn-id ID --route ID --file CAMÍ; llig la plantilla retornada.`);
  process.exitCode=result.code;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {main();} catch(e){console.error(e.message);process.exitCode=1;}
}
