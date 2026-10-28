// @vitest-environment node
/* OG-7 (pla 261028_1526 §3.1.1, P1-64) · Cap foto pública d'identitat no porta
   GPS. Les fotos de perfil i d'avatar que servix el web (public/assets) diuen
   on viu la persona si l'EXIF hi continua: esta porta fa roja la prova quan
   algú torna a versionar-ne una amb coordenades.
     · recorre public/assets amb readdirSync (no amb git ls-files: les còpies
       congelades no porten .git), i no dist/;
     · identitat (avatars, gent, usuaris o «perfil» al camí): gps === false o un
       format que el lector no coneix; un EXIF illegible d'un format conegut
       (gps null) FALLA, per privacitat de sèrie;
     · fora de la llista blanca, cap foto amb GPS IFD; la llista no pot
       contindre cap camí d'identitat i cada entrada ha d'existir;
     · cap fitxer no porta «GPSLatitude» ni «GPSLongitude» en text (l'XMP, que
       llegixCapcalera no llig).
   Mestre 261028 (decisió 7): es purguen les 8 d'identitat de Javi i les 2 de
   l'avatar de l'Ajuntament; les 8 de patrimoni de la Torre conserven el GPS.
   Revisió adversarial 261028 (privacitat, 4) · llegixCapcalera només llig el
   darrer APP1 «Exif» d'un JPEG i no coneix l'HEIC/AVIF ni el perfil «Raw
   profile type exif» d'un PNG: la porta ja no depén d'ell sol. Una foto
   d'identitat ha de ser d'un format conegut i portar com a molt un EXIF, i un
   lector propi, independent, busca un GPS IFD darrere de CADA «Exif\0\0» i de
   cada capçalera TIFF (II*\0, MM\0*) del fitxer, i dins dels trossos de text
   d'un PNG (també els comprimits, zTXt i iTXt). */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, test } from 'vitest';
import { llegixCapcalera } from '../sections/tractors/sentinelles/imatges.js';

const PUBLIC = path.join(process.cwd(), 'public');
const IMATGE = /\.(?:jpe?g|png|webp|avif|heic|heif)$/i;
const IDENTITAT = /(^|\/)(avatars?|gent|usuaris)\/|perfil/i;
const PURGA = "purga'l amb netejaMetadades (OG-7)";

/* Mestre 261028 · Fotos de patrimoni del nucli de la Torre publicades per
   l'administració: el GPS es queda (seran les primeres marques verdes del
   Mapa P1-64). Cap foto d'identitat no pot entrar ací. */
const FOTOS_DE_PATRIMONI_AMB_GPS = new Set([
  '/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.JPG',
  '/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.webp',
  '/assets/uploads/poble/la-torre-de-les-macanes/DSC00410.JPG',
  '/assets/uploads/poble/la-torre-de-les-macanes/DSC00410.webp',
  '/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_150735.jpg',
  '/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_150735.webp',
  '/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_153325_SRES.jpg',
  '/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_153325_SRES.webp',
]);

/* Les quatre que nomena el pla (§3.1.1 i la verificació del §5). */
const FOTOS_DEL_PLA = [
  '/assets/fotos/javi-llinares-perfil-1200px.jpg',
  '/assets/fotos/javi-llinares-perfil-1200px.webp',
  '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg',
  '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.webp',
];

/* Totes les imatges de public/assets, amb el camí tal com el servix el web. */
function fitxersDe(dir) {
  return readdirSync(dir).flatMap((nom) => {
    const ple = path.join(dir, nom);
    if (statSync(ple).isDirectory()) return fitxersDe(ple);
    return [`/${path.relative(PUBLIC, ple).split(path.sep).join('/')}`];
  });
}
const IMATGES = fitxersDe(path.join(PUBLIC, 'assets')).filter((src) => IMATGE.test(src));
const BYTES = new Map(IMATGES.map((src) => [src, new Uint8Array(readFileSync(path.join(PUBLIC, src)))]));
const CAPCALERES = new Map(IMATGES.map((src) => [src, llegixCapcalera(BYTES.get(src))]));

const GPS_EN_TEXT = /GPS(?:Latitude|Longitude)/;
const textLatin1 = (bytes) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('latin1');

/* ── El lector independent (cap import del codi de producció) ── */
const CAPCALERA_EXIF = Buffer.from('Exif\0\0', 'latin1');
const CAPCALERES_TIFF = [Buffer.from([0x49, 0x49, 0x2a, 0x00]), Buffer.from([0x4d, 0x4d, 0x00, 0x2a])];
const PUNTERS_IFD = new Set([0x8769, 0x8825, 0xa005, 0x014a]);
const PERFIL_EXIF_PNG = /^Raw profile type (?:exif|APP1)$/i;

/* Totes les posicions d'un patró dins d'uns bytes. */
function posicionsDe(bytes, patro) {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const posicions = [];
  for (let i = b.indexOf(patro); i !== -1; i = b.indexOf(patro, i + 1)) posicions.push(i);
  return posicions;
}

/* Un TIFF a `inici` porta un GPS IFD amb latitud o longitud? Es recorre tot el
   graf que s'hi penja (IFD0 i la seua cadena, Exif, GPS, Interoperabilitat,
   SubIFD), com a molt 64 directoris, i qualsevol punter 0x8825 compta. */
function tiffAmbGps(bytes, inici) {
  if (inici < 0 || inici + 8 > bytes.length) return false;
  const v = new DataView(bytes.buffer, bytes.byteOffset + inici, bytes.byteLength - inici);
  const le = v.getUint16(0) === 0x4949;
  if ((!le && v.getUint16(0) !== 0x4d4d) || v.getUint16(2, le) !== 42) return false;
  const u16 = (p) => (p >= 0 && p + 2 <= v.byteLength ? v.getUint16(p, le) : null);
  const u32 = (p) => (p >= 0 && p + 4 <= v.byteLength ? v.getUint32(p, le) : null);
  const pendents = [[u32(4), false]];
  const vistos = new Set();
  while (pendents.length && vistos.size < 64) {
    const [offset, esGps] = pendents.shift();
    if (!offset || vistos.has(offset)) continue;
    vistos.add(offset);
    const n = u16(offset);
    if (n === null || n > 512 || offset + 2 + n * 12 > v.byteLength) continue;
    for (let k = 0; k < n; k += 1) {
      const e = offset + 2 + k * 12;
      const tag = u16(e);
      if (esGps && (tag === 2 || tag === 4)) return true;
      if (!PUNTERS_IFD.has(tag)) continue;
      const quantitat = Math.min(u32(e + 4) ?? 0, 16);
      const valors = quantitat <= 1 ? [u32(e + 8)] : Array.from({ length: quantitat }, (_, i) => u32((u32(e + 8) ?? -1) + i * 4));
      for (const desti of valors) pendents.push([desti, tag === 0x8825]);
    }
    pendents.push([u32(offset + 2 + n * 12), false]);
  }
  return false;
}

/* El text (ja inflat) dels trossos tEXt, zTXt i iTXt d'un PNG: [{ clau, text }]. */
function textosDePng(bytes) {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const textos = [];
  if (b.length < 8 || b.readUInt32BE(0) !== 0x89504e47) return textos;
  for (let o = 8; o + 12 <= b.length;) {
    const n = b.readUInt32BE(o);
    const tipus = b.toString('latin1', o + 4, o + 8);
    const dades = b.subarray(o + 8, Math.min(b.length, o + 8 + n));
    const nul = dades.indexOf(0);
    if (['tEXt', 'zTXt', 'iTXt'].includes(tipus) && nul > 0) {
      const clau = dades.toString('latin1', 0, nul);
      let cos = dades.subarray(nul + 1);
      try {
        if (tipus === 'zTXt') cos = inflateSync(cos.subarray(1));
        if (tipus === 'iTXt') {
          const comprimit = cos[0] === 1;
          let resta = cos.subarray(2);
          for (let i = 0; i < 2; i += 1) resta = resta.subarray(resta.indexOf(0) + 1);
          cos = comprimit ? inflateSync(resta) : resta;
        }
      } catch {
        cos = Buffer.from('illegible', 'latin1');
      }
      textos.push({ clau, text: cos.toString('latin1') });
    }
    if (tipus === 'IEND') break;
    o += 12 + n;
  }
  return textos;
}

/* Els bytes d'un «Raw profile type exif» (ImageMagick): la llargària i, darrere, l'hexadecimal. */
const bytesDelPerfil = (text) => new Uint8Array(Buffer.from((text.match(/^\s*\S+\s+\d+\s+([\s\S]*)$/)?.[1] || '').replace(/[^0-9a-f]/gi, ''), 'hex'));

/* Uns bytes porten GPS darrere d'algun «Exif\0\0» o d'alguna capçalera TIFF? */
const bytesAmbGps = (bytes) => posicionsDe(bytes, CAPCALERA_EXIF).some((i) => tiffAmbGps(bytes, i + CAPCALERA_EXIF.length))
  || CAPCALERES_TIFF.some((capcalera) => posicionsDe(bytes, capcalera).some((i) => tiffAmbGps(bytes, i)));

/* Revisió adversarial 261028 · El que en diu el lector independent: GPS en
   qualsevol EXIF, en un perfil de text d'un PNG o en text, i quants «Exif\0\0» porta. */
function lecturaIndependent(bytes) {
  const textos = textosDePng(bytes);
  const perfils = textos.filter(({ clau }) => PERFIL_EXIF_PNG.test(clau));
  return {
    gps: bytesAmbGps(bytes) || perfils.some(({ text }) => bytesAmbGps(bytesDelPerfil(text))) || textos.some(({ text }) => GPS_EN_TEXT.test(text)),
    exifs: posicionsDe(bytes, CAPCALERA_EXIF).length + perfils.length,
  };
}
const INDEPENDENT = new Map(IMATGES.map((src) => [src, lecturaIndependent(BYTES.get(src))]));

describe('OG-7 · cap foto pública d’identitat amb GPS', () => {
  test('el recorregut no és buit', () => {
    expect(IMATGES.length).toBeGreaterThan(300);
  });

  /* Revisió adversarial 261028 · Expectativa endurida a propòsit: un format que
     llegixCapcalera no coneix (un HEIC, també amb el nom .jpg) ja no passa. */
  test('cada foto d’identitat ix sense GPS, d’un format conegut (un EXIF illegible també falla)', () => {
    const brutes = IMATGES
      .filter((src) => IDENTITAT.test(src))
      .filter((src) => {
        const c = CAPCALERES.get(src);
        return !(c.format !== null && c.gps === false);
      })
      .map((src) => `${src} (format=${CAPCALERES.get(src).format}, gps=${CAPCALERES.get(src).gps}): ${PURGA}`);
    expect(brutes, 'fotos d’identitat amb GPS, amb un EXIF que no es pot llegir o d’un format desconegut').toEqual([]);
  });

  test('cada foto d’identitat, segons el lector independent: cap GPS i com a molt un EXIF', () => {
    const brutes = IMATGES
      .filter((src) => IDENTITAT.test(src))
      .filter((src) => INDEPENDENT.get(src).gps || INDEPENDENT.get(src).exifs > 1)
      .map((src) => `${src} (${JSON.stringify(INDEPENDENT.get(src))}): ${PURGA}`);
    expect(brutes).toEqual([]);
  });

  test('fora de la llista blanca del patrimoni, cap foto porta GPS (ni per llegixCapcalera ni pel lector independent)', () => {
    const ambGps = IMATGES
      .filter((src) => (CAPCALERES.get(src).gps === true || INDEPENDENT.get(src).gps) && !FOTOS_DE_PATRIMONI_AMB_GPS.has(src))
      .map((src) => `${src}: ${PURGA}`);
    expect(ambGps).toEqual([]);
  });

  test('el lector independent veu el GPS de la llista blanca (la porta no és cega)', () => {
    for (const src of FOTOS_DE_PATRIMONI_AMB_GPS) expect(INDEPENDENT.get(src)?.gps, src).toBe(true);
  });

  test('la llista blanca no té cap foto d’identitat i cada entrada existix', () => {
    const disc = new Set(IMATGES);
    for (const src of FOTOS_DE_PATRIMONI_AMB_GPS) {
      expect(IDENTITAT.test(src), `${src} és d'identitat: no pot conservar el GPS`).toBe(false);
      expect(disc.has(src), `${src} ja no existix: lleva'l de la llista blanca`).toBe(true);
    }
  });

  test('cap fitxer porta el GPS en text (XMP)', () => {
    const ambXmp = IMATGES
      .filter((src) => GPS_EN_TEXT.test(textLatin1(BYTES.get(src))))
      .map((src) => `${src}: ${PURGA}`);
    expect(ambXmp).toEqual([]);
  });

  test.each(FOTOS_DEL_PLA)('%s existix i no porta GPS', (src) => {
    expect(CAPCALERES.has(src), `${src} no és a public/`).toBe(true);
    expect(CAPCALERES.get(src).gps, `${src}: ${PURGA}`).toBe(false);
  });
});
