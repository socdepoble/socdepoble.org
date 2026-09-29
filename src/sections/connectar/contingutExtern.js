/**
 * contingutExtern.js — T71 · El contingut de fora de Sóc de Poble (una web)
 * guardat al MAS: la base d'un «guarda-ho per a després» (a l'estil de
 * Raindrop o d'un bookmarklet), encara sense bookmarklet.
 *
 * A diferència d'una connexió interna (un accés directe de lectura a
 * l'original), el contingut de fora es CLONA: naix com una nota nova i
 * editable a «Connectats», amb origen { tipus: 'extern', url } (origenNota.js).
 *
 *   · validaContingutExtern: valida i normalitza { url, titol, subtitol,
 *     entradilla }. La url només http o https, sense credencials i de 2048
 *     caràcters com a màxim: la que en passa es rebutja, mai es talla. Els
 *     textos es netegen (caràcters de control, surrogates orfes, espais) i,
 *     si passen del límit, es rebutgen amb el motiu: l'entradilla, el de
 *     limitsText.js (MAXIM_LEMA); el títol i el subtítol, el d'un camp de
 *     l'origen. T71b · Es compten punts de codi, igual que els talla
 *     origenNota.js: el títol validat és el que es desa a origen.titol.
 *   · contingutExternDeParams: el mateix des de la query de /connectar
 *     (url, titol o title, subtitol, entradilla). Només LLIG: la ruta mai
 *     crea res en carregar-se; ConnectarSection ho mostra i demana un clic.
 *   · notaDeContingutExtern: l'entrada de creaNota (títol, subtítol i
 *     entradilla escapats com a HTML del document, un cos que cita d'on ve
 *     i la carpeta «Connectats»). Cap imatge: la de l'altra web no s'importa
 *     (un hotlink és un píxel de rastreig i la CSP no el deixa passar).
 *   · citaDeLOrigenExtern: el paràgraf «Font: <a>lloc</a>», el cos inicial
 *     de la nota.
 *   · cosDeLExternPerAlMur (T71b): el cos que ix al Mur quan el contingut es
 *     compartix (NotesContext.publishNote). Una sola regla: el cos de la nota
 *     tal com està i, si ja no porta cap enllaç a l'adreça d'origen (la
 *     persona ha esborrat o canviat la cita), la cita al final. Mai dues
 *     vegades. Cap imatge externa: el sanejador del Mur les bloqueja.
 *
 * Pur: sense React ni xarxa (Model B).
 */
import { MAXIM_LEMA } from '../../data/limitsText.js';
import { MAXIM_CAMP_ORIGEN, MAXIM_URL, netejaCampOrigen, urlExterna, validaUrlExterna } from '../../data/origenNota.js';
import { CARPETA_CONNECTATS } from '../notes/carpetes.js';
import { aHtml } from '../notes/connexions.js';

/** Els límits de cada camp, en caràcters de veres (com char_length). */
export const LIMITS_EXTERN = Object.freeze({
  url: MAXIM_URL,
  titol: MAXIM_CAMP_ORIGEN,
  subtitol: MAXIM_CAMP_ORIGEN,
  entradilla: MAXIM_LEMA
});

const MOTIUS_URL = Object.freeze({
  buida: 'Falta l’adreça de la pàgina.',
  llarga: `L’adreça passa de ${MAXIM_URL} caràcters. No es talla: una adreça tallada porta a una altra pàgina.`,
  malformada: 'L’adreça no és vàlida.',
  esquema: 'Només es poden guardar adreces web (http o https).',
  credencials: 'L’adreça porta un usuari o una contrasenya, i no es guarda.'
});

const CAMPS_DE_TEXT = Object.freeze([
  ['titol', 'El títol'],
  ['subtitol', 'El subtítol'],
  ['entradilla', 'L’entradilla']
]);

const caracters = (text) => Array.from(text).length;
/* Una línia de text net: sense caràcters de control, surrogates orfes, espais
   repetits ni salts. La mateixa neteja que origenNota fa en desar-lo. */
const netejaLinia = (valor) => netejaCampOrigen(valor, Infinity).replace(/\s+/g, ' ');

/**
 * { ok: true, valor: { url, lloc, titol, subtitol, entradilla } } o
 * { ok: false, errors: { url?, titol?, subtitol?, entradilla? } } amb el motiu
 * de cada camp. Sense títol, el lloc (el domini de la url): és d'on ve.
 */
export function validaContingutExtern(entrada) {
  const errors = {};
  const { url, motiu } = validaUrlExterna(entrada?.url);
  if (motiu) errors.url = MOTIUS_URL[motiu];
  const textos = {};
  for (const [camp, nom] of CAMPS_DE_TEXT) {
    const valor = netejaLinia(entrada?.[camp]);
    if (caracters(valor) > LIMITS_EXTERN[camp]) errors[camp] = `${nom} passa de ${LIMITS_EXTERN[camp]} caràcters.`;
    textos[camp] = valor;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const lloc = new URL(url).hostname;
  return { ok: true, valor: { url, lloc, titol: textos.titol || lloc, subtitol: textos.subtitol, entradilla: textos.entradilla } };
}

/** El contingut de fora que arriba per la query de /connectar, validat; null si no n'hi ha cap (sense `url`). */
export function contingutExternDeParams(params) {
  if (!params || typeof params.has !== 'function' || !params.has('url')) return null;
  return validaContingutExtern({
    url: params.get('url'),
    titol: params.get('titol') ?? params.get('title'),
    subtitol: params.get('subtitol'),
    entradilla: params.get('entradilla')
  });
}

/** «Font: <a href=url>lloc</a>», escapat; '' sense url vàlida. */
export function citaDeLOrigenExtern(origen) {
  const { url } = validaUrlExterna(origen?.url);
  if (!url) return '';
  return `<p>Font: <a href="${aHtml(url)}">${aHtml(new URL(url).hostname)}</a></p>`;
}

/* Els href d'un HTML: entre cometes dobles, simples o sense. L'editor pot
   reordenar atributs i afegir-ne (rel, target): es mira l'adreça, no el text. */
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
/* Les entitats que un serialitzador posa dins d'un atribut. Una sola passada:
   «&amp;quot;» torna «&quot;», no «"». */
const ENTITATS = Object.freeze({
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
  '#38': '&', '#x26': '&', '#34': '"', '#x22': '"', '#39': "'", '#x27': "'"
});
const desentitza = (valor) => valor.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (sencera, nom) => ENTITATS[nom.toLowerCase()] ?? sencera);

/* El cos porta un enllaç a l'adreça d'origen (normalitzada com la desa origenNota)? */
function portaEnllacDeLOrigen(html, origen) {
  const url = urlExterna(origen?.url);
  if (!url) return false;
  for (const [, doble, simple, nua] of String(html ?? '').matchAll(HREF)) {
    if (urlExterna(desentitza(doble ?? simple ?? nua ?? '')) === url) return true;
  }
  return false;
}

/**
 * T71b · El cos d'un contingut de fora quan es compartix al Mur: el de la
 * nota (és de la persona, que l'ha pogut editar) i, només si ja no porta cap
 * enllaç a l'adreça d'origen, la cita al final. Sense url vàlida, el cos tal
 * qual. `html` ha de ser el cos ja sanejat: es mira el que arribarà al Mur.
 */
export function cosDeLExternPerAlMur(html, origen) {
  const cos = String(html ?? '');
  return portaEnllacDeLOrigen(cos, origen) ? cos : `${cos}${citaDeLOrigenExtern(origen)}`;
}

/**
 * L'entrada de creaNota per a un contingut de fora, o null si no val
 * (validaContingutExtern). Naix a «Connectats» si no se'n tria una altra.
 */
export function notaDeContingutExtern(entrada, { carpeta = CARPETA_CONNECTATS } = {}) {
  const validat = validaContingutExtern(entrada);
  if (!validat.ok) return null;
  const { url, titol, subtitol, entradilla } = validat.valor;
  return {
    title: aHtml(titol),
    ...(subtitol ? { subtitle: aHtml(subtitol) } : {}),
    ...(entradilla ? { lead: aHtml(entradilla) } : {}),
    content: citaDeLOrigenExtern({ url }),
    folderId: carpeta || CARPETA_CONNECTATS,
    origen: { tipus: 'extern', url, titol }
  };
}
