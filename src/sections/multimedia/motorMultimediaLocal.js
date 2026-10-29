/**
 * motorMultimediaLocal.js — Motor d'intel·ligència local per a l'Arxiu Multimèdia
 * (`_multimedia_de_poble/`, IDEA-54 · Ordre del Mestre 261029).
 *
 * Implementa l'adaptador de lectura i escriptura local sense servidor
 * (`fontDesDeHandle`, `fontDesDeFitxers`, `demanaCarpeta`, `potTriarCarpeta`,
 * `oblidaFont`) totalment autònom i desacoblat de la frontera privada de la
 * Gestoria, i usa el lector d'EXIF propi (`llegixExif`) per a analitzar
 * qualsevol carpeta multimèdia local (com `_multimedia_de_poble/`) sense pujar
 * cap byte a Internet:
 *   1. Classifica cada fitxer per subcarpeta d'origen (`00_inbox`,
 *      `originals_raster_public`, `nano_banana_historic`, `captures_treball`,
 *      `antic_sistema`, `documents_i_pdfs`...) i tipus (`imatge`, `audio`,
 *      `video`, `document`).
 *   2. Creua cada imatge local amb el cens publicat a la web (`cens` de
 *      `censImatges.js`) i amb la resta de la carpeta local per detectar:
 *        · `emparellada`   — l'original local té la seua versió `.webp` (o si
 *                            mateix) publicada al cens web de `socdepoble.org`.
 *        · `bessonaLocal`  — dins de la carpeta local hi ha l'original ràster
 *                            (`.png`/`.jpg`) i la seua bessona `.webp`, amb el
 *                            càlcul d'estalvi en KB i %.
 *        · `inedita`       — imatge ràster local (`.png`/`.jpg`) sense `.webp`
 *                            local ni presència al cens web (p. ex. a `00_inbox`
 *                            o `nano_banana_historic`).
 *        · `pesAlt`        — `.webp` > 350 KB o ràster sense `.webp` > 500 KB.
 *        · `duplicada`     — un altre fitxer de la carpeta local té el mateix
 *                            nom base o exactament la mateixa mida en bytes.
 *   3. Llig dimensions reals i metadades EXIF (data de captura, càmera, autor,
 *      GPS) d'una imatge local sota demanda i genera variants `.webp` al
 *      navegador per a comparar visualment qualitat vs. pes abans de desar.
 */
import { llegixExif } from '../../components/universal/enquadrament/exif.js';

const INTERNS_FONT_LOCAL = new WeakMap();
const NOMS_OCULTS_SISTEMA = new Set(['.ds_store', '.git', '__macosx', 'thumbs.db', 'desktop.ini']);

function esRutaOcultaLocal(ruta = '') {
  return String(ruta)
    .split('/')
    .some((segment) => {
      const s = segment.trim().toLowerCase();
      return !s || s.startsWith('.') || NOMS_OCULTS_SISTEMA.has(s);
    });
}

function segmentsSegursLocal(ruta) {
  const segs = typeof ruta === 'string' ? ruta.split('/') : [];
  if (
    segs.length === 0 ||
    segs.some((s) => s === '' || s === '.' || s === '..' || s.includes('\\')) ||
    esRutaOcultaLocal(ruta)
  ) {
    throw new Error(`La ruta «${String(ruta)}» no és vàlida dins de la carpeta multimèdia.`);
  }
  return segs;
}

export function potTriarCarpeta(entorn = globalThis) {
  return typeof entorn?.showDirectoryPicker === 'function';
}

export async function demanaCarpeta({ mode = 'read', entorn = globalThis } = {}) {
  if (!potTriarCarpeta(entorn)) {
    const err = new Error('Aquest navegador no disposa de selector directe de carpetes; usa el botó de seleccionar carpeta.');
    err.codi = 'SELECTOR_NO_DISPONIBLE';
    throw err;
  }
  try {
    return await entorn.showDirectoryPicker({ mode });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const err = new Error("No s'ha triat cap carpeta.");
      err.codi = 'SELECCIO_CANCELLADA';
      throw err;
    }
    const err = new Error('No s’ha pogut obrir la carpeta local.');
    err.codi = 'SELECTOR_FALLIT';
    throw err;
  }
}

async function* fillsDirectori(directori) {
  if (typeof directori?.entries === 'function') {
    for await (const [nom, fill] of directori.entries()) yield [nom, fill];
  } else if (typeof directori?.values === 'function') {
    for await (const fill of directori.values()) yield [fill.name, fill];
  }
}

export function fontDesDeHandle(arrel, opcions = {}) {
  if (!arrel || arrel.kind !== 'directory') {
    throw new Error('Cal un FileSystemDirectoryHandle vàlid.');
  }
  const profunditatMax = Number.isSafeInteger(opcions.profunditat) && opcions.profunditat > 0 ? opcions.profunditat : 12;
  const maxFitxers = Number.isSafeInteger(opcions.maxFitxers) && opcions.maxFitxers > 0 ? opcions.maxFitxers : 10000;
  const maxBytesFitxer = Number.isSafeInteger(opcions.maxBytesFitxer) && opcions.maxBytesFitxer > 0 ? opcions.maxBytesFitxer : 50 * 1024 * 1024;
  let limitacions = Object.freeze([]);

  const font = {
    get nom() {
      return String(arrel.name || '_multimedia_de_poble');
    },
    get limitacions() {
      return limitacions;
    },
    get handle() {
      return arrel;
    },
    async llista() {
      const intern = INTERNS_FONT_LOCAL.get(font);
      if (!intern || intern.oblidada) throw new Error('La carpeta local s’ha desconnectat.');
      const avisos = [];
      const entrades = [];
      let truncada = false;

      async function recorre(dir, prefix, nivell) {
        for await (const [nom, fill] of fillsDirectori(dir)) {
          if (truncada) return;
          const ruta = prefix ? `${prefix}/${nom}` : nom;
          if (esRutaOcultaLocal(ruta)) continue;
          if (fill.kind === 'directory') {
            if (nivell < profunditatMax) {
              await recorre(fill, ruta, nivell + 1);
            }
          } else if (fill.kind === 'file') {
            if (entrades.length >= maxFitxers) {
              truncada = true;
              avisos.push({
                codi: 'CARPETA_TRUNCADA',
                missatge: `S'han llistat els primers ${maxFitxers} fitxers.`
              });
              return;
            }
            const f = await fill.getFile();
            entrades.push({
              ruta,
              mida: f.size,
              modificat: f.lastModified || 0
            });
          }
        }
      }

      await recorre(intern.arrel, '', 1);
      limitacions = Object.freeze(avisos);
      return entrades.sort((a, b) => a.ruta.localeCompare(b.ruta));
    },
    async llig(ruta) {
      const intern = INTERNS_FONT_LOCAL.get(font);
      if (!intern || intern.oblidada) throw new Error('La carpeta local s’ha desconnectat.');
      const segs = segmentsSegursLocal(ruta);
      let dir = intern.arrel;
      for (let i = 0; i < segs.length - 1; i += 1) {
        dir = await dir.getDirectoryHandle(segs[i]);
      }
      const fh = await dir.getFileHandle(segs[segs.length - 1]);
      const fitxer = await fh.getFile();
      if (fitxer.size > maxBytesFitxer) {
        throw new Error(`«${ruta}» supera el límit de lectura (${Math.round(maxBytesFitxer / (1024 * 1024))} MB).`);
      }
      return new Uint8Array(await fitxer.arrayBuffer());
    },
    async escriu(ruta, bytes, { sobreescriu = false } = {}) {
      const intern = INTERNS_FONT_LOCAL.get(font);
      if (!intern || intern.oblidada) throw new Error('La carpeta local s’ha desconnectat.');
      const segs = segmentsSegursLocal(ruta);
      let dir = intern.arrel;
      for (let i = 0; i < segs.length - 1; i += 1) {
        dir = await dir.getDirectoryHandle(segs[i], { create: true });
      }
      const nom = segs[segs.length - 1];
      if (!sobreescriu) {
        try {
          await dir.getFileHandle(nom);
          throw new Error(`«${ruta}» ja existeix a la carpeta local.`);
        } catch (e) {
          if (e?.name !== 'NotFoundError') throw e;
        }
      }
      const fh = await dir.getFileHandle(nom, { create: true });
      const escriptor = await fh.createWritable();
      const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      await escriptor.write(uint8);
      await escriptor.close();
    }
  };

  INTERNS_FONT_LOCAL.set(font, { arrel, oblidada: false });
  return Object.freeze(font);
}

export function fontDesDeFitxers(llistaFitxers, opcions = {}) {
  const fitxers = Array.from(llistaFitxers ?? []);
  const maxBytesFitxer = Number.isSafeInteger(opcions.maxBytesFitxer) && opcions.maxBytesFitxer > 0 ? opcions.maxBytesFitxer : 50 * 1024 * 1024;
  const primeraRel = String(fitxers[0]?.webkitRelativePath || '');
  const arrelComuna = primeraRel.includes('/') ? primeraRel.split('/')[0] : '';
  const nom = String(opcions.nom || arrelComuna || '_multimedia_de_poble');
  const perRutaMapa = new Map();

  for (const fitxer of fitxers) {
    const rel = String(fitxer?.webkitRelativePath || fitxer?.name || '');
    const ruta = arrelComuna && rel.startsWith(`${arrelComuna}/`) ? rel.slice(arrelComuna.length + 1) : rel;
    if (!ruta || esRutaOcultaLocal(ruta)) continue;
    perRutaMapa.set(ruta, fitxer);
  }

  const font = {
    get nom() {
      return nom;
    },
    get limitacions() {
      return Object.freeze([]);
    },
    async llista() {
      const intern = INTERNS_FONT_LOCAL.get(font);
      if (!intern || intern.oblidada) throw new Error('La carpeta local s’ha desconnectat.');
      return [...intern.perRutaMapa.entries()]
        .map(([ruta, fitxer]) => ({
          ruta,
          mida: fitxer.size,
          modificat: fitxer.lastModified || 0
        }))
        .sort((a, b) => a.ruta.localeCompare(b.ruta));
    },
    async llig(ruta) {
      const intern = INTERNS_FONT_LOCAL.get(font);
      if (!intern || intern.oblidada) throw new Error('La carpeta local s’ha desconnectat.');
      segmentsSegursLocal(ruta);
      const fitxer = intern.perRutaMapa.get(ruta);
      if (!fitxer) throw new Error(`No es troba «${ruta}» a la carpeta seleccionada.`);
      if (fitxer.size > maxBytesFitxer) {
        throw new Error(`«${ruta}» supera el límit de lectura (${Math.round(maxBytesFitxer / (1024 * 1024))} MB).`);
      }
      return new Uint8Array(await fitxer.arrayBuffer());
    }
  };

  INTERNS_FONT_LOCAL.set(font, { perRutaMapa, oblidada: false });
  return Object.freeze(font);
}

export function oblidaFont(font) {
  const intern = INTERNS_FONT_LOCAL.get(font);
  if (!intern) return;
  intern.oblidada = true;
  if (intern.perRutaMapa) intern.perRutaMapa.clear();
  delete intern.arrel;
}

export const EXTENSIONS_IMATGE_LOCAL = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif']);
export const EXTENSIONS_RASTER_CONVERTIBLE = new Set(['png', 'jpg', 'jpeg']);
export const EXTENSIONS_AUDIO_LOCAL = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac']);
export const EXTENSIONS_VIDEO_LOCAL = new Set(['mp4', 'webm', 'mov', 'm4v']);
export const EXTENSIONS_DOC_LOCAL = new Set(['pdf', 'md', 'txt', 'canvas', 'json']);

export const LLINDAR_WEBP_PES_ALT_BYTES = 350 * 1024;
export const LLINDAR_RASTER_PES_ALT_BYTES = 500 * 1024;
export const MAX_LECTURA_IMATGE_LOCAL_BYTES = 50 * 1024 * 1024;

const MIME_PER_EXTENSIO = Object.freeze({
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf'
});

export function extensioDe(ruta = '') {
  const neta = String(ruta);
  const barra = neta.lastIndexOf('/');
  const nom = barra >= 0 ? neta.slice(barra + 1) : neta;
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

export function nomFitxerDe(ruta = '') {
  const neta = String(ruta);
  const barra = neta.lastIndexOf('/');
  return barra >= 0 ? neta.slice(barra + 1) : neta;
}

export function troncSenseExtensio(ruta = '') {
  const neta = String(ruta);
  const punt = neta.lastIndexOf('.');
  const barra = neta.lastIndexOf('/');
  return punt > barra ? neta.slice(0, punt) : neta;
}

export function nomBaseSenseExtensio(ruta = '') {
  const nom = nomFitxerDe(ruta);
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(0, punt).toLowerCase() : nom.toLowerCase();
}

export function subcarpetaPrincipalDe(ruta = '') {
  const neta = String(ruta);
  const barra = neta.indexOf('/');
  return barra > 0 ? neta.slice(0, barra) : '(arrel)';
}

export function tipusMitjaDe(ruta = '') {
  const ext = extensioDe(ruta);
  if (EXTENSIONS_IMATGE_LOCAL.has(ext)) return 'imatge';
  if (EXTENSIONS_AUDIO_LOCAL.has(ext)) return 'audio';
  if (EXTENSIONS_VIDEO_LOCAL.has(ext)) return 'video';
  if (EXTENSIONS_DOC_LOCAL.has(ext)) return 'document';
  return 'altre';
}

export function mimeDeRuta(ruta = '') {
  return MIME_PER_EXTENSIO[extensioDe(ruta)] || 'application/octet-stream';
}

export function formatKb(bytes = 0) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

/**
 * Extreu el possible camí canònic `/assets/...` d'una ruta dins de
 * `_multimedia_de_poble` (p. ex. `originals_raster_public/assets/uploads/brain/x.jpg`
 * -> `/assets/uploads/brain/x`).
 */
export function troncAssetsDeRutaLocal(ruta = '') {
  const tronc = troncSenseExtensio(ruta);
  const idx = tronc.indexOf('assets/');
  if (idx >= 0) return `/${tronc.slice(idx)}`;
  return null;
}

/**
 * Construeix un índex del cens web (`cens` Map o llista d'ítems) per tronc
 * sense extensió (`/assets/uploads/brain/x`) i per nom base (`x`).
 */
export function indexaCensWeb(cens, mitjansWeb = []) {
  const perTronc = new Map();
  const perNomBase = new Map();

  const registra = (src, info) => {
    if (typeof src !== 'string' || !src) return;
    const tronc = troncSenseExtensio(src);
    const base = nomBaseSenseExtensio(src);
    if (!perTronc.has(tronc)) perTronc.set(tronc, info);
    if (base && !perNomBase.has(base)) perNomBase.set(base, info);
  };

  if (cens && typeof cens.entries === 'function') {
    for (const [src, entrada] of cens.entries()) {
      registra(src, { src, titol: entrada?.titol || entrada?.title || '', ambit: entrada?.ambit || '', poble: entrada?.poble || null });
    }
  }
  if (Array.isArray(mitjansWeb)) {
    for (const item of mitjansWeb) {
      if (item?.src) {
        registra(item.src, { src: item.src, titol: item.title || item.titol || '', ambit: item.ambit || '', poble: item.poble || null });
      }
    }
  }
  return { perTronc, perNomBase };
}

/**
 * Analitza totes les entrades retornades per `font.llista()` i genera el
 * diagnòstic intel·ligent de la carpeta multimèdia local.
 */
export function analitzaCarpetaMultimediaLocal(entrades = [], { cens = null, mitjansWeb = [] } = {}) {
  const { perTronc, perNomBase } = indexaCensWeb(cens, mitjansWeb);
  const perTroncLocal = new Map();
  const perNomBaseLocal = new Map();
  const perMidaImatge = new Map();

  for (const item of entrades) {
    if (!item || typeof item.ruta !== 'string') continue;
    const tronc = troncSenseExtensio(item.ruta);
    const grupTronc = perTroncLocal.get(tronc) || [];
    grupTronc.push(item);
    perTroncLocal.set(tronc, grupTronc);

    const base = nomBaseSenseExtensio(item.ruta);
    if (base) {
      const grupBase = perNomBaseLocal.get(base) || [];
      grupBase.push(item);
      perNomBaseLocal.set(base, grupBase);
    }

    if (tipusMitjaDe(item.ruta) === 'imatge' && item.mida > 4096) {
      const grupMida = perMidaImatge.get(item.mida) || [];
      grupMida.push(item.ruta);
      perMidaImatge.set(item.mida, grupMida);
    }
  }

  const subcarpetesMap = new Map();
  let pesTotalBytes = 0;
  let totalImatges = 0;
  let totalEmparelladesWeb = 0;
  let totalInedites = 0;
  let totalBessonesLocals = 0;
  let totalPesAlt = 0;
  let totalDuplicades = 0;
  let estalviBessonesBytes = 0;

  const elements = entrades.map((item) => {
    const ruta = item.ruta;
    const mida = Number(item.mida) || 0;
    const modificat = Number(item.modificat) || 0;
    const ext = extensioDe(ruta);
    const tipus = tipusMitjaDe(ruta);
    const subcarpeta = subcarpetaPrincipalDe(ruta);
    const nom = nomFitxerDe(ruta);
    const tronc = troncSenseExtensio(ruta);
    const base = nomBaseSenseExtensio(ruta);

    pesTotalBytes += mida;
    const comptaSub = subcarpetesMap.get(subcarpeta) || { nom: subcarpeta, total: 0, bytes: 0 };
    comptaSub.total += 1;
    comptaSub.bytes += mida;
    subcarpetesMap.set(subcarpeta, comptaSub);

    const troncAssets = troncAssetsDeRutaLocal(ruta);
    const parellaWeb = (troncAssets && perTronc.get(troncAssets)) || perNomBase.get(base) || null;

    const germansTronc = perTroncLocal.get(tronc) || [];
    const germansWebp = germansTronc.find((g) => extensioDe(g.ruta) === 'webp' && g.ruta !== ruta) || null;
    const germansRaster = germansTronc.find((g) => EXTENSIONS_RASTER_CONVERTIBLE.has(extensioDe(g.ruta)) && g.ruta !== ruta) || null;

    const esRasterConvertible = EXTENSIONS_RASTER_CONVERTIBLE.has(ext);
    const teBessonaLocal = Boolean((esRasterConvertible && germansWebp) || (ext === 'webp' && germansRaster));
    const estalviBytes = esRasterConvertible && germansWebp && mida > germansWebp.mida
      ? mida - germansWebp.mida
      : 0;
    if (estalviBytes > 0) estalviBessonesBytes += estalviBytes;

    const emparelladaWeb = Boolean(parellaWeb);
    const inedita = tipus === 'imatge' && esRasterConvertible && !emparelladaWeb && !germansWebp;
    const pesAlt = tipus === 'imatge' && (
      (ext === 'webp' && mida > LLINDAR_WEBP_PES_ALT_BYTES) ||
      (esRasterConvertible && !germansWebp && mida > LLINDAR_RASTER_PES_ALT_BYTES)
    );

    const mateixaMida = tipus === 'imatge' && mida > 4096 ? (perMidaImatge.get(mida) || []).filter((r) => r !== ruta) : [];
    const altresCarpetesMateixNom = (perNomBaseLocal.get(base) || [])
      .filter((g) => g.ruta !== ruta && troncSenseExtensio(g.ruta) !== tronc)
      .map((g) => g.ruta);
    const duplicada = mateixaMida.length > 0 || altresCarpetesMateixNom.length > 0;

    if (tipus === 'imatge') {
      totalImatges += 1;
      if (emparelladaWeb) totalEmparelladesWeb += 1;
      if (inedita) totalInedites += 1;
      if (teBessonaLocal) totalBessonesLocals += 1;
      if (pesAlt) totalPesAlt += 1;
      if (duplicada) totalDuplicades += 1;
    }

    return {
      ruta,
      nom,
      subcarpeta,
      ext,
      tipus,
      mida,
      modificat,
      emparelladaWeb,
      parellaWeb,
      teBessonaLocal,
      bessonaWebpRuta: germansWebp?.ruta || null,
      bessonaWebpMida: germansWebp?.mida || null,
      originalRasterRuta: germansRaster?.ruta || null,
      originalRasterMida: germansRaster?.mida || null,
      estalviBytes,
      inedita,
      pesAlt,
      duplicada,
      coincidenciesMida: mateixaMida,
      coincidenciesNom: altresCarpetesMateixNom
    };
  });

  const subcarpetes = [...subcarpetesMap.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));

  return {
    elements,
    subcarpetes,
    resum: {
      totalFitxers: elements.length,
      totalImatges,
      pesTotalBytes,
      totalEmparelladesWeb,
      totalInedites,
      totalBessonesLocals,
      totalPesAlt,
      totalDuplicades,
      estalviBessonesBytes
    }
  };
}

/**
 * Llig els bytes d'una imatge de la Font local i n'extreu les metadades EXIF
 * (data, càmera, autor, copyright i GPS si existeixen).
 */
export async function inspeccionaImatgeLocal(font, ruta) {
  const bytes = await font.llig(ruta, { midaMaximaBytes: MAX_LECTURA_IMATGE_LOCAL_BYTES });
  const mime = mimeDeRuta(ruta);
  const blob = new Blob([bytes], { type: mime });
  let exif = null;
  try {
    exif = await llegixExif(bytes, { ambCamera: true });
  } catch {
    exif = null;
  }
  return { bytes, blob, mime, exif };
}

/**
 * Escriu un fitxer `.webp` generat al laboratori dins del `FileSystemDirectoryHandle`
 * (només si el navegador té permís `readwrite` sobre la carpeta local).
 */
export async function desarWebpEnHandleLocal(rootHandle, rutaWebpRelativa, bytesWebp) {
  if (!rootHandle || typeof rootHandle.getDirectoryHandle !== 'function') {
    throw new Error('Cal obrir la carpeta amb el selector natiu del navegador per poder desar el WebP.');
  }
  const neta = String(rutaWebpRelativa || '').replace(/^\/+/, '');
  if (!neta.toLowerCase().endsWith('.webp') || neta.includes('..')) {
    throw new Error('Només es permet escriure fitxers amb extensió .webp dins de la carpeta local.');
  }
  if (typeof rootHandle.requestPermission === 'function') {
    const permis = await rootHandle.requestPermission({ mode: 'readwrite' });
    if (permis !== 'granted') {
      throw new Error('S’ha denegat el permís d’escriptura a la carpeta local.');
    }
  }
  const segments = neta.split('/').filter(Boolean);
  const nomFitxer = segments.pop();
  let dirActual = rootHandle;
  for (const seg of segments) {
    dirActual = await dirActual.getDirectoryHandle(seg, { create: true });
  }
  const fileHandle = await dirActual.getFileHandle(nomFitxer, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(bytesWebp);
  await writable.close();
  return neta;
}

