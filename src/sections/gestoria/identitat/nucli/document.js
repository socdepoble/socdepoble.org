/**
 * document.js — el document custodiat d'Identitat legal: la fitxa d'un
 * paper (alta, resolució, notificació, estatuts…) sense els bytes.
 *
 * La fitxa diu de quin TIPUS és (el catàleg tancat de baix), quin ORGANISME
 * l'emet, les seues DATES (del document, de la notificació i dels efectes),
 * una REFERÈNCIA opaca, l'empremta SHA-256 del fitxer, la SENSIBILITAT i la
 * CONSERVACIÓ. El fitxer es queda al disc de la persona.
 *
 * Guardes (MAPA de l'empresa, §4 pas 3):
 *   · Cap text porta un identificador personal (guardes.js): ni la
 *     referència és el número d'un document.
 *   · Del codi de verificació només es guarda QUE n'hi ha: qui el té pot
 *     baixar-se l'original, i al client no hi ha xifrat en repòs.
 *   · La salut queda FORA de l'ERP (art. 9 del RGPD): un document de salut
 *     no es pot crear ací, va a l'app Salut.
 *   · La sensibilitat només es pot pujar respecte de la del tipus, mai baixar.
 *   · Tots els terminis de conservació són «a verificar amb la gestoria» i el
 *     càlcul és prudent: acaba el 31 de desembre de l'any (data + n + 1). Cap
 *     document es proposa per a esborrar des d'ací: això és l'autoneteja, que
 *     només proposa.
 * Cap verb d'editar: corregir una fitxa és crear-ne una de nova.
 * JS pur: sense DOM, React ni xarxa.
 */
import {
  comprovaClaus, comprovaData, comprovaId, comprovaText, congela, esObjecte, esSha256, llancaSiCal, VERIFICAR
} from './guardes.js';
import { esTitular } from './titular.js';

export const SCHEMA_DOCUMENT = 'sdp.gestoria.document-custodiat.v1';

/* Els organismes que emeten els papers d'estos models (també els expedients). */
export const ORGANISMES = Object.freeze([
  'AEAT', 'TGSS', 'SEPE', 'LABORA', 'SUMA', 'OEPM', 'RED.ES', 'REGISTRE-ASSOCIACIONS', 'AJUNTAMENT', 'GENERALITAT',
  'NOTARIA', 'BANC', 'ALTRE'
]);

/* De menys a més sensible. Les tres del mig pesen igual: es pot passar
   d'una a l'altra, però mai baixar per davall de la del tipus. */
export const SENSIBILITATS = Object.freeze(['publica', 'administrativa', 'fiscal', 'financera', 'laboral', 'identitat']);
const PES = Object.freeze({ publica: 0, administrativa: 1, fiscal: 2, financera: 2, laboral: 2, identitat: 3 });

/* Les sensibilitats que no entren mai a l'ERP, amb el perquè. */
export const FORA_DE_LERP = Object.freeze({
  salut: 'Les dades de salut són categoria especial (art. 9 del RGPD): van a l’app Salut o a la caixa forta. La Gestoria, com a molt, sap que hi ha una incidència oberta.'
});

/* Les regles de conservació. `anys` compta des d'una de les dates del document. */
export const REGLES_CONSERVACIO = Object.freeze(['sempre', 'vigencia', 'anys', 'substituit', 'termini-recurs', 'com-el-vinculat', 'revisa']);

const tipus = (nom, sensibilitat, ambits, organismes, protegit, conservacio) => Object.freeze({
  nom, sensibilitat, ambits: Object.freeze(ambits), organismes: organismes ? Object.freeze(organismes) : null, protegit, conservacio: Object.freeze(conservacio)
});

/* El catàleg tancat dels documents d'Identitat legal (MAPA de l'empresa,
   §1 i §3.2). L'autoneteja (pas 7) en farà un de més ampli; este n'és el
   tros que custodia la identitat. */
export const TIPUS_DOCUMENT = Object.freeze({
  'document-identitat': tipus('Document d’identitat', 'identitat', ['LLAR'], null, true,
    { regla: 'vigencia', text: 'El vigent, mai. El caducat, destrucció segura i només amb un «sí».' }),
  'declaracio-censal': tipus('Declaració censal (alta, modificació o baixa)', 'fiscal', ['ACTIVITAT', 'ENTITAT'], ['AEAT'], true,
    { regla: 'sempre', text: 'Mentre l’activitat siga viva, i 4 anys més.' }),
  'reta-alta-baixa': tipus('Alta, baixa o variació del RETA', 'laboral', ['ACTIVITAT'], ['TGSS'], true,
    { regla: 'anys', anys: 4, des: 'efectes', text: '4 anys; es recomana conservar sempre l’últim informe de vida laboral.' }),
  'document-afiliacio': tipus('Document d’afiliació a la Seguretat Social', 'identitat', ['ACTIVITAT', 'LLAR'], ['TGSS'], true,
    { regla: 'sempre', text: 'Sempre: identifica la persona davant de la Seguretat Social.' }),
  'rebut-cotitzacio': tipus('Rebut de cotització', 'financera', ['ACTIVITAT'], ['TGSS', 'BANC'], false,
    { regla: 'anys', anys: 4, des: 'document', text: '4 anys.' }),
  'informe-vida-laboral': tipus('Informe de vida laboral o de bases', 'laboral', ['ACTIVITAT', 'LLAR'], ['TGSS'], false,
    { regla: 'substituit', text: 'Quan n’hi ha un de més nou: es conserva l’últim.' }),
  'certificat-titularitat': tipus('Certificat de titularitat bancària', 'financera', ['LLAR', 'ACTIVITAT', 'ENTITAT'], ['BANC'], false,
    { regla: 'substituit', text: 'Quan canvia el compte o caduca la vigència que demana l’organisme.' }),
  'demanda-ocupacio': tipus('Demanda d’ocupació i renovacions', 'laboral', ['LLAR'], ['SEPE', 'LABORA'], false,
    { regla: 'substituit', text: 'L’anterior, quan es renova (es conserva la prova de la renovació).' }),
  // Vigent mentre no el substituïx un altre: la fitxa no sap quan acaba, i per això és protegit.
  'model-145': tipus('Model 145 (dades per a les retencions)', 'fiscal', ['ACTIVITAT', 'LLAR'], null, true,
    { regla: 'vigencia', anys: 4, text: 'Mentre estiga vigent, i 4 anys més.' }),
  estatuts: tipus('Estatuts', 'administrativa', ['ENTITAT'], ['REGISTRE-ASSOCIACIONS', 'NOTARIA'], true,
    { regla: 'sempre', text: 'Sempre.' }),
  'inscripcio-registre': tipus('Inscripció al registre d’entitats', 'administrativa', ['ENTITAT'], ['REGISTRE-ASSOCIACIONS', 'GENERALITAT'], true,
    { regla: 'sempre', text: 'Sempre.' }),
  'targeta-nif-entitat': tipus('Targeta del NIF de l’entitat', 'identitat', ['ENTITAT'], ['AEAT'], true,
    { regla: 'vigencia', text: 'Mentre l’entitat existisca.' }),
  'certificat-representacio': tipus('Certificat de representació', 'identitat', ['ENTITAT'], null, true,
    { regla: 'vigencia', text: 'Mentre la representació siga vigent.' }),
  'notificacio-administrativa': tipus('Notificació o resolució administrativa', 'administrativa', ['LLAR', 'ACTIVITAT', 'ENTITAT'], null, true,
    { regla: 'termini-recurs', anys: 4, des: 'notificacio', text: 'Mentre hi haja termini de recurs, mai; després, 4 anys des que és ferma.' }),
  'expedient-marca': tipus('Expedient de marca (sol·licitud, suspens, concessió)', 'administrativa', ['ACTIVITAT', 'ENTITAT'], ['OEPM'], true,
    { regla: 'sempre', text: 'Mentre la marca estiga viva i, com a prova, sempre.' }),
  'signatura-electronica': tipus('Signatura electrònica (justificant de signatura)', 'administrativa', ['LLAR', 'ACTIVITAT', 'ENTITAT'], null, true,
    { regla: 'com-el-vinculat', text: 'Amb el document que signa.' }),
  desconegut: tipus('Document sense tipus', 'identitat', ['LLAR', 'ACTIVITAT', 'ENTITAT'], null, true,
    { regla: 'revisa', text: 'Mai sense revisar-lo.' })
});

const CLAUS = Object.freeze(['id', 'titular', 'tipus', 'organisme', 'dates', 'referencia', 'sha256', 'sensibilitat', 'teCodiVerificacio', 'vinculatA']);
const CLAUS_DATES = Object.freeze(['document', 'notificacio', 'efectes']);

function comprovaSensibilitat(dades, fitxa, errors) {
  if (dades.sensibilitat === undefined) return fitxa.sensibilitat;
  if (Object.hasOwn(FORA_DE_LERP, dades.sensibilitat)) {
    errors.push({ codi: 'FORA_DE_LERP', camp: 'document.sensibilitat', missatge: FORA_DE_LERP[dades.sensibilitat] });
    return null;
  }
  if (!SENSIBILITATS.includes(dades.sensibilitat)) {
    errors.push({ codi: 'SENSIBILITAT_INVALIDA', camp: 'document.sensibilitat', missatge: `La sensibilitat és una de: ${SENSIBILITATS.join(', ')}.` });
    return null;
  }
  if (PES[dades.sensibilitat] < PES[fitxa.sensibilitat]) {
    errors.push({ codi: 'SENSIBILITAT_REBAIXADA', camp: 'document.sensibilitat', missatge: `Un document de tipus «${fitxa.nom}» és com a mínim «${fitxa.sensibilitat}».` });
    return null;
  }
  return dades.sensibilitat;
}

function comprovaDates(dates, errors) {
  if (dates === undefined) return { document: null, notificacio: null, efectes: null };
  if (!esObjecte(dates)) {
    errors.push({ codi: 'DATES_INVALIDES', camp: 'document.dates', missatge: 'Les dates són un objecte { document, notificacio, efectes }.' });
    return { document: null, notificacio: null, efectes: null };
  }
  comprovaClaus(dates, CLAUS_DATES, 'document.dates', errors);
  const net = Object.fromEntries(CLAUS_DATES.map((clau) => [clau, comprovaData(dates[clau], `document.dates.${clau}`, errors)]));
  // Una notificació no pot arribar abans que el document existisca; els efectes, sí (poden ser retroactius).
  if (net.document && net.notificacio && net.notificacio < net.document) {
    errors.push({ codi: 'DATES_INCOHERENTS', camp: 'document.dates.notificacio', missatge: 'La notificació no pot ser anterior a la data del document.' });
  }
  return net;
}

/**
 * Els errors d'una fitxa de document, sense llançar: [] si és vàlida. Amb
 * `titular` (creat amb creaTitular), també es comprova que el tipus és del
 * seu àmbit i que la fitxa és seua.
 */
export function validaDocument(dades, { titular } = {}) {
  const errors = [];
  if (!esObjecte(dades)) return [{ codi: 'DOCUMENT_INVALID', camp: 'document', missatge: 'La fitxa del document ha de ser un objecte.' }];
  comprovaClaus(dades, CLAUS, 'document', errors);
  comprovaId(dades.id, 'document.id', errors);
  comprovaId(dades.titular, 'document.titular', errors);
  comprovaId(dades.referencia, 'document.referencia', errors, { obligatori: false });
  comprovaId(dades.vinculatA, 'document.vinculatA', errors, { obligatori: false });
  comprovaText(dades.organisme, 'document.organisme', errors, { obligatori: true, maxim: 40 });
  if (!esSha256(dades.sha256)) errors.push({ codi: 'SHA256_INVALID', camp: 'document.sha256', missatge: 'L’empremta és un SHA-256 en hexadecimal (64 xifres).' });
  if (dades.teCodiVerificacio !== undefined && typeof dades.teCodiVerificacio !== 'boolean') {
    errors.push({ codi: 'CODI_VERIFICACIO_INVALID', camp: 'document.teCodiVerificacio', missatge: 'Del codi de verificació només es guarda si n’hi ha (cert o fals), mai el codi.' });
  }
  comprovaDates(dades.dates, errors);
  const fitxa = Object.hasOwn(TIPUS_DOCUMENT, dades.tipus ?? '') ? TIPUS_DOCUMENT[dades.tipus] : null;
  if (!fitxa) {
    errors.push({ codi: 'TIPUS_DESCONEGUT', camp: 'document.tipus', missatge: 'El tipus no és al catàleg: si no se sap què és, el tipus és «desconegut».' });
    return errors;
  }
  comprovaSensibilitat(dades, fitxa, errors);
  if (typeof dades.organisme === 'string') {
    if (!ORGANISMES.includes(dades.organisme)) errors.push({ codi: 'ORGANISME_DESCONEGUT', camp: 'document.organisme', missatge: `L’organisme és un de: ${ORGANISMES.join(', ')}.` });
    else if (fitxa.organismes && !fitxa.organismes.includes(dades.organisme) && dades.organisme !== 'ALTRE') {
      errors.push({ codi: 'ORGANISME_INCOMPATIBLE', camp: 'document.organisme', missatge: `Un document de tipus «${fitxa.nom}» l’emet ${fitxa.organismes.join(' o ')}.` });
    }
  }
  if (fitxa.conservacio.regla === 'com-el-vinculat' && !dades.vinculatA) {
    errors.push({ codi: 'CAMP_OBLIGATORI', camp: 'document.vinculatA', missatge: 'Una signatura apunta al document que signa.' });
  }
  if (titular !== undefined) {
    if (!esTitular(titular)) errors.push({ codi: 'TITULAR_INVALID', camp: 'titular', missatge: 'El titular s’ha de crear amb creaTitular.' });
    else {
      if (titular.id !== dades.titular) errors.push({ codi: 'TITULAR_DIFERENT', camp: 'document.titular', missatge: 'La fitxa no és d’este titular.' });
      if (!fitxa.ambits.includes(titular.ambit)) {
        errors.push({ codi: 'AMBIT_INCOMPATIBLE', camp: 'document.tipus', missatge: `Un document de tipus «${fitxa.nom}» no és de l’àmbit ${titular.ambit}.` });
      }
    }
  }
  return errors;
}

/* El 31 de desembre de l'any (data + anys + 1): prudent per a qualsevol
   termini que compte des del final d'un període de declaració. */
const finsPrudent = (data, anys) => `${Number(data.slice(0, 4)) + anys + 1}-12-31`;

/**
 * La conservació d'una fitxa: { regla, fins, protegit, text, verificar }.
 * `fins` és la primera data en què es podria pensar a llençar-lo, o null
 * quan no se'n pot dir cap (sempre, vigència, substituït, sense la data de
 * referència…). Un document protegit no és mai candidat automàtic.
 * Un document de la regla «vigencia» és protegit SEMPRE des d'ací i no té
 * cap data: la fitxa no sap quan acaba la vigència, i el termini que en
 * compta els anys de després (el model 145, «i 4 anys més») només el pot
 * calcular l'autoneteja quan la persona diu la data de fi.
 */
export function conservacioDe(fitxa, dates) {
  const { regla, anys, des, text } = fitxa.conservacio;
  const vigencia = regla === 'vigencia';
  const base = !vigencia && anys && dates?.[des] ? dates[des] : null;
  return {
    regla,
    fins: base ? finsPrudent(base, anys) : null,
    protegit: fitxa.protegit || vigencia,
    text,
    verificar: VERIFICAR
  };
}

/**
 * Una fitxa de document congelada, o un error DOCUMENT_INVALID amb els detalls.
 * @returns {Readonly<object>}
 */
export function creaDocument(dades, opcions) {
  llancaSiCal(validaDocument(dades, opcions), 'DOCUMENT_INVALID', 'La fitxa del document no és vàlida');
  const fitxa = TIPUS_DOCUMENT[dades.tipus];
  const dates = comprovaDates(dades.dates, []);
  return congela({
    schema: SCHEMA_DOCUMENT,
    id: dades.id,
    titular: dades.titular,
    tipus: dades.tipus,
    organisme: dades.organisme,
    dates,
    referencia: dades.referencia ?? null,
    sha256: dades.sha256.toLowerCase(),
    sensibilitat: dades.sensibilitat ?? fitxa.sensibilitat,
    teCodiVerificacio: dades.teCodiVerificacio === true,
    vinculatA: dades.vinculatA ?? null,
    conservacio: conservacioDe(fitxa, dates)
  });
}

/**
 * Les fitxes amb el mateix SHA-256 (el mateix fitxer custodiat dues
 * vegades): [{ sha256, ids }]. Només ho diu; no en tria ni n'esborra cap.
 */
export function duplicatsPerEmpremta(documents) {
  const perEmpremta = new Map();
  for (const doc of documents ?? []) {
    if (!doc || !esSha256(doc.sha256)) continue;
    const clau = doc.sha256.toLowerCase();
    perEmpremta.set(clau, [...(perEmpremta.get(clau) ?? []), doc.id]);
  }
  return congela([...perEmpremta].filter(([, ids]) => ids.length > 1).map(([sha256, ids]) => ({ sha256, ids: [...ids].sort() }))
    .sort((a, b) => (a.sha256 < b.sha256 ? -1 : 1)));
}
