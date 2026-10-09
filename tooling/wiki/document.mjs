#!/usr/bin/env node
import { esMain } from '../lib/arrel.mjs';
/** Explicit, host-independent delivery of templates and generation of indexed drafts. */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { ROOT, options } from '../documental/cli.mjs';
import { loadContract, validateSchema, parseDocument } from '../documental/core.mjs';
import { checkDraftDestinations, writeIndexedDraft } from '../documental/draft-write.mjs';
import { deliverContext, bindPlan, validateDocument, ownPaths, handoffDocument, commitCreation, failCreation } from '../documental/turns.mjs';

export function draft(delivery, {title, description, actor='agent-local'}) {
  const now = new Date().toISOString();
  const data = {...delivery.route.output, description, visibility:'private', reflex:delivery.reflex};
  const values = {Identificador:delivery.reflex, 'Versió del document':'1.0.0', Entorn:'entorn-dev-local',
    'Creació':now, 'Modificació':now, Propietari:actor, 'Aprovació humana':'pendent', Plantilla:`${delivery.route.plantilla} (v${delivery.route.version})`, 'Model IA':'[pendent]', 'Tokens consumits':'[pendent]'};
  const body = delivery.route.seccions.map(section => {
    const content = delivery.route.fixedBlocks?.[section] ?? (section === 'Registre' ? '| Camp | Valor |\n| --- | --- |\n'+Object.entries(values).map(([k,v])=>`| ${k} | ${v} |`).join('\n')
      : section === 'Acte reflex' ? `Plantilla entregada: ${delivery.route.plantilla}; SHA-256 ${delivery.route.templateHash}. El rebut acredita entrega, no comprensió.`
      : section === 'Historial' ? `${now}: esborrany creat; contingut i verificació pendents.`
      : section === 'Vincles' ? '- [[00_index]]\n- [[00_index_escriptori]]' : '[pendent]');
    const sectionId=delivery.route.sectionIds?.[section];
    return `${sectionId ? `<!-- SDP:SECTION ${sectionId} -->\n` : ''}## ${section}\n\n${content}`;
  }).join('\n\n');
  const templateBody=parseDocument(delivery.template).body;
  const prelude=/^# [^\n]*\n([\s\S]*?)(?=^## )/m.exec(templateBody)?.[1]?.trim() || '';
  return `---\n${yaml.dump(data,{schema:yaml.JSON_SCHEMA,lineWidth:-1,noRefs:true})}---\n# ${title}\n\n${prelude ? prelude+'\n\n' : ''}${body}\n`;
}
export function createDraft(root, id, opts) {
  if (!opts.title || !opts.description) throw new Error('Cal --title i --description');
  root = fs.realpathSync(root);
  const file = path.resolve(root, opts.file);
  checkDraftDestinations(root, file);
  const delivery = deliverContext(root,id,{...opts, creation:true});
  try {
    const raw = draft(delivery,opts);
    const contract = loadContract(root,{templates:false});
    const errors = validateSchema({...delivery.route.output,description:opts.description,visibility:'private',reflex:delivery.reflex},contract.schema);
    if (errors.length) throw new Error(errors.join('\n'));
    const escrit = writeIndexedDraft(root, file, raw, { requireCleanTable: ['prompt.local', 'prompt.consell'].includes(delivery.route.id) });
    commitCreation(root,id,delivery.reflex,raw);
    // 261009: en fase «avis» la convocatòria v4 avisa; els de dins del lock són els més recents.
    const avisos = escrit?.avisos ?? delivery.avisos ?? [];
    return {file:opts.file,reflex:delivery.reflex,state:'draft',note:'Completa les seccions [pendent] abans de validar.',...(avisos.length ? {avisos} : {})};
  } catch (error) {
    // Si hi ha un fitxer parcial/concurrent o falla la metadata, el rebut queda
    // preparat i visible per a recuperació. Mai certifiquem una absència falsa.
    try { failCreation(root,id,delivery.reflex); } catch { /* pendent, sense eliminar res */ }
    throw error;
  }
}
/** 261009: els avisos de la convocatòria v4 (fase «avis») van per stderr; el JSON de stdout es conserva. */
function avisa(avisos) {
  for (const a of Array.isArray(avisos) ? avisos : []) console.error(`[Convocatòria v4 · avís] ${a}`);
}

async function main() {
  const o=options(), root=path.resolve(o.arrel || ROOT), command=o._[0];
  let result;
  if(o.help || !command) {
    console.log('Ús: document.mjs context|create|plan|check|own|handoff|import --turn-id ID --route ID --file CAMÍ\ncreate: --title TÍTOL --description DESCRIPCIÓ [--actor NOM]\nown: --file CAMÍ (repetix la comanda per cada fitxer)\nhandoff: --file ORIGEN --to DESTÍ (després del moviment explícit)\nRutes: '+loadContract(root,{templates:false}).router.rutes.map(r=>r.id).join(', '));
    return;
  }
  if(command==='import') {const {importDocument}=await import('../documental/import.mjs');result=importDocument(root,o['turn-id'],o);}
  else if(command==='own') result=ownPaths(root,o['turn-id'],[o.file]);
  else if(command==='handoff') result=handoffDocument(root,o['turn-id'],o.file,o.to);
  else if (command==='context') {
    const d=deliverContext(root,o['turn-id'],{route:o.route,file:o.file});
    result={reflex:d.reflex,route:d.route.id,template:d.template};
    avisa(d.avisos);
  } else if(command==='create') { result=createDraft(root,o['turn-id'],{route:o.route,file:o.file,title:o.title,description:o.description,actor:o.actor}); avisa(result.avisos); }
  else if(command==='plan') {const t=bindPlan(root,o['turn-id'],o.file);result={turn_id:t.turn_id,state:t.state,plan:t.plan};}
  else if(command==='check') {const errors=validateDocument(root,fs.readFileSync(path.join(root,o.file),'utf8'),o.file,{closed:true});result={valid:!errors.length,errors};process.exitCode=errors.length?1:0;}
  else throw new Error('Ús: document.mjs context|create|plan|check --turn-id ID --route ID --file CAMÍ');
  console.log(JSON.stringify(result,null,2));
}
if (esMain(import.meta.url)) {
  main().catch(e=>{console.error(e.message);process.exitCode=1;});
}
