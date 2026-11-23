/**
 * publicacioEditable.js — P0-25 / IDEA-96 + R32.44 / R32.45 (IDEA-324 v3 i
 * edició completa per a Beta Testers) · Una publicació pròpia del Mur, del
 * Mercat (amb UUID o fitxa d'àmbit), de l'agenda/calendari, de les verticals o
 * una pàgina de Sistema oberta al Bloc de Notes s'edita viva a l'editor de
 * notes (PublicacioEditable).
 */
import { CARPETA_PER_SECCIO } from './masDeLUsuari.js';
import { motiuSignaturaDAltri } from './signaturaDAltri.js';
import { cosDeLArticle } from '../mur/articles/cosCanonic.js';
import { MANIFEST_DE_POBLE_HTML } from '../mur/articles/manifestDePobleContent.js';
import { APLEC_2023_HTML } from '../mur/articles/aplec2023Content.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_HTML, NOVES_TECNOLOGIES_CULTURA_RURAL_ID } from '../mur/articles/novesTecnologiesCulturaRuralContent.js';
import { LA_VEU_DE_SOC_DE_POBLE_HTML, LA_VEU_DE_SOC_DE_POBLE_ID } from '../mur/articles/laVeuDeSocDePobleContent.js';
import { COPIES_SEGURETAT_SOC_DE_POBLE_HTML, COPIES_SEGURETAT_SOC_DE_POBLE_ID } from '../mur/articles/copiesSeguretatSocDePobleContent.js';
import { CAMPS_DE_LA_REVISIO } from '../../data/revisionsEditorials.js';
import { modeDeLaPublicacio } from '../../components/universal/traduccio/modesTraduccioLocals.js';
import {
  coaccionaAmbit,
  esFitxaDAmbit,
  normalitzaDades,
  normalitzaEstat,
  validaFitxa
} from '../../utils/publicacioUniversal.js';
import { fotoDeLaTargeta } from '../mercat/imatgesDeProducte.js';
import { textosEdicioSistema } from './i18nEdicioSistema.js';

const SECCIONS_EDITABLES = Object.freeze(new Set(['mur', 'mercat', 'events', 'sistema']));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CANONICS = new Map([
  ['manifest-de-poble', MANIFEST_DE_POBLE_HTML],
  ['aplec-2023', APLEC_2023_HTML],
  [NOVES_TECNOLOGIES_CULTURA_RURAL_ID, NOVES_TECNOLOGIES_CULTURA_RURAL_HTML],
  [LA_VEU_DE_SOC_DE_POBLE_ID, LA_VEU_DE_SOC_DE_POBLE_HTML],
  [COPIES_SEGURETAT_SOC_DE_POBLE_ID, COPIES_SEGURETAT_SOC_DE_POBLE_HTML]
]);

const text = (valor) => (typeof valor === 'string' ? valor : '');
const textOPrimitiu = (valor) => (typeof valor === 'string' ? valor : (typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : ''));
const esRegistre = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const escapa = (valor) => valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function esMercatEditable(publicacio) {
  if (!publicacio || publicacio.id == null || publicacio.isSystem) return false;
  return UUID.test(String(publicacio.id)) || esFitxaDAmbit(publicacio);
}

/** Si una publicació del Bloc s'obri a l'editor: pròpia del Mur, del Mercat (UUID/fitxa), de l'agenda o de Sistema. */
export function esPublicacioEditable(item) {
  if (item?.kind !== 'publicacio') return false;
  const { seccio, item: publicacio } = item.data || {};
  if (!publicacio || publicacio.id == null || publicacio.isSystem || !SECCIONS_EDITABLES.has(seccio)) {
    return false;
  }
  if (seccio === 'mercat') return esMercatEditable(publicacio);
  return true;
}

export function cosDeLaPublicacio(publicacio) {
  const canonic = CANONICS.get(String(publicacio?.id ?? ''));
  if (canonic) return cosDeLArticle(publicacio, canonic);
  const cos = text(publicacio?.content || publicacio?.html).trim();
  const font = cos || text(publicacio?.description).trim();
  if (!font) return '';
  if (cos && /^</.test(cos)) return cos;
  return font.split(/\n\s*\n/).map((paragraf) => paragraf.trim()).filter(Boolean)
    .map((paragraf) => `<p>${escapa(paragraf)}</p>`).join('');
}

function extreuDataIHoraIso(valor) {
  const cru = text(valor).trim();
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(cru);
  if (!m) return { data: '', hora: '' };
  return { data: m[1], hora: m[2] || '' };
}

function fitxaDeLaPublicacio(seccio, publicacio) {
  if (!esRegistre(publicacio)) return null;
  const seccioValidacio = seccio === 'mercat' ? 'mercat' : (seccio === 'mur' ? 'mur' : undefined);
  const directa = coaccionaAmbit(publicacio, seccioValidacio);
  if (esFitxaDAmbit(directa)) return directa;

  if (seccio === 'mercat' && esMercatEditable(publicacio)) {
    const dades = normalitzaDades('mercat', {
      preu: publicacio.dades?.preu ?? textOPrimitiu(publicacio.price),
      unitat: publicacio.dades?.unitat ?? text(publicacio.unit),
      categoria: publicacio.dades?.categoria ?? (text(publicacio.tag) || text(publicacio.category)),
      estoc: publicacio.dades?.estoc ?? text(publicacio.stock_status)
    });
    return {
      ambit: 'mercat',
      estat: normalitzaEstat(publicacio.estat),
      dades
    };
  }

  if (seccio === 'events') {
    const inici = extreuDataIHoraIso(publicacio.data_inici || publicacio.date || publicacio.start_date);
    const fi = extreuDataIHoraIso(publicacio.data_fi || publicacio.end_date);
    const lloc = text(publicacio.lloc || publicacio.location || publicacio.venue).trim();
    const municipi = text(publicacio.municipi || publicacio.town_name || publicacio.author_location).trim();
    const dades = normalitzaDades('calendari', {
      data_inici: inici.data,
      ...(inici.hora ? { hora_inici: inici.hora } : null),
      ...(fi.data ? { data_fi: fi.data } : null),
      ...(fi.hora ? { hora_fi: fi.hora } : null),
      lloc,
      ...(municipi ? { municipi } : null)
    });
    if (validaFitxa('calendari', dades).ok) {
      return {
        ambit: 'calendari',
        estat: normalitzaEstat(publicacio.estat),
        dades
      };
    }
  }

  return null;
}

function categoriesDeLaPublicacio(publicacio) {
  if (Array.isArray(publicacio?.categories)) {
    return publicacio.categories.filter((c) => typeof c === 'string' && c.trim());
  }
  if (Array.isArray(publicacio?.labels)) {
    return publicacio.labels
      .filter((l) => esRegistre(l) && l.className === 'sdp-badge-category' && typeof l.text === 'string' && l.text.trim())
      .map((l) => l.text.trim());
  }
  return [];
}

/** La nota en memòria que l'editor obri per a una publicació (cap fila de notes al servidor). */
export function notaDeLaPublicacio(item) {
  const { seccio, item: publicacio } = item.data;
  const portadaBase = text(publicacio.image_url) || text(publicacio.image) || text(item.image);
  const portada = seccio === 'mercat' ? fotoDeLaTargeta(publicacio, portadaBase) : portadaBase;
  const dataPublicacio = publicacio.publish_date
    || (seccio === 'sistema' ? (publicacio.date || publicacio.created_at || null) : null);
  const fitxa = fitxaDeLaPublicacio(seccio, publicacio);
  return {
    id: String(item.id),
    title: text(publicacio.title) || text(publicacio.name) || text(item.title),
    subtitle: text(publicacio.post_subtitle) || text(publicacio.subtitle),
    lead: text(publicacio.entradilla) || text(publicacio.lead) || text(publicacio.summary),
    content: cosDeLaPublicacio(publicacio),
    heroImage: portada,
    coverImage: portada || undefined,
    logoImage: text(publicacio.logo_image),
    copyright: text(publicacio.copyright),
    icon: text(publicacio.icon),
    publishDate: dataPublicacio,
    folderId: CARPETA_PER_SECCIO[seccio],
    categories: categoriesDeLaPublicacio(publicacio),
    tags: Array.isArray(publicacio.tags) ? publicacio.tags.filter((etiqueta) => typeof etiqueta === 'string') : [],
    isPublished: true,
    publishedSubmissionId: String(publicacio.id),
    revision: 0,
    contentLoaded: true,
    ...(fitxa ? { fitxa } : null),
    ...(typeof publicacio.mostrarAlMur === 'boolean' ? { mostrarAlMur: publicacio.mostrarAlMur } : null),
    ...(typeof publicacio.ocultarDelMur === 'boolean' ? { ocultarDelMur: publicacio.ocultarDelMur } : null),
    deLaPublicacio: Object.freeze({
      seccio,
      id: String(publicacio.id),
      ...(item.data?.ruta ? { ruta: item.data.ruta } : null)
    }),
    ...modeDeLaPublicacio(publicacio),
    ...(esRegistre(publicacio.translations) ? { translations: publicacio.translations } : null)
  };
}

/** Si «Actualitzar al Mur» pot reescriure la mateixa fila: una del Mur o del Mercat amb id de servidor. */
export function esFilaActualitzable(item) {
  const { seccio, item: publicacio } = item?.data || {};
  return (seccio === 'mur' || seccio === 'mercat') && UUID.test(String(publicacio?.id ?? ''));
}

/** P0-25 (Bloc 2) · Si «Actualitzar al Mur» desa una revisió editorial al navegador. */
export function esRevisioEditorial(item) {
  const { seccio, item: publicacio } = item?.data || {};
  if (publicacio?.id == null || publicacio.isSystem) return false;
  return seccio === 'sistema' || seccio === 'events' || (seccio === 'mur' && !UUID.test(String(publicacio.id)));
}

const igualCamp = (a, b) => (Array.isArray(a) || Array.isArray(b)
  ? JSON.stringify(a || []) === JSON.stringify(b || [])
  : (a ?? '') === (b ?? ''));

/** Els camps de la nota que han canviat respecte de la publicació oberta (el que desa la revisió). */
export function campsDeLaRevisio(inicial, actual) {
  const camps = {};
  for (const camp of CAMPS_DE_LA_REVISIO) {
    if (!igualCamp(inicial?.[camp], actual?.[camp])) camps[camp] = actual?.[camp] ?? (camp === 'publishDate' ? null : '');
  }
  return camps;
}

/** L'avís d'una revisió editorial desada (en este navegador). */
export function avisRevisioDesada(t = null, seccio = 'mur', idioma = 'ca') {
  /* v1.2.23 · costura i18n (ordre del Mestre 261123) · El text de Sistema viu al
     diccionari diferit del mòdul (i18nEdicioSistema.js, +0 B a pesDelNucli), no a
     ca.js: la llengua és la de la interfície que passa qui crida, sense t(). */
  if (seccio === 'sistema') return textosEdicioSistema(idioma).revisioSistemaDesada;
  const reserva = 'Revisió desada en este navegador: el Mur i la pàgina ja la mostren.';
  return typeof t === 'function' ? t('section.notes.publicacio.revisioDesada', reserva) : reserva;
}

/** Guarda de signatura aliena de la publicació oberta (Mur, Mercat editable, agenda o Sistema). */
export function motiuPublicacioDAltri(item, { actor = null, config = null, esSuperadmin = false, t = null } = {}) {
  const { seccio, item: publicacio } = item?.data || {};
  if (!SECCIONS_EDITABLES.has(seccio)) return null;
  if (seccio === 'mercat' && !esMercatEditable(publicacio)) return null;
  return motiuSignaturaDAltri(publicacio, { actor, config, esSuperadmin, t });
}

/** Per què una publicació editable no s'ha pogut desar (la llavor editorial o un acte). */
export function motiuNoActualitzable(item, t = null) {
  const tr = (clau, reserva) => (typeof t === 'function' ? t(clau, reserva) : reserva);
  return item?.data?.seccio === 'events'
    ? tr('section.notes.publicacio.noActualitzableActe', 'Els actes de l’agenda encara no s’actualitzen des del Bloc: el canvi només és en esta vista.')
    : tr('section.notes.publicacio.noActualitzableLlavor', 'Esta publicació és de l’arxiu editorial del municipi i encara no s’actualitza des del Bloc: el canvi només és en esta vista.');
}

/** Els camps que la nota adoptada rep en crear-se (createNote) i en lligar-se (updateNote). */
export function campsDeLAdopcio(nota) {
  const creacio = {
    title: nota.title,
    content: nota.content,
    folderId: nota.folderId,
    categories: nota.categories || [],
    tags: nota.tags || [],
    copyright: nota.copyright || '',
    ...(nota.icon ? { icon: nota.icon } : {}),
    ...(nota.publishDate ? { publishDate: nota.publishDate } : {}),
    ...(nota.fitxa !== undefined ? { fitxa: nota.fitxa } : {}),
    ...(typeof nota.mostrarAlMur === 'boolean' ? { mostrarAlMur: nota.mostrarAlMur } : {}),
    ...(typeof nota.ocultarDelMur === 'boolean' ? { ocultarDelMur: nota.ocultarDelMur } : {})
  };
  const lligam = {
    subtitle: nota.subtitle || '',
    lead: nota.lead || '',
    heroImage: nota.heroImage || '',
    ...(nota.logoImage ? { logoImage: nota.logoImage } : {}),
    ...(nota.fitxa !== undefined ? { fitxa: nota.fitxa } : {}),
    publishedSubmissionId: nota.publishedSubmissionId,
    isPublished: true
  };
  return { creacio, lligam };
}
