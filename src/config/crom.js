/**
 * crom.js — rotació de to sobre les rampes primitives de Pedra Seca.
 *
 * PER QUÈ EXISTIX
 * tokens.css:9-14 diu dos coses que este mòdul només obeïx: que les rampes
 * es van generar «en OKLCH amb to i croma de marca constants; només varia
 * la lluminositat», i que la capa semàntica és «l'única superfície que
 * exposarà el tauler de control». Ací es conserva L i C de cada esglaó i
 * es gira només el to: per això els contrastos anotats a tokens.css
 * (5,23:1, 9,21:1, 7,97:1…) segueixen valent després del canvi.
 *
 * BASELINE 2022
 * oklch() en CSS no arriba fins a Chrome 111 ni FF 113. Ací la conversió
 * viu en JS i el que s'escriu és hex. Zero dependències.
 *
 * INVARIANT
 * llegirBase() s'ha de cridar ABANS de la primera escriptura sobre eixe
 * element; després getComputedStyle ja tornaria els valors girats.
 */

const CLAMP01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const cub = (x) => x * x * x;
const aLineal = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const aGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function hexARgb(hex) {
  const net = String(hex).trim().replace('#', '');
  const ple = net.length === 3 ? net.split('').map((c) => c + c).join('') : net;
  if (!/^[0-9a-f]{6}$/i.test(ple)) return null;
  return [0, 2, 4].map((i) => parseInt(ple.slice(i, i + 2), 16) / 255);
}

export function rgbAHex([r, g, b]) {
  const canal = (c) => Math.round(CLAMP01(c) * 255).toString(16).padStart(2, '0');
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

/** sRGB → OKLab (Ottosson). */
export function rgbAOklab([r, g, b]) {
  const R = aLineal(r), G = aLineal(g), B = aLineal(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ];
}

export function oklabARgb([L, a, b]) {
  const l = cub(L + 0.3963377774 * a + 0.2158037573 * b);
  const m = cub(L - 0.1055613458 * a - 0.0638541728 * b);
  const s = cub(L - 0.0894841775 * a - 1.2914855480 * b);
  return [
    aGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    aGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    aGamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
  ];
}

const DINS = (rgb) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);

/**
 * OKLCH → hex amb reducció de croma. Girar el to a L i C constants trau
 * alguns colors fora de sRGB; abaixar el croma conserva la lluminositat,
 * que és el que sosté el contrast. Retallar el canal, no.
 */
export function oklchAHex({ L, C, H }) {
  const rad = (H * Math.PI) / 180;
  const prova = (c) => oklabARgb([L, c * Math.cos(rad), c * Math.sin(rad)]);
  let candidat = prova(C);
  if (DINS(candidat)) return rgbAHex(candidat);

  let baix = 0, alt = C;
  candidat = prova(0);
  for (let i = 0; i < 24; i += 1) {
    const mig = (baix + alt) / 2;
    const actual = prova(mig);
    if (DINS(actual)) { candidat = actual; baix = mig; }
    else { alt = mig; }
  }
  return rgbAHex(candidat);
}

export function hexAOklch(hex) {
  const rgb = hexARgb(hex);
  if (!rgb) return null;
  const [L, a, b] = rgbAOklab(rgb);
  return { L, C: Math.hypot(a, b), H: (Math.atan2(b, a) * 180) / Math.PI };
}

/** Delta 0 torna el mateix hex: identitat exacta, sense anada i tornada. */
export function giraTo(hex, delta) {
  if (!delta) return hex;
  const c = hexAOklch(hex);
  return c ? oklchAHex({ ...c, H: c.H + delta }) : hex;
}

const RGBA = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+)\s*)?\)/gi;

/** Gira el to de cada rgb()/rgba() d'una cadena i conserva l'alfa. */
export function giraTintes(valor, delta) {
  if (!delta) return valor;
  return String(valor).replace(RGBA, (_t, r, g, b, a) => {
    const girat = hexARgb(giraTo(rgbAHex([r / 255, g / 255, b / 255]), delta));
    const c = (x) => Math.round(x * 255);
    return a === undefined
      ? `rgb(${c(girat[0])}, ${c(girat[1])}, ${c(girat[2])})`
      : `rgba(${c(girat[0])}, ${c(girat[1])}, ${c(girat[2])}, ${a})`;
  });
}

export const RAMPES = ['primary', 'secondary'];
export const ESGLAONS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
export const CANON_BLAU = '--sdp-canon-blau';
const CANONS = [CANON_BLAU, '--sdp-canon-taronja'];

/* Tintes derivades a mà del cànon (vegeu tokens.css:268-276). Si no es giren, els anells
   de focus es queden amb el to vell i es nota. L'error, l'avís i l'èxit NO entren:
   són semàntics, no de marca. */
const TINTES = ['--sdp-anell-accio', '--sdp-anell-accent', '--sdp-accent-vel', '--sdp-ombra-accio'];

const BASES = new WeakMap();

function llegirBase(arrel) {
  const cs = getComputedStyle(arrel);
  const llig = (nom) => cs.getPropertyValue(nom).trim();
  const esglaons = {};
  for (const rampa of RAMPES) {
    for (const pas of ESGLAONS) esglaons[`--sdp-${rampa}-${pas}`] = llig(`--sdp-${rampa}-${pas}`);
  }
  const canons = Object.fromEntries(CANONS.map((n) => [n, llig(n)]));
  const tintes = Object.fromEntries(TINTES.map((n) => [n, llig(n)]));
  return { esglaons, canons, tintes, to: hexAOklch(canons[CANON_BLAU])?.H ?? 0 };
}

/** Memoritza la paleta canònica. Cridar-ho abans de la primera escriptura. */
export function base(arrel) {
  if (!BASES.has(arrel)) BASES.set(arrel, llegirBase(arrel));
  return BASES.get(arrel);
}

export function aplica(arrel, delta) {
  const b = base(arrel);
  for (const [nom, valor] of Object.entries(b.esglaons))
    arrel.style.setProperty(nom, giraTo(valor, delta));
  for (const [nom, valor] of Object.entries(b.canons))
    arrel.style.setProperty(nom, giraTo(valor, delta));
  for (const [nom, valor] of Object.entries(b.tintes))
    arrel.style.setProperty(nom, giraTintes(valor, delta));
}

export function restaura(arrel) {
  const b = base(arrel);
  for (const nom of [...Object.keys(b.esglaons), ...Object.keys(b.canons), ...Object.keys(b.tintes)]) {
    arrel.style.removeProperty(nom);
  }
}

/** Delta de to entre el color triat i el blau canònic. */
export function deltaDe(arrel, hex) {
  const tria = hexAOklch(hex);
  return tria ? tria.H - base(arrel).to : 0;
}

/** Mostres per a previsualitzar sense escriure res al DOM. */
export function previsualitza(arrel, delta) {
  const b = base(arrel);
  return RAMPES.map((rampa) => ({
    rampa,
    passos: ESGLAONS.map((pas) => ({ pas, hex: giraTo(b.esglaons[`--sdp-${rampa}-${pas}`], delta) }))
  }));
}
