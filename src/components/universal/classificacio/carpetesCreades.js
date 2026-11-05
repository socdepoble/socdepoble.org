/**
 * carpetesCreades.js · Onada R6 · Bloc 2 (P1-d) · Les carpetes que la persona
 * crea en línia (la «Nova carpeta» de BotoneraClassificacio i el desaCarpeta
 * de l'editor de Notes) sobreviuen a la recàrrega i no deixen cap nota
 * apuntant a una carpeta fantasma.
 *
 * Les carpetes de sèrie venen de la llavor (NOTE_FOLDERS_SEED). Des de R12 hi
 * ha contracte per a crear-ne al servidor (`carpetesNotes`, vegeu
 * creaCarpetaCreada més avall); sense eixa capacitat, en mode seed/local o amb
 * les crides síncrones de sempre (desaCarpetaCreada), la carpeta nova es guarda al magatzem de
 * preferències local (config/storage.js), amb el patró de
 * workspace/carpetesVisibles.js, per àmbit (el scopeKey de Notes: backend,
 * actor i tenant; un altre compte del mateix dispositiu no les hereta):
 *   { v: 1, ambits: { '<ambit>': [{ id: 'f-festes', nom: 'Festes' }] } }
 *
 * Ids sense col·lisió (resolCarpeta): el MATEIX nom (trim, espais plegats i
 * minúscules; els accents compten, «Fèstes» no és «Festes») reutilitza la
 * carpeta que ja hi ha; un altre nom que dona un slug ja pres en pren un amb
 * sufix: f-festes, f-festes-2, f-festes-3…
 *
 * Res que puga créixer: AMBITS_MAXIMS àmbits i CARPETES_MAXIMES carpetes per
 * àmbit; els mapes no tenen prototip. Si l'escriptura falla (mode privat,
 * quota), la carpeta val igual en esta càrrega.
 */
import { useSyncExternalStore } from 'react';
import { STORAGE_PREFIX, getVal, setVal } from '../../../config/storage.js';

export const CLAU_CARPETES_CREADES = 'classificacio-carpetes-creades';
export const AMBIT_COMU = 'comu';
export const AMBITS_MAXIMS = 16;
export const CARPETES_MAXIMES = 200;
const VERSIO = 1;
const LLARGADA_MAXIMA_NOM = 80;
const LLARGADA_MAXIMA_SLUG = 80;
const LLARGADA_MAXIMA_ID = 100;
const LLARGADA_MAXIMA_AMBIT = 200;
const PATRO_ID = /^f-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CAP = Object.freeze([]);

const mapaBuit = () => Object.create(null);
const BUIT = Object.freeze({ v: VERSIO, ambits: Object.freeze(mapaBuit()) });
const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esAmbitValid = (ambit) => typeof ambit === 'string' && ambit.length > 0 && ambit.length <= LLARGADA_MAXIMA_AMBIT;

/** El nom tal com es mostra: sense espais als extrems ni espais repetits. */
const netejaNom = (nom) => String(nom ?? '').trim().replace(/\s+/g, ' ');

/** La clau de comparació d'un nom de carpeta: el nom net en minúscules. Els accents compten. */
export function clauDeNom(nom) {
  return netejaNom(nom).toLocaleLowerCase('ca');
}

/** L'slug base d'un nom (sense accents ni signes): «Fèstes» i «Festes» donen el mateix, f-festes. */
export function slugBaseDeCarpeta(nom) {
  const base = netejaNom(nom)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LLARGADA_MAXIMA_SLUG)
    .replace(/-+$/g, '');
  return `f-${base || 'carpeta'}`;
}

/**
 * La carpeta per a un nom escrit, dins de les que ja hi ha.
 * @returns {{ id: string, nom: string, nova: boolean } | null} null si el nom és buit.
 */
export function resolCarpeta(nom, existents = CAP) {
  const net = netejaNom(nom);
  if (!net) return null;
  const llista = Array.isArray(existents) ? existents : CAP;
  const clau = clauDeNom(net);
  const mateixa = llista.find((c) => c && (clauDeNom(c.nom) === clau || String(c.id) === net));
  if (mateixa) return { id: String(mateixa.id), nom: String(mateixa.nom ?? net), nova: false };
  const base = slugBaseDeCarpeta(net);
  const presos = new Set(llista.filter(Boolean).map((c) => String(c.id)));
  let id = base;
  for (let n = 2; presos.has(id); n += 1) id = `${base}-${n}`;
  return { id, nom: net.slice(0, LLARGADA_MAXIMA_NOM), nova: true };
}

const esCarpetaValida = (carpeta) => esObjecte(carpeta)
  && typeof carpeta.id === 'string' && carpeta.id.length <= LLARGADA_MAXIMA_ID && PATRO_ID.test(carpeta.id)
  && typeof carpeta.nom === 'string' && netejaNom(carpeta.nom).length > 0 && carpeta.nom.length <= LLARGADA_MAXIMA_NOM;

/** Només àmbits i carpetes vàlids, sense ids repetits, dins dels límits; la resta es descarta. */
export function normalitzaCarpetesCreades(cru) {
  if (!esObjecte(cru) || cru.v !== VERSIO || !esObjecte(cru.ambits)) return BUIT;
  const ambits = mapaBuit();
  let quants = 0;
  for (const [ambit, llista] of Object.entries(cru.ambits)) {
    if (quants >= AMBITS_MAXIMS) break;
    if (!esAmbitValid(ambit) || !Array.isArray(llista)) continue;
    const vistos = new Set();
    const bones = [];
    for (const carpeta of llista) {
      if (bones.length >= CARPETES_MAXIMES) break;
      if (!esCarpetaValida(carpeta) || vistos.has(carpeta.id)) continue;
      vistos.add(carpeta.id);
      bones.push(Object.freeze({ id: carpeta.id, nom: netejaNom(carpeta.nom) }));
    }
    if (bones.length) {
      ambits[ambit] = Object.freeze(bones);
      quants += 1;
    }
  }
  return Object.freeze({ v: VERSIO, ambits: Object.freeze(ambits) });
}

let cache = null;
const oients = new Set();
const estat = () => {
  if (!cache) cache = normalitzaCarpetesCreades(getVal(CLAU_CARPETES_CREADES, null));
  return cache;
};

/** L'àmbit vàlid o la reserva comuna. */
export const ambitDeCarpetes = (ambit) => (esAmbitValid(ambit) ? ambit : AMBIT_COMU);

/** Les carpetes creades d'un àmbit (llista congelada i estable entre lectures). */
export function carpetesCreades(ambit) {
  return estat().ambits[ambitDeCarpetes(ambit)] ?? CAP;
}

/**
 * Desa una carpeta creada en línia. Idempotent: un id que ja hi és no es
 * duplica ni canvia de nom. Torna true si l'ha afegida.
 */
export function desaCarpetaCreada(ambit, carpeta) {
  const clau = ambitDeCarpetes(ambit);
  const nova = esObjecte(carpeta) ? { id: String(carpeta.id ?? ''), nom: netejaNom(carpeta.nom) } : null;
  if (!esCarpetaValida(nova)) return false;
  /* Àrbitre B2-S3 · Torna a llegir el storage abans de fusionar: una altra
     pestanya pot haver-hi desat carpetes des que esta va omplir la memòria,
     i escriure des de la memòria vella les esborraria (notes amb carpeta fantasma). */
  cache = null;
  const actuals = carpetesCreades(clau);
  if (actuals.some((c) => c.id === nova.id) || actuals.length >= CARPETES_MAXIMES) return false;
  const ambits = Object.assign(mapaBuit(), estat().ambits);
  /* Un àmbit nou quan ja n'hi ha el màxim: se'n va el més antic. */
  if (!(clau in ambits) && Object.keys(ambits).length >= AMBITS_MAXIMS) delete ambits[Object.keys(ambits)[0]];
  ambits[clau] = [...actuals, nova];
  cache = normalitzaCarpetesCreades({ v: VERSIO, ambits });
  setVal(CLAU_CARPETES_CREADES, cache);
  oients.forEach((oient) => oient());
  return true;
}

/* R12 (Onada R6, Bloc 4, B4-S1) · Quan el backend té carpetes (capacitat
   `carpetesNotes`, taula `note_folders` de la migració 76) i treballem en
   remot, la carpeta es crea al servidor ABANS de donar-la per bona: l'id
   (`f-<uuid>`) el posa el servidor, i només eixe id es pot assignar a una nota.
   També es guarda ací, al seu àmbit, perquè es veja en esta pestanya i en les
   altres ('storage') abans que loadNotes la torne a portar. Sense la capacitat,
   en mode seed/local o amb un servidor sense la migració (404), el camí és el
   de sempre: slug local i magatzem del navegador. Un altre error del servidor
   es propaga i no deixa cap carpeta a mitges. */
const MODES_DEL_NAVEGADOR = Object.freeze(new Set(['seed', 'local']));
const esServidorSenseCarpetes = (error) => error?.status === 404 || /PGRST20[25]|42P01|42883/.test(String(error?.message || ''));

/**
 * Crea (o reutilitza pel nom) una carpeta i la deixa persistida.
 * @param {string} ambit el scopeKey de Notes
 * @param {string} nom el nom escrit
 * @param {{ existents?: Array<{id: string, nom: string}>, config?: object|null }} [opcions]
 * @returns {Promise<{ id: string, nom: string, nova: boolean, desti: 'existent'|'servidor'|'navegador' } | null>} null si el nom és buit.
 */
export async function creaCarpetaCreada(ambit, nom, { existents = CAP, config = null } = {}) {
  const totes = [...(Array.isArray(existents) ? existents : CAP), ...carpetesCreades(ambit)];
  const resolta = resolCarpeta(nom, totes);
  if (!resolta) return null;
  if (!resolta.nova) return { ...resolta, desti: 'existent' };
  const remot = config && typeof config === 'object' && !MODES_DEL_NAVEGADOR.has(config.dataMode);
  if (remot) {
    const port = await import('../../../data/backendPort.js');
    if (port.teCapacitat('carpetesNotes')) {
      try {
        const carpeta = await port.creaCarpetaNotes({ nom: resolta.nom }, config);
        desaCarpetaCreada(ambit, { id: carpeta.id, nom: carpeta.nom });
        return { id: carpeta.id, nom: carpeta.nom, nova: true, desti: 'servidor' };
      } catch (error) {
        if (!esServidorSenseCarpetes(error)) throw error;
      }
    }
  }
  desaCarpetaCreada(ambit, resolta);
  return { ...resolta, desti: 'navegador' };
}

/* D-R6-2 (Onada R6, Bloc 3; decisió de MarIA) · Una altra pestanya ha desat
   carpetes (o ha buidat el storage, key null): es torna a llegir i s'avisa,
   i les dues pestanyes veuen la carpeta nova sense recarregar. Una sola
   escolta, amb el primer oient; se'n va amb l'últim. Sense window, res. */
let escoltaStorage = null;
function enCanviDeStorage(event) {
  if (event?.key != null && event.key !== STORAGE_PREFIX + CLAU_CARPETES_CREADES) return;
  cache = null;
  oients.forEach((oient) => oient());
}

export function subscriuCarpetesCreades(oient) {
  oients.add(oient);
  if (!escoltaStorage && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    escoltaStorage = enCanviDeStorage;
    window.addEventListener('storage', escoltaStorage);
  }
  return () => {
    oients.delete(oient);
    if (!oients.size && escoltaStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', escoltaStorage);
      escoltaStorage = null;
    }
  };
}

/** Les carpetes creades d'un àmbit, vives (useSyncExternalStore). */
export function useCarpetesCreades(ambit) {
  const llig = () => carpetesCreades(ambit);
  return useSyncExternalStore(subscriuCarpetesCreades, llig, llig);
}

/** Només per a proves: oblida la memòria (com una recàrrega de la pàgina). */
export function _reiniciaCarpetesCreades() {
  cache = null;
}
