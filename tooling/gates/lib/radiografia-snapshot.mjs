/** R32.52 · JSON no fiable: lectura acotada, gramàtica estricta, esquema tancat.
 * Cap diagnòstic inclou valors, rutes d'entrada ni errors crus del motor.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const LIMITS=Object.freeze({bytes:8*1024*1024,depth:24,nodes:150000,string:65536,rows:10000});
export const sha256=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:canonical(value)).digest('hex');
export function fail(code='snapshot_schema_invalid'){throw Object.assign(new Error(code),{safeCode:code});}
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
/** Scan all keys (including escaped duplicates) before JSON.parse can discard one. */
export function parseStrictJson(source){
 if(typeof source!=='string'||Buffer.byteLength(source)>LIMITS.bytes)fail('snapshot_size_limit');
 let pos=0,nodes=0;const ws=()=>{while(' \n\r\t'.includes(source[pos])&&pos<source.length)pos++;};
 const string=()=>{const start=pos++;let closed=false;while(pos<source.length){const c=source.charCodeAt(pos++);if(c===34){closed=true;break;}if(c<32)fail('snapshot_json_invalid');if(c===92){if(pos>=source.length)fail('snapshot_json_invalid');const esc=source[pos++];if(esc==='u'){for(let n=0;n<4;n++){const cp=source.charCodeAt(pos++);if(!((cp>=48&&cp<=57)||(cp>=65&&cp<=70)||(cp>=97&&cp<=102)))fail('snapshot_json_invalid');}}else if(!'"\\/bfnrt'.includes(esc))fail('snapshot_json_invalid');}if(pos-start>LIMITS.string*6+2)fail('snapshot_string_limit');}if(!closed)fail('snapshot_json_invalid');let v;try{v=JSON.parse(source.slice(start,pos));}catch{fail('snapshot_json_invalid');}if(v.length>LIMITS.string)fail('snapshot_string_limit');return v;};
 const value=depth=>{if(depth>LIMITS.depth)fail('snapshot_depth_limit');if(++nodes>LIMITS.nodes)fail('snapshot_node_limit');ws();const c=source[pos];
  if(c==='"')return string();
  if(c==='{'){pos++;ws();const out=Object.create(null),keys=new Set();if(source[pos]==='}'){pos++;return out;}while(true){ws();if(source[pos]!=='"')fail('snapshot_json_invalid');const k=string();if(keys.has(k))fail('snapshot_duplicate_key');keys.add(k);if(['__proto__','prototype','constructor'].includes(k))fail('snapshot_forbidden_key');ws();if(source[pos++]!==':')fail('snapshot_json_invalid');out[k]=value(depth+1);ws();const delim=source[pos++];if(delim==='}')return out;if(delim!==',')fail('snapshot_json_invalid');}}
  if(c==='['){pos++;ws();const out=[];if(source[pos]===']'){pos++;return out;}while(true){if(out.length>=LIMITS.rows)fail('snapshot_array_limit');out.push(value(depth+1));ws();const delim=source[pos++];if(delim===']')return out;if(delim!==',')fail('snapshot_json_invalid');}}
  for(const [token,v] of [['true',true],['false',false],['null',null]])if(source.startsWith(token,pos)){pos+=token.length;return v;}
  const start=pos;if(source[pos]==='-')pos++;if(source[pos]==='0')pos++;else {if(!(source[pos]>='1'&&source[pos]<='9'))fail('snapshot_json_invalid');while(source[pos]>='0'&&source[pos]<='9')pos++;}if(source[pos]==='.'){pos++;const st=pos;while(source[pos]>='0'&&source[pos]<='9')pos++;if(st===pos)fail('snapshot_json_invalid');}if(source[pos]==='e'||source[pos]==='E'){pos++;if(source[pos]==='+'||source[pos]==='-')pos++;const st=pos;while(source[pos]>='0'&&source[pos]<='9')pos++;if(st===pos)fail('snapshot_json_invalid');}const token=source.slice(start,pos);
  // Tots els camps numèrics de la sonda són enters: rebutja abans de convertir,
  // perquè Number pot arredonir decimals o convertir un exponent menut en zero.
  if(token.includes('.')||token.includes('e')||token.includes('E'))fail('snapshot_number_invalid');
  const n=Number(token);if(!Number.isSafeInteger(n))fail('snapshot_number_invalid');return n;
 };
 const result=value(0);ws();if(pos!==source.length)fail('snapshot_json_invalid');return result;
}
export function readSnapshot(file){
 let fd;try{
  if(typeof file!=='string'||!file||file.length>4096)fail('snapshot_file_invalid');
  const absolute=path.resolve(file),parts=absolute.split(path.sep).filter(Boolean);let cursor=path.parse(absolute).root;
  for(const part of parts){cursor=path.join(cursor,part);if(fs.lstatSync(cursor).isSymbolicLink())fail('snapshot_symlink_rejected');}
  const before=fs.lstatSync(absolute);if(!before.isFile())fail('snapshot_regular_file_required');if(before.size>LIMITS.bytes)fail('snapshot_size_limit');
  fd=fs.openSync(absolute,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
  const opened=fs.fstatSync(fd);if(!opened.isFile()||opened.ino!==before.ino||opened.dev!==before.dev)fail('snapshot_file_changed');
  const buffer=Buffer.alloc(LIMITS.bytes+1);let used=0,n;do{n=fs.readSync(fd,buffer,used,buffer.length-used,null);used+=n;}while(n&&used<buffer.length);
  const after=fs.fstatSync(fd);if(used>LIMITS.bytes)fail('snapshot_size_limit');if(after.size!==used||after.size!==before.size||after.mtimeMs!==before.mtimeMs)fail('snapshot_file_changed');
  const decoder=new TextDecoder('utf-8',{fatal:true});let text;try{text=decoder.decode(buffer.subarray(0,used));}catch{fail('snapshot_utf8_invalid');}
  return {snapshot:validateSnapshot(parseStrictJson(text)),sha256:sha256(buffer.subarray(0,used))};
 }catch(error){if(error.safeCode)throw error;fail('snapshot_file_unreadable');}finally{if(fd!==undefined)fs.closeSync(fd);}
}
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const str=(v,max=65536)=>typeof v==='string'&&v.length<=max;
const text=v=>str(v),name=v=>str(v,256)&&v.length>0&&!/[\u0000-\u001f\u007f]/u.test(v);
const bool=v=>typeof v==='boolean',integer=v=>Number.isSafeInteger(v)&&v>=0,approx=v=>Number.isSafeInteger(v)&&v>=-1;
const nullable=f=>v=>v===null||f(v),oneOf=values=>v=>values.includes(v);
const strings=v=>Array.isArray(v)&&v.length<=256&&v.every(text)&&new Set(v).size===v.length;
const table={schema_name:oneOf(['public','private','storage']),object_name:name,kind:oneOf(['r','p','v','m']),rls_enabled:bool,rls_forced:bool,reloptions:strings,total_bytes:integer,approx_live_rows:approx,dead_tuples:integer,seq_scans:integer,idx_scans:integer,last_autovacuum:nullable(v=>str(v,128)),anon_select:bool,anon_insert:bool,anon_update:bool,anon_delete:bool,auth_select:bool,auth_insert:bool,auth_update:bool,auth_delete:bool};
export const RADARS=Object.freeze({
 r1_taules_sense_rls_en_public:{fields:table,id:['schema_name','object_name']},
 r1_vistes_sense_security_invoker:{fields:table,id:['schema_name','object_name']},
 r1_inventari_taules_mides_i_files:{fields:table,id:['schema_name','object_name']},
 r2_alertes_politiques_rls:{fields:{schemaname:oneOf(['public','private','storage']),tablename:name,policyname:name,permissive:oneOf(['PERMISSIVE','RESTRICTIVE']),roles:strings,cmd:oneOf(['ALL','SELECT','INSERT','UPDATE','DELETE']),qual:nullable(text),with_check:nullable(text),alertes:v=>strings(v)&&v.length>0&&v.every(oneOf(['deprecated_auth_role','unsafe_user_metadata_claim','update_missing_with_check','unrestricted_write_qual_true','storage_anon_enumeration_risk']))},id:['schemaname','tablename','policyname']},
 r3_security_definers_amb_alerta:{fields:{schema_name:oneOf(['public','private']),function_name:name,args:text,is_security_definer:v=>v===true,volatility:oneOf(['v','s','i']),proconfig:strings,missing_search_path:bool,public_execute:bool,anon_execute:bool,auth_execute:bool},id:['schema_name','function_name','args']},
 r4_columnes_exposades_anon:{fields:{table_schema:v=>v==='public',table_name:oneOf(['profiles','organizations','notes','consentiments','xat_fils','xat_missatges','xat_participants']),column_name:name,anon_privileges:v=>str(v,128)&&v.split(',').every(p=>['SELECT','INSERT','UPDATE','REFERENCES'].includes(p))&&new Set(v.split(',')).size===v.split(',').length},id:['table_schema','table_name','column_name']},
 r5_fk_sense_index:{fields:{schema_name:oneOf(['public','private']),table_name:name,constraint_name:name,fk_columns:v=>strings(v)&&v.length>0&&v.every(name),referenced_table:name},id:['schema_name','table_name','constraint_name']},
 r6_triggers_desactivats:{fields:{schema_name:oneOf(['public','private','auth','storage']),table_name:name,trigger_name:name,enabled_flag:v=>v==='D'},id:['schema_name','table_name','trigger_name']},
 r7_storage_buckets_salut:{fields:{bucket_id:name,is_public:bool,file_size_limit:nullable(integer),allowed_mime_types:nullable(strings),total_objects:integer,total_metadata_bytes:integer,orphan_ownerless_objects:integer},id:['bucket_id']}
});
const COUNTS=['r2_total_politiques_auditades','r3_total_security_definers'];
const INTEGRITY=['auth_users_total','profiles_total','auth_sense_profile','profiles_sense_auth','organizations_total','notes_total','xat_fils_total','xat_missatges_total','xat_fils_sense_participants'];
const keysExact=(value,keys)=>obj(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
const rowId=(row,definition)=>canonical(definition.id.map(key=>row[key]));
const binaryCompare=(a,b)=>a<b?-1:a>b?1:0;
export function validateSnapshot(snapshot){
 const keys=[...Object.keys(RADARS),...COUNTS,'generated_at_utc','postgres_version','r8_integritat_dades_agregada'];
 if(!keysExact(snapshot,keys)||!str(snapshot.generated_at_utc,128)||!Number.isFinite(Date.parse(snapshot.generated_at_utc))||!str(snapshot.postgres_version,2048)||snapshot.postgres_version.length===0)fail();
 for(const k of COUNTS)if(!integer(snapshot[k]))fail();
 if(!keysExact(snapshot.r8_integritat_dades_agregada,INTEGRITY)||!INTEGRITY.every(k=>integer(snapshot.r8_integritat_dades_agregada[k])))fail();
 for(const [radar,definition]of Object.entries(RADARS)){
  const rows=snapshot[radar];if(!Array.isArray(rows)||rows.length>LIMITS.rows)fail();const ids=new Set();
  for(const row of rows){if(!keysExact(row,Object.keys(definition.fields))||!Object.entries(definition.fields).every(([key,check])=>check(row[key])))fail();const id=rowId(row,definition);if(ids.has(id))fail('snapshot_duplicate_identity');ids.add(id);}
 }
 if(snapshot.r2_total_politiques_auditades<snapshot.r2_alertes_politiques_rls.length||snapshot.r3_total_security_definers<snapshot.r3_security_definers_amb_alerta.length)fail('snapshot_inconsistent');
 const inventory=snapshot.r1_inventari_taules_mides_i_files;
 for(const [radar,filter]of [['r1_taules_sense_rls_en_public',r=>r.schema_name==='public'&&['r','p'].includes(r.kind)&&!r.rls_enabled],['r1_vistes_sense_security_invoker',r=>r.schema_name==='public'&&r.kind==='v'&&!r.reloptions.some(x=>x==='security_invoker=true'||x==='security_invoker=on')]]){
  const expected=inventory.filter(filter).map(canonical).sort(),actual=snapshot[radar].map(canonical).sort();if(canonical(expected)!==canonical(actual))fail('snapshot_inconsistent');
 }
 return snapshot;
}
export const VOLATILE_TABLE_FIELDS=Object.freeze(['total_bytes','approx_live_rows','dead_tuples','seq_scans','idx_scans','last_autovacuum']);
function normalizeRow(row){const out={...row};for(const field of ['roles','alertes'])if(Array.isArray(out[field]))out[field]=[...out[field]].sort();return out;}
export function projectSnapshot(snapshot){
 validateSnapshot(snapshot);const structural={},volatile={generated_at_utc:snapshot.generated_at_utc,postgres_version:snapshot.postgres_version,r7_storage_buckets_salut:snapshot.r7_storage_buckets_salut.map(row=>Object.fromEntries(['bucket_id','total_objects','total_metadata_bytes','orphan_ownerless_objects'].map(field=>[field,row[field]]))).sort((a,b)=>binaryCompare(a.bucket_id,b.bucket_id)),r8_integritat_dades_agregada:snapshot.r8_integritat_dades_agregada};
 for(const [radar,definition]of Object.entries(RADARS)){
  if(radar.startsWith('r7_')){structural[radar]=snapshot[radar].map(row=>Object.fromEntries(['bucket_id','is_public','file_size_limit','allowed_mime_types'].map(field=>[field,row[field]]))).sort((a,b)=>binaryCompare(a.bucket_id,b.bucket_id));continue;}
  structural[radar]=snapshot[radar].map(row=>{const out=normalizeRow(row);if(radar.startsWith('r1_'))for(const field of VOLATILE_TABLE_FIELDS)delete out[field];return out;}).sort((a,b)=>binaryCompare(rowId(a,definition),rowId(b,definition)));
  if(radar.startsWith('r1_'))volatile[radar]=snapshot[radar].map(row=>Object.fromEntries([...definition.id,...VOLATILE_TABLE_FIELDS].map(field=>[field,row[field]]))).sort((a,b)=>binaryCompare(rowId(a,definition),rowId(b,definition)));
 }
 for(const key of COUNTS)structural[key]=snapshot[key];return {structural,volatile};
}
/** Values never enter the report: identities and rows are represented by SHA-256. */
export function compareSnapshots(repo,production){
 const left=projectSnapshot(repo),right=projectSnapshot(production),differences=[];
 for(const [radar,value]of Object.entries(left.structural)){
  const other=right.structural[radar];if(!Array.isArray(value)){if(value!==other)differences.push({radar,kind:'count_changed',repo_sha256:sha256(value),production_sha256:sha256(other)});continue;}
  const definition=RADARS[radar],a=new Map(value.map(row=>[rowId(row,definition),row])),b=new Map(other.map(row=>[rowId(row,definition),row]));
  for(const id of [...new Set([...a.keys(),...b.keys()])].sort()){
   const r=a.get(id),p=b.get(id);if(canonical(r)===canonical(p))continue;
   differences.push({radar,identity_sha256:sha256(id),kind:!r?'production_only':!p?'repo_only':'changed',...(r?{repo_sha256:sha256(r)}:{}),...(p?{production_sha256:sha256(p)}:{}),...(r&&p?{fields:Object.keys(r).filter(k=>canonical(r[k])!==canonical(p[k])).sort()}:{} )});
  }
 }
 return {structural_equal:differences.length===0,repo_structural_sha256:sha256(left.structural),production_structural_sha256:sha256(right.structural),differences,volatile:{equal:canonical(left.volatile)===canonical(right.volatile),repo_sha256:sha256(left.volatile),production_sha256:sha256(right.volatile),scope:'r1 metrics, generated_at, PostgreSQL version, r7 object/size/orphan counts, r8; never a structural failure'}};
}
