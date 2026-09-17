#!/usr/bin/env node
/**
 * tractor-cervell-ia.mjs — Tractor d'Auto-Categorització (RADAR PUR)
 *
 * Principi: Llig el cos de cada document, n'extrau el significat i DETECTA
 * anomalies de frontmatter. NO MODIFICA RES. Zero escriptura.
 *
 * Regles (Pedra Seca):
 * 1. Zero LLM extern en temps d'execució.
 * 2. 100% LECTURA. Només imprimeix un dictamen per consola.
 * 3. Zero escriptura al sistema de fitxers.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildWikiIndex } from './lib/wiki_walker.mjs';
import { parseFrontmatter as readSharedFm } from './lib/frontmatter.mjs';
import { WIKI_DIR, SKILLS_DIR, TOOLING_WIKI_DIR } from './lib/project_paths.mjs';

const ESQUEMA_PATH = path.join(TOOLING_WIKI_DIR, 'schema.json');

// --- LECTURA DE L'ESQUEMA CANÒNIC ---
let schema;
try {
  schema = JSON.parse(readFileSync(ESQUEMA_PATH, 'utf8'));
} catch (err) {
  console.error("❌ Error crític: No s'ha pogut llegir schema.json");
  process.exit(1);
}

const TIPUS_PERMESOS = schema.properties.type.enum;
const TAGS_PERMESOS = schema.properties.tags.items.enum;
const CLAUS_PERMESES = Object.keys(schema.properties);

/** Inferència de tipus basat en contingut (no destructiu) */
function inferirTipus(nom, desc, cos) {
  const text = `${nom} ${desc || ''} ${cos || ''}`.toLowerCase();
  if (/\b(acta|sessi[oó]|marmota)\b/i.test(text)) return 'acta';
  if (/\b(pelorreta|prompt|petorreta)\b/i.test(text)) return 'petorreta';
  if (/\b(auditor[iaí]|informe|dictamen)\b/i.test(text)) return 'informe';
  if (/\bskill\b/i.test(text)) return 'skill';
  return null; // No inferim per defecte: millor no endevinar
}

/** Inferència de tags basat en contingut (màx 3) */
function inferirTags(nom, desc, cos) {
  const text = `${nom} ${desc || ''} ${cos || ''}`.toLowerCase();
  const found = [];
  for (const tag of TAGS_PERMESOS) {
    if (new RegExp(`\\b${tag.toLowerCase()}\\b`, 'iu').test(text)) {
      found.push(tag);
      if (found.length >= 3) break;
    }
  }
  return found;
}

async function escanejar() {
  console.log('🚜 Tractor RADAR: Escanejant sense modificar...');

  const wikiIndex = await buildWikiIndex(WIKI_DIR);
  const skillsIndex = await buildWikiIndex(SKILLS_DIR);
  const allDocs = [...wikiIndex.mdDocs, ...skillsIndex.mdDocs];

  const anomalies = [];
  let escanejats = 0;

  for (const doc of allDocs) {
    // Salta directoris prohibits i dictàmens
    if (doc.relPath.includes('01_Produccio') ||
        doc.relPath.includes('90_arxiu_historic') ||
        doc.name.includes('_DICTAMEN_') ||
        doc.name.includes('_BUNDLE_') ||
        doc.name.includes('PETORRETA_')) {
      continue;
    }

    escanejats++;
    const fm = readSharedFm(doc.content);
    const data = fm.data;
    const body = fm.body || '';

    const problema = {
      fitxer: doc.relPath,
      original: { ...data },
      clausFalses: [],
      tagsInvalids: [],
      mancaTipus: false,
      mancaTags: false,
      mancaDescripcio: false
    };

    // 1. Claus no permeses (entropia zero)
    for (const key of Object.keys(data)) {
      if (!CLAUS_PERMESES.includes(key)) {
        problema.clausFalses.push(key);
      }
    }

    // 2. Tags invàlids
    if (data.tags && Array.isArray(data.tags)) {
      problema.tagsInvalids = data.tags.filter(t => !TAGS_PERMESOS.includes(t));
    }

    // 3. Camps obligatoris
    const currentType = data.type || data.tipus;
    if (!currentType || !TIPUS_PERMESOS.includes(currentType)) {
      problema.mancaTipus = true;
    }
    if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
      problema.mancaTags = true;
    }
    if (!data.description || data.description.length < 12) {
      problema.mancaDescripcio = true;
    }

    // Només registrem si hi ha anomalies
    const teProblemes =
      problema.clausFalses.length > 0 ||
      problema.tagsInvalids.length > 0 ||
      problema.mancaTipus ||
      problema.mancaTags ||
      problema.mancaDescripcio;

    if (teProblemes) {
      const suggeriments = {};
      
      // Inferència (només si falta)
      if (problema.mancaTipus) {
        const inferit = inferirTipus(doc.name, data.description, body);
        if (inferit) suggeriments.type = inferit;
      }

      if (problema.mancaTags) {
        const inferits = inferirTags(doc.name, data.description, body);
        if (inferits.length > 0) {
          suggeriments.tags = inferits;
        }
      }

      problema.suggeriments = suggeriments;
      anomalies.push(problema);
    }
  }

  // ===== INFORME =====
  console.log('\n' + '='.repeat(60));
  console.log('# 🚜 DICTAMEN TRACTOR (MODE RADAR - SENSE MODIFICACIONS)');
  console.log('='.repeat(60));
  console.log(`Fitxers escanejats: ${escanejats}`);
  console.log(`Documents amb anomalies: ${anomalies.length}`);
  console.log('='.repeat(60) + '\n');

  for (const a of anomalies) {
    console.log(`## ${a.fitxer}`);
    const issues = [];
    if (a.clausFalses.length > 0) issues.push(`Claus no permeses: [${a.clausFalses.join(', ')}]`);
    if (a.tagsInvalids.length > 0) issues.push(`Tags invàlids: [${a.tagsInvalids.join(', ')}]`);
    if (a.mancaTipus) issues.push('Manca tipus');
    if (a.mancaTags) issues.push('Manca tags');
    if (a.mancaDescripcio) issues.push('Descripció massa curta');

    console.log(`- **Anomalies:** ${issues.join('; ')}`);
    if (Object.keys(a.suggeriments).length > 0) {
      console.log(`- **Suggeriments (NO APLICATS):**`);
      console.log('```json');
      console.log(JSON.stringify(a.suggeriments, null, 2));
      console.log('```\n');
    }
  }

  if (anomalies.length === 0) {
    console.log('✅ **Tot net: cap anomalia semàntica detectada.**');
  } else {
    console.log(`⚠️  **${anomalies.length} documents necessiten revisió manual.**`);
    console.log('    Feu servir: node tooling/wiki/codemod_frontmatter.mjs --fix');
  }

  return { escanejats, anomalies };
}

escanejar().catch(console.error);
