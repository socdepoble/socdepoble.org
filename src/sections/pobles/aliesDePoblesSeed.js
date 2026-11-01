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
 * de la fitxa (només el nom), però viatgen a `fitxa.municipi`: cal
 * contrastar-les amb el Nomenclàtor abans que cap exportació les publique.
 */

const alies = (forma, { ambMajuscula = false, majusculaEn = 0 } = {}) => Object.freeze({ forma, ambMajuscula, majusculaEn });

/** Els àlies de cada poble, per l'id del poble (el de townsSeed.js o el de MUNICIPIS_DE_REFERENCIA). */
export const ALIES_DE_POBLES_SEED = Object.freeze({
  'la-torre-de-les-macanes': Object.freeze([alies('Torremanzanas'), alies('la Torre', { ambMajuscula: true, majusculaEn: 1 })]),
  xixona: Object.freeze([alies('Jijona')]),
  orxeta: Object.freeze([alies('Orcheta')]),
  alcoleja: Object.freeze([alies('Alcolecha')]),
  alcoi: Object.freeze([alies('Alcoy')]),
  alacant: Object.freeze([alies('Alicante')])
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
  municipi('valencia', 'València', 'València', 'València')
]);
