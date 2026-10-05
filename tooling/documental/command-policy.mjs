/** P13 authority: bounded documentary commands are state mutations, never knownRead. */
import fs from 'node:fs';
import path from 'node:path';
import {DESK, humanZone, loadContract, resolveRoute, parseDocument, validateSchema, turnPattern, sha} from './core.mjs';
import {readTurn, validateDocument, activeReceipts} from './turns.mjs';
import {normalizeShellCommand} from '../gates/mutation-policy.mjs';

// A deliberately small argv language. No shell expansion, escapes, globs or operators.
export function documentArgv(command) {
  if (typeof command !== 'string' || !command.trim() || /[\0\r\n$`\\;&|<>]/.test(command) || /[^\S \t]/u.test(command)) throw new Error('Shell documental no literal');
  const words=[]; let word='', quote=null, started=false;
  for (const character of command.trim()) {
    if (quote) {
      if (character===quote) quote=null; else word+=character;
      continue;
    }
    if (character==='"'||character==="'") {quote=character;started=true;continue;}
    if (character === ' ' || character === '\t') {
      if(started){words.push(word);word='';started=false;}
    } else {
      if(/[(){}[\]*?!#~]/.test(character)) throw new Error('Expansió de shell no admesa');
      word+=character;started=true;
    }
  }
  if(quote) throw new Error('Cometes incompletes');
  if(started)words.push(word);
  return words;
}
function physical(root, relative) {
  if(typeof relative!=='string'||!relative||path.isAbsolute(relative)||relative.includes('\\')||relative.split('/').some(part=>!part||part==='.'||part==='..')) throw new Error('Ruta documental no canònica');
  let current=root;
  for(const part of relative.split('/')) {
    current=path.join(current,part);
    try {
      const stat=fs.lstatSync(current);
      if(stat.isSymbolicLink()||(stat.isFile()&&stat.nlink!==1)) throw new Error('Ruta documental amb symlink/hardlink');
    } catch(error){if(error.code!=='ENOENT')throw error;}
  }
  return current;
}
function flags(words, permitted, required=[]) {
  const values={};
  for(let i=0;i<words.length;i+=2){
    const flag=words[i];
    if(!/^--[a-z-]+$/.test(flag)||!permitted.includes(flag.slice(2))||Object.hasOwn(values,flag.slice(2))) throw new Error(`Flag documental no autoritzat/repetit: ${flag}`);
    const value=words[i+1];
    if(typeof value!=='string'||!value.trim()||value.startsWith('--'))throw new Error(`Valor absent: ${flag}`);
    values[flag.slice(2)]=value;
  }
  if(required.some(key=>!values[key]))throw new Error('Falten paràmetres documentals obligatoris');
  return values;
}
function documentPath(root, file, {named=true}={}) {
  const target=physical(root,file);
  if(!file.startsWith(`${DESK}/`)||humanZone(file)||!file.endsWith('.md'))throw new Error('Destí fora de l’Escriptori documental');
  if(named&&!/^\d{6}_\d{4}_[a-z0-9_]+\.md$/.test(path.basename(file)))throw new Error('Nom documental invàlid');
  return target;
}
/** null = unrelated command; a matched invalid command throws. No writes occur here. */
export function authorizeDocumentCommand(payload, root) {
  if(!['Bash','exec_command','run_command'].includes(payload.tool_name))return null;
  const command=normalizeShellCommand(payload,root);
  // Parse every candidate, including quoted spellings; all other commands stay denied by the host.
  let argv;
  try{argv=documentArgv(command);}catch(error){if(command.includes('document.mjs')||command.includes('obrir_torn.mjs'))throw error;return null;}
  if(argv[0]!=='node'||!['tooling/wiki/document.mjs','tooling/gates/obrir_torn.mjs'].includes(argv[1]))return null;
  root=fs.realpathSync(root);
  if(!fs.statSync(physical(root,argv[1])).isFile())throw new Error('CLI documental no regular');
  physical(root,'.agents/runtime');physical(root,'.agents/runtime/turns');physical(root,'.agents/runtime/contracts');
  if(argv[1]==='tooling/gates/obrir_torn.mjs') {
    const opts=flags(argv.slice(2),['actor','scope'],['scope']);
    if(!['documents','code'].includes(opts.scope))throw new Error('Abast documental desconegut');
    if(opts.actor&&opts.actor.length>120)throw new Error('Actor massa llarg');
    loadContract(root,{templates:false});
    return {kind:'document-mutation',command:'open'};
  }
  const action=argv[2];
  const specifications={context:[['turn-id','route','file'],['turn-id','route','file']],create:[['turn-id','route','file','title','description','actor'],['turn-id','route','file','title','description']],plan:[['turn-id','file'],['turn-id','file']],check:[['file'],['file']],own:[['turn-id','file'],['turn-id','file']]};
  if(!Object.hasOwn(specifications,action))throw new Error('Operació fora del circuit documental ordinari');
  const opts=flags(argv.slice(3),...specifications[action]);
  const file=documentPath(root,opts.file,{named:action!=='check'});
  if(action==='check')return {kind:'read',command:action,file:opts.file};
  if(!turnPattern.test(opts['turn-id']))throw new Error('Identificador de torn invàlid');
  physical(root,`.agents/runtime/turns/${opts['turn-id']}.json`);
  physical(root,`.agents/runtime/turns/${opts['turn-id']}.json.lock`);
  const turn=readTurn(root,opts['turn-id']);
  if(action==='context'||action==='create') {
    const contract=loadContract(root,{route:opts.route}), route=resolveRoute(contract,{route:opts.route});
    physical(root,`.agents/runtime/contracts/${sha(JSON.stringify(contract))}.json`);
    if(!(route.destins||[DESK]).some(dir=>opts.file.startsWith(`${dir}/`)))throw new Error('Destí divergent de ruta');
    if(action==='create') {
      if(!activeReceipts(turn).some(receipt=>receipt.route===route.id&&receipt.file===opts.file))throw new Error('Cal context entregat per a este document abans de create');
      if(fs.existsSync(file))throw new Error('create no sobreescriu documents');
      if(opts.title.length>300||opts.description.length>1000||opts.actor?.length>120)throw new Error('Metadades documentals massa llargues');
      const errors=validateSchema({...route.output,description:opts.description,visibility:'private'},contract.schema);
      if(errors.length)throw new Error(errors.join('; '));
      physical(root,`${DESK}/00_index_escriptori.md`);
      physical(root,'.agents/runtime/document-create.lock');
    }
  } else if(action==='plan') {
    const content=fs.readFileSync(file,'utf8');
    const parsed=parseDocument(content);
    const errors=validateDocument(root,content,opts.file,{closed:true});
    if(parsed.data.type!=='document'||errors.length)throw new Error(`Pla documental invàlid: ${errors.join('; ')}`);
    if(!activeReceipts(turn).length)throw new Error('Cal context actiu abans de vincular pla');
  } else if(!activeReceipts(turn).some(receipt=>receipt.file===opts.file)&&turn.plan?.file!==opts.file)throw new Error('own només per a documents amb rebut o pla d’este torn');
  return {kind:'document-mutation',command:action,file:opts.file,turnId:turn.turn_id};
}
