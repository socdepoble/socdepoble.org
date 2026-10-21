#!/usr/bin/env node
/**
 * Empaquetador de releases de l'enxufe (sdp.release.v1).
 *
 * Dues variants del mateix contracte. A partir del build autònom que deixa
 * `SDP_RELEASE=1 SDP_VERSIO=x.y.z npm run build:wp` a wordpress-plugin/dist
 * i build:wp:directori a wordpress-plugin/builds/directori/dist:
 *   · verifica l'inventari del build: cap resta de builds anteriors entra al
 *     paquet i cap fitxer no pot haver canviat després de compilar;
 *   · verifica el format del paquet (decisió 5 del Mestre, 261007): en el
 *     trossejat, el carregador soc-de-poble.standalone.js demana el mòdul
 *     d'entrada que declara `formatDelPaquet` i tots els trossos de dist/trossos/ són
 *     a l'inventari, de manera que entren als dos zips (l'estàtic i el de
 *     WordPress) com qualsevol altre fitxer; la variant del directori és
 *     sempre monolítica. Els trossos orfes de builds anteriors ixen com a
 *     restes i no s'empaqueten;
 *   · soc-de-poble-X.zip              l'arbre estàtic, per a Sollutia o per a
 *                                     qualsevol amfitrió, amb el manifest;
 *   · socdepoble-enxufe-X.zip         el MATEIX arbre dins de l'adaptador de
 *                                     WordPress, amb la versió estampada;
 *   · socdepoble-enxufe-X-directori.zip  la variant per a WordPress.org: sense
 *                                     actualitzador ni Update URI, amb React del nucli;
 *   · stable.json (o --canal) i X.json  el canal (el manifest universal més els
 *                                     paquets), amb la signatura Ed25519 al
 *                                     costat (.sig, hexadecimal).
 * El canal propi i Sollutia compartixen els bytes; la variant del directori
 * té empremta pròpia i dependències explícites, sense canviar el contracte.
 *
 * No compila, no puja i no publica res: ho fa qui publica (vegeu --ajuda).
 * No depén de cap paquet: només node:crypto i node:zlib.
 *
 * Viu dins de wordpress-plugin/ perquè és l'eina del paquet, no una porta de
 * governança; no viatja mai dins de cap zip. Si es trasllada a tooling/, cal
 * fer-ho amb l'executor de mutacions i un lease.
 */
import crypto from 'node:crypto';
import { findDeepLSecrets } from '../../tooling/lib/dist-secrets.mjs';
import { bessonaDe, bessonesDe, esExtern, esHostLocal } from '../../src/config/politicaDeMitjans.js';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SLUG = 'socdepoble-enxufe';
export const ESQUEMA = 'sdp.release.v1';
export const FITXER_RELEASE = 'sdp-release.json';
export const FITXER_INVENTARI = 'sdp-inventari.json';
export const ENTRADA = 'soc-de-poble.standalone.js';

export const ARREL_PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ARREL_REPO = path.resolve(ARREL_PLUGIN, '..');

/** Fitxers de l'adaptador que viatgen al paquet de WordPress (llista blanca). */
export const ADAPTADOR = Object.freeze({
  fitxers: Object.freeze(['socdepoble-enxufe.php', 'uninstall.php', 'readme.txt']),
  carpetes: Object.freeze(['includes', 'templates', 'languages'])
});

/** L'única peça que no va a la variant del directori de WordPress.org. */
export const NOMES_CANAL_PROPI = 'includes/actualitzador.php';

/** Mida màxima del zip al formulari d'alta de WordPress.org (10 MB). */
export const LIMIT_DIRECTORI = 10 * 1024 * 1024;
/** Límit decimal del connector lleuger encomanat el 2026-10-21. */
export const LIMIT_LLEUGER = 2_500_000;

/* Patrons que Plugin Check marca com a actualitzador propi
   (Plugin_Updater_Check), més els noms del nostre canal: la variant del
   directori no en pot portar cap. */
export const PATRONS_ACTUALITZADOR = Object.freeze([
  /^[ \t/*#@]*Update URI\s*:/im,
  /plugin-update-checker/i,
  /WP_?GitHub_?Updater/i,
  /class\s+\w+_Plugin_Updater/i,
  /site_transient_update_plugins/i,
  /PluginUpdateChecker|PucFactory/i,
  /auto_update_plugin/i,
  /pre_set_site_transient_update_/i,
  /update_plugins_/i,
  /upgrader_pre_download/i
]);

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/;
const VERSIO_WP = /^\d+(?:\.\d+){0,2}$/;
const SHA256 = /^[0-9a-f]{64}$/;

const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');

/* ───────────────────────────────── ZIP ───────────────────────────────── */

const TAULA_CRC = (() => {
  const taula = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    taula[n] = c >>> 0;
  }
  return taula;
})();

/** CRC-32 de ZIP: el de zlib si el Node en porta (≥ 20.15), si no, per taula. */
export function crc32(dades) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(dades) >>> 0;
  let c = 0xFFFFFFFF;
  for (let i = 0; i < dades.length; i += 1) c = TAULA_CRC[(c ^ dades[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function dataDos(data) {
  const d = Number.isFinite(data?.getTime?.()) && data.getUTCFullYear() >= 1980 ? data : new Date(Date.UTC(1980, 0, 1));
  return {
    dosData: ((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate(),
    dosHora: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2)
  };
}

function nomValid(nom) {
  return typeof nom === 'string' && nom !== '' && !nom.startsWith('/') && !nom.includes('\\')
    && nom.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

/**
 * ZIP determinista: entrades ordenades per nom, una sola data, noms UTF-8,
 * deflate si comprimix i emmagatzemat si no. Sense ZIP64: menys de 65.535
 * entrades i de 4 GiB, que un paquet de l'enxufe no s'hi acosta.
 *
 * @param {{nom: string, dades: Buffer}[]} entrades
 * @param {{data?: Date}} [opcions]
 * @returns {Buffer}
 */
export function creaZip(entrades, { data } = {}) {
  const { dosData, dosHora } = dataDos(data);
  const ordenades = [...entrades].sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
  if (ordenades.length > 0xFFFF) throw new Error('Massa entrades per a un ZIP sense ZIP64.');
  const vistos = new Set();
  const trossos = [];
  const centrals = [];
  let desplacament = 0;
  for (const { nom, dades } of ordenades) {
    if (!nomValid(nom)) throw new Error(`Nom d'entrada no vàlid: ${nom}`);
    if (vistos.has(nom)) throw new Error(`Entrada repetida: ${nom}`);
    vistos.add(nom);
    const nomBuf = Buffer.from(nom, 'utf8');
    const crc = crc32(dades);
    const comprimit = zlib.deflateRawSync(dades, { level: 9 });
    const metode = comprimit.length < dades.length ? 8 : 0;
    const cos = metode === 8 ? comprimit : dades;
    if (dades.length > 0xFFFFFFFE || desplacament + 30 + nomBuf.length + cos.length > 0xFFFFFFFE) {
      throw new Error('Paquet massa gran per a un ZIP sense ZIP64.');
    }

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(metode, 8);
    local.writeUInt16LE(dosHora, 10);
    local.writeUInt16LE(dosData, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(cos.length, 18);
    local.writeUInt32LE(dades.length, 22);
    local.writeUInt16LE(nomBuf.length, 26);
    local.writeUInt16LE(0, 28);
    trossos.push(local, nomBuf, cos);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(metode, 10);
    central.writeUInt16LE(dosHora, 12);
    central.writeUInt16LE(dosData, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(cos.length, 20);
    central.writeUInt32LE(dades.length, 24);
    central.writeUInt16LE(nomBuf.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    central.writeUInt32LE(desplacament, 42);
    centrals.push(central, nomBuf);
    desplacament += 30 + nomBuf.length + cos.length;
  }
  const directori = Buffer.concat(centrals);
  const fi = Buffer.alloc(22);
  fi.writeUInt32LE(0x06054b50, 0);
  fi.writeUInt16LE(ordenades.length, 8);
  fi.writeUInt16LE(ordenades.length, 10);
  fi.writeUInt32LE(directori.length, 12);
  fi.writeUInt32LE(desplacament, 16);
  return Buffer.concat([...trossos, directori, fi]);
}

/**
 * Llig un ZIP de creaZip (o qualsevol sense ZIP64 ni xifrat) i comprova la
 * mida i el CRC de cada entrada. Servix a les proves i a qui vulga auditar un
 * paquet publicat.
 *
 * @param {Buffer} zip
 * @returns {{nom: string, dades: Buffer}[]}
 */
export function llegixZip(zip) {
  let fi = zip.length - 22;
  while (fi >= 0 && zip.readUInt32LE(fi) !== 0x06054b50) fi -= 1;
  if (fi < 0) throw new Error('El ZIP no té directori central.');
  const total = zip.readUInt16LE(fi + 10);
  let p = zip.readUInt32LE(fi + 16);
  const entrades = [];
  for (let i = 0; i < total; i += 1) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error('Directori central corrupte.');
    const metode = zip.readUInt16LE(p + 10);
    const crc = zip.readUInt32LE(p + 16);
    const mida = zip.readUInt32LE(p + 20);
    const midaReal = zip.readUInt32LE(p + 24);
    const llarg = zip.readUInt16LE(p + 28);
    const extra = zip.readUInt16LE(p + 30);
    const comentari = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const nom = zip.toString('utf8', p + 46, p + 46 + llarg);
    if (zip.readUInt32LE(local) !== 0x04034b50) throw new Error(`Capçalera local corrupta: ${nom}`);
    const inici = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const cos = zip.subarray(inici, inici + mida);
    const dades = metode === 8 ? zlib.inflateRawSync(cos) : Buffer.from(cos);
    if (dades.length !== midaReal || crc32(dades) !== crc) throw new Error(`Mida o CRC incorrectes: ${nom}`);
    entrades.push({ nom, dades });
    p += 46 + llarg + extra + comentari;
  }
  return entrades;
}

/* ─────────────────────────────── Signatura ─────────────────────────────── */

const PREFIX_SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

/** Parell nou Ed25519: la privada en PEM (PKCS#8) i la pública en hexadecimal. */
export function generaClau() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  return { pem: privateKey.export({ type: 'pkcs8', format: 'pem' }), publicaHex: clauPublicaHex(publicKey) };
}

/** Clau pública (32 bytes en hexadecimal) d'una KeyObject Ed25519, privada o pública. */
export function clauPublicaHex(clau) {
  const publica = clau.type === 'private' ? crypto.createPublicKey(clau) : clau;
  if (publica.asymmetricKeyType !== 'ed25519') throw new Error('La clau ha de ser Ed25519.');
  const der = publica.export({ type: 'spki', format: 'der' });
  return der.subarray(der.length - 32).toString('hex');
}

/** Signatura Ed25519 separada dels bytes exactes, en hexadecimal (128 xifres). */
export function signa(dades, pem) {
  const clau = crypto.createPrivateKey(pem);
  if (clau.asymmetricKeyType !== 'ed25519') throw new Error('La clau ha de ser Ed25519.');
  return crypto.sign(null, dades, clau).toString('hex');
}

/** El mateix que fa el plugin amb sodium_crypto_sign_verify_detached(). */
export function verifica(dades, signaturaHex, publicaHex) {
  if (!/^[0-9a-f]{128}$/.test(signaturaHex) || !/^[0-9a-f]{64}$/.test(publicaHex)) return false;
  const clau = crypto.createPublicKey({ key: Buffer.concat([PREFIX_SPKI_ED25519, Buffer.from(publicaHex, 'hex')]), format: 'der', type: 'spki' });
  return crypto.verify(null, dades, clau, Buffer.from(signaturaHex, 'hex'));
}

/** La clau pública que porta includes/actualitzador.php ('' si no en porta). */
export function clauIncrustada(textActualitzador) {
  const m = textActualitzador.match(/define\(\s*'SOCDEPOBLE_ENXUFE_CLAU_PUBLICA'\s*,\s*'([0-9a-fA-F]*)'\s*\)/);
  if (!m) throw new Error('includes/actualitzador.php no definix SOCDEPOBLE_ENXUFE_CLAU_PUBLICA.');
  return m[1].toLowerCase();
}

/* ──────────────────────────── Textos del paquet ──────────────────────────── */

function substituixUna(text, patro, substitut, que) {
  const coincidencies = text.match(new RegExp(patro.source, `${patro.flags.replace('g', '')}g`)) || [];
  if (coincidencies.length !== 1) throw new Error(`${que}: esperava una sola coincidència i n'hi ha ${coincidencies.length}.`);
  return text.replace(patro, substitut);
}

/** Estampa la versió a la capçalera i a la constant del fitxer principal. */
export function estampaVersio(textPhp, versio) {
  const capcalera = substituixUna(textPhp, /^([ \t]*\*[ \t]*Version:[ \t]*).*$/m, `$1${versio}`, 'Capçalera Version');
  return substituixUna(capcalera, /^(const SOCDEPOBLE_ENXUFE_VERSIO\s*=\s*')[^']*(';)/m, `$1${versio}$2`, 'Constant SOCDEPOBLE_ENXUFE_VERSIO');
}

/** Estampa el Stable tag del readme. */
export function estampaReadme(textReadme, versio) {
  return substituixUna(textReadme, /^(Stable tag:\s*).*$/m, `$1${versio}`, 'Stable tag del readme');
}

/** El fitxer principal sense la capçalera Update URI (variant del directori). */
export function variantDirectori(textPhp) {
  return minimWordPress(substituixUna(textPhp, /^[ \t]*\*[ \t]*Update URI:.*\r?\n/m, '', 'Capçalera Update URI'));
}

function minimWordPress(text) {
  const actual = capcalera(text, 'Requires at least');
  if (!VERSIO_WP.test(actual || '')) throw new Error('Falta Requires at least vàlid.');
  const [major, minor = 0] = actual.split('.').map(Number);
  if (major > 6 || (major === 6 && minor >= 6)) return text;
  return substituixUna(text, /^([ \t/*]*Requires at least:[ \t]*).*$/m, '$16.6', 'Mínim WordPress del runtime JSX');
}

/**
 * El readme sense el paràgraf del canal propi (variant del directori). Amb
 * `mitjans` (el del manifest del directori, encàrrec 261019_1425), en el seu
 * lloc va el servei extern que servix l'arxiu i el contingut: la guia del
 * directori demana declarar tot servei extern, i el readme de la font no té
 * marge (enxufe-plugin.test.mjs en limita la mida).
 */
export function variantDirectoriReadme(textReadme, mitjans = null) {
  const servei = mitjans?.origen
    ? `6. Sóc de Poble media server: the service's content images (the village archive and community photos and illustrations: ${mitjans.externs.map((prefix) => prefix.replace(/^assets\//, '').replace(/\/$/, '')).join(', ')}) are not bundled. The visitor's browser loads each one from ${mitjans.origen}/assets/ when a page shows it; like any image request, this sends the visitor's IP address, browser user agent and the address of the page. Terms and privacy information: https://socdepoble.org/legal\n\n`
    : '';
  // Una funció i no el text: cap «$» de l'origen no es llig com un patró de replace().
  return minimWordPress(substituixUna(textReadme, /^(?:Update channel|Canal d'actualització) \(.*\r?\n\r?\n/m, () => servei, 'Paràgraf del canal del readme'));
}

/**
 * Slug que WordPress.org deriva del Plugin Name en l'alta (remove_accents +
 * sanitize_title_with_dashes, aproximat). Si no és SLUG, cal demanar l'slug
 * explícitament en l'alta o Plugin Check hi veurà TextDomainMismatch.
 */
export function slugDelNom(nom) {
  return String(nom).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9 _.-]/g, '').replace(/[_.\s]+/g, '-')
    .replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

/** Capçaleres d'un fitxer de text de WordPress (PHP o readme). */
function capcalera(text, nom) {
  const m = text.match(new RegExp(`^[ \\t/*#@]*${nom}:[ \\t]*(.+?)[ \\t]*$`, 'mi'));
  return m ? m[1] : null;
}

/** Requisits de WordPress per al canal, llegits de la capçalera i del readme. */
export function requisitsDe(textPhp, textReadme) {
  const requisits = {
    requires: capcalera(textPhp, 'Requires at least'),
    requires_php: capcalera(textPhp, 'Requires PHP'),
    tested: capcalera(textReadme, 'Tested up to')
  };
  for (const [clau, valor] of Object.entries(requisits)) {
    if (!VERSIO_WP.test(valor || '')) throw new Error(`Requisit ${clau} no vàlid: ${valor}`);
  }
  for (const [nom, clau] of [['Requires at least', 'requires'], ['Requires PHP', 'requires_php']]) {
    const alReadme = capcalera(textReadme, nom);
    if (alReadme && alReadme !== requisits[clau]) throw new Error(`El readme diu ${nom}: ${alReadme} i la capçalera ${requisits[clau]}.`);
  }
  return requisits;
}

/* ─────────────────────────────── Build i inventari ─────────────────────────────── */

/** Per què este build no es pot empaquetar. `prova` admet un node de desenvolupament. */
export function errorsDelBuild(release, { prova = false } = {}) {
  const errors = [];
  if (release?.schema !== ESQUEMA || release?.producte !== 'soc-de-poble') errors.push(`${FITXER_RELEASE} no és un manifest ${ESQUEMA}.`);
  if (!SEMVER.test(release?.versio || '')) errors.push(`Versió no vàlida: ${release?.versio}`);
  else if (!prova && /-dev(?:\.|$)/.test(release.versio)) errors.push(`${release.versio} és una versió de desenvolupament: compila amb SDP_RELEASE=1 SDP_VERSIO=x.y.z.`);
  if (release?.entrada?.cami !== ENTRADA || !SHA256.test(release?.entrada?.sha256 || '')) errors.push('El manifest no descriu el bundle.');
  if (release?.inventari?.cami !== FITXER_INVENTARI || !SHA256.test(release?.inventari?.sha256 || '')) errors.push('El manifest no descriu l’inventari.');
  if (!prova) {
    if (release?.node?.desenvolupament !== false) errors.push(`El node segellat (${release?.node?.origen}) és de desenvolupament.`);
    if (release?.node?.mode !== 'remote') errors.push(`El mode de dades és ${release?.node?.mode}, no remote.`);
    if (!release?.node?.tenant) errors.push('El paquet no porta el tenant d’un poble.');
  }
  return errors;
}

function recorre(arrel, rel, eixida) {
  for (const entrada of fs.readdirSync(path.join(arrel, rel), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const fill = rel ? `${rel}/${entrada.name}` : entrada.name;
    if (entrada.isSymbolicLink()) throw new Error(`Enllaç simbòlic dins del paquet: ${fill}`);
    if (entrada.isDirectory()) recorre(arrel, fill, eixida);
    else if (entrada.isFile()) eixida.push(fill);
  }
  return eixida;
}

/**
 * Verifica l'inventari del build contra el disc i torna els camins que
 * viatgen, més les restes del disc que no hi són (no s'empaqueten).
 */
export function verificaInventari(dist, release) {
  const textInventari = fs.readFileSync(path.join(dist, FITXER_INVENTARI));
  if (sha256(textInventari) !== release.inventari.sha256) throw new Error(`${FITXER_INVENTARI} no és el que descriu el manifest.`);
  const { fitxers } = JSON.parse(textInventari.toString('utf8'));
  if (!Array.isArray(fitxers) || fitxers.length !== release.inventari.fitxers) throw new Error('L’inventari no té el nombre de fitxers del manifest.');
  const camins = new Set();
  for (const { cami, mida, sha256: esperat } of fitxers) {
    if (!nomValid(cami) || camins.has(cami) || [FITXER_RELEASE, FITXER_INVENTARI].includes(cami)) throw new Error(`Camí d'inventari no vàlid: ${cami}`);
    camins.add(cami);
    const abs = path.join(dist, cami);
    const estat = fs.lstatSync(abs, { throwIfNoEntry: false });
    if (!estat || !estat.isFile()) throw new Error(`Falta al build o no és un fitxer: ${cami}`);
    const dades = fs.readFileSync(abs);
    if (dades.length !== mida || sha256(dades) !== esperat) throw new Error(`Ha canviat després de compilar: ${cami}`);
    if (cami === ENTRADA && esperat !== release.entrada.sha256) throw new Error('L’inventari i el manifest no coincidixen en el bundle.');
  }
  if (!camins.has(ENTRADA)) throw new Error(`L'inventari no porta ${ENTRADA}.`);
  const restes = recorre(dist, '', []).filter((cami) => !camins.has(cami) && ![FITXER_RELEASE, FITXER_INVENTARI].includes(cami));
  return { camins: [...camins].sort(), restes };
}

/* Decisió 5 del Mestre (261007): la carpeta dels mòduls del paquet trossejat
   i la forma del seu mòdul d'entrada (vite.standalone.config.js). */
export const CARPETA_DE_TROSSOS = 'trossos';
const MODUL_DE_TROSSOS = /^trossos\/[A-Za-z0-9_-]+\.js$/;

/**
 * Contrasta la clau `formatDelPaquet` del manifest amb el que l'inventari
 * porta de veritat (`camins`, de verificaInventari) i torna { format, trossos }:
 *   · sense `formatDelPaquet`, o monolític: res sota trossos/ (un tros dins
 *     d'un paquet monolític seria una barreja de builds);
 *   · trossos: el mòdul d'entrada és vàlid i és a l'inventari, el carregador
 *     el nomena (si no, en demanaria un altre), tot el que hi ha sota
 *     trossos/ és .js i en són exactament `formatDelPaquet.trossos`.
 * Un format desconegut no s'empaqueta. Relleu 261007 · la clau no es diu
 * `paquet`: al canal, `paquet` són els zips (`estatic.paquet` i
 * `adaptadors.wordpress.paquet`).
 */
export function verificaPaquet(dist, release, camins) {
  const paquet = release.formatDelPaquet;
  const deTrossos = camins.filter((cami) => cami.startsWith(`${CARPETA_DE_TROSSOS}/`));
  if (paquet === undefined || paquet?.format === 'monolitic') {
    if (deTrossos.length) throw new Error(`Un paquet monolític no porta ${CARPETA_DE_TROSSOS}/: ${deTrossos[0]}`);
    return { format: 'monolitic', trossos: 0 };
  }
  if (paquet?.format !== 'trossos') throw new Error(`Format de paquet desconegut: ${paquet?.format}`);
  if (typeof paquet.modul !== 'string' || !MODUL_DE_TROSSOS.test(paquet.modul) || !camins.includes(paquet.modul)) {
    throw new Error(`El mòdul d'entrada del paquet no és a l'inventari: ${paquet.modul}`);
  }
  if (!fs.readFileSync(path.join(dist, ENTRADA), 'utf8').includes(paquet.modul)) throw new Error(`${ENTRADA} no demana ${paquet.modul}.`);
  const noJs = deTrossos.find((cami) => !cami.endsWith('.js'));
  if (noJs) throw new Error(`Sota ${CARPETA_DE_TROSSOS}/ només hi van mòduls .js: ${noJs}`);
  if (deTrossos.length !== paquet.trossos) {
    throw new Error(`El manifest diu ${paquet.trossos} trossos i l'inventari en porta ${deTrossos.length}.`);
  }
  return { format: 'trossos', trossos: deTrossos.length };
}

/**
 * Encàrrec 261019_1425 · La política de mitjans entre les dues variants, a
 * partir dels manifests i dels camins de cada inventari:
 *   · l'autònom (canal propi, Sollutia) ho porta tot dins del paquet: com a
 *     molt hi declara les bessones (D3), mai cap origen extern; si les dos
 *     variants en declaren, n'han de declarar les mateixes (el mateix public/);
 *   · el directori en pot declarar una (`mitjans`: { origen https, externs }),
 *     i llavors no porta cap fitxer d'una carpeta externa, i cada recurs
 *     d'assets/ de l'autònom que no hi viatja és extern o hi viatja la seua
 *     bessona .webp. Res no desapareix del directori sense motiu.
 * L'origen, amb el criteri del build (origenDeMitjans): https i un host
 * públic; amb `prova`, també un host local (http o https), per a WordPress
 * Studio. Torna { externs, substituits } (quants camins de l'autònom se'n
 * queden fora).
 */
export function verificaMitjans(release, releaseDirectori, caminsAutonom, caminsDirectori, { prova = false } = {}) {
  const autonom = release?.mitjans;
  if (autonom !== undefined && (autonom?.origen !== null || !Array.isArray(autonom?.externs) || autonom.externs.length > 0)) {
    throw new Error('El paquet autònom no pot declarar mitjans externs: ho porta tot (com a molt, la bessona en lloc de l\'original).');
  }
  const mitjans = releaseDirectori?.mitjans;
  if (autonom !== undefined && mitjans !== undefined && autonom.bessones !== mitjans.bessones) {
    throw new Error(`Les dues variants no substituïxen les mateixes bessones (${autonom.bessones} i ${mitjans.bessones}): compileu-les des del mateix public/.`);
  }
  if (mitjans === undefined) return { externs: 0, substituits: 0 };
  let url = null;
  try { url = new URL(mitjans?.origen); } catch { /* no és cap URL */ }
  const forma = url && !url.username && !url.password && !url.search && !url.hash && !/\/$/.test(mitjans.origen)
    && `${url.origin}${url.pathname}`.replace(/\/+$/, '') === mitjans.origen;
  const local = Boolean(url) && esHostLocal(url.hostname);
  const admes = forma && ((url.protocol === 'https:' && !local) || (prova && local && ['http:', 'https:'].includes(url.protocol)));
  if (!admes) {
    throw new Error(`L'origen dels mitjans del directori no és una adreça https pública${prova ? ' ni local' : ''}: ${mitjans?.origen}`);
  }
  const prefixos = mitjans.externs;
  if (!Array.isArray(prefixos) || !prefixos.every((prefix) => typeof prefix === 'string' && /^assets\/(?:[^/.][^/]*\/)+$/.test(prefix))) {
    throw new Error('Els mitjans externs del directori han de ser carpetes d\'assets/ amb la barra final.');
  }
  const dinsDelDirectori = new Set(caminsDirectori);
  const dinsExterna = caminsDirectori.find((cami) => esExtern(cami, prefixos));
  if (dinsExterna) throw new Error(`El directori porta un mitjà extern: ${dinsExterna}`);
  let externs = 0;
  let substituits = 0;
  // La mateixa regla d'única font que el build: un original amb germà del mateix nom no en té.
  const ambBessona = new Set(bessonesDe(caminsAutonom));
  for (const cami of caminsAutonom) {
    if (!cami.startsWith('assets/') || dinsDelDirectori.has(cami)) continue;
    if (esExtern(cami, prefixos)) externs += 1;
    else if (ambBessona.has(cami) && dinsDelDirectori.has(bessonaDe(cami))) substituits += 1;
    else throw new Error(`Falta al directori sense ser extern ni tindre la bessona: ${cami}`);
  }
  return { externs, substituits };
}

/** Fitxers de l'adaptador (llista blanca), sense ocults. */
export function fitxersAdaptador(arrelPlugin = ARREL_PLUGIN) {
  const rels = [...ADAPTADOR.fitxers];
  for (const carpeta of ADAPTADOR.carpetes) rels.push(...recorre(arrelPlugin, carpeta, []));
  return rels
    .filter((rel) => !rel.split('/').some((segment) => segment.startsWith('.')))
    .sort()
    .map((rel) => ({ rel, dades: fs.readFileSync(path.join(arrelPlugin, rel)) }));
}

/**
 * Connector instal·lable manualment, amb els assets al servidor canònic.
 * Reutilitza inventari, contracte i comprovació de secrets de les releases.
 * No necessita ni modifica el canal signat, ni la variant de WordPress.org.
 */
export function creaPaquetLleuger({ arrelPlugin = ARREL_PLUGIN } = {}) {
  const dist = path.join(arrelPlugin, 'dist');
  const manifestText = fs.readFileSync(path.join(dist, FITXER_RELEASE));
  const release = JSON.parse(manifestText);
  const errors = errorsDelBuild(release);
  if (errors.length) throw new Error(`Build lleuger invàlid:\n- ${errors.join('\n- ')}`);
  if (release.runtime?.amfitrio !== 'autonom' || release.runtime.dependencies?.length !== 0) {
    throw new Error('El connector lleuger necessita el runtime autònom.');
  }
  const mitjans = release.mitjans;
  let origen;
  try { origen = new URL(mitjans?.origen); } catch { /* validació de baix */ }
  if (!origen || origen.protocol !== 'https:' || esHostLocal(origen.hostname)
      || origen.username || origen.password || origen.search || origen.hash
      || `${origen.origin}${origen.pathname}`.replace(/\/+$/, '') !== mitjans.origen
      || JSON.stringify(mitjans.externs) !== '["assets/"]') {
    throw new Error('Compila amb SDP_MITJANS=externs i un origen https públic de mitjans.');
  }
  const { camins, restes } = verificaInventari(dist, release);
  verificaPaquet(dist, release, camins);
  if (camins.some(cami => cami.startsWith('assets/'))) throw new Error('El connector lleuger encara porta assets locals.');
  const adaptador = fitxersAdaptador(arrelPlugin).map(({ rel, dades }) => {
    if (rel === 'socdepoble-enxufe.php') dades = Buffer.from(estampaVersio(dades.toString('utf8'), release.versio));
    if (rel === 'readme.txt') {
      dades = Buffer.from(`${estampaReadme(dades.toString('utf8'), release.versio)}\n== Lightweight media ==\n\nThis manually installed package loads its images and media from ${mitjans.origen}/assets/. Each request sends the visitor's IP address and browser user agent to that server. The application code, fonts and knowledge index are included in the plugin. Terms and privacy: https://socdepoble.org/legal\n`);
    }
    return { nom: `${SLUG}/${rel}`, dades };
  });
  const entrades = [
    ...adaptador,
    ...[...camins, FITXER_RELEASE, FITXER_INVENTARI].map(cami => ({
      nom: `${SLUG}/dist/${cami}`, dades: fs.readFileSync(path.join(dist, cami))
    }))
  ];
  comprovaSecretsDeepL(entrades);
  const zip = creaZip(entrades, { data: new Date(release.generat) });
  if (zip.length >= LIMIT_LLEUGER) throw new Error(`El connector fa ${zip.length} B: ha de quedar per davall de ${LIMIT_LLEUGER} B.`);
  return { zip, versio: release.versio, mida: zip.length, sha256: sha256(zip), origen: mitjans.origen, restes };
}

/** Patrons d'actualitzador que queden en unes entrades de zip (fitxers .php i readme). */
export function patronsActualitzadorEn(entrades) {
  const trobats = [];
  for (const { nom, dades } of entrades) {
    if (!/\.(php|txt)$/.test(nom)) continue;
    const text = dades.toString('utf8');
    for (const patro of PATRONS_ACTUALITZADOR) if (patro.test(text)) trobats.push(`${nom}: ${patro}`);
  }
  return trobats;
}

function validaUrlBase(urlBase, { prova }) {
  let url;
  try { url = new URL(urlBase); } catch { throw new Error(`--url-base no és una URL: ${urlBase}`); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.hostname.endsWith('.localhost');
  if (url.protocol === 'https:' && (!local || prova)) return;
  if (url.protocol === 'http:' && local && prova) return;
  throw new Error('--url-base ha de ser https (http cap a localhost només amb --prova).');
}

/* ─────────────────────────────── Empaquetat ─────────────────────────────── */

/**
 * Genera els tres paquets i el canal a `sortida`. Torna un resum.
 *
 * @param {object} opcions
 * @param {string} [opcions.arrelPlugin] Carpeta wordpress-plugin.
 * @param {string} [opcions.sortida]     Carpeta dins de wordpress-plugin/builds/ (per defecte, builds/).
 * @param {string} opcions.urlBase        On es podran baixar els zips; admet {versio}.
 * @param {string} [opcions.clauPem]      Clau privada Ed25519 en PEM.
 * @param {string} [opcions.notes]        URL https de les notes de la versió.
 * @param {boolean} [opcions.prova]       Node de desenvolupament, sense signatura i http local.
 * @param {string} [opcions.canal]        Nom del canal (stable per defecte; p. ex. rc per a provar a Studio).
 */
export function empaqueta({ arrelPlugin = ARREL_PLUGIN, sortida, urlBase, clauPem, notes, prova = false, canal: nomCanal = 'stable' }) {
  if (prova && clauPem) throw new Error('--prova no signa mai: una signatura només cobrix builds que passen les portes de release.');
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(nomCanal) || SEMVER.test(nomCanal)) throw new Error(`Nom de canal no vàlid: ${nomCanal}`);
  const dist = path.join(arrelPlugin, 'dist');
  const textRelease = fs.readFileSync(path.join(dist, FITXER_RELEASE));
  const release = JSON.parse(textRelease.toString('utf8'));
  const errors = errorsDelBuild(release, { prova });
  if (errors.length) throw new Error(`Este build no es pot empaquetar:\n- ${errors.join('\n- ')}`);
  const { versio } = release;
  const { camins, restes } = verificaInventari(dist, release);
  verificaPaquet(dist, release, camins);
  // Cap substitució silenciosa, tampoc en --prova: els dos builds són obligatoris.
  const distDirectori = path.join(arrelPlugin, 'builds/directori/dist');
  const manifestDirectori = path.join(distDirectori, FITXER_RELEASE);
  if (!fs.existsSync(manifestDirectori)) throw new Error('Falta build:wp:directori; compila les dues variants.');
  const textDirectori = fs.readFileSync(manifestDirectori);
  const releaseDirectori = JSON.parse(textDirectori.toString('utf8'));
  const errorsDirectori = errorsDelBuild(releaseDirectori, { prova });
  if (errorsDirectori.length) throw new Error(`Build del directori invàlid: ${errorsDirectori.join('; ')}`);
  const runtimeCorrecte = (r, amfitrio, dependencies) => r?.amfitrio === amfitrio
    && JSON.stringify(r.dependencies) === JSON.stringify(dependencies);
  if (!runtimeCorrecte(release.runtime, 'autonom', [])
      || !runtimeCorrecte(releaseDirectori.runtime, 'wordpress', ['react', 'react-dom', 'react-jsx-runtime'])
      || releaseDirectori.runtime.wordpressMinim !== '6.6') {
    throw new Error('Runtime incoherent: dist ha de ser autònom i builds/directori/dist ha de ser WordPress.');
  }
  if (release.versio !== releaseDirectori.versio
      || JSON.stringify(release.node) !== JSON.stringify(releaseDirectori.node)
      || JSON.stringify(release.contracte) !== JSON.stringify(releaseDirectori.contracte)) {
    throw new Error('Les dues variants han de compartir versió, node i contracte.');
  }
  const inventariDirectori = verificaInventari(distDirectori, releaseDirectori);
  /* Decisió 5 (261007): el directori usa el React del nucli i no trosseja. */
  if (releaseDirectori.formatDelPaquet !== undefined && releaseDirectori.formatDelPaquet?.format !== 'monolitic') {
    throw new Error('La variant del directori ha de ser monolítica: SDP_VARIANT=wordpress no trosseja.');
  }
  verificaPaquet(distDirectori, releaseDirectori, inventariDirectori.camins);
  const mitjansDirectori = verificaMitjans(release, releaseDirectori, camins, inventariDirectori.camins, { prova });

  if (!urlBase) throw new Error('Cal --url-base: la URL des d’on es podran baixar els zips.');
  validaUrlBase(urlBase, { prova });
  if (notes && !/^https:\/\//.test(notes)) throw new Error('--notes ha de ser una URL https.');

  const adaptador = fitxersAdaptador(arrelPlugin);
  const text = (rel) => {
    const fitxer = adaptador.find((f) => f.rel === rel);
    if (!fitxer) throw new Error(`Falta ${rel} a l'adaptador.`);
    return fitxer.dades.toString('utf8');
  };
  const requisits = requisitsDe(text('socdepoble-enxufe.php'), text('readme.txt'));
  const phpEstampat = estampaVersio(text('socdepoble-enxufe.php'), versio);
  const readmeEstampat = estampaReadme(text('readme.txt'), versio);
  const phpDirectori = variantDirectori(phpEstampat);
  const readmeDirectori = variantDirectoriReadme(readmeEstampat, releaseDirectori.mitjans);
  const requisitsDirectori = requisitsDe(phpDirectori, readmeDirectori);

  const incrustada = clauIncrustada(text(NOMES_CANAL_PROPI));
  if (clauPem) {
    const derivada = clauPublicaHex(crypto.createPrivateKey(clauPem));
    if (incrustada !== derivada) {
      throw new Error(`La clau pública del plugin (${incrustada || 'buida'}) no és la de la clau que signa (${derivada}). Posa-la a SOCDEPOBLE_ENXUFE_CLAU_PUBLICA abans d'empaquetar: si no, cap lloc no podria verificar esta release.`);
    }
  } else if (!prova) {
    throw new Error('Cal --clau: una release sense signatura no l’instal·la cap lloc.');
  }

  const data = new Date(release.generat);
  const marca = marcaDelBuild(release.generat);
  const deDist = [
    ...camins.map((cami) => ({ rel: cami, dades: fs.readFileSync(path.join(dist, cami)) })),
    { rel: FITXER_RELEASE, dades: textRelease },
    { rel: FITXER_INVENTARI, dades: fs.readFileSync(path.join(dist, FITXER_INVENTARI)) }
  ];

  const substitucions = new Map([
    ['socdepoble-enxufe.php', Buffer.from(phpEstampat)],
    ['readme.txt', Buffer.from(readmeEstampat)]
  ]);
  const entradesWp = [
    ...adaptador.map((f) => ({ nom: `${SLUG}/${f.rel}`, dades: substitucions.get(f.rel) ?? f.dades })),
    ...deDist.map((f) => ({ nom: `${SLUG}/dist/${f.rel}`, dades: f.dades }))
  ];
  comprovaSecretsDeepL(entradesWp);
  const deDistDirectori = [
    ...inventariDirectori.camins.map(cami => ({ rel: cami, dades: fs.readFileSync(path.join(distDirectori, cami)) })),
    { rel: FITXER_RELEASE, dades: textDirectori },
    { rel: FITXER_INVENTARI, dades: fs.readFileSync(path.join(distDirectori, FITXER_INVENTARI)) }
  ];
  const entradesDirectori = [
    ...entradesWp.filter(e => !e.nom.startsWith(`${SLUG}/dist/`)),
    ...deDistDirectori.map(f => ({ nom: `${SLUG}/dist/${f.rel}`, dades: f.dades }))
  ]
    .filter((e) => e.nom !== `${SLUG}/${NOMES_CANAL_PROPI}`)
    .map((e) => {
      if (e.nom === `${SLUG}/socdepoble-enxufe.php`) return { ...e, dades: Buffer.from(phpDirectori) };
      if (e.nom === `${SLUG}/readme.txt`) return { ...e, dades: Buffer.from(readmeDirectori) };
      return e;
    });
  comprovaSecretsDeepL(entradesDirectori);
  const patrons = patronsActualitzadorEn(entradesDirectori);
  if (patrons.length) throw new Error(`La variant del directori encara porta patrons d'actualitzador:\n- ${patrons.join('\n- ')}`);

  const noms = {
    estatic: `${marca}_estatic_spa_v${versio}.zip`,
    wordpress: `${marca}_wordpress_enxufe_v${versio}.zip`,
    directori: `${marca}_wordpress_directori_v${versio}.zip`
  };
  // La variant de directori es guarda només si cal, mantenint builds/ net
  const caminsPaquet = { ...noms, directori: noms.directori };
  const zips = {
    estatic: creaZip(deDist.map((f) => ({ nom: `soc-de-poble/${f.rel}`, dades: f.dades })), { data }),
    wordpress: creaZip(entradesWp, { data }),
    directori: creaZip(entradesDirectori, { data })
  };
  const avisos = [];
  if (zips.directori.length > LIMIT_DIRECTORI) {
    avisos.push(`${noms.directori} fa ${zips.directori.length} B i el formulari d'alta de WordPress.org n'admet ${LIMIT_DIRECTORI}: no es pot enviar tal com està (cal decidir quins mitjans de dist/ porta el paquet).`);
  }
  const slugInicial = slugDelNom(capcalera(text('socdepoble-enxufe.php'), 'Plugin Name'));
  if (slugInicial !== SLUG) {
    avisos.push(`WordPress.org derivaria l'slug «${slugInicial}» del Plugin Name: en l'alta cal demanar «${SLUG}» abans de la revisió.`);
  }
  const base = urlBase.split('{versio}').join(versio).replace(/\/?$/, '/');
  const paquet = (clau) => ({ nom: noms[clau], url: new URL(noms[clau], base).href, mida: zips[clau].length, sha256: sha256(zips[clau]) });

  const canal = {
    ...release,
    canal: nomCanal,
    adaptadors: {
      wordpress: {
        slug: SLUG,
        versio,
        ...requisits,
        paquet: paquet('wordpress'),
        directori: { nom: noms.directori, cami: caminsPaquet.directori, mida: zips.directori.length, sha256: sha256(zips.directori),
          ...requisitsDirectori, runtime: releaseDirectori.runtime, entrada: releaseDirectori.entrada }
      }
    },
    estatic: { paquet: paquet('estatic') },
    ...(notes ? { notes } : {})
  };
  const textCanal = Buffer.from(`${JSON.stringify(canal, null, 2)}\n`);
  const signatura = clauPem ? `${signa(textCanal, clauPem)}\n` : null;

  const desti = path.resolve(sortida || path.join(arrelPlugin, 'builds'));
  const canals = [`${nomCanal}.json`, `${versio}.json`];
  comprovaDestinacio(arrelPlugin, desti, [
    ...Object.values(caminsPaquet), ...canals, ...(signatura ? canals.map(nom => `${nom}.sig`) : [])
  ]);
  fs.mkdirSync(desti, { recursive: true });
  const escrits = [];
  const escriu = (nom, dades) => {
    fs.mkdirSync(path.dirname(path.join(desti, nom)), { recursive: true });
    fs.writeFileSync(path.join(desti, nom), dades);
    escrits.push(nom);
  };
  for (const clau of Object.keys(noms)) escriu(caminsPaquet[clau], zips[clau]);
  for (const nom of canals) {
    escriu(nom, textCanal);
    if (signatura) escriu(`${nom}.sig`, signatura);
  }
  return { versio, desti, escrits, signat: Boolean(signatura), restes, avisos, entrada: release.entrada.sha256, canal,
    restesDirectori: inventariDirectori.restes,
    mitjans: { ...mitjansDirectori, origen: releaseDirectori.mitjans?.origen ?? null, bessones: releaseDirectori.mitjans?.bessones ?? 0,
      bessonesAutonom: release.mitjans?.bessones ?? 0, directori: zips.directori.length } };
}

/** Hora termodinàmica del build, estable encara que s'empaquete un altre dia o fus. */
export function marcaDelBuild(generat) {
  const data = new Date(generat);
  if (typeof generat !== 'string' || !Number.isFinite(data.getTime())) throw new Error('El build no porta una data generat vàlida.');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(data).map(({ type, value }) => [type, value]));
  return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`;
}

/** Cap eixida fora de builds/, tampoc a través d'enllaços ja existents. */
function comprovaDestinacio(arrelPlugin, desti, fitxers) {
  const arrel = path.resolve(arrelPlugin);
  const builds = path.join(arrel, 'builds');
  const rel = path.relative(builds, desti);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error('La carpeta d’eixida ha d’estar dins de wordpress-plugin/builds/.');
  }
  for (const target of [desti, ...fitxers.map(nom => path.join(desti, nom))]) {
    let actual = arrel;
    for (const segment of path.relative(arrel, target).split(path.sep)) {
      actual = path.join(actual, segment);
      const stat = fs.lstatSync(actual, { throwIfNoEntry: false });
      if (stat?.isSymbolicLink()) throw new Error('La destinació no pot travessar enllaços simbòlics.');
    }
  }
}

/* ─────────────────────────────────── CLI ─────────────────────────────────── */

export const AJUDA = `Empaquetador de l'enxufe (sdp.release.v1)

Ús:
  SDP_MITJANS=externs SDP_RELEASE=1 SDP_VERSIO=1.1.10-beta.1 npm run build:wp
  node wordpress-plugin/eines/empaqueta.mjs --lleuger
  node wordpress-plugin/eines/empaqueta.mjs --url-base URL --clau FITXER.pem [--notes URL] [--sortida DIR]
  node wordpress-plugin/eines/empaqueta.mjs --genera-clau FITXER.pem
  node wordpress-plugin/eines/empaqueta.mjs --prova --url-base http://localhost:8881/enxufe/

Una release, en ordre:
  1. SDP_RELEASE=1 SDP_VERSIO=0.2.0 npm run build:wp   (VITE_* de producció a .env.production.local)
     SDP_RELEASE=1 SDP_VERSIO=0.2.0 npm run build:wp:directori
     L'autònom ix trossejat (carregador + dist/trossos/); SDP_PAQUET=monolitic torna a l'IIFE
     d'un sol fitxer. El directori és sempre monolític.
  2. node wordpress-plugin/eines/empaqueta.mjs \\
       --url-base https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v{versio}/ \\
       --clau ~/.sdp/enxufe-ed25519.pem
  3. Els ZIP queden en wordpress-plugin/builds/: socdepoble-spa-vX-AAMMDD_HHMM.zip i
     socdepoble-enxufe-vX-AAMMDD_HHMM.zip. La data és la del build autònom, en Europe/Madrid.
     Puja estos dos fitxers a la release enxufe-v0.2.0 de socdepoble/socdepoble.org.
     directori/socdepoble-enxufe-vX-AAMMDD_HHMM.zip és la variant per a WordPress.org.
  4. DESPRÉS, copia stable.json, 0.2.0.json i les seues .sig a public/enxufe/ i desplega socdepoble.org.

Opcions:
  --lleuger          Crea ../_builds_de_poble/wordpress/socdepoble.zip (<2.500.000 B).
                     Requerix el build autònom amb SDP_MITJANS=externs. No publica cap canal.
  --url-base URL      On es podran baixar els zips ({versio} es substituïx).
  --clau FITXER       Clau privada Ed25519 (PEM). Ha de correspondre a SOCDEPOBLE_ENXUFE_CLAU_PUBLICA.
  --notes URL         Notes de la versió (https).
  --sortida DIR       Carpeta dins de wordpress-plugin/builds/ (per defecte, builds/).
  --canal NOM         Nom del fitxer de canal (stable per defecte). Per a provar a WordPress Studio:
                      --canal rc, i al wp-config.php de Studio
                      define( 'SOCDEPOBLE_ENXUFE_CANAL', 'https://socdepoble.org/enxufe/rc.json' );
  --genera-clau F     Crea una clau nova fora del repositori i diu la clau pública que cal posar al plugin.
  --prova             Canal de proves: node de desenvolupament, sense signatura, http cap a localhost.
  --ajuda             Esta ajuda.`;

function llegixArguments(argv) {
  const opcions = {};
  const ambValor = new Set(['url-base', 'clau', 'notes', 'sortida', 'genera-clau', 'canal']);
  for (let i = 0; i < argv.length; i += 1) {
    const nom = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--')) throw new Error(`Argument inesperat: ${argv[i]}`);
    if (ambValor.has(nom)) {
      if (i + 1 >= argv.length) throw new Error(`Falta el valor de --${nom}.`);
      opcions[nom] = argv[i += 1];
    } else if (nom === 'prova' || nom === 'ajuda' || nom === 'lleuger') {
      opcions[nom] = true;
    } else {
      throw new Error(`Opció desconeguda: --${nom}`);
    }
  }
  return opcions;
}

export function executa(argv, registre = console) {
  const opcions = llegixArguments(argv);
  if (opcions.ajuda) { registre.log(AJUDA); return 0; }

  if (opcions.lleuger) {
    if (Object.keys(opcions).length !== 1) throw new Error('--lleuger no es combina amb opcions del canal de releases.');
    const desti = path.resolve(ARREL_REPO, '../_builds_de_poble/wordpress');
    if (!fs.existsSync(desti) || !fs.lstatSync(desti).isDirectory()
        || fs.lstatSync(path.dirname(desti)).isSymbolicLink()) {
      throw new Error('Falta la carpeta satèl·lit canònica _builds_de_poble/wordpress/ (no es crea automàticament).');
    }
    const fitxer = path.join(desti, 'socdepoble.zip');
    if (fs.lstatSync(fitxer, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error('El ZIP de destinació no pot ser un enllaç simbòlic.');
    const resultat = creaPaquetLleuger();
    fs.writeFileSync(fitxer, resultat.zip);
    registre.log(`${fitxer}\n${resultat.mida} B; SHA-256 ${resultat.sha256}\nMitjans: ${resultat.origen}/assets/\nPaquet manual; canal estable intacte.`);
    return 0;
  }

  if (opcions['genera-clau']) {
    const fitxer = path.resolve(opcions['genera-clau']);
    if (fitxer === ARREL_REPO || fitxer.startsWith(`${ARREL_REPO}${path.sep}`)) throw new Error('La clau privada no pot viure dins del repositori.');
    if (fs.existsSync(fitxer)) throw new Error(`Ja existix ${fitxer}: no se sobreescriu cap clau.`);
    const { pem, publicaHex } = generaClau();
    fs.mkdirSync(path.dirname(fitxer), { recursive: true });
    fs.writeFileSync(fitxer, pem, { mode: 0o600, flag: 'wx' });
    registre.log(`Clau privada: ${fitxer} (guarda'n una còpia fora de línia; sense ella cap lloc no rebrà més actualitzacions).`);
    registre.log(`Clau pública, per a SOCDEPOBLE_ENXUFE_CLAU_PUBLICA a wordpress-plugin/includes/actualitzador.php:\n${publicaHex}`);
    return 0;
  }

  const resultat = empaqueta({
    urlBase: opcions['url-base'],
    clauPem: opcions.clau ? fs.readFileSync(path.resolve(opcions.clau), 'utf8') : null,
    notes: opcions.notes,
    sortida: opcions.sortida,
    prova: Boolean(opcions.prova),
    ...(opcions.canal ? { canal: opcions.canal } : {})
  });
  registre.log(`Release ${resultat.versio} a ${resultat.desti}`);
  for (const nom of resultat.escrits) registre.log(`  · ${nom}`);
  registre.log(`Bundle autònom (sha256, canal propi i estàtic): ${resultat.entrada}`);
  if (!resultat.signat) registre.log('SENSE SIGNATURA (--prova): cap lloc amb clau configurada no acceptarà este canal.');
  if (resultat.restes.length) registre.log(`${resultat.restes.length} fitxer(s) de dist/ fora de l'inventari (restes velles): no s'han empaquetat.`);
  if (resultat.mitjans.origen) {
    registre.log(`Directori (${resultat.mitjans.directori} B): ${resultat.mitjans.externs} mitjans externs des de ${resultat.mitjans.origen} i ${resultat.mitjans.bessones} originals substituïts per la seua bessona .webp. Abans de publicar el zip, l'origen ha de servir cada mitjà extern i la seua bessona com a imatge (content-type image/*, no una pàgina de reserva) i amb CORS (Access-Control-Allow-Origin i Access-Control-Expose-Headers: Content-Range, ETag) per a l'EXIF i el reenquadrament.`);
  }
  if (resultat.mitjans.bessonesAutonom) registre.log(`Autònom: ${resultat.mitjans.bessonesAutonom} originals substituïts per la seua bessona .webp, sense cap origen extern.`);
  if (resultat.restesDirectori.length) registre.log(`${resultat.restesDirectori.length} fitxer(s) de builds/directori/dist fora de l'inventari (restes velles): no s'han empaquetat.`);
  for (const avis of resultat.avisos) registre.log(`AVÍS: ${avis}`);
  registre.log('Publica primer els zips i després el canal (stable.json i la .sig).');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    process.exitCode = executa(process.argv.slice(2));
  } catch (error) {
    console.error(`[empaqueta] ${error.message}`);
    process.exitCode = 1;
  }
}


/** El rebuig identifica només el fitxer, mai la credencial. */
export function comprovaSecretsDeepL(entrades) {
  for (const {nom, dades} of entrades) {
    // Inclou formats textuals nous i seqüències ASCII dins d'entrades binàries.
    if (findDeepLSecrets(dades.toString('latin1')).length)
      throw new Error(`Possible clau DeepL al paquet: ${nom}`);
  }
}
