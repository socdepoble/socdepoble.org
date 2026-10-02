/**
 * fontNavegador.js — la carpeta que tria la persona, com a Font per al tractor.
 *
 * Dues maneres d'obrir la carpeta, amb el mateix contracte:
 *   fontDesDeHandle   File System Access (showDirectoryPicker): Chrome i Edge.
 *                     Pot escriure, però només amb permís readwrite concedit.
 *   fontDesDeFitxers  <input type="file" webkitdirectory multiple>: Safari,
 *                     Firefox i qualsevol navegador. Només lectura.
 * El navegador només dona accés a la carpeta triada, i només després d'un gest
 * de la persona. Res no ix d'este ordinador ni es desa al navegador: els
 * bytes es lligen quan el tractor els demana i es tornen tal qual.
 *
 * FONT: { nom, llista(): Promise<[{ ruta, mida, modificat }]>,
 *   llig(ruta): Promise<Uint8Array>, escriu?(ruta, bytes, { sobreescriu }),
 *   limitacions: [{ codi, missatge }] (les de l'última llista) }.
 * Les rutes són relatives a la carpeta triada, amb «/», i van ordenades. Els
 * ocults i els del sistema (.DS_Store, .git, ._x, __MACOSX, Thumbs.db...) no
 * es llisten ni es lligen. oblidaFont buida les referències internes: després,
 * cap mètode no torna a llegir res (FONT_OBLIDADA).
 * Errors: sempre ErrorTractor amb codi (vegeu ../nucli/tractor.js).
 */
import { ErrorTractor, LIMITS_TRACTOR, esRutaOculta } from '../nucli/tractor.js';

const MODES = Object.freeze(['read', 'readwrite']);
/* El que el manifest del tractor declara que pot escriure: el CSV i l'XLSX del trimestre. */
const EXTENSIONS_ESCRIPTURA = Object.freeze(['csv', 'xlsx']);
/* Referències internes de cada Font (la carpeta o els fitxers): oblidaFont les buida. */
const INTERNS = new WeakMap();

function extensio(nom) {
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

const perRuta = (x, y) => (x.ruta < y.ruta ? -1 : x.ruta > y.ruta ? 1 : 0);

/* Segments d'una ruta relativa sense trampes: ni buits, ni «.», ni «..», ni ocults. */
function segmentsSegurs(ruta) {
  const segs = typeof ruta === 'string' ? ruta.split('/') : [];
  if (segs.length === 0 || segs.some((s) => s === '' || s === '.' || s === '..' || s.includes('\\')) || esRutaOculta(ruta)) {
    throw new ErrorTractor('RUTA_INVALIDA', `La ruta «${String(ruta)}» no és d'un fitxer de la carpeta triada.`);
  }
  return segs;
}

function bytesDe(bytes) {
  if (bytes instanceof Uint8Array) return bytes;
  if (ArrayBuffer.isView(bytes)) return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (Object.prototype.toString.call(bytes) === '[object ArrayBuffer]') return new Uint8Array(bytes);
  throw new ErrorTractor('PARAMETRES_INVALIDS', 'Per a escriure calen bytes (Uint8Array o ArrayBuffer).');
}

/* Un límit vàlid és un enter positiu; si no, val el de LIMITS_TRACTOR. */
function enterPositiu(valor, perDefecte) {
  return Number.isSafeInteger(valor) && valor > 0 ? valor : perDefecte;
}

const massaGran = (nom, maxima) => new ErrorTractor('FITXER_MASSA_GRAN',
  `«${nom}» fa més de ${Math.max(1, Math.round(maxima / (1024 * 1024)))} MB: no es llig.`);

function viu(font) {
  const intern = INTERNS.get(font);
  if (!intern || intern.oblidada) throw new ErrorTractor('FONT_OBLIDADA', "La carpeta s'ha desenxufat: torna-la a triar.");
  return intern;
}

/**
 * Cert si este navegador pot obrir el selector de carpetes del sistema.
 * @param {object} [entorn] per defecte, globalThis
 * @returns {boolean}
 */
export function potTriarCarpeta(entorn = globalThis) {
  return typeof entorn?.showDirectoryPicker === 'function';
}

/**
 * Obri el selector de carpetes del sistema i en torna el handle. Cal cridar-la
 * DINS del gestor d'un clic de la persona: fora d'un gest (un efecte, un
 * temporitzador, una promesa que ja ha esperat) el navegador la rebutja i ací
 * es diu CAL_GEST. Cancel·lar el selector és SELECCIO_CANCELLADA.
 * @param {{ mode?: 'read'|'readwrite', entorn?: object }} [opcions]
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export async function demanaCarpeta({ mode = 'read', entorn = globalThis } = {}) {
  if (!MODES.includes(mode)) throw new ErrorTractor('PARAMETRES_INVALIDS', `El mode ha de ser ${MODES.join(' o ')}.`);
  if (!potTriarCarpeta(entorn)) {
    throw new ErrorTractor('SELECTOR_NO_DISPONIBLE', 'Este navegador no pot obrir el selector de carpetes: tria la carpeta amb el botó de pujar fitxers.');
  }
  try {
    return await entorn.showDirectoryPicker({ mode });
  } catch (error) {
    if (error?.name === 'AbortError') throw new ErrorTractor('SELECCIO_CANCELLADA', "No s'ha triat cap carpeta.", { cause: error });
    if (error?.name === 'SecurityError' || error?.name === 'NotAllowedError') {
      throw new ErrorTractor('CAL_GEST', "El navegador només obri el selector just després d'un clic teu: torna a prémer el botó.", { cause: error });
    }
    throw new ErrorTractor('SELECTOR_FALLIT', 'El selector de carpetes ha fallat: torna-ho a provar.', { cause: error });
  }
}

async function* fillsDe(directori) {
  if (typeof directori.entries === 'function') {
    for await (const [nom, fill] of directori.entries()) yield [nom, fill];
  } else {
    for await (const fill of directori.values()) yield [fill.name, fill];
  }
}

async function permisEscriptura(arrel) {
  const opcions = { mode: 'readwrite' };
  try {
    if ((await arrel.queryPermission(opcions)) === 'granted') return true;
    return (await arrel.requestPermission(opcions)) === 'granted';
  } catch {
    return false;
  }
}

/**
 * Font sobre un handle de carpeta (el de demanaCarpeta). Recorre la carpeta
 * amb entries() (o values()) fins a `profunditat` nivells de subcarpetes i
 * `maxFitxers` fitxers; el que passa d'ahí queda a `limitacions`. `escriu`
 * només existix si el navegador gestiona permisos de fitxers, i només escriu
 * amb el permís readwrite concedit: si no el té, el demana (cal un gest de la
 * persona). Mai sobreescriu un fitxer existent sense { sobreescriu: true }, ni
 * crea carpetes, ni escriu extensions que no siguen les declarades.
 * @param {FileSystemDirectoryHandle} handle
 * @param {{ profunditat?: number, maxFitxers?: number, midaMaxima?: number, extensionsEscriptura?: string[] }} [opcions]
 * @returns {object} Font
 */
export function fontDesDeHandle(handle, {
  profunditat = LIMITS_TRACTOR.profunditat,
  maxFitxers = LIMITS_TRACTOR.fitxersLlistats,
  midaMaxima = LIMITS_TRACTOR.midaFitxer,
  extensionsEscriptura = EXTENSIONS_ESCRIPTURA
} = {}) {
  if (!handle || handle.kind !== 'directory' || (typeof handle.entries !== 'function' && typeof handle.values !== 'function')) {
    throw new ErrorTractor('FONT_INVALIDA', 'Cal una carpeta triada amb el selector del sistema.');
  }
  const nivells = enterPositiu(profunditat, LIMITS_TRACTOR.profunditat);
  const maxim = enterPositiu(maxFitxers, LIMITS_TRACTOR.fitxersLlistats);
  const maxBytes = enterPositiu(midaMaxima, LIMITS_TRACTOR.midaFitxer);
  const permeses = (Array.isArray(extensionsEscriptura) ? extensionsEscriptura : EXTENSIONS_ESCRIPTURA).map((e) => String(e).toLowerCase());

  const font = {
    nom: typeof handle.name === 'string' ? handle.name : '',
    limitacions: [],

    async llista() {
      const { arrel } = viu(font);
      const entrades = [];
      let massa = false;
      let fonda = false;
      let illegibles = 0;
      const recorre = async (directori, prefix, nivell) => {
        for await (const [nom, fill] of fillsDe(directori)) {
          if (massa) return;
          if (typeof nom !== 'string' || nom === '' || esRutaOculta(nom)) continue;
          const ruta = prefix ? `${prefix}/${nom}` : nom;
          if (fill?.kind === 'directory') {
            if (nivell + 1 > nivells) fonda = true;
            else await recorre(fill, ruta, nivell + 1);
          } else if (fill?.kind === 'file') {
            if (entrades.length >= maxim) {
              massa = true;
              return;
            }
            try {
              const fitxer = await fill.getFile();
              entrades.push({ ruta, mida: fitxer.size, modificat: fitxer.lastModified });
            } catch {
              illegibles += 1;
            }
          }
        }
      };
      try {
        await recorre(arrel, '', 0);
      } catch (error) {
        if (error instanceof ErrorTractor) throw error;
        throw new ErrorTractor('FONT_ILLEGIBLE', "No s'ha pogut recórrer la carpeta: potser ja no hi ha permís.", { cause: error });
      }
      viu(font);
      const limitacions = [];
      if (massa) limitacions.push({ codi: 'MASSA_FITXERS', missatge: `La carpeta té més de ${maxim} fitxers: només se n'han llistat ${maxim}.` });
      if (fonda) limitacions.push({ codi: 'PROFUNDITAT_MAXIMA', missatge: `Hi ha carpetes a més de ${nivells} nivells: no s'han recorregut.` });
      if (illegibles > 0) {
        limitacions.push({
          codi: 'FITXER_ILLEGIBLE',
          missatge: illegibles === 1 ? "Un fitxer no s'ha pogut obrir i no es llista." : `${illegibles} fitxers no s'han pogut obrir i no es llisten.`
        });
      }
      font.limitacions = limitacions;
      return entrades.sort(perRuta);
    },

    async llig(ruta) {
      const { arrel } = viu(font);
      const segs = segmentsSegurs(ruta);
      let fitxer;
      try {
        let directori = arrel;
        for (const s of segs.slice(0, -1)) directori = await directori.getDirectoryHandle(s);
        fitxer = await (await directori.getFileHandle(segs[segs.length - 1])).getFile();
      } catch (error) {
        throw new ErrorTractor('FITXER_ILLEGIBLE', `No s'ha pogut obrir «${ruta}».`, { cause: error });
      }
      if (fitxer.size > maxBytes) throw massaGran(ruta, maxBytes);
      let dades;
      try {
        dades = await fitxer.arrayBuffer();
      } catch (error) {
        throw new ErrorTractor('FITXER_ILLEGIBLE', `No s'ha pogut llegir «${ruta}».`, { cause: error });
      }
      viu(font);
      return new Uint8Array(dades);
    }
  };

  const potEscriure = typeof handle.queryPermission === 'function' && typeof handle.requestPermission === 'function'
    && typeof handle.getFileHandle === 'function';
  if (potEscriure) {
    font.escriu = async (ruta, bytes, { sobreescriu = false } = {}) => {
      const { arrel } = viu(font);
      const segs = segmentsSegurs(ruta);
      const nom = segs[segs.length - 1];
      if (!permeses.includes(extensio(nom))) {
        throw new ErrorTractor('ESCRIPTURA_NO_PERMESA', `Este tractor només escriu fitxers ${permeses.map((e) => `.${e}`).join(' i ')}.`);
      }
      const dades = bytesDe(bytes);
      if (!(await permisEscriptura(arrel))) {
        throw new ErrorTractor('ESCRIPTURA_DENEGADA', "No hi ha permís per a escriure en la carpeta: accepta'l quan el navegador te'l demane.");
      }
      viu(font);
      let directori = arrel;
      try {
        for (const s of segs.slice(0, -1)) directori = await directori.getDirectoryHandle(s);
      } catch (error) {
        throw new ErrorTractor('CARPETA_NO_TROBADA', `La carpeta de «${ruta}» no existix: no se'n crea cap.`, { cause: error });
      }
      let existent = null;
      try {
        existent = await directori.getFileHandle(nom);
      } catch (error) {
        if (error?.name !== 'NotFoundError') throw new ErrorTractor('ESCRIPTURA_FALLIDA', `No s'ha pogut preparar «${ruta}».`, { cause: error });
      }
      if (existent && sobreescriu !== true) {
        throw new ErrorTractor('FITXER_JA_EXISTEIX', `Ja hi ha un fitxer «${nom}»: no se sobreescriu sense confirmar-ho.`);
      }
      let escriptor = null;
      try {
        const fitxer = existent ?? await directori.getFileHandle(nom, { create: true });
        escriptor = await fitxer.createWritable();
        await escriptor.write(dades);
        await escriptor.close();
      } catch (error) {
        if (escriptor) {
          try {
            await escriptor.abort();
          } catch {
            /* ja estava tancat: no queda res a desfer */
          }
        }
        throw new ErrorTractor('ESCRIPTURA_FALLIDA', `No s'ha pogut escriure «${ruta}».`, { cause: error });
      }
      return { ruta: segs.join('/'), mida: dades.length, sobreescrit: Boolean(existent) };
    };
  }

  INTERNS.set(font, { arrel: handle, fitxers: null, oblidada: false });
  return font;
}

/**
 * Font sobre els fitxers d'un <input type="file" webkitdirectory multiple>
 * (FileList o llista de File). La ruta és webkitRelativePath sense el primer
 * segment, que és el nom de la carpeta triada (i el nom de la Font); un File
 * sense webkitRelativePath va a l'arrel pel seu nom. Només lectura.
 * @param {FileList|File[]} fitxers
 * @param {{ maxFitxers?: number, midaMaxima?: number }} [opcions]
 * @returns {object} Font
 */
export function fontDesDeFitxers(fitxers, { maxFitxers = LIMITS_TRACTOR.fitxersLlistats, midaMaxima = LIMITS_TRACTOR.midaFitxer } = {}) {
  if (fitxers == null || typeof fitxers.length !== 'number') {
    throw new ErrorTractor('FONT_INVALIDA', 'Cal la llista de fitxers del selector.');
  }
  const maxim = enterPositiu(maxFitxers, LIMITS_TRACTOR.fitxersLlistats);
  const maxBytes = enterPositiu(midaMaxima, LIMITS_TRACTOR.midaFitxer);
  const mapa = new Map();
  let nom = '';
  for (const fitxer of Array.from(fitxers)) {
    if (!fitxer || typeof fitxer.name !== 'string' || typeof fitxer.arrayBuffer !== 'function') continue;
    const relativa = typeof fitxer.webkitRelativePath === 'string' ? fitxer.webkitRelativePath : '';
    let segs = (relativa || fitxer.name).split('/').filter((s) => s !== '');
    if (relativa && segs.length > 1) {
      if (!nom) nom = segs[0];
      segs = segs.slice(1);
    }
    if (segs.length === 0 || segs.some((s) => s === '.' || s === '..' || s.includes('\\'))) continue;
    const ruta = segs.join('/');
    if (esRutaOculta(ruta) || mapa.has(ruta)) continue;
    mapa.set(ruta, fitxer);
  }
  const rutes = [...mapa.keys()].sort();
  const limitacions = [];
  if (rutes.length > maxim) {
    for (const ruta of rutes.slice(maxim)) mapa.delete(ruta);
    limitacions.push({ codi: 'MASSA_FITXERS', missatge: `S'han triat més de ${maxim} fitxers: només se n'han llistat ${maxim}.` });
  }

  const font = {
    nom,
    limitacions,

    async llista() {
      const { fitxers: propis } = viu(font);
      return [...propis].map(([ruta, f]) => ({
        ruta, mida: Number.isFinite(f.size) ? f.size : null, modificat: Number.isFinite(f.lastModified) ? f.lastModified : null
      })).sort(perRuta);
    },

    async llig(ruta) {
      const { fitxers: propis } = viu(font);
      segmentsSegurs(ruta);
      const fitxer = propis.get(ruta);
      if (!fitxer) throw new ErrorTractor('FITXER_ILLEGIBLE', `«${ruta}» no és entre els fitxers triats.`);
      if (Number.isFinite(fitxer.size) && fitxer.size > maxBytes) throw massaGran(ruta, maxBytes);
      let dades;
      try {
        dades = await fitxer.arrayBuffer();
      } catch (error) {
        throw new ErrorTractor('FITXER_ILLEGIBLE', `No s'ha pogut llegir «${ruta}».`, { cause: error });
      }
      viu(font);
      return new Uint8Array(dades);
    }
  };
  INTERNS.set(font, { arrel: null, fitxers: mapa, oblidada: false });
  return font;
}

/**
 * Desenxufa una Font: buida les referències internes (el handle o els File) i
 * les limitacions. Després, llista, llig i escriu llancen FONT_OBLIDADA.
 * Torna cert si la Font era d'este mòdul i encara no s'havia oblidat.
 * @param {object} font
 * @returns {boolean}
 */
export function oblidaFont(font) {
  const intern = font && typeof font === 'object' ? INTERNS.get(font) : undefined;
  if (!intern || intern.oblidada) return false;
  intern.oblidada = true;
  intern.arrel = null;
  if (intern.fitxers) intern.fitxers.clear();
  intern.fitxers = null;
  font.limitacions = [];
  return true;
}
