#!/usr/bin/env node
/**
 * scripts/supabase/verifica-migracions.mjs — verificador estàtic de les migracions SQL (P0-05 · P0-21).
 *
 * Marató 261101_2143 (torn torn_3d9af83b, carril L13-B3-MIGRACIONS). Especificació: B3-MIGRACIONS.
 * Proves: tests/migracio-verificador.test.mjs.
 *
 *   node scripts/supabase/verifica-migracions.mjs [--arrel <dir>] [--aplicades <fitxer>] [--empremtes <fitxer>]…
 *                                                 [--pla] [--format text|json] [--estricte] [--ajuda]
 *
 * Només llig: supabase/migrations/*.sql, supabase/README.md, supabase/ordre_desplegament.json i, per a una
 * porta de client, el fitxer que nomena el JSON (com a text, mai importat). No es connecta a cap base, no
 * obri cap procés i no escriu cap fitxer: tot ix per l'eixida estàndard. Cap consulta que emet escriu:
 * cada una passa nomesLectura() amb el catàleg de volatilitat de les funcions de les migracions.
 * Eixida: 0 sense errors, 1 amb errors, 2 ús incorrecte.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ESQUEMA_INFORME = 'sdp.verifica-migracions.v1';
export const ESQUEMA_ORDRE = 'sdp.ordre-desplegament.v1';
export const LIMIT_EVIDENCIA = 1024 * 1024;
/** L'arrel on viu el script instal·lat: scripts/supabase/ → dos nivells amunt. */
export const ARREL_DEL_SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const DIR_MIGRACIONS = 'supabase/migrations';
const FITXER_README = 'supabase/README.md';
const FITXER_ORDRE = 'supabase/ordre_desplegament.json';

/* ───────────────────────── 1. Lèxic SQL (lineal) ───────────────────────── */

function esCarId(c) {
  if (c === undefined) return false;
  const k = c.charCodeAt(0);
  return (k >= 48 && k <= 57) || (k >= 65 && k <= 90) || (k >= 97 && k <= 122) || k === 95 || k === 36 || k > 127;
}

const RE_ETIQUETA_DOLAR = /\$(?:[A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$/y;

/* Trossos: codi, literal ('…', E'…'), ident ("…"), cos ($etiqueta$…$etiqueta$) i comentari
   (de línia i de bloc imbricat). Cada caràcter es visita una sola vegada. */
function trossos(sql) {
  const out = [];
  const n = sql.length;
  let i = 0;
  let codi = 0;
  const tanca = (fi) => { if (fi > codi) out.push({ t: 'codi', ini: codi, fi }); };
  while (i < n) {
    const c = sql[i];
    const d = sql[i + 1];
    if (c === '-' && d === '-') {
      tanca(i);
      let j = sql.indexOf('\n', i);
      if (j < 0) j = n;
      out.push({ t: 'comentari', ini: i, fi: j });
      i = j; codi = j; continue;
    }
    if (c === '/' && d === '*') {
      tanca(i);
      let p = 1;
      let j = i + 2;
      while (j < n && p > 0) {
        if (sql[j] === '/' && sql[j + 1] === '*') { p++; j += 2; } else if (sql[j] === '*' && sql[j + 1] === '/') { p--; j += 2; } else j++;
      }
      out.push({ t: 'comentari', ini: i, fi: Math.min(j, n), obert: p > 0 });
      i = Math.min(j, n); codi = i; continue;
    }
    if (c === "'") {
      // E'…' només quan la E és un testimoni solt (no la cua d'un identificador)
      const e = i - 1 >= codi && (sql[i - 1] === 'e' || sql[i - 1] === 'E') && !esCarId(sql[i - 2]);
      const ini = e ? i - 1 : i;
      tanca(ini);
      let j = i + 1;
      let tancat = false;
      while (j < n) {
        const x = sql[j];
        if (e && x === '\\') { j += 2; continue; }
        if (x === "'") { if (sql[j + 1] === "'") { j += 2; continue; } j++; tancat = true; break; }
        j++;
      }
      j = Math.min(j, n);
      out.push({ t: 'literal', ini, fi: j, obert: !tancat });
      i = j; codi = j; continue;
    }
    if (c === '"') {
      tanca(i);
      let j = i + 1;
      let tancat = false;
      while (j < n) {
        if (sql[j] === '"') { if (sql[j + 1] === '"') { j += 2; continue; } j++; tancat = true; break; }
        j++;
      }
      j = Math.min(j, n);
      out.push({ t: 'ident', ini: i, fi: j, obert: !tancat });
      i = j; codi = j; continue;
    }
    if (c === '$' && !esCarId(sql[i - 1])) {
      RE_ETIQUETA_DOLAR.lastIndex = i;
      const m = RE_ETIQUETA_DOLAR.exec(sql);
      if (m) {
        tanca(i);
        const tag = m[0];
        const f = sql.indexOf(tag, i + tag.length);
        const j = f < 0 ? n : f + tag.length;
        out.push({ t: 'cos', ini: i, fi: j, tag, obert: f < 0 });
        i = j; codi = j; continue;
      }
    }
    i++;
  }
  tanca(n);
  return out;
}

function iniciDeLinies(text) {
  const o = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) o.push(i + 1);
  return o;
}

function liniaDe(inicis, pos) {
  let lo = 0;
  let hi = inicis.length - 1;
  while (lo < hi) {
    const mig = (lo + hi + 1) >> 1;
    if (inicis[mig] <= pos) lo = mig; else hi = mig - 1;
  }
  return lo + 1;
}

/** Sentències de nivell zero amb la línia d'inici; els comentaris de fora dels cossos s'eliminen. */
export function sentencies(sql) {
  const ts = trossos(sql);
  const inicis = iniciDeLinies(sql);
  const out = [];
  let parts = [];
  let ini = -1;
  let obert = false;
  const empeny = (senseTancar) => {
    const text = parts.join('').trim();
    if (text) out.push(senseTancar ? { text, linia: liniaDe(inicis, ini), senseTancar: true } : { text, linia: liniaDe(inicis, ini) });
    parts = []; ini = -1;
  };
  for (const t of ts) {
    if (t.obert) obert = true;
    if (t.t === 'comentari') { parts.push(` ${'\n'.repeat(sql.slice(t.ini, t.fi).split('\n').length - 1)}`); continue; }
    if (t.t !== 'codi') { if (ini < 0) ini = t.ini; parts.push(sql.slice(t.ini, t.fi)); continue; }
    const tros = sql.slice(t.ini, t.fi);
    let k = 0;
    while (k < tros.length) {
      const p = tros.indexOf(';', k);
      const fi = p < 0 ? tros.length : p;
      const peca = tros.slice(k, fi);
      if (ini < 0) { const m = /\S/.exec(peca); if (m) ini = t.ini + k + m.index; }
      parts.push(peca);
      if (p >= 0) { empeny(false); k = p + 1; } else k = fi;
    }
  }
  if (parts.join('').trim()) empeny(true);
  else if (obert) out.push({ text: '', linia: inicis.length, senseTancar: true });
  return out;
}

/* Text sense literals ni comentaris. cossos: 'fora' els lleva, 'dins' n'analitza el codi.
   ids: 'conserva' deixa els identificadors entre cometes, 'q' els canvia per "q" i 'desfes' lleva les
   cometes dels segurs ("public" és public: Postgres els tracta igual) i canvia la resta per "q". */
const salts = (s) => '\n'.repeat(s.split('\n').length - 1);
/** Identificador que no necessita cometes (i que es pot emetre sense escapar). */
const ID_SEGUR = /^[a-z_][a-z0-9_$]*$/;

function identBlanquejat(cru, ids) {
  if (ids === 'q') return `"q"${salts(cru)}`;
  if (ids !== 'desfes') return cru;
  const dins = cru.slice(1, cru.endsWith('"') && cru.length > 1 ? -1 : cru.length).replace(/""/g, '"');
  // amb espais: «from"vault".x» no pot quedar enganxat com a «fromvault.x»
  return ID_SEGUR.test(dins) ? ` ${dins} ` : ` "q"${salts(cru)} `;
}

function blanqueja(text, { cossos = 'fora', ids = 'conserva' } = {}) {
  let s = '';
  for (const t of trossos(text)) {
    const cru = text.slice(t.ini, t.fi);
    // cada substitució conserva els salts de línia: així els usos es poden situar a la seua línia
    if (t.t === 'codi') s += cru;
    else if (t.t === 'comentari') s += ` ${salts(cru)}`;
    else if (t.t === 'literal') s += `''${salts(cru)}`;
    else if (t.t === 'ident') s += identBlanquejat(cru, ids);
    else if (cossos === 'dins') s += ` ${blanqueja(cru.slice(t.tag.length, t.obert ? cru.length : cru.length - t.tag.length), { cossos, ids })} `;
    else s += ` $$ ${salts(cru)}`;
  }
  return s;
}

/** Codi de nivell superior en una línia: sense cossos, literals ni comentaris, espais simples. */
function plana(text) {
  return blanqueja(text, { cossos: 'fora' }).replace(/\s+/g, ' ').trim();
}

/* ───────────────────────── 2. Noms de fitxer i noms qualificats ───────────────────────── */

const RE_NOM_FITXER = /^(\d{10}|\d{14})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;
const RE_VERSIO = /^(?:\d{10}|\d{14})$/;

/** Keep the ledger ID untouched; compare both timestamp conventions on one clock. */
export function clauOrdreVersio(versio) {
  if (typeof versio !== 'string' || !RE_VERSIO.test(versio)) throw new TypeError('versio_migracio_invalida');
  return versio.length === 10 ? `20${versio}00` : versio;
}

export function comparaVersions(a, b) {
  const ka = clauOrdreVersio(a), kb = clauOrdreVersio(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

export function versioDeFitxer(fitxer) {
  return /^(\d{10}|\d{14})_/.exec(fitxer)?.[1] ?? null;
}

/** Legacy aammddhhmm or Supabase YYYYMMDDhhmmss, with real calendar fields. */
export function validaNom(fitxer, ara = new Date()) {
  const errors = [];
  const avisos = [];
  const m = RE_NOM_FITXER.exec(fitxer);
  const versio = m ? m[1] : versioDeFitxer(fitxer);
  if (!m) errors.push({ codi: 'E-NOM', missatge: `nom fora de la convenció aammddhhmm_nom.sql o YYYYMMDDhhmmss_nom.sql en minúscules: ${fitxer}` });
  if (versio) {
    const clau = clauOrdreVersio(versio);
    const any = Number(clau.slice(0, 4));
    const [mm, dd, hh, mi, ss] = [4, 6, 8, 10, 12].map((k) => Number(clau.slice(k, k + 2)));
    const traspas = any % 4 === 0 && (any % 100 !== 0 || any % 400 === 0);
    const dies = [31, traspas ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (any < 1 || mm < 1 || mm > 12 || dd < 1 || dd > dies[mm - 1] || hh > 23 || mi > 59 || ss > 59) errors.push({ codi: 'E-DATA', missatge: `la versió ${versio} no és una data real` });
    else {
      const data = new Date(0);
      data.setUTCFullYear(any, mm - 1, dd); data.setUTCHours(hh, mi, ss, 0);
      if (data.getTime() > ara.getTime() + 86400000) avisos.push({ codi: 'A-VERSIO-FUTURA', missatge: `la versió ${versio} és posterior a demà` });
    }
  }
  return { versio, errors, avisos };
}

const ID = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)`;
const QN = String.raw`${ID}(?:\s*\.\s*${ID})?`;
const RE_PARTEIX = new RegExp(`^(${ID})(?:\\s*\\.\\s*(${ID}))?$`);

function nomId(s) {
  return s.startsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s.toLowerCase();
}

function parteixNom(txt) {
  const m = RE_PARTEIX.exec(String(txt).trim());
  if (!m) return null;
  return m[2] ? { esquema: nomId(m[1]), nom: nomId(m[2]) } : { esquema: 'public', nom: nomId(m[1]) };
}

function qn(txt) {
  const p = parteixNom(txt);
  return p ? `${p.esquema}.${p.nom}` : String(txt).trim().toLowerCase();
}

/** Parteix per comes de nivell zero (parèntesis equilibrats). */
function perComes(s) {
  const out = [];
  let prof = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') prof++;
    else if (ch === ')') prof--;
    if (ch === ',' && prof === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** Posició del parèntesi que tanca el que obri a `ini` (o -1). */
function tancaParentesi(s, ini) {
  let prof = 0;
  for (let i = ini; i < s.length; i++) {
    if (s[i] === '(') prof++;
    else if (s[i] === ')') { prof--; if (prof === 0) return i; }
  }
  return -1;
}

/* ───────────────────────── 3. Signatures de funció ───────────────────────── */

const TIPUS_NATIUS = new Map(Object.entries({
  int: 'integer', int4: 'integer', integer: 'integer', int8: 'bigint', bigint: 'bigint', int2: 'smallint', smallint: 'smallint',
  bool: 'boolean', boolean: 'boolean', text: 'text', uuid: 'uuid', jsonb: 'jsonb', json: 'json', date: 'date', bytea: 'bytea',
  inet: 'inet', interval: 'interval', numeric: 'numeric', decimal: 'numeric', real: 'real', float4: 'real',
  float8: 'double precision', 'double precision': 'double precision', varchar: 'character varying',
  'character varying': 'character varying', char: 'character', character: 'character',
  timestamptz: 'timestamp with time zone', 'timestamp with time zone': 'timestamp with time zone',
  timestamp: 'timestamp without time zone', 'timestamp without time zone': 'timestamp without time zone',
  time: 'time without time zone', 'time without time zone': 'time without time zone',
  timetz: 'time with time zone', 'time with time zone': 'time with time zone', oid: 'oid', name: 'name', regclass: 'regclass'
}));
const TIPUS_MULTIPARAULA = /^(double|character|timestamp|time|bit|national)$/i;

function tipusArgument(cru) {
  let a = cru.replace(/\s*(?:\bdefault\b|=)[\s\S]*$/i, '').trim();
  if (!a) return null;
  const mm = /^(in|out|inout|variadic)\s+/i.exec(a);
  const mode = mm ? mm[1].toLowerCase() : 'in';
  if (mm) a = a.slice(mm[0].length);
  if (mode === 'out') return null;
  let toks = a.split(/\s+/);
  if (toks.length > 1 && !TIPUS_MULTIPARAULA.test(toks[0])) toks = toks.slice(1);
  let t = toks.join(' ').toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s*\[\s*\d*\s*\]/g, '[]').trim();
  const arr = t.endsWith('[]');
  const base = arr ? t.slice(0, -2).trim() : t;
  t = (TIPUS_NATIUS.get(base) ?? base) + (arr ? '[]' : '');
  return { tipus: t, natiu: TIPUS_NATIUS.has(base) };
}

/* Signatura a partir de «nom(arguments)» en text pla: { clau, esquema, nom, tipus, natius }. */
function signaturaDe(nomCru, argsCru) {
  const p = parteixNom(nomCru);
  if (!p) return null;
  const tipus = [];
  let natius = true;
  for (const a of perComes(argsCru)) {
    const r = tipusArgument(a);
    if (!r) continue;
    tipus.push(r.tipus);
    if (!r.natiu) natius = false;
  }
  return { clau: `${p.esquema}.${p.nom}(${tipus.join(',')})`, esquema: p.esquema, nom: p.nom, tipus, natius };
}

const RE_CREA_FUNCIO = new RegExp(`^create (or replace )?(function|procedure) (${QN})\\s*\\(`, 'i');

function analitzaCreaFuncio(t) {
  const m = RE_CREA_FUNCIO.exec(t);
  if (!m) return null;
  const obri = m.index + m[0].length - 1;
  const tanc = tancaParentesi(t, obri);
  if (tanc < 0) return null;
  const sig = signaturaDe(m[3], t.slice(obri + 1, tanc));
  if (!sig) return null;
  const resta = t.slice(tanc + 1);
  const vol = m[2].toLowerCase() === 'procedure' ? 'volatile' : (/\bimmutable\b/i.exec(resta)?.[0] ?? /\bstable\b/i.exec(resta)?.[0] ?? 'volatile').toLowerCase();
  const llenguatge = (/\blanguage\s+'?([a-z0-9_]+)'?/i.exec(resta)?.[1] ?? '').toLowerCase();
  return { ...sig, orReplace: Boolean(m[1]), volatilitat: vol, llenguatge };
}

/** 'esquema.nom(tipus,…)' d'un `create [or replace] function|procedure`, o null. */
export function signaturaFuncio(textCreate) {
  return analitzaCreaFuncio(plana(textCreate))?.clau ?? null;
}

/* Llista «f(a), g(b)» d'un grant/revoke/drop/alter → [{ clau | null, nom }]. */
function llistaFuncions(s) {
  const out = [];
  for (const peca of perComes(s)) {
    const t = peca.trim();
    const obri = t.indexOf('(');
    if (obri < 0) { const p = parteixNom(t.split(' ')[0]); if (p) out.push({ clau: null, nom: `${p.esquema}.${p.nom}` }); continue; }
    const tanc = tancaParentesi(t, obri);
    const sig = signaturaDe(t.slice(0, obri).trim(), t.slice(obri + 1, tanc < 0 ? t.length : tanc));
    if (sig) out.push({ clau: sig.clau, nom: `${sig.esquema}.${sig.nom}` });
  }
  return out;
}

/* ───────────────────────── 4. Capçalera, dependències i consultes ───────────────────────── */

/** Línies inicials de comentari (o buides): [{ n, text }]. */
export function capcalera(sql) {
  const out = [];
  const ls = sql.split('\n');
  for (let k = 0; k < ls.length; k++) {
    const l = ls[k];
    if (/^\s*--/.test(l)) out.push({ n: k + 1, text: l.replace(/^\s*--\s?/, '') });
    else if (!l.trim()) out.push({ n: k + 1, text: '' });
    else break;
  }
  return out;
}

const RE_DEP = /\b(?:dep[eé]n de|requerix|prerequisits?|despr[eé]s de)\b/i;

/** Dependències declarades a la capçalera: [{ versio, linia, frase }]. */
export function dependenciesDeclarades(cap, versio) {
  const vistes = new Map();
  for (let k = 0; k < cap.length; k++) {
    const m = RE_DEP.exec(cap[k].text);
    if (!m) continue;
    let frase = cap[k].text.slice(m.index);
    for (let j = k + 1; j < cap.length && j < k + 6 && !/\.\s*$/.test(frase.trim()); j++) frase += ` ${cap[j].text}`;
    for (const v of frase.matchAll(/\b(\d{14}|\d{10})(?!\d)|\b(\d{6})_(\d{4})(?!\d)/g)) {
      const ver = v[1] ?? `${v[2]}${v[3]}`;
      if (ver !== versio && !vistes.has(ver)) vistes.set(ver, { versio: ver, linia: cap[k].n, frase: frase.trim().slice(0, 160) });
    }
  }
  return [...vistes.values()];
}

const RE_ETQ_RECEPTA = /dues sessions|base de prova/i;
const RE_ETQ_PREVIA = /^\s*(?:abans\b|consulta de lectura pr[eè]via)|abans d['’]aplicar-la/i;
const RE_ETQ_POST = /^\s*(?:despr[eé]s\b|verificaci[oó] posterior)|despr[eé]s d['’]aplicar-la/i;

/** Posició del primer ';' de codi (fora de literals), o -1. */
function primerPuntIComa(sql) {
  for (const t of trossos(sql)) {
    if (t.t !== 'codi') continue;
    const p = sql.slice(t.ini, t.fi).indexOf(';');
    if (p >= 0) return t.ini + p;
  }
  return -1;
}

/** Consultes de la capçalera: [{ linia, etiqueta: previa|posterior|recepta|sense_etiqueta, sql, senseTancar? }]. */
export function consultesDeCapcalera(cap) {
  const out = [];
  let etiqueta = 'sense_etiqueta';
  let cur = null;
  for (const { n, text } of cap) {
    if (cur) {
      cur.parts.push(text.trim());
      const sql = cur.parts.join('\n');
      const fi = primerPuntIComa(sql);
      if (fi >= 0) { out.push({ linia: cur.linia, etiqueta: cur.etiqueta, sql: sql.slice(0, fi + 1) }); cur = null; } else if (cur.parts.length >= 15) { out.push({ linia: cur.linia, etiqueta: cur.etiqueta, sql, senseTancar: true }); cur = null; }
      continue;
    }
    if (RE_ETQ_RECEPTA.test(text)) etiqueta = 'recepta';
    else if (RE_ETQ_PREVIA.test(text) && /lectura|consult|\(|:/i.test(text)) etiqueta = 'previa';
    else if (RE_ETQ_POST.test(text)) etiqueta = 'posterior';
    const t = text.replace(/^\s*(?:\d+[.)]|\(\d+\)|·|-|\*)\s+/, '');
    if (!/^\s*(?:select|with)\b/.test(t)) continue; // minúscula: la prosa diu «SELECT» com a nom
    const sql = t.trim();
    const fi = primerPuntIComa(sql);
    if (fi >= 0) out.push({ linia: n, etiqueta, sql: sql.slice(0, fi + 1) });
    else cur = { linia: n, etiqueta, parts: [sql] };
  }
  if (cur) out.push({ linia: cur.linia, etiqueta: cur.etiqueta, sql: cur.parts.join('\n'), senseTancar: true });
  return out;
}

/* ───────────────────────── 5. Catàleg de volatilitat i filtre de només lectura ───────────────────────── */

/** Map('esquema.nom' → 'immutable'|'stable'|'volatile') amb l'última definició de cada signatura. */
export function catalegFuncions(analisis) {
  const perSig = new Map();
  for (const a of analisis) {
    for (const s of a.sentencies) {
      const t = plana(s.text);
      const cf = analitzaCreaFuncio(t);
      if (cf) { perSig.set(cf.clau, { nom: `${cf.esquema}.${cf.nom}`, vol: cf.volatilitat }); continue; }
      let m = /^alter (?:function|procedure|routine) (.*)$/i.exec(t);
      if (m) {
        const vol = /\b(immutable|stable|volatile)\b/i.exec(m[1])?.[1]?.toLowerCase();
        if (!vol) continue;
        const [f] = llistaFuncions(m[1].replace(/\)\s.*$/, ')'));
        if (!f) continue;
        for (const [k, v] of perSig) if ((f.clau && k === f.clau) || (!f.clau && v.nom === f.nom)) v.vol = vol;
        continue;
      }
      m = /^drop (?:function|procedure|routine) (?:if exists )?(.*?)(?: cascade| restrict)?$/i.exec(t);
      if (m) for (const f of llistaFuncions(m[1])) for (const [k, v] of [...perSig]) if ((f.clau && k === f.clau) || (!f.clau && v.nom === f.nom)) perSig.delete(k);
    }
  }
  const cat = new Map();
  const rang = { immutable: 0, stable: 1, volatile: 2 };
  for (const { nom, vol } of perSig.values()) if (!cat.has(nom) || rang[vol] > rang[cat.get(nom)]) cat.set(nom, vol);
  return cat;
}

const RE_PARAULES_ESCRIPTURA = /\b(insert|update|delete|merge|truncate|drop|alter|create|grant|revoke|copy|call|do|vacuum|reindex|cluster|lock|refresh|comment|security|into|listen|notify|execute|prepare)\b/i;
const RE_FOR_BLOQUEIG = /\bfor\s+(?:update|share|no\s+key\s+update|key\s+share)\b/i;
const RE_FUNCIONS_PROHIBIDES = /\b(set_config|nextval|setval|pg_(?:try_)?advisory_\w+|pg_notify|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|pg_switch_wal|pg_promote|pg_create_\w+|pg_drop_\w+|pg_replication_\w+|pg_stat_reset\w*|pg_read_\w+|pg_file_\w+|pg_ls_\w+|pg_stat_file|pg_sleep\w*|pg_logical_\w+|pg_backup_\w+|pg_start_backup|pg_stop_backup|pg_import_\w+|pg_wal_replay_\w+|pg_log_backend_memory_contexts|lo_\w+|dblink\w*|http\w*)\s*\(/i;
// secrets: ni tan sols una lectura (les crides d'altres esquemes, com cron.schedule, cauen al bucle de crides)
const RE_ESQUEMA_PROHIBIT = /\b(vault|pgsodium)\s*\.\s*(?:[a-z_]|")/i;
const AUTH_ADMESES = new Set(['uid', 'role', 'jwt', 'email']);

/* C921-01 · Un nom que no consta al catàleg no és prova de lectura.
   Llista tancada de primitives de consulta que el pla necessita. Cada alta
   necessita revisió i cas positiu; pg_catalog no és una exempció general.
   No és un parser ni una barrera d'autorització de PostgreSQL: el rol que
   executa el pla també ha de tindre els permisos mínims. */
const PRIMITIVES_DE_LECTURA = new Set([
  'array_agg', 'array_length', 'array_to_string', 'bool_and', 'bool_or', 'btrim',
  'cardinality', 'char_length', 'coalesce', 'concat', 'concat_ws', 'count',
  'current_database', 'current_schema', 'current_schemas', 'current_setting',
  'format', 'has_column_privilege', 'has_function_privilege', 'has_schema_privilege',
  'has_table_privilege', 'json_agg', 'json_build_object', 'json_object_agg',
  'jsonb_agg', 'jsonb_build_object', 'jsonb_object_agg', 'jsonb_object_keys',
  'jsonb_typeof', 'length', 'lower', 'max', 'min', 'now', 'nullif', 'octet_length',
  'oidvectortypes', 'pg_get_constraintdef', 'pg_get_expr', 'pg_get_functiondef',
  'pg_get_function_identity_arguments', 'pg_get_triggerdef', 'pg_get_userbyid',
  'pg_typeof', 'position', 'quote_ident', 'quote_literal', 'regexp_replace',
  'replace', 'string_agg', 'string_to_array', 'substring', 'sum', 'to_regclass',
  'to_regnamespace', 'to_regprocedure', 'to_regtype', 'trim', 'unnest', 'upper'
]);
// Construccions SQL seguides de parèntesi, no funcions executables.
const CONSTRUCCIONS_SQL = new Set([
  'all', 'and', 'any', 'as', 'case', 'distinct', 'else', 'except', 'exists',
  'filter', 'from', 'in', 'intersect', 'join', 'lateral', 'not', 'on', 'or',
  'over', 'select', 'then', 'union', 'values', 'when', 'where', 'with'
]);
/* G1-B-doctr-03 · Crida qualificada esquema.nom(, la mateixa per a nomesLectura i cridaDesconeguda.
   La frontera esquerra (cap caràcter d'identificador al davant) fa que cada identificador es provi
   només des del seu començament: sense ella, el motor tornava a provar des de cada lletra d'un
   identificador llarg i el cost era quadràtic. Les xifres o els «$» del començament es consumixen
   fora del grup, com els saltava abans el motor («9pg_catalog.f(» continua dient pg_catalog), i un
   «.» al davant no para res: bd.esquema.f( continua veient esquema.f( (C921-01). */
const RE_CRIDA_QUALIFICADA = /(?<![\w$])[0-9$]*([A-Za-z_][A-Za-z0-9_$]*)\s*\.\s*([A-Za-z_][A-Za-z0-9_$]*)\s*\(/g;

function cridaDesconeguda(codi, cataleg) {
  for (const c of codi.matchAll(RE_CRIDA_QUALIFICADA)) {
    const esq = c[1].toLowerCase(), nom = c[2].toLowerCase();
    if ((esq === 'pg_catalog' || esq === 'information_schema') && !PRIMITIVES_DE_LECTURA.has(nom)) return `${esq}.${nom}`;
  }
  for (const c of codi.matchAll(/(?<![.\w$"])([A-Za-z_][A-Za-z0-9_$]*)\s*\(/g)) {
    const nom = c[1].toLowerCase();
    if (CONSTRUCCIONS_SQL.has(nom)) continue;
    // Lectures conegudes abans de mirar el context: una consulta amb moltes
    // agregacions no torna a recórrer tot el prefix per cada crida.
    if (PRIMITIVES_DE_LECTURA.has(nom)) continue;
    const davant = codi.slice(Math.max(0, c.index - 32), c.index);
    // AS alias(columna,...) i WITH nom(columna,...) AS (...): declaracions.
    // Els noms de columna són només identificadors: cap crida queda amagada.
    if (/\bas\s*$/i.test(davant) && /^[A-Za-z_][A-Za-z0-9_$]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_$]*)*\s*\)/.test(codi.slice(c.index + c[0].length))) continue;
    if (/(?:\bwith(?:\s+recursive)?|,)\s*$/i.test(davant) && /^[A-Za-z_][A-Za-z0-9_$]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_$]*)*\s*\)\s+as\s*\(/i.test(codi.slice(c.index + c[0].length))) continue;
    // Una sobrecàrrega VOLATILE ja s'ha rebutjat abans, també si tapa un builtin.
    const conegudes = [...cataleg].filter(([k]) => k === `public.${nom}` || k === `private.${nom}`);
    if (conegudes.length && conegudes.every(([, vol]) => vol === 'stable' || vol === 'immutable')) continue;
    return nom;
  }
  return null;
}

/** null si `sql` és una sola consulta de només lectura; si no, el motiu. El catàleg és obligatori. */
export function nomesLectura(sql, cataleg) {
  if (!(cataleg instanceof Map)) throw new TypeError('nomesLectura necessita el catàleg de volatilitat (Map)');
  const font = /;\s*$/.test(String(sql).trim()) ? String(sql) : `${sql}\n;`;
  const st = sentencies(font);
  if (st.length !== 1) return st.length ? 'més d\'una sentència' : 'consulta buida';
  if (st[0].senseTancar) return 'sentència sense tancar';
  // paraules clau: sobre el text amb els identificadors entre cometes neutralitzats ("delete" és un nom)
  const paraules = blanqueja(st[0].text, { cossos: 'fora', ids: 'q' }).replace(/\s+/g, ' ').trim();
  if (!/^(?:select|with)\b/i.test(paraules)) return 'no comença per SELECT ni WITH';
  let m = RE_PARAULES_ESCRIPTURA.exec(paraules);
  if (m) return `paraula d'escriptura: ${m[1].toLowerCase()}`;
  if (RE_FOR_BLOQUEIG.test(paraules)) return 'bloqueig de files (FOR UPDATE/SHARE)';
  // crides i esquemes: sense cometes als segurs, perquè "public".f() és public.f() (ARB-B3-01)
  const codi = blanqueja(st[0].text, { cossos: 'fora', ids: 'desfes' }).replace(/\s+/g, ' ').trim();
  m = RE_FUNCIONS_PROHIBIDES.exec(codi);
  if (m) return `funció amb efecte: ${m[1].toLowerCase()}`;
  m = RE_ESQUEMA_PROHIBIT.exec(codi);
  if (m) return `esquema no admès: ${m[1].toLowerCase()}`;
  if (/"q"\s*\(/.test(codi)) return 'crida a un identificador entre cometes';
  if (/"q"\s*\./.test(codi)) return 'qualificador entre cometes no admès';
  for (const c of codi.matchAll(RE_CRIDA_QUALIFICADA)) {
    const esq = c[1].toLowerCase();
    const nom = c[2].toLowerCase();
    if (esq === 'pg_catalog' || esq === 'information_schema') continue;
    if (esq === 'auth') { if (AUTH_ADMESES.has(nom)) continue; return `funció d'auth no admesa: auth.${nom}`; }
    if (esq !== 'public' && esq !== 'private') return `esquema no admès: ${esq}`;
    const vol = cataleg.get(`${esq}.${nom}`);
    if (!vol) return `funció desconeguda: ${esq}.${nom}`;
    if (vol === 'volatile') return `crida volatile (pot escriure): ${esq}.${nom}`;
  }
  for (const c of codi.matchAll(/(?<![.\w$"])([A-Za-z_][A-Za-z0-9_$]*)\s*\(/g)) {
    const nom = c[1].toLowerCase();
    for (const [k, vol] of cataleg) if (vol === 'volatile' && k.slice(k.indexOf('.') + 1) === nom) return `crida volatile (pot escriure): ${k}`;
  }
  const desconeguda = cridaDesconeguda(codi, cataleg);
  if (desconeguda) return `funció sense acreditació de lectura: ${desconeguda}`;
  // un cos entre dòlars no s'analitza: mai és una consulta de lectura emissible
  if (codi.includes('$$')) return 'cos entre dòlars';
  return null;
}

/* ───────────────────────── 6. Idempotència i transacció ───────────────────────── */

/** begin/commit de nivell superior: { begin, commit, problemes, trams: [[i, j]] } (índexs de sentència). */
export function analitzaTransaccio(stmts) {
  const problemes = [];
  const trams = [];
  let obert = -1;
  let begin = null;
  let commit = null;
  stmts.forEach((s, idx) => {
    const t = plana(s.text).toLowerCase();
    if (/^begin(?: work| transaction)?(?: isolation level [a-z ]+)?$/.test(t) || /^start transaction\b/.test(t)) {
      if (obert >= 0) problemes.push({ codi: 'E-TRANSACCIO', linia: s.linia, missatge: 'begin dins d\'una transacció ja oberta' });
      else { obert = idx; if (begin === null) begin = s.linia; }
      return;
    }
    if (/^(?:commit|end)(?: work| transaction)?$/.test(t)) {
      if (obert < 0) problemes.push({ codi: 'E-TRANSACCIO', linia: s.linia, missatge: `${t.split(' ')[0]} sense begin` });
      else { trams.push([obert, idx]); obert = -1; commit = s.linia; }
      return;
    }
    if (/^(?:rollback|abort)\b/.test(t)) problemes.push({ codi: 'E-TRANSACCIO', linia: s.linia, missatge: 'rollback de nivell superior: la migració es desfaria' });
  });
  if (obert >= 0) problemes.push({ codi: 'E-TRANSACCIO', linia: stmts[obert].linia, missatge: 'begin sense commit' });
  const dins = (idx) => trams.some(([a, b]) => idx > a && idx < b);
  stmts.forEach((s, idx) => {
    if (!dins(idx)) return;
    const t = plana(s.text).toLowerCase();
    if (/^(?:create (?:unique )?index concurrently|drop index concurrently|reindex\b.*\bconcurrently|vacuum\b|alter system\b|create database\b|drop database\b|create tablespace\b)/.test(t)) {
      problemes.push({ codi: 'E-NO-TRANSACCIONABLE', linia: s.linia, missatge: `no es pot executar dins d'una transacció: ${t.slice(0, 60)}` });
    }
  });
  return { begin, commit, problemes, trams };
}

const RE_DROP_POL_TRG = new RegExp(`^drop (policy|trigger) if exists (${ID}) on (${QN})`, 'i');
const RE_DROP_ALTRES = /^drop (index|view|materialized view|type|table|function|procedure)(?: concurrently)? if exists (.+)$/i;
const RE_CREA_INDEX = new RegExp(`^create (?:unique )?index (concurrently )?(if not exists )?(?:(${QN}) )?on `, 'i');
const RE_CREA_TAULA = new RegExp(`^create (?:(?:global|local) )?(?:(?:temp|temporary|unlogged) )?table (if not exists )?(${QN})`, 'i');
const RE_CREA_VISTA = new RegExp(`^create (or replace )?(?:(?:temp|temporary) )?(?:recursive )?view (${QN})`, 'i');
const RE_CREA_VISTA_MAT = new RegExp(`^create materialized view (if not exists )?(${QN})`, 'i');
const RE_CREA_POLITICA = new RegExp(`^create policy (${ID}) on (${QN})`, 'i');
const RE_CREA_TRIGGER = new RegExp(`^create (or replace )?(constraint )?trigger (${ID}) `, 'i');
const RE_CREA_TIPUS = new RegExp(`^create type (${QN})`, 'i');
const RE_ALTER_TAULA = new RegExp(`^alter table (?:if exists )?(?:only )?(${QN}) (.*)$`, 'i');
const RE_ON_TAULA = new RegExp(`\\bon (?:only )?(${QN})`, 'i');

function taulaDelTrigger(t, despres) {
  const m = RE_ON_TAULA.exec(t.slice(despres));
  return m ? qn(m[1]) : null;
}

/** Troballes d'idempotència i veredicte (repetible | no_repetible_falla_neta | risc_parcial). */
export function analitzaIdempotencia(stmts) {
  const troballes = [];
  const drops = { policy: new Set(), trigger: new Set(), index: new Set(), function: new Set(), view: new Set(), constraint: new Set(), type: new Set(), table: new Set() };
  const doDrop = { constraint: false, policy: false, trigger: false, function: false };
  stmts.forEach((s, idx) => {
    const t = plana(s.text);
    const af = (regla, detall, nivell = 'avis') => troballes.push({ linia: s.linia, regla, detall, nivell, index: idx });
    const rebaix = (tipus) => (doDrop[tipus] ? 'indeterminat' : 'avis');
    let m;
    if (/^do\b/i.test(t)) {
      if (/\bexecute\b/i.test(s.text)) for (const k of Object.keys(doDrop)) if (new RegExp(`\\bdrop\\s+${k}\\b`, 'i').test(s.text)) doDrop[k] = true;
      return;
    }
    if ((m = RE_DROP_POL_TRG.exec(t))) { drops[m[1].toLowerCase()].add(`${nomId(m[2])}@${qn(m[3])}`); return; }
    if ((m = RE_DROP_ALTRES.exec(t))) {
      const tipus = m[1].toLowerCase().replace('materialized view', 'view').replace('procedure', 'function');
      for (const p of perComes(m[2].replace(/\b(?:cascade|restrict)\b/gi, ''))) {
        const nom = qn(p.replace(/\(.*$/, ''));
        drops[tipus].add(tipus === 'index' ? nom.slice(nom.indexOf('.') + 1) : nom);
      }
      return;
    }
    if (/^drop /i.test(t)) { if (!/^drop \w+(?: \w+)?(?: concurrently)? if exists\b/i.test(t)) af('DROP_SENSE_IF_EXISTS', t.slice(0, 80)); return; }
    if ((m = RE_CREA_INDEX.exec(t))) {
      const nom = m[3] ? qn(m[3]) : null;
      if (!m[2] && !(nom && drops.index.has(nom.slice(nom.indexOf('.') + 1)))) af('INDEX_SENSE_IF_NOT_EXISTS', nom ?? 'índex sense nom');
      return;
    }
    if ((m = RE_CREA_TAULA.exec(t))) { if (!m[1] && !drops.table.has(qn(m[2]))) af('TAULA_SENSE_IF_NOT_EXISTS', qn(m[2])); return; }
    if ((m = /^create (schema|extension|sequence) (if not exists )?(\S+)/i.exec(t))) { if (!m[2]) af(`${m[1].toUpperCase()}_SENSE_IF_NOT_EXISTS`, m[3]); return; }
    const cf = analitzaCreaFuncio(t);
    if (cf) { if (!cf.orReplace && !drops.function.has(`${cf.esquema}.${cf.nom}`)) af('FUNCIO_SENSE_OR_REPLACE', cf.clau, rebaix('function')); return; }
    if ((m = RE_CREA_VISTA.exec(t))) { if (!m[1] && !drops.view.has(qn(m[2]))) af('VISTA_SENSE_OR_REPLACE', qn(m[2])); return; }
    if ((m = RE_CREA_VISTA_MAT.exec(t))) { if (!m[1] && !drops.view.has(qn(m[2]))) af('VISTA_SENSE_OR_REPLACE', qn(m[2])); return; }
    if ((m = RE_CREA_POLITICA.exec(t))) {
      const clau = `${nomId(m[1])}@${qn(m[2])}`;
      if (!drops.policy.has(clau)) af('POLITICA_SENSE_DROP_PREVI', `${m[1]} on ${qn(m[2])}`, rebaix('policy'));
      return;
    }
    if ((m = RE_CREA_TRIGGER.exec(t))) {
      const taula = taulaDelTrigger(t, m[0].length);
      if (!m[1] && !drops.trigger.has(`${nomId(m[3])}@${taula}`)) af('TRIGGER_SENSE_DROP_PREVI', `${m[3]} on ${taula}`, rebaix('trigger'));
      return;
    }
    if ((m = RE_CREA_TIPUS.exec(t))) { if (!drops.type.has(qn(m[1]))) af('TIPUS_SENSE_GUARDA', qn(m[1])); return; }
    if ((m = RE_ALTER_TAULA.exec(t))) {
      const taula = qn(m[1]);
      for (const accioCrua of perComes(m[2])) {
        const a = accioCrua.trim();
        let k;
        if (/^add (?:column )?if not exists\b/i.test(a)) continue;
        if ((k = new RegExp(`^add column (${ID})`, 'i').exec(a))) { af('COLUMNA_SENSE_IF_NOT_EXISTS', `${taula}.${nomId(k[1])}`); continue; }
        if ((k = new RegExp(`^add constraint (${ID})`, 'i').exec(a))) {
          if (!drops.constraint.has(`${nomId(k[1])}@${taula}`)) af('CONSTRAINT_SENSE_DROP_PREVI', `${nomId(k[1])} on ${taula}`, rebaix('constraint'));
          continue;
        }
        if (/^add (?:primary key|unique|check|foreign key|exclude)\b/i.test(a)) { af('CONSTRAINT_SENSE_DROP_PREVI', `restricció sense nom a ${taula}`, rebaix('constraint')); continue; }
        if ((k = new RegExp(`^add (?!column\\b|constraint\\b|primary\\b|unique\\b|check\\b|foreign\\b|exclude\\b|if\\b)(${ID})`, 'i').exec(a))) { af('COLUMNA_SENSE_IF_NOT_EXISTS', `${taula}.${nomId(k[1])}`); continue; }
        if ((k = new RegExp(`^drop constraint if exists (${ID})`, 'i').exec(a))) { drops.constraint.add(`${nomId(k[1])}@${taula}`); continue; }
        if (/^drop (?:column )?if exists\b/i.test(a)) continue;
        if (/^drop (?:column |constraint )?(?!if exists)/i.test(a) && !/^drop (?:default|not null|expression|identity)\b/i.test(a)) { af('DROP_SENSE_IF_EXISTS', `${taula}: ${a.slice(0, 60)}`); continue; }
        if (/^rename\b/i.test(a)) af('RENAME', `${taula}: ${a.slice(0, 60)}`);
      }
      return;
    }
    if (/^insert into\b/i.test(t)) { if (!/\bon conflict\b/i.test(t) && !/\bwhere not exists\b/i.test(t)) af('INSERT_SENSE_ON_CONFLICT', t.slice(0, 70)); return; }
    if (/^(?:update|delete from|truncate)\b/i.test(t)) af('MUTACIO_DE_DADES', t.slice(0, 70), 'info');
  });
  const tr = analitzaTransaccio(stmts);
  const dins = (idx) => tr.trams.some(([a, b]) => idx > a && idx < b);
  const greus = troballes.filter((x) => x.nivell === 'avis');
  const veredicte = !greus.length ? 'repetible' : greus.every((x) => dins(x.index)) ? 'no_repetible_falla_neta' : 'risc_parcial';
  return { troballes: troballes.map((x) => ({ linia: x.linia, regla: x.regla, detall: x.detall, nivell: x.nivell })), veredicte };
}

/* ───────────────────────── 7. Objectes de cada migració ───────────────────────── */

/** { crea, defineix, esborra, altera, usa } d'una migració (vegeu §2.6 i §2.10 de l'especificació). */
export function objectesDeMigracio(stmts) {
  const crea = [];
  const defineix = new Set();
  const esborra = [];
  const altera = [];
  const usa = [];
  stmts.forEach((s, idx) => {
    const t = plana(s.text);
    let m;
    const cf = analitzaCreaFuncio(t);
    if (cf) {
      crea.push({ tipus: 'funcio', clau: `funcio:${cf.clau}`, nom: `${cf.esquema}.${cf.nom}`, sig: cf, linia: s.linia, idx });
      defineix.add(`f:${cf.clau}`);
    } else if ((m = /^alter (?:function|procedure|routine) (.*)$/i.exec(t))) {
      const [f] = llistaFuncions(m[1].replace(/\)\s.*$/, ')'));
      if (f) { altera.push({ nom: f.nom, clau: f.clau, rename: /\brename to\b/i.test(m[1]), idx }); if (f.clau) defineix.add(`f:${f.clau}`); }
    } else if ((m = /^(?:grant|revoke) .*? on (?:function|procedure|routine) (.*)$/i.exec(t))) {
      const llista = m[1].replace(/\s(?:to|from)\s[\s\S]*$/i, '');
      for (const f of llistaFuncions(llista)) if (f.clau) defineix.add(`f:${f.clau}`);
    } else if ((m = /^drop (?:function|procedure|routine) (?:if exists )?(.*?)(?: cascade| restrict)?$/i.exec(t))) {
      for (const f of llistaFuncions(m[1])) esborra.push({ clau: f.clau ? `funcio:${f.clau}` : `funcio-nom:${f.nom}`, nom: f.nom, idx });
    } else if ((m = RE_CREA_TAULA.exec(t))) {
      const nom = qn(m[2]);
      crea.push({ tipus: 'taula', clau: `taula:${nom}`, nom, linia: s.linia, idx });
    } else if ((m = RE_CREA_VISTA.exec(t)) || (m = RE_CREA_VISTA_MAT.exec(t))) {
      const nom = qn(m[2]);
      crea.push({ tipus: 'vista', clau: `vista:${nom}`, nom, linia: s.linia, idx });
      defineix.add(`v:${nom}`);
    } else if ((m = RE_CREA_INDEX.exec(t))) {
      if (m[3]) {
        const taula = taulaDelTrigger(t, m[0].length - 3);
        const esq = taula ? taula.slice(0, taula.indexOf('.')) : 'public';
        const nom = `${esq}.${parteixNom(m[3])?.nom ?? m[3]}`;
        crea.push({ tipus: 'index', clau: `index:${nom}`, nom, taula, linia: s.linia, idx });
      }
    } else if ((m = RE_CREA_POLITICA.exec(t))) {
      const nom = nomId(m[1]);
      const taula = qn(m[2]);
      crea.push({ tipus: 'politica', clau: `politica:${nom}@${taula}`, nom, taula, linia: s.linia, idx });
      defineix.add(`p:${nom}@${taula}`);
    } else if ((m = RE_CREA_TRIGGER.exec(t))) {
      const nom = nomId(m[3]);
      const taula = taulaDelTrigger(t, m[0].length);
      crea.push({ tipus: 'disparador', clau: `disparador:${nom}@${taula}`, nom, taula, linia: s.linia, idx });
      defineix.add(`t:${nom}@${taula}`);
    } else if ((m = /^create (sequence|type) (?:if not exists )?(\S+)/i.exec(t))) {
      const nom = qn(m[2]);
      crea.push({ tipus: m[1].toLowerCase() === 'type' ? 'tipus' : 'sequencia', clau: `${m[1].toLowerCase()}:${nom}`, nom, linia: s.linia, idx });
    } else if ((m = RE_DROP_POL_TRG.exec(t)) || (m = new RegExp(`^drop (policy|trigger) (${ID}) on (${QN})`, 'i').exec(t))) {
      const tipus = m[1].toLowerCase() === 'policy' ? 'politica' : 'disparador';
      esborra.push({ clau: `${tipus}:${nomId(m[2])}@${qn(m[3])}`, idx });
    } else if ((m = /^drop (table|view|materialized view|index|type|sequence)(?: concurrently)? (?:if exists )?(.+)$/i.exec(t))) {
      const tipus = { table: 'taula', view: 'vista', 'materialized view': 'vista', index: 'index', type: 'type', sequence: 'sequence' }[m[1].toLowerCase()];
      for (const p of perComes(m[2].replace(/\b(?:cascade|restrict)\b/gi, ''))) esborra.push({ clau: `${tipus}:${qn(p)}`, idx });
    } else if ((m = RE_ALTER_TAULA.exec(t))) {
      const taula = qn(m[1]);
      for (const accioCrua of perComes(m[2])) {
        const a = accioCrua.trim();
        let k;
        if ((k = new RegExp(`^add (?:column )?(?:if not exists )?(?!constraint\\b|primary\\b|unique\\b|check\\b|foreign\\b|exclude\\b)(${ID})`, 'i').exec(a))) {
          crea.push({ tipus: 'columna', clau: `columna:${taula}.${nomId(k[1])}`, nom: nomId(k[1]), taula, linia: s.linia, idx });
        } else if ((k = new RegExp(`^drop (?:column )?(?:if exists )?(?!constraint\\b|default\\b|not\\b|expression\\b|identity\\b)(${ID})`, 'i').exec(a))) {
          esborra.push({ clau: `columna:${taula}.${nomId(k[1])}`, idx });
        } else if ((k = new RegExp(`^rename column (${ID})`, 'i').exec(a)) || (k = new RegExp(`^rename (?!to\\b|constraint\\b)(${ID}) to`, 'i').exec(a))) {
          esborra.push({ clau: `columna:${taula}.${nomId(k[1])}`, idx });
        } else if (/^rename to\b/i.test(a)) {
          esborra.push({ clau: `taula:${taula}`, idx });
        }
      }
    }
    // usos d'objectes qualificats, també dins dels cossos (sense literals). Un drop no necessita res,
    // i l'objecte que la sentència mateixa (re)definix no és cap ús: create or replace no el requerix.
    if (/^drop /i.test(t)) return;
    const propi = cf ? `${cf.esquema}.${cf.nom}` : (() => { const k = RE_CREA_TAULA.exec(t) ?? RE_CREA_VISTA.exec(t) ?? RE_CREA_VISTA_MAT.exec(t); return k ? qn(k[2]) : null; })();
    const codi = blanqueja(s.text, { cossos: 'dins' });
    const baix = s.text.toLowerCase();
    let context = 'nivell_superior';
    if (cf) context = cf.llenguatge === 'sql' ? 'cos_sql' : 'cos_plpgsql';
    else if (/^do\b/i.test(t)) context = 'cos_plpgsql';
    for (const u of codi.matchAll(/(?<![\w$."])(public|private|storage)\s*\.\s*("(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)/gi)) {
      const nom = `${u[1].toLowerCase()}.${nomId(u[2])}`;
      if (nom === propi) continue;
      const guardat = baix.includes(`to_regclass('${nom}')`) || baix.includes(`to_regprocedure('${nom}`) || baix.includes(`to_regproc('${nom}`);
      usa.push({ nom, linia: s.linia + (codi.slice(0, u.index).match(/\n/g)?.length ?? 0), context, guardat });
    }
  });
  return { crea, defineix: [...defineix], esborra, altera, usa };
}

/* ───────────────────────── 8. README ───────────────────────── */

function spansDeCodi(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const p = text.indexOf('`', i);
    if (p < 0) break;
    let q = p;
    while (text[q] === '`') q++;
    const run = q - p;
    const tanc = '`'.repeat(run);
    let k = q;
    let trobat = -1;
    while (k < text.length) {
      const r = text.indexOf(tanc, k);
      if (r < 0) break;
      let e = r;
      while (text[e] === '`') e++;
      if (e - r === run) { trobat = r; break; }
      k = e;
    }
    if (trobat < 0) { i = q; continue; }
    out.push({ ini: p, contingut: text.slice(q, trobat) });
    i = trobat + run;
  }
  return out;
}

const RE_MARCA_README = /dues sessions|base de prova|\bAbans\b|abans d['’]aplicar-la|ABANS D['’]APLICAR|\bDesprés\b|DESPRÉS D['’]APLICAR|[Vv]erificació posterior/g;

function etiquetaDeMarca(marca) {
  if (/sessions|prova/i.test(marca)) return 'recepta';
  return /abans/i.test(marca) ? 'previa' : 'posterior';
}

/** Lectura del README sense reescriure res (§2.5). */
export function llegixReadme(text) {
  const linies = String(text).split('\n');
  const bullets = [];
  const taula = [];
  const blocsSql = [];
  const cadenes = [];
  const sondaVersions = new Map();
  const consultesPerFitxer = new Map();
  let fiVinyetes = linies.indexOf('- `seed.sql`');
  if (fiVinyetes < 0) fiVinyetes = linies.length;
  for (let k = 0; k < fiVinyetes; k++) {
    const m = /^- `migrations\/([^`\n]+\.sql)`$/.exec(linies[k]);
    if (!m) continue;
    const cos = [];
    let j = k + 1;
    while (j < fiVinyetes && (linies[j] === '' || /^\s/.test(linies[j]))) { cos.push(linies[j]); j++; }
    const textVinyeta = cos.join('\n');
    bullets.push({ fitxer: m[1], linia: k + 1, text: textVinyeta });
    const marques = [...textVinyeta.matchAll(RE_MARCA_README)].map((x) => ({ i: x.index, etiqueta: etiquetaDeMarca(x[0]) }));
    const consultes = [];
    for (const sp of spansDeCodi(textVinyeta)) {
      const sql = sp.contingut.replace(/\s+/g, ' ').trim();
      if (!/^(?:select|with)\b/i.test(sql) || !sql.endsWith(';')) continue;
      const marca = marques.filter((x) => x.i < sp.ini).pop();
      const linia = k + 2 + (textVinyeta.slice(0, sp.ini).match(/\n/g)?.length ?? 0);
      if (!consultes.some((c) => c.sql === sql)) consultes.push({ linia, etiqueta: marca?.etiqueta ?? 'sense_etiqueta', sql });
    }
    if (consultes.length) consultesPerFitxer.set(m[1], consultes);
  }
  let blocSql = null;
  for (let k = 0; k < linies.length; k++) {
    const l = linies[k];
    if (blocSql) {
      if (l.trim() === '```') { blocsSql.push(blocSql); blocSql = null; } else blocSql.sql += `${blocSql.sql ? '\n' : ''}${l}`;
      continue;
    }
    if (l.trim() === '```sql') { blocSql = { linia: k + 2, sql: '' }; continue; }
    const t = /^\| (\d+) \| `(\d{10}|\d{14})` \| `([^`]+\.sql)` \| ([^|]+) \| ([^|]+) \|$/.exec(l);
    if (t) taula.push({ ordre: Number(t[1]), versio: t[2], fitxer: t[3], estat: t[4].trim(), linia: k + 1 });
  }
  for (const b of blocsSql) {
    for (const a of b.sql.matchAll(/\bAS\s+(te_[a-z0-9_]+)/gi)) {
      const v = /_(\d{10}|\d{14})$/.exec(a[1]);
      if (v) sondaVersions.set(v[1], { alias: a[1], linia: b.linia });
    }
  }
  const iniNota = linies.findIndex((l) => /^### Nota d['’]auditoria/.test(l));
  if (iniNota >= 0) {
    let fiNota = linies.findIndex((l, k) => k > iniNota && /^#{2,3} /.test(l));
    if (fiNota < 0) fiNota = linies.length;
    let anterior = null;
    for (let k = iniNota + 1; k < fiNota; k++) {
      const l = linies[k];
      for (const p of l.matchAll(/`(\d{10}|\d{14})(?:_[a-z0-9_]+\.sql)?`\s*→\s*(?=`(\d{10}|\d{14})(?:_[a-z0-9_]+\.sql)?`)/g)) cadenes.push({ abans: p[1], despres: p[2], linia: k + 1, origen: 'fletxa' });
      const item = /^\s*(\d+)\.\s+(`(\d{10}|\d{14})_[a-z0-9_]+\.sql`)?/.exec(l);
      if (item) {
        const n = Number(item[1]);
        if (anterior && anterior.n === n - 1 && anterior.versio && item[3]) cadenes.push({ abans: anterior.versio, despres: item[3], linia: k + 1, origen: 'items' });
        anterior = { n, versio: item[3] ?? null };
      }
    }
  }
  return { bullets, taula, sondaVersions, cadenes, blocsSql, consultesPerFitxer };
}

function estatDeclarat(estat) {
  const t = estat.replace(/\*/g, '').trim();
  if (/^Aplicada\b/.test(t)) return 'declarada_aplicada';
  if (/\bNO aplicada\b/.test(t)) return 'declarada_no_aplicada';
  if (/no acreditat/i.test(t)) return 'desconegut';
  return null;
}

/* ───────────────────────── 9. JSON d'ordre ───────────────────────── */

const CLAUS_ORDRE = { arrel: ['esquema', 'nota', 'restriccions', 'portes', 'fantasmes', 'reaplicacio'], restriccio: ['abans', 'despres', 'just', 'motiu', 'font'], porta: ['id', 'tipus', 'descripcio', 'despres', 'abans', 'comprovacio', 'font'], comprovacio: ['fitxer', 'constant', 'valor'], fantasma: ['versio', 'motiu'], reaplicacio: ['si', 'llavors', 'font'] };

function clausAdmeses(obj, admeses, on) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${on}: ha de ser un objecte`);
  for (const k of Object.keys(obj)) if (!admeses.includes(k)) throw new Error(`${on}: clau desconeguda «${k}»`);
}

function versioValida(v, on, versions) {
  if (typeof v !== 'string' || !RE_VERSIO.test(v)) throw new Error(`${on}: versió no vàlida «${v}»`);
  if (versions && !versions.has(v)) throw new Error(`${on}: la versió ${v} no té fitxer a supabase/migrations`);
}

/** Valida el JSON d'ordre (§2.7); llança Error amb el motiu. Amb `versions`, també l'existència. */
export function llegixOrdre(json, versions = null) {
  const o = typeof json === 'string' ? JSON.parse(json) : json;
  clausAdmeses(o, CLAUS_ORDRE.arrel, 'ordre_desplegament');
  if (o.esquema !== ESQUEMA_ORDRE) throw new Error(`ordre_desplegament: esquema ha de ser ${ESQUEMA_ORDRE}`);
  const llista = (x, on) => { if (x === undefined) return []; if (!Array.isArray(x)) throw new Error(`${on}: ha de ser una llista`); return x; };
  const restriccions = llista(o.restriccions, 'restriccions').map((r, i) => {
    clausAdmeses(r, CLAUS_ORDRE.restriccio, `restriccions[${i}]`);
    versioValida(r.abans, `restriccions[${i}].abans`, versions);
    versioValida(r.despres, `restriccions[${i}].despres`, versions);
    if (r.abans === r.despres) throw new Error(`restriccions[${i}]: abans i despres iguals`);
    if (r.just !== undefined && typeof r.just !== 'boolean') throw new Error(`restriccions[${i}].just: ha de ser booleà`);
    return { abans: r.abans, despres: r.despres, just: r.just === true, motiu: String(r.motiu ?? ''), font: String(r.font ?? '') };
  });
  const ids = new Set();
  const portes = llista(o.portes, 'portes').map((p, i) => {
    clausAdmeses(p, CLAUS_ORDRE.porta, `portes[${i}]`);
    if (typeof p.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(p.id)) throw new Error(`portes[${i}].id: identificador no vàlid`);
    if (ids.has(p.id)) throw new Error(`portes[${i}].id: repetit «${p.id}»`);
    ids.add(p.id);
    if (!['client', 'funcio'].includes(p.tipus)) throw new Error(`portes[${i}].tipus: client o funcio`);
    const despres = llista(p.despres, `portes[${i}].despres`);
    const abans = llista(p.abans, `portes[${i}].abans`);
    despres.forEach((v, k) => versioValida(v, `portes[${i}].despres[${k}]`, versions));
    abans.forEach((v, k) => versioValida(v, `portes[${i}].abans[${k}]`, versions));
    let comprovacio = null;
    if (p.comprovacio !== undefined) {
      clausAdmeses(p.comprovacio, CLAUS_ORDRE.comprovacio, `portes[${i}].comprovacio`);
      const { fitxer, constant, valor } = p.comprovacio;
      if (typeof fitxer !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(fitxer) || fitxer.startsWith('/') || fitxer.split('/').includes('..')) throw new Error(`portes[${i}].comprovacio.fitxer: camí relatiu dins de l'arrel`);
      if (typeof constant !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(constant)) throw new Error(`portes[${i}].comprovacio.constant: ha de ser un identificador JS`);
      if (typeof valor !== 'string' || /['\n\r\\]/.test(valor)) throw new Error(`portes[${i}].comprovacio.valor: cadena sense cometes ni salts`);
      comprovacio = { fitxer, constant, valor };
    }
    return { id: p.id, tipus: p.tipus, descripcio: String(p.descripcio ?? ''), despres, abans, comprovacio, font: String(p.font ?? '') };
  });
  const fantasmes = llista(o.fantasmes, 'fantasmes').map((f, i) => {
    clausAdmeses(f, CLAUS_ORDRE.fantasma, `fantasmes[${i}]`);
    versioValida(f.versio, `fantasmes[${i}].versio`, null);
    if (versions && versions.has(f.versio)) throw new Error(`fantasmes[${i}]: la versió ${f.versio} sí que té fitxer`);
    return { versio: f.versio, motiu: String(f.motiu ?? '') };
  });
  const reaplicacio = llista(o.reaplicacio, 'reaplicacio').map((r, i) => {
    clausAdmeses(r, CLAUS_ORDRE.reaplicacio, `reaplicacio[${i}]`);
    versioValida(r.si, `reaplicacio[${i}].si`, versions);
    const llavors = llista(r.llavors, `reaplicacio[${i}].llavors`);
    llavors.forEach((v, k) => versioValida(v, `reaplicacio[${i}].llavors[${k}]`, versions));
    return { si: r.si, llavors, font: String(r.font ?? '') };
  });
  return { restriccions, portes, fantasmes, reaplicacio };
}

/* ───────────────────────── 10. Ordre topològic ───────────────────────── */

function comparaClau(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

/** Kahn amb prioritat per versió: { ordre: [{ tipus, id }], inversions, errors }. */
export function ordena({ versions, dependencies = new Map(), restriccions = [], portes = [] }) {
  const errors = [];
  const nodes = new Map();
  const afig = (id, clau) => nodes.set(id, { id, clau, entra: new Set(), surt: new Set() });
  for (const v of versions) afig(`m:${v}`, [clauOrdreVersio(v), 1, v]);
  for (const p of portes) {
    const clau = p.abans.length ? [clauOrdreVersio([...p.abans].sort(comparaVersions)[0]), 0, p.id] : p.despres.length ? [clauOrdreVersio([...p.despres].sort(comparaVersions).pop()), 2, p.id] : ['99999999999999', 3, p.id];
    afig(`p:${p.id}`, clau);
  }
  const aresta = (a, b) => { if (!nodes.has(a) || !nodes.has(b) || a === b) return; nodes.get(a).surt.add(b); nodes.get(b).entra.add(a); };
  for (const [v, deps] of dependencies) for (const d of deps) aresta(`m:${d}`, `m:${v}`);
  const just = new Map();
  for (const r of restriccions) { aresta(`m:${r.abans}`, `m:${r.despres}`); if (r.just) just.set(`m:${r.abans}`, `m:${r.despres}`); }
  for (const p of portes) { for (const v of p.despres) aresta(`m:${v}`, `p:${p.id}`); for (const v of p.abans) aresta(`p:${p.id}`, `m:${v}`); }
  const pendents = new Map([...nodes.values()].map((n) => [n.id, n.entra.size]));
  const llestos = [...nodes.values()].filter((n) => n.entra.size === 0);
  const ordre = [];
  const fet = new Set();
  const emet = (n) => {
    ordre.push(n.id); fet.add(n.id);
    for (const s of n.surt) { pendents.set(s, pendents.get(s) - 1); if (pendents.get(s) === 0) llestos.push(nodes.get(s)); }
  };
  while (llestos.length) {
    llestos.sort((a, b) => comparaClau(a.clau, b.clau));
    const n = llestos.shift();
    emet(n);
    const seguent = just.get(n.id);
    if (seguent && !fet.has(seguent)) {
      const k = llestos.findIndex((x) => x.id === seguent);
      if (k < 0) errors.push({ codi: 'E-ENGANXADA', missatge: `${seguent.slice(2)} ha d'anar just després de ${n.id.slice(2)}, però encara té dependències pendents` });
      else emet(llestos.splice(k, 1)[0]);
    }
  }
  if (ordre.length < nodes.size) {
    const resta = new Set([...nodes.keys()].filter((id) => !fet.has(id)));
    const cami = [];
    let cur = [...resta][0];
    const vist = new Map();
    while (cur && !vist.has(cur)) { vist.set(cur, cami.length); cami.push(cur); cur = [...nodes.get(cur).entra].find((x) => resta.has(x)); }
    const cicle = cur ? cami.slice(vist.get(cur)).reverse() : cami;
    errors.push({ codi: 'E-CICLE', missatge: `cicle d'ordre: ${[...cicle, cicle[0]].map((x) => x.slice(2)).join(' → ')}` });
    for (const id of [...resta].sort()) ordre.push(id);
  }
  const ordreObj = ordre.map((id) => ({ tipus: id.startsWith('m:') ? 'migracio' : 'porta', id: id.slice(2) }));
  const migs = ordreObj.filter((x) => x.tipus === 'migracio').map((x) => x.id);
  const inversions = [];
  // Report filename/CLI order separately: mixed timestamps sort differently
  // lexically even when our chronological plan has no dependency inversion.
  for (let i = 0; i < migs.length; i++) for (let j = i + 1; j < migs.length; j++) if (migs[i] > migs[j]) inversions.push({ abans: migs[i], despres: migs[j] });
  return { ordre: ordreObj, inversions, errors };
}

/* ───────────────────────── 11. Evidència remota ───────────────────────── */

function campsCsv(linia, sep) {
  if (sep === '|') return linia.split('|').map((x) => x.trim());
  const out = [];
  let cur = '';
  let cometes = false;
  for (let i = 0; i < linia.length; i++) {
    const c = linia[i];
    if (cometes) {
      if (c === '"') { if (linia[i + 1] === '"') { cur += '"'; i++; } else cometes = false; } else cur += c;
    } else if (c === '"') cometes = true;
    else if (c === sep) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function taulaDeText(text) {
  const linies = String(text).split(/\r?\n/).filter((l) => l.trim() && !/^[\s|+-]+$/.test(l));
  if (!linies.length) return { capcalera: [], files: [] };
  const sep = linies[0].includes('\t') ? '\t' : linies[0].includes('|') ? '|' : linies[0].includes(';') && !linies[0].includes(',') ? ';' : ',';
  const capcalera = campsCsv(linies[0], sep).map((x) => x.toLowerCase());
  const files = linies.slice(1).filter((l) => !/^\(\d+ (?:rows?|files?)\)$/.test(l.trim())).map((l) => campsCsv(l, sep));
  return { capcalera, files };
}

function comprovaMida(text, on) {
  if (typeof text !== 'string') throw new TypeError(`${on}: cal el contingut com a text`);
  if (Buffer.byteLength(text) > LIMIT_EVIDENCIA) throw new Error(`${on}: més d'1 MB`);
}

/** Versions del registre (JSON o text/CSV/graella): { versions, format, buit }. */
export function llegixAplicades(text) {
  comprovaMida(text, '--aplicades');
  const t = text.trim();
  let versions = [];
  let format = 'text';
  if (t.startsWith('[')) {
    format = 'json';
    const dades = JSON.parse(t);
    if (!Array.isArray(dades)) throw new Error('--aplicades: el JSON ha de ser una llista');
    for (const x of dades) {
      const v = typeof x === 'object' && x !== null ? x.version ?? x.versio : x;
      const s = String(v ?? '');
      if (!/^\d{10}(?:\d{4})?$/.test(s)) throw new Error(`--aplicades: versió no vàlida «${s.slice(0, 40)}»`);
      versions.push(s);
    }
  } else {
    for (const l of t.split(/\r?\n/)) {
      const m = /(?:^|[^\d])(\d{14}|\d{10})(?!\d)/.exec(l);
      if (m) versions.push(m[1]);
    }
  }
  versions = [...new Set(versions)].sort(comparaVersions);
  return { versions, format, buit: versions.length === 0 };
}

/** Resultat de les empremtes i/o una fila de la sonda del README: { perVersio, sonda }. */
export function llegixEmpremtes(text) {
  comprovaMida(text, '--empremtes');
  const perVersio = new Map();
  const sonda = new Map();
  const bool = (x) => { const s = String(x).trim().toLowerCase(); if (['t', 'true', 'cert', '1'].includes(s)) return true; if (['f', 'false', 'fals', '0'].includes(s)) return false; return null; };
  const filaEmpremta = (o) => {
    const v = String(o.versio ?? '');
    if (!RE_VERSIO.test(v)) throw new Error(`--empremtes: versió no vàlida «${v.slice(0, 40)}»`);
    const esperats = Number(o.esperats);
    const presents = Number(o.presents);
    if (!Number.isInteger(esperats) || !Number.isInteger(presents) || esperats < 0 || presents < 0 || presents > esperats) throw new Error(`--empremtes: recomptes no vàlids per a ${v}`);
    perVersio.set(v, { esperats, presents, absents: String(o.absents ?? '') });
  };
  const t = text.trim();
  if (t.startsWith('[') || t.startsWith('{')) {
    const dades = JSON.parse(t);
    for (const o of Array.isArray(dades) ? dades : [dades]) {
      if (!o || typeof o !== 'object') throw new Error('--empremtes: cada fila ha de ser un objecte');
      if ('versio' in o) filaEmpremta(o);
      for (const [k, v] of Object.entries(o)) if (/^te_[a-z0-9_]+_(?:\d{10}|\d{14})$/.test(k)) sonda.set(k, bool(v));
    }
    return { perVersio, sonda };
  }
  const { capcalera, files } = taulaDeText(t);
  const iv = capcalera.indexOf('versio');
  if (iv >= 0) {
    const ie = capcalera.indexOf('esperats');
    const ip = capcalera.indexOf('presents');
    const ia = capcalera.indexOf('absents');
    for (const f of files) filaEmpremta({ versio: f[iv], esperats: f[ie], presents: f[ip], absents: ia >= 0 ? f[ia] : '' });
  }
  capcalera.forEach((c, k) => { if (/^te_[a-z0-9_]+_(?:\d{10}|\d{14})$/.test(c) && files[0]) sonda.set(c, bool(files[0][k])); });
  if (iv < 0 && !sonda.size) throw new Error('--empremtes: cal la columna versio o columnes te_*_<versió>');
  return { perVersio, sonda };
}

/* ───────────────────────── 12. Empremtes automàtiques (N2) ───────────────────────── */

const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const PRIORITAT_EMPREMTA = { taula: 0, vista: 0, columna: 1, funcio: 2, disparador: 3, politica: 4, index: 5 };

function exprEmpremta(o) {
  const parts = (n) => { const k = n.indexOf('.'); return [n.slice(0, k), n.slice(k + 1)]; };
  if (o.tipus === 'taula' || o.tipus === 'vista' || o.tipus === 'index') {
    const [e, n] = parts(o.nom);
    if (!ID_SEGUR.test(e) || !ID_SEGUR.test(n)) return null;
    return `to_regclass(${lit(o.nom)}) is not null`;
  }
  if (o.tipus === 'columna') {
    const [e, n] = parts(o.taula);
    if (!ID_SEGUR.test(e) || !ID_SEGUR.test(n) || !ID_SEGUR.test(o.nom)) return null;
    return `exists (select 1 from pg_catalog.pg_attribute a where a.attrelid = to_regclass(${lit(o.taula)}) and a.attname = ${lit(o.nom)} and not a.attisdropped)`;
  }
  if (o.tipus === 'funcio') {
    const s = o.sig;
    if (!ID_SEGUR.test(s.esquema) || !ID_SEGUR.test(s.nom)) return null;
    const args = s.natius ? `pg_catalog.oidvectortypes(p.proargtypes) = ${lit(s.tipus.join(', '))}` : `p.pronargs = ${s.tipus.length}`;
    return `exists (select 1 from pg_catalog.pg_proc p where p.pronamespace = (select n.oid from pg_catalog.pg_namespace n where n.nspname = ${lit(s.esquema)}) and p.proname = ${lit(s.nom)} and ${args})`;
  }
  if (o.tipus === 'disparador') {
    const [e, n] = parts(o.taula ?? '');
    if (!ID_SEGUR.test(e) || !ID_SEGUR.test(n) || !ID_SEGUR.test(o.nom)) return null;
    return `exists (select 1 from pg_catalog.pg_trigger t where t.tgrelid = to_regclass(${lit(o.taula)}) and t.tgname = ${lit(o.nom)} and not t.tgisinternal)`;
  }
  if (o.tipus === 'politica') {
    const [e, n] = parts(o.taula ?? '');
    if (!ID_SEGUR.test(e) || !ID_SEGUR.test(n) || /[\u0000-\u001f]/.test(o.nom)) return null;
    return `exists (select 1 from pg_catalog.pg_policies p where p.schemaname = ${lit(e)} and p.tablename = ${lit(n)} and p.policyname = ${lit(o.nom)})`;
  }
  return null;
}

/** Consulta única d'empremtes: { sql, perVersio: Map(versio → [{ tipus, objecte, expr }]) }. */
export function consultaEmpremtes(analisis) {
  const posicio = new Map(analisis.map((a, i) => [a.versio, i]));
  const creadors = new Map();
  const esborrats = new Map();
  const alterades = new Map();
  for (const a of analisis) {
    for (const c of a.objectes.crea) { if (!creadors.has(c.clau)) creadors.set(c.clau, []); creadors.get(c.clau).push({ versio: a.versio, idx: c.idx, obj: c }); }
    for (const e of a.objectes.esborra) { if (!esborrats.has(e.clau)) esborrats.set(e.clau, []); esborrats.get(e.clau).push({ versio: a.versio, idx: e.idx }); }
    for (const al of a.objectes.altera) { if (!alterades.has(al.nom)) alterades.set(al.nom, []); alterades.get(al.nom).push({ versio: a.versio, rename: al.rename }); }
  }
  const despres = (ev, ref) => posicio.get(ev.versio) > posicio.get(ref.versio) || (ev.versio === ref.versio && ev.idx > ref.idx);
  const esborratDespres = (clau, ref) => (esborrats.get(clau) ?? []).some((ev) => despres(ev, ref));
  const perVersio = new Map();
  for (const [clau, llista] of creadors) {
    const versions = new Set(llista.map((x) => x.versio));
    if (versions.size !== 1) continue; // el redefinix una altra migració: no és distintiu
    const ref = llista[0];
    const o = ref.obj;
    if (esborratDespres(clau, ref)) continue;
    if (o.tipus === 'funcio' && (esborratDespres(`funcio-nom:${o.nom}`, ref) || (alterades.get(o.nom) ?? []).some((x) => x.versio !== ref.versio || x.rename))) continue;
    if (o.taula && esborratDespres(`taula:${o.taula}`, ref)) continue;
    const expr = exprEmpremta(o);
    if (!expr) continue;
    const desc = o.tipus === 'funcio' ? `funcio ${o.sig.clau}` : o.tipus === 'columna' ? `columna ${o.taula}.${o.nom}` : o.taula && o.tipus !== 'index' ? `${o.tipus} ${o.nom}@${o.taula}` : `${o.tipus} ${o.nom}`;
    if (!perVersio.has(ref.versio)) perVersio.set(ref.versio, []);
    perVersio.get(ref.versio).push({ tipus: o.tipus, objecte: desc, expr, idx: ref.idx });
  }
  const ordenades = new Map();
  for (const a of analisis) {
    const llista = perVersio.get(a.versio);
    if (!llista) continue;
    llista.sort((x, y) => PRIORITAT_EMPREMTA[x.tipus] - PRIORITAT_EMPREMTA[y.tipus] || x.idx - y.idx);
    ordenades.set(a.versio, llista.slice(0, 6).map((x) => ({ tipus: x.tipus, objecte: x.objecte, expr: x.expr })));
  }
  if (!ordenades.size) return { sql: null, perVersio: ordenades };
  const files = [];
  for (const [v, llista] of [...ordenades].sort((a, b) => comparaVersions(a[0], b[0]))) for (const o of llista) files.push(`  (${lit(v)}, ${lit(o.objecte)}, ${o.expr})`);
  const sql = ['select e.versio, count(*) as esperats, count(*) filter (where e.present) as presents,',
    "       coalesce(string_agg(e.objecte, ' · ') filter (where not e.present), '') as absents",
    'from (values', files.join(',\n'), ') as e(versio, objecte, present)', 'group by e.versio order by e.versio;'].join('\n');
  return { sql, perVersio: ordenades };
}

/* ───────────────────────── 13. Verificació ───────────────────────── */

function isoLocal(d) {
  const off = -d.getTimezoneOffset();
  const dos = (x) => String(Math.floor(Math.abs(x))).padStart(2, '0');
  return `${new Date(d.getTime() + off * 60000).toISOString().slice(0, 19)}${off >= 0 ? '+' : '-'}${dos(off / 60)}:${dos(off % 60)}`;
}

const APLICADA = new Set(['aplicada_registre', 'aplicada_empremta', 'declarada_aplicada']);
const PENDENT = new Set(['absent', 'parcial_empremta', 'declarada_no_aplicada']);

/** Informe complet (objecte serialitzable). opcions: { arrel, aplicades?, empremtes?, estricte?, ara? }. */
export function verifica(opcions = {}) {
  const arrel = path.resolve(opcions.arrel ?? ARREL_DEL_SCRIPT);
  const ara = opcions.ara instanceof Date ? opcions.ara : new Date();
  const errors = [];
  const avisos = [];
  const informatius = [];
  const fitxerDe = (f) => `${DIR_MIGRACIONS}/${f}`;
  const err = (codi, fitxer, linia, missatge, extra = {}) => errors.push({ codi, fitxer, linia, missatge, ...extra });
  const avis = (codi, fitxer, linia, missatge, extra = {}) => avisos.push({ codi, fitxer, linia, missatge, ...extra });
  const info = (codi, fitxer, linia, missatge) => informatius.push({ codi, fitxer, linia, missatge });

  // 13.1 Inventari
  const dir = path.join(arrel, DIR_MIGRACIONS);
  let entrades = [];
  try { entrades = fs.readdirSync(dir, { withFileTypes: true }); } catch { err('E-SENSE-MIGRACIONS', DIR_MIGRACIONS, null, 'no es pot llegir la carpeta de migracions'); }
  const migracions = [];
  const perVersio = new Map();
  for (const e of entrades.filter((x) => x.name.endsWith('.sql')).sort((a, b) => {
    const va = versioDeFitxer(a.name), vb = versioDeFitxer(b.name);
    return (va && vb ? comparaVersions(va, vb) : 0) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  })) {
    const f = e.name;
    const nom = validaNom(f, ara);
    for (const x of nom.errors) err(x.codi, fitxerDe(f), null, x.missatge);
    for (const x of nom.avisos) avis(x.codi, fitxerDe(f), null, x.missatge);
    const st = fs.lstatSync(path.join(dir, f));
    if (!st.isFile()) { err('E-FITXER-NO-REGULAR', fitxerDe(f), null, 'una migració ha de ser un fitxer regular (cap enllaç simbòlic)'); continue; }
    if (!nom.versio) continue;
    if (perVersio.has(nom.versio)) { err('E-DUPLICADA', fitxerDe(f), null, `versió ${nom.versio} repetida (també a ${perVersio.get(nom.versio).fitxer})`); continue; }
    const buf = fs.readFileSync(path.join(dir, f));
    const sql = buf.toString('utf8');
    const stmts = sentencies(sql);
    const cap = capcalera(sql);
    const m = { versio: nom.versio, fitxer: f, sha256: createHash('sha256').update(buf).digest('hex'), sql, sentencies: stmts, capcalera: cap };
    migracions.push(m);
    perVersio.set(nom.versio, m);
  }
  const versions = new Set(perVersio.keys());
  const versionsOrdenades = [...versions].sort(comparaVersions);

  // 13.2 JSON d'ordre
  let ordreJson = { restriccions: [], portes: [], fantasmes: [], reaplicacio: [] };
  const camiOrdre = path.join(arrel, FITXER_ORDRE);
  if (fs.existsSync(camiOrdre)) {
    try { ordreJson = llegixOrdre(fs.readFileSync(camiOrdre, 'utf8'), versions); } catch (e) { err('E-ORDRE-JSON', FITXER_ORDRE, null, e.message); }
  } else avis('A-SENSE-ORDRE', FITXER_ORDRE, null, 'sense JSON d\'ordre: ordre alfabètic i capçaleres');
  const fantasmes = new Map(ordreJson.fantasmes.map((f) => [f.versio, f.motiu]));

  // 13.3 Anàlisi per migració
  for (const m of migracions) {
    const f = fitxerDe(m.fitxer);
    for (const s of m.sentencies) if (s.senseTancar) err('E-SENSE-TANCAR', f, s.linia, 'sentència, cadena, comentari o cos sense tancar al final del fitxer');
    m.transaccio = analitzaTransaccio(m.sentencies);
    for (const p of m.transaccio.problemes) err(p.codi, f, p.linia, p.missatge);
    m.idempotencia = analitzaIdempotencia(m.sentencies);
    m.objectes = objectesDeMigracio(m.sentencies);
    m.consultesCap = consultesDeCapcalera(m.capcalera);
    const textCap = m.capcalera.map((c) => c.text).join(' ');
    m.declaraIdempotent = /\bidempotent/i.test(textCap) && !/\bno (?:és )?idempotent/i.test(textCap);
    m.depsDeclarades = [];
    for (const d of dependenciesDeclarades(m.capcalera, m.versio)) {
      if (fantasmes.has(d.versio)) { err('E-DEP-FANTASMA', f, d.linia, `depén de ${d.versio}, que no existix: ${fantasmes.get(d.versio)}`); continue; }
      if (!versions.has(d.versio)) { err('E-DEP-INEXISTENT', f, d.linia, `depén de ${d.versio}, sense fitxer a supabase/migrations`); continue; }
      if (comparaVersions(d.versio, m.versio) > 0 && !ordreJson.restriccions.some((r) => r.abans === d.versio && r.despres === m.versio)) { err('E-DEP-CAP-AVANT', f, d.linia, `depén de ${d.versio}, posterior a la seua versió`); continue; }
      m.depsDeclarades.push(d);
    }
  }
  const cataleg = catalegFuncions(migracions);

  // 13.4 README
  const camiReadme = path.join(arrel, FITXER_README);
  let readme = { bullets: [], taula: [], sondaVersions: new Map(), cadenes: [], blocsSql: [], consultesPerFitxer: new Map() };
  if (fs.existsSync(camiReadme)) readme = llegixReadme(fs.readFileSync(camiReadme, 'utf8'));
  else err('E-README-ABSENT', FITXER_README, null, 'no hi ha supabase/README.md');
  const vinyetes = new Set(readme.bullets.map((b) => b.fitxer));
  const files = new Map(readme.taula.map((r) => [r.fitxer, r]));
  const fitxersReals = new Set(migracions.map((m) => m.fitxer));
  for (const m of migracions) {
    if (!vinyetes.has(m.fitxer)) err('E-README-ABSENT', FITXER_README, null, `sense vinyeta «- \`migrations/${m.fitxer}\`»`);
    if (!files.has(m.fitxer)) err('E-README-ABSENT', FITXER_README, null, `sense fila a la taula canònica: ${m.fitxer}`);
    const fila = files.get(m.fitxer);
    m.estatDeclarat = 'desconegut';
    if (fila) {
      const e = estatDeclarat(fila.estat);
      if (e) m.estatDeclarat = e; else avis('A-ESTAT-NO-RECONEGUT', FITXER_README, fila.linia, `estat declarat no reconegut per a ${m.versio}: «${fila.estat.slice(0, 60)}»`);
    }
  }
  for (const b of readme.bullets) if (!fitxersReals.has(b.fitxer)) err('E-README-FANTASMA', FITXER_README, b.linia, `vinyeta d'un fitxer inexistent: ${b.fitxer}`);
  for (const r of readme.taula) if (!fitxersReals.has(r.fitxer)) err('E-README-FANTASMA', FITXER_README, r.linia, `fila d'un fitxer inexistent: ${r.fitxer}`);
  for (const [v, s] of readme.sondaVersions) if (!versions.has(v)) err('E-SONDA-README', FITXER_README, s.linia, `la columna ${s.alias} nomena una versió sense fitxer`);
  for (const c of readme.cadenes) for (const v of [c.abans, c.despres]) if (!versions.has(v)) err('E-README-FANTASMA', FITXER_README, c.linia, `la seqüència de P0-21 nomena ${v}, sense fitxer`);
  const blocs = readme.blocsSql.map((b) => {
    const st = sentencies(b.sql);
    const motius = st.length ? st.map((s) => nomesLectura(s.text, cataleg)).filter(Boolean) : ['bloc buit'];
    if (motius.length) err('E-README-SQL-ESCRIPTURA', FITXER_README, b.linia, `bloc sql que no és de només lectura: ${motius[0]}`);
    return { ...b, valid: !motius.length };
  });

  // 13.5 Ordre
  const dependencies = new Map(migracions.map((m) => [m.versio, m.depsDeclarades.filter((d) => comparaVersions(d.versio, m.versio) < 0).map((d) => d.versio)]));
  const ord = ordena({ versions: versionsOrdenades, dependencies, restriccions: ordreJson.restriccions, portes: ordreJson.portes });
  for (const e of ord.errors) err(e.codi, FITXER_ORDRE, null, e.missatge);
  const pos = new Map(ord.ordre.map((x, i) => [`${x.tipus === 'migracio' ? 'm' : 'p'}:${x.id}`, i]));
  const posM = (v) => pos.get(`m:${v}`);
  for (const c of readme.cadenes) {
    if (versions.has(c.abans) && versions.has(c.despres) && posM(c.abans) > posM(c.despres)) err('E-ORDRE-README', FITXER_README, c.linia, `el README demana ${c.abans} abans de ${c.despres} i l'ordre calculat no ho respecta (falta la restricció a ordre_desplegament.json?)`);
  }
  for (const inv of ord.inversions) avis('A-INVERSIO-ALFABETICA', FITXER_ORDRE, null, `${inv.abans} va abans de ${inv.despres}: supabase db push no la respectaria; aplica a mà en l'ordre del pla`);

  // 13.6 Usos d'objectes (dependències inferides)
  const proveidor = new Map();
  for (const m of migracions) for (const c of m.objectes.crea) if (['taula', 'vista', 'funcio', 'sequencia', 'tipus'].includes(c.tipus) && !proveidor.has(c.nom)) proveidor.set(c.nom, m.versio);
  for (const m of migracions) {
    const f = fitxerDe(m.fitxer);
    m.depsInferides = new Map();
    const vistos = new Set();
    for (const u of m.objectes.usa) {
      const p = proveidor.get(u.nom);
      if (!p || p === m.versio) continue;
      if (comparaVersions(p, m.versio) < 0) { if (!m.depsInferides.has(p)) m.depsInferides.set(p, { versio: p, linia: u.linia, objecte: u.nom }); continue; }
      const clau = `${u.nom}@${u.linia}`;
      if (vistos.has(clau)) continue;
      vistos.add(clau);
      if (u.guardat) info('I-US-GUARDAT', f, u.linia, `usa ${u.nom} (de ${p}) amb guarda to_regclass/to_regprocedure`);
      else if (u.context === 'cos_plpgsql') avis('A-US-TARDA', f, u.linia, `usa ${u.nom}, que crea ${p} (posterior), dins d'un cos plpgsql: fallarà en executar-se si ${p} no hi és`);
      else err('E-USA-POSTERIOR', f, u.linia, `usa ${u.nom}, que crea ${p} (posterior), ${u.context === 'cos_sql' ? 'en un cos language sql (es valida en crear-lo)' : 'en una sentència de nivell superior'}`);
    }
    for (const d of m.depsInferides.values()) if (posM(d.versio) > posM(m.versio)) err('E-ORDRE-INFERIT', f, d.linia, `usa ${d.objecte} de ${d.versio}, però l'ordre calculat posa ${d.versio} darrere`);
  }

  // 13.7 Idempotència: coherència amb la capçalera
  for (const m of migracions) if (m.declaraIdempotent && m.idempotencia.veredicte !== 'repetible') avis('A-DECLARA-IDEMPOTENT', fitxerDe(m.fitxer), null, `la capçalera diu «idempotent» i el veredicte és ${m.idempotencia.veredicte}`, { versio: m.versio });

  // 13.8 Cascades de reaplicació (derivades)
  const ordreMig = ord.ordre.filter((x) => x.tipus === 'migracio').map((x) => x.id);
  const defs = new Map(migracions.map((m) => [m.versio, new Set(m.objectes.defineix)]));
  const posteriors = new Map();
  for (let i = 0; i < ordreMig.length; i++) {
    const a = defs.get(ordreMig[i]);
    const llista = [];
    for (let j = i + 1; j < ordreMig.length; j++) {
      const comuns = [...defs.get(ordreMig[j])].filter((x) => a.has(x));
      if (comuns.length) llista.push({ versio: ordreMig[j], objectes: comuns });
    }
    posteriors.set(ordreMig[i], llista);
  }
  const cascada = (v) => {
    const vist = new Set();
    const cua = [v];
    while (cua.length) { for (const p of posteriors.get(cua.shift()) ?? []) if (!vist.has(p.versio)) { vist.add(p.versio); cua.push(p.versio); } }
    return ordreMig.filter((x) => vist.has(x));
  };
  for (const m of migracions) m.cascada = cascada(m.versio);
  for (const r of ordreJson.reaplicacio) for (const v of r.llavors) if (perVersio.has(r.si) && !perVersio.get(r.si).cascada.includes(v)) avis('A-REAPLICACIO-NO-DERIVADA', FITXER_ORDRE, null, `reaplicacio: ${r.si} → ${v} no es deriva de cap objecte redefinit`);

  // 13.9 Empremtes (N2)
  const analisisOrdre = ordreMig.map((v) => perVersio.get(v));
  const empremtes = consultaEmpremtes(analisisOrdre);
  if (empremtes.sql && nomesLectura(empremtes.sql, cataleg)) err('E-EMPREMTA-ESCRIPTURA', null, null, `la consulta d'empremtes generada no és de només lectura: ${nomesLectura(empremtes.sql, cataleg)}`);

  // 13.10 Evidència i estats
  let registre = null;
  const evEmpremtes = { perVersio: new Map(), sonda: new Map() };
  if (opcions.aplicades !== undefined && opcions.aplicades !== null) registre = llegixAplicades(opcions.aplicades);
  const textosEmpremtes = opcions.empremtes === undefined || opcions.empremtes === null ? [] : [].concat(opcions.empremtes);
  for (const t of textosEmpremtes) { const r = llegixEmpremtes(t); for (const [k, v] of r.perVersio) evEmpremtes.perVersio.set(k, v); for (const [k, v] of r.sonda) evEmpremtes.sonda.set(k, v); }
  const ambEvidencia = Boolean(registre) || evEmpremtes.perVersio.size > 0 || evEmpremtes.sonda.size > 0;
  const nErrorsAbansEvidencia = errors.length;
  if (registre) for (const v of registre.versions) if (!versions.has(v)) err('E-APLICADES-SENSE-FITXER', null, null, `el registre remot té ${v} i no hi ha cap fitxer amb eixa versió: reconcilia-ho abans d'aplicar res`);
  // Registre contra objectes (ARB-B3-02): si el Mestre aplica a mà, el registre no ho reflectix i
  // «absent (registre)» seria fals. Cap pas fins que l'evidència quadre: error d'evidència i estat desconegut.
  const contradiccio = (m, detall) => {
    err('E-EVIDENCIA-CONTRADICTORIA', fitxerDe(m.fitxer), null, `${detall}: torna a generar el pla només amb --empremtes, o reconcilia el registre, abans d'aplicar res`);
    m.estat = 'desconegut'; m.font = 'contradiccio';
  };
  for (const m of migracions) {
    const f = fitxerDe(m.fitxer);
    m.estat = m.estatDeclarat; m.font = 'readme';
    const emp = evEmpremtes.perVersio.get(m.versio);
    let estatEmp = null;
    if (emp) {
      estatEmp = emp.presents === emp.esperats && emp.esperats > 0 ? 'aplicada_empremta' : emp.presents === 0 ? 'absent' : 'parcial_empremta';
      if (estatEmp === 'parcial_empremta') err('E-EMPREMTA-PARCIAL', f, null, `empremta parcial (${emp.presents}/${emp.esperats}; absents: ${emp.absents}): no apliques res fins revisar-la`);
    }
    if (registre) {
      m.estat = registre.versions.includes(m.versio) ? 'aplicada_registre' : 'absent'; m.font = 'registre';
      if (estatEmp && estatEmp !== 'parcial_empremta' && (m.estat === 'aplicada_registre') !== (estatEmp === 'aplicada_empremta')) contradiccio(m, `el registre diu ${m.estat} i l'empremta ${estatEmp}`);
    } else if (estatEmp) { m.estat = estatEmp; m.font = 'empremta'; }
  }
  // un registre buit mentre el README declara aplicades vol dir que el registre no és la història real
  if (registre?.buit) {
    const declarades = migracions.filter((m) => m.estatDeclarat === 'declarada_aplicada').map((m) => m.versio);
    if (declarades.length) err('E-EVIDENCIA-CONTRADICTORIA', FITXER_README, null, `registre buit, però el README declara aplicades ${declarades.join(', ')}: el registre no reflectix les aplicacions fetes a mà; torna a generar el pla només amb --empremtes`);
  }
  // la sonda del README: «true» acredita present; «false» només absent si cap migració de la cascada hi és
  // (dues passades: primer tots els «true», després els «false», que miren la cascada ja acreditada).
  // Contra el registre o una empremta, la sonda també pot destapar una contradicció.
  const columnaDe = (m) => { const s = readme.sondaVersions.get(m.versio); return s && evEmpremtes.sonda.has(s.alias) ? evEmpremtes.sonda.get(s.alias) : null; };
  const fisica = (x) => x.font !== 'readme' && x.font !== 'contradiccio';
  const falses = migracions.filter((m) => columnaDe(m) === false);
  for (const m of migracions) {
    if (columnaDe(m) !== true) continue;
    if (m.font === 'readme') { m.estat = 'aplicada_empremta'; m.font = 'sonda'; } else if (m.estat === 'absent') contradiccio(m, `${m.font === 'registre' ? 'el registre no la té' : 'l\'empremta la dona absent'} i la sonda del README la dona present`);
  }
  for (const m of falses) {
    const cobert = m.cascada.some((v) => APLICADA.has(perVersio.get(v).estat) && fisica(perVersio.get(v)));
    if (m.font === 'readme') {
      if (cobert) { m.estat = 'desconegut'; m.font = 'sonda'; m.sondaIndeterminada = true; } else { m.estat = 'absent'; m.font = 'sonda'; }
    } else if (APLICADA.has(m.estat) && fisica(m) && !cobert) contradiccio(m, `${m.font === 'registre' ? 'el registre la té' : 'l\'empremta la dona present'} i la sonda del README la dona absent (cap migració de la seua cascada hi és)`);
  }
  if (ambEvidencia) {
    for (const m of migracions) {
      const f = fitxerDe(m.fitxer);
      if (fisica(m) && m.estatDeclarat !== 'desconegut' && APLICADA.has(m.estat) !== (m.estatDeclarat === 'declarada_aplicada')) avis('A-README-DESFASAT', FITXER_README, null, `${m.versio}: el README diu ${m.estatDeclarat} i l'evidència (${m.font}) ${m.estat}${m.estatDeclarat === 'declarada_aplicada' ? ' (aplicada a mà fora del registre?)' : ''}`);
      if (APLICADA.has(m.estat) && m.font !== 'readme') {
        const deps = [...m.depsDeclarades.map((d) => d.versio), ...m.depsInferides.keys()];
        for (const d of new Set(deps)) if (PENDENT.has(perVersio.get(d)?.estat) && perVersio.get(d).font !== 'readme') err('E-DEP-TRENCADA', f, null, `aplicada, però depén de ${d}, que és ${perVersio.get(d).estat}`);
      }
      if (PENDENT.has(m.estat) && m.font !== 'readme') {
        const posteriorsAplicades = ordreMig.slice(ordreMig.indexOf(m.versio) + 1).filter((v) => APLICADA.has(perVersio.get(v).estat) && perVersio.get(v).font !== 'readme');
        if (posteriorsAplicades.length) avis('A-FORAT', f, null, `pendent amb posteriors aplicades (${posteriorsAplicades.slice(0, 5).join(', ')}${posteriorsAplicades.length > 5 ? '…' : ''}): supabase db push la refusaria sense --include-all`);
      }
    }
  }
  const errorsEvidencia = errors.slice(nErrorsAbansEvidencia).filter((e) => ['E-APLICADES-SENSE-FITXER', 'E-DEP-TRENCADA', 'E-EMPREMTA-PARCIAL', 'E-EVIDENCIA-CONTRADICTORIA'].includes(e.codi));

  // 13.11 Consultes de lectura per migració
  const excloses = [];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const m of migracions) {
    const f = fitxerDe(m.fitxer);
    const q = { previes: [], posteriors: [], sense_etiqueta: [], excloses: [] };
    // una consulta sense etiqueta que usa un objecte creat o redefinit per esta migració va després d'«Aplica»
    // (ARB-B3-04: abans fallaria amb «does not exist»); els literals, com to_regclass('…'), no compten
    const propis = [...new Set(m.objectes.crea.filter((c) => ['funcio', 'taula', 'vista', 'sequencia', 'tipus'].includes(c.tipus)).map((c) => c.nom))].map((nom) => {
      const k = nom.indexOf('.');
      const [e, o] = [esc(nom.slice(0, k)), esc(nom.slice(k + 1))];
      return new RegExp(`(?<![\\w$])${e}\\s*\\.\\s*${o}(?![\\w$])${e === 'public' ? `|(?<![\\w$.])${o}(?![\\w$])` : ''}`, 'i');
    });
    const usaPropi = (sql) => { const codi = blanqueja(sql, { cossos: 'fora', ids: 'desfes' }); return propis.some((re) => re.test(codi)); };
    const senseEtiqueta = (x) => (usaPropi(x.sql) ? { ...x, despres: true } : x);
    for (const c of m.consultesCap) {
      if (c.senseTancar) { avis('A-CONSULTA-SENSE-TANCAR', f, c.linia, 'consulta de capçalera sense «;» en 15 línies: descartada'); continue; }
      const motiu = c.etiqueta === 'recepta' ? (nomesLectura(c.sql, cataleg) ?? 'recepta de base de prova (dues sessions)') : nomesLectura(c.sql, cataleg);
      if (motiu) { const x = { fitxer: m.fitxer, linia: c.linia, etiqueta: c.etiqueta, motiu }; q.excloses.push(x); excloses.push(x); avis('A-CONSULTA-EXCLOSA', f, c.linia, `consulta «${c.etiqueta}» exclosa del pla: ${motiu}`); continue; }
      (c.etiqueta === 'previa' ? q.previes : c.etiqueta === 'posterior' ? q.posteriors : q.sense_etiqueta).push({ linia: c.linia, sql: c.sql, origen: 'capcalera' });
    }
    for (const c of readme.consultesPerFitxer.get(m.fitxer) ?? []) {
      const motiu = c.etiqueta === 'recepta' ? 'recepta de base de prova (dues sessions)' : nomesLectura(c.sql, cataleg);
      if (motiu) { const x = { fitxer: FITXER_README, linia: c.linia, etiqueta: c.etiqueta, motiu, migracio: m.fitxer }; q.excloses.push(x); excloses.push(x); avis('A-CONSULTA-EXCLOSA', FITXER_README, c.linia, `consulta «${c.etiqueta}» de la vinyeta de ${m.versio} exclosa del pla: ${motiu}`); continue; }
      const desti = c.etiqueta === 'previa' ? q.previes : c.etiqueta === 'posterior' ? q.posteriors : q.sense_etiqueta;
      const capPropia = desti.some((x) => x.origen === 'capcalera');
      const igual = (x) => x.sql.replace(/\s+/g, ' ').trim() === c.sql;
      if (!capPropia && !desti.some(igual)) desti.push({ linia: c.linia, sql: c.sql, origen: 'readme' });
    }
    q.sense_etiqueta = q.sense_etiqueta.map(senseEtiqueta);
    m.consultes = q;
    m.columnaSonda = readme.sondaVersions.get(m.versio)?.alias ?? null;
    m.empremta = empremtes.perVersio.get(m.versio) ?? null;
    const vinyeta = readme.bullets.find((b) => b.fitxer === m.fitxer);
    m.notaClient = /abans de publicar el client/i.test(`${m.capcalera.map((c) => c.text).join(' ')} ${vinyeta?.text ?? ''}`.replace(/\s+/g, ' '));
  }

  // 13.12 Pendents, passos i avisos de les pendents
  const sufix = [];
  for (let i = ordreMig.length - 1; i >= 0 && perVersio.get(ordreMig[i]).estat === 'declarada_no_aplicada'; i--) sufix.unshift(ordreMig[i]);
  const pendent = (m) => PENDENT.has(m.estat);
  const potserAplicada = (x) => x.estat === 'desconegut' || (x.font === 'registre' && x.estat === 'absent' && x.estatDeclarat === 'declarada_aplicada');
  for (const m of migracions) {
    const f = fitxerDe(m.fitxer);
    const deps = [...new Set([...m.depsDeclarades.map((d) => d.versio), ...m.depsInferides.keys()])];
    if (!ambEvidencia) {
      if (sufix.includes(m.versio)) m.pas = { estat: 'recomanat_declarat' };
      else if (m.estat === 'declarada_no_aplicada') m.pas = { estat: 'bloquejat', motiu: 'hi ha migracions anteriors en estat desconegut: executa el Pas 0' };
      else m.pas = null;
    } else if (errorsEvidencia.length && (pendent(m) || m.estat === 'desconegut')) m.pas = { estat: 'bloquejat', motiu: `errors d'evidència (${errorsEvidencia[0].codi}): reconcilia-ho abans d'aplicar res` };
    else if (pendent(m)) {
      const desconegudes = deps.filter((d) => perVersio.get(d)?.estat === 'desconegut');
      const aplicadesCascada = m.cascada.filter((v) => APLICADA.has(perVersio.get(v).estat));
      // una posterior de la cascada que potser hi és (desconeguda, o declarada aplicada i absent del registre)
      // no deixa descartar un forat: recomanar-la podria regressar-la
      const dubtoses = m.cascada.filter((v) => potserAplicada(perVersio.get(v)));
      if (m.font === 'registre' && m.estatDeclarat === 'declarada_aplicada') m.pas = { estat: 'bloquejat', motiu: 'el README la declara aplicada i el registre no la té: acredita-la amb les empremtes o la sonda del Pas 0 abans de reaplicar-la' };
      else if (desconegudes.length) m.pas = { estat: 'bloquejat', motiu: `depén de ${desconegudes.join(', ')}, en estat desconegut` };
      else if (aplicadesCascada.length) {
        const objs = [...new Set(aplicadesCascada.flatMap((v) => (posteriors.get(m.versio).find((p) => p.versio === v)?.objectes ?? [])))];
        m.pas = { estat: 'forat', aplicades: aplicadesCascada, objectes: objs.slice(0, 8), reaplica: m.cascada };
      } else if (dubtoses.length) m.pas = { estat: 'bloquejat', motiu: `la seua cascada inclou ${dubtoses.slice(0, 5).join(', ')}${dubtoses.length > 5 ? '…' : ''}, que potser hi és: no es pot descartar un forat` };
      else m.pas = { estat: 'recomanat' };
    } else if (m.estat === 'desconegut') m.pas = { estat: 'bloquejat', motiu: m.sondaIndeterminada ? 'la sonda dona fals, però una migració de la cascada hi és: indeterminat' : 'sense evidència per a esta versió' };
    else m.pas = null;
    m.pendent = Boolean(m.pas && m.pas.estat !== 'bloquejat') || pendent(m);
    if (!m.pendent) continue;
    const marca = { pendent: true, versio: m.versio };
    if (m.idempotencia.veredicte !== 'repetible') avis('A-IDEMPOTENCIA', f, m.idempotencia.troballes.find((x) => x.nivell === 'avis')?.linia ?? null, `no repetible (${m.idempotencia.veredicte}): ${[...new Set(m.idempotencia.troballes.filter((x) => x.nivell === 'avis').map((x) => x.regla))].join(', ')}`, marca);
    if (!m.transaccio.trams.length) avis('A-SENSE-TRANSACCIO', f, null, 'sense begin … commit: pot quedar a mitges', marca);
    const teConsulta = m.consultes.previes.length + m.consultes.posteriors.length + m.consultes.sense_etiqueta.length > 0 || m.columnaSonda || m.empremta;
    if (!teConsulta) avis('A-SENSE-CONSULTES', f, null, 'pendent sense cap consulta de lectura, columna de sonda ni empremta per a confirmar-ne l\'estat', marca);
  }
  for (const a of avisos) if (a.codi === 'A-DECLARA-IDEMPOTENT' && perVersio.get(a.versio)?.pendent) a.pendent = true;
  for (const m of migracions) if (!m.pendent && m.idempotencia.veredicte !== 'repetible') info('I-IDEMPOTENCIA', fitxerDe(m.fitxer), null, `veredicte ${m.idempotencia.veredicte} (històrica: el pla mai la reexecuta)`);
  for (const m of migracions) for (const t of m.idempotencia.troballes) if (t.nivell === 'indeterminat') info('I-INDETERMINAT', fitxerDe(m.fitxer), t.linia, `${t.regla}: un DO anterior en fa un drop dinàmic`);

  // 13.13 Portes
  const portes = ordreJson.portes.map((p) => {
    let comprovacio = null;
    if (p.comprovacio) {
      const cami = path.join(arrel, p.comprovacio.fitxer);
      let text = null;
      try { if (path.relative(arrel, cami).startsWith('..')) throw new Error('fora'); text = fs.readFileSync(cami, 'utf8'); } catch { text = null; }
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`^export const ${esc(p.comprovacio.constant)}\\s*=\\s*'${esc(p.comprovacio.valor)}'`, 'm');
      const mm = text === null ? null : re.exec(text);
      comprovacio = mm ? { ok: true, linia: text.slice(0, mm.index).split('\n').length } : { ok: false };
      if (!mm) avis('A-PORTA-CLIENT', p.comprovacio.fitxer, null, `porta ${p.id}: no s'hi troba export const ${p.comprovacio.constant} = '${p.comprovacio.valor}'`);
    }
    return { ...p, posicio: pos.get(`p:${p.id}`), comprovacioResultat: comprovacio };
  });

  // 13.14 --estricte
  if (opcions.estricte) {
    const promou = new Set(['A-IDEMPOTENCIA', 'A-DECLARA-IDEMPOTENT', 'A-SENSE-TRANSACCIO', 'A-SENSE-CONSULTES']);
    for (let i = avisos.length - 1; i >= 0; i--) if (promou.has(avisos[i].codi) && avisos[i].pendent) errors.push({ ...avisos.splice(i, 1)[0], promogut: true });
  }

  const evidencia = { tipus: ambEvidencia ? [registre && 'registre', evEmpremtes.perVersio.size && 'empremtes', evEmpremtes.sonda.size && 'sonda'].filter(Boolean).join('+') : 'cap', versions: registre ? registre.versions : [], registreBuit: registre ? registre.buit : null };
  return {
    esquema: ESQUEMA_INFORME,
    generat: isoLocal(ara),
    arrel,
    evidencia,
    estricte: Boolean(opcions.estricte),
    migracions: ordreMig.map((v) => perVersio.get(v)).map((m) => ({
      versio: m.versio, fitxer: m.fitxer, sha256: m.sha256, estatDeclarat: m.estatDeclarat, estat: m.estat, font: m.font,
      dependencies: [...m.depsDeclarades.map((d) => ({ versio: d.versio, origen: 'declarada', linia: d.linia })), ...[...m.depsInferides.values()].map((d) => ({ versio: d.versio, origen: 'inferida', linia: d.linia, objecte: d.objecte }))],
      transaccio: { begin: m.transaccio.begin, commit: m.transaccio.commit, trams: m.transaccio.trams.length },
      idempotencia: m.idempotencia, declaraIdempotent: m.declaraIdempotent,
      consultes: m.consultes, columnaSonda: m.columnaSonda, empremta: m.empremta, cascada: m.cascada, notaClient: m.notaClient, pas: m.pas
    })),
    ordre: ord.ordre,
    portes,
    inversions: ord.inversions,
    sufixDeclarat: sufix,
    blocsReadme: blocs.map((b) => ({ linia: b.linia, sql: b.sql, valid: b.valid, tipus: /to_regclass\('supabase_migrations\.schema_migrations'\)/i.test(b.sql) ? 'registre' : /from\s+supabase_migrations\.schema_migrations/i.test(b.sql) ? 'versions' : /\bAS\s+te_/i.test(b.sql) ? 'sonda' : 'altre' })),
    consultaEmpremtes: empremtes.sql,
    cobertura: { ambEmpremta: empremtes.perVersio.size, total: migracions.length },
    excloses,
    errors,
    avisos,
    informatius,
    catalegFuncions: Object.fromEntries([...cataleg].sort())
  };
}

/* ───────────────────────── 14. Formats d'eixida ───────────────────────── */

function descripcioEvidencia(informe) {
  const e = informe.evidencia;
  if (e.tipus === 'cap') return 'desconegut: cap --aplicades ni --empremtes';
  const parts = [];
  if (e.tipus.includes('registre')) parts.push(e.registreBuit ? 'registre buit' : `registre amb ${e.versions.length} versions`);
  if (e.tipus.includes('empremtes')) parts.push('empremtes');
  if (e.tipus.includes('sonda')) parts.push('sonda del README');
  return parts.join(' + ');
}

const linia = (x) => `${x.codi} ${x.fitxer ?? '-'}${x.linia ? `:${x.linia}` : ''} ${x.missatge}`;

export function formataText(informe) {
  const out = [];
  const ms = informe.migracions;
  const comp = (k) => ms.filter((m) => m.estatDeclarat === k).length;
  out.push(`Migracions: ${ms.length} fitxers · declarades aplicades ${comp('declarada_aplicada')} · NO aplicades ${comp('declarada_no_aplicada')} · no acreditades ${comp('desconegut')}`);
  out.push(`Ordre: ${informe.ordre.length} passos (${informe.portes.length} portes) · inversions de l'ordre alfabètic: ${informe.inversions.map((i) => `${i.abans}→${i.despres}`).join(', ') || 'cap'}`);
  const ver = (k) => ms.filter((m) => m.idempotencia.veredicte === k).map((m) => m.versio);
  out.push(`Idempotència: repetibles ${ver('repetible').length} · falla neta ${ver('no_repetible_falla_neta').join(', ') || 'cap'} · risc parcial ${ver('risc_parcial').join(', ') || 'cap'}`);
  out.push(`Empremtes automàtiques: ${informe.cobertura.ambEmpremta} de ${informe.cobertura.total} versions`);
  if (informe.errors.length) { out.push('', 'Errors:'); for (const e of informe.errors) out.push(`  ${linia(e)}`); }
  if (informe.avisos.length) { out.push('', 'Avisos:'); for (const a of informe.avisos) out.push(`  ${linia(a)}`); }
  out.push('', `Verificador de migracions: ${informe.errors.length} errors, ${informe.avisos.length} avisos (estat remot: ${descripcioEvidencia(informe)})`);
  return `${out.join('\n')}\n`;
}

const blocSql = (sql) => ['```sql', sql.trim(), '```'];

/** Pla en Markdown per al Mestre: només blocs sql que han passat nomesLectura. */
export function formataPla(informe) {
  const out = [];
  const ms = new Map(informe.migracions.map((m) => [m.versio, m]));
  out.push(`# Pla de migracions · generat ${informe.generat}`, '');
  out.push(`Fonts: supabase/migrations (${informe.migracions.length} fitxers), supabase/README.md, supabase/ordre_desplegament.json.`);
  out.push(`Estat remot: ${descripcioEvidencia(informe)}. Cap consulta d'este pla escriu; el verificador no s'ha connectat a cap base. Cap fitxer s'ha executat mai contra PostgreSQL des d'esta eina: el pla no certifica res de producció.`, '');
  out.push('## Pas 0 · Sondes de només lectura', '');
  const bloc = (t) => informe.blocsReadme.find((b) => b.tipus === t && b.valid);
  let n = 1;
  const registre = bloc('registre');
  if (registre) { out.push(`${n++}. Registre (README:${registre.linia}). Si torna null, l'estat és desconegut (no «cap aplicada»): ometeu el punt següent.`, '', ...blocSql(registre.sql), ''); }
  const versions = bloc('versions');
  if (versions) { out.push(`${n++}. Versions del registre (README:${versions.linia}). Desa-ho en CSV (fitxer per a --aplicades).`, '', ...blocSql(versions.sql), ''); }
  const sonda = bloc('sonda');
  if (sonda) { out.push(`${n++}. Sonda d'objectes del README (README:${sonda.linia}). Desa la fila en CSV (fitxer per a --empremtes).`, '', ...blocSql(sonda.sql), ''); }
  if (informe.consultaEmpremtes) { out.push(`${n++}. Empremtes automàtiques (${informe.cobertura.ambEmpremta} de ${informe.cobertura.total} versions; objectes que només crea una migració i cap altra esborra ni redefinix). Desa-ho en CSV (fitxer per a --empremtes).`, '', ...blocSql(informe.consultaEmpremtes), ''); }
  out.push('Torna a generar el pla amb l\'evidència: `node scripts/supabase/verifica-migracions.mjs --pla --aplicades <csv> --empremtes <csv> [--empremtes <csv>]`', '');
  if (informe.errors.length) out.push(`**Hi ha ${informe.errors.length} errors: no apliques res fins que el verificador quede net (vegeu «Errors»).**`, '');
  let pas = 1;
  const bloquejades = [];
  for (const node of informe.ordre) {
    if (node.tipus === 'porta') {
      const p = informe.portes.find((x) => x.id === node.id);
      const visible = p.abans.some((v) => ms.get(v)?.pas && ms.get(v).pas.estat !== 'bloquejat') || (!p.abans.length && p.despres.some((v) => ms.get(v)?.pas && ms.get(v).pas.estat !== 'bloquejat'));
      if (!visible) continue;
      out.push(`## Porta · ${p.descripcio}`, '');
      if (p.despres.length) out.push(`- Després de: ${p.despres.join(', ')}.`);
      if (p.abans.length) out.push(`- Abans de: ${p.abans.join(', ')}.`);
      if (p.comprovacioResultat) out.push(p.comprovacioResultat.ok ? `- ${p.comprovacio.fitxer}:${p.comprovacioResultat.linia} ja porta ${p.comprovacio.constant} = '${p.comprovacio.valor}'; cal acreditar que el client publicat és este (no verificable des d'ací).` : `- ${p.comprovacio.fitxer} NO porta ${p.comprovacio.constant} = '${p.comprovacio.valor}' (A-PORTA-CLIENT).`);
      out.push(`- Font: ${p.font}.`, '');
      continue;
    }
    const m = ms.get(node.id);
    if (!m.pas) continue;
    if (m.pas.estat === 'bloquejat') { bloquejades.push(m); continue; }
    out.push(`## Pas ${pas++} · ${m.fitxer}`, '');
    const estat = m.pas.estat === 'recomanat_declarat' ? `declarada NO aplicada (README; recomanat només com a declarat)${m.columnaSonda ? `. Confirma-ho al Pas 0: columna ${m.columnaSonda}` : m.empremta ? '. Confirma-ho al Pas 0: fila d\'empremtes' : '. Confirma-ho amb la consulta «Abans»'}` : `${m.estat} (${m.font})`;
    out.push(`- Estat: ${estat}.`);
    const dec = m.dependencies.filter((d) => d.origen === 'declarada').map((d) => d.versio);
    const inf = m.dependencies.filter((d) => d.origen === 'inferida' && ms.get(d.versio)?.pas && ms.get(d.versio).pas.estat !== 'bloquejat').map((d) => d.versio);
    out.push(`- Depén de (declarat): ${dec.join(', ') || 'res declarat'} · Necessita (inferit, pendent): ${inf.join(', ') || 'cap'}.`);
    const rep = { repetible: `sí (formes idempotents${m.transaccio.trams ? '; una transacció' : ''})`, no_repetible_falla_neta: 'no: una segona execució falla i es desfà sencera (una transacció)', risc_parcial: 'no: una segona execució pot quedar a mitges (sense transacció)' }[m.idempotencia.veredicte];
    out.push(`- Repetible: ${rep}.`);
    if (m.notaClient) out.push('- Nota: la capçalera o la vinyeta diuen «abans de publicar el client».');
    if (m.pas.estat === 'forat') out.push(`- **Forat:** aplicar-la regressaria ${m.pas.objectes.join(', ') || 'objectes'} de ${m.pas.aplicades.join(', ')}; si cal, aplica-la i reaplica després, en este ordre: ${m.pas.reaplica.join(' → ')}.`);
    const mostra = (titol, llista) => { if (!llista.length) return; out.push(`- ${titol}:`, ''); for (const c of llista) out.push(`  ${c.origen === 'readme' ? 'README' : 'capçalera'}:${c.linia}`, '', ...blocSql(c.sql), ''); };
    mostra('Abans (lectura)', m.consultes.previes);
    mostra('Lectura (sense etiqueta)', m.consultes.sense_etiqueta.filter((c) => !c.despres));
    out.push(`- Aplica: enganxa el fitxer sencer a l'editor SQL (sha256 ${m.sha256.slice(0, 16)}…).`);
    mostra('Després (lectura)', m.consultes.posteriors);
    mostra('Després (lectura sense etiqueta: usa objectes que crea o redefinix esta migració)', m.consultes.sense_etiqueta.filter((c) => c.despres));
    if (!m.consultes.previes.length && !m.consultes.posteriors.length && !m.consultes.sense_etiqueta.length) out.push(`- Comprovació: ${m.columnaSonda ? `columna ${m.columnaSonda} de la sonda` : m.empremta ? 'fila d\'empremtes del Pas 0' : 'manual (cap consulta de lectura)'}.`);
    out.push('');
  }
  if (bloquejades.length) { out.push('## Bloquejades', ''); for (const m of bloquejades) out.push(`- ${m.fitxer}: ${m.pas.motiu}.`); out.push(''); }
  const sensePas = informe.migracions.filter((m) => !m.pas && m.estat === 'desconegut').length;
  if (sensePas) out.push(`${sensePas} migracions en estat desconegut no tenen cap pas: el Pas 0 les ha d'acreditar abans de proposar-ne cap.`, '');
  out.push('## Portes', '');
  for (const p of informe.portes) out.push(`- ${p.id} (${p.tipus}): ${p.descripcio}${p.despres.length ? ` Després de ${p.despres.join(', ')}.` : ''}${p.abans.length ? ` Abans de ${p.abans.join(', ')}.` : ''}`);
  out.push('', '## Receptes de base de prova (excloses del pla)', '');
  if (!informe.excloses.length) out.push('- Cap.');
  for (const x of informe.excloses) out.push(`- ${x.fitxer}:${x.linia} (${x.etiqueta}): ${x.motiu}. No s'executa mai a producció.`);
  out.push('', '## Avisos', '');
  if (!informe.avisos.length) out.push('- Cap.');
  for (const a of informe.avisos) out.push(`- ${linia(a)}`);
  out.push('', '## Errors', '');
  if (!informe.errors.length) out.push('- Cap.');
  for (const e of informe.errors) out.push(`- ${linia(e)}`);
  return `${out.join('\n')}\n`;
}

/* ───────────────────────── 15. CLI ───────────────────────── */

const AJUDA = `Ús: node scripts/supabase/verifica-migracions.mjs [--arrel <dir>] [--aplicades <fitxer>] [--empremtes <fitxer>]…
                                              [--pla] [--format text|json] [--estricte] [--ajuda]

Verificador estàtic de supabase/migrations (P0-05 · P0-21). Llig els fitxers .sql, supabase/README.md
i supabase/ordre_desplegament.json; no es connecta a cap base, no obri cap procés i no escriu res.

  --arrel <dir>          arrel del repositori (per defecte, la del script)
  --aplicades <fitxer>   resultat de «select version, name from supabase_migrations.schema_migrations
                         order by version;» (CSV, text o JSON; màxim 1 MB)
  --empremtes <fitxer>   resultat de la consulta d'empremtes o d'una fila de la sonda del README
                         (CSV o JSON; es pot repetir)
  --pla                  imprimix el pla de només lectura per al Mestre (Markdown)
  --format text|json     informe en text (per defecte) o JSON (excloent amb --pla)
  --estricte             promou a error els avisos de les migracions pendents
Eixida: 0 sense errors, 1 amb errors, 2 ús incorrecte.
`;

function llegixEvidencia(cami, on) {
  let st;
  try { st = fs.statSync(cami); } catch { throw new Error(`${on}: no existix ${cami}`); }
  if (!st.isFile()) throw new Error(`${on}: no és un fitxer: ${cami}`);
  if (st.size > LIMIT_EVIDENCIA) throw new Error(`${on}: ${cami} passa d'1 MB`);
  return fs.readFileSync(cami, 'utf8');
}

/** CLI: torna el codi d'eixida. */
export async function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  const op = { arrel: undefined, aplicades: undefined, empremtes: [], pla: false, format: 'text', estricte: false };
  const valor = (i, nom) => { if (i >= argv.length || String(argv[i]).startsWith('--')) throw new Error(`${nom} necessita un valor`); return argv[i]; };
  try {
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      const [clau, igual] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
      const pren = () => (igual !== undefined ? igual : valor(++i, clau));
      if (clau === '--ajuda' || clau === '-h' || clau === '--help') { stdout.write(AJUDA); return 0; }
      if (clau === '--arrel') op.arrel = pren();
      else if (clau === '--aplicades') { if (op.aplicades !== undefined) throw new Error('--aplicades només una vegada'); op.aplicades = pren(); } else if (clau === '--empremtes') op.empremtes.push(pren());
      else if (clau === '--pla' && igual === undefined) op.pla = true;
      else if (clau === '--estricte' && igual === undefined) op.estricte = true;
      else if (clau === '--format') { op.format = pren(); if (!['text', 'json'].includes(op.format)) throw new Error('--format ha de ser text o json'); } else throw new Error(`bandera desconeguda: ${a}`);
    }
    if (op.pla && op.format === 'json') throw new Error('--pla i --format json són excloents');
    if (op.empremtes.length > 4) throw new Error('--empremtes com a molt quatre vegades');
    if (op.arrel !== undefined && !fs.existsSync(op.arrel)) throw new Error(`--arrel: no existix ${op.arrel}`);
    const aplicades = op.aplicades === undefined ? undefined : llegixEvidencia(op.aplicades, '--aplicades');
    const empremtes = op.empremtes.map((c) => llegixEvidencia(c, '--empremtes'));
    // l'evidència il·legible és ús incorrecte (2), no un error de les migracions
    try {
      if (aplicades !== undefined) llegixAplicades(aplicades);
      for (const t of empremtes) llegixEmpremtes(t);
    } catch (e) { throw new Error(`evidència il·legible: ${e.message}`); }
    op.aplicadesText = aplicades;
    op.empremtesText = empremtes;
  } catch (e) {
    stderr.write(`verifica-migracions: ${e.message}\n\n${AJUDA}`);
    return 2;
  }
  try {
    const informe = verifica({ arrel: op.arrel, aplicades: op.aplicadesText, empremtes: op.empremtesText.length ? op.empremtesText : undefined, estricte: op.estricte });
    stdout.write(op.pla ? formataPla(informe) : op.format === 'json' ? `${JSON.stringify(informe, null, 2)}\n` : formataText(informe));
    return informe.errors.length ? 1 : 0;
  } catch (e) {
    // un error intern no pot donar verd: tanca amb 1
    stderr.write(`verifica-migracions: error intern: ${e.stack ?? e.message}\n`);
    return 1;
  }
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) main(process.argv.slice(2)).then((codi) => { process.exitCode = codi; });
