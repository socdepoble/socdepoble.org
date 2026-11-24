/** D-DUR-01: private business backup. Public Open Data and RGPD v1 stay separate.
 * The JSON is authoritative; Markdown/CSV are checked, readable projections.
 * Hashes certify bytes, not provenance or authority. No credentials or roles.
 */
import { empaquetaZip } from './exportaMunicipiOpenData.js';
import { llegeixZip } from '../utils/fulls/zip.js';
import { serialitzaNotaAMarkdownVault } from './sincronitzadorCarpetaLocal.js';
import { sha256Hex, canonitzaJsonJcs } from './federacio/portabilitatFediversity.js';
import { serialitzaCsv } from '../utils/fulls/csv.js';
import { capturaEdicioRevisioPatrimoni } from './revisionsPatrimoni.js';

export const FORMAT_COPIA_COMPTE = 'socdepoble.backup.v2';
export const RECURSOS_COPIA_COMPTE = Object.freeze(['perfil', 'notes', 'noteFolders', 'organitzacions', 'patrimoni']);
export const CAMPS_PERFIL_COPIA = Object.freeze(['full_name','avatar_url','visibility','town_name','bio','is_public','lema','presentacio_html','hero_url','hero_video_url','copyright','icon','created_at','updated_at']);
export const CAMPS_ORG_COPIA = Object.freeze(['id','name','slug','description','kind','parent_organization_id','lema','logo_url','visibility','presentacio_html','hero_url','hero_video_url','copyright','town_name','created_at','updated_at','contacte']);
export const MAX_BYTES_COPIA_COMPTE = 64 * 1024 * 1024;
const MAX_ROWS = 10000;
export const MAX_BYTES_SNAPSHOT_COMPTE = 8 * 1024 * 1024;
const jsonCompte = value => canonitzaJsonJcs(value) + '\n';
const FORBIDDEN = new Set(['__proto__','constructor','prototype','access_token','refresh_token','service_role','password','encrypted_password','session','app_metadata','user_metadata','private_key','secret_key']);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
const fail = code => { throw Object.assign(new TypeError('Còpia de compte invàlida.'), { code, codi: code }); };
function charge(budget,bytes) {
  budget.bytes += bytes;
  if (budget.bytes > MAX_BYTES_SNAPSHOT_COMPTE) fail('copia-limit');
}
function textBudget(value,budget) {
  if (value.length > 1000000 || /[\uD800-\uDFFF]/u.test(value)) fail('copia-text');
  charge(budget,2);
  for (const char of value) {
    const cp=char.codePointAt(0);
    charge(budget,cp<32?6:cp===34||cp===92?2:cp<128?1:cp<2048?2:cp<65536?3:4);
  }
}
function copyJson(value, depth = 0, budget = { nodes: 0, bytes: 0 }) {
  if (++budget.nodes > 500000 || depth > 32) fail('copia-limit');
  if (value === null || typeof value === 'boolean') {charge(budget,5);return value;}
  if (typeof value === 'string') {
    textBudget(value,budget);return value;
  }
  if (typeof value === 'number') { if (!Number.isFinite(value) || Object.is(value,-0) || Math.abs(value) > Number.MAX_SAFE_INTEGER) fail('copia-number');charge(budget,32); return value; }
  if (!plain(value) && !Array.isArray(value)) fail('copia-json');
  if (Array.isArray(value) && (value.length > MAX_ROWS + 3 || Reflect.ownKeys(value).length !== value.length + 1)) fail('copia-limit');
  charge(budget,2);
  const out = Array.isArray(value) ? [] : {};
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value,key);
    if (typeof key !== 'string' || FORBIDDEN.has(key) || !descriptor?.enumerable || !Object.hasOwn(descriptor,'value')) fail('copia-autoritat');
    textBudget(key,budget);charge(budget,2);
    out[key] = copyJson(descriptor.value,depth+1,budget);
  }
  return out;
}
const keys = (row, allowed) => { if (!plain(row) || Object.keys(row).some(key => !allowed.includes(key))) fail('copia-camps'); };
const id = value => { if (typeof value !== 'string' || !value.trim() || value.length > 128 || /[\u0000-\u001F\u007F]/.test(value)) fail('copia-id'); return value; };
function rows(value, field) {
  if (!Array.isArray(value) || value.length > MAX_ROWS) fail('copia-recurs');
  const seen = new Set();
  for (const row of value) { if (!plain(row) || seen.has(id(row[field]))) fail('copia-duplicada'); seen.add(row[field]); }
  return seen;
}
function hierarchy(list, ownIds, field, external = false) {
  const parents = new Map(list.map(row=>[row.id,row[field] || null])), done = new Set();
  for (const row of list) if (row[field] != null && !ownIds.has(id(row[field])) && !external) fail('copia-referencia');
  for (const row of list) {
    const trail = [], seen = new Set(); let current = row.id;
    while (current !== null && !done.has(current)) {
      if (seen.has(current)) fail('copia-cicle');
      seen.add(current); trail.push(current); current = parents.get(current) ?? null;
    }
    for (const key of trail) done.add(key);
  }
}
export function capturaCopiaCompte(input) {
  const value = copyJson(input);
  keys(value,['format','titularId','tenantId','generatAl','dades']);
  if (value.format !== FORMAT_COPIA_COMPTE || typeof value.generatAl !== 'string' || !Number.isFinite(Date.parse(value.generatAl))) fail('copia-format');
  id(value.titularId); id(value.tenantId); keys(value.dades,RECURSOS_COPIA_COMPTE);
  if (RECURSOS_COPIA_COMPTE.some(key=>!Object.hasOwn(value.dades,key))) fail('copia-incompleta');
  const d = value.dades;
  keys(d.perfil,CAMPS_PERFIL_COPIA);
  for (const [key,value] of Object.entries(d.perfil)) if (key === 'is_public' ? typeof value !== 'boolean' : value !== null && typeof value !== 'string') fail('copia-perfil');
  rows(d.notes,'id'); const folders = rows(d.noteFolders,'id'), orgs = rows(d.organitzacions,'id');
  for (const folder of d.noteFolders) { keys(folder,['id','nom','name','parentId']); if (typeof (folder.nom ?? folder.name) !== 'string' || !(folder.nom ?? folder.name).trim()) fail('copia-carpeta'); }
  hierarchy(d.noteFolders,folders,'parentId');
  for (const note of d.notes) {
    if (note._esborrada === true) { keys(note,['id','_esborrada']); continue; }
    if (typeof note.content !== 'string' || !Number.isSafeInteger(note.revision) || note.revision < 0) fail('copia-nota-incompleta');
    if (note.folderId != null && !folders.has(id(note.folderId))) fail('copia-referencia');
    for (const key of ['title','subtitle','lead','heroImage','logoImage','logoImageDark','copyright','icon','createdAt','updatedAt','enPapereraAl','publishDate','publishedSubmissionId']) if (note[key] !== undefined && note[key] !== null && typeof note[key] !== 'string') fail('copia-nota');
    for (const key of ['tags','categories']) if (note[key] !== undefined && (!Array.isArray(note[key]) || !note[key].every(value=>typeof value==='string'))) fail('copia-nota');
    if (note.estat !== undefined && !['activa','arxivada','paperera'].includes(note.estat) || note.isPublished !== undefined && typeof note.isPublished !== 'boolean') fail('copia-nota');
    if (['role','owner_user_id','ownerUserId','author_id','tenant_id'].some(key=>Object.hasOwn(note,key))) fail('copia-autoritat');
  }
  for (const org of d.organitzacions) {
    keys(org,CAMPS_ORG_COPIA);
    if (typeof org.name !== 'string' || !org.name.trim()) fail('copia-organitzacio');
    for (const [key,value] of Object.entries(org)) if (key !== 'contacte' && value !== null && typeof value !== 'string') fail('copia-organitzacio');
    if (org.contacte !== undefined) { keys(org.contacte,['correu','public']); if (typeof org.contacte.correu !== 'string' || typeof org.contacte.public !== 'boolean') fail('copia-contacte'); }
  }
  // An administrable child may point to a private parent the actor cannot read.
  // Preserve that identifier without importing the parent's data or authority.
  hierarchy(d.organitzacions,orgs,'parent_organization_id',true);
  if (!Array.isArray(d.patrimoni) || d.patrimoni.length > MAX_ROWS) fail('copia-recurs');
  const campaigns = new Set();
  for (const revision of d.patrimoni) {
    capturaEdicioRevisioPatrimoni(revision,1);
    const key = JSON.stringify([revision.entitatTipus,revision.entitatSlug,revision.campanyaAny]);
    if (campaigns.has(key)) fail('copia-duplicada'); campaigns.add(key);
  }
  if (new TextEncoder().encode(jsonCompte(value)).length > MAX_BYTES_COPIA_COMPTE) fail('copia-limit');
  return value;
}
function projectFiles(snapshot) {
  const text = jsonCompte(snapshot), d = snapshot.dades;
  const files = [ {nom:'data/compte.json',dades:text},
    {nom:'data/registre.csv',dades:serialitzaCsv([['recurs','id','json'], ...RECURSOS_COPIA_COMPTE.flatMap(resource => (resource === 'perfil' ? [d.perfil] : d[resource]).map((row,index)=>[resource,row.id ?? String(index),jsonCompte(row)]))])} ];
  for (const note of d.notes.filter(row=>!row._esborrada)) files.push({nom:'notes/nota-'+sha256Hex(note.id)+'.md',dades:serialitzaNotaAMarkdownVault(note)});
  return files;
}
export function creaPaquetCompte(input) {
  const snapshot = capturaCopiaCompte(input), files = projectFiles(snapshot);
  const orgIds = new Set(snapshot.dades.organitzacions.map(row=>row.id));
  const externalIds = [...new Set(snapshot.dades.organitzacions.map(row=>row.parent_organization_id).filter(value=>value != null && !orgIds.has(value)))].sort();
  const manifest = {format:FORMAT_COPIA_COMPTE,titularId:snapshot.titularId,perfil:'negoci-local',completDinsPerfil:true,
    recursos:RECURSOS_COPIA_COMPTE, exclos:['credencials','sessio','autoritat-remota','identitat-verificada','consentiments-legals','seguiments','bloquejos','revisions-seed','revisions-editorials-locals','baixa','xat','altres-apps','bytes-de-mitjans','dades-organitzacions-externes'],
    referenciesExternes:externalIds.map(id=>({recurs:'organitzacions',camp:'parent_organization_id',id,procedencia:'nomes-referencia-sense-dades-ni-autoritat'})),
    files:files.map(file=>({path:file.nom,sha256:sha256Hex(file.dades)}))};
  const zip = empaquetaZip([...files,{nom:'manifest.json',dades:jsonCompte(manifest)}]);
  if (zip.byteLength > MAX_BYTES_COPIA_COMPTE) fail('copia-limit');
  return {zip,sha256:sha256Hex(zip),manifest};
}
export function llegeixPaquetCompte(bytes,{sha256Esperat}={}) {
  if (!bytes || bytes.byteLength > MAX_BYTES_COPIA_COMPTE || typeof sha256Esperat !== 'string' || !/^[a-f0-9]{64}$/.test(sha256Esperat) || sha256Hex(bytes)!==sha256Esperat) fail('copia-integritat');
  const rawEntries=llegeixZip(bytes,{maxEixida:MAX_BYTES_COPIA_COMPTE});
  if(rawEntries.length>MAX_ROWS+3||new Set(rawEntries.map(entry=>entry.nom)).size!==rawEntries.length)fail('copia-fitxer-duplicat');
  const entries = new Map(rawEntries.map(entry=>[entry.nom,entry.dades]));
  const decode = name => { const value = entries instanceof Map ? entries.get(name) : entries[name]; if (value === undefined) fail('copia-fitxer'); return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(value); };
  const manifestText = decode('manifest.json'), manifest = copyJson(JSON.parse(manifestText));
  if (jsonCompte(manifest)!==manifestText || manifest.format!==FORMAT_COPIA_COMPTE) fail('copia-manifest');
  const dataText = decode('data/compte.json'), snapshot = capturaCopiaCompte(JSON.parse(dataText));
  if (jsonCompte(snapshot)!==dataText) fail('copia-json');
  const expected = creaPaquetCompte(snapshot);
  const names = entries instanceof Map ? [...entries.keys()] : Object.keys(entries);
  if (names.length!==expected.manifest.files.length+1 || jsonCompte(expected.manifest)!==manifestText) fail('copia-manifest');
  for (const file of projectFiles(snapshot)) if (decode(file.nom)!==file.dades) fail('copia-projeccio');
  return snapshot;
}
export async function exportaComptePortable(port,config={}) {
  if (typeof port?.llegixCopiaCompte !== 'function' || typeof port.teCapacitat === 'function' && !port.teCapacitat('copiaCompte')) fail('copia-no-disponible');
  return creaPaquetCompte(await port.llegixCopiaCompte(config));
}
export async function importaComptePortable(bytes,port,{sha256Esperat,config={}}={}) {
  const snapshot = llegeixPaquetCompte(bytes,{sha256Esperat});
  if (typeof port?.restauraCopiaCompte !== 'function' || typeof port.teCapacitat === 'function' && !port.teCapacitat('restauracioCompte')) fail('copia-no-disponible');
  return port.restauraCopiaCompte(snapshot,config);
}
