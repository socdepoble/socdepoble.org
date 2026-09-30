/**
 * contingutExtern.js — T71 · El contingut de fora de Sóc de Poble (una web)
 * connectat al MAS: la base d'un «connecta-ho per a després» (a l'estil de
 * Raindrop o d'un bookmarklet), encara sense bookmarklet.
 *
 * El contingut de fora es CLONA: naix com una nota nova i editable a la
 * Safata d’Entrada (D1, carpeta 'f-connectats'), amb origen
 * { tipus: 'extern', url } (origenNota.js).
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
 *     D10-A (preparatori del Web Share Target) · sense `url`, la primera
 *     adreça web vàlida del paràmetre `text` (adrecaDeText, sense la
 *     puntuació de tancament enganxada), i la resta del text com a
 *     entradilla: sense les adreces rebutjades i tallada a MAXIM_LEMA.
 *   · notaDeContingutExtern: l'entrada de creaNota (títol, subtítol i
 *     entradilla escapats com a HTML del document, un cos que cita d'on ve
 *     i la Safata d’Entrada). Cap imatge: la de l'altra web no s'importa
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
import { aHtml, hrefsDe } from '../notes/connexions.js';

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
  esquema: 'Només es poden connectar adreces web (http o https).',
  credencials: 'L’adreça porta un usuari o una contrasenya, i no es connecta.'
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

/* D10-A · Una adreça candidata dins d'un text lliure: http:// o https:// fins
   al primer espai. Lineal (sense retrocés): cap text enorme la bloqueja. */
const ADRECA_EN_TEXT = /https?:\/\/\S+/giu;

/* Revisió de D10-A (260930) · La puntuació que tanca una frase o una cita
   s'enganxa a l'adreça («Mira https://x.org/a.», «Llig «https://x.org/a»»)
   i no n'és part: una «Font:» amb eixe punt porta a una altra pàgina. */
const PUNTUACIO_DE_TANCAMENT = new Set(['.', ',', ';', ':', '!', '?', '»', '”', '’', "'", '"']);
const OBERTURA_DE = Object.freeze({ ')': '(', ']': '[' });

/**
 * La candidata sense la puntuació de tancament del final: la de la llista
 * sempre, i un parèntesi o un claudàtor de tancament només si no té parella
 * dins de la candidata («(https://x.org/a).» dona https://x.org/a, i
 * https://ca.wikipedia.org/wiki/X_(Y) conserva el seu). Una sola passada per
 * a comptar i un índex que recula: lineal com ADRECA_EN_TEXT.
 */
export function retallaCandidata(candidata) {
  const adreca = String(candidata ?? '');
  const compte = { '(': 0, ')': 0, '[': 0, ']': 0 };
  for (const caracter of adreca) if (caracter in compte) compte[caracter] += 1;
  let fi = adreca.length;
  while (fi > 0) {
    const ultim = adreca[fi - 1];
    const obertura = Object.hasOwn(OBERTURA_DE, ultim) ? OBERTURA_DE[ultim] : null;
    if (PUNTUACIO_DE_TANCAMENT.has(ultim)) fi -= 1;
    else if (obertura && compte[ultim] > compte[obertura]) { compte[ultim] -= 1; fi -= 1; }
    else break;
  }
  return adreca.slice(0, fi);
}

/**
 * D10-A · La primera adreça web vàlida d'un text lliure (el `text` que moltes
 * apps envien en compartir) i la resta del text en una línia neta:
 * { url, resta }, o null si no n'hi ha cap. Cada candidata, sense la
 * puntuació de tancament (retallaCandidata), es valida com la `url`
 * (validaUrlExterna): la que passa de 2048 caràcters, porta credencials o no
 * s'entén no val i es passa a la següent; mai es talla. La puntuació retallada
 * es queda a la resta: és del text.
 */
export function adrecaDeText(text) {
  const font = typeof text === 'string' ? text : '';
  for (const trobada of font.matchAll(ADRECA_EN_TEXT)) {
    const adreca = retallaCandidata(trobada[0]);
    if (!validaUrlExterna(adreca).url) continue;
    const resta = `${font.slice(0, trobada.index)} ${font.slice(trobada.index + adreca.length)}`;
    return { url: adreca, resta: netejaLinia(resta) };
  }
  return null;
}

/* Revisió de D10-A (260930) · L'entradeta que es deduïx del `text` no és un
   camp que haja escrit la persona: les adreces rebutjades (llargues, amb
   credencials, malformades) no hi queden, i si encara passa de MAXIM_LEMA es
   talla per caràcters de veres en lloc de rebutjar tot l'enllaç sense cap
   camp on corregir-ho. Una `entradilla` explícita no passa per ací: la que
   passa del límit es continua rebutjant amb el motiu. */
function entradetaDeText(resta) {
  const senseRebutjades = resta.replace(ADRECA_EN_TEXT, (candidata) => {
    const adreca = retallaCandidata(candidata);
    return validaUrlExterna(adreca).url ? candidata : ` ${candidata.slice(adreca.length)}`;
  });
  return Array.from(netejaLinia(senseRebutjades)).slice(0, MAXIM_LEMA).join('').trim();
}

/**
 * El contingut de fora que arriba per la query de /connectar, validat, o null
 * si no n'hi ha cap. Amb `url`, eixa adreça. D10-A · Sense `url` (o amb una
 * `url` buida), la primera adreça vàlida del `text`, i la resta del text com
 * a entradilla si no n'arriba cap (entradetaDeText: sense les adreces
 * rebutjades i tallada al límit); sense adreça vàlida al text, null (o, amb
 * una `url` buida, el motiu de la buida).
 */
export function contingutExternDeParams(params) {
  if (!params || typeof params.has !== 'function') return null;
  const textos = {
    titol: params.get('titol') ?? params.get('title'),
    subtitol: params.get('subtitol'),
    entradilla: params.get('entradilla')
  };
  const url = params.get('url');
  if (!url || !url.trim()) {
    const deText = adrecaDeText(params.get('text'));
    if (deText) return validaContingutExtern({ ...textos, url: deText.url, entradilla: textos.entradilla ?? entradetaDeText(deText.resta) });
  }
  return params.has('url') ? validaContingutExtern({ ...textos, url }) : null;
}

/** «Font: <a href=url>lloc</a>», escapat; '' sense url vàlida. */
export function citaDeLOrigenExtern(origen) {
  const { url } = validaUrlExterna(origen?.url);
  if (!url) return '';
  return `<p>Font: <a href="${aHtml(url)}">${aHtml(new URL(url).hostname)}</a></p>`;
}

/* El cos porta un enllaç a l'adreça d'origen (normalitzada com la desa
   origenNota)? Els href es lligen amb hrefsDe (notes/connexions.js), la
   mateixa lectura que fa el cos d'una connexió per al Mur (D4). */
function portaEnllacDeLOrigen(html, origen) {
  const url = urlExterna(origen?.url);
  if (!url) return false;
  return hrefsDe(html).some((href) => urlExterna(href) === url);
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
 * (validaContingutExtern). Naix a la Safata d’Entrada si no se'n tria una altra.
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
