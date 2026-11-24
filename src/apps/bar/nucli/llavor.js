/**
 * El Bar · nucli/llavor.js — la carta, la sala i l'establiment d'EXEMPLE
 * (disseny del Bar §A.12). Tot és sintètic:
 *   · noms genèrics en valencià, sense cap marca;
 *   · preus rodons i inventats, tots amb `exemple: true` (la UI diu «preu
 *     d'exemple» fins que algú l'edita);
 *   · cap preu, cost, NIF, IBAN ni nom de persona reals.
 * Les onze categories són les de les carpetes de referència del Mestre
 * (amb «racions» en lloc de «zracions»); les fotos no es copien: cada
 * producte porta un marcador 1:1 fins que hi haja la definitiva.
 */
import { congela } from './comu.js';
import { DENOMINACIONS } from './torn.js';

export const ESTABLIMENT_EXEMPLE = congela({
  nom: 'El meu bar',
  slug: 'el-meu-bar',
  ivaPerDefecte: 10,
  denominacions: [...DENOMINACIONS]
});

const CATEGORIES = [
  ['cafeteria', 'Cafeteria', 'Coffee'],
  ['torrades', 'Torrades', 'Wheat'],
  ['entrepans', 'Entrepans', 'Sandwich'],
  ['tapes', 'Tapes', 'Utensils'],
  ['racions', 'Racions', 'Soup'],
  ['plats-combinats', 'Plats combinats', 'UtensilsCrossed'],
  ['postres', 'Postres', 'IceCreamCone'],
  ['refrescs', 'Refrescs', 'CupSoda'],
  ['cerveseria', 'Cerveseria', 'Beer'],
  ['vins-i-caves', 'Vins i caves', 'Wine'],
  ['licoreria', 'Licoreria', 'Martini']
].map(([id, nom, icona], ordre) => ({ id, nom, icona, ordre, visible: true }));

const GRUPS = [
  { id: 'llet', nom: 'Llet', min: 0, max: 1, opcions: [
    { id: 'normal', nom: 'Llet normal', deltaCents: 0 },
    { id: 'sense-lactosa', nom: 'Sense lactosa', deltaCents: 0 },
    { id: 'vegetal', nom: 'Beguda vegetal', deltaCents: 20 }
  ] },
  { id: 'licor-carajillo', nom: 'Licor', min: 1, max: 1, opcions: [
    { id: 'anis', nom: 'Anís', deltaCents: 0 },
    { id: 'conyac', nom: 'Conyac', deltaCents: 0 },
    { id: 'rom', nom: 'Rom', deltaCents: 0 }
  ] },
  { id: 'pa-torrada', nom: 'Pa', min: 1, max: 1, opcions: [
    { id: 'normal', nom: 'Pa de pagès', deltaCents: 0 },
    { id: 'sense-gluten', nom: 'Pa sense gluten', deltaCents: 50 }
  ] },
  { id: 'pa-entrepa', nom: 'Pa', min: 1, max: 1, opcions: [
    { id: 'barra', nom: 'Pa de barra', deltaCents: 0 },
    { id: 'llesca', nom: 'Pa de llesca', deltaCents: 0 },
    { id: 'sense-gluten', nom: 'Pa sense gluten', deltaCents: 50 }
  ] }
];


/* Són composicions d'exemple, no fitxes d'un proveïdor ni d'una cuina real.
   Una dada pendent es conserva desconeguda: una llista buida no diu «sense».
   Classificació: Reglament (UE) 1169/2011, Annex II; dossier R32.51. */
const NOTES_ALERGENS = {
  'cafe-sol': 'Cafè sol; sense dades del proveïdor ni de la preparació.',
  tallat: 'Base de cafè i llet: llet declarada; altres components pendents.',
  'cafe-llet': 'Base de cafè i llet: llet declarada. Sense lactosa continua sent llet; la beguda vegetal requerix etiqueta pròpia.',
  carajillo: 'Cafè amb anís, conyac o rom, etiqueta pendent. Exempció del destil·lat limitada: no cobrix crema, ametla, sulfits ni altres afegits; cap absència certificada.',
  infusio: 'Planta o mescla d’infusió desconeguda: cal identificar-la i revisar l’envàs.',
  xocolata: 'Base de xocolata calenta amb llet; preparat de cacau i possibles altres components o traces pendents d’etiqueta.',
  'torrada-tomaca': 'Base de pa de blat i tomaca: gluten. Opció de pa sense gluten pendent de producte i preparació; no es certifica absència.',
  'torrada-formatge': 'Base de pa de blat i formatge: gluten i llet. Pa alternatiu i preparació pendents.',
  'entrepa-truita': 'Base de pa de blat i truita amb ou: gluten i ous; altres components i preparació pendents.',
  'entrepa-llom': 'Base de pa de blat i llom: gluten; adob, salses i preparació pendents.',
  'entrepa-vegetal': 'Base d’exemple de pa de blat i maionesa amb ou: gluten i ous. El nom vegetal no acredita composició del farcit ni absència de peix o altres grups.',
  olives: 'Olives de preparació desconeguda: salmorra, farcit i possibles sulfits pendents d’etiqueta.',
  'patates-picants': 'Creïlles amb salsa picant de formulació desconeguda. Salsa, espessidors i ús de fregidora pendents de revisió; al·lèrgens i traces desconeguts, sense traces inventades.',
  calamars: 'Base de calamars arrebossats amb blat: mol·luscs i gluten; arrebossat complet i fregidora pendents.',
  croquetes: 'Base d’exemple amb blat, llet i ou: gluten, llet i ous; farcit i fregidora pendents.',
  'plat-del-dia': 'Plat del dia de composició oberta: recepta, ingredients i preparació desconeguts.',
  flam: 'Base d’exemple de flam amb ou i llet: ous i llet; altres components pendents.',
  fruita: 'Fruita del temps sense espècie ni preparació confirmades: dades pendents.',
  aigua: 'Aigua de producte i servei sense fitxa confirmada: dades pendents.',
  'refresc-cola': 'Refresc de cola sense marca ni etiqueta confirmada: components i traces pendents.',
  'refresc-taronja': 'Refresc de taronja sense marca ni etiqueta confirmada: components i traces pendents.',
  suc: 'Suc de fruita sense marca ni etiqueta confirmada: composició i possibles sulfits pendents.',
  'cervesa-barril': 'Cervesa d’exemple elaborada amb cereal amb gluten; formulació i servei pendents.',
  'cervesa-ampolla': 'Cervesa d’exemple elaborada amb cereal amb gluten; etiqueta concreta pendent.',
  'cervesa-sense': 'Cervesa sense alcohol d’exemple amb cereal amb gluten; sense alcohol no vol dir sense gluten.',
  'vi-negre': 'Vi negre d’exemple amb sulfits declarats per damunt del llindar de l’Annex II.12; etiqueta real pendent.',
  'vi-blanc': 'Vi blanc d’exemple amb sulfits declarats per damunt del llindar de l’Annex II.12; etiqueta real pendent.',
  cava: 'Cava d’exemple amb sulfits declarats per damunt del llindar de l’Annex II.12; etiqueta real pendent.',
  'ginebra-tonica': 'Ginebra i tònica de marques desconegudes. L’exempció del destil·lat no certifica la mescla ni els components afegits.',
  'licor-herbes': 'Licor d’herbes de formulació desconeguda: crema, ametla, sulfits i altres afegits requerixen etiqueta; cap absència deduïda de l’alcohol.',
  varis: 'Producte de preu obert sense identitat alimentària: composició desconeguda.',
  'pa-barra': 'Base d’exemple de pa de blat: gluten; altres ingredients i traces de forn pendents de proveïdor.',
  ous: 'Ous de gallina de l’exemple: ous; subministrament i preparació pendents.',
  oli: 'Oli d’oliva de l’exemple; fitxa del proveïdor i preparació pendents.',
  creilles: 'Creïlles de l’exemple; subministrament i preparació pendents.',
  'cafe-gra': 'Cafè en gra de l’exemple; fitxa del proveïdor i preparació pendents.',
  llet: 'Llet de l’exemple: llet; subministrament i preparació pendents.'
};
function declaracioAlergens(id, alergens) {
  return {
    fontAlergens: `Reglament (UE) 1169/2011, Annex II; llavor sintètica d’exemple. ${NOTES_ALERGENS[id]}`,
    abastAlergens: 'composició base sintètica; sense certificació del proveïdor, variants, modificadors ni preparació real',
    alergens: [...alergens],
    tracesAlergens: [],
    alergensAbsents: []
  };
}

let ordre = 0;
/* Un producte d'exemple: variants [[id, nom, preu, cost?]]. */
function producte(id, nom, categoriaId, variants, extra = {}) {
  ordre += 1;
  return {
    id,
    nom,
    categoriaId,
    variants: variants.map(([vid, vnom, preuCents, costCents]) => ({
      id: vid, nom: vnom, preuCents, ...(costCents !== undefined ? { costCents } : {})
    })),
    grupsModificadors: [],
    alergens: [],
    imatge: { slug: `${categoriaId}-${id}`, estat: 'marcador' },
    reposaNevera: false,
    desti: 'barra',
    preuObert: false,
    actiu: true,
    ordre,
    exemple: true,
    ...extra,
    ...declaracioAlergens(id, extra.alergens || [])
  };
}

const PRODUCTES = [
  producte('cafe-sol', 'Cafè sol', 'cafeteria', [['tassa', 'Tassa', 120, 20]]),
  producte('tallat', 'Tallat', 'cafeteria', [['tassa', 'Tassa', 130, 25]], { alergens: ['llet'] }),
  producte('cafe-llet', 'Cafè amb llet', 'cafeteria', [['tassa', 'Tassa', 150], ['got', 'Got', 170]], { grupsModificadors: ['llet'], alergens: ['llet'] }),
  producte('carajillo', 'Carajillo', 'cafeteria', [['tassa', 'Tassa', 180]], { grupsModificadors: ['licor-carajillo'] }),
  producte('infusio', 'Infusió', 'cafeteria', [['tassa', 'Tassa', 130]]),
  producte('xocolata', 'Xocolata calenta', 'cafeteria', [['tassa', 'Tassa', 200]], { alergens: ['llet'] }),
  producte('torrada-tomaca', 'Torrada amb tomaca', 'torrades', [['racio', 'Ració', 250]], { grupsModificadors: ['pa-torrada'], alergens: ['gluten'], desti: 'cuina' }),
  producte('torrada-formatge', 'Torrada amb formatge', 'torrades', [['racio', 'Ració', 300]], { grupsModificadors: ['pa-torrada'], alergens: ['gluten', 'llet'], desti: 'cuina' }),
  producte('entrepa-truita', 'Entrepà de truita', 'entrepans', [['unitat', 'Unitat', 400]], { grupsModificadors: ['pa-entrepa'], alergens: ['gluten', 'ous'], desti: 'cuina' }),
  producte('entrepa-llom', 'Entrepà de llom', 'entrepans', [['unitat', 'Unitat', 450]], { grupsModificadors: ['pa-entrepa'], alergens: ['gluten'], desti: 'cuina' }),
  producte('entrepa-vegetal', 'Entrepà vegetal', 'entrepans', [['unitat', 'Unitat', 400]], { grupsModificadors: ['pa-entrepa'], alergens: ['gluten', 'ous'], desti: 'cuina' }),
  producte('olives', 'Olives', 'tapes', [['tapa', 'Tapa', 200]]),
  producte('patates-picants', 'Patates picants', 'tapes', [['tapa', 'Tapa', 400]], { desti: 'cuina' }),
  producte('calamars', 'Calamars', 'racions', [['racio', 'Ració', 900]], { alergens: ['molluscs', 'gluten'], desti: 'cuina' }),
  producte('croquetes', 'Croquetes', 'racions', [['racio', 'Ració', 700]], { alergens: ['gluten', 'llet', 'ous'], desti: 'cuina' }),
  producte('plat-del-dia', 'Plat combinat del dia', 'plats-combinats', [['plat', 'Plat', 1000]], { desti: 'cuina' }),
  producte('flam', 'Flam', 'postres', [['unitat', 'Unitat', 300]], { alergens: ['ous', 'llet'] }),
  producte('fruita', 'Fruita del temps', 'postres', [['unitat', 'Unitat', 250]]),
  producte('aigua', 'Aigua', 'refrescs', [['mitjana', 'Mitjana', 100, 30], ['gran', 'Gran', 180, 50]], { reposaNevera: true }),
  producte('refresc-cola', 'Refresc de cola', 'refrescs', [['llanda', 'Llanda', 200, 60]], { reposaNevera: true }),
  producte('refresc-taronja', 'Refresc de taronja', 'refrescs', [['llanda', 'Llanda', 200, 60]], { reposaNevera: true }),
  producte('suc', 'Suc de fruita', 'refrescs', [['botelleta', 'Botelleta', 220, 70]], { reposaNevera: true }),
  producte('cervesa-barril', 'Cervesa de barril', 'cerveseria', [['canya', 'Canya', 180], ['gerra', 'Gerra', 300]], { alergens: ['gluten'] }),
  producte('cervesa-ampolla', 'Cervesa en ampolla', 'cerveseria', [['ampolla', 'Ampolla', 220, 70]], { alergens: ['gluten'], reposaNevera: true }),
  producte('cervesa-sense', 'Cervesa sense alcohol', 'cerveseria', [['ampolla', 'Ampolla', 220, 70]], { alergens: ['gluten'], reposaNevera: true }),
  producte('vi-negre', 'Vi negre', 'vins-i-caves', [['got', 'Got', 200], ['ampolla', 'Ampolla', 1200]], { alergens: ['sulfits'] }),
  producte('vi-blanc', 'Vi blanc', 'vins-i-caves', [['got', 'Got', 200], ['ampolla', 'Ampolla', 1200]], { alergens: ['sulfits'], reposaNevera: true }),
  producte('cava', 'Cava', 'vins-i-caves', [['copa', 'Copa', 300]], { alergens: ['sulfits'] }),
  producte('ginebra-tonica', 'Ginebra amb tònica', 'licoreria', [['got', 'Got', 700]]),
  producte('licor-herbes', 'Licor d’herbes', 'licoreria', [['got', 'Got', 250]]),
  producte('varis', 'Varis', 'licoreria', [['unitat', 'Unitat', 0]], { preuObert: true })
];

const INGREDIENTS = [
  { id: 'pa-barra', nom: 'Pa de barra', unitatBase: 'u', formatCompra: { quantitat: 1, preuCents: 60 }, minvaPercent: 0, alergens: ['gluten'] },
  { id: 'ous', nom: 'Ous', unitatBase: 'u', formatCompra: { quantitat: 12, preuCents: 300 }, minvaPercent: 0, alergens: ['ous'] },
  { id: 'oli', nom: 'Oli d’oliva', unitatBase: 'ml', formatCompra: { quantitat: 1000, preuCents: 600 }, minvaPercent: 0, alergens: [] },
  { id: 'creilles', nom: 'Creïlles', unitatBase: 'g', formatCompra: { quantitat: 5000, preuCents: 500 }, minvaPercent: 20, alergens: [] },
  { id: 'cafe-gra', nom: 'Cafè en gra', unitatBase: 'g', formatCompra: { quantitat: 1000, preuCents: 1800 }, minvaPercent: 0, alergens: [] },
  { id: 'llet', nom: 'Llet', unitatBase: 'ml', formatCompra: { quantitat: 1000, preuCents: 100 }, minvaPercent: 0, alergens: ['llet'] }
].map((ingredient) => ({ ...ingredient, ...declaracioAlergens(ingredient.id, ingredient.alergens) }));

const ESCANDALLS = [
  { id: 'entrepa-truita', producteId: 'entrepa-truita', racions: 1, altresCostosCents: 10, objectiuFoodCostPercent: 30,
    ingredients: [{ ingredientId: 'pa-barra', quantitat: 1 }, { ingredientId: 'ous', quantitat: 2 }, { ingredientId: 'oli', quantitat: 20 }, { ingredientId: 'creilles', quantitat: 150 }] },
  { id: 'cafe-llet', producteId: 'cafe-llet', varianteId: 'tassa', racions: 1, altresCostosCents: 2, objectiuFoodCostPercent: 25,
    ingredients: [{ ingredientId: 'cafe-gra', quantitat: 8 }, { ingredientId: 'llet', quantitat: 120 }] }
];

/** La carta d'exemple (una còpia nova cada vegada: l'app la pot editar). */
export function llavorCarta() {
  return structuredClone({ categories: CATEGORIES, grups: GRUPS, productes: PRODUCTES, ingredients: INGREDIENTS, escandalls: ESCANDALLS });
}

/** La sala d'exemple: Saló (6 taules) i Terrassa (4). La barra no és cap zona: és un origen. */
export function llavorSala() {
  const taules = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `t${i + 1}`, nom: `Taula ${i + 1}`, zonaId: 'salo', places: 4, posicio: { fila: Math.floor(i / 3) + 1, columna: (i % 3) + 1 } })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `terrassa-${i + 1}`, nom: `Terrassa ${i + 1}`, zonaId: 'terrassa', places: 2, posicio: { fila: 1, columna: i + 1 } }))
  ];
  return { zones: [{ id: 'salo', nom: 'Saló' }, { id: 'terrassa', nom: 'Terrassa' }], taules };
}
