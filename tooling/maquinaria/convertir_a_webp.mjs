#!/usr/bin/env node
/**
 * convertir_a_webp.mjs — Tractor de conversió a WebP sota la Llei del Quadrat
 * Universal (1200×1200 px, <80 KB; avatars 400×400 px) amb preservació estricta
 * de metadades EXIF (GPS/geolocalització i DateTimeOriginal per a cartografia
 * i patrimoni rural) i escriptura atòmica segura.
 *
 * Ús CLI (requereix `python3` amb `Pillow` instal·lat en l'entorn local de maquinària):
 *   node tooling/maquinaria/convertir_a_webp.mjs <entrada> [eixida.webp] [--mode quadrat|avatar|original] [--max-kb 80]
 *
 * També exporta funcions pures de contenidor RIFF/WebP i EXIF per a proves:
 *   · extreuTiffExif(buffer)
 *   · incrustaExifEnWebp(webpBuffer, tiffBuffer)
 *   · convertirImatgeAWebp(inputPath, outputPath, opcions)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { llegixExif } from '../../src/components/universal/enquadrament/exif.js';
import { analitzaTiff } from '../../src/components/universal/enquadrament/exifIncrustat.js';

export const MIDA_QUADRAT_UNIVERSAL = 1200;
export const MIDA_AVATAR_UNIVERSAL = 400;
export const MAX_KB_PER_DEFECTE = 80;

const TAGS_RASTER_TIFF = new Set([
  0x0100, // ImageWidth
  0x0101, // ImageLength
  0x0102, // BitsPerSample
  0x0103, // Compression
  0x0106, // PhotometricInterpretation
  0x0111, // StripOffsets
  0x0115, // SamplesPerPixel
  0x0116, // RowsPerStrip
  0x0117, // StripByteCounts
  0x011c, // PlanarConfiguration
  0x0142, // TileWidth
  0x0143, // TileLength
  0x0144, // TileOffsets
  0x0145, // TileByteCounts
]);

const u16be = (b, p) => ((b[p] << 8) | b[p + 1]) >>> 0;
const u32be = (b, p) => (((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0);
const u32le = (b, p) => (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;
const text4 = (b, p) => String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);

function escriuU32le(b, p, val) {
  b[p] = val & 0xff;
  b[p + 1] = (val >>> 8) & 0xff;
  b[p + 2] = (val >>> 16) & 0xff;
  b[p + 3] = (val >>> 24) & 0xff;
}

function escriuU24le(b, p, val) {
  b[p] = val & 0xff;
  b[p + 1] = (val >>> 8) & 0xff;
  b[p + 2] = (val >>> 16) & 0xff;
}

function aUint8(entrada) {
  if (entrada instanceof Uint8Array) return entrada;
  if (entrada instanceof ArrayBuffer) return new Uint8Array(entrada);
  if (ArrayBuffer.isView(entrada)) return new Uint8Array(entrada.buffer, entrada.byteOffset, entrada.byteLength);
  return null;
}

function sensePrefixExif(b) {
  if (
    b.length >= 14 &&
    b[0] === 0x45 && b[1] === 0x78 && b[2] === 0x69 && b[3] === 0x66 &&
    b[4] === 0x00 && b[5] === 0x00
  ) {
    return b.slice(6);
  }
  return b;
}

/**
 * Si un bloc TIFF és una imatge TIFF completa (porta StripOffsets i tags de
 * raster en IFD0), filtra in-place els tags de raster d'IFD0 sense alterar cap
 * offset dels valors ni dels sub-IFDs (0x8769, 0x8825) i retalla les bandes de
 * píxels finals. Si ja és un bloc EXIF pur, el torna intacte.
 */
function netejaRasterDeTiff(tiffBytes) {
  const b = aUint8(tiffBytes);
  if (!b || b.length < 8) return null;
  const le = b[0] === 0x49 && b[1] === 0x49;
  const mm = b[0] === 0x4d && b[1] === 0x4d;
  if (!le && !mm) return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (v.getUint16(2, le) !== 42) return null;
  const ifd0 = v.getUint32(4, le);
  if (ifd0 + 2 > b.length) return null;
  const n = v.getUint16(ifd0, le);
  if (n === 0 || n > 512 || ifd0 + 2 + n * 12 + 4 > b.length) return null;

  let teRaster = false;
  let primerStripOffset = b.length;
  const conservades = [];

  for (let i = 0; i < n; i += 1) {
    const pos = ifd0 + 2 + i * 12;
    const tag = v.getUint16(pos, le);
    const tipus = v.getUint16(pos + 2, le);
    const quantitat = v.getUint32(pos + 4, le);
    if (tag === 0x0111 && quantitat === 1) {
      const off = tipus === 3 ? v.getUint16(pos + 8, le) : v.getUint32(pos + 8, le);
      if (off > ifd0 && off < primerStripOffset) primerStripOffset = off;
    }
    if (TAGS_RASTER_TIFF.has(tag)) {
      teRaster = true;
    } else {
      conservades.push(b.slice(pos, pos + 12));
    }
  }

  if (!teRaster) return new Uint8Array(b);
  if (conservades.length === 0) return null;

  const limit = Math.min(b.length, primerStripOffset);
  const eixida = new Uint8Array(b.subarray(0, limit));
  const ve = new DataView(eixida.buffer, eixida.byteOffset, eixida.byteLength);
  ve.setUint16(ifd0, conservades.length, le);
  let cursor = ifd0 + 2;
  for (const entrada of conservades) {
    eixida.set(entrada, cursor);
    cursor += 12;
  }
  ve.setUint32(cursor, 0, le);
  for (let p = cursor + 4; p < ifd0 + 2 + n * 12 + 4 && p < eixida.length; p += 1) {
    eixida[p] = 0;
  }
  return eixida;
}

/**
 * Normalitza el tag Orientation (0x0112) d'un bloc TIFF a 1 (normal) i poda
 * qualsevol miniatura incrustada (IFD1 o JPEG dins MakerNote) via `analitzaTiff`
 * quan els píxels ja s'han orientat i retallat en codificar el WebP, preservant
 * intactes GPS IFD (0x8825), Exif IFD (0x8769) i tota la resta d'entrades.
 */
export function normalitzaOrientacioTiff(tiffBytes) {
  const b = aUint8(tiffBytes);
  if (!b || b.length < 8) return b;
  const sanejat = analitzaTiff(b);
  if (sanejat && sanejat.tiff instanceof Uint8Array && sanejat.tiff.length >= 8) {
    return sanejat.tiff;
  }
  const copia = new Uint8Array(b);
  const le = copia[0] === 0x49 && copia[1] === 0x49;
  const mm = copia[0] === 0x4d && copia[1] === 0x4d;
  if (!le && !mm) return copia;
  const v = new DataView(copia.buffer, copia.byteOffset, copia.byteLength);
  if (v.getUint16(2, le) !== 42) return copia;
  const ifd0 = v.getUint32(4, le);
  if (ifd0 + 2 > copia.length) return copia;
  const n = v.getUint16(ifd0, le);
  if (n > 512 || ifd0 + 2 + n * 12 > copia.length) return copia;
  for (let i = 0; i < n; i += 1) {
    const pos = ifd0 + 2 + i * 12;
    const tag = v.getUint16(pos, le);
    const tipus = v.getUint16(pos + 2, le);
    const quantitat = v.getUint32(pos + 4, le);
    if (tag === 0x0112 && tipus === 3 && quantitat === 1) {
      v.setUint16(pos + 8, 1, le);
    }
  }
  if (ifd0 + 2 + n * 12 + 4 <= copia.length) {
    v.setUint32(ifd0 + 2 + n * 12, 0, le); // Deslliga IFD1 (miniatura sense retallar)
  }
  return copia;
}

/**
 * Identifica el format d'imatge pels bytes màgics ('jpeg' | 'png' | 'webp' | 'tiff' | null).
 */
export function detectaFormatEntrada(entrada) {
  const b = aUint8(entrada);
  if (!b || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return 'png';
  if (text4(b, 0) === 'RIFF' && text4(b, 8) === 'WEBP') return 'webp';
  const le = b[0] === 0x49 && b[1] === 0x49 && b[2] === 42 && b[3] === 0;
  const mm = b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 42;
  if (le || mm) return 'tiff';
  return null;
}

/**
 * Extrau el payload TIFF d'EXIF (començant per «II*\0» o «MM\0*») d'un JPEG
 * (APP1 «Exif\0\0»), d'un PNG (chunk «eXIf»), d'un WebP (chunk RIFF «EXIF»)
 * o d'un TIFF. Torna Uint8Array o null.
 */
export function extreuTiffExif(entrada) {
  const b = aUint8(entrada);
  if (!b || b.length < 8) return null;

  // Cas 1: JPEG (FF D8)
  if (b.length >= 12 && b[0] === 0xff && b[1] === 0xd8) {
    let pos = 2;
    while (pos + 4 <= b.length) {
      if (b[pos] !== 0xff) return null;
      const marker = b[pos + 1];
      if (marker === 0xff) { pos += 1; continue; }
      if (marker === 0xd9 || marker === 0xda) return null;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { pos += 2; continue; }
      const len = u16be(b, pos + 2);
      const fi = pos + 2 + len;
      if (len < 2 || fi > b.length) return null;
      if (
        marker === 0xe1 &&
        len >= 16 &&
        b[pos + 4] === 0x45 && b[pos + 5] === 0x78 && b[pos + 6] === 0x69 && b[pos + 7] === 0x66 &&
        b[pos + 8] === 0x00 && b[pos + 9] === 0x00
      ) {
        return b.slice(pos + 10, fi);
      }
      pos = fi;
    }
    return null;
  }

  // Cas 2: PNG (89 50 4E 47 0D 0A 1A 0A) -> chunk eXIf
  if (
    b.length >= 20 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    let pos = 8;
    while (pos + 12 <= b.length) {
      const len = u32be(b, pos);
      const type = text4(b, pos + 4);
      const dadesInici = pos + 8;
      const dadesFi = dadesInici + len;
      if (dadesFi + 4 > b.length) return null;
      if (type === 'eXIf' && len >= 8) {
        return sensePrefixExif(b.slice(dadesInici, dadesFi));
      }
      if (type === 'IEND') break;
      pos = dadesFi + 4;
    }
    return null;
  }

  // Cas 3: WebP (RIFF....WEBP) -> chunk EXIF
  if (b.length >= 12 && text4(b, 0) === 'RIFF' && text4(b, 8) === 'WEBP') {
    let pos = 12;
    while (pos + 8 <= b.length) {
      const fourcc = text4(b, pos);
      const size = u32le(b, pos + 4);
      const dadesInici = pos + 8;
      const dadesFi = dadesInici + size;
      if (dadesFi > b.length) return null;
      if (fourcc === 'EXIF' && size >= 8) {
        return sensePrefixExif(b.slice(dadesInici, dadesFi));
      }
      pos = dadesFi + (size % 2);
    }
    return null;
  }

  // Cas 4: Contenidor TIFF directe (II*\0 o MM\0*)
  const net = sensePrefixExif(b);
  const le = net[0] === 0x49 && net[1] === 0x49 && net[2] === 42 && net[3] === 0;
  const mm = net[0] === 0x4d && net[1] === 0x4d && net[2] === 0 && net[3] === 42;
  if (le || mm) {
    return netejaRasterDeTiff(net);
  }

  return null;
}

/**
 * Llig les dimensions (amplada, alçada) del primer chunk d'imatge d'un WebP.
 */
function dimensionsDeWebp(b) {
  let pos = 12;
  while (pos + 8 <= b.length) {
    const fourcc = text4(b, pos);
    const size = u32le(b, pos + 4);
    const p = pos + 8;
    if (p + size > b.length) break;
    if (fourcc === 'VP8X' && size >= 10) {
      const w = (b[p + 4] | (b[p + 5] << 8) | (b[p + 6] << 16)) + 1;
      const h = (b[p + 7] | (b[p + 8] << 8) | (b[p + 9] << 16)) + 1;
      return { amplada: w, alcada: h };
    }
    if (fourcc === 'VP8 ' && size >= 10 && b[p + 3] === 0x9d && b[p + 4] === 0x01 && b[p + 5] === 0x2a) {
      const w = (b[p + 6] | (b[p + 7] << 8)) & 0x3fff;
      const h = (b[p + 8] | (b[p + 9] << 8)) & 0x3fff;
      return { amplada: w, alcada: h };
    }
    if (fourcc === 'VP8L' && size >= 5 && b[p] === 0x2f) {
      const bits = u32le(b, p + 1);
      const w = (bits & 0x3fff) + 1;
      const h = ((bits >>> 14) & 0x3fff) + 1;
      return { amplada: w, alcada: h };
    }
    pos = p + size + (size % 2);
  }
  return { amplada: MIDA_QUADRAT_UNIVERSAL, alcada: MIDA_QUADRAT_UNIVERSAL };
}

/**
 * Incrusta (o substitueix) un bloc TIFF EXIF dins d'un contenidor RIFF WebP,
 * assegurant que el chunk VP8X existisca i tinga el bit EXIF (0x08) actiu.
 */
export function incrustaExifEnWebp(webpEntrada, tiffEntrada) {
  const b = aUint8(webpEntrada);
  const tiff = aUint8(tiffEntrada);
  if (!b || b.length < 12 || text4(b, 0) !== 'RIFF' || text4(b, 8) !== 'WEBP') {
    throw new Error('El buffer d’entrada no és un contenidor RIFF WebP vàlid.');
  }
  if (!tiff || tiff.length < 8) return new Uint8Array(b);

  const chunks = [];
  let vp8x = null;
  let pos = 12;
  while (pos + 8 <= b.length) {
    const fourcc = text4(b, pos);
    const size = u32le(b, pos + 4);
    const dadesInici = pos + 8;
    const dadesFi = dadesInici + size;
    if (dadesFi > b.length) break;
    const dades = b.slice(dadesInici, dadesFi);
    if (fourcc === 'VP8X' && size >= 10) {
      vp8x = new Uint8Array(dades);
    } else if (fourcc !== 'EXIF') {
      chunks.push({ fourcc, dades });
    }
    pos = dadesFi + (size % 2);
  }

  if (!vp8x) {
    const { amplada, alcada } = dimensionsDeWebp(b);
    vp8x = new Uint8Array(10);
    escriuU24le(vp8x, 4, Math.max(0, amplada - 1));
    escriuU24le(vp8x, 7, Math.max(0, alcada - 1));
  }
  vp8x[0] |= 0x08;

  const totsElsChunks = [
    { fourcc: 'VP8X', dades: vp8x },
    ...chunks,
    { fourcc: 'EXIF', dades: tiff },
  ];

  const midaCos = totsElsChunks.reduce((acc, c) => acc + 8 + c.dades.length + (c.dades.length % 2), 0);
  const eixida = new Uint8Array(12 + midaCos);
  eixida.set([0x52, 0x49, 0x46, 0x46], 0); // 'RIFF'
  escriuU32le(eixida, 4, 4 + midaCos);
  eixida.set([0x57, 0x45, 0x42, 0x50], 8); // 'WEBP'

  let cursor = 12;
  for (const c of totsElsChunks) {
    for (let i = 0; i < 4; i += 1) eixida[cursor + i] = c.fourcc.charCodeAt(i);
    escriuU32le(eixida, cursor + 4, c.dades.length);
    eixida.set(c.dades, cursor + 8);
    cursor += 8 + c.dades.length;
    if (c.dades.length % 2 === 1) {
      eixida[cursor] = 0;
      cursor += 1;
    }
  }
  return eixida;
}

/**
 * Llig orientació, GPS i data de captura d'un JPEG, PNG, WebP o TIFF (embolcallant
 * el chunk TIFF EXIF en un segment JPEG APP1 mínim per a reutilitzar `llegixExif`).
 */
export function llegixExifUniversal(buffer, opcions) {
  const b = aUint8(buffer);
  if (!b || b.length < 8) return llegixExif(buffer, opcions);
  if (b.length >= 12 && b[0] === 0xff && b[1] === 0xd8) return llegixExif(b, opcions);
  const tiff = extreuTiffExif(b);
  if (!tiff || tiff.length + 10 > 0xffff) return llegixExif(b, opcions);
  const longitudSegment = tiff.length + 8;
  const embolcallJpeg = new Uint8Array(4 + longitudSegment + 2);
  embolcallJpeg[0] = 0xff;
  embolcallJpeg[1] = 0xd8; // SOI
  embolcallJpeg[2] = 0xff;
  embolcallJpeg[3] = 0xe1; // APP1
  embolcallJpeg[4] = (longitudSegment >>> 8) & 0xff;
  embolcallJpeg[5] = longitudSegment & 0xff;
  embolcallJpeg.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 6); // 'Exif\0\0'
  embolcallJpeg.set(tiff, 12);
  embolcallJpeg[12 + tiff.length] = 0xff;
  embolcallJpeg[13 + tiff.length] = 0xd9; // EOI
  return llegixExif(embolcallJpeg, opcions);
}

const PYTHON_CONVERT_SCRIPT = `
import sys, io, json
from PIL import Image, ImageOps, ImageFilter

in_path, out_path, mode, target_px, max_bytes = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
with Image.open(in_path) as im:
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    w, h = im.size
    if mode in ('quadrat', 'avatar'):
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        im = im.crop((left, top, left + side, top + side))
        im = im.resize((target_px, target_px), Image.Resampling.LANCZOS)
    else:
        longest = max(w, h)
        if longest > target_px:
            scale = target_px / float(longest)
            im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.Resampling.LANCZOS)
    best = None
    best_q = 84
    best_r = 0.0
    found = False
    for radius in (0.0, 0.8, 1.4, 1.8, 2.2):
        candidate = im if radius == 0.0 else im.filter(ImageFilter.GaussianBlur(radius))
        qualities = (84, 78, 72, 66, 60, 54, 48, 42, 36, 30, 25, 20, 15, 10, 5, 1) if radius == 0.0 else (40, 32, 25, 20, 15, 10, 5, 1)
        for q in qualities:
            buf = io.BytesIO()
            candidate.save(buf, format='WEBP', quality=q, method=6)
            data = buf.getvalue()
            if best is None or len(data) < len(best):
                best = data
                best_q = q
                best_r = radius
            if len(data) <= max_bytes:
                best = data
                best_q = q
                best_r = radius
                found = True
                break
        if found:
            break
    with open(out_path, 'wb') as f:
        f.write(best)
    sys.stdout.write(json.dumps({"quality": best_q, "blurRadius": best_r}))
`;

/**
 * Converteix una imatge del disc a `.webp` aplicant la Llei del Quadrat Universal
 * (1200×1200 px per a targeta/capçalera, 400×400 px per a avatar), preservant
 * íntegrament el bloc EXIF original (GPS i data de captura) amb orientació
 * normalitzada i sense miniatura IFD1, imposant el pressupost de bytes (`maxKb * 1000 - 1`)
 * i escrivint de manera atòmica perquè l'original o el destí existent no queden mai truncats
 * si qualsevol pas falla.
 */
export function convertirImatgeAWebp(inputPath, outputPath = null, opcions = {}) {
  const mode = opcions.mode || 'quadrat';
  const midaPx = opcions.midaPx || (mode === 'avatar' ? MIDA_AVATAR_UNIVERSAL : MIDA_QUADRAT_UNIVERSAL);
  const maxKb = Number.isFinite(opcions.maxKb) ? opcions.maxKb : (mode === 'avatar' ? 40 : MAX_KB_PER_DEFECTE);
  const preservaExifBinari = opcions.preservaExifBinari !== false;
  if (!(maxKb > 0)) {
    throw new Error(`Pressupost de pes invàlid (maxKb=${maxKb}).`);
  }
  const maxBytesTotals = Math.max(1, Math.floor(maxKb * 1000) - 1);
  const desti = outputPath || inputPath.replace(/\.[^.]+$/, '.webp');

  const bytesEntrada = fs.readFileSync(inputPath);
  const formatEntrada = detectaFormatEntrada(bytesEntrada);
  if (!formatEntrada) {
    throw new Error(`Format d’imatge no suportat o fitxer invàlid: ${inputPath}`);
  }

  const exifEntrada = llegixExifUniversal(bytesEntrada);
  const tiffOriginal = extreuTiffExif(bytesEntrada);
  const tiffNormalitzat = preservaExifBinari && tiffOriginal ? normalitzaOrientacioTiff(tiffOriginal) : null;

  const margeExif = tiffNormalitzat ? tiffNormalitzat.length + 30 : 0;
  const maxBytesImatge = maxBytesTotals - margeExif;
  if (maxBytesImatge < 64) {
    throw new Error(
      `Les metadades EXIF (${tiffNormalitzat?.length ?? 0} B) superen el pressupost màxim permès (${maxBytesTotals} B).`,
    );
  }

  const dirDesti = path.dirname(path.resolve(desti));
  const tmpPath = path.join(
    dirDesti,
    `.${path.basename(desti)}.tmp-${process.pid}-${crypto.randomUUID()}.webp`,
  );

  try {
    let metaCodificacio = { quality: null, blurRadius: 0 };
    const stdoutBuf = execFileSync(
      'python3',
      ['-c', PYTHON_CONVERT_SCRIPT, inputPath, tmpPath, mode, String(midaPx), String(maxBytesImatge)],
      { stdio: 'pipe' },
    );
    try {
      const parsed = JSON.parse(String(stdoutBuf || '').trim());
      if (parsed && typeof parsed === 'object') metaCodificacio = parsed;
    } catch { /* ignore JSON parse if empty */ }

    if (!fs.existsSync(tmpPath)) {
      throw new Error('L’encoder no ha produït cap fitxer WebP temporal.');
    }

    let bytesWebp = new Uint8Array(fs.readFileSync(tmpPath));
    if (bytesWebp.length < 12 || text4(bytesWebp, 0) !== 'RIFF' || text4(bytesWebp, 8) !== 'WEBP') {
      throw new Error('El fitxer temporal generat no és un contenidor RIFF WebP vàlid.');
    }

    if (tiffNormalitzat) {
      bytesWebp = incrustaExifEnWebp(bytesWebp, tiffNormalitzat);
    }

    if (bytesWebp.length > maxBytesTotals) {
      throw new Error(
        `El WebP resultant (${bytesWebp.length} B) supera el pressupost màxim permès (${maxBytesTotals} B).`,
      );
    }

    fs.writeFileSync(tmpPath, bytesWebp);
    fs.renameSync(tmpPath, desti);

    const dims = dimensionsDeWebp(bytesWebp);
    const exifResultant = tiffNormalitzat ? llegixExifUniversal(bytesWebp) : exifEntrada;
    const qualitatWebp = metaCodificacio.quality;
    const radiDifuminat = metaCodificacio.blurRadius ?? 0;
    return {
      entrada: inputPath,
      eixida: desti,
      mode,
      amplada: dims.amplada,
      alcada: dims.alcada,
      bytes: bytesWebp.length,
      kb: Math.round((bytesWebp.length / 1000) * 100) / 100,
      kib: Math.round((bytesWebp.length / 1024) * 100) / 100,
      qualitatWebp,
      radiDifuminat,
      degradatPerPressupost: Boolean(radiDifuminat > 0 || (Number.isFinite(qualitatWebp) && qualitatWebp < 25)),
      exifPreservat: Boolean(tiffNormalitzat),
      gps: exifResultant.gps,
      dataCaptura: exifResultant.dataCaptura,
    };
  } finally {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup error */ }
    }
  }
}

function parseArgs(argv) {
  const pos = [];
  let mode = 'quadrat';
  let maxKb = undefined;
  let preservaExifBinari = true;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mode' && argv[i + 1]) {
      mode = argv[i + 1];
      i += 1;
    } else if (arg === '--max-kb' && argv[i + 1]) {
      maxKb = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--sense-exif-binari') {
      preservaExifBinari = false;
    } else if (!arg.startsWith('--')) {
      pos.push(arg);
    }
  }
  return { entrada: pos[0] || null, eixida: pos[1] || null, mode, maxKb, preservaExifBinari };
}

const esExecucioDirecta = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (esExecucioDirecta) {
  const { entrada, eixida, mode, maxKb, preservaExifBinari } = parseArgs(process.argv.slice(2));
  if (!entrada) {
    console.error('Ús: node tooling/maquinaria/convertir_a_webp.mjs <entrada> [eixida.webp] [--mode quadrat|avatar|original] [--max-kb 80] [--sense-exif-binari]');
    process.exit(1);
  }
  const resultat = convertirImatgeAWebp(entrada, eixida, { mode, maxKb, preservaExifBinari });
  console.log(JSON.stringify(resultat, null, 2));
}
