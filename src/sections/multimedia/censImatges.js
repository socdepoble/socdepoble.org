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
 * Cercador ni la resta de l'app no el paguen. Mòdul de dades pures: cap
 * import, cap JSX.
 * Prova: censImatges.test.js (cada src existix al disc i cada imatge ràster de
 * public/assets és al cens o a EXCLOSES).
 */

export const AMBITS = Object.freeze(['poble', 'persona', 'entitat', 'ia', 'contingut']);

const e = (src, titol, ambit, origen, poble) => Object.freeze(poble ? { src, titol, ambit, origen, poble } : { src, titol, ambit, origen });

/* Les dues fotos de cada poble de la Viquipèdia (scripts/fetch_town_media.mjs). */
const POBLES_VIQUIPEDIA = [
  ['la-torre-de-les-macanes', 'La Torre de les Maçanes'], ['penaguila', 'Penàguila'], ['benifallim', 'Benifallim'],
  ['sella', 'Sella'], ['orxeta', 'Orxeta'], ['relleu', 'Relleu'], ['alcoleja', 'Alcoleja'], ['xixona', 'Xixona'], ['tibi', 'Tibi']
];

/* Les vinyetes de les apps (ui/plugins), il·lustracions d'IA. */
const VINYETES = [
  ['animalets', 'Vinyeta d’Animalets'], ['bascula', 'Vinyeta de la Bàscula'], ['cervell', 'Vinyeta del Cervell'],
  ['consola', 'Vinyeta de la Consola'], ['disseny', 'Vinyeta de Disseny'], ['fedivers', 'Vinyeta del Fedivers'],
  ['gestoria', 'Vinyeta de la Gestoria'], ['habitatge', 'Vinyeta d’Habitatge'], ['mapa', 'Vinyeta del Mapa'],
  ['rebost', 'Vinyeta del Rebost'], ['rss', 'Vinyeta de Notícies'], ['salut', 'Vinyeta de Salut'],
  ['treball', 'Vinyeta de Treball'], ['vehicle', 'Vinyeta de Vehicles']
];

export const CENS_IMATGES = Object.freeze([
  e('/assets/soc_de_poble_ibanez.png', 'Sóc de Poble a l’estil Ibáñez', 'contingut', 'ia'),

  e('/assets/events/aplec_2023_cartell.jpg', 'Cartell del 2n Aplec pel Territori', 'contingut', 'foto'),
  e('/assets/events/aplec_2023_ponents.png', 'Captura: la targeta de l’Aplec al catàleg', 'contingut', 'sistema'),
  e('/assets/events/aplec_2023_reunio.png', 'Captura: la pàgina de l’Aplec', 'contingut', 'sistema'),
  e('/assets/events/nano_sessio_treball.png', 'Sessió de treball', 'contingut', 'ia'),

  e('/assets/fotos/carla-soriano.png', 'Carla Soriano', 'ia', 'ia'),
  e('/assets/fotos/el-viatjant.png', 'El Viatjant', 'ia', 'ia'),
  e('/assets/fotos/iaia-maria.png', 'IAIA MarIA', 'ia', 'ia'),
  e('/assets/fotos/javi-llinares-perfil-1200px.jpg', 'Javi Llinares', 'persona', 'foto'),
  e('/assets/fotos/sultan.png', 'Sultan', 'ia', 'ia'),

  e('/assets/img/nano_porta_del_mas.png', 'La porta del Mas', 'contingut', 'ia'),
  e('/assets/img/nano_porta_masia_roure_1774195469079.png', 'La porta de la masia del Roure', 'contingut', 'ia'),
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
  e('/assets/nano_cards/lector_rss_nano_card.jpg', 'Lector RSS', 'contingut', 'ia'),
  e('/assets/nano_cards/mercat_nano_card.jpg', 'Mercat', 'contingut', 'ia'),
  e('/assets/nano_cards/metriques_nano_card.jpg', 'Mètriques', 'contingut', 'ia'),
  e('/assets/nano_cards/mur_nano_card.jpg', 'Mur', 'contingut', 'ia'),
  e('/assets/nano_cards/snippet_nano_card.jpg', 'Snippet', 'contingut', 'ia'),
  e('/assets/nano_cards/vehicle_nano_card.jpg', 'Vehicle', 'contingut', 'ia'),

  e('/assets/notes/bloc_notes_vintage.jpg', 'Bloc de notes', 'contingut', 'ia'),

  ...POBLES_VIQUIPEDIA.flatMap(([slug, nom]) => [
    e(`/assets/towns/${slug}/1.jpg`, nom, 'poble', 'foto', slug),
    e(`/assets/towns/${slug}/2.jpg`, `${nom}, segona vista`, 'poble', 'foto', slug)
  ]),

  ...VINYETES.map(([fitxer, titol]) => e(`/assets/ui/plugins/${fitxer}_vinyeta.jpg`, titol, 'contingut', 'ia')),
  e('/assets/ui/plugins/tpv_vinyeta.webp', 'Vinyeta del Bar', 'contingut', 'ia'),

  e('/assets/uploads/ajuntament/la-torre-de-les-macanes/avatar/IMG_20200904_143451.jpg', 'Ajuntament de la Torre de les Maçanes', 'entitat', 'foto', 'la-torre-de-les-macanes'),
  e('/assets/uploads/ajuntament/la-torre-de-les-macanes/post/collita-poma-local.png', 'Collita de poma local', 'entitat', 'ia'),

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
  e('/assets/uploads/brain/caricatura_socdepoble_portada.jpg', 'Caricatura de Sóc de Poble', 'contingut', 'ia'),
  e('/assets/uploads/brain/collita_pomes_valencia_1779774496548.png', 'Collita de pomes', 'contingut', 'ia'),
  e('/assets/uploads/brain/forensic_psychiatry_ai_1775882113147.png', 'Psiquiatria forense i IA', 'contingut', 'ia'),
  e('/assets/uploads/brain/hero_panoramic_landscape_1774710654078.png', 'Paisatge panoràmic', 'contingut', 'ia'),
  e('/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png', 'Vista rural panoràmica', 'contingut', 'ia'),
  e('/assets/uploads/brain/hero_serrella_comic_1774709602282.png', 'La Serrella, en còmic', 'contingut', 'ia'),
  e('/assets/uploads/brain/iaia_maria_avatar.jpg', 'La IAIA MarIA', 'ia', 'ia'),
  e('/assets/uploads/brain/ibanez_design_system_1780246898431.png', 'El sistema de disseny a l’estil Ibáñez', 'contingut', 'ia'),
  e('/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.jpg', 'Pedra Seca a l’estil Ibáñez', 'contingut', 'ia'),
  e('/assets/uploads/brain/llibre_anima_cover_1776032370908.png', 'Portada del llibre de l’ànima', 'contingut', 'ia'),
  e('/assets/uploads/brain/mac_mini_m4_1787721966622.jpg', 'Mac Mini M4', 'contingut', 'foto'),
  e('/assets/uploads/brain/media__1775376768839.jpg', 'Infografia de Sóc de Poble', 'contingut', 'ia'),
  e('/assets/uploads/brain/media__1775516493101.jpg', 'Les IA i el CSS', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano-banana_arxiver_1774284589999.png', 'La Nano Banana arxivera', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_agricola_mas_1773539958988.png', 'El Mas agrícola', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp', 'L’ànima del Mas', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_mel_font_roja_1774216345755.png', 'Mel de la Font Roja', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_mixa_socis_1774215027069.png', 'La Mixa i els socis', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_oli_oliva_1774198089084.png', 'Oli d’oliva', 'contingut', 'ia'),
  e('/assets/uploads/brain/nano_pedra_seca_1777089570387.png', 'Pedra seca', 'contingut', 'ia'),
  e('/assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png', 'Termodinàmica i maquinari d’IA', 'contingut', 'ia'),
  e('/assets/uploads/brain/xat_portada.jpg', 'Portada del Xat', 'contingut', 'ia'),

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

  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/0-container.png', 'Anatomia de Pedra Seca: el contenidor', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/1-header.png', 'Anatomia de Pedra Seca: la capçalera', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png', 'Anatomia de Pedra Seca: la barra lateral', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/3-content.png', 'Anatomia de Pedra Seca: el contingut', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/4-secction-header.png', 'Anatomia de Pedra Seca: la capçalera de secció', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/5-section-media.jpg', 'Anatomia de Pedra Seca: el mitjà', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/6-section-capucha-identidad.png', 'Anatomia de Pedra Seca: la caputxa d’identitat', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/disseny/7-section-title-decoration.png', 'Anatomia de Pedra Seca: la decoració del títol', 'entitat', 'sistema'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-codig-v3.png', 'L’art del codi', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-iaia-v4.png', 'L’art de la IAIA', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-sobirania-v2.png', 'L’art de la sobirania', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-trellat-v3.png', 'L’art del trellat', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/exemple-de-poble-001.png', 'Exemple de poble', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/nano-banana.png', 'La Nano Banana', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/el-projecte/presentacio.jpg', 'Presentació de Sóc de Poble', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/genotip/portada_genotip.png', 'Portada del Genotip', 'entitat', 'ia'),
  e('/assets/uploads/empresa/soc-de-poble/posts/iaies-mundials/portada_iaies.png', 'Les iaies del món', 'entitat', 'ia'),

  e('/assets/uploads/ia/10-joanet-serra-xiquet/avatars/joanet-serra-comic.png', 'Joanet Serra', 'ia', 'ia'),
  e('/assets/uploads/ia/11-tio-colau-viajant/avatars/tio-colau-comic.png', 'Tio Colau', 'ia', 'ia'),
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
  '/assets/ui/plugins/tpv_vinyeta.jpg': 'la mateixa vinyeta en JPEG; el codi només nomena la WebP (registrePlugins.js)',
  '/assets/uploads/avatars/el-viatjant.png': 'còpia de /assets/fotos/el-viatjant.png',
  '/assets/uploads/avatars/iaia_comic_matriarch.png': 'còpia de /assets/fotos/iaia-maria.png',
  '/assets/uploads/avatars/javi-llinares-foto_perfil-01.jpg': 'còpia de /assets/fotos/javi-llinares-perfil-1200px.jpg',
  '/assets/uploads/avatars/nano_sessio_treball.png': 'còpia de /assets/events/nano_sessio_treball.png',
  '/assets/uploads/avatars/avatar_samir_comic.png': 'còpia de /assets/uploads/brain/hero_serrella_comic_1774709602282.png',
  ...Object.fromEntries(COPIES_DELS_AVATARS.map((nom) => [`/assets/uploads/gent/avatars/${nom}`, 'còpia de l’avatar de /assets/uploads/avatars/'])),
  ...Object.fromEntries(COPIES_IA.map(([calaix, nom]) => [`/assets/uploads/ia/${calaix}/avatars/${nom}`, 'còpia de l’avatar de /assets/uploads/avatars/'])),
  '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg': 'còpia de /assets/fotos/javi-llinares-perfil-1200px.jpg',
  '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.jpg': 'la mateixa foto de perfil a més resolució',
  '/assets/uploads/brain/avatar_ratoli_comic_1778960942888.png': 'còpia de /assets/uploads/avatars/avatar-ratoli-comic.png',
  '/assets/uploads/brain/cuc-de-pi-poster.png': 'còpia de /assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png',
  '/assets/uploads/brain/nano_astronauta_esmorzar_1773441997380.png': 'còpia de /assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png',
  '/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png': 'còpia de /assets/nano_cards/mercat_nano_card.jpg',
  '/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png': 'la mateixa il·lustració en PNG; es queda el JPEG',
  '/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg': 'logotip',
  '/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-q.png': 'logotip',
  '/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r-trans.png': 'logotip',
  '/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r.png': 'logotip',
  '/assets/uploads/empresa/soc-de-poble/posts/el-projecte/antigravity-badge.png': 'insígnia d’una eina (logotip)'
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
