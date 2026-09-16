#!/usr/bin/env node
/**
 * tractor-adaptadors.mjs — Guarda de la capa anticorrupció (ADR-2026-09-FRONTISSA).
 *
 * F1 FRONTERA   La UI (src/app, src/components, src/sections) no importa mai
 *               un traductor d'origen (adaptadors/sollutia, adaptadors/supabase).
 *               Només coneix DTO a través del port.
 * F2 LECTURA    Cap fitxer de src/data/adaptadors/sollutia/ conté verbs
 *               d'escriptura HTTP, DDL SQL ni «service_role».
 * F3 CONTRACTE  Tota fixture capturada a tests/adaptadors/fixtures/sollutia/
 *               passa pel traductor del seu recurs. Si Sollutia canvia el
 *               JSON, açò es posa roig ABANS que la UI ho note.
 * Zero dependències. Fail-closed.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function run() {
  const ARREL = process.cwd();
  const falles = [];
  const recorre = (d, acc = []) => {
    if (!existsSync(d)) return acc;
    for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? recorre(p, acc) : acc.push(p); }
    return acc;
  };

  for (const dir of ['src/app', 'src/components', 'src/sections']) {
    for (const f of recorre(join(ARREL, dir)).filter((f) => /\.(m?js|jsx)$/.test(f))) {
      const src = readFileSync(f, 'utf8');
      if (/from\s+['"][^'"]*adaptadors\/(sollutia|supabase)\//.test(src)) falles.push(`F1 ${relative(ARREL, f)} importa un traductor d'origen: la UI només veu DTO.`);
    }
  }

  const PROHIBIT = [/method\s*:\s*['"](POST|PUT|PATCH|DELETE)['"]/i, /\b(CREATE|ALTER|DROP|TRUNCATE)\s+(TABLE|SCHEMA|FUNCTION|POLICY)\b/i, /service_role/];
  for (const f of recorre(join(ARREL, 'src/data/adaptadors/sollutia'))) {
    const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    for (const re of PROHIBIT) if (re.test(src)) falles.push(`F2 ${relative(ARREL, f)} conté ${re}: Sollutia és només lectura.`);
  }

  const dirFix = join(ARREL, 'tests/adaptadors/fixtures/sollutia');
  const fixtures = existsSync(dirFix) ? readdirSync(dirFix).filter((f) => f.endsWith('.json')) : [];
  if (fixtures.length) {
    const { RECURSOS } = await import(pathToFileURL(join(ARREL, 'src/data/adaptadors/sollutia/recursos.js')));
    for (const fx of fixtures) {
      const { recurs, forma } = JSON.parse(readFileSync(join(dirFix, fx), 'utf8'));
      const r = RECURSOS[recurs];
      if (!r?.traductor) { falles.push(`F3 fixture ${fx}: el recurs «${recurs}» no té traductor registrat.`); continue; }
      try { r.llista ? r.traductor.llista(r.extrau ? r.extrau(forma) : forma) : r.traductor(forma); }
      catch (err) { falles.push(`F3 ${fx}: ${err.message}`); }
    }
  }

  if (falles.length) { console.error(`❌ [FRONTISSA] ${falles.length} infracció(ns):`); falles.forEach((f) => console.error('   ' + f)); process.exit(1); }
  console.log(`✅ [FRONTISSA] Frontera neta · Sollutia només lectura · ${fixtures.length} contracte(s) capturat(s) validat(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
