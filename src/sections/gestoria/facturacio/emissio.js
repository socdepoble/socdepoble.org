/**
 * emissio.js — el cas d'ús d'emissió: la política de numeració de l'empresa
 * damunt del registre fiscal (F02 de l'auditoria de Codex del 261004).
 *
 * El registre (registre/) encadena qualsevol factura i la identifica com
 * l'AEAT: emissor, número i data (validacio.js). No sap res de sèries, del
 * llegat ni de la data de pas, i així continua: el constructor fiscal és
 * genèric. La política de l'empresa viu ací i s'aplica sempre abans d'una alta:
 *   · la configuració de l'empresa és vàlida (configEmpresa.js) i porta la
 *     data de pas decidida (facturacio.dataPas): sense, no s'emet res;
 *   · el llegat de l'eina externa està declarat (el de sembraLlegat, o una
 *     llista buida si l'empresa no en té) i ben format;
 *   · comprovaEmissio (serie.js): cap sèrie que es confonga amb el llegat
 *     (SERIE_CONFUSA) ni cap factura d'abans del pas (ABANS_DEL_PAS); decisió
 *     del Mestre: sèrie NOVA el dia del pas, i la F del llegat queda tancada;
 *   · el número és el següent de la sèrie del tipus (el prefix de la
 *     configuració o el recomanat, i l'any de la factura). Si qui crida en
 *     porta un (el que la pantalla ha mostrat), ha de ser eixe mateix: un
 *     número ja usat en la sèrie, amb QUALSEVOL data, és NUMERO_REPETIT, i un
 *     altre salt és NUMERO_NO_CORRELATIU. La unicitat de negoci és per sèrie i
 *     número; la identitat fiscal (emissor, número i data) no la substituïx;
 *   · RECTIFICATIVES SEGURES (ordre del Mestre, 261007; pas 4 del mapa de la
 *     Gestoria, buit G10): cada factura que una rectificativa (R1-R5)
 *     rectifica, o que una F3 substituïx, ha de tindre el seu registre d'alta
 *     en este llibre, en la cadena de l'empresa (el mateix NIF), i no pot
 *     estar anul·lada. Si no, FACTURA_RECTIFICADA_INEXISTENT, amb la llista
 *     a `detalls`. Es comprova dins de la mateixa secció que numera, sobre el
 *     llibre llegit: una anul·lació no s'hi pot colar entremig;
 *   · UN TIQUET, UNA SUBSTITUCIÓ (ordre del Mestre, 261007; troballa F5 de
 *     la revisió de la Facturació): una F3 no substituïx un tiquet que ja
 *     substituïx una altra F3 viva (no anul·lada) de la cadena. Si no, dos
 *     factures completes per a la mateixa venda, amb l'IVA comptat dos
 *     vegades: FACTURA_JA_SUBSTITUIDA, amb la llista a `detalls`. Anul·lada
 *     la primera F3, el tiquet es pot tornar a substituir.
 *
 * Sense carreres: llegir el llibre, calcular el número, construir la factura
 * i el registre i afegir-lo és UNA sola secció. Les emissions d'este cas d'ús
 * passen per la seua fila, d'una en una, i dins de l'escriptor únic del port
 * si en té (Web Locks entre pestanyes a IndexedDB). Si un altre escriptor s'hi
 * colara igualment, el port refusa l'alta (CADENA_CANVIADA), perquè la seua
 * comprovació d'afegit és atòmica: mai no queden dos números repetits.
 *
 * BACKEND (fase 3, amb ordre del Mestre): la reserva del número i l'alta han
 * de ser UNA operació atòmica al servidor (una transacció amb clau única per
 * emissor, prefix, any i número, a més de les de la cadena). La fila i Web
 * Locks només coordinen este navegador.
 * JS pur: sense DOM, React ni xarxa.
 */
import { copiaCongelada, errorAmbCodi, esDataIso } from './comu.js';
import { emissorDe, llegixConfigEmpresa } from './configEmpresa.js';
import { TIPUS_FACTURA, creaFacturaEmesa } from './facturaEmesa.js';
import { creaFila, validaPort } from './registre/port.js';
import { creaRegistreAlta } from './registre/registreAlta.js';
import {
  PREFIX_RECOMANAT, comprovaEmissio, llegixNumSerie, llegixNumSerieLlegat, seguentNumSerie, seriesDelLlegat
} from './serie.js';

const facturaInvalida = (motiu) => errorAmbCodi('FACTURA_INVALIDA', `Factura no vàlida: ${motiu}`, [motiu]);

/* Els números de sèrie de les altes del llibre (una anul·lada conserva el seu: no es torna a usar). */
const usatsDe = (registres) => registres.filter((r) => r.tipusRegistre === 'alta').map((r) => r.numSerie);

/* Una factura dins de la cadena d'un emissor: el número i la data d'expedició (el NIF ja és el del llibre llegit). */
const facturaDe = (r) => `${r.numSerie}|${r.dataExpedicio}`;

/**
 * Les factures que la factura nova rectifica o substituïx i que no es poden
 * referir: les que no tenen alta en la cadena llegida (la de l'empresa) i les
 * que hi estan anul·lades, amb el motiu en text. Llista buida si totes hi són.
 * @param {object} factura la de creaFacturaEmesa (rectificades i substituides ja netes)
 * @param {ReadonlyArray<object>} registres la cadena de l'emissor, llegida dins de la secció
 * @returns {string[]}
 */
function referenciesSenseAlta(factura, registres) {
  const referides = [...(factura.rectificades ?? []), ...(factura.substituides ?? [])];
  if (!referides.length) return [];
  const altes = new Set(registres.filter((r) => r.tipusRegistre === 'alta').map(facturaDe));
  const anulades = new Set(registres.filter((r) => r.tipusRegistre === 'anulacio').map(facturaDe));
  return referides.flatMap((ref) => {
    const clau = facturaDe(ref);
    if (!altes.has(clau)) return [`${ref.numSerie} del ${ref.dataExpedicio} no és al llibre d'esta empresa.`];
    if (anulades.has(clau)) return [`${ref.numSerie} del ${ref.dataExpedicio} està anul·lada.`];
    return [];
  });
}

/**
 * Els tiquets que la factura nova substituïx i que ja substituïx una altra F3
 * viva (no anul·lada) de la cadena llegida, amb el motiu en text. Llista buida
 * si no n'hi ha cap.
 * @param {object} factura la de creaFacturaEmesa
 * @param {ReadonlyArray<object>} registres la cadena de l'emissor, llegida dins de la secció
 * @returns {string[]}
 */
function substitucionsRepetides(factura, registres) {
  const substituides = factura.substituides ?? [];
  if (!substituides.length) return [];
  const anulades = new Set(registres.filter((r) => r.tipusRegistre === 'anulacio').map(facturaDe));
  const perTiquet = new Map();
  for (const r of registres) {
    if (r.tipusRegistre !== 'alta' || r.tipusFactura !== 'F3' || anulades.has(facturaDe(r))) continue;
    for (const tiquet of r.factura?.substituides ?? []) perTiquet.set(facturaDe(tiquet), r.numSerie);
  }
  return substituides.flatMap((ref) => {
    const f3 = perTiquet.get(facturaDe(ref));
    return f3 ? [`${ref.numSerie} del ${ref.dataExpedicio} ja el substituïx la factura ${f3}.`] : [];
  });
}

/**
 * El cas d'ús d'emissió d'una empresa sobre un port de registre.
 * Llança, en crear-lo: PORT_INVALID, CONFIG_INVALIDA, SENSE_DATA_PAS,
 * SENSE_LLEGAT i TypeError si el llegat està mal format.
 * @param {object} p
 * @param {object} p.port un port de registre (port.js)
 * @param {object} p.config la configuració de l'empresa (configEmpresa.js), amb facturacio.dataPas
 * @param {{ series: object[] }|{ prefix: string, any: number }[]} p.llegat
 *   el de sembraLlegat (llegat.js) o la llista de sèries de l'eina externa; [] si no n'hi ha
 * @param {SubtleCrypto} [p.subtle]
 * @param {string} [p.zona]
 * @returns {Readonly<{ dataPas: string, nif: string,
 *   seguentNumero: (p: { tipus: string, dataExpedicio: string }) => Promise<string>,
 *   emet: (dades: object, opcions?: { instant?: number|Date, opcionsFactura?: object }) => Promise<Readonly<object>> }>}
 */
export function creaEmissio({ port, config, llegat, subtle, zona } = {}) {
  validaPort(port);
  const empresa = llegixConfigEmpresa(config);
  const dataPas = empresa.facturacio?.dataPas;
  if (!dataPas) {
    throw errorAmbCodi('SENSE_DATA_PAS', 'Cal decidir la data de pas a Veri*Factu (configuració de l\'empresa, facturacio.dataPas): fins aleshores factura l\'eina externa.');
  }
  if (llegat === undefined || llegat === null) {
    throw errorAmbCodi('SENSE_LLEGAT', 'Cal declarar el llegat de l\'eina externa: el de sembraLlegat, o una llista buida si l\'empresa no en té.');
  }
  /* Una còpia congelada: el que es comprova en cada emissió és el llegat d'ara, encara que qui crida el canvie després. */
  const seriesTancades = copiaCongelada(seriesDelLlegat(llegat));
  const emissorPerDefecte = emissorDe(config);
  const politica = { llegat: seriesTancades, dataPas };
  const enFila = creaFila();
  const enSeccio = (fn) => enFila(() => (typeof port.ambEscriptor === 'function' ? port.ambEscriptor(fn) : fn()));

  /* La sèrie d'una factura: el prefix del seu tipus i l'any de la data d'expedició. */
  function serieDe({ tipus, dataExpedicio } = {}) {
    if (!TIPUS_FACTURA.includes(tipus)) throw facturaInvalida(`tipus de factura desconegut (${TIPUS_FACTURA.join(', ')}).`);
    if (!esDataIso(dataExpedicio)) throw facturaInvalida('la data d\'expedició ha de ser una data «aaaa-mm-dd» que existisca.');
    return { prefix: empresa.facturacio.prefixos?.[tipus] ?? PREFIX_RECOMANAT[tipus], any: Number(dataExpedicio.slice(0, 4)) };
  }

  /* Un número que porta qui crida, abans de llegir el llibre: ha de tindre la
     forma d'este programa i ser de la sèrie de la factura. Un número amb la
     forma de l'eina externa («F260001») és del llegat tancat: SERIE_CONFUSA. */
  function comprovaFormaDelNumero(numSerie, serie, dataExpedicio) {
    const delLlegat = llegixNumSerieLlegat(numSerie);
    if (delLlegat) {
      comprovaEmissio({ prefix: delLlegat.prefix, any: delLlegat.any }, { ...politica, dataExpedicio });
      throw errorAmbCodi('SERIE_CONFUSA', `${numSerie} té la forma de la sèrie de l'eina externa, que queda tancada: el programa numera en la seua (${serie.prefix}${serie.any}).`);
    }
    const parts = llegixNumSerie(numSerie);
    if (!parts) throw errorAmbCodi('SERIE_INVALIDA', `${numSerie} no és un número d'este programa («${serie.prefix}${serie.any}-0001»).`);
    if (parts.prefix !== serie.prefix || parts.any !== serie.any) {
      throw errorAmbCodi('SERIE_INVALIDA', `${numSerie} no és de la sèrie d'esta factura (${serie.prefix}${serie.any}): el prefix és el del tipus i l'any, el de la data d'expedició.`);
    }
  }

  /* El número següent, sobre el llibre llegit dins de la mateixa secció. */
  function seguentDe(registres, serie, dataExpedicio) {
    return seguentNumSerie(usatsDe(registres), serie, { ...politica, dataExpedicio });
  }

  return Object.freeze({
    dataPas,
    nif: empresa.nif,

    /**
     * El número que tindria ara una factura (per a mostrar-lo). No reserva res:
     * la reserva és l'emissió, i emet() refusa el número si entremig s'ha usat.
     */
    seguentNumero({ tipus, dataExpedicio } = {}) {
      return enFila(async () => {
        const serie = serieDe({ tipus, dataExpedicio });
        return seguentDe(await port.llig({ idEmisor: empresa.nif }), serie, dataExpedicio);
      });
    },

    /**
     * Emet una factura: numera, la construïx (creaFacturaEmesa), en fa el
     * registre d'alta i l'afig al llibre, tot dins d'una sola secció.
     * @param {object} dades les de creaFacturaEmesa; numSerie, opcional (si hi és, ha de ser el següent);
     *   emissor, opcional (per defecte, el de la configuració amb el domicili fiscal; si hi és, amb el NIF de l'empresa)
     * @param {{ instant?: number|Date, opcionsFactura?: { tipusIva?: number[], sectorAmpliat?: boolean } }} [opcions]
     * @returns {Promise<Readonly<object>>} el registre d'alta desat, que porta la factura
     */
    emet(dades, { instant, opcionsFactura } = {}) {
      return enSeccio(async () => {
        if (!dades || typeof dades !== 'object' || Array.isArray(dades)) throw facturaInvalida('cal un objecte amb les dades de la factura.');
        const serie = serieDe(dades);
        const donat = dades.numSerie !== undefined;
        if (donat) comprovaFormaDelNumero(dades.numSerie, serie, dades.dataExpedicio);
        const registres = await port.llig({ idEmisor: empresa.nif });
        const seguent = seguentDe(registres, serie, dades.dataExpedicio);
        if (donat && dades.numSerie !== seguent) {
          if (usatsDe(registres).includes(dades.numSerie)) {
            throw errorAmbCodi('NUMERO_REPETIT', `${dades.numSerie} ja s'ha emés en esta sèrie (amb qualsevol data): el següent és ${seguent}.`);
          }
          throw errorAmbCodi('NUMERO_NO_CORRELATIU', `${dades.numSerie} no és el número que toca: el següent de la sèrie és ${seguent}.`);
        }
        const factura = creaFacturaEmesa({ ...dades, numSerie: seguent, emissor: dades.emissor ?? emissorPerDefecte }, opcionsFactura);
        if (factura.emissor.nif !== empresa.nif) {
          throw errorAmbCodi('EMISSOR_ALIE', 'L\'emissor de la factura no és l\'empresa de la configuració: cada NIF emet en la seua cadena.');
        }
        const senseAlta = referenciesSenseAlta(factura, registres);
        if (senseAlta.length) {
          throw errorAmbCodi('FACTURA_RECTIFICADA_INEXISTENT', `Només es rectifica, o se substituïx, una factura emesa per esta empresa i no anul·lada: ${senseAlta.join(' ')}`, senseAlta);
        }
        const repetides = substitucionsRepetides(factura, registres);
        if (repetides.length) {
          throw errorAmbCodi('FACTURA_JA_SUBSTITUIDA', `Un tiquet només se substituïx una vegada: ${repetides.join(' ')}`, repetides);
        }
        const anterior = registres.length ? registres[registres.length - 1] : null;
        const registre = await creaRegistreAlta({ factura, anterior, instant, zona, subtle });
        return port.afegix(registre);
      });
    }
  });
}
