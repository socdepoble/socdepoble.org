/**
 * seoConsola.js — Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · El <head>
 * de les rutes públiques de la Consola, una sola regla per a qui l'escriu: el
 * client (ConsolaSection · seoDe) i el prerender del build
 * (tooling/seo/build-social-manifest.mjs). Si divergiren, el head servit d'una
 * ruta (que seoHead respecta mentre s'hi està) diria una cosa i l'app una altra.
 * Pur i carregable des de node: cap React ni import.meta.
 *
 *   · /consola (el tauler): el copy de la Consola (PAGE_COPY.consola), amb la
 *     regla de metadadesDePagina, la mateixa que /page/consola.
 *   · /consola/<id> i /consola/govern/<id>: «títol · Consola», l'entradeta i,
 *     sense, el subtítol, i la portada de la seua targeta (imatgesConsola.js ·
 *     imatgeDePagina), la que ja era la seua imatge SEO (ordre del Mestre del
 *     13-10-2026, i B1 del 30-10-2026 per al Govern).
 * Les imatges passen pel selector social compartit (primeraImatgeSocial): una
 * WebP o un original de més de 300 KB va al <head> per la seua variant de
 * 1200x630 (VARIANTS_SOCIALS), i la taula i les targetes no canvien (Llei del
 * Píxel). `opcions` són les d'urlSocialDe (origen, supabaseUrl, permesos).
 */
import { metadadesDePagina } from '../../config/metadadesSocials.js';
import { IDS_PAGINES, RUTA_CONSOLA, copyConsola, paginaConsola } from './consolaPagines.js';
import { IDS_GOVERN, paginaGovern } from './govern/governConsola.js';
import { imatgeDePagina } from './imatgesConsola.js';

/** El head del tauler (/consola): { title, description, imatge, image }. */
export function metadadesDelTauler(copy = copyConsola(), opcions) {
  return metadadesDePagina(copy, opcions);
}

/** El head d'una pàgina de la sala de màquines o del Govern (paginaConsola o paginaGovern). */
export function metadadesDeSubpagina(pagina, copy = copyConsola(), opcions) {
  const { imatge, imatgeAlt } = imatgeDePagina(pagina.id);
  return metadadesDePagina({
    title: `${pagina.title} · ${copy.title}`,
    lead: pagina.lead,
    subtitle: pagina.subtitle,
    ...(imatge ? { image: imatge, imageAlt: imatgeAlt } : null)
  }, opcions);
}

/**
 * L'inventari explícit de les rutes públiques de la Consola que el build
 * prerenderitza: el tauler, les nou pàgines (IDS_PAGINES) i les quatre del
 * Govern del Mestre (IDS_GOVERN), cadascuna amb el seu head.
 */
export function rutesPubliquesDeLaConsola(opcions) {
  const copy = copyConsola();
  return [
    { ruta: RUTA_CONSOLA, ...metadadesDelTauler(copy, opcions) },
    ...IDS_PAGINES.map((id) => paginaConsola(id)).map((pagina) => ({ ruta: pagina.ruta, ...metadadesDeSubpagina(pagina, copy, opcions) })),
    ...IDS_GOVERN.map((id) => paginaGovern(id)).map((pagina) => ({ ruta: pagina.ruta, ...metadadesDeSubpagina(pagina, copy, opcions) }))
  ];
}
