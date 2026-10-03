/** Persistent per-turn records. Locks never silently recover; failed writes leave the prior record intact. */
import { CAMINS } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DESK, canonical, inside, relativePath, humanZone, hashFile, sha, json, turnPattern, receiptPattern,
  loadContract, saveContract, readContract, resolveRoute, parseDocument, anchored, validateSchema, validateSections, validateRegister } from './core.mjs';

const STORE = '.agents/runtime/turns';
/** Estats d'un torn que encara es pot escriure (261002). Tancat o caducat és història. */
const OPEN_STATES = Object.freeze(['opened', 'context_loaded', 'planned', 'verified']);
function recordPath(root, id) {
  if (!turnPattern.test(id)) throw new Error('Identificador de torn invàlid');
  const target = path.join(root, STORE, `${id}.json`);
  if (!inside(canonical(root), canonical(target))) throw new Error('Registre fora del repositori');
  return target;
}
export function inventory(root, {files=[]} = {}) {
  const out = {};
  const skip = new Set(['node_modules', '.git', 'dist', '90_arxiu_historic', '.obsidian', 'runtime', '__pycache__']);
  function walk(rel) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) return;
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) { out[rel] = sha(`symlink:${fs.readlinkSync(file)}`); return; }
    if (stat.isDirectory()) {
      for (const e of fs.readdirSync(file).sort()) if (!skip.has(e)) walk(`${rel}/${e}`);
    } else if (stat.isFile()) out[rel] = hashFile(file);
  }
  for (const rel of ['src', 'tooling', 'scripts', 'tests', '.agents', '.codex', '.claude', '.github', '.husky', CAMINS.wiki,
    'package.json', 'package-lock.json', 'AGENTS.md', 'CLAUDE.md', 'vite.config.js', '.gitignore']) walk(rel);
  for (const file of files) {
    const rel=relativePath(root,file);
    if(fs.existsSync(path.join(root,rel))) out[rel]=hashFile(path.join(root,rel));
  }
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
function atomicText(file, text) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, text, {flag:'wx', mode:0o600});
    fs.renameSync(tmp, file);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
function atomic(file, value) {
  atomicText(file, `${JSON.stringify(value, null, 2)}\n`);
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
  const contract = loadContract(root, {templates:false});
  const turn_id = `torn_${randomUUID()}`;
  const now = new Date().toISOString();
  const turn = {schema:'sdp.turn.v1', turn_id, actor, scope, state:'opened', revision:0,
    createdAt:now, updatedAt:now, expiresAt:new Date(Date.now()+86400000).toISOString(),
    contractHash:contract.hash, humanInventoryVersion:1, initial:inventory(root), receipts:{}, plan:null, verification:null,
    history:[{state:'opened', action:'open', at:now}]};
  const file = recordPath(root, turn_id);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, `${JSON.stringify(turn, null, 2)}\n`, {flag:'wx', mode:0o600});
  return turn;
}
export function deliverContext(root, id, {route:routeId, file}) {
  const contract = loadContract(root, {route:routeId}), route = resolveRoute(contract, {route:routeId});
  const rel = relativePath(root, file);
  if (!(route.destins || [DESK]).some(dir=>rel.startsWith(`${dir}/`)) || humanZone(rel) || path.basename(rel) === '00_index_escriptori.md') throw new Error('Destí de document no autoritzat');
  if (!/^\d{6}_\d{4}_[a-z0-9_]+\.md$/.test(path.basename(rel))) throw new Error('Nom termodinàmic invàlid');
  return mutateTurn(root, id, turn => {
    const receiptId = randomUUID();
    const receipt = {id:receiptId, route:route.id, routeVersion:route.version, file:rel,
      contractSnapshot:saveContract(root,contract), template:route.plantilla, templateHash:route.templateHash, issuedAt:new Date().toISOString()};
    turn.receipts[receiptId] = receipt;
    // New context invalidates verification, but retains an already bound plan.
    turn.verification = null;
    move(turn, turn.plan ? 'planned' : 'context_loaded', 'context');
    return {reflex:`sdp:${id}:${receiptId}`, route, template:route.templateText};
  });
}
export function validateDocument(root, content, file, { closed = false, readRecord, readSnapshot } = {}) {
  const errors = [];
  try {
    const parsed = parseDocument(content);
    const rel = relativePath(root, file);
    // The canonical desktop index is structural, never a substitute for a formal document.
    if (rel === `${DESK}/00_index_escriptori.md` && parsed.data.type === 'index') return validateSchema(parsed.data,loadContract(root,{templates:false}).schema);
    const m = typeof parsed.data.reflex === 'string' && receiptPattern.exec(parsed.data.reflex);
    if (!m) {
      errors.push('reflex: cal un rebut persistent emés per document.mjs context');
      errors.push(...validateSchema(parsed.data, loadContract(root, {templates: false}).schema));
    } else {
      const turn = readRecord ? readRecord(m[1]) : readTurn(root, m[1], {closed});
      const receipt = turn.receipts[m[2]];
      if (!receipt || receipt.id !== m[2] || receipt.file !== rel) throw new Error('Rebut absent o vinculat a un altre document');
      const contract = receipt.contractSnapshot ? readContract(root,receipt.contractSnapshot,readSnapshot) : loadContract(root,{route:receipt.route});
      if (!receipt.contractSnapshot && turn.contractHash !== contract.hash) throw new Error('Contracte del rebut caducat');
      errors.push(...validateSchema(parsed.data, contract.schema));
      const route = resolveRoute(contract, {route:receipt.route});
      if (receipt.templateHash !== route.templateHash || receipt.routeVersion !== route.version) throw new Error('Plantilla del rebut canviada');
      if (parsed.data.type !== route.tipus) errors.push('type: no correspon a la ruta del rebut');
      errors.push(...validateSections(parsed.body, route), ...validateRegister(parsed.body, contract));
      if (turn.state === 'closed' && turn.verification?.files?.[rel] !== sha(content)) errors.push('Artefacte modificat després del tancament');
    }
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
/**
 * El remei d'un document que ja no és on diu el torn (261002). Si el nom és a
 * l'arxiu o a les actes, l'ordre de relleu ix sencera, amb el destí real; si no
 * és enlloc, el destí queda per omplir i es diu que un esborrat és cosa del
 * Mestre. Només mira si el camí existix: no llig res de 90_arxiu_historic/.
 *
 * L'ordre handoff només val per a un document que este torn cita (rebut o pla):
 * per a qualsevol altre, handoffDocument la rebutja sempre (OLIV-R4). Un document
 * que no cita hi arriba pel delta de tot l'arbre quan el torn no declara
 * propietat; el remei és declarar-la amb `own`, o el relleu del torn que el cita.
 */
function remeiRelleu(root, id, file, { cita = true } = {}) {
  const nom = path.posix.basename(file);
  const desti = [`${CAMINS.arxiuHistoric}/${nom}`, `${CAMINS.actes}/${nom}`].find(rel => rel !== file && fs.existsSync(path.join(root, rel)));
  if (!cita) {
    let altres = [];
    try { altres = turnsCiting(root, file).filter(c => !c.illegible && c.id !== id); } catch { altres = []; }
    const quins = altres.map(c => {
      if (c.live && desti) return `node tooling/wiki/document.mjs handoff --turn-id ${c.id} --file ${file} --to ${desti}`;
      if (c.live) return `${c.id} (viu)`;
      return `${c.id} (${c.state === 'closed' ? 'tancat' : `${c.state}, caducat`}: ja no es pot escriure)`;
    });
    return `Este torn no el cita (cap rebut ni pla): és d'un altre torn o d'un altre agent, i el relleu és del torn que el cita${quins.length ? ` (${quins.join(' ; ')})` : ''}. Perquè no compte en este torn, declara els documents propis amb node tooling/wiki/document.mjs own --turn-id ${id} --file CAMÍ`;
  }
  return desti
    ? `És a ${desti}: registra el relleu amb node tooling/wiki/document.mjs handoff --turn-id ${id} --file ${file} --to ${desti}`
    : `No és a ${CAMINS.arxiuHistoric}/ ni a ${CAMINS.actes}/: si s'ha traslladat, node tooling/wiki/document.mjs handoff --turn-id ${id} --file ${file} --to DESTÍ; si s'ha esborrat, avisa el Mestre (AGENTS §5)`;
}
export function checkTurn(root, id, {turn:provided} = {}) {
  const errors = [];
  const turn = provided || readTurn(root, id);
  const contract = loadContract(root,{templates:false});
  if (!Object.values(turn.receipts).every(r=>r.contractSnapshot) && turn.contractHash !== contract.hash) errors.push('Contracte canviat durant el torn');
  if (!turn.plan || !fs.existsSync(path.join(root,turn.plan.file)) || hashFile(path.join(root, turn.plan.file)) !== turn.plan.hash) {
    const absent = turn.plan && !fs.existsSync(path.join(root,turn.plan.file));
    errors.push(`Pla absent o modificat: ${turn.plan?.file || '(sense pla)'}${absent ? `. ${remeiRelleu(root, id, turn.plan.file)}` : ''}`);
  }
  if (!['planned', 'verified'].includes(turn.state)) errors.push('El torn encara no està planificat');
  const current = inventory(root,{files:Object.values(turn.receipts).map(r=>r.file)}), changed = changes(turn.initial, current);
  // Explicit ownership avoids importing another agent's documents into this turn.
  // Human-zone and scope checks still use the complete repository delta.
  const owned = turn.ownedPaths ? new Set([...turn.ownedPaths,...Object.values(turn.receipts).map(r=>r.file)]) : null;
  const documents = new Set([...changed.filter(p=>!humanZone(p)).filter(p=>!turn.relocated?.includes(p)).filter(p=>!owned || owned.has(p)).filter(p => p.startsWith(`${DESK}/`) && p.endsWith('.md')),
    ...Object.values(turn.receipts).map(r => r.file)]);
  if (turn.scope === 'documents' && changed.some(p => /^(src|tooling|scripts|tests)\//.test(p) || /^package(?:-lock)?\.json$/.test(p))) errors.push('Canvis de codi fora de l’abast documental');
  for (const p of ['.agents/ESTAT.md', '.agents/LEDGER.md']) {
    if (current[p] === turn.initial[p] || !fs.readFileSync(path.join(root,p),'utf8').includes(id)) errors.push(`${p}: falta el relleu d’aquest torn`);
  }
  const humanBefore=turn.humanBaseline?.files || (turn.humanInventoryVersion===1 ? Object.fromEntries(Object.entries(turn.initial).filter(([p])=>humanZone(p))) : null);
  if(!humanBefore) errors.push('Vigilància humana sense inventari inicial; cal una migració explícita observada');
  else for(const file of changes(humanBefore,Object.fromEntries(Object.entries(current).filter(([p])=>humanZone(p))))) errors.push(`Zona humana modificada: ${file}`);
  const index = fs.readFileSync(path.join(root, DESK, '00_index_escriptori.md'),'utf8');
  for (const file of documents) {
    if (humanZone(file)) { errors.push(`Zona humana modificada: ${file}`); continue; }
    if (!fs.existsSync(path.join(root,file))) {
      const cita = turn.plan?.file === file || Object.values(turn.receipts).some(r => r.file === file);
      errors.push(`Document eliminat sense relleu: ${file}. ${remeiRelleu(root, id, file, {cita})}`);
      continue;
    }
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
    const after = inventory(root,{files:Object.values(turn.receipts).map(r=>r.file)});
    if (changes(checked.current,after).length) throw new Error('La comprovació ha modificat fitxers o hi ha escriptura concurrent');
    turn.verification = {at:new Date().toISOString(), files:after, checks:result.checks};
    move(turn,'verified','verify');
    if (close) move(turn,'closed','close');
    return {valid:true, turn_id:id, state:turn.state, checks:result.checks};
  });
}

// Ownership is explicit; absence keeps the conservative legacy whole-tree check.
export function ownPaths(root,id,files) {
  const paths=files.map(file=>relativePath(root,file));
  if(paths.some(humanZone)) throw new Error('No es pot reclamar la zona humana');
  return mutateTurn(root,id,turn=>{
    turn.ownedPaths=[...new Set([...(turn.ownedPaths||[]),...paths])];
    turn.verification=null;
    turn.history.push({action:'own-paths',files:paths,at:new Date().toISOString()});
  });
}

/* ── Relleu d'un trasllat (261002) ─────────────────────────────────────────── */

/** Condicions de qualsevol relleu: fora de la zona humana, cap a un destí admés i amb l'origen ja buit. */
function guardRelleu(root, source, target) {
  if(humanZone(source)||humanZone(target)) throw new Error('Zona humana protegida');
  if(![DESK,CAMINS.actes,CAMINS.arxiuHistoric].some(dir=>target.startsWith(`${dir}/`))) throw new Error('Destí de relleu no autoritzat');
  if(fs.existsSync(path.join(root,source))) throw new Error('La ruta original encara existeix');
}
/**
 * Reapunta un torn ja carregat. Tots els rebuts amb file === origen es mouen
 * junts: `document.mjs context` cridat dues vegades per al mateix camí en deixa
 * dos, i `checkTurn` els comprova tots (O15, O19). El pla es mou si és l'origen
 * i el seu hash és el del contingut traslladat (D8). Amb `estricte: false` (un
 * trasllat que qui crida ha mesurat abans i després) un pla que ja estava
 * modificat abans del trasllat també es reapunta, però es diu: el torn l'haurà de
 * tornar a vincular, i `checkTurn` ho continuarà dient. Torna què ha mogut.
 */
function relleuDelTorn(turn, source, target, digest, action, { estricte = true } = {}) {
  const receipts=Object.values(turn.receipts).filter(r=>r.file===source);
  const plan=turn.plan?.file===source;
  if(!receipts.length&&!plan) throw new Error('Rebut del relleu absent');
  const planModificat=plan&&turn.plan.hash!==digest;
  if(planModificat&&estricte) throw new Error('Pla modificat durant el relleu');
  const at=new Date().toISOString();
  for(const receipt of receipts) {
    receipt.file=target;
    receipt.moves=[...(receipt.moves||[]),{from:source,to:target,hash:digest,at}];
  }
  if(plan) turn.plan.file=target;
  // Com abans: el torn que tenia rebuts passa a declarar el destí; el que només tenia el pla no adquirix propietat.
  if(receipts.length||turn.ownedPaths?.includes(source)) turn.ownedPaths=[...new Set([...(turn.ownedPaths||[]).filter(p=>p!==source),target])];
  // Preserve source history, while recognising that its absence is an intentional handoff.
  turn.relocated=[...new Set([...(turn.relocated||[]),source])];
  turn.verification=null;
  turn.state=turn.plan?'planned':'context_loaded';
  turn.history.push({state:turn.state,action,at,from:source,to:target,hash:digest,receipts:receipts.map(r=>r.id),plan,...(planModificat?{planModificat}:{})});
  return {receipts:receipts.length,plan,planModificat};
}
/**
 * El rebut ja ha fet el camí de l'origen al destí en relleus anteriors: dins de
 * `moves` hi ha un tram que ix de l'origen, on cada pas comença on acaba l'anterior,
 * i que acaba al destí, on és ara el rebut. Només així un rebut que ja és al destí
 * acredita que el document mogut és el de l'origen (OLIV-R1): un rebut emés per al
 * destí, o arribat d'un altre camí, no porta eixe tram. El tram admet passos
 * intermedis (reanomenat i després arxivat). No es contrasta el hash: `moves` només
 * l'escriu el relleu, que ja va provar la identitat en el seu moment, i un document
 * editat després del relleu a mitges no ha de quedar bloquejat per sempre.
 */
function haFetElCami(receipt, source, target) {
  if (receipt?.file !== target || !Array.isArray(receipt.moves)) return false;
  const inici = receipt.moves.findIndex(m => m?.from === source);
  if (inici === -1) return false;
  const tram = receipt.moves.slice(inici);
  return tram.every((m, i) => i === 0 || m?.from === tram[i - 1].to) && tram.at(-1)?.to === target;
}
// A handoff registers a move already performed; it never fabricates a past reading.
export function handoffDocument(root,id,from,to) {
  const source=relativePath(root,from), target=relativePath(root,to);
  guardRelleu(root,source,target);
  const raw=fs.readFileSync(path.join(root,target),'utf8'), digest=sha(raw);
  let match=null;
  try { match=receiptPattern.exec(parseDocument(raw).data.reflex||''); } catch { match=null; }
  return mutateTurn(root,id,turn=>{
    const receipts=Object.values(turn.receipts).filter(r=>r.file===source);
    // Identitat: el document mogut nomena este torn i un rebut seu que és a l'origen, o que ja és al destí
    // perquè hi va arribar des de l'origen (un relleu a mitges, fet amb la versió que només movia el rebut
    // del reflex, es pot completar). Un rebut emés per al destí no acredita res: taparia un esborrat (OLIV-R1).
    // Un torn que només el té com a pla (vinculat a un document d'un altre torn) s'identifica pel hash del pla.
    const nomenat=match&&match[1]===id?turn.receipts[match[2]]:null;
    if(receipts.length&&!(nomenat&&(nomenat.file===source||haFetElCami(nomenat,source,target)))) throw new Error('Identitat del relleu divergent');
    if(!receipts.length&&turn.plan?.file!==source) throw new Error('Rebut del relleu absent');
    relleuDelTorn(turn,source,target,digest,'handoff');
  });
}
/** Només el pla d'un torn, amb el hash contrastat: el cas d'un pla vinculat que porta el rebut d'un altre torn (D8). */
export function relocatePlan(root,id,from,to) {
  const source=relativePath(root,from), target=relativePath(root,to);
  guardRelleu(root,source,target);
  const digest=hashFile(path.join(root,target));
  return mutateTurn(root,id,turn=>{
    if(turn.plan?.file!==source) throw new Error('El pla del torn no és l’origen del relleu');
    if(turn.plan.hash!==digest) throw new Error('Pla modificat durant el relleu');
    turn.plan.file=target;
    turn.relocated=[...new Set([...(turn.relocated||[]),source])];
    turn.verification=null;
    const at=new Date().toISOString();
    turn.state='planned';
    turn.history.push({state:'planned',action:'relocate-plan',at,from:source,to:target,hash:digest});
  });
}
/**
 * Torns que citen un fitxer en un rebut o com a pla, sense mutar res. `live` vol
 * dir que encara es pot escriure (obert i sense caducar). Un registre que esmenta
 * el camí i no es pot llegir es diu (`illegible`), no s'amaga; un que no
 * l'esmenta ni es parseja: la cerca per text és exacta perquè el registre l'escriu
 * JSON.stringify.
 */
export function turnsCiting(root, file, { now = Date.now() } = {}) {
  const rel = String(file).split(path.sep).join('/');
  const dir = path.join(root, STORE);
  if (!fs.existsSync(dir)) return [];
  const agulla = JSON.stringify(rel);
  const out = [];
  for (const name of fs.readdirSync(dir).filter(n => /^torn_[^/]+\.json$/.test(n)).sort()) {
    const id = name.slice(0, -'.json'.length);
    let raw;
    try { raw = fs.readFileSync(path.join(dir, name), 'utf8'); } catch (e) { out.push({ id, illegible: e.message }); continue; }
    if (!raw.includes(agulla)) continue;
    let turn;
    try { turn = JSON.parse(raw); } catch (e) { out.push({ id, illegible: e.message }); continue; }
    if (!turn || typeof turn !== 'object' || turn.turn_id !== id || !turnPattern.test(id) || !turn.receipts || typeof turn.receipts !== 'object') {
      out.push({ id, illegible: 'registre incomplet' });
      continue;
    }
    const receipts = Object.values(turn.receipts).filter(r => r?.file === rel).map(r => r.id);
    const plan = turn.plan?.file === rel;
    if (!receipts.length && !plan) continue;
    const expires = Date.parse(turn.expiresAt);
    const live = OPEN_STATES.includes(turn.state) && Number.isFinite(expires) && expires > now;
    out.push({ id, actor: turn.actor ?? null, state: turn.state, expiresAt: turn.expiresAt ?? null, live, receipts, plan });
  }
  return out;
}
/**
 * Relleu d'un trasllat que acaba de fer qui crida (`porta-olivera --arxiva`), en
 * TOTS els torns vius que citen el document i com un sol acte: o es reapunten
 * tots o no se'n toca cap. `hash` és el sha256 del contingut mesurat abans del
 * trasllat: és la prova d'identitat que en el handoff fa el `reflex`, i permet
 * reapuntar també els rebuts duplicats i els plans vinculats d'altres torns. Els
 * torns tancats o caducats no es reescriuen mai: tornen com a `historics`.
 */
export function relocateDocument(root, from, to, { hash, now = Date.now() } = {}) {
  const source = relativePath(root, from), target = relativePath(root, to);
  guardRelleu(root, source, target);
  if (!/^[a-f0-9]{64}$/.test(hash ?? '')) throw new Error('Relleu sense el hash del contingut mesurat abans del trasllat');
  const digest = hashFile(path.join(root, target));
  if (digest !== hash) throw new Error(`Contingut divergent durant el trasllat: ${target}`);
  const citing = turnsCiting(root, source, { now });
  const illegibles = citing.filter(c => c.illegible);
  if (illegibles.length) throw new Error(`Torns il·legibles: ${illegibles.map(c => `${c.id} (${c.illegible})`).join(', ')}`);
  const live = citing.filter(c => c.live);
  const locks = [], written = [];
  try {
    for (const c of live) {
      const lock = `${recordPath(root, c.id)}.lock`;
      locks.push({ lock, fd: fs.openSync(lock, 'wx', 0o600) });
    }
    const nous = live.map(c => {
      const file = recordPath(root, c.id);
      const raw = fs.readFileSync(file, 'utf8');
      const turn = readTurn(root, c.id, { now });
      const fet = relleuDelTorn(turn, source, target, digest, 'relocate', { estricte: false });
      turn.revision += 1;
      turn.updatedAt = new Date().toISOString();
      return { id: c.id, file, raw, turn, ...fet };
    });
    for (const n of nous) { atomic(n.file, n.turn); written.push(n); }
    return {
      relleuats: nous.map(({ id, receipts, plan, planModificat }) => ({ id, receipts, plan, planModificat })),
      historics: citing.filter(c => !c.live).map(({ id, state, expiresAt, receipts, plan }) => ({ id, state, expiresAt, receipts: receipts.length, plan })),
    };
  } catch (error) {
    // Cap torn a mitges: el que ja s'ha escrit torna, byte a byte, al registre d'abans.
    for (const n of written.reverse()) {
      try { atomicText(n.file, n.raw); }
      catch (e) { error.message = `${error.message}; a més, el torn ${n.id} no s'ha pogut restaurar (${e.message})`; }
    }
    throw error;
  } finally {
    for (const { lock, fd } of locks) { fs.closeSync(fd); fs.unlinkSync(lock); }
  }
}
export function protectedTurnFiles(root) {
  const dir=path.join(root,STORE), out=new Set();
  if(!fs.existsSync(dir)) return out;
  for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))) {
    const turn=json(path.join(dir,name));
    if(!turnPattern.test(turn.turn_id)||!Array.isArray(turn.history)||!turn.receipts) throw new Error(`Torn il·legible: ${name}`);
    // Closed receipts are protected too until an explicit archival handoff is supported.
    if(turn.plan?.file) out.add(turn.plan.file);
    for(const receipt of Object.values(turn.receipts)) out.add(receipt.file);
  }
  return out;
}

export function startHumanWatch(root,id) {
 return mutateTurn(root,id,turn=>{
  if(turn.humanInventoryVersion===1||turn.humanBaseline) throw new Error('Inventari humà ja establit; no es pot reiniciar');
  turn.humanBaseline={at:new Date().toISOString(),provenance:'observed-at-upgrade',files:Object.fromEntries(Object.entries(inventory(root)).filter(([file])=>humanZone(file)))};
  turn.history.push({action:'start-human-watch',at:turn.humanBaseline.at,note:'Observació actual; no acredita vigilància anterior ni autoria dels canvis previs.'});
 });
}

export function acknowledgeHumanZoneChanges(root, id, note = 'Reconeixement explícit de canvis a la zona humana') {
  return mutateTurn(root, id, turn => {
    if (!turn.humanBaseline) throw new Error('No hi ha vigilància humana activa al torn');
    const currentHumanZone = Object.fromEntries(Object.entries(inventory(root)).filter(([file]) => humanZone(file)));
    const changedFiles = changes(turn.humanBaseline.files, currentHumanZone);
    if (!changedFiles.length) throw new Error('No hi ha canvis a la zona humana per a reconéixer');

    turn.humanBaseline.files = currentHumanZone;
    turn.humanBaseline.at = new Date().toISOString();
    turn.humanBaseline.provenance = 'acknowledged';
    turn.verification = null;
    turn.history.push({ action: 'acknowledge-human-zone-changes', files: changedFiles, at: turn.humanBaseline.at, note });
  });
}
