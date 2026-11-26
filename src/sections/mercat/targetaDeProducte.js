import { destinsDeProducte } from '../../data/taxonomia/destinsDeProducte.js';
import { labelsSistema } from '../../data/taxonomia/taxonomiaPublicacio.js';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
/**
 * targetaDeProducte.js — les props de la UniversalCard d'un producte del
 * Mercat, una sola regla per a la llista (MercatSection) i per a la mostra
 * del catàleg (EspecimenUniversalCard).
 *
 * Revisió del 261007 (M3-12) · L'espècimen pintava una Samarreta inventada
 * (una foto vella d'un servidor de producció i un text que no era el del
 * producte). Ara la mostra passa pel MATEIX camí que la llista. Mòdul pur:
 * cap React ni cap handler (Connectar i Comentar els posa qui munta la
 * targeta, amb el seu `objecte`).
 */
import { getSectionItemPath, rutaDePerfilPublicDAutor } from '../../config/navigation';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { COPYRIGHT_SDP, dataDElement } from '../../components/universal/editorial.js';
import { FORASTER } from '../../components/universal/UniversalUtils.js';
import { fotoDeLaTargeta } from './imatgesDeProducte.js';
import { preuInicialDelProducte } from './variacionsDeProducte.js';
import { formataEtiquetaHumana, senseHtmlCru } from './etiquetesMercat.js';
import { signaturaDeQuiSigna } from '../../data/identitatsSeed.js';
import { fontVideoPropia } from '../../utils/sanitize.js';
import { etiquetaDelPoble, pobleDeLElement } from '../pobles/etiquetaDelPoble.js';

/* Sense traductor, la reserva en valencià. */
const senseTraduccio = (_clau, reserva) => reserva;

/* C26-2 · IDEA-365 (21:40, regla 3) i D3 de l'integrador · La categoria i l'etiqueta d'un producte són
   taxonomia i porten a la seua pàgina (la editorial o l'automàtica de /categoria/<slug> i /etiqueta/<slug>).
   La ruta ix del slug intern (category_slug, tag), no del text traduït: «Food» o «Ropa» no portaven a
   /categoria/alimentacio ni a /categoria/roba. Un slug que no en dona cap és text inert. */
function pindolaDeTaxonomia(slug, text, className) {
  const ruta = rutaDePindola({ text: slug, className });
  return { text, className, ...(ruta ? { href: ruta } : { inerta: true }) };
}

/* R22 (Llibre Mestre, «4a Etiqueta Geogràfica Final») · `towns`, les fitxes
   de /pobles (useCoreContent): la pastilla del poble, la de més a la dreta,
   només ix quan el poble de la publicació casa amb una fitxa. Sense fitxes
   (l'espècimen del catàleg, fora de l'App), les etiquetes de sempre. */
export function propsDeTargetaDeProducte(item, t = senseTraduccio, { towns, idioma = 'ca' } = {}) {
  /* Ordre del Mestre, 261001 · La boina del producte, amb el format i el
     lector únics (editorial.js · dataDElement), els mateixos que la seua
     targeta al Mur (TargetaDelMur.jsx): «dd/mm/aa» i «hh:mm», i el dateTime
     ISO del qual la pastilla trau on porta el Calendari (pastillaCalendari.js).
     Abans toLocaleDateString pintava «30/9/2026» (el format depén de l'ICU
     de cada navegador) i no passava dateTime. Sense cap data real, cap
     pastilla. */
  const data = dataDElement(item);
  /* La font única resol id/àlies i dona prioritat a l'entitat; el nom no
     identifica una persona. Gauntlet 261016 (Bloc -1; ordre del Mestre:
     «Sempre és la seua foto personal de perfil») · El resolutor únic de qui
     signa (identitatsSeed.js · signaturaDeQuiSigna). Abans la foto de la
     persona pilot només substituïa un avatar buit o la marca: una altra foto,
     un avatar opac o un que no era text es conservaven. Ara, sempre la seua. */
  const signatura = signaturaDeQuiSigna(item, {
    nom: item.author_name || item.seller || FORASTER.name,
    avatar: item.author_avatar || item.avatar_url
  });
  return {
    /* T3 · Sense nom, la reserva de qui no se sap (FORASTER, la mateixa que el
       mapejador del Mercat): mai l'entitat. */
    author: signatura.nom,
    /* Lògica d'Usuari (T4, T5): qui ven té perfil. Marató 2230 (pla 2045) · La
       boina enllaça al perfil públic de qui ven (rutaDePerfilPublicDAutor),
       també quan és l'entitat pilot. La reserva FORASTER (sense nom ni
       identitat) i un nom sense identitat coneguda no tenen cap pàgina: la
       boina queda sense enllaç, a propòsit, i no suplanta cap altra autoria. */
    authorHref: rutaDePerfilPublicDAutor(item) || undefined,
    /* SPEC G · les imatges pròpies ('/assets/…') es resolen en PINTAR-LES, amb
       la base de l'amfitrió; les dades no es tornen a escriure. Sense base, el
       mateix valor (assetResolver.js). T3 (ordre del Mestre, 261001) · primer
       l'avatar de qui signa (author_avatar, de la seua identitat), com la
       targeta del Mur i la barra taronja del detall. Sense foto, cap logo: la
       targeta hi pinta la silueta de reserva (UniversalCard,
       sp-card-avatar--fallback; autoriaNota.js). L'entitat ja porta el seu
       logo explícit (autoriaSeed). */
    avatarUrl: resolRecursPropi(signatura.avatar),
    body: item.lead || item.entradilla || senseHtmlCru(item.description) || '',
    /* T39 · els drets triats al producte; sense, el text de sèrie
       (COPYRIGHT_SDP), el mateix que la seua targeta al Mur i la seua pàgina.
       Abans, un literal que no llegia item.copyright (revisió del 261007,
       I1 i M3-02). */
    copyright: item.copyright || COPYRIGHT_SDP,
    date: data.date,
    time: data.time,
    dateTime: data.dateTime,
    imageAlt: item.title,
    /* Ordre del Mestre (261007) · la foto principal és la de la pàgina
       (imatgesDeProducte); sense cap foto pròpia, la reserva de sempre.
       Onada R22.1 · Quan el producte porta vídeo principal propi (video_url),
       imageUrl actua com a portada estil YouTube (poster) a UniversalCard. */
    imageUrl: resolRecursPropi(fotoDeLaTargeta(item, item.imageSrc)),
    ...(typeof item.video_url === 'string' && fontVideoPropia(resolRecursPropi(item.video_url))
      ? { videoUrl: fontVideoPropia(resolRecursPropi(item.video_url)) }
      : null),
    labels: [
      /* C26-2 #9 · Els destins (categoriesSistema) amb labelsSistema: el text de la interfície i la ruta
         canònica de cada Categoria de Sistema (/mur, /mercat, /calendari, /categoria/<slug>), la mateixa regla
         que la Card del Mur i la UniversalPage. Abans només Mur i Mercat portaven ruta. */
      ...labelsSistema(destinsDeProducte(item), idioma),
      item.category_slug ? pindolaDeTaxonomia(item.category_slug, formataEtiquetaHumana(item.category_slug, idioma), 'sdp-badge-category') : null,
      item.tag ? pindolaDeTaxonomia(item.tag, formataEtiquetaHumana(item.tag, idioma), 'sdp-badge-tag') : null,
      /* R22 · Ordre canònic [Mercat] → [categoria curta] → [subfamília humana] → [poble]:
         el recompte de variants no s'interposa; va just davant del poble.
         C26-2 (D3 de l'integrador) · El recompte no és taxonomia: text inert, sense /etiqueta/2-variants. */
      item.variations?.length ? { text: `${item.variations.length} ${t('section.mercat.variations', 'variants')}`, className: 'sdp-badge-accent', inerta: true } : null,
      /* R22 · El poble, sempre l'últim: porta a /pobles/<slug>, no al perfil de qui ven (authorHref). */
      etiquetaDelPoble(pobleDeLElement(item, towns))
    ].filter(Boolean),
    location: item.author_location || item.population || 'La Torre de les Maçanes',
    mainHref: getSectionItemPath('mercat', item.id),
    subtitle: item.subtitle || '',
    title: item.title,
    price: preuInicialDelProducte(item)
  };
}
