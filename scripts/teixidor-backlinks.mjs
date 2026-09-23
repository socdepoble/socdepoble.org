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
 * Ús: node scripts/teixidor-backlinks.mjs [--dry-run] [--dir=./_wiki_de_poble]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, relative, dirname } from 'path';
import { readdirSync } from 'fs';

// --- Configuració ---
const DEFAULT_DIR = './_wiki_de_poble';
const BACKLINK_SECTION_HEADER = '## Sinapsis Entrants (Autogenerat)';
const BACKLINK_SECTION_FOOTER = '<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->';
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n/;
const LOCK_CHECK_REGEX = /^---\n[\s\S]*?locked:\s*true[\s\S]*?\n---\n/;

// --- Utilitats ---
function extractFrontmatter(content) {
  const match = content.match(FRONTMATTER_REGEX);
  return match ? match[0] : null;
}

function isLocked(content) {
  return LOCK_CHECK_REGEX.test(content);
}

function extractWikiLinks(content, sourcePath) {
  const links = new Set();
  let match;
  const regex = new RegExp(WIKILINK_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    links.add(match[1].trim());
  }
  return links;
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
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        const fullPath = resolve(dir, entry.name);
        if (entry.isFile() && (entry.name === `${target}.md` || entry.name === target)) {
          return fullPath;
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
    if (existsSync(candidate)) return candidate;
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
        if (entry.name.startsWith('.') || 
            entry.name === 'node_modules' || 
            entry.name === '90_historic' ||
            entry.name === '.sdp-paperera') continue;
        
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
      if (!resolvedCache.has(linkName)) {
        resolvedCache.set(linkName, resolveWikiLink(linkName, fileDir, baseDir));
      }
      
      const destPath = resolvedCache.get(linkName);
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
const dirArg = args.find(a => a.startsWith('--dir='));
const baseDir = resolve(dirArg ? dirArg.split('=')[1] : DEFAULT_DIR);

if (!existsSync(baseDir)) {
  console.error(`❌ Directori no trobat: ${baseDir}`);
  process.exit(1);
}

weaveBacklinks(baseDir, dryRun);
