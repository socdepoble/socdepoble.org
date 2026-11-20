#!/usr/bin/env node
import {esMain} from '../lib/arrel.mjs';
/** Checks the actual worktree, commit or staging area; independent of the editor that wrote it. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT, options } from '../documental/cli.mjs';
import { DESK, protectedPath, humanZone, loadContract, anchored, parseDocument, receiptPattern, readContract, resolveRoute } from '../documental/core.mjs';
import { verificaTracaCaducitat } from '../session/saneja_torns_caducats.mjs';
import { validateDocument, readTurn, isActiveReceipt } from '../documental/turns.mjs';
const git=(root,args)=>execFileSync('git',['--no-optional-locks','-c','core.fsmonitor=false',...args],{cwd:root,encoding:'utf8',timeout:1000,maxBuffer:20*1024*1024});
/** diff-index does not refresh stat data. Unlike porcelain diff, it may include unchanged
 * files with stale mtimes: compare their actual blob bytes to HEAD before selecting them.
 * hash-object is deliberately avoided: configured clean filters may execute arbitrary code. */
function fitxersInstantania(root) {
  const split=s=>s.split('\0').filter(Boolean);
  const candidats=split(git(root,['diff-index','HEAD','--name-only','--diff-filter=ACMR','-z','--',DESK]));
  const blobs=new Map(split(git(root,['ls-tree','-r','-z','HEAD','--',DESK])).map(line=>{
    const m=/^[0-7]{6} blob ([a-f0-9]{40}|[a-f0-9]{64})\t([\s\S]+)$/.exec(line);
    return m ? [m[2],m[1]] : [null,null];
  }));
  const modificats=candidats.filter(file=>{
    if (!protectedPath(root,file)||humanZone(file)) return false;
    const hash=blobs.get(file);
    if (!hash) return true;
    const full=path.join(root,file),stat=fs.lstatSync(full);
    const bytes=stat.isSymbolicLink()?Buffer.from(fs.readlinkSync(full)):fs.readFileSync(full);
    const actual=createHash(hash.length===40?'sha1':'sha256').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    return actual!==hash;
  });
  return [...modificats,...split(git(root,['ls-files','--others','--exclude-standard','-z','--',DESK]))];
}
/** Public snapshots describe current work, never authorise its closure. */
function esEsborranyAcreditat(root, content, file, ara, caducat) {
  try {
    const { data } = parseDocument(content);
    if (data.status !== 'esborrany') return false;
    const m = receiptPattern.exec(data.reflex ?? '');
    if (!m) return false;
    const turn = readTurn(root, m[1], { now: ara, closed: caducat, expired: caducat });
    if (caducat) {
      if (!file.startsWith(`${DESK}/`) || !file.endsWith('.md') || humanZone(file)) return false;
      if (turn.state !== 'closed' || turn.closure?.schema !== 'sdp.turn-expiry.v1' || Date.parse(turn.closure.at) > ara) return false;
      verificaTracaCaducitat(root, turn.closure.audit);
      if (turn.closure.documents?.[file] !== createHash('sha256').update(content).digest('hex')) return false;
    }
    if (!Number.isFinite(Date.parse(turn.createdAt)) || Date.parse(turn.createdAt) > ara) return false;
    const r = turn.receipts[m[2]];
    if (!r) return false;
    if (caducat && (Date.parse(turn.createdAt) > Date.parse(turn.closure.at)
      || !Number.isFinite(Date.parse(r.issuedAt)) || Date.parse(r.issuedAt) > Date.parse(turn.closure.at))) return false;
    const contract = r.contractSnapshot ? readContract(root, r.contractSnapshot) : loadContract(root, {route:r.route});
    const route = resolveRoute(contract, {route:r.route});
    if ((!r.contractSnapshot && turn.contractHash !== contract.hash) || r.templateHash !== route.templateHash || r.routeVersion !== route.version || data.type !== route.tipus) return false;
    return Boolean(r && r.id === m[2] && r.file === file && isActiveReceipt(r)
      && r.creation?.state !== 'prepared' && Date.parse(r.issuedAt) <= ara
      && Date.parse(r.issuedAt) >= Date.parse(turn.createdAt));
  } catch { return false; }
}
export function esEsborranyEnCurs(root, content, file, ara = Date.now()) {
  return esEsborranyAcreditat(root, content, file, ara, false);
}
/** An abandoned draft is inventoried, never presented as verified or current work.
 * Only public snapshots use this classification; staging/closure stay strict. */
export function esEsborranyCaducatAcreditat(root, content, file, ara = Date.now()) {
  return esEsborranyAcreditat(root, content, file, ara, true);
}
export function checkDocuments(root,{staged=false,base=null,all=false,instantania=false,ara=Date.now()}={}) {
  if (instantania && (staged || base)) throw new Error('La instantània pública no substituïx una comprovació de tancament');
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
  } else if(instantania) files=fitxersInstantania(root);
  else if(staged) files=split(git(root,['diff','--cached','--name-only','--diff-filter=ACMR','-z']));
  else if(base) files=split(git(root,['diff',base,'HEAD','--name-only','--diff-filter=ACMR','-z']));
  else files=[...split(git(root,['diff','HEAD','--name-only','--diff-filter=ACMR','-z'])),...split(git(root,['ls-files','--others','--exclude-standard','-z']))];
  files=[...new Set(files)].filter(file=>protectedPath(root,file)&&!humanZone(file));
  const read=file=>staged?git(root,['show',`:${file}`]):base?git(root,['show',`HEAD:${file}`]):fs.readFileSync(path.join(root,file),'utf8');
  const errors=[], enCurs=[], caducatsNoVerificats=[];
  // R32 · D-R30-15: els registres de torn són locals i ja no viatgen amb el commit. Un registre encara
  // versionat (històric) es llig de l'índex o del commit; si no hi és, el de la màquina que el va obrir.
  const versionat=rel=>split(staged?git(root,['ls-files','-z','--',rel]):git(root,['ls-tree','-z','--name-only','HEAD','--',rel])).length>0;
  const readRecord=id=>{
    const rel=`.agents/runtime/turns/${id}.json`, local=path.join(root,rel);
    let raw;
    if(versionat(rel)) raw=read(rel);
    else if(fs.existsSync(local)) raw=fs.readFileSync(local,'utf8');
    else throw new Error(`Registre de torn absent: ${rel}. Els torns són locals (D-R30-15): valida el document a la màquina que el va obrir.`);
    const turn=JSON.parse(raw);
    if(turn.turn_id!==id||turn.schema!=='sdp.turn.v1'||turn.state!=='closed'||!turn.verification?.files) throw new Error('Cal el rebut del torn tancat i segellat');
    return turn;
  };
  // Staging a different contract from the worktree must never validate against the wrong rules.
  if(staged||base) for(const f of ['.agents/protocolledge.json','tooling/wiki/schema.json',...loadContract(root).router.rutes.map(r=>r.plantilla)]) {
    if(read(f)!==fs.readFileSync(path.join(root,f),'utf8')) errors.push(`Contracte de l’índex diferent del disc: ${f}`);
  }
  const index=files.length?read(`${DESK}/00_index_escriptori.md`):'';
  for(const file of files) {
    try {
      if (instantania && esEsborranyCaducatAcreditat(root, read(file), file, ara)) {
        // This only inventories an abandoned draft. Its stale/unverified bytes
        // still fail the normal document gate and can never be staged as verified.
        caducatsNoVerificats.push({ file, estat: 'esborrany_abandonat_no_verificat',
          motiu: 'Torn tancat per caducitat amb traça exacta; requerix relleu explícit per a reprendre o segellar.' });
        continue;
      }
      if (instantania && esEsborranyEnCurs(root, read(file), file, ara)) { enCurs.push(file); continue; }
      errors.push(...validateDocument(root,read(file),file,{closed:true,...((staged||base)?{readRecord,readSnapshot:read}:{})}).map(e=>`${file}: ${e}`));
      if(file!==`${DESK}/00_index_escriptori.md`&&!anchored(index,file)) errors.push(`Sense àncora: ${file}`);
    }catch(e){errors.push(`${file}: ${e.message}`);}
  }
  return {valid:!errors.length,checked:files.length,errors,...(instantania ? { enCurs, caducatsNoVerificats } : {})};
}
if (esMain(import.meta.url)) {
  try{const o=options(),r=checkDocuments(path.resolve(o.arrel||ROOT),o);console.log(JSON.stringify(r,null,2));process.exitCode=r.valid?0:1;}
  catch(e){console.error(JSON.stringify({valid:false,errors:[e.message]}));process.exitCode=1;}
}
