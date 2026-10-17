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
import { signaturaDeQuiSigna } from '../../data/identitatsSeed.js';

/* Sense traductor, la reserva en valencià. */
const senseTraduccio = (_clau, reserva) => reserva;

export function propsDeTargetaDeProducte(item, t = senseTraduccio) {
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
    body: item.description || '',
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
       (imatgesDeProducte); sense cap foto pròpia, la reserva de sempre. */
    imageUrl: resolRecursPropi(fotoDeLaTargeta(item, item.imageSrc)),
    labels: [
      { text: t('section.mercat.kicker', 'Mercat'), className: 'sdp-badge-system' },
      item.variations?.length ? { text: `${item.variations.length} ${t('section.mercat.variations', 'variants')}`, className: 'sdp-badge-accent' } : null,
      item.category_slug ? { text: item.category_slug, className: 'sdp-badge-category' } : null,
      item.tag ? { text: item.tag, className: 'sdp-badge-tag' } : null
    ].filter(Boolean),
    location: item.author_location || item.population || 'La Torre de les Maçanes',
    mainHref: getSectionItemPath('mercat', item.id),
    subtitle: item.subtitle || '',
    title: item.title,
    price: item.price
  };
}
