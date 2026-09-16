#!/usr/bin/env node
/**
 * tractor-cervell-ia.mjs — Tractor d'Auto-Categorització (Radar Mode)
 *
 * Principi: Llig el cos de cada document, n'extrau el significat i detecta
 * anomalies de frontmatter basant-se en l'esquema v2.1.
 *
 * Regles (Pedra Seca):
 * 1. Zero LLM extern en temps d'execució.
 * 2. 100% LECTURA. Només imprimeix un dictamen per consola. "Una sola arada per solc".
 * 3. La reescriptura del frontmatter depèn de les portes mecàniques oficials, no d'aquest tractor.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildWikiIndex, parseFrontmatter } from './lib/wiki_walker.mjs';
import { parseFrontmatter as readSharedFm } from './lib/frontmatter.mjs';
import { WIKI_DIR, SKILLS_DIR, TOOLING_WIKI_DIR } from './lib/project_paths.mjs';

const ESQUEMA_PATH = path.join(TOOLING_WIKI_DIR, 'schema.json');

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

// --- 2. MOTOR D'INFERÈNCIA TF-IDF LÈXIC ---
function deduiexTipus(title, desc, body) {
  const fullText = `${title} ${title} ${title} ${desc} ${desc} ${body}`.toLowerCase();
  
  if (/\b(acta|sessio|marmota)\b/i.test(fullText)) return 'acta';
  if (/\b(prompt|petorreta)\b/i.test(fullText)) return 'petorreta';
  if (/\b(auditoria|informe)\b/i.test(fullText)) return 'informe';
  if (/\bskill\b/i.test(fullText)) return 'skill';
  
  return 'document'; // Fallback per defecte
}

function dedueixTags(title, desc, body) {
  const fullText = `${title} ${title} ${title} ${desc} ${desc} ${body}`.toLowerCase();
  const foundTags = [];

  for (const tag of TAGS_PERMESOS) {
    const regex = new RegExp(`\\b${tag.toLowerCase()}\\b`, 'i');
    if (regex.test(fullText)) {
      foundTags.push(tag);
    }
  }
  
  return foundTags.slice(0, 3);
}

// --- 3. FUNCIÓ PRINCIPAL ---
async function principal() {
  console.log(`🚜 Iniciant Tractor d'Auto-Categorització (Mode: RADAR / LECTURA PURA)`);

  // Caminem Wiki i Skills
  const wikiIndex = await buildWikiIndex(WIKI_DIR);
  const skillsIndex = await buildWikiIndex(SKILLS_DIR);
  
  const allDocs = [...wikiIndex.mdDocs, ...skillsIndex.mdDocs];
  let processedCount = 0;
  
  const dictamen = {
    data: new Date().toISOString(),
    anomalies: []
  };

  for (const doc of allDocs) {
    // Ignorem directoris prohibits i els propis dictàmens històrics
    if (doc.relPath.includes('01_Produccio') || doc.relPath.includes('90_arxiu_historic') || doc.name.includes('_DICTAMEN_') || doc.name.includes('_BUNDLE_')) {
      continue;
    }

    const fm = readSharedFm(doc.content);
    const fmData = fm.data;
    
    // Purgar entropia zero heretada (Només detectem per a l'informe)
    let teEntropiaZero = false;
    let teTagsForasters = false;
    let faltaTipus = false;
    let faltenTags = false;
    
    const allowedKeys = Object.keys(schema.properties);
    
    // Purga inversa: busquem qualsevol clau que no estiga a l'esquema
    Object.keys(fmData).forEach(key => {
      if (!allowedKeys.includes(key)) {
        teEntropiaZero = true;
        if (!dictamen.anomalies.clausFalses) dictamen.anomalies.clausFalses = [];
      }
    });
    
    if (fmData.tags && Array.isArray(fmData.tags)) {
      const validTags = fmData.tags.filter(t => TAGS_PERMESOS.includes(t));
      if (validTags.length !== fmData.tags.length) teTagsForasters = true;
    }
    
    if (!fmData.tipus || !TIPUS_PERMESOS.includes(fmData.tipus)) {
      faltaTipus = true;
    }
    
    if (!fmData.tags || fmData.tags.length === 0) {
      faltenTags = true;
    }

    if (teEntropiaZero || teTagsForasters || faltaTipus || faltenTags) {
      processedCount++;
      const proposta = { ...fmData };
      
      // Construïm la proposta neta per l'informe
      Object.keys(proposta).forEach(key => {
        if (!allowedKeys.includes(key)) delete proposta[key];
      });
      
      if (teTagsForasters && proposta.tags) {
        proposta.tags = proposta.tags.filter(t => TAGS_PERMESOS.includes(t));
      }
      
      if (faltaTipus) {
        proposta.tipus = deduiexTipus(doc.name, proposta.description || '', fm.body);
      }
      
      if (faltenTags) {
        const sugg = dedueixTags(doc.name, proposta.description || '', fm.body);
        if (sugg.length > 0) proposta.tags = sugg;
      }

      dictamen.anomalies.push({
        fitxer: doc.relPath,
        motius: {
          entropiaZero: teEntropiaZero,
          tagsForasters: teTagsForasters,
          mancaTipus: faltaTipus,
          mancaTags: faltenTags
        },
        propostaFrontmatter: proposta
      });
    }
  }

  // Generar dictamen a stdout
  console.log(`\n======================================================`);
  console.log(`# 🚜 Dictamen Radar Tractor Auto-Categorització`);
  console.log(`======================================================`);
  console.log(`Fitxers escanejats totals: ${allDocs.length}`);
  console.log(`Fitxers amb anomalies semàntiques: ${processedCount}`);
  console.log(`======================================================\n`);
  
  for (const anomalia of dictamen.anomalies) {
    console.log(`### ${anomalia.fitxer}`);
    let problemes = [];
    if (anomalia.motius.entropiaZero) problemes.push("Claus fòssils");
    if (anomalia.motius.tagsForasters) problemes.push("Tags fora d'esquema");
    if (anomalia.motius.mancaTipus) problemes.push("Manca Tipus (Inferit)");
    if (anomalia.motius.mancaTags) problemes.push("Manca Tags (Inferits)");
    console.log(`- **Detectat:** ${problemes.join(', ')}`);
    console.log(`- **Proposta neta:**\n\`\`\`json\n${JSON.stringify(anomalia.propostaFrontmatter, null, 2)}\n\`\`\`\n`);
  }
  
  if (processedCount === 0) {
    console.log(`✅ Cap anomalia semàntica detectada. Tot net.`);
  } else {
    console.log(`\n⚠️ ${processedCount} documents requereixen atenció. Feu servir els codemods o el Reflex per escriure les solucions.`);
  }
}

principal().catch(console.error);
