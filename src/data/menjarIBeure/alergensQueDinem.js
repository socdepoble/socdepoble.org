/** Revisió editorial de «Què dinem?», 149 receptes. Cada marca apunta a una línia del PDF
 * transcrita a queDinem.js. Compten els acompanyaments i les variants de la mateixa fitxa.
 * Una altra recepta copiada a les notes (la fitxa pública la mostra) compta com a «T» amb el motiu
 * `receptaDeNota` (auditoria R18, P0): el panell no pot dir «—» d'un al·lergen que el text mostra.
 * La suite exigix que la matriu conserve cada senyal del lèxic, llevat de les excepcions declarades.
 * i = ingredients, p = preparació, n = notes, amb índexs de bloc i línia des de zero.
 * L'empremta detecta canvis en el literal revisat; la suite comprova també el SHA-256 del corpus.
 */
const GLUTEN = 'gluten';
const CRUSTACIS = 'crustacis';
const OUS = 'ous';
const PEIX = 'peix';
const CACAUETS = 'cacauets';
const SOJA = 'soja';
const LLET = 'llet';
const FRUITS_CLOSCA = 'fruits-closca';
const API = 'api';
const MOSTASSA = 'mostassa';
const SESAM = 'sesam';
const SULFITS = 'sulfits';
const MOLLUSCS = 'molluscs';

const conte = (camp, ...ids) => ({ camp, tipus: 'ingredient', ids });
const possible = (camp, ...ids) => ({ camp, tipus: 'traca', ids });
const referencia = (recepta, campReferit, marca) => ({ ...marca, recepta, campReferit });
const embotit = (camp) => possible(camp, GLUTEN, LLET, SOJA, SULFITS);
const cuixot = (camp) => possible(camp, LLET, SOJA);
const brou = (camp) => possible(camp, GLUTEN, API, LLET, SOJA);
const brouPeix = (camp) => [conte(camp, PEIX), possible(camp, CRUSTACIS, MOLLUSCS, API, GLUTEN, LLET, SOJA)];
const pa = (camp) => [conte(camp, GLUTEN), possible(camp, LLET, SESAM)];
const pasta = (camp) => [conte(camp, GLUTEN), possible(camp, OUS)];
const galeta = (camp) => [conte(camp, GLUTEN), possible(camp, OUS, LLET, SOJA, FRUITS_CLOSCA)];
const xocolate = (camp) => possible(camp, GLUTEN, LLET, SOJA, FRUITS_CLOSCA, CACAUETS);
// Els pinyons no figuren entre els fruits de closca de l'annex II del Reglament (UE) 1169/2011;
// només aporten una possibilitat si l'etiqueta del producte declara contacte creuat.
// https://eur-lex.europa.eu/eli/reg/2011/1169/2025-04-01/eng
const pinyons = (camp) => ({ ...possible(camp, FRUITS_CLOSCA), motiu: 'pinyons' });
// AESAN, «Presencia de gluten en lentejas» (rotació amb cereals i equips de recol·lecció compartits).
// https://www.aesan.gob.es/AECOSAN/docs/documentos/seguridad_alimentaria/gestion_riesgos/gluten_lentejas.pdf
const llegumSec = (camp) => ({ ...possible(camp, GLUTEN), motiu: 'llegumSec' });
// Una altra recepta copiada dins de les notes de la mateixa fitxa: la fitxa pública la mostra,
// i per això el panell no pot dir «—» d'un al·lergen que hi apareix. Es marca T amb el motiu.
const receptaDeNota = (camp, ...ids) => ({ ...possible(camp, ...ids), motiu: 'receptaDeNota' });

/** El comparador només detecta canvis de la transcripció editorial. */
export function empremtaRecepta(recepta) {
  const literal = JSON.stringify([recepta.slug, recepta.pagina, recepta.ingredients, recepta.preparacio, recepta.notes]);
  let empremta = 2166136261;
  for (let i = 0; i < literal.length; i++) {
    empremta = Math.imul(empremta ^ literal.charCodeAt(i), 16777619);
  }
  return (empremta >>> 0).toString(16).padStart(8, '0');
}

/* Un vi, un vinagre o un producte amb conservants aporta una possibilitat de sulfits.
 * La concentració en el plat acabat no es pot determinar del receptari.
 * Els pinyons i el coco no són fruits de closca de l'annex II. Les marques T es reserven
 * a composicions variables, opcions documentades i traces plausibles en productes envasats.
 */
export const ALERGENS_QUE_DINEM = {
  'pa-rustic': ['04182e4e', conte('i0.0', GLUTEN), receptaDeNota('n0', LLET, SESAM, SOJA, SULFITS)],
  'caragols-amb-tomaca': ['526bd451', conte('i0.0', MOLLUSCS)],
  'espigues-torrades': ['6d8033e7'],
  'dacsa-fregida': ['1ed8ca9c'],
  allioli: ['ac27c474', conte('i0.1', OUS)],
  'amanida-de-tomaca-all-i-tonyina': ['c2740034', conte('i0.2', PEIX), receptaDeNota('n0', MOSTASSA, SULFITS)],
  'conserva-de-tomaca': ['149f6f35', llegumSec('n0')],
  'aigua-sal': ['21366d5b', possible('n0', SULFITS)],
  'olives-blanquetes': ['79bc7ecd'],
  'olives-mancanelles-en-sosa': ['f335b023'],
  'olives-negretes-madures': ['9334e9bb'],
  'creilles-al-forn': ['96e2b2ff'],
  'aletes-i-cuixes-de-pollastre': ['6af1b3a5', possible('i0.1', SULFITS), possible('i0.3', SULFITS)],
  'esclata-sangs-torrats': ['a2533b70', receptaDeNota('n1', API)],
  'xampinyons-fregits-amb-allets': ['827c346e'],
  'rubiols-fregits-amb-allets': ['464916c1'],
  'cacaus-fregits': ['87e91ca6', conte('i0.0', CACAUETS), possible('n0', FRUITS_CLOSCA)],
  'cacaus-torrats': ['364a4aec', conte('i0.0', CACAUETS), possible('n0', FRUITS_CLOSCA)],
  'sang-amb-ceba': ['be381430'],
  'fetge-o-magre-fregit': ['83b8503c'],
  'mandonguilles-de-carn': ['98a7d956', pinyons('i0.1'), possible('n0', API)],
  'mandonguilles-de-bacalla': ['c023d02e', conte('i0.0', PEIX), conte('i0.5', OUS)],
  'mandonguilles-d-aladroc': ['2b5bc293', conte('i0.0', PEIX), conte('i0.5', OUS)],
  'costelles-de-vedella': ['27209634', possible('i0.1', API), possible('i0.3', API, MOSTASSA, SESAM)],
  'calamars-arrebossats': ['756dfacd', conte('i0.0', MOLLUSCS), conte('i0.1', GLUTEN)],
  'calamars-xicotets-arrebossats': ['d8c7d4ed', conte('i0.0', MOLLUSCS), conte('i0.1', GLUTEN)],
  'sepia-torrada': ['c31c14c3', conte('i0.0', MOLLUSCS)],
  'capella-torrat': ['4e5af365', conte('i0.0', PEIX)],
  pericana: ['d5b4e5ba', conte('i0.2', PEIX)],
  'tomaques-seques-fregides': ['60436a54', possible('i0.0', SULFITS), possible('p0.0', GLUTEN, LLET, SESAM)],
  'morro-fregit': ['3835c791'],
  'faves-bullides': ['dae5dfa6', llegumSec('i0.0')],
  'faves-fregides': ['a4493995'],
  'ventre-de-vedella': ['40ab7247', embotit('i0.5')],
  'ventre-de-corder': ['372eef90', embotit('i0.6')],
  anxoves: ['bf578249', conte('i0.0', PEIX), possible('i0.2', SULFITS)],
  'carxofes-fregides': ['0439bd48'],
  'clotxines-al-vapor': ['ae71c203', conte('i0.0', MOLLUSCS)],
  'petxines-fregides': ['a961803e', conte('i0.0', MOLLUSCS)],
  'peixet-fregit': ['7cf6fd2e', conte('i0.0', PEIX), conte('i0.1', GLUTEN)],
  'aladroc-fregit': ['0b96807a', conte('i0.0', PEIX), conte('i0.1', GLUTEN)],
  'aladroc-amb-vinagre': ['9682bb58', conte('i0.0', PEIX), possible('i0.2', SULFITS)],
  'cuixot-i-formatge': ['b2aa361c', cuixot('i0.0'), conte('i0.1', LLET)],
  'amanida-russa': ['74a123a2', conte('i0.1', OUS), possible('i0.2', API), possible('i0.4', PEIX), conte('i0.5', PEIX),
    possible('i0.6', MOSTASSA), possible('p0.0', GLUTEN, LLET, SESAM)],
  'rosquetes-de-pa-al-forn': ['05c4c992', ...pa('i0.0')],
  'formatge-blanquet': ['15ae0593', conte('i0.0', LLET)],
  'renyons-de-masero': ['494fe924'],
  'blat-picat': ['324b9e3e', conte('i0.0', GLUTEN)],
  'coca-de-batre': ['33de02ed', possible('i0.0', GLUTEN), possible('i0.2', PEIX)],
  'coca-de-tomaca': ['0df50e3b', conte('i0.0', GLUTEN)],
  'coca-de-farina': ['5b7a7d32', conte('i0.0', GLUTEN)],
  'arros-melos-de-peix': ['1804e902', conte('i0.1', MOLLUSCS), conte('i0.2', MOLLUSCS), conte('i0.3', PEIX), conte('i0.4', PEIX),
    ...brouPeix('i0.8'), conte('p0.0', CRUSTACIS), possible('p0.0', SULFITS)],
  'arros-al-forn': ['7629265d', embotit('i0.4'),
    referencia('olla-de-carn', 'i0.2', possible('n0', API)),
    referencia('olla-de-carn', 'i2.3', possible('n0', OUS)),
    referencia('olla-de-carn', 'i2.2', pinyons('n0'))],
  'arros-amb-conill': ['a99c14e7', receptaDeNota('n0', FRUITS_CLOSCA, GLUTEN, LLET, SESAM, SULFITS)],
  'arros-blanc': ['1ae6d9b0', possible('i0.5', OUS)],
  'arros-d-hivern': ['f29ed050', llegumSec('i0.1')],
  'arros-amb-ventre': ['b648e6e2', brou('i0.4'), possible('i0.4', PEIX, MOLLUSCS, CRUSTACIS), llegumSec('i0.5')],
  'arros-negre': ['ffb2b786', ...brouPeix('i0.1'), conte('i0.2', MOLLUSCS), conte('i0.4', MOLLUSCS), possible('p0.0', OUS)],
  'paella-de-floricol': ['06e576aa', ...brouPeix('i0.1'), conte('i0.2', PEIX)],
  'paella-de-carxofes-i-faves': ['0b44ce61', brou('i0.8')],
  fideua: ['f21ec375', conte('i0.0', MOLLUSCS), conte('i0.1', CRUSTACIS), possible('i0.1', SULFITS), conte('i0.2', MOLLUSCS),
    ...brouPeix('i0.5'), ...pasta('i0.7'), possible('p0.0', OUS)],
  'guisat-de-verdures-i-pollastre': ['b23edf89', possible('i0.2', API)],
  bullit: ['1c3f195b', possible('p0.0', SULFITS)],
  'escabetx-de-sardina': ['f90ef1ad', conte('i0.0', PEIX), possible('i0.6', SULFITS)],
  'canelons-de-pollastre': ['04690962', ...pasta('i0.5'), conte('i0.6', LLET)],
  'canelons-d-espinacs': ['7d6fa0e3', conte('i0.1', PEIX), conte('i0.2', GLUTEN, LLET), conte('i0.3', LLET), ...pasta('i0.6'), pinyons('i0.7')],
  'floricol-bullida': ['d427d987', possible('i0.2', SULFITS)],
  potatge: ['889e0428', llegumSec('i0.0'), cuixot('i0.1'), referencia('mandonguilles-de-carn', 'i0.1', pinyons('i0.3'))],
  'alberginies-al-forn': ['645b7a42'],
  'alberginies-farcides-al-forn': ['c36b121f', pinyons('i0.2'), conte('i0.5', PEIX), conte('i0.6', CRUSTACIS), possible('i0.6', SULFITS)],
  'alberginies-fregides': ['7c3c9f82', conte('i0.1', GLUTEN)],
  'alberginies-torrades': ['26ec766e'],
  'macarrons-amb-tomaca': ['0c7eae80', ...pasta('i0.0')],
  'bajoca-torrada': ['7da6e2e3'],
  'espencat-de-tomaca': ['e33b1436', conte('i0.4', PEIX)],
  'bajoques-farcides': ['7f7e5715'],
  llentilles: ['0133b6dd', llegumSec('i0.0'), cuixot('i0.1'), possible('i0.6', API)],
  borreta: ['21420bc8', conte('i0.3', OUS), conte('i0.9', PEIX)],
  'olla-de-carn': ['3b1b0b9d', conte('i0.2', API), llegumSec('i0.1'), possible('i0.11', GLUTEN, OUS),
    embotit('i1.4'), brou('i1.7'), pinyons('i2.2'), conte('i2.3', OUS)],
  'olleta-murera': ['f73b845f', embotit('i0.7'), brou('i0.12'), possible('i1.0', GLUTEN), conte('i1.1', OUS)],
  'llucets-passats-per-farina-i-fregits': ['326f97bc', conte('i0.0', PEIX), conte('i0.1', GLUTEN), receptaDeNota('n0', LLET)],
  'lluc-amb-gambes': ['67698535', conte('i0.0', PEIX), conte('i0.1', CRUSTACIS), possible('i0.1', SULFITS), possible('i0.6', SULFITS)],
  'conill-al-forn-amb-creilles': ['6ac1fe10', possible('p0.0', SULFITS), possible('n0', FRUITS_CLOSCA, LLET, API, GLUTEN, SOJA)],
  'carxofes-al-forn': ['9f68dd13'],
  'carxofes-torrades': ['10bdd465'],
  'carxofes-arrebossades': ['86341779', conte('i0.1', OUS), conte('i0.2', GLUTEN)],
  'carxofes-amb-gambes': ['4da19db5', conte('i0.4', CRUSTACIS), possible('i0.4', SULFITS), conte('i0.6', FRUITS_CLOSCA)],
  'ou-de-tomaca': ['31516ab4', conte('i0.2', OUS)],
  'fregit-de-tomaca-amb-conill': ['09ec0fb2', embotit('n0'), possible('n0', OUS, PEIX)],
  'fregit-de-tomaca-amb-bacallarets': ['0caeb8d6', conte('i0.2', GLUTEN), conte('i0.3', PEIX)],
  'bacallarets-fregits': ['3ac5fd44', conte('i0.0', PEIX), conte('i0.1', GLUTEN), possible('n0', OUS, LLET)],
  'fregit-de-tomaca-amb-llomellos-i-llonganisses': ['c724e5c3', embotit('i0.3')],
  'truita-de-creilla': ['f9ffd858', conte('i0.1', OUS), possible('n0', LLET, SOJA)],
  'bajoquins-al-forn': ['46de0e8c'],
  'mullador-de-vedella': ['1452d835', possible('i0.4', SULFITS)],
  'espinacs-passats-per-la-paella': ['c45173ea', pinyons('i0.2')],
  'polpets-amb-ceba-i-tomaca': ['99ec2bc1', conte('i0.0', MOLLUSCS), possible('i0.6', SULFITS)],
  'bajoques-al-chilindron': ['e2bee4c2', cuixot('i0.4')],
  'mero-torrat': ['96445701', conte('i0.0', PEIX)],
  'sopa-d-alls': ['46282b13', ...pa('i0.1'), cuixot('i0.2'), conte('i0.4', OUS), receptaDeNota('n0', API, GLUTEN, LLET, SOJA, SULFITS)],
  'mullador-de-pesols-amb-conill': ['88e2be6a', conte('i0.4', FRUITS_CLOSCA), conte('i0.5', OUS)],
  mongetes: ['e0394b36', llegumSec('i0.0')],
  'fesols-estofats': ['96762702', conte('i0.2', API), embotit('i0.3'), cuixot('i0.4'),
    referencia('olleta-murera', 'i1.0', possible('i0.6', GLUTEN)),
    referencia('olleta-murera', 'i1.1', conte('i0.6', OUS)), brou('i0.9')],
  'ous-farcits': ['7cc9cb71', conte('i0.0', OUS), conte('i0.3', PEIX), possible('i0.4', SULFITS), possible('i0.5', MOSTASSA)],
  sopetes: ['77fa2cb5', ...pa('i0.0'), conte('i0.2', LLET)],
  'roses-amb-mel': ['81f8e1cc'],
  'figues-seques': ['5e85cc86', conte('i0.2', GLUTEN), possible('i0.0', SULFITS), possible('p0.0', FRUITS_CLOSCA)],
  'dolc-de-tomaca': ['9dc32a36'],
  codonyat: ['91c8f345'],
  'mones-de-pasqua': ['6c9e324c', conte('i0.0', GLUTEN), conte('i0.4', OUS), conte('i0.7', LLET)],
  'rosquetes-de-pa': ['9008ec10', ...pa('i0.0'), conte('i0.1', LLET), conte('i0.2', OUS)],
  'carabassa-al-forn': ['b8454353'],
  'bunyols-de-carabassa': ['2057b33c', conte('i0.1', GLUTEN)],
  'bunyols-de-vent-o-de-pessic': ['bdd446d7', conte('i0.0', GLUTEN), possible('i0.1', GLUTEN), conte('i0.2', LLET), conte('i0.3', OUS)],
  'cocotets-de-tomaca-o-de-verdura': ['4f451f31', possible('i0.0', LLET), possible('i0.1', GLUTEN, SULFITS), conte('i0.3', GLUTEN),
    possible('i1.2', PEIX), possible('i2.2', SULFITS), conte('i2.5', GLUTEN), pinyons('i3.2'), conte('p3.0', OUS)],
  'crema-per-a-farcir': ['5ff8c04f', conte('i0.0', OUS), conte('i0.3', LLET), possible('i0.4', GLUTEN), possible('n0', FRUITS_CLOSCA)],
  'pastissos-de-fullada': ['63561b6b', conte('i0.0', GLUTEN), possible('i0.0', LLET, OUS),
    referencia('crema-per-a-farcir', 'i0.0', possible('i0.1', OUS)),
    referencia('crema-per-a-farcir', 'i0.3', conte('i0.1', LLET)),
    referencia('crema-per-a-farcir', 'n0', possible('i0.1', FRUITS_CLOSCA))],
  'fabiola-de-coco': ['d435fd92', conte('i0.2', OUS), conte('i1.2', GLUTEN), possible('n0', FRUITS_CLOSCA)],
  'tortell-de-nous-i-ametles': ['9b958b03', conte('i0.0', OUS), conte('i0.1', GLUTEN), conte('i0.2', FRUITS_CLOSCA), conte('i0.3', FRUITS_CLOSCA),
    possible('i0.5', GLUTEN), possible('p0.0', LLET)],
  mantegades: ['27f62316', conte('i0.2', OUS), conte('i0.5', GLUTEN)],
  magdalenes: ['43e6b8ea', conte('i0.0', GLUTEN), conte('i0.2', OUS), conte('i0.5', LLET)],
  'bescuit-d-ametla': ['8cb272b5', conte('i0.0', OUS), conte('i0.2', LLET), possible('i0.3', LLET, OUS, FRUITS_CLOSCA, SULFITS),
    conte('i0.4', FRUITS_CLOSCA), conte('i0.5', FRUITS_CLOSCA), possible('i0.6', LLET, SOJA)],
  bambes: ['71d5412e', conte('i0.0', GLUTEN), conte('i0.1', OUS), conte('i0.2', LLET)],
  'flam-d-ametla': ['0af31bfd', conte('i0.0', OUS), conte('i0.2', LLET), conte('i0.3', FRUITS_CLOSCA), ...galeta('i0.4')],
  'carquinyols-de-bescuit': ['b457aa28', conte('i0.0', OUS), conte('i0.1', GLUTEN), conte('i0.3', FRUITS_CLOSCA)],
  'pastissos-de-nadal': ['f7ba673d', conte('i0.3', GLUTEN), conte('i0.4', OUS), conte('i0.5', OUS)],
  'pastissos-d-aire': ['12f167b7', conte('i0.0', FRUITS_CLOSCA), conte('i0.2', GLUTEN), conte('i0.3', OUS), conte('i0.4', OUS),
    conte('i0.5', GLUTEN), possible('i0.5', OUS, LLET)],
  carinyitos: ['4fb08a90', conte('i0.0', OUS), possible('i0.2', FRUITS_CLOSCA), possible('n0', FRUITS_CLOSCA)],
  'coca-de-nous': ['1b79d1aa', conte('i0.1', FRUITS_CLOSCA), conte('i0.2', FRUITS_CLOSCA), conte('i0.3', GLUTEN), conte('i0.4', OUS), possible('i0.5', LLET),
    possible('i0.6', GLUTEN), conte('i0.9', GLUTEN), possible('i0.9', OUS, LLET)],
  'coca-de-canonge': ['b5f57c4f', conte('i0.0', GLUTEN), conte('i0.2', OUS), conte('i0.6', LLET)],
  'coca-de-xocolate': ['7dcbd516', conte('i0.0', OUS), conte('i0.1', LLET), conte('i0.4', GLUTEN), xocolate('i0.5'), possible('i0.6', GLUTEN)],
  'coca-de-perellons': ['508713fc', conte('i0.0', OUS), conte('i0.1', GLUTEN), possible('i0.4', GLUTEN)],
  'coca-de-carabassa-de-tots-sants': ['71bb3d37', conte('i0.3', GLUTEN), conte('i0.5', OUS)],
  esparteros: ['96738cf0', conte('i0.0', OUS), conte('i0.2', GLUTEN), possible('i0.4', LLET)],
  'rollets-d-ou': ['4f304190', conte('i0.0', GLUTEN), conte('i0.3', OUS)],
  natilles: ['9cc5c5f6', ...galeta('i0.0'), conte('i0.1', LLET), possible('i0.2', GLUTEN, LLET, OUS)],
  'panellets-de-tots-sants': ['50f5c61e', conte('i0.0', FRUITS_CLOSCA), conte('i0.2', OUS), pinyons('i0.4'), xocolate('n0')],
  'arrop-i-talladetes': ['00946c07', possible('i0.0', SULFITS)],
  arnadi: ['4c66b151', conte('i0.5', FRUITS_CLOSCA), pinyons('i0.6')],
  'pastis-de-galetes': ['bb833ebe', possible('i0.3', GLUTEN, LLET, OUS), conte('i0.4', LLET), xocolate('i0.6'), ...galeta('i0.7')],
  'gelat-de-vainilla': ['7359effe', conte('i0.0', OUS), conte('i0.1', LLET)],
  xurros: ['1389dc22', conte('i0.0', GLUTEN)],
  'coquetes-fregides': ['a119d3fa', conte('i0.0', GLUTEN), possible('i0.3', GLUTEN)],
  'cafe-licor': ['67724727', conte('i0.3', GLUTEN)],
  'licor-de-salvia': ['8bfad300'],
  'vi-de-nous': ['e9745498', conte('i0.0', FRUITS_CLOSCA), possible('i0.1', SULFITS)],
  'vi-de-cirer': ['18ea3cbe', possible('i0.1', SULFITS)],
  patxaran: ['cc8e9bc5'],
  herbero: ['0d388718']
};
