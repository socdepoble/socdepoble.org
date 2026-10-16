/**
 * enquadrament.js — Matemàtica pura del re-enquadrament d'imatges.
 * T46 (ordre del Mestre, 260928). Sense DOM: es prova en Node.
 *
 * L'estat és { format, zoom, cx, cy }. cx i cy són el centre del marc en
 * fraccions [0..1] de l'amplada W i de l'alçada H naturals de la imatge. El
 * marc és el rectangle més gran de la proporció triada que cap dins de la
 * imatge (zoom 1), dividit pel zoom. Tot el que ix d'ací passa per `limita`:
 * el marc no ix mai de la foto i el retall no baixa de MIDA_MINIMA_RETALL px.
 */

export const FORMAT_PER_DEFECTE = '1:1';
export const ZOOM_MAX = 4;
/** Costat llarg màxim del fitxer que ix del diàleg (després, compressImage). */
export const MIDA_SORTIDA = 1200;
/** Costat curt mínim del retall, en píxels de la imatge original. */
export const MIDA_MINIMA_RETALL = 200;
/** Costat llarg del <canvas> del visor (atributs, no CSS). */
export const LLARG_VISOR = 960;

/* Pedra Seca §8: el quadrat va primer i és el de sèrie. Per a afegir-ne un
   altre (3:4, per exemple) n'hi ha prou amb una fila nova. `ratio` null =
   la proporció de la mateixa foto. */
export const FORMATS = Object.freeze([
  Object.freeze({
    valor: '1:1', etiqueta: 'Quadrat (1:1)', ratio: 1,
    /* Poliment T46 · Publicar al Mur és una còpia (publishNote): la targeta
       d'una nota ja publicada no canvia fins que es torna a publicar. */
    ajuda: 'Recomanat: la capçalera, la miniatura del llistat i la targeta del Mur ensenyen el mateix enquadrament. Si la nota ja és al Mur, la targeta no canvia fins que la tornes a publicar.',
  }),
  Object.freeze({
    valor: 'original', etiqueta: 'Original', ratio: null,
    ajuda: 'Manté la forma de la foto. Les miniatures quadrades la retallaran soles.',
  }),
  Object.freeze({ valor: '4:3', etiqueta: 'Apaisat (4:3)', ratio: 4 / 3 }),
  Object.freeze({ valor: '16:9', etiqueta: 'Panoràmic (16:9)', ratio: 16 / 9 }),
]);

const EPSILON = 1e-6;
const entre = (valor, minim, maxim) => Math.min(maxim, Math.max(minim, valor));
const finit = (valor, perDefecte) => (Number.isFinite(valor) ? valor : perDefecte);

/** Proporció (amplada / alçada) del format; sense ratio, la de la foto. */
export function proporcio(format, W, H, formats = FORMATS) {
  const trobat = formats.find((f) => f.valor === format);
  return trobat?.ratio ?? (W / H);
}

/** El marc més gran de proporció r que cap dins d'una imatge W×H. */
export function marcBase(W, H, r) {
  return W / H > r ? { w: H * r, h: H } : { w: W, h: W / r };
}

/** El zoom que deixa el costat curt del retall en `minim` px (mai menys d'1). */
export function zoomMaxim(W, H, r, minim = MIDA_MINIMA_RETALL) {
  const base = marcBase(W, H, r);
  return Math.max(1, Math.min(ZOOM_MAX, Math.min(base.w, base.h) / minim));
}

export function estatInicial(format = FORMAT_PER_DEFECTE) {
  return { format, zoom: 1, cx: 0.5, cy: 0.5 };
}

/** Mitja amplada i mitja alçada del marc, en fraccions de la imatge. */
function mitjos(e, W, H, formats) {
  const base = marcBase(W, H, proporcio(e.format, W, H, formats));
  return { mx: base.w / e.zoom / W / 2, my: base.h / e.zoom / H / 2 };
}

/** Porta l'estat dins dels límits: zoom ∈ [1, zoomMaxim] i el marc dins de la foto. */
export function limita(e, W, H, formats = FORMATS) {
  const r = proporcio(e.format, W, H, formats);
  const zoom = entre(finit(e.zoom, 1), 1, zoomMaxim(W, H, r));
  const { mx, my } = mitjos({ ...e, zoom }, W, H, formats);
  return {
    ...e,
    zoom,
    cx: entre(finit(e.cx, 0.5), mx, 1 - mx),
    cy: entre(finit(e.cy, 0.5), my, 1 - my),
  };
}

/** El rectangle de retall, en píxels enters de la imatge original. */
export function rectDeRetall(e, W, H, formats = FORMATS) {
  const l = limita(e, W, H, formats);
  const base = marcBase(W, H, proporcio(l.format, W, H, formats));
  const w = entre(Math.round(base.w / l.zoom), 1, W);
  const h = entre(Math.round(base.h / l.zoom), 1, H);
  return {
    x: entre(Math.round(l.cx * W - w / 2), 0, W - w),
    y: entre(Math.round(l.cy * H - h / 2), 0, H - h),
    w,
    h,
  };
}

/** Mida del <canvas> del visor per a una proporció r (costat llarg = llarg). */
export function midaVisor(r, llarg = LLARG_VISOR) {
  const ratio = Number.isFinite(r) && r > 0 ? r : 1;
  return ratio >= 1
    ? { amplada: llarg, alcada: Math.max(1, Math.round(llarg / ratio)) }
    : { amplada: Math.max(1, Math.round(llarg * ratio)), alcada: llarg };
}

/** Mida del fitxer d'eixida: el retall, reduït fins a `maxim` pel costat llarg. Mai no amplia. */
export function midaSortida(rect, maxim = MIDA_SORTIDA) {
  const k = Math.min(1, maxim / Math.max(rect.w, rect.h));
  return { amplada: Math.max(1, Math.round(rect.w * k)), alcada: Math.max(1, Math.round(rect.h * k)) };
}

/** Onada 4, T3a · El format de sèrie quan el pare demana `sortida` (RETALLADOR §1). */
export const FORMAT_SORTIDA = 'image/webp';
const FORMATS_SORTIDA = Object.freeze(['image/webp', 'image/jpeg', 'image/png']);

/* Onada 4 (retallador senzill, 261008) · Una mida exacta vàlida (dos enters
   positius) o null: una mida a mitges no s'aplica a mitges. */
function midaExacta(mida) {
  const amplada = Math.round(Number(mida?.amplada));
  const alcada = Math.round(Number(mida?.alcada));
  return amplada > 0 && alcada > 0 ? { amplada, alcada } : null;
}

/**
 * Onada 4, T3a · Les opcions de l'exportador.
 *   · Sense `sortida` (contracte T46): exactament les d'abans, 1.200 px pel
 *     costat llarg i el tipus intermedi de tipusDeSortida.
 *   · Amb `sortida` = { ampladaMaxima, format, qualitat }: l'AMPLADA no passa
 *     d'ampladaMaxima (mai s'amplia; l'alçada seguix la forma), el format
 *     demanat (WebP de sèrie; l'exportador cau a JPEG si el navegador no el sap
 *     codificar) i la qualitat (0..1) si n'hi ha.
 *   · Onada 4 (retallador senzill, 261008) · Amb `sortida.exacta` =
 *     { amplada, alcada }, el fitxer fa EXACTAMENT eixa mida, també si cal
 *     ampliar el retall: el logotip ix a 600 × 600 i (Gauntlet 261016, Bloc 1,
 *     Llei del Quadrat) la capçalera a 1.200 × 1.200 i l'avatar a 400 × 400.
 *     L'alçada no es deriva del retall (arrodonit al píxel), que podria
 *     donar-ne un de més o de menys.
 */
export function opcionsSortida(rect, tipusOriginal, sortida = null) {
  if (!sortida) return { ...midaSortida(rect), tipus: tipusDeSortida(tipusOriginal) };
  const maxim = Number(sortida.ampladaMaxima) > 0 ? Number(sortida.ampladaMaxima) : MIDA_SORTIDA;
  const k = Math.min(1, maxim / rect.w);
  const exacta = midaExacta(sortida.exacta);
  const opcions = {
    amplada: exacta ? exacta.amplada : Math.max(1, Math.round(rect.w * k)),
    alcada: exacta ? exacta.alcada : Math.max(1, Math.round(rect.h * k)),
    tipus: FORMATS_SORTIDA.includes(sortida.format) ? sortida.format : FORMAT_SORTIDA,
  };
  if (Number.isFinite(sortida.qualitat) && sortida.qualitat > 0 && sortida.qualitat <= 1) opcions.qualitat = sortida.qualitat;
  return opcions;
}

/**
 * Arrossegar dx, dy píxels de pantalla sobre un visor de `ampleCss` px.
 * Com a qualsevol visor tàctil, arrossegar cap a la dreta fa vore el que hi ha
 * a l'esquerra: el centre del marc es mou en sentit contrari.
 */
export function arrossega(e, dx, dy, ampleCss, W, H, formats = FORMATS) {
  const l = limita(e, W, H, formats);
  const base = marcBase(W, H, proporcio(l.format, W, H, formats));
  const ampleMarc = base.w / l.zoom;
  if (!(ampleCss > 0) || !(ampleMarc > 0)) return l;
  const s = ampleCss / ampleMarc; // píxels de pantalla per píxel d'imatge
  return limita({ ...l, cx: l.cx - dx / (s * W), cy: l.cy - dy / (s * H) }, W, H, formats);
}

/** Pessic amb dos dits: el zoom inicial z0 escalat per la distància d / d0. */
export function pessic(e, z0, d0, d, W, H, formats = FORMATS) {
  if (!(d0 > 0) || !(d > 0)) return limita(e, W, H, formats);
  return limita({ ...e, zoom: z0 * (d / d0) }, W, H, formats);
}

/** Si el marc es pot moure en cada eix (una panoràmica en quadrat a zoom 1 no es mou en vertical). */
export function marges(e, W, H, formats = FORMATS) {
  const l = limita(e, W, H, formats);
  const { mx, my } = mitjos(l, W, H, formats);
  return { x: 1 - 2 * mx > EPSILON, y: 1 - 2 * my > EPSILON };
}

/** Posició del marc en un eix com a percentatge 0..100 (50 si no hi ha marge). */
export function lliscador(e, eix, W, H, formats = FORMATS) {
  const l = limita(e, W, H, formats);
  const { mx, my } = mitjos(l, W, H, formats);
  const mig = eix === 'y' ? my : mx;
  const rang = 1 - 2 * mig;
  if (rang <= EPSILON) return 50;
  const c = eix === 'y' ? l.cy : l.cx;
  return Math.round(((c - mig) / rang) * 100);
}

/** La inversa de `lliscador`: posa el centre del marc al percentatge v de l'eix. */
export function ambLliscador(e, eix, v, W, H, formats = FORMATS) {
  const l = limita(e, W, H, formats);
  const { mx, my } = mitjos(l, W, H, formats);
  const mig = eix === 'y' ? my : mx;
  const c = mig + (entre(finit(Number(v), 50), 0, 100) / 100) * (1 - 2 * mig);
  return limita(eix === 'y' ? { ...l, cy: c } : { ...l, cx: c }, W, H, formats);
}

/** Onada 4, T3a · Passos del teclat sobre el visor: punts de lliscador i d'ampliació. */
export const PAS_TECLAT = 5;
export const PAS_ZOOM_TECLAT = 0.1;

/**
 * Onada 4, T3a (RETALLADOR §1) · Una tecla sobre el visor → estat nou, o null
 * si la tecla no és del retallador. Les fletxes mouen el marc com els
 * lliscadors (dreta = «Posició horitzontal» puja): el que s'escolta i el que
 * es fa diuen el mateix. + i − amplien. Amb `gran` (Maj), les fletxes van
 * quatre vegades més lluny; el zoom no, perquè en molts teclats el + ja és Maj.
 */
export function ambTecla(e, tecla, W, H, formats = FORMATS, { gran = false } = {}) {
  const pas = gran ? PAS_TECLAT * 4 : PAS_TECLAT;
  const mou = (eix, signe) => ambLliscador(e, eix, lliscador(e, eix, W, H, formats) + signe * pas, W, H, formats);
  const amplia = (signe) => limita({ ...e, zoom: finit(e.zoom, 1) + signe * PAS_ZOOM_TECLAT }, W, H, formats);
  switch (tecla) {
    case 'ArrowLeft': return mou('x', -1);
    case 'ArrowRight': return mou('x', 1);
    case 'ArrowUp': return mou('y', -1);
    case 'ArrowDown': return mou('y', 1);
    case '+': case '=': case 'Add': return amplia(1);
    case '-': case '_': case 'Subtract': return amplia(-1);
    default: return null;
  }
}

/* Onada 4 (retallador senzill, 261008) · La roda del ratolí sobre el visor:
   un pas petit, proporcional al gir i mai més gran que el del teclat. Un
   ratolí dona uns 100 px per osca (el pas sencer); un trackpad, molts girs
   menuts (passos menuts). deltaMode 1 (línies, Firefox) i 2 (pàgines) es
   passen a píxels. */
export const PAS_ZOOM_RODA = 0.002;
const PIXELS_PER_MODE = Object.freeze([1, 16, 800]);

/** La roda → estat nou (dins dels límits), o null si el gir és nul. Cap amunt, amplia. */
export function ambRoda(e, deltaY, W, H, formats = FORMATS, { mode = 0 } = {}) {
  const pixels = finit(Number(deltaY), 0) * (PIXELS_PER_MODE[mode] ?? 1);
  if (!pixels) return null;
  const pas = entre(-pixels * PAS_ZOOM_RODA, -PAS_ZOOM_TECLAT, PAS_ZOOM_TECLAT);
  return limita({ ...e, zoom: finit(e.zoom, 1) + pas }, W, H, formats);
}

/** El retall és la foto sencera (no cal tornar a codificar res). */
export function esSencera(e, W, H, formats = FORMATS) {
  const rect = rectDeRetall(e, W, H, formats);
  return rect.x === 0 && rect.y === 0 && rect.w === W && rect.h === H;
}

/**
 * Tipus del fitxer intermedi. Els formats que poden dur transparència (PNG,
 * GIF, WebP, AVIF i SVG) van en PNG: en JPEG eixirien amb fons blanc. La
 * resta va en JPEG. Cap usa l'encoder WebP del canvas (no verificat a
 * Safari 16). Després, compressImage el passa a WebP com sempre.
 */
export function tipusDeSortida(tipus) {
  return /^image\/(png|gif|webp|avif|svg\+xml)$/i.test(String(tipus || '')) ? 'image/png' : 'image/jpeg';
}

/** Text per al lector de pantalla del lliscador d'ampliació. */
export function textAmpliacio(zoom) {
  return `${Math.round(finit(zoom, 1) * 100)} %`;
}
