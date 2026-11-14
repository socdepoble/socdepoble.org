/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · La imatge social d'una
 * foto remota: SEMPRE un JPEG baseline nou de 1200x630 exactes i 300.000 B com
 * a molt, que el prerender servix des del PROPI origen (dist/assets/og/…).
 * Per què: WhatsApp no pinta WebP ni targetes pesades (doctrina R-01), totes
 * les portades i logotips d'entitat de producció són WebP, i el camí de
 * Storage porta l'identificador de qui puja la foto: cap HTML estàtic l'ha
 * de portar.
 *
 * El llenç és NOU: res de l'original hi viatja fora dels píxels (ni EXIF, ni
 * GPS, ni XMP, ni IPTC, ni ICC, ni comentaris). En Node es comprova que els
 * segments del JPEG d'eixida són només SOI, APP0, DQT, SOF0, DHT, DRI, SOS i
 * EOI (nomesSegmentsBasics).
 *
 * Composició (modeDeComposicio): si l'original cobrix 1200x630 SENSE ampliar
 * i el retall al centre en perd un terç o menys, es retalla (com les variants
 * de la casa); si no (logotips, quadrades, verticals, panoràmiques baixes),
 * s'encabix sobre blanc sense ampliar-lo mai.
 *
 * Descodificar una imatge que ha pujat un veí és superfície d'atac: un sol
 * convertidor (Pillow), aïllat amb sandbox-exec (sense xarxa, sense escriure
 * fora del seu directori temporal, sense llegir la carpeta d'usuari),
 * l'intèrpret per ruta absoluta, python3 -I amb el guió passat per -c,
 * l'entorn buit, un termini i formats tancats (WEBP, PNG i JPEG). Abans de
 * descodificar, en Node: pes, forma i mides fitades.
 *
 * Dos classes d'error, perquè la política de fallada és distinta:
 *   · ErrorDInfraestructura: la màquina no pot convertir (cap aïllament, cap
 *     Pillow, l'autoprova falla). Atura la release sempre: no és cap dada.
 *   · DefecteDeDada: ESTA imatge no es pot servir (massa gran, massa menuda,
 *     no descodificable, no hi cap en 300.000 B). El prerender decidix per
 *     ruta: editorial, porta roja; veïnal, la targeta genèrica i un avís.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {execFile} from 'node:child_process';

export const AMPLE_SOCIAL = 1200;
export const ALT_SOCIAL = 630;
export const PES_MAXIM_SOCIAL = 300_000;
export const QUALITATS = Object.freeze([85, 82, 78, 74, 70, 64]);
/** Els límits de l'original, comprovats en Node abans de descodificar res. */
export const LIMITS_DE_L_ORIGINAL = Object.freeze({bytes: 5 * 1024 * 1024, ampleMinim: 300, relacioMaxima: 4, costatMaxim: 8192, pixelsMaxims: 40_000_000});
const TERMINI_DE_CONVERSIO = 15000;
const AILLAMENT = '/usr/bin/sandbox-exec';
const SEGMENTS_BASICS = new Set([0xe0, 0xdb, 0xc0, 0xc4, 0xdd, 0xda]);

export class ErrorDInfraestructura extends Error {
  constructor(missatge) { super(missatge); this.name = 'ErrorDInfraestructura'; }
}
export class DefecteDeDada extends Error {
  constructor(missatge) { super(missatge); this.name = 'DefecteDeDada'; }
}

/** El MIME i les mides d'una imatge, llegits dels seus bytes; null si no ho és. */
export function sniffImage(bytes) {
  const b = Buffer.from(bytes);
  if (b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    && b.subarray(12, 16).toString('latin1') === 'IHDR') {
    return {type: 'image/png', width: b.readUInt32BE(16), height: b.readUInt32BE(20)};
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const marker = b[i + 1];
      if (marker === 0xff) { i += 1; continue; }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const size = b.readUInt16BE(i + 2);
      if (size < 2) return null;
      // SOFn (llevat de DHT, JPG i DAC): l'alçària i l'amplària del quadre.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return {type: 'image/jpeg', width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5)};
      }
      if (marker === 0xda || marker === 0xd9) return null;
      i += 2 + size;
    }
    return null;
  }
  if (b.length >= 30 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') {
    const chunk = b.subarray(12, 16).toString('latin1');
    if (chunk === 'VP8 ') return {type: 'image/webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff};
    if (chunk === 'VP8L' && b[20] === 0x2f) {
      const bits = b.readUInt32LE(21);
      return {type: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1};
    }
    if (chunk === 'VP8X') return {type: 'image/webp', width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1};
  }
  return null;
}

/**
 * Com es compon l'original sobre el llenç de 1200x630: 'retalla' (cobertura
 * al centre) si el cobrix sense ampliar i el retall en perd un terç o menys;
 * si no, 'encabix' (sencer sobre blanc, sense ampliar). Pur.
 */
export function modeDeComposicio({ample, alt}) {
  if (!(ample >= AMPLE_SOCIAL && alt >= ALT_SOCIAL)) return 'encabix';
  const escala = Math.max(AMPLE_SOCIAL / ample, ALT_SOCIAL / alt);
  const conservat = (AMPLE_SOCIAL * ALT_SOCIAL) / (ample * escala * alt * escala);
  return 1 - conservat <= 1 / 3 + 1e-9 ? 'retalla' : 'encabix';
}

/** El motiu pel qual un original no es pot convertir (abans de descodificar-lo), o null si passa. */
export function defecteDeLOriginal(bytes, forma = sniffImage(bytes)) {
  const L = LIMITS_DE_L_ORIGINAL;
  if (bytes.length > L.bytes) return `l'original pesa ${bytes.length} B (el sostre és ${L.bytes} B)`;
  if (!forma || !forma.width || !forma.height) return 'els bytes no són cap imatge PNG, JPEG ni WebP';
  const {width: ample, height: alt} = forma;
  if (ample < L.ampleMinim) return `l'original fa ${ample} px d'ample (el mínim és ${L.ampleMinim})`;
  if (Math.max(ample / alt, alt / ample) > L.relacioMaxima) return `l'original fa ${ample}x${alt} (més de ${L.relacioMaxima}:1)`;
  if (Math.max(ample, alt) > L.costatMaxim || ample * alt > L.pixelsMaxims) return `l'original fa ${ample}x${alt} (massa gran per a descodificar-lo)`;
  return null;
}

/* Els marcadors d'un JPEG fins al començament de les dades (SOS), en ordre; null si no és un JPEG ben format. */
function marcadorsDeJpeg(bytes) {
  const b = Buffer.from(bytes);
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const marcadors = [];
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) return null;
    const marcador = b[i + 1];
    marcadors.push(marcador);
    if (marcador === 0xda) return marcadors;
    const mida = b.readUInt16BE(i + 2);
    if (mida < 2) return null;
    i += 2 + mida;
  }
  return null;
}

/** Si un JPEG només porta segments bàsics (APP0, DQT, SOF0, DHT, DRI i SOS) i acaba en EOI: cap altre APPn ni COM. */
export function nomesSegmentsBasics(bytes) {
  const b = Buffer.from(bytes);
  const marcadors = marcadorsDeJpeg(b);
  return Boolean(marcadors) && marcadors.includes(0xc0) && marcadors.every(m => SEGMENTS_BASICS.has(m))
    && b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9;
}

/* El guió del convertidor: llig l'original (formats tancats), aplica l'orientació EXIF, posa
   l'alfa sobre blanc i el compon sobre un llenç NOU de 1200x630. Arguments: entrada, eixida,
   mode ('retalla' o 'encabix') i qualitat. Cap import fora de Pillow i sys. */
const GUIO = `
import sys
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = ${LIMITS_DE_L_ORIGINAL.pixelsMaxims}
src, dst, mode, q = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
im = Image.open(src, formats=['WEBP', 'PNG', 'JPEG'])
im.load()
im = ImageOps.exif_transpose(im)
if im.mode in ('RGBA', 'LA', 'P', 'PA'):
    im = im.convert('RGBA')
    fons = Image.new('RGB', im.size, (255, 255, 255))
    fons.paste(im, mask=im.split()[3])
    im = fons
else:
    im = im.convert('RGB')
W, H = ${AMPLE_SOCIAL}, ${ALT_SOCIAL}
llenc = Image.new('RGB', (W, H), (255, 255, 255))
if mode == 'retalla' and im.width >= W and im.height >= H:
    s = max(W / im.width, H / im.height)
    r = im.resize((max(W, round(im.width * s)), max(H, round(im.height * s))), Image.LANCZOS)
    x, y = (r.width - W) // 2, (r.height - H) // 2
    llenc.paste(r.crop((x, y, x + W, y + H)))
else:
    s = min(1.0, W / im.width, H / im.height)
    r = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS) if s < 1 else im
    llenc.paste(r, ((W - r.width) // 2, (H - r.height) // 2))
llenc.save(dst, 'JPEG', quality=q, optimize=True, progressive=False)
`;

/* Un PNG de veres d'un sol color (per a l'autoprova del convertidor), sense cap eina externa. */
export function pngDeProva(ample = 400, alt = 300, [r, g, b] = [34, 139, 34]) {
  const tros = (tipus, dades) => {
    const cos = Buffer.concat([Buffer.from(tipus, 'latin1'), dades]);
    const mida = Buffer.alloc(4); mida.writeUInt32BE(dades.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(cos) >>> 0);
    return Buffer.concat([mida, cos, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ample, 0); ihdr.writeUInt32BE(alt, 4); ihdr[8] = 8; ihdr[9] = 2;
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(ample * 3, Buffer.from([r, g, b]))]);
  const dades = Buffer.concat(Array.from({length: alt}, () => fila));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), tros('IHDR', ihdr), tros('IDAT', zlib.deflateSync(dades)), tros('IEND', Buffer.alloc(0))]);
}

const executa = (ordre, args, opcions) => new Promise((resolve, reject) => {
  execFile(ordre, args, opcions, (error, stdout, stderr) => (error ? reject(Object.assign(error, {stderr})) : resolve({stdout, stderr})));
});

/* Els intèrprets candidats, per ruta absoluta i sense repetits: els del PATH i els llocs habituals. */
function interpretsCandidats(env) {
  const dirs = [...String(env.PATH || '').split(path.delimiter), '/usr/local/bin', '/opt/homebrew/bin', '/usr/bin'].filter(dir => path.isAbsolute(dir));
  const vistos = new Set();
  const candidats = [];
  for (const dir of dirs) {
    let real;
    try { real = fs.realpathSync(path.join(dir, 'python3')); } catch { continue; }
    if (!vistos.has(real)) { vistos.add(real); candidats.push(real); }
  }
  return candidats;
}

/**
 * El convertidor aïllat de la màquina, amb l'autoprova passada, o ErrorDInfraestructura.
 * Torna { convertix(bytes, {mode, qualitat}) → Promise<Buffer>, interpret, tanca() }.
 * `convertix` llança DefecteDeDada si ESTA imatge no es pot convertir.
 */
export async function detectaConvertidor({env = process.env, aillament = AILLAMENT, tmpdir = os.tmpdir(), termini = TERMINI_DE_CONVERSIO} = {}) {
  try { if (!fs.statSync(aillament).isFile()) throw new Error('no és un fitxer'); } catch {
    throw new ErrorDInfraestructura(`Cap aïllament per al convertidor d'imatges (${aillament}): les fotos remotes no es poden convertir en esta màquina.`);
  }
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir, 'sdp-jpeg-social-')));
  if (!/^[A-Za-z0-9/_.+-]+$/.test(arrel)) { fs.rmSync(arrel, {recursive: true, force: true}); throw new ErrorDInfraestructura('El directori temporal del convertidor té un camí que el perfil d’aïllament no admet.'); }
  const perfil = `(version 1)(allow default)(deny network*)(deny file-write*)(allow file-write* (subpath "${arrel}"))(deny file-read* (subpath "/Users"))`;
  const tanca = () => fs.rmSync(arrel, {recursive: true, force: true});
  let torn = 0;
  const amb = interpret => async (bytes, {mode, qualitat}) => {
    const dir = fs.mkdtempSync(path.join(arrel, `c${torn += 1}-`));
    const entrada = path.join(dir, 'entrada'), eixida = path.join(dir, 'eixida.jpg');
    try {
      fs.writeFileSync(entrada, bytes, {flag: 'wx'});
      await executa(aillament, ['-p', perfil, interpret, '-I', '-c', GUIO, entrada, eixida, mode, String(qualitat)],
        {env: {}, cwd: dir, timeout: termini, killSignal: 'SIGKILL', maxBuffer: 64 * 1024, windowsHide: true});
      return fs.readFileSync(eixida);
    } catch (error) {
      throw new DefecteDeDada(error?.killed ? 'la conversió ha passat del termini' : 'la imatge no es pot descodificar');
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  };
  /* L'autoprova: un PNG de veres ha d'eixir en JPEG baseline de 1200x630 només amb segments bàsics. */
  const prova = pngDeProva();
  for (const interpret of interpretsCandidats(env)) {
    const convertix = amb(interpret);
    try {
      const eixida = await convertix(prova, {mode: 'encabix', qualitat: 85});
      const forma = sniffImage(eixida);
      if (forma?.type === 'image/jpeg' && forma.width === AMPLE_SOCIAL && forma.height === ALT_SOCIAL && nomesSegmentsBasics(eixida)) return {convertix, interpret, tanca};
    } catch { /* un altre intèrpret */ }
  }
  tanca();
  throw new ErrorDInfraestructura('Cap Python amb Pillow funciona dins de l’aïllament: les fotos remotes no es poden convertir en esta màquina (instal·leu Pillow al Python del sistema).');
}

/**
 * La imatge social d'uns bytes: { bytes, type: 'image/jpeg', width: 1200, height: 630, mode, qualitat }.
 * Llança DefecteDeDada si esta imatge no es pot servir i ErrorDInfraestructura si el convertidor
 * torna alguna cosa que no és el JPEG esperat.
 */
export async function jpegSocial(bytes, {convertidor} = {}) {
  if (!convertidor || typeof convertidor.convertix !== 'function') throw new ErrorDInfraestructura('Cap convertidor d’imatges.');
  const original = Buffer.from(bytes);
  const forma = sniffImage(original);
  const defecte = defecteDeLOriginal(original, forma);
  if (defecte) throw new DefecteDeDada(defecte);
  const mode = modeDeComposicio({ample: forma.width, alt: forma.height});
  let darrer = 0;
  for (const qualitat of QUALITATS) {
    const eixida = Buffer.from(await convertidor.convertix(original, {mode, qualitat}));
    const resultat = sniffImage(eixida);
    if (resultat?.type !== 'image/jpeg' || resultat.width !== AMPLE_SOCIAL || resultat.height !== ALT_SOCIAL || !nomesSegmentsBasics(eixida)) {
      throw new ErrorDInfraestructura('El convertidor no ha tornat un JPEG baseline de 1200x630 només amb segments bàsics.');
    }
    if (eixida.length <= PES_MAXIM_SOCIAL) return {bytes: eixida, type: 'image/jpeg', width: AMPLE_SOCIAL, height: ALT_SOCIAL, mode, qualitat};
    darrer = eixida.length;
  }
  throw new DefecteDeDada(`la imatge no hi cap en ${PES_MAXIM_SOCIAL} B (a qualitat ${QUALITATS.at(-1)} encara en fa ${darrer})`);
}
