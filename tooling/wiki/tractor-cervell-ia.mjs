#!/usr/bin/env node
/**
 * tractor-cervell-ia.mjs — Tractor d'Auto-Categorització
 *
 * Principi: Llig el cos de cada document, n'extrau el significat i assigna
 * les metadades OBLIGATÒRIES i els TAGS tancats basant-se en l'esquema v2.1.
 *
 * Regles (Pedra Seca):
 * 1. Zero LLM extern en temps d'execució. Classificació TF-IDF i lèxica.
 * 2. Memòria Cau per SHA256: Si un fitxer no canvia, se salta.
 * 3. Dry-run per defecte. Escriu un informe de propostes.
 * 4. Poda automàtica d'entropia zero (`socdepoble`, `sistema`).
 */

import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildWikiIndex, parseFrontmatter } from './lib/wiki_walker.mjs';
import { parseFrontmatter as readSharedFm, serializeFrontmatter } from './lib/frontmatter.mjs';
import { WIKI_DIR, SKILLS_DIR, TOOLING_WIKI_DIR, ESCRIPTORI_DIR, INDEX_ESCRIPTORI_FILE } from './lib/project_paths.mjs';

const ESQUEMA_PATH = path.join(TOOLING_WIKI_DIR, 'schema.json');
const CACHE_PATH = path.join(TOOLING_WIKI_DIR, '.cache-tractor.json');

// --- 1. LECTURA DE L'ESQUEMA CANÒNIC ---
let schema;
try {
  schema = JSON.parse(readFileSync(ESQUEMA_PATH, 'utf8'));
} catch (err) {
  console.error("❌ Error crític: No s'ha pogut llegir schema.json");
  process.exit(1);
}

const TIPUS_PERMESOS = schema.properties.tipus.enum;
const TAGS_PERMESOS = schema.properties.tags.items.enum;

// --- 2. CONFIGURACIÓ DE LA MEMÒRIA CAU ---
let cache = {};
if (existsSync(CACHE_PATH)) {
  cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
}

function getSha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// --- 3. MOTOR D'INFERÈNCIA TF-IDF LÈXIC ---
function deduiexTipus(title, desc, body) {
  // Lògica rudimentària basada en pes per deduir el tipus si no existeix
  const fullText = `${title} ${title} ${title} ${desc} ${desc} ${body}`.toLowerCase();
  
  if (fullText.includes('acta') || fullText.includes('sessio') || fullText.includes('marmota')) return 'acta';
  if (fullText.includes('prompt') || fullText.includes('petorreta')) return 'petorreta';
  if (fullText.includes('auditoria') || fullText.includes('informe')) return 'informe';
  if (fullText.includes('skill')) return 'skill';
  
  return 'document'; // Fallback per defecte
}

function dedueixTags(title, desc, body) {
  const fullText = `${title} ${title} ${title} ${desc} ${desc} ${body}`.toLowerCase();
  const foundTags = [];

  for (const tag of TAGS_PERMESOS) {
    if (fullText.includes(tag.toLowerCase())) {
      foundTags.push(tag);
    }
  }
  
  // Retornem només els 3 primers per no ofegar
  return foundTags.slice(0, 3);
}

// --- 4. CONTROL D'ORFENESA (LLAURADOR) ---
async function controlOrfenesa(allDocs, writeMode, dictamen) {
  // El fitxer real està en minúscules al disc, però project_paths l'exporta com a 00_INDEX_ESCRIPTORI.md
  // Utilitzem una ruta que funcioni en macOS/Linux buscant l'arxiu real.
  const indexDir = path.dirname(INDEX_ESCRIPTORI_FILE);
  const indexFiles = await fs.readdir(indexDir);
  const indexRealName = indexFiles.find(f => f.toLowerCase() === '00_index_escriptori.md') || '00_INDEX_ESCRIPTORI.md';
  const realIndexPath = path.join(indexDir, indexRealName);

  if (!existsSync(realIndexPath)) return;

  const indexContent = await fs.readFile(realIndexPath, 'utf8');
  let newIndexContent = indexContent;
  let indexModificat = false;
  
  // 1. Extraure enllaços existents
  const linksRegex = /\[\[([^\]]+)\]\]/g;
  const links = new Set();
  let match;
  while ((match = linksRegex.exec(newIndexContent)) !== null) {
    links.add(match[1].trim());
  }
  
  const mdLinksRegex = /\]\(([^)]+\.md)\)/g;
  while ((match = mdLinksRegex.exec(newIndexContent)) !== null) {
    const filename = path.basename(match[1].trim(), '.md');
    links.add(filename);
  }

  // Creem un set de noms d'arxiu existents reals
  const arxiusReals = new Set();
  allDocs.forEach(d => {
    arxiusReals.add(d.name);
    arxiusReals.add(d.name.replace(/\.md$/, ''));
  });

  // 2. Detecció d'enllaços morts (purgar-los)
  const linies = newIndexContent.split('\n');
  const novesLinies = [];
  let enllacosMorts = 0;
  
  for (const linia of linies) {
    let manteLinia = true;
    const m1 = [...linia.matchAll(/\[\[([^\]]+)\]\]/g)];
    const m2 = [...linia.matchAll(/\]\(([^)]+\.md)\)/g)];
    
    const elementsEnllacats = [...m1.map(m => m[1].trim()), ...m2.map(m => path.basename(m[1].trim(), '.md'))];
    
    if (elementsEnllacats.length > 0) {
      let totsExisteixen = true;
      for (const el of elementsEnllacats) {
        if (!arxiusReals.has(el)) {
          totsExisteixen = false;
          enllacosMorts++;
          break;
        }
      }
      if (!totsExisteixen) manteLinia = false;
    }
    
    if (manteLinia) novesLinies.push(linia);
  }
  
  if (enllacosMorts > 0) {
    newIndexContent = novesLinies.join('\n');
    indexModificat = true;
    if (!writeMode) dictamen.enllacosMortsEliminats = enllacosMorts;
  }
  
  // 3. Detecció d'orfes a l'escriptori
  const escriptoriDocs = allDocs.filter(d => 
    d.relPath.includes('04_escriptori') && 
    !d.relPath.includes('00_bandeja_d_entrada') && 
    !d.relPath.includes('01_produccio') &&
    d.name.toLowerCase() !== '00_index_escriptori.md'
  );
  
  const orfes = [];
  for (const doc of escriptoriDocs) {
    const baseName = doc.name.replace(/\.md$/, '');
    if (!links.has(doc.name) && !links.has(baseName)) {
      orfes.push(baseName);
    }
  }
  
  if (orfes.length > 0) {
    if (!newIndexContent.includes('## Arxius Recuperats pel Tractor')) {
      newIndexContent += '\n\n## Arxius Recuperats pel Tractor\n';
    }
    orfes.forEach(o => {
      newIndexContent += `- [[${o}]]\n`;
    });
    indexModificat = true;
    if (!writeMode) dictamen.orfesAncorats = orfes;
  }
  
  if (indexModificat && writeMode) {
    await fs.writeFile(realIndexPath, newIndexContent, 'utf8');
    console.log(`🧹 Índex Escriptori netejat: ${enllacosMorts} enllaços morts eliminats, ${orfes.length} orfes ancorats.`);
  }
}


// --- 4. FUNCIÓ PRINCIPAL ---
async function principal() {
  const args = process.argv.slice(2);
  const writeMode = args.includes('--escriure');
  
  console.log(`🚜 Iniciant Tractor d'Auto-Categorització (Mode: ${writeMode ? 'ESCRIPTURA' : 'DRY-RUN'})`);

  // Caminem Wiki i Skills
  const wikiIndex = await buildWikiIndex(WIKI_DIR);
  const skillsIndex = await buildWikiIndex(SKILLS_DIR);
  
  const allDocs = [...wikiIndex.mdDocs, ...skillsIndex.mdDocs];
  let processedCount = 0;
  let cachedCount = 0;
  
  const dictamen = {
    data: new Date().toISOString(),
    propostes: []
  };

  for (const doc of allDocs) {
    // Ignorem directoris prohibits
    if (doc.relPath.includes('01_Produccio') || doc.relPath.includes('90_arxiu_historic')) {
      continue;
    }

    const sha = getSha256(doc.content);
    if (cache[doc.fullPath] === sha) {
      cachedCount++;
      continue; // No ha canviat
    }

    const fm = readSharedFm(doc.content);
    const fmData = fm.data;
    const body = fm.body;
    
    // Purgar entropia zero heretada
    let changed = false;
    ['socdepoble', 'sistema', 'created_at', 'authoring_agent', 'doc_id', 'doc_type', 'version_semver', 'owner', 'domain', 'locale', 'hora_creacio', 'academic_metadata', 'cssclasses', 'title'].forEach(key => {
      if (fmData[key] !== undefined) {
        delete fmData[key];
        changed = true;
      }
    });
    
    // Validar/Purgar tags forasters
    if (fmData.tags && Array.isArray(fmData.tags)) {
      const originalTags = [...fmData.tags];
      fmData.tags = fmData.tags.filter(t => TAGS_PERMESOS.includes(t));
      if (originalTags.length !== fmData.tags.length) changed = true;
    }
    
    // Categorització si falten dades canòniques
    if (!fmData.tipus || !TIPUS_PERMESOS.includes(fmData.tipus)) {
      fmData.tipus = deduiexTipus(doc.name, fmData.description || '', body);
      changed = true;
    }
    
    if (!fmData.tags || fmData.tags.length === 0) {
      const suggestedTags = dedueixTags(doc.name, fmData.description || '', body);
      if (suggestedTags.length > 0) {
        fmData.tags = suggestedTags;
        changed = true;
      }
    }

    if (changed) {
      processedCount++;
      const nouContingut = serializeFrontmatter(fmData, ['estat', 'tipus', 'description', 'aliases', 'tags']) + '\n' + body.trimStart();
      
      if (writeMode) {
        await fs.writeFile(doc.fullPath, nouContingut, 'utf8');
        cache[doc.fullPath] = getSha256(nouContingut);
      } else {
        dictamen.propostes.push({
          fitxer: doc.relPath,
          novaMetadata: fmData
        });
      }
    } else {
      cache[doc.fullPath] = sha; // Si estava bé, refresquem cache
    }
  }

  // Desem cache i executem control d'orfenesa
  await controlOrfenesa(allDocs, writeMode, dictamen);

  if (writeMode) {
    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`✅ Procés completat. Fitxers modificats: ${processedCount}. Fitxers en cau: ${cachedCount}`);
  } else {
    // Generar dictamen
    const now = new Date();
    const prefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const dictamenName = `${prefix}_DICTAMEN_informe_tractor.md`;
    const dictamenPath = path.join(ESCRIPTORI_DIR, dictamenName);
    
    let mdContent = `# 🚜 Dictamen Tractor Auto-Categorització\n\n`;
    mdContent += `Fitxers a modificar: ${processedCount}\nFitxers al cau (intactes): ${cachedCount}\n\n`;
    
    if (dictamen.enllacosMortsEliminats || dictamen.orfesAncorats) {
      mdContent += `## 🧹 Llaurador d'Índexs\n`;
      if (dictamen.enllacosMortsEliminats) mdContent += `- **Enllaços morts detectats:** ${dictamen.enllacosMortsEliminats}\n`;
      if (dictamen.orfesAncorats) {
        mdContent += `- **Orfes detectats (${dictamen.orfesAncorats.length}):**\n`;
        dictamen.orfesAncorats.forEach(o => mdContent += `  - [[${o}]]\n`);
      }
      mdContent += `\n`;
    }
    
    for (const p of dictamen.propostes) {
      mdContent += `### ${p.fitxer}\n\`\`\`json\n${JSON.stringify(p.novaMetadata, null, 2)}\n\`\`\`\n\n`;
    }
    
    await fs.writeFile(dictamenPath, mdContent, 'utf8');
    console.log(`✅ Dry-run completat. Dictamen generat a: ${dictamenPath}`);
  }
}

principal().catch(console.error);
