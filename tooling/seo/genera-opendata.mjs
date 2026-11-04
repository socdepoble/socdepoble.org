#!/usr/bin/env node
/** FEDI-03 · Dos GET anònims amb el lector públic existent. Escriu únicament
 * a public/opendata (carpeta existent), o reprodueix un snapshot sanejat.
 * node tooling/seo/genera-opendata.mjs --ara ISO [--snapshot FITXER | --curacio FITXER]
 * Cap clau ni URL del servidor de dades no ix al rebut.
 */
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { llegeixZip } from '../../src/utils/fulls/zip.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, webcrypto } from 'node:crypto';
import { variablesDelBuild, entornDelBuild, llegixClau } from './projeccio-publica.mjs';
import { preparaSnapshotOpenDataPublic, validaSnapshotOpenDataPublic } from './snapshot-opendata-public.mjs';
import { exportaMunicipiOpenData, jsonCanonic } from '../../src/data/exportaMunicipiOpenData.js';
import { llegeixPaquetOpenData } from '../../src/data/importaMunicipiOpenData.js';

export async function generaOpenData({ arrel = process.cwd(), ara, snapshot = null, curacioNoticia = null, fetchImpl = globalThis.fetch, escriu = true } = {}) {
  if (!ara && !snapshot) throw new TypeError('Cal --ara ISO explícit per a una captura reproduïble.');
  if (snapshot && curacioNoticia) throw new TypeError('Tria un snapshot reproduït o una captura amb curació explícita.');
  let captura = snapshot;
  if (!captura) {
    const entorn = entornDelBuild(await variablesDelBuild(arrel));
    if (entorn.dataMode !== 'remote') throw new TypeError('La captura exigix dades remotes públiques reals, no llavors.');
    const files = [];
    for (const clau of ['feedPosts', 'events']) {
      const fila = await llegixClau(entorn, clau, { fetchImpl, termini: 8000, maxResposta: 16 * 1024 * 1024, pausa: () => Promise.resolve() });
      if (!Array.isArray(fila?.payload)) throw new TypeError('La font pública no ha tornat la col·lecció completa.');
      files.push(fila.payload);
    }
    captura = preparaSnapshotOpenDataPublic({ feedPosts: files[0], events: files[1], ara, curacioNoticia });
    captura.entrada.actorsPublicats = [captura.entrada.municipi.slug];
    captura.entrada.activityStreams = JSON.parse(await fs.readFile(path.join(arrel, 'public/opendata/activitystreams.json'), 'utf8'));
  }
  validaSnapshotOpenDataPublic(captura);
  const paquet = await exportaMunicipiOpenData(captura.entrada, { subtle: webcrypto.subtle });
  await llegeixPaquetOpenData(paquet.zip, { subtle: webcrypto.subtle, sha256Esperat: paquet.sha256 });
  for (const clau of ['noticies', 'agenda', 'memoria']) if (!paquet.comptes[clau]) throw new TypeError(`Falta contingut públic contrastat: ${clau}.`);
  const textSnapshot = jsonCanonic(captura);
  const rebut = { creat: captura.entrada.ara, comptes: paquet.comptes, zip: paquet.nomFitxer, sha256: paquet.sha256,
    snapshotSha256: createHash('sha256').update(textSnapshot).digest('hex'), fonts: captura.provinencia.map(f => f.url), memoriaOral: 'pendent de font amb revisió humana acreditada' };
  if (escriu) {
    const desti = path.resolve(arrel, 'public/opendata');
    const estat = await fs.lstat(desti);
    if (!estat.isDirectory() || estat.isSymbolicLink()) throw new TypeError('Cal la carpeta canònica existent public/opendata.');
    const escriuFitxer = async (nom, contingut) => {
      const handle = await fs.open(path.join(desti, nom), constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW, 0o644);
      try { await handle.writeFile(contingut); } finally { await handle.close(); }
    };
    const prefix = `${paquet.arrel}/data/`;
    const fitxers = llegeixZip(paquet.zip).filter(f => f.nom.startsWith(prefix));
    if (fitxers.some(f => f.nom.slice(prefix.length).includes('/'))) throw new TypeError('Esta captura no escriu carpetes.');
    for (const fitxer of fitxers) {
      if (!fitxer.nom.startsWith(prefix)) continue;
      const nom = fitxer.nom.slice(prefix.length);
      if (nom.includes('/') || nom.includes('..')) throw new TypeError('Esta captura no escriu carpetes ni camins externs.');
      await escriuFitxer(nom === 'datapackage.json' ? 'manifest.json' : nom, fitxer.dades);
    }
    await escriuFitxer('snapshot-public.json', textSnapshot);
    await escriuFitxer(paquet.nomFitxer, paquet.zip);
    await escriuFitxer(`${paquet.nomFitxer}.sha256`, `${paquet.sha256}  ${paquet.nomFitxer}\n`);
  }
  return { rebut, paquet, snapshot: captura };
}

async function main(args) {
  const opcions = {};
  for (let i = 0; i < args.length; i += 2) {
    const k = args[i]; if (!['--ara', '--snapshot', '--curacio', '--arrel'].includes(k) || !args[i + 1]) throw new TypeError('Ús: --ara ISO [--snapshot FITXER | --curacio FITXER] [--arrel DIR]');
    opcions[k.slice(2)] = args[i + 1];
  }
  if (opcions.snapshot) {
    if ((await fs.stat(opcions.snapshot)).size > 4 * 1024 * 1024) throw new RangeError('Snapshot de més de 4 MB.');
    const fitxer = await fs.readFile(opcions.snapshot);
    if (fitxer.length > 4 * 1024 * 1024) throw new RangeError('Snapshot de més de 4 MB.');
    opcions.snapshot = JSON.parse(fitxer.toString('utf8'));
  }
  if (opcions.curacio) {
    if ((await fs.stat(opcions.curacio)).size > 64 * 1024) throw new RangeError('Curació editorial de més de 64 kB.');
    const fitxer = await fs.readFile(opcions.curacio);
    if (fitxer.length > 64 * 1024) throw new RangeError('Curació editorial de més de 64 kB.');
    opcions.curacioNoticia = JSON.parse(fitxer.toString('utf8'));
    delete opcions.curacio;
  }
  const { rebut } = await generaOpenData(opcions);
  console.log(JSON.stringify(rebut, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(e => { console.error(`Open Data: ${e.message}`); process.exitCode = 1; });
}
