import { buildSearchText, firstMediaSource } from '../../config/contentHelpers.js';
import { MOCK_MARKET_ITEMS } from './marketSeed.js';
import { autoriaSeed } from '../../data/identitatsSeed.js';

import { resolveAsset } from '../../config/assetResolver.js';

export const MARKET_ITEMS = MOCK_MARKET_ITEMS.map((item) => {
  const imageSrc = firstMediaSource(item.image_url || item.image || item.avatar_url);

  const images = (item.images || []).map(img => resolveAsset(img));

  /* T3 (ordre del Mestre, 261001) · L'autoria (nom i avatar) ve de la
     identitat de qui signa (identitatsSeed · autoriaSeed), no d'una còpia
     escrita al producte: el Mac Mini de la persona pilot pintava el logo de
     l'entitat. Va a author_avatar, el camp que ja lligen la targeta del Mur i
     la barra taronja del detall; avatar_url i imageSrc no es toquen (Llei del
     Píxel).
     Onada 12 (261011; ordres 261011_0130, punt 1) · imageSrc continua sent
     l'avatar_url quan el producte no porta image_url ni image (els dos de la
     llavor: el logotip). Ja no és la foto de ningú: la Multimèdia
     (mediaContent.js · fotosDelMercat), el detall i el Cercador lligen
     `images`. Només queda com a RESERVA de qui no té cap foto pròpia
     (targetaDeProducte.js, TargetaDelMur.jsx, masDeLUsuari.js, indexCerca.js),
     i una prova d'un altre front el fixa (notes/masDeLUsuari.mercat.test.js):
     llevar-la és decisió del Mestre (imatgesDeProducte.js · fotoDeLaTargeta). */
  const autoria = autoriaSeed(item);

  return {
    ...item,
    ...(autoria ? { author_name: autoria.nom, author_avatar: autoria.avatar } : {}),
    sectionId: 'mercat',
    imageSrc,
    images,
    searchText: buildSearchText([
      item.title,
      item.description,
      item.seller,
      item.tag,
      item.category_slug
    ])
  };
});
