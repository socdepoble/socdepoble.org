/** Shared document primitives. No I/O on import; every operation has an explicit root. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';
import { splitFrontmatter } from '../wiki/lib/frontmatter.mjs';

export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
export const hashFile = file => sha(fs.readFileSync(file));
export const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const DESK = '_wiki_de_poble/04_escriptori';
export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
export const turnPattern = new RegExp(`^torn_${UUID}$`);
export const receiptPattern = new RegExp(`^sdp:(torn_${UUID}):(${UUID})$`);

export function canonical(file) {
  const abs = path.resolve(file);
  try { return fs.realpathSync(abs); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // A dangling symlink must not fall back to its lexical location.
    try { if (fs.lstatSync(abs).isSymbolicLink()) throw new Error(`Symlink sense destí: ${abs}`); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    const parent = path.dirname(abs);
    if (parent === abs) throw error;
    return path.join(canonical(parent), path.basename(abs));
  }
}
export function inside(base, file) {
  const rel = path.relative(base, file);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}
export function relativePath(root, file, cwd = root) {
  const actualRoot = canonical(root);
  const actual = canonical(path.resolve(cwd, file));
  if (!inside(actualRoot, actual)) throw new Error(`Ruta fora del repositori: ${file}`);
  return path.relative(actualRoot, actual).split(path.sep).join('/');
}
export function protectedPath(root, file, cwd = root) {
  const lexical = path.resolve(cwd, file);
  const actual = canonical(lexical);
  const base = canonical(path.join(root, DESK));
  const lexicalProtected = inside(path.resolve(root, DESK), lexical);
  const actualProtected = inside(base, actual);
  if (lexicalProtected && !actualProtected) throw new Error('Symlink que escapa de l’Escriptori');
  return (lexicalProtected || actualProtected) && actual.toLowerCase().endsWith('.md');
}
export function humanZone(rel) {
  return rel.toLowerCase().startsWith(`${DESK}/01_produccio/`);
}
export function parseDocument(raw) {
  const split = splitFrontmatter(raw);
  if (!split.hasFrontmatter || split.malformed) throw new Error('Frontmatter absent o no tancat');
  // JSON_SCHEMA keeps dates as strings, preserves booleans/numbers, rejects custom tags.
  const data = yaml.load(split.rawFrontmatter, { schema: yaml.JSON_SCHEMA, json: false });
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Frontmatter ha de ser un mapa');
  if (/^\s*---\s*\n\s*[\w-]+:/.test(split.body)) throw new Error('DOS blocs de frontmatter');
  return { data, body: split.body };
}

// Fail closed on unknown JSON Schema constructs; support exactly the schema in this repo.
const allowed = new Set(['$schema', '$id', '$comment', 'title', 'description', 'type', 'properties',
  'required', 'additionalProperties', 'enum', 'const', 'items', 'uniqueItems', 'minItems', 'maxItems',
  'minLength', 'maxLength', 'pattern']);
export function checkSchema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error('Esquema il·legible');
  for (const key of Object.keys(schema)) if (!allowed.has(key)) throw new Error(`Esquema no suportat: ${key}`);
  if (!['object', 'array', 'string', 'boolean', 'integer', 'number'].includes(schema.type)) throw new Error('Tipus d’esquema no suportat');
  if (schema.pattern) new RegExp(schema.pattern);
  for (const sub of Object.values(schema.properties || {})) checkSchema(sub);
  if (schema.items) checkSchema(schema.items);
}
export function validateSchema(data, schema, at = 'frontmatter') {
  const errors = [];
  const type = Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data;
  if (schema.type === 'integer' ? !Number.isInteger(data) : type !== schema.type) return [`${at}: cal ${schema.type}`];
  if (schema.enum && !schema.enum.includes(data)) errors.push(`${at}: fora de l’enum`);
  if (Object.hasOwn(schema, 'const') && data !== schema.const) errors.push(`${at}: valor diferent de const`);
  if (type === 'string') {
    const len = [...data].length;
    if (schema.minLength !== undefined && len < schema.minLength) errors.push(`${at}: massa curt`);
    if (schema.maxLength !== undefined && len > schema.maxLength) errors.push(`${at}: massa llarg`);
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) errors.push(`${at}: patró invàlid`);
  }
  if (type === 'array') {
    if (schema.minItems !== undefined && data.length < schema.minItems) errors.push(`${at}: falten elements`);
    if (schema.maxItems !== undefined && data.length > schema.maxItems) errors.push(`${at}: massa elements`);
    if (schema.uniqueItems && new Set(data.map(x => JSON.stringify(x))).size !== data.length) errors.push(`${at}: elements duplicats`);
    if (schema.items) data.forEach((x, i) => errors.push(...validateSchema(x, schema.items, `${at}[${i}]`)));
  }
  if (type === 'object') {
    for (const key of schema.required || []) if (!Object.hasOwn(data, key)) errors.push(`${at}: falta ${key}`);
    for (const [key, value] of Object.entries(data)) {
      if (schema.properties?.[key]) errors.push(...validateSchema(value, schema.properties[key], `${at}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${at}: propietat desconeguda ${key}`);
    }
  }
  return errors;
}
export function loadContract(root, {route: selected, templates = true} = {}) {
  const routerFile = path.join(root, '.agents/protocolledge.json');
  const schemaFile = path.join(root, 'tooling/wiki/schema.json');
  const router = json(routerFile), schema = json(schemaFile);
  checkSchema(schema);
  if (!router.version || router.onUnknown !== 'error' || !Array.isArray(router.rutes)) throw new Error('Router documental incomplet');
  const ids = new Set();
  for (const route of router.rutes) {
    if (!route.id || ids.has(route.id)) throw new Error('Ruta documental duplicada o absent');
    ids.add(route.id);
    if (!route.version || !schema.properties.type.enum.includes(route.tipus) || !route.seccions?.length) throw new Error(`Contracte incomplet: ${route.id}`);
    if (!templates || (selected && selected !== route.id)) continue;
    const file = relativePath(root, route.plantilla);
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    const template = parseDocument(raw);
    if (!['canonic', 'esborrany', 'actiu'].includes(template.data.status)) throw new Error(`Plantilla no viva: ${file}`);
    const blocks = [...raw.matchAll(/<!-- SDP:EIXIDA\s*\n([\s\S]*?)-->/g)];
    if (blocks.length !== 1) throw new Error(`Cal un bloc SDP:EIXIDA: ${file}`);
    const output = yaml.load(blocks[0][1], {schema: yaml.JSON_SCHEMA});
    if (output.type !== route.tipus) throw new Error(`Tipus divergent: ${route.id}`);
    route.output = output;
    route.templateText = raw;
    route.templateHash = sha(raw);
    route.fixedBlocks = Object.fromEntries((route.blocsFixos || []).map(name => {
      const value = sections(template.body).get(name);
      if (!value) throw new Error(`Bloc fix absent: ${route.id}: ${name}`);
      return [name, value];
    }));
  }
  return { router, schema, hash: sha(fs.readFileSync(routerFile) + '\n' + fs.readFileSync(schemaFile)) };
}
export function resolveRoute(contract, { route, intent, recipient } = {}) {
  const candidates = route ? contract.router.rutes.filter(r => r.id === route)
    : contract.router.rutes.filter(r => (r.quan?.intencio === intent || r.id === intent)
      && (!recipient || r.quan?.destinatari === recipient));
  if (candidates.length !== 1) throw new Error('Intenció desconeguda o ambigua; indica --route explícit');
  return candidates[0];
}
export function withoutCode(body) {
  let fence = null;
  return body.replace(/<!--[\s\S]*?-->/g, '').split('\n').filter(line => {
    const m = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (m) {
      if (!fence) fence = m[1];
      else if (m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      return false;
    }
    return !fence;
  }).join('\n');
}
export function anchored(index, file) {
  const clean = withoutCode(index).replace(/`[^`]*`/g, '');
  const name = path.basename(file, '.md');
  return [...clean.matchAll(/\[\[([^|\]#]+)(?:[|#][^\]]*)?\]\]/g)].some(m => m[1].trim() === name);
}
export function sections(body) {
  const clean = withoutCode(body);
  const chunks = [...clean.matchAll(/^##\s+(.+)\r?\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm)];
  return new Map(chunks.map(m => [m[1].trim(), m[2].trim()]));
}
export function validateSections(body, route) {
  const found = sections(body), errors = [];
  for (const name of route.seccions) {
    const content = found.get(name);
    if (!content || /^\[pendent\]$/i.test(content)) errors.push(`Secció absent o pendent: ${name}`);
  }
  for (const [name, expected] of Object.entries(route.fixedBlocks || {})) {
    if (found.get(name) !== expected) errors.push(`Bloc normatiu alterat: ${name}`);
  }
  return errors;
}

export function validateRegister(body, contract) {
  const register = sections(body).get('Registre') || '';
  const fields = new Map([...register.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm)].map(m => [m[1].trim(),m[2].trim()]));
  return (contract.router.registre || []).filter(k => !fields.get(k) || fields.get(k) === '[pendent]').map(k => `Registre: falta ${k}`);
}

// Content-addressed snapshots are durable evidence, not authorisation or a secret signature.
export function saveContract(root, contract) {
  const payload = JSON.stringify(contract);
  const digest = sha(payload);
  const dir = path.join(root, '.agents/runtime/contracts');
  fs.mkdirSync(dir, {recursive:true});
  const file = path.join(dir, `${digest}.json`);
  if (fs.existsSync(file)) {
    if (fs.readFileSync(file,'utf8') !== payload) throw new Error('Snapshot immutable alterat');
  } else fs.writeFileSync(file,payload,{flag:'wx'});
  return digest;
}
export function readContract(root, digest, read) {
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Identificador de snapshot invàlid');
  const rel=`.agents/runtime/contracts/${digest}.json`;
  const raw=read ? read(rel) : fs.readFileSync(path.join(root,rel),'utf8');
  if (sha(raw)!==digest) throw new Error('Snapshot immutable alterat');
  const contract=JSON.parse(raw);
  checkSchema(contract.schema);
  return contract;
}
export function templateParity(contract) {
  const errors=[];
  for (const route of contract.router.rutes) {
    const actual=[...sections(parseDocument(route.templateText).body).keys()];
    if (JSON.stringify(actual)!==JSON.stringify(route.seccions)) errors.push(`${route.id}: encapçalaments divergents: ${actual.join(' | ')}`);
  }
  return errors;
}
