#!/usr/bin/env node
/**
 * scripts/botigues/puja-wordpress-svn.mjs — Publica el paquet --directori del connector a WordPress.org
 * (SVN: trunk/ i tags/<versio>/) amb Docker. Onada v1.2.16 (prompt 261121_0216, T3.3; ordres del
 * Mestre 261121 01:32 i 01:55: tota actualització viatja per les 4 botigues oficials, i WordPress.org
 * és la de gentdelatorre.net i de qualsevol WordPress). Proves: tests/botigues-wordpress-svn.v1216.test.mjs.
 *
 *   node scripts/botigues/puja-wordpress-svn.mjs --zip RUTA.zip --versio 1.1.24            en sec (per defecte)
 *   node scripts/botigues/puja-wordpress-svn.mjs --zip RUTA.zip --versio 1.1.24 --publica --confirma=1.1.24@<sha12>
 *   node scripts/botigues/puja-wordpress-svn.mjs --comprova-api                             només l'API pública (GET)
 *
 * El paquet és el zip de la variant del directori: wordpress-plugin/eines/empaqueta.mjs --directori
 * deixa wordpress-plugin/builds/directori/socdepoble.zip, i l'operador en fa la còpia datada
 * _builds_de_poble/wordpress/AAMMDD_HHMM_wordpress_directori_vX.Y.Z.zip amb el seu .sha256 (el pas del
 * pla de publica-tot.mjs ho fa). Una sola carpeta socdepoble/ a l'arrel. Abans de cap contenidor, en local i sense xarxa:
 *   · el zip és un fitxer regular (no un enllaç) de menys de 10 MiB, i si porta un .sha256 al costat,
 *     casa amb ell;
 *   · el zip s'entén sencer (directori central, sense zip64 ni xifratge, només guardat o deflate, CRC32
 *     bo, cap enllaç simbòlic, cap ruta absoluta, «..», «\», .svn, __MACOSX ni .DS_Store, cap nom repetit
 *     ni que només canvie de majúscules o de normalització Unicode, cap nom que siga alhora fitxer i
 *     carpeta, i tot dins de socdepoble/);
 *   · cap ruta de dins de socdepoble/ que refuse la política d'higiene compartida (IDEA-62,
 *     tooling/lib/higiene-paquets.mjs, la mateixa que aplica empaqueta.mjs, amb { wordpress: true }):
 *     .git, .svn, .DS_Store, __MACOSX ni .env(.*); node_modules, coverage, fixtures, __tests__ ni
 *     __fixtures__; proves de JavaScript o TypeScript (.test.js/.ts i .spec.js/.ts, també cjs, mjs, jsx i tsx) ni .map, .sql, .log, .bak, .orig o .rej; ni els actius de
 *     la vitrina de WordPress.org a assets/ de l'arrel (banner, screenshot, icon), que van a assets/ de
 *     l'SVN i no a trunk/. El zip de --zip pot no eixir d'empaqueta, i l'SVN públic no oblida res;
 *   · «Stable tag:» de socdepoble/readme.txt i «Version:» del fitxer principal (l'únic PHP de l'arrel amb
 *     «Plugin Name:») són --versio, i el fitxer principal no porta «Update URI:» (és la variant enxufe,
 *     no la del directori).
 * Després, un contenidor efímer (docker run --rm, imatge IMATGE_PER_DEFECTE o --imatge, amb
 * «apk add subversion») fa el checkout anònim de trunk/ i de la llista de tags/ en una carpeta temporal
 * de fora del repositori, i el script compara fitxer a fitxer: què s'afegix, què canvia i què s'esborra a
 * trunk/, i si tags/<versio>/ és nou, ja hi és idèntic o hi és amb un altre contingut (llavors para).
 * També para si trunk/ o algun tag ja publica una versió més nova, i si repo/, trunk/, tags/ o un tag de
 * la còpia és un enllaç simbòlic o hi porta cap enllaç (carpetaDeLaCopia, llistaArbre: res no es llig,
 * s'escriu ni s'esborra fora de la carpeta temporal). En sec (per defecte) ho diu i acaba:
 * no llig la contrasenya ni escriu res a WordPress.org. Amb --publica i el «sí» lligat al zip
 * (--confirma=VERSIO@<12 primers del sha256 del zip>, el que dona el sec), un segon contenidor efímer
 * aplica els canvis, fa «svn copy trunk tags/<versio>» i UN sol commit (trunk i tag junts), com fa
 * l'acció de desplegament de 10up. Després pregunta a l'API pública (només GET) quina versió dona.
 *
 * La contrasenya (seguretat innegociable):
 *   · viu a ~/claus-socdepoble/wp-svn.pass (FITXER_CONTRASENYA): ha de ser un fitxer regular de l'usuari
 *     (mai un enllaç), en mode 0600 o 0400, d'una sola línia; en sec només se'n mira la fitxa (mai el
 *     contingut);
 *   · es llig per un descriptor obert sense seguir enllaços i viatja al contenidor NOMÉS per stdin
 *     (docker run -i): mai a argv, a cap variable d'entorn (ni del CLI de docker ni del contenidor, i
 *     per tant mai a «docker inspect») ni a cap fitxer del disc del Mac;
 *   · dins del contenidor va a un tmpfs 0700 (memòria, s'esborra amb el contenidor) i svn la llig amb
 *     --password-from-stdin; svn corre amb --non-interactive --no-auth-cache, una --config-dir al tmpfs
 *     i store-passwords/store-auth-creds a no: cap credencial es desa, i el contenidor s'esborra (--rm);
 *   · tota l'eixida de docker i de svn es filtra línia a línia: la contrasenya (i les seues formes en
 *     Basic i en URL) es canvia per <contrasenya>, i la carpeta de l'usuari per ~.
 * Per què alpine i no una imatge de subversion: no hi ha cap imatge oficial (Docker Official Images) de
 * subversion; alpine sí que ho és, i apk verifica la signatura dels paquets que instal·la. Per a fixar-la
 * per digest: docker pull alpine:3.22 && docker image inspect --format '{{index .RepoDigests 0}}' alpine:3.22,
 * i --imatge alpine:3.22@sha256:<digest> (només s'admet una imatge alpine, amb etiqueta i/o digest).
 * Requisit de Docker Desktop: la carpeta temporal (os.tmpdir(), /private/var/folders/…) ha de ser
 * compartida amb els contenidors (ho és per defecte).
 * Només mòduls de Node, entorn.mjs i tooling/lib/higiene-paquets.mjs: cap dependència.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { pathToFileURL } from 'node:url';
import { EIXIDA, VERSIO, analitzaArguments, comparaVersions, esDins, plega } from './entorn.mjs';
import { comprovaHigienePaquet } from '../../tooling/lib/higiene-paquets.mjs';

export const SLUG = 'socdepoble';
export const REPOSITORI_SVN = 'https://plugins.svn.wordpress.org/socdepoble';
export const USUARI_SVN = 'socdepoble';
export const API_WORDPRESS = 'https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=socdepoble';
export const DOCKER_PER_DEFECTE = '/usr/local/bin/docker';
export const IMATGE_PER_DEFECTE = 'alpine:3.22';
export const FITXER_CONTRASENYA = path.join(os.homedir(), 'claus-socdepoble', 'wp-svn.pass');
/** El sostre del paquet: 10 MiB (el límit del directori de WordPress.org i de l'Acta 261121_0134). */
export const MIDA_MAXIMA_ZIP = 10 * 1024 * 1024;
export const MARCA_CONTRASENYA = '<contrasenya>';

const MIDA_MAXIMA_DESCOMPRIMIT = 128 * 1024 * 1024;
const MAX_ENTRADES = 5000;
const MIDA_MAXIMA_CONTRASENYA = 4096;
const MIDA_MAXIMA_API = 4 * 1024 * 1024;
const IMATGE = /^(?:docker\.io\/library\/)?alpine(?::\d+(?:\.\d+){0,2})?(?:@sha256:[0-9a-f]{64})?$/;
const CARPETA_SEGURA = /^\/[\w./-]+$/;
const SENSE_ENLLAC = (fs.constants.O_NOFOLLOW ?? 0) | (fs.constants.O_NONBLOCK ?? 0);
const ADMESOS = Object.freeze({
  zip: true, versio: true, sec: false, publica: false, confirma: true, imatge: true, 'comprova-api': false, ajuda: false
});
const US = 'Ús: --zip RUTA.zip --versio X.Y.Z [--sec | --publica --confirma=X.Y.Z@<sha12>] [--imatge alpine:3.22@sha256:<digest>] · o --comprova-api';

/** Un problema del paquet, de la contrasenya o de l'arbre SVN, amb el codi d'eixida (EIXIDA). */
export class ErrorWp extends Error {
  constructor(missatge, codi = EIXIDA.ARBRE) {
    super(missatge);
    this.name = 'ErrorWp';
    this.codi = codi;
  }
}

/* ───────────────────────────── El zip ───────────────────────────── */

const ZIP = Object.freeze({ FINAL: 0x06054b50, CENTRAL: 0x02014b50, LOCAL: 0x04034b50 });
const CARACTERS_DOLENTS = /[\p{Cc}\\:*?"<>|]/u;

/** Per què `nom` (una entrada del zip) no es pot publicar, o null. Pura. */
export function problemaDelNom(nom) {
  if (typeof nom !== 'string' || !nom) return 'una entrada sense nom';
  if (CARACTERS_DOLENTS.test(nom)) return `${JSON.stringify(nom)} porta caràcters de control o reservats`;
  if (nom.startsWith('/')) return `${JSON.stringify(nom)} és una ruta absoluta`;
  const peces = nom.replace(/\/$/, '').split('/');
  if (peces[0] !== SLUG) return `${JSON.stringify(nom)} no és dins de ${SLUG}/`;
  for (const peca of peces) {
    if (!peca || peca === '.' || peca === '..') return `${JSON.stringify(nom)} porta una peça buida, «.» o «..»`;
    if (peca === '.svn' || peca === '__MACOSX' || peca === '.DS_Store') return `${JSON.stringify(nom)} porta ${peca}, que no va mai a WordPress.org`;
  }
  return null;
}

/* La clau amb què el Mac compara dos noms: sense majúscules i en NFC (APFS no distingix ni la caixa ni la
   normalització Unicode, i dos noms que hi xoquen es trepitjarien a la còpia de treball). */
const clauDelNom = (nom) => String(nom).normalize('NFC').toLowerCase();

/**
 * Les entrades d'un zip (octets), sencer i verificat: [{ nom, dades }] dels fitxers (les carpetes no hi
 * són). Llança ErrorWp (eixida 7, o 9 si el CRC32 o les mides no casen) amb el primer problema. Pura.
 * Gauntlet v1.2.16 · Dos noms que només canvien de caixa o de normalització Unicode, o un nom que és
 * alhora fitxer i carpeta (socdepoble/x i socdepoble/x/y), paren ací: abans, xocaven a la còpia de
 * treball DESPRÉS de llegir la contrasenya.
 */
export function llegixZip(octets) {
  const zip = Buffer.from(octets);
  let final = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 0xffff); i -= 1) {
    if (zip.readUInt32LE(i) === ZIP.FINAL) { final = i; break; }
  }
  if (final < 0) throw new ErrorWp('el fitxer no és un zip (no té directori central)');
  if (zip.readUInt16LE(final + 4) !== 0 || zip.readUInt16LE(final + 6) !== 0) throw new ErrorWp('un zip de diversos discos no s\'admet');
  const total = zip.readUInt16LE(final + 10);
  const inici = zip.readUInt32LE(final + 16);
  if (total === 0xffff || inici === 0xffffffff) throw new ErrorWp('un zip64 no s\'admet (un paquet de 10 MiB no el necessita)');
  if (total > MAX_ENTRADES) throw new ErrorWp(`el zip porta ${total} entrades (com a molt ${MAX_ENTRADES})`);
  const entrades = [];
  const vistos = new Map();
  const carpetes = new Set();
  const ambCarpetes = (nom) => {
    const peces = clauDelNom(nom).replace(/\/$/, '').split('/');
    for (let k = 1; k < peces.length; k += 1) carpetes.add(peces.slice(0, k).join('/'));
  };
  let descomprimit = 0;
  let i = inici;
  for (let n = 0; n < total; n += 1) {
    if (i + 46 > zip.length || zip.readUInt32LE(i) !== ZIP.CENTRAL) throw new ErrorWp('el directori central del zip està trencat');
    const bandera = zip.readUInt16LE(i + 8);
    const metode = zip.readUInt16LE(i + 10);
    const crc = zip.readUInt32LE(i + 16);
    const comprimit = zip.readUInt32LE(i + 20);
    const mida = zip.readUInt32LE(i + 24);
    const llargNom = zip.readUInt16LE(i + 28);
    const llargExtra = zip.readUInt16LE(i + 30);
    const llargComentari = zip.readUInt16LE(i + 32);
    const atributs = zip.readUInt32LE(i + 38);
    const local = zip.readUInt32LE(i + 42);
    const cru = zip.subarray(i + 46, i + 46 + llargNom);
    if (!(bandera & 0x800) && cru.some((octet) => octet > 0x7f)) throw new ErrorWp('un nom del zip no és UTF-8 declarat');
    const nom = cru.toString('utf8');
    i += 46 + llargNom + llargExtra + llargComentari;
    const problema = problemaDelNom(nom);
    if (problema) throw new ErrorWp(`entrada del zip: ${problema}`);
    if ((bandera & 0x1) !== 0) throw new ErrorWp(`${nom}: una entrada xifrada no s'admet`);
    const tipus = (atributs >>> 16) & 0o170000;
    if (tipus === 0o120000) throw new ErrorWp(`${nom}: un enllaç simbòlic no s'admet`);
    if (nom.endsWith('/')) { ambCarpetes(`${nom}x`); continue; }
    if (tipus !== 0 && tipus !== 0o100000) throw new ErrorWp(`${nom}: no és un fitxer regular`);
    const clau = clauDelNom(nom);
    if (vistos.has(clau)) throw new ErrorWp(`${nom}: repetit (o igual a ${vistos.get(clau)} llevat de les majúscules o de la normalització Unicode)`);
    vistos.set(clau, nom);
    ambCarpetes(nom);
    if (comprimit === 0xffffffff || mida === 0xffffffff) throw new ErrorWp(`${nom}: zip64 no s'admet`);
    descomprimit += mida;
    if (descomprimit > MIDA_MAXIMA_DESCOMPRIMIT) throw new ErrorWp(`el zip descomprimit passa de ${MIDA_MAXIMA_DESCOMPRIMIT} octets`);
    if (local + 30 > zip.length || zip.readUInt32LE(local) !== ZIP.LOCAL) throw new ErrorWp(`${nom}: la capçalera local del zip està trencada`);
    const dadesInici = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    if (dadesInici + comprimit > zip.length) throw new ErrorWp(`${nom}: les dades passen del final del zip`);
    const tros = zip.subarray(dadesInici, dadesInici + comprimit);
    let dades;
    if (metode === 0) dades = Buffer.from(tros);
    else if (metode === 8) {
      try { dades = zlib.inflateRawSync(tros, { maxOutputLength: Math.max(1, mida) }); } catch { throw new ErrorWp(`${nom}: el deflate no s'entén o passa de la mida declarada`, EIXIDA.VERIFICACIO); }
    } else throw new ErrorWp(`${nom}: mètode de compressió ${metode} (només guardat o deflate)`);
    if (dades.length !== mida) throw new ErrorWp(`${nom}: la mida no és la declarada`, EIXIDA.VERIFICACIO);
    if ((zlib.crc32(dades) >>> 0) !== crc) throw new ErrorWp(`${nom}: el CRC32 no casa`, EIXIDA.VERIFICACIO);
    entrades.push({ nom, dades });
  }
  for (const [clau, nom] of vistos) {
    if (carpetes.has(clau)) throw new ErrorWp(`${nom}: és alhora un fitxer i una carpeta del zip (o només en canvia la caixa o la normalització Unicode)`);
  }
  return entrades;
}

/* Un camp de capçalera de WordPress («Nom: valor»), al començament d'una línia o darrere de « * ». */
const campDe = (text, camp) => new RegExp(`^[ \\t/*#@]*${camp}:[ \\t]*(\\S[^\\r\\n]*?)[ \\t]*$`, 'mi').exec(String(text))?.[1] ?? null;

/**
 * El paquet del directori: { fitxers: Map<ruta dins de trunk, octets>, principal, stableTag, versioPhp }.
 * Llança ErrorWp si no és un connector publicable amb esta `versio`. Pura.
 * Gauntlet v1.2.16 R2 (L4R2-01) · Les rutes de trunk/ passen la política IDEA-62 compartida amb
 * empaqueta.mjs ({ wordpress: true }, relatives a socdepoble/ perquè la regla de la vitrina mira assets/
 * de l'arrel del connector): un .env, un .git, un .map o un .sql paren ací, a la fase 1, abans de cap
 * contenidor i de cap lectura de la contrasenya.
 */
export function analitzaPaquet(entrades, versio) {
  if (!VERSIO.test(String(versio ?? ''))) throw new ErrorWp('--versio ha de ser X.Y.Z', EIXIDA.US);
  const fitxers = new Map(entrades.map(({ nom, dades }) => [nom.slice(SLUG.length + 1), dades]));
  if (!fitxers.size) throw new ErrorWp(`el zip no porta cap fitxer dins de ${SLUG}/`);
  try { comprovaHigienePaquet([...fitxers.keys()], { wordpress: true }); } catch (error) {
    throw new ErrorWp(`dins de ${SLUG}/, ${error.message}`, EIXIDA.ARBRE);
  }
  const readme = fitxers.get('readme.txt');
  if (!readme) throw new ErrorWp(`el zip no porta ${SLUG}/readme.txt`);
  const principals = [...fitxers].filter(([ruta, dades]) => /^[^/]+\.php$/.test(ruta) && /Plugin Name:/i.test(dades.subarray(0, 8192).toString('utf8')));
  if (principals.length !== 1) throw new ErrorWp(`el zip ha de portar un sol fitxer principal (un PHP de ${SLUG}/ amb «Plugin Name:»): en porta ${principals.length}`);
  const [principal, dadesPrincipal] = principals[0];
  const capcalera = dadesPrincipal.subarray(0, 8192).toString('utf8');
  const stableTag = campDe(readme.toString('utf8'), 'Stable tag');
  const versioPhp = campDe(capcalera, 'Version');
  if (campDe(capcalera, 'Update URI')) throw new ErrorWp(`${SLUG}/${principal} porta «Update URI:»: és la variant enxufe; a WordPress.org va la del directori (empaqueta.mjs --directori)`);
  if (stableTag !== versio) throw new ErrorWp(`${SLUG}/readme.txt diu «Stable tag: ${stableTag ?? 'cap'}», no ${versio}`);
  if (versioPhp !== versio) throw new ErrorWp(`${SLUG}/${principal} diu «Version: ${versioPhp ?? 'cap'}», no ${versio}`);
  return { fitxers, principal, stableTag, versioPhp };
}

/** sha256 en hexadecimal. */
const sha256 = (dades) => crypto.createHash('sha256').update(dades).digest('hex');

/**
 * Llig i verifica el zip de `cami` per a `versio`: { cami, mida, sha256, fitxers, principal }. Llança ErrorWp.
 * Un enllaç, un fitxer que no és regular o de MIDA_MAXIMA_ZIP o més no es llig; un .sha256 al costat ha de casar.
 */
export function llegixPaquet(cami, versio) {
  let fitxa;
  try { fitxa = fs.lstatSync(cami); } catch { throw new ErrorWp(`no es pot llegir el zip ${path.basename(String(cami))}`); }
  if (fitxa.isSymbolicLink() || !fitxa.isFile()) throw new ErrorWp(`${path.basename(cami)} no és un fitxer regular (un enllaç no val)`);
  if (fitxa.size >= MIDA_MAXIMA_ZIP) throw new ErrorWp(`${path.basename(cami)} fa ${fitxa.size} octets: ha de fer menys de 10 MiB (${MIDA_MAXIMA_ZIP}), el sostre del paquet de WordPress.org`);
  let octets;
  const fd = fs.openSync(cami, fs.constants.O_RDONLY | SENSE_ENLLAC);
  try {
    const ara = fs.fstatSync(fd);
    if (!ara.isFile() || ara.size >= MIDA_MAXIMA_ZIP) throw new ErrorWp(`${path.basename(cami)} ha canviat mentre es llegia`);
    octets = fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
  const suma = sha256(octets);
  let declarada = null;
  try { declarada = fs.readFileSync(`${cami}.sha256`, 'utf8').trim().split(/\s+/)[0].toLowerCase(); } catch { /* sense .sha256 */ }
  if (declarada !== null && declarada !== suma) throw new ErrorWp(`${path.basename(cami)} no casa amb el seu .sha256: no és el paquet que va eixir d'empaqueta.mjs`, EIXIDA.VERIFICACIO);
  const paquet = analitzaPaquet(llegixZip(octets), versio);
  return { cami, mida: octets.length, sha256: suma, ambSha256: declarada !== null, ...paquet };
}

/** El «sí» que necessita --publica per a este zip: VERSIO@<12 primers del sha256>. */
export const confirmacioDelZip = (versio, suma) => `${versio}@${String(suma).slice(0, 12)}`;

/* ───────────────────────────── La contrasenya ───────────────────────────── */

/* Per què la fitxa `fitxa` (lstat o fstat) no val per a la contrasenya, o null. */
function problemaDeLaFitxa(fitxa) {
  if (fitxa.isSymbolicLink()) return 'és un enllaç simbòlic: ha de ser el fitxer mateix';
  if (!fitxa.isFile()) return 'no és un fitxer regular';
  if (typeof process.getuid === 'function' && fitxa.uid !== process.getuid()) return 'no és de l\'usuari que executa el script';
  const mode = fitxa.mode & 0o777;
  if (mode !== 0o600 && mode !== 0o400) return `té permisos ${mode.toString(8)}: fes chmod 600 (o 400)`;
  if (fitxa.size === 0) return 'és buit';
  if (fitxa.size > MIDA_MAXIMA_CONTRASENYA) return 'és massa gran per a ser una contrasenya';
  return null;
}

/** Comprova la fitxa del fitxer de la contrasenya SENSE llegir-ne el contingut. Llança ErrorWp (eixida 3). */
export function comprovaFitxerContrasenya(cami = FITXER_CONTRASENYA) {
  let fitxa;
  try { fitxa = fs.lstatSync(cami); } catch { throw new ErrorWp(`no hi ha el fitxer de la contrasenya de WordPress.org (${mostraCasa(cami)})`, EIXIDA.FITXER); }
  const problema = problemaDeLaFitxa(fitxa);
  if (problema) throw new ErrorWp(`${mostraCasa(cami)} ${problema}`, EIXIDA.FITXER);
  return { mode: (fitxa.mode & 0o777).toString(8) };
}

/**
 * La contrasenya, llegida per un descriptor obert sense seguir enllaços i comprovada sobre el mateix
 * descriptor (cap carrera entre la comprovació i la lectura). Una sola línia. Llança ErrorWp (eixida 3);
 * cap missatge porta cap tros del contingut.
 */
export function llegixContrasenya(cami = FITXER_CONTRASENYA) {
  comprovaFitxerContrasenya(cami);
  let fd;
  try { fd = fs.openSync(cami, fs.constants.O_RDONLY | SENSE_ENLLAC); } catch { throw new ErrorWp(`no es pot obrir ${mostraCasa(cami)}`, EIXIDA.FITXER); }
  try {
    const problema = problemaDeLaFitxa(fs.fstatSync(fd));
    if (problema) throw new ErrorWp(`${mostraCasa(cami)} ${problema}`, EIXIDA.FITXER);
    const text = fs.readFileSync(fd, 'utf8').replace(/\r?\n$/, '');
    if (!text || /[\r\n\0]/.test(text)) throw new ErrorWp(`${mostraCasa(cami)} ha de portar la contrasenya en una sola línia`, EIXIDA.FITXER);
    return text;
  } finally { fs.closeSync(fd); }
}

/** Les formes de la contrasenya que s'han de tapar a l'eixida: tal qual, en Basic (usuari:contrasenya) i en URL. */
export function formesDeLaContrasenya(contrasenya, usuari = USUARI_SVN) {
  if (!contrasenya) return [];
  const formes = [contrasenya, Buffer.from(`${usuari}:${contrasenya}`).toString('base64'), encodeURIComponent(contrasenya)];
  return [...new Set(formes.filter((forma) => forma.length >= 1))].sort((a, b) => b.length - a.length);
}

/** `text` sense cap de les `formes` (canviades per <contrasenya>) i amb la carpeta de l'usuari com a ~. Pura. */
export function filtraEixida(text, formes = []) {
  let net = String(text);
  for (const forma of formes) net = net.split(forma).join(MARCA_CONTRASENYA);
  const casa = os.homedir();
  return casa.length > 1 ? net.split(casa).join('~') : net;
}

/** Un camí amb la carpeta de l'usuari com a ~. */
function mostraCasa(cami) {
  const casa = os.homedir();
  return esDins(casa, cami) ? `~/${path.relative(casa, cami)}` : String(cami);
}

/* ───────────────────────────── Docker i svn ───────────────────────────── */

const SVN_SH = 'S() { svn --non-interactive --no-auth-cache --config-dir /sdp/tmp/svn --config-option servers:global:store-passwords=no --config-option servers:global:store-auth-creds=no "$@"; }';

/* El contenidor de lectura: checkout anònim de l'arrel (immediates), trunk sencer, la llista de tags i,
   si ja existix, el tag d'esta versió sencer. $1 = repositori, $2 = versió. */
export const SCRIPT_CONSULTA = [
  'set -eu',
  'apk add --no-cache --quiet subversion >/dev/null',
  'mkdir -p /sdp/tmp/home /sdp/tmp/svn',
  SVN_SH,
  'S checkout --quiet --depth immediates "$1" /sdp/wc/repo',
  'S update --quiet --set-depth infinity /sdp/wc/repo/trunk',
  'S update --quiet --set-depth immediates /sdp/wc/repo/tags',
  'if [ -d "/sdp/wc/repo/tags/$2" ]; then S update --quiet --set-depth infinity "/sdp/wc/repo/tags/$2"; fi',
  'echo "revisió de WordPress.org: $(S info --show-item revision /sdp/wc/repo)"'
].join('\n');

/* El contenidor del commit. La contrasenya arriba per stdin i va de seguida al tmpfs 0700; svn la llig
   amb --password-from-stdin. Els fitxers ja són a trunk/ (els ha posat el script); ací només rm, add,
   copy del tag (si és nou) i UN commit. $1 = versió, $2 = usuari, $3 = missatge, $4 = nou|existent. */
export const SCRIPT_PUBLICA = [
  'set -eu',
  'umask 077',
  'cat > /sdp/tmp/clau',
  'trap \'rm -f /sdp/tmp/clau\' EXIT',
  'apk add --no-cache --quiet subversion >/dev/null',
  'mkdir -p /sdp/tmp/home /sdp/tmp/svn',
  SVN_SH,
  'cd /sdp/wc/repo',
  'while IFS= read -r f; do if [ -n "$f" ]; then S rm --quiet --force -- "trunk/$f@"; fi; done < /sdp/wc/elimina.txt',
  'while IFS= read -r f; do if [ -n "$f" ]; then S add --quiet --parents --no-ignore -- "trunk/$f@"; fi; done < /sdp/wc/afig.txt',
  'if [ "$4" = nou ]; then S copy --quiet trunk "tags/$1"; fi',
  'S status',
  'S commit --username "$2" --password-from-stdin -m "$3" < /sdp/tmp/clau'
].join('\n');

/**
 * Els arguments de «docker run» d'un contenidor efímer. Cap secret: la contrasenya mai hi va (ni com a
 * -e); amb `ambEntrada`, -i perquè arribe per stdin. La carpeta de treball s'hi munta a /sdp/wc. Pura.
 */
export function argumentsDocker({ imatge = IMATGE_PER_DEFECTE, treball, script, posicionals = [], ambEntrada = false }) {
  if (!IMATGE.test(String(imatge))) throw new ErrorWp(`--imatge ha de ser una imatge alpine (amb etiqueta i/o @sha256:<digest>), no ${JSON.stringify(String(imatge).slice(0, 80))}`, EIXIDA.US);
  if (!CARPETA_SEGURA.test(String(treball))) throw new ErrorWp('la carpeta de treball té caràcters que docker -v no admet', EIXIDA.EINA);
  return ['run', '--rm', ...(ambEntrada ? ['-i'] : []), '--security-opt', 'no-new-privileges',
    '--tmpfs', '/sdp/tmp:rw,nosuid,nodev,size=16m,mode=0700', '-v', `${treball}:/sdp/wc:rw`,
    '-e', 'HOME=/sdp/tmp/home', '-e', 'LANG=C.UTF-8', '-w', '/sdp', imatge, '/bin/sh', '-euc', script, 'sdp-svn', ...posicionals];
}

/* Un argument tal com es copiaria a una terminal (entre cometes simples si cal). Pura. */
const citaShell = (a) => (/^[\w@%+=:,./-]+$/.test(String(a)) ? String(a) : `'${String(a).replace(/'/g, '\'\\\'\'')}'`);

/**
 * Executa docker sense shell. L'entrada (la contrasenya, si n'hi ha) va NOMÉS per stdin. Tota l'eixida
 * es filtra (filtraEixida) abans d'escriure-la o de tornar-la. Torna { codi, eixida } (el text ja net).
 * Gauntlet v1.2.16 · Cada flux es descodifica amb un StringDecoder: una lletra de diversos octets que
 * cau entre dos trossos ja no trenca la contrasenya en dos U+FFFD que el filtre no reconeixeria.
 */
export function executaDocker({ docker, args, entrada = null, formes = [], registra = (linia) => process.stdout.write(`${linia}\n`) }) {
  /* L'ordre es mostra sencera (no porta cap secret), amb el script del contenidor pel seu nom. */
  const noms = new Map([[SCRIPT_CONSULTA, '<SCRIPT_CONSULTA>'], [SCRIPT_PUBLICA, '<SCRIPT_PUBLICA>']]);
  const cita = (a) => noms.get(a) ?? citaShell(a);
  registra(`$ ${filtraEixida(['docker', ...args.map(cita)].join(' '), formes)}`);
  return new Promise((resol) => {
    let fill;
    try {
      fill = spawn(docker, args, { shell: false, stdio: [entrada === null ? 'ignore' : 'pipe', 'pipe', 'pipe'], env: { ...process.env } });
    } catch {
      resol({ codi: 127, eixida: '' });
      return;
    }
    const vistes = [];
    const filtre = () => {
      let pendent = '';
      const decodificador = new StringDecoder('utf8');
      const escriu = (linia) => {
        const neta = filtraEixida(linia, formes);
        vistes.push(neta);
        registra(`  │ ${neta}`);
      };
      return {
        dades: (tros) => {
          pendent += decodificador.write(tros);
          const linies = pendent.split('\n');
          pendent = linies.pop();
          for (const linia of linies) escriu(linia);
        },
        final: () => { pendent += decodificador.end(); if (pendent) escriu(pendent); pendent = ''; }
      };
    };
    const eix = filtre();
    const err = filtre();
    let acabat = false;
    const acaba = (codi) => { if (!acabat) { acabat = true; resol({ codi, eixida: vistes.join('\n') }); } };
    fill.stdout.on('data', eix.dades);
    fill.stderr.on('data', err.dades);
    fill.on('error', () => acaba(127));
    fill.on('close', (codi) => { eix.final(); err.final(); acaba(codi ?? 1); });
    if (entrada !== null) {
      fill.stdin.on('error', () => { /* el contenidor ha acabat abans de llegir-la */ });
      fill.stdin.end(`${entrada}\n`);
    }
  });
}

/* ───────────────────────────── L'arbre SVN ───────────────────────────── */

/**
 * Els fitxers (ruta → sha256) i les carpetes d'un arbre de la còpia de treball, sense .svn. Un enllaç o
 * qualsevol cosa que no siga fitxer o carpeta para (ErrorWp, eixida 7). Una carpeta que no hi és: buit.
 */
export function llistaArbre(arrel) {
  const fitxers = new Map();
  const carpetes = new Set();
  if (!fs.existsSync(arrel)) return { fitxers, carpetes };
  const visita = (dir, prefix) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entrada.name === '.svn') continue;
      const ruta = prefix ? `${prefix}/${entrada.name}` : entrada.name;
      const cami = path.join(dir, entrada.name);
      const fitxa = fs.lstatSync(cami);
      if (fitxa.isSymbolicLink()) throw new ErrorWp(`l'arbre SVN porta un enllaç simbòlic (${ruta}): revisa-ho a mà`);
      if (fitxa.isDirectory()) { carpetes.add(ruta); visita(cami, ruta); } else if (fitxa.isFile()) fitxers.set(ruta, sha256(fs.readFileSync(cami)));
      else throw new ErrorWp(`l'arbre SVN porta ${ruta}, que no és ni fitxer ni carpeta`);
    }
  };
  visita(arrel, '');
  return { fitxers, carpetes };
}

/* Les carpetes que necessiten les rutes de `fitxers`. */
const carpetesDe = (fitxers) => new Set([...fitxers].flatMap((ruta) => ruta.split('/').slice(0, -1).map((_, i, peces) => peces.slice(0, i + 1).join('/'))));

/**
 * El que canvia de l'arbre `abans` ({ fitxers: Map ruta → sha256, carpetes }) al paquet `paquet` (Map ruta →
 * octets): { afegits, modificats, eliminats } ordenats; eliminats és el conjunt mínim (una carpeta que se'n
 * va s'emporta el que porta dins). Un canvi de tipus (fitxer ↔ carpeta) para. Pura.
 */
export function comparaArbres(abans, paquet) {
  const sumes = new Map([...paquet].map(([ruta, dades]) => [ruta, sha256(dades)]));
  const carpetesNoves = carpetesDe(sumes.keys());
  for (const ruta of sumes.keys()) if (abans.carpetes.has(ruta)) throw new ErrorWp(`trunk/${ruta} és una carpeta i el paquet en fa un fitxer: fes-ho a mà`);
  for (const ruta of carpetesNoves) if (abans.fitxers.has(ruta)) throw new ErrorWp(`trunk/${ruta} és un fitxer i el paquet en fa una carpeta: fes-ho a mà`);
  /* El Mac no distingix majúscules ni la normalització Unicode: un canvi només de majúscules (Readme.txt →
     readme.txt) o de NFD a NFC xocaria a la còpia de treball. */
  const perMinuscules = new Map([...abans.fitxers.keys(), ...abans.carpetes].map((ruta) => [clauDelNom(ruta), ruta]));
  for (const ruta of [...sumes.keys(), ...carpetesNoves]) {
    const vella = perMinuscules.get(clauDelNom(ruta));
    if (vella !== undefined && vella !== ruta) throw new ErrorWp(`trunk/${vella} i el paquet (${ruta}) només canvien de majúscules (o de normalització Unicode): fes-ho a mà`);
  }
  const afegits = [...sumes.keys()].filter((ruta) => !abans.fitxers.has(ruta)).sort();
  const modificats = [...sumes.keys()].filter((ruta) => abans.fitxers.has(ruta) && abans.fitxers.get(ruta) !== sumes.get(ruta)).sort();
  const sobren = new Set([...[...abans.fitxers.keys()].filter((ruta) => !sumes.has(ruta)), ...[...abans.carpetes].filter((ruta) => !carpetesNoves.has(ruta))]);
  const pare = (ruta) => ruta.split('/').slice(0, -1).join('/');
  const eliminats = [...sobren].filter((ruta) => !pare(ruta) || !sobren.has(pare(ruta))).sort();
  return { afegits, modificats, eliminats };
}

/** Cert si l'arbre `arbre` és exactament el paquet. Pura. */
export function esIgual(arbre, paquet) {
  const { afegits, modificats, eliminats } = comparaArbres(arbre, paquet);
  return !afegits.length && !modificats.length && !eliminats.length;
}

/**
 * Gauntlet v1.2.16 · Cert si `cami` (repo/, trunk/, tags/ o tags/<versio>/ de la còpia de treball) és una
 * carpeta de veres dins de `treball`, fals si no hi és. Un enllaç simbòlic (un svn:special a l'arrel del
 * repositori), una carpeta que no ho és o una ruta real que ix de `treball` paren (ErrorWp, eixida 7):
 * llistaArbre i aplicaATrunk la seguirien i llegirien, escriurien i ESBORRARIEN fora de la còpia.
 */
export function carpetaDeLaCopia(cami, treball, nom = path.basename(cami)) {
  let fitxa;
  try { fitxa = fs.lstatSync(cami); } catch { return false; }
  if (fitxa.isSymbolicLink() || !fitxa.isDirectory()) throw new ErrorWp(`${nom} de la còpia de treball no és una carpeta (un enllaç no val): revisa-ho a mà`);
  const real = fs.realpathSync(cami);
  if (real !== path.resolve(cami) || !esDins(treball, real)) throw new ErrorWp(`${nom} de la còpia de treball ix de la carpeta temporal: revisa-ho a mà`);
  return true;
}

/**
 * Llig la còpia de treball del contenidor de consulta (treball/repo): l'arbre de trunk, el Stable tag que
 * hi publica, els tags que hi ha i, si el d'esta versió hi és, el seu arbre. Llança ErrorWp. Cap carpeta
 * de la còpia pot ser un enllaç (carpetaDeLaCopia), tampoc un tag.
 */
export function llegixCopia(treball, versio) {
  const repo = path.join(treball, 'repo');
  if (!carpetaDeLaCopia(repo, treball, 'repo/') || !carpetaDeLaCopia(path.join(repo, 'trunk'), treball, 'trunk/')) {
    throw new ErrorWp('el checkout de WordPress.org no porta trunk/', EIXIDA.EXTERNA);
  }
  const trunk = llistaArbre(path.join(repo, 'trunk'));
  let stableTrunk = null;
  try { stableTrunk = campDe(fs.readFileSync(path.join(repo, 'trunk', 'readme.txt'), 'utf8'), 'Stable tag'); } catch { /* trunk sense readme */ }
  let tags = [];
  if (carpetaDeLaCopia(path.join(repo, 'tags'), treball, 'tags/')) {
    const entrades = fs.readdirSync(path.join(repo, 'tags'), { withFileTypes: true });
    const enllac = entrades.find((e) => e.isSymbolicLink());
    if (enllac) throw new ErrorWp(`tags/${enllac.name} de la còpia de treball és un enllaç simbòlic: revisa-ho a mà`);
    tags = entrades.filter((e) => e.isDirectory()).map((e) => e.name);
  }
  const tag = tags.includes(versio) && carpetaDeLaCopia(path.join(repo, 'tags', versio), treball, `tags/${versio}/`) ? llistaArbre(path.join(repo, 'tags', versio)) : null;
  return { repo, trunk, stableTrunk, tags, tag };
}

/** Per què publicar `versio` faria anar WordPress.org arrere, o null. Pura. */
export function problemaDeVersio(versio, { stableTrunk = null, tags = [] } = {}) {
  if (VERSIO.test(String(stableTrunk ?? '')) && comparaVersions(stableTrunk, versio) === 1) {
    return `trunk/readme.txt ja publica «Stable tag: ${stableTrunk}», més nova que ${versio}: no es torna arrere`;
  }
  const mesNou = tags.filter((t) => VERSIO.test(t) && comparaVersions(t, versio) === 1).sort((a, b) => comparaVersions(b, a))[0];
  return mesNou ? `ja hi ha tags/${mesNou}/, més nou que ${versio}: no es torna arrere` : null;
}

/* Escriu el paquet a trunk/ de la còpia (afegits i modificats) i n'esborra el que sobra. Cap ruta ix de
   trunk/: trunk/ ha de ser la seua ruta real (cap enllaç pel camí; llegixCopia ja ho ha comprovat i
   llistaArbre ha refusat qualsevol enllaç de dins). */
function aplicaATrunk(trunk, paquet, canvis) {
  if (fs.realpathSync(trunk) !== path.resolve(trunk)) throw new ErrorWp('trunk/ de la còpia de treball no és la seua ruta real: revisa-ho a mà');
  const dins = (ruta) => {
    const cami = path.resolve(trunk, ruta);
    if (!esDins(trunk, cami) || cami === trunk) throw new ErrorWp(`la ruta ${ruta} ix de trunk/`);
    return cami;
  };
  for (const ruta of canvis.eliminats) fs.rmSync(dins(ruta), { recursive: true, force: true });
  for (const ruta of [...canvis.afegits, ...canvis.modificats]) {
    const cami = dins(ruta);
    fs.mkdirSync(path.dirname(cami), { recursive: true });
    fs.writeFileSync(cami, paquet.get(ruta));
  }
}

/* ───────────────────────────── L'API pública ───────────────────────────── */

/**
 * La versió que dona l'API pública de WordPress.org per a l'slug, només amb GET. Mai llança:
 * { versio } o { error }. `fetch` és per a les proves.
 */
export async function consultaApi({ url = API_WORDPRESS, fetch: obte = globalThis.fetch, tempsMs = 15_000 } = {}) {
  try {
    const resposta = await obte(url, { method: 'GET', headers: { Accept: 'application/json', 'User-Agent': 'socdepoble-botigues/1.0 (Node.js)' }, signal: AbortSignal.timeout(tempsMs) });
    if (!resposta.ok) return { error: `HTTP ${resposta.status}` };
    const text = await resposta.text();
    if (text.length > MIDA_MAXIMA_API) return { error: 'la resposta és massa gran' };
    const versio = JSON.parse(text)?.version;
    return VERSIO.test(String(versio ?? '')) ? { versio: String(versio) } : { error: 'la resposta no porta cap versió X.Y.Z' };
  } catch (error) {
    return { error: error?.name === 'TimeoutError' ? `sense resposta en ${Math.round(tempsMs / 1000)} s` : 'no respon o no és JSON' };
  }
}

/* ───────────────────────────── L'ordre ───────────────────────────── */

const llista = (titol, rutes) => (rutes.length ? [`    ${titol} (${rutes.length}):`, ...rutes.map((ruta) => `      ${ruta}`)] : [`    ${titol}: cap`]);

/**
 * @param {string[]} argv
 * @param {{ docker?: string, contrasenya?: string, consultaApi?: Function, temporal?: string }} [dependencies]
 *   Només per a les proves: un docker fals, el fitxer de la contrasenya, l'API i la carpeta temporal.
 */
export async function main(argv, { docker = DOCKER_PER_DEFECTE, contrasenya = FITXER_CONTRASENYA, consultaApi: api = consultaApi, temporal = os.tmpdir() } = {}) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  const escriu = (text) => process.stdout.write(`${text}\n`);
  if (opcions.ajuda) { escriu(`node scripts/botigues/puja-wordpress-svn.mjs ${US.slice(4)}`); return EIXIDA.BE; }
  if (errors.length) return plega(EIXIDA.US, US, errors);
  if (opcions['comprova-api']) {
    if (Object.keys(opcions).length > 1) return plega(EIXIDA.US, '--comprova-api va sol');
    const r = await api();
    if (r.error) return plega(EIXIDA.EXTERNA, `l'API pública de WordPress.org no ha respost (${r.error})`);
    escriu(`WordPress.org (API pública, GET): ${SLUG} ${r.versio}`);
    return EIXIDA.BE;
  }
  const { zip, versio } = opcions;
  if (!zip || !VERSIO.test(String(versio ?? ''))) return plega(EIXIDA.US, US);
  if (opcions.sec && opcions.publica) return plega(EIXIDA.US, '--sec i --publica no van juntes');
  if (opcions.confirma !== undefined && !opcions.publica) return plega(EIXIDA.US, '--confirma només va amb --publica');
  if (opcions.publica && opcions.confirma === undefined) return plega(EIXIDA.US, '--publica necessita el «sí» del Mestre per a este zip: --confirma=VERSIO@<sha12> (el dona l\'execució en sec)');
  const imatge = opcions.imatge ?? IMATGE_PER_DEFECTE;
  if (!IMATGE.test(String(imatge))) return plega(EIXIDA.US, '--imatge ha de ser una imatge alpine (amb etiqueta i/o @sha256:<digest>)');

  // 1. El paquet, en local i sense xarxa.
  let paquet;
  try { paquet = llegixPaquet(path.resolve(String(zip)), versio); } catch (error) {
    return plega(error instanceof ErrorWp ? error.codi : EIXIDA.ARBRE, `El paquet no es pot publicar: ${error instanceof ErrorWp ? error.message : 'error inesperat'}`);
  }
  const esperada = confirmacioDelZip(versio, paquet.sha256);
  escriu(`Paquet ${path.basename(paquet.cami)}: ${paquet.mida} B (< ${MIDA_MAXIMA_ZIP}), sha256 ${paquet.sha256}${paquet.ambSha256 ? ' (casa amb el seu .sha256)' : ' (sense .sha256 al costat)'}`);
  escriu(`  ✓ ${paquet.fitxers.size} fitxers dins de ${SLUG}/; Stable tag ${paquet.stableTag} i Version ${paquet.versioPhp} (${paquet.principal}) = --versio ${versio}; cap Update URI`);
  if (opcions.publica && opcions.confirma !== esperada) {
    return plega(EIXIDA.CONFIRMACIO, `--confirma ha de ser exactament ${esperada}: el «sí» va lligat a ESTE zip (12 primers del seu sha256)`);
  }

  // 2. La contrasenya (en sec, només la fitxa) i docker.
  try {
    const { mode } = comprovaFitxerContrasenya(contrasenya);
    escriu(`  ✓ ${mostraCasa(contrasenya)}: fitxer regular de l'usuari, mode ${mode} (no se'n llig res${opcions.publica ? ' fins al commit' : ''})`);
  } catch (error) {
    return plega(error.codi ?? EIXIDA.FITXER, 'La contrasenya de WordPress.org no deixa seguir:', [error.message]);
  }
  try { fs.accessSync(docker, fs.constants.X_OK); } catch { return plega(EIXIDA.EINA, `no es troba docker (${docker}): Docker Desktop ha d'estar instal·lat i obert`); }

  // 3. El checkout anònim, en una carpeta temporal de fora del repositori.
  const treball = fs.realpathSync(fs.mkdtempSync(path.join(temporal, 'sdp-wp-svn-')));
  try {
    let args;
    try { args = argumentsDocker({ imatge, treball, script: SCRIPT_CONSULTA, posicionals: [REPOSITORI_SVN, versio] }); } catch (error) { return plega(error.codi, error.message); }
    escriu(`\nWordPress.org SVN (${REPOSITORI_SVN}): checkout anònim de trunk/ i de la llista de tags/ en un contenidor efímer`);
    const consulta = await executaDocker({ docker, args, registra: escriu });
    if (consulta.codi !== 0) return plega(EIXIDA.EXTERNA, `el contenidor de consulta ha acabat amb ${consulta.codi}: no s'ha fet res a WordPress.org`);
    let copia;
    let canvis;
    try {
      copia = llegixCopia(treball, versio);
      const problema = problemaDeVersio(versio, copia);
      if (problema) throw new ErrorWp(problema);
      if (copia.tag && !esIgual(copia.tag, paquet.fitxers)) throw new ErrorWp(`tags/${versio}/ ja existix a WordPress.org amb un altre contingut: un tag publicat no es reescriu (puja una versió nova)`);
      canvis = comparaArbres(copia.trunk, paquet.fitxers);
    } catch (error) {
      return plega(error instanceof ErrorWp ? error.codi : EIXIDA.ARBRE, `WordPress.org no deixa publicar ${versio}: ${error.message}`);
    }
    const tagNou = !copia.tag;
    const resTrunk = canvis.afegits.length + canvis.modificats.length + canvis.eliminats.length;
    escriu(['', `PLA (${opcions.publica ? 'es publica ara' : 'en sec: no s\'escriu res'}):`,
      `  trunk/ (Stable tag ara: ${copia.stableTrunk ?? 'cap'} → ${versio}): ${resTrunk ? `${resTrunk} canvis` : 'ja és el paquet'}`,
      ...llista('afegits', canvis.afegits), ...llista('modificats', canvis.modificats), ...llista('eliminats', canvis.eliminats),
      `  tags/${versio}/: ${tagNou ? 'nou (svn copy de trunk/, en el mateix commit)' : 'ja hi és, idèntic al paquet'}`].join('\n'));
    if (!resTrunk && !tagNou) {
      escriu(`✓ WordPress.org ja publica exactament este paquet a trunk/ i a tags/${versio}/: no hi ha res a fer.`);
      return EIXIDA.BE;
    }
    if (!opcions.publica) {
      /* Gauntlet v1.2.16 · La ruta del zip, llesta per a copiar: dins de casa, ~/ fora de les cometes
         (entre cometes simples, la terminal no expandiria «~»); fora de casa, tal com s'ha escrit. */
      const casa = os.homedir();
      const zipMostrat = casa.length > 1 && esDins(casa, paquet.cami) && paquet.cami !== casa
        ? `~/${citaShell(path.relative(casa, paquet.cami))}` : citaShell(String(zip));
      escriu(`\nEn sec: no s'ha llegit la contrasenya ni s'ha escrit res a WordPress.org. Per a publicar, amb el «sí» del Mestre per a ESTE zip:\n  node scripts/botigues/puja-wordpress-svn.mjs --zip ${zipMostrat} --versio ${versio} --publica --confirma=${esperada}`);
      return EIXIDA.BE;
    }

    // 4. El commit: els fitxers a trunk/, les llistes, i la contrasenya NOMÉS per stdin.
    let clau;
    try { clau = llegixContrasenya(contrasenya); } catch (error) { return plega(error.codi ?? EIXIDA.FITXER, error.message); }
    const formes = formesDeLaContrasenya(clau);
    try { aplicaATrunk(path.join(copia.repo, 'trunk'), paquet.fitxers, canvis); } catch (error) { return plega(EIXIDA.ARBRE, error.message); }
    fs.writeFileSync(path.join(treball, 'afig.txt'), canvis.afegits.map((ruta) => `${ruta}\n`).join(''));
    fs.writeFileSync(path.join(treball, 'elimina.txt'), canvis.eliminats.map((ruta) => `${ruta}\n`).join(''));
    const missatge = `${SLUG} ${versio}: trunk${tagNou ? ` i tags/${versio}` : ''} des de ${path.basename(paquet.cami)} (sha256 ${paquet.sha256.slice(0, 12)})`;
    escriu(`\nWordPress.org SVN: commit de ${versio} (usuari ${USUARI_SVN}; la contrasenya va per stdin, mai a cap argument)`);
    const publicacio = await executaDocker({
      docker, args: argumentsDocker({ imatge, treball, script: SCRIPT_PUBLICA, posicionals: [versio, USUARI_SVN, missatge, tagNou ? 'nou' : 'existent'], ambEntrada: true }),
      entrada: clau, formes, registra: escriu
    });
    clau = null;
    if (publicacio.codi !== 0) {
      return plega(EIXIDA.EXTERNA, `el commit a WordPress.org ha acabat amb ${publicacio.codi}`, [`abans de repetir-lo, mira https://plugins.trac.wordpress.org/log/${SLUG}/ : si hi ha la revisió de ${versio}, ja està publicat`]);
    }
    const revisio = /Committed revision (\d+)/.exec(publicacio.eixida)?.[1] ?? null;
    escriu(`✓ WordPress.org SVN: ${versio} publicat a trunk/${tagNou ? ` i tags/${versio}/` : ''}${revisio ? ` (revisió ${revisio})` : ''}`);

    // 5. L'API pública, només GET.
    const r = await api();
    if (r.error) escriu(`! l'API pública de WordPress.org no ha respost (${r.error}): torna-ho a mirar amb --comprova-api`);
    else if (r.versio === versio) escriu(`✓ WordPress.org (API pública): ${SLUG} ${r.versio}`);
    else escriu(`! WordPress.org (API pública) encara dona ${r.versio}: el directori pot trigar uns minuts a reconstruir el paquet; torna-ho a mirar amb --comprova-api`);
    escriu(['', 'REBUT (cap secret):', `  paquet: ${path.basename(paquet.cami)}  sha256: ${paquet.sha256}`, `  versió: ${versio}  revisió SVN: ${revisio ?? 'desconeguda'}`,
      `  trunk: +${canvis.afegits.length} ~${canvis.modificats.length} -${canvis.eliminats.length}  tag: ${tagNou ? 'nou' : 'ja hi era'}`, `  API pública: ${r.versio ?? r.error}`, `  hora: ${new Date().toISOString()}`, ''].join('\n'));
    return EIXIDA.BE;
  } finally {
    fs.rmSync(treball, { recursive: true, force: true });
  }
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) main(process.argv.slice(2)).then((codi) => { process.exitCode = codi; });
