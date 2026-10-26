/**
 * fonts-vigilancia.mjs — resums de només lectura per a la vigilància del Mapa
 * de la Consola (T12, pla 260930_0040_pla_implementacio_consola).
 *
 * La closca tooling/brain/mapa-consola.mjs els passa al compilador pur
 * src/sections/consola/mapa/construeixMapa.js com a `fonts.torns`,
 * `fonts.escriptori`, `fonts.ledger` i `fonts.estat`. El contracte és fix:
 *
 *   torns      null | [{ id, actor, scope, state, createdAt, expiresAt, rebuts, ambPla }]
 *   escriptori null | { documents: [{ nom, ancorat, ambRebut }], safata, limitSafata: 20 }
 *   ledger     null | { valid, entrades: [{ data: 'AAMMDD', tipus, skill, resum }], fossils, peusHistorics, malformades }
 *   estat      null | { data: <ISO local o null>, bytes }
 *
 * Regla de la casa: el que falta es pinta, no s'inventa. Cada funció torna
 * null si la font no existix i MAI llança: un error de lectura és null, no un
 * verd. Cap funció escriu res ni llig `.sdp-reflex/`.
 *
 * Sense imports relatius (només node:fs, node:path i node:crypto): les dues
 * primitives documentals que calen (`anchored` de tooling/documental/core.mjs
 * i la signatura de tooling/documental/ledger.mjs + tooling/verify-ledger.mjs)
 * es repliquen ací, amb la mateixa semàntica, perquè el mòdul es puga provar
 * des del laboratori i no arrossegue js-yaml ni el descobriment d'arrel.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { exemptDeRebut } from '../documental/core.mjs';

const DIR_TORNS = '.agents/runtime/turns';
const ESCRIPTORI = '_wiki_de_poble/04_escriptori';
const INDEX_ESCRIPTORI = '00_index_escriptori.md';
const SAFATA = '00_bandeja_d_entrada';
/** Límit de la Safata d'Entrada (AGENTS.md §12). */
export const LIMIT_SAFATA = 20;
const LEDGER = '.agents/LEDGER.md';
const ESTAT = '.agents/ESTAT.md';

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const text = (v) => (typeof v === 'string' ? v : null);
const llig = (abs) => { try { return fs.readFileSync(abs, 'utf8'); } catch { return null; } };

/* ══════════════════════ Torns ══════════════════════ */

/**
 * Memòria cau a nivell de mòdul: camí absolut → { mtimeMs, size, ino, torn }.
 * Els torns pesen uns 13 MB i el Mapa es compila a cada petició del
 * middleware: només es torna a parsejar el fitxer que ha canviat. També es
 * guarda el null d'un torn il·legible, perquè no es reparseje a cada volta.
 */
const CAU_TORNS = new Map();

/** Resum intern d'un torn: els camps del contracte i els fitxers dels rebuts. */
function resumeixTorn(abs, nom) {
  let cru;
  try { cru = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch { return null; }
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) return null;
  // `receipts` és un objecte per id (turns.mjs); s'accepta també una llista.
  const rebuts = cru.receipts && typeof cru.receipts === 'object' ? Object.values(cru.receipts) : [];
  return {
    resum: {
      id: text(cru.turn_id) ?? nom.slice(0, -'.json'.length),
      actor: text(cru.actor),
      scope: text(cru.scope),
      state: text(cru.state),
      createdAt: text(cru.createdAt),
      expiresAt: text(cru.expiresAt),
      rebuts: rebuts.length,
      ambPla: cru.plan !== null && cru.plan !== undefined
    },
    fitxers: rebuts.map((r) => r?.file).filter((f) => typeof f === 'string')
  };
}

/** Torns llegits (amb la memòria cau), o null si el directori no hi és. Pot llançar. */
function llegeixTorns(root) {
  const dir = path.join(root, DIR_TORNS);
  let entrades;
  try { entrades = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  const vius = new Set();
  const torns = [];
  for (const e of entrades) {
    // Només registres: ni `.lock` ni els `.tmp` de l'escriptura atòmica.
    if (!e.isFile() || !/^torn_.+\.json$/.test(e.name)) continue;
    const abs = path.join(dir, e.name);
    let st;
    try { st = fs.statSync(abs); } catch { continue; }
    vius.add(abs);
    const previ = CAU_TORNS.get(abs);
    if (previ && previ.mtimeMs === st.mtimeMs && previ.size === st.size && previ.ino === st.ino) {
      if (previ.torn) torns.push(previ.torn);
      continue;
    }
    const torn = resumeixTorn(abs, e.name);
    CAU_TORNS.set(abs, { mtimeMs: st.mtimeMs, size: st.size, ino: st.ino, torn });
    if (torn) torns.push(torn);
  }
  // Un torn esborrat o arxivat ix de la memòria cau d'este directori.
  const prefix = dir + path.sep;
  for (const cami of [...CAU_TORNS.keys()]) if (cami.startsWith(prefix) && !vius.has(cami)) CAU_TORNS.delete(cami);
  // Ordre estable i independent de la configuració regional: data de creació i id.
  const clau = (t) => `${t.resum.createdAt ?? ''}\u0000${t.resum.id}`;
  return torns.sort((a, b) => (clau(a) < clau(b) ? -1 : clau(a) > clau(b) ? 1 : 0));
}

/**
 * Resum de `.agents/runtime/turns/*.json`: només els camps del contracte.
 * `rebuts` és el nombre de receipts; `ambPla`, que `plan` no és nul. Un torn
 * il·legible no s'hi compta (no hi ha res honest que dir-ne). Còpies: el qui
 * les rep no pot tocar la memòria cau.
 */
export function resumTorns(root) {
  try {
    if (typeof root !== 'string') return null;
    const torns = llegeixTorns(root);
    return torns ? torns.map((t) => ({ ...t.resum })) : null;
  } catch { return null; }
}

/* ══════════════════════ Escriptori ══════════════════════ */

/** Text sense blocs de codi ni comentaris HTML (rèplica de `withoutCode`, core.mjs). */
function senseCodi(cos) {
  let tanca = null;
  return cos.replace(/<!--[\s\S]*?-->/g, '').split('\n').filter((linia) => {
    const m = /^ {0,3}(`{3,}|~{3,})/.exec(linia);
    if (m) {
      if (!tanca) tanca = m[1];
      else if (m[1][0] === tanca[0] && m[1].length >= tanca.length) tanca = null;
      return false;
    }
    return !tanca;
  }).join('\n');
}

/**
 * El document apareix com a [[nom]] a l'índex, fora de blocs i de codi en
 * línia? Rèplica exacta de `anchored` (core.mjs): el nom va sense `.md` i un
 * enllaç amb camí (`[[../10_actes/x]]`) no ancora un document solt.
 */
export function ancoratA(index, nom) {
  if (typeof index !== 'string' || typeof nom !== 'string') return false;
  const net = senseCodi(index).replace(/`[^`]*`/g, '');
  const base = path.basename(nom, '.md');
  return [...net.matchAll(/\[\[([^|\]#]+)(?:[|#][^\]]*)?\]\]/g)].some((m) => m[1].trim() === base);
}

/**
 * Documents `.md` solts del primer nivell de l'Escriptori (sense l'índex),
 * amb l'àncora de `00_index_escriptori.md` i el rebut d'algun torn; i els
 * elements de la Safata (entrades no ocultes, siguen fitxers o carpetes: el
 * límit d'AGENTS §12 és d'elements). El nom de la Safata i el de l'índex es
 * busquen sense distingir caixa. `nom` porta l'extensió: la ruta és
 * `_wiki_de_poble/04_escriptori/<nom>`.
 */
export function resumEscriptori(root) {
  try {
    if (typeof root !== 'string') return null;
    const dir = path.join(root, ESCRIPTORI);
    let entrades;
    try { entrades = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    const fitxer = (nom) => entrades.find((e) => e.isFile() && e.name === nom)
      ?? entrades.find((e) => e.isFile() && e.name.toLowerCase() === nom);
    const entradaIndex = fitxer(INDEX_ESCRIPTORI);
    const index = entradaIndex ? llig(path.join(dir, entradaIndex.name)) ?? '' : '';
    const rebuts = new Set((llegeixTorns(root) ?? []).flatMap((t) => t.fitxers));
    const documents = entrades
      .filter((e) => e.isFile() && !e.name.startsWith('.') && /\.md$/i.test(e.name) && e.name.toLowerCase() !== INDEX_ESCRIPTORI)
      .map((e) => e.name).sort()
      .map((nom) => ({ nom, ancorat: ancoratA(index, nom), ambRebut: exemptDeRebut(root, `${ESCRIPTORI}/${nom}`) ? null : rebuts.has(`${ESCRIPTORI}/${nom}`) }));
    const carpetaSafata = entrades.find((e) => e.isDirectory() && e.name === SAFATA)
      ?? entrades.find((e) => e.isDirectory() && e.name.toLowerCase() === SAFATA);
    // Una Safata il·legible no és una Safata buida: l'excepció fa null el resum sencer.
    const safata = carpetaSafata
      ? fs.readdirSync(path.join(dir, carpetaSafata.name)).filter((n) => !n.startsWith('.')).length
      : 0;
    return { documents, safata, limitSafata: LIMIT_SAFATA };
  } catch { return null; }
}

/* ══════════════════════ LEDGER ══════════════════════ */

const MARCA_HASH = /<!-- HASH: [a-f0-9]{64} -->/g;
/** Segell de tooling/documental/ledger.mjs: tolera espais finals. */
const SEGELL_TANCAMENT = /\n\n<!-- HASH: ([a-f0-9]{64}) -->\s*$/;
/** Segell de tooling/verify-ledger.mjs (porta del pas 0): cap caràcter després. */
const SEGELL_PORTA = /\n\n<!-- HASH: ([a-f0-9]{64}) -->$/;
const INICI_ENTRADA = /^\d{6}[ \t]*\|/;
/** On comença una entrada dins d'una línia: data i tres barres (tipus, skill). */
const ENTRADA_EN_LINIA = /(?<!\d)\d{6}[ \t]*\|[^|\n]*\|[^|\n]*\|/g;
const PARTS_ENTRADA = /^(\d{6})[ \t]*\|([^|]*)\|([^|]*)\|([\s\S]*)$/;

/** AAMMDD que existix al calendari (segle XXI). */
function dataValida(aammdd) {
  const [aa, mm, dd] = [0, 2, 4].map((i) => Number(aammdd.slice(i, i + 2)));
  const d = new Date(Date.UTC(2000 + aa, mm - 1, dd));
  return d.getUTCMonth() === mm - 1 && d.getUTCDate() === dd;
}

function entradaCanonica(tros) {
  const m = PARTS_ENTRADA.exec(tros.trim());
  if (!m) return null;
  const [data, tipus, skill, resum] = [m[1], m[2].trim(), m[3].trim(), m[4].trim()];
  if (!dataValida(data) || !tipus || !skill || !resum) return null;
  // `tipus` i `skill` literals: els accents varien (implementació/implementacio).
  return { data, tipus, skill, resum };
}

/**
 * Llig una línia física: hi afig a `entrades` les entrades canòniques que porta
 * i torna si compta com a mal formada (formes 3 i 4, entrada coixa o data
 * impossible). Una línia que no comença com una entrada no és mal formada.
 */
function llegeixLinia(cru, entrades) {
  let resta = cru.replace(/\r$/, '').replace(/^[ \t]*#{1,6}[ \t]+/, '');
  let anomala = false;
  const senseHash = resta.replace(/^(?:[ \t]*<!-- HASH: [a-f0-9]{64} -->)+[ \t]*/, '');
  if (senseHash !== resta) { anomala = true; resta = senseHash; }
  if (!INICI_ENTRADA.test(resta)) return false;
  const inicis = [...resta.matchAll(ENTRADA_EN_LINIA)].map((m) => m.index);
  if (inicis[0] !== 0) return true;
  if (inicis.length > 1) anomala = true;
  for (let i = 0; i < inicis.length; i += 1) {
    const e = entradaCanonica(resta.slice(inicis[i], inicis[i + 1]));
    if (e) entrades.push(e);
    else anomala = true;
  }
  return anomala;
}

/**
 * Analitza el text del LEDGER. Línia canònica: `AAMMDD | tipus | skill | resum`,
 * en les quatre formes vistes (informe T12 §2.1):
 *   1. nua;
 *   2. amb capçalera Markdown davant (`## 260922 | …`);
 *   3. enganxada darrere d'un `<!-- HASH: … -->`;
 *   4. dues entrades en una sola línia.
 * Les formes 3 i 4 es llegixen però la línia compta com a `malformades`, igual
 * que una línia que comença com una entrada i no té els quatre camps o una
 * data impossible (eixa no dóna entrada).
 *
 * `valid`: la signatura final casa amb el sha256 del cos, i ho accepten alhora
 * ledger.mjs (tancament) i verify-ledger.mjs (porta del pas 0). Si només en
 * passa un (un salt de línia després del segell), no és vàlid: fail-closed.
 *
 * Peus (ordre del Mestre, 261006, prompt 261006_0224 T1): l'última marca HASH
 * és el peu final, l'únic que valida. Les altres són peus intercalats, segells
 * d'abans que van quedar dins del cos quan algú va escriure darrere sense
 * reemplaçar-los. No s'esborren (QUI_SOC §3.3). Un peu sense text a la línia
 * és història del Llibre d'Obra, no anomalia; un peu enganxat a text, sí.
 * `peusHistorics`: tots els peus intercalats (el recompte que abans es deia
 *   `fossils`).
 * `fossils`: els peus intercalats que comparteixen la línia amb text i que
 *   `malformades` no ha comptat ja: un segell enganxat a prosa o darrere d'una
 *   entrada. Un segell enganxat davant d'una entrada (forma 3) ja compta una
 *   vegada com a línia mal formada i no es torna a comptar.
 */
export function analitzaLedger(cos) {
  const signat = (re) => {
    const m = re.exec(cos);
    return Boolean(m) && sha256(cos.slice(0, m.index)) === m[1];
  };
  const valid = signat(SEGELL_TANCAMENT) && signat(SEGELL_PORTA);
  const entrades = [];
  let malformades = 0;
  /** Una casella per marca HASH, en ordre: és un segell enganxat que cap línia mal formada no recull? */
  const marques = [];
  for (const cru of cos.split('\n')) {
    const malformada = llegeixLinia(cru, entrades);
    if (malformada) malformades += 1;
    const enLinia = (cru.match(MARCA_HASH) || []).length;
    const enganxada = enLinia > 0 && cru.replace(MARCA_HASH, '').trim() !== '';
    for (let i = 0; i < enLinia; i += 1) marques.push(enganxada && !malformada);
  }
  // L'última marca és el peu final; la resta són peus intercalats.
  const intercalats = marques.slice(0, -1);
  return { valid, entrades, fossils: intercalats.filter(Boolean).length, peusHistorics: intercalats.length, malformades };
}

/** Resum de `.agents/LEDGER.md`, o null si no hi és. */
export function resumLedger(root) {
  try {
    if (typeof root !== 'string') return null;
    const cos = llig(path.join(root, LEDGER));
    return cos === null ? null : analitzaLedger(cos);
  } catch { return null; }
}

/* ══════════════════════ ESTAT ══════════════════════ */

const CAPCALERA_ESTAT = /^##[ \t]+ESTAT_ACTUAL\b(.*)$/m;
const DATA_ISO = /^[\s·|:—–-]*(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?!\d)/;
const DATA_COMPACTA = /^[\s·|:—–-]*(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(?!\d)/;
const p2 = (n) => String(n).padStart(2, '0');

/**
 * Hora de paret local → ISO amb el desplaçament de la màquina
 * (`2026-09-29T21:58:00+02:00`). Null si l'hora no existix (dia impossible o
 * forat del canvi d'hora).
 */
function isoLocal(any, mes, dia, hora, minut) {
  const d = new Date(any, mes - 1, dia, hora, minut, 0, 0);
  if (d.getFullYear() !== any || d.getMonth() !== mes - 1 || d.getDate() !== dia
    || d.getHours() !== hora || d.getMinutes() !== minut) return null;
  const despl = -d.getTimezoneOffset();
  const abs = Math.abs(despl);
  return `${any}-${p2(mes)}-${p2(dia)}T${p2(hora)}:${p2(minut)}:00${despl >= 0 ? '+' : '-'}${p2(Math.floor(abs / 60))}:${p2(abs % 60)}`;
}

/**
 * Data de la PRIMERA capçalera `## ESTAT_ACTUAL` (l'ESTAT creix pel principi),
 * en `AAAA-MM-DD HH:MM` o `AAMMDD_HHMM`, just darrere del separador. Una
 * capçalera sense hora (`2026-09-29 · Codex`) no es pot datar: null, i no es
 * busca una data més avall, que ja no seria el relleu vigent.
 */
export function dataEstat(cos) {
  if (typeof cos !== 'string') return null;
  const capcalera = CAPCALERA_ESTAT.exec(cos);
  if (!capcalera) return null;
  const resta = capcalera[1];
  const iso = DATA_ISO.exec(resta);
  if (iso) return isoLocal(Number(iso[1]), Number(iso[2]), Number(iso[3]), Number(iso[4]), Number(iso[5]));
  const compacta = DATA_COMPACTA.exec(resta);
  if (compacta) return isoLocal(2000 + Number(compacta[1]), Number(compacta[2]), Number(compacta[3]), Number(compacta[4]), Number(compacta[5]));
  return null;
}

/** Data del relleu vigent i pes en bytes de `.agents/ESTAT.md`, o null si no hi és. */
export function resumEstat(root) {
  try {
    if (typeof root !== 'string') return null;
    const abs = path.join(root, ESTAT);
    if (!fs.statSync(abs).isFile()) return null;
    const cru = fs.readFileSync(abs);
    return { data: dataEstat(cru.toString('utf8')), bytes: cru.length };
  } catch { return null; }
}
