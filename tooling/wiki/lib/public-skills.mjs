/** IDEA-364 · Projecció diferida de la font única de skills. Cap import al client. */
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';
import { publicMetadata, publicSkillFiles, readPublicSkillFile, wikiDate } from './publication-policy.mjs';

export const SKILLS_OUT = 'public/md/skills';
const NOM = /^[a-z0-9-]+$/;
const text = value => typeof value === 'string' ? value : '';

/* v1.2.26 · C26-4 (Gauntlet #7) · La projecció pública no descriu la xarxa de casa ni on viu el perfil
   privat. Com emmascaraCamins fa amb /Users, ací cada adreça IPv4 privada (10/8, 172.16/12, 192.168/16)
   o d'enllaç local (169.254/16), amb el port o sense, cada nom d'amfitrió de xarxa local (.local, .lan,
   .internal, .home.arpa) amb port, i cada camí al perfil privat local (sdp-perfil-privat) ixen sense
   l'adreça. Només a la còpia pública: la skill font (.agents/skills/*) no es toca. Pur i lineal. */
const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IP_PRIVADA = new RegExp(`(?<![\\w.])(?:10\\.${OCTET}\\.${OCTET}|172\\.(?:1[6-9]|2\\d|3[01])\\.${OCTET}`
  + `|192\\.168\\.${OCTET}|169\\.254\\.${OCTET})\\.${OCTET}(?::\\d{1,5})?(?![\\w.]*\\d)`, 'g');
const AMFITRIO_LOCAL = /(?<![\w.-])[a-z0-9][a-z0-9-]{0,62}(?:\.[a-z0-9-]{1,63}){0,8}\.(?:local|lan|internal|home\.arpa):\d{1,5}(?![\w.]*\d)/gi;
const MARCA_PERFIL = 'sdp-perfil-privat';
const FORA_DE_CAMI = /[\s`'"()<>[\]]/;
export const ADRECA_PRIVADA = 'adreça de la xarxa local';
export const PERFIL_LOCAL_PRIVAT = 'perfil local privat';

/* Cada camí que passa pel perfil privat, sencer i amb els seus backticks, es canvia per «perfil local
   privat». Recorregut lineal (indexOf i un sol pas a cada costat): cap regex amb retrocés. */
function emmascaraPerfilPrivat(value) {
  let eixida = '';
  let cursor = 0;
  for (let i = value.indexOf(MARCA_PERFIL); i !== -1; i = value.indexOf(MARCA_PERFIL, cursor)) {
    let inici = i;
    while (inici > cursor && !FORA_DE_CAMI.test(value[inici - 1])) inici--;
    let fi = i + MARCA_PERFIL.length;
    while (fi < value.length && !FORA_DE_CAMI.test(value[fi])) fi++;
    if (inici > cursor && value[inici - 1] === '`' && value[fi] === '`') { inici--; fi++; }
    eixida += value.slice(cursor, inici) + PERFIL_LOCAL_PRIVAT;
    cursor = fi;
  }
  return eixida + value.slice(cursor);
}

/** Torna `value` sense adreces de xarxa privada ni camins al perfil privat. Pur. */
export function emmascaraInfraPrivada(value) {
  return emmascaraPerfilPrivat(String(value)).replace(IP_PRIVADA, ADRECA_PRIVADA).replace(AMFITRIO_LOCAL, ADRECA_PRIVADA);
}

/* v1.2.26 · C26-4 (Gauntlet #6) · Un primer H1 que només nomena una secció genèrica no és el títol de
   la skill: llavors el títol és el nom del directori. Llista tancada, sense accents ni majúscules. */
const H1_GENERICS = new Set(['concepte', 'concepto', 'introduccio', 'index', 'resum', 'objectiu', 'proposit',
  'descripcio', 'context', 'skill', 'presentacio']);
const normalitzaH1 = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N} ]/gu, ' ')
  .replace(/\s+/g, ' ').trim().toLowerCase();

/** Projecció determinista: generatedAt és la darrera data editorial declarada (date/updated) de les
 * skills, o null si cap no en declara. Mai una data de reserva (1970) ni l'hora, mtime o git: el
 * resultat depén només dels fitxers, i --comprova i --escriu donen el mateix índex (v1.2.26, #6). */
export function projectaSkills(root) {
  const fitxers = new Map();
  const skills = [];
  const dates = [];
  for (const file of publicSkillFiles(root)) {
    const raw = readPublicSkillFile(root, file);
    if (raw === null) continue;
    // Tot el que ix (cos, títol, descripció i bytes) es deriva de la còpia pública, ja emmascarada.
    const publica = emmascaraInfraPrivada(raw);
    const parsed = parseFrontmatter(publica);
    if (!parsed.hasFrontmatter || parsed.malformed || parsed.errors.length || !publicMetadata(parsed.data)) continue;
    const a = parsed.data;
    const name = path.basename(path.dirname(file));
    // El directori fixa la URL; el frontmatter no pot triar camins d'eixida.
    const h1 = parsed.body.split('\n').find(line => line.startsWith('# '));
    const titolH1 = h1 ? h1.slice(2).trim() : '';
    const title = text(a.title) || (titolH1 && !H1_GENERICS.has(normalitzaH1(titolH1)) ? titolH1 : name);
    fitxers.set(name, publica);
    skills.push({ name, title, description: text(a.description),
      tags: Array.isArray(a.tags) ? a.tags.filter(v => typeof v === 'string') : [],
      core: a.core === true || a.core === 'true', url: `/md/skills/${name}.md`, bytes: Buffer.byteLength(publica, 'utf8') });
    for (const key of ['date', 'updated']) if (wikiDate(a[key])) dates.push(new Date(a[key]).toISOString());
  }
  return { index: { generatedAt: dates.sort().at(-1) ?? null, total: skills.length, skills }, fitxers };
}

/** També les carpetes pare d'una eixida han de ser reals. No seguim links. */
export function directoriPublicReal(root, relative, create = false) {
  if (!['public', 'public/md', SKILLS_OUT].includes(relative)) throw new TypeError('Directori públic fora de contracte.');
  let cursor = fs.realpathSync(root);
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    if (!fs.existsSync(cursor)) {
      // existsSync és false també per a un symlink penjant.
      try { fs.lstatSync(cursor); throw new TypeError('Eixida pública ha de ser una carpeta real.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!create) return null;
      fs.mkdirSync(cursor);
    }
    const stat = fs.lstatSync(cursor);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError('Eixida pública ha de ser una carpeta real.');
  }
  return cursor;
}

const indexText = index => JSON.stringify(index, null, 2) + '\n';
const readFile = file => {
  try { return fs.lstatSync(file).isFile() ? fs.readFileSync(file, 'utf8') : null; }
  catch { return null; }
};

export function diferenciesSkills(root, projeccio = projectaSkills(root)) {
  let dir;
  try { dir = directoriPublicReal(root, SKILLS_OUT); }
  catch { return [`${SKILLS_OUT} ha de ser una carpeta real`]; }
  if (!dir) return [`${SKILLS_OUT} falta`];
  const differences = [];
  if (readFile(path.join(dir, 'index.json')) !== indexText(projeccio.index)) differences.push(`${SKILLS_OUT}/index.json no és la projecció`);
  for (const name of fs.readdirSync(dir)) {
    /* v1.2.26 (Gauntlet #3) · Els noms amb punt inicial (.DS_Store del Finder) els governa .gitignore,
       no la projecció: el mateix criteri que diferenciesLlms (genera-llms.mjs). escriuSkills els neteja. */
    if (name === 'index.json' || name.startsWith('.')) continue;
    if (!name.endsWith('.md') || !projeccio.fitxers.has(name.slice(0, -3))) differences.push(`${SKILLS_OUT}/${name} sobra`);
  }
  for (const [name, body] of projeccio.fitxers) {
    if (readFile(path.join(dir, `${name}.md`)) !== body) differences.push(`${SKILLS_OUT}/${name}.md falta o no és la projecció`);
  }
  return differences;
}

export function escriuSkills(root, projeccio = projectaSkills(root)) {
  for (const name of projeccio.fitxers.keys()) if (!NOM.test(name)) throw new TypeError('Nom de skill invàlid.');
  const dir = directoriPublicReal(root, SKILLS_OUT, true);
  const wanted = new Set(['index.json', ...[...projeccio.fitxers.keys()].map(name => `${name}.md`)]);
  // El directori és una projecció sencera: eliminar una skill privada també
  // retira la còpia anterior. rmSync sobre un link no seguix el seu destí.
  let changed = false;
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.lstatSync(file);
    if (!wanted.has(name) || !stat.isFile() || stat.nlink !== 1) {
      fs.rmSync(file, { recursive: true, force: true });
      changed = true;
    }
  }
  const write = (name, body) => {
    const file = path.join(dir, name);
    if (readFile(file) === body) return;
    const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW, 0o644);
    try { fs.writeFileSync(fd, body); } finally { fs.closeSync(fd); }
    changed = true;
  };
  for (const [name, body] of projeccio.fitxers) write(`${name}.md`, body);
  write('index.json', indexText(projeccio.index));
  return { total: projeccio.index.total, changed };
}
