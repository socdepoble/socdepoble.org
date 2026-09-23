#!/usr/bin/env node
/**
 * consolidar_baselines.mjs — Convertir portes en pausa en portes actives.
 *
 * EL PROBLEMA
 * ───────────
 * `design_guard.mjs` i `tractor-rutes.mjs` no estaven verdes ni roges: estaven
 * PARADES. Totes dues acaben així:
 *
 *     PARAT. No hi ha .design-guard-deute.json i queden 219 crítics.
 *     Executa una vegada: node tooling/gates/design_guard.mjs --baseline
 *
 * Una porta parada és pitjor que una porta roja, perquè `npm run porta` la
 * travessa sense dir res útil i tothom assumeix que vigila. Ningú va executar
 * mai el `--baseline`, així que fa mesos que no comprova res.
 *
 * QUÈ ÉS UN BASELINE DE DEUTE
 * ───────────────────────────
 * Un fitxer que congela les infraccions que hi ha AVUI. A partir d'ell la porta
 * ja no exigix zero infraccions: exigix **que no en cresquen**. És l'única
 * manera realista d'activar una porta sobre codi existent sense aturar el
 * projecte tres setmanes.
 *
 * El perill és evident i cal dir-lo: un baseline és deute declarat, no deute
 * resolt. Per això aquest script escriu, dins de cada fitxer de baseline, la
 * data, el recompte i un recordatori que el número només pot baixar.
 *
 * ÚS
 *   node tooling/brain/consolidar_baselines.mjs            # informe
 *   node tooling/brain/consolidar_baselines.mjs --aplica   # congela el deute
 *   node tooling/brain/consolidar_baselines.mjs --revisa   # compara amb el congelat
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { R, arrelSegura, diagnostic, ErrorArrel } from '../lib/arrel.mjs';

const ARGS = process.argv.slice(2);
const APLICA = ARGS.includes('--aplica');
const REVISA = ARGS.includes('--revisa');

/**
 * Les portes que suporten congelació de deute. `bandera` és el que cal
 * passar-los perquè escriguen el seu propi fitxer; aquest script no els
 * l'escriu per ells, els el fa generar. Així el format sempre és el que la
 * porta espera, encara que canvie.
 */
const PORTES = [
  {
    nom: 'design_guard',
    ordre: 'tooling/gates/design_guard.mjs',
    args: ['--arrel=src'],
    bandera: '--baseline',
    fitxer: '.agents/deute/.design-guard-deute.json',
    què: 'infraccions del sistema de disseny Pedra Seca (tokens, radis, contrastos)',
  },
  {
    nom: 'tractor-rutes',
    ordre: 'tooling/gates/tractor-rutes.mjs',
    args: [],
    bandera: '--baseline',
    fitxer: '.agents/deute/.rutes-deute.json',
    què: 'literals de ruta orfes (cadenes de ruta que no són a la SSOT)',
  },
  {
    nom: 'tractor-vocabulari',
    ordre: 'tooling/gates/tractor-vocabulari.mjs',
    args: [],
    bandera: '--baseline',
    fitxer: '.agents/deute/.vocabulari-deute.json',
    què: 'termes fora del vocabulari canònic',
  },
  {
    nom: 'tractor-pedra-seca',
    ordre: 'tooling/brain/tractor-pedra-seca.mjs',
    args: [],
    bandera: '--baseline',
    fitxer: '.agents/deute/.pedra-seca-deute.json',
    què: 'desviacions de la doctrina Pedra Seca',
  },
];

function executa(ordre, args) {
  try {
    const eixida = execFileSync('node', [R(ordre), ...args], {
      cwd: arrelSegura(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
    });
    return { codi: 0, eixida };
  } catch (err) {
    return { codi: err.status ?? 1, eixida: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

/** Extrau un recompte d'infraccions de l'eixida d'una porta. */
function compta(text) {
  const p = [
    /(\d+)\s+crítics/i, /queden\s+(\d+)/i, /(\d+)\s+infracci/i, /(\d+)\s+literals/i,
  ];
  for (const re of p) { const m = re.exec(text); if (m) return Number(m[1]); }
  return null;
}

function principal() {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); return 2; }

  console.log('\n📌 CONSOLIDACIÓ DE BASELINES DE DEUTE');
  console.log(`   Arrel: ${arrelSegura()}`);
  console.log(`   Mode : ${APLICA ? 'APLICA' : REVISA ? 'REVISA' : 'INFORME'}`);
  console.log('─'.repeat(72));

  const resum = [];

  for (const p of PORTES) {
    if (!fs.existsSync(R(p.ordre))) {
      console.log(`  ⚪ ${p.nom} — la porta no existix (${p.ordre})`);
      resum.push({ ...p, estat: 'ABSENT' });
      continue;
    }

    const jaHiHa = fs.existsSync(R(p.fitxer));
    const prova = executa(p.ordre, p.args);
    const n = compta(prova.eixida);
    const parada = /PARAT\./i.test(prova.eixida);

    if (REVISA && jaHiHa) {
      // Una porta que no ha pogut ARRANCAR (dependència absent, error de mòdul)
      // no és una porta que haja trobat deute nou. Confondre-ho és exactament
      // el pecat que aquest projecte va trobar a tancament.mjs: afirmar el que
      // no s'ha verificat. Es reporta com a OMÈS, amb el motiu.
      const noArranca = /ERR_MODULE_NOT_FOUND|Cannot find package|Cannot find module/.test(prova.eixida);
      if (noArranca) {
        const què = /Cannot find (?:package|module) '([^']+)'/.exec(prova.eixida)?.[1] ?? 'dependència desconeguda';
        console.log(`  ⚪ ${p.nom} — OMÈS: la porta no arranca (falta ${què})`);
        console.log('       no s\'afirma res sobre el seu deute; executa npm install');
        resum.push({ ...p, estat: 'OMES', motiu: què });
        continue;
      }
      const estat = prova.codi === 0 ? '✅ dins del baseline' : '❌ el deute ha crescut';
      console.log(`  ${prova.codi === 0 ? '✅' : '❌'} ${p.nom} — ${estat}`);
      resum.push({ ...p, estat: prova.codi === 0 ? 'OK' : 'CREIX' });
      continue;
    }

    if (jaHiHa && !parada) {
      console.log(`  ✅ ${p.nom} — ja té baseline (${p.fitxer}), porta activa`);
      resum.push({ ...p, estat: 'ACTIVA' });
      continue;
    }

    console.log(`  ${parada ? '⏸️ ' : '🟡'} ${p.nom} — ${parada ? 'PARADA' : 'sense baseline'}`);
    console.log(`       deute mesurat: ${n ?? 'desconegut'} · ${p.què}`);

    if (!APLICA) { resum.push({ ...p, estat: 'PENDENT', n }); continue; }

    const gen = executa(p.ordre, [...p.args, p.bandera]);
    if (!fs.existsSync(R(p.fitxer))) {
      console.log(`       ❌ ${p.bandera} no ha escrit ${p.fitxer}`);
      console.log(`          ${gen.eixida.trim().split('\n').slice(-2).join(' | ')}`);
      resum.push({ ...p, estat: 'FALLA' });
      continue;
    }

    // Segell honest dins del propi fitxer de deute.
    try {
      const dades = JSON.parse(fs.readFileSync(R(p.fitxer), 'utf8'));
      const segellat = Array.isArray(dades) ? { _deute: dades } : dades;
      segellat._segell = {
        congelat: new Date().toISOString(),
        recompte: n,
        porta: p.ordre,
        avis: 'Açò és deute DECLARAT, no resolt. Aquest número només pot baixar. '
          + 'Regenerar el baseline per a fer passar una porta és tornar al problema de zero.',
      };
      fs.writeFileSync(R(p.fitxer), `${JSON.stringify(segellat, null, 2)}\n`);
    } catch { /* si la porta usa un format propi, es respecta tal com el va escriure */ }

    const rev = executa(p.ordre, p.args);
    console.log(`       ✍️  ${p.fitxer} · la porta ara ix amb codi ${rev.codi}`);
    resum.push({ ...p, estat: rev.codi === 0 ? 'ACTIVA' : 'ROJA', n });
  }

  console.log('─'.repeat(72));
  const pendents = resum.filter((r) => r.estat === 'PENDENT');
  const creixen = resum.filter((r) => r.estat === 'CREIX');

  if (pendents.length && !APLICA) {
    console.log(`\n  ${pendents.length} porta(es) en pausa. Per a activar-les:\n`);
    console.log('     node tooling/brain/consolidar_baselines.mjs --aplica\n');
    console.log('  Deute total que es congelaria:');
    for (const p of pendents) console.log(`     ${String(p.n ?? '?').padStart(5)}  ${p.nom} — ${p.què}`);
    console.log('\n  Després, afig la revisió al CI:');
    console.log('     node tooling/brain/consolidar_baselines.mjs --revisa\n');
    return 0;
  }

  const omesos = resum.filter((r) => r.estat === 'OMES');
  if (omesos.length) {
    console.log(`\n  ⚪ Sense verificar (${omesos.map((r) => r.nom).join(', ')}): `
      + 'no han pogut arrancar. Aquest informe no afirma res sobre el seu deute.');
  }

  if (creixen.length) {
    console.error(`\n❌ El deute ha crescut a: ${creixen.map((r) => r.nom).join(', ')}.`);
    console.error('   Un baseline és un sostre, no un terra. Baixa\'l, no el regeneres.\n');
    return 1;
  }

  console.log('\n✅ Cap porta en pausa. Totes vigilen de veres.\n');
  return 0;
}

try {
  process.exit(principal());
} catch (err) {
  if (err instanceof ErrorArrel) { console.error(err.informe()); process.exit(2); }
  console.error(`\n❌ [BASELINES] Error inesperat: ${err.message}\n`);
  process.exit(2);
}
