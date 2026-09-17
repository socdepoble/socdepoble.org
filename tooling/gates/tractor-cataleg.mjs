#!/usr/bin/env node
/**
 * tractor-cataleg.mjs — TIPIFICACIÓ EXTREMA com a condició de commit.
 *
 * C1 REGISTRAT  Tot component exportat (PascalCase) per src/components/PedraSeca/ (recursivament)
 *               té entrada a src/sections/disseny/cataleg/registre.js.
 * C2 VIU        Tota entrada «viu» de PedraSeca s'importa en alguna pàgina del catàleg
 *               (cataleg/Pagina*.jsx o Fonaments: DesignSectionContent.jsx): un espècimen viu és
 *               el component real, no una maqueta.
 * C3 FANTASMA   Cap entrada del registre apunta a un export que ja no existix.
 *
 * Zero dependències. Fail-closed.   node tooling/gates/tractor-cataleg.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ARREL = process.cwd();
const PEDRA_SECA = join(ARREL, 'src/components/PedraSeca');
const CAT = join(ARREL, 'src/sections/disseny/cataleg');

const exportsMap = new Map(); // nom → fitxer
function processDirectory(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const fullPath = join(dir, f);
    if (statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (f.endsWith('.jsx') && !f.endsWith('.test.jsx')) {
      const relPath = 'PedraSeca/' + relative(PEDRA_SECA, fullPath);
      const src = readFileSync(fullPath, 'utf8');
      for (const m of src.matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)) {
        exportsMap.set(m[1], relPath);
      }
    }
  }
}
processDirectory(PEDRA_SECA);

const registre = readFileSync(join(CAT, 'registre.js'), 'utf8');
const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
  .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
const perNom = new Map(entrades.map((e) => [e.nom, e]));

const detalls = readdirSync(join(CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
  .map((f) => readFileSync(join(CAT, 'detalls', f), 'utf8'))
  .join('\n');

const pagines = readdirSync(CAT).filter((f) => /^Pagina.*\.jsx$/.test(f))
  .map((f) => readFileSync(join(CAT, f), 'utf8'))
  .concat(readFileSync(join(ARREL, 'src/sections/disseny/DesignSectionContent.jsx'), 'utf8'))
  .join('\n');

const tot = detalls + '\n' + pagines;
  
const importats = new Set([...tot.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
  .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

const falles = [];
for (const [nom, fitxer] of exportsMap) {
  if (!perNom.has(nom)) falles.push(`C1 ${nom} (${fitxer}) no és al registre del catàleg.`);
}

for (const e of entrades) {
  if (e.fora) continue;
  if (!exportsMap.has(e.nom)) falles.push(`C3 «${e.nom}» és al registre però ${e.fitxer} ja no l'exporta.`);
  else if (e.estat === 'viu' && !importats.has(e.nom)) falles.push(`C2 «${e.nom}» diu «viu» però cap pàgina del catàleg el renderitza.`);
}

const n = (estat) => entrades.filter((e) => e.estat === estat).length;
if (falles.length) {
  console.error(`❌ [CATÀLEG] ${falles.length} infracció(ns):`);
  falles.forEach((f) => console.error('   ' + f));
  process.exit(1);
}
console.log(`✅ [CATÀLEG] ${exportsMap.size} components de PedraSeca/ registrats · viu ${n('viu')} · maqueta ${n('maqueta')} · extern ${n('extern')} · obsolet ${n('obsolet')}`);
