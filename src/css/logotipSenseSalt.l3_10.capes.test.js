// @vitest-environment node
/* v1.2.23 · L3-10 (ordre del Mestre 261123) · El logotip de la barra negra no fa cap salt entre 480 i 481 px.

   Abans (estat T1 de la v1.2.23): fins a 480 px el logotip feia 146×38 (IDEA-323.2, sostre de 38 px) i, des de 481 px
   fins a 1023 px, la regla base el fixava a 130 px d'ample (130×34): un salt de 16 px d'ample i 4 px d'alt en un píxel.
   Ara la regla base fa 38 px d'alt (un únic tram) i el logotip fa 146×38 a tot el compacte, mentre hi cap.

   jsdom no fa layout: esta prova resol la cascada escrita de layout.css per a `.mobile-logo-wrapper img` a cada amplària
   del contenidor sdp-arrel (base + @container sdp-arrel (max-width: N px), en ordre de font; les branques
   @supports not (container-type: inline-size) són la xarxa del Baseline 2022 i ací no compten) i en calcula la mida amb
   l'algorisme de CSS 2.1 §10.4 per a elements reemplaçats, amb la mida natural llegida de la capçalera del PNG que
   pinta BrandMark. La guarda es prova també contra la regla literal d'abans: si no hi veiera el salt, no guardaria res.
   La geometria real la va mesurar Chrome headless (arnés del carril, 20 amplàries de 280 a 1023 px): 480 → 146,2×37,98 i
   481 → 146,2×38, x = 16 i y = 12,5 a les dues. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const SELECTOR = '.mobile-logo-wrapper img';
const ORDRE_DE_CAPES = ['reset', 'sdp', 'legacy', 'components', 'utilities'];

/* ── La mida natural del logotip de la barra negra: el PNG de BrandMark (variant light) ── */
const BRAND = llig('src/components/BrandMark.jsx');
const RUTA_LOGOTIP = /light:\s*'([^']+\.png)'/.exec(BRAND)?.[1];
function midaDelPng(ruta) {
  const bytes = readFileSync(resolve(process.cwd(), 'public', ruta.replace(/^\//, '')));
  expect(bytes.subarray(12, 16).toString('latin1')).toBe('IHDR');
  return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
}

/* ── Un arbre mínim de blocs: { preludi, fills } o { selector, cos }, amb les condicions que l'envolten ── */
function regles(css) {
  const text = senseComentaris(css);
  const eixida = [];
  const pila = [];
  let inici = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '{') {
      pila.push({ preludi: net(text.slice(inici, i)), obert: i + 1 });
      inici = i + 1;
    } else if (c === '}') {
      const bloc = pila.pop();
      const preludi = bloc.preludi.replace(/^[^{}]*;/, '').trim();
      if (!preludi.startsWith('@')) {
        const context = pila.map((b) => b.preludi.replace(/^[^{}]*;/, '').trim());
        eixida.push({ selectors: preludi.split(',').map(net), cos: text.slice(bloc.obert, i), context });
      }
      inici = i + 1;
    } else if (c === ';' && pila.length && text.lastIndexOf('{', i) < text.lastIndexOf('}', i)) {
      inici = i + 1;
    }
  }
  return eixida;
}

/* Les condicions d'una regla a l'amplària `w` del contenidor. Una at-rule desconeguda fa fallar la prova: el model
   només val mentre sap llegir tot el que envolta el logotip. */
function aplica(context, w) {
  let capa = null;
  for (const preludi of context) {
    let m;
    if ((m = /^@layer\s+([\w-]+)$/.exec(preludi))) { capa = m[1]; continue; }
    if ((m = /^@container sdp-arrel \(max-width: (\d+)px\)$/.exec(preludi))) { if (w > Number(m[1])) return null; continue; }
    if (preludi === '@supports not (container-type: inline-size)') return null;
    throw new Error(`At-rule que el model no sap llegir al voltant de ${SELECTOR}: ${preludi}`);
  }
  return { capa: capa ?? 'legacy' };
}

const declaracions = (cos) => Object.fromEntries(cos.split(';').map((d) => d.split(':')).filter((p) => p.length >= 2)
  .map(([p, ...v]) => [p.trim(), v.join(':').replace('!important', '').trim()]));

/** Les declaracions guanyadores per a SELECTOR a l'amplària w (mateixa especificitat: capa i, dins, ordre de font). */
function cascada(llistaDeRegles, w) {
  const casades = llistaDeRegles
    .map((regla, ordre) => ({ ...regla, ordre }))
    .filter((regla) => regla.selectors.includes(SELECTOR))
    .map((regla) => ({ ...regla, condicio: aplica(regla.context, w) }))
    .filter((regla) => regla.condicio)
    .sort((a, b) => (ORDRE_DE_CAPES.indexOf(a.condicio.capa) - ORDRE_DE_CAPES.indexOf(b.condicio.capa)) || (a.ordre - b.ordre));
  return Object.assign({}, ...casades.map((regla) => declaracions(regla.cos)));
}

/* ── CSS 2.1 §10.4 (reemplaçats): width/height en px o auto; max-* en px, % (de l'espai) o none ── */
const px = (valor, espai) => {
  if (valor == null || valor === 'none' || valor === 'auto') return null;
  if (/^\d+(\.\d+)?px$/.test(valor)) return Number.parseFloat(valor);
  if (/^\d+(\.\d+)?%$/.test(valor)) return (Number.parseFloat(valor) / 100) * espai;
  throw new Error(`Valor que el model no sap resoldre: ${valor}`);
};
function midaDelLogotip(decl, natural, espai) {
  const r = natural.w / natural.h;
  const maxW = px(decl['max-width'], espai) ?? Infinity;
  const maxH = px(decl['max-height'], espai) ?? Infinity;
  for (const prohibida of ['min-width', 'min-height']) {
    if (decl[prohibida] && !/^0(px)?$/.test(decl[prohibida])) throw new Error(`${prohibida} fora del model`);
  }
  const amplada = px(decl.width, espai);
  const alcada = px(decl.height, espai);
  if (amplada != null && alcada != null) return { w: Math.min(amplada, maxW), h: Math.min(alcada, maxH) };
  if (alcada != null) { const h = Math.min(alcada, maxH); return { w: Math.min(h * r, maxW), h }; }
  if (amplada != null) { const w = Math.min(amplada, maxW); return { w, h: Math.min(w / r, maxH) }; }
  let { w, h } = natural;
  if (w > maxW && h > maxH) {
    if (maxW / w <= maxH / h) { h = maxW / r; w = maxW; } else { w = maxH * r; h = maxH; }
  } else if (w > maxW) { h = maxW / r; w = maxW; } else if (h > maxH) { w = maxH * r; h = maxH; }
  return { w, h };
}

/* L'espai per al logotip dins de la barra: l'amplària, menys el coixí esquerre de la cel·la (16), les quatre dianes de
   48 px, el respir de 8 px i el coixí dret de la barra (8). És una cota baixa: Chrome n'hi dona més a partir de 481 px. */
const espaiDelLogotip = (w) => w - 16 - 4 * 48 - 8 - 8;

const NATURAL = midaDelPng(RUTA_LOGOTIP);
const LAYOUT = regles(llig('src/css/layout.css'));
const mida = (llista, w) => midaDelLogotip(cascada(llista, w), NATURAL, espaiDelLogotip(w));

/* La regla base literal d'abans (estat T1 de la v1.2.23), per a provar que la guarda veu el salt. */
const BASE_D_ABANS = '.mobile-logo-wrapper img { width: 130px; height: auto; max-width: 130px; object-fit: contain; }';
const ABANS = regles(llig('src/css/layout.css').replace(
  /\.mobile-logo-wrapper img \{ width: auto; height: 38px; max-width: 100%; object-fit: contain; \}/, BASE_D_ABANS));

describe('L3-10 · el logotip de la barra negra, sense salt a 480/481 px', () => {
  test('el model llig el logotip de BrandMark i totes les regles que el dimensionen són de layout.css', () => {
    expect(RUTA_LOGOTIP).toBe('/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png');
    expect(NATURAL).toEqual({ w: 985, h: 256 });
    expect(BRAND).toContain('width="300" height="78"');
    for (const full of ['src/css/modules.css', 'src/css/components.css', 'src/css/utilities.css', 'src/css/base.css', 'src/css/app-grid-shell.css']) {
      const alienes = regles(llig(full)).filter((regla) => regla.selectors.some((s) => /\.mobile-logo-wrapper\s+img$/.test(s)));
      expect(alienes, full).toEqual([]);
    }
    expect(LAYOUT.filter((regla) => regla.selectors.includes(SELECTOR)).length).toBeGreaterThanOrEqual(3);
  });

  test('a 480 i a 481 px el logotip fa el mateix: 146×38 (IDEA-323.2), amb menys de 2 px de diferència', () => {
    const a480 = mida(LAYOUT, 480);
    const a481 = mida(LAYOUT, 481);
    expect(Math.round(a480.w)).toBe(146);
    expect(a480.h).toBeLessThanOrEqual(38);
    expect(a480.h).toBeGreaterThan(37.9);
    expect(Math.abs(a481.w - a480.w)).toBeLessThanOrEqual(2);
    expect(Math.abs(a481.h - a480.h)).toBeLessThanOrEqual(2);
  });

  test('un únic tram: de 440 a 1023 px cap pas d’1 px mou el logotip més de 2 px, i fa 146×38 a tot arreu', () => {
    let anterior = mida(LAYOUT, 440);
    for (let w = 441; w <= 1023; w += 1) {
      const ara = mida(LAYOUT, w);
      expect(Math.abs(ara.w - anterior.w), `${w - 1} → ${w} px`).toBeLessThanOrEqual(2);
      expect(Math.abs(ara.h - anterior.h), `${w - 1} → ${w} px`).toBeLessThanOrEqual(2);
      expect(Math.round(ara.w), `${w} px`).toBe(146);
      anterior = ara;
    }
  });

  test('la guarda veu el salt de la regla d’abans (130 px d’ample des de 481 px)', () => {
    expect(ABANS).not.toEqual(LAYOUT);
    const a480 = mida(ABANS, 480);
    const a481 = mida(ABANS, 481);
    expect(Math.round(a481.w)).toBe(130);
    expect(Math.abs(a481.w - a480.w)).toBeGreaterThan(2);
  });

  test('els dos blocs ≤ 480 px (IDEA-323.2) no canvien: sostre de 38 px i max-width: 100%', () => {
    const estrets = LAYOUT.filter((regla) => regla.selectors.includes(SELECTOR) && regla.context.some((p) => /max-width: 480px/.test(p)));
    expect(estrets).toHaveLength(2);
    for (const regla of estrets) {
      expect(declaracions(regla.cos)).toMatchObject({ width: 'auto', height: 'auto', 'max-height': '38px', 'max-width': '100%', 'object-fit': 'contain' });
    }
  });
});
