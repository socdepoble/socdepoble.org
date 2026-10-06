/**
 * Productes · utils/productes/producteUniversal.js — el contracte comú dels
 * productes de casa i de bar (ordre del Mestre, 261006: «separar productes
 * per a casa i productes per a bars, unificant-ne la gestió»). El TPV
 * Universal pinta igual la Llista de la Compra (domini 'casa', «Afig a la
 * llista») i el Bar (domini 'bar', «Cobra»): els dos parlen esta forma i
 * cada app hi traduïx la seua.
 *
 *   producte universal {
 *     id             id opac (esIdOpac)
 *     nom            text net d'1 a 60 caràcters
 *     categoriaId    id opac: la categoria de la carta (bar) o la secció (casa)
 *     domini         'casa' | 'bar'
 *     presentacions  [≥ 1] { id, nom, preuCents?, quantitat?, unitat? }
 *                    · bar: les variants (Tassa, Canya…), sempre amb preu
 *                    · casa: una sola, 'unitat', amb el nom de l'envàs
 *     imatge?        { slug, estat: 'marcador' | 'definitiva' }
 *     alergens       [ids d'ALERGENS, sense repetits] · obligatori al bar
 *                    (encara que siga buida); a casa, opcional
 *     canals         { cartaDigital, perEmportar } · només al bar, i sempre
 *     marca?         text: la marca comercial («Hacendado»)
 *     font?          id opac de la font del catàleg ('mer')
 *   }
 * Els camps desconeguts no passen (llista blanca).
 *
 * ELS AL·LÈRGENS (ordre del Mestre, 261006: «el contracte de dades d'un
 * producte ha de contemplar una llista d'al·lèrgens»): els 14 del Reglament
 * (UE) 1169/2011, annex II, en el seu ordre (ALERGENS), amb el nom en
 * valencià (NOMS_ALERGENS) i l'abreviatura de la pastilla que pinta
 * IconesAlergens quan falta una icona (ABREVIATURES_ALERGENS): els ids
 * s'escriuen ací i enlloc més. Són els mateixos ids que ja usava el Bar, que
 * ara els reexporta d'ací: la Carta Digital, el TPV, la Gestoria i el Rebost
 * parlen una sola llista. Un producte els pot desar en qualsevol ordre
 * (validaAlergens no el mira); qui els ensenya els posa en el del Reglament
 * (ordenaAlergens). Són informatius: els manté qui ven.
 *
 * Els DOS CANALS d'un producte de bar: «a la carta digital» i «per
 * emportar». Sense `canals`, el producte és als dos: la carta d'ara no
 * canvia. Tots dos a fals vol dir que només es ven a la barra (la caixa no
 * mira els canals).
 *
 * La MARCA DE L'ORGANITZACIÓ (el nom i el logotip del bar que ha entrat) no
 * és cosa d'este mòdul: el seu únic contracte és marcaNeta del pont de
 * sessió (src/apps/plataforma/sessioApp.js), que en filtra les claus. Ací
 * `marca` és només la marca comercial d'un producte («Hacendado»).
 *
 * PENDENT (relleu del 261006): cap pantalla no crida encara producteDeBar,
 * producteDeCasa ni validaProducteUniversal, i cap vista no llig el canal
 * 'carta-digital' (el TPV només usa 'emportar'). Les proves en validen el
 * contracte, no cap flux: no compten com a cobertura del TPV. Quan s'endolle
 * la Nevera (el Mode Rebost), cal una prova d'integració que passe per
 * producteDeCasa i per «Afig a la llista». Els al·lèrgens, en canvi, ja
 * tenen usuaris: la carta del Bar es valida amb validaAlergens
 * (apps/bar/nucli/cataleg.js) i el TPV els passa ordenats a cada article
 * (articlesDelTpv d'apps/bar/vistes/vestits.js).
 *
 * JS pur: cap React, cap xarxa, cap emmagatzematge, cap rellotge ni atzar.
 * No importa res de src/apps (la frontera ho veta): les regles de forma que
 * calen es reproduïxen ací. Els ids, com nouId del Bar i esIdNevera; els
 * diners, en cèntims enters (la Nevera els diu `preuCentims` i
 * producteDeCasa els tradueix a `preuCents`).
 */

export const DOMINIS = Object.freeze(['casa', 'bar']);
export const CANALS = Object.freeze(['carta-digital', 'emportar']);
export const UNITATS = Object.freeze(['u', 'g', 'kg', 'ml', 'l']);
export const ESTATS_IMATGE = Object.freeze(['marcador', 'definitiva']);

/** Els 14 al·lèrgens del Reglament (UE) 1169/2011, annex II, en el seu ordre. */
export const ALERGENS = Object.freeze([
  'gluten', 'crustacis', 'ous', 'peix', 'cacauets', 'soja', 'llet',
  'fruits-closca', 'api', 'mostassa', 'sesam', 'sulfits', 'tramussos', 'molluscs'
]);

/** El nom de cada al·lergen, en valencià. */
export const NOMS_ALERGENS = Object.freeze({
  gluten: 'Gluten', crustacis: 'Crustacis', ous: 'Ous', peix: 'Peix', cacauets: 'Cacauets', soja: 'Soja',
  llet: 'Llet', 'fruits-closca': 'Fruits de closca', api: 'Api', mostassa: 'Mostassa', sesam: 'Sèsam',
  sulfits: 'Diòxid de sofre i sulfits', tramussos: 'Tramussos', molluscs: 'Mol·luscs'
});

/** L'abreviatura de cada al·lergen (dos majúscules, totes diferents): la pastilla que ocupa el lloc d'una icona que falta. */
export const ABREVIATURES_ALERGENS = Object.freeze({
  gluten: 'GL', crustacis: 'CR', ous: 'OU', peix: 'PE', cacauets: 'CA', soja: 'SO', llet: 'LL',
  'fruits-closca': 'FC', api: 'AP', mostassa: 'MS', sesam: 'SE', sulfits: 'SU', tramussos: 'TR', molluscs: 'ML'
});

const MAX_NOM = 60;
const MAX_CENTS = 10000000;
const MAX_QUANTITAT = 1000000;

/* El canal (com a la URL) → la seua clau dins de `canals`. */
const CLAU_DE_CANAL = Object.freeze({ 'carta-digital': 'cartaDigital', emportar: 'perEmportar' });
const CLAUS_CANALS = Object.freeze(['cartaDigital', 'perEmportar']);
const CLAUS_PRODUCTE = Object.freeze(['id', 'nom', 'categoriaId', 'domini', 'presentacions', 'imatge', 'alergens', 'canals', 'marca', 'font']);
const CLAUS_PRESENTACIO = Object.freeze(['id', 'nom', 'preuCents', 'quantitat', 'unitat']);
const CLAUS_IMATGE = Object.freeze(['slug', 'estat']);

const PATRO_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
/* Cap text del contracte porta controls (C0, C1, separadors de línia),
   amplades zero, guionet tou, marques bidi ni BOM. S'escriuen amb \u{…},
   com a la Nevera: l'eina d'edició descodifica la forma curta. */
const INVISIBLES = /[\u{0}-\u{1F}\u{7F}-\u{9F}\u{AD}\u{200B}-\u{200F}\u{2028}-\u{202E}\u{2060}-\u{2069}\u{FEFF}]/u;

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esCents = (valor) => Number.isSafeInteger(valor) && valor >= 0 && valor <= MAX_CENTS;
const esQuantitat = (valor) => typeof valor === 'number' && Number.isFinite(valor) && valor > 0 && valor <= MAX_QUANTITAT;

/** Id opac: minúscules, xifres, '-' i '_', de 1 a 64 caràcters ('cafe-llet', 'mer-ketchup', 'p-12'). */
export function esIdOpac(valor) {
  return typeof valor === 'string' && PATRO_ID.test(valor);
}

/* Text net: no buit, sense invisibles i, com a molt, `maxim` caràcters (punts de codi, com netejaText de la Nevera). */
function esTextNet(valor, maxim) {
  return typeof valor === 'string' && valor.trim() !== '' && [...valor].length <= maxim && !INVISIBLES.test(valor);
}

/* Les claus d'un objecte que no són a la llista blanca, com a errors. */
function clausNoPermeses(objecte, permeses, on) {
  return Object.keys(objecte).filter((clau) => !permeses.includes(clau)).map((clau) => `${on}: clau no permesa «${clau}»`);
}

/* ── Els canals d'un producte de bar ─────────────────────────────────── */

/**
 * Els canals d'un producte: { cartaDigital, perEmportar }, sempre una còpia
 * nova. Sense `canals`, tots dos a cert. Una clau que no és booleana també
 * compta com a cert (validaCanals la denuncia).
 */
export function canalsDe(producte) {
  const canals = esObjecte(producte?.canals) ? producte.canals : {};
  return {
    cartaDigital: typeof canals.cartaDigital === 'boolean' ? canals.cartaDigital : true,
    perEmportar: typeof canals.perEmportar === 'boolean' ? canals.perEmportar : true
  };
}

/** El producte és d'este canal ('carta-digital' | 'emportar')? Un canal desconegut, mai. */
export function esDelCanal(producte, canal) {
  return CANALS.includes(canal) ? canalsDe(producte)[CLAU_DE_CANAL[canal]] : false;
}

/**
 * Els errors del camp `canals`: undefined és vàlid (tots dos canals); si n'hi
 * ha, un objecte amb només `cartaDigital` i `perEmportar`, booleans.
 * @returns {string[]}
 */
export function validaCanals(valor) {
  if (valor === undefined) return [];
  if (!esObjecte(valor)) return ['canals: ha de ser un objecte { cartaDigital, perEmportar }'];
  const errors = clausNoPermeses(valor, CLAUS_CANALS, 'canals');
  for (const clau of CLAUS_CANALS) {
    if (typeof valor[clau] !== 'boolean') errors.push(`canals.${clau}: ha de ser booleà`);
  }
  return errors;
}

/* ── Els al·lèrgens ──────────────────────────────────────────────────── */

/**
 * Els errors d'una llista d'al·lèrgens (llista buida si és vàlida): una
 * llista, potser buida, on cada element és un id d'ALERGENS i cap no es
 * repetix. L'ordre és lliure. Si cal o no la llista, ho diu qui la crida
 * (validaProducteUniversal: obligatòria al bar, opcional a casa).
 * @returns {string[]}
 */
export function validaAlergens(llista) {
  if (!Array.isArray(llista)) return ['alergens: ha de ser una llista dels 14 al·lèrgens del Reglament'];
  const errors = [];
  const vistos = new Set();
  llista.forEach((id, i) => {
    if (!ALERGENS.includes(id)) errors.push(`alergens[${i}]: no és cap dels 14 al·lèrgens del Reglament`);
    else if (vistos.has(id)) errors.push(`alergens[${i}]: «${id}» repetit`);
    vistos.add(id);
  });
  return errors;
}

/**
 * Els al·lèrgens d'una llista en l'ordre del Reglament (el d'ALERGENS), sense
 * repetits ni ids desconeguts. Sempre una llista nova: buida si no en rep cap.
 * @returns {string[]}
 */
export function ordenaAlergens(llista) {
  return Array.isArray(llista) ? ALERGENS.filter((id) => llista.includes(id)) : [];
}

/* ── Traductors ──────────────────────────────────────────────────────── */

/**
 * Un producte de la carta del Bar com a producte universal. Les variants
 * passen a ser presentacions (els ml, quantitat en 'ml'); el cost, els
 * modificadors, l'IVA i la resta de camps de la caixa es queden al Bar.
 * Copia sense arreglar res: el que no casa ho troba validaProducteUniversal.
 * Llança TypeError si no rep un objecte.
 */
export function producteDeBar(producte) {
  if (!esObjecte(producte)) throw new TypeError('producteDeBar: cal un producte de la carta del Bar.');
  const variants = Array.isArray(producte.variants) ? producte.variants : [];
  return {
    id: producte.id,
    nom: producte.nom,
    categoriaId: producte.categoriaId,
    domini: 'bar',
    presentacions: variants.map((v) => ({
      id: v?.id,
      nom: v?.nom,
      preuCents: v?.preuCents,
      ...(v?.ml !== undefined ? { quantitat: v.ml, unitat: 'ml' } : {})
    })),
    ...(esObjecte(producte.imatge) ? { imatge: { slug: producte.imatge.slug, estat: producte.imatge.estat } } : {}),
    alergens: Array.isArray(producte.alergens) ? [...producte.alergens] : producte.alergens,
    canals: validaCanals(producte.canals).length ? producte.canals : canalsDe(producte)
  };
}

/* Una fila compacta de la Nevera: [id, nom, seccioId, marca, envas, quantitat, unitat, preuCentims]. */
function articleDeFila([id, nom, categoriaId, marca, envas, quantitat, unitat, preuCentims]) {
  return { id, nom, categoriaId, marca, envas, quantitat, unitat, preuCentims };
}

/**
 * Un article de la Nevera com a producte universal: un de base ({ id, nom,
 * categoriaId }), un de propi (`propi` no passa) o un producte de botiga,
 * en objecte ({ …, font, marca, envas, quantitat, unitat, preuCentims }) o en
 * fila compacta (que no porta la font). Una sola presentació, 'unitat', amb
 * el nom de l'envàs o «Unitat». Una marca buida no passa. Llança TypeError
 * si no rep un objecte ni una fila.
 */
export function producteDeCasa(producte) {
  const article = Array.isArray(producte) ? articleDeFila(producte) : producte;
  if (!esObjecte(article)) throw new TypeError('producteDeCasa: cal un article o un producte de la Nevera.');
  const preu = article.preuCents !== undefined ? article.preuCents : article.preuCentims;
  const presentacio = {
    id: 'unitat',
    nom: typeof article.envas === 'string' && article.envas.trim() !== '' ? article.envas : 'Unitat',
    ...(preu !== undefined ? { preuCents: preu } : {}),
    ...(article.quantitat !== undefined ? { quantitat: article.quantitat } : {}),
    ...(article.unitat !== undefined && article.unitat !== '' ? { unitat: article.unitat } : {})
  };
  return {
    id: article.id,
    nom: article.nom,
    categoriaId: article.categoriaId !== undefined ? article.categoriaId : article.seccioId,
    domini: 'casa',
    presentacions: [presentacio],
    ...(typeof article.marca === 'string' && article.marca.trim() !== '' ? { marca: article.marca } : {}),
    ...(article.font !== undefined ? { font: article.font } : {})
  };
}

/* ── La validació del producte universal ─────────────────────────────── */

function validaPresentacions(producte, errors) {
  const { presentacions, domini } = producte;
  if (!Array.isArray(presentacions) || presentacions.length === 0) {
    errors.push('presentacions: cal almenys una presentació');
    return;
  }
  const vistos = new Set();
  presentacions.forEach((presentacio, i) => {
    const on = `presentacions[${i}]`;
    if (!esObjecte(presentacio)) {
      errors.push(`${on}: ha de ser un objecte`);
      return;
    }
    errors.push(...clausNoPermeses(presentacio, CLAUS_PRESENTACIO, on));
    if (!esIdOpac(presentacio.id)) errors.push(`${on}: l'id ha de ser un id opac`);
    else if (vistos.has(presentacio.id)) errors.push(`${on}: id repetit «${presentacio.id}»`);
    vistos.add(presentacio.id);
    if (!esTextNet(presentacio.nom, MAX_NOM)) errors.push(`${on}: cal un nom de fins a ${MAX_NOM} caràcters`);
    if (presentacio.preuCents === undefined) {
      if (domini === 'bar') errors.push(`${on}: una presentació de bar porta preuCents`);
    } else if (!esCents(presentacio.preuCents)) {
      errors.push(`${on}: preuCents ha de ser un enter de 0 a ${MAX_CENTS}`);
    }
    if (presentacio.quantitat !== undefined && !esQuantitat(presentacio.quantitat)) errors.push(`${on}: quantitat ha de ser un nombre positiu`);
    if (presentacio.unitat !== undefined && !UNITATS.includes(presentacio.unitat)) errors.push(`${on}: unitat ${UNITATS.join(' | ')}`);
  });
}

function validaImatge(imatge, errors) {
  if (imatge === undefined) return;
  if (!esObjecte(imatge)) {
    errors.push('imatge: ha de ser un objecte { slug, estat }');
    return;
  }
  errors.push(...clausNoPermeses(imatge, CLAUS_IMATGE, 'imatge'));
  if (!esIdOpac(imatge.slug)) errors.push('imatge.slug: ha de ser un id opac');
  if (!ESTATS_IMATGE.includes(imatge.estat)) errors.push(`imatge.estat: ${ESTATS_IMATGE.join(' | ')}`);
}

function validaAlergensDelDomini(producte, errors) {
  const { alergens, domini } = producte;
  if (alergens === undefined) {
    if (domini === 'bar') errors.push('alergens: un producte de bar porta la llista (encara que siga buida)');
    return;
  }
  errors.push(...validaAlergens(alergens));
}

function validaCanalsDelDomini(producte, errors) {
  const { canals, domini } = producte;
  if (domini === 'bar') {
    if (canals === undefined) errors.push('canals: un producte de bar porta sempre els seus canals');
    else errors.push(...validaCanals(canals));
  } else if (canals !== undefined) {
    errors.push('canals: només els productes de bar en tenen');
  }
}

/**
 * Els errors d'un producte universal (llista buida si és vàlid).
 * @returns {string[]}
 */
export function validaProducteUniversal(producte) {
  if (!esObjecte(producte)) return ['producte: ha de ser un objecte'];
  const errors = clausNoPermeses(producte, CLAUS_PRODUCTE, 'producte');
  if (!esIdOpac(producte.id)) errors.push('id: ha de ser un id opac');
  if (!esTextNet(producte.nom, MAX_NOM)) errors.push(`nom: cal un nom de fins a ${MAX_NOM} caràcters`);
  if (!esIdOpac(producte.categoriaId)) errors.push('categoriaId: ha de ser un id opac');
  if (!DOMINIS.includes(producte.domini)) errors.push(`domini: ${DOMINIS.join(' | ')}`);
  validaPresentacions(producte, errors);
  validaImatge(producte.imatge, errors);
  validaAlergensDelDomini(producte, errors);
  validaCanalsDelDomini(producte, errors);
  if (producte.marca !== undefined && !esTextNet(producte.marca, MAX_NOM)) errors.push(`marca: text de fins a ${MAX_NOM} caràcters`);
  if (producte.font !== undefined && !esIdOpac(producte.font)) errors.push('font: ha de ser un id opac');
  return errors;
}
