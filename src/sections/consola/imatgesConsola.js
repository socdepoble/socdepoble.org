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
 *  · requeriments, balanc, certificacio i comunicacio · govern_<id>_nano_card:
 *    les quatre portades del Govern del Mestre (ordre del Mestre del
 *    30-10-2026, B1), dibuixades per a eixes quatre pàgines. Fort.
 */
const VINYETES = '/assets/ui/plugins';
const NANO_CARDS = '/assets/nano_cards';
const il = (imatge, imatgeAlt) => Object.freeze({ imatge, imatgeAlt });

export const IMATGES_CONSOLA = Object.freeze({
  /* Ordres del Mestre del 30-10-2026 (Gauntlet, cicle 2) · La vinyeta de la
     Consola i la del Cervell són ara les il·lustracions noves de 1024×1024 al
     mateix camí: el seu alt és el de PAGE_COPY (consola i cervell), que les
     descriu sense interpretar-les. */
  index: il(`${VINYETES}/consola_vinyeta.jpg`,
    'Il·lustració de còmic d’estil Bruguera amb traç de plumilla: en un pati de pedra ple de ferralla, la IAIA MarIA, amb mocador groc, ulleres fosques de soldador i un somriure tranquil, damunt d’una tarima de ferro, gira els comandaments del «FUM-O-MÀTIC», una màquina torta de canonades i manòmetres que diuen «HUMOR», «VI», «FUM» i «TEMPS», amb palanques «CALORET», «PAELLA» i «REBUIG»; un gat s’amaga entre els engranatges, un apanyador amb gorra, faixa roja i el mateix somriure tranquil porta una clau anglesa gegant, i un gos amb un os a la boca està al costat d’un microxip; bafarades «XOFF!», «BROOOM!» i «FIUM!», fum negre, una estufa de llenya, gallines i un pardal'),
  pols: il(`${NANO_CARDS}/metriques_nano_card.jpg`,
    'Dos llauradors es rasquen el cap davant d’un taulell de fusta ple de rellotges i manòmetres, enmig dels tarongers'),
  explorador: il(`${VINYETES}/cervell_vinyeta.jpg`,
    'Il·lustració de còmic d’estil Bruguera: en una plaça de poble amb cases blanques i parades de mercat, un cervell mecànic gegant amb dos ulls grossos, un somriure de dents, engranatges, bombetes, un manòmetre i un ventilador s’alça damunt d’unes erugues i d’una plataforma de fusta amb escala, envoltat de veïns sorpresos que es rasquen el cap, l’assenyalen o alcen el braç, una cabra i una gallina'),
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
    'Un metge pren la tensió a un iaio assegut en una cadira de bova, al carrer, entre gats i gossos'),
  /* Ordre del Mestre del 30-10-2026 (B1, «Portades il·lustrades de Govern del
     Mestre») · Les quatre targetes del Govern (SeccioGovern, GovernConsola.jsx)
     porten la seua il·lustració, en l'ordre d'IDS_GOVERN (governConsola.js):
     quatre originals de 1024×1024 copiats a nano_cards (JPEG q85 i la bessona
     .webp, com les vinyetes de la Consola). Cap altra pantalla no les pinta: el
     text alternatiu és nou, escrit davant de cada imatge, i descriu el dibuix
     sense interpretar-lo. */
  requeriments: il(`${NANO_CARDS}/govern_requeriments_nano_card.jpg`,
    'Il·lustració de còmic: en un carrer empedrat, davant d’una paret de pedra amb una enfiladissa de flors roses, un tauler de fusta amb tres finestres porta un full ple de marques verdes de verificació, un robot de llanda amb una bombeta al cap i una clau anglesa entre engranatges, i rotllos de paper apilats; un home amb gorra, camisa blanca i faixa roja el mira amb una lupa al costat d’una iaia amb ulleres redones, mocador groc de pics i davantal blanc, i davall del tauler un gat ataronjat dorm en una cistella plena de rotllos amb segells verds, al costat de dues cistelles buides'),
  balanc: il(`${NANO_CARDS}/govern_balanc_nano_card.jpg`,
    'Il·lustració de còmic: en un magatzem de pedra amb bigues de fusta penja una balança de dos plats amb l’agulla al mig; al plat de l’esquerra, una cistella de vímet amb rotllos de paper i un full amb una llista de caselles, i al de la dreta, tomaques roges, engranatges, claus angleses i un xip; entre els dos plats, un home amb gorra, un llapis a l’orella, camisa blanca i faixa roja i una iaia amb ulleres redones, mocador groc de pics i davantal blanc es miren, i als seus peus hi ha un gos de pèl llarg i una gallina'),
  certificacio: il(`${NANO_CARDS}/govern_certificacio_nano_card.jpg`,
    'Il·lustració de còmic: en una placeta empedrada amb un carrer d’escales al fons, un home amb gorra, camisa blanca i faixa roja posa un segell de fusta damunt d’un pergamí amb una marca verda de verificació, en una taula amb llibres; dos robots de llanda amb una bombeta encesa al cap, un amb una marca verda al pit i l’altre, amb un engranatge, que sosté un full, una dona amb mocador taronja i vestit de flors alça el polze, un gat ataronjat dorm damunt d’uns llibres, un gos corre, pel carrer volen fulls amb marques verdes i al fons una parella seu a una tauleta de terrassa'),
  comunicacio: il(`${NANO_CARDS}/govern_comunicacio_nano_card.jpg`,
    'Il·lustració de còmic: en un pati de cases blanques amb testos de geranis, una iaia amb ulleres redones fosques, mocador groc de pics i davantal blanc i un home amb gorra, camisa blanca i faixa roja seuen en cadires de bova davant de dos robots de llanda asseguts en caixes de fusta; entre ells, una trompeta dreta i un telèfon de pots de llanda amb el fil per terra, i damunt de tots, una bafarada amb una marca verda de verificació, una tomaca, un sol amb cara i un engranatge')
});

const SENSE_IMATGE = Object.freeze({ imatge: null, imatgeAlt: '' });

/**
 * La il·lustració de la targeta d'una pàgina del tauler ({ imatge, imatgeAlt }),
 * per a passar-la tal qual a TargetaConsola. L'H2 de l'Índex (`index`) no és
 * cap pàgina, i un id desconegut no en porta: null i ''.
 */
export const imatgeDePagina = (id) => (id !== 'index' && Object.hasOwn(IMATGES_CONSOLA, id) ? IMATGES_CONSOLA[id] : SENSE_IMATGE);

/* Gauntlet 261030 (cicle 2, vinyetes-1024-jpg-a-miniatures; Fase 3, P1Y) ·
   Les vinyetes de la Consola i del Cervell són ara de 1024×1024 (~400 KB en
   .jpg) i el tauler de /consola les pinta a 128 i a 458 px. La taula
   continua nomenant l'original (.jpg): és la imatge del SEO de la pàgina
   (ConsolaSection, metadades) i la de PAGE_COPY. Només el que es PINTA al
   tauler (l'H2 de l'Índex i les targetes) va per la bessona .webp del mateix
   camí, que ja és al disc (318 i 336 KB, les mateixes mides): la miniatura és
   la mateixa il·lustració, a la mateixa mida i al mateix lloc. Una ruta sense
   bessona declarada ací passa tal qual.
   Ordre del Mestre del 30-10-2026 (B1) · Les quatre portades del Govern del
   Mestre també: la taula i el SEO nomenen el .jpg, i el tauler pinta la .webp. */
const BESSONES_WEBP = Object.freeze([
  `${VINYETES}/consola_vinyeta.jpg`, `${VINYETES}/cervell_vinyeta.jpg`,
  `${NANO_CARDS}/govern_requeriments_nano_card.jpg`, `${NANO_CARDS}/govern_balanc_nano_card.jpg`,
  `${NANO_CARDS}/govern_certificacio_nano_card.jpg`, `${NANO_CARDS}/govern_comunicacio_nano_card.jpg`
]);

/** La ruta que es pinta al tauler: la bessona .webp si n'hi ha, o la mateixa. */
export const miniaturaDe = (ruta) => (BESSONES_WEBP.includes(ruta) ? ruta.replace(/\.jpg$/, '.webp') : ruta);

/** imatgeDePagina amb la ruta de la miniatura (miniaturaDe): la del tauler. */
export function miniaturaDePagina(id) {
  const il = imatgeDePagina(id);
  return il.imatge ? { imatge: miniaturaDe(il.imatge), imatgeAlt: il.imatgeAlt } : il;
}
