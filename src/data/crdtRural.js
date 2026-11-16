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
 * PF-03: l'ACK remot explícit permet retirar payloads de documents suprimits.
 * El certificat causal es conserva; una rèplica antiga no els ressuscita.
 */
import { copiaJsonRural } from './persistenciaLocalRural.js';
import { canonitzaJsonJcs, sha256Hex } from './federacio/portabilitatFediversity.js';

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
const empremta = op => sha256Hex(canonitzaJsonJcs(op));
const HEX = /^[a-f0-9]{64}$/;
const dataValida = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const autoritatValida = v => {
  if (typeof v !== 'string') return false;
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password && u.origin === v; } catch { return false; }
};
const metadataBuida = () => ({ acks: [], retirades: [], fronteres: [] });
function normalitzaSincronitzacio(entrada = metadataBuida()) {
  const m = copiaJsonRural(entrada, MAX_BYTES);
  exactes(m, ['acks', 'retirades', 'fronteres']);
  if (!Array.isArray(m.acks) || !Array.isArray(m.retirades) || !Array.isArray(m.fronteres)
    || m.acks.length > MAX_OPS || m.retirades.length > MAX_OPS || m.fronteres.length > 32) throw invalid();
  const dots = new Set(), ids = new Set();
  for (const a of m.acks) {
    exactes(a, ['dot', 'sha256', 'autoritat', 'confirmatEl', 'ack_remot_confirmat']); idOp(a.dot);
    if (dots.has(a.dot) || !HEX.test(a.sha256) || !autoritatValida(a.autoritat) || !dataValida(a.confirmatEl) || a.ack_remot_confirmat !== true) throw invalid();
    dots.add(a.dot);
  }
  dots.clear();
  for (const r of m.retirades) {
    exactes(r, ['id', 'dots', 'supressions']); idNota(r.id);
    if (ids.has(r.id) || !Array.isArray(r.dots) || !r.dots.length || r.dots.length > MAX_OPS
      || !Array.isArray(r.supressions) || !r.supressions.length || r.supressions.length > MAX_OPS) throw invalid();
    ids.add(r.id);
    for (const d of r.dots) {
      exactes(d, ['dot', 'sha256', 'parents', 'lamport', 'caracters']); idOp(d.dot);
      if (dots.has(d.dot) || !HEX.test(d.sha256) || !enter(d.lamport) || d.lamport > MAX_OPS
        || !Number.isSafeInteger(d.caracters) || d.caracters < 0 || d.caracters > 20000
        || !Array.isArray(d.parents) || d.parents.length > MAX_OPS || new Set(d.parents).size !== d.parents.length) throw invalid();
      for (const parent of d.parents) idOp(parent); d.parents.sort(ordre); dots.add(d.dot);
    }
    const map = new Map(r.dots.map(d => [d.dot, d])), heads = new Set(map.keys()), supressions = new Set();
    for (const d of r.dots) {
      const parents = d.parents.map(p => map.get(p));
      if (parents.some(p => !p || p.lamport >= d.lamport) || d.lamport !== 1 + Math.max(0, ...parents.map(p => p.lamport))) throw invalid();
      for (const parent of d.parents) heads.delete(parent);
    }
    for (const op of r.supressions) {
      validaOp(op); const d = map.get(key(op));
      if (!op.elimina || op.id !== r.id || supressions.has(key(op)) || !d || empremta(op) !== d.sha256
        || d.lamport !== op.lamport || d.caracters !== 0 || !igual(d.parents, op.parents)) throw invalid();
      for (const [font, , end] of op.remove) if (!map.has(font) || end > map.get(font).caracters || !ancestre(font, key(op), map)) throw invalid();
      supressions.add(key(op));
    }
    // Una llista arbitrària de hashes no pot retirar notes: el DAG ha de
    // tancar-se exclusivament en operacions de supressió vàlides i íntegres.
    if ([...heads].some(head => !supressions.has(head))) throw invalid();
    r.dots.sort((a, b) => ordre(a.dot, b.dot));
    r.supressions.sort((a, b) => ordre(key(a), key(b)));
  }
  if (dots.size > MAX_OPS) throw invalid();
  const autoritats = new Set();
  for (const f of m.fronteres) {
    exactes(f, ['autoritat', 'confirmatEl', 'dots']);
    if (!autoritatValida(f.autoritat) || autoritats.has(f.autoritat) || !dataValida(f.confirmatEl)
      || !Array.isArray(f.dots) || f.dots.length > MAX_OPS || new Set(f.dots).size !== f.dots.length) throw invalid();
    autoritats.add(f.autoritat); for (const dot of f.dots) idOp(dot); f.dots.sort(ordre);
  }
  m.acks.sort((a, b) => ordre(a.dot, b.dot)); m.retirades.sort((a, b) => ordre(a.id, b.id));
  m.fronteres.sort((a, b) => ordre(a.autoritat, b.autoritat));
  return m;
}
function fusionaSincronitzacio(a, b) {
  const x = normalitzaSincronitzacio(a), y = normalitzaSincronitzacio(b);
  const acks = new Map(x.acks.map(a => [a.dot, a])), retirades = new Map();
  for (const a of y.acks) {
    const anterior = acks.get(a.dot);
    if (anterior && anterior.sha256 !== a.sha256) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
    // La primera confirmació no s'ajorna amb cada reintent. Desempat estable.
    if (!anterior || ordre(`${a.confirmatEl}|${a.autoritat}`, `${anterior.confirmatEl}|${anterior.autoritat}`) < 0) acks.set(a.dot, a);
  }
  for (const r of [...x.retirades, ...y.retirades]) {
    const item = retirades.get(r.id) ?? { dots: new Map(), supressions: new Map() }, dots = item.dots;
    for (const d of r.dots) {
      if (dots.has(d.dot) && !igual(dots.get(d.dot), d)) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
      dots.set(d.dot, d);
    }
    for (const op of r.supressions) {
      if (item.supressions.has(key(op)) && !igual(item.supressions.get(key(op)), op)) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
      item.supressions.set(key(op), op);
    }
    retirades.set(r.id, item);
  }
  const fronteres = new Map();
  for (const f of [...x.fronteres, ...y.fronteres]) {
    const anterior = fronteres.get(f.autoritat);
    if (!anterior || f.confirmatEl > anterior.confirmatEl) fronteres.set(f.autoritat, f);
    else if (f.confirmatEl === anterior.confirmatEl) fronteres.set(f.autoritat, { ...f, dots: [...new Set([...anterior.dots, ...f.dots])] });
  }
  return normalitzaSincronitzacio({ acks: [...acks.values()], retirades: [...retirades].map(([id, item]) => ({ id, dots: [...item.dots.values()], supressions: [...item.supressions.values()] })), fronteres: [...fronteres.values()] });
}
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
  exactes(s, ['schema', 'ops', ...(Object.hasOwn(s, 'sincronitzacio') ? ['sincronitzacio'] : [])]);
  if (s.schema !== ESQUEMA_CRDT_RURAL || !Array.isArray(s.ops) || s.ops.length > MAX_OPS) throw invalid();
  let caracters = 0;
  const ids = new Set();
  for (const op of s.ops) {
    validaOp(op); const id = key(op);
    if (ids.has(id)) throw invalid(); ids.add(id);
    caracters += Array.from(op.insert.text).length;
    if (caracters > MAX_CARACTERS) throw error('RURAL_CRDT_QUOTA');
  }
  if (s.sincronitzacio !== undefined) {
    s.sincronitzacio = normalitzaSincronitzacio(s.sincronitzacio);
    const retired = new Map(s.sincronitzacio.retirades.flatMap(r => r.dots.map(d => [d.dot, { ...d, id: r.id }])));
    const acks = new Map(s.sincronitzacio.acks.map(a => [a.dot, a]));
    for (const op of s.ops) {
      const d = retired.get(key(op)), a = acks.get(key(op));
      if (d && (d.id !== op.id || d.sha256 !== empremta(op) || d.lamport !== op.lamport || d.caracters !== Array.from(op.insert.text).length || !igual(d.parents, op.parents))
        || a && a.sha256 !== empremta(op)) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
    }
    for (const [dot, d] of retired) if (acks.has(dot) && acks.get(dot).sha256 !== d.sha256) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
    s.ops = s.ops.filter(op => !retired.has(key(op)));
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
  const retirades = new Set(state.sincronitzacio?.retirades.map(r => r.id) ?? []);
  for (const op of ordered) {
    // Una edició concurrent arribada després de compactar es conserva íntegra
    // pendent de reconciliació. No es perd ni es convertix en resurrecció.
    if (retirades.has(op.id)) continue;
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
  const sincronitzacio = x.sincronitzacio || y.sincronitzacio ? fusionaSincronitzacio(x.sincronitzacio, y.sincronitzacio) : null;
  // Filtra replays retirats abans de les quotes del nou estat. Altrament una
  // rèplica antiga podria sumar payload retirat a payload nou i provocar una
  // quota falsa, encara que el resultat normalitzat càpia en els límits.
  for (const r of sincronitzacio?.retirades ?? []) for (const d of r.dots) {
    const op = unit.get(d.dot);
    if (op && (op.id !== r.id || empremta(op) !== d.sha256 || d.lamport !== op.lamport || d.caracters !== Array.from(op.insert.text).length || !igual(d.parents, op.parents))) throw error('RURAL_CRDT_DOT_EQUIVOCATION');
    unit.delete(d.dot);
  }
  return analitza({ schema: ESQUEMA_CRDT_RURAL, ops: [...unit.values()], ...(sincronitzacio ? { sincronitzacio } : {}) }).state;
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
  const retirades = new Set(a.state.sincronitzacio?.retirades.map(r => r.id) ?? []);
  const reconciliacions = [...new Set(a.state.ops.filter(op => retirades.has(op.id)).map(op => op.id))].sort(ordre);
  return copiaJsonRural({ notes, esborrades, pendents: a.state.ops.length - a.resoltes.size,
    ...(reconciliacions.length ? { reconciliacions } : {}) }, MAX_BYTES);
}
export function baseNotaCrdtRural(entrada, id) {
  idNota(id); const a = analitza(entrada);
  if (a.state.sincronitzacio?.retirades.some(r => r.id === id)) throw error('RURAL_CRDT_REBASE_REQUIRED');
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
  if (a.state.sincronitzacio?.retirades.some(r => r.id === id)) throw error('RURAL_CRDT_REBASE_REQUIRED');
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
  if (a.state.sincronitzacio?.retirades.some(r => r.id === id)) throw error('RURAL_CRDT_REBASE_REQUIRED');
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

/** Contracte neutral d'ACK: l'adaptador remot autenticat confirma la captura
 * exacta DESPRÉS de confirmar-la durablement. Un export local o un estat online
 * no poden satisfer este contracte. Els hashes no autentiquen l'adaptador. */
export function preparaSincronitzacioCrdtRural(entrada, requestId) {
  if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(requestId)) throw invalid();
  const a = analitza(entrada);
  if (a.resoltes.size !== a.state.ops.length) throw error('RURAL_CRDT_DEPENDENCIES_PENDING');
  const heads = new Set(a.state.ops.map(key));
  for (const op of a.state.ops) for (const parent of op.parents) heads.delete(parent);
  return copiaJsonRural({ schema: 'sdp.rural.remote-request.v1', requestId, crdt: a.state,
    sha256: empremta(a.state), frontera: [...heads].sort(ordre) }, MAX_BYTES);
}

export function registraAckCrdtRural(entrada, peticioEntrada, rebutEntrada, autoritat) {
  const peticio = copiaJsonRural(peticioEntrada, MAX_BYTES), rebut = copiaJsonRural(rebutEntrada, MAX_BYTES);
  exactes(peticio, ['schema', 'requestId', 'crdt', 'sha256', 'frontera']);
  const preparada = preparaSincronitzacioCrdtRural(peticio.crdt, peticio.requestId);
  if (!igual(preparada, peticio)) throw invalid();
  exactes(rebut, ['schema', 'requestId', 'sha256', 'frontera', 'autoritat', 'confirmatEl', 'ack_remot_confirmat']);
  if (rebut.schema !== 'sdp.rural.remote-ack.v1' || !autoritatValida(autoritat) || rebut.autoritat !== autoritat
    || rebut.requestId !== peticio.requestId || rebut.sha256 !== peticio.sha256 || !igual(rebut.frontera, peticio.frontera)
    || !dataValida(rebut.confirmatEl) || rebut.ack_remot_confirmat !== true) throw error('RURAL_CRDT_ACK_INVALID');
  const state = normalitzaCrdtRural(entrada);
  const anterior = state.sincronitzacio?.fronteres.find(f => f.autoritat === autoritat);
  if (anterior && rebut.confirmatEl < anterior.confirmatEl) throw error('RURAL_CRDT_ACK_CLOCK_REGRESSION');
  // Només els DOTs capturats poden quedar confirmats. Una edició durant l'await
  // queda pendent fins que el remot confirme una nova captura.
  const originals = new Map([...state.ops.map(op => [key(op), empremta(op)]),
    ...(state.sincronitzacio?.retirades.flatMap(r => r.dots.map(d => [d.dot, d.sha256])) ?? [])]);
  for (const op of peticio.crdt.ops) if (originals.get(key(op)) !== empremta(op)) throw error('RURAL_CRDT_ACK_INVALID');
  const metadata = { acks: peticio.crdt.ops.map(op => ({ dot: key(op), sha256: empremta(op), autoritat,
    confirmatEl: rebut.confirmatEl, ack_remot_confirmat: true })), retirades: [],
  fronteres: [{ autoritat, confirmatEl: rebut.confirmatEl, dots: peticio.crdt.ops.map(key) }] };
  return normalitzaCrdtRural({ ...state, sincronitzacio: fusionaSincronitzacio(state.sincronitzacio, metadata) });
}

export const RETENCIO_TOMBSTONES_RURAL_MS = 90 * 24 * 60 * 60 * 1000;
/** Compactació pura i conservadora: només documents completament suprimits,
 * amb DAG tancat i ACK de tots els DOTs. L'edat usa dos rebuts del MATEIX
 * rellotge remot; updatedAt i el rellotge del dispositiu no intervenen.
 * El certificat permanent substituïx el payload, no la identitat causal. */
export function compactaCrdtRural(entrada) {
  const a = analitza(entrada), m = a.state.sincronitzacio;
  if (!m) return a.state;
  const acks = new Map(m.acks.map(ack => [ack.dot, ack])), retirades = [];
  for (const nota of projectaCrdtRural(a.state).esborrades) {
    const ops = a.state.ops.filter(op => op.id === nota.id), deletes = ops.filter(op => op.elimina);
    if (!deletes.length || ops.some(op => !a.resoltes.has(key(op)))) continue;
    const primera = acks.get(key(deletes[0]));
    if (!primera) continue;
    const f = m.fronteres.find(f => f.autoritat === primera.autoritat), observades = new Set(f?.dots ?? []);
    if (!f || ops.some(op => !observades.has(key(op)) || !acks.has(key(op)) || acks.get(key(op)).autoritat !== f.autoritat)
      || deletes.some(op => Date.parse(f.confirmatEl) - Date.parse(acks.get(key(op)).confirmatEl) <= RETENCIO_TOMBSTONES_RURAL_MS)) continue;
    retirades.push({ id: nota.id, dots: ops.map(op => ({ dot: key(op), sha256: empremta(op), parents: op.parents, lamport: op.lamport, caracters: Array.from(op.insert.text).length })), supressions: deletes });
  }
  return normalitzaCrdtRural({ ...a.state, sincronitzacio: fusionaSincronitzacio(m, { ...metadataBuida(), retirades }) });
}
