/**
 * Onada R28 (Carril 3 · Marató Nocturna UX AAA i Responsive 360/375/393/1440)
 * Regressió de contrast WCAG AAA (>= 7:1) i contenció d'amplària mòbil:
 *   1. .btn-date-time usa --sdp-crom-pastilla-data / -hover / -viu i supera 7:1
 *      amb text blanc (--sdp-sobre-color) tant sobre --sdp-accent (barra taronja)
 *      com sobre --sdp-crom-barra-lector (verd de marca del Lector).
 *   2. Tota etiqueta enllaçada (.sp-card-label > a.sp-card-label) hereta color,
 *      neutralitza el coixí doble quan el <li> no porta --enllac i manté la diana
 *      tàctil de 48px sense usar cap pseudoclasse relacional.
 *   3. Les categories llargues dins de UniversalCard s'embolcallen sense desbordar
 *      a 360px preservant la regla base de 28px i l'especificitat (0,2,0).
 *   4. La prosa .cms-preview / .content-wrapper embolcalla URLs i <code> llargs
 *      des de modules.css sense alterar base.css, i <details> de /pobles amaga
 *      l'arbre quan està tancat (compatibilitat iOS 16/17 WKWebView + Chromium).
 *   5. Cap <Boto> del codi font usa varietats inexistents com varietat="terciari".
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (rel) => fs.readFileSync(path.resolve(ARREL, rel), 'utf8');
const senseComentaris = (txt) => txt.replace(/\/\*[\s\S]*?\*\//g, '');

function declaracions(txt) {
  return Object.fromEntries(
    [...senseComentaris(txt).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
}

function resol(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    if (vistos.has(nom) || !mapa[nom]) throw new Error(`Token invàlid: ${nom}`);
    return resol(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}

function parseHexRgb(valor) {
  const net = valor.trim();
  const coixinet = String.fromCharCode(35);
  if (!net.startsWith(coixinet) || net.length !== 7) {
    throw new Error(`S'esperava color de 6 xifres, s'ha rebut: ${valor}`);
  }
  return [1, 3, 5].map((i) => Number.parseInt(net.slice(i, i + 2), 16));
}

function parseRgba(valor) {
  const m = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(valor.trim());
  if (!m) throw new Error(`S'esperava rgba(), s'ha rebut: ${valor}`);
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: Number(m[4]) };
}

function componDamunt(velRgba, fonsRgb) {
  const { r, g, b, a } = velRgba;
  return [
    Math.round(r * a + fonsRgb[0] * (1 - a)),
    Math.round(g * a + fonsRgb[1] * (1 - a)),
    Math.round(b * a + fonsRgb[2] * (1 - a)),
  ];
}

function luminanciaRgb([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratioWcag(rgbA, rgbB) {
  const la = luminanciaRgb(rgbA);
  const lb = luminanciaRgb(rgbB);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('Onada R28 · UX responsive 360-1440 i contrast WCAG AAA', () => {
  const canon = llig('src/css/design-tokens.css');
  const tokens = llig('src/css/tokens.css');
  const base = llig('src/css/base.css');
  const layout = llig('src/css/layout.css');
  const components = llig('src/css/components.css');
  const modules = llig('src/css/modules.css');
  const primerFosc = tokens.indexOf(':root[data-theme="dark"]');
  const mapaClar = { ...declaracions(canon), ...declaracions(tokens.slice(0, primerFosc)) };

  test('.btn-date-time arriba a WCAG AAA (>= 7:1) en repòs, hover i actiu sobre taronja i sobre el verd del Lector', () => {
    const blanc = parseHexRgb(resol('var(--sdp-sobre-color)', mapaClar));
    const taronja = parseHexRgb(resol('var(--sdp-accent)', mapaClar));
    const verdLector = parseHexRgb(resol('var(--sdp-crom-barra-lector)', mapaClar));

    for (const tokenVel of [
      '--sdp-crom-pastilla-data',
      '--sdp-crom-pastilla-data-hover',
      '--sdp-crom-pastilla-data-viu',
    ]) {
      const vel = parseRgba(resol(`var(${tokenVel})`, mapaClar));
      expect(ratioWcag(blanc, componDamunt(vel, taronja)), `${tokenVel} sobre taronja`).toBeGreaterThanOrEqual(7);
      expect(ratioWcag(blanc, componDamunt(vel, verdLector)), `${tokenVel} sobre verd Lector`).toBeGreaterThanOrEqual(7);
    }

    expect(senseComentaris(layout)).toMatch(/\.btn-date-time\s*\{[^}]*background:\s*var\(--sdp-crom-pastilla-data\);/);
    expect(senseComentaris(layout)).toMatch(/\.btn-date-time:hover\s*\{[^}]*background:\s*var\(--sdp-crom-pastilla-data-hover\);/);
    expect(senseComentaris(components)).toMatch(/button\.btn-date-time:active:not\(:disabled\)\s*\{[^}]*background:\s*var\(--sdp-crom-pastilla-data-viu\);/);
  });

  test('.sp-card-label > a.sp-card-label conserva el color heretat AAA, elimina el coixí doble i manté la diana de 48px', () => {
    const net = senseComentaris(components);
    expect(net).toContain('.sp-card-label > a.sp-card-label');
    expect(net).toMatch(/\.sp-card-label > a\.sp-card-label,\s*\.sp-card-label--enllac > \.sp-card-label\s*\{[^}]*color:\s*inherit;[^}]*text-decoration:\s*none;/);
    expect(net).toMatch(/\.sp-card-label--enllac > a\.sp-card-label,\s*\.sp-card-label--enllac > \.sp-card-label\s*\{[^}]*margin-inline:\s*0;/);
    expect(net).toContain('.sp-card-label > a.sp-card-label::after');
    expect(net).not.toContain(':has(');
  });

  test('les etiquetes llargues de UniversalCard i les URLs de .cms-preview no desborden a 360px sense alterar base.css', () => {
    const netComp = senseComentaris(components);
    const netMod = senseComentaris(modules);
    expect(netComp).toMatch(/:where\(\.sp-card-body\) > \.sp-card-labels \.sp-card-label\s*\{[^}]*max-inline-size:\s*100%;[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*break-word;/);
    expect(netMod).toMatch(/\.sdp-xarxa-pobles__desplegable:not\(\[open\]\) > \.sdp-xarxa-pobles__arbre\s*\{\s*display:\s*none;\s*\}/);
    expect(netMod).toMatch(/:where\(\.cms-preview, \.content-wrapper\) :where\(a, code\)\s*\{\s*overflow-wrap:\s*break-word;\s*\}/);
    expect(senseComentaris(base)).not.toContain('cms-preview) :where(a, code)');
  });

  test('cap <Boto> en src/ usa una varietat inexistent fora del catàleg canònic de Boto.jsx', () => {
    const VALIDES = new Set(['primari', 'secundari', 'accent', 'perill', 'fantasma']);
    const males = [];
    function recorre(dir) {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const ruta = path.join(dir, ent.name);
        if (ent.isDirectory()) recorre(ruta);
        else if (/\.(js|jsx)$/.test(ent.name) && !ent.name.includes('.test.')) {
          const codi = fs.readFileSync(ruta, 'utf8');
          for (const m of codi.matchAll(/<Boto\b[^>]*\bvarietat="([^"]+)"/g)) {
            if (!VALIDES.has(m[1])) males.push(`${path.relative(ARREL, ruta)}: ${m[1]}`);
          }
        }
      }
    }
    recorre(path.resolve(ARREL, 'src'));
    expect(males).toEqual([]);
  });
});
