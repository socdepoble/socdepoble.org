/**
 * La Nevera de Casa · el catàleg de base (dada pura i sintètica, en valencià).
 *
 * Catorze seccions, com les de La Compra de Bring!, i els articles de cada
 * casa: cap marca, cap preu, cap persona. Els ids són slugs fixos (viuen a la
 * URL: ?article=llet, ?categoria=fruita-verdura) i no comencen mai per «p-»,
 * que és el prefix dels articles propis.
 *
 * Les icones de cada secció són de la vista (vistes/categories.js): el nucli
 * no sap res de React.
 */

/** La secció on van els articles que crea la persona. */
export const ID_PROPIS = 'propis';

export const CATEGORIES = Object.freeze([
  { id: 'fruita-verdura', nom: 'Fruita i verdura' },
  { id: 'pa-pastissos', nom: 'Pa i pastissos' },
  { id: 'llet-formatge', nom: 'Llet i formatge' },
  { id: 'carn-peix', nom: 'Carn i peix' },
  { id: 'ingredients-especies', nom: 'Ingredients i espècies' },
  { id: 'congelats', nom: 'Congelats' },
  { id: 'cereals-pasta', nom: 'Cereals i pasta' },
  { id: 'picar-dolcos', nom: 'Picar i dolços' },
  { id: 'begudes', nom: 'Begudes' },
  { id: 'llar', nom: 'Casa' },
  { id: 'higiene-salut', nom: 'Higiene i salut' },
  { id: 'mascotes', nom: 'Mascotes' },
  { id: 'jardi', nom: 'Jardí' },
  { id: ID_PROPIS, nom: 'Articles propis' }
].map((categoria) => Object.freeze(categoria)));

/* [id, nom] per secció, en l'ordre en què es pinten dins de cada una. */
const PER_SECCIO = Object.freeze({
  'fruita-verdura': [
    ['tomaques', 'Tomaques'], ['creilles', 'Creïlles'], ['cebes', 'Cebes'], ['alls', 'Alls'], ['pomes', 'Pomes'],
    ['taronges', 'Taronges'], ['platans', 'Plàtans'], ['encisam', 'Encisam'], ['safanories', 'Safanòries'],
    ['pebrots', 'Pebrots'], ['carabasso', 'Carabassó'], ['llimes', 'Llimes'], ['maduixes', 'Maduixes']
  ],
  'pa-pastissos': [
    ['pa', 'Pa'], ['pa-de-motle', 'Pa de motle'], ['pa-integral', 'Pa integral'], ['magdalenes', 'Magdalenes'],
    ['rosquilletes', 'Rosquilletes'], ['coca-de-llanda', 'Coca de llanda'], ['ensaimades', 'Ensaïmades']
  ],
  'llet-formatge': [
    ['llet', 'Llet'], ['iogurts', 'Iogurts'], ['ous', 'Ous'], ['formatge-fresc', 'Formatge fresc'],
    ['formatge-curat', 'Formatge curat'], ['mantega', 'Mantega'], ['nata', 'Nata']
  ],
  'carn-peix': [
    ['pollastre', 'Pollastre'], ['carn-picada', 'Carn picada'], ['llom', 'Llom'], ['pernil', 'Pernil'],
    ['salsitxes', 'Salsitxes'], ['lluc', 'Lluç'], ['salmo', 'Salmó'], ['sepia', 'Sépia'], ['tonyina', 'Tonyina']
  ],
  'ingredients-especies': [
    ['oli-oliva', 'Oli d’oliva'], ['sal', 'Sal'], ['sucre', 'Sucre'], ['farina', 'Farina'], ['vinagre', 'Vinagre'],
    ['pebre', 'Pebre'], ['safra', 'Safrà'], ['tomaca-fregida', 'Tomaca fregida'], ['llevat', 'Llevat']
  ],
  congelats: [
    ['gelat', 'Gelat'], ['pesols-congelats', 'Pésols congelats'], ['verdura-congelada', 'Verdura congelada'],
    ['pizza', 'Pizza'], ['croquetes', 'Croquetes'], ['gel', 'Gel']
  ],
  'cereals-pasta': [
    ['arros', 'Arròs'], ['macarrons', 'Macarrons'], ['espaguetis', 'Espaguetis'], ['fideus', 'Fideus'],
    ['cigrons', 'Cigrons'], ['llentilles', 'Llentilles'], ['fesols', 'Fesols'], ['cereals', 'Cereals']
  ],
  'picar-dolcos': [
    ['xocolate', 'Xocolate'], ['galetes', 'Galetes'], ['creilles-bossa', 'Creïlles de bossa'], ['olives', 'Olives'],
    ['ametles', 'Ametles'], ['cacaus', 'Cacaus'], ['caramels', 'Caramels']
  ],
  begudes: [
    ['aigua', 'Aigua'], ['suc-taronja', 'Suc de taronja'], ['cervesa', 'Cervesa'], ['vi', 'Vi'],
    ['refrescos', 'Refrescos'], ['cafe', 'Cafè'], ['infusions', 'Infusions'], ['orxata', 'Orxata']
  ],
  llar: [
    ['paper-higienic', 'Paper higiènic'], ['paper-cuina', 'Paper de cuina'], ['detergent', 'Detergent de roba'],
    ['sabo-plats', 'Sabó de rentar plats'], ['lleixiu', 'Lleixiu'], ['bosses-fem', 'Bosses del fem'],
    ['paper-alumini', 'Paper d’alumini'], ['esponges', 'Esponges'], ['tovallons', 'Tovallons de paper']
  ],
  'higiene-salut': [
    ['gel-dutxa', 'Gel de dutxa'], ['xampu', 'Xampú'], ['pasta-dents', 'Pasta de dents'], ['desodorant', 'Desodorant'],
    ['compreses', 'Compreses'], ['tiretes', 'Tiretes'], ['mocadors', 'Mocadors de paper']
  ],
  mascotes: [
    ['pinso-gos', 'Pinso de gos'], ['pinso-gat', 'Pinso de gat'], ['llaminadures-gat', 'Llaminadures per a gats'],
    ['arena-gat', 'Arena del gat']
  ],
  jardi: [
    ['adob', 'Adob'], ['terra-testos', 'Terra per a testos'], ['llavors', 'Llavors'], ['cordell', 'Cordell']
  ]
});

/** Els articles de base: { id, nom, categoriaId }, congelats i en l'ordre de les seccions. */
export const ARTICLES_BASE = Object.freeze(CATEGORIES.flatMap((categoria) => (PER_SECCIO[categoria.id] || [])
  .map(([id, nom]) => Object.freeze({ id, nom, categoriaId: categoria.id }))));
