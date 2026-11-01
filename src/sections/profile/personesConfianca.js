/**
 * personesConfianca.js — El model pur del bloc «Persones de confiança» de
 * Privacitat i dades (IDEA-48, estat previ a F7; pla 261101_1246, T7 · S6;
 * disseny E2EE §5.6).
 *
 * La recuperació social amb Shamir k = 3 (xifratXatRecuperacio.js) encara no
 * està cablejada: falten les RPC de F7, els vectors independents i la revisió
 * específica del protocol. Este bloc només diu el que ja és cert en este
 * aparell: quants contactes té la persona amb el número de seguretat verificat
 * i quants li'n falten per a arribar al llindar de tres. Cap acció de crear el
 * cercle. Mentre la capacitat `recuperacioSocial` no hi siga (teRecuperacio
 * fals), el bloc diu en tots els estats que la recuperació encara no està activa
 * (Gauntlet T7b-G02): cap text no la presenta com si ja existira.
 *
 * Els llindars es dupliquen ací a posta (la recuperació no entra al paquet: és
 * una excepció d'orfe de tractor-pedra-seca.mjs) i una prova els fixa contra
 * xifratXatRecuperacio.js (personesConfianca.test.js).
 */

/** k: les persones de confiança que, juntes, poden ajudar a recuperar (DM-7). */
export const LLINDAR_CONFIANCA = 3;
/** n màxim del cercle (el CHECK `n between k and 255`). */
export const MAX_PERSONES_CONFIANCA = 255;

/** Els estats del bloc. 'actiu': n'hi ha prou i la recuperació ja està activa (F7). */
export const ESTAT_CONFIANCA = Object.freeze({ cap: 'cap', falten: 'falten', aPunt: 'a-punt', actiu: 'actiu' });

const parell = (nom, reserva) => Object.freeze([`section.perfil.privacitat.confianca.${nom}`, reserva]);

/** Els textos [clau, reserva en valencià] del bloc. */
export const TEXTOS_CONFIANCA = Object.freeze({
  titol: parell('titol', 'Persones de confiança'),
  explica: parell('explica', 'Si un dia perds tots els aparells i la frase, tres de les teues persones de confiança, juntes, et podran ajudar a recuperar els xats privats. En pots tindre tantes com vulgues, com a mínim tres, i amb cadascuna has de tindre el número de seguretat verificat.'),
  pendent: parell('pendent', 'La recuperació amb persones de confiança encara no està activa en este node: ara mateix, ningú no et pot ajudar a recuperar els xats privats.'),
  verificatsCap: parell('verificats.cap', 'Encara no has verificat el número de seguretat de cap contacte.'),
  verificatsUn: parell('verificats.un', 'Tens 1 contacte amb el número de seguretat verificat.'),
  verificatsDiversos: parell('verificats.diversos', 'Tens {n} contactes amb el número de seguretat verificat.'),
  faltaUn: parell('falta.un', 'En falta 1 per a arribar a tres.'),
  faltaDiversos: parell('falta.diversos', 'En falten {n} per a arribar a tres.'),
  aPunt: parell('aPunt', 'Ja en tens prou. Quan la recuperació amb persones de confiança estiga activa en este node, les podràs triar ací.'),
  risc: parell('risc', 'Tria gent de qui et fies de veres: tres d’elles juntes podrien obrir la teua còpia de seguretat.'),
  error: parell('error', 'No s’ha pogut llegir quins contactes tens verificats.')
});

/**
 * L'estat del bloc a partir dels contactes verificats en este aparell i de si la
 * recuperació social ja està activa en este node (`teRecuperacio`, avui sempre
 * fals): { estat: 'cap'|'falten'|'a-punt'|'actiu', verificats, falten }. 'actiu'
 * només amb teRecuperacio === true i el llindar assolit. Un recompte que no és un
 * enter no negatiu compta com a cap (mai un número inventat).
 */
export function estatPersonesConfianca({ verificats, teRecuperacio = false } = {}) {
  const n = Number.isSafeInteger(verificats) && verificats > 0 ? verificats : 0;
  const falten = Math.max(0, LLINDAR_CONFIANCA - n);
  let estat = ESTAT_CONFIANCA.falten;
  if (n === 0) estat = ESTAT_CONFIANCA.cap;
  else if (falten === 0) estat = teRecuperacio === true ? ESTAT_CONFIANCA.actiu : ESTAT_CONFIANCA.aPunt;
  return Object.freeze({ estat, verificats: n, falten });
}
