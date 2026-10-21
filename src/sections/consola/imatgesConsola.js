/**
 * imatgesConsola.js — LA TAULA ÚNICA de les il·lustracions de la Consola
 * Termodinàmica, sense React ni imports: id → { imatge, imatgeAlt }.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · «Col·locar a les
 * capçaleres de les targetes de la Consola Termodinàmica les il·lustracions
 * artístiques de Pedra Seca existents.» Cada una de les nou targetes del
 * tauler de /consola porta la seua il·lustració al mitjà de la targeta
 * (TargetaConsola, peces.jsx: amb imatge, la insígnia lateral de la icona ja
 * no es pinta), quadrada, retallada i centrada per la Llei Visual del quadrat
 * (modules.css § CONSOLA, src/css/imatgesASang.capes.test.js). L'H2 de
 * l'Índex de la Consola conserva la seua (`index`).
 * Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla 261013_1405,
 * front F): l'Onada 12 (261011; ordres 261011_0130, punt 2), que posava les
 * il·lustracions només a l'Índex («La resta de pàgines no tenen cap
 * il·lustració pròpia entre les 18: es queden sense, i no se'n força cap»).
 * Les miniatures d'explorador i salut de l'Índex passen a les seues targetes:
 * una imatge no es pinta dues vegades dins de la mateixa pàgina (lliçó
 * 261010 de sdp-universal-page), i indexConsola.js ja només en guarda la de
 * l'H2.
 *
 * Les rutes són fitxers que ja se servixen des de public/ (cap ruta
 * inventada; imatgesConsola.test.js llig el disc). Els originals de
 * 01_produccio són zona humana i no s'importen. El text alternatiu és el de
 * la font que ja pinta eixa imatge (PAGE_COPY o registrePlugins.js); les tres
 * nano cards i la vinyeta de la Bàscula que cap altra pantalla no pinta porten
 * un text nou, escrit davant de la imatge.
 * Criteri (el de l'Onada 12): una imatge només on el seu significat casa amb
 * la pàgina. Les que fan de metàfora d'una altra pàgina del poble van
 * marcades ESBORRANY per al Mestre: canviar-ne una és una línia d'esta taula.
 *  · index · consola_vinyeta: la imatge de la Consola (PAGE_COPY.consola).
 *  · pols · metriques_nano_card: el taulell de rellotges i manòmetres; el
 *    pols és el que gasta i llig l'eixam. Fort; cap altra pantalla la pinta.
 *  · explorador · cervell_vinyeta: «El Cervell» viu a l'Explorador
 *    (PAGE_COPY.cervell). Fort; abans era la miniatura del seu H3 a l'Índex.
 *  · fluxos · treball_vinyeta: la imatge de Treball. ESBORRANY: la cadena de
 *    faena com a metàfora de les cadenes declarades.
 *  · calendari · calendari_nano_card: la imatge del Calendari del poble.
 *    ESBORRANY: el calendari agrícola com a metàfora del que corre sol.
 *  · inventari · lector_rss_nano_card: el iaio que llig un rotllo
 *    llarguíssim; l'inventari de procediments. Fort; cap altra pantalla la pinta.
 *  · entrades · bascula_vinyeta: la pesada d'entrada de la cooperativa,
 *    apuntada a la llibreta. Mitjà: la Bàscula es va descartar com a eina el
 *    261007 i la il·lustració es conservava al disc sense ús.
 *  · agents · cervell_nano_card: el cap mecànic sobre erugues; l'agent que
 *    treballa sol. Fort; cap altra pantalla la pinta.
 *  · actors · mapa_vinyeta: la imatge de Publicar al Mapa («sobre quin sòl
 *    treballen»). ESBORRANY; l'alternativa és mur_nano_card.
 *  · salut · salut_vinyeta: la il·lustració del plugin Salut (el quadern de
 *    cures), com a metàfora de la salut del Mas. ESBORRANY ja des del 261011.
 */
const VINYETES = '/assets/ui/plugins';
const NANO_CARDS = '/assets/nano_cards';
const il = (imatge, imatgeAlt) => Object.freeze({ imatge, imatgeAlt });

export const IMATGES_CONSOLA = Object.freeze({
  index: il(`${VINYETES}/consola_vinyeta.jpg`,
    'Una iaia amb ulleres de soldar maneja una màquina de vapor plena de rellotges, i un veí l’apreta amb una clau'),
  pols: il(`${NANO_CARDS}/metriques_nano_card.jpg`,
    'Dos llauradors es rasquen el cap davant d’un taulell de fusta ple de rellotges i manòmetres, enmig dels tarongers'),
  explorador: il(`${VINYETES}/cervell_vinyeta.jpg`,
    'Un cervell ple d’engranatges i bombetes dins d’una bóta, connectat a una màquina d’escriure, davant de veïns bocabadats'),
  fluxos: il(`${VINYETES}/treball_vinyeta.webp`,
    'Llauradors i professionals treballant i construint junts'),
  calendari: il(`${NANO_CARDS}/calendari_nano_card.jpg`,
    'Un llaurador es posa les mans al cap davant d\'un calendari agrícola gegant clavat a la paret'),
  inventari: il(`${NANO_CARDS}/lector_rss_nano_card.jpg`,
    'Un iaio amb ulleres llig un rotllo de paper llarguíssim que s’escampa per la plaça, entre gats'),
  entrades: il(`${VINYETES}/bascula_vinyeta.jpg`,
    'Un llaurador assenyala la bàscula gegant de la cooperativa mentre una iaia apunta la pesada a la llibreta'),
  agents: il(`${NANO_CARDS}/cervell_nano_card.jpg`,
    'Un cap mecànic d’engranatges i bombetes, damunt d’unes erugues, enmig de la plaça i dels veïns bocabadats'),
  actors: il(`${VINYETES}/mapa_vinyeta.webp`,
    'Llauradors en un bancal intentant clavar la punxa del mapa de geolocalització'),
  salut: il(`${VINYETES}/salut_vinyeta.webp`,
    'Un metge pren la tensió a un iaio assegut en una cadira de bova, al carrer, entre gats i gossos')
});

const SENSE_IMATGE = Object.freeze({ imatge: null, imatgeAlt: '' });

/**
 * La il·lustració de la targeta d'una pàgina del tauler ({ imatge, imatgeAlt }),
 * per a passar-la tal qual a TargetaConsola. L'H2 de l'Índex (`index`) no és
 * cap pàgina, i un id desconegut no en porta: null i ''.
 */
export const imatgeDePagina = (id) => (id !== 'index' && Object.hasOwn(IMATGES_CONSOLA, id) ? IMATGES_CONSOLA[id] : SENSE_IMATGE);
