/** Frontera comuna dels exportadors públics (manifest, slugs, RAG i SEO).
 * Legacy: sense `visibility` es publica només dins de les arrels públiques de
 * la Wiki. Una visibilitat explícita diferent de `public` es denega. No s'amplia
 * l'àmbit per passar `files`: és una selecció dins de la mateixa frontera.
 */
import { CAMINS } from '../../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';

export const PUBLIC_WIKI_DIRS = Object.freeze(['01_ser', '02_saber', '03_actuar']);
const PUBLIC_DIRS = new Set(PUBLIC_WIKI_DIRS);
const excludedPart = (part) => part.startsWith('.') || part.startsWith('90_')
  || part === path.basename(CAMINS.escriptori) || part === '04_ARXIU' || part === '10_actes'
  || part.toLowerCase().includes('petorreta');

export function publicMetadata(attributes = {}) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return false;
  if (Object.hasOwn(attributes, 'visibility') && attributes.visibility !== 'public') return false;
  return !['arxivat', 'quarantena'].includes(attributes.status);
}

/** Rebutja symlinks en qualsevol component sota root, inclòs el fitxer final.
 * L'arrel proporcionada pel caller es resol primer (p. ex. /tmp a macOS).
 */
export function confinedFile(root, candidate) {
  try {
    const base = fs.realpathSync(root);
    const absolute = path.resolve(candidate);
    const lexicalRoot = path.resolve(root);
    const rel = path.relative(lexicalRoot, absolute);
    if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) return null;
    let cursor = base;
    const parts = rel.split(path.sep);
    for (let i = 0; i < parts.length; i += 1) {
      cursor = path.join(cursor, parts[i]);
      const stat = fs.lstatSync(cursor);
      if (stat.isSymbolicLink() || (i < parts.length - 1 && !stat.isDirectory())) return null;
      if (i === parts.length - 1 && !stat.isFile()) return null;
    }
    return cursor;
  } catch { return null; }
}

export function publicWikiFile(root, candidate) {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  const parts = rel.split(path.sep);
  if (parts[0] !== CAMINS.wiki || parts.length < 2 || parts.some(excludedPart)) return null;
  if (parts.length > 2 && !PUBLIC_DIRS.has(parts[1])) return null;
  if (parts.at(-1) === 'TORN_ACTIU.json' || !/\.(md|json)$/.test(parts.at(-1))) return null;
  return confinedFile(root, candidate);
}

export function publicWikiFiles(root, { extensions = ['.md', '.json'] } = {}) {
  const wiki = path.resolve(root, CAMINS.wiki);
  const result = [];
  function visit(dir, top = false) {
    if (!fs.existsSync(dir) || fs.lstatSync(dir).isSymbolicLink()) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink() || excludedPart(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!top || PUBLIC_DIRS.has(entry.name)) visit(full);
      } else if (extensions.includes(path.extname(full)) && publicWikiFile(root, full)) result.push(full);
    }
  }
  visit(wiki, true);
  return result;
}

/* Decisió del Mestre (31-10-2026) · Cap exportador públic (manifest, RAG i
   slugs) porta el camí de l'ordinador on es treballa: /Users/<usuari>/ passa
   a ~/, i /Users/<usuari> sense barra final, a ~ (el punt final de frase es
   queda). També en minúscula (APFS no distingix majúscules) i en la forma
   escapada dels JSON (\/Users\/…). Les fonts no es toquen: el hash de les
   plantilles el fixen els rebuts. Una URL amb /Users/ dins del camí
   (https://…/a+/Users/…, …md/users/…) no és un camí local i es queda.
   /Users/Shared/ també passa a ~/: emmascara de més, mai de menys. */
const CAMI_D_USUARI = /(?<![\w.~+%\\-])\\?\/Users\\?\/[A-Za-z0-9_][A-Za-z0-9._-]*?(?:\\?\/|(?=[^A-Za-z0-9._-]|\.(?![A-Za-z0-9_-])|$))/gi;

/** Torna `text` amb cada /Users/<usuari> canviat per ~. Pur. */
export function emmascaraCamins(text) {
  return String(text).replace(CAMI_D_USUARI, (tros) => {
    if (tros.endsWith('\\/')) return '~\\/';
    return tros.endsWith('/') ? '~/' : '~';
  });
}

/** Comprova la frontera immediatament abans de llegir i no seguix el link
 * final. El text ix ja emmascarat (emmascaraCamins): és l'única porta de
 * lectura dels exportadors públics. */
export function readPublicWikiFile(root, file) {
  const safe = publicWikiFile(root, file);
  if (!safe) return null;
  const fd = fs.openSync(safe, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try { return emmascaraCamins(fs.readFileSync(fd, 'utf8')); } finally { fs.closeSync(fd); }
}

// Compartit per les rutes de llista i detall del manifest SEO. L'autenticació
// no equival a robots: esta llista només controla indexació, mai autorització.
// Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · /disseny és pública i
// indexable («dejar público lo máximo posible»): ix d'esta llista. /consola no
// hi era; el mateix canvi a useSEO.js (PRIVATE) la fa indexable al client.
const PRIVATE_ROUTES = new Set(['login', 'registre', 'perfil', 'control', 'connectar', 'cerca',
  'dispositius', 'traduccions', 'skills', 'ia', 'realitat', 'notes', 'xat', 'chat', 'chats', 'gestoria', 'tractors']);
export function publicSeoRoute(route, attributes = {}) {
  const section = String(route).replace(/^\/+/, '').split(/[/?#]/)[0];
  return publicMetadata(attributes) && !PRIVATE_ROUTES.has(section);
}
