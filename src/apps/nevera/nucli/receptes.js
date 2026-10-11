/**
 * La Nevera de Casa · el RECEPTARI de llavor (dada pura).
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6) · Plats de casa i de mas,
 * d'ingredients senzills, perquè el Rebost puga dir què es pot cuinar amb el
 * que hi ha. Són DADES, no codi: el recomanador (recomanador.js) no en sap cap
 * de memòria.
 *
 *   recepta { id, nom, resum, racions, ingredients }
 *     id           slug fix (viu a la URL: ?article=<id>)
 *     resum        què és el plat, en una línia i sense punt final (és el
 *                  subtítol de la targeta)
 *     racions      per a quantes persones són les quantitats
 *     ingredients  [{ id, quantitat, opcional, o }]
 *       id         un ingredient de la taula (ingredients.js)
 *       quantitat  text curt i APROXIMAT («400 g», «un raig»)
 *       opcional   false: sense ell el plat no ix; true: «si en tens»
 *       o          ingredients que el poden substituir («penques o bledes»)
 *
 * ORIENTATIU i pendent de la revisió del Mestre: cada casa fa l'olla a la seua
 * manera. Sense passos de preparació, sense cap afirmació de salut i sense
 * al·lèrgens (la Nevera no en porta cap taxonomia: no se n'inventa cap).
 */

export const RACIONS_PER_DEFECTE = 4;

const cal = (id, quantitat, o = []) => Object.freeze({ id, quantitat, opcional: false, o: Object.freeze([...o]) });
const siVols = (id, quantitat, o = []) => Object.freeze({ id, quantitat, opcional: true, o: Object.freeze([...o]) });
const recepta = (id, nom, resum, ingredients) => Object.freeze({
  id, nom, resum, racions: RACIONS_PER_DEFECTE, ingredients: Object.freeze(ingredients)
});

/** El receptari, congelat i en l'ordre en què es proposa a igualtat de tot. */
export const RECEPTES = Object.freeze([
  recepta('pa-amb-tomaca', 'Pa amb tomaca', 'Llesques de pa fregades amb tomaca madura i un raig d’oli', [
    cal('pa', '4 llesques'), cal('tomaca', '2 de madures'), cal('oli', 'un raig'),
    siVols('sal', 'un pessic'), siVols('all', '1 gra')
  ]),
  recepta('ous-amb-tomaca', 'Ous amb tomaca', 'Tomaca sofregida a foc lent amb els ous quallats damunt', [
    cal('ou', '4'), cal('tomaca', '800 g'), cal('oli', 'un raig'),
    siVols('ceba', '1'), siVols('all', '2 grans'), siVols('sal', 'un pessic')
  ]),
  recepta('truita-de-creilla', 'Truita de creïlla', 'Creïlla fregida a poc a poc i quallada amb ou', [
    cal('creilla', '600 g'), cal('ou', '6'), cal('oli', 'per a fregir'),
    siVols('ceba', '1'), siVols('sal', 'un pessic')
  ]),
  recepta('bullit', 'Bullit', 'Creïlla, bajoca i ceba bullides, amanides amb oli', [
    cal('creilla', '4'), cal('bajoca', '400 g'), cal('ceba', '2'),
    siVols('safanoria', '2'), siVols('oli', 'un raig'), siVols('sal', 'un pessic')
  ]),
  recepta('pisto', 'Pisto', 'Verdures de l’horta sofregides a foc lent', [
    cal('tomaca', '1 kg'), cal('pebrot', '2'), cal('carabasso', '1'), cal('ceba', '1'), cal('oli', 'un bon raig'),
    siVols('alberginia', '1'), siVols('all', '2 grans'), siVols('sal', 'un pessic')
  ]),
  recepta('espencat', 'Espencat', 'Albergínia i pebrot torrats, esfilagarsats i amanits amb oli', [
    cal('alberginia', '2'), cal('pebrot', '3'), cal('oli', 'un bon raig'),
    siVols('all', '1 gra'), siVols('bacalla', '100 g, esmollat'), siVols('sal', 'un pessic')
  ]),
  recepta('sopa-d-all', 'Sopa d’all', 'Pa dur, all i pebre roig, bullits en un caldo senzill', [
    cal('all', '6 grans'), cal('pa', '200 g, del dia d’abans'), cal('oli', 'un raig'),
    siVols('ou', '4'), siVols('pebre-roig', 'una cullerada'), siVols('sal', 'un pessic')
  ]),
  recepta('allioli', 'Allioli', 'All i oli lligats al morter', [
    cal('all', '2 grans'), cal('oli', '200 ml'),
    siVols('sal', 'un pessic')
  ]),
  recepta('llentilles', 'Llentilles amb verdura', 'Llentilles guisades amb les verdures del rebost', [
    cal('llentilla', '350 g'), cal('ceba', '1'), cal('safanoria', '2'), cal('creilla', '2'),
    siVols('all', '2 grans'), siVols('tomaca', '1'), siVols('pebrot', '1'), siVols('oli', 'un raig'),
    siVols('pebre-roig', 'una culleradeta'), siVols('sal', 'un pessic')
  ]),
  recepta('olla', 'Olla de cigrons i verdura', 'Cigrons bullits amb verdura d’hivern i, si n’hi ha, carn de porc', [
    cal('cigro', '300 g'), cal('creilla', '2'), cal('nap', '1'), cal('penca', '3', ['bleda']),
    siVols('safanoria', '2'), siVols('costella', '300 g'), siVols('botifarra', '2'), siVols('cansalada', '100 g'),
    siVols('safra', 'uns brins'), siVols('sal', 'un pessic')
  ]),
  recepta('arros-amb-fesols-i-naps', 'Arròs amb fesols i naps', 'Arròs caldós amb fesols, naps i carn de porc', [
    cal('arros', '300 g'), cal('fesol', '250 g'), cal('nap', '2'), cal('costella', '300 g'),
    siVols('botifarra', '2'), siVols('penca', '2'), siVols('safra', 'uns brins'), siVols('sal', 'un pessic')
  ]),
  recepta('arros-al-forn', 'Arròs al forn', 'Arròs de cassola al forn amb cigrons, costella i botifarra', [
    cal('arros', '400 g'), cal('cigro', '200 g, cuits'), cal('costella', '300 g'), cal('botifarra', '4'),
    cal('creilla', '1 de gran'), cal('tomaca', '2'), cal('all', '1 cabeça'),
    siVols('cansalada', '100 g'), siVols('safra', 'uns brins'), siVols('pebre-roig', 'una culleradeta'),
    siVols('oli', 'un raig'), siVols('sal', 'un pessic')
  ]),
  recepta('coca-de-tomaca-i-pebrera', 'Coca de tomaca i pebrera', 'Coca de forn amb un sofregit de tomaca i pebrera damunt', [
    cal('farina', '400 g'), cal('oli', '100 ml'), cal('tomaca', '500 g'), cal('pebrot', '2'),
    siVols('ceba', '1'), siVols('llevat', '10 g'), siVols('tonyina', '1 llanda'), siVols('sal', 'un pessic')
  ]),
  recepta('coca-en-tonyina', 'Coca en tonyina', 'Coca tapada, farcida de ceba, tonyina i pinyons', [
    cal('farina', '500 g'), cal('oli', '150 ml'), cal('ceba', '1 kg'), cal('tonyina', '250 g'),
    siVols('pinyo', '50 g'), siVols('pebre-roig', 'una culleradeta'), siVols('sal', 'un pessic')
  ])
]);

const PER_ID = new Map(RECEPTES.map((r) => [r.id, r]));

/** La recepta amb este id, o null. */
export function receptaPerId(id) {
  return PER_ID.get(id) || null;
}
