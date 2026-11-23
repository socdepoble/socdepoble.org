#!/usr/bin/env node
/**
 * tractor-frontmatter.mjs — PORTA DE L'ESQUEMA CANÒNIC (v2)
 *
 * FONT DE VERITAT ÚNICA
 * ─────────────────────
 *   tooling/wiki/schema.json  ·  wiki-frontmatter-v2.1
 *   L'esquema v1 (esquema_frontmatter.json) queda obsolet i NO es llig ací.
 *   Este fitxer no declara cap clau, cap enum ni cap límit: tot ho deriva
 *   del JSON Schema. Si voleu canviar la llei, canvieu l'esquema.
 *
 * LLEIS
 *   F1 OBLIGATÒRIA  falta una clau de `required`  → UNA per clau absent
 *   F2 FORASTERA    clau fora de `properties` amb additionalProperties:false
 *   F3 ENUM         valor fora del domini declarat
 *   F4 VOCABULARI   tag fora de properties.tags.items.enum (dorment si no existix)
 *   F5 ENTROPIA     clau no obligatòria amb un únic valor en tot el corpus
 *   F6 DUPLICADA    la mateixa clau dos vegades al mateix frontmatter
 *   F7 FORMAT       tipus, longitud, cardinalitat, unicitat o YAML il·legible
 *   F8 MARCADOR     placeholder {…} fora d'una plantilla declarada
 *
 *   F1 es compta per clau absent i no per document. Amb el recompte antic,
 *   esborrar el frontmatter sencer valia 1 punt i deixar-lo incomplet en
 *   valia 3: la mesura premiava la mutilació. Ara no.
 *
 *   F8 substituïx l'antiga exempció per contingut. Abans, qualsevol `{x}` en
 *   qualsevol valor feia saltar el document sencer per damunt de les sis
 *   lleis. Ara el marcador només es tolera si el document declara
 *   `tipus: plantilla`, mai en `tipus` ni en `estat`, i mai eximix ni la
 *   presència de claus (F1) ni les claus forasteres (F2).
 *
 * BLINDATGES (ixen amb codi 2, no amb avís)
 *   · Esquema absent.
 *   · Esquema amb una construcció que este tractor no sap fer complir.
 *   · schemaSha256 del pany de migració que no quadra amb l'esquema real.
 *   · Deute segellat amb un esquema o un mètode de recompte distint de l'actual.
 *
 * ÚS
 *   node tooling/wiki/tractor-frontmatter.mjs
 *   node tooling/wiki/tractor-frontmatter.mjs --json
 *   node tooling/wiki/tractor-frontmatter.mjs --estricte      # zero tolerància
 *   node tooling/wiki/tractor-frontmatter.mjs --baseline      # segella el deute
 *   node tooling/wiki/tractor-frontmatter.mjs --segella-esquema
 *   node tooling/wiki/tractor-frontmatter.mjs --arrels=src,docs
 *
 * Pedra Seca: zero dependències, ESM, fail-closed. El lector de frontmatter
 * és intern a propòsit: una porta que depén del parser que vigila hereta els
 * seus errors i deixa de ser una porta.
 */

import fs from 'node:fs';
import { isDocumentArchive, isVerifiedPublicApiResource } from '../lib/document-corpus.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync, spawnSync } from 'node:child_process';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { liveMarkdown, extractLinks, buildResolver, resolveLink, safeDecode } from './core/parse.mjs';
import { CAMINS } from '../lib/arrel.mjs';
import { confinedFile } from './lib/publication-policy.mjs';

/* Vincle històric (B1 · 261101): l'arxivat de la porta Olivera reescriu `[[x]]` com
   `[[../90_arxiu_historic/x|x]]`. L'arxiu queda fora del resolutor (AGENTS §5), així que
   eixe vincle tornava «unresolved». Ara és vàlid si porta, des de la carpeta del document,
   a una nota de l'arxiu que existix amb la caixa exacta, de primer nivell o dins d'una
   carpeta de sessió (`--sessio aammdd_Nom` de la porta Olivera, un sol segment). Només es
   llisten noms (com document-corpus.mjs): no se n'obri cap. No compta com a nota viva.
   Onada R28 · Una nota absent del disc també val si Git la ignora per una regla versionada
   (arxiuIgnoratPerGit, ací baix); qualsevol altre vincle absent continua sent F9.
   Onada R29 · R28-REG-03 · Git només decidix quan l'arxiu del disc no és el local (arxiuEsLocal). */
const ARXIU_HISTORIC = `${CAMINS.arxiuHistoric}/`;
const SESSIO_ARXIU = /^\d{6}_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/;
const nomsArxivats = new Map();

/* Onada R28 · sql-node0-integritat-01 · Des de D-R27-4, el .gitignore versionat ignora la carpeta
   de l'arxiu històric (CAMINS.arxiuHistoric): la nota que la porta Olivera arxiva ja no entra a l'índex,
   i falta a l'arbre preparat del hook (git-staged.mjs el fa amb read-tree) i a qualsevol clon net,
   mentre el document viu porta el vincle reescrit cap a ella. Una nota absent del disc es dona per
   arxivada NOMÉS si Git la ignora (`check-ignore --no-index`) per una regla no negada d'un
   .gitignore versionat, ARREL és el nivell superior del seu repositori i el camí no és a l'índex
   (versionat i absent és un esborrat). Mateix criteri que esLocal de tooling/gates/tractor-doctrina.mjs:
   sense Git, amb error, amb exclusions personals o amb .git/info/exclude, continua sent F9. */
const ENTORN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const git = (args, input) => spawnSync('git', args, { cwd: ARREL, env: ENTORN_GIT, encoding: 'utf8', timeout: 10_000, input });
let arrelGitPropia = null;
const esArrelGit = () => {
  if (arrelGitPropia === null) {
    const r = git(['rev-parse', '--show-toplevel']);
    try { arrelGitPropia = r.status === 0 && fs.realpathSync(r.stdout.replace(/\n$/, '')) === fs.realpathSync(ARREL); }
    catch { arrelGitPropia = false; }
  }
  return arrelGitPropia;
};
// --literal-pathspecs: cap glob del camí s'expandix. Torna null si Git falla.
const esVersionat = (cami) => {
  const r = git(['--literal-pathspecs', 'ls-files', '-z', '--', cami]);
  return r.status === 0 ? r.stdout !== '' : null;
};
const fontsAcceptades = new Map();
const esFontVersionada = (font) => {
  if (!fontsAcceptades.has(font)) {
    const gitignore = font === '.gitignore' || font.endsWith('/.gitignore');
    fontsAcceptades.set(font, gitignore && esVersionat(font) === true);
  }
  return fontsAcceptades.get(font);
};
const ignoratsArxiu = new Map();
function arxiuIgnoratPerGit(cami) {
  if (!ignoratsArxiu.has(cami)) {
    let ignorat = false;
    if (!cami.includes('\0') && esArrelGit() && esVersionat(cami) === false) {
      // Exit 1 = cap regla; 128 = error (fail-closed). Amb -v -n, cada registre és font, línia, patró i camí.
      const r = git(['-c', 'core.excludesFile=/dev/null', 'check-ignore', '--no-index', '--stdin', '-z', '-v', '-n'], `${cami}\0`);
      const camps = r.status === 0 ? r.stdout.split('\0') : [];
      for (let i = 0; i + 3 < camps.length; i += 4) {
        const [font, , patro] = camps.slice(i, i + 3);
        // Amb -v, una negació («!x») també casa, però vol dir que NO s'ignora.
        if (patro && !patro.startsWith('!') && esFontVersionada(font)) { ignorat = true; break; }
      }
    }
    ignoratsArxiu.set(cami, ignorat);
  }
  return ignoratsArxiu.get(cami);
}

function esNotaArxivada(target, relPath) {
  const t = safeDecode(target).trim();
  if (!/(^|\/)90_arxiu_historic\//.test(t)) return false;
  const cami = path.posix.normalize(path.posix.join(path.posix.dirname(relPath), `${t.replace(/\.md$/i, '')}.md`));
  if (!cami.startsWith(ARXIU_HISTORIC)) return false;
  const parts = cami.slice(ARXIU_HISTORIC.length).split('/');
  if (parts.length > 2 || (parts.length === 2 && !SESSIO_ARXIU.test(parts[0]))) return false;
  const carpeta = parts.length === 2 ? `${ARXIU_HISTORIC}${parts[0]}/` : ARXIU_HISTORIC;
  if (!nomsArxivats.has(carpeta)) {
    try {
      nomsArxivats.set(carpeta, new Set(fs.readdirSync(path.join(ARREL, carpeta), { withFileTypes: true })
        .filter((e) => e.isFile()).map((e) => e.name)));
    } catch { nomsArxivats.set(carpeta, new Set()); }
  }
  const noms = nomsArxivats.get(carpeta);
  const nom = parts[parts.length - 1];
  if (noms.has(nom)) return true;
  // Onada R28 · Si a l'arxiu hi ha la mateixa nota amb una altra caixa, és un error de caixa: F9, encara que Git ignore el camí.
  const nomBaix = nom.toLowerCase();
  if ([...noms].some((n) => n.toLowerCase() === nomBaix)) return false;
  // Onada R29 · R28-REG-03 · Si l'arxiu del disc és el local (porta notes que Git no versiona), mana el seu
  // llistat: un nom que no hi és (una errada) és F9 encara que Git ignore el camí.
  if (arxiuEsLocal()) return false;
  return arxiuIgnoratPerGit(cami);
}

/* Onada R29 · R28-REG-03 · Quan mana el llistat del disc. L'arxiu té notes versionades d'abans de D-R27-4,
   així que l'arbre preparat del hook (read-tree de l'índex) i un clon net també porten la carpeta, però només
   amb eixes notes: ací una nota arxivada després falta i ha de decidir Git (arxiuIgnoratPerGit). L'arxiu és
   local (el de la màquina que arxiva, i el seu llistat mana) si hi ha alguna nota, de primer nivell o d'una
   carpeta de sessió, que no és a l'índex. Si la carpeta no existix (ENOENT), no és local. Sense Git, amb un
   error de Git o de lectura (permisos, un fitxer amb eixe nom), mana el disc: el vincle absent és F9. */
const nfc = (s) => s.normalize('NFC');
// Només notes (.md, sense els fitxers ocults com el .DS_Store de Finder, que mai no van a l'índex).
const esNota = (e) => e.isFile() && !e.name.startsWith('.') && /\.md$/i.test(e.name);
function notesArxiuAlDisc() {
  const arrelArxiu = path.join(ARREL, ARXIU_HISTORIC);
  let entrades;
  try { entrades = fs.readdirSync(arrelArxiu, { withFileTypes: true }); }
  catch (e) { if (e?.code === 'ENOENT') return null; throw e; }
  const camins = [];
  for (const e of entrades) {
    if (esNota(e)) camins.push(`${ARXIU_HISTORIC}${e.name}`);
    else if (e.isDirectory() && SESSIO_ARXIU.test(e.name)) {
      for (const f of fs.readdirSync(path.join(arrelArxiu, e.name), { withFileTypes: true })) {
        if (esNota(f)) camins.push(`${ARXIU_HISTORIC}${e.name}/${f.name}`);
      }
    }
  }
  return camins;
}
let arxiuLocal = null;
function arxiuEsLocal() {
  if (arxiuLocal === null) {
    try {
      const alDisc = notesArxiuAlDisc();
      if (alDisc === null) arxiuLocal = false;
      else if (!esArrelGit()) arxiuLocal = true;
      else {
        const r = git(['--literal-pathspecs', 'ls-files', '-z', '--', ARXIU_HISTORIC]);
        const versionades = new Set(r.status === 0 ? r.stdout.split('\0').filter(Boolean).map(nfc) : []);
        arxiuLocal = r.status !== 0 || alDisc.some((cami) => !versionades.has(nfc(cami)));
      }
    } catch { arxiuLocal = true; }
  }
  return arxiuLocal;
}

function validaVincles(doc, resolver) {
  const p = parseFrontmatter(doc.content);
  if (p.malformed || p.errors.length) return ['YAML no llegible'];
  const seccions = [];
  let actual = null;
  for (const line of liveMarkdown(p.body).split('\n')) {
    const h = /^ {0,3}(#{1,6})[\t ]+(.+?)(?:[\t ]+#+)?[\t ]*$/.exec(line);
    if (h && h[1].length <= 2) {
      actual = h[1].length === 2 && h[2] === 'Vincles' ? [] : null;
      if (actual) seccions.push(actual);
    } else if (actual) {
      actual.push(line);
    }
  }
  if (seccions.length !== 1) {
    return ['Cal exactament una secció real ## Vincles'];
  }
  const errors = [];
  let valids = 0;
  for (const line of seccions[0]) {
    if (!line.trim()) continue;
    const item = /^ {0,3}[-*][\t ]+(\[\[[^[\]\n]+\]\])[\t ]*$/.exec(line);
    if (!item || item[1].includes('\\')) {
      errors.push('Vincles només admet una llista de wikilinks sencers');
      continue;
    }
    const links = extractLinks(item[1]);
    if (links.length !== 1 || /[#^]/.test(links[0].target)) {
      errors.push('Cal enllaçar una nota sencera, sense fragments');
      continue;
    }
    const r = resolveLink(links[0], doc, resolver);
    if (r.status === 'resolved' && r.doc.relPath !== doc.relPath) {
      valids++;
    } else if (r.status === 'unresolved' && esNotaExterna(links[0].target, doc.relPath)) {
      // Destí verificat fora de la còpia: és una referència, mai un node d'autoria.
      if (!isDocumentArchive(esNotaExterna(links[0].target, doc.relPath))) valids++;
    } else if (r.status === 'unresolved' && esNotaArxivada(links[0].target, doc.relPath)) {
      // Vincle històric a una nota arxivada (al disc o, absent, ignorada per un .gitignore versionat): no és error ni compta com a nota viva.
    } else {
      errors.push(`${links[0].target}: ${r.status === 'resolved' ? 'autoreferència' : r.status}`);
    }
  }
  if (!valids) errors.push('Falta una nota interna única i diferent');
  return errors;
}

const METODE = 'F1-per-clau/v2';

/* ──────────────────────────── Arguments ──────────────────────────── */

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const TE = (n) => process.argv.includes(`--${n}`);

const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const JSON_OUT = TE('json');
const BASELINE = TE('baseline');
const SEGELLA_ESQ = TE('segella-esquema');
const ESTRICTE = TE('estricte');
const MOSTRA = Number(ARG('mostra') ?? 6);

const ESQUEMA = path.join(ARREL, 'tooling/wiki/schema.json');
const PANY = path.join(ARREL, 'tooling/wiki/schema-cutover.lock.json');
const ABAST = path.join(ARREL, 'tooling/wiki/frontmatter-abast.json');
const DEUTE = path.join(ARREL, '.agents/deute/.frontmatter-deute.json');

const mor = (msg, detall = []) => {
  console.error(`❌ [FRONTMATTER] ${msg}`);
  for (const d of detall) console.error(`   ${d}`);
  process.exit(2);
};

/* Un clon pot ometre un original privat sense convertir-lo en nota absent.
 * El catàleg és explícit i opcional: només noms, caixa exacta i lstat; mai
 * llegim el cos ni afegim nodes a NODES/F1/L0. Sense el catàleg, la porta de
 * producte conserva la resolució ordinària. Cap destí ambigu la substituïx. */
function lligCatalegExtern(file) {
  if (!file) return [];
  try {
    const absolute = path.resolve(file);
    const safe = confinedFile(path.dirname(absolute), absolute);
    if (!safe || fs.statSync(safe).size > 1024 * 1024) throw Error();
    const catalog = JSON.parse(fs.readFileSync(safe, 'utf8'));
    if (catalog.version !== 1 || typeof catalog.root !== 'string' || !path.isAbsolute(catalog.root)
      || !Array.isArray(catalog.targets) || catalog.targets.length > 10000) throw Error();
    const root = fs.realpathSync(catalog.root), seen = new Set();
    for (const rel of catalog.targets) {
      if (typeof rel !== 'string' || !rel.endsWith('.md') || rel.includes('\\')
        || /[\u0000-\u001f\u007f]/.test(rel) || path.posix.normalize(rel) !== rel
        || path.posix.isAbsolute(rel) || rel.split('/').some(p => !p || p === '.' || p === '..') || seen.has(rel)) throw Error();
      let cursor = root;
      for (const part of rel.split('/')) {
        if (!fs.readdirSync(cursor).includes(part)) throw Error();
        cursor = path.join(cursor, part);
        if (fs.lstatSync(cursor).isSymbolicLink()) throw Error();
      }
      if (!fs.lstatSync(cursor).isFile()) throw Error();
      seen.add(rel);
    }
    return [...seen].sort();
  } catch { mor('Catàleg extern invàlid o destí absent; cap referència s’ha omés.'); }
}
const DESTINS_EXTERNS = lligCatalegExtern(ARG('cataleg-extern'));
function esNotaExterna(target, source) {
  const t = safeDecode(target).trim().replace(/\.md$/i, '');
  const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(source), t));
  const exact = DESTINS_EXTERNS.filter(rel => {
    const noExt = rel.slice(0, -3);
    return t.startsWith('/') ? noExt === t.slice(1)
      : noExt === t || noExt === candidate || (t.includes('/') ? noExt.endsWith(`/${t}`) : path.posix.basename(noExt) === t);
  });
  return exact.length === 1 && exact[0] !== source ? exact[0] : null;
}

/* ──────────────────────────── Esquema ──────────────────────────── */

if (!fs.existsSync(ESQUEMA)) {
  mor(`Falta l'esquema canònic: ${ESQUEMA}`, ['Sense esquema no hi ha llei. Fallem tancat.']);
}

const BRUT = fs.readFileSync(ESQUEMA);
const SHA = crypto.createHash('sha256').update(BRUT).digest('hex');

let S;
try { S = JSON.parse(BRUT.toString('utf8')); }
catch (e) { mor(`L'esquema no és JSON vàlid: ${e.message}`); }

/* El pany de migració declara el SHA de l'esquema. Si el declara i no quadra,
 * algú ha tocat la llei sense tornar a segellar-la. */
if (SEGELLA_ESQ) {
  if (!fs.existsSync(PANY)) mor(`No hi ha pany per a segellar: ${PANY}`);
  const p = JSON.parse(fs.readFileSync(PANY, 'utf8'));
  p.schemaSha256 = SHA;
  fs.writeFileSync(PANY, JSON.stringify(p, null, 2) + '\n');
  console.log(`🔒 [FRONTMATTER] Pany actualitzat: schemaSha256 = ${SHA}`);
  process.exit(0);
}
if (fs.existsSync(PANY)) {
  const p = JSON.parse(fs.readFileSync(PANY, 'utf8'));
  if (p.schemaSha256 && p.schemaSha256 !== SHA) {
    mor('El pany de migració no quadra amb l\'esquema real.', [
      `declarat : ${p.schemaSha256}`,
      `real     : ${SHA}`,
      'Reconcilieu-ho: node tooling/wiki/tractor-frontmatter.mjs --segella-esquema',
    ]);
  }
} else {
  console.error(`⚠️  [FRONTMATTER] Sense pany a ${PANY}. L'esquema circula sense segell.`);
}

/* Anti-deriva: si l'esquema creix amb una construcció que no sabem fer
 * complir, callar seria pitjor que caure. */
const ARREL_OK = new Set(['$schema', '$id', 'title', 'description', '$comment', 'type',
  'additionalProperties', 'required', 'properties', 'minimum', 'maximum', 'default']);
const PROP_OK = new Set(['type', 'enum', 'const', 'pattern', 'minLength', 'maxLength',
  'minItems', 'maxItems', 'uniqueItems', 'items', 'description', '$comment', 'minimum', 'maximum', 'default']);
const ITEM_OK = new Set(['type', 'enum', 'const', 'pattern', 'minLength', 'maxLength', 'minimum', 'maximum', 'default']);

const desconegudes = [];
for (const k of Object.keys(S)) if (!ARREL_OK.has(k)) desconegudes.push(`(arrel) ${k}`);
for (const [nom, def] of Object.entries(S.properties ?? {})) {
  for (const k of Object.keys(def)) if (!PROP_OK.has(k)) desconegudes.push(`${nom}.${k}`);
  for (const k of Object.keys(def.items ?? {})) if (!ITEM_OK.has(k)) desconegudes.push(`${nom}.items.${k}`);
}
if (desconegudes.length) {
  mor('L\'esquema usa construccions que este tractor no sap fer complir.', [
    ...desconegudes.map((d) => `· ${d}`),
    'Amplieu el tractor o simplifiqueu l\'esquema. No validem a mitges.',
  ]);
}

// Same numeric contract as documental/core.mjs. default is only an annotation:
// it neither supplies a required value nor changes parsed data or source bytes.
const limitsInvalids = [];
const comprovaLimits = (def, nom) => {
  for (const key of ['minimum', 'maximum']) {
    if (Object.hasOwn(def, key) && (!['integer', 'number'].includes(def.type) || !Number.isFinite(def[key]))) limitsInvalids.push(`${nom}.${key}: límit numèric invàlid`);
  }
  if (def.minimum !== undefined && def.maximum !== undefined && def.minimum > def.maximum) limitsInvalids.push(`${nom}: límits numèrics invertits`);
};
comprovaLimits(S, '(arrel)');
for (const [nom, def] of Object.entries(S.properties ?? {})) {
  comprovaLimits(def, nom);
  if (def.items) comprovaLimits(def.items, `${nom}.items`);
}
if (limitsInvalids.length) mor('L’esquema declara límits numèrics invàlids.', limitsInvalids);

const PROPS = S.properties ?? {};
const REQ = S.required ?? [];
const TANCAT = S.additionalProperties === false;
const VOC = PROPS.tags?.items?.enum ?? null;

/* ──────────────────────────── Abast ──────────────────────────── */

const aRegex = (p) => new RegExp('^' + p
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*\//g, '\u0001')
  .replace(/\*\*/g, '\u0000')
  .replace(/\*/g, '[^/]*')
  .replace(/\u0000/g, '.*')
  .replace(/\u0001/g, '(?:.*/)?') + '$');

const PER_DEFECTE = {
  arrels: ['.'],
  exclou: ['node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'coverage',
    '.vite', '.next', '.nuxt', '.cache', '.turbo', '.obsidian', '.sdp-paperera',
    '90_historic', '90_arxiu_historic', '.quarantena-*', 'bot'],
  immutables: [],
  perfils: [],
};

const CFG = fs.existsSync(ABAST)
  ? { ...PER_DEFECTE, ...JSON.parse(fs.readFileSync(ABAST, 'utf8')) }
  : PER_DEFECTE;

const ARRELS = (ARG('arrels') ?? CFG.arrels.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const EXCLOU = CFG.exclou.map((p) => aRegex(p.includes('/') ? p : `**/${p}`));
const IMMUTABLES = CFG.immutables.map(aRegex);
const PERFILS = CFG.perfils.map((p) => ({ re: aRegex(p.abast), exigix: p.exigix ?? [] }));

function recorre(rel, acc) {
  const abs = rel ? path.join(ARREL, rel) : ARREL;
  let entrades;
  try { entrades = fs.readdirSync(abs, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrades) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (isDocumentArchive(r) || EXCLOU.some((re) => re.test(r))) continue;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) recorre(r, acc);
    else if (e.name.toLowerCase().endsWith('.md') && !isVerifiedPublicApiResource(ARREL, r)) acc.push(r);
  }
  return acc;
}

const cru = [];
for (const a of ARRELS) recorre(a === '.' ? '' : a.replace(/^\.\//, '').replace(/\/+$/, ''), cru);

const TOTS = [...new Set(cru)].sort();
const EXEMPTS = TOTS.filter((n) => IMMUTABLES.some((re) => re.test(n)));
const NODES = TOTS.filter((n) => !EXEMPTS.includes(n));

if (NODES.length === 0) {
  mor(`Cap document a ${ARRELS.join(', ')} des de ${ARREL}.`, ['Reviseu --arrel o frontmatter-abast.json.']);
}

/* ──────────────────────────── Lector de frontmatter ──────────────────────────── */

const MARCADOR = /\{[^}\n]+\}/;

function escalar(s) {
  const t = s.trim();
  if (t === '') return null;
  const q = /^"([\s\S]*)"$/.exec(t) ?? /^'([\s\S]*)'$/.exec(t);
  if (q) return q[1];
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '~') return null;
  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(t)) return Number(t);
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
  const t = txt.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!t.startsWith('---\n')) return null;
  const fi = t.indexOf('\n---', 3);
  const fi2 = t.indexOf('\n...', 3);
  const tall = fi === -1 ? fi2 : (fi2 === -1 ? fi : Math.min(fi, fi2));
  if (tall === -1) return null;
  return t.slice(4, tall + 1);
}

function llig(cos) {
  const linies = cos.split('\n');
  const valors = new Map();
  const claus = [];
  const avisos = [];
  let i = 0;
  while (i < linies.length) {
    const l = linies[i];
    if (!l.trim() || /^\s*#/.test(l)) { i++; continue; }
    const m = /^([A-Za-z_][\w.$-]*)\s*:\s*(.*)$/.exec(l);
    if (!m) {
      avisos.push({ codi: 'F7', detall: `línia ${i + 1} il·legible: «${l.trim().slice(0, 48)}»` });
      i++; continue;
    }
    const clau = m[1];
    const resta = m[2].trim();
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
      if (nidat) { avisos.push({ codi: 'F7', detall: `«${clau}» conté un mapa nidat` }); valor = undefined; }
      else valor = items.length ? items : null;
      i = j;
    } else if (resta.startsWith('[')) {
      const f = flux(resta);
      if (f.mal) avisos.push({ codi: 'F7', detall: `«${clau}» té una llista en línia mal tancada` });
      valor = f.valor; i++;
    } else { valor = escalar(resta); i++; }
    claus.push(clau);
    if (valors.has(clau)) avisos.push({ codi: 'F6', detall: clau });
    else valors.set(clau, valor);
  }
  return { valors, claus, avisos };
}

/* ──────────────────────────── Anàlisi ──────────────────────────── */

const f = { F1: [], F2: [], F3: [], F4: [], F5: [], F6: [], F7: [], F8: [], F9: [] };
const usPerClau = new Map();
const valsPerClau = new Map();

const esMarcador = (v) => typeof v === 'string' && MARCADOR.test(v);
const teMarcador = (v) => Array.isArray(v) ? v.some(esMarcador) : esMarcador(v);

function comprovaEscalar(n, clau, v, def) {
  if (def.type === 'string' && typeof v !== 'string') {
    f.F7.push({ n, clau, detall: `s'esperava text i és ${v === null ? 'buit' : typeof v}` }); return;
  }
  if (def.type === 'boolean' && typeof v !== 'boolean') { f.F7.push({ n, clau, detall: 'no és booleà' }); return; }
  if (def.type === 'integer' && !Number.isInteger(v)) { f.F7.push({ n, clau, detall: 'no és enter' }); return; }
  if (def.type === 'number' && typeof v !== 'number') { f.F7.push({ n, clau, detall: 'no és número' }); return; }
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) { f.F7.push({ n, clau, detall: 'número no finit' }); return; }
    if (def.minimum !== undefined && v < def.minimum) f.F7.push({ n, clau, detall: `${v} < minimum ${def.minimum}` });
    if (def.maximum !== undefined && v > def.maximum) f.F7.push({ n, clau, detall: `${v} > maximum ${def.maximum}` });
  }
  if (typeof v === 'string') {
    if (def.enum && !def.enum.includes(v)) f.F3.push({ n, clau, valor: v });
    if (def.const !== undefined && v !== def.const) f.F3.push({ n, clau, valor: v });
    if (def.minLength != null && v.length < def.minLength) f.F7.push({ n, clau, detall: `${v.length} < mín ${def.minLength}` });
    if (def.maxLength != null && v.length > def.maxLength) f.F7.push({ n, clau, detall: `${v.length} > màx ${def.maxLength}` });
    if (def.pattern && !new RegExp(def.pattern).test(v)) f.F7.push({ n, clau, detall: 'no casa amb el patró' });
  }
}

const totsElsDocs = NODES.map(n => {
  try {
    return { relPath: n, content: fs.readFileSync(path.join(ARREL, n), 'utf8') };
  } catch {
    return null;
  }
}).filter(Boolean);

const resolver = buildResolver(totsElsDocs);

for (const n of NODES) {
  let txt;
  try { txt = fs.readFileSync(path.join(ARREL, n), 'utf8'); } catch { continue; }
  const cos = parteix(txt);
  
  const docObj = totsElsDocs.find(d => d.relPath === n);
  if (docObj) {
    const errs = validaVincles(docObj, resolver);
    for (const e of errs) {
      f.F9.push({ n, clau: 'Vincles', detall: e });
    }
  }

  if (cos === null) {
    for (const k of REQ) f.F1.push({ n, clau: k });
    continue;
  }

  const { valors, claus, avisos } = llig(cos);
  for (const a of avisos) f[a.codi].push({ n, clau: a.detall });

  const plantilla = valors.get('tipus') === 'plantilla' || valors.get('type') === 'plantilla';

  const exigides = [...new Set([
    ...REQ,
    ...PERFILS.filter((p) => p.re.test(n)).flatMap((p) => p.exigix),
  ])];
  for (const k of exigides) if (!valors.has(k)) f.F1.push({ n, clau: k });

  const hasType = valors.has('type');
  const hasTipus = valors.has('tipus');
  if (!hasType && !hasTipus) f.F1.push({ n, clau: 'type|tipus' });
  if (hasType && hasTipus && valors.get('type') !== valors.get('tipus')) {
    f.F1.push({ n, clau: 'type_contra_tipus' });
  }

  const hasStatus = valors.has('status');
  const hasEstat = valors.has('estat');
  if (!hasStatus && !hasEstat) f.F1.push({ n, clau: 'status|estat' });
  if (hasStatus && hasEstat && valors.get('status') !== valors.get('estat')) {
    f.F1.push({ n, clau: 'status_contra_estat' });
  }

  for (const k of new Set(claus)) {
    usPerClau.set(k, (usPerClau.get(k) ?? 0) + 1);
    const v = valors.get(k);
    if (!valsPerClau.has(k)) valsPerClau.set(k, new Set());
    for (const x of Array.isArray(v) ? v : [v]) if (x != null) valsPerClau.get(k).add(String(x));

    const def = PROPS[k];
    if (!def) { if (TANCAT) f.F2.push({ n, clau: k }); continue; }
    if (v === undefined) continue;

    if (teMarcador(v)) {
      if (k === 'tipus' || k === 'estat' || k === 'type' || k === 'status' || !plantilla) {
        f.F8.push({ n, clau: k, valor: String(Array.isArray(v) ? v.find(esMarcador) : v) });
      }
      if (k === 'tipus' || k === 'estat' || k === 'type' || k === 'status') continue;
      if (plantilla) continue;
    }

    if (def.type === 'array') {
      if (!Array.isArray(v)) { f.F7.push({ n, clau: k, detall: 'no és una llista' }); continue; }
      if (def.minItems != null && v.length < def.minItems) f.F7.push({ n, clau: k, detall: `${v.length} < mín ${def.minItems} elements` });
      if (def.maxItems != null && v.length > def.maxItems) f.F7.push({ n, clau: k, detall: `${v.length} > màx ${def.maxItems} elements` });
      if (def.uniqueItems && new Set(v.map(String)).size !== v.length) f.F7.push({ n, clau: k, detall: 'elements repetits' });
      for (const it of v) {
        if (def.items) comprovaEscalar(n, `${k}[]`, it, def.items);
        if (k === 'tags' && VOC && typeof it === 'string' && !VOC.includes(it)) f.F4.push({ n, tag: it });
      }
      continue;
    }
    comprovaEscalar(n, k, v, def);
  }
}

/* F5 — entropia zero. Les obligatòries queden fora: `tipus` o `estat` poden
 * tindre legítimament un únic valor en un corpus jove. visibility és una
 * decisió d’accés explícita, encara que tots els documents siguen privats;
 * core és una bandera operativa: l'absència significa plugin, no un segon
 * valor explícit que calga fabricar. Conserva tots els true i les
 * validacions de tipus; no és entropia editorial redundant. */
for (const [k, vals] of valsPerClau) {
  if (REQ.includes(k) || k === 'visibility' || (k === 'core' && PROPS.core?.type === 'boolean')) continue;
  if (vals.size === 1 && (usPerClau.get(k) ?? 0) >= 2) {
    f.F5.push({ clau: k, usos: usPerClau.get(k), valor: [...vals][0] });
  }
}

/* ──────────────────────────── Veredicte ──────────────────────────── */

let MODIFICATS_VINCULANTS = new Set();
try {
  const diff1 = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n');
  const diff2 = execSync('git diff --name-only', { encoding: 'utf8' }).trim().split('\n');
  for (const f of [...diff1, ...diff2]) if (f) MODIFICATS_VINCULANTS.add(f);
} catch {
  // Ignora si no estem en git
}

const LLEIS = Object.keys(f);
const compte = Object.fromEntries(LLEIS.map((k) => [k, f[k].length]));
const segell = { esquema: S.$id ?? 'sense-id', esquemaSha256: SHA, metode: METODE };

if (BASELINE) {
  fs.mkdirSync(path.dirname(DEUTE), { recursive: true });
  fs.writeFileSync(DEUTE, JSON.stringify({ generat: new Date().toISOString(), ...segell, max: compte }, null, 2) + '\n');
  console.log(`🔒 [FRONTMATTER] Deute segellat a ${DEUTE}`);
  console.log(JSON.stringify(compte));
  console.log('   El deute només pot baixar. Si puja, la porta cau.');
  process.exit(0);
}

let max = Object.fromEntries(LLEIS.map((k) => [k, 0]));
if (ESTRICTE) {
  // sostre zero
} else if (fs.existsSync(DEUTE)) {
  const d = JSON.parse(fs.readFileSync(DEUTE, 'utf8'));
  if (d.esquema !== segell.esquema || d.esquemaSha256 !== segell.esquemaSha256 || d.metode !== segell.metode) {
    mor('El deute segellat és d\'una altra llei.', [
      `deute : ${d.esquema ?? '?'} · ${d.metode ?? '?'} · ${(d.esquemaSha256 ?? '?').slice(0, 12)}`,
      `ara   : ${segell.esquema} · ${segell.metode} · ${SHA.slice(0, 12)}`,
      'Un sostre heretat d\'un esquema mort deixa la porta verda sobre un corpus brut.',
      'Torneu a segellar: node tooling/wiki/tractor-frontmatter.mjs --baseline',
    ]);
  }
  max = { ...max, ...d.max };
}

if (JSON_OUT) {
  console.log(JSON.stringify({ arrel: ARREL, documents: NODES.length, exempts: EXEMPTS.length, destinsExterns: DESTINS_EXTERNS, ...segell, compte, max, fallades: f }, null, 1));
} else {
  const noms = {
    F1: 'OBLIGATÒRIA — falta una clau de `required`',
    F2: 'FORASTERA — clau fora de l\'esquema',
    F3: 'ENUM — valor fora del domini',
    F4: 'VOCABULARI — tag fora del vocabulari tancat',
    F5: 'ENTROPIA — clau amb un únic valor: cerimònia',
    F6: 'DUPLICADA — clau repetida al frontmatter',
    F7: 'FORMAT — tipus, longitud, cardinalitat o YAML il·legible',
    F8: 'MARCADOR — placeholder fora d\'una plantilla declarada',
    F9: 'VINCLES — secció ## Vincles trencada o invàlida',
  };
  console.log('\n📋 TRACTOR FRONTMATTER — esquema canònic');
  console.log('─'.repeat(72));
  console.log(`  ${NODES.length} documents · ${EXEMPTS.length} immutables · ${S.$id ?? 'sense-id'}`);
  console.log(`  ${REQ.length} obligatòries · ${Object.keys(PROPS).length} claus declarades · tancat: ${TANCAT ? 'sí' : 'no'}`);
  if (!VOC) console.log('  F4 dorment: l\'esquema no declara properties.tags.items.enum\n');
  else console.log(`  vocabulari tancat: ${VOC.length} termes\n`);
  for (const llei of LLEIS) {
    const items = f[llei];
    const sostre = max[llei] ?? 0;
    const icona = items.length > sostre ? '❌' : items.length ? '·' : '✅';
    console.log(`${icona} ${llei} · ${noms[llei]} — ${items.length} màx ${sostre}`);
    for (const it of items.slice(0, MOSTRA)) {
      if (llei === 'F5') { console.log(`      ${it.clau} = «${it.valor}» ×${it.usos}`); continue; }
      const cua = [it.clau && `→ ${it.clau}`, it.valor && `= «${it.valor}»`, it.tag && `→ #${it.tag}`, it.detall].filter(Boolean).join(' ');
      console.log(`      ${it.n}  ${cua}`);
    }
    if (items.length > MOSTRA) console.log(`      … i ${items.length - MOSTRA} més`);
  }
  console.log('─'.repeat(72));
}

let tocatAmbDeute = false;
for (const llei of LLEIS) {
  for (const it of f[llei]) {
    if (MODIFICATS_VINCULANTS.has(it.n)) {
      console.error(`\n❌ [FRONTMATTER] Zero tolerància: El fitxer modificat ${it.n} té deute actiu (${llei}: ${it.clau || ''})`);
      tocatAmbDeute = true;
    }
  }
}
/* Onada 7 · El veredicte posa process.exitCode i el procés acaba sol. Amb --json, un
   process.exit() tallava el JSON als 64 KiB quan stdout és una canonada (a macOS és
   asíncron), i self-describe-coherencia en rebia mig. */
const pujat = LLEIS.filter((k) => compte[k] > (max[k] ?? 0));
if (tocatAmbDeute) {
  console.error('   Saneja el frontmatter abans de fer commit d\'aquest fitxer.');
  process.exitCode = 1;
} else if (pujat.length) {
  console.error(`\n❌ [FRONTMATTER] El deute ha pujat: ${pujat.map((k) => `${k} ${max[k] ?? 0}→${compte[k]}`).join(', ')}`);
  console.error('   Arregla-ho: node tooling/wiki/codemod_frontmatter.mjs --escriu');
  process.exitCode = 1;
} else {
  // Amb --json, stdout és només el JSON (el llegixen proves i eines): el veredicte verd va a stderr, com els rojos.
  (JSON_OUT ? console.error : console.log)(`\n✅ [FRONTMATTER] Esquema respectat. Deute no ha pujat.${ESTRICTE ? ' (estricte)' : ''}`);
  process.exitCode = 0;
}
