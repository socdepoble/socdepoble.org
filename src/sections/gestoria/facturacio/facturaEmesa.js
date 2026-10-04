/**
 * facturaEmesa.js — la factura que emet el negoci, tal com la registrarà Veri*Factu.
 *
 * Model separat de nucli/model.js: allà, un «ingrés» és una factura LLEGIDA
 * d'una carpeta per al full trimestral, i es pot editar. Ací la factura naix
 * validada i congelada en profunditat, i cap funció la modifica: una
 * correcció és una factura rectificativa (R1-R5) o l'anul·lació del seu
 * registre (registre/registreAnulacio.js), mai una edició.
 *
 * Diners en cèntims enters; quantitats amb fins a tres decimals; la base de
 * cada línia i la quota de cada tipus d'IVA, arredonides a la meitat lluny
 * de zero. El desglossament agrupa per tipus d'IVA (o per causa d'exempció)
 * i la quota es calcula sobre la base del grup, no línia a línia. Tot el
 * càlcul es fa amb enters segurs: per damunt del sostre (MAX_BASE) hi ha un
 * error de validació, mai una excepció.
 *
 * Fase 0 (ordre del Mestre del 261004): IVA en règim general, operacions
 * subjectes i no exemptes (S1) o exemptes (E1-E6). Queden PENDENTS el
 * recàrrec d'equivalència, les operacions no subjectes (N1, N2), la inversió
 * del subjecte passiu (S2), els destinataris estrangers (IDOtro), els altres
 * règims i la marca FacturaSimplificadaArt7273. JS pur: sense DOM, React ni xarxa.
 *
 * Onada 2 (ordre del Mestre del 261004):
 *   · el domicili de l'emissor i del destinatari, obligatori a les completes;
 *     la factura congela el triat (un mateix NIF pot tindre diverses adreces);
 *   · el nom comercial, separat del legal;
 *   · el detall (admet salts de línia) i la unitat de cada línia, fora dels
 *     camps fiscals: viatgen dins de la factura que porta el registre, però no
 *     entren a l'empremta ni als camps de l'AEAT;
 *   · la descripció de l'operació, derivada del primer concepte si no se'n dona;
 *   · el venciment i el cobrament: el mètode i el compte, que és una
 *     referència opaca a la configuració de l'empresa, mai el número;
 *   · el mode «IVA inclòs» de la simplificada del TPV: el preu ja porta l'IVA,
 *     el total és exactament la suma dels preus i la base se'n separa per grup.
 *
 * Ús:
 *   const factura = creaFacturaEmesa({
 *     tipus: 'F1', numSerie: 'A2026-0001', dataExpedicio: '2026-10-04',
 *     emissor: { nif, nom: 'Forn del Poble', domicili }, destinatari: { nif, nom: 'Bar de la Plaça', domicili },
 *     linies: [{ concepte: 'Pa de llenya', quantitat: 12, preuUnitari: 250, tipusIva: 4, unitat: 'peces' }]
 *   });
 */
import { jsonCanonic } from '../../tractors/nucli/canonic.js';
import { validaNif } from '../nucli/nif.js';
import {
  arrodoneix, copiaCongelada, errorAmbCodi, esDataIso, esReferenciaOpaca, textNet, textValid
} from './comu.js';

/* Versió del contracte del model: si canvia el que es guarda, canvia el nom.
   La v2 (onada 2) porta domicilis, nom comercial, detall, venciment, cobrament
   i el mode «IVA inclòs». No hi ha cap factura v1 desada: el nucli encara no
   està endollat (frontera.test.js). */
export const ESQUEMA_FACTURA = 'sdp.gestoria.factura-emesa.v2';

/* TipoFactura de l'AEAT: F1 completa, F2 simplificada, F3 emesa en
   substitució de simplificades; R1-R4 rectificatives (art. 80.1, 80.2 i
   80.6 de la Llei de l'IVA; 80.3; 80.4; la resta de causes) i R5
   rectificativa de simplificades. */
export const TIPUS_FACTURA = Object.freeze(['F1', 'F2', 'F3', 'R1', 'R2', 'R3', 'R4', 'R5']);
export const RECTIFICATIVES = Object.freeze(['R1', 'R2', 'R3', 'R4', 'R5']);
/* La simplificada (F2) i la seua rectificativa (R5): van sense destinatari. */
export const SENSE_DESTINATARI = Object.freeze(['F2', 'R5']);
/* Les completes (art. 6.1.e del Reglament de facturació, RD 1619/2012) i les
   rectificatives que en fan les voltes (art. 15): porten el domicili de
   l'emissor i el del destinatari. */
export const AMB_DOMICILI = Object.freeze(['F1', 'F3', 'R1', 'R2', 'R3', 'R4']);
/* S: per substitució (porta l'import de la factura rectificada); I: per diferències. */
export const TIPUS_RECTIFICATIVA = Object.freeze(['S', 'I']);
/* Tipus d'IVA admesos per defecte, en percentatge. Quan la llei en canvie
   un, es passa la llista nova a creaFacturaEmesa({ … }, { tipusIva }). */
export const TIPUS_IVA = Object.freeze([4, 10, 21]);
/* Causes d'exempció (OperacionExenta): la línia exempta no porta tipus ni quota. */
export const EXEMPCIONS = Object.freeze(['E1', 'E2', 'E3', 'E4', 'E5', 'E6']);
/* Factura simplificada: fins a 400 € IVA inclòs, o 3.000 € en els sectors de
   l'art. 4.1 del Reglament de facturació (RD 1619/2012). En cèntims. */
export const LIMIT_SIMPLIFICADA = 40000;
export const LIMIT_SIMPLIFICADA_SECTORS = 300000;
/* Com es cobra. El compte, si n'hi ha, és una referència a la configuració de l'empresa. */
export const METODES_COBRAMENT = Object.freeze(['transferencia', 'domiciliacio', 'targeta', 'efectiu', 'bizum', 'altre']);
/* Sostre de la base d'una línia, d'un grup i de la factura, en cèntims: 4.500
   milions d'euros. Garantix enters segurs en tot el càlcul (2 × base × 10.000
   més el denominador, per davall de 2^53: la quota, la separació de l'IVA
   inclòs i la retenció). Passar-lo és un error de validació. */
export const MAX_BASE = 450000000000;

const MAX_NOM = 120;
const MAX_TEXT = 500;
const MAX_ADRECA = 200;
const MAX_DETALL = 2000;
const MAX_UNITAT = 20;
const MAX_NUM_SERIE = 60;
const MAX_LINIES = 1000;
const MAX_REFERENCIES = 1000;
/* Com a molt 12 xifres enteres i 2 decimals, com els imports de l'AEAT. */
const MAX_CENTIMS = 99999999999999;
const SOSTRE = '4.500 milions d\'euros';
/* ASCII imprimible, sense espais als extrems. */
const NUM_SERIE = /^[\x21-\x7E](?:[\x20-\x7E]*[\x21-\x7E])?$/;
/* Codi postal: cinc xifres, les dues primeres d'una província (01-52). */
const CODI_POSTAL = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
/* Al detall d'una línia, el salt de línia és l'únic caràcter de control admés. */
const CONTROL_DETALL = /[\u0000-\u0009\u000B-\u001F\u007F]/;

const esLlista = (valor) => Array.isArray(valor);
const esImport = (valor) => Number.isSafeInteger(valor) && Math.abs(valor) <= MAX_CENTIMS;
const donat = (valor) => valor !== undefined && valor !== null;
/* «de l'emissor», «del destinatari». */
const de = (que) => (que.startsWith('el ') ? `del ${que.slice(3)}` : `de ${que}`);
/* El NIF normalitzat d'una persona, si és vàlid; null si no. */
function nifDe(persona) {
  const { valid, normalitzat } = validaNif(persona?.nif);
  return valid ? normalitzat : null;
}

/* Una quantitat amb fins a tres decimals, en mil·lèsimes; null si no ho és o és zero. */
function milesimes(quantitat) {
  if (typeof quantitat !== 'number' || !Number.isFinite(quantitat)) return null;
  const mil = Math.round(quantitat * 1000);
  return mil !== 0 && Number.isSafeInteger(mil) && Math.abs(quantitat * 1000 - mil) < 1e-6 ? mil : null;
}

/* Un percentatge amb fins a dos decimals, en centèsimes (21 → 2100); null si no ho és. */
function centesimes(percentatge) {
  if (typeof percentatge !== 'number' || !Number.isFinite(percentatge) || percentatge < 0 || percentatge > 100) return null;
  const cent = Math.round(percentatge * 100);
  return Math.abs(percentatge * 100 - cent) < 1e-6 ? cent : null;
}

/* El detall d'una línia: admet salts de línia (els \r\n es queden en \n) i cap altre control. */
function detallValid(valor) {
  if (typeof valor !== 'string') return null;
  const net = valor.replace(/\r\n?/g, '\n').trim();
  return net !== '' && net.length <= MAX_DETALL && !CONTROL_DETALL.test(net) ? net : null;
}

/* Un domicili: { adreca, codiPostal, poblacio, provincia? }, en text. Fase 0: només d'Espanya. */
function analitzaDomicili(domicili, que, errors) {
  if (!domicili || typeof domicili !== 'object') {
    errors.push(`Falta el domicili ${de(que)}: { adreca, codiPostal, poblacio }.`);
    return null;
  }
  const adreca = textValid(domicili.adreca, MAX_ADRECA);
  if (!adreca) errors.push(`L'adreça ${de(que)} és obligatòria (com a molt ${MAX_ADRECA} caràcters, en una línia).`);
  const codiPostal = textNet(domicili.codiPostal);
  const codiBo = CODI_POSTAL.test(codiPostal);
  if (!codiBo) errors.push(`El codi postal ${de(que)} són cinc xifres, en text, d'una província (01000-52999).`);
  const poblacio = textValid(domicili.poblacio, MAX_NOM);
  if (!poblacio) errors.push(`La població ${de(que)} és obligatòria (com a molt ${MAX_NOM} caràcters).`);
  const ambProvincia = donat(domicili.provincia);
  const provincia = ambProvincia ? textValid(domicili.provincia, MAX_NOM) : null;
  if (ambProvincia && !provincia) errors.push(`La província ${de(que)}, si hi és, és un text d'una línia.`);
  if (!adreca || !codiBo || !poblacio || (ambProvincia && !provincia)) return null;
  return { adreca, codiPostal, poblacio, ...(provincia ? { provincia } : {}) };
}

/**
 * Un domicili net i els seus errors (la configuració de l'empresa el valida igual que la factura). No llança.
 * @param {object} domicili { adreca, codiPostal, poblacio, provincia? }
 * @param {string} [que] de qui és, per als missatges («l'emissor», «el domicili 2»)
 * @returns {{ errors: string[], domicili: object|null }}
 */
export function validaDomicili(domicili, que = 'l\'empresa') {
  const errors = [];
  const net = analitzaDomicili(domicili, que, errors);
  return { errors, domicili: net };
}

function analitzaPersona(persona, que, errors, { espanyol, ambDomicili }) {
  if (!persona || typeof persona !== 'object') {
    errors.push(`Falta ${que}: { nif, nom${ambDomicili ? ', domicili' : ''} }.`);
    return null;
  }
  const nom = textValid(persona.nom, MAX_NOM);
  if (!nom) errors.push(`El nom ${de(que)} és obligatori (com a molt ${MAX_NOM} caràcters, sense salts de línia).`);
  const ambComercial = donat(persona.nomComercial);
  const nomComercial = ambComercial ? textValid(persona.nomComercial, MAX_NOM) : null;
  if (ambComercial && !nomComercial) errors.push(`El nom comercial ${de(que)}, si hi és, és un text d'una línia de com a molt ${MAX_NOM} caràcters.`);
  const { valid, tipus, normalitzat } = validaNif(persona.nif);
  if (tipus === 'IVA-UE' && !espanyol) {
    errors.push(`El NIF ${de(que)} és d'un altre país: els destinataris estrangers (IDOtro) són PENDENTS a la fase 0.`);
  } else if (!valid || tipus === 'IVA-UE') {
    errors.push(`El NIF ${de(que)} no és un DNI, NIE o CIF vàlid.`);
  }
  /* El domicili, obligatori a les completes; en una simplificada, el de l'emissor és opcional. */
  const ambAdreca = ambDomicili || donat(persona.domicili);
  const domicili = ambAdreca ? analitzaDomicili(persona.domicili, que, errors) : null;
  const bona = nom && valid && tipus !== 'IVA-UE' && (!ambComercial || nomComercial) && (!ambAdreca || domicili);
  return bona ? { nif: normalitzat, nom, ...(nomComercial ? { nomComercial } : {}), ...(domicili ? { domicili } : {}) } : null;
}

/* Una llista de factures anteriors del mateix emissor: [{ numSerie, dataExpedicio }]. */
function analitzaReferencies(llista, que, dataExpedicio, errors) {
  if (!esLlista(llista) || llista.length === 0 || llista.length > MAX_REFERENCIES) {
    errors.push(`Falten ${que}: una llista de { numSerie, dataExpedicio } (de 1 a ${MAX_REFERENCIES}).`);
    return [];
  }
  const vistes = new Set();
  const referencies = [];
  llista.forEach((ref, i) => {
    const numSerie = textNet(ref?.numSerie);
    const valida = NUM_SERIE.test(numSerie) && numSerie.length <= MAX_NUM_SERIE && esDataIso(ref?.dataExpedicio);
    if (!valida) {
      errors.push(`${que} ${i + 1}: cal un número de sèrie i una data «aaaa-mm-dd».`);
      return;
    }
    if (ref.dataExpedicio > dataExpedicio) errors.push(`${que} ${i + 1}: és posterior a esta factura.`);
    const clau = `${numSerie}|${ref.dataExpedicio}`;
    if (vistes.has(clau)) errors.push(`${que} ${i + 1}: repetida.`);
    vistes.add(clau);
    referencies.push({ numSerie, dataExpedicio: ref.dataExpedicio });
  });
  return referencies;
}

function analitzaLinia(linia, i, { tipusIva, ivaInclos }, errors) {
  const on = `Línia ${i + 1}`;
  const concepte = textValid(linia?.concepte, MAX_TEXT);
  if (!concepte) errors.push(`${on}: el concepte és obligatori (com a molt ${MAX_TEXT} caràcters, sense salts de línia).`);
  const mil = milesimes(linia?.quantitat);
  if (mil === null) errors.push(`${on}: la quantitat ha de ser un nombre diferent de zero amb tres decimals com a molt.`);
  const preu = linia?.preuUnitari;
  if (!esImport(preu)) errors.push(`${on}: el preu unitari va en cèntims enters.`);
  const ambTipus = donat(linia?.tipusIva);
  const ambExempcio = donat(linia?.exempcio);
  if (ambTipus === ambExempcio) errors.push(`${on}: porta un tipus d'IVA o una causa d'exempció (E1-E6), i només una de les dues.`);
  if (ambTipus && !tipusIva.includes(linia.tipusIva)) errors.push(`${on}: tipus d'IVA no admés (${tipusIva.join(', ')}).`);
  if (ambExempcio && !EXEMPCIONS.includes(linia.exempcio)) errors.push(`${on}: causa d'exempció desconeguda (${EXEMPCIONS.join(', ')}).`);
  /* El detall i la unitat són per a llegir la factura: no entren al càlcul, a l'empremta ni als camps
     de l'AEAT; sí que es guarden dins de la factura que porta el registre. */
  const ambDetall = donat(linia?.detall);
  const detall = ambDetall ? detallValid(linia.detall) : null;
  if (ambDetall && !detall) errors.push(`${on}: el detall és un text de com a molt ${MAX_DETALL} caràcters (admet salts de línia).`);
  const ambUnitat = donat(linia?.unitat);
  const unitat = ambUnitat ? textValid(linia.unitat, MAX_UNITAT) : null;
  if (ambUnitat && !unitat) errors.push(`${on}: la unitat és un text curt (com a molt ${MAX_UNITAT} caràcters, sense salts de línia).`);
  if (!concepte || mil === null || !esImport(preu) || ambTipus === ambExempcio || (ambDetall && !detall) || (ambUnitat && !unitat)) return null;
  const producte = mil * preu;
  if (!Number.isSafeInteger(producte) || Math.abs(producte) > MAX_BASE * 1000) {
    errors.push(`${on}: import massa gran (el sostre és de ${SOSTRE}).`);
    return null;
  }
  /* Sense IVA inclòs, el valor de la línia és la base; amb IVA inclòs, és el que paga el client. */
  const valor = arrodoneix(producte, 1000);
  return {
    concepte,
    quantitat: mil / 1000,
    preuUnitari: preu,
    ...(ivaInclos ? { import: valor } : { base: valor }),
    ...(ambTipus ? { tipusIva: linia.tipusIva } : { exempcio: linia.exempcio }),
    ...(unitat ? { unitat } : {}),
    ...(detall ? { detall } : {})
  };
}

/* Les bases per tipus d'IVA (o per exempció) i la quota de cada grup; null
   (amb l'error) si un grup passa del sostre. */
function desglossa(linies, ivaInclos, errors) {
  const grups = new Map();
  for (const linia of linies) {
    const clau = linia.exempcio ?? `S${linia.tipusIva}`;
    const grup = grups.get(clau) ?? (linia.exempcio
      ? { qualificacio: null, exempcio: linia.exempcio, suma: 0 }
      : { qualificacio: 'S1', tipusIva: linia.tipusIva, suma: 0 });
    grup.suma += ivaInclos ? linia.import : linia.base;
    grups.set(clau, grup);
  }
  const llista = [];
  for (const { suma, ...grup } of grups.values()) {
    if (Math.abs(suma) > MAX_BASE) {
      errors.push(`Import massa gran: la base d'un tipus d'IVA no pot passar de ${SOSTRE}.`);
      return null;
    }
    if (grup.exempcio) {
      llista.push({ ...grup, base: suma, quota: 0 });
      continue;
    }
    const tipus = centesimes(grup.tipusIva);
    /* Amb IVA inclòs, la suma ja porta la quota: la base és suma / (1 + tipus),
       arredonida, i la quota és la resta, de manera que base + quota és
       exactament el que paga el client (tres línies d'1,10 € al 10 % fan 3,30 €). */
    const base = ivaInclos ? arrodoneix(suma * 10000, 10000 + tipus) : suma;
    const quota = ivaInclos ? suma - base : arrodoneix(base * tipus, 10000);
    llista.push({ ...grup, base, quota });
  }
  /* Primer les subjectes, de menor a major tipus; després les exemptes per causa. */
  return llista.sort((a, b) => {
    if (Boolean(a.exempcio) !== Boolean(b.exempcio)) return a.exempcio ? 1 : -1;
    return a.exempcio ? a.exempcio.localeCompare(b.exempcio) : a.tipusIva - b.tipusIva;
  });
}

/* El desglossament, els totals, la retenció i el líquid; null si no es poden calcular. */
function calcula(linies, { ivaInclos, retencio, perDiferencies }, errors) {
  const desglossament = desglossa(linies, ivaInclos, errors);
  if (!desglossament) return null;
  const baseTotal = desglossament.reduce((suma, g) => suma + g.base, 0);
  const quotaTotal = desglossament.reduce((suma, g) => suma + g.quota, 0);
  const importTotal = baseTotal + quotaTotal;
  if (Math.abs(baseTotal) > MAX_BASE || ![baseTotal, quotaTotal, importTotal].every(esImport)) {
    errors.push(`Import total massa gran: la base de la factura no pot passar de ${SOSTRE}.`);
    return null;
  }
  if (!perDiferencies && desglossament.some((g) => g.base < 0)) {
    errors.push('Una base negativa només és possible en una rectificativa per diferències: no es corregix restant, es rectifica.');
  }
  const importRetencio = retencio === null ? 0 : arrodoneix(baseTotal * retencio, 10000);
  return {
    desglossament,
    baseTotal,
    quotaTotal,
    importTotal,
    /* La retenció d'IRPF només es mostra a la factura: el líquid és el que
       paga el client. No entra a l'ImporteTotal del registre (cal
       contrastar-ho amb les preguntes freqüents de l'AEAT abans de l'alta). */
    ...(retencio === null ? {} : { retencio: { percentatge: retencio / 100, import: importRetencio } }),
    liquid: importTotal - importRetencio
  };
}

/* El cos que comparteixen la factura i el pressupost: persones, línies,
   descripció i retenció. `tipus` decidix si hi ha destinatari i si cal el
   domicili; `ivaInclos`, com es llig el preu de les línies. */
function analitzaCos(dades, { tipus, tipusIva, ivaInclos }, errors) {
  const ambDomicili = AMB_DOMICILI.includes(tipus);
  const ambDestinatari = !SENSE_DESTINATARI.includes(tipus);
  const emissor = analitzaPersona(dades.emissor, 'l\'emissor', errors, { espanyol: true, ambDomicili });
  let destinatari = null;
  if (ambDestinatari) {
    destinatari = analitzaPersona(dades.destinatari, 'el destinatari', errors, { espanyol: false, ambDomicili });
    const nif = nifDe(dades.emissor);
    if (nif !== null && nif === nifDe(dades.destinatari)) errors.push('L\'emissor i el destinatari no poden ser el mateix NIF.');
  } else if (donat(dades.destinatari)) {
    /* Regla de RegistroAlta de Veri*Factu, a contrastar amb el document vigent
       «Validaciones y errores»: si TipoFactura és F2 o R5, el bloc
       Destinatarios no es pot emplenar. Una simplificada amb el client
       identificat (art. 7.2 i 7.3 del RD 1619/2012) es registra com a F1 o
       R1-R4 amb FacturaSimplificadaArt7273=S: eixa marca és PENDENT. */
    errors.push('Una simplificada (F2) o la seua rectificativa (R5) no porta destinatari: si el client s\'identifica, fes una completa (F1) o una rectificativa R1-R4.');
  }

  const admesos = esLlista(tipusIva) ? tipusIva : [];
  if (!esLlista(tipusIva) || !tipusIva.every((t) => centesimes(t) !== null && t > 0)) {
    errors.push('La llista de tipus d\'IVA admesos ha de portar percentatges positius.');
  }
  let linies = [];
  if (!esLlista(dades.linies) || dades.linies.length === 0 || dades.linies.length > MAX_LINIES) {
    errors.push(`Cal almenys una línia (com a molt ${MAX_LINIES}).`);
  } else {
    linies = dades.linies.map((linia, i) => analitzaLinia(linia, i, { tipusIva: admesos, ivaInclos }, errors));
  }

  /* La descripció de l'operació és obligatòria per a l'AEAT: si no se'n dona, és el primer concepte. */
  const ambDescripcio = donat(dades.descripcio);
  const descripcio = ambDescripcio ? textValid(dades.descripcio, MAX_TEXT) : (linies[0]?.concepte ?? null);
  if (ambDescripcio && !descripcio) {
    errors.push(`La descripció de l'operació, si es dona, és un text d'una línia de com a molt ${MAX_TEXT} caràcters (si no, és el primer concepte).`);
  }

  let retencio = null;
  if (donat(dades.retencio)) {
    const pct = centesimes(dades.retencio?.percentatge);
    if (pct === null || pct === 0) errors.push('La retenció porta un percentatge entre 0 i 100, amb dos decimals com a molt.');
    else retencio = pct;
  }
  return { emissor, destinatari, descripcio, linies, retencio };
}

/* El cobrament: { metode, compte? }; el compte, una referència a la configuració. */
function analitzaCobrament(cobrament, errors) {
  if (!donat(cobrament)) return null;
  if (typeof cobrament !== 'object' || esLlista(cobrament)) {
    errors.push('El cobrament és { metode, compte }.');
    return null;
  }
  const metodeBo = METODES_COBRAMENT.includes(cobrament.metode);
  if (!metodeBo) errors.push(`Mètode de cobrament desconegut (${METODES_COBRAMENT.join(', ')}).`);
  const ambCompte = donat(cobrament.compte);
  const compteBo = !ambCompte || esReferenciaOpaca(cobrament.compte);
  if (!compteBo) {
    errors.push('El compte de cobrament és una referència a la configuració de l\'empresa (minúscules, xifres i guions, com «compte-principal»), mai el número del compte.');
  }
  return metodeBo && compteBo ? { metode: cobrament.metode, ...(ambCompte ? { compte: cobrament.compte } : {}) } : null;
}

/**
 * L'anàlisi d'una factura: els errors (llista buida si és vàlida) i, si ho és,
 * la factura calculada (sense congelar). No llança. La fan servir
 * creaFacturaEmesa i el recàlcul d'una factura ja emesa (errorsDeRecalcul).
 * @param {object} dades
 * @param {{ tipusIva?: number[], sectorAmpliat?: boolean }} [opcions]
 * @returns {{ errors: string[], factura: object|null }}
 */
export function analitza(dades, { tipusIva = TIPUS_IVA, sectorAmpliat = false } = {}) {
  const errors = [];
  if (!dades || typeof dades !== 'object') return { errors: ['Cal una factura: { tipus, numSerie, dataExpedicio, emissor, … }.'], factura: null };
  const tipus = dades.tipus;
  if (!TIPUS_FACTURA.includes(tipus)) errors.push(`Tipus de factura desconegut (${TIPUS_FACTURA.join(', ')}).`);
  const rectificativa = RECTIFICATIVES.includes(tipus);
  const numSerie = textNet(dades.numSerie);
  if (!NUM_SERIE.test(numSerie) || numSerie.length > MAX_NUM_SERIE) {
    errors.push(`El número de sèrie és obligatori: ASCII imprimible, com a molt ${MAX_NUM_SERIE} caràcters.`);
  }
  const dataExpedicio = dades.dataExpedicio;
  if (!esDataIso(dataExpedicio)) errors.push('La data d\'expedició ha de ser una data «aaaa-mm-dd» que existisca.');
  const dataOperacio = dades.dataOperacio ?? null;
  if (dataOperacio !== null && !esDataIso(dataOperacio)) errors.push('La data d\'operació, si hi és, ha de ser una data «aaaa-mm-dd».');
  const venciment = dades.venciment ?? null;
  if (venciment !== null && !esDataIso(venciment)) errors.push('El venciment, si hi és, és una data «aaaa-mm-dd».');
  else if (venciment !== null && esDataIso(dataExpedicio) && venciment < dataExpedicio) errors.push('El venciment no pot ser anterior a la data d\'expedició.');
  const cobrament = analitzaCobrament(dades.cobrament, errors);
  const ivaInclos = dades.ivaInclos === true;
  if (donat(dades.ivaInclos) && typeof dades.ivaInclos !== 'boolean') {
    errors.push('ivaInclos, si hi és, és cert o fals.');
  } else if (ivaInclos && !SENSE_DESTINATARI.includes(tipus)) {
    errors.push('El mode «IVA inclòs» només és per a la simplificada (F2) i la seua rectificativa (R5): una completa porta el preu sense IVA.');
  }

  const cos = analitzaCos(dades, { tipus, tipusIva, ivaInclos }, errors);

  const data = esDataIso(dataExpedicio) ? dataExpedicio : '9999-12-31';
  let referencies = {};
  if (rectificativa) {
    const tipusRectificativa = dades.tipusRectificativa;
    if (!TIPUS_RECTIFICATIVA.includes(tipusRectificativa)) errors.push('Una rectificativa diu si és per substitució (S) o per diferències (I).');
    referencies = { tipusRectificativa, rectificades: analitzaReferencies(dades.rectificades, 'Factura rectificada', data, errors) };
    if (tipusRectificativa === 'S') {
      const ir = dades.importRectificat;
      if (!esImport(ir?.base) || !esImport(ir?.quota)) errors.push('Una rectificativa per substitució porta l\'import rectificat: { base, quota } en cèntims.');
      else referencies.importRectificat = { base: ir.base, quota: ir.quota };
    }
  } else if (dades.rectificades !== undefined || dades.tipusRectificativa !== undefined) {
    errors.push('Només les rectificatives (R1-R5) porten factures rectificades.');
  }
  if (tipus === 'F3') referencies.substituides = analitzaReferencies(dades.substituides, 'Factura substituïda', data, errors);
  else if (dades.substituides !== undefined) errors.push('Només una F3 substituïx factures simplificades.');

  if (errors.length) return { errors, factura: null };

  const perDiferencies = rectificativa && dades.tipusRectificativa === 'I';
  const xifres = calcula(cos.linies, { ivaInclos, retencio: cos.retencio, perDiferencies }, errors);
  if (xifres && tipus === 'F2') {
    const limit = sectorAmpliat ? LIMIT_SIMPLIFICADA_SECTORS : LIMIT_SIMPLIFICADA;
    if (xifres.importTotal > limit) errors.push(`Una factura simplificada no pot passar de ${limit / 100} € IVA inclòs: fes-ne una completa (F1).`);
  }
  if (errors.length) return { errors, factura: null };

  return {
    errors,
    factura: {
      esquema: ESQUEMA_FACTURA,
      tipus,
      numSerie,
      dataExpedicio,
      ...(dataOperacio === null ? {} : { dataOperacio }),
      emissor: cos.emissor,
      destinatari: cos.destinatari,
      descripcio: cos.descripcio,
      linies: cos.linies,
      ...(ivaInclos ? { ivaInclos } : {}),
      ...xifres,
      ...(venciment === null ? {} : { venciment }),
      ...(cobrament === null ? {} : { cobrament }),
      ...referencies,
      moneda: 'EUR'
    }
  };
}

/**
 * El cos d'un document complet sense número ni dates (persones amb domicili,
 * línies, descripció, desglossament, totals i retenció), calculat com en una
 * factura completa (F1). El fa servir pressupost.js, perquè un pressupost
 * done les mateixes xifres que la factura que serà. No llança.
 * @param {object} dades
 * @param {{ tipusIva?: number[] }} [opcions]
 * @returns {{ errors: string[], cos: object|null }}
 */
export function analitzaCosComplet(dades, { tipusIva = TIPUS_IVA } = {}) {
  const errors = [];
  if (!dades || typeof dades !== 'object') return { errors: ['Cal un document: { emissor, destinatari, linies, … }.'], cos: null };
  const cos = analitzaCos(dades, { tipus: 'F1', tipusIva, ivaInclos: false }, errors);
  if (errors.length) return { errors, cos: null };
  const xifres = calcula(cos.linies, { ivaInclos: false, retencio: cos.retencio, perDiferencies: false }, errors);
  if (errors.length) return { errors, cos: null };
  return { errors, cos: { emissor: cos.emissor, destinatari: cos.destinatari, descripcio: cos.descripcio, linies: cos.linies, ...xifres } };
}

/**
 * Les opcions amb què es torna a calcular un document ja fet (una factura o
 * un pressupost): els tipus d'IVA de les seues pròpies línies i sense el
 * límit de la simplificada. La política (quins tipus admet la llei, el límit
 * de 400 €) s'aplica quan s'emet; en rellegir-lo, només es comprova que les
 * xifres i les dades quadren.
 * @param {object} fet la factura o el pressupost ja fet
 * @returns {{ tipusIva: unknown[], sectorAmpliat: true }}
 */
export function opcionsDeRecalcul(fet) {
  const linies = esLlista(fet?.linies) ? fet.linies : [];
  return { tipusIva: [...new Set(linies.map((l) => l?.tipusIva).filter(donat))], sectorAmpliat: true };
}

/* Cert si els dos valors fan el mateix JSON canònic (fals si un no es pot serialitzar). */
function igualCanonic(a, b) {
  try {
    return jsonCanonic(a) === jsonCanonic(b);
  } catch {
    return false;
  }
}

/**
 * Els errors d'una factura ja emesa, tornada a calcular des de les seues
 * dades: llista buida si torna a donar exactament la mateixa (camps de més,
 * línies, desglossament, totals i destinatari inclosos). No llança.
 * @param {object} factura
 * @returns {string[]}
 */
export function errorsDeRecalcul(factura) {
  if (!factura || typeof factura !== 'object' || esLlista(factura) || factura.esquema !== ESQUEMA_FACTURA) {
    return [`No és una factura emesa (${ESQUEMA_FACTURA}).`];
  }
  let analisi;
  try {
    analisi = analitza(factura, opcionsDeRecalcul(factura));
  } catch {
    return ['La factura no es pot tornar a calcular.'];
  }
  if (analisi.errors.length) return analisi.errors;
  return igualCanonic(analisi.factura, factura)
    ? []
    : ['Les seues dades no tornen a donar la mateixa factura: les línies, el desglossament, els totals o algun camp no quadren.'];
}

/**
 * Els errors d'una factura (llista buida si és vàlida). No llança.
 * @param {object} dades
 * @param {{ tipusIva?: number[], sectorAmpliat?: boolean }} [opcions]
 * @returns {string[]}
 */
export function validaFacturaEmesa(dades, opcions) {
  return analitza(dades, opcions).errors;
}

/**
 * La factura emesa, validada, calculada i congelada en profunditat.
 * Llança un error amb codi FACTURA_INVALIDA i la llista a `detalls`.
 * @param {object} dades
 * @param {{ tipusIva?: number[], sectorAmpliat?: boolean }} [opcions]
 * @returns {Readonly<object>}
 */
export function creaFacturaEmesa(dades, opcions) {
  const { errors, factura } = analitza(dades, opcions);
  if (errors.length) throw errorAmbCodi('FACTURA_INVALIDA', `Factura no vàlida: ${errors.join(' ')}`, errors);
  return copiaCongelada(factura);
}

/* Cert si és una factura eixida de creaFacturaEmesa: congelada i que, tornada
   a calcular des de les seues dades, dona exactament la mateixa. Una factura
   retocada i congelada a mà no ho és. */
export function esFacturaEmesa(factura) {
  return Boolean(factura) && typeof factura === 'object' && Object.isFrozen(factura)
    && Object.isFrozen(factura.linies) && Object.isFrozen(factura.desglossament)
    && errorsDeRecalcul(factura).length === 0;
}
