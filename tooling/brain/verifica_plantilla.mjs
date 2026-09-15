#!/usr/bin/env node
//
// VERIFICADOR POST-HOC: cap eixida és vàlida si no compleix l'estructura
// de la plantilla que diu aplicar. Fail closed sobre l'estructura.
//
//   node tooling/brain/verifica_plantilla.mjs <eixida.md> <nom_plantilla>

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ARREL = process.cwd();
const DIR_REBUTS = resolve(ARREL, '.agents/reflex');

// Contracte estructural per plantilla. Amplieu-lo a mesura que les
// plantilles es refinen: és l'única "memòria" en què es pot confiar.
const BLOCS_OBLIGATORIS = {
  'plantilla_iso_sdp.md': [
    'estat:',
    'tipus:',
    '## Objectiu',
    '`OBJECTIU:',
    '<INSTRUCCIO>',
    '## Output Esperat',
    '<EXPECTATIVA>',
  ],
  'plantilla_acta_unica.md': ['## Presents', '## Acords', '## Pendents'],
};

function ultimRebut(plantilla) {
  try {
    const fitxers = readdirSync(DIR_REBUTS)
      .filter((f) => f.endsWith('_rebut_reflex.json'))
      .map((f) => ({ f, t: statSync(resolve(DIR_REBUTS, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const { f } of fitxers) {
      const rebut = JSON.parse(readFileSync(resolve(DIR_REBUTS, f), 'utf8'));
      if (rebut.plantilla === plantilla && rebut.sha256) return rebut;
    }
  } catch {
    /* sense rebuts: no és fatal; l'estructura sí que és obligatòria */
  }
  return null;
}

function main() {
  const [rutaEixida, nomPlantilla] = process.argv.slice(2);
  if (!rutaEixida || !nomPlantilla) {
    console.error('Ús: verifica_plantilla.mjs <eixida.md> <nom_plantilla>');
    return 2;
  }

  const obligatoris = BLOCS_OBLIGATORIS[nomPlantilla];
  if (!obligatoris) {
    console.error(`[VERIFICADOR] Plantilla sense contracte definit: ${nomPlantilla}`);
    console.error('[VERIFICADOR] Definiu els BLOCS_OBLIGATORIS abans d\u2019acceptar eixides d\u2019este tipus.');
    return 1; // fail closed: sense contracte, no hi ha acceptació
  }

  const eixida = readFileSync(resolve(ARREL, rutaEixida), 'utf8');
  const falten = obligatoris.filter((bloc) => !eixida.includes(bloc));

  if (falten.length > 0) {
    console.error(`[VERIFICADOR][REBUTJADA] ${rutaEixida} no compleix ${nomPlantilla}.`);
    console.error(`[VERIFICADOR][REBUTJADA] Blocs absents: ${falten.map((b) => `«${b}»`).join(', ')}`);
    return 1;
  }

  const rebut = ultimRebut(nomPlantilla);
  if (rebut && !eixida.includes(rebut.sha256.slice(0, 12))) {
    console.error(`[VERIFICADOR][AVÍS] L\u2019eixida no cita el hash de la plantilla carregada (${rebut.sha256.slice(0, 12)}…).`);
  }
  console.error(`[VERIFICADOR][OK] ${rutaEixida} compleix ${nomPlantilla}.`);
  return 0;
}

process.exitCode = main();
