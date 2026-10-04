/**
 * titular.js — el titular de les dades de la Gestoria: una persona o una
 * entitat, amb un id opac i un àmbit.
 *
 * Tres àmbits, amb frontera dura entre ells (MAPA de l'empresa, §4 pas 6):
 *   · LLAR: la persona i la casa.
 *   · ACTIVITAT: la mateixa persona com a autònoma. Un registre propi, que
 *     apunta al de la llar amb `persona`, perquè res de la llar entre mai en
 *     un registre fiscal de l'activitat.
 *   · ENTITAT: una associació, cooperativa o societat, amb els seus
 *     representants (ids de persones).
 *
 * El model NO guarda cap número d'identitat ni cap compte: el NIF de
 * l'emissor de Facturació viu en configuració local i el document que el
 * prova és un document custodiat (document.js). El titular només porta un
 * àlies que tria la persona. Cap verb d'editar: un canvi és un titular nou.
 * JS pur: sense DOM, React ni xarxa.
 */
import { comprovaClaus, comprovaId, comprovaText, congela, esIdOpac, esObjecte, llancaSiCal } from './guardes.js';

export const SCHEMA_TITULAR = 'sdp.gestoria.titular.v1';
export const AMBITS = Object.freeze(['LLAR', 'ACTIVITAT', 'ENTITAT']);
export const TIPUS_TITULAR = Object.freeze(['persona', 'entitat']);
export const FORMES_ENTITAT = Object.freeze(['associacio', 'cooperativa', 'fundacio', 'societat', 'altra']);

/* Quins àmbits pot tindre cada tipus de titular. */
const AMBITS_DEL_TIPUS = Object.freeze({ persona: Object.freeze(['LLAR', 'ACTIVITAT']), entitat: Object.freeze(['ENTITAT']) });
const CLAUS = Object.freeze(['id', 'tipus', 'ambit', 'alies', 'formaJuridica', 'persona', 'representants']);

/* L'alfabet de l'id que es genera: setze lletres i cap xifra. Sense xifres,
   cap tros d'un id generat pot tindre la forma d'un DNI o d'un IBAN. */
const LLETRES = 'abcdefghijklmnop';

/**
 * Un id opac nou, a partir de bytes aleatoris que dona qui crida (en el
 * navegador, crypto.getRandomValues(new Uint8Array(16))): el model no tria
 * l'atzar, i les proves en poden passar uns de fixos.
 * @param {string} prefix tres a dotze lletres minúscules, com «tit» o «doc»
 * @param {Uint8Array} bytes almenys 16 bytes
 * @returns {string}
 */
export function nouIdOpac(prefix, bytes) {
  if (typeof prefix !== 'string' || !/^[a-z]{3,12}$/.test(prefix)) throw new TypeError('El prefix de l’id són de tres a dotze lletres minúscules.');
  if (!(bytes instanceof Uint8Array) || bytes.length < 16) throw new TypeError('Calen almenys 16 bytes aleatoris per a un id opac.');
  let cos = '';
  for (const byte of bytes) cos += LLETRES[byte >> 4] + LLETRES[byte & 15];
  return `${prefix}_${cos}`;
}

/**
 * Els errors d'un titular, sense llançar: [] si és vàlid.
 * @returns {{ codi: string, camp: string, missatge: string }[]}
 */
export function validaTitular(dades) {
  const errors = [];
  if (!esObjecte(dades)) return [{ codi: 'TITULAR_INVALID', camp: 'titular', missatge: 'El titular ha de ser un objecte.' }];
  comprovaClaus(dades, CLAUS, 'titular', errors);
  comprovaId(dades.id, 'titular.id', errors);
  comprovaText(dades.alies, 'titular.alies', errors, { obligatori: true, maxim: 80 });
  if (!TIPUS_TITULAR.includes(dades.tipus)) {
    errors.push({ codi: 'TIPUS_INVALID', camp: 'titular.tipus', missatge: `El tipus de titular és ${TIPUS_TITULAR.join(' o ')}.` });
    return errors;
  }
  if (!AMBITS_DEL_TIPUS[dades.tipus].includes(dades.ambit)) {
    errors.push({ codi: 'AMBIT_INVALID', camp: 'titular.ambit', missatge: `Una ${dades.tipus} només pot tindre l’àmbit ${AMBITS_DEL_TIPUS[dades.tipus].join(' o ')}.` });
  }
  if (dades.tipus === 'entitat') {
    if (!FORMES_ENTITAT.includes(dades.formaJuridica)) {
      errors.push({ codi: 'FORMA_INVALIDA', camp: 'titular.formaJuridica', missatge: `La forma jurídica és una de: ${FORMES_ENTITAT.join(', ')}.` });
    }
    if (dades.persona != null) errors.push({ codi: 'CAMP_SOBRANT', camp: 'titular.persona', missatge: 'Una entitat no apunta a cap llar.' });
    if (dades.representants != null) {
      if (!Array.isArray(dades.representants)) errors.push({ codi: 'REPRESENTANTS_INVALIDS', camp: 'titular.representants', missatge: 'Els representants són una llista d’ids de persones.' });
      else dades.representants.forEach((id, i) => comprovaId(id, `titular.representants[${i}]`, errors));
    }
    return errors;
  }
  if (dades.formaJuridica != null) errors.push({ codi: 'CAMP_SOBRANT', camp: 'titular.formaJuridica', missatge: 'Una persona no té forma jurídica.' });
  if (dades.representants != null) errors.push({ codi: 'CAMP_SOBRANT', camp: 'titular.representants', missatge: 'Només una entitat té representants.' });
  if (dades.ambit === 'ACTIVITAT') comprovaId(dades.persona, 'titular.persona', errors);
  else if (dades.persona != null) errors.push({ codi: 'CAMP_SOBRANT', camp: 'titular.persona', missatge: 'Només l’àmbit ACTIVITAT apunta a la llar de la persona.' });
  return errors;
}

/**
 * Un titular congelat, o un error TITULAR_INVALID amb tots els detalls.
 * @returns {Readonly<object>}
 */
export function creaTitular(dades) {
  llancaSiCal(validaTitular(dades), 'TITULAR_INVALID', 'El titular no és vàlid');
  const entitat = dades.tipus === 'entitat';
  return congela({
    schema: SCHEMA_TITULAR,
    id: dades.id,
    tipus: dades.tipus,
    ambit: dades.ambit,
    alies: dades.alies.trim(),
    formaJuridica: entitat ? dades.formaJuridica : null,
    persona: dades.ambit === 'ACTIVITAT' ? dades.persona : null,
    representants: entitat ? [...new Set(dades.representants ?? [])].sort() : []
  });
}

/* Cert si el valor té la forma d'un titular creat per creaTitular. */
export const esTitular = (valor) => esObjecte(valor) && valor.schema === SCHEMA_TITULAR && esIdOpac(valor.id) && AMBITS.includes(valor.ambit);

/**
 * Els errors d'un conjunt de titulars (multititular): ids únics; l'activitat
 * apunta a la llar d'una persona que hi és; els representants d'una entitat
 * són persones que hi són. [] si tot quadra.
 * @param {object[]} titulars creats amb creaTitular
 */
export function validaTitulars(titulars) {
  if (!Array.isArray(titulars)) return [{ codi: 'TITULARS_INVALIDS', camp: 'titulars', missatge: 'Cal la llista de titulars.' }];
  const errors = [];
  const perId = new Map();
  titulars.forEach((t, i) => {
    if (!esTitular(t)) errors.push({ codi: 'TITULAR_INVALID', camp: `titulars[${i}]`, missatge: 'Cada titular s’ha de crear amb creaTitular.' });
    else if (perId.has(t.id)) errors.push({ codi: 'ID_REPETIT', camp: `titulars[${i}].id`, missatge: `L’id ${t.id} es repetix.` });
    else perId.set(t.id, t);
  });
  for (const t of perId.values()) {
    if (t.ambit === 'ACTIVITAT') {
      const llar = perId.get(t.persona);
      if (!llar || llar.tipus !== 'persona' || llar.ambit !== 'LLAR') {
        errors.push({ codi: 'PERSONA_ABSENT', camp: `${t.id}.persona`, missatge: 'L’activitat ha d’apuntar a la llar d’una persona del conjunt.' });
      }
    }
    for (const id of t.representants) {
      const representant = perId.get(id);
      if (!representant || representant.tipus !== 'persona') {
        errors.push({ codi: 'REPRESENTANT_ABSENT', camp: `${t.id}.representants`, missatge: 'Cada representant ha de ser una persona del conjunt.' });
      }
    }
  }
  return errors;
}

/* Els titulars d'un àmbit, en l'ordre en què arriben: la llar mai veu l'activitat ni l'entitat. */
export function titularsDeLAmbit(titulars, ambit) {
  if (!AMBITS.includes(ambit)) throw new RangeError(`Àmbit desconegut: ${ambit}`);
  return (titulars ?? []).filter((t) => esTitular(t) && t.ambit === ambit);
}
