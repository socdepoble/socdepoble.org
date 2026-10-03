/**
 * Temporada · les dades: el calendari de fruites i hortalisses i les paraules
 * que fan servir per a casar noms de producte (JS pur, sense dependències).
 *
 * FONT. Calendari ORIENTATIU per al País Valencià, escrit a partir de
 * coneixement general, NO VERIFICAT en el torn que el va crear (261003, sense
 * accés a la web ni cap font agrícola pròpia al repositori). És editable i
 * està pendent de revisió del Mestre o d'una cooperativa agrària. Les dates
 * són les de la collita al camp de les comarques valencianes; un producte que
 * es conserva (creïlles, cebes, alls, pomes) hi aparix tot l'any, amb la
 * plena temporada als mesos de la collita. Un producte de tot l'any (mesos
 * '1-12') sempre és de temporada: plena, inici o final ho distingixen.
 *
 * Fora del calendari, a propòsit: el que no es cultiva ací o se'n cull poc
 * (plàtan, pinya, mango, papaia, kiwi, llima àcida, gerds, nabius), els bolets
 * silvestres i els genèrics (el nom no diu si són cultivats) i els fruits
 * secs. Per a eixos productes, temporadaDe() torna null: no s'etiqueten. El
 * xampinyó, que es cultiva a cobert, sí que hi és: ple tot l'any.
 *
 * COM S'EDITA
 *   clau      slug estable (minúscules, xifres i guionets). Les dotze que
 *             coincidixen amb els articles de base de la Nevera (tomaques,
 *             creilles…) són els mateixos ids, i així s'han de quedar (ho
 *             vigila dades.test.js).
 *   nom       el nom en valencià, com el mostrarà la interfície.
 *   mesos     els mesos de temporada, 1 (gener) a 12 (desembre): un mes ('6'),
 *             un tram ('5-7') o diversos ('3-6,9-11'). Un tram pot passar
 *             l'any: '10-6' és d'octubre a juny.
 *   plens     els mesos de plena temporada, dins de `mesos`. Cada tram de
 *             temporada n'ha de tindre almenys un (ho vigila dades.test.js).
 *             Els mesos de temporada que no són plens són d'inici (abans de
 *             la plena) o de final (després), segons la plena més pròxima.
 *   sinonims  noms en valencià i en castellà, en singular: el plural i el
 *             femení ja els casa paraules.js. Una frase de diverses paraules
 *             («judía verde») guanya a una de més curta («judía»).
 */

/* Les fruites, per ordre alfabètic de clau. */
export const FRUITES = Object.freeze([
  { clau: 'albercocs', nom: 'Albercocs', mesos: '5-7', plens: '6', sinonims: ['albercoc', 'albaricoc', 'albaricoque', 'damasco'] },
  { clau: 'alvocats', nom: 'Alvocats', mesos: '11-5', plens: '1-4', sinonims: ['alvocat', 'aguacate'] },
  { clau: 'aranges', nom: 'Aranges', mesos: '11-5', plens: '12-3', sinonims: ['aranja', 'pomelo'] },
  { clau: 'bacores', nom: 'Bacores', mesos: '6-7', plens: '6', sinonims: ['bacora', 'figa flor', 'breva'] },
  { clau: 'caquis', nom: 'Caquis', mesos: '10-12', plens: '10-11', sinonims: ['caqui', 'kaki', 'persimon', 'palosanto'] },
  { clau: 'castanyes', nom: 'Castanyes', mesos: '10-12', plens: '11', sinonims: ['castanya', 'castaña'] },
  { clau: 'cireres', nom: 'Cireres', mesos: '5-7', plens: '6', sinonims: ['cirera', 'cereza', 'picota'] },
  { clau: 'codonys', nom: 'Codonys', mesos: '9-11', plens: '10', sinonims: ['codony', 'membrillo'] },
  { clau: 'figues', nom: 'Figues', mesos: '8-10', plens: '8-9', sinonims: ['figa', 'higo'] },
  /* Llima és el nom valencià de la llimona; la llima àcida (lima) no hi és. */
  { clau: 'llimes', nom: 'Llimes', mesos: '10-7', plens: '11-4', sinonims: ['llima', 'llimona', 'limón'] },
  { clau: 'maduixes', nom: 'Maduixes', mesos: '1-6', plens: '3-5', sinonims: ['maduixa', 'maduixot', 'fresa', 'fresón'] },
  { clau: 'magranes', nom: 'Magranes', mesos: '9-12', plens: '10-11', sinonims: ['magrana', 'mangrana', 'granada'] },
  { clau: 'mandarines', nom: 'Mandarines', mesos: '9-4', plens: '11-1', sinonims: ['mandarina', 'clementina', 'satsuma'] },
  { clau: 'melons', nom: 'Melons', mesos: '6-9', plens: '7-8', sinonims: ['meló', 'melón'] },
  { clau: 'nespres', nom: 'Nespres', mesos: '4-6', plens: '5', sinonims: ['nespra', 'nespla', 'níspero'] },
  { clau: 'peres', nom: 'Peres', mesos: '7-12', plens: '8-10', sinonims: ['pera'] },
  { clau: 'pomes', nom: 'Pomes', mesos: '8-3', plens: '9-12', sinonims: ['poma', 'manzana'] },
  {
    clau: 'pressecs', nom: 'Préssecs', mesos: '5-9', plens: '6-8',
    sinonims: ['préssec', 'bresquilla', 'nectarina', 'paraguaià', 'melocotón', 'paraguayo']
  },
  { clau: 'prunes', nom: 'Prunes', mesos: '6-9', plens: '7-8', sinonims: ['pruna', 'ciruela'] },
  /* El raïm embossat del Vinalopó allarga la temporada fins al desembre. */
  { clau: 'raim', nom: 'Raïm', mesos: '8-12', plens: '9-11', sinonims: ['uva'] },
  { clau: 'sindries', nom: 'Síndries', mesos: '6-9', plens: '7-8', sinonims: ['síndria', 'meló d’Alger', 'sandía'] },
  { clau: 'taronges', nom: 'Taronges', mesos: '10-6', plens: '11-4', sinonims: ['taronja', 'naranja'] }
].map((entrada) => Object.freeze({ ...entrada, sinonims: Object.freeze(entrada.sinonims) })));

/* Les hortalisses, per ordre alfabètic de clau. */
export const HORTALISSES = Object.freeze([
  { clau: 'alberginies', nom: 'Albergínies', mesos: '6-10', plens: '7-9', sinonims: ['albergínia', 'berenjena'] },
  { clau: 'alls', nom: 'Alls', mesos: '1-12', plens: '6-9', sinonims: ['all', 'ajo'] },
  { clau: 'alls-tendres', nom: 'Alls tendres', mesos: '1-4', plens: '2-3', sinonims: ['all tendre', 'ajo tierno', 'ajete'] },
  { clau: 'api', nom: 'Api', mesos: '10-5', plens: '11-3', sinonims: ['apio'] },
  {
    clau: 'bajoquetes', nom: 'Bajoquetes', mesos: '5-10', plens: '6-9',
    sinonims: ['bajoqueta', 'ferraura', 'mongeta tendra', 'judía verde', 'judía plana', 'judía redonda']
  },
  { clau: 'bledes', nom: 'Bledes', mesos: '9-6', plens: '11-3', sinonims: ['bleda', 'acelga'] },
  { clau: 'broquil', nom: 'Bròquil', mesos: '10-4', plens: '11-3', sinonims: ['bròcoli', 'brócoli', 'brécol'] },
  { clau: 'carabasses', nom: 'Carabasses', mesos: '9-1', plens: '10-11', sinonims: ['carabassa', 'calabaza'] },
  { clau: 'carabasso', nom: 'Carabassó', mesos: '4-10', plens: '6-8', sinonims: ['calabacín'] },
  { clau: 'carxofes', nom: 'Carxofes', mesos: '11-5', plens: '2-4', sinonims: ['carxofa', 'alcachofa'] },
  { clau: 'cebes', nom: 'Cebes', mesos: '1-12', plens: '5-8', sinonims: ['ceba', 'cebeta', 'cebolla', 'cebolleta'] },
  { clau: 'cogombres', nom: 'Cogombres', mesos: '5-9', plens: '6-8', sinonims: ['cogombre', 'pepino'] },
  { clau: 'coliflors', nom: 'Coliflors', mesos: '10-4', plens: '11-2', sinonims: ['coliflor'] },
  { clau: 'cols', nom: 'Cols', mesos: '10-3', plens: '11-2', sinonims: ['col', 'col llombarda', 'lombarda', 'repollo', 'berza'] },
  { clau: 'creilles', nom: 'Creïlles', mesos: '1-12', plens: '4-7', sinonims: ['creïlla', 'patata'] },
  { clau: 'encisam', nom: 'Encisam', mesos: '1-12', plens: '10-5', sinonims: ['enciam', 'lletuga', 'lechuga', 'cogoll', 'cogollo'] },
  { clau: 'escaroles', nom: 'Escaroles', mesos: '10-3', plens: '11-2', sinonims: ['escarola'] },
  { clau: 'esparrecs', nom: 'Espàrrecs', mesos: '3-6', plens: '4-5', sinonims: ['espàrrec', 'espárrago'] },
  { clau: 'espinacs', nom: 'Espinacs', mesos: '10-4', plens: '11-3', sinonims: ['espinac', 'espinaca'] },
  { clau: 'faves', nom: 'Faves', mesos: '2-5', plens: '3-4', sinonims: ['fava', 'haba'] },
  { clau: 'fonolls', nom: 'Fonolls', mesos: '10-4', plens: '11-2', sinonims: ['fonoll', 'hinojo'] },
  { clau: 'garrofons', nom: 'Garrofons', mesos: '7-10', plens: '8-9', sinonims: ['garrofó', 'garrofón'] },
  { clau: 'moniatos', nom: 'Moniatos', mesos: '9-2', plens: '10-12', sinonims: ['moniato', 'boniato', 'batata'] },
  { clau: 'nabicols', nom: 'Nabicols', mesos: '10-4', plens: '11-2', sinonims: ['nabicol', 'colinap', 'colirave', 'colinabo'] },
  { clau: 'naps', nom: 'Naps', mesos: '10-3', plens: '11-2', sinonims: ['nap', 'nabo'] },
  /* Només la dacsa en panolla: el gra a soles sol ser de llanda. */
  {
    clau: 'panolles', nom: 'Panolles de dacsa', mesos: '7-10', plens: '8-9',
    sinonims: ['panolla', 'dacsa en panolla', 'mazorca', 'mazorca de maíz', 'maíz en mazorca', 'maíz dulce en mazorca']
  },
  { clau: 'pebrots', nom: 'Pebrots', mesos: '6-11', plens: '7-9', sinonims: ['pebrot', 'pimiento'] },
  { clau: 'pesols', nom: 'Pésols', mesos: '1-5', plens: '3-4', sinonims: ['pésol', 'pèsol', 'tirabec', 'guisante'] },
  { clau: 'porros', nom: 'Porros', mesos: '10-4', plens: '11-2', sinonims: ['porro', 'all porro', 'puerro'] },
  { clau: 'raves', nom: 'Raves', mesos: '10-5', plens: '11-3', sinonims: ['rave', 'ravenet', 'rábano', 'rabanito'] },
  { clau: 'remolatxes', nom: 'Remolatxes', mesos: '10-5', plens: '11-3', sinonims: ['remolatxa', 'remolacha'] },
  { clau: 'safanories', nom: 'Safanòries', mesos: '1-12', plens: '11-5', sinonims: ['safanòria', 'pastanaga', 'carlota', 'zanahoria'] },
  { clau: 'tomaques', nom: 'Tomaques', mesos: '5-11', plens: '7-9', sinonims: ['tomaca', 'tomata', 'tomàquet', 'tomate'] },
  /* El xampinyó es cultiva a cobert: tot l'any és ple. */
  { clau: 'xampinyons', nom: 'Xampinyons', mesos: '1-12', plens: '1-12', sinonims: ['xampinyó', 'champiñón'] }
].map((entrada) => Object.freeze({ ...entrada, sinonims: Object.freeze(entrada.sinonims) })));

/*
 * LES PARAULES DEL CASAMENT. Totes es comparen normalitzades (paraules.js:
 * sense accents, majúscules ni signes); les marques, a més, per l'arrel.
 * «Bossa» i «bolsa» són a les dues llistes: davant del nom és l'envàs
 * («Bossa de creïlles»), darrere és l'aperitiu («Creïlles de bossa»).
 */

/**
 * Les paraules que poden anar davant del nom del producte i que se salten:
 * «Mitja síndria», «Ram de tomaques», «Bossa de creïlles», «2 kg de tomaques».
 * Les xifres soltes també se salten.
 */
export const DAVANT_DEL_NOM = Object.freeze([
  'mig', 'mitja', 'medio', 'media', 'mini', 'rama', 'ram', 'manoll', 'manojo',
  'bossa', 'bolsa', 'malla', 'safata', 'bandeja', 'caixa', 'caja', 'pack',
  'de', 'd', 'del', 'dels', 'l', 'la', 'el', 'les', 'els', 'los', 'las', 'un', 'una', 'uns', 'unes',
  'kg', 'kilo', 'kilos', 'quilo', 'quilos', 'g', 'gr', 'u', 'ud', 'uds', 'x'
]);

/**
 * Les marques que, DARRERE del nom, diuen que no és el producte fresc
 * («Tomaca fregida», «Pésols congelats», «Creïlles de bossa», «Creïlles amb
 * allioli»). N'hi ha prou amb el masculí singular: el plural el casa l'arrel,
 * i el femení valencià dels participis en -at, -it i -ut (congelada, fregida,
 * espremuda) el deriva index.js, llevat dels noms de NO_SON_MARQUES.
 */
export const MARQUES_NO_FRESC = Object.freeze([
  /* Elaborat o cuinat. */
  'frito', 'fregit', 'asado', 'rostit', 'torrat', 'escalivado', 'escalivat', 'horno', 'forn', 'vapor',
  'cocido', 'cuit', 'cocinado', 'cuinat', 'bullit', 'confitado', 'confitat', 'caramelizado', 'caramel·litzat',
  /* Triturat, tallat o espremut a la fàbrica. */
  'triturado', 'triturat', 'tamizado', 'tamisat', 'concentrado', 'concentrat', 'pelado', 'pelat',
  'troceado', 'trossejat', 'laminado', 'laminat', 'picado', 'picat', 'tiras', 'tires', 'exprimido', 'exprimit', 'espremut',
  'molido', 'polvo', 'pols', 'untar', 'untable',
  /* Conserva, congelat o sec. */
  'conserva', 'lata', 'llauna', 'congelado', 'congelat', 'ultracongelado', 'ultracongelat',
  'deshidratado', 'deshidratat', 'liofilizado', 'liofilitzat', 'seco', 'sec', 'pasa', 'pansa',
  'almíbar', 'almívar', 'mermelada', 'melmelada', 'confitura', 'compota', 'encurtido', 'envinagrat', 'vinagre',
  'escabeche', 'escabetx', 'piquillo', 'condimentado', 'condimentat', 'aliñado', 'amanit', 'aceite', 'oli',
  /* Aperitiu de bossa o condiment: «Creïlles de bossa», «Creïlles xips»,
     «Creïlles palla», «Ceba cruixent», «Alls granulats», «Creïlles sabor pernil».
     «Sabor» també deixa sense etiqueta algun fresc que el porta al nom
     («Tomaques sabor d'abans»): és el costat que tria la regla del dubte. */
  'chips', 'xips', 'bolsa', 'bossa', 'paja', 'palla', 'crujiente', 'cruixent', 'granulado', 'granulat', 'sabor',
  /* Plat combinat: «Creïlles amb allioli», «Maduixes amb nata». */
  'con', 'amb',
  /* No és menjar: «Llima d'ungles». */
  'ungla'
]);

/**
 * Els noms que fan l'arrel del femení derivat d'una marca i que no ho són:
 * «amanida», el plat, fa l'arrel del femení d'«amanit». Darrere del nom, el
 * producte continua fresc («Tomaques d'amanida», «Encisam per a amanida»); el
 * masculí («Encisam amanit») continua sent marca.
 */
export const NO_SON_MARQUES = Object.freeze(['amanida']);

/**
 * Les paraules que tenen l'arrel d'un sinònim però que no són el producte:
 * a l'inici del nom, el casament torna null. Van tal com s'escriuen.
 */
export const ALIENES = Object.freeze([
  'pimienta', 'pimientas', 'cola', 'colas', 'cole', 'per', 'pere', 'pero', 'alla', 'cebo', 'porra', 'porres', 'porras'
]);
