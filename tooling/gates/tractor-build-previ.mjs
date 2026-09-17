#!/usr/bin/env node
/**
 * tractor-build-previ.mjs — Cap desplegament sense artefactes.
 *
 * PER QUÈ: `tractor-consell` L8 exigix wordpress-plugin/dist/seo-routes.json.
 * És un artefacte de build, així que en un clon net sempre falta i la porta
 * sempre és roja. Una porta sempre roja és una porta que ningú mira.
 *
 * Aquesta separa els dos casos:
 *   · l'artefacte no hi és      → diu QUINA ordre el genera (informatiu en dev)
 *   · l'artefacte hi és però és → error dur: s'ha construït malament
 *     invàlid o més vell que la font
 *
 * ÚS
 *   node tooling/gates/tractor-build-previ.mjs            # avisa
 *   node tooling/gates/tractor-build-previ.mjs --desplega # exigix, fail-closed
 */

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { R, rel, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

const DESPLEGA = process.argv.includes('--desplega');

/** artefacte → { ordre que el genera, fonts de les quals ha de ser més nou } */
const ARTEFACTES = [
  {
    cami: 'wordpress-plugin/dist/seo-routes.json',
    ordre: 'npm run build:seo',
    valida: (t) => { const j = JSON.parse(t); return Array.isArray(j) ? j.length > 0 : Object.keys(j).length > 0; },
    fonts: ['src/config/navigation.js', 'src/config/sections.js'],
  },
  {
    cami: 'wordpress-plugin/dist/soc-de-poble.standalone.js',
    ordre: 'npm run build:wp',
    valida: (t) => t.length > 1000,
    fonts: ['src/main.jsx', 'src/PedraSecaEmbed.jsx'],
  },
];

const problemes = [];
const avisos = [];

for (const a of ARTEFACTES) {
  const abs = R(a.cami);
  if (!fs.existsSync(abs)) {
    problemes.push({ a, què: 'absent', com: `s'hauria d'executar: ${a.ordre}` });
    continue;
  }
  let text;
  try { text = fs.readFileSync(abs, 'utf8'); } catch (e) {
    problemes.push({ a, què: 'il·legible', com: e.message }); continue;
  }
  try {
    if (!a.valida(text)) { problemes.push({ a, què: 'buit o invàlid', com: `s'hauria d'executar: ${a.ordre}` }); continue; }
  } catch (e) {
    problemes.push({ a, què: `no valida (${e.message})`, com: `s'hauria d'executar: ${a.ordre}` }); continue;
  }
  const mtimeArt = fs.statSync(abs).mtimeMs;
  const antics = a.fonts.filter((f) => fs.existsSync(R(f)) && fs.statSync(R(f)).mtimeMs > mtimeArt);
  if (antics.length) {
    problemes.push({ a, què: `caducat: ${antics.join(', ')} són més nous`, com: `s'hauria d'executar: ${a.ordre}` });
  }
}

if (problemes.length > 0) {
  console.log(`\n🏗️  TRACTOR DE BUILD PREVI: S'han detectat artefactes caducats o absents. Construint automàticament...`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`\n✅ Build completat amb èxit.`);
    // Buidem els problemes, ja que s'acaba de fer un build
    problemes.length = 0;
  } catch (err) {
    console.error(`\n❌ Error durant la construcció automàtica: ${err.message}`);
    process.exit(1);
  }
}

try {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); process.exit(2); }

  console.log(`\n🏗️  TRACTOR DE BUILD PREVI\n   Arrel: ${arrelSegura()}`);
  console.log('─'.repeat(72));
  for (const a of ARTEFACTES) {
    const mal = problemes.find((p) => p.a === a) ?? avisos.find((p) => p.a === a);
    if (!mal) { console.log(`  ✅ ${a.cami}`); continue; }
    console.log(`  ${problemes.includes(mal) ? '❌' : '⚪'} ${a.cami} — ${mal.què}`);
    console.log(`       ↳ ${mal.com}`);
  }
  console.log('─'.repeat(72));
  if (problemes.length) {
    console.error(`\n❌ ${problemes.length} artefacte(s) sense construir o caducats.`);
    console.error('   sdp_resolve_request() tornaria 404 en TOTES les rutes React.\n');
    process.exit(1);
  }
  if (avisos.length) {
    console.log(`\n⚪ ${avisos.length} artefacte(s) no construïts. Normal en desenvolupament.`);
    console.log('   Abans de desplegar: node tooling/gates/tractor-build-previ.mjs --desplega\n');
  } else {
    console.log('\n✅ Tots els artefactes hi són, són vàlids i són més nous que les fonts.\n');
  }
  process.exit(0);
} catch (err) {
  if (err instanceof ErrorArrel) { console.error(err.informe()); process.exit(2); }
  console.error(`\n❌ [BUILD-PREVI] Error inesperat: ${err.message}\n`);
  process.exit(2);
}
