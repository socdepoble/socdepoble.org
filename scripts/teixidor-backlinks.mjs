#!/usr/bin/env node
/**
 * TEIXIDOR DE BACKLINKS - Sóc de Poble V7
 * 
 * Funció: Escaneja fitxers markdown, troba enllaços [[wiki]],
 * i afegeix automàticament una secció de backlinks als documents destí.
 * 
 * Seguretat:
 * - No esborra mai contingut
 * - No modifica el frontmatter
 * - Afegeix al final del document
 * - Respecta SDP-LOCK: si el document té "locked: true" al frontmatter, s'omet
 * 
 * Ús: node scripts/teixidor-backlinks.mjs --dry-run [--dir=./_wiki_de_poble]
 * L’escriptura antiga està retirada: sense --dry-run, eixida 2 abans de llegir el corpus.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, relative, dirname, sep, isAbsolute } from 'path';
import { readdirSync, realpathSync, lstatSync } from 'fs';

// --- Configuració ---
const DEFAULT_DIR = './_wiki_de_poble';
const BACKLINK_SECTION_HEADER = '## Sinapsis Entrants (Autogenerat)';
const BACKLINK_SECTION_FOOTER = '<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->';
const EXCLUDED_SEGMENTS = new Set([
  'node_modules', '90_historic', '90_arxiu_historic',
  '01_produccio', '02_investigacio_ia', '.sdp-paperera'
]);
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

const LOCK_CHECK_REGEX = /^---\n[\s\S]*?locked:\s*true[\s\S]*?\n---\n/;

// --- Utilitats ---


function isLocked(content) {
  return LOCK_CHECK_REGEX.test(content);
}

function extractWikiLinks(content) {
  const links = new Set();
  let match;
  const regex = new RegExp(WIKILINK_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    links.add(match[1].trim());
  }
  return links;
}

function documentConsultable(file, baseDir) {
  try {
    const rel = relative(realpathSync(baseDir), realpathSync(file));
    return Boolean(rel) && rel !== '..' && !rel.startsWith('..' + sep)
      && !isAbsolute(rel) && !rel.split(sep).some(part => part.startsWith('.') || EXCLUDED_SEGMENTS.has(part))
      && lstatSync(file).isFile() && !lstatSync(file).isSymbolicLink();
  } catch { return false; }
}

function resolveWikiLink(linkName, sourceDir, baseDir) {
  const candidates = [
    resolve(sourceDir, `${linkName}.md`),
    resolve(sourceDir, linkName, `${linkName}.md`),
    resolve(baseDir, `${linkName}.md`),
  ];
  
  function findRecursive(dir, target, depth = 0) {
    if (depth > 5) return null;
    if (!existsSync(dir)) return null;
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || EXCLUDED_SEGMENTS.has(entry.name)) continue;
        
        const fullPath = resolve(dir, entry.name);
        if (entry.isFile() && (entry.name === `${target}.md` || entry.name === target)) {
          if (documentConsultable(fullPath, baseDir)) return fullPath;
        }
        if (entry.isDirectory()) {
          const found = findRecursive(fullPath, target, depth + 1);
          if (found) return found;
        }
      }
    } catch {
      // Ignorar errors de lectura de directori
    }
    return null;
  }
  
  for (const candidate of candidates) {
    if (documentConsultable(candidate, baseDir)) return candidate;
  }
  
  return findRecursive(baseDir, linkName);
}

function getExistingBacklinks(content) {
  const startIdx = content.indexOf(BACKLINK_SECTION_HEADER);
  const endIdx = content.indexOf(BACKLINK_SECTION_FOOTER);
  
  if (startIdx === -1 || endIdx === -1) return null;
  
  return {
    start: startIdx,
    end: endIdx + BACKLINK_SECTION_FOOTER.length,
    content: content.substring(startIdx, endIdx + BACKLINK_SECTION_FOOTER.length)
  };
}

function generateBacklinkSection(backlinks) {
  if (backlinks.length === 0) return null;
  
  const lines = [BACKLINK_SECTION_HEADER, ''];
  for (const bl of backlinks.sort((a, b) => a.path.localeCompare(b.path))) {
    const fileName = bl.path.replace(/\.md$/, '').split('/').pop();
    lines.push(`- [[${fileName}|${bl.path}]]${bl.context ? ` — ${bl.context}` : ''}`);
  }
  lines.push('', BACKLINK_SECTION_FOOTER);
  return lines.join('\n');
}

function extractContext(content, linkName) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes(`[[${linkName}`)) {
      let clean = line.replace(/[*~`]/g, '').replace(/^[\s#>-]+/, '').trim();
      if (clean.length > 80) clean = clean.substring(0, 77) + '...';
      return clean;
    }
  }
  return null;
}

// --- Funció principal ---
function weaveBacklinks(baseDir, dryRun = false) {
  console.log(`🔍 Escanejant directori: ${baseDir}`);
  
  const mdFiles = [];
  function collectFiles(dir) {
    if (!existsSync(dir)) return;
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || EXCLUDED_SEGMENTS.has(entry.name)) continue;
        
        const fullPath = resolve(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.md')) {
          if (entry.name.includes('_BUNDLE_') || entry.name.includes('BUNDLE_')) continue;
          mdFiles.push(fullPath);
        } else if (entry.isDirectory()) {
          collectFiles(fullPath);
        }
      }
    } catch {
      // Ignorar errors
    }
  }
  
  collectFiles(baseDir);
  console.log(`📄 Trobats ${mdFiles.length} fitxers markdown`);
  
  const linkMap = new Map();
  const resolvedCache = new Map();
  
  for (const filePath of mdFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const fileDir = dirname(filePath);
    const links = extractWikiLinks(content, filePath);
    
    for (const linkName of links) {
      // Un mateix [[nom]] pot tindre destins locals diferents segons la font.
      const cacheKey = JSON.stringify([fileDir, linkName]);
      if (!resolvedCache.has(cacheKey)) {
        resolvedCache.set(cacheKey, resolveWikiLink(linkName, fileDir, baseDir));
      }
      
      const destPath = resolvedCache.get(cacheKey);
      if (!destPath) {
        if (dryRun) console.log(`⚠️  Enllaç no resolt: [[${linkName}]] des de ${relative(baseDir, filePath)}`);
        continue;
      }
      
      const relSource = relative(baseDir, filePath);
      const context = extractContext(content, linkName);
      
      if (!linkMap.has(destPath)) {
        linkMap.set(destPath, []);
      }
      
      const existing = linkMap.get(destPath);
      if (!existing.find(e => e.path === relSource)) { // Fix: use e.path not e.sourcePath to match generateBacklinkSection
        existing.push({ path: relSource, context });
      }
    }
  }
  
  console.log(`🔗 Mapa de ${linkMap.size} destins amb backlinks`);
  
  let modified = 0;
  let skipped_locked = 0;
  let skipped_nochange = 0;
  
  for (const [destPath, backlinks] of linkMap) {
    if (!existsSync(destPath)) continue;
    
    let content = readFileSync(destPath, 'utf-8');
    
    if (isLocked(content)) {
      skipped_locked++;
      if (dryRun) console.log(`🔒 Bloquejat: ${relative(baseDir, destPath)}`);
      continue;
    }
    
    const newSection = generateBacklinkSection(backlinks);
    const existing = getExistingBacklinks(content);
    
    let newContent;
    if (!newSection) {
      if (!existing) continue;
      newContent = content.substring(0, existing.start).trimEnd() + '\n' + content.substring(existing.end);
    } else {
      if (existing) {
        if (existing.content === newSection) {
          skipped_nochange++;
          continue;
        }
        newContent = content.substring(0, existing.start) + newSection + content.substring(existing.end);
      } else {
        newContent = content.trimEnd() + '\n\n' + newSection + '\n';
      }
    }
    
    if (dryRun) {
      console.log(`\n📝 [DRY-RUN] Modificaria: ${relative(baseDir, destPath)}`);
      console.log(newSection);
    } else {
      writeFileSync(destPath, newContent, 'utf-8');
      modified++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUM DEL TEIXIDOR');
  console.log('='.repeat(50));
  console.log(`Fitxers escanejats: ${mdFiles.length}`);
  console.log(`Destins amb backlinks: ${linkMap.size}`);
  console.log(`Fitxers modificats: ${modified}`);
  console.log(`Fitxers bloquejats (ometguts): ${skipped_locked}`);
  console.log(`Fitxers sense canvis: ${skipped_nochange}`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (no s\'han escrit canvis)' : 'EXECUCIÓ'}`);
  
  return { modified, skipped_locked, skipped_nochange };
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
// T11: el CLI antic no pot reintroduir seccions després de Vincles ni mutar
// documents sense el contracte de pla, Reflex i rollback de l’eina canònica.
if (!dryRun) {
  console.error('ESCRIPTURA RETIRADA (T11): usa --dry-run per a una consulta sense canvis. Les mutacions requerixen el circuit documental canònic.');
  process.exit(2);
}
const dirArgs = args.filter(a => a.startsWith('--dir='));
if (args.filter(a => a === '--dry-run').length !== 1 || dirArgs.length > 1
    || args.some(a => a !== '--dry-run' && !a.startsWith('--dir='))
    || dirArgs.some(a => a.length === '--dir='.length)) {
  console.error('Ús: --dry-run [--dir=RUTA], sense opcions desconegudes ni repetides.');
  process.exit(2);
}
const baseDir = resolve(dirArgs.length ? dirArgs[0].slice('--dir='.length) : DEFAULT_DIR);
// Seleccionar directament un subdirectori protegit tampoc no habilita la consulta.
if (baseDir.split(sep).some(part => EXCLUDED_SEGMENTS.has(part))) {
  console.error('Corpus exclòs: arxiu històric o zona protegida.');
  process.exit(2);
}

if (!existsSync(baseDir)) {
  console.error(`❌ Directori no trobat: ${baseDir}`);
  process.exit(1);
}

if (!lstatSync(baseDir).isDirectory() || lstatSync(baseDir).isSymbolicLink()) {
  console.error('El corpus ha de ser un directori regular, no un enllaç simbòlic.');
  process.exit(2);
}

if (realpathSync(baseDir).split(sep).some(part => EXCLUDED_SEGMENTS.has(part))) {
  console.error('Corpus exclòs: la ruta real és arxiu històric o zona protegida.');
  process.exit(2);
}

weaveBacklinks(baseDir, dryRun);
