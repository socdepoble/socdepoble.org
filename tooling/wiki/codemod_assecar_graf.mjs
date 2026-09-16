#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildWikiIndex } from './lib/wiki_walker.mjs';
import { WIKI_DIR, SKILLS_DIR } from './lib/project_paths.mjs';

async function principal() {
  console.log(`🧹 Iniciant Codemod Assecat del Graf...`);

  const wikiIndex = await buildWikiIndex(WIKI_DIR);
  const skillsIndex = await buildWikiIndex(SKILLS_DIR);
  
  const allDocs = [...wikiIndex.mdDocs, ...skillsIndex.mdDocs];
  let processedCount = 0;

  const regexTaxonomia = /\n+## Taxonomia\n- \*\*Categoria:\*\* \[\[[^\]]+\]\]\n- \*\*Etiquetes:\*\* \[\[[^\]]+\]\]\n/g;

  for (const doc of allDocs) {
    if (doc.relPath.includes('01_Produccio') || doc.relPath.includes('90_arxiu_historic')) {
      continue;
    }

    if (regexTaxonomia.test(doc.content)) {
      const nouContingut = doc.content.replace(regexTaxonomia, '\n');
      await fs.writeFile(doc.fullPath, nouContingut, 'utf8');
      processedCount++;
    }
  }

  console.log(`✅ Procés completat. Fitxers assecats: ${processedCount}.`);
}

principal().catch(console.error);
