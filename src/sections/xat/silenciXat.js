/**
 * silenciXat.js — El silenci d'una conversa per a la interfície (B8C-5, marató
 * 261101_2143; ordre del Mestre: «Silenciar conversa (8 h, 1 setmana, sempre) a
 * la UI del fil»). Mòdul pur: cap estat, cap xarxa, cap emmagatzematge.
 *
 *   · OPCIONS_SILENCI · les tres durades del diàleg, amb el parell [clau, reserva]
 *     de cada text (la forma que llig la guarda i18n.usades).
 *   · TEXTOS_SILENCI · els textos del menú, del diàleg i dels avisos.
 *   · potSilenciar(fil) · si un fil admet silenci (no les files d'ajuda, ni el
 *     xat de només lectura de Javi, ni un fil que llegixes com a visitant).
 *   · Silencis en memòria (D-B8C-4: un servidor sense la RPC xat_silencia):
 *     estatSilenciLocal, aplicaSilencisLocals i properaCaducitat. El mapa
 *     `filId → finsAl` (ISO o null) el guarda XatContext, mai el navegador.
 *   · textDelSilenci(finsAl, locale, t) · l'avís de després de silenciar.
 *
 * La data de fi NO es calcula ací: la posa el servidor (xat_silencia) o, en
 * llavor, en local i en memòria, finsAlDelSilenci del contracte.
 */
import { DURADES_SILENCI, SILENCI_SEMPRE } from '../../data/contracte.js';
import { ID_FIL_DE_MOSTRA_DE_JAVI, esIdPerDefecte } from '../../data/xatsPerDefecte.js';
import { esSilenciat } from './missatges.js';

/* Les tres durades del diàleg, en l'ordre en què es pinten; la primera és la
   triada per defecte. 'cap' (deixar de silenciar) no és cap opció: és l'entrada
   directa del menú. */
export const OPCIONS_SILENCI = Object.freeze([
  Object.freeze({ durada: '8h', text: Object.freeze(['section.xat.silenci.8h', '8 hores']) }),
  Object.freeze({ durada: '1setmana', text: Object.freeze(['section.xat.silenci.1setmana', '1 setmana']) }),
  Object.freeze({ durada: 'sempre', text: Object.freeze(['section.xat.silenci.sempre', 'Sempre']) })
].filter((opcio) => DURADES_SILENCI.includes(opcio.durada)));

export const DURADA_PER_DEFECTE = OPCIONS_SILENCI[0]?.durada ?? '8h';

/* Cada text, amb la reserva idèntica al valor valencià del diccionari. */
export const TEXTOS_SILENCI = Object.freeze({
  menu: Object.freeze(['section.xat.silenci.menu', 'Silencia les notificacions']),
  desfes: Object.freeze(['section.xat.silenci.desfes', 'Deixa de silenciar']),
  titol: Object.freeze(['section.xat.silenci.titol', 'Silencia les notificacions d’esta conversa']),
  descripcio: Object.freeze(['section.xat.silenci.descripcio', 'Ningú de la conversa ho sabrà. Els missatges continuaran arribant, però sense avís.']),
  durada: Object.freeze(['section.xat.silenci.durada', 'Durant quant de temps']),
  confirma: Object.freeze(['section.xat.silenci.confirma', 'Silencia']),
  fetFins: Object.freeze(['section.xat.silenci.fetFins', 'Conversa silenciada fins al {data}']),
  fetSempre: Object.freeze(['section.xat.silenci.fetSempre', 'Conversa silenciada']),
  desfet: Object.freeze(['section.xat.silenci.desfet', 'La conversa ja no està silenciada']),
  error: Object.freeze(['section.xat.silenci.error', 'No s’ha pogut canviar el silenci de la conversa. Torna-ho a provar.']),
  nomesLocal: Object.freeze(['section.xat.silenci.nomesLocal', 'Silenciada només en este dispositiu fins que tornes a obrir l’app: el servidor encara no ho guarda.']),
  cancela: Object.freeze(['section.comu.cancela', 'Cancel·la'])
});

/* L'any de la sentinella «sempre», en UTC: el servidor torna
   9999-12-31T00:00:00+00:00 i la llavor SILENCI_SEMPRE (el mateix instant amb
   un altre text). Mai per igualtat de text (B8-SERVIDOR §2.9, petició 2). */
const ANY_SEMPRE = new Date(SILENCI_SEMPRE).getUTCFullYear();

/** Cert si `fil` admet silenci: un fil amb id, que és teu (no de visitant) i que es llig al port. */
export function potSilenciar(fil) {
  if (!fil || typeof fil !== 'object') return false;
  const id = fil.id;
  if (typeof id !== 'string' || id.trim() === '') return false;
  if (esIdPerDefecte(id) || id === ID_FIL_DE_MOSTRA_DE_JAVI || fil.perDefecte) return false;
  return fil.participant !== false;
}

/**
 * El silenci en memòria d'un fil: true (silenciat), false (desfet en memòria:
 * mana sobre el que diga el servidor) o null (cap entrada vigent: mana el
 * servidor). Una entrada que ja ha caducat és com si no hi fóra.
 */
export function estatSilenciLocal(mapa, filId, ara = Date.now()) {
  if (!(mapa instanceof Map) || !mapa.has(filId)) return null;
  const finsAl = mapa.get(filId);
  if (finsAl === null) return false;
  return esSilenciat(finsAl, ara) ? true : null;
}

/** Els fils amb els silencis en memòria aplicats; la mateixa referència si no en canvia cap. */
export function aplicaSilencisLocals(fils, mapa, ara = Date.now()) {
  if (!Array.isArray(fils) || !(mapa instanceof Map) || mapa.size === 0) return fils;
  let canviat = false;
  const resultat = fils.map((fil) => {
    const local = estatSilenciLocal(mapa, fil?.id, ara);
    if (local === null || Boolean(fil.silenciat) === local) return fil;
    canviat = true;
    return { ...fil, silenciat: local };
  });
  return canviat ? resultat : fils;
}

/** L'instant (ms) en què caduca el silenci en memòria més pròxim, o null si no n'hi ha cap de vigent. */
export function properaCaducitat(mapa, ara = Date.now()) {
  if (!(mapa instanceof Map)) return null;
  let proper = null;
  for (const finsAl of mapa.values()) {
    if (finsAl === null) continue;
    const instant = new Date(finsAl).getTime();
    if (Number.isFinite(instant) && instant > ara && (proper === null || instant < proper)) proper = instant;
  }
  return proper;
}

/* Un text del parell [clau, reserva] amb el traductor, o la reserva sense ell. */
const tradueixParell = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);

/* La data de fi en la llengua de la interfície; un locale estrany passa al valencià. */
function dataDelSilenci(instant, locale) {
  const opcions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  try {
    return new Intl.DateTimeFormat(locale || 'ca-ES', opcions).format(instant);
  } catch {
    return new Intl.DateTimeFormat('ca-ES', opcions).format(instant);
  }
}

/**
 * L'avís de després de canviar el silenci: null → «La conversa ja no està
 * silenciada»; la sentinella (any ≥ 9999 en UTC) o una data que no es pot
 * llegir → «Conversa silenciada»; si no, «Conversa silenciada fins al {data}».
 */
export function textDelSilenci(finsAl, locale, t) {
  if (finsAl === null || finsAl === undefined || finsAl === '') return tradueixParell(t, TEXTOS_SILENCI.desfet);
  const instant = new Date(finsAl);
  if (Number.isNaN(instant.getTime()) || instant.getUTCFullYear() >= ANY_SEMPRE) return tradueixParell(t, TEXTOS_SILENCI.fetSempre);
  const data = dataDelSilenci(instant, locale);
  return String(tradueixParell(t, TEXTOS_SILENCI.fetFins)).replace('{data}', () => data);
}
