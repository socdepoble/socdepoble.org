/**
 * formulari.js — de la pantalla de Facturació al nucli, i tornada. Pur.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; pas 2 del mapa de la Gestoria). La pantalla treballa amb textos (el
 * que escriu la persona: «12,50», «2,5», «46999»); el nucli de facturació,
 * amb cèntims, mil·lèsimes i dates ISO. Ací es fa el pas d'un costat a
 * l'altre, sense endevinar res:
 *   · el perfil fiscal: el formulari curt de l'empresa (NIF, noms, domicili
 *     fiscal i data de pas) sobre la configuració de configEmpresa.js; si la
 *     persona n'ha importat una de sencera (comptes, prefixos, altres
 *     domicilis), es conserva tot el que el formulari no mostra;
 *   · el llegat: els números de l'eina d'abans, un per línia (els pintats amb
 *     espai, «F26 0001», també), cap a sembraLlegat;
 *   · la factura: tipus F1, F2 o F3, client, línies, IVA i «IVA inclòs»
 *     només a la simplificada; els errors de lectura en llenguatge planer i,
 *     si la lectura és bona, els totals que calcularà el nucli (els mateixos
 *     de creaFacturaEmesa, perquè es calculen amb la seua anàlisi);
 *   · Onada 6 (261009): la data de l'operació si és una altra, la retenció
 *     d'IRPF (cap, 7 % o 15 %), l'exempció de l'article 20 (E1) i la
 *     rectificativa: R1-R4 per la causa, o R5 si corregix tiquets, per
 *     substitució (amb l'import de les rectificades, tret del llibre) o per
 *     diferències. Que les rectificades siguen del llibre i vives ho torna a
 *     comprovar el nucli dins de l'emissió (FACTURA_RECTIFICADA_INEXISTENT).
 *     Correcció de la revisió (261009): les triades han de ser d'un sol
 *     client, el client copiat va darrere de la tria (commutaRectificada) i,
 *     si el client escrit no és el de la factura, es diu (avisDelClient);
 *   · el llibre: cada alta amb el seu estat (emesa o anul·lada) i els textos
 *     de la verificació de la cadena.
 * Sense DOM, React ni xarxa.
 */
import { ESQUEMA_CONFIG_EMPRESA, emissorDe, llegixConfigEmpresa, validaConfigEmpresa } from '../../facturacio/configEmpresa.js';
import { TIPUS_IVA, analitza } from '../../facturacio/facturaEmesa.js';
import { canvisFixosDeConfig } from '../../facturacio/magatzemPerfil.js';
import { formatImport, parseImport } from '../../nucli/diners.js';

/** L'id del domicili fiscal d'una configuració feta des de la pantalla. */
export const ID_DOMICILI_FISCAL = 'fiscal';

/** Els tipus que emet la pantalla, amb el text per a qui no és del ram. La
    rectificativa (Onada 6, 261009) és R1-R4 o, si corregix tiquets, R5: el
    tipus exacte el decidix tipusEfectiu. */
export const OPCIONS_TIPUS = Object.freeze([
  Object.freeze({ valor: 'F1', etiqueta: 'Factura completa', ajuda: 'La de sempre: porta les dades del client.' }),
  Object.freeze({ valor: 'F2', etiqueta: 'Factura simplificada (tiquet)', ajuda: 'Sense dades del client, fins a 400 € amb l’IVA inclòs.' }),
  Object.freeze({
    valor: 'F3', etiqueta: 'Factura completa en lloc de tiquets',
    ajuda: 'Quan un client et demana la factura d’uns tiquets que ja li havies fet.'
  }),
  Object.freeze({
    valor: 'R', etiqueta: 'Factura rectificativa',
    ajuda: 'Per a corregir una factura que ja has emés: la del llibre no es toca, esta la corregix.'
  })
]);

/** Els tipus d'IVA del selector, com a text («21»), i l'exempció de l'article 20 de la Llei 37/1992 (E1). */
export const OPCIONS_IVA = Object.freeze([
  ...TIPUS_IVA.map((t) => Object.freeze({ valor: String(t), etiqueta: `${t} %` })),
  Object.freeze({ valor: 'E1', etiqueta: 'Exempta (art. 20 de la Llei de l’IVA)' })
]);

/** La retenció d'IRPF de qui factura una activitat professional (Onada 6, 261009). */
export const OPCIONS_RETENCIO = Object.freeze([
  Object.freeze({ valor: '', etiqueta: 'Sense retenció' }),
  Object.freeze({ valor: '7', etiqueta: '7 % (inici d’activitat: l’any d’alta i els dos següents)' }),
  Object.freeze({ valor: '15', etiqueta: '15 % (activitat professional)' })
]);

/** La causa d'una rectificativa d'una factura completa (art. 80 de la Llei 37/1992). */
export const OPCIONS_CAUSA = Object.freeze([
  Object.freeze({ valor: 'R1', etiqueta: 'Un error, un descompte, una devolució o un canvi del preu' }),
  Object.freeze({ valor: 'R2', etiqueta: 'El client és en concurs de creditors' }),
  Object.freeze({ valor: 'R3', etiqueta: 'Un cobrament que ja no es podrà fer (crèdit incobrable)' }),
  Object.freeze({ valor: 'R4', etiqueta: 'Una altra causa' })
]);

/** Com corregix: per substitució (S) o per diferències (I). */
export const OPCIONS_MODALITAT = Object.freeze([
  Object.freeze({ valor: 'S', etiqueta: 'La substituïx sencera', ajuda: 'Escrius la factura com havia de ser, amb totes les línies.' }),
  Object.freeze({ valor: 'I', etiqueta: 'Només la diferència', ajuda: 'Escrius només el que canvia; el que resta, amb el preu en negatiu (-12,50).' })
]);

/* Els noms dels tipus de factura per a la llista del llibre. */
const NOM_TIPUS = Object.freeze({
  F1: 'Completa', F2: 'Simplificada', F3: 'En lloc de tiquets',
  R1: 'Rectificativa', R2: 'Rectificativa', R3: 'Rectificativa', R4: 'Rectificativa', R5: 'Rectificativa de tiquet'
});

const net = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/**
 * Una data ISO en la forma de la pantalla: '2026-10-07' → '07/10/2026'. '' si no ho és.
 * @param {string} iso
 * @returns {string}
 */
export function dataCurta(iso) {
  const r = typeof iso === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  return r ? `${r[3]}/${r[2]}/${r[1]}` : '';
}

/* ── Perfil fiscal ─────────────────────────────────────────────────────── */

/**
 * El formulari curt de l'empresa a partir d'una configuració (o buit).
 * @param {object|null} config
 * @returns {{ nif: string, nom: string, nomComercial: string, adreca: string, codiPostal: string,
 *   poblacio: string, provincia: string, dataPas: string }}
 */
export function formulariDeConfig(config) {
  const fiscal = (Array.isArray(config?.domicilis) ? config.domicilis : []).find((d) => d?.id === config?.domiciliFiscal) ?? {};
  return {
    nif: config?.nif ?? '',
    nom: config?.nom ?? '',
    nomComercial: config?.nomComercial ?? '',
    adreca: fiscal.adreca ?? '',
    codiPostal: fiscal.codiPostal ?? '',
    poblacio: fiscal.poblacio ?? '',
    provincia: fiscal.provincia ?? '',
    dataPas: config?.facturacio?.dataPas ?? ''
  };
}

/**
 * La configuració de l'empresa (configEmpresa.js) del formulari curt. Sobre
 * `base` (la importada o la desada): el formulari substituïx el NIF, els
 * noms, el domicili fiscal i la data de pas, i conserva la resta (comptes,
 * logo, prefixos i els altres domicilis).
 * @param {object} formulari el de formulariDeConfig
 * @param {object|null} [base]
 * @returns {object}
 */
export function configDeFormulari(formulari, base = null) {
  const idFiscal = typeof base?.domiciliFiscal === 'string' && base.domiciliFiscal ? base.domiciliFiscal : ID_DOMICILI_FISCAL;
  const altres = (Array.isArray(base?.domicilis) ? base.domicilis : []).filter((d) => d?.id !== idFiscal);
  const resta = { ...(base ?? {}) };
  delete resta.nomComercial;
  const prefixos = base?.facturacio?.prefixos;
  const dataPas = net(formulari.dataPas);
  return {
    ...resta,
    esquema: ESQUEMA_CONFIG_EMPRESA,
    nif: net(formulari.nif),
    nom: net(formulari.nom),
    ...(net(formulari.nomComercial) ? { nomComercial: net(formulari.nomComercial) } : {}),
    domicilis: [{
      id: idFiscal,
      adreca: net(formulari.adreca),
      codiPostal: net(formulari.codiPostal),
      poblacio: net(formulari.poblacio),
      ...(net(formulari.provincia) ? { provincia: net(formulari.provincia) } : {})
    }, ...altres],
    domiciliFiscal: idFiscal,
    facturacio: { ...(prefixos ? { prefixos } : {}), ...(dataPas ? { dataPas } : {}) }
  };
}

/**
 * Els errors del perfil, en llenguatge planer (llista buida si es pot desar).
 * Amb `fixada` (la configuració vigent, quan ja hi ha factures emeses amb el
 * seu NIF), també el NIF o la data de pas que canvien: els mateixos textos que
 * el magatzem del perfil (PERFIL_FIXAT), abans de desar. Troballa F4 (261007).
 * @param {object} formulari
 * @param {object|null} [base]
 * @param {object|null} [fixada]
 * @returns {string[]}
 */
export function errorsDelPerfil(formulari, base = null, fixada = null) {
  const config = configDeFormulari(formulari, base);
  const errors = validaConfigEmpresa(config);
  if (!net(formulari.dataPas)) {
    errors.push('Falta la data de pas: el dia des del qual factures amb este programa (abans, amb l’eina que feies servir).');
  }
  if (errors.length || !fixada) return errors;
  return canvisFixosDeConfig(fixada, llegixConfigEmpresa(config));
}

/**
 * Una configuració importada (el text d'un .json): la configuració, o els errors.
 * @param {string} text
 * @returns {{ config: object|null, errors: string[] }}
 */
export function configDeJson(text) {
  let config;
  try {
    config = JSON.parse(text);
  } catch {
    return { config: null, errors: ['El fitxer no és JSON: tria el fitxer de configuració de l’empresa.'] };
  }
  const errors = validaConfigEmpresa(config);
  return errors.length ? { config: null, errors } : { config, errors };
}

/**
 * El formulari d'una configuració importada. Amb `fixada` (ja hi ha factures
 * emeses), la data de pas és la vigent (no es pot canviar) i un fitxer d'un
 * altre NIF es refusa: és d'una altra empresa. Troballa F4 (261007).
 * @param {object} config la de configDeJson, ja validada
 * @param {object|null} [fixada]
 * @returns {{ formulari: object|null, errors: string[] }}
 */
export function formulariImportat(config, fixada = null) {
  const formulari = formulariDeConfig(config);
  if (!fixada) return { formulari, errors: [] };
  const nif = llegixConfigEmpresa(config).nif;
  if (nif !== fixada.nif) {
    return {
      formulari: null,
      errors: [`Este fitxer és d’una altra empresa (${nif}). Ja hi ha factures emeses amb el NIF ${fixada.nif}, que no es pot canviar.`]
    };
  }
  return { formulari: { ...formulari, nif: fixada.nif, dataPas: fixada.facturacio?.dataPas ?? '' }, errors: [] };
}

/* ── Llegat ────────────────────────────────────────────────────────────── */

/**
 * Els números de factura d'un text: un per línia, o separats per comes o
 * punts i comes (els números pintats porten espais: «F26 0001»).
 * @param {string} text
 * @returns {string[]}
 */
export function numerosDelText(text) {
  return (typeof text === 'string' ? text : '').split(/[\n\r,;]+/).map((n) => n.trim()).filter(Boolean);
}

/**
 * El resum del llegat per a la pantalla: una frase per sèrie.
 * @param {{ series: object[], noReconeguts: string[] }} llegat el de sembraLlegat
 * @returns {string[]}
 */
export function resumDelLlegat(llegat) {
  const series = Array.isArray(llegat?.series) ? llegat.series : [];
  return series.map((s) => {
    const absents = s.nombreAbsents ? `, ${s.nombreAbsents === 1 ? 'falta 1' : `falten ${s.nombreAbsents}`}` : '';
    const quantsRepetits = s.repetits?.length ?? 0;
    const repetits = quantsRepetits ? `, ${quantsRepetits === 1 ? '1 repetit' : `${quantsRepetits} repetits`}` : '';
    const factures = s.vistos === 1 ? '1 factura' : `${s.vistos} factures`;
    return `Sèrie ${s.prefix} de ${s.any}: fins al número ${s.ultim} (${factures}${absents}${repetits}). Queda tancada.`;
  });
}

/* ── Factura ───────────────────────────────────────────────────────────── */

/** Una línia buida del formulari. */
export const liniaBuida = () => ({ concepte: '', quantitat: '1', preu: '', tipusIva: '21' });

/** El client buit del formulari. */
export const clientBuit = () => ({ nif: '', nom: '', adreca: '', codiPostal: '', poblacio: '' });

/**
 * El client d'una factura del llibre (el seu destinatari), en la forma del formulari.
 * @param {object|null} destinatari
 * @returns {{ nif: string, nom: string, adreca: string, codiPostal: string, poblacio: string }}
 */
export function clientDeDestinatari(destinatari) {
  return {
    nif: destinatari?.nif ?? '', nom: destinatari?.nom ?? '', adreca: destinatari?.domicili?.adreca ?? '',
    codiPostal: destinatari?.domicili?.codiPostal ?? '', poblacio: destinatari?.domicili?.poblacio ?? ''
  };
}

/* El NIF com es compara: sense espais ni guions, en majúscules. */
const nifNet = (nif) => net(nif).replace(/[\s-]/g, '').toUpperCase();
/* Dos clients del formulari són el mateix si coincidixen tots els camps (el NIF, net). */
const mateixClient = (a, b) => Object.keys(clientBuit())
  .every((camp) => (camp === 'nif' ? nifNet(a?.nif) === nifNet(b?.nif) : net(a?.[camp]) === net(b?.[camp])));
const esClientBuit = (client) => Object.keys(clientBuit()).every((camp) => !net(client?.[camp]));

/**
 * El formulari d'una factura nova.
 * @param {string} dataExpedicio la d'avui, «aaaa-mm-dd»
 * @param {string} [tipus]
 */
export function facturaBuida(dataExpedicio, tipus = 'F1') {
  return {
    tipus, dataExpedicio, dataOperacio: '', ivaInclos: true, descripcio: '', retencio: '',
    client: clientBuit(), clientCopiat: false,
    linies: [liniaBuida()],
    substituides: [],
    rectificades: [], causa: 'R1', modalitat: 'S'
  };
}

/* Una quantitat com l'escriu la persona («2», «2,5», «0.125»): fins a tres decimals; null si no ho és. */
export function llegixQuantitat(text) {
  const t = net(text);
  if (!/^\d{1,9}(?:[.,]\d{1,3})?$/.test(t)) return null;
  const valor = Number(t.replace(',', '.'));
  return valor > 0 ? valor : null;
}

/* La clau d'una factura del llibre al formulari de la F3. */
export const clauDeFactura = ({ numSerie, dataExpedicio }) => `${numSerie}|${dataExpedicio}`;
const deClau = (clau) => {
  const [numSerie, dataExpedicio] = String(clau).split('|');
  return { numSerie, dataExpedicio };
};

/* Els tipus sense destinatari: la simplificada i la seua rectificativa. */
const SENSE_CLIENT = Object.freeze(['F2', 'R5']);
const esSimplificada = (tipusFactura) => SENSE_CLIENT.includes(tipusFactura);

/**
 * Les factures del llibre que una rectificativa pot corregir: les altes no
 * anul·lades, de la més nova a la més antiga, amb el que en cal saber.
 * @param {ReadonlyArray<object>} registres la cadena d'un emissor
 * @returns {{ clau: string, etiqueta: string, simplificada: boolean, base: number, quota: number, destinatari: object|null }[]}
 */
export function rectificables(registres) {
  return filesDelLlibre(registres).filter((f) => !f.anulada).map((f) => ({
    clau: clauDeFactura(f.registre),
    etiqueta: `${f.numSerie} · ${f.data} · ${f.client} · ${f.total}`,
    simplificada: esSimplificada(f.registre.tipusFactura),
    base: f.registre.factura?.baseTotal ?? 0,
    quota: f.registre.factura?.quotaTotal ?? 0,
    destinatari: f.registre.factura?.destinatari ?? null
  }));
}

/**
 * El TipoFactura que tindrà la factura del formulari: el triat, o, per a una
 * rectificativa, R5 si corregix tiquets (simplificades) i, si no, el de la
 * causa (R1 per defecte).
 * @param {object} formulari
 * @param {ReadonlyArray<object>} [registres]
 * @returns {string|null}
 */
export function tipusEfectiu(formulari, registres = []) {
  if (formulari?.tipus !== 'R') return formulari?.tipus ?? null;
  const claus = Array.isArray(formulari.rectificades) ? formulari.rectificades : [];
  const triades = rectificables(registres).filter((r) => claus.includes(r.clau));
  if (triades.length && triades.every((r) => r.simplificada)) return 'R5';
  return OPCIONS_CAUSA.some((o) => o.valor === formulari.causa) ? formulari.causa : 'R1';
}

/* Les factures triades del llibre, en l'ordre en què s'han triat (les que ja no hi són, fora). */
function triadesDe(claus, registres) {
  const llista = rectificables(registres);
  return (Array.isArray(claus) ? claus : []).map((clau) => llista.find((r) => r.clau === clau)).filter(Boolean);
}

/**
 * Tria o desfà la tria d'una factura a corregir. El client va darrere de la
 * tria mentre la persona no l'ha escrit (és buit, o és el copiat:
 * `clientCopiat`): passa a ser el de la primera factura triada amb client, o
 * buit si ja no en queda cap. Un client escrit o corregit a mà no es toca, i
 * si no és el de la factura ho diu avisDelClient. Correcció de la revisió
 * (261009): triar A, desfer-la i triar B deixava el client d'A.
 * @param {object} formulari el de facturaBuida
 * @param {string} clau la de clauDeFactura
 * @param {ReadonlyArray<object>} [registres] la cadena de l'emissor
 * @returns {object} el formulari nou
 */
export function commutaRectificada(formulari, clau, registres = []) {
  const abans = Array.isArray(formulari?.rectificades) ? formulari.rectificades : [];
  const rectificades = abans.includes(clau) ? abans.filter((c) => c !== clau) : [...abans, clau];
  if (!esClientBuit(formulari?.client) && formulari?.clientCopiat !== true) return { ...formulari, rectificades };
  const primera = triadesDe(rectificades, registres).find((r) => !r.simplificada && r.destinatari);
  return {
    ...formulari, rectificades,
    client: primera ? clientDeDestinatari(primera.destinatari) : clientBuit(),
    clientCopiat: Boolean(primera)
  };
}

/**
 * L'avís quan el client d'una rectificativa no és el de la factura que
 * corregix, amb el client de la factura per a copiar-lo. Pot ser a propòsit
 * (corregir el NIF o el domicili del client), i per això avisa i no refusa.
 * null si coincidix, si encara no s'ha triat cap factura amb client o si no és
 * una rectificativa.
 * @param {object} formulari
 * @param {ReadonlyArray<object>} [registres]
 * @returns {{ text: string, client: object }|null}
 */
export function avisDelClient(formulari, registres = []) {
  if (formulari?.tipus !== 'R') return null;
  const primera = triadesDe(formulari.rectificades, registres).find((r) => !r.simplificada && r.destinatari);
  if (!primera) return null;
  const client = clientDeDestinatari(primera.destinatari);
  if (mateixClient(client, formulari.client)) return null;
  return {
    text: `La factura que corregixes és de ${client.nom} (NIF ${client.nif}). Deixa el client així només si el que corregixes són les seues dades.`,
    client
  };
}

/* La part de rectificativa de les dades: el tipus, la manera, les factures i, per substitució, l'import rectificat. */
function llegixRectificacio(formulari, registres, errors) {
  const claus = Array.isArray(formulari.rectificades) ? formulari.rectificades : [];
  if (!claus.length) {
    errors.push('Tria quina factura corregix esta rectificativa.');
    return null;
  }
  const llista = rectificables(registres);
  const triades = claus.map((clau) => llista.find((r) => r.clau === clau) ?? null);
  if (triades.some((r) => !r)) {
    errors.push('Alguna de les factures triades ja no es pot rectificar (no és al llibre o està anul·lada): torna-les a triar.');
    return null;
  }
  const simplificades = triades.filter((r) => r.simplificada).length;
  if (simplificades && simplificades !== triades.length) {
    errors.push('Una rectificativa corregix tiquets o factures completes, no les dues coses alhora.');
    return null;
  }
  /* Correcció de la revisió (261009): una factura té un sol client, i la rectificativa que en corregix
     diverses també. El nucli ho torna a refusar dins de l'emissió (RECTIFICADES_DE_DIVERSOS_CLIENTS). */
  if (new Set(triades.filter((r) => !r.simplificada).map((r) => nifNet(r.destinatari?.nif))).size > 1) {
    errors.push('Una rectificativa corregix factures d’un sol client, i les triades són de clients diferents: fes-ne una per a cada client.');
    return null;
  }
  if (!OPCIONS_MODALITAT.some((o) => o.valor === formulari.modalitat)) {
    errors.push('Tria si la rectificativa substituïx la factura sencera o només porta la diferència.');
    return null;
  }
  const tipus = tipusEfectiu(formulari, registres);
  return {
    tipus,
    dades: {
      tipusRectificativa: formulari.modalitat,
      rectificades: triades.map((r) => deClau(r.clau)),
      ...(formulari.modalitat === 'S' ? {
        importRectificat: { base: triades.reduce((s, r) => s + r.base, 0), quota: triades.reduce((s, r) => s + r.quota, 0) }
      } : {})
    }
  };
}

/**
 * Les dades per a emissio.emet, o els errors de lectura en llenguatge planer.
 * No valida la factura: això ho fa el nucli (FACTURA_INVALIDA, amb la llista).
 * Una rectificativa necessita la cadena del llibre, on són les factures que corregix.
 * @param {object} formulari el de facturaBuida
 * @param {ReadonlyArray<object>} [registres] la cadena de l'emissor
 * @returns {{ dades: object|null, errors: string[] }}
 */
export function dadesDeFactura(formulari, registres = []) {
  const errors = [];
  const triat = formulari?.tipus;
  if (!OPCIONS_TIPUS.some((o) => o.valor === triat)) errors.push('Tria el tipus de factura.');
  const rectificacio = triat === 'R' ? llegixRectificacio(formulari, registres, errors) : null;
  const tipus = rectificacio ? rectificacio.tipus : triat;
  const senseClient = esSimplificada(tipus);
  const linies = (Array.isArray(formulari?.linies) ? formulari.linies : []).map((l, i) => {
    const quantitat = llegixQuantitat(l.quantitat);
    if (quantitat === null) errors.push(`Línia ${i + 1}: la quantitat ha de ser un número més gran que zero (per exemple 1 o 2,5).`);
    const preuUnitari = parseImport(net(l.preu));
    if (preuUnitari === null) errors.push(`Línia ${i + 1}: el preu no s’entén; escriu-lo amb coma per als cèntims, com 12,50.`);
    const exempta = typeof l.tipusIva === 'string' && l.tipusIva.startsWith('E');
    return { concepte: net(l.concepte), quantitat, preuUnitari, ...(exempta ? { exempcio: l.tipusIva } : { tipusIva: Number(l.tipusIva) }) };
  });
  if (!linies.length) errors.push('Afig almenys una línia.');
  const substituides = Array.isArray(formulari?.substituides) ? formulari.substituides : [];
  if (tipus === 'F3' && !substituides.length) errors.push('Tria quins tiquets substituïx esta factura.');
  const retencio = senseClient ? '' : net(formulari?.retencio);
  if (retencio && !OPCIONS_RETENCIO.some((o) => o.valor === retencio)) errors.push('Tria la retenció d’IRPF de la llista.');
  const dataOperacio = net(formulari?.dataOperacio);
  if (errors.length) return { dades: null, errors };
  const client = formulari.client ?? {};
  return {
    errors,
    dades: {
      tipus,
      dataExpedicio: formulari.dataExpedicio,
      ...(dataOperacio && dataOperacio !== formulari.dataExpedicio ? { dataOperacio } : {}),
      ...(senseClient ? {} : {
        destinatari: { nif: net(client.nif), nom: net(client.nom), domicili: { adreca: net(client.adreca), codiPostal: net(client.codiPostal), poblacio: net(client.poblacio) } }
      }),
      ...(senseClient && formulari.ivaInclos ? { ivaInclos: true } : {}),
      ...(net(formulari.descripcio) ? { descripcio: net(formulari.descripcio) } : {}),
      linies,
      ...(retencio ? { retencio: { percentatge: Number(retencio) } } : {}),
      ...(tipus === 'F3' ? { substituides: substituides.map(deClau) } : {}),
      ...(rectificacio ? rectificacio.dades : {})
    }
  };
}

/**
 * Els totals que tindrà la factura, calculats amb l'anàlisi del nucli, o null
 * si encara no és una factura vàlida (no llança).
 * @param {object} dades les de dadesDeFactura
 * @param {object} config la configuració vigent (l'emissor)
 * @param {string} [numSerie] el número que es mostra (no afecta el càlcul)
 * @returns {{ baseTotal: number, quotaTotal: number, importTotal: number, desglossament: object[],
 *   retencio: { percentatge: number, import: number }|null, liquid: number }|null}
 */
export function totalsDeFactura(dades, config, numSerie = 'A2000-0001') {
  if (!dades || !config) return null;
  try {
    const { errors, factura } = analitza({ ...dades, numSerie, emissor: emissorDe(config) });
    if (errors.length) return null;
    const { baseTotal, quotaTotal, importTotal, desglossament, retencio, liquid } = factura;
    return { baseTotal, quotaTotal, importTotal, desglossament, retencio: retencio ?? null, liquid };
  } catch {
    return null;
  }
}

/**
 * Els errors que hi trobaria el nucli (creaFacturaEmesa) amb l'emissor de la
 * configuració i el número que es mostra: els mateixos textos, abans d'emetre.
 * @param {object} dades les de dadesDeFactura
 * @param {object} config la configuració vigent
 * @param {string} numSerie
 * @returns {string[]}
 */
export function errorsDeFactura(dades, config, numSerie) {
  if (!dades || !config) return ['Falten les dades de l’empresa (pas 1).'];
  try {
    return analitza({ ...dades, numSerie, emissor: emissorDe(config) }).errors;
  } catch (error) {
    return [error?.message ?? 'La factura no es pot comprovar.'];
  }
}

/** Un import en cèntims, com el llig la persona: «1.234,56 €». */
export const euros = (centims) => formatImport(centims);

/* ── El llibre ─────────────────────────────────────────────────────────── */

/**
 * Les altes d'una cadena, de la més nova a la més antiga, amb el seu estat.
 * @param {ReadonlyArray<object>} registres la cadena d'un emissor, en ordre
 * @returns {{ registre: object, numSerie: string, data: string, tipus: string, client: string, total: string, anulada: boolean }[]}
 */
export function filesDelLlibre(registres) {
  const llista = Array.isArray(registres) ? registres : [];
  const anulades = new Set(llista.filter((r) => r.tipusRegistre === 'anulacio').map(clauDeFactura));
  return llista.filter((r) => r.tipusRegistre === 'alta').reverse().map((r) => ({
    registre: r,
    numSerie: r.numSerie,
    data: dataCurta(r.dataExpedicio),
    tipus: NOM_TIPUS[r.tipusFactura] ?? r.tipusFactura,
    client: r.factura?.destinatari?.nom ?? 'Sense client',
    total: euros(r.importTotal),
    anulada: anulades.has(clauDeFactura(r))
  }));
}

/**
 * Els tiquets (F2) del llibre que una F3 pot substituir: emesos, no anul·lats
 * i que cap altra F3 viva no substituïx ja (troballa F5, 261007: un tiquet,
 * una substitució; el nucli ho refusa amb FACTURA_JA_SUBSTITUIDA).
 * @param {ReadonlyArray<object>} registres
 * @returns {{ clau: string, etiqueta: string }[]}
 */
export function tiquetsSubstituibles(registres) {
  const files = filesDelLlibre(registres);
  const jaSubstituits = new Set(files.filter((f) => f.registre.tipusFactura === 'F3' && !f.anulada)
    .flatMap((f) => (Array.isArray(f.registre.factura?.substituides) ? f.registre.factura.substituides : []).map(clauDeFactura)));
  return files.filter((f) => f.registre.tipusFactura === 'F2' && !f.anulada && !jaSubstituits.has(clauDeFactura(f.registre)))
    .map((f) => ({ clau: clauDeFactura(f.registre), etiqueta: `${f.numSerie} · ${f.data} · ${f.total}` }));
}

/**
 * El que es diu de la verificació de la cadena.
 * @param {{ valida: boolean, registres: number, incidencies: object[] }|null} informe el de verificaCadena
 * @returns {{ to: 'exit'|'avis'|'error'|'info', insignia: string, titol: string, text: string, incidencies: string[] }}
 */
export function estatDeLaCadena(informe) {
  if (!informe) {
    return { to: 'info', insignia: 'Sense verificar', titol: 'Encara no s’ha verificat la cadena', text: '', incidencies: [] };
  }
  const incidencies = informe.incidencies.map((i) => (i.numSerie ? `${i.numSerie}: ${i.missatge}` : i.missatge));
  /* Troballes F2 i F3 (261007): amb incidències no s'emet ni s'anul·la, i la via
     d'eixida és restaurar la còpia bona; una còpia feta ara no compta com a bona. */
  if (!informe.valida) {
    return {
      to: 'error', insignia: 'Amb incidències', titol: 'La cadena del llibre té incidències',
      text: 'Al llibre li falta algun registre, o algun no quadra amb el seu anterior o s’ha tocat després de fer-lo. '
        + 'Mentre no s’arregle, no es pot emetre ni anul·lar cap factura. Si tens una còpia bona del llibre, restaura-la al pas 5; '
        + 'si no, porta a la gestoria una còpia del llibre tal com està.',
      incidencies
    };
  }
  const text = {
    0: 'El llibre encara és buit.',
    1: 'L’únic registre del llibre s’ha tornat a calcular: ningú no l’ha tocat.'
  }[informe.registres] ?? `Els ${informe.registres} registres del llibre s’han tornat a calcular: cada un va darrere de l’anterior i ningú no l’ha tocat.`;
  if (incidencies.length) return { to: 'avis', insignia: 'Correcta, amb avisos', titol: 'La cadena és correcta, però hi ha avisos', text, incidencies };
  return { to: 'exit', insignia: 'Correcta', titol: 'La cadena és correcta', text, incidencies };
}
