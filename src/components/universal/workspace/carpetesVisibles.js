/**
 * carpetesVisibles.js — Llei de la Roda Dentada (ordre del Mestre, 261007):
 * quines carpetes (o categories) de primer nivell de la navegació vol tindre
 * a la vista la persona, espai de treball a espai de treball (Wiki, Notes,
 * Disseny, Perfil…).
 *
 * Amagar una carpeta només la lleva de la navegació: MAI l'esborra ni n'esborra
 * els documents, que continuen a «Tot» i a la cerca (UniversalWorkspace).
 *
 * El patró és el de les preferències de la Plataforma d'Apps
 * (apps/plataforma/preferenciesApps.js): una sola clau de storage.js, síncrona
 * i xicoteta («només identitat i preferències»), i només es guarda el que la
 * persona ha AMAGAT:
 *   { v: 1, espais: { notes: { 'f-mur': false } } }
 * Tornar-la a la vista és esborrar l'amagada.
 *
 * L'estat es llig una vegada i es guarda en memòria; subscriuCarpetesVisibles
 * servix per a useSyncExternalStore. Si l'escriptura falla (mode privat,
 * quota), el canvi val igual en esta càrrega.
 *
 * Res que puga créixer: com a molt ESPAIS_MAXIMS espais i
 * AMAGADES_MAXIMES carpetes amagades per espai; els mapes no tenen prototip
 * (un id «constructor» o «__proto__» és un id com qualsevol altre).
 */
import { getVal, setVal } from '../../../config/storage.js';

export const CLAU_CARPETES_VISIBLES = 'workspace-carpetes-visibles';
/* La reserva estable de l'espai: la que fa servir un UniversalWorkspace que no
   diu qui és (ni idEspai ni la clau del mestre-detall). */
export const ESPAI_COMU = 'comu';

const VERSIO = 1;
/* La mateixa forma que la clau del mestre-detall (nivellMestreDetall.js). */
const PATRO_ESPAI = /^[a-z][a-z0-9-]{0,39}$/;
const LLARGADA_MAXIMA_ID = 160;
export const ESPAIS_MAXIMS = 32;
export const AMAGADES_MAXIMES = 200;

const mapaBuit = () => Object.create(null);
const congela = (mapa) => Object.freeze(mapa);

const SENSE_AMAGADES = congela(mapaBuit());
const BUIDES = Object.freeze({ v: VERSIO, espais: congela(mapaBuit()) });

let cache = null;
const oients = new Set();

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/** Un nom d'espai vàlid: minúscules, xifres i guions, com la clau del mestre-detall. */
export const esEspaiValid = (espai) => typeof espai === 'string' && PATRO_ESPAI.test(espai);

/** Un id de carpeta vàlid: un text no buit i curt (els ids del Workspace ja són text). */
const esIdValid = (id) => typeof id === 'string' && id.length > 0 && id.length <= LLARGADA_MAXIMA_ID;

/** El primer candidat que és un nom d'espai vàlid; si no n'hi ha cap, ESPAI_COMU. */
export function espaiDe(...candidats) {
  return candidats.find(esEspaiValid) ?? ESPAI_COMU;
}

/** Només espais i ids vàlids amb el valor `false`, dins dels límits; la resta es descarta. */
export function normalitzaCarpetesVisibles(cru) {
  if (!esObjecte(cru) || cru.v !== VERSIO || !esObjecte(cru.espais)) return BUIDES;
  const espais = mapaBuit();
  let comptador = 0;
  for (const [espai, mapa] of Object.entries(cru.espais)) {
    if (comptador >= ESPAIS_MAXIMS) break;
    if (!esEspaiValid(espai) || !esObjecte(mapa)) continue;
    const amagades = mapaBuit();
    let quantes = 0;
    for (const [id, valor] of Object.entries(mapa)) {
      if (quantes >= AMAGADES_MAXIMES) break;
      if (esIdValid(id) && valor === false) {
        amagades[id] = false;
        quantes += 1;
      }
    }
    if (quantes) {
      espais[espai] = congela(amagades);
      comptador += 1;
    }
  }
  return Object.freeze({ v: VERSIO, espais: congela(espais) });
}

export function llegeixCarpetesVisibles() {
  if (cache === null) cache = normalitzaCarpetesVisibles(getVal(CLAU_CARPETES_VISIBLES, null));
  return cache;
}

/**
 * Les carpetes amagades d'un espai, { id: false }. La mateixa referència
 * mentre no canvien: useSyncExternalStore la pot comparar.
 */
export function carpetesAmagadesDe(espai) {
  if (!esEspaiValid(espai)) return SENSE_AMAGADES;
  return llegeixCarpetesVisibles().espais[espai] ?? SENSE_AMAGADES;
}

export function subscriuCarpetesVisibles(oient) {
  oients.add(oient);
  return () => { oients.delete(oient); };
}

function desa(noves) {
  cache = normalitzaCarpetesVisibles(noves);
  setVal(CLAU_CARPETES_VISIBLES, cache);
  for (const oient of [...oients]) oient();
  return cache;
}

/**
 * La persona amaga (true) o torna a posar a la vista (false) una carpeta d'un
 * espai. Un espai o un id no vàlids, o un espai o una carpeta de més enllà
 * dels límits, no canvien res.
 */
export function desaCarpetaAmagada(espai, id, amagada) {
  const actuals = llegeixCarpetesVisibles();
  const clau = String(id ?? '');
  if (!esEspaiValid(espai) || !esIdValid(clau)) return actuals;
  const delEspai = actuals.espais[espai] ?? SENSE_AMAGADES;
  const jaHiEra = delEspai[clau] === false;
  if (Boolean(amagada) === jaHiEra) return actuals;
  if (amagada) {
    const espaiNou = !Object.prototype.hasOwnProperty.call(actuals.espais, espai);
    if (espaiNou && Object.keys(actuals.espais).length >= ESPAIS_MAXIMS) return actuals;
    if (Object.keys(delEspai).length >= AMAGADES_MAXIMES) return actuals;
  }
  const amagades = Object.assign(mapaBuit(), delEspai);
  if (amagada) amagades[clau] = false;
  else delete amagades[clau];
  const espais = Object.assign(mapaBuit(), actuals.espais);
  if (Object.keys(amagades).length) espais[espai] = amagades;
  else delete espais[espai];
  return desa({ v: VERSIO, espais });
}

/** Només per a proves: oblida la còpia en memòria (no toca l'emmagatzematge). */
export function _reiniciaCarpetesVisibles() {
  cache = null;
}
