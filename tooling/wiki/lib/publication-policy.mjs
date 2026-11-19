/** Frontera comuna dels exportadors públics (manifest, slugs, RAG i SEO).
 * Legacy: sense `visibility` es publica només dins de les arrels públiques de
 * la Wiki. Una visibilitat explícita diferent de `public` es denega. No s'amplia
 * l'àmbit per passar `files`: és una selecció dins de la mateixa frontera.
 */
import { CAMINS } from '../../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// La reserva no és una data acreditada de creació: és un valor estable per a
// distribucions sense historial. Mai usem mtime ni l'hora de compilació.
export const WIKI_DATE_FALLBACK = '1970-01-01T00:00:00Z';
export const WIKI_IMAGE_PATTERN = '^/assets/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\\.(?:jpg|jpeg|png|webp|avif|gif)$';
export const WIKI_DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}(?:T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?(?:Z|[+-]\\d{2}:\\d{2}))?$';

export function wikiDate(value) {
  if (typeof value !== 'string' || !new RegExp(WIKI_DATE_PATTERN).test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [calendar, time] = value.split('T');
  if (!new Date(`${calendar}T00:00:00Z`).toISOString().startsWith(calendar)) return false;
  if (time) {
    const m = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(time);
    if (!m || +m[1] > 23 || +m[2] > 59 || +m[3] > 59 || +(m[4] || 0) > 23 || +(m[5] || 0) > 59) return false;
  }
  return true;
}

/** Valida els camps editorials nous sense relaxar la frontera de privacitat.
 * El parser YAML lleuger conserva escalars com a text: sols convertim literals
 * no citats. Un «mur: \"false\"» no és un booleà editorial.
 */
export function wikiEditorial(attributes, { rawFrontmatter } = {}) {
  const a = { ...attributes };
  for (const key of ['mur', 'revisions']) {
    if (typeof a[key] !== 'string' || typeof rawFrontmatter !== 'string') continue;
    const literal = new RegExp(`^${key}:[ \\t]*(true|false|0|[1-9]\\d*)[ \\t]*(?:#.*)?$`, 'm').exec(rawFrontmatter.replaceAll('\r\n', '\n'));
    if (literal && literal[1] === a[key]) {
      if (key === 'mur' && /^(true|false)$/.test(a[key])) a[key] = a[key] === 'true';
      if (key === 'revisions' && /^(0|[1-9]\d*)$/.test(a[key])) a[key] = Number(a[key]);
    }
  }
  const invalid = key => { throw new TypeError(`Metadada editorial invàlida: ${key}`); };
  if (Object.hasOwn(a, 'mur') && typeof a.mur !== 'boolean') invalid('mur');
  if (Object.hasOwn(a, 'revisions') && (!Number.isSafeInteger(a.revisions) || a.revisions < 0)) invalid('revisions');
  for (const key of ['date', 'updated']) if (Object.hasOwn(a, key) && !wikiDate(a[key])) invalid(key);
  if (Object.hasOwn(a, 'image') && (typeof a.image !== 'string' || !new RegExp(WIKI_IMAGE_PATTERN).test(a.image))) invalid('image');
  for (const [key, max] of [['imageAlt', 500], ['version', 80]]) {
    if (Object.hasOwn(a, key) && (typeof a[key] !== 'string' || !a[key].trim() || a[key].trim() !== a[key] || a[key].length > max || /[\u0000-\u001f\u007f]/.test(a[key]))) invalid(key);
  }
  return a;
}

/** Historial del fitxer (committer ISO, també després de renoms). No escriu,
 * no usa shell, no executa diffs externs i té límits de temps/memòria.
 */
export function wikiHistory(root, file) {
  if (!fs.existsSync(path.join(root, '.git'))) return [];
  try {
    const output = execFileSync('git', ['--literal-pathspecs', '-C', root, '-c', 'log.showSignature=false',
      'log', '--follow', '--no-ext-diff', '--no-textconv', '--format=%cI', '--', path.relative(root, file)],
    { encoding: 'utf8', timeout: 5000, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const dates = output.trim().split(/\r?\n/).filter(Boolean);
    return dates.every(wikiDate) ? dates : [];
  } catch { return []; }
}

/** Mateixa editorial a primer nivell i en attributes per als consumidors.
 * revisions=0 explicita que no hi ha commits acreditats en esta distribució.
 */
export function resolveWikiEditorial(attributes, { root, file, rawFrontmatter } = {}) {
  const a = wikiEditorial(attributes, { rawFrontmatter });
  const history = ['date', 'updated', 'revisions'].some(key => !Object.hasOwn(a, key)) ? wikiHistory(root, file) : [];
  const named = /^(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})_/.exec(path.basename(file));
  const candidate = named ? `20${named[1]}-${named[2]}-${named[3]}T${named[4]}:${named[5]}:00Z` : '';
  const fallback = wikiDate(candidate) ? candidate : WIKI_DATE_FALLBACK;
  const date = a.date ?? history.at(-1) ?? fallback;
  const editorial = { ...(a.image === undefined ? {} : { image: a.image }), ...(a.imageAlt === undefined ? {} : { imageAlt: a.imageAlt }),
    date, updated: a.updated ?? history[0] ?? date, ...(a.version === undefined ? {} : { version: a.version }),
    revisions: a.revisions ?? history.length, mur: a.mur ?? false,
    origenEditorial: {
      date: a.date !== undefined ? 'frontmatter' : history.length ? 'git' : wikiDate(candidate) ? 'nom' : 'reserva',
      updated: a.updated !== undefined ? 'frontmatter' : history.length ? 'git' : a.date !== undefined ? 'frontmatter' : wikiDate(candidate) ? 'nom' : 'reserva',
      revisions: a.revisions !== undefined ? 'frontmatter' : history.length ? 'git' : 'sense-historial'
    } };
  return { editorial, attributes: { ...a, ...editorial } };
}

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

/** P0-CONSOLIDACIO-3-CATEDRES · Títol i slug d'un document públic de la Wiki.
 * Una sola regla per a slugIndex.json (build_slug_index.mjs) i per a la
 * projecció Markdown de llms.txt (tooling/seo/genera-llms.mjs): així cada
 * /md/<slug>.md té el mateix slug que el seu document a slugIndex.json. */
export function slugDeDocument(meta, file) {
  const title = meta.title || meta.name || file.split('/').pop().replace('.md', '');
  const slug = meta.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return { title, slug };
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
