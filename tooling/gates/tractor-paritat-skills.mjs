#!/usr/bin/env node
/**
 * Auditor read-only del cànon, el mirall Claude i skills_index.json.
 * --arrel DIR [--extern DIR] [--json]. --extern és explícit, mai usa HOME.
 * Una skill global pendent és una discrepància visible, no s'instal·la.
 * El mirall admet symlinks per ID o un únic symlink a l'arrel canònica.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { arrel, esMain } from '../lib/arrel.mjs';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';
import { parseJsonFrontissa } from './fusiona-frontissa-estructural.mjs';

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LIMIT = 1024 * 1024;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const plain = value => value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const normalize = value => value.replace(/\s+/g, ' ').trim();
function regular(file) {
  if (!fs.readdirSync(path.dirname(file)).includes(path.basename(file))) throw new Error('Capitalització física no canònica');
  const st = fs.lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1 || st.size > LIMIT) throw new Error('Fitxer no regular, enllaçat o massa gran');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const before = fs.fstatSync(fd);
    // Sostre físic abans de llegir: encara que el fitxer cresca, només caben
    // la mida declarada i un byte sentinella (sempre <= LIMIT + 1).
    const buffer = Buffer.allocUnsafe(st.size + 1);
    let total = 0;
    while (total < buffer.length) {
      const count = fs.readSync(fd, buffer, total, buffer.length - total, null);
      if (count === 0) break;
      total += count;
    }
    if (total > st.size) throw new Error('Font excedix la mida declarada o el límit de lectura');
    const bytes = buffer.subarray(0,total), after = fs.fstatSync(fd), current = fs.lstatSync(file);
    if (before.ino !== st.ino || before.dev !== st.dev || before.size !== after.size
        || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || bytes.length > LIMIT
        || current.ino !== before.ino || current.dev !== before.dev || current.isSymbolicLink()) throw new Error('Font canviada durant la lectura');
    return { text: new TextDecoder('utf-8', {fatal:true}).decode(bytes), sha256:hash(bytes) };
  } finally { fs.closeSync(fd); }
}
function directory(file) {
  const st = fs.lstatSync(file);
  if (st.isSymbolicLink() || !st.isDirectory()) throw new Error('Directori físic requerit');
  const entries = fs.readdirSync(file, {withFileTypes:true});
  if (entries.length > 4096) throw new Error('Massa entrades al directori');
  return entries.sort((a,b) => a.name.localeCompare(b.name, 'en'));
}
function skill(file, id, canonical) {
  const source = regular(file), fm = parseFrontmatter(source.text), data = fm.data;
  // Els globals poden tindre metadata YAML fora de l'esquema local. Ací
  // només se'n cataloga la identitat: la promoció continua sent una revisió.
  const errors = canonical ? fm.errors : fm.errors.filter(error => /^(?:name|description)(?:[:,]|$)/.test(error));
  if (!fm.hasFrontmatter || errors.length || fm.duplicateKeys.length) throw new Error(`Frontmatter invàlid: ${errors.join('; ') || 'claus duplicades o cap frontmatter'}`);
  if (data.name !== id || typeof data.description !== 'string' || !data.description.trim()) throw new Error('ID o descripció divergent');
  if (canonical && ((data.type ?? data.tipus) !== 'skill' || !['actiu','canonic'].includes(data.status ?? data.estat)
      || !Array.isArray(data.triggers_on) || !data.triggers_on.length
      || data.triggers_on.some(value => typeof value !== 'string' || !value.trim())
      || (data.core !== undefined && !['true','false'].includes(data.core)))) throw new Error('Contracte de skill canònica invàlid');
  return {id,description:normalize(data.description),triggers:data.triggers_on,core:data.core === 'true',sha256:source.sha256};
}

export function auditaParitatSkills(rootOption, {extern = null} = {}) {
  const errors = [], pendentsPromocio = [], source = new Map();
  const add = (code, file, message) => errors.push({code,file,message});
  let root;
  try { root = fs.realpathSync(path.resolve(rootOption)); directory(path.join(root,'.agents')); }
  catch (error) { return {valid:false,skills:0,indexades:0,pendentsPromocio,errors:[{code:'ARREL_INVALIDA',file:'.agents',message:error.message}]}; }
  const canonical = path.join(root,'.agents/skills');
  try {
    for (const entry of directory(canonical)) {
      if (entry.isSymbolicLink()) { add('FONT_SYMLINK',entry.name,'El cànon no admet symlinks'); continue; }
      if (!entry.isDirectory()) continue;
      const rel = `.agents/skills/${entry.name}/SKILL.md`;
      if (!ID.test(entry.name)) { add('FONT_ID_INVALID',rel,'ID de skill invàlid'); continue; }
      try { source.set(entry.name,skill(path.join(canonical,entry.name,'SKILL.md'),entry.name,true)); }
      catch (error) { add('FONT_INVALIDA',rel,error.message); }
    }
    if (source.size === 0) add('CANON_BUIT','.agents/skills','No hi ha fonts canòniques certificables');
  } catch (error) { add('CANON_INVALID','.agents/skills',error.message); }

  let indexed = 0;
  try {
    const index = parseJsonFrontissa(regular(path.join(root,'.agents/skills_index.json')).text);
    if (!plain(index) || index.schema !== 'sdp.skills_index.v1' || !Array.isArray(index.core)
        || !plain(index.plugins) || Object.keys(index).sort().join(',') !== 'core,plugins,schema') throw new Error('Schema skills_index invàlid');
    const entries = [...index.core.map(item => ({item,core:true,key:null})),
      ...Object.entries(index.plugins).map(([key,item]) => ({item,core:false,key}))];
    if (entries.length > 4096) throw new Error('Massa entrades a skills_index');
    const seen = new Set();
    for (const {item,core,key} of entries) {
      indexed++;
      if (!plain(item) || typeof item.name !== 'string' || !ID.test(item.name)) { add('INDEX_INVALID','.agents/skills_index.json','Entrada sense ID vàlid'); continue; }
      const id = item.name;
      if (seen.has(id)) add('INDEX_DUPLICAT',id,'ID repetit en core/plugins');
      seen.add(id);
      if (key !== null && key !== id) add('INDEX_CLAU_DIVERGENT',id,'La clau plugins ha de coincidir amb name');
      const original = source.get(id);
      if (!original) { add('INDEX_ORFE',id,'Entrada sense font canònica'); continue; }
      if (item.path !== `.agents/skills/${id}/SKILL.md`) add('INDEX_RUTA_DIVERGENT',id,'Ruta canònica exacta requerida');
      if (typeof item.description !== 'string' || normalize(item.description) !== original.description
          || !Array.isArray(item.triggers_on) || JSON.stringify(item.triggers_on) !== JSON.stringify(original.triggers)
          || core !== original.core) add('INDEX_METADADES_DIVERGENTS',id,'Descripció, triggers o classificació core divergents');
    }
    for (const id of source.keys()) if (!seen.has(id)) add('INDEX_ABSENT',id,'Font canònica absent de l’índex');
  } catch (error) { add('INDEX_INVALID','.agents/skills_index.json',error.message); }

  const mirror = path.join(root,'.claude/skills');
  try {
    directory(path.join(root,'.claude'));
    const st = fs.lstatSync(mirror);
    if (st.isSymbolicLink()) {
      if (fs.realpathSync(mirror) !== fs.realpathSync(canonical)) throw new Error('Symlink del mirall fora del cànon');
    } else {
      const entries = directory(mirror), names = new Set(entries.map(entry => entry.name));
      for (const id of source.keys()) if (!names.has(id)) add('MIRALL_ABSENT',id,'Falta el symlink del mirall');
      for (const entry of entries) {
        if (!source.has(entry.name)) { add('MIRALL_ORFE',entry.name,'Entrada del mirall sense font canònica'); continue; }
        try {
          const file = path.join(mirror,entry.name);
          if (!fs.lstatSync(file).isSymbolicLink()) throw new Error('Cal un symlink, no una còpia');
          if (fs.realpathSync(file) !== fs.realpathSync(path.join(canonical,entry.name))) throw new Error('Symlink estranger');
        } catch (error) { add('MIRALL_INVALID',entry.name,error.message); }
      }
    }
  } catch (error) { add('MIRALL_INVALID','.claude/skills',error.message); }

  if (extern !== null) {
    try {
      if (typeof extern !== 'string' || !extern.trim()) throw new Error('Ruta --extern buida');
      const external = path.resolve(extern);
      for (const entry of directory(external)) {
        if (entry.isSymbolicLink()) { add('EXTERN_INVALID',entry.name,'No se seguixen symlinks externs'); continue; }
        if (!entry.isDirectory()) continue;
        if (!ID.test(entry.name)) { add('EXTERN_INVALID',entry.name,'ID extern invàlid'); continue; }
        try {
          const item = skill(path.join(external,entry.name,'SKILL.md'),entry.name,false);
          if (!source.has(item.id)) pendentsPromocio.push(item.id);
          else if (item.sha256 !== source.get(item.id).sha256) add('EXTERN_DIVERGENT',item.id,'La font global i la canònica tenen bytes diferents');
        } catch (error) { add('EXTERN_INVALID',entry.name,error.message); }
      }
    } catch (error) { add('EXTERN_INVALID','--extern',error.message); }
  }
  pendentsPromocio.sort();
  errors.sort((a,b) => `${a.code}|${a.file}`.localeCompare(`${b.code}|${b.file}`, 'en'));
  return {valid:errors.length === 0 && pendentsPromocio.length === 0,skills:source.size,indexades:indexed,pendentsPromocio,errors};
}
function argumentsCli(argv) {
  const options = {json:false};
  for(let i=0;i<argv.length;i++) {
    const flag = argv[i];
    if(flag === '--json') { if(options.json) throw new Error('Flag --json repetit'); options.json=true; continue; }
    if(!['--arrel','--extern'].includes(flag)) throw new Error(`Argument desconegut: ${flag}`);
    const value=argv[++i], key=flag.slice(2);
    if(!value || value.startsWith('--') || Object.hasOwn(options,key)) throw new Error(`Valor absent o flag repetit: ${flag}`);
    options[key]=value;
  }
  options.arrel ??= arrel({argv:[],env:{}});
  return options;
}
if(esMain(import.meta.url)) {
  try {
    const options=argumentsCli(process.argv.slice(2)), result=auditaParitatSkills(options.arrel,{extern:options.extern ?? null});
    console.log(options.json ? JSON.stringify(result,null,2) : `${result.valid?'PASSA':'FALLA'}: ${result.skills} skills, ${result.errors.length} errors, ${result.pendentsPromocio.length} pendents de promoció`);
    process.exitCode=result.valid?0:1;
  } catch(error) {console.error(`[tractor-paritat-skills] ${error.message}`);process.exitCode=2;}
}
