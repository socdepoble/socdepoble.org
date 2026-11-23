/**
 * fotoNetaDIdentitat.js — v1.2.23 · L2-01 (Gauntlet R1) · La guarda de «Multimèdia» abans de posar una foto que ja
 * és al servidor com a avatar o logotip (de qualsevol mena) o com a capçalera d'una PERSONA: les imatges
 * d'identitat van sempre netes (P1-64, decisió 7 del Mestre; la crònica de la v1.2.23 ho diu), però «Posa com a…»
 * desava la referència tal qual. Des de la v1.2.23 el cos del Perfil puja directe a l'espai públic amb la ubicació i
 * la data (IDEA-331, exifTriatEnPujar), i eixes fotos ixen a «Multimèdia» com a pujades; la costura ja venia de la
 * v1.2.22 amb les còpies promogudes del Mur i les capçaleres d'entitat, que conserven les dades de la càmera.
 *
 * v1.2.23 · L2-01 (Gauntlet R2) · Decidix pel CONTINGUT, no pel contenidor. ImageIO, el codificador del canvas de
 * WebKit (Safari i l'app d'iOS), posa de sèrie al JPEG un APP1 «Exif» (ColorSpace, PixelXDimension i
 * PixelYDimension) i un APP13 amb un IPTC buit, i al PNG un eXIf amb el mateix: cap ubicació, cap data, cap càmera.
 * Comptar qualsevol bloc com a dades deixava sense «Posa com a…» totes les fotos pujades des d'un iPhone o de Safari,
 * també les del camí net de la fitxa. Ara cada bloc EXIF es llig.
 *
 * CONTRACTE
 *   esCampDIdentitat(camp, mena) · 'logoImage' (avatar o logotip) de qualsevol mena, o 'heroImage' d'una persona.
 *   portaDadesDeLaFoto(bytes) → true | false | null. Recorre el contenidor sencer, i compta com a dades:
 *     · CADA bloc EXIF (l'APP1 «Exif» d'un JPEG, el tros EXIF d'un WebP, l'eXIf d'un PNG), només si diu res de la
 *       persona: el que la pujada ensenya a la casella (analitzaTiff · contingut: un GPS IFD amb cap entrada que no
 *       siga la versió; DateTime, DateTimeOriginal o DateTimeDigitized; la marca, el model, els números de sèrie,
 *       l'autor o el nom de qui té la càmera), el GPS o la data que en llig exif.js, el Copyright amb text, o una
 *       cadena IFD1 (on va la miniatura de l'original SENSE retallar). Un EXIF amb una miniatura dins del que es
 *       publicaria, també. Un EXIF que no s'entén és null;
 *     · un APP13 que no siga el d'ImageIO: «Photoshop 3.0» amb només l'IPTC (0x0404) BUIT i, si de cas, el seu resum
 *       (0x0425, 16 bytes). Un IPTC amb mida, un altre recurs (la miniatura 0x040C, l'EXIF 0x0422, l'XMP 0x0424…) o
 *       una estructura que no s'entén compten com a dades;
 *     · l'XMP (qualsevol APP1 que no és «Exif», el tros «XMP » de WebP) i els trossos de text de PNG (tEXt, iTXt,
 *       zTXt): sense mirar dins, com abans (fail-closed);
 *     · null si el format o l'estructura no s'entenen (GIF, AVIF, SVG, un JPEG o un PNG trencat…).
 *   revisaFotoDIdentitat(font, { resol?, signal?, temps? }) → Promise<ESTAT_FOTO_IDENTITAT>, mai rebutja:
 *     · NETA · s'han llegit els bytes sencers i no porten cap dada (portaDadesDeLaFoto false);
 *     · AMB_DADES · en porten: no es posa;
 *     · NO_LLEGIBLE · ara no s'ha pogut llegir, i tornar-ho a provar pot anar bé: la xarxa, el temps, una resposta
 *       que no és 2xx, o el port que no ha resolt la referència (la torna opaca o buida, com fa storage.js quan la
 *       signatura falla o tarda, o rebutja). No es posa (fail-closed);
 *     · NO_COMPROVABLE · v1.2.23 · L2-01 (Gauntlet R2) · no es podrà comprovar mai des d'ací, i tornar-ho a provar no
 *       hi canvia res: el format o l'estructura no s'entenen (null), més de MAX_BYTES_FOTO_IDENTITAT, un data URL que
 *       no es descodifica, una referència que el port resol a una adreça de fora o una font buida. Tampoc no es posa;
 *       l'avís diu que es puge des de la fitxa;
 *     · DE_FORA · una foto que no és nostra (la del compte de Google de la sessió, esFontImatgePropia false): no la
 *       publiquem nosaltres i no es demana mai (cap referent cap a fora). Es posa com abans.
 *   Les fonts: un data URL (la llavor i el mode local), que es descodifica sense xarxa; una referència opaca
 *   (sdp-media://), que resol el port (resolveAsset, la mateixa adreça que pinta la miniatura); i una adreça pròpia
 *   (el nostre servidor de fitxers o un recurs de /assets, resolRecursPropi). El marc #sdp-crop= no compta.
 * La foto no es torna a codificar ni a pujar: si porta dades, la persona la puja des de la fitxa, on el camí
 * d'identitat la neteja (useImatgeDeFitxa, AVIS_GPS_ELIMINAT_PERFIL). Així cap fitxer nou naix d'amagat.
 */
import { resolveAsset } from '../../data/backendPort.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { ESTAT_EXIF, MOTIU_EXIF, analitzaTiff } from '../../components/universal/enquadrament/exifIncrustat.js';
import { esFontImatgePropia } from '../../utils/sanitize.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';

export const ESTAT_FOTO_IDENTITAT = Object.freeze({
  NETA: 'neta', AMB_DADES: 'amb-dades', NO_LLEGIBLE: 'no-llegible', NO_COMPROVABLE: 'no-comprovable', DE_FORA: 'de-fora',
});
/** El fitxer més gran que es llig sencer (una pujada pública en fa com a molt 5 MiB). */
export const MAX_BYTES_FOTO_IDENTITAT = 16 * 1024 * 1024;
/** El temps de tota la lectura (resoldre i baixar), com el prefix del visor (useMetadadesFoto). */
export const TEMPS_FOTO_IDENTITAT_MS = 20000;

/** El camp és d'identitat: l'avatar o el logotip de qualsevol mena, o la capçalera d'una persona. */
export const esCampDIdentitat = (camp, mena) => camp === 'logoImage' || (camp === 'heroImage' && mena === 'persona');

const text = (b, inici, n) => String.fromCharCode(...b.subarray(inici, inici + n));
const u32be = (b, p) => ((b[p] << 24) >>> 0) + (b[p + 1] << 16) + (b[p + 2] << 8) + b[p + 3];
const u32le = (b, p) => b[p] + (b[p + 1] << 8) + (b[p + 2] << 16) + ((b[p + 3] << 24) >>> 0);
const FIRMA_PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const FIRMA_EXIF = 'Exif\0\0';
const FIRMA_PHOTOSHOP = 'Photoshop 3.0\0';
const TROSSOS_PNG_TEXT = new Set(['tEXt', 'iTXt', 'zTXt']);
const TAG_COPYRIGHT = 0x8298;
const TIPUS_ASCII = 2;
/* Els recursos de Photoshop que deixa ImageIO: l'IPTC-NAA (buit) i el resum MD5 de l'IPTC. */
const RECURS_IPTC = 0x0404;
const RECURS_RESUM_IPTC = 0x0425;

/* Suma els resultats d'una passada: un true mana; si no, un null (no s'entén) guanya al false. */
const suma = (abans, ara) => (abans === true || ara === true ? true : abans === null || ara === null ? null : false);

/* L'IFD0 d'un TIFF que analitzaTiff ja ha validat: hi ha un Copyright amb text, o un «següent» (l'IFD1)? Un valor
   fora del bloc compta (fail-closed). */
function ifd0DiuMes(tiff) {
  try {
    const v = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
    const le = v.getUint16(0) === 0x4949;
    const ifd0 = v.getUint32(4, le);
    const n = v.getUint16(ifd0, le);
    for (let i = 0; i < n; i += 1) {
      const p = ifd0 + 2 + i * 12;
      if (v.getUint16(p, le) !== TAG_COPYRIGHT) continue;
      const quantitat = v.getUint32(p + 4, le);
      if (v.getUint16(p + 2, le) !== TIPUS_ASCII) {
        if (quantitat > 0) return true;
        continue;
      }
      const pos = quantitat <= 4 ? p + 8 : v.getUint32(p + 8, le);
      if (pos + quantitat > tiff.length) return true;
      if (tiff.subarray(pos, pos + Math.min(quantitat, 64)).some((c) => c !== 0 && c !== 0x20)) return true;
    }
    return v.getUint32(ifd0 + 2 + n * 12, le) !== 0;
  } catch {
    return null;
  }
}

/* Un bloc EXIF (el TIFF, amb «Exif\0\0» al davant o sense) diu res de la persona? true, false o null. */
function exifAmbDades(dades) {
  const tiff = dades.length >= 6 && text(dades, 0, 6) === FIRMA_EXIF ? dades.subarray(6) : dades;
  const analisi = analitzaTiff(tiff);
  // Un bloc buit no diu res; un IFD0 sense cap entrada encara pot encadenar l'IFD1 (la miniatura).
  if (analisi === null) return tiff.length ? ifd0DiuMes(tiff) : false;
  if (analisi.estat !== ESTAT_EXIF.PUBLICABLE) {
    return analisi.gps || analisi.dataCaptura || analisi.motiu === MOTIU_EXIF.MINIATURA ? true : null;
  }
  if (analisi.gps || analisi.dataCaptura || Object.values(analisi.contingut || {}).some(Boolean)) return true;
  return ifd0DiuMes(tiff);
}

/* APP13 · Només el d'ImageIO és buit: «Photoshop 3.0» i recursos 8BIM que siguen l'IPTC sense mida o el seu resum. */
function app13AmbDades(b, inici, fi) {
  if (fi - inici < FIRMA_PHOTOSHOP.length || text(b, inici, FIRMA_PHOTOSHOP.length) !== FIRMA_PHOTOSHOP) return true;
  let pos = inici + FIRMA_PHOTOSHOP.length;
  while (pos < fi) {
    if (pos + 12 > fi || text(b, pos, 4) !== '8BIM') return true;
    const recurs = (b[pos + 4] << 8) | b[pos + 5];
    const pMida = pos + 6 + ((b[pos + 6] + 2) & ~1); // el nom: una cadena Pascal, de llargària parella
    if (pMida + 4 > fi) return true;
    const mida = u32be(b, pMida);
    if (pMida + 4 + mida > fi) return true;
    const buit = (recurs === RECURS_IPTC && mida === 0) || (recurs === RECURS_RESUM_IPTC && mida === 16);
    if (!buit) return true;
    pos = pMida + 4 + mida + (mida & 1);
  }
  return false;
}

/* JPEG · Els APP1 i APP13 abans de l'escaneig; null si l'estructura no s'entén. */
function jpegAmbDades(b) {
  let pos = 2;
  let resultat = false;
  while (pos + 4 <= b.length) {
    if (b[pos] !== 0xff) return null;
    const marca = b[pos + 1];
    if (marca === 0xff) { pos += 1; continue; }
    if (marca === 0xda || marca === 0xd9) return resultat;
    if (marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) { pos += 2; continue; }
    const longitud = (b[pos + 2] << 8) | b[pos + 3];
    const fi = pos + 2 + longitud;
    if (longitud < 2 || fi > b.length) return null;
    const inici = pos + 4;
    if (marca === 0xe1) {
      const exif = fi - inici >= 6 && text(b, inici, 6) === FIRMA_EXIF;
      resultat = suma(resultat, exif ? exifAmbDades(b.subarray(inici + 6, fi)) : true); // l'XMP, sense mirar dins
    } else if (marca === 0xed) {
      resultat = suma(resultat, app13AmbDades(b, inici, fi));
    }
    if (resultat === true) return true;
    pos = fi;
  }
  return null;
}

/* WebP · Els trossos EXIF i XMP; el recorregut ha d'acabar just al final del RIFF, si no, null. */
function webpAmbDades(b) {
  const fi = 8 + u32le(b, 4);
  if (fi > b.length) return null;
  let pos = 12;
  let resultat = false;
  while (pos + 8 <= fi) {
    const tipus = text(b, pos, 4);
    const n = u32le(b, pos + 4);
    const fiTros = pos + 8 + n;
    if (fiTros > fi) return null;
    if (tipus === 'EXIF') resultat = suma(resultat, exifAmbDades(b.subarray(pos + 8, fiTros)));
    else if (tipus === 'XMP ') resultat = true;
    if (resultat === true) return true;
    pos = fiTros + (n & 1);
  }
  return pos === fi ? resultat : null;
}

/* PNG · Els trossos eXIf i de text (tEXt, iTXt, zTXt, on va l'XMP) abans d'IEND; null si no s'hi arriba. */
function pngAmbDades(b) {
  let pos = 8;
  let resultat = false;
  while (pos + 12 <= b.length) {
    const n = u32be(b, pos);
    const tipus = text(b, pos + 4, 4);
    const fiTros = pos + 12 + n;
    if (fiTros > b.length) return null;
    if (tipus === 'IEND') return resultat;
    if (tipus === 'eXIf') resultat = suma(resultat, exifAmbDades(b.subarray(pos + 8, pos + 8 + n)));
    else if (TROSSOS_PNG_TEXT.has(tipus)) resultat = true;
    if (resultat === true) return true;
    pos = fiTros;
  }
  return null;
}

/**
 * Porta el fitxer cap dada de la persona? true, false, o null si el format o l'estructura no s'entenen (qui crida
 * ho tracta com a no comprovable). Vegeu el CONTRACTE de dalt. Pura.
 */
export function portaDadesDeLaFoto(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return null;
  try {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegAmbDades(bytes);
    if (text(bytes, 0, 4) === 'RIFF' && text(bytes, 8, 4) === 'WEBP') return webpAmbDades(bytes);
    if (FIRMA_PNG.every((byte, i) => bytes[i] === byte)) return pngAmbDades(bytes);
  } catch {
    return null;
  }
  return null;
}

/* Els bytes d'un data URL (base64 o text), o null. */
function bytesDeDataUrl(url) {
  const coma = url.indexOf(',');
  if (coma < 0) return null;
  try {
    const capcalera = url.slice(0, coma);
    const cos = url.slice(coma + 1);
    const binari = /;base64$/i.test(capcalera) ? atob(cos) : decodeURIComponent(cos);
    return Uint8Array.from(binari, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

const estatDe = (bytes) => {
  const porta = portaDadesDeLaFoto(bytes);
  if (porta === null) return ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE;
  return porta ? ESTAT_FOTO_IDENTITAT.AMB_DADES : ESTAT_FOTO_IDENTITAT.NETA;
};

/* On es llig la foto: { url }, o { estat } si no es llig (DE_FORA, NO_LLEGIBLE o NO_COMPROVABLE). */
async function adrecaDeLaFont(font, resol, signal) {
  if (/^sdp-media:\/\//i.test(font)) {
    const url = await resol(font, { signal });
    const neta = typeof url === 'string' ? url.split('#')[0] : '';
    // El port que no ha pogut signar torna la referència tal qual (storage.js, també per temps): es pot tornar a provar.
    if (!neta || esMitjaOpac(neta)) return { estat: ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE };
    return esFontImatgePropia(neta) ? { url: neta } : { estat: ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE };
  }
  if (!esFontImatgePropia(font)) return { estat: ESTAT_FOTO_IDENTITAT.DE_FORA };
  const url = resolRecursPropi(font);
  return typeof url === 'string' && url ? { url: url.split('#')[0] } : { estat: ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE };
}

async function llegix(font, resol, signal) {
  if (font.startsWith('data:')) {
    const bytes = bytesDeDataUrl(font);
    return bytes ? estatDe(bytes) : ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE;
  }
  const { url, estat } = await adrecaDeLaFont(font, resol, signal);
  if (estat) return estat;
  if (typeof fetch !== 'function') return ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE;
  const resposta = await fetch(url, { signal, credentials: 'same-origin' });
  if (!resposta?.ok) return ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE;
  const declarada = Number(resposta.headers?.get?.('Content-Length'));
  if (Number.isFinite(declarada) && declarada > MAX_BYTES_FOTO_IDENTITAT) return ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE;
  const bytes = new Uint8Array(await resposta.arrayBuffer());
  if (bytes.length > MAX_BYTES_FOTO_IDENTITAT) return ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE;
  return estatDe(bytes);
}

/** Vegeu el CONTRACTE de dalt. `resol` i `temps` són injectables per a les proves. */
export async function revisaFotoDIdentitat(font, { resol = resolveAsset, signal, temps = TEMPS_FOTO_IDENTITAT_MS } = {}) {
  const neta = typeof font === 'string' ? font.trim().split('#')[0] : '';
  if (!neta) return ESTAT_FOTO_IDENTITAT.NO_COMPROVABLE;
  const control = typeof AbortController === 'function' ? new AbortController() : null;
  const avorta = () => control?.abort();
  signal?.addEventListener?.('abort', avorta);
  if (signal?.aborted) avorta();
  let rellotge = null;
  const limit = new Promise((resolPromesa) => {
    rellotge = setTimeout(() => { avorta(); resolPromesa(ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE); }, temps);
  });
  try {
    const lectura = llegix(neta, resol, control?.signal ?? signal).catch(() => ESTAT_FOTO_IDENTITAT.NO_LLEGIBLE);
    return await Promise.race([lectura, limit]);
  } finally {
    clearTimeout(rellotge);
    signal?.removeEventListener?.('abort', avorta);
  }
}
