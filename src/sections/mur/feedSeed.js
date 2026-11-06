import { POBLES_APLEC_2023 } from '../pobles/townsSeed.js';
import { MANIFEST_DE_POBLE_HTML } from './articles/manifestDePobleContent.js';

/** AH-27 · WP 16893. El temps d'importació no substituïx la publicació històrica. */
export const MANIFEST_DE_POBLE_POST = {
  id: 'manifest-de-poble',
  slug: 'manifest-de-poble',
  type: 'post',
  title: 'Manifest de Poble',
  post_subtitle: 'Una veu compartida per als pobles menuts',
  description: 'Un document obert per a afrontar el despoblament i l’abandonament de l’agricultura',
  entradilla: 'Les associacions i el veïnat de l’Alcoià, el Comtat i les Marines unim esforços per a revitalitzar els nostres pobles. El Manifest recull les necessitats comunes i les propostes locals, amb l’Aplec pel Territori com a punt de trobada.',
  /* P0-26 / IDEA-97 (Onada R6) · El document sencer, en HTML editable des de
     /notes; el resum de la targeta continua sent l'entradilla. */
  content: MANIFEST_DE_POBLE_HTML,
  created_at: '2022-11-17T23:50:00+01:00',
  publish_date: '2022-11-17T23:50:00+01:00',
  boinaDataPublicacio: true,
  preservaDataHistorica: true,
  important: true,
  author_entity_id: 'socdepoble',
  author: 'Sóc de Poble',
  author_name: 'Sóc de Poble',
  author_avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  author_location: 'La Torre de les Maçanes',
  town: 'La Torre de les Maçanes',
  town_name: 'La Torre de les Maçanes',
  poble_id: 'la-torre-de-les-macanes',
  pobles_etiquetats: [...POBLES_APLEC_2023.map((poble) => poble.id), 'la-vall-d-ebo'],
  tags: ['Aplec pel Territori', 'Esdeveniments', 'Posant en Valor els Recursos Locals', 'Reivindicant'],
  image_url: '/assets/mur/manifest-de-poble/logo-manifest-de-poble-retallat.webp',
  image_alt: 'Logotip del Manifest de Poble',
  source_url: 'https://socdepoble.net/2022/11/17/manifest-de-poble/',
  wp_id: 16893,
  license: 'CC BY-NC-SA 4.0',
  copyright: 'Font original: Sóc de Poble (socdepoble.net) · CC BY-NC-SA 4.0 Sóc de Poble'
};

/** AH-27 · Destaquem patrimoni real sense donar-li una data d'esta setmana.
 * Este registre és separat de la demostració temporal de les pàgines noves.
 * IDEA-116 (Onada R9, R9V-C2-01) · Viu ací, al costat del Manifest, i
 * datesDeProvaMur.js el reexporta: així feedContent.js (entrada) no arrossega
 * les dates de prova, que només fa servir la capa de dades (tros diferit). */
export const IMPORTANTS_HISTORIQUES_DEL_MUR = Object.freeze([
  Object.freeze(['feedPosts', 'manifest-de-poble'])
]);

export const MOCK_FEED = [MANIFEST_DE_POBLE_POST];
