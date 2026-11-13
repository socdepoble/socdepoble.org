/**
 * publicacioEditable.js — P0-25 / IDEA-96 (Onada R6, Bloc 1; ordre del
 * Mestre) · Una publicació pròpia del Mur o de l'agenda oberta al Bloc de
 * Notes ja no es llig: s'edita viva a l'editor de notes (PublicacioEditable).
 * Funcions pures: quina publicació s'edita, la nota en memòria que en fa
 * l'editor i si «Actualitzar al Mur» pot escriure la MATEIXA fila.
 *
 * El camí d'escriptura d'una fila del Mur amb id de servidor (UUID) és el de
 * sempre (NotesContext · publishNote): un upsert de `section_submissions` amb
 * l'id de la fila (publishedSubmissionId). P0-25 (Onada R6, Bloc 2) · La
 * llavor editorial (`manifest-de-poble`: app_content, sense UUID) i els actes
 * (`aplec-2023`, `events`, que publishNote no escriu: seccioDAmbit només en
 * torna 'mur' o 'mercat') desen una revisió editorial AL NAVEGADOR
 * (data/revisionsEditorials.js; app_content no té cap camí d'escriptura) que
 * MurContext, ItemDetailSection i elementDeSeccio posen damunt de l'element.
 * Contracte amb el Bloc 1 (subagent 3): el document sencer d'un element ve,
 * en HTML, al seu `content`.
 */
import { CARPETA_PER_SECCIO } from './masDeLUsuari.js';
import { motiuSignaturaDAltri } from './signaturaDAltri.js';
import { cosDeLArticle } from '../mur/articles/cosCanonic.js';
import { MANIFEST_DE_POBLE_HTML } from '../mur/articles/manifestDePobleContent.js';
import { APLEC_2023_HTML } from '../mur/articles/aplec2023Content.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_HTML, NOVES_TECNOLOGIES_CULTURA_RURAL_ID } from '../mur/articles/novesTecnologiesCulturaRuralContent.js';
import { CAMPS_DE_LA_REVISIO } from '../../data/revisionsEditorials.js';
import { modeDeLaPublicacio } from '../../components/universal/traduccio/modesTraduccioLocals.js';

/* Les seccions la publicació de les quals s'obri a l'editor. El Mercat (amb la
   seua fitxa i variacions) i la Multimèdia continuen en lectura. */
const SECCIONS_EDITABLES = Object.freeze(new Set(['mur', 'events']));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* P0-25 (Bloc 2) · D2 · El canònic de la llavor, el mateix que pinten
   ManifestDePobleArticle i Aplec2023Article (cosDeLArticle). */
/* IDEA-116 (Onada R9, carril C2) · i la primera publicació del Mur, amb el mateix contracte. */
const CANONICS = new Map([['manifest-de-poble', MANIFEST_DE_POBLE_HTML], ['aplec-2023', APLEC_2023_HTML],
  [NOVES_TECNOLOGIES_CULTURA_RURAL_ID, NOVES_TECNOLOGIES_CULTURA_RURAL_HTML]]);

const text = (valor) => (typeof valor === 'string' ? valor : '');
const esRegistre = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const escapa = (valor) => valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Si una publicació del Bloc s'obri a l'editor: pròpia del Mur o de l'agenda, mai una pàgina del sistema. */
export function esPublicacioEditable(item) {
  if (item?.kind !== 'publicacio') return false;
  const { seccio, item: publicacio } = item.data || {};
  return Boolean(publicacio) && publicacio.id != null && !publicacio.isSystem && SECCIONS_EDITABLES.has(seccio);
}

/** El cos per a l'editor: el `content` HTML tal qual; un text pla, en paràgrafs; sense cos, la descripció.
 *  P0-25 (Bloc 2) · D2 · La llavor amb canònic (Manifest, Aplec) fa com la
 *  vista pública (cosDeLArticle): un `content` que no és HTML (la còpia vella
 *  d'app_content en text pla) obri el canònic, mai el resum curt. */
export function cosDeLaPublicacio(publicacio) {
  const canonic = CANONICS.get(String(publicacio?.id ?? ''));
  if (canonic) return cosDeLArticle(publicacio, canonic);
  const cos = text(publicacio?.content).trim();
  const font = cos || text(publicacio?.description).trim();
  if (!font) return '';
  if (cos && /^</.test(cos)) return cos;
  return font.split(/\n\s*\n/).map((paragraf) => paragraf.trim()).filter(Boolean)
    .map((paragraf) => `<p>${escapa(paragraf)}</p>`).join('');
}

/** La nota en memòria que l'editor obri per a una publicació (cap fila de notes al servidor). */
export function notaDeLaPublicacio(item) {
  const { seccio, item: publicacio } = item.data;
  const portada = text(publicacio.image_url) || text(publicacio.image) || text(item.image);
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
    publishDate: publicacio.publish_date || null,
    folderId: CARPETA_PER_SECCIO[seccio],
    categories: [],
    tags: Array.isArray(publicacio.tags) ? publicacio.tags.filter((etiqueta) => typeof etiqueta === 'string') : [],
    isPublished: true,
    publishedSubmissionId: String(publicacio.id),
    revision: 0,
    contentLoaded: true,
    deLaPublicacio: Object.freeze({ seccio, id: String(publicacio.id) }),
    /* R51V-02 · El mode de traducció que ja porta la publicació (si és del
       contracte): el selector en parteix, i «Actualitzar al Mur» el conserva. */
    ...modeDeLaPublicacio(publicacio),
    /* V2-04 · I les seues traduccions (revisades o no), tal qual: si la fila
       ja no és a la llista carregada del Mur, publishNote les pren d'ací
       (modesTraduccioLocals.js · traduccioDelPayload) i republicar una
       curated_5_langs no les perd. La nota del servidor no les desa mai
       (campsDeLAdopcio). */
    ...(esRegistre(publicacio.translations) ? { translations: publicacio.translations } : null)
  };
}

/** Si «Actualitzar al Mur» pot reescriure la mateixa fila: una del Mur amb id de servidor. */
export function esFilaActualitzable(item) {
  const { seccio, item: publicacio } = item?.data || {};
  return seccio === 'mur' && UUID.test(String(publicacio?.id ?? ''));
}

/** P0-25 (Bloc 2) · Si «Actualitzar al Mur» desa una revisió editorial
 *  (revisionsEditorials.js, al navegador) en lloc d'escriure una fila: la
 *  llavor del Mur (sense UUID) i els actes de l'agenda. */
export function esRevisioEditorial(item) {
  const { seccio, item: publicacio } = item?.data || {};
  if (publicacio?.id == null || publicacio.isSystem) return false;
  return seccio === 'events' || (seccio === 'mur' && !UUID.test(String(publicacio.id)));
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
export function avisRevisioDesada(t = null) {
  const reserva = 'Revisió desada en este navegador: el Mur i la pàgina ja la mostren.';
  return typeof t === 'function' ? t('section.notes.publicacio.revisioDesada', reserva) : reserva;
}

/** D-R6-1 (Onada R6, Bloc 3) i D-B4-1 (Bloc 4; decisions de MarIA) · La
 *  guarda de signatura aliena de la publicació oberta, del Mur o de l'agenda.
 *  La de publishNote (NotesContext · rebuigDePublicacio) busca la fila entre
 *  les del Mur i del Mercat, i un acte no hi és mai: ací es mira la peça
 *  oberta. Totes dues criden la mateixa funció pura (signaturaDAltri.js):
 *  cap usuari ordinari no edita una peça d'altri; el superadmin estable sí
 *  que la pot revisar. Torna el motiu o null. */
export function motiuPublicacioDAltri(item, { actor = null, config = null, esSuperadmin = false, t = null } = {}) {
  const { seccio, item: publicacio } = item?.data || {};
  if (!SECCIONS_EDITABLES.has(seccio)) return null;
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
    title: nota.title, content: nota.content, folderId: nota.folderId,
    categories: nota.categories || [], tags: nota.tags || [], copyright: nota.copyright || '',
    ...(nota.icon ? { icon: nota.icon } : {}),
    ...(nota.publishDate ? { publishDate: nota.publishDate } : {})
  };
  const lligam = {
    subtitle: nota.subtitle || '', lead: nota.lead || '', heroImage: nota.heroImage || '',
    ...(nota.logoImage ? { logoImage: nota.logoImage } : {}),
    publishedSubmissionId: nota.publishedSubmissionId, isPublished: true
  };
  return { creacio, lligam };
}
