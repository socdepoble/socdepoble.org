#!/usr/bin/env node
/**
 * tractor-viewbox.mjs — Cap SVG amb coordenades fora del llenç.
 *
 * Detecta el reemplaç massiu de viewBox 24→20 que va retallar totes les
 * icones Feather: cercles, línies i punts de polilínia per damunt del
 * límit declarat al viewBox.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ARREL = process.cwd();

function jsxRecursiu(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) jsxRecursiu(p, acc);
    else if (/\.jsx$/.test(f) && !/\.test\.jsx$/.test(f)) acc.push(p);
  }
  return acc;
}

const falles = [];
for (const fitxer of jsxRecursiu(join(ARREL, 'src'))) {
  const src = readFileSync(fitxer, 'utf8');
  for (const m of src.matchAll(/<svg[^>]*viewBox="0 0 (\d+) (\d+)"([\s\S]*?)<\/svg>/g)) {
    const [, w, h, cos] = m;
    const limit = Math.max(+w, +h);
    let maxim = 0;
    // Check lines and rects
    for (const m of cos.matchAll(/(?:x1|x2|y1|y2|width|height)="([\d.]+)"/g)) {
      maxim = Math.max(maxim, +m[1]);
    }
    // Check circles
    for (const m of cos.matchAll(/cx="([\d.]+)"\s+cy="([\d.]+)"\s+r="([\d.]+)"/g)) {
      maxim = Math.max(maxim, +m[1] + +m[3], +m[2] + +m[3]);
    }
    // Check other cx cy
    for (const m of cos.matchAll(/(?:cx|cy)="([\d.]+)"/g)) {
      maxim = Math.max(maxim, +m[1]);
    }
    if (maxim > limit) {
      falles.push(`${fitxer.replace(ARREL + '/', '')} · viewBox 0 0 ${w} ${h} però el traç arriba a ${maxim}.`);
    }
  }
}

if (falles.length) {
  console.error(`❌ [VIEWBOX] ${falles.length} infracció(ns):`);
  [...new Set(falles)].forEach((f) => console.error('   ' + f));
  process.exit(1);
}
console.log(`✅ [VIEWBOX] cap coordenada fora del llenç en SVGs`);
