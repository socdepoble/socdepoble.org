#!/usr/bin/env node
/** IDEA-62 · Lectura de public/ i de les projeccions generades; no mou ni esborra fitxers. */
import fs from 'node:fs';
import path from 'node:path';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { motiuContaminacio } from '../lib/higiene-paquets.mjs';
import { fitxersAdaptador } from '../../wordpress-plugin/eines/empaqueta.mjs';

export const SUPERFICIES = Object.freeze([
  'public', 'dist', 'dist-natiu', 'wordpress-plugin/dist', 'wordpress-plugin/builds/directori/dist',
  'ios/App/App/public', 'android/app/src/main/assets/public'
]);

export function inspeccionaHigienePaquets(arrel = arrelSegura()) {
  const incidencies = [];
  const examinades = [];
  const absents = [];
  let fitxers = 0;
  function recorre(carpeta, relatiu = '') {
    for (const entrada of fs.readdirSync(path.join(arrel, carpeta, relatiu), { withFileTypes: true })) {
      const rel = relatiu ? `${relatiu}/${entrada.name}` : entrada.name;
      const cami = `${carpeta}/${rel}`;
      const motiu = entrada.isSymbolicLink() ? 'enllaç simbòlic dins del paquet' : motiuContaminacio(rel);
      if (motiu) { incidencies.push({ cami, motiu }); continue; }
      if (entrada.isDirectory()) recorre(carpeta, rel);
      else if (entrada.isFile()) fitxers += 1;
      else incidencies.push({ cami, motiu: 'entrada que no és un fitxer ni una carpeta' });
    }
  }
  for (const carpeta of SUPERFICIES) {
    const segments = carpeta.split('/');
    if (segments.some((_, i) => fs.lstatSync(path.join(arrel, ...segments.slice(0, i + 1)), { throwIfNoEntry: false })?.isSymbolicLink())) {
      incidencies.push({ cami: carpeta, motiu: 'enllaç simbòlic en la ruta del paquet' });
      continue;
    }
    const estat = fs.lstatSync(path.join(arrel, carpeta), { throwIfNoEntry: false });
    if (!estat) { absents.push(carpeta); continue; }
    if (!estat.isDirectory() || estat.isSymbolicLink()) { incidencies.push({ cami: carpeta, motiu: 'arrel de paquet no regular' }); continue; }
    examinades.push(carpeta);
    recorre(carpeta);
  }
  if (!examinades.includes('public')) incidencies.push({ cami: 'public', motiu: 'font pública absent' });
  try { fitxersAdaptador(path.join(arrel, 'wordpress-plugin')); }
  catch (error) { incidencies.push({ cami: 'wordpress-plugin', motiu: error.message }); }
  return { valid: incidencies.length === 0, fitxers, examinades, absents, incidencies };
}

if (esMain(import.meta.url)) {
  try {
    const resultat = inspeccionaHigienePaquets();
    console.log(JSON.stringify(resultat, null, 2));
    process.exitCode = resultat.valid ? 0 : 1;
  } catch (error) {
    console.error(`IDEA-62: no s'ha pogut examinar el paquet: ${error.message}`);
    process.exitCode = 2;
  }
}
