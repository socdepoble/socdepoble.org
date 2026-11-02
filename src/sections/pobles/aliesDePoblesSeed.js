/**
 * aliesDePoblesSeed.js · D-5 (pla 261101_1246, assalt 10/10; IDEA-49 del
 * Llibre Mestre) · Les dades dels àlies de poble: els noms bilingües i
 * populars amb què la gent diu un poble, i els municipis de referència que
 * es poden triar a la Fitxa de memòria oral encara que no siguen pobles de
 * l'aplicació. És llavor, com townsSeed.js: porta noms de poble. La lògica
 * (aliesDePobles.js) no en porta cap (ordre del Mestre 261009_0230, punt 6).
 *
 * Cada àlies és { forma, ambMajuscula?, majusculaEn? }:
 *  · forma: com s'escriu («Jijona», «la Torre»);
 *  · ambMajuscula: als relats només compta escrit amb majúscula, perquè també
 *    és una paraula corrent («la torre de l'església» no és cap poble);
 *  · majusculaEn: quina paraula de la forma ha de portar la majúscula (0, la
 *    primera; «la Torre», 1: la de «Torre»).
 * Al selector de la fitxa la majúscula no compta: la persona tria el poble.
 *
 * València/Valencia i Penàguila/Penáguila no necessiten àlies: sense accents,
 * la forma de comparació ja és la mateixa. Una fitxa de poble de la base de
 * dades pot portar els seus àlies al camp `alies`, i aleshores no cal tocar
 * este fitxer (aliesDePobles.js · aliesDelPoble).
 *
 * Els municipis de referència (Ibi, Castalla, Onil, Biar, Alcoi, Alacant i
 * València) no són a la llavor de l'aplicació: el detector de pobles dels
 * relats no els proposa mai (no s'inventa cap poble), però la persona que
 * revisa la fitxa els pot triar. La comarca i la província no ixen al markdown
 * de la fitxa (només el nom), però viatgen a `fitxa.municipi`: el 261102
 * (IDEA-49, torn torn_d19293b9) els 53 municipis de referència s'han
 * contrastat, nom i comarca, amb les fonts oficials: AVL, «Noms dels
 * municipis valencians» (https://www.avl.gva.es/municipis/, 23/04/2026) i
 * Nomenclàtor Toponímic Valencià (https://www.avl.gva.es/ntv/); PEGV,
 * «Municipis · Relació a 1 de gener de 2026» amb la comarca de la Llei 2/2020
 * (https://pegv.gva.es/va/municipis); INE, taules 2856 i 2903 i modificacions
 * des de l'1/1/2026 (https://www.ine.es/daco/daco42/codmun/codmun_anual.htm).
 * 53 coincidixen, 0 diferixen. Les fonts escriuen l'article en minúscula
 * («el Campello», «l'Orxa»): ací va en majúscula com a títol de fitxa; una
 * exportació que publique la forma del Nomenclàtor l'ha de passar a minúscula.
 *
 * T11-04 (Gemini, Tall 11; marató 261101_2143) · Darrere dels set de
 * sempre, la resta dels municipis de les quatre comarques on hi ha pobles de
 * l'aplicació (l'Alacantí, l'Alcoià, el Comtat i la Marina Baixa: la Muntanya
 * d'Alacant). «Alcosser» és el nom oficial des del Decret 115/2021
 * (BOE-A-2022-2683), només en valencià: «Alcocer de Planes» i «Alcosser de
 * Planes» en són àlies. «Muro d'Alcoi» és la forma valenciana (nom en
 * valencià de l'AVL), però el nom oficial continua sent «Muro de Alcoy»
 * (àlies; cap font oficial recull encara el canvi que l'ajuntament demana).
 * Els oficials dobles (Alcoi / Alcoy, Alacant / Alicante, Sant Vicent del
 * Raspeig / San Vicente del Raspeig, l'Orxa / Lorcha, la Vila Joiosa /
 * Villajoyosa) porten la meitat castellana com a àlies. Els àlies són les
 * formes castellanes i curtes d'ús comú; les que només canvien un accent
 * (Tárbena, Beniardá, La Nucía) no en necessiten, i «Campello» tampoc: és el
 * nom oficial sense l'article. «Sant Joan» i «Sant Vicent» no ho són: hi ha
 * altres pobles que es diuen així.
 * La comarca de València és «València», i és correcta: a la divisió comarcal
 * oficial (les demarcacions territorials homologades), la ciutat és una
 * comarca pròpia; «l'Horta» és la comarca històrica, no l'oficial. Gemini
 * proposava «L'Horta» (T11-04): no es canvia.
 */

const alies = (forma, { ambMajuscula = false, majusculaEn = 0 } = {}) => Object.freeze({ forma, ambMajuscula, majusculaEn });

/** Els àlies de cada poble, per l'id del poble (el de townsSeed.js o el de MUNICIPIS_DE_REFERENCIA). */
export const ALIES_DE_POBLES_SEED = Object.freeze({
  'la-torre-de-les-macanes': Object.freeze([alies('Torremanzanas'), alies('la Torre', { ambMajuscula: true, majusculaEn: 1 })]),
  xixona: Object.freeze([alies('Jijona')]),
  orxeta: Object.freeze([alies('Orcheta')]),
  alcoleja: Object.freeze([alies('Alcolecha')]),
  alcoi: Object.freeze([alies('Alcoy')]),
  alacant: Object.freeze([alies('Alicante')]),
  /* T11-04 · Els municipis de referència nous de l'Alacantí. */
  aigues: Object.freeze([alies('Aguas de Busot')]),
  mutxamel: Object.freeze([alies('Muchamiel')]),
  'sant-joan-d-alacant': Object.freeze([alies('San Juan de Alicante')]),
  'sant-vicent-del-raspeig': Object.freeze([alies('San Vicente del Raspeig')]),
  /* T11-04 · L'Alcoià. */
  'banyeres-de-mariola': Object.freeze([alies('Bañeres'), alies('Bañeres de Mariola'), alies('Banyeres')]),
  /* T11-04 · El Comtat. */
  alcosser: Object.freeze([alies('Alcocer de Planes'), alies('Alcosser de Planes')]),
  'l-alqueria-d-asnar': Object.freeze([alies('Alquería de Aznar')]),
  benimassot: Object.freeze([alies('Benimasot')]),
  fageca: Object.freeze([alies('Facheca')]),
  gaianes: Object.freeze([alies('Gayanes')]),
  /* «Muro», només amb majúscula als relats: en castellà també és una paraula corrent. */
  'muro-d-alcoi': Object.freeze([alies('Muro de Alcoy'), alies('Muro', { ambMajuscula: true })]),
  'l-orxa': Object.freeze([alies('Lorcha')]),
  quatretondeta: Object.freeze([alies('Cuatretondeta')]),
  /* T11-04 · La Marina Baixa. */
  'callosa-d-en-sarria': Object.freeze([alies('Callosa de Ensarriá')]),
  'el-castell-de-guadalest': Object.freeze([alies('Guadalest')]),
  'l-alfas-del-pi': Object.freeze([alies('Alfaz del Pi')]),
  'la-vila-joiosa': Object.freeze([alies('Villajoyosa')])
});

const municipi = (id, title, comarca, provincia) => Object.freeze({ id, title, comarca, provincia });

/** Els municipis que es poden triar al selector de la fitxa encara que l'aplicació no els tinga. */
export const MUNICIPIS_DE_REFERENCIA = Object.freeze([
  municipi('ibi', 'Ibi', "L'Alcoià", 'Alacant'),
  municipi('castalla', 'Castalla', "L'Alcoià", 'Alacant'),
  municipi('onil', 'Onil', "L'Alcoià", 'Alacant'),
  municipi('biar', 'Biar', "L'Alt Vinalopó", 'Alacant'),
  municipi('alcoi', 'Alcoi', "L'Alcoià", 'Alacant'),
  municipi('alacant', 'Alacant', "L'Alacantí", 'Alacant'),
  municipi('valencia', 'València', 'València', 'València'),
  /* T11-04 · L'Alacantí (la llavor ja porta Xixona i la Torre de les Maçanes). */
  municipi('agost', 'Agost', "L'Alacantí", 'Alacant'),
  municipi('aigues', 'Aigües', "L'Alacantí", 'Alacant'),
  municipi('busot', 'Busot', "L'Alacantí", 'Alacant'),
  municipi('el-campello', 'El Campello', "L'Alacantí", 'Alacant'),
  municipi('mutxamel', 'Mutxamel', "L'Alacantí", 'Alacant'),
  municipi('sant-joan-d-alacant', "Sant Joan d'Alacant", "L'Alacantí", 'Alacant'),
  municipi('sant-vicent-del-raspeig', 'Sant Vicent del Raspeig', "L'Alacantí", 'Alacant'),
  /* T11-04 · L'Alcoià (la llavor ja porta Penàguila, Benifallim i Tibi). */
  municipi('banyeres-de-mariola', 'Banyeres de Mariola', "L'Alcoià", 'Alacant'),
  /* T11-04 · El Comtat (la llavor ja porta Alcoleja). */
  municipi('agres', 'Agres', 'El Comtat', 'Alacant'),
  municipi('alcosser', 'Alcosser', 'El Comtat', 'Alacant'),
  municipi('alfafara', 'Alfafara', 'El Comtat', 'Alacant'),
  municipi('almudaina', 'Almudaina', 'El Comtat', 'Alacant'),
  municipi('l-alqueria-d-asnar', "L'Alqueria d'Asnar", 'El Comtat', 'Alacant'),
  municipi('balones', 'Balones', 'El Comtat', 'Alacant'),
  municipi('benasau', 'Benasau', 'El Comtat', 'Alacant'),
  municipi('beniarres', 'Beniarrés', 'El Comtat', 'Alacant'),
  municipi('benilloba', 'Benilloba', 'El Comtat', 'Alacant'),
  municipi('benillup', 'Benillup', 'El Comtat', 'Alacant'),
  municipi('benimarfull', 'Benimarfull', 'El Comtat', 'Alacant'),
  municipi('benimassot', 'Benimassot', 'El Comtat', 'Alacant'),
  municipi('cocentaina', 'Cocentaina', 'El Comtat', 'Alacant'),
  municipi('fageca', 'Fageca', 'El Comtat', 'Alacant'),
  municipi('famorca', 'Famorca', 'El Comtat', 'Alacant'),
  municipi('gaianes', 'Gaianes', 'El Comtat', 'Alacant'),
  municipi('gorga', 'Gorga', 'El Comtat', 'Alacant'),
  municipi('millena', 'Millena', 'El Comtat', 'Alacant'),
  municipi('muro-d-alcoi', "Muro d'Alcoi", 'El Comtat', 'Alacant'),
  municipi('l-orxa', "L'Orxa", 'El Comtat', 'Alacant'),
  municipi('planes', 'Planes', 'El Comtat', 'Alacant'),
  municipi('quatretondeta', 'Quatretondeta', 'El Comtat', 'Alacant'),
  municipi('tollos', 'Tollos', 'El Comtat', 'Alacant'),
  /* T11-04 · La Marina Baixa (la llavor ja porta Sella, Orxeta i Relleu). */
  municipi('altea', 'Altea', 'La Marina Baixa', 'Alacant'),
  municipi('beniarda', 'Beniardà', 'La Marina Baixa', 'Alacant'),
  municipi('benidorm', 'Benidorm', 'La Marina Baixa', 'Alacant'),
  municipi('benifato', 'Benifato', 'La Marina Baixa', 'Alacant'),
  municipi('benimantell', 'Benimantell', 'La Marina Baixa', 'Alacant'),
  municipi('bolulla', 'Bolulla', 'La Marina Baixa', 'Alacant'),
  municipi('callosa-d-en-sarria', "Callosa d'en Sarrià", 'La Marina Baixa', 'Alacant'),
  municipi('confrides', 'Confrides', 'La Marina Baixa', 'Alacant'),
  municipi('finestrat', 'Finestrat', 'La Marina Baixa', 'Alacant'),
  municipi('polop', 'Polop', 'La Marina Baixa', 'Alacant'),
  municipi('tarbena', 'Tàrbena', 'La Marina Baixa', 'Alacant'),
  municipi('el-castell-de-guadalest', 'El Castell de Guadalest', 'La Marina Baixa', 'Alacant'),
  municipi('l-alfas-del-pi', "L'Alfàs del Pi", 'La Marina Baixa', 'Alacant'),
  municipi('la-nucia', 'La Nucia', 'La Marina Baixa', 'Alacant'),
  municipi('la-vila-joiosa', 'La Vila Joiosa', 'La Marina Baixa', 'Alacant')
]);
