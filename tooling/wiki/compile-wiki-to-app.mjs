#!/usr/bin/env node
/** Compilador de la Wiki pública cap al manifest de l'aplicació.
 *
 *  Exporta `compila()` perquè el watcher de desenvolupament
 *  (`tooling/vite/wiki-watcher.mjs`) el puga cridar dins del mateix procés: un
 *  procés fill per pulsació de tecla costa ~300 ms i no cal.
 *
 *  Àmbit: `01_ser`, `02_saber` i `03_actuar`, més els documents solts de l'arrel
 *  de `_wiki_de_poble/`. De `90_arxiu_historic/` només se'n prenen NOMS, mai
 *  contingut. L'Escriptori i la resta de carpetes no entren mai (AGENTS §5).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_PER_DEFECTE = path.resolve(__dirname, '../../');

export const WIKI_DIR = '_wiki_de_poble';
export const OUT_REL = 'src/data/wikiManifest.js';

/** Les úniques carpetes que arriben a l'aplicació. Heretades, mai ampliades. */
export const PUBLIC_WIKI_DIRS = Object.freeze(['01_ser', '02_saber', '03_actuar']);
const PUBLIQUES = new Set(PUBLIC_WIKI_DIRS);

function walk(dir, wikiRoot, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const isWikiRoot = path.resolve(dir) === path.resolve(wikiRoot);

  for (const e of entries) {
    if (e.name === 'TORN_ACTIU.json' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (isWikiRoot && !PUBLIQUES.has(e.name)) continue;
      walk(full, wikiRoot, files);
    } else if (e.name.endsWith('.md') || e.name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

// Un índex d'enllaços no és una càrrega de context: ací només recollim NOMS de
// l'arxiu històric, mai el seu contingut. Sense això, arxivar un document trenca
// tots els enllaços que hi apuntaven i la higiene destrueix el graf.
function noms(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) noms(full, out);
    else if (e.name.endsWith('.md') || e.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function resolIdentitat(targetOrPath) {
  const baseName = path.basename(targetOrPath);
  const baseNoExt = baseName.replace(/\.(md|json)$/i, '');
  if (baseNoExt === 'SKILL') {
    // Agafar el directori pare, ja siga des d'un path absolut o un relatiu
    const dir = path.dirname(targetOrPath);
    if (dir === '.') return 'SKILL'; // cas rar
    return `${path.basename(dir)}_SKILL`;
  }
  return baseNoExt;
}

// Convert [[Target]] or [[Target|Alias]] to [Alias o Target](#Target)
// Però per a UniversalWorkspace preferim [Alias](?item=Target)
function processWikiLinks(text) {
  return text.replace(/\[\[(.*?)\]\]/g, (match, inner) => {
    let target = inner;
    let label = inner;
    if (inner.includes('|')) {
      [target, label] = inner.split('|');
    }
    // traiem el # fragment per l'ID de l'item si hi ha
    const rawTarget = target.split('#')[0].trim();
    const id = resolIdentitat(rawTarget);
    return `[${label.trim()}](?item=${encodeURIComponent(id)})`;
  });
}

/**
 * Construïx l'arbre de categories.
 *
 * La ruta és relativa a `_wiki_de_poble/`, no a l'arrel del repositori: així
 * `SER`, `SABER` i `ACTUAR` són arrels de veres i no pengen d'una categoria
 * contenidora que no aporta res. Els documents solts de l'arrel de la Wiki
 * (com `00_index.md`) no tenen carpeta i tornen `null`: qui pinte l'arbre
 * decidix on els posa, en compte de quedar amagats sota un node inútil.
 */
function ensureCategory(categoriesMap, relativeDirectory) {
  if (!relativeDirectory || relativeDirectory === '.' || relativeDirectory === path.sep) return null;
  const parts = relativeDirectory.split(path.sep).filter(Boolean);
  let parentId = null;
  for (let index = 0; index < parts.length; index += 1) {
    const directory = parts.slice(0, index + 1).join('/');
    const id = `folder:${directory}`;
    if (!categoriesMap.has(id)) {
      categoriesMap.set(id, {
        id,
        parentId,
        label: parts[index].replace(/^[0-9]+_/, '').replace(/_/g, ' ').toUpperCase()
      });
    }
    parentId = id;
  }
  return parentId;
}

/** Recorre la Wiki i torna `{ categories, items, omesos }`. Cap escriptura. */
export function construeixManifest(root = ROOT_PER_DEFECTE) {
  const wikiRoot = path.join(root, WIKI_DIR);
  const categoriesMap = new Map();
  const items = [];
  // Documents que existixen però que no entren al manifest viu (arxivats o en
  // quarantena). El lector no els ha de vore; el validador d'enllaços sí.
  const omesos = new Set();

  for (const file of walk(wikiRoot, wikiRoot)) {
    const ext = path.extname(file).toLowerCase();
    const content = fs.readFileSync(file, 'utf8');

    let parsed = { data: {}, body: '', malformed: false };

    if (ext === '.json') {
      try {
        parsed.data = JSON.parse(content);
        parsed.body = `\`\`\`json\n${content}\n\`\`\``; // Embed for display
      } catch {
        parsed.malformed = true;
      }
    } else {
      parsed = parseFrontmatter(content);
    }

    if (parsed.malformed) continue;

    const attr = parsed.data || {};
    if (attr.status === 'arxivat' || attr.status === 'quarantena') {
      omesos.add(resolIdentitat(file));
      continue;
    }

    const categoryId = ensureCategory(categoriesMap, path.dirname(path.relative(wikiRoot, file)));

    const baseName = path.basename(file, '.md');
    // Si tenim title al frontmatter, el fem servir; si no, el nom del fitxer
    const title = attr.name || attr.title || baseName;
    const subtitle = attr.description || attr.type || '';

    items.push({
      id: resolIdentitat(file),
      title,
      subtitle,
      categoryId,
      tags: attr.tags || [],
      attributes: attr,
      content: processWikiLinks(parsed.body)
    });
  }

  return { categories: Array.from(categoriesMap.values()), items, omesos };
}

/** Verificació d'integritat dels enllaços. Cap escriptura. */
export function verificaEnllacos(root, { categories: _c, items, omesos }, { log = console } = {}) {
  const viusIds = new Set(items.map((i) => i.id));
  // Coneguts = vius + arxivats + omesos per estat. Conéixer un nom no és llegir-lo.
  const arxivats = new Set(omesos);
  for (const file of noms(path.join(root, WIKI_DIR, '90_arxiu_historic'))) arxivats.add(resolIdentitat(file));

  // El sistema de fitxers no distingix majúscules, i la taxonomia va baixar els
  // índexs de MAJÚSCULES a minúscules: un enllaç que només difereix en la caixa
  // apunta al mateix document, no a un de trencat.
  const viusPlans = new Set([...viusIds].map((id) => id.toLowerCase()));
  const arxivatsPlans = new Set([...arxivats].map((id) => id.toLowerCase()));
  const trencats = [];
  let capArxiu = 0;

  for (const item of items) {
    const regex = /\?item=([^)]+)/g;
    let match;
    while ((match = regex.exec(item.content)) !== null) {
      const targetId = decodeURIComponent(match[1]);
      const pla = targetId.toLowerCase();
      if (viusPlans.has(pla)) continue;
      if (arxivatsPlans.has(pla)) { capArxiu += 1; continue; }
      trencats.push({ item: item.id, target: targetId });
      log.error(`❌ Enllaç trencat a ${item.id}: el destí '${targetId}' no existeix ni entre els vius ni a l'arxiu.`);
    }
  }
  if (capArxiu) log.log(`ℹ️ ${capArxiu} enllaços apunten a l'arxiu històric: el destí existeix i es reconeix pel nom, sense carregar-ne el contingut.`);
  return { trencats, capArxiu };
}

function serialitza(manifest) {
  return `// Aquest fitxer és generat automàticament per tooling/wiki/compile-wiki-to-app.mjs
// NO l'editis manualment.

export const wikiManifest = ${JSON.stringify(manifest, null, 2)};
`;
}

/**
 * Compila la Wiki al manifest.
 *
 * Escriptura CONDICIONAL: si el contingut generat és idèntic al del disc no es
 * toca el fitxer i es torna `changed: false`. Sense això, el watcher recompila,
 * l'`mtime` canvia, Vite reinvalida i el navegador parpelleja sense motiu: la
 * diferència entre un watcher i un bucle.
 */
export function compila({ root = ROOT_PER_DEFECTE, write = true } = {}) {
  const { categories, items } = construeixManifest(root);
  const outFile = path.join(root, OUT_REL);
  const contingut = serialitza({ categories, items });

  if (!write) return { changed: false, items: items.length, categories: categories.length, outFile };

  const previ = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : null;
  if (previ === contingut) return { changed: false, items: items.length, categories: categories.length, outFile };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, contingut, 'utf8');
  return { changed: true, items: items.length, categories: categories.length, outFile };
}

function main() {
  const root = ROOT_PER_DEFECTE;
  const isCheckMode = process.argv.includes('--check');

  if (isCheckMode) {
    const manifest = construeixManifest(root);
    const { trencats } = verificaEnllacos(root, manifest);
    if (trencats.length) {
      if (process.argv.includes('--strict')) {
        console.error('💥 La verificació de la Wiki ha fallat perquè hi ha enllaços trencats.');
      } else {
        console.warn('⚠️ Hi ha enllaços trencats a la Wiki; la comprovació falla sense modificar el manifest.');
      }
    } else {
      console.log('✅ Totes les rutes de la Wiki estan ben enllaçades.');
    }
    // --check is observational: no mkdir or write, even on success.
    process.exit(trencats.length ? 1 : 0);
  }

  const r = compila({ root });
  console.log(`✅ Manifest de la Wiki ${r.changed ? 'generat' : 'sense canvis'} a ${OUT_REL} amb ${r.items} documents i ${r.categories} categories.`);
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) main();
