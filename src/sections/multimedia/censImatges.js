/**
 * censImatges.js — el cens de les imatges de public/assets per a l'Arxiu
 * visual (/multimedia).
 *
 * Onada 0.3 (Gauntlet 261016, M03; pla 261016_1530: «Eliminar el límit
 * artificial d'11 fotos de mostra […] L'Arxiu Visual ha de recuperar i
 * reflectir totes les imatges del sistema») · Fet a mà a partir de
 * `rg --files public/assets` (cap script), el 16-10-2026. Cada entrada és
 * { src, titol, ambit, origen } i, si és d'un poble, `poble` (el slug):
 *   · ambit · 'poble' (towns/, uploads/poble/), 'persona' (la gent de veres),
 *     'entitat' (empreses, ajuntaments i grups), 'ia' (els personatges i els
 *     agents IA) o 'contingut' (les il·lustracions, les vinyetes i les fotos
 *     dels articles). 'sistema' queda per als recursos de la interfície, que no
 *     hi entren.
 *   · origen · 'ia' (generada amb IA), 'foto' (fotografia o document real, no
 *     generat) o 'sistema' (captures i esquemes de la mateixa app). En el
 *     dubte, 'foto': els drets d'una foto real mai poden dir «Fet per la
 *     IAIA», i una il·lustració marcada com a foto només diu «No declarats».
 *     Els dubtosos es van mirar a ull (16-10-2026): els de uploads/brain/ amb
 *     marca de temps són il·lustracions generades; el Mac Mini es queda com a
 *     'foto' fins que el Mestre diga d'on ve.
 * Fora del cens (EXCLOSES, amb el motiu): els logotips i les insígnies, tot
 * system/ui (logotips, la imatge d'OpenGraph i el fons del Xat), els SVG i les
 * còpies. Els avatars triplicats (uploads/avatars, uploads/gent/avatars i
 * uploads/ia/NN-…/avatars) es queden una sola vegada, a uploads/avatars, que
 * és el camí que nomena el codi; les còpies amb un altre nom (la mateixa mida
 * i el mateix contingut) també fora, i les variants de resolució o de format
 * de la mateixa imatge es queden en una.
 * Cap EXIF al cens: cap ordre pot llegir binaris en esta fase. El visor llig
 * l'EXIF de la foto oberta al client (useMetadadesFoto.js).
 * Es carrega amb import() només a /multimedia (useCensImatges.js): ni el
 * Cercador ni la resta de l'app no el paguen. Mòdul de dades pures: el mapa de variants socials és compartit; cap JSX.
 * Prova: censImatges.test.js (cada src existix al disc i cada imatge ràster de
 * public/assets és al cens, a EXCLOSES o n'és la bessona .webp).
 * Bessones WebP (encàrrec 261019_1425) · tooling/media/optimitzar_webp.mjs
 * escriu NOM.webp al costat de les fotos pesants i no toca mai l'original
 * (regla a src/config/politicaDeMitjans.js). El cens continua nomenant
 * l'original, una sola entrada per foto: l'id, els drets, l'origen i la fusió
 * de l'Arxiu no canvien. Quin dels dos fitxers se servix ho decidix el
 * resolutor de recursos (assetResolver.js) segons el paquet.
 * Ordre del Mestre (261021, torn fase 2, Mòdul B, P0-14) · Els originals que
 * tenien bessona amb les mateixes dimensions i que cap SQL, ni index.html ni
 * el manifest no citaven ixen de public/ (evacuats, no esborrats, a
 * _multimedia_de_poble/originals_raster_public/). Sense original, la .webp ja
 * no és la bessona de ningú: és la imatge, i el cens (i EXCLOSES) la nomena
 * a ella, amb la mateixa entrada, el mateix id (idDelCens lleva l'extensió) i
 * les mateixes mides.
 */

import { VARIANTS_SOCIALS } from '../../config/imatgeSocial.js';

export const AMBITS = Object.freeze(['poble', 'persona', 'entitat', 'ia', 'contingut']);

const e = (src, titol, ambit, origen, poble) => Object.freeze(poble ? { src, titol, ambit, origen, poble } : { src, titol, ambit, origen });

/* Les dues fotos de cada poble de la Viquipèdia (scripts/fetch_town_media.mjs). */
const POBLES_VIQUIPEDIA = [
  ['la-torre-de-les-macanes', 'La Torre de les Maçanes'], ['penaguila', 'Penàguila'], ['benifallim', 'Benifallim'],
  ['sella', 'Sella'], ['orxeta', 'Orxeta'], ['relleu', 'Relleu'], ['alcoleja', 'Alcoleja'], ['xixona', 'Xixona'], ['tibi', 'Tibi']
];

/* Les vinyetes de les apps (ui/plugins), il·lustracions d'IA. L'extensió,
   'jpg' si no en porta: les que diuen 'webp' només viuen ja com a WebP (Mòdul
   B, 261021, capçalera). */
const VINYETES = [
  ['animalets', 'Vinyeta d’Animalets', 'webp'], ['bascula', 'Vinyeta de la Bàscula'], ['cervell', 'Vinyeta del Cervell'],
  ['consola', 'Vinyeta de la Consola'], ['disseny', 'Vinyeta de Disseny'], ['fedivers', 'Vinyeta del Fedivers', 'webp'],
  ['gestoria', 'Vinyeta de la Gestoria'], ['habitatge', 'Vinyeta d’Habitatge', 'webp'], ['mapa', 'Vinyeta del Mapa', 'webp'],
  ['rebost', 'Vinyeta del Rebost', 'webp'], ['rss', 'Vinyeta de Notícies'], ['salut', 'Vinyeta de Salut', 'webp'],
  ['treball', 'Vinyeta de Treball', 'webp'], ['vehicle', 'Vinyeta de Vehicles', 'webp']
];

export const CENS_IMATGES = Object.freeze([
  e('/assets/soc_de_poble_ibanez.webp', 'Sóc de Poble a l’estil Ibáñez', 'contingut', 'ia'),

  e('/assets/events/aplec_2023_cartell.jpg', 'Cartell del 2n Aplec pel Territori', 'contingut', 'foto'),
  e('/assets/events/aplec_2023_ponents.png', 'Captura: la targeta de l’Aplec al catàleg', 'contingut', 'sistema'),
  e('/assets/events/aplec_2023_reunio.webp', 'Captura: la pàgina de l’Aplec', 'contingut', 'sistema'),
  e('/assets/events/nano_sessio_treball.png', 'Sessió de treball', 'contingut', 'ia'),

  e('/assets/fotos/carla-soriano.png', 'Carla Soriano', 'ia', 'ia'),
  e('/assets/fotos/el-viatjant.png', 'El Viatjant', 'ia', 'ia'),
  e('/assets/fotos/iaia-maria.png', 'IAIA MarIA', 'ia', 'ia'),
  e('/assets/fotos/javi-llinares-perfil-1200px.jpg', 'Javi Llinares', 'persona', 'foto'),
  e('/assets/fotos/sultan.png', 'Sultan', 'ia', 'ia'),

  e('/assets/img/nano_porta_del_mas.png', 'La porta del Mas', 'contingut', 'ia'),
  e('/assets/img/nano_porta_masia_roure_1774195469079.png', 'La porta del Mas del Roure', 'contingut', 'ia'),
  e('/assets/img/pi-pla-verd.jpg', 'El pi del Pla Verd', 'contingut', 'foto'),
  e('/assets/img/que-es-socdepoble-1.jpg', 'Què és Sóc de Poble? (1)', 'contingut', 'foto'),
  e('/assets/img/que-es-socdepoble-2.jpg', 'Què és Sóc de Poble? (2)', 'contingut', 'foto'),
  e('/assets/img/que-es-socdepoble-3.jpg', 'Què és Sóc de Poble? (3)', 'contingut', 'foto'),
  e('/assets/img/que-es-socdepoble-4.jpg', 'Què és Sóc de Poble? (4)', 'contingut', 'foto'),

  e('/assets/nano_cards/animalets_nano_card.jpg', 'Animalets', 'contingut', 'ia'),
  e('/assets/nano_cards/calendari_nano_card.jpg', 'Calendari', 'contingut', 'ia'),
  e('/assets/nano_cards/cervell_nano_card.jpg', 'Cervell', 'contingut', 'ia'),
  e('/assets/nano_cards/drets_autor_comic.jpg', 'Drets d’autor', 'contingut', 'ia'),
  e('/assets/nano_cards/gestoria_nano_card.jpg', 'Gestoria', 'contingut', 'ia'),
  /* Ordre del Mestre del 30-10-2026 (B1) · Les portades del Govern del Mestre a /consola (imatgesConsola.js). */
  e('/assets/nano_cards/govern_balanc_nano_card.jpg', 'Govern del Mestre: balanç', 'contingut', 'ia'),
  e('/assets/nano_cards/govern_certificacio_nano_card.jpg', 'Govern del Mestre: certificació', 'contingut', 'ia'),
  e('/assets/nano_cards/govern_comunicacio_nano_card.jpg', 'Govern del Mestre: comunicació', 'contingut', 'ia'),
  e('/assets/nano_cards/govern_requeriments_nano_card.jpg', 'Govern del Mestre: requeriments', 'contingut', 'ia'),
  e('/assets/nano_cards/lector_rss_nano_card.jpg', 'Lector RSS', 'contingut', 'ia'),
  e('/assets/nano_cards/mercat_nano_card.webp', 'Mercat', 'contingut', 'ia'),
  e('/assets/nano_cards/metriques_nano_card.jpg', 'Mètriques', 'contingut', 'ia'),
  e('/assets/nano_cards/mur_nano_card.jpg', 'Mur', 'contingut', 'ia'),
  e('/assets/nano_cards/snippet_nano_card.jpg', 'Snippet', 'contingut', 'ia'),
  e('/assets/nano_cards/vehicle_nano_card.jpg', 'Vehicle', 'contingut', 'ia'),

  e('/assets/notes/bloc_notes_vintage.jpg', 'Bloc de notes', 'contingut', 'ia'),

  ...POBLES_VIQUIPEDIA.flatMap(([slug, nom]) => [
    e(`/assets/towns/${slug}/1.jpg`, nom, 'poble', 'foto', slug),
    e(`/assets/towns/${slug}/2.jpg`, `${nom}, segona vista`, 'poble', 'foto', slug)
  ]),

  ...VINYETES.map(([fitxer, titol, extensio = 'jpg']) => e(`/assets/ui/plugins/${fitxer}_vinyeta.${extensio}`, titol, 'contingut', 'ia')),
  e('/assets/ui/plugins/tpv_vinyeta.webp', 'Vinyeta del Bar', 'contingut', 'ia'),

  e('/assets/uploads/ajuntament/la-torre-de-les-macanes/avatar/IMG_20200904_143451.jpg', 'Ajuntament de la Torre de les Maçanes', 'entitat', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/ajuntament/la-torre-de-les-macanes/post/collita-poma-local.webp', 'Collita de poma local', 'entitat', 'ia'),

  e('/assets/uploads/avatars/andreu-soler-comic.png', 'Andreu Soler', 'ia', 'ia'),
  e('/assets/uploads/avatars/avatar-marc-comic.png', 'Marc (El Gall)', 'ia', 'ia'),
  e('/assets/uploads/avatars/avatar-ratoli-comic.png', 'Súper Ratolí', 'ia', 'ia'),
  e('/assets/uploads/avatars/beatriz-ortega-comic.png', 'Beatriz Ortega', 'ia', 'ia'),
  e('/assets/uploads/avatars/carla-soriano_comic.png', 'Carla Soriano, en còmic', 'ia', 'ia'),
  e('/assets/uploads/avatars/elena-popova-comic.png', 'Elena Popova', 'ia', 'ia'),
  e('/assets/uploads/avatars/flash-comic.png', 'Flash', 'ia', 'ia'),
  e('/assets/uploads/avatars/joan-batiste-comic.png', 'Joan Batiste', 'ia', 'ia'),
  e('/assets/uploads/avatars/mixa-comic.png', 'La Mixa', 'ia', 'ia'),
  e('/assets/uploads/avatars/nano-banana-comic.png', 'Nano Banana', 'ia', 'ia'),
  e('/assets/uploads/avatars/nano_cita_metge.png', 'Cita amb el metge', 'ia', 'ia'),
  e('/assets/uploads/avatars/nano_escola_comic.png', 'L’escola', 'ia', 'ia'),
  e('/assets/uploads/avatars/nano_salut_comic.png', 'La salut', 'ia', 'ia'),
  e('/assets/uploads/avatars/nano_simbiosi_sobirana.png', 'Simbiosi sobirana', 'ia', 'ia'),
  e('/assets/uploads/avatars/pepica-vall-comic.png', 'Pepica la Vall', 'ia', 'ia'),
  e('/assets/uploads/avatars/vicent-ferris-comic.png', 'Vicent Ferris', 'ia', 'ia'),

  e('/assets/uploads/brain/aplec_danses_1774952191348.png', 'Danses a l’Aplec', 'contingut', 'ia'),
  e('/assets/uploads/brain/art_trellat_farmer_1774708525806.png', 'El trellat del llaurador', 'contingut', 'ia'),
  e('/assets/uploads/brain/art_trellat_v2_1774708257858.png', 'El trellat', 'contingut', 'ia'),
  e('/assets/uploads/brain/beatriz_somriure_1774195114538.png', 'Beatriz somriu', 'contingut', 'ia'),
  e('/assets/uploads/brain/caricatura_socdepoble_portada.webp', 'Caricatura de Sóc de Poble', 'contingut', 'ia'),
  e('/assets/uploads/brain/collita_pomes_valencia_1779774496548.png', 'Collita de pomes', 'contingut', 'ia'),
  e('/assets/uploads/brain/forensic_psychiatry_ai_1775882113147.png', 'Psiquiatria forense i IA', 'contingut', 'ia'),
  e('/assets/uploads/brain/hero_panoramic_landscape_1774710654078.png', 'Paisatge panoràmic', 'contingut', 'ia'),
  e('/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png', 'Vista rural panoràmica', 'contingut', 'ia'),
  e('/assets/uploads/brain/hero_serrella_comic_1774709602282.png', 'La Serrella, en còmic', 'contingut', 'ia'),
  e('/assets/uploads/brain/iaia_maria_avatar.jpg', 'La IAIA MarIA', 'ia', 'ia'),
  /* Ordre del Mestre (261021) · L'avatar oficial de la IAIA amb el mòbil (a60d6fd3); la seua bessona .webp és la que pinta /iaia. */
  e('/assets/uploads/brain/iaia_maria_avatar_mobil.png', 'La IAIA MarIA amb el mòbil', 'ia', 'ia'),
  e('/assets/uploads/brain/ibanez_design_system_1780246898431.png', 'El sistema de disseny a l’estil Ibáñez', 'contingut', 'ia'),
  /* Pla 261022_1645 · L'original canònic és el .png (ordre del Mestre); el .jpg duplicat ja no és a public/. */
  e('/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png', 'Pedra Seca a l’estil Ibáñez', 'contingut', 'ia'),
  e('/assets/uploads/brain/llibre_anima_cover_1776032370908.png', 'Portada del llibre de l’ànima', 'contingut', 'ia'),
  e('/assets/uploads/brain/mac_mini_m4_1787721966622.jpg', 'Mac Mini M4', 'contingut', 'foto'),
  e('/assets/uploads/brain/media__1775376768839.webp', 'Infografia de Sóc de Poble', 'contingut', 'ia'),
  e('/assets/uploads/brain/media__1775516493101.webp', 'Les IA i el CSS', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano-banana_arxiver_1774284589999.webp', 'La Nano Banana arxivera', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_agricola_mas_1773539958988.png', 'El Mas agrícola', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp', 'L’ànima del Mas', 'contingut', 'ia'),
  /* Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) · La portada de
     «Descàrregues i Aplicacions» (PAGE_COPY.descarregues), com la del Xat. Es
     nomena l'original: el .webp que pinta la pàgina n'és la bessona. */
  e('/assets/uploads/brain/nano_descarregues_app.jpg', 'Portada de Descàrregues', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_mel_font_roja_1774216345755.png', 'Mel de la Font Roja', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_mixa_socis_1774215027069.png', 'La Mixa i els socis', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_oli_oliva_1774198089084.png', 'Oli d’oliva', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_pedra_seca_1777089570387.webp', 'Pedra seca', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_versions_ibanez_v1_1_10.webp', 'El tauler de versions del poble', 'contingut', 'ia'),
  e('/assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png', 'Termodinàmica i maquinari d’IA', 'contingut', 'ia'),
  e('/assets/uploads/brain/xat_portada.webp', 'Portada del Xat', 'contingut', 'ia'),

  /* Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) · La
     portada i la panoràmica del cos de /page/fediversity (PAGE_COPY.fediversity).
     Es nomena l'original .png de paleta: la .webp que pinta la pàgina n'és la
     bessona, com a Descàrregues. */
  e('/assets/uploads/fediversity-hero.png', 'Portada de la candidatura NLnet', 'contingut', 'ia'),
  e('/assets/uploads/fediversity-maquinaria.png', 'La maquinària de la candidatura NLnet', 'contingut', 'ia'),
  /* Ordres del Mestre del 30-10-2026 (Gauntlet, cicle 2) · La caldera de coure,
     segona il·lustració dins del cos de /page/consola (PAGE_COPY.consola). Es
     nomena l'original .png de paleta: la .webp que pinta la pàgina n'és la
     bessona, com a /page/fediversity. */
  e('/assets/uploads/consola-caldera.png', 'La caldera de la Consola', 'contingut', 'ia'),

  e('/assets/uploads/companies/mercat/aitana.png', 'Oli verge', 'entitat', 'ia'),
  e('/assets/uploads/companies/mercat/camiseta_portada.png', 'Samarreta', 'entitat', 'ia'),
  e('/assets/uploads/companies/mercat/flowers_bouquet.png', 'Ram de flors', 'entitat', 'ia'),
  e('/assets/uploads/companies/mercat/generic_market.png', 'Hort del mercat', 'entitat', 'ia'),

  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png', 'Samarreta Sóc de Poble a la festa', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/02-samarreta-socdepoble-roly-plom-oscur-1024px.png', 'Samarreta Sóc de Poble, gris plom', 'entitat', 'foto'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/03-young-man-tshirt.png', 'Samarreta Sóc de Poble, un jove', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/04-iaia-tshirt.png', 'Samarreta Sóc de Poble, la iaia', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/05-samarreta-socdepoble-muntanya.jpg', 'Samarreta Sóc de Poble a la muntanya', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/06-group-tshirt.png', 'Samarreta Sóc de Poble, la colla', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/07-rustic-detail.png', 'Samarreta Sóc de Poble, plegada', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg', 'Javi Llinares amb la samarreta', 'persona', 'foto'),
  e('/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/samarreta-socdepoble-verd-638px.jpg', 'Samarreta Sóc de Poble, verda', 'entitat', 'foto'),

  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/0-container.webp', 'Anatomia de Pedra Seca: el contenidor', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/1-header.png', 'Anatomia de Pedra Seca: la capçalera', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/3-content.webp', 'Anatomia de Pedra Seca: el contingut', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/4-secction-header.png', 'Anatomia de Pedra Seca: la capçalera de secció', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/5-section-media.webp', 'Anatomia de Pedra Seca: el mitjà', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/6-section-capucha-identidad.png', 'Anatomia de Pedra Seca: la caputxa d’identitat', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/7-section-title-decoration.png', 'Anatomia de Pedra Seca: la decoració del títol', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-codig-v3.webp', 'L’art del codi', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-iaia-v4.webp', 'L’art de la IAIA', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-sobirania-v2.webp', 'L’art de la sobirania', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-trellat-v3.webp', 'L’art del trellat', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/exemple-de-poble-001.png', 'Exemple de poble', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/nano-banana.webp', 'La Nano Banana', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/presentacio.jpg', 'Presentació de Sóc de Poble', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/genotip/portada_genotip.png', 'Portada del Genotip', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/iaies-mundials/portada_iaies.webp', 'Les iaies del món', 'entitat', 'ia'),

  e('/assets/uploads/ia/10-joanet-serra-xiquet/avatars/joanet-serra-comic.png', 'Joanet Serra', 'ia', 'ia'),
  e('/assets/uploads/ia/11-tio-colau-viajant/avatars/tio-colau-comic.webp', 'Tio Colau', 'ia', 'ia'),
  e('/assets/uploads/ia/05-carla-soriano-doctora/posts/post-carla-salut.png', 'Carla Soriano: la salut', 'ia', 'ia'),
  e('/assets/uploads/ia/06-pepica-la-vall-cuinera/posts/post-pepica-cuina.png', 'Pepica la Vall: la cuina', 'ia', 'ia'),
  e('/assets/uploads/ia/15-marc-el-gall-el-temps/posts/post-gall-meteo.png', 'El Gall: el temps', 'ia', 'ia'),

  e('/assets/uploads/poble/benimassot/img-benimassot-main.jpg', 'Benimassot', 'poble', 'foto', 'benimassot'),
  e('/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.JPG', 'La Torre de les Maçanes (DSC00320)', 'poble', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/poble/la-torre-de-les-macanes/DSC00410.JPG', 'La Torre de les Maçanes (DSC00410)', 'poble', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/poble/la-torre-de-les-macanes/DSC01197.JPG', 'La Torre de les Maçanes (DSC01197)', 'poble', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_150735.jpg', 'La Torre de les Maçanes, octubre de 2016', 'poble', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_153325_SRES.jpg', 'La Torre de les Maçanes, octubre de 2016 (2)', 'poble', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/poble/la-torre-de-les-macanes/img-la-torre-de-les-ma-anes-main.jpg', 'La Torre de les Maçanes', 'poble', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/poble/la-torre-de-les-macanes/toponim-la-torre-de-les-macanes-2048px.jpg', 'Topònim de la Torre de les Maçanes', 'poble', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/poble/penaguila/img-pen-guila-main.jpg', 'Penàguila', 'poble', 'foto', 'penaguila')
]);

/* Els avatars repetits als calaixos de gent/ i ia/: el codi nomena el de
   uploads/avatars. */
const COPIES_DELS_AVATARS = [
  'andreu-soler-comic.png', 'avatar-marc-comic.png', 'avatar_samir_comic.png', 'beatriz-ortega-comic.png', 'carla-soriano_comic.png',
  'el-viatjant.png', 'elena-popova-comic.png', 'flash-comic.png', 'iaia_comic_matriarch.png', 'joan-batiste-comic.png', 'mixa-comic.png',
  'nano-banana-comic.png', 'nano_escola_comic.png', 'nano_salut_comic.png', 'pepica-vall-comic.png', 'vicent-ferris-comic.png'
];
const COPIES_IA = [
  ['02-nano-banana-artiste', 'nano-banana-comic.png'], ['03-vicent-ferris-agronom', 'vicent-ferris-comic.png'],
  ['04-beatriz-ortega-mestra', 'beatriz-ortega-comic.png'], ['05-carla-soriano-doctora', 'carla-soriano-ibanez.png'],
  ['06-pepica-la-vall-cuinera', 'pepica-vall-comic.png'], ['07-andreu-soler-capatas', 'andreu-soler-comic.png'],
  ['08-elena-popova-music', 'elena-popova-comic.png'], ['09-joan-batiste-arxiver', 'joan-batiste-comic.png'],
  ['12-el-ratoli-informatic', 'avatar-ratoli-comic.png'], ['13-flash-carter', 'flash-comic.png'],
  ['14-la-mixa-gestora', 'mixa-comic.png'], ['15-marc-el-gall-el-temps', 'avatar-marc-comic.png']
];

/** Les imatges ràster de public/assets que NO entren al cens, amb el motiu. Tot
 *  /assets/system/ (la interfície) i els SVG en queden fora sense nomenar-los. */
export const EXCLOSES = Object.freeze({
  /* R-01: derivades socials explícites del mapa canònic, una sola foto a l’Arxiu. */
  ...Object.fromEntries(Object.entries(VARIANTS_SOCIALS).map(([original, social]) => [social, `targeta social dedicada de ${original}: no és cap foto nova de l’Arxiu`])),
  '/assets/ui/plugins/tpv_vinyeta.jpg': 'la mateixa vinyeta en JPEG; el codi només nomena la WebP (registrePlugins.js)',
  /* P1-26 · El mateix fitxer, byte a byte, que l'original de brain/ (el que
     nomenen el cens i agentsSeed.js); la .webp germana en seguix l'estat. */
  '/assets/fotos/iaia_maria_avatar_mobil.png': 'còpia de /assets/uploads/brain/iaia_maria_avatar_mobil.png',
  '/assets/uploads/avatars/el-viatjant.png': 'còpia de /assets/fotos/el-viatjant.png',
  '/assets/uploads/avatars/iaia_comic_matriarch.png': 'còpia de /assets/fotos/iaia-maria.png',
  '/assets/uploads/avatars/javi-llinares-foto_perfil-01.jpg': 'còpia de /assets/fotos/javi-llinares-perfil-1200px.jpg',
  '/assets/uploads/avatars/nano_sessio_treball.png': 'còpia de /assets/events/nano_sessio_treball.png',
  '/assets/uploads/avatars/avatar_samir_comic.png': 'còpia de /assets/uploads/brain/hero_serrella_comic_1774709602282.png',
  ...Object.fromEntries(COPIES_DELS_AVATARS.map((nom) => [`/assets/uploads/gent/avatars/${nom}`, 'còpia de l’avatar de /assets/uploads/avatars/'])),
  ...Object.fromEntries(COPIES_IA.map(([calaix, nom]) => [`/assets/uploads/ia/${calaix}/avatars/${nom}`, 'còpia de l’avatar de /assets/uploads/avatars/'])),
  '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg': 'còpia de /assets/fotos/javi-llinares-perfil-1200px.jpg',
  '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.webp': 'la mateixa foto de perfil a més resolució',
  '/assets/uploads/brain/avatar_ratoli_comic_1778960942888.webp': 'còpia de /assets/uploads/avatars/avatar-ratoli-comic.png',
  '/assets/uploads/brain/cuc-de-pi-poster.png': 'còpia de /assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png',
  '/assets/uploads/brain/nano_astronauta_esmorzar_1773441997380.webp': 'còpia de /assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png',
  '/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png': 'còpia de /assets/nano_cards/mercat_nano_card.webp',
  /* Pla 261022_1645 (ordre del Mestre) · Abans s'excloïa el .png i es quedava el JPEG; ara el
     canònic és el .png, que és al cens, i el .jpg duplicat ja no és a public/. */
  '/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg': 'logotip',
  '/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-q.png': 'logotip',
  '/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r-trans.png': 'logotip',
  '/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r.png': 'logotip',
  '/assets/uploads/empresa/soc-de-poble/posts/el-projecte/antigravity-badge.webp': 'insígnia d’una eina (logotip)',
  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 5; Gemini 2030,
     A3.1) · La captura fòssil de la barra lateral antiga (v10.38.20, amb el
     botó «+ CONNECTAR» d'abans): cap article no la fa servir i l'Arxiu la
     pintava com una foto «de l'arxiu». El fitxer es queda a public/. */
  '/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png': 'captura fòssil de la barra lateral antiga: ja no ensenya la interfície vigent',
  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 5) · Les imatges
     d'OpenGraph de La Torre: targetes socials, no fotos de l'Arxiu. */
  ...Object.fromEntries([
    '/assets/towns/la-torre-de-les-macanes/og-la-torre-1200x630.jpg',
    /* Pla 261022_1645 (ordre del Mestre) · De mapa_cuadrat_halo es queda el .png (canònic); el .jpg ja no és a public/. */
    ...['apaisat.jpg', 'classic.jpg', 'foto.jpg', 'mapa_apaisat.jpg', 'mapa_cuadrat_blanc.jpg',
      'mapa_cuadrat_halo.png', 'verd_net.jpg'].map((nom) => `/assets/uploads/poble/la-torre-de-les-macanes/og_gentdelatorre_${nom}`)
  ].map((src) => [src, 'targeta social (OpenGraph): no és cap foto de l’Arxiu']))
});

/* El camí de l'original que nomena el motiu d'una còpia: «còpia de /assets/…»
   o «còpia de l’avatar de /assets/uploads/avatars/» (la carpeta: l'original
   porta el mateix nom de fitxer que la còpia). Cap altre motiu en nomena. */
const originalDe = (copia, motiu) => {
  const trossos = /^còpia de (?:l’avatar de )?(\/assets\/\S+)$/.exec(motiu);
  if (!trossos) return null;
  return trossos[1].endsWith('/') ? `${trossos[1]}${copia.split('/').pop()}` : trossos[1];
};
const SRCS_DEL_CENS = new Set(CENS_IMATGES.map((entrada) => entrada.src));

/** Revisió adversarial del 261016 · Les còpies d'EXCLOSES amb el seu original
 *  del cens ({ còpia: original }), per a la fusió de l'Arxiu (mediaContent.js ·
 *  fusionaMitjans): un mitjà del port que porta la còpia (la fila remota porta
 *  /assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg)
 *  ja és l'original, i el cens no torna a afegir la mateixa foto amb un altre
 *  camí. Només les còpies que nomenen el seu original, i l'original és al cens. */
export const ALIES_DEL_CENS = Object.freeze(Object.fromEntries(
  Object.entries(EXCLOSES)
    .map(([copia, motiu]) => [copia, originalDe(copia, motiu)])
    .filter(([, original]) => original && SRCS_DEL_CENS.has(original))
));

/** L'id d'una entrada del cens, estable i apte per a ?foto=: «cens-» i el camí
 *  sense /assets/ ni l'extensió, amb guions. */
export function idDelCens(src) {
  const cami = String(src || '').replace(/^\/assets\//, '').replace(/\.[A-Za-z0-9]+$/, '');
  return `cens-${cami.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()}`;
}

/** Les entrades del cens amb la forma dels mitjans de l'Arxiu visual
 *  (mediaContent.js): sense data ni article, de l'arxiu. */
export function mitjansDelCens(cens = CENS_IMATGES) {
  return cens.map((entrada) => ({
    id: idDelCens(entrada.src),
    title: entrada.titol,
    src: entrada.src,
    kind: 'image',
    tag: 'Arxiu',
    origen: entrada.origen,
    ambit: entrada.ambit,
    ...(entrada.poble ? { poble: entrada.poble } : {}),
    sectionId: 'multimedia'
  }));
}
