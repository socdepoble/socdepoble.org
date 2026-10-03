/**
 * El Bar · nucli/loyverse.js — l'importador de l'exportació d'articles de
 * Loyverse («export_items.csv») cap a la carta del Bar (nucli/cataleg.js).
 * Pur i genèric: rep el text (o els bytes) del fitxer i unes opcions, i no
 * sap res de cap establiment concret. Els criteris d'una casa (categories,
 * IVA que falta, ordre de les variants, fotos) van en un adaptador, com
 * llavors/laParroquia.js.
 *
 *   importaLoyverse(text, opcions) → { carta, establiment, avisos, resum }
 *
 * Com es llig l'exportació:
 *   · Capçaleres en castellà o en anglès (Handle, REF|SKU, Nombre|Name…).
 *     Sense Handle, nom i preu no és una exportació de Loyverse: llança.
 *   · Les columnes de botiga porten el sufix «[Botiga]» («Precio [X]»). Amb
 *     més d'una botiga, cal triar-ne una amb `opcions.botiga`.
 *   · Una fila amb nom obri un producte; les de davall amb el mateix Handle
 *     i el nom buit en són les variants (els valors de l'Opció 1, 2 i 3).
 *   · Impostos («impuesto - "IVA" (10%)») i grups de modificadors
 *     («modificador - "X"») es reconeixen per la forma de la capçalera.
 *   · Preus i costos amb parseEuros (utils/diners.js): cèntims enters, mai
 *     coma flotant. Preu «variable» (o buit) → preu obert; cost 0 → sense cost.
 *   · Els modificadors NO s'importen: l'exportació diu quins grups porta
 *     cada producte però no en porta les opcions, i un grup sense opcions no
 *     és vàlid (validaCataleg). Cada grup referit ix com a avís.
 *   · Inventari, codi de barres, components i venda per pes no tenen lloc
 *     al Bar: si porten dades, ixen com a avís.
 * Un defecte de dades no para la importació: ix com a avís
 * { codi, fila?, handle?, text }. Al final, validaCataleg: si la carta no
 * és vàlida, llança (és un error de l'importador, no de les dades).
 * Sense React ni DOM; determinista (el mateix text dona la mateixa carta).
 */
import { llegixCsv } from '../../../utils/fulls/index.js';
import { parseEuros } from '../../../utils/diners.js';
import { validaCataleg } from './cataleg.js';
import { errorBar } from './comu.js';

const MAX_SLUG = 64;
const MAX_NOM_PRODUCTE = 60;
const MAX_NOM = 40;

/* Les columnes fixes: clau → títols possibles (sense accents i en minúscules). */
const COLUMNES = Object.freeze({
  handle: ['handle'],
  ref: ['ref', 'sku'],
  nom: ['nombre', 'name'],
  categoria: ['categoria', 'category'],
  descripcio: ['descripcion', 'description'],
  perPes: ['vendido por peso', 'sold by weight'],
  opcio1Nom: ['opcion 1 nombre', 'option 1 name'],
  opcio1Valor: ['opcion 1 valor', 'option 1 value'],
  opcio2Nom: ['opcion 2 nombre', 'option 2 name'],
  opcio2Valor: ['opcion 2 valor', 'option 2 value'],
  opcio3Nom: ['opcion 3 nombre', 'option 3 name'],
  opcio3Valor: ['opcion 3 valor', 'option 3 value'],
  cost: ['coste', 'costo', 'cost'],
  codiBarres: ['codigo de barras', 'barcode'],
  refComponent: ['ref del componente', 'sku of included item'],
  quantitatComponent: ['cantidad del componente', 'quantity of included item'],
  inventari: ['seguir el inventario', 'track stock']
});

/* Les columnes de cada botiga: «Precio [La botiga]». */
const COLUMNES_BOTIGA = Object.freeze({
  disponible: ['disponibles para la venta', 'disponible para la venta', 'available for sale'],
  preu: ['precio', 'price'],
  existencies: ['en inventario', 'in stock'],
  baixes: ['existencias bajas', 'low stock']
});

const MODIFICADOR = /^(?:modificador|modifier)\s*-\s*"(.+)"$/i;
const IMPOST = /^(?:impuesto|tax)\s*-\s*"(.+)"\s*\((\d+(?:[.,]\d+)?)\s*%\)$/i;
const AMB_BOTIGA = /^(.*?)\s*\[(.+)\]$/;
const DIACRITICS = /[\u0300-\u036f]/g;
const PUNT_VOLAT = /·/g;

const normalitza = (titol) => String(titol).normalize('NFD').replace(DIACRITICS, '').replace(/\s+/g, ' ').trim().toLowerCase();
const esSi = (valor) => /^(?:y|s|si|yes|true|1)$/i.test(valor);
const esNo = (valor) => /^(?:n|no|false|0)$/i.test(valor);

/**
 * Slug d'un text: sense diacrítics ni punt volat, en minúscules, la resta
 * de caràcters en guions solts; com a molt 64. Pot tornar '' (només emojis).
 */
export function slugDe(text) {
  const net = String(text ?? '').normalize('NFD').replace(DIACRITICS, '').replace(PUNT_VOLAT, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return net.length <= MAX_SLUG ? net : net.slice(0, MAX_SLUG).replace(/-+$/, '');
}

/* Un text net i retallat a `maxim` unitats UTF-16 sense partir cap emoji. */
function talla(text, maxim) {
  const net = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (net.length <= maxim) return net;
  let tros = net.slice(0, maxim);
  const ultim = tros.charCodeAt(tros.length - 1);
  if (ultim >= 0xd800 && ultim <= 0xdbff) tros = tros.slice(0, -1);
  return tros.trim();
}

/* Un slug que no és a `usats` (i l'hi afig): el base, el base amb el sufix o amb -2, -3… */
function unic(base, usats, sufix = '') {
  const ambCua = (cua) => `${base.slice(0, MAX_SLUG - cua.length - 1).replace(/-+$/, '')}-${cua}`;
  let candidat = base;
  if (usats.has(candidat) && sufix) candidat = ambCua(sufix);
  for (let n = 2; usats.has(candidat); n += 1) candidat = ambCua(String(n));
  usats.add(candidat);
  return candidat;
}

/* On és cada columna. Llança si no és una exportació de Loyverse o si cal triar botiga. */
function llegixCapcalera(capcalera, botigaTriada) {
  const col = {};
  const perBotiga = new Map();
  const modificadors = [];
  const impostos = [];
  const desconegudes = [];
  capcalera.forEach((cru, idx) => {
    const titol = String(cru ?? '').trim();
    const net = normalitza(titol);
    const modificador = MODIFICADOR.exec(titol);
    if (modificador) { modificadors.push({ idx, nom: modificador[1].trim() }); return; }
    const impost = IMPOST.exec(titol);
    if (impost) { impostos.push({ idx, nom: impost[1].trim(), percent: Number(impost[2].replace(',', '.')) }); return; }
    const fixa = Object.keys(COLUMNES).find((clau) => COLUMNES[clau].includes(net));
    if (fixa) {
      if (col[fixa] === undefined) col[fixa] = idx;
      return;
    }
    const ambBotiga = AMB_BOTIGA.exec(titol);
    const base = normalitza(ambBotiga ? ambBotiga[1] : titol);
    const deBotiga = Object.keys(COLUMNES_BOTIGA).find((clau) => COLUMNES_BOTIGA[clau].includes(base));
    if (deBotiga) {
      const botiga = ambBotiga ? ambBotiga[2].trim() : '';
      if (!perBotiga.has(botiga)) perBotiga.set(botiga, {});
      if (perBotiga.get(botiga)[deBotiga] === undefined) perBotiga.get(botiga)[deBotiga] = idx;
      return;
    }
    if (titol) desconegudes.push(titol);
  });
  const botigues = [...perBotiga.keys()].filter((b) => perBotiga.get(b).preu !== undefined);
  if (col.handle === undefined || col.nom === undefined || botigues.length === 0) {
    throw errorBar('NO_LOYVERSE', 'No és una exportació d’articles de Loyverse: hi falten les columnes Handle, Nom o Preu.');
  }
  let botiga;
  if (botigaTriada !== undefined && botigaTriada !== null) {
    if (!botigues.includes(botigaTriada)) throw errorBar('BOTIGA', `L’exportació no té cap botiga «${String(botigaTriada)}».`);
    botiga = botigaTriada;
  } else if (botigues.length > 1) {
    throw errorBar('BOTIGA', `L’exportació porta ${botigues.length} botigues (${botigues.join(', ')}): cal triar-ne una.`);
  } else {
    [botiga] = botigues;
  }
  return { col: { ...col, ...perBotiga.get(botiga) }, botiga, modificadors, impostos, desconegudes };
}

/* Agrupa les files per Handle: una fila amb nom obri un producte; les altres en són variants. */
function agrupa(files, col, columnes, avisa) {
  const cela = (fila, idx) => (idx === undefined ? '' : String(fila[idx] ?? '').trim());
  const crus = [];
  const perHandle = new Map();
  files.forEach((fila, i) => {
    const numero = i + 2;
    if (fila.every((c) => String(c ?? '').trim() === '')) return;
    if (fila.length !== columnes) avisa('COLUMNES', `La fila ${numero} té ${fila.length} columnes i la capçalera, ${columnes}.`, { fila: numero });
    const handle = cela(fila, col.handle);
    const nom = cela(fila, col.nom);
    if (!handle) { avisa('SENSE_HANDLE', `La fila ${numero} no porta Handle: no s’importa.`, { fila: numero }); return; }
    let cru = perHandle.get(handle);
    if (cru && nom && nom !== cru.nom) {
      avisa('HANDLE_REPETIT', `La fila ${numero} repetix el Handle de «${cru.nom}»: s’importa com una variant seua.`, { fila: numero, handle });
    }
    if (!cru) {
      if (!nom) { avisa('SENSE_NOM', `La fila ${numero} no porta nom ni és la variant d’un producte anterior: no s’importa.`, { fila: numero, handle }); return; }
      cru = { handle, nom, fila: numero, primera: fila, files: [] };
      perHandle.set(handle, cru);
      crus.push(cru);
    }
    cru.files.push({ fila, numero });
  });
  return { crus, cela };
}

/* Les variants d'un producte, amb el preu llegit i el que no té lloc al Bar comptat. */
function variantsDe(cru, col, cela, avisa) {
  const ambOpcions = [col.opcio1Nom, col.opcio2Nom, col.opcio3Nom].some((idx) => cela(cru.primera, idx) !== '');
  const usats = new Set();
  return cru.files.map(({ fila, numero }, posicio) => {
    const valors = [col.opcio1Valor, col.opcio2Valor, col.opcio3Valor].map((idx) => cela(fila, idx)).filter(Boolean);
    let nom = valors.length ? talla(valors.join(' · '), MAX_NOM) : '';
    if (!nom) nom = ambOpcions || cru.files.length > 1 ? `Variant ${posicio + 1}` : 'Unitat';
    const id = unic(slugDe(nom) || `variant-${posicio + 1}`, usats);
    const textPreu = cela(fila, col.preu);
    let preuCents = 0;
    let variable = textPreu === '' || /^variable$/i.test(textPreu);
    if (!variable) {
      const llegit = parseEuros(textPreu);
      if (llegit === null || llegit < 0) {
        avisa('PREU', `«${cru.nom}» (fila ${numero}): el preu «${textPreu}» no es pot llegir; queda com a preu obert.`, { fila: numero, handle: cru.handle });
        variable = true;
      } else preuCents = llegit;
    }
    const textCost = cela(fila, col.cost);
    let costCents;
    if (textCost !== '') {
      const llegit = parseEuros(textCost);
      if (llegit === null || llegit < 0) avisa('COST', `«${cru.nom}» (fila ${numero}): el cost «${textCost}» no es pot llegir.`, { fila: numero, handle: cru.handle });
      else if (llegit > 0) costCents = llegit;
    }
    const ref = cela(fila, col.ref);
    return {
      variant: { id, nom, preuCents, ...(costCents !== undefined ? { costCents } : {}), ...(ref ? { ref } : {}) },
      variable,
      disponible: !esNo(cela(fila, col.disponible)),
      posicio
    };
  });
}

/* Les variants per preu: de més barata a més cara, les de preu obert al final, i l'ordre del fitxer en un empat. */
const perPreu = (a, b) => (Number(a.variable) - Number(b.variable)) || (a.variant.preuCents - b.variant.preuCents) || (a.posicio - b.posicio);

/**
 * Importa l'exportació d'articles de Loyverse.
 * @param {string|Uint8Array|ArrayBuffer} text
 * @param {{
 *   botiga?: string,
 *   categoriaDe?: (info) => ({ id: string, nom: string, icona?: string, ordre?: number } | null),
 *   netejaNom?: (nom: string) => string,
 *   ordreVariants?: 'csv' | 'preu',
 *   ivaQuanFalta?: (info) => (number | undefined),
 *   desti?: (info) => ('barra' | 'cuina'),
 *   reposaNevera?: (info) => boolean,
 *   imatgeDisponible?: (categoriaId: string, slug: string) => boolean,
 *   exemple?: boolean
 * }} [opcions]
 *   info = { handle, ref, nom (el del fitxer), nomNet, categoria (la del fitxer), fila }
 * @returns {{ carta: object, establiment: { nom?: string }, avisos: object[], resum: object }}
 */
export function importaLoyverse(text, opcions = {}) {
  const files = llegixCsv(text);
  const avisos = [];
  const avisa = (codi, missatge, on = {}) => avisos.push({ codi, ...on, text: missatge });
  if (files.length === 0) throw errorBar('NO_LOYVERSE', 'El fitxer és buit.');
  const [capcalera, ...dades] = files;
  const { col, botiga, modificadors, impostos, desconegudes } = llegixCapcalera(capcalera, opcions.botiga);
  const { crus, cela } = agrupa(dades, col, capcalera.length, avisa);
  if (crus.length === 0) throw errorBar('BUIT', 'L’exportació no porta cap producte.');

  const netejaNom = typeof opcions.netejaNom === 'function' ? opcions.netejaNom : (nom) => nom;
  const ordrePerPreu = opcions.ordreVariants === 'preu';
  const exemple = opcions.exemple === true;
  const categories = new Map();
  const idsProducte = new Set();
  const slugsImatge = new Map();
  const grupsReferits = new Map();
  const perIva = {};
  const compta = { inactius: 0, preuObert: 0, senseIva: 0, ivaCorregit: 0, inventari: 0, descripcio: 0, codiBarres: 0, components: 0 };

  const productes = crus.map((cru, index) => {
    const nomNet = talla(netejaNom(cru.nom), MAX_NOM_PRODUCTE) || talla(cru.nom, MAX_NOM_PRODUCTE);
    const info = { handle: cru.handle, ref: cela(cru.primera, col.ref), nom: cru.nom, nomNet, categoria: cela(cru.primera, col.categoria), fila: cru.fila };

    /* La categoria: la de l'adaptador o la columna Categoria; sense, «Altres». */
    const propia = typeof opcions.categoriaDe === 'function' ? opcions.categoriaDe(info) : null;
    const nomCategoria = propia?.nom || info.categoria || 'Altres';
    const categoria = {
      id: propia?.id || slugDe(nomCategoria) || 'altres',
      nom: talla(nomCategoria, MAX_NOM),
      ...(propia?.icona ? { icona: propia.icona } : {}),
      ordre: Number.isSafeInteger(propia?.ordre) ? propia.ordre : null
    };
    if (!categories.has(categoria.id)) categories.set(categoria.id, { ...categoria, aparicio: categories.size });

    const llegides = variantsDe(cru, col, cela, avisa);
    const ordenades = ordrePerPreu ? llegides.slice().sort(perPreu) : llegides;
    const preuObert = llegides.some((v) => v.variable);
    if (preuObert && !llegides.every((v) => v.variable)) {
      avisa('PREU_MIXT', `«${cru.nom}» té variants amb preu i variants de preu obert: tot el producte demana el preu en vendre.`, { fila: cru.fila, handle: cru.handle });
    }
    const actiu = llegides.some((v) => v.disponible);
    if (actiu && llegides.some((v) => !v.disponible)) {
      avisa('VARIANT_NO_DISPONIBLE', `«${cru.nom}» té alguna variant no disponible: el Bar no ho distingix per variant i el producte queda actiu.`, { fila: cru.fila, handle: cru.handle });
    }

    /* L'IVA: un sol impost marcat; si no n'hi ha cap, el de l'adaptador o el de l'establiment. */
    const marcats = impostos.filter(({ idx }) => esSi(cela(cru.primera, idx)));
    let ivaPercent;
    if (marcats.length === 1 && Number.isSafeInteger(marcats[0].percent) && marcats[0].percent <= 100) ivaPercent = marcats[0].percent;
    else if (marcats.length > 1) {
      avisa('IVA_MULTIPLE', `«${cru.nom}» porta ${marcats.length} impostos marcats: s’aplicarà l’IVA de l’establiment.`, { fila: cru.fila, handle: cru.handle });
    } else if (marcats.length === 1) {
      avisa('IVA', `«${cru.nom}»: l’impost del ${marcats[0].percent} % no és un enter; s’aplicarà l’IVA de l’establiment.`, { fila: cru.fila, handle: cru.handle });
    } else {
      const corregit = typeof opcions.ivaQuanFalta === 'function' ? opcions.ivaQuanFalta(info) : undefined;
      if (Number.isSafeInteger(corregit) && corregit >= 0 && corregit <= 100) {
        ivaPercent = corregit;
        compta.ivaCorregit += 1;
        avisa('IVA_CORREGIT', `«${cru.nom}» no porta cap IVA a Loyverse: s’hi aplica el ${corregit} %.`, { fila: cru.fila, handle: cru.handle });
      } else {
        compta.senseIva += 1;
        avisa('SENSE_IVA', `«${cru.nom}» no porta cap IVA: s’aplicarà el de l’establiment.`, { fila: cru.fila, handle: cru.handle });
      }
    }
    if (ivaPercent !== undefined) perIva[ivaPercent] = (perIva[ivaPercent] || 0) + 1;

    for (const { idx, nom } of modificadors) if (esSi(cela(cru.primera, idx))) grupsReferits.set(nom, (grupsReferits.get(nom) || 0) + 1);
    if (esSi(cela(cru.primera, col.perPes))) {
      avisa('PER_PES', `«${cru.nom}» es ven per pes a Loyverse: el Bar el ven per unitat.`, { fila: cru.fila, handle: cru.handle });
    }
    if (esSi(cela(cru.primera, col.inventari)) || cru.files.some(({ fila }) => cela(fila, col.existencies) !== '' || cela(fila, col.baixes) !== '')) compta.inventari += 1;
    if (cela(cru.primera, col.descripcio) !== '') compta.descripcio += 1;
    if (cru.files.some(({ fila }) => cela(fila, col.codiBarres) !== '')) compta.codiBarres += 1;
    if (cru.files.some(({ fila }) => cela(fila, col.refComponent) !== '' || cela(fila, col.quantitatComponent) !== '')) compta.components += 1;
    if (!actiu) compta.inactius += 1;
    if (preuObert) compta.preuObert += 1;

    if (!slugsImatge.has(categoria.id)) slugsImatge.set(categoria.id, new Set());
    const slugImatge = unic(slugDe(nomNet) || 'producte', slugsImatge.get(categoria.id));
    const definitiva = typeof opcions.imatgeDisponible === 'function' && opcions.imatgeDisponible(categoria.id, slugImatge) === true;
    return {
      id: unic(slugDe(cru.handle) || slugDe(nomNet) || 'producte', idsProducte, slugDe(info.ref)),
      nom: nomNet,
      categoriaId: categoria.id,
      variants: ordenades.map((v) => v.variant),
      grupsModificadors: [],
      ...(ivaPercent !== undefined ? { ivaPercent } : {}),
      alergens: [],
      imatge: { slug: slugImatge, estat: definitiva ? 'definitiva' : 'marcador' },
      reposaNevera: typeof opcions.reposaNevera === 'function' && opcions.reposaNevera(info) === true,
      desti: typeof opcions.desti === 'function' && opcions.desti(info) === 'cuina' ? 'cuina' : 'barra',
      preuObert,
      actiu,
      ordre: index + 1,
      exemple,
      handle: cru.handle
    };
  });

  /* Els avisos de conjunt, després dels de cada fila. */
  for (const [nom, n] of grupsReferits) {
    avisa('MODIFICADORS', `El grup de modificadors «${nom}» (${n} ${n === 1 ? 'producte' : 'productes'}) no s’importa: l’exportació no en porta les opcions.`);
  }
  const noImportats = [
    [compta.inventari, 'INVENTARI', ['seguix', 'seguixen'], 'l’inventari a Loyverse: el Bar no en porta'],
    [compta.descripcio, 'DESCRIPCIO', ['porta', 'porten'], 'descripció: la carta del Bar no en té'],
    [compta.codiBarres, 'CODI_BARRES', ['porta', 'porten'], 'codi de barres: el Bar no en fa servir'],
    [compta.components, 'COMPONENTS', ['està fet', 'estan fets'], 'de components: el Bar no els descompon']
  ];
  for (const [n, codi, [un, molts], resta] of noImportats) {
    if (n > 0) avisa(codi, `${n} ${n === 1 ? `producte ${un}` : `productes ${molts}`} ${resta}; no s’importa.`);
  }
  if (desconegudes.length) avisa('COLUMNES_DESCONEGUDES', `Columnes que no es lligen: ${desconegudes.join(', ')}.`);

  const llistaCategories = [...categories.values()]
    .sort((a, b) => ((a.ordre ?? Infinity) - (b.ordre ?? Infinity)) || (a.aparicio - b.aparicio))
    .map(({ id, nom, icona }, ordre) => ({ id, nom, ...(icona ? { icona } : {}), ordre, visible: true }));
  const carta = { categories: llistaCategories, grups: [], productes, ingredients: [], escandalls: [] };
  const { ok, errors } = validaCataleg(carta);
  if (!ok) throw errorBar('CARTA', `La carta importada no és vàlida: ${errors.slice(0, 3).join('; ')}`);
  return {
    carta,
    establiment: botiga ? { nom: talla(botiga, 80) } : {},
    avisos,
    resum: {
      botiga: botiga || null,
      productes: productes.length,
      variants: productes.reduce((n, p) => n + p.variants.length, 0),
      categories: llistaCategories.length,
      inactius: compta.inactius,
      preuObert: compta.preuObert,
      perIva,
      ivaCorregit: compta.ivaCorregit,
      senseIva: compta.senseIva,
      modificadors: grupsReferits.size
    }
  };
}
