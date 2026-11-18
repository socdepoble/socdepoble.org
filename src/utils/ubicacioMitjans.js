/** GPS local abans de recodificar. No xarxa, DOM, descodificador ni cerca
 * de patrons dins de mostres. Els límits inclouen les lectures per offsets.
 * `completa` descriu els formats de metadades compatibles, no valida el medi
 * ni acredita que unes coordenades declarades siguen la ubicació real. */
import { llegixExif, MAX_BYTES_EXIF } from '../components/universal/enquadrament/exif.js';

export const LIMITS_UBICACIO_MITJANS = Object.freeze({ bytes: 2_000_000, caixes: 4096, profunditat: 8, tiff: MAX_BYTES_EXIF, text: 4096, items: 512, extents: 32 });
const EXIF = [0x45, 0x78, 0x69, 0x66, 0, 0];
const XMP_UUID = 'be7acfcb97a942e89c71999491e3afac';
const KEY_GPS = 'com.apple.quicktime.location.ISO6709';
const HEIF = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heif']);
const CONTENIDORS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'udta', 'meco']);
const HANDLERS_SEGURS = new Set(['vide', 'soun', 'hint', 'text', 'subt', 'sbtl', 'clcp']);
const abortat = () => new DOMException('Operació cancel·lada.', 'AbortError');
const falla = motiu => { throw Object.assign(new Error(motiu), { motiu }); };
const vista = b => new DataView(b.buffer, b.byteOffset, b.byteLength);
const tipus = (b, p = 0) => String.fromCharCode(...b.subarray(p, p + 4));
const igual = (b, values, p = 0) => values.every((v, i) => b[p + i] === v);
const segur = n => Number.isSafeInteger(n) && n >= 0;
function comprova(signal) { if (signal?.aborted) throw abortat(); }
function ambSenyal(promesa, signal) {
  if (!signal) return promesa;
  return new Promise((resolve, reject) => {
    const cancella = () => reject(abortat());
    if (signal.aborted) cancella(); else signal.addEventListener('abort', cancella, { once: true });
    Promise.resolve(promesa).then(v => { signal.removeEventListener('abort', cancella); signal.aborted ? reject(abortat()) : resolve(v); }, e => { signal.removeEventListener('abort', cancella); reject(e); });
  });
}
function bytesDe(blob) {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(blob);
  });
}
function lector(fitxer, signal) {
  let bytes = 0, caixes = 0;
  const llig = async (pos, n) => {
    comprova(signal);
    if (!segur(pos) || !segur(n) || n > fitxer.size || pos > fitxer.size - n) falla('fitxer-invalid');
    if (bytes + n > LIMITS_UBICACIO_MITJANS.bytes) falla('limit-metadades');
    bytes += n;
    const b = new Uint8Array(await ambSenyal(bytesDe(fitxer.slice(pos, pos + n)), signal));
    comprova(signal); if (b.length !== n) falla('fitxer-invalid'); return b;
  };
  const compta = () => { if (++caixes > LIMITS_UBICACIO_MITJANS.caixes) falla('limit-metadades'); };
  async function caixesEntre(inici, fi, profunditat = 0) {
    if (profunditat > LIMITS_UBICACIO_MITJANS.profunditat) falla('limit-metadades');
    const resultat = [];
    for (let p = inici; p < fi;) {
      compta(); if (fi - p < 8) falla('fitxer-invalid');
      const cap = await llig(p, 8), v = vista(cap); let mida = v.getUint32(0), header = 8;
      if (mida === 1) {
        if (fi - p < 16) falla('fitxer-invalid');
        const gran = vista(await llig(p + 8, 8)).getBigUint64(0);
        if (gran > BigInt(Number.MAX_SAFE_INTEGER)) falla('fitxer-invalid');
        mida = Number(gran); header = 16;
      } else if (mida === 0) mida = fi - p;
      if (mida < header || mida > fi - p) falla('fitxer-invalid');
      resultat.push({ inici: p, dades: p + header, fi: p + mida, header, tipus: tipus(cap, 4), index: v.getUint32(4) });
      p += mida;
    }
    return resultat;
  }
  return { llig, compta, caixesEntre };
}

/* El TIFF existent porta els límits d'IFD/racionals. L'embolcall WebP mínim
 * permet reutilitzar eixe lector pur sense copiar-lo ni llegir cap píxel. */
function gpsDelTiff(brut) {
  const b = igual(brut, EXIF) ? brut.subarray(6) : brut;
  if (b.length < 8 || b.length > LIMITS_UBICACIO_MITJANS.tiff) falla('metadades-invalides');
  const v = vista(b), marca = v.getUint16(0), le = marca === 0x4949;
  if (![0x4949, 0x4d4d].includes(marca) || v.getUint16(2, le) !== 42) falla('metadades-invalides');
  const ifd = pos => {
    if (!segur(pos) || pos < 8 || pos > b.length - 2) falla('metadades-invalides');
    const n = v.getUint16(pos, le);
    if (n > 512 || pos + 2 + n * 12 + 4 > b.length) falla('metadades-invalides');
    return n;
  };
  const pos = v.getUint32(4, le), n = ifd(pos); let gps = null;
  for (let i = 0; i < n; i++) {
    const e = pos + 2 + i * 12;
    if (v.getUint16(e, le) !== 0x8825) continue;
    if (gps !== null || ![4, 13].includes(v.getUint16(e + 2, le)) || v.getUint32(e + 4, le) !== 1) falla('metadades-invalides');
    gps = v.getUint32(e + 8, le); if (gps === pos) falla('metadades-invalides'); ifd(gps);
  }
  if (gps === null) return null;
  const webp = new Uint8Array(20 + b.length + (b.length & 1)), w = vista(webp);
  webp.set([82, 73, 70, 70], 0); w.setUint32(4, webp.length - 8, true); webp.set([87, 69, 66, 80, 69, 88, 73, 70], 8); w.setUint32(16, b.length, true); webp.set(b, 20);
  const coords = llegixExif(webp, { ambGps: true, ambData: false }).gps;
  if (!coords) falla('gps-illegible'); return coords;
}
function coordenadesISO(b) {
  if (b.length > LIMITS_UBICACIO_MITJANS.text) falla('limit-metadades');
  let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/\0+$/, '').trim(); } catch { falla('gps-illegible'); }
  const m = /^([+-]\d{2}(?:\.\d+)?)([+-]\d{3}(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?\/$/.exec(text);
  if (!m) falla('gps-illegible');
  const lat = Number(m[1]), lng = Number(m[2]), altitud = m[3] === undefined ? null : Number(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)
    || (altitud !== null && !Number.isFinite(altitud))) falla('gps-illegible');
  return { lat: lat === 0 ? 0 : lat, lng: lng === 0 ? 0 : lng, altitud };
}
async function gpsJpeg(r, total) {
  for (let p = 2; p < total;) {
    r.compta(); const cap = await r.llig(p, 2);
    if (cap[0] !== 0xff || cap[1] === 0) falla('fitxer-invalid');
    const marker = cap[1];
    if (marker === 0xff) { p++; continue; }
    if (marker === 0xda || marker === 0xd9) return null;
    if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) { p += 2; continue; }
    const mida = vista(await r.llig(p + 2, 2)).getUint16(0);
    if (mida < 2 || mida > total - p - 2) falla('fitxer-invalid');
    if (marker === 0xe1 && mida >= 8 && igual(await r.llig(p + 4, 6), EXIF)) return gpsDelTiff(await r.llig(p + 10, mida - 8));
    p += mida + 2;
  }
  falla('fitxer-invalid');
}
async function gpsTrossos(r, prefix, total, png) {
  const fi = png ? total : vista(prefix).getUint32(4, true) + 8;
  if (fi > total || fi < 12) falla('fitxer-invalid');
  for (let p = png ? 8 : 12, i = 0; p < fi; i++) {
    r.compta(); if (fi - p < (png ? 12 : 8)) falla('fitxer-invalid');
    const cap = await r.llig(p, 8), v = vista(cap), mida = v.getUint32(png ? 0 : 4, !png), tag = tipus(cap, png ? 4 : 0);
    if (png && i === 0 && tag !== 'IHDR') falla('fitxer-invalid');
    const afegit = png ? 4 : mida & 1;
    if (mida > fi - p - 8 - afegit) falla('fitxer-invalid');
    if (tag === (png ? 'eXIf' : 'EXIF')) {
      if (mida > LIMITS_UBICACIO_MITJANS.tiff + 6) falla('limit-metadades');
      return gpsDelTiff(await r.llig(p + 8, mida));
    }
    if (png && tag === 'IEND') return null;
    p += 8 + mida + afegit;
  }
  return null;
}

async function metaFills(r, caixa, profunditat) {
  if (caixa.fi - caixa.dades < 4) falla('fitxer-invalid');
  const primer = vista(await r.llig(caixa.dades, 4)).getUint32(0);
  // ISO meta és FullBox; QuickTime antic pot començar directament per hdlr.
  return r.caixesEntre(caixa.dades + (primer === 0 ? 4 : 0), caixa.fi, profunditat + 1);
}
async function coordenadesMeta(r, fills, profunditat) {
  const keys = fills.filter(c => c.tipus === 'keys'), ilsts = fills.filter(c => c.tipus === 'ilst');
  if (!keys.length && !ilsts.length) return [];
  if (keys.length > 1 || ilsts.length > 1) falla('metadades-ambigues');
  if (!keys.length || !ilsts.length) falla('metadades-no-compatibles');
  const k = keys[0]; if (k.fi - k.dades < 8) falla('fitxer-invalid');
  const cap = vista(await r.llig(k.dades, 8));
  if (cap.getUint32(0) !== 0 || cap.getUint32(4) > LIMITS_UBICACIO_MITJANS.items) falla('limit-metadades');
  const ids = new Set(); let p = k.dades + 8;
  for (let i = 1; i <= cap.getUint32(4); i++) {
    r.compta(); const h = await r.llig(p, 8), mida = vista(h).getUint32(0);
    if (mida < 8 || mida > k.fi - p || mida - 8 > LIMITS_UBICACIO_MITJANS.text) falla('fitxer-invalid');
    if (tipus(h, 4) === 'mdta' && new TextDecoder().decode(await r.llig(p + 8, mida - 8)) === KEY_GPS) ids.add(i);
    p += mida;
  }
  if (p !== k.fi) falla('fitxer-invalid');
  if (!ids.size) return [];
  const resultat = [];
  for (const item of await r.caixesEntre(ilsts[0].dades, ilsts[0].fi, profunditat + 2)) {
    if (!ids.has(item.index)) continue;
    for (const data of await r.caixesEntre(item.dades, item.fi, profunditat + 3)) {
      if (data.tipus !== 'data') continue;
      if (data.fi - data.dades < 8) falla('fitxer-invalid');
      const capData = vista(await r.llig(data.dades, 8));
      if (capData.getUint32(0) !== 1) falla('gps-illegible');
      resultat.push(coordenadesISO(await r.llig(data.dades + 8, data.fi - data.dades - 8)));
    }
  }
  if (!resultat.length) falla('gps-illegible'); return resultat;
}
function enterVariable(v, p, n) {
  if (n > 8 || p > v.byteLength - n) falla('metadades-invalides');
  let valor = 0n; for (let i = 0; i < n; i++) valor = (valor << 8n) | BigInt(v.getUint8(p + i));
  if (valor > BigInt(Number.MAX_SAFE_INTEGER)) falla('metadades-invalides'); return Number(valor);
}
async function gpsHeif(r, fills, mdats) {
  const iinfs = fills.filter(c => c.tipus === 'iinf'), ilocs = fills.filter(c => c.tipus === 'iloc'), idats = fills.filter(c => c.tipus === 'idat');
  if (!iinfs.length && !ilocs.length) return { coordenades: null, completa: false };
  if (iinfs.length !== 1 || ilocs.length !== 1 || idats.length > 1) falla('metadades-invalides');
  const iinf = iinfs[0], cap = await r.llig(iinf.dades, Math.min(8, iinf.fi - iinf.dades));
  const versio = cap[0], nBytes = versio === 0 ? 2 : 4;
  if (versio > 1 || cap.length < 4 + nBytes) falla('metadades-no-compatibles');
  const nombre = nBytes === 2 ? vista(cap).getUint16(4) : vista(cap).getUint32(4);
  if (nombre > LIMITS_UBICACIO_MITJANS.items) falla('limit-metadades');
  const items = await r.caixesEntre(iinf.dades + 4 + nBytes, iinf.fi, 3);
  if (items.length !== nombre) falla('fitxer-invalid');
  const exifs = []; let completa = !fills.some(c => ['uuid', 'xml '].includes(c.tipus));
  for (const item of items) {
    if (item.tipus !== 'infe') falla('metadades-no-compatibles');
    const dades = await r.llig(item.dades, Math.min(14, item.fi - item.dades)), v = vista(dades), version = dades[0];
    if (![2, 3].includes(version) || dades.length < (version === 2 ? 12 : 14)) falla('metadades-no-compatibles');
    const id = version === 2 ? v.getUint16(4) : v.getUint32(4), prot = v.getUint16(version === 2 ? 6 : 8), type = tipus(dades, version === 2 ? 8 : 10);
    if (type === 'Exif') { if (prot) falla('metadades-no-compatibles'); exifs.push(id); }
    else if (!['hvc1', 'av01', 'jpeg', 'grid', 'iovl', 'iden'].includes(type)) completa = false;
  }
  if (!exifs.length) return { coordenades: null, completa };
  if (exifs.length !== 1) falla('metadades-ambigues');
  const iloc = ilocs[0], mida = iloc.fi - iloc.dades;
  if (mida > LIMITS_UBICACIO_MITJANS.tiff) falla('limit-metadades');
  const v = vista(await r.llig(iloc.dades, mida));
  if (v.byteLength < 8) falla('fitxer-invalid');
  const version = v.getUint8(0); if (version > 2) falla('metadades-no-compatibles');
  const offsetSize = v.getUint8(4) >> 4, lengthSize = v.getUint8(4) & 15, baseSize = v.getUint8(5) >> 4, indexSize = version ? v.getUint8(5) & 15 : 0;
  if ([offsetSize, lengthSize, baseSize, indexSize].some(n => n > 8)) falla('metadades-invalides');
  let p = 6;
  const pren = n => { const valor = enterVariable(v, p, n); p += n; return valor; };
  const count = pren(version < 2 ? 2 : 4); if (count > LIMITS_UBICACIO_MITJANS.items) falla('limit-metadades');
  let seleccionat = null;
  for (let i = 0; i < count; i++) {
    const id = pren(version < 2 ? 2 : 4), method = version ? pren(2) & 15 : 0, ref = pren(2), base = pren(baseSize), extents = pren(2);
    if (extents > LIMITS_UBICACIO_MITJANS.extents) falla('limit-metadades');
    const rangs = [];
    for (let j = 0; j < extents; j++) {
      if (version && indexSize) pren(indexSize);
      const offset = pren(offsetSize), length = pren(lengthSize);
      if (id === exifs[0]) rangs.push({ offset, length });
    }
    if (id === exifs[0]) {
      if (seleccionat || ref || method > 1 || !rangs.length) falla('metadades-no-compatibles');
      seleccionat = { method, base, rangs };
    }
  }
  if (p !== v.byteLength || !seleccionat) falla('metadades-invalides');
  const parts = []; let bytes = 0;
  for (const rang of seleccionat.rangs) {
    bytes += rang.length;
    if (!rang.length || bytes > LIMITS_UBICACIO_MITJANS.tiff + 10) falla('limit-metadades');
    const offset = seleccionat.base + rang.offset, base = seleccionat.method === 1 ? idats[0]?.dades : 0;
    if (!segur(offset) || !segur(base)) falla('metadades-invalides');
    const inici = base + offset, fi = inici + rang.length;
    const dins = seleccionat.method === 1 ? idats.some(c => inici >= c.dades && fi <= c.fi) : mdats.some(c => inici >= c.dades && fi <= c.fi);
    if (!segur(inici) || !segur(fi) || !dins) falla('metadades-invalides');
    parts.push(await r.llig(inici, rang.length));
  }
  const exif = new Uint8Array(bytes); let at = 0; for (const part of parts) { exif.set(part, at); at += part.length; }
  if (exif.length < 12) falla('metadades-invalides');
  const start = 4 + vista(exif).getUint32(0);
  if (start > exif.length - 8) falla('metadades-invalides');
  return { coordenades: gpsDelTiff(exif.subarray(start)), completa };
}

async function inspeccionaBmff(r, fitxer, formatInicial, neteja) {
  const top = await r.caixesEntre(0, fitxer.size), mdats = top.filter(c => c.tipus === 'mdat');
  let format = formatInicial, moov = false, video = false, audio = false, desconegut = false, pistesIncompletes = false;
  const coords = [], rangs = [], heifMetas = [];
  const afegix = gps => { if (gps) coords.push(gps); };
  const recorre = async (caixes, profunditat, pista = null, dinsMdia = false) => {
    for (const c of caixes) {
      if (c.tipus === 'ftyp') {
        if (c.fi - c.dades < (neteja ? 4 : 8) || c.fi - c.dades > 1024) falla('fitxer-invalid');
        const bytes = await r.llig(c.dades, c.fi - c.dades), brands = [tipus(bytes)];
        for (let i = 8; i + 4 <= bytes.length; i += 4) brands.push(tipus(bytes, i));
        if (brands.some(b => HEIF.has(b))) format = 'heic'; else if (brands.includes('qt  ')) format = 'mov';
      } else if (c.tipus === 'meta') {
        rangs.push(c);
        if (neteja) continue;
        const fills = await metaFills(r, c, profunditat);
        if (format === 'heic') heifMetas.push(fills);
        else for (const gps of await coordenadesMeta(r, fills, profunditat)) afegix(gps);
      } else if (c.tipus === '©xyz') {
        rangs.push(c); if (neteja) continue;
        if (c.fi - c.dades > LIMITS_UBICACIO_MITJANS.text + 4) falla('limit-metadades');
        let bytes = await r.llig(c.dades, c.fi - c.dades);
        if (bytes[0] !== 43 && bytes[0] !== 45) {
          if (bytes.length < 4) falla('gps-illegible');
          const n = vista(bytes).getUint16(0); if (n > bytes.length - 4) falla('gps-illegible'); bytes = bytes.subarray(4, 4 + n);
        }
        afegix(coordenadesISO(bytes));
      } else if (c.tipus === 'uuid') {
        if (c.fi - c.dades < 16) falla('fitxer-invalid');
        const uuid = Array.from(await r.llig(c.dades, 16), b => b.toString(16).padStart(2, '0')).join('');
        if (uuid === XMP_UUID) { rangs.push(c); if (!neteja) desconegut = true; } else desconegut = true;
      } else if (c.tipus === 'loci') {
        rangs.push(c); if (!neteja) desconegut = true;
      } else if (['cmov', 'dcom', 'cmvd'].includes(c.tipus)) {
        // QuickTime pot comprimir tot el moov (incloent-hi GPS) amb zlib.
        // No interpretem ni acreditem la neteja d'eixe contingut opac.
        desconegut = true;
      } else if (c.tipus === 'hdlr' && pista && dinsMdia) {
        if (c.fi - c.dades < 12) falla('fitxer-invalid');
        const h = await r.llig(c.dades, 12);
        if (vista(h).getUint32(0) !== 0) falla('metadades-no-compatibles');
        pista.handlers.push(tipus(h, 8));
      } else if (CONTENIDORS.has(c.tipus)) {
        if (c.tipus === 'moov') moov = true;
        if (c.tipus === 'udta') { rangs.push(c); if (neteja) continue; }
        if (c.tipus === 'trak') {
          const track = { handlers: [] };
          await recorre(await r.caixesEntre(c.dades, c.fi, profunditat + 1), profunditat + 1, track, false);
          if (track.handlers.length !== 1 || !HANDLERS_SEGURS.has(track.handlers[0])) {
            // Un trak antic sense hdlr encara permet llevar udta/meta sencers.
            // No acredita ni l'àudio ni l'absència d'altres metadades.
            if (!neteja || track.handlers.length) desconegut = true;
            pistesIncompletes = true;
          }
          if (track.handlers.includes('soun')) audio = true;
          if (track.handlers.includes('vide')) video = true;
        } else await recorre(await r.caixesEntre(c.dades, c.fi, profunditat + 1), profunditat + 1, pista, dinsMdia || c.tipus === 'mdia');
      }
    }
  };
  // ftyp sempre es processa abans de meta, encara que aparega més tard.
  await recorre(top.filter(c => c.tipus === 'ftyp'), 0);
  await recorre(top.filter(c => c.tipus !== 'ftyp'), 0);
  if (format === 'heic') {
    if (heifMetas.length !== 1) falla('metadades-no-compatibles');
    const heif = await gpsHeif(r, heifMetas[0], mdats); afegix(heif.coordenades); if (!heif.completa) desconegut = true;
  } else if (!moov) falla('metadades-no-compatibles');
  if (coords.some(c => Math.abs(c.lat - coords[0].lat) > 1e-7 || Math.abs(c.lng - coords[0].lng) > 1e-7)) falla('metadades-ambigues');
  return { coordenades: coords[0] ?? null, format, completa: !desconegut,
    motiu: desconegut ? 'metadades-no-compatibles' : null,
    audioEsperat: audio ? 'si' : video && !pistesIncompletes ? 'no' : 'desconegut', rangs, moov };
}
async function analitza(fitxer, { signal, neteja = false } = {}) {
  comprova(signal);
  if (!(fitxer instanceof Blob) || !segur(fitxer.size) || fitxer.size < 2) falla('fitxer-invalid');
  const r = lector(fitxer, signal), prefix = await r.llig(0, Math.min(fitxer.size, 8));
  let format = null, coordenades;
  if (prefix[0] === 0xff && prefix[1] === 0xd8) { format = 'jpeg'; coordenades = await gpsJpeg(r, fitxer.size); }
  else if (igual(prefix, [137, 80, 78, 71, 13, 10, 26, 10])) { format = 'png'; coordenades = await gpsTrossos(r, prefix, fitxer.size, true); }
  else if (fitxer.size >= 12 && tipus(prefix) === 'RIFF' && tipus(await r.llig(8, 4)) === 'WEBP') { format = 'webp'; coordenades = await gpsTrossos(r, prefix, fitxer.size, false); }
  else if (prefix.length >= 8 && ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(tipus(prefix, 4))) return { ...await inspeccionaBmff(r, fitxer, fitxer.type === 'video/quicktime' ? 'mov' : 'mp4', neteja), r };
  else falla('format-no-compatible');
  return { coordenades, format, completa: true, motiu: null, audioEsperat: 'desconegut', r };
}

/** Distingix absència observada de GPS d'una inspecció que no s'ha pogut completar. */
export async function inspeccionaUbicacioMitja(fitxer, opcions = {}) {
  try {
    const { coordenades, format, completa, motiu, audioEsperat } = await analitza(fitxer, { signal: opcions.signal });
    return { coordenades, format, completa, motiu, audioEsperat };
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    return { coordenades: null, format: null, completa: false, motiu: e?.motiu ?? 'lectura-fallida', audioEsperat: 'desconegut' };
  }
}
export async function extreuCoordenadesMitja(fitxer, opcions = {}) { return (await inspeccionaUbicacioMitja(fitxer, opcions)).coordenades; }

/** Lleva els blocs estàndard de metadades d'MP4/MOV, sense remux ni mostres.
 * Els offsets i la mida es mantenen. net:false no és permís per a pujar un
 * original amb opt-out; el consumidor ha d'aturar-lo o recodificar-lo. */
export async function senseUbicacioVideo(fitxer, opcions = {}) {
  try {
    const resultat = await analitza(fitxer, { ...opcions, neteja: true });
    if (!['mp4', 'mov'].includes(resultat.format) || !resultat.moov || !resultat.completa) return { fitxer, net: false };
    const rangs = resultat.rangs.sort((a, b) => a.inici - b.inici || b.fi - a.fi), nets = [];
    for (const c of rangs) if (!nets.length || c.inici >= nets.at(-1).fi) nets.push(c);
    if (nets.reduce((n, c) => n + c.fi - c.dades, 0) > LIMITS_UBICACIO_MITJANS.bytes) return { fitxer, net: false };
    const parts = []; let pos = 0;
    for (const c of nets) {
      const header = await resultat.r.llig(c.inici, c.header); header.set([102, 114, 101, 101], 4);
      parts.push(fitxer.slice(pos, c.inici), header, new Uint8Array(c.fi - c.dades)); pos = c.fi;
    }
    comprova(opcions.signal); parts.push(fitxer.slice(pos));
    return { fitxer: new Blob(parts, { type: fitxer.type }), net: true };
  } catch (e) { if (e?.name === 'AbortError') throw e; return { fitxer, net: false }; }
}
