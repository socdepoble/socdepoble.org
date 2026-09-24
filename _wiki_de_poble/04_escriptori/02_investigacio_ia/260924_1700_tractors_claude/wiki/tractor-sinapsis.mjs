#!/usr/bin/env node
/**
 * tractor-sinapsis.mjs — Sinapsis: relacions, redundàncies i maduració.
 *
 * DESTÍ: tooling/wiki/tractor-sinapsis.mjs (en quarantena al laboratori
 * 260924_1700_tractors_claude/wiki). npm: "porta:sinapsis". Decisions:
 * tooling/wiki/maduracio.json (es crea buit amb --inicia).
 *
 * PER QUÈ EXISTIX
 *   El 260924 hi havia `02_saber/identitat.md` (un hub buit), `01_ser/01_identitat.md`
 *   i `01_ser/00_index_identitat.md` parlant del mateix, i cap eina ho deia.
 *   Les portes actuals vigilen la forma (frontmatter, noms, àncores) però no
 *   el fons: dos documents que diuen el mateix, dos títols quasi iguals, un
 *   paràgraf copiat en tres llocs. Este tractor mira el fons i, sobretot,
 *   OBLIGA A DECIDIR: cada troballa té un identificador estable i només deixa
 *   de bloquejar quan hi ha una decisió humana registrada. «Mantindre» caduca
 *   als 90 dies i torna a preguntar; «fusionar/renomenar/arxivar» que no
 *   s'executa en 14 dies torna a bloquejar. Això és el motor de maduració:
 *   no una llista de suggeriments, sinó decisions que envellixen.
 *
 * QUÈ DETECTA
 *   D1 noms-repetits      mateix nom de fitxer (normalitzat: sense prefix
 *                         numèric ni `index_`, sense accents) en carpetes distintes.
 *   D2 titols-semblants   H1 + description quasi iguals (Jaccard ≥ 0,6).
 *   D3 paragrafs-repetits el mateix paràgraf (≥ 25 paraules) en ≥ 2 documents.
 *                         El Llibre de Pedra Seca no repetix text: una idea
 *                         viu en un lloc i s'enllaça des dels altres.
 *   D4 skills             sense `status`, sense àncora ([[00_INDEX_SKILLS]] o
 *                         [[00_index]]), fora del catàleg, catàleg amb entrades
 *                         sense carpeta, o descripció del catàleg divergent.
 *   D5 sense-ancora       document de 01_ser/02_saber/03_actuar sense cap
 *                         [[00_index…]].
 *
 * ÚS
 *   node tooling/wiki/tractor-sinapsis.mjs            # informe; exit 1 si hi ha decisions pendents
 *   node tooling/wiki/tractor-sinapsis.mjs --json
 *   node tooling/wiki/tractor-sinapsis.mjs --inicia   # crea el fitxer de decisions buit
 *   Decidir: afig a maduracio.json
 *     "ID": { "decisio": "fusionar|renomenar|arxivar|mantindre|resolt", "per": "Mestre", "data": "AAAA-MM-DD", "motiu": "…" }
 *
 * Pedra Seca: zero dependències, ESM, fail-closed, només lectura (excepte --inicia).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { arrelSegura, esMain, CAMINS } from '../lib/arrel.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';

export const DECISIONS = 'tooling/wiki/maduracio.json';
export const CADUCITAT_MANTINDRE_DIES = 90;
export const TERMINI_EXECUCIO_DIES = 14;
const DIA_MS = 86400000;
const EXCLOU = /(^|\/)(node_modules|\.git|\.obsidian|dist|build|90_arxiu_historic|04_escriptori|\.quarantena[^/]*|\.sdp-paperera)(\/|$)/;
const STOP = new Set('de la el els les i a en per amb que un una dels del al als es se no com més hi ha són és seu seua seus seues aquest aquesta este esta això açò sobre entre cap tot tota tots totes ser està quan on qui què sense també ja fins des o ni han hem heu sou som eres ets pot poden cal'.split(' '));

const posix = (p) => p.split(path.sep).join('/');
export const normalitza = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const tokens = (s) => new Set(normalitza(s).split(' ').filter((w) => w.length >= 4 && !STOP.has(w)));
export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}
export const idDe = (tipus, rutes) => crypto.createHash('sha256').update(`${tipus}|${[...rutes].sort().join('|')}`).digest('hex').slice(0, 12);

/** Corpus: Wiki operativa (sense arxiu ni Escriptori), skills i AGENTS.md. */
export function corpus(root, arrels = [CAMINS.wiki, CAMINS.skills, 'AGENTS.md']) {
  const docs = [];
  const walk = (rel) => {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs) || EXCLOU.test(rel)) return;
    const st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) return;
    if (st.isDirectory()) { for (const e of fs.readdirSync(abs).sort()) walk(posix(path.join(rel, e))); return; }
    if (!/\.md$/i.test(rel)) return;
    const text = fs.readFileSync(abs, 'utf8');
    const { data, body } = parseFrontmatter(text);
    docs.push({ rel, text, data: data || {}, body, titol: /^#\s+(.+)$/m.exec(body)?.[1]?.trim() ?? '', paragrafs: paragrafs(body) });
  };
  for (const a of arrels) walk(a);
  return docs;
}

/** Paràgrafs de prosa: fora de codi, taules, llistes d'enllaços i capçaleres. */
export function paragrafs(body) {
  const out = [];
  let dinsCodi = false, actual = [];
  const tanca = () => { if (actual.length) { out.push(actual.join(' ')); actual = []; } };
  for (const l of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(l)) { dinsCodi = !dinsCodi; tanca(); continue; }
    if (dinsCodi) continue;
    const t = l.trim();
    if (!t || /^(#|\||<!--|---|\*\*Ancoratge|-\s*\[\[)/.test(t)) { tanca(); continue; }
    actual.push(t);
  }
  tanca();
  return out;
}

/** `00_index_identitat`, `01_identitat` i `identitat` parlen del mateix: prefix numèric i `index_/hub_` fora. */
const nomBase = (rel) => normalitza(path.posix.basename(rel, '.md').replace(/^\d+_/, '').replace(/^(index|hub|moc)_/i, '')).replace(/\s+/g, '_');

export function nomsRepetits(docs) {
  const grups = new Map();
  for (const d of docs) {
    if (path.posix.basename(d.rel) === 'SKILL.md') continue;
    const k = nomBase(d.rel);
    if (!k) continue;
    if (!grups.has(k)) grups.set(k, []);
    grups.get(k).push(d.rel);
  }
  return [...grups].filter(([, r]) => r.length > 1).map(([nom, rutes]) => ({ tipus: 'D1-noms-repetits', id: idDe('D1', rutes), rutes, detall: `«${nom}» viu a ${rutes.length} llocs` }));
}

export function titolsSemblants(docs, llindar = 0.6) {
  const firmes = docs.map((d) => ({ rel: d.rel, t: tokens(`${d.titol} ${d.data.description || ''}`) })).filter((f) => f.t.size >= 3);
  const out = [];
  for (let i = 0; i < firmes.length; i += 1) for (let j = i + 1; j < firmes.length; j += 1) {
    const s = jaccard(firmes[i].t, firmes[j].t);
    if (s >= llindar) out.push({ tipus: 'D2-titols-semblants', id: idDe('D2', [firmes[i].rel, firmes[j].rel]), rutes: [firmes[i].rel, firmes[j].rel], detall: `títol i descripció coincidixen al ${Math.round(s * 100)}%` });
  }
  return out;
}

export function paragrafsRepetits(docs, minParaules = 25) {
  const perHash = new Map();
  for (const d of docs) for (const p of d.paragrafs) {
    const n = normalitza(p);
    if (n.split(' ').length < minParaules) continue;
    const h = crypto.createHash('sha256').update(n).digest('hex').slice(0, 16);
    if (!perHash.has(h)) perHash.set(h, { mostra: p.slice(0, 90), rutes: new Set() });
    perHash.get(h).rutes.add(d.rel);
  }
  return [...perHash.values()].filter((v) => v.rutes.size > 1)
    .map((v) => ({ tipus: 'D3-paragrafs-repetits', id: idDe('D3', [...v.rutes]), rutes: [...v.rutes].sort(), detall: `paràgraf repetit: «${v.mostra}…»` }));
}

export function auditaSkills(root, docs) {
  const out = [];
  const skills = docs.filter((d) => d.rel.startsWith(`${CAMINS.skills}/`) && path.posix.basename(d.rel) === 'SKILL.md');
  const catalegRel = CAMINS.indexSkills;
  const cataleg = fs.existsSync(path.join(root, catalegRel)) ? fs.readFileSync(path.join(root, catalegRel), 'utf8') : '';
  const entrades = new Map([...cataleg.matchAll(/^- \[\[([^/\]|]+)\/SKILL\|[^\]]+\]\]:\s*(.+)$/gm)].map((m) => [m[1], m[2].trim()]));
  const carpetes = new Set(skills.map((s) => path.posix.basename(path.posix.dirname(s.rel))));
  for (const s of skills) {
    const nom = path.posix.basename(path.posix.dirname(s.rel));
    const mancances = [];
    if (!s.data.status) mancances.push('sense `status` al frontmatter');
    if (!/\[\[(00_INDEX_SKILLS|00_index)[^\]]*\]\]/.test(s.body)) mancances.push('sense àncora ([[00_INDEX_SKILLS]] o [[00_index]])');
    if (!entrades.has(nom)) mancances.push(`fora del catàleg ${catalegRel}`);
    else if (s.data.description && normalitza(entrades.get(nom)) !== normalitza(String(s.data.description))) mancances.push('la descripció del catàleg no és la del frontmatter');
    if (mancances.length) out.push({ tipus: 'D4-skill', id: idDe('D4', [s.rel]), rutes: [s.rel], detall: mancances.join('; ') });
  }
  for (const nom of entrades.keys()) if (!carpetes.has(nom)) out.push({ tipus: 'D4-skill', id: idDe('D4-fantasma', [nom]), rutes: [`${CAMINS.skills}/${nom}/SKILL.md`], detall: 'al catàleg però sense carpeta al disc' });
  return out;
}

export function senseAncora(docs) {
  return docs.filter((d) => /^_wiki_de_poble\/0[123]_[^/]+\//.test(d.rel) && !/^00_index/.test(path.posix.basename(d.rel)) && !/\[\[00_index[^\]]*\]\]/i.test(d.body))
    .map((d) => ({ tipus: 'D5-sense-ancora', id: idDe('D5', [d.rel]), rutes: [d.rel], detall: 'cap [[00_index…]] al document' }));
}

export function llegeixDecisions(root, ruta = DECISIONS) {
  const abs = path.join(root, ruta);
  if (!fs.existsSync(abs)) return null;
  const d = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (d?.schema !== 'sdp.maduracio.v1' || typeof d.decisions !== 'object') throw new Error(`${ruta} no és sdp.maduracio.v1`);
  return d;
}

/** Classifica cada troballa segons la decisió registrada i la seua edat. */
export function classifica(troballes, decisions, ara = new Date()) {
  const dies = (data) => Math.floor((ara - new Date(`${data}T00:00:00Z`)) / DIA_MS);
  const pendents = [], vigents = [], caducades = [], noExecutades = [];
  for (const t of troballes) {
    const d = decisions?.decisions?.[t.id];
    if (!d) { pendents.push(t); continue; }
    const edat = Number.isFinite(dies(d.data)) ? dies(d.data) : Infinity;
    if (d.decisio === 'resolt') { vigents.push({ ...t, decisio: d }); continue; }
    if (d.decisio === 'mantindre') { (edat > CADUCITAT_MANTINDRE_DIES ? caducades : vigents).push({ ...t, decisio: d }); continue; }
    if (['fusionar', 'renomenar', 'arxivar'].includes(d.decisio)) { (edat > TERMINI_EXECUCIO_DIES ? noExecutades : vigents).push({ ...t, decisio: d }); continue; }
    pendents.push({ ...t, nota: `decisió desconeguda «${d.decisio}»` });
  }
  return { pendents, vigents, caducades, noExecutades };
}

export function avalua(root, { decisions = llegeixDecisions(root), ara = new Date() } = {}) {
  const docs = corpus(root);
  const troballes = [...nomsRepetits(docs), ...titolsSemblants(docs), ...paragrafsRepetits(docs), ...auditaSkills(root, docs), ...senseAncora(docs)];
  return { documents: docs.length, troballes, ...classifica(troballes, decisions, ara), senseFitxerDeDecisions: !decisions };
}

function main() {
  const argv = process.argv.slice(2);
  const root = arrelSegura();
  if (argv.includes('--inicia')) {
    const abs = path.join(root, DECISIONS);
    if (fs.existsSync(abs)) throw new Error(`${DECISIONS} ja existix`);
    fs.writeFileSync(abs, `${JSON.stringify({ schema: 'sdp.maduracio.v1', decisions: {} }, null, 2)}\n`, { flag: 'wx' });
    console.log(`✅ [Sinapsis] ${DECISIONS} creat.`);
    return;
  }
  const r = avalua(root);
  const bloquegen = r.pendents.length + r.caducades.length + r.noExecutades.length;
  if (argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exitCode = bloquegen ? 1 : 0; return; }
  console.log(`🧠 [Sinapsis] ${r.documents} documents · ${r.troballes.length} troballes · ${r.vigents.length} amb decisió vigent · ${r.pendents.length} pendents · ${r.caducades.length} caducades · ${r.noExecutades.length} decidides i no executades`);
  if (r.senseFitxerDeDecisions) console.log(`   ℹ️  Sense ${DECISIONS}: crea'l amb --inicia. Fins aleshores tota troballa és pendent.`);
  const pinta = (llista, cap) => { if (!llista.length) return; console.log(`\n   ${cap}`); for (const t of llista) console.log(`   · ${t.id}  ${t.tipus}  ${t.rutes.join(' ↔ ')}\n       ${t.detall}${t.decisio ? ` · decisió: ${t.decisio.decisio} (${t.decisio.per}, ${t.decisio.data})` : ''}`); };
  pinta(r.pendents, 'PENDENTS DE DECISIÓ');
  pinta(r.caducades, `DECISIONS «mantindre» CADUCADES (> ${CADUCITAT_MANTINDRE_DIES} dies): torna a decidir`);
  pinta(r.noExecutades, `DECIDIDES I NO EXECUTADES (> ${TERMINI_EXECUCIO_DIES} dies): la troballa continua`);
  if (bloquegen) {
    console.log(`\n   Per a decidir, afig a ${DECISIONS}:`);
    const t = r.pendents[0] || r.caducades[0] || r.noExecutades[0];
    console.log(`   "${t.id}": { "decisio": "fusionar|renomenar|arxivar|mantindre|resolt", "per": "Mestre", "data": "${new Date().toISOString().slice(0, 10)}", "motiu": "…" }`);
  }
  process.exitCode = bloquegen ? 1 : 0;
}

if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(`[Sinapsis] ${e.message}`); process.exitCode = 2; }
}
