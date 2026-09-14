#!/usr/bin/env node
/**
 * tractor-poda-css.mjs — L'eina de poda: classes CSS orfes REALS.
 *
 * PER QUÈ UNA EINA NOVA
 *   tractor-classes.mjs dona 43 «aparentment mortes» i ix amb 0 igualment.
 *   Entre elles hi ha xat-header-dropdown--left/--right, que viuen dins d'un
 *   literal d'una plantilla de className: busca per text, no per estructura,
 *   i els prefixos dinàmics són una llista escrita a mà que es fa vella.
 *
 * COM DECIDIX
 *   CSS  · Sense parser extern (el paquet `css` no entén @layer). Comentaris,
 *          cadenes i url() fora; cada prelude abans de `{` és una regla; les
 *          at-regles són transparents. Per selector distingix classes
 *          EXIGIDES (nivell 0), CITADES (dins :not/:is/:where/:has…) i
 *          EXTERNES (:host(), :host-context(), ::slotted(): les posa l'amfitrió).
 *   CODI · AST de @babel/parser sobre src/**\/*.{js,jsx,mjs}, tests fora.
 *          Context FORT: className/class, classList.*, querySelector*,
 *          closest, matches, setAttribute('class'), cx/clsx i qualsevol
 *          variable, propietat o paràmetre amb «class» al nom.
 *          Context DÈBIL: la resta del text (i18n, contingut, URLs…).
 *   DINÀMIQUES · Una plantilla o una concatenació amb forat no dona un nom:
 *          dona un PATRÓ. `btn-${v}` → prefix «btn-»; `${b}--avis` → sufix;
 *          `${a}-card-${b}` → infix. Casar amb un patró salva la classe.
 *   CRUES · index.html, public/**\/*.html, src/**\/*.json, supabase/**\/*.sql
 *          i wordpress-plugin/** compten per paraules; class="…" compta fort.
 *
 * VEREDICTES   viva · patró · dèbil · externa · ORFE
 *   Només ORFE vol dir «cap rastre enlloc, ni com a paraula solta».
 *   Precisió abans que cobertura: si dubta, la dona per viva. El que ix com a
 *   ORFE o REGLA MORTA es pot esborrar; patró i dèbil són llista de revisió.
 *
 * ÚS   node tooling/gates/tractor-poda-css.mjs [--css=ruta]… [--viu=regex]…
 *                                             [--json=ruta] [--ci] [--max=N]
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { parse } from '@babel/parser';

const ARREL = process.cwd();
const ARGS = process.argv.slice(2);
const valors = (nom) => ARGS.filter((a) => a.startsWith(`--${nom}=`)).map((a) => a.slice(nom.length + 3));
const FULLS = valors('css').length ? valors('css') : ['src/css/index.css'];
const MAX = Number(valors('max')[0] ?? 0);

/* DOM que pinten tercers en temps d'execució: mai apareix al nostre codi. */
const VIVES_EXTERNES = [
  /^ProseMirror/, /^tiptap/, /^is-(editor-)?empty$/, /^lucide(-|$)/,
  ...valors('viu').map((r) => new RegExp(r)),
];

const EXCLOSOS = new Set(['node_modules', 'dist', 'build', 'vendor', 'coverage', '.git']);
const CAR = /[\p{L}\p{N}_-]/u;
const PARAULA = /[\p{L}\p{N}_-]+/gu;
const HTML_CLASS = /\bclass(?:Name)?\s*=\s*\\?["']([^"'\\]*)/g;
const JSON_CLASS = /"[\w-]*[cC]lass[\w-]*"\s*:\s*"([^"]*)"/g;

function recorre(dir, filtre, eixida = []) {
  const abs = resolve(ARREL, dir);
  if (!existsSync(abs)) return eixida;
  for (const nom of readdirSync(abs)) {
    if (EXCLOSOS.has(nom)) continue;
    const p = join(abs, nom);
    if (statSync(p).isDirectory()) recorre(relative(ARREL, p), filtre, eixida);
    else if (filtre(p)) eixida.push(relative(ARREL, p));
  }
  return eixida;
}

/* ═══════════════════════════════ 1 · CSS ═══════════════════════════════ */

/** Comentaris, cadenes i url() a espais. Els salts de línia es queden. */
function neteja(css) {
  let o = '';
  for (let i = 0; i < css.length;) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const f = css.indexOf('*/', i + 2);
      const fi = f < 0 ? css.length : f + 2;
      o += css.slice(i, fi).replace(/[^\n]/g, ' ');
      i = fi;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1;
      o += ' '.repeat(Math.min(j + 1, css.length) - i);
      i = j + 1;
    } else { o += c; i++; }
  }
  return o.replace(/url\([^)]*\)/g, (m) => m.replace(/[^\n]/g, ' '));
}

function llegixFull(ruta, vistos = new Set()) {
  const abs = resolve(ARREL, ruta);
  if (vistos.has(abs) || !existsSync(abs)) return [];
  vistos.add(abs);
  const cru = readFileSync(abs, 'utf8');
  const fills = [];
  for (const m of cru.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/g)) {
    if (!/^([a-z]+:)?\/\//i.test(m[1])) fills.push(...llegixFull(relative(ARREL, resolve(dirname(abs), m[1])), vistos));
  }
  return [{ ruta: relative(ARREL, abs), css: neteja(cru), cru }, ...fills];
}

/** Cada prelude abans de `{` és una regla. `pare` és la regla que l'embolcalla.
 *  neteja() conserva la longitud, així que els offsets valen per al text cru. */
const avisosCss = [], fusions = [];
function regles({ ruta, css, cru }) {
  const eixida = [], pila = [];
  let ini = -1, linia = 1, liniaIni = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      const sel = ini < 0 ? '' : css.slice(ini, i).trim();
      const node = { ruta, linia: liniaIni || linia, sel, text: ini < 0 ? '' : cru.slice(ini, i).trim(), esAt: sel.startsWith('@'), pare: pila.findLast((n) => !n.esAt) ?? null };
      if (!node.esAt && sel) {
        eixida.push(node);
        const k = fusio(sel);
        if (k >= 0) fusions.push({ lloc: `${ruta}:${node.linia + k}`, text: node.text });
      }
      pila.push(node); ini = -1; liniaIni = 0;
    } else if (c === '}') {
      if (!pila.length) avisosCss.push(`${ruta}:${linia}  «}» sense bloc obert`);
      pila.pop(); ini = -1; liniaIni = 0;
    } else if (c === ';') { ini = -1; liniaIni = 0; }
    else if (ini < 0 && c.trim()) { ini = i; liniaIni = linia; }
    if (c === '\n') linia++;
  }
  for (const n of pila) avisosCss.push(`${ruta}:${n.linia}  bloc sense tancar: ${n.sel.replace(/\s+/g, ' ').slice(0, 60)}`);
  return eixida;
}

/** Salt de línia dins d'un selector sense coma ni combinador: dos selectors
 *  s'han soldat en un descendent que abans no existia. Torna la línia o -1. */
function fusio(sel) {
  const linies = sel.split('\n');
  let prof = 0;
  for (let k = 0; k < linies.length - 1; k++) {
    for (const ch of linies[k]) { if (ch === '(') prof++; else if (ch === ')') prof--; }
    const l = linies[k].trim();
    if (prof === 0 && l && !/[,>+~]$/.test(l)) return k;
  }
  return -1;
}

function parteix(sel) {
  const parts = []; let prof = 0, acc = '';
  for (const c of sel) {
    if (c === '(') prof++; else if (c === ')') prof--;
    if (c === ',' && prof === 0) { parts.push(acc); acc = ''; } else acc += c;
  }
  parts.push(acc);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const FUNCIONS_EXTERNES = new Set(['host', 'host-context', 'slotted']);

function analitza(selector) {
  const exigides = new Set(), citades = new Set(), externes = new Set();
  const s = selector.replace(/\[[^\]]*\]/g, ' ');
  const obertes = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') { obertes.push((/::?([\w-]+)\s*$/.exec(s.slice(0, i)) || [])[1] || ''); continue; }
    if (c === ')') { obertes.pop(); continue; }
    if (c !== '.') continue;
    const m = /^(?:-?[\p{L}_]|--)[\p{L}\p{N}_-]*/u.exec(s.slice(i + 1));
    if (!m) continue;
    if (obertes.some((f) => FUNCIONS_EXTERNES.has(f))) externes.add(m[0]);
    else if (obertes.length) citades.add(m[0]);
    else exigides.add(m[0]);
    i += m[0].length;
  }
  return { exigides, citades, externes };
}

/* ═══════════════════════════════ 2 · CODI ═══════════════════════════════ */

const fortes = new Set(), febles = new Set(), patrons = new Map(), avisos = [];
const consumits = new WeakSet();
const IGNORA = new Set(['loc', 'start', 'end', 'extra', 'range', 'leadingComments', 'trailingComments', 'innerComments', 'comments', 'tokens', 'errors']);
const CLASSLIST = new Set(['add', 'remove', 'toggle', 'contains', 'replace']);
const SELECTORS = new Set(['querySelector', 'querySelectorAll', 'closest', 'matches', 'getElementsByClassName']);
const ambClasse = (n) => typeof n === 'string' && /class/i.test(n);
const nom = (k) => (!k ? null : k.type === 'Identifier' || k.type === 'JSXIdentifier' ? k.name : k.type === 'StringLiteral' ? k.value : null);
const esMembre = (n) => n?.type === 'MemberExpression' || n?.type === 'OptionalMemberExpression';

function patro(tipus, text, fort, on) {
  if ((text.match(/[\p{L}\p{N}]/gu) || []).length < 2) return; // «-» o «--» sols casarien amb tot
  const clau = `${tipus}:${text}`;
  const p = patrons.get(clau) || { tipus, text, fort: false, llocs: new Set() };
  p.fort ||= fort; p.llocs.add(on);
  patrons.set(clau, p);
}

/** Trossos fixos (string) i forats (null) → noms complets i patrons. */
function anota(trossos, fort, on) {
  const t = [];
  for (const x of trossos) {
    if (typeof x === 'string' && typeof t[t.length - 1] === 'string') t[t.length - 1] += x;
    else if (!(x === null && t[t.length - 1] === null)) t.push(x);
  }
  t.forEach((tros, i) => {
    if (tros === null) return;
    for (const re of [HTML_CLASS, JSON_CLASS]) {
      for (const m of tros.matchAll(re)) for (const p of m[1].match(PARAULA) || []) fortes.add(p);
    }
    const paraules = tros.match(PARAULA) || [];
    const obertInici = t[i - 1] === null && CAR.test(tros[0] || '');
    const obertFinal = t[i + 1] === null && CAR.test(tros[tros.length - 1] || '');
    paraules.forEach((p, k) => {
      const primera = k === 0 && obertInici;
      const darrera = k === paraules.length - 1 && obertFinal;
      if (primera && darrera) patro('infix', p, fort, on);
      else if (primera) patro('sufix', p, fort, on);
      else if (darrera) patro('prefix', p, fort, on);
      else (fort ? fortes : febles).add(p);
    });
  });
}

function aplana(n) {
  if (n.type === 'BinaryExpression' && n.operator === '+') return [...aplana(n.left), ...aplana(n.right)];
  if (n.type === 'StringLiteral') { consumits.add(n); return [n.value]; }
  return [null];
}

function visita(n, fort, on) {
  if (!n || typeof n.type !== 'string') return;
  switch (n.type) {
    case 'ImportDeclaration':
    case 'TemplateElement':
      return;
    case 'StringLiteral':
      if (!consumits.has(n)) anota([n.value], fort, on);
      return;
    case 'JSXText':
      anota([n.value], false, on);
      return;
    case 'TemplateLiteral':
      anota(n.quasis.flatMap((q, i) => {
        const text = q.value.cooked ?? q.value.raw;
        return i < n.expressions.length ? [text, null] : [text];
      }), fort, on);
      break;
    case 'BinaryExpression':
      if (n.operator === '+' && !consumits.has(n)) {
        const t = aplana(n);
        if (t.some((x) => typeof x === 'string')) anota(t, fort, on);
      }
      break;
    case 'JSXAttribute': {
      const a = nom(n.name);
      visita(n.value, fort || a === 'className' || a === 'class', on);
      return;
    }
    case 'ObjectProperty':
      visita(n.key, fort, on);
      visita(n.value, fort || ambClasse(nom(n.key)), on);
      return;
    case 'VariableDeclarator':
      visita(n.id, fort, on);
      visita(n.init, fort || ambClasse(nom(n.id)), on);
      return;
    case 'AssignmentPattern':
      visita(n.left, fort, on);
      visita(n.right, fort || ambClasse(nom(n.left)), on);
      return;
    case 'AssignmentExpression':
      visita(n.left, fort, on);
      visita(n.right, fort || ambClasse(esMembre(n.left) ? nom(n.left.property) : nom(n.left)), on);
      return;
    case 'CallExpression':
    case 'OptionalCallExpression': {
      const c = n.callee;
      const metode = esMembre(c) ? nom(c.property) : nom(c);
      const classList = esMembre(c) && esMembre(c.object) && nom(c.object.property) === 'classList' && CLASSLIST.has(metode);
      const selector = SELECTORS.has(metode);
      const cx = /^(cx|clsx|classnames|classNames)$/.test(metode || '');
      const setClass = metode === 'setAttribute' && n.arguments[0]?.value === 'class';
      visita(c, fort, on);
      n.arguments.forEach((arg, i) => visita(arg, fort || classList || selector || cx || (setClass && i === 1), on));
      return;
    }
  }
  for (const k in n) {
    if (IGNORA.has(k) || (k === 'source' && n.type.startsWith('Export'))) continue;
    const v = n[k];
    if (Array.isArray(v)) v.forEach((x) => visita(x, fort, on));
    else if (v && typeof v === 'object' && typeof v.type === 'string') visita(v, fort, on);
  }
}

const CODI = recorre('src', (p) => /\.(jsx?|mjs)$/.test(p) && !/\.test\.[jt]sx?$/.test(p));
for (const f of CODI) {
  const text = readFileSync(resolve(ARREL, f), 'utf8');
  let ast = null;
  try { ast = parse(text, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true }); }
  catch (e) { avisos.push(`${f}: no parseja (${e.message}); compta com a text cru`); }
  if (ast) visita(ast.program, false, f);
  if (!ast || ast.errors?.length) {
    anota([text], false, f); // fail-safe: millor una viva de més que una orfe falsa
    if (ast) avisos.push(`${f}: ${ast.errors.length} error(s) recuperats; afegit també com a text cru`);
  }
}

/* ═══════════════════════════════ 3 · FONTS CRUES ═══════════════════════════════ */

const CRUES = [
  ...['index.html'].filter((f) => existsSync(resolve(ARREL, f))),
  ...recorre('public', (p) => /\.html?$/.test(p)),
  ...recorre('src', (p) => p.endsWith('.json')),
  ...recorre('supabase', (p) => p.endsWith('.sql')),
  ...recorre('wordpress-plugin', (p) => /\.(php|html?|js)$/.test(p)),
];
for (const f of CRUES) anota([readFileSync(resolve(ARREL, f), 'utf8')], false, f);

/* ═══════════════════════════════ 4 · VEREDICTE ═══════════════════════════════ */

const fulls = FULLS.flatMap((f) => llegixFull(f));
if (!fulls.length) { console.error(`❌ [PODA CSS] No trobe ${FULLS.join(', ')}`); process.exit(2); }
const totes = fulls.flatMap(regles);
const definides = new Map();
const externesCss = new Set();
for (const r of totes) {
  r.parts = parteix(r.sel).map(analitza);
  for (const a of r.parts) {
    for (const c of [...a.exigides, ...a.citades]) {
      if (!definides.has(c)) definides.set(c, []);
      definides.get(c).push(`${r.ruta}:${r.linia}`);
    }
    a.externes.forEach((c) => externesCss.add(c));
  }
}

const casa = (c, p) => (p.tipus === 'prefix' ? c.startsWith(p.text) : p.tipus === 'sufix' ? c.endsWith(p.text) : c.includes(p.text));
const estat = new Map(), perPatro = new Map();
for (const c of definides.keys()) {
  let e;
  if (externesCss.has(c) || VIVES_EXTERNES.some((r) => r.test(c))) e = 'externa';
  else if (fortes.has(c)) e = 'viva';
  else {
    const ps = [...patrons.values()].filter((p) => casa(c, p));
    if (ps.length) { e = 'patró'; perPatro.set(c, ps.map((p) => `${p.tipus} «${p.text}»${p.fort ? '' : ' (dèbil)'}`)); }
    else e = febles.has(c) ? 'dèbil' : 'orfe';
  }
  estat.set(c, e);
}

const mortes = [], parcials = [];
for (const r of totes) {
  const morts = r.parts.map((a) => [...a.exigides].some((c) => estat.get(c) === 'orfe'));
  r.morta = Boolean(r.pare?.morta) || (morts.length > 0 && morts.every(Boolean));
  if (r.morta) mortes.push(r);
  else if (morts.some(Boolean)) parcials.push({ r, selectors: parteix(r.sel).filter((_, i) => morts[i]) });
}

const de = (e) => [...estat].filter(([, x]) => x === e).map(([c]) => c).sort();
const orfes = de('orfe'), debils = de('dèbil');
const net = (s) => s.replace(/\s+/g, ' ');
const L = (s = '') => console.log(s);

L(`\n🌾 PODA CSS — ${fulls.map((f) => f.ruta).join(' + ')}`);
L('─'.repeat(72));
L(`  ${totes.length} regles · ${definides.size} classes · ${CODI.length} fitxers per AST + ${CRUES.length} crus · ${patrons.size} patrons dinàmics`);
L(`  viva ${de('viva').length} · patró ${perPatro.size} · dèbil ${debils.length} · externa ${de('externa').length} · ORFE ${orfes.length}`);
L(`\n❌ ORFES — cap rastre enlloc (${orfes.length})`);
for (const c of orfes) { const ll = definides.get(c); L(`   .${c}  ${ll.slice(0, 3).join(', ')}${ll.length > 3 ? ` (+${ll.length - 3})` : ''}`); }
L(`\n🪦 REGLES MORTES — totes les branques exigixen una orfe (${mortes.length})`);
for (const r of mortes) L(`   ${r.ruta}:${r.linia}  ${net(r.text).slice(0, 96)}`);
L(`\n✂️  SELECTORS MORTS dins de regles vives (${parcials.length})`);
for (const { r, selectors } of parcials) L(`   ${r.ruta}:${r.linia}  ${net(selectors.join(', ')).slice(0, 96)}`);
L(`\n🔎 VIVES NOMÉS PER PATRÓ — revisió humana (${perPatro.size})`);
for (const [c, ps] of perPatro) L(`   .${c}  ← ${ps.join(' | ')}`);
L(`\n🔎 DÈBILS — només com a paraula en text, mai en context de classe (${debils.length})`);
if (debils.length) L(`   ${debils.join('  ')}`);
L(`\n🧷 SELECTORS SOLDATS — salt de línia sense coma: canvien de significat (${fusions.length})`);
for (const f of fusions) L(`   ${f.lloc}  ${net(f.text).slice(0, 96)}`);
if (avisosCss.length) { L('\n🧱 CLAUS DESQUADRADES'); avisosCss.forEach((a) => L(`   ${a}`)); }
if (avisos.length) { L('\n⚠️  AVISOS'); avisos.forEach((a) => L(`   ${a}`)); }
L("\n  Fora d'abast: classes que l'amfitrió injecte per configuració o per contingut de BD que no siga a supabase/*.sql.");

const eixidaJson = valors('json')[0];
if (eixidaJson) {
  writeFileSync(resolve(ARREL, eixidaJson), JSON.stringify({
    generat: new Date().toISOString(),
    fulls: fulls.map((f) => f.ruta),
    orfes: Object.fromEntries(orfes.map((c) => [c, definides.get(c)])),
    regles_mortes: mortes.map((r) => `${r.ruta}:${r.linia}  ${net(r.text)}`),
    selectors_soldats: fusions.map((f) => `${f.lloc}  ${net(f.text)}`),
    claus: avisosCss,
    selectors_morts: parcials.map(({ r, selectors }) => `${r.ruta}:${r.linia}  ${net(selectors.join(', '))}`),
    per_patro: Object.fromEntries(perPatro),
    debils,
    avisos,
  }, null, 2) + '\n');
}

if (ARGS.includes('--ci') && orfes.length > MAX) {
  L(`\n❌ [PODA CSS] ${orfes.length} orfes > màx ${MAX}.`);
  process.exit(1);
}
process.exit(0);
