/**
 * paginaDeText.js — T71 · Una pàgina de text de Sóc de Poble (PAGE_COPY o
 * pageCopy del contingut core), resolta i pintada d'una sola manera.
 *
 *   · propsDePaginaDeText: les props que TextSection passa a la UniversalPage
 *     (títol, subtítol, entradilla, hero resolt, etiquetes, drets i data). Les
 *     comparteix el lector de connexions (notes/ConnexioDetall.jsx): una
 *     connexió a /iaia es llig igual que /iaia; /ia es conserva com a àlies.
 *   · pageKeyDeRuta i paginaDeRuta: de la ruta desada en connectar a la clau
 *     i a la pàgina, amb la mateixa precedència que les rutes de veres
 *     (TextRoute a App.jsx i PageDetailSection).
 *
 * Només es resol una ruta que és de veres una pàgina de text:
 *   · una secció de config/sections.js amb kind 'text' i pageKey propi. Les
 *     que no en porten (/connectar, /control, /realitat) tenen component
 *     propi, i /disseny, encara que en porta, munta DesignSection (App.jsx),
 *     no PAGE_COPY.disseny: el lector mostraria una pàgina que no és la de la
 *     ruta. Totes quatre queden fora;
 *   · /page/:slug, amb la redirecció de PageDetailSection: un slug amb ruta
 *     canònica es resol per eixa ruta (/page/disseny cau fora, com /disseny).
 * La query i el fragment no canvien la pàgina (TextRoute no els llig). Les
 * claus són sempre pròpies (Object.hasOwn): «constructor» no és cap pàgina.
 *
 * Pur: sense React ni xarxa. La ruta ve de dades desades i es torna a validar.
 */
import { SECTIONS } from '../../config/sections.js';
import { esRutaInterna, resolvePageSlugPath } from '../../config/navigation.js';
import { resolveAsset } from '../../config/assetResolver.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { PAGE_COPY } from './pageContent.js';

/** Rutes de kind 'text' que no pinta TextSection: mai es resolen ací. */
export const RUTES_SENSE_PAGINA_DE_TEXT = Object.freeze(['/disseny', '/connectar', '/control', '/realitat']);

/* Onada 3 (P2) · La reserva viu a public/, que és el que viatja al paquet.
   Abans apuntava a /assets/img/, que només servix el servidor de dev (des de
   l'arrel del repo): /fedivers feia 404 a WordPress. Mateix fitxer, mateixa
   mida en bytes. */
const HERO_PER_DEFECTE = '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png';
const ALT_PER_DEFECTE = "Panoràmica d'un poble fictici";

/**
 * Les props de la UniversalPage d'una pàgina de text, les mateixes que
 * TextSection ha passat sempre. Sense les del marc (logos, chrome i barra),
 * que posa qui la munta.
 */
export function propsDePaginaDeText(page, pageKey, t) {
  return {
    title: page.title,
    subtitle: page.subtitle,
    lead: page.lead,
    heroImage: resolveAsset(page.image || HERO_PER_DEFECTE),
    heroAlt: page.imageAlt || ALT_PER_DEFECTE,
    ...(page.image && page.imageWidth != null && page.imageHeight != null
      ? { heroWidth: page.imageWidth, heroHeight: page.imageHeight } : {}),
    ...(page.imageFetchPriority === 'high' ? { heroFetchPriority: 'high' } : {}),
    labels: page.labels || [
      { text: String(pageKey).toUpperCase(), className: 'sdp-badge-system' },
      { text: t?.('section.text.page', 'Pàgina') || 'Pàgina', className: 'sdp-badge-category' }
    ],
    copyright: COPYRIGHT_SDP,
    /* T51 · la data real de la pàgina (editorial.js, regla del Mestre): la
       del seu copy (PAGE_COPY, o la pàgina del contingut core). */
    ...dataHoraDeBarra({ creat: page.date })
  };
}

/* El camí de la ruta: sense query ni fragment i sense barra final. */
function camiDe(ruta) {
  if (!esRutaInterna(ruta)) return '';
  const cami = ruta.split(/[?#]/)[0].replace(/\/+$/, '');
  return cami || '/';
}

const propia = (taula, clau) => (taula && typeof taula === 'object' && Object.hasOwn(taula, clau) ? taula[clau] : null);

/* El slug de /page/:slug, descodificat; '' si no ho és o no es pot llegir. */
function slugDe(cami) {
  const trobat = /^\/page\/([^/]+)$/.exec(cami);
  if (!trobat) return '';
  try {
    return decodeURIComponent(trobat[1]);
  } catch {
    return '';
  }
}

/* { pageKey, via }: 'seccio' (TextRoute) o 'slug' (PageDetailSection); null si no n'és cap. */
function clauDeRuta(ruta) {
  const cami = camiDe(ruta);
  if (!cami || RUTES_SENSE_PAGINA_DE_TEXT.includes(cami)) return null;
  // Les connexions desades abans de la ruta canònica continuen llegint la mateixa pàgina.
  if (cami === '/ia') return clauDeRuta('/iaia');
  const seccio = SECTIONS.find((s) => s.kind === 'text' && s.path === cami);
  if (seccio) return typeof seccio.pageKey === 'string' && seccio.pageKey ? { pageKey: seccio.pageKey, via: 'seccio' } : null;
  const slug = slugDe(cami);
  if (!slug) return null;
  /* PageDetailSection redirigix un slug conegut a la seua ruta canònica. */
  const canonica = resolvePageSlugPath(slug);
  if (canonica) return clauDeRuta(canonica);
  return { pageKey: slug, via: 'slug' };
}

/** La clau de la pàgina de text d'una ruta, o null si la ruta no n'és cap. */
export function pageKeyDeRuta(ruta) {
  return clauDeRuta(ruta)?.pageKey ?? null;
}

/**
 * La pàgina de text d'una ruta: { pageKey, page } o null. `pageCopy` i
 * `pages` són els del contingut core (useCoreContent); PAGE_COPY fa de
 * reserva, com a les rutes de veres.
 */
export function paginaDeRuta(ruta, { pageCopy, pages } = {}) {
  const clau = clauDeRuta(ruta);
  if (!clau) return null;
  const { pageKey, via } = clau;
  const delSlug = via === 'slug' && Array.isArray(pages)
    ? pages.find((p) => p && (String(p.slug) === pageKey || String(p.id) === pageKey)) || null
    : null;
  const page = propia(pageCopy, pageKey) || delSlug || propia(PAGE_COPY, pageKey);
  return page ? { pageKey, page } : null;
}
