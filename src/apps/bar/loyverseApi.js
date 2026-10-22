/**
 * Adaptador pur de captures JSON de Loyverse API 1.0 a la carta del Bar.
 * Rep les respostes completes d'items, categories, taxes i modifiers; no les
 * descarrega. El resultat passa pel mateix validaCataleg que l'importador CSV
 * (nucli/loyverse.js), accepta les mateixes opcions de casa (categoriaDe,
 * netejaNom, ordreVariants, ivaQuanFalta, desti, reposaNevera,
 * imatgeDisponible, exemple: OPCIONS_LA_PARROQUIA hi val tal qual) i pot
 * entrar al mateix consumidor de cartes, sense guardar ni cobrar res.
 *
 * Contracte contrastat amb API-Reference__v1.0.yaml, SHA-256
 * 99083473e795c5406c65420781904e2befbb55a7e840f8466e93d20cd0e977e4.
 * EUR explícit: la moneda no forma part de la resposta d'articles.
 * Mai s'aproxima un import ni un impost. Gauntlet 261022_0225 (crítica Claude):
 *   · Tot o res només per a la captura: un cursor pendent, una fila o un
 *     identificador invàlid o repetit la rebutgen sencera. Un article que el
 *     Bar no pot representar (pes, compost, producció, preus fixos i oberts
 *     barrejats, impost afegit, fraccionari o doble…) no entra i no para els
 *     altres: ix com a avís ARTICLE_NO_IMPORTAT amb el seu id i el seu nom.
 *   · Cada Modifier de la botiga és un grup { min 0, max n } amb les opcions
 *     per position; el que el Bar no pot representar (una opció que resta…)
 *     ix com a avís MODIFICADOR_NO_IMPORTAT i l'article entra sense eixe grup.
 *   · Sense cap impost d'esta botiga, l'IVA és el d'ivaQuanFalta o el de
 *     l'establiment, sempre amb avís: mai un 0 callat.
 *   · Com el CSV: el retall de talla() (sense partir cap emoji), cost 0 com a
 *     «sense cost», un cost que no es pot llegir entra sense cost amb avís
 *     COST (és informatiu: el preu sí que para l'article), el handle de
 *     l'article i el sku de cada variant com a handle i ref (els Handle i REF
 *     de l'exportació; l'UUID si falten), variants per preu si es demana i
 *     l'ordre de l'exportació (el nom en minúscules), no el de creació que
 *     dona l'API.
 *   · Diferent del CSV, a posta: els ids són els UUID (estables si es
 *     reanomena), un nom retallat ix com a avís NOM_RETALLAT (el CSV el
 *     retalla sense dir res), una variant no disponible a la botiga no entra
 *     (el TPV de Loyverse no la mostra), la venda per pes no entra (el CSV la
 *     ven per unitat) i sense categoria va a «Sense categoria».
 * Fixtures sintètiques segons documentació; cap captura de compte real.
 */
import { validaCataleg } from './nucli/cataleg.js';
import { errorBar } from './nucli/comu.js';
import { slugDe } from './nucli/loyverse.js';

export const ESQUEMA_CAPTURA_LOYVERSE = 'sdp.loyverse.captura.v2';
const RECURSOS = Object.freeze(['items', 'categories', 'taxes', 'modifiers']);
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MAX_NOM_PRODUCTE = 60;
const MAX_NOM = 40;
const MAX_SLUG = 64;
const MAX_DELTA = 100000;
const falla = (text) => { throw errorBar('LOYVERSE_API', text); };
const objecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function idDe(valor) {
  if (typeof valor !== 'string' || !UUID.test(valor)) falla('La captura porta un identificador invàlid.');
  return valor.toLowerCase();
}

/* El nom net; si no cap, retallat sense partir cap emoji (com talla() del CSV). */
function ajusta(valor, maxim) {
  if (typeof valor !== 'string' || !valor.trim()) falla('Un nom de la captura és buit o no és text.');
  const net = valor.replace(/\s+/g, ' ').trim();
  if (net.length <= maxim) return { nom: net, retallat: false };
  let tros = net.slice(0, maxim);
  const ultim = tros.charCodeAt(tros.length - 1);
  if (ultim >= 0xd800 && ultim <= 0xdbff) tros = tros.slice(0, -1);
  return { nom: tros.trim(), retallat: true };
}

function nomAmbAvis(valor, maxim, avisos, on) {
  const { nom, retallat } = ajusta(valor, maxim);
  if (retallat) avisos.push({ codi: 'NOM_RETALLAT', ...on, text: `«${valor.trim()}» passa de ${maxim} caràcters: queda «${nom}».` });
  return nom;
}

function pagina(captura, recurs) {
  const resposta = captura?.[recurs];
  if (!objecte(resposta) || !Array.isArray(resposta[recurs])) falla(`Falta la resposta completa de ${recurs}.`);
  if (resposta.cursor != null && resposta.cursor !== '') falla(`La resposta de ${recurs} encara té pàgines pendents.`);
  if (resposta[recurs].length > 10000) falla('La captura supera el límit de preparació local.');
  const vistos = new Set();
  return resposta[recurs].filter((fila) => {
    if (!objecte(fila)) falla(`Hi ha una fila invàlida en ${recurs}.`);
    const id = idDe(fila.id);
    if (vistos.has(id)) falla(`Hi ha identificadors repetits en ${recurs}.`);
    vistos.add(id);
    return !fila.deleted_at;
  });
}

function centims(valor, maxim = 10000000) {
  const arrodonit = Math.round(valor * 100);
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 ||
      !Number.isSafeInteger(arrodonit) || arrodonit > maxim || Math.abs(valor * 100 - arrodonit) > 1e-7) {
    falla('Un import no es pot representar en cèntims exactes.');
  }
  return arrodonit;
}

/* Un slug que no és a `usats` (i l'hi afig): el base o el base amb -2, -3… (com unic() del CSV). */
function unic(base, usats) {
  let candidat = base;
  for (let n = 2; usats.has(candidat); n += 1) candidat = `${base.slice(0, MAX_SLUG - String(n).length - 1).replace(/-+$/, '')}-${n}`;
  usats.add(candidat);
  return candidat;
}

const aLaBotiga = (botigues, botigaId) => botigues.some((storeId) => idDe(storeId) === botigaId);

function variantDe(variant, itemId, botigaId, avisos) {
  if (!objecte(variant)) falla('Una variant no és vàlida.');
  const id = idDe(variant.variant_id);
  if (variant.item_id != null && idDe(variant.item_id) !== itemId) falla('Una variant pertany a un altre article.');
  if (!Array.isArray(variant.stores)) falla('Falta la disponibilitat de la variant per botiga.');
  const botigues = variant.stores.filter((botiga) => idDe(botiga?.store_id) === botigaId);
  if (botigues.length !== 1) falla('La botiga triada ha de constar una sola vegada en cada variant.');
  const botiga = botigues[0];
  const tipus = botiga.pricing_type ?? variant.default_pricing_type;
  if (!['FIXED', 'VARIABLE'].includes(tipus)) falla('El tipus de preu d’una variant és desconegut.');
  /* store_override.available_for_sale: per defecte, true. */
  const disponible = botiga.available_for_sale ?? true;
  if (typeof disponible !== 'boolean') falla('La disponibilitat d’una variant no és vàlida.');
  const valors = [variant.option1_value, variant.option2_value, variant.option3_value].filter((v) => v != null && v !== '');
  if (valors.some((v) => typeof v !== 'string')) falla('Una opció de variant no és text.');
  const nom = nomAmbAvis(valors.map((v) => v.trim()).filter(Boolean).join(' · ') || 'Unitat', MAX_NOM, avisos, { id: itemId, variant: id });
  const preuCents = tipus === 'VARIABLE' ? 0 : centims(botiga.price ?? variant.default_price);
  /* El cost és dada de marge, no de cobrament: si no es pot llegir, sense cost i avís, com el CSV. */
  let costCents;
  if (variant.cost != null) {
    try {
      const llegit = centims(variant.cost);
      if (llegit > 0) costCents = llegit;
    } catch (error) {
      if (error?.codi !== 'LOYVERSE_API') throw error;
      avisos.push({ codi: 'COST', id: itemId, variant: id, text: `El cost ${String(variant.cost)} no es pot llegir: la variant s’importa sense cost.` });
    }
  }
  const sku = typeof variant.sku === 'string' ? variant.sku.trim() : '';
  return {
    variant: { id: `lv-${id}`, nom, preuCents, ...(costCents ? { costCents } : {}), ref: sku || id },
    variable: tipus === 'VARIABLE', disponible
  };
}

/* Un Modifier com a grup del Bar; null si no és d'esta botiga. Llança si no es pot representar. */
function grupDe(modificador, botigaId) {
  if (!Array.isArray(modificador.stores)) falla('El modificador no diu a quines botigues és.');
  if (!aLaBotiga(modificador.stores, botigaId)) return null;
  if (!Array.isArray(modificador.modifier_options)) falla('Falten les opcions del modificador.');
  const id = idDe(modificador.id);
  const avisos = [];
  const nom = nomAmbAvis(modificador.name, MAX_NOM, avisos, { modificador: id });
  const vistes = new Set();
  const opcions = modificador.modifier_options.map((opcio, posicio) => {
    if (!objecte(opcio)) falla('Una opció del modificador no és vàlida.');
    return { opcio, posicio };
  }).filter(({ opcio }) => !opcio.deleted_at)
    .sort((a, b) => ((a.opcio.position ?? Infinity) - (b.opcio.position ?? Infinity)) || (a.posicio - b.posicio))
    .map(({ opcio }) => {
      const idOpcio = idDe(opcio.id);
      if (vistes.has(idOpcio)) falla('El modificador repetix una opció.');
      vistes.add(idOpcio);
      if (typeof opcio.price === 'number' && opcio.price < 0) falla('Una opció resta diners i el Bar només en suma.');
      return {
        id: `lv-${idOpcio}`, nom: nomAmbAvis(opcio.name, MAX_NOM, avisos, { modificador: id, opcio: idOpcio }),
        deltaCents: centims(opcio.price ?? 0, MAX_DELTA)
      };
    });
  if (!opcions.length) falla('El modificador no té cap opció vigent.');
  return { grup: { id: `lv-${id}`, nom, min: 0, max: opcions.length, opcions }, avisos };
}

/* Els impostos de l'article: l'únic d'esta botiga (o cap), els d'altres botigues i els que no són a la captura. */
function impostDe(item, impostos, botigaId) {
  if (!Array.isArray(item.tax_ids)) falla('Falta la llista explícita d’impostos.');
  const desconeguts = [];
  const aliens = [];
  const aplicables = [];
  for (const taxId of item.tax_ids) {
    const tax = impostos.get(idDe(taxId));
    if (!tax) desconeguts.push(idDe(taxId));
    else if (!Array.isArray(tax.stores)) falla('Un impost no diu a quines botigues s’aplica.');
    else if (aLaBotiga(tax.stores, botigaId)) aplicables.push(tax);
    else aliens.push(idDe(taxId));
  }
  if (aplicables.length > 1 || aplicables.some((t) => t.type !== 'INCLUDED' || !Number.isInteger(t.rate) || t.rate < 0 || t.rate > 100)) {
    falla('El Bar només representa un impost inclòs amb percentatge enter.');
  }
  return { aplicable: aplicables[0] ?? null, desconeguts, aliens };
}

/* L'ordre de l'exportació de Loyverse: el nom en minúscules, i l'id en un empat. */
const clauOrdre = (item) => String(item.item_name ?? '').trim().toLowerCase();
const perNom = (a, b) => {
  const [x, y] = [clauOrdre(a), clauOrdre(b)];
  return x < y ? -1 : x > y ? 1 : (a.id.toLowerCase() < b.id.toLowerCase() ? -1 : 1);
};

/**
 * @param {{ esquema: string, items: object, categories: object, taxes: object, modifiers: object }} captura
 * @param {{ botigaId: string, moneda: 'EUR', categoriaDe?, netejaNom?, ordreVariants?: 'api' | 'preu',
 *   ivaQuanFalta?, desti?, reposaNevera?, imatgeDisponible?, exemple?: boolean }} opcions
 *   les funcions reben info = { id, handle, ref, nom, nomNet, categoria }, com les del CSV
 * @returns {{ carta: object, avisos: object[], origen: object }}
 */
export function importaLoyverseApi(captura, opcions = {}) {
  const { botigaId, moneda } = opcions;
  if (captura?.esquema !== ESQUEMA_CAPTURA_LOYVERSE) falla('La captura no té l’esquema esperat.');
  if (moneda !== 'EUR') falla('Cal confirmar que els imports de la captura són en euros.');
  const botiga = idDe(botigaId);
  const [items, categoriesLv, impostos, modificadorsLv] = RECURSOS.map((recurs) => pagina(captura, recurs));
  const perId = (files) => new Map(files.map((fila) => [idDe(fila.id), fila]));
  const categoriesPerId = perId(categoriesLv);
  const impostosPerId = perId(impostos);
  const modificadorsPerId = perId(modificadorsLv);
  const netejaNom = typeof opcions.netejaNom === 'function' ? opcions.netejaNom : (nom) => nom;
  const avisos = [];
  const categories = new Map();
  const grups = new Map();
  const conversions = new Map();
  const noImportats = new Map();
  const idsVariants = new Set();
  const slugsImatge = new Map();

  /* Cada Modifier es convertix una sola vegada: { grup, avisos } | { error, nom } | null (d'una altra botiga). */
  const conversio = (idModificador) => {
    if (!conversions.has(idModificador)) {
      const modificador = modificadorsPerId.get(idModificador);
      try {
        conversions.set(idModificador, grupDe(modificador, botiga));
      } catch (error) {
        if (error?.codi !== 'LOYVERSE_API') throw error;
        conversions.set(idModificador, { error: error.message, nom: typeof modificador.name === 'string' ? modificador.name.trim() : '' });
      }
    }
    return conversions.get(idModificador);
  };

  const articleDe = (item, id) => {
    const propis = [];
    for (const camp of ['sold_by_weight', 'is_composite', 'track_stock', 'use_production']) {
      if (item[camp] != null && typeof item[camp] !== 'boolean') falla('Un indicador de l’article no és vàlid.');
    }
    for (const camp of ['components', 'modifiers_ids']) {
      if (item[camp] != null && !Array.isArray(item[camp])) falla('Una llista de l’article no és vàlida.');
    }
    if (item.sold_by_weight) falla('Es ven per pes i el Bar encara no ho pot representar.');
    if (item.is_composite || item.use_production || item.components?.length) falla('És un compost o es produïx, i el Bar encara no ho pot representar.');
    const lv = item.category_id == null ? null : categoriesPerId.get(idDe(item.category_id));
    if (item.category_id != null && !lv) falla('La categoria de l’article no està en la captura.');
    const nom = ajusta(item.item_name, Infinity).nom;
    const info = {
      id, handle: typeof item.handle === 'string' ? item.handle : '', nom,
      ref: Array.isArray(item.variants) && typeof item.variants[0]?.sku === 'string' ? item.variants[0].sku : '',
      categoria: typeof lv?.name === 'string' ? lv.name.trim() : ''
    };
    const netejat = netejaNom(nom);
    info.nomNet = nomAmbAvis(typeof netejat === 'string' && netejat.trim() ? netejat : nom, MAX_NOM_PRODUCTE, propis, { id });

    if (!Array.isArray(item.variants)) falla('Falten les variants de l’article.');
    const llegides = item.variants.filter((v) => !v?.deleted_at).map((v) => variantDe(v, id, botiga, propis));
    if (!llegides.length) falla('No té cap variant vigent.');
    const propies = new Set(llegides.map(({ variant }) => variant.id));
    if (propies.size !== llegides.length || [...propies].some((idVariant) => idsVariants.has(idVariant))) {
      falla('Repetix una variant, seua o d’un altre article.');
    }
    const disponibles = llegides.filter((v) => v.disponible);
    const vigents = disponibles.length ? disponibles : llegides;
    if (disponibles.length && disponibles.length < llegides.length) {
      propis.push({ codi: 'VARIANT_NO_DISPONIBLE', id, text: `«${info.nomNet}»: ${llegides.length - disponibles.length} de ${llegides.length} variants no estan disponibles a esta botiga i no entren.` });
    }
    if (vigents.some((v) => v.variable !== vigents[0].variable)) falla('Barreja variants de preu fix i de preu obert.');
    const ordenades = opcions.ordreVariants === 'preu' ? vigents.slice().sort((a, b) => a.variant.preuCents - b.variant.preuCents) : vigents;

    const { aplicable, desconeguts, aliens } = impostDe(item, impostosPerId, botiga);
    let ivaPercent = aplicable?.rate;
    if (desconeguts.length) {
      propis.push({ codi: 'IMPOST_DESCONEGUT', id, impostos: desconeguts, text: `«${info.nomNet}» referix ${desconeguts.length === 1 ? 'un impost que no és' : `${desconeguts.length} impostos que no són`} a la captura.` });
    }
    if (!aplicable) {
      const on = aliens.length ? 'cap impost d’esta botiga' : 'cap impost';
      const corregit = typeof opcions.ivaQuanFalta === 'function' ? opcions.ivaQuanFalta(info) : undefined;
      if (Number.isSafeInteger(corregit) && corregit >= 0 && corregit <= 100) {
        ivaPercent = corregit;
        propis.push({ codi: 'IVA_CORREGIT', id, text: `«${info.nomNet}» no porta ${on} a Loyverse: s’hi aplica el ${corregit} %.` });
      } else {
        propis.push({ codi: 'SENSE_IVA', id, ...(aliens.length ? { impostos: aliens } : {}), text: `«${info.nomNet}» no porta ${on}: s’aplicarà el de l’establiment.` });
      }
    }

    const grupsUsats = [];
    for (const idModificador of new Set((item.modifiers_ids ?? []).map(idDe))) {
      if (!modificadorsPerId.has(idModificador)) {
        propis.push({ codi: 'MODIFICADOR_DESCONEGUT', id, modificador: idModificador, text: `«${info.nomNet}» referix un modificador que no és a la captura.` });
      } else if (conversio(idModificador)) grupsUsats.push(idModificador);
    }
    if (item.track_stock) propis.push({ codi: 'INVENTARI_NO_IMPORTAT', id, text: 'Les existències no formen part de la carta importada.' });

    const casa = typeof opcions.categoriaDe === 'function' ? opcions.categoriaDe(info) : null;
    const categoria = {
      id: casa?.id || (lv ? `lv-${idDe(lv.id)}` : 'lv-sense-categoria'),
      nom: casa?.nom || info.categoria || 'Sense categoria',
      ...(casa?.icona ? { icona: casa.icona } : {}),
      ordre: Number.isSafeInteger(casa?.ordre) ? casa.ordre : null
    };
    return { info, categoria, ivaPercent, ordenades, propies, grupsUsats, propis, preuObert: vigents[0].variable, actiu: disponibles.length > 0 };
  };

  const productes = [];
  for (const item of items.slice().sort(perNom)) {
    const id = idDe(item.id);
    let article;
    try {
      article = articleDe(item, id);
    } catch (error) {
      if (error?.codi !== 'LOYVERSE_API') throw error;
      const nom = typeof item.item_name === 'string' ? item.item_name.trim() : '';
      avisos.push({ codi: 'ARTICLE_NO_IMPORTAT', id, nom, text: `«${nom || id}» no s’importa: ${error.message}` });
      continue;
    }
    const { info, categoria, ordenades, propies, grupsUsats, propis } = article;
    if (!categories.has(categoria.id)) {
      const nomCategoria = nomAmbAvis(categoria.nom, MAX_NOM, avisos, { categoria: categoria.id });
      categories.set(categoria.id, { ...categoria, nom: nomCategoria, aparicio: categories.size });
    }
    avisos.push(...propis);
    for (const idVariant of propies) idsVariants.add(idVariant);
    const grupsModificadors = [];
    for (const idModificador of grupsUsats) {
      const resultat = conversio(idModificador);
      if (resultat.error) {
        const compte = noImportats.get(idModificador) ?? { nom: resultat.nom, motiu: resultat.error, productes: 0 };
        noImportats.set(idModificador, { ...compte, productes: compte.productes + 1 });
      } else {
        if (!grups.has(resultat.grup.id)) {
          grups.set(resultat.grup.id, resultat.grup);
          avisos.push(...resultat.avisos);
        }
        grupsModificadors.push(resultat.grup.id);
      }
    }
    if (!slugsImatge.has(categoria.id)) slugsImatge.set(categoria.id, new Set());
    const slugImatge = unic(slugDe(info.nomNet) || 'producte', slugsImatge.get(categoria.id));
    const definitiva = typeof opcions.imatgeDisponible === 'function' && opcions.imatgeDisponible(categoria.id, slugImatge) === true;
    productes.push({
      id: `lv-${id}`, nom: info.nomNet, categoriaId: categoria.id,
      variants: ordenades.map((v) => v.variant), grupsModificadors,
      ...(article.ivaPercent === undefined ? {} : { ivaPercent: article.ivaPercent }),
      alergens: [], imatge: { slug: slugImatge, estat: definitiva ? 'definitiva' : 'marcador' },
      reposaNevera: typeof opcions.reposaNevera === 'function' && opcions.reposaNevera(info) === true,
      desti: typeof opcions.desti === 'function' && opcions.desti(info) === 'cuina' ? 'cuina' : 'barra',
      preuObert: article.preuObert, actiu: article.actiu,
      ordre: productes.length + 1, exemple: opcions.exemple === true, handle: info.handle.trim() || id
    });
  }
  for (const [idModificador, { nom, motiu, productes: n }] of noImportats) {
    avisos.push({ codi: 'MODIFICADOR_NO_IMPORTAT', modificador: idModificador, nom, productes: n,
      text: `El modificador «${nom || idModificador}» (${n} ${n === 1 ? 'producte' : 'productes'}) no s’importa: ${motiu}` });
  }
  if (!productes.length) throw Object.assign(errorBar('LOYVERSE_API', 'Cap article de la captura no es pot importar.'), { avisos });

  const llistaCategories = [...categories.values()]
    .sort((a, b) => ((a.ordre ?? Infinity) - (b.ordre ?? Infinity)) || (a.aparicio - b.aparicio))
    .map(({ id, nom, icona }, ordre) => ({ id, nom, ...(icona ? { icona } : {}), ordre, visible: true }));
  const carta = { categories: llistaCategories, productes, grups: [...grups.values()], ingredients: [], escandalls: [] };
  const { ok, errors } = validaCataleg(carta);
  if (!ok) falla(`La captura no produïx una carta vàlida: ${errors.slice(0, 3).join('; ')}`);
  return { carta, avisos, origen: { proveidor: 'loyverse', botigaId: botiga, moneda } };
}
