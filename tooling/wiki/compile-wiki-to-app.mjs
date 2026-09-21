#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');
const OUT_FILE = path.join(ROOT, 'src/data/wikiManifest.js');

const DIRS_TO_SCAN = [
  path.join(ROOT, '_wiki_de_poble'),
  path.join(ROOT, '.agents')
];

const IGNORE_DIRS = new Set([
  '90_arxiu_historic', 'node_modules', 'dist', 'public', 'scratch', 'tmp', '.sdp-paperera'
]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name) || (e.name.startsWith('.') && e.name !== '.agents')) {
      continue; 
    }
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, files);
    } else if (e.name.endsWith('.md') || e.name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

function resolIdentitat(targetOrPath) {
  const baseName = path.basename(targetOrPath);
  const baseNoExt = baseName.replace(/\.(md|json)$/i, '');
  if (baseNoExt === 'SKILL') {
    // Agafar el directori pare, ja siga des d'un path absolut o un relatiu
    let dir = path.dirname(targetOrPath);
    if (dir === '.') return 'SKILL'; // cas rar
    return path.basename(dir) + '_SKILL';
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

const categoriesMap = new Map();
const items = [];

let catIdCounter = 1;

for (const dir of DIRS_TO_SCAN) {
  const mdFiles = walk(dir);
  for (const file of mdFiles) {
    const ext = path.extname(file).toLowerCase();
    const content = fs.readFileSync(file, 'utf8');
    
    let parsed = { data: {}, body: '', malformed: false };
    
    if (ext === '.json') {
      try {
        parsed.data = JSON.parse(content);
        parsed.body = '```json\n' + content + '\n```'; // Embed for display
      } catch (e) {
        parsed.malformed = true;
      }
    } else {
      parsed = parseFrontmatter(content);
    }

    if (parsed.malformed) continue;
    
    const attr = parsed.data || {};
    if (attr.status === 'arxivat' || attr.status === 'quarantena') continue;

    // Use directory name as category
    const relDir = path.dirname(path.relative(ROOT, file));
    // E.g. "_wiki_de_poble/01_ser" -> "01_ser"
    const dirParts = relDir.split(path.sep);
    let categoryName = dirParts[dirParts.length - 1];
    if (categoryName === '.' || categoryName === '_wiki_de_poble' || categoryName === '.agents') categoryName = 'Arrel';

    if (!categoriesMap.has(categoryName)) {
      categoriesMap.set(categoryName, `cat_${catIdCounter++}`);
    }
    const categoryId = categoriesMap.get(categoryName);
    
    const baseName = path.basename(file, '.md');
    // Si tenim title al frontmatter, el fem servir; si no, el nom del fitxer
    const title = attr.name || attr.title || baseName;
    const subtitle = attr.description || attr.type || '';

    let id = resolIdentitat(file);

    items.push({
      id: id,
      title,
      subtitle,
      categoryId,
      tags: attr.tags || [],
      attributes: attr,
      content: processWikiLinks(parsed.body)
    });
  }
}

const categories = Array.from(categoriesMap.entries()).map(([label, id]) => ({
  id,
  label: label.replace(/^[0-9]+_/, '').replace(/_/g, ' ').toUpperCase()
}));

const manifest = {
  categories,
  items
};

const isCheckMode = process.argv.includes('--check');

// Verificació d'integritat dels enllaços
if (isCheckMode) {
  const validIds = new Set(items.map(i => i.id));
  let hasErrors = false;
  
  for (const item of items) {
    const regex = /\?item=([^)]+)/g;
    let match;
    while ((match = regex.exec(item.content)) !== null) {
      const targetId = decodeURIComponent(match[1]);
      if (!validIds.has(targetId)) {
        console.error(`❌ Enllaç trencat a ${item.id}: el destí '${targetId}' no existeix al manifest.`);
        hasErrors = true;
      }
    }
  }
  
  if (hasErrors) {
    if (process.argv.includes('--strict')) {
      console.error("💥 La verificació de la Wiki ha fallat perquè hi ha enllaços trencats.");
      process.exit(1);
    } else {
      console.warn("⚠️ Hi ha enllaços trencats a la Wiki (desactivat crash per defecte per no bloquejar).");
    }
  } else {
    console.log("✅ Totes les rutes de la Wiki estan ben enllaçades.");
  }
}

// Assegurem que el directori de destí existeix
const outDir = path.dirname(OUT_FILE);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const fileContent = `// Aquest fitxer és generat automàticament per tooling/wiki/compile-wiki-to-app.mjs
// NO l'editis manualment.

export const wikiManifest = ${JSON.stringify(manifest, null, 2)};
`;

fs.writeFileSync(OUT_FILE, fileContent, 'utf8');
console.log(`✅ Manifest de la Wiki generat a src/data/wikiManifest.js amb ${items.length} documents.`);

