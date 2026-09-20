import fs from 'node:fs';
import path from 'node:path';
import { ROOT, sha, font, segura, atomic, inventari, comprovaCataleg } from './cataleg_skills.mjs';

const GLOBALS = ['.agents/BOOTSTRAP.md', '.agents/AGENTS.md', '.agents/PROFILE.md',
  '.agents/BASELINE.md', '.agents/PROTOCOL_PETORRETA.md', '.agents/consell.json'];
const CONTROL = ['.agents/manifest.yaml', '.agents/skills/00_INDEX_SKILLS.md',
  '.agents/protocolledge.json', '.agents/DESTINS_CANONICS.json'];
const TTL = 30 * 60 * 1000;
const words = t => t.normalize('NFC').toLowerCase().split(/[^\p{L}\p{N}·]+/u).filter(Boolean);
export function encaixa(text, trigger) {
  const input = words(text), needle = words(trigger);
  if (!needle.length) return false;
  return input.some((word, start) => {
    if (!word.startsWith(needle[0])) return false;
    let next = 1, gaps = 0;
    for (let i = start + 1; i < input.length && next < needle.length; i++) {
      if (input[i].startsWith(needle[next])) next++;
      else if (++gaps > 2) return false;
    }
    return next === needle.length;
  });
}
export function registre(root = ROOT) {
  const src = font(root, '.agents/protocolledge.json');
  const data = JSON.parse(src.text);
  if (data.schema !== 'sdp.protocolledge.v1' || !['error', 'default'].includes(data.onUnknown) || !Array.isArray(data.rutes))
    throw new Error('Contracte protocolledge invàlid');
  const ids = new Set();
  for (const row of data.rutes) {
    if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id) ||
        !Array.isArray(row.claus) || !row.claus.length || row.claus.some(c => typeof c !== 'string' || !c.trim()) ||
        !Array.isArray(row.lectures)) throw new Error('Ruta de protocol duplicada o invàlida');
    ids.add(row.id);
    for (const rel of [row.plantilla, ...row.lectures]) font(root, rel);
  }
  if (data.default) font(root, data.default);
  if (data.onUnknown === 'default' && !data.default) throw new Error('Falta plantilla default');
  return data;
}
export function resolProtocols(task, ids = [], root = ROOT) {
  if (typeof task !== 'string' || !task.trim() || !Array.isArray(ids) || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length)
    throw new Error('Petició o selecció de protocols invàlida');
  const data = registre(root);
  let selected;
  if (ids.length) {
    selected = ids.map(id => {
      const row = data.rutes.find(r => r.id === id);
      if (!row) throw new Error(`Protocol desconegut: ${id}`);
      return row;
    });
  } else {
    selected = data.rutes.filter(row => row.claus.some(clau => encaixa(task, clau)));
    if (selected.some(r => r.id === 'prompt.local')) selected = selected.filter(r => r.id !== 'prompt.consell');
  }
  if (!selected.length) {
    if (data.onUnknown === 'error') throw new Error('Cap protocol aplicable; selecció explícita requerida');
    selected = [{ id: 'default', plantilla: data.default, lectures: [] }];
  }
  if (selected.some(r => r.id === 'prompt.local') && selected.some(r => r.id === 'prompt.consell'))
    throw new Error('Destinatari local i extern simultanis');
  return selected;
}
export function prepara(task, ids = [], root = ROOT) {
  const all = inventari(root);
  const check = comprovaCataleg(root, all);
  if (!check.ok) throw new Error(check.problemes.join('; '));
  const skills = all.filter(s => s.core || s.triggers.some(t => encaixa(task, t)))
    .sort((a,b) => a.prioritat - b.prioritat || (a.id < b.id ? -1 : 1));
  const protocols = resolProtocols(task, ids, root);
  const paths = [...new Set([...GLOBALS, ...CONTROL, ...skills.map(s => s.ruta),
    ...protocols.flatMap(p => [p.plantilla, ...p.lectures])])];
  const sources = paths.map(rel => font(root, rel));
  const contingut = sources.map(s => `\n<<<FONT ${s.ruta} sha256=${s.sha256}>>>\n${s.text}\n<<<FI FONT ${s.ruta}>>>\n`).join('');
  return { esquema: 'sdp.matrix.v2', estat: 'preparat', peticio_sha256: sha(task),
    skills: skills.map(s => s.id), protocols: protocols.map(p => p.id),
    // Totes les skills entren al hash del registre, encara que no s'hagen activat.
    registre_sha256: sha(JSON.stringify(all.map(s => [s.ruta, s.sha256]))),
    fonts: sources.map(({ text, ...receipt }) => receipt), contingut, contingut_sha256: sha(contingut) };
}
export function identitatTorn(payload) {
  if (typeof payload?.transcriptPath !== 'string' || !path.isAbsolute(payload.transcriptPath))
    throw new Error('El host ha de passar transcriptPath absolut al preflight i a PreToolUse');
  const real = fs.realpathSync(payload.transcriptPath);
  const lines = fs.readFileSync(real, 'utf8').split(/\r?\n/).filter(s => s.trim());
  let task = null, ordinal = 0;
  for (const line of lines) {
    const event = JSON.parse(line);
    if (event.type === 'USER_INPUT') {
      if (typeof event.content !== 'string' || !event.content.trim()) throw new Error('USER_INPUT no textual o buit');
      task = event.content; ordinal++;
    }
  }
  if (!task) throw new Error('Transcript sense USER_INPUT');
  const sessio = sha(real);
  const torn = sha(JSON.stringify([sessio, ordinal, task]));
  return { sessio, torn, task };
}
const receiptPath = identity => `.agents/.matrix-rebuts/${identity.torn}.json`;
export function invalidaEmissio(identity, root = ROOT) {
  const file = segura(root, receiptPath(identity));
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
export function desaEmissio(context, identity, ids, root = ROOT, now = Date.now()) {
  segura(root, '.agents/.matrix-rebuts');
  fs.mkdirSync(path.join(root, '.agents/.matrix-rebuts'), { recursive: true, mode: 0o700 });
  const { contingut, ...summary } = context;
  const result = { ...summary, estat: 'emes_al_hook', sessio: identity.sessio, torn: identity.torn,
    seleccio: ids, t: new Date(now).toISOString() };
  atomic(root, receiptPath(identity), JSON.stringify(result) + '\n');
  return result;
}
export function verificaEmissio(payload, root = ROOT, now = Date.now()) {
  const identity = identitatTorn(payload);
  const old = JSON.parse(font(root, receiptPath(identity)).text);
  const timestamp = typeof old.t === 'string' ? Date.parse(old.t) : NaN;
  if (old.esquema !== 'sdp.matrix.v2' || old.estat !== 'emes_al_hook' || old.sessio !== identity.sessio || old.torn !== identity.torn ||
      !Number.isFinite(timestamp) || timestamp > now || now - timestamp > TTL) throw new Error('Rebut absent, alié, futur, invàlid o caducat');
  if (!Array.isArray(old.seleccio)) throw new Error('Rebut sense selecció de protocols');
  const actual = prepara(identity.task, old.seleccio, root);
  for (const field of ['peticio_sha256', 'registre_sha256', 'contingut_sha256', 'fonts', 'skills', 'protocols'])
    if (JSON.stringify(old[field]) !== JSON.stringify(actual[field])) throw new Error(`Context canviat: ${field}`);
  return old;
}
export async function emet(text, stream = process.stdout) {
  await new Promise((resolve, reject) => {
    const error = e => { stream.off('error', error); reject(e); };
    stream.once('error', error);
    stream.write(text, e => { stream.off('error', error); e ? reject(e) : resolve(); });
  });
}