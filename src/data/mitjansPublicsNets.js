/* Fulla compartible amb Browser/Edge: sense DOM, canvas, Node ni dependències.
   Valida el contenidor (no és un descodificador de píxels) i elimina tots els
   blocs de metadades. Formats animats o desconeguts es rebutgen. */
const MAX_BYTES = 5_242_880;
const MAX_PIXELS = 100_000_000;
const error = () => Object.assign(new TypeError('La imatge no es pot publicar sense metadades amb este format.'), { codi: 'mitja-no-sanejable' });
const exigix = condicio => { if (!condicio) throw error(); };
const text = (bytes, inici, n) => String.fromCharCode(...bytes.subarray(inici, inici + n));
const mida = (ample, alt) => exigix(ample > 0 && alt > 0 && ample * alt <= MAX_PIXELS);
function unix(parts) {
  const resultat = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) { resultat.set(part, offset); offset += part.length; }
  return resultat;
}
const u16 = (b, p) => (b[p] << 8) | b[p + 1];
const u32 = (b, p, little = false) => new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(p, little);

function jpeg(bytes) {
  exigix(bytes[0] === 0xff && bytes[1] === 0xd8);
  const parts = [bytes.subarray(0, 2)];
  let pos = 2, components = 0, escanejat = false;
  while (pos < bytes.length) {
    const inici = pos;
    exigix(bytes[pos++] === 0xff);
    while (bytes[pos] === 0xff) pos++;
    const marca = bytes[pos++];
    if (marca === 0xd9) {
      exigix(escanejat && pos === bytes.length);
      parts.push(Uint8Array.of(0xff, 0xd9));
      return unix(parts);
    }
    exigix(pos + 2 <= bytes.length);
    const longitud = u16(bytes, pos), dades = pos + 2, fi = pos + longitud;
    exigix(longitud >= 2 && fi <= bytes.length);
    if ([0xc0, 0xc1, 0xc2].includes(marca)) {
      exigix(!components && longitud >= 11 && bytes[dades] === 8);
      components = bytes[dades + 5];
      exigix([1, 3].includes(components) && longitud === 8 + 3 * components);
      mida(u16(bytes, dades + 3), u16(bytes, dades + 1));
    } else if (marca === 0xda) {
      exigix(components && longitud >= 8 && bytes[dades] >= 1 && bytes[dades] <= components && longitud === 6 + 2 * bytes[dades]);
    } else if (!(marca >= 0xe0 && marca <= 0xef) && marca !== 0xfe) {
      // DQT, DHT i DRI són dades de descodificació, cap segment textual.
      exigix([0xdb, 0xc4, 0xdd].includes(marca));
      if (marca === 0xdd) exigix(longitud === 4);
    }
    if (!(marca >= 0xe0 && marca <= 0xef) && marca !== 0xfe) parts.push(bytes.subarray(inici, fi));
    pos = fi;
    if (marca === 0xda) {
      escanejat = true;
      const iniciPixels = pos;
      let marcador = false;
      while (pos < bytes.length) {
        if (bytes[pos] !== 0xff) { pos++; continue; }
        const iniciMarca = pos++;
        while (bytes[pos] === 0xff) pos++;
        exigix(pos < bytes.length);
        if (bytes[pos] === 0 || (bytes[pos] >= 0xd0 && bytes[pos] <= 0xd7)) { pos++; continue; }
        pos = iniciMarca; marcador = true; break;
      }
      exigix(marcador);
      parts.push(bytes.subarray(iniciPixels, pos));
    }
  }
  throw error();
}

const TAULA_CRC = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc(bytes, inici, fi) {
  let valor = 0xffffffff;
  for (let p = inici; p < fi; p++) valor = TAULA_CRC[(valor ^ bytes[p]) & 255] ^ (valor >>> 8);
  return (valor ^ 0xffffffff) >>> 0;
}
function png(bytes) {
  exigix(bytes.length >= 33 && bytes.subarray(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]));
  const parts = [bytes.subarray(0, 8)];
  let pos = 8, cap = false, paleta = false, pixels = 0, color;
  while (pos + 12 <= bytes.length) {
    const n = u32(bytes, pos), tipus = text(bytes, pos + 4, 4), dades = pos + 8, fi = dades + n;
    exigix(fi + 4 <= bytes.length && /^[A-Za-z]{4}$/.test(tipus));
    exigix(crc(bytes, pos + 4, fi) === u32(bytes, fi));
    exigix(cap || tipus === 'IHDR');
    if (tipus === 'IHDR') {
      exigix(!cap && pos === 8 && n === 13);
      mida(u32(bytes, dades), u32(bytes, dades + 4));
      color = bytes[dades + 9];
      const profunditats = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
      exigix(profunditats[color]?.includes(bytes[dades + 8]) && bytes[dades + 10] === 0 && bytes[dades + 11] === 0 && bytes[dades + 12] <= 1);
      cap = true;
    } else if (tipus === 'PLTE') {
      exigix(!paleta && !pixels && n > 0 && n <= 768 && n % 3 === 0 && ![0, 4].includes(color));
      paleta = true;
    } else if (tipus === 'IDAT') { pixels += n; }
    else if (tipus === 'IEND') {
      exigix(n === 0 && pixels > 0 && (color !== 3 || paleta) && fi + 4 === bytes.length);
      parts.push(bytes.subarray(pos, fi + 4));
      return unix(parts);
    } else if (tipus === 'tRNS') {
      exigix(!pixels && ([0, 2, 3].includes(color)) &&
        (color === 0 ? n === 2 : color === 2 ? n === 6 : paleta && n > 0 && n <= 256));
    } else {
      // APNG necessita validar una segona estructura de frames: fail-closed.
      exigix(!['acTL', 'fcTL', 'fdAT'].includes(tipus) && (bytes[pos + 4] & 32) !== 0);
    }
    if (['IHDR', 'PLTE', 'IDAT', 'tRNS'].includes(tipus)) parts.push(bytes.subarray(pos, fi + 4));
    pos = fi + 4;
  }
  throw error();
}

function webp(bytes) {
  exigix(bytes.length >= 20 && text(bytes, 0, 4) === 'RIFF' && text(bytes, 8, 4) === 'WEBP' && u32(bytes, 4, true) + 8 === bytes.length);
  const parts = [];
  let pos = 12, pixels = 0, estesa = false, alfa = false;
  while (pos + 8 <= bytes.length) {
    const tipus = text(bytes, pos, 4), n = u32(bytes, pos + 4, true), dades = pos + 8, fi = dades + n, seguent = fi + (n & 1);
    exigix(seguent <= bytes.length && (!(n & 1) || bytes[fi] === 0));
    if (tipus === 'VP8X') {
      exigix(pos === 12 && !estesa && n === 10 && !(bytes[dades] & 2));
      const ample = 1 + bytes[dades + 4] + (bytes[dades + 5] << 8) + (bytes[dades + 6] << 16);
      const alt = 1 + bytes[dades + 7] + (bytes[dades + 8] << 8) + (bytes[dades + 9] << 16);
      mida(ample, alt); estesa = true;
      const net = bytes.slice(pos, seguent);
      net[8] &= 0x10; net[9] = 0; net[10] = 0; net[11] = 0;
      parts.push(net);
    } else if (tipus === 'VP8 ') {
      exigix(!pixels && n >= 10 && !(bytes[dades] & 1) && text(bytes, dades + 3, 3) === '\u009d\u0001\u002a');
      mida((bytes[dades + 6] | bytes[dades + 7] << 8) & 0x3fff, (bytes[dades + 8] | bytes[dades + 9] << 8) & 0x3fff);
      pixels++; parts.push(bytes.subarray(pos, seguent));
    } else if (tipus === 'VP8L') {
      exigix(!pixels && !alfa && n >= 5 && bytes[dades] === 0x2f && !(bytes[dades + 4] & 0xe0));
      const bits = u32(bytes, dades + 1, true);
      mida(1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
      pixels++; parts.push(bytes.subarray(pos, seguent));
    } else if (tipus === 'ALPH') {
      exigix(estesa && !alfa && !pixels && n > 0); alfa = true; parts.push(bytes.subarray(pos, seguent));
    } else exigix(!['ANIM', 'ANMF'].includes(tipus));
    pos = seguent;
  }
  exigix(pos === bytes.length && pixels === 1);
  const resultat = unix([bytes.subarray(0, 12), ...parts]);
  new DataView(resultat.buffer).setUint32(4, resultat.length - 8, true);
  return resultat;
}

/* Gauntlet R22 (ronda 3, dades-06) · Porta el fitxer cap bloc EXIF? Un APP1
   «Exif\0\0» abans de l'escaneig (JPEG) o un tros «EXIF» (WebP). No valida res
   més i és més ample que extreuTiff (exifIncrustat.js): no deixa fora cap
   bloc que extreuTiff trobaria. Només estalvia demanar el mòdul de l'EXIF
   (storage.js · ambExifTriat) per a una foto que no en porta cap. Cada volta
   avança. */
export function portaBlocExif(bytes) {
  if (!(bytes instanceof Uint8Array)) return false;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let pos = 2;
    while (pos + 4 <= bytes.length) {
      if (bytes[pos] !== 0xff) return false;
      const marca = bytes[pos + 1];
      if (marca === 0xff) { pos += 1; continue; }
      if (marca === 0xd9 || marca === 0xda) return false;
      if (marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) { pos += 2; continue; }
      const longitud = u16(bytes, pos + 2);
      if (longitud < 2) return false;
      if (marca === 0xe1 && longitud >= 8 && pos + 10 <= bytes.length && text(bytes, pos + 4, 6) === 'Exif\0\0') return true;
      pos += 2 + longitud;
    }
    return false;
  }
  if (bytes.length >= 12 && text(bytes, 0, 4) === 'RIFF' && text(bytes, 8, 4) === 'WEBP') {
    for (let pos = 12; pos + 8 <= bytes.length;) {
      if (text(bytes, pos, 4) === 'EXIF') return true;
      const n = u32(bytes, pos + 4, true);
      pos += 8 + n + (n & 1);
    }
  }
  return false;
}

export function netejaImatgePublica(bytes, mime) {
  exigix(bytes instanceof Uint8Array && bytes.length > 0 && bytes.length <= MAX_BYTES);
  const formats = { 'image/jpeg': [jpeg, 'jpg'], 'image/png': [png, 'png'], 'image/webp': [webp, 'webp'] };
  const format = Object.hasOwn(formats, mime) ? formats[mime] : null;
  exigix(format);
  return { bytes: format[0](bytes), mime, extensio: format[1] };
}
