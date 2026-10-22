/**
 * Captura de llista Bring! → llista local nova, sense efectes laterals.
 * Forma observada estàticament en BringListsDataService.getUserListItems
 * del main.bundle.js públic (SHA-256 66e39300c100ae14709eeb1c935dd806481533219c201f57b0dd94ba87e5af3b):
 * uuid, purchase/recently [{ name, specification }]. No és una API pública
 * garantida ni una captura autenticada. No hi ha sincronització ni membres.
 *
 * Gauntlet 261022_0225 (crítica Claude): `name` no és el nom que es veu, és
 * la clau del catàleg de Bring!, en alemany («Milch», «WC-Papier»). El client
 * la traduïx amb BringTranslation.translate i ./locale/articles.<idioma>.json,
 * l'idioma de la llista (listArticleLanguage); una clau que no hi és, és un
 * article propi de Bring! i es mostra tal qual. Per això la captura porta
 * `idioma` i `articles` (eixe fitxer sencer), i cada línia es resol així:
 *   1. EQUIVALENTS_BRING: la clau del catàleg → l'article de base de la
 *      Nevera (taula de la casa, com MAPA_SECCIONS a importador.js);
 *   2. si no n'hi ha, el nom traduït, per nom (afigPerNom); si cap article no
 *      es diu així, n'ix un de propi amb el nom que veia la persona i un avís
 *      SENSE_EQUIVALENT; si el que es diu així és un producte de botiga
 *      (marca, envàs i preu que la llista no tenia), s'hi enllaça igualment
 *      (un propi no pot dir-se com un producte) i ho avisa PRODUCTE_DE_BOTIGA;
 *   3. una clau que no és al fitxer d'articles entra pel seu nom, com a Bring!.
 * Cap clau que el fitxer traduïx no entra amb el nom alemany. Dos línies que
 * acaben en el mateix article en fan una, amb avís ARTICLE_FUSIONAT.
 * El resultat usa l'esquema del nucli i el consumidor decidix si el desa.
 */
import { afig, afigPerNom, articlePerNom, clauDeNom, creaLlista, estatInicial, LIMITS, llistaPerId, netejaText } from './nucli/index.js';

export const ESQUEMA_CAPTURA_BRING = 'sdp.bring.captura.v2';
const IDIOMA = /^[a-z]{2}-[A-Z]{2}$/;
const MAX_ARTICLES = 10000;
const falla = (text) => { throw new TypeError(text); };

/* Clau del catàleg de Bring! → article de base de la Nevera. Només els que volen dir el mateix. */
export const EQUIVALENTS_BRING = Object.freeze({
  Tomaten: 'tomaques', Kartoffeln: 'creilles', Zwiebeln: 'cebes', Knoblauch: 'alls', 'Äpfel': 'pomes', Orange: 'taronges',
  Bananen: 'platans', Lattich: 'encisam', Karotten: 'safanories', Peperoni: 'pebrots', Zucchetti: 'carabasso',
  Zitrone: 'llimes', Erdbeeren: 'maduixes',
  Brot: 'pa', 'Brot geschnitten': 'pa-de-motle', Muffins: 'magdalenes',
  Milch: 'llet', Joghurt: 'iogurts', Eier: 'ous', Butter: 'mantega', Rahm: 'nata',
  Poulet: 'pollastre', Hackfleisch: 'carn-picada', Rohschinken: 'pernil', Wurst: 'salsitxes', Lachs: 'salmo', Thunfisch: 'tonyina',
  'Olivenöl': 'oli-oliva', Salz: 'sal', Zucker: 'sucre', Mehl: 'farina', Essig: 'vinagre', 'Pfefferkörner': 'pebre',
  Tomatensauce: 'tomaca-fregida', Hefe: 'llevat',
  'Glacé': 'gelat', 'Gemüse gefroren': 'verdura-congelada', Pizza: 'pizza', Kroketten: 'croquetes',
  Reis: 'arros', Spaghetti: 'espaguetis', Kichererbsen: 'cigrons', Linsen: 'llentilles', Bohnen: 'fesols', 'Frühstückszerealien': 'cereals',
  Schokolade: 'xocolate', Kekse: 'galetes', 'Pommes Chips': 'creilles-bossa', Oliven: 'olives', Mandeln: 'ametles', 'Erdnüsse': 'cacaus',
  Wasser: 'aigua', Orangensaft: 'suc-taronja', Bier: 'cervesa', Limonade: 'refrescos', Kaffee: 'cafe',
  'WC-Papier': 'paper-higienic', Haushaltspapier: 'paper-cuina', Waschmittel: 'detergent', Abwaschmittel: 'sabo-plats',
  'Abfallsäcke': 'bosses-fem', Alufolie: 'paper-alumini', Schwamm: 'esponges', Servietten: 'tovallons',
  Duschmittel: 'gel-dutxa', Shampoo: 'xampu', Zahnpasta: 'pasta-dents', Deo: 'desodorant', Binden: 'compreses', Pflaster: 'tiretes',
  'Taschentücher': 'mocadors',
  Hundefutter: 'pinso-gos', Katzenfutter: 'pinso-gat', Katzensnack: 'llaminadures-gat', Katzenstreu: 'arena-gat',
  'Dünger': 'adob', Blumenerde: 'terra-testos', Samen: 'llavors'
});

/* El text net sencer, i després el límit: uns espais al final no fan fallar la captura. */
function textDe(valor, maxim) {
  const net = typeof valor === 'string' ? netejaText(valor, Infinity) : null;
  if (net === null || [...net].length > maxim) falla('Un text de la captura supera els límits de la Nevera.');
  return net;
}

function articlesDe(valor) {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) falla('La captura no porta el fitxer d’articles de l’idioma de la llista.');
  const claus = Object.keys(valor).length;
  if (claus === 0 || claus > MAX_ARTICLES) falla('El fitxer d’articles de la captura és buit o massa gran.');
  return valor;
}

/* Les línies d'un estat, ja resoltes: { clauBring, nom, articleId, delCataleg, deBotiga, identitat, especificacio }. */
function liniesDe(valor, maxim, articles, estat, avisos) {
  if (!Array.isArray(valor) || valor.length > maxim) falla('La captura supera el nombre de línies admés.');
  const claus = new Set();
  const identitats = new Set();
  return valor.map((linia) => {
    const clauBring = textDe(linia?.name, LIMITS.nom);
    const clau = clauDeNom(clauBring);
    if (!clauBring || claus.has(clau)) falla('La captura porta articles buits o repetits en el mateix estat.');
    claus.add(clau);
    const delCataleg = Object.hasOwn(articles, clauBring);
    const nom = delCataleg ? textDe(articles[clauBring], LIMITS.nom) : clauBring;
    if (!nom) falla('La traducció d’un article de la captura és buida.');
    const enTaula = Object.hasOwn(EQUIVALENTS_BRING, clauBring);
    const perNom = enTaula ? null : articlePerNom(estat, nom);
    const articleId = enTaula ? EQUIVALENTS_BRING[clauBring] : perNom?.id ?? null;
    const identitat = articleId ?? `nou:${clauDeNom(nom)}`;
    const deBotiga = delCataleg && Boolean(perNom?.font);
    return { clauBring, nom, articleId, delCataleg, deBotiga, identitat, especificacio: textDe(linia.specification ?? '', LIMITS.especificacio) };
  }).filter((linia) => {
    if (!identitats.has(linia.identitat)) {
      identitats.add(linia.identitat);
      return true;
    }
    avisos.push({ codi: 'ARTICLE_FUSIONAT', clau: linia.clauBring, text: `«${linia.nom}» és el mateix article que una línia anterior: es conserva la primera.` });
    return false;
  });
}

/** Prepara una llista independent; no altera l'estat d'entrada ni les existències de casa. */
export function importaBring(captura, { nom, estat = estatInicial() } = {}) {
  if (captura?.esquema !== ESQUEMA_CAPTURA_BRING || typeof captura.uuid !== 'string' || !captura.uuid.trim() || captura.uuid.length > 128) {
    falla('La captura Bring! no té esquema o identificador vàlid.');
  }
  if (typeof captura.idioma !== 'string' || !IDIOMA.test(captura.idioma)) falla('La captura Bring! no diu l’idioma dels articles de la llista.');
  const articles = articlesDe(captura.articles);
  const titol = textDe(nom, LIMITS.nom);
  if (!titol) falla('Cal donar un nom a la llista importada.');
  const avisos = [];
  const pendents = liniesDe(captura.purchase, LIMITS.linies, articles, estat, avisos);
  const identitatsPendents = new Set(pendents.map((linia) => linia.identitat));
  const recents = liniesDe(captura.recently, LIMITS.recents, articles, estat, avisos);
  let resultat = creaLlista(estat, titol);
  if (resultat === estat) falla('No hi ha lloc per a una llista nova.');
  const llistaId = resultat.darreraLlista;
  const afegix = (linia) => {
    const anterior = llistaPerId(resultat, llistaId).linies.length;
    const opcions = { especificacio: linia.especificacio };
    resultat = linia.articleId ? afig(resultat, llistaId, linia.articleId, opcions) : afigPerNom(resultat, llistaId, linia.nom, opcions);
    const llista = llistaPerId(resultat, llistaId);
    if (llista.linies.length !== anterior + 1) falla('No hi ha lloc per a tots els articles de la captura.');
    if (linia.delCataleg && !linia.articleId) {
      avisos.push({ codi: 'SENSE_EQUIVALENT', clau: linia.clauBring, nom: linia.nom, text: `«${linia.nom}» no té cap article igual a la Nevera: entra com a article propi.` });
    }
    if (linia.deBotiga) {
      avisos.push({ codi: 'PRODUCTE_DE_BOTIGA', clau: linia.clauBring, articleId: linia.articleId, text: `«${linia.nom}» no té cap article de base igual: s’enllaça amb el producte de botiga del mateix nom.` });
    }
    return llista.linies.at(-1);
  };
  const histories = recents.filter((linia) => !identitatsPendents.has(linia.identitat)).map(afegix);
  // Un historial importat no és una compra feta ara: no toca «A casa».
  resultat = { ...resultat, llistes: resultat.llistes.map((llista) => llista.id === llistaId ? { ...llista, linies: [], recents: histories } : llista) };
  pendents.forEach(afegix);
  const repetits = recents.length - histories.length;
  if (repetits) avisos.push({ codi: 'PENDENT_I_RECENT', n: repetits, text: 'Un article pendent també constava als recents: es conserva pendent.' });
  return { estat: resultat, llistaId, origen: { proveidor: 'bring', idExtern: captura.uuid, idioma: captura.idioma }, avisos };
}
