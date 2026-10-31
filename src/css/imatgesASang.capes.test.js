// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 2) · La Llei Visual del quadrat
   i les imatges a sang, fixades sobre la regla escrita (jsdom no calcula
   capes, aspect-ratio ni object-fit; mateix patró que la resta de proves
   *.capes de src/css):
     · «Totes les imatges a la Consola s'han de visualitzar sempre de forma
       quadrada (aspect-ratio: 1/1 i object-fit: cover centrat).»
     · «eradicar qualsevol marc blanc (borders, fons, padding amb fons blanc
       darrere la imatge) a la Consola i especialment al Mur. El disseny és a
       sang, sense línies.»
   No és cap mesura de píxels: diu què declara el full i en quina capa. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (rel) => readFileSync(path.join(process.cwd(), rel), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Les regles fulla d'un full: { prelud, cos, pares } (els pares són els @layer, @media… que l'embolcallen). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.slice(tros.lastIndexOf(';') + 1).trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
const selectors = (r) => r.prelud.split(',').map((s) => s.trim());
const declaracions = (r) => Object.fromEntries(r.cos.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
  const tall = d.indexOf(':');
  return [d.slice(0, tall).trim(), d.slice(tall + 1).trim()];
}));
/** Totes les declaracions que un selector exacte rep en un full, en ordre (l'última mana dins de la mateixa capa i pes). */
const deSelector = (full, selector) => full.filter((r) => selectors(r).includes(selector));
const valor = (full, selector, propietat) => deSelector(full, selector).map((r) => declaracions(r)[propietat]).filter((v) => v !== undefined).at(-1);

const MODULS = regles(llig('src/css/modules.css'));
const COMPONENTS = regles(llig('src/css/components.css'));

/* El que fa un marc al voltant o darrere d'una imatge. */
const MARC = ['border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-block', 'border-inline',
  'padding', 'padding-block', 'padding-inline', 'outline', 'box-shadow', 'background', 'background-color'];

describe('Llei Visual del quadrat · tota imatge de la Consola', () => {
  /* Ordre del Mestre, 30-10-2026 (/consola, punt 2.1: «Fora la miniatura
     repetida») · L'Índex ja no pinta cap miniatura: la llei només cobrix el
     mitjà de les targetes. Derogat: .sdp-consola__index-imatge a les dues
     llistes. */
  const QUADRADES = ['.sdp-consola__targeta .sp-card-media-container', '.sdp-consola__targeta .sp-card-media'];
  const IMATGES = ['.sdp-consola__targeta .sp-card-media'];

  test('quadrada: aspect-ratio 1 / 1 per al mitjà de la targeta, amb el seu contenidor', () => {
    for (const s of QUADRADES) expect(valor(MODULS, s, 'aspect-ratio'), s).toBe('1 / 1');
  });

  test('retallada i centrada: object-fit cover i object-position center', () => {
    for (const s of IMATGES) {
      expect(valor(MODULS, s, 'object-fit'), s).toBe('cover');
      expect(valor(MODULS, s, 'object-position'), s).toBe('center');
    }
  });

  test('viu a @layer components, on guanya a la Targeta Universal per especificitat (dues classes contra una)', () => {
    for (const s of QUADRADES) {
      const on = deSelector(MODULS, s);
      expect(on.length, s).toBeGreaterThan(0);
      for (const r of on) expect(r.pares, s).toEqual(['@layer components']);
    }
    // La base que la Consola centra: quadrada i amb `cover`, però ancorada a dalt; viu a la mateixa capa.
    expect(valor(COMPONENTS, '.sp-card-media', 'object-position')).toBe('top');
    expect(valor(COMPONENTS, '.sp-card-media', 'object-fit')).toBe('cover');
    expect(valor(COMPONENTS, '.sp-card-media-container', 'aspect-ratio')).toBe('1 / 1');
    for (const r of deSelector(COMPONENTS, '.sp-card-media')) expect(r.pares).toEqual(['@layer components']);
  });

  test('cap regla de la Consola torna a deformar una imatge (cap altra relació, cap contain, cap fill)', () => {
    const deLaConsola = [...MODULS, ...COMPONENTS].filter((r) => /sdp-consola/.test(r.prelud));
    for (const r of deLaConsola) {
      const d = declaracions(r);
      if (d['aspect-ratio'] !== undefined) expect(d['aspect-ratio'], r.prelud).toBe('1 / 1');
      if (d['object-fit'] !== undefined) expect(d['object-fit'], r.prelud).toBe('cover');
      if (d['object-position'] !== undefined) expect(d['object-position'], r.prelud).toBe('center');
    }
  });

  test('l’avatar de la boina ja és un quadrat de 48 amb cover (el cercle el talla): la llei no el toca', () => {
    const avatar = declaracions(deSelector(COMPONENTS, '.sp-card-avatar')[0]);
    expect([avatar.width, avatar.height, avatar['object-fit'], avatar['border-radius']]).toEqual(['48px', '48px', 'cover', '50%']);
    expect(avatar['object-position']).toBeUndefined();
  });
});

describe('a sang · cap marc darrere ni al voltant de la imatge', () => {
  /* Ordre del Mestre, 30-10-2026 (/consola, punt 2.1) · Derogat: «la
     miniatura de l'Índex no porta vora…; només mida, marge i radi». La
     miniatura ja no existix, i cap regla del full la torna a dibuixar. */
  test('l’Índex no té cap miniatura: cap regla de cap full nomena .sdp-consola__index-imatge', () => {
    expect(deSelector(MODULS, '.sdp-consola__index-imatge')).toEqual([]);
    expect([...MODULS, ...COMPONENTS].filter((r) => r.prelud.includes('__index-imatge')).map((r) => r.prelud)).toEqual([]);
  });

  test('l’avatar de la targeta i de la barra taronja no porta cap fons darrere de la imatge', () => {
    const avatar = deSelector(COMPONENTS, '.sp-card-avatar');
    expect(avatar).toHaveLength(1);
    const d = declaracions(avatar[0]);
    expect(d.background).toBeUndefined();
    expect(d['background-color']).toBeUndefined();
    expect(d.border).toBeUndefined();
    expect(d.padding).toBeUndefined();
    // L'ombra de sempre es queda (no és cap marc blanc), i la reserva sense avatar conserva el seu fons.
    expect(d['box-shadow']).toBe('var(--sdp-ombra-1)');
    expect(valor(COMPONENTS, '.sp-card-avatar--fallback', 'background')).toBe('var(--sdp-fons-invers)');
  });

  test('el mitjà de la Targeta Universal va de vora a vora: ni la imatge ni el seu contenidor porten vora, farcit, contorn ni ombra', () => {
    const SENSE_FONS = MARC.filter((p) => !p.startsWith('background'));
    for (const s of ['.sp-card-media-container', '.sp-card-media']) {
      for (const full of [COMPONENTS, MODULS]) {
        for (const r of full.filter((x) => selectors(x).some((sel) => sel === s || sel.endsWith(` ${s}`) || sel.endsWith(`> ${s}`)))) {
          const d = declaracions(r);
          for (const p of SENSE_FONS) expect(d[p], `${r.prelud} · ${p}`).toBeUndefined();
        }
      }
    }
    // La targeta base tampoc no en posa al voltant: sense vora ni farcit propis, i el que sobreïx es talla.
    const targeta = Object.assign({}, ...deSelector(COMPONENTS, '.sp-card').map(declaracions));
    expect(targeta.border).toBeUndefined();
    expect(targeta.padding).toBeUndefined();
    expect(targeta.overflow).toBe('hidden');
  });

  test('cap regla de la Consola posa vora, farcit, contorn, ombra o fons a una imatge', () => {
    const imatges = [...MODULS, ...COMPONENTS].filter((r) => /sdp-consola/.test(r.prelud) && /(\bimg\b|sp-card-media|sp-card-avatar|__index-imatge)/.test(r.prelud));
    expect(imatges.length).toBeGreaterThan(0);
    for (const r of imatges) {
      const d = declaracions(r);
      for (const p of MARC) expect(d[p], `${r.prelud} · ${p}`).toBeUndefined();
    }
  });
});
