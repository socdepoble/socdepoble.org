/**
 * expedient.js — l'expedient de Projectes i subvencions: fases, fites,
 * terminis, justificació, codi comptable, conservació i la guarda del doble
 * finançament.
 *
 * Un expedient és d'un titular (id opac) i d'un PROGRAMA. El programa porta
 * la plantilla de terminis (els del Kit Digital, amb les bases com a font) i
 * l'expedient hi pot afegir els seus, que diuen les bases de cada
 * convocatòria. Tots els terminis passen pel motor de Burocràcia
 * (terminis.js) i són «a verificar amb la gestoria».
 *
 * Doble finançament: una mateixa factura es pot imputar a més d'un
 * expedient, però la suma de les imputacions no pot passar del 100 % de la
 * factura. Els imports són CÈNTIMS ENTERS. La guarda és pura: llig la llista
 * d'expedients i diu què no quadra; no corregix ni esborra res. A més, un
 * programa amb fons europeus (el Kit Digital, MRR) avisa, sense bloquejar,
 * quan la mateixa factura finança un altre expedient que també en porta o
 * que no se sap (avisosFinancament, i potImputar ho diu).
 *
 * Els terminis d'un expedient porten un id compost OPAC i curt
 * (idOpacDerivat): l'id de l'expedient més el del termini passaria del
 * límit del motor de terminis.
 *
 * Cap verb d'editar: un canvi (una fita feta, una imputació nova) és un
 * expedient nou que es valida sencer. JS pur: sense DOM, React ni xarxa.
 */
import {
  comprovaClaus, comprovaData, comprovaId, comprovaText, congela, esObjecte, idOpacDerivat, llancaSiCal, VERIFICAR
} from '../../identitat/nucli/guardes.js';
import { ORGANISMES } from '../../identitat/nucli/document.js';
import { calculaTermini, QUI_FA, sumaMesos, UNITATS } from '../../burocracia/nucli/terminis.js';

export const SCHEMA_EXPEDIENT = 'sdp.gestoria.expedient.v1';
export const FASES = Object.freeze(['sollicitud', 'concessio', 'acord', 'execucio', 'justificacio', 'pagament', 'control', 'tancat']);

/* Les dates que pot portar un expedient i com les veu el motor de terminis. */
export const DATES_EXPEDIENT = Object.freeze({
  sollicitud: 'presentacio',
  concessio: 'notificacio',
  acord: 'validacio',
  factura: 'factura',
  justificacio: 'justificacio',
  pagament: 'altre'
});

const plantilla = (terminis) => Object.freeze(terminis.map((t) => Object.freeze(t)));

export const PROGRAMES = Object.freeze({
  'kit-digital': Object.freeze({
    nom: 'Kit Digital',
    organisme: 'RED.ES',
    fonsEuropeus: true,
    codiComptableObligatori: true,
    conservacioMesos: 60,
    font: Object.freeze({ norma: 'Orde ETD/1498/2021 (bases reguladores del Kit Digital) i la convocatòria de cada segment', consulta: 'Seu electrònica de Red.es' }),
    terminis: plantilla([
      { id: 'signatura-acords', fase: 'acord', origen: 'concessio', durada: 6, unitat: 'mesos', qui: 'titular', consequencia: 'Sense acords de prestació signats a temps, el bo digital caduca.' },
      { id: 'primera-justificacio', fase: 'justificacio', origen: 'factura', durada: 3, unitat: 'mesos', qui: 'agent', consequencia: 'Sense la primera justificació a temps, es pot perdre l’ajuda.' },
      { id: 'segona-justificacio', fase: 'justificacio', origen: 'factura', durada: 15, unitat: 'mesos', qui: 'agent', consequencia: 'Sense la segona justificació, després del període de prestació, es pot haver de reintegrar.' }
    ]),
    verificar: VERIFICAR
  }),
  subvencio: Object.freeze({
    nom: 'Subvenció o ajuda',
    organisme: null,
    fonsEuropeus: null,
    codiComptableObligatori: false,
    conservacioMesos: 48,
    font: Object.freeze({ norma: 'Llei 38/2003 general de subvencions i les bases de cada convocatòria', consulta: 'Les bases i la resolució de la convocatòria' }),
    terminis: plantilla([]),
    verificar: VERIFICAR
  })
});

const CLAUS = Object.freeze(['id', 'titular', 'programa', 'alies', 'organisme', 'codiComptable', 'importConcedit', 'dates', 'fites', 'terminis', 'imputacions']);
const CLAUS_TERMINI = Object.freeze(['id', 'fase', 'origen', 'durada', 'unitat', 'qui', 'consequencia']);
const esCentims = (n) => Number.isSafeInteger(n) && n > 0;
/* Els mateixos límits que el motor de terminis: cap termini real dura més. */
const MAX_MESOS = 1200;
const MAX_DIES = 3660;

function comprovaDates(dates, errors) {
  if (dates === undefined) return;
  if (!esObjecte(dates)) {
    errors.push({ codi: 'DATES_INVALIDES', camp: 'expedient.dates', missatge: 'Les dates són un objecte amb les fites de calendari de l’expedient.' });
    return;
  }
  comprovaClaus(dates, Object.keys(DATES_EXPEDIENT), 'expedient.dates', errors);
  const net = Object.fromEntries(Object.keys(DATES_EXPEDIENT).map((clau) => [clau, comprovaData(dates[clau], `expedient.dates.${clau}`, errors)]));
  if (net.sollicitud && net.concessio && net.concessio < net.sollicitud) {
    errors.push({ codi: 'DATES_INCOHERENTS', camp: 'expedient.dates.concessio', missatge: 'La concessió no pot ser anterior a la sol·licitud.' });
  }
}

function comprovaFites(fites, errors) {
  if (fites === undefined) return;
  if (!Array.isArray(fites)) {
    errors.push({ codi: 'FITES_INVALIDES', camp: 'expedient.fites', missatge: 'Les fites són una llista de { id, fase, prevista, feta }.' });
    return;
  }
  const ids = new Set();
  fites.forEach((fita, i) => {
    const camp = `expedient.fites[${i}]`;
    if (!esObjecte(fita)) {
      errors.push({ codi: 'FITES_INVALIDES', camp, missatge: 'Cada fita és { id, fase, prevista, feta }.' });
      return;
    }
    comprovaClaus(fita, ['id', 'fase', 'prevista', 'feta'], camp, errors);
    if (comprovaId(fita.id, `${camp}.id`, errors) && ids.has(fita.id)) errors.push({ codi: 'ID_REPETIT', camp: `${camp}.id`, missatge: `La fita ${fita.id} es repetix.` });
    ids.add(fita.id);
    if (!FASES.includes(fita.fase)) errors.push({ codi: 'FASE_INVALIDA', camp: `${camp}.fase`, missatge: `La fase és una de: ${FASES.join(', ')}.` });
    comprovaData(fita.prevista, `${camp}.prevista`, errors);
    comprovaData(fita.feta, `${camp}.feta`, errors);
  });
}

function comprovaTerminis(terminis, errors) {
  if (terminis === undefined) return;
  if (!Array.isArray(terminis)) {
    errors.push({ codi: 'TERMINIS_INVALIDS', camp: 'expedient.terminis', missatge: 'Els terminis propis són una llista.' });
    return;
  }
  terminis.forEach((t, i) => {
    const camp = `expedient.terminis[${i}]`;
    if (!esObjecte(t)) {
      errors.push({ codi: 'TERMINIS_INVALIDS', camp, missatge: 'Cada termini és { id, fase, origen, durada, unitat, qui, consequencia }.' });
      return;
    }
    comprovaClaus(t, CLAUS_TERMINI, camp, errors);
    comprovaId(t.id, `${camp}.id`, errors);
    if (!FASES.includes(t.fase)) errors.push({ codi: 'FASE_INVALIDA', camp: `${camp}.fase`, missatge: `La fase és una de: ${FASES.join(', ')}.` });
    if (!Object.hasOwn(DATES_EXPEDIENT, t.origen ?? '')) errors.push({ codi: 'ORIGEN_INVALID', camp: `${camp}.origen`, missatge: `L’origen és una de les dates: ${Object.keys(DATES_EXPEDIENT).join(', ')}.` });
    if (!UNITATS.includes(t.unitat)) errors.push({ codi: 'UNITAT_INVALIDA', camp: `${camp}.unitat`, missatge: `La unitat és una de: ${UNITATS.join(', ')}.` });
    const maxim = t.unitat === 'mesos' ? MAX_MESOS : MAX_DIES;
    if (!Number.isInteger(t.durada) || t.durada < 1 || t.durada > maxim) {
      errors.push({ codi: 'DURADA_INVALIDA', camp: `${camp}.durada`, missatge: `La durada és un enter entre 1 i ${maxim}.` });
    }
    if (t.qui !== undefined && !QUI_FA.includes(t.qui)) errors.push({ codi: 'QUI_INVALID', camp: `${camp}.qui`, missatge: `Qui el fa és un de: ${QUI_FA.join(', ')}.` });
    comprovaText(t.consequencia, `${camp}.consequencia`, errors, { maxim: 200 });
  });
}

function comprovaImputacions(imputacions, errors) {
  if (imputacions === undefined) return;
  if (!Array.isArray(imputacions)) {
    errors.push({ codi: 'IMPUTACIONS_INVALIDES', camp: 'expedient.imputacions', missatge: 'Les imputacions són una llista de { factura, importFactura, importImputat }.' });
    return;
  }
  const factures = new Set();
  imputacions.forEach((imp, i) => {
    const camp = `expedient.imputacions[${i}]`;
    if (!esObjecte(imp)) {
      errors.push({ codi: 'IMPUTACIONS_INVALIDES', camp, missatge: 'Cada imputació és { factura, importFactura, importImputat }.' });
      return;
    }
    comprovaClaus(imp, ['factura', 'importFactura', 'importImputat'], camp, errors);
    if (comprovaId(imp.factura, `${camp}.factura`, errors) && factures.has(imp.factura)) {
      errors.push({ codi: 'FACTURA_REPETIDA', camp: `${camp}.factura`, missatge: 'Una factura s’imputa una sola vegada a cada expedient.' });
    }
    factures.add(imp.factura);
    if (!esCentims(imp.importFactura)) errors.push({ codi: 'IMPORT_INVALID', camp: `${camp}.importFactura`, missatge: 'L’import de la factura són cèntims enters positius.' });
    if (!esCentims(imp.importImputat)) errors.push({ codi: 'IMPORT_INVALID', camp: `${camp}.importImputat`, missatge: 'L’import imputat són cèntims enters positius.' });
    else if (esCentims(imp.importFactura) && imp.importImputat > imp.importFactura) {
      errors.push({ codi: 'IMPUTACIO_EXCESSIVA', camp: `${camp}.importImputat`, missatge: 'No es pot imputar més del 100 % d’una factura.' });
    }
  });
}

/**
 * Els errors d'un expedient, sense llançar: [] si és vàlid.
 */
export function validaExpedient(dades) {
  const errors = [];
  if (!esObjecte(dades)) return [{ codi: 'EXPEDIENT_INVALID', camp: 'expedient', missatge: 'L’expedient ha de ser un objecte.' }];
  comprovaClaus(dades, CLAUS, 'expedient', errors);
  comprovaId(dades.id, 'expedient.id', errors);
  comprovaId(dades.titular, 'expedient.titular', errors);
  comprovaText(dades.alies, 'expedient.alies', errors, { obligatori: true, maxim: 80 });
  comprovaId(dades.codiComptable, 'expedient.codiComptable', errors, { obligatori: false });
  if (!Object.hasOwn(PROGRAMES, dades.programa ?? '')) errors.push({ codi: 'PROGRAMA_DESCONEGUT', camp: 'expedient.programa', missatge: `El programa és un de: ${Object.keys(PROGRAMES).join(', ')}.` });
  const organisme = dades.organisme ?? PROGRAMES[dades.programa]?.organisme;
  if (!ORGANISMES.includes(organisme)) errors.push({ codi: 'ORGANISME_DESCONEGUT', camp: 'expedient.organisme', missatge: `L’organisme és un de: ${ORGANISMES.join(', ')}.` });
  if (dades.importConcedit !== undefined && dades.importConcedit !== null && !esCentims(dades.importConcedit)) {
    errors.push({ codi: 'IMPORT_INVALID', camp: 'expedient.importConcedit', missatge: 'L’import concedit són cèntims enters positius.' });
  }
  comprovaDates(dades.dates, errors);
  comprovaFites(dades.fites, errors);
  comprovaTerminis(dades.terminis, errors);
  comprovaImputacions(dades.imputacions, errors);
  return errors;
}

/**
 * Un expedient congelat, o un error EXPEDIENT_INVALID amb tots els detalls.
 * @returns {Readonly<object>}
 */
export function creaExpedient(dades) {
  llancaSiCal(validaExpedient(dades), 'EXPEDIENT_INVALID', 'L’expedient no és vàlid');
  const programa = PROGRAMES[dades.programa];
  return congela({
    schema: SCHEMA_EXPEDIENT,
    id: dades.id,
    titular: dades.titular,
    programa: dades.programa,
    alies: dades.alies.trim(),
    organisme: dades.organisme ?? programa.organisme,
    codiComptable: dades.codiComptable ?? null,
    importConcedit: dades.importConcedit ?? null,
    dates: Object.fromEntries(Object.keys(DATES_EXPEDIENT).map((clau) => [clau, dades.dates?.[clau] ?? null])),
    fites: (dades.fites ?? []).map((f) => ({ id: f.id, fase: f.fase, prevista: f.prevista ?? null, feta: f.feta ?? null })),
    terminis: (dades.terminis ?? []).map((t) => ({ ...t, qui: t.qui ?? 'titular', consequencia: t.consequencia?.trim() || null })),
    imputacions: (dades.imputacions ?? []).map((imp) => ({ factura: imp.factura, importFactura: imp.importFactura, importImputat: imp.importImputat }))
      .sort((x, y) => (x.factura < y.factura ? -1 : 1))
  });
}

/** La fase en què és l'expedient: la més avançada amb una fita feta, o la sol·licitud. */
export function faseActual(expedient) {
  const fetes = (expedient?.fites ?? []).filter((f) => f.feta).map((f) => FASES.indexOf(f.fase));
  return FASES[Math.max(0, ...fetes)];
}

/** El prefix dels ids opacs dels terminis d'un expedient. */
export const PREFIX_TERMINI_EXPEDIENT = 'texp';

/** L'id opac i curt d'un termini d'un expedient: el mateix parell dona sempre el mateix id. */
export const idTerminiExpedient = (expedientId, terminiId) => idOpacDerivat(PREFIX_TERMINI_EXPEDIENT, `${expedientId}:${terminiId}`);

/**
 * Els terminis d'un expedient (els del programa i els propis), calculats amb
 * el motor de Burocràcia. Un termini sense la data d'origen queda pendent
 * (venciment null) i diu quina data falta; un termini amb una fita feta del
 * mateix id és `complit` i ja no s'avisa. L'id és opac (idTerminiExpedient):
 * `expedient` i `termini` diuen de quin es tracta.
 */
export function terminisExpedient(expedient, { calendari } = {}) {
  const programa = PROGRAMES[expedient.programa];
  const fets = new Set(expedient.fites.filter((f) => f.feta).map((f) => f.id));
  return congela([...programa.terminis, ...expedient.terminis].map((t) => {
    const base = {
      id: idTerminiExpedient(expedient.id, t.id), termini: t.id, expedient: expedient.id, fase: t.fase, categoria: 'expedient',
      complit: fets.has(t.id), font: programa.font, verificar: VERIFICAR
    };
    const data = expedient.dates[t.origen];
    if (!data) return { ...base, venciment: null, qui: t.qui ?? 'titular', consequencia: t.consequencia ?? null, pendent: `Falta la data «${t.origen}» de l’expedient.` };
    const calculat = calculaTermini({
      id: base.id, categoria: 'expedient', origen: { tipus: DATES_EXPEDIENT[t.origen], data }, durada: t.durada, unitat: t.unitat,
      ...(t.qui ? { qui: t.qui } : {}), ...(t.consequencia ? { consequencia: t.consequencia } : {})
    }, { calendari });
    return { ...calculat, ...base, pendent: null };
  }));
}

/**
 * La conservació de l'expedient: fins quan s'han de guardar els papers. Mentre
 * no hi ha justificació no se'n pot dir cap data i és protegit.
 */
export function conservacioExpedient(expedient) {
  const programa = PROGRAMES[expedient.programa];
  const base = expedient.dates.pagament && expedient.dates.pagament > (expedient.dates.justificacio ?? '')
    ? expedient.dates.pagament : expedient.dates.justificacio;
  return congela({
    fins: base ? sumaMesos(base, programa.conservacioMesos) : null,
    protegit: true,
    text: base
      ? `Es conserva tot l’expedient ${programa.conservacioMesos / 12} anys des de l’última justificació o pagament.`
      : 'L’expedient és viu: no es pot llençar res.',
    verificar: VERIFICAR
  });
}

/** Els avisos de forma d'un expedient (no l'invaliden): de moment, el codi comptable que falta. */
export function avisosExpedient(expedient) {
  const programa = PROGRAMES[expedient.programa];
  const avisos = [];
  if (programa.codiComptableObligatori && !expedient.codiComptable) {
    avisos.push({ codi: 'SENSE_CODI_COMPTABLE', missatge: 'Este programa demana un codi comptable diferenciat per a les seues despeses i ingressos.', verificar: VERIFICAR });
  }
  return congela(avisos);
}

/* Els fons europeus del programa d'un expedient: cert, fals o null (no se sap). */
const fonsEuropeusDe = (expedient) => PROGRAMES[expedient?.programa]?.fonsEuropeus ?? null;

/* Dos finançaments del mateix cost poden ser dos instruments de la UE quan un
   en porta segur i almenys un altre en porta o no se sap. */
const potSerDobleUe = (fons) => fons.includes(true) && fons.filter((f) => f !== false).length >= 2;

export const MISSATGE_DOBLE_UE = 'Esta factura finança un expedient amb fons europeus i un altre que en porta o que no se sap: el mateix cost no es pot cobrir amb dos instruments de la UE, encara que no passe del 100 % (art. 9 del Reglament (UE) 2021/241). No bloqueja: decidix-ho amb la gestoria.';

const avisDobleUe = (factura, ids) => ({
  codi: 'POSSIBLE_DOBLE_FINANCAMENT_UE', factura, expedients: [...ids].sort(), bloqueja: false, missatge: MISSATGE_DOBLE_UE, verificar: VERIFICAR
});

/**
 * Els avisos de finançament d'una llista d'expedients, que NO bloquegen
 * (com avisosExpedient): la decisió és de la persona amb la gestoria.
 *   · POSSIBLE_DOBLE_FINANCAMENT_UE: una factura imputada a un expedient amb
 *     fons europeus i a un altre que també en porta o que no se sap, encara
 *     que la suma no passe del 100 %. A verificar amb la gestoria.
 */
export function avisosFinancament(expedients) {
  if (!Array.isArray(expedients)) throw new TypeError('Cal la llista d’expedients.');
  const perFactura = new Map();
  for (const exp of expedients) {
    for (const imp of exp.imputacions ?? []) {
      const actual = perFactura.get(imp.factura) ?? new Map();
      actual.set(exp.id, fonsEuropeusDe(exp));
      perFactura.set(imp.factura, actual);
    }
  }
  const avisos = [];
  for (const [factura, perExpedient] of perFactura) {
    if (perExpedient.size > 1 && potSerDobleUe([...perExpedient.values()])) avisos.push(avisDobleUe(factura, perExpedient.keys()));
  }
  return congela(avisos.sort((a, b) => (a.factura < b.factura ? -1 : 1)));
}

/**
 * La guarda del doble finançament sobre una llista d'expedients creats amb
 * creaExpedient. Torna les incidències que bloquegen (cap = tot quadra):
 *   · DOBLE_FINANCAMENT: la suma imputada d'una factura passa del 100 %.
 *   · IMPORT_FACTURA_INCOHERENT: la mateixa factura diu imports diferents.
 *   · EXPEDIENT_REPETIT: dos expedients amb el mateix id.
 * El possible doble finançament amb fons europeus per davall del 100 % no
 * bloqueja: és a avisosFinancament.
 */
export function comprovaDobleFinancament(expedients) {
  if (!Array.isArray(expedients)) throw new TypeError('Cal la llista d’expedients.');
  const incidencies = [];
  const vistos = new Set();
  const perFactura = new Map();
  for (const exp of expedients) {
    if (vistos.has(exp.id)) incidencies.push({ codi: 'EXPEDIENT_REPETIT', expedient: exp.id });
    vistos.add(exp.id);
    for (const imp of exp.imputacions ?? []) {
      const actual = perFactura.get(imp.factura) ?? { imports: new Set(), suma: 0, expedients: [] };
      actual.imports.add(imp.importFactura);
      actual.suma += imp.importImputat;
      actual.expedients.push(exp.id);
      perFactura.set(imp.factura, actual);
    }
  }
  for (const [factura, { imports, suma, expedients: ids }] of perFactura) {
    if (imports.size > 1) {
      incidencies.push({ codi: 'IMPORT_FACTURA_INCOHERENT', factura, imports: [...imports].sort((a, b) => a - b), expedients: [...ids].sort() });
      continue;
    }
    const [importFactura] = imports;
    if (suma > importFactura) {
      incidencies.push({ codi: 'DOBLE_FINANCAMENT', factura, importFactura, sumaImputada: suma, exces: suma - importFactura, expedients: [...ids].sort() });
    }
  }
  return congela(incidencies);
}

/**
 * Si una imputació nova cabria: quant queda disponible de la factura entre
 * tots els expedients i, si no cap, per què. Porta també els avisos que no
 * bloquegen (POSSIBLE_DOBLE_FINANCAMENT_UE). No crea ni canvia res.
 * @param {object[]} expedients
 * @param {{ expedient: string, factura: string, importFactura: number, importImputat: number }} nova
 */
export function potImputar(expedients, nova) {
  if (!Array.isArray(expedients)) throw new TypeError('Cal la llista d’expedients.');
  if (!esObjecte(nova) || !esCentims(nova.importFactura) || !esCentims(nova.importImputat)) {
    throw new TypeError('La imputació nova porta factura, importFactura i importImputat en cèntims enters positius.');
  }
  const altres = expedients.flatMap((exp) => (exp.imputacions ?? []).filter((imp) => imp.factura === nova.factura)
    .map((imp) => ({ ...imp, expedient: exp.id, fons: fonsEuropeusDe(exp) })));
  // El programa de l'expedient nou, si és a la llista; si no, no se sap.
  const fonsNou = fonsEuropeusDe(expedients.find((exp) => exp.id === nova.expedient));
  const altresExpedients = altres.filter((imp) => imp.expedient !== nova.expedient);
  const avisos = altresExpedients.length && potSerDobleUe([fonsNou, ...altresExpedients.map((imp) => imp.fons)])
    ? [avisDobleUe(nova.factura, new Set([nova.expedient, ...altresExpedients.map((imp) => imp.expedient)]))]
    : [];
  if (altres.some((imp) => imp.importFactura !== nova.importFactura)) {
    return congela({ possible: false, disponible: null, codi: 'IMPORT_FACTURA_INCOHERENT', avisos });
  }
  if (altres.some((imp) => imp.expedient === nova.expedient)) {
    return congela({ possible: false, disponible: null, codi: 'FACTURA_REPETIDA', avisos });
  }
  const disponible = nova.importFactura - altres.reduce((suma, imp) => suma + imp.importImputat, 0);
  return congela(nova.importImputat <= disponible
    ? { possible: true, disponible, codi: null, avisos }
    : { possible: false, disponible: Math.max(0, disponible), codi: 'DOBLE_FINANCAMENT', avisos });
}
