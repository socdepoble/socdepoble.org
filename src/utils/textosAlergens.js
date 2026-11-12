/* Onada R15b (RV-02) · Els textos del panell d'al·lèrgens en les 5 llengües (DISSENY_PUNT4 §7). Mòdul a banda dels
   diccionaris globals (decisió D-P4-10): només el carrega qui pinta el panell, mai el tros d'arrencada. L'etiqueta
   obligatòria és el títol del panell: «Proposta assistida · Pendent de validació humana».
   La matriu editorial R17 descriu els ingredients declarats; el motor genèric conserva «? Sense dada». */
import { ALERGENS } from './productes/producteUniversal.js';

export const ESTAT_CANDIDATS_ALERGENS = 'pendent_validacio_humana';
export const LLENGUES_ALERGENS = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const T = (o) => Object.freeze(o);

export const TEXTOS_ALERGENS = Object.freeze({
  ca: T({
    etiqueta: 'Proposta assistida · Pendent de validació humana',
    ariaLabel: 'Proposta assistida d’al·lèrgens',
    llegenda: '• present per paraula inequívoca · T possible per derivat, ambigüitat, contaminació creuada habitual o esment a l’elaboració o a les notes · ? sense dada: no vol dir que no n’hi haja.',
    ingredient: '• Ingredient', traca: 'T Traça', desconegut: '? Sense dada',
    completa: 'Tots els ingredients són al lèxic. Només una persona pot declarar que un al·lergen no hi és.',
    parcial: 'Ingredients sense reconéixer o sense fitxa:',
    noMarcats: 'Els no marcats queden «? Sense dada».',
    senseIngredients: 'Proposta pel nom del producte, sense llista d’ingredients.',
    fontLiteral: 'Font literal de la proposta',
    escandall: 'Escandall pendent: ',
    on: T({ ingredient_literal: 'ingredients', elaboracio_literal: 'elaboració', nota_literal: 'nota', nom_comercial: 'nom del producte', referencia: 'recepta del llibre' }),
    noms: T({ gluten: 'Gluten', crustacis: 'Crustacis', ous: 'Ous', peix: 'Peix', cacauets: 'Cacauets', soja: 'Soja', llet: 'Llet',
      'fruits-closca': 'Fruits de closca', api: 'Api', mostassa: 'Mostassa', sesam: 'Sèsam', sulfits: 'Diòxid de sofre i sulfits',
      tramussos: 'Tramussos', molluscs: 'Mol·luscs' })
  }),
  es: T({
    etiqueta: 'Propuesta asistida · Pendiente de validación humana',
    ariaLabel: 'Propuesta asistida de alérgenos',
    llegenda: '• presente por palabra inequívoca · T posible por derivado, ambigüedad, contaminación cruzada habitual o mención en la elaboración o en las notas · ? sin datos: no significa que no haya.',
    ingredient: '• Ingrediente', traca: 'T Traza', desconegut: '? Sin datos',
    completa: 'Todos los ingredientes están en el léxico. Solo una persona puede declarar que un alérgeno no está.',
    parcial: 'Ingredientes sin reconocer o sin ficha:',
    noMarcats: 'Los no marcados quedan «? Sin datos».',
    senseIngredients: 'Propuesta por el nombre del producto, sin lista de ingredientes.',
    fontLiteral: 'Fuente literal de la propuesta',
    escandall: 'Escandallo pendiente: ',
    on: T({ ingredient_literal: 'ingredientes', elaboracio_literal: 'elaboración', nota_literal: 'nota', nom_comercial: 'nombre del producto', referencia: 'receta del libro' }),
    noms: T({ gluten: 'Gluten', crustacis: 'Crustáceos', ous: 'Huevos', peix: 'Pescado', cacauets: 'Cacahuetes', soja: 'Soja', llet: 'Leche',
      'fruits-closca': 'Frutos de cáscara', api: 'Apio', mostassa: 'Mostaza', sesam: 'Sésamo', sulfits: 'Dióxido de azufre y sulfitos',
      tramussos: 'Altramuces', molluscs: 'Moluscos' })
  }),
  en: T({
    etiqueta: 'Assisted proposal · Pending human validation',
    ariaLabel: 'Assisted allergen proposal',
    llegenda: '• present by an unambiguous word · T possible through a derivative, ambiguity, usual cross-contact or a mention in the method or the notes · ? no data: it does not mean there is none.',
    ingredient: '• Ingredient', traca: 'T Trace', desconegut: '? No data',
    completa: 'Every ingredient is in the lexicon. Only a person can declare that an allergen is not there.',
    parcial: 'Unrecognised ingredients or ingredients without a data sheet:',
    noMarcats: 'Unmarked allergens stay «? No data».',
    senseIngredients: 'Proposal from the product name, without an ingredient list.',
    fontLiteral: 'Literal source of the proposal',
    escandall: 'Costing pending: ',
    on: T({ ingredient_literal: 'ingredients', elaboracio_literal: 'method', nota_literal: 'note', nom_comercial: 'product name', referencia: 'recipe in the book' }),
    noms: T({ gluten: 'Gluten', crustacis: 'Crustaceans', ous: 'Eggs', peix: 'Fish', cacauets: 'Peanuts', soja: 'Soybeans', llet: 'Milk',
      'fruits-closca': 'Nuts', api: 'Celery', mostassa: 'Mustard', sesam: 'Sesame', sulfits: 'Sulphur dioxide and sulphites',
      tramussos: 'Lupin', molluscs: 'Molluscs' })
  }),
  eu: T({
    etiqueta: 'Proposamen lagundua · Giza balioztatzearen zain',
    ariaLabel: 'Alergenoen proposamen lagundua',
    llegenda: '• hitz argi batek adierazia · T posible: eratorria, anbiguoa, ohiko kutsadura gurutzatua edo prestaketan edo oharretan aipatua · ? daturik ez: ez du esan nahi ez dagoenik.',
    ingredient: '• Osagaia', traca: 'T Aztarna', desconegut: '? Daturik ez',
    completa: 'Osagai guztiak lexikoan daude. Pertsona batek bakarrik adieraz dezake alergeno bat ez dagoela.',
    parcial: 'Ezagutu gabeko edo fitxarik gabeko osagaiak:',
    noMarcats: 'Markatu gabeak «? Daturik ez» geratzen dira.',
    senseIngredients: 'Produktuaren izenetik egindako proposamena, osagaien zerrendarik gabe.',
    fontLiteral: 'Proposamenaren iturri literala',
    escandall: 'Kostu-azterketa zain: ',
    on: T({ ingredient_literal: 'osagaiak', elaboracio_literal: 'prestaketa', nota_literal: 'oharra', nom_comercial: 'produktuaren izena', referencia: 'liburuko errezeta' }),
    noms: T({ gluten: 'Glutena', crustacis: 'Krustazeoak', ous: 'Arrautzak', peix: 'Arraina', cacauets: 'Kakahueteak', soja: 'Soja', llet: 'Esnea',
      'fruits-closca': 'Fruitu lehorrak', api: 'Apioa', mostassa: 'Ziapea', sesam: 'Sesamoa', sulfits: 'Sufre dioxidoa eta sulfitoak',
      tramussos: 'Altramuzak', molluscs: 'Moluskuak' })
  }),
  gl: T({
    etiqueta: 'Proposta asistida · Pendente de validación humana',
    ariaLabel: 'Proposta asistida de alérxenos',
    llegenda: '• presente por palabra inequívoca · T posible por derivado, ambigüidade, contaminación cruzada habitual ou mención na elaboración ou nas notas · ? sen datos: non quere dicir que non haxa.',
    ingredient: '• Ingrediente', traca: 'T Traza', desconegut: '? Sen datos',
    completa: 'Todos os ingredientes están no léxico. Só unha persoa pode declarar que un alérxeno non está.',
    parcial: 'Ingredientes sen recoñecer ou sen ficha:',
    noMarcats: 'Os non marcados quedan «? Sen datos».',
    senseIngredients: 'Proposta polo nome do produto, sen lista de ingredientes.',
    fontLiteral: 'Fonte literal da proposta',
    escandall: 'Escandallo pendente: ',
    on: T({ ingredient_literal: 'ingredientes', elaboracio_literal: 'elaboración', nota_literal: 'nota', nom_comercial: 'nome do produto', referencia: 'receita do libro' }),
    noms: T({ gluten: 'Glute', crustacis: 'Crustáceos', ous: 'Ovos', peix: 'Peixe', cacauets: 'Cacahuetes', soja: 'Soia', llet: 'Leite',
      'fruits-closca': 'Froitos de casca', api: 'Apio', mostassa: 'Mostaza', sesam: 'Sésamo', sulfits: 'Dióxido de xofre e sulfitos',
      tramussos: 'Altramuces', molluscs: 'Moluscos' })
  })
});

export const SIMBOLS_ALERGENS = T({ ingredient: '•', traca: 'T', 'no-declarat': '—', desconegut: '?' });

export const TEXTOS_MATRIU_RECEPTARI = T({
  ca: T({
    ingredient: '• Conté', traca: 'T Pot contindre', 'no-declarat': '— No en porta segons el text',
    llegenda: 'La matriu es basa en els ingredients declarats al receptari tradicional i en les variants i els acompanyaments que hi consten. «T» indica que depén de la variant, el producte o l’etiqueta.',
    completa: 'Comprova sempre l’etiqueta de cada producte i el contacte creuat durant la preparació. El text del llibre no acredita la concentració de sulfits en el plat acabat.',
    motius: T({ pinyons: 'Els pinyons no són fruits de closca de l’annex II. La marca depén del contacte creuat indicat a l’etiqueta.', llegumSec: 'El llegum sec pot tindre grans de cereal pel cultiu o el processat compartit.',
      receptaDeNota: 'Apareix en una altra recepta de les notes d’esta fitxa.' })
  }),
  es: T({
    ingredient: '• Contiene', traca: 'T Puede contener', 'no-declarat': '— No lleva según el texto',
    llegenda: 'La matriz se basa en los ingredientes declarados en el recetario tradicional y en las variantes y acompañamientos que recoge. «T» indica que depende de la variante, el producto o la etiqueta.',
    completa: 'Comprueba siempre la etiqueta de cada producto y el contacto cruzado durante la preparación. El texto del libro no acredita la concentración de sulfitos en el plato final.',
    motius: T({ pinyons: 'Los piñones no son frutos de cáscara del anexo II. La marca depende de las trazas de la etiqueta.', llegumSec: 'La legumbre seca puede tener granos de cereal por el cultivo o el procesado compartido.',
      receptaDeNota: 'Aparece en otra receta de las notas de esta ficha.' })
  }),
  en: T({
    ingredient: '• Contains', traca: 'T May contain', 'no-declarat': '— Not in the recipe text',
    llegenda: 'The matrix is based on the declared ingredients in the traditional cookbook and on the variations and accompaniments it lists. “T” indicates that it depends on the variation, product or label.',
    completa: 'Always check each product label and for cross-contact during preparation. The cookbook does not establish the sulphite concentration in the finished dish.',
    motius: T({ pinyons: 'Pine nuts are outside the Annex II nut group. Check the label for cross-contact.', llegumSec: 'Dry legumes may pick up cereal grains from shared cultivation or processing.',
      receptaDeNota: 'It appears in another recipe in the notes of this card.' })
  }),
  eu: T({
    ingredient: '• Badauka', traca: 'T Izan dezake', 'no-declarat': '— Ez da errezetan ageri',
    llegenda: 'Matrizeak errezeta-liburu tradizionalean adierazitako osagaiak eta bertako aldaerak eta lagungarriak hartzen ditu kontuan. «T» aldaeraren, produktuaren edo etiketaren araberakoa da.',
    completa: 'Egiaztatu beti produktu bakoitzaren etiketa eta prestaketan gertatutako kontaktu gurutzatua. Liburuak ez du plater amaituaren sulfito-kontzentrazioa egiaztatzen.',
    motius: T({ pinyons: 'Pinaziak II. eranskineko fruitu lehorren taldetik kanpo daude. Marka etiketako aztarnen araberakoa da.', llegumSec: 'Lekale lehorrek zereal-aleak izan ditzakete, laborantza edo prozesamendua partekatzeagatik.',
      receptaDeNota: 'Fitxa honetako oharretako beste errezeta batean ageri da.' })
  }),
  gl: T({
    ingredient: '• Contén', traca: 'T Pode conter', 'no-declarat': '— Non leva segundo o texto',
    llegenda: 'A matriz baséase nos ingredientes declarados no receitario tradicional e nas variantes e acompañamentos que recolle. «T» indica que depende da variante, do produto ou da etiqueta.',
    completa: 'Comproba sempre a etiqueta de cada produto e o contacto cruzado durante a preparación. O texto do libro non acredita a concentración de sulfitos no prato final.',
    motius: T({ pinyons: 'Os piñóns non son froitos de casca do anexo II. A marca depende dos restos que indique a etiqueta.', llegumSec: 'O legume seco pode ter grans de cereal polo cultivo ou procesamento compartido.',
      receptaDeNota: 'Aparece noutra receita das notas desta ficha.' })
  })
});

/** El codi de llengua del panell ('es-ES' → 'es'); qualsevol altra cosa és el valencià. */
export function llenguaAlergens(llengua) {
  const codi = typeof llengua === 'string' ? llengua.toLowerCase().split(/[-_]/)[0] : 'ca';
  return Object.hasOwn(TEXTOS_ALERGENS, codi) ? codi : 'ca';
}

/** Els textos d'una llengua; qualsevol altra cosa torna el valencià. */
export function textosAlergens(llengua) {
  return TEXTOS_ALERGENS[llenguaAlergens(llengua)];
}

/** L'estat resumit d'una fila: • si una línia d'ingredients el delata, T si hi ha traça o indici, ? si no hi ha res.
 * Mai «absent»: l'absència només la pot declarar una persona amb font. */
export function estatResumAlergen(alergen) {
  if (alergen?.ingredient?.estat === 'candidat') return 'ingredient';
  if (alergen?.traca?.estat === 'candidat' || (Array.isArray(alergen?.indicis) && alergen.indicis.length > 0)) return 'traca';
  return 'desconegut';
}

/** La proposta vestida per a pintar-la: textos en la llengua demanada, les 14 files en l'ordre del Reglament i la
 * cobertura amb les línies pendents (literals del llibre, que el panell marca amb lang="ca"). */
export function vesteixCandidatsAlergens(proposta, llengua = 'ca') {
  const llenguaPanell = llenguaAlergens(llengua);
  const t = TEXTOS_ALERGENS[llenguaPanell];
  const matriu = proposta?.metode === 'matriu_receptari_r17' ? TEXTOS_MATRIU_RECEPTARI[llenguaPanell] : null;
  const perId = new Map((proposta?.alergens ?? []).map((alergen) => [alergen.id, alergen]));
  const files = ALERGENS.map((id) => {
    const alergen = perId.get(id) ?? null;
    const estat = matriu && alergen?.proposta === 'no-declarat' ? 'no-declarat' : estatResumAlergen(alergen);
    const evidencies = alergen
      ? [...(alergen.ingredient?.evidencies ?? []), ...(alergen.traca?.evidencies ?? []), ...(alergen.indicis ?? [])]
      : [];
    return { id, nom: t.noms[id], estat, simbol: SIMBOLS_ALERGENS[estat], text: matriu?.[estat] ?? t[estat],
      evidencies: evidencies.flatMap((e) => [
        { text: e.text, terme: e.terme, camp: e.camp, on: t.on[e.naturalesa] ?? e.camp, motiu: matriu?.motius[e.motiu] },
        ...(e.referencia?.text ? [{ text: e.referencia.text, camp: e.referencia.camp, on: t.on.referencia }] : [])
      ]) };
  });
  const cobertura = proposta?.cobertura === 'completa' ? 'completa'
    : proposta?.cobertura === 'sense-ingredients' ? 'sense-ingredients' : 'parcial';
  const pendents = [...new Set((proposta?.liniesPendents ?? []).map((linia) => linia.text))];
  return {
    llengua: llenguaPanell,
    etiqueta: t.etiqueta, ariaLabel: t.ariaLabel, llegenda: matriu?.llegenda ?? t.llegenda, fontLiteral: t.fontLiteral, escandall: t.escandall,
    cobertura, textCobertura: cobertura === 'completa' ? (matriu?.completa ?? t.completa) : cobertura === 'sense-ingredients' ? t.senseIngredients : t.parcial,
    pendents: cobertura === 'parcial' ? pendents : [], noMarcats: t.noMarcats, files
  };
}

/** Avís curt en valencià (compatibilitat: abans era el text de la nota del panell). */
export const AVIS_CANDIDATS_ALERGENS = `${TEXTOS_ALERGENS.ca.etiqueta}. ${TEXTOS_ALERGENS.ca.llegenda}`;
