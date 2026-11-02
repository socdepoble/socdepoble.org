/**
 * Unicitat de bytes de public/assets (P1-29 · B10 marató 261101_2143, spec B10-GOVERN §2.1).
 *
 * Mòdul pur: cap I/O. Només importa el cens de l'Arxiu i la política de bessones;
 * l'inventari amb hashos el fa tooling/media/cens_imatges.mjs (inventariAssets).
 * Cap imatge es mou, s'esborra ni es reanomena, i src/ no canvia: la correcció
 * d'àlies i la transitivitat viuen només ací (D-2). ALIES_DEL_CENS i la fusió de
 * l'Arxiu (mediaContent.js) es queden com estan.
 *
 * Un grup de bytes idèntics és legítim si totes les seues imatges tenen la mateixa
 * arrel del cens (àlies transitius, bessones WebP, SVG «còpia idèntica»), si les
 * arrels són una parella acreditada del cens o si el grup està declarat ací.
 */
import {
  CENS_IMATGES, EXCLOSES, PARES_IDENTIQUES_ACREDITADES_CENS, SVG_DOCUMENTATS_ARXIU
} from '../../src/sections/multimedia/censImatges.js';
import { bessonaDe as bessonaWebpDe, bessonesDe } from '../../src/config/politicaDeMitjans.js';

export const MAX_SALTS = 8;
export const TIPUS_DECLARATS = Object.freeze(['semantic_arxiu', 'sistema']);
const ordena = (a, b) => a < b ? -1 : a > b ? 1 : 0;

/** Àlies que el motiu d'EXCLOSES no pot dir bé. Cada entrada nomena l'original real i el perquè.
 *  La prova exigix que l'original ingenu continue absent (si algú arregla censImatges.js, l'entrada caduca). */
export const CORRECCIONS_D_ALIES = Object.freeze({
  '/assets/uploads/ia/05-carla-soriano-doctora/avatars/carla-soriano-ibanez.png': Object.freeze({
    original: '/assets/uploads/avatars/carla-soriano_comic.png',
    motiu: 'COPIES_IA (censImatges.js) nomena /assets/uploads/avatars/carla-soriano-ibanez.png, que no existix; els bytes són els de carla-soriano_comic.png'
  })
});

const declara = (tipus, fitxers, motiu) => Object.freeze({
  tipus, fitxers: Object.freeze([...fitxers]), motiu, decisio: 'pendent_mestre'
});

/** Grups de bytes idèntics que cap àlies ni bessona no explica, declarats un per un.
 *  tipus: 'semantic_arxiu' (dues entrades del cens amb la mateixa il·lustració) | 'sistema'.
 *  decisio: 'pendent_mestre' (D-1 fusionar a l'Arxiu, D-3 variant blanca real). Fitxers exactes i ordenats:
 *  si el grup canvia de membres o deixa d'existir, la declaració és rància i la prova cau. */
export const DUPLICATS_ACREDITATS = Object.freeze([
  declara('semantic_arxiu', [
    '/assets/fotos/iaia-maria.webp',
    '/assets/uploads/avatars/iaia_comic_matriarch.webp',
    '/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-iaia-v4.webp',
    '/assets/uploads/gent/avatars/iaia_comic_matriarch.webp'
  ], 'La bessona de «IAIA MarIA» és byte a byte «L’art de la IAIA»: l’Arxiu la pinta dues vegades.'),
  declara('semantic_arxiu', [
    '/assets/uploads/avatars/nano-banana-comic.webp',
    '/assets/uploads/empresa/soc-de-poble/posts/el-projecte/nano-banana.webp',
    '/assets/uploads/gent/avatars/nano-banana-comic.webp',
    '/assets/uploads/ia/02-nano-banana-artiste/avatars/nano-banana-comic.webp'
  ], '«Nano Banana» i «La Nano Banana»: la mateixa il·lustració amb dos títols a l’Arxiu.'),
  declara('semantic_arxiu', [
    '/assets/uploads/brain/art_trellat_farmer_1774708525806.webp',
    '/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-trellat-v3.webp'
  ], '«El trellat del llaurador» i «L’art del trellat»: la mateixa il·lustració amb dos títols a l’Arxiu.'),
  declara('semantic_arxiu', [
    '/assets/uploads/ajuntament/la-torre-de-les-macanes/post/collita-poma-local.webp',
    '/assets/uploads/brain/collita_pomes_valencia_1779774496548.webp'
  ], '«Collita de poma local» i «Collita de pomes»: la mateixa il·lustració amb dos títols a l’Arxiu.'),
  declara('sistema', [
    '/assets/system/ui/logo-socdepoble-rect-blanc.svg',
    '/assets/system/ui/logo-socdepoble-rect.svg'
  ], 'La variant «blanc» és byte a byte l’estàndard; MARQUES_SVG_ANTIGUES.fosc (src/config/imatgeSocial.js) la nomena per a fons foscos.')
]);

/* «còpia de X» i «còpia de l’avatar de DIR/» (EXCLOSES, sencer); «còpia idèntica de X:» (SVG_DOCUMENTATS_ARXIU).
   Sense quantificadors niats: lineals davant de qualsevol motiu. */
const MOTIU_COPIA = /^còpia de (?:l’avatar de )?(\/assets\/\S+)$/u;
const MOTIU_IDENTICA = /(?:^|[\s;])còpia idèntica de (\/assets\/[^\s:;,]+)/u;

/** «còpia de X», «còpia de l’avatar de DIR/» i «còpia idèntica de X:» → camí de l'original o null.
 *  Un DIR/ final vol dir el mateix nom de fitxer que la còpia (com originalDe de censImatges.js). */
export function originalDelMotiu(copia, motiu) {
  const text = String(motiu ?? '');
  const copiaSimple = MOTIU_COPIA.exec(text);
  const desti = copiaSimple ? copiaSimple[1] : MOTIU_IDENTICA.exec(text)?.[1];
  if (!desti) return null;
  return desti.endsWith('/') ? `${desti}${String(copia).split('/').pop()}` : desti;
}

/** Bessones WebP dels presents ({ bessona: original }), amb la regla d'única font de politicaDeMitjans. */
function bessonesDelsPresents(presents) {
  const relatius = [...presents].map((src) => src.replace(/^\//, ''));
  return new Map(bessonesDe(relatius).map((original) => [`/${bessonaWebpDe(original)}`, `/${original}`]));
}

/** Context de resolució: { cens: Set<src>, excloses, svgs, presents: Set<src>, bessones: Map<bessona, original>, correccions }.
 *  `cens` admet entrades { src } o camins; `bessonaDe` (opcional) és el mapa bessona → original ja calculat. */
export function contextDelCens({
  presents, cens = CENS_IMATGES, excloses = EXCLOSES, svgs = SVG_DOCUMENTATS_ARXIU,
  correccions = CORRECCIONS_D_ALIES, bessonaDe = null
} = {}) {
  const presentsSet = new Set(presents || []);
  const bessones = bessonaDe ? new Map(bessonaDe instanceof Map ? bessonaDe : Object.entries(bessonaDe))
    : bessonesDelsPresents(presentsSet);
  return Object.freeze({
    cens: new Set([...cens].map((e) => (typeof e === 'string' ? e : e.src))),
    excloses, svgs, presents: presentsSet, bessones, correccions
  });
}

/** Un salt cap a l'original, o null si `src` és arrel. Els originals absents no compten (es veuen a motiusTrencats). */
function pas(src, ctx) {
  const present = (o) => (o && ctx.presents.has(o) ? o : null);
  if (Object.hasOwn(ctx.correccions, src)) return present(ctx.correccions[src].original);
  if (Object.hasOwn(ctx.excloses, src)) return present(originalDelMotiu(src, ctx.excloses[src]));
  if (Object.hasOwn(ctx.svgs, src)) return present(originalDelMotiu(src, ctx.svgs[src]?.motiu));
  return ctx.bessones.get(src) ?? null;
}

/** Arrel transitiva: cens → ella mateixa; correcció → original; exclosa amb motiu → original (si és present);
 *  SVG documentat com a «còpia idèntica» → original; bessona → original. Llança un error si hi ha cicle o més de 8 salts. */
export function arrelDelCens(src, ctx) {
  const cami = [];
  let actual = src;
  for (;;) {
    if (ctx.cens.has(actual)) return actual;
    if (cami.includes(actual)) throw new Error(`Cicle d’àlies al cens: ${[...cami, actual].join(' → ')}`);
    if (cami.length >= MAX_SALTS) throw new Error(`Més de ${MAX_SALTS} salts d’àlies des de ${src}`);
    cami.push(actual);
    const seguent = pas(actual, ctx);
    if (!seguent) return actual;
    actual = seguent;
  }
}

/** Motius d'EXCLOSES (i SVG «còpia idèntica» i correccions) de còpies presents que nomenen un original absent.
 *  Els motius corregits no compten: la correcció mana. → [{ src, original, font }] ordenat per src. */
export function motiusTrencats(ctx) {
  const trencats = [];
  const revisa = (src, original, font) => {
    if (ctx.presents.has(src) && original && !ctx.presents.has(original)) trencats.push({ src, original, font });
  };
  for (const [src, correccio] of Object.entries(ctx.correccions)) revisa(src, correccio.original, 'correccio');
  for (const [src, motiu] of Object.entries(ctx.excloses)) {
    if (!Object.hasOwn(ctx.correccions, src)) revisa(src, originalDelMotiu(src, motiu), 'excloses');
  }
  for (const [src, svg] of Object.entries(ctx.svgs)) {
    if (!Object.hasOwn(ctx.correccions, src)) revisa(src, originalDelMotiu(src, svg?.motiu), 'svg');
  }
  return trencats.sort((a, b) => ordena(a.src, b.src));
}

/** [{ src, sha256 }] → grups de bytes idèntics [{ sha256, fitxers }] (més d'un fitxer), ordenats. */
export function grupsDuplicats(imatges) {
  const perHash = new Map();
  for (const { src, sha256 } of imatges) {
    if (!perHash.has(sha256)) perHash.set(sha256, []);
    perHash.get(sha256).push(src);
  }
  return [...perHash].filter(([, fitxers]) => fitxers.length > 1)
    .map(([sha256, fitxers]) => ({ sha256, fitxers: fitxers.sort(ordena) }))
    .sort((a, b) => ordena(a.sha256, b.sha256));
}

const clau = (fitxers) => [...fitxers].sort(ordena).join('|');

/** grups: [{ sha256, fitxers }] → [{ sha256, fitxers, arrels, acreditacio }]
 *  acreditacio: 'mateix_asset' | 'parella_cens' (les arrels són una parella de PARES_IDENTIQUES_ACREDITADES_CENS)
 *             | 'declarat' (fitxers exactes a DUPLICATS_ACREDITATS) | 'no_acreditat'.
 *  'declarat' es mira l'últim: una declaració d'un grup que ja s'explica sol és rància. */
export function classificaDuplicats(grups, ctx, { pares = PARES_IDENTIQUES_ACREDITADES_CENS, acreditats = DUPLICATS_ACREDITATS } = {}) {
  const parelles = new Set(pares.map((p) => clau([p.primaria, p.secundaria])));
  const declarats = new Set(acreditats.map((d) => clau(d.fitxers)));
  return grups.map((grup) => {
    const arrels = [...new Set(grup.fitxers.map((src) => arrelDelCens(src, ctx)))].sort(ordena);
    const acreditacio = arrels.length === 1 ? 'mateix_asset'
      : arrels.length === 2 && parelles.has(clau(arrels)) ? 'parella_cens'
        : declarats.has(clau(grup.fitxers)) ? 'declarat' : 'no_acreditat';
    return { ...grup, arrels, acreditacio };
  });
}

/** Declaracions que no casen amb cap grup real classificat 'declarat' (grup desaparegut, membres canviats
 *  o grup que ja s'explica per àlies o parella). */
export function declaracionsRancies(classificats, acreditats = DUPLICATS_ACREDITATS) {
  const vius = new Set(classificats.filter((g) => g.acreditacio === 'declarat').map((g) => clau(g.fitxers)));
  return acreditats.filter((d) => !vius.has(clau(d.fitxers)));
}

/** La línia que caldria afegir a DUPLICATS_ACREDITATS per a un grup no acreditat (tipus i motiu, a omplir). */
export function propostaDeclaracio(grup) {
  const fitxers = [...grup.fitxers].sort(ordena).map((f) => `    '${f}'`).join(',\n');
  return `  declara('semantic_arxiu' | 'sistema', [\n${fitxers}\n  ], '<per què són els mateixos bytes>'),`;
}
