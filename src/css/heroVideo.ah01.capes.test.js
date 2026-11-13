// @vitest-environment node
/* AH-01 (Cua d'Auditoria Humana del Mestre, 261104 16:59) · En mòbil i en mode
   compacte el vídeo protagonista va de vora a vora, sense franges negres; en
   escriptori conserva l'alçada màxima i l'encaix sencer. Regla aportada pel kit
   de Gemini (v2.2) i integrada per Claude. jsdom no pinta: es comproven les
   regles escrites, sense comentaris. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import { describe, expect, test } from 'vitest';

const COMPONENTS = readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const reglaDe = (selector, des = 0) => {
  const inici = COMPONENTS.indexOf(`${selector} {`, des);
  if (inici === -1) return null;
  return net(COMPONENTS.slice(COMPONENTS.indexOf('{', inici) + 1, COMPONENTS.indexOf('}', inici)));
};
const ESCRIPTORI_PROPORCIO_NATURAL = 'width: 100%; height: auto; max-height: min(75vh, 720px); object-fit: contain; display: block; margin: 0 auto;';
const VORA_A_VORA = 'width: 100%; height: auto; max-height: none; object-fit: cover;';

describe('AH-01 + R22.1 · vídeo protagonista 16:9 i 9:16 sense deformació · components.css', () => {
  /* R22.1 (r221-text-10) · El títol diu el que es prova: el text de la regla.
     Que un 16:9 i un 9:16 es vegen sencers, sense retall, ho prova la
     geometria de baix (contenidor i reproductor junts). */
  test('en escriptori el reproductor no força cap proporció: height auto, object-fit contain i alçada màxima min(75vh, 720px), sense aspect-ratio', () => {
    const regla = reglaDe('.sdp-hero-video__player');
    expect(regla).toBe(ESCRIPTORI_PROPORCIO_NATURAL);
    expect(regla).not.toMatch(/aspect-ratio/);
  });

  test('en mode compacte el reproductor ocupa tota l’amplària i no deixa franges', () => {
    expect(reglaDe(':where(.sdp-root.is-compact) .sdp-hero-video__player')).toBe(VORA_A_VORA);
  });

  test('sota 768 px passa el mateix, també fora de l’arrel compacta', () => {
    const media = COMPONENTS.indexOf('@media (max-width: 767px) {\n  .sdp-hero-video__player');
    expect(media).toBeGreaterThan(-1);
    expect(reglaDe('.sdp-hero-video__player', media)).toBe(VORA_A_VORA);
  });

  test('el contenidor continua amb cantons quadrats (sense border-radius)', () => {
    expect(reglaDe('.sdp-hero-video')).not.toMatch(/border-radius/);
  });
});

/* R22.1 (r221-ui-10) · LA GEOMETRIA, CONTENIDOR I REPRODUCTOR JUNTS.
   Les proves de damunt comparen cada regla per separat i no veien que, en
   mòbil i en compacte, el reproductor anava sense límit d'alçada (AH-01)
   mentre el contenidor .sdp-hero-video conservava el seu min(75vh, 720px) i
   l'overflow hidden: un vídeo 9:16 de 375 px (667 px d'alt) perdia 58 px de
   baix, la barra de controls nativa inclosa. Ací es resol la cascada de
   components.css per a cada pantalla (totes les regles són de la capa
   components i de la mateixa especificitat: mana l'última que s'aplica) i
   es calcula el que es retalla d'un vídeo 16:9 i d'un 9:16 a tota l'amplària. */
const CONTENIDOR = '.sdp-hero-video';
const REPRODUCTOR = '.sdp-hero-video__player';
const COMPACTE = ':where(.sdp-root.is-compact) ';

function reglesDeLaCascada() {
  const trobades = [];
  postcss.parse(readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8')).walkRules((regla) => {
    for (const selector of regla.selector.split(',').map((s) => s.replace(/\s+/g, ' ').trim())) {
      const objectiu = [CONTENIDOR, REPRODUCTOR].find((o) => selector === o || selector === `${COMPACTE}${o}`);
      if (!objectiu) continue;
      const capes = [];
      const medies = [];
      for (let pare = regla.parent; pare; pare = pare.parent) {
        if (pare.type === 'atrule' && pare.name === 'layer') capes.push(pare.params);
        else if (pare.type === 'atrule') medies.push(`@${pare.name} ${pare.params}`);
      }
      const decls = {};
      regla.walkDecls((decl) => { decls[decl.prop] = decl.value.trim(); });
      trobades.push({ objectiu, compacte: selector.startsWith(COMPACTE), capes, medies, decls });
    }
  });
  return trobades;
}

/** px d'una alçada: 'none', Npx, Nvh o min(…, …). */
function px(valor, alt) {
  const net = String(valor).trim();
  if (net === 'none') return Infinity;
  const min = /^min\((.*)\)$/.exec(net);
  if (min) return Math.min(...min[1].split(',').map((tros) => px(tros, alt)));
  const nombre = /^(\d*\.?\d+)(px|vh)$/.exec(net);
  if (!nombre) throw new Error(`Alçada no prevista: ${net}`);
  return nombre[2] === 'vh' ? (Number(nombre[1]) * alt) / 100 : Number(nombre[1]);
}

/** Les propietats que manen per a `objectiu` en una pantalla (ample × alt, compacta o no). */
function resol(regles, objectiu, { ample, compacte }) {
  const resultat = {};
  for (const regla of regles) {
    if (regla.objectiu !== objectiu || (regla.compacte && !compacte)) continue;
    const aplica = regla.medies.every((media) => {
      const maxim = /^@media \(max-width: (\d+)px\)$/.exec(media);
      if (!maxim) throw new Error(`@media no prevista per al vídeo protagonista: ${media}`);
      return ample <= Number(maxim[1]);
    });
    if (aplica) Object.assign(resultat, regla.decls);
  }
  return resultat;
}

/** Quants px es retallen d'un vídeo de proporció alt/ample `proporcio` a tota l'amplària. */
function retall(regles, pantalla, proporcio) {
  const contenidor = resol(regles, CONTENIDOR, pantalla);
  const reproductor = resol(regles, REPRODUCTOR, pantalla);
  expect(reproductor.width).toBe('100%');
  expect(reproductor.height).toBe('auto');
  const alcadaReproductor = Math.min(pantalla.ample * proporcio, px(reproductor['max-height'] ?? 'none', pantalla.alt));
  if (contenidor.overflow !== 'hidden') return 0;
  return Math.max(0, alcadaReproductor - px(contenidor['max-height'] ?? 'none', pantalla.alt));
}

describe('R22.1 · el vídeo protagonista no es retalla: contenidor i reproductor junts', () => {
  const regles = reglesDeLaCascada();

  test('totes les regles són de la capa components i de la mateixa especificitat (mana l’ordre)', () => {
    expect(regles.length).toBeGreaterThan(0);
    for (const regla of regles) expect(regla.capes).toEqual(['components']);
  });

  test.each([
    ['mòbil 375 × 812', { ample: 375, alt: 812, compacte: false }],
    ['mòbil 390 × 844', { ample: 390, alt: 844, compacte: false }],
    ['mòbil compacte 375 × 812', { ample: 375, alt: 812, compacte: true }],
    ['tauleta compacta 768 × 1024', { ample: 768, alt: 1024, compacte: true }],
    ['compacte 1023 × 768', { ample: 1023, alt: 768, compacte: true }],
    ['escriptori 1280 × 800', { ample: 1280, alt: 800, compacte: false }],
    ['escriptori 1440 × 900', { ample: 1440, alt: 900, compacte: false }],
  ])('%s: ni el 16:9 ni el 9:16 perden cap píxel (ni la barra de controls)', (_nom, pantalla) => {
    expect(retall(regles, pantalla, 9 / 16)).toBe(0);
    expect(retall(regles, pantalla, 16 / 9)).toBe(0);
  });

  test('la guarda veu el retall d’abans: el contenidor amb min(75vh, 720px) i el reproductor sense límit', () => {
    const abans = [
      { objectiu: CONTENIDOR, compacte: false, capes: ['components'], medies: [], decls: { overflow: 'hidden', 'max-height': 'min(75vh, 720px)' } },
      { objectiu: REPRODUCTOR, compacte: false, capes: ['components'], medies: [], decls: { width: '100%', height: 'auto', 'max-height': 'min(75vh, 720px)' } },
      { objectiu: REPRODUCTOR, compacte: false, capes: ['components'], medies: ['@media (max-width: 767px)'], decls: { width: '100%', height: 'auto', 'max-height': 'none' } },
    ];
    expect(retall(abans, { ample: 375, alt: 812, compacte: false }, 16 / 9)).toBeCloseTo(57.67, 1);
  });
});
