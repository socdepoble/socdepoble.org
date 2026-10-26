#!/usr/bin/env node
/**
 * Cens de public/assets, només lectura. Ús: node tooling/media/cens_imatges.mjs [--json]
 *
 * Reutilitza el classificador del tractor WebP i els ids/àlies del cens de producte.
 * Separa referències literals de possibilitats dinàmiques, catàleg, dades i proves.
 * «Sense ús viu identificat» és una candidata a revisió, mai una ordre de purga:
 * no consulta Supabase, WordPress ni enllaços publicats fora del repositori.
 * La CLI només escriu a stdout; per a preservar-la, l'orquestradora incorpora
 * el resultat a l'informe de l'Escriptori pel circuit documental ordinari.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { arrelSegura, esMain, EXCLOSOS } from '../lib/arrel.mjs';
import { EXTENSIONS_IMATGE, classifica, patronsDinamics, mides } from './optimitzar_webp.mjs';
import { bessonaDe, bessonesDe } from '../../src/config/politicaDeMitjans.js';
import { CENS_IMATGES, EXCLOSES, ALIES_DEL_CENS, idDelCens } from '../../src/sections/multimedia/censImatges.js';
import { IMATGES_CONSOLA } from '../../src/sections/consola/imatgesConsola.js';

export const ARRELS_REFERENCIES = Object.freeze([
  'src', 'public', 'supabase', 'wordpress-plugin', 'tooling', 'scripts', 'tests',
  'index.html', 'vite.config.js', 'vite.standalone.config.js', 'vite.modul.config.js',
  'vite.natiu.config.js', 'vercel.json'
]);
const TEXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.html', '.css', '.php', '.sql', '.yml', '.yaml', '.txt', '.webmanifest', '.xml', '.svg']);
const GALERIA = 'src/sections/multimedia/censImatges.js';
const EINA = /^tooling\/media\/cens_imatges(?:\.test)?\.mjs$/;
const MAX_TEXT = 4 * 1024 * 1024;
const posix = (p) => p.split(path.sep).join('/');
const ordena = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Recorregut confinat, ordenat i sense symlinks; I/O il·legible falla visible. */
function fitxers(arrel, rel, { opcional = false, corpus = false } = {}) {
  const base = fs.realpathSync(arrel);
  const abs = path.resolve(base, rel);
  const dins = path.relative(base, abs);
  if (dins.startsWith('..') || path.isAbsolute(dins)) throw new Error(`Camí fora d'arrel: ${rel}`);
  let stat;
  let cursor = base;
  for (const component of dins.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    try { stat = fs.lstatSync(cursor); } catch (e) { if (opcional && e.code === 'ENOENT') return []; throw e; }
    if (stat.isSymbolicLink()) throw new Error(`Symlink no admés al cens: ${posix(path.relative(base, cursor))}`);
  }
  if (!stat) stat = fs.lstatSync(abs);
  if (stat.isFile()) return [{ fitxer: posix(rel), abs, bytes: stat.size }];
  if (!stat.isDirectory()) throw new Error(`Tipus de fitxer no admés: ${rel}`);
  return fs.readdirSync(abs).sort(ordena).flatMap((nom) => (
    corpus && (nom.startsWith('.') || EXCLOSOS.has(nom) || nom === 'builds') ? []
      : fitxers(base, path.join(rel, nom), { corpus })
  ));
}

function capaDe(fitxer) {
  if (fitxer === GALERIA) return 'galeria';
  if (/(?:^|\/)(?:tests?|__tests__|fixtures?)(?:\/|$)|\.(?:test|spec)\.[^/]+$/.test(fitxer)) return 'prova';
  if (fitxer.startsWith('src/') || fitxer === 'index.html' || /\.(?:css|html|php)$/.test(fitxer)) return 'codi';
  return 'dades';
}

/** Cada ús conserva font i força de l'evidència; un basename és ambigu. */
export function usosDe(imatges, fonts) {
  const usos = new Map(imatges.map((i) => [i.cami, []]));
  for (const { fitxer, text, capa = capaDe(fitxer) } of fonts) {
    const patrons = patronsDinamics(text);
    const classificades = classifica(imatges, { codi: text, wiki: '' });
    for (const img of classificades) {
      if (img.estat === 'orfe') continue;
      const literal = citaLiteral(text, img.cami);
      const dinamica = img.estat === 'dinamic' || patrons.some((re) => re.test(`/${img.cami}`));
      usos.get(img.cami).push({ fitxer, capa, evidencia: literal ? 'cami' : dinamica ? 'dinamica' : 'nom' });
    }
  }
  return usos;
}

/** El camí ha d'acabar com a token/URL; normal.png.backup no acredita normal.png. */
function citaLiteral(text, cami) {
  for (const candidat of new Set([`/${cami}`, `/${encodeURI(cami)}`])) {
    let inici = 0;
    while (inici < text.length) {
      const posicio = text.indexOf(candidat, inici);
      if (posicio === -1) break;
      const seguent = text[posicio + candidat.length];
      if (seguent === undefined || /[\s'"`<>()[\]{};,?#]/.test(seguent)) return true;
      inici = posicio + candidat.length;
    }
  }
  return false;
}

/** El pla no modifica la taula de Consola fins que hi haja quatre obres pròpies. */
export function plaConsola(imatges = IMATGES_CONSOLA) {
  const propostes = {
    actors: 'Veïns i agents del Mas reunits davant d’un tauler de relleus; cada paper i responsabilitat és visible.',
    salut: 'Una brigada revisa canonades, panys i manòmetres del Mas, amb una llibreta d’incidències.',
    fluxos: 'Una cadena de faena rural passa encàrrecs entre oficis, amb entrada, transformació i comprovació final.',
    calendari: 'Veïns coordinen rellotges i un calendari d’automatismes amb temporitzadors i campanetes.'
  };
  return Object.entries(propostes).map(([id, escena]) => ({
    id, actual: imatges[id]?.imatge ?? null, estat: 'pendent_obra_propia', escena,
    criteri: 'Vinyeta original de còmic costumista rural, humor coral Bruguera/Berlanga, composició quadrada Pedra Seca; sense copiar una obra existent.',
    acceptacio: 'Comprovar autoria i procedència, absència de coincidència amb altres funcions, alta al cens i text alternatiu; després canviar la taula i les expectatives de imatgesConsola.test.js en el mateix lot.'
  }));
}

export function censImatges(arrel, { cens = CENS_IMATGES, excloses = EXCLOSES, alies = ALIES_DEL_CENS, arrels = ARRELS_REFERENCIES } = {}) {
  const inventari = fitxers(arrel, 'public/assets');
  const imatges = inventari.filter((i) => EXTENSIONS_IMATGE.includes(path.extname(i.fitxer).toLowerCase()))
    .map((i) => ({ ...i, cami: i.fitxer.slice('public/'.length) }));
  const omeses = [];
  const visitades = new Set();
  const fonts = arrels.flatMap((rel) => fitxers(arrel, rel, { opcional: true, corpus: true })).filter(({ fitxer, bytes }) => {
    if (visitades.has(fitxer) || EINA.test(fitxer) || !TEXT.has(path.extname(fitxer).toLowerCase())) return false;
    visitades.add(fitxer);
    if (bytes > MAX_TEXT) { omeses.push({ fitxer, motiu: 'supera_4_MiB' }); return false; }
    return true;
  }).map(({ fitxer, abs }) => ({ fitxer, text: fs.readFileSync(abs, 'utf8') })).sort((a, b) => ordena(a.fitxer, b.fitxer));
  const usos = usosDe(imatges, fonts);
  const originals = bessonesDe(imatges.map((i) => i.cami));
  const originalDe = new Map(originals.map((i) => [bessonaDe(i), i]));
  const entrades = new Map(cens.map((e) => [e.src, e]));
  const presents = new Set(imatges.map((i) => `/${i.cami}`));
  const files = imatges.map(({ cami, abs, bytes }) => {
    const src = `/${cami}`;
    const original = originalDe.get(cami);
    const base = original ? `/${original}` : src;
    const canonic = alies[base] || base;
    const entrada = entrades.get(canonic);
    const contingut = fs.readFileSync(abs);
    let dimensions = null;
    try { dimensions = mides(contingut); } catch { /* SVG i capçaleres no compatibles; hash i pes sí verificats. */ }
    const directes = usos.get(cami);
    const heretats = original ? usos.get(original).map((u) => ({ ...u, via: `/${original}` })) : [];
    const totes = [...directes, ...heretats];
    const vives = totes.filter((u) => u.capa === 'codi');
    const categoria = entrades.has(src) ? 'cens' : Object.hasOwn(excloses, src) ? 'exclosa' : original ? 'bessona'
      : src.startsWith('/assets/system/') ? 'sistema' : src.endsWith('.svg') ? 'svg' : 'desconeguda';
    const estat = vives.some((u) => u.evidencia === 'cami') ? 'codi_literal'
      : vives.some((u) => u.evidencia === 'dinamica') ? 'codi_dinamic_possible'
        : vives.length ? 'codi_nom_possible' : totes.some((u) => u.capa === 'dades') ? 'nomes_dades'
          : entrada || totes.some((u) => u.capa === 'galeria') ? 'nomes_galeria'
            : totes.some((u) => u.capa === 'prova') ? 'nomes_proves' : 'sense_referencia';
    return { src, bytes, sha256: sha256(contingut), dimensions, categoria, estat, assetId: idDelCens(canonic),
      canonic, ...(original ? { bessonaDe: `/${original}` } : {}), ...(entrada ? { titol: entrada.titol } : {}),
      ...(Object.hasOwn(excloses, src) ? { motiuExclusio: excloses[src] } : {}), usos: totes };
  });
  const perHash = new Map();
  for (const img of files) { if (!perHash.has(img.sha256)) perHash.set(img.sha256, []); perHash.get(img.sha256).push(img); }
  const duplicats = [...perHash].filter(([, grup]) => grup.length > 1).map(([hash, grup]) => ({
    sha256: hash, fitxers: grup.map((i) => i.src).sort(ordena), bytesCopia: grup[0].bytes,
    bytesRedundants: grup[0].bytes * (grup.length - 1)
  })).sort((a, b) => ordena(a.sha256, b.sha256));
  const recompte = (camp) => files.reduce((r, i) => { r[i[camp]] = (r[i[camp]] || 0) + 1; return r; }, {});
  const senseUsViu = files.filter((i) => !i.usos.some((u) => u.capa === 'codi')).map((i) => i.src);
  const absentsDelCens = cens.filter((e) => !presents.has(e.src)).map((e) => e.src).sort(ordena);
  return {
    schema: 'sdp.cens-imatges.v1',
    metode: { arrelAssets: 'public/assets', inventari: 'Tots els fitxers regulars, inclosos ocults i carpetes de nom reservat; symlinks rebutjats en qualsevol component.', arrelsReferencies: [...arrels], fonts: fonts.length,
      exclusio: 'Wiki, arxiu fred, secrets, dependències, builds i el propi tractor fora del corpus; proves i dades separades.',
      limit: 'Referències estàtiques i patrons possibles; no prova renderitzat ni absència d’usos remots. Un nom compartit és ambigu. SHA-256 mesura bytes, no semblança visual.' },
    resum: { fitxersAssets: inventari.length, imatges: files.length, bytes: files.reduce((n, i) => n + i.bytes, 0),
      perCategoria: recompte('categoria'), perEstat: recompte('estat'), hashesUnics: perHash.size,
      grupsDuplicats: duplicats.length, copiesRedundants: duplicats.reduce((n, g) => n + g.fitxers.length - 1, 0),
      bytesRedundants: duplicats.reduce((n, g) => n + g.bytesRedundants, 0), senseUsViuIdentificat: senseUsViu.length,
      absentsDelCens: absentsDelCens.length, fontsOmeses: omeses.length },
    imatges: files, senseUsViuIdentificat: senseUsViu, duplicats, absentsDelCens, fontsOmeses: omeses, plaConsola: plaConsola()
  };
}

export function informeCens(resultat) {
  const { resum: r } = resultat;
  return [
    `[cens:imatges] ${r.fitxersAssets} fitxers d’assets; ${r.imatges} imatges (${r.bytes} bytes).`,
    `Categories: ${Object.entries(r.perCategoria).map(([k, v]) => `${k} ${v}`).join(' · ')}.`,
    `Referències: ${Object.entries(r.perEstat).map(([k, v]) => `${k} ${v}`).join(' · ')}.`,
    `${r.senseUsViuIdentificat} sense ús viu identificat al corpus; candidats a revisió, no orfandat acreditada.`,
    `${r.hashesUnics} hashes únics; ${r.grupsDuplicats} grups de bytes duplicats, ${r.copiesRedundants} còpies redundants (${r.bytesRedundants} bytes).`,
    `Cens de producte: ${r.absentsDelCens} absents; ${r.fontsOmeses} fonts omeses. Detall complet: --json.`,
    ...resultat.senseUsViuIdentificat.map((src) => `  ${src}`),
    'Pla de Consola: quatre obres pròpies pendents (actors, salut, fluxos, calendari); cap píxel modificat.',
    resultat.metode.limit
  ].join('\n');
}

export function main(argv = process.argv.slice(2), { arrel = null, sortida = console } = {}) {
  if (argv.some((a) => a !== '--json') || new Set(argv).size !== argv.length) {
    sortida.error('Ús: node tooling/media/cens_imatges.mjs [--json]'); return 2;
  }
  try {
    const resultat = censImatges(arrel || arrelSegura());
    sortida.log(argv.includes('--json') ? JSON.stringify(resultat, null, 2) : informeCens(resultat));
    return resultat.absentsDelCens.length || resultat.fontsOmeses.length ? 1 : 0;
  } catch (e) { sortida.error(`[cens:imatges] ${e.message}`); return 1; }
}

if (esMain(import.meta.url)) process.exitCode = main();
