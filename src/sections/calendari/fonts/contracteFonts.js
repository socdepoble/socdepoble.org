/**
 * contracteFonts.js — el contracte d'una FONT DE CALENDARI, pur (sense React).
 *
 * T1 (prompt comú 261002_0125) · El calendari de /calendari pot sumar-hi
 * calendaris de fora: Google Calendar avui; demà Sollutia o un .ics. Llei de
 * l'Enxufabilitat (AGENTS.md §8): la interfície no sap d'on venen les
 * entrades, només coneix este contracte. Cada proveïdor és un adaptador que
 * el complix (googleCalendar.js · crearFontGoogle).
 *
 * FONT (congelada; creaFont llança un TypeError si alguna peça no hi és)
 *   id          minúscules, xifres i guionets: la clau de les seues entrades.
 *   nom         el que es llig a «Els meus calendaris».
 *   tipus       el proveïdor ('gcal', 'sollutia', 'ics'…).
 *   colorToken  el NOM d'un token de color (COLORS_DE_FONT), mai un color
 *               cru: la pell el traduïx a una classe (PanellFontsCalendari).
 *   activa      si la casella està marcada d'entrada.
 *   compte      el compte que l'autoritza, o null: les fonts d'un mateix
 *               compte compartixen la connexió.
 *   llistaEntrades({ desde, fins, signal }) → Promise<entrada[]>
 *               Les entrades del rang semiobert [desde, fins) (dos Date), en
 *               la MATEIXA forma que les de l'agenda de Sollutia
 *               (calendariGlobal.js · entradaDeLAgenda): el calendari, les
 *               vistes i les targetes de davall no en distingixen la font.
 *               Falla amb un ErrorDeFont tipat, o amb un AbortError si
 *               `signal` s'avorta.
 *
 * FALLADA TANCADA, com l'agenda: una resposta que no és una llista, un
 * esdeveniment que no passa pel model o la mateixa entrada dos vegades fan
 * fallar TOTA la font (RESPOSTA_INVALIDA). Mai mitja font.
 */
import { llegixDataHora } from '../../../utils/esdeveniment.js';
import { momentDeLaTargeta } from '../../mur/targetesMur.js';
import { diaDeLaClau } from '../calendariGlobal.js';

/** Els errors tipats d'una font. La interfície decidix per `tipus`, mai pel text. */
export const ERRORS_DE_FONT = Object.freeze({
  SENSE_CONFIGURACIO: 'SENSE_CONFIGURACIO',
  SENSE_AUTORITZACIO: 'SENSE_AUTORITZACIO',
  TOKEN_CADUCAT: 'TOKEN_CADUCAT',
  SENSE_ACCES: 'SENSE_ACCES',
  XARXA: 'XARXA',
  RESPOSTA_INVALIDA: 'RESPOSTA_INVALIDA'
});

const MISSATGES = Object.freeze({
  SENSE_CONFIGURACIO: 'Esta font de calendari no està configurada.',
  SENSE_AUTORITZACIO: 'Cal connectar el compte per a llegir este calendari.',
  TOKEN_CADUCAT: 'La connexió ha caducat: torna a connectar el compte.',
  SENSE_ACCES: 'Este compte no pot llegir este calendari.',
  XARXA: 'Ara mateix no podem consultar este calendari.',
  RESPOSTA_INVALIDA: 'La resposta del calendari no s’ha pogut llegir.'
});

/** Els tokens de color que pot portar una font (el nom, sense «--sdp-»). */
export const COLORS_DE_FONT = Object.freeze(['accio', 'accent', 'exit', 'avis', 'error']);

const ID_FONT = /^[a-z][a-z0-9-]{0,31}$/;
const BUIDA = Object.freeze([]);

/**
 * L'error d'una font. `estat` és l'estat HTTP, si n'hi ha; `motiu`, el detall
 * del proveïdor (o 'estat' quan una resposta d'autorització no és nostra).
 */
export class ErrorDeFont extends Error {
  constructor(tipus, missatge, { estat = null, motiu = null, causa } = {}) {
    const net = Object.hasOwn(ERRORS_DE_FONT, tipus) ? tipus : ERRORS_DE_FONT.XARXA;
    super(missatge || MISSATGES[net]);
    this.name = 'ErrorDeFont';
    this.tipus = net;
    this.estat = estat;
    this.motiu = motiu;
    if (causa !== undefined) this.cause = causa;
  }
}

/** Qualsevol error com a ErrorDeFont: el que no és tipat és de XARXA (no se n'inventa cap altre). */
export function aErrorDeFont(error) {
  return error instanceof ErrorDeFont ? error : new ErrorDeFont(ERRORS_DE_FONT.XARXA, undefined, { causa: error });
}

/** L'error com a dada plana per a l'estat de la interfície: { tipus, missatge }. */
export const errorPla = (error) => {
  const tipat = aErrorDeFont(error);
  return Object.freeze({ tipus: tipat.tipus, missatge: tipat.message });
};

const textONull = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);

/** Una font del contracte, congelada. */
export function creaFont({ id, nom, tipus, colorToken, activa = true, compte = null, llistaEntrades } = {}) {
  if (typeof id !== 'string' || !ID_FONT.test(id)) throw new TypeError('[fonts] Una font necessita un id de minúscules, xifres i guionets.');
  const nomNet = textONull(nom);
  if (!nomNet) throw new TypeError(`[fonts] La font «${id}» necessita un nom.`);
  const tipusNet = textONull(tipus);
  if (!tipusNet) throw new TypeError(`[fonts] La font «${id}» necessita un tipus de proveïdor.`);
  if (!COLORS_DE_FONT.includes(colorToken)) throw new TypeError(`[fonts] «${colorToken}» no és cap token de color de font (${COLORS_DE_FONT.join(', ')}).`);
  if (typeof llistaEntrades !== 'function') throw new TypeError(`[fonts] La font «${id}» no sap llistar entrades.`);
  return Object.freeze({ id, nom: nomNet, tipus: tipusNet, colorToken, activa: activa !== false, compte: textONull(compte), llistaEntrades });
}

/* L'instant (ms) en què comença: la mitjanit local d'un acte de tot el dia o
   l'instant de la seua hora (la mateixa regla que calendariGlobal.js · iniciEnMs). */
const iniciEnMs = (esd) => (esd.totElDia
  ? diaDeLaClau(esd.inici.data)?.getTime()
  : llegixDataHora(esd.inici.dataHora)?.instant) ?? null;

/* L'ActeDTO de l'esdeveniment ({ id, titol, inici, fi, lloc, descripcio },
   la forma de l'agenda de Sollutia) i la font d'on ve. Les targetes de
   davall el pinten com un acte de l'agenda (TargetaDeLAgenda). */
const acteDe = (esd, idFont) => Object.freeze({
  id: esd.id,
  titol: esd.titol,
  inici: esd.inici.data ?? esd.inici.dataHora,
  fi: esd.fi ? (esd.fi.data ?? esd.fi.dataHora) : null,
  lloc: esd.lloc,
  descripcio: esd.descripcio,
  font: idFont
});

/**
 * L'entrada del calendari d'un esdeveniment del model (creaEsdeveniment) d'una
 * font, o null. La forma d'entradaDeLAgenda més `font`; la clau porta la font,
 * l'id i l'inici: el mateix acte en dos calendaris són dues entrades.
 */
export function entradaDeFont(idFont, esdeveniment) {
  if (typeof idFont !== 'string' || !ID_FONT.test(idFont) || !esdeveniment?.inici) return null;
  const inici = iniciEnMs(esdeveniment);
  if (inici === null) return null;
  return Object.freeze({
    clau: `font-${idFont}-${esdeveniment.id}@${inici}`,
    font: idFont,
    item: null,
    agenda: acteDe(esdeveniment, idFont),
    acte: esdeveniment,
    esdeveniment,
    dia: null,
    moment: momentDeLaTargeta(null, esdeveniment)
  });
}

/* Llança RESPOSTA_INVALIDA si les entrades no són una llista d'entrades
   d'esta font o si n'hi ha dues amb la mateixa clau. */
function exigixEntrades(idFont, entrades) {
  if (!Array.isArray(entrades)) throw new ErrorDeFont(ERRORS_DE_FONT.RESPOSTA_INVALIDA, 'La resposta del calendari no és una llista.');
  const valida = (entrada) => entrada && typeof entrada.clau === 'string' && entrada.font === idFont && entrada.item === null
    && entrada.agenda && entrada.esdeveniment?.inici && entrada.acte === entrada.esdeveniment;
  if (!entrades.every(valida)) throw new ErrorDeFont(ERRORS_DE_FONT.RESPOSTA_INVALIDA, 'Un esdeveniment del calendari no passa pel model d’esdeveniment.');
  if (new Set(entrades.map((entrada) => entrada.clau)).size !== entrades.length) {
    throw new ErrorDeFont(ERRORS_DE_FONT.RESPOSTA_INVALIDA, 'Dos esdeveniments del calendari porten el mateix identificador i el mateix inici.');
  }
}

/**
 * Les entrades d'una llista d'esdeveniments del model (null si un no hi ha
 * passat). Fallada tancada: RESPOSTA_INVALIDA abans que mitja llista.
 */
export function entradesDeFont(idFont, esdeveniments) {
  if (!Array.isArray(esdeveniments)) throw new ErrorDeFont(ERRORS_DE_FONT.RESPOSTA_INVALIDA, 'La resposta del calendari no és una llista.');
  const entrades = esdeveniments.map((esd) => entradaDeFont(idFont, esd));
  exigixEntrades(idFont, entrades);
  return entrades.length ? entrades : BUIDA;
}

/**
 * La comprovació que fa la interfície amb el que torna QUALSEVOL adaptador
 * (el de Google, el de Sollutia de demà…): torna les entrades o llança
 * RESPOSTA_INVALIDA.
 */
export function validaEntradesDeFont(idFont, entrades) {
  exigixEntrades(idFont, entrades);
  return entrades;
}
