/**
 * suggerimentPobleLocal.js — Proposta de poble, categoria i origen per a un
 * arxiu d'una carpeta local (IDEA-54/55 · Onada 261029_1605).
 *
 * Pur i sense xarxa. Les úniques coordenades de pobles del repositori són les
 * de la llavor (`MOCK_TOWNS`): els pobles que no hi són cauen a prop d'un que
 * sí que hi és (Alcoi queda a 6,1 km de Benifallim, Finestrat a 4,3 km
 * d'Orxeta). Per això el resultat és sempre una PROPOSTA que la persona ha de
 * confirmar, mai un fet, i només es diu «és X» quan la foto és a tocar:
 *   · fins a 2,5 km del poble → confiança alta (motiu 'gps');
 *   · fins a 6 km → «a prop de X», confiança baixa ('gps-proximitat');
 *   · fins a 15 km → només la comarca ('gps-comarca');
 *   · més lluny → avís GPS_LLUNY_DELS_POBLES.
 * Prioritat: el cens (una persona ja l'ha catalogada), després el GPS i
 * després el nom de la ruta (el nom oficial, confiança mitjana; l'àlies de
 * «Gent de …» o un nom comú com «relleu» o «sella», baixa). Dos pobles
 * empatats pel nom no en donen cap (NOM_AMBIGU).
 */
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import { distanciaKm, pobleMesProper } from '../mur/mapaFotografic.js';
import { slugDelPoble } from '../pobles/nomsDelPoble.js';
import { ORIGENS, PATRONS_IA } from './origenImatges.js';

export const RADI_POBLE_ALTA_KM = 2.5;
export const RADI_POBLE_PROPER_KM = 6;
export const RADI_COMARCA_KM = 15;
/* Còpia d'AMBITS de censImatges.js (amb prova de paritat): el cens es carrega a banda amb import(). */
export const AMBITS_CATALEG_LOCAL = Object.freeze(['poble', 'persona', 'entitat', 'ia', 'contingut']);
/* Noms de poble que també són paraules comunes: «relleu» (valencià) i «sella» (castellà). */
export const NOMS_POBLE_AMBIGUS = Object.freeze(['relleu', 'sella']);

export const CONFIANCES_SUGGERIMENT_POBLE = Object.freeze(['alta', 'mitjana', 'baixa']);
export const MOTIUS_SUGGERIMENT_POBLE = Object.freeze(['cens', 'gps', 'gps-proximitat', 'gps-comarca', 'nom', 'nom-alies']);
export const AVISOS_SUGGERIMENT_POBLE = Object.freeze(['NOM_AMBIGU', 'GPS_I_NOM_DISCREPEN', 'CENS_I_GPS_DISCREPEN', 'GPS_LLUNY_DELS_POBLES']);
export const MOTIUS_CATEGORIA_LOCAL = Object.freeze(['cens', 'poble']);
export const MOTIUS_ORIGEN_LOCAL = Object.freeze(['cens', 'exif-camera', 'nom-ia']);

const arrodonix = (km) => Math.round(km * 10) / 10;

/* Les paraules d'una ruta: sense diacrítics, en minúscules i partides per tot el que no és lletra o xifra. */
function paraulesDe(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/* Les formes d'un poble: el nom oficial i l'àlies de «Gent de …» / «Gent d'…» si és diferent. */
function formesDe(poble) {
  const formes = [];
  const oficial = slugDelPoble(poble?.title);
  if (oficial) formes.push({ paraules: oficial.split('-'), alies: false });
  const autor = typeof poble?.author === 'string' ? poble.author.trim() : '';
  const gent = /^gent\s+(?:de\s+|d['’])(.+)$/i.exec(autor);
  if (gent) {
    const alies = slugDelPoble(gent[1]);
    if (alies && alies !== oficial) formes.push({ paraules: alies.split('-'), alies: true });
  }
  return formes;
}

function conteSequencia(paraules, forma) {
  if (forma.length === 0 || forma.length > paraules.length) return false;
  for (let i = 0; i + forma.length <= paraules.length; i += 1) {
    let iguals = true;
    for (let j = 0; j < forma.length; j += 1) {
      if (paraules[i + j] !== forma[j]) {
        iguals = false;
        break;
      }
    }
    if (iguals) return true;
  }
  return false;
}

/* El poble que nomena la ruta: la seqüència contigua més llarga. Empat entre dos pobles → ambigu. */
function pobleDelNom(ruta, pobles) {
  const paraules = paraulesDe(ruta);
  if (paraules.length === 0) return null;
  let millors = [];
  let llargaria = 0;
  for (const poble of pobles) {
    let millor = null;
    for (const forma of formesDe(poble)) {
      if (!conteSequencia(paraules, forma.paraules)) continue;
      const n = forma.paraules.length;
      if (!millor || n > millor.llargaria || (n === millor.llargaria && !forma.alies)) {
        millor = { poble, llargaria: n, alies: forma.alies };
      }
    }
    if (!millor) continue;
    if (millor.llargaria > llargaria) {
      millors = [millor];
      llargaria = millor.llargaria;
    } else if (millor.llargaria === llargaria) {
      millors.push(millor);
    }
  }
  if (millors.length === 0) return null;
  return millors.length > 1 ? { ambigu: true } : millors[0];
}

function pobleDelCens(slug, pobles) {
  if (typeof slug !== 'string' || slug.trim() === '') return null;
  const net = slug.trim();
  return pobles.find((p) => p?.id === net || slugDelPoble(p?.title) === net) ?? null;
}

const esNomAmbigu = (poble) => NOMS_POBLE_AMBIGUS.includes(slugDelPoble(poble?.title) ?? '');

const teCamera = (camera) => Boolean(camera)
  && ((typeof camera.marca === 'string' && camera.marca.trim() !== '')
    || (typeof camera.model === 'string' && camera.model.trim() !== ''));

const pobleDeSortida = (poble) => (poble
  ? Object.freeze({ id: String(poble.id ?? ''), nom: String(poble.title ?? ''), comarca: poble.comarca ?? null })
  : null);

/**
 * La proposta de poble, categoria i origen d'un arxiu local. Pura: no muta res.
 * @param {{ exif?: object|null, ruta?: string, parellaWeb?: object|null, pobles?: Array<object> }} [entrada]
 * @returns {Readonly<{ poble: { id, nom, comarca }|null, comarca: string|null,
 *   confianca: 'alta'|'mitjana'|'baixa'|null, motiu: string|null, km: number|null,
 *   categoria: string|null, motiuCategoria: 'cens'|'poble'|null,
 *   origen: 'ia'|'foto'|'sistema'|null, motiuOrigen: 'cens'|'exif-camera'|'nom-ia'|null,
 *   avisos: ReadonlyArray<string> }>}
 */
export function suggerixPobleLocal({ exif = null, ruta = '', parellaWeb = null, pobles = MOCK_TOWNS } = {}) {
  const llista = Array.isArray(pobles) ? pobles.filter((p) => p && typeof p === 'object') : [];
  const gps = exif && typeof exif === 'object' ? exif.gps : null;
  const proper = pobleMesProper(gps, llista);
  const avisos = [];

  let poble = null;
  let comarca = null;
  let confianca = null;
  let motiu = null;
  let km = null;

  const delCens = pobleDelCens(parellaWeb?.poble, llista);
  if (delCens) {
    poble = delCens;
    confianca = 'alta';
    motiu = 'cens';
    if (proper && proper.km <= RADI_POBLE_PROPER_KM) {
      if (proper.poble !== delCens) avisos.push('CENS_I_GPS_DISCREPEN');
      else km = arrodonix(proper.km);
    }
  } else if (proper && proper.km <= RADI_POBLE_PROPER_KM) {
    poble = proper.poble;
    km = arrodonix(proper.km);
    if (proper.km <= RADI_POBLE_ALTA_KM) {
      confianca = 'alta';
      motiu = 'gps';
    } else {
      confianca = 'baixa';
      motiu = 'gps-proximitat';
    }
    const delNom = typeof ruta === 'string' ? pobleDelNom(ruta, llista) : null;
    if (delNom && !delNom.ambigu) {
      if (delNom.poble !== proper.poble) avisos.push('GPS_I_NOM_DISCREPEN');
      else if (confianca === 'baixa') confianca = 'mitjana';
    }
  } else {
    const delNom = typeof ruta === 'string' ? pobleDelNom(ruta, llista) : null;
    if (delNom?.ambigu) avisos.push('NOM_AMBIGU');
    if (delNom && !delNom.ambigu) {
      poble = delNom.poble;
      motiu = delNom.alies ? 'nom-alies' : 'nom';
      confianca = delNom.alies || esNomAmbigu(delNom.poble) ? 'baixa' : 'mitjana';
      if (proper) {
        const d = distanciaKm(gps, delNom.poble);
        confianca = 'baixa';
        if (d <= RADI_COMARCA_KM) km = arrodonix(d);
        else if (proper.km <= RADI_COMARCA_KM) avisos.push('GPS_I_NOM_DISCREPEN');
        else avisos.push('GPS_LLUNY_DELS_POBLES');
      }
    } else if (proper && proper.km <= RADI_COMARCA_KM) {
      comarca = proper.poble?.comarca ?? null;
      confianca = 'baixa';
      motiu = 'gps-comarca';
      km = arrodonix(proper.km);
    } else if (proper) {
      avisos.push('GPS_LLUNY_DELS_POBLES');
    }
  }
  if (poble) comarca = poble.comarca ?? null;

  let categoria = null;
  let motiuCategoria = null;
  if (AMBITS_CATALEG_LOCAL.includes(parellaWeb?.ambit)) {
    categoria = parellaWeb.ambit;
    motiuCategoria = 'cens';
  } else if (poble && (confianca === 'alta' || confianca === 'mitjana')) {
    categoria = 'poble';
    motiuCategoria = 'poble';
  }

  let origen = null;
  let motiuOrigen = null;
  if (ORIGENS.includes(parellaWeb?.origen)) {
    origen = parellaWeb.origen;
    motiuOrigen = 'cens';
  } else if (teCamera(exif?.camera)) {
    origen = 'foto';
    motiuOrigen = 'exif-camera';
  } else if (typeof ruta === 'string' && ruta !== '' && PATRONS_IA.some((patro) => patro.test(`/${ruta}`))) {
    origen = 'ia';
    motiuOrigen = 'nom-ia';
  }

  return Object.freeze({
    poble: pobleDeSortida(poble),
    comarca,
    confianca,
    motiu,
    km,
    categoria,
    motiuCategoria,
    origen,
    motiuOrigen,
    avisos: Object.freeze(avisos)
  });
}
