/** Persistent per-turn records. Locks never silently recover; failed writes leave the prior record intact. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DESK, canonical, inside, relativePath, humanZone, hashFile, sha, json, turnPattern, receiptPattern,
  loadContract, resolveRoute, parseDocument, anchored, validateSchema, validateSections, validateRegister } from './core.mjs';

const STORE = '.agents/runtime/turns';
function recordPath(root, id) {
  if (!turnPattern.test(id)) throw new Error('Identificador de torn invàlid');
  const target = path.join(root, STORE, `${id}.json`);
  if (!inside(canonical(root), canonical(target))) throw new Error('Registre fora del repositori');
  return target;
}
export function inventory(root) {
  const out = {};
  const skip = new Set(['node_modules', '.git', 'dist', '90_arxiu_historic', '.obsidian', 'runtime', '01_produccio', '01_Produccio', '__pycache__']);
  function walk(rel) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) return;
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) { out[rel] = sha(`symlink:${fs.readlinkSync(file)}`); return; }
    if (stat.isDirectory()) {
      for (const e of fs.readdirSync(file).sort()) if (!skip.has(e)) walk(`${rel}/${e}`);
    } else if (stat.isFile()) out[rel] = hashFile(file);
  }
  for (const rel of ['src', 'tooling', 'scripts', 'tests', '.agents', '.claude', '.github', '.husky', '_wiki_de_poble',
    'package.json', 'package-lock.json', 'AGENTS.md', 'CLAUDE.md', 'vite.config.js', '.gitignore']) walk(rel);
  delete out['.agents/TORN_ACTIU.json'];
  return out;
}
export function changes(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(p => before[p] !== after[p]).sort();
}
export function readTurn(root, id, { closed = false, now = Date.now() } = {}) {
  const turn = json(recordPath(root, id));
  if (turn.turn_id !== id || turn.schema !== 'sdp.turn.v1' || !['opened', 'context_loaded', 'planned', 'verified', 'closed'].includes(turn.state)) throw new Error('Registre de torn invàlid');
  if (turn.state === 'closed' && !closed) throw new Error('Torn ja tancat');
  if (turn.state !== 'closed' && (!Number.isFinite(Date.parse(turn.expiresAt)) || Date.parse(turn.expiresAt) <= now)) throw new Error('Torn caducat');
  if (!turn.receipts || !turn.initial || !Array.isArray(turn.history)) throw new Error('Registre de torn incomplet');
  return turn;
}
function atomic(file, value) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, {flag:'wx', mode:0o600});
    fs.renameSync(tmp, file);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export function mutateTurn(root, id, operation) {
  const file = recordPath(root, id), lock = `${file}.lock`;
  const fd = fs.openSync(lock, 'wx', 0o600);
  try {
    const turn = readTurn(root, id);
    const result = operation(turn);
    turn.revision += 1;
    turn.updatedAt = new Date().toISOString();
    atomic(file, turn);
    return result ?? turn;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
function move(turn, state, action) {
  turn.state = state;
  turn.history.push({state, action, at:new Date().toISOString()});
}
export function openTurn(root, { actor = 'agent-local', scope = 'code' } = {}) {
  if (fs.existsSync(path.join(root, '.agents/SDP-LOCK'))) throw new Error('SDP-LOCK actiu');
  if (!['code', 'documents'].includes(scope)) throw new Error('Abast desconegut');
  const contract = loadContract(root);
  const turn_id = `torn_${randomUUID()}`;
  const now = new Date().toISOString();
  const turn = {schema:'sdp.turn.v1', turn_id, actor, scope, state:'opened', revision:0,
    createdAt:now, updatedAt:now, expiresAt:new Date(Date.now()+86400000).toISOString(),
    contractHash:contract.hash, initial:inventory(root), receipts:{}, plan:null, verification:null,
    history:[{state:'opened', action:'open', at:now}]};
  const file = recordPath(root, turn_id);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, `${JSON.stringify(turn, null, 2)}\n`, {flag:'wx', mode:0o600});
  return turn;
}
export function deliverContext(root, id, {route:routeId, file}) {
  const contract = loadContract(root), route = resolveRoute(contract, {route:routeId});
  const rel = relativePath(root, file);
  if (!rel.startsWith(`${DESK}/`) || humanZone(rel) || path.basename(rel) === '00_index_escriptori.md') throw new Error('Destí de document no autoritzat');
  if (!/^\d{6}_\d{4}_[a-z0-9_]+\.md$/.test(path.basename(rel))) throw new Error('Nom termodinàmic invàlid');
  return mutateTurn(root, id, turn => {
    if (turn.contractHash !== contract.hash) throw new Error('Contracte canviat; obri un torn nou');
    const receiptId = randomUUID();
    const receipt = {id:receiptId, route:route.id, routeVersion:route.version, file:rel,
      template:route.plantilla, templateHash:route.templateHash, issuedAt:new Date().toISOString()};
    turn.receipts[receiptId] = receipt;
    // New context invalidates verification, but retains an already bound plan.
    turn.verification = null;
    move(turn, turn.plan ? 'planned' : 'context_loaded', 'context');
    return {reflex:`sdp:${id}:${receiptId}`, route, template:route.templateText};
  });
}
export function validateDocument(root, content, file, { closed = false, readRecord } = {}) {
  const errors = [];
  try {
    const contract = loadContract(root), parsed = parseDocument(content);
    errors.push(...validateSchema(parsed.data, contract.schema));
    const rel = relativePath(root, file);
    // The canonical desktop index is structural, never a substitute for a formal document.
    if (rel === `${DESK}/00_index_escriptori.md` && parsed.data.type === 'index') return errors;
    const m = typeof parsed.data.reflex === 'string' && receiptPattern.exec(parsed.data.reflex);
    if (!m) return [...errors, 'reflex: cal un rebut persistent emés per document.mjs context'];
    const turn = readRecord ? readRecord(m[1]) : readTurn(root, m[1], {closed});
    if (turn.contractHash !== contract.hash) throw new Error('Contracte del rebut caducat');
    const receipt = turn.receipts[m[2]];
    if (!receipt || receipt.id !== m[2] || receipt.file !== rel) throw new Error('Rebut absent o vinculat a un altre document');
    const route = resolveRoute(contract, {route:receipt.route});
    if (receipt.templateHash !== route.templateHash || receipt.routeVersion !== route.version) throw new Error('Plantilla del rebut canviada');
    if (parsed.data.type !== route.tipus) errors.push('type: no correspon a la ruta del rebut');
    errors.push(...validateSections(parsed.body, route), ...validateRegister(parsed.body, contract));
    if (turn.state === 'closed' && turn.verification?.files?.[rel] !== sha(content)) errors.push('Artefacte modificat després del tancament');
  } catch (e) { errors.push(e.message); }
  return errors;
}
export function bindPlan(root, id, file) {
  const rel = relativePath(root, file);
  const raw = fs.readFileSync(path.join(root, rel), 'utf8');
  const parsed = parseDocument(raw);
  const contract = loadContract(root);
  const errors = validateSchema(parsed.data, contract.schema);
  if (errors.length || parsed.data.type !== 'document') throw new Error(`Pla invàlid: ${errors.join('; ')}`);
  if (!rel.startsWith(`${DESK}/`) || humanZone(rel)) throw new Error('El pla ha de viure a l’Escriptori');
  return mutateTurn(root, id, turn => {
    if (!Object.keys(turn.receipts).length) throw new Error('Cal entregar context abans de vincular el pla');
    turn.plan = {file:rel, hash:sha(raw)};
    turn.verification = null;
    move(turn, 'planned', 'bind-plan');
  });
}
export function checkTurn(root, id, {turn:provided} = {}) {
  const errors = [];
  const turn = provided || readTurn(root, id);
  const contract = loadContract(root);
  if (turn.contractHash !== contract.hash) errors.push('Contracte canviat durant el torn');
  if (!turn.plan || hashFile(path.join(root, turn.plan.file)) !== turn.plan.hash) errors.push('Pla absent o modificat');
  if (!['planned', 'verified'].includes(turn.state)) errors.push('El torn encara no està planificat');
  const current = inventory(root), changed = changes(turn.initial, current);
  const documents = new Set([...changed.filter(p => p.startsWith(`${DESK}/`) && p.endsWith('.md')),
    ...Object.values(turn.receipts).map(r => r.file)]);
  if (turn.scope === 'documents' && changed.some(p => /^(src|tooling|scripts|tests)\//.test(p) || /^package(?:-lock)?\.json$/.test(p))) errors.push('Canvis de codi fora de l’abast documental');
  for (const p of ['.agents/ESTAT.md', '.agents/LEDGER.md']) {
    if (current[p] === turn.initial[p] || !fs.readFileSync(path.join(root,p),'utf8').includes(id)) errors.push(`${p}: falta el relleu d’aquest torn`);
  }
  const index = fs.readFileSync(path.join(root, DESK, '00_index_escriptori.md'),'utf8');
  for (const file of documents) {
    if (humanZone(file)) { errors.push(`Zona humana modificada: ${file}`); continue; }
    if (!current[file]) { errors.push(`Document eliminat sense relleu: ${file}`); continue; }
    const raw = fs.readFileSync(path.join(root,file),'utf8');
    errors.push(...validateDocument(root,raw,file,{readRecord:otherId=>otherId===id?turn:readTurn(root,otherId,{closed:true})}).map(e=>`${file}: ${e}`));
    if (file !== `${DESK}/00_index_escriptori.md` && !anchored(index,file)) errors.push(`Document sense àncora: ${file}`);
  }
  return {valid:errors.length===0, errors, current, changed, turn};
}
export function sealTurn(root, id, runChecks, {close = false} = {}) {
  return mutateTurn(root, id, turn => {
    const checked = checkTurn(root, id, {turn});
    if (!checked.valid) throw new Error(checked.errors.join('\n'));
    const result = runChecks(turn);
    if (!result.valid) throw new Error(result.errors.join('\n'));
    const after = inventory(root);
    if (changes(checked.current,after).length) throw new Error('La comprovació ha modificat fitxers o hi ha escriptura concurrent');
    turn.verification = {at:new Date().toISOString(), files:after, checks:result.checks};
    move(turn,'verified','verify');
    if (close) move(turn,'closed','close');
    return {valid:true, turn_id:id, state:turn.state, checks:result.checks};
  });
}
