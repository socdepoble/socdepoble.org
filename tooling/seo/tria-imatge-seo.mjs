#!/usr/bin/env node
/**
 * tooling/seo/tria-imatge-seo.mjs
 *
 * Tractor i script d'elecció intel·ligent d'imatge SEO (og:image) per a
 * publicacions editorials i esdeveniments multi-data (Skill sdp-importacio-editorial).
 *
 * Ús:
 *   node tooling/seo/tria-imatge-seo.mjs [--ara YYYY-MM-DD] [--genera-variants]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { triaImatgeSeo } from './triaImatgeSeo.js';
import { CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../../src/sections/mur/eventsSeed.js';

const PES_MAXIM_WHATSAPP = 300_000;

/**
 * Elimina els segments APP1 (0xFFE1, EXIF / XMP) d'un buffer JPEG
 * per complir la guarda d'absència de metadades privades (OG-7).
 */
export function senseApp1(bytes) {
  const b = Buffer.from(bytes);
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return b;
  const parts = [b.subarray(0, 2)];
  let i = 2;
  while (i + 3 < b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    if (marker === 0xda) {
      parts.push(b.subarray(i));
      break;
    }
    const len = b.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > b.length) {
      parts.push(b.subarray(i));
      break;
    }
    if (marker !== 0xe1) {
      parts.push(b.subarray(i, i + 2 + len));
    }
    i += 2 + len;
  }
  return Buffer.concat(parts);
}

/**
 * Genera la variant social `-social-1200x630.jpg` (JPEG baseline 1200x630,
 * ≤ 300.000 B, sense APP1) a partir d'un cartell o imatge a `public/assets/`.
 * Per a cartells verticals (ex. 1131x1600), enfoca la franja superior (`posicioY`)
 * on viuen el títol, les dates i el municipi.
 */
export function generaVariantSocial1200x630(absInput, { posicioY = 0.05 } = {}) {
  const ext = path.extname(absInput);
  const absOutput = `${absInput.slice(0, -ext.length)}-social-1200x630.jpg`;
  const tmpOutput = `${absOutput}.tmp.jpg`;

  const pyScript = `
import sys
from PIL import Image, ImageChops

inp, out, pos_y, qual = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
im = Image.open(inp).convert('RGB')
bg = Image.new('RGB', im.size, (255, 255, 255))
diff = ImageChops.difference(im, bg).convert('L').point(lambda p: 255 if p > 18 else 0)
bbox = diff.getbbox()
if bbox and (bbox[2] - bbox[0]) > im.size[0] * 0.6:
    im = im.crop((bbox[0], bbox[1], bbox[2], im.size[1]))
w, h = im.size
target_w, target_h = 1200, 630
scale = max(target_w / w, target_h / h)
nw, nh = int(round(w * scale)), int(round(h * scale))
im_resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
left = max(0, (nw - target_w) // 2)
top = int(round(max(0, nh - target_h) * pos_y))
cropped = im_resized.crop((left, top, left + target_w, top + target_h))
cropped.save(out, format='JPEG', quality=qual, progressive=False, optimize=True)
`;

  for (const qual of [85, 82, 78, 74, 70]) {
    execFileSync('python3', ['-c', pyScript, absInput, tmpOutput, String(posicioY), String(qual)], { stdio: 'ignore' });
    const net = senseApp1(fs.readFileSync(tmpOutput));
    fs.unlinkSync(tmpOutput);
    if (net.length <= PES_MAXIM_WHATSAPP) {
      fs.writeFileSync(absOutput, net);
      return { fitxer: absOutput, bytes: net.length };
    }
  }
  throw new Error(`No s'ha pogut comprimir ${absInput} per davall de ${PES_MAXIM_WHATSAPP} B.`);
}

function main(argv) {
  let ara = undefined;
  let generaVariants = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--ara' && argv[i + 1]) {
      ara = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--genera-variants') {
      generaVariants = true;
    }
  }

  const eleccio = triaImatgeSeo(CURSOS_PEDRA_EN_SEC_2026_EVENT, { ara });
  const arrel = process.cwd();

  if (generaVariants) {
    const cartells = [
      '/assets/events/cartell_pedra_en_sec_fageca_2026.webp',
      '/assets/events/cartell_pedra_en_sec_alcosser_2026.webp'
    ];
    const generades = [];
    for (const rel of cartells) {
      const abs = path.join(arrel, 'public', rel);
      if (fs.existsSync(abs)) {
        generades.push(generaVariantSocial1200x630(abs, { posicioY: 0.05 }));
      }
    }
    console.log(JSON.stringify({ eleccio, generades }, null, 2));
    return;
  }

  console.log(JSON.stringify(eleccio, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
