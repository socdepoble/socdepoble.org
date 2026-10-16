/**
 * herencia.js — La llicència per defecte de cada identitat (sense migració).
 *
 * T39 (ordre del Mestre, 260928) · Els drets de la FITXA del Perfil són els de
 * sèrie de les notes noves que crea amb «CREAR NOTA».
 * Les notes que ja té no canvien mai: el valor es copia en crear la nota,
 * no en pintar-la.
 * Directiva de Dignitat Humana (pla 261015_1900) · La fitxa d'una PERSONA ja
 * no mostra ni tria drets (una persona no és una obra).
 * Pla 261016 (Bloc 3.1; ordre del Mestre) · Els drets de sèrie de les notes
 * d'una persona es trien a «El compte» (l'ajust 'drets-notes' de
 * PerfilContext, que DetallAjust pinta amb CopyrightPage): es desen a la
 * mateixa columna de sempre (profiles.copyright) i, si el servidor l'accepta,
 * també a la preferència d'este dispositiu. Cada nota els pot canviar a
 * l'editor. L'entitat continua triant-los a la seua fitxa.
 *
 * On viu:
 *   · Una entitat: el `copyright` de la pertinença (IdentitatContext.memberships,
 *     ve del servidor sense cap crida nova). Guanya sempre.
 *   · Si no n'hi ha (o per a la persona, que no el porta a la sessió), una
 *     preferència d'este dispositiu per identitat (config/storage: getVal /
 *     setVal, síncrona i xicoteta). PerfilEditor la fa mirall de la fitxa:
 *     per a una entitat, l'esborrany de «Desar autoria» mentre la cua el
 *     guarda (encara que el servidor el rebutge) i, si no n'hi ha, el valor
 *     del servidor; per a la persona, només el del servidor, com «El compte».
 *     Gauntlet 261016 (encàrrec E) · Per a la persona, IdentitatContext també
 *     la posa al dia amb la fila de profiles en carregar la sessió: «El
 *     compte» desa al servidor, i un dispositiu on no s'ha obert ni «El
 *     compte» ni la fitxa ja hereta els drets triats en un altre.
 * Sense cap de les dues, este mòdul torna null. D15 (ordre del Mestre,
 * 260930): llavors la nota nova de «CREAR NOTA» naix amb la Creative Commons
 * de sèrie (LLICENCIA_PER_DEFECTE, la posa NotesSection). Les dades no es
 * migren: una nota vella sense drets continua sense `copyright`.
 *
 * El text que es PINTA per a un element sense drets, en canvi, encara depén
 * de la superfície (revisió del 261007, I1 i M3-01): el Mur, el Mercat, l'acte
 * i la pàgina de detall hi pinten COPYRIGHT_SDP (editorial.js, CC BY-NC-SA
 * 4.0); l'editor (DocumentEditor), el lector del MAS (PublicacioDetall) i la
 * nota de benvinguda (NotesEditor), «© Sóc de Poble». Quina és la reserva
 * única està pendent del Mestre.
 */
import { getVal, setVal, delVal } from '../../../config/storage.js';
import { netejaText } from '../../../utils/sanitize.js';
import { MAXIM_COPYRIGHT } from './llicencies.js';

const CLAU = 'llicencia-per-defecte';
const clauDe = (id) => `${CLAU}:${id}`;
const idValid = (id) => (typeof id === 'string' && id.trim() !== '') || (typeof id === 'number' && Number.isFinite(id));

/** Text net i tallat al CHECK de la columna (256); qualsevol altra cosa → ''. */
export function netejaLlicencia(valor) {
  return typeof valor === 'string' ? netejaText(valor, MAXIM_COPYRIGHT) : '';
}

/** La preferència d'esta identitat en este dispositiu, o null. Es neteja també en llegir. */
export function llegixLlicenciaPerDefecte(id) {
  if (!idValid(id)) return null;
  return netejaLlicencia(getVal(clauDe(id), null)) || null;
}

/** Desa (o, amb un valor buit, esborra) la preferència. Torna true si ha quedat escrit. */
export function desaLlicenciaPerDefecte(id, valor) {
  if (!idValid(id)) return false;
  const net = netejaLlicencia(valor);
  return net ? setVal(clauDe(id), net) : delVal(clauDe(id));
}

/**
 * T39 (correcció de la revisió, 260928) · Copia a la preferència un valor que
 * ja és de la fitxa (el del servidor o l'esborrany que la cua encara guarda),
 * damunt de qualsevol còpia vella. Un valor buit no esborra res: la columna
 * pot faltar al servidor. Només escriu si canvia; torna true si ho ha fet.
 */
export function sincronitzaLlicenciaPerDefecte(id, valor) {
  const net = netejaLlicencia(valor);
  if (!idValid(id) || !net || net === llegixLlicenciaPerDefecte(id)) return false;
  return setVal(clauDe(id), net);
}

/** Prioritat: el valor del servidor > la preferència del dispositiu > null. */
export function llicenciaHeretada({ id, servidor } = {}) {
  return netejaLlicencia(servidor) || llegixLlicenciaPerDefecte(id);
}

/**
 * La llicència que hereta una nota nova de l'actor que la crea. Per a una
 * entitat, el `copyright` de la seua pertinença; `memberships` pot faltar.
 */
export function llicenciaDeLActor({ id, tipus, memberships } = {}) {
  const servidor = tipus === 'entitat' && Array.isArray(memberships)
    ? memberships.find((m) => m && String(m.id) === String(id))?.copyright
    : null;
  return llicenciaHeretada({ id, servidor });
}
