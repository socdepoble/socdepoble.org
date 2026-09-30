/**
 * governanca-260930-t1 — prova en memòria del pegat T1 del paquet de governança
 * (_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude/pegats/t1-skills.mjs).
 *
 * Aplica cada operació contra el contingut ACTUAL del repositori sense
 * escriure-hi res i comprova el resultat amb les mateixes funcions que el
 * validaran després: inventari/projeccions de cataleg_skills.mjs,
 * construeixIndex de build_skills_index.mjs, parseDocument/validateSchema de
 * tooling/documental/core.mjs i parseFrontmatter de la Wiki.
 *
 * La Porta Frontmatter és un script amb efectes de nivell superior i no es pot
 * importar. Ací se'n replica, llegint el codi, la part que decidix: el pany,
 * el deute i l'anàlisi per fitxer (tractor-frontmatter.mjs:139-181, 216-444,
 * 470-484). Si el tractor canvia, esta rèplica s'ha de tornar a llegir.
 *
 * Només escriu a os.tmpdir(). Si el laboratori s'arxiva, totes les proves fan
 * skip en lloc de quedar roges.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude');
const PEGAT = path.join(LAB, 'pegats/t1-skills.mjs');
const HI_HA_LAB = fs.existsSync(PEGAT);

const ESQUEMA = 'tooling/wiki/schema.json';
const PANY = 'tooling/wiki/schema-cutover.lock.json';
const DEUTE = '.agents/deute/.frontmatter-deute.json';
const INDEX = '.agents/skills/00_INDEX_SKILLS.md';
const INDEX_ROUTER = '.agents/skills_index.json';
const MANIFEST = '.agents/manifest.yaml';

const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const disc = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');

/* El pegat s'aplica una sola vegada per fitxer de proves. Si l'executor ja
 * l'ha aplicat sencer, cada operació ho diu i la prova fa skip fins que
 * s'arxive el laboratori; un estat parcial continua en roig. */
let estat = null;
async function carrega(t) {
  if (!HI_HA_LAB) { t.skip('laboratori 260930_0040_governanca_claude arxivat'); return null; }
  if (!estat) {
    const pegat = await import(pathToFileURL(PEGAT).href);
    const actuals = new Map();
    const nous = new Map();
    try {
      for (const op of pegat.operacions) {
        const actual = disc(op.ruta);
        actuals.set(op.ruta, actual);
        nous.set(op.ruta, op.aplica(actual, nous));
      }
      estat = { pegat, actuals, nous };
    } catch (error) {
      const alDisc = new Map(pegat.operacions.map((op) => [op.ruta, disc(op.ruta)]));
      const aplicada = (op) => { try { op.aplica(alDisc.get(op.ruta), alDisc); return false; } catch (e) { return /el pegat ja s'ha aplicat/.test(e.message); } };
      if (!pegat.operacions.every(aplicada)) throw error;
      estat = { aplicat: true };
    }
  }
  if (estat.aplicat) { t.skip('paquet T1 ja aplicat al disc; arxiveu el laboratori'); return null; }
  return estat;
}

const skillsDisc = () => fs.readdirSync(path.join(REPO, '.agents/skills'), { withFileTypes: true })
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();
const final = (nous, rel) => nous.get(rel) ?? disc(rel);

/* ──────────────────── Forma del pegat ──────────────────── */

test('pegat: operacions ben formades, sense imports relatius ni rutes duplicades', async (t) => {
  const s = await carrega(t); if (!s) return;
  const font = fs.readFileSync(PEGAT, 'utf8');
  assert.doesNotMatch(font, /\bfrom\s+['"]\.|import\(\s*['"]\./, 'el laboratori no pot importar mòduls relatius del repo');
  const vistes = new Set();
  for (const op of s.pegat.operacions) {
    assert.equal(typeof op.ruta, 'string');
    assert.ok(!path.isAbsolute(op.ruta) && !op.ruta.split('/').includes('..') && !/\s/.test(op.ruta), op.ruta);
    assert.ok(typeof op.descripcio === 'string' && op.descripcio.trim().length > 10, op.ruta);
    assert.equal(['crea', 'substituix', 'aplica'].filter((k) => op[k] !== undefined).length, 1, op.ruta);
    assert.equal(typeof op.aplica, 'function', op.ruta);
    assert.ok(!vistes.has(op.ruta), `ruta duplicada: ${op.ruta}`);
    for (const d of op.depen ?? []) assert.ok(vistes.has(d), `${op.ruta} depén de ${d}, que ha d'anar abans`);
    vistes.add(op.ruta);
    assert.ok(fs.existsSync(path.join(REPO, op.ruta)), `el fitxer ha d'existir: ${op.ruta}`);
  }
  assert.ok(!vistes.has(MANIFEST), 'manifest.yaml ja és la projecció; no ha de tindre operació');
});

test('pegat: determinista, idempotent-segur i fail-closed sense el mapa de continguts nous', async (t) => {
  const s = await carrega(t); if (!s) return;
  for (const op of s.pegat.operacions) {
    const actual = s.actuals.get(op.ruta);
    assert.notEqual(s.nous.get(op.ruta), actual, `${op.ruta}: l'operació no canvia res`);
    assert.equal(op.aplica(actual, s.nous), s.nous.get(op.ruta), `${op.ruta}: no és determinista`);
    // Mateix missatge que usa carrega() per a reconéixer un paquet ja aplicat.
    assert.throws(() => op.aplica(s.nous.get(op.ruta), s.nous), /el pegat ja s'ha aplicat/, `${op.ruta}: aplicat dues vegades no ha fallat`);
    if (op.depen?.length) assert.throws(() => op.aplica(actual, new Map()), /falta el contingut nou/, op.ruta);
  }
});

test('pegat: un ancoratge absent o repetit llança Error', async (t) => {
  const s = await carrega(t); if (!s) return;
  const op = (ruta) => s.pegat.operacions.find((o) => o.ruta === ruta);
  const pkg = s.actuals.get('package.json');
  const linia = pkg.split('\n').find((l) => l.startsWith('    "test:node":'));
  assert.throws(() => op('package.json').aplica(pkg.replace(linia, ''), s.nous), /exactament una vegada/);
  assert.throws(() => op('package.json').aplica(pkg.replace(linia, `${linia}\n${linia}`), s.nous), /exactament una vegada/);
  assert.throws(() => op(ESQUEMA).aplica(`${s.actuals.get(ESQUEMA)} `, s.nous), /una altra mà/);
  const pany = s.actuals.get(PANY);
  assert.throws(() => op(PANY).aplica(pany.replace(s.pegat.SHA_ESQUEMA_PREVI, 'a'.repeat(64)), s.nous), /ancoratge no hi és/);
  const neteja = '.agents/skills/core-neteja-brossa/SKILL.md';
  assert.throws(() => op(neteja).aplica(s.actuals.get(neteja).replace('solta', 'soltes'), s.nous), /no és el previst/);
});

/* ──────────────────── Esquema, pany i deute ──────────────────── */

test('esquema: contracte.llig declarada i admesa pels tres validadors; $id intacte', async (t) => {
  const s = await carrega(t); if (!s) return;
  const { checkSchema } = await import('../tooling/documental/core.mjs');
  const vell = JSON.parse(s.actuals.get(ESQUEMA));
  const nou = JSON.parse(s.nous.get(ESQUEMA));
  assert.equal(nou.$id, vell.$id);
  assert.deepEqual({ ...nou, properties: undefined }, { ...vell, properties: undefined });
  const { 'contracte.llig': llig, ...resta } = nou.properties;
  assert.deepEqual(resta, vell.properties, 'cap altra propietat canvia');
  assert.deepEqual(llig, { type: 'array', items: { type: 'string', minLength: 1, pattern: '^(?!.*90_arxiu_historic)\\S+$' }, uniqueItems: true });
  assert.equal(Object.keys(nou.properties).at(-1), 'contracte.llig');
  assert.ok(!s.nous.get(ESQUEMA).endsWith('\n'), 'es conserva el final sense salt de línia');
  checkSchema(nou); // tooling/documental/core.mjs
  // tractor-frontmatter.mjs:164-181: construccions que sap fer complir.
  const ARREL_OK = new Set(['$schema', '$id', 'title', 'description', '$comment', 'type', 'additionalProperties', 'required', 'properties']);
  const PROP_OK = new Set(['type', 'enum', 'const', 'pattern', 'minLength', 'maxLength', 'minItems', 'maxItems', 'uniqueItems', 'items', 'description', '$comment']);
  const ITEM_OK = new Set(['type', 'enum', 'const', 'pattern', 'minLength', 'maxLength']);
  for (const k of Object.keys(nou)) assert.ok(ARREL_OK.has(k), k);
  for (const [nom, def] of Object.entries(nou.properties)) {
    for (const k of Object.keys(def)) assert.ok(PROP_OK.has(k), `${nom}.${k}`);
    for (const k of Object.keys(def.items ?? {})) assert.ok(ITEM_OK.has(k), `${nom}.items.${k}`);
  }
  const patro = new RegExp(llig.items.pattern);
  assert.ok(patro.test('.agents/skills/sdp-pedra-seca/SKILL.md'));
  assert.ok(!patro.test('_wiki_de_poble/90_arxiu_historic/x.md'));
  assert.ok(!patro.test('una ruta amb espais.md'));
});

test('pany i deute: coherents abans i després, amb el SHA nou i el mateix sostre', async (t) => {
  const s = await carrega(t); if (!s) return;
  const shaVell = sha256(s.actuals.get(ESQUEMA));
  const shaNou = sha256(s.nous.get(ESQUEMA));
  assert.equal(shaVell, s.pegat.SHA_ESQUEMA_PREVI, 'l\'esquema del disc és el que segellen hui pany i deute');
  assert.notEqual(shaNou, shaVell);
  const panyVell = JSON.parse(s.actuals.get(PANY));
  const panyNou = JSON.parse(s.nous.get(PANY));
  const deuteVell = JSON.parse(s.actuals.get(DEUTE));
  const deuteNou = JSON.parse(s.nous.get(DEUTE));
  assert.equal(panyVell.schemaSha256, shaVell);
  assert.equal(deuteVell.esquemaSha256, shaVell);
  // tractor-frontmatter.mjs:149-157
  assert.equal(panyNou.schemaSha256, shaNou);
  assert.deepEqual({ ...panyNou, schemaSha256: 0 }, { ...panyVell, schemaSha256: 0 });
  // tractor-frontmatter.mjs:459 i 475: mateix $id, mateix SHA, mateix mètode.
  assert.equal(deuteNou.esquema, JSON.parse(s.nous.get(ESQUEMA)).$id);
  assert.equal(deuteNou.esquemaSha256, shaNou);
  assert.equal(deuteNou.metode, 'F1-per-clau/v2');
  assert.deepEqual(deuteNou.max, deuteVell.max, 'el sostre del deute no canvia');
  assert.deepEqual({ ...deuteNou, esquemaSha256: 0 }, { ...deuteVell, esquemaSha256: 0 });
  // Format que escriuen --segella-esquema i --baseline.
  assert.equal(s.nous.get(PANY), `${JSON.stringify(panyNou, null, 2)}\n`);
  assert.equal(s.nous.get(DEUTE), `${JSON.stringify(deuteNou, null, 2)}\n`);
});

/* ──────────────────── Frontmatter de les skills ──────────────────── */

test('skills: totes vàlides amb l\'esquema NOU (js-yaml + validateSchema) i llegibles per parseYamlLite', async (t) => {
  const s = await carrega(t); if (!s) return;
  const { parseDocument, validateSchema } = await import('../tooling/documental/core.mjs');
  const { parseFrontmatter } = await import('../tooling/wiki/lib/frontmatter.mjs');
  const esquema = JSON.parse(s.nous.get(ESQUEMA));
  const esquemaVell = JSON.parse(s.actuals.get(ESQUEMA));
  const rutes = [...skillsDisc().map((id) => `.agents/skills/${id}/SKILL.md`), INDEX];
  assert.ok(rutes.length >= 25);
  for (const rel of rutes) {
    const text = final(s.nous, rel);
    const { data } = parseDocument(text);
    assert.deepEqual(validateSchema(data, esquema), [], rel);
    const lite = parseFrontmatter(text);
    assert.ok(lite.hasFrontmatter, rel);
    assert.deepEqual(lite.errors, [], rel);
  }
  for (const [id, lectures] of Object.entries(s.pegat.LECTURES)) {
    const rel = `.agents/skills/${id}/SKILL.md`;
    const { data } = parseDocument(s.nous.get(rel));
    assert.deepEqual(data['contracte.llig'], [...lectures], rel);
    assert.deepEqual(parseFrontmatter(s.nous.get(rel)).data['contracte.llig'], [...lectures], `${rel} (parseYamlLite)`);
    assert.ok(validateSchema(data, esquemaVell).some((e) => e.includes('contracte.llig')), 'amb l\'esquema vell seria invàlid');
    for (const ruta of lectures) {
      assert.ok(fs.existsSync(path.join(REPO, ruta)), `${rel}: la lectura ha d'existir: ${ruta}`);
      assert.doesNotMatch(ruta, /90_arxiu_historic/);
    }
  }
});

test('core-neteja-brossa: frontmatter complet, cos intacte i Vincles al final', async (t) => {
  const s = await carrega(t); if (!s) return;
  const rel = '.agents/skills/core-neteja-brossa/SKILL.md';
  const { parseDocument } = await import('../tooling/documental/core.mjs');
  const vell = s.actuals.get(rel);
  const nou = s.nous.get(rel);
  const { data } = parseDocument(nou);
  assert.deepEqual(data, {
    type: 'skill', status: 'actiu', description: parseDocument(vell).data.description,
    name: 'core-neteja-brossa', triggers_on: [...s.pegat.TRIGGERS_NETEJA],
  });
  const cosVell = parseDocument(vell).body;
  const cosNou = parseDocument(nou).body;
  assert.ok(cosNou.startsWith(cosVell.replace(/\n+$/, '')), 'el cos original es conserva byte a byte');
  assert.ok(cosNou.endsWith('\n## Vincles\n- [[00_INDEX_SKILLS]]\n'));
  for (const d of s.pegat.TRIGGERS_NETEJA) assert.ok(d.length >= 4, `disparador massa ample: ${d}`);
  const tel = '.agents/skills/core-telemetria-huma/SKILL.md';
  assert.equal(s.nous.get(tel), `${s.actuals.get(tel).replace(/\n+$/, '')}\n\n## Vincles\n- [[00_INDEX_SKILLS]]\n`);
});

/* ──────────────────── Projeccions ──────────────────── */

function arrelTemporal(t, nous) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-governanca-t1-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  for (const id of skillsDisc()) {
    const rel = `.agents/skills/${id}/SKILL.md`;
    fs.mkdirSync(path.join(arrel, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(arrel, rel), final(nous, rel));
  }
  for (const f of ['PROFILE.md', 'AGENTS.md', 'BASELINE.md', 'consell.json']) {
    fs.copyFileSync(path.join(REPO, '.agents', f), path.join(arrel, '.agents', f));
  }
  return arrel;
}

test('projeccions: 00_INDEX_SKILLS, manifest i skills_index idèntics als generadors sobre el disc resultant', async (t) => {
  const s = await carrega(t); if (!s) return;
  const { inventari, projeccions } = await import('../tooling/brain/cataleg_skills.mjs');
  const { construeixIndex } = await import('../tooling/brain/build_skills_index.mjs');
  const arrel = arrelTemporal(t, s.nous);
  const skills = inventari(arrel);
  assert.deepEqual(skills.map((k) => k.id), skillsDisc(), 'l\'inventari estricte accepta totes les skills');
  const p = projeccions(skills);
  assert.equal(s.nous.get(INDEX), p.get(INDEX));
  assert.equal(disc(MANIFEST), p.get(MANIFEST), 'manifest.yaml ja és la projecció i no necessita operació');
  assert.equal(s.nous.get(INDEX_ROUTER), `${JSON.stringify(construeixIndex(arrel), null, 2)}\n`);
  // I la projecció pròpia del pegat coincidix amb la de cataleg_skills.
  assert.equal(s.pegat.projeccioIndex(skills.map(({ id, description }) => ({ id, description }))), p.get(INDEX));
});

/* ──────────────────── Porta Frontmatter (rèplica) ──────────────────── */

const aRegex = (p) => new RegExp('^' + p
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*\//g, '\u0001')
  .replace(/\*\*/g, '\u0000')
  .replace(/\*/g, '[^/]*')
  .replace(/\u0000/g, '.*')
  .replace(/\u0001/g, '(?:.*/)?') + '$');

function escalar(s) {
  const t = s.trim();
  if (t === '') return null;
  const q = /^"([\s\S]*)"$/.exec(t) ?? /^'([\s\S]*)'$/.exec(t);
  if (q) return q[1];
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '~') return null;
  if (/^-?\d+$/.test(t)) return Number(t);
  return t;
}
function flux(s) {
  const t = s.trim();
  if (!/^\[[\s\S]*\]$/.test(t)) return { mal: true, valor: t };
  const dins = t.slice(1, -1);
  if (!dins.trim()) return { mal: false, valor: [] };
  const out = []; let buf = ''; let q = null;
  for (const c of dins) {
    if (q) { if (c === q) q = null; else buf += c; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === ',') { out.push(escalar(buf)); buf = ''; continue; }
    buf += c;
  }
  out.push(escalar(buf));
  return { mal: false, valor: out };
}
function parteix(txt) {
  const t = (txt.charCodeAt(0) === 0xFEFF ? txt.slice(1) : txt).replace(/\r\n/g, '\n'); // BOM
  if (!t.startsWith('---\n')) return null;
  const fi = t.indexOf('\n---', 3);
  const fi2 = t.indexOf('\n...', 3);
  const tall = fi === -1 ? fi2 : (fi2 === -1 ? fi : Math.min(fi, fi2));
  if (tall === -1) return null;
  return t.slice(4, tall + 1);
}
function llig(cos) {
  const linies = cos.split('\n');
  const valors = new Map(); const claus = []; const avisos = [];
  let i = 0;
  while (i < linies.length) {
    const l = linies[i];
    if (!l.trim() || /^\s*#/.test(l)) { i++; continue; }
    const m = /^([A-Za-z_][\w.$-]*)\s*:\s*(.*)$/.exec(l);
    if (!m) { avisos.push({ codi: 'F7', detall: `línia ${i + 1} il·legible` }); i++; continue; }
    const clau = m[1]; const resta = m[2].trim();
    let valor;
    if (resta === '') {
      const items = []; let j = i + 1; let nidat = false;
      while (j < linies.length) {
        const n = linies[j];
        if (!n.trim()) { j++; continue; }
        const li = /^\s+-\s*(.*)$/.exec(n);
        if (li) { items.push(escalar(li[1])); j++; continue; }
        if (/^\s+\S/.test(n)) { nidat = true; j++; continue; }
        break;
      }
      if (nidat) { avisos.push({ codi: 'F7', detall: `«${clau}» conté un mapa nidat` }); valor = undefined; } else valor = items.length ? items : null;
      i = j;
    } else if (resta.startsWith('[')) {
      const f = flux(resta);
      if (f.mal) avisos.push({ codi: 'F7', detall: `«${clau}» llista en línia mal tancada` });
      valor = f.valor; i++;
    } else { valor = escalar(resta); i++; }
    claus.push(clau);
    if (valors.has(clau)) avisos.push({ codi: 'F6', detall: clau }); else valors.set(clau, valor);
  }
  return { valors, claus, avisos };
}

let corpusCache = null;
async function corpus() {
  if (corpusCache) return corpusCache;
  const { isDocumentArchive } = await import('../tooling/lib/document-corpus.mjs');
  const abast = JSON.parse(disc('tooling/wiki/frontmatter-abast.json'));
  assert.deepEqual(abast.arrels, ['.']);
  assert.deepEqual(abast.immutables, []);
  assert.deepEqual(abast.perfils, []);
  const EXCLOU = abast.exclou.map((p) => aRegex(p.includes('/') ? p : `**/${p}`));
  const acc = [];
  (function recorre(rel) {
    let entrades;
    try { entrades = fs.readdirSync(rel ? path.join(REPO, rel) : REPO, { withFileTypes: true }); } catch { return; }
    for (const e of entrades) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (isDocumentArchive(r) || EXCLOU.some((re) => re.test(r))) continue;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) recorre(r);
      else if (e.name.toLowerCase().endsWith('.md')) acc.push(r);
    }
  })('');
  corpusCache = [...new Set(acc)].sort();
  return corpusCache;
}

/** Rèplica de tractor-frontmatter.mjs:59-99 i 327-444 sobre un corpus en memòria. */
async function analitza(nodes, llegix, S) {
  const { parseFrontmatter } = await import('../tooling/wiki/lib/frontmatter.mjs');
  const { liveMarkdown, extractLinks, buildResolver, resolveLink } = await import('../tooling/wiki/core/parse.mjs');
  const PROPS = S.properties ?? {};
  const REQ = S.required ?? [];
  const TANCAT = S.additionalProperties === false;
  const VOC = PROPS.tags?.items?.enum ?? null;
  const docs = nodes.map((n) => ({ relPath: n, content: llegix(n) }));
  const resolver = buildResolver(docs);
  const validaVincles = (doc) => {
    const p = parseFrontmatter(doc.content);
    if (p.malformed || p.errors.length) return ['YAML no llegible'];
    const seccions = []; let actual = null;
    for (const line of liveMarkdown(p.body).split('\n')) {
      const h = /^ {0,3}(#{1,6})[\t ]+(.+?)(?:[\t ]+#+)?[\t ]*$/.exec(line);
      if (h && h[1].length <= 2) { actual = h[1].length === 2 && h[2] === 'Vincles' ? [] : null; if (actual) seccions.push(actual); } else if (actual) actual.push(line);
    }
    if (seccions.length !== 1) return ['Cal exactament una secció real ## Vincles'];
    const errors = []; let valids = 0;
    for (const line of seccions[0]) {
      if (!line.trim()) continue;
      const item = /^ {0,3}[-*][\t ]+(\[\[[^[\]\n]+\]\])[\t ]*$/.exec(line);
      if (!item || item[1].includes('\\')) { errors.push('Vincles només admet una llista de wikilinks sencers'); continue; }
      const links = extractLinks(item[1]);
      if (links.length !== 1 || /[#^]/.test(links[0].target)) { errors.push('Cal enllaçar una nota sencera'); continue; }
      const r = resolveLink(links[0], doc, resolver);
      if (r.status === 'resolved' && r.doc.relPath !== doc.relPath) valids++;
      else errors.push(`${links[0].target}: ${r.status === 'resolved' ? 'autoreferència' : r.status}`);
    }
    if (!valids) errors.push('Falta una nota interna única i diferent');
    return errors;
  };
  const f = { F1: [], F2: [], F3: [], F4: [], F5: [], F6: [], F7: [], F8: [], F9: [] };
  const usPerClau = new Map(); const valsPerClau = new Map();
  const MARCADOR = /\{[^}\n]+\}/;
  const esMarcador = (v) => typeof v === 'string' && MARCADOR.test(v);
  const teMarcador = (v) => (Array.isArray(v) ? v.some(esMarcador) : esMarcador(v));
  const comprovaEscalar = (n, clau, v, def) => {
    if (def.type === 'string' && typeof v !== 'string') { f.F7.push({ n, clau }); return; }
    if (def.type === 'boolean' && typeof v !== 'boolean') { f.F7.push({ n, clau }); return; }
    if (def.type === 'integer' && !Number.isInteger(v)) { f.F7.push({ n, clau }); return; }
    if (typeof v === 'string') {
      if (def.enum && !def.enum.includes(v)) f.F3.push({ n, clau, valor: v });
      if (def.const !== undefined && v !== def.const) f.F3.push({ n, clau, valor: v });
      if (def.minLength != null && v.length < def.minLength) f.F7.push({ n, clau });
      if (def.maxLength != null && v.length > def.maxLength) f.F7.push({ n, clau });
      if (def.pattern && !new RegExp(def.pattern).test(v)) f.F7.push({ n, clau, detall: 'patró' });
    }
  };
  for (const doc of docs) {
    const n = doc.relPath;
    for (const e of validaVincles(doc)) f.F9.push({ n, clau: 'Vincles', detall: e });
    const cos = parteix(doc.content);
    if (cos === null) { for (const k of REQ) f.F1.push({ n, clau: k }); continue; }
    const { valors, claus, avisos } = llig(cos);
    for (const a of avisos) f[a.codi].push({ n, clau: a.detall });
    const plantilla = valors.get('tipus') === 'plantilla' || valors.get('type') === 'plantilla';
    for (const k of REQ) if (!valors.has(k)) f.F1.push({ n, clau: k });
    const hasType = valors.has('type'); const hasTipus = valors.has('tipus');
    if (!hasType && !hasTipus) f.F1.push({ n, clau: 'type|tipus' });
    if (hasType && hasTipus && valors.get('type') !== valors.get('tipus')) f.F1.push({ n, clau: 'type_contra_tipus' });
    const hasStatus = valors.has('status'); const hasEstat = valors.has('estat');
    if (!hasStatus && !hasEstat) f.F1.push({ n, clau: 'status|estat' });
    if (hasStatus && hasEstat && valors.get('status') !== valors.get('estat')) f.F1.push({ n, clau: 'status_contra_estat' });
    for (const k of new Set(claus)) {
      usPerClau.set(k, (usPerClau.get(k) ?? 0) + 1);
      const v = valors.get(k);
      if (!valsPerClau.has(k)) valsPerClau.set(k, new Set());
      for (const x of Array.isArray(v) ? v : [v]) if (x != null) valsPerClau.get(k).add(String(x));
      const def = PROPS[k];
      if (!def) { if (TANCAT) f.F2.push({ n, clau: k }); continue; }
      if (v === undefined) continue;
      if (teMarcador(v)) {
        if (k === 'tipus' || k === 'estat' || k === 'type' || k === 'status' || !plantilla) f.F8.push({ n, clau: k });
        if (k === 'tipus' || k === 'estat' || k === 'type' || k === 'status') continue;
        if (plantilla) continue;
      }
      if (def.type === 'array') {
        if (!Array.isArray(v)) { f.F7.push({ n, clau: k, detall: 'no és una llista' }); continue; }
        if (def.minItems != null && v.length < def.minItems) f.F7.push({ n, clau: k });
        if (def.maxItems != null && v.length > def.maxItems) f.F7.push({ n, clau: k });
        if (def.uniqueItems && new Set(v.map(String)).size !== v.length) f.F7.push({ n, clau: k });
        for (const it of v) {
          if (def.items) comprovaEscalar(n, `${k}[]`, it, def.items);
          if (k === 'tags' && VOC && typeof it === 'string' && !VOC.includes(it)) f.F4.push({ n, tag: it });
        }
        continue;
      }
      comprovaEscalar(n, k, v, def);
    }
  }
  for (const [k, vals] of valsPerClau) {
    if (REQ.includes(k) || k === 'visibility') continue;
    if (vals.size === 1 && (usPerClau.get(k) ?? 0) >= 2) f.F5.push({ clau: k, usos: usPerClau.get(k), valor: [...vals][0] });
  }
  return f;
}

test('porta frontmatter (rèplica): zero deute als .md tocats i cap llei no puja', async (t) => {
  const s = await carrega(t); if (!s) return;
  const nodes = await corpus();
  const tocats = s.pegat.operacions.map((o) => o.ruta).filter((r) => r.endsWith('.md'));
  for (const r of tocats) assert.ok(nodes.includes(r), `la porta recorre ${r}`);
  const abans = await analitza(nodes, disc, JSON.parse(s.actuals.get(ESQUEMA)));
  const despres = await analitza(nodes, (n) => final(s.nous, n), JSON.parse(s.nous.get(ESQUEMA)));
  const max = JSON.parse(s.nous.get(DEUTE)).max;
  const compte = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.length]));
  t.diagnostic(`${nodes.length} documents · abans ${JSON.stringify(compte(abans))} · després ${JSON.stringify(compte(despres))} · sostre ${JSON.stringify(max)}`);
  // Deute heretat per damunt del sostre: no el crea ni el tapa este paquet, però la porta ja cau per ell.
  for (const k of Object.keys(abans).filter((k) => abans[k].length > (max[k] ?? 0))) {
    t.diagnostic(`${k} ja supera el sostre abans del paquet (${abans[k].length} > ${max[k] ?? 0}): ${abans[k].slice(0, 4).map((it) => `${it.n ?? it.clau} ${it.valor ?? it.tag ?? ''}`.trim()).join(' | ')}`);
  }
  for (const r of tocats) {
    const previ = Object.values(abans).flat().filter((it) => it.n === r).map((it) => `${it.clau}${it.detall ? ` (${it.detall})` : ''}`);
    if (previ.length) t.diagnostic(`deute previ a ${r}: ${previ.join('; ')}`);
    // tractor-frontmatter.mjs:521-533: un fitxer modificat amb deute tomba la porta.
    assert.deepEqual(Object.values(despres).flat().filter((it) => it.n === r), [], `${r} queda amb deute actiu`);
  }
  for (const k of Object.keys(abans)) assert.ok(despres[k].length <= abans[k].length, `${k} puja: ${abans[k].length} → ${despres[k].length}`);
  assert.ok(!despres.F5.some((it) => it.clau === 'contracte.llig'), 'contracte.llig no és cerimònia (F5)');
});

/* ──────────────────── package.json ──────────────────── */

test('package.json: només canvia test:node, amb les dues bateries d\'enxufe al final', async (t) => {
  const s = await carrega(t); if (!s) return;
  const vell = JSON.parse(s.actuals.get('package.json'));
  const nou = JSON.parse(s.nous.get('package.json'));
  assert.equal(nou.scripts['test:node'], `${vell.scripts['test:node']} ${s.pegat.TESTS_ENXUFE.join(' ')}`);
  assert.deepEqual({ ...nou, scripts: { ...nou.scripts, 'test:node': 0 } }, { ...vell, scripts: { ...vell.scripts, 'test:node': 0 } });
  assert.equal(s.nous.get('package.json').split('\n').length, s.actuals.get('package.json').split('\n').length);
  for (const f of nou.scripts['test:node'].replace(/^node --test /, '').split(' ')) {
    assert.ok(fs.existsSync(path.join(REPO, f)), `la bateria existix: ${f}`);
  }
});

test('ESLint: zero missatges al pegat i a esta prova', async (t) => {
  if (!HI_HA_LAB) { t.skip('laboratori 260930_0040_governanca_claude arxivat'); return; }
  const { ESLint } = await import('eslint');
  const fitxers = [PEGAT, fileURLToPath(import.meta.url)];
  const resultats = await new ESLint({ cwd: REPO }).lintFiles(fitxers);
  assert.equal(resultats.length, fitxers.length, 'ESLint no ha linat tots els fitxers');
  assert.deepEqual(resultats.flatMap((r) => r.messages.map((m) => `${path.relative(REPO, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`)), []);
  // Cap caràcter de control, invisible ni bidi (mateixa llista que enxufe-plugin.test.mjs).
  const car = (cp) => String.fromCodePoint(cp);
  const vetats = new RegExp(`[${[[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x061C, 0x061C], [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]]
    .map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
  assert.deepEqual(fitxers.filter((f) => vetats.test(fs.readFileSync(f, 'utf8'))), []);
});

test('bateries d\'enxufe: passen soles abans d\'endollar-les a test:node', async (t) => {
  const s = await carrega(t); if (!s) return;
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // si no, el fill parla el protocol del corredor pare
  const r = spawnSync(process.execPath, ['--test', ...s.pegat.TESTS_ENXUFE], { cwd: REPO, env, encoding: 'utf8', timeout: 240000 });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /# fail 0|ℹ fail 0/);
});
