import { capturaVisibilitatMur } from './visibilitatMur.js';
import { registraCapitolsWiki } from './revisionsEditorialsDelNavegador.js';
import { publicMetadata } from '../config/publicationPolicy.js';

// Només el catàleg públic compilat. Mai s'hi posen notes ni dades del backend.
let capitols = Object.freeze([]);
let carrega = null;
const text = v => typeof v === 'string' ? v : '';
const esPublic = item => item && typeof item === 'object' && !Array.isArray(item)
  && typeof item.id === 'string' && item.id.length > 0
  && publicMetadata(item) && publicMetadata(item.attributes)
  && ![item, item.attributes].some(v => v && (v.private === true || v.draft === true || v.isDraft === true || v.public === false));

/** Mateix extractor que WikiDetail; cap retall ni segona redacció. */
export function preparaCapitolsWiki(items, extreuEditorial) {
  const ids = new Set();
  return Object.freeze((Array.isArray(items) ? items : []).filter(esPublic).filter(item => {
    if (ids.has(item.id)) return false;
    ids.add(item.id); return true;
  }).map(item => {
    const a = item.attributes ?? {}, editorial = extreuEditorial(text(item.content));
    const href = `/wikidepoble?item=${encodeURIComponent(item.id)}`;
    // Identitat canònica explícita; mai classifiquem una publicació pel títol.
    const sistemaNervios = item.id === 'sistema_nervios_skills_i_repositoris';
    return Object.freeze({ id: `wiki:${item.id}`, _wikiMur: true, wikiId: item.id, type: 'post', sectionId: 'mur',
      title: editorial.titol || text(item.title), post_subtitle: text(item.subtitle), subtitle: text(item.subtitle),
      entradilla: editorial.entradilla || '', lead: editorial.entradilla || '', summary: text(item.subtitle),
      image_url: text(item.image ?? a.image), image: text(item.image ?? a.image), imageAlt: text(item.imageAlt ?? a.imageAlt),
      created_at: text(item.date ?? a.date), updated_at: text(item.updated ?? a.updated), publish_date: text(item.updated ?? a.updated),
      ...(sistemaNervios ? {
        categoriesSistema: Object.freeze(['Sistema', 'Mur']),
        labels: Object.freeze([
          Object.freeze({ text: 'Sistema', className: 'sdp-badge-system', href: '/categoria/sistema' }),
          Object.freeze({ text: 'Mur', className: 'sdp-badge-system', href: '/mur' })
        ])
      } : {}),
      tags: Object.freeze((Array.isArray(item.tags) ? item.tags : []).filter(v => typeof v === 'string')),
      mainHref: href, href, content: text(item.content),
      ...capturaVisibilitatMur({ mostrarAlMur: typeof item.mur === 'boolean' ? item.mur : a.mur === true }) });
  }));
}

export async function carregaCapitolsWiki() {
  if (!carrega) carrega = Promise.all([import('./wikiManifest.js'), import('../sections/wiki-de-poble/parseMarkdown.js')])
    .then(([{ wikiManifest }, { extreuEditorial }]) => { capitols = preparaCapitolsWiki(wikiManifest.items, extreuEditorial); return capitols; })
    .catch(error => { carrega = null; throw error; });
  return carrega;
}

/** Conserva candidats ocults al catàleg per poder activar-los sense recàrrega.
 * La llista de dades del Mur es reconcilia amb la font canònica cada vegada. */
export function fusionaCapitolsWiki(llista) {
  if (!capitols.length) return llista;
  const hrefs = new Set(capitols.map(c => c.mainHref));
  const base = llista.filter(item => !item?._wikiMur && !hrefs.has(item?.mainHref ?? item?.href));
  const ids = new Set(capitols.map(c => c.id));
  return [...base.filter(item => !ids.has(item?.id)), ...capitols];
}

export async function completaMurAmbWiki(valor) {
  await carregaCapitolsWiki();
  const { revisaLlista } = await import('./revisionsEditorialsDelNavegador.js');
  return { ...valor, feedPosts: revisaLlista(valor.feedPosts, 'mur') };
}

/* v1.2.8 · Les revisions del Mur (revisionsEditorialsDelNavegador.js, a l'arrencada) fusionen els capítols
   des que este mòdul diferit es carrega. */
registraCapitolsWiki(fusionaCapitolsWiki);
