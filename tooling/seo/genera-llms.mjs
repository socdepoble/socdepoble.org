#!/usr/bin/env node
/** P0-CONSOLIDACIO-3-CATEDRES (Emowe/Tellado) · public/llms.txt i public/md/<slug>.md
 * ixen d'esta projecció, governada per tooling/wiki/lib/publication-policy.mjs:
 *   · La llista de documents és la de publicWikiFiles (01_ser, 02_saber, 03_actuar
 *     i l'arrel de la Wiki; fora l'escriptori, l'arxiu, les actes, les petorretes,
 *     els ocults i els enllaços simbòlics). Cada fitxer es llig amb
 *     readPublicWikiFile (frontera, O_NOFOLLOW i camins d'usuari emmascarats) i
 *     es descarta si el frontmatter és trencat o si publicMetadata el denega
 *     (visibility diferent de public, status arxivat o quarantena).
 *   · El slug i el títol són els de slugIndex.json (slugDeDocument).
 *   · De cada document només ix el títol, la descripció, les dates declarades al
 *     frontmatter, la llicència de sèrie, l'adreça del document a la Wiki i el
 *     cos sense frontmatter. Cap altra clau del frontmatter no es copia.
 *   · llms.txt és la capçalera curada (CAP_LLMS) més una secció generada amb un
 *     enllaç per document, ordenada per slug.
 * Ús: node tooling/seo/genera-llms.mjs [--root DIR] --escriu | --comprova
 *   --escriu   escriu public/llms.txt i public/md/*.md i esborra els .md que ja no hi són.
 *   --comprova ix amb 1 si el disc no és exactament esta projecció.
 * No fa cap petició de xarxa ni llig l'historial de git: el resultat depén només dels fitxers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';
import { publicWikiFiles, readPublicWikiFile, publicMetadata, slugDeDocument, wikiEditorial } from '../wiki/lib/publication-policy.mjs';
import { idDeDocumentWiki, RUTA_WIKI } from '../../src/config/rutaSocial.js';
import { esMain } from '../lib/arrel.mjs';

export const ORIGEN_LLMS = 'https://socdepoble.org';
export const RUTA_LLMS = 'public/llms.txt';
export const CARPETA_MD = 'public/md';
/* Un slug és un nom de fitxer dins de public/md: ni barres, ni punts, ni ocults. */
const SLUG_PUBLICABLE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,179}$/;
const LLICENCIA = '- Llicència de sèrie del contingut: CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/)';

/** La part curada de llms.txt. S'edita ací, mai a public/llms.txt. */
export const CAP_LLMS = Object.freeze([
  "# Sóc de Poble",
  "",
  "> Infraestructura digital comunitària, pública i lliure per als pobles rurals valencians i l'ecosistema europeu de béns comuns digitals.",
  "",
  "Sóc de Poble connecta el veïnat, els comerços i productors locals, les associacions culturals i els ajuntaments en una sola interfície accessible basada en el sistema de disseny **Pedra Seca** (alt contrast AAA / Mode Bancal al Sol, tipografia Noto Sans autoallotjada i components universals).",
  "",
  "## Arquitectura i governança tècnica",
  "",
  "- **Codi lliure i auditable:** Programari publicat sota llicència **GNU AGPL-3.0** i contingut editorial comunitari sota **CC BY-NC-SA 4.0**.",
  "- **Llei de l'Enxufabilitat (Model B):** El frontend s'empaqueta també com a Web Component estàndard (`<soc-de-poble>`) integrable en amfitrions municipals com Sollutia o WordPress sense cedir l'esquema ni les dades comunitàries, que viuen darrere del port neutral `src/data/backendPort.js`.",
  "- **Privadesa i honestedat criptogràfica:** El xifratge d'extrem a extrem de les converses privades entre dos membres és al codi amb les seues proves, amb separació explícita entre absència de clau local i fallada d'integritat, però continua apagat per una bandera compilada: el Xat publicat encara no xifra les converses d'extrem a extrem.",
  "- **Federació oberta i Dades Obertes:** Publicació estàtica ActivityPub de lectura (fase 1) i paquet municipal obert en JSON-LD, JSON, iCalendar i Markdown.",
  "- **5 llengües actives:** Valencià (`ca`), castellà (`es`), anglés (`en`), basc (`eu`) i gallec (`gl`).",
  "",
  "## Pàgines públiques principals",
  "",
  "- [El Projecte Sóc de Poble](https://socdepoble.org/projecte): Visió, governança comunitària, arquitectura cívica i model operatiu per als municipis rurals.",
  "- [Mur del Poble](https://socdepoble.org/mur): Actualitat municipal, cròniques, bans i publicacions verificades de la comunitat.",
  "- [Mercat Rural](https://socdepoble.org/mercat): Aparador de productors, cooperatives i comerços de proximitat.",
  "- [Pobles Connectats](https://socdepoble.org/pobles): Directori de municipis i fitxa pilot de La Torre de les Maçanes.",
  "- [Calendari Comunitari](https://socdepoble.org/calendari): Agenda pública d'actes culturals, mercats i festes populars.",
  "- [Receptari i Patrimoni](https://socdepoble.org/receptes): Memòria gastronòmica i patrimoni oral documentat.",
  "- [Wiki de Poble](https://socdepoble.org/wikidepoble): Documentació viva d'arquitectura, protocols tècnics i actes de treball.",
  "- [Sistema de Disseny Pedra Seca](https://socdepoble.org/disseny): Catàleg interactiu d'àtoms, organismes, tokens cromàtics i contractes d'accessibilitat.",
  "- [Versions del Sistema](https://socdepoble.org/versions): Historial verificable de llançaments i millores en les 5 llengües.",
  "- [Candidatura NLnet · NGI Fediversity i Federació Oberta](https://socdepoble.org/fediversity): Resolució de la candidatura 2026-08-1a6, que no va passar la primera selecció i no ha rebut finançament, i estat real de la federació ActivityPub, NodeInfo 2.1 i portabilitat municipal.",
  "- [Descàrregues i Codi Lliure](https://socdepoble.org/descarregues): Paquets instal·lables, verificació criptogràfica SHA-256 i connector WordPress.",
  "- [Avís Legal i Privacitat](https://socdepoble.org/legal): Condicions d'ús, protecció de dades (RGPD) i drets del veïnat.",
  "",
  "## Recursos estructurats per a agents i federació",
  "",
  "- [Agent Resource Discovery Manifest](https://socdepoble.org/.well-known/ard.json): Índex estructurat ARD dels recursos públics legibles per màquina.",
  "- [Manifest de Dades Obertes Municipals](https://socdepoble.org/opendata/manifest.json): Inventari amb tipus MIME i sumes SHA-256 dels conjunts de dades obertes.",
  "- [Municipi en JSON-LD](https://socdepoble.org/opendata/municipi.jsonld): Fitxa semàntica Schema.org del municipi pilot (La Torre de les Maçanes).",
  "- [Agenda Pública en JSON-LD](https://socdepoble.org/opendata/agenda.jsonld): Esdeveniments municipals estructurats per a consulta directa.",
  "- [Actor ActivityPub Institucional](https://socdepoble.org/ap/actors/socdepoble.json): Perfil públic ActivityStreams 2.0 del projecte.",
  "- [NodeInfo 2.1](https://socdepoble.org/nodeinfo/2.1.json): Metadades tècniques estàndard del node federat."
]);

const netaLinia = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
const etiqueta = (text) => netaLinia(text).replace(/[[\]\\]/g, '\\$&');

/** L'id del document a l'app (el de compile-wiki-to-app.mjs · resolIdentitat), o null. */
function idDelDocument(file) {
  const base = path.basename(file).replace(/\.md$/i, '');
  return idDeDocumentWiki(base === 'SKILL' ? `${path.basename(path.dirname(file))}_SKILL` : base);
}

/** Les dates declarades al frontmatter, validades; sense dates si no ho són. */
function datesDeclarades(meta, rawFrontmatter) {
  try {
    const a = wikiEditorial(meta, { rawFrontmatter });
    return { date: a.date, updated: a.updated };
  } catch {
    return {};
  }
}

function textDelDocument({ title, description, id, date, updated, body }, origin) {
  const linies = [`# ${netaLinia(title)}`, ''];
  if (description) linies.push(`> ${description}`, '');
  if (id) linies.push(`- Document a la Wiki de Poble: ${origin}${RUTA_WIKI}?item=${id}`);
  if (date) linies.push(`- Data declarada: ${date}`);
  if (updated) linies.push(`- Actualització declarada: ${updated}`);
  linies.push(LLICENCIA, '', '---', '');
  const cos = body.replace(/\r\n?/g, '\n').replace(/^\s*\n/, '').replace(/\s+$/, '');
  return `${linies.join('\n')}\n${cos}\n`;
}

/** Projecció pura: { llms, fitxers: Map<slug, text> }. No escriu res. */
export function projectaLlms({ root = process.cwd(), origin = ORIGEN_LLMS } = {}) {
  const docs = [];
  const vistos = new Map();
  for (const file of publicWikiFiles(root, { extensions: ['.md'] })) {
    const raw = readPublicWikiFile(root, file);
    if (raw === null) continue;
    const parsed = parseFrontmatter(raw);
    if (parsed.malformed || parsed.errors.length) continue;
    const meta = parsed.data || {};
    if (!publicMetadata(meta)) continue;
    const { title, slug } = slugDeDocument(meta, file);
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (typeof slug !== 'string' || !SLUG_PUBLICABLE.test(slug)) throw new TypeError(`Slug no publicable com a fitxer: ${rel}`);
    // APFS no distingix majúscules: dos slugs que només canvien en això serien el mateix fitxer.
    const clau = slug.toLowerCase();
    if (vistos.has(clau)) throw new TypeError(`Slug duplicat «${slug}»: ${vistos.get(clau)} i ${rel}`);
    vistos.set(clau, rel);
    const description = typeof meta.description === 'string' ? netaLinia(meta.description) : '';
    docs.push({ slug, title, description, id: idDelDocument(file), ...datesDeclarades(meta, parsed.rawFrontmatter), body: parsed.body || '' });
  }
  docs.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  const fitxers = new Map(docs.map((doc) => [doc.slug, textDelDocument(doc, origin)]));
  const llista = docs.map((doc) => `- [${etiqueta(doc.title)}](${origin}/md/${doc.slug}.md)${doc.description ? `: ${doc.description}` : ''}`);
  const llms = [...CAP_LLMS, '', '## Wiki de Poble (Markdown)', '',
    'Còpia en Markdown dels documents públics de la Wiki de Poble, amb la mateixa frontera de publicació que la Wiki: cap document de l\'escriptori, privat ni arxivat.',
    '', ...llista].join('\n') + '\n';
  return { llms, fitxers };
}

function llegixSiEsFitxer(abs) {
  try {
    const estat = fs.lstatSync(abs);
    return estat.isFile() ? fs.readFileSync(abs, 'utf8') : null;
  } catch {
    return null;
  }
}

/** Diferències entre el disc i la projecció (buida si coincidixen). */
export function diferenciesLlms(root, projeccio = projectaLlms({ root })) {
  const diferencies = [];
  if (llegixSiEsFitxer(path.join(root, RUTA_LLMS)) !== projeccio.llms) diferencies.push(`${RUTA_LLMS} no és la projecció de publication-policy.mjs`);
  const carpeta = path.join(root, CARPETA_MD);
  /* Els noms amb punt inicial (.DS_Store del Finder) els governa .gitignore, no la projecció. */
  const alDisc = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter((nom) => !nom.startsWith('.')) : [];
  for (const nom of alDisc) {
    const slug = nom.endsWith('.md') ? nom.slice(0, -3) : null;
    if (!slug || !projeccio.fitxers.has(slug)) diferencies.push(`${CARPETA_MD}/${nom} sobra: no és cap document públic`);
  }
  for (const [slug, text] of projeccio.fitxers) {
    if (llegixSiEsFitxer(path.join(carpeta, `${slug}.md`)) !== text) diferencies.push(`${CARPETA_MD}/${slug}.md falta o no és la projecció`);
  }
  return diferencies;
}

function escriuSenseSeguirEnllacos(abs, text) {
  const fd = fs.openSync(abs, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW, 0o644);
  try { fs.writeFileSync(fd, text, 'utf8'); } finally { fs.closeSync(fd); }
}

/** Escriu la projecció i esborra els .md de public/md que ja no hi són. */
export function escriuLlms(root, projeccio = projectaLlms({ root })) {
  const carpeta = path.join(root, CARPETA_MD);
  if (fs.existsSync(carpeta)) {
    if (!fs.lstatSync(carpeta).isDirectory()) throw new TypeError(`${CARPETA_MD} ha de ser una carpeta real, no un enllaç.`);
  } else fs.mkdirSync(carpeta);
  for (const nom of fs.readdirSync(carpeta)) {
    if (nom.endsWith('.md') && !projeccio.fitxers.has(nom.slice(0, -3)) && fs.lstatSync(path.join(carpeta, nom)).isFile()) fs.unlinkSync(path.join(carpeta, nom));
  }
  for (const [slug, text] of projeccio.fitxers) escriuSenseSeguirEnllacos(path.join(carpeta, `${slug}.md`), text);
  escriuSenseSeguirEnllacos(path.join(root, RUTA_LLMS), projeccio.llms);
  return { documents: projeccio.fitxers.size };
}

function main(args) {
  let root = process.cwd();
  let mode = null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--root' && args[i + 1]) root = path.resolve(args[++i]);
    else if (args[i] === '--escriu' || args[i] === '--comprova') mode = args[i];
    else throw new TypeError('Ús: node tooling/seo/genera-llms.mjs [--root DIR] --escriu | --comprova');
  }
  if (!mode) throw new TypeError('Cal --escriu o --comprova.');
  const projeccio = projectaLlms({ root });
  if (mode === '--escriu') {
    const { documents } = escriuLlms(root, projeccio);
    console.log(`llms.txt i ${documents} documents a ${CARPETA_MD}/ escrits.`);
    return 0;
  }
  const diferencies = diferenciesLlms(root, projeccio);
  for (const d of diferencies) console.error(`[llms] ${d}`);
  if (diferencies.length) console.error('[llms] Regenera-ho amb «npm run llms:build»; no s\'edita a mà.');
  return diferencies.length ? 1 : 0;
}

if (esMain(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(`llms: ${e.message}`); process.exitCode = 1; }
}
