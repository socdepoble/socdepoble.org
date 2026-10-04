/**
 * cadena.js — afegir registres a la cadena sense bifurcar-la, i verificar-la sencera.
 *
 * Cada emissor (NIF) porta una sola cadena, que barreja altes i
 * anul·lacions: cada registre porta l'empremta del de davant. El perill és
 * la concurrència: dos registres que lligen la mateixa «última empremta»
 * bifurquen la cadena. Per això:
 *   · afegixALaCadena llig l'últim, construïx el registre i l'afig dins de
 *     la secció d'un sol escriptor del port (Web Locks a IndexedDB);
 *   · i el port, a més, refusa dins de la mateixa transacció un registre
 *     que no vaja just darrere de l'últim (CADENA_CANVIADA). Una pestanya
 *     sense Web Locks no pot bifurcar: com a molt, falla i es torna a provar.
 *
 * verificaCadena torna a calcular cada empremta i resseguix els enllaços:
 * detecta registres alterats, trencaments, bifurcacions, reordenacions,
 * duplicats, anul·lacions sense alta i, si li'ls donen, truncaments respecte
 * d'un últim registre conegut (el d'una còpia o el que haja acceptat l'AEAT).
 *
 * El límit, escrit: l'empremta de l'AEAT només protegix 8 camps (emissor,
 * número, data, tipus, quota, import, l'empremta anterior i l'hora de
 * generació). validaRegistre torna a calcular la factura que porta cada alta
 * i refusa la que no quadra (línies, desglossament, totals, destinatari
 * obligatori, camps de més), però el text de la factura (noms, adreces,
 * conceptes, descripció) i el motiu de l'anul·lació no queden protegits
 * contra una edició coherent: es poden canviar sense tocar cap empremta.
 * Eixa protecció només arriba amb la remissió a l'AEAT o amb la signatura
 * XAdES (PENDENT, fase 3).
 * JS pur: sense DOM, React ni xarxa.
 */
import { errorAmbCodi } from '../comu.js';
import { empremtaDeRegistre } from './empremta.js';
import { creaRegistreAlta } from './registreAlta.js';
import { creaRegistreAnulacio } from './registreAnulacio.js';
import { clauFactura, validaRegistre } from './validacio.js';

/* Les incidències de verificaCadena i el seu pes: una greu invalida la cadena; un avís, no. */
export const INCIDENCIES = Object.freeze({
  REGISTRE_INVALID: 'greu',
  EMPREMTA_ALTERADA: 'greu',
  TRENCAMENT: 'greu',
  BIFURCACIO: 'greu',
  REORDENACIO: 'greu',
  DUPLICAT: 'greu',
  ANULACIO_SENSE_ALTA: 'greu',
  TRUNCAMENT: 'greu',
  RELLOTGE_ENRERE: 'avis'
});

/**
 * Llig l'últim registre de l'emissor, en construïx un de nou amb `construeix(ultim)`
 * i l'afig, tot dins de la secció d'un sol escriptor del port.
 * @param {object} port un port de registre (port.js)
 * @param {{ idEmisor: string, construeix: (ultim: object|null) => Promise<object> }} p
 * @returns {Promise<Readonly<object>>} el registre desat
 */
export async function afegixALaCadena(port, { idEmisor, construeix } = {}) {
  if (typeof construeix !== 'function') throw new TypeError('afegixALaCadena necessita construeix(ultim).');
  const seccio = async () => {
    const ultim = await port.ultim(idEmisor);
    const registre = await construeix(ultim);
    if (registre?.idEmisor !== idEmisor) throw errorAmbCodi('CADENA_ALIENA', 'El registre construït és d\'un altre emissor.');
    return port.afegix(registre);
  };
  return typeof port.ambEscriptor === 'function' ? port.ambEscriptor(seccio) : seccio();
}

/**
 * Registra l'alta d'una factura emesa al final de la cadena del seu emissor.
 * @param {object} port
 * @param {object} factura eixida de creaFacturaEmesa
 * @param {{ instant?: number|Date, zona?: string, subtle?: SubtleCrypto }} [opcions]
 * @returns {Promise<Readonly<object>>}
 */
export function registraAlta(port, factura, { instant, zona, subtle } = {}) {
  return afegixALaCadena(port, {
    idEmisor: factura?.emissor?.nif,
    construeix: (anterior) => creaRegistreAlta({ factura, anterior, instant, zona, subtle })
  });
}

/**
 * Registra l'anul·lació d'una factura ja registrada, buscant-ne l'alta al llibre.
 * @param {object} port
 * @param {{ idEmisor: string, numSerie: string, dataExpedicio: string, motiu?: string,
 *   instant?: number|Date, zona?: string, subtle?: SubtleCrypto }} p
 * @returns {Promise<Readonly<object>>}
 */
export function registraAnulacio(port, { idEmisor, numSerie, dataExpedicio, motiu, instant, zona, subtle } = {}) {
  const clau = clauFactura({ idEmisor, numSerie, dataExpedicio });
  return afegixALaCadena(port, {
    idEmisor,
    construeix: async (anterior) => {
      const alta = (await port.llig({ idEmisor })).find((r) => r.tipusRegistre === 'alta' && clauFactura(r) === clau);
      if (!alta) throw errorAmbCodi('FACTURA_INEXISTENT', `La factura ${numSerie} del ${dataExpedicio} no és al llibre: no es pot anul·lar.`);
      return creaRegistreAnulacio({ alta, anterior, motiu, instant, zona, subtle });
    }
  });
}

function verificaUna(cadena, previ, afig) {
  /* Bifurcacions: més d'un registre darrere del mateix anterior (o més d'un primer). */
  const fills = new Map();
  for (const v of cadena) {
    const pare = v.r.encadenament?.empremta ?? null;
    if (!fills.has(pare)) fills.set(pare, []);
    fills.get(pare).push(v);
  }
  const bifurcats = new Set();
  for (const [pare, germans] of fills) {
    if (germans.length < 2) continue;
    for (const v of germans) {
      bifurcats.add(v.r.empremta);
      afig('BIFURCACIO', v, pare === null
        ? `${germans.length} registres diuen que són el primer de la cadena.`
        : `${germans.length} registres van darrere del mateix registre anterior: la cadena s'ha bifurcat.`);
    }
  }
  const empremtes = new Set(cadena.map((v) => v.r.empremta));
  if (previ) empremtes.add(previ.empremta);
  const ordreBase = previ ? previ.ordre : 0;
  const altes = new Set();
  const anulades = new Set();
  let esperat = previ;
  cadena.forEach((v, i) => {
    const { r } = v;
    const enc = r.encadenament;
    const pare = enc?.empremta ?? null;
    if (!bifurcats.has(r.empremta) && !bifurcats.has(pare)) {
      if (pare !== (esperat?.empremta ?? null)) {
        const hiEs = pare === null || empremtes.has(pare);
        afig(hiEs ? 'REORDENACIO' : 'TRENCAMENT', v, hiEs
          ? 'El registre no va darrere del que el precedix al llibre: la cadena està desordenada.'
          : 'El registre anterior que diu l\'encadenament no és al llibre: la cadena està trencada.');
      } else if (enc && (enc.idEmisor !== esperat.idEmisor || enc.numSerie !== esperat.numSerie || enc.dataExpedicio !== esperat.dataExpedicio)) {
        afig('TRENCAMENT', v, 'L\'encadenament porta l\'empremta del registre anterior però no la seua factura.');
      } else if (r.ordre !== ordreBase + i + 1) {
        afig('REORDENACIO', v, `El número d'ordre (${r.ordre}) no és el de la seua posició (${ordreBase + i + 1}).`);
      }
    }
    if (esperat && Date.parse(r.dataHoraHusGeneracio) < Date.parse(esperat.dataHoraHusGeneracio)) {
      afig('RELLOTGE_ENRERE', v, 'Este registre diu que es va generar abans que l\'anterior: revisa el rellotge de l\'ordinador.');
    }
    const clau = clauFactura(r);
    if (r.tipusRegistre === 'alta') {
      if (altes.has(clau)) afig('DUPLICAT', v, `La factura ${r.numSerie} té dues altes.`);
      altes.add(clau);
    } else {
      if (anulades.has(clau)) afig('DUPLICAT', v, `La factura ${r.numSerie} té dues anul·lacions.`);
      /* Amb una verificació parcial (previ), l'alta pot ser d'abans de la finestra. */
      else if (!previ && !altes.has(clau)) afig('ANULACIO_SENSE_ALTA', v, `S'anul·la la factura ${r.numSerie}, que no té cap alta abans.`);
      anulades.add(clau);
    }
    esperat = r;
  });
}

/**
 * Verifica una llista de registres en l'ordre del llibre (el de port.llig o el d'una còpia).
 * @param {object[]} registres
 * @param {object} [opcions]
 * @param {SubtleCrypto} [opcions.subtle]
 * @param {object|null} [opcions.anterior] el registre de just abans de la llista, si és parcial
 * @param {{ idEmisor: string, ordre: number, empremta: string }[]} [opcions.ultimsConeguts]
 *   registres que han de ser-hi (el d'una còpia anterior, l'últim acceptat per l'AEAT…)
 * @returns {Promise<{ valida: boolean, registres: number,
 *   cadenes: { idEmisor: string, registres: number, ultim: { ordre: number, empremta: string } }[],
 *   incidencies: { codi: string, greu: boolean, posicio: number|null, idEmisor: string|null, numSerie: string|null, missatge: string }[] }>}
 */
export async function verificaCadena(registres, { subtle, anterior = null, ultimsConeguts = [] } = {}) {
  if (!Array.isArray(registres)) throw new TypeError('verificaCadena espera una llista de registres.');
  const incidencies = [];
  const afig = (codi, v, missatge) => incidencies.push({
    codi, greu: INCIDENCIES[codi] === 'greu', posicio: v?.posicio ?? null,
    idEmisor: v?.r?.idEmisor ?? null, numSerie: v?.r?.numSerie ?? null, missatge
  });
  const cadenes = new Map();
  for (const [posicio, r] of registres.entries()) {
    const errors = validaRegistre(r);
    if (errors.length) {
      afig('REGISTRE_INVALID', { posicio, r: typeof r === 'object' && r ? r : null }, errors.join(' '));
      continue;
    }
    if ((await empremtaDeRegistre(r, subtle)) !== r.empremta) {
      afig('EMPREMTA_ALTERADA', { posicio, r }, 'L\'empremta no correspon als camps: el registre s\'ha modificat després de generar-lo.');
    }
    if (!cadenes.has(r.idEmisor)) cadenes.set(r.idEmisor, []);
    cadenes.get(r.idEmisor).push({ posicio, r });
  }
  const resum = [];
  for (const [idEmisor, cadena] of cadenes) {
    verificaUna(cadena, anterior?.idEmisor === idEmisor ? anterior : null, afig);
    const { r: ultim } = cadena[cadena.length - 1];
    resum.push({ idEmisor, registres: cadena.length, ultim: { ordre: ultim.ordre, empremta: ultim.empremta } });
  }
  for (const conegut of ultimsConeguts) {
    const hiEs = (cadenes.get(conegut?.idEmisor) ?? []).some(({ r }) => r.ordre === conegut.ordre && r.empremta === conegut.empremta);
    if (!hiEs) {
      afig('TRUNCAMENT', { posicio: null, r: { idEmisor: conegut?.idEmisor ?? null, numSerie: null } },
        `Falta el registre ${conegut?.ordre} que ja era conegut: el llibre s'ha truncat o és d'una altra còpia.`);
    }
  }
  return { valida: !incidencies.some((i) => i.greu), registres: registres.length, cadenes: resum, incidencies };
}
