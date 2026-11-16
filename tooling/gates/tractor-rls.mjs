#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { capcalera, comparaVersions, dependenciesDeclarades, llegixOrdre, ordena, versioDeFitxer } from '../../scripts/supabase/verifica-migracions.mjs';

/* ───────────────────────────────────────────────────────────────────────────
 * Escàner SQL: lleva comentaris i talla en sentències pel `;` de nivell zero.
 * Respecta '…', "…", $$…$$ / $tag$…$tag$ i els comentaris de bloc imbricats.
 * Sense això, `[\s\S]*?` travessa el `;` i acusa la taula equivocada.
 * ────────────────────────────────────────────────────────────────────────── */
function segmentsSql(sql, separador = ';') {
  const fora = [];
  let buf = '';
  let i = 0;
  const n = sql.length;
  let profunditat = 0;

  while (i < n) {
    const c = sql[i];
    const d = sql[i + 1];

    if (c === '-' && d === '-') {                 // comentari de línia
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {                 // comentari de bloc, imbricable
      let prof = 1; i += 2;
      while (i < n && prof > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') { prof++; i += 2; continue; }
        if (sql[i] === '*' && sql[i + 1] === '/') { prof--; i += 2; continue; }
        i++;
      }
      buf += ' ';
      continue;
    }
    if (c === "'") {                              // cadena literal
      const escapable = i > 0 && /[eE]/.test(sql[i - 1]) && (i < 2 || !/[a-zA-Z0-9_$]/.test(sql[i - 2]));
      buf += c; i++;
      while (i < n) {
        // PostgreSQL E'…' permet \': no tanca la cadena ni fa executable
        // un ALTER TABLE escrit dins del text literal.
        if (escapable && sql[i] === '\\' && i + 1 < n) { buf += sql.slice(i, i + 2); i += 2; continue; }
        if (sql[i] === "'" && sql[i + 1] === "'") { buf += "''"; i += 2; continue; }
        buf += sql[i];
        if (sql[i] === "'") { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '"') {                              // identificador entre cometes
      buf += c; i++;
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') { buf += '""'; i += 2; continue; }
        buf += sql[i];
        if (sql[i] === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '$' && (i === 0 || !/[a-zA-Z0-9_$]/.test(sql[i - 1]))) { // mai dins d'un identificador
      const m = /^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/.exec(sql.slice(i));
      if (m) {
        const tanca = m[0];
        const fi = sql.indexOf(tanca, i + tanca.length);
        const tall = fi === -1 ? n : fi + tanca.length;
        buf += sql.slice(i, tall);
        i = tall;
        continue;
      }
    }
    if (c === '(') profunditat++;
    if (c === ')') profunditat = Math.max(0, profunditat - 1);
    if (c === separador && profunditat === 0) {    // només separadors de nivell zero
      if (buf.trim()) fora.push(buf);
      buf = '';
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) fora.push(buf);
  return fora;
}

const sentencies = sql => segmentsSql(sql);

/* R6 · Tokens de capçalera, no una cerca de text dins del cos. Les
 * opcions de CREATE FUNCTION poden anar després d'AS 'cos'/$$cos$$;
 * RETURN i BEGIN ATOMIC, en canvi, comencen el cos SQL sense literal i
 * queden fora del subconjunt admés (error conservador si són definer).
 * Només s'acredita una assignació explícita i única de search_path buit.
 * Identitats desconegudes, tipus no resolts i search_path de sessió (SET,
 * set_config o dins d'un DO) tanquen amb error, com també el DDL de rutina
 * en un fitxer amb ROLLBACK i el SQL dinàmic amb DEFINER: no és un parser
 * complet de PostgreSQL ni executa SQL dinàmic, només falla tancat davant seu.
 * Un nom de rutina SENSE esquema no és una identitat acreditable (la ruta de
 * sessió decidix l'objecte): mai retira ni rebaixa una definer coneguda, i un
 * nom de tipus intern que l'arbre redefinix (CREATE TYPE/DOMAIN) queda ambigu. */
function tokensDeFuncio(statement) {
  const tokens = [];
  let i = 0, depth = 0, valid = true;
  const add = (kind, value) => tokens.push({ kind, value, depth, offset: i });
  while (i < statement.length) {
    const c = statement[i];
    if (/\s/.test(c)) { i++; continue; }
    const prefix = /^(?:[eEnN]|[uU]&)(?=')/.exec(statement.slice(i));
    if (c === "'" || prefix) {
      const escaped = prefix?.[0].toLowerCase() === 'e';
      i += prefix?.[0].length ?? 0;
      i++;
      let value = '', closed = false;
      while (i < statement.length) {
        if (escaped && statement[i] === '\\' && i + 1 < statement.length) { value += statement.slice(i, i + 2); i += 2; continue; }
        if (statement[i] === "'" && statement[i + 1] === "'") { value += "'"; i += 2; continue; }
        if (statement[i] === "'") { i++; closed = true; break; }
        value += statement[i++];
      }
      valid &&= closed;
      add('literal', value);
      continue;
    }
    if (c === '"') {
      i++;
      let value = '', closed = false;
      while (i < statement.length) {
        if (statement[i] === '"' && statement[i + 1] === '"') { value += '"'; i += 2; continue; }
        if (statement[i] === '"') { i++; closed = true; break; }
        value += statement[i++];
      }
      valid &&= closed;
      add('identifier', value);
      continue;
    }
    if (c === '$') {
      const tag = /^(?:\$[a-zA-Z_][a-zA-Z0-9_]*\$|\$\$)/.exec(statement.slice(i));
      if (tag) {
        const start = i + tag[0].length, end = statement.indexOf(tag[0], start);
        valid &&= end >= 0;
        add('literal', statement.slice(start, end < 0 ? statement.length : end));
        i = end < 0 ? statement.length : end + tag[0].length;
        continue;
      }
    }
    const word = /^[a-zA-Z_][a-zA-Z0-9_$]*/.exec(statement.slice(i));
    if (word) { add('word', word[0].toLowerCase()); i += word[0].length; continue; }
    if (c === ')') { depth--; if (depth < 0) valid = false; }
    add('symbol', c);
    if (c === '(') depth++;
    i++;
  }
  return { tokens, valid: valid && depth === 0 };
}

const OPCIONS_FUNCIO = new Set(['language', 'transform', 'window', 'immutable', 'stable', 'volatile', 'leakproof', 'not',
  'called', 'returns', 'strict', 'external', 'security', 'parallel', 'cost', 'rows', 'support', 'set', 'reset', 'as', 'return', 'begin']);
const paraula = (token, value) => token?.kind === 'word' && token.value === value;
const identificador = token => ['word', 'identifier'].includes(token?.kind);
const TIPUS_INTERNS = new Set(('int2 int4 int8 float4 float8 bool bpchar varchar char text uuid json jsonb date time timetz timestamp timestamptz numeric money bytea oid name regclass regtype regproc regprocedure regnamespace regrole interval inet cidr macaddr macaddr8 bit varbit record void trigger event_trigger cstring internal any anyarray anyelement anyenum anynonarray anyrange anymultirange anycompatible anycompatiblearray anycompatiblenonarray anycompatiblerange anycompatiblemultirange tsvector tsquery xml point line lseg box path polygon circle int2vector oidvector pg_lsn pg_snapshot txid_snapshot xid xid8 cid tid aclitem').split(' '));
const ALIES_TIPUS = new Map(Object.entries({
  smallint: 'int2', int: 'int4', integer: 'int4', bigint: 'int8', real: 'float4', float: 'float8',
  'double precision': 'float8', boolean: 'bool', char: 'bpchar', character: 'bpchar',
  'character varying': 'varchar', 'char varying': 'varchar', decimal: 'numeric',
  'bit varying': 'varbit', 'timestamp without time zone': 'timestamp', 'timestamp with time zone': 'timestamptz',
  'time without time zone': 'time', 'time with time zone': 'timetz',
}));

/* R32 · ronda 2 · Un nom de tipus sense esquema també es resol amb la ruta de
 * sessió. pg_catalog va primer només si la ruta no el posa més avall (amb
 * `public, pg_catalog`, un domini public.int4 ombreja l'intern; PGlite 17 ho
 * confirma també via UPDATE pg_settings). Les paraules clau de tipus de la
 * gramàtica (integer, numeric, timestamp…) són sempre pg_catalog. Qualsevol
 * altre nom intern que coincidix amb un CREATE TYPE/DOMAIN de l'arbre (en
 * qualsevol esquema i fitxer) queda no resolt: identitat ambigua, falla tancat. */
const TIPUS_PARAULA_CLAU = new Set(['numeric', 'timestamp', 'time', 'interval', 'bit', 'varchar']);
const TIPUS_OMBREJATS = new Set();

/* Subconjunt explícit d'identitat PG: tipus interns, àlies SQL i tipus
 * qualificats. No s'abaixa la caixa dels identificadors quoted ni es talla
 * un nom de tipus pels seus espais. Tipus no resolts tanquen R6 amb error;
 * PostgreSQL/PGlite continua sent l'autoritat sobre tota la gramàtica SQL. */
function tipusArgument(tokens) {
  let array = false;
  const base = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.value === '[' && token.kind === 'symbol') {
      const end = tokens.findIndex((candidate, index) => index > i && candidate.kind === 'symbol' && candidate.value === ']');
      if (end < 0 || tokens.slice(i + 1, end).some(candidate => candidate.kind !== 'symbol' || !/[0-9:+-]/.test(candidate.value))) return null;
      array = true; i = end; continue;
    }
    if (paraula(token, 'array')) { array = true; continue; }
    if (token.value === '(' && token.kind === 'symbol') {
      const end = tokens.findIndex((candidate, index) => index > i && candidate.kind === 'symbol' && candidate.value === ')' && candidate.depth === token.depth);
      if (end < 0) return null;
      // FLOAT(p) és l'excepció: p tria float4/float8, no és un typmod.
      if (base.length === 1 && paraula(base[0], 'float')) {
        const precision = tokens.slice(i + 1, end).map(candidate => candidate.value).join('');
        if (!/^\d+$/.test(precision) || Number(precision) < 1 || Number(precision) > 53) return null;
        base[0] = { ...base[0], value: Number(precision) <= 24 ? 'float4' : 'float8', paraulaClau: true };
      }
      i = end; continue;
    }
    base.push(token);
  }
  let type;
  if (base.length === 3 && identificador(base[0]) && base[1].kind === 'symbol' && base[1].value === '.' && identificador(base[2])) {
    const [schema, name] = [base[0].value, base[2].value];
    if (schema === 'pg_catalog' && TIPUS_INTERNS.has(name)) type = `pg_catalog.${name}`;
    else if (schema === 'pg_catalog' && name.startsWith('_') && TIPUS_INTERNS.has(name.slice(1))) { type = `pg_catalog.${name.slice(1)}`; array = true; }
    else type = JSON.stringify([schema, name]);
  } else if (base.length === 1 && identificador(base[0])) {
    const { kind, value, paraulaClau } = base[0];
    const name = kind === 'word' ? ALIES_TIPUS.get(value) ?? value : value;
    const clau = paraulaClau || kind === 'word' && (ALIES_TIPUS.has(value) || TIPUS_PARAULA_CLAU.has(value));
    if (!clau && (TIPUS_OMBREJATS.has(value) || value.startsWith('_') && TIPUS_OMBREJATS.has(value.slice(1)))) type = null;
    else if (TIPUS_INTERNS.has(name)) type = `pg_catalog.${name}`;
    else if (name.startsWith('_') && TIPUS_INTERNS.has(name.slice(1))) { type = `pg_catalog.${name.slice(1)}`; array = true; }
  } else if (base.every(token => token.kind === 'word')) {
    const words = base.map(token => token.value).join(' ');
    const name = ALIES_TIPUS.get(words);
    if (name) type = `pg_catalog.${name}`;
    else if (/^interval (?:year|month|day|hour|minute|second)(?: to (?:month|day|hour|minute|second))?$/.test(words)) type = 'pg_catalog.interval';
  }
  return type ? `${type}${array ? '[]' : ''}` : null;
}

function tipusEntrada(tokens) {
  const groups = [[]];
  for (const token of tokens) {
    if (token.kind === 'symbol' && token.value === ',' && token.depth === 1) groups.push([]);
    else groups.at(-1).push(token);
  }
  if (groups.length === 1 && groups[0].length === 0) return [];
  const result = [];
  for (const group of groups) {
    const defaultAt = group.findIndex(token => token.depth === 1 && (paraula(token, 'default') || token.kind === 'symbol' && token.value === '='));
    const declaration = defaultAt < 0 ? [...group] : group.slice(0, defaultAt);
    const modeAt = declaration.findIndex((token, index) => index < 2 && token.kind === 'word' && ['in', 'out', 'inout', 'variadic'].includes(token.value));
    const mode = modeAt < 0 ? 'in' : declaration.splice(modeAt, 1)[0].value;
    if (mode === 'out') continue; // PG identifica la sobrecàrrega pels arguments d'entrada.
    const type = tipusArgument(declaration) ?? (identificador(declaration[0]) ? tipusArgument(declaration.slice(1)) : null);
    if (!type) return null;
    result.push(type);
  }
  return result;
}

const clauFuncio = (relation, types) => JSON.stringify([relation.schema, relation.table, types]);
const nomFuncio = (relation, types) => `${relation.schema === null ? '' : `${relation.schema}.`}${relation.table}(${types?.map(type => type.replace(/^pg_catalog\./, '')).join(',') ?? '?'})`;
function capcaleraFuncio(statement, mode = 'create') {
  const { tokens, valid } = tokensDeFuncio(statement);
  let cursor = 0;
  if (!paraula(tokens[cursor++], mode)) return null;
  if (mode === 'create' && paraula(tokens[cursor], 'or') && paraula(tokens[cursor + 1], 'replace')) cursor += 2;
  // R32 · Un CREATE PROCEDURE … SECURITY DEFINER també corre amb els drets del
  // propietari: R6 l'avalua com una funció. En PostgreSQL (verificat en PGlite
  // 17.5) comparteix l'espai d'identitats de pg_proc i els OUT no en formen
  // part, així que la clau és la mateixa. ALTER/DROP PROCEDURE continuen fora
  // del subconjunt: el seu ALTER de seguretat o ruta falla tancat més avall.
  const procediment = mode === 'create' && paraula(tokens[cursor], 'procedure');
  if (!paraula(tokens[cursor], 'function') && !procediment && !(mode !== 'create' && paraula(tokens[cursor], 'routine'))) return null;
  cursor++;
  if (mode === 'drop' && paraula(tokens[cursor], 'if') && paraula(tokens[cursor + 1], 'exists')) cursor += 2;
  if (!identificador(tokens[cursor])) return null;
  const first = tokens[cursor++].value;
  // R32 · ronda 2 · Sense esquema, PostgreSQL resol el nom amb el search_path
  // de la SESSIÓ (pg_catalog implícit primer; a Supabase, "$user", public,
  // extensions), no amb public. Eixa ruta no és acreditable estàticament: la
  // canvien camins fora del subconjunt (UPDATE pg_settings, ALTER SYSTEM, una
  // funció amb SET cridada abans, SQL dinàmic, un esquema amb el nom del rol).
  // Per això schema = null: «esquema no acreditat», mai «public».
  let relation = { schema: null, table: first };
  const qualificat = tokens[cursor]?.value === '.' && identificador(tokens[cursor + 1]);
  if (qualificat) {
    relation = { schema: first, table: tokens[cursor + 1].value }; cursor += 2;
  }
  if (tokens[cursor] && tokens[cursor].value !== '(' && tokens[cursor].kind !== 'word') return null;
  let types = null;
  const omitted = tokens[cursor]?.value !== '(';
  if (!omitted) {
    const args = cursor++;
    const endArgs = tokens.findIndex((token, index) => index > args && token.kind === 'symbol' && token.value === ')' && token.depth === 0);
    if (endArgs < 0) return null;
    types = tipusEntrada(tokens.slice(cursor, endArgs));
    cursor = endArgs + 1;
  } else if (mode === 'create') return null;
  const outside = tokens.slice(cursor).filter(token => token.depth === 0);
  const body = outside.findIndex((token, index) => paraula(token, 'return') || paraula(token, 'begin') && paraula(outside[index + 1], 'atomic'));
  const header = body < 0 ? outside : outside.slice(0, body);
  return { nom: relation.table, relation, qualificat, types, omitted, header, valid,
    bodyStandard: body >= 0, reemplaca: mode === 'create' && paraula(tokens[1], 'or'),
    key: types === null ? null : clauFuncio(relation, types), signature: nomFuncio(relation, types) };
}

/* R32 · ronda 2 · Primera definer insegura coneguda que un nom sense esquema
 * PODRIA designar en PostgreSQL: el mateix nom en QUALSEVOL esquema (la ruta de
 * sessió no s'acredita, i un DROP IF EXISTS que no troba res en la ruta real és
 * un no-op que deixa viva la de public) i, si la referència resol els tipus, els
 * mateixos tipus; sense tipus resolts (o amb la llista omesa), qualsevol
 * sobrecàrrega. Un sol recorregut amb comparacions barates primer. */
const insegura = record => record.definer && !record.segur;
function protegidaSenseEsquema(estat, referencia) {
  const tipus = referencia.types === null ? null : JSON.stringify(referencia.types);
  for (const record of estat.values()) {
    if (!insegura(record) || record.relation?.table !== referencia.relation.table) continue;
    if (tipus === null || record.tipusClau === null || record.tipusClau === tipus) return record;
  }
  return null;
}
const motiuR6 = funcio => `Funció security definer ${funcio.signature} ${funcio.bodyStandard ? 'té un cos SQL estàndard RETURN/BEGIN ATOMIC fora del subconjunt estàtic admés'
  : funcio.identitat ? 'no té una única assignació explícita de search_path buit a la capçalera vigent'
    : 'té una identitat de tipus no suportada; no es pot acreditar la capçalera vigent'}.`;

function configuracioPath(header) {
  const paths = [];
  for (let i = 0; i < header.length; i++) {
    // Identificadors Unicode U&"..." no formen part del subconjunt de GUC:
    // no es poden confondre amb un SET innocu que deixe intacta la ruta.
    if (paraula(header[i], 'set') && paraula(header[i + 1], 'u') && header[i + 2]?.value === '&') paths.push(false);
    if (!paraula(header[i], 'set') || !['word', 'identifier'].includes(header[i + 1]?.kind)
      || header[i + 1].value.toLowerCase() !== 'search_path') continue;
    const operator = header[i + 2], value = header[i + 3], next = header[i + 4];
    const assignment = operator?.kind === 'symbol' && operator.value === '=' || paraula(operator, 'to');
    const boundary = !next || next.kind === 'word' && OPCIONS_FUNCIO.has(next.value);
    paths.push(assignment && value?.kind === 'literal' && value.value === '' && boundary);
  }
  const resets = header.filter((token, index) => paraula(token, 'reset')
    && (paraula(header[index + 1], 'all') || ['word', 'identifier'].includes(header[index + 1]?.kind)
      && header[index + 1].value.toLowerCase() === 'search_path')).length;
  return { present: paths.length + resets > 0, segur: paths.length === 1 && paths[0] === true && resets === 0 };
}

/* R32 · P2 · Camins que PostgreSQL no aplica com suposa el model d'estat.
 * Són deteccions conservadores, per tokens o per paraules i sempre lineals:
 * cap regex amb quantificadors imbricats ni retrocés. Les codificacions
 * (chr(), decode(), escapes E'\…') continuen fora del subconjunt estàtic i
 * l'autoritat és PostgreSQL/PGlite (tests/r31-definer-search-path.test.mjs). */
const RUTINES = new Set(['function', 'procedure', 'routine']);
const MAX_NIVELL_DINAMIC = 4;

/* (b) set_config('search_path', …) és un SET de sessió per una altra porta:
 * canvia l'esquema on PostgreSQL resol un DROP/ALTER sense qualificar. Un nom
 * de paràmetre que no és un literal pur tampoc es pot descartar. */
function setConfigR6(tokens) {
  for (let k = 0; k < tokens.length; k++) {
    const nom = tokens[k];
    if (!(paraula(nom, 'set_config') || nom.kind === 'identifier' && nom.value === 'set_config')) continue;
    const obri = tokens[k + 1];
    if (obri?.kind !== 'symbol' || obri.value !== '(') continue;
    const argument = [];
    for (let j = k + 2; j < tokens.length; j++) {
      const token = tokens[j];
      if (token.kind === 'symbol' && (token.value === ',' && token.depth === obri.depth + 1 || token.value === ')' && token.depth === obri.depth)) break;
      argument.push(token);
    }
    if (argument.some(token => token.kind === 'literal' && token.value.toLowerCase() === 'search_path')) return 'search_path';
    // Només un nom de GUC net: E'search\x5fpath' o U&'search\005fpath' no es descodifiquen ací.
    if (argument.length !== 1 || argument[0].kind !== 'literal' || !/^[a-z0-9_.]+$/i.test(argument[0].value)) return 'no-literal';
  }
  return null;
}

/* (b) dins d'un bloc DO: PL/pgSQL executa el cos en el moment, i un SET/RESET
 * de search_path (també dins d'un EXECUTE '…') persistix per a les sentències
 * següents. segmentsSql lleva els comentaris del cos. Només és opció d'objecte,
 * i no de sessió, el SET que seguix ALTER <objecte> o CREATE [OR REPLACE]
 * FUNCTION|PROCEDURE al mateix segment: una etiqueta <<function>> o una
 * variable «alter» no l'excusen. ALTER ROLE/DATABASE/SYSTEM … SET search_path
 * hi compta com a ruta de sessió (falla tancat). La recursió té un sostre
 * fix: cost lineal en la mida. */
const OBJECTES_ALTER = new Set(('aggregate collation conversion domain extension foreign function index materialized '
  + 'operator procedure routine schema sequence server statistics table text type view').split(' '));
function rutaDeSessioDinamica(cos, nivell = 1) {
  for (const segment of segmentsSql(cos)) {
    const { tokens } = tokensDeFuncio(segment);
    // perform set_config(nom, …): també quan el nom és una variable del bloc.
    if (setConfigR6(tokens)) return true;
    let opcioObjecte = false;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (paraula(token, 'alter') && tokens[i + 1]?.kind === 'word' && OBJECTES_ALTER.has(tokens[i + 1].value)) opcioObjecte = true;
      if (paraula(token, 'create')) {
        const j = paraula(tokens[i + 1], 'or') && paraula(tokens[i + 2], 'replace') ? i + 3 : i + 1;
        if (paraula(tokens[j], 'function') || paraula(tokens[j], 'procedure')) opcioObjecte = true;
      }
      if (!opcioObjecte && (paraula(token, 'set') || paraula(token, 'reset'))) {
        const j = paraula(tokens[i + 1], 'session') || paraula(tokens[i + 1], 'local') ? i + 2 : i + 1;
        if (identificador(tokens[j]) && ['search_path', 'schema', 'all'].includes(tokens[j].value.toLowerCase())) return true;
        if (paraula(tokens[j], 'u') && tokens[j + 1]?.value === '&') return true;
      }
      if (token.kind !== 'literal') continue;
      if (nivell < MAX_NIVELL_DINAMIC) {
        if (rutaDeSessioDinamica(token.value, nivell + 1)) return true;
      } else if (/\b(?:search_path|schema)\b/i.test(token.value)) return true; // Més fons: falla tancat.
    }
  }
  return false;
}

/* (c) SQL dinàmic: el text de TOTS els literals de la sentència (cadena o
 * dòlar, imbricats o concatenats amb ||, també el format() d'un EXECUTE) es
 * llig com un flux de paraules. Un CREATE de rutina seguit de DEFINER, o un
 * ALTER de rutina seguit de DEFINER, SEARCH_PATH o RESET, no és verificable i
 * falla tancat: el model d'estat només veu DDL de nivell superior. El text
 * inert d'una funció invoker ('security definer' sense CREATE/ALTER davant)
 * no hi cau. Els `$` no formen part de la paraula: `$f$create` és «create». */
function sqlDinamicR6(text) {
  const motius = new Set();
  const paraules = [];
  for (const match of text.matchAll(/[a-z_][a-z0-9_]*/gi)) paraules.push(match[0].toLowerCase());
  let creada = false, alterada = false;
  for (let i = 0; i < paraules.length; i++) {
    const p = paraules[i];
    if (p === 'set_config' && paraules[i + 1] === 'search_path') motius.add('search_path de sessió via set_config dins de SQL dinàmic no suportat per a resoldre identitats; cal SQL qualificat i verificació PostgreSQL.');
    if (p === 'create') {
      const j = paraules[i + 1] === 'or' && paraules[i + 2] === 'replace' ? i + 3 : i + 1;
      if (paraules[j] === 'function' || paraules[j] === 'procedure') creada = true;
    }
    if (p === 'alter' && RUTINES.has(paraules[i + 1])) alterada = true;
    if (p === 'definer' && (creada || alterada)) motius.add('SQL dinàmic amb SECURITY DEFINER no verificable estàticament; cal DDL de rutina de nivell superior o verificació PostgreSQL/PGlite.');
    if ((p === 'search_path' || p === 'reset') && alterada) motius.add('SQL dinàmic que altera el search_path d\'una rutina no verificable estàticament; cal ALTER de nivell superior o verificació PostgreSQL/PGlite.');
  }
  return motius;
}

function estatFuncionsR6(statement, file, estat, posicio) {
  // La resolució amb un search_path de sessió arbitrari queda fora del
  // subconjunt: podria canviar tant l'esquema implícit com un tipus shadowed.
  const { tokens: tots } = tokensDeFuncio(statement);
  const session = tots.filter(token => token.depth === 0);
  const sessionOption = paraula(session[1], 'local') || paraula(session[1], 'session') ? 2 : 1;
  if ((paraula(session[0], 'set') || paraula(session[0], 'reset'))
    && (identificador(session[sessionOption]) && ['search_path', 'schema', 'all'].includes(session[sessionOption].value.toLowerCase())
      || paraula(session[sessionOption], 'u') && session[sessionOption + 1]?.value === '&')) {
    falla('R6', file, 'search_path de sessió no suportat per a resoldre identitats; cal SQL qualificat i verificació PostgreSQL.');
  }
  // R32 · P2 (b): select [pg_catalog.]set_config('search_path', …) és el mateix SET.
  const setConfig = setConfigR6(tots);
  if (setConfig === 'search_path') falla('R6', file, 'search_path de sessió via set_config no suportat per a resoldre identitats; cal SQL qualificat i verificació PostgreSQL.');
  else if (setConfig) falla('R6', file, 'set_config amb un nom de paràmetre que no és un literal pur: no es pot descartar un search_path de sessió; cal SQL qualificat i verificació PostgreSQL.');
  // ALTER ROLE|USER|DATABASE … SET/RESET search_path canvia la ruta de les
  // sessions següents (també la de la migració que ve després).
  if (paraula(session[0], 'alter') && ['role', 'user', 'database', 'system'].some(objecte => paraula(session[1], objecte))
    && session.some((token, index) => (paraula(token, 'set') || paraula(token, 'reset')) && identificador(session[index + 1])
      && ['search_path', 'all'].includes(session[index + 1].value.toLowerCase()))) {
    falla('R6', file, 'search_path per defecte de rol o de base de dades no suportat per a resoldre identitats; cal SQL qualificat i verificació PostgreSQL.');
  }
  if (paraula(session[0], 'do') && session.some(token => token.kind === 'literal' && rutaDeSessioDinamica(token.value))) {
    falla('R6', file, 'search_path de sessió dins d\'un bloc DO no suportat per a resoldre identitats; cal SQL qualificat i verificació PostgreSQL.');
  }
  // R32 · P2 (c): SQL dinàmic amb DEFINER o search_path de rutina.
  for (const motiu of sqlDinamicR6(tots.filter(token => token.kind === 'literal').map(token => token.value).join('\n'))) falla('R6', file, motiu);
  const create = capcaleraFuncio(statement);
  if (create) {
    const definer = create.header.some((token, index) => paraula(token, 'security') && paraula(create.header[index + 1], 'definer'));
    // R32 · ronda 2 · Una signatura no resolta té una identitat pròpia i
    // ESTABLE (fitxer + posició de la sentència), que no depén de la mida del
    // mapa: un DROP intermedi no fa que el CREATE d'una altra rutina reutilitze
    // la clau i sobreescriga el diagnòstic (en pg_proc són dues entrades).
    const key = create.key ?? JSON.stringify(['desconeguda', file, posicio]);
    const record = { key, nom: create.nom, signature: create.signature, relation: create.relation, types: create.types,
      tipusClau: create.types === null ? null : JSON.stringify(create.types), file, definer, bodyStandard: create.bodyStandard,
      segur: create.valid && !create.bodyStandard && create.key !== null && configuracioPath(create.header).segur,
      identitat: create.key !== null };
    if (!create.qualificat) {
      // Sense esquema, el CREATE OR REPLACE pot reemplaçar la rutina d'un altre
      // esquema o crear-ne una de nova al costat: mai retira la protecció d'una
      // definer coneguda. I la rutina creada no entra a l'estat: cap operació
      // posterior la pot designar amb certesa (ni qualificada, perquè no se
      // sap en quin esquema ha caigut, ni sense esquema, que mai muta l'estat),
      // així que el seu veredicte és el del CREATE i es dicta ara.
      const protegida = create.reemplaca && protegidaSenseEsquema(estat, create);
      if (protegida) falla('R6', file, `CREATE OR REPLACE ${create.signature} sense esquema: PostgreSQL el resol amb el search_path de la sessió, que no s'acredita estàticament; no es retira la protecció de ${protegida.signature}. Qualifica l'esquema.`);
      if (insegura(record)) falla('R6', file, motiuR6(record));
      return;
    }
    estat.set(key, record);
    return;
  }
  if (/^\s*create\s+(?:or\s+replace\s+)?(?:function|procedure)\b/i.test(statement)
    && session.some((token, index) => paraula(token, 'security') && paraula(session[index + 1], 'definer'))) {
    falla('R6', file, 'CREATE SECURITY DEFINER amb identitat o gramàtica no suportada.');
    return;
  }
  const alter = capcaleraFuncio(statement, 'alter');
  if (alter && !alter.qualificat) {
    // R32 · ronda 2 · Un ALTER sense esquema no s'aplica mai a l'estat: pot
    // caure en una altra rutina de la ruta real (o en cap) i deixar intacta la
    // definer coneguda. Si toca seguretat, ruta o identitat, falla tancat.
    const mou = alter.header.some((token, index) => paraula(token, 'rename') && paraula(alter.header[index + 1], 'to')
      || paraula(token, 'set') && paraula(alter.header[index + 1], 'schema'));
    if (configuracioPath(alter.header).present || alter.header.some(token => paraula(token, 'security')) || mou) {
      const protegida = protegidaSenseEsquema(estat, alter);
      falla('R6', file, `ALTER ${alter.signature} sense esquema: PostgreSQL el resol amb el search_path de la sessió, que no s'acredita estàticament; no s'aplica cap canvi de seguretat, de ruta ni d'identitat${protegida ? ` (${protegida.signature} continua sent la definer insegura que era)` : ''}. Qualifica l'esquema.`);
    }
    return;
  }
  if (alter) {
    const candidates = alter.omitted ? [...estat.values()].filter(record => record.relation?.schema === alter.relation.schema && record.relation.table === alter.relation.table) : [];
    const key = alter.omitted && candidates.length === 1 ? candidates[0].key : alter.key;
    const before = key && estat.get(key);
    const config = configuracioPath(alter.header);
    const security = alter.header.findIndex(token => paraula(token, 'security'));
    if ((!alter.valid || !key || !before) && (config.present || security >= 0)) {
      falla('R6', file, `ALTER ${alter.signature}: identitat absent, ambigua o no suportada; no s'assumix SECURITY INVOKER.`);
      return;
    }
    if (!before) return;
    const current = { ...before, file };
    if (security >= 0) {
      if (paraula(alter.header[security + 1], 'definer')) current.definer = true;
      else if (paraula(alter.header[security + 1], 'invoker')) current.definer = false;
    }
    if (config.present) current.segur = alter.valid && !current.bodyStandard && config.segur;
    const rename = alter.header.findIndex((token, index) => paraula(token, 'rename') && paraula(alter.header[index + 1], 'to'));
    const schema = alter.header.findIndex((token, index) => paraula(token, 'set') && paraula(alter.header[index + 1], 'schema'));
    if (rename >= 0 || schema >= 0) {
      const target = alter.header[(rename >= 0 ? rename : schema) + 2];
      if (!identificador(target) || !current.types || alter.header.length !== 3) {
        falla('R6', file, `ALTER ${alter.signature}: moviment d'identitat no suportat.`);
        return;
      }
      const relation = { schema: schema >= 0 ? target.value : current.relation.schema, table: rename >= 0 ? target.value : current.relation.table };
      const newKey = clauFuncio(relation, current.types);
      estat.delete(key);
      estat.set(newKey, { ...current, key: newKey, relation, signature: nomFuncio(relation, current.types), nom: relation.table });
    } else estat.set(key, current);
    return;
  }
  if (/^\s*alter\s+(?:function|routine|procedure)\b/i.test(statement)) {
    const { tokens } = tokensDeFuncio(statement);
    if (configuracioPath(tokens.filter(token => token.depth === 0)).present || tokens.some(token => paraula(token, 'security'))) {
      falla('R6', file, 'ALTER de funció/rutina/procediment amb identitat o gramàtica no suportada.');
    }
  }
  const drop = /^\s*drop\s+(?:function|routine)\s+(?:if\s+exists\s+)?/i.exec(statement);
  if (drop) for (const part of segmentsSql(statement.slice(drop[0].length), ',')) {
    const parsed = capcaleraFuncio(`drop function ${part}`, 'drop');
    if (!parsed?.valid) continue;
    if (parsed.header.length && !(parsed.header.length === 1 && (paraula(parsed.header[0], 'cascade') || paraula(parsed.header[0], 'restrict')))) {
      falla('R6', file, `DROP ${parsed.signature}: gramàtica no suportada; no es retira la protecció de la funció coneguda.`);
      continue;
    }
    // R32 · ronda 2 · Sense esquema no s'esborra MAI res de l'estat: si la
    // ruta real no troba la rutina, DROP IF EXISTS és un no-op i la definer de
    // public continua viva (PGlite 17: pg_settings, ALTER SYSTEM, "$user"…).
    if (!parsed.qualificat) {
      const protegida = protegidaSenseEsquema(estat, parsed);
      if (protegida) falla('R6', file, `DROP ${parsed.signature} sense esquema: PostgreSQL el resol amb el search_path de la sessió, que no s'acredita estàticament; no es retira la protecció de ${protegida.signature}. Qualifica l'esquema.`);
      continue;
    }
    if (parsed.key) estat.delete(parsed.key);
    else if (parsed.omitted) {
      const candidates = [...estat.values()].filter(record => record.relation?.schema === parsed.relation.schema && record.relation.table === parsed.relation.table);
      if (candidates.length === 1) estat.delete(candidates[0].key);
    }
  }
}

const SQL_IDENTIFIER = String.raw`(?:"(?:[^"]|"")+"|[a-zA-Z_][a-zA-Z0-9_$]*)`;
const RE_SQL_RELATION = new RegExp(`^\\s*(${SQL_IDENTIFIER})(?:\\s*\\.\\s*(${SQL_IDENTIFIER}))?(?=\\s|\\(|[,*]|$)`);
const sqlIdentifier = (raw) => raw.startsWith('"')
  ? raw.slice(1, -1).replace(/""/g, '"')
  : raw.toLowerCase();

/** CREATE i ALTER compartixen la caixa i els escapaments dels identificadors. */
function sqlRelation(text) {
  const match = RE_SQL_RELATION.exec(text);
  if (!match) return null;
  return {
    schema: match[2] ? sqlIdentifier(match[1]) : 'public',
    table: sqlIdentifier(match[2] ?? match[1]),
    rest: text.slice(match[0].length),
  };
}

/* R2: DDL de nivell superior. La mateixa segmentació respecta literals,
 * identificadors, dollar-quotes i parèntesis en sentències i llistes d'accions.
 * No valida tota la gramàtica PostgreSQL ni interpreta SQL dinàmic.
 */
function accionsRls(statement) {
  const prefix=/^\s*alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?/i.exec(statement);
  if(!prefix)return [];
  const relation=sqlRelation(statement.slice(prefix[0].length));
  if(!relation)return [];
  // PostgreSQL admet l'asterisc de descendència després de la relació.
  const body=relation.rest.replace(/^\s*\*/, '');
  return segmentsSql(body,',').flatMap(part=>{
    const action=/^\s*(enable|disable)\s+row\s+level\s+security\s*$/i.exec(part);
    return action ? [{schema:relation.schema,table:relation.table,enabled:action[1].toLowerCase()==='enable'}] : [];
  });
}

function creacioTaula(statement) {
  const prefix=/^\s*create\s+(?:unlogged\s+)?table\s+(if\s+not\s+exists\s+)?/i.exec(statement);
  const relation=prefix&&sqlRelation(statement.slice(prefix[0].length));
  return relation ? {...relation,ifNotExists:!!prefix[1]} : null;
}

function taulesRetirades(statement) {
  const prefix=/^\s*drop\s+table\s+(?:if\s+exists\s+)?/i.exec(statement);
  if(!prefix)return [];
  const parts=segmentsSql(statement.slice(prefix[0].length),',');
  const relations=parts.map(part=>sqlRelation(part));
  // CASCADE/RESTRICT només pot tancar la llista, no és part d'un nom quoted.
  if(relations.some((relation,i)=>!relation||!(i===parts.length-1
    ? /^\s*(?:cascade|restrict)?\s*$/i : /^\s*$/).test(relation.rest)))return [];
  return relations;
}

/* R2 · Una relació que canvia de nom o d'esquema s'endú el seu estat RLS (en
 * PostgreSQL, ALTER TABLE … RENAME TO i SET SCHEMA conserven la RLS de la
 * taula), i DROP SCHEMA retira totes les de l'esquema. Sense açò, un
 * CREATE TABLE IF NOT EXISTS posterior amb el nom antic heretaria l'«activat»
 * d'una taula que ja no és eixa (Gauntlet O4, D6-05). Un nom que no s'entén
 * retira l'origen i deixa el destí desconegut: el CREATE torna a exigir ENABLE.
 */
function canvisDeRelacio(statement) {
  const alter=/^\s*alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?/i.exec(statement);
  if(alter) {
    const relation=sqlRelation(statement.slice(alter[0].length));
    if(!relation)return [];
    const body=relation.rest.replace(/^\s*\*/, '');
    const rename=/^\s*rename\s+to\s+/i.exec(body);
    const esquema=!rename&&/^\s*set\s+schema\s+/i.exec(body);
    if(!rename&&!esquema)return [];
    const nom=sqlRelation(body.slice((rename||esquema)[0].length));
    const net=nom&&/^\s*$/.test(nom.rest)&&(esquema||nom.schema==='public'&&!/\./.test(body.slice(rename[0].length)));
    const desti=!net ? null
      : rename ? {schema:relation.schema,table:nom.table} : {schema:nom.table,table:relation.table};
    return [{tipus:'mou',des:relation,a:desti}];
  }
  const drop=/^\s*drop\s+schema\s+(?:if\s+exists\s+)?/i.exec(statement);
  if(!drop)return [];
  const parts=segmentsSql(statement.slice(drop[0].length),',');
  return parts.map(part=>sqlRelation(part)).filter(Boolean).map(relation=>({tipus:'esquema',schema:relation.table}));
}

/* R3 · exempcions declarades. Contingut públic per disseny, no dades de persones. */
const R3_EXEMPTES = new Set(['towns', 'app_content']);

const RE_POLITICA = /^\s*create\s+policy\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z0-9_]+))\s+on\s+(?:(?:public|storage|private|realtime)\s*\.\s*)?([a-zA-Z0-9_]+)/i;
// Taula gestionada pel servei, verificada al catàleg abans d'aplicar la política.
// No s'exempta l'esquema: qualsevol altra realtime.* continua requerint DDL.
const TAULES_DEL_SERVEI = new Set(['realtime.messages']);
// Taula d'autenticació gestionada per GoTrue on només s'admeten disparadors interns (mai CREATE POLICY des de migracions).
const TAULES_TRIGGER_DEL_SERVEI = new Set(['auth.users']);
const RE_USING_TRUE = /\busing\s*\(\s*true\s*\)/i;
const RE_CHECK_TRUE = /\bwith\s+check\s*\(\s*true\s*\)/i;

const sqlDir = 'supabase';
let infr = [];
let tables = new Set();
let views = new Set();
let policies = [];
let grants = [];

function falla(llei, on, detall) {
  infr.push({ llei, on, detall });
}

function scanFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...scanFiles(full));
    else if (full.endsWith('.sql')) files.push(full);
  }
  return files;
}

// La cronologia mixta de 10/14 xifres i les restriccions declarades són les
// del mateix verificador que executa el catàleg, no l'ordre lexicogràfic.
function ordreFontsSql(files) {
  const cronologic = (a, b) => {
    const av = /^(\d{10}|\d{14})_/.exec(path.basename(a))?.[1];
    const bv = /^(\d{10}|\d{14})_/.exec(path.basename(b))?.[1];
    if (av && bv) return comparaVersions(av, bv) || a.localeCompare(b);
    return av ? -1 : bv ? 1 : a.localeCompare(b);
  };
  const stable = [...files].sort(cronologic);
  const sources = stable.filter(file => path.dirname(file) === path.join(sqlDir, 'migrations'));
  // R32 · seed.sql, snippets/ i sql/ no són el catàleg: la CLI aplica el seed
  // després de les migracions i només en local, els snippets són d'ús manual i
  // sql/ és referència (Node 0) que no s'aplica a Producció. Van DESPRÉS del
  // catàleg i en mode ADDITIU (vegeu el bucle principal): poden afegir
  // infraccions R2/R6, però mai retirar-ne cap de les migracions. Sense
  // supabase/migrations/ (fixtures plans), tot és catàleg en l'ordre
  // cronològic estable de sempre.
  if (!sources.length) return { base: stable, posteriors: [] };
  const posteriors = stable.filter(file => !sources.includes(file));
  const orderFile = path.join(sqlDir, 'ordre_desplegament.json');
  if (!fs.existsSync(orderFile)) return { base: sources, posteriors };
  const byVersion = new Map(sources.map(file => [versioDeFitxer(path.basename(file)), file]));
  if (byVersion.size !== sources.length) throw new Error('R6: versions SQL duplicades');
  const versions = [...byVersion.keys()];
  const declared = llegixOrdre(fs.readFileSync(orderFile, 'utf8'), new Set(versions));
  const dependencies = new Map([...byVersion].map(([version, file]) => [version,
    dependenciesDeclarades(capcalera(fs.readFileSync(file, 'utf8')), version).filter(dependency => comparaVersions(dependency.versio, version) < 0).map(dependency => dependency.versio)]));
  const plan = ordena({ versions, dependencies, restriccions: declared.restriccions, portes: declared.portes });
  if (plan.errors.length) throw new Error(`R6: ordre SQL inconsistent: ${plan.errors.map(error => error.missatge).join('; ')}`);
  return { base: plan.ordre.filter(step => step.tipus === 'migracio').map(step => byVersion.get(step.id)), posteriors };
}
const fonts = ordreFontsSql(scanFiles(sqlDir));
const files = [...fonts.base, ...fonts.posteriors];
const posteriors = new Set(fonts.posteriors);
// Estat FINAL del catàleg: només les migracions (o tot, en un fixture pla).
// Cap fitxer posterior hi escriu; cadascun treballa sobre una còpia pròpia.
const estatRlsFinal = new Map();
const estatDefinerFinal = new Map();
const avaluacionsPosteriors = [];
const r2Reportades = new Set();
// R32 · P2 (a): ROLLBACK [TO SAVEPOINT] / ABORT de nivell superior desfà DDL
// que el model d'estat creuria aplicat (un DROP o un REPLACE que «arregla»).
const RE_DESFA = /^\s*(?:rollback|abort)\b/i;
const RE_DDL_RUTINA = /^\s*(?:create\s+(?:or\s+replace\s+)?(?:function|procedure)|alter\s+(?:function|procedure|routine)|drop\s+(?:function|procedure|routine))\b/i;
const RE_CREA_TIPUS = /^\s*create\s+(?:type|domain)\s+/i;

/* R32 · ronda 2 · Zero ReDoS a les regles heretades R1 (trigger), R5 (grant),
 * R7/R8 (create function … security definer i revoke). Les regexes originals,
 * que es citen a cada funció, eren quadràtiques amb 200.000 caràcters
 * patològics (5,7 s, 1,1 s, 0,9 s i 0,65 s): cada intent travessava el fitxer
 * fins al pròxim `;`, `)` o fi de tram. Estes funcions en reproduïxen
 * EXACTAMENT les captures (mateixos blocs, noms, ordre i lastIndex, també els
 * retrocessos estranys) amb cerques ancorades i índexs ordenats: cost
 * O(n log n). L'equivalència s'ha comprovat amb fuzzing contra les originals. */
const RE_PARAULA_SQL = /[a-zA-Z0-9_]+/y;
const RE_ESQUEMA_ADMIN = /public\.|private\./iy;
const RE_ESPAIS = /\s*/y;
function paraulaEn(text, posicio) { RE_PARAULA_SQL.lastIndex = posicio; return RE_PARAULA_SQL.exec(text)?.[0] ?? ''; }
function espaisDes(text, posicio) { RE_ESPAIS.lastIndex = posicio; RE_ESPAIS.exec(text); return RE_ESPAIS.lastIndex; }
function ancorat(regex, text, posicio) { regex.lastIndex = posicio; return regex.test(text) ? regex.lastIndex : -1; }
// Primer índex d'un vector ordenat amb valor >= x (cerca binària).
function primerDesDe(posicions, x) {
  let lo = 0, hi = posicions.length;
  while (lo < hi) { const mig = (lo + hi) >> 1; if (posicions[mig] < x) lo = mig + 1; else hi = mig; }
  return lo;
}
const posicionsDe = (text, regex) => Array.from(text.matchAll(regex), match => match.index);
// Primera `)` des d'una posició. Amb consultes creixents (el cas d'R5 i R8)
// reaprofita l'última cerca: cost lineal total, no un indexOf per intent.
function seguentTancament(text) {
  let ultima = -2, des = 0;
  return posicio => {
    if (ultima === -2 || posicio < des || ultima >= 0 && ultima < posicio) { ultima = text.indexOf(')', posicio); des = posicio; }
    return ultima;
  };
}

/* /create trigger [a-zA-Z0-9_]+ (?:after|before) [a-zA-Z0-9_ ]+ on (?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi
 * El tram [a-zA-Z0-9_ ]+ és golut: el ` on ` vàlid és l'ÚLTIM del tram seguit
 * d'una lletra de nom, amb almenys un caràcter abans. */
const RE_MOMENT_TRIGGER = /(?:after|before) /iy;
const RE_TRAM_TRIGGER = /[a-zA-Z0-9_ ]+/y;
function triggersR1(content) {
  const trobats = [];
  const inici = /create trigger /gi;
  let ons = null, tramDes = -1, tramFi = -1, match;
  while ((match = inici.exec(content)) !== null) {
    let trobat = null;
    const nom = paraulaEn(content, inici.lastIndex);
    const espai = inici.lastIndex + nom.length;
    const t = nom && content[espai] === ' ' ? ancorat(RE_MOMENT_TRIGGER, content, espai + 1) : -1;
    if (t >= 0) {
      if (!(t >= tramDes && t < tramFi)) { tramDes = t; tramFi = Math.max(t, ancorat(RE_TRAM_TRIGGER, content, t)); }
      ons ??= posicionsDe(content, /(?= on [a-zA-Z0-9_])/gi);
      const v = ons[primerDesDe(ons, tramFi - 4) - 1];
      if (v !== undefined && v >= t + 1) {
        const primera = paraulaEn(content, v + 4);
        const segona = content[v + 4 + primera.length] === '.' ? paraulaEn(content, v + 5 + primera.length) : '';
        trobat = segona ? { schema: primera, table: segona, fi: v + 5 + primera.length + segona.length }
          : { schema: undefined, table: primera, fi: v + 4 + primera.length };
      }
    }
    if (trobat) { trobats.push(trobat); inici.lastIndex = trobat.fi; } else inici.lastIndex = match.index + 1;
  }
  return trobats;
}

/* /grant\s+(insert|update|delete|select)(?:\s+\([^)]+\))?\s+on\s+(?:table\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi */
const RE_ON_GRANT = /on/iy, RE_TABLE_GRANT = /table/iy, RE_PUBLIC_GRANT = /public\./iy;
function grantsR5(content) {
  const trobats = [];
  const inici = /grant\s+(insert|update|delete|select)/gi;
  const tancament = seguentTancament(content);
  const cues = new Map();
  // \s+on\s+(?:table\s+)?(?:public\.)?([a-zA-Z0-9_]+) des d'una posició (memoritzat:
  // diverses capçaleres poden compartir la mateixa `)` i, per tant, la mateixa cua).
  const cua = posicio => {
    if (cues.has(posicio)) return cues.get(posicio);
    let resultat = null;
    const a = espaisDes(content, posicio);
    const b = a > posicio ? ancorat(RE_ON_GRANT, content, a) : -1;
    const c = b >= 0 ? espaisDes(content, b) : -1;
    if (c > b && b >= 0) {
      const taula = ancorat(RE_TABLE_GRANT, content, c);
      const d = taula >= 0 ? espaisDes(content, taula) : -1;
      for (const x of d > taula && taula >= 0 ? [d, c] : [c]) {
        const p = ancorat(RE_PUBLIC_GRANT, content, x);
        for (const z of p >= 0 ? [p, x] : [x]) {
          const nom = paraulaEn(content, z);
          if (nom) { resultat = { table: nom, fi: z + nom.length }; break; }
        }
        if (resultat) break;
      }
    }
    cues.set(posicio, resultat);
    return resultat;
  };
  let match;
  while ((match = inici.exec(content)) !== null) {
    const k0 = inici.lastIndex;
    const k1 = espaisDes(content, k0);
    let trobat = null;
    if (k1 > k0 && content[k1] === '(' && k1 + 1 < content.length && content[k1 + 1] !== ')') {
      const t = tancament(k1 + 1);
      if (t >= 0) trobat = cua(t + 1);
    }
    trobat ??= cua(k0);
    if (trobat) { trobats.push({ type: match[1].toLowerCase(), table: trobat.table }); inici.lastIndex = trobat.fi; } else inici.lastIndex = match.index + 1;
  }
  return trobats;
}

/* /create (?:or replace )?function (?:public\.|private\.)?([a-zA-Z0-9_]+)[^;]+security definer[^;]+;/gi
 * El bloc acaba al primer `;` (J) i hi cal una «security definer» P amb
 * P + 17 <= J. El nom és el més llarg que deixa almenys un caràcter abans de P,
 * primer amb l'esquema i, si no n'hi ha cap, sense (els retrocessos de la regex). */
function blocsDefinerR7(content) {
  const trobats = [];
  const inici = /create (?:or replace )?function /gi;
  let puntsComa = null, definers = null, match;
  while ((match = inici.exec(content)) !== null) {
    const q = inici.lastIndex;
    puntsComa ??= posicionsDe(content, /;/g);
    definers ??= posicionsDe(content, /security definer/gi);
    const j = puntsComa[primerDesDe(puntsComa, q)];
    const p = j === undefined ? undefined : definers[primerDesDe(definers, j - 16) - 1];
    let nom = null;
    if (p !== undefined) {
      const esquema = ancorat(RE_ESQUEMA_ADMIN, content, q);
      for (const a of esquema >= 0 ? [esquema, q] : [q]) {
        const paraula = paraulaEn(content, a);
        const fi = Math.min(a + paraula.length, p - 1);
        if (paraula && fi >= a + 1) { nom = content.slice(a, fi); break; }
      }
    }
    if (nom !== null) { trobats.push({ bloc: content.slice(match.index, j + 1), nom }); inici.lastIndex = j + 1; } else inici.lastIndex = match.index + 1;
  }
  return trobats;
}

/* Noms N (en minúscula) per als quals és certa
 * /revoke (?:execute|all) on function (?:public\.|private\.)?N(?:\([^)]*\))? from public,\s*anon\b/i:
 * N ha de ser la paraula sencera (darrere només hi pot haver `(` o ` from`). */
const RE_COLA_REVOKE = / from public,\s*anon\b/iy;
function revocacionsR8(content) {
  const noms = new Set();
  const tancament = seguentTancament(content);
  for (const match of content.matchAll(/revoke (?:execute|all) on function /gi)) {
    const q = match.index + match[0].length;
    const esquema = ancorat(RE_ESQUEMA_ADMIN, content, q);
    for (const a of esquema >= 0 ? [esquema, q] : [q]) {
      const nom = paraulaEn(content, a);
      if (!nom) continue;
      let k = a + nom.length;
      if (content[k] === '(') { const t = tancament(k); if (t < 0) continue; k = t + 1; }
      if (ancorat(RE_COLA_REVOKE, content, k) >= 0) noms.add(nom.toLowerCase());
    }
  }
  return noms;
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Extract tables created
  /* Onada R24.2 · També les taules temporals de sessió (create temp[orary] table):
     un insert into pg_temp.x d'una taula temporal creada al mateix catàleg no és cap
     taula inexistent. R2 no les toca (no tenen RLS: viuen només dins de la sessió). */
  const createTableRegex = /create (?:temp(?:orary)? )?table (?:if not exists )?(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    tables.add(match[1]);
  }
  // R32 · ronda 2 · Noms de tipus i dominis de l'arbre: ombregen un tipus intern
  // homònim quan la ruta real posa el seu esquema davant de pg_catalog.
  for (const statement of sentencies(content)) {
    const tipus = RE_CREA_TIPUS.exec(statement);
    const relacio = tipus && sqlRelation(statement.slice(tipus[0].length));
    if (relacio) TIPUS_OMBREJATS.add(relacio.table);
  }
}

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  // R1: TAULA-FANTASMA
  // Cap create policy / create trigger / insert into sobre una taula no creada
  const createPolicyRegex = /create policy (?:if not exists )?(?:"[^"]+"|'[a-zA-Z0-9_]+'|[a-zA-Z0-9_]+)\s+on\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)(?:\s+for\s+(select|insert|update|delete|all))?/gi;
  let match;
  while ((match = createPolicyRegex.exec(content)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    const action = (match[3] || 'all').toLowerCase();
    policies.push({ table, file, type: 'policy', action });
    if (schema !== 'storage' && !TAULES_DEL_SERVEI.has(`${schema}.${table}`) && !tables.has(table)) {
      falla('R1', file, `create policy sobre taula inexistent: ${schema}.${table}`);
    }
  }

  for (const trigger of triggersR1(content)) {
    const schema = trigger.schema || 'public';
    const table = trigger.table;
    const taula = `${schema}.${table}`;
    // GoTrue crea auth.users. L'excepció només reconeix la taula per a triggers.
    if (schema !== 'storage' && !TAULES_TRIGGER_DEL_SERVEI.has(taula) && !TAULES_DEL_SERVEI.has(taula) && !tables.has(table)) {
      falla('R1', file, `create trigger sobre taula inexistent: ${schema}.${table}`);
    }
  }

  const insertRegex = /insert into (?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/gi;
  while ((match = insertRegex.exec(content)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    if (schema !== 'storage' && schema !== 'auth' && schema !== 'private' && table !== 'auth' && !tables.has(table)) {
      falla('R1', file, `insert into sobre taula inexistent: ${schema}.${table}`);
    }
  }

  // R32 · Mode additiu: un posterior (seed.sql, snippets/, sql/) treballa sobre
  // una CÒPIA de l'estat final de les migracions. El que hi afig es jutja a
  // part; el que hi retira (DROP, REPLACE invoker, ALTER … SECURITY INVOKER o
  // SET search_path, ENABLE RLS) no toca l'estat del catàleg ni el veredicte.
  const posterior=posteriors.has(file);
  const estatRls=posterior?new Map(estatRlsFinal):estatRlsFinal;
  const estatDefiner=posterior?new Map(estatDefinerFinal):estatDefinerFinal;
  if(posterior)avaluacionsPosteriors.push({file,estatRls,estatDefiner});

  // R2: RLS-ABSENT. CREATE normal reinicia l'estat; IF NOT EXISTS conserva
  // l'existent conegut. DROP el retira i cada acció ALTER s'aplica en ordre.
  const statements=sentencies(content);
  const criadesAlFitxer=new Set();
  for(const statement of statements) {
    const created=creacioTaula(statement);
    if(created) {
      const key=JSON.stringify([created.schema,created.table]);
      if(!created.ifNotExists||!estatRls.has(key)) {
        estatRls.set(key,{schema:created.schema,table:created.table,enabled:false,lastAction:'create',file});
      }
      criadesAlFitxer.add(key);
    }
    for(const action of accionsRls(statement)) {
      estatRls.set(JSON.stringify([action.schema,action.table]),{
        ...action,lastAction:action.enabled?'enable':'disable',file,
      });
    }
    for(const removed of taulesRetirades(statement)) {
      const key=JSON.stringify([removed.schema,removed.table]);
      estatRls.delete(key);
      criadesAlFitxer.delete(key);
    }
    for(const canvi of canvisDeRelacio(statement)) {
      if(canvi.tipus==='esquema') {
        for(const key of [...estatRls.keys()]) if(JSON.parse(key)[0]===canvi.schema) estatRls.delete(key);
        for(const key of [...criadesAlFitxer]) if(JSON.parse(key)[0]===canvi.schema) criadesAlFitxer.delete(key);
        continue;
      }
      const des=JSON.stringify([canvi.des.schema,canvi.des.table]);
      const state=estatRls.get(des);
      const creada=criadesAlFitxer.has(des);
      estatRls.delete(des);
      criadesAlFitxer.delete(des);
      if(!canvi.a)continue;
      const a=JSON.stringify([canvi.a.schema,canvi.a.table]);
      if(state)estatRls.set(a,{...state,schema:canvi.a.schema,table:canvi.a.table,file});
      else estatRls.delete(a);
      if(creada)criadesAlFitxer.add(a);
    }
  }
  // Manté el control de la migració creadora: una activació futura no valida
  // retrospectivament un CREATE que acaba este fitxer sense RLS.
  for(const key of criadesAlFitxer) {
    const state=estatRls.get(key);
    if(state&&!state.enabled&&state.schema!=='private'&&state.schema!=='storage') {
      falla('R2',file,`La taula ${state.schema}.${state.table} no té RLS activat.`);
      r2Reportades.add(JSON.stringify([file,state.schema,state.table]));
    }
  }

  // R3: USING-TRUE — una política per sentència, comentaris fora, sense travessar el `;`.
  const isLegacyExempt = file.includes('2609110600_perfil_avatar_i_permisos.sql');
  for (const st of sentencies(content)) {
    const cap = RE_POLITICA.exec(st);
    if (!cap) continue;
    const nom = cap[1] ?? cap[2];
    const taula = cap[3];
    if (R3_EXEMPTES.has(taula)) continue;
    if (!isLegacyExempt && RE_USING_TRUE.test(st)) {
      falla('R3', file, `using (true) en política "${nom}" sobre ${taula}`);
    }
    if (!isLegacyExempt && RE_CHECK_TRUE.test(st)) {
      falla('R3', file, `with check (true) en política "${nom}" sobre ${taula}`);
    }
  }

  // R4: VISTA-DEFINER — sobre sentències sense comentaris per evitar falsos positius en comentaris (-- create view només...)
  for (const st of sentencies(content)) {
    const viewMatch = /^\s*create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-zA-Z0-9_]+)/i.exec(st);
    if (!viewMatch) continue;
    const viewName = viewMatch[1];
    views.add(viewName);
    if (!st.toLowerCase().includes('security_invoker = true') && !st.toLowerCase().includes('security_invoker=true')) {
      falla('R4', file, `La vista ${viewName} no porta security_invoker = true`);
    }
  }

  // R5: GRANT-ORFE
  for (const grant of grantsR5(content)) grants.push({ ...grant, file });

  // R6: només opcions reals de CREATE FUNCTION, sense text de cos o arguments.
  statements.forEach((statement, posicio) => estatFuncionsR6(statement, file, estatDefiner, posicio));
  // R32 · P2 (a): el model aplica cada DDL de rutina, però PostgreSQL en desfà
  // la part que queda dins d'un ROLLBACK [TO SAVEPOINT]. No s'acredita estat.
  const ddlRutina = statements.filter(statement => RE_DDL_RUTINA.test(statement)).length;
  if (ddlRutina && statements.some(statement => RE_DESFA.test(statement))) {
    falla('R6', file, `ROLLBACK, ROLLBACK TO o ABORT de nivell superior al mateix fitxer que ${ddlRutina} DDL de rutina (CREATE/ALTER/DROP FUNCTION|PROCEDURE|ROUTINE): no s'acredita quina part aplica PostgreSQL; separa la reversió o verifica-ho amb PGlite.`);
  }

  // R7: ADMIN-NULL i R8: ADMIN-ORFE
  let revocats = null;
  for (const { bloc: funcBlock, nom: funcName } of blocsDefinerR7(content)) {
    // R7: ADMIN-NULL
    if (funcName !== 'es_superadmin' && funcBlock.toLowerCase().includes('es_superadmin()') && !funcBlock.toLowerCase().includes('coalesce')) {
      falla('R7', file, `Funció ${funcName} utilitza es_superadmin() sense COALESCE, risc de falla NULL.`);
    }

    // R8/R9: ADMIN-ORFE
    if (funcName !== 'es_superadmin' && funcBlock.toLowerCase().includes('es_superadmin()')) {
      // R15b · També la forma qualificada de l'esquema private, `revoke all` (en una funció, ALL és EXECUTE)
      // i la llista de rols sense espai: `revoke all on function private.f() from public,anon,authenticated`.
      revocats ??= revocacionsR8(content);
      if (!revocats.has(funcName.toLowerCase())) {
        falla('R8', file, `Funció administrativa ${funcName} no té REVOKE EXECUTE ON FUNCTION FROM PUBLIC, anon.`);
      }
    }
  }
}

function veredicteR6(funcions, nomesFitxer = null) {
  for (const funcio of funcions) {
    // En una còpia posterior només es jutja el que el posterior ha escrit: la
    // resta és l'estat del catàleg, que ja té el seu veredicte.
    if (nomesFitxer && funcio.file !== nomesFitxer) continue;
    if (insegura(funcio)) falla('R6', funcio.file, motiuR6(funcio));
  }
}

// Una migració posterior pot desactivar una taula creada i protegida en un
// altre fitxer. Comprovar només CREATE dins de cada fitxer ho deixava passar.
// És anàlisi de DDL de nivell superior, no execució de funcions o SQL dinàmic.
function veredicteR2(taules, nomesFitxer = null) {
  for(const {schema,table,enabled,lastAction,file} of taules) {
    if(nomesFitxer&&file!==nomesFitxer)continue;
    // storage és gestionat pel servei i manté l'exempció de CREATE. Això no
    // autoritza desactivar explícitament la seua taula protegida d'objectes.
    const protectedTable=schema!=='private'&&schema!=='storage';
    const storageDisabled=schema==='storage'&&table==='objects'&&lastAction==='disable';
    if(!enabled&&(protectedTable||storageDisabled)&&!r2Reportades.has(JSON.stringify([file,schema,table]))) {
      falla('R2',file,`La taula ${schema}.${table} queda amb RLS desactivada al final de l’arbre SQL.`);
    }
  }
}

// R32 · P1 · El veredicte del catàleg es calcula NOMÉS sobre les migracions:
// cap posterior el pot rebaixar. Després, cada posterior respon del que afig.
veredicteR6(estatDefinerFinal.values());
veredicteR2(estatRlsFinal.values());
for (const { file, estatRls, estatDefiner } of avaluacionsPosteriors) {
  veredicteR6(estatDefiner.values(), file);
  veredicteR2(estatRls.values(), file);
}


for (const g of grants) {
  if (views.has(g.table)) continue; // Les vistes hereten RLS de les taules base via security_invoker
  // Comprovem si hi ha cap política per eixa mateixa taula i acció (o 'all')
  const thePolicies = policies.filter(p => p.table === g.table && (p.action === g.type || p.action === 'all'));
  if (thePolicies.length === 0) {
    falla('R5', g.file, `Es concedeix GRANT ${g.type.toUpperCase()} sobre la taula ${g.table} sense cap política RLS que el limite.`);
  }
}


if (infr.length > 0) {
  console.log(`\n❌ [RLS] Trobades ${infr.length} infraccions de seguretat.`);
  for (const i of infr) {
    console.log(`   ${i.llei} · ${i.on}: ${i.detall}`);
  }
  process.exit(1);
} else {
  console.log(`\n✅ [RLS] Cap infracció estàtica detectada (sobre ${files.length} fitxers sql; no executa SQL dinàmic ni comprova permisos remots).`);
}
