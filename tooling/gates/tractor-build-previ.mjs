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
 *
 * RECURSIÓ TALLADA (260918)
 * ─────────────────────────
 * Esta porta executa `npm run build` quan els artefactes falten o han
 * caducat. Mentre `build` acabava amb `&& npm run gate`, això era un cicle:
 * build → gate → esta porta → build → … El tall és a package.json (`build`
 * ja no crida `gate`) i run-portes.mjs porta una guarda (SDP_DINS_DE_PORTA)
 * que mata qualsevol reincidència a la primera volta. Ací no cal res més,
 * però que quede escrit: NO afegiu `npm run gate` a cap ordre que esta
 * porta puga executar.
 *
 * ARTEFACTE SEO RETIRAT (260918)
 * ──────────────────────────────
 * `wordpress-plugin/dist/seo-routes.json` figurava ací amb l'ordre
 * `npm run build:seo`, però eixe script i el seu generador
 * (tooling/gates/build-seo-manifest.mjs) ja no existixen (commit 3f5a8b38).
 * Un artefacte que cap ordre pot generar només pot estar «absent», i esta
 * porta el construiria en bucle sense aconseguir-lo mai. Es retira d'ací.
 * ATENCIÓ: tooling/scripts/tractor-consell-core.mjs (L8) encara l'exigix;
 * és una decisió pendent del Consell (vegeu l'informe
 * 260918_0300_informe_auditoria_extrema_postmigracio_claude, C-3).
 */

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { R, rel, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

const DESPLEGA = process.argv.includes('--desplega');

/** artefacte → { ordre que el genera, fonts de les quals ha de ser més nou } */
const ARTEFACTES = [
  {
    cami: 'wordpress-plugin/dist/soc-de-poble.standalone.js',
    ordre: 'npm run build:wp',
    valida: (t) => t.length > 1000,
    fonts: ['src/main.jsx', 'src/PedraSecaEmbed.jsx'],
  },
];

const avisos = [];

/** Comprova cada artefacte i torna la llista de problemes. Pura: es pot repetir després del build. */
function comprovaArtefactes() {
  const trobats = [];
  for (const a of ARTEFACTES) {
    const abs = R(a.cami);
    if (!fs.existsSync(abs)) {
      trobats.push({ a, què: 'absent', com: `s'hauria d'executar: ${a.ordre}` });
      continue;
    }
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch (e) {
      trobats.push({ a, què: 'il·legible', com: e.message }); continue;
    }
    try {
      if (!a.valida(text)) { trobats.push({ a, què: 'buit o invàlid', com: `s'hauria d'executar: ${a.ordre}` }); continue; }
    } catch (e) {
      trobats.push({ a, què: `no valida (${e.message})`, com: `s'hauria d'executar: ${a.ordre}` }); continue;
    }
    const mtimeArt = fs.statSync(abs).mtimeMs;
    const antics = a.fonts.filter((f) => fs.existsSync(R(f)) && fs.statSync(R(f)).mtimeMs > mtimeArt);
    if (antics.length) {
      trobats.push({ a, què: `caducat: ${antics.join(', ')} són més nous`, com: `s'hauria d'executar: ${a.ordre}` });
    }
  }
  return trobats;
}

let problemes = comprovaArtefactes();

if (problemes.length > 0) {
  console.log(`\n🏗️  TRACTOR DE BUILD PREVI: S'han detectat artefactes caducats o absents. Construint automàticament...`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`\n✅ Build completat amb èxit.`);
    /* Abans es feia `problemes.length = 0` a cegues: un build que no
       generava l'artefacte passava igualment. Ara es torna a comprovar. */
    problemes = comprovaArtefactes();
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
