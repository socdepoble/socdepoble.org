/**
 * editorial.js — peces compartides de la capçalera editorial de les pàgines
 * universals: H1 i H2 sense punt final, data i hora, copyright i píndoles.
 *
 * Poliment editorial 260925. Abans cada secció duia la seua còpia de
 * formatDate/formatTime (TextSection i Wiki, amb eixides diferents per a una
 * data invàlida) i el copyright només vivia a TextSection.
 *
 * Funcions pures: cap React, cap DOM, cap accés a PAGE_COPY.
 */

/** Copyright de les pàgines de sistema. El mateix text que pintava TextSection. */
export const COPYRIGHT_SDP = '© Sóc de Poble / Fet per la IAIA i Nano Banana';

/**
 * Lleva els espais finals i UN punt final. Els punts suspensius («...» i «…»)
 * es conserven: són part del text, no la puntuació que el tanca. Si no rep
 * text (un node de React, null, un número…), el torna tal qual.
 *
 * Sense lookbehind (Baseline Safari 16.0): «el caràcter d'abans no és un
 * punt» es diu amb `[^.]` dins del grup capturat.
 */
export function llevaPuntFinal(text) {
  if (typeof text !== 'string') return text;
  const net = text.replace(/\s+$/, '');
  const trobat = /^([\s\S]*[^.])\.$/.exec(net);
  return trobat ? trobat[1].replace(/\s+$/, '') : net;
}

/** Data curta «dd/mm/aa». Si el text no és una data, el torna tal qual. */
export function formatDate(dStr) {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  return d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** Hora «hh:mm». Si el text no és una data, no hi ha hora. */
export function formatTime(dStr) {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/;
const AMB_HORA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/**
 * Data d'un document per a la barra taronja, NOMÉS si és real: una cadena
 * que comença per «AAAA-MM-DD», que existix al calendari i que el navegador
 * sap llegir. Qualsevol altra cosa (buit, «260921», «demà», «2026-02-30»)
 * torna null i no es pinta cap píndola.
 *
 * Una data sense hora no s'inventa les «02:00» de la mitjanit UTC, ni canvia
 * de dia segons la zona horària: el dia es compon amb les xifres del text.
 */
export function dataDocument(valor) {
  if (typeof valor !== 'string') return null;
  // «AAAA-MM-DD hh:mm» amb espai: Safari 16 no el llig; amb «T», tots.
  const text = valor.trim().replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/, '$1T$2');
  const parts = DATA_ISO.exec(text);
  if (!parts || isNaN(new Date(text).getTime())) return null;
  const [, any, mes, dia] = parts;
  // Chrome llig «2026-02-30» com el 2 de març i Safari la rebutja: el dia
  // ha d'existir al calendari, i així tots els navegadors diuen el mateix.
  const calendari = new Date(Date.UTC(Number(any), Number(mes) - 1, Number(dia)));
  if (calendari.getUTCMonth() !== Number(mes) - 1 || calendari.getUTCDate() !== Number(dia)) return null;
  if (AMB_HORA.test(text)) {
    return { dateTime: text, date: formatDate(text), time: formatTime(text) };
  }
  return { dateTime: `${any}-${mes}-${dia}`, date: `${dia}/${mes}/${any.slice(2)}`, time: '' };
}

/**
 * Píndoles sense buits ni duplicats (sdp-universal-page §4): dues píndoles
 * amb el mateix text, encara que canvie la caixa, en són una. Guanya la
 * primera, que és la de més rang (carpeta → categoria → etiqueta).
 */
export function pindolesUniques(labels) {
  const vistes = new Set();
  return (Array.isArray(labels) ? labels : []).filter((label) => {
    const text = typeof label === 'string' ? label : label?.text;
    if (typeof text !== 'string' || !text.trim()) return false;
    const clau = text.trim().toLocaleLowerCase('ca');
    if (vistes.has(clau)) return false;
    vistes.add(clau);
    return true;
  });
}
