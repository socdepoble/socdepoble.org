#!/usr/bin/env node
/**
 * Fusiona registres complets sdp.contingut.v1 respecte d'una base revisada.
 * --base BASE --base-sha256 HASH --canvis BRANCA [--canvis BRANCA...] [--apply]
 * HASH = hashCanonic(base): JSON compacte amb claus ordenades recursivament.
 * Cada branca declara les diferències respecte de base. Una mateixa clau en
 * dues branques és sempre col·lisió. No crea aprovacions: copia les rebudes.
 * Sense --apply no escriu res. Lock cooperatiu + temporal fsync + rename
 * atòmic; editors no cooperatius no participen del lock. No modifica PAGE_COPY.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { arrel, esMain } from '../lib/arrel.mjs';

export const REGISTRE_FRONTISSA = '.agents/contingut_estructural.json';
const SCHEMA = 'sdp.contingut.v1';
const LIMIT = 2 * 1024 * 1024;
const SHA = /^[a-f0-9]{64}$/;
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
const sha = text => createHash('sha256').update(text).digest('hex');
const fail = message => { throw new Error(message); };

function objecte(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(`${label}: objecte de dades requerit`);
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (FORBIDDEN.has(key) || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail(`${label}: propietat de dades invàlida`);
  }
  if (Object.getOwnPropertySymbols(value).length) fail(`${label}: símbols no admesos`);
  return value;
}
function camps(value, names, label) {
  objecte(value, label);
  if (Object.keys(value).length !== names.length || names.some(name => !Object.hasOwn(value, name))) fail(`${label}: camps inesperats o absents`);
}
function canonic(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonic).join(',')}]`;
  objecte(value, 'JSON');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonic(value[key])}`).join(',')}}`;
}
export const hashCanonic = value => sha(canonic(value));
function dataValida(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validaRegistre(registre, label) {
  camps(registre, ['schema', 'claus'], label);
  if (registre.schema !== SCHEMA) fail(`${label}: schema invàlid`);
  objecte(registre.claus, `${label}.claus`);
  if (Object.keys(registre.claus).length > 4096) fail(`${label}: massa claus`);
  for (const [key, entry] of Object.entries(registre.claus)) {
    if (!/^[a-z0-9][a-z0-9_-]{0,127}$/.test(key)) fail(`${label}: clau invàlida`);
    camps(entry, ['sha256', 'html', 'aprovat_per', 'data'], `${label}.${key}`);
    if (typeof entry.sha256 !== 'string' || !SHA.test(entry.sha256)
        || !Number.isSafeInteger(entry.html) || entry.html < 0
        || typeof entry.aprovat_per !== 'string' || !entry.aprovat_per.trim() || entry.aprovat_per.length > 4096
        || /[\u0000-\u001f\u007f]/.test(entry.aprovat_per) || !dataValida(entry.data)) fail(`${label}.${key}: metadades invàlides`);
  }
}
const hashClau = (registry, key) => Object.hasOwn(registry.claus, key) ? hashCanonic(registry.claus[key]) : null;
const copiaEntrada = ({sha256, html, aprovat_per, data}) => ({sha256, html, aprovat_per, data});

export function fusionaFrontissa({ base, actual, branques, baseSha256 }) {
  validaRegistre(base, 'base');
  validaRegistre(actual, 'actual');
  if (typeof baseSha256 !== 'string' || !SHA.test(baseSha256) || hashCanonic(base) !== baseSha256) fail('SHA-256 de base divergent');
  if (!Array.isArray(branques) || !branques.length || branques.length > 64) fail('Cal almenys una branca (màxim 64)');
  const changes = new Map();
  branques.forEach((branch, index) => {
    validaRegistre(branch, `branca ${index + 1}`);
    const keys = new Set([...Object.keys(base.claus), ...Object.keys(branch.claus)]);
    for (const key of keys) {
      if (hashClau(base, key) === hashClau(branch, key)) continue;
      if (changes.has(key)) fail(`Col·lisió sobre la clau ${key}`);
      changes.set(key, Object.hasOwn(branch.claus, key) ? branch.claus[key] : null);
    }
  });
  const allKeys = new Set([...Object.keys(base.claus), ...Object.keys(actual.claus), ...changes.keys()]);
  const preimatges = {};
  for (const key of [...allKeys].sort()) {
    const expected = hashClau(base, key), current = hashClau(actual, key);
    preimatges[key] = expected;
    const target = changes.has(key) ? changes.get(key) : undefined;
    const targetHash = target === null ? null : target === undefined ? expected : hashCanonic(target);
    if (current !== expected && (!changes.has(key) || current !== targetHash)) fail(`Preimatge divergent de ${key}`);
  }
  const merged = Object.fromEntries(Object.keys(base.claus).sort().map(key => [key, copiaEntrada(base.claus[key])]));
  for (const [key, entry] of changes) {
    if (entry === null) delete merged[key];
    else merged[key] = copiaEntrada(entry);
  }
  const registre = { schema: SCHEMA, claus: Object.fromEntries(Object.keys(merged).sort().map(key => [key, merged[key]])) };
  const text = `${JSON.stringify(registre, null, 2)}\n`;
  const targetSha256 = hashCanonic(registre);
  return { status: hashCanonic(actual) === targetSha256 ? 'ALREADY_APPLIED' : 'READY_TO_APPLY',
    baseSha256, actualSha256: hashCanonic(actual), targetSha256,
    canvis: [...changes.keys()].sort(), preimatges, registre, text };
}

// JSON.parse perd les claus duplicades. Este lector les refusa abans de crear
// el registre; límits de bytes, profunditat i cardinalitat eviten entrades hostils.
export function parseJsonFrontissa(text) {
  let i = 0, nodes = 0;
  const ws = () => { while (/[\x20\t\r\n]/.test(text[i] ?? '') && i < text.length) i++; };
  const string = () => {
    const start = i++;
    while (i < text.length) {
      const c = text[i++];
      if (c === '"') return JSON.parse(text.slice(start, i));
      if (c === '\\') i++;
    }
    fail('JSON: cadena no tancada');
  };
  const value = depth => {
    ws();
    if (depth > 32 || ++nodes > 100000) fail('JSON: límit estructural excedit');
    const c = text[i];
    if (c === '"') return string();
    if (c === '{') {
      i++; ws(); const result = Object.create(null), seen = new Set();
      if (text[i] === '}') { i++; return result; }
      while (i < text.length) {
        ws(); if (text[i] !== '"') fail('JSON: clau invàlida');
        const key = string();
        if (seen.has(key)) fail(`JSON: clau duplicada ${key}`);
        if (FORBIDDEN.has(key)) fail('JSON: clau de prototip prohibida');
        seen.add(key); ws(); if (text[i++] !== ':') fail('JSON: falta dos punts');
        result[key] = value(depth + 1); ws();
        if (text[i] === '}') { i++; return result; }
        if (text[i++] !== ',') fail('JSON: objecte invàlid');
      }
    } else if (c === '[') {
      i++; ws(); const result = [];
      if (text[i] === ']') { i++; return result; }
      while (i < text.length) {
        result.push(value(depth + 1)); ws();
        if (text[i] === ']') { i++; return result; }
        if (text[i++] !== ',') fail('JSON: llista invàlida');
      }
    } else {
      const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i))?.[0];
      if (token) { i += token.length; return JSON.parse(token); }
    }
    fail('JSON invàlid o incomplet');
  };
  const result = value(0); ws();
  if (i !== text.length) fail('JSON: bytes sobrants');
  return result;
}
function lectura(file) {
  const info = fs.lstatSync(file);
  if (info.isSymbolicLink() || !info.isFile()) fail('Font no regular o symlink');
  if (info.nlink !== 1) fail('Font amb enllaç hardlink');
  if (info.size > LIMIT) fail('Font excedix 2 MiB');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const before = fs.fstatSync(fd);
    if (before.ino !== info.ino || before.dev !== info.dev || before.nlink !== 1 || !before.isFile()) fail('Font substituïda durant la lectura');
    // Un productor pot annexar després de lstat. Mai carreguem el descriptor
    // sense sostre: mida inicial + 1 és com a màxim LIMIT + 1 i detecta creixement.
    const buffer = Buffer.allocUnsafe(info.size + 1);
    let total = 0;
    while (total < buffer.length) {
      const count = fs.readSync(fd, buffer, total, buffer.length - total, null);
      if (count === 0) break;
      total += count;
    }
    if (total > info.size) fail('Font excedix la mida declarada o el límit de lectura');
    const bytes = buffer.subarray(0, total), after = fs.fstatSync(fd), current = fs.lstatSync(file);
    if (bytes.length > LIMIT || before.size !== after.size || before.mtimeMs !== after.mtimeMs
        || before.ctimeMs !== after.ctimeMs || current.ino !== before.ino || current.dev !== before.dev || current.isSymbolicLink()) fail('Font canviada durant la lectura');
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { fail('Font no UTF-8 vàlida'); }
    return { file, bytes, sha256: sha(bytes), mode: info.mode & 0o777, info: after, value: parseJsonFrontissa(text) };
  } finally { fs.closeSync(fd); }
}
function mateixaFont(snapshot) {
  const now = lectura(snapshot.file);
  if (now.sha256 !== snapshot.sha256 || now.info.ino !== snapshot.info.ino || now.info.dev !== snapshot.info.dev
      || now.info.mode !== snapshot.info.mode || now.info.nlink !== snapshot.info.nlink) fail('Font canviada abans de publicar');
}
function agentsFisic(root) {
  const agents = path.join(root, '.agents');
  const info = fs.lstatSync(agents);
  if (!info.isDirectory() || info.isSymbolicLink() || !fs.readdirSync(root).includes('.agents')) fail('.agents ha de ser un directori físic');
  return { path: agents, ino: info.ino, dev: info.dev };
}
function mateixaAgents(root, original) {
  const now = agentsFisic(root);
  if (now.ino !== original.ino || now.dev !== original.dev) fail('.agents substituït durant la fusió');
}
export function executaFusiona({ arrel: rootOption, base, baseSha256, canvis, apply = false }) {
  if (typeof rootOption !== 'string' || !rootOption) fail('Cal una arrel explícita');
  if (typeof apply !== 'boolean') fail('apply ha de ser booleà');
  if (typeof base !== 'string' || !Array.isArray(canvis) || !canvis.length || canvis.some(file => typeof file !== 'string' || !file)) fail('Cal base i fitxers de canvis');
  const root = fs.realpathSync(path.resolve(rootOption));
  const agents = agentsFisic(root), target = path.join(root, REGISTRE_FRONTISSA);
  const files = [lectura(path.resolve(base)), ...canvis.map(file => lectura(path.resolve(file)))];
  const actual = lectura(target);
  const result = fusionaFrontissa({base:files[0].value, actual:actual.value, branques:files.slice(1).map(file => file.value), baseSha256});
  if (!apply || result.status === 'ALREADY_APPLIED') return result;
  const lock = path.join(agents.path, '.fusiona-frontissa.lock');
  const temp = path.join(agents.path, `.frontissa-${randomUUID()}.tmp`);
  let lockFd, tempFd, published = false;
  try {
    try { lockFd = fs.openSync(lock, 'wx', 0o600); }
    catch (error) { if (error.code === 'EEXIST') fail('Lock de Frontissa ocupat; cap escriptura'); throw error; }
    fs.writeFileSync(lockFd, JSON.stringify({pid:process.pid}));
    tempFd = fs.openSync(temp, 'wx', actual.mode);
    fs.writeFileSync(tempFd, result.text);
    fs.fchmodSync(tempFd, actual.mode); fs.fsyncSync(tempFd); fs.closeSync(tempFd); tempFd = undefined;
    mateixaAgents(root, agents);
    for (const file of [...files, actual]) mateixaFont(file);
    fs.renameSync(temp, target); published = true;
    return { ...result, status: 'APPLIED' };
  } finally {
    if (tempFd !== undefined) fs.closeSync(tempFd);
    if (!published && fs.existsSync(temp)) fs.unlinkSync(temp);
    if (lockFd !== undefined) { fs.closeSync(lockFd); fs.unlinkSync(lock); }
  }
}
function argumentsCli(argv) {
  const result = { canvis: [], apply: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply' || arg === '--json') { if (result[arg.slice(2)]) fail(`Flag repetit: ${arg}`); result[arg.slice(2)] = true; continue; }
    if (!['--arrel', '--base', '--base-sha256', '--canvis'].includes(arg)) fail(`Argument desconegut: ${arg}`);
    const next = argv[++i]; if (!next || next.startsWith('--')) fail(`Falta valor per a ${arg}`);
    if (arg === '--canvis') result.canvis.push(next);
    else { const key = arg === '--base-sha256' ? 'baseSha256' : arg.slice(2); if (Object.hasOwn(result,key)) fail(`Argument repetit: ${arg}`); result[key]=next; }
  }
  result.arrel ??= arrel({argv:[],env:{}});
  return result;
}
if (esMain(import.meta.url)) {
  try {
    const options = argumentsCli(process.argv.slice(2)), result = executaFusiona(options);
    const report = Object.fromEntries(Object.entries(result).filter(([key]) => !['registre','text'].includes(key)));
    console.log(options.json ? JSON.stringify(report, null, 2) : `${result.status}: ${result.canvis.length} claus; SHA-256 ${result.targetSha256}`);
  } catch (error) { console.error(`[fusiona-frontissa] ${error.message}`); process.exitCode = 2; }
}
