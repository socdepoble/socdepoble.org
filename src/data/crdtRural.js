/**
 * CRDT rural propi: conjunt creixent d'operacions immutables + DAG causal,
 * seqüència RGA de punts Unicode i registres multivalor per a metadades.
 * No és Automerge. Principis: Kleppmann/Beresford, JSON CRDT (2017),
 * https://arxiv.org/html/1608.03960v3 (identitats estables i causalitat).
 *
 * join = unió per DOT. Ordre, duplicats i partició de transport no canvien
 * l'estat. Un DOT amb dos continguts es rebutja, mai s'arbitra amb un hash.
 * Un comptador identifica; NO implica causalitat: només parents observats.
 * Àncores/parents que encara no han arribat queden pendents, sense pèrdua.
 * Text eliminat es conserva com a tombstone. No hi ha GC/compaction causal.
 */
import { copiaJsonRural } from './persistenciaLocalRural.js';
import { canonitzaJsonJcs } from './federacio/portabilitatFediversity.js';

export const ESQUEMA_CRDT_RURAL = 'sdp.rural.rga-mv-dag.v1';
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_OPS = 2048;
const MAX_CARACTERS = 100000;
const CAMPS = ['title', 'slug', 'folderId', 'tags', 'prioritat', 'updatedAt'];
const actorValid = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v);
const enter = n => Number.isSafeInteger(n) && n >= 1;
const error = code => Object.assign(new Error(code), { code });
const invalid = () => error('RURAL_CRDT_INVALID');
const igual = (a, b) => canonitzaJsonJcs(a) === canonitzaJsonJcs(b);
const ordre = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const key = op => `${op.replica}:${op.comptador}`;
function idOp(v) {
  if (typeof v !== 'string') throw invalid();
  const i = v.lastIndexOf(':');
  if (i < 1 || !actorValid(v.slice(0, i)) || !/^[1-9][0-9]{0,15}$/.test(v.slice(i + 1)) || !enter(Number(v.slice(i + 1)))) throw invalid();
  return v;
}
function idNota(v) {
  if (typeof v !== 'string' || !v || v.length > 256 || v !== v.trim() || /[\u0000-\u001f\u007f/\\]/.test(v) || ['.', '..'].includes(v)) throw invalid();
  return v;
}
function exactes(v, keys) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).sort().join('|') !== [...keys].sort().join('|')) throw invalid();
}
function text(v, max) {
  if (typeof v !== 'string' || v.length > max || /[\uD800-\uDFFF]/u.test(v)) throw invalid();
  return v;
}
function notaValida(entrada, id) {
  const n = copiaJsonRural(entrada, MAX_BYTES);
  if (!n || typeof n !== 'object' || Array.isArray(n) || Object.keys(n).some(k => !['id', 'content', ...CAMPS].includes(k)) || (n.id !== undefined && n.id !== id)) throw invalid();
  text(n.title, 200); text(n.content, MAX_CARACTERS);
  if (!n.title.trim()) throw invalid();
  const r = { title: n.title, content: n.content, slug: n.slug ?? id, folderId: n.folderId ?? 'camp',
    tags: n.tags ?? [], prioritat: n.prioritat ?? 'normal', updatedAt: n.updatedAt ?? '' };
  for (const camp of CAMPS.filter(c => c !== 'tags')) text(r[camp], camp === 'title' ? 200 : 512);
  if (!Array.isArray(r.tags) || r.tags.length > 64 || r.tags.some(t => typeof t !== 'string' || t.length > 128)) throw invalid();
  return r;
}
function validaOp(op) {
  exactes(op, ['replica', 'comptador', 'id', 'parents', 'lamport', 'elimina', 'insert', 'remove', 'camps']);
  if (!actorValid(op.replica) || !enter(op.comptador) || !enter(op.lamport) || op.lamport > MAX_OPS || typeof op.elimina !== 'boolean') throw invalid();
  idNota(op.id);
  if (!Array.isArray(op.parents) || op.parents.length > MAX_OPS || new Set(op.parents).size !== op.parents.length) throw invalid();
  for (const parent of op.parents) { idOp(parent); if (parent === key(op)) throw invalid(); }
  op.parents.sort(ordre);
  exactes(op.insert, ['after', 'text']); text(op.insert.text, 20000);
  if (op.insert.after !== null && (!Array.isArray(op.insert.after) || op.insert.after.length !== 2 || !Number.isSafeInteger(op.insert.after[1]) || op.insert.after[1] < 0)) throw invalid();
  if (op.insert.after !== null) idOp(op.insert.after[0]);
  if (!Array.isArray(op.remove) || op.remove.length > MAX_OPS) throw invalid();
  for (const range of op.remove) {
    if (!Array.isArray(range) || range.length !== 3 || !Number.isSafeInteger(range[1]) || range[1] < 0 || !Number.isSafeInteger(range[2]) || range[2] <= range[1]) throw invalid();
    idOp(range[0]);
  }
  if (!op.camps || typeof op.camps !== 'object' || Array.isArray(op.camps) || Object.keys(op.camps).some(k => !CAMPS.includes(k))) throw invalid();
  for (const [camp, valor] of Object.entries(op.camps)) {
    if (camp === 'tags') {
      if (!Array.isArray(valor) || valor.length > 64 || valor.some(v => typeof v !== 'string' || v.length > 128)) throw invalid();
    } else text(valor, camp === 'title' ? 200 : 512);
  }
  if (op.elimina && (op.insert.text || Object.keys(op.camps).length)) throw invalid();
}
function normalitza(entrada) {
  const s = copiaJsonRural(entrada, MAX_BYTES);
  exactes(s, ['schema', 'ops']);
  if (s.schema !== ESQUEMA_CRDT_RURAL || !Array.isArray(s.ops) || s.ops.length > MAX_OPS) throw invalid();
  let caracters = 0;
  const ids = new Set();
  for (const op of s.ops) {
    validaOp(op); const id = key(op);
    if (ids.has(id)) throw invalid(); ids.add(id);
    caracters += Array.from(op.insert.text).length;
    if (caracters > MAX_CARACTERS) throw error('RURAL_CRDT_QUOTA');
  }
  s.ops.sort((a, b) => ordre(a.replica, b.replica) || a.comptador - b.comptador);
  return s;
}
function ancestre(a, b, map) {
  const vistos = new Set(), pila = [...(map.get(b)?.parents ?? [])];
  while (pila.length) {
    const id = pila.pop();
    if (id === a) return true;
    if (vistos.has(id)) continue;
    vistos.add(id); pila.push(...(map.get(id)?.parents ?? []));
  }
  return false;
}
function analitza(entrada) {
  const state = normalitza(entrada), map = new Map(state.ops.map(op => [key(op), op]));
  const resoltes = new Set();
  const ordered = [...state.ops].sort((a, b) => a.lamport - b.lamport || ordre(key(a), key(b)));
  for (const op of ordered) {
    const parents = op.parents.map(id => map.get(id));
    for (const p of parents.filter(Boolean)) if (p.id !== op.id || p.lamport >= op.lamport) throw invalid();
    if (parents.every(Boolean) && op.lamport !== 1 + Math.max(0, ...parents.map(p => p.lamport))) throw invalid();
    if (parents.some(p => !p || !resoltes.has(key(p)))) continue;
    const referencia = (id, index) => {
      const font = map.get(id);
      if (!font || font.id !== op.id || !ancestre(id, key(op), map) || index >= Array.from(font.insert.text).length) throw invalid();
    };
    if (op.insert.after !== null) referencia(op.insert.after[0], op.insert.after[1]);
    for (const range of op.remove) referencia(range[0], range[2] - 1);
    resoltes.add(key(op));
  }
  return { state, map, resoltes };
}
export function estatCrdtRuralBuit() { return { schema: ESQUEMA_CRDT_RURAL, ops: [] }; }
export function normalitzaCrdtRural(entrada) { return analitza(entrada).state; }

/** join és unió immutada. Les dependències poden arribar en qualsevol ordre. */
export function fusionaCrdtRural(a, b) {
  const x = normalitza(a), y = normalitza(b), unit = new Map(x.ops.map(op => [key(op), op]));
  for (const op of y.ops) {
    const anterior = unit.get(key(op));
    if (anterior && !igual(anterior, op)) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
    unit.set(key(op), op);
  }
  return analitza({ schema: ESQUEMA_CRDT_RURAL, ops: [...unit.values()] }).state;
}
function textDe(ops) {
  const nodes = new Map(), fills = new Map(), eliminats = new Set();
  const ref = (op, index) => `${op}@${index}`;
  for (const op of ops) {
    const chars = Array.from(op.insert.text), id = key(op);
    for (let i = 0; i < chars.length; i++) {
      const parent = i === 0 ? (op.insert.after === null ? '' : ref(...op.insert.after)) : ref(id, i - 1);
      const nid = ref(id, i), node = { ref: [id, i], char: chars[i], op, index: i };
      nodes.set(nid, node); if (!fills.has(parent)) fills.set(parent, []); fills.get(parent).push(nid);
    }
    for (const [font, start, end] of op.remove) for (let i = start; i < end; i++) eliminats.add(ref(font, i));
  }
  for (const children of fills.values()) children.sort((a, b) => {
    const x = nodes.get(a), y = nodes.get(b);
    return y.op.lamport - x.op.lamport || ordre(y.op.replica, x.op.replica) || y.op.comptador - x.op.comptador || y.index - x.index;
  });
  const pila = [...(fills.get('') ?? [])].reverse(), chars = [], refs = [];
  let vistos = 0;
  while (pila.length) {
    const id = pila.pop(), n = nodes.get(id); vistos++;
    if (!eliminats.has(id)) { chars.push(n.char); refs.push(n.ref); }
    const children = fills.get(id) ?? [];
    for (let i = children.length - 1; i >= 0; i--) pila.push(children[i]);
  }
  if (vistos !== nodes.size) throw invalid();
  return { content: chars.join(''), refs };
}
function docDe(id, a) {
  const ops = a.state.ops.filter(op => op.id === id && a.resoltes.has(key(op)));
  if (!ops.length) return { nota: null, esborrada: false, text: { content: '', refs: [] } };
  const deletes = ops.filter(op => op.elimina);
  const live = ops.filter(op => !op.elimina && !deletes.some(d => ancestre(key(op), key(d), a.map)));
  const t = textDe(ops);
  const variants = {}, valors = {};
  for (const camp of CAMPS) {
    const writes = ops.filter(op => Object.hasOwn(op.camps, camp));
    const finals = writes.filter(op => !deletes.some(d => ancestre(key(op), key(d), a.map))
      && !writes.some(altre => ancestre(key(op), key(altre), a.map)));
    finals.sort((x, y) => x.lamport - y.lamport || ordre(key(x), key(y)));
    if (finals.length) {
      const v = [...new Map(finals.map(op => [canonitzaJsonJcs(op.camps[camp]), op.camps[camp]])).values()];
      valors[camp] = v.at(-1); if (v.length > 1) variants[camp] = v;
    }
  }
  const nota = { id, title: valors.title ?? id, slug: valors.slug ?? id, folderId: valors.folderId ?? 'camp',
    tags: valors.tags ?? [], prioritat: valors.prioritat ?? 'normal', updatedAt: valors.updatedAt ?? '', content: t.content, variants };
  return { nota, esborrada: !live.length, text: t };
}
export function projectaCrdtRural(entrada) {
  const a = analitza(entrada), notes = [], esborrades = [];
  for (const id of [...new Set(a.state.ops.map(op => op.id))].sort(ordre)) {
    const doc = docDe(id, a);
    if (doc.nota) (doc.esborrada ? esborrades : notes).push(doc.nota);
  }
  return copiaJsonRural({ notes, esborrades, pendents: a.state.ops.length - a.resoltes.size }, MAX_BYTES);
}
export function baseNotaCrdtRural(entrada, id) {
  idNota(id); const a = analitza(entrada);
  return { schema: ESQUEMA_CRDT_RURAL, ops: a.state.ops.filter(op => op.id === id) };
}
function rangs(refs) {
  const r = [];
  for (const [id, index] of refs) {
    const prev = r.at(-1);
    if (prev && prev[0] === id && prev[2] === index) prev[2]++;
    else r.push([id, index, index + 1]);
  }
  return r;
}
/** Canvi derivat EXCLUSIVAMENT del base observat pel formulari. Retorna una
 * delta d'una operació; no incorpora el document sencer a cada entrada de cua. */
export function canviaCrdtRural(base, opcions) {
  const opts = copiaJsonRural(opcions, MAX_BYTES);
  if (!opts || Object.keys(opts).some(k => !['id', 'replica', 'comptador', 'nota', 'elimina', 'resol'].includes(k)) || !actorValid(opts.replica) || !enter(opts.comptador)) throw invalid();
  const id = idNota(opts.id), a = analitza(base);
  if (a.state.ops.some(op => op.id !== id) || a.state.ops.length !== a.resoltes.size) throw error('RURAL_CRDT_DEPENDENCIES_PENDING');
  const dot = `${opts.replica}:${opts.comptador}`;
  if (a.map.has(dot)) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
  if (opts.elimina !== undefined && typeof opts.elimina !== 'boolean') throw invalid();
  if (opts.resol !== undefined && (!Array.isArray(opts.resol) || opts.resol.some(c => !CAMPS.includes(c)) || new Set(opts.resol).size !== opts.resol.length)) throw invalid();
  const elimina = opts.elimina === true, doc = docDe(id, a), old = doc.text;
  const nota = elimina ? null : notaValida(opts.nota, id);
  const chars = Array.from(nota?.content ?? ''), previs = Array.from(old.content);
  let start = 0, suffix = 0;
  while (start < chars.length && start < previs.length && chars[start] === previs[start]) start++;
  while (suffix < chars.length - start && suffix < previs.length - start && chars[chars.length - 1 - suffix] === previs[previs.length - 1 - suffix]) suffix++;
  const camps = {};
  if (!elimina) for (const camp of CAMPS) if (!doc.nota || !igual(nota[camp], doc.nota[camp]) || opts.resol?.includes(camp)) camps[camp] = nota[camp];
  const parents = new Set(a.state.ops.map(key));
  for (const op of a.state.ops) for (const p of op.parents) parents.delete(p);
  const op = { replica: opts.replica, comptador: opts.comptador, id, parents: [...parents].sort(ordre),
    lamport: 1 + Math.max(0, ...a.state.ops.map(op => op.lamport)), elimina,
    insert: { after: start ? old.refs[start - 1] : null, text: chars.slice(start, chars.length - suffix).join('') },
    remove: rangs(old.refs.slice(start, previs.length - suffix)), camps };
  const delta = { schema: ESQUEMA_CRDT_RURAL, ops: [op] };
  // La delta sola pot ser òrfena; el join amb el base prova totes les referències.
  fusionaCrdtRural(a.state, delta);
  return normalitza(delta);
}


/** Frontiera observada i tancament causal per als Markdown de projecció.
 * No s'inferix un base del timestamp ni del contingut actual d'una carpeta. */
export function frontieraNotaCrdtRural(entrada, id) {
  const base = baseNotaCrdtRural(entrada, id), a = analitza(base);
  if (a.resoltes.size !== base.ops.length) throw error('RURAL_CRDT_DEPENDENCIES_PENDING');
  const heads = new Set(base.ops.map(key));
  for (const op of base.ops) for (const p of op.parents) heads.delete(p);
  return [...heads].sort(ordre);
}
export function baseCausalNotaCrdtRural(entrada, id, headsInput) {
  idNota(id); const heads = copiaJsonRural(headsInput, 256 * 1024), a = analitza(entrada);
  if (!Array.isArray(heads) || heads.length > MAX_OPS || new Set(heads).size !== heads.length) throw invalid();
  const ids = new Set(), pila = [...heads];
  while (pila.length) {
    const actual = idOp(pila.pop());
    if (ids.has(actual)) continue;
    const op = a.map.get(actual);
    if (!op || op.id !== id || !a.resoltes.has(actual)) throw error('RURAL_CRDT_DEPENDENCIES_PENDING');
    ids.add(actual); pila.push(...op.parents);
  }
  return normalitza({ schema: ESQUEMA_CRDT_RURAL, ops: a.state.ops.filter(op => ids.has(key(op))) });
}
