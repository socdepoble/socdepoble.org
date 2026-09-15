#!/usr/bin/env node
//
// TRACTOR DELS REFLEXOS: garanteix que cap tasca comence sense que la seua
// plantilla ISO estiga JA dins del context de l'agent. El model no decideix
// llegir-la: es desperta amb ella davant.
//
//   node tooling/brain/reflex_plantilles.mjs "text de la tasca"
//
// Contracte:
//   - stdout  -> bloc injectable al context (banner + plantilla SENCERA).
//   - stderr  -> missatges de control (rebuts, bloquejos).
//   - exit 0  -> plantilla carregada, o tasca sense plantilla obligatòria.
//   - exit 1  -> FALLADA: plantilla obligatòria il·legible. FAIL CLOSED.
//
// S'executa des de l'arrel del repo.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { classifica } from './classificador_tasques.mjs';

const ARREL = process.cwd();
const DIR_PLANTILLES = resolve(ARREL, '_wiki_de_poble/02_saber/07_plantilles');
const DIR_REBUTS = resolve(ARREL, '.agents/reflex');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function llegirTasca() {
  const args = process.argv.slice(2);
  if (args.length > 0) return args.join(' ');
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

function escriureRebut(rebut) {
  mkdirSync(DIR_REBUTS, { recursive: true });
  const ruta = resolve(DIR_REBUTS, `${Date.now()}_rebut_reflex.json`);
  writeFileSync(ruta, JSON.stringify(rebut, null, 2) + '\n');
  return ruta;
}

function main() {
  const tasca = llegirTasca();
  const classe = classifica(tasca);

  if (!classe) {
    const ruta = escriureRebut({
      estat: 'sense_plantilla',
      ts: new Date().toISOString(),
      tasca: tasca.slice(0, 160),
    });
    console.error(`[REFLEX] Tasca sense plantilla obligatòria. Rebut: ${ruta}`);
    return 0;
  }

  const rutaPlantilla = resolve(DIR_PLANTILLES, classe.plantilla);
  let contingut;
  try {
    contingut = readFileSync(rutaPlantilla);
  } catch (err) {
    console.error(`[REFLEX][BLOQUEJAT] Plantilla obligatòria il·legible: ${rutaPlantilla}`);
    console.error(`[REFLEX][BLOQUEJAT] ${err.message}`);
    console.error('[REFLEX][BLOQUEJAT] La tasca NO pot continuar. Fail closed.');
    return 1;
  }
  if (contingut.toString('utf8').trim().length === 0) {
    console.error(`[REFLEX][BLOQUEJAT] Plantilla buida: ${rutaPlantilla}`);
    return 1;
  }

  const hash = sha256(contingut);
  const rutaRebut = escriureRebut({
    estat: 'plantilla_carregada',
    ts: new Date().toISOString(),
    plantilla: classe.plantilla,
    ruta: rutaPlantilla,
    sha256: hash,
    tasca: tasca.slice(0, 160),
  });

  process.stdout.write(
    '🧠 [ACTE REFLEX AUTOMÀTIC] Plantilla injectada directament a la teua memòria muscular.\n' +
    'NO inventes res: aplica aquesta plantilla de forma exacta.\n\n' +
    `<!-- sha256: ${hash} -->\n` +
    `# [PLANTILLA OBLIGATÒRIA: ${classe.plantilla}]\n\n` +
    contingut.toString('utf8') +
    '\n<!-- FI PLANTILLA OBLIGATÒRIA -->\n'
  );

  console.error(`[REFLEX] Plantilla carregada: ${classe.plantilla} (${hash.slice(0, 12)}…)`);
  console.error(`[REFLEX] Rebut: ${rutaRebut}`);
  return 0;
}

process.exitCode = main();
