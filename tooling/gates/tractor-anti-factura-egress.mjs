#!/usr/bin/env node
/** P0-114 Escut 3 · Read-only build/deploy preflight.
 * Inspects the actual Hosting public trees and Vite public source, all Hosting
 * targets, cache header precedence, package scripts and literal artifact paths.
 * No shell/packaging code is executed. Run --require-build just before deploy;
 * arbitrary computed destinations in scripts cannot be statically proved safe.
 * Firebase header ordering: https://firebase.google.com/docs/hosting/full-config#headers
 */
import fs from 'node:fs';
import path from 'node:path';
import { esMain } from '../lib/arrel.mjs';

export const MAX_VIDEO_BYTES = 15_000_000;
/* R32.14 (D07/D14) · L'única excepció binària: un paquet OpenData municipal
   lleuger, un sol nivell sota opendata/ (font Vite i arbre Hosting), fitxer
   regular i <= 2 MB. Tot .apk/.aab/.ipa/.xcarchive, qualsevol altre .zip i un
   .zip d'OpenData més gros continuen bloquejats. */
export const MAX_ZIP_OPENDATA_BYTES = 2_000_000;
const ZIP_OPENDATA = /^opendata\/[^/]+\.zip$/i;
const BINARI = /\.(?:apk|aab|ipa|xcarchive|zip)$/i;
const VIDEO = /\.(?:mp4|mov|m4v|avi|mkv|webm|mts|m2ts)$/i;
// Vite emits an eight-character fingerprint suffix, not an arbitrary long
// basename. Longer suffixes are recognised only as hexadecimal digests.
const HASH = /[-.](?:[A-Za-z0-9_-]{8}|[a-f0-9]{9,64})\.(?:js|mjs|css|woff2?|png|jpe?g|gif|webp|avif|svg|wasm)$/i;
const HEX_HASH = /[-.][a-f0-9]{8,64}\.(?:js|mjs|css|woff2?|png|jpe?g|gif|webp|avif|svg|wasm)$/i;
const assetAmbHash = nom => HASH.test(nom);
const MAX_TEXT = 2_000_000;
function rutaRelativa(v) {
  if (typeof v !== 'string' || !v || v.length > 2048 || path.isAbsolute(v) || v.includes('\\')
    || v !== v.normalize('NFC') || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(v)
    || v.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Ruta no relativa/canònica');
  return v;
}
function comprovaAncestres(root, rel) {
  let p = root;
  for (const part of rutaRelativa(rel).split('/')) {
    p = path.join(p, part);
    const s = fs.lstatSync(p, { throwIfNoEntry: false });
    if (!s) return null;
    if (s.isSymbolicLink()) throw new Error('Enllaç simbòlic prohibit');
  }
  return fs.lstatSync(p);
}
function llig(root, rel) {
  const s = comprovaAncestres(root, rel);
  if (!s?.isFile() || s.size > MAX_TEXT || s.nlink !== 1) throw new Error('Fitxer no regular/acotat');
  const fd = fs.openSync(path.join(root, rel), fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const actual = fs.fstatSync(fd);
    if (s.dev !== actual.dev || s.ino !== actual.ino) throw new Error('Fitxer canviat durant la lectura');
    return fs.readFileSync(fd, 'utf8');
  } finally { fs.closeSync(fd); }
}
function glob(patro, nom) {
  if (typeof patro !== 'string' || !patro || patro.length > 512 || /[\p{Cc}\p{Cf}\p{Cs}\\]/u.test(patro)) throw new Error('Glob no admés');
  // Firebase's leading ! negates the complete glob, unlike path.matchesGlob.
  if (patro.startsWith('!')) return !path.posix.matchesGlob(nom, patro.slice(1));
  return path.posix.matchesGlob(nom, patro);
}
function ignorat(nom, regles) {
  let exclou = false;
  for (const patro of regles) {
    if (typeof patro !== 'string') throw new Error('Ignore no textual');
    const negada = patro.startsWith('!');
    if (glob(negada ? patro.slice(1) : patro, nom)) exclou = !negada;
  }
  return exclou;
}
function regexAcotada(font) {
  if (typeof font !== 'string' || font.length > 512 || !font.startsWith('^') || !font.endsWith('$')) throw new Error('Regex de cache no acotada/ancorada');
  // Accept a deliberately small, linear subset of RE2. Unknown grammar fails
  // closed, never passes an attacker-controlled regex to the JS backtracker.
  let classe = false, escapada = false, oberts = 0, illimitats = 0, opcionals = 0, grups = 0;
  for (let i = 0; i < font.length; i++) {
    const c = font[i];
    if (escapada) { if (/[1-9pPkK]/.test(c)) throw new Error('Regex de cache no suportada'); escapada = false; continue; }
    if (c === '\\') { escapada = true; continue; }
    if (c === '[') { if (classe) throw new Error('Classe regex invàlida'); classe = true; continue; }
    if (c === ']' && classe) { classe = false; continue; }
    if (classe) continue;
    if (c === '(') { if (++oberts > 1 || ++grups > 1 || font[i + 1] === '?') throw new Error('Grup regex no suportat'); }
    if (c === ')') {
      if (--oberts < 0 || '*+{?'.includes(font[i + 1] || '\0')) throw new Error('Grup regex quantificat');
    }
    if (c === '?' && ++opcionals > 1) throw new Error('Regex amb opcionals múltiples');
    if (c === '|' && oberts !== 1) throw new Error('Alternativa regex fora de grup');
    if (c === '*' || c === '+') { if (++illimitats > 1) throw new Error('Regex amb quantificadors oberts múltiples'); }
    if (c === '{') {
      const fi = font.indexOf('}', i + 1), valor = font.slice(i + 1, fi);
      if (fi < 0 || !/^[0-9]{1,3}$/.test(valor)) throw new Error('Quantificador regex no acotat');
    }
  }
  if (classe || oberts || escapada) throw new Error('Regex de cache incompleta');
  return new RegExp(font);
}
function reglesCache(hosting) {
  if (hosting.headers !== undefined && !Array.isArray(hosting.headers)) throw new Error('Headers no són una llista');
  return (hosting.headers || []).flatMap(regla => {
    if (!regla || typeof regla !== 'object' || !Array.isArray(regla.headers)) throw new Error('Regla de headers invàlida');
    const valors = regla.headers.filter(h => typeof h?.key === 'string' && h.key.toLowerCase() === 'cache-control');
    if (!valors.length) return [];
    if (valors.length !== 1 || typeof valors[0].value !== 'string' || valors[0].value.length > 1024 || /[\r\n]/.test(valors[0].value)) throw new Error('Cache-Control ambigu/invàlid');
    if ((typeof regla.source === 'string') === (typeof regla.regex === 'string')) throw new Error('Cal un source o regex de cache');
    const re = regla.regex === undefined ? null : regexAcotada(regla.regex);
    if (regla.source !== undefined) glob(regla.source, '/assets/prova-AbCd1234.js');
    return [{ coincideix: re ? nom => re.test(nom) : nom => glob(regla.source, nom), valor: valors[0].value }];
  });
}
function cacheImmutable(nom, regles) {
  let valor = '';
  for (const regla of regles) if (regla.coincideix(nom)) valor = regla.valor;
  const directives = valor.toLowerCase().split(',').map(s => s.trim());
  const edats = directives.filter(s => s.startsWith('max-age='));
  return directives.includes('immutable') && !directives.some(s => ['no-cache', 'no-store', 'private'].includes(s))
    && edats.length === 1 && /^max-age=[0-9]{1,10}$/.test(edats[0]) && Number(edats[0].slice(8)) >= 31_536_000;
}

/** Extract static string literals while skipping comments. Template literals
 * containing interpolation remain observations, never a safety certificate. */
function literals(text) {
  const result = [];
  for (let i = 0; i < text.length;) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') { const fi = text.indexOf('\n', i + 2); i = fi < 0 ? text.length : fi + 1; continue; }
    if (c === '/' && text[i + 1] === '*') { const fi = text.indexOf('*/', i + 2); i = fi < 0 ? text.length : fi + 2; continue; }
    if (c !== '"' && c !== "'" && c !== '`') { i++; continue; }
    const quote = c, inici = i; let valor = ''; i++;
    while (i < text.length && text[i] !== quote) {
      if (text[i] === '\\') { valor += text[i + 1] || ''; i += 2; }
      else valor += text[i++];
    }
    i++; result.push({ valor, inici });
  }
  return result;
}

export function inspeccionaEgress(arrel, { requireBuild = false } = {}) {
  const root = fs.realpathSync(arrel), incidencies = [], absents = [], examinades = [], scriptsExaminats = [], referenciesArtefactes = [];
  let fitxers = 0, bytes = 0, assetsHash = 0, exclosos = 0;
  const afegix = (cami, motiu) => incidencies.push({ cami, motiu });
  let configuracio;
  try { configuracio = JSON.parse(llig(root, 'firebase.json')); }
  catch (e) { return { valid: false, incidencies: [{ cami: 'firebase.json', motiu: e.message }] }; }
  const hosts = Array.isArray(configuracio?.hosting) ? configuracio.hosting : [configuracio?.hosting];
  if (!hosts.length || hosts.length > 32 || hosts.some(h => !h || typeof h !== 'object' || Array.isArray(h))) afegix('firebase.json', 'Cal Hosting estàtic explícit');
  function assetPublicEstatic(nom, desti, estatDesti) {
    if (HEX_HASH.test(nom) || estatDesti.size > 64_000_000) return false;
    // Human words (viatjant), licence names and dimensions can resemble a
    // random eight-character Vite hash. Exempt only a byte-identical public
    // source; hexadecimal fingerprints always require immutable caching.
    const fontRelativa = `public/${nom}`;
    try {
      const estatFont = comprovaAncestres(root, fontRelativa);
      if (!estatFont?.isFile() || estatFont.nlink !== 1 || estatFont.size !== estatDesti.size) return false;
      const obri = cami => fs.openSync(cami, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
      const fdFont = obri(path.join(root, fontRelativa)); let fdDesti;
      try {
        fdDesti = obri(desti);
        const font = fs.fstatSync(fdFont), actual = fs.fstatSync(fdDesti);
        if (font.dev !== estatFont.dev || font.ino !== estatFont.ino || font.size !== estatFont.size
          || actual.dev !== estatDesti.dev || actual.ino !== estatDesti.ino || actual.size !== estatDesti.size) return false;
        const esquerra = Buffer.alloc(65_536), dreta = Buffer.alloc(65_536);
        for (let offset = 0; offset < font.size;) {
          const llarg = Math.min(esquerra.length, font.size - offset);
          if (fs.readSync(fdFont, esquerra, 0, llarg, offset) !== llarg || fs.readSync(fdDesti, dreta, 0, llarg, offset) !== llarg
            || !esquerra.subarray(0, llarg).equals(dreta.subarray(0, llarg))) return false;
          offset += llarg;
        }
        const finalFont = fs.fstatSync(fdFont), finalDesti = fs.fstatSync(fdDesti);
        return finalFont.mtimeMs === font.mtimeMs && finalFont.ctimeMs === font.ctimeMs
          && finalDesti.mtimeMs === actual.mtimeMs && finalDesti.ctimeMs === actual.ctimeMs;
      } finally { fs.closeSync(fdFont); if (fdDesti !== undefined) fs.closeSync(fdDesti); }
    } catch { return false; }
  }
  function recorre(carpeta, { ignore = [], cache = null, font = false } = {}) {
    let estat;
    try { estat = comprovaAncestres(root, carpeta); }
    catch (e) { afegix(carpeta, e.message); return; }
    if (!estat) { absents.push(carpeta); if (font || requireBuild) afegix(carpeta, 'Arbre requerit absent'); return; }
    if (!estat.isDirectory()) { afegix(carpeta, 'Arrel desplegable no és directori'); return; }
    examinades.push(carpeta);
    const pendents = ['']; let entrades = 0;
    while (pendents.length) {
      const rel = pendents.pop(), base = path.join(root, carpeta, rel);
      for (const entrada of fs.readdirSync(base, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
        const nom = rel ? `${rel}/${entrada.name}` : entrada.name, cami = `${carpeta}/${nom}`;
        if (++entrades > 200_000 || nom.length > 2048 || nom.split('/').length > 64) { afegix(carpeta, 'Arbre massa gran/profund'); return; }
        if (entrada.isSymbolicLink()) { afegix(cami, 'Enllaç simbòlic prohibit'); continue; }
        const zipOpendata = ZIP_OPENDATA.test(nom) && entrada.isFile()
          && fs.lstatSync(path.join(base, entrada.name)).size <= MAX_ZIP_OPENDATA_BYTES;
        if (BINARI.test(nom) && !zipOpendata && (font || !ignorat(nom, ignore))) {
          afegix(cami, ZIP_OPENDATA.test(nom) ? 'ZIP OpenData superior a 2 MB o no regular' : 'Binari de distribució dins de Hosting/font pública');
          continue;
        }
        if (entrada.isDirectory()) { pendents.push(nom); continue; }
        if (!entrada.isFile()) { afegix(cami, 'Entrada no regular'); continue; }
        const stat = fs.lstatSync(path.join(base, entrada.name));
        if (stat.nlink !== 1) { afegix(cami, 'Hardlink dins de paquet'); continue; }
        if (!font && ignorat(nom, ignore)) { exclosos++; continue; }
        fitxers++; bytes += stat.size;
        if (VIDEO.test(nom) && stat.size > MAX_VIDEO_BYTES) afegix(cami, 'Vídeo superior a 15 MB dins de Hosting/font pública');
        if (cache && assetAmbHash(entrada.name) && !assetPublicEstatic(nom, path.join(base, entrada.name), stat)) { assetsHash++; if (!cacheImmutable('/' + nom, cache)) afegix(cami, 'Asset amb hash sense Cache-Control immutable >= 1 any'); }
      }
    }
  }
  // Pre-build source is inspected even if Hosting output has not been built.
  recorre('public', { font: true });
  for (const [i, hosting] of hosts.entries()) {
    try {
      if (!hosting || typeof hosting !== 'object') continue;
      const carpeta = rutaRelativa(hosting.public);
      if (hosting.ignore !== undefined && (!Array.isArray(hosting.ignore) || hosting.ignore.length > 256)) throw new Error('Ignore no acotat');
      const ignore = hosting.ignore || [];
      for (const regla of ignore) glob(regla.startsWith('!') ? regla.slice(1) : regla, 'prova.apk');
      const cache = reglesCache(hosting);
      // A missing build cannot hide removal of the immutable policy.
      if (!cacheImmutable('/assets/prova-AbCd1234.js', cache)) afegix(`hosting[${i}].headers`, 'Falta política immutable per a assets amb hash');
      recorre(carpeta, { ignore, cache });
    } catch (e) { afegix(`hosting[${i}]`, e.message); }
  }
  let paquet;
  try { paquet = JSON.parse(llig(root, 'package.json')); }
  catch (e) { afegix('package.json', e.message); }
  function comprovaLiteral(valor, origen) {
    if (typeof valor !== 'string') { afegix(origen, 'Script/regla no textual'); return; }
    // Paths are only diagnosed when literal: dynamic JS is not interpreted.
    for (const tros of valor.split(/[\s'"`;|&]+/)) {
      const net = tros.replace(/^[([{]+|[\])},]+$/g, '');
      if (!net.includes('${') && (net.startsWith('public/') || hosts.some(h => typeof h?.public === 'string' && net.startsWith(h.public + '/')))
        && BINARI.test(net)) {
        const host = hosts.find(h => typeof h?.public === 'string' && net.startsWith(h.public + '/'));
        if (net.startsWith('public/') || !host || !ignorat(net.slice(host.public.length + 1), host.ignore || [])) afegix(origen, `Destinació binària literal desplegable: ${net}`);
      }
    }
  }
  for (const [nom, valor] of Object.entries(paquet?.scripts || {})) comprovaLiteral(valor, `package.json#scripts.${nom}`);
  for (const rel of ['scripts', 'tooling/node0', 'wordpress-plugin/eines']) {
    try {
      const stat = comprovaAncestres(root, rel);
      if (!stat) continue;
      const pendents = [rel]; let entradesScripts = 0;
      while (pendents.length) {
        const carpeta = pendents.pop();
        for (const entrada of fs.readdirSync(path.join(root, carpeta), { withFileTypes: true })) {
          const cami = `${carpeta}/${entrada.name}`;
          if (++entradesScripts > 100_000) throw new Error('Massa entrades de scripts');
          if (entrada.isSymbolicLink()) { afegix(cami, 'Script simbòlic no inspeccionable'); continue; }
          if (entrada.isDirectory()) { if (cami.split('/').length >= 8) throw new Error('Scripts massa profunds'); pendents.push(cami); continue; }
          if (!entrada.isFile() || !/\.(?:mjs|cjs|js|sh)$/.test(cami)) continue;
          const text = llig(root, cami); scriptsExaminats.push(cami);
          for (const { valor, inici } of literals(text)) {
            const prefix = text.slice(Math.max(0, inici - 512), inici);
            const destiEscriptura = /\b(?:writeFile(?:Sync)?|createWriteStream)\s*\(\s*$/.test(prefix)
              || /\b(?:copyFile(?:Sync)?|rename(?:Sync)?)\s*\([^;\n]{0,480},\s*$/.test(prefix);
            if (destiEscriptura) comprovaLiteral(valor, cami);
            else if (BINARI.test(valor) && /^(?:public|dist)\//.test(valor)) referenciesArtefactes.push({ cami, referencia: valor });
          }
        }
      }
    } catch (e) { afegix(rel, e.message); }
  }
  // Optional declarative artifact rules: never execute arbitrary build scripts.
  if (paquet?.sdpArtefactes !== undefined) {
    if (!Array.isArray(paquet.sdpArtefactes) || paquet.sdpArtefactes.length > 1000) afegix('package.json#sdpArtefactes', 'Regles no acotades');
    else for (const regla of paquet.sdpArtefactes) comprovaLiteral(regla?.destinacio, 'package.json#sdpArtefactes');
  }
  incidencies.sort((a, b) => a.cami < b.cami ? -1 : a.cami > b.cami ? 1 : a.motiu < b.motiu ? -1 : 1);
  return { valid: incidencies.length === 0, mode: requireBuild ? 'predeploy' : 'prebuild', fitxers, bytes, assetsHash, exclosos,
    examinades, absents, scriptsExaminats: scriptsExaminats.sort(), referenciesArtefactes, incidencies,
    limits: ['Lectura local; no comprova facturació ni spend caps remots.',
      'Scripts: inspecció de literals; els destins computats només es verifiquen en l’arbre final amb --require-build.',
      'Sense --require-build, arbres Hosting absents es declaren i no acrediten cap desplegament.'] };
}

export function main(argv = process.argv.slice(2)) {
  try {
    let root = process.cwd(), requireBuild = false, rootSet = false;
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--root' && !rootSet && argv[i + 1] && !argv[i + 1].startsWith('--')) { root = path.resolve(argv[++i]); rootSet = true; }
      else if (argv[i] === '--require-build' && !requireBuild) requireBuild = true;
      else throw new Error('Ús: tractor-anti-factura-egress.mjs [--root ARREL] [--require-build]');
    }
    const resultat = inspeccionaEgress(root, { requireBuild });
    console.log(JSON.stringify(resultat, null, 2));
    return resultat.valid ? 0 : 1;
  } catch (e) { console.error(JSON.stringify({ valid: false, error: e.message })); return 2; }
}
if (esMain(import.meta.url)) process.exitCode = main();
