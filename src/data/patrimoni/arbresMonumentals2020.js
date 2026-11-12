/**
 * P0-86 (Onada R17 · Carril 3) · Catàleg d'Arbres Emblemàtics i Monumentals
 * de La Torre de les Maçanes (2007–2020) i Ordenança Municipal de Protecció.
 *
 * Fonts primàries declarades pel kit R17.3:
 *  1. Associació El Rentonar & Pedro Ferrer Rodriguez (Enginyer Tècnic Forestal
 *     i Biòleg), «Catàleg d'Arbres Emblemàtics i Monumentals de La Torre de les
 *     Maçanes», inspecció de camp 19/05/2007 (84 pàg.).
 *  2. Associació El Rentonar, «Arbres Emblemàtics i Monumentals · La Torre de
 *     les Maçanes», edició revisada i maquetada 2020 (144 pàg.) + campanya
 *     fotogràfica de seguiment febrer–maig 2020.
 *  3. Acord Plenari unànime de l'Ajuntament de La Torre de les Maçanes de
 *     07/09/2007 (Registre d'Eixida d'Alcaldia núm. 494 · 13/09/2007) que aprova
 *     la inclusió dels 19 conjunts i exemplars en el Catàleg Municipal sota
 *     l'Ordenança sobre Arbres Monumentals i d'Interés Local (vigent des del
 *     01/01/2005) i la Llei 4/2006, de 19 de maig, de Patrimoni Arbori
 *     Monumental de la Comunitat Valenciana.
 *  4. Associació El Rentonar, crònica «La Xilella arriba al Cipreret»
 *     (22/09/2024, fotografies del 12/09/2024) sobre l'Alborç del Xipreret:
 *     https://rentonar.blogspot.com/2024/09/la-xilella-arriba-al-cipreret.html
 *
 * Rigor documental (Zero Invenció i Zero PII):
 *  - Al camp «DIÀMETRE DE TRONC (DBH)» de les fitxes 2007/2020 es consigna en
 *    realitat el perímetre normal de tronc a 1,30 m d'alçària en cm (demostrat
 *    pel text mateix de les fitxes #12 «5 m de perímetre de soca» = 498 cm i
 *    #18 «108 cm de perímetre de tronc a l'altura normal» = 108 cm). Ací es
 *    declara amb exactitud com `perimetreNormalCm` i es calcula `diametreEquivalentCm`
 *    (P / π, arrodonit a 1 decimal) sense inventar cap mesura.
 *  - Els camps marcats amb «?» als catàlegs 2007 i 2020 (#19 Xiprers del
 *    Cementeri: alçària, diàmetre de capçada, perímetre i altitud) es desen com
 *    a `null` amb nota explícita de mesura instrumental pendent.
 *  - Es corregeix i es documenta l'errata de maquetació de l'edició 2020 a les
 *    pàg. 104 (#15 Pi dels Arrendaors) i 112 (#16 Roures de Nofre), que repetien
 *    per arrossegament la caixa UTM del #14 Pi del Pla Verd (725272 / 4277313),
 *    restituint les coordenades reals del catàleg original 2007.
 *  - Cap DNI/NIF ni domicili particular dels signants o propietaris privats.
 *
 * Arbitratge R17.3 (P1) · El PDF de 2020 no és al repositori ni el CAS en porta
 * l'empremta: cap cota ni cap camp descriptiu es pot verificar encara.
 *  - `documentFont` i `llicenciaAcreditadaPer` queden a null fins que el Mestre
 *    adjunte el PDF a 01_produccio amb el seu SHA-256 i acredite la llicència.
 *  - `paginesFont` registra la pàgina de cada fitxa quan la font la cita; la
 *    resta queda a null.
 *  - Sense cita de pàgina, els camps descriptius `sol`, `comunitatVegetal`,
 *    `conservacio2007.amenaces` i `conservacio2007.mesuresPropostes` queden a
 *    null. El text que en proposava el kit es conserva al seu payload per a
 *    contrastar-lo amb el PDF.
 *  - `anyNaixencaAprox` és null als 19 arbres: no és cap mesura (`edatEstimada`
 *    conserva la frase de la font).
 *  - Els conjunts arboris compten exemplars a `exemplarsDelConjunt`; el camp CIEF
 *    `peusMenys130m` (peus o braços d'un mateix arbre per sota d'1,30 m) queda a
 *    null on la font no el dona.
 *  - Els mapes aeris (`*-mapa.webp` i el mapa general) poden ser cartografia de
 *    tercers: no es publiquen fins que el Mestre en confirme la base
 *    cartogràfica (MAPES_ARBRES_2020_ACREDITATS).
 */
import { ATRIBUCIO_RENTONAR } from './actaRentonar.js';

const congela = (valor) => {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
};

const diametreDesDePerimetre = (perimetreCm) => (
  typeof perimetreCm === 'number' && Number.isFinite(perimetreCm)
    ? Math.round((perimetreCm / Math.PI) * 10) / 10
    : null
);

export const VERSIO_ARBRES_MONUMENTALS_2020 = '2.0.1';

/* La mateixa grafia que ATRIBUCIO_RENTONAR (actaRentonar.js) i que la pàgina 619 de WordPress («Pedro Ferrer Rodriguez»). */
export const LLICENCIA_CATALEG_ARBRES = ATRIBUCIO_RENTONAR;

export const FONT_XYLELLA_CIPRERET_2024 = 'https://rentonar.blogspot.com/2024/09/la-xilella-arriba-al-cipreret.html';

/** Base cartogràfica dels mapes del PDF 2020 sense confirmar: fins que el Mestre la confirme, cap mapa es publica. */
export const MAPES_ARBRES_2020_ACREDITATS = false;
const mapaSiAcreditat = (cami) => (MAPES_ARBRES_2020_ACREDITATS ? cami : null);

const SENSE_PAGINES = { cataleg2007: null, edicio2020: null };

export const MAPA_GENERAL_ARBRES_2020 = congela({
  url: mapaSiAcreditat('/assets/uploads/patrimoni/arbres-2020/mapa-general-arbres-la-torre-2020.webp'),
  width: 1038,
  height: 942,
  titol: 'Mapa aeri general dels 19 arbres i conjunts arboris singulars de La Torre de les Maçanes',
  atribucio: LLICENCIA_CATALEG_ARBRES
});

export const FONT_CATALEG_ARBRES_2020 = congela({
  titol: 'Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes (2007–2020)',
  municipi: 'La Torre de les Maçanes (l’Alacantí / les Muntanyes d’Alacant)',
  dataInspeccioBase: '2007-05-19',
  dataAcordPlenari: '2007-09-07',
  registreEixidaAlcaldia: 'Registre d’Eixida núm. 494 · 13/09/2007',
  anyEdicioRevisada: 2020,
  autoriaTecnica: 'Pedro Ferrer Rodriguez (Enginyer Tècnic Forestal i Biòleg)',
  entitatPromotora: 'Associació Cultural i Mediambiental El Rentonar (GVA núm. 4444 · Secció Primera)',
  marcNormatiu: [
    'Ordenança Municipal sobre Arbres Monumentals i d’Interés Local (vigent des del 01/01/2005)',
    'Llei 4/2006, de 19 de maig, de Patrimoni Arbori Monumental de la Comunitat Valenciana'
  ],
  documentFont: {
    cami: null,
    sha256: null,
    estat: 'Pendent que el Mestre adjunte el PDF de l’edició 2020 a 04_escriptori/01_produccio amb el seu SHA-256'
  },
  llicenciaAcreditadaPer: null,
  llicencia: LLICENCIA_CATALEG_ARBRES
});

export const ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE = congela({
  titol: 'Ordenança Municipal sobre Arbres Monumentals i d’Interés Local',
  ajuntament: 'Ajuntament de La Torre de les Maçanes',
  entradaEnVigor: '2005-01-01',
  acordPlenariInclusio: {
    dataPle: '2007-09-07',
    dataComunicacio: '2007-09-13',
    registreEixida: '494',
    votacio: 'Unanimitat de tots els regidors assistents al Ple',
    resumAcord: 'Inclusió dels 19 arbres i conjunts arboris proposats per l’Associació Cultural i Mediambiental El Rentonar en el Catàleg Municipal d’Arbres Monumentals i d’Interés Local, donant trasllat a l’equip redactor del Pla General d’Ordenació Urbana per a garantir la màxima protecció jurídica i urbanística.'
  },
  /* Arbitratge R17.3 (P1) · El repositori no té el text de l'Ordenança: cap capítol ni article fins que hi haja el
     document municipal (o el BOP) citat. */
  capitols: [],
  notaFont: 'Text íntegre pendent d’incorporar des del document municipal'
});

const RUTA_ARBRES = '/assets/uploads/patrimoni/arbres-2020';

const LLISTA_CRUA = [
  {
    ordre: 1,
    id: 'arbre-01-albers-blancs-del-pont',
    nom: 'Àlbers blancs del Pont',
    especieCientifica: 'Populus alba',
    nomComu: 'Àlber blanc',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Entrada del poble · Pont sobre el Riu de La Torre',
    propietari: 'Ajuntament de La Torre de les Maçanes',
    titularitatCief: 'Pública municipal',
    accesLliure: true,
    orientacio: 'Sud-est',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Àlbers blancs de gran altura que presenten un tronc gros amb diverses branques que s’obrin formant un cóp ample i dens.',
    acces: 'Es veuen a l’entrada del poble de La Torre de les Maçanes, just abans de creuar el pont sobre el Riu de La Torre. Sense problemes d’accés.',
    valorCulturalHistoric: 'Situats des de fa dècades a l’entrada del poble, constitueixen un senyal d’identitat per al veïnat amb alt valor paisatgístic, recreatiu i ornamental.',
    observacions: 'Encara que no arriben a les dimensions de protecció genèrica de la Llei 4/2006, integren el patrimoni arbori identitari de l’entrada de La Torre.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 724718, y: 4276790, altitudM: 780, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: null, parcella: null, ambit: 'Sòl urbà municipal' },
    dimensions2007: {
      alcadaM: 22,
      diametreCapcadaM: 23,
      perimetreNormalCm: 295,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(295),
      exemplarsDelConjunt: 2,
      peusMenys130m: null,
      edatEstimada: '90 anys (2007)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Conjunt de 2 exemplars germans; cotes preses sobre l’exemplar principal.'
    },
    conservacio2007: {
      estatSalut: 'Presenta un bon estat de salut.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-01-albers-blancs-del-pont-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-01-albers-blancs-del-pont-detall-2007.webp`,
      foto2020: `${RUTA_ARBRES}/arbre-01-albers-blancs-del-pont-2020.webp`,
      dataFoto2020: '2020-05-08',
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-01-albers-blancs-del-pont-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/albers-blancs-del-pont-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 2,
    id: 'arbre-02-alborc-del-xipreret',
    nom: 'Alborç o Madronyer del Xipreret',
    especieCientifica: 'Arbutus unedo',
    nomComu: 'Alborç, madronyer',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Mas del Cipreret (carretera cap a Alacant, km 1)',
    propietari: 'Privat',
    titularitatCief: 'Privada (vora de carretera pública)',
    accesLliure: true,
    orientacio: 'A tots els vents',
    pendent: '10%',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Exemplar envellit d’alborç amb tronc retorçut i buit al centre. Presenta branques seques al cóp i rebrots d’emergència en la base del tronc.',
    acces: 'Eixint de La Torre cap a Alacant, a 1 km del poble, just a la vora de la carretera davant l’antic Mas del Cipreret.',
    valorCulturalHistoric: 'El Cipreret és un mas antic de La Torre de les Maçanes; l’exemplar formava part de la seua jardineria històrica.',
    observacions: 'El 22/09/2024 El Rentonar va comunicar que l’exemplar s’ha contagiat de Xylella fastidiosa, igual que diversos arbres del voltant, que s’estan eliminant, cosa que posa en perill la seua supervivència. En la data de la crònica estava en tractament amb productes fitosanitaris (crònica «La Xilella arriba al Cipreret»).',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 724237, y: 4275752, altitudM: 740, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '6', parcella: '9018', ambit: 'Rústic / domini viari annex' },
    dimensions2007: {
      alcadaM: 7,
      diametreCapcadaM: 7,
      perimetreNormalCm: 198,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(198),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: '90 anys (2007)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Tronc principal buit al centre amb rebrots basals.'
    },
    conservacio2007: {
      estatSalut: 'Exemplar senescent amb branques seques al cóp i rebrots d’emergència a la base de la soca.',
      amenaces: null,
      /* Arbitratge R17.3 (P1) · Contra la Xylella no hi ha cura: cap poda ni consell fitosanitari propi. */
      mesuresPropostes: 'Seguiment segons les instruccions oficials de Sanitat Vegetal.'
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-02-alborc-del-xipreret-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-02-alborc-del-xipreret-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-02-alborc-del-xipreret-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/alborc-del-xipreret-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 3,
    id: 'arbre-03-carrasca-de-la-foia-blanca',
    nom: 'Carrasca de La Foia Blanca',
    especieCientifica: 'Quercus rotundifolia',
    nomComu: 'Carrasca, alzina',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Mas de La Foia Blanca',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'A tots els vents',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Carrasca de soca recta i grossa que es ramifica a 2 m d’altura en 4 branques principals. Presenta un cóp ample, però no molt dens.',
    acces: 'Situada enfront del mas de La Foia Blanca; des de la carretera cap a Relleu ix un camí a mà esquerra a 1 km del poble. Finques tancades sense accés públic.',
    valorCulturalHistoric: 'Arbre d’ombra tradicional dels masos de muntanya, part integrant del paisatge cultural de La Torre.',
    observacions: 'Dimensions excepcionals per a l’espècie dins l’àmbit de la província d’Alacant.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 725181, y: 4275887, altitudM: 770, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '5', parcella: '10', ambit: 'Rústic' },
    dimensions2007: {
      alcadaM: 10,
      diametreCapcadaM: 17,
      perimetreNormalCm: 243,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(243),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenària',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Ramificació en creu a 2 m d’alçària en 4 braços mestres.'
    },
    conservacio2007: {
      estatSalut: 'Cóp poc dens atribuïble a sequeres acumulades i compactació del sòl davant el mas.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-03-carrasca-de-la-foia-blanca-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-03-carrasca-de-la-foia-blanca-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-03-carrasca-de-la-foia-blanca-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/carrasca-de-la-foia-blanca-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 4,
    id: 'arbre-04-carrasca-de-la-zurca',
    nom: 'Carrasca de La Zurca',
    especieCientifica: 'Quercus rotundifolia',
    nomComu: 'Carrasca, alzina',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Mas de La Zurca',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'Sud-sud-est',
    pendent: '5%',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Carrasca de soca grossa i lleugerament inclinada ramificada en diverses branques principals. El 2007 presentava quasi tot el cóp sec, conservant fulles verdes només en un sector reduït.',
    acces: 'Junt al Mas de la Zurca: carretera de La Torre a Relleu fins al km 4 (tossal) i camí de terra a mà dreta d’1,6 km. Propietat privada.',
    valorCulturalHistoric: 'Arbre d’era i d’ombra vinculat a l’arquitectura tradicional dels masos del terme.',
    observacions: 'Junt a l’alzina es documenten dos peus d’alborcer de notables dimensions.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 728268, y: 4275764, altitudM: 885, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '4', parcella: '120', ambit: 'Rústic' },
    dimensions2007: {
      alcadaM: 11,
      diametreCapcadaM: 15,
      perimetreNormalCm: 296,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(296),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenària',
      anyNaixencaAprox: null,
      notaDendrometrica: null
    },
    conservacio2007: {
      estatSalut: 'Estat crític de senescència el 2007: la quasi totalitat de les branques de la capçada estaven seques excepte un sector reduït.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-04-carrasca-de-la-zurca-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-04-carrasca-de-la-zurca-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-04-carrasca-de-la-zurca-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/carrasca-de-la-zurca-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 5,
    id: 'arbre-05-carrasca-de-nofre',
    nom: 'Carrasca de Nofre',
    especieCientifica: 'Quercus rotundifolia',
    nomComu: 'Carrasca, alzina',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Fons del Barranc de la Zurca · Paratge de Nofre',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'Fons de barranc de direcció Est',
    pendent: '45% a peu de talús',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Carrasca de cóp ample, més o menys dens, i soca lleugerament inclinada arrelada al peu del talús del barranc.',
    acces: 'Junt a un camí que baixa a una antiga bassa de reg al fons del Barranc de la Zurca (carretera a Relleu km 4, desviament pel Mas de la Zurca).',
    valorCulturalHistoric: 'Fita arbòria associada als sistemes hidràulics tradicionals (bassa de reg) del barranc.',
    observacions: 'El barranc hostatja una flora d’ombria de gran importància ecològica.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 728507, y: 4275541, altitudM: 825, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '1', parcella: '47', ambit: 'Rústic forestal' },
    dimensions2007: {
      alcadaM: 13,
      diametreCapcadaM: 18,
      perimetreNormalCm: 288,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(288),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenària',
      anyNaixencaAprox: null,
      notaDendrometrica: null
    },
    conservacio2007: {
      estatSalut: 'Presenta un bon estat de salut.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-05-carrasca-de-nofre-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-05-carrasca-de-nofre-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-05-carrasca-de-nofre-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/carrasca-de-nofre-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 6,
    id: 'arbre-06-carrasca-del-buitre',
    nom: 'Carrasca del Buitre',
    especieCientifica: 'Quercus rotundifolia',
    nomComu: 'Carrasca, alzina',
    categoria: 'Monumental',
    monumental: true,
    paratge: 'Mas del Buitre',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'A tots els vents',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Carrasca monumental de soca molt grossa (478 cm de perímetre) ramificada en grans branques mestres, amb un diàmetre de capçada de 25 m.',
    acces: 'Junt al Mas del Buitre: carretera de La Torre a Relleu km 1,3 i camí de terra a mà dreta de 500 m. Propietat privada.',
    valorCulturalHistoric: 'Arbre monumental de mas amb fins a ~300 anys estimats d’edat, protegit genèricament per la Llei 4/2006 pel seu diàmetre de capçada de 25 m.',
    observacions: 'Protecció genèrica Llei 4/2006 (Art. 4 · diàmetre de capçada >= 25 m). La propietat hi va restaurar el mur de maçoneria, delimitar l’escocell amb bol·lards i instal·lar reg per degoteig.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 725824, y: 4275604, altitudM: 810, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '5', parcella: '18', ambit: 'Rústic' },
    dimensions2007: {
      alcadaM: 14,
      diametreCapcadaM: 25,
      perimetreNormalCm: 478,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(478),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenària (~300 anys estimats a observacions)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Aconsegueix la protecció genèrica autonòmica (capçada de 25 m).'
    },
    conservacio2007: {
      estatSalut: 'Bon aspecte fitosanitari general; capçada moderadament oberta per l’edat i antigues podes de branques caigudes pel vent.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-06-carrasca-del-buitre-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-06-carrasca-del-buitre-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-06-carrasca-del-buitre-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/carrasca-del-buitre-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 7,
    id: 'arbre-07-carrasca-del-moral',
    nom: 'Carrasca del Moral',
    especieCientifica: 'Quercus rotundifolia',
    nomComu: 'Carrasca, alzina',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Cases del Moral · Camí Volaor-Parades-Canaleta',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'A tots els vents',
    pendent: '5%',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Carrasca de tronc gros i port rabassut que es ramifica en diverses branques principals, amb cóp ample i producció activa d’aglà.',
    acces: 'Vora el conjunt de cases d’El Moral: carretera a Relleu (< 1 km), desviació a l’esquerra pel camí rural Volaor-Parades-Canaleta i 400 m fins a les cases.',
    valorCulturalHistoric: 'Arbre d’era tradicional plantat o respectat a la vora de l’era de batre per fer ombra durant les feines estivals del gra.',
    observacions: 'Prop d’aquesta carrasca creixen dos exemplars més joves productors de bellota.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 725532, y: 4276221, altitudM: 782, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '2', parcella: '183', ambit: 'Rústic' },
    dimensions2007: {
      alcadaM: 11,
      diametreCapcadaM: 16,
      perimetreNormalCm: 282,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(282),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenària',
      anyNaixencaAprox: null,
      notaDendrometrica: null
    },
    conservacio2007: {
      estatSalut: 'Bon estat general i fructificació activa d’aglà, amb densitat foliar moderada.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-07-carrasca-del-moral-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-07-carrasca-del-moral-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-07-carrasca-del-moral-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/carrasca-del-moral-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 8,
    id: 'arbre-08-fleixos-del-barranc-d-horta',
    nom: 'Fleixos del Barranc d’Horta',
    especieCientifica: 'Fraxinus ornus',
    nomComu: 'Freixe de flor, fleix',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Confluència del Barranc d’Horta (sector Les Parades)',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'Nord',
    pendent: 'Peu de talús 100%',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Arbreda de 7 exemplars de freixe de flor al peu d’un talús estabilitzat antigament amb mur de pedra. La soca de l’exemplar major es dividix a 1 m en dues branques principals.',
    acces: 'Confluència del Barranc d’Horta amb un barranc tributari del sud, accedint per la carretera dels Castellans i el Mas de Les Parades, i baixant a peu fins al llit.',
    valorCulturalHistoric: 'Raresa biogeogràfica d’alt valor botànic dins el clima mediterrani semiàrid d’Alacant.',
    observacions: 'Conjunt arbori de 7 exemplars; cotes preses sobre el peu de major desenvolupament.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 727305, y: 4277532, altitudM: 780, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '3', parcella: '50', ambit: 'Rústic forestal' },
    dimensions2007: {
      alcadaM: 11,
      diametreCapcadaM: 8,
      perimetreNormalCm: 92,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(92),
      exemplarsDelConjunt: 7,
      peusMenys130m: null,
      edatEstimada: '40 anys (2007)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Arbreda de 7 exemplars en cep; la soca major bifurca a 1,00 m.'
    },
    conservacio2007: {
      estatSalut: 'Presenta un bon estat de salut.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-08-fleixos-del-barranc-d-horta-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-08-fleixos-del-barranc-d-horta-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-08-fleixos-del-barranc-d-horta-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/fleixos-del-barranc-dhorta-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 9,
    id: 'arbre-09-ginebre-de-mitja-orella',
    nom: 'Ginebre de Mitja Orella',
    especieCientifica: 'Juniperus oxycedrus',
    nomComu: 'Ginebre, càdec',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Mas de Mitja Orella (carretera a Relleu, km 2)',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'Nord-est',
    pendent: '100% (marge de pedra seca)',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Ginebre de port plenament arbori amb soca molt grossa per a les dimensions habituals de Juniperus oxycedrus (121 cm de perímetre). Presenta branques seques per antigues nevades i xupladors basals.',
    acces: 'Al marge d’un bancal agrícola a 30 m de la carretera de La Torre a Relleu (km 2, a l’altura del Mas de Mitja Orella, a mà esquerra).',
    valorCulturalHistoric: 'Testimoni viu de la simbiosi entre marge de pedra seca i flora llenyosa autòctona de port arbori excepcional.',
    observacions: 'Dimensions excepcionals per a les habituals de l’espècie.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 726371, y: 4275989, altitudM: 830, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '3', parcella: '8', ambit: 'Rústic agrari' },
    dimensions2007: {
      alcadaM: 5,
      diametreCapcadaM: 8,
      perimetreNormalCm: 121,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(121),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenari',
      anyNaixencaAprox: null,
      notaDendrometrica: null
    },
    conservacio2007: {
      estatSalut: 'Danys mecànics a la capçada produïts per acumulació de neu amb branques seques i emissió de xupladors basals.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-09-ginebre-de-mitja-orella-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-09-ginebre-de-mitja-orella-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-09-ginebre-de-mitja-orella-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/ginebre-de-mitja-orella-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 10,
    id: 'arbre-10-llorer-de-villa-maria',
    nom: 'Llorer de Villa María',
    especieCientifica: 'Laurus nobilis',
    nomComu: 'Llorer',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Mas Villa María (entrada per l’Avinguda d’Alacant)',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'Est-sud-est',
    pendent: 'Abancalat',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Cep monumental de llorer format per 5 peus que abasten un perímetre basal conjunt de 720 cm (108 cm el peu major), amb capçada ampla i frondosa.',
    acces: 'Dins de la finca privada Villa María (a mà dreta entrant al poble per l’Avinguda d’Alacant), junt al safareig de la casa.',
    valorCulturalHistoric: 'Vinculat a la construcció de Villa María (~150 anys el 2007), exemplar representatiu de la jardineria i cultura culinària dels masos benestants del XIX.',
    observacions: 'En el moment de la catalogació (2007) la casa es trobava en procés de reforma.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 724647, y: 4276645, altitudM: 770, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: null, parcella: null, ambit: 'Urbà / periurbà privat' },
    dimensions2007: {
      alcadaM: 9,
      diametreCapcadaM: 14,
      perimetreNormalCm: 108,
      perimetreBasalCm: 720,
      diametreEquivalentCm: diametreDesDePerimetre(108),
      /* Un sol cep amb 5 peus (braços d'un mateix arbre): és el camp CIEF de peus, no un conjunt d'exemplars. */
      exemplarsDelConjunt: null,
      peusMenys130m: 5,
      edatEstimada: '150 anys (2007)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Cep de 5 peus amb 720 cm de perímetre basal total i 108 cm al fust individual major.'
    },
    conservacio2007: {
      estatSalut: 'Presenta un bon estat de salut i capçada frondosa.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-10-llorer-de-villa-maria-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-10-llorer-de-villa-maria-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-10-llorer-de-villa-maria-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/llorer-de-villa-maria-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 11,
    id: 'arbre-11-oms-de-la-placa-de-l-esglesia',
    nom: 'Oms de la Plaça de l’Església',
    especieCientifica: 'Ulmus minor',
    nomComu: 'Om',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Plaça de l’Església de Nostra Senyora de l’Assumpció',
    propietari: 'Ajuntament de La Torre de les Maçanes',
    titularitatCief: 'Pública municipal',
    accesLliure: true,
    orientacio: 'Carrer i plaça estreta del nucli antic',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Parella d’oms de port mitjà amb fust recte i diverses branques que conformen una capçada d’ombra davant la porta de l’església.',
    acces: 'Ubicats en ple cor urbà de La Torre, a la Plaça de l’Església. Accés lliure.',
    valorCulturalHistoric: 'Supervivents excepcionals dels antics oms de plaça mediterranis delmats per la grafiosi; espai de trobada social i memòria col·lectiva del poble.',
    observacions: 'Per la dimensió reduïda de la plaça, les branques arriben prop de les façanes i condicionen el volum de la capçada.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 724858, y: 4276508, altitudM: 800, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: null, parcella: null, ambit: 'Sòl urbà municipal' },
    dimensions2007: {
      alcadaM: 11,
      diametreCapcadaM: 11,
      perimetreNormalCm: 200,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(200),
      exemplarsDelConjunt: 2,
      peusMenys130m: null,
      edatEstimada: '90 anys (2007)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Conjunt de 2 exemplars; cotes de referència sobre l’exemplar major.'
    },
    conservacio2007: {
      estatSalut: 'Bon estat de salut general i vigilància fitosanitària permanent.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-11-oms-de-la-placa-de-l-esglesia-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-11-oms-de-la-placa-de-l-esglesia-detall-2007.webp`,
      foto2020: `${RUTA_ARBRES}/arbre-11-oms-de-la-placa-de-l-esglesia-2020.webp`,
      dataFoto2020: '2020-05-08',
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-11-oms-de-la-placa-de-l-esglesia-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/oms-de-la-placa-de-lesglesia-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 12,
    id: 'arbre-12-pi-de-la-foia-boix',
    nom: 'Pi de la Foia Boix',
    especieCientifica: 'Pinus halepensis',
    nomComu: 'Pi blanc',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Mas de la Foia Boix',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'A tots els vents',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Pi blanc imponent de prop de 5 m de perímetre de soca (498 cm) dividit en tres branques principals molt grosses (una quarta es va esquinçar antigament). Capçada oberta de 24 m.',
    acces: 'Junt al Mas la Foia Boix: carretera de La Torre a Benifallim km 2,5, desviació a la dreta i a 800 m camí de terra fins al mas. Propietat privada.',
    valorCulturalHistoric: 'Arbre d’ombra del Mas de la Foia Boix; antigament convivia amb dos oms monumentals desapareguts per la grafiosi.',
    observacions: 'Dimensions a tan sols 1 m de capçada i 102 cm de perímetre dels llindars de protecció genèrica autonòmica (498 cm de soca i 24 m de cóp).',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 725665, y: 4278543, altitudM: 869, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '2', parcella: '55', ambit: 'Rústic' },
    dimensions2007: {
      alcadaM: 19,
      diametreCapcadaM: 24,
      perimetreNormalCm: 498,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(498),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenari',
      anyNaixencaAprox: null,
      notaDendrometrica: 'El mateix text descriptiu explicita «5 m de perímetre de soca» (498 cm).'
    },
    conservacio2007: {
      estatSalut: 'Símptomes de senescència amb cóp poc dens i ferides antigues cicatritzades a la soca.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-12-pi-de-la-foia-boix-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-12-pi-de-la-foia-boix-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-12-pi-de-la-foia-boix-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/pi-de-la-foia-boix-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 13,
    id: 'arbre-13-pi-del-mas-de-pipa',
    nom: 'Pi del Mas de Pipa',
    especieCientifica: 'Pinus halepensis',
    nomComu: 'Pi blanc',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Mas de Pipa (sector Abió)',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'A tots els vents',
    pendent: '35%',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Pi blanc de soca grossa (427 cm) i fust ramificat lleugerament inclinat, amb capçada ampla i densa de 23 m. Conserva a la base la cicatriu d’un segon fust antic caigut pel vent.',
    acces: 'Junt al Mas de Pipa: carretera de La Torre a Abió km 1,5 i camí de terra a mà esquerra fins al mas. Propietat privada.',
    valorCulturalHistoric: 'Arbre tutelar del Mas de Pipa, fita paisatgística tradicional de la partida meridional del terme.',
    observacions: 'Dimensions excepcionals per a Pinus halepensis mereixedores de mesures específiques d’estabilització.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 724835, y: 4274962, altitudM: 760, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '5', parcella: '105', ambit: 'Rústic' },
    dimensions2007: {
      alcadaM: 13,
      diametreCapcadaM: 23,
      perimetreNormalCm: 427,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(427),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenari',
      anyNaixencaAprox: null,
      notaDendrometrica: null
    },
    conservacio2007: {
      estatSalut: 'Bon aspecte fitosanitari general i capçada densa.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-13-pi-del-mas-de-pipa-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-13-pi-del-mas-de-pipa-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-13-pi-del-mas-de-pipa-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/pi-del-mas-de-pipa-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 14,
    id: 'arbre-14-pi-del-pla-verd',
    nom: 'Pi del Pla Verd',
    especieCientifica: 'Pinus halepensis',
    nomComu: 'Pi blanc',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Era del Mas del Pla Verd (desviament als Castellans)',
    propietari: 'Privat',
    titularitatCief: 'Privada (visible des de carretera)',
    accesLliure: true,
    orientacio: 'A tots els vents',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Pi blanc vellíssim de tronc esculturalment recorbat (476 cm de perímetre). Una de les branques principals es va assecar arran de l’impacte d’un llamp.',
    acces: 'Junt al Mas del Pla Verd: circumval·lació de La Torre i desviació cap al Mas dels Castellans; a 400 m de l’encreuament, al costat mateix de la carretera.',
    valorCulturalHistoric: 'Considerat per la tradició oral veïnal l’arbre més vell del terme municipal; silueta icònica d’altíssim valor paisatgístic.',
    observacions: 'Revisat amb fotografia de camp el 29/02/2020 conservant el seu port recorbat característic.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 725272, y: 4277313, altitudM: 825, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '2', parcella: '20', ambit: 'Rústic' },
    dimensions2007: {
      alcadaM: 16,
      diametreCapcadaM: 17,
      perimetreNormalCm: 476,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(476),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenari (tradició oral: el més vell del terme)',
      anyNaixencaAprox: null,
      notaDendrometrica: null
    },
    conservacio2007: {
      estatSalut: 'Símptomes de senescència amb cóp poc dens, branca seca per llamp i ferides antigues al tronc.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-14-pi-del-pla-verd-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-14-pi-del-pla-verd-detall-2007.webp`,
      foto2020: `${RUTA_ARBRES}/arbre-14-pi-del-pla-verd-2020.webp`,
      dataFoto2020: '2020-02-29',
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-14-pi-del-pla-verd-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/pi-del-pla-verd-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 15,
    id: 'arbre-15-pi-dels-arrendaors',
    nom: 'Pi dels Arrendaors',
    especieCientifica: 'Pinus halepensis',
    nomComu: 'Pi blanc',
    categoria: 'Monumental',
    monumental: true,
    paratge: 'Mas Els Arrendaors (carretera a Abió, km 3)',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'A tots els vents',
    pendent: 'Plana (ribàs de bancal)',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Pi blanc monumental de soca colossal (570 cm de perímetre normal) que es ramifica en tres branques mestres formant una capçada ampla i densa de 25 m de diàmetre.',
    acces: 'Junt al Mas Els Arrendaors: carretera de La Torre a Abió km 3 i camí de terra de 400 m (tancat amb cadena per a vehicles, accessible a peu respectant la propietat).',
    valorCulturalHistoric: 'Gegant arbori del patrimoni agrari dels masos del sud del terme, protegit genèricament per la Llei 4/2006.',
    observacions: 'Protegit genèricament per la Llei 4/2006, de 19 de maig, article 4, en assolir un diàmetre de capçada de 25 m (i 570 cm de perímetre de tronc).',
    paginesFont: { cataleg2007: 62, edicio2020: 104 },
    utmEtrs89: {
      fus: 30,
      x: 724144,
      y: 4274267,
      altitudM: 690,
      fontUtm: 'Catàleg 2007 (pàg. 62, verificat amb Polígon 6 · Parcel·la 115)',
      notaEdicio2020: 'Esmena documental R17: a la maquetació de l’edició 2020 (pàg. 104) es va repetir per arrossegament la caixa UTM del #14 Pi del Pla Verd (725272 / 4277313). S’hi restituïxen les coordenades reals verificades al catàleg 2007 (X 724144, Y 4274267).'
    },
    cadastre: { poligon: '6', parcella: '115', ambit: 'Rústic agrari' },
    dimensions2007: {
      alcadaM: 16,
      diametreCapcadaM: 25,
      perimetreNormalCm: 570,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(570),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: 'Centenari',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Major perímetre individual de tronc a 1,30 m de tot el catàleg municipal (570 cm) i capçada monumental de 25 m.'
    },
    conservacio2007: {
      estatSalut: 'Presenta un bon aspecte fitosanitari general i capçada densa.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-15-pi-dels-arrendaors-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-15-pi-dels-arrendaors-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-15-pi-dels-arrendaors-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/pi-dels-arrendaors-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 16,
    id: 'arbre-16-roures-de-nofre',
    nom: 'Roures de Nofre',
    especieCientifica: 'Quercus faginea',
    nomComu: 'Roure valencià, glaner, gal·ler',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Fons del Barranc de la Zurca (límit amb Relleu)',
    propietari: 'Privat',
    titularitatCief: 'Privada',
    accesLliure: false,
    orientacio: 'Nord',
    pendent: 'Vessant 100%',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Arbreda relictual formada per 8 exemplars principals i regenerat jove de roure valencià. El roure major té fust recte de 16 m d’alçària i 150 cm de perímetre.',
    acces: 'Al límit municipal amb Relleu, al fons del Barranc de la Zurca (carretera a Relleu km 4, camí del Mas de la Zurca i 100 m a peu pel llit del barranc).',
    valorCulturalHistoric: 'Enclavament d’ombria d’altíssima biodiversitat proposat al catàleg per a la creació d’una microrreserva de flora.',
    observacions: 'Arbreda de 8 exemplars principals. A les fitxes 2007/2020 apareix escrit «Quercus fajinea»; es normalitza la grafia botànica estàndard Quercus faginea conservant el registre documental.',
    paginesFont: { cataleg2007: 66, edicio2020: 112 },
    utmEtrs89: {
      fus: 30,
      x: 728507,
      y: 4275504,
      altitudM: 820,
      fontUtm: 'Catàleg 2007 (pàg. 66, verificat amb Polígon 1 · Parcel·la 47)',
      notaEdicio2020: 'Esmena documental R17: l’edició 2020 (pàg. 112) corregí l’errata d’unitat del 2007 («150 m» -> «150 cm» de perímetre), però va arrossegar per error les UTM del #14 Pi del Pla Verd. S’hi restituïxen les coordenades reals del catàleg 2007 (X 728507, Y 4275504).'
    },
    cadastre: { poligon: '1', parcella: '47', ambit: 'Rústic forestal' },
    dimensions2007: {
      alcadaM: 16,
      diametreCapcadaM: 14,
      perimetreNormalCm: 150,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(150),
      exemplarsDelConjunt: 8,
      peusMenys130m: null,
      edatEstimada: 'Centenaris',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Conjunt de 8 roures principals; 150 cm de perímetre al roure major (corregit de l’errata tipogràfica «150 m» del 2007 en l’edició 2020).'
    },
    conservacio2007: {
      estatSalut: 'Presenta un bon estat de salut i regeneració natural d’ombria.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-16-roures-de-nofre-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-16-roures-de-nofre-detall-2007.webp`,
      foto2020: null,
      dataFoto2020: null,
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-16-roures-de-nofre-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/roures-de-nofre-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 17,
    id: 'arbre-17-xiprer-de-la-foia',
    nom: 'Xiprer de la Foia',
    especieCientifica: 'Cupressus sempervirens',
    nomComu: 'Xiprer',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Circumval·lació cap a Relleu · Antiga bassa de la Foia',
    propietari: 'Privat',
    titularitatCief: 'Privada (visible des de via pública)',
    accesLliure: false,
    orientacio: 'Est',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Xiprer solitari de port columnar clàssic i tronc gros (215 cm de perímetre normal i 12 m d’alçària) situat al costat d’una antiga bassa de reg.',
    acces: 'A la circumval·lació del poble de La Torre cap a Relleu, junt a una antiga bassa de reg pròxima a la carretera, perfectament visible des de la via pública.',
    valorCulturalHistoric: 'Fita vertical clàssica del paisatge agrari d’hortes i basses periurbanes de La Torre.',
    observacions: 'Revisat amb fotografia de camp el 08/05/2020 mantenint l’estructura columnar íntegra.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 724990, y: 4276235, altitudM: 755, fontUtm: 'Catàleg 2007 / 2020', notaEdicio2020: null },
    cadastre: { poligon: '2', parcella: '250', ambit: 'Rústic agrari' },
    dimensions2007: {
      alcadaM: 12,
      diametreCapcadaM: 6,
      perimetreNormalCm: 215,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(215),
      exemplarsDelConjunt: null,
      peusMenys130m: 1,
      edatEstimada: '90 anys (2007)',
      anyNaixencaAprox: null,
      notaDendrometrica: null
    },
    conservacio2007: {
      estatSalut: 'Presenta un bon estat de salut.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-17-xiprer-de-la-foia-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-17-xiprer-de-la-foia-detall-2007.webp`,
      foto2020: `${RUTA_ARBRES}/arbre-17-xiprer-de-la-foia-2020.webp`,
      dataFoto2020: '2020-05-08',
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-17-xiprer-de-la-foia-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/xiprer-de-la-foia-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 18,
    id: 'arbre-18-xiprers-del-calvari',
    nom: 'Xiprers del Calvari',
    especieCientifica: 'Cupressus sempervirens',
    nomComu: 'Xiprer',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Carrer i Camí del Calvari',
    propietari: 'Ajuntament de La Torre de les Maçanes',
    titularitatCief: 'Pública municipal',
    accesLliure: true,
    orientacio: 'A tots els vents',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Alineació històrica al camí d’accés al cementeri formada (el 2007) per 12 exemplars antics de fins a 13 m d’alçària en segona fila i 23 exemplars joves de reposició de fins a 7 m.',
    acces: 'Pel carrer del Calvari, itinerari públic peatonal des del nucli urbà fins al cementeri municipal.',
    valorCulturalHistoric: 'Plantats a principis del segle XX com a via sacra i passeig ombrívol del Calvari; patrimoni paisatgístic i espiritual de La Torre.',
    observacions: 'Revisats amb fotografia de camp el 08/05/2020. L’exemplar major presenta 108 cm de perímetre de tronc a l’alçària normal (1,30 m) i 4 m de capçada.',
    paginesFont: SENSE_PAGINES,
    utmEtrs89: { fus: 30, x: 724776, y: 4276410, altitudM: 755, fontUtm: 'Catàleg 2007 / Edició 2020 (altitud 755 m incorporada el 2020)', notaEdicio2020: null },
    cadastre: { poligon: null, parcella: null, ambit: 'Domini públic municipal' },
    dimensions2007: {
      alcadaM: 13,
      diametreCapcadaM: 4,
      perimetreNormalCm: 108,
      perimetreBasalCm: null,
      diametreEquivalentCm: diametreDesDePerimetre(108),
      exemplarsDelConjunt: 35,
      peusMenys130m: null,
      edatEstimada: 'Plantats a principis del segle XX (~100 anys)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Conjunt lineal de 35 xiprers comptabilitzats el 2007 (12 vells fins a 13 m + 23 nous fins a 7 m); cotes preses sobre l’exemplar major.'
    },
    conservacio2007: {
      estatSalut: 'Conjunt viu amb renovació generacional progressiva dels peus envellits.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-18-xiprers-del-calvari-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-18-xiprers-del-calvari-detall-2007.webp`,
      foto2020: `${RUTA_ARBRES}/arbre-18-xiprers-del-calvari-2020.webp`,
      dataFoto2020: '2020-05-08',
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-18-xiprers-del-calvari-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/xiprers-del-calvari-de-la-torre-de-les-macanes/'
  },
  {
    ordre: 19,
    id: 'arbre-19-xiprers-del-cementeri',
    nom: 'Xiprers del Cementeri',
    especieCientifica: 'Cupressus sempervirens',
    nomComu: 'Xiprer',
    categoria: 'Emblemàtic',
    monumental: false,
    paratge: 'Carrer central del Cementeri de La Torre de les Maçanes',
    /* Arbitratge R17.3 (P1) · «Parròquia de Santa Anna» contradiu l'advocació de l'església del #11: pendent de
       verificar amb la pàgina del catàleg. */
    propietari: null,
    titularitatCief: 'Ús públic funerari (titularitat pendent de verificar)',
    accesLliure: true,
    orientacio: 'A tots els vents',
    pendent: 'Terreny pla',
    sol: null,
    comunitatVegetal: null,
    descripcio: 'Alineació centenària de xiprers al carrer central del cementeri, coetanis de la construcció del recinte a principis del segle XX i proposats en conjunt com a arbreda d’interés local.',
    acces: 'Interior del cementeri al final del passeig del Calvari, obert en horari públic.',
    valorCulturalHistoric: 'Construït a principis del segle XX, el conjunt complet (exemplars centenaris i joves de relleu) constituïx una arbreda funerària històrica de protecció integral.',
    observacions: 'Tant el catàleg 2007 (pàg. 78) com l’edició 2020 (pàg. 128–130) consignen amb «?» les cotes dendromètriques i l’altitud; es mantenen en `null` pendent d’amidament instrumental CIEF sense inventar xifres.',
    paginesFont: { cataleg2007: 78, edicio2020: 128 },
    utmEtrs89: { fus: 30, x: 724734, y: 4276563, altitudM: null, fontUtm: 'Catàleg 2007 / 2020 (altitud consignada com «? m»)', notaEdicio2020: null },
    cadastre: { poligon: '2', parcella: '226', ambit: 'Dotacional funerari' },
    dimensions2007: {
      alcadaM: null,
      diametreCapcadaM: null,
      perimetreNormalCm: null,
      perimetreBasalCm: null,
      diametreEquivalentCm: null,
      exemplarsDelConjunt: null,
      peusMenys130m: null,
      edatEstimada: 'Centenària (principis del segle XX)',
      anyNaixencaAprox: null,
      notaDendrometrica: 'Pendent de mesura instrumental individualitzada («?» al catàleg 2007 i a l’edició 2020).'
    },
    conservacio2007: {
      estatSalut: 'Conjunt arbori consolidat amb coexistència de peus centenaris i exemplars de relleu.',
      amenaces: null,
      mesuresPropostes: null
    },
    fotos: {
      foto2007: `${RUTA_ARBRES}/arbre-19-xiprers-del-cementeri-2007.webp`,
      fotoDetall2007: `${RUTA_ARBRES}/arbre-19-xiprers-del-cementeri-detall-2007.webp`,
      foto2020: `${RUTA_ARBRES}/arbre-19-xiprers-del-cementeri-2020.webp`,
      dataFoto2020: '2020-05-08',
      mapa: mapaSiAcreditat(`${RUTA_ARBRES}/arbre-19-xiprers-del-cementeri-mapa.webp`)
    },
    enllacOriginal2007: 'https://socdepoble.net/2007/09/07/xiprers-del-cementeri-de-la-torre-de-les-macanes/'
  }
];

export const ARBRES_MONUMENTALS_2020 = congela(LLISTA_CRUA);

export function buscaArbreMonumental2020(idOSlug) {
  if (!idOSlug) return null;
  const clau = String(idOSlug).trim();
  return ARBRES_MONUMENTALS_2020.find((arbre) => arbre.id === clau || String(arbre.ordre) === clau) || null;
}
