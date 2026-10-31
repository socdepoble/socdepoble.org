/**
 * vcardOrganitzacio.js · P1-59 (b) (Llibre Mestre, Fita 23, «Secció de
 * Contacte = vCard estàndard universal (.vcf)», i IDEA-45; guàrdia nocturna
 * 261030, Fase 3) · La targeta de contacte d'una organització PÚBLICA, feta
 * en local amb el que la seua fitxa ja ensenya a tothom: el nom, el poble,
 * el correu públic (només si l'organització l'ha fet públic) i l'adreça de
 * la fitxa. Res que la pàgina no mostre, cap petició ni cap servidor: el
 * fitxer es fa al navegador i el desa la persona amb un clic.
 *
 * Format: vCard 3.0 (RFC 2426), el que exporten i importen Google Contacts i
 * Apple Contacts (el Llibre nomena l'RFC 6350, la 4.0; la 3.0 és la que totes
 * dues agendes lligen sense sorpreses). Una organització, no una persona: N
 * buit, FN i ORG amb el nom i X-ABShowAs:COMPANY (Apple la mostra com a
 * empresa). Línies CRLF, plegades a 75 octets sense partir cap caràcter, i
 * cada valor escapat (\\, «,», «;» i salts de línia): cap valor no pot
 * injectar una propietat nova.
 *
 * El que el Llibre demana i el model encara no té (telèfon, carrer i
 * horaris) no s'inventa: quan existisquen, entren ací. En remot, el correu
 * públic depén de la projecció de la migració 2610281730 (C11-05), no
 * aplicada: fins llavors la targeta porta el nom, el poble i la web.
 *
 * Pur, llevat de desaVcard (Blob i un enllaç temporal, com la còpia de les
 * dades de «Privacitat i dades»), que rep el document i URL injectables.
 */
import { validaCorreu } from '../../data/correuOrganitzacio.js';
import { poblePrincipal } from '../pobles/nomsDelPoble.js';

export const TIPUS_VCARD = 'text/vcard;charset=utf-8';
const CRLF = '\r\n';
const MAX_OCTETS = 75;

/* Controls (llevat del salt de línia, que s'escapa) i marques bidi o
   invisibles: fora. Per punts de codi, sense cap caràcter invisible al codi
   font (no-irregular-whitespace i la revisió humana). */
const INVISIBLES = Object.freeze([
  [0x00, 0x09], [0x0B, 0x0C], [0x0E, 0x1F], [0x7F, 0x9F], [0x061C, 0x061C], [0x200B, 0x200F],
  [0x202A, 0x202E], [0x2060, 0x2064], [0x2066, 0x2069], [0xFEFF, 0xFEFF]
]);
const esInvisible = (caracter) => {
  const punt = caracter.codePointAt(0);
  return INVISIBLES.some(([des, fins]) => punt >= des && punt <= fins);
};
const senseInvisibles = (text) => [...text].filter((caracter) => !esInvisible(caracter)).join('');

/** Un valor de text de vCard 3.0, escapat (RFC 2426 §4: \\, \, \; i \n). */
export function escapaValor(valor) {
  return senseInvisibles(String(valor ?? ''))
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .trim();
}

const octets = (text) => new TextEncoder().encode(text).length;

/* Cicle 4 (MILLORA-01, Gemini 1217) · Les peces que el plegat no partix: un caràcter, o una
   seqüència d'escapament sencera («\\», «\n», «\,» i «\;»: escapaValor dobla cada «\» del
   text, així que cada «\» obri una parella). L'RFC desplega abans de desescapar (RFC 2425
   §5.8.1, RFC 6350 §3.2) i partir-la no seria incorrecte, però un lector que va línia a línia
   veuria un «\» solt al final d'una. */
function peces(linia) {
  const caracters = [...linia];
  const llista = [];
  for (let i = 0; i < caracters.length; i += 1) {
    if (caracters[i] === '\\' && i + 1 < caracters.length) {
      llista.push(caracters[i] + caracters[i + 1]);
      i += 1;
    } else {
      llista.push(caracters[i]);
    }
  }
  return llista;
}

/** Una línia plegada a 75 octets (RFC 2426 §2.6): CRLF i un espai, mai al mig d'un caràcter ni d'una seqüència d'escapament. */
export function plega(linia) {
  const trossos = [];
  let actual = '';
  let mida = 0;
  for (const peca of peces(linia)) {
    const n = octets(peca);
    const limit = trossos.length === 0 ? MAX_OCTETS : MAX_OCTETS - 1;
    if (mida + n > limit) {
      trossos.push(actual);
      actual = '';
      mida = 0;
    }
    actual += peca;
    mida += n;
  }
  trossos.push(actual);
  return trossos.join(`${CRLF} `);
}

/* Una adreça web pública: http o https, sense credencials. */
function webPublica(url) {
  try {
    const u = new URL(String(url ?? ''));
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return '';
    return u.href;
  } catch {
    return '';
  }
}

/**
 * El text .vcf d'una organització, o null si no té nom.
 * @param {{ nom?: string, poble?: string, correu?: string, url?: string }} fitxa
 * @returns {string|null}
 */
export function vcardDOrganitzacio({ nom, poble, correu, url } = {}) {
  const nomNet = escapaValor(nom);
  if (!nomNet) return null;
  const linies = ['BEGIN:VCARD', 'VERSION:3.0', 'N:;;;;', `FN:${nomNet}`, `ORG:${nomNet}`, 'X-ABShowAs:COMPANY'];
  const localitat = escapaValor(poblePrincipal(poble));
  if (localitat) linies.push(`ADR;TYPE=WORK:;;;${localitat};;;`);
  const correuNet = String(correu ?? '').trim();
  if (validaCorreu(correuNet)) linies.push(`EMAIL;TYPE=INTERNET,WORK:${correuNet}`);
  /* Una URI, no un text: no s'escapa (RFC 2426 §5.8.4). L'analitzador d'URL
     ja ha codificat els espais i llevat els salts de línia. */
  const web = webPublica(url);
  if (web) linies.push(`URL:${web}`);
  linies.push('END:VCARD');
  return `${linies.map(plega).join(CRLF)}${CRLF}`;
}

/** El nom del fitxer: el de l'organització en ASCII i minúscules, o «contacte». */
export function nomFitxerVcard(nom) {
  const base = String(nom ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/·/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${base || 'contacte'}.vcf`;
}

/**
 * Desa el .vcf amb un Blob i un enllaç temporal (res no passa per cap
 * servidor). Torna true si s'ha pogut llançar la descàrrega.
 */
export function desaVcard(text, nomFitxer, { doc = globalThis.document, urls = globalThis.URL } = {}) {
  if (typeof text !== 'string' || !text || !doc || typeof urls?.createObjectURL !== 'function') return false;
  const url = urls.createObjectURL(new Blob([text], { type: TIPUS_VCARD }));
  const enllac = doc.createElement('a');
  enllac.href = url;
  enllac.download = nomFitxer;
  enllac.rel = 'noopener';
  enllac.click();
  // Safari necessita que la URL visca un moment després del clic.
  setTimeout(() => urls.revokeObjectURL(url), 1000);
  return true;
}
