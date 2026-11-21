/**
 * wikiDePobleModel.js — Constants i funcions pures del model de la Wiki de Poble
 * (separades de WikiDePobleSection.jsx per garantir puresa Fast Refresh / HMR).
 */
import { FileText } from 'lucide-react';
import { PAGE_COPY } from '../text/pageContent';
import { dataDelNom, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { ICONES_ITEMS_WIKI } from './iconesWiki.js';

const pWiki = (nom, reserva) => Object.freeze([`section.wiki.${nom}`, reserva]);
export const TEXTOS_ESPAI_WIKI = Object.freeze({
  categories: pWiki('categories', 'WIKI DE POBLE'),
  items: pWiki('items', 'DOCUMENTS'),
  tria: pWiki('tria', 'Tria un document.'),
});

/* v1.2.17 · Gauntlet R2 (L3R2-04) · La portada de la Wiki ja viu al seu copy (PAGE_COPY.wikidepoble:
   la vinyeta, la mida, la prioritat i l'alt fidel), que és el que lligen la vista (copyDePortada), el
   head (seoWiki.js · portadaSocialDeLaWiki) i el prerender (build-social-manifest.mjs): els tres diuen
   el mateix (contracte T1.3). PORTADA_WIKI_BRUGUERA en deriva, amb una sola font per a l'alt, i hi
   afig el camí de la bessona .webp (mapaBessonesPublic.js). */
const PORTADA_DEL_COPY = PAGE_COPY.wikidepoble || {};
export const PORTADA_WIKI_BRUGUERA = Object.freeze({
  image: PORTADA_DEL_COPY.image,
  imageWebp: typeof PORTADA_DEL_COPY.image === 'string' ? PORTADA_DEL_COPY.image.replace(/\.jpg$/, '.webp') : undefined,
  imageWidth: PORTADA_DEL_COPY.imageWidth,
  imageHeight: PORTADA_DEL_COPY.imageHeight,
  imageFetchPriority: PORTADA_DEL_COPY.imageFetchPriority,
  imageAlt: PORTADA_DEL_COPY.imageAlt,
});

/* 261001 · El copy d'una portada: el del contingut (pageCopy) o, sense, el de PAGE_COPY.
   v1.2.17 · Gauntlet R2 (L3R2-04) · Torna a ser la de la v1.2.16: amb la vinyeta al copy, ja no cal
   substituir portada_genotip.png a la vista (la substitució feia que el head en diguera una altra). */
export function copyDePortada(pageCopy, clau) {
  return pageCopy?.[clau] || PAGE_COPY[clau];
}

const einaLocal = (id, title, subtitle, categoryId, tags, lead, type = 'Eina local') => ({
  id,
  title,
  subtitle,
  lead,
  icon: ICONES_ITEMS_WIKI[id] || FileText,
  categoryId,
  categoryIds: [categoryId],
  tags,
  attributes: { type, author: 'Sistema' },
  content: ''
});

export const TIPUS_DOCUMENTACIO = 'Documentació';

export const DATA_DOCUMENTACIO = Object.freeze({
  tractors_aprovacio: '2026-10-27T10:04:00+01:00',
  sentinelles_panell: '2026-10-27T10:01:00+01:00'
});

const SUBTITOLS_DOCUMENTACIO = Object.freeze({
  sentinelles_panell: 'Els set sentinelles d’autonomia: què observen i com s’aproven'
});

const PECES_MAQUINARIA = Object.freeze([
  ['tractors_aprovacio', 'Aprovació de tractors', 'Què fa cada tractor, la seua empremta i la teua signatura', ['tractors'],
    'Un tractor és un automatisme que processa dades. Cap s’executa si no n’has aprovat la versió exacta: l’empremta cobrix el manifest, la fitxa i cada línia de les fonts llistades, que són el codi del tractor, el de la seua interfície i el d’esta porta. Els components comuns de l’app (botons, diàlegs, navegació) no hi entren. Si en canvia una línia, torna a «pendent».'],
  ['sentinelles_panell', 'Sentinelles', 'Els set sentinelles d’autonomia: aprova’ls i mira què observen', ['sentinelles'],
    'Un sentinella és un tractor que només observa: llig el que tries, alça banderes i proposa, però no aplica, no esborra, no envia i no paga res. Només treballa si n’has aprovat la versió exacta, i l’empremta d’eixa versió cobrix el seu codi, el de la seua interfície i el de la porta. Els components comuns de l’app (botons, diàlegs, navegació) no hi entren. Si en canvia una línia, torna a «pendent».'],
  ['agents_panell', 'Agents (BIOS)', 'EL BIOS COGNITIU i directrius dels agents (AGENTS.md)', ['agents']]
]);

/**
 * @param {{ DEV?: boolean }} [env] només DEV === true les activa
 * @returns {{ categories: object[], items: object[] }}
 */
export function modulsLocalsActius(env) {
  if (env?.DEV !== true) return { categories: [], items: [] };
  return {
    categories: [],
    items: PECES_MAQUINARIA.map(([id, title, subtitle, tags, lead]) => einaLocal(id, title, subtitle, 'maquinaria_cat', tags, lead))
  };
}

/**
 * @param {{ DEV?: unknown }} [env]
 * @returns {{ items: object[] }}
 */
export function documentacioMaquinariaActiva(env) {
  if (env?.DEV === true) return { items: [] };
  return {
    items: PECES_MAQUINARIA.map(([id, title, subtitle, tags, lead]) => {
      const fitxa = einaLocal(id, title, SUBTITOLS_DOCUMENTACIO[id] || subtitle, 'maquinaria_cat', tags, lead, TIPUS_DOCUMENTACIO);
      const date = DATA_DOCUMENTACIO[id];
      return date ? { ...fitxa, attributes: { ...fitxa.attributes, date } } : fitxa;
    })
  };
}

export const AVIS_EINA_LOCAL_SENSE_TRADUCCIO = 'Les eines locals no es traduïxen: el que mostren no ix d’este ordinador.';

export function dataDeDocumentWiki(item) {
  return dataHoraDeBarra({
    creat: [item?.attributes?.date, dataDelNom(item?.id)],
    modificat: item?.attributes?.updated ?? item?.updated
  });
}

export function destiInternDeWiki(hrefCru, camiActual = '/wikidepoble') {
  if (typeof hrefCru !== 'string') return null;
  const href = hrefCru.trim();
  if (!href || href.startsWith('#') || href.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return null;
  if (href.startsWith('?')) return `${camiActual || '/wikidepoble'}${href}`;
  if (href.startsWith('/')) {
    if (/^\/(assets|ap|__iaia|api)(\/|$)/.test(href)) return null;
    if (/\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(href)) return null;
    return href;
  }
  return null;
}

export const CATEGORIA_INICIAL_WIKI = '__intro_cat';
