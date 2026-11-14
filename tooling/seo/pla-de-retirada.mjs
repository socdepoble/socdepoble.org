#!/usr/bin/env node
/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · EL PLA DE RETIRADA del prerender
 * social. Només CALCULA i imprimix: no esborra res ni toca cap servidor.
 *
 * Per què: a socdepoble.org (Firebase Hosting) una release nova substituïx tot el
 * lloc i el que s'ha retirat desapareix; al Node 0 (socdepoble.cat) NO, perquè
 * s'hi puja amb rsync sense --delete. Una fitxa que ha deixat de ser pública hi
 * continuaria servida (el nom, el lema i la imatge de /assets/og) per temps
 * indefinit. Este pla diu què s'ha de llevar del destí i quins directoris són
 * NOMÉS del prerender (segurs per a una passada amb --delete limitada a ells).
 *
 *   node tooling/seo/pla-de-retirada.mjs --actual REBUT.json [--anterior REBUT.json] --dist dist
 *
 * Els rebuts són els que escriu el prerender (rebut-social.json, fora de dist/).
 *   · esborra: els fitxers que va escriure el prerender ANTERIOR i que el d'ARA ja
 *     no escriu, mai un fitxer que el dist/ d'ara porta per un altre camí (un
 *     fitxer que no és del prerender no es proposa esborrar mai).
 *   · directorisPropis: els directoris de dist/ on TOTS els fitxers són del
 *     prerender (empresa/, gent/, perfil/, assets/og/…), els més amunt possibles.
 *     Un directori amb un sol fitxer que no és del prerender (assets/) no hi entra.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,199}$/;
const net = rel => typeof rel === 'string' && rel !== '' && rel.split('/').every(part => SEGMENT.test(part) && part !== '..' && part !== '.');

/** Els fitxers (relatius a dist/) que un rebut del prerender diu haver escrit. */
export function fitxersDelRebut(rebut) {
  const fitxers = new Set();
  if (!rebut || rebut.schema !== 'sdp.social-rebut.v1' || !Array.isArray(rebut.camins) || !Array.isArray(rebut.imatges)) throw new Error('El rebut no és un rebut del prerender social (sdp.social-rebut.v1).');
  for (const {cami} of rebut.camins) {
    const rel = `${String(cami).replace(/^\/+/, '')}/index.html`;
    if (!net(rel)) throw new Error(`Camí del rebut no vàlid: ${String(cami).slice(0, 120)}`);
    fitxers.add(rel);
  }
  for (const {fitxer} of rebut.imatges) {
    if (!net(fitxer)) throw new Error(`Imatge del rebut no vàlida: ${String(fitxer).slice(0, 120)}`);
    fitxers.add(fitxer);
  }
  return fitxers;
}

/**
 * El pla: { esborra, directorisPropis, avisos }. `fitxersDeDist` són els fitxers
 * del dist/ d'ARA (relatius, amb «/»). Pur.
 */
export function plaDeRetirada({rebutAnterior = null, rebutActual, fitxersDeDist = []} = {}) {
  const actuals = fitxersDelRebut(rebutActual);
  const alDist = new Set(fitxersDeDist);
  const avisos = [];
  for (const fitxer of actuals) if (alDist.size && !alDist.has(fitxer)) avisos.push(`el rebut actual nomena ${fitxer}, que no és al dist/: el rebut i el dist/ no són de la mateixa release`);
  const esborra = [];
  if (rebutAnterior) {
    for (const fitxer of fitxersDelRebut(rebutAnterior)) {
      if (actuals.has(fitxer)) continue;
      if (alDist.has(fitxer)) { avisos.push(`${fitxer} ja no és del prerender, però el dist/ d'ara el porta: no es proposa esborrar`); continue; }
      esborra.push(fitxer);
    }
  } else avisos.push('sense rebut anterior: només es donen els directoris propis del prerender');
  /* Els directoris on tots els fitxers són del prerender, els més amunt possibles. */
  const perDirectori = new Map(); // directori → {tots, propis}
  for (const fitxer of alDist) {
    const parts = fitxer.split('/');
    for (let i = 1; i < parts.length; i += 1) {
      const dir = parts.slice(0, i).join('/');
      const compte = perDirectori.get(dir) || {tots: 0, propis: 0};
      compte.tots += 1;
      if (actuals.has(fitxer)) compte.propis += 1;
      perDirectori.set(dir, compte);
    }
  }
  const propis = [...perDirectori].filter(([, compte]) => compte.propis === compte.tots && compte.tots > 0).map(([dir]) => dir).sort();
  const directorisPropis = propis.filter(dir => !propis.some(altre => dir.startsWith(`${altre}/`)));
  return {esborra: esborra.sort(), directorisPropis, avisos};
}

function fitxersDe(dir, rel = '', eixida = []) {
  for (const entrada of fs.readdirSync(path.join(dir, rel), {withFileTypes: true})) {
    const cami = rel ? `${rel}/${entrada.name}` : entrada.name;
    if (entrada.isDirectory()) fitxersDe(dir, cami, eixida);
    else if (entrada.isFile()) eixida.push(cami);
  }
  return eixida;
}

export function main(argv, {stdout = process.stdout, stderr = process.stderr} = {}) {
  try {
    const args = {};
    for (let i = 0; i < argv.length; i += 2) {
      const k = argv[i];
      if (!['--actual', '--anterior', '--dist'].includes(k) || !argv[i + 1] || args[k]) throw new Error('Ús: --actual REBUT.json [--anterior REBUT.json] --dist dist');
      args[k] = argv[i + 1];
    }
    if (!args['--actual'] || !args['--dist']) throw new Error('Ús: --actual REBUT.json [--anterior REBUT.json] --dist dist');
    const llig = fitxer => JSON.parse(fs.readFileSync(fitxer, 'utf8'));
    const pla = plaDeRetirada({rebutActual: llig(args['--actual']), rebutAnterior: args['--anterior'] ? llig(args['--anterior']) : null, fitxersDeDist: fitxersDe(path.resolve(args['--dist']))});
    stdout.write(`${JSON.stringify({valid: true, nomesCalcula: true, ...pla}, null, 2)}\n`);
    return 0;
  } catch (error) {
    stderr.write(`${JSON.stringify({valid: false, error: String(error?.message || error)})}\n`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
