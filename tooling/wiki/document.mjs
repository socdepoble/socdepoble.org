#!/usr/bin/env node
/** Explicit, host-independent delivery of templates and generation of indexed drafts. */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { pathToFileURL } from 'node:url';
import { ROOT, options } from '../documental/cli.mjs';
import { DESK, loadContract, validateSchema } from '../documental/core.mjs';
import { deliverContext, bindPlan, validateDocument } from '../documental/turns.mjs';

export function draft(delivery, {title, description, actor='agent-local'}) {
  const now = new Date().toISOString();
  const data = {...delivery.route.output, description, visibility:'private', reflex:delivery.reflex};
  const values = {Identificador:delivery.reflex, 'Versió':'1.0.0', Entorn:'entorn-dev-local',
    'Creació':now, 'Modificació':now, Propietari:actor, 'Aprovació humana':'pendent'};
  const body = delivery.route.seccions.map(section => {
    const content = section === 'Registre' ? '| Camp | Valor |\n| --- | --- |\n'+Object.entries(values).map(([k,v])=>`| ${k} | ${v} |`).join('\n')
      : section === 'Acte reflex' ? `Plantilla entregada: ${delivery.route.plantilla}; SHA-256 ${delivery.route.templateHash}. El rebut acredita entrega, no comprensió.`
      : section === 'Historial' ? `${now}: esborrany creat; contingut i verificació pendents.`
      : section === 'Vincles' ? '- [[00_index]]\n- [[00_index_escriptori]]' : '[pendent]';
    return `## ${section}\n\n${content}`;
  }).join('\n\n');
  return `---\n${yaml.dump(data,{schema:yaml.JSON_SCHEMA,lineWidth:-1,noRefs:true})}---\n# ${title}\n\n${body}\n`;
}
export function createDraft(root, id, opts) {
  if (!opts.title || !opts.description) throw new Error('Cal --title i --description');
  const delivery = deliverContext(root,id,opts);
  const raw = draft(delivery,opts);
  const contract = loadContract(root);
  const errors = validateSchema({...delivery.route.output,description:opts.description,visibility:'private',reflex:delivery.reflex},contract.schema);
  if (errors.length) throw new Error(errors.join('\n'));
  const file = path.join(root,opts.file), indexFile = path.join(root,DESK,'00_index_escriptori.md');
  const lock = path.join(root,'.agents/runtime/document-create.lock');
  const fd = fs.openSync(lock,'wx');
  try {
    const index = fs.readFileSync(indexFile,'utf8');
    const anchor = `[[${path.basename(file,'.md')}]]`;
    fs.writeFileSync(file,raw,{flag:'wx'});
    try { if (!index.includes(anchor)) fs.writeFileSync(indexFile,`${index}\n- ${anchor}\n`); }
    catch (e) { fs.unlinkSync(file); throw e; }
  } finally {fs.closeSync(fd);fs.unlinkSync(lock);}
  return {file:opts.file,reflex:delivery.reflex,state:'draft',note:'Completa les seccions [pendent] abans de validar.'};
}
function main() {
  const o=options(), root=path.resolve(o.arrel || ROOT), command=o._[0];
  let result;
  if (command==='context') {
    const d=deliverContext(root,o['turn-id'],{route:o.route,file:o.file});
    result={reflex:d.reflex,route:d.route.id,template:d.template};
  } else if(command==='create') result=createDraft(root,o['turn-id'],{route:o.route,file:o.file,title:o.title,description:o.description,actor:o.actor});
  else if(command==='plan') {const t=bindPlan(root,o['turn-id'],o.file);result={turn_id:t.turn_id,state:t.state,plan:t.plan};}
  else if(command==='check') {const errors=validateDocument(root,fs.readFileSync(path.join(root,o.file),'utf8'),o.file,{closed:true});result={valid:!errors.length,errors};process.exitCode=errors.length?1:0;}
  else throw new Error('Ús: document.mjs context|create|plan|check --turn-id ID --route ID --file CAMÍ');
  console.log(JSON.stringify(result,null,2));
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {main();} catch(e) {console.error(e.message);process.exitCode=1;}
}
