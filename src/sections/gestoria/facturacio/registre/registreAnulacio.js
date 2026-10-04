/**
 * registreAnulacio.js — el registre d'ANUL·LACIÓ d'una factura (RegistroAnulacion de Veri*Factu).
 *
 * Anul·lar no esborra res: afig a la cadena un registre nou que diu quina
 * factura queda anul·lada, encadenat a l'últim registre de l'emissor (que
 * pot ser qualsevol, no cal que siga l'alta). La factura anul·lada conserva
 * el seu número: la sèrie no es torna a fer servir (serie.js). És per a una
 * factura que no s'havia d'haver emés; si el que cal és corregir-ne els
 * imports o les dades, es fa una rectificativa (R1-R5), que és una alta.
 *
 * El motiu és local (per a la persona que revisa el llibre): no entra a
 * l'empremta ni a l'AEAT. JS pur: sense DOM, React ni xarxa.
 */
import { CONTROL, copiaCongelada, errorAmbCodi, textNet } from '../comu.js';
import { TIPUS_EMPREMTA, ZONA_AEAT, dataHoraAmbHus, empremtaDeRegistre } from './empremta.js';
import { comprovaAnterior } from './registreAlta.js';
import { ESQUEMA_ANULACIO, encadenamentDe, validaRegistre } from './validacio.js';

export { ESQUEMA_ANULACIO };

const MAX_MOTIU = 500;

/**
 * El registre d'anul·lació, amb l'empremta encadenada i congelat en profunditat.
 * @param {object} p
 * @param {object} p.alta el registre d'alta de la factura que s'anul·la
 * @param {object} p.anterior l'últim registre de la cadena de l'emissor
 * @param {string} [p.motiu] per què s'anul·la (local)
 * @param {number|Date} [p.instant] per defecte, ara
 * @param {string} [p.zona] per defecte, Europe/Madrid
 * @param {SubtleCrypto} [p.subtle] per defecte, crypto.subtle
 * @returns {Promise<Readonly<object>>}
 */
export async function creaRegistreAnulacio({ alta, anterior, motiu, instant = Date.now(), zona = ZONA_AEAT, subtle } = {}) {
  const errorsAlta = alta?.tipusRegistre === 'alta' ? validaRegistre(alta) : ['No és un registre d\'alta.'];
  if (errorsAlta.length) throw errorAmbCodi('REGISTRE_INVALID', `Només s'anul·la una factura registrada: ${errorsAlta.join(' ')}`, errorsAlta);
  if (anterior === null || anterior === undefined) {
    throw errorAmbCodi('REGISTRE_INVALID', 'Una anul·lació va sempre darrere d\'un altre registre: cal l\'últim de la cadena.');
  }
  comprovaAnterior(anterior, alta.idEmisor);
  if (anterior.ordre < alta.ordre) throw errorAmbCodi('CADENA_CANVIADA', 'L\'últim registre de la cadena és anterior a l\'alta que es vol anul·lar.');
  const motiuNet = textNet(motiu);
  if (motiu !== undefined && (motiuNet === '' || motiuNet.length > MAX_MOTIU || CONTROL.test(motiuNet))) {
    throw errorAmbCodi('REGISTRE_INVALID', `El motiu, si hi és, és un text de com a molt ${MAX_MOTIU} caràcters, sense salts de línia.`);
  }
  const senseEmpremta = {
    esquema: ESQUEMA_ANULACIO,
    tipusRegistre: 'anulacio',
    ordre: anterior.ordre + 1,
    idEmisor: alta.idEmisor,
    numSerie: alta.numSerie,
    dataExpedicio: alta.dataExpedicio,
    encadenament: encadenamentDe(anterior),
    dataHoraHusGeneracio: dataHoraAmbHus(instant, zona),
    tipusEmpremta: TIPUS_EMPREMTA,
    ...(motiu === undefined ? {} : { motiu: motiuNet })
  };
  const registre = copiaCongelada({ ...senseEmpremta, empremta: await empremtaDeRegistre(senseEmpremta, subtle) });
  const errors = validaRegistre(registre);
  if (errors.length) throw errorAmbCodi('REGISTRE_INVALID', `Registre d'anul·lació no vàlid: ${errors.join(' ')}`, errors);
  return registre;
}
